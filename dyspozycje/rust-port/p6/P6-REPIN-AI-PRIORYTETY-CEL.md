# P6-REPIN-AI-PRIORYTETY-CEL (R-RUSTPORT-REPIN-AI-PRIORYTETY-CEL-Q1, runda 1)

Pomiar: web `origin/main` (pin 14f2af1b0, FALA 551/553/558/559) vs Rust `origin/rust-port/parity-v2`
(baza d6414fcf1). Zakres: trzy zmiany AI wojny z webu. Źródła web: `gra/src/game/ai-war-home-defense.ts`,
`ai-war-target-select.ts`, `war-rules-multiwar.ts`, `cities.ts`, `warAllInCapital.ts`.

## Tabela: web -> Rust

| Element webu | Web (plik:linia) | Rust przed tematem | Status po tej rundzie |
|---|---|---|---|
| (a) FALA 551 `planHomeWar` (obrona domu P1/P2, histereza, stałe `HOME_WAR_*`) | ai-war-home-defense.ts:254, :40-63 (458 linii) | BRAK (brak `ai_war_home_defense`) | NIE ZROBIONE -- partia 4 (patrz sekcja Następne) |
| (a) `cityFounderId` | cities.ts:1120 | BRAK | PORTOWANE: `domain/war_city_founder.rs` `city_founder_id` |
| (a) `isCityLostOf` | cities.ts:1132 | BRAK | PORTOWANE: `domain/war_city_founder.rs` `is_city_lost_of` (`capturedFromOwnerId` jako parametr) |
| (a) pole `foundedBy` w modelu miasta | cities.ts (`foundedBy?: number`) | BRAK (jest tylko `founded_by_owner`) | DODANE addytywnie: `City::founded_by: Option<i64>` (state.rs), domyślnie `None` |
| (b) FALA 553 `isNearestCityWarPair` | ai-war-target-select.ts:39 | BRAK | PORTOWANE: `domain/war_target_select.rs` |
| (b) FALA 553 `buildWarCityTargets` | ai-war-target-select.ts:49 | BRAK | PORTOWANE: `build_war_city_targets` (zwraca `WarCityTarget`, z `defenders`) |
| (b) remis odległości `tieBeforeTarget` / `nearestTarget` | warAllInCapital.ts:411-420, :~425 | `cmp_target` bez `defenders` (war_all_in_capital.rs:191) | PORTOWANE jako `nearest_war_city_target` (osobny typ). Planer `plan_war_all_in_capital` NIEPODPIĘTY |
| (b) pole `defenders` w `WarCapitalTarget` | warAllInCapital.ts:61 | BRAK | NIE DODANE (patrz Odstępstwa) |
| (c) FALA 558 `isPlayerEligibleForEraWarPool` | war-rules-multiwar.ts:295 | BRAK | PORTOWANE: `domain/war_era_pool.rs` |
| (c) FALA 558 `isPlayerEraWarSlotFree` | war-rules-multiwar.ts:314 | BRAK | PORTOWANE: `domain/war_era_pool.rs` |
| `forcedEraTagEpoch` / `forcedEraTagForEpoch` / `eraWarCounterEpoch` | war-rules-multiwar.ts:255, :263, :272 | BRAK | PORTOWANE: `war_era_pool.rs` |
| `canCivJoinEraForcedWar`, `eraWarCountFor`, `evaluateEraForcedWarGate` | war-rules-multiwar.ts:185-200, :376 | JEST | bez zmian (`diplomacy_multiwar.rs`) |
| `isWarTreatyBlocked` | war-rules-multiwar.ts:405 | JEST | bez zmian (`diplomacy_multiwar_gate.rs`) |
| `eraForcedWarStartTurnsFromEra` bronze/iron = 20 | data/war-rules-params.json | JEST (stałe, diplomacy_multiwar_gate.rs:57-59) | używane przez `war_era_pool.rs` |
| `rebuildEraWarCountsFromActivePairs` / `restoreEraWarCounts` | war-rules-multiwar.ts:329, :352 | JEST | bez zmian |

## Wektory

- `rust-port/engine/tests/p6_repin_ai_war_vectors.json` -- wygenerowane z URUCHOMIONEGO weba (Node 22
  `stripTypeScriptTypes` na `war-rules-multiwar.ts` i `ai-war-target-select.ts` z `origin/main`; jedyny
  patch: import JSON `war-rules-params.json` zastąpiony literałem). Zawiera: 560 przypadków puli,
  84 przypadki slotu, tagi epok, `eraWarCounterEpoch`, 4 scenariusze celów (pary + cele).
- `tests/p6_repin_ai_war_vectors.rs` -- 4 testy, wszystkie zielone.
- `tests/p6_repin_ai_founded_by.rs` -- 3 testy, wektory RĘCZNE wg definicji webu (`cities.ts` nie daje się
  wygenerować tym samym generatorem: łańcuch importów modelu miast). ZAŁOŻENIE do akceptacji.

## Odstępstwa i założenia (do akceptacji)

1. `WarCapitalTarget` (war_all_in_capital.rs) NIE dostał pola `defenders`: dotknęłoby 4 pliki testów
   spoza allowlisty. Tie-break `defenders` żyje w `WarCityTarget`/`nearest_war_city_target`. Podpięcie do
   planera = osobny punkt (wymaga zmiany `WarCapitalTarget` i testów `p6_repin_wojna_d_*`).
2. Progi puli (`eraForcedWarStartTurnsFromEra`) i limit `maxEraForcedWarsPerCivPerEra` są brane ze
   stałych Rust (wartości z JSON: 20/20 i 1), a nie z parametru `WarRulesParams` jak w webie.
3. `foundedBy` jest tylko w modelu. Czytnik zapisu miast po stronie Rust NIE czyta `foundedByOwner`
   ani `foundedBy` (brak parsera miasta z JSON), więc round-trip zapisu web -> Rust tego pola nie
   obejmuje do czasu podpięcia czytnika zapisu.
4. `City` ma literał w `tests/p6_6b_vectors/common.rs` (funkcja `city_from`): dodano JEDNĄ linię
   `founded_by: v["foundedBy"].as_i64()`. Bez tego testy nie kompilują się po dodaniu pola. Plik jest
   poza allowlistą -- zgłaszam jako odstępstwo.
5. `cityFounderId`/`isCityLostOf` nie mają wektorów z webu (patrz wyżej).

## Bramki (stan na commit operatora, HEAD = commit z sekcji RAPORT)

- `rustfmt --check` na nowych plikach: zielone.
- `cargo clippy --all-targets -- -D warnings`: zielone (rc=0).
- `cargo test` na wszystkich binarkach testowych (309 executables, przebieg w 2 częściach z powodu limitu
  czasu komendy): 0 failed. Pierwszy przebieg `cargo test --no-fail-fast`: 206 binarek, 1535 passed, 0 failed;
  pozostałe 103 binarki uruchomione bezpośrednio: wszystkie `test result: ok`, 0 failed. W tym 1 `#[ignore]`
  (`p6_order_lane`) istnieje już w bazie; zero nowych.
- Wynik zgodny z baseline: liczba atrybutów `#[ignore]` w `rust-port/engine` bez zmian (1 = 1).

## Następne partie (NIE zrobione w tej rundzie)

- Partia 4 (GOAL (a) -- główne): `planHomeWar` (ai-war-home-defense.ts:254) + stałe `HOME_WAR_*` (:40-63)
  + pamięć histerezy (`memoryByOwner`, :161). Zależności do zportowania lub wstrzyknięcia: `RuntimeUnit`,
  `estimateUnitCombatStrength` (siegeAi), `isCityLostOf` (zrobione), `isFieldUnit`/`distance` jako
  callbacki. Szacunek: 450-600 LOC Rust -> na co najmniej 2 partie (A: stałe + ocena siły + klastry;
  B: plan P1/P2/P3 + histereza).
- Podpięcie `nearest_war_city_target` do `plan_war_all_in_capital` (tie-break defenders) -- wymaga zmiany
  `WarCapitalTarget` (decyzja: dodać pole czy trzymać osobny typ).
- Czytnik zapisu miasta: `foundedBy` / `foundedByOwner` (wspólny z resztą P6-ZAPIS).
- REPIN ai-params 10/3/0 i pozostałe długi webowe nie objęte tematem.
