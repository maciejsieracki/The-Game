# AutoBot Final Control — ROBOCZA memory/performance bundle

STATUS: PASS WITH NOTES — exact local candidate; publication/readback still pending.

## Scope review

The source delta from base `a1d8621290d107adc3ece82978d64aa6b7c4c0dc` is limited to the two declared product changes and their tests/reports:

1. `a4d7bc30` removes capture/elimination detail records when the corresponding bounded event cards are evicted, preserving details for cards that remain visible.
2. `782c9b34` reuses unchanged unit stack badges and hunger/deficit sprites across syncs, with updates/disposal when count, status, visibility, or model changes.

No unrelated product source appears in the release delta. The old immediate Robocza bundle and its checksums are recorded in the manifest rollback fields.

## Bundle and hub checks

- `gra-robocza/Gra-ROBOCZA.html`: MD5 `e4c3643d35ba88f9823373ac9419477c`; SHA-256 `d918fb1c5dfd221106c41aa6ec0c74450fbd5ddff1cdcad22c06ba8cf595fc9b`; 70,013,155 bytes.
- `ROBOCZA-MANIFEST.json` and both `bundles[]` rows match the file MD5 and byte size; source snapshot names base and both product commits.
- `START.html` points to both expected bundle URLs and displays the matching MD5 prefix and size.
- `node gra/tools/verify-robocza-bundle.cjs`: `VERIFY OK`. Its stamp-MD5 warning remains due to the repository's self-referential stamp; manifest and final bundle checksums match.
- `git diff --check`: PASS.

## Evidence and limits

Operator, evaluator, and source-level Final Control checks are recorded for each narrow fix. Integrated typecheck and Vite build passed (916 modules). Focused tests passed: capture-retention 20 assertions, overlay-sync 17/17, memory lifecycle 55/55, and capture-report 117/117; the independent evaluator also passed related elimination and side-panel suites (56/56 and 19/19).

A separate legacy elimination-card browser test did not complete in this environment: its configured browser executable was absent, and a local Chromium fallback was blocked from opening the `file://` page by the environment. This does not invalidate the passing focused suites, but should remain visible as an unrun browser check.

The large-imperium baseline completed 38/100 turns and stopped at a 70.2-second turn-limit breach. The 20-cycle city-panel probe did not show accumulating DOM/listener counts. Neither included fix is proven to explain the full 2 GB process RSS or late-game unresponsiveness. No public-host, Kanon, or final-release check is implied.

## Publication gate

This is a local candidate review only. Publish to `origin/main` only after the owner-directed Robocza workflow and remote readback; fill `publicationCommit`/`remoteReadback` in the manifest in the post-publication receipt.
