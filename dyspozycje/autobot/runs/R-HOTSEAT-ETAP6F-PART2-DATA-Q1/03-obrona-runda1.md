STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6F-PART2-DATA-Q1

OBRONA:

1. → **PRZYJMUJĘ.** Zarzut trafny. `pickSecondHumanStartHex` (gra/src/map/cluster-spawn.ts)
filtrował kandydatów wyłącznie po terenie i dystansie od `primaryHex`, nigdy nie sprawdzając
kolizji pozycji z miastami AI/zarezerwowanymi slotami tego samego planu. Naprawa: dodano
opcjonalny parametr `occupiedHexes` — kandydaci bliżej niż `minDistance` od którejkolwiek
zajętej pozycji są wykluczani (ten sam próg co dystans od gracza 1, promień a nie punktowy
test). `buildClusterStartPlan` (gra/src/game/cluster-start.ts) przekazuje zaakceptowane
`aiStartHexes` + `spawnPlan.pendingSameTypeRivalHexes` jako `occupiedHexes` — dokładnie ten
sam zbiór pozycji, którego wzajemny dystans generator już pilnuje (`acceptedForDistance`).
Domyślnie pusta lista = no-op dla wołających sprzed naprawy. DOWÓD: nowy test w
`hotseat-etap6f-part2-data-test.cjs` (40 seedów × 3 tryby = 120 planów) → 0 dokładnych
kolizji, 0 przypadków < próg dystansu (wcześniej Evaluator zmierzył 8/180 kolizji dokładnych
na analogicznym skrypcie).

2. → **BEZ ZMIANY W TEJ RUNDZIE** — zgodnie z NASTĘPNYM KROKIEM raportu Evaluatora, Zarzut 2
jest jawnie odłożony "do decyzji Final Control", nie wymaga naprawy Operatora w rundzie 2.
Nie zmieniałem `main.ts`/`applyClusterStartPlan` w tej rundzie.

ZMIANY:
- `gra/src/map/cluster-spawn.ts` — `pickSecondHumanStartHex` przyjmuje `occupiedHexes:
  ReadonlyArray<{q,r}>` (domyślnie `[]`), filtruje kandydatów wg minDistance od każdej zajętej
  pozycji.
- `gra/src/game/cluster-start.ts` — `buildClusterStartPlan` buduje `occupiedHexes` z
  `aiStartHexes` + `spawnPlan.pendingSameTypeRivalHexes` i przekazuje do
  `pickSecondHumanStartHex`.
- `gra/tools/hotseat-etap6f-part2-data-test.cjs` — nowa sekcja 7: regresja kolizji pozycji na
  40 seedach × 3 trybach.
- Commit: `1b09c008` na gałęzi `autobot/R-HOTSEAT-ETAP6F-PART2-DATA-Q1` w worktree
  `/home/user/wt-6f-part2-data` (rodzic `da96a653`).

TESTY:
- `tsc --noEmit`: 0 błędów.
- `node tools/hotseat-etap6f-part2-data-test.cjs`: 24/24 PASS (18 poprzednich + 6 nowych z
  sekcji kolizji).
- 5 bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33, unit-replace
  13/13, combat 6/6 — wszystkie zielone.
- Regresje wskazane w dispatchu: `hotseat-etap6f-start-migracja-test` PASS,
  `hotseat-human-owners-test` 29/29, `hotseat-etap5-no-leak-test` A=PASS/B=PASS.
- `cluster-start-test.cjs` (nie na liście regresji tego tematu, nie w allowlist obrony): 396
  passed / 19 failed — **identyczny** wynik i identyczny zbiór FAIL (zdiffowany bit-w-bit)
  uzyskany na bazowym stanie (moje zmiany zastashowane, `git stash`/`git stash pop`
  potwierdzone) — dowód zero regresji.

NASTĘPNY KROK: Final Control — potwierdzić naprawę Zarzutu 1 i zdecydować o Zarzucie 2
(NAPRAW teraz vs. świadome odłożenie do R-HOTSEAT-ETAP6F-PART2-UI-Q1).
DEPLOY/PUSH: NIE WYKONANO
