STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1
GOAL: jedna funkcja run_war_turn(world, state, turn) wołana w fazach Diplomacy/Ai (wariant B), z krokami: brake AI<->AI + tick par; tick oblężenia i głód; umowy AI<->AI, sweep, parowanie, pętla właścicieli, tiki AI<->AI, skan oblężeń.
ZMIANY/COMMIT: brak zmian kodu. Dispatch wymaga modułów nieobecnych w bazie origin/rust-port/parity-v2 (ca33abdd6). Commit zawiera wyłącznie ten raport.
TESTY: NIE_ZMIERZONO. Bramki cargo nie były uruchamiane, bo implementacja nie została rozpoczęta (blokada przed kodem).
BLOKADY:
  1. Dispatch wymienia do użycia `rust-port/engine/src/domain/siege_turn.rs` (`siege_city_turn`) i `rust-port/engine/src/domain/war_turn_ai_ai.rs` (`run_ai_ai_peace_turn`, `run_ai_ai_weariness_turn`). Oba pliki NIE istnieją w ca33abdd6 (sprawdzone: `git ls-tree`, `git grep`).
  2. Oba moduły istnieją wyłącznie na niezmergowanej gałęzi `origin/rust-port-wip/SIEGE-AIAI-TURN-kod` (tip 211f8a2ab, commity 4c3e09a48 i 211f8a2ab, temat R-RUSTPORT-P6-WIRE-WAR-SIEGE-AIAI-TURN-Q1). Ich brak w bazie oznacza, że temat W7 (SIEGE-AIAI-TURN) nie jest w parity-v2, mimo że dispatch zakłada zawartość W1–W7.
  3. `run_war_turn` nie istnieje w żadnym pliku parity-v2 (`git grep run_war_turn` puste).
  4. Pozostałe moduły z listy istnieją w bazie: diplomacy_tick_war_brake.rs, ai_diplomacy_turn.rs (`run_brake_phase`, `tick_pairs_relation_scores`), ai_peace_city_offer.rs (`decide_city_offer`), war_turn_state.rs, war_world_view.rs, war_turn_forced.rs, war_turn_declare.rs, diplomacy_rejection_cooldown.rs, diplomacy_locks.rs, diplomacy_siege_war_gate.rs. Dodatkowo `diplomacy_ai_forced_peace.rs::run_ai_ai_peace_tick` (inny kształt niż `run_ai_ai_peace_turn` z dispatchu).
  5. Stan wojny jest już w `PlayableState.war: WarTurnState` (P6-WIRE-WAR-STATE). `PlayableGame::advance_turn` (playable.rs ~565) jedynie opróżnia kolejkę faz i nie wykonuje efektów faz (`event_for_phase`). Miejsce wywołania istnieje, ale nie ma w bazie logiki tury, którą `run_war_turn` mógłby zastąpić lub uzupełnić, więc brak też jednoznacznej definicji "świata" dla sygnatury `run_war_turn(world, state, turn)`.
DECYZJA WYMAGANA (do orkiestratora / właściciela):
  A. Zmergować SIEGE-AIAI-TURN (rust-port-wip/SIEGE-AIAI-TURN-kod, 211f8a2ab) do parity-v2 jako osobny temat, a potem ponownie uruchomić ten temat na nowej bazie. Rekomendacja.
  B. Zmienić dispatch: zawęzić GOAL do modułów obecnych w bazie (brake, tick par, decide_city_offer, forced war), a kroki oblężenia i tiki AI<->AI przenieść do tematu zależnego. Wymaga jawnej decyzji, bo odbiega od GOAL.
  C. Dopuścić przeniesienie kodu z gałęzi WIP do bazy w tym temacie. Nie wykonywałem tego bez zgody, bo dispatch zabrania zmian poza allowlistą i wskazuje bazę parity-v2.
RUNDY: 1/5; ten werdykt to BLOCK (nie FAIL). Zużyta 1 runda.
NASTĘPNY KROK: decyzja A/B/C; po niej Operator r2 na nowej bazie (SHA w dopisku do 00-dispatch.md).
DEPLOY/PUSH: NIE WYKONANO (commit lokalny, bez push; bez merge, bez integracji).

Uwagi: tabela różnic B vs web (krok, faza Rust, faza web, uzasadnienie) nie powstała, bo nie ma kodu do porównania. Pinu web 07d2fbd72 nie odczytywałem.
