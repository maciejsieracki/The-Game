# Proposed dispatch — current classifier and evidence ledger sync

STATUS: PROPOSED / ROOT REVIEW REQUIRED / NO IMPLEMENTATION GO
TEMAT: R-PR141-CODEX-CURRENT-EVIDENCE-RECON-20261018
RUNDA: 4/5
DATA: 2026-10-18
DOMAIN: INFORMATIONAL / EVIDENCE SYNCHRONIZATION
ŚCIEŻKA: A (collaboration per session adaptation)
MODEL + EFFORT: Operator gpt-6-luna / medium; independent Evaluator gpt-6-luna / medium; conditional Obrona gpt-6-luna / medium; Final Control gpt-6-luna / medium; root integration.

## Trigger and current state

This document prepares the exact later classifier/current-ledger change requested by root. It is documentary only and does not authorize edits. Society's three bounded consumer IDs now have Final Control PASS-WITH-NOTES in `R-PR141-CODEX-F04-SOCIETY-REMAINING-20261018/13-final-control.md`, the focused AST target at 192/0 in evaluator recheck 12, and root acceptance in `/14-integration.md`. This brings the newly accepted candidate set described by this recon to 29 IDs: the prior 26 plus Society's three. These 29 are additions to the existing `REAL_GAMEPLAY` baseline, not a replacement for or total of all existing `REAL_GAMEPLAY` IDs.

Root has separately authorized a one-field building-speed implementation for `prod_szybkosc_budynku_proc`. That field is a conditional 30th candidate only after its own implementation, independent Evaluator, Final Control, and root integration all pass. It is not accepted yet. `prod_szybkosc_jednostki_proc` and `prod_rush_koszt_proc` remain pending owner semantics and stay `UNWIRED`; they do not block a partial current snapshot. Their 30 F-04 raw cells remain covered by the approved source receipt independently of consumer status.

The 2026-10-18 source receipt approves exactly 24 F-04 parameter IDs × 15 civilization keys = 360 raw cells from workbook SHA-256 `c285c410012d0fca67acf40200f03ace4cf98bd538fde40c3ea3799c79a62f32`. It explicitly does not approve other parameters or product acceptance. The historic 2026-10-17 ledger remains the immutable schema-v1 seed-only record.

## Goal

After the conditional building-speed gate and root freeze, produce a new dated classifier/evidence snapshot that:

1. Marks only exact bounded consumer IDs with independently accepted live consumers as `REAL_GAMEPLAY`, backed by their own reviewed integration evidence.
2. Separates that consumer status from per-cell raw approval, raw provenance, behavioral receipts, and full runtime/product acceptance.
3. Preserves the exact source receipt overlay for 360 cells while leaving all other cells without a new F-04 approval overlay.
4. Includes exactly the generated current raw inventory (expected 93 parameter IDs × 15 civs = 1,395 cells), computed and validated from source inventories rather than trusting a hardcoded output count.
5. Leaves browser, full runtime, save/load, difficulty-wide, owner/AI-wide, and 93×15 product acceptance as `NOT_VERIFIED` absent separate evidence.

No implementation starts until root reviews this dispatch and issues a separate written GO after all prerequisites below are met.

## Candidate ID set and gates

The current bounded accepted set (29 IDs) consists of:

- G1 (6): `walka_atak_piechota`, `walka_obrona_piechota`, `walka_pancerz_piechota`, `walka_dystans_lukownicy`, `walka_hp_piechota`, `walka_hp_rydwany` — `R-PR141-CODEX-G1-ACTIVATION-20261018/11-integration.md`.
- DIP (2): `dip_nastawienie_bazowe`, `dip_agresja_archetyp` — `R-PR141-CODEX-DIP-ACTIVATION-20261018/08-integration.md`.
- F-04 Work (1): `eko_praca_proc` — `R-PR141-CODEX-F04-WORK-ACTIVATION-20261018/06-integration.md`.
- F-04 Cost (2): `prod_koszt_budynku_proc`, `prod_koszt_jednostki_proc` — `R-PR141-CODEX-F04-COST-ACTIVATION-20261018/06-integration.md`.
- F-04 Society already accepted (9 total): `wealth_cap_proc`, `kultura_naplyw_proc`, `porzadek_produkcja_proc`, `porzadek_nauka_proc`, `porzadek_kultura_proc`, `porzadek_wzrost_proc`, `wealth_mnoznik_proc`, `religia_spread_proc`, `porzadek_pieniadz_proc`. The first six are in `R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/06-integration.md`; the remaining three are bounded by Society Evaluator 12, Final Control 13, and root integration 14.
- F-04 Yields (9): `eko_handel_brutto_proc`, `eko_pieniadz_proc`, `eko_pieniadz_port_proc`, `eko_zywnosc_proc`, `eko_nauka_proc`, `eko_kultura_proc`, `eko_luksus_proc`, `eko_zadowolenie_proc`, `eko_korupcja_proc` — `R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/08-integration.md`.

Conditional candidate 30: `prod_szybkosc_budynku_proc`, from the active one-field production implementation only after its own Evaluator, Final Control, and root integration are present and accepted. The routine mapping is existing building-work budget scaling. Do not infer acceptance from root's implementation GO or from all-zero raw data.

Explicitly excluded from consumer candidates: `prod_szybkosc_jednostki_proc` and `prod_rush_koszt_proc`. Both remain owner-decision-blocked and `UNWIRED`, even though their raw F-04 cells have source approval. No other ID may be added based on source approval, a classifier label, a source reference, an implementation-only report, HOTSEAT routing, or a bounded test that belongs to another ID.

The 29 accepted IDs are the newly accepted candidate set, additive to every `REAL_GAMEPLAY` ID already present in the frozen classifier baseline. The expected post-building addition is one ID (30 new candidates total) only after the building field's terminal review and root acceptance. At generation time, capture the exact frozen baseline `REAL_GAMEPLAY` set, preserve every member, add only the exact reviewed candidate IDs, and derive/report the resulting total from the generated sets. Do not hardcode a future total such as 62 or 63. Negative validation must reject any removal of an existing baseline ID and any extra promotion beyond the accepted candidate set. If the generated current source inventory, duplicate check, ID list, existing classifications, or accepted-run evidence differ from this proposal, stop and reconcile rather than weakening the exact-set guard.

## Preconditions before the separate implementation GO

1. Society Final Control 13 and root bounded acceptance are recorded in the canonical Society integration; retain the numeric owner-routing evidence limits in FC 13. Wealth has executable production caller excerpts for owners 0, 7, 42, 99 and missing 123; Order and Religion `main.ts` owner-map routes are supported by source review plus bounded helper/component evidence, not representative numeric owner execution through the full main loop.
2. `prod_szybkosc_budynku_proc` completes its one-field production implementation, independent Evaluator, Final Control, and root integration. No unit-speed or rush behavior is bundled into that change.
3. Every code scope included in the exact candidate set is frozen by root. This dispatch creates no final source-hash manifest now. Capture the final manifest only after classifier, generator, test, and all included source/evidence inputs are stable and the authorized targeted checks finish; do not freeze a pre-classifier hash set and later report it as current.
4. The source approval receipt remains exact and unchanged. The root GO identifies the accepted integration IDs and artifact paths to consume.
5. Root reviews this document and issues the future code/data allowlist. This proposal alone does not authorize the classifier, generator, test, or ledger write.

If building-speed acceptance is not yet available, the later partial snapshot may contain the 29 accepted IDs only if root explicitly chooses that partial scope; it must omit building speed, keep unit/rush unwired, and report the actual candidate set. Do not hold on the two pending unit/rush owner answers merely to publish an otherwise approved bounded snapshot.

## Proposed implementation allowlist for the later dispatch

Subject to the separate root GO, keep the future write allowlist to:

- Existing `gra/src/game/civ-matrix-semantic.ts` — change only the exact IDs with accepted consumer evidence. Move only the six accepted G1 IDs out of `BLOCKED`; only the two accepted DIP IDs out of `DECISION_REQUIRED`; add the accepted current F-04 fields. Preserve unrelated status assignments, reasons, and raw-data provenance.
- Existing `gra/tools/civ-matrix-semantic-labels-test.cjs` — adjust only assertions whose expected consumer status changes for the accepted exact IDs; retain all other positive and negative label/status cases.
- New `gra/tools/pr141-current-evidence-ledger-generate.cjs` — generate the new artifact from frozen source/inventory/approval/integration inputs, with explicit validation and no mutation of input records.
- New `gra/tools/pr141-current-evidence-ledger-test.cjs` — validate the new schema and negative/positive controls without editing the historic test.
- New dated run `dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/`: its own dispatch, operator report, evaluator, conditional defense, Final Control, and post-FC root integration; new evidence artifacts only under this run's `evidence/` directory.
- New generated files only in that new run: `evidence/matrix-93x15-current-evidence-ledger-v2.json` and `evidence/source-manifest.json` (manifest populated only after root's freeze).

Explicitly outside the future allowlist: `gra/data/civ-matrix.json`, owner source receipt, all existing/historic ledger files, `gra/tools/pr141-evidence-ledger-behavior-test.cjs`, all product files other than the classifier, all integration/evaluator/final-control reports from other runs, status/goal registries, `PYTANIA-OTWARTE.md`, source workbook, and all unrelated tests. If the implementation needs another path, stop and request a separately reviewed allowlist amendment before editing it.

## Proposed v2 record boundaries

The new dated schema must preserve independent dimensions rather than collapse them into one status:

- `raw_value` and `raw_provenance`: current literal cell and provenance/source history, independently recorded. Preserve the existing provenance for every cell; never rewrite old seed-only history.
- `effective_raw_approval`: `APPROVED_MATCH` only for the exact 360 `(parameter_id, civilization_key)` pairs in `source-approval-receipt.json`, only where approved value equals current matrix value, with receipt path/hash, owner decision reference, workbook hash, effective date, and source sheet/coordinate. Outside the exact set, this overlay is null/absent. Do not infer approval from classifier or integration evidence.
- `consumer_classification`: current semantic consumer status and classifier hash, plus the exact per-ID integration/Final Control/root-acceptance references. This is ID-level supported-consumer status, not 15 independent behavior receipts.
- `bounded_behavior_receipt`: actual test path, recorded result, tested owners/values/tiers/cases, evidence hash if available, and untested dimensions. Keep Society route-specific limits explicit: Wealth has AST-executed caller excerpts; Order/Religion live `main.ts` owner resolution is source-inspected and helper/component-tested.
- `acceptance`: distinct `runtime`, `browser`, `save_load`, `difficulty`, `owner_ai`, and `product_93x15` fields. Set `NOT_VERIFIED` absent evidence meeting that dimension; bounded source execution or an ID's `REAL_GAMEPLAY` label cannot promote it.
- `history`: immutable references to the 2026-10-17 v1 ledger, its old hashes, and the original seed-only/source status. The v1 ledger, manifest, report, tests, and hashes are not regenerated or amended.

All 45 approved source cells across the three production IDs retain `effective_raw_approval: APPROVED_MATCH`. If building speed passes, its 15 cells remain source-approved and its ID receives the reviewed consumer evidence; the other 30 cells for `prod_szybkosc_jednostki_proc` and `prod_rush_koszt_proc` remain raw-approved while those two consumer classifications stay `UNWIRED`. The other F-04 raw cells similarly retain approval independent of whether each ID has accepted consumer status.

## Required generator/test checks

The new generator and test must derive the parameter IDs and civilization keys from canonical source inventories, then validate exact set equality and uniqueness. Required positive and negative controls include:

1. **Inventory completeness:** missing or duplicate raw cell, parameter ID, civilization key, extra cell, wrong dimensions, or mismatch between raw matrix, current source inventory, semantic cells, and generated rows fails. Counts shown in reports come from generated sets; assertions validate the actual exact sets, not an unverified pasted count.
2. **Exact approval scope:** accept only the 360 receipt-backed exact pairs and approved/current value match. Reject fabricated `APPROVED_MATCH`, altered owner/reference/workbook/source hash, wrong value, missing approval cell, duplicate cell, out-of-scope parameter or civ, and any F-04 overlay outside the receipt set. A total of 360 without exact pair equality fails.
3. **Preserved provenance:** reject automatic approval on G1/DIP or other non-receipt cells; preserve their pre-existing `raw_provenance`. Reject changes to historic v1 artifact or hashes. Verify exact source receipt approved values for the unwired unit/rush fields remain raw-approved while consumer status remains `UNWIRED`.
4. **Exact accepted consumers:** reject omission of any accepted integration ID, extra ID, duplicate ID, wrong integration/Final Control/root reference, source-only acceptance, or fabricated `REAL_GAMEPLAY` for `prod_szybkosc_jednostki_proc`, `prod_rush_koszt_proc`, or any other not-accepted ID. The candidate set is 29 until the building gate passes, then exactly 30 if root accepts it; derive the actual final set from reviewed evidence.
5. **Evidence ceiling:** reject full `VERIFIED` runtime/browser/save-load/difficulty/owner-AI/product claims inferred only from bounded tests or source wiring. Reject duplicating a topic-level behavior receipt as 15 per-cell behavior PASS claims, or claiming owner/AI coverage beyond exact tests.
6. **Preservation/immutability:** compare old v1 input files and hashes before/after as read-only references. Reject stale source hashes in the new current manifest after freeze; do not rewrite or relabel historical data.
7. **Positive bounded controls:** accept exact 360 receipt-backed approval overlay; accept exact reviewed 29-ID current set before building acceptance (if that partial target is root-authorized), or the 30-ID set after building acceptance; accept the two remaining production IDs as raw-approved but consumer-unwired; accept `NOT_VERIFIED` on unrun product/runtime dimensions.

## Validation and review sequence for the later dispatch

Only after a separate root GO: freeze the eligible code scopes; apply the exact classifier change and finish generator/test source edits; run the new ledger validator and targeted semantic-label test; review generated actual counts and exact set diffs; stop all edits to hashed source/evidence inputs; then capture the final source manifest over the stable input/code/test/evidence set. Exclude `source-manifest.json`, the generated ledger, and generated logs/results from the manifest's own input hash set to avoid self-hash recursion. Generate the final ledger referencing that manifest and verify no hashed source changed afterward. Record exact commands/output/limitations; submit for independent Evaluator and Final Control; record root integration only after those checks. Any mismatch or failed negative control blocks integration and requires a narrowly scoped correction. Do not run full game/runtime, browser, build, save/load, or broad suites unless separately authorized.

## Current non-actions and evidence boundary

This is a proposed implementation dispatch, not classifier approval, source approval, evidence-ledger generation, runtime evidence, full product acceptance, or readiness for publication. The current recon remains at round 4/5; this dispatch preserves that history and does not restart or reset its counter. The actual ledger execution is a separately identified deliverable/run linked back to this recon and its root-reviewed GO, not a replacement history or a counter reset to bypass the run limit. No source-hash freeze was taken because the building-speed scope is active and shared files may still change. No code, tests, source data, classifier, generator, ledger, status registry, or prior run artifact was modified by this dispatch; no test/build/browser/runtime/fetch/publish command was run for the sync proposal.

DEPLOY/PUSH: NOT AUTHORIZED
