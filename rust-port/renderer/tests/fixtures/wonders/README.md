# Wonder-model reference data (MOD-12, R-RUSTPORT-P4-14-MOD12-WONDERS-Q1)

Reference object graphs for `tests/wonders_web_parity.rs`, produced by **web code**:

- `three@0.169.0` from npm (integrity `sha512-Ed906MA3…qUv0w==`, as pinned by
  `gra/package-lock.json` at `edb8fb56`);
- web modules from `git archive edb8fb56 gra/src gra/data`, **imported
  unchanged**: `render/wonderModels.ts` (`buildWonderModel`,
  `WONDER_MODEL_IDS`), `render/wonderRenderer.ts` (`WonderRenderer`, with its
  own imports `render/hexutil.ts`, `render/mapRenderStyle.ts`, `types/hex.ts`),
  and `gra/data/wonders.json` (ids of `cuda` and `parkowane_epoka4plus`).

No web code is copied or adapted: `gen.ts` only calls the web API on a
`THREE.Scene` without a renderer (no WebGL) and dumps the graph.

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive --format=tar -o $S/websrc.tar edb8fb56 gra/src gra/data && tar -xf $S/websrc.tar -C $S/websrc
cp rust-port/renderer/tests/fixtures/wonders/gen.ts $S/refscript/wonders_gen.ts
cd $S/refscript
NODE_PATH=$S/ref/node_modules $S/ref/node_modules/.bin/esbuild wonders_gen.ts --bundle --platform=node --format=esm --outfile=wonders_gen.mjs --log-level=warning
node wonders_gen.mjs $S/out/wonders
# node v22.22.0; prints: wonders models=157 steps=9 hexes=47 trig=4477
```

Numbers are written with a serializer that keeps `-0` (plain
`JSON.stringify(-0)` is `"0"`); every other number is the shortest
round-trip decimal, so `str::parse::<f64>` restores the exact bits.

## Files

| File | Content |
|---|---|
| `models.json` | `buildWonderModel` for 26 ids (19 `cuda`, 5 parked, `nieznany_cud`, `""`) × `ruin` {false, true} × `ownerColor` {none, `0xffd54a`, `0x8e24aa`} + 1 call with `opts` omitted = 157 models. Per model: the 20 `userData.mats` + banner material (`getHex`, linear `r,g,b`, `flatShading`), every node in `traverse` order (type, parent index, position/rotation/scale, `castShadow`/`receiveShadow`, `matrixWorld` after `updateMatrixWorld(true)`, geometry type + parameters, material index, vertex/index counts, FNV-1a hash of the `Float32` attributes + indices + groups), mesh/vertex/triangle totals, `Box3.setFromObject(g, true)`. Also `WONDER_MODEL_IDS`, `cuda`, `parked`. |
| `renderer.json` | `WonderRenderer` on a 47-hex map (all 8 terrains, one hole): 9 steps (`sync` with `isVisible`/`ownerColorFn`/none, `applyFogVisibility` on/off, `sync([])`, `dispose`); after each step the `scene.children` in order: `wonderKey`, `visualKey`, `visible`, position, scale, `matrixWorld`, node count, colour of material 0, banner colour. |
| `trig.json` | 4 477 angles with V8 `Math.sin`/`Math.cos` (all builder angles, boundary values of the fdlibm reduction, 4 096 pseudo-random in ±10 and ±800 000). |
| `gen.ts` | the generator above |

SHA-256 at creation: see `dyspozycje/rust-port/p4/P4-14-MOD12-WONDERS.md` §6.
