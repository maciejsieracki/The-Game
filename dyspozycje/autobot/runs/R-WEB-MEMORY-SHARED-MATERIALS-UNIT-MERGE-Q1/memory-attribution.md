# R-WEB-MEMORY-SHARED-MATERIALS-UNIT-MERGE-Q1: pomiary (runda 1)

## (A) Wspólne materiały bez zmiany obrazu: WDROŻONE
Przyczyna 51 px z R-WEB-MEMORY-STATIC-FOOTPRINT-Q1 potwierdzona: three.js r169 sortuje nieprzezroczyste obiekty
`painterSortStable` (groupOrder → renderOrder → **material.id** → z → object.id). Wspólny materiał ma id pierwszego
modelu, więc zmienia się kolejność rysowania współpłaszczyznowych ścian.
Naprawa: `MaterialContentPool` (instancja na renderer, licznik odwołań, kopia przy zapisie `unshare` dla przyciemnienia
odroczenia). Mesh, któremu pula podmieniła materiał, zapamiętuje id dawnego materiału (`__msId`, ważne, dopóki
`mesh.material === __msMat`). `renderer.setOpaqueSort(pooledMaterialOpaqueSort)` (w scene.ts) to dokładna kopia
`painterSortStable` z tym id. Dzięki temu kolejność wywołań rysowania jest taka sama jak bez puli.

Test `memory-static-material-pool-pixel-test` (194 modele: wszystkie kategorie i nazwy, miasta kamień/brąz/Rzym, 2 kolory, pierścienie):
| asercja | wynik |
|---|---|
| bazowa klatka bez puli vs z pulą | **0 / 1 600 000 px** |
| przyciemnienie co 3. jednostki / zdjęcie | 0 / 0 px; po zdjęciu == baza |
| kontrola: pula + domyślne sortowanie | **51 px** (ta sama liczba co w FALA 526: test widzi kolejność) |
| materiały w scenie | 3 038 → 477 |
| picking | identyczny |

Pełna klatka gry (`memory-growth-visual-parity-test`, `?playtest=mapa`, build ca289d8ce vs temat): V1/V2 `any=0`.
Wariant z tolerancją ≤100 px z decyzji właściciela **nie był potrzebny**.

Znaleziony i naprawiony błąd: po puli dwa dawne materiały o tym samym stanie to JEDNA instancja zapisana w
`tokenMaterials` dwa razy. `_applyDeferredDim` zapisywał przy drugim przejściu `dimBase` stanu już przyciemnionego,
więc po zdjęciu przyciemnienia część żetonu zostawała półprzezroczysta (1 291 px w teście M2). Teraz pętla idzie po
`new Set(...)`. Bez puli działa to tak samo jak wcześniej.

### MB po GC, build produkcyjny (minifikacja), seed 4242, Standardowy/kontynenty, mgła OFF, 50 tur
| tura | PRZED ca289d8ce | PO 5e62c515 | Δ | jedn./miasta PRZED → PO |
|---|---|---|---|---|
| 1 | 221,2 | 212,8 | **−8,4** | 48/42 → 48/42 |
| 10 | 224,8 | 222,9 | −1,9 | 64/42 → 64/42 |
| 30 | 238,2 | 236,3 | −1,9 | 82/49 → 81/49 |
| 40 | 267,6 | 264,7 | −2,9 | 204/72 → 208/72 |
| 50 | 308,5 | 302,6 | **−5,9** | 417/76 → 419/76 |

Unikalne materiały (sonda): t.1 jednostki 888 → 64, miasta 473 → 34; t.50 jednostki 7 141 → 188, miasta 1 747 → 135.
`renderer.info` t.50: draw calls 1 192 → 1 191, programy 36 → 37 (bez zmian istotnych).
Stała sterta V8 w Node (475 żetonów t.100, `memory-static-unit-merge-prototype` część 1, **poprawione w r2**): 67,01 → 60,19 MB (**−6,8 MB**).
Liczba z r1 (69,31 → 51,07, −18,2 MB) jest WYCOFANA: stara metoda (jeden proces, tryby po kolei, równoległy GC) jest bimodalna
(mat = 51,06 albo 60,26 MB, skok ~9,2 MB; Evaluator trafił 60,25 → −9,05 MB). r2: każdy tryb w osobnym procesie z `--single-threaded-gc`,
5 powtórzeń × 2 przebiegi, rozrzut ≤ 0,02 MB dla geo/mat (log `gate-memory-static-unit-merge-prototype.txt`).
Szum: zysk w grze nie rośnie liniowo z liczbą żetonów (t.1 −8,4, t.30 −1,9). Powtarzalności PRZED-vs-PRZED nie
zmierzono (NIE_ZMIERZONO). Z jednego przebiegu na stronę różnice mniejsze niż ~3 MB traktuję jako szum.

## (B) Scalanie statycznych części jednostek: PROTOTYP, NIE WDROŻONE
Na mapie części żetonów nie są animowane: ruch i atak przesuwają cały korzeń (`setTokenWorldPosition`), a picking
idzie w górę do `userData.unitId`. Blokadą nie są więc animacje ani picking, tylko piksele i LOD drobnych części.
`memory-static-unit-merge-prototype` (meshe o tym samym materiale po puli, wyznacznik > 0, `mergeGeometries`, scalone geometrie w puli):
| miara | bez scalenia | ze scaleniem |
|---|---|---|
| sterta Node, 475 żetonów (r2, izolowany pomiar) | 60,19 MB (geo+mat) | 21,41 MB (**−38,8 MB**; −45,6 MB względem samej puli geometrii 67,01) |
| meshe na żeton | 62,6 | 14,8 |
| draw calls (170 modeli) | 11 106 | 2 720 |
| piksele stanie / marsz / atak | 0 | **52 / 101 / 5** z 1,6 mln |
| picking (stanie, marsz) | 170/170 | ten sam |

Różnice pikseli wynikają z innego zaokrąglenia wierzchołków przeliczonych na CPU w porównaniu z macierzą modelu na
GPU oraz z innej kolejności rysowania. Do tego `SmallPartLod` chowa drobne meshe pojedynczo, a po scaleniu drobne
części zostałyby widoczne przy oddaleniu. Dispatch wymaga zgodności bit w bit, a tolerancja ≤100 px dotyczy tylko
(A). Dlatego (B) zostaje jako zmierzony prototyp i wymaga decyzji właściciela (zysk ~39 MB sterty Node przy 475 żetonach
ponad (A) i ~4× mniej draw calls, kosztem do ~100 px oraz zmiany LOD). r1 podawało tu −29,8 MB: to łączyło niski
tryb bimodalnego pomiaru (51,07) z wynikiem scalenia; poprawione w r2.
