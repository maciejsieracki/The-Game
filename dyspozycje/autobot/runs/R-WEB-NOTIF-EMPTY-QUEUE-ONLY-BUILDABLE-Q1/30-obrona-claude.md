# R-WEB-NOTIF-EMPTY-QUEUE-ONLY-BUILDABLE-Q1 — obrona Operatora (runda 2/5)

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-NOTIF-EMPTY-QUEUE-ONLY-BUILDABLE-Q1
GOAL: powiadomienie „Produkcja: <miasto> — Kolejka pusta” tylko gdy gracz realnie może coś wybudować teraz (surowce + skarbiec + manpower + warunki), z bramką zgodną z panelem produkcji.
BAZA: aeb52465e845d29acb5f7b628370789af399d673 (origin/main); kandydat rundy 1: 947054b003314c9583b1d04ce9985c717d8cca80
ZMIANY/COMMIT: gra/src/main.ts (guard oblężenia w productionOptionsFingerprint), gra/tools/notif-empty-queue-buildable-test.cjs (nowy), ten raport. SHA końcowy: patrz pole sha zwrotki.

## Źródła i założenia
- `00-dispatch.md` odczytano z commitu orkiestratora 1dcb287c6 (ścieżka w origin/main nie istnieje). `00-dispatch-DODATEK-claude.md` nie istnieje w żadnej gałęzi — przyjęto, że obowiązuje wyłącznie `00-dispatch.md`.
- Zarzut 3 (przyczyna objawu) traktowany jako otwarty; zarzut 5 rozstrzygnięty na podstawie kodu (patrz niżej).

## Odpowiedzi na zarzuty Evaluatora (6c7a368ef)
- **Zarzut 1 (brak testu regresyjnego, brak mutacji): PRZYJMUJĘ.** Dodano `gra/tools/notif-empty-queue-buildable-test.cjs`: A) realne `isCityUnderSiege` (src/game/city-siege-state.ts, esbuild); B) strukturalnie bramka i odcisk mają guard `isCityUnderSiege([city], city)`; C) mutacje w pamięci (usunięcie guardu z bramki albo z odcisku) są wykrywane przez B. Wynik: `RESULT: 8 pass / 0 fail`, exit 0. Ograniczenie: test nie wykonuje `cityHasActionableProduction` (funkcja lokalna w `boot()`), więc nie dowodzi zachowania w grze.
- **Zarzut 2 (brak dowodu w Chromium): ODRZUCAM w tej rundzie — NIE_ZMIERZONO.** Dowód w przeglądarce wymaga `vite build` lub dev serwera; zakaz `npm run build`/`dev` w `gra/` obowiązuje. Kryterium 5 pozostaje niespełnione.
- **Zarzut 3 (przyczyna objawu nie znaleziona): PRZYJMUJĘ jako niezamknięte — NIE_ZMIERZONO.** Sprawdzono: enqueue budynku (`cityPanel.ts` `addItem`, ok. linii 6520–6522) blokuje to samo co bramka (`canAffordBuildingStock(ownerSurowcePoolFor(city), buildingStockCostForItem(item))`), a koszt pochodzi z tej samej `buildingStockCost(def)`. Nie znaleziono rozbieżności kosztu. Niezweryfikowany kandydat: chipy `buildingRequirementChips` (tech/prereq/„other”), których bramka nie sprawdza, bo `buildableProduction` jest wołane bez `showResourceGatedBuildings`. Wymaga reprodukcji.
- **Zarzut 4 (odcisk bez blokady oblężenia): PRZYJMUJĘ — naprawiono.** `productionOptionsFingerprint` (gra/src/main.ts): blok jednostek działa tylko gdy `city.ownerId === 0 && !isCityUnderSiege([city], city)`, jak w bramce.
- **Zarzut 5 (wspólna funkcja kosztu w cityPanel): ODRZUCAM.** Bramka, odcisk i panel już używają tych samych funkcji źródłowych: `canAffordBuildingStock` + `ownerSurowcePoolFor` (main.ts oraz cityPanel.ts ok. 6522), `buildingStockCost` (src/game/building-stock-cost.ts), `canAffordUnitRecruitFull`, `canAffordUnitManpowerEmpire`. Powielony jest tylko szkielet pętli, nie logika kosztu. Dowodu rozbieżności, który uzasadniałby zmianę cityPanel.ts, brak (patrz zarzut 3).
- **Zarzut 6 (STATUS BLOCK): PRZYJMUJĘ — nadal BLOCK.** Kryteria 1, 5 niespełnione; kryterium 3 w części „przyczyna” niezweryfikowane; kryterium 4 spełnione tylko strukturalnie.

## Bramki (liczby z surowego wyjścia)
- `node ./node_modules/typescript/bin/tsc --noEmit` (gra/): exit 0, bez wyjścia.
- `node tools/notif-empty-queue-buildable-test.cjs`: `RESULT: 8 pass / 0 fail`, exit 0.
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`.
- `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`.
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`.
- `node tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass`.
- `npm run build` / `npm run dev`: NIE uruchamiano (zakaz). Wykonano `npm ci --ignore-scripts` w worktree (71 pakietów), bo katalog node_modules był pusty.
- Chromium: NIE_ZMIERZONO.

BLOKADY: brak reprodukcji przyczyny objawu (zarzut 3); brak dowodu w przeglądarce (zarzut 2); test strukturalny, nie behawioralny.
RUNDY: 2/5 — poprzedni werdykt Evaluatora: FAIL (6c7a368ef); bieżąca runda: obrona.
NASTĘPNY KROK: Evaluator r2 — ocena guardu odcisku i testu. Przed READY_FOR_DEPLOY wymagana reprodukcja przyczyny objawu i dowód w Chromium (poza tą rundą).
DEPLOY/PUSH: NIE WYKONANO
