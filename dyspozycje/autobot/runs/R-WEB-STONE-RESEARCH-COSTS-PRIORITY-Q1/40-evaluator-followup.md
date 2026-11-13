STATUS: PASS — prior wiki-summary finding resolved.
DOMAIN: GAME
TEMAT: R-WEB-STONE-RESEARCH-COSTS-PRIORITY-Q1
REVISION: c6e464fac9df017b3c953b9c603ece6480d4caea
PREVIOUS FINDING: `20-evaluator.md` identified stale generated `wikiS` summaries at 5/36/44 PN. That report is retained unchanged.

WYNIK: The three encyclopedia source pages, generated `wikiS`, and generated `wikiM` now agree: Garncarstwo 40 PN, Gospodarka wodna 180 PN, Koło 180 PN. Brązownictwo remains 180 PN in both summaries and its data/source are unchanged. The original technology data change remains scoped to exactly the three requested `Koszt nauki` fields; all other technology fields, including prerequisites, levels, and unlocks, are unchanged.

SCOPE: Compared the bundle at `0764ab4d6` with this candidate. Exactly three encyclopedia records changed: `technologie/garncarstwo`, `technologie/gospodarka_wodna`, and `technologie/ko_o`. In each, `wikiS` and `full` changed to include the corrected short summary; `wikiM` is unchanged. The only other files added since the prior candidate are the three allowed source pages with corrected Wiki-S cost text and this run's `30-defense.md`. `gra/data/tech.json` is byte-identical to the previously evaluated candidate.

CHECKS:
- PASS — `node tools/stone-research-costs-test.cjs` from `gra/`: 44 pass, 0 fail, including actual `techCost`, tempo 1/2/4, and unchanged Brązownictwo.
- PASS — `node tools/tech-pottery-fifth-test.cjs` from `gra/`: 45 pass, 0 fail.
- PASS — `npm run typecheck` from `gra/`: exit 0.
- PASS — `git diff --check 0764ab4d6 c6e464fac9df017b3c953b9c603ece6480d4caea`.
- PASS — Bundle and source content assertions for both wikiS and wikiM, plus Brązownictwo 180 PN.

Brązownictwo 180→480 remains unconfirmed by the owner and intentionally unchanged.
