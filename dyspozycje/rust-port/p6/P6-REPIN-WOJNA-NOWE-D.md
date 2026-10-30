# P6 REPIN WOJNA-NOWE-D: `gra/src/game/warAllInCapital.ts` -> Rust

Temat: R-RUSTPORT-REPIN-WOJNA-NOWE-D-Q1 (runda 2/5, partia 1; runda 2 = poprawka po FAIL weryfikatora z rundy 1).
Pin web: `dc8a3adc` (`gra/src/game/warAllInCapital.ts`, 859 linii, `gra/data/war-allin-params.json`).
Baza portu: `origin/rust-port/parity-v2` = `a83ae51d6` (gate 1666/0 przed zmianą).
Cel modulu Rust: `rust-port/engine/src/domain/war_all_in_capital*.rs`.

## Tabela symboli

Legenda statusu: PORTED = port 1:1 z testami; PORTED-CZESCIOWO = port bez galezi W1/W2;
NASTEPNA-PARTIA = nie portowane w tej rundzie (przyczyna w kolumnie Uwagi).

| Symbol (web) | Linie weba (dc8a3adc) | Klasa | Status | Miejsce w Rust | Uwagi |
|---|---|---|---|---|---|
| `WAR_ALLIN_CAPITAL_ENABLED` | 37 | stala flagi | PORTED | `war_all_in_capital.rs` (`WAR_ALLIN_CAPITAL_ENABLED`) | wartość `true` jak w webie |
| `overrideValue` / `setWarAllInCapitalOverride` | 39-44 | override testowy | PORTED | `set_war_all_in_capital_override` | stan w `AtomicI8` (-1 = null) |
| `isWarAllInCapitalEnabled` | 46-48 | funkcja | PORTED | `is_war_all_in_capital_enabled` | test `flag_default_and_override` |
| `WarCapitalTarget` | 51-56 | typ | PORTED | `WarCapitalTarget` | `ownerId/cityId/q/r` |
| `WarAllInContext` | 59-72 | typ kontekstu | NASTEPNA-PARTIA | - | zalezny od `main.ts`/`ai.ts`/`barbarians.ts` i pól W1/W2 |
| `WarTargetRouteAvailability` | 74-77 | typ | PORTED | `WarTargetRouteAvailability` | |
| `RoutedWarTargetCandidate` | 79-82 | interfejs | PORTED | trait `RoutedWarTargetCandidate` | |
| `preferSeaReachableWarTargets` | 85-90 | funkcja | PORTED | `prefer_sea_reachable_war_targets` | test `prefer_sea_targets_then_land_fallback` |
| `classifyWarTargetRoutes` | 98-198 | funkcja | PORTED | `classify_war_target_routes` | klucz stanu `(q, r, usedSea)` zamiast napisu |
| `WarAllInNav` | 208-221 | typ | PORTED | `war_all_in_capital_nav::WarAllInNav` | `occupied: Option<&HashSet>` |
| `navMoveCost` | 223-226 | funkcja | PORTED | `war_all_in_capital_nav::nav_move_cost` | test `nav_move_cost_land_and_sea_gate` |
| `distanceField` | 228-304 | funkcja (Dijkstra) | PORTED | `war_all_in_capital_nav::distance_field` + `war_all_in_capital_nav::JsHeap` | kopiec 1:1 z JS (zamiany przy push/pop) |
| `WarAllInUnit` | 306-315 | typ | PORTED | `WarAllInUnit` | `ruch_left: Option<f64>` (`ruchLeft`) |
| `WarAllInOrder` | 317-328 | typ | PORTED | `WarAllInOrder`, `WarAllInMode::Engage` | tryb `engage` (W1) od rundy 3 |
| `WarAllInPlanOpts` | 334-343 | typ | PORTED | `WarAllInPlanOpts` | pola `enemy_armies`, `engage_radius`, `enemy_strength` (runda 3) |
| `WarAllInPlan` | 345-358 | typ | PORTED | `WarAllInPlan` | `groupsByTarget` jako `BTreeMap` |
| `WAR_ALLIN_LINK_RADIUS` / `MERGE_RADIUS` / `NO_MERGE_NEAR_CAPITAL` | 361-369 | stale z JSON | PORTED | `war_allin_params()` | JSON: `rust-port/engine/data/derived/war-allin-params.json`, loader `data::derived::WAR_ALLIN_PARAMS_JSON` (patrz ZALOZENIA 2) |
| `Cluster` | 371-381 | typ wewn. | PORTED | `war_all_in_capital_plan::Cluster` | pole `engage` (runda 3) |
| `Goal` | 384-391 | typ wewn. | PORTED | `war_all_in_capital_nav::Goal` | `field: Rc<Field>` |
| `cmpTarget` | 393-395 | funkcja | PORTED | `cmp_target` | |
| `nearestTarget` | 397-412 | funkcja | PORTED | `nearest_target` | |
| `StepResult` | 414-417 | typ | PORTED | `war_all_in_capital_nav::StepResult` | |
| `StepState` | 419-423 | typ | PORTED | `war_all_in_capital_nav::StepState` | |
| `isFreeFor` | 430-435 | funkcja | PORTED | `war_all_in_capital_nav::is_free_for` | |
| `extendWalk` | 446-485 | funkcja | PORTED | `war_all_in_capital_nav::extend_walk` | guard web `!(budget > 1)` (linia 459) -> Rust `budget.is_nan() \|\| budget <= 1.0` (nav.rs:243) |
| `chooseStep` | 487-533 | funkcja | PORTED | `war_all_in_capital_nav::choose_step` | |
| `plannerRouteUsesSea` | 541-585 | funkcja | PORTED | `war_all_in_capital_nav::planner_route_uses_sea` | |
| `planWarAllInCapital` | 593-859 | funkcja (planer) | PORTED | `war_all_in_capital_plan::plan_war_all_in_capital` | etapy 1, 2, 2a, 2b, 3, 4 (W1/W2 od rundy 3); bez wiringu `WarAllInContext` |
| `engageGoal` | 610-617 | funkcja | PORTED | `Planner::engage_goal` | W1 (runda 3) |
| etap 2a (`allocateGroupsToEnemies`) | 692-711 | galaz W2 | PORTED | `war_all_in_capital_plan` (etap 2a) + `war_rules_multiwar::allocate_groups_to_enemies` | runda 3 |
| etap 2b (`pickEngagementArmy`) | 717-727 | galaz W1 | PORTED | `war_all_in_capital_plan` (etap 2b) + `war_rules_multiwar::pick_engagement_army` | runda 3 |
| filtr zapasowych celow W2 | 808-811 | galaz W2 | PORTED | `Planner::resolve` (filtr `w2`) | runda 3 |
| `war-rules-multiwar.ts` (`pickEngagementArmy`, `allocateGroupsToEnemies`) | `:168`, `:207` | zaleznosc | PORTED-CZESCIOWO | `rust-port/engine/src/domain/war_rules_multiwar.rs` (NOWY) | tylko 2 funkcje z W1/W2; bramki R1-R3, flagi, `WAR_RULES_PARAMS` z `war-rules-params.json` NIE portowane |

## ZALOZENIA (luki rozstrzygniete zalozeniem)

1. Zakres partii 1 (runda 2): W1/W2 nie byly portowane. Runda 3 port W1/W2 z
   minimalnym zakresem `war-rules-multiwar.ts` (tylko `pickEngagementArmy`,
   `allocateGroupsToEnemies`; bramki R1-R3, flagi i `war-rules-params.json` poza zakresem).
   Promien W1 (`engageRadius`) podawany jawnie przez wolajacego (web: `opts.engageRadius ?? 0`).
   Sily W2 (`strength`) traktowane jako liczby calkowite (`i64`); web-wektory generowane z
   calkowitych sil (`{0,1,2,5,10}`), wiec ta zamiana nie zmienia wyniku dla danych z gry.
   Wektory bazowe (`web-dc8a3adc.json`) nie maja trybu `engage`; wektory W1/W2 w
   `web-dc8a3adc-w12.json` (runda 3, `engageOrders` = 175, 148 scenariuszy W2).
2. Parametry JSON (runda 2, zarzut 5 PRZYJETY): kopia 1:1 `war-allin-params.json` lezy w
   `rust-port/engine/data/derived/war-allin-params.json` (commit `e4b387a2e`). Ladowana przez
   addytywna stala `data::derived::WAR_ALLIN_PARAMS_JSON` (`src/data/derived.rs`, wzorzec
   `RUCH_JEDNOSTEK_PARAMS_JSON`). Plik NIE trafia do top-level `data/`, bo tam obowiazuja
   niezmienniki `tests/data_loader.rs` (DATA_FILES == 29) i `tests/data_compliance.rs`
   (liczba *.json == 29). `src/data/mod.rs` bez zmian (`pub mod derived` juz istnieje).
3. Klucz heksu: `Klucz (q, r)` zamiast napisu `"q,r"` (`keyOf`); porzadek id = `Ord` na
   `String` (ASCII, zgodne z `<` na UTF-16 dla tych danych).
4. Sasiedztwo: `teren.sasiedzi` z `ruch-jednostek-params.json` (kolejnosc = `HEX_NEIGHBORS`,
   `setup.ts:623`).

## Testy i bramki (runda 2)

- `cargo fmt --all -- --check`: EXIT=0 (`evidence/r4-fmt.log`).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`evidence/r4-clippy.log`).
- `cargo test --no-fail-fast` (w `rust-port/engine`): EXIT=0, 1690 passed / 0 failed
  (`evidence/r4-cargo-test.log`; baseline 1666/0 + 23 testow `p6_repin_wojna_d_nav` + 1 test
  `p6_repin_wojna_d_vectors`).
- `tests/p6_repin_wojna_d_nav.rs`: 23 testy (rownoleglosc, grupy link N-1/N/N+1, scalanie
  merge N/N+1, no-merge N/N+1, extend_walk NaN / budzet 1.0 (N) / 1.0+1e-9 (N+1), wyspa bez morza,
  klasyfikacja tras, preferencja morska, tie-break celu, `params_match_web_json`).
- `tests/p6_repin_wojna_d_vectors.rs`: 300 scenariuszy z uruchomionego weba `dc8a3adc`
  (`tests/p6_repin_wojna_d_vectors/web-dc8a3adc.json`); porownanie rozkazow, `noPath`, `held`,
  `groupsByTarget`.

## NIE_ZMIERZONO / NASTEPNA-PARTIA w partii 1

- W1/W2 (`engageGoal`, `allocateGroupsToEnemies`, `pickEngagementArmy`, filtr zapasowych
  celow W2) oraz tryb `engage`: NASTEPNA-PARTIA (zaleznosc od `war-rules-multiwar.ts`).
  Wektory nie pokrywaja tych galezi.
- Podpiecie w `ai.ts` / `barbarians.ts` / `main.ts` (WarAllInContext): NASTEPNA-PARTIA.
- Mutacje galezi W1/W2: nie dotyczy (galezi nie ma w Rust).

## Runda 3 (zakres: W1/W2 + tryb `engage`)

- Kod: `war_rules_multiwar.rs` (NOWY), `war_all_in_capital.rs` (`WarAllInMode::Engage`, pola opts),
  `war_all_in_capital_plan.rs` (`engage_goal`, etapy 2a/2b, filtr W2, pominiecie scalania przy `engage`).
- Wektory: `tests/p6_repin_wojna_d_vectors/web-dc8a3adc-w12.json` z `evidence/gen-vectors-w12.js`
  (zywy `planWarAllInCapital` z `gra/` @ dc8a3adc, `enemyArmies`/`engageRadius`/`enemyStrength`).
  Statystyki: 300 scenariuszy, 280 z rozkazami, `engage` 175, `rendezvous` 74, wielokrokowe 820,
  W1 213 scenariuszy, W2 148 scenariuszy.
- Testy: `tests/p6_repin_wojna_d_engage.rs` (7 testow: promien N/N+1, remisy q/r/owner,
  alokacja min-1, deficyt, pusta lista).
- Mutacje galezi (kazda: jedna zmiana, przywrocenie z kopii, `cmp` OK): M6 `engage` nie zatrzymuje
  (plan.rs), M7 filtr puli armii W2 (plan.rs), M8 filtr zapasowych celow W2 (plan.rs), M9 scalanie
  z grupa `engage` (follower), M15 scalanie z grupa `engage` (glowa), M10 tie-break ownerId
  (multiwar), M11 alokacja min-1 `>` zamiast `>=`, M12 deficyt `>=`, M13 filtr wlascicieli W2,
  M14 promien `>=` zamiast `>`: wszystkie ZABITE. Logi: `evidence/r3-mut*.log` (surowe wyniki w
  kolumnie wyniku w raporcie 04-operator-r3.md).
- NIE_ZMIERZONO: `WarAllInContext` (ai.ts / barbarians.ts / main.ts) nie podpiety; bramki R1-R3 i flagi
  `war-rules-multiwar.ts` nie portowane.

## NASTEPNA-PARTIA

1. Podpiecie `WarAllInContext` (ai.ts / barbarians.ts / main.ts) -- wejscia `enemyArmies`,
   `enemyStrength` podawane jawnie (jak `city_yield_head`).
2. Opcjonalnie: port bramek wojen z `war-rules-multiwar.ts` (R1-R3) jesli temat tego wymaga.

## Pomiary niezaleznego weryfikatora (runda 2, Operator-poprawka)

Kod: `rust-port/engine` na commicie `3bca9774e` (lancuch: `e4815251f` -> `e4b387a2e` -> `3bca9774e`).
Logi: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-NOWE-D-Q1/evidence/r4-*.log`.

- Bramki: fmt EXIT=0; clippy `-D warnings` EXIT=0; `cargo test --no-fail-fast` EXIT=0, 1690 passed / 0 failed.
- JSON: `data/derived/war-allin-params.json` == `dc8a3adc:gra/data/war-allin-params.json` (rename 100%, `git diff` pusty).
- Wektory z uruchomionego weba (zarzut 4, PRZYJETY): `evidence/gen-vectors.js` uruchomiony na
  drzewie `git archive dc8a3adc gra/src gra/data` w katalogu tymczasowym (`tsc` -> CommonJS,
  wywolanie zywego `planWarAllInCapital`, `setup.configureTerrainMovement` z `terrain-movement.json`).
  Regeneracja 300 ziaren: JSON BYTE-IDENTYCZNY z `tests/p6_repin_wojna_d_vectors/web-dc8a3adc.json`
  (sha256 `c3527f45314645be0229f16ba7370875085b88f0086b54581646330c53e6d93e`). Statystyki:
  278 scenariuszy z rozkazami, 110 rozkazow rendezvous, 0 engage, 826 rozkazow wielokrokowych.
  Test `web_vectors_match_rust_plan` PASS.
- Mutacje galezi sterujacych (kazda: jedna zmiana, `cargo test --test p6_repin_wojna_d_nav --test p6_repin_wojna_d_vectors`, przywrocenie przez odtworzenie pliku z `HEAD`):
  - M1 `war_all_in_capital_nav.rs:243` usuniecie `budget.is_nan() ||` (odpowiednik web :459): ZABITA (`extend_walk_nan_budget_stops_at_first_hex`, 22 pass / 1 fail; `r4-mut1-nan-guard.log`).
  - M2 `war_all_in_capital_nav.rs:243` `budget <= 1.0` -> `budget < 1.0` (granica N): ZABITA (`extend_walk_budget_exactly_1_stops_at_first_hex`; `r4-mut2-budget-boundary.log`).
  - M3 `war_all_in_capital_plan.rs:262` link `<=` -> `<` (web :644): ZABITA (`units_within_link_radius_form_one_group`; `r4-mut3-link-radius.log`).
  - M4 `war_all_in_capital_plan.rs:355` merge `d <=` -> `d <` (web :755): ZABITA (`merge_radius_n_joins_rendezvous`; `r4-mut4-merge-radius.log`).
  - M5 `war_all_in_capital_plan.rs:343` no-merge `<=` -> `<` (web :748): ZABITA (`no_merge_near_capital_n_marches_to_capital`; `r4-mut5-no-merge-near-capital.log`).
- Progi N-1/N/N+1 (zarzut 3, PRZYJETY): link_radius (N-1 `link_radius_n_minus_1_groups_together`,
  N `units_within_link_radius_form_one_group`, N+1 `units_beyond_link_radius_form_two_groups`);
  merge_radius (N `merge_radius_n_joins_rendezvous`, N+1 `merge_radius_n_plus_1_marches_to_capital`);
  no_merge_near_capital (N `no_merge_near_capital_n_marches_to_capital`, N+1 `no_merge_near_capital_n_plus_1_may_join`).
- extend_walk (zarzut 1-2, PRZYJETY): NaN, budzet 1.0 (N), budzet 1.0+1e-9 (N+1) -- testy PASS na kodzie, FAIL po mutacji M1/M2.
- Uwaga korekcyjna: w rundzie 1 guard web byl cytowany jako `warAllInCapital.ts:458`; wlasciwa linia to 459 (`grep -n` na `dc8a3adc`).

## Weryfikacja niezalezna (runda 3, Operator-pomiary)

- Regeneracja `web-dc8a3adc-w12.json` z `dc8a3adc` (git archive do katalogu tymczasowego, tsc, `gen-vectors-w12.js`): plik BAJT-W-BAJT identyczny z commitowanym; liczby 300 / engage 175 / rendezvous 74 / W1 213 / W2 148 / wielokrokowe 820 zgodne z raportem.
- Gate w worktree na `acee10eec`: `cargo fmt --all -- --check` EXIT=0; `cargo clippy --all-targets -- -D warnings` EXIT=0; `cargo test --no-fail-fast` EXIT=0, 1725 passed / 0 failed. Logi: `evidence/r3v-*.log`.
- Mutacje niezalezne od Operatora (wszystkie ZABITE, pliki przywrocone `cmp`): A tie-break owner w `pick_engagement_army` (test jednostkowy), B min-1 `>=` -> `>` w `allocate_groups_to_enemies` (wektory), D tie-break merge `<` -> `<=` w planerze (wektory).
