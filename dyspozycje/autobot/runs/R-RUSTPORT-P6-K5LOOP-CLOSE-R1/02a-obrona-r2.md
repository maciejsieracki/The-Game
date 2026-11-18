# R-RUSTPORT-P6-K5LOOP-CLOSE-R1: Operator, obrona r2 (odpowiedź na 02-evaluator-r2.md)

STATUS: PASS-WITH-NOTES (Z1 naprawiony; Z2 przyjęty jako pierwszy punkt rundy 3, w tej obronie bez kodu)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-CLOSE-R1
GOAL: `ProdBody` wykonuje gałęzie `_activateUnit` jak pin `07d2fbd72`; ta obrona zamyka zarzut Z1 (NaN `moveLeft` w pętli kawalerii).
ZMIANY/COMMIT: baza `526b746e0` (Evaluator r2, nad Operatorem r2 `ff9a7aaa6`). Gałąź `obrona/k5loop-close-r2`, SHA w odpowiedzi workera. Pliki:
`rust-port/engine/src/domain/siege_tactics_loop.rs` (2 warunki), `rust-port/engine/tests/p6_k5loop_close_r2.rs`,
`rust-port/engine/tests/p6_k5loop_close_r2_gen.mjs`, nowy `rust-port/engine/tests/p6_k5loop_close_vectors/vectors_r2_nan.json`, ten raport.
Wszystkie pliki mieszczą się w allowliście dispatchu (r1 + DODATEK r2).
TESTY: niżej. BLOKADY: brak. RUNDY: 2/5 (obrona). NASTĘPNY KROK: Evaluator/FC r2 tej obrony; potem runda 3 od Z2.
DEPLOY/PUSH: NIE WYKONANO.

## Z1 (BLOKUJĄCY), NaN `moveLeft` w pętli kawalerii: PRZYJMUJĘ

Pin w callbacku `_doMove` kontynuuje manewr wyłącznie przy `if (ru.moveLeft > 0)`:
`battleScene.ts:6439` (C-FLANK `_cavDirectedManeuverStep`) i `:6496` (`_cavManeuverStep`). Sprawdziłem to na pinie
przez `git show 07d2fbd72:gra/src/battle/battleScene.ts`. Dla `NaN` to porównanie jest fałszywe, więc `done()` następuje po jednym kroku.
Rust przerywał pętlę tylko przy `move_left <= 0.0`, a to porównanie jest dla `NaN` również fałszywe, więc pętla kręciła się dalej.

Poprawka (`siege_tactics_loop.rs`, obie pętle `cavalry_action`): warunek wyjścia to teraz
`cav_adjacent_non_spear(..).is_some() || move_left <= 0.0 || move_left.is_nan()`, czyli dokładna negacja `moveLeft > 0`.
Postać `!(move_left > 0.0)` odrzuciłem, bo clippy (`neg_cmp_op_on_partial_ord`) przy `-D warnings` jej nie przepuszcza.
Pozostałe miejsca były już zgodne, co potwierdzają nowe wektory:
- pierwszy krok manewru (`gate(ml)` = `ml > 0 || NaN`, pin `ru.moveLeft <= 0` -> brak kroku);
- szarża (`move_left > 0.0`, pin `:6403-6409`).

Moduły T6 nie zmieniły się (D-K5C-3).

Wektory pinu: generator `p6_k5loop_close_r2_gen.mjs` ma nową sekcję dopisaną po zapisie `vectors_r2.json`, bez nowych wywołań `rnd`.
- Rodzina `cavalry-nan` to kopie wszystkich 320 scenariuszy `cavalry` z `moveLeft = NaN` jednostki działającej. Oczekiwanie pochodzi z wykonania tekstu pinu (ten sam strażnik SHA `c5a5bc11…`).
- `NaN` w JSON zapisuję jako napis `"NaN"`. Plik to `p6_k5loop_close_vectors/vectors_r2_nan.json`.
- Generator sam asertuje, że pin robi przy NaN najwyżej 1 krok.
- Statystyki: `{"cavalryNan":320,"nanMoved":283,"nanAttack":25,"nanHold":12}`.
- `vectors_r2.json` jest bajt w bajt bez zmian, przed i po regeneracji sha256 `2cf290309e1967efc7b3946218f933ac26090e04e12daadc2ec13119ec4a5945`. `vectors.json` r1 też bez zmian.

Wektory z sondy Evaluatora (`close-cavalry-2`, `-4`, `-10`, `-24`) są w tej rodzinie jako `close-cavalry-nan-2/4/10/24`.

Test `kawaleria_nan_move_left_zgodna_z_pinem` w `p6_k5loop_close_r2.rs`:
- Porównanie jest takie samo jak w teście głównym, przez wspólną funkcję `check_case`, wydzieloną bez zmiany asercji: ślad, czas, pozycja, `moveLeft`, facing ze zmianami w czasie, `lastAutoMoveFrom`, każdy `Move`, cios, `occByKey`, `unported` puste.
- Do tego jawne asercje: `<= 1` krok, `moveLeft` po turze = NaN, pokrycie (krok >= 200, C-FLANK >= 60, `_cavManeuverStep` >= 60, cios >= 15, bez akcji >= 5).
- Strażnik czasu 90 s (wątek + `recv_timeout`): mutant, który kręci się bez końca, daje czytelny FAIL zamiast zawieszenia binarki.
- `moveLeft` porównuję bitowo, z jednym wyjątkiem: dowolny `NaN` jest równy `NaN` (`same_f64`). Ładunek bitowy NaN nie jest stanem gry. Dla wartości nie-NaN porównanie zostaje bitowe, bez osłabienia.

Mutanty (cofnięcie poprawki osobno w każdej pętli):

| mutant | miejsce | wynik |
|---|---|---|
| M-Z1a: `\|\| move_left.is_nan()` -> `\|\| false` | pętla C-FLANK (`loop.rs:2231`) | FAIL, EXIT 101, 659 rozbieżności |
| M-Z1b: to samo | pętla `_cavManeuverStep` (`loop.rs:2283`) | FAIL, EXIT 101, „brak konca w 90 s” (przed strażnikiem: EXIT 124 po `timeout 120`) |

Po każdym mutancie przywróciłem plik z kopii i sprawdziłem `grep -c move_left.is_nan() = 3`.

## Z2, strzelec (`RangedAction` `:6656`) i odwrót (`FallBackStep` `:7228`): PRZYJMUJĘ (odłożenie, bez kodu w obronie)

Ustalenie jest prawdziwe: strażnik `strzelec` nadal stoi, brakuje rodzin `ranged`/`fallback` i mutacji kolejności rzutów RNG w strzelcu.
Dispatch r2 (D-K5C-r2-1, kryteria końca) dopuszcza rundę niepełną z jawną listą. Obrona dotyczy zarzutów wobec dostarczonego kodu,
więc tego zakresu tu nie dodaję. Runda 3 zaczyna od punktu (3) D-K5C-r2-1 w tej kolejności:
1. `_rangedAction` `battleScene.ts:6656` i `_fallBackStep` `:7228` (wspólny strażnik `strzelec`);
2. rodziny `ranged` i `fallback` z generatora pinu;
3. mutacja kolejności rzutów RNG w strzelcu.

Dopiero potem idą `PhalanxAction` `:6546-6578` i `Flee`/`_fleeStep` `:9845`.

## U1, licznik `flank_already`: PRZYJMUJĘ (zmiana nazwy, bez zmiany asercji)

W teście pole nazywa się teraz `flank_bez_ruchu_0ms`, z komentarzem, że liczy wszystkie wyjścia z 0 kroków i 0 ms, a nie samą gałąź „już w pozycji”
(`:8212-8214`), którą pokrywa test `flanka_juz_w_pozycji_konczy_bez_akcji`. Próg `>= 20` bez zmian.
Klucza `flankAlready` w statystykach generatora nie zmieniam: zmiana zmieniłaby bajty `vectors_r2.json`, a nazwę objaśnia komentarz w teście.

## U2/U3/U4, `MoveWithoutDto`, `kawaleria-brak-terenu`, `cios-bez-szablonu`: PRZYJMUJĘ jako wymagania dla #113 (bez zmiany kodu)

To jawne i celowe kontrakty, nie ciche pominięcia. Każdy ma test negatywny:
- `move_bez_dto_to_jawny_blad`
- `kawaleria_bez_terenu_daje_jawny_tag`
- `flanka_bez_terenu_daje_jawny_tag`

Wymagania przekazuję do K5LOOP-WIRING (#113) i I5:
- (a) produkcyjny `MoveTerrain` musi być podany (inaczej jazda nie ma tury);
- (b) szablon ciosu `_doAttack` budowany na cel wybrany przez T6 w chwili ciosu, nie z góry;
- (c) `BattleActionDto` dla `Move` dostarcza I5. Do tego czasu `actions_to_dto` zwraca `Err(MoveWithoutDto)`.

## TESTY (ten worktree, `CARGO_TARGET_DIR` w scratchpadzie)
- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --test p6_k5loop_close`: 5 passed / 0 failed
- `cargo test --test p6_k5loop_close_r2`: 6 passed / 0 failed (w tym nowy `kawaleria_nan_move_left_zgodna_z_pinem`)
- regeneracja generatora: `vectors_r2.json` sha256 bez zmian (wyżej)
- mutanty M-Z1a i M-Z1b: FAIL (wyżej)
- pełny `cargo test --all-targets --no-fail-fast` (zawiera `p6_siege*`): wynik w sekcji PEŁNA BRAMKA niżej

## PEŁNA BRAMKA
`cargo test --all-targets --no-fail-fast` (engine, w tle `setsid nohup`, log z `EXIT`): **EXIT=0**, 529 binarek,
3959 passed / 0 failed / 1 ignored (ten sam `#[ignore]` co przed obroną; nowych brak). W tym `p6_siege*`: 40 binarek,
222 passed / 0 failed. Względem Evaluatora r2 (3958 passed) przybył 1 test: `kawaleria_nan_move_left_zgodna_z_pinem`.
Dysk przed bramką: 8.6 GB wolnego. `CARGO_TARGET_DIR` w scratchpadzie usunięty po bramkach.
