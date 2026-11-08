# Current classifier and evidence ledger — implementation dispatch

STATUS: ROOT GO — IMPLEMENTATION AUTHORIZED WITH GATED GENERATION
TEMAT: R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018
RUNDA: 5/5 (continuation of CURRENT-EVIDENCE recon round 4/5; distinct execution deliverable)
DATA: 2026-10-18
DOMAIN: INFORMATIONAL / CLASSIFIER AND EVIDENCE SYNCHRONIZATION
ŚCIEŻKA: A (collaboration per session adaptation)
MODEL + EFFORT: Operator gpt-6-luna / medium; independent Evaluator gpt-6-luna / medium; Final Control gpt-6-luna / medium; root integration.

## Trigger and bounded GO

Root reviewed and approved the proposed exact dispatch in `R-PR141-CODEX-CURRENT-EVIDENCE-RECON-20261018/06-classifier-ledger-sync-dispatch-r4.md`; its independent Evaluator 07 and Final Control 08 accepted the plan. Root now authorizes the additive classifier/current-ledger implementation described here. This is a distinct execution artifact/run linked to that recon; it does not rewrite or reset the recon's round-4 history to evade the five-round limit.

Society's three IDs were accepted locally after Final Control 13 and root integration 14. Root also accepted `prod_szybkosc_budynku_proc` after its own Evaluator 05, Final Control 06, and root review; its integration record is being written at `R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018/07-integration-building-speed.md`. **Do not generate the manifest or ledger until that exact integration file exists and has been read and verified.** The two production fields `prod_szybkosc_jednostki_proc` and `prod_rush_koszt_proc` remain `UNWIRED` pending owner semantics.

The sole canonical F-04 raw-source approval input is `dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOURCE-APPROVAL-20261018/source-approval-receipt.json`. Do not use another run's file, an earlier message, workbook interpretation, or inferred production approval in its place. It approves exactly 24 IDs × 15 civ keys = 360 raw cells from workbook SHA-256 `c285c410012d0fca67acf40200f03ace4cf98bd538fde40c3ea3799c79a62f32`; it does not approve other parameters or product acceptance.

## Goal and exact candidate additions

Add only the 30 newly accepted bounded consumer IDs to the frozen existing classifier baseline. Preserve every pre-existing `REAL_GAMEPLAY` ID and every unrelated status assignment. The exact 30 candidate IDs are:

- G1 (6): `walka_atak_piechota`, `walka_obrona_piechota`, `walka_pancerz_piechota`, `walka_dystans_lukownicy`, `walka_hp_piechota`, `walka_hp_rydwany` — `R-PR141-CODEX-G1-ACTIVATION-20261018/11-integration.md`.
- DIP (2): `dip_nastawienie_bazowe`, `dip_agresja_archetyp` — `R-PR141-CODEX-DIP-ACTIVATION-20261018/08-integration.md`.
- F-04 Work (1): `eko_praca_proc` — `R-PR141-CODEX-F04-WORK-ACTIVATION-20261018/06-integration.md`.
- F-04 Cost (2): `prod_koszt_budynku_proc`, `prod_koszt_jednostki_proc` — `R-PR141-CODEX-F04-COST-ACTIVATION-20261018/06-integration.md`.
- F-04 Society (9): `wealth_cap_proc`, `kultura_naplyw_proc`, `porzadek_produkcja_proc`, `porzadek_nauka_proc`, `porzadek_kultura_proc`, `porzadek_wzrost_proc` — `R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/06-integration.md`; `wealth_mnoznik_proc`, `religia_spread_proc`, `porzadek_pieniadz_proc` — `R-PR141-CODEX-F04-SOCIETY-REMAINING-20261018/14-integration.md`.
- F-04 Yields (9): `eko_handel_brutto_proc`, `eko_pieniadz_proc`, `eko_pieniadz_port_proc`, `eko_zywnosc_proc`, `eko_nauka_proc`, `eko_kultura_proc`, `eko_luksus_proc`, `eko_zadowolenie_proc`, `eko_korupcja_proc` — `R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/08-integration.md`.
- F-04 Building speed (1): `prod_szybkosc_budynku_proc` — include only after verifying `R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018/07-integration-building-speed.md` exists and confirms root acceptance following Evaluator 05 and Final Control 06.

These 30 are **additions**, not the total classifier `REAL_GAMEPLAY` count. At execution, capture the exact current baseline set from `civ-matrix-semantic.ts`, preserve every existing ID, and promote only the exact candidate set above. Derive and report the resulting count from the actual generated set; do not hardcode a total. If any candidate lacks its cited accepted integration, stop and do not generate a final artifact.

Do not promote `prod_szybkosc_jednostki_proc`, `prod_rush_koszt_proc`, or any other unlisted ID. Raw approval and consumer classification are separate dimensions. All 45 raw cells across the three production fields are covered by the canonical receipt: building speed's 15 are approved with a bounded consumer; unit speed and rush's 30 remain approved raw values but have `UNWIRED` consumer status.

## Required record boundaries

Generate a new dated v2 ledger from current canonical inventories. Derive dimensions and counts from the matrix/parameter/civilization sources, then validate exact set equality and uniqueness; expected inventory is 93 parameter IDs × 15 civ keys (1,395 cells), but the report must use actual generated counts.

Each record must keep these independent:

- `raw_value` and `raw_provenance`: current literal matrix value and source/history. Preserve all existing raw provenance, including non-F-04 provenance.
- `effective_raw_approval`: `APPROVED_MATCH` only for the exact receipt-backed 360 `(parameter_id, civilization_key)` pairs and only on approved/current value equality. Outside the exact set, null/absent. Do not auto-approve G1, DIP, or any other raw values.
- `consumer_classification`: current status, classifier hash, and exact accepted integration/Final Control/root references. Keep the full pre-existing baseline set and add only the exact 30 IDs.
- `bounded_behavior_receipt`: per-ID test/source evidence references and exact exercised owners, values, controls, and limits. Do not replicate one ID-level result into 15 cell-level behavior PASS claims. Preserve Society evidence asymmetry: Wealth has actual AST-executed caller statements; Order/Religion owner routing in main loop is source-inspected plus bounded helper/component tests.
- `acceptance`: separate runtime, browser, save/load, difficulty, owner/AI, and 93×15 product dimensions. Leave `NOT_VERIFIED` unless direct evidence supports that dimension. `REAL_GAMEPLAY` is not full acceptance.
- `history`: immutable references to the old v1 seed-only ledger, original source hashes, and structural-only evidence.

## Exact allowlist

Write only these paths in this task:

- `gra/src/game/civ-matrix-semantic.ts` — additive promotions for the exact 30 IDs only; preserve all existing REAL_GAMEPLAY IDs and unrelated statuses/reasons.
- `gra/tools/civ-matrix-semantic-labels-test.cjs` — focused expected-status assertions for the exact 30 new additions and negative preservation checks for baseline IDs and excluded unit-speed/rush IDs.
- `gra/tools/pr141-current-evidence-ledger-generate.cjs` — new generator; consume only canonical, explicit source and accepted-integration inputs; no input mutation.
- `gra/tools/pr141-current-evidence-ledger-test.cjs` — new validator test with positive and negative mutation controls.
- This new run's own `01-operator-report.md` and new `evidence/` artifacts: `evidence/matrix-93x15-current-evidence-ledger-v2.json` and `evidence/source-manifest.json`. The new run's `00-dispatch.md` has been created first as required.

Do not modify the old `gra/tools/pr141-evidence-ledger-behavior-test.cjs`, the 2026-10-17 v1 ledger/manifest/report, source receipt, matrix JSON, any other product/test file, previous run artifact, registry, status file, `PYTANIA-OTWARTE.md`, or source workbook. If a needed path is outside this exact list, stop and request a root-reviewed allowlist amendment.

## Snapshot, manifest, and generation order

Before the first source/test mutation, record snapshots of both allowlisted existing files, their pre-edit hashes, and their pre-existing diffs in this run's operator evidence. Preserve prior shared hunks exactly. No other product modules may change while this lane runs.

Do not create a final manifest before code edits. After classifier, generator, validator test, and the accepted source/evidence inputs are stable, run authorized targeted checks, stop editing hashed inputs, then compute the final source manifest over that stable set. Exclude the manifest itself, generated ledger, and generated logs/results from their own input hash set to avoid recursion. Generate the ledger referencing the manifest and verify no hashed source changed afterward. The canonical receipt and building root integration must exist and match their exact cited identities before generation.

The previous ledger remains immutable: do not apply historical mutation fixtures to it, do not update its old approval count from 0 to 360, do not replace its old hashes, and do not retroactively rewrite its status.

## Required validator controls and authorized checks

Negative controls must reject: fabricated or unsupported approval; altered receipt/workbook/owner reference or raw value; any missing, duplicate, out-of-scope, wrong-civ, or extra approval cell; any missing/duplicate/extra matrix cell; omitted/duplicate candidate ID; wrong integration or FC reference; promotion of unit speed, rush, or any unaccepted ID; removal of a pre-existing REAL_GAMEPLAY ID; a total count that disagrees with actual sets; unproven behavior receipts; 15-cell behavioral PASS replication; and unsupported runtime/browser/save-load/difficulty/owner-AI/product verification.

Positive controls must accept the exact 360 receipt-backed cells, all 30 exact accepted consumer additions, the untouched pre-existing REAL_GAMEPLAY baseline, raw-approved but consumer-UNWIRED unit speed/rush, and `NOT_VERIFIED` runtime/product dimensions.

After building integration 07 is present and validated, the authorized checks are the new current ledger validator, the targeted `civ-matrix-semantic-labels-test.cjs`, and direct `node node_modules/typescript/bin/tsc --noEmit`. No world, browser, server, full runtime, save/load, build, full suite, publication, push, or old-ledger mutation test is authorized here.

## Handoff

Record exact generated counts, exact ID set comparison, source-manifest identity, artifact paths, command results, and all bounded-evidence limits in `01-operator-report.md`. Submit the implementation/artifacts for independent Evaluator and Final Control. Root integration is a separate post-review action. No 93×15 product acceptance or readiness for publication is claimed.

DEPLOY/PUSH: NOT AUTHORIZED

## Dated amendment — 2026-10-18, v3 implementation GO (round 3/5)

Root accepts the v3 proposal in `06-v3-dispatch-proposal.md` with the following exact clarifications and authorizes the allowlisted v3 wrapper/validator implementation. The semantic-consistency run has passed Evaluator 06 and Final Control 07 and is accepted by root; however, **do not generate the manifest or ledger until** `dyspozycje/autobot/runs/R-PR141-CODEX-SEMANTIC-CONSUMER-CONSISTENCY-20261018/08-integration.md` exists and has been read/verified.

- Egypt's civilization key is exactly `egipt`. The `walka_ruch_bitwa_proc` Egypt cell at raw `0.15` is intentionally `BLOCKED` under decision 1B, while its parameter remains among the 34 accepted consumer IDs and the Zulu/general cell remains active. The expected actual matrix has 1,004 `REAL_GAMEPLAY` cells if this is the single blocked cell; derive the actual count from the live semantic snapshot.
- The v3 wrapper must enrich every ledger cell with exact current semantic `polarity` and `statusReasonPl` as well as status/label by executing the actual semantic snapshot API from a unique temporary esbuild entry. Do not reconstruct/copy classifier logic. The validator must compare per-cell current status, reason, and polarity against that actual snapshot, including Egypt's precedence exception and the three corrected discount polarity statuses.
- The v3 manifest includes all 58 inputs from v2's historical source closure plus the new v3 wrapper/validator, `gra/src/game/embarkation.ts`, the semantic-consistency test, accepted semantic-consistency records including integration 08, and the v2 history artifacts. No generated output or manifest self-loop may be hashed.
- v3 records 34 ID-level bounded receipts, not per-cell behavior PASS claims. Preserve the exact 360 F-04 raw approvals. Mark v2's 63-ID artifact as `SUPERSEDED_NOT_ROOT_INTEGRATED` in v3 history because its classifier snapshot is stale for the accepted semantic changes; do not invent root acceptance for v2 or modify its files.

Exact implementation allowlist: new `gra/tools/pr141-current-evidence-ledger-v3-generate.cjs`, new `gra/tools/pr141-current-evidence-ledger-v3-test.cjs`, this run's new `evidence/*-v3.json` outputs and new `07-v3-operator-report.md`. Do not edit v1/v2 artifacts, v2 generator/test, prior reports, matrix/classifier, or any product source. After the semantic integration precondition, freeze final source inputs and run only the v3 validator, `node tools/civ-matrix-semantic-labels-test.cjs`, and direct `node ./node_modules/typescript/bin/tsc --noEmit`. No build, world, browser, full runtime, publish, or deployment.

## Dated amendment — 2026-10-18, round 4/5 reproducibility defense

Following evaluator finding `08-v3-evaluator.md`, root authorizes only these exact-byte repository-local source-history copies and v3 validation/manifest repair:

- `evidence/source-history/26-owner-decisions-20261015.md`
- `evidence/source-history/review-f05.md`
- `evidence/source-history/review-g11.md`
- `evidence/source-history/source-history-index.json`
- New v3 generator/validator changes, v3 manifest/ledger regeneration at their existing v3 filenames, this run's `06-v3-dispatch-proposal.md` amendment, and `09-v3-defense-r4.md`. The un-hashed operator report `07-v3-operator-report.md` may receive a dated supersession addendum after final hashes are known.

Copies preserve exact original bytes; the index records original path, original SHA-256, repository copy path/SHA-256, date, and that this is source-history provenance rather than a new owner decision. Generator checks the index/copy digest relation; subsequent validation must not read or require the external originals. V3 manifest inputs must be repository-local: reject absolute paths, traversal components, and any resolved path outside the repository. Replace the three external manifest entries with the source-history copies and index. Add in-memory negative controls for outside-root paths, missing/changed history copies, and index/hash mismatch. Keep the exact 58 prior v2 closure paths and preserve every prior validator control. V1/v2 files and v2 generator/test bytes remain immutable. The semantic/product scope, 34 ID receipts, 1,004 active cells, one Egypt 1B BLOCKED cell, exact 360 approvals, and acceptance ceiling do not change.
