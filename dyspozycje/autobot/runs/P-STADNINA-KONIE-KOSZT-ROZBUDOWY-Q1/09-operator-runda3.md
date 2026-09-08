STATUS: PASS
DOMAIN: GAME
TEMAT: P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1
GOAL RUNDY 3: Domknij oba DECISION_REQUIRED rundy 2 (08-dispatch-runda3.md) — (1) żywy dowód
Chromium na realnym `main.ts::commitBuildRequest` dla kosztu 50 'kon'; (2) AI/automat miasta
(`auto-improvements.ts`) odzyskuje zdolność budowy stadniny poza złożem, symetrycznie do gracza.

ZMIANY/COMMIT (BRAK COMMITU — worktree, allowlista rundy 3):
- `gra/src/main.ts` (WYŁĄCZNIE `__buildRequestTestDebug`, ~linia 22269, nowy hunk poza dwoma
  już-scalonymi z rundy 2 — `git diff --` = 3 hunki dokładnie: 12537, 12937, 22269):
  DOKŁADNIE dwie nowe metody testowe wzorem `forceCopperDeposit`/`forceForestNoDeposit`:
  1. `setCityKonStock(ownerId, amount)` — ustawia SUMĘ 'kon' widzianą przez
     `citySurowceSumForOwner(ownerId)` na dokładnie `amount` (zeruje 'kon' we wszystkich
     miastach ownera poza pierwszym, ustawia pierwsze na `amount`).
  2. `forceHorseDeposit(q, r)` / `forceNoHorseDeposit(q, r)` — wymusza obecność/brak
     `Nakladka.ZlozeKonia` na wskazanym heksie.
  Poza tym main.ts nietknięty (zero zmian w `commitBuildRequest`/`ImprovementBuildState` ponad
  to, co już zaakceptowane rundą 2).
- `gra/src/game/auto-improvements.ts` (~linia 514-543, jeden hunk, WYŁĄCZNIE budowa `state`
  w `pickAutoImprovements`): `horseStockAvailable` liczone TERAZ wewnątrz tego pliku, sumą
  `city.surowce.kon` po realnych obiektach `cities` (duck-typing — `AutoImprovementCity` nie
  deklaruje `surowce` w swoim węższym typie, ale `cities` przekazywane przez `ai.ts`/`main.ts`
  to zawsze pełne obiekty `City`, potwierdzone czytaniem obu call site'ów — żadna z tych funkcji
  spoza allowlisty nie została zmieniona). `tradeRouteKonUnlocked` ustawione na `false`
  (bezpieczny domyślny — niederywowalne z samych `AutoImprovementCity` bez zmiany `ai.ts`/
  `main.ts`, poza allowlistą tej rundy; identyczne z zachowaniem AI SPRZED tej rundy na tym
  torze — brak regresji, tylko brak jeszcze DRUGIEJ, niezależnej ścieżki dostępu). Reszta
  logiki `pickAutoImprovements` nietknięta.
- NOWA żywa bramka `gra/tools/stadnina-kon-koszt-live-test.cjs` (19/19) — `vite build` +
  headless Chromium (Playwright), woła REALNY `applyBuildRequest`→`commitBuildRequest`
  (nie symulację): (a) magazyn <50 poza złożem → blokada + toast czytelny; (b) magazyn
  DOKŁADNIE 50 → budowa się udaje; (c) NOWY heks poza złożem, magazyn nietknięty od (b) →
  blokada z toastem "masz 0" — dowód, że (b) odjęło DOKŁADNIE 50, nie mniej/więcej; (d) heks
  ze złożem, magazyn 0 → budowa się udaje mimo pustego magazynu (koszt nigdy nie dotyczy
  złoża). Zero console.error/pageerror.
- `gra/tools/hodowla-las-test.cjs` (112/112, +3 nowe testy w sekcji [4]): ŻYWY dowód, że
  `pickAutoImprovements` z realnym `city.surowce.kon` >= 50 FAKTYCZNIE WYBIERA budowę
  stadniny poza złożem (nie tylko `qualifies()===true` w izolacji) — próg 49→false,
  50→true, 500→true. Istniejące asercje `=== false` z rundy 2 (bez pola `surowce`) POZOSTAJĄ
  bez zmian i nadal poprawne (brak dostarczonego magazynu = 0, brak kosztu do zapłacenia —
  zero regresji tamtych testów).

TESTY:
- `node ./node_modules/typescript/bin/tsc --noEmit` — 0 błędów (świeże uruchomienie po
  zmianach obu plików).
- 5 bramek referencyjnych R-PROC-AUTOBOT §6: logic-test 213/213, tech-tree-test 19/19,
  research-test 33/33, unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone.
- NOWA `stadnina-kon-koszt-live-test.cjs`: 19/19 — ŻYWY dowód Chromium na realnym
  `commitBuildRequest` (punkt (c) BINARNEGO KRYTERIUM rundy 3, zarzut 1 Evaluatora rundy 2
  zamknięty — nie parallel-simulacja).
- `hodowla-las-test.cjs`: 112/112 (było 109/109 rundą 2, +3 nowe) — ŻYWY dowód, że
  `decideAITurn`/`pickAutoImprovements` faktycznie wybiera stadninę poza złożem przy
  magazynie >= 50 (zarzut 2 Evaluatora rundy 2 zamknięty).
- `stadnina-kon-koszt-test.cjs`: 17/17 (bez zmian, symulacja rundy 2 — nadal ważna jako
  pokrycie granicznych wartości/regresji, ale JUŻ NIE jedyny dowód punktu (c)).
- `stadnina-las-test.cjs`: 28/28. `hex-tooltip-stadnina-kopalnia-cyny-test.cjs`: 29/29.
- `food-hodowla-test.cjs`: 20 OK/4 FAIL — POTWIERDZONE identyczne z rundą 2 (pre-istniejące,
  niezwiązane, nie naprawiane przy okazji).

BLOKADY:
1. `tradeRouteKonUnlocked` dla AI/automatu (`auto-improvements.ts`) zostaje `false` na stałe —
   trasa handlowa z dostępem do konia NIE odblokowuje dziś stadniny automatowi tak, jak
   odblokowuje graczowi (main.ts:12943, `hasTradeRouteResourceAccess`). Wymagałoby dowiezienia
   `tradeRouteResourceGrants` przez `ai.ts`/`main.ts` (POZA allowlistą tej rundy) do
   `pickAutoImprovements`. Nie jest to regresja tej rundy (AI nie miało tego wcześniej na tym
   torze) i nie blokuje BINARNEGO KRYTERIUM (które dotyczy magazynu, nie trasy) — zgłaszam jako
   otwarty, jawny dług, nie cichą kwalifikację.
2. Punkt 4 pierwotnego ZADANIA (tooltip hexa "23/50 koni", main.ts:5567) — nadal poza
   allowlistą wszystkich trzech rund, nadal niewdrożony do żywej gry (zastąpiony toastem przy
   próbie budowy, który literalnie spełnia BINARNE KRYTERIUM punkt (b) — bez zmian od rundy 2).

RUNDY: 3/5
NASTĘPNY KROK: Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A, Workflow).
DEPLOY/PUSH: NIE WYKONANO
