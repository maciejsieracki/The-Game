# R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 — Final Control, RUNDA 5/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1
GOAL: wyzwalacz zasadzki (gracz, AI, barbarzyńcy), niewidoczność w logice, cykl życia, znacznik, testy realnych ścieżek; r5: N1 (mgla-sciezka-inwariant), plan barbarzyńcy w rdzeniu z testem dynamicznym, audyt widoczności; poprawki obrony na zarzuty Evaluatora r5.
KANDYDAT/INTEGRACJA: `a42586f84e17bfc6aa540497e12841284f79193c` (potomek bazy `b14e91e1f`; `git merge-base --is-ancestor b14e91e1f a42586f84` = tak; `git diff --check` czysty).

## Werdykt dla zarzutów
1. Wyrocznia „Heks zajęty.” w onSplit — ODDAL (obrona naprawiła przed oceną; komunikat usunięty, ukryta zasadzka na celu rozdzielenia wchodzi w zasadzkę przez `planSplitAgainstHiddenAmbush` → `fireAmbushOnHex(lider stosu)`). Sprawdzone w kodzie main.ts ~16014–16022. Zastrzeżenie: w bitwie walczy lider, reszta stosu zostaje na źródle (NIE ZMIERZONO w Chromium).
2. Brak testu guardu — ODDAL. Mutacja własna: guard `if (false && splitAmbush.kind === 'ambush')` ⇒ `ambush-wiring-test` 27 OK / 1 FAIL (czerwono). Logika planu: `ambush-split-barb-test` z mutantami S1/S2 czerwonymi. Luka: ciało `onSplit` w main.ts pokryte strukturalnie (wiring), nie dynamicznie — NOTATKA.
3. Wpięcie pętli barbarzyńców niepokryte — ODDAL. Mutacja własna: `() => computePath(...)` zastąpione `() => null` ⇒ `ambush-wiring-test` 27 OK / 1 FAIL (czerwono); plan dynamicznie: `planBarbarianStep` mutanty B1/B2 czerwone.
Żaden zarzut nie wymaga NAPRAW ⇒ nie FAIL.

## Własne wyniki (surowe, worktree FC, `npm ci --ignore-scripts`)
- `npx tsc --noEmit` (gra/): exit 0.
- 5 bramek: logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/0; unit-replace-test 21/21; combat-test 6/6. Brak czerwonych (porównanie z bazą zbędne).
- `mgla-sciezka-inwariant-test`: 42 pass, 0 fail (N1 domknięte; whitelista przeklasyfikowana tej samej klasy BEZ-MGLY-GRACZA — akceptowalne wg ECHO właściciela).
- `load-game-regression-test`: 34 PASS / 0 FAIL.
- `determinism-same-seed-test`: PASS; `determinism-save-load-resume-test`: PASS.
- ambush: core 40/0; realstep 16/0; save-roundtrip 5/0; ui-reason 5/0; wiring 28/0; split-barb: base zielony, mutanty B1/B2 (+S1/S2) czerwone.
- army-merge-* (11 plików): wszystkie exit 0, 0 FAIL (besieger 8/0; bounce 4/0; colocated 4/0; dismiss-bounce 16/0; list-visibility 104/0; production-mount 9/0; scroll 27/0; mainguard 73/0; separate-return 16/0; split-direction-icons PASS; stackgroupid 11045/0). Test panel-scroll nadpisuje trackowany PNG (`R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1/06-production-robocza-150-percent.png`) — przywrócone `git checkout`, poza commitem.
- Allowlista: zmiany tylko `gra/src/game/ambushMove.ts`, `gra/src/main.ts` (punktowo), `gra/tools/*` i runs/<ID>; bez WERSJE.md/rust-port/save.ts.

## Notatki / luki (do wiedzy orkiestratora)
- NIE ZMIERZONO: AI→gracz w żywym Chromium (harness bez celu marszu AI poza miastami; rzetelnie opisane w raporcie Operatora). Wyzwalacz gracz→AI zmierzony w r4 (13 PASS). Ryzyko: wznowienie fazy AI po bitwie z zasadzki (`aiCmdResume`) niezweryfikowane na żywo; pokryte testem realnego kroku (realstep), nie żywą grą.
- NIE ZMIERZONO: rozdzielenie na ukrytą zasadzkę w Chromium (walczy lider; reszta stosu zostaje).
- Zrzut samego chipu „W zasadzce” w panelu: brak zbliżenia (jest zrzut r4 `zrzuty/A-znacznik-panel-mapa-1280x720.png`).
- Ranking mocy (Power) nie filtruje zasadzek — decyzja produktowa dla właściciela.
- Nie wykonano: rozstawienie w bitwie / szyk ≤3 (AMBUSH-DEPLOY, osobny temat).
- Dług Rust (REPIN): `ambushMove.ts` (planBarbarianAmbushMove, planBarbarianStep, buildBarbarianAmbushAttack, planSplitAgainstHiddenAmbush), zmiany onSplit/pętli barbarzyńców, whitelista mgła-ścieżka; fixtury S21–S24 i ambush-split-barb.

## Lista testów do deployu
tsc --noEmit; logic, tech-tree, research, unit-replace, combat; mgla-sciezka-inwariant; load-game-regression; determinism-same-seed; determinism-save-load-resume; ambush-core, ambush-realstep, ambush-save-roundtrip, ambush-ui-reason, ambush-wiring, ambush-split-barb; army-merge-* (11).

## UWAGI-DLA-ORKIESTRATORA
- Rekomendacja: integracja `a42586f84` i deploy na ROBOCZĄ z jawnym ryzykiem (AI→gracz nie zmierzone na żywo); przy integracji sprawdź `git merge-base --is-ancestor` względem aktualnego origin/main.
- Sprzątanie: `gra/node_modules` w worktrees; test panel-scroll brudzi trackowany PNG.

RUNDY: 5/5 (ostatnia; werdykt PASS-WITH-NOTES, brak LIMIT-5-EXCEEDED).
NASTĘPNY KROK: integracja orkiestratora (merge-tree, FF), rejestry, deploy ROBOCZA po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
