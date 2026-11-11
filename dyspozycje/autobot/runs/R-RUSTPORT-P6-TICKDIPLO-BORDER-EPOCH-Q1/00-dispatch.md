# DISPATCH — R-RUSTPORT-P6-TICKDIPLO-BORDER-EPOCH-Q1 (parytet tickDiplomacy: kara graniczna wg epoki; runda 1/5, Operator)
Baza: origin/rust-port/parity-v2 = 8bb118dc7. Pin web: 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (git archive poza repo).
Problem (zmierzony przez Evaluatora TICKDIPLO-GEN): web TickCtx ma karaWspolnaGranicaDelta (stawki graniczne wg epoki -2/-3/-4; gra/src/game/diplomacy.ts:162-166, :598-605; main.ts:22879). Rust TickContext nie ma tego pola i zawsze stosuje -2 (rust-port/engine/src/domain/diplomacy.rs ~701-710, ~760-761). Test pokrywa tylko epokę 1.
GOAL: dodać pole stawki granicy do TickContext (domyślnie = wartość z epoki 1, czyli -2), wyliczenie stawki wg epoki jak w webie, generator emituje epoki 2 i 3 (tickDiplomacy z pinu), test behawioralny z wektorami dla epok 1/2/3.
Allowlista: rust-port/engine/src/domain/diplomacy.rs; rust-port/engine/tests/p6_tickdiplo.rs; rust-port/engine/tests/p6_tickdiplo_gen.mjs; rust-port/engine/tests/p6_tickdiplo_vectors/*; dyspozycje/autobot/runs/R-RUSTPORT-P6-TICKDIPLO-BORDER-EPOCH-Q1/**. ZAKAZ: gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock (nie commitować), inne pliki domain/.
Wektory: z pinu (generator, esbuild poza repo), nie ręcznie; md5 w raporcie; regeneracja identyczna.
Bramki: cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test --lib; cargo test --test p6_tickdiplo (EXIT zapisany).
Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo (usuń po bramkach). Raport 01-operator-r1.md.
