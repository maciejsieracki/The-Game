# Evaluator — R-WEB-MELEE-CROSS-TYPE-NEXT-ERA-REPLACEMENT-Q1

**Verdict: PASS.** Evaluated candidate `e42266cf1` against base `186d0f03b`. No concrete objection found within the owner-approved global cross-melee replacement scope.

## Review

The production change adds an explicit `Swordsman`, `Spearman`, `Falangite`, `Offensive` allowlist, then permits cross-Typ candidates only when both current and target units are in that set. Same-Typ candidates remain eligible as before. The candidate still runs through the existing gates for epoch, nation, technology, barracks, stock, special replacement, and Super-unit limits in `availableReplacementsFor` ([production.ts](/tmp/melee-replacement/gra/src/game/production.ts:1171)). The replacement execution, costs, and AI selection/preference algorithm are unchanged.

I checked all `units.json` Typ values: the four allowlisted types cover the melee infantry; remaining types are `Distance`, `Slinger`, `Mount`, `Siege`, `Civilian`, and `Naval`. The regression matrix exercises every directed cross-melee pair across all 15 civ keys and verifies no non-melee leakage. The actual Greek data case confirms Mycenaean Warrior can select Falanga and Thorakites, preserves the existing Hieros Lochos special route, and still filters Triari by nation. The retracted normal↔exceptional restriction was not introduced; the existing Super limit remains covered.

## Independent checks

- `node tools/unit-replace-test.cjs` — **21/21 PASS**; includes 15-civ cross-type matrix, excluded types, actual Greek case, nation and tech gating.
- `node tools/unit-replace-army-multi-select-test.cjs` — **36/36 PASS**; bulk replacement selection and affordability behavior.
- `node tools/ai-unit-replace-same-rules-test.cjs` — **45/45 PASS**; shared AI candidate eligibility includes Falangite/Spearman, while AI preference remains unchanged.
- `npm run typecheck` — **PASS**.
- `node tools/unit-replace-full-cost-test.cjs` — **39/40**, with the same exact result on base `186d0f03b`. The sole failure is its existing F0 assertion that Taran okuty should offer Katapulta across all 16 civs. The test file is unchanged by this candidate, and Siege replacement is excluded by the existing active-siege-only policy (release 614); this is outside this topic's requested behavior.

No browser run was needed: the change is confined to the shared pure candidate-eligibility function, and the actual-data and AI candidate paths are covered above. No source files were edited during evaluation.
