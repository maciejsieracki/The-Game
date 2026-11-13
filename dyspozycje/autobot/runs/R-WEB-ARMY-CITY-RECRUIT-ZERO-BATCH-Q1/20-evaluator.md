# R-WEB-ARMY-CITY-RECRUIT-ZERO-BATCH-Q1 — independent evaluator

STATUS: PASS WITH SCOPE NOTE  
EVALUATOR: independent Chromium and source review  
CANDIDATE: `10c3cdec6a25f93859b69d7611fe24d705e42e2c` (`codex/army-city-recruit`)  
EVALUATOR HEAD: `b30a53071a02a1a9e70760c869600342cc2493a2`

## Independent checks

Ran the requested browser gates independently from `gra/` using the installed `/usr/bin/chromium` over HTTP (no `file://`):

- `node tools/empire-mass-recruitment-test.cjs` — **45 passed, 0 failed**. Verified two cities and different unit types, zero initial Army drafts, separate city/type quantities, top and bottom buttons disabled at zero and enabled for drafts, exact selected city/type/cost/quantity callback arguments, successful clearing, partial acceptance (2 of 3) with one remaining and a Polish status message, single-card purchase, ordinary City-panel default quantity 1, reload/remount restoration, and 150% zoom with the bottom button visible and clickable. The top button also submits the partial-budget case.
- `node tools/empire-recruit-all-test.cjs` — **31 passed, 0 failed**. The separate civilization-wide recruitment panel has one upper action and preserves its batch, refusal, and partial-result behavior.
- `node tools/recruit-card-quantity-real-render-test.cjs` — **25 passed, 0 failed**. Ordinary card minimum/default remains 1 and the rendered controls/callback behavior work.
- `./node_modules/.bin/tsc --noEmit -p tsconfig.json` — **PASS**.
- `git diff --check f6eb6616a..10c3cdec6` — **PASS**.

Reviewed the candidate diff against the dispatch allowlist: changes are confined to the declared UI/callback/test files and task reports. Army batch submission uses the existing city purchase callback; selected entries are not redirected. Submission filters city IDs to current player-owned cities, and new-game/load boundaries clear the localStorage drafts and status message. Costs, eligibility, and queue behavior remain on the existing purchase path. No balance/data changes found.

## Scope note

Draft storage is keyed by `cityId|unitId`, not by owner ID. A city currently owned by another player is filtered from submission, and distinct city IDs do not share drafts. New/load resets the stored state. The current production session model has one active human seat, so this run found no owner-seat switching path to exercise. A city that changes ownership and later returns to the player could still reveal its old local draft; ownership-transfer cleanup is not covered by the current gate or the dispatch requirements.

No source changes were made by the evaluator. Chromium is released for the next run.
