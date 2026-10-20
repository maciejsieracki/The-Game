# Proposed v3 current-evidence ledger dispatch

**Date:** 2026-10-18  
**Status:** Proposal for root review only — no code, manifest, or ledger generation authorized.  
**Run accounting:** Continue this CURRENT-EVIDENCE-LEDGER ID at round 3/5; do not reset the previous round history.

## Trigger and immutable history

The v2 ledger and its source manifest remain frozen historical artifacts at their existing paths and bytes. V2 describes the then-current 63-ID classifier snapshot and its former source closure; it is not expected to validate against the classifier after the separate semantic-consistency changes are accepted. V1 also remains immutable. The next snapshot must use new v3 filenames and derive its set from current canonical sources.

The semantic-consistency Operator reports 37/37 focused consumer checks and 474/474 semantic-label checks, but its Evaluator currently has an open negative-control finding. No v3 files may be generated until that finding has been corrected, a passing independent recheck and Final Control exist, and root records acceptance of that run. The operator's 37/474 counts alone are not sufficient authority.

## Proposed scope and expected inventory

After those gates, add the four accepted combat consumer IDs to the 63-ID v2 snapshot's additions, yielding 34 additions over the preserved 33-ID v1 baseline:

- Prior additions already represented in v2: 30 accepted IDs.
- New semantic-consistency additions: `walka_ruch_bitwa_proc`, `walka_ruch_rydwany`, `walka_ruch_piechota_teren_plytkie_morze`, and `walka_koszt_rekrutacji_proc`.
- Expected current classifier inventory: 67 unique parameter IDs with accepted/active consumer scope, counting IDs that have an explicitly blocked owner-specific cell. Derive the actual number of `REAL_GAMEPLAY` IDs and cells from the 93×15 current semantic snapshot; do not assume 1,005 `REAL_GAMEPLAY` cells. The anticipated count is 1,004 if the one Egypt precedence cell below is the only blocked cell, but that is a checkable expectation, not a hard-coded output.
- Expected matrix inventory: 93 parameter IDs × 15 civilizations = 1,395 unique cells.
- Preserve exactly 360 receipt-backed raw approvals for the 24 approved F-04 IDs. Approval remains a separate dimension from consumer status.
- Keep `prod_szybkosc_jednostki_proc` and `prod_rush_koszt_proc` raw-approved but consumer-`UNWIRED`; keep `prod_rush_koszt_proc` harmful. The three accepted cost-discount polarity corrections and the four consumer promotions must be reflected from the current classifier, not hard-coded ledger overrides.

Root's latest precision on accepted combat scope adds one intentional cell-level exception: for `walka_ruch_bitwa_proc`, Egypt's approved raw `0.15` is suppressed by owner decision 1B in favor of the Egypt chariot-specific movement value. That Egypt cell must be `BLOCKED` with an explicit reason that names the intentional 1B precedence. Do not relabel that cell `REAL_GAMEPLAY` merely because the parameter has accepted bounded evidence and Zulu/general movement is active. Other cells for the same ID follow their actual current classifier result; the Zulu/general ID remains represented as active. This exception is not a rejection of the accepted parameter ID or of the 34-ID candidate scope.

All totals are assertions/expected values only; the generator must derive actual dimensions and resulting classifier counts from current sources and stop on mismatch.

## Minimal implementation design

Use a new wrapper `gra/tools/pr141-current-evidence-ledger-v3-generate.cjs`. It should require the existing v2 generator, extend its exported `ACCEPTED` and `INTEGRATIONS` objects with the four exact combat IDs, and append the new evidence paths and `gra/src/game/embarkation.ts` to the exported `SOURCE_PATHS` array. `gra/src/battle/battleScene.ts` and `gra/src/game/civ-bonuses.ts` are already present in the 58-input v2 closure; keep them. The wrapper can call the existing exported `build()` against the frozen v1 seed and current semantic snapshot, then set the v3 schema/history/source-manifest fields and write only the new output names below. It must not call the inherited `write()`, whose fixed targets are the frozen v2 `source-manifest.json` and `matrix-...-v2.json`.

New outputs, only after final source freeze:

- `evidence/source-manifest-v3.json`
- `evidence/matrix-93x15-current-evidence-ledger-v3.json`

The v3 manifest should contain the full existing 58-path closure (including the v2 generator and validator as historical core inputs), plus the wrapper, v3 validator, embarkation module, semantic-consistency focused test, and accepted semantic-consistency run records. The v3 artifact itself, manifest itself, temporary logs, and generated bundles must be excluded to prevent self-hashing. Preserve the v1 and v2 paths/hashes in v3 `history`; do not rederive or rewrite them.

### Semantic-consistency source closure

Add current code/evidence needed to support the four new IDs and their polarity, including:

- `gra/src/game/embarkation.ts` (not in the old 58-file closure).
- `gra/tools/pr141-semantic-consumer-consistency-test.cjs`.
- Current `gra/src/battle/battleScene.ts` and `gra/src/game/civ-bonuses.ts` (already in old 58-file closure; retain their latest hashes in the new manifest).
- The semantic-consistency `00-dispatch.md`, accepted `01-operator.md`, passing Evaluator recheck, passing Final Control, and root integration record. The current evaluator report with its open finding is not an acceptance reference; generation stays blocked until the resolved records exist. Before execution, root should lock the exact final filenames for recheck, Final Control, and root integration in the amended 00 dispatch. Do not substitute unreviewed or pending records.
- Existing integration/Final Control/test inputs already named by v2 `SOURCE_PATHS` for all prior 30 additions, source approval, classifier-label regression, prior source closure, and v1 history. Retain all 58 old closure paths, then add the new accepted closure; do not prune/rebuild a narrower manifest.

The v3 artifact should carry per-ID integration, Final Control, and focused-test references for the four additions, plus evidence ceilings tied to their accepted records: bounded movement/recruitment consumers only; no map-generation or full-world claim. Egypt movement's battlefield-only rule and shallow-sea exclusion, the Egypt general-movement cell's intentional BLOCKED precedence, Zulu general movement and Impi-specific discount, and rush-cost `UNWIRED` hold remain explicit. Do not infer 15-cell behavioral evidence from the 15 corresponding semantic rows.

## Validator contract

Add `gra/tools/pr141-current-evidence-ledger-v3-test.cjs`, preferably factoring no legacy logic into clever VM/source-rewrite machinery. Reuse the existing validator's meaningful inventory, raw-value, approval, provenance, baseline-preservation, acceptance-ceiling, and evidence-reference checks. Keep every existing v2 validator control intact: its 17 ledger negative controls and two manifest closure/hash controls must still reject equivalent mutations in the v3 validator.

Add focused v3 positive and negative controls for the new scope:

- Accept the 34 exact candidate IDs as classifier-derived additions over the preserved baseline; derive the 67 unique parameter-ID inventory, the exact per-cell `REAL_GAMEPLAY` count, and exact status counts from the live snapshot. Validate 1,395 total inventory cells independently from active cells.
- Accept all four new IDs only with the accepted semantic-consistency integration, Final Control, focused-test references, current semantic status, and appropriate bounded evidence ceiling.
- Compare every cell's semantic status and status reason against the exact current semantic snapshot. Require `walka_ruch_bitwa_proc/egypt` at raw `0.15` to remain `BLOCKED` for the documented 1B specific-over-general precedence; reject a fabricated `REAL_GAMEPLAY` status there, or a missing/changed reason. Preserve active Zulu/general movement and do not force uniform status for all 15 cells of an accepted ID.
- Reject an omitted, duplicate, out-of-scope, or wrongly referenced new ID; reject a removed prior baseline ID or any extra `REAL_GAMEPLAY` cell/ID not supported by the live semantic snapshot.
- Reject falsified beneficial polarity for the three cost discounts or loss of harmful/`UNWIRED` status for `prod_rush_koszt_proc`; do not promote either unit-speed or rush cost.
- Preserve current raw matrix values and exact 360 F-04 approvals; reject added/missing/wrong-owner approval pairs and any 15-cell behavior-PASS replication.
- Verify the new manifest has the entire 58-input old closure plus exact v3 additions, checks actual current bytes, rejects a missing `embarkation.ts`/semantic test/accepted review input, and rejects a changed hashed input. The manifest cannot hash itself or the v3 ledger output.
- Preserve `NOT_VERIFIED` runtime, browser, save/load, difficulty, per-cell owner/AI parity, and 93×15 product acceptance. Keep ID-level evidence references distinct from per-cell status; the intentional Egypt `BLOCKED` cell is not a behavioral PASS.

Use actual snapshot/build APIs and current files. Do not weaken, skip, or replace the old positive checks, and do not run the old v2 validator expecting its historic snapshot to match the newly accepted classifier.

## Proposed allowlist and gates

For a later root-approved implementation dispatch only:

- `gra/tools/pr141-current-evidence-ledger-v3-generate.cjs` (new wrapper).
- `gra/tools/pr141-current-evidence-ledger-v3-test.cjs` (new validator).
- This run's own operator report and new v3 evidence output paths.
- The exact semantic-consistency Final Control/root integration record paths, only if the root chooses to write them as part of its separate acceptance step; no changes to the prior semantic run by this ledger operator.

Do not change `civ-matrix-semantic.ts`, labels, product code, source data, the canonical receipt, v1/v2 artifacts, previous reports, registries, or any pre-existing output. The semantic-consistency run owns its own classifier/test corrections and acceptance. If the wrapper cannot reuse the exports without touching frozen v2 behavior, stop and return the minimal required allowlist amendment rather than rewriting v2.

Proposed post-acceptance checks: versioned v3 validator, `node tools/civ-matrix-semantic-labels-test.cjs`, and direct `node ./node_modules/typescript/bin/tsc --noEmit`, subject to root's final dispatch. No world generation, browser, server, end turn, full runtime, build, publish, or v2 mutation test is proposed.

## Order of operations and boundaries

1. Wait for the semantic-consistency negative-control correction, independent passing Evaluator, passing Final Control, and root acceptance. If any fails, do not begin v3 implementation.
2. Root amends this dispatch with the exact accepted semantic-consistency record paths and v3 allowlist/GO. This proposal alone authorizes no implementation.
3. Record starting hashes/diffs for new files and verify v1/v2 artifact/manifest hashes against their recorded history.
4. Implement wrapper and validator only; keep all accepted source/evidence inputs immutable. Run the approved targeted checks.
5. Freeze hashed inputs, compute `source-manifest-v3.json` excluding itself and generated outputs, generate the v3 ledger at its new path, then rerun validator and verify no listed input changed.
6. Record actual counts, exact ID-set comparisons, manifest digest, output digest, commands/results, and evidence limits in the operator report. Submit for independent Evaluator and Final Control, then root integration as a separate gate.

The v3 ledger is a current classifier/evidence synchronization snapshot, not full product acceptance. `REAL_GAMEPLAY`, source approval, bounded consumer behavior, and runtime/product acceptance remain separate dimensions. No deployment, push, publication, or readiness claim follows from this proposal.

### Dated source-history packaging amendment — 2026-10-18

Round-four portability defense retains the three external evidence originals by exact bytes under `evidence/source-history/`, with a local index containing their original paths and pinned digests. The v3 manifest uses only these repository-relative copies and index; verifier path policy rejects any absolute path, `..` traversal, or path outside the repository. Future checks validate the copy/index hashes from repository files and do not depend on `/workspace/handoff-pr141` or `/workspace/pr141-review`. This packaging change does not alter owner decisions, semantic/product evidence, raw approvals, or v1/v2 history.
