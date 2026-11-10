# Independent Evaluator

STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-BRONZE-FOUNDRY-OUTPUT-25-50-Q1
REVISION: dc2292740e487293c26f653f7713ee996a76d0db

## Finding

The candidate implements the requested owner-era bronze rates in the active production pipeline. All three bronze recipes carry the same explicit parameter-row mapping: 25/t from owner era 2 and 50/t from owner era 3 onward. Era 1 does not need a separate row because the first bronze foundry is unlocked in era 2. The rows exist for easy, normal, and hard difficulty. The 1 ore + 1 wood + 0.1 tin recipe inputs are unchanged.

Runtime and preview select the row using the building owner's resolved era, then pass the resulting rates through the shared `runConverters` path. The HUD uses `empireEpochForOwner` and the same row selector; the city panel calls the shared domain display function. Iron and steel remain in `CONVERTER_FOUNDRY_ERA_RECIPE_IDS`, with their existing 50 × owner-era multiplier. Only bronze was removed from that set. The `budynek_huta_przepustowosc` base row and iron/steel throughput rows remain unchanged; the new bronze rows are separate.

No in-scope behavior defect or out-of-scope source change was found. The diff is limited to the approved parameter, converter, economy, HUD, tests, and run-evidence files. The candidate is not pushed or merged.

## Verification

- PASS — `node tools/foundry-throughput-x2-era-mult-test.cjs`: 159 passed, 0 failed. Confirms all three bronze recipe mappings, 25/50 data values across difficulties, ore/wood/tin ratios, input shortage, missing tin, full output capacity, concurrent bronze and iron, iron/steel era multipliers, and per-building production display.
- PASS — `node tools/converter-era-scaling-test.cjs`: 117 passed, 0 failed. A real `advanceCityEconomy` tick produced 25 bronze for the era-2 player and 50 for the era-3 AI using one owner-era resolver.
- PASS — `node tools/citypanel-konwerter-produkcja-test.cjs`: 83 passed, 0 failed. The shared display produces the expected bronze values; its building fixtures cover bronze, iron foundry, and great foundry.
- PASS — `node tools/hud-konwerter-dopasowanie-test.cjs`: 20 passed, 0 failed.
- PASS — `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`: exit 0.
- PASS — `git diff --check HEAD^ HEAD`: exit 0; worktree remained clean after checks.
- PASS — Scope review: all ten changed paths are within the pre-edit allowlist and run evidence; no generated bundle or encyclopedia changes.

## Coverage note

The full economy-tick player/AI parity test directly exercises the tier-1 bronze building. The other two bronze recipe mappings are covered by the same per-recipe runtime throughput map and by direct building display fixtures; their recipe-to-building routing is shared through `converterBuildingIdForRecipe`. I found no separate tier-specific production branch that would undermine that shared behavior.
