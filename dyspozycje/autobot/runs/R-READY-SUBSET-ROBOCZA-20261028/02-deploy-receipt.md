# Robocza deployment receipt — 2026-10-28

STATUS: DEPLOYED — remote readback PASS.

- Source integration commit: `f48894231b7dfeb3d1726ac7a3deba11a8c7a3f0`.
- Robocza artifact commit on `main`: `f6f63dc839449d8e08a7e2509ec72796757867af`.
- Bundle: `gra-robocza/Gra-ROBOCZA.html`.
- SHA-256: `f379b328b1f7c63f1e860a76f3310a98b189ebcb16ed5a444e3f7ebd4a41b452`.
- MD5: `03d8d29e4714204bff62a27823e946ee`.
- Size: `70,019,132` bytes.

Before the receipt metadata update, the exact artifact commit was pushed fast-forward to `origin/main`. Pinned GitHub Raw readback at that commit returned HTTP 200 for the bundle, manifest, and START. The fetched bundle hashes and size matched both manifest `bundles[]` rows, and START showed the current MD5 prefix. Local Chromium loaded the same bytes with two canvases, menu and HUD, with no page or console errors.

The metadata now records that publication and the pinned readback. The new source commit is a descendant of the prior `origin/main` base `0b28d67fe6fae0bfbf9be39bd0ec84130080fb4d`; no force push or history rewrite was used. Large-empire performance remains the next test after this smaller release. AI sea priority, commander map badge/emblem, and the separately passed five-turn march source were excluded from this bundle.
