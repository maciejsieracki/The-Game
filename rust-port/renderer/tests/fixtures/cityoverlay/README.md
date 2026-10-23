# MOD-10 city overlays — reference data (R-RUSTPORT-P4-33-MOD10-CITY-CHIP-Q1)

Reference data for `tests/cityoverlay_web_parity.rs`. Everything was produced
by **running the web code** of pin `edb8fb56` — nothing is transcribed:

- `gra/src/**` from `git archive edb8fb56 gra/src gra/data`; the three modules
  `render/cityMapStatChip.ts`, `render/cityOkolicaOverlay.ts`,
  `render/workerFieldOverlay.ts` are imported **unchanged** by `gen.ts` and
  called through their real exported entry points
  (`setCityMapBadgeCivSigil` / `setCityMapBadgeLeaderPortrait` /
  `setCityMapBadgeProdIcon`, `makeCityMapBadgeSprite` (both overloads),
  `drawCityMapBadgeCanvas(Legacy)`, `cityMapBadgeKey`,
  `disposeCityMapBadgeTexturesForOtherLod`, `wallKindFromBuilt`,
  `defenseTierFromWallKind`, `defenseTierFromCity`, `civInitialForIconId`,
  `buildCityOkolicaOverlayGroup`, `syncWorkerFieldOverlay`,
  `syncWorkerFieldOverlayFog`, `workerOwnerColor(Rgba)`, the exported styles
  and palette). The game rule `hexHasCoveringTerrainImprovement`
  (`game/terrain-improvements.ts`) is run for every hex of the test map and
  stored as an input (Rust takes it as data);
- bundled with `esbuild@0.24.0` + `three@0.169.0` (scratch `npm install`);
- canvases: headless **Chromium 141.0.7390.37** (playwright 1.56.1,
  `--disable-gpu --force-color-profile=srgb --font-render-hinting=none`) on
  three pages with `devicePixelRatio` **1** (`main`), **2** (`dpr2`) and
  **1.5** (`dpr15`); real Canvas 2D, the bundled fonts of
  `rust-port/renderer/assets/` loaded as `FontFace` and the web font stacks
  mapped onto them by the canvas `font` setter (`mapFont`, same mapping as
  `tests/fixtures/overlay/gen.mjs` = `raster::image::emoji::source_chain`);
  `window.Image` is wrapped only to wait for every `onload` / `onerror`;
- **draw traces (round 2):** the `fillStyle` / `shadowColor` / `shadowBlur` /
  `shadowOffsetY` setters and `clearRect` / `fillText` / `save` / `restore` of
  `CanvasRenderingContext2D.prototype` are wrapped to record, per canvas and
  since its last `clearRect` (= start of a paint), every such call in order:
  the text event carries the text, the RAW font string the web set (before
  `mapFont`), `textAlign`, `textBaseline` and the f64 bits of `x`, `y`. The
  wrappers only record and then call the native member, so the pixels are
  unchanged (every `ref/*.rgba` hash equals round 1). `city.json` →
  `traces[<ref id>]` = the trace of the paint behind that snapshot; the
  generator fails if two paints with identical pixels have different traces;
- numbers of the okolica / worker trees: the same bundle in **node v22.22.0**
  (V8 12.4, like every other MOD fixture) with a stub canvas. Chromium's newer
  V8 differs in the last bit of `Math.pow` (colour `SRGBToLinear`) and of the
  hex-corner `Math.cos` / `Math.sin`; `city.json` → `chromiumDiffs` lists every
  difference and the Rust test accepts only 1-ulp colour channels and f32
  vertices off by ≤ 1e-6 (measured: 13 + 5).

Badge image sources (`gen.ts`): `civIconSvg(civ, 40)` for grecy / zulusi /
egipt / unknown (→ `civ-default`), `''` for the civ id `brak`;
`buildingIconSvg(undefined, 'spichlerz')` and the unit icon `unit-spear` @24
for the production front; the three portraits
`gra/src/assets/portrety/portrait-{grecy-braz,zulusi-zelazo,egipt-kamien}.jpg`
keyed `"<trimmed lower civ>|<max(1, round(era) || 1)>"` (a test source: the
real `leaderPortraitUrl` needs `import.meta.glob`). `normalizeSvg` of
`ui/icons/brandAssets.ts:50-61` is taken verbatim from the pin. Before every
badge the setters are called again, which clears the image caches
(`clearImages`), so every badge goes the cold path: `initial` = the
synchronous paint without images, `final` = after every image loaded.

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/refscript
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
mkdir -p $S/websrc && git archive edb8fb56 gra/src gra/data | tar -x -C $S/websrc
cp rust-port/renderer/tests/fixtures/cityoverlay/{gen.ts,gen.mjs} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
cd $S/refscript
NODE_PATH=$S/ref/node_modules:/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
  node gen.mjs <out-dir> <repo>/rust-port/renderer/assets
# chromium-vs-node differences: 18
# chips=34 okolica=7 worker=3 workerTex=9 refs=78 chromium=141.0.7390.37
```

`gen.mjs` replaces only the generated files (`input/`, `ref/`, `city.json`,
`versions.txt`, `MANIFEST.sha256`, copies of `gen.*`); `README.md` and the
Rust `golden.tsv` stay. Deterministic: two runs give the identical
`MANIFEST.sha256` (round 2, with the traces: sha256
`868b068e83b21d2ca0c002f526f157e235edbdb0717173de250eeb87a90a084b`; round 1
without them: `de47236aa421894e9f99e3ff87ecd35314afc37dafe66f677753d3fcc0543832`,
the same `ref/` and `input/`).
After a regeneration re-bless the Rust hashes only after review:
`CITYOVERLAY_BLESS=1 cargo test --test cityoverlay_web_parity textures_match_golden_hashes`.

## Content

| file | content |
|---|---|
| `city.json` | `inputs` (badge inputs — f64 as 16 hex digits of the bits —, test map: hex, terrain, covering improvement; yields; okolica and worker cases), `helpers` (walls, tiers, initials, badge keys, owner colours), `consts` (styles, palette), `chips` (34 badges: page, `devicePixelRatio`, key, cache hit, ref ids of the first and final state, Three texture metadata incl. `version`, sprite record), `purge` (LOD purge on the cache keys), `drawCanvas*`, `okolica` (7 overlay trees: range / centre / worked groups with full f32 geometry and instance matrices, yield-label sprites with their texture ref and metadata), `worker` (3 cases: sprites, fog pass, fog off), `workerTex` (9 icon textures), `chromiumDiffs`, `traces` (draw trace per ref id, round 2) |
| `ref/<page>-r<n>.rgba` | `getImageData` (straight RGBA8) of a canvas, deduplicated by content per page. The ×2 / ×1.5 / LOD badges keep only their final state (size; their first state differs from the ×1 one only by the scale) |
| `input/*` | the asset inputs (see above; byte-identical to the RR-T8c inputs where shared — test `inputs_equal_the_rr_t8c_pin_inputs`) |
| `golden.tsv` | FNV-1a 64 of the Rust textures (initial, final) — determinism |
| `gen.ts`, `gen.mjs`, `versions.txt`, `MANIFEST.sha256` | generator, tool versions, sha256 of every file (+ the fonts) |
