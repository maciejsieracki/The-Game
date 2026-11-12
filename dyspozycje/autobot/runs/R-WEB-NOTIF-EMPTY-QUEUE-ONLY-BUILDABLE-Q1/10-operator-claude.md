# R-WEB-NOTIF-EMPTY-QUEUE-ONLY-BUILDABLE-Q1 — raport Operatora (runda 3/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NOTIF-EMPTY-QUEUE-ONLY-BUILDABLE-Q1
GOAL: powiadomienie „Produkcja: <miasto> — Kolejka pusta” tylko gdy gracz realnie może coś wybudować teraz; bramka zgodna z panelem produkcji (ten sam predykat).
BAZA: 9c0d015714e2e9ad40e7ddec2fea0db8036f4bba (kandydat rundy 2, detached); origin/main to aeb52465e845d29acb5f7b628370789af399d673.
ZMIANY/COMMIT: SHA commita z kodem i tym raportem: patrz pole `sha` zwrotki. Pliki (allowlista): `gra/src/main.ts`, `gra/src/ui/cityPanel.ts`, `gra/tools/notif-empty-queue-buildable-test.cjs`, ten raport.

## Źródła i założenia
- `00-dispatch.md` odczytano z origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (ścieżka nie istnieje w origin/main). Dodatek rundy 3 jest w tym samym pliku (sekcja „DODATEK — runda 3”). Plik `00-dispatch-DODATEK-claude.md` nie istnieje w żadnej gałęzi.
- Wymagania FC rundy 3 przyjęto jako zamknięte zakresem (1) bramka budynków = predykat panelu, (2) ulepszenia = ten sam predykat, (3) test behawioralny, (4) Chromium = NIE_ZMIERZONO.
- Założenie: w bramce używany jest `ctx` z `productionAvailabilityCtxForCity` (jak dotąd); panel używa `productionCtxForCity` z wstrzykniętych callbacków. Nie porównano ich pole po polu (NIE_ZMIERZONO).

## Zmiana (runda 3)
- `gra/src/ui/cityPanel.ts`: `buildingCanBuildNow` — tylko dodany `export` (predykat panelu: `buildingRequirementChips` wszystkie chipy `met`). Bez zmian logiki.
- `gra/src/main.ts`:
  - `cityHasAffordableBuildingEnqueue`: zbiór z `buildableProduction(..., { ...ctx, showResourceGatedBuildings: true })` (jak lista budowy w panelu) i warunek `buildingCanBuildNow(def, city, data, ctx, techs)` zamiast `canAffordBuildingStock(pool, buildingStockCost(def))`. Usunięto lokalne `pool`.
  - `cityHasAffordableLevelUpgrade`: warunek `buildingCanBuildNow(def, city, data, ctx, techs)` zamiast `canAffordBuildingStock`. Usunięto lokalne `pool`.
  - `productionOptionsFingerprint`: część budynków tak samo jak w bramce (`showResourceGatedBuildings` + `buildingCanBuildNow`). Blok jednostek i guard oblężenia bez zmian (`pool` zostaje dla jednostek).
  - import `buildingCanBuildNow` z `./ui/cityPanel`.
- Dlaczego: stara bramka sprawdzała wyłącznie `koszt_surowce` (`canAffordBuildingStock`). Ignorowała chipy tech, „W mieście”, Rozbudowę, lokalizację i surowce etykietowe (`buildingRequiredActiveLabels`, np. „Drewno w magazynie państwa”), które panel traktuje jako blokadę. To jest kandydat na przyczynę objawu z rundy 2 (zarzut 3). Potwierdzono w kodzie, NIE w grze.

## Test `gra/tools/notif-empty-queue-buildable-test.cjs` (przepisany)
- A. jednostkowa: realne `isCityUnderSiege`.
- B. strukturalna: bramki budynków/ulepszeń i odcisk wołają `buildingCanBuildNow`; bramka werbunku i odcisk mają guard oblężenia.
- C. behawioralna: realny `cityPanel.ts` zbundlowany esbuildem (Node, atrapa DOM tylko przy ładowaniu modułu), realne `gra/data/buildings.json` i `tech.json`. Budynek testowy: `stolarnia` (koszt magazynu drewno 25). Bez surowców → `buildingCanBuildNow = false`; z pełnym magazynem → `true`.
- D. mutacja: predykat ignorujący chipy `kind: 'stock'` daje `true` bez surowców, więc C byłaby czerwona. Test wykrywa mutację.
- Ograniczenie: test NIE wykonuje `cityHasActionableProduction` (funkcja lokalna w `boot()`). Sprawdza predykat na realnym module i połączenie w kodzie strukturalnie. Nie jest testem „miasto → zdarzenie” end-to-end.

## Bramki (liczby z surowego wyjścia)
- `node ./node_modules/typescript/bin/tsc --noEmit` (gra/): exit 0, bez wyjścia.
- `node tools/notif-empty-queue-buildable-test.cjs`: `RESULT: 10 pass / 0 fail`, exit 0 (sekcje A 2/2, B 5/5, C 2/2, D 1/1).
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`, exit 0.
- `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`, exit 0.
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`, exit 0.
- `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- `node tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass`, exit 0.
- `npm run build` / `npm run dev`: NIE uruchamiano (zakaz). Zależności: `npm ci --ignore-scripts` w worktree (exit 0).
- Chromium / dowód w grze: NIE_ZMIERZONO (wymaga build/dev, zakaz).

## Co pozostaje niepotwierdzone
- Że zgłoszony objaw (zdarzenie przy braku surowców) wynika wyłącznie z pominiętych chipów: NIE_ZMIERZONO w grze. Nie zreprodukowano scenariusza miasta end-to-end.
- Zgodność `ctx` bramki z `productionCtxForCity` panelu: NIE_ZMIERZONO pole po polu.
- Ulepszenia: panel używa predykatu na bazowej definicji budynku (`buildingCanBuildNow(def)`), a koszt poziomu z `buildingProductionItem` nie wchodzi do chipów. Zachowano to samo zachowanie co panel, więc bramka nie jest ostrzejsza ani luźniejsza niż lista „Ulepsz”.

BLOKADY: brak dowodu w przeglądarce (zakaz build/dev); brak testu end-to-end miasta (test sprawdza predykat, nie `cityHasActionableProduction`).
RUNDY: 3/5 — poprzedni werdykt: FC FAIL r2 (odcisk bez reprodukcji przyczyny, brak testu behawioralnego, brak dowodu w Chromium).
NASTĘPNY KROK: Evaluator r3 — ocena zgodności predykatu z panelem, testu C/D i pozostałych otwartych punktów. Dowód w Chromium poza tą rundą (wymaga zgody na build w worktree roboczym).
DEPLOY/PUSH: NIE WYKONANO
