STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-WOJNA-Q1 (runda 3/5, obrona Operatora na zarzuty FC r3)
GOAL: odpowiedź na każdy zarzut FC r3 (PRZYJMUJĘ z dowodem albo ODRZUCAM z dowodem); korekta błędnego zapisu w raporcie; pełny `cargo test --no-fail-fast` z dowodem liczników.
BAZA: 330c6a9ac (raport Operatora r3), worktree wf_a4483abe-c33-3 w trybie detached.

## Odpowiedzi na zarzuty

### Z1 ISTOTNY (przeniesienie r2 nadpisało wersje z parity) — PRZYJMUJĘ FAKT; DECYZJA WŁAŚCICIELA/ORKIESTRATORA
Zweryfikowane:
- `git show 003d53f97:rust-port/engine/tests/p6_cred_wojna_vectors.rs` zawiera 4 testy, w tym `stary_zapis_bez_klucza_last_war_laduje_sie_jako_zero_i_pierwsza_wojna_go_zapisuje` (linia 223) i `s3_umowa_handlowa_legacy_kind_three_turns_matches_trade_route` (linia 186). W `330c6a9ac` ich NIE MA; testy są przepisane na `vectors()`/`hook_p4_counter_matches_pin_for_all_cases` itd.
- `git diff --stat 003d53f97 330c6a9ac`: `p6_cred_wojna_vectors.rs` 531 zmian, `p6_cred_wojna_gen.mjs` 485 zmian, `vectors.json` 2 +-, `01-operator-r2.md` 78 zmian. Raport r3 pisał „bez zmian" — to był błąd opisu (fakt: nadpisanie).
- Wersja parity (200 przypadków / 1063 kroków) i wersja r2 (160 hak + 60 seq + 20 S3) są dwiema różnymi, niezgodnymi zawartościami tych samych plików.

Dlaczego nie przywracam sam: dispatch r3 wprost nakazał przeniesienie czterech plików „bez zmian treści" i zakazał zmian poza tymi czterema plikami oraz `01-operator-r3.md`. Przywrócenie wersji parity lub zachowanie obu zestawów wymaga zmiany allowlisty albo decyzji, czego Operator nie ma prawa podjąć.

Opcje do decyzji (rekomendacja: A):
- A. Zachować oba zestawy: przywrócić na gałęzi cztery pliki z `003d53f97` (wersja parity), a wersję r2 dołożyć jako nowe pliki `p6_cred_wojna_r2_vectors.rs`, `p6_cred_wojna_r2_gen.mjs`, `vectors_r2/vectors.json`. Wymaga rozszerzenia allowlisty o 3 nowe pliki i ponownego FC. Test wsteczny i test czuły mutacyjnie wracają.
- B. Zaakceptować utratę wersji parity (r2 zastępuje). Wtedy w raporcie jawnie: utracono test wsteczny `stary_zapis_bez_klucza...` i test czuły na wyłączenie zapisu.

### Z2 SREDNI (test kolejności D4/D8 woła prymitywy, nie pipeline) — PRZYJMUJĘ
Zweryfikowane: `p6_cred_wojna_vectors.rs:186` woła `reg.tick_no_war_milestone(o, turn, p)`, linia 191 woła `reg.note_war_entered(a, b, turn)`. Test nie wywołuje `run_war_turn`, więc NIE dowodzi kolejności w produkcji. Dowód produkcyjny: NIE_ZMIERZONO. Naprawa wymaga harnessu pipeline, który dispatch r3 wyłączył jako osobny temat. Nie naprawiam w tej rundzie.

### Z3 DROBNY (BLOKADY: „hak w declare_forced_wars brakuje") — PRZYJMUJĘ, BŁĄD W RAPORCIE, POPRAWIONY
Zweryfikowane na 003d53f97:
- `rust-port/engine/src/domain/war_turn_declare.rs:116` — `note_war_declarations(state, &pairs, turn)?;` wewnątrz `declare_forced_wars`,
- `turn_war_dipl_steps.rs:895` — `reg.note_war_entered(a, b, turn);`,
- test pokrycia `rust-port/engine/tests/p6_cred_wojna_forced.rs` (4 testy ok).
Hak JEST na ścieżce wymuszonej. Korekta zapisana w `01-operator-r3.md` (sekcja BLOKADY). Zmiana tylko w raporcie, bez zmian w `src/`. Realnie otwarte pozostają: wypowiedzenie gracza (web 13168/13205), sojusz 23806 (`joinAllyToWar`, brak wołania według `01-operator-r2.md` tabela), klaster 40441 — to #120.

### Z4 DROBNY (N1/N2 nie modelowane ani porównywane) — ODRZUCAM JAKO DEFEKT; ZAKRES JAWNY
Zweryfikowane: `01-operator-r2.md` (zastrzeżenia do hamulca) wprost pisze: gałęzie N1/N2 (kary zdrady, odwet, kasowanie oferty pokoju, `truceUntilTurn`) nie są w Rust w tym haku i NIE są porównywane przez testy (NIE_ZMIERZONO). Wektory generatora je liczą, test ich nie sprawdza. To ograniczenie zakresu, nie ukryty błąd.

### Z5 DROBNY (alias `umowa_handlowa` pominięty) — ODRZUCAM JAKO DEFEKT; RYZYKO POZOSTAJE
Zweryfikowane: `credibility.rs:597-598` — wariant `LegacyTradeAgreement` istnieje, a adapter `stream_kind_of` go nie produkuje. Dispatch r2 i r3 wprost nakazały test S3 bez aliasu. Realna ścieżka danych (serde scala `umowa_handlowa` z `umowa_szlakow`) nie ma wektorów. To ryzyko jest zgodne z decyzją właściciela, jawnie wpisane w BLOKADY; nie jest błędem tej rundy.

### Z6 NIE_ZMIERZONO (pełny `cargo test` przerwany timeoutem) — PRZYJMUJĘ; ZMIERZONO PONOWNIE
Pełny przebieg w tle, CARGO_TARGET_DIR poza repo, wynik w sekcji TESTY poniżej. Liczby z raportu operatora (3258/0/1) są potwierdzane lub korygowane wyłącznie tym przebiegiem.

### Z7 ODTWORZONE (generator, bramki, allowlista) — przyjęte, bez zarzutu do odpowiedzi.

## TESTY (ponowny pomiar na 330c6a9ac)
- `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_TARGET_DIR=<scratchpad>/target-r3 cargo test --no-fail-fast` w `rust-port/engine` na 330c6a9ac: 452 bloków `test result`, suma 3258 passed, 0 failed, 1 ignored (`e2e::dump_tick1_econ_for_web_generator`, stan bazy parity, poza zakresem). Brak linii `error`/`FAILED`/`panicked`. Log: `<scratchpad>/fulltest-r3.log`.
- Potwierdzenie liczb raportu r3 (3258/0/1): ZGODNE. Zmierzone dopiero w tej rundzie (poprzedni pomiar FC przerwany timeoutem 585 s).
- Zmiana kodu w tej obronie: brak (tylko raport). Bramki fmt/clippy z r3 nie wymagały ponownego pomiaru, bo pliki `.rs` i `.mjs` są identyczne z 330c6a9ac.

## ZMIANY/COMMIT
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-WOJNA-Q1/01-operator-r3.md` (korekta BLOKADY, Z3)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-WOJNA-Q1/02a-obrona.md` (ten plik)
- Kod, testy, `src/`, `gra/`, `Cargo.lock`: bez zmian.
- SHA: [SHA-PENDING]

## BLOKADY
- Z1: decyzja wymagana (opcja A lub B, patrz wyżej).
- Z2: produkcyjny dowód kolejności D4/D8 — NIE_ZMIERZONO, osobny temat.
- Z5: alias `umowa_handlowa` — ryzyko zaakceptowane przez właściciela, nie rozwiązane.
- #120: wypowiedzenie gracza, sojusz 23806, klaster 40441.

## RUNDY
3/5 (obrona w rundzie 3; brak zmian kodu, więc kolejna runda FC zależy od decyzji Z1).

## NASTĘPNY KROK
Decyzja właściciela/orkiestratora na Z1 (A lub B). Po niej: Operator r4 (jeśli A — przywrócenie 4 plików z 003d53f97 i 3 nowych plików) albo FC r3 na obecnym SHA (jeśli B).

## DEPLOY/PUSH
NIE WYKONANO
