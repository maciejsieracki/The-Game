# R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN — Operator r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (grafika / adapter DTO renderera)
TEMAT: R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN
GOAL: `MapViewDto` + `HexDynDto` + miasta/cuda + `FogSets` → `TerrainInput`, `pick::terrain::MapHex` (z `prism_hidden`, `solid_hidden`, `terraces`), `OverlayMap`, `OkolicaMap`, `TileYield`, odpowiednik `TerrainScene::set_fog` — bez reguł gry w adapterze.
BAZA: `origin/rust-port/parity-v2` = `601ff304c571a08557b5b3cab62b7bfdb9975e51` (wg dispatchu; FC Q1 zintegrowany). Pin `07d2fbd72` (tylko odczyt, `git show`).
GAŁĄŹ ROBOCZA: `wip/R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN-op-r1` (lokalnie, bez push).
ZMIANY/COMMIT: SHA w wiadomości końcowej Operatora / `git log` tej gałęzi (commit zawiera ten raport, więc SHA nie może być wpisany w nim samym).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO

## Zmiany (allowlista — zero plików spoza niej)

| Plik | Zmiana |
|---|---|
| `rust-port/renderer/src/view/terrain.rs` | NOWY: `TerrainData` (+`input(detail) -> TerrainInput`), `terrain_data`, `terrain_scene_options`, `solid_hidden_hexes`, `map_hexes`, `overlay_map`, `okolica_map`, `tile_yield`, `apply_terrain_fog` |
| `rust-port/renderer/src/view.rs` | tylko `pub mod terrain;` + reeksport `pub use terrain::{…}` |
| `rust-port/renderer/tests/view_adapter_terrain.rs` | NOWY: 16 testów |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN/01-operator-r1.md` | ten raport |

Brak zmian w `view-model`, `Cargo.toml`; `Cargo.lock` przywrócony (`git checkout`), niecommitowany. Użyte z Q1: `convert::{pick_hex, hex_key, terrain, river_kind, seed_i32}`, `FogSets`, `ViewAdapterError::LengthMismatch` — bez duplikatów.

## Mapowanie (DTO → renderer → pin)

| Wejście | Źródło w DTO | Pin `07d2fbd72` |
|---|---|---|
| `TerrainInput.width/height/hexes` | `map.width/height`, `map.hexes[].coord/.teren_bazowy` | `buildScene` (`render/scene.ts:1580`) |
| `TerrainInput.seed`, `TerrainSceneOptions.seed` | `seed_i32(map.seed)` = `js_num::to_int32` | `map.seed \| 0` |
| `TerrainHex.terraces`, `MapHex.terraces` | `HexDynDto.terraces` 1:1 | `improvementKeysForHex(hex).includes('tarasy')` (`scene.ts:2468-2469`) |
| `TerrainInput.rivers` | `map.rivers` (`river_kind` z Q1) | `map.riverPaths` + `riverPathKinds` |
| `MapHex.prism_hidden` | `FogSets.prism_hidden` (Q1, `!explored`) | `setFog` (`scene.ts:3526+`) |
| `MapHex.solid_hidden` | heks w `cities[].hex` ∪ `wonders[].hex` (ruiny też) | `hideDecorAtHex` miasta `main.ts:16211`, cuda `main.ts:4312` (cała `placedWorldWonders`) |
| `OverlayMap{hexes, seed}` | teren per `HexKey`, `seed: Some(map.seed)` surowy (nakładki czytają `map.seed ?? 0`, `range.rs:142`, `:514`) | `rangeOverlay.ts` `hexTopY` |
| `OkolicaMap.covering_improvement` | heksy z `HexDynDto.covering_improvement == true`; brak wpisu = false | `hexHasCoveringTerrainImprovement` |
| `TileYield` | `TileYieldDto` pole w pole | `overlays.rs:93` ↔ `okolica.rs:114` |
| `apply_terrain_fog(scene, fog, land_reveal)` | `scene.set_fog(&fog.visible, &fog.explored, land_reveal)` | `refreshFog` `main.ts:13485-13514`; przy mgle wyłączonej `FogSets` = `ALL_KEYS`, nic nie jest ukryte, więc `showOceanBackdrop = true` niezależnie od `land_reveal` (`scene.ts:3532-3548`) |

Długości: `hex_state` i `fog.prism_hidden` ≠ `map.hexes.len()` → `ViewAdapterError::LengthMismatch` (bez obcinania).

## TESTY

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo (usunięty po bramkach).

| Bramka (`rust-port/renderer`) | Kod wyjścia | Wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | (pierwsze przejście: 1× `needless_range_loop` w nowym teście — poprawione, ponowione → 0) |
| `cargo test --all-targets --no-fail-fast` | 0 | 65 zestawów, 518 passed, 0 failed, 0 ignored |
| `cargo test --test view_adapter_terrain` | 0 | 16 passed |

Fixture: mapa 4×3 (`r`-major), 8 typów terenu, `terraces` true na (3,0),(2,1); `covering_improvement` na (2,0),(1,1),(3,2); mgła `0,1,2,2 / 2,2,1,0 / 1,0,2,2`; miasto na (1,1), cud na (3,0), ruina cudu na (3,2). Źródła wartości oczekiwanych (plik:linia) w nagłówku pliku testów.

Wektory z dispatchu: `seed = 2^32+5 → 5`, `-1.5 → -1`, `NaN → 0` (dodatkowo `2^31 → -2^31`, `-2^31-1 → 2^31-1`); heks z miastem i cudem → `solid_hidden` true, 6 sąsiadów → false; `prism_hidden == FogSets.prism_hidden`; `terraces` 1:1 (true i false); `covering_improvement` tylko dla ustawionych, brak wpisu → false. `apply_terrain_fog` porównany z bezpośrednim `set_fog` na dwóch klonach sceny z `build_terrain` (cała `TerrainScene` równa, zwracane `showOceanBackdrop` = `land_reveal` przy ukrytych heksach; mgła wyłączona → `true`).

### Mutacje (skrypt w scratchpadzie, plik przywrócony i sprawdzony bajt-w-bajt: `RESTORED True`)

| Mutacja | Wynik `cargo test --test view_adapter_terrain` |
|---|---|
| M1 pominięcie cudów w `solid_hidden` | FAIL (exit 101): 4 testy — `solid_hidden_covers_cities_and_wonders_including_ruins`, `solid_hidden_wonder_without_city`, `map_hexes_full_fixture`, `map_hexes_fog_off` |
| M2 `terraces` zawsze false (oba miejsca) | FAIL (exit 101): 3 testy — `terraces_are_copied_one_to_one`, `terrain_data_copies_size_hexes_terraces_and_rivers`, `map_hexes_full_fixture` |
| M3 `seed` jako `map.seed as i32` | FAIL (exit 101): `seed_goes_through_to_int32` |
| M4 pominięcie `covering_improvement` | FAIL (exit 101): `okolica_covering_improvement_only_where_set` |

Brak `#[ignore]`, brak osłabionych asercji.

## BLOKADY / NIE_ZMIERZONO (bez wymyślania wartości)

1. **L5 — place budowy cudu (`wonderBuildSites`, `hideDecorAtHex` w `main.ts:5264`)**: nie ma ich w DTO; nie ukrywają brył w adapterze. NIE_ZMIERZONO (komentarz w `solid_hidden_hexes` z odniesieniem do L5).
2. **L1 — `revealAllLand`**: brak w DTO. `apply_terrain_fog` przyjmuje `land_reveal: bool` jako jawny parametr bez wartości domyślnej. Przypadek pinu `fogOn = false && revealAllLand = true` (gałąź mgły, `useFogRender = fogOn || revealAllLand`, `main.ts:13485`) nie jest wyrażalny samym `ViewerDto.fog_active` — NIE_ZMIERZONO.
3. **L2 — `riverRevealKeys`** (`main.ts:13493`): brak w DTO i w Rust `set_fog`; NIE_ZMIERZONO.
4. **`HexDynDto.nakladka` a `solid_hidden`** (odchylenie od literalnego brzmienia dispatchu, uzasadnione pinem): w pinie `nakladka` ukrywa dekor wyłącznie przez *zdarzenia* — wycinkę lasu (`main.ts:16801`, `:17014`, `:42967`; po wycince `nakladka = Brak`, czyli stan nieodróżnialny od heksu, który nigdy nie miał lasu) oraz ulepszenia na lesie/wzgórzu w `syncImprovementDecorForHex` (`main.ts:16877-16946`), które wymagają predykatów gry (`preservesHillRelief`, `ULEPSZENIA_ZYWNOSCIOWE`, `isImprovementBlockedOnForest`). Końcowy stan `nakladka` nie wyznacza `solid_hidden`, a te predykaty to reguły gry spoza adaptera. Dlatego `nakladka` NIE jest używana; ukrycia „ulepszeniowe” poza `tarasy` (które niesie `terraces`) i „po wycince” — NIE_ZMIERZONO, kandydat na lukę kontraktu (pole `decor_hidden` w `HexDynDto` liczone przez producenta) do decyzji orkiestratora.
5. `TerrainInput.detail` (`mapDetailQuality`) i `TerrainSceneOptions.solids_visible` (`zoomFlags.styledDecor`, `scene.ts:3373-3376`) to opcje/stan renderera, nie DTO — parametry funkcji.
