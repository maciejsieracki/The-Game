STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko komentarze i opisy testów, bez zmiany zachowania)
TEMAT: R-WEB-DOC-WEARINESS-STALE-5PCT-20TURNS-COMMENTS-Q1
GOAL: usunąć stare opisy zmęczenia „20 tur / 5%” po przejściu na jeden licznik 40 tur (2,5%/turę, +10% za miasto).
ZMIANY/COMMIT: baza 2bf48a4a3 (kandydat Operatora). Nowe zmiany w tej rundzie (obrona):
  - gra/src/game/diplomacy.ts:1366 — komentarz „20 tur do 100%” → „40 tur do 100%” (zarzut 1, PRZYJMUJĘ)
  - gra/tools/diplo-weariness-display-test.cjs:50 — komentarz „skala 20 tur” → „skala 40 tur” (zarzut 2, PRZYJMUJĘ)
  - gra/tools/diplo-war-peace-main-guard-test.cjs:96 — etykieta asercji „jeden licznik 20 tur” → „40 tur” (zarzut 2, PRZYJMUJĘ; zmieniono tylko tekst etykiety, nie warunek)
  Commit: patrz sekcja SHA poniżej.
TESTY (surowe wyjście, exit code):
  - npm ci (gra/): added 71 packages, exit 0 (bez npm run build)
  - npx tsc --noEmit: exit 0
  - diplo-weariness-display-test: exit 0
  - diplo-war-peace-main-guard-test: exit 0
  - diplo-weariness-20-turns-test: exit 0
  - peace-gate-military-strength-test: exit 0
  - diplo-json-descriptions-sync-test: WYNIK: 46/46 OK, FAIL: 0
  - json-descriptions-sync-test: 19 pass / 0 fail
  - logic-test: LOGIC OK (213/213)
  - tech-tree-test: 20 pass, 0 fail
  - research-test: PASSED 33 / FAILED 0 / TOTAL 33
  - unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
  - combat-test: COMBAT TEST 6/6 pass
  - git diff --check: czysto
BLOKADY: brak. Ślad poza worktree: /tmp/x (wynik tsc, zapisany przez pomyłkę; nie usunięty, bo zakaz rm).
RUNDY: 1/5 (obrona)

ODPOWIEDZI NA ZARZUTY EVALUATORA:
  Zarzut 1 (diplomacy.ts:1366, niski): PRZYJMUJĘ. Poprawione, patrz wyżej.
  Zarzut 2 (diplo-weariness-display-test.cjs:50 i diplo-war-peace-main-guard-test.cjs:96, niski): PRZYJMUJĘ. Oba poprawione.
  Pola legacy zmeczenieT (diplomacy-war-peace-profile.ts:211, diplomacy-peace-lock.ts:121-122) — ODRZUCAM jako poprawkę w tej rundzie: opisują osobny, nieużywany licznik (zgodnie z ustaleniem Evaluatora), zmiana wymagałaby decyzji o usunięciu pola, poza zakresem komentarzy. Wpisane do UWAG.

UWAGI-DLA-ORKIESTRATORA:
  - Pozostałe „20 tur” w gra/src i gra/tools dotyczą innych mechanik (wojny wymuszone, NAP, urazy) albo są historycznym opisem migracji (war-weariness.ts:250 „skala 20 tur” — opisuje stary zapis, poprawne) albo nazwy plików/ID R-WEB-…-20-TURNS-Q1 (zostają).
  - diplo-war-peace-profile-unit-test.cjs:79,91,92 — testy helpera warWearinessShare(20,20) z legacy licznikiem D4; nie są stare opisy liczbowe weba, ale nazwy „pełne po 20 turach” są przestarzałe. Niski priorytet, osobny temat.
  - docs/: rg po „5%/turę” i „20 tur” przy zmęczeniu nie znalazł starych opisów (rozejm-pokoj.md i zmeczenie-wojna.md mówią 2,5%/40 tur).
  - Plik /tmp/x (wynik tsc) pozostał — wskazać do sprzątania.

NASTĘPNY KROK: Evaluator r2 na commicie poprawki (bramki zielone jak wyżej).
DEPLOY/PUSH: NIE WYKONANO

SHA: zapisany w polu sha odpowiedzi StructuredOutput.
