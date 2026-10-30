# P6-REPIN-WOJNA-NOWE-C - port nowych modulow AI/dyplomacji z weba (pin 91dc998a), czesc C

**Temat:** `R-RUSTPORT-REPIN-WOJNA-NOWE-C-Q1` · **Runda:** 1/5 · **Rola:** Operator-impl
**Pin webu:** `91dc998a5f1b51ad29e0f4785edfd45655445c53` · **Pin dotychczasowy:** `edb8fb56` (manifesty bez zmiany pinu).
**Baza:** `rust-port/parity-v2` @ `80e233c3` (czesci A i B zintegrowane). Silnik przed zmiana: 1313/0; po zmianie: 1347/0 (+12 move range, +22 war brake).
**Zakres:** `gra/src/game/ai-move-range.ts` (+112) i `gra/src/game/diplomacy-tick-war-brake.ts` (+216) z `git diff edb8fb56 91dc998a`
(oba pliki NOWE w webie, wiec kazda funkcja jest zmiana behawioralna). Komentarze naglowkowe sa tylko cytatami.
**Wektory:** `gra/src/game/` zaleznosci (`units/setup.ts`, `types/hex.ts`, `data/diplomacy-tick-params.json`) z `git archive 91dc998a`, uruchomione przez loader TS (Node 22).

## Pliki

- `rust-port/engine/src/domain/ai_move_range.rs` (NOWY), `rust-port/engine/src/domain/diplomacy_tick_war_brake.rs` (NOWY), `rust-port/engine/src/domain/mod.rs` (dopisek `pub mod`).
- `rust-port/engine/data/derived/diplomacy-tick-params.json` (NOWY; kopia `gra/data/diplomacy-tick-params.json`, sha256 `a74c90e5...f4eb`).
- `rust-port/engine/tests/p6_repin_wojna_c_move_range.rs`, `rust-port/engine/tests/p6_repin_wojna_c_war_brake.rs` (NOWE).
- `rust-port/engine/tests/p6_repin_wojna_c_vectors/ai-move-range.json` (1,38 MB), `.../diplomacy-tick-war-brake.json` (1,56 MB).
- Generator, mutacje i logi: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-NOWE-C-Q1/` (`gen-repin-wojna-c-web-vectors.mjs`, `mutate-c.py`, `mut-c-*.log`, `test-c-r1.log`, `clippy-c-r1.log`, `fmt-c-r1.log`).

## ZALOZENIA (adaptacja, logika bez zmian)

- Z1: `GameMap.hexes` + `costFn` -> `hex_costs: HashMap<(i64,i64), f64>` (obecnosc klucza = `key in map.hexes`, wartosc = `costFn(hex)`). `terrainMoveCost` nie jest portowane (wejscie wolajacego).
- Z2: `blockedKeys` -> `Option<&HashSet<(i64,i64)>>`; `buildHexOccupancy` / `claimHexForMove` generyczne po kluczu `K` (web: string z `keyFn`).
- Z3: stan globalny `flagOverride` nie istnieje w Rust: `is_diplo_tick_war_brake_enabled(flag_override: Option<bool>)`.
- Z4: liczby `number` = `f64`; `Math.max/min/pow` zapisane jako `js_max`, `js_min`, `js_pow` (NaN-propagacja, `pow(1, ±Inf)` = NaN, `max(+0,-0)`, `min(+0,-0)`).
- Z5: tabela `wymianaKrokPktPerEpoka` = `BTreeMap<i64, f64>`; klucze JSON to calkowite epoki (plik danych), niecalkowite odfiltrowuje web przez `Number.isFinite`, wejscie Rust przyjmuje juz przefiltrowane.
- Z6: identyfikatory wlascicieli = `i64`; klucz pary = `"lo-hi"`.
- Z7: `parseCrisisCounters(unknown)` -> `&serde_json::Value`, wynik `Vec<(String, f64)>` w kolejnosci wejscia; wektory nie zawieraja kluczy niecalkowitych (kolejnosc `Object.entries` dla kluczy typu indeks nie jest testowana).
- Z8: remis w `pickWarDeclarer` = nizszy ownerId (jak w webie; `power !== power` dla NaN -> strona b).

## Tabela zmian: web -> Rust -> test -> status

| # | Zmiana (web) | plik:linia weba | plik:linia Rust | Test / wektor | Status |
|---|---|---|---|---|---|
| 1 | `MoveCostFn` (typ) | ai-move-range.ts:15 | ai_move_range.rs:19 (`Hex`, koszt jako `hex_costs`, Z1) | `truncate_path_*` | PORTOWANE (Z1) |
| 2 | `truncatePathWithinBudget` | ai-move-range.ts:24-58 | ai_move_range.rs:24 | `truncate_path_matches_web_custom_costs`, `truncate_path_matches_web_default_terrain_costs`, `budget_nan_or_zero_or_negative_returns_empty`, `min_move_first_step_enters_even_if_over_budget`, `missing_key_or_infinity_stops_prefix`, `nan_cost_is_not_a_stop` (vec `truncateCases` 900, `defaultCostCases` 500) | PORTOWANE |
| 3 | `farthestStepWithinBudget` | ai-move-range.ts:61-75 | ai_move_range.rs:65 | `farthest_step_matches_web_with_blocked_keys`, `farthest_step_matches_web_default_terrain_costs`, `farthest_target_blocked_steps_back_one` (vec `farthestCases` 900, `farthestDefaultCases` 300) | PORTOWANE |
| 4 | `buildHexOccupancy` | ai-move-range.ts:83-93 | ai_move_range.rs:91 | `occupancy_matches_web` (vec `occupancyCases` 400) | PORTOWANE |
| 5 | `claimHexForMove` | ai-move-range.ts:101-112 | ai_move_range.rs:105 | `claim_sequences_match_web` (vec `claimCases` 700), `claim_rejects_occupied_target_and_moves_counter` | PORTOWANE |
| 6 | Flaga `DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT = true` | diplomacy-tick-war-brake.ts:7 | diplomacy_tick_war_brake.rs:29 | `default_and_flag_match_web` | PORTOWANE |
| 7 | `setDiploTickWarBrakeOverride` / `isDiploTickWarBrakeEnabled` | diplomacy-tick-war-brake.ts:12-18 | diplomacy_tick_war_brake.rs:32 (override jako argument, Z3) | `default_and_flag_match_web` (3 przypadki), `flag_override_wins_over_default` | PORTOWANE (Z3) |
| 8 | `WarBrakeP6Params` / `CrisisStep` (typy) | diplomacy-tick-war-brake.ts:20, :92 | diplomacy_tick_war_brake.rs:38, :49 | posrednio (wszystkie testy P6) | PORTOWANE |
| 9 | `advanceCrisisCounter` | diplomacy-tick-war-brake.ts:106-118 | diplomacy_tick_war_brake.rs:59 | `advance_crisis_counter_matches_web` (900), `crisis_counter_hysteresis_and_thresholds`, `crisis_counter_sanitizes_previous_value` | PORTOWANE |
| 10 | `crisisStepForPair` (r3, para w wojnie) | diplomacy-tick-war-brake.ts:176-185 | diplomacy_tick_war_brake.rs:86 | `crisis_step_for_pair_matches_web` (500), `crisis_step_at_war_resets_counter` | PORTOWANE |
| 11 | `crisisPairKey` | diplomacy-tick-war-brake.ts:121-124 | diplomacy_tick_war_brake.rs:103 | `crisis_pair_key_matches_web` (200) | PORTOWANE |
| 12 | `krokPktWymiany` (P7) | diplomacy-tick-war-brake.ts:56-78 | diplomacy_tick_war_brake.rs:180 | `krok_pkt_wymiany_matches_web` (700), `krok_edge_cases_explicit` (luka, pusta tabela, NaN, pow(1,Inf)) | PORTOWANE |
| 13 | `tradeTrustBonusPerTura` (P7) | diplomacy-tick-war-brake.ts:81-90 | diplomacy_tick_war_brake.rs:210 | `trade_trust_bonus_matches_web` (1000), `trade_bonus_stepwise_and_capped` | PORTOWANE |
| 14 | `parseCrisisCounters` | diplomacy-tick-war-brake.ts:131-138 | diplomacy_tick_war_brake.rs:229 | `parse_crisis_counters_matches_web` (500), `parse_crisis_counters_drops_garbage` | PORTOWANE (Z7) |
| 15 | `sortCrisisQueue` | diplomacy-tick-war-brake.ts:150-161 | diplomacy_tick_war_brake.rs:253 | `sort_crisis_queue_matches_web` (500), `sort_queue_ties_use_owner_ids` | PORTOWANE |
| 16 | `pickWarDeclarer` | diplomacy-tick-war-brake.ts:164-172 | diplomacy_tick_war_brake.rs:286 | `pick_war_declarer_matches_web` (400), `declarer_dobra_and_pairs_explicit_edges` | PORTOWANE (Z8) |
| 17 | `dobraWolaTurnStep` (P4 r3) | diplomacy-tick-war-brake.ts:191-194 | diplomacy_tick_war_brake.rs:305 | `dobra_wola_turn_step_matches_web` (12), `declarer_dobra_and_pairs_explicit_edges` | PORTOWANE |
| 18 | `AiAiOwnerInfo` / `isAiAiEligibleOwner` (P3 r3) | diplomacy-tick-war-brake.ts:196-208 | diplomacy_tick_war_brake.rs:320, :329 | `ai_ai_eligibility_matches_web` (300) | PORTOWANE |
| 19 | `aiAiPairs` (P3 r3) | diplomacy-tick-war-brake.ts:210-216 | diplomacy_tick_war_brake.rs:334 | `ai_ai_pairs_match_web` (200) | PORTOWANE |
| 20 | Dane `gra/data/diplomacy-tick-params.json` (sekcje p6, p7) | (plik danych, nie w module) | data/derived/diplomacy-tick-params.json | `derived_params_file_matches_pinned_web_values` | PORTOWANE (kopia) |

## Mutacje galezi sterujacych (r1)

Skrypt `mutate-c.py`, po jednej mutacji na galaz; kazda uruchamia `p6_repin_wojna_c_move_range` + `p6_repin_wojna_c_war_brake`.

- Zabite (KILLED): R01-R12 (zakres zasiegu ruchu i zajetosci), D01-D18 (flaga, histereza, P7, kolejka, wlasciciele, dobra wola, pary). Lacznie 30 zabitych.
- R13 `claim-target-reset` (`insert(to, t+1)` -> `insert(to, 1)`): **SURVIVED = mutant rownowazny.** Dowod: wejscie w ten krok wymaga `occ[to] == 0` (lub brak); usuniecie zrodla nie zmienia `to` (gdy `from == to`, `occ[from] == 0`, wiec nic nie usuwa), wiec `t == 0` zawsze i `t + 1 == 1`.
- Równowazny (bez mutacji): w `krokPktWymiany` sprawdzenie `v > 0` przy kluczu rownym `e` zwraca `v` albo `table[lower]`, gdzie `lower = e` - ten sam wynik, wiec usuniecie `v > 0` nie zmienia zachowania.
- Zwykle asercje NIE osłabione; wszystkie testy webowe pozostaja bez zmian wzgledem wygenerowanych wektorow.

## Bramki (r1)

- `cargo fmt --all -- --check`: EXIT 0 (`fmt-c-r1.log`).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0 (`clippy-c-r1.log`).
- `cargo test --no-fail-fast`: 1347 passed / 0 failed (`test-c-r1.log`).

## NASTEPNA-PARTIA

Brak zmian behawioralnych bez odpowiednika w Rust w tym zakresie. Kolejna czesc (osobne ID): WOJNA-ZMIANY (`forced-war-*`, `armyMerge.ts`, `planned-march.ts`).

## Weryfikacja niezalezna (Operator-pomiary r1)

- Bramki odtworzone na `ded9a2fb`: fmt EXIT=0, clippy EXIT=0, test 1347 passed / 0 failed (logi `ver-*-c-r1.log`).
- Wektory `ai-move-range.json` i `diplomacy-tick-war-brake.json` zregenerowane z `git archive 91dc998a` i porównane bajt-w-bajt: identyczne.
- Mutacje: 8 z 31 powtorzonych niezaleznie (R01, R07, R09, R12, D05, D15, D16, D18), wszystkie zabite. R13 potwierdzona jako równoważna (`t == 0` na linii przypisania).
- Szczegoly: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-NOWE-C-Q1/02-operator-pomiary-r1.md`.
