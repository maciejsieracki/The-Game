# 50 — independent final control

STATUS: PASS (independent non-browser control)
DOMAIN: GAME
TEMAT: R-WEB-MELEE-CROSS-TYPE-NEXT-ERA-REPLACEMENT-Q1
CANDIDATE: `e42266cf1`
BASE: `186d0f03b`
RUN: 2026-11-11, in `/tmp/melee-replacement`; no product edits, merge, push, or deploy.

## Independent source and scope review

- Compared the candidate against the requested base. The production diff is limited to an explicit cross-type melee allowlist (`Swordsman`, `Spearman`, `Falangite`, `Offensive`) in `availableReplacementsFor()`. Same-type candidates remain eligible, and cross-type eligibility requires both source and target to be allowlisted.
- The new condition runs before the existing availability gates. Nation, epoch, technology, barracks, resource-stock display behavior, special-replacement, and Super-unit checks remain in force. The existing explicit Siege exclusion also remains in force. Replacement execution, full-cost calculation, experience/movement handling, and AI preference logic were not changed.
- Inspected all actual `units.json` Typ values: the allowlist covers the melee infantry types; `Distance`, `Slinger`, `Mount`, `Siege`, `Civilian`, and `Naval` remain outside cross-type eligibility. The owner’s withdrawn normal↔Super restriction was not added.
- Independently exercised the candidate selector against actual unit data for all 15 civilization keys with all technologies, epoch, barracks, and resources available. Across 85 actual melee source units, all 73 legal cross-Typ pairs were returned; no pair failed. The focused regression also checks actual Greek Mycenaean Warrior → Falanga and Thorakites, preserved Hieros Lochos availability, and nation filtering.

## Independent verification

- `node tools/unit-replace-test.cjs`: **21/21 passed**, including the 15-civilization allowlist matrix and non-melee exclusions.
- `node tools/unit-replace-army-multi-select-test.cjs`: **36/36 passed**, including affordability, partial bulk replacement, and the existing Super limit.
- `node tools/ai-unit-replace-same-rules-test.cjs`: **45/45 passed**, including shared eligibility for Falangite/Spearman and unchanged army-class filtering.
- `npm run typecheck`: passed.
- `node tools/unit-replace-full-cost-test.cjs`: **39 passed, 1 failed**. The only failure is the F0 expectation that Taran okuty offers Katapulta across all 16 nations. The test is unchanged from base, and the candidate retains the existing unconditional Siege replacement exclusion. The evaluator reports the identical 39/40 result on base `186d0f03b`; this is outside the melee replacement scope.
- `git diff --check 186d0f03b..e42266cf1`: passed. `git` confirms the full-cost test file is unchanged between base and candidate.

No browser run was needed: the production change is confined to pure candidate eligibility, and the actual-data checks plus player, AI, and bulk-path tests cover the changed selector and its consumers.

No Final Control blocker remains for the owner-approved scope. This report does not claim integration, deployment, push, or readback.
