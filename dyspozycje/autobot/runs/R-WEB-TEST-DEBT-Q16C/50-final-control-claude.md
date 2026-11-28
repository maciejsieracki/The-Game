STATUS: FAIL
DOMAIN: PROCESS/GAME-TEST
TEMAT: R-WEB-TEST-DEBT-Q16C
GOAL: sklasyfikować 3 czerwone testy (baza dbcc12f71), naprawić klasę A bez zmiany gry, B/C opisać z dowodem; każdy z trzech: zielony z mutacją (A) albo B/C z dowodem.
ZMIANY/COMMIT: kandydat fbec7ee9d03082de18519b6c61251f0e2d189357; `git merge-base --is-ancestor dbcc12f71 fbec7ee9d` = tak. `git diff --stat dbcc12f71..fbec7ee9d` = 9 plików (2 testy w gra/tools, DLUG-TESTOWY-Q16C, 10-operator, 30-obrona, 4 logi txt), `git diff --stat -- gra/src gra/data` = 0, `git diff --check` czysty. Allowlista zachowana.

OCENA ZARZUTÓW (1-4: brak commitu/dokumentu/klasyfikacji/raportu): odpowiedzi obrony przyjęte jako ZAŁATWIONE w zakresie istnienia artefaktów (commit, dokument, 10-operator, 30-obrona są). Zarzut 3 pozostaje CZĘŚCIOWO otwarty: patrz niżej.

TESTY (własne, surowe wyjście):
- tsc --noEmit w gra/ (po npm ci --ignore-scripts): RC 0.
- ai-wojny-zwykle-cap-dwa-miasta-test.cjs na fbec7ee9d: "22 PASS, 0 FAIL", RC 0 (niezależnie potwierdza twierdzenie obrony; asercja F trafia w realny main.ts). Regex z `peaceLocked: false` sprawdzony przeze mnie na main.ts: brak trafienia (mutacja wyrażenia OK).
- Bramki logic 213 i ai-test 297/0: NIE URUCHAMIANO (git diff gra/src = 0, więc wynik bazowy nie może się zmienić); NIE ZMIERZONO w tej rundzie.
- hotseat-drugi-fotel-tura-test.cjs: NIE URUCHAMIANO przeze mnie (Chromium SIGSEGV w logach 33/34 obrony; pełny przebieg nie istnieje).
- hotseat-etap4-noop-test.cjs: NIE URUCHOMIONY przez nikogo w tej rundzie.

USTALENIA:
1. ai-wojny: klasa A, naprawa poprawna, nie osłabia testu (asercja F wzmocniona do isWarTreatyBlocked; bramka NNS obsłużona realnym helperem). Brak jedynie mutacji czerwono->zielonej na poziomie harnessu (A1); mutacja regexu (A2) jest. Do przyjęcia z notą.
2. hotseat-drugi-fotel: poprawka selektorów hurtowym sed w całym pliku; brak pełnego przebiegu, brak dowodu, że późniejsze scenariusze zgadzają się z kreatorem; klasa C jest tylko deklaracją z 3 prób, bez zamkniętego wyniku. Kryterium binarne NIESPEŁNIONE (ani zielony+mutacja, ani udokumentowane C z dowodem końcowym dla całego pliku).
3. hotseat-etap4-noop: klasyfikacja "C" oparta wyłącznie na historii z Q16B, bez próby w tej rundzie. Kryterium NIESPEŁNIONE.

BLOKADY: hotseat-drugi-fotel (nieukończony przebieg + niezweryfikowane selektory), hotseat-etap4-noop (nieuruchomiony), brak mutacji harnessu dla ai-wojny.
RUNDY: FC po rundzie Operatora 2 (obrona 1/5); do wykorzystania zostają rundy do limitu 5.
NASTĘPNY KROK: wrócić do Operatora z tym samym ID: (a) pełny przebieg hotseat-drugi-fotel w segmentach <=590 s z ponowieniem po SIGSEGV, przegląd selektorów wszystkich scenariuszy; (b) uruchomić hotseat-etap4-noop (<=3 próby) i udokumentować wynik albo C z logiem; (c) opcjonalnie mutacja A1 (usunięcie prepareEndTurnGate -> czerwone). Zmiana ai-wojny może być zachowana bez zmian.
UWAGI-DLA-ORKIESTRATORA: brak zmian gry; zielony ai-wojny wolno przenieść do kolejnej rundy; worktree FC posprzątany (node_modules, dist usunięte).
DEPLOY/PUSH: NIE WYKONANO
