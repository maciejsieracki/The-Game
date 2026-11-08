STATUS: INTEGRATION_PENDING (część w allowliście PASS; wpięcie w main.ts i POMIAR zablokowane allowlistą)
DOMAIN: GAME
TEMAT: R-WEB-AI-PURCHASE-MAINTENANCE-RESERVE-Q1
GOAL: AI nie kupuje jednostek, gdy po zakupie dochód netto złota/turę spadłby poniżej progu lub skarbiec nie pokrywałby ceny + N tur utrzymania; progi w gra/data/ai-params.json per poziom trudności.

## Diagnoza (1)
- `shouldAIPurchaseUnit` (gra/src/game/ai.ts ~7178) sprawdzał tylko `hasManpower && treasury >= goldCost`. Jedyny wywołujący: gra/src/main.ts ~40744 (podaje treasury, koszt, Manpower).
- `ai_rush_jednostka_rezerwa_zlota` (i `ai_rush_jednostka_max_na_ture`) w gra/data/econ-params.json: MARTWE, nie czytane przez żaden kod produkcyjny (grep: tylko JSON i stare bundle). Decyzja: NIE podpinam (to było rzadkie "100 złota bufora", nie rezerwa utrzymania), zastępują je nowe klucze w ai-params.json. Usunięcie wpisów z econ-params.json wymaga rozszerzenia allowlisty (econ-params.json poza nią), więc zostawiam i zgłaszam do osobnego sprzątnięcia.

## Zmiany (2)
- ai.ts: `shouldAIPurchaseUnit` przyjmuje opcjonalne `reserve`, `netIncomePerTurn`, `upkeepPerTurn`, `unitUpkeepPerTurn`. Reguła (tylko gdy wszystkie podane, inaczej dawna bramka):
  1. netIncome − unitUpkeep >= minDochodNetto,
  2. treasury − goldCost >= rezerwaTur × (upkeep + unitUpkeep).
  Nowe: `AiPurchaseReserveParams`, `loadAiPurchaseReserveParams(data, poziom)`.
- ai-params.json: 6 kluczy `kupno_jednostki_{rezerwa_tur,min_dochod_netto}_poziom{1,2,3}`.
- Nowy test gra/tools/ai-purchase-maintenance-reserve-test.cjs.

## Tabela progów (do zatwierdzenia przez właściciela; PLACEHOLDER, NIEzmierzone)
| Poziom | rezerwa_tur (N) | min_dochod_netto |
|---|---|---|
| Easy (1) | 3 | 0 |
| Normal (2) | 3 | 0 |
| Hard (3) | 2 | -2 |
Uzasadnienie: Normal = rozsądny gracz (nie schodzi na ujemny dochód, trzyma ~3 tury utrzymania); Easy identycznie (nie ma być agresywniejszy od Normal w kupowaniu); Hard toleruje lekki deficyt i mniejszą rezerwę (większe armie, ale nadal skończone). Wartości dobrane z rozumowania, nie z pomiaru.

## BLOKADA (ważne)
Reguła jest nieaktywna w grze, dopóki main.ts ~40744 nie poda `reserve`, `netIncomePerTurn`, `upkeepPerTurn`, `unitUpkeepPerTurn`. Dispatch zakazuje zmian w main.ts, a w ai.ts brak dostępu do stanu ekonomii, więc nie da się tego zrobić w allowliście. Potrzebny minimalny patch main.ts (kilka linii): `reserve: loadAiPurchaseReserveParams(data, <poziom ownera>)`, upkeep = suma `buildingUpkeepForCityId` miast ownera + utrzymanie jednostek (`totalUnitUpkeep`, wzór jak `garrisonUpkeepForCity` ~8112), `unitUpkeepPerTurn` z `buildUnitUpkeepTable`, `netIncomePerTurn` = przychód złota ownera − upkeep (do ustalenia: istniejąca prognoza netto złota z HUD, ~13410/20915). Wymaga decyzji orkiestratora o rozszerzeniu allowlisty o main.ts (jedna funkcja, bez dotykania ARMY-STACK-LIMIT).

## Pomiar (3): NIE WYKONANY
Bez wpięcia w main.ts przed/po są identyczne, więc pomiar byłby bezsensowny. Dodatkowo bundle do Chromium trzeba budować z kopii poza repo (zakaz build w gra/). Do wykonania w r2 po rozszerzeniu allowlisty: ai-army-live-measure.cjs (T40, T100), metryki: liczba jednostek AI, skarbiec, dochód netto, wojny, utrata miast.

## TESTY (4)
- Nowy test: 28/28 PASS (skarbiec duży/mały z brzegami, dochód ujemny/dodatni, Easy/Normal/Hard, zgodność wsteczna).
- logic-test 213/213 (jak baza). ai-test 274 passed / 20 failed (identycznie jak baza). `npx tsc --noEmit` czyste.
- ai-unit-rush 7/0, ai-mp-rekrutacja-build-gate 21/0, ai-rekrutacja-parytet 7/0, ai-prod-fallback 17/0.
- ai-jednostki-tylko-zakup 43/1: FAIL "D11 main.ts ma DOKLADNIE JEDEN punkt zuzycia Pracy" dotyczy main.ts, którego nie ruszałem (nie z mojej zmiany; nie porównywałem z bazą osobnym przebiegiem).
- node_modules zainstalowane lokalnie w gra/ (gitignored) wyłącznie do uruchomienia testów.

## RUNDY: 1/5
## NASTĘPNY KROK: orkiestrator: zgoda na main.ts (wpięcie) -> runda 2 Operatora (patch + pomiar T40/T100 + test integracyjny), potem Evaluator.
## DEPLOY/PUSH: NIE WYKONANO
