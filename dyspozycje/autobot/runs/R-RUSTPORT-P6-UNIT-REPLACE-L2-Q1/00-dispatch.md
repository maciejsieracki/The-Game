# DISPATCH — R-RUSTPORT-P6-UNIT-REPLACE-L2-Q1 (UNIT-REPLACE dług L-2: klucz danych; runda 1/5, Operator)
Źródło: dyspozycje/rust-port/p6/P6-REPIN-UNIT-REPLACE.md §3 L-2 (zmierzone).
Baza: origin/rust-port/parity-v2 = 8bb118dc7. Pin web: 07d2fbd72f758705f8e1d59cc4968027ffbafe75.
Problem: klucz `ai_zamiana_jednostek_limit_udzial` (web gra/data/ai-params.json, wartość 0,1, sekcja §9) NIEOBECNY w rust-port/engine/data/ai-params.json.
GOAL: dodać klucz z wartością z pinu (0,1) do danych Rust, z wczytaniem przez loader parametrów (tak jak inne klucze ai-params); test behawioralny: wczytany parametr = wartość z pinu i jest używany przez load_ai_unit_replace_max_fraction (zamiast wartości domyślnej).
Allowlista: rust-port/engine/data/ai-params.json; rust-port/engine/src/domain/ai_era_unit_promotion.rs lub moduł wczytania parametru zamiany (tylko jeśli konieczne do podpięcia klucza; wymień plik w raporcie); rust-port/engine/tests/p6_unit_replace_l2.rs (nowy); dyspozycje/autobot/runs/R-RUSTPORT-P6-UNIT-REPLACE-L2-Q1/**. ZAKAZ: gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock (nie commitować), inne pliki domain/.
Bramki: cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test --lib; cargo test --test p6_unit_replace_l2 (EXIT zapisany).
Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo (usuń po bramkach). Raport 01-operator-r1.md.
