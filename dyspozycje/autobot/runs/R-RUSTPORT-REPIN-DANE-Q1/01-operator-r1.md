STATUS: BLOCK (techniczny: 56 testow czerwonych po podmianie danych; krok 1a wykonany, 1b-1e w rundzie 2)
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-DANE-Q1
GOAL: krok 1 odswiezenia portu do 91dc998a (4 kopie bajtowe engine/data, przeliczenie derived i wektorow czerwonych, bez osłabiania testów).
ZMIANY-COMMIT: commit 44a24509 (4 pliki `rust-port/engine/data/{civs,units,econ-params,ui-params}.json` = sha256 91dc998a, bajtowo). Commit z raportem: SHA w `git log -1` tej gałęzi (dokument `dyspozycje/rust-port/REPIN-DANE-20261029.md` + logi w tym katalogu). Baza: `bb74ff9d` (origin/rust-port/parity-v2, detached). Brak zmian `.rs`, `gra/**`, `Cargo.toml`, `WERSJE.md`. Nie pushowano. `Cargo.lock` lokalny, niecommitowany.
TESTY:
- baza (HEAD bb74ff9d, przed podmiana): `cargo test --locked --all-targets --no-fail-fast` passed 1207, failed 0, EXIT=0 (`test-baseline-r1.log`).
- po podmianie 4 plików: passed 1151, failed 56, EXIT=101 (suma 1207 = baza, zero usunietych) (`test-after-swap-r1.log`).
- `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0 (`clippy-r1.log`).
- `cargo fmt --all -- --check`: EXIT=0 (`fmt-r1.log`). `git diff --check`: wykonany przed commitem (czysty).
- Czerwone grupy (dowod i przyczyny w REPIN-DANE-20261029.md §2a): A civs schema (web usunął `Bonus startowy`, `Bonusy/minusy`, `bonusy`, `mnoznikHandelPieniadz`; ~50 testow w 10 binariach); B econ schema (`targowisko_praca_na_pieniadz_mnoznik` usuniety, `targowisko_praca_na_podatek_kurs` dodany; 4 testy); C units/derived (Rydwan woly: epoka, surowiec; 5 testow); D pin-hash (3 testy, stala pinu w tescie); E diakrytyki (1 test).
BLOKADY:
- Zmiana logiki (osobne tematy, NIE wykonane): (1) bonusy cywilizacji przeniesione z `civs.json` do innego zrodla webu (`civ-bonuses.ts` +106/-98); (2) Mennica: mnoznik tylko podatku, nie handlu; wartosci 1.62/1.38 (`econ-params.json`).
- Przeliczenie derived (0/5 wykonane): `unit-stock-costs.json`, `unit-food.json`, `unit-gold-costs.json`, `unit-gold-states.json`, `storage-caps.json` — wymaga generatora z uruchomionego weba `91dc998a`.
- Regeneracja wektorow `tests/*_vectors/*.json` (0 wykonane) i aktualizacja stałej hash pinu w testach: runda 2.
- Nie zmierzono: czy ui-params (2 nowe wpisy) wymaga zmian w Rust poza testami.
RUNDY: 1/5 (zuzyte 1; ostatni werdykt: BLOCK; decyzja wymagana: nie — zalecany podzial rundy 2 na: schemat civs+econ (tylko pola strukturalne), units/derived regen, wektory regen; logika (B-1, B-2) jako osobne tematy).
NASTEPNY KROK: runda 2 tego tematu (Operator-impl): naprawa schematu (`src/data/civilizations.rs:44-70`, `src/data/economy_society.rs:172-173`) minimalnie do parsowania, potem regeneracja wektorow z `91dc998a` i przeliczenie 5 derived; kryterium: 0 czerwonych bez osłabiania testów.
DEPLOY/PUSH: NIE WYKONANO
