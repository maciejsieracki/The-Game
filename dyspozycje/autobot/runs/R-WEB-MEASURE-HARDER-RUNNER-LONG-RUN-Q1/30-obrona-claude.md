# R-WEB-MEASURE-HARDER-RUNNER-LONG-RUN-Q1 — obrona Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzędzia pomiarowe; zero zmian gra/src)
TEMAT: R-WEB-MEASURE-HARDER-RUNNER-LONG-RUN-Q1
GOAL: odpowiedź na zarzuty Evaluatora r1 (commit 9f8dd82); wzmocnienie testu wiązania runnera tak, by mutacje logiki były wykrywane.
ZMIANY-COMMIT: gra/tools/diplomacy-harder-measure-hook-test.cjs (sekcja C: strażnik strukturalny + mutanty C4–C6). Baza kandydat 5b6be3c5b. SHA: pole sha w wyniku.

## Odpowiedzi na zarzuty
1. PRZYJMUJĘ. Dowód: mutant `arg('player-ai','1') === '0'` i mutant `if (PLAYER_AI) {` -> `if (false) {` przechodziły stary grep (`src.includes`). Poprawka: `runnerWired` sprawdza regexem dokładną linię `const PLAYER_AI = arg('player-ai', '1') !== '0';`, strażnik `if (PLAYER_AI) {` bezpośrednio przed `setPlayerAiAutopilotForTest(true)`, oraz `await acceptForcedPeace(page, COUNTERS, wait);` jako osobną instrukcję (m-flaga, początek linii). Dodane mutanty C4 (odwrócona semantyka), C5 (if (false)), C6 (zakomentowane wywołanie pokoju wymuszonego). Wynik po poprawce: oryginał = true; mutanty C4/C5/C6 = false (wykryte).
2. PRZYJMUJĘ jako informacyjne, bez zmiany kodu. Ścieżka akceptacji pokoju wymuszonego nie została wykonana na żywo (forcedPeaceAccepted=0 w biegach 45 i 12 tur). Pokrycie: test modułu measure-forced-peace 13/13 i wiązanie runnera (C1). Wykonanie na żywo wymaga biegu, którego ta runda nie robi (NIE ZMIERZONO).

## TESTY (surowe wyniki tej rundy)
- `node tools/diplomacy-harder-measure-hook-test.cjs --dist /nonexistent-scratch-dir` (bez bundle, część B = SKIP): A1–A8 zielone, C1–C6 zielone, `WYNIK: 14 zielonych, 0 czerwonych`, EXIT=0.
- Walidacja mutantów (node -e, na źródle runnera): orig=true, mut4=false, mut5=false, mut6=false.
- Część B (przeglądarka, bundle) NIE uruchomiona w tej rundzie: zmiana dotyczy wyłącznie sekcji C (kod bez przeglądarki), a bundle wymaga buildu poza repo. Ostatni zmierzony wynik 18/0 z rundy r1 (Operator i Evaluator) — NIE PONOWIONO tutaj.
- tsc, logic-test, tech-tree, research, unit-replace, combat: NIE ZMIERZONO w tej rundzie (zmiana tylko w pliku testu narzędzia, poza gra/src).

## BLOKADY
- Brak.

## RUNDY
2/5 (poprzednio r1: FAIL nie wystąpił; werdykt Evaluatora PASS-WITH-NOTES, zarzut 1 nieblokujący)

## NASTĘPNY KROK
Evaluator + Final Control: zweryfikować poprawkę sekcji C (C4–C6) i zdecydować o zarzucie 2 (informacyjne). Długi bieg 150 tur — bez zmian względem raportu r1 (poza zakresem tej rundy), wykonuje orkiestrator.

DEPLOY/PUSH: NIE WYKONANO
