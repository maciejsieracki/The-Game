# R-WEB-NOTIF-EMPTY-QUEUE-ONLY-BUILDABLE-Q1 — raport Operatora (runda 1/5)

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-NOTIF-EMPTY-QUEUE-ONLY-BUILDABLE-Q1
GOAL: powiadomienie „Produkcja: <miasto> — Kolejka pusta” tylko gdy gracz realnie może coś wybudować teraz (surowce + skarbiec + manpower + warunki), z bramką zgodną z panelem produkcji.
BAZA: aeb52465e845d29acb5f7b628370789af399d673 (origin/main)
ZMIANY/COMMIT: gra/src/main.ts — cityHasAffordableUnitRecruitment: blokada oblężenia jak w panelu rekrutacji (cityPanel.ts, isCityUnderSiege przy werbunku). Raport: dyspozycje/autobot/runs/R-WEB-NOTIF-EMPTY-QUEUE-ONLY-BUILDABLE-Q1/10-operator-claude.md. SHA: patrz pole sha.

## Źródła i założenia
- Dodatek orkiestratora `00-dispatch-DODATEK-claude.md` NIE istnieje w żadnej gałęzi (sprawdzone `git ls-tree`). Przyjęto zasady z `00-dispatch.md` (gałąź origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0, commit 1dcb287c6).
- Katalogu runu nie ma w aeb52465e; plik dispatchu odczytano z gałęzi orkiestratora.
- Zgłoszenie właściciela o armii (rozdzielanie pod miastem wroga) ma osobny dispatch `R-WEB-ARMY-SPLIT-ENEMY-CITY-BLOCK-Q1` (ten sam commit orkiestratora). Nie jest realizowane w tym temacie: poza allowlistą.

## Co zbadano (analiza kodu, bez przeglądarki)
- Bramka: `cityHasActionableProduction` → `cityHasAffordableBuildingEnqueue` (buildableProduction + canAffordBuildingStock(pula państwa, buildingStockCost(def))) oraz `cityHasAffordableUnitRecruitment` (skarbiec, canAffordUnitRecruitFull = canAffordUnitRecruitStock, canAffordUnitManpowerEmpire).
- Panel (cityPanel.ts): stock chip używa `ownerSurowcePoolFor(city)` (ta sama pula); manpower `empireRekruciAffordable` z `getEmpireRekruciTotal` = `empirePoborTotals(...).rekruci`, czyli ta sama wartość co `empireManpowerCurrent` w bramce; skarbiec ten sam.
- Rozbieżność znaleziona i załatana: panel blokuje werbunek w oblężonym mieście (`isCityUnderSiege`), bramka nie — notyfikacja mogła pojawiać się w oblężonym mieście mimo braku możliwości rekrutacji. Dodano tę samą blokadę w `cityHasAffordableUnitRecruitment`.

## Czego NIE udało się potwierdzić (dlatego BLOCK)
- Nie zreprodukowano w kodzie scenariusza z dispatchu „miasto bez surowców → zdarzenie”: bramka budynków i jednostek na papierze używa tej samej puli i kosztów co panel. Przyczyna zgłoszonego objawu NIE została wskazana z pewnością; załatana tylko rozbieżność oblężenia.
- Panel buduje listę z `showResourceGatedBuildings: true` i decyduje o `canBuild` przez `buildingRequirementChips` (tech, rozbudowa, prereq miasta, stock). Bramka używa `buildableProduction` bez tej flagi. Czy istnieje przypadek, w którym chip „other” lub „tech” jest niespełniony, a bramka zwraca true, NIE zweryfikowano — kandydat na właściwą przyczynę do sprawdzenia w rundzie 2.
- Brak testu regresyjnego `gra/tools/notif-empty-queue-buildable-test.cjs` (kryterium 4) — NIE_ZMIERZONO.
- Brak dowodu w Chromium (kryterium 5) — NIE_ZMIERZONO.

## Bramki
- `tsc --noEmit` (gra/, `node ./node_modules/typescript/bin/tsc --noEmit`): exit 0, 0 linii wyjścia.
- Bramki referencyjne (node tools/*-test.cjs): NIE_ZMIERZONO w tej rundzie.
- `npm run build` / `npm run dev`: NIE uruchamiano (zakaz). Zależności zainstalowano `npm ci --ignore-scripts` (71 pakietów) w worktree.

BLOKADY: brak testu regresyjnego, brak reprodukcji przyczyny objawu, brak dowodu w przeglądarce.
RUNDY: 1/5 — ostatni werdykt: brak (Operator).
NASTĘPNY KROK: runda 2 — sprawdzić zgodność chipów `buildingRequirementChips` (tech/other/prereq) z bramką budynków; napisać test regresyjny w gra/tools; zmutować bramkę i potwierdzić czerwony test; bramki referencyjne; dowód w Chromium.
DEPLOY/PUSH: NIE WYKONANO
