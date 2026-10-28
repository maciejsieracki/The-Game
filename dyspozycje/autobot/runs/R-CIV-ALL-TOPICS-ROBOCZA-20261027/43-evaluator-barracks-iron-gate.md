# Evaluator report: Bronze-and-later Barracks recruitment gate

## Verdict

**PASS for the changed production gate, with a transition-refresh limitation and a scope caveat for replacement choices.** The inspected `availableProduction()` logic applies the current-era plus one-previous-era window, and independently gates each unit whose defined era ordinal is Bronze or later behind Barracks in that city (or an accepted Barracks upgrade). This leaves Stone units available through Bronze, expires them on entering Iron, and blocks Bronze/Iron units without Barracks. The existing technology, resource, nation, naval, and other production checks remain in their prior positions and were not broadened by this change.

The test `koszary-gate-test.cjs` exercises Stone->Bronze, Bronze->Iron, per-city-style built IDs, replacements' Barracks gate, `purchasableUnits`, and a Stone Ox Chariot technology gate. `epoka-merge-recruit-test.cjs` independently exercises the current+previous visibility rule across all three eras. Both pass at the hashes below.

## Transition concern

The suspected Stone-unit block on entering Bronze is fixed at the production-logic level: with `epoch: 2`, a Stone unit has ordinal 1, passes `unitEpoch >= epoch - 1`, and does not satisfy the new `unitEpoch >= 2` Barracks gate. This is covered by the Koszary test.

The report's concern about an already-open city panel remains unresolved as a live UI transition issue. `notifyPlayerEraChangeIfAdvanced()` records the era change and refreshes HUD elements; inspection did not find it calling `refreshCityPanelIfOpen()`. Thus a panel whose list was built before the era change may remain stale until another panel refresh/reopen. Neither requested script opens a live panel or advances an era with that panel open. This does not falsify the production gate result, but means the transition timing diagnosis is still plausible and unverified.

## Replacement-choice scope caveat

`availableReplacementsFor()` now requires Barracks for Bronze+ units, which the Koszary test verifies. Its era check only rejects units newer than the owner's era; it has no lower bound for units older than the immediately prior era. If the owner's current+previous rule is intended to govern the “Zastąp” picker too, older candidates can remain visible there. The current `epoka-merge-recruit-test.cjs` checks `availableProduction()` only, and the replacement assertions check the Barracks gate only. This is a pre-existing adjacent behavior and does not undermine the tested production list, but the broad phrase “recruitment shows current+prior” should be scoped or the replacement picker should be checked separately.

## Reproduction and identity

From `gra/`:

- `node tools/koszary-gate-test.cjs` — **PASS, 26/26**.
- `node tools/epoka-merge-recruit-test.cjs` — **PASS, 13/13**.

Worktree HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`.

SHA-256:

- `gra/src/game/production.ts`: `f382de35b3262c301b51ac0319540e96f8f65bf2908c9a4e29626ea24a9a2361`
- `gra/tools/koszary-gate-test.cjs`: `7c3a671167062ca7690fe2ad70d7387bc5734c357b704eb72cce3a5efa22b314`
- `gra/tools/epoka-merge-recruit-test.cjs`: `59d2c7ef3a024d988cb842120a15163169fec7cd7a0cc8768c5dc3be3a86625a`

Limitations: these are focused Node logic tests, not browser/UI transition tests; no unrelated modified files were included in this evaluation. The production source and focused Koszary test also contain unrelated pre-existing edits (`ProductionItem.isGeneral` and Ox Chariot fixture coverage respectively), so the recorded hashes identify the complete current files, not isolated patches.
