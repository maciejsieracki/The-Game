# RR-T8d reference data (R-RUSTPORT-P4-31-ATLAS-CACHE-Q1)

Two fixture files, both produced by **running** reference code; nothing is hand-written.

| File | SHA-256 | Produced by | Used by |
|---|---|---|---|
| `atlas_keys.json` (1.5 MB) | `64bba61511615daa647f3cb362d3c8b3bf967ee5fed68b0312124ee5c6a9f5a1` | `gen.sh` → `gen.ts` (node v22.22.0, esbuild 0.24.0, three@0.169.0, web pin `edb8fb56`) | `tests/atlas_keys.rs` |
| `atlas_gl.json` (0.95 MB) | `6ff44618be4667235550904c5b89ef0507b4c099b937fa4d5ee0b1b18858f450` | `gen_gl.mjs` (Playwright 1.56.1, headless Chromium 141.0.7390.37, WebGL2 = ANGLE → Vulkan → SwiftShader) | `tests/atlas_mip.rs` |
| `gen.ts` | `5bf067435895ad176272e0d67c1a6f625aa832c4723600baa57e8c131147b2fa` | — | generator of `atlas_keys.json` |
| `gen.sh` | `592ce20ecfb4263506b83c4df7ccf1d2c7d33aa1a890a3e0755c06a9aea69a46` | — | runner of `gen.ts` |
| `gen_gl.mjs` | `c8e14faeb7761a8490c581f56890babac7db22a900ddba2ae7b60506b51dd742` | — | generator of `atlas_gl.json` |

`SHA256SUMS` holds the same sums (`sha256sum -c SHA256SUMS`). Both generators are deterministic
(fixed xorshift seeds); a second run gives byte-identical files
(`dyspozycje/autobot/runs/R-RUSTPORT-P4-31-ATLAS-CACHE-Q1/dowody/06-fixtures-repro.log`).

## `atlas_keys.json` — web key / scale functions

`gen.sh <scratch dir outside the repo>`: `git archive edb8fb56 gra/src gra/data` into the scratch
dir, npm `three@0.169.0` + `esbuild@0.24.0`, esbuild bundle of `gen.ts`, node run.

Web code linked **unchanged**: `render/cityMapStatChip.ts` (`cityMapBadgeKey` — both overloads,
`formatCityGrowthPercentLabel`, `disposeCityMapBadgeTexturesForOtherLod`), `render/unitOwnerEmblem.ts`
(`ownerEmblemKey`), `render/zoomLod.ts` (`cityBadgeLodLevelForDist`, `cityBadgeLodTextureScale`).

Adaptations (all neutral for the values recorded):

| Item | Adaptation | Why neutral |
|---|---|---|
| module-private helpers `civSigilCacheKey`, `leaderPortraitCacheKey`, `prodIconCacheKey`, `badgePixelRatio`, `badgeCanvasScale`, `cityBadgeLodSegment` (`cityMapStatChip.ts`), `workerSpriteCacheKey` (`workerFieldOverlay.ts`) | `gen.sh` APPENDS one `export { … };` line to the scratch copy of the file | no function body is touched; the exported binding is the original function |
| `window.devicePixelRatio` | `globalThis.window = { devicePixelRatio }` set per case; deleted for the "no window" case | `badgePixelRatio` reads only that property (`cityMapStatChip.ts:150`) |
| T11 key | template `${path}:${level}` copied (`unitUpgradeBadges.ts:312`, not a function) | literal copy |
| canvas size | `Math.round(W * s)`, `Math.round(H * s)` copied (`cityMapStatChip.ts:848-849`) with the REAL `badgeCanvasScale` | literal copy; `W`, `H` are inputs |
| LOD purge | the real `disposeCityMapBadgeTexturesForOtherLod` on a `Map` of objects with a counting `dispose()` | the function only calls `endsWith`, `dispose`, `delete` |

Encoding: every number is the 16-hex-digit binary64 bit pattern (NaN, ±∞, −0 survive JSON);
`undefined` and `null` inputs are JSON `null` (the key functions treat them alike).
Sections: `badgeKeys` 1761 (systematic one-axis sweeps + 1500 random combinations over
JS edge cases: Unicode whitespace incl. U+FEFF/U+0085/U+2028/U+3000, final sigma, `İ`, `Ǆ`, `ẞ`,
`ﬀ`, Kelvin sign, populations 0/−0/NaN/±∞/1e21/2^53+2, growth ties and 1e±21, eras, LOD 1.5/3/NaN),
`legacyKeys` 546, `growthLabels` 4074, `sigilKeys` 18, `portraitKeys` 288, `prodKeys` 24,
`emblemKeys` 1216, `workerKeys` 60, `upgradeKeys` 6, `lodForDist` 317, `lodScale` 11,
`lodSegment` 13, `ratios` 23, `scales` 184, `canvasSizes` 1794, `purge` 300.

## `atlas_gl.json` — WebGL2 `generateMipmap` and the canvas upload

`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node gen_gl.mjs <outdir>` (no repo files read).
Chromium flags `--enable-unsafe-swiftshader --use-angle=swiftshader --ignore-gpu-blocklist`.

- `cases` (56): RGBA8 and SRGB8_ALPHA8 textures of 2×2, 4×4, 8×2, 5×5, 3×1, 7×3, 6×5, 72×126 (T9),
  64×21, 128×128 (T11) with random / opaque-random / hard-edge content; allocated like Three r169
  (`texStorage2D(levels = log2(max) + 1)`), level 0 uploaded, `generateMipmap`, every level read
  back through a framebuffer (`readPixels` gives the stored bytes; base64 RGBA, rows as uploaded).
- `up`: a 256×64 canvas of semi-transparent random colours uploaded with
  `UNPACK_PREMULTIPLY_ALPHA_WEBGL = true` (= the premultiplied canvas bytes) and `= false`
  (Three's default — the straight-alpha texture), plus `getImageData`.

What this does NOT cover: any other GL (the owner's ANGLE → D3D11 on Windows) — `NIE_ZMIERZONO`.
