STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-TEST-DEBT-HUD-Q3
GOAL: Spłata długu testowego HUD bez zmiany zachowania gry. Wszystkie czerwone asercje z dispatchu zklasyfikowane; klasa A przepisana, klasa B nie znaleziona.
ZMIANY/COMMIT: commit testów `da4ae12b6` (5 plików w `gra/tools/`: hud-skarbiec, hud-obywatele-chip, heks-panel-tooltip-warstwa, ai2-heks-po-heksie, ai-food-improvement-priority-stages). Zero zmian w `gra/src/**`. Baza: `origin/main` = `ee269b6ed`. Raport i logi `gate-*.txt` w commicie raportu (SHA w odpowiedzi orkiestratorowi).

KLASYFIKACJA (wszystkie czerwone asercje):
- hud-skarbiec (1 FAIL), klasa A: test oczekiwal literalnego `computeTradeRouteIncomeByCity(...)` na poz. 11 previewCityEconomy. main.ts:20292-20331 przekazuje `routeIncomePreview.totalByCity` (zbindowane do computeTradeRouteIncomeByCityBreakdown + loadTradeRouteIncomeParams, po dodaniu bonusu morskiego). Wartosc jest realna, nie undefined. Asercja pinuje obie formy; `undefined` nadal FAIL.
- hud-obywatele-chip (4 FAIL), klasa A: buildHudState ma teraz sygnature `(ownerId = ME())` i liczy `cities.filter(c => isMe(c.ownerId))` (main.ts:20505, 20716). Test szukal starej sygnatury `(): HudState` i `ownerId === 0`. Logika sumy populacji ta sama.
- heks-panel-tooltip-warstwa (1 FAIL), klasa A: tileYieldLabel ma sygnature `(hex, ownerEra?)` (cityPanel.ts:10029). Regex testu nie pasowal. Logika warstw bez zmian.
- ai2-heks-po-heksie (2 FAIL), klasa A: `skipWyrab: true` i `getOnlyWorked` usuniete z automatu gracza przez SIMPLE-FOOD-RULE-NO-TOGGLES-Q1 (main.ts:37360-37440). Asercje odwrocone: pinuja BRAK tych przelacznikow (mutacja z powrotem daje FAIL).
- ai-food-improvement-priority-stages (crash ERR_ASSERTION na E1, plus asercja decideAITurn), klasa A: KROK 0 z RIVER-FOREST-FIRST-PRIORITY-Q1 (auto-improvements.ts ~linia 866) wycina lasy rzeczne przed E1. Przepisano kolejnosc na zamierzona (wyrab,wyrab,farma...). Usunieto asercje „toggle OFF” (getSkipWyrab nie jest juz czytane przez zrodlo).
- Klasa B: BRAK. Zadna czerwona asercja nie wskazuje usterki gry; nie zmieniano zachowania gry.

TESTY (PRZED -> PO, `node tools/<nazwa>-test.cjs` z gra/, Node 22):
- hud-skarbiec: PRZED 33 pass/1 fail EXIT=1 -> PO 34/0 EXIT=0
- hud-obywatele-chip: PRZED 16/4 EXIT=1 -> PO 20/0 EXIT=0
- heks-panel-tooltip-warstwa: PRZED 18/1 EXIT=1 -> PO 22/0 EXIT=0
- ai2-heks-po-heksie: PRZED 36/2 EXIT=1 -> PO 38/0 EXIT=0
- ai-food-improvement-priority-stages: PRZED crash EXIT=1 -> PO 13/0 EXIT=0
- hex-tooltip-mozliwe-ulepszenia-zloze: PRZED 67/0 EXIT=0 -> PO 67/0 EXIT=0 (plik nietkniety; dispatch podawal 73/1, NIE_ZMIERZONO - nie odtworzono tej liczby)
- hud-topbar-grid-gross-net: PRZED 1190 ok/0 EXIT=0 -> PO 1190/0 EXIT=0 (sekcja [B] POMINIETA, brak --dist: NIE_ZMIERZONO)
- hud-gross-net-rest: PRZED 756/0 EXIT=0 -> PO 756/0 EXIT=0
- simple-food-rule-no-toggles: PRZED 36 OK/0 EXIT=0 -> PO 36/0 EXIT=0
- autoclear-river-forest-priority: PRZED 17 OK/0 EXIT=0 -> PO 17/0 EXIT=0
- Mutacja ai-food (w kopii src, KROK 0 wylaczony): EXIT=1 (czerwony, dowod zebow testu)
- Mutacja pozostalych przepisanych asercji: NIE_ZMIERZONO (brak kopii src z mutacja poza ai-food; poprzednie mutanty w testach skarbiec/obywatele/ai2 zostaly zachowane w kodzie testow)
- `tsc --noEmit` (gra/): EXIT=0

BLOKADY: brak blokad klasy B. Rozbieżności z dispatchem: hex-tooltip (73/1 w dispatchu vs 67/0 zmierzone), topbar sekcja [B] wymaga --dist (NIE_ZMIERZONO).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5): weryfikacja, że przepisane asercje nadal FAIL na mutantach (szczegolnie ai2 `skipWyrab`/`getOnlyWorked` i hud-skarbiec pos11).
DEPLOY/PUSH: NIE WYKONANO

Uwagi procesowe: `node_modules` w gra/ usunięty po pracy (npm ci --ignore-scripts; build/dev nie uruchamiano). Logi bramek: `gate-*.txt` w tym katalogu (jedna linia EXIT=).
