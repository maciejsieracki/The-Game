//! MOD-01 `core` tests (R-RUSTPORT-P4-12-MOD01-CORE-Q1): `civ_renderer::core`
//! against vectors produced by **running the web modules** of `edb8fb56`
//! (`hexutil`, `hexShape`, `fogDim`, `zoomLod`, `mergeDecor`,
//! `unitVitalsPalette`, `mapRenderStyle`, `bronzeCity`) with three@0.169.0,
//! see `tests/fixtures/core/README.md` and
//! `dyspozycje/rust-port/p4/P4-12-MOD01-CORE.md`.
//!
//! Every number is compared **bit for bit** (`f64::to_bits`, `f32::to_bits`;
//! two NaNs count as equal); booleans, integers, strings and structure
//! exactly. The only accepted difference is the documented JS quirk of
//! `ikonaIdToBronzeCiv` on `Object.prototype` names (asserted explicitly).

#![allow(clippy::float_cmp)]

use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::Arc;

use civ_renderer::core::bronze::{ikona_id_to_bronze_civ, rnd, BronzeCiv, BRONZE_CIVS};
use civ_renderer::core::fog_dim::{apply_fog_dim, fog_brightness_for_hex, FOG_EXPLORED_BRIGHTNESS};
use civ_renderer::core::hex_shape::{append_pointy_top_hex, hex_ring_points_xz};
use civ_renderer::core::hexutil::{axial_to_world_f, map_center, sqrt3, world_to_axial, HEX_R};
use civ_renderer::core::map_style as ms;
use civ_renderer::core::merge_decor::{
    collapse_to_merged_mesh, count_meshes_in_group, dispose_merged_decor, is_already_merged_decor,
    MERGED_DECOR_FLAG,
};
// P4.27: one scene type (`civ_renderer::scene::Scene`, arena) — forced type adjustment.
use civ_renderer::core::scene::{Geometry, Material, MaterialKind, NodeKind, Scene, ROOT};
use civ_renderer::core::vitals as vit;
use civ_renderer::core::zoom_lod as zl;
use civ_renderer::geom::{
    box_geometry, cone_geometry, cylinder_geometry, icosahedron_geometry, plane_geometry,
    sphere_geometry, Euler, EulerOrder, Mesh, Path2, Shape, Vec3,
};
use civ_renderer::pick::terrain::Terrain;
use civ_renderer::scene::{MatId, NodeId, UserValue};

// ---------------------------------------------------------------------------
// Minimal JSON reader (the crate has no dependencies; fixtures are trusted
// files produced by the reference script). Strings are UTF-8 (Polish audit
// messages), numbers are `f64` (`str::parse` is correctly rounded), and the
// generator writes `-0`, `NaN`, `±Infinity` as strings.

#[derive(Debug, Clone)]
enum Json {
    Null,
    Bool(bool),
    Num(f64),
    Str(String),
    Arr(Vec<Json>),
    Obj(Vec<(String, Json)>),
}

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
            Json::Str(s) => match s.as_str() {
                "NaN" => f64::NAN,
                "Infinity" => f64::INFINITY,
                "-Infinity" => f64::NEG_INFINITY,
                "-0" => -0.0,
                other => panic!("not a number: {other}"),
            },
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
    fn i64(&self) -> i64 {
        let n = self.num();
        assert!(n.fract() == 0.0 && n.abs() < 9.0e15, "not an integer: {n}");
        #[allow(clippy::cast_possible_truncation)]
        let v = n as i64;
        v
    }
    fn i32(&self) -> i32 {
        i32::try_from(self.i64()).expect("i32")
    }
    fn u32(&self) -> u32 {
        u32::try_from(self.i64()).expect("u32")
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
                    match e {
                        b'n' => out.push(b'\n'),
                        b't' => out.push(b'\t'),
                        b'"' => out.push(b'"'),
                        b'\\' => out.push(b'\\'),
                        b'/' => out.push(b'/'),
                        b'u' => {
                            let h = std::str::from_utf8(&self.s[self.i..self.i + 4]).expect("hex");
                            self.i += 4;
                            let cp = u32::from_str_radix(h, 16).expect("hex");
                            let ch = char::from_u32(cp).expect("BMP code point");
                            let mut buf = [0u8; 4];
                            out.extend_from_slice(ch.encode_utf8(&mut buf).as_bytes());
                        }
                        _ => panic!("unsupported escape"),
                    }
                }
                _ => out.push(c),
            }
        }
        String::from_utf8(out).expect("utf8 string")
    }
}

fn load(name: &str) -> Json {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/fixtures/core")
        .join(name);
    let bytes = std::fs::read(&p).unwrap_or_else(|e| panic!("read {}: {e}", p.display()));
    let mut parser = Parser { s: &bytes, i: 0 };
    parser.value()
}

// ---------------------------------------------------------------------------
// Bit comparison with a per-test counter.

#[derive(Default)]
struct Check {
    values: usize,
    fails: Vec<String>,
}

impl Check {
    fn f64(&mut self, what: &str, got: f64, want: f64) {
        self.values += 1;
        let same = got.to_bits() == want.to_bits() || (got.is_nan() && want.is_nan());
        if !same && self.fails.len() < 30 {
            self.fails.push(format!(
                "{what}: got {got:e} ({:#018x}) want {want:e} ({:#018x})",
                got.to_bits(),
                want.to_bits()
            ));
        } else if !same {
            self.fails.push(String::new());
        }
    }
    fn f32(&mut self, what: &str, got: f32, want: f64) {
        #[allow(clippy::cast_possible_truncation)]
        let w = want as f32;
        assert_eq!(
            f64::from(w).to_bits(),
            want.to_bits(),
            "{what}: fixture value is not an f32"
        );
        self.values += 1;
        if got.to_bits() != w.to_bits() {
            self.fails.push(format!("{what}: got {got:e} want {w:e}"));
        }
    }
    fn eq<T: PartialEq + std::fmt::Debug>(&mut self, what: &str, got: T, want: T) {
        self.values += 1;
        if got != want {
            self.fails
                .push(format!("{what}: got {got:?} want {want:?}"));
        }
    }
    fn finish(self, name: &str) {
        println!(
            "{name}: {} values compared bit for bit, {} mismatches",
            self.values,
            self.fails.len()
        );
        assert!(
            self.fails.is_empty(),
            "{name}: {} mismatches:\n{}",
            self.fails.len(),
            self.fails
                .iter()
                .filter(|s| !s.is_empty())
                .cloned()
                .collect::<Vec<_>>()
                .join("\n")
        );
    }
}

fn terrain(j: &Json) -> Terrain {
    Terrain::from_web_id(j.str()).expect("terrain id")
}
fn style(j: &Json) -> ms::MapRenderStyle {
    ms::MapRenderStyle::from_web_id(j.str()).expect("style id")
}
fn quality(j: &Json) -> ms::QualityTier {
    ms::quality_from_web_id(j.str()).expect("quality id")
}

// ===========================================================================

#[test]
fn hexutil_matches_web() {
    let j = load("hexutil.json");
    let mut c = Check::default();
    c.f64("HEX_R", HEX_R, j.get("HEX_R").num());
    c.f64("SQRT3", sqrt3(), j.get("SQRT3").num());
    for (i, r) in j.get("a2w").arr().iter().enumerate() {
        let a = r.arr();
        let (x, z) = axial_to_world_f(a[0].num(), a[1].num(), a[2].num());
        c.f64(&format!("a2w[{i}].x"), x, a[3].num());
        c.f64(&format!("a2w[{i}].z"), z, a[4].num());
    }
    for (i, r) in j.get("centers").arr().iter().enumerate() {
        let a = r.arr();
        let (x, z) = map_center(a[0].u32(), a[1].u32(), a[2].num());
        c.f64(&format!("center[{i}].x"), x, a[3].num());
        c.f64(&format!("center[{i}].z"), z, a[4].num());
    }
    for (i, r) in j.get("w2a").arr().iter().enumerate() {
        let a = r.arr();
        let h = world_to_axial(a[0].num(), a[1].num(), a[2].num());
        c.eq(&format!("w2a[{i}]"), (h.q, h.r), (a[3].i32(), a[4].i32()));
    }
    c.finish("hexutil");
}

#[test]
fn hex_shape_matches_web() {
    let j = load("hexshape.json");
    let mut c = Check::default();
    for (i, ring) in j.get("rings").arr().iter().enumerate() {
        let y = if ring.get("y").is_null() {
            0.0
        } else {
            ring.get("y").num()
        };
        let pts = hex_ring_points_xz(ring.get("R").num(), y);
        let want = ring.get("pts").arr();
        c.eq(&format!("ring[{i}].len"), pts.len(), want.len());
        for (k, (p, w)) in pts.iter().zip(want).enumerate() {
            let w = w.arr();
            c.f64(&format!("ring[{i}][{k}].x"), p.x, w[0].num());
            c.f64(&format!("ring[{i}][{k}].y"), p.y, w[1].num());
            c.f64(&format!("ring[{i}][{k}].z"), p.z, w[2].num());
        }
    }
    for (i, p) in j.get("paths").arr().iter().enumerate() {
        let mut path = Path2::new();
        append_pointy_top_hex(&mut path, p.get("radius").num(), p.get("reverse").bool());
        let pts = path.points();
        let want = p.get("points").arr();
        c.eq(&format!("path[{i}].len"), pts.len(), want.len());
        c.eq(
            &format!("path[{i}].curves+1"),
            pts.len(),
            usize::try_from(p.get("curves").i64()).unwrap() + 1,
        );
        for (k, (g, w)) in pts.iter().zip(want).enumerate() {
            let w = w.arr();
            c.f64(&format!("path[{i}][{k}].x"), g.0, w[0].num());
            c.f64(&format!("path[{i}][{k}].y"), g.1, w[1].num());
        }
    }
    let mut outline = Path2::new();
    append_pointy_top_hex(&mut outline, 1.0, false);
    let mut hole = Path2::new();
    append_pointy_top_hex(&mut hole, 0.8, true);
    let shape = Shape {
        outline,
        holes: vec![hole],
    };
    let (sp, hp) = shape.extract_points();
    let h = j.get("holed");
    let ws = h.get("shape").arr();
    c.eq("holed.shape.len", sp.len(), ws.len());
    for (k, (g, w)) in sp.iter().zip(ws).enumerate() {
        c.f64(&format!("holed.shape[{k}].x"), g.0, w.arr()[0].num());
        c.f64(&format!("holed.shape[{k}].y"), g.1, w.arr()[1].num());
    }
    let wh = h.get("holes").arr();
    c.eq("holed.holes.len", hp.len(), wh.len());
    for (k, (g, w)) in hp[0].iter().zip(wh[0].arr()).enumerate() {
        c.f64(&format!("holed.hole[{k}].x"), g.0, w.arr()[0].num());
        c.f64(&format!("holed.hole[{k}].y"), g.1, w.arr()[1].num());
    }
    c.finish("hexShape");
}

// ---------------------------------------------------------------------------
// Scene specs → SceneNode (same specs the generator built three objects from).

fn to_non_indexed(m: &Mesh) -> Mesh {
    let Some(idx) = &m.indices else {
        return m.clone();
    };
    let pick = |src: &[f32], size: usize| -> Vec<f32> {
        if src.is_empty() {
            return Vec::new();
        }
        idx.iter()
            .flat_map(|&i| src[i as usize * size..i as usize * size + size].to_vec())
            .collect()
    };
    Mesh {
        positions: pick(&m.positions, 3),
        normals: pick(&m.normals, 3),
        uvs: pick(&m.uvs, 2),
        indices: None,
        groups: m.groups.clone(),
    }
}

fn geometry(g: &Json) -> Geometry {
    let a: Vec<f64> = g.get("args").arr().iter().map(Json::num).collect();
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let u = |k: usize| a[k] as u32;
    let tau = std::f64::consts::PI * 2.0;
    let pi = std::f64::consts::PI;
    let mut mesh = match g.get("kind").str() {
        "box" => box_geometry(a[0], a[1], a[2], u(3), u(4), u(5)),
        "cylinder" => cylinder_geometry(a[0], a[1], a[2], u(3), u(4), a[5] != 0.0, 0.0, tau),
        "cone" => cone_geometry(a[0], a[1], u(2), u(3), false, 0.0, tau),
        "sphere" => sphere_geometry(a[0], u(1), u(2), 0.0, tau, 0.0, pi),
        "icosahedron" => icosahedron_geometry(a[0], u(1)),
        "plane" => plane_geometry(a[0], a[1], u(2), u(3)),
        "empty" => Mesh::default(),
        other => panic!("geometry {other}"),
    };
    if g.opt("nonIndexed").is_some_and(Json::bool) {
        mesh = to_non_indexed(&mesh);
    }
    let colors = g.opt("colorAttr").is_some_and(Json::bool).then(|| {
        let mut c = Vec::new();
        for i in 0..mesh.vertex_count() {
            #[allow(clippy::cast_precision_loss)]
            let f = |m: usize, d: usize, div: f64| ((i * m) % d) as f64 / div;
            #[allow(clippy::cast_possible_truncation)]
            c.extend([
                f(37, 101, 100.0) as f32,
                f(11, 53, 52.0) as f32,
                f(5, 7, 6.0) as f32,
            ]);
        }
        c
    });
    Geometry { mesh, colors }
}

fn material(m: &Json) -> Material {
    let kind = match m.get("type").str() {
        "lambert" => MaterialKind::Lambert,
        "standard" => MaterialKind::Standard,
        "basic" => MaterialKind::Basic,
        "phong" => MaterialKind::Phong,
        "physical" => MaterialKind::Physical,
        "toon" => MaterialKind::Toon,
        "normal" => MaterialKind::Normal,
        "sprite" => MaterialKind::Sprite,
        other => panic!("material {other}"),
    };
    let mut mat = Material::new(kind, m.opt("color").map(Json::u32));
    mat.vertex_colors = m.opt("vertexColors").is_some_and(Json::bool);
    mat
}

fn euler_order(s: &str) -> EulerOrder {
    match s {
        "XYZ" => EulerOrder::Xyz,
        "YXZ" => EulerOrder::Yxz,
        "ZXY" => EulerOrder::Zxy,
        "ZYX" => EulerOrder::Zyx,
        "YZX" => EulerOrder::Yzx,
        "XZY" => EulerOrder::Xzy,
        other => panic!("order {other}"),
    }
}

// P4.27: the spec is built into a `Scene` arena; a `shared` material is one
// slot referenced by several meshes (like the one three object of the web).
fn build(
    scene: &mut Scene,
    parent: Option<NodeId>,
    spec: &Json,
    shared: &mut HashMap<String, Vec<MatId>>,
) -> NodeId {
    let kind = match spec.get("type").str() {
        "mesh" => {
            let mats = match spec.opt("shared").map(Json::str) {
                Some(name) if shared.contains_key(name) => shared[name].clone(),
                other => {
                    let mats: Vec<MatId> = spec
                        .opt("mats")
                        .map(|m| {
                            m.arr()
                                .iter()
                                .map(|x| scene.add_material(material(x)))
                                .collect()
                        })
                        .unwrap_or_default();
                    if let Some(name) = other {
                        shared.insert(name.to_owned(), mats.clone());
                    }
                    mats
                }
            };
            let geo = Arc::new(geometry(spec.get("geo")));
            let array = spec.opt("array").is_some_and(Json::bool);
            assert!(array || mats.len() == 1, "one material");
            NodeKind::Mesh(civ_renderer::scene::MeshData {
                geo: geo.into(),
                materials: mats,
                material_array: array,
            })
        }
        "sprite" => NodeKind::Sprite(scene.add_material(material(&spec.get("mats").arr()[0]))),
        "group" => NodeKind::Group,
        "object3d" => NodeKind::Object3D,
        other => panic!("node {other}"),
    };
    let id = match parent {
        Some(p) => scene.push(Some(p), kind),
        None => {
            scene.nodes[ROOT].kind = kind;
            ROOT
        }
    };
    let node = scene.node(id);
    let v3 = |j: &Json| {
        let a = j.arr();
        Vec3::new(a[0].num(), a[1].num(), a[2].num())
    };
    if let Some(p) = spec.opt("pos") {
        node.position = v3(p);
    }
    if let Some(r) = spec.opt("rot") {
        let a = r.arr();
        node.set_rotation(Euler {
            x: a[0].num(),
            y: a[1].num(),
            z: a[2].num(),
            order: euler_order(a[3].str()),
        });
    }
    if let Some(s) = spec.opt("scale") {
        node.scale = v3(s);
    }
    if spec.opt("flag").is_some_and(Json::bool) {
        node.user_data.set(MERGED_DECOR_FLAG, UserValue::Bool(true));
    }
    if let Some(ch) = spec.opt("children") {
        for c in ch.arr() {
            build(scene, Some(id), c, shared);
        }
    }
    id
}

fn build_root(spec: &Json) -> Scene {
    let mut scene = Scene::new();
    build(&mut scene, None, spec, &mut HashMap::new());
    scene
}

/// `dumpColors` of the generator: pre-order meshes and sprites, per material
/// `[r, g, b]` or `null`.
fn check_colors(c: &mut Check, what: &str, root: &Scene, want: &Json) {
    let mut got: Vec<Vec<Option<[f64; 3]>>> = Vec::new();
    let col = |m: MatId| root.materials[m].color.map(|c| c.to_array());
    for id in root.traverse() {
        match &root.nodes[id].kind {
            NodeKind::Mesh(md) => got.push(md.materials.iter().map(|&m| col(m)).collect()),
            NodeKind::Sprite(m) => got.push(vec![col(*m)]),
            _ => {}
        }
    }
    let want = want.arr();
    c.eq(&format!("{what}.meshes"), got.len(), want.len());
    for (i, (g, w)) in got.iter().zip(want).enumerate() {
        let w = w.arr();
        c.eq(&format!("{what}[{i}].mats"), g.len(), w.len());
        for (k, (gm, wm)) in g.iter().zip(w).enumerate() {
            match (gm, wm.is_null()) {
                (None, true) => c.eq(&format!("{what}[{i}][{k}]"), true, true),
                (Some(rgb), false) => {
                    for (ch, (gv, wv)) in rgb.iter().zip(wm.arr()).enumerate() {
                        c.f64(&format!("{what}[{i}][{k}][{ch}]"), *gv, wv.num());
                    }
                }
                _ => c.eq(
                    &format!("{what}[{i}][{k}] presence"),
                    gm.is_some(),
                    !wm.is_null(),
                ),
            }
        }
    }
}

#[test]
fn fog_dim_matches_web() {
    let j = load("fogdim.json");
    let mut c = Check::default();
    c.f64(
        "FOG_EXPLORED_BRIGHTNESS",
        FOG_EXPLORED_BRIGHTNESS,
        j.get("FOG_EXPLORED_BRIGHTNESS").num(),
    );
    let vis: HashSet<String> = ["0,0", "1,0", "-2,5"]
        .iter()
        .map(|s| (*s).to_owned())
        .collect();
    let exp: HashSet<String> = ["0,0", "3,3", "4,-1"]
        .iter()
        .map(|s| (*s).to_owned())
        .collect();
    for r in j.get("bright").arr() {
        let a = r.arr();
        let key = a[0].str().to_owned();
        c.f64(
            &format!("bright[{key},{}]", a[1].bool()),
            fog_brightness_for_hex(&key, &vis, &exp, a[1].bool()),
            a[2].num(),
        );
    }
    let mergedecor = load("mergedecor.json");
    let specs: HashMap<String, Json> = mergedecor
        .get("cases")
        .arr()
        .iter()
        .map(|cs| (cs.get("name").str().to_owned(), cs.get("spec").clone()))
        .collect();
    for seq in j.get("seqs").arr() {
        let name = seq.get("scene").str();
        let mut root = build_root(&specs[name]);
        check_colors(
            &mut c,
            &format!("{name}.initial"),
            &root,
            seq.get("initial"),
        );
        for (s, step) in seq.get("steps").arr().iter().enumerate() {
            apply_fog_dim(&mut root, step.get("b").num());
            check_colors(
                &mut c,
                &format!("{name}.step{s}"),
                &root,
                step.get("colors"),
            );
        }
    }
    c.finish("fogDim");
}

#[test]
fn zoom_lod_matches_web() {
    let j = load("zoomlod.json");
    let mut c = Check::default();
    c.f64("NEAR", zl::CITY_BADGE_LOD_NEAR_DIST, j.get("NEAR").num());
    c.f64("MID", zl::CITY_BADGE_LOD_MID_DIST, j.get("MID").num());
    c.eq("MARKER", zl::ZOOM_LOD_MARKER, j.get("MARKER").str());
    for (i, r) in j.get("ts").arr().iter().enumerate() {
        let a = r.arr();
        c.f64(
            &format!("t[{i}]"),
            zl::normalized_zoom_t(a[0].num(), a[1].num(), a[2].num()),
            a[3].num(),
        );
    }
    for (i, r) in j.get("lv").arr().iter().enumerate() {
        let a = r.arr();
        c.eq(
            &format!("lv[{i}]"),
            i64::from(zl::resolve_zoom_lod_level(a[0].num()).as_u8()),
            a[1].i64(),
        );
    }
    for f in j.get("flags").arr() {
        let level = zl::ZoomLodLevel::from_u8(u8::try_from(f.get("level").i64()).unwrap()).unwrap();
        let sh = f.get("sh").bool();
        let g = zl::zoom_lod_flags(level, sh);
        let w = f.get("f");
        let what = format!("flags[{level:?},{sh}]");
        c.eq(
            &format!("{what}.styledDecor"),
            g.styled_decor,
            w.get("styledDecor").bool(),
        );
        c.eq(
            &format!("{what}.forestInst"),
            g.forest_inst,
            w.get("forestInst").bool(),
        );
        c.eq(
            &format!("{what}.forestTrunkInst"),
            g.forest_trunk_inst,
            w.get("forestTrunkInst").bool(),
        );
        c.eq(
            &format!("{what}.terrainDetailInst"),
            g.terrain_detail_inst,
            w.get("terrainDetailInst").bool(),
        );
        c.eq(
            &format!("{what}.coastDecorInst"),
            g.coast_decor_inst,
            w.get("coastDecorInst").bool(),
        );
        c.eq(&format!("{what}.rivers"), g.rivers, w.get("rivers").bool());
        c.eq(
            &format!("{what}.shadows"),
            g.shadows,
            w.get("shadows").bool(),
        );
        c.f64(
            &format!("{what}.pixelRatioMul"),
            g.pixel_ratio_mul,
            w.get("pixelRatioMul").num(),
        );
        c.f64(
            &format!("{what}.decorDensity"),
            g.decor_density,
            w.get("decorDensity").num(),
        );
        if let Json::Obj(kv) = w {
            c.eq(&format!("{what}.keys"), kv.len(), 9);
        }
    }
    for (i, r) in j.get("pr").arr().iter().enumerate() {
        let a = r.arr();
        let dpr = if a[0].is_null() {
            None
        } else {
            Some(a[0].num())
        };
        c.f64(
            &format!("pr[{i}]"),
            zl::effective_pixel_ratio(a[1].num(), a[2].num(), dpr),
            a[3].num(),
        );
    }
    for (i, r) in j.get("badge").arr().iter().enumerate() {
        let a = r.arr();
        c.eq(
            &format!("badge[{i}]"),
            i64::from(zl::city_badge_lod_level_for_dist(a[0].num()).as_u8()),
            a[1].i64(),
        );
    }
    for (i, r) in j.get("scale").arr().iter().enumerate() {
        let a = r.arr();
        c.f64(
            &format!("scale[{i}]"),
            zl::city_badge_lod_texture_scale(a[0].num()),
            a[1].num(),
        );
    }
    for (i, r) in j.get("cam").arr().iter().enumerate() {
        let a = r.arr();
        let g = zl::zoom_lod_for_camera(a[0].num(), a[1].num(), a[2].num(), a[3].bool());
        c.eq(
            &format!("cam[{i}].level"),
            i64::from(g.level.as_u8()),
            a[4].i64(),
        );
        c.f64(&format!("cam[{i}].t"), g.t, a[5].num());
        c.eq(&format!("cam[{i}].marker"), g.marker, a[6].str());
        c.eq(&format!("cam[{i}].shadows"), g.flags.shadows, a[7].bool());
        c.f64(
            &format!("cam[{i}].prm"),
            g.flags.pixel_ratio_mul,
            a[8].num(),
        );
    }
    c.finish("zoomLod");
}

#[test]
fn merge_decor_matches_web() {
    let j = load("mergedecor.json");
    let mut c = Check::default();
    c.eq("FLAG", MERGED_DECOR_FLAG, j.get("FLAG").str());
    for cs in j.get("cases").arr() {
        let name = cs.get("name").str();
        let mut g = build_root(cs.get("spec"));
        let b = cs.get("before");
        c.eq(
            &format!("{name}.before.already"),
            is_already_merged_decor(&g),
            b.get("already").bool(),
        );
        c.eq(
            &format!("{name}.before.count"),
            i64::try_from(count_meshes_in_group(&g)).unwrap(),
            b.get("count").i64(),
        );
        c.eq(
            &format!("{name}.before.children"),
            i64::try_from(g.nodes[ROOT].children.len()).unwrap(),
            b.get("children").i64(),
        );
        let collapsed = collapse_to_merged_mesh(&mut g);
        let a = cs.get("after");
        c.eq(
            &format!("{name}.children"),
            i64::try_from(g.nodes[ROOT].children.len()).unwrap(),
            a.get("children").i64(),
        );
        c.eq(
            &format!("{name}.groupFlag"),
            g.nodes[ROOT].user_data.flag(MERGED_DECOR_FLAG),
            a.get("groupFlag").bool(),
        );
        c.eq(
            &format!("{name}.collapsed"),
            collapsed,
            a.get("groupFlag").bool() && !b.get("already").bool(),
        );
        c.eq(
            &format!("{name}.already"),
            is_already_merged_decor(&g),
            a.get("already").bool(),
        );
        c.eq(
            &format!("{name}.count"),
            i64::try_from(count_meshes_in_group(&g)).unwrap(),
            a.get("count").i64(),
        );
        if let Some(m) = a.opt("merged") {
            let only = &g.nodes[g.nodes[ROOT].children[0]];
            c.eq(
                &format!("{name}.childFlag"),
                only.user_data.flag(MERGED_DECOR_FLAG),
                m.get("childFlag").bool(),
            );
            let NodeKind::Mesh(md) = &only.kind else {
                panic!("{name}: merged child is not a mesh");
            };
            let geometry = md.geo.buffer().expect("merged buffer");
            let material_array = &md.material_array;
            let attrs: Vec<&str> = m.get("attrs").arr().iter().map(Json::str).collect();
            c.eq(&format!("{name}.attrs"), attrs, vec!["position", "color"]);
            c.eq(
                &format!("{name}.noNormals"),
                geometry.mesh.normals.is_empty() && geometry.mesh.uvs.is_empty(),
                true,
            );
            c.eq(
                &format!("{name}.indexed"),
                geometry.mesh.indices.is_some(),
                m.get("indexed").bool(),
            );
            let wp = m.get("position").arr();
            c.eq(
                &format!("{name}.position.len"),
                geometry.mesh.positions.len(),
                wp.len(),
            );
            for (k, (gv, wv)) in geometry.mesh.positions.iter().zip(wp).enumerate() {
                c.f32(&format!("{name}.position[{k}]"), *gv, wv.num());
            }
            let col = geometry.colors.as_ref().expect("merged colours");
            let wc = m.get("color").arr();
            c.eq(&format!("{name}.color.len"), col.len(), wc.len());
            for (k, (gv, wv)) in col.iter().zip(wc).enumerate() {
                c.f32(&format!("{name}.color[{k}]"), *gv, wv.num());
            }
            let wm = m.get("mat");
            c.eq(&format!("{name}.mat.array"), *material_array, false);
            let mat = &g.materials[md.materials[0]];
            c.eq(
                &format!("{name}.mat.type"),
                mat.kind.three_type(),
                wm.get("type").str(),
            );
            c.eq(
                &format!("{name}.mat.vc"),
                mat.vertex_colors,
                wm.get("vertexColors").bool(),
            );
            c.eq(
                &format!("{name}.mat.flat"),
                mat.flat_shading,
                wm.get("flatShading").bool(),
            );
            let rgb = mat.color.expect("colour").to_array();
            for (ch, (gv, wv)) in rgb.iter().zip(wm.get("color").arr()).enumerate() {
                c.f64(&format!("{name}.mat.color[{ch}]"), *gv, wv.num());
            }
            c.eq(
                &format!("{name}.castShadow"),
                only.cast_shadow,
                m.get("castShadow").bool(),
            );
            c.eq(
                &format!("{name}.receiveShadow"),
                only.receive_shadow,
                m.get("receiveShadow").bool(),
            );
            c.eq(
                &format!("{name}.matrixAutoUpdate"),
                only.matrix_auto_update,
                m.get("matrixAutoUpdate").bool(),
            );
            for (k, (gv, wv)) in [only.position.x, only.position.y, only.position.z]
                .iter()
                .zip(m.get("pos").arr())
                .enumerate()
            {
                c.f64(&format!("{name}.pos[{k}]"), *gv, wv.num());
            }
        }
        let before_children = g.nodes[ROOT].children.len();
        let again = collapse_to_merged_mesh(&mut g);
        c.eq(
            &format!("{name}.secondSame"),
            !again && g.nodes[ROOT].children.len() == before_children,
            a.get("secondSame").bool(),
        );
        apply_fog_dim(&mut g, FOG_EXPLORED_BRIGHTNESS);
        check_colors(&mut c, &format!("{name}.fogged"), &g, a.get("fogged"));
        let extra = g.add_material(Material::new(MaterialKind::Lambert, None));
        g.add_mesh_id(
            ROOT,
            Arc::new(Geometry::from(box_geometry(1.0, 1.0, 1.0, 1, 1, 1))),
            extra,
        );
        let (gd, md) = dispose_merged_decor(&g);
        let wd = a.get("dispose").arr();
        c.eq(
            &format!("{name}.dispose"),
            (i64::try_from(gd).unwrap(), i64::try_from(md).unwrap()),
            (wd[0].i64(), wd[1].i64()),
        );
    }
    c.finish("mergeDecor");
}

#[test]
fn vitals_match_web() {
    let j = load("vitals.json");
    let mut c = Check::default();
    c.eq(
        "HP_DARK_CSS",
        vit::VITALS_HP_DARK_CSS,
        j.get("VITALS_HP_DARK_CSS").str(),
    );
    c.eq(
        "HP_FULL_CSS",
        vit::VITALS_HP_FULL_CSS,
        j.get("VITALS_HP_FULL_CSS").str(),
    );
    c.eq(
        "HP_FULL",
        vit::VITALS_HP_FULL,
        j.get("VITALS_HP_FULL").u32(),
    );
    c.eq("HP_MID", vit::VITALS_HP_MID, j.get("VITALS_HP_MID").u32());
    c.eq("HP_LOW", vit::VITALS_HP_LOW, j.get("VITALS_HP_LOW").u32());
    c.f64(
        "HP_MID_FRAC",
        vit::VITALS_HP_MID_FRAC,
        j.get("VITALS_HP_MID_FRAC").num(),
    );
    c.f64(
        "HP_LOW_FRAC",
        vit::VITALS_HP_LOW_FRAC,
        j.get("VITALS_HP_LOW_FRAC").num(),
    );
    c.eq(
        "MOVE_DARK_CSS",
        vit::VITALS_MOVE_DARK_CSS,
        j.get("VITALS_MOVE_DARK_CSS").str(),
    );
    c.eq(
        "MOVE_FULL_CSS",
        vit::VITALS_MOVE_FULL_CSS,
        j.get("VITALS_MOVE_FULL_CSS").str(),
    );
    c.eq(
        "MOVE_FULL",
        vit::VITALS_MOVE_FULL,
        j.get("VITALS_MOVE_FULL").u32(),
    );
    c.eq(
        "TROUGH_CSS",
        vit::VITALS_TROUGH_CSS,
        j.get("VITALS_TROUGH_CSS").str(),
    );
    if let Json::Obj(kv) = &j {
        c.eq("export count", kv.len(), 11);
    }
    c.finish("unitVitalsPalette");
}

#[test]
#[allow(clippy::too_many_lines)]
fn map_style_matches_web() {
    let j = load("mapstyle.json");
    let mut c = Check::default();
    let k = j.get("consts");
    c.eq(
        "GAME_MAP_RENDER_STYLE",
        ms::GAME_MAP_RENDER_STYLE.web_id(),
        k.get("GAME_MAP_RENDER_STYLE").str(),
    );
    let usz = |n: usize| i64::try_from(n).unwrap();
    c.eq(
        "MEDIUM",
        usz(ms::MAP_DETAIL_MEDIUM_HEX_THRESHOLD),
        k.get("MAP_DETAIL_MEDIUM_HEX_THRESHOLD").i64(),
    );
    c.eq(
        "LARGE",
        usz(ms::LARGE_MAP_LITE_HEX_THRESHOLD),
        k.get("LARGE_MAP_LITE_HEX_THRESHOLD").i64(),
    );
    c.eq(
        "FAST",
        usz(ms::SCENE_BUILD_FAST_HEX_THRESHOLD),
        k.get("SCENE_BUILD_FAST_HEX_THRESHOLD").i64(),
    );
    for (name, v) in [
        ("SEA_SURFACE_TOP_Y", ms::SEA_SURFACE_TOP_Y),
        ("WYBRZEZE_SURFACE_TOP_Y", ms::WYBRZEZE_SURFACE_TOP_Y),
        (
            "LAND_MIN_CLEARANCE_ABOVE_SEA",
            ms::LAND_MIN_CLEARANCE_ABOVE_SEA,
        ),
        (
            "RIVER_LIFT_ABOVE_TERRAIN_FRAC",
            ms::RIVER_LIFT_ABOVE_TERRAIN_FRAC,
        ),
        ("FLAT_LAND_SURFACE_Y", ms::FLAT_LAND_SURFACE_Y),
        ("LAND_COAST_SAND_FRAC", ms::LAND_COAST_SAND_FRAC),
        ("LAND_HEX_Y_LIFT", ms::LAND_HEX_Y_LIFT),
        ("PUSTYNIA_EXTRA_Y_LIFT", ms::PUSTYNIA_EXTRA_Y_LIFT),
        (
            "FLAT_LAND_COAST_EXTRA_Y_LIFT",
            ms::FLAT_LAND_COAST_EXTRA_Y_LIFT,
        ),
        ("COAST_WATER_CAP_THICKNESS", ms::COAST_WATER_CAP_THICKNESS),
    ] {
        c.f64(name, v, k.get(name).num());
    }
    c.eq(
        "COAST_SAND_ROBLOX",
        ms::COAST_SAND_ROBLOX,
        k.get("COAST_SAND_ROBLOX").u32(),
    );
    let d = k.get("DEFAULT_MAP_RENDER_OPTIONS");
    let check_opts = |c: &mut Check, what: &str, g: &ms::MapRenderOptions, w: &Json| {
        c.eq(
            &format!("{what}.style"),
            g.style.web_id(),
            w.get("style").str(),
        );
        c.eq(
            &format!("{what}.renderQuality"),
            ms::quality_web_id(g.render_quality),
            w.get("renderQuality").str(),
        );
        c.eq(
            &format!("{what}.mapDetailQuality"),
            ms::quality_web_id(g.map_detail_quality),
            w.get("mapDetailQuality").str(),
        );
        match (g.preview_viewport, w.opt("previewViewport")) {
            (None, None) => {}
            (Some(p), Some(wp)) => {
                c.f64(&format!("{what}.pv.w"), p.width, wp.get("width").num());
                c.f64(&format!("{what}.pv.h"), p.height, wp.get("height").num());
                c.eq(
                    &format!("{what}.pv.cols"),
                    p.panel_columns.map(f64::to_bits),
                    wp.opt("panelColumns").map(|x| x.num().to_bits()),
                );
            }
            (g, w) => c.eq(&format!("{what}.pv presence"), g.is_some(), w.is_some()),
        }
    };
    check_opts(&mut c, "DEFAULT", &ms::DEFAULT_MAP_RENDER_OPTIONS, d);

    for r in j.get("surface").arr() {
        let a = r.arr();
        c.f64(
            &format!("surface[{}]", a[0].str()),
            ms::terrain_surface_y(terrain(&a[0])),
            a[1].num(),
        );
    }
    for r in j.get("robloxVis").arr() {
        let a = r.arr();
        let s = ms::roblox_terrain_vis(terrain(&a[0]));
        c.f64(
            &format!("robloxVis[{}].h", a[0].str()),
            s.height,
            a[1].num(),
        );
        c.f64(
            &format!("robloxVis[{}].yo", a[0].str()),
            s.y_offset,
            a[2].num(),
        );
    }
    for (i, r) in j.get("vis").arr().iter().enumerate() {
        let a = r.arr();
        let civ = ms::TerrainVisualSpec {
            height: a[2].num(),
            y_offset: a[3].num(),
        };
        let g = ms::terrain_visual_for_style(terrain(&a[0]), style(&a[1]), civ);
        c.f64(&format!("vis[{i}].h"), g.height, a[4].num());
        c.f64(&format!("vis[{i}].yo"), g.y_offset, a[5].num());
    }
    // The civ table of the web is the default `civ` argument (first spec of every triple).
    for t in Terrain::ALL {
        let row = j.get("vis").arr().iter().find(|r| {
            let a = r.arr();
            a[0].str() == ms::terrain_web_id(t) && a[1].str() == "civ"
        });
        let a = row.expect("civ row").arr();
        c.f64(
            "CIV_TERRAIN_VIS.h",
            ms::civ_terrain_vis(t).height,
            a[2].num(),
        );
        c.f64(
            "CIV_TERRAIN_VIS.yo",
            ms::civ_terrain_vis(t).y_offset,
            a[3].num(),
        );
    }
    for (i, r) in j.get("topY").arr().iter().enumerate() {
        let a = r.arr();
        let (s, e) = if a[1].is_null() {
            (ms::GAME_MAP_RENDER_STYLE, 0.0)
        } else {
            (style(&a[1]), a[2].num())
        };
        c.f64(
            &format!("topY[{i}]"),
            ms::terrain_surface_top_y(terrain(&a[0]), s, e),
            a[3].num(),
        );
    }
    for r in j.get("capTop").arr() {
        let a = r.arr();
        let s = if a[0].is_null() {
            ms::GAME_MAP_RENDER_STYLE
        } else {
            style(&a[0])
        };
        c.f64(
            &format!("capTop[{s:?}]"),
            ms::coast_water_cap_top_y(s),
            a[1].num(),
        );
    }
    for w in j.get("audits").arr() {
        let s = style(w.get("style"));
        let g = ms::terrain_height_audit(s);
        let what = format!("audit[{}]", s.web_id());
        c.f64(&format!("{what}.sea"), g.sea_top_y, w.get("seaTopY").num());
        c.f64(
            &format!("{what}.pm"),
            g.plytkie_morze_top_y,
            w.get("plytkieMorzeTopY").num(),
        );
        c.f64(
            &format!("{what}.cap"),
            g.coast_water_cap_top_y,
            w.get("coastWaterCapTopY").num(),
        );
        c.f64(
            &format!("{what}.minGap"),
            g.min_land_gap,
            w.get("minLandGap").num(),
        );
        let wl = w.get("land").arr();
        c.eq(&format!("{what}.land.len"), g.land.len(), wl.len());
        for (row, wr) in g.land.iter().zip(wl) {
            let a = wr.arr();
            c.eq(
                &format!("{what}.land.teren"),
                ms::terrain_web_id(row.teren),
                a[0].str(),
            );
            c.f64(&format!("{what}.land.top"), row.top_y, a[1].num());
            c.f64(&format!("{what}.land.gap"), row.gap_above_sea, a[2].num());
        }
        let wv: Vec<String> = w
            .get("violations")
            .arr()
            .iter()
            .map(|x| x.str().to_owned())
            .collect();
        c.eq(&format!("{what}.violations"), g.violations, wv);
    }
    for r in j.get("colors").arr() {
        let a = r.arr();
        c.eq(
            &format!("color[{},{}]", a[0].str(), a[1].str()),
            ms::style_terrain_color(terrain(&a[0]), style(&a[1])),
            a[2].u32(),
        );
    }
    for r in j.get("palettes").arr() {
        let a = r.arr();
        let s = style(&a[0]);
        let g = ms::style_scene_palette(s);
        let w = &a[1];
        let what = format!("palette[{}]", s.web_id());
        c.eq(&format!("{what}.sky"), g.sky, w.get("sky").u32());
        c.eq(
            &format!("{what}.fogColor"),
            g.fog_color,
            w.get("fogColor").u32(),
        );
        let opt = |k: &str| w.opt(k).map(|x| x.num().to_bits());
        c.eq(
            &format!("{what}.fogExp"),
            g.fog_exp.map(f64::to_bits),
            opt("fogExp"),
        );
        c.eq(
            &format!("{what}.fogNear"),
            g.fog_near.map(f64::to_bits),
            opt("fogNear"),
        );
        c.eq(
            &format!("{what}.fogFar"),
            g.fog_far.map(f64::to_bits),
            opt("fogFar"),
        );
        c.eq(
            &format!("{what}.deepOcean"),
            g.deep_ocean,
            w.get("deepOcean").u32(),
        );
        c.eq(&format!("{what}.frame"), g.frame, w.get("frame").u32());
        c.eq(&format!("{what}.river"), g.river, w.get("river").u32());
        c.eq(
            &format!("{what}.riverBank"),
            g.river_bank,
            w.get("riverBank").u32(),
        );
        c.eq(
            &format!("{what}.flatShading"),
            g.flat_shading,
            w.get("flatShading").bool(),
        );
        c.eq(
            &format!("{what}.antialias"),
            g.antialias,
            w.get("antialias").bool(),
        );
        if let Json::Obj(kv) = w {
            let present = 8
                + usize::from(g.fog_exp.is_some())
                + usize::from(g.fog_near.is_some())
                + usize::from(g.fog_far.is_some());
            c.eq(&format!("{what}.keys"), kv.len(), present);
        }
    }
    for r in j.get("lift").arr() {
        let a = r.arr();
        c.f64(
            "riverSurfaceLiftY",
            ms::river_surface_lift_y(a[0].num()),
            a[1].num(),
        );
    }
    for (i, r) in j.get("norm").arr().iter().enumerate() {
        let a = r.arr();
        let input = match &a[0] {
            Json::Null => None,
            Json::Str(s) => Some(ms::MapRenderOptionsInput::Style(
                ms::MapRenderStyle::from_web_id(s).unwrap(),
            )),
            o @ Json::Obj(_) => Some(ms::MapRenderOptionsInput::Options(
                ms::PartialMapRenderOptions {
                    style: o.opt("style").map(style),
                    render_quality: o.opt("renderQuality").map(quality),
                    map_detail_quality: o.opt("mapDetailQuality").map(quality),
                    preview_viewport: o.opt("previewViewport").map(|p| ms::PreviewViewport {
                        width: p.get("width").num(),
                        height: p.get("height").num(),
                        panel_columns: p.opt("panelColumns").map(Json::num),
                    }),
                },
            )),
            other => panic!("norm input {other:?}"),
        };
        let g = ms::normalize_map_render_options(input.as_ref());
        check_opts(&mut c, &format!("norm[{i}]"), &g, &a[1]);
    }
    for (i, r) in j.get("presets").arr().iter().enumerate() {
        let a = r.arr();
        let o = ms::MapRenderOptions {
            style: style(&a[0]),
            render_quality: quality(&a[1]),
            map_detail_quality: quality(&a[2]),
            preview_viewport: None,
        };
        let p = ms::resolve_render_preset(&o, usize::try_from(a[3].i64()).unwrap());
        c.eq(&format!("preset[{i}].lite"), p.roblox_lite, a[4].bool());
        c.eq(&format!("preset[{i}].aa"), p.antialias, a[5].bool());
        c.f64(&format!("preset[{i}].prm"), p.pixel_ratio_max, a[6].num());
        c.eq(&format!("preset[{i}].sh"), p.shadows_enabled, a[7].bool());
        c.eq(&format!("preset[{i}].sms"), p.shadow_map_size, a[8].u32());
        c.f64(&format!("preset[{i}].fog"), p.fog_far_mul, a[9].num());
    }
    for r in j.get("fast").arr() {
        let a = r.arr();
        c.eq(
            "fastPath",
            ms::is_scene_build_fast_path(usize::try_from(a[0].i64()).unwrap()),
            a[1].bool(),
        );
    }
    for (i, r) in j.get("dense").arr().iter().enumerate() {
        let a = r.arr();
        let paths = if a[0].is_null() {
            0
        } else {
            usize::try_from(a[0].i64()).unwrap()
        };
        let hexes: Vec<Terrain> = a[1].arr().iter().map(terrain).collect();
        let hc = usize::try_from(a[2].i64()).unwrap();
        c.eq(
            &format!("dense[{i}]"),
            ms::is_dense_landmass_map(paths, &hexes),
            a[3].bool(),
        );
        c.eq(
            &format!("riverFast[{i}]"),
            ms::is_river_render_fast(hc, paths, &hexes),
            a[4].bool(),
        );
        c.eq(
            &format!("aggressive[{i}]"),
            ms::is_scene_build_aggressive(hc, paths, &hexes),
            a[5].bool(),
        );
    }
    for (i, r) in j.get("counts").arr().iter().enumerate() {
        let a = r.arr();
        let (q, rr, seed, salt) = (a[0].i32(), a[1].i32(), a[2].i32(), a[3].i32());
        c.f64(
            &format!("hash2D[{i}]"),
            ms::hash_heksa(q, rr, seed, salt),
            a[4].num(),
        );
        c.eq(
            &format!("decorVariant5[{i}]"),
            i64::from(ms::decor_variant5(q, rr, seed, salt)),
            a[5].i64(),
        );
        c.eq(
            &format!("forest[{i}]"),
            i64::from(ms::forest_tree_count_for_hex(q, rr, seed)),
            a[6].i64(),
        );
        c.eq(
            &format!("jungle[{i}]"),
            i64::from(ms::jungle_forest_tree_count_for_hex(q, rr, seed)),
            a[7].i64(),
        );
    }
    for r in j.get("hills").arr() {
        let a = r.arr();
        let lite = !a[1].is_null() && a[1].bool();
        c.f64(
            "hillBump",
            ms::style_hill_bump_surface_y(a[0].num(), lite),
            a[2].num(),
        );
    }
    for (i, r) in j.get("peaks").arr().iter().enumerate() {
        let a = r.arr();
        c.f64(
            &format!("peak[{i}]"),
            ms::style_mountain_peak_surface_y(a[0].num(), a[1].i32(), a[2].i32(), a[3].i32()),
            a[4].num(),
        );
    }
    for (i, r) in j.get("gallery").arr().iter().enumerate() {
        let a = r.arr();
        let keys: Vec<&str> = a[2].arr().iter().map(Json::str).collect();
        let o = &a[3];
        let opts = if o.is_null() {
            ms::GalleryDecorOpts::default()
        } else {
            ms::GalleryDecorOpts {
                lite: o.opt("lite").map(Json::bool),
                q: o.opt("q").map(Json::i32),
                r: o.opt("r").map(Json::i32),
                seed: o.opt("seed").map(Json::i32),
                radius: o.opt("R").map(Json::num),
            }
        };
        let t = terrain(&a[0]);
        c.f64(
            &format!("gallery[{i}].top"),
            ms::terrain_surface_top_y(t, ms::GAME_MAP_RENDER_STYLE, 0.0),
            a[1].num(),
        );
        c.f64(
            &format!("gallery[{i}]"),
            ms::gallery_decor_surface_y(t, a[1].num(), &keys, opts),
            a[4].num(),
        );
    }
    for r in j.get("edge").arr() {
        let a = r.arr();
        c.f64(
            "edge",
            ms::elevated_terrain_edge_surface_y(terrain(&a[0]), 0.64),
            a[1].num(),
        );
    }
    let apex = j.get("GORA_APEX_Y").arr();
    c.eq("GORA_APEX_Y.len", ms::GORA_APEX_Y.len(), apex.len());
    for (g, w) in ms::GORA_APEX_Y.iter().zip(apex) {
        c.f64("GORA_APEX_Y", *g, w.num());
    }
    c.f64(
        "WZGORZE_SZCZYT_Y",
        ms::WZGORZE_SZCZYT_Y,
        j.get("WZGORZE_SZCZYT_Y").num(),
    );
    c.finish("mapRenderStyle");
}

#[test]
fn bronze_city_types_match_web() {
    let j = load("bronze.json");
    let mut c = Check::default();
    let civs: Vec<&str> = j.get("BRONZE_CIVS").arr().iter().map(Json::str).collect();
    let ours: Vec<&str> = BRONZE_CIVS.iter().map(|b| b.web_id()).collect();
    c.eq("BRONZE_CIVS", ours, civs);
    let mut quirks = 0;
    for r in j.get("map").arr() {
        let a = r.arr();
        let got = ikona_id_to_bronze_civ(a[0].str());
        let want = a[1].str();
        if want.starts_with("__non_string__") {
            // Documented deviation: JS returns an Object.prototype member.
            quirks += 1;
            c.eq(
                &format!("ikona[{}] (quirk)", a[0].str()),
                got,
                BronzeCiv::Grecja,
            );
        } else {
            c.eq(&format!("ikona[{}]", a[0].str()), got.web_id(), want);
            c.eq(
                &format!("from_web_id[{want}]"),
                BronzeCiv::from_web_id(want),
                Some(got),
            );
        }
    }
    c.eq("quirk count", quirks, 5);
    for (i, r) in j.get("rnd").arr().iter().enumerate() {
        let a = r.arr();
        c.f64(
            &format!("rnd[{i}]({}, {})", a[0].num(), a[1].num()),
            rnd(a[0].num(), a[1].num()),
            a[2].num(),
        );
    }
    c.finish("bronzeCity");
}
