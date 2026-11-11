# Operator scope and pre-edit allowlist

Task: `R-WEB-BRONZE-OUTPUT-50-75-Q1`, base commit `0329072b1346116011dc56edce249739e93e2426`.

Owner target: bronze foundry throughput is 50 cycles/turn in owner era 2 and 75 cycles/turn in owner era 3 onward. Existing explicit bronze rows are 25 and 50, respectively. Do not change `budynek_huta_przepustowosc` or global foundry era multiplier: iron/steel continue using 50 × owner-era multiplier (50/75/100 for eras 1/2/3).

Pre-edit allowlist:

- `gra/data/econ-params.json` — only bronze explicit row values and their current descriptions/history for era2 and era3+ at all difficulties.
- `gra/src/game/converters.ts` — only current comments/docs naming bronze's old values.
- `gra/src/main.ts` — only if current rate descriptions encode 25/50 rather than reading the parameter values.
- `gra/data/building-cards-top5.json` or other current player-facing cards — only if a search proves an explicitly stale current 25/50 bronze rate.
- `gra/tools/foundry-throughput-x2-era-mult-test.cjs` — replace 25/50 bronze expectations; verify exact rows, carry-forward, actual converter input/output limits, and iron/steel unchanged.
- `gra/tools/converter-era-scaling-test.cjs`, `gra/tools/hud-konwerter-dopasowanie-test.cjs`, `gra/tools/citypanel-konwerter-produkcja-test.cjs` — update explicit stale assertions and verify exact 50/75 displays plus live player/AI production.
- This run directory — scope and evidence only.

Out of scope: recipe input ratios, any iron/steel value/formula, all non-bronze parameters, global converter era multipliers, research/building costs, AI behavior outside shared throughput data, generated bundles, historical run artifacts, and stale history that is explicitly marked historical.

No source edits have been made yet. Baseline relevant tests will be run and recorded before implementation.
