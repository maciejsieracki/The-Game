# P6 REPIN WOJNA-NOWE-D: `gra/src/game/warAllInCapital.ts` -> Rust

Temat: R-RUSTPORT-REPIN-WOJNA-NOWE-D-Q1 (runda 1/5, partia 1).
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
| `WarAllInOrder` | 317-328 | typ | PORTED-CZESCIOWO | `WarAllInOrder` | tryb `engage` pominiety (W1) |
| `WarAllInPlanOpts` | 334-343 | typ | PORTED-CZESCIOWO | `WarAllInPlanOpts` | pola `enemyArmies`, `engageRadius`, `enemyStrength` pominiete (W1/W2) |
| `WarAllInPlan` | 345-358 | typ | PORTED | `WarAllInPlan` | `groupsByTarget` jako `BTreeMap` |
| `WAR_ALLIN_LINK_RADIUS` / `MERGE_RADIUS` / `NO_MERGE_NEAR_CAPITAL` | 361-369 | stale z JSON | PORTED | `war_allin_params()` | JSON: `src/domain/war_all_in_capital_params.json` (patrz ZALOZENIA) |
| `Cluster` | 371-381 | typ wewn. | PORTED-CZESCIOWO | `war_all_in_capital_plan::Cluster` | pole `engage` pominiete (W1) |
| `Goal` | 384-391 | typ wewn. | PORTED | `war_all_in_capital_nav::Goal` | `field: Rc<Field>` |
| `cmpTarget` | 393-395 | funkcja | PORTED | `cmp_target` | |
| `nearestTarget` | 397-412 | funkcja | PORTED | `nearest_target` | |
| `StepResult` | 414-417 | typ | PORTED | `war_all_in_capital_nav::StepResult` | |
| `StepState` | 419-423 | typ | PORTED | `war_all_in_capital_nav::StepState` | |
| `isFreeFor` | 430-435 | funkcja | PORTED | `war_all_in_capital_nav::is_free_for` | |
| `extendWalk` | 446-485 | funkcja | PORTED | `war_all_in_capital_nav::extend_walk` | `!(budget > 1)` -> `NaN` lub `<= 1` |
| `chooseStep` | 487-533 | funkcja | PORTED | `war_all_in_capital_nav::choose_step` | |
| `plannerRouteUsesSea` | 541-585 | funkcja | PORTED | `war_all_in_capital_nav::planner_route_uses_sea` | |
| `planWarAllInCapital` | 593-859 | funkcja (planer) | PORTED-CZESCIOWO | `war_all_in_capital_plan::plan_war_all_in_capital` | etapy 1, 2, 3, 4 (bez W1/W2) |
| `engageGoal` | 610-617 | funkcja | NASTEPNA-PARTIA | - | W1 |
| etap 2a (`allocateGroupsToEnemies`) | 692-711 | galaz W2 | NASTEPNA-PARTIA | - | zalezy od `war-rules-multiwar.ts` (brak portu) |
| etap 2b (`pickEngagementArmy`) | 717-727 | galaz W1 | NASTEPNA-PARTIA | - | zalezy od `war-rules-multiwar.ts` (brak portu) |
| filtr zapasowych celow W2 | 808-811 | galaz W2 | NASTEPNA-PARTIA | - | tylko przy `enemyStrength` |
| `war-rules-multiwar.ts` (`pickEngagementArmy`, `allocateGroupsToEnemies`) | poza modulem | zaleznosc | NASTEPNA-PARTIA | - | brak portu w `rust-port/engine` |

## ZALOZENIA (luki rozstrzygniete zalozeniem)

1. Zakres partii 1: W1/W2 nie sa portowane, poniewaz zaleza od niezportowanego
   `war-rules-multiwar.ts`. Kod Rust odpowiada galezi W1/W2 OFF (rowna sie dotychczasowemu
   zachowaniu przy braku pól `enemyArmies`/`enemyStrength`).
2. Parametry JSON: kopia 1:1 `war-allin-params.json` lezy w
   `rust-port/engine/src/domain/war_all_in_capital_params.json`, a nie w `rust-port/engine/data/`.
   Powod: katalog `data/` jest objety niezmiennikami `tests/data_loader.rs` (lista DATA_FILES)
   i `tests/data_compliance.rs` (liczba probe, pin `edb8fb56`); te testy sa poza allowlista
   tematu. Przeniesienie do `data/` i rejestracja w loaderze = osobna partia z rozszerzeniem
   allowlisty.
3. Klucz heksu: `Klucz (q, r)` zamiast napisu `"q,r"` (`keyOf`); porzadek id = `Ord` na
   `String` (ASCII, zgodne z `<` na UTF-16 dla tych danych).
4. Sasiedztwo: `teren.sasiedzi` z `ruch-jednostek-params.json` (kolejnosc = `HEX_NEIGHBORS`,
   `setup.ts:623`).

## Testy i bramki (partia 1)

- `cargo fmt --all -- --check`: czysty.
- `cargo clippy --all-targets -- -D warnings`: czysty.
- `cargo test --no-fail-fast` (w `rust-port/engine`): 1680 passed / 0 failed (baseline 1666/0,
  +14 testow `p6_repin_wojna_d_nav`).
- Testy `tests/p6_repin_wojna_d_nav.rs` sa wlasnorecznie wyliczone (rownoległosc, grupy
  link/merge, wyspa bez morza, klasyfikacja tras, preferencja morska, tie-break celu).

## NIE_ZMIERZONO w partii 1

- Wektory z URUCHOMIONEGO weba `dc8a3adc` (`git archive` + harness w `mktemp -d`): NIE
  WYKONANO. Przyczyna: wymaga osobnego harnessu TS (zaleznosci `setup.ts`,
  `war-rules-multiwar.ts`) i nie miesci sie w tej rundzie.
- Testy progow NaN / N-1 / N / N+1 dla `link_radius`, `merge_radius`, `no_merge_near_capital`:
  NASTEPNA-PARTIA.
- Mutacje na galeziach sterujacych i dowod rownowaznosci (plik:linia): NASTEPNA-PARTIA.
- Podpiecie w `ai.ts` / `barbarians.ts` / `main.ts` (WarAllInContext): NASTEPNA-PARTIA.

## NASTEPNA-PARTIA

1. Port `war-rules-multiwar.ts` (`pickEngagementArmy`, `allocateGroupsToEnemies`) i galezi
   W1/W2 w `war_all_in_capital_plan.rs`.
2. Wektory z weba `dc8a3adc` + testy progow i mutacje; zapis w `tests/p6_repin_wojna_d_*`.
3. Przeniesienie JSON do `rust-port/engine/data/` z rejestracja loadera (po rozszerzeniu
   allowlisty o `tests/data_loader.rs` i `tests/data_compliance.rs`).
