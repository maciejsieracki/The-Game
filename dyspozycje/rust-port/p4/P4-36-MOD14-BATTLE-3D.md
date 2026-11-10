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
