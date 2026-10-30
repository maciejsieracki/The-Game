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

---

## Runda 4 — Final Control P1b-c2 (c2a/c2b/c2c) @ 966adeebb

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1 (pozostaje OTWARTY; P2 -> 8B2 po zamknieciu B3)
GOAL: Final Control P1b-c2 po obronie Operatora (966adeebb, parent 9b370ca08).
ZMIANY/COMMIT: ten plik. SHA do integracji: 966adeebb (stos: 9040d3bca, 88991f78b, fbd9faf12, 8aedd7b1d, 9b370ca08, 966adeebb).

WERYFIKACJA WLASNA (detached 966adeebb, CARGO_INCREMENTAL=0):
- fmt --check: 0; clippy --lib + 3 testy c2 -D warnings: 0.
- testy: c2a 5/5, c2b 6/6, c2c 3/3, helpers 18/18, p1b 7/7, lib 6/6.
- gen-p6-8b-c2-icu-nan.mjs: EXIT 0; wygenerowane pliki (42 039 par ICU, 400+400 przypadkow V8) identyczne z repo (git status czysty).
- Diff 9b370ca08..966adeebb: tylko production_units.rs, testy c2b/c2c, 3 JSON, dokument tematu, run-dir. Brak zmian gra/, renderer, src-tauri, Cargo.toml, WERSJE.md. git diff --check czysty.
- Komparatory Rust vs web (production.ts 91dc998a l.1100-1104, 1240-1243): `a.koszt !== b.koszt` -> NaN!==NaN=true -> zwrot NaN (=0 w sort); Infinity===Infinity -> localeCompare. Rust: NaN -> Equal bez tie-breaku; rowne (w tym Inf) -> nazwa. Zgodne.
- Logi pomiar-r4o-*: 15/15 maja linie EXIT; mutacje: B16, B16b, B20, M14, M16 KILLED; jedyny SURVIVED B17 (rownowaznik z kodu).

ZARZUTY EVALUATORA (rozstrzygniecie):
1. Sortowanie NaN: ODDAL (naprawione i zweryfikowane: komparator 1:1 z webem, js_array_sort_by bez paniki, wektory V8).
2. Mutant B16: ODDAL (zabity testem production_item_order_is_input_order_independent).
3. Mutant M14: ODDAL (stary poziom 2 bledny wobec ICU, usuniety; test 42 039 par ICU; M14/M16 zabite).
4. Logi bez EXIT / pusty fmt-check / B20: ODDAL (pomiar-r4o-* z EXIT; B20 wykonany i zabity; r4v historyczne).
5. Metryka 21/23: ODDAL (poprawiona: 23 KILLED z 24 = B1-B23 + B16b; B17 rownowaznik).

ZALOZENIA/OGRANICZENIA (nie blokuja): zgodnosc NaN-sort dla n<64 (osiagalnosc NaN w danych niezmierzona); wielkosc liter przy nazwach z diakrytykami poza units.json NIE_ZMIERZONO. Zadne nie jest decyzja produktowa.

BLOKADY: brak.
RUNDY: 4/5
NASTEPNY KROK: integracja orkiestratora stosu c2 do 966adeebb (+ commit tego pliku) na origin/rust-port/parity-v2 (a83ae51d6; merge-base e03a10fdb). Od merge-base parity-v2 nie zmienilo production_units.rs, domain/mod.rs ani tests/p6_8b_vectors -> brak nakladania; po integracji powtorzyc cargo test. Potem 8B2 (P2) po zamknieciu B3.
DEPLOY/PUSH: NIE WYKONANO
