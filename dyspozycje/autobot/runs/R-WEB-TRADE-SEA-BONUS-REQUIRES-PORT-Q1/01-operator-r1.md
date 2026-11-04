STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-TRADE-SEA-BONUS-REQUIRES-PORT-Q1
GOAL: bonus +1 za trasę morską ponad pierwszą wymaga Portu (`cityHasPort`) w mieście; trasa i dochód dystansowy bez zmian.

## Pomiar PRZED
- Bonus liczy `computeSeaTradeBonusIncomeByCity` (`gra/src/game/trade-routes.ts`, ok. l.1757): `max(0, count-1) * 1` dla każdego miasta z licznika `computeSeaTradeRouteCountByCity` (l.1723; liczy trasy `status=polaczony`, `medium='morze'`, OBA końce trasy).
- Medium trasy wyznacza `contactTradeConnection` (l.1027): ląd w jednym komponencie lądowym, inaczej morze. Port nie jest sprawdzany (po CONTACT-ONLY-Q1).
- Stary komentarz zakładał, że trasa morska wymaga Portu — nieaktualny. Bonus dostawały więc oba końce niezależnie od Portu.
- Konsumenci: `main.ts` 4 miejsca (toast nowej trasy ~l.17054, podgląd miasta ~l.20174, panel ~l.28245, tura ekonomii ~l.35416).
- Dowód PRZED: nowy test na starym kodzie (`TR_MODULE=old`) — 7 passed, 19 failed (B3: miasto bez Portu z >=2 trasami morskimi dostaje bonus).

## NAPRAWA
- `computeSeaTradeBonusIncomeByCity(counts, builtByCity, bonusPerRoute = 1)`: nowy WYMAGANY 2. argument `builtByCity`; miasto bez Portu/Portu wielkiego jest pomijane (`continue`). Zmiana sygnatury (bonusPerRoute przesunięty na 3. miejsce) — jedyni wołający to `main.ts` i testy; tsc wyłapuje pominięcie.
- `main.ts` (zgłoszenie: allowlista dopuszczała tylko gdy konieczne — było konieczne): 4 wywołania dostają `builtByCity` / `cityBuilt`.
- Bez zmian: krzywa dochodu, warunki powstania trasy, licznik tras morskich.

## ZMIANY/COMMIT
Commit kodu: 31acc1fffd779caa013e1b6a4edc2e6952e5b2bb (raport w następnym commicie).
Pliki: `gra/src/game/trade-routes.ts`, `gra/src/main.ts`, nowy `gra/tools/trade-sea-bonus-requires-port-test.cjs` (30 asercji: jednostkowe A1–A13, integracyjne na wyspach B1–B5 przez `refreshTradeRoutes`, mutanty M1–M4: usunięty warunek, odwrócony, bonus od pierwszej trasy, tylko Port poziom 1 — wszystkie wykryte).
Testy zaktualizowane (uzasadnienie: nowa sygnatura / fixture bez Portu): `trade-routes-test.cjs` (l4, l5 — dodano mapę z Portem), `hud-skarbiec-test.cjs` (fixture), `trade-routes-hud-filter-test.cjs` (miasto p1 dostaje Port na czas bloku R2-MARITIME + nowa asercja +1), `naval-water-access-gate-test.cjs` (pin regex wywołania w main.ts z `cityBuilt`).

## TESTY (PRZED vs PO, 33 pliki: `*trade*`, `*handel*`, `*szlak*`, `*port*` + hud-skarbiec + naval-water-access-gate)
- tsc `--noEmit`: EXIT=0.
- Różnica PRZED/PO: tylko hud-filter 63->64 passed, nowy test 30/0. Reszta identyczna.
- Błędy sprzed zmiany, bez zmiany po (NIE z tego tematu): `trade-ilosc-test` 35/5 fail, `hud-skarbiec-test` 33/1 fail.
- Symulacja 3 ziaren na wylosowanych mapach: NIE_ZMIERZONO (zastąpiona deterministyczną mapą wysp w teście B; bez przeglądarki).
- Zapis/odczyt: bonus jest pochodną tras i `cityBuilt` (nie jest zapisywany); test A12 potwierdza identyczny wynik po round-trip JSON.

## BLOKADY
Brak. Uwaga dla Evaluatora: UI (opisy/tooltipy) nadal może mówić o bonusie morskim bez wzmianki o wymogu Portu — poza zakresem, NIE_ZMIERZONO.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
