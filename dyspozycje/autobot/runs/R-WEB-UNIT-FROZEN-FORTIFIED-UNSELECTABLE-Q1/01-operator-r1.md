STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UNIT-FROZEN-FORTIFIED-UNSELECTABLE-Q1
GOAL: jednostka/armia w stanie fortify/garnizon zawsze wybieralna; laczenie nie propaguje blokady; samoleczenie niespojnych jednostek (gracz i AI ta sama logika).

## Przyczyna pierwotna
`inGarnizon===true` jest legalny tylko na heksie WLASNEGO miasta (enterGarnizon wolane po `cityAtUnit(u).ownerId===u.ownerId`, main.ts akcja fortify). Filtry mapy celowo pomijaja garnizon: `unitAtRepresentative` (armyMerge.ts:454-456), `visibleStackOnHex` (armyMerge.ts:~101). Poza wlasnym miastem flaga jest "sierota": jednostka jest rysowana (`computeStackDisplay` grupuje wg `stackRenderKey` z `|g`), ale klik zwraca `cu===null` (main.ts hit-test mapy po `pickMapTarget`) i czysci selekcje; split/ruch nie widza jej w stosie.
Wejscie w stan: jednostka przesunieta bez `exitGarnizon` - `evictForeignUnitsFromCityHexes` (po zdobyciu miasta), `transferCityByTreaty` (plan.unitMoves, cesja w pokoju); zmiana wlasciciela miasta z garnizonem; stare zapisy.
Propagacja przy laczeniu: main.ts `openMergePanelForSelected` -> `preferGarnizon = all.some(inGarnizon)`; `for (u of all) u.inGarnizon = preferGarnizon` (bez sprawdzenia miasta) oraz `promptMergeIfCoLocated` onMerge `garnizonMode` -> `enterGarnizon(mu)`. Cala armia (np. 27 jedn.) stawala sie niewidoczna i niewybieralna; pula ruchu = min -> 0.

## Zmiany (commit cf0770d5b, bez push)
- gra/src/game/armyMerge.ts: `hasOwnCityAt`, `healUnitStates` (osierocony garnizon -> exitGarnizon; zalegly fortifyRuchSnapshot; zalegle oblegaCityId (opcja siege); licznik duplikatow id - tylko zliczane).
- gra/src/main.ts: `healInconsistentUnits` (log diagWarn 'unit-heal' + window.__unitHealCount) wpiete: klik mapy przed hit-testem, selectPlayerUnit (mapa/lista/panel -> tez wyciaganie/Rozdziel), start tury (przed resetem ruchu), wczytanie zapisu; evict i cesja wolaja exitGarnizon; oba merge-sciezki: garnizon tylko na heksie wlasnego miasta (poza nim laczenie normalizuje flage); hak testowy `__frozenTestDebug` (tylko inscenizacja danych).
- gra/tools/unit-frozen-fortified-unselectable-test.cjs (NOWY).

## Testy
- RED (BASELINE=1, armyMerge.ts z origin/main): A1/A1b odtwarzaja blad (klik=null), A2 FAIL - gate-red-baseline.txt EXIT=1.
- GREEN: pass=43 fail=0 (A jednostkowa 19, B 6 mutacji wywraca A, C 9 strukturalnych, D 8 zywych Chromium: REALNY klik w osierocony garnizon wybiera jednostke; start tury leczy bez klikania; 0 bledow) - gate-full-green.txt.
- tsc --noEmit: 0 bledow.
- Regresje *army*/*merge*/*fortif*/*garnizon*/*select*/*save* (--no-live): PRZED 17 FAIL, PO 17 FAIL, ten sam zbior (juz czerwone na origin/main, niezwiazane: gate-regression-przed.txt / -po.txt). Jedna regresja wlasna (army-merge-separate-return-mainguard-test, marker tekstowy `const garnizonMode = ...;`) wykryta i naprawiona zachowaniem markera: po poprawce 73/73.

## Notatki / NIE_ZMIERZONO
- NIE_ZMIERZONO: pomiar PRZED/PO na >=5 ziarnach x 100+ tur gracza-bota (headless swiftshader: pojedyncza tura = sekundy; nie zmieszczone w limicie). Zastapiony scenariuszem zywym + jednostkowym.
- NIE_ZMIERZONO: zywy RED na bundlu origin/main (hak __frozenTestDebug istnieje tylko po poprawce); RED jednostkowy udokumentowany.
- NIE_ZMIERZONO: nie odtworzono organicznie sciezki wejscia w grze (zdobycie/cesja) - dowod kodowy plik:linia powyzej, scenariusz zainscenizowany hakiem. Inne hipotezy (z-index/pointer-events znacznikow, duplikat id, armiaId) nie potwierdzone; duplikaty id tylko liczone w logu.
- Zalozenie: sierota jest wyprowadzana z garnizonu (nie zamieniana w fortyfikacje w polu); ruch ze snapshotu.
- Nie zmieniono: gra-robocza, WERSJE.md, rust-port. node_modules usuniete.

BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
