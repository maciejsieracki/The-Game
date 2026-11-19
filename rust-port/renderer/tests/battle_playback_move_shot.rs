//! P4-1I5a (`R-RUSTPORT-P4-1I5A-BATTLE-ACTIONS-MOVE-SHOT`, #370; D-WIR-6/7/8): the renderer consumer of the step
//! `Move` and the unit shot `Shot` ([`BattleActionDto`]) against the scene the pin's direct scene calls give.
//!
//! As in `tests/battle_playback.rs`, two scenes are built from the constructor record of
//! `tests/fixtures/battle3d/dynamics.json` (web scene of part 4, `build_battle_scene_with_units`):
//! - **P** (pin calls): the scene functions called directly in the order of the pin `07d2fbd72`
//!   (`gra/src/battle/battleScene.ts`), as `tests/battle3d_dynamics.rs` does for the fixture events `move`
//!   (`_doMove` `:8714-8776`) and `shots` (`_doRangedAttack` `:9179-9221`);
//! - **Q** (playback): the same events as [`BattleActionDto`]s in the order the engine emits them
//!   (`engine/src/domain/siege_tactics_loop.rs`: `move_step_core` = `Facing` then `Move` with the same `t0`;
//!   `begin_shot` = `Facing` then `Shot`), played by [`BattlePlayback`].
//!
//! The whole `BattleScene3` of P and Q must be equal at every sampled time, and the sampled positions must equal the
//! web vectors of the fixture (bit for bit). Unit ids: `atkN` → `N`, `defN` → `1000 + N` (as in `battle_playback.rs`).

#![allow(clippy::float_cmp)]

use std::path::PathBuf;

use civ_renderer::battle::dynamics::{
    launch_projectile, projectile_kind, ranged_shot_endpoints, set_facing, tick_projectiles,
    MoveAnim, Projectile, ProjectileKind, MOVE_STEP_MS, RANGED_FLY_MS,
};
use civ_renderer::battle::field::{BattleSceneOpts, TerrainGrid, BF_COLS, BF_ROWS};
use civ_renderer::battle::playback::{BattlePlayback, PlaybackError, PlaybackOpts, SceneCall};
use civ_renderer::battle::units::{
    build_battle_scene_with_units, siege_wall_civ, update_ammo_bar, update_morale_bar,
    BattleScene3, BattleSide, BattleUnitsOpts, PlacedUnit, UnitSpawn,
};
use civ_view_model::battle::{
    BattleActionDto, BattleActionKindDto, BattleFrameDto, BattleFrameUnitDto, BattleFrameWallDto,
};
use civ_view_model::ids::UnitId;
use serde_json::Value;

// ------------------------------------------------------------ fixture (as in battle_playback.rs)

fn load() -> Value {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/battle3d/dynamics.json");
    let s = std::fs::read_to_string(&p).expect("dynamics.json");
    serde_json::from_str(&s).expect("json")
}

fn hx(s: &str) -> Vec<f64> {
    assert_eq!(s.len() % 16, 0);
    (0..s.len() / 16)
        .map(|i| f64::from_bits(u64::from_str_radix(&s[i * 16..i * 16 + 16], 16).expect("hex")))
        .collect()
}

fn num(v: &Value) -> f64 {
    match v {
        Value::String(s) => hx(s)[0],
        other => other.as_f64().expect("number"),
    }
}

fn i32_of(v: &Value) -> i32 {
    i32::try_from(v.as_i64().expect("int")).expect("i32")
}

fn num_id(web: &str) -> u64 {
    if let Some(n) = web.strip_prefix("atk") {
        n.parse::<u64>().expect("atk id")
    } else {
        1000 + web
            .strip_prefix("def")
            .expect("def id")
            .parse::<u64>()
            .expect("def n")
    }
}

fn uid(web: &str) -> UnitId {
    UnitId::try_new(num_id(web)).expect("unit id")
}

fn spawn_of(row: &Value) -> UnitSpawn {
    let a = row.as_array().expect("spawn row");
    let v: Vec<f64> = a[9].as_array().expect("vals").iter().map(num).collect();
    UnitSpawn {
        id: num_id(a[0].as_str().expect("id")).to_string(),
        side: match a[1].as_str().expect("side") {
            "atk" => BattleSide::Atk,
            _ => BattleSide::Def,
        },
        col: i32_of(&a[2]),
        row: i32_of(&a[3]),
        facing: i32_of(&a[4]),
        on_wall_walkway: a[5].as_i64() == Some(1),
        category: a[6].as_str().expect("cat").to_owned(),
        model_name: a[7].as_str().expect("model").to_owned(),
        owner_color: u32::try_from(a[8].as_u64().expect("color")).expect("u32"),
        hp: v[0],
        max_hp: v[1],
        morale: v[2],
        morale_max: v[3],
        ammo_left: v[4],
        ammo_max: v[5],
    }
}

fn grid_of(rle: &Value) -> TerrainGrid {
    let mut tiles = Vec::new();
    for pair in rle.as_array().expect("rle").chunks(2) {
        let k = u8::try_from(pair[0].as_u64().expect("k")).expect("u8");
        let n = usize::try_from(pair[1].as_u64().expect("n")).expect("usize");
        tiles.extend(std::iter::repeat_n(k, n));
    }
    TerrainGrid::new(BF_COLS, BF_ROWS, tiles)
}

fn opts_of(rec: &Value) -> BattleUnitsOpts {
    assert!(rec["deploy"].is_null());
    let siege = &rec["siege"];
    BattleUnitsOpts {
        field: BattleSceneOpts {
            grid: grid_of(&rec["tilesRle"]),
            desert_palette: rec["desert"].as_bool().expect("desert"),
            siege: !siege.is_null(),
            deploy: None,
        },
        siege_civ: siege_wall_civ(siege["civ"].as_str(), None).to_owned(),
        player_side: BattleSide::Atk,
        units: rec["spawn"]
            .as_array()
            .expect("spawn")
            .iter()
            .map(spawn_of)
            .collect(),
    }
}

fn unit(b: &BattleScene3, id: UnitId) -> &PlacedUnit {
    let s = id.to_string();
    b.atk
        .iter()
        .chain(b.def.iter())
        .find(|u| u.spawn.id == s)
        .expect("unit")
}

fn unit_mut(b: &mut BattleScene3, id: UnitId) -> &mut PlacedUnit {
    let s = id.to_string();
    b.atk
        .iter_mut()
        .chain(b.def.iter_mut())
        .find(|u| u.spawn.id == s)
        .expect("unit")
}

/// `posOf(ru)` of `gen_dynamics.ts`: group position, then bar position.
fn pos_of(b: &BattleScene3, id: UnitId) -> Vec<f64> {
    let u = unit(b, id);
    let s = &b.field.field.scene;
    let (g, p) = (s.nodes[u.group].position, s.nodes[u.bars.group].position);
    vec![g.x, g.y, g.z, p.x, p.y, p.z]
}

fn act(t0: f64, action: BattleActionKindDto) -> BattleActionDto {
    BattleActionDto { t0, action }
}

fn assert_bits(ctx: &str, got: &[f64], want: &[f64]) {
    assert_eq!(got.len(), want.len(), "{ctx}: length");
    for (i, (a, w)) in got.iter().zip(want).enumerate() {
        assert_eq!(a.to_bits(), w.to_bits(), "{ctx}[{i}]: {a} != web {w}");
    }
}

fn base() -> (Vec<Value>, BattleScene3) {
    let d = load();
    let events = d["events"].as_array().expect("events").clone();
    let mut b = build_battle_scene_with_units(opts_of(&d["siege"]));
    // `tilesNow` (README of the fixture, part 4): the grid after a few tiles next to the walking units were turned into
    // hills / river / ford before the events, so only the `tileTopY` reads change; the web vectors of `move` / `shots`
    // are taken on it (`battle3d_dynamics.rs` `World::grid`). The scene keeps its meshes; both P and Q read this grid.
    b.field.grid = grid_of(&d["tilesNow"]);
    (events, b)
}

/// The engine pair of one step (`move_step_core`): `Facing` (`_updateFacing`, `:8750`) then `Move` with the same `t0`
/// (`const t0 = this._now()`, `:8752`), `arriveAt = t0 + MOVE_STEP_MS`.
fn step_actions(id: UnitId, from: (i32, i32), e: &Value) -> Vec<BattleActionDto> {
    let t0 = num(&e["t0"]);
    vec![
        act(
            t0,
            BattleActionKindDto::Facing {
                id,
                dir: i32_of(&e["facing"]),
            },
        ),
        act(
            t0,
            BattleActionKindDto::Move {
                id,
                from_col: from.0,
                from_row: from.1,
                to_col: i32_of(&e["col"]),
                to_row: i32_of(&e["row"]),
                arrive_at: t0 + MOVE_STEP_MS,
            },
        ),
    ]
}

// ------------------------------------------------------------ tests

/// The six walking steps of the fixture (`gen_dynamics.ts` part 1, `_doMove` `:8714-8776`): at every sample the played
/// scene equals the pin-call scene (whole `BattleScene3`), the unit position equals the web vector bit for bit and the
/// walk ends at the sample the web ended it (`p >= 1`, `done()`).
#[test]
fn move_playback_equals_pin_calls_and_web_vectors() {
    let (events, mut p) = base();
    let mut q = p.clone();
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let moves: Vec<&Value> = events.iter().filter(|e| e["op"] == "move").collect();
    assert_eq!(moves.len(), 6);
    let mut n_samples = 0;
    for (k, e) in moves.iter().enumerate() {
        let id = uid(e["id"].as_str().expect("id"));
        let from = {
            let u = unit(&q, id);
            (u.col, u.row)
        };
        pb.push_actions(&step_actions(id, from, e))
            .expect("push step");
        // P: the pin calls (`battle3d_dynamics.rs` "move").
        let grid = p.field.grid.clone();
        let t0 = num(&e["t0"]);
        let anim = MoveAnim::start(
            &grid,
            unit_mut(&mut p, id),
            i32_of(&e["col"]),
            i32_of(&e["row"]),
            t0,
        );
        let up = unit(&p, id).clone();
        set_facing(&mut p.field.field.scene, &up, i32_of(&e["facing"]));
        let mut done = false;
        for s in e["samples"].as_array().expect("samples") {
            let t = num(&s[0]);
            pb.play_until(&mut q, t, 0.0).expect("play");
            if !done {
                done = anim.step(&mut p.field.field.scene, &up, t);
            }
            assert!(p == q, "step {k} t={t}: playback scene != pin-call scene");
            assert_bits(
                &format!("step {k} t={t}"),
                &pos_of(&q, id),
                &hx(s[1].as_str().expect("pos")),
            );
            let web_done = s[2].as_i64() == Some(1);
            assert_eq!(done, web_done, "step {k} t={t} pin done");
            assert_eq!(pb.moves_in_flight() == 0, web_done, "step {k} t={t} done");
            n_samples += 1;
        }
        let u = unit(&q, id);
        assert_eq!((u.col, u.row), (i32_of(&e["col"]), i32_of(&e["row"])));
        assert_eq!(pb.queued(), 0);
    }
    assert!(n_samples >= 20, "samples {n_samples}");
    // Trace: every step = turn, then the walk (`_updateFacing` before `t0`, `:8750-8752`).
    let trace: Vec<&SceneCall> = pb.calls().iter().collect();
    assert_eq!(trace.len(), 12);
    for pair in trace.chunks(2) {
        match (pair[0], pair[1]) {
            (SceneCall::SetFacing { id: a, .. }, SceneCall::MoveStart { id: b, t0, .. }) => {
                assert_eq!(a, b);
                assert!(t0.is_finite());
            }
            other => panic!("order {other:?}"),
        }
    }
}

/// The four unit shots of the fixture (`gen_dynamics.ts` part 3, `_doRangedAttack` `:9179-9221`; kinds arrow, sling,
/// javelin, pilum from the shooter's category, `projectileKind` `:1661-1671`): the playback launches the projectile of
/// the shooter's kind from the shooter's torso to the target's, and every tick equals the pin calls (whole scene) and the
/// web flight positions bit for bit, including the detach at landing (`_tickProjectiles` `:8584-8600`).
#[test]
fn shot_playback_equals_pin_calls_and_web_vectors() {
    let (events, mut p) = base();
    // Positions after the walking steps (the fixture order); the same pin calls on both scenes.
    for e in events.iter().filter(|e| e["op"] == "move") {
        let id = uid(e["id"].as_str().expect("id"));
        let grid = p.field.grid.clone();
        let anim = MoveAnim::start(
            &grid,
            unit_mut(&mut p, id),
            i32_of(&e["col"]),
            i32_of(&e["row"]),
            num(&e["t0"]),
        );
        let u = unit(&p, id).clone();
        set_facing(&mut p.field.field.scene, &u, i32_of(&e["facing"]));
        assert!(anim.step(&mut p.field.field.scene, &u, f64::MAX));
    }
    let ev = events
        .iter()
        .find(|e| e["op"] == "shots")
        .expect("shots event");
    let shots = ev["shots"].as_array().expect("shots");
    assert_eq!(shots.len(), 4);
    // The fixture overrides the category of three shooters (sling, javelin, pilum); the scene record is the input of
    // `projectileKind(bu)`, so the override goes into both scenes before the playback is built.
    for s in shots {
        if let Some(cat) = s["cat"].as_str() {
            unit_mut(&mut p, uid(s["id"].as_str().expect("id")))
                .spawn
                .category = cat.to_owned();
        }
    }
    let mut q = p.clone();
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    // P: launch all four (`battle3d_dynamics.rs` "shots"); Q: the same calls through the playback, in the engine order
    // `Facing` → (ammo frame) → `Shot`. Applied directly (as the web launches them before the first tick).
    let mut list: Vec<Projectile> = Vec::new();
    let mut flights = Vec::new();
    let mut kinds = Vec::new();
    for s in shots {
        let id = uid(s["id"].as_str().expect("id"));
        let target = uid(s["target"].as_str().expect("target"));
        let t0 = num(&s["t0"]);
        let facing = i32_of(&s["facing"]);
        let ammo = num(&s["ammo"]);
        // P.
        let u = unit(&p, id).clone();
        let ut = unit(&p, target).clone();
        let kind = projectile_kind(&u.spawn.category, &u.spawn.model_name);
        assert_eq!(kind.web_name(), s["kind"].as_str().expect("kind"));
        set_facing(&mut p.field.field.scene, &u, facing);
        update_morale_bar(
            &mut p.field.field.scene,
            &u.bars,
            u.spawn.morale,
            u.spawn.morale_max,
        );
        update_ammo_bar(
            &mut p.field.field.scene,
            &u.bars,
            u.ammo_bar_shown,
            ammo,
            u.spawn.ammo_max,
        );
        let (from, to) = ranged_shot_endpoints(&p.field.grid, (u.col, u.row), (ut.col, ut.row));
        let pr = launch_projectile(&mut p.field.field.scene, kind, from, to, t0);
        flights.push(pr.node);
        list.push(pr);
        kinds.push(kind);
        // Q.
        pb.apply_action(
            &mut q,
            &act(t0, BattleActionKindDto::Facing { id, dir: facing }),
            0.0,
        )
        .expect("facing");
        let fu = BattleFrameUnitDto {
            id,
            col: u.col,
            row: u.row,
            facing,
            hp: u.spawn.hp,
            morale: u.spawn.morale,
            ammo_left: Some(ammo),
            routed: false,
            dead: false,
            removed: false,
            on_wall_walkway: u.on_wall_walkway,
        };
        pb.apply_frame(&mut q, &frame(t0, vec![fu])).expect("frame");
        pb.apply_action(
            &mut q,
            &act(
                t0,
                BattleActionKindDto::Shot {
                    attacker: id,
                    target,
                    land_at: t0 + RANGED_FLY_MS,
                },
            ),
            0.0,
        )
        .expect("shot");
        assert!(p == q, "shot {id}: playback scene != pin-call scene");
    }
    let launched: Vec<(UnitId, ProjectileKind)> = pb
        .calls()
        .iter()
        .filter_map(|c| match c {
            SceneCall::UnitProjectile { attacker, kind, .. } => Some((*attacker, *kind)),
            _ => None,
        })
        .collect();
    assert_eq!(
        launched,
        shots
            .iter()
            .map(|s| uid(s["id"].as_str().expect("id")))
            .zip(kinds.iter().copied())
            .collect::<Vec<_>>()
    );
    assert_eq!(
        pb.projectiles().iter().map(|x| x.node).collect::<Vec<_>>(),
        flights
    );
    // Ticks: `_tickProjectiles(t)` on P, `play_until(t)` (empty queue: one animation frame) on Q.
    let ticks = ev["ticks"].as_array().expect("ticks");
    assert!(ticks.len() >= 8);
    for t in ticks {
        let a = t.as_array().expect("tick");
        let tt = num(&a[0]);
        tick_projectiles(&mut p.field.field.scene, &mut list, tt);
        pb.play_until(&mut q, tt, 0.0).expect("tick");
        assert!(p == q, "t={tt}: playback scene != pin-call scene");
        for (i, (f, wv)) in flights
            .iter()
            .zip(a[1].as_array().expect("pos"))
            .enumerate()
        {
            let active = pb.projectiles().iter().any(|x| x.node == *f);
            if wv.is_null() {
                assert!(!active, "flight {i} t={tt} landed");
                assert_eq!(
                    q.field.field.scene.nodes[*f].parent, None,
                    "flight {i} detached"
                );
            } else {
                assert!(active, "flight {i} t={tt} in flight");
                let v = q.field.field.scene.nodes[*f].position;
                assert_bits(
                    &format!("flight {i} t={tt}"),
                    &[v.x, v.y, v.z],
                    &hx(wv.as_str().expect("hex")),
                );
            }
        }
        assert_eq!(
            pb.projectiles().len(),
            usize::try_from(a[2].as_u64().expect("n")).expect("n"),
            "t={tt} in flight"
        );
    }
    assert!(pb.projectiles().is_empty());
}

fn frame(v_now: f64, units: Vec<BattleFrameUnitDto>) -> BattleFrameDto {
    BattleFrameDto {
        v_now,
        round_no: 1,
        units,
        wall: BattleFrameWallDto {
            tile_hp: vec![],
            gate_hp: 0.0,
            gate_open: false,
            ever_breached: false,
            towers_destroyed: vec![],
        },
        finished: false,
    }
}

/// The shot through the queue (`push_actions` + `play_until`) launches at `t0` and lands at `landAt`: the projectile is
/// in flight on `[t0, landAt)` and detached at `landAt` (`prog >= 1`, `:8590`), the moment of the `Damage` label
/// (`_schedule(RANGED_FLY_MS, …)` → `_spawnDamageLabel`, `:9224-9227`).
#[test]
fn shot_through_queue_lands_at_land_at() {
    let (_, mut q) = base();
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let (a, d) = (uid("def0"), uid("atk2"));
    let t0 = 30_000.0;
    pb.push_actions(&[
        act(t0, BattleActionKindDto::Facing { id: a, dir: 3 }),
        act(
            t0,
            BattleActionKindDto::Shot {
                attacker: a,
                target: d,
                land_at: t0 + RANGED_FLY_MS,
            },
        ),
        act(
            t0 + RANGED_FLY_MS,
            BattleActionKindDto::Damage {
                target: d,
                dmg: 4.0,
            },
        ),
    ])
    .expect("push");
    pb.play_until(&mut q, t0 - 1.0, 0.0).expect("before");
    assert!(pb.projectiles().is_empty());
    pb.play_until(&mut q, t0, 0.0).expect("launch");
    assert_eq!(pb.projectiles().len(), 1);
    let node = pb.projectiles()[0].node;
    pb.play_until(&mut q, t0 + RANGED_FLY_MS - 0.5, 0.0)
        .expect("flight");
    assert_eq!(pb.projectiles().len(), 1);
    assert!(pb.labels().is_empty());
    pb.play_until(&mut q, t0 + RANGED_FLY_MS, 0.0)
        .expect("land");
    assert!(pb.projectiles().is_empty());
    assert_eq!(q.field.field.scene.nodes[node].parent, None);
    assert_eq!(pb.labels().len(), 1);
    assert_eq!(pb.labels()[0].target, d);
    // `projectileKind` of the spawn record of `def0` (no category override): the web `kind` of the fixture shot 0.
    assert!(matches!(
        pb.calls()[1],
        SceneCall::UnitProjectile {
            kind: ProjectileKind::Arrow,
            ..
        }
    ));
}

/// Errors of the new variants: `arriveAt` / `landAt` other than the pin constants, a step whose `from` is not the
/// unit's cell (a stale chain), unknown units. The failing item is dropped, nothing reaches the scene, the queue goes on.
#[test]
fn move_and_shot_errors_are_reported() {
    let (_, mut q) = base();
    let before = q.clone();
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let id = uid("atk0");
    let (c, r) = {
        let u = unit(&q, id);
        (u.col, u.row)
    };
    let mv = |t0: f64, from: (i32, i32), to: (i32, i32), arrive_at: f64| {
        act(
            t0,
            BattleActionKindDto::Move {
                id,
                from_col: from.0,
                from_row: from.1,
                to_col: to.0,
                to_row: to.1,
                arrive_at,
            },
        )
    };
    // `arriveAt` != t0 + MOVE_STEP_MS.
    pb.push_actions(&[mv(1.0, (c, r), (c + 1, r), 1.0 + MOVE_STEP_MS - 1.0)])
        .expect("push");
    assert_eq!(
        pb.play_until(&mut q, 1.0, 0.0),
        Err(PlaybackError::ArriveAt {
            t0: 1.0,
            arrive_at: 1.0 + MOVE_STEP_MS - 1.0
        })
    );
    // `arriveAt` later than t0 + MOVE_STEP_MS (exact equality, D-WIR-6: both sides).
    pb.push_actions(&[mv(1.5, (c, r), (c + 1, r), 1.5 + MOVE_STEP_MS + 1.0)])
        .expect("push");
    assert_eq!(
        pb.play_until(&mut q, 1.5, 0.0),
        Err(PlaybackError::ArriveAt {
            t0: 1.5,
            arrive_at: 1.5 + MOVE_STEP_MS + 1.0
        })
    );
    // `from` differs from the unit's cell only by the row (same column).
    pb.push_actions(&[mv(1.75, (c, r + 1), (c + 1, r + 1), 1.75 + MOVE_STEP_MS)])
        .expect("push");
    assert_eq!(
        pb.play_until(&mut q, 1.75, 0.0),
        Err(PlaybackError::MoveFrom {
            id,
            expected: (c, r + 1),
            actual: (c, r)
        })
    );
    // `from` != the unit's cell (from and to swapped).
    pb.push_actions(&[mv(2.0, (c + 1, r), (c, r), 2.0 + MOVE_STEP_MS)])
        .expect("push");
    assert_eq!(
        pb.play_until(&mut q, 2.0, 0.0),
        Err(PlaybackError::MoveFrom {
            id,
            expected: (c + 1, r),
            actual: (c, r)
        })
    );
    // Unknown unit.
    let ghost = UnitId::try_new(999_999).expect("id");
    pb.push_actions(&[act(
        3.0,
        BattleActionKindDto::Move {
            id: ghost,
            from_col: 0,
            from_row: 0,
            to_col: 1,
            to_row: 0,
            arrive_at: 3.0 + MOVE_STEP_MS,
        },
    )])
    .expect("push");
    assert_eq!(
        pb.play_until(&mut q, 3.0, 0.0),
        Err(PlaybackError::UnknownUnit(ghost))
    );
    // `landAt` != t0 + RANGED_FLY_MS.
    let shot = |t0: f64, attacker: UnitId, target: UnitId, land_at: f64| {
        act(
            t0,
            BattleActionKindDto::Shot {
                attacker,
                target,
                land_at,
            },
        )
    };
    pb.push_actions(&[shot(4.0, uid("def0"), id, 4.0 + BLOW_LIKE_WRONG)])
        .expect("push");
    assert_eq!(
        pb.play_until(&mut q, 4.0, 0.0),
        Err(PlaybackError::ShotLandAt {
            t0: 4.0,
            land_at: 4.0 + BLOW_LIKE_WRONG
        })
    );
    // `landAt` later than t0 + RANGED_FLY_MS (exact equality, D-WIR-7: both sides).
    pb.push_actions(&[shot(4.5, uid("def0"), id, 4.5 + RANGED_FLY_MS + 1.0)])
        .expect("push");
    assert_eq!(
        pb.play_until(&mut q, 4.5, 0.0),
        Err(PlaybackError::ShotLandAt {
            t0: 4.5,
            land_at: 4.5 + RANGED_FLY_MS + 1.0
        })
    );
    pb.push_actions(&[shot(5.0, ghost, id, 5.0 + RANGED_FLY_MS)])
        .expect("push");
    assert_eq!(
        pb.play_until(&mut q, 5.0, 0.0),
        Err(PlaybackError::UnknownUnit(ghost))
    );
    pb.push_actions(&[shot(6.0, uid("def0"), ghost, 6.0 + RANGED_FLY_MS)])
        .expect("push");
    assert_eq!(
        pb.play_until(&mut q, 6.0, 0.0),
        Err(PlaybackError::UnknownUnit(ghost))
    );
    assert!(before == q, "a rejected item changed the scene");
    assert!(pb.calls().is_empty());
    assert!(pb.projectiles().is_empty());
    assert_eq!(pb.moves_in_flight(), 0);
    // The queue goes on: a correct chain of two steps (the second starts where the first ended).
    pb.push_actions(&[
        mv(10.0, (c, r), (c + 1, r), 10.0 + MOVE_STEP_MS),
        mv(400.0, (c + 1, r), (c + 1, r + 1), 400.0 + MOVE_STEP_MS),
    ])
    .expect("push");
    pb.play_until(&mut q, 10.0 + MOVE_STEP_MS, 0.0)
        .expect("step 1");
    assert_eq!(pb.moves_in_flight(), 0);
    pb.play_until(&mut q, 400.0, 0.0).expect("step 2");
    assert_eq!(pb.moves_in_flight(), 1);
    let u = unit(&q, id);
    assert_eq!((u.col, u.row), (c + 1, r + 1));
    // A stale `from` (the start of the chain again) after the chain is rejected.
    pb.push_actions(&[mv(900.0, (c, r), (c + 2, r), 900.0 + MOVE_STEP_MS)])
        .expect("push");
    assert_eq!(
        pb.play_until(&mut q, 900.0, 0.0),
        Err(PlaybackError::MoveFrom {
            id,
            expected: (c, r),
            actual: (c + 1, r + 1)
        })
    );
    // Display names the variant.
    assert_eq!(
        PlaybackError::ShotLandAt {
            t0: 1.0,
            land_at: 2.0
        }
        .to_string(),
        "unit shot at 1 lands at 2"
    );
    assert_eq!(
        PlaybackError::ArriveAt {
            t0: 1.0,
            arrive_at: 2.0
        }
        .to_string(),
        "step at 1 arrives at 2"
    );
}

/// A wrong landing moment that would pass with the melee constant (`BLOW_HIT_T`) or zero.
const BLOW_LIKE_WRONG: f64 = 150.0;

/// Two steps of one unit inside one coarse frame (both `t0 <= now`): the second walk replaces the first (the pin chains
/// the steps through `done()`), and the scene equals the pin calls of the two steps with the frame at `now`.
#[test]
fn two_steps_in_one_frame_follow_the_logical_cell() {
    let (_, mut p) = base();
    let mut q = p.clone();
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let id = uid("atk1");
    let (c, r) = {
        let u = unit(&q, id);
        (u.col, u.row)
    };
    pb.push_actions(&[
        act(
            0.0,
            BattleActionKindDto::Move {
                id,
                from_col: c,
                from_row: r,
                to_col: c,
                to_row: r + 1,
                arrive_at: MOVE_STEP_MS,
            },
        ),
        act(
            100.0,
            BattleActionKindDto::Move {
                id,
                from_col: c,
                from_row: r + 1,
                to_col: c - 1,
                to_row: r + 1,
                arrive_at: 100.0 + MOVE_STEP_MS,
            },
        ),
    ])
    .expect("push");
    pb.play_until(&mut q, 150.0, 0.0).expect("play");
    // P: both starts, then the frame of the second walk at 150 (the first one's last pose is overwritten).
    let grid = p.field.grid.clone();
    let _first = MoveAnim::start(&grid, unit_mut(&mut p, id), c, r + 1, 0.0);
    let second = MoveAnim::start(&grid, unit_mut(&mut p, id), c - 1, r + 1, 100.0);
    let u = unit(&p, id).clone();
    assert!(!second.step(&mut p.field.field.scene, &u, 150.0));
    assert!(p == q);
    assert_eq!(pb.moves_in_flight(), 1);
}

/// The engine pair `Facing` + `Move` with a turn that really changes the direction (`_updateFacing` only writes
/// `rotation.y` when the direction changes, `:8338-8340`): the played scene equals the pin calls `set_facing` +
/// `MoveAnim::start`, and the unit's yaw differs from the scene before the step (the fixture steps keep facing 1).
#[test]
fn facing_turn_before_step_matches_pin_calls() {
    let (_, mut p) = base();
    let before = p.clone();
    let mut q = p.clone();
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let id = uid("atk1");
    let (c, r, f0) = {
        let u = unit(&q, id);
        (u.col, u.row, u.spawn.facing)
    };
    let dir = (f0 + 2) % 4;
    let t0 = 50.0;
    pb.push_actions(&[
        act(t0, BattleActionKindDto::Facing { id, dir }),
        act(
            t0,
            BattleActionKindDto::Move {
                id,
                from_col: c,
                from_row: r,
                to_col: c - 1,
                to_row: r,
                arrive_at: t0 + MOVE_STEP_MS,
            },
        ),
    ])
    .expect("push");
    pb.play_until(&mut q, t0 + 100.0, 0.0).expect("play");
    let grid = p.field.grid.clone();
    let up = unit(&p, id).clone();
    set_facing(&mut p.field.field.scene, &up, dir);
    let anim = MoveAnim::start(&grid, unit_mut(&mut p, id), c - 1, r, t0);
    let up = unit(&p, id).clone();
    assert!(!anim.step(&mut p.field.field.scene, &up, t0 + 100.0));
    assert!(p == q, "playback scene != pin-call scene");
    let g = unit(&q, id).group;
    assert_ne!(
        q.field.field.scene.nodes[g].rotation.y.to_bits(),
        before.field.field.scene.nodes[g].rotation.y.to_bits(),
        "the turn reached the scene"
    );
}
