# Operator report

Base: `4bd9b522aae2a2ed0c770965f5eeaacc7d6eeb8d` (`/workspace/main-integration-20261029`, `main`).

## Baseline

Command from `gra/`: `node tools/glod-wojska-karencja-test.cjs`

Result: exit 1, **29 pass / 10 fail**. Failures were the first-turn reserve expected as `-20`, the post-recovery counter expected to restart while the synthetic surplus left enough food for the next army cost, and eight food-upkeep literals in the territorial/camping scenarios.

## Contract evidence

- `gra/data/econ-params.json` records `glod_wojska_karencja_tur.normal = 3` and describes three consecutive hungry turns before HP attrition. The HP fraction remains `0.08` on normal; no balance parameter was changed.
- `gra/src/game/empire-food.ts` computes `glodWojska` from the pre-clamp central balance, then clamps persisted `central` with `Math.max(0, central)`. The reserve is therefore zero in deficit turns while the hunger flag and consecutive-turn counter still record the deficit.
- `gra/src/game/economy-upkeep.ts` applies own/off-territory and camping multipliers, then multiplies the result by `R_STAWKI_FALA1_FALA2_MULT`.
- `gra/src/game/r-stawki-strojenie.ts` defines that multiplier as FALA1 `2` times FALA2 `2`, hence `4`. The decision history in `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (R-NADMIAR-POOLS, row near 663) and `dyspozycje/WERSJE.md` (FALA 215, near 3634) records ×4 unit upkeep and military food as deployed.

## Change

Updated only `gra/tools/glod-wojska-karencja-test.cjs`. The reserve assertion now checks the clamp and separately checks that the deficit is recorded. The recovery fixture gives a positive reserve small enough for the following army cost to cause a fresh deficit, so the counter-reset assertion tests the intended transition. Upkeep literals now include the deployed ×4 cost scale while retaining the territorial ×1/×2 and camping ×0.5 semantics.

## Verification

Command from `gra/`: `node tools/glod-wojska-karencja-test.cjs`

Result: exit 0, **40 pass / 0 fail**. Product helpers and data were read-only. No browser, build, global registry, or commit operation was used.
