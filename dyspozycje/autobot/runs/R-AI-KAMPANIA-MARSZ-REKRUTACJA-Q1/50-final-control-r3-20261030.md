# Final Control R3 — campaign main group moves after muster

Date: 2026-10-30 UTC
Review scope: dirty candidate based on `6abc4ed3ed42e70ef8d81a9ab28a012ca72fea5e`; independent read-only source/test/evidence review. No product files changed by Final Control.

## Verdict

**PASS-WITH-NOTES — stage 8/11.** The R3 change addresses the reproduced planner stall for the General-led campaign: after five complete muster end turns, an already assembled force receives and executes movement orders on the sixth AI end turn while a separated eligible unit continues its rendezvous. The ordinary all-in wait behavior remains intact when the opt-in campaign flag is absent.

This is sufficient evidence to proceed to integration for this narrow planner defect. Do not mark the entire user-reported campaign symptom closed: the user's exact save/map is still unavailable, and the R3 live fixture validates a land-only route, not a realistic naval campaign or combat/capture resolution.

## Production scope and regression review

`ai.ts` passes `marchMainGroupWhileRendezvous` into the shared planner and enables it only in the active General-led campaign path. `warAllInCapital.ts` skips putting the leading cluster into the rendezvous wait set only when that option is explicitly `true`; absent the option, the ordinary behavior is unchanged.

The saved pre-fix logs show the new planner regression failed before the change (`8d3` and `8d5`), alongside legacy/reference assertions `1a` and three `6b` hash checks. On the candidate, the new R3 assertions pass. The independent rerun of `node tools/war-allin-capital-test.cjs` produced **94 passed, 4 failed**: the same four `1a`/`6b` failures visible before the fix. The campaign logic test produced **51/51 PASS**. `npm run typecheck`, live-harness `node --check`, and `git diff --check` passed.

## Post-fix Chromium evidence inspected

I inspected the operator's raw Chromium trace and the checked-in structured trace `evidence/seed-sweep-20261030/r3-post-fix-live-20261030.json`. This was a production Vite build exercised in Chromium with real AI owner end turns, not only a headless planner fixture:

- The controlled campaign completed five full muster EOTs without attacking; on EOT 6 it emitted four main-stack target orders and the production end-turn executor accepted all four (`moved: true`).
- The physical General and three co-located troops moved from `(2,2)` to `(4,2)` toward selected capital `city0` at `(5,3)`. The separated `diffbonus` unit independently moved from `(8,6)` to `(6,6)` on its rendezvous route.
- The diagnostic reports `noPath: []` and `held: []`; the campaign remains in `attacking` with `gatherTurnsCompleted: 5`. The browser logged `pageErrors: 0` and the harness result was **28 pass, 0 fail**.
- This confirms movement began on the sixth AI EOT in the controlled scenario. The trace does not show the subsequent combat/capture result, so it is not evidence that a city was captured or that every live battlefield outcome works.

## Limits and next step

The fixture explicitly flattens all **3,952** map hexes to land after `beginWarCampaign`; the raw terrain snapshot contains zero water tiles. Therefore this post-fix run provides **no evidence** for the user's requested sea-first/sea-enabled route behavior. It also is not the user's exact save or map. Integration may proceed for the narrow land-case planner fix, while campaign-level closure remains conditional on reproducing the user's save/map and a separate realistic sea-route test if the sea priority contract is part of this release scope.

**Stage:** 8/11 Final Control — PASS-WITH-NOTES.
**Ready for:** stage 9 integration of the scoped fix.
**Not claimed:** exact-save reproduction, naval-path validation, battle resolution/capture, Robocza deployment, or push.
