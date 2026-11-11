STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-REPLAY-MIGRATE-Q1
GOAL: każdy snapshot wczytany z replayu przechodzi przez migrate_on_load (jak load_save_snapshot w zapis_loader.rs); raport migracji zwracany per krok.
ZMIANY/COMMIT: baza origin/rust-port/parity-v2 = fdd24d04a (tip w chwili startu). Allowlista:
  - rust-port/engine/src/domain/replay.rs: pole `migration_pending` (serde skip, poza equality), ReplayError::SnapshotsNotMigrated, ReplayLog::migrate_on_load(era) -> ReplayMigrationReports (alias Vec<(ReplaySequence, LoadMigrationReport)>), replay()/playback() odrzucają replay z niezmigrowanymi checkpointami, cfg-gated importy LoadMigrationReport i PlayerId (wzorzec jak w save_load.rs).
  - rust-port/engine/src/domain/zapis_loader.rs: helper load_replay_log_json<I: DeserializeOwned>(text, era) -> Result<(ReplayLog<I>, ReplayMigrationReports), LoadError> (deserializacja + migrate_on_load per snapshot).
  - rust-port/engine/tests/p6_zapis_replay_migrate.rs (nowy): 4 testy behawioralne.
  - dyspozycje/autobot/runs/R-RUSTPORT-ZAPIS-REPLAY-MIGRATE-Q1/01-operator-r1.md (ten raport).
  Nie zmieniano: gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock (wygenerowany lock usunięty, nie commitowany), reszta domain/, tests/replay.rs.
  SHA kodu: patrz sekcja DEPLOY/PUSH poniżej (commit na gałęzi roboczej).
TESTY:
  - cargo fmt --check: EXIT 0 (po cargo fmt zmieniono wyłącznie nowy plik testowy).
  - cargo clippy --all-targets -- -D warnings: EXIT 0 (w trakcie naprawiono type_complexity przez alias ReplayMigrationReports).
  - cargo test --lib: EXIT 0, 28 passed, 0 failed.
  - cargo test --test p6_zapis_replay_migrate --test p6_zapis_loader_migrate: EXIT 0. p6_zapis_replay_migrate: 4/4 ok (playback_yields_migrated_state, blocks_playback_without_migration, per_owner_era_and_idempotent_reload, rejects_invalid_json_without_panic); p6_zapis_loader_migrate: 4/4 ok.
  - cargo test --test replay (regresja istniejących testów replayu, poza wymaganą bramką): EXIT 0, 6 passed.
  Dowód behawioralny (kryterium 2): replay z checkpointem zawierającym 3 wodzów gracza 1 i wodza obcego (4 łącznie) wczytany przez load_replay_log_json z era=2 daje po playback().next().snapshot() wodzów [10, 11, 20] (wódz 12 zdegradowany); raport kluczowany sekwencją 0 ma demoted_generals=[12]; surowy serde-load zachowuje [10, 11, 12, 20]; surowy playback zwraca Err(SnapshotsNotMigrated).
  Kryterium 1 (git grep): w src/ brak wywołań serde_json::from_str::<SaveSnapshot> poza zapis_loader.rs (load_save_snapshot, produkcyjny, migruje od razu) i load_replay_log_json (migruje od razu). Patrz BLOKADY pkt 1.
  Test porównawczy: CARGO_TARGET_DIR poza repo (scratchpad), usunięty po bramkach.
BLOKADY:
  1. Otwarty dług w serde: derive Deserialize na ReplayLog/ReplayStep nadal deserializuje SaveSnapshot bez migracji, bo serde nie zna epoki właściciela (era_for_owner jest wymagane przez migrate_on_load). Zastosowano zabezpieczenie zamiast usunięcia: wczytany replay z checkpointami jest zablokowany do migrate_on_load (playback zwraca SnapshotsNotMigrated), a jedyna produkcyjna ścieżka to load_replay_log_json. Jeśli właściciel chce, by sam serde zwracał zmigrowany wynik, potrzebna jest decyzja o źródle epoki (np. stały parametr, era z meta zapisu) — to decyzja produktowo-liczbowa do ABC, nie wybierałem jej sam. Ocena, czy taki gating spełnia kryterium 1, należy do Final Control.
  2. Zmiana zachowania: ReplayLog wczytany z JSON z checkpointami nie da się odtworzyć (playback/replay) bez migrate_on_load. Dotychczasowe testy tego nie wymagały (tests/replay.rs tylko porównuje round-trip), ale każdy przyszły konsument musi użyć load_replay_log_json.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) + Final Control; ocena gatingu serde (BLOKADY pkt 1) i zakresu allowlisty.
DEPLOY/PUSH: NIE WYKONANO (push tylko gałęzi roboczej *-wip/*; brak push do rust-port/parity-v2, brak integracji, brak deployu).
