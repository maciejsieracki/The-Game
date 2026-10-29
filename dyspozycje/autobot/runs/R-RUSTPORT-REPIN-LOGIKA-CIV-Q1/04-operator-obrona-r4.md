STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-LOGIKA-CIV-Q1
GOAL: Odpowiedz na zarzuty Evaluatora do 82b30524 (r3): domknac M15 testem, sklasyfikowac M17 dowodem z danych, wyjasnic status weryfikacji p6_4, oznaczyc historyczne meta.pin. Bez zmian w src i wektorach.
BAZA: `82b30524` (detached). Zmiany: wylacznie `rust-port/engine/tests/p6_1e_civ_gaps.rs` (append-only, +36 linii), pliki runu R4, sekcja 7 w `dyspozycje/rust-port/p6/P6-REPIN-LOGIKA-CIV.md`.

ODPOWIEDZI NA ZARZUTY:
1. M15 (filtr EGIPT_POMIJANE `|| false`): PRZYJMUJE. Dopisany test `gap_egipt_keeps_shallow_sea_infantry_movement_entry` (p6_1e_civ_gaps.rs:~196-225): wpis `walka_ruch_piechota_teren_plytkie_morze` (cel piechota, shallow_sea=true, jednostka piechota) daje 1.5 dla "egipt" i "polska". Pomiar: mutant -> test FAILED (`left: 1.0, right: 1.5`, tests/p6_1e_civ_gaps.rs:212); przywrocone -> 10/10 PASS. M15 ZABITY (`mutants-obrona-r4.log`).
2. Klasyfikacja M17: PRZYJMUJE korekte. Wyjatek `wyjatki_civ` egipt->rydwany (walka_ruch_bitwa_proc) jest nieosiagalny: pomin_civ = [egipt] na tej samej pozycji, petla robi `continue` przed `.find`, a pozostale wyjatki_civ sa puste (`civ-bonus-matrix-specs.json`). M17 = EQUIVALENT_BY_DATA, nie LUKA TESTOWA. Istniejacy niezmiennik `gap_invariant_extra_cel_exceptions_only_for_skipped_civs` (PASS) dokumentuje ten warunek. Dodatkowo zmierzona galaz rekrutacji zulusi->Impi (civ_bonuses.rs `koszt_rekrutacji`, `.map_or(recruitment.cel ..)`): M21 ZABITY przez `matrix_bonusy_match_web_for_every_civ_key_variant` (tests/p6_1d_civ_bonuses.rs:383).
3. Weryfikator Python (47 rozbieznosci): PRZYJMUJE uwage. Dowodem 0 rozbieznosci dla wektorow p6_4 jest zgodnosc testow Rust z wektorami wygenerowanymi z uruchomionego weba 91dc998a (gate 1228 passed / 0 failed), a NIE weryfikator Python. Log `dowody/verify-p64-r3-stale-python-model.log` (commit aa0efc5b) modeluje edb8fb56 i NIE jest dowodem. Niezaleznosc weryfikatora pozostaje NIE ZAMKNIETA (zapisane w sekcji 7 dokumentu).
4. meta.pin w core/embark/march.json ("edb8fb56"): PRZYJMUJE jako notatke. Generator (`gen-p64-vectors.mjs`, run P6.4) poza allowlista tej rundy; pola nie edytuje sie recznie, bo psulby dowod bajt-w-bajt. Pole jest HISTORYCZNE; zrodlo wektorow = 91dc998a (sekcja 7 dokumentu).

BRAMKI (commit-kandydat na bazie 82b30524 + test z pkt 1):
- `cargo fmt --all -- --check`: EXIT=0 (`gate-fmt-obrona-r4.log`).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`gate-clippy-obrona-r4.log`). Bez `--locked`: Cargo.lock nieśledzony, NIE commitowany.
- `cargo test --all-targets --no-fail-fast`: 1228 passed / 0 failed, EXIT=0 (`gate-test-obrona-r4.log`; bylo 1227 + nowy test).
- `git diff --check`: EXIT=0.
- `src/`, `gra/**`, `Cargo.toml`, `WERSJE.md`, inne `tests/*.rs`: bez zmian (`git status`: tylko p6_1e_civ_gaps.rs + nieśledzony Cargo.lock).

BLOKADY: brak twardych. Otwarte (jawnie): niezalezny weryfikator wektorow p6_4 (NIE ZAMKNIETE, poza zakresem runu).
ZALOZENIA: Z1 (regeneracja z weba = wystarczajace zrodlo wektorow, powtarzalnosc); Z2 (M8/M9 rownowazne przy danych 91dc998a); Z3 (M19 rownowaznosc znaku zera).
RUNDY: 4/5 (poprawka po FAIL r3 -> ta sama rama, ten sam ID).
NASTEPNY KROK: Evaluator (Sonnet) + Final Control: weryfikacja testu z pkt 1 (mutant 15), klasyfikacji M17/M21 i sekcji 7. Po PASS orkiestrator integruje `repin-wip`.
DEPLOY/PUSH: NIE WYKONANO
