STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-EMPIRE-RECRUIT-ALL-LIVE-VERIFY-Q1
GOAL: dowód w żywej grze: "Rekrutuj wszystkie" + wybrany generał (zamówienie, kolejki, zrodzenie w endTurn, koszty, limit złota, zapis/wczytanie, licznik 0)
ZMIANY/COMMIT: gra/tools/empire-recruit-all-live-test.cjs (tylko test), odświeżone evidence/01-04, ten raport. Baza obrony 8f4f658d0, merge origin/main b4c4b7757 (zarzut 4). Zero zmian w gra/src.

ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJĘ. L22: marching.length >= 1 -> marching.length === spawned.length (wszystkie zrodzone muszą mieć marsz do WYBRANEGO generała). Po zmianie L22 PASS.
2. ODRZUCAM jako wadę testu, przyjmuję jako ograniczenie: dowodem jest asercja L20/L21/L22 (stan gry), zrzut 03 jest ilustracją; zrzuty odświeżone na nowym main. Brak zmiany kodu zrzutu.
3. PRZYJMUJĘ jako NIE_ZMIERZONO (bez poprawki): mapa ?playtest=mapa kończy się zwycięstwem dominacją po 1. turze (komentarz w teście), więc zmierzono tylko 1. falę 3 z 9; reszta zostaje w kolejkach (L23 potwierdza zejście dokładnie 1 sztuki z każdej kolejki). Pomiar wielotury wymagałby innej mapy/hooka - poza zakresem.
4. PRZYJMUJĘ: merge origin/main (b4c4b7757) do gałęzi i powtórzenie testu na nim. Wynik: empire-recruit-all-live-test 29 passed, 0 failed. Mutant rally na nowym main: 26 passed, 3 failed (czerwony; main.ts przywrócony przez git checkout). tsc --noEmit: exit 0.
5. PRZYJMUJĘ: asercja L23 przeniesiona za L22 (kolejność zgodna z wykonaniem).
6. ODRZUCAM: liczby w dokumentacji (tech-tree 19, unit-replace 13) poza zakresem tematu i allowlisty; to nie regresja (Evaluator potwierdza). Do osobnego tematu PROC-GATE-REFERENCE-REFRESH.

TESTY (surowe wyjście tej rundy, na merge z main b4c4b7757):
- empire-recruit-all-live-test --shot: 29 passed, 0 failed (exit 0)
- mutant rally: 26 passed, 3 failed
- tsc --noEmit: exit 0
- NIE_ZMIERZONO w tej rundzie na nowym main: mutant default1, empire-recruit-live-test (24/0), army-auto-recruit-general 32/17/11, 5 bramek referencyjnych (Evaluator potwierdził na 8f4f658d0; zmiana dotyczy jednego testu live) - do powtórzenia przez Final Control.
BLOKADY: brak
RUNDY: obrona 1/5
NASTĘPNY KROK: Final Control (powtórzyć bramki referencyjne i empire-recruit-live-test na SHA końcowym)
DEPLOY/PUSH: NIE WYKONANO
