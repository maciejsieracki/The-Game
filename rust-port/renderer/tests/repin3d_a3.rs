//! REPIN-3D batch A3 (R-RUSTPORT-REPIN-3D-A3-Q1): breaking a wall tower
//! (`_destroyTowerAtRow`), the tower volley and shot (`_fireSiegeTowers`,
//! `_fireOneTower`, then `_tickProjectiles`), the wall breach on the wall and
//! on the PALISADE (`_breachWallTile`) and the palisade gate (`_breachGate`)
//! of the CURRENT web (`origin/main`, three@0.169.0, node v22.22.0) — against
//! vectors produced by RUNNING `battle/battleScene.ts`
//! (`tests/repin3d_fixtures/gen_a3.ts`, README there; document
//! `dyspozycje/rust-port/p4/P4-REPIN-3D.md` §9).
//!
//! Every scene state is compared as the whole `dumpTree` byte stream (FNV of
//! every node: kind, parent, transforms, world matrix, visibility, material,
//! geometry); rubble pieces and projectiles node by node. The battle logic of
//! the web (`towerMaterialFor`, `towerRows`, `strongestRangedUnitForEra`,
//! `pickTowerTarget`, `wallTileHp`) is replayed as the DTO the web computed.

#![allow(clippy::float_cmp)]

mod repin3d_common;

use civ_renderer::battle::dynamics::{
    breach_gate, breach_wall_tile_fort, tick_projectiles, Projectile, RANGED_FLY_MS,
};
use civ_renderer::battle::field::{carve_wall_tiles, FieldScene, TerrainGrid, BF_COLS, BF_ROWS};
use civ_renderer::battle::siege_towers::{
    destroy_tower_at_row, fire_one_tower, fire_siege_towers, tower_projectile_kind, SiegeTower,
    TowerMaterial, TowerTarget, TOWER_SHOT_Y, TOWER_STAGGER_MS,
};
use civ_renderer::battle::units::{place_siege_wall_fort, FortDto, FortKind, PlacedWall};
use civ_renderer::scene::{NodeId, NodeKind, ROOT};
use repin3d_common::{compare_tree, hex_bytes, load, subtree_world, Bytes, Cmp, Json};

fn index_of(fs: &FieldScene, root: NodeId) -> impl Fn(NodeId) -> i64 + '_ {
    let order: Vec<NodeId> = subtree_world(fs, root)
        .into_iter()
        .map(|(n, _)| n)
        .collect();
    move |n| {
        order
            .iter()
            .position(|&k| k == n)
            .map_or(-1, |i| i64::try_from(i).expect("i64"))
    }
}

fn tiles_fnv(g: &TerrainGrid) -> u32 {
    Bytes(g.tiles.clone()).hash()
}

fn strs(j: &Json) -> Vec<String> {
    j.arr().iter().map(|s| s.str().to_owned()).collect()
}

/// `fortInst(fortKind, civ)` of `gen_a3.ts`: `_carveWallTiles` +
/// `_placeSiegeWall` with the DTO the web computed.
fn fort(d: &Json, case: &Json, c: &mut Cmp, ctx: &str) -> (FieldScene, TerrainGrid, PlacedWall) {
    let mut grid = TerrainGrid::new(BF_COLS, BF_ROWS, hex_bytes(d.get("tilesHex").str()));
    let layout = carve_wall_tiles(&mut grid);
    let la: Vec<i32> = case.get("layout").arr().iter().map(Json::i32).collect();
    c.eq(
        &format!("{ctx} layout"),
        vec![
            layout.wall_col,
            layout.row_lo,
            layout.row_hi,
            layout.gate_row,
        ],
        la,
    );
    let kind = match case.get("fortKind").str() {
        "none" => FortKind::None,
        "mur" => FortKind::Mur,
        "palisada" => FortKind::Palisada,
        k => panic!("fortKind {k}"),
    };
    let tm = case.get("towerMaterial");
    let dto = FortDto {
        kind,
        tower_material: (!tm.is_null()).then(|| match tm.str() {
            "kamien" => TowerMaterial::Kamien,
            "drewno" => TowerMaterial::Drewno,
            m => panic!("material {m}"),
        }),
        tower_rows: case.get("towerRows").arr().iter().map(Json::i32).collect(),
    };
    let mut fs = FieldScene::new();
    let pw =
        place_siege_wall_fort(&mut fs.scene, case.get("civ").str(), &layout, &dto).expect("wall");
    cmp_towers(
        c,
        &format!("{ctx} placed"),
        &fs,
        &pw.towers,
        case.get("placed"),
    );
    (fs, grid, pw)
}

/// `towerState(inst)`: `[row, destroyed, scene index, visible]` per tower.
fn cmp_towers(c: &mut Cmp, ctx: &str, fs: &FieldScene, towers: &[SiegeTower], j: &Json) {
    let idx = index_of(fs, ROOT);
    let w = j.arr();
    c.eq(&format!("{ctx} towers len"), towers.len(), w.len());
    for (i, (t, e)) in towers.iter().zip(w).enumerate() {
        let e = e.arr();
        c.eq(&format!("{ctx} tower {i} row"), t.row, e[0].i32());
        c.eq(
            &format!("{ctx} tower {i} destroyed"),
            t.destroyed,
            e[1].bool(),
        );
        c.eq(
            &format!("{ctx} tower {i} node"),
            t.mesh.map_or(-1, &idx),
            e[2].i64(),
        );
        c.eq(
            &format!("{ctx} tower {i} visible"),
            t.mesh.map(|m| fs.scene.nodes[m].visible),
            (!e[3].is_null()).then(|| e[3].bool()),
        );
    }
}

/// Case 1: `_breachWallTile` sequences on the wall and on the palisade, with
/// the tower on the breached tile (`_destroyTowerAtRow`, `:7563`).
#[test]
fn wall_and_palisade_breach_with_towers_match_web() {
    let d = load("a3.json");
    assert_eq!(d.get("three").str(), "169");
    let cases = d.get("breach").arr();
    assert_eq!(cases.len(), 4);
    let mut c = Cmp::default();
    let (mut broken, mut groups) = (0, 0);
    for case in cases {
        let ctx = format!("{} {}", case.get("fortKind").str(), case.get("civ").str());
        let (mut fs, mut grid, mut pw) = fort(&d, case, &mut c, &ctx);
        let wall_col = case.get("layout").arr()[0].i32();
        for (si, s) in case.get("steps").arr().iter().enumerate() {
            let row = s.get("row").i32();
            let ctx = format!("{ctx} step {si} row {row}");
            let (rubble, label, log) =
                breach_wall_tile_fort(&mut fs.scene, &mut grid, Some(&mut pw), wall_col, row, 0.0);
            c.eq(
                &format!("{ctx} log"),
                log.into_iter().collect::<Vec<_>>(),
                strs(s.get("log")),
            );
            broken += s.get("log").arr().len();
            // `_spawnWallLabel(wallCol, wallRow, …)` once per breach (DOM text → P5)
            let lab = s.get("labels").arr();
            c.eq(&format!("{ctx} labels"), lab.len(), 1);
            c.eq(&format!("{ctx} label col"), wall_col, lab[0].arr()[0].i32());
            c.eq(&format!("{ctx} label row"), row, lab[0].arr()[1].i32());
            c.eq(&format!("{ctx} label duration"), label.duration, 2000.0);
            cmp_towers(&mut c, &ctx, &fs, &pw.towers, s.get("towers"));
            let idx = index_of(&fs, ROOT);
            let segs = pw
                .user_data
                .row_wall_meshes
                .as_ref()
                .and_then(|m| m.iter().find(|(k, _)| *k == f64::from(row)));
            match (segs, s.get("segs")) {
                (None, w) => c.eq(&format!("{ctx} no segs"), true, w.is_null()),
                (Some((_, ids)), w) => {
                    let w = w.arr();
                    c.eq(&format!("{ctx} segs len"), ids.len(), w.len());
                    for (k, (&n, e)) in ids.iter().zip(w).enumerate() {
                        let e = e.arr();
                        let node = &fs.scene.nodes[n];
                        let kind = match node.kind {
                            NodeKind::Group => "Group",
                            NodeKind::Mesh(_) => "Mesh",
                            _ => "other",
                        };
                        if kind == "Group" {
                            groups += 1;
                        }
                        c.eq(&format!("{ctx} seg {k} node"), idx(n), e[0].i64());
                        c.eq(&format!("{ctx} seg {k} kind"), kind, e[1].str());
                        c.eq(&format!("{ctx} seg {k} visible"), node.visible, e[2].bool());
                        c.eq(
                            &format!("{ctx} seg {k} children"),
                            node.children.len() as i64,
                            e[3].i64(),
                        );
                    }
                }
            }
            let wr = s.get("rubble").arr();
            c.eq(&format!("{ctx} rubble len"), rubble.len(), wr.len());
            for (k, (&n, w)) in rubble.iter().zip(wr).enumerate() {
                compare_tree(&mut c, &format!("{ctx} rubble {k}"), &fs, n, false, w);
            }
            c.eq(
                &format!("{ctx} tiles"),
                tiles_fnv(&grid),
                s.get("tilesFnv").u32(),
            );
            compare_tree(
                &mut c,
                &format!("{ctx} scene"),
                &fs,
                ROOT,
                true,
                s.get("scene"),
            );
        }
    }
    assert_eq!(broken, 6, "3 fortified cases × 2 tower rows");
    assert!(groups > 0, "palisade tile groups hidden");
    println!("a3 breach: checks {} scalars {}", c.checks, c.scalars);
    c.finish("a3 breach");
}

/// Case 2: `_breachGate` on the wall and the palisade (+ one gate tile
/// already open, `gateCol < 0`).
#[test]
fn wall_and_palisade_gate_breach_match_web() {
    let d = load("a3.json");
    let cases = d.get("gate").arr();
    assert_eq!(cases.len(), 6);
    let mut c = Cmp::default();
    for case in cases {
        let v = case.get("variant").str();
        let ctx = format!(
            "{} {} {v}",
            case.get("fortKind").str(),
            case.get("civ").str()
        );
        let (mut fs, mut grid, pw) = fort(&d, case, &mut c, &ctx);
        let la: Vec<i32> = case.get("layout").arr().iter().map(Json::i32).collect();
        let (mut gate_col, gate_row) = (la[0], la[3]);
        if v == "one-open" {
            let i = usize::try_from(gate_row * BF_COLS + gate_col).expect("idx");
            grid.tiles[i] = 0;
        }
        if v == "gate-col-neg" {
            gate_col = -1;
        }
        c.eq(
            &format!("{ctx} pre tiles"),
            tiles_fnv(&grid),
            case.get("preTilesFnv").u32(),
        );
        breach_gate(&mut fs.scene, &mut grid, Some(&pw), gate_col, gate_row);
        c.eq(
            &format!("{ctx} tiles"),
            tiles_fnv(&grid),
            case.get("tilesFnv").u32(),
        );
        let order: Vec<NodeId> = subtree_world(&fs, pw.group)
            .into_iter()
            .map(|(n, _)| n)
            .collect();
        c.eq(
            &format!("{ctx} wall nodes"),
            order.len() as i64,
            case.get("wallNodes").i64(),
        );
        let hidden: Vec<i64> = order
            .iter()
            .enumerate()
            .filter(|(_, &n)| !fs.scene.nodes[n].visible)
            .map(|(i, _)| i as i64)
            .collect();
        let web: Vec<i64> = case.get("hidden").arr().iter().map(Json::i64).collect();
        c.eq(&format!("{ctx} hidden"), hidden, web);
        compare_tree(
            &mut c,
            &format!("{ctx} scene"),
            &fs,
            ROOT,
            true,
            case.get("scene"),
        );
    }
    println!("a3 gate: checks {} scalars {}", c.checks, c.scalars);
    c.finish("a3 gate");
}

fn opt_str(j: &Json, k: &str) -> Option<String> {
    j.opt(k)
        .filter(|v| !v.is_null())
        .map(|v| v.str().to_owned())
}

/// Case 3: `_fireSiegeTowers` → `_fireOneTower` → `_tickProjectiles`.
#[test]
#[allow(clippy::too_many_lines)]
fn tower_volley_shot_and_flight_match_web() {
    let d = load("a3.json");
    let cases = d.get("fire").arr();
    assert_eq!(cases.len(), 13);
    assert_eq!(TOWER_STAGGER_MS, 180.0);
    assert_eq!(TOWER_SHOT_Y, 4.2);
    let mut c = Cmp::default();
    let (mut fired, mut kinds) = (0, Vec::new());
    for case in cases {
        let ctx = case.get("id").str().to_owned();
        let (mut fs, grid, mut pw) = fort(&d, case, &mut c, &ctx);
        let wall_col = case.get("layout").arr()[0].i32();
        // pre-state: a tower broken earlier, a tower tile lost (`wallTileHp.delete`)
        let mut pre_log = Vec::new();
        if let Some(n) = case.get("preLog").arr().first() {
            let row = n
                .str()
                .split("rzad ")
                .nth(1)
                .and_then(|s| s.split(')').next())
                .and_then(|s| s.parse::<i32>().ok())
                .expect("row");
            pre_log.extend(destroy_tower_at_row(&mut fs.scene, &mut pw.towers, row));
        }
        c.eq(&format!("{ctx} preLog"), pre_log, strs(case.get("preLog")));
        let drop_row = case.opt("dropRow").filter(|v| !v.is_null()).map(Json::i32);
        cmp_towers(
            &mut c,
            &format!("{ctx} pre"),
            &fs,
            &pw.towers,
            case.get("pre"),
        );
        let sh = case.get("shooter");
        let (typ, jed) = if sh.is_null() {
            (None, None)
        } else {
            (opt_str(sh, "typ"), opt_str(sh, "jednostka"))
        };
        let volley = fire_siege_towers(
            &mut fs.scene,
            &mut pw.towers,
            case.get("finished").bool(),
            !sh.is_null(),
            |r| Some(r) != drop_row,
        );
        let wv = case.get("volley");
        let plan: Vec<f64> = wv.get("plan").arr().iter().map(Json::num).collect();
        c.eq(
            &format!("{ctx} plan"),
            volley.shots.iter().map(|s| s.delay).collect::<Vec<_>>(),
            plan,
        );
        let plan_rows: Vec<i32> = wv.get("planRows").arr().iter().map(Json::i32).collect();
        c.eq(
            &format!("{ctx} plan rows"),
            volley
                .shots
                .iter()
                .map(|s| pw.towers[s.tower].row)
                .collect::<Vec<_>>(),
            plan_rows,
        );
        c.eq(
            &format!("{ctx} volley log"),
            volley.log,
            strs(wv.get("log")),
        );
        cmp_towers(
            &mut c,
            &format!("{ctx} volley"),
            &fs,
            &pw.towers,
            wv.get("towers"),
        );
        compare_tree(
            &mut c,
            &format!("{ctx} volley"),
            &fs,
            ROOT,
            true,
            wv.get("scene"),
        );
        let kind = tower_projectile_kind(typ.as_deref(), jed.as_deref());
        let mut flying: Vec<Projectile> = Vec::new();
        for (plan, s) in volley.shots.iter().zip(case.get("shots").arr()) {
            let k = s.get("k").i64();
            let ctx = format!("{ctx} shot {k}");
            let row = pw.towers[plan.tower].row;
            let mut pre_lines = Vec::new();
            if !s.get("preLines").arr().is_empty() {
                pre_lines.extend(destroy_tower_at_row(&mut fs.scene, &mut pw.towers, row));
            }
            c.eq(
                &format!("{ctx} preLines"),
                pre_lines,
                strs(s.get("preLines")),
            );
            let t0 = s.get("t0").hx()[0];
            c.eq(&format!("{ctx} t0"), t0, 1000.0 + plan.delay);
            let names: Vec<String>;
            let target = if s.get("target").is_null() {
                None
            } else {
                let a = s.get("target").arr();
                names = vec![a[2].str().to_owned()];
                Some(TowerTarget {
                    col: a[0].i32(),
                    row: a[1].i32(),
                    name: &names[0],
                })
            };
            let shot = fire_one_tower(
                &mut fs.scene,
                &grid,
                &pw.towers[plan.tower],
                wall_col,
                s.get("finished").bool(),
                target,
                kind,
                t0,
            );
            c.eq(
                &format!("{ctx} destroyed"),
                pw.towers[plan.tower].destroyed,
                s.get("destroyed").bool(),
            );
            let wp = s.get("proj");
            match shot {
                None => {
                    c.eq(&format!("{ctx} no shot"), true, wp.is_null());
                    c.eq(&format!("{ctx} no log"), 0, s.get("log").arr().len());
                    c.eq(&format!("{ctx} no blow"), 0, s.get("blow").arr().len());
                }
                Some(shot) => {
                    fired += 1;
                    c.eq(
                        &format!("{ctx} log"),
                        vec![shot.log.clone()],
                        strs(s.get("log")),
                    );
                    let blow: Vec<f64> = s.get("blow").arr().iter().map(Json::num).collect();
                    c.eq(&format!("{ctx} blow"), vec![shot.blow_delay], blow);
                    let p = &shot.projectile;
                    compare_tree(
                        &mut c,
                        &format!("{ctx} proj"),
                        &fs,
                        p.node,
                        false,
                        wp.get("tree"),
                    );
                    c.fs(
                        &format!("{ctx} from"),
                        &[p.from.x, p.from.y, p.from.z],
                        &wp.get("from").hx(),
                    );
                    c.fs(
                        &format!("{ctx} to"),
                        &[p.to.x, p.to.y, p.to.z],
                        &wp.get("to").hx(),
                    );
                    c.f(&format!("{ctx} proj t0"), p.t0, wp.get("t0").hx()[0]);
                    c.f(&format!("{ctx} dur"), p.dur, wp.get("dur").hx()[0]);
                    c.eq(&format!("{ctx} dur const"), p.dur, RANGED_FLY_MS);
                    flying.push(shot.projectile);
                }
            }
            cmp_towers(&mut c, &ctx, &fs, &pw.towers, s.get("towers"));
            compare_tree(
                &mut c,
                &format!("{ctx} scene"),
                &fs,
                ROOT,
                true,
                s.get("scene"),
            );
        }
        c.eq(
            &format!("{ctx} shots len"),
            volley.shots.len(),
            case.get("shots").arr().len(),
        );
        if !flying.is_empty() {
            kinds.push(kind);
        }
        for tk in case.get("ticks").arr() {
            let t = tk.get("t").hx()[0];
            let ctx = format!("{ctx} tick {t}");
            tick_projectiles(&mut fs.scene, &mut flying, t);
            let pos: Vec<Vec<f64>> = flying
                .iter()
                .map(|p| {
                    let v = fs.scene.nodes[p.node].position;
                    vec![v.x, v.y, v.z]
                })
                .collect();
            let web: Vec<Vec<f64>> = tk.get("pos").arr().iter().map(Json::hx).collect();
            c.eq(&format!("{ctx} in flight"), pos.len(), web.len());
            for (i, (r, w)) in pos.iter().zip(&web).enumerate() {
                c.fs(&format!("{ctx} pos {i}"), r, w);
            }
            compare_tree(
                &mut c,
                &format!("{ctx} scene"),
                &fs,
                ROOT,
                true,
                tk.get("scene"),
            );
        }
    }
    kinds.sort_by_key(|k| k.web_name());
    kinds.dedup();
    assert_eq!(kinds.len(), 4, "arrow, javelin, pilum, sling: {kinds:?}");
    assert!(fired > 30, "shots fired: {fired}");
    println!(
        "a3 fire: checks {} scalars {} shots {fired}",
        c.checks, c.scalars
    );
    c.finish("a3 fire");
}
