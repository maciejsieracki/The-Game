# City-model reference data (MOD-09, R-RUSTPORT-P4-21-MOD09-CITIES-Q1)

Reference object graphs for `tests/cities_web_parity.rs`, produced by **web code**:

- `three@0.169.0` from npm (integrity `sha512-Ed906MA3…qUv0w==`, the version pinned by
  `gra/package-lock.json` at `edb8fb56`), bundled with `esbuild@0.24.0`;
- web modules from `git archive edb8fb56 gra/src gra/data`, **imported unchanged**:
  `render/miasto-kamien.ts`, `render/miasto-braz.ts`, `render/bronzeCityRoblox.ts`,
  `render/stoneCityRoblox.ts`, `render/stoneCity.ts` (types/labels only),
  `render/settlementModel.ts`, `render/cityMapOutline.ts`, `render/cities.ts`
  (`CityRenderer`) with their own imports.

No web code is copied or adapted: `gen.ts` only calls the web API on a
`THREE.Scene` without a renderer (no WebGL) and dumps the graph. `CityRenderer`
runs with `hideStatChips: true` and without `getRevolt` (stat chip and revolt
sprite draw on a DOM canvas; they are MOD-10 / overlay scope). The legacy
fallback `buildCityModel` (private in `cities.ts`) is reached through the public
API by an `era` object whose `valueOf` throws, which makes `sync` take its
`catch` branch.

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive --format=tar -o $S/websrc.tar edb8fb56 gra/src gra/data && tar -xf $S/websrc.tar -C $S/websrc
cp rust-port/renderer/tests/fixtures/cities/gen.ts $S/refscript/cities_gen.ts
cd $S/refscript
../ref/node_modules/.bin/esbuild cities_gen.ts --bundle --platform=node --format=esm \
  --outfile=cities_gen.mjs --log-level=warning --alias:three=../ref/node_modules/three
node cities_gen.mjs ../out/cities
# node v22.22.0; prints: cities models=1048 outlines=5 steps=14 legacy=2
```

Numbers are written with a serializer that keeps `-0` and writes `NaN` /
`±Infinity` as strings; every other number is the shortest round-trip decimal,
so `str::parse::<f64>` restores the exact bits.

## Hashes (identical byte streams in `gen.ts` and the Rust test)

FNV-1a 32-bit over little-endian `u32` words (an `f64` is its low word, then
its high word).

- **geometry**: for `position`, `normal`, `uv`: the `Float32Array` length and its
  words, or `0xffffffff` when the attribute is absent (line loops); then the
  index (`1`, length, values) or `0`; then the groups (count, `start`, `count`,
  `materialIndex`).
- **model**: per node in `traverse` order: type (1 group, 2 mesh, 3 line loop),
  parent index (`-1` → `0xffffffff`), position, rotation, quaternion, scale,
  `matrixWorld` (16) as f64, `castShadow`, `receiveShadow`, `visible`,
  `renderOrder`; for a drawable also its geometry hash and its material index
  in first-use order. Then every material in first-use order: type (1 Lambert,
  2 line), linear `r,g,b`, `flatShading`, `transparent`, `opacity`,
  `depthWrite`, `side`.

## Files

| File | Content |
|---|---|
| `models.json` | 1 048 model dumps: `miasto-kamien` (levels 1–10 + 0, 11, −3, 2.5, 3.5, 6.49, NaN × mur × colour {default, `0x8e24aa`}, threshold names, defaults, colour above 24 bits), the Biskupin palisade alone (3 phases), `miasto-braz` (grecja / rzym × the same levels × {none, mur, palisada, both} × colour; router with `egipt`, `sumer`, unknown, empty civ; threshold names; defaults), `bronzeCityRoblox` (11 civs × levels 1–10, 0, 12, 4.5 × walls, + 2), `stoneCityRoblox` per civ (11 × 13 × 2, + 1) and the level-only overload (12 × 2, + 1), `settlementModel` (era 0–3 × 3 civs × 6 levels × walls). Per model: counts, `Box3.setFromObject(g, true)`, materials (`getHex`, linear `r,g,b`, flags), model hash, `userData` (`model`, `poziom`, `rozmiar`); 21 models carry a per-node dump (`detail`). Also 5 `cityMapOutline` dumps (one after `placeCityMapOutline`), `BRONZE_CIVS`, `STONE_CIVS`, `STONE_CIV_LABELS`, `rozmiarDlaPoziomu` for 17 levels, `MIASTO_KAMIEN_LAYOUT`, `MIASTO_BRAZ_LAYOUT`. |
| `renderer.json` | `CityRenderer` on a 47-hex map (all 8 terrains, one hole): 14 steps (`sync` with 5 option sets, reuse, move / re-own / remove / add, `applyFogVisibility` on / off / other player / empty set for player 2 and the default player, `syncMapOutlines`, `sync([])`, `dispose`); after each step the `scene.children` in order (city: `cityId`, `visualKey`, `ownerId`, `q`, `r`, `visible`, position, scale, model summary; outline: `cityId`, `outlineCivColor`, `outlineAtWar`, `outlineHex`, `visible`, model summary). Plus 2 dumps of the legacy fallback `buildCityModel`. |
| `gen.ts` | the generator above |

SHA-256 at creation: see `dyspozycje/rust-port/p4/P4-21-MOD09-CITIES.md` §6.
