# R-WEB-DIPLO-ALLIANCE-JOIN-WAR-CALL-TO-ARMS-Q1 — Operator defense, resumed round

## Evaluator objection

The evaluator found that the stable call ID was checked only in `pendingDiplomacyInbox`. Once a decision removed the pending row, a repeated hook invocation could enqueue the same call again and charge N4 a second time.

## Correction

`enqueueAllianceWarCall` now deduplicates against both pending rows and durable `allianceWarCallHistory` IDs. Outcomes are recorded once by stable ID. The persisted history has three explicit outcomes:

- `joined`: accepted call, or the player had already joined that target war before answering;
- `refused`: N4 and the player's own obligation treaty are applied once;
- `expired`: stale principal war, missing obligation, or invalid own-ally target; no N4 is applied.

Load-time pruning records `expired` after treaty/war restoration. Resolving a stale call records `expired` before returning. These outcomes stay in save metadata and prevent the same hook from reopening an already-processed call.

The live browser test hook now exposes the production resolver and same-war enqueue only on `?test=alliance-war-call`. Its expanded HTTP/Chromium test covers save → full page reload → IndexedDB load → refusal → repeat hook, checks one N4 event and no new pending call, then persists/reloads the refusal history. A fresh browser context also exercises acceptance and verifies replay does not create another call or N4.

## Verification

- `npm run typecheck`: PASS.
- `node tools/alliance-war-call-saveload-test.cjs`: 7/7 PASS, including pending/history stable-ID guard and persisted `expired` lifecycle.
- `node tools/alliance-war-obligation-test.cjs`: 14/14 PASS.
- `node tools/diplo-alliance-gate-test.cjs`: 18/18 PASS.
- Expanded `node tools/alliance-war-call-live-reload-test.cjs` has not been rerun in this resumed round because the root reserved Chromium slot 2 for a bounded Final Control run. The prior version passed actual HTTP + `/usr/bin/chromium` + IndexedDB `page.reload()` + load. The updated retry assertions are ready for Final Control to run.
