# R-WEB-ERA-WAR-40-TURNS-NONOVERLAP-Q1 — final control

## Verdict

**Conditional PASS for the implemented current-save path; not fully ready against the owner’s save-compatibility requirement.** The core 40-turn clocks, forced-era non-overlap, and pending-era backlog behavior are supported by source review and the requested checks. Missing Bronze/Iron entry metadata in a legacy save bypasses the new threshold, which can allow an immediate forced era war after load. This is a material requirement gap, not a clean PASS.

## Independent checks

- `eraForcedWarStartTurnsFromEra` is 40 for Stone, Bronze, and Iron. Bronze and Iron eligibility uses `currentTurn - eraEnterTurn >= 40`, including the global-turn-219 / owner-entry-180 case (39 turns blocked; 40 turns open). The owner entry maps are set on the actual AI/player era transition and serialized/restored when present.
- The production pairing caller builds the active set from all three forced-era pair maps. Its owner check matches either `attackerId` or `targetId`, and the ordinary-war registry is not part of this added non-overlap set. A blocked pairing does not consume pending flags; after peace, the oldest pending era is selected first, and successful declaration consumes only that era. Stone’s game-start clock is consistent with Stone being the initial era; this review found no per-owner Stone transition to account for.
- `node tools/era-war-delays-test.cjs`: **50 passed, 0 failed**.
- `node tools/era-war-all-eras-test.cjs`: **10 passed, 0 failed**.
- `npm run typecheck`: passed.

## Material limitation

When a legacy save lacks `bronzeEraEnterTurnByOwner` or `ironEraEnterTurnByOwner`, restore leaves that owner absent from the map. The eligibility helper treats an undefined entry turn as eligible and skips the elapsed-time check. That preserves the previous behavior, but it does not guarantee 40 turns from the owner’s era entry and does not meet the dispatch’s save/reload requirement for old saves. The current tests confirm this fallback rather than exercising a legacy load with a safe reconstructed/initialized clock. Resolve that compatibility policy and add a focused old-save load assertion before claiming full readiness.

The suites exercise the real pure rules and pairing modules, but `main.ts` production wiring and save round-trip are established by static checks/review. No browser or live campaign run was performed. No product source was edited during final control; no staging, commit, push, merge, or deploy was performed.
