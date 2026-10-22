# MOD-01 `core` reference data (R-RUSTPORT-P4-12-MOD01-CORE-Q1)

Reference vectors for `tests/core_web_parity.rs`, produced by **running web code**:

- `three@0.169.0` from npm (integrity `sha512-Ed906MA3…qUv0w==`, identical to the pin
  in `gra/package-lock.json` at `edb8fb56`), `esbuild@0.24.0`, node v22.22.0;
- web modules from `git archive edb8fb56 gra/src gra/data`, **imported unchanged**:
  `render/hexutil.ts`, `render/hexShape.ts`, `render/fogDim.ts`, `render/zoomLod.ts`,
  `render/mergeDecor.ts`, `render/unitVitalsPalette.ts`, `render/mapRenderStyle.ts`,
  `render/bronzeCity.ts`, `render/teren-gory-wzgorza.ts` (`GORA_APEX_Y`,
  `WZGORZE_SZCZYT_Y`), `game/visibility.ts` (`FOG_EXPLORED_BRIGHTNESS`), `types/hex.ts`;
- `LITERAL` copies (same logic and arithmetic in the same order; TS types removed) of
  the private, non-importable `rnd` (`bronzeCity.ts:42-46`), `hash2D`
  (`mapRenderStyle.ts:345-351`), `decorVariant5` (`mapRenderStyle.ts:358-360`) and the
  `CIV_TERRAIN_VIS` table (`mapRenderStyle.ts:324-333`, used only as the `civ` argument
  of `terrainVisualForStyle`; the exported `terrainSurfaceTopY` uses the web's own copy,
  so the Rust copy of the table is also checked against the web indirectly).

Test inputs (coordinates, distances, seeds, ...) come from a fixed xorshift and from
hand-picked edge values (ties, thresholds ±1, `NaN`, `±Infinity`, `-0`). They are inputs
only; no compared value is computed outside the web modules except the 3 `LITERAL`
functions above.

`fogDim` / `mergeDecor` run on real three object graphs built **without a renderer**
(`Group`, `Object3D`, `Mesh`, `Sprite`, `BoxGeometry`, `ConeGeometry`, ...; no WebGL). The
same scene specs are stored in `mergedecor.json` (`cases[].spec`) and the Rust test
builds the identical tree from them with `crate::geom` builders (bit-compatible with
three r169, P4.8). `disposeMergedDecor` is observed by counting calls to
`BufferGeometry.prototype.dispose` / `Material.prototype.dispose`.

## Number encoding

`JSON.stringify` writes the shortest round-trip form of every finite double, which Rust
`str::parse::<f64>` reads back exactly. `-0`, `NaN`, `Infinity`, `-Infinity` are written
as the strings `"-0"`, `"NaN"`, `"Infinity"`, `"-Infinity"`. Float32 buffers are written
as the doubles of their f32 values (exact).

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && printf '{"name":"ref","private":true}\n' > package.json \
  && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive --format=tar -o $S/websrc.tar edb8fb56 gra/src gra/data && tar -xf $S/websrc.tar -C $S/websrc
cp rust-port/renderer/tests/fixtures/core/gen.ts $S/refscript/core_gen.ts
cd $S/refscript
NODE_PATH=$S/ref/node_modules $S/ref/node_modules/.bin/esbuild core_gen.ts --bundle \
  --platform=node --format=esm --outfile=core_gen.mjs --log-level=warning
node core_gen.mjs $S/out/core
# prints the 8 file sizes below and "core vectors done"; the files are byte-identical
# to the committed ones (sha256 below).
```

## Files

| File | Content |
|---|---|
| `hexutil.json` | `HEX_R`, `SQRT3`; 2 668 `axialToWorld` (4 radii, integer + random fractional), 14 `mapCenter`, 3 294 `worldToAxial` (random + exact edge midpoints / corners = tie rule) |
| `hexshape.json` | 25 `hexRingPointsXZ` (6 radii × 4 `y` + default `y`), 16 `appendPointyTopHex` (4 radii × reverse × `Shape`/`Path`, `getPoints()`), 1 shape with a reversed hole (`extractPoints`) |
| `fogdim.json` | 14 `fogBrightnessForHex`; 5 scenes × 11 `applyFogDimToObject3D` calls (1, 0.175, 0, 0.5, −1, 1, 0.175, 2, 0.333, NaN, 1): colours of every material after every call (Lambert/Standard/Basic/Phong dimmed; Physical/Toon/Normal/Sprite not) |
| `zoomlod.json` | 96 `normalizedZoomT`, 17 `resolveZoomLodLevel`, 10 `zoomLodFlags`, 60 `effectivePixelRatio` (no `window` + 5 `devicePixelRatio`), 14 `cityBadgeLodLevelForDist`, 8 `cityBadgeLodTextureScale`, 192 `zoomLodForCamera` |
| `mergedecor.json` | 10 scenes (nested groups, 4 Euler orders, non-uniform scale, vertex-colour geometry, material arrays, empty material array, `MeshNormalMaterial`, non-indexed geometry, sprite, mesh as root, empty / flagged / single vertex-colour / groups-only / empty-geometry groups): `isAlreadyMergedDecor`, `countMeshesInGroup`, `collapseToMergedMesh` (full Float32 `position` and `color` buffers, material, flags), second collapse, fog on the result, `disposeMergedDecor` counts |
| `vitals.json` | all 11 exports of `unitVitalsPalette.ts` |
| `mapstyle.json` | constants, `DEFAULT_MAP_RENDER_OPTIONS`, `TERRAIN_SURFACE_Y`, `ROBLOX_TERRAIN_VIS`, 72 `terrainVisualForStyle`, 104 `terrainSurfaceTopY`, 4 `coastWaterCapTopY`, 3 `terrainHeightAudit` (with the Polish messages), 24 `styleTerrainColor`, 3 `styleScenePalette`, 6 `riverSurfaceLiftY`, 10 `normalizeMapRenderOptions`, 243 `resolveRenderPreset`, 5 `isSceneBuildFastPath`, 22 `isDenseLandmassMap`/`isRiverRenderFast`/`isSceneBuildAggressive`, 600 `hash2D`/`decorVariant5`/`forestTreeCountForHex`/`jungleForestTreeCountForHex`, 11 `styleHillBumpSurfaceY`, 200 `styleMountainPeakSurfaceY`, 128 `galleryDecorSurfaceY`, 8 `elevatedTerrainEdgeSurfaceY`, `GORA_APEX_Y`, `WZGORZE_SZCZYT_Y` |
| `bronze.json` | `BRONZE_CIVS`; 35 `ikonaIdToBronzeCiv` (all 23 table keys incl. aliases, unknown ids, case, whitespace, and 5 `Object.prototype` names = documented JS quirk); 4 152 `rnd` (integers −5..300 × 7 salts, random integers / fractions, 2³¹, 2³², 2⁵³, −2⁴⁰, 10²⁰, NaN, ∞) |
| `gen.ts` | the generator |

SHA-256 at creation (also in `dyspozycje/rust-port/p4/P4-12-MOD01-CORE.md`):

```text
0bead79eb2001c0fd80ec9e00d3e232d14855ef9afa5a9cfc2f24aeca54344fd  bronze.json
74a776f1fc55dbf1b3f078faeb7deb3b395b14b8a903fd4ea6393a657c4dff49  fogdim.json
351260b758ad77e42f120acfe10f085d752dd716efb23c248905357e0766073c  hexshape.json
d9122c64710c6589bf0ddd2083f41a2d714a37c2e4666b50f5cc921cd2445af1  hexutil.json
1f868e57bed175d6593b44234bc05e10f66c37a3970076b5bf0d96e26e3a8586  mapstyle.json
f6507270e71833e21b9a36a6f41993dc3a70dd3847177c48b3579f3dc7bb932e  mergedecor.json
195228d261cedb143196fd06b69ada34ff749170e18d8d42ee27d18d9f8dbc52  vitals.json
ad97dca6cb723d6b8026d17de2b271ef3389c08de204b840f485c0f468ce97ca  zoomlod.json
b88b82a64ed62ab89c60a8efe090d19629137d35ea9b62a287475b0e977cffd4  gen.ts
```
