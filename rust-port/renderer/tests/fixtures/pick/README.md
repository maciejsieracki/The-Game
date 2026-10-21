# Picking golden data (RR-T3, R-RUSTPORT-P4-10-PICKING-CPU-Q1)

Reference vectors for `tests/pick_golden.rs`. Every expected value was
produced by **web code**, not by a re-implementation:

- `three@0.169.0` from npm (the version pinned by `gra/package-lock.json`,
  integrity `sha512-Ed906MA3…qUv0w==`, identical in the scratch install);
- web modules imported **unchanged** from `git archive edb8fb56 gra/src gra/data`:
  `input/picker.ts` (`pixelToHex`, `worldToAxial`, `clientRectToNdc`,
  `refreshInstancedPickBounds`), `render/hexutil.ts`, `render/camera.ts`
  (`CameraController`), `render/mapRenderStyle.ts`,
  `render/teren-gory-wzgorza.ts`, `game/terrain-improvements.ts`,
  `types/hex.ts`;
- copies (marked `// LITERAL <file>:<lines>` in `gen.ts`) of the
  fragments that cannot be imported without DOM/WebGL: `scene.ts`
  (`hexPrismNoBottomGeo`, `isDryLandTeren`, `terrainVis`, prism and solid
  placement loop, `resolveTerrainPick`, `ZERO_MATRIX`, `terrainPickMeshes`),
  `units.ts` (`terrainTopY`, `unitTerrainRelief`, `pickUnitIdAt`),
  `main.ts` (`pickHexAt`, `pickMapTarget`). `LITERAL` means *same logic and
  arithmetic in the same order*, **not** a character-for-character copy — the
  adaptations are listed below;
- one **model** (marked `// MODEL (NIE LITERAL)` in `gen.ts`), not a copy:
  the effect of fog / cities / LOD on the pick meshes (see below).

## Adaptations (what differs from the web source text)

None of these changes any value that reaches the raycast; regeneration is
bit-identical to the fixtures (SHA-256 in P4-10 §7).

| Fragment | Adaptation | Why it is neutral for picking |
|---|---|---|
| all `LITERAL` fragments | TS types → `any` / removed; source comments removed | type erasure only |
| `terrainVis` (`scene.ts:166-170`) | `TERRAIN_VISUALS[t]` → `{ height: 0, yOffset: 0 }`, `color` dropped | the civ spec is ignored by `terrainVisualForStyle` for `roblox` (`mapRenderStyle.ts:231`) |
| `terrainTopY` (`units.ts:214-224`) | `CIV_TERRAIN_TOP[...]` → `{ height: 0, yOffset: 0 }` | same reason |
| placement loop (`scene.ts:1702-2727`) | `styledTerrain = true`; every `renderStyle` ternary reduced to its `roblox` branch; `B_NO_BOTTOM` fixed to `true` | only style `roblox` is ported (owner decision) |
| placement loop | removed materials/colours, `castShadow`, `scene.add`, `performance.*`, `*OrigMatrix` bookkeeping | no effect on geometry, instance matrices or hit order |
| `pickUnitIdAt` (`units.ts:5867-5893`) | `this.tokens` → local `tokens` (synthetic token models) | selection rule unchanged |

**Model, not a copy — fog / cities / LOD** (block after `LITERAL scene.ts:3684, 3691`):
- prism of a hidden hex (`sig === 2`) → `ZERO_MATRIX`, as in `setFog` `scene.ts:3591-3592`;
- mountain/hill solids of a hidden hex (`bri <= 0`) or under a city → `ZERO_MATRIX`,
  as in `applyTerrainFog` `scene.ts:3281-3302` and `hideInstancedOnHex`
  `scene.ts:3145-3158` called from `hideDecorAtHex` `scene.ts:3168-3184`;
- LOD `visible = zoomFlags.styledDecor` (`scene.ts:3370-3375`);
- the roblox **ocean-hide** rule (`scene.ts:3629-3637`) is **not** modelled —
  `NIE_ZMIERZONO`, P4-10 §5.1.

Unit token models are **synthetic** (Three `Box`/`Cylinder`/`Plane`
geometries with front, back and double-sided materials); they exercise the
units-first rule and the recursive raycast, not the real unit builders.

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive --format=tar -o $S/websrc.tar edb8fb56 gra/src && tar -xf $S/websrc.tar -C $S/websrc
git archive --format=tar -o $S/webdata.tar edb8fb56 gra/data && tar -xf $S/webdata.tar -C $S/websrc
cp rust-port/renderer/tests/fixtures/pick/gen.ts $S/refscript/gen.ts
cd $S/refscript
NODE_PATH=$S/ref/node_modules $S/ref/node_modules/.bin/esbuild gen.ts --bundle --platform=node --format=esm --outfile=gen.mjs
node gen.mjs $S/out    # node v22.22.0; prints: scenarios=55 points=20174 w2a=1233 round=23 ndc=6
```

## Files

| File | Content |
|---|---|
| `golden_pick.json` | 55 scenarios (map × camera × viewport): camera `matrixWorld`, `projectionMatrix(Inverse)`, 5 Three rays each, 20 174 client points with `h` = `pickHexAt` and `t` = `pickMapTarget` (only when it differs) |
| `scenes.json` | 5 maps (hex order = `Object.values(map.hexes)`), fog / city / terrace flags, the Float32 instance matrices of every pick mesh, unit token meshes (positions, index, `matrixWorld`, side) |
| `geometry.json` | `goraGeometria(0..4)`, `wzgorzeGeometria(0..4)` positions (Float32, non-indexed) and the prism geometries (`hexPrismNoBottomGeo`) per height |
| `math.json` | `worldToAxial` (both variants) on 1 233 points incl. constructed ties, `Math.round` on 23 edge values, `clientRectToNdc` on 6 rects |
| `gen.ts` | the generator above |

SHA-256 at creation: see `dyspozycje/rust-port/p4/P4-10-PICKING-CPU.md`.
