# DISPATCH — R-RUSTPORT-P6-W6S-COOLDOWN-Q1 (W6 wariant A, punkt 3: cooldown odrzuceń, runda 1/5, Operator)
Baza: origin/rust-port/parity-v2 = f207ea6b1. Pin web: 07d2fbd72f758705f8e1d59cc4968027ffbafe75.
GOAL: port `isOfferRejectedOnCooldown` i `recordRejectedOffer` (web; klucz `miasto_za_pokoj`, cooldown 3 tury, osobny od innych kluczy) do `rust-port/engine/src/domain/diplomacy_rejection_cooldown.rs` (istniejący moduł) oraz ich wołających w web (grep po pinie). Test behawioralny na wektorach z pinu (generator `tests/p6_w6s_cooldown_gen.mjs`, esbuild poza repo, nie ręcznie).
Wymóg: wołający w Rust albo jawna zależność do W8 w raporcie.
Allowlista: `rust-port/engine/src/domain/diplomacy_rejection_cooldown.rs`, `rust-port/engine/src/domain/mod.rs` (tylko `pub mod`), `rust-port/engine/tests/p6_w6s_cooldown.rs`, `rust-port/engine/tests/p6_w6s_cooldown_vectors/*`, `rust-port/engine/tests/p6_w6s_cooldown_gen.mjs`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-W6S-COOLDOWN-Q1/**`. ZAKAZ: gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock.
Kryteria, bramki i format raportu jak w R-RUSTPORT-P6-W6S-LOCKS-Q1 (test `p6_w6s_cooldown`).
Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo.
