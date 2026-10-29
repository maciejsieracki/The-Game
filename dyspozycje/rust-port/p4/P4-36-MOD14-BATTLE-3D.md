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

---

# CZĘŚĆ 2 — pole statyczne (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q2)

**TEMAT:** R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q2 · **DOMAIN:** GAME · **RUNDA:** 1/5 · **ROLA:** Operator ·
**Baza:** `rust-port/parity-v2` @ `78bd7f1a` (część 1 zintegrowana) · **Pin weba:** `edb8fb56` (three@0.169.0).
Sekcje §0–§10 wyżej (część 1) — bez zmian. Część 2 = §11–§17.

## 11. Streszczenie części 2

1. **Zakres §4 „2 — pole statyczne” zportowany w całości** → nowy moduł `rust-port/renderer/src/battle/field.rs`
   (wejście: siatka terenu jako DTO, Z-36-3; wyjście: `BattleField` = jedno drzewo `scene::Scene` + tablice boczne
   + metadane renderu). Mapa symboli §12.
2. **Parytet bit w bit z webem — kod weba URUCHOMIONY**, nie przepisany: pełny konstruktor `new BattleScene(opts)`
   (puste armie, stub DOM, `WebGLRenderer` zastąpiony nagrywaczem) dla 16 konfiguracji (3 legacy, 8 presetów świata,
   2 oblężenia, 3 rozstawienia) + buildery wołane bezpośrednio na 9 syntetycznych siatkach + 5 przypadków
   `_applyCamera` + stałe i helpery. **281 792 węzłów sceny, 20 314 tożsamości materiałów, 0 różnic** (podpis FNV
   pełnego rekordu każdego węzła, per przebieg i dla całej sceny, plus porównanie pole po polu `to_bits` pierwszych
   węzłów każdego przebiegu, materiałów, świateł, kamery, mgły, tła, ustawień renderera, stanu oblężenia).
3. **Stałe `BF_*` / `PLAY_*` / `TILE_S` / kolory / `HILL_*` / `RIVER_DROP` / tabele `BT_FLOOR_COLOR*` /
   `SIEGE_BLDG_*` / `WALL_TILE_HP` / `deployClearRanksFor` / `battleSafeCols`** — kopie w Rust z testem równości
   z wartościami odczytanymi z modułu weba (`constants_equal_web`).
4. **Mutacje: wynik w §15** (`tests/fixtures/battle3d/mutate_field.py`, 48 mutantów `src/battle/field.rs`).
5. Determinizm: generator w 2 różnych katalogach (osobny `npm install`, osobny `git archive`) → identyczny
   `field.json` (`39df4eb7…369929`) i bundel `gen_field.mjs` (`497e5666…d09143`).
6. Ocena wizualna 1:1: **NIE_ZMIERZONO** (brak GPU) — lista w §16.

## 12. Mapa symboli → Rust (`battle::field`)

| web (`battleScene.ts` @ `edb8fb56`) | linie | Rust | uwagi |
|---|---|---|---|
| stałe pola `BF_COLS`…`PLAY_MID_ROW`, `MAX_PER_SIDE`, `RANK_WIDTH`, `MAX_RANKS`, `DEPLOY_MARGIN`, `TILE_S`, `FRONT_GAP`, `ATK/DEF_FRONT_COL`, `ATK/DEF_COL_STEP`, `DEPLOY_MID_COL`, `DEPLOY_DEF_MIN_COL`, `TILE_H` | 618–629, 676–708, 774, 872, 905 | `pub const` (i32 / f64) | test równości bitowej z wartością modułu weba; formuły w teście jednostkowym |
| `BT_FLOOR_COLOR`, `BT_FLOOR_COLOR_DESERT`, kolory dekoracji, `HILL_LIFT`, `HILL_BUMP_RADIUS`, `HILL_SUMMIT_Y`, `RIVER_DROP`, `SIEGE_BLDG_*_COLORS` | 1130–1205 | `floor_color`, `floor_color_desert`, `pub const` | `?? 0x6fa84a` dla rodzaju spoza tabeli = `None` |
| `deployClearRanksFor`, `battleSafeCols` | 734–771 | `deploy_clear_ranks_for`, `battle_safe_cols` | WSPÓLNE (domena); tu tylko do testu równości |
| `tileJitter` (`battle-terrain.ts`) | 811–818 | `tile_jitter` | `Math.imul`/`>>>` na `i32`/`u32` z zawijaniem |
| `lighten`, `blend` | 19442–19459 | `lighten`, `blend` | `Math.round` = `siege_wall::js_round`, `<<` ToInt32 (wynik może być ujemny jak w JS) |
| `cellToWorld`, `cellBoundsXZ`, `tileTopY` | 1724–1739, 1831–1838 | `cell_to_world`, `cell_bounds_xz`, `tile_top_y` | |
| `BattleTerrainMap` (`at`, `passable`) | `battle-terrain.ts:49-70`, 780–793 | `TerrainGrid` (DTO) | poza zakresem `at` = Plains |
| `_carveWallTiles` | 3849–3888 | `carve_wall_tiles` → `SiegeLayout` | indeks `r * BF_COLS + col` jak w webie (nie `tm.cols`); zapis poza tablicą ignorowany jak w `Uint8Array` |
| `makeGableRoofGeometry` | 1214–1235 | `make_gable_roof_geometry`, `FieldGeo::GableRoof` | 6 trójkątów bez indeksu, `computeVertexNormals` |
| `_buildSiegeInteriorBuildings` | 3987–4117 | `FieldScene::build_siege_interior_buildings` | `Array.sort` stabilny (ES2019) = `sort_by_key` stabilny |
| `_buildBattlefield` (kafle, las, wzgórza, woda, skały, kępy trawy, drobnica, czarny grunt) | 4462–4876 | `FieldScene::build_battlefield` | cache materiałów po kolorze jak `matCache`; `break outerGrass` = `break 'outer` |
| `_buildPlayableMarginVisuals` (+ `refreshInstancedPickBounds`, `input/picker.ts:146-150`) | 4879–4962 | `build_playable_margin_visuals` (prywatna, wołana z `build_battlefield`) | `InstancedMesh.computeBoundingSphere` + `Sphere.union/expandByPoint` (three r169) dla meshy pickingu |
| `_buildDeployZone` | 11568–11679 | `FieldScene::build_deploy_zone(grid, DeploySide)` | `_playerControlSide()` = parametr |
| `_initDeployGhostLayer` | 15213–15222 | `FieldScene::init_deploy_ghost_layer` | wołane przez `_initDeployUI` w trybie rozstawienia |
| `_appendDeployCellOutline` | 15246–15274 | `FieldScene::append_deploy_cell_outline` | `THREE.Line` + `LineBasic`/`LineDashedMaterial`, `computeLineDistances` |
| konstruktor, część 3D: renderer, tło, mgła, kamera, światła, grupy `orderLines`/`orderPreview` | 3304–3366 | `build_battle_scene` → `BattleField { renderer, env, camera, field }` | mgła: konstruktor ustawia `FogExp2(…, 0.012)`, potem nadpisuje `0.005` — istnieje tylko końcowa |
| `_applyCamera` (+ pola `camTarget`, `camDir`, `camDist*`, `:2080-2085`) | 9872–9880 | `BattleCamera::apply` (+ `world_matrix`, `projection_matrix`, `euler_xyz_from_quaternion`) | `lookAt` kamery = `pick::three::Mat4::look_at` + `Quat::from_rotation_matrix` |

Typy minimalne (dispatch: `geom/**`, `scene/**` bez zmian): `FieldGeo` (body `GeoBody`: płaszczyzna, płaszczyzna
obrócona `rotateX(-π/2)`, stożek z `translate`, dach dwuspadowy, polilinia), `InstancedMesh`, `Light` / `LightKind` /
`DirectionalShadow`, `OutlineLine` / `Dash`. W drzewie `Scene` są to węzły-zastępcy `Object3D` (transformacja,
flagi, kolejność `traverse` identyczna z webem), treść w tablicach bocznych `FieldScene::{instanced, lights, lines}`.
Używane tylko publiczne API: `scene`, `geom` (prymitywy, `rotate_x`, `translate`, `compute_vertex_normals`),
`pick::three` (`Vec3`, `Mat4`, `Quat`, `Sphere`), `pick::raycast::TriGeometry` (sfera geometrii), `jsmath`,
`terrain::color::Color`, `battle::siege_wall::js_round`. `lib.rs` bez zmian (moduł `battle` istnieje od części 1;
jedna linia `pub mod field;` w `battle/mod.rs`). `Cargo.toml` / `Cargo.lock` bez zmian.

**Poza zakresem części 2 (świadomie):** `_placeSiegeWall` (umieszczenie muru — część 3; w dumpach weba poddrzewo
muru jest pominięte, `wallIndexInChildren` pokazuje jego miejsce = 10 629, tuż po polu, przed zabudową),
`_placeUnits*` (część 3; puste armie nie dodają węzłów — zmierzone: brak przebiegu jednostek w dumpach),
`_setDeployZoneVisible`, `_tickZoom`, `_clampCamTarget`, `_tickCameraPanKeys` (część 4/5), listy `ownedGeos` /
`ownedMats` (czas życia zasobów GPU — w Rust własność), `renderer.setPixelRatio(window.devicePixelRatio)`
(wartość czasu wykonania, nie dana sceny), `_carveBattleBox` / `_fencePlayableZone` / `generateBattleTerrain`
(domena, Z-36-3 — generator testu uruchamia je w webie, żeby zbudować DTO).

**ZAŁOŻENIE Z-36-4:** wejście części 2 = siatka PO `_carveBattleBox` + `_fencePlayableZone` (DTO z domeny), a
`_carveWallTiles` jest w scenie (dispatch wymienia go w części 2). Generator sprawdza, że DTO (+ webowy
`_carveWallTiles` przy oblężeniu) jest identyczne z siatką, którą zbudował sam konstruktor.

**ZAŁOŻENIE Z-36-5:** geometrie współdzielone w webie jednym obiektem (`tileGeo` na 10 608 kafli) są w Rust
osobnymi wartościami `Geo` o tej samej treści (porównywane po typie, parametrach i haszu FNV); tożsamość
geometrii nie jest częścią kontraktu (GPU deduplikuje po treści — `scene::export`). Tożsamość **materiałów**
jest porównywana (bijekcja pierwszego użycia w `traverse`), bo `matCache` / materiał-na-kafel rozstawienia są
zachowaniem do odtworzenia.

### 12a. Uzgodnienie z inwentarzem (r2, zarzut Evaluatora r1 nr 2)

Inwentarz `runs/R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1/inwentarz-battleScene.md` ma **117** wierszy ze statusem
zawierającym `RUNDA-2` (`grep -c RUNDA-2` = 117). Tabela niżej nadaje każdemu z nich status części 2:
`ZPORTOWANY` (symbol w `battle::field`, z testem), `PRZENIESIONY → cz. N` (z powodem: konsumenci), `WSPÓLNA`
(domena; z informacją, czy i kiedy scena dostanie kopię) albo `NIE PORTOWANY` (z dowodem). Tabelę wygenerował
skrypt `runs/R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q2/dowody/recon-r2.py` (statusy wpisane ręcznie w skrypcie, kolumny
`odw. cz.2` i `konsumenci` liczone z `battleScene.ts` @ `edb8fb56`):

```text
python3 -I dowody/recon-r2.py <inwentarz-battleScene.md> <battleScene.ts z git show edb8fb56:gra/src/battle/battleScene.ts> rust-port/renderer/src/battle/field.rs
```

Skrypt kończy się kodem 1, gdy którykolwiek wiersz `RUNDA-2` nie ma statusu albo gdy wiersz `ZPORTOWANY` wskazuje
identyfikator nieobecny w `field.rs`. Wynik (`dowody/recon-r2.txt`, `EXIT=0`):

```text
LICZNIK: wierszy RUNDA-2 = 117; NIE PORTOWANY = 1; PRZENIESIONY → cz. 3 = 12; PRZENIESIONY → cz. 4 = 22;
WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 3 = 12; WSPÓLNA (domena P6.13) — kopia w scenie odłożona
do cz. 4 = 2; WSPÓLNA (domena P6.13) — scena konsumuje tylko wynik (DTO), kopii w scenie nie będzie = 10;
WSPÓLNA (domena, Z-36-3) — wejście części 2 jako DTO = 3; ZPORTOWANY = 54; ZPORTOWANY częściowo = 1;
bez statusu / niezgodnych = 0
```

Kontrola: 54 + 1 + 12 + 22 + 12 + 2 + 10 + 3 + 1 = **117**.

**Rozbieżność inwentarz ↔ §4 (odnotowana jawnie).** Reguła A inwentarza (dostęp do pól 3D klasy) przypisywała
domyślnie do `RUNDA-2` każdy symbol bez wyraźniejszej reguły, także te, których jedynymi konsumentami są
rozstawienie jednostek (`_placeUnits*`, `_placeSiegeDefenders`) i animacje (`_doMeleeAttack`, `_doRangedAttack`,
`_doMove`, `_tickProjectiles`, `_attackWallTile`, `_breachWallTile`). Tabela §4 przypisuje te obszary do części 3
i 4. Rozstrzygnięcie r2: **obowiązuje §4** (podział po konsumentach), a wiersze inwentarza `RUNDA-2` z kolumną
`odw. cz.2 = 0` mają w tabeli status `PRZENIESIONY` albo `WSPÓLNA … odłożona do cz. N`. Inwentarza Q1 nie zmieniam
(jest artefaktem zamkniętego tematu Q1); źródłem prawdy dla podziału jest odtąd ta tabela. Wiersze z
`odw. cz.2 > 0` i statusem innym niż `ZPORTOWANY` to wyłącznie wystąpienia w komentarzach (`UNIT_Y` `:4484`,
`BROD` `:1840`, `_carveBattleBox` `:616-753`), sprawdzone ręcznie.

**ZAŁOŻENIE Z-36-6:** wiersz #220 (`BattleScene`, ciało klasy `:2046-2615`, „tylko część 3D”) jest w części 2
zportowany tylko w zakresie pól kamery (`:2080-2085` → `BattleCamera`); pozostałe pola 3D klasy przechodzą razem
z metodami części 3–5, które je czytają lub zapisują.

| # | linie | symbol | odw. cz.2 | konsumenci | status r2 | Rust / powód |
|---|---|---|---|---|---|---|
| 3 | 303–313 | `DIR_DELTA` | 0 | DIRS4, dirYaw, isFordTile (+1) | WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 3 | brak użycia w polu statycznym; pierwszy konsument sceny `dirYaw` (rozstawienie jednostek) |
| 4 | 314–323 | `DIRS4` | 0 | BattleScene._activateUnit, BattleScene._bestBackStep, BattleScene._bestChargeStepKey (+11) | WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 3 | brak użycia w polu statycznym; pierwszy konsument sceny `dirYaw` (rozstawienie jednostek) |
| 5 | 324–335 | `facingToward` | 0 | ?, facingFromTo, relativeHit | WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 4 | konsumenci `_doMeleeAttack`/`_doRangedAttack`/`_updateFacing` (obrót przy ataku) |
| 6 | 336–346 | `facingFromTo` | 0 | BattleScene._doMeleeAttack, BattleScene._doRangedAttack, BattleScene._updateFacing | WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 4 | konsumenci `_doMeleeAttack`/`_doRangedAttack`/`_updateFacing` (obrót przy ataku) |
| 16 | 618–618 | `BF_COLS` | 16 | BattleScene._advanceToward, BattleScene._attackFormationRallyPoint, BattleScene._bestBackStep (+38) | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 17 | 619–621 | `BF_ROWS` | 17 | BattleScene._advanceToward, BattleScene._attackFormationRallyPoint, BattleScene._bestBackStep (+34) | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 18 | 622–622 | `PLAYABLE_COLS` | 6 | ATK_FRONT_COL, BattleScene._buildPlayableMarginVisuals, BattleScene.constructor (+3) | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 19 | 623–623 | `PLAYABLE_ROWS` | 6 | BattleScene._buildDeployZone, BattleScene._buildPlayableMarginVisuals, BattleScene.constructor (+3) | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 20 | 624–624 | `PLAY_COL0` | 11 | ATK_FRONT_COL, BattleScene._buildBattlefield, BattleScene._buildDeployZone (+8) | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 21 | 625–625 | `PLAY_ROW0` | 9 | BattleScene._buildBattlefield, BattleScene._buildDeployZone, BattleScene._buildPlayableMarginVisuals (+10) | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 22 | 626–626 | `PLAY_COL1` | 9 | BattleScene._buildBattlefield, BattleScene._buildDeployZone, BattleScene._buildPlayableMarginVisuals (+7) | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 23 | 627–627 | `PLAY_ROW1` | 7 | BattleScene._buildBattlefield, BattleScene._buildDeployZone, BattleScene._buildPlayableMarginVisuals (+7) | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 24 | 628–628 | `PLAY_MID_COL` | 3 | BattleScene._buildPlayableMarginVisuals, BattleScene.constructor, DEPLOY_MID_COL | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 25 | 629–630 | `PLAY_MID_ROW` | 4 | BattleScene._buildDeployZone, BattleScene._buildPlayableMarginVisuals, BattleScene._carveBattleBox (+6) | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 26 | 631–634 | `inPlayable` | 0 | BattleScene._fencePlayableZone | WSPÓLNA (domena, Z-36-3) — wejście części 2 jako DTO | jedyny konsument `_fencePlayableZone` (domena, Z-36-3) |
| 45 | 676–680 | `MAX_PER_SIDE` | 4 | BattleScene._placeUnits, DEF_COL_STEP, MAX_RANKS (+2) | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 46 | 681–684 | `RANK_WIDTH` | 1 | MAX_RANKS, arrangeFlankCavalry | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 47 | 685–689 | `MAX_RANKS` | 2 | BattleScene._carveBattleBox, DEF_COL_STEP, deployClearRanksFor | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 49 | 696–703 | `TILE_S` | 61 | ?, BattleScene._appendDeployCellOutline, BattleScene._breachGate (+21) | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 50 | 704–704 | `FRONT_GAP` | 3 | ATK_FRONT_COL, DEF_FRONT_COL, TILE_S (+1) | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 51 | 705–705 | `ATK_FRONT_COL` | 6 | BattleScene._buildBattlefield, BattleScene._carveBattleBox, BattleScene._placeUnits (+4) | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 52 | 706–706 | `DEF_FRONT_COL` | 7 | BattleScene._buildBattlefield, BattleScene._carveBattleBox, BattleScene._carveWallTiles (+5) | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 53 | 707–707 | `ATK_COL_STEP` | 2 | BattleScene._carveBattleBox, BattleScene._placeUnits, BattleScene._placeUnitsOneSide (+2) | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 54 | 708–733 | `DEF_COL_STEP` | 2 | BattleScene._carveBattleBox, BattleScene._placeUnits, BattleScene._placeUnitsOneSide (+2) | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 55 | 734–756 | `deployClearRanksFor` | 1 | BattleScene._carveBattleBox, BattleScene.constructor, battleSafeCols | ZPORTOWANY (cz. 2) | `deploy_clear_ranks_for` (+ `battle_safe_cols`); test `helpers_match_web` |
| 91 | 884–892 | `DEFAULT_RANGED_REACH` | 0 | attackRange, civUnitShapeForBattleUnit | WSPÓLNA (domena P6.13) — scena konsumuje tylko wynik (DTO), kopii w scenie nie będzie | konsument `attackRange` (logika zasięgu) |
| 94 | 905–905 | `TILE_H` | 2 | ?, BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const` w `battle::field`; test `constants_equal_web` |
| 95 | 906–916 | `UNIT_Y` | 1 | BattleScene._buildBattlefield | NIE PORTOWANY — martwa stała w webie | `const UNIT_Y = 0` (`:906`) nie ma użycia w kodzie; jedyne wystąpienie poza definicją to komentarz `:4484` |
| 96 | 917–917 | `BROD` | 1 | BROD_BONUS_BRZEG, BROD_KARA_ATAK, BROD_KARA_OBRONA (+9) | WSPÓLNA (domena P6.13) — scena konsumuje tylko wynik (DTO), kopii w scenie nie będzie | parametry brodu (`combatParamsData.brod`) — mechanika ruchu/walki; w cz. 2 tylko komentarz `:1840` |
| 105 | 947–947 | `RANGED_FLY_MS` | 0 | BattleScene._doRangedAttack | PRZENIESIONY → cz. 4 (dynamika/efekty) | czas lotu pocisku — jedyny konsument `_doRangedAttack` |
| 106 | 948–948 | `RANGED_GAP_MS` | 0 | BattleScene._doRangedAttack | PRZENIESIONY → cz. 4 (dynamika/efekty) | czas lotu pocisku — jedyny konsument `_doRangedAttack` |
| 109 | 955–955 | `BLOW_LUNGE_MS` | 0 | BattleScene._doMeleeAttack | PRZENIESIONY → cz. 4 (dynamika/efekty) | czas ciosu — jedyny konsument `_doMeleeAttack` |
| 110 | 956–956 | `BLOW_HIT_T` | 0 | BattleScene._doMeleeAttack | PRZENIESIONY → cz. 4 (dynamika/efekty) | czas ciosu — jedyny konsument `_doMeleeAttack` |
| 111 | 957–957 | `BLOW_SETTLE_MS` | 0 | BattleScene._doMeleeAttack | PRZENIESIONY → cz. 4 (dynamika/efekty) | czas ciosu — jedyny konsument `_doMeleeAttack` |
| 115 | 978–991 | `HPBAR_Y` | 0 | BattleScene._activateUnit, BattleScene._breachWallTile, BattleScene._doMeleeAttack (+7) | WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 3 | wysokość pasków HP: `_placeUnits*`/`_placeSiegeDefenders` (cz. 3), animacje (cz. 4) |
| 120 | 1009–1013 | `sideColor` | 0 | BattleScene._placeSiegeDefenders, BattleScene._placeUnits, BattleScene._placeUnitsOneSide (+1) | PRZENIESIONY → cz. 3 (jednostki/nakładki) | kolor strony jednostki: `_placeUnits*`, `_placeSiegeDefenders` (w konstruktorze `sideColor` to inna, lokalna zmienna DOM `:2969`) |
| 123 | 1024–1025 | `CLASH_LOG_MAX` | 0 | BattleScene, BattleScene._cycleSpeed, BattleScene._pushClash (+1) | WSPÓLNA (domena P6.13) — scena konsumuje tylko wynik (DTO), kopii w scenie nie będzie | dziennik starć (`_pushClash`) — logika/UI |
| 125 | 1047–1049 | `MORALE_START` | 0 | RuntimeBattleUnit, moraleBaseFor, sideTag | WSPÓLNA (domena P6.13) — scena konsumuje tylko wynik (DTO), kopii w scenie nie będzie | morale startowe — `moraleBaseFor`/`RuntimeBattleUnit` |
| 136 | 1069–1069 | `MORALE_TERRAIN_RESIST` | 0 | BattleScene._checkRout | WSPÓLNA (domena P6.13) — scena konsumuje tylko wynik (DTO), kopii w scenie nie będzie | `_checkRout` (PODZIAŁ, logika) |
| 141 | 1074–1082 | `MORALE_WALL_BREACH` | 0 | BattleScene._breachWallTile | PRZENIESIONY → cz. 4 (dynamika/efekty) | jedyny konsument `_breachWallTile` |
| 142 | 1083–1086 | `ARMY_MORALE_LOSS_THRESHOLD` | 0 | BattleScene._checkEnd, MORALE_WALL_BREACH | WSPÓLNA (domena P6.13) — scena konsumuje tylko wynik (DTO), kopii w scenie nie będzie | `_checkEnd` (logika końca bitwy) |
| 144 | 1094–1099 | `PHALANX_LEAD_TOLERANCE` | 0 | BattleScene._phalanxAction, BattleScene._phalanxStep | WSPÓLNA (domena P6.13) — scena konsumuje tylko wynik (DTO), kopii w scenie nie będzie | `_phalanxAction`/`_phalanxStep` (logika) |
| 147 | 1130–1143 | `BT_FLOOR_COLOR` | 1 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `floor_color`; test `constants_equal_web` |
| 148 | 1144–1154 | `BT_FLOOR_COLOR_DESERT` | 1 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `floor_color_desert`; test `constants_equal_web` |
| 149 | 1155–1155 | `FOREST_CONE_COLOR` | 1 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 150 | 1156–1156 | `FOREST_CONE_COLOR2` | 1 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 151 | 1157–1157 | `FOREST_TRUNK_COLOR` | 1 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 152 | 1158–1158 | `HILL_GRASS_COLOR` | 1 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 153 | 1159–1159 | `SHRUB_COLOR` | 1 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 154 | 1160–1160 | `ROCK_COLOR` | 1 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 155 | 1161–1163 | `RIVER_WATER_COLOR` | 1 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 156 | 1164–1164 | `HILL_GRASS_COLOR_DESERT` | 1 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 157 | 1165–1165 | `SHRUB_COLOR_DESERT` | 2 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 158 | 1166–1169 | `ROCK_COLOR_DESERT` | 1 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 159 | 1170–1170 | `GRASS_TUFT_COLOR_A` | 2 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 160 | 1171–1171 | `GRASS_TUFT_COLOR_B` | 1 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 161 | 1172–1172 | `PEBBLE_COLOR` | 1 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 162 | 1173–1175 | `TINY_BUSH_COLOR` | 1 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 163 | 1176–1176 | `GRASS_TUFT_COLOR_A_DESERT` | 1 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 164 | 1177–1179 | `GRASS_TUFT_COLOR_B_DESERT` | 1 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 165 | 1180–1186 | `HILL_LIFT` | 5 | BattleScene._buildBattlefield, HILL_BUMP_RADIUS, HILL_SUMMIT_Y | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 166 | 1187–1193 | `HILL_BUMP_RADIUS` | 2 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 167 | 1194–1195 | `HILL_SUMMIT_Y` | 4 | BattleScene._buildBattlefield, pickBattleGroundTileFromMeshes, tileTopY | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 168 | 1196–1202 | `RIVER_DROP` | 4 | BattleScene._buildBattlefield, pickBattleGroundTileFromMeshes, tileTopY | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 169 | 1203–1203 | `SIEGE_BLDG_BODY_COLORS` | 2 | BattleScene._buildSiegeInteriorBuildings | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 170 | 1204–1213 | `SIEGE_BLDG_ROOF_COLORS` | 2 | BattleScene._buildSiegeInteriorBuildings | ZPORTOWANY (cz. 2) | `pub const`; test `constants_equal_web` + parytet sceny |
| 171 | 1214–1240 | `makeGableRoofGeometry` | 2 | BattleScene._buildSiegeInteriorBuildings, SIEGE_BLDG_ROOF_COLORS | ZPORTOWANY (cz. 2) | `make_gable_roof_geometry` / `FieldGeo::GableRoof` |
| 172 | 1241–1247 | `norm` | 0 | attackRange, civUnitShapeForBattleUnit, movementPoints | WSPÓLNA (domena P6.13) — scena konsumuje tylko wynik (DTO), kopii w scenie nie będzie | `attackRange`/`movementPoints` (logika); słowo `norm` w `field.rs` to inna, lokalna nazwa |
| 173 | 1248–1261 | `statField` | 0 | ammoCount, attackRange, fleeMoraleFor (+2) | PRZENIESIONY → cz. 3 (jednostki/nakładki) | dane jednostki przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`) |
| 175 | 1281–1306 | `toCombatUnit` | 0 | BattleScene._applyStartingMoralePowerPenalty, BattleScene._checkRout, BattleScene._singleBlow (+2) | WSPÓLNA (domena P6.13) — scena konsumuje tylko wynik (DTO), kopii w scenie nie będzie | `_singleBlow`/`_checkRout`/`computeInstantResult` (logika walki) |
| 178 | 1336–1345 | `attackRange` | 0 | BattleScene._attackRangeFor, BattleScene._placeUnits, RuntimeBattleUnit (+1) | WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 3 | klasyfikacja jednostek przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`) — część 3 |
| 179 | 1346–1359 | `isRanged` | 0 | BattleScene._executeSkirmishDoctrineStep, BattleScene._placeUnits, isPrimaryRanged | WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 3 | klasyfikacja jednostek przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`) — część 3 |
| 180 | 1360–1382 | `ammoCount` | 0 | BattleScene._placeSiegeDefenders, BattleScene._placeUnits, BattleScene._placeUnitsOneSide (+1) | PRZENIESIONY → cz. 3 (jednostki/nakładki) | dane jednostki przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`) |
| 181 | 1383–1399 | `canShoot` | 0 | BattleScene._activateNext, BattleScene._activateUnit, BattleScene._canAttackFrom (+9) | WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 3 | klasyfikacja jednostek przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`) — część 3 |
| 182 | 1400–1415 | `isPrimaryRanged` | 0 | BattleScene._armyCompositionKind, BattleScene._armyHpRatio, BattleScene._deployRoleOf (+3) | WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 3 | klasyfikacja jednostek przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`) — część 3 |
| 183 | 1416–1433 | `isMounted` | 0 | BattleScene._armyCompositionKind, BattleScene._deployRoleOf, BattleScene._placeSiegeDefenders (+4) | WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 3 | klasyfikacja jednostek przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`) — część 3 |
| 184 | 1434–1449 | `isAntiCavSpear` | 0 | BattleScene._placeSiegeDefenders, BattleScene._placeUnits, BattleScene._placeUnitsOneSide | PRZENIESIONY → cz. 3 (jednostki/nakładki) | dane jednostki przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`) |
| 185 | 1450–1463 | `isPhalanx` | 0 | BattleScene._placeSiegeDefenders, BattleScene._placeUnits, BattleScene._placeUnitsOneSide | PRZENIESIONY → cz. 3 (jednostki/nakładki) | dane jednostki przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`) |
| 186 | 1464–1472 | `isSiegeUnit` | 0 | BattleScene._activateUnit, BattleScene._deployRoleOf, BattleScene._placeSiegeDefenders (+3) | WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 3 | klasyfikacja jednostek przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`) — część 3 |
| 188 | 1488–1517 | `arrangeFlankCavalry` | 0 | BattleScene._placeUnits, DEF_COL_STEP | PRZENIESIONY → cz. 3 (jednostki/nakładki) | dane jednostki przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`) |
| 190 | 1539–1557 | `isNeverRout` | 0 | BattleScene._placeSiegeDefenders, BattleScene._placeUnits, BattleScene._placeUnitsOneSide | PRZENIESIONY → cz. 3 (jednostki/nakładki) | dane jednostki przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`) |
| 191 | 1558–1570 | `moraleBaseFor` | 0 | BattleScene._placeSiegeDefenders, BattleScene._placeUnits, BattleScene._placeUnitsOneSide (+1) | PRZENIESIONY → cz. 3 (jednostki/nakładki) | dane jednostki przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`) |
| 192 | 1571–1588 | `fleeMoraleFor` | 0 | BattleScene._placeSiegeDefenders, BattleScene._placeUnits, BattleScene._placeUnitsOneSide | PRZENIESIONY → cz. 3 (jednostki/nakładki) | dane jednostki przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`) |
| 194 | 1592–1604 | `normName` | 0 | BattleScene._deployRoleOf, BattleScene._isCatapult, BattleScene._isRam (+10) | WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 3 | klasyfikacja jednostek przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`) — część 3 |
| 195 | 1605–1627 | `projectileKind` | 0 | BattleScene._doRangedAttack | PRZENIESIONY → cz. 4 (dynamika/efekty) | rodzaj pocisku — jedyny konsument `_doRangedAttack` |
| 197 | 1724–1728 | `cellToWorld` | 13 | ?, BattleScene._activateUnit, BattleScene._addBattleGhostDisc (+24) | ZPORTOWANY (cz. 2) | `cell_to_world`; test `helpers_match_web` |
| 199 | 1741–1742 | `cellKey` | 0 | BattleScene._activateUnit, BattleScene._addBattleGhostDisc, BattleScene._advanceToward (+37) | WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 3 | klucz komórki — 40 konsumentów, wszyscy w logice ruchu / jednostkach; pole statyczne go nie używa |
| 204 | 1831–1840 | `tileTopY` | 7 | BattleScene._addBattleGhostDisc, BattleScene._appendDeployCellOutline, BattleScene._attackWallTile (+21) | ZPORTOWANY (cz. 2) | `tile_top_y`; test `helpers_match_web` |
| 208 | 1871–1881 | `dirYaw` | 0 | BattleScene._doMeleeAttack, BattleScene._doRangedAttack, BattleScene._placeSiegeDefenders (+4) | WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 3 | obrót jednostki (`_placeUnits*`, `_placeSiegeDefenders`, `_startRout`) |
| 220 | 2046–2615 | `BattleScene` | 1 | BattleScene._carveWallTiles, BattleScene._renderDeployStrategyPopup, BattleScene._resetSiegeForReplay (+8) | ZPORTOWANY częściowo (cz. 2) / reszta → cz. 3–5 | pola kamery `camTarget/camDir/camDist*` (`:2080-2085`) = `BattleCamera`; pozostałe pola 3D klasy (jednostki, pociski, nakładki, picking) przechodzą razem z metodami części 3–5, które ich używają |
| 232 | 3740–3826 | `BattleScene._carveBattleBox` | 4 | BattleScene.constructor, DEF_COL_STEP, MAX_RANKS (+2) | WSPÓLNA (domena, Z-36-3) — wejście części 2 jako DTO | domena buduje siatkę; generator testu woła ją w webie (ZAŁOŻENIE Z-36-3/Z-36-4) |
| 233 | 3827–3848 | `BattleScene._fencePlayableZone` | 0 | BattleScene.constructor | WSPÓLNA (domena, Z-36-3) — wejście części 2 jako DTO | jw. |
| 234 | 3849–3896 | `BattleScene._carveWallTiles` | 0 | BattleScene.constructor | ZPORTOWANY (cz. 2) | `carve_wall_tiles` → `SiegeLayout` |
| 235 | 3897–3986 | `BattleScene._placeSiegeWall` | 0 | BattleScene.constructor | PRZENIESIONY → cz. 3 (jednostki/nakładki) | umieszczenie muru w scenie (§4, §12 „Poza zakresem”); mesh muru = część 1 |
| 236 | 3987–4123 | `BattleScene._buildSiegeInteriorBuildings` | 0 | BattleScene.constructor | ZPORTOWANY (cz. 2) | `FieldScene::build_siege_interior_buildings` |
| 238 | 4139–4445 | `BattleScene._placeSiegeDefenders` | 0 | BattleScene._activateUnit, BattleScene._placeSiegeWall, BattleScene._placeUnits (+1) | PRZENIESIONY → cz. 3 (jednostki/nakładki) | rozstawienie obrońców oblężenia = jednostki (§4 część 3) |
| 240 | 4462–4878 | `BattleScene._buildBattlefield` | 2 | BT_FLOOR_COLOR, BattleScene, BattleScene._breachWallTile (+4) | ZPORTOWANY (cz. 2) | `FieldScene::build_battlefield` |
| 241 | 4879–4968 | `BattleScene._buildPlayableMarginVisuals` | 2 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `build_playable_margin_visuals` |
| 252 | 5603–5619 | `BattleScene._resolveAutoBatchAttack` | 0 | BattleScene._launchAutoBatchResolution, BattleScene._resolveAutoBatchMovement | PRZENIESIONY → cz. 4 (dynamika/efekty) | PODZIAŁ: logika → P6.13; scena dostaje zdarzenia w części 4 |
| 266 | 6278–6319 | `BattleScene._phalanxAction` | 0 | BattleScene._activateUnit, BattleScene._phalanxLineFront | PRZENIESIONY → cz. 4 (dynamika/efekty) | PODZIAŁ: logika → P6.13; scena dostaje zdarzenia w części 4 |
| 297 | 7204–7234 | `BattleScene._attackWallTile` | 0 | BattleScene._activateUnit | PRZENIESIONY → cz. 4 (dynamika/efekty) | atak/pocisk katapulty/wyłom w murze — dynamika oblężenia (§4 część 4: `_breachWallTile`) |
| 298 | 7235–7271 | `BattleScene._spawnCatapultBoulder` | 0 | BattleScene._attackWallTile | PRZENIESIONY → cz. 4 (dynamika/efekty) | atak/pocisk katapulty/wyłom w murze — dynamika oblężenia (§4 część 4: `_breachWallTile`) |
| 300 | 7302–7420 | `BattleScene._breachWallTile` | 0 | BattleScene._attackWallTile | PRZENIESIONY → cz. 4 (dynamika/efekty) | atak/pocisk katapulty/wyłom w murze — dynamika oblężenia (§4 część 4: `_breachWallTile`) |
| 302 | 7477–7495 | `BattleScene._spawnWallLabel` | 0 | BattleScene._attackWallTile, BattleScene._breachWallTile | PRZENIESIONY → cz. 4 (dynamika/efekty) | napis nad kaflem muru po trafieniu (wołany z `_attackWallTile`/`_breachWallTile`) |
| 319 | 8083–8104 | `BattleScene._doAttack` | 0 | BattleScene._activateUnit, BattleScene._cavalryAction, BattleScene._executeGroupDoctrineStep (+5) | PRZENIESIONY → cz. 4 (dynamika/efekty) | PODZIAŁ: logika → P6.13; scena dostaje zdarzenia w części 4 |
| 322 | 8361–8443 | `BattleScene._doMeleeAttack` | 0 | BattleScene._doAttack | PRZENIESIONY → cz. 4 (dynamika/efekty) | animacje ataku / ucieczki |
| 323 | 8444–8509 | `BattleScene._doRangedAttack` | 0 | BattleScene._doAttack, BattleScene._singleBlow | PRZENIESIONY → cz. 4 (dynamika/efekty) | animacje ataku / ucieczki |
| 349 | 8942–8957 | `BattleScene._checkRout` | 0 | BattleScene._activateUnit, BattleScene._applyMoraleDamage, BattleScene._breachGate (+4) | PRZENIESIONY → cz. 4 (dynamika/efekty) | PODZIAŁ: logika → P6.13; scena dostaje zdarzenia w części 4 |
| 350 | 8958–8999 | `BattleScene._startRout` | 0 | BattleScene._checkRout, BattleScene._singleBlow | PRZENIESIONY → cz. 4 (dynamika/efekty) | animacje ataku / ucieczki |
| 375 | 9600–9631 | `BattleScene._removeAllUnitsFromField` | 0 | BattleScene._replayBattle | PRZENIESIONY → cz. 3 (jednostki/nakładki) | usuwanie węzłów jednostek (odwrotność `_placeUnits`; wołane z `_replayBattle`) |
| 700 | 18647–18667 | `BattleScene._makeGroupNumberTexture` | 0 | BattleScene._updateGroupFrameMarker | PRZENIESIONY → cz. 4 (dynamika/efekty) | tekstura znacznika grupy (§4 część 4: znaczniki grup), wołana z `_updateGroupFrameMarker` |
| 719 | 19123–19320 | `computeInstantResult` | 0 | BROD_BONUS_BRZEG, BattleOpts, BattleScene (+2) | WSPÓLNA (domena P6.13) — scena konsumuje tylko wynik (DTO), kopii w scenie nie będzie | auto-rozstrzygnięcie bez sceny (`skip`) |
| 723 | 19438–19438 | `lerp` | 0 | BattleScene._doMeleeAttack, BattleScene._doMove, BattleScene._tickProjectiles | PRZENIESIONY → cz. 4 (dynamika/efekty) | interpolacja animacji: `_doMeleeAttack`, `_doMove`, `_tickProjectiles` |
| 724 | 19439–19439 | `easeOut` | 0 | BattleScene._doMeleeAttack, BattleScene._doMove | PRZENIESIONY → cz. 4 (dynamika/efekty) | interpolacja animacji: `_doMeleeAttack`, `_doMove`, `_tickProjectiles` |
| 725 | 19440–19441 | `easeIn` | 0 | BattleScene._doMeleeAttack | PRZENIESIONY → cz. 4 (dynamika/efekty) | interpolacja animacji: `_doMeleeAttack`, `_doMove`, `_tickProjectiles` |
| 726 | 19442–19451 | `lighten` | 5 | BattleScene._breachWallTile, BattleScene._buildBattlefield, BattleScene._buildSiegeInteriorBuildings | ZPORTOWANY (cz. 2) | `lighten`; test `helpers_match_web` |
| 727 | 19452–19460 | `blend` | 2 | BattleScene._buildBattlefield | ZPORTOWANY (cz. 2) | `blend`; test `helpers_match_web` |

## 13. Generator i dane referencyjne (`tests/fixtures/battle3d/`, README tamże, „Part 2”)

- `gen_field.ts` importuje **niezmieniony** `battle/battleScene.ts` (+ cały graf importów) z `git archive edb8fb56`;
  bundel `build_field.mjs` (esbuild 0.24.0). Trzy jawne kroki czasu bundlowania (nic nie trafia do `gra/**`):
  (a) dopisanie jednej linii `export { … }` do `battleScene.ts` (dostęp do stałych/helperów prywatnych modułu),
  (b) `three` widziane przez `battleScene.ts` = `three_shim.ts` (prawdziwe three@0.169.0, podmieniony tylko
  `WebGLRenderer` → rejestrator ustawień), (c) `define` dla `import.meta.glob/env` (Vite) w modułach UI.
  Stub DOM (`dom_stub.ts`): Proxy, rozmiary układu = 0 → `_syncRendererSize` kończy się na `w === 0`, `aspect` = 1.
- Przypadki: §„Cases” README — 16 konstruktorów, 9 siatek syntetycznych (m.in. limit 8000 źdźbeł osiągnięty, brama w wierszu 79 — działka dokładnie `STREET_HALF` od bramy,
  siatka 20×30 mniejsza niż pole, sama rzeka, brak miejsca na zabudowę, `siegeWallCol` −1), 6 obrysów komórek
  (przerywane i ciągłe, odwrócony prostokąt, poza siatką), 5 × `_applyCamera`, stałe, 296 × `lighten`/`blend`.
- `field.json` 3 165 207 B; bundel `gen_field.mjs` (2,78 MB, cały kod gry) **nie jest commitowany** (budżet
  12 MB: część 1 zajmuje 7,69 MB) — odtwarzalny bajt w bajt, SHA-256 w README. Katalog fixtur po części 2:
  wynik `du -b` w §15 (≤ 12 MB), największy plik nadal `siege_wall.json` 7,23 MB (≤ 8 MB).
- Format rekordu węzła (identyczny strumień bajtów w `gen_field.ts::nodeRecord` i `battle3d_field.rs::View::record`):
  rodzaj, nazwa, rodzic, pozycja, Euler + porządek, kwaternion, skala, `matrixWorld`, cienie, widoczność,
  `renderOrder`, tożsamość materiału, typ / hasz / parametry geometrii; `Line`: `lineDistance`; `InstancedMesh`:
  pojemność, `count`, FNV całych tablic `instanceMatrix` / `instanceColor` (`Float32`), `boundingSphere`;
  światła: kolor liniowy, intensywność, kolor gruntu, cel, pozycja celu, kamera cienia.

## 14. Testy (`tests/battle3d_field.rs`) i testy jednostkowe

- `field_constructor_matches_web` — 16 konstruktorów: siatka po `_carveWallTiles` (FNV), `SiegeLayout`
  (kolumna, wiersze, brama, HP bramy, `wallTileHp` w kolejności wstawiania), tło, mgła, renderer, kamera
  (fov/aspect/near/far/zoom, pozycja, Euler, kwaternion, `up`, `matrixWorld`, `projectionMatrix`, cel, kierunek,
  4 odległości), scena (liczba węzłów, przebiegi: etykieta / start / liczba dzieci / węzłów / podpis, pełne
  rekordy pierwszych 3 węzłów każdego przebiegu, podpis całej sceny), materiały (podpis każdej tożsamości + pola
  pierwszych 40 różnych), indeksy `_battleGroundPickMeshes` / `_deployZoneMeshes` / `_deployVisualGroup`.
- `field_builders_match_web_on_synthetic_grids` — 9 siatek, te same porównania sceny.
- `apply_camera_matches_web` — 5 przypadków (NaN: porównana tylko „NaN-owość”, wzorce bitów NaN zależne od
  implementacji, §3a).
- `constants_equal_web`, `helpers_match_web` — stałe, tabele, `lighten`/`blend`, dach, `cellToWorld`, `tileTopY`.
- Jednostkowe w `battle::field`: formuły stałych, `tile_jitter` ∈ [0, 1), zapis karwowania poza krótką siatką.

## 15. Bramy, mutacje (r1: `runs/R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q2/dowody/gates-r1.txt`, `test-full-r1.txt`, `mutate-field-r1.txt`)

Polecenia z `rust-port/renderer`, `CARGO_PROFILE_DEV_DEBUG=0`, `CARGO_TARGET_DIR` w scratchu (usunięty po pracy), rustc 1.97.0:

```text
## $ cargo fmt --all -- --check
EXIT=0
## $ cargo clippy --locked --all-targets -- -D warnings
EXIT=0
## $ cargo clippy --locked --all-targets --features gpu -- -D warnings
EXIT=0
## $ cargo test --locked --all-targets
EXIT=0
## test totals: passed=397 failed=0 binaries=52   (część 1: 377; +5 testów battle3d_field, +3 jednostkowe battle::field, reszta = stan bazy 78bd7f1a)
## $ cargo test --locked --test battle3d_field -- --nocapture
field synthetic: 9 cases, scalars 7881, checks 15407
field ctor: 16 cases, 177798 nodes, scalars 19299, checks 22567
test result: ok. 5 passed; 0 failed
## $ cargo test --locked --test battle3d_siege_wall   (część 1 bez zmian)
test result: ok. 3 passed; 0 failed
## $ sha256sum -c MANIFEST.sha256   (12 plików)
EXIT=0
## $ du -b tests/fixtures/battle3d
10908890   (≤ 12 MB; największy plik siege_wall.json 7 228 812 B ≤ 8 MB)
## $ python3 tests/fixtures/battle3d/mutate_field.py
KILLED 48/48
EXIT=0
```

(Liczby przepisane z `dowody/gates-r1.txt` i `dowody/mutate-field-r1.txt` — w razie różnicy wiąże log. Uwaga do
„+5/+3”: suma 397 obejmuje też testy dodane w bazie po części 1; NIE_ZMIERZONO rozbicia poza `battle3d_field`.)

**Mutacje (48):** podłoga (roughness, szachownica, krok wariancji, cel przyciemnienia, odcienie stron, wysokość płyty,
`receiveShadow`, cache materiałów), dekoracje (wysokość korony, sól odcienia korony, skala Y kopuły, wysokość krzewu,
woda brodu, `emissive` wody, liczba skał, limit trawy, przechył źdźbła, szansa kamyka, uniesienie krzaczka, wypełnienie
`instanceColor` jedynkami), grunt / marginesy / ramka (`y`, zakładka INNER, `renderOrder`, `DoubleSide`), sfera
`union`, oblężenie (wiersze bramy, HP kafla muru, `STREET_HALF`, `BUILDING_CAP`, kolejność działek, kalenica dachu,
uniesienie dachu płaskiego), rozstawienie (krycie kafla, przesunięcie krawędzi, `renderOrder` duchów, uniesienie
obrysu, kumulacja `lineDistance`, `passable` bramy), helpery (`tileJitter`, `lighten`, `tileTopY`), konstruktor
(odległość kamery, clamp, cień słońca, `DEFAULT_UP` półkuli, gęstość mgły, Euler z kwaternionu). Przebieg 1: 47/48 —
„`STREET_HALF` 3 → 2” przeżył, bo przy bramie w wierszu 77 i kroku 3 od wiersza 25 żadna działka nie leży dokładnie
3 wiersze od bramy; dodany przypadek `interior-gate-79` (działka w wierszu 76), przebieg 2: 48/48. Mutant
„`variance >= 0` → `> 0`” z pierwszego szkicu był RÓWNOWAŻNY (`blend(c, 0, -0)` = `lighten(c, 0)`) — zastąpiony
„celem przyciemnienia”.

## 16. Co ocenić wzrokiem po RR-T5 (NIE_ZMIERZONO — wymaga GPU)

1. Pole 68×156 w kadrze domyślnym (kamera `fov 48`, odległość 101,2, kierunek (0, 1, 1)/√2): szachownica kafli
   (+2,2 %), jitter jasności (±6,75 %, 7 koszyków), przyciemnienie/rozjaśnienie stron ataku/obrony.
2. Czarne marginesy (nieprzezr. 0,94, `renderOrder` 5) — brak jasnej szpary na styku z wodą; złota ramka strefy gry
   (0,35, `DoubleSide`, `renderOrder` 6).
3. Lasy (korony białe × `instanceColor`, 2 odcienie), kopuły wzgórz zachodzące na siebie (promień 0,78), krzewy,
   skały, woda półprzezroczysta z `emissive`, kępy trawy (bez cieni), kamyki/krzaczki — przy zbliżeniu.
4. Paleta pustyni (`pustynia`): piasek, wydmy, piaskowiec, suche kępy.
5. Zabudowa za murem (oblężenie): bryły z dachami dwuspadowymi i płaskimi, ulica od bramy wolna.
6. Strefa rozstawienia: jasna połowa gracza z kaflami 0x44bbff (0,28), „mgła” przeciwnika (2 warstwy), złota linia
   i krawędzie niebieska/czerwona; obrysy komórek na wysokości `tileTopY + 0,08` (przerywane: kreska 0,22 / przerwa 0,14).
7. Oświetlenie: ambient + półkula + słońce z cieniem PCFSoft (mapa 2048², ortho ±40,8 × ±109,2) + wypełnienie;
   ACES Filmic, ekspozycja 1,05; mgła `FogExp2(0x05070b, 0,005)`, tło 0x05070b.

## 17. Obserwacje o webie (część 2; port 1:1, bez zmian w `gra/**`)

- **W-7** `_carveWallTiles` indeksuje `r * BF_COLS + wallCol` (nie `tm.cols`) — dla siatki o innej szerokości zapis
  trafia w złe miejsce lub poza tablicę (ignorowany przez `Uint8Array`); w grze siatka ma zawsze `BF_COLS` kolumn.
- **W-8** `_buildBattlefield` liczy dekoracje po całym `tm.tiles` (np. `forestTiles`), a rysuje po prostokącie
  `BF_COLS × BF_ROWS` — przy siatce większej niż pole pojemność `InstancedMesh` > liczba instancji (port liczy
  identycznie; w grze siatka ma zawsze rozmiar pola; mniejsza siatka — przypadek `mix-small-grid` — daje równe
  liczby, bo `at` poza zakresem = Plains).
- **W-9** Materiał kafla rozstawienia jest tworzony osobno dla każdego kafla (do ~2 600 identycznych materiałów);
  port zachowuje tożsamości (koszt tylko CPU; GPU może deduplikować — decyzja poza P4).
- **W-10** Konstruktor ustawia mgłę `FogExp2(…, 0.012)` i kilka linii dalej zastępuje ją `FogExp2(…, 0.005)` (`:3315`, `:3359`).
- **W-11** `_buildBattlefield(_teren)` nie używa parametru `teren` (teren steruje tylko ziarnem generatora).

## 18. Część 2, runda 2 — odpowiedzi na zarzuty Evaluatora r1 (FAIL na `b162688f`)

| zarzut | odpowiedź | poprawka / dowód |
|---|---|---|
| 1. `compare_siege` po cichu pomija porównanie, gdy Rust zwraca `None` (mutant `siege,` → `siege: None,` przeżywał) | **PRZYJMUJĘ** | `tests/battle3d_field.rs::compare_siege` sprawdza teraz `present`: Rust musi zwrócić `Some` dokładnie wtedy, gdy web wykonał `_carveWallTiles` (rekord ma `rowLo`) i `wallCol != -1`, a `None` w przeciwnym razie. W `field_builders_match_web_on_synthetic_grids` doszło porównanie wejściowych `wallCol`/`gateRow` z `siegeState` weba. `mutate_field.py` +7 mutantów stanu oblężenia przekazywanego do części 3 (`ctor drops siege`, `gate_open`, `gate_col`, `gate_row`, `gate_hp`, `row_hi`, pomijanie kafli bramy w `wall_tile_hp`) — wszystkie zabite; razem **55/55** (`runs/…-Q2/dowody/mutate-field-r2.txt`). |
| 2. Zakres nieuzgodniony z inwentarzem (117 wierszy `RUNDA-2`) | **PRZYJMUJĘ** | §12a: tabela uzgodnienia wszystkich 117 wierszy (status + powód + konsumenci), licznik kontrolny 117 = suma statusów, 0 bez statusu; rozbieżność inwentarz ↔ §4 odnotowana jawnie (obowiązuje §4), ZAŁOŻENIE Z-36-6. Skrypt `dowody/recon-r2.py` (EXIT=1 przy brakach), wynik `dowody/recon-r2.txt` EXIT=0. Symbole wymienione przez Evaluatora (`_placeSiegeDefenders`, `_attackWallTile`, `_spawnCatapultBoulder`, `_breachWallTile`, `_spawnWallLabel`, `_removeAllUnitsFromField`, `_makeGroupNumberTexture`, `dirYaw`, `lerp`, `easeOut`, `easeIn`, `UNIT_Y`, `HPBAR_Y`, `sideColor`) mają wiersz w tabeli. |
| 3. `compare_camera` (`nan_agnostic`): `zip` nie porównuje długości | **PRZYJMUJĘ** | dodane `c.eq("… len", r.len(), wv.len())` przed pętlą `zip`. |

Do Z-EV-1 Evaluatora: zgoda — kryteria `ctx.*`/`tiny-skia`/RGBA/Chromium/CSS nie dotyczą tego tematu; brak nowych
zależności, `Cargo.toml`/`Cargo.lock` bez zmian.

Bramy r2 (`runs/…-Q2/dowody/gates-r2.txt`; toolchain 1.87.0, `CARGO_INCREMENTAL=0`, `CARGO_PROFILE_DEV_DEBUG=0` z powodu
braku miejsca na dysku współdzielonym przez agentów — pierwszy przebieg na stable przerwał `No space left on device`;
`rustfmt` dla 1.87.0 nie jest zainstalowany, więc `fmt` na stable 1.97.0):

```text
## $ cargo fmt --all -- --check                                         EXIT=0
## $ cargo clippy --locked --all-targets -- -D warnings                  EXIT=0
## $ cargo clippy --locked --all-targets --features gpu -- -D warnings   EXIT=0
## $ cargo test --locked --all-targets   passed=397 failed=0 binaries=52  EXIT=0
## $ cargo test --locked --test battle3d_field        5 passed            EXIT=0
## $ cargo test --locked --test battle3d_siege_wall   3 passed            EXIT=0
## $ sha256sum -c MANIFEST.sha256   12 OK                                 EXIT=0
## $ du -sb tests/fixtures/battle3d   10909784
## $ python3 tests/fixtures/battle3d/mutate_field.py   KILLED 55/55       EXIT=0
## $ git diff --check                                                     EXIT=0
```

`field.json`, generator i `src/battle/field.rs` są w r2 bez zmian (zmiany tylko w teście, mutantach, MANIFEST i dokumentacji).

---

# CZĘŚĆ 3 — jednostki i nakładki (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3)

**TEMAT:** R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3 · **DOMAIN:** GAME · **RUNDA:** 1/5 · **ROLA:** Operator (wywołanie
„impl”: kod + wektory + testy; mutacje i pełne bramy = wywołanie „pomiary”) ·
**Baza:** `rust-port/parity-v2` @ `2c2f58f8` (części 1–2 zintegrowane; wymóg ≥ `7817ef0c`) · **Pin weba:** `edb8fb56`
(three@0.169.0). Sekcje §0–§18 (części 1–2) — bez zmian. Część 3 = §19–§27.

## 19. Streszczenie części 3

1. **Zakres §4 „3 — jednostki i nakładki” zportowany** → nowy moduł `rust-port/renderer/src/battle/units.rs`
   (jedna linia `pub mod units;` w `battle/mod.rs`; `field.rs`, `siege_wall.rs`, `lib.rs`, `Cargo.*` bez zmian).
   Wejście: lista jednostek jako DTO (`UnitSpawn`: strona, kategoria + nazwa modelu + kolor właściciela, kolumna,
   rząd, kierunek, „na murze”, HP / morale / amunicja; Z-36-7); wyjście: węzły jednostek z `models::unit_core`
   (`legacy_route` + `build_model` = webowe `buildUnitModel`) wpięte w scenę pola z części 2 + paski
   (`make_unit_bars`), mur (`place_siege_wall`), pierścienie, strzałki rozkazów, duchy rozstawienia. Mapa §20.
2. **Parytet bit w bit z webem — kod weba URUCHOMIONY:** 11 konstruktorów `new BattleScene(opts)` **z armiami**
   (presety `testBattle.ts`, dwa syntetyczne składy po wszystkich 75 wierszach `units.json` × 16 kategorii ×
   8 kolorów, 4 oblężenia, 3 rozstawienia) — **1 230 jednostek, 160 ruchów rozstawienia, 4 mury, 0 różnic**
   (sygnatura modelu unit-core + świat każdego węzła, pełny strumień rekordów paska, indeksy w `scene.children`,
   podpis struktury całej sceny, liczba węzłów) + operacje po konstrukcji (`_resetDeploySide` ×3,
   `_removeUnitFromScene`, `_removeAllUnitsFromField`, wspinaczka `_activateUnit`) + nakładki wołane wprost:
   paski 10, awatar 3, aktualizacje pasków 18, pierścienie (3 etapy), strzałki 12, kolejka rozkazów 4,
   podgląd rozkazu 11, duchy 16 — **0 różnic** (`tests/battle3d_units.rs`, 8 testów).
3. Stałe `HPBAR_*` / `BAR_*` / `MORALEBAR_Y` / `AMMOBAR_*` / `ORDER_*` / `DIR_DELTA` — kopie z testem równości z
   wartościami modułu weba (`constants_equal_web`).
4. **Mutacje:** przygotowane 42 mutanty (`tests/fixtures/battle3d/mutate_units.py`, każdy wzorzec występuje
   dokładnie raz — sprawdzone); **uruchomienie = wywołanie „pomiary”** (NIE_ZMIERZONO w tym wywołaniu).
   *Dopisek „pomiary” r1:* uruchomione — 41/42 zabite, 1 przeżył (`js_max NaN`), test wzmocniony, dodany
   43. mutant (`js_min NaN`) → **43/43 zabite**; pełne bramy i MSRV 1.87.0 zielone — §28.
5. Determinizm: generator w 2 różnych katalogach (osobny `npm install`, osobny `git archive`) → identyczny
   `units.json` (`6fb3b65a…12b171`) i bundel `gen_units.mjs` (`f59b9842…4bc3`, nie commitowany).
6. Uzgodnienie z inwentarzem: **172 wiersze** (147 `RUNDA-3` + 24 odłożone przez część 2 + 1 dopisany), 0 bez
   statusu — §22.
7. Ocena wizualna 1:1: **NIE_ZMIERZONO** (brak GPU) — §26.

## 20. Mapa symboli → Rust (`battle::units`)

| web (`battleScene.ts` @ `edb8fb56`) | linie | Rust | uwagi |
|---|---|---|---|
| `HPBAR_W/H/Y`, `BAR_GAP_Y`, `MORALEBAR_Y`, `AMMOBAR_Y`, `AMMOBAR_COLOR`, `BAR_OUTLINE_PAD/Z`, `ORDER_LINE_Y`, `ORDER_COLOR_*`, `ORDER_*_OPACITY`, `DIR_DELTA` | 303–308, 667–671, 967–1017 | `pub const` | test równości bitowej |
| `dirYaw` | 1871–1875 | `dir_yaw` | `DIR_DELTA[d] ?? DIR_DELTA[Dir.E]` = fallback dla indeksu spoza 0..3; `atan2` = `js_atan2` |
| `sideColor` | 1009–1011 | `side_color` | |
| `makeFallbackAvatar` | 19321–19342 | `make_fallback_avatar` | Rust używa go tylko przy `NotYetPorted` (Z-36-12) |
| `makeUnitBars` | 19343–19418 | `make_unit_bars` → `UnitBars` | kolejność dzieci: ramka, hp bg/fg, ammo bg/fg, morale bg/fg, maszt, flaga; `PlaneGeometry` = `FieldGeo::Plane` (cz. 2) |
| `_updateHpBar` / `_updateMoraleBar` / `_updateAmmoBar` | 8795–8843 | `update_hp_bar` / `update_morale_bar` / `update_ammo_bar` | `Math.min/max` z NaN; `setRGB` zapisuje kolor liniowy wprost (bez sRGB) |
| `_placeUnits` (część sceny `place`: `:5090-5198`), `_placeUnitsOneSide`, `_placeSiegeDefenders` (`placeOne` `:4191-4279`, korona muru `:4359-4422`) | 4969–5252, 16143–16355, 4139–4437 | `spawn_unit`, `build_battle_scene_with_units`, `BattleScene3::reset_side` | wybór pól → DTO (Z-36-7); kolejność `scene.add`: model, paski, jednostka po jednostce |
| `_placeSiegeWall` (3D) | 3897–3933 | `place_siege_wall` → `PlacedWall` (+ `siege_wall_civ`) | `rotation.y = π/2`, pozycja `cellToWorld`; mur (cz. 1) wstawiony **przed** zabudową (kolejność konstruktora `:3368-3374`) |
| `_initDeployUI` (3D) | 12883–12890 | w `build_battle_scene_with_units` | skala 1 jednostek gracza + warstwa duchów (W-13) |
| `_moveDeployUnit` (3D) | 16092–16105 | `move_deploy_unit`, `BattleScene3::move_deploy_unit` | dopisany (inwentarz: P6.13 — Z-36-8, W-14) |
| `_activateUnit` (3D: wspinaczka) | 5860–5892 | `climb_onto_wall_walkway` | decyzja wspinaczki = logika (P6.13) |
| `_removeUnitFromScene` / `_removeAllUnitsFromField` / `_resetDeploySide` (+ `_clearAllSelection` → `_refreshDeploySelectionVisuals`) | 9065–9080, 9600–9630, 16120–16142 | `remove_unit_from_scene`, `BattleScene3::remove_all_units`, `reset_deploy_side` | `scene.remove` = odłączenie od korzenia |
| `_addSelectionRing` / `_removeSelectionRing` / `_refreshUnitRingColor` / `_refreshDeploySelectionVisuals` (3D) | 17631–17652, 18634–18644, 14967–14980 | `add_selection_ring`, `remove_selection_ring`, `refresh_unit_ring_color`, `refresh_deploy_selection_visuals`, `SelectionRings` | pierścień = dziecko grupy modelu |
| `_makeOrderArrow`, `_clearOrderPreview`, `_disposeQueuedOrderArrows`, `_disposeAllOrderLines`, `_addOrderPreviewArrow`, `_worldAtTile`, `_unitWorldPos`, `_moveTargetForUnit` | 10456–10556, 10649–10653 | `make_order_arrow`, `clear_order_preview`, `dispose_queued_order_arrows`, `dispose_all_order_lines`, `add_order_preview_arrow`, `world_at_tile`, `unit_world_pos`, `move_target_for_unit`, `OrderLayer`, `P3` | `ConeGeometry.rotateX(π/2)` = `UnitGeo::ConeX`; `normalize()` = `divideScalar(length‖1)` odtworzone |
| `_refreshQueuedOrderVisuals` | 10626–10647 | `refresh_queued_order_visuals` | `started && !finished` jako parametr |
| `_updateOrderPreview` | 10683–10752 | `update_order_preview` + `BattleQueries` + `PreviewState` | picking (cz. 5) i zaznaczenie/formacje (P6.13) jako zapytania (Z-36-10) |
| `_clearDeployGhosts`, `_updateDeployPlacementPreview`, `_refreshDeployGhosts`, `_refreshDeployGhostsAt`, `_refreshBattleMoveGhosts`, `_addBattleGhostDisc`, `_getDeploySelectedUnits` | 15224–15292, 15811–15953, 17471–17508 | `clear_deploy_ghosts`, `update_deploy_placement_preview`, `refresh_deploy_ghosts`, `refresh_deploy_ghosts_at`, `refresh_battle_move_ghosts` (+ prywatne) | `RingGeometry`/`CircleGeometry` `.rotateX(-π/2)` = `UnitGeo::FlatRing/FlatCircle`; obrysy = `append_deploy_cell_outline` (cz. 2) |

Typ minimalny (dispatch: `geom/**`, `scene/**` bez zmian): `UnitGeo` (`GeoBody`: obrócone pierścień, dysk, stożek) +
`units::geo_parameters`. Używane tylko publiczne API: `scene` (w tym `graft`), `geom` (prymitywy, `rotate_x`),
`models::unit_core::{legacy_route, build_model}`, `battle::field` (cz. 2), `battle::siege_wall` (cz. 1), `jsmath::js_atan2`,
`terrain::color::Color`.

## 21. Założenia części 3

- **ZAŁOŻENIE Z-36-7 (wejście DTO):** gdzie stoi jednostka (kolumna, rząd, kierunek, „na murze”), jej klucz modelu
  (`kategoria`, `Jednostka ?? nazwa`, `ownerColor`) i HP / morale / amunicja pochodzą z domeny bitwy (P6.13: punktacja pól
  `tileScore`, `layGroup`, `arrangeFlankCavalry`, przydział rzędów muru, `ammoCount`, `moraleBaseFor`, klasyfikacje
  `isMounted`/`isSiegeUnit`/…). Dispatch: „Wejście: lista jednostek jako DTO (typ, strona, pozycja, HP/morale/amunicja)”.
  Test podaje DTO zrzucone z **uruchomionego** weba bezpośrednio po `_placeUnits` / `_placeUnitsOneSide` (opakowania
  prototypu tylko obserwują). Wiersze inwentarza tych funkcji domeny: status `WSPÓLNA … DTO` (§22).
- **ZAŁOŻENIE Z-36-8:** ruchy układu rozstawienia (`_applyDeployLayout` / `_moveDeploySelection` → `_moveDeployUnit`) to
  decyzje domeny; scena portuje ich skutek (`move_deploy_unit`). Test odtwarza 160 wywołań zalogowanych w webie.
  Inwentarz Q1 przypisał `_moveDeployUnit` (#620) do P6.13 (reguła pól klasy nie widzi `ru.group`) — korekta: wiersz
  dopisany do części 3 z powodem.
- **ZAŁOŻENIE Z-36-9:** znaczniki grup (`_updateGroupFrameMarker`, poddrzewo `groupFrame`: `Line` + `Sprite` z teksturą
  canvas) są w części 4 (§4 „znaczniki grup”; `_makeGroupNumberTexture` → cz. 4 w §12a). W trybie rozstawienia UI
  grupuje jednostki gracza i dokłada znaczniki — dumpy części 3 je pomijają i liczą (`markers`: 84 / 36 / 50).
- **ZAŁOŻENIE Z-36-10:** picking (`_pickUnitAtScreen`, `_pickGroundTile` — cz. 5), zaznaczenie, grupy, formacje i układy
  rozstawienia (`_moveDestinationsForSelection`, `_liveGroupMemberIds`, `_computeDeploy*Layout`, `_isDeployCellOk`,
  `_inDeployPlayerZone`, `_passableForUnit`, `occByKey`) są zapytaniami `BattleQueries`; generator wstrzykuje do weba
  małe funkcje (`gen_units.ts` §7–§8), test ma ich lustrzane odbicie `Q`.
- **ZAŁOŻENIE Z-36-11:** NaN haszowany jednym wzorcem po obu stronach (jak §3a: wzorzec bitów NaN zależy od
  implementacji; V8 daje `0xfff8…` z `0/0` i z `Math.min/max`); „NaN-owość” nadal porównywana. Dodatkowo W-12.
- **ZAŁOŻENIE Z-36-12:** `makeFallbackAvatar` jest w webie gałęzią `catch` `buildUnitModel`; żadna z 1 230 jednostek
  (75 nazw × 16 kategorii) nie rzuca — Rust używa awatara tylko przy `NotYetPorted` (brak od MOD-07), test sprawdza
  `fallback_model == false` dla każdej jednostki i sam awatar wprost (3 kolory).
- **Billboard pasków** (`ru.hpBarGroup.lookAt(this.camera.position)` w pętli klatki, `:8523`, `:8547`) i podążanie za ruchem = część 4 (dynamika); stan po
  konstruktorze nie ma obrotu pasków — tak porównano.

## 22. Uzgodnienie z inwentarzem (zakres części 3)

Objęte wiersze: każdy wiersz inwentarza Q1 ze statusem zawierającym `RUNDA-3` (**147**: 3D, MIX i `PODZIAŁ … część sceny →
RUNDA-3`), **24** wiersze odłożone do części 3 przez uzgodnienie części 2 (§12a: `PRZENIESIONY → cz. 3` 12,
`WSPÓLNA … odłożona do cz. 3` 12) i **1** dopisany (`_moveDeployUnit`, Z-36-8). Tabelę wygenerował
`runs/R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3/dowody/recon-q3.py` (statusy wpisane w skrypcie; kolumna `woła` liczona z
`battleScene.ts` @ `edb8fb56` — wywołania `this.<metoda>(` funkcji zportowanych, wprost i przez graf wywołań klasy):

```text
python3 -I dowody/recon-q3.py <inwentarz-battleScene.md (sha 139b84eb…)> <battleScene.ts @ edb8fb56 (sha 38c97736…)> \
        rust-port/renderer/src/battle/units.rs rust-port/renderer/src/battle/field.rs
```

Skrypt kończy się kodem 1, gdy wiersz nie ma statusu, gdy wiersz `ZPORTOWANY*` wskazuje identyfikator nieobecny w
`units.rs` / `field.rs` albo gdy wiersz `PODZIAŁ` nie woła żadnej funkcji sceny (wtedy dostaje status `NIE-DOTYCZY sceny`).
Wynik (`dowody/recon-q3.txt`, `EXIT=0`; dwa przebiegi → tabela identyczna, `cmp`):

```text
LICZNIK: wierszy = 172; NIE PORTOWANY = 3; NIE-DOTYCZY sceny = 3; PODZIAŁ = 56; PRZENIESIONY → cz. 4 = 5; WSPÓLNA = 51;
ZPORTOWANY = 42; ZPORTOWANY częściowo = 6; ZPORTOWANY wcześniej = 6; bez statusu / niezgodnych = 0
```

Kontrola: 3 + 3 + 56 + 5 + 51 + 42 + 6 + 6 = **172** = 147 + 24 + 1.

**Rozbieżności inwentarz ↔ §4 / część 2 (jawnie):**
- 8 z 12 wierszy `PRZENIESIONY → cz. 3` z §12a (`statField`, `ammoCount`, `isAntiCavSpear`, `isPhalanx`,
  `arrangeFlankCavalry`, `isNeverRout`, `moraleBaseFor`, `fleeMoraleFor`) i 9 z 12 `WSPÓLNA … odłożona do cz. 3` (`DIRS4`,
  `attackRange`, `isRanged`, `canShoot`, `isPrimaryRanged`, `isMounted`, `isSiegeUnit`, `normName`, `cellKey`) —
  **zmiana planu na `WSPÓLNA … DTO`**:
  dispatch części 3 ustala wejście jako DTO z pozycją i HP/morale/amunicją (Z-36-7), więc te funkcje domeny nie dostają
  kopii w scenie. Pozostałe 3 (`DIR_DELTA`, `HPBAR_Y`, `dirYaw`) oraz `sideColor`, `_placeSiegeWall`,
  `_placeSiegeDefenders` (część sceny), `_removeAllUnitsFromField` — zportowane.
- `_updateGroupFrameMarker` / `_removeGroupFrameMarker` / `_syncAllGroupFrameMarkers` (inwentarz: `RUNDA-3`) → część 4
  (§4: znaczniki grup; Z-36-9); `_spawnDamageLabel` (`RUNDA-3 — tylko część 3D`) → część 4 (napis = rzut na ekran, cz. 5,
  + DOM); `_endDeployPhase` → część 4 (przejście fazy, `_setDeployZoneVisible` wg §12).
- `_cloneForAutoBatchPlanning` / `_disposeAutoBatchPlanningRoster` (inwentarz: 3D) — `NIE PORTOWANY`: atrapy
  `THREE.Mesh` dla klonów planowania, nigdy nie dodawane do sceny; `_disposeOrderArrowGroup` — `NIE PORTOWANY`
  (`dispose()` = czas życia zasobów GPU, w Rust własność).

| # | linie | symbol | źródło | woła (zportowane; bezpośrednio / pośrednio) | status cz. 3 | Rust / powód |
|---|---|---|---|---|---|---|
| 3 | 303–313 | `DIR_DELTA` | cz. 2 → cz. 3 | — | ZPORTOWANY (cz. 3) | `DIR_DELTA` (`pub const`); test `constants_equal_web`; konsument sceny `dir_yaw` |
| 4 | 314–323 | `DIRS4` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | `DIRS4` = `DIR_DELTA`; konsumenci: ruch/BFS/sąsiedztwo (logika); scena używa `DIR_DELTA` w `dir_yaw` |
| 7 | 347–361 | `oppositeDir` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | jedyny konsument `relativeHit` (logika trafień z flanki/tyłu) |
| 8 | 362–382 | `relativeHit` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | logika trafień (P6.13) |
| 15 | 594–617 | `cloneBattleUnitsForReplay` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | kopia składu do powtórki (`_savedAtkBUs`) — dane, nie scena |
| 41 | 668–668 | `ORDER_COLOR_MOVE` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `ORDER_COLOR_MOVE` … `ORDER_ATTACK_OPACITY` (`pub const` w `battle::units`); test `constants_equal_web` |
| 42 | 669–669 | `ORDER_COLOR_ATTACK` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `ORDER_COLOR_MOVE` … `ORDER_ATTACK_OPACITY` (`pub const` w `battle::units`); test `constants_equal_web` |
| 43 | 670–670 | `ORDER_MOVE_OPACITY` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `ORDER_COLOR_MOVE` … `ORDER_ATTACK_OPACITY` (`pub const` w `battle::units`); test `constants_equal_web` |
| 44 | 671–675 | `ORDER_ATTACK_OPACITY` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `ORDER_COLOR_MOVE` … `ORDER_ATTACK_OPACITY` (`pub const` w `battle::units`); test `constants_equal_web` |
| 57 | 774–774 | `DEPLOY_MID_COL` | RUNDA-3 | — | ZPORTOWANY wcześniej (cz. 2) | `DEPLOY_MID_COL` (`pub const`, `constants_equal_web` cz. 2) |
| 58 | 775–775 | `DEPLOY_MAX_COL` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | stała rozstawienia (wybór pól) — Z-36-7 |
| 60 | 777–777 | `DEPLOY_ATK_FRONT_COL` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | stała rozstawienia (wybór pól) — Z-36-7 |
| 61 | 778–778 | `DEPLOY_ATK_COL_STEP` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | stała rozstawienia (wybór pól) — Z-36-7 |
| 62 | 779–779 | `DEPLOY_MIN_ROW` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | stała rozstawienia (wybór pól) — Z-36-7 |
| 63 | 780–781 | `DEPLOY_MAX_ROW` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | stała rozstawienia (wybór pól) — Z-36-7 |
| 85 | 872–872 | `DEPLOY_DEF_MIN_COL` | RUNDA-3 | — | ZPORTOWANY wcześniej (cz. 2) | `DEPLOY_DEF_MIN_COL` (`pub const`, `constants_equal_web` cz. 2) |
| 87 | 875–875 | `DEPLOY_DEF_FRONT_COL` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | stała rozstawienia (wybór pól) — Z-36-7 |
| 88 | 876–877 | `DEPLOY_DEF_COL_STEP` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | stała rozstawienia (wybór pól) — Z-36-7 |
| 90 | 883–883 | `DEFAULT_BATTLE_MOVE` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | punkty ruchu (logika) |
| 99 | 920–920 | `BROD_KARA_OBRONA` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | mechanika brodu (logika) |
| 100 | 921–927 | `BROD_BONUS_BRZEG` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | mechanika brodu (logika) |
| 101 | 928–932 | `FORTIFY_OBRONA_PROC_FIELD` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | fortyfikacja (logika) |
| 107 | 949–949 | `ACT_GAP_MS` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | tempo tury (czas; harmonogram → P6.13/cz. 4) |
| 112 | 958–966 | `TURN_GAP_MS` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | tempo tury (czas) |
| 113 | 967–967 | `HPBAR_W` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `HPBAR_W`, `HPBAR_H`, `HPBAR_Y`, `BAR_GAP_Y`, `MORALEBAR_Y`, `AMMOBAR_Y`, `AMMOBAR_COLOR`, `BAR_OUTLINE_PAD`, `BAR_OUTLINE_Z`; test `constants_equal_web` |
| 114 | 968–977 | `HPBAR_H` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `HPBAR_W`, `HPBAR_H`, `HPBAR_Y`, `BAR_GAP_Y`, `MORALEBAR_Y`, `AMMOBAR_Y`, `AMMOBAR_COLOR`, `BAR_OUTLINE_PAD`, `BAR_OUTLINE_Z`; test `constants_equal_web` |
| 115 | 978–991 | `HPBAR_Y` | cz. 2 → cz. 3 | — | ZPORTOWANY (cz. 3) | `HPBAR_W`, `HPBAR_H`, `HPBAR_Y`, `BAR_GAP_Y`, `MORALEBAR_Y`, `AMMOBAR_Y`, `AMMOBAR_COLOR`, `BAR_OUTLINE_PAD`, `BAR_OUTLINE_Z`; test `constants_equal_web` |
| 116 | 992–992 | `BAR_GAP_Y` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `HPBAR_W`, `HPBAR_H`, `HPBAR_Y`, `BAR_GAP_Y`, `MORALEBAR_Y`, `AMMOBAR_Y`, `AMMOBAR_COLOR`, `BAR_OUTLINE_PAD`, `BAR_OUTLINE_Z`; test `constants_equal_web` |
| 117 | 993–993 | `MORALEBAR_Y` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `HPBAR_W`, `HPBAR_H`, `HPBAR_Y`, `BAR_GAP_Y`, `MORALEBAR_Y`, `AMMOBAR_Y`, `AMMOBAR_COLOR`, `BAR_OUTLINE_PAD`, `BAR_OUTLINE_Z`; test `constants_equal_web` |
| 118 | 994–994 | `AMMOBAR_Y` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `HPBAR_W`, `HPBAR_H`, `HPBAR_Y`, `BAR_GAP_Y`, `MORALEBAR_Y`, `AMMOBAR_Y`, `AMMOBAR_COLOR`, `BAR_OUTLINE_PAD`, `BAR_OUTLINE_Z`; test `constants_equal_web` |
| 119 | 995–1008 | `AMMOBAR_COLOR` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `HPBAR_W`, `HPBAR_H`, `HPBAR_Y`, `BAR_GAP_Y`, `MORALEBAR_Y`, `AMMOBAR_Y`, `AMMOBAR_COLOR`, `BAR_OUTLINE_PAD`, `BAR_OUTLINE_Z`; test `constants_equal_web` |
| 120 | 1009–1013 | `sideColor` | cz. 2 → cz. 3 | — | ZPORTOWANY (cz. 3) | `side_color`; test `bars_and_fallback_match_web` + parytet pasków |
| 121 | 1014–1016 | `BAR_OUTLINE_PAD` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `HPBAR_W`, `HPBAR_H`, `HPBAR_Y`, `BAR_GAP_Y`, `MORALEBAR_Y`, `AMMOBAR_Y`, `AMMOBAR_COLOR`, `BAR_OUTLINE_PAD`, `BAR_OUTLINE_Z`; test `constants_equal_web` |
| 122 | 1017–1023 | `BAR_OUTLINE_Z` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `HPBAR_W`, `HPBAR_H`, `HPBAR_Y`, `BAR_GAP_Y`, `MORALEBAR_Y`, `AMMOBAR_Y`, `AMMOBAR_COLOR`, `BAR_OUTLINE_PAD`, `BAR_OUTLINE_Z`; test `constants_equal_web` |
| 126 | 1050–1052 | `MORALE_HIT_LOSS_SCALE` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | morale (logika) |
| 127 | 1053–1053 | `MORALE_ALLY_DEATH_LOSS` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | morale (logika) |
| 129 | 1055–1062 | `MORALE_DEATH_RADIUS` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | morale (logika) |
| 130 | 1063–1063 | `MORALE_FLANK_HIT` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | morale (logika) |
| 131 | 1064–1064 | `MORALE_REAR_HIT` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | morale (logika) |
| 132 | 1065–1065 | `MORALE_CHARGE_HIT` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | morale (logika) |
| 133 | 1066–1066 | `MORALE_KILL_GAIN` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | morale (logika) |
| 134 | 1067–1067 | `MORALE_ENEMY_BREAK_GAIN` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | morale (logika) |
| 135 | 1068–1068 | `MORALE_SURROUND_HIT` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | morale okrążenia (`_activateUnit`, logika) |
| 137 | 1070–1070 | `MORALE_ARMY_COLLAPSE_RATIO` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | morale armii (logika) |
| 138 | 1071–1071 | `MORALE_ARMY_COLLAPSE_MULT` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | morale armii (logika) |
| 143 | 1087–1093 | `FALLBACK_TILES` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | wycofanie strzelców (logika) |
| 173 | 1248–1261 | `statField` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | odczyt statystyk → DTO (`ammoCount`/`moraleBaseFor`) |
| 176 | 1307–1312 | `movementPoints` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | punkty ruchu (logika) |
| 178 | 1336–1345 | `attackRange` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | zasięg → DTO (`range` nie wpływa na scenę) |
| 179 | 1346–1359 | `isRanged` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | klasyfikacja → wybór pól (Z-36-7) |
| 180 | 1360–1382 | `ammoCount` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | amunicja startowa → `UnitSpawn::ammo_left/ammo_max` |
| 181 | 1383–1399 | `canShoot` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | logika strzału |
| 182 | 1400–1415 | `isPrimaryRanged` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | klasyfikacja → wybór pól (Z-36-7) |
| 183 | 1416–1433 | `isMounted` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | klasyfikacja → wybór pól (Z-36-7) |
| 184 | 1434–1449 | `isAntiCavSpear` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | klasyfikacja (logika) |
| 185 | 1450–1463 | `isPhalanx` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | klasyfikacja (logika) |
| 186 | 1464–1472 | `isSiegeUnit` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | klasyfikacja → wybór pól (Z-36-7) |
| 187 | 1473–1487 | `isSiegeTower` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | wspinaczka wieżą — decyzja logiki; skutek 3D = `climb_onto_wall_walkway` |
| 188 | 1488–1517 | `arrangeFlankCavalry` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | kolejność rozstawienia (wybór pól, Z-36-7) |
| 189 | 1518–1538 | `bracesAgainstCharge` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | szarża (logika) |
| 190 | 1539–1557 | `isNeverRout` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | morale (logika) |
| 191 | 1558–1570 | `moraleBaseFor` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | morale startowe → `UnitSpawn::morale/morale_max` |
| 192 | 1571–1588 | `fleeMoraleFor` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | morale ucieczki (logika) |
| 194 | 1592–1604 | `normName` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | normalizacja nazw do klasyfikacji (Z-36-7); routing modelu ma własny `norm_name` (`models::unit_core::routing`) |
| 198 | 1729–1740 | `cellBoundsXZ` | RUNDA-3 | — | ZPORTOWANY wcześniej (cz. 2) | `cell_bounds_xz` (`battle::field`) — konsument w cz. 3: obrysy duchów |
| 199 | 1741–1742 | `cellKey` | cz. 2 → cz. 3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | klucz zajętości `occByKey` → `BattleQueries::occupant` |
| 205 | 1841–1850 | `isFordTile` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | bród (logika) |
| 206 | 1851–1860 | `isShoreAdjacentToFord` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | bród (logika) |
| 207 | 1861–1870 | `manhattan` | RUNDA-3 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7) | odległość (logika) |
| 208 | 1871–1881 | `dirYaw` | cz. 2 → cz. 3 | — | ZPORTOWANY (cz. 3) | `dir_yaw` (fallback `Dir.E` dla indeksu spoza tablicy); test `bars_and_fallback_match_web` |
| 224 | 3484–3495 | `BattleScene._executeQueuedOrders` | RUNDA-3 | (_disposeQueuedOrderArrows), (_refreshQueuedOrderVisuals), (_updateAmmoBar), (_updateHpBar), (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 235 | 3897–3986 | `BattleScene._placeSiegeWall` | cz. 2 → cz. 3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnits), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | ZPORTOWANY (cz. 3) | `place_siege_wall` / `PlacedWall` (HUD oblężenia = DOM → P5); test `units_constructor_matches_web` |
| 238 | 4139–4445 | `BattleScene._placeSiegeDefenders` | cz. 2 → cz. 3 | _updateAmmoBar, _updateHpBar, _updateMoraleBar | ZPORTOWANY częściowo (cz. 3: część sceny) | `spawn_unit` (`on_wall_walkway` → `WALL_WALK_Y`); przydział rzędów muru / `placeOne` → P6.13 (Z-36-7) |
| 242 | 4969–5266 | `BattleScene._placeUnits` | RUNDA-3 | _placeSiegeDefenders, _updateAmmoBar, _updateHpBar, _updateMoraleBar | ZPORTOWANY częściowo (cz. 3: część sceny) | `spawn_unit`, `build_battle_scene_with_units`; wybór pól (`place`, `tileScore`, `layGroup`, `arrangeFlankCavalry`) → P6.13 (Z-36-7) |
| 244 | 5296–5329 | `BattleScene._applyStartingMoralePowerPenalty` | RUNDA-3 | _updateMoraleBar | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 246 | 5392–5402 | `BattleScene._beginAutoBatchTurnFromCurrentState` | RUNDA-3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnits), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 247 | 5403–5447 | `BattleScene._beginAutoBatchPhase` | RUNDA-3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnits), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 248 | 5448–5517 | `BattleScene._snapshotAutoBatchIntents` | RUNDA-3 | (_disposeQueuedOrderArrows), (_refreshQueuedOrderVisuals), (_removeUnitFromScene), (_updateAmmoBar), (_updateHpBar), (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 249 | 5518–5542 | `BattleScene._cloneForAutoBatchPlanning` | RUNDA-3 | — | NIE PORTOWANY | atrapy `THREE.Group`/`Mesh` dla klonów planowania auto-tury — nigdy nie trafiają do sceny (`:5518-5557`); logika → P6.13 |
| 250 | 5543–5560 | `BattleScene._disposeAutoBatchPlanningRoster` | RUNDA-3 | — | NIE PORTOWANY | atrapy `THREE.Group`/`Mesh` dla klonów planowania auto-tury — nigdy nie trafiają do sceny (`:5518-5557`); logika → P6.13 |
| 254 | 5657–5674 | `BattleScene._finishAutoBatchPhase` | RUNDA-3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnits), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 255 | 5675–5731 | `BattleScene._activateNext` | RUNDA-3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnits), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 256 | 5732–6044 | `BattleScene._activateUnit` | RUNDA-3 | _updateMoraleBar, (_disposeQueuedOrderArrows), (_refreshQueuedOrderVisuals), (_removeUnitFromScene), (_updateAmmoBar), (_updateHpBar) | ZPORTOWANY częściowo (cz. 3: część sceny) | `climb_onto_wall_walkway` (`:5875-5891`) + `update_morale_bar` (`:5795`); decyzje tury → P6.13 |
| 320 | 8105–8343 | `BattleScene._singleBlow` | RUNDA-3 | _updateHpBar, (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 340 | 8795–8810 | `BattleScene._updateHpBar` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `update_hp_bar` |
| 341 | 8811–8829 | `BattleScene._updateMoraleBar` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `update_morale_bar` (`setRGB` = kolor liniowy wprost) |
| 342 | 8830–8853 | `BattleScene._updateAmmoBar` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `update_ammo_bar` |
| 343 | 8854–8865 | `BattleScene._gainMorale` | RUNDA-3 | _updateMoraleBar | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 344 | 8866–8878 | `BattleScene._boostEnemiesOnBreak` | RUNDA-3 | (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 346 | 8881–8901 | `BattleScene._applyMoraleDamage` | RUNDA-3 | _updateMoraleBar | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 347 | 8902–8919 | `BattleScene._shakeAlliesOnLoss` | RUNDA-3 | _updateMoraleBar | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 348 | 8920–8941 | `BattleScene._checkMeleeScreenLost` | RUNDA-3 | _updateMoraleBar | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 352 | 9065–9081 | `BattleScene._removeUnitFromScene` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `remove_unit_from_scene`; post `removeOne` |
| 354 | 9091–9134 | `BattleScene._spawnDamageLabel` | RUNDA-3 | — | PRZENIESIONY → cz. 4 (dynamika/efekty) | napis obrażeń: pozycja 3D → ekran (`worldToScreen`, cz. 5) + element DOM (P5); dynamika jak `_spawnWallLabel` (cz. 4) |
| 375 | 9600–9631 | `BattleScene._removeAllUnitsFromField` | cz. 2 → cz. 3 | _clearOrderPreview, _disposeAllOrderLines, _disposeQueuedOrderArrows | ZPORTOWANY (cz. 3) | `BattleScene3::remove_all_units`; post `removeAll` (pola DOM/logiki → P5/P6.13) |
| 412 | 10468–10479 | `BattleScene._disposeOrderArrowGroup` | RUNDA-3 | — | NIE PORTOWANY | `dispose()` geometrii/materiałów = czas życia zasobów GPU; w Rust własność/`Drop` (jak `ownedGeos` w cz. 2) |
| 413 | 10480–10523 | `BattleScene._makeOrderArrow` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `make_order_arrow`; test `order_arrows_match_web` |
| 414 | 10524–10532 | `BattleScene._clearOrderPreview` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `clear_order_preview` |
| 415 | 10533–10541 | `BattleScene._disposeQueuedOrderArrows` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `dispose_queued_order_arrows` |
| 416 | 10542–10547 | `BattleScene._disposeAllOrderLines` | RUNDA-3 | _clearOrderPreview, _disposeQueuedOrderArrows | ZPORTOWANY (cz. 3) | `dispose_all_order_lines` |
| 418 | 10557–10597 | `BattleScene._moveDestinationsForSelection` | RUNDA-3 | — | NIE-DOTYCZY sceny (logika → P6.13) | brak wywołań funkcji sceny (bezpośrednich i przez graf wywołań klasy) — sama logika / UI |
| 419 | 10598–10625 | `BattleScene._orderMoveForUnits` | RUNDA-3 | — | NIE-DOTYCZY sceny (logika → P6.13) | brak wywołań funkcji sceny (bezpośrednich i przez graf wywołań klasy) — sama logika / UI |
| 420 | 10626–10648 | `BattleScene._refreshQueuedOrderVisuals` | RUNDA-3 | _disposeQueuedOrderArrows | ZPORTOWANY (cz. 3) | `refresh_queued_order_visuals`; test `queued_order_visuals_match_web` |
| 421 | 10649–10654 | `BattleScene._addOrderPreviewArrow` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `add_order_preview_arrow` |
| 423 | 10683–10753 | `BattleScene._updateOrderPreview` | RUNDA-3 | _addOrderPreviewArrow, _clearDeployGhosts, _clearOrderPreview, _refreshBattleMoveGhosts, _updateDeployPlacementPreview, (_appendDeployCellOutline), (_initDeployGhostLayer), (_refreshDeployGhosts), (_refreshDeployGhostsAt) | ZPORTOWANY (cz. 3) | `update_order_preview` (picking/zaznaczenie przez `BattleQueries`, `PreviewState`); test `order_preview_matches_web` |
| 452 | 11568–11682 | `BattleScene._buildDeployZone` | RUNDA-3 | — | ZPORTOWANY wcześniej (cz. 2) | `FieldScene::build_deploy_zone` |
| 477 | 12710–12726 | `BattleScene._handleDeployGroupTabClick` | RUNDA-3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 483 | 12856–12927 | `BattleScene._initDeployUI` | RUNDA-3 | _initDeployGhostLayer, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | ZPORTOWANY częściowo (cz. 3: część sceny) | w `build_battle_scene_with_units`: skala 1 jednostek gracza (`:12883-12887`) + `init_deploy_ghost_layer`; DOM → P5; auto-grupowanie → P6.13; znaczniki grup → cz. 4 |
| 488 | 12968–12997 | `BattleScene._restoreDeployGroupSnapshot` | RUNDA-3 | _refreshDeploySelectionVisuals, _refreshUnitRingColor, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 490 | 13015–13034 | `BattleScene._autoGroupDeployByKind` | RUNDA-3 | _refreshDeploySelectionVisuals, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 532 | 14025–14049 | `BattleScene._applyDeployLineSettings` | RUNDA-3 | _refreshDeploySelectionVisuals, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 546 | 14337–14347 | `BattleScene._deselectOnRightClick` | RUNDA-3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 547 | 14348–14368 | `BattleScene._clearDeploySelectionState` | RUNDA-3 | _clearDeployGhosts, _refreshDeploySelectionVisuals, _removeSelectionRing, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 556 | 14509–14529 | `BattleScene._selectDeployUnitsByIds` | RUNDA-3 | _addSelectionRing, _refreshDeploySelectionVisuals, _refreshUnitRingColor, _removeSelectionRing, (_addOrderPreviewArrow), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 557 | 14530–14534 | `BattleScene._selectDeployGroupById` | RUNDA-3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 558 | 14535–14542 | `BattleScene._selectDeployByKind` | RUNDA-3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 559 | 14543–14554 | `BattleScene._selectDeployByKindToggle` | RUNDA-3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 560 | 14555–14560 | `BattleScene._selectDeployAll` | RUNDA-3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 561 | 14561–14578 | `BattleScene._selectDeployAllToggle` | RUNDA-3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 562 | 14579–14622 | `BattleScene._selectDeployGroupToggle` | RUNDA-3 | _addSelectionRing, _refreshDeploySelectionVisuals, _refreshUnitRingColor, _removeSelectionRing, (_addOrderPreviewArrow), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 578 | 14967–14994 | `BattleScene._refreshDeploySelectionVisuals` | RUNDA-3 | _clearDeployGhosts, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | ZPORTOWANY (cz. 3) | `refresh_deploy_selection_visuals` (panele DOM → P5) |
| 581 | 15153–15212 | `BattleScene._moveDeploySelection` | RUNDA-3 | _moveDeployUnit, _refreshDeploySelectionVisuals, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 582 | 15213–15223 | `BattleScene._initDeployGhostLayer` | RUNDA-3 | — | ZPORTOWANY wcześniej (cz. 2) | `FieldScene::init_deploy_ghost_layer` |
| 584 | 15230–15245 | `BattleScene._clearDeployGhosts` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `clear_deploy_ghosts` |
| 585 | 15246–15276 | `BattleScene._appendDeployCellOutline` | RUNDA-3 | — | ZPORTOWANY wcześniej (cz. 2) | `FieldScene::append_deploy_cell_outline` — wołana przez duchy cz. 3 |
| 586 | 15277–15297 | `BattleScene._updateDeployPlacementPreview` | RUNDA-3 | _clearDeployGhosts, _refreshDeployGhosts, _refreshDeployGhostsAt, (_appendDeployCellOutline), (_initDeployGhostLayer) | ZPORTOWANY (cz. 3) | `update_deploy_placement_preview`; test `ghosts_match_web` |
| 605 | 15606–15642 | `BattleScene._applyDeployPlacement` | RUNDA-3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 611 | 15800–15810 | `BattleScene._applyDeployLayout` | RUNDA-3 | _refreshDeploySelectionVisuals, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 612 | 15811–15906 | `BattleScene._refreshDeployGhosts` | RUNDA-3 | _appendDeployCellOutline, _clearDeployGhosts, _initDeployGhostLayer | ZPORTOWANY (cz. 3) | `refresh_deploy_ghosts`; test `ghosts_match_web` |
| 613 | 15907–15957 | `BattleScene._refreshDeployGhostsAt` | RUNDA-3 | _appendDeployCellOutline, _clearDeployGhosts, _initDeployGhostLayer | ZPORTOWANY (cz. 3) | `refresh_deploy_ghosts_at`; test `ghosts_match_web` |
| 614 | 15958–15994 | `BattleScene._applyDeployArmyFormation` | RUNDA-3 | _refreshDeploySelectionVisuals, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 615 | 15995–16028 | `BattleScene._applyDeployCavalryMode` | RUNDA-3 | _refreshDeploySelectionVisuals, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 616 | 16029–16053 | `BattleScene._applyDeployAttackDirection` | RUNDA-3 | _refreshDeploySelectionVisuals, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 618 | 16072–16080 | `BattleScene._setDeploySelection` | RUNDA-3 | _addSelectionRing, _refreshDeploySelectionVisuals, (_addOrderPreviewArrow), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 620 | 16092–16110 | `BattleScene._moveDeployUnit` | dopisany | — | ZPORTOWANY częściowo (cz. 3: część sceny) | `move_deploy_unit` / `BattleScene3::move_deploy_unit` (pozycje modelu i pasków); `occByKey` → P6.13; 160 ruchów weba odtworzonych w teście — inwentarz Q1: P6.13 (reguła: brak pól 3D) — ale ciało ustawia `ru.group.position` i `ru.hpBarGroup.position` (`:16101-16102`) |
| 621 | 16111–16115 | `BattleScene._resetDeployPlayer` | RUNDA-3 | _resetDeploySide, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 622 | 16116–16119 | `BattleScene._resetDeployAttacker` | RUNDA-3 | _resetDeploySide, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 623 | 16120–16142 | `BattleScene._resetDeploySide` | RUNDA-3 | _placeUnitsOneSide, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | ZPORTOWANY (cz. 3) | `BattleScene3::reset_side` / `reset_deploy_side`; posty `resetAtk`/`resetDef` |
| 624 | 16143–16355 | `BattleScene._placeUnitsOneSide` | RUNDA-3 | _placeSiegeDefenders, _updateAmmoBar, _updateHpBar, _updateMoraleBar | ZPORTOWANY częściowo (cz. 3: część sceny) | `spawn_unit` (przez `BattleScene3::reset_side`); wybór pól → P6.13 (Z-36-7) |
| 625 | 16356–16363 | `BattleScene._placeUnitsAtkOnly` | RUNDA-3 | _placeUnitsOneSide, (_placeSiegeDefenders), (_updateAmmoBar), (_updateHpBar), (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 626 | 16364–16394 | `BattleScene._endDeployPhase` | RUNDA-3 | _clearDeployGhosts, _clearOrderPreview, _disposeAllOrderLines, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PRZENIESIONY → cz. 4 (dynamika/efekty) | przejście fazy (koniec rozstawienia): `_setDeployZoneVisible` jest w cz. 4/5 (§12); czyszczenia (`_clearDeployGhosts`, `_clearOrderPreview`, `_disposeAllOrderLines`) zportowane |
| 667 | 17279–17365 | `BattleScene._performPlayerOrder` | RUNDA-3 | _refreshQueuedOrderVisuals, (_disposeQueuedOrderArrows), (_updateAmmoBar), (_updateHpBar), (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 668 | 17366–17404 | `BattleScene._executeUnitsImmediate` | RUNDA-3 | _refreshQueuedOrderVisuals, (_disposeQueuedOrderArrows), (_updateAmmoBar), (_updateHpBar), (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 669 | 17405–17422 | `BattleScene._collectOrderUnitIds` | RUNDA-3 | — | NIE-DOTYCZY sceny (logika → P6.13) | brak wywołań funkcji sceny (bezpośrednich i przez graf wywołań klasy) — sama logika / UI |
| 670 | 17423–17441 | `BattleScene._issueBattleAttack` | RUNDA-3 | _refreshQueuedOrderVisuals, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 671 | 17442–17470 | `BattleScene._issueBattleMove` | RUNDA-3 | _refreshQueuedOrderVisuals, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 672 | 17471–17490 | `BattleScene._refreshBattleMoveGhosts` | RUNDA-3 | _clearDeployGhosts | ZPORTOWANY (cz. 3) | `refresh_battle_move_ghosts`; test `ghosts_match_web` |
| 673 | 17491–17509 | `BattleScene._addBattleGhostDisc` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `add_battle_ghost_disc` (prywatna) |
| 675 | 17579–17595 | `BattleScene._toggleSelectUnit` | RUNDA-3 | _addSelectionRing, _refreshDeploySelectionVisuals, _removeSelectionRing, (_addOrderPreviewArrow), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 676 | 17596–17612 | `BattleScene._selectGroup` | RUNDA-3 | _addSelectionRing, _refreshDeploySelectionVisuals, (_addOrderPreviewArrow), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 677 | 17613–17630 | `BattleScene._clearAllSelection` | RUNDA-3 | _refreshDeploySelectionVisuals, _removeSelectionRing, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 678 | 17631–17646 | `BattleScene._addSelectionRing` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `add_selection_ring`; test `selection_rings_match_web` |
| 679 | 17647–17654 | `BattleScene._removeSelectionRing` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `remove_selection_ring` |
| 680 | 17655–17665 | `BattleScene._orderHoldSelected` | RUNDA-3 | _refreshQueuedOrderVisuals, (_disposeQueuedOrderArrows) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 695 | 18488–18513 | `BattleScene._detachUnitsFromGroups` | RUNDA-3 | _refreshUnitRingColor | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 696 | 18514–18581 | `BattleScene._groupSelected` | RUNDA-3 | _refreshDeploySelectionVisuals, _refreshUnitRingColor, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 697 | 18582–18599 | `BattleScene._disbandGroup` | RUNDA-3 | _refreshUnitRingColor | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 698 | 18600–18633 | `BattleScene._ungroupSelected` | RUNDA-3 | _refreshDeploySelectionVisuals, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 699 | 18634–18646 | `BattleScene._refreshUnitRingColor` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `refresh_unit_ring_color` |
| 701 | 18668–18683 | `BattleScene._removeGroupFrameMarker` | RUNDA-3 | — | PRZENIESIONY → cz. 4 (dynamika/efekty) | znaczniki grup (§4 cz. 4); `_makeGroupNumberTexture` już → cz. 4 (§12a); tekstura canvas = raster |
| 702 | 18684–18730 | `BattleScene._updateGroupFrameMarker` | RUNDA-3 | — | PRZENIESIONY → cz. 4 (dynamika/efekty) | jw.; w testach cz. 3 poddrzewa `groupFrame` są wyłączone z dumpów (liczone: `markers`) |
| 703 | 18731–18741 | `BattleScene._syncAllGroupFrameMarkers` | RUNDA-3 | — | PRZENIESIONY → cz. 4 (dynamika/efekty) | jw. (synchronizacja znaczników) |
| 705 | 18747–18768 | `BattleScene._selectBattleUnitsByIds` | RUNDA-3 | _addSelectionRing, _refreshUnitRingColor, _removeSelectionRing, (_addOrderPreviewArrow), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 706 | 18769–18789 | `BattleScene._selectBattleGroupToggle` | RUNDA-3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 707 | 18790–18804 | `BattleScene._selectBattleGroupReplace` | RUNDA-3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 708 | 18805–18826 | `BattleScene._advanceToNextBattleUnit` | RUNDA-3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 709 | 18827–18852 | `BattleScene._handleBattleUnitPick` | RUNDA-3 | _addSelectionRing, _refreshUnitRingColor, _removeSelectionRing, (_addOrderPreviewArrow), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 712 | 18955–18974 | `BattleScene._selectBattleByKindToggle` | RUNDA-3 | (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshDeploySelectionVisuals), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 714 | 18996–19030 | `BattleScene._toggleSelectUnitOrGroup` | RUNDA-3 | _addSelectionRing, _refreshDeploySelectionVisuals, _refreshUnitRingColor, _removeSelectionRing, (_addOrderPreviewArrow), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 717 | 19058–19078 | `BattleScene._applyGroupFormation` | RUNDA-3 | _refreshDeploySelectionVisuals, (_addOrderPreviewArrow), (_addSelectionRing), (_appendDeployCellOutline), (_clearDeployGhosts), (_clearOrderPreview), (_disposeAllOrderLines), (_disposeQueuedOrderArrows), (_initDeployGhostLayer), (_moveDeployUnit), (_placeSiegeDefenders), (_placeUnitsOneSide), (_refreshBattleMoveGhosts), (_refreshDeployGhosts), (_refreshDeployGhostsAt), (_refreshQueuedOrderVisuals), (_refreshUnitRingColor), (_removeSelectionRing), (_removeUnitFromScene), (_resetDeploySide), (_updateAmmoBar), (_updateDeployPlacementPreview), (_updateHpBar), (_updateMoraleBar), (_updateOrderPreview) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła` |
| 720 | 19321–19342 | `makeFallbackAvatar` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `make_fallback_avatar`; test `bars_and_fallback_match_web` |
| 721 | 19343–19418 | `makeUnitBars` | RUNDA-3 | — | ZPORTOWANY (cz. 3) | `make_unit_bars` / `UnitBars`; test `bars_and_fallback_match_web` + każda jednostka konstruktora |

## 23. Generator i dane referencyjne (`tests/fixtures/battle3d/`, README tamże, „Part 3”)

- `gen_units.ts` importuje **niezmieniony** `battle/battleScene.ts` (+ graf importów, `testBattle.ts`, `data/units.json`)
  z `git archive edb8fb56`; bundel `build_units.mjs` = `build_field.mjs` z dłuższą dopisaną linią `export { … }`;
  stuby `dom_stub.ts` / `three_shim.ts` z części 2 bez zmian. Kroki obserwacyjne: opakowania prototypu
  `_placeUnits` / `_placeUnitsOneSide` (zrzut DTO) i `_moveDeployUnit` (log ruchów) — wołają oryginał bez zmian.
- `units.json` 645 438 B; katalog fixtur po części 3: **11 614 998 B** (≤ 12 MB), największy plik nadal
  `siege_wall.json` 7 228 812 B (≤ 8 MB); `MANIFEST.sha256` 16 plików, `sha256sum -c` OK. `gen_units.mjs` (2,80 MB)
  nie jest commitowany (budżet) — SHA-256 w README.
- Przypadki i format rekordów: README „Part 3” (§ Cases, § Record format).

## 24. Testy (`tests/battle3d_units.rs`) i testy jednostkowe

- `units_constructor_matches_web` — 11 konstruktorów: dla każdej jednostki indeks modelu i pasków w `scene.children`,
  `ammoBarShown`, brak awatara awaryjnego, rekord modelu `[węzły, meshe, trójkąty, sygnatura unit-core, świat wszystkich
  węzłów]`, rekord pasków `[węzły, FNV strumienia]` (pierwsza jednostka węzeł po węźle); mur: indeks, rekord modelu,
  `p`/`r`/`q`, rozmiary `rowWallMeshes` / `rowBreachPanels`, brama w poddrzewie muru; podsumowanie sceny (dzieci korzenia,
  liczba węzłów, FNV struktury); indeks warstwy duchów; posty (reset ×3 z ruchami, usunięcia, wspinaczka).
- `bars_and_fallback_match_web`, `selection_rings_match_web`, `order_arrows_match_web`,
  `queued_order_visuals_match_web`, `order_preview_matches_web`, `ghosts_match_web` — pełne strumienie rekordów węzłów
  (kind, nazwa, rodzic, pozycja, Euler, kwaternion, skala, `matrixWorld`, cienie, widoczność, `renderOrder`, tożsamość +
  sygnatura materiału, typ / hasz / parametry geometrii, `lineDistance`), przy różnicy raport pole po polu.
- `constants_equal_web` — stałe i `DIR_DELTA`.
- Jednostkowe w `battle::units`: formuły stałych, fallback `dir_yaw`, `js_min`/`js_max` (NaN, ±0).

## 25. Bramy tego wywołania (`runs/…-Q3/dowody/tests-impl-r1.txt`) i plan „pomiarów”

Polecenia z `rust-port/renderer`, `CARGO_INCREMENTAL=0`, `CARGO_PROFILE_DEV_DEBUG=0`,
`CARGO_TARGET_DIR=/home/user/cargo-target-shared/<worktree>`, rustc 1.97.0:

```text
## $ cargo fmt --all -- --check                                    EXIT=0
## $ cargo clippy --locked --lib --test battle3d_units -- -D warnings  EXIT=0
## $ cargo test --locked --test battle3d_units -- --nocapture      8 passed  EXIT=0
units ctor: 11 cases, 1230 units, 160 deploy moves, scalars 46, checks 11123
## $ cargo test --locked --test battle3d_field --test battle3d_siege_wall   5 + 3 passed  EXIT=0
## $ cargo test --locked --lib battle::                            10 passed  EXIT=0
## $ sha256sum -c MANIFEST.sha256 (16)                             EXIT=0
## $ du -sb tests/fixtures/battle3d                                11614998
```

(Liczby przepisane z logu — w razie różnicy wiąże log.) **NIE_ZMIERZONO w tym wywołaniu (zakres „pomiarów”):**
`cargo clippy --locked --all-targets [--features gpu] -- -D warnings`, `cargo test --locked --all-targets`, MSRV 1.87.0,
`python3 tests/fixtures/battle3d/mutate_units.py` (42 mutanty: stałe, paski, progi kolorów, NaN, widoczność amunicji,
reguła `ammoShown`, awatar, wysokość pasków, reset skali rozstawienia, obrót / środek muru, ukrywanie przy usuwaniu,
ruch rozstawienia, wspinaczka, pierścienie, strzałki, domyślny offset formacji, strażnik trybu ręcznego, strona okupanta,
deduplikacja grup, kolory / krycie duchów, obrysy).

## 26. Co ocenić wzrokiem po RR-T5 (NIE_ZMIERZONO — wymaga GPU)

1. Jednostki w kadrze bitwy: modele `buildUnitModel` (skala własna modelu, np. 1,163 włócznika), zwrot E/W
   (`dirYaw`), stanie na wierzchołku wzgórza (`tileTopY`) i na koronie muru (2,5).
2. Stos pasków nad jednostką: ramka w kolorze strony (gracz 0x3a6ad0 / przeciwnik 0xc84040), HP (zielony / żółty /
   czerwony wg progów 0,6 / 0,3), morale (gradient), amunicja (niebieska, pusta = czarne pole), proporczyk na maszcie;
   **billboard pasków** dopiero z częścią 4 (w części 3 paski patrzą w +Z).
3. Tryb rozstawienia: modele z własną skalą rysowane w skali 1 (W-13); obrońcy oblężenia zdjęci z muru na ziemię (W-14).
4. Pierścienie zaznaczenia (cyjan / złoty dla grupy, 0,85), strzałki rozkazów (ruch niebieski 0,30, atak czerwony 0,45,
   podgląd 0,38; grot do 0,55), duchy rozstawienia (dyski / pierścienie, kotwica, obrys przerywany i ciągły).
5. Mur obrócony wzdłuż Z na kolumnie `siegeWallCol` (40), środek na rzędzie 77,5; zabudowa za murem wstawiona po murze.

## 27. Obserwacje o webie (część 3; port 1:1, bez zmian w `gra/**`)

- **W-12** `Color.getHex()` przy kanale NaN: three sumuje zaokrąglone kanały → całość NaN → `>>> 0` = 0; `terrain::color::
  Color::to_hex` (poza `battle/**`) zaokrągla kanały osobno. Osiągalne tylko przez morale NaN (`moraleBaseFor` ogranicza
  morale do [10, 300], więc w grze nie); kanały liniowe porównane dokładnie, w teście `mat_sig` liczy `getHex` jak three.
- **W-13** `_initDeployUI` (`:12883-12887`) i `_refreshDeploySelectionVisuals` (`:14971`) ustawiają `group.scale = 1`
  jednostkom gracza — model z własną skalą korzenia (zmierzone: włócznik w Rust 1,163, w scenie weba 1) w trybie
  rozstawienia traci ją, w zwykłej bitwie ją ma.
- **W-14** W oblężeniu z rozstawieniem obrońcy postawieni na koronie muru (y = 2,5) są przesuwani `_moveDeployUnit` na
  `wallCol + 1` z `y = tileTopY`, a `onWallWalkway` zostaje `true` (zmierzone: `deploy-siege-def`, `def0` q = 41, y = 0).
- **W-15** `_makeOrderArrow` bierze `y = from.y` dla obu końców — strzałka do celu wyżej / niżej leży płasko na wysokości
  źródła (przypadek `arrows` 8).
- **W-16** `_cloneForAutoBatchPlanning` tworzy 6 meshy z `BoxGeometry` / `MeshBasicMaterial` na każdy klon planowania
  (nigdy w scenie) — tylko koszt CPU.
- **Dryf weba po pinie** (`git diff --stat edb8fb56 origin/main -- gra/src/battle gra/src/render`, `origin/main` =
  `91dc998a`): 13 plików, +629 / −213; `battleScene.ts` ±335 (m.in. `_placeUnits` / `_placeUnitsOneSide` — nowe
  `formationRules.ts`, pola `isArmyCommander` / `formationRank`, sprzątanie pamięci po bitwie), `render/units.ts` 109 linii
  (modele MOD-04…07). Nie przepinam (dispatch); wpływ na wektory części 3 NIE_ZMIERZONO.

## 28. Pomiary części 3 (Operator „pomiary” r1; logi `runs/…-Q3/dowody/{gates-pomiary-r1,mutate-units-r1,verify-gen-r1}.txt`)

Na commicie Operatora-impl `d2fecbb3` (+ raport `1b73d2e1`), worktree izolowany, `CARGO_INCREMENTAL=0`,
`CARGO_PROFILE_DEV_DEBUG=0`, rustc 1.87.0 (MSRV) i 1.97.0 (stable).

1. **Mutacje** (`mutate_units.py`, 1.87.0, w trzech partiach przez `MUTANTS[a:b]`): pierwszy przebieg **41/42 zabite**,
   przeżył `js_max NaN` (`if a.is_nan() { return b; }`). Przyczyna: test jednostkowy sprawdzał tylko `js_max(0.0, NaN)`,
   a ten przypadek mutant obsługuje poprawnie (`a > b` fałsz → `b` = NaN). Wszystkie wywołania produkcyjne
   (`units.rs` :432, :451, :456, :477, :482, :1148) mają stały, nie-NaN pierwszy argument, więc mutant jest
   **równoważny na osiągalnych wejściach** (stąd 0 różnic w wektorach). Poprawka testowa (bez zmian logiki):
   `js_min_max_follow_ecmascript` dostał `js_max(NaN, 0.0)` i `js_min(1.0, NaN)`; dodany mutant lustrzany
   `js_min NaN`. Wynik końcowy: **43/43 zabite** (`js_max NaN` i `js_min NaN` uruchomione na poprawionym teście;
   pozostałe 41 zabite przy teście słabszym, a poprawka tylko dodaje asercje).
2. **Bramy po poprawce:** `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets -- -D warnings`
   EXIT=0 i z `--features gpu` EXIT=0 — oba na 1.87.0 i na 1.97.0; `cargo test --locked --all-targets` (1.87.0)
   **408 passed, 0 failed, 53 binaria**, EXIT=0; `battle3d_units` 8 + `battle3d_field` 5 + `battle3d_siege_wall` 3
   (16 passed) EXIT=0; `--lib battle::units` 3/3 EXIT=0; `sha256sum -c MANIFEST.sha256` 16/16 EXIT=0; katalog fixtur
   11 623 280 B (≤ 12 MB), największy plik `siege_wall.json` 7 228 812 B (≤ 8 MB); `git diff --check` EXIT=0.
3. **Niezależny weryfikator generatora:** trzeci, osobny katalog poza repo (nowy `npm install --ignore-scripts
   three@0.169.0 esbuild@0.24.0`, nowy `git archive edb8fb56 gra/src gra/data`, node v22.22.0) — `build_units.mjs` +
   `gen_units.mjs` → `battle3d units ctor=11 units=1230 bars=10 arrows=12 preview=11 ghosts=16`; `units.json`
   `6fb3b65a…12b171` = commit/MANIFEST, bundel `f59b9842…4bc3` = README. Próbka stałych w źródle weba @ `edb8fb56`:
   `HPBAR_W = 0.32` (`battleScene.ts:967`), `HPBAR_Y = 0.72` (:978), korona muru 2,5 (:4361, :5887), progi HP `> 0.60` /
   `> 0.30` (:8800–8801), strzałka `len < 0.08` (:10485), `Math.min(0.48, len * 0.24)` (:10492), duch `0x44aaff`
   (:17500), pierścień `RingGeometry(0.45, 0.58, 24)` (:17633) — zgodne z `units.rs`.
4. **Dryf weba** odmierzony ponownie: `origin/main` = `91dc998a`, 13 plików +629 / −213 — bez zmian względem §27.
5. NIE_ZMIERZONO nadal: ocena wzrokowa (§26), wpływ dryfu po pinie na wektory (§27).

---

# CZĘŚĆ 4 — dynamika i efekty (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q4)

**TEMAT:** R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q4 · **DOMAIN:** GAME · **RUNDA:** 1/5 · **ROLA:** Operator (wywołanie
„impl”: kod + wektory + testy; mutacje i pełne bramy = wywołanie „pomiary”) ·
**Baza:** `rust-port/parity-v2` @ `364a5356` (części 1–3 zintegrowane) · **Pin weba:** `edb8fb56` (three@0.169.0).
Sekcje §0–§28 (części 1–3) — bez zmian. Część 4 = §29–§37. Część 5 (picking, kamera) — poza zakresem.

## 29. Streszczenie części 4

1. **Zakres §4 „4 — dynamika i efekty” zportowany** → nowy moduł `rust-port/renderer/src/battle/dynamics.rs`
   (jedna linia `pub mod dynamics;` w `battle/mod.rs`; `field.rs`, `units.rs`, `siege_wall.rs`, `lib.rs`, `Cargo.*` bez
   zmian). Wejście: stan sceny z części 3 (`BattleScene3`) + zdarzenia bitwy jako DTO (cel ruchu, atak, strzał, śmierć,
   wyłom, ucieczka, grupa, kamera) + czas wirtualny `t` (zegar zegarowy dla napisów); wyjście: transformacje (pozycja,
   obrót, skala), krycie materiałów i flagi widoczności w funkcji (stan, t), deterministycznie. Mapa §30.
2. **Parytet bit w bit z webem — kod weba URUCHOMIONY:** generator podmienia `requestAnimationFrame` na rejestrator i
   steruje zegarem wirtualnym (`vNow = t`, potem kolejka klatek), tickery woła wprost. Jedna scena oblężenia (`oblezenie`,
   `rzym`, 83 jednostki) i **23 zdarzenia** odtwarzane po kolei: 6 ruchów (wzgórze, rzeka, bród), 3 ciosy wręcz (z kontrą,
   z zabitym napastnikiem), 4 pociski (strzała, kamień z procy, oszczep, pilum), 2 zanikania, 2 przebiegi taranu (pełny,
   przerwany `finished`), lot kamienia katapulty z trafieniem i wyłomem, 4 wyłomy muru, wyłom bramy, ucieczka z usunięciem,
   znaczniki grup (10 kroków + synchronizacja), billboard pasków (2 kamery × 83), 10 napisów × 10 chwil — **0 różnic**
   (`dynamics_match_web`: 696 liczb bitowo + 1 417 sprawdzeń sygnatur/flag); rozstawienie `rzym_grecja`: 84 znaczniki
   grup interfejsu, klatka fazy rozstawienia, `_endDeployPhase` — **0 różnic**; `projectileKind` 306 par +
   `makeProjectileMesh` 4 rodzaje — **0 różnic**; stałe i easing — **0 różnic** (`tests/battle3d_dynamics.rs`, 4 testy).
3. Stałe `MOVE_STEP_MS`, `STEP_GAP_MS`, `RANGED_FLY_MS`, `RANGED_GAP_MS`, `DEATH_FADE_MS`, `BLOW_LUNGE_MS`, `BLOW_HIT_T`,
   `BLOW_SETTLE_MS`, `MORALE_GATE_BREACH`, `MORALE_WALL_BREACH` — kopie z testem równości z wartościami modułu weba.
4. **Mutacje:** przygotowane 48 mutantów (`tests/fixtures/battle3d/mutate_dynamics.py`, każdy wzorzec dokładnie raz —
   sprawdzone); **uruchomienie = wywołanie „pomiary”** (NIE_ZMIERZONO w tym wywołaniu).
5. Determinizm: generator w 2 różnych katalogach (osobny `npm install`, osobny `git archive`) → identyczny
   `dynamics.json` (`4c7bcc21…ae89e0`) i bundel `gen_dynamics.mjs` (`9d5071a4…b834a`, nie commitowany).
6. Uzgodnienie z inwentarzem: **67 wierszy** (31 `RUNDA-4` + 24 odłożone przez część 2 + 5 przez część 3 + 7 dołączonych),
   0 bez statusu — §32.
7. Ocena wizualna 1:1: **NIE_ZMIERZONO** (brak GPU) — §36.

## 30. Mapa symboli → Rust (`battle::dynamics`)

| web (`battleScene.ts` @ `edb8fb56`) | linie | Rust | uwagi |
|---|---|---|---|
| `MOVE_STEP_MS`, `STEP_GAP_MS`, `RANGED_FLY_MS`, `RANGED_GAP_MS`, `DEATH_FADE_MS`, `BLOW_LUNGE_MS`, `BLOW_HIT_T`, `BLOW_SETTLE_MS`, `MORALE_GATE_BREACH`, `MORALE_WALL_BREACH` | 945–957, 1073–1074 | `pub const` | test równości bitowej; stałe harmonogramu (`STEP_GAP_MS`, `RANGED_GAP_MS`, `BLOW_SETTLE_MS`) konsumuje logika |
| literały animacji (taran 320 ms / 0,25; kamień 700 ms / łuk 3,5; łuk pocisku 0,6; skok kroku 0,12; napis 2000 ms / 0,00012) | 7032–7033, 7244–7245, 8589, 8059, 7489–7491, 9114–9116 | `RAM_MS`, `RAM_REACH`, `BOULDER_MS`, `BOULDER_ARC`, `PROJECTILE_ARC`, `MOVE_HOP`, `FLOAT_LABEL_MS`, `FLOAT_LABEL_RISE` | sprawdzane zachowaniem (pozycje w klatkach) |
| `lerp`, `easeOut`, `easeIn` | 19438–19441 | `lerp`, `ease_out`, `ease_in` | |
| `projectileKind` | 1605–1615 | `projectile_kind`, `ProjectileKind` | `normName` = `models::unit_core::routing::norm_name` (ten sam algorytm NFD + `ł→l`); wołający rozwiązuje `stats.Jednostka ?? nazwa` |
| `makeProjectileMesh` | 1628–1717 | `make_projectile_mesh` → `Scene` | kolejność dzieci: trzon, grot, (trzpień pilum / lotka strzały); materiały drewno / żelazo / kamień |
| `_doRangedAttack` (3D) | 8447–8489 | `ranged_shot_endpoints`, `launch_projectile`, `set_facing` (+ `update_ammo_bar`, cz. 3) | `setFromUnitVectors((1,0,0), dir)` przy `|dir|² > 1e-6`; `quaternion.copy` przepisuje też `rotation` (`Euler.setFromQuaternion`) |
| `_tickProjectiles` | 8584–8600 | `tick_projectiles`, `Projectile::sample` | `scene.remove` = odłączenie od korzenia |
| `_doMove` (3D) | 8011–8072 | `MoveAnim` (`start`, `sample`, `step`) | wysokości kafli czytane przed zmianą komórki; ostatnia klatka = dokładnie cel |
| `_doMeleeAttack` (3D) | 8361–8440 | `MeleeLunge` (`start`, `pose`, `hit_due`, `step`), `set_facing` | moment ciosu `localT ≥ 150` raz; martwy / zanikający napastnik nie jest przesuwany |
| `_startFade` (3D) / `_tickFades` | 9082–9089, 8602–8622 | `Fade`, `tick_fades` | materiały z `userData.mats` modelu (część 3 przenosi je przez `Scene::graft`) |
| `_attackGate` (3D) / `_animateRam` | 7007–7013, 7029–7053 | `RamAnim` | kierunek z bieżącej pozycji taranu; `finished` → powrót do startu |
| `_attackWallTile` (3D) / `_spawnCatapultBoulder` | 7212–7216, 7235–7269 | `wall_shot_endpoints`, `Boulder` | kula `SphereGeometry(0.32, 7, 7)`; usunięcie po `t ≥ 1` lub `finished` |
| `_breachWallTile` | 7302–7416 | `breach_wall_tile`, `retreat_from_wall` | kafel → Plains, segmenty `rowWallMeshes.get(row)` (SameValueZero) ukryte, 7 brył gruzu (`tileJitter`, sól `200 + 11 i`); pole odwrotu = DTO |
| `_breachGate` | 7421–7474 | `breach_gate` | kafle bramy `Gate → Plains`, grupa bramy i meshe przy bramie (reguła `:7451-7465`) ukryte; morale = DTO → `update_morale_bar` |
| `_spawnWallLabel` / `_spawnDamageLabel` (3D) / `_tickFloatLabels` (przed rzutem) | 7477–7493, 9091–9118, 8624–8643 | `FloatLabel::wall`, `FloatLabel::damage`, `FloatLabel::sample` | element DOM → P5, `worldToScreen` → cz. 5 |
| `_startRout` (3D) | 8971–8972 | `rout_facing`, `set_facing` | |
| `_makeGroupNumberTexture` | 18647–18665 | `GroupNumberTexture` (`SIZE`, `ops`), `CanvasOp` | canvas jako dane (jak `GlyphTexture`) |
| `_removeGroupFrameMarker` / `_updateGroupFrameMarker` / `_syncAllGroupFrameMarkers`, `_groupDisplayNum` | 18668–18739, 14413–14417 | `GroupMarkers` (`remove`, `update`, `sync_all`), `GroupMarker`, `group_display_num`, `js_parse_int10` | `Line` jako `OutlineLine` (`FieldScene::lines`, cz. 2), `Sprite` 0,55 z `depthTest: false`; `String(n)` = `models::cities::model::js_number_to_string` |
| pętla klatki: `hpBarGroup.lookAt(camera.position)` | 8522–8524, 8546–8548 | `billboard`, `billboard_all` | `Object3D.lookAt` nie-kamery (three r169 `Object3D.js:271-311`): `Matrix4.lookAt(target, pozycja świata, up)`, korekta obrotem rodzica (`extractRotation`, `invert`, `premultiply`) |
| gałąź rozstawienia pętli klatki (3D) | 8515–8526 | `deploy_phase_frame` | |
| `_setDeployZoneVisible` (3D), `_endDeployPhase` (3D) | 11695–11699, 16364–16389 | `set_deploy_zone_visible`, `end_deploy_phase` | |

Typ minimalny: brak nowego typu geometrii (pociski, kamień i gruz to `Prim` sceny; ramka znacznika to `FieldGeo::Polyline`
z części 2). Używane tylko publiczne API: `scene`, `geom`, `pick::three` (`Mat4::look_at`, `Quat::from_rotation_matrix`),
`battle::{field, units}`, `jsmath::js_sin`, `models::unit_core::routing::norm_name`, `models::cities::model::js_number_to_string`.

## 31. Założenia części 4

- **ZAŁOŻENIE Z-36-13 (wejście DTO zdarzeń):** CO się dzieje decyduje logika bitwy (P6.13): cel i kolejne kroki ruchu
  (zajętość, koszt, `moveLeft`), nowy kierunek po `_updateFacing` / ataku (`facingFromTo`), trafienie / obrażenia / kontra
  (`_singleBlow`, `_defenderCounters`), śmierć, rozbicie (`_checkRout`), pole odwrotu obrońcy z wyburzonego kafla,
  zniszczenie katapulty obrońcy, morale, HP bramy / kafla, harmonogram (`_schedule`). Scena dostaje wynik i liczy
  transformacje. Generator testu wstrzykuje proste zaślepki (`_singleBlow` = stałe obrażenia, `_defenderCounters` =
  przełącznik przypadku, `_schedule` = rejestr) i zapisuje decyzje weba; test je odtwarza.
- **ZAŁOŻENIE Z-36-14 (czas):** animacje są funkcjami czasu wirtualnego `vNow` (`_now()`, `:8661`), napisy — czasu
  zegarowego (`vLastWall` / `t` pętli, `:7489`, `:9113`, `:8542`); oba są wejściem. Przerwanie przez `finished` /
  `_autoBattleSuspended` w krokach ruchu i ciosu (`:8051`, `:8383`) = wołający przestaje krokować (bez zmiany sceny,
  jak w webie); taran i kamień mają jawny parametr `finished` (web zmienia scenę: powrót / usunięcie).
- **ZAŁOŻENIE Z-36-15 (zasoby):** `ownedGeos` / `ownedMats` / `dispose()` = czas życia zasobów GPU — w Rust własność;
  znaczniki grup trzyma tablica `GroupMarkers` (web: `_groupFrameMarkers`), tekstura numeru jest daną
  (`GroupNumberTexture`), rasteryzacja → rasteryzator tekstu (NIE_ZMIERZONO wzrokowo).
- **ZAŁOŻENIE Z-36-16 (zakres dołączony):** 7 wierszy, które inwentarz Q1 przypisał gdzie indziej, a które mają część
  sceny z §4 (pociski, zanikanie, aktualizacja pasków, napisy, strefa rozstawienia, numer grupy) — dołączone z powodem
  w tabeli §32. W szczególności `makeProjectileMesh` (inwentarz: RUNDA-5) jest wymieniony wprost w GOAL dispatchu.
- **ZAŁOŻENIE Z-36-17 (macierze świata w generatorze):** dumpy weba robią `updateWorldMatrix(true, true)` (przodkowie
  też), bo bez renderu `matrixWorld` rodzica bywa nieaktualny (zmierzone w r1: 2 znaczniki grup jednostek, których
  `matrixWorld` nie liczono od konstruktora, różniły się tylko macierzą świata) — test Rust składa macierze przodków
  z bieżących transformacji, więc porównuje rzeczywistą macierz świata.

## 32. Uzgodnienie z inwentarzem (zakres części 4)

Objęte wiersze: każdy wiersz inwentarza Q1 ze statusem zawierającym `RUNDA-4` (**31**), **24** wiersze odłożone do
części 4 przez uzgodnienie części 2 (§12a: `PRZENIESIONY → cz. 4` 22, `WSPÓLNA … odłożona do cz. 4` 2), **5** przez
uzgodnienie części 3 (§22) i **7** dołączonych (Z-36-16). Tabelę wygenerował
`runs/R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q4/dowody/recon-q4.py` (statusy w skrypcie; kolumna `woła` liczona z
`battleScene.ts` @ `edb8fb56` — wywołania `this.<metoda>(` funkcji zportowanych w części 4, wprost i przez graf
wywołań klasy; `ZPORTOWANY*` musi wskazywać identyfikatory obecne w `dynamics.rs` / `units.rs`):

```text
LICZNIK: wierszy = 67; PODZIAŁ = 21; WSPÓLNA = 7; ZPORTOWANY = 24; ZPORTOWANY częściowo = 15; bez statusu / niezgodnych = 0
```

Kontrola: 21 + 7 + 24 + 15 = **67** = 31 + 24 + 5 + 7. Każdy wiersz `PODZIAŁ` woła co najmniej jedną funkcję zportowaną (żaden nie spadł do `NIE-DOTYCZY sceny`). Wejścia (SHA-256): inwentarz `139b84eb…`, `battleScene.ts` `38c97736…` — te same co w częściach 2–3.

| # | linie | symbol | źródło | woła (zportowane; bezpośrednio / pośrednio) | status cz. 4 | Rust / powód |
|---|---|---|---|---|---|---|
| 5 | 324–335 | `facingToward` | cz. 2 → cz. 4 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-13) | kierunek do celu = decyzja logiki; scena: `set_facing` z kierunkiem z DTO |
| 6 | 336–346 | `facingFromTo` | cz. 2 → cz. 4 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-13) | kierunek ataku / zwrot = decyzja logiki; scena: `set_facing` z kierunkiem z DTO |
| 92 | 893–902 | `RANGED_MIN_GAP` | RUNDA-4 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-13) | odstęp strzelców (wybór kroku) — logika |
| 93 | 903–904 | `MELEE_SAFE_GAP` | RUNDA-4 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-13) | odstęp od walczących wręcz (wybór kroku) — logika |
| 97 | 918–918 | `BROD_RUCH_MULT` | RUNDA-4 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-13) | bród: koszt kroku `moveLeft` w `_doMove` — logika (animacja kroku bez zmian) |
| 102 | 933–944 | `FORD_AI_AVOID_PENALTY` | RUNDA-4 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-13) | kara AI za bród (punktacja pola) — logika |
| 103 | 945–945 | `MOVE_STEP_MS` | RUNDA-4 | — | ZPORTOWANY (cz. 4) | `MOVE_STEP_MS`; test `constants_and_easing_equal_web`; konsument `MoveAnim::sample` |
| 104 | 946–946 | `STEP_GAP_MS` | RUNDA-4 | — | ZPORTOWANY (cz. 4) | `STEP_GAP_MS`; test `constants_and_easing_equal_web` — odstęp kroków planuje harmonogram (P6.13) |
| 105 | 947–947 | `RANGED_FLY_MS` | cz. 2 → cz. 4 | — | ZPORTOWANY (cz. 4) | `RANGED_FLY_MS`; test `constants_and_easing_equal_web`; `Projectile::dur` |
| 106 | 948–948 | `RANGED_GAP_MS` | cz. 2 → cz. 4 | — | ZPORTOWANY (cz. 4) | `RANGED_GAP_MS`; test `constants_and_easing_equal_web` (harmonogram → P6.13) |
| 108 | 950–954 | `DEATH_FADE_MS` | RUNDA-4 | — | ZPORTOWANY (cz. 4) | `DEATH_FADE_MS`; test `constants_and_easing_equal_web`; konsument `Fade::progress` |
| 109 | 955–955 | `BLOW_LUNGE_MS` | cz. 2 → cz. 4 | — | ZPORTOWANY (cz. 4) | `BLOW_LUNGE_MS`; `MeleeLunge::pose` |
| 110 | 956–956 | `BLOW_HIT_T` | cz. 2 → cz. 4 | — | ZPORTOWANY (cz. 4) | `BLOW_HIT_T`; `MeleeLunge::hit_due` |
| 111 | 957–957 | `BLOW_SETTLE_MS` | cz. 2 → cz. 4 | — | ZPORTOWANY (cz. 4) | `BLOW_SETTLE_MS`; test `constants_and_easing_equal_web` (harmonogram → P6.13) |
| 140 | 1073–1073 | `MORALE_GATE_BREACH` | RUNDA-4 | — | ZPORTOWANY (cz. 4) | `MORALE_GATE_BREACH`; test `constants_and_easing_equal_web` — odjęcie morale robi logika, scena: `update_morale_bar` |
| 141 | 1074–1082 | `MORALE_WALL_BREACH` | cz. 2 → cz. 4 | — | ZPORTOWANY (cz. 4) | `MORALE_WALL_BREACH`; test `constants_and_easing_equal_web` (= 0) |
| 195 | 1605–1627 | `projectileKind` | cz. 2 → cz. 4 | — | ZPORTOWANY (cz. 4) | `projectile_kind` / `ProjectileKind`; test `projectiles_match_web` (306 par kategoria × nazwa) |
| 196 | 1628–1723 | `makeProjectileMesh` | dołączony | — | ZPORTOWANY (cz. 4) | `make_projectile_mesh`; test `projectiles_match_web` (4 rodzaje, pełne rekordy węzłów) — inwentarz Q1: RUNDA-5 (przypisanie słownikowe) — GOAL dispatchu wymienia `makeProjectileMesh` w części 4 |
| 212 | 1900–1905 | `desiredHitForDirection` | RUNDA-4 | — | WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-13) | kierunek natarcia → wybór celu / trafienia — logika |
| 251 | 5561–5602 | `BattleScene._launchAutoBatchResolution` | RUNDA-4 | _fleeStep, (_animateRam), (_attackGate), (_attackWallTile), (_breachGate), (_breachWallTile), (_doMeleeAttack), (_doMove), (_doRangedAttack), (_removeGroupFrameMarker), (_removeUnitFromScene), (_setDeployZoneVisible), (_spawnCatapultBoulder), (_spawnDamageLabel), (_spawnWallLabel), (_startFade), (_startRout), (_syncAllGroupFrameMarkers), (_updateAmmoBar), (_updateGroupFrameMarker), (_updateHpBar), (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 252 | 5603–5619 | `BattleScene._resolveAutoBatchAttack` | cz. 2 → cz. 4 | (_doMeleeAttack), (_doRangedAttack), (_spawnDamageLabel), (_startFade), (_startRout), (_updateAmmoBar), (_updateHpBar), (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 253 | 5620–5656 | `BattleScene._resolveAutoBatchMovement` | RUNDA-4 | _doMove, _removeUnitFromScene, (_doMeleeAttack), (_doRangedAttack), (_spawnDamageLabel), (_startFade), (_startRout), (_updateAmmoBar), (_updateHpBar), (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 260 | 6104–6157 | `BattleScene._cavalryAction` | RUNDA-4 | _doMove, (_doMeleeAttack), (_doRangedAttack), (_spawnDamageLabel), (_startFade), (_startRout), (_updateAmmoBar), (_updateHpBar), (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 261 | 6158–6188 | `BattleScene._cavDirectedManeuverStep` | RUNDA-4 | _doMove | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 262 | 6189–6250 | `BattleScene._cavManeuverStep` | RUNDA-4 | _doMove | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 266 | 6278–6319 | `BattleScene._phalanxAction` | cz. 2 → cz. 4 | (_doMeleeAttack), (_doMove), (_doRangedAttack), (_spawnDamageLabel), (_startFade), (_startRout), (_updateAmmoBar), (_updateHpBar), (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 267 | 6320–6387 | `BattleScene._phalanxStep` | RUNDA-4 | _doMove | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 268 | 6388–6474 | `BattleScene._rangedAction` | RUNDA-4 | _doMove, (_doMeleeAttack), (_doRangedAttack), (_spawnDamageLabel), (_startFade), (_startRout), (_updateAmmoBar), (_updateHpBar), (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 273 | 6508–6545 | `BattleScene._rangedForwardStep` | RUNDA-4 | _doMove | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 277 | 6700–6730 | `BattleScene._rangedBackStep` | RUNDA-4 | _doMove | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 279 | 6755–6802 | `BattleScene._kiteStep` | RUNDA-4 | _doMove | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 283 | 6918–6946 | `BattleScene._fallBackStep` | RUNDA-4 | _doMove | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 284 | 6947–6999 | `BattleScene._rangedApproachStep` | RUNDA-4 | _doMove | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 285 | 7000–7028 | `BattleScene._attackGate` | RUNDA-4 | _animateRam, _breachGate, (_startRout), (_updateMoraleBar) | ZPORTOWANY częściowo (cz. 4: część sceny) | `RamAnim::start` (kierunek do bramy z bieżącej pozycji) — obrażenia bramy / `gateHp` / HUD → P6.13 / P5 |
| 286 | 7029–7055 | `BattleScene._animateRam` | RUNDA-4 | — | ZPORTOWANY (cz. 4) | `RamAnim` (`start`, `sample`, `step`); test `dynamics_match_web` (2 przebiegi, w tym przerwany `finished`) |
| 297 | 7204–7234 | `BattleScene._attackWallTile` | cz. 2 → cz. 4 | _breachWallTile, _spawnCatapultBoulder, _spawnWallLabel, (_startRout), (_updateMoraleBar) | ZPORTOWANY częściowo (cz. 4: część sceny) | `wall_shot_endpoints` + `Boulder` — obrażenia kafla / `wallTileHp` / harmonogram 700 ms → P6.13 |
| 298 | 7235–7271 | `BattleScene._spawnCatapultBoulder` | cz. 2 → cz. 4 | — | ZPORTOWANY (cz. 4) | `Boulder` (`spawn`, `sample`, `step`); test `dynamics_match_web` |
| 300 | 7302–7420 | `BattleScene._breachWallTile` | cz. 2 → cz. 4 | _spawnWallLabel, _updateMoraleBar, (_startRout) | ZPORTOWANY częściowo (cz. 4: część sceny) | `breach_wall_tile` (kafel → Plains, segmenty ukryte, 7 brył gruzu), `retreat_from_wall` — wybór pola odwrotu, zniszczenie katapulty obrońcy, morale → P6.13 (DTO) |
| 301 | 7421–7476 | `BattleScene._breachGate` | RUNDA-4 | _updateMoraleBar, (_startRout) | ZPORTOWANY częściowo (cz. 4: część sceny) | `breach_gate` (kafle bramy, brama + elementy przy bramie ukryte) — morale −5 → DTO, paski `update_morale_bar` (cz. 3) |
| 302 | 7477–7495 | `BattleScene._spawnWallLabel` | cz. 2 → cz. 4 | — | ZPORTOWANY częściowo (cz. 4: część sceny) | `FloatLabel::wall` — element DOM, tekst, kolor → P5 |
| 305 | 7555–7580 | `BattleScene._advanceToward` | RUNDA-4 | _doMove | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 306 | 7581–7658 | `BattleScene._advanceStep` | RUNDA-4 | _doMove | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 318 | 7989–8082 | `BattleScene._doMove` | RUNDA-4 | — | ZPORTOWANY częściowo (cz. 4: część sceny) | `MoveAnim` (`start`, `sample`, `step`) — zajętość, koszt ruchu, `_autoBatchPlanning` → P6.13; nowy kierunek → DTO (`set_facing`) |
| 319 | 8083–8104 | `BattleScene._doAttack` | cz. 2 → cz. 4 | _doMeleeAttack, _doRangedAttack, (_spawnDamageLabel), (_startFade), (_startRout), (_updateAmmoBar), (_updateHpBar), (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 322 | 8361–8443 | `BattleScene._doMeleeAttack` | cz. 2 → cz. 4 | _spawnDamageLabel, (_startFade), (_startRout), (_updateHpBar), (_updateMoraleBar) | ZPORTOWANY częściowo (cz. 4: część sceny) | `MeleeLunge` (`start`, `pose`, `hit_due`, `step`) + `set_facing` — cios / kontra / etykiety decyduje logika |
| 323 | 8444–8509 | `BattleScene._doRangedAttack` | cz. 2 → cz. 4 | _spawnDamageLabel, _updateAmmoBar, (_startFade), (_startRout), (_updateHpBar), (_updateMoraleBar) | ZPORTOWANY częściowo (cz. 4: część sceny) | `ranged_shot_endpoints`, `launch_projectile`, `set_facing` (+ `update_ammo_bar`, cz. 3) — cios po locie → P6.13 |
| 324 | 8510–8553 | `BattleScene._startLoop` | dołączony | _tickFades, _tickProjectiles, (_doMeleeAttack), (_doMove), (_doRangedAttack), (_removeGroupFrameMarker), (_removeUnitFromScene), (_setDeployZoneVisible), (_spawnDamageLabel), (_startFade), (_startRout), (_syncAllGroupFrameMarkers), (_updateAmmoBar), (_updateGroupFrameMarker), (_updateHpBar), (_updateMoraleBar) | ZPORTOWANY częściowo (cz. 4: część sceny) | `billboard`, `billboard_all`, `deploy_phase_frame` — zegar wirtualny / timery → P6.13, kamera (`_tickZoom`, `_tickCameraPanKeys`) → cz. 5, minimapa / morale armii / roster → P5 — inwentarz Q1: RUNDA-5 — pętla klatki: billboard pasków i gałąź rozstawienia (§4 „aktualizacja pasków”) |
| 328 | 8584–8601 | `BattleScene._tickProjectiles` | dołączony | — | ZPORTOWANY (cz. 4) | `tick_projectiles`, `Projectile::sample`; test `dynamics_match_web` (4 pociski × 10 chwil) — inwentarz Q1: RUNDA-5 — ruch pocisków co klatkę (§4 „pociski”) |
| 329 | 8602–8623 | `BattleScene._tickFades` | RUNDA-4 | — | ZPORTOWANY (cz. 4) | `tick_fades`, `Fade::step`; test `dynamics_match_web` |
| 330 | 8624–8660 | `BattleScene._tickFloatLabels` | dołączony | — | ZPORTOWANY częściowo (cz. 4: część sceny) | `FloatLabel::sample` (wzniesienie, krycie `1 − p²`, wygaśnięcie) — `worldToScreen` → cz. 5, styl DOM → P5 — inwentarz Q1: P5 — pozycja świata etykiety i krycie przed rzutem na ekran (napisy obrażeń/muru) |
| 349 | 8942–8957 | `BattleScene._checkRout` | cz. 2 → cz. 4 | _startRout, (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 350 | 8958–8999 | `BattleScene._startRout` | cz. 2 → cz. 4 | (_startRout), (_updateMoraleBar) | ZPORTOWANY częściowo (cz. 4: część sceny) | `rout_facing` + `set_facing` — `routed`/`acted`/rejestr ucieczek/efekty morale → P6.13 |
| 351 | 9000–9064 | `BattleScene._fleeStep` | RUNDA-4 | _doMove, _removeUnitFromScene, (_startRout), (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 353 | 9082–9090 | `BattleScene._startFade` | dołączony | — | ZPORTOWANY częściowo (cz. 4: część sceny) | `Fade` (`start`) — SFX → P5, zajętość → P6.13 — inwentarz Q1: PODZIAŁ … UI → P5 — start zanikania (§4 „zanikanie”) |
| 354 | 9091–9134 | `BattleScene._spawnDamageLabel` | cz. 3 → cz. 4 | — | ZPORTOWANY częściowo (cz. 4: część sceny) | `FloatLabel::damage` — element DOM, tekst, kolor → P5; rzut na ekran → cz. 5 |
| 455 | 11695–11704 | `BattleScene._setDeployZoneVisible` | dołączony | — | ZPORTOWANY częściowo (cz. 4: część sceny) | `set_deploy_zone_visible` — etykiety połówek (DOM) → P5 — inwentarz Q1: P5 — widoczność strefy rozstawienia = węzły sceny (`_endDeployPhase`, cz. 3 → cz. 4) |
| 549 | 14413–14419 | `BattleScene._groupDisplayNum` | dołączony | — | ZPORTOWANY (cz. 4) | `group_display_num`, `js_parse_int10` — inwentarz Q1: P6.13 — numer na znaczniku grupy (§4 „znaczniki grup”) |
| 626 | 16364–16394 | `BattleScene._endDeployPhase` | cz. 3 → cz. 4 | _setDeployZoneVisible, (_doMeleeAttack), (_doMove), (_doRangedAttack), (_removeGroupFrameMarker), (_removeUnitFromScene), (_spawnDamageLabel), (_startFade), (_startRout), (_syncAllGroupFrameMarkers), (_updateAmmoBar), (_updateGroupFrameMarker), (_updateHpBar), (_updateMoraleBar) | ZPORTOWANY częściowo (cz. 4: część sceny) | `end_deploy_phase` (+ `clear_deploy_ghosts`, `clear_order_preview`, `dispose_all_order_lines` z cz. 3) — migawki grup, zaznaczenie, UI, start bitwy → P6.13 / P5 |
| 658 | 17016–17085 | `BattleScene._executeGroupDoctrineStep` | RUNDA-4 | (_doMeleeAttack), (_doMove), (_doRangedAttack), (_spawnDamageLabel), (_startFade), (_startRout), (_updateAmmoBar), (_updateHpBar), (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 659 | 17086–17124 | `BattleScene._executeSkirmishDoctrineStep` | RUNDA-4 | (_doMeleeAttack), (_doMove), (_doRangedAttack), (_spawnDamageLabel), (_startFade), (_startRout), (_updateAmmoBar), (_updateHpBar), (_updateMoraleBar) | PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`) | decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła` |
| 700 | 18647–18667 | `BattleScene._makeGroupNumberTexture` | cz. 2 → cz. 4 | — | ZPORTOWANY (cz. 4) | `GroupNumberTexture` (`ops`, `SIZE`) — rasteryzacja canvas → rasteryzator tekstu (NIE_ZMIERZONO wzrokowo) |
| 701 | 18668–18683 | `BattleScene._removeGroupFrameMarker` | cz. 3 → cz. 4 | — | ZPORTOWANY (cz. 4) | `GroupMarkers::remove` |
| 702 | 18684–18730 | `BattleScene._updateGroupFrameMarker` | cz. 3 → cz. 4 | _removeGroupFrameMarker | ZPORTOWANY (cz. 4) | `GroupMarkers::update` (`Line` w `FieldScene::lines`, `Sprite`) |
| 703 | 18731–18741 | `BattleScene._syncAllGroupFrameMarkers` | cz. 3 → cz. 4 | _removeGroupFrameMarker, _updateGroupFrameMarker | ZPORTOWANY (cz. 4) | `GroupMarkers::sync_all` |
| 723 | 19438–19438 | `lerp` | cz. 2 → cz. 4 | — | ZPORTOWANY (cz. 4) | `lerp`; test `constants_and_easing_equal_web` |
| 724 | 19439–19439 | `easeOut` | cz. 2 → cz. 4 | — | ZPORTOWANY (cz. 4) | `ease_out`; test `constants_and_easing_equal_web` |
| 725 | 19440–19441 | `easeIn` | cz. 2 → cz. 4 | — | ZPORTOWANY (cz. 4) | `ease_in`; test `constants_and_easing_equal_web` |

## 33. Generator i dane referencyjne (`tests/fixtures/battle3d/`, README tamże, „Part 4”)

- `gen_dynamics.ts` + `build_dynamics.mjs` (= bundler części 3 z dłuższą listą dopisanego `export { … }`), `dom_stub.ts`,
  `three_shim.ts` z części 2; `gra/**` bez zmian. `requestAnimationFrame` = rejestrator kolejki; `frame(t)` ustawia
  `vNow = t` i wykonuje kolejkę raz (to, co pętla robi po `_advanceVClock`).
- `dynamics.json` 136 900 B; katalog fixtur 11 813 305 B (≤ 12 MB), największy plik bez zmian (`siege_wall.json`
  7 228 812 B ≤ 8 MB); `MANIFEST.sha256` 20 plików. Bundel 2 792 288 B nie jest commitowany (budżet), SHA w README.
- Scena wejściowa = DTO części 3 (`tilesRle`, `spawn`, `moves`); `tilesNow` = siatka po zamianie kilku kafli przy
  chodzących jednostkach na wzgórze / rzekę / bród (zmienia tylko odczyty `tileTopY`).

## 34. Testy (`tests/battle3d_dynamics.rs`) i testy jednostkowe

| test | co porównuje |
|---|---|
| `dynamics_match_web` | 23 zdarzenia na jednej scenie (§29 p. 2): pozycje modelu i pasków w każdej próbkowanej klatce (bitowo), `done` / `hit` / liczba ciosów, sygnatury modelu jednostki (`modelRecord`: geometria, kolor, krycie, macierz świata każdego mesha + rodzaj / widoczność / macierz każdego węzła), pasków, pocisków (pełne rekordy przy starcie), gruzu (pełne rekordy pierwszej bryły), muru, znaczników, siatki kafli (RLE), podsumowanie sceny, napisy (pozycja świata, start, czas, wzniesienie; punkty przed rzutem i krycie jako napis JS) |
| `deploy_phase_matches_web` | 84 znaczniki grup interfejsu rozstawienia (model każdej jednostki gracza), klatka fazy rozstawienia (podsumowanie, `orderLines`, paski), `_endDeployPhase` (podsumowanie, `orderLines`, grupa strefy, warstwa duchów, widoczność 2 529 meshy strefy: 0 widocznych) |
| `projectiles_match_web` | `projectileKind` 306 par (kategoria × nazwa, przez `nazwa` i `stats.Jednostka`), `makeProjectileMesh` × 4 (pełne rekordy węzłów) |
| `constants_and_easing_equal_web` | 10 stałych bitowo, `lerp` / `easeOut` / `easeIn` dla 11 wejść (NaN, ±0, ∞) |
| `battle::dynamics::tests::parse_int_follows_ecma` (jednostkowy) | `parseInt(·, 10)` (spacje, znak, część ułamkowa, brak cyfr, BOM) i `_groupDisplayNum` |

## 35. Bramy tego wywołania (`runs/…-Q4/dowody/tests-impl-r1.txt`) i plan „pomiarów”

```text
# rustc 1.97.0; CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_TARGET_DIR=/home/user/cargo-target-shared/<worktree>
$ cargo fmt --all -- --check                                              EXIT=0
$ cargo clippy --locked --lib --test battle3d_dynamics -- -D warnings      EXIT=0
$ cargo test --locked --test battle3d_dynamics -- --nocapture             4 passed  EXIT=0
$ cargo test --locked --test battle3d_siege_wall --test battle3d_field --test battle3d_units   5 + 3 + 8 passed  EXIT=0
$ cargo test --locked --lib battle::                                      11 passed  EXIT=0
$ sha256sum -c MANIFEST.sha256 (20)                                       EXIT=0
$ du -sb tests/fixtures/battle3d                                          11813305
$ mutate_dynamics.py: 48 mutantów, wzorce dokładnie raz                   EXIT=0
$ determinizm generatora (2 katalogi)                                     identyczne (dowody/determinism-r1.txt)
$ recon-q4.py (2 przebiegi, cmp)                                          EXIT=0, identyczne (dowody/recon-q4.txt)
```

**Do wywołania „pomiary” (NIE_ZMIERZONO tutaj):** `mutate_dynamics.py` (48 mutantów, MSRV 1.87.0), pełne bramy
`cargo clippy --locked --all-targets [--features gpu] -- -D warnings` i `cargo test --locked --all-targets` (1.87.0 i
1.97.0), niezależne odtworzenie generatora w trzecim katalogu. Kandydaci na mutanty równoważne do sprawdzenia:
`gate height rule` (zależy, czy przy bramie jest mesh z `0,9·h ≤ y < h`), `fade hides bars`.

## 36. Co ocenić wzrokiem po RR-T5 (NIE_ZMIERZONO — wymaga GPU)

1. Krok jednostki: `easeOut`, podskok 0,12, płynne wejście na wzgórze / zejście do rzeki (wysokość interpolowana),
   paski płyną razem (bez podskoku).
2. Cios wręcz: wypad na 60 % drogi do połowy odległości (`easeOut`), powrót `easeIn`, łącznie 260 ms; obrót atakującego
   i — przy kontrze — obrońcy.
3. Pociski: strzała (cienka, krótka, z lotką), oszczep (dłuższy, grubszy), pilum (z żelaznym trzpieniem), kamień z procy;
   lot 380 ms po łuku 0,6; **orientacja ustalona przy starcie** (nie podąża za styczną łuku — W-19).
4. Zanikanie: przezroczystość 1 → 0 i skurcz do 40 % w 500 ms, potem model i paski znikają.
5. Taran: ruch 0,25 w stronę bramy i powrót (320 ms); kamień katapulty: szara kula 0,32 po łuku 3,5 (700 ms).
6. Wyłom muru: znika segment(y) rzędu, 7 brył gruzu (kamień / glina, cieniowanie płaskie, cienie); wyłom bramy: znika
   brona i elementy przy bramie (reguła odległości / wysokości — sprawdzić, czy nie zostają dziury ani nie znika za dużo).
7. Znaczniki grup: złoty kwadrat 0,88 kafla pod jednostką (krycie 0,92), numer w złotym polu 0,55 w lewym górnym rogu,
   zawsze na wierzchu (`depthTest: false`); rasteryzacja tekstury canvas (czcionka `bold 16px sans-serif`).
8. Paski zwrócone do kamery (billboard) w bitwie i w rozstawieniu; po zakończeniu rozstawienia linie rozkazów widoczne,
   strefa rozstawienia ukryta.
9. Napisy obrażeń / muru (DOM, P5) — wznoszenie 0,12 j./s, zanik `1 − p²` przez 2 s.

## 37. Obserwacje o webie (część 4; port 1:1, bez zmian w `gra/**`)

- **W-17** Katapulta obrońcy na wyburzonym kaflu (`_breachWallTile`, `:7364-7369`) dostaje `dead = true`,
  `fadingOut = true`, `fadeStart = performance.now()` (zegar ZEGAROWY, nie `_now()`), ale **nie trafia do
  `fadingUnits`** — `_tickFades` jej nie animuje: model zostaje w scenie w pełnym kryciu (zmierzone: `def40`, `def47` po
  wyłomie rzędu 73 — sygnatura modelu bez zmian, test przechodzi bez żadnej operacji sceny), tylko billboard pasków
  ustaje (`dead`).
- **W-18** Uciekająca jednostka: `_startRout` zwraca ją ku własnej krawędzi (`:8971-8972`), ale każdy krok `_doMove`
  woła `_updateFacing` (`:8047`) i odwraca ją z powrotem do najbliższego wroga — ucieka tyłem (zmierzone: `atk32`
  kierunek 3 (W) po rozbiciu → 1 (E) po pierwszym kroku).
- **W-19** Pocisk jest celowany raz przy starcie (`:8478-8483`); `_tickProjectiles` zmienia tylko pozycję (`:8591`),
  więc grot nie podąża za łukiem (wznosi się i opada w tej samej orientacji).
- **W-20** `_groupDisplayNum` = `parseInt(gid, 10)` (`:14415`): `' 12x'` → 12, `'2.9'` → 2; `'0'`, `'-2'`, `'abc'`
  → ramka bez numeru (zmierzone, `markers`).
- **W-21** Napisy obrażeń dostają `startTime = vLastWall` (`:9113`); przed pierwszą klatką bitwy (`vLastWall = 0`, także
  po `_endDeployPhase`, `:16385`) napis ma start 0 i znika przy pierwszym ticku z `t ≥ 2000` (zmierzone: 4 napisy ciosów
  w `labels` usunięte przy `t = 2000`).
- **Dryf weba po pinie** (`dowody/web-drift-r1.txt`; `git diff --stat edb8fb56 origin/main -- gra/src/battle
  gra/src/render`, `origin/main` = `cc2c6a50`): 13 plików, **+835 / −221** (część 3: +629 / −213 przy `91dc998a`);
  `battleScene.ts` +357 / −159, 49 hunków. W symbolach części 4: **3 hunki** — `_breachWallTile` (`:7367`), `_startRout`
  (`:8961`), `_startFade` (`:9083`) dostają blok dowódcy armii (`isArmyCommander` → `_removeCommanderMoraleBonus`,
  `_disableManualIfCommanderLost`): logika morale / trybu ręcznego (P6.13), skutek w scenie = `_updateMoraleBar`
  (część 3, przez DTO morale). Kod transformacji części 4 bez zmian w tych hunkach. Nie przepinam (dispatch); wpływ na
  wektory części 4 NIE_ZMIERZONO.
