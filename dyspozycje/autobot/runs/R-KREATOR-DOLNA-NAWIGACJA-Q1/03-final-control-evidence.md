# Evidence — R-KREATOR-DOLNA-NAWIGACJA-Q1 — Final Control

Run: `27` (Kanban current run)
Task: `t_3734405d`
Parent Evaluator: `t_619d212a`
Round/attempt: `1/1`
HEAD: `70172f758c6a7506d46c5885c5a56962a6732d81`
BASE merge-base: `ff9ce26a663c53c9f711e50536eb10f59dc4b70b`
Branch/worktree: `hermes/R-KREATOR-DOLNA-NAWIGACJA-Q1` / `/home/ubuntu/projects/The-Game-worktrees/R-KREATOR-DOLNA-NAWIGACJA-Q1-bugs`

## Routing readback

Requested policy:

```text
model=gpt-5.6-luna
provider=openai-codex
reasoning_effort=max
service_tier=priority (Fast)
process_phase=final-control
```

Actual worker readback from `ps` (`/tmp/r-kreator-final-control-routing.txt`): PID `2289575` has argv containing:

```text
-m gpt-5.6-luna --provider openai-codex --reasoning max --service-tier priority
```

Therefore requested/actual model, provider, effort and service tier match. The exact machine-readable fields are in `final-control-receipt.json`.

## Contract and provenance

- Current `git status --short --untracked-files=all` was clean before Final Control artifacts were written.
- `git merge-base origin/main HEAD` = `ff9ce26a663c53c9f711e50536eb10f59dc4b70b`.
- `git diff --name-status origin/main...HEAD` contains 13 paths: the expected dispatch/run artifacts plus `gra/tools/newgame-bottom-navigation-test.cjs`; no `gra/src` path.
- `git diff --quiet origin/main HEAD -- gra/src/ui/newGameFlow.ts` succeeded.
- `git diff --check` succeeded.
- `gra/src/ui/newGameFlow.ts` SHA-256 = `7ba486932b017a8f271d339f289ebb957c6c0498d18b20747962d2b3c6464113`.
- `gra/tools/newgame-bottom-navigation-test.cjs` SHA-256 = `8620ece3115a71bfe117496b6ce3204ea53b551420f3a8a4a3214cd338a844c7`.
- Operator report/evidence hashes, Evaluator report/evidence/progress/journal hashes, and their receipt references all matched in the independent provenance script.
- Operator source `6af03c01939834b0876507a4e001275453528a06` and Evaluator source `da5b901d2de2dec6c5900343f65ff097ea91210b` are ancestors of the current HEAD.
- Evaluator objections are `[]`; no Defense phase was required.

## Source readback

The live source was read directly at these locations:

```text
newGameFlow.ts:842-845    .civ-newgame fixed full-screen root, overflow:auto
newGameFlow.ts:966-976    2×3 settings grid and side-by-side .sett-layout
newGameFlow.ts:1009-1013 .nav and Back/Next button CSS
newGameFlow.ts:1042-1047 AI panel overflow hidden + internal .ai-civ-scroll
newGameFlow.ts:1630-1681 AI picker and 2-column card grid
newGameFlow.ts:1684-1747 settings layout and Start action
newGameFlow.ts:2050-2084 .nav only on steps 2–4; Next only on steps 2–3
newGameFlow.ts:2101-2107 syncSettLayoutHeight after live DOM mount
```

This confirms that the current production variant keeps the AI list in a capped side panel and does not add a production change in this topic.

## Independent runtime

Command:

```text
PLAYWRIGHT_BROWSERS_PATH=/home/ubuntu/.cache/ms-playwright CIV_CHROME_PATH=/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome node tools/newgame-bottom-navigation-test.cjs
```

Observed process result: `exit=0`, final line `70 pass · 0 fail`. The test built a fresh Vite bundle, ran real Chromium/Playwright, set `deviceScaleFactor=1`, selected 5 AI civilizations, measured DOM rectangles, performed hit-tests and clicks, and collected console/page errors.

Browser executable/version:

```text
/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome
Google Chrome for Testing 151.0.7922.34
```

2K DCI:

```text
viewport=2048x1080, window.devicePixelRatio=1
.nav: left=524, top=857.328125, right=1524, bottom=910.328125, width=1000, height=53
Start: top=754.953125, bottom=800.953125, width=332.59375, height=46
fullyInViewport=true, hitByCenter=true, rootScrollTop=0, rootScrollHeight=1080, rootClientHeight=1080
selected AI=5/5, console.error/pageerror=0
```

4K UHD:

```text
viewport=3840x2160, window.devicePixelRatio=1
.nav: left=1420, top=857.328125, right=2420, bottom=910.328125, width=1000, height=53
Start: top=754.953125, bottom=800.953125, width=332.59375, height=46
fullyInViewport=true, hitByCenter=true, rootScrollTop=0, rootScrollHeight=2160, rootClientHeight=2160
selected AI=5/5, console.error/pageerror=0
```

The same run checked Intro (no `.nav`), Back/Next on steps 2–3, Back after 5/5 selection, absence of Next on step 4, and Start hiding the wizard through the real callback path.

## Mutation negative control

A temporary copy `gra/tools/.r-kreator-final-control-mutant.cjs` injected `.civ-newgame .nav{display:none !important;}` before the usability assertion. It was checked and run without changing the canonical test:

```text
node --check temporary mutant: exit=0
runtime temporary mutant: exit=1 (expected)
cleanup: PASS
```

The mutant produced a zero-size `display:none` nav, `fullyInViewport=false`, `hitByCenter=false`, failed the usability assertions in 2K, and timed out on the hidden Back click. This proves the viewport/hit-test oracle is not tautological.

## Static and reference gates

```text
node --check tools/newgame-bottom-navigation-test.cjs                         exit 0
node ./node_modules/typescript/bin/tsc --noEmit                              exit 0
node ./node_modules/vite/bin/vite.js build --outDir <tmp> --emptyOutDir       exit 0; 888 modules; 27.67s
node tools/logic-test.cjs                                                     213/213; exit 0
node tools/tech-tree-test.cjs                                                 19 pass, 0 fail; exit 0
node tools/research-test.cjs                                                  33/33; exit 0
node tools/unit-replace-test.cjs                                              13/13; exit 0
node tools/combat-test.cjs                                                    6/6; exit 0
git diff --check                                                          clean
```

The direct Vite output directory was under `/tmp` and was removed after the check. No `npm run build` or `npm run dev` was used.

The Evaluator evidence also records the unrelated pre-existing baselines (`start-preview` 1/5, `ruch-swiata-tempo` 33/2, stale settings-grid oracle 66/4). They are outside this topic's changed product paths and do not alter this Final Control verdict.

## Verdict

The requested 2K/4K navigation failure is not present on the current HEAD. The existing `.sett-layout`/capped AI-panel implementation keeps `.nav` and `Start` visible and clickable without root scrolling. The only product change is the focused real-browser regression test; `newGameFlow.ts` remains untouched.

Status: `PASS-WITH-NOTES`.
Integration readiness: `TAK`.
Push/PR/merge/deploy by this Final Control: `NIE WYKONANO`.
