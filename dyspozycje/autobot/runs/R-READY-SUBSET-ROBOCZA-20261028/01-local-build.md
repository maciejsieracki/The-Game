# Local Robocza build and package verification

STATUS: PASS — exact source commit package prepared; remote publication pending.

- Source commit: `f48894231b7dfeb3d1726ac7a3deba11a8c7a3f0`.
- Build command: `./node_modules/.bin/vite build --outDir /tmp/the-game-ready-subset-20261028-dist` from `gra/`.
- Vite 5.4.21, 916 modules; single-file output 69,924.29 kB before stamp.
- Stamp: `node gra/tools/inject-build-stamp.cjs gra-robocza/Gra-ROBOCZA.html ROBOCZA`.
- Bundle SHA-256: `f379b328b1f7c63f1e860a76f3310a98b189ebcb16ed5a444e3f7ebd4a41b452`.
- Bundle MD5: `03d8d29e4714204bff62a27823e946ee`.
- Bundle size: `70,019,132` bytes.
- `node gra-robocza/tools/generate-start-hub.cjs` — PASS.
- `node gra/tools/verify-robocza-bundle.cjs` — `VERIFY OK`; manifest digest, both bundle rows and size agree. The embedded iterative MD5 stamp reports the known nonfatal mismatch; the top-level manifest is authoritative.
- Local HTTP + Chromium smoke of the exact bundle: HTTP 200; title `The Game — 4X`; two canvases; menu and HUD visible; 0 page errors and 0 console errors (favicon path intentionally answered 204).

External GitHub readback has not yet been performed.
