# Evidence — 03 Final Control — R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1
PROCESS_PHASE: final-control
KANBAN_CARD: t_aebaafea
SOURCE_IMPLEMENTATION_CARD: t_af4dfeb8
KANBAN_RUN_ID: 25

## 1. Routing readback

Requested and actual routing for this worker:

- model: requested `gpt-5.6-luna`; actual `gpt-5.6-luna`
- provider: requested `openai-codex`; actual `openai-codex`
- effort: requested `max`; actual `max`
- service_tier: requested `priority` (Fast); actual `priority` (Fast)

The parent Hermes process read back during the run had the exact argv fragment:
`-m gpt-5.6-luna --provider openai-codex --reasoning max --service-tier priority`.

## 2. Workbook readback

- File: `/home/ubuntu/.hermes/attachments/The-Game-startowe-jednostki-do-korekty.xlsx`
- SHA-256 from `sha256sum`: `e04a427c5f761b19471b11855a236f280949b9b3be04682c09fcec2f03739cce`
- XML sheet `Macierz startowa`: player `2/1/0`, major AI extra units `0/1/2`, foreign city-state `2/1/0`; hard major AI also has extra city `1` and the existing unit fallback.
- XML sheet `PM typu gracza`: player-type city-state `0/1/2` from the independent city-state difficulty axis; values are invariant across the main-game difficulty columns.

## 3. Git and allowlist readback

- HEAD: `ffefe905910437c5b7c8364bd6adcb3c3a0ee16e`
- Base/merge-base: `ff9ce26a663c53c9f711e50536eb10f59dc4b70b`
- Branch: `hermes/R-GRACZ-STARTOWE-JEDNOSTKI-TRUDNOSC-Q1`
- Worktree: `/home/ubuntu/projects/The-Game-worktrees/R-GRACZ-STARTOWE-JEDNOSTKI-TRUDNOSC-Q1`
- Six product/test files in the reviewed commit: `gra/data/ai-params.json`, `gra/src/game/ai-difficulty-bonus.ts`, `gra/src/game/ai.ts`, `gra/tools/ai-difficulty-bonus-test.cjs`, `gra/tools/city-state-start-units-live-test.cjs`, `gra/tools/starting-army-first-city-live-test.cjs`.
- `gra/src/main.ts`: no diff; only read for wiring and guard verification.
- Product numstat relative to base: `38` added / `20` removed.
- `git diff --check`: exit `0`.
- Final status readback after report creation: only the two new `03-final-control*.md` files are uncommitted, both under `dyspozycje/autobot/runs/R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1/**`; no product or out-of-allowlist path is changed.
- No push, PR, merge, deploy or `READY_FOR_DEPLOY` was performed by Final Control.

## 4. Source wiring readback

- `ai-difficulty-bonus.ts:139-156`: player `2/1/0`; foreign PM `2/1/0`; player-type PM `0/1/2`.
- `ai.ts:554-565`: major AI `startoweJednostki` reads JSON and falls back to `0/1/2`; `startoweMiasta` falls back to `0/0/1`.
- `main.ts:7591-7594`: owner-specific difficulty source separates city-state copies from major AI.
- `main.ts:8947-8952`: same-type city-state path uses `_menuCityStateDifficulty`.
- `main.ts:9000-9004`: player path uses `_menuDifficulty` and the shared unit spawner.
- `main.ts:9077-9087`: foreign city-state path uses `_menuDifficulty` in the `isCS` branch.
- `main.ts:9012-9047`: major AI path is separate, owner-guarded, and preserves hard city/fallback behavior.
- `main.ts:13166-13186`: per-owner first-city guard and deferred city-state spawn paths.

## 5. Independent command results

All commands below were executed on the reviewed HEAD.

- Syntax: four requested `node --check` commands chained — exit `0`.
- `node_modules/.bin/tsc --noEmit` — exit `0`.
- `node tools/ai-difficulty-bonus-test.cjs` — `90 passed, 0 failed`.
- `node tools/city-state-start-units-test.cjs` — `16 PASS, 0 FAIL`.
- `node tools/ai-balans-step5-test.cjs` — `18 passed, 0 failed`.
- `node tools/city-state-cluster-diff-test.cjs` — `31 passed, 0 failed`.
- `node tools/miasta-zbyt-blisko-test.cjs` — `20` maps; `23281` planned pairs plus `25463` runtime-order pairs; `0` violations.
- `CS_CHROME_PATH=/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome node tools/city-state-start-units-live-test.cjs` — exit `0`, `25 pass, 0 fail`, three full world generations, zero console/page errors.
- `STARTING_ARMY_CHROME_PATH=/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome node tools/starting-army-first-city-live-test.cjs` — exit `0`, `13 pass, 0 fail`, two human seats, first/second founding, zero JS errors.
- Browser: `/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`; version `Google Chrome for Testing 151.0.7922.34`.

## 6. Mutation and negative controls

An isolated copy under `gra/.fc-start-units-mutant.*` changed only `playerStartUnitCount` to the old `1/2/3` behavior and ran `AI_SRC_DIR=<copy>/src node tools/ai-difficulty-bonus-test.cjs`.

- mutant exit: `1`
- observed: `87 passed, 3 failed`
- failed assertions: player easy `2` vs got `1`; normal `1` vs got `2`; hard `0` vs got `3`
- result: `mutant_killed=YES`
- cleanup: temporary copy and generated bundles removed; no product diff remained.

## 7. Broader baseline separation

- Current checkout: `node tools/ai-test.cjs` → exit `1`, `291 passed, 4 failed`.
- Failing labels: T2S-b (two assertions), T2S-b2, T10b; all are diplomacy/trade.
- Clean comparison: `git archive HEAD gra` extracted into a temporary directory with the current `node_modules` linked; same test output had exit `1`, `291 passed, 4 failed`.
- Current and clean-archive output were byte-identical; SHA-256 of each output: `845cb9535eb8ae0ea245a54624732f1ba0bbc0cfac0adf848746329e69566086`.
- Classification: existing unrelated baseline, not a start-unit regression.

## 8. Final decision

`PASS-WITH-NOTES`. All topic-specific acceptance criteria and independent evidence pass. The only note is the reproducible broad diplomacy/trade baseline. Integration is ready, but Final Control performs no integration, push, merge, deploy or `READY_FOR_DEPLOY`.

NEXT: Orchestrator performs allowlist-only integration, then the separate READY_FOR_DEPLOY and deploy/push gates.
