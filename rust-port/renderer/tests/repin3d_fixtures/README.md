# REPIN-3D reference vectors (`tests/repin3d_*`)

Topic R-RUSTPORT-REPIN-3D-A-Q1 (document `dyspozycje/rust-port/p4/P4-REPIN-3D.md`): the battle-3D
scene port (`civ_renderer::battle`, MOD-14 parts 1–5 at pin `edb8fb56`) re-pinned to the CURRENT web
(`origin/main`), batch by batch. Each batch has a generator that RUNS the web code and a test file
`tests/repin3d_<batch>.rs`; shared Rust helpers are in `tests/repin3d_common/mod.rs` (verbatim copy of
the reader / comparison / `dumpTree` stream of `tests/battle3d_units.rs`).

## Batch A1: order queue, attack-move, immediate removal of killed units

`a1.json` (618 850 B) — produced by `gen_a1.ts` on `origin/main` @ `c1581619f` (unchanged in scope up to
`60621493a`), three@0.169.0, esbuild@0.24.0, node v22.22.0. Cases (all on
`Object.create(BattleScene.prototype)` with injected state; logic stubbed or observed, decisions dumped):

| key | web method(s) (`origin/main`) | Rust |
|---|---|---|
| `queued` | `_refreshQueuedOrderVisuals` `:11013-11034` | `units::refresh_queued_order_visuals` + `PlayerOrder::AttackMove` |
| `issue` (+ `cancelled`) | `_issueBattleAttackMove` `:18076-18096`, `_cancelAttackMoveSelected` `:18098-18106` | `orders::issue_attack_move`, `orders::cancel_attack_move_selected` |
| `activate` | queue part of `_activateNext` `:5847-5898` | `orders::next_activation`, `orders::consume_on_activation` |
| `kill` | `_startFade` `:9440-9451` (→ `_removeUnitFromScene` `:9423-9438`), `_tickFades` `:8956-8976` | `units::kill_unit` |
| `breach` | `_breachWallTile` `:7553-7667` (no wall group) | `dynamics::breach_wall_tile`, `units::kill_unit`, `dynamics::retreat_from_wall` |

Injected / observed logic (P6.13): `_orderMoveForUnits` (formation destinations — the case lists the
move orders it gives), `_collectOrderUnitIds`, `_executeUnitsImmediate`, `_advanceToNextBattleUnit`,
`_showOrderFeedback`, `_activateUnit` (records, calls back), `_checkEnd`, `_schedule`, `_checkRout`,
`_applyTerrainRange`, `_spawnWallLabel`, SFX. `_updateMoraleBar` calls are logged
(`[id, hx(morale, moraleMax)]`) and replayed by the Rust test with `units::update_morale_bar`.

Only one bundle-time step touches web text: `build_a1.mjs` APPENDS
`export { BF_COLS, BF_ROWS, cellToWorld, tileTopY, makeUnitBars, makeFallbackAvatar, sideColor, HPBAR_Y, DEATH_FADE_MS, moraleBaseFor };`
to `battle/battleScene.ts` in memory. Nothing is written to `gra/**`.

### Regeneration (outside the repository only)

```bash
S=$(mktemp -d)
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive -o $S/web.tar c1581619f gra/src gra/data && tar -xf $S/web.tar -C $S/websrc
cp rust-port/renderer/tests/repin3d_fixtures/{gen_a1.ts,build_a1.mjs} $S/refscript/
cp rust-port/renderer/tests/fixtures/battle3d/{dom_stub.ts,three_shim.ts} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
(cd $S/refscript && node build_a1.mjs && node gen_a1.mjs $S/out)   # repin3d a1 queued=4 issue=6 activate=6 breaches=6
sha256sum $S/out/a1.json   # = MANIFEST.sha256
```

Measured (r1): two directories with separate `npm install` and `git archive` give the same `a1.json`
(`5b8baa9a…`) and `gen_a1.mjs` (2 814 655 B, `8b623934…`; not committed).

### Mutations

`mutate_a1.py` (35 mutants, every control branch of the A1 code; run from `rust-port/renderer`):
`KILLED 35/35` (r1 after the guard test `kill_guard_removed_alone_is_a_no_op`).

## Batch A2: palisade as a wall form, wall towers (R-RUSTPORT-REPIN-3D-A2-Q1)

`a2.json` (1 524 929 B) — produced by `gen_a2.ts` on `origin/main` @ `5fa0c1a84` (`battle/siegeWall.ts`,
`battle/battleScene.ts` unchanged since `c1581619f`), bundled by `build_a1.mjs` UNCHANGED
(`node build_a1.mjs gen_a2`), three@0.169.0, esbuild@0.24.0, node v22.22.0. Test: `tests/repin3d_a2.rs`.

| key | web (`origin/main`) | Rust |
|---|---|---|
| `walls` (36) | `buildSiegeWall(civ, { …, kind })`, 12 civ keys × {absent, `mur`, `palisada`}, game size + `attachRowBreachPanels` (`siegeWall.ts:1188-1215`, `:1232-1260`) | `siege_wall::build_siege_wall_web_id` + `SiegeWallOpts::with_kind` |
| `palisades` (20) | `buildPalisade` sweep: N−1/N/N+1 around the gate, 0 / negative / NaN sizes, the `sx < L/2 − 0.01·T` bound (`len-eps`), the `toFixed(3)` geometry cache (`cacheHits`) (`:993-1093`) | `siege_wall::build_palisade` |
| `towers` (18) | `buildWallTower(material, tileSize, wallHeight)` × {kamien, drewno} × 9 sizes (0, negative, NaN, ∞) (`:1102-1185`) | `siege_towers::build_wall_tower` |
| `place` (27) | `_placeSiegeWall(civ)` → `_placeSiegeTowers` on `Object.create(BattleScene.prototype)` with the REAL `towerMaterialFor` / `towerRows` / `miasto-params.json` (`battleScene.ts:3971-4044`, `:4053-4086`); `towerMaterial` + tower rows = the DTO the Rust test replays | `units::place_siege_wall_fort` + `units::FortDto` |

Test-side additions to `tests/repin3d_common/mod.rs` (A2): `geo_hash` hashes NaN as one canonical `f32`
(like `Fnv.f32` of the generators; identical to `scene::geo_hash` for NaN-free geometry) and `geo_params`
knows the Sumer gate arch (`siege_wall::ArchCylinder`).

### Regeneration (outside the repository only; web copy ≤ 10 MB)

`a2_web_inputs.txt` lists the 167 web files the bundle reads (esbuild `metafile.inputs` of
`node build_a1.mjs gen_a2`, 6.5 MB); extracting only them gives the same bundle and `a2.json`.

```bash
S=$(mktemp -d)
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive -o $S/web.tar 5fa0c1a84 gra/src gra/data
tar -xf $S/web.tar -C $S/websrc -T rust-port/renderer/tests/repin3d_fixtures/a2_web_inputs.txt && rm $S/web.tar
cp rust-port/renderer/tests/repin3d_fixtures/{gen_a2.ts,build_a1.mjs} $S/refscript/
cp rust-port/renderer/tests/fixtures/battle3d/{dom_stub.ts,three_shim.ts} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
(cd $S/refscript && node build_a1.mjs gen_a2 && node gen_a2.mjs $S/out)   # repin3d a2 walls=36 palisades=20 towers=18 place=27
sha256sum $S/out/a2.json   # = MANIFEST.sha256
```

Measured (r1): the full copy (66 MB) and the 167-file copy (6.5 MB), separate `npm install` and
`git archive`: `a2.json` `66549532…` and `gen_a2.mjs` `4d639b27…` (not committed) identical in both.

### Mutations

`mutate_a2.py` (49 mutants, every control branch of the A2 code; `RANGE=a:b` splits the run):
`KILLED 49/49` (r1, after the case `len-eps` was added for the loop-bound mutant).

## Batch A3: tower break, tower volley / shot, wall and palisade breach (R-RUSTPORT-REPIN-3D-A3-Q1)

`a3.json` (694 668 B) — produced by `gen_a3.ts` on `origin/main` @ `86d510c66` (`battle/`, `game/siege*.ts`,
`game/city-towers.ts`, `game/city-fortification.ts` unchanged since `5fa0c1a84`), bundled by `build_a1.mjs`
UNCHANGED (`node build_a1.mjs gen_a3`), three@0.169.0, esbuild@0.24.0, node v22.22.0. Test: `tests/repin3d_a3.rs`.
Every case starts from the REAL `_carveWallTiles` + `_placeSiegeWall` (+ `_placeSiegeTowers`) on
`Object.create(BattleScene.prototype)`; the Rust test replays the same with `carve_wall_tiles` +
`place_siege_wall_fort` and the DTO the web computed.

| key | web (`origin/main` `battle/battleScene.ts`) | Rust |
|---|---|---|
| `breach` (4 × 9 steps) | `_breachWallTile(row)` `:7553-7610` (+ `_destroyTowerAtRow` `:4089-4095` from `:7563`): first tower row twice, plain row, `rLo` / `rHi`, gate row, last tower row, `rHi + 1`, `−1`; fortKind {mur, palisada × 2, none} | `dynamics::breach_wall_tile_fort`, `siege_towers::destroy_tower_at_row` |
| `gate` (6) | `_breachGate()` `:7672-7718` on the wall and the palisade, one gate tile already open, `siegeGateCol < 0` | `dynamics::breach_gate` (unchanged) |
| `fire` (13) | `_fireSiegeTowers()` `:4103-4116` → `_fireOneTower` `:4118-4162` → `_tickProjectiles` `:8938-8954`; real shooter rows of eras 1–3 + synthetic rows (sling / javelin / pilum / no name / no type), a tower broken before the volley, a tower whose tile is gone (`wallTileHp`), a tower broken between scheduling and firing, `finished` before / during the volley, no shooter, no tower, no enemy | `siege_towers::fire_siege_towers`, `fire_one_tower`, `tower_projectile_kind`, `dynamics::tick_projectiles` |

Logic replayed as DTO (P6.13): `pickTowerTarget` (computed by the generator with the arguments of `:4124-4128`
for EVERY scheduled shot, also when the guard stops it — so the Rust guard is tested), `wallTileHp`,
`towerShooterRow` (`Typ`, `Jednostka`). `_spawnWallLabel`, `_checkRout`, `_updateMoraleBar`, SFX are stubbed.

### Regeneration (outside the repository only; web copy ≤ 10 MB)

```bash
S=$(mktemp -d)
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive -o $S/web.tar 86d510c66 gra/src gra/data
tar -xf $S/web.tar -C $S/websrc -T rust-port/renderer/tests/repin3d_fixtures/a3_web_inputs.txt && rm $S/web.tar
cp rust-port/renderer/tests/repin3d_fixtures/{gen_a3.ts,build_a1.mjs} $S/refscript/
cp rust-port/renderer/tests/fixtures/battle3d/{dom_stub.ts,three_shim.ts} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
(cd $S/refscript && node build_a1.mjs gen_a3 && node gen_a3.mjs $S/out)   # repin3d a3 breach=4 gate=6 fire=13
sha256sum $S/out/a3.json   # = MANIFEST.sha256
```

Measured (r1): the full copy (66 MB) and the 166-file copy (6.3 MB), separate `npm install` and `git archive`:
`a3.json` `452f127e…` and `gen_a3.mjs` `3afa8d31…` (not committed) identical in both.

### Mutations

`mutate_a3.py` (30 mutants, every control branch of the A3 code; `RANGE=a:b` splits the run): `KILLED 30/30`
(r1, after the generator records the `pickTowerTarget` DTO also for shots the guard stops — the first run left
`shot ignores finished` / `shot ignores destroyed` alive because a stopped shot had no target in the vectors).

## Batch A4: constructor with `fortKind`, Militia, siege towers; part-3 vectors on `origin/main` (R-RUSTPORT-REPIN-3D-A4-Q1)

`a4.json` (473 845 B) — produced by `gen_a4.ts` on `origin/main` @ `86d510c66`, bundled by
`tests/fixtures/battle3d/build_units.mjs` UNCHANGED (`node build_units.mjs gen_a4`; part-3 bundler), three@0.169.0,
esbuild@0.24.0, node v22.22.0. Test: `tests/battle3d_units.rs::fort_militia_siege_tower_constructor_matches_web`
(the records are the part-3 `ctor` records, read by the same code; `gen_a4.ts` copies the part-3 hashing /
records / instrumentation VERBATIM and adds the `fort` record).

| group | n | what (web `origin/main`) | Rust |
|---|---|---|---|
| `fort-*` | 10 | `new BattleScene(opts)` with `siege.builtBuildingIds` = `[]`, `['palisada']`, `['mury']`, `['fort']`, `['palisada','mury']`, `['koszary','Palisada']` (case-sensitive → `none`); civs `rzym` / `egipt` (defCiv) / `zulu` / `chiny` / `grecja`; deploy `def` + `resetDef`, deploy `atk` + `resetAtk`, `climb` on the palisade. `fortKind` asserted = `cityFortificationKind(builtBuildingIds)` (`battleScene.ts:2678`) | `units::build_battle_scene_with_units_fort` + `FortDto { kind, tower_material, tower_rows }` (DTO = what the web computed) |
| `militia-*` | 6 | defenders from `buildMilitiaSquad(pop, era)` (`game/siegeDefenders.ts:261`) turned into a `BattleUnit` as `main.ts:30344` `runtimeToBattleUnit` does (`kategoria 'domyslny'` = `collectCityDefRoster` `:320`, `nazwa = typeId`, `stats = def`); eras 1/2/3, headcounts 0 / 3 / 4 / 5 / 6 / 7 (odd → one extra melee), alone or with the garrison, field and siege (palisada, mur: wall-crown placement) | spawn DTO only (`UnitSpawn`) |
| `towers-*` | 3 | 6 × `Wieża oblężnicza` with category keys `wlocznik` … `konnica` added to the attackers; field, siege + palisada, siege + mur | spawn DTO only |

`fort` record: `kind`, `material` (`towerMaterialFor`), `towers[]` (`row`, root index, part-3 `modelRecord`,
position bits) of `this.siegeTowers` after `_placeSiegeTowers` (`:4053-4086`).

### Regeneration (outside the repository only; web copy ≤ 10 MB)

```bash
S=$(mktemp -d)
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive -o $S/web.tar 86d510c66 gra/src gra/data
tar -xf $S/web.tar -C $S/websrc -T rust-port/renderer/tests/repin3d_fixtures/a4_web_inputs.txt && rm $S/web.tar
cp rust-port/renderer/tests/repin3d_fixtures/gen_a4.ts $S/refscript/
cp rust-port/renderer/tests/fixtures/battle3d/{gen_units.ts,build_units.mjs,dom_stub.ts,three_shim.ts} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
(cd $S/refscript && node build_units.mjs gen_a4 && node gen_a4.mjs $S/out)   # repin3d a4 ctor=19 units=1324 militia=25 siegeTowerUnits=44 wallTowers=468
(cd $S/refscript && node build_units.mjs && node gen_units.mjs $S/out)       # part 3: units.json (tests/fixtures/battle3d)
sha256sum $S/out/a4.json $S/out/units.json   # = MANIFEST.sha256 / tests/fixtures/battle3d/MANIFEST.sha256
```

`a4_web_inputs.txt` = the esbuild `metafile` inputs of `gen_units` + `gen_a4` (167 files, 6 317 283 B; = the A3 list
+ `battle/testBattle.ts`; `?raw` suffixes stripped). Measured (r1): full copies A and B (66 MB, separate `npm install`
and `git archive`) and the 167-file copy C: `a4.json` `75c00498…` and `units.json` `4242bc10…` identical in all three;
`gen_a4.mjs` `772d9f78…` (not committed) identical in A and B (C differs only in path comments: its `node_modules`
links to B's).

### Mutations

`mutate_a4.py` (15 mutants; `RANGE=a:b` splits the run; runs `--test battle3d_units`): 10 on every control branch of
the A4 path (`build_battle_scene_with_units` → `_fort` → `place_siege_wall_fort` → `place_siege_towers`) + 5 EVIDENCE
mutants of the name routing in `src/models/unit_core/routing.rs` (siege tower, Militia types; edited transiently,
restored): `KILLED 15/15` (r1).
