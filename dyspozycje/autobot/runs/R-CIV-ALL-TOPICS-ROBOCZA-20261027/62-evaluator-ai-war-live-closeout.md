# AutoBot Evaluator — AI war campaign against human owner 0

**Verdict: PASS.** Independent review and reproduction confirm that major AI can target human owner ID 0, recruit and spawn a physical General, muster for five complete owner turns, begin an attack on the sixth, and preserve the active campaign through its save metadata path.

## Reviewed source identity

- Base HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`; validation applies to the uncommitted working tree.
- `gra/src/main.ts`: `4a152bd077153f221a5ac872bc0f173d49fcd6e10f8f49009a36e670cfecaea1`
- `gra/src/game/ai-general-war-campaign.ts`: `8b1f394c0fe8c4806b19f178e0f6455f0ab86147fdd9ffc8cbef9c6d16d290f2`
- `gra/tools/ai-general-war-campaign-test.cjs`: `fbf64b671fb568c29fabb8310ba4190e21c1af419bf37dec31b86b71be2d44aa`
- `gra/tools/ai-general-war-campaign-live-test.cjs`: `71d8bc83894683c3c367363aa2c65cfb159371280d6acea0c4bb3789209c4e14`
- `gra/tools/ai-general-war-campaign-live.vite.config.ts`: `e30e226f37fb1f868f05d798680ad22faf667f1a632efa962d900b092135d656`

## Independent reproduction

- `node tools/ai-general-war-campaign-test.cjs` — **25 passed, 0 failed**. The save/load regression preserves target owner 0; malformed and negative campaign records remain rejected.
- `node tools/ai-general-war-campaign-live-test.cjs` — **16 passed, 0 failed** in Chromium. Reproduced actual player-capital founding, AI declaration/active target selection, capital recruitment transaction, physical General spawn, next-owner-turn leader binding, five complete muster turns with no attack, sixth-turn march toward the selected human capital, and attack-campaign save metadata roundtrip. No page errors.
- `npm run typecheck -- --pretty false` — **PASS**.
- Scoped `git diff --check` — **PASS**.

## Review notes

The production candidate previously excluded owner 0 in the war-target filter and save restore. The current source permits nonnegative owners while excluding self, barbarian/eliminated owners, and malformed/negative save entries. The attack assertion adds one test-only passable mobile Warrior because the seeded human-capital map did not provide an AI mobile roster; General recruitment and spawning remain on the production path. Battle resolution itself is covered by the separate battle tests.

No product changes, commit, publication, or deployment were made by this evaluator. Large-empire performance was explicitly not tested in this task.
