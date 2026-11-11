STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-SAVESNAPSHOT-DESER-Q1 (poz. 6, dług: publiczny Deserialize SaveSnapshot), runda r3 (integracja konfliktu z REPLAY-DESER-REMOVE), etap Operator
GOAL: SaveSnapshot bez publicznego Deserialize (prywatny typ wire RawSnapshot, pub(crate)); publiczne wczytanie tylko przez zapis_loader::load_save_snapshot i ReplayLog::load_json_with_migration_reports; ReplayLog/ReplayStep bez publicznego Deserialize (REPLAY-DESER z parity-v2).
ZMIANY/COMMIT:
- Baza: origin/rust-port/parity-v2 = 33cd715cf (r3 zgodnie z dodatkiem r3).
- Przeniesione cherry-pickiem commity r2: fcf102290 -> b2e685387 (kod, wariant A), c2b52266c -> 5d630f70e (raport r1). Pierwszy konflikt: rust-port/engine/src/domain/replay.rs.
- Rozwiazanie konfliktu replay.rs: strona parity-v2 (REPLAY-DESER) zachowana, czyli brak impl Deserialize dla ReplayStep; zmiana r2 (ReplayStepWire.snapshot: Option<RawSnapshot>, migracja w ReplayLog::load_json_with_migration_reports) zachowana. Usuniety wylacznie blok impl Deserialize dla ReplayStep, ktory r2 zostawil w konflikcie.
- Kryteria: (1) git grep 'from_str::<SaveSnapshot>|from_value::<SaveSnapshot>|Deserialize.*for SaveSnapshot' w rust-port: 0 trafien. (2) SaveSnapshot nie ma derive ani impl Deserialize; jedyna impl to RawSnapshot (pub(crate)). (3) bramki ponizej zielone. (4) patrz BLOKADY: jedna asercja usunieta.
- Pliki zmienione wzgledem parity-v2 (12, +178/-55): rust-port/engine/src/domain/{save_load.rs, zapis_loader.rs, replay.rs}; rust-port/engine/tests/{save_load.rs, p6_repin_wojna_2_r4_save.rs, p6_repin_wojna_3_hook.rs, p6_wire_war_state_snapshot.rs, p6_zapis_erawar_save.rs, p6_zapis_loader_migrate.rs, p6_zapis_migracje_snapshot_flags.rs, p6_zapis_migracje_snapshot_load.rs}. Wszystkie w allowliscie r3. Brak zmian w gra/**, WERSJE.md, Cargo.toml, Cargo.lock, dyspozycje poza runs/R-RUSTPORT-ZAPIS-SAVESNAPSHOT-DESER-Q1/.
- Cargo.lock: wygenerowany przez cargo, nieśledzony, NIE commitowany (usuniety po bramkach).
- Commit raportu r3: patrz SHA w odpowiedzi orkiestratora (commit po tym pliku). Brak push, brak integracji, brak zmian w rust-port/parity-v2.
TESTY (EXIT zapisany, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: EXIT 0, 37 passed, 0 failed
- cargo test --doc replay: EXIT 0, 2 passed, 0 failed (doctesty compile_fail REPLAY-DESER przechodza)
- cargo test --test save_load --test replay --test p6_zapis_loader_migrate --test p6_zapis_migracje_snapshot_load --test p6_zapis_replay_migrate --test p6_zapis_era_zapisu --test p6_repin_wojna_2_r4_save --test p6_repin_wojna_3_hook --test p6_wire_war_state_snapshot --test p6_zapis_erawar_save --test p6_zapis_migracje_snapshot_flags: EXIT 0, 11 targetow, 71 passed, 0 failed
- Logi: /home/user/clippy-r3.log, /home/user/testlib-r3.log, /home/user/testdoc-r3.log, /home/user/testint-r3.log
BLOKADY:
- Asercja usunieta (do oceny przez FC): w rust-port/engine/tests/p6_zapis_loader_migrate.rs byl `assert_eq!(generals(&raw_loaded), vec![10, 11, 12, 20])` na surowej deserializacji SaveSnapshot. Surowa sciezka nie jest juz publiczna (SaveSnapshot bez Deserialize, RawSnapshot pub(crate) i niedostepny z tests/), wiec asercja zostala zastapiona komentarzem. Dowod liczby 4 wodzow pozostaje posrednio w raporcie produkcyjnego loadera (`report.demoted_generals == [UnitId 12]`). Zmiana przewidziana w dodatku r2 ("przeformulowac na 'surowy typ wire nie jest publiczny'"). Nie jest to osłabienie innej asercji.
- Pozostale 3 linie `assert!(serde_json::from_str::<SaveSnapshot>(...).is_err())` w tests/save_load.rs zostaly przepiete na decode_snapshot_str (RawSnapshot + migrate_on_load), asercje is_err zachowane.
- Brak innych blokad.
RUNDY: 3/5 (r1 nieudana premisa: rzekomy derive Deserialize; r2 wariant A; r3 integracja konfliktu z parity-v2)
NASTĘPNY KROK: Evaluator r3 + Final Control r3 na commicie operatora r3 (zweryfikowac allowliste, brak osłabienia asercji p6_zapis_loader_migrate, cherry-pick replay.rs).
DEPLOY/PUSH: NIE WYKONANO
