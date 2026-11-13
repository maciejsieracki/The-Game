# Independent Final Control — R-WEB-BRONZE-OUTPUT-50-75-Q1

STATUS: PASS
REVISION: `f3e3e5fc4474fe12fc3971fab866ed70b94d62c9`
BASE: `0329072b1346116011dc56edce249739e93e2426`

## Control findings

The candidate implements the approved 50/t owner-era-2 and 75/t owner-era-3+ bronze targets for easy, normal, and hard. Each of the three canonical bronze recipes selects the same explicit rows. The selector carries the latest configured row forward, and uses the earliest configured row before era 2. The three recipes retain inputs of 1 ore, 1 wood, and 0.1 tin per cycle, with their output amounts unchanged.

The tick and player-facing paths use the shared era-row selector and throughput data. The focused checks exercise live `advanceCityEconomy` output for a player in era 2 and AI in era 3, HUD owner-era rates, and city-panel rates and inputs. Iron and steel still use the unchanged base 50 and era multiplier, yielding 50/75/100 by owner era. Current card text remains accurate; the historical 25→50 wording in `converters.ts` is explicitly attributed to the prior dated decision, while current comments and parameter descriptions state the new bronze rates.

The source changes are limited to `econ-params.json`, the approved bronze comments in `converters.ts`, and the four allowlisted focused tests. The run adds its dispatch, scope, baseline, and operator evidence. No recipes, iron/steel values or formulas, costs, unrelated runtime paths, generated artifacts, or historical run records were changed. The only untracked run artifact at review time was the independent evaluator report. `git diff --check` is reported clean by the evaluator.

## Gates reviewed

- PASS — foundry throughput test: 159 passed, 0 failed.
- PASS — converter era and live player/AI economy tick: 117 passed, 0 failed.
- PASS — HUD converter display: 20 passed, 0 failed.
- PASS — city-panel converter display and input ratios: 100 passed, 0 failed.
- PASS — converter regression suite: 49 passed, 0 failed.
- PASS — `npm run typecheck`.
- PASS — scope and display review; no browser run was required because the browser slot was reserved and existing shared-path deterministic UI fixtures cover this parameter-only change.

No blocking finding. Ready for root integration, subject to the established release approval gate.
