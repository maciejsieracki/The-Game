//! MOD-09 city tests (R-RUSTPORT-P4-21-MOD09-CITIES-Q1): the Rust
//! `models::cities` port against object graphs produced by the **web** code
//! (`miasto-kamien`, `miasto-braz`, `bronzeCityRoblox`, `stoneCityRoblox`,
//! `settlementModel`, `cityMapOutline`, `CityRenderer` of `edb8fb56`,
//! imported unchanged, three@0.169.0), see `tests/fixtures/cities/README.md`
//! and `dyspozycje/rust-port/p4/P4-21-MOD09-CITIES.md`.
//!
//! Every model is compared through counts (nodes, meshes, lines, vertices,
//! triangles), the bounding box (bits), the materials in first-use order
//! (linear colour bits, flags) and one FNV-1a hash over every node
//! (type, parent, position / rotation / quaternion / scale and world matrix
//! as f64 bits, shadow / visibility / render-order flags, geometry hash of the
//! `Float32` attributes + index + groups, material index). 21 models also
//! carry a per-node dump that is compared field by field (diagnostics).

#![allow(clippy::float_cmp, clippy::needless_range_loop)]

use std::collections::HashSet;
use std::path::PathBuf;

use civ_renderer::core::bronze::BronzeCiv;
use civ_renderer::geom::{Mat4, Mesh};
// P4.27 (R-RUSTPORT-P4-27-SCENE-UNIFY-Q1): forced type adjustments only — a city
// model is a `scene::Scene`; the drawables table / `user_data` field became the
// read views `drawable(m, id)` / `city_user_data(m)` / `CityMaterial::of`;
// every assertion is unchanged.
use civ_renderer::models::cities::{
    braz, build_bronze_city_roblox, build_city_map_outline, build_legacy_city_model,
    build_miasto_braz, build_miasto_braz_grecja, build_miasto_braz_rzym, build_miasto_kamien,
    build_palisada_wal_model, build_settlement_model, build_stone_age_city_roblox,
    build_stone_age_city_roblox_universal, city_user_data, drawable, kamien,
    place_city_map_outline, renderer::terrain_top_y, rozmiar_dla_poziomu, stone_civ_label, City,
    CityGeo, CityMapOutlineKind, CityMaterial, CityModel, CityRenderOptions, CityRenderer,
    CityWallKind, DrawKind, MiastoBrazOpts, MiastoKamienOpts, Poziom, Rozmiar, SceneObject,
    STONE_CIVS,
};
use civ_renderer::models::unit_core::model::{Fnv, ROOT};
use civ_renderer::pick::hex::{axial_to_world, HexCoord, HEX_R};
use civ_renderer::pick::terrain::Terrain;

// ---------------------------------------------------------------------------
// Minimal JSON reader (no dependencies; trusted fixtures). Same reader as
// tests/wonders_web_parity.rs, with UTF-8 strings and "NaN"/"Infinity".

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
            Json::Str(s) if s == "NaN" => f64::NAN,
            Json::Str(s) if s == "Infinity" => f64::INFINITY,
            Json::Str(s) if s == "-Infinity" => f64::NEG_INFINITY,
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
    fn f64s(&self) -> Vec<f64> {
        self.arr().iter().map(Json::num).collect()
    }
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    fn u32(&self) -> u32 {
        let n = self.num();
        assert!(
            n.fract() == 0.0 && (0.0..=f64::from(u32::MAX)).contains(&n),
            "not a u32: {n}"
        );
        n as u32
    }
    #[allow(clippy::cast_possible_truncation)]
    fn i32(&self) -> i32 {
        let n = self.num();
        assert!(n.fract() == 0.0, "not an i32: {n}");
        n as i32
    }
    fn opt_u32(&self) -> Option<u32> {
        if self.is_null() {
            None
        } else {
            Some(self.u32())
        }
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
        "cities",
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
// Bookkeeping.

#[derive(Default)]
struct Check {
    compared: usize,
    errors: Vec<String>,
}

impl Check {
    fn eq_bits(&mut self, what: &str, rust: f64, web: f64) {
        self.compared += 1;
        let same = rust.to_bits() == web.to_bits() || (rust.is_nan() && web.is_nan());
        if !same {
            self.errors
                .push(format!("{what}: rust {rust:e} web {web:e}"));
        }
    }
    fn eq<T: PartialEq + std::fmt::Debug>(&mut self, what: &str, rust: T, web: T) {
        self.compared += 1;
        if rust != web {
            self.errors
                .push(format!("{what}: rust {rust:?} web {web:?}"));
        }
    }
    fn finish(self, label: &str) {
        let n = self.errors.len();
        for e in self.errors.iter().take(25) {
            eprintln!("MISMATCH {e}");
        }
        eprintln!("{label}: compared {} values, {n} mismatches", self.compared);
        assert_eq!(n, 0, "{label}: {n} mismatches");
    }
}

// ---------------------------------------------------------------------------
// Hashes (same byte streams as gen.ts).

fn len_u32(n: usize) -> u32 {
    u32::try_from(n).expect("u32 length")
}

/// `geoHash` of gen.ts.
fn geo_hash(m: &Mesh, kind: DrawKind) -> u32 {
    let mut f = Fnv::default();
    for (i, arr) in [&m.positions, &m.normals, &m.uvs].into_iter().enumerate() {
        // line loops carry positions only; meshes always have all three
        if kind == DrawKind::LineLoop && i > 0 {
            f.u32(0xffff_ffff);
            continue;
        }
        f.u32(len_u32(arr.len()));
        for &v in arr {
            f.f32(v);
        }
    }
    match &m.indices {
        Some(idx) => {
            f.u32(1);
            f.u32(len_u32(idx.len()));
            for &i in idx {
                f.u32(i);
            }
        }
        None => f.u32(0),
    }
    f.u32(len_u32(m.groups.len()));
    for g in &m.groups {
        f.u32(g.start);
        f.u32(g.count);
        f.u32(g.material_index);
    }
    f.finish()
}

struct NodeInfo {
    t: u32,
    parent: i64,
    p: [f64; 3],
    r: [f64; 3],
    s: [f64; 3],
    w: [f64; 16],
    cs: bool,
    rs: bool,
    geo: Option<CityGeo>,
    mat: Option<usize>,
    nv: usize,
    gh: u32,
}

struct Summary {
    nodes: usize,
    meshes: usize,
    lines: usize,
    vertices: usize,
    triangles: usize,
    bbox: [f64; 6],
    materials: Vec<CityMaterial>,
    hash: u32,
    detail: Vec<NodeInfo>,
}

fn mat_hash(f: &mut Fnv, m: &CityMaterial) {
    let (t, flat, transparent, opacity, depth_write) = match *m {
        CityMaterial::Lambert { flat_shading, .. } => (1, flat_shading, false, 1.0, true),
        CityMaterial::LineBasic {
            transparent,
            opacity,
            depth_write,
            ..
        } => (2, false, transparent, opacity, depth_write),
    };
    let c = m.color();
    f.u32(t);
    f.f64(c.r);
    f.f64(c.g);
    f.f64(c.b);
    f.u32(u32::from(flat));
    f.u32(u32::from(transparent));
    f.f64(opacity);
    f.u32(u32::from(depth_write));
    f.u32(0); // side = FrontSide
}

fn summarize(m: &CityModel, root_parent: Option<&Mat4>, root_visible: bool) -> Summary {
    let world = m.world_matrices(root_parent);
    let order = m.traverse();
    let mut index = vec![-1i64; m.nodes.len()];
    let mut mats: Vec<usize> = Vec::new();
    let mut f = Fnv::default();
    let mut s = Summary {
        nodes: order.len(),
        meshes: 0,
        lines: 0,
        vertices: 0,
        triangles: 0,
        bbox: m.bounding_box(root_parent),
        materials: Vec::new(),
        hash: 0,
        detail: Vec::new(),
    };
    for (k, &id) in order.iter().enumerate() {
        index[id] = i64::try_from(k).expect("index");
        let n = &m.nodes[id];
        let parent = n.parent.map_or(-1, |p| index[p]);
        let d = drawable(m, id);
        let t = match d.map(|d| d.kind) {
            None => 1,
            Some(DrawKind::Mesh) => 2,
            Some(DrawKind::LineLoop) => 3,
        };
        f.u32(t);
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        f.u32(parent as u32);
        for v in [
            n.position.x,
            n.position.y,
            n.position.z,
            n.rotation.x,
            n.rotation.y,
            n.rotation.z,
            n.quaternion.x,
            n.quaternion.y,
            n.quaternion.z,
            n.quaternion.w,
            n.scale.x,
            n.scale.y,
            n.scale.z,
        ] {
            f.f64(v);
        }
        for v in world[id].e {
            f.f64(v);
        }
        let (cs, rs, ro) = d.map_or((false, false, 0), |d| {
            (d.cast_shadow, d.receive_shadow, d.render_order)
        });
        f.u32(u32::from(cs));
        f.u32(u32::from(rs));
        f.u32(u32::from(if id == ROOT { root_visible } else { true }));
        #[allow(clippy::cast_sign_loss)]
        f.u32(ro as u32);
        let mut info = NodeInfo {
            t,
            parent,
            p: [n.position.x, n.position.y, n.position.z],
            r: [n.rotation.x, n.rotation.y, n.rotation.z],
            s: [n.scale.x, n.scale.y, n.scale.z],
            w: world[id].e,
            cs,
            rs,
            geo: None,
            mat: None,
            nv: 0,
            gh: 0,
        };
        if let Some(d) = d {
            let g = d.geo.build();
            let gh = geo_hash(&g, d.kind);
            let mi = if let Some(i) = mats.iter().position(|&x| x == d.material) {
                i
            } else {
                mats.push(d.material);
                mats.len() - 1
            };
            f.u32(gh);
            f.u32(len_u32(mi));
            let nv = g.vertex_count();
            s.vertices += nv;
            if d.kind == DrawKind::Mesh {
                s.meshes += 1;
                s.triangles += g.triangle_count();
            } else {
                s.lines += 1;
            }
            info.geo = Some(d.geo);
            info.mat = Some(mi);
            info.nv = nv;
            info.gh = gh;
        }
        s.detail.push(info);
    }
    s.materials = mats
        .iter()
        .map(|&i| CityMaterial::of(&m.materials[i]).expect("city material class"))
        .collect();
    for mt in &s.materials {
        mat_hash(&mut f, mt);
    }
    s.hash = f.finish();
    s
}

fn compare_geo(ck: &mut Check, label: &str, rust: Option<CityGeo>, web: &Json) {
    let ty = web.get("type").str();
    let Some(g) = rust else {
        ck.eq(&format!("{label} geo kind"), "group", ty);
        return;
    };
    match (g, ty) {
        (CityGeo::Box { w, h, d }, "box") => {
            ck.eq_bits(&format!("{label} box.w"), w, web.get("w").num());
            ck.eq_bits(&format!("{label} box.h"), h, web.get("h").num());
            ck.eq_bits(&format!("{label} box.d"), d, web.get("d").num());
        }
        (CityGeo::Cylinder { rt, rb, h, radial }, "cyl") => {
            ck.eq_bits(&format!("{label} cyl.rt"), rt, web.get("rt").num());
            ck.eq_bits(&format!("{label} cyl.rb"), rb, web.get("rb").num());
            ck.eq_bits(&format!("{label} cyl.h"), h, web.get("h").num());
            ck.eq(&format!("{label} cyl.seg"), radial, web.get("seg").u32());
        }
        (CityGeo::Cone { r, h, radial }, "cone") => {
            ck.eq_bits(&format!("{label} cone.r"), r, web.get("r").num());
            ck.eq_bits(&format!("{label} cone.h"), h, web.get("h").num());
            ck.eq(&format!("{label} cone.seg"), radial, web.get("seg").u32());
        }
        (CityGeo::Circle { r, segments }, "circle") => {
            ck.eq_bits(&format!("{label} circle.r"), r, web.get("r").num());
            ck.eq(
                &format!("{label} circle.seg"),
                segments,
                web.get("seg").u32(),
            );
        }
        (CityGeo::HexWallRing { height, .. }, "extrude") => {
            ck.eq_bits(
                &format!("{label} extrude.depth"),
                height,
                web.get("depth").num(),
            );
            ck.eq(
                &format!("{label} extrude.bevel"),
                false,
                web.get("bevel").bool(),
            );
        }
        (CityGeo::HexLoop { .. }, "buffer") => {}
        (g, t) => ck.eq(&format!("{label} geo kind"), format!("{g:?}"), t.to_owned()),
    }
}

fn compare_material(ck: &mut Check, label: &str, m: &CityMaterial, web: &Json) {
    let c = m.color();
    let lin = web.get("lin").f64s();
    ck.eq_bits(&format!("{label} lin.r"), c.r, lin[0]);
    ck.eq_bits(&format!("{label} lin.g"), c.g, lin[1]);
    ck.eq_bits(&format!("{label} lin.b"), c.b, lin[2]);
    ck.eq(&format!("{label} hex"), c.to_hex(), web.get("hex").u32());
    match *m {
        CityMaterial::Lambert { flat_shading, .. } => {
            ck.eq(&format!("{label} type"), "lambert", web.get("t").str());
            ck.eq(
                &format!("{label} flat"),
                flat_shading,
                web.get("flat").bool(),
            );
            ck.eq(&format!("{label} side"), 0, web.get("side").u32());
            ck.eq(
                &format!("{label} transparent"),
                false,
                web.get("transparent").bool(),
            );
            ck.eq_bits(&format!("{label} opacity"), 1.0, web.get("opacity").num());
        }
        CityMaterial::LineBasic {
            transparent,
            opacity,
            depth_write,
            ..
        } => {
            ck.eq(&format!("{label} type"), "line", web.get("t").str());
            ck.eq(
                &format!("{label} transparent"),
                transparent,
                web.get("transparent").bool(),
            );
            ck.eq_bits(
                &format!("{label} opacity"),
                opacity,
                web.get("opacity").num(),
            );
            ck.eq(
                &format!("{label} depthWrite"),
                depth_write,
                web.get("depthWrite").bool(),
            );
        }
    }
}

/// Compares one model with its web dump.
fn compare_model(
    ck: &mut Check,
    label: &str,
    m: &CityModel,
    web: &Json,
    root_parent: Option<&Mat4>,
    root_visible: bool,
) {
    let s = summarize(m, root_parent, root_visible);
    ck.eq(
        &format!("{label} nodes"),
        s.nodes,
        web.get("nodes").u32() as usize,
    );
    ck.eq(
        &format!("{label} meshes"),
        s.meshes,
        web.get("meshes").u32() as usize,
    );
    ck.eq(
        &format!("{label} lines"),
        s.lines,
        web.get("lines").u32() as usize,
    );
    ck.eq(
        &format!("{label} vertices"),
        s.vertices,
        web.get("vertices").u32() as usize,
    );
    ck.eq(
        &format!("{label} triangles"),
        s.triangles,
        web.get("triangles").u32() as usize,
    );
    let bb = web.get("bbox").f64s();
    for (k, (&r, &w)) in s.bbox.iter().zip(bb.iter()).enumerate() {
        ck.eq_bits(&format!("{label} bbox[{k}]"), r, w);
    }
    let wm = web.get("materials").arr();
    ck.eq(&format!("{label} materials"), s.materials.len(), wm.len());
    for (k, (m, w)) in s.materials.iter().zip(wm.iter()).enumerate() {
        compare_material(ck, &format!("{label} mat[{k}]"), m, w);
    }
    ck.eq(&format!("{label} hash"), s.hash, web.get("hash").u32());
    if let Some(det) = web.opt("detail") {
        let det = det.arr();
        ck.eq(&format!("{label} detail len"), s.detail.len(), det.len());
        for (k, (n, w)) in s.detail.iter().zip(det.iter()).enumerate() {
            let l = format!("{label} node[{k}]");
            ck.eq(&format!("{l} t"), n.t, w.get("t").u32());
            ck.eq(
                &format!("{l} parent"),
                n.parent,
                i64::from(w.get("parent").i32()),
            );
            for (name, rv) in [("p", n.p), ("r", n.r), ("s", n.s)] {
                let wv = w.get(name).f64s();
                for i in 0..3 {
                    ck.eq_bits(&format!("{l} {name}[{i}]"), rv[i], wv[i]);
                }
            }
            let ww = w.get("w").f64s();
            for i in 0..16 {
                ck.eq_bits(&format!("{l} w[{i}]"), n.w[i], ww[i]);
            }
            ck.eq(&format!("{l} cs"), n.cs, w.get("cs").bool());
            ck.eq(&format!("{l} rs"), n.rs, w.get("rs").bool());
            if n.t != 1 {
                compare_geo(ck, &l, n.geo, w.get("geo"));
                ck.eq(
                    &format!("{l} mat"),
                    n.mat,
                    Some(w.get("mat").u32() as usize),
                );
                ck.eq(&format!("{l} nv"), n.nv, w.get("nv").u32() as usize);
                ck.eq(&format!("{l} gh"), n.gh, w.get("gh").u32());
            }
        }
    }
}

fn civ(s: &str) -> BronzeCiv {
    BronzeCiv::from_web_id(s).unwrap_or_else(|| panic!("civ {s}"))
}

fn poziom(j: &Json) -> Poziom {
    match j {
        Json::Str(s) if s == "male" => Poziom::Size(Rozmiar::Male),
        Json::Str(s) if s == "srednie" => Poziom::Size(Rozmiar::Srednie),
        Json::Str(s) if s == "duze" => Poziom::Size(Rozmiar::Duze),
        other => Poziom::Level(other.num()),
    }
}

fn rozmiar(s: &str) -> Rozmiar {
    match s {
        "male" => Rozmiar::Male,
        "srednie" => Rozmiar::Srednie,
        "duze" => Rozmiar::Duze,
        _ => panic!("rozmiar {s}"),
    }
}

/// Rebuilds the model of one `models.json` call.
fn build_call(call: &Json) -> CityModel {
    let f = call.get("f").str();
    match f {
        "kamien" => build_miasto_kamien(
            poziom(call.get("level")),
            MiastoKamienOpts {
                mur: call.get("mur").bool(),
                color: call.get("color").opt_u32(),
            },
        ),
        "kamien_default" => build_miasto_kamien(Poziom::Level(10.0), MiastoKamienOpts::default()),
        "palisada" => build_palisada_wal_model(rozmiar(call.get("rozmiar").str()), None),
        "braz" | "braz_grecja" | "braz_rzym" => {
            let opts = MiastoBrazOpts {
                mur: call.get("mur").bool(),
                palisada: call.get("palisada").bool(),
                color: call.get("color").opt_u32(),
            };
            let p = poziom(call.get("level"));
            match f {
                "braz" => build_miasto_braz(call.get("civ").str(), p, opts),
                "braz_grecja" => build_miasto_braz_grecja(p, opts),
                _ => build_miasto_braz_rzym(p, opts),
            }
        }
        "braz_grecja_default" => {
            build_miasto_braz_grecja(Poziom::Level(10.0), MiastoBrazOpts::default())
        }
        "braz_rzym_default" => {
            build_miasto_braz_rzym(Poziom::Level(10.0), MiastoBrazOpts::default())
        }
        "ghost_braz" => build_bronze_city_roblox(
            civ(call.get("civ").str()),
            call.get("level").num(),
            call.get("owner").u32(),
            call.get("walls").bool(),
        ),
        "ghost_braz_default_walls" => build_bronze_city_roblox(
            civ(call.get("civ").str()),
            call.get("level").num(),
            call.get("owner").u32(),
            false,
        ),
        "ghost_kamien" => build_stone_age_city_roblox(
            civ(call.get("civ").str()),
            call.get("level").num(),
            call.get("owner").u32(),
            call.get("walls").bool(),
        ),
        "ghost_kamien_default_walls" => build_stone_age_city_roblox(
            civ(call.get("civ").str()),
            call.get("level").num(),
            call.get("owner").u32(),
            false,
        ),
        "ghost_kamien_uni" => build_stone_age_city_roblox_universal(
            call.get("level").num(),
            call.get("owner").u32(),
            call.get("walls").bool(),
        ),
        "ghost_kamien_uni_default_walls" => build_stone_age_city_roblox_universal(
            call.get("level").num(),
            call.get("owner").u32(),
            false,
        ),
        "settlement" => build_settlement_model(
            call.get("era").num(),
            civ(call.get("civ").str()),
            call.get("level").num(),
            call.get("owner").u32(),
            call.get("walls").bool(),
        ),
        other => panic!("unknown call {other}"),
    }
}

fn label(call: &Json) -> String {
    call.obj_string()
}

trait ObjString {
    fn obj_string(&self) -> String;
}

impl ObjString for Json {
    fn obj_string(&self) -> String {
        match self {
            Json::Obj(kv) => kv
                .iter()
                .map(|(k, v)| format!("{k}={}", v.obj_string()))
                .collect::<Vec<_>>()
                .join(","),
            Json::Num(n) => format!("{n}"),
            Json::Str(s) => s.clone(),
            Json::Bool(b) => format!("{b}"),
            Json::Null => "null".to_owned(),
            Json::Arr(a) => format!(
                "[{}]",
                a.iter().map(Json::obj_string).collect::<Vec<_>>().join(",")
            ),
        }
    }
}

fn user_data_ok(ck: &mut Check, label: &str, m: &CityModel, web: &Json) {
    let ud = web.get("userData");
    let wm = ud
        .opt("model")
        .filter(|j| !j.is_null())
        .map(|j| j.str().to_owned());
    ck.eq(
        &format!("{label} userData.model"),
        city_user_data(m).model.map(str::to_owned),
        wm,
    );
    match (
        city_user_data(m).poziom,
        ud.opt("poziom").filter(|j| !j.is_null()),
    ) {
        (Some(r), Some(w)) => ck.eq_bits(&format!("{label} userData.poziom"), r, w.num()),
        (None, None) => {}
        (r, w) => ck.eq(
            &format!("{label} userData.poziom present"),
            r.is_some(),
            w.is_some(),
        ),
    }
    let wr = ud
        .opt("rozmiar")
        .filter(|j| !j.is_null())
        .map(|j| j.str().to_owned());
    ck.eq(
        &format!("{label} userData.rozmiar"),
        city_user_data(m).rozmiar.map(|r| r.web_id().to_owned()),
        wr,
    );
}

// ---------------------------------------------------------------------------
// Tests.

#[test]
fn city_models_match_web() {
    let data = load("models.json");
    let mut ck = Check::default();
    let mut by_family: std::collections::BTreeMap<String, usize> =
        std::collections::BTreeMap::new();
    for entry in data.get("models").arr() {
        let call = entry.get("call");
        let lab = label(call);
        let m = build_call(call);
        compare_model(&mut ck, &lab, &m, entry.get("model"), None, true);
        user_data_ok(&mut ck, &lab, &m, entry.get("model"));
        *by_family.entry(call.get("f").str().to_owned()).or_default() += 1;
    }
    eprintln!("families: {by_family:?}");
    ck.finish("city models");
}

#[test]
fn city_map_outlines_match_web() {
    let data = load("models.json");
    let mut ck = Check::default();
    for entry in data.get("outlines").arr() {
        let call = entry.get("call");
        let lab = format!("outline {}", label(call));
        let at_war = call.get("atWar");
        let at_war = !at_war.is_null() && at_war.bool();
        let (mut m, mut d) = build_city_map_outline(
            call.get("q").i32(),
            call.get("r").i32(),
            call.get("topY").num(),
            call.get("color").opt_u32(),
            at_war,
        );
        if let Some(p) = call.opt("place") {
            let p = p.f64s();
            #[allow(clippy::cast_possible_truncation)]
            place_city_map_outline(&mut m, &mut d, p[0] as i32, p[1] as i32, p[2]);
            let hex = entry.get("hex");
            ck.eq(
                &format!("{lab} hex"),
                d.hex,
                HexCoord::new(hex.get("q").i32(), hex.get("r").i32()),
            );
        }
        compare_model(&mut ck, &lab, &m, entry.get("model"), None, true);
    }
    ck.finish("city outlines");
}

#[test]
fn layout_constants_and_types_match_web() {
    let data = load("models.json");
    let mut ck = Check::default();
    let civs: Vec<&str> = data.get("bronzeCivs").arr().iter().map(Json::str).collect();
    let stone: Vec<&str> = data.get("stoneCivs").arr().iter().map(Json::str).collect();
    let labels: Vec<&str> = data
        .get("stoneCivLabels")
        .arr()
        .iter()
        .map(Json::str)
        .collect();
    ck.eq(
        "stone civs",
        STONE_CIVS.iter().map(|c| c.web_id()).collect::<Vec<_>>(),
        stone,
    );
    ck.eq(
        "bronze civs",
        STONE_CIVS.iter().map(|c| c.web_id()).collect::<Vec<_>>(),
        civs,
    );
    ck.eq(
        "stone labels",
        STONE_CIVS
            .iter()
            .map(|&c| stone_civ_label(c))
            .collect::<Vec<_>>(),
        labels,
    );
    for pair in data.get("rozmiar").arr() {
        let p = pair.arr();
        ck.eq(
            &format!("rozmiarDlaPoziomu({:?})", p[0].num()),
            rozmiar_dla_poziomu(p[0].num()).web_id(),
            p[1].str(),
        );
    }
    let kl = data.get("kamienLayout");
    let tri: Vec<u32> = kl.get("triPoziomy").arr().iter().map(Json::u32).collect();
    ck.eq("kamien triPoziomy", kamien::TRI_POZIOMY.to_vec(), tri);
    ck.eq_bits(
        "kamien cityModelScale",
        kamien::MIASTO_KAMIEN_CITY_MODEL_SCALE,
        kl.get("cityModelScale").num(),
    );
    for (rz, name) in [
        (Rozmiar::Male, "male"),
        (Rozmiar::Srednie, "srednie"),
        (Rozmiar::Duze, "duze"),
    ] {
        ck.eq_bits(
            &format!("osWalu {name}"),
            kamien::os_walu(rz),
            kl.get("osWalu").get(name).num(),
        );
    }
    let bl = data.get("brazLayout");
    let g: Vec<u32> = bl
        .get("triPoziomy")
        .get("grecja")
        .arr()
        .iter()
        .map(Json::u32)
        .collect();
    let r: Vec<u32> = bl
        .get("triPoziomy")
        .get("rzym")
        .arr()
        .iter()
        .map(Json::u32)
        .collect();
    ck.eq(
        "braz triPoziomy grecja",
        braz::TRI_POZIOMY_GRECJA.to_vec(),
        g,
    );
    ck.eq("braz triPoziomy rzym", braz::TRI_POZIOMY_RZYM.to_vec(), r);
    // The documented per-level triangle budgets are what the builders produce.
    for (i, l) in (1..=10).enumerate() {
        let lv = Poziom::Level(f64::from(l));
        ck.eq(
            &format!("kamien L{l} tris"),
            build_miasto_kamien(lv, MiastoKamienOpts::default()).triangle_count(),
            kamien::TRI_POZIOMY[i] as usize,
        );
        ck.eq(
            &format!("grecja L{l} tris"),
            build_miasto_braz_grecja(lv, MiastoBrazOpts::default()).triangle_count(),
            braz::TRI_POZIOMY_GRECJA[i] as usize,
        );
        ck.eq(
            &format!("rzym L{l} tris"),
            build_miasto_braz_rzym(lv, MiastoBrazOpts::default()).triangle_count(),
            braz::TRI_POZIOMY_RZYM[i] as usize,
        );
    }
    ck.finish("layout");
}

// ---------------------------------------------------------------------------
// CityRenderer scenario.

fn web_city(j: &Json) -> City {
    City {
        id: j.get("id").str().to_owned(),
        owner_id: j.get("ownerId").i32(),
        q: j.get("q").i32(),
        r: j.get("r").i32(),
        population: j.get("population").num(),
    }
}

fn idx8<T: Copy>(a: &[T; 8], o: i32) -> T {
    a[usize::try_from(o % 8).expect("non-negative owner")]
}

#[allow(clippy::too_many_lines)]
fn with_options<R>(name: &str, f: impl FnOnce(&CityRenderOptions<'_>) -> R) -> R {
    use CityMapOutlineKind as K;
    let era_full = |o: i32| idx8(&[1.0, 2.0, 3.0, 1.0, 2.0, 2.0, 1.0, 4.0], o);
    let civ_full = |o: i32| {
        idx8(
            &[
                BronzeCiv::Grecja,
                BronzeCiv::Rzym,
                BronzeCiv::Egipt,
                BronzeCiv::Zulu,
                BronzeCiv::Rzym,
                BronzeCiv::Chiny,
                BronzeCiv::Grecja,
                BronzeCiv::Hetyci,
            ],
            o,
        )
    };
    #[allow(clippy::cast_precision_loss)]
    let level_full = |id: &str| ((id.len() * 3) % 11) as f64;
    let wall_kind_full = |id: &str| {
        let last = u32::from(*id.as_bytes().last().expect("id"));
        [
            CityWallKind::None,
            CityWallKind::Stone,
            CityWallKind::Palisada,
        ][(last % 3) as usize]
    };
    let vis_full = |c: &City| (c.q + c.r) % 3 != 0;
    let outline_full = |o: i32| {
        [
            Some(K::Player),
            Some(K::War),
            Some(K::Neutral),
            None,
            Some(K::Ally),
        ][(o % 5) as usize]
    };
    let walls_a = |id: &str| id.ends_with('a');
    let era_cf = |o: i32| 1.0 + f64::from(o % 2);
    #[allow(clippy::cast_sign_loss)]
    let color_cf = |o: i32| 0x0010_2030 + (o as u32) * 0x0001_0101;
    let outline_cf = |o: i32| Some(if o % 2 == 0 { K::War } else { K::Neutral });
    let walls_cf = |id: &str| id.len().is_multiple_of(2);
    let outline_swap =
        |o: i32| [Some(K::Neutral), None, Some(K::War), Some(K::Player)][(o % 4) as usize];
    let o = match name {
        "full" => CityRenderOptions {
            get_era: Some(&era_full),
            get_civ: Some(&civ_full),
            get_level: Some(&level_full),
            get_wall_kind: Some(&wall_kind_full),
            is_visible: Some(&vis_full),
            get_map_outline_kind: Some(&outline_full),
            ..CityRenderOptions::default()
        },
        "walls_only" => CityRenderOptions {
            get_walls: Some(&walls_a),
            ..CityRenderOptions::default()
        },
        "defaults" => CityRenderOptions::default(),
        "color_fn" => CityRenderOptions {
            get_era: Some(&era_cf),
            owner_color_fn: Some(&color_cf),
            get_map_outline_kind: Some(&outline_cf),
            get_walls: Some(&walls_cf),
            ..CityRenderOptions::default()
        },
        "outline_swap" => CityRenderOptions {
            get_map_outline_kind: Some(&outline_swap),
            ..CityRenderOptions::default()
        },
        other => panic!("options {other}"),
    };
    f(&o)
}

fn compare_scene(ck: &mut Check, step: &str, cr: &CityRenderer, web: &[Json]) {
    let scene = cr.scene();
    ck.eq(&format!("{step} children"), scene.len(), web.len());
    for (k, (ob, w)) in scene.iter().zip(web.iter()).enumerate() {
        let l = format!("{step} child[{k}]");
        let kind = w.get("kind").str();
        match ob {
            SceneObject::City(c) => {
                ck.eq(&format!("{l} kind"), "city", kind);
                if kind != "city" {
                    continue;
                }
                ck.eq(
                    &format!("{l} cityId"),
                    c.city_id.as_str(),
                    w.get("cityId").str(),
                );
                ck.eq(
                    &format!("{l} visualKey"),
                    c.visual_key.as_str(),
                    w.get("visualKey").str(),
                );
                ck.eq(&format!("{l} ownerId"), c.owner_id, w.get("ownerId").i32());
                ck.eq(&format!("{l} q"), c.q, w.get("q").i32());
                ck.eq(&format!("{l} r"), c.r, w.get("r").i32());
                ck.eq(&format!("{l} visible"), c.visible, w.get("visible").bool());
                let n = &c.model.nodes[ROOT];
                let p = w.get("p").f64s();
                let s = w.get("s").f64s();
                for (i, (&rv, &sv)) in [n.position.x, n.position.y, n.position.z]
                    .iter()
                    .zip([n.scale.x, n.scale.y, n.scale.z].iter())
                    .enumerate()
                {
                    ck.eq_bits(&format!("{l} p[{i}]"), rv, p[i]);
                    ck.eq_bits(&format!("{l} s[{i}]"), sv, s[i]);
                }
                compare_model(
                    ck,
                    &l,
                    &c.model,
                    w.get("model"),
                    Some(&Mat4::IDENTITY),
                    c.visible,
                );
            }
            SceneObject::Outline(o) => {
                ck.eq(&format!("{l} kind"), "outline", kind);
                if kind != "outline" {
                    continue;
                }
                ck.eq(
                    &format!("{l} cityId"),
                    o.city_id.as_str(),
                    w.get("cityId").str(),
                );
                ck.eq(
                    &format!("{l} civColor"),
                    o.data.civ_color,
                    w.get("civColor").opt_u32(),
                );
                ck.eq(&format!("{l} atWar"), o.data.at_war, w.get("atWar").bool());
                let hex = w.get("hex");
                ck.eq(
                    &format!("{l} hex"),
                    o.data.hex,
                    HexCoord::new(hex.get("q").i32(), hex.get("r").i32()),
                );
                ck.eq(&format!("{l} visible"), o.visible, w.get("visible").bool());
                compare_model(
                    ck,
                    &l,
                    &o.model,
                    w.get("model"),
                    Some(&Mat4::IDENTITY),
                    o.visible,
                );
            }
        }
    }
}

fn renderer_hexes(data: &Json) -> Vec<(HexCoord, Terrain)> {
    data.get("hexes")
        .arr()
        .iter()
        .map(|h| {
            let a = h.arr();
            (
                HexCoord::new(a[0].i32(), a[1].i32()),
                Terrain::from_web_id(a[2].str()).expect("terrain"),
            )
        })
        .collect()
}

#[test]
fn city_renderer_matches_web() {
    let data = load("renderer.json");
    let mut cr = CityRenderer::new(renderer_hexes(&data));
    let mut ck = Check::default();
    for (si, step) in data.get("steps").arr().iter().enumerate() {
        let op = step.get("op").str();
        let lab = format!("step{si} {op}");
        match op {
            "sync" | "outlines" => {
                let cities: Vec<City> = step.get("cities").arr().iter().map(web_city).collect();
                with_options(step.get("options").str(), |o| {
                    if op == "sync" {
                        cr.sync(&cities, o);
                    } else {
                        cr.sync_map_outlines(&cities, o);
                    }
                });
            }
            "fog" => {
                let vis: HashSet<String> = step
                    .get("vis")
                    .arr()
                    .iter()
                    .map(|j| j.str().to_owned())
                    .collect();
                let player = step.get("player");
                let player = if player.is_null() { 0 } else { player.i32() };
                cr.apply_fog_visibility(&vis, step.get("fogOn").bool(), player);
            }
            "dispose" => cr.dispose(),
            other => panic!("op {other}"),
        }
        compare_scene(&mut ck, &lab, &cr, step.get("after").arr());
    }
    ck.finish("city renderer");
}

#[test]
fn legacy_city_model_matches_web() {
    let data = load("renderer.json");
    let hexes = renderer_hexes(&data);
    let top = hexes
        .iter()
        .find(|(h, _)| *h == HexCoord::new(0, 0))
        .map_or(0.0, |&(_, t)| terrain_top_y(t));
    let mut ck = Check::default();
    for entry in data.get("legacy").arr() {
        let col = entry.get("color").u32();
        let mut m = build_legacy_city_model(Some(col));
        let (x, z) = axial_to_world(HexCoord::new(0, 0), HEX_R);
        m.set_pos(
            ROOT,
            x,
            top + civ_renderer::models::cities::renderer::CITY_LIFT,
            z,
        );
        m.set_scale_scalar(
            ROOT,
            civ_renderer::models::cities::renderer::CITY_MODEL_SCALE,
        );
        let p = entry.get("p").f64s();
        let n = &m.nodes[ROOT];
        ck.eq_bits("legacy p.x", n.position.x, p[0]);
        ck.eq_bits("legacy p.y", n.position.y, p[1]);
        ck.eq_bits("legacy p.z", n.position.z, p[2]);
        compare_model(
            &mut ck,
            &format!("legacy {col:#x}"),
            &m,
            entry.get("model"),
            Some(&Mat4::IDENTITY),
            true,
        );
    }
    ck.finish("legacy");
}
