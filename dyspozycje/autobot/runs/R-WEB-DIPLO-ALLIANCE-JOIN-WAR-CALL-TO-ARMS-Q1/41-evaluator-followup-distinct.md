# R-WEB-DIPLO-ALLIANCE-JOIN-WAR-CALL-TO-ARMS-Q1 — evaluator follow-up, recipient identity

**Status: PASS.** The recipient/requester correction resolves the prior live failure and preserves legacy pending-call saves.

## Independent production-path verification

- `node tools/alliance-war-call-live-reload-test.cjs` — PASS on HTTP/Vite with `/usr/bin/chromium`. The production resolver and IndexedDB paths verified refusal = one N4 event, same-war replay suppressed, refusal history retained across full reload/load, acceptance recorded as `joined` with zero N4, and replay suppressed after acceptance. The hot-seat check switched to seat 7 and confirmed it could not resolve seat 0's pending call; the row remained pending with no history outcome, then seat 0 accepted it. No page errors.
- `node tools/alliance-war-call-saveload-test.cjs` — 7/7 PASS.
- `node tools/alliance-war-obligation-test.cjs` — 14/14 PASS.
- `node tools/diplo-alliance-gate-test.cjs` — 18/18 PASS.
- `npm run typecheck` — exit 0.

## Legacy recipient-field migration

I independently seeded a pending call through the production test hook and saved it to IndexedDB. I edited the actual serialized save in the `thegame-saves` store to remove `meta.pendingDiplomacyInbox[].allianceWar.recipientOwnerId`, then did a full document reload and loaded that slot through `loadGameFromSlot`. The restored row still had no recipient field, the legacy fallback assigned the restored active human seat, and refusal produced exactly one `odmowa_obowiazku_sojuszu` event with outcome `refused`. No browser errors occurred.

## Caller and recipient semantics

Source audit confirms the roles are now distinct and consistently used: `ownerId` and `civName` retain the requesting AI ally for inbox display and `syncRelationFromDeals`; `allianceWar.recipientOwnerId` stores the obligated human seat. Resolution checks that recipient is a configured human owner and currently active, then uses the recipient for obligation lookup, own-ally exclusion, war joining, credibility, treaty removal, and history `allyId`. The pending-decision getter, event collector, and modal opener filter by the same recipient, so another hot-seat seat cannot act on or see the decision as its own.

Legacy rows lacking the optional recipient field use the active restored human seat (`recipientOwnerId ?? ME()`) in response, load validation, queue/event filtering, and history recording. This matches the prior single-active-human save format and passed the actual edited-IDB-save test above.

No concrete objection remains in this resumed lifecycle scope.
