//! MOD-13 "misc" tests (R-RUSTPORT-P4-22-MOD13-MISC-Q1): the Rust
//! `models::misc` port against object graphs produced by RUNNING the web code
//! of `edb8fb56` (three@0.169.0, node v22.22.0), see
//! `tests/fixtures/misc/README.md` and `dyspozycje/rust-port/p4/P4-22-MOD13-MISC.md`.
//!
//! Every float is compared bit for bit (`to_bits`): positions, quaternions,
//! scales, world matrices, bounding boxes, linear colours, opacities,
//! instance matrices. Geometry is compared by vertex / triangle / index
//! counts and the FNV-1a hash of the `Float32` attributes, index and groups
//! (`geo_hash`, same byte stream as `gen.ts`). Any difference fails.

#![allow(clippy::float_cmp)]

use std::path::PathBuf;

use civ_renderer::geom::{Mat4, Mesh};
use civ_renderer::models::misc::model::{MiscGeo, NodeKind};
use civ_renderer::models::misc::overlay::js_to_fixed;
use civ_renderer::models::misc::range::{
    ReliefFn, CULTURE_RANGE_STYLE, MINE_ELIGIBLE_STYLE, RELIGION_RANGE_STYLE,
};
use civ_renderer::models::misc::siege::{
    camp_owner_by_hex, machines_by_camp_hex, make_siege_ram, make_siege_soldiers, make_siege_tower,
    ready_machines_for_city, CampUnit, SiegeMarkerSyncOptions, DEFAULT_SIEGE_ATTACKER_COLOR,
};
use civ_renderer::models::misc::territory::compute_territory_border_loops;
use civ_renderer::models::misc::wioska::{OBOZ_LAYOUT, WIOSKA_LAYOUT};
use civ_renderer::models::misc::{
    add_roblox_sky_decor, build_oboz_barbarzyncow, build_range_overlay_group,
    build_siege_camp_group, build_territory_border_group, build_trade_routes_overlay_group,
    build_wioska, FlatRelief, HexKey, HexKeySet, MiscModel, OverlayGroup, OverlayKind, OverlayMap,
    RangeOverlayStyle, ReliefSource, SiegeCampBuildOpts, SiegeMachineKind, SiegeMarkerRenderer,
    TerritoryBorderParams, TradeMedium, TradeRouteOverlayInput, BARB_FACTION_COLOR,
};
use civ_renderer::models::unit_core::model::geo_hash;
use civ_renderer::pick::hex::{axial_to_world, HexCoord, HEX_R};
use civ_renderer::pick::terrain::Terrain;
use civ_renderer::pick::three::{js_max, js_min};

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
        "misc",
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

fn geo_type(g: &MiscGeo) -> &'static str {
    use civ_renderer::models::unit_core::model::Prim;
    match g {
        MiscGeo::Prim(Prim::Box { .. }) => "BoxGeometry",
        MiscGeo::Prim(Prim::Cylinder { .. }) => "CylinderGeometry",
        MiscGeo::Prim(Prim::Cone { .. }) => "ConeGeometry",
        MiscGeo::Prim(Prim::Sphere { .. }) => "SphereGeometry",
        MiscGeo::Prim(Prim::Icosahedron { .. }) => "IcosahedronGeometry",
        MiscGeo::Prim(_) => "other",
        MiscGeo::Circle { .. } => "CircleGeometry",
        MiscGeo::Ring { .. } => "RingGeometry",
    }
}

fn cmp_mat(c: &mut Cmp, ctx: &str, m: &civ_renderer::models::misc::MiscMaterial, w: &Json) {
    c.eq(&format!("{ctx}.t"), m.kind.three_type(), w.get("t").str());
    c.eq(&format!("{ctx}.color"), m.color, w.get("color").u32());
    let lin = m.linear_color();
    c.fs(
        &format!("{ctx}.lin"),
        &[lin.r, lin.g, lin.b],
        &w.get("lin").hx(),
    );
    c.eq(&format!("{ctx}.flat"), m.flat_shading, w.get("flat").bool());
    c.eq(
        &format!("{ctx}.transparent"),
        m.transparent,
        w.get("transparent").bool(),
    );
    c.f(
        &format!("{ctx}.opacity"),
        m.opacity,
        w.get("opacity").hx()[0],
    );
    c.eq(&format!("{ctx}.dw"), m.depth_write, w.get("dw").bool());
    c.eq(&format!("{ctx}.dt"), m.depth_test, w.get("dt").bool());
    c.eq(
        &format!("{ctx}.side"),
        m.side.three_value(),
        w.get("side").u32(),
    );
    c.eq(
        &format!("{ctx}.po"),
        m.polygon_offset.is_some(),
        w.get("po").bool(),
    );
    let (pof, pou) = m.polygon_offset.unwrap_or((0.0, 0.0));
    c.f(&format!("{ctx}.pof"), pof, w.get("pof").hx()[0]);
    c.f(&format!("{ctx}.pou"), pou, w.get("pou").hx()[0]);
    c.eq(&format!("{ctx}.map"), m.map.is_some(), w.get("map").bool());
}

/// One node of a flattened scene: model + node id + world matrix.
struct Flat<'a> {
    model: &'a MiscModel,
    id: usize,
    parent: i64,
    world: Mat4,
}

/// Flattens `models` under a scene root (when `scene_root`) the way the web
/// scene holds them: world = parent world · local, starting from identity
/// for the children of the scene.
fn flatten<'a>(models: &[&'a MiscModel], scene_root: Option<&'a MiscModel>) -> Vec<Flat<'a>> {
    let mut out: Vec<Flat<'a>> = Vec::new();
    let mut base_parent = -1;
    let mut base_world: Option<Mat4> = None;
    if let Some(s) = scene_root {
        out.push(Flat {
            model: s,
            id: 0,
            parent: -1,
            world: Mat4::IDENTITY,
        });
        base_parent = 0;
        base_world = Some(Mat4::IDENTITY);
    }
    for m in models {
        let order = m.traverse();
        let mut pos = vec![usize::MAX; m.tree.nodes.len()];
        for &id in &order {
            let local = m.tree.local_matrix(id);
            let (parent, world) = match m.tree.nodes[id].parent {
                Some(p) => {
                    let pi = pos[p];
                    (i64::try_from(pi).expect("idx"), out[pi].world.mul(&local))
                }
                None => match base_world {
                    Some(bw) => (base_parent, bw.mul(&local)),
                    None => (-1, local),
                },
            };
            pos[id] = out.len();
            out.push(Flat {
                model: m,
                id,
                parent,
                world,
            });
        }
    }
    out
}

fn cmp_flat(c: &mut Cmp, ctx: &str, flat: &[Flat<'_>], rec: &Json) {
    let nodes = rec.get("nodes").arr();
    c.eq(&format!("{ctx}.nodes"), flat.len(), nodes.len());
    let mut meshes = 0u32;
    let mut tris = 0u32;
    let mut lo = [f64::INFINITY; 3];
    let mut hi = [f64::NEG_INFINITY; 3];
    for (i, (fl, w)) in flat.iter().zip(nodes).enumerate() {
        let cx = format!("{ctx}#{i}");
        let n = &fl.model.tree.nodes[fl.id];
        let info = &fl.model.info[fl.id];
        let kind = fl.model.kind(fl.id);
        let wk = w.get("k").str();
        let rk = match kind {
            NodeKind::Mesh => "Mesh",
            NodeKind::Sprite => "Sprite",
            NodeKind::Group if wk == "Scene" && i == 0 => "Scene",
            NodeKind::Group => "Group",
        };
        c.eq(&format!("{cx}.k"), rk, wk);
        c.eq(&format!("{cx}.name"), n.name.as_str(), w.get("name").str());
        c.eq(&format!("{cx}.parent"), fl.parent, w.get("parent").i64());
        c.fs(
            &format!("{cx}.p"),
            &[n.position.x, n.position.y, n.position.z],
            &w.get("p").hx(),
        );
        let q = n.quaternion;
        c.fs(&format!("{cx}.q"), &[q.x, q.y, q.z, q.w], &w.get("q").hx());
        c.fs(
            &format!("{cx}.s"),
            &[n.scale.x, n.scale.y, n.scale.z],
            &w.get("s").hx(),
        );
        c.fs(&format!("{cx}.w"), &fl.world.e, &w.get("w").hx());
        c.eq(&format!("{cx}.cs"), info.cast_shadow, w.get("cs").bool());
        c.eq(&format!("{cx}.rs"), info.receive_shadow, w.get("rs").bool());
        c.eq(&format!("{cx}.ro"), info.render_order, w.get("ro").i32());
        if let Some(mt) = fl.model.material_of(fl.id) {
            cmp_mat(c, &format!("{cx}.mat"), mt, w.get("mat"));
        } else {
            c.eq(&format!("{cx}.mat?"), false, w.opt("mat").is_some());
        }
        if let Some((geo, _)) = fl.model.mesh_of(fl.id) {
            let g = geo.build();
            let wg = w.get("geo");
            c.eq(&format!("{cx}.geo.t"), geo_type(&geo), wg.get("t").str());
            c.eq(
                &format!("{cx}.geo.vtx"),
                g.vertex_count(),
                usize::try_from(wg.get("vtx").i64()).expect("n"),
            );
            c.eq(
                &format!("{cx}.geo.tri"),
                g.triangle_count(),
                usize::try_from(wg.get("tri").i64()).expect("n"),
            );
            c.eq(
                &format!("{cx}.geo.hash"),
                geo_hash(&g),
                wg.get("hash").u32(),
            );
            meshes += 1;
            tris += u32::try_from(g.triangle_count()).expect("tri");
            for v in g.positions.chunks_exact(3) {
                let p = civ_renderer::geom::Vec3::new(
                    f64::from(v[0]),
                    f64::from(v[1]),
                    f64::from(v[2]),
                )
                .apply_mat4(&fl.world);
                for (k, val) in [p.x, p.y, p.z].into_iter().enumerate() {
                    lo[k] = js_min(lo[k], val);
                    hi[k] = js_max(hi[k], val);
                }
            }
        } else {
            c.eq(&format!("{cx}.geo?"), false, w.opt("geo").is_some());
        }
    }
    c.eq(&format!("{ctx}.meshes"), meshes, rec.get("meshes").u32());
    c.eq(&format!("{ctx}.tris"), tris, rec.get("tris").u32());
    c.fs(
        &format!("{ctx}.bbox"),
        &[lo[0], lo[1], lo[2], hi[0], hi[1], hi[2]],
        &rec.get("bbox").hx(),
    );
}

/// Model compare: flattened tree + the model's own signature / bbox.
fn cmp_model(c: &mut Cmp, ctx: &str, m: &MiscModel, rec: &Json) {
    let flat = flatten(&[m], None);
    cmp_flat(c, ctx, &flat, rec);
    let sig = m.signature();
    c.eq(
        &format!("{ctx}.sig.meshes"),
        sig.meshes,
        rec.get("meshes").u32(),
    );
    c.eq(&format!("{ctx}.sig.tris"), sig.tris, rec.get("tris").u32());
    c.eq(&format!("{ctx}.sig"), sig.sig, rec.get("sig").u32());
    let [lo, hi] = m.bbox();
    c.fs(
        &format!("{ctx}.model.bbox"),
        &[lo.x, lo.y, lo.z, hi.x, hi.y, hi.z],
        &rec.get("bbox").hx(),
    );
}

fn kinds(j: &Json) -> Vec<SiegeMachineKind> {
    j.arr()
        .iter()
        .map(|k| SiegeMachineKind::from_web_id(k.str()).expect("kind"))
        .collect()
}

// ---------------------------------------------------------------------------
// Models.

#[test]
fn models_match_web() {
    let root = load("models.json");
    let mut c = Cmp::default();
    let consts = root.get("constants");
    c.eq(
        "BARB_FACTION_COLOR",
        BARB_FACTION_COLOR,
        consts.get("BARB_FACTION_COLOR").u32(),
    );
    c.eq(
        "DEFAULT_SIEGE_ATTACKER_COLOR",
        DEFAULT_SIEGE_ATTACKER_COLOR,
        consts.get("DEFAULT_SIEGE_ATTACKER_COLOR").u32(),
    );
    c.f(
        "wioska.rotY",
        WIOSKA_LAYOUT.rot_y,
        consts.get("wioskaRotY").hx()[0],
    );
    c.f(
        "oboz.rotY",
        OBOZ_LAYOUT.rot_y,
        consts.get("obozRotY").hx()[0],
    );
    let mut seen = std::collections::BTreeMap::<String, usize>::new();
    for rec in root.get("models").arr() {
        let id = rec.get("id").str();
        let a = rec.get("args");
        let m = match id {
            "wioska" => build_wioska(),
            "oboz" => {
                let col = a.get("color");
                if col.is_null() {
                    build_oboz_barbarzyncow(BARB_FACTION_COLOR)
                } else {
                    build_oboz_barbarzyncow(col.u32())
                }
            }
            "soldiers" => make_siege_soldiers(a.get("count").u32(), a.get("color").u32()),
            "ram" => make_siege_ram(),
            "tower" => make_siege_tower(),
            "camp" => build_siege_camp_group(&SiegeCampBuildOpts {
                attacker_color: a.get("color").u32(),
                ready_machines: if a.get("machines").is_null() {
                    None
                } else {
                    Some(kinds(a.get("machines")))
                },
                face_dir_x: a.get("fx").num(),
                face_dir_z: a.get("fz").num(),
            }),
            "sky" => add_roblox_sky_decor(
                a.get("cx").num(),
                a.get("cz").num(),
                a.get("span").num(),
                a.get("lite").bool(),
            ),
            other => panic!("unknown model {other}"),
        };
        let n = seen.entry(id.to_owned()).or_default();
        cmp_model(&mut c, &format!("{id}[{n}]"), &m, rec);
        *n += 1;
    }
    c.eq("model cases", root.get("models").arr().len(), 34);
    c.finish("models");
}

// ---------------------------------------------------------------------------
// siegeCampSync + siege marker.

fn strings(j: &Json) -> Vec<String> {
    j.arr().iter().map(|s| s.str().to_owned()).collect()
}

#[test]
fn siege_sync_matches_web() {
    let root = load("siege.json");
    let mut c = Cmp::default();
    for (i, s) in root.get("sync").arr().iter().enumerate() {
        let ctx = format!("sync[{i}]");
        match s.get("fn").str() {
            "ready" => {
                let input = s.get("input");
                let got = if input.is_null() {
                    ready_machines_for_city(None)
                } else {
                    let k = kinds(input);
                    ready_machines_for_city(Some(&k))
                };
                c.eq(&ctx, got, kinds(s.get("out")));
            }
            "machines" => {
                let got = machines_by_camp_hex(&strings(s.get("hexes")), &kinds(s.get("ready")));
                let want: Vec<(String, Vec<SiegeMachineKind>)> = s
                    .get("out")
                    .arr()
                    .iter()
                    .map(|e| (e.arr()[0].str().to_owned(), kinds(&e.arr()[1])))
                    .collect();
                c.eq(&ctx, got, want);
            }
            "owners" => {
                let units: Vec<CampUnit> = s
                    .get("units")
                    .arr()
                    .iter()
                    .map(|u| CampUnit {
                        q: u.get("q").num(),
                        r: u.get("r").num(),
                        owner_id: u.get("ownerId").i64(),
                    })
                    .collect();
                let got =
                    camp_owner_by_hex(&strings(s.get("hexes")), &units, s.get("cityOwner").i64());
                let want: Vec<(String, i64)> = s
                    .get("out")
                    .arr()
                    .iter()
                    .map(|e| (e.arr()[0].str().to_owned(), e.arr()[1].i64()))
                    .collect();
                c.eq(&ctx, got, want);
            }
            other => panic!("unknown fn {other}"),
        }
    }
    // The sprite canvas draw calls (recorded by the stub canvas of gen.ts).
    let log = root.get("canvasLog").arr();
    let glyph = civ_renderer::models::misc::siege::SIEGE_GLYPH;
    c.eq("canvas.clearRect", log[0].get("call").str(), "clearRect");
    let sz = f64::from(glyph.size);
    c.fs(
        "canvas.clearRect.args",
        &[0.0, 0.0, sz, sz],
        &log[0]
            .get("args")
            .arr()
            .iter()
            .map(Json::num)
            .collect::<Vec<_>>(),
    );
    c.eq("canvas.font", glyph.font, log[1].get("value").str());
    c.eq("canvas.w", glyph.size, log[1].get("w").u32());
    c.eq("canvas.textAlign", "center", log[2].get("value").str());
    c.eq("canvas.textBaseline", "middle", log[3].get("value").str());
    let ft = log[4].get("args").arr();
    c.eq("canvas.fillText", log[4].get("call").str(), "fillText");
    c.eq(
        "canvas.glyph",
        glyph.glyph.to_string(),
        ft[0].str().to_owned(),
    );
    c.eq("canvas.x", glyph.x, ft[1].u32());
    c.eq("canvas.y", glyph.y, ft[2].u32());
    c.eq("canvas.calls", log.len(), 5);
    c.finish("siege sync");
}

#[test]
fn siege_marker_matches_web() {
    let root = load("siege.json");
    let mut c = Cmp::default();
    let mut r = SiegeMarkerRenderer::new();
    let top_y = |q: f64, r: f64| 0.3 + 0.01 * q - 0.007 * r;
    let scene = MiscModel::new();
    for (i, step) in root.get("markerSteps").arr().iter().enumerate() {
        let st = step.get("step");
        let ids = strings(st.get("ids"));
        let pos: Vec<(String, (f64, f64))> = st
            .get("pos")
            .arr()
            .iter()
            .map(|p| {
                let a = p.arr();
                (a[0].str().to_owned(), (a[1].num(), a[2].num()))
            })
            .collect();
        let opts = SiegeMarkerSyncOptions {
            camp_hexes_by_city: st
                .get("camps")
                .arr()
                .iter()
                .map(|e| (e.arr()[0].str().to_owned(), strings(&e.arr()[1])))
                .collect(),
            machines_by_camp_hex: st
                .get("machines")
                .arr()
                .iter()
                .map(|e| (e.arr()[0].str().to_owned(), kinds(&e.arr()[1])))
                .collect(),
            owner_color_by_id: st
                .get("colors")
                .arr()
                .iter()
                .map(|e| (e.arr()[0].i64(), e.arr()[1].u32()))
                .collect(),
            camp_owner_by_hex: st
                .get("owners")
                .arr()
                .iter()
                .map(|e| (e.arr()[0].str().to_owned(), e.arr()[1].i64()))
                .collect(),
        };
        r.sync(&ids, &pos, &top_y, &opts);
        if !st.get("pulse").is_null() {
            r.pulse(st.get("pulse").num());
        }
        let models: Vec<&MiscModel> = r.markers.iter().map(|(_, m)| &m.model).collect();
        let flat = flatten(&models, Some(&scene));
        cmp_flat(&mut c, &format!("step{i}"), &flat, step);
    }
    c.finish("siege marker");
}

// ---------------------------------------------------------------------------
// Overlays.

/// The closed-form relief of `relief_shim.ts` (mode "analytic").
struct AnalyticRelief;

impl ReliefSource for AnalyticRelief {
    fn sampler(&self, t: Terrain, q: i32, r: i32, seed: f64, radius: f64) -> Option<ReliefFn<'_>> {
        use civ_renderer::jsmath::{js_cos, js_hypot, js_sin};
        let amp = match t {
            Terrain::Gory => 1.1,
            Terrain::Wzgorza => 0.39,
            _ => return None,
        };
        let ph = ((f64::from(q) * 31.0 + f64::from(r) * 17.0 + seed) % 7.0) * 0.37;
        Some(Box::new(move |x: f64, z: f64| {
            amp * js_max(0.0, 1.0 - js_hypot(x / radius, z / radius))
                * (0.8 + 0.2 * js_cos(3.0 * x / radius + ph) * js_sin(2.0 * z / radius - ph))
                * radius
        }))
    }
}

fn load_maps(o: &Json) -> Vec<(String, OverlayMap)> {
    o.get("maps")
        .obj()
        .iter()
        .map(|(id, m)| {
            let seed = m.get("seed");
            let hexes = m
                .get("hexes")
                .arr()
                .iter()
                .map(|h| {
                    let a = h.arr();
                    (
                        (a[0].i32(), a[1].i32()),
                        Terrain::from_web_id(a[2].str()).expect("terrain"),
                    )
                })
                .collect();
            (
                id.clone(),
                OverlayMap {
                    hexes,
                    seed: if seed.is_null() {
                        None
                    } else {
                        Some(seed.num())
                    },
                },
            )
        })
        .collect()
}

fn hex_sets(o: &Json) -> Vec<(String, Vec<HexKey>)> {
    o.get("hexSets")
        .obj()
        .iter()
        .map(|(id, s)| {
            (
                id.clone(),
                s.arr()
                    .iter()
                    .map(|k| (k.arr()[0].i32(), k.arr()[1].i32()))
                    .collect(),
            )
        })
        .collect()
}

fn style_from(j: &Json) -> RangeOverlayStyle {
    let opt = |k: &str| {
        let v = j.get(k);
        if v.is_null() {
            None
        } else {
            Some(v.hx()[0])
        }
    };
    RangeOverlayStyle {
        tint_color: j.get("tintColor").u32(),
        tint_opacity: j.get("tintOpacity").hx()[0],
        border_color: j.get("borderColor").u32(),
        border_opacity: j.get("borderOpacity").hx()[0],
        border_band_width: opt("borderBandWidth"),
        y_offset: opt("yOffset"),
        hug_terrain_relief: !j.get("hug").is_null() && j.get("hug").bool(),
    }
}

fn bbox_f32(g: &Mesh) -> Vec<f64> {
    let mut lo = [f64::INFINITY; 3];
    let mut hi = [f64::NEG_INFINITY; 3];
    for v in g.positions.chunks_exact(3) {
        for k in 0..3 {
            let x = f64::from(v[k]);
            if x < lo[k] {
                lo[k] = x;
            }
            if x > hi[k] {
                hi[k] = x;
            }
        }
    }
    vec![lo[0], lo[1], lo[2], hi[0], hi[1], hi[2]]
}

fn cmp_overlay(c: &mut Cmp, ctx: &str, g: &OverlayGroup, rec: &Json) {
    c.eq(
        &format!("{ctx}.name"),
        g.name.as_str(),
        rec.get("name").str(),
    );
    let objs = rec.get("objects").arr();
    c.eq(&format!("{ctx}.objects"), g.objects.len(), objs.len());
    for (i, (o, w)) in g.objects.iter().zip(objs).enumerate() {
        let cx = format!("{ctx}/{i}");
        c.eq(&format!("{cx}.k"), o.kind.three_type(), w.get("k").str());
        c.eq(&format!("{cx}.name"), o.name.as_str(), w.get("name").str());
        c.eq(&format!("{cx}.ro"), o.render_order, w.get("ro").i32());
        c.eq(&format!("{cx}.fc"), o.frustum_culled, w.get("fc").bool());
        cmp_mat(c, &format!("{cx}.mat"), &o.material, w.get("mat"));
        let wg = w.get("geo");
        let gm = &o.geometry;
        c.eq(
            &format!("{cx}.vtx"),
            gm.vertex_count(),
            usize::try_from(wg.get("vtx").i64()).expect("n"),
        );
        // `tri` (= count / 3) is meaningless for line objects.
        if matches!(o.kind, OverlayKind::Mesh | OverlayKind::InstancedMesh) {
            c.eq(
                &format!("{cx}.tri"),
                gm.triangle_count(),
                usize::try_from(wg.get("tri").i64()).expect("n"),
            );
        }
        c.eq(
            &format!("{cx}.idx"),
            gm.indices
                .as_ref()
                .map_or(-1, |v| i64::try_from(v.len()).expect("n")),
            wg.get("idx").i64(),
        );
        c.eq(
            &format!("{cx}.nor"),
            !gm.normals.is_empty(),
            wg.get("nor").bool(),
        );
        let h = geo_hash(gm);
        c.eq(&format!("{cx}.hash"), h, wg.get("hash").u32());
        if h != wg.get("hash").u32() {
            if let Some(p) = wg.opt("pos").filter(|p| !p.is_null()) {
                let rp: Vec<f64> = gm.positions.iter().map(|&v| f64::from(v)).collect();
                c.fs(&format!("{cx}.pos"), &rp, &p.hx());
            }
        }
        c.fs(&format!("{cx}.bbox"), &bbox_f32(gm), &wg.get("bbox").hx());
        if let Some(cnt) = w.opt("count") {
            c.eq(
                &format!("{cx}.count"),
                o.instances.len(),
                usize::try_from(cnt.i64()).expect("n"),
            );
            let rust: Vec<f64> = o
                .instances
                .iter()
                .flatten()
                .map(|&v| f64::from(v))
                .collect();
            c.fs(&format!("{cx}.inst"), &rust, &w.get("inst").hx());
        } else {
            c.eq(&format!("{cx}.inst?"), 0, o.instances.len());
        }
        match (&o.drape, w.opt("ud")) {
            (Some(d), Some(ud)) => {
                let keys: Vec<String> = d
                    .hex_keys
                    .iter()
                    .map(|k| format!("{},{}", k.0, k.1))
                    .collect();
                c.eq(
                    &format!("{cx}.ud.hexKeys"),
                    keys,
                    strings(ud.get("hexKeys")),
                );
                c.eq(
                    &format!("{cx}.ud.triangles"),
                    d.triangles,
                    ud.get("triangles").u32(),
                );
                c.eq(
                    &format!("{cx}.ud.subdivisions"),
                    d.subdivisions,
                    ud.get("subdivisions").u32(),
                );
            }
            (None, None) => {}
            (r, w) => c.err(format!("{cx}.ud: rust {r:?} web {w:?}")),
        }
    }
}

#[test]
fn range_overlay_matches_web() {
    let o = load("overlays.json");
    let mut c = Cmp::default();
    let maps = load_maps(&o);
    let sets = hex_sets(&o);
    let styles: Vec<(String, RangeOverlayStyle)> = o
        .get("styles")
        .obj()
        .iter()
        .map(|(id, s)| (id.clone(), style_from(s)))
        .collect();
    // The Rust constants are the web constants.
    let st = |id: &str| styles.iter().find(|(k, _)| k == id).expect("style").1;
    c.eq("CULTURE_RANGE_STYLE", CULTURE_RANGE_STYLE, st("culture"));
    c.eq("RELIGION_RANGE_STYLE", RELIGION_RANGE_STYLE, st("religion"));
    c.eq("MINE_ELIGIBLE_STYLE", MINE_ELIGIBLE_STYLE, st("mine"));
    let cases = o.get("range").arr();
    for rec in cases {
        let map = &maps
            .iter()
            .find(|(k, _)| k == rec.get("map").str())
            .expect("map")
            .1;
        let keys = &sets
            .iter()
            .find(|(k, _)| k == rec.get("set").str())
            .expect("set")
            .1;
        let style = st(rec.get("style").str());
        let relief: &dyn ReliefSource = match rec.get("relief").str() {
            "real" => {
                // FlatRelief equals the web only where the real sampler is null.
                assert!(
                    map.hexes
                        .values()
                        .all(|t| !matches!(t, Terrain::Wzgorza | Terrain::Gory)),
                    "real-relief case on a map with relief terrain"
                );
                &FlatRelief
            }
            "analytic" => &AnalyticRelief,
            other => panic!("relief {other}"),
        };
        let g = build_range_overlay_group(map, &HexKeySet::new(keys), &style, relief);
        let ctx = format!(
            "{}/{}/{}",
            rec.get("map").str(),
            rec.get("set").str(),
            rec.get("style").str()
        );
        cmp_overlay(&mut c, &ctx, &g, rec);
    }
    c.eq("range cases", cases.len(), 252);
    c.finish("range overlay");
}

#[test]
fn territory_loops_match_web() {
    let o = load("overlays.json");
    let mut c = Cmp::default();
    let maps = load_maps(&o);
    let sets = hex_sets(&o);
    let mixed = &maps.iter().find(|(k, _)| k == "mixed").expect("mixed").1;
    let center = |q: i32, r: i32| {
        mixed
            .terrain((q, r))
            .map(|_| axial_to_world(HexCoord { q, r }, HEX_R))
    };
    for rec in o.get("loops").arr() {
        let id = rec.get("set").str();
        let keys = &sets.iter().find(|(k, _)| k == id).expect("set").1;
        let loops = compute_territory_border_loops(&HexKeySet::new(keys), &center);
        let want = rec.get("loops").arr();
        c.eq(&format!("{id}.loops"), loops.len(), want.len());
        for (i, (l, w)) in loops.iter().zip(want).enumerate() {
            let flat: Vec<f64> = l.iter().flat_map(|p| [p.x, p.z]).collect();
            c.fs(&format!("{id}.loop{i}"), &flat, &w.hx());
        }
    }
    c.finish("territory loops");
}

#[test]
fn territory_border_matches_web() {
    let o = load("overlays.json");
    let mut c = Cmp::default();
    let maps = load_maps(&o);
    let sets = hex_sets(&o);
    let mixed = &maps.iter().find(|(k, _)| k == "mixed").expect("mixed").1;
    let owner_color = |o: i64| match o {
        1 => 0xd0_3030,
        2 => 0x2a_6fdb,
        3 => 0x33_aa55,
        4 => 0xff_cc00,
        _ => panic!("owner"),
    };
    let rel_color = |o: i64| match o {
        1 => 0x88_8888,
        2 => 0xff_0000,
        3 => 0x00_ff00,
        4 => 0x00_00ff,
        _ => panic!("owner"),
    };
    let opt = |j: &Json| if j.is_null() { None } else { Some(j.num()) };
    for rec in o.get("territory").arr() {
        let by_owner: Vec<(i64, HexKeySet)> = rec
            .get("owners")
            .arr()
            .iter()
            .map(|e| {
                let a = e.arr();
                let keys = &sets.iter().find(|(k, _)| k == a[1].str()).expect("set").1;
                (a[0].i64(), HexKeySet::new(keys))
            })
            .collect();
        let params = TerritoryBorderParams {
            band_width: opt(rec.get("band")),
            opacity: opt(rec.get("opacity")),
            relation_band_width: opt(rec.get("relBand")),
        };
        let rel: Option<&dyn Fn(i64) -> u32> = if rec.get("rel").bool() {
            Some(&rel_color)
        } else {
            None
        };
        let g = build_territory_border_group(mixed, &by_owner, &owner_color, params, rel);
        cmp_overlay(&mut c, rec.get("id").str(), &g, rec);
    }
    c.finish("territory border");
}

#[test]
fn trade_routes_match_web() {
    let o = load("overlays.json");
    let mut c = Cmp::default();
    let maps = load_maps(&o);
    let mixed = &maps.iter().find(|(k, _)| k == "mixed").expect("mixed").1;
    for rec in o.get("trade").arr() {
        let routes: Vec<TradeRouteOverlayInput> = rec
            .get("routes")
            .arr()
            .iter()
            .map(|r| TradeRouteOverlayInput {
                from_q: r.get("fromQ").i32(),
                from_r: r.get("fromR").i32(),
                to_q: r.get("toQ").i32(),
                to_r: r.get("toR").i32(),
                medium: match r.get("medium").str() {
                    "lad" => TradeMedium::Lad,
                    "morze" => TradeMedium::Morze,
                    m => panic!("medium {m}"),
                },
            })
            .collect();
        let g = build_trade_routes_overlay_group(mixed, &routes);
        cmp_overlay(&mut c, rec.get("id").str(), &g, rec);
    }
    c.finish("trade routes");
}

/// `toFixed` used by the territory vertex keys / relief cache, on corner
/// coordinates of many hexes: Rust keys must never split a web vertex.
#[test]
fn to_fixed_on_hex_corners_is_sign_stable() {
    // Every hex corner of a 41x41 window computed from two adjacent centres
    // must yield the same key after the "-0.00000" fix.
    use civ_renderer::models::misc::territory::{border_vertex_key, hex_corner_world};
    let mut checked = 0;
    for q in -20..=20 {
        for r in -20..=20 {
            let (cx, cz) = axial_to_world(HexCoord { q, r }, HEX_R);
            let (nx, nz) = axial_to_world(HexCoord { q: q + 1, r }, HEX_R);
            // corner 1 of (q,r) == corner 5 of (q+1,r); corner 2 == corner 4.
            for (a, b) in [(1, 5), (2, 4)] {
                let p = hex_corner_world(cx, cz, a);
                let n = hex_corner_world(nx, nz, b);
                assert_eq!(
                    border_vertex_key(p.x, p.z),
                    border_vertex_key(n.x, n.z),
                    "{q},{r}"
                );
                checked += 1;
            }
        }
    }
    assert_eq!(checked, 41 * 41 * 2);
    assert_eq!(js_to_fixed(-1e-12, 5), "-0.00000");
}

/// `QuadraticBezierCurve3.getPoints(28)` of three r169 in double precision
/// (the route `Line` attribute is `Float32` and would hide a 1-ulp error).
#[test]
fn quadratic_bezier_matches_three() {
    use civ_renderer::models::misc::trade::{quadratic_bezier, ARC_SEGMENTS};
    let o = load("overlays.json");
    let mut c = Cmp::default();
    for (i, rec) in o.get("bezier").arr().iter().enumerate() {
        let v = rec.get("ctrl").hx();
        let mut pts = Vec::new();
        for d in 0..=ARC_SEGMENTS {
            let t = f64::from(d) / f64::from(ARC_SEGMENTS);
            for k in 0..3 {
                pts.push(quadratic_bezier(t, v[k], v[3 + k], v[6 + k]));
            }
        }
        c.fs(&format!("bezier{i}"), &pts, &rec.get("pts").hx());
    }
    c.finish("quadratic bezier");
}
