STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T7A-FALANGA
GOAL: port is_phalanx / phalanx_line_front / phalanx_action_decide / phalanx_step_decide (pin 07d2fbd72)
ZMIANY/COMMIT: oceniony kod 0964e67a1 (baza f85622878); allowlista OK (5 plikow: mod.rs +1 linia, phalanx.rs, test .rs, gen .mjs, vectors.json)
TESTY: patrz nizej
BLOKADY: dysk (3,6-5,6 GB < 8 GB) -> clippy i pelny cargo test NIE uruchomione (NIE_ZMIERZONO)
RUNDY: Evaluator r1
NASTEPNY KROK: Operator r2 (to samo ID): luki mutacyjne 1-2 + powtorzenie bramek przy >= 8 GB
DEPLOY/PUSH: NIE WYKONANO

## Odtworzone bramki
- cargo fmt --check: EXIT 0
- cargo test --test p6_k5doc_t7a: 10/10 ok, 0 ignored, EXIT 0
- node p6_k5doc_t7a_gen.mjs: regeneruje vectors.json bez diffu (git status czysty) -> oracle jest wykonaniem pina, nie reczny
- clippy -D warnings, cargo test --all-targets: NIE URUCHOMIONO (BLOCK INFRA, df 3,6 GB)
- Brak #[ignore], brak osłabionych asercji; brak zaleznosci do W8; zero zmian poza allowlista.

## Przeglad kodu vs pin (1538-1544, 1168, 6519-6528, 6546-6578, 6588-6636)
Logika zgodna linia w linie (kolejnosc DIRS4, scisle >, filtr primaryRanged, allies bez siebie, tolerancja).

## Zarzuty
1. (istotny) Przezyl mutant: usuniecie premii +6 za sasiada falangi (`touches_phalanx`, pin 6627-6631) -> 10/10 zielone. Zadna asercja ani wektor nie rozroznia kandydatow remisowych z i bez sasiada falangi poza pierwszym w kolejnosci N,E,S,W. Wymagany wektor z pina: dwa kroki o rownym (dNow-dEnemy), pierwszy w kolejnosci bez sasiada falangi, drugi z sasiadem -> wygrywa drugi.
2. (istotny) Przezyl mutant granicy `nr >= BF_ROWS` -> `nr > BF_ROWS` (pin 6608): brak wektora jednostki na krawedzi planszy (row 0 / BF_ROWS-1 / col 0 / BF_COLS-1) z krokiem poza pole. Wymagane wektory graniczne dla wszystkich 4 krawedzi.
3. (drobny) Mutant `d_enemy >= d_now` -> `>` jest rownowazny (zmiana manhattan o krok = +-1), nie liczyc jako luka.
4. (drobny, NIE_ZMIERZONO) Brak pliku rozpoznania wejsciowego w f85622878 (zgloszone przez Operatora); decyzje z dispatchu. Odchylenia dispatch-vs-pin (brak Schedule, AdvanceStep dla lineFront==null) sa zgodne z pinem (6555-6556, 6635) i akceptowane.
5. (drobny, NIE_ZMIERZONO) norm_name pokrywa NFD tylko dla U+00C0..U+017F (znany dlug NFD, poza zakresem); wektory is_phalanx nie dotykaja innych diakrytykow. Odnotowac.
6. (formalny) Trailery commitow zawieraja nazwe modelu (dispatch: BEZ nazwy modelu); sprzeczne z regula sesji - decyzja orkiestratora, nie blokuje.
7. (proceduralny) Bramki clippy i pelny test niezweryfikowane przez Operatora ani Evaluatora (dysk); PASS niemozliwy bez nich.

## Mutacje wlasne Evaluatora (10)
Wykryte (FAIL): remis `>=`, `step_adv >=`, `group.len()==0`, `hold >=`, `move_left <`, pominiecie `routed`, kolejnosc DIRS4. Przezyly: premia +6 (zarzut 1), granica wierszy (zarzut 2), `d_enemy >` (rownowazny).
