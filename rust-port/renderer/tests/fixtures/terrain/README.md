# Terrain-mesh reference data (RR-T2a, R-RUSTPORT-P4-11-CAMERA-TERRAIN-CPU-Q1)

Reference buffers for `tests/terrain_web_parity.rs`, produced by **web code**:

- `three@0.169.0` from npm (integrity `sha512-Ed906MA3…qUv0w==`, as pinned by
  `gra/package-lock.json` at `edb8fb56`);
- web modules from `git archive edb8fb56 gra/src gra/data`, **imported
  unchanged**: `render/mapRenderStyle.ts` (`styleTerrainColor`,
  `terrainVisualForStyle`, `landCoastSandNeeded`, `findLandCoastSandCandidates`,
  `createCoastInstBuffers`, `getCoastSharedGeometries`,
  `collectRobloxCoastWaterInst`, `collectRobloxLandCoastSandInst`,
  `computeRiverDeltaHexKeys`, `computeRiverMouthEdgeKeys`,
  `coastWaterMaterial`, `coastSandMaterial`, `resolveRenderPreset`,
  `normalizeMapRenderOptions`, `styleScenePalette`),
  `render/teren-gory-wzgorza.ts` (`wariantDlaHeksa`, `rotacjaDlaHeksa`,
  `LICZBA_WARIANTOW_TERENU`), `render/hexutil.ts`,
  `game/terrain-improvements.ts` (`improvementKeysForHex`),
  `game/visibility.ts` (`FOG_EXPLORED_BRIGHTNESS`), `types/hex.ts`;
- copies of the `buildScene` / `setFog` fragments of `render/scene.ts`, each
  marked `// LITERAL scene.ts:<lines>` in `gen.ts`. `LITERAL` = the same
  logic and arithmetic in the same order, **not** a character copy.

## Adaptations (what differs from the web source text)

| Fragment | Adaptation | Why it is neutral for the exported buffers |
|---|---|---|
| all `LITERAL` fragments | TS types → `any`/removed, comments removed | type erasure only |
| `buildScene` (`scene.ts:1590-1611`) | options reduced to `{ style: 'roblox', mapDetailQuality }`; renderer, lights, scene fog, shadows, `performance`, progress, C3 chunk yields removed | none of them writes a terrain buffer |
| hex loop (`scene.ts:2246-2534`) | only the prism, mountain, hill and coast branches; forests, decor (`DEKOR_ENABLED = false` in the web), oases, dunes, rivers dropped; every `renderStyle`/`useStyledDecor`/`styledTerrain` test kept as written with `renderStyle = 'roblox'` | the dropped branches write only their own meshes |
| solids (`scene.ts:1852-1871`) | `goraGeometria(v)`/`wzgorzeGeometria(v)` replaced by an empty `BufferGeometry`, material default | only the instance matrices and keys are exported; solid geometries belong to the model topics |
| coast flush (`scene.ts:2749-2786`) | `castShadow`/`receiveShadow`/`scene.add` removed; dump added | flags only |
| backdrop (`scene.ts:2997-3062`) | `sceneTeardown`, `castShadow`, `scene.add` removed; `updateMatrixWorld(true)` called explicitly to read `matrixWorld` | the renderer calls it before drawing |
| `setFog` (`scene.ts:3522-3637`) | prism part only: decor diff (`dekorRefByHex` is empty), ocean/frame visibility (exported as `show`), `scene.background`/`scene.fog`, `applyZoomLodDecor` (solids/coast fog), shadow flag, timing removed; `riverRevealKeys` not passed | none of them writes a prism colour or matrix |

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive --format=tar -o $S/websrc.tar edb8fb56 gra/src gra/data && tar -xf $S/websrc.tar -C $S/websrc
cp rust-port/renderer/tests/fixtures/terrain/gen.ts $S/refscript/terrain_gen.ts
cd $S/refscript
NODE_PATH=$S/ref/node_modules $S/ref/node_modules/.bin/esbuild terrain_gen.ts --bundle --platform=node --format=esm --outfile=terrain_gen.mjs --log-level=warning
node terrain_gen.mjs $S/out/terrain
# node v22.22.0; prints: terrain maps=7 instances=11605 fogCalls=16 colorCases=5120 pow=6144 hypot=2048
```

## Files

| File | Content |
|---|---|
| `map_A.json` | 9×7 hand-made, all 8 terrain types, coast/sea, terraces, 4 rivers (delta, mouth edges, tributary), `high` detail; 8 `setFog` calls (diff path, ocean-hide, `landReveal`, all hidden) |
| `map_A-lite.json` | same map, `low` detail (`robloxLite`), no `riverPathKinds` |
| `map_B.json` | 12×9 pseudo-random, seed −42, two holes, reversed key order, terraces; 4 fog calls |
| `map_C.json` | 40×30 noise map, seed 2026, rivers; 2 fog calls |
| `map_D.json` | 64×36 noise map shifted to negative `q/r`, seed 123456789, `medium` detail (not lite) |
| `map_E.json` | 70×50 noise map (3 500 hexes > 3 000 → lite under `medium`), seed −2147483648 |
| `map_F.json` | 25×18, `low` detail, no kinds; 2 fog calls |
| `color.json` | `THREE.Color` vectors: 1 024 `setHex`, 2 048 `getHex`, 2 048 `getHSL`+`setHSL`; 6 144 `Math.pow`; 2 048 `Math.hypot`; 24 `robloxLite` presets |
| `gen.ts` | the generator above |

Each `map_*.json` holds the input (hexes in `Object.values(map.hexes)` order,
rivers), the prism layers (geometry, material colour, Float32 instance
matrices and colours, keys, per-hex `blendedTerrainHex` and base colour), the
mountain/hill placement matrices, the coast layers, the ocean backdrop/frame
and, per fog call, the prism matrices and colours after the call.

SHA-256 at creation: see `dyspozycje/rust-port/p4/P4-11-CAMERA-TERRAIN-CPU.md`.
