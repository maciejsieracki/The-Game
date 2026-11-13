# Operator R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1 — R2 live result

**Status: PARTIAL; stage 8/11 remains open. No product change, commit, deployment, or push.**

Run `live-multicycle-414943-k58prw` used the production bundle in Chromium with a generated 28v28 mixed roster (20 ranged, 8 mounted per side). The map and battle loaded with no browser console errors. The first production activation completed all 28 player units; all were processed and eight changed position. The next round was reached, and a pointer order on a member of an eight-unit formation group dispatched through the normal grouped-order path.

The deterministic exact-target melee attack passed: the production canvas picker selected `atk27`, then exact-clicked `def0` at legal adjacent range. The combat trace records actual `RuntimeBattleUnit.bu.hp` falling from **80 to 62**. No product defect was observed for exact-target attack.

Attack-march remains **unresolved, not failed**. The pointer assigned the expected `attackMove` order to empty waypoint `(28,60)` on a path through enemy `def0`. At issue time, the trace had advanced to `turnIdx:52` while `atk27`'s production turn-order index was 27. Although the fixture reset `acted=false` earlier, scrolling/selecting/pointer setup consumed the unit's turn in the intervening background simulation. In the bounded observation the unit stayed at `(24,60)` with the order retained and `def0` remained at 1 HP; no new hit event followed the prior exact attack. Thus the order was issued after the selected unit's turn had passed, and this run did not test attack-march execution during an eligible active turn. The harness's assumption that the order would immediately resolve the threat was invalid for this timing. Do not count this as a product regression or a PASS.

Evidence:

- `live-multicycle-414943-k58prw/execution-trace.json`
- `live-multicycle-414943-k58prw/1793330176489-failure.json`
- `live-multicycle-414943-k58prw/1793330176489-failure.png`
- Production bundle SHA-256: `89714f1a5fc354e17367fc03add6a7edbc50a1a0045abc1c6cc928b9de78a39b`

The temporary build and browser were closed/cleaned; the Chromium slot was released to the settings Final Control operator. A narrow offline follow-up protocol is prepared: use a deterministic pair and revalidate at the exact order issue that the actor's `turnOrder` index is still greater than or equal to `turnIdx` and `acted===false`; queue the production attack-march order and press the actual Space control to consume it at its eligible activation, then independently assert (1) actual enemy HP loss/death while crossing the route and (2) continued movement toward the empty waypoint after the threat is removed. This avoids another large-army run. The follow-up is **WSTRZYMANY**: parent halted further builds because the overlay has only ~262 MB free. No process is active and this item is not marked in progress or complete.
