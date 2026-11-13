# R-WEB-NOTIF-EMPTY-QUEUE-ONLY-BUILDABLE-Q1 — obrona Operatora (runda 3/5, odpowiedź na zarzuty Evaluatora r3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NOTIF-EMPTY-QUEUE-ONLY-BUILDABLE-Q1
GOAL: powiadomienie „Produkcja: <miasto> — Kolejka pusta” tylko gdy gracz realnie może coś wybudować teraz; bramka = predykat panelu (buildingCanBuildNow).
BAZA: 9c0d015714e2e9ad40e7ddec2fea0db8036f4bba (origin/main w chwili dispatchu). START obrony: d012c54ba686484086dda3663759e6ff73d89e78 (kandydat r3).
ZMIANY/COMMIT: `gra/tools/notif-empty-queue-buildable-test.cjs` (przebudowa testu: B2 + chip tech) oraz ten raport. Kod `gra/src/main.ts` i `gra/src/ui/cityPanel.ts` NIE zmieniony w tej rundzie. SHA końcowy: pole `sha` zwrotki.
Uwaga środowiskowa: w worktree brak `gra/node_modules`; wykonano `npm ci --ignore-scripts` w `gra/` (exit 0). Bez `npm run build` / `dev`.

## Odpowiedzi na zarzuty Evaluatora (r3, raport 981f4de8e)

1. PRZYJMUJĘ. Test sekcji B sprawdzał tylko obecność regexu. Dodano:
   - dokładny warunek w ciałach funkcji: `if (!buildingCanBuildNow(def, city, data, ctx, techs)) continue;` w `cityHasAffordableBuildingEnqueue`, `cityHasAffordableLevelUpgrade`, `productionOptionsFingerprint`, oraz brak `canAffordBuildingStock(` w ciałach enqueue i upgrade;
   - sekcja B2: mutacje TEKSTU realnego `gra/src/main.ts` w pamięci (plik na dysku nietknięty), każda MUSI być wykryta przez `structural()`:
     - enqueue: `if (false) continue;` -> wykryte
     - enqueue: `!(buildingCanBuildNow(...) || true)` -> wykryte
     - enqueue: cofnięcie do `canAffordBuildingStock(pool, buildingStockCost(def))` -> wykryte
     - ulepszenia: cofnięcie do `canAffordBuildingStock` -> wykryte
     - odcisk: zdjęty guard `!isCityUnderSiege([city], city)` -> wykryte
   Ograniczenie: test nadal nie uruchamia `cityHasActionableProduction` (lokalna funkcja w `boot()`); wykrywa zmiany w tekście połączenia, nie zachowanie end-to-end.

2. PRZYJMUJĘ CZĘŚCIOWO. Dodano przypadek behawioralny C3: `stolarnia` (techUnlock „Obróbka drewna”), pełny magazyn, `techs = []` -> `buildingCanBuildNow = false` (chip tech działa na realnym `cityPanel.ts`). NIE dodano w tej rundzie: chipów etykietowych (`buildingRequiredActiveLabels`), „W mieście”, Rozbudowy, stolicy/regionu, ścieżki z `city` (pula z `ownerSurowcePoolFor`/`cfg.getCities`) oraz testu behawioralnego `cityHasAffordableLevelUpgrade`. To jest świadomie odnotowane jako ograniczenie zakresu; FC decyduje, czy to blokuje.

3. PRZYJMUJĘ. Cofnięcie poprawki w `main.ts` do `canAffordBuildingStock` jest teraz wykrywane przez B2 na rzeczywistym tekście `main.ts` (nie tylko przez kopię predykatu). Mutacja D nadal dotyczy predykatu panelu w pamięci (plik `cityPanel.ts` nietknięty) i to jest zamierzone.

4. ODRZUCAM (z dowodem źródłowym, do uznania przez FC). Zarzut dotyczy rozjazdu `productionAvailabilityCtxForCity` (main.ts:18577) z `productionCtxForCity` (cityPanel.ts:9172) przy zasobach z handlu. Dla właściciela gracza (`ownerId 0`) oba źródła dają ten sam wynik:
   - main.ts:18577-18608: `placedImprovements: placedImprovementsWithTradeGrants(city.ownerId, placedImprovementsForOwner(city.ownerId))`, `hasKopalniaNaZlozuZelazaOrTradeGrant(city.ownerId, ...)`;
   - main.ts:31336 i 45140: `getPlacedImprovements: () => placedImprovementsWithTradeGrants(0, placedImprovementsForOwner(0))`;
   - main.ts:8864: `getHasKopalniaNaZlozuZelaza: () => hasKopalniaNaZlozuZelazaOrTradeGrant(0, placedImprovementsForOwner(0))`.
   Różnica istnieje tylko dla ownerId różnego od 0. ZAŁOŻENIE: panel produkcji i powiadomienie dotyczą wyłącznie miast gracza (NIE_ZMIERZONO w kodzie panelu dla miast AI; nie sprawdzono pełnej ścieżki wywołań).

5. PRZYJMUJĘ jako fakt, bez zmiany kodu. `cityPanel.ts` ma jednowyrazową zmianę `export function buildingCanBuildNow` (bez zmiany logiki); bez niej `main.ts` nie zaimportuje predykatu. ZAŁOŻENIE: dispatch dopuszcza `cityPanel.ts`, gdy potrzebna jest wspólna funkcja (wg relacji Evaluatora). Pliku DODATEK `00-dispatch-DODATEK-claude.md` nadal nie ma w żadnej gałęzi; nie weryfikowano jego treści.

6. PRZYJMUJĘ jako NIE_ZMIERZONO. Dowód w Chromium wymaga `build`/`dev`, które są zakazane w `gra/`. Zmiany w kodzie gry nie było w tej rundzie. Objaw z rundy 2 nie został potwierdzony w grze.

## Bramki (liczby z surowego wyjścia, uruchomione w worktree na commicie obrony)

- `npm ci --ignore-scripts` (gra/): NPM_EXIT=0.
- `node tools/notif-empty-queue-buildable-test.cjs`: wyjście `RESULT: 16 pass / 0 fail`, EXIT=0.
  - A: 2/2 (isCityUnderSiege: true / false)
  - B: 5/5 (guardy i wywołania predykatu w ciałach funkcji)
  - B2: 5/5 wykryte (mutanty main.ts w pamięci)
  - C: 3/3 (bez surowców false; pełny magazyn true; pełny magazyn bez techu false)
  - D: 1/1 (mutacja cityPanel.ts w pamięci wykryta)
- Nie uruchamiano ponownie tsc/logic/tech-tree/research/unit-replace/combat: nie zmieniono kodu `src/`, a bramki z r3 były zielone na tym samym `src/` (d012c54ba).

## Pliki zmienione w tej rundzie

- `gra/tools/notif-empty-queue-buildable-test.cjs` (przebudowa B, dodanie B2 i C3).
- `dyspozycje/autobot/runs/R-WEB-NOTIF-EMPTY-QUEUE-ONLY-BUILDABLE-Q1/30-obrona-claude.md` (ten plik).

## Co pozostaje niepotwierdzone

- Zachowanie `cityHasActionableProduction` w grze (funkcja lokalna w `boot()`): NIE_ZMIERZONO.
- Chipy etykietowe, „W mieście”, Rozbudowa, stolica/region i ścieżka z `city` w teście: NIE_ZMIERZONO.
- Dowód w Chromium: NIE_ZMIERZONO (zakaz build/dev).

BLOKADY: brak dowodu w przeglądarce (zakaz build/dev); test nie wykonuje funkcji lokalnej `boot()`.
RUNDY: 3/5 (obrona r3).
NASTĘPNY KROK: Evaluator r4 / Final Control — ocena B2 (mutacje main.ts) i zakresu chipów (zarzut 2).
DEPLOY/PUSH: NIE WYKONANO
