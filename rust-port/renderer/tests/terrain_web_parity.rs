//! RR-T2a terrain tests: the Rust terrain build (`civ_renderer::terrain`)
//! against buffers produced by the **web** code (`buildScene` fragments of
//! `scene.ts` + unchanged `mapRenderStyle.ts` & co. from `edb8fb56`,
//! three@0.169.0), see `tests/fixtures/terrain/README.md` and
//! `dyspozycje/rust-port/p4/P4-11-CAMERA-TERRAIN-CPU.md`.
//!
//! Every scalar is compared bit for bit and the tests require bit equality.
//! The report separately counts values that differ but stay within 1e-6 (the
//! P4.8/P4.10 tolerance) so that a platform libm difference would be visible
//! as such. Any structural difference (counts, keys, indices, layer order)
//! fails too.

#![allow(clippy::float_cmp)]

use std::collections::HashSet;
use std::path::PathBuf;

use civ_renderer::geom::Mesh;
use civ_renderer::pick::hex::HexCoord;
use civ_renderer::pick::terrain::Terrain;
use civ_renderer::terrain::coast::js_hypot;
use civ_renderer::terrain::color::Color;
use civ_renderer::terrain::jsmath::js_pow;
use civ_renderer::terrain::{
    build_terrain, roblox_lite, InstanceLayer, MapDetailQuality, RiverKind, RiverPath, TerrainHex,
    TerrainInput, TerrainScene, FOG_EXPLORED_BRIGHTNESS,
};

// ---------------------------------------------------------------------------
// Minimal JSON reader (the crate has no dependencies; fixtures are trusted
// files produced by the reference script). Same reader as tests/pick_golden.rs.

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
        "terrain",
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

const MAPS: [&str; 7] = ["A", "A-lite", "B", "C", "D", "E", "F"];

fn key(s: &str) -> HexCoord {
    let (q, r) = s.split_once(',').expect("key q,r");
    HexCoord::new(q.parse().expect("q"), r.parse().expect("r"))
}

fn keys(j: &Json) -> Vec<HexCoord> {
    j.arr().iter().map(|k| key(k.str())).collect()
}

/// Bit-exact / within-1e-6 / outside counters.
#[derive(Default, Debug)]
struct Tally {
    scalars: usize,
    exact: usize,
    close: usize,
    bad: usize,
    log: Vec<String>,
}

impl Tally {
    fn num(&mut self, what: &str, got: f64, want: f64) {
        self.scalars += 1;
        if got.to_bits() == want.to_bits() || (got == 0.0 && want == 0.0) {
            self.exact += 1;
        } else if (got - want).abs() <= 1e-6 {
            self.close += 1;
            if self.log.len() < 30 {
                self.log
                    .push(format!("close {what}: rust {got:e} web {want:e}"));
            }
        } else {
            self.bad += 1;
            if self.log.len() < 30 {
                self.log
                    .push(format!("BAD {what}: rust {got:e} web {want:e}"));
            }
        }
    }
    fn f32s(&mut self, what: &str, got: &[f32], want: &Json) {
        let w = want.arr();
        if got.len() != w.len() {
            self.structural(&format!("{what}: len {} vs {}", got.len(), w.len()));
            return;
        }
        for (i, (g, v)) in got.iter().zip(w).enumerate() {
            self.num(&format!("{what}[{i}]"), f64::from(*g), v.num());
        }
    }
    fn f64s(&mut self, what: &str, got: &[f64], want: &Json) {
        let w = want.arr();
        if got.len() != w.len() {
            self.structural(&format!("{what}: len {} vs {}", got.len(), w.len()));
            return;
        }
        for (i, (g, v)) in got.iter().zip(w).enumerate() {
            self.num(&format!("{what}[{i}]"), *g, v.num());
        }
    }
    fn structural(&mut self, msg: &str) {
        self.bad += 1;
        if self.log.len() < 30 {
            self.log.push(format!("STRUCT {msg}"));
        }
    }
    fn eq<T: PartialEq + std::fmt::Debug>(&mut self, what: &str, got: &T, want: &T) {
        if got != want {
            self.structural(&format!("{what}: rust {got:?} web {want:?}"));
        }
    }
}

fn input_of(
    m: &Json,
) -> (
    Vec<TerrainHex>,
    Vec<RiverPath>,
    i32,
    u32,
    u32,
    MapDetailQuality,
) {
    let hexes = m
        .get("hexes")
        .arr()
        .iter()
        .map(|h| {
            let a = h.arr();
            TerrainHex {
                coord: HexCoord::new(a[0].i32(), a[1].i32()),
                terrain: Terrain::from_web_id(a[2].str()).expect("terrain id"),
                terraces: a[3].num() != 0.0,
            }
        })
        .collect();
    let rivers = m
        .get("rivers")
        .arr()
        .iter()
        .map(|r| RiverPath {
            hexes: r
                .get("path")
                .arr()
                .iter()
                .map(|p| {
                    let a = p.arr();
                    HexCoord::new(a[0].i32(), a[1].i32())
                })
                .collect(),
            kind: if r.get("kind").is_null() {
                None
            } else {
                Some(RiverKind::from_web_id(r.get("kind").str()).expect("river kind"))
            },
        })
        .collect();
    let detail = match m.get("mapDetailQuality").str() {
        "low" => MapDetailQuality::Low,
        "medium" => MapDetailQuality::Medium,
        _ => MapDetailQuality::High,
    };
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let (w, h) = (m.get("W").num() as u32, m.get("H").num() as u32);
    (hexes, rivers, m.get("seed").i32(), w, h, detail)
}

fn cmp_geo(t: &mut Tally, what: &str, g: &Mesh, j: &Json) {
    t.f32s(&format!("{what}.pos"), &g.positions, j.get("pos"));
    t.f32s(&format!("{what}.nor"), &g.normals, j.get("nor"));
    t.f32s(&format!("{what}.uv"), &g.uvs, j.get("uv"));
    let want_idx: Option<Vec<u32>> = if j.get("idx").is_null() {
        None
    } else {
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        Some(j.get("idx").arr().iter().map(|v| v.num() as u32).collect())
    };
    t.eq(&format!("{what}.idx"), &g.indices, &want_idx);
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let want_groups: Vec<[u32; 3]> = j
        .get("groups")
        .arr()
        .iter()
        .map(|gr| {
            let a = gr.arr();
            [a[0].num() as u32, a[1].num() as u32, a[2].num() as u32]
        })
        .collect();
    let got_groups: Vec<[u32; 3]> = g
        .groups
        .iter()
        .map(|gr| [gr.start, gr.count, gr.material_index])
        .collect();
    t.eq(&format!("{what}.groups"), &got_groups, &want_groups);
}

fn cmp_layer(t: &mut Tally, what: &str, l: &InstanceLayer, j: &Json, with_geo: bool) {
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let count = j.get("count").num() as usize;
    t.eq(&format!("{what}.count"), &l.matrices.len(), &count);
    if with_geo {
        cmp_geo(t, &format!("{what}.geo"), &l.geometry, j.get("geo"));
        t.f64s(&format!("{what}.mat"), &l.material_color, j.get("mat"));
        t.eq(
            &format!("{what}.flat"),
            &l.flat_shading,
            &j.get("flat").bool(),
        );
    }
    t.f32s(&format!("{what}.m"), &l.matrices_flat(), j.get("m"));
    t.f32s(&format!("{what}.c"), &l.colors_flat(), j.get("c"));
    if let Some(k) = j.opt("keys") {
        t.eq(&format!("{what}.keys"), &l.hexes, &keys(k));
    }
}

fn cmp_build(t: &mut Tally, name: &str, s: &TerrainScene, b: &Json) {
    t.eq(
        &format!("{name}.lite"),
        &s.roblox_lite,
        &b.get("robloxLite").bool(),
    );
    let mut want_delta: Vec<HexCoord> = keys(b.get("deltaKeys"));
    want_delta.sort();
    let mut got_delta: Vec<HexCoord> = s.delta_hexes.iter().copied().collect();
    got_delta.sort();
    t.eq(&format!("{name}.delta"), &got_delta, &want_delta);
    let mut want_mouth: Vec<(HexCoord, HexCoord)> = b
        .get("mouthEdges")
        .arr()
        .iter()
        .map(|e| {
            let (a, c) = e.str().split_once('|').expect("edge");
            (key(a), key(c))
        })
        .collect();
    want_mouth.sort();
    let mut got_mouth: Vec<(HexCoord, HexCoord)> = s.mouth_edges.iter().copied().collect();
    got_mouth.sort();
    t.eq(&format!("{name}.mouth"), &got_mouth, &want_mouth);

    let wp = b.get("prisms").arr();
    t.eq(&format!("{name}.prisms.len"), &s.prisms.len(), &wp.len());
    for ((tt, l), j) in s.prisms.iter().zip(wp) {
        t.eq(
            &format!("{name}.prism.t"),
            &Some(*tt),
            &Terrain::from_web_id(j.get("t").str()),
        );
        cmp_layer(t, &format!("{name}.prism[{tt:?}]"), l, j, true);
    }
    let wb = b.get("blended").arr();
    t.eq(
        &format!("{name}.blended.len"),
        &s.blended_hex.len(),
        &wb.len(),
    );
    for ((h, hex), j) in s.blended_hex.iter().zip(wb) {
        t.eq(&format!("{name}.blended.key"), h, &key(j.get("key").str()));
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        let want = j.get("blended").num() as u32;
        t.eq(&format!("{name}.blended[{h:?}]"), hex, &want);
        let bc = s.base_color(*h).expect("base colour");
        t.f64s(
            &format!("{name}.base[{h:?}]"),
            &bc.to_array(),
            j.get("base"),
        );
    }
    for (label, got, want) in [
        ("gora", &s.gora, b.get("gora")),
        ("wzgorze", &s.wzgorze, b.get("wzgorze")),
    ] {
        let w = want.arr();
        t.eq(&format!("{name}.{label}.len"), &got.len(), &w.len());
        for (g, j) in got.iter().zip(w) {
            #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
            let count = j.get("count").num() as usize;
            t.eq(
                &format!("{name}.{label}[{}].count", g.variant),
                &g.matrices.len(),
                &count,
            );
            let flat: Vec<f32> = g.matrices.iter().flatten().copied().collect();
            t.f32s(
                &format!("{name}.{label}[{}].m", g.variant),
                &flat,
                j.get("m"),
            );
            t.eq(
                &format!("{name}.{label}[{}].keys", g.variant),
                &g.hexes,
                &keys(j.get("keys")),
            );
        }
    }
    let wc = b.get("coast").arr();
    t.eq(&format!("{name}.coast.len"), &s.coast.len(), &wc.len());
    for ((kind, l), j) in s.coast.iter().zip(wc) {
        t.eq(
            &format!("{name}.coast.layer"),
            &kind.web_name(),
            &j.get("layer").str(),
        );
        t.eq(
            &format!("{name}.coast.renderOrder"),
            &f64::from(l.render_order),
            &j.get("renderOrder").num(),
        );
        cmp_layer(t, &format!("{name}.coast[{}]", kind.web_name()), l, j, true);
    }
    let bd = b.get("backdrop");
    let got = s.backdrop.as_ref().expect("backdrop");
    t.num(&format!("{name}.bedY"), got.bed_y, bd.get("bedY").num());
    cmp_geo(
        t,
        &format!("{name}.ocean.geo"),
        &got.ocean.geometry,
        bd.get("ocean").get("geo"),
    );
    t.f64s(
        &format!("{name}.ocean.world"),
        &got.ocean.world.e,
        bd.get("ocean").get("world"),
    );
    t.f64s(
        &format!("{name}.ocean.mat"),
        &got.ocean_color,
        bd.get("ocean").get("mat"),
    );
    t.f64s(
        &format!("{name}.frame.mat"),
        &got.frame_color,
        bd.get("frameMat"),
    );
    let wf = bd.get("frame").arr();
    t.eq(&format!("{name}.frame.len"), &got.frame.len(), &wf.len());
    for (i, (f, j)) in got.frame.iter().zip(wf).enumerate() {
        cmp_geo(
            t,
            &format!("{name}.frame[{i}].geo"),
            &f.geometry,
            j.get("geo"),
        );
        t.f64s(
            &format!("{name}.frame[{i}].world"),
            &f.world.e,
            j.get("world"),
        );
    }
}

struct MapReport {
    build: Tally,
    fog: Tally,
    instances: usize,
    fog_calls: usize,
}

fn run_map(name: &str) -> MapReport {
    let m = load(&format!("map_{name}.json"));
    let (hexes, rivers, seed, w, h, detail) = input_of(&m);
    let mut scene = build_terrain(&TerrainInput {
        seed,
        width: w,
        height: h,
        hexes: &hexes,
        rivers: &rivers,
        detail,
    });
    let mut build = Tally::default();
    cmp_build(&mut build, name, &scene, m.get("build"));
    let instances = scene
        .prisms
        .iter()
        .map(|(_, l)| l.matrices.len())
        .sum::<usize>()
        + scene
            .gora
            .iter()
            .chain(&scene.wzgorze)
            .map(|g| g.matrices.len())
            .sum::<usize>()
        + scene
            .coast
            .iter()
            .map(|(_, l)| l.matrices.len())
            .sum::<usize>();
    let mut fog = Tally::default();
    let calls = m.get("fog").arr();
    for (ci, call) in calls.iter().enumerate() {
        let c = call.get("call");
        let vis: HashSet<HexCoord> = keys(c.get("visible")).into_iter().collect();
        let exp: HashSet<HexCoord> = keys(c.get("explored")).into_iter().collect();
        let show = scene.set_fog(&vis, &exp, c.get("landReveal").bool());
        fog.eq(
            &format!("{name}.fog[{ci}].show"),
            &show,
            &call.get("show").bool(),
        );
        for ((tt, l), j) in scene.prisms.iter().zip(call.get("prisms").arr()) {
            fog.f32s(
                &format!("{name}.fog[{ci}][{tt:?}].m"),
                &l.matrices_flat(),
                j.get("m"),
            );
            fog.f32s(
                &format!("{name}.fog[{ci}][{tt:?}].c"),
                &l.colors_flat(),
                j.get("c"),
            );
        }
    }
    MapReport {
        build,
        fog,
        instances,
        fog_calls: calls.len(),
    }
}

fn print_tally(label: &str, t: &Tally) {
    println!(
        "{label}: scalars={} exact={} within1e-6={} bad={}",
        t.scalars, t.exact, t.close, t.bad
    );
    for l in &t.log {
        println!("    {l}");
    }
}

#[test]
fn terrain_build_matches_web() {
    let mut total = Tally::default();
    let mut inst = 0;
    for name in MAPS {
        let r = run_map(name);
        print_tally(
            &format!("map {name} build (instances {})", r.instances),
            &r.build,
        );
        inst += r.instances;
        total.scalars += r.build.scalars;
        total.exact += r.build.exact;
        total.close += r.build.close;
        total.bad += r.build.bad;
    }
    println!(
        "TOTAL build: maps={} instances={inst} scalars={} exact={} within1e-6={} bad={}",
        MAPS.len(),
        total.scalars,
        total.exact,
        total.close,
        total.bad
    );
    assert_eq!(total.bad, 0, "terrain build differs from the web");
    assert_eq!(
        total.close, 0,
        "terrain build is not bit-identical to the web"
    );
}

#[test]
fn terrain_fog_matches_web() {
    let mut total = Tally::default();
    let mut calls = 0;
    for name in MAPS {
        let r = run_map(name);
        if r.fog_calls == 0 {
            continue;
        }
        calls += r.fog_calls;
        print_tally(&format!("map {name} fog ({} calls)", r.fog_calls), &r.fog);
        total.scalars += r.fog.scalars;
        total.exact += r.fog.exact;
        total.close += r.fog.close;
        total.bad += r.fog.bad;
    }
    println!(
        "TOTAL fog: calls={calls} scalars={} exact={} within1e-6={} bad={}",
        total.scalars, total.exact, total.close, total.bad
    );
    assert!(calls >= 16, "fixture too small");
    assert_eq!(total.bad, 0, "fog buffers differ from the web");
    assert_eq!(
        total.close, 0,
        "fog buffers are not bit-identical to the web"
    );
}

#[test]
fn color_math_matches_three() {
    let c = load("color.json");
    assert_eq!(c.get("fogExplored").num(), FOG_EXPLORED_BRIGHTNESS);
    let mut t = Tally::default();
    let mut hex_bad = 0usize;
    for v in c.get("setHex").arr() {
        let a = v.f64s();
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        let col = Color::from_hex(a[0] as u32);
        t.num("setHex.r", col.r, a[1]);
        t.num("setHex.g", col.g, a[2]);
        t.num("setHex.b", col.b, a[3]);
    }
    for v in c.get("getHex").arr() {
        let a = v.f64s();
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        let want = a[3] as u32;
        if Color::rgb(a[0], a[1], a[2]).to_hex() != want {
            hex_bad += 1;
        }
    }
    for v in c.get("hsl").arr() {
        let a = v.f64s();
        let hsl = Color::rgb(a[0], a[1], a[2]).hsl();
        t.num("getHSL.h", hsl.h, a[3]);
        t.num("getHSL.s", hsl.s, a[4]);
        t.num("getHSL.l", hsl.l, a[5]);
        let d = Color::from_hsl(a[6], a[7], a[8]);
        t.num("setHSL.r", d.r, a[9]);
        t.num("setHSL.g", d.g, a[10]);
        t.num("setHSL.b", d.b, a[11]);
    }
    let mut pow_bad = 0usize;
    for v in c.get("pow").arr() {
        let a = v.arr();
        let (x, y) = (a[0].num(), a[1].num());
        let got = js_pow(x, y);
        let ok = match &a[2] {
            Json::Null => got.is_nan(),
            Json::Str(s) if s == "inf" => got == f64::INFINITY,
            Json::Str(s) if s == "-inf" => got == f64::NEG_INFINITY,
            w => got.to_bits() == w.num().to_bits() || (got == 0.0 && w.num() == 0.0),
        };
        if !ok {
            pow_bad += 1;
            if pow_bad < 10 {
                println!("    pow({x:e}, {y:e}) rust {got:e} web {:?}", a[2]);
            }
        }
    }
    let mut hypot_bad = 0usize;
    for v in c.get("hypot").arr() {
        let a = v.f64s();
        if js_hypot(a[0], a[1]).to_bits() != a[2].to_bits() {
            hypot_bad += 1;
        }
    }
    let mut preset_bad = 0;
    for v in c.get("preset").arr() {
        let a = v.arr();
        let d = match a[0].str() {
            "low" => MapDetailQuality::Low,
            "medium" => MapDetailQuality::Medium,
            _ => MapDetailQuality::High,
        };
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        let n = a[1].num() as usize;
        if roblox_lite(d, n) != a[2].bool() {
            preset_bad += 1;
        }
    }
    print_tally(
        &format!(
            "color: getHex cases={} mismatches={hex_bad}; Math.pow cases={} mismatches={pow_bad}; Math.hypot cases={} mismatches={hypot_bad}; preset cases={} mismatches={preset_bad}",
            c.get("getHex").arr().len(),
            c.get("pow").arr().len(),
            c.get("hypot").arr().len(),
            c.get("preset").arr().len()
        ),
        &t,
    );
    assert_eq!(hex_bad, 0);
    assert_eq!(pow_bad, 0);
    assert_eq!(preset_bad, 0);
    assert_eq!(hypot_bad, 0);
    assert_eq!(t.bad, 0);
    assert_eq!(t.close, 0, "colour math is not bit-identical to three");
}

#[test]
fn fog_hides_unknown_and_dims_explored() {
    // Semantics check independent of the fixture (A: 9x7).
    let m = load("map_A.json");
    let (hexes, rivers, seed, w, h, detail) = input_of(&m);
    let mut s = build_terrain(&TerrainInput {
        seed,
        width: w,
        height: h,
        hexes: &hexes,
        rivers: &rivers,
        detail,
    });
    let land = HexCoord::new(1, 2); // Laka (row 'PLRDLWGPM')
    let other = HexCoord::new(2, 2); // Rownina
    let vis: HashSet<HexCoord> = [land].into_iter().collect();
    let exp: HashSet<HexCoord> = [land, other].into_iter().collect();
    assert!(
        !s.set_fog(&vis, &exp, false),
        "hidden hexes exist → no ocean backdrop"
    );
    let laka = s.prism_layer(Terrain::Laka).expect("laka");
    let i = laka.hexes.iter().position(|x| *x == land).expect("hex");
    assert_eq!(laka.colors[i], s.base_color(land).expect("c").to_f32());
    let ro = s.prism_layer(Terrain::Rownina).expect("rownina");
    let j = ro.hexes.iter().position(|x| *x == other).expect("hex");
    assert_eq!(
        ro.colors[j],
        s.base_color(other)
            .expect("c")
            .scale(FOG_EXPLORED_BRIGHTNESS)
            .to_f32()
    );
    let sea = s.prism_layer(Terrain::Morze).expect("morze");
    assert!(sea
        .matrices
        .iter()
        .all(|mm| mm[..15].iter().all(|v| *v == 0.0) && mm[15] == 1.0));
    let all: HashSet<HexCoord> = hexes.iter().map(|x| x.coord).collect();
    assert!(
        s.set_fog(&all, &all, false),
        "everything known → ocean backdrop"
    );
    let sea = s.prism_layer(Terrain::Morze).expect("morze");
    assert!(
        sea.matrices.iter().all(|mm| mm[0] == 0.0),
        "ocean-hide zeroes water prisms"
    );
    let laka = s.prism_layer(Terrain::Laka).expect("laka");
    assert!(
        laka.matrices.iter().all(|mm| mm[0] == 1.0),
        "land prisms visible"
    );
}

#[test]
fn js_pow_special_cases_follow_v8() {
    // ECMAScript / V8 `ieee754::pow` special values (spec 6.1.6.1.3).
    assert!(js_pow(1.0, f64::INFINITY).is_nan());
    assert!(js_pow(-1.0, f64::NEG_INFINITY).is_nan());
    assert!(js_pow(1.0, f64::NAN).is_nan());
    assert!(js_pow(f64::NAN, 1.0).is_nan());
    assert_eq!(js_pow(f64::NAN, 0.0), 1.0);
    assert_eq!(js_pow(-8.0, 3.0), -512.0);
    assert!(js_pow(-8.0, 1.0 / 3.0).is_nan());
    assert_eq!(js_pow(0.0, -1.0), f64::INFINITY);
    assert_eq!(js_pow(-0.0, -3.0), f64::NEG_INFINITY);
    assert_eq!(js_pow(2.0, 0.5), std::f64::consts::SQRT_2);
    assert_eq!(js_pow(10.0, 308.0), 1e308);
    assert_eq!(js_pow(2.0, -1074.0), f64::from_bits(1));
    assert_eq!(js_pow(2.0, 1024.0), f64::INFINITY);
}
