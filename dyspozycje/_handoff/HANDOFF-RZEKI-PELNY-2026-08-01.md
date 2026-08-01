# HANDOFF RZEKI — pełny kontekst 2026-08-01

> **Dla:** mocniejszy model (planowanie / naprawa regresji FALA 138–139)  
> **Stan źródeł:** `STAN-PRACY-HANDOFF.md` (2026-08-01 ~21:11) · ROBOCZA **`0b70e93f`** (FALA 141, 21:06) · **main** `9c4320b` (fix ujść) + `6556fa7` (coast InstancedMesh)  
> **Wejście gry:** `gra-robocza/START.html` · Ctrl+F5 + **Nowa gra**

---

## 0. Po co ten plik

Maciej 2026-08-01 ~19:27: *„rozpisz mi wszystkie problemy, jakie do tej pory były zapisane w temacie rzek oraz moje decyzje"*. Ten dokument zbiera **jednym miejscem**:

- kanon i decyzje produktowe Macieja o rzekach,
- zgłoszone problemy (otwarte + zamknięte w serii FALA 125–139),
- oś czasu deployów i commitów,
- aktualny stan kodu w ROBOCZA `73c18fc2`,
- constrainty twarde z czatu 2026-08-01,
- hipotezy root cause (tylko z plików, bez zgadywania),
- ścieżki kodu i bramki testów.

**Spawn (MAP-SPAWN-Q2)** — poza zakresem naprawy rzek; wzmianka tylko tam, gdzie FALA 138 mieszała spawn z fill rzek.

---

## 1. Kanon / reguły Macieja (ustalone decyzje)

| Data | ID / źródło | Decyzja / cytat | Status wdrożenia |
|------|-------------|-----------------|------------------|
| 2026-07-03 | **D-MAPA-DELTA** | **A — Delta:** u ujścia rzeka rozszerza się (fan 2–3 heksy jaśniejszej wody) w `#82C8E0`; delta zastępuje wąski pas piasku u ujścia | 🟢 wdrożone (render `renderCoastalRiverExtension`, `computeRiverDeltaHexKeys`) |
| 2026-07-04 | **MAPA-RZEKI-SPEC** | Siatka N×N: min. 1 główny nurt/komórkę; **tylko krawędzie hex** (Roblox); meander łagodne S, bez pętli; main + tributary (50% szerokości); anty-klaster przy górach | 🟢 bazowy kanon; parametry siatki **ewoluowały** (FALA 125–129) |
| 2026-07-04 | ABC siatki (spec) | A=10 / **B=14** / C=18 hex — tier Mało/Normalnie/Dużo | 🟡 częściowo nadpisane: FALA 127 → 10×10 suchy płat; FALA 129 → 5×5; FALA 128+ stride 1 |
| 2026-07-05 | **DESIGN-RZEKI-SIECI** | Sieć dopływów: rzeka ~25 hex, może kończyć w **innej rzece** (nie tylko morze); mniej ujść; junction = koniec biegu; 100% wody spływa do oceanu | 🟢 wdrożone (B0.7/B0.8 + późniejsze prune) |
| 2026-07-05 | **B0.10** | **Zakaz pierścieni rzecznych** — max 3–4 krawędzie/heks; równoległe biegi ≥3 hex → junction; `trimRiverPathRings`, `checkNoRiverRings` | 🟢 wdrożone |
| 2026-07-20 | **RIVER-Q1/Q2/Q3** | Q1=**A1** napraw u źródła · Q2=**B1** nie ruszaj liczby rzek · Q3=**C2** precyzyjne fałszywe wcięcia wybrzeża | 🟢 wdrożone (`b217916e`) |
| 2026-07-20 | **WYBRZEŻE-Q1–Q3** | Wybrzeże = woda; pas 2 hex; rzeki do morza (uproszczone po zmianie wybrzeża) | 🟢 wdrożone |
| 2026-07-26 | **R-MAPGEN-KOLEJNOSC** | Pipeline: **teren → relief → rzeki → las → złoża** (Q1=B las, Q2=C ~15% górzystości, Q3=A wieloetapowy floor) | 🟢 wdrożone |
| 2026-07-28 | **E2-Q3** (gęstość) | Suwak rzek Mało/Normalnie/Dużo; baza 2/5/8 na małej mapie, skala proporcjonalna | 🟢 wdrożone (`resolveRiverMapParams`, `rivers_density`) |
| 2026-07-28 | Rzeka ruch | Koszt ruchu **1 MP** na heksie z rzeką (FALA 53; cofnięcie błędu 2 MP) | 🟢 wdrożone |
| 2026-07-29 | **R-HEX-PLONY** | Modyfikator „Rzeka" → **+2 glina/szt./turę** (`terrain-yields.json`) | 🟢 wdrożone |
| 2026-07-29 | **BUG-RZEKI-DOPLYWY** | *„Rzeki nie powinny się zaczynać i kończyć na lądzie, jeżeli co najmniej nie wpadną do innej rzeki lub morza"* | 🟢 wdrożone (`ensureRiverOutlets`, `finalizeTributaryPath`) |
| 2026-07-10 | **Render styl** | **Kanciasty wall-tracing** (`sharp=true`) — NIE centrolinia, NIE CatmullRom; commit `3d5da76` | 🟢 wdrożone |
| 2026-07-23 | **C-BTL-BROD-Q1=C** | Bród: ruch ×0,5, −25% atak/obrona w brodzie, +15% obrony brzegu | 🟢 wdrożone (osobny tor bitwy) |
| 2026-08-01 ~19:00 | **Constraint perf** | Główne rzeki było **~10 s** → po FALA 138 **>2 min** — do naprawy, **bez degradacji gęstości** | 🟢 **ZAMKNIĘTE** (~20 s OK, Maciej ~20:58) |
| 2026-08-01 ~19:17 | **Constraint efekt** | *„natomiast efekt rzek był całkiem nie najgorszy"* — **nie wracać do pustej mapy** | 🔵 obowiązuje przy fixach |
| 2026-08-01 ~19:18 | **Constraint ciągłość** | *„rzeka jeżeli gdzieś startuje, to powinna tak długo się wić, aż sięgnie innej rzeki lub oceanu"* — regres po FALA 138 | 🔵 W TRAKCIE |
| 2026-08-01 ~19:03 | **Constraint scena** | „Rzeki Uzupełnienie ~1 s OK"; „Budowanie sceny" **kilkanaście minut** (nie hang) — do naprawy | 🟡 scena: fix FALA 139; ujścia: fix `9c4320b` na main, **nie** w ROBOCZA |
| 2026-08-01 ~21:11 | **Constraint gęstość + diagnoza** | *„ilość generowanych rzek jest zadowalająca. Problem leży w tym ostatnim etapie."* — gęstość/mapgen **OK**; problem = **Budowanie sceny** (ostatni etap UI), nie generowanie rzek | 🔵 obowiązuje; kill-switch rzek stage 0–5 → **ODŁOŻONY** |

**Reguła `reguły mapa` (skrót kanonu generatora):**

- Brzeg: min. **10 hex** oceanu od krawędzi mapy.
- Rzeki (historyczny opis quota per kontynent) — **nieaktualny od 2026-07-04**; aktualna spec: `docs/obieg/MAPA-RZEKI-SPEC.md`.
- Playtest: Ctrl+F5 + Nowa gra.

---

## 2. Problemy zapisane (otwarte + zamknięte w tej serii)

### 2.1 OTWARTE (2026-08-01)

| ID | Objaw | Status | FALA | Constraint |
|----|-------|--------|------|------------|
| **BUG-SCENA-PERF-FALA138** | „Budowanie sceny" **nadal za długo** („tak nigdy nie było") | **W TRAKCIE** (ponownie, Maciej ~21:11) | 141 `0b70e93f` (coast InstancedMesh) — deploy mógł wisieć | Maciej ~21:11: gęstość rzek OK; problem = **ostatni etap = Budowanie sceny** (nie mapgen). Kill-switch rzek → **ODŁOŻONY** |
| **BUG-RZEKI-UJSCIE-FALA138** | Część rzek **urywa bieg na lądzie** zamiast ujściem w rzekę/ocean | **KOD NA MAIN** `9c4320b` — deploy FALA 140 | 138 `0c4faac` (tani fill) → fix `9c4320b` | Zachować gęstość; zweryfikować po deploy |
| **R-SCENA-PERF-FALA138** | Rejestr prosby — mirror BUG-SCENA | W TRAKCIE (ponownie) | j.w. | j.w. |
| **R-RZEKI-UJSCIE-FALA138** | Rejestr prosby — mirror BUG-RZEKI-UJSCIE | deploy FALA 140 | fix `9c4320b` | j.w. |

### 2.2 ZAMKNIĘTE / GOTOWE (kod) w serii 2026-08-01

| ID | Objaw | Status | FALA / commit | Uwagi |
|----|-------|--------|---------------|-------|
| **BUG-RZEKI-PERF-FALA138** | Etap UI „Rzeki — główne" **>2 min** (było **~10 s**) | **ZAMKNIĘTE** (Maciej ~20:58) | 140 `935d1642` | Maciej: **~20 s OK**; fix `d2db99c`+`9c4320b` |
| **R-RZEKI-PERF-FALA138** | Rejestr — mirror BUG-RZEKI-PERF | ZAMKNIĘTE | 140 | j.w. |
| **Perf uzupełnienie rzek** | „Rzeki — Uzupełnienie" ~**1 s** | **OK** (Maciej ~19:03) | — | Nie jest problemem |

### 2.3 ZAMKNIĘTE wcześniej (kontekst — nie regresja FALA 138)

| ID | Objaw | Status | Źródło | Constraint / uwaga |
|----|-------|--------|--------|-------------------|
| **BUG-RZEKI-DOPLYWY** | Dopływy kończą się na lądzie (Ziemia: prune przed reliefem) | **WDROŻONE** 2026-07-29 | `ensureRiverOutlets()` końcówka `generator.ts` | FALA 113 deploy; asercje map-gen-regression |
| **B0.1** | Rzeki kończą w polu — purge wody→ląd **po** `generateRivers` kasował ujścia | **WDROŻONE** 2026-07-05 | `BLEDY-DO-NAPRAWY` | Purge tylko PRZED rzekami |
| **B0.2** | Generacja rzek **wolna** — `pathEndsAtSea` woła flood-fill per próba | **WDROŻONE** (cache `oceanConnected`) | B1–B4 batch | Cel <60 s Super Huge |
| **B0.5 / B0.7 / B0.8** | Dopływy nie łączą wizualnie; delty bez rzeki; ujście nie w morzu; szatkowanie wstęg | **WDROŻONE** 2026-07-05 | `BLAD-B0.8-POLACZENIA-RZEK` | I1/I2/I3 inwarianty; `appendJunctionDownstreamHex` |
| **B0.8b** | Ujście nadal pod taflą wybrzeża (Y-order) | częściowo | hipoteza `riverMouthY` vs `coastWaterCapTopY` | Wariant „wodospad" później |
| **B0.10** | Pierścienie rzeczne / równoległe biegi | **WDROŻONE** | `trimRiverPathRings`, `checkNoRiverRings` | |
| **RZEKI-DIAGNOZA-UJSCIA** | Rzeka 1–2 hex przed morzem — dual render (wstęga lądowa vs delta) | **zdiagnozowane** 2026-07-09 | `RZEKI-DIAGNOZA-UJSCIA.md` | Fix render w iteracji 2026-07-10 |
| **BUG rzeka↔mgła** | Rzeka znika pod miastem przy mgle wojny | **fix wdrożony** (batch WIELKI) | `decorHiddenHexKeys` — tylko mgła chowa | Do weryfikacji wzrokowej |
| **Fix rzeka pod miastem** | Rzeka kasowana trwale pod zabudową | **WDROŻONE** | deploy `9f9ced35` | |
| **R-SOL-GLINA** | Glina tylko przy rzece | **ZROBIONE** | `gen-helpers.ts` kolejność złóż PO rzekach | C-MAP-SOL-ZIEMIA=B |

### 2.4 BACKLOG (nie blokuje FALA 139, ale zapisane)

| Temat | Opis | Źródło |
|-------|------|--------|
| **#7 Rzeka w bitwie — kara brodzenia etap B** | Jednostka w brodzie wolniejsza/podatna (mechanika mapy) | `STAN-PRACY-HANDOFF.md` §7 |
| **Szum morza/rzeki (`renderWoda`)** | Uśpiony — czeka dźwięk pozycyjny | handoff §7 |
| **Super Huge perf mapgen** | Timing baseline, nie blokuje determinizmu | `MAPA-STAN.md` |
| **B0.4 wybrzeże pustyni** | Zatoczki na pustyni | backlog MAPA |

**Liczba wpisów problemów w sekcji 2:** **18** (4 otwarte + 14 zamknięte/backlog z ID lub kodem B0.x).

---

## 3. Oś czasu zmian (FALA / commity) — co włączono/wyłączono

### 3.1 Seria 2026-08-01 (FALA 125–139) — chronologia rzek

| FALA | md5 | Czas | Commity | Co włączono / wyłączono (rzeki + powiązane) |
|------|-----|------|---------|---------------------------------------------|
| **125** | `31210b68` | 07-31 23:08 | `0bee2e8`…`05b2b89` | Twardy start siatki; ujście morze/dopływ; dłuższe trasy; wybrzeże jasne |
| **126** | `f37ec466` | 08-01 00:06 | `ab0a848` · `2107581` | **3 etapy** rzek (główne/średnie/krótkie); inland BFS dry patches; rzeki LOD3 |
| **127** | `490884f4` | 08-01 09:56 | wiele | Max suchy płat **10×10** (100 hex); Glinianka |
| **128** | `58755ecf` | 08-01 10:16 | `5eb6234` | MAIN **stride 1**; suchy płat = cały ląd bez rzeki; fill przez wzgórza/góry; niższy próg komórki |
| **129** | `2806b932` | 08-01 11:19 | `b86913a` · `1873d07` | Siatka **5×5** (Normalnie/Dużo); Mało 10×10; mainGridStride 1; inland fill; post-prune topUp |
| **130** | `85767de4` | 08-01 12:52 | `3f85613` | Start **od oceanu** w głąb; min **3 hex** między main; bez wymogu góry; zakaz pętli |
| **131** | `2cb47461` | 08-01 13:35 | `2237ffe`… | UI **10 etapów** postępu; wizualne **zbiegi** rzek na wspólnej krawędzi |
| **132** | `a2b17df5` | 08-01 13:44 | `ea85db8` | Granice państw (nie rzeki) | |
| **133** | `ac743f2e` | 08-01 17:19 | `4959679` | MAP-SPAWN-Q2 (spawn, nie rzeki) | |
| **134** | `474c49c9` | 08-01 17:28 | `a790921` · `daaf91b` | **ROI perf:** 1 topUp po prune; twarde limity coverage/proximity na Duży/Pangea; skip dekoracyjnych tributary; dry-patch → topUp |
| **135** | `5c9e2265` | 08-01 17:52 | `a5f099f` · `d6c008c` | **4 cięcia:** etap3 **OFF**; dry-patch **OFF**; bootstrap etap1; topUp **max 1** |
| **136** | `84587206` | 08-01 17:59 | `ca90306` | Duży/Pangea: `effectiveTopUpPasses=0` (skip hardStarts/proximity/dry-patch/cache) |
| **137** | `09e5ecb7` | 08-01 18:43 | `6c56c96` | `computeRiverMouthEdgeKeys` **raz na mapę**; yield w overlay; fix zamrożenia timera sceny (~20 s) |
| **138** | `cbc79e63` | 08-01 18:54 | `a06a615` · `0c4faac` | Spawn Q2 + **tani fill:** `effectiveTopUpPasses=1`, hardStarts **bez proximity**, Pangea bootstrap 40–60, Duży `mainGridStride` 2 → **regres perf + ujść** |
| **139** | `73c18fc2` | 08-01 19:20 | `25b6135` · `d2db99c` | Scena: mergeDecor, robloxLite >8k, batch rzek; mapgen: **fastTrace**, cache **mainKeys**, mniej prób ujść — **częściowy** perf głównych |
| **post-139** | — | 08-01 ~19:30+ | `9c4320b` | Fix ujść: `ensureRiverOutlets` po topUp + po wybrzeżu; `scrubStrayRiverHexMarks` — **tylko main**, brak w ROBOCZA `73c18fc2` |

### 3.2 Kluczowe commity (SHA + opis)

| SHA | Opis |
|-----|------|
| `a5f099f` | perf(mapa): 4 cięcia ROI rzek Duży/Pangea (etap3/dry/bootstrap/topUp1) |
| `ca90306` | perf(mapa): wyłącz ciężkie topUp/fill Duży/Pangea |
| `6c56c96` | fix(mapa): odblokuj Budowanie sceny — yield/guard po bootstrap rzek |
| `0c4faac` | fix(mapa): tani fill rzek — 1× hardStarts bez proximity (gęstość bez minut) |
| `a06a615` | MAP-SPAWN-Q2 (wyspy + 7 typów) — **nie algorytm rzek** |
| `d2db99c` | perf(mapgen): szybsze główne rzeki Pangea/Duży — fastTrace, cache mainKeys |
| `25b6135` | fix(render): scene build minuty→sekundy po FALA 138 (637 rzek, 40k hex) |
| `9c4320b` | fix(mapa): bramki ujść po topUp/wybrzeżu + scrub oznaczeń poza trasami — **na origin/main**, **nie** w bundle ROBOCZA `73c18fc2` |

### 3.3 Wzorzec przyczynowy FALA 134→138

1. **FALA 134–136:** agresywne cięcia perf na Duży/Pangea → gęstość spada, czas spada.
2. **FALA 138 (`0c4faac`):** przywrócenie gęstości **tanim** fill (topUp=1, hardStarts bez proximity) → Maciej: efekt OK, ale **>2 min** głównych + **ujścia inland**.
3. **FALA 139:** naprawa **sceny** + **częściowa** optymalizacja mapgen; ujścia inland — fix `9c4320b` **zacommitowany na main**, ale **poza** bundle ROBOCZA `73c18fc2`.

---

## 4. Aktualny stan kodu

### 4.1 Bundle ROBOCZA (FALA 139 `73c18fc2`)

- **md5 pełne:** `73c18fc2ed030bf6c2fb2666b5c83676`
- **Stempel:** `ROBOCZA · 2026-08-01 19:20`
- **Commit deploy:** `a2df580` FALA 139 DEPLOY ALL
- **VERIFY:** OK (tsc 0)
- **⛔ Brak w bundle:** commit `9c4320b` (fix ujść) — jest **tylko na `origin/main`**, nie w `gra-robocza/`

### 4.1b Main (`origin/main`) — poza ROBOCZA

- **`9c4320b`** `fix(mapa): bramki ujsc po topUp/wybrzezu + scrub oznaczen poza trasami.`
- Pliki: `gra/src/map/generator.ts`, `gra/src/map/gen-helpers.ts` — **zacommitowane i na origin**, **nie** w dirty tree

### 4.2 Generator (`gra/src/map/generator.ts`) — pipeline rzek

Kolejność (skrót):

1. `clearRiverMarks` → `generateRivers` (faza 6 UI: „Rzeki — główne")
2. `stripRiverMarksFromOpenSea`
3. `pruneOrphanRiverPaths` → `pruneRiversNotReachingRealSea` (×2) → `pruneOrphanRiverPaths`
4. `topUpRiverGridCoverage` (faza 7 UI: „Rzeki — Uzupełnienie") — na Duży/Pangea: `effectiveTopUpPasses=1` (hardStarts, bez proximity/dry-patch po FALA 136 wyjątku)
5. ~~`ensureRiverOutlets` po topUp~~ — **w deploy 139 brak**; **w main `9c4320b` jest** (nie w bundle)
6. Relief, lasy, złoża…
7. `ensureRiverOutlets` po złożach (BUG-RZEKI-DOPLYWY)
8. `finalizeCoastAndInlandWater`
9. ~~ponowne `ensureRiverOutlets`~~ — **w main `9c4320b`** (po wybrzeżu; nie w bundle 139)

### 4.3 Mapgen perf (FALA 139 `d2db99c`)

- `fastTrace = true` dla `pangeaSingleMass || largeMapPerf`
- Cache `mainKeys` w `topUpRiverGridCoverage` / `tryPlaceMainRiverFromCoast`
- Mniej prób ujść na dużych mapach

### 4.4 Render sceny (FALA 139 `25b6135`)

- `gra/src/render/mergeDecor.ts` — `collapseToMergedMesh` bez pełnego `updateMatrixWorld(true)` per overlay
- `gra/src/render/mapRenderStyle.ts` — `robloxLite` wymuszony przy **>8000 hex** (Duży/Pangea)
- `gra/src/render/scene.ts` — batch meshy rzek medium (**32/trasa**); cache `computeRiverMouthEdgeKeys` (z FALA 137)

### 4.5 Metryki z playtestu / diagnozy (FALA 138)

- ~**637** ścieżek rzek
- ~**40k** hexów (Duży/Pangea)
- „Rzeki — Uzupełnienie" ~**1 s**
- „Rzeki — główne" **>2 min** (regres)
- „Budowanie sceny" **kilkanaście minut** przed FALA 139 (po 139: oczekiwane sekundy — **do pomiaru Macieja**)

---

## 5. Co nadal w toku

### 5.1 Zadania otwarte

| Tor | Agent / status | Cel |
|-----|----------------|-----|
| **BUG-SCENA-PERF-FALA138** | **W TRAKCIE** (ponownie) | Budowanie sceny — FALA 141 coast InstancedMesh (`0b70e93f`); Maciej ~21:11: gęstość rzek OK, problem = ostatni etap sceny |
| **BUG-RZEKI-UJSCIE-FALA138** | deploy FALA 140 `935d1642` | Zweryfikować ciągłość ujść + gęstość po deploy |
| Pomiar Macieja | **częściowy** (~21:11) | Rzeki ~20 s OK ✓ · gęstość OK ✓ · scena nadal za długo ✗ · kill-switch rzek **ODŁOŻONY** |

### 5.2 Stan kodu ujść — **nie dirty tree**

Fix ujść **`9c4320b`** jest **zacommitowany i na `origin/main`** — `gra/src/map/gen-helpers.ts` i `gra/src/map/generator.ts` **nie** są w dirty tree.

**Treść commita `9c4320b` (na main, nie w bundle `73c18fc2`):**

- `generator.ts`: `ensureRiverOutlets()` **zaraz po topUp** + **ponownie po `finalizeCoastAndInlandWater`**
- `gen-helpers.ts`: `scrubStrayRiverHexMarks()` — czyści `hex.rzeka` poza zachowanymi trasami, przebudowuje `markRiverPath`

**ROBOCZA FALA 139 `73c18fc2`:** nadal **bez** `9c4320b` — gracz na `gra-robocza/START.html` widzi stan sprzed fixu ujść.

**Ryzyko (do weryfikacji po deploy):** triple `ensureRiverOutlets` może **obcinać gęstość** — sprzeczne z constraintem Macieja ~19:17; wymaga pomiaru liczby ścieżek przed/po.

### 5.3 Pliki tymczasowe / diag (repo, nie deploy)

Wiele `gra/tools/_tmp-river-*`, `.river-*-bundle.cjs` — harnessy diagnostyczne sesji 2026-08-01 (phase timing, audit, grid).

---

## 6. Constrainty twarde (nie łamać)

1. **Główne rzeki:** było **~10 s** → po FALA 138 **>2 min** — **ZAMKNIĘTE** (~20 s OK na FALA 140 `935d1642`, Maciej ~20:58).
2. **Uzupełnienie rzek:** ~**1 s** — **OK**, nie psuć.
3. **Budowanie sceny:** **nadal za długo** — Maciej ~21:11: *„Problem leży w tym ostatnim etapie"* (ostatni etap UI = Budowanie sceny, **nie** mapgen rzek). FALA 141 `0b70e93f` (coast InstancedMesh) — **W TRAKCIE**. Kill-switch rzek stage 0–5 → **ODŁOŻONY**.
4. **Efekt/gęstość po FALA 138:** Maciej ~21:11: *„ilość generowanych rzek jest zadowalająca"* — **nie cofać** gęstości; nie robić eksperymentu „wyłącz wszystkie rzeki".
5. **Ciągłość:** rzeka startująca musi dojść do **innej rzeki LUB oceanu** — brak sierot na lądzie.
6. **Perf cięcia FALA 135–136** (Duży/Pangea): etap3 OFF, dry-patch OFF, topUp=0 potem tani fill topUp=1 hardStarts **bez proximity** — balans perf↔gęstość jest **świadomym kompromisem**; nie przywracać pełnego etap3/dry bez pomiaru.
7. **Spawn:** MAP-SPAWN-Q2 — **poza** tym handoffem (tylko wzmianka: FALA 138 bundle łączy spawn + fill).
8. **Determinizm:** `map-gen-regression-test` — hash A=B + **0 rzek bez ujścia** — bramka nienaruszalna.
9. **Styl renderu:** kanciasty wall-tracing (`sharp=true`) — bez powrotu do centrolinii/splajnów.
10. **Nie ruszać `main.ts`** w pracy lane MAPA (Integrator F).

---

## 7. Hipotezy root cause (zebrane z plików — nie zgadywać nowych)

| # | Hipoteza | Dowód w plikach | Dotyczy |
|---|----------|-----------------|---------|
| H1 | **FALA 138 `0c4faac`** włączyła tani fill (topUp=1, hardStarts, bootstrap 40–60, stride 2) → więcej tras + więcej pracy w `generateRivers` | `WERSJE.md` FALA 138; `PYTANIA-OTWARTE` BUG-RZEKI-PERF | Perf >2 min (**ZAMKNIĘTE** ~20 s OK) |
| H2 | **`fastTrace`/cache mainKeys** (FALA 139) poprawia Pangea/Duży — **wystarczające** po FALA 140 | `d2db99c`; Maciej ~20:58 | Perf rzek (**ZAMKNIĘTE**) |
| H3 | **topUp dodaje ścieżki bez natychmiastowej bramki ujść** w deploy 139 → ścieżki bez morza/junction | fix `9c4320b` dodaje `ensureRiverOutlets` po topUp (main, nie bundle) | Ujścia inland |
| H4 | **`finalizeCoastAndInlandWater`** po `ensureRiverOutlets` **odcina** ujścia wizualnie/logicznie | komentarz w `generator.ts` (`9c4320b`) | Ujścia inland |
| H5 | **`scrubStrayRiverHexMarks`** — heksy oznaczone rzeką poza `paths` → wizualnie „urywane" biegi | `gen-helpers.ts` (`9c4320b`) | Ujścia / czytelność |
| H6 | Scena: **637 ścieżek × overlay wybrzeża × `updateMatrixWorld(true)`** | `PYTANIA-OTWARTE` BUG-SCENA; fix `25b6135` | Scena (częściowy fix — **niewystarczający**) |
| H7 | **`mapDetail=high`** nie włączał `robloxLite` na ~40k hex | BUG-SCENA root cause | Scena (częściowy fix) |
| H8 | Historycznie: **purge wody→ląd po rzekach** (B0.1) kasował ujścia — naprawione, ale **kolejność pipeline** pozostaje wrażliwa | `BLEDY-DO-NAPRAWY` B0.1 | Regresja jeśli kolejność złamana |
| H9 | Dual render: wstęga lądowa `break` na Wybrzeżu vs delta tylko dla `main` | `RZEKI-DIAGNOZA-UJSCIA.md` | Ujścia wizualne (starsze) |
| H10 | **`pruneOrphanRiverPaths` przed reliefem** (BUG-RZEKI-DOPLYWY) — naprawione przez `ensureRiverOutlets` na końcu; **relief/złoża** mogą nadal rozłączać bez ponownego prune | BUG-RZEKI-DOPLYWY wdrożenie | Ziemia / dopływy |
| H11 | **Wąskie gardło = Budowanie sceny (ostatni etap)** — Maciej ~21:11: gęstość rzek OK, *„Problem leży w tym ostatnim etapie"*; rzeki ~20 s OK | weryfikacja `935d1642` + `~21:11` | Scena (**otwarte**) |
| H12 | Eksperyment kill-switch wyłączania rzek (stage 0–5) **niepotrzebny** — gęstość zadowalająca | Maciej ~21:11 | Diagnoza → **ODŁOŻONY** |

---

## 8. Pliki kodu do czytania (ścieżki)

### 8.1 Generator / logika

| Plik | Odpowiedzialność |
|------|------------------|
| `gra/src/map/generator.ts` | Orchestracja pipeline; fazy UI 6–7; wywołania prune/topUp/`ensureRiverOutlets` |
| `gra/src/map/gen-helpers.ts` | `generateRivers`, `topUpRiverGridCoverage`, `traceRiver`, `ensureRiverOutlets`, `pruneOrphanRiverPaths`, `fastTrace`, `effectiveTopUpPasses`, `markRiverPath`, test exports I1/I2 |
| `gra/src/types/map.ts` | `riverPaths`, `riverPathKinds` |
| `gra/data/map-gen-params.json` | Parametry tierów (Panel-A) |

### 8.2 Render

| Plik | Odpowiedzialność |
|------|------------------|
| `gra/src/render/scene.ts` | `renderLandRiversFromPaths`, batch rzek, `cachedMouthEdges`, LOD |
| `gra/src/render/mapRenderStyle.ts` | `robloxLite`, `computeRiverMouthEdgeKeys`, `computeRiverDeltaHexKeys` |
| `gra/src/render/mergeDecor.ts` | `collapseToMergedMesh` (perf sceny) |
| `gra/src/render/riverLod.ts` | LOD wstęg rzek |

### 8.3 Dokumentacja / rejestry

| Plik | Zawartość |
|------|-----------|
| `docs/obieg/MAPA-RZEKI-SPEC.md` | Spec kanonu rzek |
| `docs/obieg/MAPA-KANON-GENERATOR.md` | Skrót + link do spec |
| `dyspozycje/RZEKI-DIAGNOZA-UJSCIA.md` | Diagnoza dual-render ujść |
| `dyspozycje/DESIGN-RZEKI-SIECI-DOPLYWOW-2026-07-05.md` | Decyzja sieci dopływów |
| `dyspozycje/BLAD-B0.8-POLACZENIA-RZEK-2026-07-05.md` | Inwarianty I1/I2/I3 |
| `dyspozycje/PYTANIA-OTWARTE.md` | BUG-RZEKI-* (sekcje ~1025, 1205+) |
| `dyspozycje/REJESTR-PROSB-I-ZADAN.md` | R-RZEKI-* (wiersze ~397+) |

---

## 9. Bramki / testy

### 9.1 Obowiązkowe przed deploy

```powershell
cd gra
npx tsc --noEmit
node tools/map-gen-regression-test.cjs   # determinizm A=B + 0 rzek bez ujścia
```

**Uwaga:** progi czasowe w map-gen-regression bywają FAIL na wolniejszej maszynie — **to pomiar wydajności, nie regresja logiczna** (liczy się A=B + 0 bez ujścia).

### 9.2 Testy lane rzek (celowane)

| Test | Co sprawdza |
|------|-------------|
| `river-path-adjacency-test.cjs` | Sąsiedztwo kroków ścieżki |
| `river-grid-coverage-test.cjs` | Pokrycie siatki ≥85% |
| `river-confluence-edge-test.cjs` | Zbiegi / wspólne krawędzie |
| `river-loop-test.cjs` | Brak pętli |
| `river-map-scale-test.cjs` | Skala mapy vs parametry (`resolveRiverMapParams`) |
| `river-sea-buffer-test.cjs` | Bufor od morza `RIVER_MIN_INLAND_FROM_SEA` |
| `river-terrain-move-test.cjs` | Koszt ruchu 1 MP na rzece |
| `map-continents-rivers-test.cjs` | Rzeki per kontynent |

### 9.3 Harnessy diag (sesja 2026-08-01, opcjonalne)

- `gra/tools/_tmp-river-phase-timing.cjs` — timing faz generateRivers
- `gra/tools/_tmp-river-audit.cjs` — audit ścieżek / ujść
- `gra/tools/.river-hier-diag-entry.ts` — hierarchia main/tributary

### 9.4 Kryteria akceptacji Macieja (2026-08-01)

| Metryka | Cel |
|---------|-----|
| „Rzeki — główne" | **~10 s** (nie >2 min) |
| „Rzeki — Uzupełnienie" | **~1 s** (utrzymać) |
| „Budowanie sceny" | **sekundy**, nie minuty |
| Gęstość wizualna | **≥ jakość FALA 138** (`cbc79e63`) |
| Ciągłość | **0** biegów kończących na suchym lądzie |
| map-gen-regression | A=B + 0 bez ujścia **PASS** |

---

## Załącznik A — cytaty Macieja (2026-08-01, dosłowne)

> ~19:00: „na razie z tym nic nie rób, tylko sobie zapisz" — główne rzeki **ponad dwie minuty**, wcześniej **~10 sekund**.

> ~19:03: „Rzeki Uzupełnienie to może jedna sekunda natomiast budowanie sceny nadal trwa bardzo długo."

> ~19:15: korekta — **nie hang/freeze**, ale **kilkanaście minut** Budowanie sceny.

> ~19:17: „natomiast efekt rzek był całkiem nie najgorszy."

> ~19:18: „część rzek zamiast wpadać do innej rzeki lub do morza kończyły w połowie lądu swój bieg… rzeka jeżeli gdzieś startuje, to powinna tak długo się wić, aż sięgnie innej rzeki lub oceanu."

> ~19:07: **„działaj"** — odblokowanie pracy agentów nad perf + ujściami.

---

## Załącznik B — powiązane decyzje poza generatorem (skrót)

- **Glina przy rzece** — spawn złoża + yield +2 (`R-SOL-GLINA`, `R-HEX-PLONY`).
- **Port / Port wielki** — wymóg wybrzeża lub rzeki miasta (`TEMAT 8` bramki budynków).
- **Irygacja** — heks z rzeką lub sąsiad (`A4-D4`, `KANON-ULEPSZENIA`).
- **Bitwa** — preset „rzeka", bród, rzeka głęboka nieprzekraczalna (`R-TEREN-BITWA-WERYF-WYNIK`).

---

*Koniec handoffu · wygenerowano 2026-08-01 dla przekazania mocniejszemu modelowi · źródła: `PYTANIA-OTWARTE.md`, `REJESTR-PROSB-I-ZADAN.md`, `STAN-PRACY-HANDOFF.md`, `WERSJE.md` FALA 125–139, `KANAL-PRACA.md`, `docs/obieg/MAPA-*`, historia B0.x / DESIGN / DIAGNOZA.*
