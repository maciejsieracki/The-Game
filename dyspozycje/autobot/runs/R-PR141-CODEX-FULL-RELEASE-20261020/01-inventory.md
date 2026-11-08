# 01 — Full release inventory and candidate freeze

RUN: `R-PR141-CODEX-FULL-RELEASE-20261020` · round 1/5
BASE WORKING CHECKOUT: `edb8fb56115e9dec0a58614dfb23ca6173d60c9a` on `work`
CANDIDATE BASE: `c799325c77bc11c24684c1b35077ae80913d6f8d` (already-pushed recruitment UI, first-city diplomacy and rivers topic)

## Inventory

The pre-run inventory recorded 52 modified tracked paths and 637 untracked paths. This run added its own dispatch and inventory records, so the frozen external inventory contains 52 modified tracked paths and 638 untracked paths (690 total); this `01-inventory.md` record was added afterward as one additional run artifact. The complete per-path SHA-256/size/status/disposition inventory is external at `/workspace/pr141-publish-20261020/release-r1-inventory.json` (SHA-256 `e8630eeb6441faa98d349b7bd28ea846fc862d3007f5736da2053fea15566875`). Pre-run raw status and tracked/untracked path snapshots are preserved in `release-r1-baseline-manifest.json` plus `release-r1-current-status.txt`, `release-r1-tracked-paths.txt`, and `release-r1-untracked-paths.txt` under that external directory. No checkout file was reset or stashed, and the real Git index was not changed.

The 638 untracked paths comprise 589 AutoBot run records, 41 `gra/tools` scripts, and 8 owner decision documents. All 52 modified tracked files, all 41 new test/tool scripts, and all 8 owner decisions were included in the review candidate. The 589 run artifacts remain outside the product tree; historical evidence, scratch, authorization/browser captures, and runtime harnesses stay preserved in the original checkout. Relevant accepted run records will be linked in release integration documentation after independent review; their exclusion from the product candidate does not erase their evidence.

## Frozen candidate

Candidate snapshot: `/workspace/pr141-publish-20261020/release-r1-candidate`, produced by archiving candidate base `c799325c77bc11c24684c1b35077ae80913d6f8d` and overlaying exactly the 52 modified tracked paths, 41 new `gra/tools` paths, and 8 new owner decision paths. The external candidate change manifest is `release-r1-candidate-source-manifest.json`, SHA-256 `647a7786010b91d30793677f37d4d9d037e633be84f01157752d0aa4c96f0546`. A deterministic full-tree path/content digest is `479270191c803001ef3cb7ce5c442993823d3261c2ac92f9a57e6a2a54b4baf0` across 6,222 files. This digest is not a Git tree object ID.

## Acceptance boundary

This candidate assembles the locally bounded source changes already authorized and their current tests/owner decisions for review. It does not assert full 93×15 gameplay acceptance, full browser/gameplay acceptance, full runtime/save-load acceptance, or release readiness. F-05 legal battle observation and terrain/runtime evidence remain open. The old ROBOCZA manifest contains obsolete scope/exclusion text and is not copied as release truth; candidate metadata must be rebuilt from this run's actual evidence and should bind the real base commit plus candidate source-tree identity. `sourceCommit`, `integrationCommit`, and `publishCommit` must not be asserted before those commits exist; final pushed commit belongs in the post-push receipt.

No test/build, stage, commit, push, deployment, or publication was performed by this inventory step. External evaluators have been sent the candidate path and hashes for independent review.

## Metadata preparation note

A draft ROBOCZA manifest was briefly placed inside the candidate directory during metadata planning, then immediately moved out after the independent Final Control identified it as an unmanifested file. The draft is preserved at `/workspace/pr141-publish-20261020/release-r1-metadata-draft/ROBOCZA-MANIFEST.release-draft.json` (SHA-256 `b3b206d6d68453fe29cc63d0b3c2579f5f43b3376e75164351bf8ee9f488176f`). The frozen candidate was restored and rechecked at 6,222 files and digest `479270191c803001ef3cb7ce5c442993823d3261c2ac92f9a57e6a2a54b4baf0`; no source file was changed. Final metadata and generated assets will be assembled separately from the frozen candidate and tracked as explicit release additions.
