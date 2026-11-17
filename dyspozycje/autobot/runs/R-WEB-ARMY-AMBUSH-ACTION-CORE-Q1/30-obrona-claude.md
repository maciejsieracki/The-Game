# R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 — obrona Operatora, RUNDA 5 (odpowiedź na zarzuty Evaluatora r5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1
GOAL: zamknąć trzy zarzuty Evaluatora z r5 (wyciek zasadzki przez komunikat „Heks zajęty.”, brak testu guardu, niepokryte wpięcie pętli barbarzyńców), bez zmiany zachowania poza tymi trzema punktami; wszystkie bramki zielone z surowym wynikiem.
BAZA: `fbf9482b82147d7903f22d6ee68e8dadb353bf00` (potomek `b14e91e1f`, sprawdzone `git merge-base --is-ancestor b14e91e1f fbf9482b8` = TAK).
KOD OBRONY: `cc719cef025dd61beefaf8913e9d8c68b919f9e0` (detached HEAD worktree wf_89c527b6-f28-3). Raport: commit następny po kodzie.
UWAGA BAZY: `origin/main` nie był ruszany w tej rundzie (brak merge). Ostatnio znany `origin/main` z dispatchu r4 to `6d474b826`; integracja z aktualnym main — do orkiestratora.

## Odpowiedzi na zarzuty Evaluatora (nr jak w zarzutach)

1. PRZYJMUJĘ — poprawka + dowód. Stary guard w `onSplit` (`main.ts`, ~16014) zwracał „Heks zajęty.” dokładnie wtedy, gdy na celu stała ukryta zasadzka wroga, a panel pokazywał ten heks jako wolny. To była wyrocznia. Nowe zachowanie: funkcja `planSplitAgainstHiddenAmbush` (`gra/src/game/ambushMove.ts`) zwraca `kind: 'ambush'` dla ukrytej zasadzki wroga w wojnie na celu; `onSplit` wtedy wywołuje `fireAmbushOnHex(lider stosu, destQ, destR)` i kończy bez nakładania jednostek. Komunikat „Heks zajęty.” usunięty z `main.ts` (wiring: `occ('Heks zajęty.') === 0`).
   - Zastrzeżenie: w bitwie z zasadzki walczy LIDER stosu (ta sama ścieżka co `startAnimatedMove`); pozostała część rozdzielanego stosu zostaje na heksie źródłowym. Czy wszystkie jednostki rozdzielanego stosu powinny dołączyć do bitwy — NIE ZMIERZONO w przeglądarce (decyzja do orkiestratora / osobny temat).

2. PRZYJMUJĘ — poprawka + dowód. Guard z zarzutu 1 został zastąpiony funkcją czystą `planSplitAgainstHiddenAmbush` i ma test dynamiczny: `gra/tools/ambush-split-barb-test.cjs` wywołuje prawdziwy kod `ambushMove.ts` (bundle esbuild). Asercje: ukryta zasadzka w wojnie → `ambush`; pokój → `split`; heks pusty → `split`; własna zasadzka → `split`; zwykła jednostka wroga → `split`.
   - Mutacje na `ambushMove.ts` (każda przez podmianę fragmentu w pamięci; wszystkie FAIL, surowy wynik):
     - S1 (planner wyłączony, zawsze `split`): `FAIL` — „ukryta zasadzka wroga w wojnie na celu = wejscie w zasadzke”.
     - S2 (ignorowanie właściciela i wojny: `u.ambush === true`): `FAIL` — „pokoj: brak wyzwolenia”.
   - Wpięcie w `main.ts` (galąź `if (splitAmbush.kind === 'ambush') {` i wywołanie `fireAmbushOnHex(splitLeader, destQ, destR);`, każde dokładnie 1×) sprawdza `ambush-wiring-test.cjs` (strukturalnie). Usunięcie galęzi = FAIL wiringu.
   - ZASTRZEŻENIE: ciało `onSplit` to domknięcie w `main.ts` bez harnessu DOM; runtime-owa gałąź nie ma testu dynamicznego (tylko strukturalny). NIE ZMIERZONO w Chromium.

3. PRZYJMUJĘ — poprawka + dowód. Pełna trasa barbarzyńcy (`computePath` z mapą zajętości) została przeniesiona do wywołania `planBarbarianStep(units, barb, destQ, destR, computeFullPath, isAtWar)` w `ambushMove.ts`. Funkcja wywołuje `computeFullPath` TYLKO gdy na planszy jest zasadzka (inaczej `null`, bez zmian zachowania). Test dynamiczny (`ambush-split-barb-test.cjs`):
   - przy zasadzce na trasie: `computeFullPath` wołane dokładnie raz, trasa przycięta przed zasadzką (q=1 zamiast celu q=3), `ambushHex = (2,0)`;
   - bez zasadzki: `computeFullPath` NIE wołane, cel zadany bez zmian.
   - Mutacje (surowy wynik):
     - B1 (`computeFullPath` nigdy nie wołane, `const fullPath = null;`): `FAIL` — „przy zasadzce na planszy pelna trasa liczona dokladnie raz”.
     - B2 (`computeFullPath` zawsze wołane): `FAIL` — „bez zasadzki na planszy pathfinding z zasadzkami nie jest wolany”.
   - Wiring `main.ts`: `planBarbarianStep(` = 1, `planBarbarianAmbushMove(` = 0 w `main.ts`; regex `planBarbarianStep\(units, bu, bcmd\.toQ, bcmd\.toR,\s*\(\) => computePath\(` musi trafić (mutacja `() => null` = FAIL wiringu). Stary test `occ('planBarbarianAmbushMove(') === 1` zaktualizowany do 0 (wywołanie przez `planBarbarianStep`).
   - ZASTRZEŻENIE: sam pathfinding (`computePath`) nie jest testowany w tym pliku; test używa wstrzykniętej trasy.

## Wyniki bramek (surowe wyjścia, własne, na `cc719cef0`)

Środowisko: worktree nie miał `gra/node_modules`; wykonano `npm ci --no-audit --no-fund --ignore-scripts` w `gra/` (71 pakietów). Brak `npm run build`/`dev`.

- `./node_modules/.bin/tsc --noEmit -p .` → exit 0, bez wyjścia.
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`, exit 0.
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`.
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`.
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`.
- `node tools/mgla-sciezka-inwariant-test.cjs` → `42 pass, 0 fail` (N1 z r4 pozostaje naprawione).
- `node tools/load-game-regression-test.cjs` → `load-game-regression: 34 PASS / 0 FAIL`.
- `node tools/determinism-same-seed-test.cjs` → exit 0.
- `node tools/determinism-save-load-resume-test.cjs` → `WYNIK: PASS`.
- `node tools/ambush-core-test.cjs` → `Wynik: 40 OK, 0 FAIL`.
- `node tools/ambush-realstep-test.cjs` → `Wynik: 16 OK, 0 FAIL`.
- `node tools/ambush-save-roundtrip-test.cjs` → `Wynik: 5 OK, 0 FAIL`.
- `node tools/ambush-ui-reason-test.cjs` → `Wynik: 5 OK, 0 FAIL`.
- `node tools/ambush-wiring-test.cjs` → `Wynik: 28 OK, 0 FAIL` (po dodaniu asercji r5: galąź split, wywołanie `fireAmbushOnHex`, regex barbarzyńcy; wszystkie przechodzą).
- `node tools/ambush-split-barb-test.cjs` (NOWY) → `PASS base` + 4× `FAIL` mutantów + `OK ... wszystkie mutanty czerwone`, exit 0.
- army-merge (11 plików, surowe ostatnie linie):
  - besieger-only-move: `WYNIK: 8 OK / 0 FAIL`
  - bounce: `4 pass, 0 fail`
  - colocated: `4 pass, 0 fail`
  - dismiss-bounce: `16 pass, 0 fail`
  - panel-list-visibility: `104 pass, 0 fail`
  - panel-production-mount: `9 pass, 0 fail`
  - panel-scroll-real-render: `27 pass, 0 fail` (test NADPISUJE trackowany PNG `R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1/06-production-robocza-150-percent.png`; przywrócone `git checkout --`, poza commitem)
  - separate-return-mainguard: `73 pass, 0 fail`
  - separate-return: `16 pass, 0 fail`
  - split-direction-icons: `PASS`
  - stackgroupid: `11045 pass, 0 fail`
- Determinizm: `determinism-same-seed-test` exit 0 + `determinism-save-load-resume-test` PASS (jak wyżej).

## Pliki zmienione w kodzie obrony (`cc719cef0`)

- `gra/src/game/ambushMove.ts` (+ `planSplitAgainstHiddenAmbush`, `planBarbarianStep`)
- `gra/src/main.ts` (onSplit: wejście w zasadzkę zamiast „Heks zajęty.”; pętla barbarzyńców: `planBarbarianStep`; import)
- `gra/tools/ambush-split-barb-test.cjs` (NOWY: test dynamiczny + mutacje S1/S2/B1/B2)
- `gra/tools/ambush-wiring-test.cjs` (asercje strukturalne r5; `planBarbarianAmbushMove(` 1 → 0)

## Lista testów do deployu (ten temat)

`gra/tools/ambush-core-test.cjs`, `ambush-realstep-test.cjs`, `ambush-wiring-test.cjs`, `ambush-save-roundtrip-test.cjs`, `ambush-ui-reason-test.cjs`, `ambush-split-barb-test.cjs` (NOWY), oraz `mgla-sciezka-inwariant-test.cjs`, `load-game-regression-test.cjs`, `army-merge-*` (11), `determinism-*` (jak wyżej).

## Otwarte (NIE ZMIERZONO / poza zakresem tej rundy)

- Chromium AI→gracz (z korytarzem zasadzki ≥8 heksów od miast; przerwanie ruchu, bitwa, `aiCmdResume`, brak dwóch jednostek na heksie) — NIE ZMIERZONO w tej rundzie (Operator r5 nie uruchamiał przeglądarki; zarzuty Evaluatora nie wymagały).
- Który zakres stosu dołącza do bitwy po wejściu w zasadzkę przy rozdzielaniu — NIE ZMIERZONO w przeglądarce.
- Audyt czytelników `units` wroga bez filtra (`computeDiplomaticContacts`, tooltipy, minimapa, HUD „siły wroga”): poza tymi trzema zarzutami — zostaje jak w r4 (OTWARTE, do tabeli w rundzie kolejnej lub w temacie AMBUSH-DEPLOY).
- Rozstawienie w bitwie na polu wroga i szyk ≤3 — poza zakresem (AMBUSH-DEPLOY).
- Dług Rust (REPIN): pełna lista do wpisu w `REJESTR` — do orkiestratora (dotyczy `ambushMove.ts` nowych funkcji i zmian `onSplit`/pętli barbarzyńców).

## Uwagi dla orkiestratora

- Operator r5 nie miał w worktree `gra/node_modules`; zainstalowano je przez `npm ci --ignore-scripts` w `gra/` (katalog ignorowany przez git). Do sprzątania po temacie.
- Test `army-merge-panel-scroll-real-render-test.cjs` nadpisuje trackowany PNG w `R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1/`; przy każdym uruchomieniu trzeba przywrócić go przez `git checkout --`.

## Podsumowanie

STATUS: PASS-WITH-NOTES
ZMIANY-COMMIT: `cc719cef0` (kod + testy); raport w osobnym commicie po nim.
TESTY: jak wyżej; wszystkie bramki zielone; nowe mutacje S1/S2/B1/B2 czerwone.
BLOKADY: brak blokady technicznej; Chromium NIE ZMIERZONO (poza zarzutami).
RUNDY: 5/5 (ostatnia runda tematu) — po Evaluatorze r5 wymagana decyzja właściciela (LIMIT-5), chyba że orkiestrator zdecyduje inaczej.
NASTĘPNY KROK: Evaluator r5 (zweryfikować poprawki 1-3 i mutacje); potem Final Control; integracja orkiestratora z aktualnym `origin/main`.
DEPLOY/PUSH: NIE WYKONANO
