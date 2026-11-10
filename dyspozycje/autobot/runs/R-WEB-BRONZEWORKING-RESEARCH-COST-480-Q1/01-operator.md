# Operator report — R-WEB-BRONZEWORKING-RESEARCH-COST-480-Q1

## Result

Brązownictwo now has a base research cost of 480 PN. The approved earlier costs remain Garncarstwo 40 PN, Gospodarka wodna 180 PN, and Koło 180 PN. Tempo multipliers remain 1/2/4, so Brązownictwo costs 480/960/1920 PN.

Updated both Wiki‑S and Wiki‑M in `docs/encyklopedia/technologie/brazownictwo.md`, then regenerated `gra/src/data/wikiBundle.json` with `node gra/tools/bundle-wiki-for-game.cjs`. A temporary generator output comparison showed exactly one changed encyclopedia entry: `technologie/brazownictwo`.

The research cost regression test now checks the four approved base costs, actual `techCost` results, all three tempo values, unchanged epoch/level/prerequisites/unlocks, the bundled Bronze Wiki‑S/Wiki‑M text, and a digest of the complete technology dataset after normalizing the four approved costs. The digest confirms every other technology row and field remains unchanged.

## Verification

- `node tools/stone-research-costs-test.cjs` — 48 pass, 0 fail.
- `npm run typecheck` — passed.
- `node gra/tools/bundle-wiki-for-game.cjs --output /tmp/bronzeworking-480-wiki-candidate.json` — 22 chapters and 170 encyclopedia entries; compared with the checked-in bundle, only `technologie/brazownictwo` differed.
- `git diff --check` — passed.

## Scope

No changes to research mechanics, tempo multipliers, prerequisites, epochs, levels, unlocks, or other technology costs. Candidate commit only; no push, merge, or deployment.
