# Robocza predeployment preparation — R-ARMY-STACK-ICONS-MERGE-PANEL-Q1

STATUS: **CANDIDATE PREPARED; NOT DEPLOYED**
DATE: 2026-10-28
SOURCE: pushed `origin/main` commit `e97fc48e9742a663fa56a65074cb06a088346423`
CANDIDATE DIR: `/tmp/the-game-robocza-main-e97/gra-robocza/`

## Candidate bundle

- `Gra-ROBOCZA.html` — 70,015,799 bytes
- MD5: `e5addddd6415ac9f0a5ab2dbf6431692`
- SHA-256: `ac2217a3e5b4efba576d9e02d67d798a7d34f3a92d83d7ab6ef32f73cf68db54`
- Prepared companion files: `ROBOCZA-MANIFEST.json`, generated `START.html`, and eight synchronized `Gra-ROBOCZA-PLAYTEST-*.html` copies; manifest lists ten launch rows (two main links plus eight playtests).

The temporary manifest marks this as `CANDIDATE`, preserves the previous release object, and pins source/product/integration commits, bundle hashes, byte count, verification and scope. It is not copied to the repository's published `gra-robocza/` directory.

## Verification on the exact pushed source

- Clean detached worktree at `e97fc48e`.
- TypeScript: PASS.
- Merge panel real Chromium: 26/26 PASS, including 600×413 CSS px at DPR 1.5; observed top/bottom gaps exceed 24 px.
- Split/merge icons: 7/7 PASS.
- Vite single-file build: PASS, 916 modules.
- `CIV_SMOKE_HTML=.../Gra-ROBOCZA.html node tools/smoke.cjs`: `SMOKE OK`, booted game data and appended a canvas.
- `node gra/tools/verify-robocza-bundle.cjs`: `VERIFY OK`; manifest MD5 and `bundles[]` size/hash match the file.

Known tool limitation: the embedded build-stamp MD5 field differs from the final file MD5 after iterative stamping (`stamp match: WARN`). This Linux tool limitation is recorded in the candidate manifest; its authoritative top-level and `bundles[]` hashes match the actual bundle.

## Publication state

The scoped product commits are on `main`. The Robocza bundle, manifest, START hub, and playtest copies remain only in the temporary candidate directory. No Robocza deploy, repository bundle update, GitHub Raw readback, or external host verification has occurred.
