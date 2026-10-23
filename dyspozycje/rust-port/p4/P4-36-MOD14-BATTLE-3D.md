# P4-36 — MOD-14: bitwa 3D (`battle`), runda 1: mury oblężnicze + inwentarz `battleScene.ts`

**TEMAT:** R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1 · **DOMAIN:** GAME · **RUNDA:** 2/5 (obrona Operatora po FAIL Evaluatora r1; §10) · **ROLA:** Operator
**Baza:** `rust-port/parity-v2` @ `ba5dca73` (wymóg dispatchu: ≥ `ba5dca73`) · **Pin weba:** `edb8fb56`
**Paczka katalogu:** `R-RUSTPORT-P4-MOD-14-BATTLE-3D` (`P4-4-MODEL-CATALOG.md` §5 wiersz 14, D-REND-8 = B).

## 0. Streszczenie

**Runda 2 (obrona, §10):** zarzuty Evaluatora r1 nr 1, 2, 3, 4 — PRZYJĘTE. Klucze `Map` `-0` → `+0` (ECMA-262
`Map.prototype.set` krok 4) naprawione w `map_set`; 27 nowych przypadków brzegowych (`gateWidthTiles` 0 / 0,5,
`tileSize` 0, `rowLo = -0`) — fixtura r1 nie wykrywała błędu, nowa wykrywa (60+ różnic przed poprawką, 0 po);
mutant „bez gałęzi NaN” zabity testem jednostkowym (klucze NaN są nieosiągalne z API — §3a); inwentarz
przeliczony `inv3.py` (pola klasy, graf wywołań, użytkownicy stałych, nadpisania z powodem) — każdy symbol ma cel;
`gen.mjs` odtwarzalny bajt w bajt (`absWorkingDir`). Liczby poniżej są po r2, chyba że oznaczono „r1”.

1. **`battle/siegeWall.ts` (1 047 LOC) zportowany w całości** → `rust-port/renderer/src/battle/siege_wall.rs`:
   9 stylów (Grecja, Rzym, Sumer, Egipt, Inka, Chiny, Zulu, Celtowie, Germanie) + fallback
   (`aztek`, `hetyci`, nieznany klucz → Grecja), `attachRowBreachPanels`, pełny kontrakt `userData`.
   Wynik = jedno drzewo `scene::Scene` (P4.27) + typowane metadane `SiegeWallUserData`.
2. **Parytet bit w bit z webem** (kod weba uruchomiony na three@0.169.0 / node 22): 95 przypadków (r1: 68),
   11 877 meshy, **324 999 skalarów f64 równych bitowo + 240 425 porównań dyskretnych, 0 różnic**
   (drzewo węzłów, transformacje, macierze świata, geometrie — liczby wierzchołków/trójkątów, hash
   FNV atrybutów `Float32`, parametry konstruktorów —, materiały, współdzielenie materiałów,
   bbox, `userData` po budowie i po każdym `attachRowBreachPanels`).
3. **Mutacje 34/34 zabite** (r1: 32/32). Determinizm: generator w 2 różnych katalogach → identyczne SHA-256 `siege_wall.json` i `gen.mjs`; test także na rustc 1.87.0 (MSRV).
4. **Inwentarz `battleScene.ts` (19 493 LOC, 731 symboli)** z tabelą statusów:
   `dyspozycje/autobot/runs/R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1/inwentarz-battleScene.md`.
   Podział r2 (każdy symbol z celem, §3): scena do portu (RUNDA-2…5, w tym części 3D symboli MIX) 5 758 LOC
   (178 symboli), PODZIAŁ logika/scena 2 982 (108), WSPÓLNE stałe/funkcje domeny używane przez scenę 730 (72),
   UI DOM → P5 5 744 (192), audio → P5 1 239 (18), czysta logika → P6.13 2 357 (146), martwy kod 42 (7), typy 351 (16),
   preambuła 291. (r1, heurystyka: „logika” 8 479 LOC — zarzut 3.)
5. **Plan dalszych części** (§4): pole statyczne → jednostki i nakładki → dynamika/efekty → picking/kamera.
   Kryteria tematu nie są osłabiane: ten dokument zamyka tylko część „siegeWall + inwentarz”.
6. Ocena wizualna 1:1: **NIE_ZMIERZONO** (brak GPU) — lista „co ocenić wzrokiem” w §8.

## 1. Zakres rundy 1 i wykonanie GOAL

| element GOAL | stan po r1 | dowód |
|---|---|---|
| inwentarz `battleScene.ts` (LOC 3D vs logika vs UI, tabela symboli ze statusami i celem) | WYKONANE (r2: reguły A–D, §3) | `runs/…/inwentarz-battleScene.md`, `dowody/inv3.py`, `dowody/inv_summary.txt` (r1: `inv2.py`, `inv_summary-r1.txt`) |
| podział na rundy, jawny | WYKONANE (§4) | ten dokument |
| `siegeWall.ts` — 9 stylów murów | **PORTOWANY**, bit w bit | `tests/battle3d_siege_wall.rs`, `tests/fixtures/battle3d/` |
| scena bitwy 3D (teren, rozmieszczenie, efekty, oświetlenie/mgła, kamera, picking) | **RUNDA-2…5** (plan §4) | — |
| logika bitwy / UI DOM | NIE-DOTYCZY (P6.13 / P5) | inwentarz, kolumna status |
| mutacje ≥ 20 | 34/34 (r2) | `dowody/mutate-r2.txt` (r1: `mutate.txt`), `tests/fixtures/battle3d/mutate.py` |
| fixtury z manifestem sha256 (≤ 12 MB, plik ≤ 8 MB) | 7,69 MB katalog (7 693 229 B), największy plik `siege_wall.json` 7,23 MB (7 228 812 B) | `tests/fixtures/battle3d/MANIFEST.sha256` |
| determinizm (ziarno jak w webie) | `siegeWall.ts` nie ma RNG (`hash01` = `Math.sin`, `:39-42`); generator 2× = ten sam SHA | §6 |

**ZAŁOŻENIE Z-36-1 (luka dispatchu: „jawny podział w dokumencie”, a limit to 5 rund na ID):** części 2–5
opisane w §4 traktuję jako kolejne rundy robocze **albo** osobne ID (`…-Q2`…`-Q5`) — wybór należy do
orkiestratora. Rekomendacja: osobne ID, bo każda część ma własną pętlę FAIL/naprawa, a 5 rund jednego
ID nie zostawiłoby żadnej rundy naprawczej.

**ZAŁOŻENIE Z-36-2:** status tej rundy to `PASS-WITH-NOTES` na zakresie r1 (siegeWall + inwentarz);
temat MOD-14 jako całość pozostaje otwarty (scena bitwy nie jest zportowana).

## 2. Implementacja (`rust-port/renderer/src/battle/**`)

Nowy podmoduł `battle` (`src/battle/mod.rs`, `src/battle/siege_wall.rs`) + jedna linia `pub mod battle;`
w `src/lib.rs`. Bez nowych zależności, `Cargo.toml`/`Cargo.lock` bez zmian, `forbid(unsafe_code)` bez zmian,
żaden istniejący moduł nie zmieniony (używane tylko publiczne API: `scene`, `geom::cylinder_geometry`,
`jsmath::{js_sin, js_atan2}`, `core::bronze::BronzeCiv`).

### 2.1 Mapa symboli `siegeWall.ts` → Rust (wszystkie: PORTOWANY (3D))

| web (`siegeWall.ts`) | linie | Rust (`battle::siege_wall`) | uwagi |
|---|---|---|---|
| `SiegeWallOpts` | 19–25 | `SiegeWallOpts` (+ `new`, `battle` = wywołanie gry) | pola opcjonalne jako `Option` |
| `mk` | 27–33 | `W::mk` → `Material::standard(c, 0, 0.92)` | `side` nigdy nie podawany w pliku |
| `hash01` | 39–42 | `hash01` (`js_sin`) | |
| `shadeColor` | 47–52 | `shade_color` (`js_round`, ToInt32) | |
| `addMerlonRow` | 59–85 | `W::merlon_row` | `count` jako f64, pętla `i < count` |
| `addSimpleTurrets` | 93–137 | `W::simple_turrets` | |
| `buildWallBodySegmented` | 159–214 | `W::wall_body_segmented` | cache 5 koszyków materiałów; `Map.set` (SameValueZero, nowy klucz `-0` zapisany jako `+0` — r2, §3a) |
| `addStairs` | 224–262 | `W::stairs` | |
| `addPortcullis` | 271–333 | `W::portcullis` | grupa bramy tworzona pod rootem (kolejność dzieci jak w webie — §2.2) |
| `addWoodenGate` | 342–413 | `W::wooden_gate` | `js_atan2` |
| `buildGrecja` … `buildGermanie` | 416–976 | `build_grecja` … `build_germanie`, enum `WallStyle` (9) | |
| `buildSiegeWall` | 979–1001 | `build_siege_wall(BronzeCiv)`, `build_siege_wall_web_id(&str)`, `build_siege_wall_style` | `switch` → `WallStyle::for_civ` / `for_web_id` |
| `attachRowBreachPanels` | 1019–1047 | `attach_row_breach_panels` | |
| `userData` (`wallSegsByLocalX`, `wallWalkY`, `depth`, `gateCenterX`, `gate`, `gateOpen`, `rowWallMeshes`, `rowBreachPanels`) | 206–213, 470–474 …, 1043, 1046 | `SiegeWallUserData` (+ `keys()` w kolejności weba, `wall_seg`, `row_wall`) | mapy JS jako listy `(klucz, wartość)` w kolejności wstawiania |
| `CylinderGeometry(r, r, h, 8, 1, true, 0, π)` (łuk Sumeru) | 562 | `ArchCylinder` (`GeoBody`) | `Prim` nie ma `thetaLength`; minimalny typ we własnym module (dispatch: nie zmieniać `geom/**`) |

Pomocnicze JS-numeryki lokalnie w module: `js_round` (remisy do +∞, `-0`), `js_max`/`js_min` z propagacją NaN
(istniejące `pick::three::js_max/js_min` są zdefiniowane tylko dla nie-NaN, a przypadek `no-side` daje NaN).

### 2.2 Decyzje wierności

- **Kolejność dzieci grupy bramy:** web tworzy `new THREE.Group()`, dokłada dzieci, a `g.add(gateGroup)` robi na
  końcu `addPortcullis`/`addWoodenGate`; nic innego nie jest dodawane do `g` w międzyczasie, więc utworzenie grupy
  pod rootem od razu daje identyczny `traverse` (sprawdzone testem: indeksy rodziców wszystkich węzłów).
- **Łuk Sumeru:** `rotation.z = π/2; rotation.y = π/2` — dwa przypisania, każde przelicza kwaternion z całego
  Eulera (`rot_z(..).rot_y(..)`); porównane bitowo `r` i `q`.
- **Materiały:** jeden `Material` na każde wywołanie `mk` (jak `new MeshStandardMaterial`), współdzielone dokładnie
  tam, gdzie web współdzieli obiekt; test sprawdza bijekcję tożsamości materiałów web ↔ sloty Rust.
- **NaN:** `lengthTiles == gateWidthTiles` → `leftW = 0` → `0/0` w palisadach Zulu/Celtów/Germanów; pozycje
  i macierze NaN są odtwarzane z tymi samymi bitami (`0xfff8…`), bbox też.

## 3. Inwentarz `battleScene.ts` (pin `edb8fb56`)

### 3.1 Metoda (r2; r1 = `inv2.py`, tylko wzorce w ciele symbolu)

Źródło z pinu (`git archive edb8fb56 gra/src`) → `python3 -I dowody/inv3.py <battleScene.ts> inwentarz-battleScene.md dowody/inv_summary.txt`
(2 przebiegi → plik identyczny, `cmp`). Symbole jak w r1 (deklaracje najwyższego poziomu i metody klasy `BattleScene`,
731 symboli; liczniki `three`/`obj`/`dom` w ciele bez zmian). Dodane przebiegi — każdy symbol dostaje **cel** i **regułę**
(kolumny `status`, `uzasadnienie`):

- **A. Typy pól klasy** (290 pól deklarowanych w klasie, 149 otypowanych): 3D (typ/inicjalizator z `THREE.` lub `FloatLabel`) 18,
  DOM (`HTML*Element`, zdarzenia DOM) 105, AUDIO (WebAudio, `_amb*`, `_sfx*`…) 14, CAM (`camera`, `cam*`, `pan*`,
  `_camPanKeys`, `canvas` — rozmiar powierzchni WebGL wchodzi w matematykę kamery) 12. Metoda czytająca/pisząca
  `this.<pole>` jest przypisana wg pola. `RuntimeBattleUnit` (niesie mesh jednostki) celowo NIE jest typem 3D — to
  kontener stanu bitwy (`atk`, `def`, `occByKey`); próba z nim wciągała do sceny każdą regułę (czysta logika spadała do 1,3 k LOC);
  dostęp do mesha przez jednostkę łapie licznik `obj`.
- **B. Graf wywołań** `this.<metoda>(` do punktu stałego: metoda bez bezpośredniej zależności, która woła metody sceny →
  **PODZIAŁ** (logika → P6.13, wywołania sceny → zdarzenia/DTO dla rundy n); woła tylko UI → `PODZIAŁ … UI → P5` lub P5 (nazwa UI).
- **C. Stałe i funkcje modułu wg użytkowników** (każdy symbol, którego ciało zawiera identyfikator): tylko scena → ta runda;
  scena i logika → **WSPÓLNA** (stała domeny — scena trzyma kopię z testem równości; funkcja domeny — scena konsumuje wynik
  jako DTO); tylko UI → P5; bez użytkowników: eksport → logika (odbiorca poza plikiem), nieeksportowany → martwy kod.
- **D. Nadpisania z powodem** (20, lista w `inv_summary.txt`): m.in. wszystkie symbole z zarzutu 3 (niżej).

Przypisanie do konkretnej części 2–5 w obrębie sceny pozostaje słownikowe (nazwa) — to plan, nie twierdzenie o webie;
**cel** (scena / P5 / P6.13 / wspólne) jest wyprowadzony z pól, wywołań i użytkowników.

### 3.2 Wynik r2 (`dowody/inv_summary.txt`; r1: `dowody/inv_summary-r1.txt`)

| status | symbole | LOC | uwagi |
|---|---|---|---|
| RUNDA-2 pole statyczne (w tym MIX 700) | 74 | 2 515 | |
| RUNDA-3 jednostki/nakładki (w tym MIX 116) | 60 | 2 036 | |
| RUNDA-4 dynamika/efekty | 10 | 301 | |
| RUNDA-5 picking/kamera (w tym MIX 162) | 28 | 906 | kamera: `_tickCameraPanKeys`, `_tickZoom`, `_setPanKey`, `_applyCamera`, `_clampCamTarget`, … |
| **scena razem (port w tym temacie)** | **172** | **5 758** | r1: 3D+MIX 5 686 |
| PODZIAŁ (logika → P6.13, wywołania sceny → zdarzenia/DTO; ew. UI → P5) | 108 | 2 982 | port sceny obejmuje tylko punkt zdarzenia; udział LOC sceny NIE_ZMIERZONO |
| WSPÓLNA (stała/funkcja domeny używana przez scenę) | 72 | 730 | `BF_COLS`, `BF_ROWS`, `PLAYABLE_*`, `PLAY_*`, `TILE_S`, `DIR_DELTA`, `MAX_PER_SIDE`, `_carveBattleBox`, `_fencePlayableZone`, … |
| NIE-DOTYCZY → P5 (UI DOM) | 192 | 5 744 | `_unitTooltipHtml`, `HUD_*`, `_buildGeneralPanelBodyHtml`, HUD oblężenia, panele rozstawienia, minimapa |
| NIE-DOTYCZY → P5 (audio WebAudio) | 18 | 1 239 | `_sfx*`, `_startAmbient`, `_ensureAudio`, … (r1: „logika”) |
| NIE-DOTYCZY → P6.13 `domain/combat.rs` (czysta logika) | 146 | 2 357 | wybór kroku (`_best*Step`, `_firstStep*`), plany formacji, `relativeHit`, … |
| NIE-DOTYCZY (martwy kod: nieużywany i nieeksportowany) | 7 | 42 | np. `terrainFloorColor` (żywa kopia w `manualBattle.ts:140`) |
| NIE-DOTYCZY (typ TS) | 16 | 351 | |
| preambuła (importy, stałe przed 1. deklaracją) | — | 291 | |

Suma 19 203 + 291 = 19 494 linii (`wc -l` = 19 493 + ostatnia linia bez `\n`). LOC sceny wg części
(pełne + MIX / dodatkowo PODZIAŁ + WSPÓLNA): R2 2 515 / 667, R3 2 036 / 1 818, R4 301 / 824, R5 906 / 0.

Symbole z zarzutu 3 po r2:

| symbol | r1 | r2 | dowód |
|---|---|---|---|
| `_tickCameraPanKeys` (`:9953`) | P6.13 | RUNDA-5 (kamera) | `camTarget`, `camDist`, `_clampCamTarget()`, `_applyCamera()` (`:9953-9969`) |
| `_setPanKey`, `_tickZoom` | P6.13 | RUNDA-5 (kamera) | `_camPanKeys`; `camDist` → `camDistTarget` |
| `_carveBattleBox` (`:3740`) | P6.13 | WSPÓLNA → RUNDA-2 | pisze `terrainMap.tiles` (przejezdność dla reguł + wygląd pola), `:3740-3826`; ZAŁOŻENIE Z-36-3 |
| `_fencePlayableZone` | P6.13 | WSPÓLNA → RUNDA-2 | jak wyżej (margines nieprzejezdny = obszar widoczny poza strefą gry) |
| `_updateOrderPreview` (`:10683`) | P6.13 | RUNDA-3 (nakładki) | `_clearOrderPreview`, `_pickUnitAtScreen`, `_pickGroundTile`, duchy (`:10683-10700`) |
| `_updateDeployPlacementPreview`, `_refreshQueuedOrderVisuals`, `_refreshDeploySelectionVisuals` | P6.13 | RUNDA-3 | podglądy/wizualizacje |
| `_unitTooltipHtml` | P6.13 | P5 (UI) | łańcuch HTML dymka |
| `HUD_BG`, `HUD_GOLD*`, `HUD_TEXT*`, `HUD_FONT`, `HOVER_TOOLTIP_MS` | P6.13 | P5 (UI) | reguła C: używane tylko przez UI |
| `BF_ROWS`, `BF_COLS`, `PLAYABLE_*`, `PLAY_*`, `TILE_S` | P6.13 | WSPÓLNA → RUNDA-2 | reguła C: 3–41 użytkowników w scenie i logice; `lengthTiles = BF_ROWS` w wywołaniu muru (`:3905`) |
| `ORDER_LINE_Y`, `ORDER_COLOR_*`, `ORDER_*_OPACITY` | P6.13 | RUNDA-3/5 | reguła C: tylko scena |

**ZAŁOŻENIE Z-36-3:** dane terenu bitwy (`_carveBattleBox`, `_fencePlayableZone`, generator `terrainMap`) są wspólne:
domyślnie generuje je domena (P6.13), a scena (RUNDA-2) przyjmuje gotową mapę kafli jako DTO; jeśli P6.13 tego nie przejmie,
port trafia do RUNDY-2 tego tematu (bez zmiany kryteriów).

Import `buildSiegeWall`/`attachRowBreachPanels` (`battleScene.ts:116`, wywołania `:3905`, `:3930`) — **PORTOWANY**
w rundzie 1; samo umieszczenie muru w scenie (`_placeSiegeWall`: `rotation.y = π/2`, pozycja `cellToWorld`,
`:3897-3986`) to część sceny (MIX: HUD oblężenia to DOM).

### 3a. Semantyka kluczy `Map` (r2, zarzuty 1–2)

- ECMA-262 `Map.prototype.set`, krok 4: klucz `-0` jest zapisywany jako `+0`. Zmierzone node v22.22.0:
  `m.set(NaN,1); m.set(NaN,2); m.set(-0,3); m.set(0,4); m.set(1,5); m.set(-0,6)` → `size 3`, wpisy `[[NaN,2],[0,6],[1,5]]`,
  `Object.is(klucz1, -0) = false`, `get(-0) = get(0) = 6`, `get(NaN) = 2`.
- Port r1 zapisywał `-0` (zarzut 1, potwierdzony: `dowody/parity-minus0-before-fix-r2.txt` — `gate-zero-*`, `gate-half-*`:
  klucz segmentu `Math.round(-0.25) = -0` i wiersz `rowLo = -0`). Poprawka: `map_set` wstawia `key + 0.0`
  (`-0 + +0 = +0`, inne wartości bez zmian), `siege_wall.rs` `fn map_set`.
- **Klucze NaN są nieosiągalne** z `build_siege_wall`/`attach_row_breach_panels`: klucz segmentu = `Math.round(cx / T)` z pętli
  `for (sx = startX; sx < endX - T*0.01; sx += T)` (`siegeWall.ts:191`), fałszywej dla `T` = NaN; dla `T` = 0: `L = 0`, pętla
  pusta; `|cx/T| ≤ lengthTiles/2`, więc skończony. Wiersze: `for (r = rowLo; r <= rowHi; r++)` (`:1036`) — fałszywe dla NaN.
  Koszyk `shadeCache` = `Math.floor(hash01(skończony)·5) % 5` — skończony. Dlatego gałąź NaN `same_value_zero` jest przypinana
  testem jednostkowym `map_helpers_follow_js_map_same_value_zero` (fakty z node powyżej), a mutant „bez gałęzi NaN” ginie (34/34).
- **`tileSize = NaN` nie jest przypadkiem fixtury:** zmierzone w r2 — wejście NaN `0x7ff8…` daje w webie wyjścia NaN `0xfff8…`
  (pozycje, parametry geometrii, hash), Rust propaguje ładunek wejścia (`0x7ff8…`). Wzorzec bitowy NaN jest w ECMA-262
  zależny od implementacji (nieobserwowalny semantycznie), więc to nie jest własność parytetu; NaN z `0/0` (przypadek `no-side`)
  ma ten sam wzorzec `0xfff8…` po obu stronach i nadal jest porównywany bitowo.

## 4. Podział na rundy / części (jawny; kryteria końcowe tematu bez zmian)

| część | zakres (symbole z inwentarza, przykłady) | wejście (DTO) | wyjście |
|---|---|---|---|
| **1 (ta)** | `siegeWall.ts` całość | civ, opts, wiersze wyłomu | `Scene` muru + `SiegeWallUserData` |
| 2 — pole statyczne | `_buildBattlefield` (`:4462`, 417 LOC), kafle/podłoże (`BT_FLOOR_COLOR`), `_buildPlayableMarginVisuals`, `_carveWallTiles`, `_buildSiegeInteriorBuildings`, `makeGableRoofGeometry`, strefy rozstawienia (`_buildDeployZone`, `_appendDeployCellOutline`), część 3D konstruktora: światła, mgła, tło, `PerspectiveCamera(48,…)`, `_applyCamera` | siatka terenu bitwy (`BF_COLS 68 × BF_ROWS 156`, typy kafli), ziarno pola | `Scene` pola + parametry świateł/mgły/kamery jako dane |
| 3 — jednostki i nakładki | `_placeUnits`, `_placeUnitsOneSide`, `_placeSiegeDefenders`, `_placeSiegeWall` (umieszczenie), `_activateUnit` (3D), `makeUnitBars`, `makeFallbackAvatar`, pierścienie wyboru, duchy rozstawienia | lista jednostek (typ, strona, pozycja, HP/morale/amunicja) | węzły jednostek z `models::*` + paski z `units::overlay` (istniejące) |
| 4 — dynamika i efekty | pociski (`makeProjectileMesh`), strzałki rozkazów, wyłom/brama (`_breachWallTile`, `_breachGate`, `_animateRam`), ucieczka, zanikanie, znaczniki grup, aktualizacja pasków | DTO zdarzeń bitwy + czas | transformacje/flagi widoczności w funkcji (stan, t) — deterministycznie |
| 5 — picking i kamera | `pickBattleGroundTile*`, `_pickUnitAtScreen`, `_raycastFromCanvas`, `worldToScreen` (3D), obsługa kliknięć (część 3D) | promień / NDC | trafienie kafel/jednostka (przez `pick`) |

Korekta planu po inwentarzu r2 (§3.2): część 2 przyjmuje mapę kafli z `_carveBattleBox`/`_fencePlayableZone` jako DTO
(Z-36-3) i stałe pola (`BF_*`, `PLAY_*`, `TILE_S`) jako kopie z testem równości; część 3 obejmuje podglądy rozkazów
(`_updateOrderPreview`, `_updateDeployPlacementPreview`, `_refreshQueuedOrderVisuals`); część 5 obejmuje sterowanie kamerą
(`_tickCameraPanKeys`, `_setPanKey`, `_tickZoom`, `_clampCamTarget`, `_applyCamera`). Symbole PODZIAŁ (2 982 LOC) nie są portowane
w całości — scena dostaje tylko zdarzenia (np. `_singleBlow` → `_updateHpBar`), logika idzie do P6.13. Szacunek części sceny
(pełne + MIX): R2 2 515, R3 2 036, R4 301, R5 906 LOC.

Wzorzec weryfikacji każdej części jak tutaj: generator uruchamia funkcje budujące scenę z weba (three@0.169.0, node,
bez WebGL; DOM — stub nagrywający, jak `tests/fixtures/misc`), porównanie bit w bit, mutacje ≥ 20.
Ryzyko dla części 2–5: `BattleScene` jest jedną klasą z konstruktorem 822 LOC mieszającym DOM i 3D — generator
będzie potrzebował stubu `document`/`canvas` i wywoływania metod prywatnych (TS `private` nie blokuje w JS).

## 5. Generator referencji (`rust-port/renderer/tests/fixtures/battle3d/`, README tamże)

- `gen.ts` importuje **bez zmian** `battle/siegeWall.ts` i `render/bronzeCity.ts` z `git archive edb8fb56`, bundel
  `build.mjs` (esbuild 0.24.0, bez pluginów i shimów), `gen.mjs` = zapisany bundel.
- 95 przypadków (r1: 68): 11 × gra (`lengthTiles 156 = BF_ROWS`, `TILE_S 1`, `height 2.5`, `gateWidthTiles 2` +
  `attachRowBreachPanels(77.5, 0, 155, 76, 77, 1)` — `battleScene.ts:3905-3910`, `:3930-3938`, stałe `:618-629`, `:696`),
  3 × nieznany klucz, 6 przemiataczy × 9 stylów (domyślne opcje, ułamkowe długości, różne `T`, wysokości, bramy,
  `ownerColor`, brak boków → NaN) + r2: 3 przemiatacze × 9 stylów na semantykę kluczy `Map` (`gate-zero`: brama 0,
  `gate-half`: brama 0,5 → klucz `Math.round(-0.25) = -0`; `tile-zero`: `tileSize 0`; wyłomy z `rowLo = -0`) — README.
- `build.mjs` (r2) ustawia `absWorkingDir` na swój katalog → komentarze ścieżek w `gen.mjs` są względne (`../ref/…`,
  `gen.ts`, `../websrc/…`) i `gen.mjs` jest identyczny bajt w bajt w dowolnym katalogu scratch (zarzut 4; zmierzone w 2 katalogach).
- Budżet rozmiaru: bez skrótów plik miał 10,0 MB; zapisane są tylko niedomyślne `r/q/s` i `w` dla podzbioru przypadków
  — `sig` każdego przypadku zawiera bity macierzy świata każdego mesha, więc nic nie wypada z weryfikacji (README).

Liczby przypadków gry (web = Rust):

| styl | węzły | meshe | trójkąty | materiały | segmenty `wallSegsByLocalX` | wiersze `rowWallMeshes` |
|---|---|---|---|---|---|---|
| grecja (= aztek, hetyci) | 455 | 453 | 5 436 | 16 | 154 | 153 |
| rzym | 476 | 474 | 5 736 | 13 | 154 | 153 |
| sumer | 433 | 431 | 5 176 | 15 | 154 | 153 |
| egipt | 418 | 416 | 4 984 | 13 | 154 | 153 |
| inka | 434 | 432 | 5 184 | 14 | 154 | 153 |
| chiny | 474 | 472 | 5 668 | 14 | 154 | 153 |
| zulu | 1 608 | 1 606 | 36 196 | 11 | 154 | 153 |
| celtowie | 820 | 818 | 14 784 | 11 | 154 | 153 |
| germanie | 755 | 753 | 15 684 | 12 | 154 | 153 |

## 6. Testy, determinizm, mutacje

- `tests/battle3d_siege_wall.rs`:
  - `siege_wall_matches_web` — 95 przypadków, wszystko `to_bits` (§0 pkt 2);
  - `siege_wall_typed_entry_matches_web_ids` — 11 `BRONZE_CIVS` przez wejście typowane = wejście tekstowe = `sig`
    weba; eksport `Scene::export_gpu` daje tyle meshy, ile web, bez sprite'ów;
  - `siege_wall_game_rows_quirk` — obserwacja W-1 (§7) na wywołaniu gry.
- Testy jednostkowe modułu: `js_round` (remisy, `-0`, 0.49999999999999994), `shade_color`, dyspozycja stylów,
  r2: `map_helpers_follow_js_map_same_value_zero` (NaN jako jeden klucz, `-0` → `+0`, wartości zmierzone w node — §3a).
- Determinizm (r2): generator w 2 różnych katalogach → `siege_wall.json` SHA-256 `bce895d8…2fdbf7` i `gen.mjs` `b60f124d…c244c637`
  oba razy, równe commitowanym (r1: `7d59fc29…6b6854`, 68 przypadków); `siegeWall.ts` nie
  używa `Math.random` (komentarz `:14`, `hash01` `:39-42`). Test zielony także na rustc 1.87.0 (MSRV crate'a).
- Mutacje (`tests/fixtures/battle3d/mutate.py`, r2 uruchamia `--lib` + `--test battle3d_siege_wall`, log `runs/…/dowody/mutate-r2.txt`;
  r1: `mutate.txt`): **34/34 zabite** — r2 dodał „`Map.set` bez `-0 → +0`” (zabity fixturą i testem jednostkowym) oraz
  „`same_value_zero` bez gałęzi NaN” (zabity testem jednostkowym); r1 (32): m.in. roughness,
  stała `hash01`, `shadeColor`, remis `Math.round`, liczba koszyków, rozstaw/parzystość blanek, kierunek i cienie
  schodów, kraty, znak i argumenty `atan2` wrót, `thetaLength` łuku, skala dachu Chin, obrót czapy Egiptu,
  liczba pali (Zulu, korona), fallback nieznanego klucza, zakres wierszy bramy w wyłomie, mapa `rowBreachPanels`,
  szerokość pominięcia bramy, `receiveShadow` segmentów, domyślna wysokość, `castShadow` mostu Rzymu, segmenty
  stożka, cache materiałów, `gateOpen`, wysokość kraty Inków, semantyka `Map.set`. Jeden mutant przeżył w pierwszym
  podejściu (zakres wierszy bramy: wiersze bramy pokrywały się zawsze z brakującymi segmentami) — dodany przypadek
  wyłomu z bramą nad istniejącymi segmentami (`defaults`, `[5.5, 0, 11, 1, 3, 1]`), potem 32/32.

## 7. Obserwacje o webie (bez zmian w `gra/**`; port 1:1)

- **W-1** Wywołanie gry: geometryczna brama to lokalne x ∈ {−0,5; 0,5} (wiersze 77–78), a bitwa uznaje za bramę wiersze
  76–77 (`PLAY_MID_ROW − 1 … PLAY_MID_ROW`, `battleScene.ts:3864-3867`). Wynik: wiersz 76 ma segment (klucz −1 dzięki
  `Math.round(−1.5) = −1`), wiersz 78 **nie ma** meshu w `rowWallMeshes` (klucz 1 nie istnieje). Wyłom wiersza 78
  nie ukryje żadnego segmentu. Zachowane 1:1 (test `siege_wall_game_rows_quirk`); ewentualna naprawa = decyzja poza P4.
- **W-2** `ownerColor` jest rozwiązywany (`:984`), ale żaden styl go nie czyta.
- **W-3** Gałąź „scal z istniejącą mapą” w `buildWallBodySegmented` (`:209-212`) jest nieosiągalna (każdy builder woła
  funkcję raz na świeżej grupie); port ma semantykę `Map.set`, więc obie gałęzie dają to samo.
- **W-4** `attachRowBreachPanels` czyta `H` (`:1028`) i go nie używa; `rowBreachPanels` jest zawsze pustą mapą (`:1046`).
- **W-5** Materiał `stone` w Ince (`:658`) i w Celtach (`:852`) jest tworzony, ale nieużywany przez żaden mesh.
- **W-6** `lengthTiles == gateWidthTiles` daje NaN w pozycjach pali (dzielenie `0/0`, `:789`, `:871`, `:936`); w grze
  nie występuje (`lengthTiles = 156`).

## 8. Co ocenić wzrokiem po RR-T5 (NIE_ZMIERZONO — wymaga GPU)

1. 9 stylów muru w ujęciu bitwy (mur obrócony `rotation.y = π/2`, kamera bitwy) — sylwetka, kolory, cienie
   (`castShadow`/`receiveShadow` segmentów i schodów).
2. Jitter jasności segmentów (5 koszyków) i naprzemienne odcienie blanek — czy widoczne jak w webie.
3. Łuk Sumeru (otwarty półcylinder, `DoubleSide` NIE ustawiony — tylne ściany odcięte jak w webie).
4. Krata vs wrota z bali (Zulu/Celtowie/Germanie), skośne belki.
5. Dach wieży bramnej Chin (stożek 4-boczny, skala Z).
6. Wiersz 78 przy wyłomie (W-1) — w webie i w Rust ten sam brak segmentu.

## 9. Bramy (r2: `runs/…/dowody/gates-r2.txt`, pełny log testów `dowody/test-full-r2.txt`; r1: `gates.txt`, `test-full.txt`)

Polecenia z `rust-port/renderer`, `CARGO_PROFILE_DEV_DEBUG=0`, własny `CARGO_TARGET_DIR` w scratchu (usunięty po pracy):

```text
## $ cargo fmt --all -- --check
EXIT=0
## $ cargo clippy --locked --all-targets -- -D warnings
EXIT=0
## $ cargo clippy --locked --all-targets --features gpu -- -D warnings
EXIT=0
## $ cargo test --locked --all-targets
EXIT=0
## test totals: passed=377 failed=0 binaries=48   (r1: 376; +1 test jednostkowy map_helpers_follow_js_map_same_value_zero)
## $ cargo test --locked --test battle3d_siege_wall -- --nocapture
siegeWall: 95 cases: scalars 324999 (bit-equal), checks 240425
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.22s
EXIT=0
## $ cargo +1.87.0 test --locked --test battle3d_siege_wall -- --nocapture
siegeWall: 95 cases: scalars 324999 (bit-equal), checks 240425
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.29s
EXIT=0
## $ python3 tests/fixtures/battle3d/mutate.py
KILLED 34/34
EXIT=0
## $ git diff --cached --check   (po jawnym git add, przed commitem)
EXIT=0
## $ sha256sum -c tests/fixtures/battle3d/MANIFEST.sha256
EXIT=0
```

(Wartości liczbowe w tym bloku są przepisane z `dowody/gates-r2.txt` — w razie różnicy wiąże log.)

## 10. Runda 2 — odpowiedzi na zarzuty Evaluatora r1 (FAIL na `8947d603`)

| # | zarzut | odpowiedź | poprawka | dowód |
|---|---|---|---|---|
| 1 | klucze `Map` `-0` zamiast `+0` (`wall_segs_by_local_x`, `row_wall_meshes`) | **PRZYJMUJĘ** | `map_set`: nowy klucz `key + 0.0` (ECMA-262 `Map.prototype.set` krok 4); przypadki `gate-zero-*`, `gate-half-*` (brama 0 / 0,5, wyłom `rowLo = -0`) w fixturze | przed poprawką ≥ 60 różnic, wszystkie wypisane to klucze `-0` (`dowody/parity-minus0-before-fix-r2.txt`); po: 95 przypadków, 0 różnic (`gates-r2.txt`); mutant „bez `-0 → +0`” zabity |
| 2 | luka pokrycia (`gateWidthTiles < 1`, `tileSize` 0/NaN), mutant NaN w `same_value_zero` przeżywa | **PRZYJMUJĘ** (z jednym zastrzeżeniem) | 27 przypadków (`gate-zero`, `gate-half`, `tile-zero` × 9 stylów); test jednostkowy semantyki `Map` (NaN, ±0) z faktami zmierzonymi w node; `mutate.py` uruchamia też `--lib` | 34/34 mutantów (`mutate-r2.txt`). Zastrzeżenie: `tileSize = NaN` nie trafia do fixtury — klucze NaN są nieosiągalne z API, a bity NaN wyjść zależą od implementacji (V8 `0xfff8…` vs propagacja ładunku `0x7ff8…`), §3a |
| 3 | inwentarz: symbole kamery/terenu/preview/UI/stałe pola przypisane do P6.13; brak celu | **PRZYJMUJĘ** | `inv3.py`: typy pól klasy, graf wywołań, użytkownicy stałych, 20 nadpisań z powodem; każdy symbol ma cel i regułę; dopisek „heurystyka, weryfikacja w rundzie 2” usunięty (0 wystąpień) | §3.1–3.2 (tabela symboli z zarzutu), `inwentarz-battleScene.md`, `dowody/inv_summary.txt`; czysta logika 8 479 → 2 357 LOC, scena 5 758 LOC, PODZIAŁ 2 982, WSPÓLNE 730, P5 UI 5 744 + audio 1 239 |
| 4 | `gen.mjs` nieodtwarzalny bajt w bajt (ścieżki scratch w komentarzach) | **PRZYJMUJĘ** | `build.mjs`: `absWorkingDir` = katalog skryptu; README opisuje układ `$S/{ref,websrc,refscript}` | `gen.mjs` `b60f124d…` identyczny w 2 różnych katalogach scratch i w repo (`gates-r2.txt`) |

Kod r2: tylko `src/battle/siege_wall.rs` (`map_set` + test jednostkowy) oraz `tests/battle3d_siege_wall.rs` (liczby przypadków
95 / pełnych drzew 93 / meshy 11 877); `lib.rs`, `Cargo.*`, inne moduły bez zmian.
