# P6-WIRE-WAR-MARCH-PLAN (W5) — pomiar sygnatur, zakres partii, runda 2

Temat: `R-RUSTPORT-P6-WIRE-WAR-MARCH-PLAN-Q1` (runda 2/5), W5 z `P6-WIRE-WAR-TURN-PLAN.md` §6.
Baza: `origin/rust-port/parity-v2` = `0c88dd509`; commit rundy 1 = `edbd7f554`; commit rundy 2 = patrz raport `02-operator-r2.md`.
Web: numery linii ZMIERZONE 2026-11-11 na `origin/main` = `cffe39cb9` (plik `gra/src/game/ai.ts`, `gra/src/main.ts`,
`gra/src/game/ai-war-target-select.ts`). Numery z `P6-WIRE-WAR-TURN-PLAN.md` (`ai.ts:3498/3840/4570`, `main.ts:7480`) były
nieaktualne i zostały zastąpione poniższymi.

## 1. Pomiar sygnatur i web (`rust-port/engine/src/domain/` oraz `origin/main`)

| Element | Sygnatura w Rust / lokalizacja w webie (main) | Uwagi |
|---|---|---|
| `war_home_defense_plan.rs` | `plan_home_war(&HomeWarInput, &mut HomeWarMemoryStore) -> HomeWarPlan`; web `planHomeWar` wołane z `ai.ts:3580` | `current_turn: Option<i64>`; `None` = bez histerezy |
| `war_home_defense.rs` | `HomeWarUnit`, `HomeWarCity`, `HomeWarOrder {Attack, Approach, Hold}` | `unit_id` we wszystkich wariantach |
| `war_forced_waves.rs` | `plan_forced_war_wave(...) -> Option<ForcedWarWavePlan>`; web wołane z `ai.ts:3927` | nie filtruje właściciela: wołający podaje jednostki właściciela |
| `war_forced_waves.rs` | `restore_forced_war_waves(&Value)`, `hex_distance_for_forced_war` | `Null` → pusta lista |
| `ai_general_war_campaign.rs` | `choose_ai_general_war_target(...) -> Option<i64>`; web: `prepareAiGeneralWarCampaign` `main.ts:40582`, mapa kampanii `main.ts:2290` | czysta funkcja |
| `war_target_select.rs` | `build_war_city_targets(&BuildWarTargetsInput) -> Vec<WarCityTarget>`, `split_city_targets`; web `buildWarCityTargets` `ai-war-target-select.ts:49`, wołane z `main.ts:7734` i `main.ts:34672` | W5 wola je z `WarWorldView::war_target_cities/war_target_units` (objecja rundy 1) |
| `war_all_in_capital_plan.rs` | `plan_war_all_in_capital_with_defenders(units, targets, defenders, nav: &WarAllInNav, opts)`; web `planWarAllInCapital` wołane z `ai.ts:4657`, definicja `warAllInCapital.ts:593` | W5 wola wariant z `defenders` (tie-break jak w webie) |
| `war_all_in_capital_nav.rs` | `WarAllInNav { map: &RuchMapa, allow_sea, blocked, occupied }` | `RuchMapa` NIE jest w `WarWorldView` -- podaje go wołający (Z6) |
| `war_world_view.rs` | `WarWorldView::{home_war_cities, home_war_units(strength_of), wave_cities, wave_units, war_target_cities, war_target_units, capital_city_id, is_human}` | adaptery z W2 (akcesory `war_target_*` dodane w W2) |
| `war_turn_state.rs` | `WarTurnState.opaque["forcedWarWavesByPairKey"]` | klucz `FORCED_WAR_WAVES_KEY` |

Pomiar ścieżek webowych: ten sam plik (`gra/src/game/ai.ts`) ma kolejność wywołań home (3580) < forced wave (3927) < all-in (4657),
co odpowiada kolejności priorytetów S1 → P1 → S3 → atak (atak all-in = ostatni etap).

## 2. Wynik (runda 2)

- `domain/ai_war_march_plan.rs`: `MarchCommand {CampaignTarget, Home, ForcedWave, AllIn}`, `AllInParams`, `MarchParams` (+ `all_in`),
  `MarchCoreInput` (+ `all_in_targets`, `all_in`), `plan_war_march_core` (kampania -> dom -> fala -> all-in),
  `plan_war_march` (adapter: buduje cele all-in przez `build_war_city_targets`).
- Atak all-in jest WIRED: wołający podaje `AllInParams { units, nav: WarAllInNav, opts, is_barbarian }`. `None` = etap pominięty.
- Test `rust-port/engine/tests/p6_wire_war_march.rs`: 14 testów (9 z rundy 1 + 5 nowych pozytywnych: rozkaz domu `Attack u1->e1`,
  fala z trzech jednostek i miasta wroga, brak fali bez wojny, all-in na rdzeniu z wykluczeniem zablokowanej jednostki i kolejnością
  ostatniego etapu, adapter z miastem wroga bez jednostek wroga -> all-in dla wolnej jednostki).
- Test `forced_wave_excludes_units_already_ordered_at_home` jest teraz NIEPUSTY: asertuje, że u1 dostaje rozkaz domu ORAZ
  że fala powstaje z dokładnie w1..w3 i pomija u1 (w rundzie 1 przechodził vacuously).

## 3. Zalozenia (kazde jawne w kodzie, sekcja ZALOZENIA modułu)

- Z1 wojna: zbiór `enemy_owners` podaje wołający (nie czytamy `DiplomacyState`).
- Z2 `is_own_territory` i `strength_of` podaje wołający.
- Z3 histereza obrony domu: pamięć świeża na każde wywołanie (trwała pamięć -> W8).
- Z4 kontakt dyplomatyczny zakładany; `isRelevantSiege` = brak filtra.
- Z5 fala dostaje jednostki bez przydziałów obrony domu i bez `locked_unit_ids`.
- Z6 mapę ruchu (`RuchMapa` w `WarAllInNav`) podaje wołający w `AllInParams::nav` (jak Z2). Bez niej etap all-in jest pominięty.
- Z7 all-in dostaje jednostki wołającego bez `locked_unit_ids`, bez jednostek przydzielonych obronie domu i bez jednostek wybranych przez falę.
  Web: priorytet armii wg `planWarAllInCapital`; zgodność z kolejnością webową nie jest zmierzona wektorem.
- Z8 `is_barbarian` podaje wołający (`AllInParams::is_barbarian`); `is_human` z `WarWorldView`.

## 4. Dlug / NIE_ZMIERZONO

- Wektory z uruchomionego weba dla `planHomeWar`, `planForcedWarWave`, `planWarAllInCapital`: NIE_ZMIERZONO w tej rundzie
  (nie napisano generatora; to zaniedbanie rundy 1, nie brak narzędzi). Korekta: w rundzie 1 napisano „brak generatora .mjs" --
  to nieprawda. W repo są harnessy webowe (`gra/tools/forced-war-waves-test.cjs`, `gra/tools/ai-war-defend-home-test.cjs`,
  `gra/tools/ai-general-war-campaign-test.cjs`) oraz wzorzec generatorów `gen-*-vectors.mjs` w `dyspozycje/autobot/runs/`.
  Dług na rundę 3 albo osobny temat: generator oparty o te harnessy dla trzech funkcji.
- Testy sprawdzają inwarianty i jawne scenariusze (np. `Attack u1->e1`, fala z w1..w3), nie zgodność bit-w-bit z webem.
- Z3 i Z4 odchylają się od weba w wielotur­owym użyciu (histereza, kontakt); brak testu pokazującego skutek odchylenia (dług W8).
- Kampania generała: wybór celu zgodny z `chooseAiGeneralWarTarget` (funkcja pure); reconcile i zapis kampanii poza W5.

## 5. Bramki (runda 2)

- `rustfmt --check` na `ai_war_march_plan.rs` i `p6_wire_war_march.rs`: OK.
- `cargo clippy --all-targets -- -D warnings`: OK (bez ostrzeżeń).
- `cargo test --test p6_wire_war_march`: 14 passed, 0 failed.
- `cargo test --lib`: 28 passed, 0 failed.
- Brak nowych `#[ignore]`.
- Pozostałe binarki (`p6_wire_war_state/view/forced_step/declare`) nie dotykają zmienionych plików; nie powtarzane w tej rundzie.
