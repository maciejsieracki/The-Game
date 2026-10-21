//! RR-T3 golden tests: Rust picking vs vectors produced by the web code
//! itself (three@0.169.0 + literal web modules from `edb8fb56`), see
//! `tests/fixtures/pick/README.md` and `dyspozycje/rust-port/p4/P4-10-PICKING-CPU.md`.
//!
//! Tolerance is zero everywhere: picking is discrete, and the intermediate
//! floating-point values (camera matrices, rays, instance matrices, prism
//! vertices) are compared bit for bit.

use std::collections::BTreeMap;
use std::path::PathBuf;

use civ_renderer::pick::camera::{far_clip_roblox, PickCamera};
use civ_renderer::pick::hex::{
    client_rect_to_ndc, js_round, world_to_axial_hexutil, world_to_axial_picker, ClientRect,
    HexCoord, HEX_R,
};
use civ_renderer::pick::raycast::{PickMesh, Side, TriGeometry};
use civ_renderer::pick::terrain::{
    build_terrain_pick_scene, hex_prism_no_bottom, MapHex, Terrain, TerrainMeshKind,
    TerrainPickScene, TerrainSceneOptions, TerrainSolids, ROBLOX_PRISM_RADIUS_FACTOR,
};
use civ_renderer::pick::three::Mat4;
use civ_renderer::pick::{pick_map_target, pixel_to_hex, MapPick, PickVia, UnitPickModel};

// ---------------------------------------------------------------------------
// Minimal JSON reader (the crate has no dependencies; fixtures are trusted
// files produced by the reference script).

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
    fn f64s(&self) -> Vec<f64> {
        self.arr().iter().map(Json::num).collect()
    }
    fn i32(&self) -> i32 {
        let n = self.num();
        assert!(n.fract() == 0.0 && n.abs() < 1e9, "not an i32: {n}");
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
        "pick",
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
    assert_eq!(parser.i, text.len(), "trailing data in {name}");
    v
}

// ---------------------------------------------------------------------------
// Helpers

#[allow(clippy::cast_possible_truncation)]
fn f32s(j: &Json) -> Vec<f32> {
    j.arr()
        .iter()
        .map(|v| {
            let d = v.num();
            let f = d as f32;
            assert_eq!(
                f64::from(f).to_bits(),
                d.to_bits(),
                "fixture value {d} is not an f32"
            );
            f
        })
        .collect()
}

#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
fn u32s(j: &Json) -> Vec<u32> {
    j.arr().iter().map(|v| v.num() as u32).collect()
}

fn mat(j: &Json) -> Mat4 {
    let v = j.f64s();
    let mut e = [0.0; 16];
    e.copy_from_slice(&v);
    Mat4 { e }
}

fn assert_mat_bits(label: &str, got: &Mat4, want: &Mat4) {
    for k in 0..16 {
        assert!(
            got.e[k] == want.e[k] && (got.e[k].to_bits() == want.e[k].to_bits() || got.e[k] == 0.0),
            "{label}[{k}]: rust {} != web {}",
            got.e[k],
            want.e[k]
        );
    }
}

fn solids() -> TerrainSolids {
    let g = load("geometry.json");
    let s = g.get("solids");
    let conv = |k: &str| {
        s.get(k)
            .arr()
            .iter()
            .map(|a| TriGeometry::new(f32s(a), None))
            .collect::<Vec<_>>()
    };
    TerrainSolids {
        gora: conv("gora"),
        wzgorze: conv("wzgorze"),
    }
}

struct MapFixture {
    w: u32,
    h: u32,
    scene: TerrainPickScene,
    units: Vec<UnitPickModel>,
    json: Json,
}

fn build_maps() -> BTreeMap<String, MapFixture> {
    let scenes = load("scenes.json");
    let solids = solids();
    let mut out = BTreeMap::new();
    for (name, m) in scenes.get("maps").obj() {
        let hexes: Vec<MapHex> = m
            .get("hexes")
            .arr()
            .iter()
            .map(|h| MapHex {
                coord: HexCoord::new(h.get("q").i32(), h.get("r").i32()),
                terrain: Terrain::from_web_id(h.get("t").str()).expect("terrain id"),
                prism_hidden: h.get("hidden").bool(),
                solid_hidden: h.get("solidHidden").bool(),
                terraces: h.get("tarasy").bool(),
            })
            .collect();
        let opts = TerrainSceneOptions {
            seed: m.get("seed").i32(),
            solids_visible: m.get("solidsVisible").bool(),
        };
        let scene = build_terrain_pick_scene(&hexes, Some(&solids), opts);
        let units = m
            .get("units")
            .arr()
            .iter()
            .map(|u| UnitPickModel {
                id: u.get("id").str().to_string(),
                hex: HexCoord::new(u.get("q").i32(), u.get("r").i32()),
                meshes: u
                    .get("meshes")
                    .arr()
                    .iter()
                    .map(|mm| PickMesh {
                        geometry: TriGeometry::new(
                            f32s(mm.get("pos")),
                            mm.opt("index").filter(|i| !i.is_null()).map(u32s),
                        ),
                        world: mat(mm.get("world")),
                        side: match mm.get("side").str() {
                            "front" => Side::Front,
                            "back" => Side::Back,
                            _ => Side::Double,
                        },
                    })
                    .collect(),
            })
            .collect();
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        let (w, h) = (m.get("W").num() as u32, m.get("H").num() as u32);
        out.insert(
            name.clone(),
            MapFixture {
                w,
                h,
                scene,
                units,
                json: m.clone(),
            },
        );
    }
    out
}

// ---------------------------------------------------------------------------
// Pure math

#[test]
fn js_round_matches_math_round() {
    let m = load("math.json");
    let cases = m.get("mathRound").arr();
    for c in cases {
        let v = c.get("v").num();
        let want = c.get("round").num();
        assert!(
            js_round(v) == want,
            "Math.round({v}) = {want}, rust {}",
            js_round(v)
        );
    }
    // the documented divergences of f64::round and of (x + 0.5).floor()
    assert_eq!(js_round(-0.5), 0.0);
    assert_eq!((-0.5f64).round(), -1.0);
    assert_eq!(js_round(0.499_999_999_999_999_94), 0.0);
    assert_eq!((0.499_999_999_999_999_94f64 + 0.5).floor(), 1.0);
    assert!(cases.len() >= 20);
}

#[test]
fn world_to_axial_both_variants_match_web() {
    let m = load("math.json");
    let cases = m.get("worldToAxial").arr();
    let mut variant_diff = 0;
    for c in cases {
        let (x, z) = (c.get("x").num(), c.get("z").num());
        let p = world_to_axial_picker(x, z, HEX_R);
        let h = world_to_axial_hexutil(x, z, HEX_R);
        assert_eq!(
            Some(p),
            c.get("picker").hex(),
            "picker.ts worldToAxial({x}, {z}) [{}]",
            c.get("tag").str()
        );
        assert_eq!(
            Some(h),
            c.get("hexutil").hex(),
            "hexutil.ts worldToAxial({x}, {z}) [{}]",
            c.get("tag").str()
        );
        if p != h {
            variant_diff += 1;
        }
    }
    eprintln!(
        "worldToAxial vectors: {} (variants differ on {variant_diff})",
        cases.len()
    );
    assert!(cases.len() > 1000);
    assert!(
        variant_diff > 0,
        "fixture must contain dr == ds ties where the variants differ"
    );
}

#[test]
fn client_rect_to_ndc_matches_web() {
    let m = load("math.json");
    for c in m.get("clientRectToNdc").arr() {
        let r = c.get("rect");
        let rect = ClientRect {
            left: r.get("left").num(),
            top: r.get("top").num(),
            width: r.get("width").num(),
            height: r.get("height").num(),
        };
        let got = client_rect_to_ndc(c.get("x").num(), c.get("y").num(), &rect);
        let want = c.get("ndc");
        match got {
            None => assert!(want.is_null()),
            Some((x, y)) => {
                assert_eq!(x.to_bits(), want.get("x").num().to_bits());
                assert_eq!(y.to_bits(), want.get("y").num().to_bits());
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Scene construction

#[test]
fn prism_geometry_is_bitwise_three_cylinder() {
    let g = load("geometry.json");
    let prisms = g.get("prisms").obj();
    assert!(prisms.len() >= 5);
    for (_, p) in prisms {
        let radius = p.get("radius").num();
        let height = p.get("height").num();
        assert_eq!(
            radius.to_bits(),
            (HEX_R * ROBLOX_PRISM_RADIUS_FACTOR).to_bits()
        );
        let ours = hex_prism_no_bottom(radius, height);
        let want = f32s(p.get("pos"));
        assert_eq!(ours.positions.len(), want.len());
        for (a, b) in ours.positions.iter().zip(&want) {
            assert_eq!(a.to_bits(), b.to_bits(), "prism h={height} vertex differs");
        }
        assert_eq!(ours.index.as_deref(), Some(u32s(p.get("index")).as_slice()));
    }
}

#[test]
fn terrain_scene_instances_are_bitwise_web() {
    let maps = build_maps();
    let mut total = 0;
    for (name, mf) in &maps {
        let kinds = mf.json.get("meshKinds").arr();
        assert_eq!(kinds.len(), mf.scene.meshes.len(), "map {name}: mesh count");
        for (k, kind) in kinds.iter().zip(&mf.scene.kinds) {
            let ok = match kind {
                TerrainMeshKind::Prism(_) => k.str() == "prism",
                TerrainMeshKind::Gora(v) => k.str() == format!("gora-g{v}"),
                TerrainMeshKind::Wzgorze(v) => k.str() == format!("wzgorze-w{v}"),
            };
            assert!(ok, "map {name}: mesh kind {kind:?} vs {}", k.str());
        }
        let insts = mf.json.get("instances").arr();
        let ours: usize = mf.scene.meshes.iter().map(|m| m.matrices.len()).sum();
        assert_eq!(ours, insts.len(), "map {name}: instance count");
        for it in insts {
            #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
            let (mi, i) = (it.get("mesh").num() as usize, it.get("i").num() as usize);
            let mesh = &mf.scene.meshes[mi];
            let want = f32s(it.get("m"));
            for (a, b) in mesh.matrices[i].iter().zip(&want) {
                assert_eq!(
                    a.to_bits(),
                    b.to_bits(),
                    "map {name} mesh {mi} instance {i}: matrix differs"
                );
            }
            let key = mesh.hexes[i].map(|h| format!("{},{}", h.q, h.r));
            assert_eq!(
                key.as_deref(),
                it.get("key").opt_str(),
                "map {name} mesh {mi} instance {i}: key"
            );
            total += 1;
        }
    }
    eprintln!("instance matrices compared bitwise: {total}");
}

trait OptStr {
    fn opt_str(&self) -> Option<&str>;
}
impl OptStr for Json {
    fn opt_str(&self) -> Option<&str> {
        if self.is_null() {
            None
        } else {
            Some(self.str())
        }
    }
}

// ---------------------------------------------------------------------------
// Camera and golden picks

fn scenario_camera(s: &Json, mf: &MapFixture) -> (PickCamera, ClientRect) {
    let c = s.get("camera");
    let cam = PickCamera {
        target_x: c.get("tx").num(),
        target_z: c.get("tz").num(),
        dist: c.get("dist").num(),
        far: far_clip_roblox(mf.w, mf.h),
    };
    assert_eq!(cam.far.to_bits(), c.get("far").num().to_bits(), "farClip");
    let r = s.get("rect");
    let rect = ClientRect {
        left: r.get("left").num(),
        top: r.get("top").num(),
        width: r.get("width").num(),
        height: r.get("height").num(),
    };
    (cam, rect)
}

#[test]
fn camera_matrices_and_rays_are_bitwise_three() {
    let maps = build_maps();
    let golden = load("golden_pick.json");
    let mut rays = 0;
    for s in golden.get("scenarios").arr() {
        let mf = &maps[s.get("map").str()];
        let (cam, rect) = scenario_camera(s, mf);
        let m = cam.matrices(rect.width, rect.height);
        assert_mat_bits("matrixWorld", &m.world, &mat(s.get("cameraMatrixWorld")));
        assert_mat_bits("projectionMatrix", &m.projection, &mat(s.get("projection")));
        assert_mat_bits(
            "projectionMatrixInverse",
            &m.projection_inverse,
            &mat(s.get("projectionInverse")),
        );
        for r in s.get("rays").arr() {
            let ndc = r.get("ndc").f64s();
            let ray = m.ray_from_ndc(ndc[0], ndc[1]);
            let o = r.get("o").f64s();
            let d = r.get("d").f64s();
            assert_eq!(
                [ray.origin.x, ray.origin.y, ray.origin.z].map(f64::to_bits),
                [o[0], o[1], o[2]].map(f64::to_bits)
            );
            assert_eq!(
                [ray.direction.x, ray.direction.y, ray.direction.z].map(f64::to_bits),
                [d[0], d[1], d[2]].map(f64::to_bits),
                "ray direction ndc {ndc:?}"
            );
            rays += 1;
        }
    }
    eprintln!("camera rays compared bitwise: {rays}");
}

#[test]
fn golden_picks_match_web_100_percent() {
    let maps = build_maps();
    let golden = load("golden_pick.json");
    let mut total = 0usize;
    let mut unit_points = 0usize;
    let mut by_via: BTreeMap<String, usize> = BTreeMap::new();
    let mut by_tag: BTreeMap<String, usize> = BTreeMap::new();
    let mut failures = Vec::new();
    for (si, s) in golden.get("scenarios").arr().iter().enumerate() {
        let mf = &maps[s.get("map").str()];
        let (cam, rect) = scenario_camera(s, mf);
        let m = cam.matrices(rect.width, rect.height);
        for p in s.get("points").arr() {
            let (x, y) = (p.get("x").num(), p.get("y").num());
            let want_hex = p.get("h").hex();
            let want_target = p.opt("t").map_or(want_hex, Json::hex);
            let got_hex = pixel_to_hex(&m, &rect, x, y, &mf.scene);
            let got_target = pick_map_target(&m, &rect, x, y, &mf.units, &mf.scene);
            total += 1;
            *by_tag.entry(p.get("k").str().to_string()).or_default() += 1;
            if let Some(h) = got_hex {
                *by_via.entry(format!("{:?}", h.via)).or_default() += 1;
            }
            if matches!(got_target, Some(MapPick::Unit { .. })) {
                unit_points += 1;
            }
            if got_hex.map(|h| h.hex) != want_hex || got_target.map(|t| t.hex()) != want_target {
                failures.push(format!(
                    "scenario {si} map {} dist {} point ({x}, {y}) [{}]: web hex {want_hex:?} target {want_target:?}, rust hex {:?} target {:?}",
                    s.get("map").str(),
                    s.get("camera").get("dist").num(),
                    p.get("k").str(),
                    got_hex,
                    got_target
                ));
            }
        }
    }
    eprintln!("golden points: {total}, units-first wins: {unit_points}");
    eprintln!("by rule: {by_via:?}");
    eprintln!("by point kind: {by_tag:?}");
    assert!(
        failures.is_empty(),
        "{} / {total} mismatches, first: {:#?}",
        failures.len(),
        &failures[..failures.len().min(10)]
    );
    for via in [
        "TopFace",
        "SideMatch",
        "SideFallback",
        "PlaneRefined",
        "PlaneCoarse",
    ] {
        assert!(
            by_via.get(via).copied().unwrap_or(0) > 0,
            "rule {via} not covered by the golden set"
        );
    }
    assert!(unit_points > 0, "units-first rule not covered");
    assert!(total >= 1000);
    // FirstVisibleHit / UnresolvedTopFace: see P4-10 (not reachable / not covered).
    let _ = PickVia::FirstVisibleHit;
}
