//! MOD-03 terrain-decor tests (R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1): the
//! Rust `decor` port against data produced by the **web** code (`edb8fb56`,
//! modules imported unchanged, three@0.169.0), see
//! `tests/fixtures/decor/README.md` and
//! `dyspozycje/rust-port/p4/P4-17-MOD03-TERRAIN-DECOR.md`.
//!
//! Every scalar is compared bit for bit (`to_bits`): `Float32` attributes of
//! the 34 shared geometries (positions, normals, colours), node transforms,
//! world matrices, bounding boxes, linear material colours, hash results,
//! relief heights, river indices. Geometries of primitive meshes (box,
//! cylinder, cone, icosahedron) are compared by counts and an FNV-1a hash of
//! their `Float32` attributes, indices and groups.

#![allow(clippy::float_cmp)]

use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::Arc;

// P4.27: the scene types live in `civ_renderer::scene` (forced type adjustment).
use civ_renderer::decor::desert::{
    build_dekor_pustynia, build_oaza, dekor_pustyni_dla_heksa, dekor_pustynia_geometria,
    dekor_pustynia_material, rotacja_dekoru_pustyni, rotacja_oazy, trojkaty_dekoru_pustyni,
};
use civ_renderer::decor::forest::{
    build_las, las_geometria, las_material, rotacja_lasu_dla_heksa, trojkaty_lasu,
    wariant_lasu_dla_heksa,
};
use civ_renderer::decor::js::{bounding_box, world_matrices};
use civ_renderer::decor::jungle::{
    djungla_geometria, djungla_material, rotacja_djungli_dla_heksa, wariant_djungli_dla_heksa,
};
use civ_renderer::decor::meadow::{
    build_dekor_laka, build_dekor_rownina, dekor_dla_heksa, dekor_laka_geometria, dekor_material,
    dekor_rownina_geometria, rotacja_dekoru, trojkaty_dekoru, DekorTyp,
};
use civ_renderer::decor::relief::{
    build_gora, build_wzgorze, gora_geometria, powierzchnia_reliefu_y, rotacja_dla_heksa,
    teren_material, trojkaty_wariantu, wariant_dla_heksa, wariant_dla_heksa_salt,
    wzgorze_geometria, ReliefKind,
};
use civ_renderer::decor::river_lod::{
    apply_river_lod_visibility, apply_river_visibility, build_merged_river_fog_index,
    build_merged_river_full_index, build_river_ribbon_fog_index, build_river_ribbon_full_index,
    compute_merged_river_fog_sig, compute_river_fog_sig, create_river_bucket, flush_river_bucket,
    merge_river_buckets, merged_river_visible_in_fog, needs_river_ribbon_index_update,
    queue_river_geo, rivers_visible_at_lod, KeySet, RiverBucketMesh, RIVER_FOG_SIG_OFF,
    RIVER_LOD_HIDE_FROM_LEVEL, RIVER_LOD_MARKER,
};
use civ_renderer::decor::style::{
    build_gallery_building_pad, build_gallery_fort_mount, build_style_beach_ring,
    build_style_coast_sand_edges, build_style_coast_sand_top_cap, build_style_coast_water_cap,
    build_style_dune, build_style_forest_cluster, build_style_hill_bump,
    build_style_land_coast_sand_cap, build_style_mountain_peak, build_style_oasis,
    build_style_tarasy_terrace, forest_tree_count_for_hex, is_warm_jungle_forest_hex,
    jungle_forest_tree_count_for_hex, CoastSandParams, CoastWaterOpts, ForestParams, ReliefParams,
    ReliefSampler,
};
use civ_renderer::decor::terraces::{
    build_tarasy, tarasy_geometria, tarasy_material, tarasy_wariant_dla_heksa, trojkaty_tarasow,
    TarasyWariant,
};
use civ_renderer::decor::{lambert, DecorObject};
use civ_renderer::geom::{box_geometry, cylinder_geometry, plane_geometry, EulerOrder};
use civ_renderer::pick::hex::HexCoord;
use civ_renderer::pick::terrain::Terrain;
use civ_renderer::scene::{Geometry, Material, NodeKind, Scene};
use civ_renderer::terrain::coast::{river_delta_hexes, river_mouth_edges, TerrainAt};
use civ_renderer::terrain::{RiverKind, RiverPath};

// ---------------------------------------------------------------------------
// Minimal JSON reader (the crate has no dependencies; fixtures are trusted
// files produced by the reference script). Same reader as
// tests/wonders_web_parity.rs, plus the "Infinity"/"-Infinity"/"NaN" strings
// the generator writes for non-finite numbers (empty Box3).

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
            Json::Str(s) if s == "Infinity" => f64::INFINITY,
            Json::Str(s) if s == "-Infinity" => f64::NEG_INFINITY,
            Json::Str(s) if s == "NaN" => f64::NAN,
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
    fn usize(&self) -> usize {
        usize::try_from(self.i64()).expect("usize")
    }
    fn u32s(&self) -> Vec<u32> {
        self.arr().iter().map(Json::u32).collect()
    }
    fn strs(&self) -> Vec<String> {
        self.arr().iter().map(|s| s.str().to_owned()).collect()
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
        let mut out = Vec::new();
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
        "decor",
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
    diffs: Vec<String>,
}

impl Cmp {
    fn f(&mut self, ctx: &str, rust: f64, web: f64) {
        self.scalars += 1;
        if rust.to_bits() != web.to_bits() && !(rust.is_nan() && web.is_nan()) {
            if self.diffs.len() < 40 {
                self.diffs.push(format!("{ctx}: rust={rust:e} web={web:e}"));
            } else {
                self.diffs.push(String::new());
            }
        }
    }
    fn eq<T: PartialEq + std::fmt::Debug>(&mut self, ctx: &str, rust: T, web: T) {
        self.scalars += 1;
        if rust != web {
            if self.diffs.len() < 40 {
                self.diffs.push(format!("{ctx}: rust={rust:?} web={web:?}"));
            } else {
                self.diffs.push(String::new());
            }
        }
    }
    fn bits32(&mut self, ctx: &str, rust: &[f32], web: &[u32]) {
        self.eq(&format!("{ctx}.len"), rust.len(), web.len());
        for (i, (r, w)) in rust.iter().zip(web).enumerate() {
            self.scalars += 1;
            if r.to_bits() != *w {
                if self.diffs.len() < 40 {
                    self.diffs.push(format!(
                        "{ctx}[{i}]: rust={r:e} web={:e}",
                        f32::from_bits(*w)
                    ));
                } else {
                    self.diffs.push(String::new());
                }
            }
        }
    }
    fn finish(self, what: &str) {
        println!(
            "{what}: scalars={} bit_diff={}",
            self.scalars,
            self.diffs.len()
        );
        assert!(
            self.diffs.is_empty(),
            "{what}: {} differences, first: {:#?}",
            self.diffs.len(),
            &self.diffs[..self.diffs.len().min(40)]
        );
    }
}

/// FNV-1a 32 over `position`, `normal`, `uv`, `color` (each if present),
/// index, groups — same order as `fnvGeometry` of `gen.ts`.
fn fnv_geometry(g: &Geometry) -> u32 {
    let mut h: u32 = 0x811c_9dc5;
    let mut feed = |u: u32| {
        for k in 0..4 {
            h ^= (u >> (8 * k)) & 0xff;
            h = h.wrapping_mul(0x0100_0193);
        }
    };
    let m = &g.mesh;
    for a in [&m.positions, &m.normals, &m.uvs] {
        for v in a.iter() {
            feed(v.to_bits());
        }
    }
    if let Some(c) = &g.colors {
        for v in c {
            feed(v.to_bits());
        }
    }
    if let Some(idx) = &m.indices {
        for &i in idx {
            feed(i);
        }
    }
    for gr in &m.groups {
        feed(gr.start);
        feed(gr.count);
        feed(gr.material_index);
    }
    h
}

fn attrs(g: &Geometry) -> Vec<String> {
    let mut v = vec!["position".to_owned()];
    if !g.mesh.normals.is_empty() {
        v.push("normal".to_owned());
    }
    if !g.mesh.uvs.is_empty() {
        v.push("uv".to_owned());
    }
    if g.colors.is_some() {
        v.push("color".to_owned());
    }
    v
}

fn cmp_geo_summary(c: &mut Cmp, ctx: &str, g: &Geometry, w: &Json) {
    c.eq(
        &format!("{ctx}.v"),
        g.mesh.vertex_count(),
        w.get("v").usize(),
    );
    let wi = w.get("i");
    c.eq(
        &format!("{ctx}.i"),
        g.mesh.indices.as_ref().map(Vec::len),
        if wi.is_null() { None } else { Some(wi.usize()) },
    );
    c.eq(&format!("{ctx}.attrs"), attrs(g), w.get("attrs").strs());
    c.eq(
        &format!("{ctx}.groups"),
        g.mesh.groups.len(),
        w.get("groups").usize(),
    );
    c.eq(&format!("{ctx}.hash"), fnv_geometry(g), w.get("hash").u32());
}

fn cmp_material(c: &mut Cmp, ctx: &str, m: &Material, w: &Json) {
    let col = m.color.expect("lambert has colour");
    c.eq(&format!("{ctx}.type"), "lambert", w.get("type").str());
    c.eq(&format!("{ctx}.hex"), col.to_hex(), w.get("hex").u32());
    let lin = w.get("lin").f64s();
    c.f(&format!("{ctx}.r"), col.r, lin[0]);
    c.f(&format!("{ctx}.g"), col.g, lin[1]);
    c.f(&format!("{ctx}.b"), col.b, lin[2]);
    c.eq(&format!("{ctx}.flat"), m.flat_shading, w.get("flat").bool());
    c.eq(&format!("{ctx}.vc"), m.vertex_colors, w.get("vc").bool());
}

fn order_str(o: EulerOrder) -> &'static str {
    match o {
        EulerOrder::Xyz => "XYZ",
        EulerOrder::Yxz => "YXZ",
        EulerOrder::Zxy => "ZXY",
        EulerOrder::Zyx => "ZYX",
        EulerOrder::Yzx => "YZX",
        EulerOrder::Xzy => "XZY",
    }
}

/// Compares a Rust [`DecorObject`] with a `dumpObject` record.
fn cmp_object(c: &mut Cmp, ctx: &str, obj: Option<&DecorObject>, w: &Json) {
    let Some(obj) = obj else {
        c.eq(&format!("{ctx}.null"), true, w.is_null());
        return;
    };
    if w.is_null() {
        c.eq(&format!("{ctx}.null"), false, true);
        return;
    }
    // P4.27: pre-order walk of the arena (`traverse_with_parent`) instead of
    // the recursive `SceneNode` walk; `name` / `renderOrder` are node fields
    // (forced type adjustment, same assertions).
    let flat: Vec<(&civ_renderer::scene::Node, i64)> = obj
        .traverse_with_parent()
        .into_iter()
        .map(|(id, p)| {
            (
                &obj.nodes[id],
                p.map_or(-1, |p| i64::try_from(p).expect("index")),
            )
        })
        .collect();
    let worlds = world_matrices(obj);
    let nodes = w.get("nodes").arr();
    c.eq(&format!("{ctx}.nodes"), flat.len(), nodes.len());
    c.eq(&format!("{ctx}.meta"), obj.node_count(), flat.len());
    for (i, ((n, parent), wn)) in flat.iter().zip(nodes).enumerate() {
        let k = format!("{ctx}#{i}");
        let ty = match &n.kind {
            NodeKind::Mesh(_) => "Mesh",
            NodeKind::Group => "Group",
            NodeKind::Object3D => "Object3D",
            NodeKind::Sprite(_) => "Sprite",
            NodeKind::LineLoop(_) => "LineLoop",
        };
        c.eq(&format!("{k}.type"), ty, wn.get("type").str());
        c.eq(&format!("{k}.parent"), *parent, wn.get("parent").i64());
        c.eq(&format!("{k}.name"), n.name.as_str(), wn.get("name").str());
        c.eq(
            &format!("{k}.ro"),
            i64::from(n.render_order),
            wn.get("ro").i64(),
        );
        let p = wn.get("pos").f64s();
        c.f(&format!("{k}.px"), n.position.x, p[0]);
        c.f(&format!("{k}.py"), n.position.y, p[1]);
        c.f(&format!("{k}.pz"), n.position.z, p[2]);
        let r = wn.get("rot").arr();
        c.f(&format!("{k}.rx"), n.rotation.x, r[0].num());
        c.f(&format!("{k}.ry"), n.rotation.y, r[1].num());
        c.f(&format!("{k}.rz"), n.rotation.z, r[2].num());
        c.eq(
            &format!("{k}.order"),
            order_str(n.rotation.order),
            r[3].str(),
        );
        let s = wn.get("scale").f64s();
        c.f(&format!("{k}.sx"), n.scale.x, s[0]);
        c.f(&format!("{k}.sy"), n.scale.y, s[1]);
        c.f(&format!("{k}.sz"), n.scale.z, s[2]);
        c.eq(&format!("{k}.cast"), n.cast_shadow, wn.get("cast").bool());
        c.eq(
            &format!("{k}.recv"),
            n.receive_shadow,
            wn.get("recv").bool(),
        );
        let mw = wn.get("mw").f64s();
        for (j, (a, b)) in worlds[i].e.iter().zip(&mw).enumerate() {
            c.f(&format!("{k}.mw[{j}]"), *a, *b);
        }
        if let NodeKind::Mesh(md) = &n.kind {
            c.eq(&format!("{k}.matArray"), md.material_array, false);
            cmp_material(
                c,
                &format!("{k}.mat"),
                &obj.materials[md.material()],
                wn.get("mat"),
            );
            let geometry: Geometry = match md.geo.buffer() {
                Some(g) => Geometry::clone(g),
                None => md.geo.build().into(),
            };
            cmp_geo_summary(c, &format!("{k}.geo"), &geometry, wn.get("geo"));
        }
    }
    let b = bounding_box(obj);
    let wb = w.get("box").f64s();
    for (j, (a, e)) in [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z]
        .iter()
        .zip(&wb)
        .enumerate()
    {
        c.f(&format!("{ctx}.box[{j}]"), *a, *e);
    }
}

fn terrain(id: &str) -> Terrain {
    Terrain::from_web_id(id).unwrap_or_else(|| panic!("terrain {id}"))
}

// ---------------------------------------------------------------------------
// 1. The 34 shared geometries.

#[test]
fn shared_geometries_are_bit_identical_to_web() {
    let d = load("geometries.json");
    let mut c = Cmp::default();
    let mut tri_total = 0;
    for g in d.get("geometries").arr() {
        let name = g.get("name").str();
        let (kind, w) = name.split_at(name.len() - 1);
        let w: i32 = w.parse().expect("variant digit");
        let geo: Arc<Geometry> = match kind {
            "las" => las_geometria(w),
            "djungla" => djungla_geometria(w),
            "wzgorze" => wzgorze_geometria(w),
            "gora" => gora_geometria(w),
            "laka" => dekor_laka_geometria(w),
            "rownina" => dekor_rownina_geometria(w),
            "pustynia" => dekor_pustynia_geometria(w),
            "tarasy" => tarasy_geometria(if w == 0 {
                TarasyWariant::W0
            } else {
                TarasyWariant::W3
            }),
            other => panic!("unknown geometry {other}"),
        };
        c.eq(
            &format!("{name}.v"),
            geo.mesh.vertex_count(),
            g.get("v").usize(),
        );
        c.bits32(
            &format!("{name}.pos"),
            &geo.mesh.positions,
            &g.get("pos").u32s(),
        );
        c.bits32(
            &format!("{name}.nor"),
            &geo.mesh.normals,
            &g.get("nor").u32s(),
        );
        c.bits32(
            &format!("{name}.col"),
            geo.colors.as_deref().expect("vertex colours"),
            &g.get("col").u32s(),
        );
        c.eq(
            &format!("{name}.hash"),
            fnv_geometry(&geo),
            g.get("hash").u32(),
        );
        c.eq(&format!("{name}.uv"), geo.mesh.uvs.len(), 0);
        c.eq(&format!("{name}.idx"), geo.mesh.indices.is_none(), true);
        tri_total += geo.mesh.triangle_count();
    }
    c.eq("geometry count", d.get("geometries").arr().len(), 34);

    // variant wrap ((w | 0) % n + n) % n: same shared instance
    let wrap = d.get("wrap");
    let ws: Vec<i32> = wrap.get("w").arr().iter().map(Json::i32).collect();
    type GeoFn = fn(i32) -> Arc<Geometry>;
    let fams: [(&str, GeoFn, i32); 7] = [
        ("las", las_geometria, 5),
        ("djungla", djungla_geometria, 5),
        ("wzgorze", wzgorze_geometria, 5),
        ("gora", gora_geometria, 5),
        ("laka", dekor_laka_geometria, 4),
        ("rownina", dekor_rownina_geometria, 4),
        ("pustynia", dekor_pustynia_geometria, 4),
    ];
    for (fam, f, n) in fams {
        let web: Vec<i64> = wrap.get(fam).arr().iter().map(Json::i64).collect();
        for (w, e) in ws.iter().zip(web) {
            let g = f(*w);
            let k = (0..n)
                .find(|&k| Arc::ptr_eq(&f(k), &g))
                .map_or(-1, i64::from);
            c.eq(&format!("wrap.{fam}({w})"), k, e);
        }
    }
    let tri = d.get("tri");
    for (i, w) in ws.iter().enumerate() {
        c.eq(
            "tri.las",
            trojkaty_lasu(*w),
            tri.get("las").arr()[i].usize(),
        );
        c.eq(
            "tri.wzgorze",
            trojkaty_wariantu(ReliefKind::Wzgorze, *w),
            tri.get("wzgorze").arr()[i].usize(),
        );
        c.eq(
            "tri.gora",
            trojkaty_wariantu(ReliefKind::Gora, *w),
            tri.get("gora").arr()[i].usize(),
        );
        c.eq(
            "tri.laka",
            trojkaty_dekoru(DekorTyp::Laka, *w),
            tri.get("laka").arr()[i].usize(),
        );
        c.eq(
            "tri.rownina",
            trojkaty_dekoru(DekorTyp::Rownina, *w),
            tri.get("rownina").arr()[i].usize(),
        );
        c.eq(
            "tri.pustynia",
            trojkaty_dekoru_pustyni(*w),
            tri.get("pustynia").arr()[i].usize(),
        );
    }
    let tt = tri.get("tarasy").arr();
    c.eq(
        "tri.tarasy0",
        trojkaty_tarasow(TarasyWariant::W0),
        tt[0].usize(),
    );
    c.eq(
        "tri.tarasy3",
        trojkaty_tarasow(TarasyWariant::W3),
        tt[1].usize(),
    );

    let mats = d.get("materials");
    cmp_material(&mut c, "LAS_MATERIAL", &las_material(), mats.get("las"));
    cmp_material(
        &mut c,
        "DJUNGLA_MATERIAL",
        &djungla_material(),
        mats.get("djungla"),
    );
    cmp_material(
        &mut c,
        "TEREN_MATERIAL",
        &teren_material(),
        mats.get("teren"),
    );
    cmp_material(
        &mut c,
        "DEKOR_MATERIAL",
        &dekor_material(),
        mats.get("dekor"),
    );
    cmp_material(
        &mut c,
        "DEKOR_PUSTYNIA_MATERIAL",
        &dekor_pustynia_material(),
        mats.get("pustynia"),
    );
    cmp_material(
        &mut c,
        "TARASY_MATERIAL",
        &tarasy_material(),
        mats.get("tarasy"),
    );

    let k = d.get("constants");
    use civ_renderer::decor::{
        desert as dz, forest as fo, jungle as ju, meadow as me, relief as re,
    };
    c.f("LAS_MAX_Y", fo::LAS_MAX_Y, k.get("LAS_MAX_Y").num());
    c.f(
        "LAS_FOOTPRINT_R",
        fo::LAS_FOOTPRINT_R,
        k.get("LAS_FOOTPRINT_R").num(),
    );
    c.eq(
        "LICZBA_WARIANTOW_LASU",
        fo::LICZBA_WARIANTOW_LASU,
        k.get("LICZBA_WARIANTOW_LASU").usize(),
    );
    c.eq(
        "SOL_WARIANT_LASU",
        fo::SOL_WARIANT_LASU,
        k.get("SOL_WARIANT_LASU").i32(),
    );
    c.eq(
        "SOL_ROTACJA_LASU",
        fo::SOL_ROTACJA_LASU,
        k.get("SOL_ROTACJA_LASU").i32(),
    );
    c.eq(
        "LICZBA_WARIANTOW_DJUNGLI",
        ju::LICZBA_WARIANTOW_DJUNGLI,
        k.get("LICZBA_WARIANTOW_DJUNGLI").usize(),
    );
    c.eq(
        "SOL_WARIANT_DJUNGLI",
        ju::SOL_WARIANT_DJUNGLI,
        k.get("SOL_WARIANT_DJUNGLI").i32(),
    );
    c.eq(
        "SOL_ROTACJA_DJUNGLI",
        ju::SOL_ROTACJA_DJUNGLI,
        k.get("SOL_ROTACJA_DJUNGLI").i32(),
    );
    c.eq(
        "LICZBA_WARIANTOW_TERENU",
        // reused from P4.10, not redefined in `decor` (round 2)
        civ_renderer::pick::terrain::TERRAIN_SOLID_VARIANTS,
        k.get("LICZBA_WARIANTOW_TERENU").usize(),
    );
    c.f(
        "WZGORZE_SZCZYT_Y",
        // reused from P4.12 `core::map_style`, not redefined in `decor`
        civ_renderer::core::map_style::WZGORZE_SZCZYT_Y,
        k.get("WZGORZE_SZCZYT_Y").num(),
    );
    for (i, v) in k.get("GORA_APEX_Y").f64s().iter().enumerate() {
        c.f(
            "GORA_APEX_Y",
            civ_renderer::core::map_style::GORA_APEX_Y[i],
            *v,
        );
    }
    c.f(
        "WZGORZE_FOOTPRINT_R",
        re::WZGORZE_FOOTPRINT_R,
        k.get("WZGORZE_FOOTPRINT_R").num(),
    );
    c.f(
        "GORA_FOOTPRINT_R",
        re::GORA_FOOTPRINT_R,
        k.get("GORA_FOOTPRINT_R").num(),
    );
    c.eq(
        "DEKOR_LICZBA_WARIANTOW",
        me::DEKOR_LICZBA_WARIANTOW,
        k.get("DEKOR_LICZBA_WARIANTOW").usize(),
    );
    c.f(
        "DEKOR_UDZIAL_PUSTYCH",
        me::DEKOR_UDZIAL_PUSTYCH,
        k.get("DEKOR_UDZIAL_PUSTYCH").num(),
    );
    c.f(
        "DEKOR_MAX_WYSOKOSC",
        me::DEKOR_MAX_WYSOKOSC,
        k.get("DEKOR_MAX_WYSOKOSC").num(),
    );
    c.f(
        "DEKOR_FOOTPRINT_R",
        me::DEKOR_FOOTPRINT_R,
        k.get("DEKOR_FOOTPRINT_R").num(),
    );
    c.eq(
        "DEKOR_LOD_MAX_POZIOM",
        i64::from(me::DEKOR_LOD_MAX_POZIOM),
        k.get("DEKOR_LOD_MAX_POZIOM").i64(),
    );
    c.eq(
        "DEKOR_PUSTYNIA_LICZBA_WARIANTOW",
        dz::DEKOR_PUSTYNIA_LICZBA_WARIANTOW,
        k.get("DEKOR_PUSTYNIA_LICZBA_WARIANTOW").usize(),
    );
    c.f(
        "DEKOR_PUSTYNIA_UDZIAL_PUSTYCH",
        dz::DEKOR_PUSTYNIA_UDZIAL_PUSTYCH,
        k.get("DEKOR_PUSTYNIA_UDZIAL_PUSTYCH").num(),
    );
    c.f(
        "DEKOR_PUSTYNIA_MAX_WYSOKOSC",
        dz::DEKOR_PUSTYNIA_MAX_WYSOKOSC,
        k.get("DEKOR_PUSTYNIA_MAX_WYSOKOSC").num(),
    );
    c.f(
        "DEKOR_PUSTYNIA_FOOTPRINT_R",
        dz::DEKOR_PUSTYNIA_FOOTPRINT_R,
        k.get("DEKOR_PUSTYNIA_FOOTPRINT_R").num(),
    );
    c.eq(
        "DEKOR_PUSTYNIA_LOD_MAX_POZIOM",
        i64::from(dz::DEKOR_PUSTYNIA_LOD_MAX_POZIOM),
        k.get("DEKOR_PUSTYNIA_LOD_MAX_POZIOM").i64(),
    );
    c.eq(
        "SALT_PUSTYNIA_OBECNOSC",
        dz::SALT_PUSTYNIA_OBECNOSC,
        k.get("SALT_PUSTYNIA_OBECNOSC").i32(),
    );
    c.eq(
        "SALT_PUSTYNIA_WARIANT",
        dz::SALT_PUSTYNIA_WARIANT,
        k.get("SALT_PUSTYNIA_WARIANT").i32(),
    );
    c.eq(
        "SALT_PUSTYNIA_ROTACJA",
        dz::SALT_PUSTYNIA_ROTACJA,
        k.get("SALT_PUSTYNIA_ROTACJA").i32(),
    );
    c.eq(
        "SALT_OAZA_ROTACJA",
        dz::SALT_OAZA_ROTACJA,
        k.get("SALT_OAZA_ROTACJA").i32(),
    );
    c.eq(
        "RIVER_LOD_MARKER",
        RIVER_LOD_MARKER,
        k.get("RIVER_LOD_MARKER").str(),
    );
    c.f(
        "RIVER_LOD_HIDE_FROM_LEVEL",
        RIVER_LOD_HIDE_FROM_LEVEL,
        k.get("RIVER_LOD_HIDE_FROM_LEVEL").num(),
    );
    c.eq(
        "RIVER_FOG_SIG_OFF",
        RIVER_FOG_SIG_OFF,
        k.get("RIVER_FOG_SIG_OFF").i32(),
    );
    println!("geometries: 34 variants, {tri_total} triangles");
    c.finish("geometries");
}

// ---------------------------------------------------------------------------
// 2. Per-hex variant / rotation hashes.

#[allow(clippy::cast_precision_loss)]
fn hash_fn(name: &str, q: i32, r: i32, s: i32) -> Option<f64> {
    let u = |v: usize| v as f64;
    Some(match name {
        "wariantLasu" => u(wariant_lasu_dla_heksa(q, r, 5, s)),
        "rotacjaLasu" => rotacja_lasu_dla_heksa(q, r, s),
        "wariantDjungli" => u(wariant_djungli_dla_heksa(q, r, 5, s)),
        "rotacjaDjungli" => rotacja_djungli_dla_heksa(q, r, s),
        "wariantTerenu" => u(wariant_dla_heksa(q, r, 5, s)),
        "wariantTerenuSalt77" => u(wariant_dla_heksa_salt(q, r, 5, s, 77)),
        "rotacjaTerenu" => rotacja_dla_heksa(q, r, s),
        "dekor" => u(dekor_dla_heksa(q, r, s)?),
        "rotacjaDekoru" => rotacja_dekoru(q, r, s),
        "dekorPustyni" => u(dekor_pustyni_dla_heksa(q, r, s)?),
        "rotacjaPustyni" => rotacja_dekoru_pustyni(q, r, s),
        "rotacjaOazy" => rotacja_oazy(q, r, s),
        "tarasyWariant" => f64::from(tarasy_wariant_dla_heksa(q, r, s).web()),
        "forestTreeCount" => f64::from(forest_tree_count_for_hex(q, r, s)),
        "jungleTreeCount" => f64::from(jungle_forest_tree_count_for_hex(q, r, s)),
        other => panic!("unknown hash fn {other}"),
    })
}

#[test]
fn hex_hash_functions_match_web() {
    let d = load("hashes.json");
    let seeds: Vec<i32> = d.get("seeds").arr().iter().map(Json::i32).collect();
    let coords: Vec<(i32, i32)> = d
        .get("coords")
        .arr()
        .iter()
        .map(|c| (c.arr()[0].i32(), c.arr()[1].i32()))
        .collect();
    let mut c = Cmp::default();
    let mut samples = 0;
    for (name, f) in d.get("fns").obj_items() {
        let table = f.get("table").f64s();
        let idx: Vec<i64> = f.get("idx").arr().iter().map(Json::i64).collect();
        let mut k = 0;
        // web outcome -> DISTINCT seeds that produce it (dispatch criterion:
        // "min. 50 ziaren na wariant", counted as seeds, not as samples).
        let mut per_value: HashMap<i64, HashSet<i32>> = HashMap::new();
        for &s in &seeds {
            for &(q, r) in &coords {
                let web = idx[k];
                per_value.entry(web).or_default().insert(s);
                k += 1;
                match hash_fn(name, q, r, s) {
                    None => c.eq(&format!("{name}({q},{r},{s})"), -1, web),
                    Some(v) => {
                        if web < 0 {
                            c.eq(&format!("{name}({q},{r},{s}) null"), 0, -1);
                        } else {
                            c.f(
                                &format!("{name}({q},{r},{s})"),
                                v,
                                table[usize::try_from(web).expect("idx")],
                            );
                        }
                    }
                }
                samples += 1;
            }
        }
        c.eq(&format!("{name}.samples"), k, idx.len());
        // dispatch: at least 50 distinct `hashHeksa` seeds per variant / outcome
        assert!(per_value.len() >= 2, "{name}: only one outcome");
        for (v, set) in &per_value {
            let n = set.len();
            assert!(
                n >= 50,
                "{name}: outcome {v} occurs for only {n} distinct seeds"
            );
        }
    }
    for cl in d.get("climate").arr() {
        let h = cl.get("h").num();
        let r0 = cl.get("r0").i32();
        for (i, row) in cl.get("rows").arr().iter().enumerate() {
            let r = r0 + i32::try_from(i).expect("row");
            c.eq(
                &format!("jungle(r={r},h={h})"),
                is_warm_jungle_forest_hex(r, h),
                row.bool(),
            );
        }
    }
    println!("hashes: {samples} samples, {} seeds", seeds.len());
    c.finish("hashes");
}

trait ObjItems {
    fn obj_items(&self) -> Vec<(&str, &Json)>;
}
impl ObjItems for Json {
    fn obj_items(&self) -> Vec<(&str, &Json)> {
        match self {
            Json::Obj(kv) => kv.iter().map(|(k, v)| (k.as_str(), v)).collect(),
            other => panic!("not an object: {other:?}"),
        }
    }
}

// ---------------------------------------------------------------------------
// 3. Builders (object graphs).

#[allow(clippy::too_many_lines)]
fn build(id: &str, a: &[Json], rec: &Json) -> (Option<DecorObject>, Option<f64>) {
    let n = |i: usize| a[i].num();
    let iv = |i: usize| a[i].i32();
    let b = |i: usize| a[i].bool();
    match id {
        "buildLas" => (Some(build_las(iv(0))), None),
        "buildWzgorze" => (Some(build_wzgorze(iv(0))), None),
        "buildGora" => (Some(build_gora(iv(0))), None),
        "buildDekorLaka" => (Some(build_dekor_laka(iv(0))), None),
        "buildDekorRownina" => (Some(build_dekor_rownina(iv(0))), None),
        "buildDekorPustynia" => (Some(build_dekor_pustynia(iv(0))), None),
        "buildTarasy" => (
            Some(build_tarasy(if iv(0) == 0 {
                TarasyWariant::W0
            } else {
                TarasyWariant::W3
            })),
            None,
        ),
        "buildOaza" => (Some(build_oaza()), None),
        "buildStyleForestCluster" => (
            Some(build_style_forest_cluster(
                &ForestParams {
                    q: iv(0),
                    r: iv(1),
                    x: n(2),
                    z: n(3),
                    base_y: n(4),
                    seed: iv(5),
                    radius: n(6),
                    map_height: n(7),
                },
                b(8),
            )),
            None,
        ),
        "buildStyleMountainPeak" | "buildStyleHillBump" => {
            let p = ReliefParams {
                q: iv(0),
                r: iv(1),
                x: n(2),
                z: n(3),
                y: n(4),
                seed: iv(5),
                radius: n(6),
            };
            let o = if id == "buildStyleMountainPeak" {
                build_style_mountain_peak(&p)
            } else {
                build_style_hill_bump(&p)
            };
            (Some(o), None)
        }
        "buildStyleDune" => (
            build_style_dune(iv(0), iv(1), n(2), n(3), n(4), iv(5), n(6)),
            None,
        ),
        "buildStyleTarasyTerrace" => (Some(build_style_tarasy_terrace(b(0), n(1))), None),
        "buildGalleryBuildingPad" => {
            let m = build_gallery_building_pad(terrain(a[0].str()), n(1), n(2), n(3), n(4), b(5));
            (Some(m.group), Some(m.surface_y))
        }
        "buildGalleryFortMount" => {
            let m = build_gallery_fort_mount(terrain(a[0].str()), n(1), n(2), n(3), n(4));
            (Some(m.group), Some(m.surface_y))
        }
        "buildStyleBeachRing" => (Some(build_style_beach_ring(n(0), n(1), n(2), n(3))), None),
        "buildStyleCoastSandTopCap" => (
            Some(build_style_coast_sand_top_cap(n(0), n(1), n(2), n(3), b(4))),
            None,
        ),
        "buildStyleOasis" => {
            let seq = rec.get("rnd").f64s();
            let mut it = seq.into_iter();
            let mut rnd = || it.next().expect("rnd sequence exhausted");
            (
                Some(build_style_oasis(
                    n(0),
                    n(1),
                    n(2),
                    n(3),
                    a[4].u32(),
                    &mut rnd,
                )),
                None,
            )
        }
        other => panic!("unknown builder {other}"),
    }
}

#[test]
fn builders_are_bit_identical_to_web() {
    let d = load("builders.json");
    let mut c = Cmp::default();
    let mut ids: HashMap<String, usize> = HashMap::new();
    let mut meshes = 0;
    for (i, rec) in d.get("builders").arr().iter().enumerate() {
        let id = rec.get("id").str();
        *ids.entry(id.to_owned()).or_default() += 1;
        let (obj, sy) = build(id, rec.get("args").arr(), rec);
        if let Some(o) = &obj {
            meshes += o.mesh_count();
        }
        cmp_object(&mut c, &format!("{id}[{i}]"), obj.as_ref(), rec.get("obj"));
        if let Some(w) = rec.opt("surfaceY") {
            c.f(
                &format!("{id}[{i}].surfaceY"),
                sy.expect("surfaceY"),
                w.num(),
            );
        }
    }
    // Round 2 (Evaluator objection 3): mountain peak / hill bump with >= 50
    // DISTINCT seeds per silhouette variant (`relief_builders.json`).
    let rb = load("relief_builders.json");
    let mut per_variant: HashMap<(String, usize), HashSet<i32>> = HashMap::new();
    for (i, rec) in rb.get("builders").arr().iter().enumerate() {
        let id = rec.get("id").str();
        *ids.entry(id.to_owned()).or_default() += 1;
        let a = rec.get("args").arr();
        let (q, r, seed) = (a[0].i32(), a[1].i32(), a[5].i32());
        per_variant
            .entry((id.to_owned(), wariant_dla_heksa(q, r, 5, seed)))
            .or_default()
            .insert(seed);
        let (obj, _) = build(id, a, rec);
        if let Some(o) = &obj {
            meshes += o.mesh_count();
        }
        cmp_object(
            &mut c,
            &format!("relief:{id}[{i}]"),
            obj.as_ref(),
            rec.get("obj"),
        );
    }
    for id in ["buildStyleMountainPeak", "buildStyleHillBump"] {
        for v in 0..5 {
            let n = per_variant.get(&(id.to_owned(), v)).map_or(0, HashSet::len);
            assert!(
                n >= 50,
                "{id}: variant {v} built for only {n} distinct seeds"
            );
        }
    }
    let mut keys: Vec<_> = ids.into_iter().collect();
    keys.sort();
    println!("builders: {keys:?} meshes={meshes}");
    c.finish("builders");
}

#[test]
fn coast_builders_are_bit_identical_to_web() {
    let d = load("builders.json");
    let mut c = Cmp::default();
    let cm = d.get("coastMap");
    let mut map: TerrainAt = HashMap::new();
    for h in cm.get("hexes").arr() {
        let a = h.arr();
        map.insert(HexCoord::new(a[0].i32(), a[1].i32()), terrain(a[2].str()));
    }
    let kinds = cm.get("riverPathKinds").strs();
    let rivers: Vec<RiverPath> = cm
        .get("riverPaths")
        .arr()
        .iter()
        .zip(&kinds)
        .map(|(p, k)| RiverPath {
            hexes: p
                .arr()
                .iter()
                .map(|c| HexCoord::new(c.arr()[0].i32(), c.arr()[1].i32()))
                .collect(),
            kind: RiverKind::from_web_id(k),
        })
        .collect();
    let mouth = river_mouth_edges(&map, &rivers);
    let delta = river_delta_hexes(&map, &rivers);
    let mut mouth_keys: Vec<String> = mouth
        .iter()
        .map(|(a, b)| format!("{},{}|{},{}", a.q, a.r, b.q, b.r))
        .collect();
    mouth_keys.sort();
    let mut delta_keys: Vec<String> = delta.iter().map(|h| format!("{},{}", h.q, h.r)).collect();
    delta_keys.sort();
    c.eq("mouthEdges", mouth_keys, d.get("mouthEdges").strs());
    c.eq("deltaKeys", delta_keys, d.get("deltaKeys").strs());
    let world = |q: i32, r: i32| civ_renderer::pick::hex::axial_to_world(HexCoord::new(q, r), 1.0);
    let mut n = 0;
    for (i, rec) in d.get("coast").arr().iter().enumerate() {
        let (q, r) = (rec.get("q").i32(), rec.get("r").i32());
        let lite = rec.get("lite").bool();
        let (x, z) = world(q, r);
        let teren = map[&HexCoord::new(q, r)];
        let id = rec.get("id").str();
        let obj = match id {
            "water" => build_style_coast_water_cap(
                &map,
                q,
                r,
                x,
                z,
                0.18,
                1.0,
                &CoastWaterOpts {
                    lite,
                    delta_keys: Some(&delta),
                    is_delta: None,
                },
                &mouth,
            ),
            "waterForcedDelta" => build_style_coast_water_cap(
                &map,
                q,
                r,
                x,
                z,
                0.18,
                1.0,
                &CoastWaterOpts {
                    lite,
                    delta_keys: None,
                    is_delta: Some(true),
                },
                &mouth,
            ),
            "sandEdges" => build_style_coast_sand_edges(
                &CoastSandParams {
                    map: &map,
                    q,
                    r,
                    x,
                    z,
                    top_y: 0.22,
                    radius: 1.0,
                    teren,
                },
                lite,
                &mouth,
            ),
            "landSand" => build_style_land_coast_sand_cap(
                &CoastSandParams {
                    map: &map,
                    q,
                    r,
                    x,
                    z,
                    top_y: 0.46,
                    radius: 1.0,
                    teren,
                },
                lite,
            ),
            other => panic!("unknown coast builder {other}"),
        };
        n += obj.mesh_count();
        cmp_object(
            &mut c,
            &format!("{id}[{i}]({q},{r},{lite})"),
            Some(&obj),
            rec.get("obj"),
        );
    }
    println!("coast: {} builds, {n} meshes", d.get("coast").arr().len());
    c.finish("coast");
}

// ---------------------------------------------------------------------------
// 4. Relief surface height.

#[test]
fn relief_surface_height_matches_web() {
    let d = load("relief.json");
    let mut c = Cmp::default();
    let pts: Vec<f64> = (-4..=4).map(|i| f64::from(i) * 0.25).collect();
    let mut hits = 0;
    for s in d.get("reliefSamples").arr() {
        let kind = match s.get("typ").str() {
            "gora" => ReliefKind::Gora,
            _ => ReliefKind::Wzgorze,
        };
        let w = s.get("w").i32();
        let rot = s.get("rot").num();
        let ys = s.get("ys").f64s();
        let mut k = 0;
        for &x in &pts {
            for &z in &pts {
                let v = powierzchnia_reliefu_y(kind, w, rot, x, z);
                if v > 0.0 {
                    hits += 1;
                }
                c.f(&format!("relief({kind:?},{w},{rot},{x},{z})"), v, ys[k]);
                k += 1;
            }
        }
        let rp = s.get("rp").f64s();
        for (j, y) in s.get("rys").f64s().iter().enumerate() {
            let (x, z) = (rp[2 * j], rp[2 * j + 1]);
            let v = powierzchnia_reliefu_y(kind, w, rot, x, z);
            if v > 0.0 {
                hits += 1;
            }
            c.f(&format!("relief({kind:?},{w},{rot},{x},{z})"), v, *y);
        }
    }
    // Round 2 (Evaluator objection 3): `samplersSeeds` holds >= 50 DISTINCT
    // seeds per (relief type, variant).
    let mut per_variant: HashMap<(String, usize), HashSet<i32>> = HashMap::new();
    for s in d.get("samplersSeeds").arr() {
        per_variant
            .entry((
                s.get("teren").str().to_owned(),
                wariant_dla_heksa(s.get("q").i32(), s.get("r").i32(), 5, s.get("seed").i32()),
            ))
            .or_default()
            .insert(s.get("seed").i32());
        assert!(!s.get("ys").is_null(), "relief sampler expected");
    }
    let terr: HashSet<&String> = per_variant.keys().map(|(t, _)| t).collect();
    assert_eq!(terr.len(), 2, "hills and mountains");
    for t in terr {
        for v in 0..5 {
            let n = per_variant.get(&(t.clone(), v)).map_or(0, HashSet::len);
            assert!(
                n >= 50,
                "sampler {t}: variant {v} for only {n} distinct seeds"
            );
        }
    }
    let all = d
        .get("samplers")
        .arr()
        .iter()
        .chain(d.get("samplersSeeds").arr());
    for s in all {
        let t = terrain(s.get("teren").str());
        let (q, r, seed, rr) = (
            s.get("q").i32(),
            s.get("r").i32(),
            s.get("seed").i32(),
            s.get("R").num(),
        );
        let sampler = ReliefSampler::new(t, q, r, seed, rr);
        let ys = s.get("ys");
        c.eq(
            &format!("sampler({t:?},{q},{r}).null"),
            sampler.is_none(),
            ys.is_null(),
        );
        if let (Some(sm), false) = (sampler, ys.is_null()) {
            for (p, y) in s.get("pts").arr().iter().zip(ys.f64s()) {
                let (x, z) = (p.arr()[0].num(), p.arr()[1].num());
                c.f(
                    &format!("sampler({t:?},{q},{r},{x},{z})"),
                    sm.sample(x * rr, z * rr),
                    y,
                );
            }
        }
    }
    println!("relief: {hits} positive heights");
    c.finish("relief");
}

// ---------------------------------------------------------------------------
// 5. riverLod.

fn rl_geo(kind: &str) -> Arc<Geometry> {
    let mesh = match kind {
        "box" => box_geometry(1.0, 2.0, 3.0, 1, 1, 1),
        "plane" => plane_geometry(2.0, 1.0, 3, 2),
        "cyl" => cylinder_geometry(0.5, 0.5, 1.0, 8, 1, false, 0.0, std::f64::consts::PI * 2.0),
        "boxc" => {
            let m = box_geometry(1.0, 1.0, 1.0, 1, 1, 1);
            let n = m.vertex_count();
            #[allow(clippy::cast_precision_loss, clippy::cast_possible_truncation)]
            let colors: Vec<f32> = (0..n)
                .flat_map(|i| {
                    let t = i as f64 / n as f64;
                    [t as f32, 0.5, (1.0 - t) as f32]
                })
                .collect();
            return Arc::new(Geometry {
                mesh: m,
                colors: Some(colors),
            });
        }
        other => panic!("unknown geometry {other}"),
    };
    Arc::new(mesh.into())
}

#[test]
#[allow(clippy::too_many_lines)]
fn river_lod_matches_web() {
    let d = load("riverlod.json");
    let mut c = Cmp::default();
    let mat = lambert(0x6a_adbe, false);
    for (si, f) in d.get("flushes").arr().iter().enumerate() {
        let kinds = f.get("kinds").strs();
        let ro = i32::try_from(si).expect("ro");
        let mut b = create_river_bucket(mat, ro);
        for (k, kind) in kinds.iter().enumerate() {
            let keys = [format!("{k},{si}"), "0,0".to_owned(), format!("{si},{k}")];
            queue_river_geo(&mut b, rl_geo(kind), keys.iter().map(String::as_str));
        }
        let e = flush_river_bucket(&mut b);
        let w = f.get("res");
        let ctx = format!("flush{si}{kinds:?}");
        c.eq(&format!("{ctx}.null"), e.is_none(), w.is_null());
        if let (Some(e), false) = (e, w.is_null()) {
            c.eq(&format!("{ctx}.merged"), e.merged, w.get("merged").bool());
            cmp_geo_summary(&mut c, &format!("{ctx}.geo"), &e.geometry, w.get("geo"));
            c.eq(
                &format!("{ctx}.keys"),
                e.hex_keys.iter().map(str::to_owned).collect::<Vec<_>>(),
                w.get("hexKeys").strs(),
            );
            c.eq(
                &format!("{ctx}.ro"),
                i64::from(e.render_order),
                w.get("ro").i64(),
            );
            let root = &e.mesh.nodes[e.mesh.root()];
            c.eq(
                &format!("{ctx}.cast"),
                root.cast_shadow,
                w.get("cast").bool(),
            );
            c.eq(
                &format!("{ctx}.recv"),
                root.receive_shadow,
                w.get("recv").bool(),
            );
            let same = match &root.kind {
                NodeKind::Mesh(md) => md.geo.buffer().is_some_and(|g| Arc::ptr_eq(g, &e.geometry)),
                _ => false,
            };
            c.eq(&format!("{ctx}.sameGeo"), same, w.get("sameGeo").bool());
        }
        c.eq(
            &format!("{ctx}.queueAfter"),
            b.geos.len(),
            f.get("queueAfter").usize(),
        );
    }
    {
        let scen: Vec<Vec<String>> = d
            .get("flushes")
            .arr()
            .iter()
            .map(|f| f.get("kinds").strs())
            .collect();
        let mut bs: Vec<_> = scen
            .iter()
            .enumerate()
            .map(|(si, sc)| {
                let mut b = create_river_bucket(mat, 10 + i32::try_from(si).expect("ro"));
                for kind in sc {
                    queue_river_geo(&mut b, rl_geo(kind), [format!("k{si}").as_str()]);
                }
                b
            })
            .collect();
        let out = merge_river_buckets(&mut bs);
        let w = d.get("mergeAll").arr();
        c.eq("mergeAll.len", out.len(), w.len());
        for (e, we) in out.iter().zip(w) {
            c.eq("mergeAll.ro", i64::from(e.render_order), we.get("ro").i64());
            c.eq("mergeAll.merged", e.merged, we.get("merged").bool());
            c.eq(
                "mergeAll.hash",
                fnv_geometry(&e.geometry),
                we.get("hash").u32(),
            );
            c.eq(
                "mergeAll.keys",
                e.hex_keys.iter().map(str::to_owned).collect::<Vec<_>>(),
                we.get("hexKeys").strs(),
            );
        }
    }
    for l in d.get("lod").arr() {
        let a = l.arr();
        c.eq(
            &format!("lod({},{})", a[0].num(), a[1].num()),
            rivers_visible_at_lod(a[0].num(), a[1].num()),
            a[2].bool(),
        );
    }
    for (i, v) in d.get("lodDefault").arr().iter().enumerate() {
        #[allow(clippy::cast_precision_loss)]
        let level = i as f64;
        c.eq(
            "lodDefault",
            rivers_visible_at_lod(level, RIVER_LOD_HIDE_FROM_LEVEL),
            v.bool(),
        );
    }
    for (n, w) in d.get("fullIdxSmall").arr().iter().enumerate() {
        c.eq(
            &format!("fullIdx({n})"),
            build_river_ribbon_full_index(n),
            w.u32s(),
        );
    }
    let entry = |seg: &[&str]| {
        let mut ks = KeySet::default();
        for k in seg {
            ks.add(k);
        }
        RiverBucketMesh {
            mesh: Scene::new(),
            render_order: 0,
            visible: true,
            geometry: Arc::new(Geometry::default()),
            hex_keys: ks,
            merged: true,
        }
    };
    for (ci, cs) in d.get("cases").arr().iter().enumerate() {
        let segs_owned: Vec<Vec<String>> =
            cs.get("segments").arr().iter().map(Json::strs).collect();
        let segs: Vec<Vec<&str>> = segs_owned
            .iter()
            .map(|s| s.iter().map(String::as_str).collect())
            .collect();
        let hidden: HashSet<String> = cs.get("hidden").strs().into_iter().collect();
        let explored: HashSet<String> = cs.get("explored").strs().into_iter().collect();
        let reveal: Option<HashSet<String>> = {
            let r = cs.get("reveal");
            if r.is_null() {
                None
            } else {
                Some(r.strs().into_iter().collect())
            }
        };
        let hid = |k: &str| hidden.contains(k);
        let fog_active = cs.get("fogActive").bool();
        let last = cs.get("lastSig");
        let last = if last.is_null() {
            None
        } else {
            Some(last.i32())
        };
        let level = cs.get("level").num();
        let any_hidden = cs.get("anyHidden").bool();
        let ph = &segs[0];
        let k = format!("case{ci}");
        let sig = compute_river_fog_sig(ph, &hid);
        c.eq(&format!("{k}.sig"), sig, cs.get("sig").i32());
        c.eq(
            &format!("{k}.fullIdx"),
            build_river_ribbon_full_index(ph.len()),
            cs.get("fullIdx").u32s(),
        );
        c.eq(
            &format!("{k}.fogIdx"),
            build_river_ribbon_fog_index(ph, &hid),
            cs.get("fogIdx").u32s(),
        );
        c.eq(
            &format!("{k}.needs"),
            needs_river_ribbon_index_update(fog_active, last, sig),
            cs.get("needs").bool(),
        );
        c.eq(
            &format!("{k}.mFull"),
            build_merged_river_full_index(&segs),
            cs.get("mFull").u32s(),
        );
        c.eq(
            &format!("{k}.mFog"),
            build_merged_river_fog_index(&segs, &hid),
            cs.get("mFog").u32s(),
        );
        c.eq(
            &format!("{k}.mSig"),
            compute_merged_river_fog_sig(&segs, &hid),
            cs.get("mSig").i32(),
        );
        let flat: Vec<&str> = segs.iter().flatten().copied().collect();
        c.eq(
            &format!("{k}.mVis"),
            merged_river_visible_in_fog(fog_active, reveal.as_ref(), &hid, flat.iter().copied()),
            cs.get("mVis").bool(),
        );
        let empty = HashSet::new();
        c.eq(
            &format!("{k}.mVisEmpty"),
            merged_river_visible_in_fog(fog_active, Some(&empty), &hid, flat.iter().copied()),
            cs.get("mVisEmptyReveal").bool(),
        );
        let mut entries: Vec<RiverBucketMesh> = segs.iter().map(|s| entry(s)).collect();
        apply_river_visibility(
            &mut entries,
            level,
            any_hidden,
            &|key| !hidden.contains(key),
            &|key| explored.contains(key),
            RIVER_LOD_HIDE_FROM_LEVEL,
        );
        let vis: Vec<bool> = entries.iter().map(|e| e.visible).collect();
        let wv: Vec<bool> = cs.get("visApply").arr().iter().map(Json::bool).collect();
        c.eq(&format!("{k}.visApply"), vis, wv);
        let mut entries2: Vec<RiverBucketMesh> = segs.iter().map(|s| entry(s)).collect();
        let ret = apply_river_lod_visibility(&mut entries2, level, RIVER_LOD_HIDE_FROM_LEVEL);
        c.eq(&format!("{k}.lodRet"), ret, cs.get("lodRet").bool());
        let vis2: Vec<bool> = entries2.iter().map(|e| e.visible).collect();
        let wv2: Vec<bool> = cs.get("visLod").arr().iter().map(Json::bool).collect();
        c.eq(&format!("{k}.visLod"), vis2, wv2);
    }
    c.finish("riverlod");
}

// ---------------------------------------------------------------------------
// 6. Reuse guard (round 2, Evaluator objections 1-2).

fn decor_sources() -> Vec<(PathBuf, String)> {
    let dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src/decor");
    let mut out = Vec::new();
    for e in std::fs::read_dir(&dir).unwrap_or_else(|e| panic!("{}: {e}", dir.display())) {
        let p = e.expect("dir entry").path();
        assert!(
            !p.is_dir(),
            "decor/ has no sub-directories: {}",
            p.display()
        );
        if p.extension().is_some_and(|x| x == "rs") {
            let src = std::fs::read_to_string(&p).expect("read");
            out.push((p, src));
        }
    }
    assert!(out.len() >= 10, "decor sources not found");
    out
}

/// Code part of a line (`//` comments stripped).
fn code_of(line: &str) -> &str {
    line.find("//").map_or(line, |i| &line[..i])
}

/// `decor/**` calls no platform transcendental (`f64::sin` & co.): every web
/// `Math.*` goes through `crate::jsmath` (P4.16). `.sqrt()` is allowed (IEEE
/// 754 correctly rounded, identical in V8 and every libm).
#[test]
fn decor_uses_jsmath_not_platform_libm() {
    const FORBIDDEN: [&str; 17] = [
        "sin", "cos", "tan", "sin_cos", "asin", "acos", "atan", "atan2", "sinh", "cosh", "tanh",
        "exp", "exp_m1", "ln", "log10", "log2", "hypot",
    ];
    let mut hits = Vec::new();
    for (p, src) in decor_sources() {
        for (i, line) in src.lines().enumerate() {
            let code = code_of(line);
            let mut bad: Vec<String> = Vec::new();
            for f in FORBIDDEN {
                if code.contains(&format!(".{f}(")) {
                    bad.push(format!(".{f}("));
                }
                for ty in ["f64::", "f32::"] {
                    if code.contains(&format!("{ty}{f}(")) {
                        bad.push(format!("{ty}{f}("));
                    }
                }
            }
            for f in [
                ".powf(",
                ".powi(",
                "from_euler_xyz(",
                "hex_prism_no_bottom(",
            ] {
                if code.contains(f) {
                    bad.push(f.to_string());
                }
            }
            if !bad.is_empty() {
                hits.push(format!("{}:{}: {bad:?}", p.display(), i + 1));
            }
        }
    }
    assert!(
        hits.is_empty(),
        "platform maths in decor:\n{}",
        hits.join("\n")
    );
}

/// `decor/**` does not redefine constants / functions that already exist in
/// `core::map_style` (P4.12), `pick::terrain` (P4.10) or `core::scene`
/// (`local_matrix`, with the `jsmath` rotation of P4.16): it reuses them.
#[test]
fn decor_reuses_core_instead_of_copies() {
    const REDEFINED: [&str; 8] = [
        "const WZGORZE_SZCZYT_Y",
        "const GORA_APEX_Y",
        "const LICZBA_WARIANTOW_TERENU",
        "fn decor_variant5",
        "fn forest_tree_count_for_hex",
        "fn jungle_forest_tree_count_for_hex",
        "fn quat_from_euler",
        "fn local_matrix",
    ];
    let mut hits = Vec::new();
    for (p, src) in decor_sources() {
        for (i, line) in src.lines().enumerate() {
            let code = code_of(line);
            for pat in REDEFINED {
                if code.contains(pat) {
                    hits.push(format!("{}:{}: {pat}", p.display(), i + 1));
                }
            }
        }
    }
    assert!(
        hits.is_empty(),
        "copies of core items in decor:\n{}",
        hits.join("\n")
    );
}
