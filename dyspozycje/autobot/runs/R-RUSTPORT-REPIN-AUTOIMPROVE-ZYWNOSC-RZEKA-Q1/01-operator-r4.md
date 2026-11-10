# Operator, runda 4/5 (odpowiedz na zarzut Z2 z FC r3)

Plik nazwany `01-operator-r4.md` (a nie `01-operator-r1.md` z tresci zadania), zeby nie nadpisac raportu rundy 1.

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-AUTOIMPROVE-ZYWNOSC-RZEKA-Q1
GOAL: Zabic lub udowodnic rownowaznosc mutantow ocalalych w FC r3 (prog 85%, reszta z dowodem). Kod Rust bez zmian.
ZMIANY-COMMIT: baza 07fa33dad (FC r3). Zmienione: `dyspozycje/autobot/runs/.../tools/gen-repin-autoimpr-pick-vectors.mjs` (rodziny F9 `kz-fort-tie-*`, F10 `kz-fort-obcy-konie`); `rust-port/engine/tests/p6_8i_vectors/pick.json` (5128 scenariuszy; helpers.json bajt-identyczny); `dyspozycje/rust-port/p6/P6-REPIN-AUTOIMPROVE.md` sek. 10; `logs/mut-result-r4.txt`; ten raport. Commit: SHA ponizej. Zrodla Rust bez zmian.
TESTY:
- Pick (pelny, 5128): `cargo test --test p6_8i_pick` 1 passed, 0 failed (358 s).
- `cargo fmt --all -- --check`: EXIT=0.
- `cargo clippy --all-targets -- -D warnings`: EXIT=0.
- `git diff --check`: EXIT=0.
- Mutanty: N35 KILLED (nowy wektor F9); N07, N29, N40, N42 SURVIVED (zmierzone ponownie); N20 i N47 ROWNOWAZNE (dowod w doc sek. 10.2, 10.3).
- Pozostale binarki `cargo test --no-fail-fast`: NIE_ZMIERZONO w tej rundzie (src bez zmian; baseline 2130/0 z r2).
BLOKADY:
- Zabite: 102/119 = 85,7% (prog 85% spelniony po N35).
- Rownowazne z dowodem: N20, N47 (r4), N71, N81, N89, N93 (r3).
- OTWARTE bez zabojstwa i bez dowodu (11): N07, N29, N40, N42, N56, N57, N58, N85, N88, N90, N100. Nie wygenerowano dla nich wektorow w r4.
- Zalozenia Z-13..Z-16 i dlugi D-1/D-2: nie zaktualizowano listy w r4 (NIE_WYKONANO).
- Wektory r4 dodane wylacznie na koncu listy (bez zmiany poprzednich scenariuszy).
RUNDY: 4/5 (ostatnia runda 5/5 przed decyzja wlasciciela)
NASTEPNY KROK: Evaluator (Sonnet) i FC (Sonnet) na 07fa33dad + commit r4. Przed PASS wymagane: zamkniecie 11 pozycji OTWARTYCH (wektory lub dowody) albo jawna decyzja wlasciciela o ich przyjeciu jako odstepstwo.
DEPLOY/PUSH: NIE WYKONANO
