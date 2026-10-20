# 11 — Final Control: unit-speed field

DATE: 2026-10-18  
RUN: R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018, unit-speed Phase B  
STATUS: PASS — bounded `prod_szybkosc_jednostki_proc` activation only.

## Bounded acceptance

The actual helper implements integer capacity with floor/no carry for a positive base: `max(1, floor(baseCapacity * (1 + raw)))`; a disabled zero base remains zero, and non-finite raw input is neutral. With base capacity 1, the reviewed outcomes are +0.20 → 1, +1 → 2, +2 → 3, and -0.20 → 1. The minimum-one clamp is retained under root's separate engineering review of the prior A contract; it is not presented as part of the owner's literal answer (“round down each turn, no carry”). No carry, persistence field, backlog, or save-schema state was introduced.

The live city turn resolves the raw field from `city.ownerId`, derives `recMaxPerTurn`, and passes that capacity to the existing `advanceRecruitmentGated` call. The existing paid-queue, Manpower, payment, spawn, and refund paths remain in place, and completed units retain the city's owner. The recruitment queue preview resolves the same owner's field, uses the same capacity helper, and estimates item cadence with `ceil((queueIndex + 1) / unitsPerTurn)`; its disabled-capacity path avoids division and reports no cadence.

The independent Evaluator reports the actual-source focused test passing. It exercises the resolver/call path and gated consumer with human owners 0, 7, and 42, AI owners 99 and 101, and a missing UI owner key. It verifies the 15 approved source values remain zero, synthetic values reach the correct capacity and cadence, including the disabled-zero-base case. The stale D10 compatibility failure was corrected within its amended test-only allowlist: the AST assertion now finds the unique `advanceProduction` call by its first two arguments and confirms the city-owner/unit-strip guard precedes it in the same city loop. The independent recheck reports D10 and all retained D11 behavior/mutation/AI checks passing at 44/44. Operator and Evaluator report the focused suite plus the named recruitment, refund, owner-routing, Impi, manpower, and AI regressions passing; Final Control did not rerun them.

## Remaining scope and history

This accepts the bounded unit-speed consumer only. `prod_rush_koszt_proc` remains unimplemented and its polarity unanswered, so the original three-field production goal remains partial. The classifier still lists unit speed as `UNWIRED`; changing semantic status is outside this implementation allowlist and requires separate metadata work after root acceptance. Current source values remain neutral and do not imply behavior acceptance.

The v3 current-evidence ledger and manifest remain frozen historical artifacts. Their input hashes predate this legitimate unit-speed change to the shared production source/callers, so the v3 manifest is expected to be stale against the new code. Do not rewrite or regenerate v1, v2, or v3; any current snapshot must be a separately authorized post-acceptance v4 deliverable.

No full-world/game runtime, browser, visual UI, or save/load runtime was run. This PASS does not establish those dimensions, AI-wide parity, or full product acceptance. Root integration remains separate.

DEPLOY/PUSH: NOT AUTHORIZED
