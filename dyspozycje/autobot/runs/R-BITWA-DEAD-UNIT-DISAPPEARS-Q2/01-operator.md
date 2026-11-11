# Operator checkpoint — R-BITWA-DEAD-UNIT-DISAPPEARS-Q2

STATUS: IN PROGRESS — no product fix proposed; the reported user-visible ghost has not been reproduced.
BASE: `186d0f03b` (`deploy(robocza): wave 619 wall tiers and alliance calls`), isolated worktree `/tmp/dead-unit-regression`, branch `codex/dead-unit-regression`.

## Production browser baseline

Ran `node gra/tools/battle-dead-unit-disappearance-browser-test.cjs` against the isolated source through Vite HTTP in `/usr/bin/chromium`. Both scenes used 28 attacker units; the siege fixture used 29 defenders because it adds one production-stat Katapulta to drive the wall-collapse path. The browser had no page, console, or request errors.

On the large field scene, a production landed melee blow, missile blow, and three distinct missile volley targets each reduced HP to zero. Every target became dead and removed, its model and HP-bar groups detached and hidden, and its occupied tile was released. A living routed unit retained 40 HP and stayed rendered. The same kill checks passed after replay recreated the runtime rosters.

On the large siege scene, the same attack and volley checks passed. The production `_breachWallTile` path destroyed a defender catapult on the collapsed wall tile and detached its model/bar and released its tile. Replay recreated the scene objects and a freshly recreated unit then passed the lethal-blow assertions.

Mutation proof: replacing `_removeUnitFromScene` with a no-op caused the browser oracle to detect that a lethal target remained attached and visible. This shows the scene-level assertions catch a broken detach operation.

The harness uses `_singleBlow` for deterministic landed-hit coverage; it does not yet claim an end-to-end AUTO/Skip battle reproduction or that it recreates the owner's reported visual. Code audit shows melee and ranged animation callbacks both invoke `_singleBlow`, while `_runFastForward` drains those same queued callbacks. Existing skip parity/browser receipts remain prior evidence, not a substitute for reproducing this report. No source change is justified until a distinct red path or concrete runtime case is supplied.

## Evidence

- `evidence/browser-audit.json`: per-case assertions, browser errors, roster sizes, and timestamp.
- `evidence/field-before.png`, `evidence/field-after.png`, `evidence/siege-before.png`, `evidence/siege-after.png`: actual Chromium screenshots.
- `gra/tools/battle-dead-unit-browser-entry.ts` and `.html`: large field/siege browser scenes.
- `gra/tools/battle-dead-unit-disappearance-browser-test.cjs`: bounded production scene assertions and mutation proof.

## Remaining work

Add bounded AUTO/Skip invocation evidence if feasible, run the existing Q1 headless regression and typecheck, then submit this candidate to independent evaluation. Do not claim the owner's reported runtime ghost is fixed or reproduced based on these checks.
