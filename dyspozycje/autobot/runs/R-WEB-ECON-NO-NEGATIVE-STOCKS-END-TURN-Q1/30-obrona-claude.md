# R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-Q1 — obrona Operatora (runda 1, odpowiedź na zarzuty Evaluatora bf6fbba68)

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-Q1
GOAL: po zakończeniu tury skarbiec i spichlerz państwa nigdy poniżej zera; wyjątek tury 1–10; gracz: blokada „Zakończ turę” przy prognozie < 0 z komunikatem; AI: równoważenie przed końcem tury; kary deficytu jako siatka.
BAZA: ec00fc0e3 (origin/main). KANDYDAT r1: 489cd8d3f (czysta logika + test). Ta obrona: commit w tym raporcie (SHA w polu sha wyniku).
ZMIANY-COMMIT: gra/src/game/no-negative-stocks.ts (doc kontraktu `czyRuchNaprawczy`), gra/tools/no-negative-stocks-test.cjs (grupa 6: wynik po dźwigni z `planAiBalance` zamiast ręcznego dodania zysku; grupa 6b; test wykluczenia dźwigni `eliminujeCywilizacje` z ruchu naprawczego). Allowlista zachowana. Brak zmian w main.ts, ai.ts, turn-economy.ts, gold-deficit.ts, empire-food.ts, hud.ts.

## Odpowiedzi na zarzuty

1. (kryterium a, brak wpięcia w main.ts) PRZYJMUJĘ. NIE zrobione w tej rundzie: `canPlayerInitiateEndTurn()` (main.ts:38755) i HUD nietknięte. Zakres wpięcia to osobny temat (patrz BLOKADY 1).
2. (kryterium b, brak prognozy spichlerza po ticku) PRZYJMUJĘ. NIE zrobione: brak read-only projekcji `advanceEmpireFood` (empire-food.ts:195).
3. (kryterium c, test tylko na syntetycznych dźwigniach) PRZYJMUJĘ. Test pozostaje na dźwigniach syntetycznych; test na realnych dźwigniach gry wymaga wpięcia.
4. (kryterium d, brak planAiBalance w ai.ts i runnera headless) PRZYJMUJĘ. NIE_ZMIERZONO: brak symulacji 15 × 3 × 150.
5. (kryterium e, brak testu kar przy wymuszonym minusie) PRZYJMUJĘ. NIE zrobione; gold-deficit.ts nietknięty, więc nic nowego do przetestowania.
6. (kryterium f, mutacje tylko izolowanej funkcji) PRZYJMUJĘ. Mutacje w grze niemożliwe przed wpięciem. Mutacje czystej logiki wykonał Evaluator (4/3/2 FAIL); nie powtarzałem.
7. (kryterium g, testy ekonomii i end-turn nieuruchomione) PRZYJMUJĘ. NIE_ZMIERZONO w tej rundzie: nie uruchamiałem gold-deficit-test, testów ekonomii ani pięciu bramek. Zmierzone poniżej: tsc, test tematu.
8. (wyjątek starego zapisu: ujemny stan + prognoza nie gorsza → brak blokady) ODRZUCAM jako błąd implementacji. Dispatch (linia „Zasady szczegółowe” pkt 5) wprost dopuszcza ten wariant: „blokada tylko gdy prognoza po turze jest GORSZA niż obecny stan lub dopóki istnieje ruch naprawczy”. Kandydat implementuje pierwszy człon. Dowód: no-negative-stocks.ts, `sprawdz` (`if (po < obecny) ... else wyjatekStarego`). Wybór między wariantem „gorsza niż obecny” a wariantem Evaluatora „gorsza ORAZ brak ruchu naprawczego” to decyzja orkiestratora (rekomendacja: zapytać właściciela, bo dotyczy zasady „nigdy poniżej zera”).
9. (czyRuchNaprawczy nie sprawdza dostępności) ODRZUCAM w części dotyczącej modułu: funkcja jest czysta i dostaje listę dźwigni od wołającego, więc dostępność należy do wołającego. Dodano jawny kontrakt w komentarzu nad funkcją oraz test: dźwignia z `eliminujeCywilizacje: true` nie liczy się jako ruch naprawczy (test 6, `dźwignia eliminująca nie jest ruchem naprawczym`). Dowód: 25 passed, 0 failed.
10. (testy słabe: grupa 6 ręcznie dodaje podatek; grupa 9 bez ścieżki gold-deficit) PRZYJMUJĘ częściowo.
    - Grupa 6: PRZYJMUJĘ i naprawiam. Wynik po podatku liczony jest teraz z `planAiBalance(brak, [podatek])` (suma `zysk` z planu), z asercją `pokryte === true` i `poPlanie === 25`. Dodano grupę 6b.
    - Grupa 9 (ścieżka gold-deficit): PRZYJMUJĘ. NIE zrobione: test wymaga wpięcia, bo moduł nie wywołuje gold-deficit.ts.

## TESTY (surowe wyjście, ta runda)

- `cd gra && node tools/no-negative-stocks-test.cjs` → `no-negative-stocks-test: 25 passed, 0 failed`, exit 0 (było 22 w kandydacie; +3 asercje w grupie 6 i 6b).
- `cd gra && node_modules/.bin/tsc --noEmit -p tsconfig.json` → exit 0, bez wyjścia (0 błędów).
- `git diff --check` → bez wyjścia (czysto).
- NIE_ZMIERZONO: gold-deficit-test, testy ekonomii i end-turn, pięć bramek repo, mutacje w grze, symulacja headless.
- Uwaga: `npm ci --ignore-scripts` w gra/ zakończone (node_modules nietrackowane). Komenda `npm ci` wypisała ostrzeżenie o `npm audit`, bez wpływu na wynik testów.

## RUNDY

1/5 (obrona r1). Ostatni werdykt Evaluatora: FAIL (kandydat niekompletny, bez regresji).

## BLOKADY

1. Wpięcie w grę (kryteria a, b, c-w-grze, d, e, f): wymaga (i) read-only prognozy skarbca i spichlerza PO ticku (`turn-economy.ts` upkeepBalance; `empire-food.ts` advanceEmpireFood bez zapisu stanu), (ii) zmiany `canPlayerInitiateEndTurn()` i komunikatu HUD, (iii) wywołania `planAiBalance` w ai.ts przed końcem tury, (iv) runnera headless 15 × 3 × 150. To wielokrotnie większy zakres niż ta runda. Rekomendacja orkiestratora: rozbić na podtematy (A: projekcja spichlerza po ticku + testy; B: wpięcie skarbca i HUD; C: AI-równoważenie i runner 15×3×150).
2. Decyzja orkiestratora/właściciela dotycząca wyjątku starego zapisu (zarzut 8) — patrz wyżej.

## NASTĘPNY KROK

Evaluator r2 na commicie obrony. Bez wpięcia w grę kryteria a–g nie będą spełnione; orkiestrator decyduje o podziale na podtematy (BLOKADY 1) i o wariancie wyjątku starego zapisu (zarzut 8).

UWAGI-DLA-ORKIESTRATORA: brak poza zakresem. Zarzut 8 wymaga decyzji właściciela (zasada „nigdy poniżej zera” kontra wariant dispatchu).

DEPLOY/PUSH: NIE WYKONANO
