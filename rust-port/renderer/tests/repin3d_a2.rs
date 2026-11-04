//! REPIN-3D batch A2 (R-RUSTPORT-REPIN-3D-A2-Q1): the palisade as a form of
//! the siege wall (`SiegeWallOpts.kind`, `buildPalisade`) and the wall towers
//! (`buildWallTower`, `_placeSiegeTowers`) of the CURRENT web (`origin/main`,
//! three@0.169.0, node v22.22.0) — against vectors produced by RUNNING
//! `battle/siegeWall.ts` and `battle/battleScene.ts`
//! (`tests/repin3d_fixtures/gen_a2.ts`, README there; document
//! `dyspozycje/rust-port/p4/P4-REPIN-3D.md` §8).
//!
//! Every case compares the whole object tree (`dumpTree`: kind, name,
//! parent, transforms, world matrices, visibility, materials, geometry — FNV
//! of the full node byte stream) and the `userData` contract. Any difference
//! fails.

#![allow(clippy::float_cmp)]

mod repin3d_common;

use civ_renderer::battle::field::{FieldScene, SiegeLayout};
use civ_renderer::battle::siege_towers::{build_wall_tower, TowerMaterial, WallTower};
use civ_renderer::battle::siege_wall::{
    attach_row_breach_panels, build_siege_wall_style, build_siege_wall_web_id, SiegeWall,
    SiegeWallOpts, WallKind, WallStyle,
};
use civ_renderer::battle::units::{place_siege_wall, place_siege_wall_fort, FortDto, FortKind};
use civ_renderer::scene::{NodeId, NodeKind, Prim, UserValue, ROOT};
use repin3d_common::{compare_tree, dump_tree, load, subtree_world, Cmp, Json};

fn kind_of(j: &Json) -> Option<WallKind> {
    if j.is_null() {
        return None;
    }
    match j.str() {
        "mur" => Some(WallKind::Mur),
        "palisada" => Some(WallKind::Palisada),
        k => panic!("kind {k}"),
    }
}

fn material_of(s: &str) -> TowerMaterial {
    match s {
        "kamien" => TowerMaterial::Kamien,
        "drewno" => TowerMaterial::Drewno,
        m => panic!("material {m}"),
    }
}

fn fs_of(scene: civ_renderer::scene::Scene) -> FieldScene {
    FieldScene {
        scene,
        ..FieldScene::new()
    }
}

/// Pre-order index of every node of the sub-tree of `root` (= `traverse`).
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

/// `udRecord(g, g)` of `gen_a2.ts` for a wall group.
fn cmp_wall_ud(c: &mut Cmp, ctx: &str, w: &SiegeWall, fs: &FieldScene, root: NodeId, j: &Json) {
    let idx = index_of(fs, root);
    let ud = &w.user_data;
    let keys: Vec<&str> = j.get("keys").arr().iter().map(Json::str).collect();
    c.eq(&format!("{ctx} keys"), ud.keys(), keys);
    c.f(
        &format!("{ctx} wallWalkY"),
        ud.wall_walk_y,
        j.get("wallWalkY").hx()[0],
    );
    c.f(&format!("{ctx} depth"), ud.depth, j.get("depth").hx()[0]);
    c.f(
        &format!("{ctx} gateCenterX"),
        ud.gate_center_x,
        j.get("gateCenterX").hx()[0],
    );
    c.eq(
        &format!("{ctx} gateOpen"),
        ud.gate_open,
        j.get("gateOpen").bool(),
    );
    c.eq(
        &format!("{ctx} gate"),
        idx(ud.gate),
        j.get("gate").get("node").i64(),
    );
    c.eq(
        &format!("{ctx} fortKind"),
        ud.fort_kind.map(WallKind::web_id),
        j.opt("fortKind").map(|v| v.get("s").str()),
    );
    let segs = j.get("wallSegsByLocalX").arr();
    c.eq(
        &format!("{ctx} segs len"),
        ud.wall_segs_by_local_x.len(),
        segs.len(),
    );
    for (i, ((k, n), e)) in ud.wall_segs_by_local_x.iter().zip(segs).enumerate() {
        let e = e.arr();
        c.f(&format!("{ctx} seg[{i}] key"), *k, e[0].hx()[0]);
        c.eq(&format!("{ctx} seg[{i}] node"), idx(*n), e[1].i64());
    }
    for (name, val) in [
        ("rowWallMeshes", &ud.row_wall_meshes),
        ("rowBreachPanels", &ud.row_breach_panels),
    ] {
        let Some(m) = val else {
            c.eq(&format!("{ctx} {name} absent"), true, j.opt(name).is_none());
            continue;
        };
        let wv = j.get(name).arr();
        c.eq(&format!("{ctx} {name} len"), m.len(), wv.len());
        for (i, ((row, ids), e)) in m.iter().zip(wv).enumerate() {
            let e = e.arr();
            c.f(&format!("{ctx} {name}[{i}] row"), *row, e[0].hx()[0]);
            let web: Vec<i64> = e[1].arr().iter().map(Json::i64).collect();
            let rust: Vec<i64> = ids.iter().map(|&n| idx(n)).collect();
            c.eq(&format!("{ctx} {name}[{i}] meshes"), rust, web);
        }
    }
}

fn opts_of(c: &Json, kind: Option<WallKind>) -> SiegeWallOpts {
    let v = c.get("optsHx").hx();
    let mut o = SiegeWallOpts::new(v[0], v[1]).with_kind(kind);
    if let Some(fl) = c.opt("flags") {
        let fl = fl.arr();
        if fl[0].i64() == 1 {
            o.height = Some(v[2]);
        }
        if fl[1].i64() == 1 {
            o.gate_width_tiles = Some(v[3]);
        }
        if fl[2].i64() >= 0 {
            o.owner_color = Some(fl[2].u32());
        }
    } else {
        o.height = Some(v[2]);
        o.gate_width_tiles = Some(v[3]);
    }
    o
}

/// Case 1: Every civ key × kind {absent, `mur`, `palisada`} at the game size.
#[test]
fn walls_every_civ_and_kind_match_web() {
    let d = load("a2.json");
    assert_eq!(d.get("three").str(), "169");
    let cases = d.get("walls").arr();
    assert_eq!(cases.len(), 36, "12 civ keys × 3 kinds");
    let mut c = Cmp::default();
    let mut palisade_sig = None;
    for case in cases {
        let civ = case.get("civ").str();
        let kind = kind_of(case.get("kind"));
        let ctx = format!("{civ}/{}", kind.map_or("absent", WallKind::web_id));
        let opts = opts_of(case, kind);
        let mut w = build_siege_wall_web_id(civ, &opts);
        let style = WallStyle::for_web_id(civ);
        // additive diff: `mur` / absent = the part-1 builder of the civ, palisade whatever the civ
        let want_style = if kind == Some(WallKind::Palisada) {
            WallStyle::Palisada
        } else {
            style
        };
        c.eq(&format!("{ctx} style"), w.style, want_style);
        if kind != Some(WallKind::Palisada) {
            let pin = build_siege_wall_style(style, &SiegeWallOpts::battle(156.0, 1.0));
            c.eq(&format!("{ctx} = part-1 build"), &w, &pin);
        }
        let fs = fs_of(w.scene.clone());
        cmp_wall_ud(
            &mut c,
            &format!("{ctx} build"),
            &w,
            &fs,
            ROOT,
            case.get("ud"),
        );
        attach_row_breach_panels(&mut w, 77.5, 0.0, 155.0, 76.0, 77.0, 1.0);
        cmp_wall_ud(
            &mut c,
            &format!("{ctx} breach"),
            &w,
            &fs,
            ROOT,
            case.get("udBreach"),
        );
        compare_tree(&mut c, &ctx, &fs, ROOT, false, case.get("tree"));
        if kind == Some(WallKind::Palisada) {
            let sig = dump_tree(&fs, ROOT, false).0;
            c.eq(
                &format!("{ctx} palisade = every civ"),
                sig,
                *palisade_sig.get_or_insert(sig),
            );
            // the builder selected directly by style (no `kind`) is the same palisade
            let mut direct =
                build_siege_wall_style(WallStyle::Palisada, &SiegeWallOpts::battle(156.0, 1.0));
            attach_row_breach_panels(&mut direct, 77.5, 0.0, 155.0, 76.0, 77.0, 1.0);
            c.eq(&format!("{ctx} = WallStyle::Palisada"), &direct, &w);
        }
    }
    println!("a2 walls: checks {} scalars {}", c.checks, c.scalars);
    c.finish("a2 walls");
}

/// Poles (cylinders inside a tile group) whose geometry height is not their
/// own `hv` (`position.y · 2`): the `toFixed(3)` geometry-cache hits.
fn cache_hits(w: &SiegeWall) -> i64 {
    let mut n = 0;
    for &seg in &w.scene.nodes[ROOT].children {
        if !matches!(w.scene.nodes[seg].kind, NodeKind::Group) {
            continue;
        }
        for &k in &w.scene.nodes[seg].children {
            if let Some(m) = w.scene.nodes[k].mesh() {
                if let Some(Prim::Cylinder { h, .. }) = m.geo.prim() {
                    if h != w.scene.nodes[k].position.y * 2.0 && !h.is_nan() {
                        n += 1;
                    }
                }
            }
        }
    }
    n
}

/// Case 2: Palisade sweep (brzegi: N−1/N/N+1 around the gate, 0 / negative / NaN
/// sizes, the `toFixed(3)` geometry cache).
#[test]
fn palisade_sweep_matches_web() {
    let d = load("a2.json");
    let cases = d.get("palisades").arr();
    assert_eq!(cases.len(), 20);
    let mut c = Cmp::default();
    let mut hits_total = 0;
    for case in cases {
        let id = case.get("id").str();
        let mut w = build_siege_wall_web_id("zulu", &opts_of(case, Some(WallKind::Palisada)));
        let fs = fs_of(w.scene.clone());
        cmp_wall_ud(
            &mut c,
            &format!("{id} build"),
            &w,
            &fs,
            ROOT,
            case.get("ud"),
        );
        for (bi, b) in case.get("breaches").arr().iter().enumerate() {
            let a = b.get("args").hx();
            attach_row_breach_panels(&mut w, a[0], a[1], a[2], a[3], a[4], a[5]);
            cmp_wall_ud(
                &mut c,
                &format!("{id} breach {bi}"),
                &w,
                &fs,
                ROOT,
                b.get("ud"),
            );
        }
        compare_tree(&mut c, id, &fs, ROOT, false, case.get("tree"));
        let hits = cache_hits(&w);
        c.eq(
            &format!("{id} cache hits"),
            hits,
            case.get("cacheHits").i64(),
        );
        hits_total += hits;
    }
    assert!(hits_total > 0, "the geometry-cache quirk is exercised");
    println!(
        "a2 palisades: checks {} scalars {} cache hits {hits_total}",
        c.checks, c.scalars
    );
    c.finish("a2 palisades");
}

fn cmp_tower_ud(
    c: &mut Cmp,
    ctx: &str,
    t: &WallTower,
    root_ud: &civ_renderer::scene::UserData,
    j: &Json,
) {
    let keys: Vec<&str> = j.get("keys").arr().iter().map(Json::str).collect();
    c.eq(
        &format!("{ctx} keys"),
        keys,
        vec!["towerHeight", "towerTopY"],
    );
    let num = |k: &str| match root_ud.get(k) {
        Some(UserValue::Num(v)) => *v,
        other => panic!("{ctx} {k}: {other:?}"),
    };
    for (k, v) in [
        ("towerHeight", t.tower_height),
        ("towerTopY", t.tower_top_y),
    ] {
        c.f(&format!("{ctx} {k}"), v, j.get(k).hx()[0]);
        c.f(
            &format!("{ctx} {k} (node userData)"),
            num(k),
            j.get(k).hx()[0],
        );
    }
}

/// Case 3: `buildWallTower` for both materials, game size + brzegi (0, negative,
/// NaN, ∞).
#[test]
fn wall_tower_models_match_web() {
    let d = load("a2.json");
    let cases = d.get("towers").arr();
    assert_eq!(cases.len(), 18);
    let mut c = Cmp::default();
    for case in cases {
        let m = material_of(case.get("material").str());
        let a = case.get("args").hx();
        let ctx = format!("{} {:?}", m.web_id(), a);
        let t = build_wall_tower(m, a[0], a[1]);
        let fs = fs_of(t.scene.clone());
        compare_tree(&mut c, &ctx, &fs, ROOT, false, case.get("tree"));
        cmp_tower_ud(
            &mut c,
            &ctx,
            &t,
            &t.scene.nodes[ROOT].user_data,
            case.get("ud"),
        );
    }
    println!("a2 towers: checks {} scalars {}", c.checks, c.scalars);
    c.finish("a2 towers");
}

/// Case 4: `_placeSiegeWall(civ)` → `_placeSiegeTowers` with the DTO the web
/// computed (`fortKind`, `towerMaterialFor`, `towerRows`).
#[test]
fn placed_wall_and_towers_match_web() {
    let d = load("a2.json");
    let cases = d.get("place").arr();
    assert_eq!(cases.len(), 27);
    let mut c = Cmp::default();
    let mut towers_total = 0usize;
    for case in cases {
        let civ = case.get("civ").str();
        let fk = case.get("fortKind").str();
        let ctx = format!("{} {civ} {fk}", case.get("layout").str());
        let a: Vec<i32> = case.get("args").arr().iter().map(Json::i32).collect();
        let layout = SiegeLayout {
            wall_col: a[0],
            row_lo: a[1],
            row_hi: a[2],
            gate_col: a[0],
            gate_row: a[3],
            gate_hp: 400.0,
            gate_open: false,
            wall_tile_hp: Vec::new(),
        };
        let kind = match fk {
            "none" => FortKind::None,
            "mur" => FortKind::Mur,
            "palisada" => FortKind::Palisada,
            k => panic!("fortKind {k}"),
        };
        let tm = case.get("towerMaterial");
        let web_towers = case.get("towers").arr();
        let dto = FortDto {
            kind,
            tower_material: (!tm.is_null()).then(|| material_of(tm.str())),
            tower_rows: web_towers.iter().map(|t| t.arr()[0].i32()).collect(),
        };
        let mut fs = FieldScene::new();
        let pw = place_siege_wall_fort(&mut fs.scene, civ, &layout, &dto);
        compare_tree(
            &mut c,
            &format!("{ctx} scene"),
            &fs,
            ROOT,
            true,
            case.get("scene"),
        );
        let idx = index_of(&fs, ROOT);
        let Some(pw) = pw else {
            c.eq(&format!("{ctx} no wall"), true, case.get("wall").is_null());
            c.eq(&format!("{ctx} no towers"), 0, web_towers.len());
            continue;
        };
        c.eq(&format!("{ctx} fortKind"), pw.fort_kind, kind);
        let wj = case.get("wall");
        c.eq(
            &format!("{ctx} wall node"),
            idx(pw.group),
            wj.get("node").i64(),
        );
        let wall = SiegeWall {
            scene: fs.scene.clone(),
            style: pw.style,
            user_data: pw.user_data.clone(),
        };
        cmp_wall_ud(
            &mut c,
            &format!("{ctx} wall"),
            &wall,
            &fs,
            pw.group,
            wj.get("ud"),
        );
        c.eq(
            &format!("{ctx} towers len"),
            pw.towers.len(),
            web_towers.len(),
        );
        for (i, (t, w)) in pw.towers.iter().zip(web_towers).enumerate() {
            let w = w.arr();
            c.eq(&format!("{ctx} tower {i} row"), t.row, w[0].i32());
            c.eq(
                &format!("{ctx} tower {i} destroyed"),
                t.destroyed,
                w[1].bool(),
            );
            c.eq(
                &format!("{ctx} tower {i} node"),
                t.mesh.map_or(-1, &idx),
                w[2].i64(),
            );
        }
        let sigs = case.get("towerSigs").arr();
        for (i, (t, s)) in pw.towers.iter().zip(sigs).enumerate() {
            let root = t.mesh.expect("mesh");
            c.eq(
                &format!("{ctx} tower {i} sig"),
                dump_tree(&fs, root, false).0,
                s.u32(),
            );
        }
        if let (Some(f), Some(l)) = (pw.towers.first(), pw.towers.last()) {
            compare_tree(
                &mut c,
                &format!("{ctx} towerFirst"),
                &fs,
                f.mesh.expect("m"),
                false,
                case.get("towerFirst"),
            );
            compare_tree(
                &mut c,
                &format!("{ctx} towerLast"),
                &fs,
                l.mesh.expect("m"),
                false,
                case.get("towerLast"),
            );
            let tpl = build_wall_tower(dto.tower_material.expect("material"), 1.0, 2.5);
            let root_ud = &fs.scene.nodes[f.mesh.expect("m")].user_data;
            cmp_tower_ud(
                &mut c,
                &format!("{ctx} clone"),
                &tpl,
                root_ud,
                case.get("towerUd"),
            );
        }
        // three's `clone` shares materials: the distinct materials of the scene
        let mut mats: Vec<usize> = fs
            .scene
            .traverse()
            .into_iter()
            .filter_map(|n| fs.scene.nodes[n].mesh().map(|m| m.material()))
            .collect();
        mats.sort_unstable();
        mats.dedup();
        c.eq(
            &format!("{ctx} materials"),
            mats.len() as i64,
            case.get("materials").i64(),
        );
        towers_total += pw.towers.len();
        // `fortKind = 'none'` is the pin's `place_siege_wall` exactly
        if kind == FortKind::None {
            let mut old = FieldScene::new();
            let pw0 = place_siege_wall(&mut old.scene, civ, &layout).expect("wall");
            c.eq(&format!("{ctx} = place_siege_wall"), &old.scene, &fs.scene);
            c.eq(
                &format!("{ctx} = place_siege_wall ud"),
                &pw0.user_data,
                &pw.user_data,
            );
        }
    }
    assert!(towers_total > 100, "towers placed: {towers_total}");
    println!(
        "a2 place: checks {} scalars {} towers {towers_total}",
        c.checks, c.scalars
    );
    c.finish("a2 place");
}
