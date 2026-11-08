# Integration — R-ARMY-MERGE-SPLIT-ICONS-Q2

**STATUS:** `PASS — DEPLOY-ROBOCZA / REMOTE-READBACK-PASS`.
**DOMAIN:** GAME
**TEMAT:** `R-ARMY-MERGE-SPLIT-ICONS-Q2`
**GOAL:** separate the army merge and split action glyphs with inward and outward arrows respectively.
**Integrated source candidate:** `002a75815b067cf2cdbcae7eed5c488f8634ea34`; release commit `42b4dac831765176684a506d0be377232fef008a`, pushed to `origin/main`.
**Allowlist:** `gra/src/ui/unitActionBarHtml.ts`, `gra/tools/army-merge-split-direction-icons-test.cjs`, this task's AutoBot reports/registry entry, and generated Robocza release artifacts.
**TESTS:** icon renderer PASS; action bar completeness 31/31; unfortify regression 16/16; TypeScript PASS; diff-check PASS. Production Vite build completed to `/workspace/tmp-robocza-icon-dist/index.html`; Robocza verifier `VERIFY OK`; boot smoke passed with one canvas and a render frame. Bundle MD5 `c7c3e90d634feac44e63b9b69cbc3cad`, SHA-256 `93f846fffedd526eeda1d3b17e25a73e80729b6bb16d3d6e4c2f41224192b974`, 70,029,107 bytes.
**STAMP NOTE:** existing self-referential build-stamp injector writes an iterative marker `60642361040b3ec93525f26595efa309`, so verifier reports a stamp warning while manifest and `bundles[]` exact MD5/size both pass. This behavior is also documented by the verifier, which uses manifest/cert as release authority.
**REMOTE READBACK:** `origin/main` resolved to `42b4dac831765176684a506d0be377232fef008a`; GitHub Raw bundle, manifest, and START returned HTTP 200. Remote bundle MD5/SHA-256/size match local exactly; manifest JSON and START are byte-identical.
**BLOCKERS:** none.
**RUNDY:** 1/5.
**NEXT:** owner playtest; no further release step for this bounded task.
**DEPLOY/PUSH:** EXECUTED; commit `42b4dac831765176684a506d0be377232fef008a`; remote readback PASS.
