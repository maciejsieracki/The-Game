//! MOD-11 improvement / resource model tests
//! (R-RUSTPORT-P4-20-MOD11-IMPROVEMENTS-Q1): the Rust
//! `models::improvements` port against object graphs produced by the **web**
//! code (`edb8fb56`, modules imported unchanged, three@0.169.0), see
//! `tests/fixtures/improvements/README.md` and
//! `dyspozycje/rust-port/p4/P4-20-MOD11-IMPROVEMENTS.md`.
//!
//! `models.json`: full graphs — every node (type, parent, position,
//! quaternion, scale, shadows, `userData`, `matrixWorld`), every mesh
//! (geometry type + parameters, vertex/index count, FNV-1a hash of the
//! Float32 attributes / indices / groups, material slot by first use) and
//! every material (model, linear colour, `getHex`, `flatShading`,
//! metalness/roughness, linear emissive), totals and `Box3.setFromObject(g,
//! true)`; compared scalar by scalar on the bit level.
//! `sigs.json`: the combinatorial cases (64 road masks × 2, sector layouts,
//! stacks, food stacks) as counts + bbox + an FNV-1a signature over exactly
//! the same scalars, in the same order.

#![allow(clippy::float_cmp, clippy::too_many_lines)]

use std::collections::HashMap;
use std::path::PathBuf;

use civ_renderer::geom::Mesh;
use civ_renderer::models::improvements::droga::{
    build_droga_gwiazda, road_arm_length, road_mask_arms, road_mask_has_node,
    road_mask_is_lone_patch, road_port_rotation_y, RoadTyp, ROAD_ARM_WIDTH_RATIO, ROAD_MASK_FULL,
    ROAD_NODE_RADIUS_RATIO,
};
use civ_renderer::models::improvements::kopalnie::{build_kopalnia_cyny, build_kopalnia_zlota};
use civ_renderer::models::improvements::model::{hex_to_linear, ExtraGeo, MatKind};
use civ_renderer::models::improvements::p2::{self, WariantFarmy};
use civ_renderer::models::improvements::p3a;
use civ_renderer::models::improvements::p3b::{self, ZlozeTyp};
use civ_renderer::models::improvements::roblox::build_style_tarasy_terrace;
use civ_renderer::models::improvements::zasoby::{
    build_styled_cow, build_styled_sheep, place_livestock_figure, place_livestock_pair, Livestock,
    LIVESTOCK_FIGURE_SCALE,
};
use civ_renderer::models::improvements::zwierzeta::{
    self as zw, pastwisko_s, pastwisko_sloty, trzoda_sloty, JakoscTrzody, PozaKrowy, PozaOwcy,
    PozaSwini, WariantKrowy, WariantOwcy, WariantSwini,
};
use civ_renderer::models::improvements::{
    build_improvement, build_improvement_sectored, build_improvement_stack,
    build_roblox_food_stack, build_styled_resource_overlay, ImprovementKey, ImprovementModel,
    Nakladka, SectorRelief, DEFAULT_OWNER_COL, IMPROVEMENTS, SECTOR_R_ELEVATED,
};
use civ_renderer::models::unit_core::model::{Prim, ROOT};

// ---------------------------------------------------------------------------
// Minimal JSON reader (the crate has no dependencies; fixtures are trusted
// files produced by the reference script). Same reader as tests/terrain_web_parity.rs.

#[derive(Debug, Clone)]
enum Json {
    Null,
    Bool(bool),
    Num(f64),
    Str(String),
    Arr(Vec<Json>),
    Obj(Vec<(String, Json)>),
}

#[allow(dead_code)]
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
    fn f64s(&self) -> Vec<f64> {
        self.arr().iter().map(Json::num).collect()
    }
    fn i32(&self) -> i32 {
        let n = self.num();
        assert!(
            n.fract() == 0.0 && n >= f64::from(i32::MIN) && n <= f64::from(i32::MAX),
            "not an i32: {n}"
        );
        #[allow(clippy::cast_possible_truncation)]
        let v = n as i32;
        v
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
                    out.push(match e {
                        b'n' => b'\n',
                        b't' => b'\t',
                        b'"' => b'"',
                        b'\\' => b'\\',
                        b'/' => b'/',
                        _ => panic!("unsupported escape"),
                    });
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
        "improvements",
        name,
    ]
    .iter()
    .collect();
    let text = std::fs::read_to_string(&p).unwrap_or_else(|e| panic!("read {}: {e}", p.display()));
    let mut parser = Parser {
        s: text.as_bytes(),
        i: 0,
    };
    parser.value()
}

// ---------------------------------------------------------------------------
// FNV-1a 32-bit over little-endian bytes (same as `Fnv` in gen.ts).

struct Fnv(u32);

impl Fnv {
    fn new() -> Self {
        Self(0x811c_9dc5)
    }
    fn u32(&mut self, v: u32) {
        for b in v.to_le_bytes() {
            self.0 ^= u32::from(b);
            self.0 = self.0.wrapping_mul(0x0100_0193);
        }
    }
    fn f64(&mut self, v: f64) {
        let bits = v.to_bits();
        #[allow(clippy::cast_possible_truncation)]
        {
            self.u32(bits as u32);
            self.u32((bits >> 32) as u32);
        }
    }
}

fn geo_hash(g: &Mesh) -> u32 {
    let mut f = Fnv::new();
    for arr in [&g.positions, &g.normals, &g.uvs] {
        for &v in arr {
            f.u32(v.to_bits());
        }
    }
    if let Some(idx) = &g.indices {
        for &i in idx {
            f.u32(i);
        }
    }
    for gr in &g.groups {
        f.u32(gr.start);
        f.u32(gr.count);
        f.u32(gr.material_index);
    }
    f.0
}

// ---------------------------------------------------------------------------
// Rust-side dump with the same structure as gen.ts `dumpModel`.

#[derive(Debug)]
struct GeoDump {
    ty: &'static str,
    params: Vec<(&'static str, f64)>,
    open: bool,
}

#[derive(Debug)]
struct NodeDump {
    mesh: bool,
    parent: i64,
    p: [f64; 3],
    q: [f64; 4],
    s: [f64; 3],
    cs: bool,
    rs: bool,
    w: [f64; 16],
    ud: Option<(i64, i64, f64)>,
    geo: Option<GeoDump>,
    mat: usize,
    nv: usize,
    ni: i64,
    hash: u32,
}

#[derive(Debug)]
struct MatDump {
    standard: bool,
    hex: u32,
    lin: [f64; 3],
    flat: bool,
    metal: f64,
    rough: f64,
    em: [f64; 3],
}

#[derive(Debug)]
struct Dump {
    nodes: Vec<NodeDump>,
    mats: Vec<MatDump>,
    meshes: usize,
    vertices: usize,
    triangles: usize,
    bbox: Option<[f64; 6]>,
    sig: u32,
}

fn u(n: usize) -> u32 {
    u32::try_from(n).expect("fits u32")
}

fn geo_dump(m: &ImprovementModel, id: usize) -> GeoDump {
    if let Some(x) = m.node_ext[id].extra {
        return match x {
            ExtraGeo::Dodecahedron { r, detail } => GeoDump {
                ty: "dodeca",
                params: vec![("r", r), ("detail", f64::from(detail))],
                open: false,
            },
            ExtraGeo::TwistedCone { r, h, radial, .. } => GeoDump {
                ty: "cone",
                params: vec![("r", r), ("h", h), ("seg", f64::from(radial))],
                open: false,
            },
        };
    }
    let Some(md) = m.tree.nodes[id].mesh else {
        panic!("not a mesh")
    };
    match md.geo.prim() {
        Prim::Box { w, h, d } => GeoDump {
            ty: "box",
            params: vec![("w", w), ("h", h), ("d", d)],
            open: false,
        },
        Prim::Cylinder {
            rt,
            rb,
            h,
            radial,
            open,
        } => GeoDump {
            ty: "cyl",
            params: vec![("rt", rt), ("rb", rb), ("h", h), ("seg", f64::from(radial))],
            open,
        },
        Prim::Cone { r, h, radial } => GeoDump {
            ty: "cone",
            params: vec![("r", r), ("h", h), ("seg", f64::from(radial))],
            open: false,
        },
        Prim::Icosahedron { r, detail } => GeoDump {
            ty: "ico",
            params: vec![("r", r), ("detail", f64::from(detail))],
            open: false,
        },
        other => panic!("unexpected prim {other:?}"),
    }
}

fn dump(m: &ImprovementModel) -> Dump {
    let mut index: HashMap<usize, usize> = HashMap::new();
    let mut mats_order: Vec<usize> = Vec::new();
    let mut nodes = Vec::new();
    let (mut vertices, mut triangles) = (0, 0);
    for (id, world) in m.subtree(ROOT) {
        let n = &m.tree.nodes[id];
        let e = &m.node_ext[id];
        let parent = n
            .parent
            .and_then(|p| index.get(&p).copied())
            .map_or(-1, |i| i64::try_from(i).expect("i64"));
        let ud = e.user_data.map(|d| {
            (
                d.mats.map_or(-1, |v| i64::try_from(v).expect("i64")),
                d.per_token_geos
                    .map_or(-1, |v| i64::try_from(v).expect("i64")),
                d.deposit_display_scale.unwrap_or(0.0),
            )
        });
        let mut nd = NodeDump {
            mesh: n.mesh.is_some(),
            parent,
            p: [n.position.x, n.position.y, n.position.z],
            q: [
                n.quaternion.x,
                n.quaternion.y,
                n.quaternion.z,
                n.quaternion.w,
            ],
            s: [n.scale.x, n.scale.y, n.scale.z],
            cs: e.cast_shadow,
            rs: e.receive_shadow,
            w: world.e,
            ud,
            geo: None,
            mat: 0,
            nv: 0,
            ni: -1,
            hash: 0,
        };
        index.insert(id, nodes.len());
        if let Some(md) = n.mesh {
            let g = m.geometry(id).expect("geometry");
            let mi = match mats_order.iter().position(|&x| x == md.material) {
                Some(i) => i,
                None => {
                    mats_order.push(md.material);
                    mats_order.len() - 1
                }
            };
            nd.geo = Some(geo_dump(m, id));
            nd.mat = mi;
            nd.nv = g.vertex_count();
            nd.ni = g
                .indices
                .as_ref()
                .map_or(-1, |i| i64::try_from(i.len()).expect("i64"));
            nd.hash = geo_hash(&g);
            vertices += nd.nv;
            triangles += g.triangle_count();
        }
        nodes.push(nd);
    }
    let mats: Vec<MatDump> = mats_order
        .iter()
        .map(|&mi| {
            let mt = &m.tree.materials[mi];
            let ext = &m.mat_ext[mi];
            let standard = ext.kind == MatKind::Standard;
            MatDump {
                standard,
                hex: mt.color,
                lin: hex_to_linear(mt.color),
                flat: mt.flat_shading,
                metal: if standard { mt.metalness } else { 0.0 },
                rough: if standard { mt.roughness } else { 0.0 },
                em: ext.emissive,
            }
        })
        .collect();
    let bb = m.box_precise();
    let bbox = if bb.is_empty() {
        None
    } else {
        Some([bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z])
    };
    let mut f = Fnv::new();
    for n in &nodes {
        f.u32(u32::from(n.mesh));
        f.u32(u32::try_from(n.parent + 1).expect("u32"));
        for v in n.p.iter().chain(&n.q).chain(&n.s) {
            f.f64(*v);
        }
        f.u32(u32::from(n.cs));
        f.u32(u32::from(n.rs));
        for v in &n.w {
            f.f64(*v);
        }
        match n.ud {
            Some((a, b, c)) => {
                f.u32(1);
                f.u32(u32::try_from(a + 1).expect("u32"));
                f.u32(u32::try_from(b + 1).expect("u32"));
                f.f64(c);
            }
            None => f.u32(0),
        }
        if n.mesh {
            f.u32(n.hash);
            f.u32(u(n.nv));
            f.u32(u32::try_from(n.ni + 1).expect("u32"));
            f.u32(u(n.mat));
        }
    }
    f.u32(u(mats.len()));
    for mt in &mats {
        f.u32(u32::from(mt.standard));
        for v in &mt.lin {
            f.f64(*v);
        }
        f.u32(u32::from(mt.flat));
        f.f64(mt.metal);
        f.f64(mt.rough);
        for v in &mt.em {
            f.f64(*v);
        }
    }
    let meshes = nodes.iter().filter(|n| n.mesh).count();
    Dump {
        nodes,
        mats,
        meshes,
        vertices,
        triangles,
        bbox,
        sig: f.0,
    }
}

// ---------------------------------------------------------------------------
// Bit comparison with a report.

#[derive(Default)]
struct Cmp {
    scalars: usize,
    bit_diff: usize,
    within: usize,
    struct_diff: usize,
    report: Vec<String>,
}

impl Cmp {
    fn f(&mut self, ctx: &str, got: f64, want: f64) {
        self.scalars += 1;
        if got.to_bits() != want.to_bits() {
            self.bit_diff += 1;
            if (got - want).abs() <= 1e-12 {
                self.within += 1;
            }
            if self.report.len() < 40 {
                self.report
                    .push(format!("{ctx}: got {got:e} want {want:e}"));
            }
        }
    }
    fn fs(&mut self, ctx: &str, got: &[f64], want: &Json) {
        let w = want.f64s();
        if w.len() != got.len() {
            self.st(ctx, &format!("len {} vs {}", got.len(), w.len()));
            return;
        }
        for (i, (&g, &x)) in got.iter().zip(&w).enumerate() {
            self.f(&format!("{ctx}[{i}]"), g, x);
        }
    }
    fn st(&mut self, ctx: &str, msg: &str) {
        self.struct_diff += 1;
        if self.report.len() < 40 {
            self.report.push(format!("{ctx}: {msg}"));
        }
    }
    fn eq<T: PartialEq + std::fmt::Debug>(&mut self, ctx: &str, got: T, want: T) {
        if got != want {
            self.st(ctx, &format!("got {got:?} want {want:?}"));
        }
    }
    fn ok(&self) -> bool {
        self.bit_diff == 0 && self.struct_diff == 0
    }
    fn finish(&self, what: &str) {
        println!(
            "{what}: scalars={} bit_diff={} within_1e-12={} struct_diff={}",
            self.scalars, self.bit_diff, self.within, self.struct_diff
        );
        for r in &self.report {
            println!("  {r}");
        }
    }
}

fn jnum_u32(j: &Json) -> u32 {
    let n = j.num();
    assert!(n.fract() == 0.0 && (0.0..=f64::from(u32::MAX)).contains(&n));
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let v = n as u32;
    v
}

fn jnum_i64(j: &Json) -> i64 {
    let n = j.num();
    assert!(n.fract() == 0.0);
    #[allow(clippy::cast_possible_truncation)]
    let v = n as i64;
    v
}

fn compare_full(c: &mut Cmp, name: &str, d: &Dump, w: &Json) {
    let wn = w.get("nodes").arr();
    if wn.len() != d.nodes.len() {
        c.st(
            name,
            &format!("node count {} vs {}", d.nodes.len(), wn.len()),
        );
        return;
    }
    for (i, (n, x)) in d.nodes.iter().zip(wn).enumerate() {
        let cx = format!("{name}#{i}");
        c.eq(
            &format!("{cx}.t"),
            if n.mesh { "M" } else { "G" },
            x.get("t").str(),
        );
        c.eq(&format!("{cx}.parent"), n.parent, jnum_i64(x.get("parent")));
        c.fs(&format!("{cx}.p"), &n.p, x.get("p"));
        c.fs(&format!("{cx}.q"), &n.q, x.get("q"));
        c.fs(&format!("{cx}.s"), &n.s, x.get("s"));
        c.eq(&format!("{cx}.cs"), n.cs, x.get("cs").bool());
        c.eq(&format!("{cx}.rs"), n.rs, x.get("rs").bool());
        c.fs(&format!("{cx}.w"), &n.w, x.get("w"));
        match (n.ud, x.opt("ud")) {
            (None, None) => {}
            (Some((a, b, s)), Some(u)) => {
                c.eq(&format!("{cx}.ud.mats"), a, jnum_i64(u.get("mats")));
                c.eq(&format!("{cx}.ud.geos"), b, jnum_i64(u.get("geos")));
                c.f(&format!("{cx}.ud.dds"), s, u.get("dds").num());
            }
            (a, b) => c.st(&format!("{cx}.ud"), &format!("{a:?} vs {b:?}")),
        }
        if let Some(g) = &n.geo {
            let wg = x.get("geo");
            c.eq(&format!("{cx}.geo.type"), g.ty, wg.get("type").str());
            for (k, v) in &g.params {
                c.f(&format!("{cx}.geo.{k}"), *v, wg.get(k).num());
            }
            if g.ty == "cyl" {
                c.eq(&format!("{cx}.geo.open"), g.open, wg.get("open").bool());
            }
            c.eq(
                &format!("{cx}.mat"),
                n.mat,
                usize::try_from(jnum_i64(x.get("mat"))).expect("usize"),
            );
            c.eq(
                &format!("{cx}.nv"),
                n.nv,
                usize::try_from(jnum_i64(x.get("nv"))).expect("usize"),
            );
            c.eq(&format!("{cx}.ni"), n.ni, jnum_i64(x.get("ni")));
            c.eq(&format!("{cx}.hash"), n.hash, jnum_u32(x.get("hash")));
        }
    }
    let wm = w.get("materials").arr();
    if wm.len() != d.mats.len() {
        c.st(
            name,
            &format!("material count {} vs {}", d.mats.len(), wm.len()),
        );
    } else {
        for (i, (mt, x)) in d.mats.iter().zip(wm).enumerate() {
            let cx = format!("{name}.mat{i}");
            c.eq(
                &format!("{cx}.type"),
                if mt.standard { "S" } else { "L" },
                x.get("type").str(),
            );
            c.eq(&format!("{cx}.hex"), mt.hex, jnum_u32(x.get("hex")));
            c.fs(&format!("{cx}.lin"), &mt.lin, x.get("lin"));
            c.eq(&format!("{cx}.flat"), mt.flat, x.get("flat").bool());
            if mt.standard {
                c.f(&format!("{cx}.metal"), mt.metal, x.get("metal").num());
                c.f(&format!("{cx}.rough"), mt.rough, x.get("rough").num());
            }
            c.fs(&format!("{cx}.em"), &mt.em, x.get("em"));
        }
    }
    compare_totals(c, name, d, w);
    c.eq(&format!("{name}.sig"), d.sig, jnum_u32(w.get("sig")));
}

fn compare_totals(c: &mut Cmp, name: &str, d: &Dump, w: &Json) {
    c.eq(
        &format!("{name}.meshes"),
        d.meshes,
        usize::try_from(jnum_i64(w.get("meshes"))).expect("usize"),
    );
    c.eq(
        &format!("{name}.vertices"),
        d.vertices,
        usize::try_from(jnum_i64(w.get("vertices"))).expect("usize"),
    );
    c.eq(
        &format!("{name}.triangles"),
        d.triangles,
        usize::try_from(jnum_i64(w.get("triangles"))).expect("usize"),
    );
    match (&d.bbox, w.get("bbox")) {
        (None, Json::Null) => {}
        (Some(b), j @ Json::Arr(_)) => c.fs(&format!("{name}.bbox"), b, j),
        (a, b) => c.st(&format!("{name}.bbox"), &format!("{a:?} vs {b:?}")),
    }
}

// ---------------------------------------------------------------------------
// Case table: the same calls as gen.ts, by name.

type Builder = Box<dyn Fn() -> Option<ImprovementModel>>;

fn some(m: ImprovementModel) -> Option<ImprovementModel> {
    Some(m)
}

const KEYS: [&str; 24] = [
    "droga",
    "droga_brukowana",
    "farma",
    "bydlo",
    "owce",
    "lama",
    "stadnina",
    "kopalnia_zelaza",
    "kamieniolom",
    "oboz_lowiecki",
    "wyrab",
    "tartak",
    "irygacja",
    "pole_irygowane",
    "glinianka",
    "tarasy",
    "lodzie_rybackie",
    "warzelnia_soli",
    "fort",
    "posterunek",
    "pastwisko",
    "kopalnia_miedzi",
    "kopalnia_zlota",
    "kopalnia_cyny",
];

#[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
fn owner_from_js(v: i64) -> u32 {
    // only the low 24 bits are used (`ownerCol & 0xffffff` = ToInt32 & mask)
    v as u32
}

fn f1(x: f64, z: f64) -> f64 {
    0.2 + 0.1 * x - 0.05 * z + 0.02 * x * z
}
fn f2(x: f64, _z: f64) -> f64 {
    -0.1 + x * 0.01
}
fn f3(_x: f64, _z: f64) -> f64 {
    f64::NAN
}

struct SectCase {
    name: String,
    keys: Vec<&'static str>,
    owner: Option<u32>,
    hex_r: Option<f64>,
    sector_r: Option<f64>,
    surface: Option<fn(f64, f64) -> f64>,
    mask: Option<u32>,
}

fn sect_cases() -> Vec<SectCase> {
    let c = |name: &str, keys: &[&'static str]| SectCase {
        name: name.to_owned(),
        keys: keys.to_vec(),
        owner: None,
        hex_r: None,
        sector_r: None,
        surface: None,
        mask: None,
    };
    let mut v: Vec<SectCase> = KEYS.iter().map(|k| c(k, &[k])).collect();
    v.push(c("droga-only", &["droga"]));
    v.push(c("bruk+droga", &["droga_brukowana", "droga"]));
    v.push(SectCase {
        mask: Some(0b000_101),
        ..c("mix-mask5", &["droga", "farma", "kopalnia_zelaza", "fort"])
    });
    v.push(SectCase {
        mask: Some(0),
        ..c("mix-mask0", &["droga_brukowana", "kamieniolom"])
    });
    v.push(c("farm-overlays", &["farma", "irygacja", "tarasy"]));
    v.push(c("kam+kop", &["kamieniolom", "kopalnia_miedzi"]));
    v.push(c("animals", &["bydlo", "owce", "lama", "pastwisko"]));
    v.push(c("forts", &["fort", "posterunek"]));
    v.push(c("forest", &["tartak", "wyrab", "oboz_lowiecki"]));
    v.push(c("brak", &["brak", "", "farma"]));
    v.push(c("unknown", &["nieznane"]));
    v.push(c("dup", &["farma", "farma"]));
    v.push(c("empty", &[]));
    v.push(c("all", &KEYS));
    v.push(SectCase {
        hex_r: Some(1.3),
        ..c("hexR1.3", &["farma", "kopalnia_zlota", "droga"])
    });
    v.push(SectCase {
        sector_r: Some(SECTOR_R_ELEVATED),
        surface: Some(f1),
        ..c("elev-f1", &["kopalnia_cyny", "kamieniolom", "bydlo"])
    });
    v.push(SectCase {
        surface: Some(f2),
        ..c("f2", &["kopalnia_zelaza", "stadnina", "lodzie_rybackie"])
    });
    v.push(SectCase {
        surface: Some(f3),
        ..c("f3", &["glinianka", "warzelnia_soli"])
    });
    v.push(SectCase {
        sector_r: Some(0.5),
        ..c("sectorR0.5", &["fort", "farma"])
    });
    v.push(SectCase {
        owner: Some(0x008e_24aa),
        ..c("owner", &["fort", "posterunek", "owce"])
    });
    v
}

fn run_sect(s: &SectCase) -> ImprovementModel {
    let surf = s.surface;
    let dynf;
    let relief = SectorRelief {
        sector_r: s.sector_r,
        surface_y: match surf {
            Some(f) => {
                dynf = f;
                Some(&dynf as &dyn Fn(f64, f64) -> f64)
            }
            None => None,
        },
    };
    build_improvement_sectored(
        &s.keys,
        s.owner.unwrap_or(DEFAULT_OWNER_COL),
        s.hex_r.unwrap_or(1.0),
        &relief,
        s.mask.unwrap_or(ROAD_MASK_FULL),
    )
}

fn poza_krowy(s: &str) -> PozaKrowy {
    if s == "pasaca" {
        PozaKrowy::Pasaca
    } else {
        PozaKrowy::Stojaca
    }
}
fn wariant_krowy(s: &str) -> WariantKrowy {
    if s == "brazowa" {
        WariantKrowy::Brazowa
    } else {
        WariantKrowy::Lacata
    }
}
fn poza_owcy(s: &str) -> PozaOwcy {
    if s == "skubiaca" {
        PozaOwcy::Skubiaca
    } else {
        PozaOwcy::Stojaca
    }
}
fn wariant_owcy(s: &str) -> WariantOwcy {
    if s == "czarna" {
        WariantOwcy::Czarna
    } else {
        WariantOwcy::Biala
    }
}
fn poza_swini(s: &str) -> PozaSwini {
    if s == "ryjaca" {
        PozaSwini::Ryjaca
    } else {
        PozaSwini::Stojaca
    }
}
fn wariant_swini(s: &str) -> WariantSwini {
    if s == "laciata" {
        WariantSwini::Laciata
    } else {
        WariantSwini::Rozowa
    }
}

fn group_with(f: impl FnOnce(&mut ImprovementModel)) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    f(&mut m);
    m
}

const FOOD: [&str; 4] = ["farma", "irygacja", "bydlo", "owce"];

fn cases() -> Vec<(String, Builder)> {
    let mut v: Vec<(String, Builder)> = Vec::new();
    let mut add = |name: String, b: Builder| v.push((name, b));
    // 1) buildImprovement
    for k in KEYS {
        add(
            format!("imp:{k}"),
            Box::new(move || some(build_improvement(k, DEFAULT_OWNER_COL))),
        );
    }
    for k in ["fort", "posterunek"] {
        for o in [0x008e_24aa_i64, 0x1234_abcd, 0, -1] {
            add(
                format!("imp:{k}:{o}"),
                Box::new(move || some(build_improvement(k, owner_from_js(o)))),
            );
        }
    }
    for k in ["nieznane", "brak", "", "toString"] {
        add(
            format!("imp:{k}"),
            Box::new(move || some(build_improvement(k, DEFAULT_OWNER_COL))),
        );
    }
    add(
        "rbx:farma".into(),
        Box::new(|| some(build_improvement("farma", DEFAULT_OWNER_COL))),
    );
    // 2) building blocks
    add(
        "p2:farma:default".into(),
        Box::new(|| some(p2::build_farma(WariantFarmy::default()))),
    );
    add(
        "p2:farma:solo".into(),
        Box::new(|| some(p2::build_farma(WariantFarmy::Solo))),
    );
    add(
        "p2:farma:pastwisko".into(),
        Box::new(|| some(p2::build_farma(WariantFarmy::Pastwisko))),
    );
    add(
        "p2:kopalnia".into(),
        Box::new(|| some(p2::build_kopalnia())),
    );
    add(
        "p2:kamieniolom".into(),
        Box::new(|| some(p2::build_kamieniolom())),
    );
    add("p2:tartak".into(), Box::new(|| some(p2::build_tartak())));
    add(
        "p2:zagroda:1".into(),
        Box::new(|| some(p2::build_zagroda_dodatki(1.0))),
    );
    add(
        "p2:zagroda:0.8".into(),
        Box::new(|| some(p2::build_zagroda_dodatki(0.8))),
    );
    add("p3a:wyrab".into(), Box::new(|| some(p3a::build_wyrab())));
    add(
        "p3a:oboz".into(),
        Box::new(|| some(p3a::build_oboz_lowiecki())),
    );
    add(
        "p3a:glinianka".into(),
        Box::new(|| some(p3a::build_glinianka())),
    );
    add(
        "p3a:warzelnia".into(),
        Box::new(|| some(p3a::build_warzelnia_soli())),
    );
    add(
        "p3a:lodzie".into(),
        Box::new(|| some(p3a::build_lodzie_rybackie())),
    );
    add(
        "p3a:stadnina:undefined".into(),
        Box::new(|| some(p3a::build_stadnina(2))),
    );
    for n in 0..4 {
        add(
            format!("p3a:stadnina:{n}"),
            Box::new(move || some(p3a::build_stadnina(n))),
        );
    }
    add(
        "p3b:irygacja".into(),
        Box::new(|| some(p3b::build_irygacja())),
    );
    add(
        "p3b:pole".into(),
        Box::new(|| some(p3b::build_pole_irygowane())),
    );
    add(
        "p3b:fort:default".into(),
        Box::new(|| some(p3b::build_fort(DEFAULT_OWNER_COL))),
    );
    add(
        "p3b:fort:green".into(),
        Box::new(|| some(p3b::build_fort(0x00_ff00))),
    );
    add(
        "p3b:posterunek:default".into(),
        Box::new(|| some(p3b::build_posterunek(DEFAULT_OWNER_COL))),
    );
    add(
        "p3b:posterunek:big".into(),
        Box::new(|| some(p3b::build_posterunek(0x7fab_cdef))),
    );
    for t in [
        "miedz", "zelazo", "wegiel", "sol", "glina", "zloto", "cyna", "inne",
    ] {
        for du in [0.0, 0.9, 0.5] {
            add(
                format!("p3b:klaster:{t}:{du}"),
                Box::new(move || some(p3b::build_zloze_klaster(ZlozeTyp::from_web(t), du))),
            );
        }
    }
    add(
        "p3b:klaster:miedz:default".into(),
        Box::new(|| some(p3b::build_zloze_klaster(ZlozeTyp::Miedz, 0.0))),
    );
    for t in ["miedz", "zelazo", "wegiel", "sol", "zloto", "cyna", "glina"] {
        add(
            format!("p3b:zloze:{t}"),
            Box::new(move || some(p3b::build_zloze(ZlozeTyp::from_web(t)))),
        );
    }
    add(
        "kop:zlota".into(),
        Box::new(|| some(build_kopalnia_zlota())),
    );
    add("kop:cyny".into(), Box::new(|| some(build_kopalnia_cyny())));
    add(
        "kop:zlota:2".into(),
        Box::new(|| some(build_kopalnia_zlota())),
    );
    add(
        "kop:cyny:2".into(),
        Box::new(|| some(build_kopalnia_cyny())),
    );
    for poza in ["undefined", "stojaca", "pasaca"] {
        for war in ["undefined", "lacata", "brazowa"] {
            add(
                format!("past:krowa:{poza}:{war}"),
                Box::new(move || some(zw::build_krowa(poza_krowy(poza), wariant_krowy(war)))),
            );
        }
    }
    for poza in ["undefined", "stojaca", "skubiaca"] {
        for war in ["undefined", "biala", "czarna"] {
            add(
                format!("past:owca:{poza}:{war}"),
                Box::new(move || some(zw::build_owca(poza_owcy(poza), wariant_owcy(war)))),
            );
        }
    }
    add(
        "past:krowa:noopts".into(),
        Box::new(|| {
            some(zw::build_krowa(
                PozaKrowy::default(),
                WariantKrowy::default(),
            ))
        }),
    );
    add(
        "past:owca:noopts".into(),
        Box::new(|| some(zw::build_owca(PozaOwcy::default(), WariantOwcy::default()))),
    );
    add("past:lama".into(), Box::new(|| some(zw::build_lama())));
    add(
        "past:zwierzeta:1".into(),
        Box::new(|| some(zw::build_pastwisko_zwierzeta(1.0))),
    );
    add(
        "past:zwierzeta:1.3".into(),
        Box::new(|| some(zw::build_pastwisko_zwierzeta(1.3))),
    );
    add(
        "past:zlozeKrowy".into(),
        Box::new(|| some(zw::build_zloze_krowy(1.0))),
    );
    add(
        "past:zlozeKrowy:0.7".into(),
        Box::new(|| some(zw::build_zloze_krowy(0.7))),
    );
    add(
        "past:zlozeOwce".into(),
        Box::new(|| some(zw::build_zloze_owce(1.0))),
    );
    add(
        "past:zlozeOwce:0.9".into(),
        Box::new(|| some(zw::build_zloze_owce(0.9))),
    );
    for poza in ["undefined", "stojaca", "ryjaca"] {
        for war in ["undefined", "rozowa", "laciata"] {
            add(
                format!("swin:swinia:{poza}:{war}"),
                Box::new(move || some(zw::build_swinia(poza_swini(poza), wariant_swini(war)))),
            );
        }
    }
    add(
        "swin:swinia:noopts".into(),
        Box::new(|| {
            some(zw::build_swinia(
                PozaSwini::default(),
                WariantSwini::default(),
            ))
        }),
    );
    add(
        "swin:trzoda:noopts".into(),
        Box::new(|| some(zw::build_trzoda(JakoscTrzody::default(), 1.0))),
    );
    add(
        "swin:trzoda:niska".into(),
        Box::new(|| some(zw::build_trzoda(JakoscTrzody::Niska, 1.0))),
    );
    add(
        "swin:trzoda:normalna".into(),
        Box::new(|| some(zw::build_trzoda(JakoscTrzody::Normalna, 1.0))),
    );
    add(
        "swin:trzoda:wysoka".into(),
        Box::new(|| some(zw::build_trzoda(JakoscTrzody::Wysoka, 1.0))),
    );
    add(
        "swin:trzoda:hexR0.75".into(),
        Box::new(|| some(zw::build_trzoda(JakoscTrzody::Wysoka, 0.75))),
    );
    add(
        "taras:0.88".into(),
        Box::new(|| some(build_style_tarasy_terrace(false, 0.88))),
    );
    add(
        "taras:lite:1".into(),
        Box::new(|| some(build_style_tarasy_terrace(true, 1.0))),
    );
    add(
        "taras:1".into(),
        Box::new(|| some(build_style_tarasy_terrace(false, 1.0))),
    );
    add("styled:cow".into(), Box::new(|| some(build_styled_cow())));
    add(
        "styled:sheep".into(),
        Box::new(|| some(build_styled_sheep())),
    );
    add(
        "styled:pair:cow".into(),
        Box::new(|| {
            some(group_with(|m| {
                place_livestock_pair(m, ROOT, Livestock::Cow, 0.1, -0.2)
            }))
        }),
    );
    add(
        "styled:pair:sheep".into(),
        Box::new(|| {
            some(group_with(|m| {
                place_livestock_pair(m, ROOT, Livestock::Sheep, -0.3, 0.05)
            }))
        }),
    );
    add(
        "styled:fig:cow:2".into(),
        Box::new(|| {
            some(group_with(|m| {
                place_livestock_figure(m, ROOT, Livestock::Cow, 0.2, 0.3, 1.1, 2.0)
            }))
        }),
    );
    add(
        "styled:fig:sheep".into(),
        Box::new(|| {
            some(group_with(|m| {
                place_livestock_figure(
                    m,
                    ROOT,
                    Livestock::Sheep,
                    0.0,
                    0.0,
                    -0.4,
                    LIVESTOCK_FIGURE_SCALE,
                );
            }))
        }),
    );
    let zloza: [Option<&'static str>; 13] = [
        None,
        Some("miedz"),
        Some("zelazo"),
        Some("wegiel"),
        Some("sol"),
        Some("zloto"),
        Some("cyna"),
        Some("glina"),
        Some("konie"),
        Some("owce"),
        Some("bydlo"),
        Some("xyz"),
        Some(""),
    ];
    for n in Nakladka::ALL {
        for z in zloza {
            let from_nak = !matches!(n, Nakladka::Brak | Nakladka::Las);
            if from_nak && z.is_some() && z != Some("miedz") {
                continue;
            }
            add(
                format!("res:{}:{}", n.as_str(), z.unwrap_or("undefined")),
                Box::new(move || build_styled_resource_overlay(n, z)),
            );
        }
    }
    // 3) roads
    for (typ, tn) in [
        (RoadTyp::Droga, "droga"),
        (RoadTyp::DrogaBrukowana, "droga_brukowana"),
    ] {
        for mask in 0..64 {
            add(
                format!("road:{tn}:{mask}:1"),
                Box::new(move || some(build_droga_gwiazda(typ, mask, 1.0))),
            );
        }
        for mask in [0, 1, 7, 63, 64 + 5] {
            add(
                format!("road:{tn}:{mask}:0.8"),
                Box::new(move || some(build_droga_gwiazda(typ, mask, 0.8))),
            );
        }
        for mask in [0, 5, 63] {
            add(
                format!("road:{tn}:{mask}"),
                Box::new(move || some(build_droga_gwiazda(typ, mask, 1.0))),
            );
        }
    }
    // 4) sectored
    for s in sect_cases() {
        let name = format!("sect:{}", s.name);
        add(name, Box::new(move || some(run_sect(&s))));
    }
    for s in sect_cases() {
        if s.name == "mix-mask5" || s.name == "elev-f1" {
            let name = format!("sect-full:{}", s.name);
            add(name, Box::new(move || some(run_sect(&s))));
        }
    }
    // 5) stacks
    for bits in 0..16_u32 {
        let ks: Vec<&'static str> = FOOD
            .iter()
            .enumerate()
            .filter(|(i, _)| bits & (1 << i) != 0)
            .map(|(_, k)| *k)
            .collect();
        let label = if ks.is_empty() {
            "-".to_owned()
        } else {
            ks.join("+")
        };
        let k1 = ks.clone();
        add(
            format!("food:{label}"),
            Box::new(move || build_roblox_food_stack(&k1)),
        );
        let k2 = ks.clone();
        add(
            format!("stack:{label}"),
            Box::new(move || some(build_improvement_stack(&k2, DEFAULT_OWNER_COL))),
        );
        let mut k3 = ks.clone();
        k3.push("fort");
        add(
            format!("stack:{label}+fort"),
            Box::new(move || some(build_improvement_stack(&k3, 0x008e_24aa))),
        );
    }
    add(
        "food:brak+fort".into(),
        Box::new(|| build_roblox_food_stack(&["brak", "fort"])),
    );
    add(
        "food:owce+bydlo+brak".into(),
        Box::new(|| build_roblox_food_stack(&["owce", "", "bydlo", "brak"])),
    );
    let st = |keys: &'static [&'static str]| -> Builder {
        Box::new(move || some(build_improvement_stack(keys, DEFAULT_OWNER_COL)))
    };
    add(
        "stack:farma+irygacja+kamieniolom".into(),
        st(&["farma", "irygacja", "kamieniolom"]),
    );
    add("stack:tartak+fort".into(), st(&["tartak", "fort"]));
    add(
        "stack:pole+pastwisko".into(),
        st(&["pole_irygowane", "pastwisko"]),
    );
    add("stack:brak".into(), st(&["brak", ""]));
    add(
        "stack:farma+farma+owce".into(),
        st(&["farma", "farma", "owce", "droga"]),
    );
    add(
        "stack-full:farma+bydlo+owce+fort".into(),
        st(&["farma", "bydlo", "owce", "fort"]),
    );
    v
}

// ---------------------------------------------------------------------------

#[test]
fn models_are_bit_identical_to_web() {
    let table: HashMap<String, Builder> = cases().into_iter().collect();
    let mut c = Cmp::default();
    let mut seen = 0;
    for file in ["models.json", "sigs.json"] {
        let j = load(file);
        for e in j.get("models").arr() {
            let name = e.get("name").str();
            let b = table
                .get(name)
                .unwrap_or_else(|| panic!("no Rust case for fixture {name}"));
            seen += 1;
            let got = b();
            match (got, e.get("model")) {
                (None, Json::Null) => {}
                (Some(m), w @ Json::Obj(_)) => {
                    let d = dump(&m);
                    if file == "models.json" {
                        compare_full(&mut c, name, &d, w);
                    } else {
                        c.eq(
                            &format!("{name}.nodes"),
                            d.nodes.len(),
                            usize::try_from(jnum_i64(w.get("nodes"))).expect("usize"),
                        );
                        compare_totals(&mut c, name, &d, w);
                        c.eq(&format!("{name}.sig"), d.sig, jnum_u32(w.get("sig")));
                    }
                }
                (a, b) => c.st(
                    name,
                    &format!("null mismatch: rust some={} web={b:?}", a.is_some()),
                ),
            }
        }
    }
    assert_eq!(seen, table.len(), "every Rust case has a fixture entry");
    c.finish(&format!("models: cases={seen}"));
    assert!(c.ok(), "MOD-11 models differ from the web");
}

#[test]
fn data_tables_match_web() {
    let j = load("data.json");
    let imps = j.get("improvements").arr();
    assert_eq!(imps.len(), IMPROVEMENTS.len());
    for (w, r) in imps.iter().zip(IMPROVEMENTS.iter()) {
        assert_eq!(w.get("key").str(), r.key.as_str());
        assert_eq!(w.get("label").str(), r.label);
        assert_eq!(jnum_u32(w.get("epoka")), r.epoka);
    }
    let keys: Vec<&str> = j.get("keys").arr().iter().map(Json::str).collect();
    assert_eq!(keys, KEYS.to_vec());
    for k in KEYS {
        assert_eq!(
            ImprovementKey::from_web(k).map(ImprovementKey::as_str),
            Some(k)
        );
    }
    assert_eq!(ImprovementKey::ALL.len(), 24);
    let mut c = Cmp::default();
    c.f(
        "sectorRElevated",
        SECTOR_R_ELEVATED,
        j.get("sectorRElevated").num(),
    );
    c.f("pastwiskoS", pastwisko_s(), j.get("pastwiskoS").num());
    c.f(
        "livestockScale",
        LIVESTOCK_FIGURE_SCALE,
        j.get("livestockScale").num(),
    );
    let ps = j.get("pastwiskoSloty");
    for (k, s) in ["krowaA", "krowaB", "lama", "owcaA", "owcaB"]
        .iter()
        .zip(pastwisko_sloty())
    {
        let w = ps.get(k);
        c.f(&format!("{k}.x"), s.0, w.get("x").num());
        c.f(&format!("{k}.z"), s.1, w.get("z").num());
        c.f(&format!("{k}.rotY"), s.2, w.get("rotY").num());
    }
    let ts = j.get("trzodaSloty");
    for (k, s) in ["krowa", "swinia"].iter().zip(trzoda_sloty()) {
        let w = ts.get(k);
        c.f(&format!("{k}.x"), s.0, w.get("x").num());
        c.f(&format!("{k}.z"), s.1, w.get("z").num());
        c.f(&format!("{k}.rotY"), s.2, w.get("rotY").num());
    }
    let road = j.get("road");
    c.f("armWidth", ROAD_ARM_WIDTH_RATIO, road.get("armWidth").num());
    c.f(
        "nodeRadius",
        ROAD_NODE_RADIUS_RATIO,
        road.get("nodeRadius").num(),
    );
    c.f(
        "armLength",
        road_arm_length(1.0),
        road.get("armLength").num(),
    );
    c.f(
        "armLength08",
        road_arm_length(0.8),
        road.get("armLength08").num(),
    );
    let rot: Vec<f64> = (0..7).map(road_port_rotation_y).collect();
    c.fs("portRotY", &rot, road.get("portRotY"));
    for (mask, w) in road.get("masks").arr().iter().enumerate() {
        let mask = u32::try_from(mask).expect("u32");
        let arms: Vec<usize> = w
            .get("arms")
            .arr()
            .iter()
            .map(|a| usize::try_from(jnum_i64(a)).expect("usize"))
            .collect();
        c.eq(&format!("mask{mask}.arms"), road_mask_arms(mask), arms);
        c.eq(
            &format!("mask{mask}.node"),
            road_mask_has_node(mask),
            w.get("node").bool(),
        );
        c.eq(
            &format!("mask{mask}.lone"),
            road_mask_is_lone_patch(mask),
            w.get("lone").bool(),
        );
    }
    c.finish("data");
    assert!(c.ok());
}
