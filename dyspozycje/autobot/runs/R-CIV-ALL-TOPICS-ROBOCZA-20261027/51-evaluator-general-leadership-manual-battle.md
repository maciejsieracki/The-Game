# Evaluator report: general leadership and manual battle formations

## Verdict: FAIL — one manual-control exception in siege wall collapse

The implementation matches the requested rules in the normal recruitment and combat paths, but one direct siege death path leaves manual controls enabled after the player's commander dies. In `battleScene.ts`, wall collapse kills defender catapults standing on the wall (`u.dead = true; u.fadingOut = true`) and removes the army morale bonus, but it does not call `_disableManualIfCommanderLost()`. If the commander is represented by a Catapult and stands on that wall tile, the player roster has no surviving leader while manual mode remains on. The normal `_startFade()` and `_startRout()` paths do disable manual mode, so this is a narrower exception; it still violates the rule that manual settings are available only while the player has a surviving leader.

The general offer is selected from purchasable units (`bestGeneralUnitForOwner()`), while the siege wall collapse path classifies defenders with `_isCatapult()`. The unit-type/placement combination is therefore structurally possible. A focused runtime reproduction of this exact wall-collapse sequence was not present in the checked tests; this finding is from direct source tracing.

## Other requirements reviewed

The remaining source paths align with the requested behavior:

- `armyLeaderTitle()` returns Wódz by default and Generał only when the owner's building set includes `akademia_wojskowa`; ordinary `akademia` does not promote the title. Recruitment offer and queued labels use this owner-level title resolver.
- Assigned participating rosters receive +10% morale, or +20% with Military Academy. `moraleBaseFor()` applies the bonus; commander rout/death clears the fraction and recalculates morale/max while preserving the current morale fraction.
- `armyMoraleRatioWithoutCommander()` excludes commander morale and retains routed ordinary units in the denominator. Aggregate army break sends surviving commanders into rout; a commander-only roster is treated as broken. Losing the commander otherwise leaves ordinary units fighting.
- Manual control is gated by a commander in the player-controlled roster, and the Auto action remains enabled. Normal individual rout/death drops the player battle to Auto; re-entering manual is rejected without a surviving commander.
- Default line ordering places commanders, ranged and melee units on the front fighting rank; cavalry/chariots occupy the outer front slots, with siege behind. Attack pacing caps rank advance and prevents a rear rank overtaking the previous rank. Charge bypasses that cap, while Defense holds except for adjacent attacks. Ranged forward movement fires when its movement enters range on the same activation.

## Checks run

The checked source hashes match reports 49/50 at evaluation time, so focused validation was safe to run:

- `node tools/battle-formation-rules-test.cjs` — **PASS**.
- `node tools/army-leadership-test.cjs` — **PASS**.
- `node tools/pre-battle-defender-retreat-test.cjs` — **PASS**.
- `node tools/auto-battle-simultaneous-test.cjs` — **PASS, 29/29**.
- `node tools/combat-test.cjs` — **PASS, 6/6**.
- `npm run typecheck` — **PASS**.
- `git diff --check` — **PASS**.

These deterministic checks cover unit seams, helper logic, and a pre-battle DOM gate. The real-browser battle scenario recorded in reports 49/50 did not complete, so there is no full rendered battle result. The leadership test uses source assertions for BattleScene integration rather than simulating commander loss through every death source; it misses the wall-collapse exception described above.

## Identity

Workspace: `/workspace/all-topics-candidate`. Git HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`.

SHA-256 of current files:

- `gra/src/main.ts`: `9853426d44f0f9e6b34cb42323cad29508a83831c60a9186ccb6a00f94e6f68a`
- `gra/src/battle/battleScene.ts`: `869927d4d585d6cd865b2e3c213de995df0fa704bb04af3ccdf40462f7ca8c32`
- `gra/src/battle/formationRules.ts`: `5f2f91c5b4dba4eef3f4e089a26c20a4c1957d8c009803bac4da5156e32a291e`
- `gra/src/game/army-leadership.ts`: `c59548336c4d21c0552cb5da90737c1463520699544929937b161a4a69df813b`
- `gra/src/game/generals.ts`: `099572f05103071b817a2e4d466a6b0e85d6969ee160a602e16e60fbf8d0d2c6`
- `gra/src/ui/preBattle.ts`: `5ae37c72016c3cd4bd74bb555d95d0a4c74f4389ff52d6ff9ed8c3751c988475`
- `gra/src/ui/cityPanel.ts`: `dd31e91615f3542f865a2f6064d80a32b64cb7208b34e20f58883993aa01956b`
- `gra/tools/battle-formation-rules-test.cjs`: `af7733e761001e369ab1439d54d4b4f274139c07ca2097c208a185b1df17f3a1`
- `gra/tools/army-leadership-test.cjs`: `48cc73a030d034be5bfa46728fa73174b107fb02820c7dd5542110ba78e43ebf`
- `gra/tools/pre-battle-defender-retreat-test.cjs`: `e3ed41499645ba4a5147826bbee70e58acc5a19384779befa8c0b294648745bd`
