# MOD-13 "misc" reference data (R-RUSTPORT-P4-22-MOD13-MISC-Q1)

Reference vectors for `tests/misc_web_parity.rs`, produced by **running the
web code** of `edb8fb56`:

- `three@0.169.0` from npm (integrity `sha512-Ed906MA3…qUv0w==`, the version
  pinned by `gra/package-lock.json` at `edb8fb56`), `esbuild@0.24.0`,
  node v22.22.0 (V8 `12.4.254.21-node.33`);
- `gra/src/**` from `git archive edb8fb56 gra/src gra/data`, **imported
  unchanged**: `render/wioska-oboz.ts`, `render/siegeCampModels.ts`,
  `render/siegeMarker.ts`, `render/siegeCampSync.ts`, `render/robloxCity.ts`
  (`addRobloxSkyDecor`), `render/rangeOverlay.ts`, `map/territory-border.ts`,
  `render/tradeRoutesOverlay.ts` and what they import (`hexutil`,
  `mapRenderStyle`, `types/hex`).

No WebGL renderer: the builders return `THREE` object graphs; `gen.ts` calls
`updateMatrixWorld(true)` and dumps them.

## Test-harness adaptations (no web line is modified)

| What | Why | Effect |
|---|---|---|
| `relief_shim.ts`, wired by `build.mjs` only for the `./mapRenderStyle` import of `render/rangeOverlay.ts` | the relief drape samples `reliefSurfaceSampler` → `powierzchniaReliefuY` (raycast into the hill/mountain variant of `teren-gory-wzgorza.ts`), which is not part of MOD-13 | `export *` of the REAL module; only `reliefSurfaceSampler` is wrapped. Mode `real` (default) = the real function; mode `analytic` = a closed-form height field for `Gory`/`Wzgorza` (`null` for other terrains, like the real one) re-implemented in the Rust test (`AnalyticRelief`). Cases on the `flat` map (no `Gory`/`Wzgorza`) use mode `real`. |
| `globalThis.document` stub in `gen.ts` | `siegeMarker.ts` draws the ⚔ sprite on a `<canvas>`; node has no DOM | the stub canvas records the draw calls (`canvasLog` in `siege.json`); no pixels are produced (rasterisation = D-MOD-6) |

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive edb8fb56 gra/src gra/data | tar -x -C $S/websrc
cp rust-port/renderer/tests/fixtures/misc/{gen.ts,build.mjs,relief_shim.ts} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
cd $S/refscript
node build.mjs          # -> gen.mjs
node gen.mjs ../out     # prints: misc models=34 sync=8 markerSteps=4 range=252 loops=18 territory=7 trade=3
```

Two runs give identical files (SHA-256 below).

## Files

| File | SHA-256 | Content |
|---|---|---|
| `models.json` | `cf17ac9d66604ffd62c21835f990db9b1432315e1ea94947b66372e3c24de8e0` | 34 model cases: `wioska`; `oboz` (default + 4 colours); `soldiers` (0/1/4/5); `ram`; `tower`; `camp` (18: 9 face directions, 5 machine lists, 4 colours); `sky` (4: span/lite/centre). Per node: kind, name, parent, `p`/`q`/`s`, `w` (matrixWorld), castShadow, receiveShadow, renderOrder, geometry (type, vtx, tri, FNV hash) and material (type, colour, linear colour, flatShading, transparent, opacity, depthWrite, depthTest, side, polygonOffset, map). Per model: meshes, tris, signature, bbox. |
| `siege.json` | `06383e4d19e6abeb34b70be136e63b6260f8009796a35ad7c29c7f9de7e6be81` | `sync`: 8 `siegeCampSync` cases (incl. malformed keys for `parseInt`); `markerSteps`: 4 `SiegeMarkerRenderer.sync` (+`pulse`) steps, whole scene graph after each; `canvasLog`: the sprite canvas draw calls. |
| `overlays.json` | `d590e026deac901f3a1f9ffc8ffbca5fa0f8075b1624e499a7520b7fb0d075a9` | `maps` (3: `mixed` seed 12345, `flat` seed 777, `noseed`), `hexSets` (18: disks of radius 0..4 and 1..3, rings, islands, L, corner, missing hexes, grown clusters 25/40, empty), `styles`; `range` (252 `buildRangeOverlayGroup` cases), `loops` (18 `computeTerritoryBorderLoops`), `territory` (7 `buildTerritoryBorderGroup`), `trade` (3 `buildTradeRoutesOverlayGroup`), `bezier` (24 `QuadraticBezierCurve3.getPoints(28)` probes). Per overlay object: kind, name, renderOrder, frustumCulled, material, geometry (vtx, tri, index count, normals present, FNV hash, bbox, positions when ≤ 900 floats), `instanceMatrix` and `count` for `InstancedMesh`, `userData` of the relief drape. |
| `gen.ts`, `build.mjs`, `relief_shim.ts` | `a58562c0…`, `42d3c58c…`, `dca1001f…` | the generator, its bundler and the relief shim |

Floats are stored as IEEE-754 binary64 bits (`hx()`: 16 hex digits per
number), so the Rust side compares `to_bits()`; `-0` and NaN survive.
Hashes are FNV-1a 32-bit over little-endian bytes, the same routine as
`models::unit_core::model::{Fnv, geo_hash}`.
