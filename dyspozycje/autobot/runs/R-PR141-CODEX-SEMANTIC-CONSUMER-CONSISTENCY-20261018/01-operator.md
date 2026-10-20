STATUS: PASS (Operator implementation and bounded checks; independent Evaluator and Final Control pending)
DOMAIN: GAME
TEMAT: R-PR141-CODEX-SEMANTIC-CONSUMER-CONSISTENCY-20261018
GOAL: Align the semantic classifier with the exact already-approved bounded consumer contracts for the four listed combat fields, correct beneficial polarity for the three listed discount fields, and demonstrate these changes with focused current-source tests while preserving all unrelated classifications, raw data, approvals, and the explicit bounded-evidence ceiling.
RUNDY: 1/5

## Result

Implemented the exact authorized classifier scope: added bounded consumer evidence and `REAL_GAMEPLAY` status for `walka_ruch_bitwa_proc`, `walka_ruch_rydwany`, `walka_ruch_piechota_teren_plytkie_morze`, and `walka_koszt_rekrutacji_proc`; removed exactly `prod_koszt_budynku_proc`, `prod_koszt_jednostki_proc`, and `walka_koszt_rekrutacji_proc` from harmful polarity. `prod_rush_koszt_proc` remains harmful, `UNWIRED`, and without consumer evidence. No runtime logic, raw matrix, approval receipt, or ledger artifact was edited.

Updated the existing semantic-label test with assertions for the four status promotions and three polarity dimensions (six distinct IDs, because G11 is in both groups); preserved its earlier baseline/addition assertions. Added `gra/tools/pr141-semantic-consumer-consistency-test.cjs`. It reads the checked-in matrix without writing it, bundles actual current consumer functions, executes the actual `BattleScene._movementPointsFor` method body extracted from the TypeScript AST with bounded fixture dependencies, and checks the approved owner/context behavior and discount calculations.

The two pre-existing target files already contained unrelated accepted PR141 work before this Operator phase. Before editing, I saved their exact starting bytes to `/tmp/pr141-semantic-consistency-snapshot-r1/`; hashes were `3531584e2d153ca23705e2dd94d1a5d42c468175a28478692a9eaa4e78b5f2f8` for the classifier and `651460de150fbae730231e0fb4732c38896f8627b910ca3ab4297eb177fb1d9b` for the label test. I preserved those prior hunks. The only implementation paths changed/added by this run are the classifier, the existing label test, and the new focused test.

## Evidence and coverage ceiling

The test confirms Egypt's chariot-specific movement precedence, Egypt movement exclusion from shallow-sea embark cost, Zulu general movement and Impi-only G11 discount, Greek/Phoenician shallow-sea infantry movement, Rome building and Zulu unit discounts, additive G11/F04 discount plus one floor/minimum, and unchanged harmful/unwired rush cost. These checks execute helper/consumer code against the current checked-in matrix; the battle method's movement points and unit shape dependencies are bounded fixture inputs.

This is bounded component evidence. It does not establish a full battle, production UI, AI-owner parity, full world, map generation, all 15 cells' behavior, browser behavior, save/load, or full-runtime acceptance. Historic F05/G11 acceptance records are cited as prior evidence and were not rewritten. The old v1 and current-evidence v2 ledgers remain unchanged; v2's 63-ID snapshot is historical for this scope. No new ledger snapshot was generated. Root may separately authorize a v3 snapshot after independent acceptance.

## Test results

- `node tools/civ-matrix-semantic-labels-test.cjs` — PASS, 474 passed, 0 failed.
- `node tools/pr141-semantic-consumer-consistency-test.cjs` — PASS, 37 passed, 0 failed.
- `node tools/egypt-movement-precedence-test.cjs` — PASS, 24 passed, 0 failed.
- `node tools/impi-recruitment-discount-test.cjs` — PASS, 705 passed, 0 failed.
- `node tools/pr141-f04-cost-activation-test.cjs` — PASS, 19 passed, 0 failed.
- `node --check` on both changed/added `.cjs` tests — PASS.
- `node ./node_modules/typescript/bin/tsc --noEmit` — PASS.

No build, browser, full-runtime, or map-generation test was run. The classifier currently derives 67 `REAL_GAMEPLAY` IDs (33 preserved baseline + 30 previously accepted additions + these four); the label test derives 1,005 corresponding semantic cells. These are classifier inventory counts, not a regenerated or accepted ledger.

## Checksums after implementation

- `gra/src/game/civ-matrix-semantic.ts`: `71d6f868473b94a6d1c6466a625a5252f2caae5a332ece06cbf3acb35e6f007c`
- `gra/tools/civ-matrix-semantic-labels-test.cjs`: `45f063a12bf101e67b8864b07a167d1bc789261a1905af151c66f26432740322`
- `gra/tools/pr141-semantic-consumer-consistency-test.cjs`: `e5596f0cff083db83ad6eb652e7fd604d8325b8e8206d0b411d025c58b70d5d0`

ZMIANY/COMMIT: classifier, existing semantic-label regression, new bounded consumer test, dispatch amendment and this report; no commit.
BLOKADY: independent Evaluator and separate Final Control remain required; root integration and future ledger snapshot remain separate gates.
NASTĘPNY KROK: independent Evaluator checks exact classifier diff, test execution, owner mapping and evidence ceiling; then independent Final Control.
DEPLOY/PUSH: NIE WYKONANO / NOT AUTHORIZED

## Dated defense update — 2026-10-18 (Evaluator round 2)

The independent Evaluator found that the first focused test proved the Impi-only G11 discount for Zulu but lacked non-Zulu and unknown-owner negatives. Added controls that call the actual `civMatrixBonusyForCivKey` adapter for Greece and an unknown owner, verify neither emits `walka_koszt_rekrutacji_proc`, and run the actual `unitMoneyCost` with Impi identity to confirm the base cost remains 17. These controls use only the actual G11 marker list, with no F04 general discount mixed into the negative case. Focused test is now 44 passed, 0 failed; semantic-label regression is 479 passed, 0 failed; direct TypeScript check passes.

Root also required the Egypt `walka_ruch_bitwa_proc` cell to reflect the approved 1B exception. The ID-level consumer remains `REAL_GAMEPLAY`, but Egypt's cell now uses the existing `BLOCKED` status with a resolved decision explanation; the Zulu cell remains `REAL_GAMEPLAY`. The semantic-label test confirms this split and the snapshot now derives 1,004 `REAL_GAMEPLAY` cells, one Egypt exclusion, and 67 IDs with bounded consumer evidence. This is a scoped per-cell classifier exception, not per-cell gameplay acceptance. Historical v1/v2 ledger files are still unchanged and unregenerated.

Round-2 current checksums:

- `gra/src/game/civ-matrix-semantic.ts`: `2d9b93df2a342cead1a191fcb7f8614e837ed372ba62b8df61b849ad068bf6a2`
- `gra/tools/civ-matrix-semantic-labels-test.cjs`: `5b6cfd994d33e07b546dd7af6697698c45a0ccb8ea5b9e0b9c682bb63fa2f23b`
- `gra/tools/pr141-semantic-consumer-consistency-test.cjs`: `95c0e2b9b1a70c28b871d36d00e7a51ce0001167b092d13f45abb6fa94ec1cad`

## Dated defense update — 2026-10-18 (Evaluator round 3)

Centralized the owner-approved Egypt 1B cell exception in the exported `classifyCivMatrixCell` path. Direct classification now agrees with profile/snapshot classification; caller-supplied `REAL_GAMEPLAY` cannot activate Egypt's superseded general movement cell. Invalid-value blocking remains first and retains its missing-value reason. The profile builder no longer injects a duplicate override. Zulu direct classification remains active.

Updated focused test: 52 passed, 0 failed. Semantic-label test: 479 passed, 0 failed. Direct TypeScript check: PASS. Current cell counts stay at 1,004 `REAL_GAMEPLAY`, one Egypt exception, 1,005 classified cells. No ledger regenerated.

Round-3 current checksums:
- `gra/src/game/civ-matrix-semantic.ts`: `28c3023a574745475ee5c7d0f875144b9a2f74e05e6bf2b01d891363b5ce1a3b`
- `gra/tools/civ-matrix-semantic-labels-test.cjs`: `5b6cfd994d33e07b546dd7af6697698c45a0ccb8ea5b9e0b9c682bb63fa2f23b`
- `gra/tools/pr141-semantic-consumer-consistency-test.cjs`: `6bb006dff7dfdb8bcd227f6acf57d9a3736a7376a3d72636ea88e8c85081b205`
