# AutoBot dispatch — Robocza memory/performance cleanup

## Authorization and objective
Publish the independently tested, narrow memory/rendering fixes to the test Robocza bundle and push the release to `origin/main`, then continue large-empire diagnosis.

## Included product scope
- `R-PERF-CAPTURE-EVENT-RETENTION-Q1`: release details for captured-city / city-state event cards when their cards leave the bounded event journal.
- `R-PERF-UNIT-ICON-SYNC-CHURN-Q1`: reuse unchanged stack badges and hunger/deficit sprites across unit-render syncs.
- Base: deployed Robocza `a1d8621290d107adc3ece82978d64aa6b7c4c0dc`.
- Product commits: `a4d7bc30` and `782c9b34`.

## Constraints
- This is a test Robocza release; it does not claim that either fix alone explains 2 GB RSS or all late-game freezes.
- No Kanon/final release or public hosted deployment.
- Report the incomplete 100-turn baseline and any unverified pan/interaction probe accurately.
- Verify exact bundle, manifest, START metadata, GitHub readback, and checksums after publication.
