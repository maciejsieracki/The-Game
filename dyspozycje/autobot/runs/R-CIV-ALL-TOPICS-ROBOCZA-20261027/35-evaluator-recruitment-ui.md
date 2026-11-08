# Evaluator audit: recruitment and army UI

Result: **PASS-WITH-NOTES**

Scope: independent review of `34-operator-recruitment-ui.md` and current empire mass recruitment, quantity cards, recruit row visibility, Manpower/Army HUD count, and army merge layout. No product or test source edits were made.

## Diff and source identity

- HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`
- Current tracked worktree patch SHA-256 (`git diff HEAD --binary`): `a96cac1248aa3b4e166b5b337c605a8c99e1793d0497720fd735d809af69de54`
- The source hashes relevant to this review match the Operator's captured values. `src/game/manpower.ts`, which was not in that report's source list, currently hashes to `bbcafbe0400e756223e79d9d5651dc6db15b05bd93a45225d212fab69fd1e38c`.

| Source file | SHA-256 |
|---|---|
| `gra/src/ui/empireDetailPanel.ts` | `a3f58503ac5f366c0b3cd5d7290397f548195d92333b8cdf74a59696a76432b9` |
| `gra/src/ui/cityPanel.ts` | `7e02aff6bf46130adf6057dcc795e2a9f9c195c0e9c651f5c59c0f8a80f043db` |
| `gra/src/ui/unitRecruitCard.ts` | `ee94931f506303e6d5c5befb9ac0dff49e661b500bd470a7fccc72ca74269806` |
| `gra/src/ui/armyMergePanel.ts` | `9deab30da44906eafa0411509773f705f041f6df5c2c44a8391dfff192e23ccb` |
| `gra/src/ui/hud.ts` | `7007363bfa2a279c11e40b8c4a35028bc00a5838bd4f94e374c32f22f3c5f219` |
| `gra/src/game/production.ts` | `efef983f108b36b180488308a3573eb73c1c3afec493fd7ccf603c854a2b57de` |
| `gra/src/game/manpower.ts` | `bbcafbe0400e756223e79d9d5651dc6db15b05bd93a45225d212fab69fd1e38c` |
| `gra/src/main.ts` | `a9e9875dfa204f4bdc51b8635d2f36b37444738320647551a85638b778c7742d` |

## Findings

No blocking defect found in the reviewed UI behavior. The five reported checks were rerun and passed. Real Chromium coverage confirms 24 city sections fit the 404px recruitment panel without horizontal overflow; quantity controls enforce bounds and defer the callback/resource fixture changes until confirmation; unavailable unit rows remain visible with a disabled reason and become enabled when stock is added; manpower-to-full-unit arithmetic remains consistent across the HUD and empire panel fixture; and the army merge panel remains in viewport with a reachable final row, visible actions, and no horizontal overflow at the tested viewport sizes. The merge test also confirms both button callbacks and has a passing negative control for the old layout.

The mass-recruitment test's real-DOM portion renders city sections and invokes a supplied mount callback that inserts a simple stand-in card. It separately source-checks that production wiring calls the shared CityPanel renderer. Its purchase transaction checks are static ordering/preflight checks, not a live end-to-end purchase through the game backend. The quantity-card test builds the real component, but its purchase callback and resource updates are a fixture. The Manpower test bundles and executes the actual shared calculation module and checks source wiring with regex; it does not mount the full production HUD/panel in a browser. These scopes support the tested UI contracts without establishing complete in-game mass-purchase behavior.

The army merge test validates the listed viewport/layout contract at 1141×1451 and 900×620, including a 40-unit case. It does not establish behavior at every possible viewport or device. No responsive layout issue was reproduced in the tested sizes.

## Reproduced checks

- `node tools/empire-mass-recruitment-test.cjs`: 21 passed, 0 failed.
- `node tools/recruit-card-quantity-real-render-test.cjs`: 25 passed, 0 failed.
- `node tools/recruit-list-visibility-ui-test.cjs`: 15 passed, 0 failed.
- `node tools/hud-armia-chip-jednostki-test.cjs`: 60 passed, 0 failed; both temporary negative-control mutations were detected and the source was restored. The post-run `manpower.ts` hash matches the reviewed current hash above and `git status` shows no change to that file.
- `node tools/army-merge-panel-scroll-real-render-test.cjs`: 21 passed, 0 failed.
