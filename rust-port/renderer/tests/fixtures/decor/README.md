# Terrain-decor reference data (MOD-03, R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1)

Reference data for `tests/decor_web_parity.rs`, produced by **web code**:

- `three@0.169.0` and `esbuild@0.24.0` from npm (three pinned by
  `gra/package-lock.json` at `edb8fb56`);
- web modules from `git archive edb8fb56 gra/src gra/data`, **imported
  unchanged**: `render/lasy-modele.ts`, `render/djungla-modele.ts`,
  `render/teren-gory-wzgorza.ts`, `render/dekor-laki-rowniny.ts`,
  `render/oaza-pustynia.ts`, `render/tarasy-model.ts`,
  `render/mapRenderStyle.ts` (with its imports `types/hex.ts`,
  `map/gen-helpers.ts`, `render/hexutil.ts`) and `render/riverLod.ts`
  (with `three/examples/jsm/utils/BufferGeometryUtils.js`).

No web code is copied or adapted: `gen.ts` only calls the web API without a
renderer (no WebGL) and dumps geometries, object graphs and return values.

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
ln -s $S/ref/node_modules $S/node_modules        # 'three' resolvable from websrc/ too
git archive --format=tar -o $S/websrc.tar edb8fb56 gra/src gra/data && tar -xf $S/websrc.tar -C $S/websrc
cp rust-port/renderer/tests/fixtures/decor/gen.ts $S/refscript/decor_gen.ts
cd $S/refscript
../ref/node_modules/.bin/esbuild decor_gen.ts --bundle --platform=node --format=esm --outfile=decor_gen.mjs --log-level=warning
node decor_gen.mjs ../out/decor
# node v22.22.0; prints: decor geometries=34 builders=939 reliefBuilders=500 coast=301 relief=112 samplersSeeds=500 hashfns=15 rlcases=60
```

Numbers are written with a serializer that keeps `-0`; non-finite numbers
(empty `Box3`) are the strings `"Infinity"` / `"-Infinity"`; every other
number is the shortest round-trip decimal (`str::parse::<f64>` restores the
bits). `Float32` attributes are stored as their `u32` bit patterns.

## Files

| File | Content |
|---|---|
| `geometries.json` | The 34 shared geometries (`las0-4`, `djungla0-4`, `wzgorze0-4`, `gora0-4`, `laka0-3`, `rownina0-3`, `pustynia0-3`, `tarasy0`, `tarasy3`): `position` / `normal` / `color` bit patterns, vertex count, FNV-1a hash; variant wrap `((w\|0)%n+n)%n` for `w ∈ [-11, 12]` (shared-instance identity); `trojkaty*` counts; the 6 vertex-colour materials; exported constants. |
| `hashes.json` | 15 per-hex functions (variant / rotation / presence / tree counts of all decor files, incl. `wariantDlaHeksa` with salt 77) on 54 seeds (0..49, −1, 2³¹−1, −2³¹, 123456789) × 121 hexes (`q, r ∈ [-5, 5]`) = 6 534 samples each; results as an index into a table of distinct values. `isWarmJungleForestHex` on 7 map heights. |
| `builders.json` | 939 object graphs: `buildLas/Wzgorze/Gora/DekorLaka/DekorRownina/DekorPustynia(w)` for `w ∈ [-2, 6]`, `buildTarasy(0\|3)`, `buildOaza()`, `buildStyleForestCluster` (60 hexes × lite + 150 tropical hexes), `buildStyleMountainPeak`, `buildStyleHillBump` (60 hexes), `buildStyleDune` (460 hexes), `buildStyleTarasyTerrace` (lite × R), `buildGalleryBuildingPad` (8 terrains × wide), `buildGalleryFortMount`, `buildStyleBeachRing`, `buildStyleCoastSandTopCap`, `buildStyleOasis` (palmCount 0–4, recorded `rnd()` values). Per node (traverse order): type, parent, name, renderOrder, position/rotation/scale, cast/receive shadow, `matrixWorld` after `updateMatrixWorld(true)`, material (hex, linear rgb, flat, vertexColors), geometry summary (counts, attributes, groups, FNV-1a hash); `Box3.setFromObject(root, true)`. Plus a 127-hex coast map with 4 river paths, its `computeRiverMouthEdgeKeys` / `computeRiverDeltaHexKeys` and 301 coast builds (`buildStyleCoastWaterCap`, `buildStyleCoastSandEdges`, `buildStyleLandCoastSandCap`, lite × full, forced `isDelta`). |
| `relief.json` | `powierzchniaReliefuY` for 2 types × 7 variants (incl. −1, 7) × 8 rotations on a 9×9 grid + 150 recorded pseudo-random points each (computed first, before anything else touches the shared geometries); `reliefSurfaceSampler` on 24 hexes (4 terrains, R ∈ {1, 1.5}); `samplersSeeds` (round 2): 500 more samplers, hills + mountains, exactly 50 DISTINCT seeds per (type, `wariantDlaHeksa` variant) — the web `wariantDlaHeksa` only selects which enumerated candidates are kept. |
| `relief_builders.json` | round 2: `buildStyleMountainPeak` / `buildStyleHillBump` (roblox, lite = false), 250 each, exactly 50 DISTINCT seeds per silhouette variant (same selection rule); separate file so `builders.json` stays below 4 MB. |
| `riverlod.json` | `flushRiverBucket` on 6 bucket scenarios (empty, single, 3 merged, 2 merged, attribute mismatch → `null`), `mergeRiverBuckets`, `riversVisibleAtLod` grid, 60 fog cases (`computeRiverFogSig`, ribbon full / fog index, `needsRiverRibbonIndexUpdate`, merged full / fog index / sig, `mergedRiverVisibleInFog` with `null` / empty / non-empty reveal, `applyRiverVisibility`, `applyRiverLodVisibility`). |
| `gen.ts` | the generator above |

SHA-256 at creation: see `dyspozycje/rust-port/p4/P4-17-MOD03-TERRAIN-DECOR.md` §6.
