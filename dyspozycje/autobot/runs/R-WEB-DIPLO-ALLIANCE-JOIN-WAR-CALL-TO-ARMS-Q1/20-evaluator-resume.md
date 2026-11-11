# R-WEB-DIPLO-ALLIANCE-JOIN-WAR-CALL-TO-ARMS-Q1 — evaluator resume

**Status: OBJECTION — return to Operator for stable-call idempotence.** This review covers only the resumed durable human call lifecycle. The already-implemented alliance thresholds (130/90) are outside this review.

## Verified

- Pending call rows and outcome history round-trip through the production `serializeGame`/`deserializeGame` functions. Legacy saves without the history field remain readable.
- Independent live browser check passed: Vite HTTP page, `/usr/bin/chromium`, IndexedDB save, full `page.reload()`, explicit slot load, and pending row equality. No page errors; pending remains unresolved after load.
- Principal-war ordering is coherent: the inbox row can be queued before the synchronous principal relation update; response and post-load validation require that principal pair to be in `wojna`.
- Stale calls are removed after load or response when the principal war or active obligation no longer exists. These paths return before appending the N4 credibility event.
- Human obligated allies are skipped by synchronous `finalizeAllianceObligationRefusals`, so an unresolved inbox call is not treated as a refusal. Response dispatch routes alliance calls through the dedicated resolver.
- The resolver's refusal branch appends the configured `wiarygodnoscN4OdmowaObowiazkuSojuszu` value (currently −15) once for the pending row and passes only the current human obligation to `treatiesBrokenByRefusal`; that obligation names the treaty for the human/requesting-ally pair. Acceptance joins through `joinAllyToWar` and records `joined` without N4.
- A call targeting the human is rejected at enqueue and response. A target that is a formal human ally is rejected at response before accept/refuse effects.

## Objection: stable ID does not deduplicate a resolved call

`enqueueAllianceWarCall` derives a stable ID from turn, attacker, victim, and target, but checks only `pendingDiplomacyInbox`. After a player resolves/removes that row, a repeated invocation for the same principal war can enqueue the identical ID again; `allianceWarCallHistory` is not checked. If that duplicate is refused, the same stable call ID can receive a second refusal outcome and another −15. The existing save/load test asserts the pending-only guard and therefore does not catch this post-resolution replay. Please make enqueue idempotent against resolved history (or otherwise retain a durable processed-ID guard) and add a regression covering repeated enqueue after both `joined` and `refused` outcomes.

## Independent checks

- `node tools/alliance-war-call-saveload-test.cjs` — 6/6 passed (candidate's checks).
- `node tools/alliance-war-obligation-test.cjs` — 14/14 passed.
- `node tools/diplo-alliance-gate-test.cjs` — 18/18 passed.
- `npm run typecheck` — exit 0.
- `node tools/alliance-war-call-live-reload-test.cjs` — passed using explicit HTTP Vite server and `/usr/bin/chromium`.

Source audit: `gra/src/main.ts` call queue/resolver, `finalizeAllianceObligationRefusals`, save metadata and post-hydration validation; `gra/src/game/diplomacy-treaties.ts` refusal treaty selection; configured N4 in `gra/src/game/diplomacy.ts`.
