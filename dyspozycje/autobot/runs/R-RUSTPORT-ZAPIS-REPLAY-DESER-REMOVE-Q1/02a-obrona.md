STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-REPLAY-DESER-REMOVE-Q1
GOAL: usunięcie derive/impl Deserialize z ReplayLog i ReplayStep; wejście replayu z JSON wyłącznie przez ReplayLog::load_json_with_migration_reports; testy replay i p6_zapis_replay_migrate przepięte i zielone; test behawioralny (kompilacja) na brak Deserialize.
ZMIANY/COMMIT:
- Kod obrony (zarzut 1): f6fd8430c, na bazie af19a9701 (kod operatora daacaa9af + doctesty). Zmiana tylko w rust-port/engine/src/domain/replay.rs (allowlista): doc-komentarze z doctestami compile_fail,E0277 na ReplayLog i ReplayStep. Bez zmian w Cargo.toml, Cargo.lock, gra/, save_load.rs.
- Raport obrony: 02a-obrona.md (ten plik), commit osobny na gałęzi lokalnej R-RUSTPORT-ZAPIS-REPLAY-DESER-REMOVE-Q1-wip/operator-r2, NIE wypchnięty.
- Kod operatora r1: daacaa9af08462d7a3e34845040ccb355eaee0d6 (jest przodkiem f6fd8430c; diff --stat: replay.rs, tests/p6_zapis_replay_migrate.rs, tests/replay.rs).
- Baza: ca25d6fd2 (origin/rust-port/parity-v2). Nie pushowano, nie integrowano.
TESTY (odtworzone na f6fd8430c, CARGO_TARGET_DIR poza repo, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0):
- cargo fmt --check: EXIT 0.
- cargo clippy --all-targets -- -D warnings: EXIT 0.
- cargo test --lib: EXIT 0, 28 passed.
- cargo test --test replay --test p6_zapis_replay_migrate --test p6_zapis_loader_migrate: EXIT 0 (replay 6 passed, p6_zapis_replay_migrate 6 passed, p6_zapis_loader_migrate 4 passed).
- cargo test --doc replay (nowe): EXIT 0, 2 passed: "domain::replay::ReplayLog (line 167) - compile fail ... ok" i "domain::replay::ReplayStep (line 38) - compile fail ... ok". Doctesty z kodem E0277 są ścisłe: przechodzą tylko przy błędzie braku implementacji DeserializeOwned, nie przy literówce.
- Grep: brak #[ignore] w trzech przepiętych plikach. Brak derive/impl Deserialize na ReplayLog i ReplayStep w src/domain/replay.rs (pozostałe Deserialize to wewnętrzne ReplayStepWire i ReplayRawWire, bez publicznego dostępu). Brak from_str::<ReplayLog>/ReplayStep poza testami. Poza replay.rs odwołują się tylko tests/replay.rs i tests/p6_zapis_replay_migrate.rs.
- Cargo.lock wygenerowany przez cargo został usunięty; nie jest w commicie.
- CARGO_TARGET_DIR usunięty po bramkach (patrz sprzątanie niżej).

ODPOWIEDZI NA ZARZUTY:
1. GOAL 4 bez testu compile-fail: PRZYJMUJĘ. Poprawka: f6fd8430c. Zamiast trybuild (wymagałby zmiany Cargo.toml, poza allowlistą) dodano doctesty compile_fail,E0277 na ReplayLog i ReplayStep w replay.rs. Dowód: cargo test --doc replay EXIT 0, 2 passed. Zarzut zamknięty dla obu typów z GOAL 4. Notka: ścieżka runtime nie jest osobno testowana, bo wczytanie bez migracji nie istnieje jako API; kompilacja jest jedynym mechanizmem, zgodnie z GOAL 4 ("kompilacja lub błąd w runtime").
2. Nieistniejąca funkcja load_replay_log_json w dispatchu: PRZYJMUJĘ jako błąd nazwy w dispatchu, bez zmiany kodu. Faktyczna i jedyna ścieżka to ReplayLog::load_json_with_migration_reports (replay.rs, z raportem ReplayStepMigration). Wymóg intencji dispatchu (jedyna ścieżka z migracją i raportem) jest spełniony. 00-dispatch.md nie został poprawiony (zostaje jako zapis historyczny).
3. Helper load_replay w tests/replay.rs odrzuca raport migracji: ODRZUCAM jako lukę pokrycia. Dowód: tests/p6_zapis_replay_migrate.rs, test p6_zapis_replay_returns_migration_report (linie ok. 177-188) asertuje reports.len()==1, reports[0].sequence==0 i demoted_generals; test p6_zapis_replay_migrates_every_snapshot_in_multi_step_log (linie ok. 219-228) asertuje sekwencje raportów i demoted per krok. Helper w tests/replay.rs sprawdza round-trip i komunikaty błędów wersji/sekwencji, nie raporty migracji, więc raport nie jest tam potrzebny do pokrycia.
4. Odtworzone bramki: ODRZUCAM jako wątpliwość; nie ma sprzeczności. Wszystkie wyniki w sekcji TESTY są odtworzone na f6fd8430c (fmt 0, clippy 0, lib 28 passed, integracyjne 4/6/6, doctest 2 passed).
5. Brak #[ignore], asercje nieosłabione, zmiana punktu wejścia: ODRZUCAM jako brak dowodu do usunięcia; potwierdzam: grep po tests/ nie znajduje #[ignore] w przepiętych plikach, te same komunikaty błędów (missing version, unsupported replay version 99, expected replay sequence 0, found 1) pozostają w asercjach.
6. Zakres plików i brak Cargo.toml/Cargo.lock/gra/save_load.rs/W8: ODRZUCAM jako brak problemu. Commit daacaa9af i obrona f6fd8430c zmieniają tylko replay.rs i testy z allowlisty oraz runs/. Brak zależności od W8 w grep po repo.
7. Raport 02-evaluator.md i commit af19a9701 bez push: ODRZUCAM jako brak problemu, potwierdzam: nic nie wypchnięto.

NIE_ZMIERZONO: brak. Test runtime "wczytanie bez migracji" nie istnieje jako osobne API, więc nie został napisany; objęty kompilacją (patrz zarzut 1).

BLOKADY: brak. Notka: nie wykonano push i integracji (zakaz dla Operatora). Gałąź R-RUSTPORT-ZAPIS-REPLAY-DESER-REMOVE-Q1-wip/operator-r2 jest lokalna.
RUNDY: 2/5 (obrona po Evaluatorze r1, który zgłosił zarzuty bez FAIL; zarzut 1 wymagał poprawki). Decyzja właściciela: nie wymagana.
NASTĘPNY KROK: Evaluator r2 na f6fd8430c (sprawdzić doctesty compile_fail i wynik cargo test --doc), potem Final Control, potem integracja orkiestratora (sprawdzić merge-base --is-ancestor f6fd8430c nad SHA do integracji).
DEPLOY/PUSH: NIE WYKONANO
