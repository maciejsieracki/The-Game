STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8G-OKOLICA-Q1
GOAL: Domknąć port `gra/src/game/okolica.ts` (pin 91dc998a) do `rust-port/engine/src/domain/okolica.rs` z wektorami z uruchomionego weba, mutacjami, tabelą symboli per status i wpiętym hakiem rebalansu. Temat NIE jest zamknięty: hak rebalansu nie jest wpięty, a wektory nie pokrywają 4 symboli ani wariantu NaN dla n >= 64.
ZMIANY/COMMIT:
- Baza: `d34a0e034` (raport r2 na `f0b6bd8f9`/`cb1b4de0e`). Branch lokalny `p6-8g-okolica-r3` (nic nie wypchnięto).
- `29460c514` refactor: dedup jądra dysku hex `improvement_build::hex_disk_offsets` w `terrain.rs`, `start_position.rs`, `improvement_build.rs` (B5).
- `d2c74d44b` test: zabicie M3 (`negative_population_clamps_worker_cap_to_zero`, `negative_population_rebalance_empties_manual_workers`).
- `829d83fed` refactor: podział `okolica.rs` (1055 LOC) na granicach sekcji: `okolica.rs` 450, `okolica/auto.rs` 168, `okolica/manual.rs` 303, `okolica/sasiedztwo.rs` 156 (wszystkie <= 600; B4).
- `ca48f76a3` feat: wektory z pinu `91dc998a` (`rust-port/engine/tests/p6_8g_vectors/okolica.json`, 542 KB, generator `gen-p6-8g-okolica-vectors.mjs` w katalogu runu), testy `tests/p6_8g_web_vectors.rs` (10 testów), `v8_sort_by` dla n < 64 (B6, rozbieżność znaleziona przez wektory i naprawiona).
- Allowlista: zmienione tylko `rust-port/engine/src/domain/{okolica.rs,okolica/*.rs,terrain.rs,start_position.rs,improvement_build.rs}`, `rust-port/engine/tests/p6_8g_*.rs`, `rust-port/engine/tests/p6_8g_vectors/**`, katalog runu. Brak zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`, `domain/mapgen/**`, `city_growth.rs`, `state.rs`. Plik `Cargo.lock` jest nieśledzony i NIE został dodany do commitów.
- `git diff --check` i `git diff --cached --check` przed każdym commitem: czysto.
- Dokument tematu z tabelą symboli: sekcja „TABELA SYMBOLI" niżej (36 wierszy §11 `8G-P1` 30 + `8G-P2` 6). Źródło listy: `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` §9 `8G` i §11 (plik istnieje na gałęzi dispatchu, nie w `origin/rust-port/parity-v2`).

TESTY (wszystkie w `rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`):
- `cargo fmt --check`: EXIT=0 (na `ca48f76a3` + dokument).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (na `ca48f76a3`).
- `cargo test --test p6_8g_okolica`: 19 passed; 0 failed; EXIT=0.
- `cargo test --test p6_8g_web_vectors`: 10 passed; 0 failed; EXIT=0.
- `cargo test --lib`: 19 passed; EXIT=0.
- Pełny `cargo test` (crate): 244 suite'ów, 1869 passed, 0 failed, EXIT=0. Wykonane z `CARGO_TARGET_DIR=/dev/shm/civ-r3-target`, bo dysk `/` był pełny (0 B wolne); worktree `rust-port/engine/target` usunięty zgodnie z regułą DYSK. Liczba 1869 = 1857 (baza) + 12 nowych (2 M3 + 10 wektorów).
- Pin `91dc998a` uruchomiony: `git archive 91dc998a gra/src gra/data` do katalogu `mktemp -d`, generator importuje `gra/src/game/okolica.ts` przez loader REPIN-B2 (Node v22.22.0, `--experimental-transform-types`), bez `npm run build/dev`. Liczniki: cityRange 22, surroundingCap 22, score 500, assignScore 2000, wagiFocus 5, keys 72, tiles 144, edge 12, locale 3136, auto 320, rebalance 354.
- Mutacje (jedna naraz, potem `git checkout --`):
  - M1 `compare_scored` focus `!=` (r2): EXIT=101 (ZABITA, r2).
  - M2 `compare_scored` tie-break dist (r2): EXIT=101 (ZABITA, r2).
  - M3 `js_floor_nonneg` bez `max(0.0)`: EXIT=101, FAIL `negative_population_clamps_worker_cap_to_zero` (ZABITA, r3; w r2 PRZEŻYŁA).
  - M4 `compare_scored` tie-break klucza (r2): EXIT=101 (ZABITA, r2).
  - MV1 `v8_sort_by` gałąź malejącego prefiksu (`order != Less` -> `== Less`): EXIT=101, FAIL `web_resolve_auto_matches_ts_including_nan_yields` (ZABITA).
  - MV2 `v8_sort_by` porównanie wstawiania (`== Less` -> `== Greater`): EXIT=101, FAIL `assign_tie_break_distance_then_key`, `zywnosc_focus_tie_break_prefers_higher_food` (ZABITA).
  - MV3 `okolica_tiles` odcięcie dystansu (`dist > rad` -> `dist >= rad`): EXIT=101, FAIL `okolica_tiles_radius_one_order_excludes_center`, `okolica_tiles_radius_quirks` (ZABITA).
  - NIE ZMIERZONO w r3: mutacje gałęzi `rebalance` (shrink/grow), `toggle_tile_worker`, `adjust_tile_worker`, `collect_*`, `compute_lost_to_nearer_sibling_by_city`, `resolve_worked_tiles` (tryb reczny), `js_cmp_diff`, `okolica_tiles` (warunek `isWorkable`).
- Wektory z weba (`web_*`) PASS: cityRange, surroundingCap, tileScore, tileAssignScore, wagiForFocus, hexKeysWithinRadius (w tym N-1/N/N+1 dla N=5,6), okolicaTiles (z i bez predykatu), localeCompare kluczy, resolveWorkedTiles auto (320 przypadków, w tym plony NaN), rebalans trybu ręcznego (354 przypadki, w tym kolejność kluczy `Object.entries`).
BLOKADY:
1. Hak rebalansu NIE wpięty. `okolica::rebalance_workers_after_population_change` nie ma wywołań poza modułem. Kontrakt hooka to trait `PopulationChangeHooks` (`city_growth.rs:1447`), bez żadnej implementacji w `src` (jedyna implementacja to `Recorder` w `tests/p6_7a_post_central.rs:36`). Wpięcie wymaga adaptera z pamięcią `okolica_reczne`, a `state::City` (`state.rs:1683`) nie ma tego pola (grep: 0 trafień w `state.rs`; pole istnieje tylko w `territory::WorkCity`). `state.rs` jest poza allowlistą. ZAŁOŻENIE (rozstrzygnięte bez pytania): dodanie pola i adaptera wymaga rozszerzenia allowlisty w temacie następnym; w tym temacie hak pozostaje otwarty.
2. Parytet sortowania dla NaN i n >= 64 NIE dowiedziony. `v8_sort_by` zgadza się z V8 tylko dla n < 64 (jeden run, CountAndMakeRun + BinaryInsertionSort). Dla n >= 64 działa `stable_sort_by` (merge), a przy NaN wynik może różnić się od TimSort V8. Dla komparatora bez NaN porządek jest całkowity (klucze unikalne), więc wynik jest jednoznaczny i niezależny od algorytmu. ZAŁOŻENIE: pełny TimSort (galop) potrzebny tylko, gdy plony są NaN, a te nie występują w danych gry; do potwierdzenia wektorem z n >= 64.
3. Brak wektorów z weba dla: `adjustTileWorker`, `toggleTileWorker`, `collectWorkedHexKeysForOwner`, `collectWorkedHexOwnerMap`, `computeLostToNearerSiblingByCity`, `resolveWorkedTiles` tryb ręczny, `cityCenterKeysFromTerritoryNodes` / `terrainAndTerritoryFilter` z terytorium. Pokryte tylko testami ręcznymi (`p6_8g_okolica.rs`). Dispatch wymaga wektorów dla wszystkich 8G-P1/P2.
4. `yieldOfMapHex` NIE portowane (zależy od `economy.tileYield`). ZAŁOŻENIE: plony wstrzykiwane (`yield_of`). Dowód równoważności konsumenta: wektory używają wyjścia TS `yieldOfMapHex` jako tabeli (`yieldTable`), więc testy potwierdzają konsumenta, nie sam `yieldOfMapHex`.
5. Mutacje: patrz lista NIE ZMIERZONO wyżej (nie każda gałąź sterująca ma mutację ani dowód równoważności).
6. Niezależny weryfikator: rola Evaluatora (nie Operatora). Generator i fixture są odtwarzalne z pinu (komenda w sekcji niżej); Evaluator musi je uruchomić ponownie.

RUNDY: 3/5 (r1 BLOCK; r2 BLOCK; r3 BLOCK; ostatni werdykt: r2 BLOCK; decyzja wymagana: NIE, wszystkie luki rozstrzygnięte założeniami w tekście).

NASTĘPNY KROK: runda 4 Operatora (ten sam ID): (a) adapter `PopulationChangeHooks` dla `okolica::rebalance` z pamięcią `okolica_reczne` (wymaga rozszerzenia allowlisty o `state.rs` lub osobnego tematu), (b) wektory z weba dla pozostałych funkcji z listy BLOKADA 3 i wektor n >= 64 z NaN, (c) pełny TimSort V8 albo dowód, że NaN nie występuje w danych gry, (d) mutacje na każdej gałęzi sterującej z BLOKADY 5, (e) aktualizacja tabeli; potem Evaluator i Final Control z tym samym ID.

DEPLOY/PUSH: NIE WYKONANO

---

## ODPOWIEDZI NA ZARZUTY (ID R-RUSTPORT-P6-8G-OKOLICA-Q1, runda 3)

1. Brak wektorów z pinu `91dc998a`. PRZYJMUJĘ (częściowo). Naprawa: `ca48f76a3`, `tests/p6_8g_vectors/okolica.json` + `tests/p6_8g_web_vectors.rs` (10 testów PASS). Dowód: sekcja TESTY. Otwarte: BLOKADA 3 (brak wektorów dla 6 funkcji).
2. Brak dokumentu tematu z tabelą symboli i brak `P6-8-MIASTA-PODZIAL.md`. PRZYJMUJĘ. Tabela poniżej (36 wierszy z §11). Plik istnieje na gałęzi dispatchu `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (nie w `parity-v2`); cytowany jako źródło, nie kopiowany do repo.
3. Hak rebalansu nie wpięty; dwa źródła prawdy w `city_growth.rs:1450`. PRZYJMUJĘ, że hak nie jest wpięty (BLOKADA 1). ODRZUCAM twierdzenie o dwóch źródłach prawdy: `city_growth.rs:1450` to deklaracja metody traitu bez ciała, a nie prywatna kopia; nie ma drugiej implementacji rebalansu. Dowód: `grep -rn 'fn rebalance_workers_after_population_change' rust-port/engine/src` daje tylko `okolica/manual.rs` i deklarację traitu w `city_growth.rs`.
4. Mutacja M3 przeżyła. PRZYJMUJĘ i NAPRAWIONE: `d2c74d44b`; M3 teraz EXIT=101 (ZABITA).
5. Partia `okolica.rs` 1055 LOC. PRZYJMUJĘ i NAPRAWIONE: `829d83fed`; cztery pliki, każdy <= 600 LOC (450/168/303/156).
6. Dedup `hex_keys_within_radius` nie wykonany i nie zweryfikowany. PRZYJMUJĘ i NAPRAWIONE: `29460c514`. Trzy pętle są jednym jądrem `hex_disk_offsets` (kolejność `dq` zewnętrzna, `dr` wewnętrzna bez zmian); predykaty i typy kluczy zostają po stronie wywołań (różnią się: `BuildMap`/`BTreeMap`, `f64`/`u32`). Weryfikacja: pełny `cargo test` 1869/0 oraz wektory `hexKeysWithinRadius` (72+12 PASS).
7. Założenia bez dowodu: `yieldOfMapHex`, `stable_sort_by`/V8 dla NaN, `localeCompare`.
   - `localeCompare`: PRZYJMUJĘ i UDOWODNIONE. Test `web_locale_compare_of_keys_is_bytewise` na 3136 parach z weba = `str::cmp`. Argument: alfabet kluczy to `[-0-9,]`, a `,` i `-` nigdy nie występują na tej samej pozycji pierwszej różnicy.
   - `stable_sort_by`: PRZYJMUJĘ, że była rozbieżność, i NAPRAWIONE dla n < 64 (`ca48f76a3`: wektor `resolveWorkedTiles` z NaN dawał `["-1,2"]` zamiast webowego `["1,-2"]`; po `v8_sort_by` PASS). Otwarte dla n >= 64 (BLOKADA 2).
   - `yieldOfMapHex`: PRZYJMUJĘ jako otwarte ograniczenie (BLOKADA 4); ZAŁOŻENIE o wstrzykiwaniu dowiedzione dla konsumentów wektorami.
8. Brak niezależnego weryfikatora i dowodu uruchomienia pinu. PRZYJMUJĘ dowód uruchomienia pinu (generator z `git archive 91dc998a`, loader B2, bez builda `gra/`). ODRZUCAM wymóg, by weryfikatorem był Operator: rolę niezależnego weryfikatora pełni Evaluator (BLOKADA 6).

---

## TABELA SYMBOLI (§11 `8G-P1` 30 sym., `8G-P2` 6 sym.; status per symbol)

Legenda: PORT = jest w Rust; WEKTOR = wektor z weba PASS; TEST = tylko test ręczny; BRAK = nie portowane; REUŻYTY = istniejący symbol bez zmian.

| TS (okolica.ts:linia) | Rust | Status |
|---|---|---|
| OKOLICA_RADIUS (34) | brak (stała martwa w webie: 0 użyć w `gra/src`) | BRAK-NIEUŻYWANE |
| CITY_RANGE_MIN (37) | `terrain::city_range_for_population` (wewnętrznie) | REUŻYTY, WEKTOR (cityRange) |
| CITY_RANGE_CAP (40) | `terrain::city_range_for_population` (wewnętrznie) | REUŻYTY, WEKTOR (cityRange) |
| cityRangeForPopulation (46) | `terrain::city_range_for_population` | REUŻYTY, WEKTOR PASS (22) |
| citySightRadius (56) | `territory::city_sight_radius` | REUŻYTY (poza zakresem okolicy) |
| hexKeysWithinRadius (66) | `improvement_build::hex_keys_within_radius` + `hex_disk_offsets` | PORT, DEDUP (B5), WEKTOR PASS (72 + 12 krawędzi) |
| isLandWorkableHex (89) | `okolica::is_land_workable_hex` | PORT, WEKTOR PASS (przez okolicaTiles pred) |
| cityCenterKeysFromTerritoryNodes (110) | `okolica::city_center_keys_from_nodes` | PORT, TEST (`other_city_centre_and_exclude_are_removed`), BRAK wektora |
| terrainAndTerritoryFilter (128) | `okolica::terrain_and_territory_filter` | PORT, TEST, BRAK wektora |
| TileYield (148) | `okolica::OkolicaYield` | PORT (typ) |
| OkolicaTile (149) | `okolica::OkolicaTile` | PORT (typ) |
| okolicaTiles (152) | `okolica::okolica_tiles` | PORT, WEKTOR PASS (144) |
| tileScore (176) | `okolica::tile_score` | PORT, WEKTOR PASS (500) |
| tileAssignScore (184) | `okolica::tile_assign_score` | PORT, WEKTOR PASS (2000) |
| AssignOptions (192) | `okolica::AssignOptions` | PORT (typ) |
| ScoredOkolicaTile (211) | `okolica::ScoredTile` (prywatny) | PORT (typ) |
| compareScoredOkolicaTiles (218) | `okolica::compare_scored` | PORT, WEKTOR PASS (przez auto NaN), MUTACJE M1/M2/M4 (r2) |
| scoreOkolicaTile (230) | `okolica/auto.rs` (wewnątrz `assign_worked_tiles`) | PORT, WEKTOR PASS (przez auto) |
| foodPotentialOfMapHex (250) | `okolica::food_potential_of_map_hex` | PORT, WEKTOR pośredni (auto focus zywnosc) |
| assignOptionsForFocus (257) | `okolica/auto.rs::with_focus_potential` | PORT, WEKTOR pośredni |
| effectiveIsWorkable (270) | `okolica::effective_is_workable` | PORT, WEKTOR pośredni (auto), BRAK wektora z terytorium |
| assignWorkedTiles (294) | `okolica/auto.rs::assign_worked_tiles` | PORT, WEKTOR pośredni, MV1/MV2 (r3) |
| wagiForFocus (311) | `okolica::wagi_for_focus` | PORT, WEKTOR PASS (5) |
| ResolveWorkedTilesOpts (325) | `okolica::ResolveWorkedTilesOpts` | PORT (typ) |
| resolveWorkedTiles (338) | `okolica/auto.rs::resolve_worked_tiles` | PORT; tryb auto WEKTOR PASS (320); tryb ręczny TEST, BRAK wektora |
| yieldOfMapHex (382) | brak (wstrzykiwane `yield_of`) | BRAK, ZAŁOŻENIE (BLOKADA 4) |
| seedReczneFromAuto (398) | `okolica/auto.rs::seed_reczne_from_auto` | PORT, WEKTOR pośredni (rebalans z pustym reczne, 354) |
| countAssignedWorkers (422) | `okolica::Reczne::count_assigned` | PORT |
| pickDeterministicIndex (427) | `okolica::pick_deterministic_index` | PORT, WEKTOR pośredni (rebalans grow) |
| rebalanceWorkersAfterPopulationChange (437) | `okolica/manual.rs::rebalance_workers_after_population_change` | PORT, WEKTOR PASS (354); HAK NIE WPIĘTY (BLOKADA 1) |
| adjustTileWorker (549) | `okolica/manual.rs::adjust_tile_worker` | PORT, TEST (`adjust_is_directional_not_toggle`), BRAK wektora (BLOKADA 3) |
| surroundingWorkerCap (616) | `okolica/manual.rs::surrounding_worker_cap` | PORT, WEKTOR PASS (22) + M3 zabita |
| toggleTileWorker (628) | `okolica/manual.rs::toggle_tile_worker` | PORT, TEST (`toggle_reasons_and_limit`), BRAK wektora (BLOKADA 3) |
| collectWorkedHexKeysForOwner (694) | `okolica/sasiedztwo.rs::collect_worked_hex_keys_for_owner` | PORT, BRAK testu i wektora (BLOKADA 3) |
| collectWorkedHexOwnerMap (721) | `okolica/sasiedztwo.rs::collect_worked_hex_owner_map` | PORT, BRAK testu i wektora (BLOKADA 3) |
| computeLostToNearerSiblingByCity (767) | `okolica/sasiedztwo.rs::compute_lost_to_nearer_sibling_by_city` | PORT, TEST (`lost_to_nearer_sibling_tie_and_closer`, `lost_map_empty_for_other_owners`), BRAK wektora (BLOKADA 3) |

Uwaga: wiersze `collectWorked*` mają status BRAK testu; w r3 nie dodano dla nich testów, bo zabrakło miejsca na dysku i czasu na pełny cykl. To jawnie otwarte.

## KOMENDA ODTWORZENIA WEKTORÓW (pin 91dc998a)

```
git archive --format=tar -o <MKTEMP>/web.tar 91dc998a gra/src gra/data && tar -xf <MKTEMP>/web.tar -C <MKTEMP>
cd dyspozycje/autobot/runs/R-RUSTPORT-P6-8G-OKOLICA-Q1
node --experimental-transform-types --no-warnings --import ../R-RUSTPORT-REPIN-EKONOMIA-B2-Q1/repin-b-loader-register.mjs \
     ./gen-p6-8g-okolica-vectors.mjs <MKTEMP> <OUT>
cp <OUT>/okolica.json rust-port/engine/tests/p6_8g_vectors/okolica.json   # plik commitowany: ca48f76a3
rm -rf <MKTEMP>
```
Wynik: `{"cityRange":22,"surroundingCap":22,"score":500,"assignScore":2000,"wagiFocus":5,"keys":72,"tiles":144,"edge":12,"locale":3136,"auto":320,"rebalance":354}`.
