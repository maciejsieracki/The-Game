STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-WELCOME-SHOW-ALL-BONUSES-Q1
GOAL: Ekran powitalny pokazuje WSZYSTKIE pozycje Plusy/Minusy bez „+ N więcej (najedź…)” i bez tooltipu.
ZMIANY-COMMIT: obrona (runda 2) na bazie b65f7870e (kod gry bez zmian). Zmieniony tylko gra/tools/civ-welcome-screen-test.cjs (sekcja 8 rozszerzona) oraz ten raport. Commit: patrz pole sha w StructuredOutput.
ODPOWIEDZI NA ZARZUTY:
- Zarzut 1 (test nie renderuje listHtml, brak asercji „więcej”): PRZYJMUJĘ. Dodano: (a) asercje na całym pliku civWelcomeScreen.ts: brak `<details`/`<summary`, brak „więcej” (bez rozróżniania wielkości liter); (b) render listHtml wyciągniętej z pliku źródłowego (new Function, bez DOM) dla każdej cywilizacji i obu list: liczba <li> = liczba pozycji, każda pozycja w HTML, brak „więcej”/„najedź”, brak `title=`. Mutacje na kopiach (argv[3]): m1 `<li title="x">` -> 54 FAIL; m2 `<details><summary>` przed <ul> -> 1 FAIL; m3 `items.slice(0,3)` -> 44 FAIL; m4 dopisek „więcej” -> 28 FAIL. Test na bazie: OK 490 asercji (wcześniej 316).
- Zarzut 2 (brand-live „NIE ZMIERZONO”, harness poza repo): PRZYJMUJĘ CZĘŚCIOWO. Mój poprzedni zapis był nieprecyzyjny: test przeglądarkowy gra/tools/civ-welcome-screen-brand-live-test.cjs JEST w repo (obecny w bazie df20918b3, commit 73cb69774). Nie przebiegałem go w tej rundzie (wymaga buildu Vite i Chromium); zmiana tej rundy dotyczy wyłącznie testu źródłowego, kod UI bez zmian. Zrzuty z rundy 1 (evidence-*.png) pochodzą z niewersjonowanego skryptu Operatora; wynik brand-live zweryfikował Evaluator.
TESTY (liczby z surowego wyjścia, worktree na b65f7870e, npm ci --ignore-scripts w gra/):
- civ-welcome-screen-test: OK (490 asercji), exit 0
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213), exit 0
- tech-tree-test: 20 pass, 0 fail, exit 0
- research-test: ALL GREEN, exit 0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21), exit 0
- combat-test: All sanity checks passed, exit 0
- Nie uruchomiono w tej rundzie: civ-welcome-screen-brand-live-test (Chromium) ani build Vite; dowód wizualny: zrzuty z rundy 1 oraz wynik Evaluatora.
BLOKADY: brak.
UWAGI-DLA-ORKIESTRATORA: brak nowych znalezisk. Pozostałe trafienia „więcej (najedź…)” w innych plikach (cityPanel, buildModeHud, empireDetailPanel) nie ukrywają listy i zostają bez zmian, zgodnie z dispatchem.
RUNDY: 2/5 (runda 1: Operator PASS, Evaluator PASS-WITH-NOTES; runda 2: obrona)
NASTĘPNY KROK: Final Control (Sonnet) na commicie obrony.
DEPLOY/PUSH: NIE WYKONANO
