# Operator report — R-WEB-BRONZE-FOUNDRY-OUTPUT-25-50-Q1

Status: **PASS — candidate committed, not pushed or merged**

Implemented owner-era throughput rows for all three bronze output recipes. At owner era 2 (Bronze), each produces up to 25 bronze/t; at owner era 3 (Iron) and later, each produces up to 50/t. These values come from difficulty-specific `econ-params.json` rows. Bronze recipe inputs remain 1 ore + 1 wood + 0.1 tin per cycle. Iron and steel retain their existing base 50 and owner-era multiplier.

The same bronze row selection now drives the real economy tick, the resource preview, the building production display, and the player/AI HUD. This preserves owner routing and avoids a preview/UI/runtime mismatch.

Behavior gates passed:

- `node tools/foundry-throughput-x2-era-mult-test.cjs` — 159 passed; covers explicit 25/50 rows, abundant inputs, shortages, missing tin, full output stock, concurrent bronze and iron, and unchanged iron throughput.
- `node tools/converter-era-scaling-test.cjs` — 117 passed; exercises player era 2 and AI era 3 in one real economy tick, returning 25 and 50 bronze respectively.
- `node tools/citypanel-konwerter-produkcja-test.cjs` — 83 passed.
- `node tools/hud-konwerter-dopasowanie-test.cjs` — 20 passed.
- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` — passed.
- `git diff --check` — passed; worktree clean after commit.

Candidate commit: `a2ee08bc561c1a70c532f13070bcef0590de3f2e` (`Fix bronze foundry output by owner era`) on `codex/bronze-output-25-50`.
