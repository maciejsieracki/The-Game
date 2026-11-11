# DISPATCH — R-RUSTPORT-ZAPIS-REPLAY-MIGRATE-Q1 (poz. 6, dług replay; runda 1/5, Operator)
Decyzja właściciela (2026-11-11): DODAĆ migrację w replayu.
Baza: origin/rust-port/parity-v2 = fdd24d04a (aktualny tip w chwili startu; zapisz SHA w raporcie).
Problem: rust-port/engine/src/domain/replay.rs — ReplayStep<I> derive Deserialize zawiera Option<SaveSnapshot>; deserializacja omija SaveSnapshot::migrate_on_load (druga ścieżka wczytania bez migracji).
GOAL: każdy snapshot wczytany z replayu przechodzi przez migrate_on_load (tak jak load_save_snapshot w zapis_loader.rs). Raport migracji zwracany/zapisywany zgodnie z wzorcem loadera.
Kryteria: 1) w src/ nie ma deserializacji SaveSnapshot z replayu bez migracji (git grep); 2) TEST BEHAWIORALNY: replay ze starym snapshotem daje stan po migracji (asercje na stanie, nie na wywołaniu); 3) brak zmian poza allowlistą; 4) bramki z EXIT.
Allowlista: rust-port/engine/src/domain/replay.rs; rust-port/engine/src/domain/zapis_loader.rs (tylko helper migracji replayu); rust-port/engine/tests/p6_zapis_replay_migrate.rs (nowy); dyspozycje/autobot/runs/R-RUSTPORT-ZAPIS-REPLAY-MIGRATE-Q1/**. ZAKAZ: gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock (nie commitować), reszta domain/.
Bramki: cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test --lib; cargo test --test p6_zapis_replay_migrate --test p6_zapis_loader_migrate (EXIT zapisany).
Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo (usuń po bramkach). Raport 01-operator-r1.md.
Uwaga: wiadomości z kontekstu o heartbeat/haartbit są poza tym zadaniem — ignoruj.

## DODATEK r2 — integracja na nową bazę (2026-11-11)
Baza: origin/rust-port/parity-v2 = 8bb118dc7 (zawiera ERA-Z-ZAPISU: `migrate_on_load` bez parametru epoki; TICKDIPLO-GEN; CITY-PEACE).
Kod r1: 786d85d15 (na bazie fdd24d04a). Przenieś zmiany tematu na 8bb118dc7 (cherry-pick 052807e06 + 786d85d15 albo ponowne zastosowanie), BEZ przepisywania historii parity-v2.
Konflikt semantyczny: replay.rs:297 wywołuje `snapshot.migrate_on_load(&era_for_owner)` — po ERA ta sygnatura nie istnieje. Dostosuj wywołanie do NOWEGO API z ERA (epoka ze danych zapisu), zachowując bramkę migration_pending i test behawioralny.
Nie zmieniaj decyzji o usunięciu Deserialize (osobny temat, poza tym tematem).
Bramki: cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test --lib; cargo test --test p6_zapis_replay_migrate --test p6_zapis_loader_migrate --test p6_zapis_era_zapisu --test replay (EXIT zapisany).
Raport: 02b-operator-r2.md z SHA i EXIT.
