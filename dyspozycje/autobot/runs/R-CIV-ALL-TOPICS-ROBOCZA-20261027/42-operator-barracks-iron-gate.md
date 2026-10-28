# Operator report: Bronze-and-later Barracks recruitment gate

## Result

Generalized the existing per-city Barracks gate in `availableProduction` and `availableReplacementsFor`: units whose era ordinal is Bronze or later require `koszary` in the applicable city, or a building explicitly declared as an upgrade from Barracks. Stone units remain outside this gate. The existing current-era plus immediately previous-era visibility window is unchanged, as are technology, resource, civilization, naval, and other availability checks.

The focused Koszary test now covers the Stone-to-Bronze transition (Stone remains available without Barracks; Bronze is blocked), Bronze-to-Iron (Stone expires; Bronze and Iron are blocked without Barracks and available with it), and replacement availability using the same per-city gate. The current era map defines Stone, Bronze, and Iron; the `>= 2` predicate will also include later ordinals when those era names are added.

## Transition diagnosis

Read-only tracing found that player availability reads `player.era` through `empireEpochForOwner`, and the city panel reads that value when it rebuilds the production list. Stone units at Bronze pass the existing era-window test and have unit epoch 1, so they cannot match the Bronze-and-later Barracks condition. An open city panel is not directly refreshed by `notifyPlayerEraChangeIfAdvanced`; a later panel refresh rebuilds its list using the current epoch. This leaves panel refresh timing as a plausible explanation for a temporary stale list, but does not establish the reported timing from a live reproduction. No UI or transition code was changed.

## Validation

- `node tools/koszary-gate-test.cjs` from `gra/`: PASS, 26/26 assertions.
- Source SHA-256: `f382de35b3262c301b51ac0319540e96f8f65bf2908c9a4e29626ea24a9a2361` (`gra/src/game/production.ts`).
- Test SHA-256: `7c3a671167062ca7690fe2ad70d7387bc5734c357b704eb72cce3a5efa22b314` (`gra/tools/koszary-gate-test.cjs`).

The worktree already contained unrelated edits to both files before this task began: the `ProductionItem.isGeneral` field in `production.ts` and the Ox Chariot fixture/test in `koszary-gate-test.cjs`. The hashes above identify the complete current files, including those pre-existing edits.
