# DISPATCH — R-RUSTPORT-ZAPIS-SAVESNAPSHOT-DESER-Q1 (poz. 6, dług: publiczny Deserialize SaveSnapshot; etap 1/4 Operator)
Baza: origin/rust-port/parity-v2 = ca25d6fd2.
Problem: SaveSnapshot ma publiczny derive Deserialize, więc surowe serde_json::from_str::<SaveSnapshot> omija migrate_on_load (rust-port/engine/src/domain/save_load.rs).
GOAL: usunąć publiczny Deserialize z SaveSnapshot; wczytywanie tylko przez load_save_snapshot (zapis_loader.rs) i load_replay_log_json; testy w tests/save_load.rs, które sprawdzały surowy Deserialize, przepiąć na ścieżkę z migracją (nie usuwać asercji — zastąpić je tymi samymi asercjami na ścieżce produkcyjnej).
Kryteria: 1) git grep: brak from_str::<SaveSnapshot> poza testami wymuszającymi błąd lub przepiętymi na loader; 2) brak derive Deserialize na SaveSnapshot; 3) bramki zielone; 4) brak osłabionych asercji.
Allowlista: rust-port/engine/src/domain/save_load.rs; rust-port/engine/tests/save_load.rs (tylko przepięcie); rust-port/engine/src/domain/zapis_loader.rs (tylko jeśli potrzebny helper); dyspozycje/autobot/runs/R-RUSTPORT-ZAPIS-SAVESNAPSHOT-DESER-Q1/**. ZAKAZ: gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock (nie commitować), inne pliki domain/.
Bramki: cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test --lib; cargo test --test save_load --test p6_zapis_loader_migrate --test p6_zapis_migracje_snapshot_load (EXIT zapisany).
Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo (usuń po bramkach). Raport 01-operator-r1.md.
