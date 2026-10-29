STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-LOGIKA-CIV-Q1
GOAL: Niezalezna weryfikacja wektorow p6_4 z web 91dc998a, gate'y z surowymi logami i pomiar sily testow mutacjami na aktualnym src. Bez zmian w src/testach/wektorach.
ZMIANY/COMMIT: baza `aa0efc5b` (detached, zgodnie z raportem Operatora-impl r3). Commit tej rundy dodaje wylacznie: ten raport, `mutants-pom-r3.log`, `gate-fmt-pom-r3.log`, `gate-clippy-pom-r3.log`, `gate-test-pom-r3.log`, `dowody/regen-p64-r3-web91dc998a.log`, `dowody/cmp-p64-old-vs-new-r3.log`, sekcja 6 w `dyspozycje/rust-port/p6/P6-REPIN-LOGIKA-CIV.md`. Zero zmian w `src/`, `tests/`, `gra/**`, `Cargo.toml`, `WERSJE.md`. `Cargo.lock` jest niesledzony i NIE commitowany. PUSH NIE.
TESTY:
- `cargo fmt --all -- --check`: EXIT=0 (`gate-fmt-pom-r3.log`).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`gate-clippy-pom-r3.log`). Bez `--locked`, bo brak sledzonego Cargo.lock (jawne odstepstwo).
- `cargo test --all-targets --no-fail-fast`: 1227 passed / 0 failed, EXIT=0 (`gate-test-pom-r3.log`).
- Regeneracja wektorow: `gen-p64-vectors.mjs` z runu P6.4 uruchomiony bez zmian na `git archive 91dc998a gra/src gra/data` poza repo. Wszystkie 6 JSON (core, embark, march, rally, scout, maps) BAJT-W-BAJT zgodne z repo (`dowody/regen-p64-r3-web91dc998a.log`).
- Zakres zmian wektorow (`dowody/cmp-p64-old-vs-new-r3.log`): tylko kategorie ruchu (computePath 5, computeReachable 4, moveCostFnFor 15, applyFogToPathPlan 3, truncatePathToBudget 9, planPathTurns 12, shouldStopAtObstacle 8, executeMarchStep 8 pozycji). Przyczyna zgodna z dispatchem: web `civ-bonuses.ts` ma `walka_ruch_piechota_teren_plytkie_morze` z celem `piechota` (tablica MATRIX_COMBAT_SPECS, ok. :279-281, `git show 91dc998a`).
- NIE ZAMKNIETE: niezalezny weryfikator w Pythonie nadal modeluje edb8fb56 i daje 47 rozbieznosci (`dowody/verify-p64-r3-stale-python-model.log`). Regeneracja Node uzywa tego samego generatora, wiec dowodzi powtarzalnosci, NIE niezaleznosci. Niezalezny dowod wymagalby osobnego weryfikatora. NIE_ZMIERZONO poza tym.
- Mutacje na aktualnym src (`mutants-pom-r3.log`): 20 waznych wynikow, zestaw `--lib` + 11 binarek (p6_1d_civ_bonuses, p6_1d_tables, p6_1d_city_names, p6_1e_civ_matrix, p6_1e_tables, p6_1e_civ_gaps, p6_1e_civ_names, p6_1e_js_compat, p6_4_core, p6_4_embark, p6_4_march). Baza: 0 bledow, wiec kazdy FAILED = zabicie.
  - ZABITE (15): M1, M2 (GALERA; w r2 przezyl, teraz zabity), M3, M4, M5, M6, M7, M10, M11, M12, M13, M14, M16, M18, M20 (`normalized` zamiast `to_lowercase`).
  - PRZEZYTE (5): M8, M9 (filtr `wykluczone_g1`, rownowazne PRZY DANYCH: wartosc 0 we wszystkich wierszach i brak w `zerowe_markery`; ZALOZENIE, zalezne od danych); M15 (`EGIPT_POMIJANE` `|| false`, rownowaznosc NIE_ZMIERZONO); M17 (`wyjatki_civ` nadpisanie celu `|_w|`, LUKA TESTOWA); M19 (`x == 0.0` w `civ_matrix.rs:60`, rownowazne co do znaku zera).
  - Anomalia numeracji: w logu dwa wpisy o ID 20; jeden (`civ_matrix.rs` `.filter(|v| v.is_finite())`) pominiety, bo kotwica wystepuje 2 razy. Wpis `civ_bonuses` z tym samym ID to wynik wlasciwy.
- Mutanty NIE sa commitowane w src: po kazdym mutancie plik przywracany z kopii w pamieci, koncowy `git status` pokazuje tylko nieśledzony Cargo.lock.
BLOKADY: brak twardych. Otwarte: (1) niezalezny weryfikator wektorow p6_4 (NIE ZAMKNIETE); (2) LUKA TESTOWA M17 (`wyjatki_civ` cel); (3) M15 wymaga potwierdzenia rownowaznosci przez Evaluatora.
ZALOZENIA:
- Z1: regeneracja Node z 91dc998a jest wystarczajacym dowodem zrodla wektorow (powtarzalnosc), a niezaleznosc weryfikatora jest luka do zamkniecia w kolejnej rundzie.
- Z2: M8/M9 sa rownowazne dla danych 91dc998a. Zmiana danych wymaga ponownego pomiaru.
- Z3: M19 to rownowaznosc znaku zera, nie luka.
RUNDY: 3/5 (pomiary r3 w ramach rundy 3; kod nie zmieniony).
NASTEPNY KROK: Evaluator (Sonnet) i Final Control: ocenic, czy regeneracja Node jest wystarczajaca bez niezaleznego weryfikatora (Z1), oraz czy M15/M17 wymagaja testow dopisywanych append-only. Po PASS orkiestrator integruje `repin-wip`.
DEPLOY/PUSH: NIE WYKONANO
