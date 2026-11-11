# P6-WIRE-WAR-MARCH-PLAN (W5) — pomiar sygnatur i zakres partii

Temat: `R-RUSTPORT-P6-WIRE-WAR-MARCH-PLAN-Q1` (runda 1/5), W5 z `P6-WIRE-WAR-TURN-PLAN.md` §6.
Baza: `origin/rust-port/parity-v2` = `0c88dd509`. Web: numery linii z `P6-WIRE-WAR-TURN-PLAN.md` (`main` = `60a18c60d`);
NIE_ZMIERZONO ponownie na `origin/main` w tej rundzie (brak fetch `main`; numery linii web są przejęte, nie potwierdzone).

## 1. Pomiar sygnatur modułów składowych (`rust-port/engine/src/domain/`)

| Moduł | Sygnatura użyta w W5 | Uwagi |
|---|---|---|
| `war_home_defense_plan.rs` | `plan_home_war(&HomeWarInput, &mut HomeWarMemoryStore) -> HomeWarPlan` | `HomeWarInput` ma `current_turn: Option<i64>`; `None` = bez histerezy |
| `war_home_defense.rs` | `HomeWarUnit`, `HomeWarCity`, `HomeWarOrder {Attack, Approach, Hold}` | `HomeWarOrder` niesie `unit_id` we wszystkich wariantach |
| `war_forced_waves.rs` | `plan_forced_war_wave(units, targets, active, excluded: &HashSet<String>, hex_fn, created_turn: f64, history) -> Option<ForcedWarWavePlan>` | nie filtruje właściciela: wołający podaje jednostki właściciela |
| `war_forced_waves.rs` | `restore_forced_war_waves(&Value) -> Vec<(String, ForcedWarWaveState)>`, `hex_distance_for_forced_war` | `Null` → pusta lista (sprawdzone testem) |
| `ai_general_war_campaign.rs` | `choose_ai_general_war_target(Option<&AiGeneralWarCampaign>, &[WarTargetCandidate]) -> Option<i64>` | czysta funkcja |
| `war_world_view.rs` | `WarWorldView::{home_war_cities, home_war_units(strength_of), wave_cities, wave_units}` | adaptery z W2 |
| `war_turn_state.rs` | `WarTurnState.opaque["forcedWarWavesByPairKey"]` | klucz z `OPAQUE_WAR_META_KEYS` |
| `war_all_in_capital_plan.rs` | `plan_war_all_in_capital(units, targets, nav: &WarAllInNav, opts)` | NIE podpięte w W5: `WarAllInNav` wymaga `RuchMapa`, którego `WarWorldView` nie eksponuje (dług W8) |

## 2. Wynik

- Nowy moduł `domain/ai_war_march_plan.rs` (232 LOC, `wc -l`): `MarchCommand {CampaignTarget, Home, ForcedWave}`,
  `MarchParams`, `MarchCoreInput`, `plan_war_march_core` (czysty rdzeń), `plan_war_march` (adapter na `WarWorldView` + `WarTurnState`),
  `waves_from_state`.
- Kolejność w rdzeniu: kampania generała → obrona domu (`plan_home_war`, S1→P1→S3→atak wewnątrz modułu) → fala wymuszona
  (`plan_forced_war_wave` na jednostkach nieprzydzielonych obronie i nieblokowanych).
- Test `rust-port/engine/tests/p6_wire_war_march.rs` (378 LOC, `wc -l`): 9 testów (rdzeń na danych syntetycznych + adapter na `PlayableState`).

## 3. Zalozenia (kazde jawne w kodzie, sekcja ZALOZENIA modułu)

- Z1 wojna: zbiór `enemy_owners` podaje wołający (nie czytamy `DiplomacyState`).
- Z2 `is_own_territory` i `strength_of` podaje wołający.
- Z3 histereza obrony domu: pamięć świeża na każde wywołanie (trwała pamięć → W8).
- Z4 kontakt dyplomatyczny zakładany; `isRelevantSiege` = brak filtra.
- Z5 fala dostaje jednostki bez przydziałów obrony domu i bez `locked_unit_ids`.
- Z6 `planWarAllInCapital` NIE podpięty (dług W8, przyczyna: brak `RuchMapa` w widoku).

## 4. Dlug / NIE_ZMIERZONO

- Wektory z uruchomionego weba dla `planHomeWar` / `planForcedWarWave` / `buildWarCityTargets` NIE_ZMIERZONO w tej rundzie
  (brak generatora `.mjs` dla tych funkcji; generator W2 obejmuje tylko `ai-war-target-select.ts`).
- Testy adaptera i rdzenia sprawdzają inwarianty (brak rozkazów dla zablokowanych / wrogich jednostek, brak powtórnego
  użycia jednostki w fali, determinizm, brak wojsk przy braku wojny), nie bit-w-bit zgodność z webem.
- Test „fala nie reużywa jednostek obrony” przechodzi także gdy fala nie powstaje; test nie dowodzi, że fala została zaplanowana.
- Kampania generała: wybór celu zgodny z `chooseAiGeneralWarTarget` (funkcja pure); reconcile i zapis kampanii poza W5.
- `war_target_select` (`buildWarCityTargets`) NIE wołany w planerze (dane celów miast dla all-in capital → W8).

## 5. Bramki

- `cargo fmt` (rustfmt na dwóch nowych plikach): OK.
- `cargo clippy --all-targets -- -D warnings`: OK (bez ostrzeżeń).
- `cargo test --test p6_wire_war_march`: 9 passed, 0 failed.
- `cargo test --lib`: 28 passed, 0 failed.
- `cargo test --test p6_wire_war_state`: 14 passed; `p6_wire_war_view`: 6 passed; `p6_wire_war_forced_step`: 24 passed; `p6_wire_war_declare`: 15 passed.
- Brak nowych `#[ignore]`.
