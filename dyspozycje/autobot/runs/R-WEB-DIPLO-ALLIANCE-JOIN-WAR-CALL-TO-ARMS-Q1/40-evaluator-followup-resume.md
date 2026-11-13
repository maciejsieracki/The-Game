# R-WEB-DIPLO-ALLIANCE-JOIN-WAR-CALL-TO-ARMS-Q1 — evaluator follow-up resume

**Status: OBJECTION — human call responses are rejected as expired.** The resolved-ID dedupe correction is present, but the live refusal/acceptance lifecycle cannot reach it successfully.

## Blocking finding

`enqueueAllianceWarCall` stores the requesting ally in `pendingDiplomacyInbox.ownerId` (`requesterId` is attacker or victim, both AI in the seeded player-call path). `resolveAllianceWarCall` then requires `isMe(p.ownerId)`. That predicate means `ownerId === ME()`, so for an ordinary AI ally requesting the human, resolution takes the `expired` branch before checking the principal war/obligation and before either accept or refuse effects. This prevents the human from fulfilling the call and makes refusal apply no configured N4 penalty or treaty break.

Evidence from the independent browser run:

- `node tools/alliance-war-call-live-reload-test.cjs` failed at the refusal assertion: `one real N4 event on refusal`, actual `0`, expected `1`.
- An independent HTTP/Chromium acceptance probe using the production test hook seeded the call and invoked `resolve(id, true)`. Result: history `[{ id: "alliance-war-1-2-3-call-3", outcome: "expired" }]`, N4 count `0`; expected outcome is `joined`.
- The inbox row’s `ownerId` is visibly set to `requesterId` in `enqueueAllianceWarCall`; `isMe` is explicitly `ownerId === ME()` in `main.ts`.

Please remove or replace the sender-is-human guard with validation appropriate to the pending-call owner semantics, then rerun both live branches. The resolved-history guard itself now checks both pending IDs and `allianceWarCallHistory`; `recordAllianceWarCallOutcome` is ID-idempotent, and stale load/response paths record `expired` without N4.

## Checks

- `node tools/alliance-war-call-saveload-test.cjs` — 7/7 passed (source/serializer checks only; they do not exercise the failing resolver owner guard).
- `node tools/alliance-war-obligation-test.cjs` — 14/14 passed.
- `node tools/diplo-alliance-gate-test.cjs` — 18/18 passed.
- `npm run typecheck` — exit 0.
- Expanded `node tools/alliance-war-call-live-reload-test.cjs` — failed as described above, using HTTP Vite and `/usr/bin/chromium`.

No candidate code was changed in this evaluation.
