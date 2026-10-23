# P4-36 — MOD-14: bitwa 3D (`battle`), runda 1: mury oblężnicze + inwentarz `battleScene.ts`

**TEMAT:** R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1 · **DOMAIN:** GAME · **RUNDA:** 1/5 · **ROLA:** Operator
**Baza:** `rust-port/parity-v2` @ `ba5dca73` (wymóg dispatchu: ≥ `ba5dca73`) · **Pin weba:** `edb8fb56`
**Paczka katalogu:** `R-RUSTPORT-P4-MOD-14-BATTLE-3D` (`P4-4-MODEL-CATALOG.md` §5 wiersz 14, D-REND-8 = B).

## 0. Streszczenie

1. **`battle/siegeWall.ts` (1 047 LOC) zportowany w całości** → `rust-port/renderer/src/battle/siege_wall.rs`:
   9 stylów (Grecja, Rzym, Sumer, Egipt, Inka, Chiny, Zulu, Celtowie, Germanie) + fallback
   (`aztek`, `hetyci`, nieznany klucz → Grecja), `attachRowBreachPanels`, pełny kontrakt `userData`.
   Wynik = jedno drzewo `scene::Scene` (P4.27) + typowane metadane `SiegeWallUserData`.
2. **Parytet bit w bit z webem** (kod weba uruchomiony na three@0.169.0 / node 22): 68 przypadków,
   10 376 meshy, **285 409 skalarów f64 równych bitowo + 207 428 porównań dyskretnych, 0 różnic**
   (drzewo węzłów, transformacje, macierze świata, geometrie — liczby wierzchołków/trójkątów, hash
   FNV atrybutów `Float32`, parametry konstruktorów —, materiały, współdzielenie materiałów,
   bbox, `userData` po budowie i po każdym `attachRowBreachPanels`).
3. **Mutacje 32/32 zabite.** Determinizm: generator 2× → identyczny SHA-256; test także na rustc 1.87.0 (MSRV).
4. **Inwentarz `battleScene.ts` (19 493 LOC, 731 symboli)** z tabelą statusów:
   `dyspozycje/autobot/runs/R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1/inwentarz-battleScene.md`.
   Podział: 3D ≈ 3 886 LOC (65 symboli) + mieszane 3D/DOM ≈ 1 800 LOC (9), UI DOM ≈ 4 687 (112),
   logika ≈ 8 479 (529, heurystyka), typy 351 (16), preambuła importów/stałych 291.
5. **Plan dalszych części** (§4): pole statyczne → jednostki i nakładki → dynamika/efekty → picking/kamera.
   Kryteria tematu nie są osłabiane: ten dokument zamyka tylko część „siegeWall + inwentarz”.
6. Ocena wizualna 1:1: **NIE_ZMIERZONO** (brak GPU) — lista „co ocenić wzrokiem” w §8.

## 1. Zakres rundy 1 i wykonanie GOAL

| element GOAL | stan po r1 | dowód |
|---|---|---|
| inwentarz `battleScene.ts` (LOC 3D vs logika vs UI, tabela symboli ze statusami) | WYKONANE (heurystyka, §3) | `runs/…/inwentarz-battleScene.md`, `dowody/inv2.py`, `dowody/inv_summary.txt` |
| podział na rundy, jawny | WYKONANE (§4) | ten dokument |
| `siegeWall.ts` — 9 stylów murów | **PORTOWANY**, bit w bit | `tests/battle3d_siege_wall.rs`, `tests/fixtures/battle3d/` |
| scena bitwy 3D (teren, rozmieszczenie, efekty, oświetlenie/mgła, kamera, picking) | **RUNDA-2…5** (plan §4) | — |
| logika bitwy / UI DOM | NIE-DOTYCZY (P6.13 / P5) | inwentarz, kolumna status |
| mutacje ≥ 20 | 32/32 | `dowody/mutate.txt`, `tests/fixtures/battle3d/mutate.py` |
| fixtury z manifestem sha256 (≤ 12 MB, plik ≤ 8 MB) | 6,5 MB katalog, największy plik 6,3 MB | `tests/fixtures/battle3d/MANIFEST.sha256` |
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
| `buildWallBodySegmented` | 159–214 | `W::wall_body_segmented` | cache 5 koszyków materiałów; `Map.set` (SameValueZero) |
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

### 3.1 Metoda

`git show edb8fb56:gra/src/battle/battleScene.ts` → `dowody/inv2.py`: deklaracje najwyższego poziomu i metody klasy
`BattleScene` (wcięcie 2 spacje), zakres = do następnego symbolu. W ciele liczone: `THREE.` (`three`), dostęp do
grafu sceny (`obj`: `.position.`, `.add(`, `scene`, `camera`, `Mesh`, `buildUnitModel`, `buildSiegeWall`, …),
DOM/CSS (`dom`). Kategorie: 3D (`three>0` lub `obj≥3`, `dom=0`), MIX, UI, LOG, TYPE. **To heurystyka** —
symbol LOG może sterować animacją przez pomocnika 3D; ostateczne przypisanie robi runda, która symbol przejmuje.

### 3.2 Wynik (`dowody/inv_summary.txt`)

| kategoria | symbole | LOC | status |
|---|---|---|---|
| 3D | 65 | 3 886 | RUNDA-2…5 (§4) |
| MIX (3D + DOM) | 9 | 1 800 | RUNDA-2…5, tylko część 3D (konstruktor 822, pola klasy 570, `dispose` 143, `_placeSiegeWall`, `_initDeployUI`, `_spawnDamageLabel`, `_spawnWallLabel`, `_makeGroupNumberTexture`, `worldToScreen`) |
| UI (DOM) | 112 | 4 687 | NIE-DOTYCZY → P5 |
| LOG | 529 | 8 479 | NIE-DOTYCZY → P6.13 `domain/combat.rs` (do weryfikacji w r2) |
| TYPE | 16 | 351 | NIE-DOTYCZY (DTO wg potrzeb) |
| preambuła (importy, stałe przed 1. deklaracją) | — | 291 | stałe idą z symbolem, który ich używa |

Suma 3D+MIX wg planowanej rundy: R2 2 865, R3 1 691, R4 665, R5 465 LOC (przypisanie słowami kluczowymi nazwy).
Pełna tabela 731 wierszy (linie, LOC, liczniki, kategoria, status): `inwentarz-battleScene.md`.
Import `buildSiegeWall`/`attachRowBreachPanels` (`battleScene.ts:116`, wywołania `:3905`, `:3930`) — **PORTOWANY**
w tej rundzie; samo umieszczenie muru w scenie (`_placeSiegeWall`: `rotation.y = π/2`, pozycja `cellToWorld`,
`:3897-3986`) to RUNDA-3 (MIX: HUD oblężenia to DOM).

## 4. Podział na rundy / części (jawny; kryteria końcowe tematu bez zmian)

| część | zakres (symbole z inwentarza, przykłady) | wejście (DTO) | wyjście |
|---|---|---|---|
| **1 (ta)** | `siegeWall.ts` całość | civ, opts, wiersze wyłomu | `Scene` muru + `SiegeWallUserData` |
| 2 — pole statyczne | `_buildBattlefield` (`:4462`, 417 LOC), kafle/podłoże (`BT_FLOOR_COLOR`), `_buildPlayableMarginVisuals`, `_carveWallTiles`, `_buildSiegeInteriorBuildings`, `makeGableRoofGeometry`, strefy rozstawienia (`_buildDeployZone`, `_appendDeployCellOutline`), część 3D konstruktora: światła, mgła, tło, `PerspectiveCamera(48,…)`, `_applyCamera` | siatka terenu bitwy (`BF_COLS 68 × BF_ROWS 156`, typy kafli), ziarno pola | `Scene` pola + parametry świateł/mgły/kamery jako dane |
| 3 — jednostki i nakładki | `_placeUnits`, `_placeUnitsOneSide`, `_placeSiegeDefenders`, `_placeSiegeWall` (umieszczenie), `_activateUnit` (3D), `makeUnitBars`, `makeFallbackAvatar`, pierścienie wyboru, duchy rozstawienia | lista jednostek (typ, strona, pozycja, HP/morale/amunicja) | węzły jednostek z `models::*` + paski z `units::overlay` (istniejące) |
| 4 — dynamika i efekty | pociski (`makeProjectileMesh`), strzałki rozkazów, wyłom/brama (`_breachWallTile`, `_breachGate`, `_animateRam`), ucieczka, zanikanie, znaczniki grup, aktualizacja pasków | DTO zdarzeń bitwy + czas | transformacje/flagi widoczności w funkcji (stan, t) — deterministycznie |
| 5 — picking i kamera | `pickBattleGroundTile*`, `_pickUnitAtScreen`, `_raycastFromCanvas`, `worldToScreen` (3D), obsługa kliknięć (część 3D) | promień / NDC | trafienie kafel/jednostka (przez `pick`) |

Wzorzec weryfikacji każdej części jak tutaj: generator uruchamia funkcje budujące scenę z weba (three@0.169.0, node,
bez WebGL; DOM — stub nagrywający, jak `tests/fixtures/misc`), porównanie bit w bit, mutacje ≥ 20.
Ryzyko dla części 2–5: `BattleScene` jest jedną klasą z konstruktorem 822 LOC mieszającym DOM i 3D — generator
będzie potrzebował stubu `document`/`canvas` i wywoływania metod prywatnych (TS `private` nie blokuje w JS).

## 5. Generator referencji (`rust-port/renderer/tests/fixtures/battle3d/`, README tamże)

- `gen.ts` importuje **bez zmian** `battle/siegeWall.ts` i `render/bronzeCity.ts` z `git archive edb8fb56`, bundel
  `build.mjs` (esbuild 0.24.0, bez pluginów i shimów), `gen.mjs` = zapisany bundel.
- 68 przypadków: 11 × gra (`lengthTiles 156 = BF_ROWS`, `TILE_S 1`, `height 2.5`, `gateWidthTiles 2` +
  `attachRowBreachPanels(77.5, 0, 155, 76, 77, 1)` — `battleScene.ts:3905-3910`, `:3930-3938`, stałe `:618-629`, `:696`),
  3 × nieznany klucz, 6 przemiataczy × 9 stylów (domyślne opcje, ułamkowe długości, różne `T`, wysokości, bramy,
  `ownerColor`, brak boków → NaN).
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
  - `siege_wall_matches_web` — 68 przypadków, wszystko `to_bits` (§0 pkt 2);
  - `siege_wall_typed_entry_matches_web_ids` — 11 `BRONZE_CIVS` przez wejście typowane = wejście tekstowe = `sig`
    weba; eksport `Scene::export_gpu` daje tyle meshy, ile web, bez sprite'ów;
  - `siege_wall_game_rows_quirk` — obserwacja W-1 (§7) na wywołaniu gry.
- Testy jednostkowe modułu: `js_round` (remisy, `-0`, 0.49999999999999994), `shade_color`, dyspozycja stylów.
- Determinizm: generator uruchomiony 2× → `siege_wall.json` SHA-256 `7d59fc29…6b6854` oba razy; `siegeWall.ts` nie
  używa `Math.random` (komentarz `:14`, `hash01` `:39-42`). Test zielony także na rustc 1.87.0 (MSRV crate'a).
- Mutacje (`tests/fixtures/battle3d/mutate.py`, log `runs/…/dowody/mutate.txt`): **32/32 zabite** — m.in. roughness,
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

## 9. Bramy (surowe logi: `runs/…/dowody/gates.txt`, pełny log testów `dowody/test-full.txt`)

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
## test totals: passed=376 failed=0 binaries=48   (w tym 3 nowe testy jednostkowe battle::siege_wall i 3 testy battle3d_siege_wall)
## $ cargo test --locked --test battle3d_siege_wall -- --nocapture
siegeWall: 68 cases: scalars 285409 (bit-equal), checks 207428
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.78s
EXIT=0
## $ cargo +1.87.0 test --locked --test battle3d_siege_wall -- --nocapture
siegeWall: 68 cases: scalars 285409 (bit-equal), checks 207428
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.80s
EXIT=0
## $ git diff --cached --check   (po jawnym git add, przed commitem)
EXIT=0
## $ sha256sum -c tests/fixtures/battle3d/MANIFEST.sha256
EXIT=0
```

(Wartości liczbowe w tym bloku są przepisane z `dowody/gates.txt` ostatniego przebiegu — patrz tam, w razie różnicy
wiąże log.)
