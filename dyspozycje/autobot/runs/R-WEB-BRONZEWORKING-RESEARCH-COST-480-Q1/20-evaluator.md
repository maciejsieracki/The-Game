# Independent evaluator — R-WEB-BRONZEWORKING-RESEARCH-COST-480-Q1

## Verdict

PASS. Candidate `d3216eb2a2e3d8e959e560f21e3c47109819bae6` matches the owner-approved 480 PN cost change and the requested scope.

## Scope evidence

- Compared `gra/data/tech.json` at `HEAD^` with the candidate: exactly one field changed across the entire technology dataset — Brązownictwo `Koszt nauki`, 180 → 480. There were no other technology field, cost, prerequisite, level, epoch, or unlock changes.
- Confirmed Garncarstwo 40 PN, Gospodarka wodna 180 PN, and Koło 180 PN remain the approved costs.
- Comparing the prior and candidate wiki bundles showed exactly one changed encyclopedia entry, `technologie/brazownictwo`; its changed fields are `wikiS`, `wikiM`, and `full`. Wiki-S and Wiki-M now show the 480 PN cost.
- Regenerated the bundle to `/tmp/bronzeworking-480-evaluator-wiki.json`; it matched the checked-in bundle at every path.

## Independent gates

- `node gra/tools/stone-research-costs-test.cjs` — 48 pass, 0 fail. This exercises `techCost` and tempo multipliers 1/2/4 for all four approved technologies and checks their level, epoch, prerequisites, and unlocks, plus a digest of the full technology dataset after normalizing the approved costs.
- `npm run typecheck` from `gra/` — passed.
- `git diff --check HEAD^ HEAD` — passed.

No browser check was needed: runtime research costs are sourced from the technology dataset, and the test exercised the actual `techCost` and tempo functions.
