//! REPIN-3D batch A5 (R-RUSTPORT-REPIN-3D-A5-Q1): picking and the camera
//! against the NEW scene elements of the current web — palisade
//! (`kind: 'palisada'`), wall towers (`_placeSiegeTowers`) and `fortKind`.
//!
//! Vectors: `tests/repin3d_fixtures/a5.json` from `gen_a5.ts` (the REAL web of
//! `origin/main`, bundled by `tests/fixtures/battle3d/build_picking.mjs`). The
//! scene is rebuilt from the web DTO with
//! [`build_battle_scene_with_units_fort`] (A4), the camera is driven like the
//! web (`_syncRendererSize`, `camTarget` / `camDist` + `_applyCamera`, render)
//! and every recorded client pixel is replayed through the Rust pickers.
//!
//! Per ray `[ground, fromMeshes, fromPlane, unit, nGround, nUnit, nTower, nWall]`
//! must be equal and the pose FNV over every hit (ground meshes, live unit
//! groups, the tower clones and `siegeWallGroup`, each with distance / point /
//! `traverse` index) bit for bit. The tower / wall intersections are NOT part
//! of any web picker (`_pickGroundTile`, `_pickUnitAtScreen`, `_onBattleClick`
//! pick from `_battleGroundPickMeshes` and the live unit groups only); they
//! are measured to show that those elements DO lie on the rays and still
//! neither occlude nor are picked — in the web and in Rust alike.
//!
//! Poses per case (`none` / `palisada` / `mury`): `gate` (grid, every unit,
//! gate tile rows N−1 / N / N+1), `tower<i>` (first / middle / last tower:
//! base, +1, +3 up, wall tiles of rows N−1 / N / N+1), `edges` (client pixels
//! at rect border −1 / 0 / +1 and NaN / ±Infinity) and `relief` (tile kinds
//! changed without rebuilding the ground meshes; grid + rays near every
//! changed tile's border, so the plane pick and the mesh pick disagree in
//! both directions).

#![allow(clippy::float_cmp)]

mod repin3d_common;

use civ_renderer::battle::field::{BattleSceneOpts, TerrainGrid, BF_COLS, BF_ROWS, TILE_S};
use civ_renderer::battle::picking::{
    battle_pick_mesh_up_normal, intersect_objects, pick_ground_tile_at,
    pick_ground_tile_from_meshes, pick_ground_tile_plane, pick_unit_at_screen, Occupancy,
    PickScene, PickUnit, RayCamera,
};
use civ_renderer::battle::units::{
    build_battle_scene_with_units_fort, siege_wall_civ, BattleScene3, BattleSide, BattleUnitsOpts,
    FortDto, FortKind, UnitSpawn,
};
use civ_renderer::battle::view::{BattleView, Canvas};
use civ_renderer::battle::TowerMaterial;
use civ_renderer::pick::three::Vec3;
use civ_renderer::scene::{NodeId, ROOT};
use repin3d_common::{hx, load, Bytes, Cmp, Json};

/// A JSON number, or the binary64 bits of a non-finite / `-0` value.
fn num(w: &Json) -> f64 {
    match w {
        Json::Str(s) => hx(s)[0],
        other => other.num(),
    }
}

fn side_of(s: &str) -> BattleSide {
    match s {
        "atk" => BattleSide::Atk,
        "def" => BattleSide::Def,
        other => panic!("side {other}"),
    }
}

fn rle_grid(w: &Json) -> TerrainGrid {
    let mut tiles = Vec::new();
    for pair in w.arr().chunks(2) {
        let k = u8::try_from(pair[0].i64()).expect("kind");
        let n = usize::try_from(pair[1].i64()).expect("count");
        tiles.extend(std::iter::repeat_n(k, n));
    }
    assert_eq!(
        tiles.len(),
        usize::try_from(BF_COLS * BF_ROWS).expect("len")
    );
    TerrainGrid::new(BF_COLS, BF_ROWS, tiles)
}

fn spawn_of(row: &Json) -> UnitSpawn {
    let a = row.arr();
    let v: Vec<f64> = a[9].arr().iter().map(num).collect();
    UnitSpawn {
        id: a[0].str().to_owned(),
        side: side_of(a[1].str()),
        col: a[2].i32(),
        row: a[3].i32(),
        facing: a[4].i32(),
        on_wall_walkway: a[5].i64() == 1,
        category: a[6].str().to_owned(),
        model_name: a[7].str().to_owned(),
        owner_color: a[8].u32(),
        hp: v[0],
        max_hp: v[1],
        morale: v[2],
        morale_max: v[3],
        ammo_left: v[4],
        ammo_max: v[5],
    }
}

/// The `fort` record of `gen_a5.ts` → [`FortDto`] (`fortKind`,
/// `towerMaterialFor(fortKind)`, the rows of `_placeSiegeTowers`).
fn fort_of(w: &Json) -> FortDto {
    let kind = match w.get("kind").str() {
        "none" => FortKind::None,
        "palisada" => FortKind::Palisada,
        "mur" => FortKind::Mur,
        other => panic!("fortKind {other}"),
    };
    let tower_material = match w.get("material") {
        Json::Null => None,
        m => Some(match m.str() {
            "drewno" => TowerMaterial::Drewno,
            "kamien" => TowerMaterial::Kamien,
            other => panic!("material {other}"),
        }),
    };
    FortDto {
        kind,
        tower_material,
        tower_rows: w
            .get("towers")
            .arr()
            .iter()
            .map(|t| t.get("row").i32())
            .collect(),
    }
}

fn build(rec: &Json, fort: &FortDto) -> BattleScene3 {
    let siege = rec.get("siege");
    assert!(rec.get("deploy").is_null() && rec.get("moves").arr().is_empty());
    let opts = BattleUnitsOpts {
        field: BattleSceneOpts {
            grid: rle_grid(rec.get("tilesRle")),
            desert_palette: rec.get("desert").bool(),
            siege: true,
            deploy: None,
        },
        siege_civ: siege_wall_civ(siege.opt("civ").map(Json::str), None).to_owned(),
        player_side: side_of(rec.get("player").str()),
        units: rec.get("spawn").arr().iter().map(spawn_of).collect(),
    };
    build_battle_scene_with_units_fort(opts, fort)
}

/// `camNums` of `gen_picking.ts` / `battle3d_picking.rs`.
fn cam_sig(v: &BattleView) -> u32 {
    let c = &v.camera;
    let mut f = Bytes::default();
    for x in [
        c.target.x,
        c.target.y,
        c.target.z,
        c.dist,
        c.dist_target,
        c.dist_min,
        c.dist_max,
        c.position.x,
        c.position.y,
        c.position.z,
        c.quaternion.x,
        c.quaternion.y,
        c.quaternion.z,
        c.quaternion.w,
        c.rotation.x,
        c.rotation.y,
        c.rotation.z,
        c.aspect,
    ] {
        f.f64(x);
    }
    for m in [
        &v.matrix_world,
        &v.matrix_world_inverse,
        &v.projection,
        &v.projection_inverse,
    ] {
        for x in m.e {
            f.f64(x);
        }
    }
    f.hash()
}

fn tcode(t: Option<(i32, i32)>) -> i64 {
    t.map_or(-1, |(c, r)| i64::from(c) * 1000 + i64::from(r))
}

fn idx_code(i: Option<usize>) -> i64 {
    i.map_or(-1, |i| i64::try_from(i).expect("i64"))
}

fn n_code(n: usize) -> i64 {
    i64::try_from(n).expect("n")
}

struct World {
    b: BattleScene3,
    view: BattleView,
    canvas: Canvas,
    occ: Occupancy,
}

impl World {
    fn units(&self) -> Vec<PickUnit<'_>> {
        self.b
            .atk
            .iter()
            .chain(self.b.def.iter())
            .map(|u| PickUnit {
                unit: u,
                dead: false,
                fading_out: false,
                removed: false,
                routed: false,
            })
            .collect()
    }
    fn towers(&self) -> Vec<NodeId> {
        self.b
            .wall
            .as_ref()
            .map(|w| w.towers.iter().filter_map(|t| t.mesh).collect())
            .unwrap_or_default()
    }
    /// `camTarget.set(x, 0, z); camDist = camDistTarget = dist; _applyCamera(); render`.
    fn set_cam(&mut self, x: f64, z: f64, dist: f64) {
        let c = &mut self.view.camera;
        c.target = Vec3::new(x, 0.0, z);
        c.dist = dist;
        c.dist_target = dist;
        self.view.apply_camera();
        self.view.render();
    }
}

/// `pickRay` of `gen_a5.ts`.
fn pick_ray(w: &mut World, ps: &PickScene<'_>, cx: f64, cy: f64, f: &mut Bytes) -> Vec<i64> {
    let all = w.units();
    let canvas = w.canvas;
    let grid = &w.b.field.grid;
    let mut view = w.view.clone();
    let Some(ray) = view.ray_from_canvas(cx, cy, &canvas) else {
        f.u32(0xdead);
        let g = pick_ground_tile_at(&mut view, ps, grid, (cx, cy), &canvas);
        let u = pick_unit_at_screen(&mut view, ps, grid, &all, &w.occ, (cx, cy), &canvas);
        return vec![tcode(g), -1, -1, idx_code(u), -1, -1, -1, -1];
    };
    for v in [
        ray.origin.x,
        ray.origin.y,
        ray.origin.z,
        ray.direction.x,
        ray.direction.y,
        ray.direction.z,
    ] {
        f.f64(v);
    }
    let cam = RayCamera::of(&view);
    let meshes = &ps.fs.ground_pick;
    let from_meshes = pick_ground_tile_from_meshes(ps, &ray, &cam, grid, meshes);
    let from_plane = pick_ground_tile_plane(&ray, grid);
    let gh = intersect_objects(ps, &ray, &cam, meshes, false);
    f.u32(u32::try_from(gh.len()).expect("n"));
    for h in &gh {
        for v in [h.distance, h.point.x, h.point.y, h.point.z] {
            f.f64(v);
        }
        f.f64(battle_pick_mesh_up_normal(ps, h));
        f.u32(u32::try_from(ps.traverse_index(h.object)).expect("idx"));
        f.u32(
            h.instance
                .map_or(0xffff_ffff, |i| u32::try_from(i).expect("i")),
        );
    }
    let live: Vec<NodeId> = all
        .iter()
        .filter(|u| u.live())
        .map(|u| u.unit.group)
        .collect();
    let mut hit_list = |objects: &[NodeId]| -> usize {
        let hs = intersect_objects(ps, &ray, &cam, objects, true);
        f.u32(u32::try_from(hs.len()).expect("n"));
        for h in &hs {
            for v in [h.distance, h.point.x, h.point.y, h.point.z] {
                f.f64(v);
            }
            f.u32(u32::try_from(ps.traverse_index(h.object)).expect("idx"));
        }
        hs.len()
    };
    let n_unit = hit_list(&live);
    let n_tower = hit_list(&w.towers());
    let n_wall = match &w.b.wall {
        Some(wall) => n_code(hit_list(&[wall.group])),
        None => {
            f.u32(0);
            -1
        }
    };
    let ground = pick_ground_tile_at(&mut view, ps, grid, (cx, cy), &canvas);
    let unit = pick_unit_at_screen(&mut view, ps, grid, &all, &w.occ, (cx, cy), &canvas);
    vec![
        tcode(ground),
        tcode(from_meshes),
        tcode(from_plane),
        idx_code(unit),
        n_code(gh.len()),
        n_code(n_unit),
        n_code(n_tower),
        n_wall,
    ]
}

#[derive(Default)]
struct Stats {
    rays: usize,
    tower_hit: usize,
    tower_hit_unit: usize,
    wall_hit: usize,
    nan_rays: usize,
    plane_wins: usize,
    mesh_wins: usize,
}

/// Replays a list of `[hex(cx, cy), ...record]` rays (or `null`).
fn replay(
    c: &mut Cmp,
    w: &mut World,
    ps: &PickScene<'_>,
    ctx: &str,
    list: &Json,
    f: &mut Bytes,
    st: &mut Stats,
) {
    for (i, r) in list.arr().iter().enumerate() {
        if r.is_null() {
            continue;
        }
        let a = r.arr();
        let xy = a[0].hx();
        let got = pick_ray(w, ps, xy[0], xy[1], f);
        let want: Vec<i64> = a[1..].iter().map(Json::i64).collect();
        st.rays += 1;
        if want[6] > 0 {
            st.tower_hit += 1;
            if want[3] >= 0 {
                st.tower_hit_unit += 1;
            }
        }
        if want[7] > 0 {
            st.wall_hit += 1;
        }
        if !xy[0].is_finite() || !xy[1].is_finite() {
            st.nan_rays += 1;
        }
        if want[1] >= 0 && want[2] >= 0 && want[1] != want[2] {
            if want[0] == want[2] {
                st.plane_wins += 1;
            } else {
                st.mesh_wins += 1;
            }
        }
        c.eq(&format!("{ctx} ray {i}"), got, want);
    }
}

/// Client pixels of a world point (`worldToClientPx` after `updateMatrixWorld(true)`).
fn client_px(w: &mut World, p: Vec3) -> Option<(f64, f64)> {
    w.view.update_matrix_world();
    w.view.world_to_client_px(p, &w.canvas)
}

/// The aimed pixels recorded by the web equal Rust's projection bit for bit.
fn check_aim(c: &mut Cmp, ctx: &str, got: Option<(f64, f64)>, want: &Json) {
    match (got, want.is_null()) {
        (None, true) => {}
        (Some((x, y)), false) => c.fs(ctx, &[x, y], &want.arr()[0].hx()),
        (g, _) => c.err(format!("{ctx}: rust {g:?} web {want:?}")),
    }
}

#[test]
#[allow(clippy::too_many_lines)]
fn fort_picking_matches_web() {
    let d = load("a5.json");
    let rect: Vec<f64> = d.get("rect").arr().iter().map(num).collect();
    let mut c = Cmp::default();
    let mut st = Stats::default();
    let mut n_poses = 0usize;
    for case in d.get("cases").arr() {
        let id = case.get("id").str().to_owned();
        let fort_w = case.get("fort");
        let fort = fort_of(fort_w);
        let b = build(case.get("rec"), &fort);
        let lay = b.field.siege.clone().expect("siege");
        c.eq(
            &format!("{id} wallCol"),
            lay.wall_col,
            case.get("wallCol").i32(),
        );
        c.eq(
            &format!("{id} gateRow"),
            lay.gate_row,
            case.get("gateRow").i32(),
        );
        // the tower clones: same rows, same index among the scene root's children
        let wall = b.wall.as_ref().expect("wall");
        let wt = fort_w.get("towers").arr();
        c.eq(&format!("{id} towers n"), wall.towers.len(), wt.len());
        for (i, (t, x)) in wall.towers.iter().zip(wt).enumerate() {
            c.eq(&format!("{id} tower {i} row"), t.row, x.get("row").i32());
            let ix = t.mesh.map_or(-1, |m| {
                b.field.field.scene.nodes[ROOT]
                    .children
                    .iter()
                    .position(|&k| k == m)
                    .map_or(-1, n_code)
            });
            c.eq(&format!("{id} tower {i} index"), ix, x.get("index").i64());
        }
        let ids: Vec<String> = b
            .atk
            .iter()
            .chain(b.def.iter())
            .map(|u| u.spawn.id.clone())
            .collect();
        let mut occ = Occupancy::new();
        for e in case.get("occ").arr() {
            let a = e.arr();
            let mut it = a[0].str().split(',');
            let col: i32 = it.next().expect("c").parse().expect("int");
            let row: i32 = it.next().expect("r").parse().expect("int");
            let i = ids.iter().position(|x| x == a[1].str()).expect("occ id");
            occ.insert((col, row), i);
        }
        let view = BattleView::new(b.field.camera, (300.0, 150.0));
        let mut w = World {
            b,
            view,
            canvas: Canvas::new(rect[0], rect[1], rect[2], rect[3]),
            occ,
        };
        let canvas = w.canvas;
        w.view.sync_renderer_size(&canvas);
        w.view.render();
        let fs = w.b.field.field.clone();
        let ps = PickScene::new(&fs);
        let gate_target = (
            f64::from(lay.wall_col) * TILE_S - 3.0,
            f64::from(lay.gate_row) * TILE_S,
        );
        for pose in case.get("poses").arr() {
            n_poses += 1;
            let name = format!("{id} {}", pose.get("name").str());
            let mut f = Bytes::default();
            match pose.get("name").str() {
                "gate" => {
                    w.set_cam(gate_target.0, gate_target.1, 9.0);
                    c.eq(
                        &format!("{name} cam"),
                        cam_sig(&w.view),
                        pose.get("cam").u32(),
                    );
                    replay(
                        &mut c,
                        &mut w,
                        &ps,
                        &format!("{name} grid"),
                        pose.get("grid"),
                        &mut f,
                        &mut st,
                    );
                    // the aimed pixels themselves (group + 0.5 up)
                    let aimed = pose.get("aimed").arr();
                    c.eq(&format!("{name} aimed n"), aimed.len(), ids.len());
                    let groups: Vec<NodeId> =
                        w.b.atk
                            .iter()
                            .chain(w.b.def.iter())
                            .map(|u| u.group)
                            .collect();
                    for (ui, (g, a)) in groups.iter().zip(aimed).enumerate() {
                        let p = fs.scene.nodes[*g].position;
                        let got = client_px(&mut w, Vec3::new(p.x, p.y + 0.5, p.z));
                        check_aim(&mut c, &format!("{name} aimed {ui} px"), got, a);
                    }
                    replay(
                        &mut c,
                        &mut w,
                        &ps,
                        &format!("{name} aimed"),
                        pose.get("aimed"),
                        &mut f,
                        &mut st,
                    );
                    replay(
                        &mut c,
                        &mut w,
                        &ps,
                        &format!("{name} gate"),
                        pose.get("gate"),
                        &mut f,
                        &mut st,
                    );
                }
                "edges" => {
                    w.set_cam(gate_target.0, gate_target.1, 9.0);
                    c.eq(
                        &format!("{name} cam"),
                        cam_sig(&w.view),
                        pose.get("cam").u32(),
                    );
                    replay(
                        &mut c,
                        &mut w,
                        &ps,
                        &format!("{name} edges"),
                        pose.get("rays"),
                        &mut f,
                        &mut st,
                    );
                }
                "relief" => {
                    // tile kinds changed without rebuilding the ground meshes (part 5 `siege.relief`)
                    for t in pose.get("relief").arr() {
                        let a = t.arr();
                        let (col, row) = (a[0].i32(), a[1].i32());
                        let i = usize::try_from(row * BF_COLS + col).expect("i");
                        w.b.field.grid.tiles[i] = u8::try_from(a[2].i64()).expect("k");
                    }
                    w.set_cam(gate_target.0, gate_target.1, 9.0);
                    c.eq(
                        &format!("{name} cam"),
                        cam_sig(&w.view),
                        pose.get("cam").u32(),
                    );
                    replay(
                        &mut c,
                        &mut w,
                        &ps,
                        &format!("{name} relief"),
                        pose.get("rays"),
                        &mut f,
                        &mut st,
                    );
                    // y = 0 near the borders of every changed tile (±0.45 z, +0.45 x)
                    let near = pose.get("near").arr();
                    let mut k = 0;
                    for t in pose.get("relief").arr() {
                        let a = t.arr();
                        let (x, z) = (
                            f64::from(a[0].i32()) * TILE_S,
                            f64::from(a[1].i32()) * TILE_S,
                        );
                        for (dx, dz) in [(0.0, 0.45), (0.0, -0.45), (0.45, 0.0)] {
                            let got = client_px(&mut w, Vec3::new(x + dx, 0.0, z + dz));
                            check_aim(&mut c, &format!("{name} near {k} px"), got, &near[k]);
                            k += 1;
                        }
                    }
                    c.eq(&format!("{name} near n"), k, near.len());
                    replay(
                        &mut c,
                        &mut w,
                        &ps,
                        &format!("{name} near"),
                        pose.get("near"),
                        &mut f,
                        &mut st,
                    );
                }
                _ => {
                    let ti = usize::try_from(pose.get("tower").i64()).expect("tower");
                    let m = w.b.wall.as_ref().expect("wall").towers[ti]
                        .mesh
                        .expect("tower mesh");
                    let p = fs.scene.nodes[m].position;
                    c.fs(
                        &format!("{name} target"),
                        &[p.x, p.z],
                        &pose.get("target").hx(),
                    );
                    w.set_cam(p.x, p.z, 12.0);
                    c.eq(
                        &format!("{name} cam"),
                        cam_sig(&w.view),
                        pose.get("cam").u32(),
                    );
                    let rays = pose.get("rays").arr();
                    for (k, dy) in [0.0, 1.0, 3.0].into_iter().enumerate() {
                        let got = client_px(&mut w, Vec3::new(p.x, p.y + dy, p.z));
                        check_aim(&mut c, &format!("{name} tower px {k}"), got, &rays[k]);
                    }
                    replay(
                        &mut c,
                        &mut w,
                        &ps,
                        &format!("{name} tower"),
                        pose.get("rays"),
                        &mut f,
                        &mut st,
                    );
                    replay(
                        &mut c,
                        &mut w,
                        &ps,
                        &format!("{name} tiles"),
                        pose.get("tiles"),
                        &mut f,
                        &mut st,
                    );
                }
            }
            c.eq(&format!("{name} sig"), f.hash(), pose.get("sig").u32());
        }
    }
    let counts = d.get("counts");
    c.eq(
        "rays",
        st.rays,
        usize::try_from(counts.get("rays").i64()).expect("n"),
    );
    c.eq(
        "tower-hit rays",
        st.tower_hit,
        usize::try_from(counts.get("towerHitRays").i64()).expect("n"),
    );
    c.eq(
        "wall-hit rays",
        st.wall_hit,
        usize::try_from(counts.get("wallHitRays").i64()).expect("n"),
    );
    println!(
        "a5: {n_poses} poses, {} rays ({} hit a tower, {} of them still pick a unit; {} hit the wall; {} non-finite; mesh/plane disagree: plane wins {}, mesh wins {}), {} checks",
        st.rays,
        st.tower_hit,
        st.tower_hit_unit,
        st.wall_hit,
        st.nan_rays,
        st.plane_wins,
        st.mesh_wins,
        c.checks
    );
    assert!(
        st.rays >= 1150
            && st.tower_hit >= 90
            && st.nan_rays == 7 * 3
            && st.plane_wins > 0
            && st.mesh_wins > 0,
        "a5 coverage"
    );
    c.finish("a5 picking");
}
