# 02a-obrona — R-RUSTPORT-ZAPIS-REPLAY-MIGRATE-Q1 (Operator, obrona r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-REPLAY-MIGRATE-Q1
GOAL: każdy snapshot wczytany z replayu przechodzi przez `migrate_on_load`; raport migracji zwracany zgodnie ze wzorcem loadera.
ZMIANY/COMMIT: SHA kodu obrony — patrz sekcja „SHA" na dole. Allowlista: `rust-port/engine/src/domain/replay.rs`, `rust-port/engine/tests/p6_zapis_replay_migrate.rs`, `dyspozycje/autobot/runs/R-RUSTPORT-ZAPIS-REPLAY-MIGRATE-Q1/**`. Poza allowlistą: brak. `zapis_loader.rs` nietknięty (nie był potrzebny).
TESTY: patrz sekcja „Bramki" niżej.
BLOKADY: brak blokad kodowych. Pozostałe uwagi w „Odpowiedzi na zarzuty" (punkt 2 i 3b — zakres poza tematem / świadomie nieobjęte).
RUNDY: 1/5 (obrona w rundzie 1 operatora; wynik nie zużywa nowej rundy Evaluatora poza standardowym obiegiem).
NASTĘPNY KROK: Evaluator r2 na SHA z sekcji „SHA"; ewentualna decyzja orkiestratora o zakresie pozostałego publicznego `Deserialize` (osobny temat).
DEPLOY/PUSH: NIE WYKONANO (Operator nie pushuje; push tylko na osobną autoryzację).

## Odpowiedzi na zarzuty

### 1. Raport migracji gubiony w replayu — PRZYJMUJĘ
Poprawka: dodano kanał raportu. Nowa funkcja `ReplayLog::load_json_with_migration_reports(text)` zwraca `(ReplayLog<I>, Vec<ReplayStepMigration>)`, gdzie `ReplayStepMigration { sequence, report: LoadMigrationReport }` jest zwracany dla każdego kroku z snapshotem (ten sam kształt co `zapis_loader::load_save_snapshot`, czyli raport zawsze, także pusty). Funkcja deserializuje surowe kroki (`ReplayStepWire`, `SaveSnapshot` bez migracji), migruje każdy snapshot raz, zbiera raport i waliduje log. Brak podwójnej migracji.
Dowód: test `p6_zapis_replay_returns_migration_report` (raport `demoted_generals == [12]`, stan po migracji `[10, 11, 20]`) oraz test wielokrokowy `p6_zapis_replay_migrates_every_snapshot_in_multi_step_log` (raporty tylko dla kroków 0 i 2, `demoted` = `[12]` oraz `[11, 12]`).
Zastrzeżenie: zwykły `Deserialize` (`serde_json::from_str::<ReplayLog>`) nadal migruje, ale raport odrzuca — to świadome, bo `Deserialize` nie ma kanału na raport. Produkcyjne wczytanie replayu powinno iść przez nową funkcję. Decyzja orkiestratora o usunięciu `Deserialize` pozostaje poza tematem (patrz punkt 2).

### 2. Publiczny `SaveSnapshot::Deserialize` bez migracji — ODRZUCAM (poza zakresem, dowód)
Dispatch wprost wyłącza to z tematu: „Nie zmieniaj decyzji o usunięciu Deserialize (osobny temat, poza tym tematem)" oraz „reszta domain/" jest poza allowlistą. Zmiana `SaveSnapshot::Deserialize` dotknęłaby `save_load.rs`, którego nie ma na allowliście.
Dowód zakresu: `git grep "from_str::<SaveSnapshot>"` daje w `src/` tylko komentarze (`save_load.rs:755`, `zapis_loader.rs:3`), a surowe wywołania w `tests/save_load.rs:127-157` to asercje `is_err()` na zepsutych danych. Ścieżka replayu nie wystawia już surowego snapshotu: `ReplayStep` migruje w `Deserialize` i w nowej funkcji.

### 3a. Testy tylko z jednym krokiem i jednym snapshotem — PRZYJMUJĘ
Dodano `p6_zapis_replay_migrates_every_snapshot_in_multi_step_log`: trzy kroki (snapshot epoka 2, krok bez snapshotu, snapshot epoka 1 z innym wynikiem). Asercje na stanie każdego kroku i na raportach; plus porównanie z `Deserialize` (`assert_eq!(plain, log)`).

### 3b. Migracja przed `validate()` logu — ODRZUCAM jako defekt, NIE_ZMIERZONO dla danych zniekształconych
Kolejność (migracja kroku → `validate()` logu) jest zamierzona: walidacja sprawdza stan już po migracji, tak jak produkcyjny loader migruje przed użyciem. Nie zmieniano kolejności. NIE_ZMIERZONO: zachowanie migracji na celowo zepsutym snapshotie (np. panika w `migrate_loaded_state`) nie było testowane; to temat osobny, nie ten.

### 4. `Cargo.lock` untracked — PRZYJMUJĘ (bez zmiany kodu)
`rust-port/engine/Cargo.lock` jest untracked i NIE jest dodawany do commita (`git add` tylko trzech plików). Weryfikacja po commicie: `git show --stat` nie zawiera `Cargo.lock`.

### 5. Bramki odtworzone — PRZYJMUJĘ (potwierdzone po poprawce)
Wszystkie bramki powtórzone na kodzie po poprawce, patrz niżej.

### Test przeciwny — wykonany
Mutacja: w `ReplayStep::deserialize` usunięto `snapshot.migrate_on_load()`. Wynik `cargo test --test p6_zapis_replay_migrate`: 5 z 6 testów FAILED, EXIT 101 (padły wszystkie testy idące przez `Deserialize`; przeszedł tylko `p6_zapis_replay_returns_migration_report`, bo idzie przez nową funkcję). Mutacja cofnięta; `grep MUTANT` = 0.

## Bramki (po poprawce, katalog `rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_TARGET_DIR=/tmp/claude-0/rp-obrona-target`)
- `cargo fmt -- --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --lib`: EXIT 0 (28 passed)
- `cargo test --test p6_zapis_replay_migrate --test p6_zapis_loader_migrate --test p6_zapis_era_zapisu --test replay`: EXIT 0 (6+4+8+6 passed)
- `git diff --check`: czysty

Naprawiono po drodze: `tests/replay.rs` włącza `replay.rs` przez `#[path]` bez modułu `save_migrations`, więc import `LoadMigrationReport` rozdzielono `#[cfg(not(test))]` / `#[cfg(test)]` (wzorzec z `save_load.rs`).

## SHA
Baza: `origin/rust-port/parity-v2` = 8bb118dc7 (zawiera ERA). Kod r1 (poprzedni): 17607e6f7. Kod obrony: SHA w commicie na gałęzi `R-RUSTPORT-ZAPIS-REPLAY-MIGRATE-Q1-wip/operator-r1` (lokalnie, bez push), patrz wpis końcowy w odpowiedzi operatora.
