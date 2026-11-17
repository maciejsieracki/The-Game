STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-OLD-SAVE-ZERO-CITIES-NO-AWAIT-FIRST-CITY-Q1
GOAL: stary zapis (bez pola playerEverOwnedCityByOwner) z turą > 1 nigdy nie wraca do „czekam na pierwsze miasto” (ABC A, 2026-11-16).
BAZA/KANDYDAT: origin/main ef6e8ea1ee7c3d1019a537546153f53af9f4b115; kod operatora 8111fb3bfd5d5c368740c4e644d8eee2bbfe3db0 (bez zmian kodu w tej rundzie obrony).
RUNDA OBRONY: 2/5 (odpowiedź na zarzuty Evaluatora cf240f931).

ZMIANY/COMMIT:
- Kod gry: BEZ ZMIAN w tej rundzie (poprawka z 8111fb3bf zostaje; patrz odpowiedzi 1 i 3 — żadna z nich nie wymaga zmiany kodu bez decyzji właściciela).
- Dodane dowody po poprawce (katalog evidence/ w tym runie): nocity-new-run-POST-FIX.txt, nocity-endturn-block-probe.txt, nocity-mutant-no-old-save-branch.txt, nocity-turn1-no-city-gate.txt, withcity-old-save-POST-FIX.txt, roundtrip-drift-dynamic-seed4242.log, save-load-player-owned-city-test.log.
- Przywrócony plik COMPAT-Q1/evidence/new-result.json (nadpisany przez uruchomienia narzędzia live; stan kandydata).
- Commit tylko tego katalogu runu (git add <katalog>, bez -A).

ODPOWIEDZI NA ZARZUTY EVALUATORA (cf240f931):

Zarzut 1 (kryterium A4 „Zakończ turę działa 3 razy” dla zapisu 0 miast) — PRZYJMUJĘ CZĘŚCIOWO.
- Fakt potwierdzony: po wczytaniu zapisu 0 miast (SYMULACJA: make-nocity-save.cjs z save-old-6t) awaiting=false, tura 7 -> 8, a drugi „Zakończ turę” jest zablokowany. Dowód: evidence/nocity-endturn-block-probe.txt (instrumentowana kopia narzędzia, ten sam bundle): warns = „[EndTurn] triggerPlayerEndTurn: DONE tura 8” i po nim „[EndTurn] blocked: gameOver”; hak __defeatTestDebug.isGameOver() = true.
- Przyczyna: checkDefeat (gra/src/game/victory.ts:214-220): przegrana gdy graczKiedysMialMiasto && isEliminated(0 miast). Po poprawce flaga = true, więc przegrana wypada na końcu pierwszej tury po wczytaniu. Jest to skutek istniejącej reguły R-WEB-DEFEAT-LAST-CITY, nie błąd nowej gałęzi.
- WYCOFUJĘ moją wcześniejszą przyczynę „bramka NNS” z 10-operator-claude.md: w tym samym przebiegu nnsGateBlocked() = false (bypass:false), a warn NNS nie pojawia się w liście. Przyczyną blokady była gameOver.
- Wątpliwość Evaluatora „czy osadnik wpływa na checkDefeat” — ODRZUCAM z dowodem: checkDefeat przyjmuje tylko { cities, gracz, graczKiedysMialMiasto }; nie ma wejścia jednostek (victory.ts:214-220); komentarz w victory.ts:206-208 mówi wprost, że osadnicy i jednostki wojskowe nie wchodzą w grę.
- Kryterium A4 w dosłownym brzmieniu („3 razy”) NIE jest spełnione dla zapisu 0 miast. Spełnione: awaiting=false, co najmniej jedna tura, brak blokady end-turn. Decyzja, którą rozstrzyga właściciel (ABC):
  A) zostaje obecne zachowanie: stary zapis 0 miast w turze > 1 kończy grę przegraną przy pierwszym końcu tury (zgodne z R-WEB-DEFEAT-LAST-CITY). Rekomendacja Operatora: A, bo flaga „kiedyś miał miasto” jest ustawiana dla takiego zapisu z założenia (ABC A), a przegrana wynika z istniejącej reguły.
  B) stary zapis 0 miast gra dalej bez przegranej w pierwszej turze po wczytaniu: wymaga osobnego mechanizmu (np. osobna flaga tylko do blokady awaiting, bez graczKiedysMialMiasto) — zmiana kodu w main.ts i nowy test; NIE wykonuję bez decyzji.
- Proponowane przeformułowanie A4 (jeśli wybrana A): „Zakończ turę działa co najmniej raz; awaiting=false; po przegranej gameOver jest zamierzone”.

Zarzut 2 (brak dowodu po poprawce w repo) — PRZYJMUJĘ.
- Stare pliki COMPAT-Q1/evidence/nocity-new-run.txt i nocity-result.json (awaiting:true, FAIL=3) są stanem PRZED poprawką; zostają jako historia, nie są dowodem po poprawce.
- Dowody po poprawce: patrz lista w sekcji ZMIANY (katalog evidence/ tego runu): nocity-new-run-POST-FIX.txt (awaiting=false, miasta 41=41, jednostki 61=61, dziennik 6=6, tura 7->8, drugi klik zablokowany przez gameOver — patrz zarzut 1), withcity-old-save-POST-FIX.txt (WYNIK brak FAIL, tury [7,8,9,10], miasta 42=42, jednostki 61=61).
- Mutacja żywa (wyłączenie gałęzi else-if w kopii bundla): nocity-mutant-no-old-save-branch.txt — awaiting:true, cannot-end w turze 7, WYNIK FAIL=3. Test żywy wykrywa brak poprawki.

Zarzut 3 (test statyczny = regex; SAVE_RE pomija pusty zbiór) — CZĘŚCIOWO PRZYJĘTE, CZĘŚCIOWO ODRZUCONE.
- (a) Regex: ACCEPT jako ograniczenie. Warunek OLD_SAVE_RE jest tego samego typu co pozostałe trzy warunki pliku (SAVE_RE, RESTORE_RE, HEURISTIC_RE), więc spójny z tym testem. Zachowanie sprawdza teraz narzędzie żywe (dowody powyżej). Narzędzie żywe NIE jest w bramkach — to decyzja procesowa, zostawiona orkiestratorowi (UWAGI).
- (b) SAVE_RE nie zapisuje pustego zbioru: ODRZUCAM jako defekt. Gałąź else-if dla NOWEGO zapisu z turą > 1 i pustym zbiorem jest nieosiągalna w zwykłej grze: tura 1 nie kończy się bez miasta (evidence/nocity-turn1-no-city-gate.txt: zapis 0 miast w turze 1 -> awaiting:true, cannot-end w turze 1), więc gracz nie dochodzi do tury > 1 bez flagi. Gdyby jednak doszło, skutek byłby ten sam co dla starego zapisu (ABC A). Zgadzam się z oceną Evaluatora: „praktycznie nieosiągalny”.

BLOKADY:
- Kryterium A4 w dosłownym brzmieniu nie spełnione (zarzut 1) — wymaga decyzji ABC właściciela (A/B).
- Dynamiczna warstwa roundtrip dla seed 777: NIE ZMIERZONO (limit czasu 560 s dla obu ziaren łącznie; seed 4242 zmierzony osobno).
- Ekonomia po wczytaniu zapisu 0 miast: NIE ZMIERZONO (narzędzie nie zapisało pliku metryk dla tego scenariusza).
- Dryf ekonomii przy niepustych mapach zamówień: NIE ZMIERZONO (w zapisie puste).
- Wpływ poprawki na dodatkowe fotele ludzkie (activeHumanOwnerId/humanOwnerIds w starym zapisie tura > 1): NIE ZWERYFIKOWANO, czy flaga innych foteli wpływa na tury/ekonomię; checkDefeat używa tylko HUMAN_OWNER_PRIMARY (main.ts:36477, 46322).
- Pięć referencyjnych bramek po npm ci: NIE ZMIERZONO w tej rundzie (uruchomione tylko te poniżej).
- MP/hotseat: poza zakresem, NIE ZMIERZONO.

TESTY (surowe wyniki tej rundy, commit kodu 8111fb3bf):
- npm ci w gra/: exit 0, dodano 71 pakietów (log poza repo).
- tsc --noEmit (gra/): EXIT 0, bez wyjścia.
- vite build poza repo (wyjście: scratchpad/r1/dist): ✓ built in 18.19s, EXIT 0.
- save-load-player-owned-city-test.cjs: RESULT PASS; mutacje kopii „bez zapisu (SAVE)” i „bez uzupełnienia starego zapisu z tura > 1 (ZERO-CITIES)” wykryte (niespełnionych warunków: 1 każda); dowód: evidence/save-load-player-owned-city-test.log.
- load-game-regression-test.cjs: 34 PASS / 0 FAIL, EXIT 0.
- save-load-roundtrip-state-drift-test.cjs, warstwa statyczna: OK (10/10 wg przebiegu poprzedniego runu; w tej rundzie wywołanie bez --dist zwraca FAIL wymagania --dist — to oczekiwane, warstwa dynamiczna wymaga dist).
- save-load-roundtrip-state-drift-test.cjs, warstwa dynamiczna --seeds 4242 --dist: „SAVE-LOAD ROUNDTRIP OK”, 10/10 tur zgodnych, EXIT 0 (evidence/roundtrip-drift-dynamic-seed4242.log).
- save-load-old-save-compat-live.cjs --phase new, zapis 0 miast (POST-FIX): awaiting=false; miasta 41=41; jednostki 61=61; dziennik 6=6; PASS brak pageerror; tura 7->8; drugi klik cannot-end (gameOver, zarzut 1). WYNIK FAIL=2 (dwa kryteria A4 w dosłownym brzmieniu).
- save-load-old-save-compat-live.cjs --phase new, zapis z miastami (POST-FIX): WYNIK brak FAIL; miasta 42=42; jednostki 61=61; isAwaitingFirstPlayerCity=false; tury [7,8,9,10].
- Mutacja żywa (gałąź else-if usunięta w kopii bundla): awaiting=true, cannot-end w turze 7, WYNIK FAIL=3.
- Zapis 0 miast z tura=1 (kopia, SYMULACJA: pole tura ustawione na 1): awaiting=true, cannot-end w turze 1 — kryterium (c) „tura 1 nowej gry blokuje do stolicy” potwierdzone dla ścieżki wczytania.
- git merge-tree origin/main HEAD: czysty (tree 851e777751549bc39bc0f496ec881754d309e0f7).
- git diff --check: czysto.

RUNDY: 2/5. Ostatni werdykt Evaluatora: PASS-WITH-NOTES (cf240f931). Decyzja wymagana: ABC A/B (zarzut 1).
NASTĘPNY KROK: (1) właściciel wybiera A albo B dla skutku przegranej na pierwszej turze po wczytaniu zapisu 0 miast; (2) przy A: przeformułować kryterium A4 i Evaluator r2 na ten sam kod; przy B: nowa runda Operatora z osobnym mechanizmem (bez zmiany tego, co już przeszło testy 1–3); (3) Final Control po werdykcie.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- 10-operator-claude.md (runda 1) zawiera błędną przyczynę A4 („bramka NNS”). Wycofana tutaj; prawidłowa przyczyna: gameOver po checkDefeat. Orkiestrator decyduje, czy poprawić tamten plik.
- Commit 8111fb3bf dodał narzędzie live i dowody do katalogu R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1/evidence (zgodnie z dispatchem: przywrócone z refs/keep/OLDSAVE-r2-obrona). Stare pliki tam (nocity-new-run.txt, nocity-result.json) są przed poprawką — mogą mylić przy przeglądzie.
- Narzędzie save-load-old-save-compat-live.cjs nie jest w bramkach; zostawiam jako decyzję procesową.
- Ślad po pracy: gra/node_modules (npm ci) i katalog scratchpad (dist, mut, probe) — sprzątane po commicie tej rundy.
- Pytanie ABC do właściciela (A/B z zarzutu 1) — orkiestrator zadaje, nie Operator.
