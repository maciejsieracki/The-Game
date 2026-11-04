# Pomiar PRZED (origin/main 319a84052)

Miejsca z definicją „przy rzece” (irygacja):
1. `gra/src/map/improvement-build.ts` `createQualifier().isRiverAdjacent` — własne rzeka.obecna LUB riverPaths (heks/sąsiad); sąsiad z samym rzeka.obecna TYLKO gdy flaga `visibleRiverNeighborCountsForIrrigation` (ustawiana wyłącznie przez picker).
2. `gra/src/game/auto-improvements.ts` `onRiverHex` (= hasRiverAccess || sąsiad z rzeka.obecna) — E1–E3. `hasRiverAccess` (tartak/obóz, riverPaths-only) i `foodReservedHex` (+jezioro) ZOSTAJĄ bez zmian (inna reguła, nie irygacja).
3. `gra/src/ui/hexContextTooltip.ts` `hexHasRiverAccess` + lokalna kopia `buildRiverHexSet` + `HEX_NEIGHBOR_OFFSETS` — sąsiad TYLKO przez riverPaths.
4. `gra/src/main.ts` `civTestOnRiver` (hook diagnostyczny ?civTest=1) — już zgodny z definicją automatu; poza allowlistą, bez zmian.
5. AI: korzysta z `pickAutoImprovements` (ten sam kod co gracz) — brak osobnej definicji.

Pomiar (`tools/irrigation-river-definition-unify-test.cjs`, światy pangea/continents/islands x ziarna 1,7,778899, mapa 36x28):
- płaskich heksów 2445; heksów, gdzie stara ręczna definicja odmawia, a automat buduje: 179 (7,3%).
- PRZED (gate-red.txt): tooltip != definicja na 179 heksach; kwalifikator ręcznej budowy != definicja na 11 heksach próbki wokół miasta.
- PO: różnic 0 / 0.

Wybrane testy `river-*` (map-continents-rivers, medium-river, pangea-river-interior, river-density, river-grid-coverage, river-loop, river-map-scale, river-path-adjacency, river-sea-buffer, river-yield-both-sides) dawały TIMEOUT 270 s w równoległym przebiegu PRZED; żaden nie importuje zmienionych modułów (grep) — PO: NIE_ZMIERZONO (niezmieniony kod, brak zależności).
Niezależne, istniejące porażki PRZED i PO: dyplo-warunek-niespelniony (1), heks-panel-tooltip-warstwa (1), hex-tooltip-mozliwe-ulepszenia-zloze (1: oboz_lowiecki), improvement-build-highlight-lifecycle-live (ENOENT /workspace, infra).
