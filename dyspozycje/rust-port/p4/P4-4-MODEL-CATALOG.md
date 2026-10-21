# P4.4 — Katalog modeli 3D do odtworzenia w Rust

**Temat:** `R-RUSTPORT-P4-4-MODEL-CATALOG-Q1` · **Domena:** GAME · **Rola:** Operator, runda 1/5 (Opus 5.5 medium, wyjątek graficzny R-PROC-AUTOBOT §5a)
**Pin web (tylko odczyt):** `edb8fb56`. Odczyt wyłącznie przez `git show edb8fb56:<ścieżka>`, `git grep … edb8fb56 -- …` i `git ls-tree`.
**Baza dokumentu:** gałąź `claude/sprawdzenie-funkcjonalnosci-ek4ra0` @ `dc4cfdb4`.
**Zakres:** odczyt i projekt. Nie powstał żaden kod. Nie uruchamiano buildu, `npm` ani weba. Nie zmieniono `gra/**`, `rust-port/**` ani `src-tauri/**`.
**Wejście:** `p4/P4-0-RENDERER-ARCHITECTURE.md` (§1.2–§1.4, §6), `p1/P1-11-ASSET-CATALOG.md` (§5), `p1/P1-14-GAMEPLAY-CATALOG.md` (§1, wiersz INF-RENDER).

**Legenda dowodów.** „cmd → wynik” to komenda z wklejonym wynikiem. `plik:linia` odnosi się do blobu `edb8fb56`. `NIE_ZMIERZONO` znaczy, że czegoś nie sprawdzono i nie wnioskuję tego z nazw. Skrypty pomocnicze to Python bez stanu, czytający `git show`/`git grep` na pinie. Nie są artefaktem repo, a ich reguły zliczania opisuje §0.2.

---

## 0. Liczby kontrolne i metoda

### 0.1 Zbiór plików (kryterium 100%)

| Pomiar | Komenda | Wynik |
|---|---|---:|
| Pliki `render/**` | `git ls-tree -r --name-only edb8fb56 -- gra/src/render \| wc -l` | **88** |
| Pliki `render/**` importujące three | `git grep -l -E "from ['\"]three" edb8fb56 -- gra/src/render \| wc -l` | **80** |
| Pliki three poza `render/` w `gra/src` | `git grep -l -E "from ['\"]three" edb8fb56 -- gra/src \| grep -v '/render/' \| wc -l` | **8** |
| Linie `render/**` | suma `git show` (skrypt `inv.py`) | **59 319** |
| Linie 8 plików poza `render/` | j.w. (w tym `main.ts` 39 350) | **62 722** (bez `main.ts`: **23 372**) |

Uściślenie sformułowania z dispatchu „88 w `render/` i 8 poza nim”: w `render/` jest 88 plików, z czego 80 importuje three. Poza `render/` import three ma 8 plików. Łącznie three importuje 88 plików `gra/src`, co zgadza się z P1-11 §5. Inwentarz §1 obejmuje **96 plików**: wszystkie 88 z `render/` (także 8 bez importu three, bo są zależnościami modeli) oraz 8 spoza `render/`.

Osobno, **poza zakresem `gra/src`**: `git grep -l -E "from ['\"]three" edb8fb56 -- gra | grep -v 'gra/src/'` zwraca **36 plików**. Są to 1 backup (`gra/_backup/units.ts.TRUNC-as-found-b6`), 1 strona podglądu (`gra/podglad-sektory/main.ts`) i 34 narzędzia/testy w `gra/tools/**` (`*-real-render-test.cjs`, `.zeton-*`, `.kamien-*-preview-entry.ts`). To nie są modele gry, tylko konsumenci modeli. Decyzja: **D-MOD-7**.

### 0.2 Reguły zliczania (anty-halucynacja)

- **R1 — buildery:** linie pasujące do `^\s*(export\s+)?(async\s+)?function\s+(build|make|create)[A-Z0-9_]\w*` albo `const (build|make|create)X = (…) =>`. Liczę deklaracje funkcji budujących, a nie wywołania. Zawyża o funkcje pomocnicze (`buildBaseAvatar`, `buildNamedUnit`, `buildCategoryModel`). Zaniża przy modelach budowanych bez prefiksu build/make, np. `egyptianPyramid()` w `wonderModels.ts`, `rbxFort()` w `robloxImprovements.ts`, `case 'osadnik'` w `units.ts`. Dlatego **liczba modeli** w §2 pochodzi z dispatchu (`switch`/`BUILDERS`/reguły nazw), a R1 służy tylko jako wskaźnik rozmiaru.
- **R2 — helpery prymitywów:** wywołania `(add)?(box|cyl|cone|sph|torus|lathe|prism|part)…(` poza `…Geometry(`. Pliki „miast/ulepszeń/cudów Roblox” budują bryły przez lokalne helpery (`box(g,…)`, `addBox(…)`), więc mają mało `new BoxGeometry`. R2 pokazuje ich realną objętość.
- **R3 — prymitywy:** liczba wystąpień `new (THREE.)?<Prymityw>\b` w pliku. Suma R3 zgadza się z `git grep -c` (zliczanie linii) w §1.2: Box 1450 = 1450, Mesh 2394 = 2394, Cyl 381 wystąpień przy 379 liniach, bo dwie linie mają po dwa wystąpienia.
- **Importerzy:** liczba plików `gra/src/**/*.ts` z importem (`from`/`import(`) danego pliku `render/`. Pętle samo-importu, czyli fałszywe trafienia z komentarzy (`miasto-braz.ts`, `miasto-kamien.ts`, `pastwisko-modele.ts`, `swinia-trzoda.ts`, `ulepszenia-modele-p*.ts`), są odfiltrowane.

### 0.3 Odchylenie od dispatchu

Dispatch wskazuje `rust-port/engine/data` jako źródło nazw. **Katalog nie istnieje** na `dc4cfdb4` (`ls rust-port/engine` → `Cargo.toml src tests`). Pokrycie (§2) liczę więc z danych web na pinie: `gra/data/units.json` (75 rekordów), `gra/data/buildings.json` (42), `gra/data/wonders.json` (`cuda` 19 + `parkowane_epoka4plus` 5, `panstwa` 15), `gra/data/terrain-improvements.json` (22 klucze). Odczyt przez `git show edb8fb56:gra/data/<plik>.json`.

---

## 1. Inwentarz plików (zadanie 1)

### 1.1 Tabela 96 plików

Kategorie: **JED** jednostka · **STA** statek · **MIA** miasto · **CUD** cud · **ULE** ulepszenie/zasób · **DEK** dekoracja terenu (oraz wioska i obóz barbarzyńców) · **OBL** obóz oblężniczy · **OVL** UI-overlay na mapie · **INF** infrastruktura · **MRT** martwy kod · **BIT** bitwa 3D · **PODGL** podgląd poza mapą.
Kolumna „three”: T = importuje `three`. Kolumna R3 używa skrótów: Box/Cyl/Cone/Sph/Tor/Pln/Circ/Ring/Extr/Shape/Tube/Oct/Dod/Ico/BufG(BufferGeometry)/Inst(InstancedMesh)/CTex(CanvasTexture)/Spr(Sprite)/SprM/Line/LSeg/MStd/MLam/MBas (materiały Standard/Lambert/Basic)/merge (`mergeGeometries`).

| # | Plik (`gra/src/…`) | LOC | three | Kat. | Buildery `build/make/create` (R1) | `new Mesh` | Wywołania helperów prymitywów (R2) | `new <Prymityw>` (R3) | Importerzy w `gra/src` |
|---:|---|---:|:-:|:-:|---:|---:|---:|---|---:|
| 1 | `render/braz-konnica-opus5.ts` | 934 | T | JED | 2 | 49 | 0 | Box46 Cyl11 Cone2 Sph1 Tor1 Ico2 BufG1 MStd1 | 1 |
| 2 | `render/braz-lucznik-nubijski-opus5.ts` | 775 | T | JED | 2 | 48 | 0 | Box41 Cyl2 Cone1 MStd1 | 1 |
| 3 | `render/braz-miecznik-opus5.ts` | 765 | T | JED | 3 | 56 | 0 | Box46 Cyl6 Cone1 Sph1 BufG1 MStd1 | 1 |
| 4 | `render/braz-procarz-opus5.ts` | 766 | T | JED | 2 | 45 | 0 | Box32 Cyl2 Oct2 MStd1 | 1 |
| 5 | `render/braz-rydwan-kapadokijski-opus5.ts` | 781 | T | JED | 1 | 45 | 0 | Box29 Cyl14 Cone1 MStd1 | 1 |
| 6 | `render/braz-rydwan-konny-opus5.ts` | 784 | T | JED | 1 | 48 | 0 | Box29 Cyl16 Cone2 Ico2 MStd1 | 1 |
| 7 | `render/braz-rydwan-woly-opus5.ts` | 620 | T | JED | 1 | 43 | 0 | Box29 Cyl9 Cone2 MStd1 | 1 |
| 8 | `render/braz-taran-opus5.ts` | 492 | T | JED | 1 | 39 | 0 | Box21 Cyl16 MStd1 | 1 |
| 9 | `render/braz-wlocznik-opus5.ts` | 711 | T | JED | 2 | 43 | 0 | Box39 Cyl8 Cone1 Sph1 BufG1 MStd1 | 1 |
| 10 | `render/bronzeCity.ts` | 464 | T | MIA | 1 | 89 | 6 | Box48 Cyl25 Cone8 Sph4 Tor1 Ring3 MLam2 | 8 |
| 11 | `render/bronzeCityRoblox.ts` | 437 | T | MIA | 1 | 3 | 72 | Box1 Cyl1 Extr1 MLam1 | 1 |
| 12 | `render/camera.ts` | 309 | T | INF | 0 | 0 | 0 | — | 1 |
| 13 | `render/cities.ts` | 946 | T | MIA | 2 | 7 | 0 | Box3 Cyl2 Cone2 CTex1 Spr1 MLam1 SprM1 | 1 |
| 14 | `render/cityMapOutline.ts` | 85 | T | OVL | 2 | 0 | 0 | BufG1 | 1 |
| 15 | `render/cityMapStatChip.ts` | 1133 | T | OVL | 4 | 0 | 0 | CTex1 Spr1 SprM1 | 2 |
| 16 | `render/cityOkolicaOverlay.ts` | 347 | T | OVL | 2 | 0 | 0 | CTex1 Spr1 SprM1 | 1 |
| 17 | `render/countSceneOverlayCandidates.ts` | 124 | – | INF | 1 | 0 | 0 | — | 0 |
| 18 | `render/dekor-laki-rowniny.ts` | 463 | T | DEK | 2 | 2 | 0 | BufG1 MLam1 | 1 |
| 19 | `render/djungla-modele.ts` | 218 | T | DEK | 0 | 0 | 4 | BufG1 MLam1 | 1 |
| 20 | `render/droga-6-ramion.ts` | 190 | T | ULE | 1 | 2 | 0 | Box1 Cyl1 MLam1 | 2 |
| 21 | `render/fogDim.ts` | 44 | T | INF | 0 | 0 | 0 | — | 3 |
| 22 | `render/galera-model.ts` | 273 | T | STA | 2 | 31 | 28 | Box1 Cone3 MStd1 | 1 |
| 23 | `render/hastati-falangita.ts` | 694 | T | JED | 5 | 35 | 0 | Box28 Cyl4 Cone2 Ring1 BufG2 MStd1 | 1 |
| 24 | `render/hastati-opus5.ts` | 993 | T | JED | 5 | 63 | 0 | Box44 Cyl13 Cone3 BufG3 MStd1 | 1 |
| 25 | `render/hexShape.ts` | 32 | T | INF | 0 | 0 | 0 | — | 1 |
| 26 | `render/hexutil.ts` | 71 | – | INF | 0 | 0 | 0 | — | 55 |
| 27 | `render/improvements.ts` | 602 | T | ULE | 3 | 4 | 80 | Box1 Cyl1 Cone1 Sph1 MLam1 | 10 |
| 28 | `render/jednostki-p1-rdzen.ts` | 833 | T | JED | 9 | 62 | 0 | Box5 Cyl8 Cone7 BufG1 MStd1 | 1 |
| 29 | `render/jednostki-p2-inka.ts` | 685 | T | JED | 5 | 48 | 0 | Box39 Cone1 MStd1 | 1 |
| 30 | `render/jednostki-p3-dystans.ts` | 879 | T | JED | 6 | 57 | 0 | Box40 Cyl2 Cone2 BufG2 MStd1 | 1 |
| 31 | `render/jednostki-p4-melee.ts` | 866 | T | JED | 7 | 73 | 0 | Box42 Cyl9 Cone3 BufG1 MStd1 | 1 |
| 32 | `render/jednostki-p57-wlocznie-machiny.ts` | 840 | T | JED | 5 | 77 | 0 | Box36 Cyl3 Cone2 BufG2 MStd1 | 1 |
| 33 | `render/jednostki-p6-super.ts` | 911 | T | JED | 3 | 44 | 0 | Box35 Cyl5 Cone2 Ring1 BufG2 MStd1 | 1 |
| 34 | `render/jednostki-p8a-bliskiwschod.ts` | 704 | T | JED | 5 | 51 | 0 | Box35 Cyl6 Cone1 Tor1 BufG2 MStd1 | 1 |
| 35 | `render/jednostki-p8b-rozni.ts` | 794 | T | JED | 5 | 60 | 0 | Box44 Cyl4 Cone2 BufG2 MStd1 | 1 |
| 36 | `render/jednostki-z1-mezopotamia.ts` | 1329 | T | JED | 5 | 64 | 0 | Box1 Cyl4 Cone3 BufG2 MStd1 | 1 |
| 37 | `render/jednostki-z2-srodziemne.ts` | 1604 | T | JED | 6 | 85 | 0 | Box43 Cyl11 Cone2 BufG2 MStd1 | 1 |
| 38 | `render/jednostki-z3-plemiona.ts` | 1994 | T | JED | 6 | 89 | 0 | Box59 Cyl8 Cone4 BufG2 MStd1 | 1 |
| 39 | `render/kamien-bazowe-opus5.ts` | 1190 | T | JED | 9 | 118 | 0 | Box4 Cyl2 Cone1 BufG1 MStd1 | 1 |
| 40 | `render/kamien-inka-opus5.ts` | 928 | T | JED | 3 | 76 | 0 | Box56 Cyl10 Cone2 MStd1 | 1 |
| 41 | `render/kamien-lucznicy-opus5.ts` | 986 | T | JED | 3 | 64 | 0 | Box54 Cone1 MStd1 | 1 |
| 42 | `render/kamien-zulu-taran-opus5.ts` | 1130 | T | JED | 3 | 77 | 0 | Box46 Cyl25 Cone2 Circ1 BufG2 MStd1 | 1 |
| 43 | `render/kon-nowy-model.ts` | 342 | T | JED | 2 | 18 | 0 | Box12 Cyl8 Cone1 Ico2 MStd1 | 3 |
| 44 | `render/kopalnia-cyny-opus5.ts` | 352 | T | ULE | 1 | 3 | 5 | Box1 Cyl1 MStd1 | 2 |
| 45 | `render/kopalnia-zlota-opus5.ts` | 350 | T | ULE | 1 | 4 | 6 | Box1 Cyl1 MStd1 | 2 |
| 46 | `render/lasy-modele.ts` | 440 | T | DEK | 1 | 1 | 7 | BufG1 MLam1 | 1 |
| 47 | `render/mapRenderStyle.ts` | 1996 | T | DEK | 14 | 39 | 0 | Box21 Cyl23 Cone3 Ico2 MLam2 | 16 |
| 48 | `render/mergeDecor.ts` | 175 | T | INF | 1 | 1 | 0 | BufG1 MLam1 | 2 |
| 49 | `render/miasto-braz.ts` | 905 | T | MIA | 5 | 9 | 0 | Box1 Cyl1 Cone1 Circ6 MLam3 | 1 |
| 50 | `render/miasto-kamien.ts` | 667 | T | MIA | 3 | 6 | 0 | Box1 Cyl1 Cone1 Circ3 MLam2 | 2 |
| 51 | `render/minecraftScene.ts` | 11 | – | MRT | 1 | 0 | 0 | — | 0 |
| 52 | `render/oaza-pustynia.ts` | 578 | T | DEK | 2 | 3 | 0 | Box1 BufG2 MLam2 | 1 |
| 53 | `render/pastwisko-modele.ts` | 261 | T | ULE | 6 | 1 | 0 | Box1 MLam1 | 3 |
| 54 | `render/perfDebugOverlay.ts` | 76 | – | OVL | 0 | 0 | 0 | — | 1 |
| 55 | `render/rangeOverlay.ts` | 909 | T | OVL | 8 | 3 | 0 | Cyl1 BufG4 Inst1 LSeg1 MBas4 | 2 |
| 56 | `render/resources.ts` | 171 | T | ULE | 2 | 26 | 0 | Box20 Cyl1 Cone1 Sph1 Tor1 Dod2 MLam1 | 1 |
| 57 | `render/riverLod.ts` | 413 | T | DEK | 5 | 1 | 0 | merge1 | 1 |
| 58 | `render/robloxCity.ts` | 294 | T | MIA | 2 | 16 | 17 | Box7 Cyl5 Cone3 Ico1 MLam2 | 2 |
| 59 | `render/robloxImprovements.ts` | 484 | T | ULE | 2 | 11 | 63 | Box2 Cyl3 Cone6 MLam1 | 2 |
| 60 | `render/robloxScene.ts` | 12 | – | MRT | 1 | 0 | 0 | — | 0 |
| 61 | `render/scene.ts` | 3760 | T | INF | 6 | 3 | 0 | Box1 Cyl8 Cone9 Sph4 Pln1 BufG3 Inst19 MLam17 merge1 | 5 |
| 62 | `render/settlementModel.ts` | 27 | T | MIA | 1 | 0 | 0 | — | 2 |
| 63 | `render/siegeCampModels.ts` | 160 | T | OBL | 5 | 15 | 0 | Box6 Cyl6 Cone1 Sph2 MLam1 | 1 |
| 64 | `render/siegeCampSync.ts` | 47 | – | OBL | 0 | 0 | 0 | — | 1 |
| 65 | `render/siegeMarker.ts` | 262 | T | OBL | 0 | 2 | 0 | Cyl1 Ring1 CTex1 Spr1 MBas2 SprM1 | 1 |
| 66 | `render/stoneCity.ts` | 387 | T | MIA | 5 | 35 | 0 | Box15 Cyl14 Cone5 Sph1 MLam2 | 2 |
| 67 | `render/stoneCityRoblox.ts` | 471 | T | MIA | 5 | 3 | 42 | Box1 Cyl1 Extr1 MLam1 | 1 |
| 68 | `render/styleResources.ts` | 499 | T | ULE | 3 | 15 | 62 | Box2 Cyl2 Cone2 Tor1 Dod5 Ico3 MLam1 | 3 |
| 69 | `render/swinia-trzoda.ts` | 187 | T | ULE | 2 | 2 | 0 | Box1 Cone1 MLam1 | 2 |
| 70 | `render/tarasy-model.ts` | 403 | T | DEK | 1 | 1 | 0 | BufG1 MLam1 | 1 |
| 71 | `render/teren-gory-wzgorza.ts` | 509 | T | DEK | 2 | 3 | 11 | BufG1 MLam1 | 3 |
| 72 | `render/tradeRoutesOverlay.ts` | 101 | T | OVL | 2 | 0 | 0 | BufG1 Line1 | 1 |
| 73 | `render/ulepszenia-modele-p2.ts` | 345 | T | ULE | 5 | 3 | 0 | Box1 Cyl1 Cone1 MLam1 | 1 |
| 74 | `render/ulepszenia-modele-p3a.ts` | 510 | T | ULE | 6 | 4 | 0 | Box1 Cyl1 Cone2 MLam1 | 1 |
| 75 | `render/ulepszenia-modele-p3b.ts` | 571 | T | ULE | 12 | 3 | 0 | Box1 Cyl1 Cone1 MLam1 | 2 |
| 76 | `render/unitOwnerEmblem.ts` | 516 | T | OVL | 0 | 0 | 0 | CTex1 Spr1 SprM1 | 5 |
| 77 | `render/unitStatPlate.ts` | 936 | T | OVL | 5 | 6 | 0 | Pln2 CTex3 MStd1 | 2 |
| 78 | `render/unitUpgradeBadges.ts` | 459 | T | OVL | 1 | 1 | 0 | CTex1 | 3 |
| 79 | `render/unitVeteranBadges.ts` | 294 | T | OVL | 1 | 2 | 0 | Extr1 MStd2 | 1 |
| 80 | `render/unitVitalsPalette.ts` | 89 | – | OVL | 0 | 0 | 0 | — | 2 |
| 81 | `render/units.ts` | 6779 | T | JED | 43 | 342 | 0 | Box285 Cyl45 Sph5 Tor6 Shape2 Tube1 CTex4 Spr4 MStd2 MBas6 SprM4 | 4 |
| 82 | `render/wioska-oboz.ts` | 342 | T | DEK | 2 | 4 | 0 | Box1 Cyl1 Cone1 Circ1 MLam1 | 1 |
| 83 | `render/wonderModels.ts` | 493 | T | CUD | 1 | 4 | 100 | Box1 Cyl2 Cone1 MLam1 | 2 |
| 84 | `render/wonderRenderer.ts` | 143 | T | CUD | 0 | 0 | 0 | — | 1 |
| 85 | `render/workerFieldOverlay.ts` | 211 | T | OVL | 2 | 0 | 0 | CTex1 Spr1 SprM1 | 2 |
| 86 | `render/zelazo-jezdziec-oszczepami-opus5.ts` | 1256 | T | JED | 2 | 52 | 0 | Box43 Cyl13 Cone3 Sph1 Tor3 Ico2 BufG1 MStd1 | 1 |
| 87 | `render/zelazo-konnica-asyryjska-opus5.ts` | 1180 | T | JED | 3 | 55 | 0 | Box45 Cyl12 Cone4 Sph1 Tor2 Ico2 BufG1 MStd1 | 1 |
| 88 | `render/zoomLod.ts` | 220 | – | INF | 0 | 0 | 0 | — | 3 |
| 89 | `battle/battleScene.ts` | 19493 | T | BIT | 5 | 33 | 0 | Box10 Cyl4 Cone7 Sph3 Pln10 Circ3 Ring3 Ico3 BufG3 Inst12 CTex1 Spr1 Line2 MStd8 MLam12 MBas22 SprM1 | n/d |
| 90 | `battle/manualBattle.ts` | 1433 | T | BIT | 2 | 10 | 0 | Box3 Cyl2 Tor1 Pln3 MLam4 MBas5 | n/d |
| 91 | `battle/siegeWall.ts` | 1047 | T | BIT | 11 | 44 | 0 | Box31 Cyl10 Cone3 MStd1 | n/d |
| 92 | `input/picker.ts` | 278 | T | INF | 0 | 0 | 0 | — | n/d |
| 93 | `main.ts` | 39350 | T | INF | 56 | 0 | 0 | — | n/d |
| 94 | `ui/perfTestPanel.ts` | 677 | T | INF | 1 | 0 | 0 | Box1 Inst1 MLam1 | n/d |
| 95 | `ui/unitMiniPreview.ts` | 155 | T | PODGL | 0 | 0 | 0 | — | n/d |
| 96 | `wonderpreview/main.ts` | 289 | T | PODGL | 0 | 2 | 0 | Cyl1 Pln1 CTex1 Spr1 MLam2 SprM1 | n/d |

**Sumy wg kategorii** (z tabeli; skrypt `table.py` sumuje kolumny):

| Kat. | Pliki | LOC | R1 | `new Mesh` |
|---|---:|---:|---:|---:|
| JED | 30 | 33 545 | 155 | 2 026 |
| STA | 1 | 273 | 2 | 31 |
| MIA | 9 | 4 598 | 25 | 168 |
| CUD | 2 | 636 | 1 | 4 |
| ULE | 12 | 4 522 | 44 | 78 |
| DEK | 9 | 5 362 | 29 | 54 |
| OBL | 3 | 469 | 5 | 17 |
| OVL | 12 | 5 156 | 27 | 12 |
| INF w `render/` | 8 | 4 735 | — | — |
| MRT | 2 | 23 | 2 | 0 |
| **Razem `render/**`** | **88** | **59 319** | | |
| BIT | 3 | 21 973 | 18 | 87 |
| INF poza `render/` (`main.ts`, `picker.ts`, `perfTestPanel.ts`) | 3 | 40 305 | — | — |
| PODGL | 2 | 444 | 0 | 2 |
| **Razem** | **96** | **122 041** | | |

Kontrola: 33 545+273+4 598+636+4 522+5 362+469+5 156+4 735+23 = **59 319**, co zgadza się z §0.1.

### 1.2 Prymitywy Three.js — sumy (`git grep -c`, linie i pliki)

Komenda dla każdego wiersza: `git grep -c -E '<wzorzec>' edb8fb56 -- gra/src/render` (kolumna 3) i `… -- gra/src/battle gra/src/input/picker.ts gra/src/main.ts gra/src/ui/perfTestPanel.ts gra/src/ui/unitMiniPreview.ts gra/src/wonderpreview/main.ts` (kolumna 4). W nawiasie podaję liczbę plików z trafieniem.

| Prymityw | wzorzec `-E` | `render/**` linie (pliki) | 8 plików poza `render/` linie (pliki) |
|---|---|---:|---:|
| BoxGeometry | `new (THREE\.)?BoxGeometry\(` | 1450 (57) | 45 (4) |
| CylinderGeometry | `new (THREE\.)?CylinderGeometry\(` | 379 (53) | 17 (4) |
| ConeGeometry | `new (THREE\.)?ConeGeometry\(` | 107 (47) | 10 (2) |
| SphereGeometry | `new (THREE\.)?SphereGeometry\(` | 21 (12) | 3 (1) |
| TorusGeometry | `new (THREE\.)?TorusGeometry\(` | 16 (8) | 1 (1) |
| PlaneGeometry | `new (THREE\.)?PlaneGeometry\(` | 3 (2) | 14 (3) |
| CircleGeometry | `new (THREE\.)?CircleGeometry\(` | 11 (4) | 3 (1) |
| RingGeometry | `new (THREE\.)?RingGeometry\(` | 6 (4) | 3 (1) |
| ExtrudeGeometry | `new (THREE\.)?ExtrudeGeometry\(` | 3 (3) | 0 (0) |
| LatheGeometry | `new (THREE\.)?LatheGeometry\(` | 0 (0) | 0 (0) |
| ShapeGeometry | `new (THREE\.)?ShapeGeometry\(` | 2 (1) | 0 (0) |
| TubeGeometry | `new (THREE\.)?TubeGeometry\(` | 1 (1) | 0 (0) |
| OctahedronGeometry | `new (THREE\.)?OctahedronGeometry\(` | 2 (1) | 0 (0) |
| DodecahedronGeometry | `new (THREE\.)?DodecahedronGeometry\(` | 7 (2) | 0 (0) |
| IcosahedronGeometry | `new (THREE\.)?IcosahedronGeometry\(` | 16 (8) | 3 (1) |
| BufferGeometry | `new (THREE\.)?BufferGeometry\(` | 48 (30) | 3 (1) |
| InstancedMesh | `new (THREE\.)?InstancedMesh\(` | 20 (2) | 13 (2) |
| CanvasTexture | `new (THREE\.)?CanvasTexture\(` | 14 (9) | 2 (2) |
| Sprite | `new (THREE\.)?Sprite\(` | 10 (7) | 2 (2) |
| SpriteMaterial | `new (THREE\.)?SpriteMaterial\(` | 10 (7) | 2 (2) |
| Line | `new (THREE\.)?Line\(` | 1 (1) | 2 (1) |
| LineSegments | `new (THREE\.)?LineSegments\(` | 1 (1) | 0 (0) |
| MeshStandardMaterial | `new (THREE\.)?MeshStandardMaterial\(` | 37 (35) | 9 (2) |
| MeshLambertMaterial | `new (THREE\.)?MeshLambertMaterial\(` | 54 (30) | 19 (4) |
| MeshBasicMaterial | `new (THREE\.)?MeshBasicMaterial\(` | 12 (3) | 27 (2) |
| ShaderMaterial | `new (THREE\.)?ShaderMaterial\(` | 0 (0) | 0 (0) |
| Mesh | `new (THREE\.)?Mesh\(` | 2394 (68) | 89 (4) |
| mergeGeometries | `mergeGeometries\(` | 2 (2) | 0 (0) |
| import three/examples | `from .three/examples` | 2 (2) | 0 (0) |

**Wnioski dla Rust:**
- Dominują proste bryły (Box/Cyl/Cone ≈ 1 936 linii w `render/`), łączone jako `Mesh` (2 394) w `Group`. Nie ma `ShaderMaterial` (0), `LatheGeometry` (0) ani plików modeli (P1-11 §5). Port sprowadza się do generatorów siatek z prymitywów i hierarchii transformacji, bez importu assetów.
- `BufferGeometry` (48 linii w 30 plikach) to geometria ręczna: teren, dekoracje terenu, rzeki, kontury, ramki. Każdy taki plik wymaga przepisania algorytmu wierzchołków 1:1, a nie tylko wymiany prymitywów.
- `ExtrudeGeometry` (3: `bronzeCityRoblox.ts`, `stoneCityRoblox.ts`, `unitVeteranBadges.ts`) i `ShapeGeometry`/`TubeGeometry` (`units.ts`) wymagają triangulacji kształtu 2D. W Rust to dodatkowa zależność albo własna implementacja (§6, D-MOD-6).
- `CanvasTexture`+`Sprite` (14/10 linii) to tekstury rysowane Canvas2D: plakietki, emblematy, chipy miast. W Rust potrzebny jest rasteryzator tekstu i kształtów (§3.4).
- `InstancedMesh` (20 linii, 2 pliki: `scene.ts` 19, `rangeOverlay.ts` 1) obsługuje teren i nakładki zasięgu. Picking opiera się na nim (P4-0 §1.1, D-REND-3).
- Materiały: Standard (37) w jednostkach, Lambert (54) w terenie, miastach i ulepszeniach, Basic (12) w nakładkach. W Rust oznacza to co najmniej 3 ścieżki cieniowania (D-MOD-6).

---

## 2. Pokrycie danymi gry (zadanie 2)

### 2.1 Jednostki — 75 rekordów `units.json` + 2 cywilne

**Routing** (`render/units.ts:1086` `buildUnitModel`):
1. `category === 'super'` i nazwa pasuje do białej listy `SUPER_Z_MODELEM_NAZWANYM` (`units.ts:1068`) → `buildNamedUnit`.
2. Pozostałe super → `buildSuperUnit(cultureFromName)` (`units.ts:4807`): rzym → Triari/Evocati, grecja → `buildSuperGreece`, germanie → `buildGermanSuper`, reszta → kategoria `super`.
3. W pozostałych przypadkach `buildNamedUnit(normName(name))` (`units.ts:1492`): **85 reguł nazw** prowadzi do **70 różnych funkcji**.
4. Gdy żadna reguła nie pasuje, `buildCategoryModel(category)` (`units.ts:3700`, **20 etykiet `case`**: falanga, legion, legionary, legionista, osadnik, miecznik, wlocznik, lucznik, procarz, oszczepnik, maczuga, topor, konnica, rydwan, super, zwiadowca, robotnik, galera, obleznicza, domyslny) i potem `applyCultureOverrides` (`units.ts:5559`).

Kategoria pochodzi z `units/setup.ts:239` `categoryOf`.

**Symulacja routingu** (`route.py`): reguły `if (…) return X(` z `units.ts:1492–1781` przetłumaczone 1:1 (`includes`/`===`/`&&`/`||`), nazwy znormalizowane jak `normName` (`units.ts:998`, NFD + `ł→l` + lowercase), flaga Super-jednostka z JSON. Wynik dla 75 rekordów:

| Ścieżka | Liczba jednostek | Jednostki |
|---|---:|---|
| Model nazwany (1:1 nazwa → funkcja) | 64 | wszystkie pozostałe (tabela §2.1b) |
| `decorateChariot(buildCategoryModel('rydwan'))` (wspólna baza + dekor) | 3 | Rydwan mykeński, Rydwan Shang, Rydwan celtycki |
| `buildSuperUnit(kultura)` | 4 | Hieros Lochos, Triari, Wojownik germański, Evocati |
| `buildCategoryModel(kat)` | 4 | Oszczepnik, Łucznik, Zwiadowca (→ `kamien-bazowe-opus5` przez `units.ts:3933/3945/4687`), Galera (→ `galera-model.ts` przez `units.ts:4746`) |

**Różne ścieżki routingu dla 75 rekordów: 67** (`route.py` → `DISTINCT_ROUTES 67`). **Każdy rekord `units.json` ma dedykowaną bryłę albo wariant. Luk (fallback `domyslny`) nie ma.** Współdzielą tylko 3 rydwany ze wspólną bazą i różnym dekorem.
Jednostki **cywilne** Osadnik i Robotnik nie występują w `units.json` (`units/setup.ts:193` `CIVILIAN_TYPE_IDS`). Mają modele w `buildCategoryModel` (`case 'osadnik'` `units.ts:3848`, `case 'robotnik'` `units.ts:4691`). **Do portu jest więc 77 typów jednostek.**

**Modele osiągalne regułą nazwy, ale nieużywane przez żaden rekord `units.json`** (`route.py` → `UNUSED`): `buildCeltWarrior`, `buildCrossbowman`, `buildGermanWarrior` (rekord jest Super, więc trafia do `buildGermanSuper`), `buildHierosLochos` (Super poza białą listą, więc trafia do `buildSuperGreece`), `buildLegionRzymski`. Daje to **5 modeli dziś niewidocznych w grze** (D-MOD-3).
**Ścieżki zapasowe kategorii** (`newBuildMiecznik/Wlocznik/Procarz`, `jednostki-p1-rdzen.ts`; `case` legion/maczuga/topor/konnica/rydwan bez dekoru/obleznicza/domyslny) nie są osiągane przez żaden z 75 rekordów, bo każdy łapie wcześniej reguła nazwy. Zostają jako fallback na przyszłe nazwy (D-MOD-3).
**Martwe funkcje w `units.ts`:** `buildHastati` (`:2143`, opakowanie bez wywołań; zastąpione przez `buildHastatiOpus5`, `:1665`) i `buildBerserker` (`:3098`, komentarz `:1505-1507` „zostaje jako martwy”). W `jednostki-p1-rdzen.ts` 4 z 7 eksportów (`buildWojownikKamien`, `buildOszczepnik`, `buildLucznik`, `buildZwiadowca`) nie są importowane w `gra/src` (`units.ts:127-131` importuje tylko Procarz/Wlocznik/Miecznik). Zastąpiły je wersje `kamien-bazowe-opus5.ts`.

**Struktura `units.ts`** (`ufn.py`, 42 funkcje `build*` w pliku): **21 opakowań** (≤ 6 linii kodu, delegują do plików `jednostki-*`/`*-opus5`) i **21 funkcji z realną geometrią**. Wśród nich są modele w pliku: Hieros Lochos (`:1811`), Medżaj (`:1928`), Rydwan sumeryjski (`:2197`), Rydwan egipski (`:2421`), Jeździec chiński (`:2504`), Kusznik (`:2595`), Wojownik celtycki (`:2724`), Gaesatae (`:2825`), Soldurii (`:2947`), Wojownik germański (`:3037`), Berserker (`:3098`, martwy), Katapulta (`:3348`, 226 linii), Gwardia Sumeru (`:4859`), Hu Ben Wei (`:5004`), uThulwana (`:5156`) i Gwardia Inków (`:5343`). Dochodzą funkcje rdzenia: `buildBaseAvatar` (`:794`), `buildCategoryModel` (`:3700`, 739 linii kodu, 20 `case`), `buildNamedUnit`, `buildUnitModel` i `buildSuperUnit`. Poza `build*` są `decorateChariot` (`:1389`), `applyCultureOverrides` (`:5559`) i `attachEmbarkBoat` (`:5700`, łódź zaokrętowania; kategoria STA).
**Pliki modeli jednostek:** 30 plików JED, **78 eksportowanych `build*`** (`git grep -c -E "^export function build" edb8fb56 -- 'gra/src/render/braz-*' 'gra/src/render/hastati-*' 'gra/src/render/jednostki-*' 'gra/src/render/kamien-*' 'gra/src/render/zelazo-*' gra/src/render/kon-nowy-model.ts gra/src/render/galera-model.ts` → SUMA 78, z czego `galera-model.ts` 1 i `kon-nowy-model.ts` 2: `buildHorse`, `buildZlozeKonie`).
**Wspólne części jednostek:** `units.ts` ma **206 wywołań** singletonów `getGeo*` (`extra.py`, kolumna getGeo). **88 funkcji** `getGeo*` (`grep -cE '^function getGeo'` na `units.ts` → 88; `units.ts:487–740`) to współdzielony „katalog części”: hełmy, tarcze, broń, kadłub statku, wiosła. Pliki `*-opus5.ts` mają własne lokalne singletony geometrii i własne `dispose*Geometries`. `kon-nowy-model.ts` (40 `getGeo`) to wspólny koń dla kawalerii, stadniny (`ulepszenia-modele-p3a.ts`) i złoża koni (`styleResources.ts`).

**Warianty kolorystyczne jednostek:** kolor właściciela (`ownerColor_`) w każdym builderze. Kolor „domu” kultury pochodzi z `cultureHouseColor` (`units.ts:1034`): 7 kultur + neutral, nakładany tylko w ścieżce kategorii (`applyCultureOverrides`). Kategorie z `NEW_BESPOKE_CATEGORIES` (`units.ts:5573`, 8 kategorii) są z niego wyłączone.

**§2.1b — pełna tabela routingu 75 rekordów** (`route.py`; numer linii to reguła w `units.ts`):

| # | Jednostka | Typ | Epoka | Kultura | Super | Model (funkcja @ reguła) |
|---:|---|---|---|---|:-:|---|
| 1 | Wojownik | Swordsman | Kamień | — |  | `buildWojownikOpus5` @ `units.ts:1603` |
| 2 | Procarz | Slinger | Brąz | — |  | `buildProcarzBrazOpus5` @ `units.ts:1612` |
| 3 | Oszczepnik | Distance | Kamień | — |  | `buildCategoryModel(kat)+applyCultureOverrides` |
| 4 | Łucznik | Distance | Kamień | — |  | `buildCategoryModel(kat)+applyCultureOverrides` |
| 5 | Zwiadowca | Civilian | Kamień | — |  | `buildCategoryModel(kat)+applyCultureOverrides` |
| 6 | Włócznik | Spearman | Brąz | — |  | `buildWlocznikBrazOpus5` @ `units.ts:1610` |
| 7 | Wojownik z mieczem i tarczą | Swordsman | Brąz | — |  | `buildMiecznikBrazOpus5` @ `units.ts:1611` |
| 8 | Rydwan (woły) | Mount | Brąz | — |  | `buildRydwanWolyBrazOpus5` @ `units.ts:1613` |
| 9 | Konnica | Mount | Brąz | — |  | `buildKonnicaBrazOpus5` @ `units.ts:1637` |
| 10 | Galera | Naval | Brąz | — |  | `buildCategoryModel(kat)+applyCultureOverrides` |
| 11 | Falanga | Falangite | Żelazo | Grecka |  | `newBuildFalangita` @ `units.ts:1526` |
| 12 | Hieros Lochos (Święty Zastęp) | Swordsman | Żelazo | Grecka | S | `buildSuperUnit(kultura)` |
| 13 | Hastati | Swordsman | Żelazo | Rzymska |  | `buildHastatiOpus5` @ `units.ts:1665` |
| 14 | Triari | Spearman | Żelazo | Rzymska | S | `buildSuperUnit(kultura)` |
| 15 | Jeździec chiński | Mount | Brąz | Chińczycy |  | `buildChineseCavalry` @ `units.ts:1584` |
| 16 | Hu Ben Wei (Gwardia Tygrysa) | Swordsman | Brąz | Chińczycy | S | `buildHuBenWei` @ `units.ts:1693` |
| 17 | Impi | Spearman | Brąz | Zulusi |  | `buildImpi` @ `units.ts:1564` |
| 18 | Oszczepnik Zulu (Izijula) | Distance | Kamień | Zulusi |  | `buildZuluJavelineer` @ `units.ts:1565` |
| 19 | uThulwana (Białe Tarcze) | Swordsman | Brąz | Zulusi | S | `buildUThulwana` @ `units.ts:1695` |
| 20 | Wojownik z maczugą (Chaska) | Offensive | Kamień | Inkowie |  | `buildMaceWarrior` @ `units.ts:1683` |
| 21 | Wojownik z toporem | Offensive | Brąz | Inkowie |  | `buildAxeWarriorInka` @ `units.ts:1684` |
| 22 | Procarz (Huaracoc) | Slinger | Brąz | Inkowie |  | `buildInkaSlinger` @ `units.ts:1581` |
| 23 | Oszczepnik (Estólica) | Distance | Kamień | Inkowie |  | `buildInkaJavelineer` @ `units.ts:1579` |
| 24 | Królewska Gwardia | Swordsman | Brąz | Inkowie | S | `buildInkaRoyalGuard` @ `units.ts:1697` |
| 25 | Rydwan konny | Mount | Brąz | — |  | `buildRydwanKonnyBrazOpus5` @ `units.ts:1644` |
| 26 | Łucznik egipski | Distance | Kamień | Egipt |  | `buildEgyptianArcher` @ `units.ts:1571` |
| 27 | Rydwan egipski | Mount | Brąz | Egipt |  | `buildEgyptianChariot` @ `units.ts:1577` |
| 28 | Wojownik z khopesh | Swordsman | Brąz | Egipt |  | `buildKhopeshWarrior` @ `units.ts:1576` |
| 29 | Medżaj (Gwardia Faraona) | Swordsman | Brąz | Egipt | S | `buildMedjay` @ `units.ts:1688` |
| 30 | Łucznik nubijski | Distance | Brąz | Egipt |  | `buildNubianArcherOpus5` @ `units.ts:1575` |
| 31 | Łucznik sumeryjski | Distance | Kamień | Sumerowie |  | `buildSumerianArcher` @ `units.ts:1568` |
| 32 | Rydwan sumeryjski | Mount | Brąz | Sumerowie |  | `buildSumerianChariot` @ `units.ts:1569` |
| 33 | Włócznik sumeryjski | Spearman | Brąz | Sumerowie |  | `buildSumerianSpearman` @ `units.ts:1567` |
| 34 | Gwardia Królewska Sumeru | Swordsman | Brąz | Sumerowie | S | `buildSumerianRoyalGuard` @ `units.ts:1691` |
| 35 | Wojownik mykeński | Swordsman | Brąz | Grecka |  | `buildMycenaeanWarrior` @ `units.ts:1528` |
| 36 | Rydwan mykeński | Mount | Brąz | Grecka |  | `decorateChariot(rydwan)` @ `units.ts:1529` |
| 37 | Wojownik Sherden | Swordsman | Brąz | — |  | `buildSherden` @ `units.ts:1539` |
| 38 | Halabardnik Shang | Swordsman | Brąz | Chińczycy |  | `buildShangHalberdier` @ `units.ts:1540` |
| 39 | Rydwan Shang | Mount | Brąz | Chińczycy |  | `decorateChariot(rydwan)` @ `units.ts:1541` |
| 40 | Łucznik akadyjski | Distance | Brąz | Sumerowie |  | `buildAkkadianArcher` @ `units.ts:1544` |
| 41 | Gaesatae | Swordsman | Żelazo | Celtowie |  | `buildGaesatae` @ `units.ts:1495` |
| 42 | Soldurii | Swordsman | Żelazo | Celtowie |  | `buildSoldurii` @ `units.ts:1494` |
| 43 | Rydwan celtycki | Mount | Żelazo | Celtowie |  | `decorateChariot(rydwan)` @ `units.ts:1500` |
| 44 | Wojownik germański | Swordsman | Żelazo | Germanie | S | `buildSuperUnit(kultura)` |
| 45 | Berserker germański | Swordsman | Żelazo | Germanie |  | `buildBerserkerZ3` @ `units.ts:1508` |
| 46 | Taran | Siege | Kamień | — |  | `buildBatteringRam` @ `units.ts:1649` |
| 47 | Taran okuty | Siege | Brąz | — |  | `buildTaranOkutyOpus5` @ `units.ts:1648` |
| 48 | Katapulta | Siege | Żelazo | — |  | `buildCatapult` @ `units.ts:1657` |
| 49 | Wieża oblężnicza | Siege | Brąz | — |  | `buildSiegeTower` @ `units.ts:1658` |
| 50 | Wojownik tyrreński | Offensive | Brąz | Rzymska |  | `buildTyrrhenian` @ `units.ts:1660` |
| 51 | Wojownik szekelesz | Spearman | Brąz | Ludy Morza |  | `buildShekelesh` @ `units.ts:1661` |
| 52 | Konnica lancowa asyryjska | Mount | Żelazo | Asyria |  | `buildZelazoKonnicaLancowaAsyryjska` @ `units.ts:1620` |
| 53 | Konnica łucznicza asyryjska | Mount | Żelazo | Asyria |  | `buildZelazoKonnicaLuczniczaAsyryjska` @ `units.ts:1621` |
| 54 | Łucznik asyryjski | Distance | Brąz | Asyria |  | `buildAssyrianArcher` @ `units.ts:1669` |
| 55 | Drużynnik | Swordsman | Żelazo | Słowianie |  | `buildDruzynnik` @ `units.ts:1760` |
| 56 | Jeździec z oszczepami | Mount | Żelazo | Słowianie |  | `buildZelazoJezdziecOszczepami` @ `units.ts:1632` |
| 57 | Strażnik bram Harappy | Spearman | Brąz | Harappa |  | `buildStraznikHarappy` @ `units.ts:1674` |
| 58 | Piechota induska | Spearman | Brąz | Harappa |  | `buildPiechotaInduska` @ `units.ts:1675` |
| 59 | Garnizon Harappy | Swordsman | Żelazo | Harappa |  | `buildGarnizonHarappy` @ `units.ts:1714` |
| 60 | Rydwan Kapadokijski | Mount | Brąz | Hetyci |  | `buildRydwanKapadokijskiOpus5` @ `units.ts:1538` |
| 61 | Piechota hetycka | Spearman | Brąz | Hetyci |  | `buildPiechotaHetycka` @ `units.ts:1670` |
| 62 | Gwardia hetycka | Swordsman | Żelazo | Hetyci |  | `buildGwardiaHetycka` @ `units.ts:1711` |
| 63 | Gwardia Ishtar | Swordsman | Brąz | Babilonia |  | `buildGwardiaIshtar` @ `units.ts:1671` |
| 64 | Wojownik babiloński | Swordsman | Brąz | Babilonia |  | `buildWojownikBabilonski` @ `units.ts:1672` |
| 65 | Piechota neobabilońska | Swordsman | Żelazo | Babilonia |  | `buildPiechotaNeobabilonska` @ `units.ts:1712` |
| 66 | Tyrski miecznik | Swordsman | Żelazo | Fenicjanie |  | `buildTyrskiMiecznik` @ `units.ts:1748` |
| 67 | Wojownik fenicki | Swordsman | Brąz | Fenicjanie |  | `buildWojownikFenicki` @ `units.ts:1673` |
| 68 | Gwardia Tyreńska | Swordsman | Żelazo | Fenicjanie |  | `buildGwardiaTyrenska` @ `units.ts:1749` |
| 69 | Thorakites | Spearman | Żelazo | Grecja |  | `buildThorakites` @ `units.ts:1751` |
| 70 | Evocati | Swordsman | Żelazo | Rzymianie | S | `buildSuperUnit(kultura)` |
| 71 | iButho z iklwa | Spearman | Żelazo | Zulusi |  | `buildIButho` @ `units.ts:1761` |
| 72 | Gwardzista z champi | Offensive | Brąz | Inkowie |  | `buildGwardzistaChampi` @ `units.ts:1677` |
| 73 | Wojownik z żelaznym khopesh | Swordsman | Żelazo | Egipt |  | `buildZelaznyKhopesh` @ `units.ts:1750` |
| 74 | Mur tarcz (Sargonid) | Spearman | Żelazo | Sumerowie |  | `buildMurTarcz` @ `units.ts:1713` |
| 75 | Miecznik galijski | Swordsman | Żelazo | Celtowie |  | `buildMiecznikGalijski` @ `units.ts:1762` |

### 2.2 Miasta

- **Ścieżka żywa w grze:** `cities.ts:229` `buildSettlementModelForStyle`. Styl mapy jest **stałą** `GAME_MAP_RENDER_STYLE = 'roblox'` (`mapRenderStyle.ts:40`), a `main.ts:1776,1790` przekazuje ją do opcji renderu, więc innego stylu w grze nie ma. Dla `roblox`:
  - era 1 → `miasto-kamien.ts` `buildMiastoKamien(level, {mur})` (`cities.ts:247`). Kompozycja zależy od poziomu 1..10 (`miasto-kamien.ts:584` `rozmiarDlaPoziomu`: male/srednie/duze; komentarz `:19` „każdy poziom = własna kompozycja”). Wariantu na cywilizację nie ma.
  - era ≥ 2 → `miasto-braz.ts` `buildMiastoBraz(civ, level, {mur, palisada})` (`cities.ts:241`). **Tylko 2 zestawy cywilizacji:** `rzym` → `buildMiastoBrazRzym`, każda inna → `buildMiastoBrazGrecja` (`miasto-braz.ts:866-873`). Era 3+ (Żelazo) dostaje fallback do Brązu (`cities.ts:240` „brak modelu”).
  - Mury: `wallKind` none/palisada/stone. Palisada przez `buildPalisadaWal` (`miasto-kamien.ts:636`, wołane z `miasto-braz.ts:831,855`).
- **Ścieżka „ghost” założenia miasta:** `main.ts:13023` `buildSettlementModel(era, civ, 1, …)` z domyślnym stylem `roblox` trafia do `bronzeCityRoblox.ts`/`stoneCityRoblox.ts` (`settlementModel.ts:20-23`). Są **żywe**, ale tylko jako podgląd przy zakładaniu.
- **Klasyczne `bronzeCity.ts` (`buildBronzeCity`) i `stoneCity.ts` (`buildStoneAgeCity`)** są osiągalne tylko przy stylu ≠ `roblox` (`settlementModel.ts:25-26`), czyli **nie w grze**. Plik `bronzeCity.ts` pozostaje jednak żywy, bo daje typ `BronzeCiv`, `BRONZE_CIVS` (11 kluczy, `bronzeCity.ts:19-20`) i `ikonaIdToBronzeCiv` (`:38`). Importuje go 8 plików, w tym `battleScene.ts` i `siegeWall.ts`.
- **Mapowanie 15 państw** (`wonders.json → panstwa`) na 11 kluczy stylu miasta (`bronzeCity.ts:23-36`): babilonia, harappa i asyria → sumer; slowianie → germanie; fenicjanie → hetyci; klucz `aztek` nie ma państwa. W żywej ścieżce era ≥ 2 to i tak zwija się do 2 zestawów (Rzym / Grecja).
- **`robloxCity.ts`:** żywe jest tylko `addRobloxSkyDecor` (`scene.ts:73,3071`). `buildRobloxCity` i `buildRobloxRomeCity` (`:62`, `:213`) mają jedynego importera w martwym `robloxScene.ts:12`, więc są **martwe w praktyce**. To doprecyzowanie P4-0 §1.2, które uznało cały plik za żywy.
- **Budynki (42 w `buildings.json`)** nie mają osobnych modeli 3D. Model miasta zależy od (era, civ, poziom, mury). Identyfikatory budynków cytowane w `render/**` to tylko `palisada`, `mury` i `fort` (skrypt `cov.py`, `git grep -w "'<id>'"`), używane do rodzaju murów i chipa obrony. **Luka, a nie brak:** wygląd miasta nie odzwierciedla budynków (D-MOD-4).

### 2.3 Cuda

`wonderModels.ts:427` `buildWonderModel`: `switch` z **19 `case`** i `default` (cylinder + stożek). `wonders.json → cuda` ma **19 id**, pokrycie 19/19, bez nadmiarów (`cov.py`: `missing [] extra []`). 5 cudów `parkowane_epoka4plus` (nalanda, angkor_wat, wielki_dzwon, mauzoleum_teodoryka, kopiec_grobowy; `aktywne: false`) **nie ma modelu** i dostałoby `default` (D-MOD-5). Wariant `ruin` (materiały przyciemnione, `opts.ruin`) i sztandar właściciela (`ownerBanner`) dotyczą wszystkich 19. Modele budują helpery `box/cyl/cone` (R2 = 100 wywołań). Konsumenci: `wonderRenderer.ts:95` (mapa) i `wonderpreview/main.ts:158` (strona podglądu).

### 2.4 Ulepszenia terenu i zasoby

- **Ścieżka żywa:** `improvements.ts:339` `buildImprovement(key, owner, style=GAME_MAP_RENDER_STYLE)` przy `style === 'roblox'` przechodzi do `robloxImprovements.ts` `BUILDERS` (**24 klucze**: droga, droga_brukowana, farma, bydlo, owce, lama, stadnina, kopalnia_zelaza, kamieniolom, oboz_lowiecki, wyrab, tartak, irygacja, pole_irygowane, glinianka, tarasy, lodzie_rybackie, warzelnia_soli, fort, posterunek, pastwisko, kopalnia_miedzi, kopalnia_zlota, kopalnia_cyny).
- **Pokrycie:** `terrain-improvements.json` ma **22 klucze**, wszystkie z modelem (`cov.py`: brak kluczy bez `case`). Dodatkowe klucze modeli: `pole_irygowane` i `pastwisko`. **Współdzielenie:** `kopalnia_miedzi` i `kopalnia_zelaza` korzystają z tego samego `buildKopalnia()`, a `farma` i `pastwisko` z `buildFarma({wariant})`.
- Implementacje: `ulepszenia-modele-p2.ts` (5 `build*`), `-p3a.ts` (6), `-p3b.ts` (12, w tym 8 złóż), `kopalnia-cyny-opus5.ts`, `kopalnia-zlota-opus5.ts`, `droga-6-ramion.ts` (`buildDrogaGwiazda`, maska 6 ramion wg sąsiadów z `map/road-network.ts`), `pastwisko-modele.ts` (krowa/owca/lama), `swinia-trzoda.ts`. Kompozycje „stosu żywności”: `buildRobloxFoodStack` (`robloxImprovements.ts`, kombinacje farma/irygacja/bydło/owce) oraz `buildImprovementSectored`/`buildImprovementStack` (`improvements.ts:458,518`; wołane z `main.ts:792,2817`).
- **Klasyczne `switch` w `improvements.ts` (24 `case`)** są osiągalne tylko przy stylu ≠ `roblox`, czyli nie w grze. Wyjątek to wspólne helpery i `buildImprovement*`, wołane też z logiki (`game/ai.ts:143` itd. — P4-0 §3.3).
- **Zasoby na mapie:** `styleResources.ts:444` `buildStyledResourceOverlay` (`main.ts:2862,2891`) oraz klasyczne `resources.ts` wołane z wnętrza `styleResources.ts:446,448`. Liczbę typów zasobów z modelem względem danych zasobów: NIE_ZMIERZONO (nie zestawiłem listy zasobów z danymi; do P4.4 runda 2 albo tematu paczki ULE).

### 2.5 Dekoracje terenu, osady neutralne, statki, obozy

| Element | Plik | Warianty (dowód) | Użycie |
|---|---|---|---|
| Las | `lasy-modele.ts` | `LICZBA_WARIANTOW_LASU = 5` (`:88`) | `scene.ts` (geometria + materiał; `buildLas` 0 wywołań w `gra/src`) |
| Dżungla | `djungla-modele.ts` | `LICZBA_WARIANTOW_DJUNGLI = 5` (`:8`) | `scene.ts` |
| Wzgórza/góry | `teren-gory-wzgorza.ts` | `LICZBA_WARIANTOW_TERENU = 5` (`:84`) ×2 typy | `scene.ts`, `mapRenderStyle.ts`, `main.ts` |
| Łąki/równiny | `dekor-laki-rowniny.ts` | `DEKOR_LICZBA_WARIANTOW = 4` (`:85`) ×2 | `scene.ts` |
| Pustynia + oaza | `oaza-pustynia.ts` | `DEKOR_PUSTYNIA_LICZBA_WARIANTOW = 4` (`:241`) + `buildOaza` | `scene.ts` |
| Tarasy (stok) | `tarasy-model.ts` | `tarasyWariantDlaHeksa` (`:106`) — liczba wariantów NIE_ZMIERZONO | `main.ts:799,14124` |
| Wybrzeże, rzeki, wydmy, piasek | `mapRenderStyle.ts` (14 `build*`), `riverLod.ts` | — | `scene.ts` |
| Niebo (Roblox) | `robloxCity.ts:270` `addRobloxSkyDecor` | — | `scene.ts:3071` |
| Wioska / obóz barbarzyńców | `wioska-oboz.ts` (2) | kolor `BARB_FACTION_COLOR` (`:138`) | `main.ts:3006,3034` |
| Galera | `galera-model.ts` | 1 | `units.ts:4751` (`newBuildGalera`) |
| Łódź zaokrętowania | `units.ts:5700` `attachEmbarkBoat` | 1 | jednostki lądowe na morzu |
| Obóz oblężniczy | `siegeCampModels.ts` (żołnierze, taran, wieża, namiot, grupa) | kolor atakującego (`:160`) | `siegeMarker.ts` ← `main.ts` |
| Mury oblężnicze (bitwa) | `battle/siegeWall.ts` | **9 stylów murów** (grecja, rzym, sumer, egipt, inka, chiny, zulu, celtowie, germanie — `:416–910`) | `battleScene.ts` |

Dekoracje terenu są **deterministyczne wg heksa**: wariant i rotacja to hash współrzędnych z solą, np. `SOL_WARIANT_LASU = 1301` (`lasy-modele.ts:97`) i `rnd(n, salt)` (`bronzeCity.ts:42`). **Wymóg zgodności:** Rust musi odtworzyć te funkcje bit w bit (`Math.imul`, `>>> 0`), inaczej las albo miasto „przeskoczy” na inny wariant (§5).

### 2.6 Bitwa 3D i podglądy (poza mapą)

- `battle/battleScene.ts` (19 493 LOC): w większości DOM/HUD i logika bitwy. Elementy 3D to `_buildBattlefield`, `_buildSiegeInteriorBuildings`, `_buildPlayableMarginVisuals`, `_buildDeployZone`, `_makeOrderArrow`, `_makeGroupNumberTexture`, `makeGableRoofGeometry` (`:1214`), `makeProjectileMesh` (`:1628`), `makeFallbackAvatar` (`:19321`) i `makeUnitBars` (`:19343`). Dochodzą **animacje** `requestAnimationFrame` (taran `:7049`, głaz `:7265`, krok `:8063`, `:8437`, pętla `:8512`) oraz jednostki z `buildUnitModel` (`:104`). Podział LOC na 3D/DOM: NIE_ZMIERZONO.
- `battle/manualBattle.ts` (1 433): własna scena, `makeFallbackAvatar` (`:186`), `makeHpBar` (`:204`), jednostki z `render/units`.
- `ui/unitMiniPreview.ts` (155) to miniatura jednostki przez `buildUnitModel`. `wonderpreview/main.ts` (289) to podgląd 19 cudów.
- `render/**` **nie ma pętli animacji** (`git grep -n requestAnimationFrame edb8fb56 -- gra/src/render` → 0 trafień). Modele mapy są statyczne. Pętla renderu żyje w `main.ts:36249` `renderLoop`. Czy pętla animuje modele (np. ruch jednostek): NIE_ZMIERZONO.

---

## 3. Wspólne helpery i graf zależności (zadanie 3)

### 3.1 Węzły współdzielone (importerzy w `gra/src`, `graph.py`)

| Plik | Importerzy | Rola |
|---|---:|---|
| `hexutil.ts` | 55 | `HEX_R`, `axialToWorld`/`worldToAxial` — czysta matematyka, bez three. **Port jako pierwszy.** |
| `mapRenderStyle.ts` | 16 | stała stylu, progi jakości, wysokości powierzchni (`terrainSurfaceTopY`), palety (`styleTerrainColor`, `styleScenePalette`), 14 builderów terenu/wybrzeża |
| `bronzeCity.ts` | 8 | typ `BronzeCiv` + mapowanie państw → styl |
| `improvements.ts` | 10 | `ImprovementKey` + routing; importowany też z logiki (`game/ai.ts` itd.) |
| `unitOwnerEmblem.ts` | 5 | emblemat właściciela (Canvas → Sprite); `new Image()` `:317-320` |
| `scene.ts` | 5 | budowa sceny, teren `InstancedMesh`, mgła, LOD, rzeki |
| `units.ts` | 4 | `buildUnitModel` (mapa, bitwa, bitwa ręczna, miniatura) |
| `fogDim.ts` | 3 | mgła = mnożenie `material.color` (`:29-41`) |
| `zoomLod.ts` | 3 | poziomy LOD wg zoomu, `effectivePixelRatio`, LOD chipa miasta |
| `kon-nowy-model.ts` | 3 | wspólny koń (jednostki, stadnina, złoże) |
| `pastwisko-modele.ts`, `swinia-trzoda.ts`, `styleResources.ts`, `ulepszenia-modele-p3b.ts` | 2–3 | zwierzęta i złoża współdzielone przez ulepszenia i zasoby |

### 3.2 Graf (krawędź A → B: A importuje B; tylko pliki `render/**` i 8 spoza)

```
main.ts ─┬─> scene.ts ─┬─> mapRenderStyle.ts ─> teren-gory-wzgorza.ts, hexutil.ts
         │             ├─> lasy-modele, djungla-modele, dekor-laki-rowniny, oaza-pustynia
         │             ├─> riverLod, mergeDecor, fogDim, zoomLod, robloxCity(sky)
         │             └─> robloxImprovements.ts ─┬─> ulepszenia-modele-p2/p3a/p3b ─> kon-nowy-model
         │                                        ├─> kopalnia-cyny/zlota-opus5, droga-6-ramion
         │                                        ├─> pastwisko-modele, swinia-trzoda
         │                                        └─> styleResources ─> resources, kon-nowy-model, pastwisko, ulepszenia-p3b
         ├─> improvements.ts ─> robloxImprovements.ts (j.w.), styleResources, droga, kopalnie
         ├─> cities.ts ─┬─> miasto-kamien.ts <── miasto-braz.ts
         │              ├─> settlementModel ─> bronzeCity, bronzeCityRoblox, stoneCity, stoneCityRoblox
         │              └─> cityMapStatChip ─> unitOwnerEmblem, zoomLod ; cityMapOutline ─> hexShape
         ├─> units.ts ─┬─> 28 plików modeli jednostek (braz-*, hastati-*, jednostki-*, kamien-*, zelazo-*) ─> hexutil
         │             ├─> galera-model, kon-nowy-model
         │             └─> unitStatPlate ─> unitOwnerEmblem, unitVitalsPalette ; unitUpgradeBadges ; unitVeteranBadges
         ├─> wonderRenderer ─> wonderModels ; wioska-oboz ; tarasy-model ; siegeMarker ─> siegeCampModels
         └─> overlaye: rangeOverlay, tradeRoutesOverlay, cityOkolicaOverlay ─> workerFieldOverlay, rangeOverlay
battle/battleScene.ts ─> units.ts, bronzeCity (typ) ; battle/siegeWall.ts ─> bronzeCity (typ)
battle/manualBattle.ts ─> units.ts, hexutil ; ui/unitMiniPreview.ts ─> units.ts ; wonderpreview/main.ts ─> wonderModels, hexutil
martwe: minecraftScene.ts ─> scene, mapRenderStyle ; robloxScene.ts ─> robloxCity, scene  (0 importerów)
```

Pełna lista krawędzi (IN/OUT per plik) pochodzi z `graph.py`. Krawędzie do logiki (`game/`, `map/`, `units/`) opisuje P4-0 §3.3 (D-REND-2): `units.ts` → `game/armyMerge`, `game/human-owners`, `units/setup`; `cities.ts` → 5 modułów `game/`; `droga-6-ramion.ts` → `map/road-network`; `fogDim.ts` → `game/visibility`; `siegeCamp*` → `game/siegeMachines`.

### 3.3 Mgła, LOD, materiały, palety

- **Mgła** (`fogDim.ts`, 44 LOC): jasność heksa mnożona przez `material.color` każdego obiektu. Obiekty muszą mieć **materiały na token** (`group.userData['mats']`, konwencja z komentarza `units.ts:1074-1076`). W Rust trzeba to zastąpić uniformem lub atrybutem instancji, ale z identycznym wynikiem koloru (§5).
- **LOD** (`zoomLod.ts`, 220 LOC; `riverLod.ts`, 413): ukrywanie dekoracji i rzek wg zoomu (`RIVER_LOD_HIDE_FROM_LEVEL = 3`, `riverLod.ts:160`), LOD tekstur chipów (`CITY_BADGE_LOD_NEAR_DIST = 5.5`, `MID = 11`, `zoomLod.ts:161-163`) oraz `DEKOR_LOD_MAX_POZIOM = 1`. **Modele jednostek/miast nie mają LOD geometrii** (kolumna lod = 0 w plikach JED/MIA, `extra.py`).
- **Scalanie:** `mergeDecor.ts` (`collapseToMergedMesh`) i `mergeGeometries` (`scene.ts`, `riverLod.ts`) redukują draw-calle dekoracji. To optymalizacja, nie wygląd.
- **Palety:** `mapRenderStyle.ts:535,555` (teren/scena wg stylu), lokalne stałe `COLOR_*` w `units.ts` (np. `cultureHouseColor` `:1034`), `unitVitalsPalette.ts` (HP/ruch), `mats` w `wonderModels.ts:430-451` (20 materiałów).
- **Jakość:** `normalizeMapRenderOptions`/`resolveRenderPreset` (`mapRenderStyle.ts:97,114`), progi heksów (`:50-54`) i `setImprovementDetailQuality` (`robloxImprovements.ts:34`) przełączają gęstość dekoracji. Liczba presetów jakości: NIE_ZMIERZONO.

### 3.4 Tekstury z Canvas (do rasteryzacji w Rust)

`CanvasTexture` występuje w 9 plikach `render/**` (§1.2): `cities.ts`, `cityMapStatChip.ts` (1 133 LOC, chip miasta z portretem/sigilem/ikoną produkcji), `cityOkolicaOverlay.ts`, `siegeMarker.ts`, `unitOwnerEmblem.ts` (SVG → canvas, `svgToDataUri` `:231`), `unitStatPlate.ts` (3), `unitUpgradeBadges.ts`, `workerFieldOverlay.ts` i `units.ts` (4). Rust potrzebuje rasteryzacji SVG (ikony z P1-11) i tekstu z fontem systemowym (P1-11 §5: brak plików fontów). Wybór biblioteki: D-MOD-6.

---

## 4. Wycena i paczki implementacyjne (zadanie 4)

### 4.1 Rozmiar wg kategorii (żywe vs martwe)

| Kategoria | Żywe pliki / LOC | Modele do odtworzenia (z dispatchu §2) | Złożoność | Martwe / nieosiągalne w grze |
|---|---|---|---|---|
| JED | 30 / 33 545 | 77 typów: 64 nazwane + 3 rydwany na bazie + 4 super + 4 kategorii + 2 cywilne; plus koń i 88 części `getGeo*` | wysoka: 2 026 `new Mesh`, warianty kultury, kolor właściciela | `buildHastati`, `buildBerserker`, 4 eksporty `p1-rdzen`; 5 modeli bez rekordu (§2.1) |
| STA | 1 / 273 (+`attachEmbarkBoat`) | 2 (galera, łódź) | niska | — |
| MIA | 9 / 4 598 | żywe: `miasto-kamien` (10 poziomów × mury) + `miasto-braz` (2 cyw. × 10 poz. × 3 mury) + ghost Roblox (2 pliki) | średnia (R2 = 72+42 helperów w Roblox) | `bronzeCity`/`stoneCity` builder (styl ≠ roblox), `buildRobloxCity`/`RomeCity` |
| CUD | 2 / 636 | 19 + default + ruina | niska–średnia (100 wywołań helperów) | — |
| ULE | 12 / 4 522 | 24 klucze + stosy żywności + zasoby | średnia | klasyczne `switch` w `improvements.ts` (styl ≠ roblox) |
| DEK | 9 / 5 362 | 32 warianty (5+5+2×5+2×4+4) + oaza + tarasy + wybrzeże/rzeki + wioska/obóz (2) | wysoka (ręczne `BufferGeometry`, deterministyczne warianty) | `buildLas`, `buildGora`, `buildDekorLaka/Rownina/Pustynia`, 6 builderów `mapRenderStyle` z 0 wywołań w `gra/src` (część użyta w `gra/tools`) |
| OBL | 3 / 469 | 4 (żołnierze, taran, wieża, namiot) + marker | niska | — |
| OVL | 12 / 5 156 | chip miasta, tabliczka jednostki, emblemat, odznaki, zasięg, granice, szlaki, okolica, pole robotnika, kontur | średnia–wysoka (Canvas → tekstura) | — |
| INF | 8 / 4 735 (`render/`) | scena, kamera, mgła, LOD, scalanie | wysoka (architektura — P4.3) | — |
| MRT | 2 / 23 | 0 | — | `minecraftScene.ts`, `robloxScene.ts` (D-REND-7) |
| BIT | 3 / 21 973 | pole bitwy, 9 murów, pociski, strzałki, animacje | wysoka | NIE_ZMIERZONO |
| PODGL | 2 / 444 | używa JED/CUD | niska | — |

Estymacja czasu (dni): **NIE_ZMIERZONO**. Brak metody kalibracji. Proxy rozmiaru to LOC i `new Mesh` z tabeli.

### 4.2 Paczki (temat = paczka), kolejność

Każda paczka: Opus 5.5 medium (grafika), izolowany worktree, dowód zgodności wg §5. Allowlisty są **propozycją**: docelowe ścieżki Rust ustala P4.3 (architektura renderera, równolegle), dlatego piszę `<renderer>/…`.

| # | ID (propozycja) | Zakres (pliki źródłowe web) | Allowlista (propozycja) | Zależy od | Modele |
|---:|---|---|---|---|---:|
| 1 | `R-RUSTPORT-P4-MOD-01-CORE` | `hexutil`, `hexShape`, `fogDim`, `zoomLod`, `mergeDecor`, `unitVitalsPalette`, palety/wysokości z `mapRenderStyle` (bez builderów) | `<renderer>/core/**` + testy | P4.3 | 0 (fundament: siatka hex, mgła, LOD, deterministyczny `rnd`) |
| 2 | `R-RUSTPORT-P4-MOD-02-PRIMS` | biblioteka prymitywów (Box/Cyl/Cone/Sph/Tor/Ico/Dod/Oct/Circle/Ring/Plane + Extrude/Shape/Tube), materiały Std/Lambert/Basic, konwencja `mats` na token | `<renderer>/mesh/**` | 1 | 0 |
| 3 | `R-RUSTPORT-P4-MOD-03-TERRAIN-DECOR` | `lasy`, `djungla`, `teren-gory-wzgorza`, `dekor-laki-rowniny`, `oaza-pustynia`, `tarasy-model`, buildery `mapRenderStyle`, `riverLod` | `<renderer>/decor/**` | 1, 2 | 32 warianty (5+5+2×5+2×4+4) + oaza + tarasy + wybrzeże/rzeki |
| 4 | `R-RUSTPORT-P4-MOD-04-UNIT-PARTS` | `units.ts` `getGeo*` (88 części), `buildBaseAvatar`, `kon-nowy-model`, `buildCategoryModel` (20 `case` w tym osadnik/robotnik), `applyCultureOverrides`, `decorateChariot`, `galera-model`, `attachEmbarkBoat` | `<renderer>/units/core/**` | 2 | 4 kat. + 2 cyw. + 3 rydwany + galera + łódź + koń |
| 5 | `R-RUSTPORT-P4-MOD-05-UNITS-STONE` | `kamien-bazowe/inka/lucznicy/zulu-taran-opus5`, `jednostki-p2-inka`, `jednostki-p3-dystans` | `<renderer>/units/kamien/**` | 4 | 10 tras rekordów epoki Kamień |
| 6 | `R-RUSTPORT-P4-MOD-06-UNITS-BRONZE` | 9 × `braz-*-opus5`, `jednostki-p4-melee`, `-p57-…`, `-p8a-…`, `-p8b-…` + modele w `units.ts` epoki brązu (Medżaj, rydwany sum./egip., Jeździec chiński, Hu Ben Wei, uThulwana, Gwardia Inków/Sumeru) | `<renderer>/units/braz/**` | 4 | 39 tras rekordów epoki Brąz |
| 7 | `R-RUSTPORT-P4-MOD-07-UNITS-IRON` | `hastati-opus5`, `hastati-falangita` (Falangita), `jednostki-p6-super`, `jednostki-z1/z2/z3`, `zelazo-*-opus5` + `units.ts` (Gaesatae, Soldurii, Katapulta, Hieros/SuperGreece, Germanie) | `<renderer>/units/zelazo/**` | 4 | 22 trasy rekordów epoki Żelazo |
| 8 | `R-RUSTPORT-P4-MOD-08-UNIT-OVERLAY` | `unitStatPlate`, `unitOwnerEmblem`, `unitUpgradeBadges`, `unitVeteranBadges` (Canvas → tekstura) | `<renderer>/units/overlay/**` | 2, rasteryzator (D-MOD-6) | 4 nakładki |
| 9 | `R-RUSTPORT-P4-MOD-09-CITIES` | `miasto-kamien`, `miasto-braz`, `bronzeCityRoblox`, `stoneCityRoblox`, `settlementModel`, `cities.ts` (bez chipa), `cityMapOutline` | `<renderer>/cities/**` | 1, 2 | 2 rodziny × 10 poz. × mury + 2 ghost |
| 10 | `R-RUSTPORT-P4-MOD-10-CITY-CHIP` | `cityMapStatChip` (1 133), `cityOkolicaOverlay`, `workerFieldOverlay` | `<renderer>/cities/overlay/**` | 8 (rasteryzator), 9 | 3 |
| 11 | `R-RUSTPORT-P4-MOD-11-IMPROVEMENTS` | `robloxImprovements` (24 `BUILDERS` + stosy), `ulepszenia-modele-p2/p3a/p3b`, kopalnie, `droga-6-ramion`, `pastwisko-modele`, `swinia-trzoda`, `styleResources`, `resources` | `<renderer>/improvements/**` | 2, 4 (koń) | 24 + złoża + zwierzęta |
| 12 | `R-RUSTPORT-P4-MOD-12-WONDERS` | `wonderModels`, `wonderRenderer` | `<renderer>/wonders/**` | 2 | 19 + default |
| 13 | `R-RUSTPORT-P4-MOD-13-MISC` | `wioska-oboz`, `siegeCampModels`, `siegeMarker`, `siegeCampSync`, `rangeOverlay`, `tradeRoutesOverlay`, `addRobloxSkyDecor` | `<renderer>/misc/**` | 1, 2 | 2 + 4 + nakładki |
| 14 | `R-RUSTPORT-P4-MOD-14-BATTLE-3D` | `battleScene` (część 3D), `manualBattle`, `siegeWall` (9 stylów) | wg D-REND-8 | 4–7 | NIE_ZMIERZONO (zależnie od D-REND-8) |

Liczby modeli w paczkach 5–7 to podział 70 nazwanych celów + modeli super wg epoki rekordu (`units.json → Epoka`). Rekordy wg `Epoka`: Kamień 10, Brąz 40, Żelazo 25; różne trasy routingu wg epoki: 10 / 39 / 22 (z `routes.txt` §2.1b; 3 rydwany na `decorateChariot` liczone jako jedna trasa). Przypisanie pliku do paczki wg epoki jest przybliżone, bo pliki `jednostki-p*` mieszają epoki. Dokładny podział pliku na paczki: NIE_ZMIERZONO (do uzgodnienia przy dispatchu paczki).

**Kolejność:** 1 → 2 → (3 ∥ 4) → (5 ∥ 6 ∥ 7 ∥ 9 ∥ 11 ∥ 12 ∥ 13) → 8 → 10 → 14. Paczki 5–7 równolegle wymagają rozłącznych allowlist. `units.ts` jest wspólny, więc paczka 4 musi najpierw wydzielić routing i części, a paczki 5–7 tylko dopisują modele (rejestr nazwa → builder).

---

## 5. Ocena wizualna (zadanie 5 — bez wykonywania)

Wszystkie paczki 3–14 wymagają oceny wizualnej. Zgodności wyglądu nie da się dowieść testem jednostkowym geometrii. Proponowana metoda:

1. **Zrzuty z jednakowej kamery, web vs Rust.** Ta sama `PerspectiveCamera` (fov z `scene.ts:3078`; bitwa `PerspectiveCamera(48,…)`), ten sam yaw i pitch (`camera.ts:66,123`), ta sama rozdzielczość i `pixelRatio = 1`, to samo światło (parametry świateł z `scene.ts`: NIE_ZMIERZONO). Web: `gra/tools/*-real-render-test.cjs` już renderują pojedyncze modele (np. `zelazo-zrzuty-25-jednostek-render.cjs`) i mogą być źródłem referencji po decyzji D-MOD-7.
2. **Siatka modeli:** każdy model sam, na neutralnym heksie, kolor właściciela `0xffd54a` (domyślny w `miasto-*`/`wonderModels`), z 3 kątów (izometria gry, front, góra). Miasta: poziomy 1/3/6/10 × mury none/palisada/stone. Cuda: normalny + ruina.
3. **Metryki:** (a) liczba meshy i trójkątów na model (web: `group.traverse`, Rust: licznik) — **identyczna**; (b) bounding box modelu — tolerancja 1e-4; (c) różnica obrazów (SSIM/percepcyjna) z progiem do ustalenia; (d) ocena człowieka lub Opusa 5.5 na parze zrzutów, w formacie werdyktu PASS/FAIL per model.
4. **Determinizm dekoracji:** porównanie wariantu i rotacji dla ustalonego zbioru heksów (np. 1 000 współrzędnych): Rust vs web, 100% zgodności (funkcje z §2.5).
5. **Mgła:** zrzut tego samego modelu przy jasności mgły 1.0 / wartość pośrednia / min (`fogBrightnessForHex`, `fogDim.ts:16`). Kolor piksela ± tolerancja.

Harness (Playwright vs WebDriver Tauri): D-REND-6 (P4-0). Nie rozstrzygam tego tutaj.

---

## 6. Decyzje właściciela `D-MOD-n` (NIE rozstrzygane po cichu)

- **D-MOD-1 — Styl mapy.** W grze działa wyłącznie styl `roblox` (`mapRenderStyle.ts:40` to stała; `main.ts:1776,1790`). Ścieżki `civ`/`minecraft` (klasyczne `bronzeCity`/`stoneCity` jako buildery, `switch` w `improvements.ts`, gałęzie stylu w `scene.ts` (25 porównań) i `styleResources.ts` (39)) są w grze nieosiągalne. Pytanie: czy port obejmuje tylko styl `roblox` (rekomendacja operatora: tak, bo odpowiada temu, co gra rysuje), czy wszystkie 3 style?
- **D-MOD-2 — Pliki „Minecraft/Roblox” martwe.** Rozszerza D-REND-7: oprócz `minecraftScene.ts` i `robloxScene.ts` martwe w praktyce są `buildRobloxCity`/`buildRobloxRomeCity` (`robloxCity.ts:62,213`; jedyny importer to martwy `robloxScene.ts:12`). Czy je wyłączyć z portu?
- **D-MOD-3 — Modele bez użycia przez dane.** 5 modeli nazwanych bez rekordu `units.json` (Wojownik celtycki, Kusznik, Wojownik germański zwykły, Hieros Lochos nazwany, Legion Rzymski), martwe `buildHastati`/`buildBerserker`, 4 eksporty `jednostki-p1-rdzen` i zapasowe gałęzie kategorii. Port 1:1 (zachować) czy tylko modele osiągalne z danych (77 typów)?
- **D-MOD-4 — Miasta: zakres stylów cywilizacji.** Web ma żywe 2 zestawy miast brązu (Rzym, Grecja jako fallback dla 13 pozostałych państw) i 1 zestaw kamienia. Era Żelaza nie ma modelu (fallback do Brązu, `cities.ts:240`). Budynki nie wpływają na wygląd. Port 1:1 (z tymi lukami) czy rozszerzenie? Rozszerzenie nie jest portem, więc wymaga osobnej decyzji i tematu.
- **D-MOD-5 — Cuda „parkowane”.** 5 cudów `parkowane_epoka4plus` nie ma modelu. Pozostają bez modelu (default jak w web)?
- **D-MOD-6 — Zależności Rust dla geometrii i tekstur:** triangulacja `Extrude/Shape` (3+2 użycia), rasteryzacja Canvas/SVG i tekstu (9 plików), liczba modeli cieniowania (Std/Lambert/Basic). Wymaga zgody na biblioteki po decyzji P4.3.
- **D-MOD-7 — Narzędzia i testy renderu web** (36 plików three poza `gra/src`, w tym 34 w `gra/tools/**`). Czy służą jako generator referencyjnych zrzutów do §5 (bez portu), czy część ma być przeniesiona?
- **D-MOD-8 — Bitwa 3D.** Zakres zależy od D-REND-8. Czy paczka 14 jest w P4, czy w osobnym etapie?

---

## 7. `NIE_ZMIERZONO`

1. Podział LOC `battleScene.ts` na 3D i DOM.
2. Liczba typów zasobów z modelem względem danych zasobów (§2.4).
3. Liczba wariantów `tarasy-model.ts` (§2.5).
4. Parametry świateł sceny (§5 pkt 1).
5. Czy pętla `main.ts:36249` animuje modele (ruch jednostek).
6. Liczba presetów jakości i ich wpływ na geometrię (§3.3).
7. Estymacja czasu paczek (§4.1).
8. Dokładny przydział plików `jednostki-p*` do paczek epokowych (§4.2).
9. Ścieżki docelowe Rust w allowlistach (zależne od P4.3).

## 8. Odtwarzalność

Skrypty z pomiarów (pliki tymczasowe operatora, nie w repo): `inv.py` (LOC, R1, R3, importy), `extra.py` (R2, `new Mesh`, `getGeo`, anim/fog/lod), `prim.py` (`git grep -c` §1.2), `graph.py` (importerzy), `route.py` (symulacja routingu jednostek), `cov.py` (cuda/ulepszenia/budynki), `uses.py` (eksporty bez wywołań), `ufn.py` (opakowania vs geometria w `units.ts`). Każdy czyta wyłącznie `git show edb8fb56:…` / `git grep … edb8fb56` / `git ls-tree edb8fb56`. Reguły: §0.2.
