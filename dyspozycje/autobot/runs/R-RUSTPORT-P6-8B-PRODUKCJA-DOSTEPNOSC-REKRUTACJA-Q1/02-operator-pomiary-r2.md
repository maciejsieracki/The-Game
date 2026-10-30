STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1
GOAL: Niezależna weryfikacja partii P1b-c1 (kod `ae62996d7`, raport `1c53aae00`): wektory `p1b.json` regenerowane z pinu 91dc998a, testy, gate'y fmt/clippy, mutacje na własnym worktree. Temat pozostaje OTWARTY (P1b-c2 i P2 niewykonane).
ZMIANY/COMMIT: tylko dokumentacja i run-dir: `dyspozycje/rust-port/p6/P6-8B-PRODUKCJA-DOSTEPNOSC.md` (poprawka numeracji linii web, sekcja weryfikacji r2, znane ograniczenie NFD), `dyspozycje/autobot/runs/R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1/02-operator-pomiary-r2.md`, `mut-p6-8b-p1b-c1-r2.py`, `dowody/pomiar-mutacje-p1b-c1-r2.txt`. Kod Rust NIE zmieniony (`production_units.rs` bajt w bajt jak w `ae62996d7`). Zero zmian w gra/, renderer, src-tauri, Cargo.toml, WERSJE.md. Push: nie.
TESTY:
- Generator `gen-p6-8b-p1b-vectors.mjs` na `git archive 91dc998a gra` (Node v22.22.0): zapisano p1b.json; liczniki shortfall 416, proto 2, pop 5, UNIT_POPULATION_COST 0. `cmp` z repo: IDENTYCZNE.
- `cargo test --test p6_8b_p1b_vectors`: 6 passed, 0 failed, rc 0 (log: scratchpad p6v/test-p1b.log).
- `cargo test --test p6_8b_helpers_vectors`: 18 passed, EXIT 0 (regresja P1a).
- `cargo test --lib`: 6 passed, EXIT 0.
- `cargo clippy --lib --test p6_8b_p1b_vectors --test p6_8b_helpers_vectors -- -D warnings`: EXIT 0.
- `cargo fmt --all -- --check`: EXIT 0.
- `git diff --check`: czysto (brak wyjścia, status 0).
- Mutacje (runda 2, 7 mutantów): M1 KILLED; M2 SURVIVED=EQUIV; M3 KILLED; M4 SURVIVED=EQUIV; M5 (usunięcie js_trim) KILLED; M6 (UNIT_POPULATION_COST=1.0) KILLED; M7 (usunięcie toLowerCase) KILLED. Zrodlo przywrocone bajt w bajt (restored_bytes_identical True). Rozróżnienie COMPILE-ERROR vs KILLED: wszystkie przebiegi bez błędu kompilacji.
- Brak długich pomiarów; brak run_in_background.
BLOKADY: brak dla c1. Dla c2 bez zmian względem r1: availableProduction (923–1135) i availableReplacementsFor (1136–1252) wymagają bramek miasta/surowców oraz wektorów pełnego grafu; setPaused (1990) i manpowerCostOf (1985) wymagają pól `wstrzymana`/`rekrutacja` w CityProduction i weryfikacji sygnatury unitManpowerCostForType.
RUNDY: 2/5 (runda 2 weryfikatora dla ID R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1; poprzednia runda operatora 1/5). Rozbieżność z nagłówkiem dispatchu ("RUNDA: 3/5") zgłoszona w r1, nierozstrzygana tu.
NASTĘPNY KROK: Final Control dla `ae62996d7` (kod) i tego commita dokumentacyjnego; potem Operator runda dla P1b-c2 tym samym ID; P2 dopiero po zamknięciu B3 (recruitment.rs).
DEPLOY/PUSH: NIE WYKONANO

USTALENIA WERYFIKATORA:
1. Numeracja linii web w r1 była częściowo błędna: `populationCostOf` to 1980–1982 (nie 1815–1825), `UNIT_POPULATION_COST` to 1977; `availableProduction` 923–1135, `availableReplacementsFor` 1136–1252, `manpowerCostOf` 1985, `setPaused` 1990 (zweryfikowane na pinie). Dokument tematu poprawiony; zakres 682–693 (`unitStockShortfallLabel`) poprawny.
2. Komentarz w `production_units.rs` (sekcja P1b-c1) nadal podaje 1815–1825. Tylko komentarz, bez wpływu na wynik. Odłożony do osobnej partii, żeby nie zmieniać zweryfikowanego kodu.
3. M2 i M4 są równoważne tylko przy `UNIT_POPULATION_COST = 0`; ich zabicie wymagałoby zmiany stałej, co wyłapuje M6 i test pinu.
4. Ograniczenie `strip_diacritics` (P1a, poza zakresem c1): ręczna tablica `NFD_BASE` zamiast pełnego NFD; 177 znaków BMP pominiętych. Dla Brąz/Żelazo/Drewno/Kamień bez wpływu (wektory zielone). Do rozważenia przy c2, jeśli bramki objęłyby inne surowce.
5. Założenia operatora r1 (baza parity-v2, pin 91dc998a jako źródło wektorów, klucze prototypowe jako odstępstwo przypięte testem, UNIT_POPULATION_COST=0 zamrożone) potwierdzone; nie wymagają zmiany.
