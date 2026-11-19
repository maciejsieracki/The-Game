# R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1 — Operator, runda 2/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1
GOAL: gracz objęty wojnami epoki Kamienia/Brązu/Żelaza jak inne cywilizacje; narzędzie pomiarowe wojen epoki; bieg dymny; dług progów testów.
BAZA: ea4863ef0 (kod rundy 1 po Obronie). Zależności: `npm ci --ignore-scripts` w gra/.

ZMIANY-COMMIT: patrz sekcja COMMIT na dole (allowlista: gra/src/main.ts, gra/tools/era-war-defer-not-cancel-test.cjs, gra/tools/era-war-measure-run.cjs, ten raport).

## Co zrobiono w rundzie 2

1. Hak pomiarowy tylko do odczytu `window.__eraWarMeasure` (main.ts, obok `__diploHarderMeasure`): `state()`, `attempts()`, `declarations()`. Dzienniki dopisywane w miejscu przydziału pary i w miejscu faktycznego wypowiedzenia wojny epoki. Nie zmieniają decyzji gry.
2. Runner `gra/tools/era-war-measure-run.cjs` (JSONL poza repo, `--epoch` domyślnie `kamien`, `--wall-limit` s). Hook `__nnsMeasureDebug.startGame` przyjmuje opcjonalne `epochId` (brak = `braz` jak dotąd).
3. Poprawka reguły (main.ts, `eraWarTargetDelayOk`): kandydat-AI do pary z graczem (`playerFirst`) i wolny cel fallbacku musi przejść `eraForcedWarStartTurnsFromEra` od wejścia w SWOJĄ epokę. Dowód z biegu: AI4 wszedł w Żelazo w turze 66 i wypowiedział wojnę Żelaza graczowi w turze 80 (14 tur po wejściu, próg 40). Po poprawce ta wojna nie występuje do tury 83 (koniec biegu).
4. `era-war-defer-not-cancel-test.cjs`: regex asercji `freeTargetCandidates` dopasowany do nowego warunku (asercja nie osłabiona, dodano alternatywę).

## Dane z biegu (seed 4242, start Kamień, gracz AI, bieg po poprawce 4, tury 1–83)

| Epoka | Wypowiedziano | Tury | Napastnicy | Cel = gracz | Uwagi |
|---|---|---|---|---|---|
| Kamień | 3 | t40 (×3) | AI1, AI4, AI7 | 1 (AI4 → gracz) | próg 40 od startu zachowany |
| Brąz | 2 | t79, t81 | AI13 (wejście t38 → +41), AI10 (wejście t41 → +40) | 1 (AI10 → gracz, t81) | pending Brązu od wejścia; odroczenie 40 tur |
| Żelazo | 0 | — | — | — | wejścia w Żelazo: t66–t78 (AI4 t66, AI1 t69, AI10 t69, AI19 t69, AI13 t68, AI16 t72, AI7 t78) |

Zestawienie do dopracowania przez orkiestratora: po poprawce 4 wojny Żelaza nie ma jeszcze w oknie (najwcześniejsza dopuszczalna tura Żelaza = wejście + 40 = t106+), więc wynik „0" jest oczekiwany, nie błąd.

Uwagi do Brązu: pending Brązu jest dodawany tylko przy przejściu Kamień→Brąz (`syncOwnerEraFromResearch`, prev===1 && next===2). Bieg startujący w Brązie (domyślne `braz` w hooku) nie ma tej ścieżki — stąd wcześniejsza próba (seed 4242, start Brąz) dała 0 wojen Brązu, dlatego runner startuje z Kamienia.

## Znalezisko nierozstrzygnięte (do rundy 3): gracz bez zapisanego wejścia w Brąz

Stan końcowy: gracz ma `epoka 2` od tury ~77, a `bronzeEraEnterTurnByOwner.get(0)` jest pusty (`wejscieBrazTura: null`). `isPlayerEligibleForEraWarPool` (war-rules-multiwar.ts ~l.318) przy `eraEnterTurn === undefined` zwraca `true`, więc gracz wchodzi do puli Brązu od razu. Efekt: AI10 → gracz w turze 81 (4 tury po wejściu gracza w Brąz). Nie naprawiono: źródło brakującego wpisu nie zostało jednoznacznie ustalone (ścieżka `reconcilePlayerEraFromResearch`, main.ts ~2729–2744, nie ustawia wpisu, więc prawdopodobnie `prev` już było 2). Bezpieczna poprawka wymaga zapisu wejścia gracza w miejscu faktycznej zmiany `playerStateByHuman(0).era`. Prośba do orkiestratora: osobny temat lub runda 3.

## Testy i bramki (wynik z surowego wyjścia)

- `npx tsc --noEmit`: exit 0 (po każdej zmianie main.ts).
- era-war-player-included-test.cjs: 10 OK / 0 FAIL
- era-war-delays-test.cjs: 55 OK / 0 FAIL
- forced-war-bronze-test.cjs: 48 / 0
- forced-war-iron-test.cjs: 55 / 0
- forced-war-reguly-multi-turn-simulation-test.cjs: 48 / 0
- forced-war-stone-test.cjs: 31 / 0
- era-war-ignore-treaties-test.cjs: 22 pass / 0 fail
- era-war-defer-not-cancel-test.cjs: 28 passed / 0 failed (po poprawce regexu asercji)
- era-war-bronze-player-target-test.cjs: 44 / 0
- forced-war-bronze-main-guard-test.cjs: 22 / 0
- forced-war-iron-main-guard-test.cjs: 35 PASS / 1 FAIL — asercja „finalizePeaceTreatyBetween uzbraja odpoczynek Żelaza" — regex wymaga `ironForceWarRestUntilByOwner.set` w 500 znakach od `cleanupIronForcedWarOnPeace`; rozszerzenie okna do 2000 nie pomogło, więc to brak zapisu w tej funkcji, a nie okno. Przedistniejące (nie dotyczy zmienionych hunków). NIE NAPRAWIONO.
- forced-war-stone-main-guard-test.cjs: 14 PASS / 1 FAIL — analogiczna asercja dla Kamienia (`cleanupStoneForcedWarOnPeace`). Przedistniejące. NIE NAPRAWIONO.
- NIE ZMIERZONO: logic 213, tech-tree 20, research 33, unit-replace 21, combat 6 — skryptów o tych nazwach nie znaleziono w gra/package.json; nie uruchamiano.
- NIE ZMIERZONO: nowy `era-war-engine-scenario-test.cjs` (scenariusz Kamień→Brąz pending→pokój→start przez tor main) — nie napisano; main.ts nie da się wykonać w node bez przeglądarki. Brak mutacji czerwonej.
- NIE ZMIERZONO: seed 7 (120 tur). Seed 4242 dla 120 tur nie przeszedł w jednym wywołaniu Bash (wall-limit, 83 tury); runner nie ma wznawiania, a bieg w tle jest zakazany.
- NIE ZMIERZONO: zachowanie gracza jako celu w Kamieniu przez zwykłą pulę (zarzut 6) — w biegu gracz był celem wojny Kamienia (AI4 → gracz, t40), co potwierdza ścieżkę; test toru nie napisano.

## Bieg dymny — uczciwie

Jeden bieg 4242 po poprawce: 83 tury zarejestrowane, 5 wypowiedzeń, 10 prób przydziału (po poprawce; dane w runs/ poza repo: `era-seed4242.jsonl`). Pełne 120 tur × 2 ziarna NIE ZMIERZONO (limit czasu pojedynczego polecenia; patrz wyżej).

## COMMIT

Commit: patrz wiadomość commita (SHA w polu `sha` wyniku).

BLOKADY: pełny bieg 120 tur (oba ziarna), test silnikowy, czerwone asercje `forced-war-*-main-guard` (przedistniejące), znalezisko gracza bez wejścia w Brąz.
RUNDY: 2/5 (ostatni werdykt FC runda 1: FAIL)
NASTĘPNY KROK: runda 3 — (a) zapis wejścia gracza w Brąz/Żelazo przy każdej zmianie epoki, (b) test silnikowy, (c) bieg 120 tur × seed 4242 i 7 w odcinkach z wznawianiem (zapis stanu lub krótsze tury).
DEPLOY/PUSH: NIE WYKONANO
