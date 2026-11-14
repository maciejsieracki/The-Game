STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-NOTIF-DIPLO-TAB-COUNT-BLOCKING-Q1
GOAL: licznik zakładki „Dyplomacja” wlicza blokujące propozycje diplo (kind:'diplo', blocking:true, np. propozycja pokoju od AI) i lista po kliknięciu zakładki pokazuje te karty; licznik zgadza się z listą. Bez zmiany klasyfikacji innych wpisów, bez zmiany liczników „Ważne”/„Inne”, bez zmiany blokujących kart nie-diplo.

ROZSTRZYGNIĘCIE PROJEKTOWE (dispatch: „albo zostają też nad zakładkami … wtedy pokaż je też w zakładce”):
- Blokująca karta diplo ZOSTAJE nad zakładkami jako „wymaga decyzji” (decyzja gracza nie jest ukrywana, rendering bez zmian).
- Dodatkowo trafia do źródła zakładek jako KOPIA z `blocking:false` (nowa funkcja `tabSourceEventsOf` w sidePanelEventFilter.ts). Dzięki temu: `tabCountsOf` liczy ją jako „Dyplomacja”, a `filterSidePanelEventsByTab` zwraca ją na liście zakładki „Dyplomacja” (renderowana jako zwykła karta informacyjna).
- Oryginał w `events` nie jest mutowany (test (5)).
- Blokujące nie-diplo (np. kind enemy) są pomijane w źródle zakładek — jak dotąd.
- `defaultSidePanelTab` nadal liczy wyłącznie `allInfoEvents` (bez blokujących) — zakładka domyślna nie przełącza się na Dyplomację z powodu blokującej karty diplo; reguła „liczniki BEZ ukrytych wpisów AI↔AI” zachowana (includeAiAi:false).
- `sidePanelEventTabs.ts` NIE zmieniony (eventTabOf już daje 'dyplomacja' dla kind diplo niezależnie od blocking).

ZMIANY/COMMIT: commit na detached HEAD od 501f78c08 (SHA w polu sha wywołania StructuredOutput). Allowlista:
- gra/src/ui/sidePanelEventFilter.ts: dodana `tabSourceEventsOf(events)` (+ docblok).
- gra/src/ui/sidePanelHud.ts: import `tabSourceEventsOf`; `tabCounts` i `infoEvents` liczone z `tabSourceEvents`; `allInfoEvents` / `relevantInfo` / `defaultSidePanelTab` bez zmian.
- gra/tools/notif-diplo-tab-count-blocking-test.cjs (nowy, 13 asercji).
- dyspozycje/autobot/runs/R-WEB-UI-NOTIF-DIPLO-TAB-COUNT-BLOCKING-Q1/10-operator-claude.md (ten raport).
Nie dotknięto: gra/data, WERSJE.md, gra-robocza/, rust-port/, main.ts, sidePanelEventTabs.ts, sidePanelEventFilter.ts poza dodaniem funkcji.

TESTY (surowe wyniki z tego przebiegu):
- Test nowy: `node tools/notif-diplo-tab-count-blocking-test.cjs` → „Wynik: 13 OK, 0 FAIL”, exit 0.
- Czerwony na bazie: z plikiem sidePanelEventFilter.ts z 501f78c08 test kończy się „[FAIL] tabSourceEventsOf nie jest wyeksportowane … (baza bez zmiany)”, „Wynik: 0 OK, 0 FAIL”, exit 1.
- Mutacja: w tabSourceEventsOf wyłączona gałąź diplo (`&& false`) → FAIL (1) „dyplomacja”:0 oraz FAIL (2) lista []; po przywróceniu 13 OK, 0 FAIL.
- `npx tsc --noEmit` → exit 0, bez wyjścia (zielone).
- Bramki referencyjne: logic-test „LOGIC OK (213/213)” exit 0; tech-tree-test „20 pass, 0 fail” exit 0; research-test „PASSED: 33 / FAILED: 0 / TOTAL: 33” / „ALL GREEN” exit 0; unit-replace-test „WSZYSTKIE TESTY ZIELONE (21/21)” exit 0; combat-test „COMBAT TEST: 6/6 pass” exit 0.
- `git diff --check` → czysty (bez wyjścia).
- Live (Chromium, runner live-verify-wave-689-697-b2-panel-run.cjs, scenariusz war, T17): NIE_ZMIERZONO — w tej rundzie nie uruchamiałem przeglądarki ani runnera (zakres rundy: kod + test czysty; build vite do /tmp nie był wykonany). Brak zrzutu do obejrzenia. Do zrobienia przez Evaluator/FC lub osobną bramkę wizualną.

ŚRODOWISKO: w worktree wykonano `npm ci` w gra/ (71 pakietów, bez build/dev) — gra/node_modules jest w .gitignore; orkiestrator powinien usunąć node_modules przy sprzątaniu worktree.

BLOKADY: brak blokad kodu. Otwarte ryzyka dla Evaluatora (zob. UWAGI):
UWAGI-DLA-ORKIESTRATORA:
1. Duplikacja DOM: ta sama blokująca karta diplo renderuje się dwa razy (raz jako sp-blocking nad zakładkami, raz jako zwykła karta na liście „Dyplomacja”) z tym samym `data-id`. Obsługa kliknięć używa `querySelectorAll`, więc oba elementy dostają listenery; ✕ na kopii wywołuje ten sam `onEventDismiss(id)`. Evaluator powinien to ocenić wizualnie/semantycznie — ewentualne zawężenie to osobny temat.
2. Nagłówek „N informacyjnych” (`relevantInfo`) nadal liczy `allInfoEvents` bez kopii blokującej diplo, więc przy aktywnej zakładce „Dyplomacja” licznik w nagłówku może być o 1 niższy niż liczba kart na liście. Celowo nie zmieniono (dispatch: bez zmiany „Ważne”/„Inne” i zakresu sprzed zakładek); do decyzji właściciela/Evaluatora.
3. Licznik na zakładce „Dyplomacja” może więc być o 1 wyższy niż „N informacyjnych” w nagłówku — dotyczy punktu 2.
4. Brak zmian w sidePanelEventFilter.filterSidePanelEventsByTab (wejście zmienia się w hudzie, sama funkcja bez zmian).

NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja kodu i testu względem GOAL, ocena punktów 1–2 z UWAG, live-verify w T17 (wymagany zrzut) albo jawne NIE_ZMIERZONO w raporcie FC.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
