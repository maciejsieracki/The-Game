# Improvement / resource model reference data (MOD-11, R-RUSTPORT-P4-20-MOD11-IMPROVEMENTS-Q1)

Reference object graphs for `tests/improvements_web_parity.rs`, produced by **web code**:

- `three@0.169.0` from npm (integrity `sha512-Ed906MA3…qUv0w==`, identical to
  `gra/package-lock.json` at `edb8fb56`), `esbuild@0.24.0`, node v22.22.0;
- web modules from `git archive edb8fb56 gra/src gra/data`, **imported unchanged**:
  `render/improvements.ts`, `render/robloxImprovements.ts`,
  `render/ulepszenia-modele-p2.ts`, `render/ulepszenia-modele-p3a.ts`,
  `render/ulepszenia-modele-p3b.ts`, `render/kopalnia-cyny-opus5.ts`,
  `render/kopalnia-zlota-opus5.ts`, `render/droga-6-ramion.ts`,
  `render/pastwisko-modele.ts`, `render/swinia-trzoda.ts`, `render/styleResources.ts`,
  `render/mapRenderStyle.ts` (`buildStyleTarasyTerrace`), `map/road-network.ts`,
  `types/hex.ts` (plus their own imports, e.g. `render/kon-nowy-model.ts`).

No web code is copied or adapted: `gen.ts` only calls the web API (no
`WebGLRenderer`; groups, meshes, geometries and materials only) and dumps the graph.

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
ln -s ref/node_modules $S/node_modules          # lets esbuild resolve 'three' for websrc/ and refscript/
git archive --format=tar -o $S/websrc.tar edb8fb56 gra/src gra/data && tar -xf $S/websrc.tar -C $S/websrc
cp rust-port/renderer/tests/fixtures/improvements/gen.ts $S/refscript/improvements_gen.ts
cd $S/refscript
../ref/node_modules/.bin/esbuild improvements_gen.ts --bundle --platform=node --format=esm --outfile=improvements_gen.mjs --log-level=warning
node improvements_gen.mjs $S/out/improvements
# prints: improvements full=195 sigs=237
```

A second run gives byte-identical files (`cmp`). Numbers are written with a
serializer that keeps `-0`; every other number is the shortest round-trip decimal.

## Files

| File | Content |
|---|---|
| `models.json` | 195 full graphs: `buildImprovement` for the 24 keys (+ owners `0x8e24aa`, `0x1234abcd`, `0`, `-1` for fort/outpost, + keys `nieznane`, `brak`, `""`, `toString`), every exported builder of p2/p3a/p3b, both mines, cow/sheep/llama/pig in all poses and variants, pasture/herd layouts, terraces, roblox livestock figures, `buildStyledResourceOverlay(nakladka, 'roblox', zloze)` for all 8 `Nakladka` × 13 `zloze` values that matter (`null` results kept as `null`), 6 road stars, 2 sector layouts, 1 stack. Per node: type, parent, position, quaternion, scale, `castShadow`/`receiveShadow`, `userData`, `matrixWorld`; per mesh: geometry type + parameters, vertex/index count, FNV-1a hash of the Float32 attributes, indices and groups, material slot (first use); per material: model, `getHex`, linear `r,g,b`, `flatShading`, metalness/roughness (Standard), linear emissive; totals, `Box3.setFromObject(g, true)`, signature. |
| `sigs.json` | 237 combinatorial cases as node/mesh/vertex/triangle counts + bbox + signature (FNV-1a over exactly the scalars of a full dump): `buildDrogaGwiazda` for 2 types × 64 masks (hexR 1) + 5 masks at hexR 0.8, 44 `buildImprovementSectored` layouts (single keys, mixes, road masks, hexR, `sectorR`, three `surfaceY` functions incl. negative and NaN), 16 `buildRobloxFoodStack` + 32 `buildImprovementStack` subsets + extras. |
| `data.json` | `IMPROVEMENTS`, the 24 keys, `SECTOR_R_ELEVATED`, `PASTWISKO_S`, pasture/herd slots (with `toFixed(3)`), `LIVESTOCK_FIGURE_SCALE`, road constants, `roadPortRotationY(0..6)`, arms/node/lone-patch for all 64 masks. |
| `gen.ts` | the generator above |

SHA-256 at creation: see `dyspozycje/rust-port/p4/P4-20-MOD11-IMPROVEMENTS.md` §6.
