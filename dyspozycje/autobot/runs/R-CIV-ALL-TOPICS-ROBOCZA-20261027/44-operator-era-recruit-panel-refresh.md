# Operator report: refresh open recruitment panel on era advance

## Change

`notifyPlayerEraChangeIfAdvanced` now refreshes the open city panel after its real-advance guard succeeds. The panel rebuild reads the live player era, so recruitment availability updates immediately on the transition. Same-era and non-advancing notifications return before the refresh. No production, unit-window, resource, or manpower logic changed.

Added `era-recruit-panel-refresh-test.cjs`. It executes the extracted notifier with a stub open-panel refresh callback; that callback rebuilds the list through the real `purchasableUnits` availability code. The regression confirms that a Bronze advance refreshes once, keeps a Stone unit visible without Barracks, keeps a Bronze unit gated without Barracks, and does not refresh for a no-op era notification.

## Validation

- `node tools/era-recruit-panel-refresh-test.cjs`: PASS, 4/4.
- `node tools/koszary-gate-test.cjs`: PASS, 26/26.
- `node tools/unit-epoch-cost-test.cjs`: PASS, 57/57.
- `node tools/recruit-list-visibility-test.cjs`: PASS, 9/9.
- `node tools/recruit-list-visibility-ui-test.cjs`: PASS, 15/15; zero browser errors.
- `npm run typecheck`: PASS (`tsc --noEmit`, exit 0).

## Hashes

- `gra/src/main.ts`: `9b8f1d1f16545b27890cf84f9ba92a80e6334d8d31ca645a9f7115782895ae01`
- `gra/tools/era-recruit-panel-refresh-test.cjs`: `5ec1142393438290c070eb3ffe7d73123aa30d32fadd93165e3014a448507f3a`

`main.ts` had pre-existing worktree changes before this follow-up; the recorded hash identifies the complete current file.
