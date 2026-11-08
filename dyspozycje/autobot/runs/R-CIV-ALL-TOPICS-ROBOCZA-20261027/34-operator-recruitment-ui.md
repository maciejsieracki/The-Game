# Operator round 2: recruitment and army UI regressions

Scope: requested UI-only checks on current worktree. Product files were not edited during this validation. No deploy or push.

## Results

All five requested checks passed; no failure needs correction.

- `node tools/empire-mass-recruitment-test.cjs` — **21 passed, 0 failed**. Chromium confirms per-city shared recruitment cards render, counters show, and a many-city list fits the 404px panel without horizontal overflow. Static transaction checks confirm gold, stock, manpower, and water preflight occurs before mutation.
- `node tools/recruit-card-quantity-real-render-test.cjs` — **25 passed, 0 failed**. Real-render checks cover quantity controls, min/max, keyboard entry, no resource mutation before confirmation, atomic batch callback/cost, reset, and disabled-card affordances. No page or console errors.
- `node tools/recruit-list-visibility-ui-test.cjs` — **15 passed, 0 failed**. Unit rows remain visible with zero wood and correctly show disabled state, missing-resource chip, and reason; adding wood enables recruitment. No page errors.
- `node tools/hud-armia-chip-jednostki-test.cjs` — **60/60 passed**. HUD and empire panel derive recruit-equivalent counts from the shared manpower cost calculation; fixture/mutation checks confirm consistency and foreign-owner exclusion.
- `node tools/army-merge-panel-scroll-real-render-test.cjs` — **21 passed, 0 failed**. Chromium confirms viewport fit, scrolling/last-row reachability, responsive three-column unit grid, CTA visibility, no horizontal overflow, and both button callbacks. Negative control confirms the old layout fails the viewport/scroll contract.

## Current source fingerprints

SHA-256 values captured after the checks; paths are relative to `gra/`:

| File | SHA-256 |
|---|---|
| `src/ui/empireDetailPanel.ts` | `a3f58503ac5f366c0b3cd5d7290397f548195d92333b8cdf74a59696a76432b9` |
| `src/ui/cityPanel.ts` | `7e02aff6bf46130adf6057dcc795e2a9f9c195c0e9c651f5c59c0f8a80f043db` |
| `src/ui/unitRecruitCard.ts` | `ee94931f506303e6d5c5befb9ac0dff49e661b500bd470a7fccc72ca74269806` |
| `src/ui/armyMergePanel.ts` | `9deab30da44906eafa0411509773f705f041f6df5c2c44a8391dfff192e23ccb` |
| `src/ui/hud.ts` | `7007363bfa2a279c11e40b8c4a35028bc00a5838bd4f94e374c32f22f3c5f219` |
| `src/game/production.ts` | `efef983f108b36b180488308a3573eb73c1c3afec493fd7ccf603c854a2b57de` |
| `src/main.ts` | `a9e9875dfa204f4bdc51b8635d2f36b37444738320647551a85638b778c7742d` |

The corresponding test files were also hashed at check time:

| File | SHA-256 |
|---|---|
| `tools/empire-mass-recruitment-test.cjs` | `e7adecd68cfd24ce7e1f86675f8f00357011a476fde31df59e3a17cd07d0c669` |
| `tools/recruit-card-quantity-real-render-test.cjs` | `0c7d7933c85d1a469f9a90b29618b47aeb17dda61ec8260061f5058b63f66f10` |
| `tools/recruit-list-visibility-ui-test.cjs` | `2ab73a2e13497e3c1a3be5649bc92287d0ec5bf35dc5f6c6991aee4dc8f7b0cb` |
| `tools/hud-armia-chip-jednostki-test.cjs` | `45b3c0cdc5a0dc3bc44b4911c2eb2787b72715ee7feab425ddbce781ba1173ff` |
| `tools/army-merge-panel-scroll-real-render-test.cjs` | `58b0cb4e6323b79a5a378e5c9fc8ef9cd7c7c55826f6095bff9f08771c8ff628` |

No corrective change is indicated by these checks. The HUD test includes negative-control mutations of its test fixture/source and reports that it restored the source; the captured `src/game/manpower.ts` was not part of the source-hash set.
