# DYSPOZYCJA GRAFIKA-3D — partia 1: koń (3 zastosowania) + pastwisko ROBLOX
(MASTER, 2026-07-08 · styl zatwierdzony przez Macieja · wykonawca: CODE-INTEGRATOR · po domknięciu D1+D3 i SYNC-PANELI, na „start GRAFIKA-3D")

## Pliki źródłowe (gotowe, tsc --strict = 0; interfejs jak modele gry: Group, MeshLambert flatShading, przód=+x, spód nóg y=0)
- `gra-robocza/_sandbox/MASTER/render-kon/kon-nowy-model.ts` — nowy koń `buildHorse()` + jeździec (opcjonalny, z nogami `addRiderLegs`) + poprawka lancy (snippet w komentarzu na końcu pliku). Rendery obok.
- `gra-robocza/_sandbox/MASTER/render-zwierzeta/pastwisko-modele.ts` — `buildKrowa` (2 pozy / łaciata+brązowa), `buildOwca` (2 pozy / biała+czarna), `buildLama` + `PASTWISKO_LAYOUT` + `buildPastwiskoZwierzeta(hexR)`. Rendery obok.

## KOŃ — trzy OSOBNE zastosowania (uwaga Macieja: nie mylić!)
1. **KONNICA (token jednostki)** = koń + JEŹDZIEC z lancą. Wpięcie: `gra/src/render/units.ts:691` — podmiana `buildHorse()` (stałe BH_* od :686). `horseBackY` 0.2724→0.296 propaguje się przez wartość zwracaną. Poprawka lancy: `units.ts:5138–5156` wg snippetu (grot + proporczyk na osi drzewca — dziś latają obok konia).
2. **KONIE NA MAPIE (złoże/dekoracja terenu)** = **SAM KOŃ, BEZ JEŹDŹCA** (`buildHorse()` bez montowania ridera; ~380 tri). Namierz w `gra/src/render/` gdzie renderowane jest złoże/nakładka koni (grep: `kon|konie|horse|ZlozeKoni` w `robloxImprovements.ts` registry BUILDERS i `styleResources.ts` przy nakładkach złóż, wzorzec jak `ZlozeBydla`). Ustaw 2 konie w slotach na obrzeżu heksa wg wzorca PASTWISKO_LAYOUT (środek r0.40 ZAWSZE wolny pod przyszły budynek — stajnia/zagroda); różne rotY, jeden może być wariantem maści (parametr koloru sierści jest w modelu).
3. **RYDWAN / ONAGER** = koń z uprzężą: wywołania `units.ts` ~:5320 (rydwan) i ~:2230 (onager) — nowa funkcja obsługuje przez parametr `mHarn`.

## PASTWISKO (bydło/owce/lama)
- Registry: `gra/src/render/robloxImprovements.ts:376` — klucze `bydlo`/`pastwisko` → `buildPastwiskoZwierzeta`, `lama` → `buildLama`.
- Nakładki złóż: `gra/src/render/styleResources.ts:396–401` — `Nakladka.ZlozeBydla` → krowy w slotach layoutu; owce pod złożem owiec (instrukcja w nagłówku pastwisko-modele.ts).
- Skala S=2.05/3, y=0 — zgodne z grą, bez przeliczeń. Środek heksa (r0.40) zawsze wolny — rezerwa pod farmę.

## Poziomy jakości grafiki (decyzja Macieja: stopniujemy LICZBĄ, nie detalem siatki)
- WYSOKA = pełne sloty (pastwisko: 5 zwierząt; konie: 2),
- NORMALNA = podzbiór (pastwisko: np. krowaA+owcaA+lama; konie: 1),
- NISKA = 1 zwierzę lub sama nakładka złoża.
Wybór slotów z PASTWISKO_LAYOUT wg ustawienia jakości gracza (podepnij pod istniejący system niska/normalna/wysoka).

## PARTIE 2 + 3A + 3B (dołączone do tego samego zlecenia GRAFIKA-3D; szczegóły wpięcia = nagłówki plików TS)
Wszystko w `gra-robocza/_sandbox/MASTER/render-ulepszenia/` (rendery obok, stare vs nowe + tri):
- **P2** `ulepszenia-modele-p2.ts` — buildFarma (2 warianty; pastwiskowy mieści się w r0.40), buildKopalnia, buildKamieniolom, buildTartak, buildZagrodaDodatki + ULEPSZENIA_P2_LAYOUT. Registry: farma/kopalnia/kamieniolom/tartak/popalnia_brazu(alias) + FoodStack :411.
- **P3A** `ulepszenia-modele-p3a.ts` — buildWyrab, buildObozLowiecki, buildGlinianka, buildWarzelniaSoli, buildLodzieRybackie (y-pływanie zgodne z improvementMeshPlacement main.ts:4224), buildStadnina (stajnia + korral + 2 konie z kon-nowy-model bez jeźdźca; import buildHorse!). Registry: stadnina:383 (dziś alias bydła!), oboz_lowiecki:386, wyrab:387 (spawnClearingMesh main.ts:4266 łapie automatycznie), glinianka:391, lodzie_rybackie:393, warzelnia_soli:394.
- **P3B** `ulepszenia-modele-p3b.ts` — buildIrygacja (468 tri, było 792), buildPoleIrygowane (480, było 1000), buildFort(ownerCol)/buildPosterunek(ownerCol) — interfejs koloru gracza zachowany 1:1, buildDroga*/Brukowana (footprint identyczny ze starymi, tylko wygląd), złoża miedź/żelazo/węgiel/sól/glina (~216 tri, środek heksa wolny pod kopalnię) + buildZlozeKlaster. Registry :377-:396 + styleResources :390–415 + rebuildResourceOverlays main.ts ~:1026.
- **DECYZJA MASTERA — stadnina (1176 tri > budżet):** stopniowanie liczbą koni wg jakości: NISKA/NORMALNA = 1 koń (~800 tri), WYSOKA = 2 konie. Stadnina jest rzadka na mapie — akceptowalne.
- FoodStack farma+irygacja: złożenie buildIrygacja + buildFarma(P2) po stronie integratora (wskazówki w nagłówku P3B).

## WYMÓG SKALI (Maciej, 2026-07-08 — obowiązuje przy wpięciu KAŻDEGO modelu)
Zasoby/zwierzęta/ulepszenia to DRUGOPLANOWE elementy mapy — nowe modele mają mieć na mapie GABARYT ZBLIŻONY do obecnych ikon (porównaj bounding-box starego i nowego przy wpinaniu; wysokość/średnica ±20%). W szczególności: **FORT z P3B wrócić do miniaturowej skali starego rbxFort (~1/3)** — subagent zrobił go pełnowymiarowym; przeskalować przy wpięciu. Liczba trójkątów bez zmian — chodzi wyłącznie o rozmiar na heksie.

## KOMPLETNOŚĆ (audyt MASTERA vs inwentarz registry)
Przerobione: droga, droga_brukowana, farma, bydło, owce, lama, stadnina, kopalnia (+popalnia_brazu aliasem — świadomie), kamieniołom, obóz łowiecki, wyrąb, tartak, irygacja, pole irygowane, glinianka, łodzie rybackie, warzelnia soli, fort, posterunek, pastwisko + złoża nakładkowe (miedź/żelazo/węgiel/sól/glina/koń). **Jedyny brak: TARASY** (buildStyleTarasyTerrace, mapRenderStyle.ts:962) — ZAPARKOWANE do partii „teren naturalny" (góry/wzgórza), bo to element stoków i tam ma kontekst.

## PARTIA TEREN (góry + wzgórza) — ZATWIERDZONA przez Macieja 2026-07-09
Plik: `gra-robocza/_sandbox/MASTER/render-teren/teren-gory-wzgorza.ts` (tsc --strict=0; rendery obok) → skopiuj do `gra/src/render/`.
Zawartość: `buildWzgorze(0..4)` / `buildGora(0..4)` (10 zmergowanych BufferGeometry, vertex colors, 1 wspólny materiał; 82–144 tri vs stare 276–288), `wariantDlaHeksa(q,r,n)` + `rotacjaDlaHeksa(q,r)` (deterministyczne, ta sama arytmetyka imul co hash2D).
Wpięcie — DWA ETAPY (zrób oba):
1. **Minimalne (bezpieczne):** podmień ciała `buildStyleMountainPeak` (`gra/src/render/mapRenderStyle.ts:752`) i `buildStyleHillBump` (`:977`) na mesh z `goraGeometria`/`wzgorzeGeometria` + rotacja z `rotacjaDlaHeksa`; ciało `styleMountainPeakSurfaceY` → lookup `GORA_APEX_Y[wariant]` (grep potwierdził 0 innych użyć — ZWERYFIKUJ ponownie przed edycją).
2. **Docelowe (wydajność — to jest połowa wartości tej partii):** `gra/src/render/scene.ts` gałęzie Góry ~:1573 / Wzgórza ~:1607 → **10 InstancedMesh** (po 1 na wariant) wg wzorca istniejącego `hillBumpMesh`/`peakMesh` (hexKey+origMatrix; fog/tint per heks przez `instanceColor`, materiał wspólny). Efekt: 1 draw call na wariant zamiast 12–14 meshy na heks.
ZAKAZY: `map/gen*` NIETKNIĘTE (hash mapy!); `TERRAIN_SURFACE_Y` (mapRenderStyle.ts:134) i relief jednostek (`units.ts:64`) NIETKNIĘTE — plateau wzgórz = 0.392, apeksy gór w widełkach starych (already w modelach).
Bramka dodatkowa terenu: hashe kontrolne mapy BEZ ZMIAN (małe ziemia/42=4284176530, standard ziemia/42=682095284) + jednostka na wzgórzu stoi na poprawnej wysokości + mgła/fog działa na nowych meshach.
TARASY: zaparkowane — wejdą na stoki W0/W3 osobną partią po tej.

## Bramki i kolejność (CAŁOŚĆ GRAFIKA-3D — zaktualizowane 2026-07-09)
1. **Commity per partia** (5: koń+pastwisko / P2 budynki / P3A osady / P3B woda-wojsko-drogi-złoża / TEREN góry-wzgórza; opisy PL, bez dat) → **JEDEN wspólny build i deploy na końcu** (mniej podmian, jeden test Macieja).
2. Bramki buildu: tsc --noEmit = 0 · vite build BEZPOŚREDNIO (bez prebuildu — pułapka export-data!) · „nic nie stracone" vs poprzedni bundle · hashe mapy bez zmian · stempel host-side na deployu · WERSJE.md · hub.
3. WYMÓG SKALI przy każdym modelu (sekcja wyżej): gabaryt jak stare ikony ±20%; FORT przeskalować do ~1/3.
4. Test wizualny Macieja po deployu: (a) konnica — lanca w dłoni, (b) złoże koni — konie bez jeźdźców, (c) pastwisko z farmą + heks bydła/owiec, (d) kopalnia/kamieniołom/tartak/wyrąb/obóz/glinianka/warzelnia/łodzie/stadnina, (e) irygacja+pole, fort (mały!)/posterunek w kolorach graczy, drogi, złoża, (f) GÓRY i WZGÓRZA: 5+5 sylwetek, pasmo różnorodne, jednostka na wzgórzu, płynność pan/zoom przy masywach, (g) trzy poziomy jakości (liczba dekoracji; stadnina 1/2 konie).
5. Meldunek w kanale ze stemplem + zdanie o panelach (reguła §8 — ta partia danych balansu nie dotyka).
