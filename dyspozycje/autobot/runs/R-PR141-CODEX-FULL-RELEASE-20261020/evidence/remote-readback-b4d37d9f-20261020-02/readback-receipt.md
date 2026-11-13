# Remote artifact readback receipt

- Target: `https://github.com/maciejsieracki/The-Game.git`, `refs/heads/main` at `b4d37d9f81686b5b21bb256087a55e3a592721f0` (confirmed with `git ls-remote` on 2026-10-21).
- Retrieval: immutable raw GitHub URLs pinned to that commit; all three returned HTTP 200. Resolved URLs matched the requested pinned URLs.
- Bundle: `gra-robocza/Gra-ROBOCZA.html`, 69,943,587 bytes; SHA-256 `234dff75036b22e423b33f9d6134428c559b612922b866399346f0e94ebfca4a`. Matches `bundleSha256` and `bundleBytes` in fetched manifest.
- Manifest: `gra-robocza/ROBOCZA-MANIFEST.json` (actual filename: `ROBOCZA-MANIFEST.json`), SHA-256 `d3bd4d70d179bd8885e7b673281810f695d956439057fad61e00c4fa17ef62b9`. It identifies `Gra-ROBOCZA.html` and the expected bundle digest/size. The manifest's frozen content still says commit/push/deploy pending; the authoritative pushed target is the immutable raw URL plus the live `main` ref above.
- Start hub: `gra-robocza/START.html`, SHA-256 `5c12b26e98a2af96fe8cf1706a489d188e4b718e4251f0cb0b0da31ecf0625a6`; its `href="Gra-ROBOCZA.html?skipMenuRedirect=1"` links to the fetched bundle.
- Browser readback served only the fetched bundle from `http://127.0.0.1:18742/`. The browser fetched HTTP 200 and recomputed the expected bundle SHA-256. Menu check PASS: title `The Game — 4X`, start button visible, two visible canvases, zero console errors and zero page errors. See `evidence/report.json` and `evidence/postdeploy-menu-canvas.png`.
- This verifies pinned GitHub remote artifact bytes served locally. It does not identify or verify any public production hosting route. Both predeploy full-flow browser attempts remain FAIL; this bounded menu check is not a full gameplay smoke pass.
