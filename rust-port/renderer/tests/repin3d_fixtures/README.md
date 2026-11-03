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
