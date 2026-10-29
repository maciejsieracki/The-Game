# 04 — Integration

**STATUS:** `PASS — ZINTEGROWANE; READY_FOR_DEPLOY` (remote publication pending).

- Rebased the accepted candidate onto current `origin/main@aeecff7194c3a6490cc42fded6b918b7e4b23df5`; the prior merge/split icon release remains included.
- Product commits after rebase: `5c65b20a` (duration semantics and UI), `f216263d` (cyclic-only control scope). Evaluator and Final Control reports are PASS / PASS-WITH-NOTES.
- Allowlisted product files: `gra/src/game/diplomacy-proposals.ts`, `gra/src/main.ts`, `gra/src/ui/diplomacyNegotiationModal.ts`, `gra/src/ui/diplomacyTradeBasket.ts`; focused tests, task run/registry, and generated Robocza bundle/manifest/START.
- Post-rebase verification: `npm run typecheck` PASS; cyclic trade 53/53; duration UI 12/12; broad proposal test 186/188 with both peace assertions reproduced at baseline; `git diff --check` PASS.
- Vite single-file build: 917 modules. Robocza verifier `VERIFY OK`; boot smoke PASS (canvas and render frame). Bundle MD5 `29022be80b95e838a861a8ea70e8a915`, SHA-256 `f0177a6469973e498389fa9b264f0287e9db5dff01f06487dac0d16a7bff2b97`, size 70,031,368 bytes.
- Remaining release gates: push to `origin/main`, then HTTP/hash readback of bundle, manifest, and START.
- **DEPLOY/PUSH:** local Robocza artifact prepared; push not yet executed.
