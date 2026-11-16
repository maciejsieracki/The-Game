# R-WEB-ARMY-SPLIT-BESIEGING-ARMY-NO-SIEGE-LOCK-Q2 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-SPLIT-BESIEGING-ARMY-NO-SIEGE-LOCK-Q2
GOAL: wydzielone przez „Rozdziel” jednostki armii oblegającej NIE są w oblężeniu (bez oblegaCityId, nie liczą się do grup oblegających) i mają normalną pulę ruchu; pozostała część nadal oblega.
BAZA: b160459c9dea67e082ec59dc7770d10cc59c08d4 (origin/main, = FALA 772); worktree `--detach` na tej bazie; czubek pracy = SHA z pola `sha` w wyniku.

## ZMIANY-COMMIT

Allowlista zachowana: `gra/src/game/armyMerge.ts`, `gra/src/main.ts` (punktowo: import + onSplit), `gra/tools/army-split-besieging-no-siege-lock-test.cjs` (nowy), ten raport.

Przyczyna (ZMIERZONO w kodzie): ścieżka `onSplit` (main.ts, ~15883–15990) przesuwa jednostki wydzielone i odejmuje koszt ruchu, ale NIGDY nie czyści `oblegaCityId` ani nie przywraca `ruchLeft`. Wydzielone jednostki zachowują `oblegaCityId` i `ruchLeft = 0` z `commitBesiege`. Skutki: (1) turn-loop (`if (u.oblegaCityId) u.ruchLeft = 0`) zeruje je każdą turę; (2) `besiegeArmyGroups` bierze ich nowe `stackGroupId` (po `assignSharedStackGroupId`) jako grupę oblegającą; (3) `besiegeLockTargets` i `inheritSiegeOnJoin` traktują je jak część oblężenia.

Poprawka:
- `armyMerge.ts`: nowa funkcja `releaseSplitFromSiege(arrivals)` — dla jednostek z `oblegaCityId` kasuje pole i ustawia `ruchLeft = ruch`; zwraca id miasta (lub undefined).
- `main.ts` onSplit: wywołanie `releaseSplitFromSiege(splitArrivals)` PRZED liczeniem `splitMoveCost` (koszt odejmuje się od normalnej puli). Po przesunięciu: jeśli nikt z oblegających nie zostaje przy murze (`!units.some(x => x.oblegaCityId === cityId)`) i miasto jest oblężone → `endMapSiege(cityId)` (istniejąca reguła „brak wojsk przy murze”).
- Reszta armii nie jest ruszana (dalej `oblegaCityId` + `ruchLeft = 0`).

Commit: patrz pole `sha` (commit z kodem i raportem, message z trailerami).

## TESTY

- `tsc --noEmit` (gra/): exit 0, 0 linii wyjścia.
- Nowy test `gra/tools/army-split-besieging-no-siege-lock-test.cjs` (realny armyMerge.ts przez esbuild + sprawdzenie strukturalne main.ts): **PASS 16 / FAIL 0**.
- MUTACJA NA KOPII (`armyMerge.mutant-kopia.ts`, body `releaseSplitFromSiege` wycięte, kopia usunięta po teście): **PASS 8 / FAIL 8** (czerwono: oblegaCityId nie wyczyszczone, ruchLeft [0,0], pula 0, grupy zawierają G-split, reset tury, dołączenie przejmuje 0). Wynik przed/po poprawki dla kryterium (a) — reprodukcja: test A1 pokazuje stan z poprawki-brakiem (oblegaCityId=c1, ruchLeft=0) i jest czerwony wg kryterium; NOTA: A1 symuluje onSplit bez zwolnienia, NIE uruchamia closure onSplit z main.ts (patrz BLOKADY).
- `siege-nearby-lock-join-test.cjs`: **23 OK / 0 FAIL** (po poprawce importu w main.ts; pierwszy przebieg dał 1 FAIL „import helperów” — naprawione przez ustawienie `releaseSplitFromSiege` na końcu listy importu).
- `battle-siege-nearby-units-join-test.cjs`: PASS=14 FAIL=0.
- Bramki referencyjne: `logic-test.cjs` LOGIC OK (213/213) exit 0; `tech-tree-test.cjs` 20 pass 0 fail exit 0; `research-test.cjs` ALL GREEN exit 0; `unit-replace-test.cjs` WSZYSTKIE TESTY ZIELONE (21/21) exit 0; `combat-test.cjs` All sanity checks passed. exit 0.
- `load-game-regression-test.cjs`: 34 PASS / 0 FAIL, exit 0.
- Armia/merge: `army-merge-bounce-test` 4/0, `army-merge-colocated-test` 4/0, `army-merge-separate-return-test` 16/0, `army-merge-stackgroupid-test` 11045/0, `army-merge-dismiss-bounce-test` 16/0 — wszystkie exit 0.
- Siege bez przeglądarki, wszystkie exit 0: city-siege-wall-rules 50/0, map-siege 6/0, oblezenie-remis-endsiege 271/0, oblezenie-siege-lifted-po-bitwie 16/0, oblezenie-test 27/0, siege-ai 17/0, siege-badge-zorder 13/0, siege-blockade-no-recruit-reinforce 57/0, siege-defenders 12/0, siege-engines-built-during-siege 33/0, siege-last-stand-sortie 71/0, siege-manual-battle-behavior 40/0, siege-starvation-duration 27/0, siege-starvation 54/0, siege-storm-needs-machines 18/0, siege-surrender-enter-city 32/0, siege-surrender-forecast 57/0, siege-tower-breach-everywhere 47/0.
- Army split bez przeglądarki: `army-split-movement` 4/0, `army-split-ruch-icons` 7/0, `army-split-enemy-city-block` 14/0 (exit 0).
- `army-split-panel-scroll-grid-test.cjs`: 16 PASS / 2 FAIL (RED-PRE: scrollTop po kliku, brak siatki 3×5). Plik testu dotyczy `ui/armySplitPanel` i CSS, których ta runda NIE zmienia; NIE ZBADANO, czy FAIL istnieje też na bazie (brak uruchomienia na bazie w tej rundzie).
- NIE ZMIERZONO: `siege-map-panel-bottom-clip-1280x800-test.cjs` i `siege-panel-machines-block-fit-test.cjs` — testy przeglądarkowe wymagają argumentu `<dist-dir>` (zbudowanego vite poza repo); nie uruchomiono.
- NIE ZMIERZONO (exit code): `army-split-graphical-hex-picker-test`, `army-split-hex-honeycomb-test`, `army-merge-panel-*` (Chromium) — w tej rundzie nie zebrano kodów wyjścia.
- Test `git diff --check`: OK. Po testach przywrócono plik zrzutu `dyspozycje/autobot/runs/R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1/06-production-robocza-150-percent.png`, który test modyfikuje przy zapisie (w commicie NIE jest).

## BLOKADY

- (e) Żywy bieg w Chromium: NIE ZMIERZONO. Przeglądarka jest (`/usr/bin/chromium`), ale nie zbudowano vite poza repo i nie napisano scenariusza UI (oblężenie → „Rozdziel” → ruch wydzielonej jednostki). Do zrobienia w rundzie 2 (haki `__frozenTestDebug.spawn` z `oblegaCityId` istnieją w main.ts ~28673).
- Test closure onSplit: logika onSplit siedzi w domknięciu `boot()` i nie da się jej wywołać w teście jednostkowym; test B sprawdza strukturę (kolejność wywołań). Zachowanie wykonuje tylko żywy bieg (punkt wyżej).
- (d) Commit regresu: NIE ZMIERZONO dokładnego commita. `git log -S` po całej historii przekroczyło limit 120 s i zostało zatrzymane. Ustalono: `onSplit` nigdy nie czyścił `oblegaCityId` (brak zmian w tym miejscu w 47d53fae0 i 218d7d5cf — `git show ... | grep oblega` w onSplit nie daje trafień). Poprzednia naprawa (47d53fae0/218d7d5cf) przeniosła źródło grup oblegających na `oblegaCityId` (`besiegeArmyGroups`), przez co wydzielone stosy z zachowanym `oblegaCityId` wchodzą do grup. Dokładny bisect do zrobienia w rundzie 2 (wymaga krótszego `git log -S` z pathspec i limitem czasu).
- Dlaczego testy nie wykryły regresu: `siege-nearby-lock-join-test` sprawdza `besiegeLockTargets`/`inheritSiegeOnJoin`, ale nie ścieżkę onSplit; `army-split-*` sprawdzają ruch/koszt/panel, nie pola oblężenia.

## RUNDY

1/5 (Operator, Haiku 5.5). Brak FAIL-i związanych z tematem.

## UWAGI-DLA-ORKIESTRATORA

- Test regresyjny do stałej listy deployu: `gra/tools/army-split-besieging-no-siege-lock-test.cjs` (PASS 16/0; mutacja 8 FAIL).
- Test `army-split-panel-scroll-grid-test.cjs` ma 2 FAIL (RED-PRE) — sprawdzić na bazie, czy to znany dług.
- `siege-map-panel-bottom-clip-1280x800-test.cjs` i `siege-panel-machines-block-fit-test.cjs` wymagają `<dist-dir>` — w deployu uruchamiać z buildem.
- Test przeglądarkowy zapisuje zrzut PNG do repo (`dyspozycje/.../06-production-robocza-150-percent.png`) — przy deployu przywrócić lub nie commitować.

NASTĘPNY KROK: runda 2 (Evaluator): ocena diffu względem tego raportu; opcjonalnie żywy bieg (e) i bisect (d).
DEPLOY/PUSH: NIE WYKONANO
