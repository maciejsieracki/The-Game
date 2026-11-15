# 01 — Operator r1: R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME (grafika / DTO renderera — mapa bitwy)
TEMAT: R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE
GOAL: adapter BattleSetupDto → BattleUnitsOpts + FortDto (wejścia build_battle_scene_with_units_fort), ammo None → f64::INFINITY, brakujące dane → błąd
ZMIANY/COMMIT: gałąź op/R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE, baza origin/rust-port/parity-v2 = b90894920c6607f18a41ff24b09ad7453362b11c; SHA commitu — w wiadomości końcowej Operatora / `git log` gałęzi (raport jest w tym samym commicie)
TESTY: view_adapter_battle 11/11; mutacje 10/10 FAIL; fmt/clippy/test EXIT 0 (szczegóły niżej)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
```

## Baza i izolacja

- Baza: `origin/rust-port/parity-v2` = `b90894920` (Integracja P4-1G Q3). Gałąź robocza `op/R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE` w worktree `.claude/worktrees/wf_304cdf8e-350-1`.
- Pin `07d2fbd72` tylko do odczytu (`git show`). `gra/`, `origin/main`, `view-model` — nietknięte. `Cargo.lock` nie commitowany (przywrócony `git checkout`).

## Zmiany (allowlista)

| plik | zmiana |
|---|---|
| `rust-port/renderer/src/view/battle.rs` | NOWY: `battle_inputs`, `battle_view_inputs`, `battle_fort`, `unit_spawn`, `terrain_grid`, `deploy_side`, `ammo`, `BattleInputs { opts: BattleUnitsOpts, fort: FortDto }`, `BattleAdapterError { GridSize, MissingSiegeCiv }` |
| `rust-port/renderer/src/view.rs` | tylko `pub mod battle;` + `pub use battle::{…}` |
| `rust-port/renderer/tests/view_adapter_battle.rs` | NOWY: 11 testów |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE/01-operator-r1.md` | ten raport |

Q1 użyte bez duplikatu: `convert::{battle_side, fort_kind, tower_material, unit_id_string}`. Pliki Q2/Q3 nietknięte.

## Mapowanie pól (pin `07d2fbd72`, `gra/src/battle/battleScene.ts` = BS)

| DTO | wejście renderera | pin |
|---|---|---|
| `grid` | `TerrainGrid` (bez `TerrainGrid::new`, który panikuje; walidacja → błąd) | `_buildBattlefield(opts.teren)` BS:3478 |
| `desert_palette` | `BattleSceneOpts.desert_palette` | BS:2782 |
| `siege` | `BattleSceneOpts.siege` | `if (opts.siege)` BS:3479 |
| `deploy: Option<BattleSide>` | `BattleSceneOpts.deploy: Option<DeploySide>` | BS:3484-3485 |
| `siege_civ` | `BattleUnitsOpts.siege_civ` | `(defCiv ?? civ) ?? 'rzym'` BS:3480 (fallback u producenta) |
| `player_side` | `BattleUnitsOpts.player_side` | `_playerControlSide()` BS:12396-12397 |
| `units[]` | `Vec<UnitSpawn>` w tej samej kolejności, `id` → `String` | `_placeUnits` BS:4512, 4553-4554 |
| `ammo_left/ammo_max: None` | `f64::INFINITY` | `ammoCount` → `return Infinity` BS:1444-1446 |
| `fort.kind` | `FortDto.kind` | `fortKind` BS:2440, 2741 |
| `fort.tower_material: Option` | `Option<TowerMaterial>` 1:1 (`None` = `null`) | `towerMaterialFor` BS:4160-4161; `game/city-towers.ts:23` |
| `fort.tower_rows` | `FortDto.tower_rows` 1:1 | `towerRows(...)` BS:4169-4173; `city-towers.ts:47` |

## Uwagi (NOTES)

1. **Dispatch §ZAKRES p.2 „`FortDto` → `None` → `f64::INFINITY`”** — po weryfikacji w pinie i w DTO
   (`view-model/src/battle.rs:76-80`, rozpoznanie §3.8 wiersz `units[]`) `INFINITY` dotyczy
   **amunicji** jednostek (`ammo_left/ammo_max`), nie fortu. W forcie `tower_material: None` = `null`
   z `towerMaterialFor('none')` i w rendererze pozostaje `None` (web wychodzi z `_placeSiegeTowers`
   przed wieżami, BS:4161). Zaimplementowano wg pinu: ammo `None` → `INFINITY`, fort `None` → `None`.
   Test `fort_none_is_web_none` (== `FortDto::none()`) i `ammo_none_is_infinity`.
2. **Błędy adaptera** (brak domyślnych): `GridSize` (ujemne `cols/rows` lub `tiles.len() != cols*rows`
   — renderer by spanikował) i `MissingSiegeCiv` (`siege == true` i pusty `siege_civ`; fallback `'rzym'`
   pinu BS:3480 należy do producenta — `siege_wall_civ`). Bez oblężenia pusty `siege_civ` jest OK
   (web go nie czyta).
3. Adapter nie sprawdza spójności `kind`↔`tower_material` ani `tower_rows` (to reguły
   `towerMaterialFor`/`towerRows` — producent). Bez reguł gry w adapterze.
4. Fixture: ręcznie zbudowany DTO (oblężenie, palisada + drewno, 4 wiersze wież, gracz broni się
   w trybie rozstawiania, 3 jednostki: ammo `None`/`2`/`0`). Wartość oczekiwana = wejście „jak web”
   (wzorzec `tests/repin3d_a5.rs:102-142`) z cytatami BS przy każdym polu. Test sceny porównuje
   `build_battle_scene_with_units_fort` z wejścia adaptera i z wejścia „jak web” (`BattleScene3 ==`)
   oraz liczbę wież = `tower_rows.len()`.

## Testy

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo (usunięty po bramkach).

- `cargo test --test view_adapter_battle`: **11 passed, 0 failed, 0 ignored**.
- Bramki w `rust-port/renderer`:
  - `cargo fmt --check` → **EXIT 0**
  - `cargo clippy --all-targets -- -D warnings` → **EXIT 0**
  - `cargo test --all-targets --no-fail-fast` → **EXIT 0** (67 zestawów, 548 passed, 0 failed, 0 ignored)
- Brak `#[ignore]` (grep: 0), `git diff --check` czysty.

### Mutacje (każda MUSI dać FAIL — skrypt podmienia jedną linię w `view/battle.rs`, uruchamia `view_adapter_battle`, przywraca plik; przywrócenie potwierdzone `diff -q`)

| mutacja | wynik | testy FAIL |
|---|---|---|
| M1 ammo `None` → `0.0` | **FAIL** (5) | ammo_none_is_infinity, ammo_null_from_json_is_infinity, setup_maps_to_web_inputs, battle_view_uses_setup, scene_from_adapter_equals_scene_from_web_inputs |
| M2a pominięte `fort.tower_rows` (`Vec::new()`) | **FAIL** (4) | fort_present_is_one_to_one, setup_maps…, battle_view…, scene… |
| M2b pominięte `fort.tower_material` (`None`) | **FAIL** (4) | j.w. |
| M2c pominięte `fort.kind` (`None`) | **FAIL** (4) | j.w. |
| M3a zamiana `player_side` | **FAIL** (4) | sides_are_not_swapped, setup_maps…, battle_view…, scene… |
| M3b zamiana `side` jednostek | **FAIL** (4) | j.w. |
| M3c zamiana `deploy` (Atk→Def) | **FAIL** (1) | sides_are_not_swapped |
| M4 `ammo_max` z `ammo_left` | **FAIL** (1) | ammo_null_from_json_is_infinity |
| M5 wyłączona kontrola `MissingSiegeCiv` | **FAIL** (1) | siege_without_civ_is_an_error |
| M6 wyłączona kontrola rozmiaru siatki | **FAIL** (1) | grid_of_wrong_size_is_an_error |

## Granice

Bez push, bez integracji, bez zmian w `gra/`, `origin/main`, `view-model`, Q2/Q3. Commit jawnym `git add` czterech plików.
