STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M07B3-RZEKI-B-TRASOWANIE-Q1
GOAL: M07B-Q3. Port 8 symboli rzek B do `rust-port/engine/src/domain/mapgen/rivers_b/`, wektory z pinu `4bbef081d`. Rola: Operator (obrona) po FAIL Evaluatora r1.
ZMIANY/COMMIT: patrz SHA w odpowiedzi koncowej. Kod portu (`rivers_b/**`) bez zmian. Nowe: `tests/p6_m07b3_vectors/gen_q3_closure_vectors.mjs`, `web-rivers-b-q3-closure.json`. Zmienione: `p6_m07b3_q3.rs`, `mutate_m07b3_q3.py`, `verify_m07b3_q3.py`, dossier (sekcja "Q3 r2"), logi `*-r2.txt`.

ODPOWIEDZI NA ZARZUTY
1. G06/G24/G25/A20 bez dowodu: PRZYJMUJE. Zabite wektorami z weba na pinie (generator w repo, szuka wejsc rozrozniajacych web vs mutant; wynik = web). G06/G24/G25: pierscien-plateau 36 heksow + ostroga/lasso (9 wektorow). A20: dwie trasy prosta/zygzak z prawie-remisem, ziarno miedzy progami 0.12 i 0.13 (6 wektorow). Mutacje: wszystkie 4 KILLED.
2. Brak realizacji domkniecia: PRZYJMUJE, zrealizowane jw.
3. Pelny cargo test: PRZYJMUJE czesciowo. U mnie dwa pelne przebiegi `cargo test --no-fail-fast`: 1950 passed / 0 failed, EXIT=0, kazdy < 575 s (4 rdzenie; suma czasow binariow 239 s). Baza przed tematem = 1947 (wyliczona z diffu: zero `#[test]` w `src/**`, testy tylko w `p6_m07b3_q3.rs`, 3 funkcje). Timeout Evaluatora = wolniejsze srodowisko; nie ma tu zmiany kodu.
4. Mutacje na 3 wersjach wektorow: PRZYJMUJE. Jeden pelny przebieg 205 mutantow na finalnych wektorach (v6 + domykajacy): KILLED 168, SURVIVED 37 (same E z dowodem), 0 SURVIVED z K, 0 INVALID, RESTORED 205/205.
7 wejsc `extmin` (web TypeError / Rust panika) nadal poza wektorami (ZALOZENIE 5 w dossierze).

TESTY: fmt EXIT=0; clippy 0 ostrzezen EXIT=0; testy celowane 2+3+2+3+2 OK; pelny 1950/0 EXIT=0; weryfikator Python glowny 14589/14589, domykajacy 15/15; `mutate --check` 205 mutantow, 0 bledow.
BLOKADY: brak
RUNDY: obrona r1 (runda procesu 2/5)
NASTEPNY KROK: Evaluator r2
DEPLOY/PUSH: NIE WYKONANO
