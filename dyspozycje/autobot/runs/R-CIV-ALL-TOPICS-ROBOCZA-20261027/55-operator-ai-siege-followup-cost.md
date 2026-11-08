# AutoBot Operator — follow-up cost inside AI siege captures

**Scope:** read-only source/instrumentation investigation after report 54. No AI/main capture edits in this task, no long stress run, no commit/push/deploy.

## Confirmed cost context

The historical large-empire run measured turn 39→40 at **69.796 s** world EOT (**77.678 s** harness wall) and recorded `scanAutoSiegesAfterAiTurn` at **30.734 s**. The direct synthetic scan reports 13/21 measured about **18.265–18.270 s for eight capture/storm calls**. In that fixture, the attacker roster, defender check/roster, and battle strength/outcome calculation were each sub-millisecond to at most a few tenths of a millisecond; together they were below 1 ms across the fixture. Most elapsed time therefore came from capture projections, not an expensive reusable siege formula.

After report 54 removed the immediate duplicate unit projection before `refreshFog()`, another distinct repeated cost remains: `refreshMapAfterCityCapture()` schedules an animation-frame callback on every capture, and every callback calls `syncUnitsRender()`. `scanAutoSiegesAfterAiTurn()` is synchronous and does not yield a browser frame between captures, so eight captures queue eight callbacks against the same final post-scan unit/map state. Only the callback matching the final `forceVisibleUnitId` can clear that ID; the other callbacks still do a full projection.

## Focused source-path probe

A one-off Node probe extracted and executed the current `refreshMapAfterCityCapture()` body with eight successive lead captures. It observed:

```json
{"captureCalls":8,"rafCallbacks":8,"unitSyncsThroughRefreshFog":8,"unitSyncsFromDeferredCallbacks":8,"finalForceVisible":null}
```

The test did not mutate product or test files. It confirms the callback multiplicity and that the last callback clears the last force-visible ID. The current direct-scan harness does not time these deferred callbacks individually, so their wall-time contribution has not yet been measured in a live capture fixture. Earlier direct profiles measured comparable immediate `syncUnitsRender` calls at roughly **353–391 ms** each. Applying that only as an estimate, seven redundant callbacks for an eight-capture batch could represent roughly **2.5–2.7 s** of extra projection work; that estimate must not be reported as measured savings.

A minimal future optimization is to coalesce only the deferred cleanup callback while a frame is pending: retain the latest effective force-visible ID, schedule one RAF, then clear it if it still matches and call `syncUnitsRender()` once. The capture, event/notices, `refreshFog()` discovery/fog work, city projection, diplomacy/peace checks, siege decisions, and per-capture state updates remain synchronous and unchanged. A focused test should compare the resulting force-visible/selection state after an eight-capture synchronous batch with the existing callbacks and verify separate capture calls on later frames still schedule fresh cleanup.

## Pure calculation review

No pure AI-siege calculation currently has evidence of material cost: the direct fixtures measured roster extraction, defender checks, and power resolution as negligible compared with renderer/fog refresh. Caching roster or strength results would add invalidation risk for little demonstrated benefit; these calculations depend on live unit positions, HP, owner, city garrison, and siege machines. I recommend skipping none of them absent a future profile showing a meaningful cost. The evidence-backed additional candidate is redundant deferred renderer projection, not a costly pure formula.

## Source identity

- HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`.
- `gra/src/main.ts`: SHA-256 `77dac8a0ec23518888d64e239897545781ea6b0cf37c7c005fd3c79f944548ba`.
- `gra/src/game/siegeAi.ts`: SHA-256 `ae9de2fbdbc0870d7bc083e5190603ca67c91b8799fec8c1ee36d456d6371110`.
- `gra/src/game/army-concentration.ts`: SHA-256 `e7257174cba088dee3bb4f3fac4762a78f930bda442d7d042259f255d361cca6`.
- `gra/tools/perf-large-empire-stress-live-test.cjs`: SHA-256 `e5bbf93c29cc0d67b014565944256a7ed1c82d394e675651be42d7e5c5e340a4`.
- Shared `gra/src/main.ts` binary diff against HEAD SHA-256: `12a22a0502f8ea51af2320d9a225736d2819bee44f2790c7de843df493e3eb77`.

Hashes identify the shared source at report time; `main.ts` includes other operators' concurrent changes. No product recommendation here claims the 60-second late-game gate is cleared.
