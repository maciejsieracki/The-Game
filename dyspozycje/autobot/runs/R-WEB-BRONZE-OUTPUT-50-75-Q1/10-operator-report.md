# Operator report — R-WEB-BRONZE-OUTPUT-50-75-Q1

Base: `0329072b1346116011dc56edce249739e93e2426`; branch `codex/bronze-50-75`.

## Change

The explicit bronze rows in `gra/data/econ-params.json` now use 50/t for owner era 2 and 75/t from owner era 3 onward, for easy/normal/hard. Epoch 1 continues to carry the first configured row, so the bronze UI/runtime is 50/t there too. The three bronze recipes keep their existing explicit era-row mapping, shared owner-era lookup, input ratios, and output amount. Iron and steel still use the unchanged global base 50 × owner-era multiplier (era1/2/3 = 50/75/100).

Updated current comments and changed old bronze expectations in the focused tests. Current building card text already says 50 cycles/t with higher later-era output, which remains accurate; no card edit was needed. No current documentation was found stating obsolete 25/50 bronze values.

## Verification

Before edits, all focused baseline checks passed: foundry 159, converter-era 117, HUD 20, city panel 83.

After edits:

- `node tools/foundry-throughput-x2-era-mult-test.cjs` — 159 passed. Checks all difficulty rows, 50/75 carry-forward, all three bronze recipes, input consumption, shortages, full output cap, bronze/iron concurrency, and unchanged iron/steel scaling.
- `node tools/converter-era-scaling-test.cjs` — 117 passed. Real `advanceCityEconomy` run produces 50 bronze/t for a player in era 2 and 75 for AI in era 3 using the same path.
- `node tools/hud-konwerter-dopasowanie-test.cjs` — 20 passed. Live HUD function reports bronze 50/75; iron/steel still report 75/100 in owner era 2/3.
- `node tools/citypanel-konwerter-produkcja-test.cjs` — 100 passed. Shared production display reports bronze 50/75 and unchanged iron 75/100, retaining 1:1:0.1 inputs.
- `node tools/converters-test.cjs` — 49 passed.
- `npm run typecheck` — passed; `econ-params.json` parses; `git diff --check` clean.

No browser/runtime screenshot was used; browser slot was unavailable. The actual converter production pipeline and extracted HUD function are covered by the tests above.

Files changed outside this run: `gra/data/econ-params.json`, `gra/src/game/converters.ts`, and four focused tool tests (foundry, converter era, HUD, city panel). No research costs, AI-specific formula, iron/steel values, or other output rates changed.
