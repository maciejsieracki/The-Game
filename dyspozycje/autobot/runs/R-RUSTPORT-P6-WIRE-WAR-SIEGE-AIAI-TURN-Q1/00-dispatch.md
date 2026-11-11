# DISPATCH — R-RUSTPORT-P6-WIRE-WAR-SIEGE-AIAI-TURN-Q1 (W7; runda 1/5, Operator)
Baza: origin/rust-port/parity-v2 = 8bb118dc7 (zawiera W1, W2, W6 zawężony, oblężenie). Pin web: 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (git archive poza repo; esbuild poza repo).
Zależności spełnione: W2 (war_world_view.rs), W6 (ai_diplomacy_turn.rs, brake + tick).
GOAL: port tiku oblężenia i tików AI↔AI do Rust:
- tick oblężenia: głód, poddanie, wypad, wejście do miasta (web: wektory 37226–37262, 17301) — UWZGLĘDNIJ istniejące moduły siege_starvation.rs, siege_sortie.rs, siege_enter_city.rs, siege_no_breach.rs (nie duplikuj ich);
- tiki AI↔AI: prośba o pokój, zmęczenie (wektory 34305–34380).
Nowe pliki: rust-port/engine/src/domain/siege_turn.rs, rust-port/engine/src/domain/war_turn_ai_ai.rs (≤600 LOC; dziel testy).
Wymóg: każda funkcja z testem BEHAWIORALNYM na wektorach z pinu (generator, nie ręcznie) albo jawna zależność do W8 (podpięcie do pętli tury) w raporcie.
Allowlista: rust-port/engine/src/domain/siege_turn.rs (nowy); rust-port/engine/src/domain/war_turn_ai_ai.rs (nowy); rust-port/engine/src/domain/mod.rs (tylko pub mod); rust-port/engine/tests/p6_wire_war_siege_aiai.rs (nowy) i p6_wire_war_siege_aiai_*.rs; rust-port/engine/tests/p6_wire_war_siege_aiai_vectors/*; rust-port/engine/tests/p6_wire_war_siege_aiai_gen.mjs; dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-SIEGE-AIAI-TURN-Q1/**. ZAKAZ: gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock (nie commitować), istniejące pliki siege_*.rs (poza importem).
Bramki: cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test --lib; cargo test --test p6_wire_war_siege_aiai (EXIT zapisany). Raport 01-operator-r1.md.
Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo (usuń po bramkach).
