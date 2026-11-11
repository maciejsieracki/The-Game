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

## Evaluator follow-up correction: recipient vs requester

The follow-up evaluator found that `pendingDiplomacyInbox.ownerId` is the AI requester, not the human who must answer. The resolver incorrectly required `isMe(p.ownerId)`, expiring valid calls. Alliance payloads now persist `recipientOwnerId` separately; the resolver checks that it is still a human seat and only resolves while that exact seat is active. If another hot-seat seat is active, the call remains pending. Event collection, open-modal dispatch, and the pending-decision getter filter calls by their recipient. Legacy rows without this optional field fall back to the restored active seat.

## Live resolver verification

Rerun after the recipient fix, using `npm run dev -- --host 127.0.0.1` and `/usr/bin/chromium` through `node tools/alliance-war-call-live-reload-test.cjs`:

- HTTP/Chromium + IndexedDB save, full page reload, and explicit load preserve the pending call.
- The production refusal resolver records exactly one N4 event; repeating the same war hook creates no row and no second N4. Persisted refusal history survives a second full reload/load and continues to suppress replay.
- The production acceptance resolver records `joined`; repeating the same hook creates no row and no N4 event.
- No browser page errors.

Latest checks: typecheck PASS; save/load lifecycle 7/7; alliance obligation 14/14; alliance gate 18/18; expanded live resolver/reload test PASS.

## Recipient-semantics correction and actual resolver evidence

The second evaluator follow-up found that `pendingDiplomacyInbox.ownerId` identifies the requester (AI), while the human recipient is a separate identity. Alliance calls now persist `recipientOwnerId`; resolution validates that it remains a human owner and waits until that same hot-seat seat is active. The inbox event collector, proposal queue, modal opener, and public pending-decision getter expose each call only to its assigned active recipient. The requester remains in `ownerId` for display and treaty-relation updates.

The expanded live test was rerun after this correction and passed on HTTP/Vite with `/usr/bin/chromium` and IndexedDB. It invoked the actual resolver: refusal produced exactly one N4 event, same-war replay added no second event or inbox row, and the refusal stayed deduplicated after full reload/load. Acceptance produced `joined` and replay added neither another row nor N4. In the hot-seat scenario, seat 7 could not resolve seat 0's call; it stayed pending, then seat 0 accepted it successfully.

Latest gates: `npm run typecheck` PASS; save/load lifecycle 7/7; alliance obligation 14/14; alliance gate 18/18; full live resolver/reload/replay/hot-seat test PASS; no browser page errors.
