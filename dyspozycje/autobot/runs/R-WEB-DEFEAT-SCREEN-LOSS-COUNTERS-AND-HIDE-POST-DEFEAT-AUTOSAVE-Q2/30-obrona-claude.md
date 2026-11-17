# 30 — Obrona Operatora (Haiku), R-WEB-DEFEAT-SCREEN-LOSS-COUNTERS-AND-HIDE-POST-DEFEAT-AUTOSAVE-Q2

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DEFEAT-SCREEN-LOSS-COUNTERS-AND-HIDE-POST-DEFEAT-AUTOSAVE-Q2
GOAL: liczniki strat (miasta/jednostki) na ekranie porażki + brak autozapisu po porażce na liście „Wczytaj grę” (ABC właściciela B + A), bez zmiany reguł i balansu.
BAZA: kandydat Operatora 09d59f60b (startowa), obrona od tej bazy; SHA końcowy = commit obrony (patrz niżej).

## Commity

- `09d59f60b` — kandydat Operatora r1 (startowy, nie zmieniany tutaj)
- `4a1da8244` — obrona r2: poprawki zarzutów 1, 3, 4, 5 oraz doprecyzowanie testów (pliki: `gra/src/main.ts`, `gra/tools/loss-counters-test.cjs`, `gra/tools/defeat-screen-summary-live-test.cjs`)
- commit tego raportu (`30-obrona-claude.md`, jedyny plik) — SHA podany w polu `sha` wyniku

Brak zmian w `gra/tools/.victory-screen-bundle.css` (przywrócony po przebiegu testu live).

## Odpowiedzi na zarzuty Evaluatora (fd95d03a9)

**Zarzut 1 — wpięcie w main.ts nieprzetestowane (kryt. a): PRZYJMUJĘ częściowo.**
- Dodano sekcję 6 w `loss-counters-test.cjs`: „wiring guard” (źródło main.ts, NIE zachowanie): dokładnie 5 wpięć `recordCityLoss`, 1 wpięcie `recordUnitLosses`, 2 bramki `if (isPlayerDefeatedNow()) {` (autozapis + Ctrl+S), zapis i odczyt `meta.lossCounters`. Ścieżka kopii przez env `LC_MAIN`.
- Mutacje na kopiach main.ts (wynik z surowego wyjścia):
  - usunięte `recordUnitLosses` → `main.ts: 1 wpięcie recordUnitLosses (got 0, want 1)`, `34 OK, 1 FAIL`
  - `if (false)` zamiast bramki → `bramka … (got 0, want 2)`, `34 OK, 1 FAIL`
  - usunięte wpięcie `recordCityLoss` w bitwie → `5 wpięć recordCityLoss (got 4, want 5)`, `34 OK, 1 FAIL`
  - bez mutacji: `35 OK, 0 FAIL`
- Zachowanie wpięcia sprawdza test na żywo (Zarzut 4): przejęcie miasta przez barbarzyńców przez hook `captureCityByBarbarians` daje „Utracone miasta: 1”.
- NIE ZMIERZONO na żywo: liczenie poległych jednostek w `applyMapBattleOutcome` (wpięcie `recordUnitLosses`) — pokryte tylko wiring guardem; disband i straty AI — pokryte tylko logiką modułu (test jednostkowy), nie w grze.

**Zarzut 2 — round-trip zapisu i brak osobnego przypadku w `load-game-regression-test.cjs`: PRZYJMUJĘ częściowo, ODRZUCAM rozszerzenie pliku.**
- Dodano sekcję 4b w `loss-counters-test.cjs`: round-trip `meta.lossCounters` przez JSON oraz stary zapis bez pola → `{lostCities:0, lostUnits:0}`. Wynik: OK.
- ODRZUCAM dopisanie do `load-game-regression-test.cjs`: nagłówek pliku (linie 1–20) deklaruje zakres: save-presence / fsa-autosave / wiring prezencji w main.ts; nie testuje deserializacji zapisu ani pól `meta`. Dopisanie tam przypadku deserializacji byłoby poza jego zakresem.
- NIE ZMIERZONO: realny przepływ `meta.lossCounters` przez `save.ts` i `loadGameFromSlot` przy liczniku > 0 (w teście live zapis ma licznik 0, więc round-trip w grze nie jest sprawdzony). Komentarz w teście uczciwie mówi „NIE jest tu mierzony”.

**Zarzut 3 — brak testu, że lista „Wczytaj grę” po porażce nie zawiera autosave'a: PRZYJMUJĘ.**
- Test na żywo L1 (`defeat-screen-summary-live-test.cjs`): po porażce lista ma tylko zapis z tury 1; asercja `rowTexts.every(t => !/Tura 2\s*·|Autozapis/.test(t))`.
- Dowód porównawczy (ta sama procedura na bazie `b160459c9`): lista po porażce ZAWIERAŁA wiersz `Autozapis · … tura 2 …`. Na kandydacie wiersza nie ma. Ślad: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/base-live-run.log` i `…/live-run4.log`.
- Zachowanie „zapisy sprzed porażki zostają”: L2 (nowy seed) — po porażce lista zawiera zapis z tury 1 i nie zawiera tury 2 (asercje OK).

**Zarzut 4 — brak żywego Chromium ze zrzutem: PRZYJMUJĘ.**
- `node tools/defeat-screen-summary-live-test.cjs` (vite build poza repo, playwright chromium headless), kandydat z poprawkami: **51 passed, 0 failed** (`live-run4.log`).
- Zrzuty: `…/scratchpad/live-evidence/defeat-summary-L1-ekran-porazki.png`, `…/defeat-summary-L1-dialog-wczytania.png`.
- Liczniki na ekranie porażki (żywo): „Utracone miasta 1”, „Utracone jednostki 0” (dawniej „Wszystkie”).
- Baza `b160459c9` tym samym testem: 45 passed, 0 failed (kontrola porównawcza — zob. zarzut 3).
- Zmiana oczekiwań testu L2: dotychczas L2 polegał na autozapisie po porażce (który już nie powstaje). Test L2 zasiewa teraz zapis Ctrl+S w turze 1 przed porażką i sprawdza, że lista go pokazuje. Zmiana wynika z zamierzonego zachowania (ABC A), nie z osłabienia testu.

**Zarzut 5 — Ctrl+S / `doQuickSave` po porażce zapisuje do slotu autosave: PRZYJMUJĘ (poprawka + dowód).**
- Przed poprawką: `doQuickSave` nie sprawdzał porażki, więc Ctrl+S na ekranie porażki zapisywał do `AUTOSAVE_SLOT_ID` (widoczny na liście).
- Poprawka `gra/src/main.ts`: nowa funkcja `isPlayerDefeatedNow()` (ta sama reguła `isDefeatedState` co w autozapisie) używana w `doRotatingAutosave` i w `doQuickSave`. W `doQuickSave` po porażce: hint „Zapis po porażce jest wyłączony.” i `return false` (bez zapisu, bez nadpisania wcześniejszego szybkiego zapisu).
- Dowód: live L1 naciska `Control+s` na ekranie porażki; ekran nadal otwarty i lista nie zawiera wpisu z tury 2 (OK).

## Świadoma decyzja poza zarzutami (do decyzji orkiestratora)

- **Nazwany ręczny zapis po porażce NIE jest blokowany.** Ścieżka `persistSaveToSlot` przez dialog zapisu (`showSaveGameDialog`, `main.ts` ok. 27423) zapisuje do wskazanego slotu, nie do slotu autosave. Zgodnie z dispatchem („nie kasuj niczego, co gracz zapisał ręcznie”) nie blokowałem jej. NIE ZMIERZONO, czy taki zapis po porażce pojawia się na liście (najpewniej tak). Do rozstrzygnięcia przez orkiestratora, jeśli właściciel chce blokady także ręcznych zapisów po porażce.
- Przy zerowej liczbie zapisów „Wczytaj grę” na ekranie porażki zwraca hint „Brak zapisów na tym urządzeniu.” (`pokazEkranPorazki`, `savePresence.refresh()`). Wniosek z kodu, NIE ZMIERZONO w przeglądarce (w teście L2 przed zasiewem wcześniej nie dochodziło do dialogu — zgodne z tym wnioskiem).

## Bramki (liczby z surowego wyjścia, kandydat z poprawkami 4a1da8244)

- `npx tsc --noEmit -p .` → exit 0
- `node tools/loss-counters-test.cjs` → `35 OK, 0 FAIL` (mutacje: zob. zarzut 1)
- `node tools/defeat-screen-summary-test.cjs` → `passed=25 failed=0`
- `node tools/victory-test.cjs` → `12 passed, 0 failed (total 12)`
- `node tools/victory-screen-test.cjs` → `11 passed, 0 failed (total 11)`
- `node tools/load-game-regression-test.cjs` → `34 PASS / 0 FAIL`
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs` → `20 pass, 0 fail`
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`
- `node tools/defeat-screen-summary-live-test.cjs` (Chromium headless, build poza repo) → `51 passed, 0 failed`
- `git diff --check` → czysto

Reguły gry i balans: bez zmian (liczniki są tylko odczytem stanu; bramka dotyczy zapisu, nie mechaniki).

## Allowlista

Zmienione pliki: `gra/src/main.ts`, `gra/tools/loss-counters-test.cjs`, `gra/tools/defeat-screen-summary-live-test.cjs`, plus raport. Nowy moduł `gra/src/game/loss-counters.ts` był już w kandydacie (poza literalną allowlistą; dispatch dopuszcza nowe testy liczników). Nie zmieniano WERSJE.md, manifestu, `gra-robocza/`, `rust-port/`.

## BLOKADY

Brak blokad technicznych. Zostają NIE ZMIERZONO wymienione wyżej (poległe jednostki w grze, round-trip `meta.lossCounters` przez save.ts przy liczniku > 0, ręczny nazwany zapis po porażce, hint „Brak zapisów”).

## UWAGI-DLA-ORKIESTRATORA

- Nie tworzono żadnych sesji, zadań ani harmonogramów (zakaz z dispatchu zachowany).
- `gra/node_modules` zainstalowano w worktree (`npm ci --ignore-scripts`) do testów; usunięte po zakończeniu razem z katalogami buildów w scratchpad.

RUNDY: 2/5 (r1 = kandydat Operatora 09d59f60b; r2 = ta obrona, werdykt Evaluatora r1 PASS-WITH-NOTES)
NASTĘPNY KROK: Evaluator r2 weryfikuje commit `4a1da8244` i raport tego pliku; po PASS → Final Control.
DEPLOY/PUSH: NIE WYKONANO
