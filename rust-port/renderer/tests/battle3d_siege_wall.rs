//! MOD-14 "battle 3D", round 1 (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1): the
//! Rust `battle::siege_wall` port of `battle/siegeWall.ts` against object
//! graphs produced by RUNNING the web code of `edb8fb56` (three@0.169.0,
//! node v22.22.0), see `tests/fixtures/battle3d/README.md` and
//! `dyspozycje/rust-port/p4/P4-36-MOD14-BATTLE-3D.md`.
//!
//! Every float is compared bit for bit (`to_bits`): positions, Euler
//! angles, quaternions, scales, world matrices, bounding boxes, linear
//! colours, roughness / metalness / opacity, geometry constructor
//! parameters, `userData` numbers and map keys. Geometry is compared by
//! vertex / triangle counts and the FNV-1a hash of the `Float32` attributes,
//! index and groups. Material sharing is compared as a bijection between
//! web material identities and Rust material slots. Any difference fails.

#![allow(clippy::float_cmp)]

use std::collections::HashMap;
use std::path::PathBuf;

use civ_renderer::battle::siege_wall::{
    attach_row_breach_panels, build_siege_wall, build_siege_wall_web_id, geo_parameters, SiegeWall,
    SiegeWallOpts, WallStyle,
};
use civ_renderer::core::bronze::{BronzeCiv, BRONZE_CIVS};
use civ_renderer::geom::Vec3;
use civ_renderer::scene::{geo_hash, Fnv, NodeId, NodeKind};

// ---------------------------------------------------------------------------
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
        for (i, (&a, &b)) in rust.iter().zip(web).enumerate() {
            self.f(&format!("{ctx}[{i}]"), a, b);
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
            self.errors.push("...".to_owned());
        }
    }
    fn finish(self, what: &str) {
        assert!(
            self.errors.is_empty(),
            "{what}: {} differences (scalars {}, checks {}):\n{}",
            self.errors.len(),
            self.scalars,
            self.checks,
            self.errors.join("\n")
        );
        assert!(self.scalars + self.checks > 0, "{what}: nothing compared");
        println!(
            "{what}: scalars {} (bit-equal), checks {}",
            self.scalars, self.checks
        );
    }
}

// ---------------------------------------------------------------------------
// Rust-side records (the same quantities as `treeRecord` in gen.ts).

/// `Math.min` / `Math.max` as the generator's bbox loop uses them: a NaN
/// operand propagates with its bits (V8 on x86-64 returns the NaN it got,
/// here the `0xfff8…` produced by `0/0` in the `no-side` cases).
fn nan_min(a: f64, b: f64) -> f64 {
    if a.is_nan() {
        a
    } else if b.is_nan() {
        b
    } else if a < b || (a == b && a.is_sign_negative()) {
        a
    } else {
        b
    }
}

fn nan_max(a: f64, b: f64) -> f64 {
    if a.is_nan() {
        a
    } else if b.is_nan() {
        b
    } else if a > b || (a == b && a.is_sign_positive()) {
        a
    } else {
        b
    }
}

struct Summary {
    order: Vec<(NodeId, Option<usize>)>,
    pos: HashMap<NodeId, usize>,
    meshes: u32,
    tris: u32,
    materials: usize,
    sig: u32,
    bbox: [f64; 6],
}

fn summarize(w: &SiegeWall) -> Summary {
    let s = &w.scene;
    let order = s.traverse_with_parent();
    let pos: HashMap<NodeId, usize> = order
        .iter()
        .enumerate()
        .map(|(i, &(id, _))| (id, i))
        .collect();
    let world = s.world_matrices(None);
    let mut f = Fnv::default();
    let mut meshes = 0u32;
    let mut tris = 0u32;
    let mut mats: Vec<usize> = Vec::new();
    let mut b = [
        f64::INFINITY,
        f64::INFINITY,
        f64::INFINITY,
        f64::NEG_INFINITY,
        f64::NEG_INFINITY,
        f64::NEG_INFINITY,
    ];
    for &(id, _) in &order {
        let NodeKind::Mesh(md) = &s.nodes[id].kind else {
            continue;
        };
        let g = md.geo.mesh();
        meshes += 1;
        tris += u32::try_from(g.triangle_count()).expect("tris");
        let mt = &s.materials[md.material()];
        if !mats.contains(&md.material()) {
            mats.push(md.material());
        }
        f.u32(geo_hash(&g));
        f.u32(mt.hex());
        f.f64(mt.roughness);
        f.f64(mt.metalness);
        f.u32(mt.side.three_value());
        for e in world[id].e {
            f.f64(e);
        }
        for v in g.positions.chunks_exact(3) {
            let p =
                Vec3::new(f64::from(v[0]), f64::from(v[1]), f64::from(v[2])).apply_mat4(&world[id]);
            b[0] = nan_min(b[0], p.x);
            b[1] = nan_min(b[1], p.y);
            b[2] = nan_min(b[2], p.z);
            b[3] = nan_max(b[3], p.x);
            b[4] = nan_max(b[4], p.y);
            b[5] = nan_max(b[5], p.z);
        }
    }
    f.u32(meshes);
    Summary {
        order,
        pos,
        meshes,
        tris,
        materials: mats.len(),
        sig: f.finish(),
        bbox: b,
    }
}

fn opts_of(c: &Json) -> SiegeWallOpts {
    let o = c.get("opts");
    let v = c.get("optsHx").hx();
    let mut opts = SiegeWallOpts::new(v[0], v[1]);
    if o.opt("height").is_some() {
        opts.height = Some(v[2]);
    }
    if o.opt("gateWidthTiles").is_some() {
        opts.gate_width_tiles = Some(v[3]);
    }
    if let Some(c) = o.opt("ownerColor") {
        opts.owner_color = Some(c.u32());
    }
    opts
}

fn usz(j: &Json) -> usize {
    usize::try_from(j.i64()).expect("usize")
}

#[allow(clippy::too_many_lines)]
fn cmp_nodes(c: &mut Cmp, ctx: &str, w: &SiegeWall, sum: &Summary, nodes: &[Json]) {
    let s = &w.scene;
    c.eq(&format!("{ctx} node count"), sum.order.len(), nodes.len());
    if sum.order.len() != nodes.len() {
        return;
    }
    let world = s.world_matrices(None);
    // Material identity: web id (first appearance) <-> Rust slot, both ways.
    let mut web_to_rust: HashMap<u32, usize> = HashMap::new();
    let mut rust_to_web: HashMap<usize, u32> = HashMap::new();
    for (i, (&(id, parent), rec)) in sum.order.iter().zip(nodes).enumerate() {
        let n = &s.nodes[id];
        let cx = format!("{ctx} node {i}");
        let kind = match n.kind {
            NodeKind::Mesh(_) => "Mesh",
            NodeKind::Group => "Group",
            _ => "Other",
        };
        c.eq(&format!("{cx} kind"), kind, rec.get("k").str());
        c.eq(
            &format!("{cx} name"),
            n.name.as_str(),
            rec.get("name").str(),
        );
        c.eq(
            &format!("{cx} parent"),
            parent.map_or(-1, |p| i64::try_from(p).expect("idx")),
            rec.get("parent").i64(),
        );
        c.fs(
            &format!("{cx} p"),
            &[n.position.x, n.position.y, n.position.z],
            &rec.get("p").hx(),
        );
        let (r_web, q_web) = match (rec.opt("r"), rec.opt("q")) {
            (Some(r), Some(q)) => (r.hx(), q.hx()),
            _ => (vec![0.0; 3], vec![0.0, 0.0, 0.0, 1.0]),
        };
        c.fs(
            &format!("{cx} r"),
            &[n.rotation.x, n.rotation.y, n.rotation.z],
            &r_web,
        );
        c.fs(
            &format!("{cx} q"),
            &[
                n.quaternion.x,
                n.quaternion.y,
                n.quaternion.z,
                n.quaternion.w,
            ],
            &q_web,
        );
        let s_web = rec.opt("s").map_or_else(|| vec![1.0; 3], Json::hx);
        c.fs(
            &format!("{cx} s"),
            &[n.scale.x, n.scale.y, n.scale.z],
            &s_web,
        );
        if let Some(wj) = rec.opt("w") {
            c.fs(&format!("{cx} w"), &world[id].e, &wj.hx());
        }
        c.eq(
            &format!("{cx} castShadow"),
            n.cast_shadow,
            rec.get("cs").bool(),
        );
        c.eq(
            &format!("{cx} receiveShadow"),
            n.receive_shadow,
            rec.get("rs").bool(),
        );
        c.eq(
            &format!("{cx} renderOrder"),
            i64::from(n.render_order),
            rec.get("ro").i64(),
        );
        c.eq(&format!("{cx} visible"), n.visible, rec.get("vis").bool());
        let NodeKind::Mesh(md) = &n.kind else {
            continue;
        };
        // material
        let mj = rec.get("mat");
        let slot = md.material();
        let wid = mj.get("id").u32();
        let a = *web_to_rust.entry(wid).or_insert(slot);
        let b = *rust_to_web.entry(slot).or_insert(wid);
        c.eq(&format!("{cx} material identity"), (a, b), (slot, wid));
        c.eq(&format!("{cx} material array"), md.material_array, false);
        let mt = &s.materials[slot];
        c.eq(
            &format!("{cx} mat type"),
            mt.kind.three_type(),
            mj.get("t").str(),
        );
        c.eq(&format!("{cx} mat color"), mt.hex(), mj.get("color").u32());
        let lin = mt.linear_color();
        c.fs(
            &format!("{cx} mat lin"),
            &[lin.r, lin.g, lin.b],
            &mj.get("lin").hx(),
        );
        c.f(
            &format!("{cx} mat roughness"),
            mt.roughness,
            mj.get("rough").hx()[0],
        );
        c.f(
            &format!("{cx} mat metalness"),
            mt.metalness,
            mj.get("metal").hx()[0],
        );
        c.eq(
            &format!("{cx} mat side"),
            mt.side.three_value(),
            mj.get("side").u32(),
        );
        c.eq(
            &format!("{cx} mat flat"),
            mt.flat_shading,
            mj.get("flat").bool(),
        );
        c.eq(
            &format!("{cx} mat transparent"),
            mt.transparent,
            mj.get("transparent").bool(),
        );
        c.f(
            &format!("{cx} mat opacity"),
            mt.opacity,
            mj.get("opacity").hx()[0],
        );
        c.eq(
            &format!("{cx} mat depthWrite"),
            mt.depth_write,
            mj.get("dw").bool(),
        );
        c.eq(
            &format!("{cx} mat depthTest"),
            mt.depth_test,
            mj.get("dt").bool(),
        );
        c.eq(
            &format!("{cx} mat emissive"),
            mt.emissive.to_hex(),
            mj.get("emissive").u32(),
        );
        // geometry
        let gj = rec.get("geo");
        let g = md.geo.mesh();
        c.eq(
            &format!("{cx} geo type"),
            md.geo.three_type(),
            gj.get("t").str(),
        );
        c.eq(
            &format!("{cx} geo vtx"),
            g.vertex_count(),
            usz(gj.get("vtx")),
        );
        c.eq(
            &format!("{cx} geo tri"),
            g.triangle_count(),
            usz(gj.get("tri")),
        );
        c.eq(
            &format!("{cx} geo hash"),
            geo_hash(&g),
            gj.get("hash").u32(),
        );
        let par = geo_parameters(&md.geo).unwrap_or_default();
        c.fs(&format!("{cx} geo parameters"), &par, &gj.get("par").hx());
    }
}

fn cmp_user_data(c: &mut Cmp, ctx: &str, w: &SiegeWall, sum: &Summary, ud: &Json) {
    let u = &w.user_data;
    let keys: Vec<&str> = ud.get("keys").arr().iter().map(Json::str).collect();
    c.eq(&format!("{ctx} userData keys"), u.keys(), keys);
    let idx = |id: NodeId| i64::try_from(*sum.pos.get(&id).expect("node in tree")).expect("idx");
    let segs = ud.get("wallSegsByLocalX").arr();
    c.eq(
        &format!("{ctx} wallSegsByLocalX size"),
        u.wall_segs_by_local_x.len(),
        segs.len(),
    );
    for (i, ((k, id), e)) in u.wall_segs_by_local_x.iter().zip(segs).enumerate() {
        let e = e.arr();
        c.f(
            &format!("{ctx} wallSegsByLocalX[{i}] key"),
            *k,
            e[0].hx()[0],
        );
        c.eq(
            &format!("{ctx} wallSegsByLocalX[{i}] mesh"),
            idx(*id),
            e[1].i64(),
        );
    }
    c.f(
        &format!("{ctx} wallWalkY"),
        u.wall_walk_y,
        ud.get("wallWalkY").hx()[0],
    );
    c.f(&format!("{ctx} depth"), u.depth, ud.get("depth").hx()[0]);
    c.f(
        &format!("{ctx} gateCenterX"),
        u.gate_center_x,
        ud.get("gateCenterX").hx()[0],
    );
    c.eq(
        &format!("{ctx} gate"),
        idx(u.gate),
        ud.get("gate").get("node").i64(),
    );
    c.eq(
        &format!("{ctx} gateOpen"),
        u.gate_open,
        ud.get("gateOpen").bool(),
    );
    for (name, map) in [
        ("rowWallMeshes", u.row_wall_meshes.as_ref()),
        ("rowBreachPanels", u.row_breach_panels.as_ref()),
    ] {
        let Some(wj) = ud.opt(name) else {
            c.eq(&format!("{ctx} {name} absent"), map.is_none(), true);
            continue;
        };
        let Some(map) = map else {
            c.err(format!("{ctx} {name}: missing in Rust"));
            continue;
        };
        let wj = wj.arr();
        c.eq(&format!("{ctx} {name} size"), map.len(), wj.len());
        for (i, ((row, ids), e)) in map.iter().zip(wj).enumerate() {
            let e = e.arr();
            c.f(&format!("{ctx} {name}[{i}] row"), *row, e[0].hx()[0]);
            let web: Vec<i64> = e[1].arr().iter().map(Json::i64).collect();
            let rust: Vec<i64> = ids.iter().map(|&id| idx(id)).collect();
            c.eq(&format!("{ctx} {name}[{i}] meshes"), rust, web);
        }
    }
}

fn build_case(c: &Json) -> SiegeWall {
    build_siege_wall_web_id(c.get("civ").str(), &opts_of(c))
}

#[test]
fn siege_wall_matches_web() {
    let root = load("siege_wall.json");
    assert_eq!(root.get("three").str(), "169");
    let cases = root.get("cases").arr();
    assert_eq!(cases.len(), 95, "case count");
    let mut c = Cmp::default();
    let mut full_trees = 0;
    let mut meshes = 0u32;
    for case in cases {
        let id = case.get("id").str();
        let mut w = build_case(case);
        let before = summarize(&w);
        cmp_user_data(&mut c, &format!("{id} build"), &w, &before, case.get("ud"));
        for (bi, b) in case.get("breaches").arr().iter().enumerate() {
            let a = b.get("args").hx();
            attach_row_breach_panels(&mut w, a[0], a[1], a[2], a[3], a[4], a[5]);
            cmp_user_data(
                &mut c,
                &format!("{id} breach {bi}"),
                &w,
                &before,
                b.get("ud"),
            );
        }
        let sum = summarize(&w);
        c.eq(
            &format!("{id} nodeCount"),
            sum.order.len(),
            usz(case.get("nodeCount")),
        );
        c.eq(
            &format!("{id} meshes"),
            sum.meshes,
            case.get("meshes").u32(),
        );
        c.eq(&format!("{id} tris"), sum.tris, case.get("tris").u32());
        c.eq(
            &format!("{id} materials"),
            sum.materials,
            usz(case.get("materials")),
        );
        c.eq(&format!("{id} sig"), sum.sig, case.get("sig").u32());
        c.fs(&format!("{id} bbox"), &sum.bbox, &case.get("bbox").hx());
        if let Some(nodes) = case.opt("nodes") {
            cmp_nodes(&mut c, id, &w, &sum, nodes.arr());
            full_trees += 1;
        }
        meshes += sum.meshes;
    }
    assert_eq!(full_trees, 93, "full trees");
    assert_eq!(meshes, 11_877, "meshes over all cases");
    c.finish("siegeWall: 95 cases");
}

/// The game call (`battleScene.ts:3905-3910`): every civ of `BRONZE_CIVS`
/// through the typed entry point gives the same tree as the web-string one,
/// and `aztek` / `hetyci` build the Grecja wall.
#[test]
fn siege_wall_typed_entry_matches_web_ids() {
    let root = load("siege_wall.json");
    let cases = root.get("cases").arr();
    let opts = SiegeWallOpts::battle(156.0, 1.0);
    for civ in BRONZE_CIVS {
        let id = format!("game-{}", civ.web_id());
        let case = cases
            .iter()
            .find(|c| c.get("id").str() == id)
            .expect("game case");
        assert_eq!(opts_of(case), opts, "{id} opts");
        let typed = build_siege_wall(civ, &opts);
        let by_id = build_case(case);
        assert_eq!(typed, by_id, "{id}");
        let sum = summarize(&typed);
        assert_eq!(sum.sig, case.get("sig").u32(), "{id} sig");
        // The wall goes to the GPU layer through the one scene export (P4.27):
        // one exported mesh per web mesh, all MeshStandardMaterial.
        let ex = typed.scene.export_gpu(None);
        assert_eq!(
            ex.meshes.len(),
            usize::try_from(sum.meshes).expect("n"),
            "{id} export"
        );
        assert!(ex.sprites.is_empty(), "{id} sprites");
    }
    assert_eq!(
        build_siege_wall(BronzeCiv::Hetyci, &opts).style,
        WallStyle::Grecja
    );
}

/// Web quirk kept 1:1 (documented in `attach_row_breach_panels`): in the
/// game call the geometric gate covers local x in {-0.5, 0.5} (rows 77, 78)
/// while the battle's gate rows are 76-77, so row 78 has no wall mesh and
/// row 79 maps to segment 2.
#[test]
fn siege_wall_game_rows_quirk() {
    let mut w = build_siege_wall(BronzeCiv::Rzym, &SiegeWallOpts::battle(156.0, 1.0));
    attach_row_breach_panels(&mut w, 77.5, 0.0, 155.0, 76.0, 77.0, 1.0);
    let u = &w.user_data;
    assert_eq!(u.wall_segs_by_local_x.len(), 154);
    assert!(u.row_wall(76.0).is_none() && u.row_wall(77.0).is_none());
    assert!(u.row_wall(78.0).is_none(), "row 78: key 1 has no segment");
    let seg2 = u.wall_seg(2.0).expect("segment 2");
    assert_eq!(u.row_wall(79.0), Some(&[seg2][..]));
    assert_eq!(u.row_wall_meshes.as_ref().map(Vec::len), Some(153));
}
