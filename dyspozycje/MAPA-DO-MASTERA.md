# MAPA → MASTER / SILNIK (raporty Q&A)

Zasada: append-only · najnowszy wpis na górze.

---

### [2026-07-05 ~13:20] MAPA · **strefy klimat A wąski** → **MASTER: GOTOWE**

**Dyspozycja:** `dyspozycje/_handoff/MASTER-do-MAPA_strefy-klimat-A-waski-2026-07-05.md`  
**Decyzja Macieja:** A wąski — `docs/decyzje/MAPA-STREFY-KLIMAT-ABC-2026-07-05.md`

**Wdrożenie:**
- `climateZoneAt(q,r,height)` + progi `CLIMATE_ARID_HALF_FRAC=0.075`, `CLIMATE_TROPICAL_HALF_FRAC=0.30` w `gen-helpers.ts`
- `classifyTerrain` / `classifyTerrainFlat` — pustynia tylko w `arid`; las wyłączony w `arid`; więcej lasu w `temperate` (−0.06 prog)
- `reapplyLandTerrain` + `reapplyForestOverlay` — strefa per heks; las w komórce arid pomijany; temperate ×1.35 udział
- `purgeDesertEnclaveWater` / `purgeOceanInsideEarthLandMask` / `sanitizeCoastHexes` — pustynia poza pasem arid → Łąka
- `generator.ts` — przekazanie strefy przy klasyfikacji i reapply
- `mapRenderStyle.ts` — dżungla (D-B2-3) gdy `climateZoneAt==='tropical'`, nie hash
- `scene.ts` — `mapHeight: map.wysokoscR` w `ForestParams`
- **NIE** `main.ts`

**Pliki:** `gra/src/map/gen-helpers.ts`, `generator.ts`, `render/mapRenderStyle.ts`, `render/scene.ts` (+ kopie `gra-robocza/src/...`)

**Test:** `node gra/tools/map-gen-regression-test.cjs` — rzeki 881/881 OK · determinizm IDENTYCZNY · duża 13.21s PASS · **standard 5.77s** (próg 5s — FAIL czasu, bez regresji funkcjonalnej)

**Warstwa:** 🟡 cross (generator + render dekoracji lasu)

**Do wpięcia F:** brak — lane MAPA only; Integrator tylko przy batchu z innymi lane'ami.

---

### [2026-07-05 ~12:00] MAPA · **C3 async buildScene + overlay do 1. klatki** ✅ ROBOCZA

**Dyspozycja:** `DYSPOZYCJA-WYDAJNOSC-MAPA-2026-07-05.md` §C3

**Fix:**
- `buildScene` → `async` z `onProgress` + yield co ~15k heksów (teren/dekor 5–72%, rzeki 75–88%, ocean/kamera 90%)
- `main.ts`: brak `loading.hide()` po generacji; overlay do pierwszego `renderer.render` (`mapLoadingOverlayPending`)
- Fazy po buildScene: „Przygotowanie gry" 94%/98% + `yieldUi` przed Unit/City renderers
- `ui-params.json`: Super Huge = **~320000 hex (672×476)** (zgodnie z `e-start-params.json`)

**Pliki:** `render/scene.ts`, `main.ts`, `data/ui-params.json`, `robloxScene.ts`, `minecraftScene.ts`  
**tsc:** 0

**DoD (Maciej):** Super Huge — overlay ciągły od kliknięcia do mapy; brak „Strona nie odpowiada"

---

### [2026-07-05 ~10:50] MAPA · **C1+C2 worker + loading + A1a LOD rzek** ✅ ROBOCZA

**Dyspozycja:** `DYSPOZYCJA-WYDAJNOSC-MAPA-2026-07-05.md` (kroki 1 i 3 częściowo)

**C1 Web Worker:** `genWorker.ts` + `mapGenAsync.ts` · `onProgress` w `generateMap` (6 faz PL)  
**C2 Overlay:** `ui/mapLoadingOverlay.ts` · `doStartGame` async  
**A1a LOD:** `zoomLod.ts` — rzeki wyłączone LOD 3–4  
**tsc:** 0 · build OK

**Następne:** B1–B4 · A2 · A4 · playtest Macieja

---


**→ MASTER: GOTOWE (playtest wizualny Macieja przed kanonem)**

**Root cause (Maciej):** `InstancedMesh` cullowany po bounding sphere w origin — gdy róg mapy wypada z kadru, znika cały typ terenu; dekor per-heks zostaje („pływa" na oceanie). Tooltip = ląd (dane OK).

**Fix:** `noInstancedFrustumCull()` → `frustumCulled = false` na wszystkich InstancedMesh w `scene.ts` (pryzmy terenu + dekor 1093–1172) + `rangeOverlay.ts`.

**Pliki:** `gra-robocza/src/render/scene.ts`, `rangeOverlay.ts`  
**tsc:** 0 błędów  
**Następne:** playtest superogromna (pan/zoom) · B0.5 delta rzeki (osobny batch render)

**Dyspozycja:** `dyspozycje/BLAD-B0.6-ZALANE-WYBRZEZE-2026-07-05.md`

---

### [2026-07-04] MAPA · T-TECH-9 Droga brukowana — wdrożenie terenu

**→ MASTER: GOTOWE**

**Decyzja:** T-TECH-9 **A** (Maciej paczka 1) · JSON już w `terrain-improvements.json`

**Warstwa:** 🟡 cross (ruch UNITS via import `map/road-movement.ts`; bez `main.ts`)

**Pliki:**
- `gra/src/map/road-movement.ts` — **nowy** · `applyRoadMovementModifier`, `hexHasRoad`, `bonus_ruch` z JSON
- `gra/src/map/improvement-build.ts` — upgrade `droga_brukowana` z `droga`, sieć dróg (collectRoadKeys + isRoadQualified)
- `gra/src/types/hex.ts` — `Ulepszenie.DrogaBrukowana`
- `gra/src/render/improvements.ts` + `robloxImprovements.ts` — model bruku
- `gra/src/units/setup.ts` — `terrainMoveCost` → import z `map/road-movement.ts` (1 linia integracji)
- `gra/tools/map-road-movement-test.cjs` — **nowy** test

**Testy lane:** map-road-movement **16/16** · map-improvement-qualify **43/43** · tsc OK

**Co sprawdzić po wpięciu (Integrator F):**
- `main.ts`: mapowanie `droga_brukowana` → `Ulepszenie.DrogaBrukowana`, emoji/HUD budowy, upgrade zastępuje drogę na hexie
- `buildModeHud.ts` / `improvepreview`: ikona bruku w galerii
- opcjonalnie `econ-params.json`: `ulepszenie_droga_brukowana_ruch` (obecnie czytane z JSON)

**Handoff F:** `dyspozycje/_handoff/MAPA-do-INTEGRATOR_droga-brukowana-main-2026-07-04.md` (do utworzenia przez Master)

---

### [2026-07-04 ~20:50] MAPA · miasta 3D roster 15 — mapowanie + hetyci v1

**Decyzja Maciej:** Harappa/Babilonia/Asyria→Sumer; Hetyci=Fenicjanie (szary kamień); Słowianie→Germanie.

**Kod:** `bronzeCity.ts` + `bronzeCityRoblox.ts` — typ `hetyci`, aliasy ikonaId, brama kamienna Roblox/classic. Sync `gra-robocza`.

**DoD:** tsc OK · podgląd `?pack=full&style=roblox&civ=hetyci`

**Czeka:** sign-off wizualny Maciej · build kanon MASTER · Opus review przed `Gra-podglad.html`

**Od 2026-06-29:** dyspozycje wysyła **SILNIK** (manifest `SILNIK-ROZDYSponowANIE-LANE-2026-06-29.md`). MASTER nie routuje.

---

### [2026-07-04 ~16:49] MASTER → kanon MAPA batch 2 (rzeki + gęstość)

**Kanon md5:** `89c372afe188e66fc61fa770859770b9`

**Zakres:** rzeki po krawędziach · ~10× gęściej · ląd +0,05 · doliny gór bez wody · spawn/skala z batch 1

**Bramka:** river-density 125 tras · smoke OK

**Archiwum:** `gra-kanon_20260704-164934` (`31c6db16…`)

---

### [2026-07-04 ~16:28] MASTER → kanon MAPA batch (Maciej `master`)

**Kanon md5:** `31c6db16e4baab67355ac093bf7bc034` · start: `gra-kanon/START.html`

**Zakres:** spawn 3/5/B · skala kreatora mp≤9 · rzeki · złoża wybrzeże · `startCityState`

**Bramka:** map-scale 32/32 · cluster 129/131 · deposit 20/20 · river 478/478 · smoke OK

**Archiwum:** `gra-kanon_20260704-162823` (poprzedni pole-bitwy `d1a61c24…`)

---

### [2026-07-04 ~16:25] MAPA → MASTER — skala kreatora: mp max 9 + typy (Maciej A)

**Status:** GOTOWE w `gra/` · **bez kanonu**

**Decyzja Macieja:** twardy sufit **9** miast-państw; typy cywilizacji osobna skala; **Ogromny** 10 typów / **Super Huge** 12 typów domyślnie.

| Plik | Zmiana |
|------|--------|
| `e-start-params.json` | domyślne mp/typy (fix 11/13/15) |
| `newGameMapDefaults.ts` | tabele min/def/max, `MAX_MIAST_PANSTWA=9`, fix `defaultCivTypes` |
| `map-scale-menu-test.cjs` | regresja menu (nowy) |

**Handoff:** `dyspozycje/_handoff/MAPA-do-MASTER_skala-kreator-mp9-2026-07-04.md`

**Bramka:** `node tools/map-scale-menu-test.cjs` · `rozmiar-label-test.cjs` · `cluster-start-test.cjs`

**MASTER:** review + build batch (razem ze spawn/rzeki/krowy jeśli możliwe) → Opus → kanon

---

### [2026-07-04 ~10:46] MAPA → MASTER — sesja popołudniowa (2× mapy, brzegi, zoom, inland water)

**Status:** GOTOWE w ROBOCZA · handoff `F-do-MASTER_sesja-2026-07-04-map-ui-units.md`

| # | Temat | Pliki | Test |
|---|--------|-------|------|
| 1 | Poszarpane brzegi + trim enclosed ocean | `gen-helpers.ts`, `generator.ts` | coast-buffer 115/115 |
| 2 | Brak wody w lądzie (kontynenty) | `gen-helpers.ts` (`trimEnclosedOceanOnly`) | forest-parity inland 0 |
| 3 | Mapy **2×** liniowo | `map-gen-params.json`, `clusters.ts`, `newGameMapDefaults.ts` | playtest rozmiary |
| 4 | Zoom kamery 2× + far clip | `main.ts`, `scene.ts` | wizualny |
| 5 | Lite forest meshes (palma/dżungla) | `mapRenderStyle.ts` | forest-parity 101/101 |

**ROBOCZA md5:** `53ec508f48b7a9e13e152b1ba5d44644`

**MASTER:** bramka + Opus + kanon po playteście Macieja

---

### [2026-07-04 ~09:32] MAPA → MASTER — zamknięcie sesji (Maciej: „jak skończysz to master”)

**Status:** GOTOWE w ROBOCZA · czeka playtest Macieja · **STOP kanon** (P0 miasto/UI).

**Pakiet sesji 2026-07-04 (MAPA):**

| # | Temat | Pliki | Test |
|---|--------|-------|------|
| 1 | Prześwit oceanu przy zoomie | `render/scene.ts` | wizualny |
| 2 | Domyślny ląd/morze **20/80** | `gen-helpers.ts`, `newGameFlow.ts`, `main.ts` | `land-sea-ratio-test` 9/9 |
| 3 | Kontynenty ≠ Pangea przy małym lądzie | `generator.ts` (`sparseLand`), `gen-helpers.ts` | playtest |

**Decyzje Macieja (gameplay, bez ABC formalnego — bezpośrednia dyspozycja w czacie):**
- Standard **20% lądu / 80% morza** (wszystkie typy świata)
- Suwak zaawansowany 20–80% bez zmian
- Kontynenty muszą być oddzielnymi masami, nie jednym lądem jak Pangea

**MASTER — akcje:**
- **Brak batcha SILNIK** — ścieżka kreatora → `generujSwiat` kompletna
- **Kanon:** dopiero po `playtest OK` od Macieja + Opus
- **Otwarte:** werdykt playtestu ocean/zoom + kształt kontynentów @ 20%

**ROBOCZA:** md5 `ad5cc87c86b1f6988dd6245e7463f869` · `gra-robocza/START.html`

---

### [2026-07-04 ~09:30] MAPA — ląd/morze 20/80 + kontynenty ≠ pangea przy małym lądzie · ROBOCZA

**Decyzja Macieja (korekta):** domyślnie **20% lądu / 80% morza** (było 30/70). Kontynenty wyglądały jak Pangea — korekta generatora.

**Ratio:** `defaultLandFractionForTyp()` → `0.20` · UI/kreator/main fallback 20.

**Kontynenty przy ≤35% lądu (`sparseLand`):**
- brak centrum w (0.5, 0.5) — same oddzielne masy na pierścieniu
- mniejsze promienie mas (0.09–0.15)
- większy `minCenterDist` (0.34) + pierścień centrów dalej od środka
- szersze cieśniny w `landMaskKontynenty`

**Pliki:** `gen-helpers.ts`, `generator.ts`, `newGameFlow.ts`, `main.ts`, `MAPA-KANON-GENERATOR.md`

**Test:** `land-sea-ratio-test.cjs` 9/9

**ROBOCZA md5:** `ad5cc87c86b1f6988dd6245e7463f869` · `gra-robocza/START.html`

**Playtest:** Ctrl+F5 → Nowa gra → Kontynenty vs Pangea przy domyślnym suwaku 20%.

---

### [2026-07-04] MAPA — domyślny udział lądu 30/70 (decyzja Macieja) · GOTOWE w ROBOCZA

**Decyzja Macieja:** standardowo **30% lądu / 70% morza** dla każdego typu świata; reszta — suwak zaawansowany (20–80%).

**Kod (`gra/src/`):**
| Plik | Zmiana |
|------|--------|
| `map/gen-helpers.ts` | `defaultLandFractionForTyp()` → `0.30` (wszystkie typy) |
| `ui/newGameFlow.ts` | domyślny suwak 30%; hint UI; fallback indeksów |
| `main.ts` | fallback `landFractionPercent ?? 30` przy starcie gry |

**Kanon docs:** `docs/obieg/MAPA-KANON-GENERATOR.md` § Rozmieszczenie lądu

**Testy:** `land-sea-ratio-test.cjs` **9/9** (poprawka asercji 70% → mapa superogromny — bufor brzegu ogranicza małe mapy)

**ROBOCZA:** sync + build · md5 `30da5d342b44a7caa36d988e4202b043` · `gra-robocza/START.html`

**MASTER — bez wpiecia `main.ts`:** ścieżka kreatora już przekazuje `landFractionPercent` z `newGameFlow`; brak batcha SILNIK.

**Kanon `Gra-podglad.html`:** STOP (P0 miasto/UI) — promocja po playteście Macieja + Opus.

**Playtest Macieja:** Ctrl+F5 → Nowa gra → porównaj Kontynenty / Pangea / Wyspy przy domyślnym suwaku 30%.

---

### [2026-07-03] HANDOFF → MASTER (Maciej OK) — pakiet mapa+miasta

**Maciej OK:** obwódka miast na mapie świata.

**MASTER:** `_handoff/MAPA-do-MASTER_HANDOFF-2026-07-03.md` (zbiorczy checklist)

**Zawartość pakietu:**
- Obwódka dyplomacyjna (`cityMapOutline.ts`) ✅
- Żeton 👥/⚔ nad miastem (`cityMapStatChip.ts`)
- P0 regresje terenu (faza A — czeka werdykt po nowej grze)

**DZIENNIK:** wpis HANDOFF 2026-07-03 · kanon playtest w `Gra-podglad.html` · Opus przed sign-off

---

**Prośba Macieja:** delikatna obwódka heksu — miasta giną w terenie; **nie** dotyczy overlay okolicy w panelu miasta.

**Kolory:** gracz `#7EC8E8` · wojna `#FF4444` · neutral `#5CB85C` · sojusz `#1A4A8A`.

**Pliki:** `cityMapOutline.ts` · `cities.ts` (`syncMapOutlines`) · `main.ts` (`cityMapOutlineKindForOwner`, refresh po dyplomacji).

**Handoff:** `dyspozycje/_handoff/MAPA-do-MASTER_obwodka-miast-mapa_2026-07-03.md`

---

**Dyspozycja Macieja:** „prowadź” — MASTER domknął kod + build (Opus przed oficjalnym sign-off kanonu).

**P0-1 D-B2 (las/dżungla):** usunięto `autumn`/`#FF8822`; sosny ciemne, liściaste jasne; dżungla = `isWarmJungleForestHex` + palmy/parasol (`mapRenderStyle.ts`).

**P0-2 generator:** `applyDoubleCoastRing` + `removeInlandWaterPools` w pipeline (`gen-helpers.ts`); miedź → **Wzgórza** (D-RUDY).

**P0 render wybrzeże:** Wybrzeże roblox = jednolity `#82C8E0` bez blendu z lądem (`scene.ts`).

**P1 hex miasta:** `hideDecorAtHex` ukrywa też prism terenu; `reapplyCityHexDecorHides()` po rebuild playtest/wczytaniu (`main.ts`).

**P1 obwódka zasięgu:** `borderBandWidth: 0` + płaska Y w `rangeOverlay.ts` / `cityOkolicaOverlay.ts`.

**Testy:** map-coast-buffer **91/91** · logic **203/203** · smoke baseline-red (`openStartupMainMenu` — znany, nie regresja tego batchu).

**Build:** `$TEMP\civ-dist` → `Gra-podglad.html` (playtest Macieja).

**Maciej:** Ctrl+F5 · **nowa gra** · werdykt A (brzeg) nadal otwarty.

---

---

---

### [2026-07-03] FIX range overlay — zasięg okolicy „rozjechany” z terenem

**Zgłoszenie Macieja:** siatka zasięgu miasta (panel otwarty) nie pokrywa heksów mapy — widoczny drift siatki względem terenu.

**Przyczyna:**
1. `rangeOverlay.ts` — obrót tintu `Math.PI/6` vs `scene.ts` rot Y=0 (30° rozjazd w XZ).
2. Stare `TERR_TOP` (np. Wzgorza 0.65) zamiast `terrainVisualForStyle` Roblox (0.50).

**Fix:** `terrainSurfaceTopY()` w `mapRenderStyle.ts` · wyrównanie orientacji heksa · `cityOkolicaOverlay.ts` ten sam model Y.

**Test:** smoke OK · map-coast-buffer 81/81.

---

### [2026-07-03] P0 brzeg hybryda C + delta A — → MASTER: GOTOWE

**Decyzje:** D-MAPA-BRZEg **C** · D-MAPA-DELTA **A**  
**Handoff:** `dyspozycje/_handoff/MAPA-do-MASTER_brzeg-hybrid-C-2026-07-03.md`

**Hybryda C (render):**
1. **Ląd** — `buildStyleLandCoastSandCap`: pas piasku ~30% promienia od krawędzi w stronę Wybrzeża (`COAST_SAND_ROBLOX`).
2. **Wybrzeże** — `buildStyleCoastSandTopCap`: pełna górna powierzchnia piasku; `buildStyleCoastWaterCap`: jasnoniebieska tafla **tylko** od strony Morza (boxy kierunkowe, nie pod piaskiem przy lądzie).
3. **Profil** — `ROBLOX_TERRAIN_VIS[Wybrzeże]`: top ≈ 0.40 (było 0.30), mniejszy „schodek” względem lądu 0.45.

**Delta A:**
- `computeRiverDeltaHexKeys` — fan 2–3 heksów Wybrzeże u ujścia (śledzenie wstecz path → Morze/Ląd).
- Heks delty: woda fan + pominięcie piasku top; rzeka brzegowa szersza (×2.05) w kolorze wybrzeża.

**Testy:** `map-coast-buffer-test.cjs` **81/81** · `smoke.cjs` OK · warstwa 🟡.

**Integrator:** batch po dyspozycji Master — bez zmian `main.ts` w lane.

---

**Zgłoszenie Macieja (3 punkty):** brak piasku wszędzie; szczelina wody między piaskiem a lądem; rzeki kończą na lądzie.

**Fix piasek:**
- Pas przesunięty NA krawędź wspólną (`apothem + depth/2`) — styk z lądem bez płytkiej wody.
- Tafla wybrzeża mniejsza (R×0.86) — woda nie wchodzi pod pas piasku.
- Pomijanie piasku tylko na **ujściu rzeki** (`riverMouthEdgeKeys`), nie na całym heksie z rzeką.
- Wszystkie krawędzie ląd↔Wybrzeże (bez limitu maxStrips).

**Fix rzeki:**
- `traceRiver` domyka path na heks Wybrzeże.
- `buildCoastalRiverPointChain` — odcinek brzegowy wzdłuż `riverPaths` + przedłużenie 1.05R w wodę.
- Poziom tafli wybrzeża dla strefy brzegowej.

**Playtest:** Ctrl+F5 + **nowa gra** (generator zmieniony).

---

### [2026-07-03] FIX A-COAST-SAND-v5 — piasek widoczny + rzeka wzdłuż riverPaths do wybrzeża

**Zgłoszenie Macieja:** brak piasku; rzeka nie dochodzi do morza (urywa się hex przed wybrzeżem).

**Przyczyny:**
1. Piasek za cienki/nisko (stripH 0.026R) — niewidoczny z izometrii.
2. Render rzeki opierał się na `traceRiverVertices`, który kończy wcześniej niż `riverPaths` — brak odcinka ląd→Wybrzeże.
3. `riverMouthY` poniżej tafli wybrzeża — woda rzeki pod taflą.

**Fix:**
- Piasek: ~2× wyższy/szerszy, bliżej krawędzi lądu, `renderOrder=2`.
- `renderCoastalRiverExtension` — wstęgi wzdłuż końcówki `riverPaths` (centra heksów) → Wybrzeże + 0.85R w wodę.
- `coastalRiverKeySet` — obniża odcinki vpath przy brzegu.
- `riverMouthY = seaTop + 0.026R` (poziom tafli wybrzeża).

**Playtest:** Ctrl+F5 + nowa gra.

---

### [2026-07-03] FIX A-COAST-SAND-v4 — kwiatki w oceanie + brak tafli wybrzeża

**Zgłoszenie Macieja:** niebieskie artefakty w morzu (pętle wstęg rzek); brak jasnoniebieskiego wybrzeża; rzeki urywają się na piasku.

**Przyczyny:**
1. `buildRiverMouthPoints` skakał do **centrum heksów Morze** dla KAŻDEJ rzeki kończącej przy wybrzeżu → wstęgi w środku oceanu.
2. Wybrzeże prism zbyt nisko / pod taflą — widać tylko cienkie paski piasku.
3. Poziom rzeki przy brzegu nie obejmował heksów lądu z rzeką sąsiadujących z Wybrzeżem.

**Fix:**
- Usunięto skok do centrum Morza; ogon rzeki **tylko** gdy `riverReachesCoast`, wzdłuż końcówki `riverPaths` + krótki przedłuż (0.5R) w wodę.
- `buildStyleCoastWaterCap` — jasnoniebieska tafla 3D na heksie Wybrzeże (nad oceanem).
- `riverVertexAtCoast` — poziom tafli dla wierzchołków przy wybrzeżu / rzeka+Wybrzeże.
- Wybrzeże ROBLOX: niższy profil (top ≈ tafla morza).

**Test:** map-coast-buffer 63/63 OK. **Playtest:** Ctrl+F5 + nowa gra.

---

### [2026-07-03] FIX A-COAST-SAND-v3 — wybrzeże = woda + piasek na brzegu lądu, rzeka do morza

**Decyzja Macieja (spec brzegu):**
- Wybrzeże = **jasnoniebieska woda przybrzeżna** (cały heks `#82c8e0`)
- Piasek = **cienki pas 3D na heksie Wybrzeże**, tylko na krawędziach skierowanych do **lądu** (NIE na lądzie)
- Rzeka przy ujściu **wchodzi do wody**, nie kończy się na piasku

**Fix render:**
- `mapRenderStyle.ts` — `coastEdgeNeedsSand`: self=Wybrzeże + sąsiad=suchy ląd; piasek pomijany gdy sąsiad-ląd ma rzekę
- `buildStyleCoastSandEdges` — klin na Wybrzeżu w stronę lądu (apothem ×0.72)
- `scene.ts` — piasek tylko dla `TerenBazowy.Wybrzeze` (roblox)
- `scene.ts` — `buildRiverMouthPoints`: ujście oparte na `riverPaths` (ląd → Wybrzeże → Morze, poziom tafli)

**Build:** `Gra-podglad.html` przebudowany (vite → `$TEMP\civ-dist\index.html`).

**Test:** map-coast-buffer 63/63 OK.

**Playtest Macieja:** Ctrl+F5 + **nowa gra** (stary save = stary teren).

---

### [2026-07-03] FIX A-COAST-SAND-v2 + inland water — wybrzeże piasek, morze w lądzie

**Zgłoszenie Macieja:** brak opaski piasku / wybrzeża; morze znowu w środku lądu.

**Przyczyny wybrzeża:**
1. Heks Wybrzeże miał kolor **wody** (#76ABBE) — wyglądał jak morze, nie plaża.
2. Przy odkrytej mapie **ukrywaliśmy też Wybrzeże** pod taflą oceanu (fix A-COAST-FOG) — piasek znikał.

**Fix render:**
- `TERRAIN_ROBLOX[Wybrzeże]` = `COAST_SAND_ROBLOX` (#E8D4A0) — heks plaży to piasek.
- `setFog`: ukrywamy tylko **Morze** (głęboka tafla), Wybrzeże zostaje widoczne.
- Grubsze klocki piasku + pierścień 3D.

**Fix generator:**
- `removeInlandWaterPools` — usuwa odcięte Morse **i** Wybrzeże (BFS od krawędzi mapy).
- Pass końcowy 3b po złożach: inland water → applyCoastRing → sanitizeCoast.

**Minimapa:** `Wybrzeze: #e8d4a0`.

**WAŻNE dla Macieja:** **nowa gra** — stary zapis ma teren zapisany w save; fix generatora nie naprawia istniejącej mapy.

**Test:** map-coast-buffer 63/63 OK.

---


**Problem:** brak opaski piasku tam, gdzie ląd łączy się z morzem.

**Przyczyna (2×):**
1. Roblox celowo wyłączył piasek 3D (tylko Minecraft miał pierścień).
2. `coastEdgeNeedsSand` szukał sąsiada `Morze`, a generator robi bufor `Wybrzeże` między lądem a morzem (`applyCoastRing`).

**Fix:**
- `scene.ts` — piasek dla Roblox: klocki na lądzie + pierścień na `Wybrzeże`.
- `mapRenderStyle.ts` — sąsiad `Wybrzeże` też triggeruje opaskę; kolor `COAST_SAND_ROBLOX` (#E8D4A0, v2 warm).

**Test:** map-coast-buffer 43/43 OK.

---


**Decyzja Macieja:** „1 start” — wdrożenie v2 Warm batch 1.

**Zmiany:** `gra/src/render/mapRenderStyle.ts`
- `TERRAIN_ROBLOX` → v2 Warm (7 terenów)
- `styleScenePalette('roblox')` → niebo, ocean, rzeka, mgła, ramka v2
- Backup: `mapRenderStyle.ts.bak-MAPA-paleta-v2`

**Poza zakresem batch 1:** dekoracje 3D (las, tarasy, oazy), minimapa, kanon.

**Bramka Macieja:** playtest dev server / mappreview — nowa gra wystarczy. Checklist: ląd/morze, FoW, brzeg, rozróżnialność terenów.

**Następny krok:** Maciej „OK batch 2” → dekoracje 3D w tym samym pliku + `robloxCity.ts`.

---


**Feedback Macieja:** styl pastelowy/earth — „mega, mega”; v1 trochę za przygaszone → **cieplejsze**.

**Kanon docelowy:** MAPA-PALETA-PASTEL-v2-warm (nie v1).

| Teren | v2 Warm |
|-------|---------|
| Morse | `#5594AD` |
| Wybrzeże | `#76ABBE` |
| Łąka | `#94BF78` |
| Równina | `#B0CA7E` |
| Pustynia | `#E0C88E` |
| Wzgórza | `#7EA872` |
| Góry | `#9DA8B4` |

Scena: niebo `#D4E0E8`, ocean `#487892`, rzeka `#6AADBE`, mgła `#C8D6E0`, ramka `#9A8060`.

**Artefakty:** canvas `mapa-paleta-pastel.canvas.tsx`, mockup v2.

**Status:** Maciej może jeszcze ręcznie skorygować pojedyncze hexy → potem wdrożenie w `mapRenderStyle.ts` (lane MAPA) + dekoracje (krok 2).

---


**Problem:** jasnoniebieskie obrysy i „wycieki” w morze przy brzegu — regres po A-FOG.

**Przyczyna:** heksy Wybrzeże/Morze widoczne przy krawędzi mgły (ocean OFF, czarne tło) + duplikat wody (heks + tafla) po pełnym odkryciu.

**Fix `scene.ts`:** ukryj heksy wody na krawędzi FoW; Roblox: ukryj Morse+Wybrzeże gdy widać taflę oceanu.

---

**Problem (Maciej):** niebieskie „morze” w środku lądu między górami — powtarzający się bug.

**Przyczyna:** `classifyTerrain` — niska `elevContinental` na lądzie → błędnie `Morze`; regres render po usunięciu `robloxDeepSeaOnly`.

**Fix generator:** `removeInlandSeaPools()` + doliny na lądzie → `Łąka` (`gen-helpers.ts`, `generator.ts` pass 1a).

**Fix render:** Roblox — heksy `Morze` ukryte gdy widać globalną taflę oceanu (przy pełnym odkryciu mapy).

**Test:** `map-coast-buffer-test.cjs` + `findInlandSeaHexes`.

**Uwaga:** wymaga **nowej gry** (stara mapa w save ma stary teren).

---

**Było:** explored ×0.45 jasności · **Teraz:** `FOG_EXPLORED_BRIGHTNESS = 0.175` (`visibility.ts`) — mapa 3D + minimapa.

---

**Reguła:** unknown ląd **i** morze → czarne tło, heks ukryty. Po odkryciu → prawdziwy teren; FoW = dim ×0.45; pełny widok w zasięgu.

**Fix:** usunięto wyjątek `robloxDeepSeaOnly` (Morze zawsze ukryte) — morze po odkryciu jak ląd.

---

**Problem:** tło wokół nieznanego terenu było niebieskie (niebo + tafla oceanu zawsze ON).

**Fix:** `scene.ts` — przy `anyHidden`: tło `FOG_HIDDEN_COLOR` (czarne), ocean/ramka OFF. Pełna mapa odkryta → niebo + ocean jak wcześniej.

**Zachowane z A-FOG-02:** krawędź mgły bez dekor 3D · Morse roblox ukryte.

---

**Problem (Maciej playtest):** przy „Załóż miasto” odcięte heksy lądu wisiały na wodzie / czarnym tle.

**Przyczyna:** `setFog()` chował `oceanMesh` gdy jakikolwiek hex unknown → pustka zamiast wody.

**Fix (lane A):** `gra/src/render/scene.ts` — ocean + niebo **zawsze** widoczne; unknown heks = skala 0 (ląd znika, widać taflę).

**Warstwa:** 🟢 izolowana (render) · **w kanonie:** czeka rebuild Integrator F

**Backup:** `scene.ts.bak-MAPA-2026-07-02`

---

| ID | Decyzja |
|----|---------|
| **F-P1-01-Q1** | **A** — klik miasto bez muru: brak obrońców → zdobycie + **komunikat** (bez preBattle); są obrońcy → preBattle |
| **F-P1-01-Q2** | **A** — ruch na hex wrogiego miasta = **ten sam flow** co klik |

**Zaktualizowano:** spec · handoffy C+F · REJESTR · `A-mapa.md` echo

**Kod:** `resolveUnwalledCityAttack` w **SILNIK/F** (`main.ts` + ewent. hook po animacji ruchu)

---

### [2026-07-02] **→ MASTER: GOTOWE (spec)** — F-P1-01 atak wrogiego miasta z mapy

**Dyspozycja:** `MASTER-PILNE-2026-07-02` P1 ✅

| Deliverable | Plik |
|-------------|------|
| Spec kanon | `docs/decyzje/F-P1-01-atak-miasta-z-mapy.md` |
| **Handoff A→C (kanon)** | `dyspozycje/_handoff/A-do-C_map-attack-city-F-P1-01.md` |
| Handoff A→C (skrót) | `A-do-C_map-attack-spec-F-P1-01.md` |
| Handoff A→F | `A-do-INTEGRATOR_map-attack-city-P1.md` |
| Moduł lane A | `gra/src/map/map-attack-city.ts` — `resolveEnemyCityClick()` |
| Test | `node gra/tools/map-attack-city-test.cjs` — **8/8** |

**W kanonie już działa:** miasto **z murem** — klik → Oblężaj/Szturm/Anuluj → C3.  
**Luka (GAP-A1):** miasto **bez muru** — dziś hint zamiast preBattle/capture → batch C + F.

**P2 Panel-A:** ✅ (P7 sync, round-trip 0, PANEL-2-A 🟢)

**Testy lane:** map-attack-city **8/8** · map-siege **6/6** · qualify 43/43 · E2 28/28

**Akcja Master:** odblokuj **Grupę C** P1 · potem dyspozycja F (router `main.ts` §6 handoffu).

**`main.ts`:** NIE ruszony przez A ✅

**Slack:** `SLACK-OUTBOX-A-2026-07-02.md` § F-P1-01

---

### [2026-07-02] **→ MASTER: GOTOWE** — master sesja 4 (P7 Panel-A)

**Obieg:** ① start ✅ · ② **master** ✅

| Test | Wynik |
|------|--------|
| qualify | **43/43** |
| E2 | **28/28** |
| Panel round-trip | **OK** |
| export dry-run | **0 zmian** |

**Delta vs sesja 3:** **P7 Panel-A sync** ✅ — regen Excel, naprawa `map-gen-params.json`, PANEL-2-A 🟢 HUB OK. Warstwa 🟢 — **bez rebuildu kanonu**.

**Lane:** **IDLE** · A5 ✅ ZWERYFIKOWANA · brak otwartych ABC.

**Handoff:** `dyspozycje/_handoff/A-do-MASTER_stan-lane-2026-07-02.md` (zaktualizowany § P7)  
**Slack:** `docs/obieg/SLACK-OUTBOX-A-2026-07-02.md` § ping sesja 4

**Akcja Master:** brak P0 · opcjonalnie REJESTR PANEL-2-A · Maciej może kręcić balans w Excelu.

---

### [2026-07-02] MAPA lane — **P7 Panel-A sync** (start)

**Zadanie:** aktualizacja panelu sterowania — audit gap JSON ↔ Excel po A5 / A-R7.

| Element | Wynik |
|---------|--------|
| Gap audit | 4 wiersze **plantacja** (usunięte z gry D3) — wycięte regenem |
| `map-gen-params.json` | uzupełniony (złoża rarity, `standardowy`, default W/H) |
| `gen-panel-a.py` | regen `Panel-A.xlsx` · 9 arkuszy · 184 wiersze parametrów |
| `export-a.py` | fix porównania int/float (1 vs 1.0) |
| Testy | round-trip ✅ · dry-run **0 zmian** · qualify 43/43 · E2 28/28 |

**Maciej:** możesz kręcić balans w `panele-sterowania/Panel-A.xlsx` → w czacie: **`eksportuj panel`**.

**Nie w panelu (celowo):** A-R7 łodzie=terytorium miasta (reguła kodu); A5 miasta Roblox (wizual, nie balans).

**Status:** lane ✅ · czeka **`master`** (brak zmian kodu gry — 🟢 izolowana).

---

### [2026-07-02] **→ MASTER: GOTOWE** — ping master sesja 3

**Start:** qualify **43/43** · E2 **28/28**  
**Delta vs sesja 2:** ghost **`buildSettlementModel`** ✅ w `gra/src/main.ts` (SILNIK).  
**Kanon:** md5 **`2fc96381…`** · REJESTR **A5-Roblox ✅ ZWERYFIKOWANA** · playtest OK Maciej 2026-07-02.

**Lane A5:** **ZAMKNIĘTE** — idle, brak otwartych handoffów lane.

**Slack:** `SLACK-OUTBOX-A-2026-07-02.md` § ping sesja 3

---

### [2026-07-02] **→ MASTER: GOTOWE** — ping master sesja 2 (brak delta)

**Start:** qualify **43/43** · E2 **28/28** · lane idle.  
**Master sesja 1:** bez zmian — **src ✅ · kanon ❌ · ghost SILNIK ❌**

**Handoff (bez zmian):** `A-do-MASTER_stan-lane-2026-07-02.md` · F + SILNIK settlement Roblox  
**Blokuje:** rebuild Integrator F · wpięcie ghost `main.ts`

**Slack:** `SLACK-OUTBOX-A-2026-07-02.md` § ping sesja 2

---

### [2026-07-02] **→ MASTER: GOTOWE** — obieg start + master (A5 Roblox)

**Krok 1 start:** qualify **43/43** · E2 **28/28** · lane idle po wdrożeniu.  
**Krok 2 master:** rollup A5 Roblox → F rebuild + SILNIK ghost.

**Handoff:**  
- `_handoff/A-do-MASTER_stan-lane-2026-07-02.md`  
- `_handoff/MAPA-do-INTEGRATOR_settlement-roblox-kanon.md`  
- `_handoff/MAPA-do-SILNIK_settlement-roblox-ghost.md`

**Maciej:** sign-off podglądów ✅ · playtest kanon po F.

**Slack:** `docs/obieg/SLACK-OUTBOX-A-2026-07-02.md`

---

### [2026-07-02] **→ INTEGRATOR + SILNIK** — miasta Roblox wdrożone (lane)

**Lane MAPA ✅:** `settlementModel.ts` · `cities.ts` · `stoneCityRoblox.ts` · `bronzeCityRoblox.ts`  
**Handoff:** `MAPA-do-INTEGRATOR_settlement-roblox-kanon.md` · `MAPA-do-SILNIK_settlement-roblox-ghost.md`  
**Maciej:** sign-off podglądów · playtest po rebuild F

---

### [2026-06-26] **→ MASTER: GOTOWE** — ping master (sesja 2, brak delta)

**Krok 1 start:** qualify **43/43** · E2 **28/28** · lane idle.  
**Krok 2 master:** **brak nowego kodu** od master sesji 1 tego samego dnia — potwierdzenie stanu.

**Handoff (bez zmian):**  
- `_handoff/A-do-MASTER_stan-lane-2026-06-26.md`  
- `_handoff/A-do-MASTER_A5-roblox-preview-2026-06-26.md`

**Blokuje lane:** **A5-Roblox** — brak ABC Macieja w REJESTR.

**Slack:** `docs/obieg/SLACK-OUTBOX-A-2026-06-26.md` § ping sesja 2

---

### [2026-06-26] **→ MASTER: GOTOWE** — obieg start + master (Maciej)

**Krok 1 start:** qualify **43/43** · E2 **28/28** · lane idle.  
**Krok 2 master:** rollup + **A5-Roblox** podgląd (🟢 izolowany, nie kanon).

**Handoff:**  
- `_handoff/A-do-MASTER_stan-lane-2026-06-26.md`  
- `_handoff/A-do-MASTER_A5-roblox-preview-2026-06-26.md`

**Podglądy Maciej:**  
- `Civ-MAPA/Gra-podglad-MIASTA-BRAZ.html` (klasyczny)  
- `Civ-MAPA/Gra-podglad-MIASTA-BRAZU-ROBLOX.html` (Roblox · 10 cyw × poz. 1–10 × z/bez murów)

**A-R7:** kod ✅ · skan kanon 2026-06-26: gate terytorium **brak w bundle** → Master: F rebuild jeśli playtest potwierdzi.

**Slack:** `docs/obieg/SLACK-OUTBOX-A-2026-06-26.md`

---

### [2026-07-01] **→ MASTER: GOTOWE** — obieg start + master (Maciej)

**Krok 1 start:** self-check qualify **43/43** · E2 **28/28** · lane idle poza A-R7.  
**Krok 2 master:** rollup stanu lane → Master czyta repo.

**Handoff:** `_handoff/A-do-MASTER_stan-lane-2026-07-01.md`  
**Priorytet Master:** **P0 A-R7-REBUILD** (kod ✅ · `Gra-podglad.html` ❌)  
**Slack:** `SLACK-OUTBOX-A-R7-2026-07-01.md` + ping sesji start+master

**Lane czeka:** F rebuild kanonu A-R7 → potem playtest Maciej.

---

### [2026-07-01] **A-R7 BLOKER** — kod ✅ · kanon ❌ (Maciej słusznie: 3× decyzja, gra bez efektu)

**Przyczyna:** fix w `gra/src/improvement-build.ts` L436–438 + test **43/43**, ale **`Gra-podglad.html` = stary bundle** (case lodzie = tylko teren, bez terytorium). `gra-kanon/` i `gra-robocza/` też niezsynchronizowane.

**→ INTEGRATOR: PILNE** · handoff: `_handoff/A-do-INTEGRATOR_A-R7-rebuild-kanon-2026-07-01.md`

**Lane A dodatkowo:** `mainview/main.ts` duplikat qualifies — gate A-R7 (podgląd dev).

**Master:** dyspozycja F **rebuild kanon** (sam rebuild, bez ponownego ABC).

---

### [2026-07-01] MAPA lane — **C3-Q7=A** panel boczny + testy

**→ INTEGRATOR** (batch z A1-Q12-UI) · **NIE** `main.ts`

- `siegeMapPanel.ts` — layout boczny (Q7=A), bez pełnoekranowego dim
- Testy: map-siege **6/6** · oblezenie **27/27**

---

**→ MASTER: GOTOWE** · obieg 2026-06-30: **Maciej nie wkleja** — handoff w repo + Slack → Master czyta sam

| Batch | Lane | Testy |
|-------|------|-------|
| P1 Panel-A | ✅ | PANEL-MERGE A 3/3 |
| P2 FOOD-HODOWLA | ✅ | qualify M1–M7 |
| P3 E2 generator | ✅ | world-density **28/28** |
| P4 A1-Q12 + MAPA-F2 | ✅ UI | wymaga rebuild F |
| B2-Q5 🔥 hex | ✅ render | chip→kamera w kanonie F |

**Handoff:** `_handoff/A-do-MASTER_PACZKA-P1-P4-2026-07-01.md` · supplement `_handoff/A-do-MASTER_C3-Q7-layout-2026-07-01.md`  
**Slack outbox:** `docs/obieg/SLACK-OUTBOX-A-2026-07-01.md` (✅ wysłane #master + #grupa-a)

**Lane czeka:** dyspozycja **P5 C3** oblężenie od Mastera.

---

### [2026-07-01] MAPA → SILNIK: **E2 P3 generator — GOTOWE**

**→ SILNIK: GOTOWE** · **NIE** `main.ts`

**Co domknięte (lane MAPA):**
- `generujSwiat(..., WorldGenOptions)` — tiery surowce/rzeki/las/pustynia (E2 Maciej 2026-06-28)
- `map-gen-params-loader.ts` — runtime czyta `gra/data/map-gen-params.json` (Panel-A export)
- Test AC-7: `node gra/tools/world-density-test.cjs` → **28 pass, 0 fail** (determinism, Mało/Normalnie/Dużo, hodowla≠Gory)

**Handoff:** `_handoff/MAPA-do-SILNIK_E2-world-opts.md` (API bez zmian)

**Integrator:** przekazać `worldDensity` + `mapSizeMenuLabel` z kreatora przy `generujSwiat` (playtest MAPA dziś bez presetu w PLAYTEST-MAPA — osobny batch).

**Figma (Grupa A):** nadal **STOP layout** — czeka GOTOWE 00–02 lane UI.

---

### [2026-07-01] MAPA ← Grupa B (Miasto): **B2-Q5=C — ikona 🔥 buntu na hex**

**→ SILNIK: GOTOWE** (render lane) · **NIE** `main.ts`

**Decyzja:** B2-Q5=C — chip wydarzeń (B) + ikona na heksie (MAPA).

**Deliverable MAPA (już w repo):**
- `gra/src/render/cities.ts` — `getRevolt` w `CityRenderOptions` · sprite 🔥 (`_syncRevolt`, offset Y +1.2)
- Warunek widoczności: `bunt === true` **lub** `revoltWarning === true` (callback w `main.ts` — SILNIK)

**Handoff:** `_handoff/MAPA-do-SILNIK_B2-Q5-bunt-hex.md` · `_handoff/UI-do-GRUPA-A_B2-Q5-bunt-chip.md`

**Otwarte (SILNIK, nie MAPA):** klik chipa buntu → centrum kamery na `(q,r)` miasta (dziś tylko hint).

**Playtest:** wizualny 1× miasto z 🔥 vs bez — Maciej / Integrator.

---

### [2026-06-26] MAPA → INTEGRATOR: **FOOD-HODOWLA złoże=ulepszenie — GOTOWE**

**→ INTEGRATOR: GOTOWE F-FOOD-HODOWLA-01**

**Model Macieja (final):**
- Złoże krowy/owiec **zostaje** na mapie = implicit warstwa `bydlo`/`owce`
- Farma na złożu hodowl. = stack Farma+Bydło (jeden mesh)
- Budowa bydła/owiec **na złożu zablokowana** (auto-warstwa)
- Unlock imperium: farma (lub inna warstwa gracza) na złożu

**Deliverable MAPA:**
- Generator, kwalifikacja, render stack, galeria `?view=hodowla`
- Wstępna integracja `main.ts` (stack, sync, save/load warstw)
- Testy: `food-hodowla-test.cjs` 21/21 · `map-improvement-qualify-test.cjs` 34/34
- Build: `Gra-podglad.html` (robo — czeka Opus)

**Handoff:** `_handoff/MAPA-do-INTEGRATOR_hodowla-zloze-SILNIK.md`

**Czeka Integrator:** playtest I1–I7 · Opus review · batch konie (osobno)

---

### [2026-06-26] EKONOMIA → MAPA: **FOOD-HODOWLA P2 JSON GOTOWE** — **Twoja kolej P2**

**→ MAPA: START P2** (Panel-A + kod M1–M7)

**Od EKONOMII:**
- `terrain-improvements.json` — klucze `bydlo`, `owce`, `lama`; usunięto `pastwisko`
- API import: `livestock-unlock.ts`, `improvementKeysForHex()` — **nie duplikuj**
- Test: `node gra/tools/food-hodowla-test.cjs` (21/21)

**Handoff obowiązkowy:** `dyspozycje/_handoff/EKONOMIA-do-MAPA_kanon-zywnosc-hodowla.md`

**Panel-A (Twój):**
1. `python panele-sterowania/gen-panel-a.py` (bydlo/owce/lama już w generatorze)
2. Round-trip + `export-a.py` — eksport hodowli aktywny
3. Potem kod: `MASTER-do-MAPA_kanon-zywnosc-hodowla.md` M1–M7

**Integrator:** czeka na **MAPA → SILNIK: GOTOWE** (EKONOMIA już GOTOWE). Patrz `EKONOMIA-do-INTEGRATOR_kanon-zywnosc-hodowla.md`.

---

### [2026-06-29] MAPA ↔ B/Ekonomia — koordynacja panelu (Maciej)

**Ustalenie Macieja:** lane **Miasto/Ekonomia (B)** robi swoją część; po GOTOWE przekaże **całość** → **Grupa A** wpina do **Panel-A** (jeden eksport, bez duplikacji).

**MAPA teraz:** **NIE** rozszerza Panel-A o te same parametry — czeka na paczkę od B.  
**Po handoff:** `gen-panel-a.py` + `export-a.py` + ewentualnie nowe arkusze; meldunek w `MAPA-DO-MASTERA.md`.

**Już rozdzielone (bez kolizji):** bonusy ulepszeń terenu = Panel-A · zasięg okolicy miasta / Wealth = Panel-B · `epokiStartowe` w `civs.json` = lane E/CYW (nie Panel-A).

---

**Deliverable:** Panel-A uzupełniony (9 arkuszy) + `test-panel-a-roundtrip.py` OK  
**Nowe arkusze:** Plony-terenow, Ruch-po-terenie, Generator-rozmiary, Zloza-generator  
**Round-trip aktywny:** terrain-improvements, terrain-yields, terrain-movement  
**Handoff:** `_handoff/MAPA-do-INTEGRATOR_map-gen-params.md` (map-gen-params — kod czeka F)  
**P2:** FOOD-HODOWLA kod · **P3:** E2 wpięcie JSON

---

**Deliverable:** `panele-sterowania/Panel-A.xlsx` + `gen-panel-a.py` + `export-a.py`  
**Inwentaryzacja:** `docs/obieg/A-PANEL-INWENTARYZACJA.md`  
**Eksport:** `terrain-improvements.json` (ulepszenia + kanon FOOD) · `map-gen-params.json` (E2/mgła — zapis; kod czyta w P3)  
**Maciej:** edytuje Excel → **`eksportuj panel`** w czacie (bez terminala)  
**Następny krok lane A:** **P2 FOOD-HODOWLA** (kod) po akceptacji playtestu panelu

---

**Dyspozycja:** `dyspozycje/MAPA.md` § DO ZROBIENIA TERAZ  
**Handoff:** `_handoff/MASTER-do-MAPA_E2-gestosc-generator.md`  
**UI już wysyła:** `NewGameParams.civTypesCount` + `worldDensity` (kreator)  
**Po GOTOWE:** `→ SILNIK: GOTOWE` + `MAPA-do-SILNIK_E2-world-opts.md`

---

### [2026-06-29] MAPA → INTEGRATOR: **E1 las parity — GOTOWE**

**→ INTEGRATOR: GOTOWE** · **NIE** `main.ts`

**Fix:** `robloxLite` nie zmniejsza liczby drzew (3–5 stałe); lite = prostsze meshe only.  
**Pliki:** `mapRenderStyle.ts`, `scene.ts` (komentarz)  
**Test:** `node gra/tools/map-quality-forest-parity-test.cjs` → **98 pass, 0 fail**

**Handoff:** `_handoff/MAPA-do-INTEGRATOR_E1-jakosc-las-parity.md`  
**Decyzja:** `docs/decyzje/E1-jakosc-mapy-bundle.md`

**Czeka:** UI (jeden suwak) + SILNIK (bundle w main.ts) → potem rebuild kanonu.

---

### [2026-06-29] MAPA — E1 qualitypreview (3 presety obok siebie) — GOTOWE

**Podgląd:** `gra/src/qualitypreview/` · dev: `/src/qualitypreview/index.html?seed=424242&rozmiar=maly`  
**Offline:** `Civ-MAPA/Gra-podglad-JAKOSC-MAPY.html`  
**Build:** `npx vite build --config src/qualitypreview/vite.qualitypreview.config.ts`

3 panele: Niska | Średnia | Wysoka — ten sam seed, zsynchronizowana kamera.

---

### [2026-06-29] MAPA → INTEGRATOR: **MAP-P1-04 audit A4-D4 — GOTOWE**

**→ INTEGRATOR: GOTOWE** · **NIE** `main.ts`

**Fixy lane:**
- `terrain-improvements.json` — pastwisko tablica; warzelnia/plantacja teren
- `resource-access.ts` — parser `surowiecOdblokowany`
- `improvement-build.ts` — export `buildImprovementQualifier`
- `improvements.ts` — posterunek epoka 2
- `placementpreview` + `mainview` — sync kwalifikacji z kanonem

**Test:** `node gra/tools/map-improvement-qualify-test.cjs` → **18 pass, 0 fail**

**Handoff:** `_handoff/MAPA-do-INTEGRATOR_ulepszenia-audit-P1-04.md`  
**Audit doc:** `docs/decyzje/A4-D4-przeglad-ulepszen-terenu.md` § Weryfikacja (zaktualizowane)

**Otwarte:** R7 Łodzie bez terytorium — czeka ABC Macieja (nie blokuje P0).

---

### [2026-06-29] MAPA — MAP-S1 (P2) — podgląd full pack

**Status:** podgląd `gra/src/bronzepreview/main.ts` — tryb **`?pack=full`** (10 cyw × L1–10 × mur ON/OFF).  
**Czeka:** sign-off Macieja na podglądzie → potem handoff INTEGRATOR (rebuild kanonu, bez main.ts).

---

### [2026-06-29] MAPA — weryfikacja OBL-S6 (start sesji)

**→ INTEGRATOR: GOTOWE** · **NIE** `main.ts`

**OBL-S6** — moduł lane kompletny (wcześniejsza sesja, potwierdzone dziś):
- `siegeCampModels.ts` — modele z `siegepreview/` (namioty, żołnierze, taran, wieża)
- `siegeMarker.ts` — `buildSiegeCampGroup()` per hex obozu; kontrakt `machinesByCampHex` / `campOwnerByHex` / `ownerColorById`
- `siegeCampSync.ts` — `readyMachinesForCity`, `machinesByCampHex`, `campOwnerByHex`

**Handoff:** `_handoff/MAPA-do-INTEGRATOR_oboz-3D-OBL-S6.md`

**INTEGRATOR:** 1 batch w `refreshSiegeMarkers()` — podać `siegeMachines.ready[]` + kolory atakującego.

**Playtest wizualny:** dopiero po wpięciu przez INTEGRATOR (dziś bez `main.ts`).

---

### [2026-06-29] MAPA → INTEGRATOR: OBL-S6 + E-P0-04/05 GOTOWE

**→ INTEGRATOR: GOTOWE** (2 handoffy · **NIE** `main.ts`)

| ID | Temat | Pliki lane | Handoff |
|----|-------|------------|---------|
| **OBL-S6** | Obóz 3D oblężenia | `siegeCampModels.ts`, `siegeMarker.ts`, `siegeCampSync.ts` | `_handoff/MAPA-do-INTEGRATOR_oboz-3D-OBL-S6.md` |
| **E-P0-04/05** | Złoża miedzi/żelaza per epoka | `gen-helpers.ts`, `deposit-era.ts`, `styleResources.ts`, `resource-access.ts`, `improvement-build.ts` | `_handoff/MAPA-do-INTEGRATOR_zloza-epoki-E-P0.md` |

**Test:** `node gra/tools/map-deposits-era-test.cjs` → **11 pass, 0 fail**

**Integrator musi:** 1 batch `refreshSiegeMarkers` (machiny + kolory) · 1 batch overlay z `visibleZloze(era)` + `currentEra` w panelu miasta.

**Odłożone P2:** MAP-S1 (miasta 10poz) · 3 presety mapy — bez zmian w tej sesji.

---

### [2026-06-29] SILNIK → MAPA: dyspozycja (via MASTER)

**Od:** MASTER → **SILNIK** (Maciej: cała kolejka lane u SILNIK)  
**Czat:** **Grupa A** · komenda Macieja: **`start`**

| Priorytet | ID | Temat | Handoff |
|-----------|-----|-------|---------|
| **P0** | **OBL-S6** | Obóz 3D oblężenia | `MASTER-do-MAPA_oboz-3D-OBL-S6.md` |
| **P0** | **E-P0-04/05** | Złoża epok | `GRUPA-E-do-MAPA_zloza-epoki-8B-star.md` |
| **P1** | **MAP-P1-04** | Audit ulepszeń A4-D4 | `MAPA.md` |
| **P2** | **MAP-S1** | Miasta 10 poz + mury | `A5-do-MAPA_miasta-10poziomow-mury.md` |

**Po GOTOWE:** meldunek tutaj + `→ SILNIK: GOTOWE` · **NIE** `main.ts`

---

### [2026-06-26] MAPA: wybrzeże jasnoniebieskie + bufor 1 heks przed morzem

**Zgłoszenie Macieja:** wybrzeże żółte (piasek) zamiast jasnoniebieskiego; ląd nie powinien stykać się wprost z morzem.

**Render (`scene.ts`):**
- Roblox: usunięty żółty pierścień `buildStyleBeachRing` na heksie Wybrzeże + żółte klocki brzegowe
- Wybrzeże = kolor płyty `#44ccff` (blend tylko z Morzem/Wybrzeżem sąsiadów)

**Generator (`gen-helpers.ts`, `generator.ts`):**
- `applyCoastRing()` — suchy ląd przy Morzu → Wybrzeże
- Ponowne wywołanie po `removeTinyLandIslands` (wcześniej brakowało → ląd przy morzu)
- Test: `node gra/tools/map-coast-buffer-test.cjs` → 23 pass

**Status:** GOTOWE (render + generator). NIE `main.ts`.

---

**Decyzja Macieja:** obecny schodkowy relief (zielone stopnie + brązowe mury) = wizual **ulepszenia Tarasy**, nie bazowy teren Wzgorza.

**Zmiany (render-only, lane MAPA):**
- `mapRenderStyle.ts` — `addNaturalGreenHill()` domyślnie dla `Wzgorza` (różne odcienie zieleni, kopce + zarośla, bez murów tarasowych)
- `mapRenderStyle.ts` — `buildStyleTarasyTerrace()` eksportuje dawniejszy `addSteppedTerraceHill()` dla ulepszenia
- `robloxImprovements.ts` — `rbxTarasy` → `buildStyleTarasyTerrace('roblox')`
- `improvements.ts` — `tarasy()` dla minecraft → ten sam schodkowy mesh

**Podglądy:** okolicapreview / qualitypreview / gra — przez `buildScene` + `buildImprovement('tarasy')`.

**Status:** GOTOWE (render). Integracja `main.ts` nie wymagana.

---

(historia archiwum: `docs/archiwum/dyspozycje/MAPA-DO-MASTERA.md`)

---

### [2026-06-29] MAPA P2: FOOD-HODOWLA — Panel-A + M1–M7 GOTOWE

**→ SILNIK: GOTOWE** · handoff: `_handoff/MAPA-do-SILNIK_kanon-zywnosc-hodowla.md`  
**NIE** `main.ts` / kanon — batch F-FOOD-HODOWLA-01 czeka na SILNIK.

| Obszar | Pliki | Test |
|--------|-------|------|
| Panel-A hodowla | `gen-panel-a.py`, `Panel-A.xlsx`, `export-a.py` | round-trip OK |
| Kwalifikacja M1–M3 | `improvement-build.ts` | `map-improvement-qualify-test.cjs` **32 pass** |
| Render M4 | `improvements.ts`, `robloxImprovements.ts`, `buildImprovementStack()` | wizual |
| HUD M6 | `buildModeHud.ts` | bydlo/owce/lama ikony |
| Podgląd M5 | `placementpreview/main.ts` → `buildImprovementQualifier` | partial mainview TODO |

**Maciej:** edycja bonusów w Excelu → **`eksportuj panel`** w czacie lane A.

---

### [2026-06-29] MAPA: Galeria ulepszeń — odświeżona (17 typów + warianty + wzgórze)

- **`gra/src/improvepreview/`** — 3 widoki: wszystkie · warianty żywności · wzgórze vs tarasy
- Wzgórza: `buildStyleHillBump` + model ulepszenia (jak na mapie)
- Build: `Civ-MAPA/Gra-podglad-ULEPSZENIA-ROBLOX.html`
- Katalog: `docs/obieg/GALERIA-ULEPSZEN-TERENU.md`

---

### [2026-06-29] MAPA P2: Panel-A — epoka + pełne parametry hodowli

**Panel-A rozszerzony** (`gen-panel-a.py` → `Ulepszenia-FOOD`):
- **epoka** dla: farma, irygacja, tarasy, bydło, owce, lama, łodzie, obóz, warzelnia
- **pieniadz** obóz + warzelnia; **koszt** łodzie + warzelnia (brakujące wiersze)
- Regen `Panel-A.xlsx` + **`export-a.py`** (0 zmian — wartości zgodne z JSON) + round-trip OK

**Maciej:** może teraz balansować epokę hodowli i bonusy w Excelu → `eksportuj panel`.

---

### [2026-06-29] MAPA — weryfikacja E2 / P3 (Integrator F)

**Odpowiedź dla Integratora:** E2 **API generatora = GOTOWE** (`→ SILNIK: GOTOWE`). **P3 jako całość lane = NIE domknięte** (JSON runtime + test AC-7 + sync docs).

| # | DoD | Status | Komentarz |
|---|-----|--------|-----------|
| 1 | `generujSwiat(..., WorldGenOptions)` | **TAK** | `generator.ts` — `worldDensity` → rzeki, placeDeposits, progi las/pustynia |
| 2 | `resolveWorldGenNumbers()` kanon E2 | **TAK** | `newGameMapDefaults.ts` — 0,6/1/1,4 · 2/5/8×skala · progi las/pustynia · baseline 1,35 |
| 3 | Panel-A / `map-gen-params.json` | **NIE (runtime)** | Eksport działa; **kod nie czyta JSON** — stałe w `.ts` (handoff Integrator P3) |
| 4 | Testy lane A | **CZĘŚCIOWO** | `map-deposits-era-test` OK; brak `world-density-test.cjs` (AC-7); logic-test bez tierów E2 |
| 5 | Meldunek + flaga INTEGRATOR | **NIE** | Handoff `MAPA-do-SILNIK_E2-world-opts.md` ✅ 2026-06-26; brak meldunku E2-GOTOWE; flaga **→ SILNIK** nie → INTEGRATOR |

**Rozjazd docs:** handoff SILNIK = GOTOWE vs `MAPA.md` § P3 „CZEKA” — **korygowane:** API done, P3 JSON+testy open.

**Luki do zamknięcia P3:** (1) `world-density-test.cjs` Mało/Normalnie/Dużo + determinism · (2) opcjonalnie loader `map-gen-params.json` · (3) odhaczyć AC w `MASTER-do-MAPA_E2-gestosc-generator.md`.

---

### [2026-07-03] DECYZJE Macieja D-B2 (Batch 2 — las / dżungla grafika)

| ID | Decyzja |
|----|---------|
| D-B2-1 | **B** — bez pomarańczy; dwa odcienie zieleni |
| D-B2-2 | **C** — sosna ciemna, liściaste jasne |
| D-B2-3 | **A** — dżungla = wariant wizualny `Nakladka.Las` w strefie ciepłej (bez nowego hexu) |

**Pliki:** `mapRenderStyle.ts` (`addRobloxTree`, `buildStyleForestCluster`); hook biomu ciepłego w `buildScene`.

**AC:** brak `#FF8822`; sosny ciemne; liściaste pastel; biom ciepły → gęstszy las + palmy/parasol.

**BLOCKED:** werdykt brzegu (A) — potem lane MAPA.

---

### [2026-07-03] 🔴 P0 regresje playtest — BLOCK A

**Maciej:** czerwone drzewa + woda/morze na lądzie (screen).

**Handoff:** `dyspozycje/_handoff/MACIEJ-do-MASTER_MAPA-P0-regresje_2026-07-03.md`

| P0 | Fix |
|----|-----|
| P0-1 | Wdrożyć D-B2-1 B + D-B2-2 C w `addRobloxTree` |
| P0-2 | Generator: 2. pass `removeInlandWaterPools` po `applyCoastRing`; testy; rebuild kanon |

**Status A:** **BLOCK** — nie OK.

---

### [2026-07-04 ~16:55] MAPA → MASTER · rzeki ciągłe (ZINTEGROWANE)

**Problem Macieja:** rzeki jako luźno rozproszone kawałki (playtest po batch #2).

**Fix:** `scene.ts` — `renderLandRiversFromPaths` (ciągła wstęga z `riverPaths` + `buildRiverPointsFromHexPath`); `gen-helpers.ts` — mniej dopływów (max 3, tylko długie rzeki).

**Kanon:** md5 `7d4c1d9634cc0cd083e56d66beacca45` · archiwum `gra-kanon_20260704-165514`

---

### [2026-07-05] MAPA → MASTER · fair play A w grze (kreator → generator) + rzeki dwufazowe

**Decydent:** Maciej potwierdził **Opcję A (lustro rzek)** dla rzek, gór, wzgórz i lasu · minimum = twardy floor · tier kreatora = gęstość siatki + bonus szumu/procentów.

**Status integracji:** ✅ **prowadzi do gry** — ścieżka end-to-end:

```
newGameFlow (suwaki Mało/Normalnie/Dużo)
  → worldGenerationPresetFromLabels()
  → NewGameParams.worldDensity
  → main.ts generujSwiat(..., { worldDensity })
  → generateMap(..., genOpts.worldDensity)
```

**Domyślnie kreator:** wszystkie suwaki **Normalnie** (`ui-params.json` + `DEFAULT_WORLD_DENSITY`).

| Suwak kreatora | Tier | Siatka min. (Mało / Normalnie / Dużo) | Floor komórki | Bonus (ponad min.) |
|----------------|------|----------------------------------------|---------------|---------------------|
| **Rzeki** | `rivers` | 15 / **10** / 5 | 1 główna rzeka | min. długość 15/25/35 hex; faza lądowa → drenaż |
| **Góry i wzgórza** | `relief` | żelazo 35/25/20 · miedź 21/15/12 | 2 góry · 2 wzgórza | `reliefLandFractions` + ranking szumu |
| **Las** | `forest` | 15 / **10** / 5 | 1 las | `reapplyForestOverlay` (~22/36/50% suchego lądu) |

**Rzeki — reguły Macieja (2026-07-05, wdrożone):**

1. Ciało rzeki **min. 2 hex** od morza (`RIVER_MIN_INLAND_FROM_SEA`, `riverPathRespectsSeaBuffer`).
2. **Faza 1:** min. N hex w głąb lądu (Normalnie **N=25** via `riverMinPathLengthForTier`).
3. **Faza 2:** A* do **otwartego oceanu** (`buildOpenOceanDistanceField` — nie jezioro w lądzie).
4. Ujście: ostatnie ≤2 hex + `extendRiverToWybrzeze`.

**Pliki:** `gen-helpers.ts` (siatki, ensure*, traceRiver, generateRivers) · `generator.ts` (pipeline po finalnym wybrzeżu) · `newGameMapDefaults.ts` (tiery, minLen) · `newGameFlow.ts` (opisy suwaków).

**Robocza (playtest Macieja):** `gra-robocza/START.html` · md5 `7a644f55345c8de17a2b1e305cccd278` · **Ctrl+F5 + nowa gra**.

**Testy (Node, 2026-07-05):** fair-play-tier 12/12 · river-grid 12/12 · relief-grid 6/6 · fair-play-grid 8/8 · river-sea-buffer OK · kontynenty seed 42: **73/73** ujść przy otwartym oceanie.

**MASTER — DoD przed kanonem:**

- [ ] Opus review (Ask) — diff `gra/src/map/gen-helpers.ts`, `generator.ts`, `newGameFlow.ts`
- [ ] Build → `Gra-podglad.html` root po sign-off
- [ ] Opcjonalnie: perf generateMap (~4 min Node na Standard — do profilu, nie blokuje playtestu)

**BLOCKED na MAPA:** strefy klimatyczne (ABC jutro) — **nie kodować** bez decyzji Macieja.

**Handoff:** brak zmian w `main.ts` (lane MAPA). Integracja już jest w `generujSwiat` — MASTER tylko publikuje kanon po review.

---

### [2026-07-05] MAPA → MASTER · optymalizacja wydajności generateMap

**Problem (Maciej):** efekt mapy OK, ale generowanie zawiesza przeglądarkę (wielokrotne „strona nie odpowiada”), szczególnie **Ogromny Ziemia**.

**Diagnoza (wąskie gardła):**

1. **`ensureReliefGridCoverage` 2×** w pipeline + pętle 8×outer × 14×inner × iron+copper, przy każdej iteracji **`landHexesByCoverageCell` od zera**.
2. **`traceRiver`:** przy każdej próbie **`oceanConnectedWaterKeys`** (BFS całej mapy) + **A\*** z pełnym skanem `open` Set.
3. **`generateRivers` / `topUp`:** 6+8 passów siatki bez early-exit; fallback do **16 prób** `traceRiver` na komórkę.
4. **`ensureForestGridCoverage`:** 4 passy bez early-exit.
5. Przeglądarka: sync JS blokuje wątek UI (osobny koszt: **`buildScene`** po generacji).

**Wdrożone (tylko `gen-helpers.ts` + `generator.ts`):**

- Usunięty **duplikat** `ensureReliefGridCoverage` przed złożami; **`ensureDepositGridCoverage`** drugi pass **po** relief (złoża nie giną pod górami).
- Cache list komórek reliefu; **early-exit** w pętlach relief / las / rzeki.
- **`oceanConnected` + `openOceanDist`** liczone **raz** na `generateRivers` / `topUp`; przekazywane do `traceRiver`.
- Szybki odrzut źródeł bez połączenia z oceanem (`openOceanDist.get == null`).
- **Drenaż rzek:** greedy w dół `openOceanDist` (O(kroków)); A\* tylko jako fallback.
- Mniej fallbacków siatki rzek (6 zamiast 16).

**Pomiary Node (seed 42, tier medium):**

| Mapa | Przed (~) | Po |
|------|-----------|-----|
| Standard kontynenty 168×120 | ~240–250 s | **~60 s** |
| Ogromny Ziemia 336×238 | >10–20 min (timeout) | **~172 s (~3 min)** |

**Testy regresji:** fair-play-tier 12/12 · fair-play-grid 8/8 · relief-grid 6/6 · river-grid 12/12 · map-continents-rivers 8/8.

**Robocza:** `gra-robocza/Gra-podglad.html` przebudowana — **Ctrl+F5 + nowa gra** na `START.html`.

**Następne (wymaga MASTER + ABC Macieja):**

- **Pasek postępu** + `requestAnimationFrame` / yield między fazami (żeby UI nie myślało że freeze przy ~3 min Ogromny).
- Docelowo **Web Worker** dla `generateMap` (pełna responsywność).

**Handoff:** brak zmian w `main.ts`. Kanon root po Opus review.

**Maciej (playtest ~01:43):** czas generacji **akceptowalny** (wcześniej Standard ~1000 s). **Pasek postępu — później**, po śledzeniu (nie blokuje teraz).

**Maciej (playtest ~01:45):** rzeki ładne, ale **wizualnie nie trafiają do morza** — temat **jutro**. Hipoteza: bufor 2 hex (ciało) vs ujście (`RIVER_MOUTH_TAIL_LEN` + drenaż/render). Do rozstrzygnięcia: bufor tylko na źródło/fazę lądową, korytarz ujścia osobno.

**Maciej (playtest ~01:51):** **Super Huge** — rezygnacja po **~4 min** ciągłego „przywróć stronę”. **Jutro:** optymalizacja skali ~320k hex + **pasek postępu obowiązkowy** (nie tylko nice-to-have). Szacunek: Ogromny ~172 s Node → Super Huge **4× heksów**, w praktyce **10–20+ min** bez yield/Worker.

**Kolejność jutro (propozycja MASTER):** pasek postępu (UX od razu) → perf Super Huge (MAPA) → strefy ABC.

**MAPA batch ~08:30 (wdrożone w roboczej, bez main.ts):**
- Rzeki: `finishRiverMouthAtSea` + poprawka renderu wybrzeża (`scene.ts`)
- Pustynia: `sanitizeCoastHexes` nie tworzy Morza w lądzie; `purgeDesertEnclaveWater` na końcu pipeline
- Testy: river-sea-buffer 6/6 · river-grid 12/12 · continents-rivers 7/8 (1 fail wyspy 4×4 — do triage)

**Czeka Maciej:** playtest Ctrl+F5 + nowa gra → sign-off rzeki + pustynia.

**Kanon root:** po Opus review (diff: `gen-helpers.ts`, `generator.ts`, `render/scene.ts`).

---
