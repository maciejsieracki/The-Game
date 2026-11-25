//! P4-1I4 (`R-RUSTPORT-P4-1I4-BATTLE-CONSUMER`): the renderer consumer of
//! the battle step DTOs ([`BattleActionDto`], [`BattleFrameDto`]) against the
//! scene the pin's direct scene calls give.
//!
//! Two scenes are built from the same constructor record of
//! `tests/fixtures/battle3d/dynamics.json` (the web scene of part 4, built
//! with `build_battle_scene_with_units`, verified by `tests/battle3d_units.rs`
//! and `tests/battle3d_dynamics.rs`):
//! - **P** (pin calls): the scene functions are called directly in the order
//!   of the pin `07d2fbd72` (`gra/src/battle/battleScene.ts`), as
//!   `tests/battle3d_dynamics.rs` does for the same events;
//! - **Q** (playback): the same scenario as a list of [`BattleActionDto`] (in
//!   the order the engine producer P4-1I3 emits them,
//!   `engine/src/domain/siege_tactics_loop.rs` `ProdBody::start` /
//!   `complete` / `counter_strike` / `start_fade`) and [`BattleFrameDto`]s,
//!   played by [`BattlePlayback`].
//!
//! The whole `BattleScene3` (scene tree, materials, units) of P and Q must be
//! equal at every sampled time, and the sampled positions / labels must equal
//! the web vectors of the fixture (`melee` and `labels` events). Unit ids:
//! the DTO names units by `UnitId`, the scene by the decimal string
//! (`view::convert::unit_id_string`), so the fixture ids `atkN` / `defN` are
//! renumbered `N` / `1000 + N` (the id is not part of any scene node).

#![allow(clippy::float_cmp)]

use std::path::PathBuf;

use civ_renderer::battle::dynamics::{
    set_facing, tick_projectiles, FloatLabel, MeleeLunge, MoveAnim, BLOW_HIT_T, BLOW_LUNGE_MS,
    BLOW_SETTLE_MS, RANGED_FLY_MS,
};
use civ_renderer::battle::field::{BattleSceneOpts, TerrainGrid, BF_COLS, BF_ROWS};
use civ_renderer::battle::playback::{
    is_pin_event_time, pin_frame_time, BattlePlayback, PlaybackError, PlaybackOpts, SceneCall,
    PIN_FRAME_MS,
};
use civ_renderer::battle::siege_towers::{
    fire_one_tower, tower_projectile_kind, TowerMaterial, TowerTarget,
};
use civ_renderer::battle::units::{
    build_battle_scene_with_units, build_battle_scene_with_units_fort, kill_unit, siege_wall_civ,
    update_hp_bar, update_morale_bar, BattleScene3, BattleSide, BattleUnitsOpts, FortDto, FortKind,
    PlacedUnit, UnitSpawn,
};
use civ_view_model::battle::{
    BattleActionDto, BattleActionKindDto, BattleActorDto, BattleClashTagDto, BattleFrameDto,
    BattleFrameUnitDto, BattleFrameWallDto, BattleWinner,
};
use civ_view_model::ids::UnitId;
use serde_json::Value;

// ------------------------------------------------------------ fixture

fn load() -> Value {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/battle3d/dynamics.json");
    let s = std::fs::read_to_string(&p).expect("dynamics.json");
    serde_json::from_str(&s).expect("json")
}

/// Binary64 values from the fixture hex dump (16 hex digits each).
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

/// `atkN` → `N`, `defN` → `1000 + N`.
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

/// The walking events before the lunges (`gen_dynamics.ts` part 1, events
/// 0–5): setup only, the same calls on both scenes (walking is P4-1I5, no
/// DTO variant). `_doMove` 3D (`battleScene.ts:8716-8776`).
fn replay_moves(b: &mut BattleScene3, events: &[Value]) {
    for e in events.iter().filter(|e| e["op"] == "move") {
        let id = uid(e["id"].as_str().expect("id"));
        let grid = b.field.grid.clone();
        let anim = MoveAnim::start(
            &grid,
            unit_mut(b, id),
            i32_of(&e["col"]),
            i32_of(&e["row"]),
            num(&e["t0"]),
        );
        let u = unit(b, id).clone();
        set_facing(&mut b.field.field.scene, &u, i32_of(&e["facing"]));
        let mut done = false;
        for s in e["samples"].as_array().expect("samples") {
            if !done {
                done = anim.step(&mut b.field.field.scene, &u, num(&s[0]));
            }
        }
        assert!(done);
    }
}

// ------------------------------------------------------------ scenario

/// One lunge of the fixture (`melee` event) with the blow values the
/// fixture stubs: the initiator deals 7, the counter 3 (`gen_dynamics.ts`
/// `_singleBlow` stub), and the morale the logic would set
/// (`_applyMoraleDamage` → `_updateMoraleBar`, `:9722-9741`).
struct Melee {
    att: UnitId,
    def: UnitId,
    t0: f64,
    att_facing: i32,
    def_facing: i32,
    counter: bool,
    kill_att: bool,
    samples: Vec<(f64, Vec<f64>, i64, bool)>,
    labels: usize,
}

const DMG_ATT: f64 = 7.0;
const DMG_COUNTER: f64 = 3.0;
const MORALE_HIT: f64 = 9.5;

fn melees(events: &[Value]) -> Vec<Melee> {
    events
        .iter()
        .filter(|e| e["op"] == "melee")
        .map(|e| Melee {
            att: uid(e["att"].as_str().expect("att")),
            def: uid(e["def"].as_str().expect("def")),
            t0: num(&e["t0"]),
            att_facing: i32_of(&e["attFacing"]),
            def_facing: i32_of(&e["defFacing"]),
            counter: e["counter"].as_bool().expect("counter"),
            kill_att: e["killAtt"].as_bool().expect("killAtt"),
            samples: e["samples"]
                .as_array()
                .expect("samples")
                .iter()
                .map(|s| {
                    (
                        num(&s[0]),
                        hx(s[1].as_str().expect("pos")),
                        s[2].as_i64().expect("blows"),
                        s[3].as_i64() == Some(1),
                    )
                })
                .collect(),
            labels: usize::try_from(e["labels"].as_u64().expect("labels")).expect("usize"),
        })
        .collect()
}

fn act(t0: f64, action: BattleActionKindDto) -> BattleActionDto {
    BattleActionDto { t0, action }
}

fn frame_unit(b: &BattleScene3, id: UnitId, hp: f64, morale: f64) -> BattleFrameUnitDto {
    let u = unit(b, id);
    BattleFrameUnitDto {
        id,
        col: u.col,
        row: u.row,
        facing: u.spawn.facing,
        hp,
        morale,
        ammo_left: Some(u.spawn.ammo_left),
        routed: false,
        dead: u.removed,
        removed: u.removed,
        on_wall_walkway: u.on_wall_walkway,
    }
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

/// HP / morale of the scenario logic (what the engine state holds).
#[derive(Clone, Default)]
struct Logic {
    hp: std::collections::HashMap<UnitId, f64>,
    morale: std::collections::HashMap<UnitId, f64>,
}

impl Logic {
    fn new(b: &BattleScene3) -> Self {
        let mut l = Self::default();
        for u in b.atk.iter().chain(b.def.iter()) {
            let id = UnitId::try_new(u.spawn.id.parse().expect("num")).expect("id");
            l.hp.insert(id, u.spawn.hp);
            l.morale.insert(id, u.spawn.morale);
        }
        l
    }
}

/// The actions the engine emits for one lunge, in its order, plus the
/// frame of each fire (lunge start at `t0`, blow at `t0 + BLOW_HIT_T`).
/// `logic` is advanced to the state after the blow.
fn melee_steps(
    b: &BattleScene3,
    m: &Melee,
    logic: &mut Logic,
) -> Vec<(Vec<BattleActionDto>, BattleFrameDto)> {
    let hit = m.t0 + BLOW_HIT_T;
    let start = vec![
        // `_doMeleeAttack` `:9104-9105` (attacker faces the target), lunge `:9112-9157`.
        act(
            m.t0,
            BattleActionKindDto::Facing {
                id: m.att,
                dir: m.att_facing,
            },
        ),
        act(
            m.t0,
            BattleActionKindDto::Melee {
                attacker: m.att,
                target: m.def,
                hit_at: hit,
            },
        ),
    ];
    let f0 = frame(
        m.t0,
        vec![
            frame_unit(b, m.att, logic.hp[&m.att], logic.morale[&m.att]),
            frame_unit(b, m.def, logic.hp[&m.def], logic.morale[&m.def]),
        ],
    );
    let mut blow = Vec::new();
    // `_singleBlow` (`:8991-9000`): HP, log; `_resolveBlowOutcome` morale (`:9722-9741`).
    let def_hp = (logic.hp[&m.def] - DMG_ATT).max(0.0);
    logic.hp.insert(m.def, def_hp);
    *logic.morale.get_mut(&m.def).expect("m") -= MORALE_HIT;
    blow.push(act(
        hit,
        BattleActionKindDto::Log {
            text: "trafia".into(),
        },
    ));
    blow.push(act(
        hit,
        BattleActionKindDto::Clash {
            attacker: BattleActorDto::Unit { id: m.att },
            target: m.def,
            dmg: DMG_ATT,
            tag: BattleClashTagDto::Plain,
            text: "clash".into(),
        },
    ));
    // `:9125`: label for the live defender.
    blow.push(act(
        hit,
        BattleActionKindDto::Damage {
            target: m.def,
            dmg: DMG_ATT,
        },
    ));
    if m.counter {
        // `:9137-9138`: the defender turns, then strikes back (`:9139`).
        blow.push(act(
            hit,
            BattleActionKindDto::Facing {
                id: m.def,
                dir: m.def_facing,
            },
        ));
        blow.push(act(
            hit,
            BattleActionKindDto::Log {
                text: "kontra".into(),
            },
        ));
        if m.kill_att {
            logic.hp.insert(m.att, 0.0);
            // `_resolveBlowOutcome` HP <= 0 (`:9044-9052`): log, `_startFade`, clash 'padl'.
            blow.push(act(
                hit,
                BattleActionKindDto::Log {
                    text: "  -> X wyeliminowany".into(),
                },
            ));
            blow.push(act(hit, BattleActionKindDto::Kill { id: m.att }));
            blow.push(act(
                hit,
                BattleActionKindDto::Clash {
                    attacker: BattleActorDto::Unit { id: m.def },
                    target: m.att,
                    dmg: DMG_COUNTER,
                    tag: BattleClashTagDto::Padl,
                    text: "padl".into(),
                },
            ));
        } else {
            let att_hp = (logic.hp[&m.att] - DMG_COUNTER).max(0.0);
            logic.hp.insert(m.att, att_hp);
            *logic.morale.get_mut(&m.att).expect("m") -= MORALE_HIT;
            // `:9142`: label for the live attacker.
            blow.push(act(
                hit,
                BattleActionKindDto::Damage {
                    target: m.att,
                    dmg: DMG_COUNTER,
                },
            ));
        }
    }
    let mut fu_att = frame_unit(b, m.att, logic.hp[&m.att], logic.morale[&m.att]);
    if m.kill_att {
        fu_att.dead = true;
        fu_att.removed = true;
    }
    let f1 = frame(
        hit,
        vec![
            fu_att,
            frame_unit(b, m.def, logic.hp[&m.def], logic.morale[&m.def]),
        ],
    );
    vec![(start, f0), (blow, f1)]
}

/// P: the pin's scene calls of one lunge at the sampled times
/// (`_doMeleeAttack` `:9096-9175`, `_singleBlow` `:8991-8992`,
/// `_spawnDamageLabel` `:9940-9971`, `_startFade` `:9927-9938`,
/// `_updateMoraleBar` `:9733`). Returns the labels spawned.
fn pin_melee(
    b: &mut BattleScene3,
    m: &Melee,
    logic: &mut Logic,
    sample_at: usize,
) -> Vec<FloatLabel> {
    // Only the call sequence up to sample `sample_at` (inclusive) is run, so
    // P can be compared with Q at every sample. The caller restarts P per
    // sample from a clone.
    let mut labels = Vec::new();
    let ua = unit(b, m.att).clone();
    let ud = unit(b, m.def).clone();
    set_facing(&mut b.field.field.scene, &ua, m.att_facing);
    let mut lunge = MeleeLunge::start(&b.field.grid, (ua.col, ua.row), (ud.col, ud.row), m.t0);
    let mut finished = false;
    for (k, (t, ..)) in m.samples.iter().enumerate() {
        if k > sample_at {
            break;
        }
        if finished {
            continue;
        }
        if lunge.hit_due(*t) {
            let def_hp = (logic.hp[&m.def] - DMG_ATT).max(0.0);
            logic.hp.insert(m.def, def_hp);
            let ud = unit(b, m.def).clone();
            update_hp_bar(&mut b.field.field.scene, &ud.bars, def_hp, ud.spawn.max_hp);
            let mor = logic.morale[&m.def] - MORALE_HIT;
            logic.morale.insert(m.def, mor);
            update_morale_bar(&mut b.field.field.scene, &ud.bars, mor, ud.spawn.morale_max);
            labels.push(FloatLabel::damage(&b.field.grid, ud.col, ud.row, 0.0));
            if m.counter {
                set_facing(&mut b.field.field.scene, &ud, m.def_facing);
                let ua = unit(b, m.att).clone();
                if m.kill_att {
                    logic.hp.insert(m.att, 0.0);
                    update_hp_bar(&mut b.field.field.scene, &ua.bars, 0.0, ua.spawn.max_hp);
                    let mut u = ua.clone();
                    assert!(kill_unit(&mut b.field.field.scene, &mut u, false, false));
                    *unit_mut(b, m.att) = u;
                } else {
                    let att_hp = (logic.hp[&m.att] - DMG_COUNTER).max(0.0);
                    logic.hp.insert(m.att, att_hp);
                    update_hp_bar(&mut b.field.field.scene, &ua.bars, att_hp, ua.spawn.max_hp);
                    let mor = logic.morale[&m.att] - MORALE_HIT;
                    logic.morale.insert(m.att, mor);
                    update_morale_bar(&mut b.field.field.scene, &ua.bars, mor, ua.spawn.morale_max);
                    labels.push(FloatLabel::damage(&b.field.grid, ua.col, ua.row, 0.0));
                }
            }
        }
        let ua = unit(b, m.att).clone();
        let st = lunge.step(&mut b.field.field.scene, &ua, *t, !ua.removed);
        finished = st.finished;
    }
    labels
}

struct Worlds {
    events: Vec<Value>,
    p: BattleScene3,
    q: BattleScene3,
}

fn worlds() -> Worlds {
    let d = load();
    let events = d["events"].as_array().expect("events").clone();
    let mut p = build_battle_scene_with_units(opts_of(&d["siege"]));
    replay_moves(&mut p, &events);
    let q = p.clone();
    Worlds { events, p, q }
}

// ------------------------------------------------------------ tests

/// The three lunges of the fixture (`gen_dynamics.ts` part 2:
/// `battleScene.ts:9096-9175`; plain; with counter `:9134-9143`; attacker
/// killed by the counter `:9047` → `_startFade` `:9927-9938`): at every
/// sample the played scene equals the pin-call scene (whole `BattleScene3`),
/// the attacker position equals the web vector, and the blow happens at the
/// sample the web counted it.
#[test]
fn melee_playback_equals_pin_calls_and_web_vectors() {
    let Worlds { events, p, mut q } = worlds();
    let ms = melees(&events);
    assert_eq!(ms.len(), 3);
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let mut p_base = p;
    let mut logic_p = Logic::new(&p_base);
    let mut logic_q = logic_p.clone();
    let mut all_labels_p: Vec<FloatLabel> = Vec::new();
    for (mi, m) in ms.iter().enumerate() {
        let labels_before = pb.labels().len();
        for (acts, fr) in melee_steps(&q, m, &mut logic_q) {
            pb.push_actions(&acts).expect("push actions");
            pb.push_frame(&fr).expect("push frame");
        }
        let mut last_p = None;
        for (k, (t, web_pos, blows, web_finished)) in m.samples.iter().enumerate() {
            pb.play_until(&mut q, *t, 0.0).expect("play");
            // P from the state before this lunge, calls up to sample k.
            let mut p = p_base.clone();
            let mut lp = logic_p.clone();
            let labels = pin_melee(&mut p, m, &mut lp, k);
            assert!(
                p == q,
                "lunge {mi} sample {k} t={t}: playback scene != pin-call scene"
            );
            let pos = pos_of(&q, m.att);
            for (i, (a, w)) in pos.iter().zip(web_pos).enumerate() {
                assert_eq!(
                    a.to_bits(),
                    w.to_bits(),
                    "lunge {mi} t={t} pos[{i}] {a} != web {w}"
                );
            }
            let hit_applied = *t >= m.t0 + BLOW_HIT_T;
            assert_eq!(*blows > 0, hit_applied, "lunge {mi} t={t} blow moment");
            assert_eq!(
                pb.lunges_in_flight() == 0,
                *web_finished,
                "lunge {mi} t={t} finished"
            );
            last_p = Some((p, lp, labels));
        }
        let (p, lp, labels) = last_p.expect("samples");
        assert_eq!(pb.queued(), 0, "lunge {mi}: every item played");
        // `_spawnDamageLabel` count of the web event.
        assert_eq!(
            pb.labels().len() - labels_before,
            m.labels,
            "lunge {mi} labels"
        );
        assert_eq!(labels.len(), m.labels, "lunge {mi} pin labels");
        all_labels_p.extend(labels);
        if m.kill_att {
            // `_removeUnitFromScene` (`:9910-9925`): detached and hidden.
            let u = unit(&q, m.att);
            assert!(u.removed);
            assert!(!q.field.field.scene.nodes[u.group].visible);
            assert!(!q.field.field.scene.nodes[u.bars.group].visible);
            assert_eq!(pb.hp(m.att), Some(0.0));
        }
        p_base = p;
        logic_p = lp;
    }
    // Damage labels against the web `labels` event (the first four labels of
    // the fixture are the three lunges', `_spawnDamageLabel` `:9963-9970`).
    let web = events.iter().find(|e| e["op"] == "labels").expect("labels")["labels"]
        .as_array()
        .expect("arr")
        .clone();
    assert_eq!(pb.labels().len(), 4);
    for (i, (l, pl)) in pb.labels().iter().zip(&all_labels_p).enumerate() {
        assert_eq!(l.label, *pl, "label {i} != pin call");
        let w = &web[i];
        let wp = hx(w[0].as_str().expect("pos"));
        assert_eq!(
            [l.label.world.x, l.label.world.y, l.label.world.z].map(f64::to_bits),
            [wp[0], wp[1], wp[2]].map(f64::to_bits),
            "label {i} world"
        );
        assert_eq!(l.label.start, num(&w[1]));
        assert_eq!(l.label.duration, num(&w[2]));
        assert_eq!(l.label.rise_rate, num(&w[3]));
    }
    // Text and colour input (`:9945`, `:9951`): `'-' + dmg`, player side = atk.
    assert_eq!(pb.labels()[0].text, "-7");
    assert_eq!(pb.labels()[2].text, "-3");
    assert!(pb.labels().iter().all(|l| l.player_side_loss));
}

/// The scene calls of the killing counter (`gen_dynamics.ts` part 2, third
/// lunge) in the order of the pin: attacker turn (`:9104-9105`), lunge start
/// (`:9112-9118`), blow on the defender — HP bar (`:8992`) then label
/// (`:9125`) —, defender turn (`:9137-9138`), the counter kills the
/// attacker — HP bar (`:8992`) then `_startFade` → `_removeUnitFromScene`
/// (`:9047`, `:9933-9937`). `MeleeLunge` comes before `kill_unit`.
#[test]
fn killing_counter_calls_follow_pin_order() {
    let Worlds { events, mut q, .. } = worlds();
    let ms = melees(&events);
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let mut logic = Logic::new(&q);
    // the first two lunges, then the killing one
    for m in &ms {
        for (acts, fr) in melee_steps(&q, m, &mut logic) {
            pb.push_actions(&acts).expect("push");
            pb.push_frame(&fr).expect("frame");
        }
        for (t, ..) in &m.samples {
            pb.play_until(&mut q, *t, 0.0).expect("play");
        }
    }
    let m = &ms[2];
    let calls = pb.calls();
    let start = calls
        .iter()
        .rposition(|c| matches!(c, SceneCall::LungeStart { .. }))
        .expect("lunge");
    let tail: Vec<&SceneCall> = calls[start - 1..]
        .iter()
        .filter(|c| {
            !matches!(
                c,
                SceneCall::Ui { .. } | SceneCall::MoraleBar { .. } | SceneCall::AmmoBar { .. }
            )
        })
        .collect();
    let expect = [
        SceneCall::SetFacing {
            id: m.att,
            dir: m.att_facing,
        },
        SceneCall::LungeStart {
            attacker: m.att,
            target: m.def,
            t0: m.t0,
        },
        SceneCall::HpBar {
            id: m.def,
            hp: logic.hp[&m.def],
        },
        SceneCall::DamageLabel {
            id: m.def,
            dmg: DMG_ATT,
        },
        SceneCall::SetFacing {
            id: m.def,
            dir: m.def_facing,
        },
        SceneCall::HpBar { id: m.att, hp: 0.0 },
        SceneCall::KillUnit {
            id: m.att,
            removed: true,
        },
    ];
    assert_eq!(tail.len(), expect.len(), "calls {tail:?}");
    for (i, (a, e)) in tail.iter().zip(&expect).enumerate() {
        assert_eq!(*a, e, "call {i}");
    }
    // A second `Kill` of the removed unit is the `_startFade` guard no-op (`:9928`).
    pb.push_actions(&[act(30_000.0, BattleActionKindDto::Kill { id: m.att })])
        .expect("push");
    pb.play_until(&mut q, 30_000.0, 0.0).expect("play");
    assert_eq!(
        pb.calls().last(),
        Some(&SceneCall::KillUnit {
            id: m.att,
            removed: false
        })
    );
}

/// The HP bar follows the blow (`_singleBlow` `:8991-8992`), not the frame:
/// with frames only at the phase boundaries (lunge start `t0` and the end of
/// the activation `t0 + BLOW_LUNGE_MS + BLOW_SETTLE_MS`, `:9150-9155`), the
/// bar must already show the new HP between the hit and the end of the
/// phase, and the same HP after it. Morale is kept constant here so the
/// frames change nothing else.
#[test]
fn hp_bar_follows_the_blow_between_frames() {
    let Worlds { events, mut q, .. } = worlds();
    let m = &melees(&events)[0];
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let hp0 = unit(&q, m.def).spawn.hp;
    let max_hp = unit(&q, m.def).spawn.max_hp;
    let mor = |b: &BattleScene3, id| unit(b, id).spawn.morale;
    let hit = m.t0 + BLOW_HIT_T;
    let end = m.t0 + BLOW_LUNGE_MS + BLOW_SETTLE_MS;
    pb.push_frame(&frame(
        m.t0,
        vec![
            frame_unit(&q, m.att, unit(&q, m.att).spawn.hp, mor(&q, m.att)),
            frame_unit(&q, m.def, hp0, mor(&q, m.def)),
        ],
    ))
    .expect("frame");
    pb.push_actions(&[
        act(
            m.t0,
            BattleActionKindDto::Melee {
                attacker: m.att,
                target: m.def,
                hit_at: hit,
            },
        ),
        act(
            hit,
            BattleActionKindDto::Damage {
                target: m.def,
                dmg: DMG_ATT,
            },
        ),
    ])
    .expect("push");
    pb.push_frame(&frame(
        end,
        vec![
            frame_unit(&q, m.att, unit(&q, m.att).spawn.hp, mor(&q, m.att)),
            frame_unit(&q, m.def, hp0 - DMG_ATT, mor(&q, m.def)),
        ],
    ))
    .expect("frame");
    // Pin `_updateHpBar` ratio after the blow (`:9637-9639`).
    let ratio_after = (hp0 - DMG_ATT) / max_hp;
    let bar = |b: &BattleScene3| {
        let u = unit(b, m.def);
        b.field.field.scene.nodes[u.bars.hp_fg].scale.x
    };
    for (t, expect) in [
        (m.t0, 1.0),
        (hit - 0.1, 1.0),
        (hit, ratio_after),
        (m.t0 + 200.5, ratio_after),
        (m.t0 + BLOW_LUNGE_MS, ratio_after),
        (end - 0.5, ratio_after),
        (end, ratio_after),
        (end + 100.0, ratio_after),
    ] {
        pb.play_until(&mut q, t, 0.0).expect("play");
        assert_eq!(bar(&q), expect, "hp bar at t={t}");
    }
    assert_eq!(pb.hp(m.def), Some(hp0 - DMG_ATT));
}

/// A wall-tower shot (`_fireOneTower` `:4223-4270`: projectile from the
/// tower `:4250-4261`, hit after `RANGED_FLY_MS` `:4262-4266`) on a wall with
/// towers (`fortKind = 'mur'`, `_placeSiegeTowers`): the played scene equals
/// the direct `fire_one_tower` + `_tickProjectiles` (`:9627`) calls at every
/// sample, the projectile leaves the scene on landing.
#[test]
fn tower_shot_playback_equals_pin_calls() {
    let d = load();
    let fort = FortDto {
        kind: FortKind::Mur,
        tower_material: Some(TowerMaterial::Kamien),
        tower_rows: vec![67, 73],
    };
    let mut p = build_battle_scene_with_units_fort(opts_of(&d["siege"]), &fort);
    let mut q = p.clone();
    assert_eq!(q.wall.as_ref().expect("wall").towers.len(), 2);
    let kind = tower_projectile_kind(Some("Distance"), Some("Lucznik"));
    let mut pb = BattlePlayback::new(
        &q,
        PlaybackOpts {
            tower_projectile: Some(kind),
        },
    );
    let target = uid("atk0");
    let t0 = 5_000.0;
    let land = t0 + RANGED_FLY_MS;
    pb.push_actions(&[
        act(
            t0,
            BattleActionKindDto::Log {
                text: "Wieza strzelnicza (rzad 67) strzela do X.".into(),
            },
        ),
        act(
            t0,
            BattleActionKindDto::TowerShot {
                row: 67,
                target,
                land_at: land,
            },
        ),
        act(land, BattleActionKindDto::Damage { target, dmg: 4.0 }),
    ])
    .expect("push");
    // P
    let wall_col = p.field.siege.as_ref().expect("siege").wall_col;
    let tower = p.wall.as_ref().expect("wall").towers[0];
    let tu = unit(&p, target).clone();
    let shot = fire_one_tower(
        &mut p.field.field.scene,
        &p.field.grid,
        &tower,
        wall_col,
        false,
        Some(TowerTarget {
            col: tu.col,
            row: tu.row,
            name: "X",
        }),
        kind,
        t0,
    )
    .expect("shot");
    let mut flights = vec![shot.projectile];
    let mut p_hit = false;
    for t in [t0, t0 + 1.0, t0 + 190.0, land - 0.25, land, land + 50.0] {
        tick_projectiles(&mut p.field.field.scene, &mut flights, t);
        if !p_hit && t >= land {
            p_hit = true;
            let hp = (tu.spawn.hp - 4.0).max(0.0);
            update_hp_bar(&mut p.field.field.scene, &tu.bars, hp, tu.spawn.max_hp);
        }
        pb.play_until(&mut q, t, 0.0).expect("play");
        assert!(p == q, "tower shot t={t}: playback scene != pin-call scene");
        assert_eq!(pb.projectiles().len(), flights.len(), "t={t} in flight");
    }
    assert!(flights.is_empty());
    assert_eq!(pb.labels().len(), 1);
    // Note: the web order at landing is `_tickProjectiles` (frame) after the
    // timer drain (`_drainTimers` → blow, `:9616-9634`); the projectile and the
    // HP bar are independent nodes, so the order inside the instant does not
    // change the scene.
}

/// LANDAT-TOWER-BOULDER-Q1 (D-LTB-1): the engine session carries in
/// `TowerShot.landAt` the frame-grid moment of the pin hit
/// (`_schedule(RANGED_FLY_MS)` `:4262` fires in the first 16 ms frame with
/// `vNow >= due`: `t0 + 384`). The playback accepts exactly the nominal
/// `t0 + RANGED_FLY_MS` and `t0 + 384` with the same scene calls and scene (the
/// projectile keeps `dur = RANGED_FLY_MS`, `:4261`); every other moment is
/// `LandAt` and launches nothing.
#[test]
fn landat_tb_tower_shot_on_frame_grid_is_played_like_nominal() {
    let d = load();
    let fort = FortDto {
        kind: FortKind::Mur,
        tower_material: Some(TowerMaterial::Kamien),
        tower_rows: vec![67, 73],
    };
    let base = build_battle_scene_with_units_fort(opts_of(&d["siege"]), &fort);
    let kind = tower_projectile_kind(Some("Distance"), Some("Lucznik"));
    let target = uid("atk0");
    let t0 = 5_000.0;
    let run = |land_at: f64| {
        let mut q = base.clone();
        let mut pb = BattlePlayback::new(
            &q,
            PlaybackOpts {
                tower_projectile: Some(kind),
            },
        );
        pb.push_actions(&[act(
            t0,
            BattleActionKindDto::TowerShot {
                row: 67,
                target,
                land_at,
            },
        )])
        .expect("push");
        let r = pb.play_until(&mut q, t0 + 100.0, 0.0);
        (q, pb, r)
    };
    let (nominal, pb_n, rn) = run(t0 + RANGED_FLY_MS);
    assert_eq!(rn, Ok(()));
    let (grid, pb_g, rg) = run(t0 + 384.0);
    assert_eq!(rg, Ok(()), "frame-grid landing accepted");
    assert_eq!(pb_g.projectiles().len(), 1);
    assert_eq!(pb_g.calls(), pb_n.calls());
    assert!(grid == nominal, "same scene as the nominal landing");
    for off in [0.0, 368.0, 379.0, 381.0, 383.0, 385.0, 396.0, 400.0] {
        let (bad, pb_b, rb) = run(t0 + off);
        assert_eq!(
            rb,
            Err(PlaybackError::LandAt {
                t0,
                land_at: t0 + off
            }),
            "offset {off}"
        );
        assert!(pb_b.projectiles().is_empty(), "offset {off}");
        assert!(bad == base, "offset {off}: nothing reached the scene");
    }
}

/// Frames drive the morale and ammunition bars (`_updateMoraleBar`
/// `:9652-9661`, `_updateAmmoBar` `:9671-9684`) and not the HP bar;
/// `apply_snapshot` resyncs all three (reset paths `:4581-4583`).
#[test]
fn frame_bars_and_snapshot() {
    let Worlds { mut q, .. } = worlds();
    let mut p = q.clone();
    let id = uid("def0");
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let u = unit(&q, id).clone();
    assert!(u.ammo_bar_shown);
    let mut fu = frame_unit(&q, id, 11.0, 40.0);
    fu.ammo_left = Some(1.0);
    pb.push_frame(&frame(10.0, vec![fu])).expect("frame");
    pb.play_until(&mut q, 10.0, 0.0).expect("play");
    update_morale_bar(&mut p.field.field.scene, &u.bars, 40.0, u.spawn.morale_max);
    civ_renderer::battle::units::update_ammo_bar(
        &mut p.field.field.scene,
        &u.bars,
        true,
        1.0,
        u.spawn.ammo_max,
    );
    assert!(p == q, "frame: morale + ammo only");
    assert_eq!(pb.hp(id), Some(u.spawn.hp), "frame does not touch HP");
    pb.apply_snapshot(&mut q, &frame(20.0, vec![fu]))
        .expect("snapshot");
    update_hp_bar(&mut p.field.field.scene, &u.bars, 11.0, u.spawn.max_hp);
    assert!(p == q, "snapshot: HP too");
    assert_eq!(pb.hp(id), Some(11.0));
}

#[test]
fn invalid_steps_are_reported() {
    let Worlds { mut q, .. } = worlds();
    let before = q.clone();
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    let a = uid("atk2");
    let d = uid("atk3");
    // hitAt other than t0 + BLOW_HIT_T (`:9122`)
    pb.push_actions(&[act(
        1.0,
        BattleActionKindDto::Melee {
            attacker: a,
            target: d,
            hit_at: 100.0,
        },
    )])
    .expect("push");
    assert_eq!(
        pb.play_until(&mut q, 1.0, 0.0),
        Err(PlaybackError::HitAt {
            t0: 1.0,
            hit_at: 100.0
        })
    );
    // unknown unit
    let ghost = UnitId::try_new(999_999).expect("id");
    pb.push_actions(&[act(2.0, BattleActionKindDto::Rout { id: ghost })])
        .expect("push");
    assert_eq!(
        pb.play_until(&mut q, 2.0, 0.0),
        Err(PlaybackError::UnknownUnit(ghost))
    );
    // time order
    assert_eq!(
        pb.push_actions(&[act(1.5, BattleActionKindDto::Turn { round_no: 1 })]),
        Err(PlaybackError::OutOfOrder { prev: 2.0, t0: 1.5 })
    );
    // tower shot without the projectile kind / without towers
    pb.push_actions(&[act(
        3.0,
        BattleActionKindDto::TowerShot {
            row: 67,
            target: a,
            land_at: 3.0 + RANGED_FLY_MS,
        },
    )])
    .expect("push");
    assert_eq!(
        pb.play_until(&mut q, 3.0, 0.0),
        Err(PlaybackError::MissingTowerProjectileKind)
    );
    let mut pb2 = BattlePlayback::new(
        &q,
        PlaybackOpts {
            tower_projectile: Some(tower_projectile_kind(None, None)),
        },
    );
    pb2.push_actions(&[act(
        3.0,
        BattleActionKindDto::TowerShot {
            row: 67,
            target: a,
            land_at: 3.0 + RANGED_FLY_MS,
        },
    )])
    .expect("push");
    assert_eq!(
        pb2.play_until(&mut q, 3.0, 0.0),
        Err(PlaybackError::NoTower { row: 67 })
    );
    pb2.push_actions(&[act(
        4.0,
        BattleActionKindDto::TowerShot {
            row: 67,
            target: a,
            land_at: 4.0,
        },
    )])
    .expect("push");
    assert_eq!(
        pb2.play_until(&mut q, 4.0, 0.0),
        Err(PlaybackError::LandAt {
            t0: 4.0,
            land_at: 4.0
        })
    );
    // nothing reached the scene
    assert!(before == q);
    // UI-only actions leave the scene unchanged
    let mut pb3 = BattlePlayback::new(&q, PlaybackOpts::default());
    pb3.push_actions(&[
        act(5.0, BattleActionKindDto::Turn { round_no: 2 }),
        act(5.0, BattleActionKindDto::Rout { id: a }),
        act(
            5.0,
            BattleActionKindDto::End {
                winner: BattleWinner::Atakujacy,
            },
        ),
    ])
    .expect("push");
    pb3.play_until(&mut q, 5.0, 0.0).expect("play");
    assert!(before == q);
    assert_eq!(pb3.calls().len(), 3);
}

/// The three lunges as ONE list of actions (the order of the scene calls of
/// the whole sequence, `validate_actions`), without frames: the queue plays
/// every call at its time and in list order, so the lunge of the killed
/// attacker (`MeleeLunge`, `:9112`) starts before its `kill_unit`
/// (`:9047` → `:9933-9937`) and the sampled positions equal the web vectors.
#[test]
fn one_batch_keeps_list_order_and_web_positions() {
    let Worlds { events, mut q, .. } = worlds();
    let ms = melees(&events);
    let mut logic = Logic::new(&q);
    let mut all = Vec::new();
    for m in &ms {
        for (acts, _) in melee_steps(&q, m, &mut logic) {
            all.extend(acts);
        }
    }
    civ_view_model::battle::validate_actions(&all).expect("valid list");
    let mut pb = BattlePlayback::new(&q, PlaybackOpts::default());
    pb.push_actions(&all).expect("push");
    for (mi, m) in ms.iter().enumerate() {
        for (t, web_pos, ..) in &m.samples {
            pb.play_until(&mut q, *t, 0.0).expect("play");
            let pos = pos_of(&q, m.att);
            for (i, (a, w)) in pos.iter().zip(web_pos).enumerate() {
                assert_eq!(a.to_bits(), w.to_bits(), "lunge {mi} t={t} pos[{i}]");
            }
        }
    }
    assert_eq!(pb.queued(), 0);
    assert_eq!(pb.labels().len(), 4);
    let calls = pb.calls();
    let third = &ms[2];
    let lunge = calls
        .iter()
        .position(|c| {
            *c == SceneCall::LungeStart {
                attacker: third.att,
                target: third.def,
                t0: third.t0,
            }
        })
        .expect("third lunge");
    let kill = calls
        .iter()
        .position(|c| {
            *c == SceneCall::KillUnit {
                id: third.att,
                removed: true,
            }
        })
        .expect("kill");
    assert!(lunge < kill, "MeleeLunge before kill_unit");
    assert!(unit(&q, third.att).removed);
}

/// Obrona r1, zarzut 1 (contract of the P5 driver): in a fast-forward the pin
/// lowers `bu.hp` and calls `_updateHpBar` at every blow (`:8991-8992`) while
/// the engine emits no `Damage` (`_spawnDamageLabel` returns under
/// `_ffActive`, `:9940-9943`). The tracked HP is stale after it: without
/// `apply_snapshot` the next `Damage` shows the wrong bar, with it the bar
/// equals the pin (`_updateHpBar` ratio `:9637-9639`).
#[test]
fn fast_forward_gap_is_closed_by_snapshot() {
    let Worlds { events, q, .. } = worlds();
    let m = &melees(&events)[0];
    let hp0 = unit(&q, m.def).spawn.hp;
    let max_hp = unit(&q, m.def).spawn.max_hp;
    let morale = unit(&q, m.def).spawn.morale;
    let ff_dmg = 5.0;
    let hp_ff = hp0 - ff_dmg;
    let bar = |b: &BattleScene3| {
        let u = unit(b, m.def);
        b.field.field.scene.nodes[u.bars.hp_fg].scale.x
    };
    let dmg = |t0: f64| {
        act(
            t0,
            BattleActionKindDto::Damage {
                target: m.def,
                dmg: DMG_ATT,
            },
        )
    };
    // The fast-forward produced only a frame (no `Damage`).
    let ff_frame = frame(10.0, vec![frame_unit(&q, m.def, hp_ff, morale)]);

    // Without the snapshot: the frame alone does not move the HP bar.
    let mut q1 = q.clone();
    let mut pb1 = BattlePlayback::new(&q1, PlaybackOpts::default());
    pb1.push_frame(&ff_frame).expect("frame");
    pb1.push_actions(&[dmg(20.0)]).expect("push");
    pb1.play_until(&mut q1, 20.0, 0.0).expect("play");
    assert_eq!(
        pb1.hp(m.def),
        Some(hp0 - DMG_ATT),
        "stale HP without snapshot"
    );
    assert_ne!(bar(&q1), (hp_ff - DMG_ATT) / max_hp);

    // With the snapshot at the end of the fast-forward: the pin bar.
    let mut q2 = q.clone();
    let mut pb2 = BattlePlayback::new(&q2, PlaybackOpts::default());
    pb2.apply_snapshot(&mut q2, &ff_frame).expect("snapshot");
    assert_eq!(bar(&q2), hp_ff / max_hp);
    pb2.push_actions(&[dmg(20.0)]).expect("push");
    pb2.play_until(&mut q2, 20.0, 0.0).expect("play");
    assert_eq!(pb2.hp(m.def), Some(hp_ff - DMG_ATT));
    assert_eq!(bar(&q2), (hp_ff - DMG_ATT) / max_hp);
}

/// Obrona r1, zarzut 6: an item the scene cannot represent does not stall
/// the animations in flight; the frame at `now` is stepped like without the
/// error (lunge `MeleeLunge::step`, `stepAnim` `:9119-9156`).
#[test]
fn error_does_not_stall_animations() {
    let Worlds { events, q, .. } = worlds();
    let m = &melees(&events)[0];
    let ghost = UnitId::try_new(999_999).expect("id");
    let melee = act(
        m.t0,
        BattleActionKindDto::Melee {
            attacker: m.att,
            target: m.def,
            hit_at: m.t0 + BLOW_HIT_T,
        },
    );
    let mid = m.t0 + 100.0;
    let mut ok = q.clone();
    let mut pb_ok = BattlePlayback::new(&ok, PlaybackOpts::default());
    pb_ok
        .push_actions(std::slice::from_ref(&melee))
        .expect("push");
    pb_ok.play_until(&mut ok, m.t0, 0.0).expect("play");
    pb_ok.play_until(&mut ok, mid, 0.0).expect("play");

    let mut bad = q.clone();
    let mut pb_bad = BattlePlayback::new(&bad, PlaybackOpts::default());
    pb_bad
        .push_actions(&[melee, act(mid, BattleActionKindDto::Rout { id: ghost })])
        .expect("push");
    pb_bad.play_until(&mut bad, m.t0, 0.0).expect("play");
    assert_eq!(
        pb_bad.play_until(&mut bad, mid, 0.0),
        Err(PlaybackError::UnknownUnit(ghost))
    );
    assert_ne!(pos_of(&bad, m.att), pos_of(&q, m.att), "lunge moved");
    assert!(ok == bad, "same scene as without the error");
    assert_eq!(pb_bad.lunges_in_flight(), pb_ok.lunges_in_flight());
}

// ------------------------------------------------------------ HITAT-FQ-REGRESJA-Q1

/// HITAT-FQ-REGRESJA-Q1 (D-HFQ-1): the pin moment of an event planned `nominal` ms after `t0` at frames of `frame` ms
/// (`_doMeleeAttack` `:9122` first lunge frame with `localT >= BLOW_HIT_T`; `_schedule` / `_drainTimers`
/// `:9595-9634` first frame with `vNow >= due`). Engine twin: `siege_tactics_loop::frame_raf` / `frame_sched`.
#[test]
fn hitat_fq_pin_frame_time_matches_pin_frame_grid() {
    assert_eq!(PIN_FRAME_MS, 16.0, "BATTLE_FRAME_WALL_MS (`:2552`)");
    assert_eq!(pin_frame_time(16.0, BLOW_HIT_T), 160.0);
    assert_eq!(pin_frame_time(16.0, RANGED_FLY_MS), 384.0);
    assert_eq!(
        pin_frame_time(16.0, 240.0),
        240.0,
        "multiple of the frame stays"
    );
    assert_eq!(pin_frame_time(16.0, 1.0), 16.0, "at least one frame");
    assert_eq!(pin_frame_time(32.0, BLOW_HIT_T), 160.0);
    assert_eq!(pin_frame_time(64.0, BLOW_HIT_T), 192.0);
    assert_eq!(
        pin_frame_time(1.0, BLOW_HIT_T),
        BLOW_HIT_T,
        "1 ms frame = nominal"
    );
    assert_eq!(
        pin_frame_time(0.0, BLOW_HIT_T),
        BLOW_HIT_T,
        "frame 0 = nominal"
    );
    assert_eq!(pin_frame_time(-16.0, BLOW_HIT_T), BLOW_HIT_T);
    assert_eq!(pin_frame_time(f64::NAN, BLOW_HIT_T), BLOW_HIT_T);
    assert_eq!(pin_frame_time(16.0, 0.0), 0.0, "zero span stays");
    assert_eq!(pin_frame_time(16.0, -5.0), -5.0);

    let t0 = 137_600.0;
    assert!(is_pin_event_time(t0, BLOW_HIT_T, t0 + 150.0), "nominal");
    assert!(
        is_pin_event_time(t0, BLOW_HIT_T, t0 + 160.0),
        "frame grid (16 ms)"
    );
    for bad in [144.0, 149.0, 151.0, 159.0, 161.0, 166.0, 176.0, 0.0, 310.0] {
        assert!(!is_pin_event_time(t0, BLOW_HIT_T, t0 + bad), "hit {bad}");
    }
    assert!(is_pin_event_time(t0, RANGED_FLY_MS, t0 + 380.0));
    assert!(is_pin_event_time(t0, RANGED_FLY_MS, t0 + 384.0));
    for bad in [368.0, 379.0, 381.0, 383.0, 385.0, 396.0, 400.0] {
        assert!(
            !is_pin_event_time(t0, RANGED_FLY_MS, t0 + bad),
            "land {bad}"
        );
    }
    assert!(!is_pin_event_time(t0, BLOW_HIT_T, f64::NAN));
}

/// HITAT-FQ-REGRESJA-Q1 (D-HFQ-1): regression of `Playback(HitAt { t0: 137600.0, hit_at: 137760.0 })` in the client
/// E2E after FRAME-QUANT: the engine session quantizes the blow to the 16 ms frame (`t0 + 160`), as the pin does
/// (`:9122`, first lunge frame with `localT >= BLOW_HIT_T`). The playback accepts it and gives the same scene as with
/// the nominal `t0 + BLOW_HIT_T`; any other moment is still an error that reaches nothing in the scene.
#[test]
fn hitat_fq_melee_on_frame_grid_is_played_like_nominal() {
    let Worlds { events, q, .. } = worlds();
    let m = &melees(&events)[0];
    let melee = |hit_at: f64| {
        act(
            m.t0,
            BattleActionKindDto::Melee {
                attacker: m.att,
                target: m.def,
                hit_at,
            },
        )
    };
    let run = |hit_at: f64| {
        let mut s = q.clone();
        let mut pb = BattlePlayback::new(&s, PlaybackOpts::default());
        pb.push_actions(&[melee(hit_at)]).expect("push");
        let r = pb.play_until(&mut s, m.t0, 0.0);
        let r2 = pb.play_until(&mut s, m.t0 + 100.0, 0.0);
        (s, pb, r, r2)
    };
    let (nominal, pb_n, rn, rn2) = run(m.t0 + BLOW_HIT_T);
    assert_eq!(rn, Ok(()));
    assert_eq!(rn2, Ok(()));
    let (grid, pb_g, rg, rg2) = run(m.t0 + 160.0);
    assert_eq!(rg, Ok(()), "frame-grid blow accepted");
    assert_eq!(rg2, Ok(()));
    assert_eq!(pb_g.lunges_in_flight(), 1);
    assert_eq!(pb_g.calls(), pb_n.calls());
    assert!(matches!(
        pb_g.calls().last(),
        Some(SceneCall::LungeStart { t0, .. }) if *t0 == m.t0
    ));
    assert!(grid == nominal, "same scene as the nominal blow");
    assert_ne!(pos_of(&grid, m.att), pos_of(&q, m.att), "lunge moved");
    for off in [144.0, 151.0, 159.0, 161.0, 166.0, 176.0, 192.0] {
        let (bad, pb_b, rb, _) = run(m.t0 + off);
        assert_eq!(
            rb,
            Err(PlaybackError::HitAt {
                t0: m.t0,
                hit_at: m.t0 + off
            }),
            "offset {off}"
        );
        assert_eq!(pb_b.lunges_in_flight(), 0, "offset {off}");
        assert!(bad == q, "offset {off}: nothing reached the scene");
    }
}
