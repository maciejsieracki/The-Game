STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T7B-ODWROT (K5DOC-T7b, Evaluator r4)
GOAL: Adwersarialna weryfikacja portu `_bestFallBackStep` / `_fallBackStep` (pin 07d2fbd72) na commicie Operatora 4d9fc8917.

ZMIANY/COMMIT: Evaluator nie zmienia kodu; ten raport. Baza oceny 4d9fc8917; `git diff --stat f85622878 4d9fc8917` = 6 plikow, wszystkie w allowliscie (mod.rs +1, siege_tactics_fallback.rs, p6_k5doc_t7b.rs, _gen.mjs, vectors.json, 03-operator-r4.md); f85622878 jest przodkiem. Brak #[ignore] i brak zmian Cargo.lock w diffie. Kod porownany linia po linii z pinem 7186-7243: zgodny (DIRS4, granice, occ, passable, dMin<=1, dMin<dNow, homeBias, `>`, guardy, Done/Move/Schedule).

TESTY (rust-port/engine, CARGO_TARGET_DIR poza repo, odtworzone sam):
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --test p6_k5doc_t7b: EXIT 0 (2 passed)
- cargo test --all-targets --no-fail-fast (z p6_8i_pick w jednym przebiegu, bez zawieszenia): EXIT 0; suma 3843 passed, 0 failed (zgodnie z raportem Operatora)
- Regeneracja wektorow `node tests/p6_k5doc_t7b_gen.mjs` (generator WYKONUJE tekst pina przez TypeScript, straznik naglowkow wycinkow): 424 przypadki, vectors.json bajt-w-bajt identyczny z zacommitowanym (git status czysty).
- Mutacje (moje): (a) d_min<=d_now FAIL (tests/p6_k5doc_t7b.rs:135); (b) score>=best FAIL; (c) odwrocony homeBias FAIL; granica nc>cols FAIL; nr<-1 FAIL; guard move_left<0 zamiast <=0 FAIL (:141).
- Mutacje, ktore PRZEZYLY (testy zielone): (E) `if d_min <= 1.0` -> `< 1.0`; (G) usuniecie galezi `if finished` w `fall_back_after_move`.
- Kod po kazdej mutacji przywrocony (cmp RESTORED).

ZARZUTY:
1. Przezyty mutant E (granica `dMin <= 1`): wektor `dmin_le_1_odrzucone` (unit 10,10, wrog 10,12, nearest 10,12) ma d_now=2, wiec kandydat d_min=1 jest i tak odrzucany przez `d_min < d_now`; test nie rozroznia `<= 1` od `< 1`. Brak wektora, w ktorym jednostka jest sasiadem wroga (d_now<=1) i kandydat ma d_min==1 (np. slizg wzdluz frontu). Wymagany dodatkowy wektor w generatorze (pin wykonywany, wiec wystarczy dopisac przypadek); dispatch jawnie zadal "dMin <= 1 odrzucone".
2. Przezyty mutant G: galaz `finished` w `fall_back_after_move` (pin :7239) jest niepokryta, bo pole `finished` wektora steruje jednoczesnie guardem poczatkowym (wtedy brak ruchu) i po ruchu; nigdy nie ma "ruch wykonany, potem finished=true". Generator ma stub `_doMove` ustawiajacy tylko moveLeft; brak pola `finished_after`. Funkcja ma zatem nieweryfikowana galaz wzgledem pinu.
3. (nota, nieblokujaca, juz w FC r3) wektory nie zapisuja pola `nearest` jako osobnego wyniku z pinu (jest wejsciem), filtr `routed` z `_enemiesOf` i `nearest==None` przy niepustych wrogach to jawne zaleznosci producenta (W8/ProdBody), wołajacy w Rust jeszcze nie istnieje (wiring poza zakresem wg dispatchu) — zalezność jawna, akceptowalna.
4. (nota) Typ granic: BF_COLS/BF_ROWS (i64) rzutowane na f64 w module; wybor zapisany w naglowku modulu, zgodnie z dispatchem.
5. (nota) Wersja f64 `nc >= cols` dla NaN: `unit.q` NaN nie jest chroniony jak w pinie (w JS tez porownania NaN daja false => kandydat NIE odrzucony po granicach); zachowanie Rust jest zgodne (te same porownania IEEE). Bez zarzutu.

BLOKADY: brak. Dysk: 16 GB przed, 4,6 GB po (target usuniety po bramkach).
RUNDY: Evaluator r4.
NASTEPNY KROK: Obrona: dopisac wektory dla zarzutow 1 i 2 (generator + pole finished_after) i potwierdzic mutanty E/G jako FAIL; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO.
