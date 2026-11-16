STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI powiadomień / wydarzenia)
TEMAT: R-WEB-UI-EVENTS-NO-FOREIGN-ADMINISTRATOR-DISMISSED-Q1
GOAL: Gracz nie dostaje wpisu „Administrator odszedł” za zdobyte miasto obcej cywilizacji z zarządcą (zostaje wpis o zajęciu miasta). Gracz, który traci własne miasto z zarządcą, dostaje wpis o własnym zarządcy. Zdarzenia AI↔AI nie trafiają do wydarzeń gracza. Mechanika zwalniania bez zmian.
BAZA: 774fd0eec7de9438c9359756d48b135ebb79df7b (origin/main), checkout detach. Dispatch z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (DODATEK: runda 1/5).

ZMIANY/COMMIT (allowlista):
- gra/src/game/city-administrator.ts: pole `prevOwnerId?` w `AdministratorChange` (tylko dla `ended_owner_changed`, ustawiane w obu gałęziach `refreshAdministratorState`); nowa funkcja eksportowana `administratorChangeAudienceOwnerId(ch)` (dla koniec służby przez zmianę właściciela: poprzedni właściciel; inaczej właściciel miasta). Zasada: gracz dostaje wpis tylko, gdy traci SWOJEGO zarządcę.
- gra/src/main.ts (punktowo): import `administratorChangeAudienceOwnerId`; w `noteAdministratorChange` bramka `isHuman(ch.city.ownerId)` zastąpiona `isHuman(administratorChangeAudienceOwnerId(ch))`. Reszta main.ts bez zmian.
- gra/tools/foreign-administrator-dismissed-test.cjs (NOWY): 12 asercji na realnej `refreshAdministratorState` i helperze (bundle esbuild). Nazwa do stałej listy deployu: foreign-administrator-dismissed-test.cjs.
- dyspozycje/autobot/runs/R-WEB-UI-EVENTS-NO-FOREIGN-ADMINISTRATOR-DISMISSED-Q1/10-operator-claude.md (ten raport).
Diagnoza (przed zmianą): wpis tworzy noteAdministratorChange w main.ts. Bramka sprawdzała właściciela PO zmianie (city.ownerId = zdobywca = gracz), więc gracz dostawał wpis o zwolnieniu zarządcy obcej cywilizacji. Przy utracie własnego miasta bramka dawała false (city.ownerId = AI), czyli wpisu nie było.

ZAŁOŻENIA (luki rozstrzygnięte w raporcie):
- Z dispatchu (GOAL 2) „MOŻE zostać” czytam jako wymóg: utrata własnego miasta z zarządcą MA dawać wpis. Stan przed zmianą go nie dawał, więc po zmianie wpis się pojawia z istniejącym tekstem „miasto zmieniło właściciela — koniec służby administratora”. Jeśli właściciel chce brak wpisu przy utracie, to jedna linia w `administratorChangeAudienceOwnerId`.
- Gracz = ownerId 0 (jak `isHuman` w grze i w testach).
- Gałąź Państwa (role 'ulepszenia') dostaje prevOwnerId = adm.ownerId spójnie; w obecnej strukturze przy zdobyciu miasta praktycznie nie odpala (stan Państwa żyje na właścicielu).

TESTY (surowe wyniki, gra/, node_modules przez npm ci --ignore-scripts):
- node tools/foreign-administrator-dismissed-test.cjs -> PASS 12 / FAIL 0 (exit 0)
- MUTACJA (funkcja zwraca city.ownerId, jak dawniej): FAIL 2 (brak wpisu dla obcego zarządcy; wpis przy utracie własnego) -> PASS 10 / FAIL 2; po przywróceniu PASS 12 / FAIL 0. Test wykrywa regresję.
- node tools/city-administrator-test.cjs -> 119 passed, 0 failed (exit 0)
- node tools/improvement-administrator-test.cjs -> 59 passed, 0 failed (exit 0)
- node tools/administrator-icon-everywhere-render-test.cjs -> 24 PASS, 0 FAIL
- node tools/administrators-wizard-test.cjs -> 58 passed, 0 failed
- node tools/city-administrator-economy-test.cjs -> 72 passed, 0 failed
- node tools/events-one-turn-lifetime-test.cjs -> 25 OK, 0 FAIL
- node tools/notif-diplo-tab-count-blocking-test.cjs -> 25 OK, 0 FAIL
- node tools/notif-empty-queue-buildable-test.cjs, notif-empty-queue-gate-behaviour-test.cjs, tech-tree-test.cjs, unit-replace-test.cjs -> exit 0
- node tools/load-game-regression-test.cjs -> 34 PASS / 0 FAIL
- node tools/logic-test.cjs -> exit 0
- node tools/research-test.cjs -> PASSED 33 / FAILED 0
- node tools/combat-test.cjs -> exit 0
- node tools/events-defer-to-turn-start-test.cjs -> 39 OK, 1 FAIL: C3 „brak surowych wolan showCityCaptureNotice poza helperem”. NIE jest skutkiem tej zmiany: ta sama linia `emitOrDeferNotice('city-capture', …showCityCaptureNotice(cityNm, withSpectacle))` istnieje w bazie 774fd0ee (grep = 1 w obu wersjach), a zmiana nie dotyka tego miejsca. Pre-existing, nie naprawiane w tej rundzie (poza allowlistą).
- npx tsc --noEmit -p tsconfig.json -> exit 0, 0 błędów
- git diff --check -> czysto
- Chromium (żywa gra, build vite poza repo): NIE ZMIERZONO. Ścieżka sprawdzona na poziomie funkcji generujących wpis i bramki; bez budowy vite i bez sterowania przeglądarką w tej rundzie.

BLOKADY: brak blokad kodowych. Jedno założenie produktowe (sekcja ZAŁOŻENIA: utrata własnego miasta -> wpis).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (SONNET), potem Obrona i Final Control. Weryfikacja w grze (Chromium) do wykonania przez Evaluatora/FC albo zgłoszona jako NIE ZMIERZONO.
UWAGI-DLA-ORKIESTRATORA: (1) Rust: nie sprawdzono, czy rust-port/ ma odpowiednik noteAdministratorChange (wpis „Administrator odszedł”); jeśli tak, potrzebny REPIN. Nie zmieniano rust-port. (2) Pre-existing czerwony test events-defer-to-turn-start-test C3 (showCityCaptureNotice poza helperem) — osobny temat, nie ta runda.
DEPLOY/PUSH: NIE WYKONANO
