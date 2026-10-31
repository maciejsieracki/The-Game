STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8G-OKOLICA-Q1
GOAL: Domknąć port `gra/src/game/okolica.ts` (815 LOC, 31 funkcji) do `rust-port/engine/src/domain/okolica.rs` z wektorami z pinu `91dc998a`, mutacjami i tabelą symboli. Ta runda (Operator-pomiary, kontynuacja r1) zweryfikowała bramki i mutacje na partii 1 (`cb1b4de0e`). Temat NIE jest zamknięty.
ZMIANY/COMMIT: baza `f0b6bd8f9` (raport r1 na `cb1b4de0e`). Ta runda nie zmienia kodu produkcyjnego ani testów; mutacje były przywracane `git checkout --` i drzewo jest czyste. Dodany jest tylko ten raport. Allowlista: `dyspozycje/autobot/runs/R-RUSTPORT-P6-8G-OKOLICA-Q1/**`. Nic nie wypchnięto.
TESTY:
- `cargo fmt --check` (crate `rust-port/engine`): EXIT=0.
- `cargo clippy --all-targets -- -D warnings` (`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`): EXIT=0.
- `cargo test --test p6_8g_okolica`: `test result: ok. 17 passed; 0 failed`, EXIT=0.
- `cargo test` (pełny crate): EXIT=0, sumarycznie 1857 passed, 0 failed, 0 FAILED w logu. Logi w katalogu scratchpad sesji (nie w repo).
- Mutacje na gałęziach sterujących `okolica.rs` (jedna mutacja naraz, `cargo test --test p6_8g_okolica`, potem przywrócenie):
  - M1 `compare_scored`: odwrócony warunek `focus == Some(Zywnosc)` na `!=` -> EXIT=101, FAIL `zywnosc_focus_tie_break_prefers_higher_food` (ZABITA).
  - M2 `compare_scored`: odwrócony tie-break `a.t.dist - b.t.dist` -> EXIT=101, FAIL `assign_tie_break_distance_then_key`, `rebalance_grow_seeds_when_empty_and_adds_when_partial` (ZABITA).
  - M3 `js_floor_nonneg`: usunięte `max(0.0)` (klamra JS `Math.max(0, Math.floor(x))`) -> EXIT=0, 17 passed (PRZEŻYŁA, LUKA).
  - M4 `compare_scored`: odwrócony tie-break po kluczu `a.t.key.cmp(&b.t.key)` -> EXIT=101, FAIL 3 testów (ZABITA).
- Wynik mutacji: 3/4 zabite. Jedna przeżyła: brak wektora z ujemną populacją dla klamry `js_floor_nonneg`. Wywołania: linie 507, 576, 628, 736, 810, 933 `okolica.rs`. Dla r3 potrzebny test z `population < 0` (np. -0.5, -3) w `city_range_for_population` i `rebalance`.
- Weryfikacja zgodności komparatora z TS (`okolica.ts:218`): `js_cmp_diff` (NaN -> remis) zgodne z `b.s - a.s` przy NaN; kolejność kryteriów zgodna. ZAŁOŻENIE: `localeCompare` dla kluczy `q,r` (alfabet `[-0-9,]`) = porządek bajtowy; komentarz w kodzie to uzasadnia, nie ma wektora ICU.
BLOKADY:
1. Brak wektorów z uruchomionego weba (pin `91dc998a` istnieje w repo, `gra/src/game/okolica.ts` obecny; bundle esbuild i wektory NIE wykonane w tej rundzie). Do zrobienia w r2 Operatora w `mktemp -d`.
2. Brak `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` w bazie. Tabela symboli poniżej oparta na liście eksportów `okolica.ts` (ZAŁOŻENIE).
3. `yieldOfMapHex` (`okolica.ts:382`) nie jest portowane. Plony wstrzykiwane przez `yield_of` (`okolica.rs:455`), więc `resolve`/`assign` nie mają odpowiednika `yieldOfMapHex` w Rust. ZAŁOŻENIE: wywołujący dostarcza tę samą funkcję.
4. Hak rebalansu nie jest wpięty. `okolica::rebalance_workers_after_population_change` nie ma wywołań poza `okolica.rs` (grep `okolica::` poza modułem: zero trafień). `city_growth.rs:1450` ma własną prywatną `rebalance_workers_after_population_change` (wywołanie `:1614`). Dwa równoległe źródła prawdy. Wpięcie wymaga decyzji o kształcie hooka; ZAŁOŻENIE: zostaje to na r2.
5. `hex_keys_within_radius` w `terrain.rs`, `start_position.rs`, `improvement_build.rs` nie zdeduplikowane. ZAŁOŻENIE: identyczne zachowanie. Warunek końca wymaga 0 rozbieżności albo jawnej NASTĘPNEJ-PARTII.
6. Sortowanie przez scalanie (`stable_sort_by`, `okolica.rs:184`) nie gwarantuje bitowej zgodności z V8 TimSort dla niespójnych komparatorów (NaN). Ta sama wartość zwracana dla NaN, ale kolejność przy NaN nie jest dowiedziona. ZAŁOŻENIE: wynik jest równoważny, gdy komparator zwraca remis dla każdej pary z NaN.
7. Partia 1 ma 1055 LOC, limit z dispatchu to 600. Do rozbicia w r2 na granicy symbolu (`8G-P1` 548 LOC, `8G-P2` 267 LOC).
8. Luka testowa z M3 (patrz wyżej).

TABELA SYMBOLI (eksporty `okolica.ts` -> Rust; status wg r2):
| TS | Rust | Status |
|---|---|---|
| cityRangeForPopulation | city_range_for_population (istniejący) | REUŻYTY, bez zmian |
| citySightRadius | city_sight_radius (istniejący) | REUŻYTY, bez zmian |
| hexKeysWithinRadius | hex_keys_within_radius (3 kopie) | NASTĘPNA-PARTIA (blokada 5) |
| isLandWorkableHex | is_land_workable_hex | PORT, bez wektorów |
| okolicaTiles | okolica_tiles | PORT, bez wektorów |
| tileScore | tile_score | PORT, testy jednostkowe |
| tileAssignScore | tile_assign_score | PORT, testy jednostkowe |
| foodPotentialOfMapHex | food_potential_of_map_hex | PORT, bez wektorów |
| wagiForFocus | wagi_for_focus | PORT |
| assignWorkedTiles | assign_worked_tiles | PORT, mutacje M2/M4 |
| resolveWorkedTiles | resolve_worked_tiles | PORT |
| yieldOfMapHex | (brak; wstrzykiwane yield_of) | BLOKADA 3 |
| seedReczneFromAuto | seed_reczne_from_auto | PORT |
| rebalanceWorkersAfterPopulationChange | rebalance_workers_after_population_change | PORT, HAK NIE WPIĘTY (blokada 4) |
| adjustTileWorker | adjust_tile_worker | PORT |
| surroundingWorkerCap | surrounding_worker_cap | PORT |
| toggleTileWorker | toggle_tile_worker | PORT |
| collectWorkedHexKeysForOwner | collect_worked_hex_keys_for_owner | PORT |
| collectWorkedHexOwnerMap | collect_worked_hex_owner_map | PORT |
| computeLostToNearerSiblingByCity | compute_lost_to_nearer_sibling_by_city | PORT |
| compareScoredOkolicaTiles (wewn.) | compare_scored | PORT, mutacje M1/M2/M4 |
| js_floor_nonneg (klamra Math.max) | js_floor_nonneg | PORT, LUKA M3 |
| cityCenterKeysFromTerritoryNodes, terrainAndTerritoryFilter, assignOptionsForFocus, effectiveIsWorkable, countAssignedWorkers, pickDeterministicIndex, scoreOkolicaTile (wewn.) | odpowiedniki prywatne | PORT, bez osobnych wektorów |

Uwaga: §11 `P6-8-MIASTA-PODZIAL.md` nie istnieje w bazie, więc tabela nie odwzorowuje wierszy `8G-P1`/`8G-P2` 1:1.

RUNDY: 2/5 (ostatni werdykt: r1 BLOCK; ta runda: BLOCK; decyzja wymagana: NIE. Luki rozstrzygnięte założeniami w tekście.)
NASTĘPNY KROK: runda 3 Operatora: (a) wektory z pinu `91dc998a` (bundle esbuild w `mktemp -d`, fixture ≤ 6 MB, usunięcie po użyciu), (b) test dla ujemnej populacji zabijający M3, (c) wpięcie haka w `city_growth.rs` albo jawne uzasadnienie odłożenia, (d) rozbicie partii do ≤ 600 LOC, (e) dokument tematu z tabelą; potem Evaluator i Final Control z tym samym ID.
DEPLOY/PUSH: NIE WYKONANO
