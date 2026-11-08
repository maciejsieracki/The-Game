# AutoBot Operator — manual battle formations, opening volleys, and commander controls

**STATUS: implementation and focused checks complete; full browser check incomplete.** The real-browser battle scenario was stopped after about 65 seconds with no progress output. It produced neither an assertion failure nor a pass result. The focused deterministic checks and typecheck are the completed validation.

## Source identity at this report revision

- Workspace: `/workspace/all-topics-candidate`.
- Git HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`.
- `gra/src/main.ts` SHA-256: `9853426d44f0f9e6b34cb42323cad29508a83831c60a9186ccb6a00f94e6f68a`.
- `gra/src/battle/battleScene.ts` SHA-256: `869927d4d585d6cd865b2e3c213de995df0fa704bb04af3ccdf40462f7ca8c32`.
- `gra/src/battle/formationRules.ts` SHA-256: `5f2f91c5b4dba4eef3f4e089a26c20a4c1957d8c009803bac4da5156e32a291e`.
- `gra/src/game/army-leadership.ts` SHA-256: `c59548336c4d21c0552cb5da90737c1463520699544929937b161a4a69df813b`.
- `gra/tools/battle-formation-rules-test.cjs` SHA-256: `af7733e761001e369ab1439d54d4b4f274139c07ca2097c208a185b1df17f3a1`.
- `gra/tools/army-leadership-test.cjs` SHA-256: `48cc73a030d034be5bfa46728fa73174b107fb02820c7dd5542110ba78e43ebf`.

## Implementation and interpretation

The original default placement assigned infantry first, archers in a later rank, and then placed cavalry/chariots behind the foot army. Both initial setup and deploy reset now use the same line planner: commander, ranged, and melee units enter the front line; mounted units take the outer slots; siege engines remain behind the combat ranks. Explicit formation/cavalry choices still apply during deploy. The default initial placement changes to satisfy the front-line and flank requirements.

The existing Attack, Charge, and Defense doctrines define the movement behavior; no additional stance was added. Attack (`steady`) limits forward movement to one step beyond the least-advanced unit in that rank and prevents a following rank from passing the preceding rank. This applies to automatic doctrine movement and issued move/attack orders. Lateral movement remains available, and cavalry/siege units retain their separate movement. Charge (`aggressive`) bypasses the cap and preserves its current free advance and flank wrapping. Defense retains its existing hold behavior and selected formation; phalanx cohesion and combat modifiers were not changed.

Previously ranged units ended their activation after the move that brought them into range, delaying their opening shot until a later activation. They now shoot during that same activation. In manual play, pressing Space once opens the turn; archers fire during that turn as soon as they can reach a target. No extra turn-start press is needed for the opening volley.

The concurrent commander work tags Wódz/Generał as ordinary combat units and prioritizes them in the front line. Their army morale bonus is removed on death or individual rout. Commanders are excluded from the aggregate army-rout ratio; if the rest of the army breaks, a surviving commander withdraws. Losing/routing the commander removes manual controls for the player roster while Auto remains available. The leader can die or individually rout without immediately ending the battle if regular units remain.

## Focused validation

- `node gra/tools/battle-formation-rules-test.cjs` — PASS. Tests default role ordering, commander at the front, both cavalry wings retained in a shooter-filled front rank, Attack rank caps, Charge bypass, and same-activation ranged fire through the BattleScene method seam.
- `npm --prefix gra run typecheck` — PASS on the last run after commander integration.
- `node gra/tools/auto-battle-simultaneous-test.cjs` — 29/29 PASS; manual mode remains outside the AUTO phase batch path.
- `node gra/tools/combat-test.cjs` — 6/6 PASS, including front defense against Falanga/Włócznik and ranged combat.
- `node gra/tools/army-leadership-test.cjs` — PASS; commander title, morale, aggregate rout/death, placement, and Auto/manual gate contracts.
- `node gra/tools/pre-battle-defender-retreat-test.cjs` — PASS; no-commander manual selection is disabled while Auto remains callable.
- `node gra/tools/generals-purchase-runtime-test.cjs` — 9/9 PASS (coordinated operator run).
- `git diff --check` — PASS.
- The real-browser `battle-large-return-live-test.cjs` built the single-file app and entered its Playwright scenario, then was stopped after about 65 seconds without progress output. Its startup wait allows up to 900 seconds, so this run was incomplete and gives no pass/fail evidence about rendered battle behavior. No assertion failure was observed.

## Limits

The formation test exercises the production role planner and BattleScene movement/ranged-action methods through deterministic test seams, not a completed pixel-level browser interaction. The combat harness validates combat resolution formulas, not 3D path visuals. No 100-turn stress or deployment was run. Explicitly selecting the existing rear-cavalry deploy choice can still override the default flank placement. Source hashes above identify the implementation revision covered by the focused tests.

**Browser follow-up:** report [51-operator-battle-return-browser-followup.md](51-operator-battle-return-browser-followup.md) supersedes the incomplete live-check status above. A bounded 28v28 Playwright run passed all six return/render/input/error assertions; retained screenshots and page-state JSON are listed there.
