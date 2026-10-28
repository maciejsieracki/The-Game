# Evaluator report: general leadership and manual battle follow-up

## Verdict: PASS, with validation notes

The follow-up resolves the wall-collapse exception from report 51. At the defender-catapult wall-collapse death branch (`battleScene.ts` around 7353), commander death now invokes both `_removeCommanderMoraleBonus()` and `_disableManualIfCommanderLost()`. The other terminal paths are also covered: `_startRout()` removes the morale bonus and disables manual control; `_startFade()` does the same for combat death; `_tickFades()` only finalizes units already processed by `_startFade()`, while `_removeUnitFromScene()` handles routed units after `_startRout()`.

The remaining requested rules align with the inspected current source:

- `armyLeaderTitle()` selects Wódz unless the owner's building set contains `akademia_wojskowa`; `akademia` alone does not promote the title. Recruitment cards resolve the title from the current owner state, and queued leader labels add the title once.
- An assigned leader gives the participating roster +10% morale, or +20% with the Military Academy. Commander loss clears the bonus and recalculates morale while keeping each unit's morale fraction.
- Commander morale is excluded from aggregate army morale. If ordinary troops cross the army-break threshold, surviving commanders rout; a commander-only roster is defeated. Ordinary units can continue after an individual commander loss.
- Manual control requires a surviving commander on the player's controlled side. When the player loses that commander through the reviewed rout/death paths, manual mode drops to Auto and cannot be re-enabled without a living commander. The Auto action remains available.
- Initial formation puts commanders, ranged and melee units on the fighting line, with cavalry/chariots on the outer front slots and siege behind. Attack movement uses line pacing and prevents rear ranks passing the preceding rank; Charge bypasses the cap; Defense holds except to attack adjacent enemies. Ranged forward movement fires on the activation that enters range.

The dynamic-title assertion change in `rally-point-automarch-test.cjs` checks that the card uses the current owner-building title while the offer item remains raw, preventing a duplicate title prefix.

## Verification

Run from `gra/`:

- `node tools/army-leadership-test.cjs` — **PASS**.
- `node tools/pre-battle-defender-retreat-test.cjs` — **PASS**.
- `node tools/rally-point-automarch-test.cjs` — **PASS, 29/29**.
- `npm run typecheck` — **PASS**.
- `git diff --check` — **PASS**.

The leadership test now asserts that the wall-collapse branch both removes the commander morale bonus and invokes the manual fallback. The pre-battle test confirms Auto remains usable when manual control is gated. These checks are deterministic; they do not run a full browser siege with a commander catapult on the wall. The earlier real-browser battle attempt in reports 49/50 did not complete, so rendered end-to-end battle behavior remains unverified.

## Current identity

Workspace: `/workspace/all-topics-candidate`. Git HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`.

SHA-256:

- `gra/src/battle/battleScene.ts`: `0ba23c48bcd1088d84246ccce60d7cc11d52799a4e6b133f1a0f69b5adde7a04`
- `gra/src/main.ts`: `9853426d44f0f9e6b34cb42323cad29508a83831c60a9186ccb6a00f94e6f68a`
- `gra/src/game/army-leadership.ts`: `c59548336c4d21c0552cb5da90737c1463520699544929937b161a4a69df813b`
- `gra/src/game/generals.ts`: `099572f05103071b817a2e4d466a6b0e85d6969ee160a602e16e60fbf8d0d2c6`
- `gra/src/battle/formationRules.ts`: `5f2f91c5b4dba4eef3f4e089a26c20a4c1957d8c009803bac4da5156e32a291e`
- `gra/src/ui/preBattle.ts`: `5ae37c72016c3cd4bd74bb555d95d0a4c74f4389ff52d6ff9ed8c3751c988475`
- `gra/src/ui/cityPanel.ts`: `dd31e91615f3542f865a2f6064d80a32b64cb7208b34e20f58883993aa01956b`
- `gra/tools/army-leadership-test.cjs`: `31af36ffe6f2977c469946921cdef6007a11caacef1041321da02843d58f8312`
- `gra/tools/pre-battle-defender-retreat-test.cjs`: `e3ed41499645ba4a5147826bbee70e58acc5a19384779befa8c0b294648745bd`
- `gra/tools/rally-point-automarch-test.cjs`: `0755fea44f20d057019525feb4c2a99ed046626463fec860a9f1c56b02dc49b6`

The hashes identify the complete current shared-worktree files. No product files were edited during this review.
