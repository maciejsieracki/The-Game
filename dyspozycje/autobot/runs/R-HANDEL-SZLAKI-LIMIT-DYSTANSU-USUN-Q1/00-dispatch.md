TEMAT: R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/game/trade-routes.ts (computeCityConnection, multiSourceBfs,
DEFAULT_TRADE_ROUTE_PARAMS, DEFAULT_TRADE_ROUTE_INCOME_PARAMS, tradeRouteDistanceIncome,
diagnoseMissingTradeRouteForPartner), gra/data/econ-params.json (blok handel_szlaki)
MODEL+EFFORT: claude-sonnet-5, effort high (zmiana balansu ekonomicznego + potencjalny wpływ
na wydajność na dużych mapach — wymaga starannego reconu wydajnościowego i testu na mapie
superogromny)

WYZWALACZ (dosłownie od właściciela)
"okej usuń ten limit max 12xów do lądu i 20 dla morza nie wiem skąd on się wziął
prawdopodobnie któryś z agentów sam sobie takie zasady przypisał to jest nielogiczne dlatego
że przy dużych mapach te odległości powodują że żadne miasta nie mogą ze sobą handlować. okej
rozumiem dwie cywilizacje muszą ze sobą graniczyć to jest okej ale to nie oznacza że na
przykład stolica danej cywilizacji nie może handlować bo jest za daleko ze stolicą innej
cywilizacji."

Kontekst poprzedniej wymiany w tej samej sesji (dla pełnego obrazu, nie do powtarzania jako
osobne kryterium): właściciel wcześniej pytał, dlaczego część miast tej samej pary cywilizacji
handluje, a część nie, mimo podpisanej Umowy Handlowej — odpowiedź (limit dystansu per para
miast) była techniczne poprawna, ale właściciel uznał sam limit za nielogiczny i zażądał jego
usunięcia, nie tylko wyjaśnienia.

SPROSTOWANIE FAKTU: limit NIE został "sam sobie przypisany przez agenta" bez decyzji — jest
udokumentowany jako świadoma decyzja właściciela sprzed tej sesji: "Q6=B (Maciej 2026-07-20):
connected = dystans <= prog ORAZ istnieje przechodnia sciezka" (komentarz w
econ-params.json:704). Ten dispatch jest per aktualnej, jawnej instrukcji właściciela WPROST
ODWROTNĄ decyzją — traktuj to jako świadome odwrócenie wcześniejszej decyzji, analogicznie do
odwrócenia P-PROMOCJA-FRONT-RESET-POSTEPU-Q1=B w temacie R-PRODUKCJA-POSTEP-PAMIEC-PO-USUNIECIU-Q1
w tej samej sesji — NIE traktuj starej wartości jako błędu do "poprawienia po cichu", tylko jako
zamierzoną zmianę projektową do udokumentowania w kodzie/komentarzach.

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji, subagent Explore)
- Próg dystansu i promień BFS to DWA sczepione mechanizmy w `computeCityConnection`
  (`trade-routes.ts:338-393`): (1) tani, O(1) short-circuit `if (distance > params.ladMaxDist)
  return NOT_CONNECTED` (linia 351, analogicznie 370 dla morza) PRZED uruchomieniem BFS;
  (2) `multiSourceBfs` (linie 217-277) wołane z `maxSteps = params.ladMaxDist * BFS_RADIUS_MULT`
  (linia 362, `BFS_RADIUS_MULT=2` linia 205) / `params.morzeMaxDist * BFS_RADIUS_MULT` (linia
  382). USUNIĘCIE WYŁĄCZNIE dwóch `if (distance > ...)` NIE WYSTARCZY — `maxSteps` nadal
  odtworzy dokładnie ten sam limit jako promień ścieżki BFS (24/40 kroków), tylko "tylnymi
  drzwiami". Trzeba zmienić OBA mechanizmy razem.
- Maksymalny rozmiar mapy: `generator.ts:754-770`, największy predefiniowany rozmiar to
  "superogromny" = 672×476 heksów. Górne ograniczenie `hexDistance` na tej mapie:
  (672-1)+(476-1)=1146. `GameMap` (types/map.ts:13-23) ma pola `szerokoscQ`/`wysokoscR`
  dostępne wewnątrz funkcji detekcji połączenia — sufit BFS powinien być liczony DYNAMICZNIE
  per-mapa (`map.szerokoscQ + map.wysokoscR`, bezpieczna górna granica z nierówności
  trójkąta), nie jako jedna globalna stała, żeby było odporne na przyszłe większe mapy.
- Koszt wydajnościowy: `refreshTradeRoutes` woła się 1×/turę (main.ts:13526/13536); Pass 2
  wewnątrz (trade-routes.ts:785-795) robi `detectBestConnection` (do 2× `findCityConnection`)
  dla KAŻDEJ pary (miasto gracza × miasto obcej cywilizacji z pokojem+Umową Handlową) CO TURĘ,
  nie tylko dla nowych par — O(P×F) wywołań. Cache (`__tradeConnectionCache`, WeakMap per
  mapa, `trade-routes.ts:179`) amortyzuje POWTÓRNE wywołania dla tej samej pary/stanu, ale
  PIERWSZE policzenie danej pary (nowe miasto, nowy port, nowy kontakt dyplomatyczny) nadal
  wymaga pełnego BFS. Dziś tani O(1) distance-check odsiewa PRZED BFS zdecydowaną większość
  dalekich/nieosiągalnych par (inne kontynenty) bez uruchamiania BFS w ogóle — po usunięciu
  tego odsiewu + dużym `maxSteps`, każda taka para wywoła pełny BFS aż wyczerpie CAŁY
  osiągalny obszar danego medium do granicy `maxSteps` — realne ryzyko spike'u przy pierwszym
  kontakcie/nowej mapie na "superogromny".
- **KRYTYCZNE SPRZĘŻENIE (wymaga rozstrzygnięcia w tym dispatchu, nie osobnego ABC —
  patrz GOAL 3)**: `TradeRouteParams` (próg połączenia) i `TradeRouteIncomeParams` (szczyt
  krzywej dochodu, `DEFAULT_TRADE_ROUTE_INCOME_PARAMS` linia 844-849) czytają TE SAME klucze
  JSON `lad_max_dystans`/`morze_max_dystans` (`loadTradeRouteParams` linia 460-474 i
  `loadTradeRouteIncomeParams` linia 904-920). Wzór dochodu (`tradeRouteDistanceIncome`,
  linia 860-869): `stawkaWzrostu = (dochodSzczyt-dochodPodloga) / maxDist`, gdzie `maxDist` to
  dziś `ladMaxDist`/`morzeMaxDist` (12/20). Jeśli connectivity max-dist po prostu zniknie/
  wzrośnie do ~1150, a income nadal czyta tę samą liczbę jako swój `maxDist`, krzywa dochodu
  SPŁASZCZY SIĘ drastycznie: typowa dzisiejsza trasa 5-15 heksów zarobi ledwie powyżej podłogi
  (5) zamiast dochodzić do połowy/całości szczytu (40) jak dziś — realna, niezamierzona zmiana
  balansu ekonomicznego jako efekt uboczny, nie cel tego tematu.
- 3 pliki testowe w `gra/tools/` jawnie testują progi 12/20: `trade-routes-test.cjs` (test b,
  linie 64/77-80, zakłada dystans 20>12 → not connected — wymaga przeprojektowania),
  `trade-routes-income-test.cjs` (sekcja F/F2, linie ~322-400 i fixture linia 596-597, testuje
  `tradeRouteDistanceIncome(12,'lad',...)===40` itd. — wymaga aktualizacji zgodnie z GOAL 3).
  `cuda-handel-test.cjs` liczy oczekiwaną wartość dynamicznie z `incP.ladMaxDist` — odporny,
  bez zmian.
- Grep całego `gra/src` po `ladMaxDist`/`morzeMaxDist` poza `trade-routes.ts` — zero trafień,
  żadna inna funkcja nie replikuje osobnego limitu dystansu dla handlu.
- `diagnoseMissingTradeRouteForPartner` (linia 635) — komunikat UI "za daleko" oparty na
  `params.ladMaxDist` — po usunięciu limitu lądowego ten branch stanie się martwy dla lądu
  (do usunięcia/uproszczenia razem z resztą, jeśli recon Operatora potwierdzi).

GOAL
1. Usuń twardy próg dystansu jako warunek ISTNIENIA trasy handlowej: zarówno
   `if (distance > params.ladMaxDist) return NOT_CONNECTED` (linia 351) jak i analogiczny dla
   morza (linia 370) — connectivity ma zależeć WYŁĄCZNIE od faktycznej fizycznej osiągalności
   (BFS po terenie przechodnim dla danego medium), nie od arbitralnej liczby heksów.
2. Podnieś sufit BFS (`maxSteps`) tak, by w praktyce NIGDY nie ucinał realnego połączenia na
   ŻADNYM wspieranym rozmiarze mapy (włącznie z "superogromny") — licz go DYNAMICZNIE z
   wymiarów aktualnej mapy (`map.szerokoscQ + map.wysokoscR`, patrz RECON), nie jako stałą.
   Rozważ (i uzasadnij wybór w raporcie) zachowanie taniego wstępnego filtra przed pełnym BFS
   (np. bounding-box/heurystyka), żeby nie tracić dzisiejszej wydajności dla oczywiście
   nieosiągalnych par (inne kontynenty/wyspy bez portu) — cel: zero regresji wydajności dla
   typowych, blisko położonych par, akceptowalny (zmierzony, opisany w raporcie) koszt dla par
   odległych.
3. ROZWIĄZANIE SPRZĘŻENIA connectivity/income (patrz RECON) — WYBRANE ROZSTRZYGNIĘCIE
   (decyzja orkiestratora, nie wymaga dalszego ABC, bo to najmniej zaskakująca, najbezpieczniejsza
   interpretacja życzenia właściciela — właściciel prosił o zniesienie BLOKADY handlu, nie o
   przeprojektowanie krzywej dochodu): ROZDZIEL parametr używany do progu connectivity od
   parametru używanego do szczytu krzywej dochodu. `TradeRouteIncomeParams.ladMaxDist`/
   `morzeMaxDist` MAJĄ ZACHOWAĆ dzisiejsze wartości (12/20) jako "dystans referencyjny szczytu
   krzywej dochodu" — czyli ISTNIEJĄCE, bliskie trasy (≤12 lądem / ≤20 morzem) zarabiają
   DOKŁADNIE tyle co dziś (zero zmiany balansu dla typowego gameplayu), a trasy DALSZE niż ten
   referencyjny dystans dostają dochód RÓWNY SZCZYTOWI (40) — czyli nie mniej niż najlepsza
   dzisiejsza trasa, nigdy więcej (żadnego "przepełnienia" formuły powyżej szczytu). Efektywnie:
   `tradeRouteDistanceIncome` ma używać `Math.min(distance, incomeParams.maxDist odpowiedni dla
   medium)` jako wejścia do istniejącego wzoru liniowego, zamiast surowego `distance`. Osobny
   parametr connectivity (`TradeRouteParams.ladMaxDist`/`morzeMaxDist`) przestaje być używany
   jako próg blokujący (GOAL 1) — jeśli w kodzie zostanie potrzebny jako pole struktury (np. do
   zgodności typów), oznacz go jawnie komentarzem jako "nieużywany do blokowania, patrz GOAL 1"
   lub usuń, jeśli recon potwierdzi że nic więcej go nie czyta.
4. Zaktualizuj `gra/data/econ-params.json` (blok `handel_szlaki`, pola `opis`) tak, by opisy
   NIE wprowadzały w błąd — jawnie udokumentuj że `lad_max_dystans`/`morze_max_dystans` to od
   teraz WYŁĄCZNIE referencyjny dystans szczytu krzywej DOCHODU, nie próg blokujący istnienie
   trasy, z odniesieniem do tego tematu i datą.
5. `diagnoseMissingTradeRouteForPartner` — usuń lub przeprojektuj martwy branch "za daleko"
   dla lądu (skoro ląd nie ma już progu blokującego); zachowaj analogiczny komunikat dla morza
   WYŁĄCZNIE jeśli faktyczny powód braku połączenia to brak portu/fizyczna nieosiągalność, nie
   dystans.
6. Zero zmian w wymogu pokoju + aktywnej Umowy Handlowej jako warunku istnienia trasy — to
   NIE jest częścią tego tematu, właściciel wprost potwierdził że ten wymóg jest OK ("rozumiem
   dwie cywilizacje muszą ze sobą graniczyć to jest okej" — UWAGA: to sformułowanie właściciela
   jest nieprecyzyjne, cywilizacje NIE muszą dziś fizycznie graniczyć, muszą mieć pokój+Umowę
   Handlową+jakąkolwiek fizyczną ścieżkę (teraz bez limitu długości) — nie zmieniaj tego
   wymogu, ale zanotuj w raporcie że to sprostowanie, nie nowe kryterium).

KRYTERIA KOŃCA (binarne)
1. Test: dwie stolice na PRZECIWLEGŁYCH krańcach mapy "superogromny" (dystans lądowy rzędu
   600+ heksów, fizycznie przechodni teren), z pokojem i aktywną Umową Handlową — trasa
   handlowa POWSTAJE (connected=true), tam gdzie dziś (przed zmianą) connected=false.
2. Test: istniejąca, bliska para miast (dystans ≤12 lądem / ≤20 morzem, tak jak dziś) — dochód
   z trasy BAJT-IDENTYCZNY z wartością sprzed zmiany na tym samym dystansie (zero regresji
   balansu dla typowego gameplayu).
3. Test: nowa, daleka para (dystans >12 lądem / >20 morzem) — dochód z trasy RÓWNY SZCZYTOWI
   (40), nie zerowy i nie ekstrapolowany powyżej szczytu.
4. Test wydajnościowy: na mapie "superogromny" z realistyczną liczbą cywilizacji/miast (dobierz
   sensowną liczbę, uzasadnij), zmierz i porównaj PRZED/PO czas wykonania `refreshTradeRoutes`
   przy PIERWSZYM kontakcie dyplomatycznym (najgorszy przypadek, zero trafień w cache) —
   udokumentuj wynik w raporcie; jeśli regresja jest znacząca (rząd wielkości), zaimplementuj
   tani wstępny filtr z GOAL 2 i zmierz ponownie.
5. Fizyczna nieosiągalność NADAL blokuje trasę: dwie stolice na RÓŻNYCH kontynentach/wyspach
   bez Portu w żadnym z miast — connected=false (zero zmiany — to nie jest limit dystansu,
   tylko realna geografia, właściciel wprost to zaakceptował: "dwie cywilizacje muszą ze sobą
   graniczyć").
6. Zero regresji na istniejących testach handlu (znajdź reconem, min. `trade-routes-test.cjs`,
   `trade-routes-income-test.cjs`, `cuda-handel-test.cjs`, oraz wszystkie inne
   `*trade*`/`*handel*-test.cjs` w `gra/tools/`) — zaktualizuj testy 1-2 wprost testujące stare
   progi 12/20 jako próg BLOKUJĄCY (zamień na test fizycznej osiągalności/dochodu wg GOAL 3),
   nie usuwaj bez zastąpienia równoważnym pokryciem.
7. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/game/trade-routes.ts — WYŁĄCZNIE: `computeCityConnection`, `multiSourceBfs`,
  `DEFAULT_TRADE_ROUTE_PARAMS`, `DEFAULT_TRADE_ROUTE_INCOME_PARAMS`, `loadTradeRouteParams`,
  `loadTradeRouteIncomeParams`, `tradeRouteDistanceIncome`, `diagnoseMissingTradeRouteForPartner`,
  `BFS_RADIUS_MULT` i bezpośrednio powiązane typy/komentarze.
- gra/data/econ-params.json — WYŁĄCZNIE blok `handel_szlaki` (wartości i pola `opis`).
- Zaktualizowane/nowe testy w gra/tools/*-test.cjs (w tym wymienione w KRYTERIUM 6).
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana wymogu
pokój+Umowa Handlowa (GOAL 6), zmiana `refreshTradeRoutes`/`citiesHaveTradeConnection` poza
minimalnym podłączeniem (jeśli w ogóle konieczne — uzasadnij w raporcie), zmiana logiki
budynków handlowych/`tradeRouteLimitForCity`/`budynekOdblokowany` (poza zakresem tego tematu),
zmiana `clusters.ts`/generatora map.

IZOLACJA
worktree /home/user/wt-handel-szlaki-limit-dystansu, gałąź
autobot/R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1, baza jawnie: origin/main (najnowszy commit na
moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-handel-limit --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 1/4 za spełnione bez żywego testu `generateMap` na rozmiarze
"superogromny" (nie mniejszym) z realną parą miast na przeciwległych krańcach — nie zakładać
wyniku z samej lektury kodu. Zakaz uznania kryterium 2/3 (balans dochodu) za spełnione bez
bezpośredniego porównania wyniku `tradeRouteDistanceIncome` PRZED/PO na tych samych dystansach
wejściowych. Zakaz pominięcia pomiaru wydajnościowego z kryterium 4 — "powinno być szybkie" bez
faktycznego zmierzonego czasu nie wystarcza, biorąc pod uwagę że recon orkiestratora wprost
zidentyfikował to jako realne ryzyko (utrata taniego O(1) odsiewu przed BFS).

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora, ręką
orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora → READY_FOR_DEPLOY.
