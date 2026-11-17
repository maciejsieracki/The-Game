# River-ribbon reference data (R3, R-RUSTPORT-P4-1-R3-RIVER-RIBBONS)

Reference data for `tests/rivers_web_parity.rs`, produced by **web code** at
the pin `07d2fbd72`:

- `three@0.169.0` and `esbuild@0.24.0` from npm (three version of
  `gra/package.json` at the pin);
- web modules from `git archive 07d2fbd72 gra/src gra/data`, imported
  unchanged: `render/scene.ts` (`renderLandRiversFromPaths`, exported by the
  pin itself for `tools/river-fog-visibility-test.cjs`), `render/mapRenderStyle.ts`,
  `map/gen-helpers.ts` (`landRiverRenderPath`, `mediumRiverRenderPath`,
  `trimMediumRenderPathAtMain`), `map/generator.ts` (`generateMap`).
- `build.mjs` appends ONE line to `scene.ts` at bundle time:
  `export { renderCoastalRiverExtension as __renderCoastalRiverExtension, … }`
  (7 private functions, listed in `build.mjs`). No function body is touched.

What `gen.ts` re-states (harness, not web code, cited in the file): the
`riverMouthY` formula (`scene.ts:2886-2888`), the stage selection
(`:2875-2877`), the land options (`:2905-2912`) and the bucket orchestration
of the mouths (`:2918-2992`), because `buildScene` is not callable without
WebGL. Every point, vertex, index and fog key comes from the pin functions.

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
ln -s $S/ref/node_modules $S/node_modules
git archive --format=tar -o $S/websrc.tar 07d2fbd72 gra/src gra/data && tar -xf $S/websrc.tar -C $S/websrc
cp rust-port/renderer/tests/fixtures/rivers/gen.ts $S/refscript/rivers_gen.ts
cp rust-port/renderer/tests/fixtures/rivers/build.mjs $S/refscript/build.mjs
cd $S/refscript
node build.mjs $S/ref/node_modules/esbuild
node rivers_gen.mjs ../out
# node v22.23.4; prints: rivers scenarios=14 entries=274 paths=238 points=20 ribbons=8
```

Numbers keep the sign of `-0`; `Float32` attributes are stored as their
`u32` bit patterns; ribbon points of `points[]` are f64 (shortest round-trip
decimal).

## Content of `rivers.json`

| Key | Content |
|---|---|
| `constants` | `styleScenePalette('roblox').river` / `.riverBank`, `styleTerrainColor(PlytkieMorze, 'roblox')`, `riverSurfaceLiftY(1)`, `FLAT_LAND_SURFACE_Y`. |
| `points` | 20 cases of `buildRiverPointsFromHexPath` on raw paths of map A (straight, 180° turn, ≥120° bend, 60° zigzag, non-adjacent step, into the sea, off the map, single hex) × `extendToCenter`: points, `pointHex`, `hexKeys`, `simplifyRiverRenderPath`, `pathReachesOpenSeaRender`. |
| `ribbons` | 8 cases of `buildRibbonGeometry(…, true)`: 4 point lists (incl. a duplicate point and a vertical step) × scalar / per-point half width. |
| `scenarios` | 14 scenarios: hand-made map A (12×8, 8 rivers of every kind incl. a missing kind, deltas) at stages 0/1/2/3/5, fast / scene-fast, R = 1.5, `batchSize: 2`; generated maps G1 (40×30, seed 3, rivers high) and G2 (48×36, seed 11, rivers medium) at stages 2/5, normal / fast, `batchSize: 3` + decimation. Each holds the `MapViewDto` (`hexes`, `rivers`, `riverRenderPaths`), the delta hexes, the land hex keys and every `RiverEntry` in creation order: material class, `renderOrder`, `merged`, `hexKeys`, `pointHex`, `segPointHex`, geometry (position / normal / uv bits, index). |

`rzekaKrawedzie` of the DTO hexes is filled (map A: fixed test sets; G1/G2:
generator values) but the web render never reads it (`scene.ts:1263-1264`).

## Integrity

`sha256sum rivers.json` =
`52207fe1f4f7add5045dff2163dfc6387c49c574375b30d696e8b1fb28239469`
(a second regeneration from the steps above reproduced it byte for byte).
The record counts are asserted in `fixture_record_counts`.
