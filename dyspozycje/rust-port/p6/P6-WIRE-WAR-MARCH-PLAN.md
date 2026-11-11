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
- Testy (runda 3: dawny `p6_wire_war_march.rs` 689 LOC podzielony na trzy pliki):
  - `p6_wire_war_march_core.rs` (578 LOC, 12 testów): rdzeń na danych syntetycznych, w tym NOWA asercja KOLEJNOŚCI komend
    `commands_come_in_order_campaign_home_wave_all_in` (kampania -> dom -> fala -> all-in, wszystkie cztery rodzaje obecne).
  - `p6_wire_war_march_adapter.rs` (301 LOC, 5 testów): adapter na `PlayableState`, w tym NOWE: `waves_from_state_reads_waves_and_history`
    (niepusty `opaque`) i `adapter_enemy_and_opaque_state_changes_wave_target` (wróg z dwoma miastami + historia fal w `opaque`
    zmienia cel fali z miasta 2 na 3, czyli adapter realnie czyta `waves_from_state`).
  - `p6_wire_war_march_vectors.rs` (274 LOC, 1 test, 500 scenariuszy) + `p6_wire_war_march_vectors.json`: WEKTORY Z WEBA, D3 = 1:1.
- Test `forced_wave_excludes_units_already_ordered_at_home` jest teraz NIEPUSTY: asertuje, że u1 dostaje rozkaz domu ORAZ
  że fala powstaje z dokładnie w1..w3 i pomija u1 (w rundzie 1 przechodził vacuously).

## 3. Zalozenia (kazde jawne w kodzie, sekcja ZALOZENIA modułu)

- Z1 wojna: zbiór `enemy_owners` podaje wołający (nie czytamy `DiplomacyState`).
- Z2 `is_own_territory` i `strength_of` podaje wołający.
- Z3 histereza obrony domu: pamięć świeża na każde wywołanie (trwała pamięć -> W8).
- Z4 kontakt dyplomatyczny zakładany; `isRelevantSiege` = brak filtra.
- Z5 fala dostaje jednostki bez przydziałów obrony domu i bez `locked_unit_ids`. Odchylenie od weba (jawne, dług W8): web (`ai.ts` ~3912–3926)
  wywołuje `planForcedWarWave` TYLKO gdy `forcedWarAttack && (aktywne fale || historia fal niepusta) && canConcentrateArmy`, na wszystkich
  `myUnits`, z `excluded = homeDefenderAssignments ∪ activeFlankingUnitIds ∪ activeWaveUnitIds`. Rust wywołuje falę bezwarunkowo, na jednostkach
  już przefiltrowanych, z `excluded = locked ∪ jednostki rozkazów domu`. Brak w Rust odpowiednika `activeFlankingUnitIds` (flankowanie poza W5)
  i bramki „niepusta historia/fale”. Wektory W5 nie obejmują tych gałęzi (generator wywołuje funkcję składową, nie blok `ai.ts`).
- Z6 mapę ruchu (`RuchMapa` w `WarAllInNav`) podaje wołający w `AllInParams::nav` (jak Z2). Bez niej etap all-in jest pominięty.
- Z7 all-in dostaje jednostki wołającego bez `locked_unit_ids`, bez jednostek przydzielonych obronie domu i bez jednostek wybranych przez falę.
  Web: priorytet armii wg `planWarAllInCapital`; zgodność z kolejnością webową nie jest zmierzona wektorem.
- Z8 `is_barbarian` podaje wołający (`AllInParams::is_barbarian`); `is_human` z `WarWorldView`.

## 4. Wektory z weba (runda 3) i dlug

- Generator + przepis: `dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-MARCH-PLAN-Q1/gen-w5-march-vectors.mjs`. Bundluje esbuildem PRAWDZIWE
  `planHomeWar` (`ai-war-home-defense.ts`) i `planForcedWarWave` (`forced-war-waves.ts`) z `origin/main` (cffe39cb9), seed 5005,
  500 scenariuszy (472 rozkazy domu: 12 attack / 452 approach / 8 hold; 97 fal, z tego 44 z aktywną falą, 37 z historią, 10 dom+fala).
  Test Rust porównuje komendy `Home` i `ForcedWave` rdzenia W5 z wynikiem weba 1:1 (kolejność, cele, `unitIds/moveUnitIds/deferredUnitIds`,
  `originHex`, `rallyPoint`, `approachSector`, `createdTurn`). Przeszedł za pierwszym razem (brak rozbieżności Rust vs web).
- `planWarAllInCapital` i `buildWarCityTargets`: wektory z weba ISTNIEJĄ już w testach modułów składowych (`p6_repin_wojna_d_vectors.rs`
  + `p6_repin_wojna_d_nav.rs`/`_engage.rs` dla all-in; `p6_wire_war_view_vectors.json` generowane przez `p6_wire_war_view_gen.mjs`
  z prawdziwego `buildWarCityTargets`). W5 nie zmienia tych funkcji, tylko je woła; kombinacja z nawigacją (`RuchMapa`, `WarAllInNav`)
  wymagałaby budowy mapy `GameMap` weba i dałaby duplikat wektorów modułów. Dlatego W5 testuje ich WPIĘCIE (kolejność, wykluczenia
  jednostek Z7, cele z `build_war_city_targets`), a zgodność 1:1 funkcji składowych polega na ich własnych wektorach.
- Z3 i Z4 odchylają się od weba w wielotur­owym użyciu (histereza, kontakt); dług W8 (trwała pamięć histerezy między turami).
  Wektory W5 są jednoturowe ze świeżą histerezą, więc zgodne z Z3 z założenia.
- Kampania generała: wybór celu zgodny z `chooseAiGeneralWarTarget` (funkcja pure); reconcile i zapis kampanii poza W5.
- Odtwarzalność wektorów (runda 4, pomiar NIE_ZMIERZONO → ZMIERZONO): `git archive cffe39cb9 gra/src gra/data` do katalogu poza repo,
  `W5_SCENARIOS=500 node gen-w5-march-vectors.mjs <src>/gra/src <esbuild> out.json` daje plik BAJT W BAJT równy `p6_wire_war_march_vectors.json`
  (`cmp` = identyczne). Domyślna wartość N w generatorze to teraz 500 (wcześniej 220 — stary przepis nie odtwarzał JSON-a).
- Czułość testów na mutanty: runda 3 (Evaluator) — usunięcie `excluded.extend(used)` w planerze → padają test rdzenia
  `forced_wave_excludes_units_already_ordered_at_home` i test wektorowy (`p6_wire_war_march_vectors.rs`, panic ok. linii 264).
  Luka: kampania i all-in nie mają wektorów z weba w W5 (patrz wyżej); ich czułość nie jest zmierzona.

## 5. Bramki (runda 3)

- `rustfmt --check` (cargo fmt --check): OK. `cargo clippy --all-targets -- -D warnings`: OK.
- `cargo test --lib --test p6_wire_war_march_core --test p6_wire_war_march_adapter --test p6_wire_war_march_vectors --test p6_wire_war_state
  --test p6_wire_war_state_snapshot --test p6_wire_war_view --test p6_wire_war_forced_step --test p6_wire_war_declare --test p6_wire_war_declare_peace`:
  lib 28, core 12, adapter 5, vectors 1, state 14, snapshot 8, view 6, forced_step 24, declare 15, declare_peace 7 -- 0 failed.
- Brak nowych `#[ignore]`.
