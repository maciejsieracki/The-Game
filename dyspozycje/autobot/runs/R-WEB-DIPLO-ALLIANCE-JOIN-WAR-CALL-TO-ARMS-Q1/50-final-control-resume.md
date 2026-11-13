# R-WEB-DIPLO-ALLIANCE-JOIN-WAR-CALL-TO-ARMS-Q1 — independent final control

**Status: PASS.** Independent control of candidate `978763d11` against `638e90bea` found no remaining objection in the resumed human-call lifecycle. No source change was needed.

## Production-path checks

- `node tools/alliance-war-call-live-reload-test.cjs` — PASS over Vite HTTP and `/usr/bin/chromium`: pending call survives IndexedDB save, full document reload, and explicit slot load; refusal creates one N4 event; repeat enqueue and persisted replay do not reopen the call or apply a second penalty; acceptance records `joined` without N4; the wrong hot-seat seat leaves the call pending and cannot resolve it; the assigned seat can then accept. No page errors.
- Independent legacy IndexedDB probe — PASS. Seeded and saved a pending call through the production test hook, edited the actual `thegame-saves`/`kv` value to remove `meta.pendingDiplomacyInbox[].allianceWar.recipientOwnerId`, reloaded the document, and loaded the slot through the production loader. The field stayed absent, the AI requester remained `ownerId: 2`, and the restored active human seat resolved refusal as one `refused` history outcome for `allyId: 0` with exactly one N4 event. No page errors.
- `node tools/alliance-war-call-saveload-test.cjs` — 7/7 PASS.
- `node tools/alliance-war-obligation-test.cjs` — 14/14 PASS.
- `node tools/diplo-alliance-gate-test.cjs` — 18/18 PASS.
- `npm run typecheck` — PASS.

## Source control

`enqueueAllianceWarCall` writes `recipientOwnerId` independently of requester `ownerId`, and deduplicates against both pending IDs and durable outcome history. The resolver validates that the recipient is a human seat and waits if another hot-seat owner is active. Requester identity remains the source for inbox display and relation sync; recipient identity is used for obligation lookup, own-ally exclusion, war joining, credibility, treaty removal, and outcome history. Event collection, proposal opening, and the pending-decision getter apply the same recipient filter.

Every legacy `recipientOwnerId ?? ME()` use is a migration fallback for saves created before the recipient field existed. The actual edited-IDB save confirms this uses the restored active human seat while preserving the AI requester in `ownerId`; explicit non-human recipient IDs are rejected by `isHuman`, and explicit other-human recipients remain tied to that seat. I found no uncontrolled requester-to-recipient fallback.

Stale principal wars, missing obligations, and invalid own-ally targets expire without N4. Refusal records one stable-ID outcome and applies the configured −15 credibility event to the obligated human; treaty-break selection receives only that human's obligation. Acceptance joins through `joinAllyToWar` and records one `joined` outcome. Pending and history data are both persisted, so resolved-hook replay stays suppressed after reload.

Checked the actual candidate at `978763d11` (`fix(diplomacy): resolve alliance calls for human recipient`); only this report was added during final control.
