# DISPATCH — R-RUSTPORT-P6-W6S-CITY-PEACE-Q1 (W6 wariant A, punkt 4: oferta miasta za pokój, runda 1/5, Operator)
Baza: origin/rust-port/parity-v2 = f207ea6b1. Pin web: 07d2fbd72f758705f8e1d59cc4968027ffbafe75.
GOAL: port oferty miasta za pokój AI (web: `decideAIDiplomacy` i powiązane wywołania; grep po pinie: `git grep -n "miasto_za_pokoj\|cityPeaceOffer\|decideAIDiplomacy" 07d2fbd72f758705f8e1d59cc4968027ffbafe75 -- gra/src`) do `rust-port/engine/src/domain/ai_peace_city_offer.rs` (istniejący moduł). Zakup jednostki jest w W4, NIE tutaj. Test behawioralny na wektorach z pinu (generator `tests/p6_w6s_peace_gen.mjs`, esbuild poza repo, nie ręcznie).
Wymóg: wołający w Rust albo jawna zależność do W8 w raporcie.
Allowlista: `rust-port/engine/src/domain/ai_peace_city_offer.rs`, `rust-port/engine/src/domain/mod.rs` (tylko `pub mod` jeśli potrzebne), `rust-port/engine/tests/p6_w6s_peace.rs`, `rust-port/engine/tests/p6_w6s_peace_vectors/*`, `rust-port/engine/tests/p6_w6s_peace_gen.mjs`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-W6S-CITY-PEACE-Q1/**`. ZAKAZ: gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock.
Kryteria, bramki i format raportu jak w R-RUSTPORT-P6-W6S-LOCKS-Q1 (test `p6_w6s_peace`).
Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo.
