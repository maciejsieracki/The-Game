# Release candidate verification, 2026-10-20

Candidate: `/workspace/pr141-publish-20261020/release-r1-candidate`

Candidate manifest SHA-256: `6884cacda70e72f75307ab5ff7703359eefa3328ff5c6a7b71c650159b8120b4`.
Candidate tree path/content digest: `27091bbb71fbf506050209218b66f217f4f66282bb3407b04e46b638106b934b` (6,222 files; reported by inventory operator). Candidate changes are 52 tracked modifications, 41 new `gra/tools` scripts, and 8 owner decisions over base `c799325c77bc11c24684c1b35077ae80913d6f8d`.

## Build checks

- TypeScript: PASS, `node ./node_modules/typescript/bin/tsc --noEmit` from candidate `gra` (temporary dependency symlink removed after execution). Exit 0.
- Vite: PASS, direct `node ./node_modules/vite/bin/vite.js build --outDir /tmp/pr141-full-release-dist-20261020` from an external byte-identical validation clone. 893 modules transformed; 16.15 s. Output `/tmp/pr141-full-release-dist-20261020/index.html`, 69,848,820 bytes, SHA-256 `eea0f3ba79e6ec24f9b483b9136c1a8f7ec5fb0d28fae6e28171e3cfea8fe056`.

The validation clone was copied from the frozen candidate before the test-only consumer-consistency expectation update. After that update, only `gra/tools/pr141-semantic-consumer-consistency-test.cjs` was copied from the candidate into the external clone and that suite was rerun. Product source/data were unchanged by the test-only update. The candidate itself was not written by the build or tests.

## Focused checks

All tests ran from `/workspace/pr141-publish-20261020/validation/source-clone/gra`; logs are under `/workspace/pr141-publish-20261020/validation/logs/`.

- Semantic labels: PASS.
- Semantic consumer consistency after owner-approved rush expectation correction: 52/52 PASS.
- Matrix-only production: 19/19 PASS.
- Matrix-only economy: 92/92 PASS.
- Matrix-only AI: 40/40 PASS.
- Matrix-only combat: 36/36 PASS.
- Manpower: 71/71 PASS.
- Manpower matrix sensitivity: 225/225 PASS.
- F-04 rush activation: 72/72 PASS.
- Save/MP/F-05/G-11 bounded-source behavior: PASS; the harness explicitly does not prove full-game save/load.
- Population matrix wiring: 122/122 PASS.

One existing `pr141-population-behavior-test.cjs` harness failed on an esbuild fixture error, both in the parallel group and a solo retry: its temporary `civ-matrix-fixture.ts` lacked the `applyCivMatrixParam` export imported by `src/game/economy.ts:45`. No product source was changed to work around this harness failure. The earlier consumer-consistency failure (`UNWIRED` expectation) was fixed by its owner with test-only expectations matching the already-authorized rush activation and then passed 52/52.

No browser/gameplay acceptance was performed here. No 93x15 gameplay acceptance is claimed. Separate browser validation remains with its assigned operator.

## Evidence hashes

- Corrected consumer test log: `ec25a653e8b9caa1fd49c0863c0db9db05192ad13c5685d890eb0091fb15fbfb`
- Population behavior harness failure log: `a692b072a1991139333956cb739bf0660690167eee06dda5ef10b18e9c6f8088`
- Save/MP/F-05/G-11 log: `e4f870f16ce1cfc420c4263bb704478478642ff1aa3384b1172601f25ed5566c`

## Addendum: corrected population behavior harness

The original `pr141-population-behavior-test.cjs` run failed because its temporary fixture did not export `applyCivMatrixParam`; that failure and log remain recorded above. The frozen candidate now contains a test-only fixture shim at `gra/tools/pr141-population-behavior-test.cjs` (SHA-256 `6436894f937ad72a97728edf7ec69b079c3713bb7f1f6e9c804fc51f633e912f`). I copied that exact candidate file into the external validation clone and independently reran the focused test once: **24 passed, 0 failed**. The corrected run log is `/workspace/pr141-publish-20261020/validation/logs/population-behavior-corrected.log`, SHA-256 `fde2c1977896cae7a65ba8921f5faedebecff251b29fcc02bf9188649835845f`.

The candidate manifest is now SHA-256 `66bec8206b501f96ca64f4f24b316b12ede6ba3606f5d319de753cd79ac5a673`; inventory reports 6,222 files with tree digest `8d1224714d326b395f0086e4c7eec40729aace78124000c4db46405f45f21d2c`. The inventory operator confirms this update changes only the focused test fixture and leaves product source/data unchanged, so the recorded TSC and Vite results remain applicable. There are no unresolved population fixture failures pending; the initial failure is superseded by the corrected 24/24 run.
