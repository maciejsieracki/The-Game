//! P4-1I5b (`R-RUSTPORT-P4-1I5B-BATTLE-ACTIONS-SIEGE`, #370; D-I5B-1..15, D-WIR-8): the renderer consumer of the siege
//! and flight actions (`Ram`, `GateDamage`, `Boulder`, `WallDamage`, `TowerDestroyed`, `WallBreach`, `LeaveField`,
//! `GateBreach`, `ClimbWall`, `Leave`, `Shaken`) against the scene the pin's direct scene calls give.
//!
//! As in `tests/battle_playback_move_shot.rs`, two scenes are built from the constructor record of
//! `tests/fixtures/battle3d/dynamics.json` (web scene of part 4, on the grid `tilesNow`):
//! - **P** (pin calls): the scene functions called directly in the order of the pin `07d2fbd72`
//!   (`gra/src/battle/battleScene.ts`), as `tests/battle3d_dynamics.rs` does for the fixture events `ram`
//!   (`_attackGate` → `_animateRam` `:7310-7360`), `boulder` (`_attackWallTile` → `_spawnCatapultBoulder`, the
//!   `_schedule(700)` hit and `_breachWallTile`, `:7540-7750`), `breachWall`, `breachGate` (`_breachGate`
//!   `:7757-7811`) and `flee` (`_fleeStep` `:9845-9893`);
//! - **Q** (playback): the same events as [`BattleActionDto`]s in the order the engine emits them
//!   (`engine/src/domain/siege_tactics_loop.rs`: `siege_atk_gate` = `Ram` then `GateDamage`; `siege_atk_wall_tile` =
//!   `Boulder`, then at `landAt` `boulder_hit` = `WallDamage`, `TowerDestroyed`, `WallBreach`, `LeaveField` / `Kill`;
//!   `breach_gate_scene` = `GateBreach`; `leave_field` = `Leave` then `Shaken`), played by [`BattlePlayback`].
//!
//! The whole `BattleScene3` of P and Q must be equal at every sampled time; positions, tiles and rubble counts must
//! equal the web vectors of the fixture. Unit ids: `atkN` → `N`, `defN` → `1000 + N`.

#![allow(clippy::float_cmp)]

use std::path::PathBuf;

use civ_renderer::battle::dynamics::{
    breach_gate, breach_wall_tile, retreat_from_wall, rout_facing, set_facing, wall_shot_endpoints,
    Boulder, FloatLabel, MoveAnim, RamAnim, BOULDER_MS, MOVE_STEP_MS, RAM_MS,
};
use civ_renderer::battle::field::{BattleSceneOpts, TerrainGrid, BF_COLS, BF_ROWS};
use civ_renderer::battle::playback::{
    BattlePlayback, PlaybackError, PlaybackOpts, SceneCall, WALL_BREACH_COLOR, WALL_BREACH_TEXT,
    WALL_HIT_COLOR,
};
use civ_renderer::battle::siege_towers::{destroy_tower_at_row, TowerMaterial};
use civ_renderer::battle::units::{
    build_battle_scene_with_units, build_battle_scene_with_units_fort, climb_onto_wall_walkway,
    kill_unit, move_deploy_unit, remove_unit_from_scene, siege_wall_civ, update_ammo_bar,
    update_morale_bar, BattleScene3, BattleSide, BattleUnitsOpts, FortDto, FortKind, PlacedUnit,
    UnitSpawn, WALL_WALK_Y,
};
use civ_view_model::battle::{
    BattleActionDto, BattleActionKindDto as K, BattleFrameDto, BattleFrameUnitDto,
    BattleFrameWallDto, BattleWinner,
};
use civ_view_model::ids::UnitId;
use serde_json::Value;

// ------------------------------------------------------------ fixture (as in battle_playback_move_shot.rs)

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

/// `grid_rle` of `battle3d_dynamics.rs`: the tile array as `[kind, run]` pairs (the web `tiles` record).
fn grid_rle(g: &TerrainGrid) -> Vec<u64> {
    let mut out = Vec::new();
    let t = &g.tiles;
    let mut i = 0;
    while i < t.len() {
        let mut j = i;
        while j < t.len() && t[j] == t[i] {
            j += 1;
        }
        out.push(u64::from(t[i]));
        out.push(u64::try_from(j - i).expect("run"));
        i = j;
    }
    out
}

fn json_u64s(v: &Value) -> Vec<u64> {
    v.as_array()
        .expect("array")
        .iter()
        .map(|x| x.as_u64().expect("u64"))
        .collect()
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

fn v3(b: &BattleScene3, id: UnitId) -> Vec<f64> {
    pos_of(b, id)[..3].to_vec()
}

/// `_moveDeployUnit` (scene part) on a copy of the unit, written back.
fn deploy(b: &mut BattleScene3, id: UnitId, col: i32, row: i32) {
    let mut u = unit(b, id).clone();
    move_deploy_unit(&mut b.field.field.scene, &b.field.grid, &mut u, col, row);
    *unit_mut(b, id) = u;
}

fn act(t0: f64, action: K) -> BattleActionDto {
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
    b.field.grid = grid_of(&d["tilesNow"]);
    (events, b)
}

fn wall_col(b: &BattleScene3) -> i32 {
    b.field.siege.as_ref().expect("siege").wall_col
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
            ever_breached: true,
            towers_destroyed: vec![],
        },
        finished: false,
    }
}

fn frame_unit(u: &PlacedUnit, id: UnitId, morale: f64) -> BattleFrameUnitDto {
    BattleFrameUnitDto {
        id,
        col: u.col,
        row: u.row,
        facing: u.spawn.facing,
        hp: u.spawn.hp,
        morale,
        ammo_left: u.spawn.ammo_left.is_finite().then_some(u.spawn.ammo_left),
        routed: false,
        dead: false,
        removed: false,
        on_wall_walkway: u.on_wall_walkway,
    }
}

// ------------------------------------------------------------ tests

/// The two ram strokes of the fixture (`_animateRam` `:7337-7360`, started by `_attackGate` `:7316-7323` from the
/// ram's group position toward the gate `(siegeGateCol, siegeGateRow)`): at every sample the played scene equals the
/// pin-call scene, the ram position equals the web vector bit for bit, the animation ends when the web ended it, and
/// the second stroke snaps back at once when the battle is `finished` (the `End` action, `:7347`).
#[test]
fn ram_playback_equals_pin_calls_and_web_vectors() {
    let (events, mut p) = base();
    let mut q = p.clone();
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let rams: Vec<&Value> = events.iter().filter(|e| e["op"] == "ram").collect();
    assert_eq!(rams.len(), 2);
    let siege = p.field.siege.clone().expect("siege");
    let mut n = 0;
    let mut gate_hp = 30.0;
    for (k, e) in rams.iter().enumerate() {
        let id = uid(e["id"].as_str().expect("id"));
        let g = e["gate"].as_array().expect("gate");
        assert_eq!(
            (siege.gate_col, siege.gate_row),
            (i32_of(&g[0]), i32_of(&g[1]))
        );
        let t0 = num(&e["t0"]);
        // P.
        let up = unit(&p, id).clone();
        let start = p.field.field.scene.nodes[up.group].position;
        assert_bits(
            &format!("ram {k} start"),
            &[start.x, start.y, start.z],
            &hx(e["start"].as_str().expect("start")),
        );
        let anim = RamAnim::start(start, (siege.gate_col, siege.gate_row), t0);
        // Q: `_attackGate` = `Ram` then `GateDamage` (HUD only).
        gate_hp -= 14.0;
        pb.push_actions(&[
            act(
                t0,
                K::Ram {
                    id,
                    until: t0 + RAM_MS,
                },
            ),
            act(
                t0,
                K::GateDamage {
                    dmg: 14.0,
                    hp_after: gate_hp,
                },
            ),
        ])
        .expect("push");
        let mut done = false;
        for s in e["samples"].as_array().expect("samples") {
            let t = num(&s[0]);
            let finished = s[1].as_i64() == Some(1);
            if finished && !pb.finished() {
                pb.push_actions(&[act(
                    t,
                    K::End {
                        winner: BattleWinner::Atakujacy,
                    },
                )])
                .expect("end");
            }
            pb.play_until(&mut q, t, 0.0).expect("play");
            if !done {
                done = anim.step(&mut p.field.field.scene, up.group, t, finished);
            }
            assert!(p == q, "ram {k} t={t}: playback scene != pin-call scene");
            assert_bits(
                &format!("ram {k} t={t}"),
                &v3(&q, id),
                &hx(s[2].as_str().expect("pos")),
            );
            assert_eq!(done, s[3].as_i64() == Some(1), "ram {k} t={t} pin done");
            assert_eq!(pb.rams_in_flight() == 0, done, "ram {k} t={t} done");
            n += 1;
        }
    }
    assert!(n >= 10, "samples {n}");
    assert_eq!(pb.gate_hp(), Some(gate_hp));
    assert!(!pb.gate_open());
    let starts: Vec<&SceneCall> = pb
        .calls()
        .iter()
        .filter(|c| matches!(c, SceneCall::RamStart { .. } | SceneCall::GateHp { .. }))
        .collect();
    assert_eq!(starts.len(), 4);
    assert!(matches!(starts[0], SceneCall::RamStart { .. }));
    assert!(matches!(starts[1], SceneCall::GateHp { .. }));
}

/// The pin calls of `_breachWallTile(row)` for P (`battle3d_dynamics.rs` `breach`): rubble + label, then the
/// defenders on the tile (`changed`: catapult `_startFade` → `kill_unit`, the rest `retreat_from_wall`), then the
/// morale loop (`MORALE_WALL_BREACH = 0`, bars refreshed unchanged). Returns the rubble count.
fn pin_breach(p: &mut BattleScene3, e: &Value, row: i32, clock: f64) -> (usize, FloatLabel) {
    let wall = p.wall.clone();
    let wc = wall_col(p);
    let (rubble, label) = breach_wall_tile(
        &mut p.field.field.scene,
        &mut p.field.grid,
        wall.as_ref(),
        wc,
        row,
        clock,
    );
    for ch in e["changed"].as_array().expect("changed") {
        let a = ch.as_array().expect("change");
        let id = uid(a[0].as_str().expect("id"));
        let mut u = unit(p, id).clone();
        if a[4].as_i64() == Some(1) {
            assert!(kill_unit(&mut p.field.field.scene, &mut u, false, false));
        } else {
            retreat_from_wall(
                &mut p.field.field.scene,
                &p.field.grid,
                &mut u,
                i32_of(&a[1]),
                i32_of(&a[2]),
            );
        }
        *unit_mut(p, id) = u;
    }
    let defs: Vec<PlacedUnit> = p.def.clone();
    for u in defs.iter().filter(|u| !u.removed) {
        update_morale_bar(
            &mut p.field.field.scene,
            &u.bars,
            u.spawn.morale,
            u.spawn.morale_max,
        );
    }
    (rubble.len(), label)
}

/// The engine actions of the same breach (`boulder_hit` / `breach_wall_tile`, `siege_tactics_loop.rs`): `WallBreach`,
/// then per defender on the tile `Kill` (catapult) or `LeaveField` (from the wall cell to the web cell).
fn breach_actions(q: &BattleScene3, e: &Value, row: i32, t: f64) -> Vec<BattleActionDto> {
    let mut out = vec![act(t, K::WallBreach { row })];
    for ch in e["changed"].as_array().expect("changed") {
        let a = ch.as_array().expect("change");
        let id = uid(a[0].as_str().expect("id"));
        if a[4].as_i64() == Some(1) {
            out.push(act(t, K::Kill { id }));
        } else {
            let u = unit(q, id);
            out.push(act(
                t,
                K::LeaveField {
                    id,
                    from_col: u.col,
                    from_row: u.row,
                    to_col: i32_of(&a[1]),
                    to_row: i32_of(&a[2]),
                },
            ));
        }
    }
    out
}

/// The catapult stone (`boulder`, row 5) with its `_schedule(700)` hit, the four wall breaches (rows 67, 73 with two
/// defender catapults faded, 158 outside the grid, 67 again) and the gate breach of the fixture, as one battle: the
/// played scene equals the pin-call scene at every sample and after every breach; the stone flight, the tiles, the
/// rubble count, the retreat cells and the wall labels equal the web. The faded catapults keep their HP bar (no blow,
/// D-I5B-15), which a blow `Kill` would have set to 0.
#[test]
#[allow(clippy::too_many_lines)]
fn boulder_and_breaches_equal_pin_calls_and_web_vectors() {
    let (events, mut p) = base();
    let mut q = p.clone();
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let wc = wall_col(&p);
    let mut p_labels: Vec<FloatLabel> = Vec::new();
    let mut breaches = 0;
    // --- the stone (row 5).
    let e = events
        .iter()
        .find(|e| e["op"] == "boulder")
        .expect("boulder");
    let id = uid(e["id"].as_str().expect("id"));
    let row = i32_of(&e["row"]);
    let t0 = num(&e["t0"]);
    assert_eq!(json_u64s(&e["sched"]), vec![700]);
    let u = unit(&p, id).clone();
    let (from, to) = wall_shot_endpoints(&p.field.grid, (u.col, u.row), wc, row);
    let stone = Boulder::spawn(&mut p.field.field.scene, from, to, t0);
    let land = t0 + BOULDER_MS;
    let clock = 61_000.25;
    pb.push_actions(&[act(
        t0,
        K::Boulder {
            id,
            row,
            land_at: land,
        },
    )])
    .expect("boulder");
    let mut hit = breach_actions(&q, e, row, land);
    hit.insert(
        0,
        act(
            land,
            K::WallDamage {
                row,
                dmg: 1.0,
                hp_after: 0.0,
            },
        ),
    );
    pb.push_actions(&hit).expect("hit");
    let mut removed = false;
    let mut hit_done = false;
    for s in e["samples"].as_array().expect("samples") {
        let t = num(&s[0]);
        // The `_schedule(700)` callback runs at `landAt`, before the frame of that time (queue before animations).
        if t >= land && !hit_done {
            p_labels.push(FloatLabel::wall(wc, row, clock));
            let (n_rubble, l) = pin_breach(&mut p, e, row, clock);
            assert_eq!(n_rubble, e["rubble"].as_array().expect("rubble").len());
            p_labels.push(l);
            hit_done = true;
        }
        pb.play_until(&mut q, t, if t >= land { clock } else { 0.0 })
            .expect("play");
        if !removed {
            removed = stone.step(&mut p.field.field.scene, t, false);
        }
        assert!(p == q, "stone t={t}: playback scene != pin-call scene");
        let sc = &q.field.field.scene;
        if s[1].is_null() {
            assert_eq!(sc.nodes[stone.node].parent, None, "stone removed t={t}");
            assert!(pb.boulders().is_empty());
        } else {
            let pos = sc.nodes[stone.node].position;
            assert_bits(
                &format!("stone t={t}"),
                &[pos.x, pos.y, pos.z],
                &hx(s[1].as_str().expect("pos")),
            );
        }
    }
    assert!(hit_done && removed, "stone landed and was removed");
    assert_eq!(
        grid_rle(&q.field.grid),
        json_u64s(&e["tiles"]),
        "tiles after stone"
    );
    breaches += 1;
    // --- the wall breaches.
    for (k, e) in events
        .iter()
        .filter(|e| e["op"] == "breachWall")
        .enumerate()
    {
        let row = i32_of(&e["row"]);
        let t = 62_000.0 + f64::from(u8::try_from(k).expect("k")) * 100.0;
        let clock = 62_000.0 + f64::from(row);
        let (n_rubble, l) = pin_breach(&mut p, e, row, clock);
        p_labels.push(l);
        pb.push_actions(&breach_actions(&q, e, row, t))
            .expect("breach");
        pb.play_until(&mut q, t, clock).expect("breach play");
        assert!(
            p == q,
            "breach {k} row {row}: playback scene != pin-call scene"
        );
        let q_rubble = pb.calls().iter().rev().find_map(|c| match c {
            SceneCall::WallBreach { row: r, rubble } if *r == row => Some(*rubble),
            _ => None,
        });
        assert_eq!(q_rubble, Some(n_rubble), "rubble {k}");
        // The web records the rubble past the old child count; removed units (faded catapults) shift it left, so the
        // whole heap is compared only when nobody left the scene (`battle3d_dynamics.rs` "rubble tail").
        let faded_here = e["changed"]
            .as_array()
            .expect("changed")
            .iter()
            .any(|c| c[4].as_i64() == Some(1));
        if !faded_here {
            assert_eq!(n_rubble, e["rubble"].as_array().expect("rubble").len());
        }
        assert_eq!(grid_rle(&q.field.grid), json_u64s(&e["tiles"]), "tiles {k}");
        for ch in e["changed"].as_array().expect("changed") {
            let a = ch.as_array().expect("change");
            let cu = unit(&q, uid(a[0].as_str().expect("id")));
            assert_eq!((cu.col, cu.row), (i32_of(&a[1]), i32_of(&a[2])), "cell {k}");
            assert_eq!(cu.on_wall_walkway, a[3].as_i64() == Some(1), "onWall {k}");
            assert_eq!(cu.removed, a[4].as_i64() == Some(1), "faded {k}");
        }
        breaches += 1;
    }
    assert_eq!(breaches, 5);
    // The faded catapults (row 73) were killed without an HP bar update (`_startFade` without a blow).
    let faded: Vec<UnitId> = vec![uid("def40"), uid("def47")];
    for f in &faded {
        assert!(unit(&q, *f).removed);
        assert!(
            pb.calls()
                .iter()
                .all(|c| !matches!(c, SceneCall::HpBar { id, .. } if id == f)),
            "HP bar of faded {f}"
        );
        assert!(pb
            .calls()
            .iter()
            .any(|c| matches!(c, SceneCall::KillUnit { id, removed: true } if id == f)));
    }
    // --- the gate breach + the morale loop (`-MORALE_GATE_BREACH`, a frame in Q).
    let e = events
        .iter()
        .find(|e| e["op"] == "breachGate")
        .expect("breachGate");
    let g = e["gate"].as_array().expect("gate");
    let wall = p.wall.clone();
    breach_gate(
        &mut p.field.field.scene,
        &mut p.field.grid,
        wall.as_ref(),
        i32_of(&g[0]),
        i32_of(&g[1]),
    );
    let t = 63_000.0;
    let mut fus = Vec::new();
    for m in e["morale"].as_array().expect("morale") {
        let a = m.as_array().expect("m");
        if a[2].as_i64() != Some(0) {
            continue;
        }
        let id = uid(a[0].as_str().expect("id"));
        let morale = num(&a[1]);
        let u = unit(&p, id).clone();
        if u.removed {
            continue;
        }
        update_morale_bar(
            &mut p.field.field.scene,
            &u.bars,
            morale,
            u.spawn.morale_max,
        );
        update_ammo_bar(
            &mut p.field.field.scene,
            &u.bars,
            u.ammo_bar_shown,
            u.spawn.ammo_left,
            u.spawn.ammo_max,
        );
        fus.push(frame_unit(unit(&q, id), id, morale));
    }
    assert!(!fus.is_empty());
    pb.push_actions(&[act(t, K::GateBreach {})]).expect("gate");
    pb.push_frame(&frame(t, fus)).expect("frame");
    pb.play_until(&mut q, t, 0.0).expect("gate play");
    assert!(p == q, "gate breach: playback scene != pin-call scene");
    assert_eq!(
        grid_rle(&q.field.grid),
        json_u64s(&e["tiles"]),
        "tiles gate"
    );
    assert!(pb.gate_open());
    // Labels: the hit '-1 (mur)' #ff8800, then one 'MUR WYBURZONY!' #ff4400 per breach, same 3D data as P.
    let wl = pb.wall_labels();
    assert_eq!(wl.len(), p_labels.len());
    assert_eq!(wl[0].text, "-1 (mur)");
    assert_eq!(wl[0].color, WALL_HIT_COLOR);
    assert_eq!(wl[0].row, 5);
    for (w, pl) in wl.iter().zip(&p_labels) {
        assert_eq!(w.label, *pl);
    }
    for w in &wl[1..] {
        assert_eq!(w.text, WALL_BREACH_TEXT);
        assert_eq!(w.color, WALL_BREACH_COLOR);
    }
    // Tile HP: the hit row was set, then deleted by its breach.
    assert_eq!(pb.wall_tile_hp(5), None);
}

/// `WallDamage` without a breach keeps the tile HP and its label; the stone of a `finished` battle is removed at the
/// next frame (`animBoulder` `:7584-7588`).
#[test]
fn wall_hit_hp_and_finished_stone() {
    let (_, p) = base();
    let mut q = p.clone();
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let cat = uid("atk20");
    pb.push_actions(&[
        act(
            100.0,
            K::Boulder {
                id: cat,
                row: 70,
                land_at: 800.0,
            },
        ),
        act(
            800.0,
            K::WallDamage {
                row: 70,
                dmg: 16.0,
                hp_after: 44.0,
            },
        ),
        act(
            900.0,
            K::Boulder {
                id: cat,
                row: 71,
                land_at: 1600.0,
            },
        ),
        act(
            1000.0,
            K::End {
                winner: BattleWinner::Obronca,
            },
        ),
    ])
    .expect("push");
    pb.play_until(&mut q, 800.0, 5.0).expect("hit");
    assert_eq!(pb.wall_tile_hp(70), Some(44.0));
    let wl = pb.wall_labels();
    assert_eq!(wl.len(), 1);
    assert_eq!(wl[0].text, "-16 (mur)");
    assert_eq!(wl[0].color, WALL_HIT_COLOR);
    assert_eq!(wl[0].label, FloatLabel::wall(wall_col(&q), 70, 5.0));
    pb.play_until(&mut q, 950.0, 5.0).expect("second");
    assert_eq!(pb.boulders().len(), 1);
    let node = pb.boulders()[0].node;
    assert!(q.field.field.scene.nodes[node].parent.is_some());
    pb.play_until(&mut q, 1000.0, 5.0).expect("end");
    assert!(pb.finished());
    assert!(pb.boulders().is_empty());
    assert_eq!(q.field.field.scene.nodes[node].parent, None);
}

/// The flight of the fixture (`flee`, `_fleeStep` `:9845-9893`): the rout turn, two walking steps and the removal at
/// the end of the last walk (`done()` → `_removeUnitFromScene`), then the ripple `Shaken` of an ally: the played scene
/// equals the pin-call scene at every web frame and the positions equal the web vectors.
#[test]
fn flee_leave_and_shaken_equal_pin_calls_and_web_vectors() {
    let (events, mut p) = base();
    let mut q = p.clone();
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let e = events.iter().find(|e| e["op"] == "flee").expect("flee");
    let id = uid(e["id"].as_str().expect("id"));
    let side = unit(&p, id).spawn.side;
    let moves = e["moves"].as_array().expect("moves");
    let frames = e["frames"].as_array().expect("frames");
    let t_rout = num(&moves[0][3]);
    // P + Q: the rout turn (`_startRout` `:9817-9818`).
    for r in e["routs"].as_array().expect("routs") {
        let ru = uid(r.as_str().expect("r"));
        let u = unit(&p, ru).clone();
        set_facing(&mut p.field.field.scene, &u, rout_facing(side));
        pb.push_actions(&[act(
            t_rout,
            K::Facing {
                id: ru,
                dir: rout_facing(side),
            },
        )])
        .expect("rout");
    }
    let mut fi = 0;
    let mut last_end = 0.0;
    for m in moves {
        let a = m.as_array().expect("move");
        let (col, row, t0, dir) = (i32_of(&a[1]), i32_of(&a[2]), num(&a[3]), i32_of(&a[4]));
        let from = {
            let u = unit(&q, id);
            (u.col, u.row)
        };
        pb.push_actions(&[
            act(t0, K::Facing { id, dir }),
            act(
                t0,
                K::Move {
                    id,
                    from_col: from.0,
                    from_row: from.1,
                    to_col: col,
                    to_row: row,
                    arrive_at: t0 + MOVE_STEP_MS,
                },
            ),
        ])
        .expect("step");
        last_end = t0 + MOVE_STEP_MS;
        let grid = p.field.grid.clone();
        let anim = MoveAnim::start(&grid, unit_mut(&mut p, id), col, row, t0);
        let u = unit(&p, id).clone();
        set_facing(&mut p.field.field.scene, &u, dir);
        for _ in 0..2 {
            let f = frames[fi].as_array().expect("frame");
            fi += 1;
            let t = num(&f[0]);
            let is_last = fi == frames.len();
            if is_last {
                // The removal at the end of the last walk (`done()`, `:9884-9887`), then the ally ripple.
                pb.push_actions(&[
                    act(t, K::Leave { id }),
                    act(
                        t,
                        K::Shaken {
                            id: uid("atk20"),
                            fallen: id,
                            morale: 37.5,
                        },
                    ),
                ])
                .expect("leave");
            }
            pb.play_until(&mut q, t, 0.0).expect("play");
            anim.step(&mut p.field.field.scene, &u, t);
            if is_last {
                let mut uu = unit(&p, id).clone();
                remove_unit_from_scene(&mut p.field.field.scene, &mut uu);
                *unit_mut(&mut p, id) = uu;
                let ally = unit(&p, uid("atk20")).clone();
                update_morale_bar(
                    &mut p.field.field.scene,
                    &ally.bars,
                    37.5,
                    ally.spawn.morale_max,
                );
            }
            assert!(p == q, "flee t={t}: playback scene != pin-call scene");
            assert_bits(
                &format!("flee t={t}"),
                &pos_of(&q, id),
                &hx(f[1].as_str().expect("pos")),
            );
        }
    }
    assert_eq!(fi, frames.len());
    assert_eq!(num(&frames[frames.len() - 1][0]), last_end);
    let u = unit(&q, id);
    assert!(u.removed);
    let vis = e["vis"].as_array().expect("vis");
    let sc = &q.field.field.scene;
    assert_eq!(sc.nodes[u.group].visible, vis[0].as_bool().expect("v"));
    assert_eq!(sc.nodes[u.bars.group].visible, vis[1].as_bool().expect("v"));
    assert_eq!(e["removed"].as_i64(), Some(1));
    assert_eq!(pb.moves_in_flight(), 0);
    assert!(pb
        .calls()
        .iter()
        .any(|c| matches!(c, SceneCall::LeaveField { id: x, removed: true } if *x == id)));
    // A second `Leave` of the same unit is a no-op (`_removeUnitFromScene` `:9911`).
    let before = q.clone();
    pb.apply_action(&mut q, &act(last_end, K::Leave { id }), 0.0)
        .expect("again");
    assert!(before == q);
    assert!(matches!(
        pb.calls().last(),
        Some(SceneCall::LeaveField { removed: false, .. })
    ));
}

/// A walk still in flight when its `Leave` comes is finished at `t0` first (the pin removes the unit in the walk's
/// `done()`, after the last pose): the removed model stands at the end pose of the walk.
#[test]
fn leave_finishes_the_walk_in_flight() {
    let (_, p0) = base();
    let mut p = p0.clone();
    let mut q = p0.clone();
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let id = uid("atk21");
    let (c, r) = {
        let u = unit(&q, id);
        (u.col, u.row)
    };
    pb.push_actions(&[
        act(
            1000.0,
            K::Move {
                id,
                from_col: c,
                from_row: r,
                to_col: c - 1,
                to_row: r,
                arrive_at: 1000.0 + MOVE_STEP_MS,
            },
        ),
        act(1000.0 + MOVE_STEP_MS, K::Leave { id }),
    ])
    .expect("push");
    pb.play_until(&mut q, 1100.0, 0.0).expect("mid");
    // The frame skips the end of the walk: the next frame is after `arriveAt`.
    pb.play_until(&mut q, 1300.0, 0.0).expect("after");
    let grid = p.field.grid.clone();
    let anim = MoveAnim::start(&grid, unit_mut(&mut p, id), c - 1, r, 1000.0);
    let u = unit(&p, id).clone();
    anim.step(&mut p.field.field.scene, &u, 1100.0);
    assert!(anim.step(&mut p.field.field.scene, &u, 1000.0 + MOVE_STEP_MS));
    let mut uu = unit(&p, id).clone();
    remove_unit_from_scene(&mut p.field.field.scene, &mut uu);
    *unit_mut(&mut p, id) = uu;
    assert!(p == q, "leave mid-walk: playback scene != pin-call scene");
    assert_eq!(pb.moves_in_flight(), 0);
}

/// The climb from a siege tower (`_trySiegeTowerClimb` `:8067-8079`): an attacker beside the wall base goes onto the
/// crown of its row at once (`(x, 2.5, z)`, bars `HPBAR_Y` above), as the pin call.
#[test]
fn climb_equals_pin_call() {
    let (_, p0) = base();
    let wc = wall_col(&p0);
    let id = uid("atk5");
    let row = 70;
    let mut p = p0.clone();
    deploy(&mut p, id, wc - 2, row);
    let mut q = p.clone();
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let mut u = unit(&p, id).clone();
    climb_onto_wall_walkway(&mut p.field.field.scene, &mut u, wc, row);
    *unit_mut(&mut p, id) = u;
    pb.apply_action(
        &mut q,
        &act(
            10.0,
            K::ClimbWall {
                id,
                from_col: wc - 2,
                from_row: row,
                to_col: wc,
                to_row: row,
            },
        ),
        0.0,
    )
    .expect("climb");
    assert!(p == q, "climb: playback scene != pin-call scene");
    let cu = unit(&q, id);
    assert!(cu.on_wall_walkway);
    assert_eq!((cu.col, cu.row), (wc, row));
    assert_eq!(v3(&q, id)[1], WALL_WALK_Y);
    assert_eq!(pb.calls(), &[SceneCall::Climb { id, to: (wc, row) }]);
}

/// `TowerDestroyed` = `_destroyTowerAtRow(row)` (`:4194-4200`) on a fortified wall with towers: the first live tower of
/// the row is hidden, as the pin call; a second one on the same row (none left) is an error.
#[test]
fn tower_destroyed_equals_pin_call() {
    let d = load();
    let opts = opts_of(&d["siege"]);
    let fort = FortDto {
        kind: FortKind::Mur,
        tower_material: Some(TowerMaterial::Kamien),
        tower_rows: vec![66, 70],
    };
    let mut p = build_battle_scene_with_units_fort(opts, &fort);
    let rows: Vec<i32> = p
        .wall
        .as_ref()
        .expect("wall")
        .towers
        .iter()
        .map(|t| t.row)
        .collect();
    assert!(rows.contains(&70), "tower rows {rows:?}");
    let mut q = p.clone();
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let w = p.wall.as_mut().expect("wall");
    let log = destroy_tower_at_row(&mut p.field.field.scene, &mut w.towers, 70);
    assert!(log.is_some());
    pb.apply_action(&mut q, &act(5.0, K::TowerDestroyed { row: 70 }), 0.0)
        .expect("tower");
    assert!(p == q, "tower: playback scene != pin-call scene");
    assert_eq!(
        pb.apply_action(&mut q, &act(6.0, K::TowerDestroyed { row: 70 }), 0.0),
        Err(PlaybackError::NoTower { row: 70 })
    );
    assert_eq!(
        pb.apply_action(&mut q, &act(6.0, K::TowerDestroyed { row: 71 }), 0.0),
        Err(PlaybackError::NoTower { row: 71 })
    );
}

/// Inputs the scene cannot represent are reported (both sides of every pin equality: `+1` and `-1`), and the failing
/// action leaves the scene unchanged.
#[test]
#[allow(clippy::too_many_lines)]
fn siege_errors_are_reported() {
    let (_, p) = base();
    let wc = wall_col(&p);
    let cat = uid("atk20");
    let ram = uid("atk30");
    let check = |a: K, t0: f64, want: PlaybackError| {
        let mut q = p.clone();
        let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
        let before = q.clone();
        assert_eq!(
            pb.apply_action(&mut q, &act(t0, a.clone()), 0.0),
            Err(want),
            "{a:?}"
        );
        assert!(before == q, "{a:?} changed the scene");
    };
    for d in [-1.0, 1.0] {
        check(
            K::Boulder {
                id: cat,
                row: 70,
                land_at: 100.0 + BOULDER_MS + d,
            },
            100.0,
            PlaybackError::BoulderLandAt {
                t0: 100.0,
                land_at: 100.0 + BOULDER_MS + d,
            },
        );
        check(
            K::Ram {
                id: ram,
                until: 100.0 + RAM_MS + d,
            },
            100.0,
            PlaybackError::RamUntil {
                t0: 100.0,
                until: 100.0 + RAM_MS + d,
            },
        );
    }
    // Climb: `from` not the unit's cell, not onto the wall column, not from beside the wall base, row changed, out of
    // the grid.
    let a5 = uid("atk5");
    let (c5, r5) = {
        let u = unit(&p, a5);
        (u.col, u.row)
    };
    check(
        K::ClimbWall {
            id: a5,
            from_col: c5 + 1,
            from_row: r5,
            to_col: wc,
            to_row: r5,
        },
        0.0,
        PlaybackError::MoveFrom {
            id: a5,
            expected: (c5 + 1, r5),
            actual: (c5, r5),
        },
    );
    let climb_err = |from: (i32, i32), to: (i32, i32)| {
        let mut q = p.clone();
        deploy(&mut q, a5, from.0, from.1);
        let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
        let before = q.clone();
        let r = pb.apply_action(
            &mut q,
            &act(
                0.0,
                K::ClimbWall {
                    id: a5,
                    from_col: from.0,
                    from_row: from.1,
                    to_col: to.0,
                    to_row: to.1,
                },
            ),
            0.0,
        );
        assert!(before == q || r.is_ok());
        r
    };
    for ok_col in [wc - 2, wc - 1] {
        climb_err((ok_col, 70), (wc, 70)).expect("beside the base");
    }
    for (from, to) in [
        ((wc - 3, 70), (wc, 70)),
        ((wc - 1, 70), (wc + 1, 70)),
        ((wc - 1, 70), (wc - 1, 70)),
        ((wc - 1, 70), (wc, 71)),
        ((wc - 1, 70), (wc, 69)),
    ] {
        assert_eq!(
            climb_err(from, to),
            Err(PlaybackError::Climb {
                id: a5,
                from,
                to,
                wall_col: wc
            }),
            "{from:?} -> {to:?}"
        );
    }
    for to in [(wc, BF_ROWS), (wc, -1)] {
        assert_eq!(
            climb_err((wc - 1, 70), to),
            Err(PlaybackError::CellOutOfGrid {
                col: to.0,
                row: to.1
            })
        );
    }
    // Retreat: unit not on the wall walk, `from` not its cell, target outside the grid.
    check(
        K::LeaveField {
            id: a5,
            from_col: c5,
            from_row: r5,
            to_col: c5 + 1,
            to_row: r5,
        },
        0.0,
        PlaybackError::NotOnWall(a5),
    );
    let d4 = uid("def4");
    let (c4, r4) = {
        let u = unit(&p, d4);
        (u.col, u.row)
    };
    check(
        K::LeaveField {
            id: d4,
            from_col: c4,
            from_row: r4 + 1,
            to_col: c4 + 1,
            to_row: r4,
        },
        0.0,
        PlaybackError::MoveFrom {
            id: d4,
            expected: (c4, r4 + 1),
            actual: (c4, r4),
        },
    );
    check(
        K::LeaveField {
            id: d4,
            from_col: c4,
            from_row: r4,
            to_col: BF_COLS,
            to_row: r4,
        },
        0.0,
        PlaybackError::CellOutOfGrid {
            col: BF_COLS,
            row: r4,
        },
    );
    // Unknown units.
    let ghost = UnitId::try_new(999_999).expect("id");
    check(
        K::Leave { id: ghost },
        0.0,
        PlaybackError::UnknownUnit(ghost),
    );
    check(
        K::Shaken {
            id: a5,
            fallen: ghost,
            morale: 1.0,
        },
        0.0,
        PlaybackError::UnknownUnit(ghost),
    );
    check(
        K::Shaken {
            id: ghost,
            fallen: a5,
            morale: 1.0,
        },
        0.0,
        PlaybackError::UnknownUnit(ghost),
    );
    // No siege layout: every wall / gate action is an error, nothing reaches the scene.
    let mut ns = p.clone();
    ns.field.siege = None;
    for a in [
        K::Boulder {
            id: cat,
            row: 70,
            land_at: BOULDER_MS,
        },
        K::WallDamage {
            row: 70,
            dmg: 1.0,
            hp_after: 0.0,
        },
        K::Ram {
            id: ram,
            until: RAM_MS,
        },
        K::GateDamage {
            dmg: 1.0,
            hp_after: 0.0,
        },
        K::WallBreach { row: 70 },
        K::GateBreach {},
        K::ClimbWall {
            id: a5,
            from_col: c5,
            from_row: r5,
            to_col: c5 + 1,
            to_row: r5,
        },
    ] {
        let mut q = ns.clone();
        let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
        assert_eq!(
            pb.apply_action(&mut q, &act(0.0, a.clone()), 0.0),
            Err(PlaybackError::NoSiege),
            "{a:?}"
        );
        assert!(q == ns, "{a:?}");
    }
}

/// A defender on the breached cell that is NOT faded (it retreats) keeps the breach mark only until its `LeaveField`;
/// a `Kill` at a later `t0` is a blow again (HP bar to 0), and a `Kill` of a unit off the breached cell at the same
/// `t0` too.
#[test]
fn breach_mark_is_limited_to_the_tile_and_its_t0() {
    let (_, p) = base();
    let mut q = p.clone();
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let wc = wall_col(&q);
    let d4 = uid("def4"); // on the wall at (40, 67)
    let d20 = uid("def20"); // on the wall at (40, 82), off the breached row
    assert_eq!((unit(&q, d4).col, unit(&q, d4).row), (wc, 67));
    pb.push_actions(&[
        act(10.0, K::WallBreach { row: 67 }),
        act(10.0, K::Kill { id: d20 }),
        act(20.0, K::Kill { id: d4 }),
    ])
    .expect("push");
    pb.play_until(&mut q, 20.0, 0.0).expect("play");
    let hp_ids: Vec<UnitId> = pb
        .calls()
        .iter()
        .filter_map(|c| match c {
            SceneCall::HpBar { id, hp } if *hp == 0.0 => Some(*id),
            _ => None,
        })
        .collect();
    assert_eq!(hp_ids, vec![d20, d4]);
    // Same `t0`, on the breached cell: no HP bar.
    let mut q2 = p.clone();
    let mut pb2 = BattlePlayback::new(&q2, PlaybackOpts::default());
    pb2.push_actions(&[
        act(10.0, K::WallBreach { row: 67 }),
        act(10.0, K::Kill { id: d4 }),
    ])
    .expect("push");
    pb2.play_until(&mut q2, 10.0, 0.0).expect("play");
    assert!(pb2
        .calls()
        .iter()
        .all(|c| !matches!(c, SceneCall::HpBar { .. })));
    assert!(unit(&q2, d4).removed);
}
