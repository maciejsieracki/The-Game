STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1 (pozostaje OTWARTY; P1b-c2 i P2 niewykonane)
GOAL: Final Control partii P1b-c1 (unitStockShortfallLabel, populationCostOf/UNIT_POPULATION_COST) po odpowiedzi Operatora r3.
ZMIANY/COMMIT: ten plik (dokument Final Control). Weryfikowany stos: `ae62996d7`, `1c53aae00`, `fddc1ef49`, `08d7405db`.
TESTY (detached HEAD 08d7405db, CARGO_INCREMENTAL=0):
- cargo test --test p6_8b_p1b_vectors: 7 passed
- cargo test --test p6_8b_helpers_vectors: 18 passed
- cargo test --lib: 6 passed
- cargo clippy --lib --test p6_8b_p1b_vectors --test p6_8b_helpers_vectors -- -D warnings: rc 0
- cargo fmt --all -- --check: rc 0
- git diff --check ae62996d7~1 HEAD: rc 0
- Generator na git archive 91dc998a gra (Node): 416 / 2 / 5, UNIT_POPULATION_COST=0; cmp z p1b.json w repo: IDENTYCZNE
- Allowlista: wyłącznie production_units.rs, tests/p6_8b_p1b_vectors.rs, tests/p6_8b_vectors/p1b.json, dokument tematu, run-dir. Zero zmian w gra/, renderer, src-tauri, Cargo.toml, WERSJE.md.
- Numeracja 1815-1825 usunięta z kodu i generatora (grep pusty).

ZARZUTY (rozstrzygnięcie):
1. Numeracja web w komentarzu/generatorze: ODDAL (naprawione w 08d7405db, zweryfikowane).
2. "4 testy FAILED" vs 3 nazwy: ODDAL (skorygowane w r2/r3, dowód pomiar-mutacje-p1b-c1-r3.txt).
3. Ograniczenie wektorów M2/M4 (UNIT_POPULATION_COST=0): ODDAL (opisane w dokumencie tematu, chroni M6 i test pinu).
4. Licznik rund: ODDAL (założenie: licznik orkiestratora, 3/5).
5. strip_diacritics BMP: ODDAL (test strip_diacritics_bmp_matches_web przypina 11 172 Hangul + 173 inne; przeczytany, logika poprawna).
6. git diff --check: ODDAL (rc 0 zweryfikowane samodzielnie).
Brak NAPRAW, brak DO DECYZJI CZŁOWIEKA.

BLOKADY: brak dla c1. c2 (availableProduction, availableReplacementsFor, setPaused, manpowerCostOf) niewykonane; P2 po zamknięciu B3 (recruitment.rs).
RUNDY: 3/5 (licznik orkiestratora)
NASTĘPNY KROK: integracja orkiestratora (cherry-pick/merge ae62996d7..08d7405db + commit tego pliku); następnie Operator P1b-c2, ten sam ID.
KOLEJNOŚĆ: baza stosu be924f64f; origin/rust-port/parity-v2 = d7f72e70b (potomek be924f64f). Różnica be924f64f..d7f72e70b w rust-port/engine to wyłącznie pliki nowe plus 1 linia w domain/mod.rs (economy_yield), brak nakładania z plikami P1b -> integrować PO d7f72e70b (rebase/cherry-pick), a przy konflikcie w mod.rs zachować obie linie. Po integracji powtórzyć cargo test na wyniku.
DEPLOY/PUSH: NIE WYKONANO
