# Operator scope and pre-edit allowlist

Task: `R-WEB-BRONZE-FOUNDRY-OUTPUT-25-50-Q1`

Finding: the three bronze recipes share `budynek_huta_przepustowosc` with a global foundry-era multiplier. The current base 50 therefore yields 75 in owner era 2 and 100 in owner era 3. Iron and steel recipes use separate throughput keys but the same multiplier and must remain unchanged.

Planned production behavior: bronze recipes use explicit difficulty-specific throughput values from `econ-params.json` by owner era (era 2 = 25, era 3 = 50, later eras carry forward 50); iron/steel retain their existing 50 × owner-era multiplier. Inputs and their 1 ruda + 1 drewno + 0.1 ruda_cyny recipe ratios remain unchanged.

Pre-edit allowlist:

- `gra/src/game/converters.ts` — recipe era parameter metadata and shared domain/display calculation.
- `gra/src/game/turn-economy.ts` — owner-era data lookup for converter throughput; maintain one shared player/AI path.
- `gra/src/main.ts` — use the same explicit bronze era rows in the player/AI production rate display.
- `gra/data/econ-params.json` — explicit bronze throughput values by owner era and difficulty.
- `gra/tools/foundry-throughput-x2-era-mult-test.cjs` — update its now-obsolete expectations and verify explicit bronze throughput plus unchanged iron/steel scaling.
- `gra/tools/converter-era-scaling-test.cjs` — update any expectations that directly encode the superseded bronze era formula.
- `gra/tools/hud-konwerter-dopasowanie-test.cjs` and `gra/tools/citypanel-konwerter-produkcja-test.cjs` — update asserted bronze display values where needed.
- `gra/tools/foundry-throughput-x2-era-mult-test.cjs` — behavior coverage for abundant inputs, missing inputs/tin, full output, concurrency, iron parity and bronze values.
- This run directory — operator evidence/report only.

Out of scope: global foundry throughput keys/formula for iron/steel; recipe inputs and ratios; output capacities; generated bundles; encyclopedia unless a directly displayed stale 75/100 value is found.
