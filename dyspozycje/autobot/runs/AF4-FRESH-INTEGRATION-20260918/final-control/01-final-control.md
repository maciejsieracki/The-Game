STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-AF4-CURRENT-BASE-FINAL-CONTROL-20260918
KANBAN: t_2ef08e4e / run 703
GOAL: Niezależna, read-only kontrola kandydata AF4 na aktualnej bazie.

REVISION:
- WORKSPACE: /home/ubuntu/projects/The-Game-integration-af4-fresh-20260918
- BRANCH: hermes/integration/af4-fresh-20260918
- HEAD: c08b3db14292221cad0a4e7a70608e9d09ee9afd
- BASE: origin/main=c08b3db14292221cad0a4e7a70608e9d09ee9afd
- ANCESTRY: PASS; HEAD == origin/main; origin/main is ancestor of HEAD
- PRODUCT_DIFF: 6 tracked files, 103 insertions, 19 deletions; 2 allowlisted untracked tests

ALLOWLIST:
- gra/src/game/building-stock-cost.ts
- gra/src/game/economy-upkeep.ts
- gra/src/game/production.ts
- gra/src/game/unit-power.ts
- gra/src/main.ts
- gra/src/ui/cityPanel.ts
- gra/tools/building-epoch-cost-implementation-test.cjs
- gra/tools/unit-power-sort-test.cjs

ALLOWLIST_READBACK:
- Product tracked diff contains exactly the six named product paths.
- The two new test files are regular files and match the declared test paths.
- No symlink/FIFO/path-traversal candidate path found.
- A pre-existing untracked process file remains outside the candidate allowlist:
  dyspozycje/autobot/runs/AF4-FRESH-INTEGRATION-20260918/01-change-intent.md.
  It was not changed by Final Control. Final-control evidence files are under
  the task-permitted final-control/** artifact directory.
- No product file, commit, push, merge, or deploy was performed by this run.

REQUIRED_GATES:
- node tools/building-epoch-cost-implementation-test.cjs: 20 passed, 0 failed.
  Covers one shared buildingEraCostMultiplier and exactly-once Stone x1,
  Bronze x2, Iron+ x4 behavior across Work/Praca, building stock cost, and
  gold building upkeep; also checks zero/missing values and normal player/AI
  Work parity.
- node tools/unit-power-sort-test.cjs: 13 pass, 0 fail.
  Covers descending computed fieldPower, stable equal/zero ties, new-array
  behavior, refresh/save-load order, replacement picker, empire recruitment
  snapshot, and both city-panel display boundaries.
- node tools/logic-test.cjs: LOGIC OK (213/213).
- node tools/upkeep-test.cjs: 73 passed, 0 failed.
- node tools/building-cost-tempo-test.cjs: 6 passed, 0 failed.
- node tools/building-queue-refund-test.cjs: 5 passed, 0 failed.
- node tools/unit-replace-test.cjs: 13/13.
- node tools/r-stawki-fala2-test.cjs: 11 OK, 0 FAIL.
- node tools/rekrutacja-koszty-polowa-all-test.cjs: PASS; 75 records,
  214 changed target fields and 150 protected-field checks.
- node tools/era-improvement-cost-upkeep-test.cjs: 65 pass, 0 fail.
- node ./node_modules/typescript/bin/tsc --noEmit: exit 0.
- node --check on both allowlisted new .cjs tests: exit 0.
- git diff --check origin/main -- and git diff --check: exit 0.
- Safe direct Vite build (not npm run build): exit 0, 890 modules transformed,
  built in 27.84 s. Output was written to a temporary directory and removed.

KNOWN_BASELINE_NOTES:
- node tools/unit-power-test.cjs reports 4 pass, 2 fail on the candidate:
  Hastati expected 50 but got 57.5; the three-unit sum expected 145 but got
  167.5. The clean origin/main archive produces the identical 4 pass, 2 fail.
  The candidate diff only inserts the new sorter after fieldPower(); the
  fieldPower formula and this oracle are unchanged. This is outside the sort
  acceptance contract and is not a product objection.
- node tools/koszty-surowcowe-test.cjs reports 126 pass, 3 fail on the
  candidate and the identical clean origin/main archive. The unchanged test
  reports pre-existing data expectations for palac, Stela/Pomnik and Kamienne
  kregi. gra/data/buildings.json and that test are unchanged versus origin/main;
  no candidate regression or product objection was found.

PRODUCT_ACCEPTANCE: true
OBJECTIONS: []
TEST_ARTIFACTS:
- final-control/gates.tsv
- final-control/baseline-comparison.log
- final-control/tracked-diff.patch
- final-control/untracked-tests.patch
- final-control/path-audit.txt
- final-control/status-after-gates.txt
BLOKADY: brak dla Final Control; integracja/push/merge/deploy pozostają poza tym read-only zadaniem.
NEXT_GATE: Orchestrator clean integration of the approved allowlist; rerun post-integration gates. Do not publish or deploy from this card.
DEPLOY/PUSH: NIE WYKONANO
