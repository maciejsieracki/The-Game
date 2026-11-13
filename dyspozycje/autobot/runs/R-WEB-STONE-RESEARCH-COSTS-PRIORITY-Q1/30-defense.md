# Operator defense — generated short wiki summaries

STATUS: PASS — evaluator finding corrected at its source.

The evaluator's FAIL was valid: generated CivPedia `wikiS` summaries still stated Garncarstwo 5 PN, Gospodarka wodna 36 PN, and Koło 44 PN. The bundle generator copies `Wiki‑S` verbatim from the corresponding encyclopedia Markdown sources. The `Wiki‑M` sections were already correct, so the cause was stale `Wiki‑S` source text rather than a generator cache or runtime cost calculation.

Changed only the cost text in these source sections:

- `docs/encyklopedia/technologie/garncarstwo.md`: 5→40 PN
- `docs/encyklopedia/technologie/gospodarka_wodna.md`: 36→180 PN
- `docs/encyklopedia/technologie/ko_o.md`: 44→180 PN

Regenerated `gra/src/data/wikiBundle.json` with `node gra/tools/bundle-wiki-for-game.cjs`. Before replacing the bundle, generated to `/tmp/wikiBundle.generated.json` and compared entries: only `technologie/garncarstwo`, `technologie/gospodarka_wodna`, and `technologie/ko_o` differ; their `wikiS` and `full` content reflects the corrected source, while `wikiM` remains unchanged. No other encyclopedia entries changed. The final bundle has matching requested costs in both `wikiS` and `wikiM` for all three technologies. Brązownictwo remains 180 PN in both summaries and its source/data are unchanged.

Verification:

- Bundle assertions: all three technologies show 40/180/180 PN in both `wikiS` and `wikiM`; Brązownictwo remains 180 PN.
- `node gra/tools/stone-research-costs-test.cjs`: 44 pass, 0 fail; exercises actual `techCost`, tempo 1/2/4, and unchanged Brązownictwo.
- `node gra/tools/tech-pottery-fifth-test.cjs`: 45 pass, 0 fail; preserves the four-prerequisite rule and fifth position.
- `npm run typecheck` from `gra/`: pass.
- `git diff --check`: pass.

The prior `20-evaluator.md` FAIL is retained as the finding that prompted this correction. No evaluator re-pass, final control, push, or deploy has been performed here.
