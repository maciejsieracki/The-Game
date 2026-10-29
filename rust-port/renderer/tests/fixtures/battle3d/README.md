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

---

# Part 2: the static battlefield (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q2)

Reference vectors for `tests/battle3d_field.rs` (`battle::field`), produced by **running
`battle/battleScene.ts` of `edb8fb56`** with the same toolchain (three@0.169.0, esbuild@0.24.0,
node v22.22.0): the full constructor `new BattleScene(opts)` with empty armies, plus the scene
builders called directly on `Object.create(BattleScene.prototype)` for synthetic terrain grids.

## What differs from part 1 (all bundle-time; nothing is written to `gra/**`)

| file | why |
|---|---|
| `build_field.mjs` | esbuild plugin `append-battle-scene-exports`: appends ONE line `export { BF_COLS, …, makeGableRoofGeometry, cellToWorld, … };` to `battle/battleScene.ts` (its text is otherwise byte-identical) so module-private constants/helpers are reachable; plugin `battle-scene-three-shim`: `three` imported **by battleScene.ts only** resolves to `three_shim.ts`; `define` `import.meta.glob` / `import.meta.env` → inert stubs (Vite-only features of UI modules imported transitively; not reached by the scene code). |
| `three_shim.ts` | the real `three` with ONLY `WebGLRenderer` replaced by an inert recorder (no WebGL under node); its settings (`shadowMap`, `toneMapping`, exposure) are dumped as data. |
| `dom_stub.ts` | universal DOM stub (Proxy: every read/call returns a stub); layout sizes (`clientWidth`, …) read 0, so `_syncRendererSize` returns early and `camera.aspect` keeps the constructor's 1. Only the THREE graph is dumped; no stub value reaches it. |

`gen_field.mjs` (the bundle, 2.78 MB: `battleScene.ts`'s imports pull in the whole game) is
**not committed** (fixture budget 12 MB); it is byte-reproducible: SHA-256
`497e56661add95c804b6476ede7f7a34441a49bd8d096a760710ec7067d09143` (kept here, not in
`MANIFEST.sha256`, so that `sha256sum -c MANIFEST.sha256` checks only committed files).

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive edb8fb56 gra/src gra/data | tar -x -C $S/websrc
cp rust-port/renderer/tests/fixtures/battle3d/{gen_field.ts,build_field.mjs,dom_stub.ts,three_shim.ts} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
node $S/refscript/build_field.mjs           # -> $S/refscript/gen_field.mjs
node $S/refscript/gen_field.mjs $S/out      # prints: battle3d field ctor=16 synthetic=9 nodes=281792
sha256sum $S/out/field.json $S/refscript/gen_field.mjs   # field.json = MANIFEST.sha256, gen_field.mjs = 497e5666… (above)
```

Measured: two runs in two different scratch directories (separate `npm install`, separate
`git archive`) give identical `field.json` (`39df4eb7…369929`) and `gen_field.mjs`
(`497e5666…d09143`). The code that runs has no `Math.random`: decoration uses `tileJitter` (hash),
the terrain generator a seeded mulberry32 (`'bf:' + teren`).

## Cases

| group | n | what |
|---|---|---|
| `ctor` | 16 | `new BattleScene({attacker: [], defender: [], teren, worldTerrain?, siege?, deploy?, deployPlayerSide?})`: 3 legacy terrains (`Laka`, `Las`, `Góry`), the 8 world presets (`laka`, `rownina`, `wzgorza`, `gory`, `pustynia` = desert palette, `plytkie_morze`, `rownina+las`, `rownina+rzeka`), 2 sieges (`rzym`; `wzgorza` + `defCiv: 'egipt'`), deploy `atk`, `def`, siege + `def`. The input DTO `tilesIn` = `generateBattleTerrain` + `_carveBattleBox` + `_fencePlayableZone` run by the generator; it is asserted equal (after the web `_carveWallTiles` for sieges) to the constructor's own grid. |
| `synthetic` | 9 | builders called directly: all plains (grass cap 8000 reached: `break outerGrass`), all plains desert + carve + deploy `atk`, two LCG mixes of all 8 kinds (+ desert, deploy `def`, 4 + 1 cell outlines, dashed and solid, incl. a reversed rectangle and one past the grid), a 20×30 grid (out-of-range `at` = Plains; wall column given, no carve), all river (no decoration, no interior plot, no passable deploy tile), interior with no room (`siegeWallCol` 60), hills + rocks (`siegeWallCol` −1), all plains with `siegeGateRow` 79 (a plot row exactly `STREET_HALF` = 3 from the gate; in the game the gate row is always 77). |
| `applyCamera` | 5 | `_applyCamera` for distances inside, below and above the clamp, a fractional target, and NaN (NaN-ness compared only, P4-36 §3a). |
| `consts`, `helpers` | — | every constant read by the scene (equality test), `lighten` / `blend` (96 fixed + 200 LCG cases each), `makeGableRoofGeometry`, `cellToWorld`, `tileTopY`. |

## Record format (`field.json`)

Per scene: `nodeCount`, `sig` (FNV-1a over the record of every node in `traverse` order), `runs[]`
(consecutive top-level children with the same label `kind:geometryType:geoHash:materialType`; the
10 608 tiles are one run): `label`, `start`, `children`, `nodes`, `sig`, `full` (first 3 nodes field
by field); `matSigs` (one per material identity, first use in traverse order) and `matFull` (first 40
distinct materials field by field); `groundPick`, `deployZone`, `deployGroup` (traverse indices);
constructor cases also `env`, `renderer`, `camera`, `siegeState`, `tilesOutHash`.
A node record = kind, name, parent, position, Euler + order, quaternion, scale, `matrixWorld`,
`castShadow`, `receiveShadow`, `visible`, `renderOrder`, material identity, geometry type / hash /
constructor parameters; for a `Line` its `lineDistance` attribute; for an `InstancedMesh` capacity,
count, FNV of the whole `instanceMatrix` / `instanceColor` arrays and `boundingSphere`; for a light
colour, intensity, ground colour, target, target position and shadow camera. The byte stream is
mirrored in `battle3d_field.rs` (`View::record`, `View::mat_sig`).

**Excluded:** the siege wall group (`_placeSiegeWall`, part 3) is skipped in every dump
(`wallIndexInChildren` says where it sits); units are not placed (empty armies).

| File (part 2) | Content |
|---|---|
| `field.json` | the vectors above (3.17 MB, 3 165 207 B) |
| `gen_field.ts`, `build_field.mjs`, `dom_stub.ts`, `three_shim.ts` | generator, bundler and the two documented stubs |
| `mutate_field.py` | mutation run (mutants of `src/battle/field.rs`; runs `--lib battle::field` and `--test battle3d_field`) |

---

# Part 3: units and overlays (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3)

Reference vectors for `tests/battle3d_units.rs` (`battle::units`), produced by **running
`battle/battleScene.ts` of `edb8fb56`** with the part-2 toolchain (three@0.169.0, esbuild@0.24.0,
node v22.22.0, the same `dom_stub.ts` / `three_shim.ts`): `new BattleScene(opts)` **with armies**,
operations on the constructed scene, and the overlay methods called directly on
`Object.create(BattleScene.prototype)` with injected lookups.

## What differs from part 2 (bundle-time / observation only; nothing is written to `gra/**`)

| file / step | why |
|---|---|
| `build_units.mjs` | `build_field.mjs` with a longer appended `export { … }` line (adds `makeUnitBars`, `makeFallbackAvatar`, `dirYaw`, `sideColor`, the bar / order constants, `DIR_DELTA`, `ammoCount`, `moraleBaseFor`) and the default entry `gen_units` |
| prototype wrappers in `gen_units.ts` | `_placeUnits` / `_placeUnitsOneSide` are wrapped to **snapshot** the runtime units right after placement (the spawn DTO), `_moveDeployUnit` to **log** its calls (deploy-layout moves); the wrapped methods run unchanged |
| `groupFrame` exclusion | group-frame markers (`_updateGroupFrameMarker`: Line + number Sprite under a grouped unit; created by the deploy UI) are part 4 (P4-36 §4) — `walk()` skips those sub-trees in every dump and counts them (`scene.markers`) |
| NaN in hashes | NaN is hashed as one canonical pattern (`0x7ff8…` / `0x7fc0…`) on both sides: V8 returns `0xfff8…` for `0/0` and for NaN through `Math.min/max`, which ECMA-262 leaves implementation-defined (P4-36 §3a); NaN-ness stays compared |

`gen_units.mjs` (the bundle, 2.80 MB) is **not committed** (budget); it is byte-reproducible:
SHA-256 `f59b98427e40d8b01838a1ea981386d42a7437c21a50d791b9224835b70d4bc3`.

## Regeneration (outside the repository only)

```bash
S=<scratch dir>        # as for part 2: $S/{ref,websrc,refscript,out}, npm install three@0.169.0 esbuild@0.24.0
git archive edb8fb56 gra/src gra/data | tar -x -C $S/websrc
cp rust-port/renderer/tests/fixtures/battle3d/{gen_units.ts,build_units.mjs,dom_stub.ts,three_shim.ts} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
node $S/refscript/build_units.mjs           # -> $S/refscript/gen_units.mjs
node $S/refscript/gen_units.mjs $S/out      # prints: battle3d units ctor=11 units=1230 bars=10 arrows=12 preview=11 ghosts=16
sha256sum $S/out/units.json $S/refscript/gen_units.mjs   # units.json = MANIFEST.sha256, gen_units.mjs = f59b9842… (above)
```

Measured: two runs in two different scratch directories (separate `npm install`, separate
`git archive`) give identical `units.json` (`6fb3b65a…12b171`, = MANIFEST) and `gen_units.mjs` (`f59b9842…4bc3`).
No `Math.random` is reached: placement is deterministic, unit models are procedural.

## Cases

| group | n | what |
|---|---|---|
| `ctor` | 11 | `new BattleScene(opts)` with armies: presets of `testBattle.ts` (`maly`, `rzym_grecja`, `konnica` on `Las`, `maciej_playtest` on `Góry`), sieges (`oblezenie` + `rzym`; `oblezenie_duze` + `defCiv: 'egipt'`; synthetic + `zulu`), two synthetic rosters (every `units.json` row once per side, model category cycled through 16 keys, owner colour through 8, HP fraction 0…1, veteran 0/0.1/0.2), deploy `atk` / `def` / siege + `def`. 1 230 units, 75 unit names, 16 categories, 160 deploy moves. Input: `tilesRle` (terrain DTO = `generateBattleTerrain` + `_carveBattleBox` + `_fencePlayableZone`; asserted equal, after the web `_carveWallTiles` for sieges, to the constructor's grid), `spawn` (DTO rows), `moves`. Posts: `resetAtk` / `resetDef` (`_resetDeploySide` → `_placeUnitsOneSide`), `removeOne` (`_removeUnitFromScene`, incl. a second call on the same unit), `removeAll` (`_removeAllUnitsFromField`), `climb` (`_activateUnit` reaching the siege-tower climb with the logic hooks before it neutralised). |
| `bars`, `fallback`, `barUpdates` | 10 / 3 / 18 | `makeUnitBars` (5 colours × ammo shown/hidden), `makeFallbackAvatar`, `_updateHpBar` / `_updateMoraleBar` / `_updateAmmoBar` incl. band edges 0.6 / 0.3, 0, negative, `Infinity`, NaN, `maxHp` 0 |
| `dirYaw`, `sideColor` | 6 / 4 | facing 0…3 and two out-of-range indices (fallback `Dir.E`) |
| `rings` | 3 stages | `_addSelectionRing` (incl. a duplicate), `_refreshUnitRingColor`, `_removeSelectionRing` (twice), `_refreshDeploySelectionVisuals` (scale reset, ring re-centring, dead unit skipped) |
| `arrows` | 12 | `_makeOrderArrow`: move / attack × preview, below / just above the 0.08 minimum, zero length, long, backwards, sloped `from.y ≠ to.y` |
| `queued` | 4 | `_refreshQueuedOrderVisuals` for player `atk` / `def`, not started, finished; a stale arrow removed first; dead / removed / routed units and targets |
| `preview` | 11 | `_updateOrderPreview`: enemy under the cursor, dead enemy + enemy on the tile, own unit + free tile, group members with formation offsets, no tile, not manual, empty selection, no ghost layer, own occupant, deploy phase hover / drag |
| `ghosts` | 16 | `_refreshBattleMoveGhosts`, `_refreshDeployGhosts` (incl. a repeated call, partial layout, no drag, dead-only selection), `_refreshDeployGhostsAt`, `_updateDeployPlacementPreview` (in / out of the zone, no tile, drag, not deploy phase) |
| `consts` | — | `HPBAR_*`, `BAR_*`, `MORALEBAR_Y`, `AMMOBAR_*`, `ORDER_*`, `DIR_DELTA` |

The injected lookups (`_pickUnitAtScreen`, `_pickGroundTile`, `_moveDestinationsForSelection`,
`_liveGroupMemberIds`, `_computeDeploy*Layout`, `_isDeployCellOk`, `_inDeployPlayerZone`,
`_passableForUnit`) are small closures in `gen_units.ts` §7–§8, mirrored one to one by the
`BattleQueries` implementation `Q` of `battle3d_units.rs`.

## Record format (`units.json`)

- unit row (`units.rows[]`): `[id, ammoBarShown, root index of the model group, root index of the bar
  group, model [nodes, meshes, triangles, sig, all], bars [nodes, sig]]`; `model.sig` = the unit-core
  signature (`tests/fixtures/unit_core/gen.ts::signature`: geometry hash, `getHex`, metalness,
  roughness, transparent, opacity, flatShading, `matrixWorld` of every mesh), `model.all` = FNV of
  every node's kind / visibility / `matrixWorld`; `bars.sig` = the node-record stream below;
- spawn row (`spawn[]`): `[id, side, q, r, facing, onWallWalkway, kategoria, Jednostka-or-nazwa,
  ownerColor, [hp, maxHp, morale, moraleMax, ammoLeft, ammoMax], …]` (non-finite numbers as
  binary64 hex);
- `scene`: root children, node count, FNV over (kind, sub-tree size, visible) of every root child,
  `markers`; `wall`: root index, model record, `p` / `r` / `q`, `rowWallMeshes` / `rowBreachPanels`
  sizes;
- `dumpTree` (bars, arrows, rings, overlay scenes): `{ n, sig, nodes? }`, node record = the part-2
  `nodeRecord` stream (kind, name, parent, position, Euler + order, quaternion, scale,
  `matrixWorld`, shadows, visible, `renderOrder`, material identity, geometry type / hash /
  parameters, `lineDistance`) **plus the material signature** (`matSig`) of meshes and lines.
  Mirrored in `battle3d_units.rs` (`dump_tree`, `mat_sig`, `model_record`).

| File (part 3) | Content |
|---|---|
| `units.json` | the vectors above (645 438 B) |
| `gen_units.ts`, `build_units.mjs` | generator and bundler (uses `dom_stub.ts`, `three_shim.ts` of part 2) |
| `mutate_units.py` | mutation run (43 mutants of `src/battle/units.rs`; measured 43/43 killed, r1 pomiary; runs `--lib battle::units` and `--test battle3d_units`) |

---

# Part 4: dynamics and effects (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q4)

Reference states for `tests/battle3d_dynamics.rs` (`battle::dynamics`), produced by **running
`battle/battleScene.ts` of `edb8fb56`** with the part-2/3 toolchain (three@0.169.0, esbuild@0.24.0,
node v22.22.0, `dom_stub.ts`, `three_shim.ts`). Bundler `build_dynamics.mjs` = `build_units.mjs` with a
longer appended `export { … }` line (+ `makeProjectileMesh`, `projectileKind`, `lerp`, `easeOut`,
`easeIn`, `MOVE_STEP_MS` … `MORALE_WALL_BREACH`); `battleScene.ts` text otherwise unchanged.

**How the animations are driven.** `requestAnimationFrame` is replaced by a recorder (callbacks are
queued); `frame(t)` sets the virtual clock `vNow = t` and runs the queued callbacks once — what the
frame loop does after `_advanceVClock`. The per-frame tickers (`_tickProjectiles`, `_tickFades`,
`_tickFloatLabels`) are called with chosen times. Logic the animated methods call is stubbed or only
observed (P4-36 Z-36-13): `_singleBlow` (fixed damage), `_defenderCounters`, `_schedule` (records the
delay; the generator runs a scheduled callback where the scene depends on it), SFX, siege HUD,
`_boostEnemiesOnBreak` / `_checkMeleeScreenLost` / `_shakeAlliesOnLoss`. What the logic decided
(facing after `_updateFacing` / an attack, routs, retreat cells, morale, flee steps) is dumped as the
DTO the Rust test replays.

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive edb8fb56 gra/src gra/data | tar -x -C $S/websrc
cp rust-port/renderer/tests/fixtures/battle3d/{gen_dynamics.ts,build_dynamics.mjs,dom_stub.ts,three_shim.ts} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
node $S/refscript/build_dynamics.mjs        # -> $S/refscript/gen_dynamics.mjs
node $S/refscript/gen_dynamics.mjs $S/out   # prints: battle3d dynamics events=23
sha256sum $S/out/dynamics.json $S/refscript/gen_dynamics.mjs
```

Measured (r1): two runs in two different scratch directories (separate `npm install`, separate
`git archive`) give identical `dynamics.json` (= `MANIFEST.sha256`) and `gen_dynamics.mjs`
(2 792 288 B, SHA-256 `9d5071a451e21b4429e470ed09169b6cbef8ef0b80f1237c984cddf37acb96c2`; not
committed — fixture budget, not in `MANIFEST.sha256`). No `Math.random` is reached (rubble uses
`tileJitter`).

Measured (Operator "pomiary" r1): a third run of the r1 generator in a new directory reproduced
`4c7bcc21…` / `9d5071a4…` byte for byte. The generator then got §14 (`out.pomiary`, below; the
event vectors are unchanged — `JSON` of the new file without `pomiary` = the r1 file). The extended
generator, run in two directories (separate `npm install`, separate `git archive`), gives identical
`dynamics.json` (149 178 B, SHA-256 `68ae2085…` = `MANIFEST.sha256`) and `gen_dynamics.mjs`
(2 793 451 B, SHA-256 `bdb8c7ad23e5c9042329f5c17d790da8e009ff72647864410fee49add1baf74c`).

## Cases (`dynamics.json`)

| key | what |
|---|---|
| `siege` | the `oblezenie` preset (civ `rzym`): DTO `tilesRle` / `desert` / `spawn` / `moves` as in part 3; `tilesNow` = the grid after a few tiles next to the walking units were turned into hills / river / ford (only `tileTopY` reads change) |
| `events[]` (23, replayed in order on ONE scene) | `move` ×6 (onto a hill, into a river and a ford, back; fractional sample times, `p = 1`, past the end), `melee` ×3 (plain; with a counter that turns the defender; attacker killed by the counter → frozen), `shots` (4 projectiles: a real wall archer → `arrow`, the same archers with category `procarz` / `oszczepnik` / `legionista` → `sling` / `javelin` / `pilum`; full tree at launch, positions at 10 times until all landed), `fade` (two staggered deaths), `ram` ×2 (full run; interrupted by `finished`), `boulder` (flight, removal, the scheduled hit with tile HP 1 → `_breachWallTile`), `breachWall` ×4 (three defenders stacked on the tile retreat; two defender catapults destroyed; a row without wall mesh / outside the grid; the same row again), `breachGate`, `flee` (rout + flee steps to the fenced margin, stuck twice → removed), `markers` (group ids `'3'`, `'abc'`, `'0'`, `' 12x'`, `'7'`, `null`, `'-2'`, `'2.9'`, `'9'`, `'9'` on a dead unit, then `_syncAllGroupFrameMarkers`; number textures as recorded canvas calls), `billboard` (two camera poses, every live unit), `labels` (every float label spawned above; `_tickFloatLabels` at 10 times with `Vector3.project` intercepted: the point before the projection and the CSS opacity) |
| `deploy` | the `rzym_grecja` preset in deploy `atk`: the deploy UI's 84 group markers, the deploy-phase frame (stale preview cleared, order lines hidden, billboards), `_endDeployPhase` (3D part; UI / logic stubbed) |
| `projectileKinds`, `projectileMeshes` | `projectileKind` over 9 categories × 17 names (via `nazwa` and via `stats.Jednostka`); `makeProjectileMesh` for the 4 kinds |
| `consts`, `easing` | the 10 constants; `lerp` / `easeOut` / `easeIn` incl. NaN, `±0`, `Infinity` |
| `pomiary` (§14, after the events, same scene) | `gateStyles`: for each of the 9 wall civs (`grecja` … `germanie`) `_placeSiegeWall(civ)` + `_breachGate()` (with `def` empty and `siegeGateCol` −1), the visibility string of every wall child before / after, child and mesh counts, gate group visibility (the `breachGate` event covers `rzym` only; the hiding band decides meshes of `egipt` / `celtowie`); `routs`: `_startRout` on a live attacker and defender (facing preset to `Dir.S`) → facing and `group.rotation.y` |

Record format: `dumpTree` / `modelRecord` / `sceneSummary` as in part 3, plus kind `Sprite` (9: material
identity + `matSig`), Sphere / Icosahedron parameters, `modelRecord` WITHOUT skipping `groupFrame`,
and `updateWorldMatrix(true, true)` before every dump (no stale ancestor `matrixWorld`). Positions are
binary64 hex (`hx`). Mirrored in `battle3d_dynamics.rs`.

| File (part 4) | Content |
|---|---|
| `dynamics.json` | the vectors above (149 178 B) |
| `gen_dynamics.ts`, `build_dynamics.mjs` | generator and bundler (uses `dom_stub.ts`, `three_shim.ts` of part 2) |
| `mutate_dynamics.py` | mutation run (50 mutants of `src/battle/dynamics.rs`; runs `--lib battle::dynamics` and `--test battle3d_dynamics`). Operator "pomiary" r1 on 1.87.0: first pass 45/48 (survivors `gate band`, `gate height rule`, `rout west`); after `pomiary` vectors + two lib tests and 2 new mutants (`rout east`, `gate centre band`): **50/50 killed**. `gate height rule` is equivalent on every reachable wall (killed only by the lib probe test, P4-36 §38) |

# Part 5: picking and camera (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q5)

Reference states for `tests/battle3d_picking.rs` (`battle::view`, `battle::picking`), produced by
**running `battle/battleScene.ts` and `input/picker.ts` of `edb8fb56`** with the part-2/4 toolchain
(three@0.169.0, esbuild@0.24.0, node v22.22.0, `dom_stub.ts`, `three_shim.ts`). Bundler
`build_picking.mjs` = `build_dynamics.mjs` with a longer appended `export { … }` line (+ `clampBattleTile`,
`battlePickMeshUpNormal`, `pickBattleGroundTilePlane`, `pickBattleGroundTileFromMeshes`, `worldToScreen`,
`DEPLOY_MIN/MAX_COL/ROW`).

**Set-up.** The scenes are the part-4 ones (`siege` = `oblezenie`/`rzym`, `deploy` = `rzym_grecja`,
deploy `atk`); `picking.json` stores only an FNV of their DTO (`dto`), the Rust test builds them from
`dynamics.json` and checks the signature. The canvas is a fake element (client size + bounding rect),
`renderer.getSize/setSize` are added to the inert renderer (initial size 300×150 — a canvas without
attributes), and a render is emulated as `scene.updateMatrixWorld(); camera.updateMatrixWorld()` (all
`WebGLRenderer.render` changes on the graph; one render precedes every click). Logic the clicks reach is
recorded, not run.

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive edb8fb56 gra/src gra/data | tar -x -C $S/websrc
cp rust-port/renderer/tests/fixtures/battle3d/{gen_picking.ts,build_picking.mjs,dom_stub.ts,three_shim.ts} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
node $S/refscript/build_picking.mjs        # -> $S/refscript/gen_picking.mjs
node $S/refscript/gen_picking.mjs $S/out   # prints: battle3d picking poses=6
sha256sum $S/out/picking.json $S/refscript/gen_picking.mjs
```

`PICK_VERBOSE=1` also writes `picking-verbose.json` (every ray with its first hits, every camera state as
hex, per pose the count of meshes with `geometry.boundingBox`, material arrays and `BackSide` — all 0) for
debugging; not committed. Measured (r1): two runs in two different scratch directories (separate
`npm install`, separate `git archive`) give identical `picking.json` (81 669 B, `3a3b1f38…` =
`MANIFEST.sha256`) and `gen_picking.mjs` (2 783 652 B, SHA-256
`83f1f89e191d6c0dc22b5f18b33c0b1b218c4c632762f1b91f88563303bfe919`; not committed — fixture budget).

Measured again (r1, "pomiary", after `extra` was added): two runs in two different scratch directories
give identical `picking.json` (92 307 B, `454daef2…` = `MANIFEST.sha256`) and `gen_picking.mjs`
(2 792 670 B, SHA-256 `797b102846ef05734b9be270a2f147927ebab5369cc6cb0819d5078e6d5c2ea2`); every key
other than `extra` is byte-identical to the 81 669 B file above (and that file reproduced as
`3a3b1f38…` in a third directory before the change). The generator prints the same line.

## Cases (`picking.json`)

| key | what |
|---|---|
| `siege.cam0` | the 86 camera numbers after the constructor (`camNums`: target, distances, position, quaternion, rotation, aspect, `matrixWorld`, `matrixWorldInverse`, `projectionMatrix(Inverse)`) |
| `siege.camOps[]` (176) | camera steps replayed in order: canvas changes, `_syncRendererSize`, wheel (incl. ±1e4 / −1e5 → clamps), keys `+ = Add - _ Subtract x`, `_setZoomTarget`, 70+ frames (`_syncRendererSize` + `_tickZoom` + `_tickCameraPanKeys`), pan keys (WASD / arrows, editable target, unknown code), drag pan (buttons 0/1/2/3), `_clampCamTarget`, `_applyCamera`; each: result (`preventDefault`, pan keys, `panning`, renderer size), FNV of the 86 numbers, minimap viewport |
| `siege.toScreen`, `siege.clientPx` | `worldToScreen` on a stale camera (after `_applyCamera`, before a render — `Object3D.lookAt` leaves `matrixWorld` with the previous quaternion), after a render, on an empty canvas; `worldToClientPx` |
| `siege.poses[]`, `deploy.poses[]` | 6 poses (default; wall close-up; flagged units + relief tiles under the camera; far zoom with another aspect and an offset rect; deploy default; group-marker close-up): a grid of client pixels + one ray aimed at every unit; per ray `[ground, fromMeshes, fromPlane, unit, nGroundHits, nUnitHits]`, and per pose one FNV over every ray and every intersection with the ground meshes (non-recursive) and the live unit groups (recursive: meshes, marker `Line`s, `Sprite`s) — distance, point, up normal, object `traverse` index, instance |
| `siege.flagged`, `siege.relief`, `siege.occ`, `deploy.occ` | unit flags the pickers filter on, tile kinds changed without rebuilding the meshes (plane and meshes disagree), `occByKey` |
| `siege.battleClicks[]` (76) | `_onBattleClick` × 19 targets × 4 modifier / selection states; the logic call it reaches (`_handleBattleUnitPick`, `_issueBattleAttack`, `_issueBattleMove`) |
| `deploy.deployClicks[]` (18) | `_onDeployClick` sequence with the real `_handleDeployUnitPick` / `_refreshDeploySelectionVisuals`: logic log, selection, `_deploySelected`, rings, FNV of every roster unit's scale / ring; one click on a tile made a river |
| `*.box[]` | `_doBoxSelect` rectangles (battle manual / auto, deploy): `_clearAllSelection` + the units it rings |
| `siege.bars` | `_onKeyToggleBars` × 6 (`h`, `H`, editable target, Ctrl, other key): `preventDefault`, `barsVisible`, visibility of every bar group (dead / removed skipped) |
| `helpers` | `clampBattleTile` (incl. `-0`, fractional), `BF_COLS`, `BF_ROWS`, `TILE_S`, `ORDER_LINE_Y` |
| `extra.*` | added by the Operator "pomiary" call for the 12 mutants the vectors above left alive (P4-36 §49); every block runs on a FRESH scene (DTO signature and `occByKey` re-checked by the generator): |
| `extra.staleBox` | siege, constructor camera never refreshed: its 86 numbers, then `_doBoxSelect` × 4 (it must call `camera.updateMatrixWorld(true)` itself) |
| `extra.staleRays` (4) | siege, constructor camera: `_raycastFromCanvas` origin + direction (it must refresh the camera itself) |
| `extra.camOps` (24) | `camOp` records as above: height-only resize (`1280×720 → 1280×640`), `KeyW` / `KeyS` without an editable target, sub-pixel canvases (`1280×0.5`, `0.5×0.25`, `4×0.5`, `0.6×0.9`) with `camDist` 3 for the minimap's `max(1, clientHeight)` |
| `extra.siegeInstanced`, `extra.deployInstanced` (4 + 4) | the first and the LAST instance of every ground-pick `InstancedMesh` (hill bumps, water): camera over the instance origin, one ray at its client pixel; `intersectObjects([mesh], false)` distance, point, `instanceId` |
| `extra.fieldBattleClicks` (32) | deploy scene (field battle): `_onBattleClick` at 8 enemies (body / feet) with 1 and 0 selected units — enemy meshes hit on their own tile |
| `extra.deployClicks` (12) | `_onDeployClick`: enemy tiles without a selection (occupancy of the other side), the sole selected unit clicked again, Ctrl / Shift on group members; logic log, selection, `_deploySelected`, every ring with its `material.color.getHex()` |
| `extra.groundTies` | `pickBattleGroundTileFromMeshes` on 8 horizontal rays whose best score is shared by hits on different tiles (+ 4 without a tie; 1 050 rays scanned over the hill rows) — "first maximum wins" |

| File (part 5) | Content |
|---|---|
| `picking.json` | the vectors above (92 307 B) |
| `gen_picking.ts`, `build_picking.mjs` | generator and bundler (uses `dom_stub.ts`, `three_shim.ts` of part 2) |
| `mutate_picking.py` | mutation run (62 mutants of `src/battle/view.rs` / `src/battle/picking.rs`; runs `--lib battle::` and `--test battle3d_picking`; `RANGE=a:b` batches; `EQUIVALENT` = 1 mutant proven equivalent, printed `EQUIV`) — full run = Operator "pomiary" call: 61/61 killed + 1 equivalent on 1.87.0 |
