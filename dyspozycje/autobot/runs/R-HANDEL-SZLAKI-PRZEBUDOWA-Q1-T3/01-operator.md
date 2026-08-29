# 01 — OPERATOR (runda 1)

STATUS: PASS
DOMAIN: GAME
TEMAT: `R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T3`
GOAL: Rozdzielić w `refreshTradeRoutes()` gating budynkami handlowymi od
istnienia trasy — aktywna umowa + geometryczna łączność + brak wojny (+ Port
fizyczny dla morza, bez zmian) dają dochód dystansowy OD RAZU; liczba
budynków handlowych określa wyłącznie nowe pole `budynekOdblokowany`.

## Recon (przed kodem)

- Potwierdzone w kodzie DWA różne pojęcia "portu", dokładnie jak wymagał
  dispatch: `PORT_BUILDING_IDS = {'port','port_wielki'}` (linia ~134,
  `cityHasPort`) — fizyczny wymóg połączenia morskiego wewnątrz
  `findCityConnection`/`computeCityConnection`, NIETKNIĘTY w tej zmianie.
  Osobno `TRADE_BUILDING_IDS = {'targowisko','port','port_wielki'}` (linia
  ~464/`tradeRouteLimitForCity`) — pojemność „slotów" budynkowych, dawniej
  gatingująca ISTNIENIE trasy, od T3 gatingująca wyłącznie
  `budynekOdblokowany`.
- `refreshTradeRoutes` (Pass 1 istniejące + Pass 2 nowe) używała
  `hasRoom(from)&&hasRoom(to)` jako bramki PRZED dodaniem trasy do `kept`.

## Zmiany

**`gra/src/game/trade-routes.ts`:**
1. `TradeRoute.budynekOdblokowany: boolean` — nowe pole (nazwa zgodna z
   sugestią dispatchu). Dokumentuje: czy TA trasa ma dziś pokrycie budynkowe
   po obu stronach; nie wpływa na istnienie; konsumowane w T4.
2. `refreshTradeRoutes`: `hasRoom`/`useSlot` przemianowane funkcjonalnie na
   `grantBuilding(fromId, toId)` — zwraca `true`/konsumuje sloty TYLKO gdy
   OBIE strony mają wolny slot, ale NIE blokuje już dodania trasy do `kept`.
   Obie fazy (Pass 1 istniejące po id, Pass 2 nowe wg rosnącego dystansu)
   dodają WSZYSTKIE geometrycznie/traktatowo poprawne trasy bezwarunkowo i
   liczą `budynekOdblokowany: grantBuilding(...)` tym samym mechanizmem
   priorytetu, którym dawniej gatingowały istnienie.
3. `createTradeRoute` (samodzielny konstruktor, używany tylko w testach) —
   liczy `budynekOdblokowany` wprost z obu miast (poza rywalizacją o sloty,
   bo nie zna innych tras).
4. `diagnoseMissingTradeRouteForPartner` — PRZED T3 filtrowała miasta po
   `tradeRouteLimitForCity>0` i zwracała stałe komunikaty „brak
   Targowiska/Portu"/„brak wolnego slotu trasy" jako powód braku trasy.
   Od T3 te komunikaty są nieaktualne (budynek już nie warunkuje istnienia)
   — usunięte, diagnoza sprawdza teraz wojnę i geometrię/Port fizyczny na
   WSZYSTKICH miastach bezpośrednio.

## Decyzja projektowa — punkt 3 dispatchu (stabilność)

Zachowany DOKŁADNIE ten sam mechanizm priorytetu co przed T3, przeniesiony
z gatingu istnienia na gating `budynekOdblokowany`: istniejące trasy
(`existingRoutes`, sortowane po id) mają pierwszeństwo do slotu przed nowymi
kandydaturami (sortowanymi wg rosnącego dystansu). Uzasadnienie z cytatu
właściciela: 5% „dochodzi dodatkowo" do już istniejącego dochodu
dystansowego — budynek fizycznie obsługuje ograniczoną liczbę szlaków, więc
jego „odblokowanie" bonusu powinno pozostać rzadkim, przydzielanym zasobem,
tak jak przed T3 był rzadkim zasobem sam slot trasy. Odrzucony wariant:
przyznawać `budynekOdblokowany=true` wszystkim trasom bez limitu — sprzeczne
z tabelą T3 w decyzji, która explicite każe zachować `tradeRouteLimitForCity`
jako czynnik gatingujący (tylko przesunięty z istnienia na flagę).

## Skutek uboczny — `computeTradeRouteResourceGrants` (poza allowlistą, NIE
zmieniony kodowo, tylko test zaktualizowany)

Mechanizm grantów surowcowych (braz/żelazo/koń, HANDEL-Q11) zależał ZAWSZE
wyłącznie od `route.status==='polaczony'`, nigdy od budynku handlowego —
to osobny mechanizm, nie dotknięty tym dispatchem kodowo. Ponieważ istnienie
trasy nie jest już gatingowane budynkiem, granty surowcowe teraz również
przetrwają brak/zniszczenie Targowiska — to naturalna, zamierzona
konsekwencja poluzowania gatingu istnienia (cytat właściciela: „handel
dostępny jest od początku"), nie nowa logika. Zaktualizowałem tylko test
`trade-grant-test.cjs` (sekcja F2), który do tej pory sprawdzał STARE
założenie.

## Testy

`gra/tools/trade-routes-test.cjs` — rozszerzony o asercje `budynekOdblokowany`
dla `createTradeRoute` (pusty/pełny/jednostronny `builtByCity`): **65/0**.

`gra/tools/trade-routes-income-test.cjs` — sekcje D i E przepisane (istnienie
już niegatingowane, `budynekOdblokowany` gatingowane tym samym priorytetem),
nowa sekcja J (dochód bez budynku, Port fizyczny nadal wymagany dla morza
niezależnie od `budynekOdblokowany`, kontrola że `port` liczy się TAKŻE jako
budynek handlowy): **91/1** — jedyny FAIL to `H2` (advanceCityEconomy),
**identyczny bit-for-bit na `origin/main` przed zmianą** (potwierdzone
`git stash` + uruchomienie), pre-istniejący, niezwiązany z T3.

`gra/tools/trade-grant-test.cjs` — sekcja F2 przepisana (trasa i grant
PRZETRWAŁY zniszczenie budynku): **62/0** (baseline origin/main: 60/0 —
przyrost to nowe asercje, nie regresja).

`gra/tools/trade-ilosc-test.cjs` — **35/5**, identyczne 5 FAIL na
`origin/main` (potwierdzone `git stash`) — pre-istniejące, niezwiązane.

`gra/tools/mennica-uspienie-test.cjs`, `zloto-szlak-test.cjs` — zielone bez
zmian (49/0, 54/0).

`node ./node_modules/typescript/bin/tsc --noEmit` — czyste (0 błędów).

`node ./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir`
— OK, `✓ built in 37.15s`.

**5 bramek referencyjnych:** `logic-test.cjs` 213/213, `tech-tree-test.cjs`
19/0, `research-test.cjs` 33/0, `unit-replace-test.cjs` 13/13,
`combat-test.cjs` 6/6 — wszystkie zielone.

## Zgodność z kryteriami sukcesu dispatchu

1. ✅ trasa istnieje bez budynku — sekcja J testu income.
2. ✅ `tradeRouteLimitForCity` nie ogranicza istnienia, nowe pole
   `budynekOdblokowany` gotowe do konsumpcji w T4.
3. ✅ stabilność zachowana na obu poziomach (istnienie ORAZ
   `budynekOdblokowany`) — sekcja E.
4. ✅ zero zmian w formule dystansowej/stawkach (T1/T2 nietknięte, sekcje F/F2
   testu income bez zmian, zielone).
5. ✅ `tsc`/`vite build`/testy tematu/5 bramek — wyżej.
6. Brak niejednoznaczności wymagającej ABC — dwa pojęcia „portu" jednoznacznie
   rozróżnione w kodzie przed zmianą (recon), decyzja właściciela pokrywa
   projekt pola i priorytetu wprost.

ZMIANY/COMMIT: branch `autobot/HANDEL-T3-Q1`, commit `c206b490` — 4 pliki
w allowlicie (`gra/src/game/trade-routes.ts`,
`gra/tools/trade-routes-test.cjs`, `gra/tools/trade-routes-income-test.cjs`,
`gra/tools/trade-grant-test.cjs`). Wypchnięte do `origin/autobot/HANDEL-T3-Q1`.

BLOKADY: brak.

RUNDY: 1/5.

NASTĘPNY KROK: Evaluator.

DEPLOY/PUSH: NIE WYKONANO (branch roboczy wypchnięty, integracja do `main`
i deploy poza zakresem Operatora).
