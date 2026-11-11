# DISPATCH — R-RUSTPORT-ZAPIS-SAVELOAD-KOMENTARZ-Q1 (zadanie 6: przestarzały komentarz w save_load.rs; runda 1/5, Operator)
Baza: origin/rust-port/parity-v2 = 82c57a412.
Problem: komentarz w rust-port/engine/src/domain/save_load.rs (~750-753) mówi, że Rust nie ma dziś loadera plików; od ZAPIS-LOADER-MIGRATE istnieje zapis_loader.rs::load_save_snapshot (z migracją), a po SAVESNAPSHOT-DESER SaveSnapshot ma prywatny typ wire.
GOAL: poprawić WYŁĄCZNIE komentarze opisujące wczytywanie w save_load.rs, żeby odpowiadały aktualnemu kodowi (load_save_snapshot jako jedyna publiczna ścieżka; brak publicznego Deserialize). Zero zmian kodu.
Kryteria: 1) diff tylko w komentarzach (git diff | grep '^[+-]' bez linii //, /// , //! ma być pusty poza nagłówkami); 2) fmt --check, clippy -D warnings, cargo test --lib zielone; 3) brak zmian poza allowlistą.
Allowlista: rust-port/engine/src/domain/save_load.rs (tylko komentarze); dyspozycje/autobot/runs/R-RUSTPORT-ZAPIS-SAVELOAD-KOMENTARZ-Q1/**. ZAKAZ: gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock.
Bramki: cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test --lib (EXIT zapisany). df -h / ≥ 8 GB. Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo. Raport 01-operator-r1.md.
