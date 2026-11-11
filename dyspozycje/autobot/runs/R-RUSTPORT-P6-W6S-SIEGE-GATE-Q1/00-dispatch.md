# DISPATCH — R-RUSTPORT-P6-W6S-SIEGE-GATE-Q1 (W6 wariant A, punkt 2: bramka oblężenia w dyplomacji, runda 1/5, Operator)
Baza: origin/rust-port/parity-v2 = f207ea6b1. Pin web: 07d2fbd72f758705f8e1d59cc4968027ffbafe75.
GOAL: port `siegeAllowedBetween` (web) do `rust-port/engine/src/domain/diplomacy_siege_war_gate.rs` (istniejący moduł) oraz jego wołający w web (grep po pinie: `git grep -n siegeAllowedBetween 07d2fbd72f758705f8e1d59cc4968027ffbafe75 -- gra/src`). Test behawioralny na wektorach z pinu (generator `tests/p6_w6s_siege_gen.mjs`, esbuild poza repo, nie ręcznie).
Wymóg: wołający w Rust albo jawna zależność do W8 w raporcie.
Allowlista: `rust-port/engine/src/domain/diplomacy_siege_war_gate.rs`, `rust-port/engine/src/domain/mod.rs` (tylko `pub mod`), `rust-port/engine/tests/p6_w6s_siege.rs`, `rust-port/engine/tests/p6_w6s_siege_vectors/*`, `rust-port/engine/tests/p6_w6s_siege_gen.mjs`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-W6S-SIEGE-GATE-Q1/**`. ZAKAZ: gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock.
Kryteria, bramki i format raportu jak w R-RUSTPORT-P6-W6S-LOCKS-Q1 (test `p6_w6s_siege`).
Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo.
