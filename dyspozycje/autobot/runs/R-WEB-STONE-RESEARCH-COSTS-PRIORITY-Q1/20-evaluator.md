STATUS: FAIL — generated CivPedia short summaries still show the prior costs.
DOMAIN: GAME
TEMAT: R-WEB-STONE-RESEARCH-COSTS-PRIORITY-Q1
REVISION: 0764ab4d625622b68e5463f9d17b3d56987d0340

WYNIK: The data and runtime behavior match the request: Garncarstwo = 40 PN, Gospodarka wodna = 180 PN, Koło = 180 PN. All other technology records retain their prior values and fields. Brązownictwo remains 180 PN, intentionally pending owner clarification. The three encyclopedia source pages and their generated `wikiM` entries show the requested costs. However, the generated `wikiBundle.json` `wikiS` summaries remain stale: Garncarstwo says 5 PN, Gospodarka wodna says 36 PN, and Koło says 44 PN. The generated wiki is therefore not aligned and the candidate does not pass yet.

SPRAWDZENIA:
- PASS — `node tools/stone-research-costs-test.cjs` from `gra/`: 44 pass, 0 fail; exercises `techCost` and tempo 1/2/4 for the three changed technologies and Brązownictwo.
- PASS — `node tools/tech-pottery-fifth-test.cjs` from `gra/`: 45 pass, 0 fail; checks Garncarstwo's four prerequisites, fifth position, and unchanged level.
- PASS — `node ./node_modules/typescript/bin/tsc --noEmit` from `gra/`: exit 0.
- PASS — Compared `gra/data/tech.json` against parent `86c97f387`: exactly three record fields changed, each `Koszt nauki` with values 5→40, 72→180, and 88→180. All other technology fields/records, including prerequisites, levels, and unlocks, are unchanged. `tempo_gry` is unchanged.
- PASS — Brązownictwo data remains at 180 PN; no Brązownictwo changes in the candidate.
- FAIL — `gra/src/data/wikiBundle.json` short wiki summaries (`wikiS`) do not reflect the new values. The long summaries (`wikiM`) and source encyclopedia pages are aligned.
- PASS — `git diff --check 86c97f387 0764ab4d6`.

REQUIRED: Regenerate/update the bundled short summaries for these three technologies, ensure the resulting bundle diff stays scoped, then request a fresh evaluator pass. No source changes were made during this evaluation.

WERYFIKACJA TEMPA: Runtime `applyTempoKoszt` assertions passed for 1×/2×/4×; the changed base costs therefore resolve to 40/80/160, 180/360/720, and 180/360/720 respectively.

Brązownictwo 180→480 remains unconfirmed by the owner and is intentionally unchanged.
