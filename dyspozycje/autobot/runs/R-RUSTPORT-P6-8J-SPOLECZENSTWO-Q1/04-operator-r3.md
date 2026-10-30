STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1
GOAL: Odpowiedz Operatora (obrona) na zarzuty FAIL rundy 2 (weryfikator ae5d98311): mutant I-delta, równoważność M10, brak mutacji gałęzi sterujących, brak dokumentu tematu z tabelą symboli. Odtworzono stan z ae5d98311 (dd949a1f3 + raport weryfikatora). Cel: P6.8J (society-breakdown.ts pin 91dc998a) bez zmian w gra/**, renderer, src-tauri, Cargo.toml, WERSJE.md.
ZMIANY/COMMIT:
- 0fa888832 (test/wektory/dokument): gen-p6-8j-society-vectors.mjs (RAWS +1e-17,-1e-17,5e-324; przypadki niespojnego orderu `tamper: szPctPlus7`), tests/p6_8j_vectors/society.json (1264478 B, z URUCHOMIONEGO weba 91dc998a), tests/p6_8j_order.rs (obsluga `tamper`, asercje delta===0 i netto===0 w matrix_unit), tests/p6_8j_guards.rs (nowy, 4 testy), dyspozycje/rust-port/p6/P6-8J-SPOLECZENSTWO.md (nowy, tabela 36 symboli), logs/mut-r3.log, mut-r3.py.
- fc04a6691 (rozszerzenie testu strazy o citizenResourceHappinessDelta, log 80 mutantow, runner).
- Ten raport: commit kolejny (SHA w odpowiedzi orkiestratora). Allowlista: tylko powyzsze pliki; Cargo.lock (nieslidzony, wygenerowany przez cargo) NIE dodany. Zero zmian w src/ (mutanty przywrocone git checkout po kazdym przebiegu; git status czysty w src/).
ODPOWIEDZI NA ZARZUTY:
1. I-delta (`if delta != 0.0` -> `if true`): PRZYJMUJĘ. Dowod: mutant KILLED przez matrix_unit i matrix_matches_web (logs/mut-r3.log). Poprawka: wektory raw=1e-17 / -1e-17 / 5e-324 (netto*(1+raw)==netto, delta===0 przy raw!=0 i skonczonym) oraz asercje w matrix_unit (brak linii matrycy, lines identyczne). Commit 0fa888832. Zgoda z zarzutem, ze to nie jest mutant rownowazny.
2. Równoważność M10 (usunięcie guardu `raw == 0.0`): PRZYJMUJĘ, równoważność nie jest juz przyjmowana bez dowodu. Web zwraca `order` bez zmian dla raw===0 (society-breakdown.ts:1080), a przy niespojnym orderze przelicza szPct. Dodano wektory z orderem niespojnym (base.sz.szPct += 7; raw 0, -0, 0.25, 1e-17; 96 przypadkow w matrix). Mutant M10 KILLED przez matrix_matches_web. Commit 0fa888832.
3. Brak niezaleznych mutacji gałęzi sterujących u weryfikatora (M1-M9 i pasma/pct_from_netto): PRZYJMUJĘ jako dług rundy 2 i wykonuje go Operator r3. Wykonano 80 mutantow na galeziach sterujacych order.rs, breakdown.rs, society_breakdown.rs (1 naraz, cargo test --test p6_8j_society --test p6_8j_order --test p6_8j_guards). Wynik: 64 KILLED, 9 SURVIVED (wszystkie z dowodem rownowaznosci, nizej), 7 NOMATCH (zastapione wariantami z kontekstem, ktore sa w logu). Nie wszystkie galezie zostaly zmutowane: niezmutowane pozostaja m.in. `pick_society_array` (filtr elementow tablicy, SB:244-246), `has`/palac w breakdown.rs:272-292, galezie `None` w order.rs:319 i order.rs:347, `finite_opt`/`unwrap_or` w SB:226. Zgłaszam to jako NOTE, nie jako dowod pelnego pokrycia.
4. Brak dokumentu tematu z tabela symboli: PRZYJMUJĘ w czesci (utworzono dyspozycje/rust-port/p6/P6-8J-SPOLECZENSTWO.md: 36 funkcji z pinu 91dc998a z numerami linii TS i Rust, Z-8J-7 dla podzialLuksus). ODRZUCAM utworzenie dokumentu o nazwie P6-8-MIASTA-PODZIAL.md: jest to dokument nadrzedny podzialu, nie ma go w repo ani na origin/rust-port/parity-v2, a jego tresc (§9/§11) nie jest dostepna. Pytanie do orkiestratora (Z-8J-1): czy podac wlasciwy plik nadrzedny, czy zaakceptowac tabele w P6-8J-SPOLECZENSTWO.md jako zrodlo listy symboli.
TESTY (katalog rust-port/engine, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR=/dev/shm/p6-8j-target; target poza worktree):
- cargo fmt --all -- --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --test p6_8j_society --test p6_8j_order --test p6_8j_guards: EXIT 0 (guards 4/4, order 18/18, society 8/8)
- cargo test --no-fail-fast (pelny suite): EXIT 0, passed=1526, failed=0 (r2: 1522; +4 testy guards)
- Pokrycie mutacyjne r3 (logs/mut-r3.log): KILLED 64; SURVIVED 9, dowody rownowaznosci:
  - J-maxge0 (`sz_max > 0` -> `>= 0`): max uzywany tylko w pct_from_netto, ktore mapuje max<=0 na 1; dla sz_max==0 oba warianty daja 1.
  - BD-osada-ge (`pop > 0` -> `>= 0`): legacy_osada trafia tylko do pick_osiedle_pop_bonus, a ta dla pop==0 zwraca 0 (`!(1..=4).contains`) przed odczytem fallbacku.
  - SB-round-sign (usuniety warunek `x == 0 && sign_neg`): floor(-0.0) == -0.0, wiec rounded juz jest -0; pozostale przypadki pokrywa `x < 0`.
  - SB-round-finite-false (`if !x.is_finite()` -> false w js_round): dla niefinitnych floor(x)=x, x-floor=NaN, porownanie false, zwrot x.
  - SB-p-lt1 (`p.is_nan() || p < 1` -> `p < 1`): dla NaN oba warianty daja false (NaN <= max jest false).
  - SB-wsp-gt (`wsp > 0` -> `>= 0`): dla wsp==0 w = wsp == 0 (lub -0), (1+w)^x identyczne.
  - JSMAX-B-NAN-eq / JSMIN-B-NAN-eq (pominiety test b NaN): gdy b NaN, a==b i a>b (a<b) sa false, zwrot b == NaN.
  - REF-FIN (`pop_odniesienia.is_finite()` -> true): wartosc przychodzi z load_society_scale_params (pick_society filtruje niefinitne, fallbacki stale finite), wiec NaN jest nieosiagalne z loadera i z pinowanego weba; rozni sie tylko dla recznie zbudowanej struktury z NaN. Rownowaznosc na osiagalnych wejsciach.
- 7 NOMATCH: BD-stolica-neg (-> -happy/-law), BD-osiedle-false (-> -sz/-pr), BD-osiedle-false-happy, SB-finite-false (-> SB-round-finite-false), SB-era-empty (-> -ctx), SB-era-finite (-> -max/-kult), SB-clamp-finite (-> -ctx). Wszystkie warianty z kontekstem: patrz log.
- Zabite przez nowe testy: SB-jsmax-sign / SB-jsmin-sign / SB-jsmax-ret-a (js_max_min_signed_zero_like_math), SB-truthy / SB-truthy-nan-kept / CIT-NAN-keep (nan_and_zero_inputs_are_falsy_no_line), SB-era-empty-ctx / SB-era-finite-max / SB-era-finite-kult (era_table_nonfinite_or_empty_use_same_fallback), SB-round-ge (wektory breakdown/matrix/por_pct), I-delta, M10 (wektory).
- Zrodla testow: vectors 1264478 B (<10 MB); generator uruchomiony na git archive 91dc998a (gra/src, gra/data), Node 22, wynik zapisany w tests/p6_8j_vectors/society.json.
LOC src: society_breakdown.rs 539, breakdown.rs 349, order.rs 365 (<=600; bez zmian w src). Testy: p6_8j_order.rs ok. 670 (wyjatek testowy).
BLOKADY: Brak technicznych. Otwarte decyzje dla orkiestratora: Z-8J-1 (dokument nadrzedny P6-8-MIASTA-PODZIAL.md nieobecny); niezmutowane galezie wymienione w pkt 3 (NOTE).
RUNDY: 3/5 (runda 2 = FAIL; ta odpowiedz = runda 3, ten sam ID).
NASTĘPNY KROK: Evaluator r3 (weryfikacja nowych wektorow, testow guards, logu mutacji i dowodow rownowaznosci), potem Final Control. Integracja i push wykluczone na tym etapie.
DEPLOY/PUSH: NIE WYKONANO
