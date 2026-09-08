STATUS: PASS
DOMAIN: GAME
TEMAT: P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1
GOAL: Weryfikacja adwersaryjna 08-dispatch-runda3.md / 09-operator-runda3.md — niezależny żywy
dowód na (1) realny `commitBuildRequest` przez nową bramkę Chromium (nie równoległa symulacja —
defekt rundy 2), (2) AI/`pickAutoImprovements` faktycznie WYBIERA stadninę poza złożem przy
magazynie >=50 (nie tylko `qualifies()===true` w izolacji), (3) zakres main.ts ograniczony
wyłącznie do dwóch nowych metod `__buildRequestTestDebug` + już zaakceptowanego zakresu rundy 2.

ZARZUTY: brak.

Uzasadnienie (dowód niezależny, nie odczyt raportu Operatora):

1) Realny `commitBuildRequest` (nie równoległa symulacja):
   - Przeczytałem `main.ts::applyBuildRequest` (linia 12830) i potwierdziłem, że dla stadniny
     na pustym heksie `needsConfirm` jest fałszywy (brak `removedImprovements`/`removesForest`),
     więc leci wprost do `commitBuildRequest(req, impact)` (linia 12923) — czyli
     `window.__buildRequestTestDebug.applyBuildRequest` (main.ts:22312, `(req) =>
     applyBuildRequest(req)`) faktycznie uruchamia PRODUKCYJNĄ ścieżkę budowy, nie duplikat.
   - Bramka kosztu 50 'kon' (linia 12953-12969, `commitBuildRequest`) czyta
     `citySurowceSumForOwner(0).kon` — DOKŁADNIE to samo źródło, które ustawia nowy
     `setCityKonStock` (main.ts:22280, zeruje 'kon' we wszystkich miastach ownera poza
     pierwszym, ustawia pierwsze na `amount` — symetryczne z odczytem sumującym
     `citySurowceSumForOwner`, main.ts:3046-3048).
   - Odpaliłem `node tools/stadnina-kon-koszt-live-test.cjs` SAMODZIELNIE (vite build +
     headless Chromium, fallback na `/opt/pw-browsers/chromium-1194`) — WYNIK NIEZALEŻNY:
     19 pass · 0 fail, wszystkie sekcje B/C/D/E potwierdzone (magazyn 10<50 blokuje; magazyn
     DOKŁADNIE 50 buduje; NOWY heks poza złożem po kroku C blokuje z toastem "masz 0" — dowód,
     że odjęto DOKŁADNIE 50, nie mniej/więcej; złoże konia buduje mimo magazynu 0), zero
     console.error/pageerror. To jest żywy dowód na realnym `commitBuildRequest`, zgodnie z
     REGUŁĄ PRZECIW SAMOOSZUKIWANIU — defekt rundy 2 (parallel-simulacja przez
     `deductBuildingStockCostAcrossCities` wołane bezpośrednio) nie występuje tu: test woła
     WYŁĄCZNIE `applyBuildRequest`, nigdy `deductBuildingStockCostAcrossCities` bezpośrednio.

2) AI/`pickAutoImprovements` faktycznie wybiera stadninę poza złożem (nie tylko qualifier):
   - Przeczytałem `auto-improvements.ts:526-547` — `horseStockAvailable` liczone z REALNEGO
     `city.surowce.kon` (duck-typing, `cities` w praktyce zawsze pełne obiekty `City` — w
     `ai.ts` potwierdzone: `export type AICity = City` (linia 570), `myCities` w
     `planCityImprovements` (linia 2547) typowane jako `AICity[]`, czyli `City[]` — pole
     `surowce` istnieje realnie w runtime i w typie na tym poziomie, zawężenie do
     `AutoImprovementCity` następuje dopiero na granicy `pickAutoImprovements`).
   - `ai.ts:2691` (`resourcePicks = pickAutoImprovements({ ...sharedOpts, cities:
     citiesForResource, ... })`) — potwierdza, że produkcyjna ścieżka AI (`planCityImprovements`
     → wywoływana z `decideAITurn`) faktycznie przekazuje te same `myCities` do
     `pickAutoImprovements`, więc naprawa w `auto-improvements.ts` dociera do realnej ścieżki
     AI, nie jest izolowana.
   - Odpaliłem `node tools/hodowla-las-test.cjs` SAMODZIELNIE (bundluje esbuildem REALNY
     `src/game/auto-improvements.ts`, nie mock) — WYNIK NIEZALEŻNY: 112/112 pass, w tym trzy
     nowe asercje na `picks.some(p => p.key==='stadnina' && ...)` — czyli na FAKTYCZNYM wyniku
     wyboru pickera, nie na `qualifies()` w izolacji: magazyn 49 → nadal `false` (próg
     zachowany), magazyn DOKŁADNIE 50 → `true` (naprawa), magazyn 500 → `true`. Istniejące
     asercje `=== false` z rundy 2 (bez pola `surowce`) pozostają nienaruszone i nadal
     poprawne (brak dostarczonego magazynu = 0 = brak kosztu do zapłacenia).

3) Zakres main.ts — wyłącznie dwie nowe metody `__buildRequestTestDebug` + zaakceptowany zakres
   rundy 2:
   - `git diff -- gra/src/main.ts` (uruchomione samodzielnie): DOKŁADNIE 3 hunki —
     `@@ -12537,6 +12537,11@@` (ImprovementBuildState.horseStockAvailable, runda 2, treść
     identyczna z 05-operator-runda2.md/07-obrona-runda2.md), `@@ -12937,9 +12942,37@@`
     (bramka kosztu w commitBuildRequest, runda 2, treść identyczna), i NOWY
     `@@ -22236,6 +22269,41@@` — wyłącznie dodanie `setCityKonStock`, `forceHorseDeposit`,
     `forceNoHorseDeposit` do już-scalonego obiektu `__buildRequestTestDebug`, wzorem
     sąsiadujących `forceCopperDeposit`/`isClearing` w tym samym obiekcie. Poza tymi 3 hunkami
     main.ts nietknięty — potwierdzone czytaniem całego diffu, nie tylko statystyk.
   - `git diff -- gra/src/game/auto-improvements.ts`: 2 hunki w JEDNEJ funkcji
     (`pickAutoImprovements`), oba wewnątrz budowy `state`/komentarzy tuż przed nią — brak
     zmian w reszcie pliku, brak zmian sygnatury eksportowanej funkcji.

TESTY (wszystkie uruchomione SAMODZIELNIE w /home/user/wt-stadnina-koszt/gra, nie tylko
odczytane z raportu Operatora):
- `node ./node_modules/typescript/bin/tsc --noEmit` — 0 błędów (24.6s, świeże uruchomienie).
- `node tools/stadnina-kon-koszt-live-test.cjs` — 19/19 pass (żywa bramka Chromium, opisana w
  punkcie 1 wyżej).
- `node tools/hodowla-las-test.cjs` — 112/112 pass (opisana w punkcie 2 wyżej).
- `node tools/stadnina-kon-koszt-test.cjs` — 17/17 pass.
- `node tools/stadnina-las-test.cjs` — 28/28 pass.
- `node tools/hex-tooltip-stadnina-kopalnia-cyny-test.cjs` — 29/29 pass.
- `node tools/food-hodowla-test.cjs` — 20 OK / 4 FAIL (potwierdzone identyczne z rundą 2,
  pre-istniejące, niezwiązane z tym tematem).
- 5 bramek referencyjnych R-PROC-AUTOBOT §6: logic-test 213/213, tech-tree-test 19/19,
  research-test 33/33, unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone.
Wszystkie liczby zgodne z 09-operator-runda3.md — potwierdzone niezależnym uruchomieniem, nie
przyjęte na słowo.

BLOKADY: brak nowych (dziedziczone z 09-operator-runda3.md, jawnie zgłoszone tam jako dług, nie
ukryta kwalifikacja): (1) `tradeRouteKonUnlocked` dla AI zostaje `false` na stałe — brak drugiej,
niezależnej ścieżki dostępu (trasa handlowa) dla automatu, zgodnie z decyzją orkiestratora
ograniczającą zakres rundy 3 wyłącznie do magazynu; (2) tooltip hexa "23/50 koni" nadal poza
allowlistą wszystkich trzech rund.

RUNDY: 3/5
NASTĘPNY KROK: Final Control (Ścieżka A, Workflow).
DEPLOY/PUSH: NIE WYKONANO
