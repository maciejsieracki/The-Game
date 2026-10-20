# Final Control — bounded PR141 full-release candidate

STATUS: PASS-WITH-NOTES — bounded source/artifact publication accepted; full browser smoke remains FAIL.
DOMAIN: RELEASE / INTEGRATION CONTROL
TEMAT: R-PR141-CODEX-FULL-RELEASE-20261020
RUNDY: 1/5 (attempt 02 was same-round, root-authorized defense; no new round)

## Decision

I accept the frozen candidate for the explicitly bounded publication scope reviewed here. The source/evaluator/build/test evidence supports publication of this candidate, and the failed post-founding browser-helper interaction is not evidence of a production defect. This is not a PASS for the complete predeploy smoke, and it does not establish full gameplay/runtime, save/load parity, F-05 battle, 93×15 acceptance, or a deployed-site readback. Preserve both browser attempts as FAIL. Any deployment record must identify the actual public route and record exact served-byte readback separately.

## Frozen pins reviewed

- Candidate base: `c799325c77bc11c24684c1b35077ae80913d6f8d`.
- Source candidate manifest: `/workspace/pr141-publish-20261020/release-r1-candidate-source-manifest.json`, SHA-256 `683a5f903cd2b8c5f3bbb19bc733f83dc18cf6ea72b1916cfc186b9965178371`; path/content digest `8d1224714d326b395f0086e4c7eec40729aace78124000c4db46405f45f21d2c` over 6,222 files.
- Release bundle: `/workspace/pr141-publish-20261020/release-r1-assembly/gra-robocza/Gra-ROBOCZA.html`, SHA-256 `234dff75036b22e423b33f9d6134428c559b612922b866399346f0e94ebfca4a`, MD5 `3b6610b74fd6586c5507908fe7665369`, 69,943,587 bytes.
- Final assembly manifest: `/workspace/pr141-publish-20261020/release-r1-assembly/gra-robocza/ROBOCZA-MANIFEST.json`, SHA-256 `75f9113390e18fadc6baa02e2a4599dc93cb4ec22a32dad8f11b90bf466a18be`. It pins the bundle, source manifest, validation report, and current evaluator report. The operator ran the manifest verifier after updating the evaluator-report reference: `VERIFY OK`; the bundle bytes remained unchanged. The known Linux stamp self-MD5 warning remains documented as a port limitation.
- Independent evaluator report: `/workspace/The-Game/dyspozycje/autobot/runs/R-PR141-CODEX-FULL-RELEASE-20261020/03-independent-evaluator-release.md`, SHA-256 `f59ee99b54c6984e72eaf5f3d2877a35fc4debd8a9f1e9bef8a88f70f00854c9`.
- Validation report: `/workspace/pr141-publish-20261020/validation/release-verification-report.md`, SHA-256 `da63d74241e4d9877c96985c233d83b82c0df36f1bd5a7b442e3fef038cbe053`.

## Technical review

The independent evaluator found no production-source finding in the candidate. The two same-round corrections are test-only: corrected owner-approved rush expectations retain their assertions (52/52), and the population fixture supplies the missing import contract without reducing assertions (24/24). Earlier failures are preserved. TypeScript no-emit and direct Vite production build passed (893 modules; built output SHA-256 `eea0f3ba79e6ec24f9b483b9136c1a8f7ec5fb0d28fae6e28171e3cfea8fe056`). Focused source suites and bounded save/MP checks are listed in the validation report; none constitutes full save/load acceptance.

The release manifest accurately limits the claims. No full 93×15 gameplay result, complete runtime/gameplay acceptance, full save/load parity, F-05 battle observation, terrain/runtime completion, or external hosting evidence is asserted.

## Browser evidence and disposition

Attempt 01 (`predeploy-01/report.json`, SHA-256 `e2fa82504e1f470045a1ae14bdfd8c76c7887d1b63f19d3297a1ffb1fc91c977`) and attempt 02 (`predeploy-02/report.json`, SHA-256 `b1be5b5bbb67ac1b95992494cbb066586879bc311f6ba317c8cda95646eaa41a`) both remain FAIL for the complete flow. Both read back the exact local bundle bytes, loaded the configured map, and passed the ordinary first-city founding/readback. Attempt 01 dismissed three visible first-contact audiences and then timed out on the diplomacy-list overlay; it also recorded two favicon 404s. Attempt 02 had no reported page/console errors or HTTP 404s, but the ordinary helper timed out after 4,444 ms without a completed audience dismissal.

The corrected attempt-02 report is `/workspace/The-Game/dyspozycje/autobot/runs/R-PR141-CODEX-FULL-RELEASE-20261020/04-browser-attempt-02.md`, SHA-256 `ab0f56113259d2047b7d776923ee925379f2df7007589aa292b96596d6de26f0`. Its retained screenshot (`predeploy-02/04-failure-first-city.png`, SHA-256 `57174ae8b689b2a263730c6d9f860f426d926e3c49290ef939157ab644cb106c`) visibly shows the diplomacy audience and enabled `Wróć` control. The JSON's zero dismissal/list-close counts represent completed actions, not UI visibility. Thus the evidence supports a bounded helper interaction/timing failure; it neither proves successful dismissal nor establishes a product-source defect. The raw failed runs remain untouched, and no third browser attempt is warranted for this bounded publication decision.

## Boundary

This verdict supports only the reviewed, pinned candidate/source publication scope. It does not claim the full smoke passed or that deployment has occurred. Root retains the already-authorized commit/push/deploy action and must record the actual public route and exact served-byte readback before claiming deployment verification.

FC performed no source edits, tests, browser runs, staging, commit, push, or deployment. The shared checkout contains pre-existing unrelated modifications; they are outside this review's authority and must remain excluded from any publication delta.
