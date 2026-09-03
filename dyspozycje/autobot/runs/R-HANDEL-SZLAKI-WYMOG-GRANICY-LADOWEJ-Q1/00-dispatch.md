TEMAT: R-HANDEL-SZLAKI-WYMOG-GRANICY-LADOWEJ-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/game/trade-routes.ts, gra/src/main.ts (WYŁĄCZNIE przekazanie
TerritoryNode[] do wywołań trade-routes), gra/src/map/territory.ts (WYŁĄCZNIE nowa,
czysta funkcja adjacency — jeśli tam jej miejsce)
MODEL+EFFORT: claude-sonnet-5, effort high

WYZWALACZ (zgłoszenie właściciela, 2026-09-03, po deployu FALA 343)
"Jeżeli chodzi o ostatnie zmiany w handlu, to handel powinien być możliwy tylko wtedy, kiedy
graniczymy z daną cywilizacją. Zmieniliśmy odległość na 12-20 i jest w porządku, ale dalej
powinna obowiązywać zasada, że możemy handlować tylko z tą cywilizacją, z którą mamy wspólną
granicę. Czyli nasza granica opiera się na ich granicy. To jest pierwsza zasada. Druga zasada:
jeżeli jakaś cywilizacja jest dalej i nie mamy z nią wspólnej granicy, możemy handlować z nią,
ale już poprzez port. To jest główna zasada, bo w tej chwili praktycznie każdy może handlować z
każdym po całym kontynencie, kiedy został zdjęty limit 12."

RECON (wykonane przez orkiestratora — nie powtarzaj, zweryfikuj i buduj na tym)
**To NIE jest regresja `R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1` — świadomie pozostawiona luka.**
Tamten dispatch (GOAL 6) jawnie stwierdzał "cywilizacje NIE muszą dziś fizycznie graniczyć [...]
nie zmieniaj tego wymogu" — zawężająca interpretacja pierwotnych słów właściciela z tego samego
zgłoszenia ("dwie cywilizacje muszą ze sobą graniczyć to jest okej", `REJESTR-PROSB-I-
ZADAN.md:4335`) — orkiestrator błędnie zinterpretował to jako niewymagane. Właściciel teraz to
jawnie odrzuca i wymaga realnej implementacji.

- Sąsiedztwo terytorialne między dwoma ownerami NIGDY nie było sprawdzane nigdzie w kodzie (ani
  w handlu, ani w dyplomacji — grep całego `gra/src` po `ownersAreNeighbors`/`territoriesAdjacent`/
  `hasCommonBorder`/"graniczy"/"sąsiadu" w kontekście dwóch cywilizacji = zero trafień). Trzeba
  zbudować od zera.
- Prymityw do reużycia: `territoryOwnerAt(q, r, nodes: readonly TerritoryNode[])`
  (`gra/src/map/territory.ts:106-125`) — model radialny (promień per miasto, `cityTerritoryRadius`,
  najbliższe miasto wygrywa przy overlapie). `buildTerritoryNodesFromCities(cities)`
  (`gra/src/map/territory-work.ts:10-20`) już buduje `TerritoryNode[]` generycznie z dowolnej
  listy miast — gotowe do wywołania z listą WSZYSTKICH miast na mapie (nie tylko gracza).
  `main.ts:4253` ma już analogiczną `buildAllTerritoryNodes()` (lokalna funkcja, zwraca dokładnie
  to samo dla wszystkich miast) — Operator powinien zbadać czy da się jej użyć bezpośrednio czy
  trzeba przekazać wynik `buildTerritoryNodesFromCities(cities)` jawnie.
- `findCityConnection`/`computeCityConnection` (`trade-routes.ts:478,508`) NIE MAJĄ dziś dostępu
  do danych terytorialnych — sygnatura przyjmuje tylko `fromCity, toCity, map, medium, params,
  builtByCity`. Wymaga PRZEPROWADZENIA nowego parametru (`territoryNodes: readonly
  TerritoryNode[]`) przez CAŁY łańcuch: `findCityConnection` (478) ← `computeCityConnection`
  (508) ← `detectBestConnection` (711) ← `citiesHaveTradeConnection` (738) ←
  `diagnoseMissingTradeRouteForPartner` (784) ← `refreshTradeRoutes` (892, DWA wywołania: pass 1
  linia 942, pass 2 linia 970) ← main.ts (dostarcza `TerritoryNode[]`).
- Warunek MA dotyczyć WYŁĄCZNIE gałęzi LAND (`trade-routes.ts:523-544`, `if (medium === 'lad')`).
  Gałąź SEA (546-573, wymaga `cityHasPort` w obu miastach + BFS po wodzie) ZOSTAJE BEZ ZMIAN —
  druga zasada właściciela: brak wspólnej granicy nadal pozwala handlować przez port.
- Cache: `__tradeConnectionCache` (WeakMap<GameMap,...>, linia ~213) jest bezpieczny WYŁĄCZNIE
  dla statycznego terenu — terytoria zmieniają się CO TURĘ (populacja, nowe/utracone miasta), więc
  wynik adjacency NIE MOŻE być cache'owany trwale w tym samym mechanizmie. Policz adjacency RAZ
  na wywołanie `refreshTradeRoutes` (lokalna `Map<string,boolean>` kluczowana np. `"ownerA|ownerB"`
  z posortowanymi id, analogicznie do istniejącego wzorca `usedSlots`/`kept` liczonego lokalnie w
  tej funkcji, linie 912-991) — NIE per-para-miast (par miast może być dużo więcej niż par
  cywilizacji), tylko per-para-WŁAŚCICIELI, przekazywane w dół do `computeCityConnection`.
- Koszt: test adjacency dla pary cywilizacji A/B = sprawdzenie sąsiadów (`hexNeighborCoords`)
  wszystkich hexów terytorium A i czy którykolwiek należy (`territoryOwnerAt`) do B — rząd setek
  hexów na cywilizację (suma promieni miast, nie cała mapa), wykonalne raz na turę.

GOAL
1. Napisz czystą funkcję sprawdzającą "czy terytoria ownera A i ownera B faktycznie się stykają"
   (np. `ownersHaveSharedLandBorder(ownerA, ownerB, territoryNodes, map)` w
   `gra/src/map/territory.ts` lub `trade-routes.ts` — Operator decyduje o lokalizacji, uzasadnia).
   Definicja "stykają się": istnieje hex należący (wg `territoryOwnerAt`) do terytorium A, którego
   PRZYNAJMNIEJ JEDEN sąsiad (`hexNeighborCoords`) należy do terytorium B (lub odwrotnie —
   symetryczne). Rozważ przypadek brzegowy: terytoria stykają się WYŁĄCZNIE przez wodę (nie
   powinno liczyć się jako granica LĄDOWA) — sprawdź czy `territoryOwnerAt` w ogóle przypisuje
   terytorium do heksów wodnych (jeśli nie, problem znika sam; jeśli tak, dodaj filtr terenu
   lądowego).
2. Wpięcie: w gałęzi LAND `computeCityConnection` (`trade-routes.ts:523-544`), PRZED lub PO BFS
   (Operator decyduje o kolejności dla wydajności — tani check adjacency przed drogim BFS może
   być szybszym early-exit), dodaj warunek: jeśli `!ownersHaveSharedLandBorder(fromCity.ownerId,
   toCity.ownerId, ...)`, connectivity = NOT_CONNECTED, niezależnie od wyniku BFS. Gałąź SEA
   (546-573) BEZ ZMIAN.
3. Przeprowadź `TerritoryNode[]` przez cały łańcuch wywołań wymieniony w RECON — sygnatury
   `findCityConnection`/`computeCityConnection`/`detectBestConnection`/
   `citiesHaveTradeConnection`/`diagnoseMissingTradeRouteForPartner`/`refreshTradeRoutes`
   dostają nowy parametr. main.ts dostarcza dane (reużyj `buildAllTerritoryNodes()`/
   `buildTerritoryNodesFromCities` — NIE duplikuj logiki budowania węzłów terytorium).
4. Adjacency liczone RAZ na wywołanie `refreshTradeRoutes` (lokalna mapa per-para-właścicieli),
   NIE osobno per-para-miast, NIE w trwałym `WeakMap<GameMap,...>`.
5. Zaktualizuj `diagnoseMissingTradeRouteForPartner` (784) żeby poprawnie zgłaszała "brak
   wspólnej granicy" jako przyczynę braku trasy, gdy to faktycznie ten powód (odróżnij od "brak
   fizycznej ścieżki"/"brak umowy handlowej"/"wojna").

KRYTERIA KOŃCA (binarne)
1. Test jednostkowy: dwie cywilizacje z terytoriami STYKAJĄCYMI SIĘ (sąsiadujące hexy) →
   `connected: true` dla LAND (przy spełnionych pozostałych warunkach — pokój, umowa handlowa).
2. Test jednostkowy: dwie cywilizacje z terytoriami ODLEGŁYMI o 1 hex (fizycznie osiągalne BFS,
   ale terytoria NIE stykają się — jest pas niczyjego/neutralnego terenu pomiędzy) → `connected:
   false` dla LAND — DOKŁADNIE scenariusz z zgłoszenia właściciela ("praktycznie każdy może
   handlować z każdym po całym kontynencie").
3. Test jednostkowy: dwie cywilizacje NIE stykające się lądem, ale obie mają Port i połączenie
   morskie istnieje (BFS po wodzie) → `connected: true` dla SEA — zero regresji drugiej zasady
   właściciela (handel przez port nie wymaga granicy).
4. Test jednostkowy: para cywilizacji z terytoriami stykającymi się TYLKO przez wodę (np. dwie
   wyspy blisko siebie, brak lądowego mostu) → LAND `connected: false` (adjacency wymaga
   lądowego sąsiedztwa, nie tylko geometrycznej bliskości promieni terytorium).
5. Żywy test (jeśli praktyczny w rozsądnym czasie, wzorem istniejących testów tras handlowych) —
   symulacja świata z co najmniej 3 cywilizacjami w różnych konfiguracjach sąsiedztwa,
   potwierdzająca że `refreshTradeRoutes` poprawnie tworzy/usuwa trasy LAND wg nowego warunku,
   bez regresji SEA.
6. Wydajność: pomiar czasu `refreshTradeRoutes` na dużej mapie z wieloma cywilizacjami PRZED/PO
   zmianie — brak rzędu-wielkości regresji (dokumentuj liczby w raporcie, nie zakładaj).
7. `tsc --noEmit` czysty, istniejące testy `gra/tools/trade-routes-test.cjs`,
   `gra/tools/trade-routes-income-test.cjs`, `gra/tools/cuda-handel-test.cjs`,
   `gra/tools/trade-ilosc-test.cjs` nadal zielone (poza 5 już-pre-istniejącymi fail w
   trade-ilosc-test.cjs, potwierdzonymi jako niezwiązane w poprzednim temacie — jeśli nadal
   dokładnie te same 5, nie regresja; jeśli inne, zbadaj), 5 bramek referencyjnych zielone.

ALLOWLISTA (nic poza tym)
- gra/src/game/trade-routes.ts (główna logika, sygnatury, wpięcie warunku).
- gra/src/map/territory.ts — WYŁĄCZNIE jeśli Operator umieści tam nową funkcję adjacency
  (czysta funkcja, zero zmian w istniejących `territoryOwnerAt`/`isInTerritory`).
- gra/src/main.ts — WYŁĄCZNIE przekazanie `TerritoryNode[]` do wywołań `refreshTradeRoutes`/
  innych funkcji trade-routes (reużycie istniejącego `buildAllTerritoryNodes()` lub
  `buildTerritoryNodesFromCities`), zero zmian w logice terytorium samej.
- gra/tools/trade-routes-test.cjs (rozszerzenie), nowy test jeśli potrzebny osobny plik.
Zakazane bezwzględnie: zmiana modelu terytorium (`territoryOwnerAt`/`cityTerritoryRadius`/
`isInTerritory` — istniejąca logika zostaje, tylko REUŻYWANA), zmiana progu
`TradeRouteIncomeParams`/krzywej dochodu (osobny wymiar, temat `R-HANDEL-SZLAKI-LIMIT-
DYSTANSU-USUN-Q1` go już ustalił), zmiana gałęzi SEA (`trade-routes.ts:546-573`), zmiana filtru
pokój/umowa handlowa w `refreshTradeRoutes` (osobny, niezmieniany wymiar), dyspozycje/WERSJE.md,
gra-robocza/ROBOCZA-MANIFEST.json, playbook.json.

IZOLACJA
worktree /home/user/wt-handel-szlaki-wymog-granicy-ladowej, gałąź
autobot/R-HANDEL-SZLAKI-WYMOG-GRANICY-LADOWEJ-Q1, baza jawnie: origin/main (najnowszy commit na
moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona kompilacja to
node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 6 (wydajność) za spełnione bez faktycznego pomiaru liczb (czas w ms
przed/po) — "powinno być szybkie" bez pomiaru nie jest dowodem. Zakaz zbudowania testu adjacency
z terytoriami tak blisko siebie, że test nie odróżnia "stykają się" od "są blisko ale nie
stykają" — test 2 (odległe o 1 hex) musi używać RÓŻNYCH pozycji miast niż test 1 (stykające się),
z jawnie pokazanym `hexDistance`/promieniami obu terytoriów w raporcie, dowodzącym że scenariusz
faktycznie testuje granicę, nie odległość.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora.
