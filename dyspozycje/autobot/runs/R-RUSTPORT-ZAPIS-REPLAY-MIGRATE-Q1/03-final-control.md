STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-REPLAY-MIGRATE-Q1
GOAL: kazdy snapshot z replayu przechodzi przez migrate_on_load; raport migracji dostepny
ZMIANY/COMMIT: SHA koncowy 92c185edd489c1459b3047d7981bac7545a95ed0 (potomek 17607e6f7 -> potomek bazy 8bb118dc7 = tip origin/rust-port/parity-v2). Pliki: replay.rs, tests/p6_zapis_replay_migrate.rs, 01-operator-r1.md, 02a-obrona.md (allowlista OK; Cargo.lock untracked, niecommitowany).
TESTY (odtworzone przez FC, EXIT 0): fmt --check; clippy --all-targets -D warnings; test --lib 28 passed; testy p6_zapis_replay_migrate 6, p6_zapis_loader_migrate 4, p6_zapis_era_zapisu 8, replay 6. git diff --check czysty. Test przeciwny FC (usuniecie migrate_on_load w ReplayStep::deserialize): 5/6 FAILED; mutacja cofnieta.
WERDYKT ZARZUTOW: 1 raport migracji -> ODDAL (naprawione przez load_json_with_migration_reports); 2 SaveSnapshot::Deserialize publiczny -> ODDAL (poza zakresem, osobny temat); 3 testy wielokrokowe -> ODDAL (dodany test); Cargo.lock -> ODDAL. Zero NAPRAW.
DO DECYZJI CZLOWIEKA: (a) zwykly Deserialize ReplayLog migruje, ale odrzuca raport - czy wymusic uzycie load_json_with_migration_reports; (b) osobny temat usuniecia Deserialize z SaveSnapshot; (c) zachowanie na zepsutym snapshocie przy migracji przed validate() NIE_ZMIERZONO.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora (fast-forward z parity-v2 = baza)
DEPLOY/PUSH: NIE WYKONANO
