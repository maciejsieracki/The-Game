# DISPATCH — R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1 (W8: pipeline wojny w turze; wariant B; runda 1/5, Operator)
Decyzja właściciela (2026-11-11): kolejność faz wg Rust (wariant B), NIE 1:1 z web. Różnice od web MUSZĄ być jawnie opisane w raporcie i w dokumencie tematu (tabela: krok, faza Rust, faza web, uzasadnienie).
Baza: origin/rust-port/parity-v2 = ca33abdd6 (zawiera W1–W7, CITY-PEACE, BORDER, COOLDOWN, LOCKS, SIEGE-GATE, zawężony W6, REPLAY r2, L-2, ERA, TICKDIPLO-GEN). Pin web: 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (tylko odczyt).
Fazy Rust (rust-port/engine/src/domain/events.rs:44): StartTurn=0, PlayerActions=1, Diplomacy=2, Economy=3, Production=4, Ai=5, Barbarians=6, …
GOAL: jedna funkcja run_war_turn(world, state, turn) wołana w fazach Diplomacy/Ai (jedno miejsce wywołania w playable.rs lub session.rs), wykonująca kroki wojny w kolejności mapowania:
- Diplomacy (2): brake AI↔AI + tick pary (run_brake_phase, tick_pairs_relation_scores z ai_diplomacy_turn.rs);
- Economy/Production (3–4): tick oblężenia (siege_city_turn, siege_turn.rs) i głód;
- Ai (5): umowy AI↔AI → sweep → parowanie → pętla właścicieli (prune fal → kampania → tickDiplomacy gracz↔AI → decideAIDiplomacy (decide_city_offer, ai_peace_city_offer.rs) → komendy → decideAITurn) → tiki AI↔AI (run_ai_ai_peace_turn, run_ai_ai_weariness_turn z war_turn_ai_ai.rs) → skan oblężeń;
- zwycięstwo/zapis: bez zmian.
Moduły do UŻYCIA (nie duplikować): diplomacy_tick_war_brake.rs, ai_diplomacy_turn.rs, siege_turn.rs, war_turn_ai_ai.rs, war_turn_state.rs, war_world_view.rs, war_turn_forced.rs, war_turn_declare.rs, ai_peace_city_offer.rs, diplomacy_rejection_cooldown.rs, diplomacy_locks.rs, diplomacy_siege_war_gate.rs.
Test: 2–3 tury na mini-świecie (behawioralnie: stan wojny, głód, deklaracja, rozejm po zmianie tury), wektory z pinu dla każdego kroku, którego web dotyczy; różnice od web oznaczone jako oczekiwane (asercja na wartość Rust + komentarz z kolejnością web).
Allowlista: rust-port/engine/src/domain/turn_war_pipeline.rs (nowy); rust-port/engine/src/domain/mod.rs (tylko pub mod); rust-port/engine/src/domain/playable.rs LUB session.rs (JEDNO wywołanie run_war_turn); rust-port/engine/tests/p6_wire_war_pipeline.rs (nowy) i p6_wire_war_pipeline_*.rs; rust-port/engine/tests/p6_wire_war_pipeline_vectors/*; rust-port/engine/tests/p6_wire_war_pipeline_gen.mjs; dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1/**. ZAKAZ: gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock (nie commitować), inne moduły domain/.
Limit: plik ≤ 600 LOC, testy dzielone.
Bramki: cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test --lib; cargo test --test p6_wire_war_pipeline* (EXIT zapisany). Wyniki jako surowe EXIT.
Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo (usuń po bramkach). Przed startem cargo: df -h / ≥ 8 GB wolnego.
Raport: 01-operator-r1.md (plik .md w runs/), tabela różnic B vs web.
