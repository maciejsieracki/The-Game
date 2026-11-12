STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1
GOAL: pipeline fazy Diplomacy bez cichych zer i bez cichej epoki startu (dispatch r5, NAPRAW 1 i 4)
ZMIANY/COMMIT: baza 0b5fc5fb9 (FC r4, kod ac3f06647); galaz robocza wip/R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1-r5; SHA: patrz commit na koncu galezi (git log -1). Pliki: rust-port/engine/src/domain/turn_war_inputs.rs, rust-port/engine/src/domain/playable.rs (tylko `?` przy production_config + test modulowy), rust-port/engine/tests/p6_wire_war_inputs.rs, ten raport. Cargo.lock NIE commitowany.
Uwaga o bazie: naglowek zadania wskazywal parity-v2 f207ea6b1, ale parity-v2 nie zawiera turn_war_pipeline.rs; wiazacy dispatch r5 wskazuje 0b5fc5fb9 - uzyto 0b5fc5fb9.
RUNDY: r5/5 (ostatnia)
DEPLOY/PUSH: NIE WYKONANO

## NAPRAW 1 (epoki / wspolna granica)
- `PlayableState` nie niesie epoki per wlasciciel (brak badan; web `empireEpochForOwner` main.ts:2419 czyta biezaca epoke). Usunieto podstawianie epoki startu: `epochs_from_state` zwraca `WarInputsError::OwnerEpochUnavailable(id)` dla AI z miastami. `build_war_inputs` = walidacja blokad pokoju -> `epochs_from_state` -> `build_war_inputs_with_epochs` (cialo produkcyjne ze wstrzykiwalnym zrodlem epok; uzywane przez testy z wektorami pinu).
- Wspolna granica: `shared_border_pairs`. Web main.ts:22876: `cities(a) > 2 && cities(b) > 2 && ownersShareLandBorderLive` (main.ts:5690). Gdy ktoras strona ma <= 2 miasta, wynik jest strukturalnie `false` (fakt, nie zgadywanie); przy > 2 miastach po obu stronach `SharedBorderUnavailable(a, b)` (brak producenta granicy).
- Testy na produkcyjnym `build_war_inputs` / `build_war_inputs_with_epochs`, nie na recznym wstrzyknieciu do `WarTurnInputs`: `production_owner_epochs_are_unavailable_not_the_start_epoch`, `shared_border_is_structurally_false_up_to_two_cities_and_an_error_above`, `production_path_fails_with_explicit_blockers_for_ai_with_cities`. Wektor tick->brake (`tickBrake`) wchodzi teraz przez `build_war_inputs_with_epochs` (epoki z wektora pinu), asercje wartosci bez zmian.

## NAPRAW 4 (ciche zera)
`power_raw_for_owner`: `budynki`, `tech_zbadane`, `miasta_jednosc_religii`, `suma_ludkow` (ludki), `kultura_imperium` (kultura) = `Component::Missing` (blad STRICT). Z tej samej przyczyny (zalezne od populacji, ktorej `PlayableCity` nie ma; stale FOUNDING_* byly wejsciem) rowniez `rekrut_ekw` (rekruci) i `heksy_terytorium` (promien terytorium zalezy od populacji) = Missing - rozszerzenie wzgledem dispatchu, ta sama zasada. Z producenta zostaja: `miasta`, `jednostki` (Wojownik), jawne zera z `EXPLICIT_ZERO_REASONS` (bitwy x2, ulepszenia, zdobycze; plik:linia pinu, test `has_pin_file_line_ref`). `FOUNDING_POPULATION/CULTURE` zostaja wylacznie jako wejscie-zaslepka `produce_for_owner` (dla `miasta`); ich wyniki sa nadpisywane Missing.
Test: `production_power_inputs_mark_unproduced_components_missing_not_zero` (siedem Missing + zgodnosc z kluczami bledu STRICT dla obu modeli bitwy).

## Przy okazji
- `pair_params_for` / `production_config` zwracaja `Result`; wlasciciel miasta bez wpisu w `players` => `UnknownOwner(id)` (test `pair_params_for_unknown_city_owner_is_an_error_not_the_player_profile`).
- KNOWN_GAPS egzekwowane: nowa stala `UNPRODUCED_POWER_COMPONENTS` musi rowna sie dokladnie zbiorowi kluczy Missing z `objective_power_for_owner`, a kazdy klucz musi byc nazwany w `KNOWN_GAPS` (luki epoki i granicy z plik:linia pinu).
- Bramka R1: wektor/asercja w izolacji od blokady pokoju (`gate_r1_blocks_ai_ai_declaration_before_turn_40_in_isolation_from_peace_locks`): para AI-AI, kryzys od tury 1, bez blokad: multiwar=false -> deklaracja w turach 1-3; multiwar=true -> brak deklaracji w turach 1-3; multiwar=true -> deklaracja w turach 40-43 (`DELAY_INTER_CIV_WARS_UNTIL_TURN` = 40). Dodatkowo blokada pokoju w izolacji od bramki (multiwar=false, tury 41-44). ROZNICA B: web liczy bramke per deklaracja w kolejce wojny, Rust raz na poczatku fazy (asercje na wartosc Rust). R2 (limit rownoczesnych wojen epoki 1) w izolacji: NIE_ZMIERZONO - wymaga zywych wojen w `brake_phase.at_war` bez efektow deklaracji (r6); pokryte jednostkowo w p6_brake_inputs.
- Odwolania `web_owner_id`/`rust_owner_id` bez wolajacego w src: bez zmian (dlug niskiej wagi, test mapowania istnieje).

## Efekt produkcyjny (OCZEKIWANY wg dispatchu r5)
`PlayableGame::advance_turn` z AI posiadajacym miasta zwraca teraz `PlayableError::WarTurn("... brak producenta epoki wlasciciela ...")` i cofa kolejke/tura/stan wojny (test modulowy `advance_turn_with_ai_city_fails_explicitly_on_missing_owner_epoch_and_restores_state` zastapil `..._passes_three_turns_and_ticks_the_pair`; to JEDYNA zmiana asercji istniejacych testow i wynika wprost z dispatchu: epoka startu nie moze byc podstawiana). Testy p6_wire_war_* bez osłabień; w p6_wire_war_inputs test `start_epoch_comes_from_game_params...` zastapiony `production_owner_epochs_are_unavailable...` (zmiana semantyki wymagana przez NAPRAW 1).

## Blokery dla r6 / osobnych tematow (kolejnosc napotykania)
1. Producent epoki per wlasciciel (badania/era w PlayableState; `empireEpochForOwner` main.ts:2419) - blokuje `build_war_inputs`.
2. Producent wspolnej granicy `ownersShareLandBorderLive` (main.ts:5690) - dla par z > 2 miastami po obu stronach.
3. Populacja i kultura miast w `PlayableCity` -> ludki, rekruci, terytorium, kultura.
4. Magazyny budynkow, tech, religii panstwowej -> infra, tech, religia.
5. `TickContext` poza granica: handel, religia, dobra wola, wiarygodnosc (domyslne).
6. R2 w izolacji (patrz wyzej).

## TESTY (surowe EXIT)
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: 51 ok, EXIT 0
- p6_wire_war_pipeline 7 ok, p6_wire_war_inputs 14 ok, p6_wire_war_diplo 13 ok, p6_brake_inputs 10 ok, p6_power_nozeros 9 ok, p6_power_rest 9 ok; EXIT 0
- pelny cargo test --no-fail-fast: EXIT 0, 2834 passed, 0 failed (suma linii "test result")
BLOKADY: brak (znane luki wyzej).
NASTEPNY KROK: Evaluator r5 (to samo ID); po PASS integracja i osobne tematy producentow z listy blokerow.
