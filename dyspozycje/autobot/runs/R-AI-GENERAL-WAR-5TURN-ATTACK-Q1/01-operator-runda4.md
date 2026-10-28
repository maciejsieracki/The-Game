# Operator report — R-AI-GENERAL-WAR-5TURN-ATTACK-Q1 — runda 4

**Status Operatora:** implemented; evidence below. This is not an Evaluator or Final Control verdict, and does not claim release readiness.  
**Base:** `/tmp/the-game-ai-five-turn-20261028`, branch `codex/R-AI-GENERAL-WAR-5TURN-ATTACK-Q1-r4`, HEAD `85f8c5f0e0aa6ff46aa8b85a03d0bc0c71d86268` (`origin/main`).  
**Git operations:** no add, commit, push, checkout, reset, stash, integration, or deploy.

## Baseline and findings

The AI General campaign module and its main wiring already existed on the exact base. The current final-control candidate explicitly excluded the five-turn march from its release subset (`dyspozycje/autobot/runs/FINAL-CONTROL-READY-SUBSET-20261028/01-final-control.md`). This confirms the feature was present in source but is not evidence that it shipped in that release subset.

The exact-base focused test initially reported **24 passed / 1 failed**. The only failure was a stale source regex expecting the old inline `purchasableUnits()` call. The current General-offer path still uses `productionAvailabilityCtxForCity` and `purchasableUnits`, and the purchase transaction rechecks the selected offer through `attemptGeneralPurchase`; the assertion was updated to match that path.

The exact-base live browser test reported **16 passed / 0 failed**, but its fixture issued one synthetic Warrior order through a direct planner hook. It did not prove same-hex stack movement in the real executor or a land-reachable target choice. An added focused stack assertion then exposed the product defect: with the physical General and three eligible units on one hex, the attack planner produced moves for only **2/4** units.

## Changes

- `gra/src/game/ai.ts`: when the General-led attack planner returns a move for a starting stack, the campaign now expands that route to every eligible unit on the same hex and marks it `allowFriendlyStack`, which the existing AI move executor honors.
- `gra/src/game/ai-general-war-campaign.ts` and `gra/src/main.ts`: campaign targets are filtered through a single land connected-component BFS rooted at the AI capital. Enemy-city hexes block the search; the nearest reachable capital wins, and the existing target remains stable while reachable and at war. The search visits a connected component once per campaign preparation rather than running pathfinding per unit/target pair.
- `gra/tools/ai-general-war-campaign-test.cjs`: updated the stale availability assertion and added checks for `4/4` same-hex movement, a closer capital blocked by a full-width sea barrier, a farther reachable capital, and one BFS search.
- `gra/tools/ai-general-war-campaign-live-test.cjs` and `gra/tools/ai-general-war-campaign-live.vite.config.ts`: added a bounded browser fixture that runs the actual end-turn pipeline and checks movement of three co-located units plus the physical General. The test map is made land-connected explicitly because the selected generated seed initially placed the only two capitals across impassable sea; this is test-only terrain setup, not a product map change. The wait condition checks both the world-turn advance and completion of `endTurnInProgress`, so positions are sampled after AI command execution.

## Verification

| Check | Result |
|---|---:|
| Exact-base focused test, before edits | 24 pass / 1 stale assertion failure |
| Focused campaign test, after edits | **31 pass / 0 fail** |
| Live browser campaign test, after edits | **19 pass / 0 fail**, Chromium page errors: 0 |
| Real end-turn executor, co-located eligible units | **3/3 moved** |
| Real end-turn executor, physical General | **1/1 moved** |
| Five-turn planner boundary | **Turns 1–5: 5/5 no-attack assertions; turn 6: attack order** |
| Leader-death/replacement and peace lifecycle checks | **4/4 focused assertions pass** |
| Army-consolidation E2E | **6/6 pass** |
| AI era-war offensive test | **7/7 pass** |
| `tsc --noEmit --pretty false` | **exit 0** |
| Vite live-test build | **916 modules, exit 0**, output 74,281.13 kB |
| `git diff --check` | **exit 0** |

The live browser scenario uses the actual production AI recruitment transaction and confirms a physical General spawn. Its five muster-count assertions invoke the real `decideAITurn` planner hook; the final attack movement is then executed through `triggerPlayerEndTurn` and the production move executor. The test does not run five separate full browser end-turns for the muster phase, resolve combat, or enact leader death/peace in the browser. Death/replacement and peace cancellation are covered by focused lifecycle tests against the production campaign helper.

## Land / sea boundary

The campaign now chooses the nearest capital reachable by land from the AI capital. If every active war target is separated by impassable terrain, it creates no land campaign target. No transport or naval assault was added. I inspected the current decision/run references available in `docs/decyzje/`, `dyspozycje/_handoff/`, and AutoBot runs; the material found on sea raids covers barbarian Sea Peoples, not the separately described AI sea-priority change. Per owner instruction, that remains separate and unimplemented here.

## File identities after changes

SHA-256:

- `gra/src/game/ai.ts`: `6329b51aa7caa5fae584c28e301bb71d1c0da8965817f6465adde45b7153c220`
- `gra/src/game/ai-general-war-campaign.ts`: `a136283e3cd758eccba2d3ff89b8c67daa70bc344722b14970aad9abb995ecec`
- `gra/src/main.ts`: `e14df45f263cdb62bc60fb9729f4d40a79c5458fe133c07dcf3ef7e8b8f1250c`
- `gra/tools/ai-general-war-campaign-test.cjs`: `2eaeb8a02caab3fd6f1c77e19101befe766a7d8f95b31c53e3ae2c69c45663a1`
- `gra/tools/ai-general-war-campaign-live-test.cjs`: `b74d11f473cef430195e7f38fadbe4153c6b01cbba7758029e40987b5331743a`
- `gra/tools/ai-general-war-campaign-live.vite.config.ts`: `73953485d4fddc693542c4ba971c7be554c3aa35fc45ba342b564eb83814217b`
- `00-dispatch-runda4.md`: `7b646a4074acfba81d003df5d6f231b93bc3314515f6d13c574fd035f239f7a0`

## Remaining scope limits

- The real browser EOT proves the attack order moves the physical General and all three test units from a reachable shared hex. The browser fixture uses synthetic Warriors for the additional stack members; ordinary campaign recruitment/spawn remains on the production path for the General.
- City targeting measures reachability from the AI capital's land component. Naval transport, sea-priority behavior, combat resolution, and large-map BFS timing were not tested in this run.
- No Evaluator, Final Control, integration, or deployment was performed by the Operator.
