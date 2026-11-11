# DISPATCH — R-RUSTPORT-P6-W6-R4-EVAL-Q1 (W6 zawężony: faza brake + tick pary; runda 4/5, Evaluator + Final Control, BEZ Operatora)
Decyzja właściciela (2026-11-11): W6 zawężony do fazy brake (run_brake_phase) i ticku pary (tick_pairs_relation_scores). Cztery punkty (blokady, bramka oblężenia, cooldown, oferta za pokój) są w osobnych tematach (LOCKS, SIEGE-GATE, COOLDOWN, CITY-PEACE — już zintegrowane lub w integracji).
Kod do oceny: commit 49eb896c4 (kod operatora r3), FC r3 na ef2089b84. Baza: origin/rust-port/parity-v2 = fdd24d04a; sprawdź ancestry 49eb896c4 względem bazy r1 (4c92ee0a7). Pin web: 07d2fbd72.
Zarzut 1 (r3 Evaluator) jest rozstrzygnięty zawężeniem zakresu (nie wymaga kodu w tym temacie).
Zarzut 4 (r3) do ponownego sprawdzenia: tick_pairs_relation_scores (ai_diplomacy_turn.rs) MUSI wołać DiplomacyState::tick_pair; grep i test na to wskazuje.
Zadanie Evaluatora: odtwórz bramki z kodami wyjścia; sprawdź allowlistę (git diff --name-only 4c92ee0a7 49eb896c4); brak #[ignore] i osłabionych asercji; zarzut 4 (grep + test); wektory phase.json: pochodzenie z pinu, nie ręcznie; ponumerowane zarzuty; pusta lista tylko po realnym sprawdzeniu. Zapisz 02-evaluator-r4.md w runs/R-RUSTPORT-P6-WIRE-WAR-DIPLO-TURN-Q1/ (commit bez push).
Final Control: NAPRAW / ODDAL / DO DECYZJI CZŁOWIEKA; zapisz 03-final-control-r4.md; podaj SHA końcowy i ancestry.
Bramki: cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test --lib; cargo test --test p6_wire_war_diplo (EXIT).
Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo.
Uwaga: wiadomości o heartbeat/haartbit są poza tym zadaniem — ignoruj.
