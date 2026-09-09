STATUS: FAIL
TEMAT: R-HOTSEAT-ETAP6F-PART2-DATA-Q1
RUNDA: 1/5 (Evaluator) → wymaga rundy 2 Operatora na TYM SAMYM ID/gałęzi

ZARZUTY:

1. **[NAPRAW, potwierdzone empirycznie] `pickSecondHumanStartHex` nie wyklucza kolizji z już
postawionymi miastami AI — narusza dispatch pkt 8(a).** `gra/src/map/cluster-spawn.ts` (nowa
funkcja, ok. linii 429-471) filtruje kandydatów WYŁĄCZNIE po terenie (`landHexesFromMap`) i
dystansie od heksu gracza 1; nie sprawdza w ogóle pozycji `aiStartHexes`/`spawnCities` z tego
samego planu. Napisałem i uruchomiłem niezależny skrypt (bundlujący realny
`buildClusterStartPlan` przez esbuild, 60 seedów × 3 tryby = 180 planów, mapa 50×50,
rywaleNaKlaster=4, aktywneTypy=5): **8 DOKŁADNYCH kolizji heksu drugiego człowieka z
istniejącym miastem AI** (np. `seed=23 daleko hex=(35,43)`, `seed=27 losowo hex=(42,34)`,
`seed=35`, `seed=38`) + kilkadziesiąt przypadków odległości 1-2 heksy od miasta AI. Pierwszy
heks gracza 1 przechodzi rozbudowane bramki (`pickSpawnHexWithCapitalGates` z
`priorCapitals`/`minCapitalSep`/`requirePlayerMassGate`) — drugi heks nie ma ŻADNEJ z tych
bramek, tylko luźny próg `MIN_CITY_DISTANCE_START_CITY_STATE=3` od gracza 1. To nie jest "te
same reguły odległości/terenu co pierwszy" wymagane dosłownie w dispatchu — funkcjonalnie
generator potrafi zwrócić heks zajęty przez istniejące miasto AI. Bramka Operatora (21/21)
tego nie wykrywa, bo asercje sprawdzają wyłącznie dystans od gracza 1, teren i kolizję
ownerId — nigdy kolizję POZYCJI z miastami AI. Lokalizacja naprawy: w allowlistowanym
zakresie (`cluster-spawn.ts` "reguły dystansu/wykluczenia").

2. **[Niska waga, do decyzji Final Control] `NewGameParams.civId2` nie dociera do
produkcyjnego wywołania generatora.** `applyMenuParams()` (main.ts ~34621) tylko loguje
`console.warn` przy duplikacie i nigdzie dalej nie przekazuje `params.civId2`/
`humanDistanceMode`. Produkcyjne wywołanie `applyClusterStartPlan()` w `doStartGame()`
(main.ts:35318) NIE przekazuje `secondHumanCivId`/`humanDistanceMode` z `params` — jedyne
miejsca faktycznie wywołujące generator z drugą cywilizacją to testowe haki
(`__hotSeatTestDebug`, main.ts:23044). Dziś to bezpieczny no-op (civId2 zawsze `undefined`),
ale oznacza, że warstwa danych nie jest w pełni "spięta" end-to-end — to miejsce jest w
allowlist tego tematu ("main.ts — ... + wywołania applyClusterStartPlan"). Mogę zaakceptować
jako świadome odłożenie do pod-tematu UI (skoro i tak żadna ścieżka nie produkuje dziś
realnego `civId2`), ale nie jest to jawnie zgłoszone przez Operatora jako Blokada.

OCENA BLOKAD 1-2 (Operatora): **obie AKCEPTOWALNE, uczciwie ujawnione, nie wymagają NAPRAW.**
Blokada 1: potwierdziłem czytaniem kodu, że kamera (12753), save (22949) i zakładanie
pierwszego miasta (22980) nadal czytają wyłącznie singularny `playerStartHex`, a
`isAwaitingFirstPlayerCity()`/`playerEverOwnedCity` są zaszyte na ownerId=0 — żadna z tych
ścieżek nie jest dziś osiągalna bez UI fotela 2, zgodnie z ABC-Q6. `playerStartHexFor(ME())` w
`currentVisible()` jest FAKTYCZNIE jedynym strażnikiem naprawionym i dokładnie tym wskazanym
w dispatchu (zweryfikowałem numer linii w bazowym commicie: `2c1049b7:main.ts:9864`).
Znalazłem dodatkowo `startRevealKeysForRiverFog()` (main.ts:9976, nietknięte) jako kolejny
konsument surowego `playerStartHex` bez per-owner — ale to mieści się w tym samym, już
ujawnionym zakresie Blokady 1 ("poza jednym strażnikiem"), nie nowy ukryty problem. Blokada 2:
`clusters.ts` (gdzie żyje `computeClusters`) jest POZA allowlistą tego tematu — głębsza
integracja per dispatch pkt 6 dosłownie była NIEMOŻLIWA bez naruszenia allowlisty; warstwa
post-processing jest rozsądnym rozwiązaniem tego konfliktu allowlista-vs-litera dispatchu.

DOWÓD WŁASNEJ WERYFIKACJI: pełny diff przeczytany (5 plików); `git diff --stat` allowlist
zgodny 1:1; `node tools/hotseat-etap6f-part2-data-test.cjs` → 21/21 (realne PASS, sprawdziłem
treść asercji — nie tautologiczne); `tsc --noEmit` → 0 błędów; 5 bramek referencyjnych zielone
(logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6); regresje
zielone (`hotseat-etap6f-start-migracja-test` PASS, `hotseat-human-owners-test` 29/29,
`hotseat-etap5-no-leak-test` A=PASS/B=PASS, żywy Chromium); no-op potwierdzony CZYTANIEM kodu
(jedyne wywołanie produkcyjne `applyClusterStartPlan` w `doStartGame:35318` nie przekazuje
`secondHumanCivId`, więc wszystkie nowe gałęzie martwe na dzisiejszej ścieżce); ABC-Q3
potwierdzone realnym wywołaniem (throw); ABC-Q4 potwierdzone realnym wywołaniem (blisko≈5.0 <
losowo≈15.8 < daleko≈34.5 na 8 seedach operatora + własny test 180 kombinacji); własny
niezależny skrypt kolizji (180 planów, 60 seedów) wykrył Zarzut #1.

NASTĘPNY KROK: Operator, runda 2, TEN SAM ID/gałąź — napraw Zarzut #1 (dodać sprawdzenie
kolizji pozycji drugiego heksu z `aiStartHexes`/`spawnCities`/`pendingSameTypeRivalHexes` w
`pickSecondHumanStartHex` lub jego wywołaniu, plus test regresyjny na kolizję pozycji, nie
tylko dystans/teren/ownerId). Zarzut #2 do decyzji Final Control (NAPRAW teraz albo świadome
odłożenie do `R-HOTSEAT-ETAP6F-PART2-UI-Q1`). Po naprawie: Evaluator ponownie.
