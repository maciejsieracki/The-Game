# DISPATCH — R-RUSTPORT-ZAPIS-KOMENTARZE-Q1 (poz. 6, dokumentacja w kodzie; etap 1/4 Operator)
Baza: origin/rust-port/parity-v2 = ca25d6fd2.
Problem: komentarze opisują stary parametr epoki (era_for_owner) i stary kontrakt: rust-port/engine/src/domain/replay.rs:37-38 i rust-port/engine/src/domain/save_migrations.rs:13 (zgłoszone przez Evaluatora ERA-Z-ZAPISU).
GOAL: poprawić WYŁĄCZNIE te komentarze, żeby opisywały aktualny kontrakt (epoka ze danych zapisu; migrate_on_load bez parametru epoki; ścieżka load_replay_log_json). Zero zmian kodu.
Kryteria: 1) diff tylko w komentarzach (git diff -- ... | grep '^[+-][^/]' pusty poza //); 2) cargo fmt --check, cargo clippy -D warnings, cargo test --lib zielone; 3) brak zmian poza allowlistą.
Allowlista: rust-port/engine/src/domain/replay.rs; rust-port/engine/src/domain/save_migrations.rs; dyspozycje/autobot/runs/R-RUSTPORT-ZAPIS-KOMENTARZE-Q1/**. ZAKAZ: wszystko inne, Cargo.lock.
Bramki: cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test --lib (EXIT zapisany).
Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo. Raport 01-operator-r1.md.
