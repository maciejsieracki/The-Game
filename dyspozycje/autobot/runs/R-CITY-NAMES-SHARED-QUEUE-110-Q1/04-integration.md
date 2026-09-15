# 04-integration — R-CITY-NAMES-SHARED-QUEUE-110-Q1

```text
STATUS: READY_FOR_DEPLOY
DOMAIN: GAME
TEMAT: R-CITY-NAMES-SHARED-QUEUE-110-Q1
GOAL: Stolica, państwo-miasto, founding gracza/AI i miasta obcych klastrów pobierają pierwszą wolną nazwę ze wspólnej kolejki 110 nazw cywilizacji; odrzucony slot nie zużywa nazwy.
RUNDY: recovery po Final Control FAIL; terminalna kontrola t_521cda84/run 347
```

## Bramka wejściowa

- Evaluator recovery: `t_7e545a8c` / run `346` — `PASS-WITH-NOTES`, `numbered_objections=[]`.
- Final Control: `t_521cda84` / run `347` — `PASS-WITH-NOTES`, `numbered_objections=[]`.
- Historyczny FAIL zachowany: `t_bcf1c7c9`.
- Timeouty zachowane: `t_51275e46` / run `344`, `t_1b8a0af3` / run `345`.
- Defense: pominięta, ponieważ Evaluator nie zgłosił ponumerowanych zarzutów.

## Integracja

- Baza: `origin/main` / `30409fdb2938fea93287af9df66a18adc048af26`.
- Worktree: `/home/ubuntu/projects/The-Game-city-names-integration`.
- Branch: `hermes/R-CITY-NAMES-SHARED-QUEUE-110-Q1-INTEGRATION`.
- Commit integracyjny: `baa7c3ef` (`game: integrate shared city name queue after collision filtering`).
- Allowlista produktu/testów: dokładnie `13` ścieżek zatwierdzonych przez Final Control; brak zmian w `gra/data/**`, `rust-port/**`, registry/handoff i Kanban.
- Główny dirty checkout `/home/ubuntu/projects/The-Game` nie był używany ani nadpisywany.

## Gates po integracji

- `node tools/cluster-plan-name-test.cjs`: `6 passed, 0 failed`.
- `node tools/city-names-pools-test.cjs`: `9 passed, 0 failed`.
- `node tools/civ-names-test.cjs`: `109 passed, 0 failed`.
- `node tools/start-preview-test.cjs`: `6 passed, 0 failed`.
- `node tools/shared-city-name-queue-test.cjs`: `10 passed, 0 failed`.
- `npx tsc --version`: `5.9.3`.
- `npx tsc --noEmit`: exit `0`.
- `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir`: exit `0`, `888` modules, `27.85 s`.
- `git diff --check`: PASS.
- `node tools/map-gen-regression-test.cjs --contract-test`: PASS.
- Pełny `map-gen-regression-test.cjs`: timeout `300 s`, zapisany jako `INFRA-043`; nie jest to FAIL funkcji nazw, a zmiana nie dotyczy generatora geometrii.

## Zewnętrzny skutek

- `READY_FOR_DEPLOY`: TAK — wystawia Orkiestrator po faktycznej integracji.
- Git push: NIE WYKONANO.
- Merge do remote `main`: NIE WYKONANO.
- Deploy do `gra-robocza`: NIE WYKONANO.
- Następna bramka: wygenerować bundle ROBOCZA, manifest/stempel/hash, wykonać readback, a następnie po autoryzowanym push/deploy opublikować do `gra-robocza`.
