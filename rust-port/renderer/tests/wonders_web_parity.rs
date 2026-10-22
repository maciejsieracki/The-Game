//! MOD-12 wonder tests (R-RUSTPORT-P4-14-MOD12-WONDERS-Q1): the Rust
//! `models::wonders` port against object graphs produced by the **web** code
//! (`buildWonderModel` and `WonderRenderer` of `edb8fb56`, imported unchanged,
//! three@0.169.0), see `tests/fixtures/wonders/README.md` and
//! `dyspozycje/rust-port/p4/P4-14-MOD12-WONDERS.md`.
//!
//! Every scalar (positions, rotations, scales, world matrices, bounding
//! boxes, linear material colours) is compared bit for bit and the tests
//! require bit equality. Geometry is compared by vertex/index counts and an
//! FNV-1a hash of the `Float32` attributes, indices and groups. Values that
//! differ but stay within 1e-12 are counted separately so that a platform
//! libm difference would be reported as such.

#![allow(clippy::float_cmp)]

use std::collections::HashSet;
use std::path::PathBuf;

use civ_renderer::geom::{Mat4, Mesh};
use civ_renderer::models::wonders::{
    build_wonder_model, js_cos, js_sin, LambertMaterial, NodeKind, PlacedWonder, Primitive,
    WonderModel, WonderModelOptions, WonderRenderOptions, WonderRenderer, WonderShape,
    WONDER_MODEL_IDS,
};
use civ_renderer::pick::hex::HexCoord;
use civ_renderer::pick::terrain::Terrain;
use civ_renderer::terrain::color::Color;

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
    fn hex(&self) -> Option<HexCoord> {
        if self.is_null() {
            return None;
        }
        let a = self.arr();
        Some(HexCoord::new(a[0].i32(), a[1].i32()))
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
        let mut out = String::new();
        loop {
            let c = self.s[self.i];
            self.i += 1;
            match c {
                b'"' => break,
                b'\\' => {
                    let e = self.s[self.i];
                    self.i += 1;
                    out.push(match e {
                        b'n' => '\n',
                        b't' => '\t',
                        b'"' => '"',
                        b'\\' => '\\',
                        b'/' => '/',
                        _ => panic!("unsupported escape"),
                    });
                }
                _ => out.push(char::from(c)),
            }
        }
        out
    }
}

fn load(name: &str) -> Json {
    let p: PathBuf = [
        env!("CARGO_MANIFEST_DIR"),
        "tests",
        "fixtures",
        "wonders",
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

// ---------------------------------------------------------------------------
// Comparison bookkeeping.

#[derive(Default)]
struct Cmp {
    scalars: usize,
    bit_diff: usize,
    near: usize,
    errors: Vec<String>,
}

impl Cmp {
    fn f(&mut self, ctx: &str, rust: f64, web: f64) {
        self.scalars += 1;
        if rust.to_bits() != web.to_bits() {
            self.bit_diff += 1;
            if (rust - web).abs() <= 1e-12 {
                self.near += 1;
            }
            if self.errors.len() < 40 {
                self.errors.push(format!(
                    "{ctx}: rust {rust:e} ({:#x}) web {web:e}",
                    rust.to_bits()
                ));
            }
        }
    }
    fn fs(&mut self, ctx: &str, rust: &[f64], web: &Json) {
        let w = web.f64s();
        self.eq(&format!("{ctx}.len"), rust.len(), w.len());
        for (i, (a, b)) in rust.iter().zip(w.iter()).enumerate() {
            self.f(&format!("{ctx}[{i}]"), *a, *b);
        }
    }
    fn eq<T: PartialEq + std::fmt::Debug>(&mut self, ctx: &str, rust: T, web: T) {
        if rust != web {
            self.bit_diff += 1;
            if self.errors.len() < 40 {
                self.errors
                    .push(format!("{ctx}: rust {rust:?} web {web:?}"));
            }
        }
    }
    fn finish(self, what: &str) {
        println!(
            "{what}: scalars={} bit_diff={} within_1e-12={} ",
            self.scalars, self.bit_diff, self.near
        );
        assert!(
            self.bit_diff == 0,
            "{what}: {} differences, first: {:#?}",
            self.bit_diff,
            self.errors
        );
    }
}

/// FNV-1a 32 over little-endian bytes (same as `fnvGeometry` in `gen.ts`).
fn fnv_geometry(g: &Mesh) -> u32 {
    let mut h: u32 = 0x811c_9dc5;
    let mut feed = |u: u32| {
        for b in u.to_le_bytes() {
            h ^= u32::from(b);
            h = h.wrapping_mul(0x0100_0193);
        }
    };
    for v in g.positions.iter().chain(&g.normals).chain(&g.uvs) {
        feed(v.to_bits());
    }
    for i in g.index_buffer() {
        feed(i);
    }
    for gr in &g.groups {
        feed(gr.start);
        feed(gr.count);
        feed(gr.material_index);
    }
    h
}

fn u32_of(j: &Json) -> u32 {
    let n = j.num();
    assert!(n.fract() == 0.0 && (0.0..=f64::from(u32::MAX)).contains(&n));
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let v = n as u32;
    v
}

fn usize_of(j: &Json) -> usize {
    usize::try_from(u32_of(j)).expect("usize")
}

fn primitive_matches(c: &mut Cmp, ctx: &str, p: &Primitive, web: &Json) {
    match *p {
        Primitive::Box {
            width,
            height,
            depth,
        } => {
            c.eq(&format!("{ctx}.type"), "box", web.get("type").str());
            c.f(&format!("{ctx}.w"), width, web.get("w").num());
            c.f(&format!("{ctx}.h"), height, web.get("h").num());
            c.f(&format!("{ctx}.d"), depth, web.get("d").num());
        }
        Primitive::Cylinder {
            radius_top,
            radius_bottom,
            height,
            radial_segments,
        } => {
            c.eq(&format!("{ctx}.type"), "cyl", web.get("type").str());
            c.f(&format!("{ctx}.rt"), radius_top, web.get("rt").num());
            c.f(&format!("{ctx}.rb"), radius_bottom, web.get("rb").num());
            c.f(&format!("{ctx}.h"), height, web.get("h").num());
            c.eq(
                &format!("{ctx}.seg"),
                radial_segments,
                u32_of(web.get("seg")),
            );
        }
        Primitive::Cone {
            radius,
            height,
            radial_segments,
        } => {
            c.eq(&format!("{ctx}.type"), "cone", web.get("type").str());
            c.f(&format!("{ctx}.r"), radius, web.get("r").num());
            c.f(&format!("{ctx}.h"), height, web.get("h").num());
            c.eq(
                &format!("{ctx}.seg"),
                radial_segments,
                u32_of(web.get("seg")),
            );
        }
    }
}

fn material_matches(c: &mut Cmp, ctx: &str, m: &LambertMaterial, web: &Json) {
    c.eq(&format!("{ctx}.type"), "lambert", web.get("type").str());
    let lin = m.linear_color();
    c.eq(&format!("{ctx}.hex"), lin.to_hex(), u32_of(web.get("hex")));
    c.eq(
        &format!("{ctx}.hex(input)"),
        m.color,
        u32_of(web.get("hex")),
    );
    c.fs(
        &format!("{ctx}.lin"),
        &[lin.r, lin.g, lin.b],
        web.get("lin"),
    );
    c.eq(
        &format!("{ctx}.flat"),
        m.flat_shading,
        web.get("flat").bool(),
    );
}

/// Compares a Rust model with one `dumpModel` record; returns the number of
/// meshes checked.
fn model_matches(c: &mut Cmp, ctx: &str, model: &WonderModel, web: &Json) -> usize {
    c.eq(
        &format!("{ctx}.userMats"),
        model.user_data_material_count(),
        usize_of(web.get("userMats")),
    );
    let wm = web.get("materials").arr();
    c.eq(
        &format!("{ctx}.materials.len"),
        model.materials.len(),
        wm.len(),
    );
    for (i, (m, w)) in model.materials.iter().zip(wm).enumerate() {
        material_matches(c, &format!("{ctx}.mat{i}"), m, w);
    }

    let mut nodes = Vec::new();
    model.root.traverse(None, &mut |n, parent, w| {
        nodes.push((n.clone(), parent, *w));
    });
    let wn = web.get("nodes").arr();
    c.eq(&format!("{ctx}.nodes.len"), nodes.len(), wn.len());
    let mut meshes = 0usize;
    let mut vertices = 0usize;
    let mut triangles = 0usize;
    for (i, ((n, parent, world), w)) in nodes.iter().zip(wn).enumerate() {
        let cx = format!("{ctx}.node{i}");
        let is_mesh = matches!(n.kind, NodeKind::Mesh { .. });
        c.eq(
            &format!("{cx}.t"),
            if is_mesh { "M" } else { "G" },
            w.get("t").str(),
        );
        let wp = w.get("parent").num();
        c.eq(
            &format!("{cx}.parent"),
            parent.map_or(-1.0, |p| f64::from(u32::try_from(p).expect("u32"))),
            wp,
        );
        c.fs(
            &format!("{cx}.p"),
            &[n.position.x, n.position.y, n.position.z],
            w.get("p"),
        );
        c.fs(
            &format!("{cx}.r"),
            &[n.rotation.x, n.rotation.y, n.rotation.z],
            w.get("r"),
        );
        c.fs(
            &format!("{cx}.s"),
            &[n.scale.x, n.scale.y, n.scale.z],
            w.get("s"),
        );
        c.eq(&format!("{cx}.cs"), n.cast_shadow, w.get("cs").bool());
        c.eq(&format!("{cx}.rs"), n.receive_shadow, w.get("rs").bool());
        c.fs(&format!("{cx}.w"), &world.e, w.get("w"));
        if let NodeKind::Mesh {
            primitive,
            material,
        } = &n.kind
        {
            meshes += 1;
            primitive_matches(c, &format!("{cx}.geo"), primitive, w.get("geo"));
            c.eq(&format!("{cx}.mat"), *material, usize_of(w.get("mat")));
            let g = primitive.geometry();
            c.eq(&format!("{cx}.nv"), g.vertex_count(), usize_of(w.get("nv")));
            c.eq(
                &format!("{cx}.ni"),
                g.index_buffer().len(),
                usize_of(w.get("ni")),
            );
            c.eq(
                &format!("{cx}.hash"),
                fnv_geometry(&g),
                u32_of(w.get("hash")),
            );
            vertices += g.vertex_count();
            triangles += g.triangle_count();
        }
    }
    c.eq(
        &format!("{ctx}.meshes"),
        meshes,
        usize_of(web.get("meshes")),
    );
    c.eq(&format!("{ctx}.meshes(api)"), model.mesh_count(), meshes);
    c.eq(
        &format!("{ctx}.nodes(api)"),
        model.node_count(),
        nodes.len(),
    );
    c.eq(
        &format!("{ctx}.vertices"),
        vertices,
        usize_of(web.get("vertices")),
    );
    c.eq(
        &format!("{ctx}.triangles"),
        triangles,
        usize_of(web.get("triangles")),
    );
    c.fs(
        &format!("{ctx}.bbox"),
        &model.bounding_box(None),
        web.get("bbox"),
    );
    let wm = model.world_meshes(None);
    c.eq(&format!("{ctx}.world_meshes"), wm.len(), meshes);
    meshes
}

fn opt_u32(j: &Json) -> Option<u32> {
    if j.is_null() {
        None
    } else {
        Some(u32_of(j))
    }
}

#[test]
fn registry_matches_web_ids() {
    let d = load("models.json");
    let web_ids: Vec<&str> = d
        .get("wonderModelIds")
        .arr()
        .iter()
        .map(Json::str)
        .collect();
    assert_eq!(web_ids, WONDER_MODEL_IDS.to_vec());
    let cuda: HashSet<&str> = d.get("cuda").arr().iter().map(Json::str).collect();
    let ids: HashSet<&str> = WONDER_MODEL_IDS.iter().copied().collect();
    assert_eq!(cuda, ids, "wonders.json `cuda` = WONDER_MODEL_IDS");
    let parked: Vec<&str> = d.get("parked").arr().iter().map(Json::str).collect();
    assert_eq!(parked.len(), 5);
    for p in parked {
        assert_eq!(WonderShape::from_id(p), WonderShape::Default, "{p}");
    }
}

#[test]
fn models_are_bit_identical_to_web() {
    let d = load("models.json");
    let mut c = Cmp::default();
    let mut n_models = 0;
    let mut n_meshes = 0;
    for rec in d.get("models").arr() {
        let id = rec.get("id").str();
        let ruin_j = rec.get("ruin");
        let ruin = !ruin_j.is_null() && ruin_j.bool();
        let owner_color = opt_u32(rec.get("ownerColor"));
        let model = build_wonder_model(id, WonderModelOptions { ruin, owner_color });
        n_meshes += model_matches(
            &mut c,
            &format!("{id}/ruin={ruin}/owner={owner_color:?}"),
            &model,
            rec.get("model"),
        );
        n_models += 1;
    }
    println!("models={n_models} meshes={n_meshes}");
    assert_eq!(n_models, 157);
    c.finish("models");
}

fn terrain_from_web(id: &str) -> Terrain {
    Terrain::from_web_id(id).unwrap_or_else(|| panic!("terrain {id}"))
}

fn placed_from(j: &Json) -> Vec<PlacedWonder> {
    j.arr()
        .iter()
        .map(|w| PlacedWonder {
            wonder_id: w.get("wonderId").str().to_owned(),
            q: w.get("q").i32(),
            r: w.get("r").i32(),
            owner_id: w.get("ownerId").i32(),
            ruin: w.opt("ruin").is_some_and(Json::bool),
        })
        .collect()
}

#[test]
fn renderer_scenario_is_bit_identical_to_web() {
    let d = load("renderer.json");
    let hexes: Vec<(HexCoord, Terrain)> = d
        .get("hexes")
        .arr()
        .iter()
        .map(|h| {
            let a = h.arr();
            (
                HexCoord::new(a[0].i32(), a[1].i32()),
                terrain_from_web(a[2].str()),
            )
        })
        .collect();
    let mut wr = WonderRenderer::new(hexes);
    let odd = |w: &PlacedWonder| (w.q + w.r) % 2 != 0;
    let even = |w: &PlacedWonder| (w.q + w.r) % 2 == 0;
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let plus = |id: i32| (0x0010_2030_i64 + i64::from(id) * 0x0001_0101) as u32;
    let mut c = Cmp::default();
    let mut checked = 0usize;
    for (si, step) in d.get("steps").arr().iter().enumerate() {
        match step.get("op").str() {
            "sync" => {
                let placed = placed_from(step.get("placed"));
                let is_visible: Option<&dyn Fn(&PlacedWonder) -> bool> = match step.get("isVisible")
                {
                    Json::Null => None,
                    Json::Str(s) if s == "odd" => Some(&odd),
                    Json::Str(s) if s == "even" => Some(&even),
                    other => panic!("isVisible {other:?}"),
                };
                let owner_color_fn: Option<&dyn Fn(i32) -> u32> = match step.get("ownerColorFn") {
                    Json::Null => None,
                    Json::Str(s) if s == "plus" => Some(&plus),
                    other => panic!("ownerColorFn {other:?}"),
                };
                wr.sync(
                    &placed,
                    WonderRenderOptions {
                        is_visible,
                        owner_color_fn,
                    },
                );
            }
            "fog" => {
                let vis: HashSet<String> = step
                    .get("vis")
                    .arr()
                    .iter()
                    .map(|s| s.str().to_owned())
                    .collect();
                wr.apply_fog_visibility(&vis, step.get("fogOn").bool());
            }
            "dispose" => wr.dispose(),
            other => panic!("op {other}"),
        }
        let after = step.get("after");
        let ctx = format!("step{si}/{}", after.get("label").str());
        let web = after.get("children").arr();
        let rust = wr.wonders();
        c.eq(&format!("{ctx}.children.len"), rust.len(), web.len());
        for (i, (g, w)) in rust.iter().zip(web).enumerate() {
            let cx = format!("{ctx}.child{i}");
            c.eq(&format!("{cx}.key"), g.key.as_str(), w.get("key").str());
            c.eq(
                &format!("{cx}.visualKey"),
                g.visual_key.as_str(),
                w.get("visualKey").str(),
            );
            c.eq(&format!("{cx}.visible"), g.visible, w.get("visible").bool());
            c.fs(
                &format!("{cx}.p"),
                &[g.position.x, g.position.y, g.position.z],
                w.get("p"),
            );
            c.fs(
                &format!("{cx}.s"),
                &[g.scale.x, g.scale.y, g.scale.z],
                w.get("s"),
            );
            let m: Mat4 = g.world_matrix();
            c.fs(&format!("{cx}.w"), &m.e, w.get("w"));
            c.eq(
                &format!("{cx}.nodes"),
                g.model.node_count(),
                usize_of(w.get("nodes")),
            );
            c.eq(
                &format!("{cx}.mat0"),
                Color::from_hex(g.model.materials[0].color).to_hex(),
                u32_of(w.get("mat0")),
            );
            c.eq(
                &format!("{cx}.banner"),
                g.model.banner_material().map(|m| m.color),
                opt_u32(w.get("bannerHex")),
            );
            checked += 1;
        }
    }
    println!(
        "renderer: steps={} wonder-states={checked}",
        d.get("steps").arr().len()
    );
    assert!(checked > 100);
    c.finish("renderer");
}

#[test]
fn js_trig_is_bit_identical_to_v8() {
    let d = load("trig.json");
    let x = d.get("x").f64s();
    let s = d.get("sin").f64s();
    let co = d.get("cos").f64s();
    assert_eq!(x.len(), 4477);
    let mut c = Cmp::default();
    let mut platform_diff = 0usize;
    for (i, &a) in x.iter().enumerate() {
        c.f(&format!("sin({a:e})#{i}"), js_sin(a), s[i]);
        c.f(&format!("cos({a:e})#{i}"), js_cos(a), co[i]);
        if a.sin().to_bits() != s[i].to_bits() || a.cos().to_bits() != co[i].to_bits() {
            platform_diff += 1;
        }
    }
    println!(
        "trig: angles={} platform sin/cos differ from V8 at {platform_diff} angles",
        x.len()
    );
    c.finish("trig");
}
