STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-TEST-DEBT-HUD-Q3
GOAL: Odpowiedź Operatora na zarzuty Evaluatora (PASS-WITH-NOTES, baza 10f8526ea). Bez zmian w gra/src/** i bez zmian asercji; dowody mutacyjne i pomiar sekcji [B] dopisane.
ZMIANY/COMMIT: tylko dokumentacja i logi w dyspozycje/autobot/runs/R-WEB-TEST-DEBT-HUD-Q3/: 02-operator-obrona.md, gate-mut-heks-panel-ulepszenia-undefined.txt, gate-mut-obywatele-filter-owner5.txt, gate-mut-ai2-skipwyrab-player.txt, gate-live-topbar-dist-run1.txt, gate-live-topbar-dist-run2.txt. Testy (da4ae12b6) i raport R1 (10f8526ea) bez zmian. SHA commitu: w odpowiedzi orkiestratorowi.

ODPOWIEDZI NA ZARZUTY:
- Brak zarzutów blokujących: PRZYJMUJĘ (potwierdzenie Evaluatora, bez zmian).
- Odtworzone bramki 10f8526ea: PRZYJMUJĘ (zgodność potwierdzona przez Evaluatora).
- NOTA 1 (heks-panel-tooltip-warstwa i hud-obywatele-chip nie mutowane): PRZYJMUJĘ, DOWÓD:
  - heks-panel: mutant cityPanel.ts (ulepszeniaKeys: undefined) -> 20 passed, 2 failed, EXIT=1.
  - hud-obywatele-chip: mutant main.ts:20531 (filter c.ownerId === 5) -> 19 passed, 1 failed, EXIT=1.
  - Tolerancja regexów (stara i nowa forma) nie osłabia asercji zachowania: mutanty łapią błąd. src przywrócony (git checkout), drzewo czyste.
- NOTA 2 (ai2: asercje negatywne na tekście main.ts): ODRZUCAM zmianę asercji. Asercja negatywna jest zamierzona (klasa A) i chroni przed powrotem przełącznika. DOWÓD: mutant main.ts:37377 (skipWyrab: true w pickerze gracza) -> 37 passed, 1 failed, EXIT=1. Evaluator mierzył też getOnlyWorked (36/2). Pokrycie zachowania: simple-food-rule-no-toggles i ai-food.
- NOTA 3 (sekcja [B] --dist pominięta): PRZYJMUJĘ, zmierzono. Zbudowano vite (outDir poza repo, w scratchpad; bez npm run build w gra/) i uruchomiono hud-topbar-grid-gross-net-test.cjs --dist:
  - run 1 (z mutantami): EXIT=1, 1222 ok / 1 fail. Jedyny FAIL: "live Spichlerz+ (proba 1)": netto z HUD -44, zmiana magazynu 0 (przed 600, po 600). Proba 2 w tym samym runie: -44 == -44 OK.
  - run 2 (--no-mutants): EXIT=0, 192 ok / 0 fail; proba 1 -44 == -44 OK.
  - Klasyfikacja: NIE klasa A w sensie przestarzałej asercji (zachowanie zgodne w run 2). Nie ustalono, czy przyczyną jest race w teście (odczyt 4 s po zmianie tury, hak setFoodReserve), czy rzadka usterka gry. NIE naprawiano, asercji nie osłabiono. Zgłoszone w BLOKADACH.
- Rozbieżność hex-tooltip 73/1 (dispatch) vs 67/0 (zmierzone): PRZYJMUJĘ jako fakt, bez zmian (plik nietknięty, 67/0 przed i po).

TESTY (dowody uzupełniające):
- heks-panel mutant: EXIT=1 (20 passed / 2 failed)
- obywatele mutant: EXIT=1 (19 passed / 1 failed)
- ai2 mutant: EXIT=1 (37 passed / 1 failed)
- topbar --dist: run 1 EXIT=1 (1 fail, proba 1); run 2 EXIT=0 (0 fail)
- vite build (outDir poza repo): EXIT=0

BLOKADY:
- Klasa B: BRAK potwierdzonej usterki gry.
- NIEZAMKNIĘTE (niestabilność): hud-topbar-grid-gross-net sekcja [B], "live Spichlerz+ proba 1" FAIL w 1 z 2 runów. Wymaga decyzji właściciela: osobny temat diagnostyczny albo akceptacja jako flake. Nie dotyczy klasy A, ale blokuje deklarację "wszystkie bramki zielone" dla sekcji [B].

RUNDY: 2/5 (odpowiedź na zarzuty Evaluatora)
NASTĘPNY KROK: Final Control (Sonnet 5.5) po decyzji orkiestratora co do niestabilności sekcji [B].
DEPLOY/PUSH: NIE WYKONANO
