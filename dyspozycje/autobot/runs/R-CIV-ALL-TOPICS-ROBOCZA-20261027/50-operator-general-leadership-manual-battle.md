# AutoBot Operator — Wódz/Generał morale and manual battle gate

Implemented owner-building title selection, assigned-army morale, player-side manual-control gating, and battle rout/death handling for Wódz/Generał.

- `akademia_wojskowa` promotes the title to Generał; regular `akademia` does not. Recruitment UI and newly queued unit labels use the owner’s building state.
- An assigned commander grants +10% morale without the Military Academy or +20% with it to every unit in that participating roster. Death or individual rout immediately removes that bonus while preserving each unit’s current morale fraction.
- Commander is a normal combatant in the fighting-line placement, can die from combat damage, and can individually rout. Commander morale is excluded from army aggregate rout calculations. When ordinary units cross the aggregate defeat threshold, any surviving commander withdraws; a commander-only roster is treated as defeated.
- Manual battlefield controls require a living commander on the player’s participating side. The Auto action remains enabled and functional. Enemy commander presence does not open player controls.

Focused checks:

- `npm run typecheck` — passed.
- `node tools/army-leadership-test.cjs` — passed title, morale modifier, commander-excluded army ratio, aggregate withdrawal, commander-only defeat, and source integration contracts.
- `node tools/pre-battle-defender-retreat-test.cjs` — passed; includes a DOM runtime check that manual battle is disabled without a commander and Auto still invokes its callback.
- `node tools/battle-formation-rules-test.cjs` — passed formation placement and timing checks.
- `node tools/auto-battle-simultaneous-test.cjs` — 29 passed, 0 failed.
- `node tools/generals-purchase-runtime-test.cjs` — 9 passed, 0 failed.
- `node tools/battle-large-return-live-test.cjs` — incomplete: stopped after about 65 seconds with no assertion output while the long real-browser scenario was still running. No failure was observed. No changes were deployed, pushed, or committed.

SHA-256 snapshots after the focused checks:

- `gra/src/battle/battleScene.ts` — `869927d4d585d6cd865b2e3c213de995df0fa704bb04af3ccdf40462f7ca8c32`
- `gra/src/main.ts` — `9853426d44f0f9e6b34cb42323cad29508a83831c60a9186ccb6a00f94e6f68a`
- `gra/src/ui/preBattle.ts` — `5ae37c72016c3cd4bd74bb555d95d0a4c74f4389ff52d6ff9ed8c3751c988475`
- `gra/src/ui/cityPanel.ts` — `dd31e91615f3542f865a2f6064d80a32b64cb7208b34e20f58883993aa01956b`

## Browser return follow-up

The incomplete live-battle result above is superseded by [51-operator-battle-return-browser-followup.md](51-operator-battle-return-browser-followup.md). The bounded 28v28 Chromium run passed: the result screen returned to a visible map with the map renderer/context alive, battle canvas removed, wheel input accepted, and no browser errors. The report records the phase diagnostics, temporary bundle hash, and retained screenshots/state JSON.
- `gra/src/game/army-leadership.ts` — `c59548336c4d21c0552cb5da90737c1463520699544929937b161a4a69df813b`
- `gra/src/battle/formationRules.ts` — `5f2f91c5b4dba4eef3f4e089a26c20a4c1957d8c009803bac4da5156e32a291e`
- `gra/tools/army-leadership-test.cjs` — `48cc73a030d034be5bfa46728fa73174b107fb02820c7dd5542110ba78e43ebf`
- `gra/tools/pre-battle-defender-retreat-test.cjs` — `e3ed41499645ba4a5147826bbee70e58acc5a19384779befa8c0b294648745bd`
- `gra/tools/battle-formation-rules-test.cjs` — `af7733e761001e369ab1439d54d4b4f274139c07ca2097c208a185b1df17f3a1`

`main.ts` and `battleScene.ts` are shared files also containing concurrent authorized operator work; hashes identify the complete shared-file snapshots at check time.

## Follow-up: wall-collapse terminal path and dynamic-title regression

Evaluator 51 identified that a commander who was also a wall-walkway defender catapult lost the morale bonus when the wall collapsed, but did not trigger the manual-to-Auto fallback. The wall-collapse death branch now invokes both `_removeCommanderMoraleBonus` and `_disableManualIfCommanderLost`. The focused leadership test asserts this branch explicitly; the pre-battle runtime test continues to verify that Auto remains enabled and invokes its callback when manual control is unavailable.

The existing rally-point test expected a hard-coded Generał card label. Its assertion now checks the dynamic title from the owner’s building state and still verifies that the offer item stays raw, so the title prefix is applied exactly once. `node tools/rally-point-automarch-test.cjs` passes 29/29.

Follow-up verification: `npm run typecheck`, `node tools/army-leadership-test.cjs`, `node tools/pre-battle-defender-retreat-test.cjs`, `node tools/battle-formation-rules-test.cjs`, and `node tools/auto-battle-simultaneous-test.cjs` all pass. `git diff --check` passes for the touched implementation and test files.

Updated SHA-256 snapshots:

- `gra/src/battle/battleScene.ts` — `0ba23c48bcd1088d84246ccce60d7cc11d52799a4e6b133f1a0f69b5adde7a04`
- `gra/tools/army-leadership-test.cjs` — `31af36ffe6f2977c469946921cdef6007a11caacef1041321da02843d58f8312`
- `gra/tools/rally-point-automarch-test.cjs` — `0755fea44f20d057019525feb4c2a99ed046626463fec860a9f1c56b02dc49b6`
- `gra/src/main.ts` — `9853426d44f0f9e6b34cb42323cad29508a83831c60a9186ccb6a00f94e6f68a`
- `gra/src/ui/cityPanel.ts` — `dd31e91615f3542f865a2f6064d80a32b64cb7208b34e20f58883993aa01956b`
