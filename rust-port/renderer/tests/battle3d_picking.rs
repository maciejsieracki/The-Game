//! MOD-14 "battle 3D", part 5 (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q5): the
//! Rust `battle::view` (camera control) and `battle::picking` (raycasting,
//! ground / unit picking, clicks) ports against states produced by RUNNING
//! the web code of `edb8fb56` (three@0.169.0, node v22.22.0) — see
//! `tests/fixtures/battle3d/README.md` ("Part 5") and
//! `dyspozycje/rust-port/p4/P4-36-MOD14-BATTLE-3D.md` §39.
//!
//! The scenes are the part-4 ones, built from the `dynamics.json` DTO (the
//! generator's DTO signature is checked first). Every camera step compares
//! the FNV-1a of 86 camera numbers (target, distances, position, quaternion,
//! rotation, aspect, `matrixWorld`, `matrixWorldInverse`, `projectionMatrix`,
//! `projectionMatrixInverse`) and the minimap viewport; every ray compares the
//! picked ground tile (meshes, plane, combined), the picked unit and an FNV-1a
//! over the ray and every ground / unit intersection (distance, point, up
//! normal, object `traverse` index, instance). Any difference fails.

#![allow(clippy::float_cmp)]

use std::collections::HashMap;
use std::path::PathBuf;

use civ_renderer::battle::dynamics::GroupMarkers;
use civ_renderer::battle::field::{
    BattleSceneOpts, DeploySide, TerrainGrid, BF_COLS, BF_ROWS, TILE_S,
};
use civ_renderer::battle::picking::{
    battle_click, battle_pick_mesh_up_normal, battle_queue_only, box_select, clamp_battle_tile,
    deploy_click, handle_deploy_unit_pick, intersect_objects, on_key_toggle_bars,
    pick_ground_tile_at, pick_ground_tile_from_meshes, pick_ground_tile_plane, pick_unit_at_screen,
    BattleClick, DeployClick, DeployCtx, DeploySelection, Occupancy, PickScene, PickUnit,
    RayCamera, RosterPick,
};
use civ_renderer::battle::units::{
    build_battle_scene_with_units, clear_deploy_ghosts, siege_wall_civ, BattleScene3, BattleSide,
    BattleUnitsOpts, SelectionRings, UnitSpawn, ORDER_LINE_Y,
};
use civ_renderer::battle::view::{BattleView, Canvas, DragPan};
use civ_renderer::pick::three::{Mat4, Ray, Vec3};
use civ_renderer::scene::Fnv;

// Minimal JSON reader (no dependencies; fixtures are trusted files produced
// by the reference script). UTF-8 strings and `\uXXXX` escapes supported.

#[derive(Debug, Clone)]
enum Json {
    Null,
    Bool(bool),
    Num(f64),
    Str(String),
    Arr(Vec<Json>),
    Obj(Vec<(String, Json)>),
}

#[allow(dead_code)] // the same reader as tests/misc_web_parity.rs; not every accessor is used here
impl Json {
    fn get(&self, key: &str) -> &Json {
        self.opt(key).unwrap_or_else(|| panic!("missing key {key}"))
    }
    fn opt(&self, key: &str) -> Option<&Json> {
        match self {
            Json::Obj(kv) => kv.iter().find(|(k, _)| k == key).map(|(_, v)| v),
            _ => None,
        }
    }
    fn num(&self) -> f64 {
        match self {
            Json::Num(n) => *n,
            other => panic!("not a number: {other:?}"),
        }
    }
    fn arr(&self) -> &[Json] {
        match self {
            Json::Arr(a) => a,
            other => panic!("not an array: {other:?}"),
        }
    }
    fn str(&self) -> &str {
        match self {
            Json::Str(s) => s,
            other => panic!("not a string: {other:?}"),
        }
    }
    fn bool(&self) -> bool {
        match self {
            Json::Bool(b) => *b,
            other => panic!("not a bool: {other:?}"),
        }
    }
    fn is_null(&self) -> bool {
        matches!(self, Json::Null)
    }
    fn obj(&self) -> &[(String, Json)] {
        match self {
            Json::Obj(kv) => kv,
            other => panic!("not an object: {other:?}"),
        }
    }
    #[allow(clippy::cast_possible_truncation)]
    fn i64(&self) -> i64 {
        let n = self.num();
        assert!(n.fract() == 0.0 && n.abs() < 9e15, "not an integer: {n}");
        n as i64
    }
    fn i32(&self) -> i32 {
        i32::try_from(self.i64()).expect("i32")
    }
    fn u32(&self) -> u32 {
        u32::try_from(self.i64()).expect("u32")
    }
    fn hx(&self) -> Vec<f64> {
        hx(self.str())
    }
}

struct Parser<'a> {
    s: &'a [u8],
    i: usize,
}

impl Parser<'_> {
    fn ws(&mut self) {
        while self.i < self.s.len() && self.s[self.i].is_ascii_whitespace() {
            self.i += 1;
        }
    }
    fn lit(&mut self, l: &str) {
        assert!(
            self.s[self.i..].starts_with(l.as_bytes()),
            "bad literal at {}",
            self.i
        );
        self.i += l.len();
    }
    fn value(&mut self) -> Json {
        self.ws();
        let v = match self.s[self.i] {
            b'n' => {
                self.lit("null");
                Json::Null
            }
            b't' => {
                self.lit("true");
                Json::Bool(true)
            }
            b'f' => {
                self.lit("false");
                Json::Bool(false)
            }
            b'"' => Json::Str(self.string()),
            b'[' => {
                self.i += 1;
                let mut a = Vec::new();
                self.ws();
                if self.s[self.i] == b']' {
                    self.i += 1;
                } else {
                    loop {
                        a.push(self.value());
                        self.ws();
                        let c = self.s[self.i];
                        self.i += 1;
                        if c == b']' {
                            break;
                        }
                        assert_eq!(c, b',', "expected , at {}", self.i);
                    }
                }
                Json::Arr(a)
            }
            b'{' => {
                self.i += 1;
                let mut kv = Vec::new();
                self.ws();
                if self.s[self.i] == b'}' {
                    self.i += 1;
                } else {
                    loop {
                        self.ws();
                        let k = self.string();
                        self.ws();
                        assert_eq!(self.s[self.i], b':');
                        self.i += 1;
                        let v = self.value();
                        kv.push((k, v));
                        self.ws();
                        let c = self.s[self.i];
                        self.i += 1;
                        if c == b'}' {
                            break;
                        }
                        assert_eq!(c, b',', "expected , at {}", self.i);
                    }
                }
                Json::Obj(kv)
            }
            _ => {
                let start = self.i;
                while self.i < self.s.len()
                    && matches!(
                        self.s[self.i],
                        b'-' | b'+' | b'.' | b'e' | b'E' | b'0'..=b'9'
                    )
                {
                    self.i += 1;
                }
                let t = std::str::from_utf8(&self.s[start..self.i]).expect("utf8");
                Json::Num(
                    t.parse::<f64>()
                        .unwrap_or_else(|_| panic!("bad number {t}")),
                )
            }
        };
        self.ws();
        v
    }
    fn string(&mut self) -> String {
        assert_eq!(self.s[self.i], b'"');
        self.i += 1;
        let mut out: Vec<u8> = Vec::new();
        loop {
            let c = self.s[self.i];
            self.i += 1;
            match c {
                b'"' => break,
                b'\\' => {
                    let e = self.s[self.i];
                    self.i += 1;
                    let ch = match e {
                        b'n' => '\n',
                        b't' => '\t',
                        b'r' => '\r',
                        b'b' => '\u{8}',
                        b'f' => '\u{c}',
                        b'"' => '"',
                        b'\\' => '\\',
                        b'/' => '/',
                        b'u' => {
                            let h = std::str::from_utf8(&self.s[self.i..self.i + 4]).expect("hex");
                            self.i += 4;
                            char::from_u32(u32::from_str_radix(h, 16).expect("hex")).expect("char")
                        }
                        _ => panic!("unsupported escape"),
                    };
                    let mut buf = [0u8; 4];
                    out.extend_from_slice(ch.encode_utf8(&mut buf).as_bytes());
                }
                _ => out.push(c),
            }
        }
        String::from_utf8(out).expect("utf8 string")
    }
}

fn load(name: &str) -> Json {
    let p: PathBuf = [
        env!("CARGO_MANIFEST_DIR"),
        "tests",
        "fixtures",
        "battle3d",
        name,
    ]
    .iter()
    .collect();
    let text = std::fs::read_to_string(&p).unwrap_or_else(|e| panic!("read {}: {e}", p.display()));
    let mut parser = Parser {
        s: text.as_bytes(),
        i: 0,
    };
    let v = parser.value();
    assert_eq!(parser.i, parser.s.len(), "trailing data in {name}");
    v
}

/// Decodes `hx()` of `gen.ts`: 16 hex digits (big-endian binary64) per number.
fn hx(s: &str) -> Vec<f64> {
    assert_eq!(s.len() % 16, 0, "bad hx length");
    (0..s.len() / 16)
        .map(|i| f64::from_bits(u64::from_str_radix(&s[i * 16..i * 16 + 16], 16).expect("hex")))
        .collect()
}

// ---------------------------------------------------------------------------
// Comparison bookkeeping.

#[derive(Default)]
struct Cmp {
    scalars: usize,
    checks: usize,
    errors: Vec<String>,
}

impl Cmp {
    fn f(&mut self, ctx: &str, rust: f64, web: f64) {
        self.scalars += 1;
        if rust.to_bits() != web.to_bits() {
            self.err(format!(
                "{ctx}: rust {rust:e} ({:#x}) web {web:e} ({:#x})",
                rust.to_bits(),
                web.to_bits()
            ));
        }
    }
    fn fs(&mut self, ctx: &str, rust: &[f64], web: &[f64]) {
        if rust.len() != web.len() {
            self.err(format!("{ctx}: len rust {} web {}", rust.len(), web.len()));
            return;
        }
        for (i, (r, w)) in rust.iter().zip(web).enumerate() {
            self.f(&format!("{ctx}[{i}]"), *r, *w);
        }
    }
    fn eq<T: PartialEq + std::fmt::Debug>(&mut self, ctx: &str, rust: T, web: T) {
        self.checks += 1;
        if rust != web {
            self.err(format!("{ctx}: rust {rust:?} web {web:?}"));
        }
    }
    fn err(&mut self, e: String) {
        if self.errors.len() < 60 {
            self.errors.push(e);
        } else if self.errors.len() == 60 {
            self.errors.push("…".into());
        }
    }
    fn finish(&self, what: &str) {
        assert!(
            self.errors.is_empty(),
            "{what}: {} differences:\n{}",
            self.errors.len(),
            self.errors.join("\n")
        );
    }
}

// ---------------------------------------------------------------------------

#[derive(Default)]
struct Bytes(Vec<u8>);

impl Bytes {
    fn byte(&mut self, b: u8) {
        self.0.push(b);
    }
    fn u32(&mut self, v: u32) {
        self.0.extend_from_slice(&v.to_le_bytes());
    }
    /// NaN hashed as one canonical pattern, like `gen_units.ts` (bit patterns
    /// of NaN are implementation-defined; P4-36 §3a).
    fn f64(&mut self, v: f64) {
        let v = if v.is_nan() {
            f64::from_bits(0x7ff8_0000_0000_0000)
        } else {
            v
        };
        self.0.extend_from_slice(&v.to_le_bytes());
    }
    fn bool(&mut self, b: bool) {
        self.byte(u8::from(b));
    }
    fn str(&mut self, s: &str) {
        let units: Vec<u16> = s.encode_utf16().collect();
        self.u32(u32::try_from(units.len()).expect("len"));
        for u in units {
            self.u32(u32::from(u));
        }
    }
    fn hash(&self) -> u32 {
        let mut f = Fnv::default();
        for &b in &self.0 {
            f.byte(b);
        }
        f.finish()
    }
}

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

fn rle_tiles(w: &Json) -> Vec<u8> {
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
    tiles
}

fn rle_grid(w: &Json) -> TerrainGrid {
    TerrainGrid::new(BF_COLS, BF_ROWS, rle_tiles(w))
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

/// Builds the scene of a web constructor record (DTO + deploy moves).
fn build(rec: &Json) -> BattleScene3 {
    let siege = rec.opt("siege").unwrap_or(&Json::Null);
    let deploy = rec.get("deploy");
    let opts = BattleUnitsOpts {
        field: BattleSceneOpts {
            grid: rle_grid(rec.get("tilesRle")),
            desert_palette: rec.get("desert").bool(),
            siege: !siege.is_null(),
            deploy: if deploy.is_null() {
                None
            } else if deploy.str() == "atk" {
                Some(DeploySide::Atk)
            } else {
                Some(DeploySide::Def)
            },
        },
        siege_civ: siege_wall_civ(
            if siege.is_null() {
                None
            } else {
                siege.opt("civ").map(Json::str)
            },
            None,
        )
        .to_owned(),
        player_side: side_of(rec.get("player").str()),
        units: rec.get("spawn").arr().iter().map(spawn_of).collect(),
    };
    let mut b = build_battle_scene_with_units(opts);
    for m in rec.get("moves").arr() {
        let a = m.arr();
        assert!(b.move_deploy_unit(a[0].str(), a[1].i32(), a[2].i32()));
    }
    b
}

// ---------------------------------------------------------------------------
// Part 5 helpers.

#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
fn u32w(v: i64) -> u32 {
    v as u32 // `>>> 0` of the JS stream
}

/// `dtoSig` of `gen_picking.ts` over a `dynamics.json` scene record.
fn dto_sig(rec: &Json, groups: Option<&Json>) -> u32 {
    let mut f = Bytes::default();
    let tl = rec.get("tilesRle").arr();
    f.u32(u32w(i64::try_from(tl.len()).expect("len")));
    for v in tl {
        f.u32(u32w(v.i64()));
    }
    let sp = rec.get("spawn").arr();
    f.u32(u32w(i64::try_from(sp.len()).expect("len")));
    for r in sp {
        let a = r.arr();
        f.str(a[0].str());
        f.str(a[1].str());
        for x in &a[2..6] {
            f.u32(u32w(x.i64()));
        }
        f.str(a[6].str());
        f.str(a[7].str());
        f.u32(u32w(a[8].i64()));
        for v in a[9].arr() {
            f.f64(num(v));
        }
        for x in &a[10..13] {
            f.u32(u32w(x.i64()));
        }
    }
    let mv = rec.get("moves").arr();
    f.u32(u32w(i64::try_from(mv.len()).expect("len")));
    for m in mv {
        let a = m.arr();
        f.str(a[0].str());
        f.u32(u32w(a[1].i64()));
        f.u32(u32w(a[2].i64()));
    }
    f.str(rec.get("player").str());
    f.bool(rec.get("desert").bool());
    let siege = rec.opt("siege").unwrap_or(&Json::Null);
    f.str(if siege.is_null() {
        ""
    } else {
        siege.get("civ").str()
    });
    let deploy = rec.get("deploy");
    f.str(if deploy.is_null() { "" } else { deploy.str() });
    if let Some(g) = groups {
        let g = g.arr();
        f.u32(u32w(i64::try_from(g.len()).expect("len")));
        for x in g {
            let a = x.arr();
            f.str(a[0].str());
            f.bool(!a[1].is_null());
            f.str(if a[1].is_null() { "" } else { a[1].str() });
            f.u32(u32w(a[2].i64()));
        }
    }
    f.hash()
}

/// The 86 numbers of `camNums` (`gen_picking.ts`).
fn cam_nums(v: &BattleView) -> Vec<f64> {
    let c = &v.camera;
    let mut o = vec![
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
    ];
    for m in [
        &v.matrix_world,
        &v.matrix_world_inverse,
        &v.projection,
        &v.projection_inverse,
    ] {
        o.extend_from_slice(&m.e);
    }
    o
}

fn cam_sig(v: &BattleView) -> u32 {
    let mut f = Bytes::default();
    for x in cam_nums(v) {
        f.f64(x);
    }
    f.hash()
}

fn vp(v: &BattleView, canvas: &Canvas) -> Vec<f64> {
    let m = v.minimap_viewport(canvas);
    vec![m.col_min, m.row_min, m.col_max, m.row_max]
}

fn canvas_of(a: &[Json]) -> Canvas {
    Canvas::new(num(&a[0]), num(&a[1]), num(&a[2]), num(&a[3]))
}

fn tcode(t: Option<(i32, i32)>) -> i64 {
    t.map_or(-1, |(c, r)| i64::from(c) * 1000 + i64::from(r))
}

fn idx_code(i: Option<usize>) -> i64 {
    i.map_or(-1, |i| i64::try_from(i).expect("i64"))
}

/// The scene + battle state a test threads through the vectors.
struct World {
    b: BattleScene3,
    grid: TerrainGrid,
    view: BattleView,
    canvas: Canvas,
    dead: Vec<bool>,
    fading: Vec<bool>,
    removed: Vec<bool>,
    routed: Vec<bool>,
    occ: Occupancy,
    ids: Vec<String>,
}

impl World {
    fn new(b: BattleScene3, occ_w: &Json) -> Self {
        let ids: Vec<String> = b
            .atk
            .iter()
            .chain(b.def.iter())
            .map(|u| u.spawn.id.clone())
            .collect();
        let n = ids.len();
        let mut occ = HashMap::new();
        for e in occ_w.arr() {
            let a = e.arr();
            let mut it = a[0].str().split(',');
            let c: i32 = it.next().expect("c").parse().expect("int");
            let r: i32 = it.next().expect("r").parse().expect("int");
            let i = ids.iter().position(|x| x == a[1].str()).expect("occ id");
            occ.insert((c, r), i);
        }
        let grid = b.field.grid.clone();
        let view = BattleView::new(b.field.camera, (300.0, 150.0));
        Self {
            b,
            grid,
            view,
            canvas: Canvas::new(0.0, 0.0, 0.0, 0.0),
            dead: vec![false; n],
            fading: vec![false; n],
            removed: vec![false; n],
            routed: vec![false; n],
            occ,
            ids,
        }
    }
    fn index(&self, id: &str) -> usize {
        self.ids.iter().position(|x| x == id).expect("unit id")
    }
    fn units(&self) -> Vec<PickUnit<'_>> {
        self.b
            .atk
            .iter()
            .chain(self.b.def.iter())
            .enumerate()
            .map(|(i, u)| PickUnit {
                unit: u,
                dead: self.dead[i],
                fading_out: self.fading[i],
                removed: self.removed[i],
                routed: self.routed[i],
            })
            .collect()
    }
    fn flag(&mut self, id: &str, k: &str) {
        let i = self.index(id);
        match k {
            "dead" => self.dead[i] = true,
            "fadingOut" => self.fading[i] = true,
            "removed" => self.removed[i] = true,
            "routed" => self.routed[i] = true,
            other => panic!("flag {other}"),
        }
    }
    fn set_cam(&mut self, x: f64, z: f64, dist: f64) {
        let c = &mut self.view.camera;
        c.target = Vec3::new(x, 0.0, z);
        c.dist = dist;
        c.dist_target = dist;
        self.view.apply_camera();
    }
    fn player(&self) -> BattleSide {
        self.b.player_side
    }
    fn roster(&self) -> Vec<usize> {
        let p = self.player();
        self.b
            .atk
            .iter()
            .chain(self.b.def.iter())
            .enumerate()
            .filter(|(_, u)| u.spawn.side == p)
            .map(|(i, _)| i)
            .collect()
    }
}

/// `pickRay` of `gen_picking.ts`: `[ground, fromMeshes, fromPlane, unit, nGround, nUnit]`.
fn pick_ray(w: &mut World, ps: &PickScene<'_>, cx: f64, cy: f64, f: &mut Bytes) -> Vec<i64> {
    let all = w.units();
    let canvas = w.canvas;
    let mut view = w.view.clone();
    let Some(ray) = view.ray_from_canvas(cx, cy, &canvas) else {
        f.u32(0xdead);
        let g = pick_ground_tile_at(&mut view, ps, &w.grid, (cx, cy), &canvas);
        let u = pick_unit_at_screen(&mut view, ps, &w.grid, &all, &w.occ, (cx, cy), &canvas);
        let out = vec![tcode(g), -1, -1, idx_code(u), -1, -1];
        drop(all);
        w.view = view;
        return out;
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
    let from_meshes = pick_ground_tile_from_meshes(ps, &ray, &cam, &w.grid, meshes);
    let from_plane = pick_ground_tile_plane(&ray, &w.grid);
    let gh = intersect_objects(ps, &ray, &cam, meshes, false);
    f.u32(u32::try_from(gh.len()).expect("n"));
    for h in &gh {
        f.f64(h.distance);
        f.f64(h.point.x);
        f.f64(h.point.y);
        f.f64(h.point.z);
        f.f64(battle_pick_mesh_up_normal(ps, h));
        f.u32(u32::try_from(ps.traverse_index(h.object)).expect("idx"));
        f.u32(
            h.instance
                .map_or(0xffff_ffff, |i| u32::try_from(i).expect("i")),
        );
    }
    let live: Vec<_> = all
        .iter()
        .filter(|u| u.live())
        .map(|u| u.unit.group)
        .collect();
    let uh = intersect_objects(ps, &ray, &cam, &live, true);
    f.u32(u32::try_from(uh.len()).expect("n"));
    for h in &uh {
        f.f64(h.distance);
        f.f64(h.point.x);
        f.f64(h.point.y);
        f.f64(h.point.z);
        f.u32(u32::try_from(ps.traverse_index(h.object)).expect("idx"));
    }
    let ground = pick_ground_tile_at(&mut view, ps, &w.grid, (cx, cy), &canvas);
    let unit = pick_unit_at_screen(&mut view, ps, &w.grid, &all, &w.occ, (cx, cy), &canvas);
    let out = vec![
        tcode(ground),
        tcode(from_meshes),
        tcode(from_plane),
        idx_code(unit),
        i64::try_from(gh.len()).expect("n"),
        i64::try_from(uh.len()).expect("n"),
    ];
    drop(all);
    w.view = view;
    out
}

/// `pickPose` of `gen_picking.ts`.
fn pick_pose(c: &mut Cmp, w: &mut World, pose: &Json, nx: usize, ny: usize, aim: bool) {
    let name = pose.get("name").str().to_owned();
    w.view.render();
    let fs = w.b.field.field.clone();
    let ps = PickScene::new(&fs);
    let mut f = Bytes::default();
    let grid_w = pose.get("grid").arr();
    c.eq(&format!("{name} rays"), grid_w.len(), nx * ny);
    let r = w.canvas.rect;
    let mut k = 0;
    for j in 0..ny {
        for i in 0..nx {
            #[allow(clippy::cast_precision_loss)]
            let (fi, fj, fnx, fny) = (i as f64, j as f64, nx as f64, ny as f64);
            #[allow(clippy::cast_precision_loss)]
            let cx = r.left + (fi * r.width) / fnx + 0.37 * ((j % 3) as f64 + 1.0);
            #[allow(clippy::cast_precision_loss)]
            let cy = r.top + (fj * r.height) / fny + 0.61 * ((i % 2) as f64 + 1.0);
            let got = pick_ray(w, &ps, cx, cy, &mut f);
            let want: Vec<i64> = grid_w[k].arr().iter().map(Json::i64).collect();
            c.eq(&format!("{name} ray {i},{j}"), got, want);
            k += 1;
        }
    }
    let aimed = pose.get("aimed").arr();
    if aim {
        w.view.update_matrix_world();
        let n = w.b.atk.len() + w.b.def.len();
        c.eq(&format!("{name} aimed n"), aimed.len(), n);
        for (ui, a) in aimed.iter().enumerate() {
            let g = if ui < w.b.atk.len() {
                w.b.atk[ui].group
            } else {
                w.b.def[ui - w.b.atk.len()].group
            };
            let p = fs.scene.nodes[g].position;
            let px = w
                .view
                .world_to_client_px(Vec3::new(p.x, p.y + 0.5, p.z), &w.canvas);
            if a.is_null() {
                c.eq(&format!("{name} aimed {ui} null"), px.is_none(), true);
                continue;
            }
            let arr = a.arr();
            let xy = arr[0].hx();
            let Some((x, y)) = px else {
                c.err(format!("{name} aimed {ui}: rust null"));
                continue;
            };
            c.fs(&format!("{name} aimed {ui} px"), &[x, y], &xy);
            let got = pick_ray(w, &ps, x, y, &mut f);
            let want: Vec<i64> = arr[1..].iter().map(Json::i64).collect();
            c.eq(&format!("{name} aimed {ui}"), got, want);
        }
    } else {
        c.eq(&format!("{name} aimed n"), aimed.len(), 0);
    }
    c.eq(
        &format!("{name} cam"),
        cam_sig(&w.view),
        pose.get("cam").u32(),
    );
    c.eq(&format!("{name} sig"), f.hash(), pose.get("sig").u32());
    println!("pose {name}: {} rays + {} aimed", nx * ny, aimed.len());
}

fn siege_world() -> (World, Json) {
    let d = load("dynamics.json");
    let p = load("picking.json");
    let rec = d.get("siege");
    let s = p.get("siege");
    assert_eq!(
        dto_sig(rec, None),
        s.get("dto").u32(),
        "siege DTO = dynamics.json"
    );
    let w = World::new(build(rec), s.get("occ"));
    (w, p)
}

fn deploy_world() -> (World, Json) {
    let d = load("dynamics.json");
    let p = load("picking.json");
    let rec = d.get("deploy");
    let s = p.get("deploy");
    assert_eq!(
        dto_sig(rec, Some(rec.get("groups"))),
        s.get("dto").u32(),
        "deploy DTO = dynamics.json"
    );
    let mut b = build(rec);
    let mut markers = GroupMarkers::default();
    for g in rec.get("groups").arr() {
        let a = g.arr();
        let u = b
            .atk
            .iter()
            .chain(b.def.iter())
            .find(|u| u.spawn.id == a[0].str())
            .expect("unit")
            .clone();
        let gid = if a[1].is_null() {
            None
        } else {
            Some(a[1].str())
        };
        markers.update(&mut b.field.field, &u, gid, false);
        assert_eq!(markers.get(a[0].str()).is_some(), a[2].i64() == 1);
    }
    let w = World::new(b, s.get("occ"));
    (w, p)
}

/// Replays the camera ops of `gen_picking.ts::camOp`.
#[allow(clippy::too_many_lines)]
fn cam_op(
    c: &mut Cmp,
    w: &mut World,
    pan: &mut DragPan,
    flags: (bool, bool, bool, bool),
    rec: &Json,
    k: usize,
) {
    let r = rec.arr();
    let op = r[0].arr();
    let name = op[0].str();
    let ctx = format!("op {k} {name}");
    let res = &r[1];
    match name {
        "canvas" => w.canvas = canvas_of(&op[1..5]),
        "sync" => {
            w.view.sync_renderer_size(&w.canvas);
            let (rw, rh) = w.view.renderer_size;
            let want = res.arr();
            c.fs(&ctx, &[rw, rh], &[num(&want[0]), num(&want[1])]);
        }
        "wheel" => {
            let pd = w.view.on_wheel(num(&op[1]));
            c.eq(&ctx, i64::from(pd), res.i64());
        }
        "key" => {
            let pd = w.view.on_key_zoom(op[1].str());
            c.eq(&ctx, i64::from(pd), res.i64());
        }
        "zoomTarget" => w.view.set_zoom_target(num(&op[1])),
        "panKey" => {
            let pd = w
                .view
                .set_pan_key(op[1].str(), op[2].i64() == 1, op[3].i64() == 1);
            let k = w.view.pan_keys;
            let got = vec![
                i64::from(pd),
                i64::from(k.up),
                i64::from(k.down),
                i64::from(k.left),
                i64::from(k.right),
            ];
            let want: Vec<i64> = res.arr().iter().map(Json::i64).collect();
            c.eq(&ctx, got, want);
        }
        "frame" => w.view.frame(&w.canvas),
        "tickZoom" => w.view.tick_zoom(),
        "tickPan" => w.view.tick_camera_pan_keys(&w.canvas),
        "render" => w.view.render(),
        "apply" => w.view.apply_camera(),
        "clamp" => w.view.clamp_cam_target(),
        "setTarget" => w.view.camera.target = Vec3::new(num(&op[1]), num(&op[2]), num(&op[3])),
        "setDist" => w.view.camera.dist = num(&op[1]),
        "panDown" => {
            let button = i32::try_from(op[1].i64()).expect("button");
            let (deploy, manual, started, finished) = flags;
            if DragPan::pointer_down_pans(button, deploy, manual, started, finished) {
                pan.down(num(&op[2]), num(&op[3]));
            }
            c.eq(&ctx, i64::from(pan.panning), res.arr()[0].i64());
        }
        "panMove" => {
            let canvas = w.canvas;
            pan.move_to(&mut w.view, num(&op[1]), num(&op[2]), &canvas);
            c.eq(&ctx, i64::from(pan.panning), res.arr()[0].i64());
        }
        "panUp" => {
            pan.up();
            c.eq(&ctx, i64::from(pan.panning), res.arr()[0].i64());
        }
        other => panic!("op {other}"),
    }
    c.eq(&format!("{ctx} cam"), cam_sig(&w.view), r[2].u32());
    let want: Vec<f64> = r[3].arr().iter().map(num).collect();
    c.fs(&format!("{ctx} minimap"), &vp(&w.view, &w.canvas), &want);
}

// ---------------------------------------------------------------------------
// Tests.

#[test]
fn camera_control_matches_web() {
    let (mut w, p) = siege_world();
    let s = p.get("siege");
    let mut c = Cmp::default();
    c.fs(
        "constructor camera",
        &cam_nums(&w.view),
        &s.get("cam0").hx(),
    );
    let fl: Vec<bool> = s
        .get("panFlags")
        .arr()
        .iter()
        .map(|x| x.i64() == 1)
        .collect();
    let flags = (fl[0], fl[1], fl[2], fl[3]);
    let mut pan = DragPan::default();
    let ops = s.get("camOps").arr();
    for (k, op) in ops.iter().enumerate() {
        cam_op(&mut c, &mut w, &mut pan, flags, op, k);
    }
    // worldToScreen: stale camera (after _applyCamera, before a render), fresh, empty canvas
    let pts = [
        (33.0, 0.0, 77.25),
        (0.0, 0.0, 0.0),
        (60.5, 2.5, 140.0),
        (33.0, 40.0, 100.0),
        (10.0, -1.0, 50.0),
    ];
    let ts = s.get("toScreen");
    w.view.camera.target = Vec3::new(40.0, 0.0, 70.0);
    w.view.camera.dist = 22.0;
    w.view.apply_camera();
    c.fs("stale camera", &cam_nums(&w.view), &ts.get("camStale").hx());
    let w2s = |w: &World, key: &str, c: &mut Cmp, canvas: &Canvas| {
        for (i, (p, want)) in pts.iter().zip(ts.get(key).arr()).enumerate() {
            let got = w.view.world_to_screen(Vec3::new(p.0, p.1, p.2), canvas);
            match got {
                None => c.eq(&format!("{key} {i}"), true, want.is_null()),
                Some((x, y)) => c.fs(&format!("{key} {i}"), &[x, y], &want.hx()),
            }
        }
    };
    let canvas = w.canvas;
    w2s(&w, "stale", &mut c, &canvas);
    w.view.render();
    w2s(&w, "fresh", &mut c, &canvas);
    w2s(&w, "empty", &mut c, &Canvas::new(0.0, 10.0, 0.0, 0.0));
    for (i, (p, want)) in pts.iter().zip(s.get("clientPx").arr()).enumerate() {
        let got = w.view.world_to_client_px(Vec3::new(p.0, p.1, p.2), &canvas);
        match got {
            None => c.eq(&format!("clientPx {i}"), true, want.is_null()),
            Some((x, y)) => c.fs(&format!("clientPx {i}"), &[x, y], &want.hx()),
        }
    }
    println!(
        "camera: {} ops, {} numbers, {} checks",
        ops.len(),
        c.scalars,
        c.checks
    );
    c.finish("camera");
}

/// The siege poses after the camera test's state (`gen_picking.ts` order).
fn siege_after_camera(w: &mut World, s: &Json) {
    let fl: Vec<bool> = s
        .get("panFlags")
        .arr()
        .iter()
        .map(|x| x.i64() == 1)
        .collect();
    let flags = (fl[0], fl[1], fl[2], fl[3]);
    let mut pan = DragPan::default();
    let mut c = Cmp::default();
    for (k, op) in s.get("camOps").arr().iter().enumerate() {
        cam_op(&mut c, w, &mut pan, flags, op, k);
    }
    w.view.camera.target = Vec3::new(40.0, 0.0, 70.0);
    w.view.camera.dist = 22.0;
    w.view.apply_camera();
    w.view.render();
    w.canvas = Canvas::new(1280.0, 720.0, 13.0, 7.0);
    c.finish("camera prefix");
}

#[test]
fn siege_picking_matches_web() {
    let (mut w, p) = siege_world();
    let s = p.get("siege");
    siege_after_camera(&mut w, s);
    let mut c = Cmp::default();
    let poses = s.get("poses").arr();
    w.set_cam(33.0, 77.5, 30.0);
    pick_pose(&mut c, &mut w, &poses[0], 16, 10, true);
    let lay = w.b.field.siege.clone().expect("siege");
    w.set_cam(
        f64::from(lay.wall_col) * TILE_S - 3.0,
        f64::from(lay.gate_row) * TILE_S,
        9.0,
    );
    pick_pose(&mut c, &mut w, &poses[1], 16, 10, true);
    for f in s.get("flagged").arr() {
        let a = f.arr();
        if a[1].str() != "routed" {
            w.flag(a[0].str(), a[1].str());
        }
    }
    for t in s.get("relief").arr() {
        let a = t.arr();
        let (col, row, k) = (a[0].i32(), a[1].i32(), u8::try_from(a[2].i64()).expect("k"));
        let i = usize::try_from(row * BF_COLS + col).expect("i");
        w.grid.tiles[i] = k;
    }
    let a0 = w.b.atk[0].clone();
    w.set_cam(f64::from(a0.col) * TILE_S, f64::from(a0.row) * TILE_S, 12.0);
    pick_pose(&mut c, &mut w, &poses[2], 12, 8, true);
    let r2 = canvas_of(poses[3].get("rect").arr());
    w.canvas = r2;
    w.view.sync_renderer_size(&r2);
    w.set_cam(30.0, 70.0, 180.0);
    pick_pose(&mut c, &mut w, &poses[3], 10, 12, false);
    // empty rect: no ray, no tile, no unit
    let empty = Canvas::new(0.0, 720.0, 0.0, 0.0);
    let fs = w.b.field.field.clone();
    let ps = PickScene::new(&fs);
    let all = w.units();
    let mut view = w.view.clone();
    let got = vec![
        i64::from(view.ray_from_canvas(5.0, 5.0, &empty).is_none()),
        tcode(pick_ground_tile_at(
            &mut view,
            &ps,
            &w.grid,
            (5.0, 5.0),
            &empty,
        )),
        idx_code(pick_unit_at_screen(
            &mut view,
            &ps,
            &w.grid,
            &all,
            &w.occ,
            (5.0, 5.0),
            &empty,
        )),
    ];
    let want: Vec<i64> = s.get("emptyRect").arr().iter().map(Json::i64).collect();
    c.eq("empty rect", got, want);
    println!("siege picking: {} numbers, {} checks", c.scalars, c.checks);
    c.finish("siege picking");
}

#[test]
fn battle_clicks_and_box_select_match_web() {
    let (mut w, p) = siege_world();
    let s = p.get("siege");
    siege_after_camera(&mut w, s);
    for f in s.get("flagged").arr() {
        let a = f.arr();
        if a[1].str() != "routed" {
            w.flag(a[0].str(), a[1].str());
        }
    }
    for t in s.get("relief").arr() {
        let a = t.arr();
        let (col, row, k) = (a[0].i32(), a[1].i32(), u8::try_from(a[2].i64()).expect("k"));
        let i = usize::try_from(row * BF_COLS + col).expect("i");
        w.grid.tiles[i] = k;
    }
    // the canvas round trip of the poses (R2 → empty → RECT), then the click camera
    let r2 = canvas_of(s.get("poses").arr()[3].get("rect").arr());
    w.view.sync_renderer_size(&r2);
    w.canvas = Canvas::new(1280.0, 720.0, 13.0, 7.0);
    let canvas = w.canvas;
    w.view.sync_renderer_size(&canvas);
    w.set_cam(33.0, 77.5, 30.0);
    w.view.render();
    let fs = w.b.field.field.clone();
    let ps = PickScene::new(&fs);
    let mut c = Cmp::default();
    let player = w.player();
    let mut n = 0;
    for rec in s.get("battleClicks").arr() {
        let a = rec.arr();
        let xy = a[0].hx();
        let (ctrl, shift, awaiting) = (a[1].i64() == 1, a[2].i64() == 1, a[3].i64() == 1);
        let round = num(&a[4]);
        let nsel = usize::try_from(a[5].i64()).expect("n");
        let q = battle_queue_only(ctrl, shift, awaiting, round);
        w.view.render();
        let all = w.units();
        let mut view = w.view.clone();
        let got = battle_click(
            &mut view,
            &ps,
            &w.grid,
            &all,
            &w.occ,
            player,
            nsel,
            (xy[0], xy[1]),
            &canvas,
        );
        let log: Vec<String> = match got {
            BattleClick::PickOwn(i) => vec![format!(
                "pick {} {} {}",
                w.ids[i],
                u8::from(ctrl),
                u8::from(shift)
            )],
            BattleClick::Attack(i) => vec![format!("attack {} {}", w.ids[i], u8::from(q))],
            BattleClick::Move(col, row) => vec![format!("move {col} {row} {}", u8::from(q))],
            BattleClick::Nothing => vec![],
        };
        drop(all);
        w.view = view;
        let want: Vec<String> = a[6]
            .arr()
            .iter()
            .map(|e| {
                e.arr()
                    .iter()
                    .map(|x| match x {
                        Json::Str(s) => s.clone(),
                        other => format!("{}", other.i64()),
                    })
                    .collect::<Vec<_>>()
                    .join(" ")
            })
            .collect();
        c.eq(&format!("battle click {n}"), log, want);
        n += 1;
    }
    // box select (siege: player = atk; manual → player roster, else this.atk)
    for f in s.get("flagged").arr() {
        let a = f.arr();
        if a[1].str() == "routed" {
            w.flag(a[0].str(), "routed");
        }
    }
    let atk: Vec<usize> = (0..w.b.atk.len()).collect();
    for (k, rec) in s.get("box").arr().iter().enumerate() {
        let a = rec.arr();
        let r: Vec<f64> = a[1].arr().iter().map(num).collect();
        let roster = if a[0].i64() == 1 {
            w.roster()
        } else {
            atk.clone()
        };
        let all = w.units();
        let mut view = w.view.clone();
        let found = box_select(
            &mut view,
            &fs,
            &all,
            &roster,
            (r[0], r[1], r[2], r[3]),
            &canvas,
        );
        drop(all);
        w.view = view;
        let mut got = vec!["clear".to_owned()];
        got.extend(found.iter().map(|&i| w.ids[i].clone()));
        let want: Vec<String> = a[2].arr().iter().map(|x| x.str().to_owned()).collect();
        c.eq(&format!("box {k}"), got, want);
    }
    println!("battle clicks: {n}, {} checks", c.checks);
    c.finish("battle clicks");
}

#[test]
fn deploy_picking_and_clicks_match_web() {
    let (mut w, p) = deploy_world();
    let s = p.get("deploy");
    let mut c = Cmp::default();
    w.canvas = Canvas::new(1280.0, 720.0, 13.0, 7.0);
    let canvas = w.canvas;
    w.view.sync_renderer_size(&canvas);
    let poses = s.get("poses").arr();
    pick_pose(&mut c, &mut w, &poses[0], 16, 10, true);
    let r0 = w.roster()[0];
    let u0 = if r0 < w.b.atk.len() {
        w.b.atk[r0].clone()
    } else {
        w.b.def[r0 - w.b.atk.len()].clone()
    };
    w.set_cam(
        f64::from(u0.col) * TILE_S + 1.0,
        f64::from(u0.row) * TILE_S,
        7.0,
    );
    pick_pose(&mut c, &mut w, &poses[1], 16, 10, true);

    // deploy clicks
    w.set_cam(33.0, 77.5, 30.0);
    w.view.render();
    let z: Vec<i32> = s.get("zone").arr().iter().map(Json::i32).collect();
    let in_zone =
        move |col: i32, row: i32| col >= z[0] && col <= z[1] && row >= z[2] && row <= z[3];
    let groups: HashMap<String, Option<String>> = load("dynamics.json")
        .get("deploy")
        .get("groups")
        .arr()
        .iter()
        .map(|g| {
            let a = g.arr();
            (
                a[0].str().to_owned(),
                if a[1].is_null() {
                    None
                } else {
                    Some(a[1].str().to_owned())
                },
            )
        })
        .collect();
    let mut sel = DeploySelection::default();
    let mut rings = SelectionRings::default();
    let player = w.player();
    let roster_ix = w.roster();
    for (k, rec) in s.get("deployClicks").arr().iter().enumerate() {
        let a = rec.arr();
        let xy = a[0].hx();
        let mods = a[1].i64();
        let (ctrl, shift) = (mods & 1 != 0, mods & 2 != 0);
        let prefer = a[2].i64() == 1;
        let saved = a.get(6).map(|probe| {
            let q = probe.arr();
            let i = usize::try_from(q[1].i32() * BF_COLS + q[0].i32()).expect("i");
            let old = w.grid.tiles[i];
            w.grid.tiles[i] = u8::try_from(q[2].i64()).expect("k");
            (i, old)
        });
        w.view.render();
        let fs_now = w.b.field.field.clone();
        let ps = PickScene::new(&fs_now);
        let decision = {
            let all = w.units();
            let ctx = DeployCtx {
                units: &all,
                player,
                occ: &w.occ,
                in_zone: &in_zone,
            };
            let mut view = w.view.clone();
            let d = deploy_click(
                &mut view,
                &ps,
                &w.grid,
                &ctx,
                &sel,
                prefer,
                (xy[0], xy[1]),
                &canvas,
            );
            w.view = view;
            d
        };
        drop(ps);
        let mut log: Vec<String> = Vec::new();
        match decision {
            DeployClick::Pick(i) => {
                let ri = roster_ix.iter().position(|&x| x == i).expect("roster unit");
                let mut fs = w.b.field.field.clone();
                let refreshed = {
                    let all = w.units();
                    let roster: Vec<RosterPick<'_>> = roster_ix
                        .iter()
                        .map(|&x| RosterPick {
                            pick: all[x],
                            group_id: groups.get(&w.ids[x]).cloned().flatten(),
                        })
                        .collect();
                    handle_deploy_unit_pick(
                        &mut fs, &mut rings, &mut sel, &roster, &all, ri, ctrl, shift,
                    )
                };
                w.b.field.field = fs;
                if refreshed {
                    log.push("ghosts".into());
                }
            }
            DeployClick::Place { col, row } => {
                let ids: Vec<String> = sel
                    .selected
                    .iter()
                    .filter(|id| roster_ix.iter().any(|&x| &w.ids[x] == *id))
                    .cloned()
                    .collect();
                log.push(format!("place {} {col} {row} {col} {row}", ids.join(",")));
                clear_deploy_ghosts(&mut w.b.field.field);
                log.push("ghosts".into());
            }
            DeployClick::Clear { feedback } => {
                if let Some(m) = feedback {
                    log.push(format!("feedback {m}"));
                }
                log.push("clearSel".into());
            }
            DeployClick::Nothing => {}
        }
        let want: Vec<String> = a[3]
            .arr()
            .iter()
            .map(|e| {
                let e = e.arr();
                match e[0].str() {
                    "place" => format!(
                        "place {} {} {} {} {}",
                        e[1].arr()
                            .iter()
                            .map(|x| x.str().to_owned())
                            .collect::<Vec<_>>()
                            .join(","),
                        e[2].i64(),
                        e[3].i64(),
                        e[4].i64(),
                        e[5].i64()
                    ),
                    "feedback" => format!("feedback {}", e[1].str()),
                    other => other.to_owned(),
                }
            })
            .collect();
        c.eq(&format!("deploy click {k} log"), log, want);
        let st = a[4].arr();
        let want_sel: Vec<String> = st[0].arr().iter().map(|x| x.str().to_owned()).collect();
        c.eq(
            &format!("deploy click {k} selected"),
            sel.selected.clone(),
            want_sel,
        );
        let want_ds = if st[1].is_null() {
            None
        } else {
            Some(st[1].str().to_owned())
        };
        c.eq(
            &format!("deploy click {k} deploySelected"),
            sel.deploy_selected.clone(),
            want_ds,
        );
        let want_rings: Vec<String> = st[2].arr().iter().map(|x| x.str().to_owned()).collect();
        let got_rings: Vec<String> = rings.rings.iter().map(|(id, _)| id.clone()).collect();
        c.eq(&format!("deploy click {k} rings"), got_rings, want_rings);
        // scaleSig: per roster unit scale, ring child index, ring position
        let mut f = Bytes::default();
        let sc = &w.b.field.field.scene;
        for &x in &roster_ix {
            let g = if x < w.b.atk.len() {
                w.b.atk[x].group
            } else {
                w.b.def[x - w.b.atk.len()].group
            };
            let n = &sc.nodes[g];
            f.f64(n.scale.x);
            f.f64(n.scale.y);
            f.f64(n.scale.z);
            match rings.get(&w.ids[x]) {
                Some(ring) => {
                    let ci = n
                        .children
                        .iter()
                        .position(|&ch| ch == ring)
                        .expect("ring child");
                    f.u32(u32::try_from(ci).expect("ci"));
                    let rp = sc.nodes[ring].position;
                    f.f64(rp.x);
                    f.f64(rp.y);
                    f.f64(rp.z);
                }
                None => f.u32(0xffff_ffff),
            }
        }
        c.eq(&format!("deploy click {k} scales"), f.hash(), a[5].u32());
        if let Some((i, old)) = saved {
            w.grid.tiles[i] = old;
        }
    }
    // deploy box select: player roster
    let fs = w.b.field.field.clone();
    for (k, rec) in s.get("box").arr().iter().enumerate() {
        let a = rec.arr();
        let r: Vec<f64> = a[1].arr().iter().map(num).collect();
        let all = w.units();
        let mut view = w.view.clone();
        let found = box_select(
            &mut view,
            &fs,
            &all,
            &roster_ix,
            (r[0], r[1], r[2], r[3]),
            &canvas,
        );
        drop(all);
        w.view = view;
        let mut got = vec!["clear".to_owned()];
        got.extend(found.iter().map(|&i| w.ids[i].clone()));
        let want: Vec<String> = a[2].arr().iter().map(|x| x.str().to_owned()).collect();
        c.eq(&format!("deploy box {k}"), got, want);
    }
    println!("deploy: {} numbers, {} checks", c.scalars, c.checks);
    c.finish("deploy");
}

#[test]
fn bars_toggle_matches_web() {
    let (mut w, p) = siege_world();
    let s = p.get("siege");
    for f in s.get("flagged").arr() {
        let a = f.arr();
        w.flag(a[0].str(), a[1].str());
    }
    let n_atk = w.b.atk.len();
    let bars: Vec<_> =
        w.b.atk
            .iter()
            .chain(w.b.def.iter())
            .enumerate()
            .map(|(i, u)| (u.bars.group, w.dead[i] || w.removed[i]))
            .collect();
    let mut visible = true;
    let mut c = Cmp::default();
    for (k, rec) in s.get("bars").arr().iter().enumerate() {
        let a = rec.arr();
        let pd = on_key_toggle_bars(
            &mut w.b.field.field.scene,
            &bars,
            &mut visible,
            a[0].str(),
            a[1].i64() == 1,
            a[2].i64() == 1,
        );
        c.eq(&format!("bars {k} pd"), i64::from(pd), a[3].i64());
        c.eq(&format!("bars {k} visible"), i64::from(visible), a[4].i64());
        let sc = &w.b.field.field.scene;
        let got: String =
            w.b.atk
                .iter()
                .chain(w.b.def.iter())
                .map(|u| {
                    if sc.nodes[u.bars.group].visible {
                        '1'
                    } else {
                        '0'
                    }
                })
                .collect();
        c.eq(&format!("bars {k} groups"), got, a[5].str().to_owned());
    }
    println!("bars: {} checks ({n_atk} attackers)", c.checks);
    c.finish("bars");
}

#[test]
fn helpers_and_constants_equal_web() {
    let p = load("picking.json");
    let h = p.get("helpers");
    let mut c = Cmp::default();
    let cases = [
        (-1.0, 0.0),
        (0.0, -1.0),
        (0.0, 0.0),
        (67.0, 155.0),
        (68.0, 0.0),
        (0.0, 156.0),
        (-0.0, 3.0),
        (12.5, 7.0),
    ];
    for (i, ((col, row), want)) in cases.iter().zip(h.get("clamp").arr()).enumerate() {
        match clamp_battle_tile(*col, *row) {
            None => c.eq(&format!("clamp {i}"), true, want.is_null()),
            Some((a, b)) => c.fs(&format!("clamp {i}"), &[a, b], &want.arr()[0].hx()),
        }
    }
    c.fs(
        "consts",
        &[f64::from(BF_COLS), f64::from(BF_ROWS), TILE_S, ORDER_LINE_Y],
        &h.get("consts").hx(),
    );
    c.finish("helpers");
}

// ---------------------------------------------------------------------------
// `extra` (Operator "pomiary", r1): cases for the mutants the r1 vectors left
// alive (P4-36 §49). Every block starts from a FRESH scene, like the generator.

fn log_strings(w: &Json) -> Vec<String> {
    w.arr()
        .iter()
        .map(|e| {
            let e = e.arr();
            match e[0].str() {
                "place" => format!(
                    "place {} {} {} {} {}",
                    e[1].arr()
                        .iter()
                        .map(|x| x.str().to_owned())
                        .collect::<Vec<_>>()
                        .join(","),
                    e[2].i64(),
                    e[3].i64(),
                    e[4].i64(),
                    e[5].i64()
                ),
                "feedback" => format!("feedback {}", e[1].str()),
                _ => e
                    .iter()
                    .map(|x| match x {
                        Json::Str(s) => s.clone(),
                        other => format!("{}", other.i64()),
                    })
                    .collect::<Vec<_>>()
                    .join(" "),
            }
        })
        .collect()
}

/// `instancedCases` of `gen_picking.ts`: the camera over one instance of a
/// ground `InstancedMesh`, one ray at the web's client pixel of its origin.
fn instanced_cases(c: &mut Cmp, w: &mut World, cases: &Json, name: &str) {
    c.eq(&format!("{name} n"), cases.arr().len() >= 2, true);
    for (k, rec) in cases.arr().iter().enumerate() {
        let a = rec.arr();
        let ctx = format!("{name} {k}");
        let t = a[3].hx();
        w.set_cam(t[0], t[1], 9.0);
        w.view.render();
        let fs = w.b.field.field.clone();
        let ps = PickScene::new(&fs);
        let idx = usize::try_from(a[0].i64()).expect("idx");
        let Some(node) = fs
            .ground_pick
            .iter()
            .copied()
            .find(|&n| ps.traverse_index(n) == idx)
        else {
            c.err(format!(
                "{ctx}: no ground pick node at traverse index {idx}"
            ));
            continue;
        };
        let m = fs.instanced_at(node).expect("instanced mesh");
        c.eq(
            &format!("{ctx} count"),
            m.count,
            usize::try_from(a[1].i64()).expect("n"),
        );
        let i = usize::try_from(a[2].i64()).expect("i");
        let mut im = [0.0f32; 16];
        im.copy_from_slice(&m.matrices[i * 16..i * 16 + 16]);
        let p = Mat4::multiply(&ps.world(node), &Mat4::from_f32(&im)).position();
        c.fs(&format!("{ctx} origin"), &[p.x, p.z], &t);
        let px = a[4].hx();
        let canvas = w.canvas;
        let Some(ray) = w.view.ray_from_canvas(px[0], px[1], &canvas) else {
            c.err(format!("{ctx}: rust no ray"));
            continue;
        };
        c.fs(
            &format!("{ctx} ray"),
            &[
                ray.origin.x,
                ray.origin.y,
                ray.origin.z,
                ray.direction.x,
                ray.direction.y,
                ray.direction.z,
            ],
            &a[5].hx(),
        );
        let cam = RayCamera::of(&w.view);
        let hits = intersect_objects(&ps, &ray, &cam, &[node], false);
        let want = a[6].arr();
        c.eq(&format!("{ctx} hits"), hits.len(), want.len());
        for (j, (h, wh)) in hits.iter().zip(want).enumerate() {
            let wh = wh.arr();
            c.fs(
                &format!("{ctx} hit {j}"),
                &[h.distance, h.point.x, h.point.y, h.point.z],
                &wh[0].hx(),
            );
            c.eq(
                &format!("{ctx} hit {j} instance"),
                h.instance.map(|x| i64::try_from(x).expect("i64")),
                Some(wh[1].i64()),
            );
        }
    }
}

#[test]
fn extra_siege_cases_match_web() {
    let mut c = Cmp::default();
    let rect = Canvas::new(1280.0, 720.0, 13.0, 7.0);
    // siege A: _doBoxSelect on the constructor camera (no render, no resize)
    {
        let (mut w, p) = siege_world();
        let e = p.get("extra").get("staleBox");
        w.canvas = rect;
        c.fs("staleBox cam", &cam_nums(&w.view), &e.get("cam").hx());
        let fs = w.b.field.field.clone();
        let atk: Vec<usize> = (0..w.b.atk.len()).collect();
        for (k, rec) in e.get("box").arr().iter().enumerate() {
            let a = rec.arr();
            let r: Vec<f64> = a[0].arr().iter().map(num).collect();
            let all = w.units();
            let mut view = w.view.clone();
            let found = box_select(&mut view, &fs, &all, &atk, (r[0], r[1], r[2], r[3]), &rect);
            drop(all);
            w.view = view;
            let mut got = vec!["clear".to_owned()];
            got.extend(found.iter().map(|&i| w.ids[i].clone()));
            let want: Vec<String> = a[1].arr().iter().map(|x| x.str().to_owned()).collect();
            c.eq(&format!("staleBox {k}"), got, want);
        }
    }
    // siege B: _raycastFromCanvas on the constructor camera, camera ops, instanced picks
    {
        let (mut w, p) = siege_world();
        let e = p.get("extra");
        w.canvas = rect;
        for (k, rec) in e.get("staleRays").arr().iter().enumerate() {
            let a = rec.arr();
            let Some(ray) = w.view.ray_from_canvas(num(&a[0]), num(&a[1]), &rect) else {
                c.err(format!("staleRay {k}: rust no ray"));
                continue;
            };
            c.fs(
                &format!("staleRay {k}"),
                &[
                    ray.origin.x,
                    ray.origin.y,
                    ray.origin.z,
                    ray.direction.x,
                    ray.direction.y,
                    ray.direction.z,
                ],
                &a[2].hx(),
            );
        }
        let s = p.get("siege");
        let fl: Vec<bool> = s
            .get("panFlags")
            .arr()
            .iter()
            .map(|x| x.i64() == 1)
            .collect();
        let flags = (fl[0], fl[1], fl[2], fl[3]);
        let mut pan = DragPan::default();
        for (k, op) in e.get("camOps").arr().iter().enumerate() {
            cam_op(&mut c, &mut w, &mut pan, flags, op, k);
        }
        instanced_cases(&mut c, &mut w, e.get("siegeInstanced"), "siegeInstanced");
    }
    println!("extra siege: {} numbers, {} checks", c.scalars, c.checks);
    c.finish("extra siege");
}

#[test]
#[allow(clippy::too_many_lines)]
fn extra_deploy_cases_match_web() {
    let (mut w, p) = deploy_world();
    let e = p.get("extra");
    let s = p.get("deploy");
    let mut c = Cmp::default();
    w.canvas = Canvas::new(1280.0, 720.0, 13.0, 7.0);
    let canvas = w.canvas;
    w.view.sync_renderer_size(&canvas);
    w.set_cam(33.0, 77.5, 30.0);
    w.view.render();
    let player = w.player();
    // _onBattleClick in a field battle (enemies on open ground; roundNo 2, no modifiers)
    let q = battle_queue_only(false, false, false, 2.0);
    {
        let fs = w.b.field.field.clone();
        let ps = PickScene::new(&fs);
        for (k, rec) in e.get("fieldBattleClicks").arr().iter().enumerate() {
            let a = rec.arr();
            let xy = a[0].hx();
            let nsel = usize::try_from(a[1].i64()).expect("n");
            w.view.render();
            let all = w.units();
            let mut view = w.view.clone();
            let got = battle_click(
                &mut view,
                &ps,
                &w.grid,
                &all,
                &w.occ,
                player,
                nsel,
                (xy[0], xy[1]),
                &canvas,
            );
            drop(all);
            w.view = view;
            let log: Vec<String> = match got {
                BattleClick::PickOwn(i) => vec![format!("pick {} 0 0", w.ids[i])],
                BattleClick::Attack(i) => vec![format!("attack {} {}", w.ids[i], u8::from(q))],
                BattleClick::Move(col, row) => vec![format!("move {col} {row} {}", u8::from(q))],
                BattleClick::Nothing => vec![],
            };
            c.eq(&format!("field click {k}"), log, log_strings(&a[2]));
        }
    }
    // deploy clicks with ring colours
    let z: Vec<i32> = s.get("zone").arr().iter().map(Json::i32).collect();
    let in_zone =
        move |col: i32, row: i32| col >= z[0] && col <= z[1] && row >= z[2] && row <= z[3];
    let groups: HashMap<String, Option<String>> = load("dynamics.json")
        .get("deploy")
        .get("groups")
        .arr()
        .iter()
        .map(|g| {
            let a = g.arr();
            (
                a[0].str().to_owned(),
                if a[1].is_null() {
                    None
                } else {
                    Some(a[1].str().to_owned())
                },
            )
        })
        .collect();
    let mut sel = DeploySelection::default();
    let mut rings = SelectionRings::default();
    let roster_ix = w.roster();
    for (k, rec) in e.get("deployClicks").get("clicks").arr().iter().enumerate() {
        let a = rec.arr();
        let xy = a[0].hx();
        let mods = a[1].i64();
        let (ctrl, shift) = (mods & 1 != 0, mods & 2 != 0);
        let prefer = a[2].i64() == 1;
        w.view.render();
        let fs_now = w.b.field.field.clone();
        let ps = PickScene::new(&fs_now);
        let decision = {
            let all = w.units();
            let ctx = DeployCtx {
                units: &all,
                player,
                occ: &w.occ,
                in_zone: &in_zone,
            };
            let mut view = w.view.clone();
            let d = deploy_click(
                &mut view,
                &ps,
                &w.grid,
                &ctx,
                &sel,
                prefer,
                (xy[0], xy[1]),
                &canvas,
            );
            w.view = view;
            d
        };
        drop(ps);
        let mut log: Vec<String> = Vec::new();
        match decision {
            DeployClick::Pick(i) => {
                if let Some(ri) = roster_ix.iter().position(|&x| x == i) {
                    let mut fs = w.b.field.field.clone();
                    let refreshed = {
                        let all = w.units();
                        let roster: Vec<RosterPick<'_>> = roster_ix
                            .iter()
                            .map(|&x| RosterPick {
                                pick: all[x],
                                group_id: groups.get(&w.ids[x]).cloned().flatten(),
                            })
                            .collect();
                        handle_deploy_unit_pick(
                            &mut fs, &mut rings, &mut sel, &roster, &all, ri, ctrl, shift,
                        )
                    };
                    w.b.field.field = fs;
                    if refreshed {
                        log.push("ghosts".into());
                    }
                } else {
                    log.push(format!("pick of a non-roster unit {}", w.ids[i]));
                }
            }
            DeployClick::Place { col, row } => {
                let ids: Vec<String> = sel
                    .selected
                    .iter()
                    .filter(|id| roster_ix.iter().any(|&x| &w.ids[x] == *id))
                    .cloned()
                    .collect();
                log.push(format!("place {} {col} {row} {col} {row}", ids.join(",")));
                clear_deploy_ghosts(&mut w.b.field.field);
                log.push("ghosts".into());
            }
            DeployClick::Clear { feedback } => {
                if let Some(m) = feedback {
                    log.push(format!("feedback {m}"));
                }
                log.push("clearSel".into());
            }
            DeployClick::Nothing => {}
        }
        c.eq(
            &format!("extra deploy click {k} log"),
            log,
            log_strings(&a[3]),
        );
        let st = a[4].arr();
        let want_sel: Vec<String> = st[0].arr().iter().map(|x| x.str().to_owned()).collect();
        c.eq(
            &format!("extra deploy click {k} selected"),
            sel.selected.clone(),
            want_sel,
        );
        let want_ds = if st[1].is_null() {
            None
        } else {
            Some(st[1].str().to_owned())
        };
        c.eq(
            &format!("extra deploy click {k} deploySelected"),
            sel.deploy_selected.clone(),
            want_ds,
        );
        let sc = &w.b.field.field.scene;
        let got_rings: Vec<(String, u32)> = rings
            .rings
            .iter()
            .map(|(id, ring)| {
                let m = sc.nodes[*ring].mesh().expect("ring mesh").material();
                (id.clone(), sc.materials[m].hex())
            })
            .collect();
        let want_rings: Vec<(String, u32)> = st[2]
            .arr()
            .iter()
            .map(|x| {
                let x = x.arr();
                (x[0].str().to_owned(), x[1].u32())
            })
            .collect();
        c.eq(
            &format!("extra deploy click {k} rings"),
            got_rings,
            want_rings,
        );
    }
    // pickBattleGroundTileFromMeshes on score ties (horizontal rays, `score > bestScore`)
    {
        let gt = e.get("groundTies");
        c.eq("groundTies n", gt.get("ties").arr().is_empty(), false);
        let fs = w.b.field.field.clone();
        let ps = PickScene::new(&fs);
        let cam = RayCamera::of(&w.view);
        for key in ["ties", "others"] {
            for (k, rec) in gt.get(key).arr().iter().enumerate() {
                let a = rec.arr();
                let r = a[0].hx();
                let ray = Ray {
                    origin: Vec3::new(r[0], r[1], r[2]),
                    direction: Vec3::new(r[3], r[4], r[5]),
                };
                let got = pick_ground_tile_from_meshes(&ps, &ray, &cam, &w.grid, &fs.ground_pick);
                c.eq(&format!("groundTies {key} {k}"), tcode(got), a[1].i64());
                let n = intersect_objects(&ps, &ray, &cam, &fs.ground_pick, false).len();
                c.eq(
                    &format!("groundTies {key} {k} hits"),
                    i64::try_from(n).expect("n"),
                    a[2].i64(),
                );
            }
        }
    }
    instanced_cases(&mut c, &mut w, e.get("deployInstanced"), "deployInstanced");
    println!("extra deploy: {} numbers, {} checks", c.scalars, c.checks);
    c.finish("extra deploy");
}
