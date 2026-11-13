# Evaluator audit: army, Generals, recruitment

Result: **PASS-WITH-NOTES**

Scope: independent assessment of the army/General/recruit changes described in `22-operator-army-generals.md`, including focused live runtime and helper tests. Read-only with respect to product and test source; this report is the only file written by this audit.

## Diff identity

- HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`
- Current tracked worktree patch SHA-256 (`git diff HEAD --binary`): `39408f282f3226d7ea5b0eb89e6d419db03edf4fa112a5b78979d2ec98df185c`
- The Operator report records `59dfb671cab6aaeb0fdccc233345c35568e218d151ffffda86b8377a7db65b8d`. That is not the current tracked patch fingerprint, so the Operator's recorded diff identity is stale. The focused tests below were rerun against the code present during this audit; the current full-patch fingerprint above binds this report.
- Relevant untracked source hashes:
  - `gra/src/game/generals.ts`: `099572f05103071b817a2e4d466a6b0e85d6969ee160a602e16e60fbf8d0d2c6`
  - `gra/src/game/ai-era-unit-promotion.ts`: `18d94e02d39cff4484dfabda54a69850b3298a174b77b3a998c1df7124241f6b`

## Assessment

I found no blocking army/General/recruit defect in the reviewed paths. General purchase is checked against the capital, exact current offer identity and cost, quantity one, and the era slot count before the real purchase callback runs. Queued Generals reserve a slot. The live runtime scenario verified rejection without resource or queue mutation, successful quoted-cost purchase, spawning from the actual end-turn recruitment path, and assigning a newborn recruit a march destination linked to the General.

The follower target is stored on planned marches and synchronized against the General's live location. Invalid/missing leaders clear the order; garrisoned and besieging recruits are excluded. The integration hook applies to newly spawned human-player units (`ownerId === 0`), which is a current behavior boundary: AI recruits do not automatically follow their General.

The cap is `max(1, floor(era))`; it assumes eras are numbered as consecutive positive integers. General form synchronization is attached to the player's era transition, so a same-era technology unlock does not itself upgrade existing Generals. These are behavior limits, not failures demonstrated by the requested scenario.

AI rally targets the capital rally hex and delays ordinary patrol/exploration for units arriving there. Promotion helper logic handles eligible later-era same-role replacements, positive cost differences, health percentage, movement reset, and once-per-turn replacement state. Chariot metadata and upkeep resolve to Stone/Wheel availability and wood. UI changes to the army merge and mass recruitment panels were not manually inspected at multiple viewport sizes, so this audit does not establish responsive visual acceptance.

## Reproduced checks

All checks completed successfully against the current worktree:

- `npm run typecheck`: passed.
- `node tools/generals-purchase-runtime-test.cjs`: 9 passed, 0 failed.
- `node tools/ai-era-unit-promotion-test.cjs`: 12 passed, 0 failed.
- `node tools/army-consolidation-e2e-test.cjs`: 6 passed, 0 failed.

This is focused acceptance of the listed paths, not a full playthrough or broad save-compatibility/visual audit.
