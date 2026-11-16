# R-RUSTPORT-P4-1-R2-DECOR-PLACEMENT — Operator r1

STATUS: BLOCK
DOMAIN: GAME (renderer 3D, dekor terenu)
TEMAT: R-RUSTPORT-P4-1-R2-DECOR-PLACEMENT
GOAL: rozmieszczenie lasu/dżungli per heks wg `HexDynDto.nakladka` oraz stan per heks `hide_decor_at_hex` / `sync_forest_for_units` (odpowiedniki `hideDecorAtHex`, `syncForestForUnits` z pinu `07d2fbd72`), R2 z `P4-1G-ADAPTER-ROZPOZNANIE.md` §4.
ZMIANY/COMMIT: baza `origin/rust-port/parity-v2` = `dd9a1b4e7a1b1c0084df61f073d8e41660d80c87`; jeden commit z kodem i raportem (SHA w odpowiedzi Operatora). Pliki — wszystkie w allowliście:
- `rust-port/renderer/src/decor/placement/mod.rs` (NOWY)
- `rust-port/renderer/src/decor/mod.rs` (wyłącznie `pub mod placement;`)
- `rust-port/renderer/tests/decor_placement_scene.rs` (NOWY)
- `rust-port/renderer/tests/fixtures/decor_placement/scene.json` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R2-DECOR-PLACEMENT/01-operator-r1.md` (ten raport)
Bez `Cargo.lock` (cargo dopisał 34 linie w `rust-port/renderer/Cargo.lock` — przywrócone `git checkout`, nie w commicie).
TESTY (w `rust-port/renderer`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` unikalny w scratchpadzie poza repo, usunięty po bramkach):
- `df -h /` przed bramkami: najpierw 5,0 / 4,9 / 4,9 GB (bramki wstrzymane), potem **15 GB** (inne tematy zwolniły dysk) → bramki uruchomione; przed pełnym testem 12 GB.
- `cargo fmt --check` → **EXIT 0**
- `cargo clippy --all-targets -- -D warnings` → **EXIT 0**
- `cargo test --all-targets --no-fail-fast` → **EXIT 101**: 566 passed, **2 failed**, 0 ignored (69 zestawów). Nowe testy `decor_placement_scene`: **9/9 ok**. Padły: `decor_web_parity::decor_uses_jsmath_not_platform_libm` i `decor_web_parity::decor_reuses_core_instead_of_copies` — patrz BLOKADY.
- Mutacje (każda na `decor_placement_scene`, potem cofnięta; `grep -c MUTATION` = 0):
  - (a) dekor pod miastem nie ukryty (pętla `for c in cities` w `from_dto` bez `hide_decor_at_hex`) → **FAIL** 3 testy: `city_and_wonder_hexes_hide_their_clump`, `fog_dims_explored_and_hides_unexplored`, `units_hide_the_forest_under_them` (6 ok).
  - (b) las pod jednostką pominięty (`sync_forest_for_units` bez `insert`) → **FAIL** 2 testy: `units_hide_the_forest_under_them`, `hide_decor_moves_hex_out_of_the_unit_set_for_good` (7 ok).
  - (c) kolejność odwrócona (`for h in hexes.iter().rev()` w `place_forests`) → **FAIL** 1 test: `instance_order_is_dto_order_per_layer` (8 ok).
BLOKADY: **konflikt allowlisty z istniejącym testem strażnika.** Dispatch nakazuje NOWY katalog `rust-port/renderer/src/decor/placement/**`, a `tests/decor_web_parity.rs:1702-1718` (`decor_sources()`, strażnik reuse/libm z P4-17) ma asercję `decor/ has no sub-directories` → oba testy strażnika padają na samym istnieniu katalogu `decor/placement`, niezależnie od treści kodu. Plik `tests/decor_web_parity.rs` jest poza allowlistą, a `decor/placement.rs` (plik zamiast katalogu) też jest poza allowlistą. Nie zmieniałem żadnego z nich w commicie.
  Dowód, że kod spełnia intencję strażnika: lokalny eksperyment (NIE w commicie, cofnięty `git checkout`) — `decor_sources()` schodzący rekursywnie do podkatalogów → `cargo test --test decor_web_parity` **12/12 ok** (strażnik skanuje też `placement/mod.rs`: brak `sin/cos/…`, brak kopii elementów `core`).
RUNDY: 1/5
NASTĘPNY KROK: decyzja techniczna orkiestratora (allowlista), potem r2 tym samym ID:
- **A (rekomendowane):** dopisać do allowlisty `rust-port/renderer/tests/decor_web_parity.rs` — wyłącznie `decor_sources()` zamienione na skan rekursywny (zmiana jak w eksperymencie, ~10 linii). Za: strażnik libm/reuse obejmuje też nowy kod rozmieszczenia (silniejszy, nie słabszy); katalog zgodny z dispatchem. Przeciw: dotyka testu z P4-17 (trzeba to opisać w rejestrze).
- B: przenieść kod do `rust-port/renderer/src/decor/placement.rs` (plik). Za: zero zmian w teście strażnika, strażnik i tak skanuje plik. Przeciw: zmiana allowlisty z katalogu na plik; przyszłe rozbicie modułu na pliki znów uderzy w strażnika.
- C: osobny moduł poza `decor/` (np. `renderer/src/decor_placement/`). Za: strażnik nietknięty. Przeciw: strażnik libm NIE obejmie tego kodu; rozjazd z kontraktem R2.
DEPLOY/PUSH: NIE WYKONANO

## Odczyt pinu `07d2fbd72` (przed kodem)
- `render/scene.ts:2346-2374` — kępa tylko gdy `hex.nakladka === Nakladka.Las && isDryLandTeren(t)`; dżungla gdy `isWarmJungleForestHex(q, r, map.wysokoscR)` (wariant `wariantDjungliDlaHeksa(q,r,NDJ=5,seed)`, obrót `rotacjaDjungliDlaHeksa`), inaczej las (`wariantLasuDlaHeksa(q,r,NL_NATURAL=4,seed)`, `rotacjaLasuDlaHeksa`); pozycja `(x, vis.height + vis.yOffset, z)`, skala 1; instancje dopisywane do warstwy wariantu w kolejności `Object.values(map.hexes)`.
- `render/scene.ts:1717-1719` — `NL_NATURAL = 4`; wariant L4 zarezerwowany na wyrąb (warstwa 4 pusta przy budowie).
- `render/scene.ts:3164-3170` `syncForestForUnits` — zastępuje zbiór, pomija heksy `decorHidden`; `:3172-3196` `hideDecorAtHex` — usuwa heks ze zbioru jednostek, dodaje do `decorHiddenHexKeys` na stałe, zeruje kępy.
- `render/scene.ts:3252-3260`, `:3307-3328`, `:3381-3389` — `applyLasFog`: `ZERO_MATRIX` gdy `fogBrightnessForHex <= 0 || forestHidden`, inaczej macierz oryginalna + kolor `bri`.
- Wołający w `main.ts`: `:14554-14562` (jednostki), `:4312` (cuda, ruiny też), `:5264`, `:16158`, `:16211` (miasta).

## Ustalenie dot. luki L5 („plac budowy”)
`main.ts:5250-5264`: `hideDecorAtHex(keyOf(site.q, site.r))` jest wołane **przy ukończeniu** cudu, zaraz po `placedWorldWonders.push(...)`. Plac w trakcie budowy dekoru NIE ukrywa. Ukrycie z `:5264` = heks cudu postawionego, który DTO niesie w `wonders[]`; dla ukrycia dekoru luka L5 nie wymaga zmiany DTO. Ukrycia zdarzeniowe (`:16801`, `:16884`, `:16891`, `:16944`, `:17014`, `:42967` — wycinka, ulepszenia) są poza DTO i poza zakresem (jak w `view/terrain.rs`).

## Kod (`decor/placement/mod.rs`)
- `place_forests(seed, map_height, &[ForestHexInput]) -> ForestPlacement` — warstwy `las[0..5)` i `djungla[0..5)` z oryginalnymi macierzami i heksami instancji.
- `forest_hexes(map, hex_state)` i `ForestPlacement::from_dto(map, hex_state, cities, wonders)` — DTO → wejście; ukrycia z DTO: cuda (z ruinami) i miasta (ten sam zbiór co `view::solid_hidden_hexes`). Zero reguł gry (D-DTO-1 = A).
- `hide_decor_at_hex`, `sync_forest_for_units`, `is_decor_hidden`, `is_unit_forest_hidden`, `forest_hidden`, `layers`, `instance_count`, `apply_las_fog(layer, Option<&FogSets>)`, `visible_instances`.
- Reużyte bez zmian: `forest::{wariant,rotacja}_lasu_dla_heksa`, `jungle::{wariant,rotacja}_djungli_dla_heksa`, `style::is_warm_jungle_forest_hex`, `terrain::{instance_matrix, zero_matrix}`, `core::fog_dim::fog_brightness_for_hex`, `view::{pick_hex, terrain, seed_i32, FogSets}`. Bez zmian w `forest.rs`, `jungle.rs`, `river_lod.rs`, `view-model`, `engine`, `gra/`.

## Testy (`tests/decor_placement_scene.rs`, fixture `scene.json`, mapa 3×20)
Wektory V1–V7 z `plik:linia` pinu w komentarzu pliku. 9 testów: strefy klimatu fixture; liczba instancji (10; warstwa 4 pusta; brak kępy na płytkim morzu) i rodzaj per heks; wariant i macierz wg wzoru pinu (bitowo `f32`); kolejność instancji = kolejność DTO w każdej warstwie (+ warunek ≥1 warstwy z ≥2 instancjami); ukrycie pod miastem/cudem/ruiną; las pod jednostkami (zbiór zastępowany, nie scalany); `hide_decor_at_hex` przenosi heks ze zbioru jednostek na stałe; mgła (odkryty → 0,175, nieodkryty → zero, mgła wyłączona → 1); błąd długości `hex_state`.

## NIE_ZMIERZONO
- Bitowa zgodność macierzy z przeglądarką dla całej sceny: test porównuje z `instance_matrix` i funkcjami wariantu/obrotu (już zweryfikowanymi wektorami webu w `terrain_web_parity` / `decor_web_parity`); nowych wektorów z przeglądarki nie generowano.
- Ścieżki pinu poza stylem roblox (`buildStyleForestCluster`, stożki `forestMesh`, `:2375+`) i flaga LOD `zoomFlags.styledDecor` — poza zakresem.
- Zbiór heksów jednostek z DTO (`display.visibleIds` + `forceVisibleUnitId`, `main.ts:14554-14561`) — należy do R1 / L3; tu wejście podaje wołający.
