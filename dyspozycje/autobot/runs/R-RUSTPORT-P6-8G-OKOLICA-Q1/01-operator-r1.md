STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8G-OKOLICA-Q1
GOAL: P6.8G — port `gra/src/game/okolica.ts` (815 LOC, 31 fn) do `rust-port/engine/src/domain/okolica.rs`, wektory z uruchomionego weba 91dc998a, testy NaN/progów/brakujących kluczy, mutacje lub dowód równoważności, niezależny weryfikator, tabela symboli per status.
ZMIANY/COMMIT: baza `72491e442` (origin/rust-port/parity-v2, 1840/0). Kod: `cb1b4de0e` (`feat(rust-port): P6.8G okolica - port wyboru pol miasta (partia 1)`). Allowlista użyta: `rust-port/engine/src/domain/okolica.rs` (NOWY, 1055 LOC, bez testów inline; **odstępstwo: partia > 600 LOC**, dispatch wymaga ≤600 na granicy symbolu, do rozbicia w rundzie 2), `rust-port/engine/src/domain/mod.rs` (+1 `pub mod okolica;`), `rust-port/engine/tests/p6_8g_okolica.rs` (NOWY, 404 LOC, 17 testów). Poza allowlistą: nic. Nie zmieniono `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`, `domain/mapgen/**`, `city_growth.rs`. Untracked poza commitem: `rust-port/engine/Cargo.lock` (nie jest śledzony w bazie, nie commitowany).
TESTY:
- `cargo fmt` (rustfmt --check --edition 2021) na `okolica.rs` i `p6_8g_okolica.rs`: EXIT=0 po formatowaniu.
- `cargo clippy --test p6_8g_okolica --lib`: 0 ostrzeżeń w `okolica.rs` (dwa usunięte: `neg_cmp_op_on_partial_ord` przepisane na jawne `is_nan() || <= 0.0`; `too_many_arguments` na 3 funkcjach z `#[allow]` z komentarzem: sygnatury 1:1 z web).
- `cargo test --test p6_8g_okolica`: 17 passed / 0 failed.
- `cargo test` (pełny crate `civ-engine`): EXIT=0, 243 bloków `test result: ok`, 0 failed, 0 panicked (log: scratchpad `p68g-test.log`).
- `git diff --cached --check`: EXIT=0 (brak białych znaków na końcu plików).
- Oczekiwania testów wyprowadzone ręcznie z kodu web (kolejność pętli `hexKeysWithinRadius`, wzory `tileScore`, komparatory, `Object.entries` = kolejność wstawiania). Testy pokrywają: promień 0/NaN/0.5 (quirk), tie-break dystans→klucz, fokus żywność (remis po żywności), NaN jako remis bez paniki, centrum obcego miasta i `excludeHexKeys`, toggle (`brak_ludnosci`, `centrum_miasta`, `limit_populacji`, zdjęcie B1), adjust (+1 na zajętym = `juz_obsadzone` bez zdjęcia; -1 na pustym = `brak_robotnika`), rebalans w spadku (najgorszy wpis; budżet DOKŁADNIE `excess`; nielegalny wpis `5,5` usuwany pierwszy — B3), rebalans we wzroście (seed przy pustym, dodanie przy częściowym), tryb auto = no-op, spór sąsiadów (remis indeksem, bliższe centrum, inny właściciel = pusto).
- NIE wykonano: wektory z uruchomionego weba (pin 91dc998a), mutacje na gałęziach sterujących, weryfikator niezależny.
BLOKADY:
1. Brak wektorów z uruchomionego weba (pin `91dc998a`, bundle esbuild w `mktemp -d`, fixture ≤ 6 MB). Nie wygenerowano w tej rundzie. Kryterium końca z dispatchu niespełnione.
2. Brak pliku `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` w `origin/rust-port/parity-v2` (ani w `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`). Lista symboli §11 (`8G-P1` 30 sym., `8G-P2` 6 sym.) nie jest dostępna w repo. Poniższa tabela wyprowadzona z `gra/src/game/okolica.ts` (ZAŁOŻENIE: lista = eksporty + funkcje wewnętrzne z pliku, dokument tematu oparty na tej liście).
3. `yieldOfMapHex` NIE przeportowane: wymaga `tileYield` (economy.ts) i mapowania nazw webowych (teren/nakladka) na enumy Rust. Zamiast tego plony są wstrzykiwane (`yield_of: &dyn Fn(i32,i32)->OkolicaYield`), zgodnie z kontraktem modułu webowego (plony wstrzykiwane).
4. Hak w `city_growth.rs` (`PopulationChangeHooks::rebalance_workers_after_population_change`) NIE wpięty do `okolica::rebalance_...`. Funkcja istnieje i jest testowana; wpięcie w następnej partii.
5. Deduplikacja `hex_keys_within_radius`: w bazie są 2 kopie (`improvement_build.rs:816` i `start_position.rs:589`; w `terrain.rs` brak). `okolica.rs` reużywa wersji z `improvement_build.rs`. Kopia w `start_position.rs` NIE zdeduplikowana (ZAŁOŻENIE: identyczna pętla dq/dr; do potwierdzenia wektorami).
6. Sortowanie: stabilne scalanie zamiast V8 TimSort. Dla spójnych komparatorów wynik identyczny. Dla niespójnych (NaN) nie ma gwarancji bitowej zgodności z V8. Do potwierdzenia wektorami z webu.
7. Dokument tematu z tabelą symboli nie został zapisany jako osobny plik (tabela poniżej).
RUNDY: 1/5 (zużyte: 1; ostatni werdykt: brak (pierwsza runda Operatora); decyzja wymagana: NIE — luki rozstrzygnięte ZAŁOŻENIEM w punktach 2, 5, 6).

TABELA SYMBOLI (ZAŁOŻENIE: lista z `okolica.ts`, nie z §11):
| # | Symbol web | Rust | Status |
|---|---|---|---|
| 1 | OKOLICA_RADIUS / CITY_RANGE_MIN / CITY_RANGE_CAP | `terrain::city_range_for_population` (reuse, parametry z miasto-params) | ZREUŻYTE (test 1:1 wartości) |
| 2 | cityRangeForPopulation | `terrain::city_range_for_population` | ZREUŻYTE, test |
| 3 | citySightRadius | `territory::city_sight_radius` | ZREUŻYTE (istniało) |
| 4 | hexKeysWithinRadius | `improvement_build::hex_keys_within_radius` | ZREUŻYTE; 2. kopia `start_position.rs` NIEZDEDUPLIKOWANA (blokada 5) |
| 5 | isLandWorkableHex | `okolica::is_land_workable_hex` | PORT, test |
| 6 | cityCenterKeysFromTerritoryNodes | `okolica::city_center_keys_from_nodes` (prywatna) | PORT, test pośredni |
| 7 | terrainAndTerritoryFilter | `okolica::terrain_and_territory_filter` | PORT, test pośredni (rebalans, adjust, toggle) |
| 8 | okolicaTiles | `okolica::okolica_tiles` | PORT, test (kolejność, quirk promienia) |
| 9 | tileScore | `okolica::tile_score` | PORT, test pośredni |
| 10 | tileAssignScore | `okolica::tile_assign_score` | PORT |
| 11 | AssignOptions | `okolica::AssignOptions` | PORT |
| 12 | compareScoredOkolicaTiles | `okolica::compare_scored` (+ `js_cmp_diff`) | PORT, test (fokus żywność, NaN) |
| 13 | scoreOkolicaTile | scalone w `assign_worked_tiles` | PORT (scalone) |
| 14 | foodPotentialOfMapHex | `okolica::food_potential_of_map_hex` | PORT (bez testu jednostkowego, dane ulepszeń) |
| 15 | assignOptionsForFocus | `okolica::with_focus_potential` | PORT |
| 16 | effectiveIsWorkable | `okolica::effective_is_workable` | PORT, test (centrum, exclude) |
| 17 | assignWorkedTiles | `okolica::assign_worked_tiles` | PORT, test |
| 18 | wagiForFocus | `okolica::wagi_for_focus` | PORT, test |
| 19 | resolveWorkedTiles | `okolica::resolve_worked_tiles` | PORT (gałąź ręczna pośrednio testowana; gałąź auto przez assign) |
| 20 | yieldOfMapHex | brak (wstrzyknięcie `yield_of`) | NIE PORTOWANE (blokada 3) |
| 21 | seedReczneFromAuto | `okolica::seed_reczne_from_auto` | PORT, test (rebalans wzrost przy pustym) |
| 22 | countAssignedWorkers | `Reczne::count_assigned` | PORT |
| 23 | pickDeterministicIndex | `okolica::pick_deterministic_index` | PORT, test pośredni (rebalans wzrost) |
| 24 | rebalanceWorkersAfterPopulationChange | `okolica::rebalance_workers_after_population_change` | PORT, test (spadek, wzrost, B3); hak w city_growth NIE wpięty (blokada 4) |
| 25 | adjustTileWorker | `okolica::adjust_tile_worker` | PORT, test (kierunkowość) |
| 26 | surroundingWorkerCap | `okolica::surrounding_worker_cap` | PORT |
| 27 | toggleTileWorker | `okolica::toggle_tile_worker` | PORT, test (powody, limit) |
| 28 | collectWorkedHexKeysForOwner | `okolica::collect_worked_hex_keys_for_owner` | PORT (bez testu jednostkowego) |
| 29 | collectWorkedHexOwnerMap | `okolica::collect_worked_hex_owner_map` | PORT (bez testu jednostkowego) |
| 30 | computeLostToNearerSiblingByCity | `okolica::compute_lost_to_nearer_sibling_by_city` | PORT, test (remis indeksem, bliższe centrum, obcy właściciel) |
| 31 | re-eksport buildTerritoryNodesFromCities / reconcile* / isTerritoryHexOwnedBy | `territory::build_territory_nodes_from_cities`, `territory::is_territory_hex_owned_by` istnieją; `reconcile*` NIE sprawdzone | CZĘŚCIOWO (reconcile* poza tą partią) |

NASTĘPNY KROK: Runda 2 Operatora (ten sam ID): (a) wektory z pinu 91dc998a dla symboli 5, 8, 9, 17, 19, 21, 24–30 (bundle w `mktemp -d`, bez `gra/`); (b) mutacje na gałęziach sterujących `toggle`, `adjust`, `rebalance` (wzrost/spadek), `compare_scored`, `compute_lost`; (c) wpięcie haka w `city_growth.rs` (osobny zakres — wymaga decyzji orkiestratora, bo `city_growth.rs` jest w allowliście tylko jako hak rebalansu); (d) zdeduplikować `start_position.rs::hex_keys_within_radius` albo jawnie przenieść do NASTĘPNEJ-PARTIA; (e) dokument tematu z tabelą. Następnie Evaluator / Final Control.
DEPLOY/PUSH: NIE WYKONANO
