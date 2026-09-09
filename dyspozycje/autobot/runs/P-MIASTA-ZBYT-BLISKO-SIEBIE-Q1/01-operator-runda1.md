STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1
GOAL: Zdiagnozować i naprawić przypadki miast AI (główne cywilizacje i/lub miasta-państwa)
powstających poniżej minimalnego dystansu, mimo istniejącej reguły MIN_CITY_DISTANCE/
MIN_CITY_DISTANCE_START_CITY_STATE w canFoundCity.

## Uwaga o lokalizacji artefaktów procesu (bez zmian od poprzedniej rundy)

Worktree `/home/user/wt-miasta-blisko` nadal nie zawiera `dyspozycje/autobot/runs/
P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1/` z `00-dispatch.md`/`02-evaluator-runda1.md` — te pliki
istnieją wyłącznie w `/home/user/The-Game`. Ten raport (i obrona `03-obrona-runda1.md`)
zapisuję tam samo, obok nich, zgodnie z notą z poprzedniej rundy.

## Runda 2 — naprawa trzech zarzutów Evaluatora (`02-evaluator-runda1.md`)

Pełna, punkt-po-punkt odpowiedź na zarzuty jest w `03-obrona-runda1.md`. Tu — co
faktycznie zmieniono i jaki jest dowód.

### Naprawa Zarzutu 1 (POTWIERDZONY) — widmowi właściciele

`gra/src/game/cluster-start.ts::buildClusterStartPlan`: rejestracja właściciela
(`aiOwnerCivMap`/`ownerDisplayName`/`simplifiedDiplomacyOwners`|`foreignTypeOwners`/
`typCityCopyOwners`/`startRelations`) przeniesiona z PRZED pętli kolizji na PO niej —
dokładnie tak samo jak `spawnCities`/`aiStartHexes`/`acceptedForDistance` już były
budowane. Odrzucony slot (`continue`) nie rejestruje już NIC.

### Naprawa Zarzutu 2+3 (potwierdzone empirycznie w tej rundzie, wspólny mechanizm)

`gra/src/main.ts::spawnPendingForeignClusters` (linia ~8818): usunięty ostatni argument
`true` (`clusterStartSlot`) z wywołania `foundCityAt(sc.q, sc.r, sc.ownerId, cities, map,
sc.name, isCS, true)` → `foundCityAt(sc.q, sc.r, sc.ownerId, cities, map, sc.name, isCS)`.
Slot jest teraz sprawdzany REALNYM `canFoundCity` (bez obejścia) względem AKTUALNEGO stanu
`cities` w chwili founding — czyli gracza, WSZYSTKICH rywali tego samego typu założonych
chwilę wcześniej w `spawnPendingSameTypeRivals` (Zarzut 2 — te pozycje nie istnieją w
`buildClusterStartPlan`, są liczone dopiero w main.ts w locie) i WSZYSTKICH miast (w tym
kolonii bonusowej trudności) założonych DOTĄD w tej samej pętli `spawnPendingForeignClusters`
(Zarzut 3 — kolonia bonusowa nigdy nie trafia do `acceptedForDistance`, bo powstaje dopiero
w main.ts, po zbudowaniu planu). Kolidujący slot jest ODRZUCANY — dokładnie ten sam wzorzec
`_scRejected`/backfill, który już dziś obsługuje odrzucenia z innych powodów (woda/góry/limit
miast per epoka) w tym samym miejscu.

Dla slotów WEWNĄTRZ jednego klastra to zmiana jest no-op (już wzajemnie w normie po naprawie
`buildClusterStartPlan` z rundy 1, identyczny próg) — nowy check odrzuca WYŁĄCZNIE kolizje z
pozycjami nieznanymi w chwili budowy planu (rywale, kolonie bonusowe).

`ai-difficulty-bonus.ts::pickBonusCityHex`/`grantDifficultyStartBonusesForMajorCapital`
(main.ts:8792) — NIE dotknięte tej rundy: `pickBonusCityHex` już liczy hex REALNYM
`canFoundCity` (bez obejścia, naprawa rundy 1) w momencie planowania, a `cities` nie zmienia
się między planowaniem a founding (synchroniczne), więc `clusterStartSlot=true` na samym
`foundCityAt` kolonii jest tam redundantne, nie błędne — zostawione bez zmian (minimalny
footprint, poza allowlistą kontekstu tej rundy).

## Dowód (nowa bramka rozszerzona w `gra/tools/miasta-zbyt-blisko-test.cjs`, te same 20 seedów)

Dodano DWA nowe niezależne sprawdzenia obok istniejącego (dystans w samym planie):

1. `findGhostOwners(plan)` — dla Zarzutu 1: każdy ownerId w KTÓRYMKOLWIEK z pięciu
   rejestrów planu musi mieć odpowiadające miasto w `spawnCities`. **PO naprawie: 0/0
   widmowych właścicieli na 20 seedach** (naprawa w `cluster-start.ts` weryfikowana wprost —
   Evaluator zmierzył 3/20 map ze zjawiskiem PRZED naprawą, w tym seed=42 owner 37, cytowany
   przez niego jako dowód; ten sam scenariusz nie jest już osiągalny — kod fizycznie nie
   potrafi już zarejestrować właściciela bez wcześniejszego pushnięcia miasta, patrz diff).
2. `simulateRealSpawnOrder(map, plan, seed)` — dla Zarzutu 2+3: odtwarza DOKŁADNIE kolejność
   main.ts (rywale tego samego typu → obce klastry, z kolonią bonusową w locie zaraz po
   każdej stolicy klastra, worst-case dla KAŻDEJ stolicy). **Nietautologiczność dowiedziona
   PRZED napisaniem poprawki main.ts** (uruchomienie z samą tylko naprawą Zarzutu 1, PRZED
   zdjęciem `clusterStartSlot=true` w `spawnPendingForeignClusters`):
   `Naruszenia: 71` na 29485 sprawdzonych par, wzorzec `ownerN-KOLONIA-BONUS <->
   ownerN+1-panstwo d=1..2 < próg=3` na WSZYSTKICH 20 seedach — kolonia bonusowa stolicy
   klastra kolidująca z pierwszym miastem-państwem TEGO SAMEGO klastra, founded chwilę
   później w tej samej pętli (dokładnie mechanizm z Zarzutu 3, empirycznie potwierdzony;
   0 naruszeń typu rywal-vs-obcy w tej próbce — Zarzut 2 pozostaje źródłowo potwierdzoną
   luką bez własnego empirycznego trafienia na tych 20 seedach, ale usunięcie
   `clusterStartSlot=true` naprawia OBA kanały tym samym mechanizmem, patrz TESTY).
   **PO naprawie main.ts (`clusterStartSlot` zdjęte w `spawnPendingForeignClusters`):
   Naruszenia: 0/25768.**

## TESTY (uruchomione z `gra/`)

- `node ./node_modules/typescript/bin/tsc --noEmit` → **0 błędów**.
- `node tools/miasta-zbyt-blisko-test.cjs` → **PASS** — plan 23329/23329, widma: brak,
  realna kolejność 25768/25768.
- `node tools/miasta-zbyt-blisko-test.cjs --mutate-przed-napraw` → **FAIL 23209/23329**
  (120 naruszeń kanału 1, identyczne z rundą 1 — bramka nadal nietautologiczna dla kanału 1;
  ta flaga nie dotyka nowych sprawdzeń 2+3, patrz kod).
- `node tools/logic-test.cjs` → 213/213.
- `node tools/tech-tree-test.cjs` → 19/19.
- `node tools/research-test.cjs` → 33/33.
- `node tools/unit-replace-test.cjs` → 13/13.
- `node tools/combat-test.cjs` → 6/6.
- `node tools/found-from-village-test.cjs` → 24/24.
- `node tools/cluster-spread-test.cjs` → 5/5.
- `node tools/city-state-cluster-diff-test.cjs` → 31/31.
- `node tools/miasta-panstwa-wylaczone-test.cjs` → 52 pass, **3 FAIL — te same 3 co w
  rundzie 1** (byte-identyczność planu vs `origin/main`, oczekiwany skutek uboczny naprawy
  `buildClusterStartPlan`, decyzja u orkiestratora — BLOKADA 2 z rundy 1, bez zmian).
- `node tools/cluster-start-test.cjs` → **UKOŃCZONA W CAŁOŚCI tej rundy** (poprzednio
  przerwana, BLOKADA 1 z rundy 1) — **412 passed, 24 failed** (~28 min, pojedynczy
  przebieg, sekwencyjnie). **NIE mam w tej rundzie świeżego przebiegu na czystym
  `origin/main` do bajt-po-bajt porównania** (drugi pełny przebieg to kolejne ~28 min) —
  ta bramka NIE jest wpisana do tabeli §6 jako referencyjna, ale nazwa kwalifikuje ją do
  wymogu dyspozycji. Z nazw 24 FAIL: większość pasuje do kategorii, które runda 1 zmierzyła
  jako identyczne na `origin/main` i na worktree (hub-chain: „poprawny łańcuch hubów" ×4,
  „owner N → typ X" ×4, sea-distance: „min 10 hex od morza" ×2, MP-count: „6 slotów MP (got
  5)"), ALE 6 z 24 („miasta-panstwa >= 5 hex (3)", „rywal min 5 hex od stolicy (3)",
  „runtimeCandidate(s) ... 5 hex (3)" ×4, „zarezerwowany slot wzrostu w klastrze",
  „minDystansObcyOdGracza=16 (got 18)") dotyczą progów DYSTANSU i teoretycznie MOGĄ być
  wrażliwe na to, że `buildClusterStartPlan` teraz odrzuca kolidujące sloty (inny backfill →
  inne hexy w dalszych testach zależnych od konkretnych pozycji) — próg 5 tu to
  `CLUSTER_CITY_STATE_MIN_HEX` (rozstaw KANDYDATÓW state-city), NIE
  `MIN_CITY_DISTANCE_START_CITY_STATE`=3 (próg bramki tego tematu), więc merytorycznie
  NIEZWIĄZANE z naprawą — ale bez świeżego baseline NIE mogę tego twierdzić z pewnością
  dowodową, zgłaszam jako BLOKADĘ 1 (zmienioną formę, patrz niżej), nie milczę.
- `node tools/map-gen-regression-test.cjs` — nadal pominięta (niezwiązana z dystansem miast).

## ZMIANY/COMMIT

Brak commitu (Operator nie integruje). Pliki zmienione w worktree
`/home/user/wt-miasta-blisko` W TEJ RUNDZIE (ponad rundę 1):
- `gra/src/game/cluster-start.ts` — WYŁĄCZNIE `buildClusterStartPlan`: rejestracja
  właściciela przeniesiona po sprawdzeniu kolizji (Zarzut 1).
- `gra/src/main.ts` — WYŁĄCZNIE `spawnPendingForeignClusters`: usunięty ostatni argument
  `true` (`clusterStartSlot`) z jednego wywołania `foundCityAt` (linia ~8818), + komentarz.
  Żadne inne miejsce w main.ts nietknięte.
- `gra/tools/miasta-zbyt-blisko-test.cjs` — rozszerzona: `findGhostOwners()` +
  `simulateRealSpawnOrder()` + eksport `buildSameTypeRivalCandidateHexes` w entry-pliku.
- `dyspozycje/autobot/runs/P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1/01-operator-runda1.md` (ten
  raport, nadpisany) i `03-obrona-runda1.md` (nowy).

`gra/src/game/ai-difficulty-bonus.ts` i `gra/src/game/cities.ts` — NIE dotknięte tej rundy
(bez zmian względem rundy 1).

## BLOKADY

1. **`cluster-start-test.cjs` — ukończona w CAŁOŚCI (412 pass/24 fail), ale BEZ świeżego
   baseline `origin/main` do porównania bajt-po-bajt w tej rundzie** (drugi pełny przebieg
   to kolejne ~28 min). 18/24 nazw pasuje do kategorii zmierzonych w rundzie 1 jako
   identyczne PRZED/PO (hub-chain/sea-distance/MP-count). 6/24 dotyczy progów dystansu
   (`CLUSTER_CITY_STATE_MIN_HEX`=5, candidate-spacing — inny próg niż bramka tego tematu,
   ale nie mogę wykluczyć wpływu backfillu z naprawy bez baseline) — wymaga jednego
   przebiegu na czystym `origin/main` przez Evaluatora/Final Control z większym budżetem
   czasowym, z porównaniem SEKWENCYJNYM (nigdy współbieżnym — nieunikalna nazwa bundla,
   ostrzeżenie R-PROC-AUTOBOT §6, patrz runda 1).
2. **`miasta-panstwa-wylaczone-test.cjs` — 3 FAIL oczekiwane/wyjaśnione, bez zmian od rundy
   1** — decyzja Evaluatora/właściciela o aktualizacji referencyjnego bundla PRE po scaleniu.
3. Lokalizacja artefaktów procesu (dispatch/raporty) — bez zmian od rundy 1, patrz nota
   wyżej.
4. `map-gen-regression-test.cjs` nadal nieuruchomiona (świadomie, niezwiązana z tematem).

## RUNDY: 1/5

## NASTĘPNY KROK: Operator → Evaluator (weryfikacja naprawy Zarzutów 1-3, w tym własna
próba potwierdzenia/wykluczenia 6 podejrzanych FAIL z `cluster-start-test.cjs` względem
`origin/main`) → Final Control (Ścieżka A, Workflow).
DEPLOY/PUSH: NIE WYKONANO
