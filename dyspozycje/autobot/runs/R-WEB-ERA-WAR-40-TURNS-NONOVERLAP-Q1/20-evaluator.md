# Independent evaluator — R-WEB-ERA-WAR-40-TURNS-NONOVERLAP-Q1

Status: PASS for the reviewed candidate commit `3f691a2f3` (`feat: wait 40 owner-era turns for nonoverlapping era wars`). Review was performed independently against the operator report and current source. No code was changed.

## Verification

- `node tools/era-war-delays-test.cjs` (from `gra/`): **50 passed, 0 failed**. It covers the configured 40-turn thresholds, Bronze/Iron 39-versus-40 turns from owner entry (including global turn 219 / entry 180), delayed Bronze before Iron, waiting while either participant has an active forced era war, and static checks of the production caller and owner-entry maps.
- `node tools/era-war-all-eras-test.cjs`: **10 passed, 0 failed**; all three eras produced declarations in the headless module flow.
- `npm run typecheck` (from `gra/`): passed (`tsc --noEmit`).

## Independent source review

All three thresholds are 40 in `gra/data/war-rules-params.json`; Stone now reads the configured Stone value through `WOJNA_KAMIEN_WYMUSZONA_START_TURY` in `forced-war-stone.ts`, replacing the prior hardcoded 25. Bronze and Iron continue to use their owner-entry maps and configured values. The Bronze/Iron maps are serialized in save metadata and restored from that metadata. Restore clears the maps first and does not synthesize entries when old saves lack them, preserving the documented legacy fallback (missing entry means the elapsed-time gate is skipped).

The production caller builds its active-participant set from Stone, Bronze, and Iron forced-war pair maps. Pairing eligibility rejects an owner found in those pairs, and the player-first path applies the same check to both sides. This check does not inspect ordinary-war state, so the added non-overlap gate is scoped to forced era wars. Pending declarations are retained on a blocked pairing: the pairing function only returns assignments, while the pending flags are consumed later on successful declaration. It selects the oldest pending era for an owner, allowing a queued Bronze trigger to precede Iron after an advance; the declaration counter uses that trigger's era tag.

## Limits

No browser or live-game run was performed. The behavior tests execute the real pure rules and pairing modules, while the `main.ts` production wiring and save/restore paths are checked by source assertions/review rather than a full game round trip. The Stone threshold remains measured from game start; the code comments and eligibility path establish that only Stone-era owners qualify for that trigger.
