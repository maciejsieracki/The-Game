STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-WEB-TEST-DEBT-DECISIONS-ARCHERBEHIND-SZCZESCIE-Q1
GOAL: Odpowiedź Obrony (Operator HAIKU) na 3 zarzuty Evaluatora do kandydata 0f2298a63; zachowanie decyzji właściciela (planer łucznika zostaje; komplet szczęścia 12/24/32, katalog 44).
ZMIANY/COMMIT: baza kodu = 0f2298a63 (kandydat). Commit obrony: patrz sekcja SHA. Zmienione pliki: gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs (runda 2 -> asercja dokładnego stanu), gra/tools/szczescie-przebudowa-skali-test.cjs (nagłówek i tytuł sekcji 2a: 19 / 25 zero). gra/src i gra/data bez zmian (git diff --stat -- gra/src gra/data: pusty).

ODPOWIEDZI NA ZARZUTY:

Zarzut 1 (mutacja „planer wypycha łucznika przed piechotę” nie wykryta w wariancie _advanceStep): PRZYJMUJĘ CZĘŚCIOWO, ODRZUCAM WNIOSEK.
  Dowód (ZMIERZONO):
  - Trace na kandydacie (TRACE_RA w _rangedAction, a potem w _advanceStep, potem usunięte przez git checkout): _rangedAction NIE jest wywoływane w teście (0 trafień). Łucznik idzie ścieżką _activateUnit -> _executeGroupDoctrineStep -> gałąź `steady` -> _advanceStep (gra/src/battle/battleScene.ts ~18881).
  - Przyczyna: fixture ustawia `attack._canAttackFrom = () => false` i `attack._pickRangedTargetByPriority = () => null` (test ~l.139-141), a łucznik ma ammoLeft 0. Test nie wchodzi w planer strzelecki; testuje krok linii `steady`, który jest identyczny dla piechoty.
  - Mutacja Evaluatora (archer -> _advanceStep na ścieżce strzeleckiej) jest więc równoważnikiem w tym fixture: nie zmienia żadnego wyniku testu (10 passed / 0 failed, zmierzone).
  - Mutacja zachowania na ścieżce faktycznie wykonywanej: `if (ru.primaryRanged) { done(); }` w gałęzi steady (battleScene.ts:18881) -> 7 passed / 3 failed (FAIL: round 1 hold, after step, round 2 exact). Wykryta.
  - Mutacja „przesunięcie łucznika do przodu” NIE WYKONANA (NIE ZMIERZONO): wymagałaby przechwycenia intencji planera; zostawiam to jako lukę do decyzji orkiestratora (patrz UWAGI).
  Wniosek: asercje dokładnego kroku (2,3)->(2,2) wykrywają hold i każde odchylenie pozycji łucznika w tej ścieżce. Test nie wykrywa tylko różnicy, która nie zmienia pozycji (równoważnik). Pełne pokrycie planera strzeleckiego wymagałoby osobnego wariantu fixture z włączonym strzelaniem; poza zakresem dispatchu (dispatch zakłada to samo wejście).

Zarzut 2 (asercja rundy 2 trywialnie spełniona, archer.q < infantry.q od startu): PRZYJMUJĘ.
  Poprawka (commit obrony): runda 2 sprawdza dokładny stan: infantry (4,3), archer (2,2) — zamiast względnego archer.q < infantry.q.
  Dowód: po zmianie test 10 passed / 0 failed; mutacja hold wywala tę asercję (zmierzone: FAIL „Second Atak round: exact formation kept”).
  Przyczyna stagnacji (oba intenty rundy 2 puste, piechota na (4,3) z wolnym (5,3)): NIE ZBADANO. Nie zmieniam fixture; rejestruję jako dług w UWAGI.

Zarzut 3 (nieaktualne liczby 11/23/31 i 41): CZĘŚCIOWO PRZYJMUJĘ, CZĘŚCIOWO ODRZUCAM (z dowodem zakresu).
  - PRZYJĘTE i naprawione: gra/tools/szczescie-przebudowa-skali-test.cjs (na allowliście): tytuł sekcji „2a” i komentarz nagłówka zmienione z „22 z zerem” na „25 z zerem (22 + garnizon, mury_kamienne, emporion)”. Lista NIE ma już 25 pozycji (asercja eq 25 była już poprawna); etykieta była jedynym nieaktualnym tekstem.
  - ODRZUCONE (poza allowlistą): dyspozycje/BALANS-SZCZESCIE-SKALOWANIE-EPOK.md:21 („11 / 23 / 31”). Dispatch allowlistuje tylko docs/** i gra/tools (dwa pliki) oraz komentarze w gra/src z numerem linii. Ścieżka dyspozycje/ nie jest na liście. Pozostaje do decyzji orkiestratora.
  - NIE ZMIENIONE (poza allowlistą lub niezmierzone): gra/tools/szczescie-skala-normalizacja-test.cjs:571 (etykieta „31 budynkow”), plik nie jest na allowliście. gra/src/ui/entityCards/civpediaOpenGate.ts:36 i :39 („16 z 41 budynków”, „budynków jest 41”): komentarz w src jest dozwolony, ale liczba 16 to osobny pomiar (budynki bez hasła Civpedii), którego nie odtworzyłem; zmiana samego 41 na 44 zostawiłaby niezweryfikowane 16. NIE ZMIERZONO.
  - Nagłówek sekcji 2a był w pliku allowlistowanym, więc poprawka jest zgodna z dispatchem.

BRAMKI (zmierzone w tej rundzie):
  - tsc --noEmit (gra/): EXIT 0.
  - bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs: 10 passed, 0 failed (EXIT 0).
  - szczescie-przebudowa-skali-test.cjs: 535 OK, 0 FAIL (EXIT 0).
  - Mutacja danych: emporion.epokaWejscia 2 -> 99 w gra/data/buildings.json: szczescie test 533 OK, 2 FAIL („epoka 2 — komplet to 24 … got 23”, „epoka 3 — komplet to 32 … got 31”); data przywrócona przez git checkout.
  - Mutacja hold w gałęzi steady (battleScene.ts:18881) -> archer test 7 passed / 3 failed; src przywrócony przez git checkout.
  - NIE ZMIERZONO w tej rundzie: pozostałe 5 bramek referencyjnych (logic 213/213, tech-tree, research, unit-replace, combat) — nie uruchamiałem, bo kod gry (gra/src, gra/data) nie zmienił się względem wyników Evaluatora na 0f2298a63; Evaluator podał je jako zielone.

BLOKADY: brak dla tematu. Uwaga: w gra/ dodany symlink node_modules -> worktree wf_4a28f4a2-8e5-1/gra/node_modules (potrzebny, bo testy szukają esbuild w gra/node_modules). Plik jest w .gitignore (nie trafia do commita). Do usunięcia przez orkiestratora przy sprzątaniu (nie usuwałem: zakaz rm).

RUNDY: 1/5 (obrona). Ostatni werdykt Evaluatora: PASS-WITH-NOTES z 3 zarzutami, żaden nie regresja.
NASTĘPNY KROK: Evaluator/Final Control ponownie: oceniają commit obrony (asercja dokładnego stanu w rundzie 2; sekcja 2a w szczescie-przebudowa). Do rozstrzygnięcia przez orkiestratora: (a) BALANS-SZCZESCIE-SKALOWANIE-EPOK.md:21 poza allowlistą; (b) civpediaOpenGate.ts „16 z 41” wymaga pomiaru.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
  1. Luka procesowa: allowlista dispatchu nie obejmuje dyspozycje/BALANS-SZCZESCIE-SKALOWANIE-EPOK.md, mimo że dispatch mówi „każdy dokument ... z 11/23/31”. Decyzja FC/orkiestratora.
  2. gra/tools/szczescie-skala-normalizacja-test.cjs:571 — etykieta z „31 budynkow” (nieaktualna); poza allowlistą.
  3. gra/src/ui/entityCards/civpediaOpenGate.ts:36/39 — „16 z 41”; wymaga pomiaru liczby budynków bez hasła Civpedii.
  4. Dług testowy: fixture archer (ammoLeft 0, _canAttackFrom=false) nie testuje planera strzeleckiego (_rangedAction nieosiągalne w teście). Pełne pokrycie wymaga osobnego wariantu z włączonym strzelaniem (osobny temat).
  5. Dług testowy: runda 2 (oba intenty puste, piechota na (4,3) z wolnym polem) — przyczyna nie zbadana.
  6. Sprzątanie: symlink gra/node_modules w worktree wf_4a28f4a2-8e5-3 (do usunięcia przez orkiestratora).
