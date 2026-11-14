STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-DEFEAT-SURVIVOR-RETREAT-TWO-HEX-Q1
GOAL: ocalali przegranej strony cofaja sie o 2 heksy od zwyciezcy (nie znikaja), z zachowaniem HP/XP/tozsamosci; pole + oblezenie, AI/gracz, manual/auto/Skip.
ZMIANY/COMMIT: kandydat c5dd4a21f5ae40231bf2de093013139268ce53e4 (potomek bazy 261e736de: `git merge-base --is-ancestor` = tak; w origin/main jeszcze go nie ma). Diff: battleScene.ts, post-battle-map.ts, 4 pliki gra/tools (nowy test, harness Chromium x3, battle-undeployed-units-test.cjs), raporty. Allowlista dispatchu: bez naruszen (bez WERSJE.md, gra-robocza). FC zmienia tylko ten raport.

WERDYKTY PER ZARZUT (zarzuty Evaluatora)
1 ODDAL: wipeDefenderOnCityCenter to istniejaca regula garnizonu/ostatniego miasta; dispatch nakazuje ja zachowac bez jawnego override wlasciciela. Opisac w raporcie koncowym jako znany edge case (ewentualnie ABC), nie blokuje.
2 ODDAL: testy jednostkowe 12/13 pokrywaja miasto, cityOnBattleHex, oblegaCityId i cudze miasto; harness Chromium prowadzi prawdziwa bitwe 3D + applyPostBattleMap. Przejscie przez main.ts poza allowlista.
3 ODDAL (juz naprawione w c5dd4a21f): oblegajacy trafiaja do retreatNoTwoHexRouteIds.
4 ODDAL (ZALOZENIE): rezerwa przegranych cofa sie ze stosem (u.q===9, hp===100) -- zgodne z GOAL (stos przegranych cofa sie o 2 heksy); kontrakt "rezerwa nie ginie" zachowany. Wymaga tylko wzmianki w raporcie koncowym dla wlasciciela.
5 ODDAL: fallback bez trasy 2 heksow = istniejace zachowanie, zgodne z dispatchem (brak trasy: opisac, nie wymyslac).
6 ODDAL: kod computeInstantResult trywialny (survivors = obie strony), sciezka przechodzi w Chromium bez bledow; mutacja battleScene.ts z bazy czerwieni test Chromium (wg obrony; nie powtarzane).
7 ODDAL: tryb `cap` w Chromium: 28/28 ocalalych przegranych w odleglosci 2 (potwierdzone przeze mnie).

ZNALEZISKA FC (samodzielne, powoduja FAIL)
8 NAPRAW (regresja bramki referencyjnej wzgledem bazy): `node tools/mgla-sciezka-inwariant-test.cjs`
   baza 261e736de: 41 pass / 1 fail (jedyne trafienie: src/main.ts:28778, dlug istniejacy).
   kandydat: 41 pass / 1 fail, ale trafien niesklasyfikowanych JEST 3: dodatkowo
   "src/game/post-battle-map.ts:350 u.q = q2;" oraz ":351 u.r = r2;" (tryTwoHexRetreat).
   Asercja [1] wymaga: nowe miejsce przemieszczenia jednostki => sklasyfikowac w KLASYFIKACJA (z uzasadnieniem)
   albo domknac odkryciem mgly. Cel odwrotu jest 2 heksy od heksu bitwy (poza 1-hex "juz widoczny" z wpisow KROK-1-HEX),
   wiec Operator musi zdecydowac i udowodnic: klasyfikacja (np. DOMKNIETE przez widocznosc/ruch w obrebie
   zasiegu wzroku jednostki) albo odkrycie mgly. Operator nie uruchomil tej bramki (NIE_ZMIERZONO w jego raporcie).
9 NAPRAW (flaky harness Chromium): `node tools/battle-defeat-survivor-retreat-browser-test.cjs`
   2 przebiegi na tym samym kandydacie: #1 FAIL case siege/skip (winner "remis", loserRetreatDistances [2,3,4,1,1,...,1],
   "BROWSER FAIL 1"), #2 BROWSER PASS (wszystkie 4 przypadki). Wynik bitwy jest losowy; asercja nie obsluguje
   REMISU (brak "przegranego"; wg kodu remis = placeFanOutGroup 1 heks + retreatDefendersOnTie, poza zakresem 2 heksow)
   i czerwieni sie niedeterministycznie. Test ma byc deterministyczny (ustalone ziarno/wymuszony zwyciezca w siege)
   albo poprawnie rozrozniac remis (asercje tylko dla zwyciezcy atakujacy/obronca).

TESTY (liczby z surowego wyjscia, kandydat c5dd4a21f)
- tsc --noEmit: 0 bledow (brak wyjscia, exit 0)
- battle-defeat-survivor-retreat-two-hex-test: 39 pass / 0 fail
- battle-undeployed-units-test: PASS=35 FAIL=0
- post-battle-map-test: 32 pass / 0 fail
- siege-defenders-test: 12 ok / 0 fail
- oblezenie-siege-lifted-po-bitwie-test: 16 passed / 0 failed
- battle-dead-units-removed-test: PASS
- logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; map-field-battle-test 24/0
- mgla-sciezka-inwariant-test: 41/1 (patrz 8; baza tez 41/1, ale kandydat dodaje 2 nowe niesklasyfikowane zapisy pozycji)
- Chromium (HTTP przez Vite, chrome-linux 1194): run1 FAIL (siege/skip remis), run2 PASS (field/skip dystanse 2, siege/skip 25/25 w dystansie 2, field/instant 0 ocalalych przegranych, field/cap 28/28 w dystansie 2)
- NIE_ZMIERZONO: przeplyw przez main.ts, save-load po odwrocie w realnej grze, battle-skip-equals-auto-resolve.

BLOKADY: brak infrastrukturalnych.
RUNDY: 1/5 (Operator r1 + obrona r1 + FC); nastepna: runda 2 do TEGO SAMEGO ID.
NASTEPNY KROK: Operator r2 (ten sam ID, baza c5dd4a21f): (a) sklasyfikowac/domknac zapisy post-battle-map.ts:350-351 w gra/tools/mgla-sciezka-inwariant-test.cjs z uzasadnieniem (dodac plik do allowlisty rundy) albo domknac odkrycie mgly i wykazac, ze bramka ma 41/1 z jedynym trafieniem main.ts:28778 jak baza; (b) usunac niedeterminizm harnessu Chromium (remis/ziarno), przebieg powtorzyc min. 3x; (c) ponownie FC.
DEPLOY/PUSH: NIE WYKONANO
