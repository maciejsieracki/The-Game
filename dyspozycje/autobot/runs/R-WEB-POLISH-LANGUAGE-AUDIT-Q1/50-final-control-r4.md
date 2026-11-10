# R-WEB-POLISH-LANGUAGE-AUDIT-Q1 — Final Control r4

STATUS: PASS WITH NOTES — the scoped unit-card text fix batch is ready for batch deployment.
DATA: 2026-11-10
ZAKRES: r4 fixes the two typecheck diagnostics from Final Control r3. Acceptance includes the previously reviewed r3 history corrections and Top3 presentation mappings. No source edits, browser session, build, or commit by Final Control.

## Wynik r4

The r4 source diff is limited to replacing `match[0]` with `match.charAt(0)` in the two formatter callbacks for `Bonus vs Spearman` and `Bonus vs Mount` in `gra/src/ui/entityCards/unitAdapter.ts`. The replacement preserves the first-character comparison and the rendered strings, while avoiding the possibly-undefined indexed string type under `noUncheckedIndexedAccess`. No map, wording, source Top3 value, or data field changed in this correction.

Independent checks:

- `cd gra && npm run typecheck` — **PASS**, `tsc --noEmit`, exit 0. The two TS2532 diagnostics recorded by r3 are resolved.
- `cd gra && node tools/unit-top3-player-language-test.cjs` — **PASS**; the actual adapter and renderer in jsdom checked all **75/75** populated Top3 sections. The test also covers the mapped combinations, unknown-label fallback, unchanged source Top3 data, and rendered Evocati/iButho histories.
- `git diff --check` for the scoped tracked files — **PASS**.

The r3 content review remains valid: `units.json` changes only two `Historia` values (Evocati agreement and the supported iButho phrase “krótka, ciężka włócznia kłująca”). The latter is supported by the existing Impi history and CIVPEDIA entry; iButho is identified as `Spearman` and its notes mention “iklwa + tarcza”. No new construction or combat/balance assertion was introduced. Top3 mappings remain view-only; raw input values, numbers, unknown labels, and source data are preserved.

## Granice

This is a pass for the known, scoped unit-card text-fix batch only. The original audit across all player-visible UI, CIVPEDIA/wiki, and guides remains **PARTIAL**. This report does not claim exhaustive language or historical review of those sources. Do not close the parent request as a completed/exhaustive audit.
