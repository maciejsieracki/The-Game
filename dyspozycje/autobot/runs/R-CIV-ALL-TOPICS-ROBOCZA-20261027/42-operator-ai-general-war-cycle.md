# Operator investigation: AI General-led wartime cycle

Read-only inspection of the current worktree against the requested behavior: when war begins, AI recruits a physical General, gathers all its military units around the General for five turns, then attacks one enemy as a concentrated army with the General; General death restarts the cycle; peace stops the war campaign. No product files or tests were edited.

## Finding

The requested cycle is **not implemented**. Existing pieces cover separate mechanics, mainly for the human player, but they are not joined into an AI war lifecycle.

| Requested behavior | Current implementation |
|---|---|
| Recruit a physical AI General at war onset | General purchase is exposed to the human CityPanel/Army UI. `main.ts` calls `purchaseRecruitmentUnit(..., { isGeneral: true })` from `onPurchaseGeneral` in its player panel configurations. AI's city production execution at `main.ts` around `37163` buys the chosen ordinary `jednostka` through `purchaseRecruitmentUnit(...)` with no General option. The General offer/count/purchase helper is otherwise generic, but there is no AI caller. |
| Rally all own military around its General for five turns | No war-start/campaign turn counter or five-turn hold exists in `AITurnOpts` or the wartime planners. Peace consolidation (`ai.ts` around `3530–3600`) gathers eligible field units to the capital while `atWarWithCiv` is false. During war, local concentration / front merge is used, and the Army Consolidation E2E test verifies split marches to two enemies. It neither targets a General nor waits five turns. |
| Attack one enemy as one army with the General | Generic `warAllIn` in `main.ts` (`warAllInContextFor`, around `30082`) supplies every currently active war target. With the feature enabled, `ai.ts`'s `planWarArmiesByEnemy` (`~3990`) splits units by enemy owners and assigns groups; `applyWarAllInCapitalToCommands` redirects combat moves toward those capitals. Forced-era war chooses/records campaign waves (`forced-war-waves.ts`, `ai.ts` around `3395–3420` and `3588–3650`) using eligible military units and a local radius-4 group of at least 3. Neither path special-cases `isGeneral`, and neither is one-enemy-only when multiple wars are active. |
| Repeat after General death | There is no AI General recruitment trigger, General-death lifecycle, or restart/reset of a gather timer. The player General path counts living/queued Generals and lets a newly spawned player recruit follow its General; `afterPlayerUnitSpawned` explicitly returns for non-owner-0 units (`main.ts` around `12812`). |
| Stop/refrain after peace | The all-in target context becomes empty when no active war target passes `engage`, and peace consolidation is enabled only when `atWarWithCiv` is false. This stops those particular war orders and returns AI to ordinary behavior. There is no AI campaign state to cancel/reset or General-specific order to clear on peace. |

A unit with `isGeneral` is otherwise a normal combat unit to `ai.ts`: army eligibility checks civilian/garrison/siege/embarkation/naval status, not General status. The `generals.ts` helper currently implements capital purchase validation, era slot counting, and player recruit-follow destination calculation; it does not contain AI campaign behavior.

## Relevant source paths

- `gra/src/game/ai.ts`: turn planner, peace consolidation, forced-war grouping, multi-target war army assignment, and ordinary combat march.
- `gra/src/game/warAllInCapital.ts`: war campaign destination planning and rendezvous.
- `gra/src/game/forced-war-waves.ts`: forced-era war local wave formation and route history; no five-turn wait or General selection.
- `gra/src/game/generals.ts`: General cap/purchase validation and follow-destination helper.
- `gra/src/main.ts`: human General purchase integration (`~26418`, repeated panel setup near `~38827`); AI normal unit purchase (`~37163`); end-turn recruit spawn sets `isGeneral` from queue metadata (`~34463`); AI wartime opts (`~35473–35493`); player-only post-spawn follow hook (`~12812`).
- `gra/src/game/production.ts`: `ProductionItem.isGeneral` queue metadata; generic item support only.

## Existing tests run

- `node tools/army-consolidation-e2e-test.cjs` — **6 passed, 0 failed**. Covers peace gathering and current war behavior (including splitting a two-enemy war into two marches); it does not test a General-led five-turn cycle.
- `node tools/ai-ofensywa-wojna-epoki-test.cjs` — **7 passed, 0 failed**. Confirms current forced-war offensive consolidation/targeting and defender response, with no General or fixed gathering phase.
- `node tools/rally-point-automarch-test.cjs` — **29 passed, 0 failed**. Covers General purchase/follow helpers and player wiring, not AI wartime purchase or command planning.
- `node tools/generals-purchase-runtime-test.cjs` — **9 passed, 0 failed** in real browser. Confirms actual capital purchase, spawn, and player post-spawn General follow.
- `node tools/war-allin-capital-test.cjs` — **91 passed, 4 failed**. The failures are stale historical reference assertions in this 90-turn comparison harness: section 1a expects 3 pre-feature battles but current output is 0; section 6b expects four pinned state hashes but current state hashes differ. The harness header itself says its references were measured on a specific earlier movement-range HEAD, and its base comments describe older baseline hashes. Its behavior assertions for the all-in path otherwise pass. This is baseline/reference drift in the harness as written; it does not establish a failure of the requested General-cycle behavior. A narrow test maintenance action would be to regenerate/review the historical hash/battle references against the intended current AI baseline, keeping the active all-in behavior assertions intact.

## Minimal safe implementation plan

1. Add a pure per-owner campaign state/planner with explicit stages such as `recruiting`, `gathering`, and `attacking`, keyed by the active enemy owner. Start it only on an observed transition into an eligible inter-civilization war; exclude barbarians unless specifically intended.
2. At onset, request one General through the existing capital recruitment transaction and era-cap accounting. Do not mark the five gathering turns complete until the General has spawned and is alive. If the capital cannot produce the General yet, preserve the campaign in `recruiting` and avoid launching the attack.
3. While gathering, reserve one deterministic enemy and direct eligible field combat units, plus the General, to rendezvous on the General's actual hex. Keep home-defense/engaged constraints explicit. Count five complete AI owner turns from the live-General gathering start before enabling offensive commands. Do not split the roster across simultaneous enemies during this phase/campaign.
4. In `attacking`, use the existing path/attack executor against the selected enemy; include the General in the same campaign unit set, with a policy that prevents it from being lost to a separate patrol order. On death, clear the wave/order state and restart at `recruiting` for that still-active war.
5. On peace or target elimination, clear the campaign and its General-follow campaign orders. Persist the small campaign lifecycle in saves so load/resume does not restart or skip the five-turn count. Keep existing diplomacy/peace locks authoritative.
6. Add focused planner/runtime integration coverage for war onset, capital purchase affordability/queue cap, wait-turn boundaries, physical rendezvous and attack, General death/recruit restart, peace cancellation, save/load mid-gather, and multiple-war deterministic target selection.

This is an architecture recommendation only; implementation should be scoped separately from the in-flight barracks/production change.

## Source fingerprints

SHA-256 captured after the read-only checks:

| File | SHA-256 |
|---|---|
| `gra/src/game/ai.ts` | `2d2474198df0fbabcc9c57dcbe39f4f9a1b959d02d4aab2066d2902444c9cbb1` |
| `gra/src/game/generals.ts` | `099572f05103071b817a2e4d466a6b0e85d6969ee160a602e16e60fbf8d0d2c6` |
| `gra/src/game/army-concentration.ts` | `e7257174cba088dee3bb4f3fac4762a78f930bda442d7d042259f255d361cca6` |
| `gra/src/game/warAllInCapital.ts` | `94b1a2a0e06395bb2a317777528381e959708d12cb4489daad1d1117935e0240` |
| `gra/src/game/forced-war-waves.ts` | `5d2d2c143a6de97d051cbb71286b0c913b52f9bc9b002e5d05c2a0237740bd43` |
| `gra/src/game/production.ts` | `f382de35b3262c301b51ac0319540e96f8f65bf2908c9a4e29626ea24a9a2361` |
| `gra/src/main.ts` | `9b8f1d1f16545b27890cf84f9ba92a80e6334d8d31ca645a9f7115782895ae01` |
| `gra/src/game/ai-era-unit-promotion.ts` | `18d94e02d39cff4484dfabda54a69850b3298a174b77b3a998c1df7124241f6b` |
| `gra/tools/army-consolidation-e2e-test.cjs` | `71c3817126b6395a16c2d42d1e044e74705e314fc48457d3c44baecacfb9723d` |
| `gra/tools/ai-ofensywa-wojna-epoki-test.cjs` | `258b36697e1657b8e0d13310bd91d8c037fe6325289225f33bf3c12ee5c17721` |
| `gra/tools/rally-point-automarch-test.cjs` | `04ac31a1487293383c02dc654af3e8f4531ba5b31ec3c5d7f65fd5f7f51fbf2b` |
| `gra/tools/generals-purchase-runtime-test.cjs` | `60053f51bdbc244b031bd7ba2f18ce959d6445c7c747af18785c8679f3084c09` |
| `gra/tools/war-allin-capital-test.cjs` | `f3a28e418d9a1f422719239f9c3bbf3fcca916e8f848a0528894b2eea03cb49e` |
