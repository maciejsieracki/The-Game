# AutoBot Operator — live AI war campaign closeout

**Result: PASS, 16/16 live-runtime assertions.** This pass closes the prior campaign evidence gap for owner-0 war targeting, actual General recruitment/spawn, the five-turn muster boundary, attack orders, and campaign persistence. No commit, merge, push, or deploy was performed.

## Defect found and fixed

The main-runtime target filter required `targetId > 0`, which excluded the human player (owner 0). An AI civilization at war with the player therefore had no eligible General-campaign target. The filter now accepts nonnegative owner IDs while still rejecting negative/system owners and self-targets.

The campaign save restore validator also rejected `targetOwnerId === 0`, so an otherwise valid active campaign against the player disappeared on load. The validator now accepts owner 0 as a valid target; negative IDs remain rejected. A focused regression asserts preservation of a saved attack-stage campaign targeting owner 0.

## Bounded browser scenario

`node tools/ai-general-war-campaign-live-test.cjs` built the production Vite bundle with test-only probes and ran one seeded Chromium scenario. **16 passed, 0 failed**, no page errors:

- Started a production game, founded the player capital, and declared war between AI owner 1 and human owner 0.
- Confirmed the AI selected the human capital as its campaign target and queued a physical General through the production recruitment transaction.
- Advanced the real end-turn recruitment pipeline, confirmed General spawn, then ran the next campaign-preparation hook and confirmed the live leader assignment.
- Exercised the production AI planner for five gather turns: no attacks were issued, each turn advanced the muster count, and the campaign entered `attacking` exactly after the fifth complete turn.
- Exercised the sixth-turn attack planner against the human capital with a passable nearby mobile unit; the generated march targeted the selected capital.
- Round-tripped the live attack-stage campaign through the production campaign save metadata helpers.

The seeded map did not provide a mobile AI roster for the attack-order assertion. A test-only Warrior was added to the live runtime fixture and positioned on a passable adjacent hex; the General itself was recruited and spawned through the actual production path. The synthetic unit was not added to product code.

## Regression and checks

- `node tools/ai-general-war-campaign-test.cjs` — **25 passed, 0 failed**, including human owner 0 save/load.
- `node tools/ai-general-war-campaign-live-test.cjs` — **16 passed, 0 failed** in Chromium.
- `node tools/forced-war-reguly-multi-turn-simulation-test.cjs` — **50 passed, 0 failed**.
- `node tools/ai-city-capture-integration-test.cjs` — **21 passed, 0 failed**.
- `node tools/forced-war-stone-test.cjs` — **38 passed, 0 failed**.
- `node tools/forced-war-bronze-test.cjs` — **56 passed, 0 failed**.
- `node tools/forced-war-iron-test.cjs` — **58 passed, 0 failed**.
- `npm run typecheck -- --pretty false` — **PASS**.
- Scoped `git diff --check` — **PASS**.

## Current source identities

- `gra/src/main.ts`: `4a152bd077153f221a5ac872bc0f173d49fcd6e10f8f49009a36e670cfecaea1`
- `gra/src/game/ai-general-war-campaign.ts`: `8b1f394c0fe8c4806b19f178e0f6455f0ab86147fdd9ffc8cbef9c6d16d290f2`
- `gra/tools/ai-general-war-campaign-test.cjs`: `fbf64b671fb568c29fabb8310ba4190e21c1af419bf37dec31b86b71be2d44aa`
- `gra/tools/ai-general-war-campaign-live-test.cjs`: `71d8bc83894683c3c367363aa2c65cfb159371280d6acea0c4bb3789209c4e14`
- `gra/tools/ai-general-war-campaign-live.vite.config.ts`: `e30e226f37fb1f868f05d798680ad22faf667f1a632efa962d900b092135d656`

**Limits:** the map fixture used test-only probes and one synthetic mobile troop to make the attack path reachable. The live runtime covers a complete war-onset through campaign-attack progression; turn-to-turn troop movement and the ordinary post-spawn roster are independently covered by planner/runtime checks, but the test does not simulate the battle resolution itself. That remains part of the separately tested battle scope.
