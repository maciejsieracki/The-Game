# Operator report — R-WEB-ERA-WAR-40-TURNS-NONOVERLAP-Q1

Status: candidate committed on `codex/era-war-40`, based on `883892ee4`. No push, merge, deploy, or Robocza publication.

## Allowlist confirmed before edits

- `gra/data/war-rules-params.json`: per-era start thresholds.
- `gra/src/game/war-rules-multiwar.ts`: threshold type and existing owner/tag epoch counter helper.
- `gra/src/game/forced-war-stone.ts`: Stone start threshold.
- `gra/src/game/forced-war-common.ts`: production pairing, active participation filters, and pending-era priority.
- `gra/src/main.ts`: production caller wiring and existing save/restore paths.
- `gra/tools/era-war-delays-test.cjs`: threshold and queue regression coverage.

## Changes

All three configured thresholds are now 40. Bronze/Iron continue to use their saved owner-entry turn maps. The Stone threshold is read from the same params and remains measured from game start, which is Stone entry for owners eligible for Stone wars. Existing Bronze/Iron entry maps and pending-owner sets are already written to and restored from save metadata; missing legacy entry maps remain missing, so loading an older save does not fabricate 40 elapsed turns.

The actual main pairing caller now checks both sides against active forced-era pairs across Stone, Bronze, and Iron. Ordinary wars are not included in this check. Pending triggers remain untouched when the active-war check blocks pairing. If an owner has multiple pending eras after advancing, production pairing keeps the oldest era for that turn; on a successful declaration only that era's pending flag is consumed. The counter gate now evaluates queued declarations under their tagged owner era, including an older Bronze trigger on an owner who has since reached Iron.

## Evidence

- `node gra/tools/era-war-delays-test.cjs`: 50 passed, 0 failed. Covers 39/40 relative to Bronze/Iron owner entry, a global-turn counterexample (turn 219, entry 180), active forced-war backlog, oldest Bronze before Iron after peace, tagged era counter mapping, and production wiring checks.
- `node gra/tools/era-war-all-eras-test.cjs`: 10 passed, 0 failed.
- `npm run typecheck` in `gra`: passed.
- `git diff --check`: passed.

## Proof limits

No browser/live-game run was performed. Tests exercise the real pure pairing and rules modules; main.ts production wiring is checked statically because it is a large DOM-bound game entrypoint. Stone entry is the game's initial turn rather than a per-owner transition map; owners that start outside Stone are not eligible for Stone wars. Legacy saves without Bronze/Iron entry-turn metadata keep the existing compatibility behavior (no invented threshold age).
