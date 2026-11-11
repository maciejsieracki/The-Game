STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-WIRE-WAR-MARCH-PLAN-Q1 (W5, runda 2)
GOAL: planer marszu per owner (MarchCommand), kolejność kampania -> dom -> fala -> atak all-in; niczego nie wykonuje.
ZMIANY/COMMIT: commit rundy 2 na branchu p6-wire-war-march-plan (baza = edbd7f554 = commit rundy 1). Nie pushowano.
  - rust-port/engine/src/domain/ai_war_march_plan.rs: all-in wpięty (AllInParams w MarchParams/MarchCoreInput), build_war_city_targets w adapterze.
  - rust-port/engine/tests/p6_wire_war_march.rs: 14 testów (5 nowych pozytywnych, test wykluczenia fali przepisany na niepusty).
  - dyspozycje/rust-port/p6/P6-WIRE-WAR-MARCH-PLAN.md: zmierzone numery linii web (origin/main cffe39cb9), korekta Z6-Z8, dług wektorów.
  - dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-MARCH-PLAN-Q1/02-operator-r2.md (ten raport).
  Poza allowlistą: nic. war_world_view.rs i war_turn_state.rs bez zmian.

ODPOWIEDZI NA ZARZUTY (rundy 1):
1. Z6 all-in niepodpięty -- PRZYJMUJĘ. Wpięte: MarchParams.all_in: Option<AllInParams{units, nav: WarAllInNav, opts, is_barbarian}>;
   MarchCommand::AllIn(WarAllInOrder) jako ostatni etap. Mapę ruchu (RuchMapa) podaje wołający (Z6), bo WarWorldView jej nie niesie;
   None = etap pominięty. Dowód: testy all_in_attack_comes_last_and_skips_locked_units (rdzeń) i adapter_with_enemy_city_orders_all_in_for_owner_only (adapter).
2. war_target_select (buildWarCityTargets) niewołany -- PRZYJMUJĘ. Adapter buduje cele przez build_war_city_targets z
   WarWorldView::war_target_cities/war_target_units/capital_city_id/is_human; defenders -> plan_war_all_in_capital_with_defenders.
   Zastrzeżenie: web woła buildWarCityTargets także w kampanii (main.ts:7734); kandydaci kampanii nadal podawani przez wołającego (bez zmiany).
3. Brak testu pozytywnego rozkazu domu -- PRZYJMUJĘ. Dodany home_defense_orders_attack_adjacent_enemy: asercja Attack{u1 -> e1}.
4. Brak testu pozytywnego fali / vacuous -- PRZYJMUJĘ częściowo. Dodane: forced_wave_is_produced_for_three_units_and_enemy_city
   (fala na c2 z w1..w3), forced_wave_needs_enemy_city_and_is_skipped_without_war, forced_wave_excludes... przepisany (asertuje
   rozkaz domu dla u1 ORAZ falę bez u1). NIE dodane: fala z WarTurnState.opaque (niepuste waves_from_state) w adapterze
   i asercja kolejności dom->fala w jednym teście -- DŁUG na rundę 3 (wymaga poprawnego JSON forcedWarWavesByPairKey).
5. Brak wektorów z weba -- ODRZUCAM uzasadnienie „brak generatora", PRZYJMUJĘ zaniedbanie. Dowód: w repo są
   gra/tools/forced-war-waves-test.cjs, gra/tools/ai-war-defend-home-test.cjs, gra/tools/ai-general-war-campaign-test.cjs
   (origin/main) i wzorzec gen-*-vectors.mjs w dyspozycje/autobot/runs/. Wektorów NIE dostarczono w tej rundzie:
   NIE_ZMIERZONO (dług na rundę 3). Korekta zapisana w P6-WIRE-WAR-MARCH-PLAN.md §4.
6. Numery linii weba nie zmierzone -- PRZYJMUJĘ. Zmierzone na origin/main (cffe39cb9):
   ai.ts: planHomeWar 3580 (było 3498), planForcedWarWave 3927 (było 3840), planWarAllInCapital 4657 (było 4570);
   main.ts: prepareAiGeneralWarCampaign 40582, mapa kampanii 2290, buildWarCityTargets 7734 i 34672 (było main.ts:7480 -- błędne);
   ai-war-target-select.ts:49 potwierdzone. Poprawione w komentarzach modułu i w doc.
7. Z3/Z4 bez testu skutku -- PRZYJMUJĘ jako dług. Nie dodano testu wielotur­owego (histereza, kontakt); to wymaga pamięci
   HomeWarMemoryStore między turami (W8). Pozostaje jawnym założeniem.

BLOKADY: brak blokad. Dług jawny: wektory weba (pkt 5), fala z opaque w adapterze i kolejność dom->fala (pkt 4), Z3/Z4 (pkt 7).
TESTY:
- rustfmt --check (ai_war_march_plan.rs, p6_wire_war_march.rs): OK
- cargo clippy --all-targets -- -D warnings: OK (Finished, bez ostrzeżeń)
- cargo test --test p6_wire_war_march: 14 passed, 0 failed, 0 ignored
- cargo test --lib: 28 passed, 0 failed, 0 ignored
- git diff --check: OK
- nowe #[ignore]: 0
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Sonnet) na branchu p6-wire-war-march-plan; FC po PASS. Runda 3 (jeśli FAIL): wektory weba z harnessów gra/tools, test fali z WarTurnState.opaque, test kolejności dom->fala.
DEPLOY/PUSH: NIE WYKONANO
