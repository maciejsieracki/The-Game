# 04 — Integration

**STATUS:** `PASS — ZINTEGROWANE; READY_FOR_DEPLOY` (remote publication pending).

- Rebased onto current `origin/main@2a6df3f36da3f404a7afd1c869cfec4a7fd606a2`; accepted icon and trade releases remain included.
- Product commits after rebase: `98e9f6ee` recruitment default/per-unit persistence, `869cde2a` same-hex toggle and follow, `7738027f` instant end-turn follower sync.
- Allowlisted product files: `gra/src/game/save.ts`, `gra/src/main.ts`, `gra/src/ui/empireDetailPanel.ts`, `gra/src/units/setup.ts`, `gra/src/game/generalQuickFollow.ts`; focused UI/save/follow tests and task run/registry; generated Robocza bundle/manifest/START.
- Post-rebase checks: `npm run typecheck` PASS; `general-quick-follow-action-test.cjs` 20/20; recruitment UI PASS; save/legacy PASS; `git diff --check` PASS.
- Vite single-file production build: 917 modules. Robocza verifier `VERIFY OK`; boot smoke PASS (canvas + render frame). Bundle MD5 `15eabd0ba132bde2454f74d47371a685`, SHA-256 `80be74dbece3ae923efdeffee193aec1607ae6e0555a4f36973406891a31b508`, size 70,033,099 bytes.
- Remaining release gates: push to `origin/main`, then verify remote bundle/manifest/START.
- **DEPLOY/PUSH:** local Robocza artifact prepared; push not yet executed.
