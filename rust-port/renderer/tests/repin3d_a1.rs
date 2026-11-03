//! REPIN-3D batch A1 (R-RUSTPORT-REPIN-3D-A-Q1): the battle-3D scene port
//! re-pinned to the CURRENT web (`origin/main`, three@0.169.0, node v22.22.0)
//! for the order queue, attack-move ("Atakuj-marszem") and the immediate
//! removal of killed units — against vectors produced by RUNNING
//! `battle/battleScene.ts` of `origin/main` (`tests/repin3d_fixtures/gen_a1.ts`,
//! README there; document `dyspozycje/rust-port/p4/P4-REPIN-3D.md`).
//!
//! Each case replays the web call on the Rust port and compares the whole
//! scene (`dumpTree`: kind, name, parent, transforms, world matrices,
//! visibility, materials, geometry — FNV of the full node byte stream) plus
//! the order / queue / flag state. Any difference fails.

#![allow(clippy::float_cmp)]

mod repin3d_common;

use civ_renderer::battle::dynamics::{breach_wall_tile, retreat_from_wall, tick_fades, Fade};
use civ_renderer::battle::field::{
    cell_to_world, tile_top_y, FieldScene, TerrainGrid, BF_COLS, BF_ROWS,
};
use civ_renderer::battle::orders::{
    cancel_attack_move_selected, consume_on_activation, issue_attack_move, next_activation,
    QueuedOrders, TurnCandidate,
};
use civ_renderer::battle::units::{
    kill_unit, make_fallback_avatar, make_order_arrow, make_unit_bars,
    refresh_queued_order_visuals, remove_unit_from_scene, side_color, update_hp_bar,
    update_morale_bar, BattleSide, OrderLayer, OrderUnit, PlacedUnit, PlayerOrder, UnitSpawn,
    HPBAR_Y, P3, WALL_WALK_Y,
};
use civ_renderer::scene::ROOT;
use repin3d_common::{compare_tree, dump_tree, hex_bytes, hx, load, Cmp, Json};

fn grid_of(hex: &str) -> TerrainGrid {
    TerrainGrid::new(BF_COLS, BF_ROWS, hex_bytes(hex))
}

/// `orderUnit(tiles, id, side, q, r)` of `gen_a1.ts`.
fn fake(id: &str, side: BattleSide, q: i32, r: i32) -> OrderUnit {
    let (x, z) = cell_to_world(f64::from(q), f64::from(r));
    OrderUnit {
        id: id.to_owned(),
        side,
        col: q,
        row: r,
        x,
        z,
        dead: false,
        removed: false,
        routed: false,
        group_id: None,
        formation_offset: None,
        order: PlayerOrder::None,
    }
}

fn with(mut u: OrderUnit, f: impl FnOnce(&mut OrderUnit)) -> OrderUnit {
    f(&mut u);
    u
}

const fn mv(col: i32, row: i32) -> PlayerOrder {
    PlayerOrder::Move { col, row }
}
const fn am(col: i32, row: i32) -> PlayerOrder {
    PlayerOrder::AttackMove { col, row }
}
fn atk(t: &str) -> PlayerOrder {
    PlayerOrder::Attack { target: t.into() }
}

/// `orderDto` of `gen_a1.ts`; `hold` has no arrow and is `PlayerOrder::None`
/// in the port (units.rs contract), so the web `hold` compares as `none`.
fn order_json(o: &PlayerOrder) -> String {
    match o {
        PlayerOrder::None => "[\"none\"]".into(),
        PlayerOrder::Move { col, row } => format!("[\"move\",{col},{row}]"),
        PlayerOrder::AttackMove { col, row } => format!("[\"attackMove\",{col},{row}]"),
        PlayerOrder::Attack { target } => format!("[\"attack\",\"{target}\"]"),
    }
}
fn web_order_json(w: &Json) -> String {
    let a = w.arr();
    match a[0].str() {
        "none" | "hold" => "[\"none\"]".into(),
        "move" | "attackMove" => format!("[\"{}\",{},{}]", a[0].str(), a[1].i32(), a[2].i32()),
        "attack" => format!("[\"attack\",\"{}\"]", a[1].str()),
        o => panic!("order {o}"),
    }
}
fn compare_orders(c: &mut Cmp, ctx: &str, roster: &[OrderUnit], w: &Json) {
    let rows = w.arr();
    c.eq(&format!("{ctx} len"), roster.len(), rows.len());
    for (u, row) in roster.iter().zip(rows) {
        let a = row.arr();
        c.eq(&format!("{ctx} id"), u.id.as_str(), a[0].str());
        c.eq(
            &format!("{ctx} {} order", u.id),
            order_json(&u.order),
            web_order_json(&a[1]),
        );
    }
}
fn strs(w: &Json) -> Vec<String> {
    w.arr().iter().map(|s| s.str().to_owned()).collect()
}

fn overlay() -> (FieldScene, OrderLayer) {
    let mut fs = FieldScene::new();
    let layer = OrderLayer::create(&mut fs.scene, ROOT);
    (fs, layer)
}

// ---------------------------------------------------------------- 1. arrows

#[test]
fn queued_attack_move_arrows_match_web() {
    let d = load("a1.json");
    assert_eq!(d.get("three").str(), "169");
    let grid = grid_of(d.get("tilesHex").str());
    let mut c = Cmp::default();
    let atk_roster = vec![
        with(fake("a0", BattleSide::Atk, 30, 70), |u| {
            u.order = am(40, 72)
        }),
        with(fake("a1", BattleSide::Atk, 31, 71), |u| {
            u.order = am(31, 71)
        }),
        with(fake("a2", BattleSide::Atk, 32, 72), |u| {
            u.order = mv(20, 90)
        }),
        with(fake("a3", BattleSide::Atk, 33, 73), |u| {
            u.order = am(50, 50);
            u.routed = true;
        }),
        with(fake("a4", BattleSide::Atk, 34, 74), |u| {
            u.order = am(51, 51);
            u.dead = true;
        }),
        with(fake("a5", BattleSide::Atk, 35, 75), |u| u.order = atk("d0")),
        with(fake("a6", BattleSide::Atk, 12, 30), |u| u.order = am(0, 0)),
        with(fake("a7", BattleSide::Atk, 13, 31), |u| {
            u.order = am(BF_COLS - 1, BF_ROWS - 1);
        }),
        with(fake("a8", BattleSide::Atk, 14, 32), |u| {
            u.order = am(52, 52);
            u.removed = true;
        }),
    ];
    let def_roster = vec![
        with(fake("d0", BattleSide::Def, 45, 80), |u| {
            u.order = am(41, 80)
        }),
        with(fake("d1", BattleSide::Def, 46, 81), |u| u.order = atk("a0")),
        with(fake("d2", BattleSide::Def, 47, 60), |u| {
            u.order = am(30, 60)
        }),
        fake("d3", BattleSide::Def, 48, 61),
    ];
    let queued = QueuedOrders::from_ids(["a0", "a6", "d2", "zz"]);
    let cases = d.get("queued").arr();
    assert_eq!(cases.len(), 4);
    for (i, w) in cases.iter().enumerate() {
        let (mut fs, mut layer) = overlay();
        let stale = make_order_arrow(
            &mut fs.scene,
            P3::new(1.0, 0.0, 1.0),
            P3::new(5.0, 0.0, 5.0),
            false,
            true,
        );
        fs.scene.attach(layer.lines, stale);
        layer.queued.push(stale);
        let running = w.get("started").bool() && !w.get("finished").bool();
        let (roster, enemies) = if w.get("player").str() == "atk" {
            (&atk_roster, &def_roster)
        } else {
            (&def_roster, &atk_roster)
        };
        refresh_queued_order_visuals(
            &mut fs.scene,
            &mut layer,
            &grid,
            running,
            roster,
            enemies,
            queued.ids(),
        );
        c.eq(
            &format!("queued {i} arrows"),
            layer.queued.len(),
            usize::try_from(w.get("arrows").i64()).expect("n"),
        );
        compare_tree(
            &mut c,
            &format!("queued {i}"),
            &fs,
            ROOT,
            true,
            w.get("scene"),
        );
    }
    println!("queued: checks {} scalars {}", c.checks, c.scalars);
    c.finish("queued attack-move arrows");
}

// ---------------------------------------------------------------- 2./3. issue + cancel

fn issue_roster() -> (Vec<OrderUnit>, Vec<OrderUnit>) {
    let a = |id: &str, q: i32, r: i32| fake(id, BattleSide::Atk, q, r);
    (
        vec![
            a("a0", 30, 70),
            with(a("a1", 31, 71), |u| u.order = atk("d0")),
            a("a2", 32, 72),
            with(a("a3", 33, 73), |u| u.dead = true),
            with(a("a4", 34, 74), |u| u.removed = true),
            with(a("a5", 35, 75), |u| u.routed = true),
            a("a6", 36, 76), // web `hold` = no arrow = PlayerOrder::None
            with(a("a7", 37, 77), |u| u.order = mv(5, 6)),
        ],
        vec![fake("d0", BattleSide::Def, 50, 70)],
    )
}

#[test]
#[allow(clippy::too_many_lines)]
fn issue_and_cancel_attack_move_match_web() {
    let d = load("a1.json");
    let grid = grid_of(d.get("tilesHex").str());
    let mut c = Cmp::default();
    let cases = d.get("issue").arr();
    assert_eq!(cases.len(), 6);
    for w in cases {
        let id = w.get("id").str();
        let (mut roster, enemies) = issue_roster();
        let (mut fs, mut layer) = overlay();
        let mut queued = QueuedOrders::from_ids(strs(w.get("pre")));
        let ids = strs(w.get("ids"));
        let moves: Vec<(String, i32, i32)> = w
            .get("moves")
            .arr()
            .iter()
            .map(|m| {
                let a = m.arr();
                (a[0].str().to_owned(), a[1].i32(), a[2].i32())
            })
            .collect();
        let mut calls: Vec<String> = Vec::new();
        let mut after_move: Option<Vec<OrderUnit>> = None;
        let issued = issue_attack_move(
            &mut roster,
            &ids,
            w.get("col").i32(),
            w.get("row").i32(),
            w.get("queueOnly").bool(),
            &mut queued,
            |r, col, row, ids| {
                calls.push(format!("orderMove {col} {row} {ids:?}"));
                for (mid, mc, mr) in &moves {
                    if let Some(u) = r.iter_mut().find(|u| &u.id == mid) {
                        if !u.dead && !u.removed {
                            u.order = mv(*mc, *mr);
                        }
                    }
                }
                after_move = Some(r.to_vec());
            },
        );
        if let Some(is) = issued {
            refresh_queued_order_visuals(
                &mut fs.scene,
                &mut layer,
                &grid,
                true,
                &roster,
                &enemies,
                queued.ids(),
            );
            calls.push("refresh".into());
            calls.push(format!("feedback {}", is.feedback));
            if is.execute_now {
                calls.push(format!("execute {ids:?}"));
                calls.push(format!("advance {ids:?}"));
            }
        }
        // the web call log in the same shape
        let mut wcalls: Vec<String> = Vec::new();
        for call in w.get("calls").arr() {
            let a = call.arr();
            match a[0].str() {
                "orderMove" => wcalls.push(format!(
                    "orderMove {} {} {:?}",
                    a[1].i32(),
                    a[2].i32(),
                    strs(&a[3])
                )),
                "refresh" => wcalls.push("refresh".into()),
                "feedback" => wcalls.push(format!("feedback {}", a[1].str())),
                "execute" => wcalls.push(format!("execute {:?}", strs(&a[1]))),
                "advance" => wcalls.push(format!("advance {:?}", strs(&a[1]))),
                "--cancel--" => break,
                o => panic!("call {o}"),
            }
        }
        c.eq(&format!("{id} calls"), calls, wcalls);
        match (&after_move, w.get("afterMove")) {
            (Some(r), wm) if !wm.is_null() => {
                compare_orders(&mut c, &format!("{id} afterMove"), r, wm)
            }
            (None, wm) => c.eq(&format!("{id} afterMove null"), true, wm.is_null()),
            (Some(_), _) => c.eq(&format!("{id} afterMove"), "some", "null"),
        }
        let wi = w.get("issued");
        compare_orders(&mut c, &format!("{id} issued"), &roster, wi.get("orders"));
        c.eq(
            &format!("{id} issued queue"),
            queued.ids().to_vec(),
            strs(wi.get("queued")),
        );
        compare_tree(
            &mut c,
            &format!("{id} issued"),
            &fs,
            ROOT,
            true,
            wi.get("scene"),
        );

        // 3. cancel
        let wc = w.get("cancelled");
        let cancel_ids = strs(wc.get("ids"));
        cancel_attack_move_selected(&mut roster, &cancel_ids, &mut queued);
        refresh_queued_order_visuals(
            &mut fs.scene,
            &mut layer,
            &grid,
            true,
            &roster,
            &enemies,
            queued.ids(),
        );
        compare_orders(
            &mut c,
            &format!("{id} cancelled"),
            &roster,
            wc.get("orders"),
        );
        c.eq(
            &format!("{id} cancelled queue"),
            queued.ids().to_vec(),
            strs(wc.get("queued")),
        );
        compare_tree(
            &mut c,
            &format!("{id} cancelled"),
            &fs,
            ROOT,
            true,
            wc.get("scene"),
        );
    }
    println!("issue/cancel: checks {} scalars {}", c.checks, c.scalars);
    c.finish("issue/cancel attack-move");
}

// ---------------------------------------------------------------- 4. activation queue

#[test]
fn activation_queue_matches_web() {
    let d = load("a1.json");
    let grid = grid_of(d.get("tilesHex").str());
    let mut c = Cmp::default();
    let cases = d.get("activate").arr();
    assert_eq!(cases.len(), 6);
    for w in cases {
        let id = w.get("id").str();
        // turn-order flags of the web snapshot: [id, side, q, r, dead, removed, routed, fadingOut, acted]
        let flags: Vec<(String, [bool; 5])> = w
            .get("order")
            .arr()
            .iter()
            .map(|r| {
                let a = r.arr();
                let b = |k: usize| a[k].i64() == 1;
                (a[0].str().to_owned(), [b(4), b(5), b(6), b(7), b(8)])
            })
            .collect();
        let flag = |uid: &str| flags.iter().find(|(x, _)| x == uid).map(|(_, f)| *f);
        let unit = |uid: &str, side: BattleSide, q: i32, r: i32, o: PlayerOrder| {
            let mut u = with(fake(uid, side, q, r), |u| u.order = o);
            if let Some(f) = flag(uid) {
                u.dead = f[0];
                u.removed = f[1];
                u.routed = f[2];
            }
            u
        };
        let roster = vec![
            unit("a0", BattleSide::Atk, 20, 60, mv(25, 60)),
            unit("a1", BattleSide::Atk, 21, 61, am(26, 61)),
            unit("a2", BattleSide::Atk, 22, 62, mv(27, 62)),
            unit("a3", BattleSide::Atk, 23, 63, am(28, 63)),
            unit("a4", BattleSide::Atk, 24, 64, atk("d1")),
        ];
        let enemies = vec![
            unit("d0", BattleSide::Def, 40, 60, PlayerOrder::None),
            unit("d1", BattleSide::Def, 41, 61, PlayerOrder::None),
        ];
        let order: Vec<TurnCandidate> = flags
            .iter()
            .map(|(uid, f)| TurnCandidate {
                id: uid.clone(),
                dead: f[0],
                removed: f[1],
                fading_out: f[3],
                acted: f[4],
            })
            .collect();
        let mut queued = QueuedOrders::from_ids(strs(w.get("pre")));
        let manual = w.get("manual").bool();
        let mut turn_idx = usize::try_from(w.get("turnIdx").i64()).expect("idx");
        let (mut fs, mut layer) = overlay();
        let mut calls: Vec<String> = Vec::new();
        let refresh = |calls: &mut Vec<String>,
                       fs: &mut FieldScene,
                       layer: &mut OrderLayer,
                       q: &QueuedOrders| {
            calls.push(format!("refresh {:?}", q.ids()));
            refresh_queued_order_visuals(
                &mut fs.scene,
                layer,
                &grid,
                true,
                &roster,
                &enemies,
                q.ids(),
            );
        };
        let next = next_activation(&order, &mut turn_idx, manual, &mut queued);
        if next.refresh {
            refresh(&mut calls, &mut fs, &mut layer, &queued);
        }
        match next.unit {
            None => calls.push("schedule 240".into()),
            Some(i) => {
                calls.push(format!("activate {}", order[i].id));
                if consume_on_activation(manual, &mut queued, &order[i].id) {
                    refresh(&mut calls, &mut fs, &mut layer, &queued);
                }
            }
        }
        let wcalls: Vec<String> = w
            .get("calls")
            .arr()
            .iter()
            .map(|call| {
                let a = call.arr();
                match a[0].str() {
                    "refresh" => format!("refresh {:?}", strs(&a[1])),
                    "activate" => format!("activate {}", a[1].str()),
                    "schedule" => format!("schedule {}", a[1].i64()),
                    o => panic!("call {o}"),
                }
            })
            .collect();
        c.eq(&format!("{id} calls"), calls, wcalls);
        c.eq(
            &format!("{id} turnIdx"),
            turn_idx,
            usize::try_from(w.get("turnIdxAfter").i64()).expect("idx"),
        );
        c.eq(
            &format!("{id} queue"),
            queued.ids().to_vec(),
            strs(w.get("queued")),
        );
        compare_tree(
            &mut c,
            &format!("{id} scene"),
            &fs,
            ROOT,
            true,
            w.get("scene"),
        );
    }
    println!("activate: checks {} scalars {}", c.checks, c.scalars);
    c.finish("activation queue");
}

// ---------------------------------------------------------------- 5./6. scene units

/// One `sceneUnit` of `gen_a1.ts`: fallback avatar then bar stack in the root.
struct SU {
    u: PlacedUnit,
    dead: bool,
    fading_out: bool,
    routed: bool,
}

#[allow(clippy::too_many_arguments)]
fn scene_unit(
    fs: &mut FieldScene,
    grid: &TerrainGrid,
    player: BattleSide,
    id: &str,
    side: BattleSide,
    q: i32,
    r: i32,
    morale: (f64, f64),
    on_wall: bool,
) -> SU {
    let color = if side == BattleSide::Atk {
        0x0022_66cc
    } else {
        0x00cc_4422
    };
    let group = fs.scene.graft(ROOT, make_fallback_avatar(color));
    let bars = make_unit_bars(&mut fs.scene, side_color(side, player), false);
    let (x, z) = cell_to_world(f64::from(q), f64::from(r));
    let top = if on_wall {
        WALL_WALK_Y
    } else {
        tile_top_y(grid, q, r)
    };
    fs.scene.nodes[group].set_pos(x, top, z);
    fs.scene.set_pos(bars.group, x, top + HPBAR_Y, z);
    fs.scene.attach(ROOT, bars.group);
    update_hp_bar(&mut fs.scene, &bars, 7.0, 10.0);
    update_morale_bar(&mut fs.scene, &bars, morale.0, morale.1);
    SU {
        u: PlacedUnit {
            spawn: UnitSpawn {
                id: id.to_owned(),
                side,
                category: "piechota".into(),
                model_name: "Wojownik".into(),
                owner_color: color,
                col: q,
                row: r,
                facing: 0,
                on_wall_walkway: on_wall,
                hp: 7.0,
                max_hp: 10.0,
                morale: morale.0,
                morale_max: morale.1,
                ammo_left: f64::INFINITY,
                ammo_max: f64::INFINITY,
            },
            group,
            bars,
            ammo_bar_shown: false,
            fallback_model: true,
            col: q,
            row: r,
            on_wall_walkway: on_wall,
            removed: false,
        },
        dead: false,
        fading_out: false,
        routed: false,
    }
}

/// `sceneFlags` of `gen_a1.ts`.
fn compare_flags(c: &mut Cmp, ctx: &str, fs: &FieldScene, units: &[SU], w: &Json) {
    let rows = w.arr();
    c.eq(&format!("{ctx} flags len"), units.len(), rows.len());
    for (s, row) in units.iter().zip(rows) {
        let a = row.arr();
        let n = &fs.scene.nodes;
        let rust = (
            s.u.spawn.id.as_str(),
            s.u.removed,
            s.dead,
            s.fading_out,
            n[s.u.group].parent.is_some(),
            n[s.u.group].visible,
            n[s.u.bars.group].parent.is_some(),
            n[s.u.bars.group].visible,
        );
        let web = (
            a[0].str(),
            a[1].i64() == 1,
            a[2].i64() == 1,
            a[3].i64() == 1,
            a[4].i64() == 1,
            a[5].bool(),
            a[6].i64() == 1,
            a[7].bool(),
        );
        c.eq(&format!("{ctx} flags {}", a[0].str()), rust, web);
    }
}

/// Replays a `_updateMoraleBar` log (`[id, hx(morale, moraleMax)]`).
fn replay_morale(fs: &mut FieldScene, units: &[SU], log: &Json) -> usize {
    for e in log.arr() {
        let a = e.arr();
        let v = hx(a[1].str());
        let s = units
            .iter()
            .find(|s| s.u.spawn.id == a[0].str())
            .expect("unit");
        update_morale_bar(&mut fs.scene, &s.u.bars, v[0], v[1]);
    }
    log.arr().len()
}

#[test]
#[allow(clippy::too_many_lines)]
fn killed_units_are_removed_at_once_like_web() {
    let d = load("a1.json");
    let grid = grid_of(d.get("tilesHex").str());
    let k = d.get("kill");
    let mut c = Cmp::default();
    let (mut fs, _layer) = overlay();
    let p = BattleSide::Atk;
    let a = BattleSide::Atk;
    let mut units = vec![
        scene_unit(&mut fs, &grid, p, "k0", a, 30, 70, (30.0, 40.0), false),
        scene_unit(&mut fs, &grid, p, "k1", a, 31, 70, (30.0, 40.0), false),
        scene_unit(&mut fs, &grid, p, "k2", a, 32, 70, (30.0, 40.0), false),
        scene_unit(&mut fs, &grid, p, "k3", a, 33, 70, (30.0, 40.0), false),
        scene_unit(&mut fs, &grid, p, "k4", a, 34, 70, (30.0, 40.0), false),
        scene_unit(&mut fs, &grid, p, "k5", a, 35, 71, (30.0, 40.0), false),
        scene_unit(&mut fs, &grid, p, "k6", a, 36, 71, (33.0, 48.0), false),
        scene_unit(&mut fs, &grid, p, "k7", a, 37, 71, (30.0, 40.0), false),
        scene_unit(
            &mut fs,
            &grid,
            p,
            "e0",
            BattleSide::Def,
            50,
            70,
            (50.0, 60.0),
            false,
        ),
    ];
    units[1].dead = true;
    units[2].fading_out = true;
    units[4].routed = true;
    // k3 removed earlier (`_removeUnitFromScene`: removed + dead, not fading)
    remove_unit_from_scene(&mut fs.scene, &mut units[3].u);
    units[3].dead = true;
    compare_tree(&mut c, "before", &fs, ROOT, true, k.get("before"));
    let steps = k.get("steps").arr();
    assert_eq!(steps.len(), 7);
    for (i, w) in steps.iter().enumerate() {
        let id = w.get("id").str();
        let ctx = format!("step {i} {id}");
        replay_morale(&mut fs, &units, w.get("morale"));
        let s = units.iter_mut().find(|s| s.u.spawn.id == id).expect("unit");
        let removed_now = kill_unit(&mut fs.scene, &mut s.u, s.dead, s.fading_out);
        if removed_now {
            // `_removeUnitFromScene`: dead = true, fadingOut = false
            s.dead = true;
            s.fading_out = false;
        }
        c.eq(
            &format!("{ctx} removedNow"),
            removed_now,
            w.get("removedNow").i64() == 1,
        );
        compare_flags(&mut c, &ctx, &fs, &units, w.get("flags"));
        let (sig, nodes) = dump_tree(&fs, ROOT, true);
        let ws = w.get("summary");
        c.eq(
            &format!("{ctx} summary"),
            (nodes.len(), sig),
            (
                usize::try_from(ws.get("n").i64()).expect("n"),
                ws.get("sig").u32(),
            ),
        );
    }
    compare_tree(&mut c, "after", &fs, ROOT, true, k.get("after"));
    // `_tickFades` on the current web: `fadingUnits` has no writer any more
    // (main :2601 is the only assignment), so ticks change nothing.
    let placed: Vec<PlacedUnit> = units.iter().map(|s| s.u.clone()).collect();
    let mut fades: Vec<(usize, Fade)> = Vec::new();
    for w in k.get("fades").arr() {
        let a = w.arr();
        tick_fades(&mut fs.scene, &placed, &mut fades, a[0].num());
        c.eq(
            "fades len",
            fades.len(),
            usize::try_from(a[1].i64()).expect("n"),
        );
        c.eq("fades sig", dump_tree(&fs, ROOT, true).0, a[2].u32());
    }
    c.f(
        "DEATH_FADE_MS",
        civ_renderer::battle::dynamics::DEATH_FADE_MS,
        hx(k.get("deathFadeMs").str())[0],
    );
    println!("kill: checks {} scalars {}", c.checks, c.scalars);
    c.finish("kill");
}

#[test]
#[allow(clippy::too_many_lines)]
fn wall_breach_removes_defender_catapult_like_web() {
    let d = load("a1.json");
    let b = d.get("breach");
    let mut grid = grid_of(b.get("tilesHex").str());
    let wall_col = b.get("wallCol").i32();
    let mut c = Cmp::default();
    let (mut fs, _layer) = overlay();
    let p = BattleSide::Def;
    let df = BattleSide::Def;
    let m = (30.0, 40.0);
    let mut units = vec![
        scene_unit(&mut fs, &grid, p, "c0", df, wall_col, 70, m, true),
        scene_unit(&mut fs, &grid, p, "w1", df, wall_col, 72, m, true),
        scene_unit(&mut fs, &grid, p, "w2", df, wall_col, 74, m, true),
        scene_unit(&mut fs, &grid, p, "w3", df, wall_col, 76, m, true),
        scene_unit(&mut fs, &grid, p, "c4", df, wall_col, 78, m, true),
        scene_unit(&mut fs, &grid, p, "g5", df, 41, 74, m, false),
        scene_unit(&mut fs, &grid, p, "g6", df, 45, 70, m, false),
    ];
    units[4].dead = true;
    units[6].routed = true;
    let attacker = scene_unit(&mut fs, &grid, p, "x0", BattleSide::Atk, 20, 70, m, false);
    let breaches = b.get("breaches").arr();
    assert_eq!(breaches.len(), 6);
    let mut morale_calls = 0;
    for (i, w) in breaches.iter().enumerate() {
        let row = w.get("row").i32();
        let ctx = format!("breach {i} row {row}");
        // no wall group (`siegeWallGroup = null`): tile -> Plains, label, no rubble
        let (rubble, _label) = breach_wall_tile(&mut fs.scene, &mut grid, None, wall_col, row, 0.0);
        c.eq(&format!("{ctx} rubble"), rubble.len(), 0);
        for ch in w.get("changed").arr() {
            let a = ch.arr();
            let s = units
                .iter_mut()
                .find(|s| s.u.spawn.id == a[0].str())
                .expect("unit");
            match a[1].str() {
                "killed" => {
                    assert!(kill_unit(&mut fs.scene, &mut s.u, s.dead, s.fading_out));
                    s.dead = true;
                }
                "moved" => {
                    retreat_from_wall(&mut fs.scene, &grid, &mut s.u, a[2].i32(), a[3].i32())
                }
                o => panic!("change {o}"),
            }
        }
        morale_calls += replay_morale(&mut fs, &units, w.get("morale"));
        compare_flags(&mut c, &ctx, &fs, &units, w.get("flags"));
        compare_tree(&mut c, &ctx, &fs, ROOT, true, w.get("scene"));
        c.eq(
            &format!("{ctx} tiles"),
            grid.tiles.clone(),
            hex_bytes(w.get("tilesHex").str()),
        );
    }
    assert!(morale_calls > 0 && !attacker.u.removed);
    println!("breach: checks {} scalars {}", c.checks, c.scalars);
    c.finish("breach");
}
