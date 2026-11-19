STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-CITIES-NOT-TRANSFERRED-AND-WAR-NEXT-TURN-Q1
GOAL: pokój wymuszony z cesją miast nie może finalizować pokoju po cichu bez przeniesienia zaplanowanych miast; komunikat ma liczyć miasta faktycznie przeniesione; dodany test regresji. Część B (ponowna wojna w turze następnej) — bez odtworzenia w grze, przyczyna NIE POTWIERDZONA.
BAZA: kandydat 3df760077 (origin/main 04722f538). Poprawka w commicie poniżej.

ZMIANY/COMMIT:
- gra/src/game/diplomacy-value-catalog.ts: nowa czysta funkcja `selectSequentialCityCessions` (wybór miast sekwencyjny; zakaz „ostatniego miasta"/stolicy liczony na pozostałych miastach dawcy po poprzednich przelewach; ta sama reguła co `diplomacyMiastoZakaz`).
- gra/src/main.ts: `pendingPeaceItems` (okno i zapis pokoju wymuszonego) przepuszcza miasta przez `selectSequentialCityCessions` zamiast niezależnej walidacji każdego miasta względem stanu wyjściowego; `acceptPendingForcedPeace` liczy do komunikatu WYŁĄCZNIE miasta, których właściciel jest już zdobywcą po przelewie (wcześniej liczono zaplanowane), i loguje `console.error` przy rozbieżności.
- gra/tools/peace-city-cession-and-rewar-test.cjs (nowy): 8 asercji na prawdziwej funkcji (bundle esbuild z src/game/diplomacy-value-catalog.ts).
- commit: SHA w polu sha zwróconym przez Operatora (commit tylko ścieżek powyżej i tego raportu; bez git add -A).

ODPOWIEDZI NA ZARZUTY (Evaluator r1):
1. Brak dostarczenia — PRZYJMUJĘ. Ta runda dostarcza poprawkę i test regresji (patrz ZMIANY).
2. Skrypty bramek nieznalezione — PRZYJMUJĘ. Błąd mojej r1: skrypty istnieją (gra/tools/logic-test.cjs, tech-tree-test.cjs, research-test.cjs, unit-replace-test.cjs, combat-test.cjs; wymienione w docs/decyzje/R-PROC-AUTOBOT.md l.587–591). Wynik poniżej.
3. Brak porównania z bazą sprzed FALI 860 — PRZYJMUJĘ, wykonane w zakresie możliwym bez zapisu gry: `git diff 6b3458f6e 04722f538 -- gra/src/main.ts` (151 linii różnic w pliku). Różnice w ścieżce wojna/pokój są bramkowane flagami OFF i przy OFF są neutralne: `warLimitPermits` zwraca true, gdy `isWarLimitEnabled()` jest false (gra/src/main.ts:25963–25964); `aiAiAllianceLimitBlokujeDeal` zwraca false, gdy `isAiAiAllianceTickEnabled()` jest false (main.ts, funkcja `aiAiAllianceLimitBlokujeDeal`). Funkcja `isMajorAiCivForForcedPeace` jest bez zmian w obu wersjach. Nie porównano d425dd0a3 (nie wykonano diffu). Zachowania w grze NIE ZMIERZONO.
4. Pominięta luka kodu — PRZYJMUJĘ i naprawiam. Zgadzam się co do mechanizmu: `pendingPeaceItems` walidowało każde miasto względem stanu PRZED przelewem, więc dwa miasta dawcy z dwoma miastami przechodziły walidację; `transferCityByTreaty` przy drugim miastu zwracał false (zakaz „ostatniego miasta", diplomacy-value-catalog.ts `diplomacyMiastoZakaz`), a `transferBasketItems` tylko logował `console.error` (main.ts:~13718), pokój był finalizowany (acceptPendingForcedPeace → finalizePeaceTreatyBetween). Dodatkowo komunikat „Otrzymujemy miasta: N" liczył zaplanowane, nie przeniesione. Oba punkty naprawione (ZMIANY).

TESTY (liczby z surowego wyjścia):
- npx tsc --noEmit (node node_modules/typescript/bin/tsc): exit 0
- logic-test: LOGIC OK (213/213), RC=0
- tech-tree-test: 20 pass, 0 fail, RC=0
- research-test: PASSED 33 / FAILED 0 / TOTAL 33, RC=0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21), RC=0
- combat-test: COMBAT TEST 6/6 pass, RC=0
- peace-city-cession-and-rewar-test (nowy): PASS=8 FAIL=0, RC=0
- mutacja kopii (selektor zastąpiony starą, niezależną walidacją): PASS=5 FAIL=3 (got ["A","B"] want ["A"]; ["A","A"] want ["A"]; ["B","A"] want ["B"]), RC=1 — test czerwony na mutacji.
- diplomacy-city-cession-test: 79 pass / 0 fail
- diplomacy-city-cession-r3-test: 79 pass / 0 fail
- ai-war-weariness-peace-test: PASS=96 FAIL=0
- diplo-war-peace-gate-test: 24 pass / 0 fail
- diplo-forced-peace-pending-test: PASS=40 FAIL=0
- diplo-weariness-forced-peace-test: PASS=14 FAIL=0
- diplomacy-peace-lock-test: 9 pass / 0 fail
- era-war-ignore-treaties-test: 22 pass / 0 fail
- diplo-forced-peace-d2-guard-test: GUARD OK (9/9)
- diplo-forced-peace-pending-live-paths-test (live, Chromium, build vite poza repo do scratchpad): URUCHOMIONY NA BUILDZIE; wynik w sekcji LIVE poniżej. (Pierwsza próba bez builda: SETUP FAIL ERR_FILE_NOT_FOUND — środowiskowe, nie błąd kodu.)

LIVE-WYNIK: diplo-forced-peace-pending-live-paths-test na buildzie (vite, poza repo): EXIT 0, 20 OK, 0 FAIL (okno pokoju wymuszonego samo, na wierzchu, bramka „Zakończ turę" przy pending, akceptacja -> status pokoj, wpis warLog, kolejka dwóch wojen). Ścieżka z miastami w oknie NIE ZMIERZONO (mapa bez miast w planie).
NIE ZMIERZONO:
- Scenariusz właściciela w grze (zapis gry, 2 miasta, tura zawarcia pokoju): brak zapisu i logu konsoli właściciela. Nie wiadomo, czy zgłoszenie pochodzi z tej ścieżki (wymuszony pokój) czy z innej (propozycja przez stół / inbox).
- Asercji „owner miast po akceptacji = winner" na prawdziwym domknięciu main.ts: nie zbudowano (domknięcia w main.ts, brak hooka testowego w tym temacie). Test pokrywa wybór miast, nie przelew.
- Wariant „Oddajesz: <miasta>" w oknie: live S3 nie miał miast w planie (NOTA w logu live).
- Część B (ponowna wojna w turze następnej): nie odtworzono.

BLOKADY / ZAŁOŻENIA:
- ZAŁOŻENIE 1 (część A): mechanizm „drugie miasto pada po pierwszym" jest jedną z możliwych przyczyn; NIE POTWIERDZONE, że to przyczyna zgłoszenia (liczba miast zgłoszona przez właściciela nie została zweryfikowana).
- ZAŁOŻENIE 2 (część B, hipoteza NIE POTWIERDZONA): wojna w następnej turze to prawdopodobnie wojna EPOKI, która świadomie omija blokadę pokoju (R-WEB-ERA-WAR-IGNORE-TREATIES-Q1; war-rules-multiwar.ts:426 — eraWar blokuje tylko sojusz; test era-war-ignore-treaties-test zielony 22/0). Zwykłe wypowiedzenie respektuje blokadę (isWarTreatyBlocked, peaceUntilTurn = tura+10, diplomacy-peace-lock). To jest decyzja projektowa, nie błąd.
- ZAŁOŻENIE 3 (odstępstwo od C): przy nieopłacalnym (nieprzenoszalnym) mieście poprawka NIE cofa całego pokoju — usuwa to miasto z okna i z przelewu, pokój zawiera zdobywalne miasta. Pokój wymuszony nie ma opcji odmowy, więc „pokój wraca" nie jest tu wykonalne bez nowej reguły.

PYTANIE ABC DLA WŁAŚCICIELA (decyzja, nie wybieram sam):
A) Pokój wymuszony z planem miast, których nie da się wszystkich przenieść: (1) przyjąć zdobywalne miasta, reszta usunięta z planu [rekomendacja, zaimplementowane]; (2) zablokować cały pokój do czasu, aż plan będzie wykonalny; (3) przeliczyć plan od nowa (nowy plan wymuszonego pokoju).
B) Czy wojna epoki ma omijać świeży pokój (obecna reguła IGNORE-TREATIES)? (1) tak, zostaje [domyślnie]; (2) nie, karencja po pokoju obowiązuje także dla wojny epoki.

NASTĘPNY KROK: (1) zapis gry właściciela albo log konsoli z tury zawarcia pokoju (szukać: „[ForcedPeace] BŁĄD", „[Dyplomacja] BŁĄD: cesja miasta", powód wypowiedzenia wojny); (2) odpowiedź na pytania ABC; (3) Evaluator sprawdza commit i ścieżkę main.ts.
UWAGI-DLA-ORKIESTRATORA: gra/node_modules zainstalowane w worktree (gitignored). Build do scratchpadu poza repo. Nie utworzono żadnych sesji, zadań, harmonogramów. Pliki pomocnicze testu (.peace-cession-seq-*) sprzątane przez test; w repo nie zostawiono śmieci (git status: tylko 3 ścieżki z allowlisty + ten raport).
DEPLOY/PUSH: NIE WYKONANO
