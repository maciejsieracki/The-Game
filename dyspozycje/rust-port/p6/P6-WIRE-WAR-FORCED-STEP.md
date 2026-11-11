# P6-WIRE-WAR-FORCED-STEP (W3) — krok wojen wymuszonych tury

Temat: `R-RUSTPORT-P6-WIRE-WAR-FORCED-STEP-Q1` (W3 z `P6-WIRE-WAR-TURN-PLAN.md`), runda 1/5.
Baza Rust: `origin/rust-port/parity-v2` = `1079feb9f` (W1 `war_turn_state.rs`, W2 `war_world_view.rs` już w bazie).
Web (pomiar): `origin/main` = `cffe39cb9`, `gra/src/main.ts`. Numery linii ZMIERZONE grepem na tym SHA
(plan r3 podawał `60a18c60d`; dryf potwierdzony, sekcja 2).

## 1. Pomiar (sygnatury składowych)

| Moduł (`engine/src/domain/`) | Sygnatura użyta w W3 |
|---|---|
| `war_forced_trigger.rs` | `SearchInput`, `should_search_{bronze,stone,iron}(&SearchInput) -> bool`, `sweep_stale_forced_war_entries(turn, &mut ForcedWarRegistries) -> SweepOutcome`, `ActivePair{attacker_id,target_id,at_war}`, `ForcedEra::{Stone,Bronze,Iron}` |
| `war_forced_pairing.rs` | `assign_forced_war_pairings(&[ForcedWarPairingSubject], &[ForcedWarPairingExistingPair], &ForcedWarPairingOpts) -> ForcedWarPairingResult`; `ForcedWarPairingOpts{pair_relation_score, is_pair_blocked, is_era_war_exhausted, hex_distance, total_active_forced_wars_by_owner, player_first}`; `PlayerFirstOpts{player_owner_id, is_player_pair_gate_open, candidates}` |
| `war_era_pool.rs` | `is_player_eligible_for_era_war_pool(&PlayerEraWarPoolInput) -> bool` |
| `war_forced_common.rs` | `count_active_forced_wars_for_owner(owner, &[(i64,i64)]) -> i64` |
| `war_forced_{stone,bronze,iron}.rs` | stałe `*_ODPOCZYNEK_TUR` (20), `WOJNA_KAMIEN_WYMUSZONA_START_TURY` (25) |
| `war_turn_state.rs` (W1) | `WarTurnState{forced:[ForcedWarSaveState;3] (0=kamień,1=brąz,2=żelazo), bronze/iron_era_enter_turn_by_owner}` |
| `war_world_view.rs` (W2) | `WarWorldView::{war_target_cities, capital_city_id, forced_war_neighbors}` |

## 2. Web (`origin/main` = `cffe39cb9`), mapowanie

| Blok web | Linie `gra/src/main.ts` |
|---|---|
| definicja `sweepStaleForcedWarEntries` | 11629 |
| wywołanie sweep przed Krok A | 40089 |
| Krok A (`shouldSearch` Brąz/Kamień/Żelazo) | 40080–40186 |
| Krok B (aktywne pary wszystkich epok) | 40187 |
| Krok C (pula gracza, R1, player-first) | 40204–40263 |
| Krok D (pary do dołączenia) | 40264 |
| Krok E (bramka gracza, `eraWarCounter`, kandydaci player-first) | 40278–40345 |
| `assignForcedWarPairings` | 40346 |
| `ownerLoopList` (partner gracza pierwszy) | 40375 |
| `ownerLoop` | 40381 |

Dryf względem planu r3: sweep 11245 → 11629; Krok A 38874 → 40080; pętla właścicieli 39152 → 40381.

## 3. Moduł `domain/war_turn_forced.rs` (nowy)

`forced_war_step(world: &WarWorldView, state: &mut WarTurnState, input: &ForcedWarStepInput) -> ForcedWarStepOutcome`.

Kolejność (zgodna z webem): sweep (mutuje `state`: usuwa nieaktualne pary, ustawia odpoczynek napastnika) →
Krok A (`should_search_*` per właściciel, osobne wektory, konkatenacja brąz, kamień, żelazo) →
pula gracza (`is_player_eligible_for_era_war_pool`, miasto referencyjne = stolica lub pierwsze) →
R1 (multiwar przed turą 40: zostają tylko brąz/żelazo) → opcja „wojna epoki z udziałem gracza” →
pary do dołączenia → `assign_forced_war_pairings` → `owner_loop_order` (partner pary gracza pierwszy, reszta w kolejności `owners`).

Funkcja nie używa RNG ani zegara. NIE mutuje: `*PendingOwners`, `*CycleOwners`, `*EraEnterTurnByOwner`,
fal (`forcedWarWavesByPairKey` — zwracane klucze w `sweep.waves_deleted`), cooldownów. Te mutacje należą do ownerLoop (kolejna partia, W4/W8).

## 4. Decyzje i założenia

- ZAŁOŻENIE-W3-1: wejścia spoza `WarWorldView` (poziom trudności, epoka, `already_at_war_any_role`, stan
  wojny pary, blokady pokoju, flagi runtime, `canCivJoinEraForcedWar`, `evaluateInterCivWarGate`) podaje wołający
  w `ForcedWarStepInput`/`ForcedOwnerInput`. Web czyta je z closure'ów; ich wyliczenie to zakres W8.
- ZAŁOŻENIE-W3-2: `krok_a_eligible` łączy filtr webowy Kroku A i wykluczenia kandydatów pary (ownerId>0,
  nie typCityCopy, nie barbarzyńca, nie wyeliminowany, nie klaster city-state).
- ZAŁOŻENIE-W3-3: `owner_loop_order` używa surowej listy `owners` (web `aiOwnerList`), nie listy po filtrze.
- ZAŁOŻENIE-W3-4: odpoczynek napastnika po sweep = tura + 20 dla każdej epoki (stałe `*_ODPOCZYNEK_TUR` są równe 20).
- D2 (kolejność kroków tury) dotyczy W8; wewnątrz kroku zachowana kolejność weba.

## 5. Wektory i testy

- Brak wektorów z uruchomionego weba: blok `runAiPhase` jest inline (nieeksportowany), więc nie zbudowano
  integracyjnego wektora z `gra/`. Zamiast tego `tests/p6_wire_war_forced_step.rs` (12 testów) sprawdza
  reguły odczytane z kodu weba. Wartości oczekiwane = ZAŁOŻENIE, NIE_ZMIERZONO względem web.
- Pokryte: sweep + odpoczynek (120 = 100 + 20), Krok A brąz (pending) i kamień (uzbrojenie tej tury),
  poziom 1 wyłącza, flaga brązu wyłącza tylko brąz, R1, pula gracza blokowana aktywną wojną gracza,
  wyeliminowany nie liczy się do licznika, kolejność ownerLoop (permutacja; partner pierwszy),
  deterministyczność, hex stolicy w podmiocie.

## 6. Ryzyka

- R-W3-1: pełna zgodność z webem wymaga wektorów z `runAiPhase` (W8 lub osobna partia generatora).
- R-W3-2: `assign_forced_war_pairings` nie dostaje `pair_relation_score` (web też nie przekazuje go w tym bloku).
