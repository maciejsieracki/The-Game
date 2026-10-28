# AutoBot Integration — ROBOCZA publish and remote readback

**Status: DEPLOYED — REMOTE READBACK PASS**

## Published release

- Repository: `maciejsieracki/The-Game`
- Target branch: `main`
- Release commit: `e06ad53c` (`feat: complete non-performance Robocza fixes`), fast-forward from `99bb834c`.
- Bundle: `gra-robocza/Gra-ROBOCZA.html`
- MD5: `b897f519a377631081bd29b49c76fef2`
- SHA-256: `accb2ee99c74ba7bbc70da060ed62fabf905cf2f021d6e37bacad4a9398ed798`
- Size: `70,011,909` bytes.

## Remote verification

At commit `e06ad53c`, GitHub Raw returned HTTP 200 for the bundle, `ROBOCZA-MANIFEST.json`, and `START.html`. The fetched bundle MD5, SHA-256, and byte size match the manifest and both main-bundle `bundles[]` rows. START links show the current bundle MD5 prefix. The fetched bundle matches the locally reviewed bytes.

Local exact-package verification also passed: `verify-robocza-bundle.cjs` → `VERIFY OK`; Chromium loaded the exact bundle with HTTP 200, title `The Game — 4X`, two canvases, menu/HUD shell and build stamp, with no page or console errors.

## Checks and limits

- TypeScript and Vite production build (914 modules): PASS.
- Operator/Evaluator focused suites for AI war campaigns, owner-0 targeting and save/load, battle leadership/formations, recruitment UI at 150% effective scale, eras/Barracks, economy, food, building costs, music and HUD: PASS. See reports 60–63 in this run.
- Final Control report `63-final-control-current-candidate.md`: `READY_FOR_DEPLOY_WITH_NOTES` for the exact bundle.
- The large-empire performance test was expressly excluded at the user's request. The last 100-turn stress run completed turns 1–46 and Chromium closed during turn 47; performance remains unresolved.
- GitHub emitted its standard warning that the 66.77 MiB bundle exceeds its recommended 50 MiB file size; the push succeeded.
- No separate public game host exists in the project release flow; publication/readback here is from GitHub repository artifacts.
