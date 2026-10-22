# MOD-08 unit overlays — reference data (R-RUSTPORT-P4-32-MOD08-UNIT-OVERLAY-Q1)

Reference data for `tests/overlay_web_parity.rs`. Everything was produced by
**running the web code** of pin `edb8fb56` — nothing is transcribed:

- `gra/src/**` from `git archive edb8fb56 gra/src gra/data`; the four modules
  `render/unitOwnerEmblem.ts`, `render/unitStatPlate.ts`,
  `render/unitUpgradeBadges.ts`, `render/unitVeteranBadges.ts` are imported
  **unchanged** by `gen.ts` and called through their real exported entry
  points (`setUnitOwnerEmblemAssets`, `setUnitUpgradeBadgeAssets`,
  `ownerEmblemKey`, `ownerEmblemTexture`, `applyUnitStatPlate`,
  `applyUnitUpgradeBadgeRow`, `applyUnitVeteranBadgeStarCount`,
  `applyUnitVeteranBadgeLevel`, `applyUnitOwnerEmblem`, `pathBadgeLabel`);
- bundled with `esbuild@0.24.0` + `three@0.169.0` (scratch `npm install`);
- canvases: headless **Chromium 141.0.7390.37** (playwright 1.56.1,
  `--disable-gpu --force-color-profile=srgb --font-render-hinting=none`), real
  Canvas 2D, the bundled fonts of `rust-port/renderer/assets/` loaded as
  `FontFace` and the web font stacks mapped onto them by the canvas `font`
  setter (`mapFont`, same mapping as `tests/fixtures/image/gen.mjs` =
  `raster::image::emoji::source_chain`); `window.Image` is wrapped only to
  wait for every `onload` / `onerror` of `loadImageInto`;
- numbers (trees, keys, constants): the same bundle in **node v22.22.0**
  (V8 12.4, like every other MOD fixture) with a stub canvas. Chromium's newer
  V8 differs in the last bit of `Math.pow` / `Math.cos` / `Math.sin` for some
  inputs; the generator lists every Chromium-vs-node tree difference in
  `overlay.json` → `chromiumTreeDiffs` and aborts unless each one is a colour
  channel off by 1 ulp or a star outline point of the informational geometry
  `params` (measured: 8 + 2).

Asset strings are what `main.ts:8526-8541` injects:
`brandIconSvg('chip-death'|'bld-koszary'|'bld-kuznia', 40)`,
`civIconSvg('grecy'|'zulusi'|'nieznana', 40)` (`normalizeSvg` of
`ui/icons/brandAssets.ts:50-61` taken verbatim from the pin) and the portraits
`gra/src/assets/portrety/portrait-{grecy-braz,zulusi-zelazo,egipt-kamien}.jpg`
(byte copies, `input/`). A civ id `brak` stands for an asset source that
returns an empty sigil (`UnitOwnerEmblemAssets.civSigilSvg`: "może być ''").

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive edb8fb56 gra/src gra/data | tar -x -C $S/websrc
cp rust-port/renderer/tests/fixtures/overlay/{gen.ts,gen.mjs} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
cd $S/refscript
NODE_PATH=$S/ref/node_modules:/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
  node gen.mjs <out-dir> <repo>/rust-port/renderer/assets
# chromium-vs-node tree differences: 10 (colour channels 1 ulp: 8, star shape params: 2)
# textures=36 trees=111 keys=416 geos=3 images=… chromium=141.0.7390.37
```

`gen.mjs` replaces only the generated files (`input/`, `ref/`, `overlay.json`,
`versions.txt`, `MANIFEST.sha256`, copies of `gen.*`); `README.md` and the
Rust `golden.tsv` stay. Deterministic: two runs give the identical
`MANIFEST.sha256` (sha256 `7d70d6e17065d13b3f9eac6498e34b2e4ff9f69653229f22145a491a2e7f16a8`).
After a regeneration re-bless the Rust hashes only after review:
`OVERLAY_BLESS=1 cargo test --test overlay_web_parity textures_match_golden_hashes`.

## Content

| file | content |
|---|---|
| `overlay.json` | `inputs` (owner contexts, vitals — f64 as 16 hex digits of the bits), `keys` (416 × `ownerEmblemKey`), `consts` (exported constants, bits), `labels`, `trees` (111 token trees: per node type, name, parent, position / rotation / scale bits, `renderOrder`, `visible`, `userData`; meshes: geometry id + material: type, linear `color` / `emissive` bits, `map` / `emissiveMap` texture id, flags, `side`, `opacity`, `roughness`, `metalness`), `geos` (3 geometries, f32 arrays as hex bits), `textures` (emblem texture per context and phase), `textureList` (36 canvas textures: size, `minFilter`, `magFilter`, `generateMipmaps`, `colorSpace`, `flipY`, `version`, whether the first synchronous state equals the final one), `chromiumTreeDiffs` |
| `ref/<id>.rgba` | `getImageData` (straight RGBA8) of every texture canvas after all images loaded; `ref/<id>.initial.rgba` = the synchronous first state when it differs |
| `input/*` | the asset inputs (see above) |
| `golden.tsv` | FNV-1a 64 of the Rust textures (initial, final) — determinism |
| `gen.ts`, `gen.mjs`, `versions.txt`, `MANIFEST.sha256` | generator, tool versions, sha256 of every file (+ the fonts) |
