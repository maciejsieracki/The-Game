# 02a — obrona Operatora (runda 1, odpowiedź na zarzuty Evaluatora r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-JS-MAX0-HARDENING-Q1
BAZA: 9a9112a3d; kod operatora: 3f5ebd2a9; commit obrony (testy modulowe): aba6c5ced
NARZĘDZIA: rustc/cargo 1.97.0, node v22.23.4

## Odpowiedzi na zarzuty

1. (niski) Brak testu per moduł — PRZYJMUJĘ.
   Poprawka: commit aba6c5ced dodaje w każdym z pięciu modułów (breach, end, endcheck, unit, activate)
   test `js_max0_zero_sign_jak_math_max`: -0 -> +0 (bity), -3 -> +0, -Inf -> +0, 2.5 bez zmian, NaN zachowany.
   Dowód mutacji: w siege_tactics_breach.rs `js_max(0.0, x)` zamienione na `f64::max(0.0, x)` daje FAIL tego
   testu (`... breach::js_max0_zero_sign_tests ... FAILED`, exit 101). Źródło wykrycia: NaN (f64::max ignoruje NaN),
   nie -0. Plik przywrócony z kopii i zweryfikowany przed commitem.
   Zastrzeżenie: na tym buildzie f64::max(0.0,-0.0) daje +0, więc test per moduł wykrywa powrót do f64::max przez NaN,
   a nie przez znak zera. Test znaku zera pozostaje w wektorach z pinu (p6_js_max0) i w p6_js_max_sign.

2. (niski) Zmiana to utwardzenie, nie naprawa — PRZYJMUJĘ.
   Raport r1 (01-operator-r1.md) już tak to opisuje. Dowód obserwacji: f64::max(-0.0, 0.0) i f64::max(0.0, -0.0)
   zwracają +0 na rustc 1.97.0. Nie twierdzę, że zmiana naprawia zaobserwowany błąd. Dispatch też mówi o GOAL
   jako o zabezpieczeniu semantyki JS. Bez zmian w kodzie.

3. (poza zakresem) Lokalne js_max0 / .max(0.0) poza allowlistą — PRZYJMUJĘ jako kandydata na osobny temat,
   z korektą wskazań (zweryfikowane grepem na 3f5ebd2a9):
   - turn_economy_post.rs:421: NIE jest kandydatem. Helper `js_max0` już deleguje do
     `recruitment::army_merge::js_max(0.0, x)`, czyli ma semantykę JS.
   - turn_economy_loop.rs:399 (`f.max(0.0)`) oraz okolica.rs:158 (`f.max(0.0)`): kandydaci. Są po guardzie NaN,
     więc f64::max różni się od JS tylko dla -0 (floor(-0.0) = -0.0). Nie wymagają zmiany w tym temacie.
   - brake_power*.rs: NIE_ZMIERZONO. Grep po `brake_power` w rust-port/engine/src nie zwrócił trafień pod tą nazwą.
   Propozycja osobnego tematu: R-RUSTPORT-P6-JS-MAX0-REST (turn_economy_loop.rs:399, okolica.rs:158). Bez zmian w tej rundzie.

4. (dokumentacja) SHA w 01-operator-r1.md — PRZYJMUJĘ.
   Plik nie może zawierać SHA własnego commita. Dopisek w 01-operator-r1.md podaje SHA kodu 3f5ebd2a9
   i SHA commita obrony aba6c5ced, a zamknięcie zarzutu jest w tym pliku (02a).

## Bramki po obronie (na HEAD = aba6c5ced, odtworzone przeze mnie)

- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: EXIT 0, 99 passed (94 + 5 nowych testów modułowych)
- p6_js_max0: EXIT 0, 2 passed
- p6_js_max_sign: EXIT 0, 2 passed
- p6_siege_tactics_blow_env: EXIT 0, 3 passed
- p6_siege_tactics_blow_full: EXIT 0, 3 passed
- p6_siege_tactics_activate: EXIT 0, 2 passed
- p6_siege_tactics_loop: EXIT 0, 2 passed
- Mutacja breach (f64::max): FAIL testu modułowego (exit 101), po przywróceniu zielone.

## Zakres zmian w obronie

- Pliki: rust-port/engine/src/domain/siege_tactics_{activate,breach,end,endcheck,unit}.rs (tylko bloki #[cfg(test)]), dyspozycje/autobot/runs/R-RUSTPORT-P6-JS-MAX0-HARDENING-Q1/{01-operator-r1.md (dopisek), 02a-obrona.md}.
- Kod funkcyjny i wektory bez zmian. Cargo.lock nie commitowany. gra/, origin/main, WERSJE.md, Cargo.toml: nietknięte.
- Nie wykonano push ani integracji (zakaz w dispatchu).

## NIE_ZMIERZONO

- Wektory per moduł przez publiczne API: nadal niemożliwe (helpery prywatne). Pokryte testem modułowym i delegacją do js_max.
- Dowód, że test znaku zera -0 (per moduł) wykrywa f64::max: NIE_ZMIERZONO. Na tym buildzie f64::max zwraca +0 dla -0.
