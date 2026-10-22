# RR-T8d reference data (R-RUSTPORT-P4-31-ATLAS-CACHE-Q1)

Two fixture files, both produced by **running** reference code; nothing is hand-written.

| File | SHA-256 | Produced by | Used by |
|---|---|---|---|
| `atlas_keys.json` (1.6 MB) | `8d64d5c04a782b13e139ae7d2368aa258d7e3ae6dfd2fef405e3f5868a6a905f` | `gen.sh` → `gen.ts` (node v22.22.0, esbuild 0.24.0, three@0.169.0, web pin `edb8fb56`) | `tests/atlas_keys.rs` |
| `atlas_gl.json` (1.6 MB) | `3ebda643bc36dbb4a952bb5ff7652897a558d5f24cfdbadd51381579e2b4351a` | `gen_gl.mjs` (Playwright 1.56.1, headless Chromium 141.0.7390.37, WebGL2 = ANGLE → Vulkan → SwiftShader) | `tests/atlas_mip.rs` |
| `gen.ts` | `d65b51c81f334e498f3410126cdf56362da34b55bbe54e0eb38c49a9d8fd2f31` | — | generator of `atlas_keys.json` |
| `gen.sh` | `592ce20ecfb4263506b83c4df7ccf1d2c7d33aa1a890a3e0755c06a9aea69a46` | — | runner of `gen.ts` |
| `gen_gl.mjs` | `d39710012325ce749dc0ef8dc4ad2cb269016c073fbeb4ab58b70d1d9e4d2556` | — | generator of `atlas_gl.json` |

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
`lodSegment` 13, `ratios` 23, `scales` 184, `canvasSizes` 1794, `purge` 300 (round 2: each key set also
holds `|l1` / `|l2` INSIDE a key — city names `Ateny|l1`, `Sparta|l2|l1`, `Teby|l3` and `X|l2|y|l1|z` —
so a non-suffix match is caught; no `rnd()` call, every other section byte-identical to round 1).

## `atlas_gl.json` — WebGL2 `generateMipmap` and the canvas upload

`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node gen_gl.mjs <outdir>` (no repo files read).
Chromium flags `--enable-unsafe-swiftshader --use-angle=swiftshader --ignore-gpu-blocklist`.

- `cases` (57): 56 × RGBA8 and SRGB8_ALPHA8 textures of 2×2, 4×4, 8×2, 5×5, 3×1, 7×3, 6×5, 72×126 (T9),
  64×21, 128×128 (T11) with random / opaque-random / hard-edge content; allocated like Three r169
  (`texStorage2D(levels = log2(max) + 1)`), level 0 uploaded, `generateMipmap`, every level read
  back through a framebuffer (`readPixels` gives the stored bytes; base64 RGBA, rows as uploaded);
  plus 1 × T7 size (512×168, SRGB8_ALPHA8, random, `kind: "t7"`, 10 levels — round 2), generated
  after `up` so the first 56 cases and `up` are byte-identical to round 1.
- `up`: a 256×64 canvas of semi-transparent random colours uploaded with
  `UNPACK_PREMULTIPLY_ALPHA_WEBGL = true` (= the premultiplied canvas bytes) and `= false`
  (Three's default — the straight-alpha texture), plus `getImageData`.

What this does NOT cover: any other GL (the owner's ANGLE → D3D11 on Windows) — `NIE_ZMIERZONO`.
