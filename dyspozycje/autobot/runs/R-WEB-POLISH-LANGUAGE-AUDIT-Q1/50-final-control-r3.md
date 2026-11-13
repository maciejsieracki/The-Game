# R-WEB-POLISH-LANGUAGE-AUDIT-Q1 — Final Control r3

STATUS: FAIL — the focused language/DOM checks pass, but the gating TypeScript check fails; this batch is not deploy-ready.
DATA: 2026-11-10
ZAKRES: runda 3 — two history text corrections, the unit-card Top3 presentation formatter, its focused DOM test, and this run's reports. No source edits or commits by Final Control.

## Potwierdzone

- The focused test passes: `cd gra && node tools/unit-top3-player-language-test.cjs` — it rendered and checked all **75/75** currently populated Top3 sections through the real unit adapter and entity-card renderer in jsdom. The test covers the approved label families and combined forms, unknown `UnknownLabel` fallback, unchanged source Top3 data, and the rendered iButho history. This is DOM harness coverage, not a browser session.
- `gra/data/units.json` has exactly two changed values, both `Historia`: Evocati's agreement correction (“niektórzy źródła” → “niektóre źródła”) and iButho's malformed phrase (“dzirot kolący” → “krótka, ciężka włócznia kłująca”). The latter wording is already present in the Impi history in `units.json:1243` and `docs/encyklopedia/jednostki/impi.md:69`; the iButho entry itself identifies `Typ: Spearman` (`:5163`) and notes “iklwa + tarcza” (`:5154`). Only the opening weapon phrase changed. No weapon construction or combat/balance claim was added, and no key or numeric value changed.
- The adapter applies translations while building unit Top3 display rows. The raw `Top3` strings and numbers remain unchanged; unknown labels pass through. Mappings are local to the unit-card Top3 presentation path. The operator's inventory identifies current families and reports zero `Falangite` occurrences, so no dead mapping was added.
- `units.json` parses successfully and `git diff --check` is clean for the scoped tracked files.

## Uwaga blokująca gotowość wdrożeniową

`cd gra && npm run typecheck` fails with two `TS2532: Object is possibly 'undefined'` diagnostics in the new formatter: `gra/src/ui/entityCards/unitAdapter.ts:119` and `:128`, at `match[0]` in the `Bonus vs Spearman` and `Bonus vs Mount` replacement callbacks. These diagnostics arise from the changed code under the project's `noUncheckedIndexedAccess` setting. The focused runtime test does not replace this static check. Final Control made no source changes; the same run requires an operator correction and independent recheck before the batch can pass.

## Granice audytu nadrzędnego

This result accepts only the scoped correction batch described above. The original request to audit all player-visible Polish text across UI, CIVPEDIA/wiki, and guides remains **PARTIAL**. This control does not claim exhaustive coverage of those routes, all English text, historical accuracy of the full iButho paragraph, or unreviewed terminology. Do not close the parent audit as exhaustive/complete.
