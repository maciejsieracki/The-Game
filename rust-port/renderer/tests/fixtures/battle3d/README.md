# MOD-14 "battle 3D" reference data (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1)

Round 1: `battle/siegeWall.ts` (9 wall styles + `attachRowBreachPanels`).
Reference vectors for `tests/battle3d_siege_wall.rs`, produced by **running the
web code** of `edb8fb56`:

- `three@0.169.0` from npm (integrity `sha512-Ed906MA3…qUv0w==`), `esbuild@0.24.0`
  (integrity `sha512-FuLPevCh…/iuPqQ==`), node v22.22.0;
- `gra/src/**` from `git archive edb8fb56 gra/src gra/data`, **imported unchanged**:
  `battle/siegeWall.ts` and its one import `render/bronzeCity.ts` (`BRONZE_CIVS`, type
  `BronzeCiv`). No plugin, no shim, no DOM stub (`siegeWall.ts` uses no DOM).

No WebGL renderer: `buildSiegeWall` returns a `THREE.Group`; `gen.ts` calls
`updateMatrixWorld(true)` and dumps it.

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive edb8fb56 gra/src gra/data | tar -x -C $S/websrc
cp rust-port/renderer/tests/fixtures/battle3d/{gen.ts,build.mjs} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
node $S/refscript/build.mjs                 # -> $S/refscript/gen.mjs
node $S/refscript/gen.mjs $S/out            # prints: battle3d siegeWall cases=95 meshes=11877
sha256sum $S/out/siege_wall.json $S/refscript/gen.mjs   # both = MANIFEST.sha256
```

Two runs give the same SHA-256 (no random numbers: `hash01` is `Math.sin`-based).
**`gen.mjs` is byte-reproducible** (round 2): `build.mjs` sets `absWorkingDir` to its own directory,
so esbuild's path comments are relative to `refscript/` (`// ../ref/node_modules/three/…`,
`// gen.ts`, `// ../websrc/gra/src/battle/siegeWall.ts`) whatever `$S` is. The layout
`$S/{ref,websrc,refscript}` above is therefore part of the recipe. (Round 1's bundle carried
absolute scratch paths in 5 comment lines; code was identical.)

## Cases (95)

| group | cases | what |
|---|---|---|
| `game-<civ>` | 11 (all `BRONZE_CIVS`) | the game call `battleScene.ts:3905-3910` (`lengthTiles 156 = BF_ROWS`, `tileSize 1 = TILE_S`, `height 2.5`, `gateWidthTiles 2`) + `attachRowBreachPanels(77.5, 0, 155, 76, 77, 1)` (`:3930-3938`). `aztek`/`hetyci` (Grecja fallback): summary only, no node list. |
| `unknown-*` | 3 | `''`, `'xyz'`, `'Grecja'` → `default` branch (Grecja) |
| sweep `<name>-<style>` | 9 × 9 styles | `defaults` (12, 1; height/gate absent → 3 / 2; 3 breach calls incl. gate rows over real segments), `small-half` (10, 0.5, 1.8, gate 3), `odd-tall` (7, 1.3, 4.4, gate 1, ownerColor set — unused by the web), `frac` (9.5, 0.73, 2.5, 2), `low-wide-gate` (5, 2, 1, 4), `no-side` (2, 1, 2.5, 2: `leftW = 0` → `0/0 = NaN` positions in Zulu/Celtowie/Germanie, kept bit for bit); round 2 (JS `Map` keys, Evaluator r1 objections 1–2): `gate-zero` (6, 1, 2.5, gate 0) and `gate-half` (gate 0.5) — a segment centre in (−0.5, 0) gives `Math.round = −0`, stored by `Map.set` as `+0`; breach `rowLo = −0` → row key `+0`; `tile-zero` (6, 0, 2.5, 2: `L = 0`, no segment, `0/0` lookups) |

## Size budget (deliberate omissions, all still verified)

- `w` (per-node world matrix) is dumped only for `unknown-*` and the sweeps
  `defaults`, `frac`, `no-side`; for every case and every mesh the world matrix
  enters `sig` (FNV over its 16 binary64 values), so a wrong world matrix still fails.
- `r`/`q` are dumped only when the rotation is not the default (+0 Euler,
  (0,0,0,1)); `s` only when the scale is not (1,1,1). The test asserts the
  defaults (bit for bit) when the key is absent.
- `aztek`/`hetyci` game cases: summary only (they call `buildGrecja`, the tree of `game-grecja`).

Without these omissions the 68-case file of round 1 was 10.0 MB (over the 8 MB per-file
limit); with them it was 6.3 MB, and with the 27 round-2 cases it is 7.2 MB (7 228 812 B).

**Not a case: `tileSize = NaN`.** NaN keys cannot reach the JS maps (the segment loop
`sx < endX - T * 0.01` and the breach loop `r <= rowHi` are false for NaN), and every
NaN-valued output then carries V8's NaN bit pattern: measured in round 2, an input of
`0x7ff8…` came out as `0xfff8…` in positions and geometry parameters, whereas Rust propagates
the input payload. ECMA-262 leaves NaN bit patterns implementation-defined, so this is not a
parity property; the NaN branch of `same_value_zero` is pinned by the unit test
`map_helpers_follow_js_map_same_value_zero` (node-measured facts) instead.

## Files (SHA-256 in `MANIFEST.sha256`)

| File | Content |
|---|---|
| `siege_wall.json` | `cases[]`: `id`, `civ`, `opts`, `optsHx` (binary64 bits of lengthTiles, tileSize, height\|NaN, gateWidthTiles\|NaN), `nodeCount`, `meshes`, `tris`, `materials` (distinct material identities), `sig`, `bbox`, `nodes[]` (kind, name, parent, `p`, `r`, `q`, `s`, `w`, castShadow, receiveShadow, renderOrder, visible, material: identity id, type, `getHex`, linear rgb, roughness, metalness, side, flatShading, transparent, opacity, depthWrite, depthTest, emissive; geometry: type, vertex/triangle count, FNV hash, constructor parameters), `ud` (userData after build: key order, `wallSegsByLocalX`, `wallWalkY`, `depth`, `gateCenterX`, `gate` node, `gateOpen`), `breaches[]` (args + userData after each `attachRowBreachPanels`). |
| `gen.ts`, `build.mjs` | generator and its bundler |
| `gen.mjs` | the bundle that produced `siege_wall.json` (three + web code inlined) |
| `mutate.py` | mutation run (34 mutants of `src/battle/siege_wall.rs`; runs `--lib` and `--test battle3d_siege_wall`) |

Floats are IEEE-754 binary64 bits (`hx()`: 16 hex digits per number); the Rust
side compares `to_bits()`, so `-0` and the NaN payload (`0xfff8…`) survive.
Hashes: FNV-1a 32-bit over little-endian bytes, the routine of `scene::{Fnv, geo_hash}`.
