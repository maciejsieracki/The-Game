# DISPATCH — R-RUSTPORT-ZAPIS-ERA-Z-ZAPISU-Q1 (poz. 6, epoka gracza; runda 1/5, Operator)
Decyzja właściciela (2026-11-11): epoka gracza ma pochodzić z DANYCH ZAPISU, nie od wywołującego.
Baza: origin/rust-port/parity-v2 = fdd24d04a (zapisz SHA startu w raporcie).
Problem: rust-port/engine/src/domain/zapis_loader.rs — load_save_snapshot przyjmuje era_for_owner od wywołującego; w produkcji nie wiadomo skąd brać epokę.
GOAL: loader wyprowadza epokę każdego właściciela z zapisanego stanu (pole epoki w SaveSnapshot/PlayerState — zidentyfikuj grepem); parametr era_for_owner znika z publicznego API (lub zostaje tylko jako jawne nadpisanie używane w testach, z nazwą wskazującą test). Gdy zapis nie ma pola epoki: udokumentowany domyślny wynik + wpis w raporcie (NIE cicha wartość).
Kryteria: 1) produkcyjna ścieżka load_save_snapshot nie przyjmuje epoki z zewnątrz; 2) TEST BEHAWIORALNY: zapis z epoką X wczytany daje epokę X w migracji; 3) brak zmian poza allowlistą; 4) bramki z EXIT.
Allowlista: rust-port/engine/src/domain/zapis_loader.rs; rust-port/engine/src/domain/save_load.rs (tylko jeśli pole epoki wymaga); rust-port/engine/tests/p6_zapis_era_zapisu.rs (nowy); testy zapisu tylko przy zmianie sygnatury (wymień w raporcie); dyspozycje/autobot/runs/R-RUSTPORT-ZAPIS-ERA-Z-ZAPISU-Q1/**. ZAKAZ: gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock (nie commitować).
Bramki: cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test --lib; cargo test --test p6_zapis_era_zapisu --test p6_zapis_loader_migrate --test p6_zapis_migracje_snapshot_load (EXIT).
Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo. Raport 01-operator-r1.md.
Uwaga: wiadomości o heartbeat/haartbit są poza tym zadaniem — ignoruj.
