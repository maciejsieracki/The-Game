STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-PERF-PLACED-IMPROVEMENTS-CACHE-Q1
GOAL: koszt `placedImprovementsForOwner` + zależnych w końcu tury >= 5x niższy w t.70-100 bez zmiany wyników gry.

ZMIANY/COMMIT: baza = origin/main 318c6ecdb (świeży fetch, bez rozjazdu). SHA commitu: patrz ostatnia linia tego pliku (uzupełniona po commicie) / `git log` brancha worktree.
- `gra/src/game/trade-routes.ts`: `VersionedMap` (Map z licznikiem `version`, +1 przy set/delete/clear), `createOwnerImprovementsCache` (cache per właściciel, WALIDOWANY przy KAŻDYM odczycie: licznik wersji mapy + porównanie pole-po-polu węzłów terytorium q,r,pop,ownerId,isFort,isOutpost,order z poprzednim snapshotem; niezgodność = wyrzucenie całego cache; zwrócone mapy nigdy nie są mutowane).
- `gra/src/main.ts`: `placedImprovements` = `VersionedMap`; `placedImprovementsForOwner` idzie przez cache (zwraca `ReadonlyMap`); 3 helpery granta (`placedImprovementsWithBrazTradeGrant`, `placedImprovementsWithTradeGrants`, `hasKopalniaNaZlozuZelazaOrTradeGrant`) przyjmują `ReadonlyMap`; import. Brak cache'u międzyturowego bez walidacji - nie ma TTL ani ręcznej inwalidacji do zapomnienia.
- NOWY test `gra/tools/placed-improvements-cache-q1-test.cjs`; mikro-benchmark `bench-micro.cjs` i logi `gate-*.txt` (z `EXIT=`) w katalogu runa.
Ponieważ cache siedzi w samym `placedImprovementsForOwner`, obejmuje WSZYSTKICH wołających (auto-ulepszanie jednostek, `ownerHasNativeResourceAccess`, availableProduction AI, panele miast, HUD) bez edycji pętli per jednostka. Wołający (21 miejsc) wymienieni grepem; żaden nie mutuje wyniku (tsc z ReadonlyMap to potwierdza).

TESTY:
- tsc --noEmit: czysto (EXIT 0).
- NOWY `placed-improvements-cache-q1-test`: 14 PASS / 0 FAIL: (1) 250 losowych stanów x 3 właścicieli, wynik == referencyjny skan (kopia dawnego algorytmu) wraz z kolejnością kluczy; (2) 1440 mutacji (set/delete/clear ulepszeń, zmiana właściciela/populacji/pozycji węzła, dodanie fortu z `order`, usunięcie węzła) - po każdej wynik == referencja, wcześniej zwrócona mapa nietknięta; (3) 500 odczytów tego samego stanu = 1 skan; (4) 5 mutantów (bez wersji, bez porównania węzłów, bez ownerId, bez pop, licznik nie rośnie w set) - KAŻDY wykryty (test pada); (5) kontrakt źródłowy main.ts.
- Regresja (logi gate-*.txt): trade-grant, zloto-szlak, mennica-uspienie, auto-improvements, autoimprove-irrigation-after-farms, -river-forest-clear-no-citizen-q1-unit, -river-forest-first-q1, -stages-q1, trade-routes (contact-only, hud-filter, income, limit, ownership-income, bazowy), okolica (isworkable-silnik, multi-city-overlap, bazowy, tryb-reset-ownership-change): EXIT=0. (Linie "FAIL" w logach to wyłącznie podsumowania "0 FAIL".)
- Istniejące FAIL niezwiązane z zmianą (potwierdzone na kopii baseline origin/main - identyczne wyniki): `okolica-load-reconcile` 21/23, `okolica-ownership-change-reconcile` 12/15 (testy regexowe źródła o `seedCityOwnerDefaults`; nietknięte przez ten temat).
- `autoimprove-river-forest-clear-no-citizen-q1-test` wymaga ROBOCZA_HTML (bundla) - NIE URUCHOMIONY (brak buildu; zakaz build).
- ai-test: 274 passed, 20 failed (te same liczby co baseline z dispatchu); uwaga: ai-test nie ładuje main.ts, więc nie dowodzi niczego o tej zmianie - dowodem determinizmu jest test równoważności (1)/(2).
- Mikro-benchmark (syntetyczny stan t.~95: 3000 ulepszeń, 70 miast, 8 właścicieli, 1500 wywołań/turę, load avg 3.94, realny `territoryOwnerAt`), 3 przebiegi: PRZED 2618/3039/2974 ms -> PO 23/21/17 ms (x114/x141/x170), wynik identyczny, 8 skanów zamiast 1500.

BLOKADY / NIE_ZMIERZONO:
- NIE_ZMIERZONO: live pomiar t.95 (udział w profilu CPU, czas JS końca tury, 3 przebiegi) - `longrun-100-turns-leak-q1-measure.cjs` to jeden proces 30+ min; zasada procesowa zakazuje tła, a pojedyncze wywołanie foreground ma limit 590 s; skrypt nie ma zapisu/wznowienia stanu. Zamiast tego jest mikro-benchmark (nie jest dowodem na realny udział 14 s z 57 s, tylko na redukcję kosztu samej funkcji >100x).
- NIE_ZMIERZONO: hashe `war-allin-capital-quick` (wymaga bundla/Chromium); argument determinizmu: cache zwraca pole-po-polu ten sam wynik co dawny skan (test równoważności), więc gra nie może się zmienić. Do potwierdzenia przez Evaluatora/FC jeśli mają zasoby.
- Nie ruszano `mAA` osobno: wystarczył cache w funkcji źródłowej. Koszt resztkowy per wywołanie: `buildAllTerritoryNodes()` (alokacja ~miasta) + porównanie węzłów - rośnie z liczbą miast, nie ulepszeń.
- Równoległy R-WEB-PERF-LATE-GAME-LAG-HUD-Q2 (main.ts): hunki lokalne (import, blok funkcji ~5255, 3 sygnatury, jedna linia `placedImprovements`); scalenie na świeżym origin/main - brak rozjazdu w chwili commitu.
- Sprzątanie: usunięto `gra/node_modules` i kopię baseline; brak buildu vite.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (przegląd inwalidacji - zwłaszcza czy istnieją ścieżki mutujące miasta/forty bez zmiany pól podpisu, np. zmiana tylko `level`, nieużywana przez territoryOwnerAt; ewentualny live pomiar t.95 na maszynie z czasem >30 min).
DEPLOY/PUSH: NIE WYKONANO
