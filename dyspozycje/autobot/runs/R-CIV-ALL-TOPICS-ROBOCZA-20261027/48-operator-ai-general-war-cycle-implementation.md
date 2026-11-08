# Operator: AI General-led war cycle

**Scope:** implemented the AI wartime campaign cycle only. No commit, merge, push, or deploy. The working tree is shared with parallel operators, so source hashes below identify the exact files inspected at report time; unrelated UI/battle changes may coexist in those files.

## Behavior implemented

- A newly active inter-civilization war starts one campaign per AI owner. The target is the nearest active enemy capital; ties break by owner ID. The target remains fixed while that war is active.
- Campaign recruitment uses the existing capital General offer and `purchaseRecruitmentUnit` transaction. Existing current/prior-era and barracks availability rules, General cap, stock/manpower checks, and production queue behavior remain the authority for whether a General can be bought. A queued General keeps the campaign in recruiting until it physically spawns.
- Once the physical General is available, eligible mobile land units muster toward its live position. The campaign suppresses ordinary military attacks during mustering. It begins the attack on the sixth owner turn after recording five complete muster turns, regardless of path-blocked or still-moving units. The all-in target plan includes the eligible roster so units still in transit continue toward the same target.
- The attack phase reuses the existing all-in capital attack planner with one selected enemy target, so participating eligible forces—including the General—are sent against the same target.
- If the assigned leader dies, the campaign returns to recruitment and resets the muster counter. The prior leader and other surviving General IDs are blocked from reuse for that campaign; a newly spawned physical replacement begins a fresh muster. No active war removes campaign state, so campaign-specific movement/attack orders stop and ordinary AI planning resumes.
- Campaign target, stage, leader ID, blocked General IDs, and gather-turn bookkeeping are persisted in save metadata and restored with validation.

## Files

- Added `gra/src/game/ai-general-war-campaign.ts` for lifecycle, targeting, eligibility, and save/restore helpers.
- Updated `gra/src/game/ai.ts` to route active campaigns through muster/attack orders while preserving non-military commands and normal behavior without a campaign.
- Updated `gra/src/main.ts` to detect active wars, choose targets, recruit via the existing transaction, pass campaign state to the AI planner, and save/restore/reset campaign data.
- Added `gra/tools/ai-general-war-campaign-test.cjs` with focused lifecycle, order, target, and persistence checks.

## Validation

- `node tools/ai-general-war-campaign-test.cjs`: **24 passed, 0 failed**, including an unassembled/path-blocked unit at the hard five-turn boundary.
- `node tools/koszary-gate-test.cjs`: **26/26 passed**.
- `node tools/ai-era-unit-promotion-test.cjs`: **12 passed, 0 failed**.
- `node tools/army-consolidation-e2e-test.cjs`: **6 passed, 0 failed**.
- `node tools/ai-ofensywa-wojna-epoki-test.cjs`: **7 passed, 0 failed**.
- `node tools/rally-point-automarch-test.cjs`: **28 passed, 1 failed**; failure is `General recruitment card displays exactly one General prefix`, in a concurrently edited UI label path outside this campaign implementation.
- `git diff --check`: passed.
- `npm run typecheck`: passed after the concurrent battle UI type mismatch was corrected by its owning operator.

## Limits

- Recruitment waits if the existing gates or resources prevent a General purchase; this preserves production constraints rather than bypassing them.
- The existing army-concentration eligibility predicate excludes non-land, embarked/naval, garrisoned/sieging, civilian, and immobile units. The attack therefore concentrates all units the current predicate considers eligible, not every military unit regardless of tactical state.
- A unit with no valid route may still fail to join the force; the five-turn attack boundary does not wait for it. The implementation does not add alternate target selection if the selected city becomes unreachable.
- Existing alive Generals may lead the initial campaign; after that assigned leader dies, a fresh physical General is required. Replacements respect the current era cap, so an exhausted cap can hold the campaign in recruiting until availability changes.
- The focused lifecycle test exercises the real AI turn planner and checks static wiring for the main recruitment/save hooks. It does not run a full browser simulation of a war onset through purchase, spawn, battlefield movement, and peace.

## Exact identity at report time

- HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`
- `gra/src/game/ai.ts`: `f66803293fa327b3955abc19edd5451f437f560de33b9d987bd92137369d71f6`
- `gra/src/main.ts`: `9853426d44f0f9e6b34cb42323cad29508a83831c60a9186ccb6a00f94e6f68a`
- `gra/src/game/ai-general-war-campaign.ts`: `438fc9030a6cdd9bbfb62b2188508fd2357e029e91928731f394d1f856341734`
- `gra/tools/ai-general-war-campaign-test.cjs`: `f51dead68ab6d658188ea6eed1e9d4881f59dafdb678973b5dd108705fe9f3d1`
- Concurrent failing typecheck source `gra/src/battle/battleScene.ts`: `bcaacc118b536a0f7f0f6ade2808f0df5cb45274f0d3f3d843680e788a568d83`
