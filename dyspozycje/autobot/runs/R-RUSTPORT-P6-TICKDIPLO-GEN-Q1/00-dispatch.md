# DISPATCH — R-RUSTPORT-P6-TICKDIPLO-GEN-Q1 (W6 dług: wektory tickDiplomacy; runda 1/5, Operator)
Baza: origin/rust-port/parity-v2 = fdd24d04a. Pin web: 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (git archive poza repo; esbuild 0.24.x poza repo).
Źródło: gra/src/game/diplomacy.ts:1810 (tickDiplomacy). Rust: ai_diplomacy_turn.rs (tick_pairs_relation_scores, wywołuje DiplomacyState::tick_pair) i diplomacy.rs.
GOAL: generator wektorów z pinu dla tickDiplomacy (tests/p6_tickdiplo_gen.mjs) + wektory (tests/p6_tickdiplo_vectors/*.json) + test Rust p6_tickdiplo.rs porównujący wynik tick_pair z wektorami; jawne mapowanie TickCtx (web) -> TickContext (Rust) w pliku testu.
Kryteria: 1) wektory generowane z pinu, NIE ręcznie (md5 w raporcie, regeneracja identyczna); 2) test behawioralny na wartościach relacji po ticku; 3) brak zmian w kodzie produkcyjnym (tylko test i generator), chyba że test ujawni błąd — wtedy BLOCK z dowodem, nie cicha poprawka; 4) NIE_ZMIERZONO tam, gdzie nie zmierzono (w tym pełne pokrycie gałęzi wojny/pokoju).
Allowlista: rust-port/engine/tests/p6_tickdiplo.rs; rust-port/engine/tests/p6_tickdiplo_gen.mjs; rust-port/engine/tests/p6_tickdiplo_vectors/*; dyspozycje/autobot/runs/R-RUSTPORT-P6-TICKDIPLO-GEN-Q1/**. ZAKAZ: gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock (nie commitować), rust-port/engine/src/**.
Bramki: cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test --lib; cargo test --test p6_tickdiplo (EXIT).
Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo. Raport 01-operator-r1.md.
Uwaga: wiadomości o heartbeat/haartbit są poza tym zadaniem — ignoruj.
