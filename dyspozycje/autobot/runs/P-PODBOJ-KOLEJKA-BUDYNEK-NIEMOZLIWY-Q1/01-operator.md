# P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1 — 01-operator (RUNDA 1/5)

STATUS: PASS
DOMAIN: GAME
TEMAT: P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1
GOAL: W obu miejscach przejęcia miasta (`main.ts`, podbój bojowy i kapitulacja głodowa),
po istniejących `sanitizeBuildQueue`/`sanitizeProductionQueue`, usunąć z kolejki budynki
`lokalizacja:'stolica'` niemożliwe do dokończenia przez zdobywcę (bo miasto nie jest jego
stolicą), zwracając zebraną Pracę do puli ZDOBYWCY (osobna linia, `oldOwner` dla legacy
jednostek nietknięty).

## WERYFIKACJA PRZED EDYCJĄ (grep)
- `git log -1`: `9f90cea7...` (dyspozycja), baza worktree zgodna z izolacją.
- `grep -n '"lokalizacja"[[:space:]]*:[[:space:]]*"stolica"' gra/data/buildings.json` →
  4 trafienia: linie 829 (mennica), 1086 (palac), 1126 (palac_ii), 1170 (palac_iii) —
  potwierdzone odczytem `id` każdego bloku. Zgadza się z listą w dyspozycji.
- `grep -n "setOwnerPracaPool(oldOwner" gra/src/main.ts` → dokładnie 2 wystąpienia,
  13386 i 26933 — DOKŁADNIE te dwie linie NIE zostały ruszone.
- `grep -n "sanitizeBuildQueue\|sanitizeProductionQueue" gra/src/main.ts` → potwierdzone
  wywołania w obu blokach zgodnie z opisem dyspozycji (linie przesunięte o ~1 wobec
  dyspozycji, jak przewidziano).
- `capitalCityIdForOwner` (main.ts ~26053) i oba bloki (13382, 26921 przed edycją) leżą
  w TEJ SAMEJ funkcji nadrzędnej main.ts (hoisting `function` w JS) — potwierdzone brakiem
  zamknięcia funkcji między nimi (`awk` po `^  function`/`^    function` do 13382 pokazuje
  ciągłość zagnieżdżenia, brak `^function ` między 121 a 1402).

## REGUŁA PRZECIW SAMOOSZUKIWANIU — brzegowy przypadek nowej stolicy
Sprawdzone czytaniem kodu (nie zgadywaniem): w obu blokach `city.ownerId` jest już
ustawiony na zdobywcę PRZED naszym filtrem (kapitulacja: `city.ownerId = newOwner;`
~57 linii wcześniej w tej samej funkcji; podbój: `applyCityCaptureAfterBattle` ustawia
właściciela i woła `onOwnerChanged` PRZED blokiem `if (isBarbarian(atkOwner)) {...} else
{...}`). Więc `capitalCityIdForOwner(zdobywca)` w chwili filtra widzi już to miasto jako
NALEŻĄCE do zdobywcy — jeśli to jego jedyne/najstarsze miasto, `capitalCityIdForOwner`
zwraca `city.id` i filtr poprawnie NIE usuwa budynku. Udowodnione TESTEM (nie założeniem):
nowa bramka, scenariusz B dla wszystkich 4 budynków × oba bloki = 8 zielonych asercji na
dokładnie ten przypadek + dowód nie-tautologiczności (mutacja `isSurrenderNewCapital = false`
w main.ts → 13 czerwonych asercji dokładnie w tym miejscu, przywrócone diffem po teście).

## ZMIANY/COMMIT
- `gra/src/main.ts`:
  - Blok kapitulacji głodowej (`const prodSurrender = cityProd.get(city.id);` …, było
    13382-13389): dodano `isSurrenderNewCapital = capitalCityIdForOwner(newOwner) === city.id`
    i `filterQueue` po `sanitizeProductionQueue`, z nową linią
    `setOwnerPracaPool(newOwner, ownerPracaPool(newOwner) + forfeitedCapitalOnlySurrender)`.
  - Blok podboju bojowego (`const prodCapture = cityProd.get(city.id);` …, było
    26921-26937, gałąź `else` obok `isBarbarian`): analogicznie z `atkOwner`.
  - Linie `setOwnerPracaPool(oldOwner, ...)` (13386, 26933) NIETKNIĘTE.
  - Żadna inna linia main.ts nie zmieniona (brak nowych importów — `filterQueue`,
    `sanitizeBuildQueue` już importowane; `data`, `capitalCityIdForOwner`,
    `setOwnerPracaPool`/`ownerPracaPool` to lokalne zmienne/funkcje już w zasięgu).
- `gra/src/game/production.ts`: BEZ ZMIAN — pomocnicza funkcja okazała się zbędna
  (`buildingLocationAllowed` liczy od `isCapital: boolean`, a naszemu filtrowi wystarczy
  bezpośrednio `data.buildings.find(b => b.id === item.id)?.lokalizacja !== 'stolica'` +
  `capitalCityIdForOwner`, dokładnie jak żąda GOAL punkt 1-2 — unikanie zbędnego importu
  było ważniejsze niż DRY z buildingLocationAllowed, allowlista i tak dopuszczała
  "tylko jeśli potrzebna").
- Nowa bramka: `gra/tools/podboj-kolejka-budynek-niemozliwy-test.cjs` (uzasadnienie
  wyboru nowego pliku zamiast rozszerzenia: `building-queue-refund-test.cjs` testuje inny
  temat — zwrot `koszt_surowce`, nie Pracy przy przejęciu miasta; żadna istniejąca bramka
  nie wycina tych dwóch konkretnych bloków main.ts). Wzorzec: `road-hook-mainguard-test.cjs`
  — wycina PRAWDZIWY tekst obu bloków + `sanitizeProductionQueue` z main.ts (brace-matching
  po sygnaturze/kotwicy, nie po numerze linii), transformuje TS→JS (esbuild) i wykonuje
  NAPRAWDĘ przez `new Function` z atrapami TYLKO dla wolnych zmiennych domknięcia
  (`cityProd`, `data`, `capitalCityIdForOwner`, `setOwnerPracaPool`/`ownerPracaPool`,
  `parseWonderProdId`/`wonderGateOk` — cuda poza zakresem, stub bezpieczny bo nasze id
  budynków nie mają prefiksu cudu). `sanitizeBuildQueue`/`filterQueue` to PRAWDZIWE
  eksporty z production.ts (bundle esbuild), nie atrapy.
- Commit w worktree: patrz `git log` po tym raporcie (main.ts + nowa bramka + ten raport,
  BEZ `git add -A`).

## TESTY
- Nowa bramka `node tools/podboj-kolejka-budynek-niemozliwy-test.cjs`: **69 passed, 0
  failed** — oba bloki (kapitulacja, podbój) × wszystkie 4 budynki `lokalizacja:'stolica'`
  × scenariusz A (zdobywca ma inną stolicę → usunięty + Praca do puli ZDOBYWCY, stary
  właściciel dostaje 0) i scenariusz B (miasto = nowa stolica zdobywcy → ZOSTAJE, zero
  zwrotu) + kontrola legacy-jednostka (Praca nadal do `oldOwner`, zero regresji) + kontrola
  budynku nie-stolica (nietknięty niezależnie od stolicy zdobywcy).
  DOWÓD NIE-TAUTOLOGICZNOŚCI: mutacja `isSurrenderNewCapital = false` w main.ts →
  13/69 czerwone dokładnie na scenariuszu B (mennica/palac/palac_ii/palac_iii ×
  {kolejka niepusta, front=id, zero zwrotu}); main.ts przywrócony diffem po teście
  (`diff -q src/main.ts /tmp/main.ts.bak` → identyczny).
- `npx tsc --noEmit` (z `gra/`): **czysto, brak błędów**.
- 5 bramek referencyjnych: `logic-test` 213/213, `tech-tree-test` 19/19,
  `research-test` 33/33, `unit-replace-test` 13/13, `combat-test` 6/6 — wszystkie ZIELONE.
- Cała rodzina bramek produkcji/kolejki/podboju/capital
  (`find gra/tools -iname "*production*" -o -iname "*capture*" -o -iname "*podboj*" -o
  -iname "*capital*" -o -iname "*queue*" -o -iname "*kolejka*"`, pominięte
  `.ps1`/preview/compare bez semantyki testu):
  - `ai-city-capture-integration-test.cjs` 14 OK
  - `ai-production-priority-test.cjs` 9/9
  - `barb-city-capture-cluster-test.cjs` 92 passed, **1 FAIL PRZEDISTNIEJĄCY** (dowód:
    identyczny FAIL na `git stash` do stanu przed moją edycją — snapshot-lock 2h-static
    liczy okno 4000 znaków od `function applyCityCaptureToMap(` do
    `if (isBarbarian(atkOwner))`, offset 6412 znaków IDENTYCZNY przed i po mojej zmianie
    (moje zmiany leżą wyłącznie W GAŁĘZI `else`, PO tym bloku) — nie ja to spowodowałem,
    poza allowlistą tego tematu do naprawy)
  - `building-queue-refund-test.cjs` 2 passed, **3 FAIL PRZEDISTNIEJĄCY** (dowód: identyczny
    FAIL na `git stash` — koszt `stolarnia.koszt_surowce.drewno` w danych ≠ oczekiwanie
    testu, dryf danych niezwiązany z tym tematem, poza allowlistą)
  - `capital-capture-test.cjs` 86/86
  - `capital-sep-pangea-test.cjs` 3/3
  - `capital-sep-unit-test.cjs` 36/36
  - `march-attack-queue-persist-test.cjs` 57/57
  - `panel-kolejka-pasek-postepu-test.cjs` 82/82
  - `post-capture-law-test.cjs` 25/25
  - `production-overflow-test.cjs` 201/201
  - `religia-konwersja-po-podboju-test.cjs` 12/12

## BLOKADY
Dwa przedistniejące FAIL (`barb-city-capture-cluster-test.cjs` 2h-static,
`building-queue-refund-test.cjs`) — zweryfikowane `git stash` jako identyczne PRZED moją
edycją, poza allowlistą tego tematu (production.ts poza `stolarnia`/mennica, main.ts poza
dwoma blokami przejęcia). Nie naprawiane w tej rundzie — zgłaszam do orkiestratora jako
osobny temat, nie blokują tego GOAL.

## RUNDY
1/5

## NASTĘPNY KROK
Evaluator (Sonnet 5, effort high) — weryfikacja allowlisty, testu edge-case (nowa stolica),
regresji legacy oraz dwóch przedistniejących FAIL (potwierdzić niezależność od tego tematu).

## DEPLOY/PUSH
NIE WYKONANO
