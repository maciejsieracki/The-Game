STATUS: BLOCK (kod i bramki zrobione; pomiar Wojownik vs Wojownik w żywym Chromium NIE ZMIERZONO, bo uruchomienie `vite build` zostało odrzucone przez klasyfikator uprawnień)
DOMAIN: GAME (tylko hak testowy ?civtest + narzędzia testowe)
TEMAT: R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1
GOAL: (1) opcjonalny piąty argument typeId w __civTest.addUnit (bez typeId = dotychczasowe zachowanie; z typeId = klon wg units.json; nieznany typ = null; hak tylko przy ?civTest); (2) pomiar Wojownik vs Wojownik 10 vs 10 w Chromium (ręczny z rozkazami / AUTO / skip, >=3 ziarna); (3) nic poza tym.
ZMIANY/COMMIT: baza origin/main 76a1739fddb415edc2204c404e9aab43e6cf5b30; commit z kodem i raportem (SHA w polu sha odpowiedzi orkiestratora)
  - gra/src/main.ts: blok `addUnit` w __civTest (+17/−1 linii; dispatch zakładał ≤~15, przekroczenie o 2 linie to komentarz i rozbicie warunku)
  - gra/src/game/civ-test-hooks.ts: DEVIATION OD ALLOWLISTY (wymagane): typy `addUnit` w dwóch interfejsach (deps i API) oraz forwarder `addUnit: (ownerId, q, r, civilian = false, typeId) => deps.addUnit(...)`. Bez tego piąty argument jest gubiony przed dotarciem do main.ts. Zakres: 3 linie zmienione, bez zmiany logiki gate'u.
  - gra/tools/civtest-addunit-typeid-test.cjs (nowy): statyczny test haka (7 asercji), przyjmuje opcjonalne ścieżki plików do mutacji.
  - dyspozycje/autobot/runs/R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1/10-operator-claude.md (ten raport)
  - Nie zmieniono: gra/data, gra-robocza/**, WERSJE.md, inne pliki src.
  - Uwaga: DODATEK orkiestratora (00-dispatch-DODATEK-claude.md) NIE istnieje w gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 ani w commicie 76d23235b (sprawdzone git ls-tree). Operator pracował wyłącznie wg 00-dispatch.md z commita 76d23235b, który w tej gałęzi jest pod ścieżką dyspozycje/autobot/runs/R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1/00-dispatch.md. Środowisko i zakazy przyjęto wg dispatchu i CLAUDE.md. Luki rozstrzygnięte ZAŁOŻENIEM: typ `Wojownik` jest w units.json (1 trafienie), klon dla typeId idzie wprost z definicji typu (bez szablonu właściciela), pola birth-bonus (pancerzBonusProc/parametryBonusProc) pominięte = 0.

TESTY:
  - `npx tsc --noEmit` w gra/: exit 0 (brak błędów)
  - Bramki referencyjne (wynik z surowego wyjścia):
    - node tools/logic-test.cjs: LOGIC OK (213/213), exit 0
    - node tools/tech-tree-test.cjs: tech-tree-test: 20 pass, 0 fail, exit 0
    - node tools/research-test.cjs: PASSED: 33 / FAILED: 0 / TOTAL: 33, exit 0
    - node tools/unit-replace-test.cjs: WSZYSTKIE TESTY ZIELONE (21/21), exit 0
    - node tools/combat-test.cjs: COMBAT TEST: 6/6 pass, exit 0
  - Nowy test statyczny: node tools/civtest-addunit-typeid-test.cjs -> ADDUNIT-TYPEID STATIC: 7/7, exit 0
  - Mutacja (kryterium a): kopia main.ts w scratchpad z ignorowaniem nieznanego typu (`return undefined` zamiast `return null`) -> ADDUNIT-TYPEID STATIC: 6/7, FAIL na asercji "nieznany typ -> null", exit 1 (test wykrywa mutację)
  - Dowód widoczności tylko przy ?civTest: hooki instalowane przez installCivTestHooks z gate'em isCivTestEnabled (istniejący mechanizm, bez zmiany); zmiana nie dodaje nowego obiektu poza tym blokiem.
  - Pomiar (kryterium b): NIE ZMIERZONO. Powód: próba `npx vite build --outDir <scratchpad>/dist-addunit` została odrzucona przez klasyfikator uprawnień (auto mode), więc nie powstał bundle do uruchomienia w Chromium (xvfb-run /usr/bin/chromium dostępne). Driver na bazie gra/tools/live-verify-w3-manual-orders-r3.cjs NIE został napisany ani uruchomiony. Brak tabeli wyników, brak liczb dla trybów ręczny/AUTO/skip.

BLOKADY:
  1. Pomiar live (zadanie (2) dispatchu) nie wykonany: odmowa `vite build` przez klasyfikator uprawnień. Nie obchodziłem odmowy. Do wznowienia potrzebne: zgoda na `npx vite build --outDir <poza repo>` w gra/ (dispatch to dopuszcza) albo wykonanie buildu przez orkiestratora, a następnie uruchomienie driver-a Wojownik vs Wojownik.
  2. Dispatch wskazuje DODATEK w gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 — plik nie istnieje (patrz ZMIANY).
  3. Odstępstwo od allowlisty: gra/src/game/civ-test-hooks.ts (wymagane typowanie, patrz ZMIANY).

RUNDY: 1/5 (runda 1; brak poprawek po Evaluatorze)
NASTĘPNY KROK: Evaluator (SONNET) sprawdza kryteria (a) i (d) z dispatchu (diff: main.ts 17 linii + civ-test-hooks.ts 3 linie + test statyczny). Kryterium (b) wymaga zgody na build i rundy pomiarowej; do decyzji orkiestratora czy pomiar idzie jako osobna runda (R2 pomiarowa) czy zamknięcie z BLOCK.

UWAGI-DLA-ORKIESTRATORA:
  - Polecenie „Zadaj pytania ABC” z żądania użytkownika nie zostało wykonane przez operatora: pytania ABC są poza rolą operatora (właściciel komunikuje się w głównym czacie orkiestratora, C-043). Decyzje ABC do przekazania orkiestratorowi: brak nowych; dispatch zakłada decyzję właściciela z 2026-11-17 „TAK, dodać hak”.
  - Znaleziska poza zakresem: brak nowych sesji ani zadań nie tworzono (zakaz spawn_task/create_session respektowany).
  - Pozostały stan środowiska: gra/node_modules zainstalowane w worktree (npm ci --ignore-scripts), nie w git. Do sprzątania po temacie.

DEPLOY/PUSH: NIE WYKONANO
