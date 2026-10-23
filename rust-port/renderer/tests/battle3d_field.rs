//! MOD-14 "battle 3D", part 2 (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q2): the
//! Rust `battle::field` port of the static battlefield of
//! `battle/battleScene.ts` against object graphs produced by RUNNING the web
//! code of `edb8fb56` (three@0.169.0, node v22.22.0): the full constructor
//! `new BattleScene(opts)` (empty armies, DOM stub) and the builders called
//! directly on synthetic grids — see `tests/fixtures/battle3d/README.md` and
//! `dyspozycje/rust-port/p4/P4-36-MOD14-BATTLE-3D.md` §11.
//!
//! Every node of every scene enters a FNV-1a signature of its full record
//! (kind, name, parent, position, Euler, quaternion, scale, world matrix,
//! shadows, visibility, `renderOrder`, material identity, geometry type /
//! hash / constructor parameters, instance matrices and colours, bounding
//! spheres, light parameters) — byte for byte the stream of `gen_field.ts`.
//! Signatures are compared per run of equal top-level children and for the
//! whole scene; the first nodes of each run and every material are also
//! compared field by field (`to_bits`). Any difference fails.

#![allow(clippy::float_cmp)]

use std::collections::HashMap;
use std::path::PathBuf;

use civ_renderer::battle::field::{
    self, blend, build_battle_scene, carve_wall_tiles, cell_to_world, euler_xyz_from_quaternion,
    geo_parameters, lighten, make_gable_roof_geometry, tile_top_y, BattleCamera, BattleSceneOpts,
    DeploySide, FieldScene, LightKind, TerrainGrid,
};
use civ_renderer::pick::three::Vec3 as PVec3;
use civ_renderer::scene::{geo_hash, Fnv, Geo, MaterialKind, NodeId, NodeKind, ROOT};

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

fn hex_bytes(s: &str) -> Vec<u8> {
    (0..s.len() / 2)
        .map(|i| u8::from_str_radix(&s[i * 2..i * 2 + 2], 16).expect("hex"))
        .collect()
}

fn hx32(s: &str) -> Vec<u32> {
    (0..s.len() / 8)
        .map(|i| u32::from_str_radix(&s[i * 8..i * 8 + 8], 16).expect("hex"))
        .collect()
}

fn f32_hex(v: &[f32]) -> String {
    v.iter().map(|x| format!("{:08x}", x.to_bits())).collect()
}

fn bytes_fnv(a: &[u8]) -> u32 {
    let mut f = Fnv::default();
    f.u32(u32::try_from(a.len()).expect("len"));
    for &b in a {
        f.byte(b);
    }
    f.finish()
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
// The byte stream of `gen_field.ts` (`nodeRecord`, `matSig`).

struct Rec {
    f: Fnv,
}

impl Rec {
    fn new() -> Self {
        Self { f: Fnv::default() }
    }
    fn str(&mut self, s: &str) {
        let units: Vec<u16> = s.encode_utf16().collect();
        self.f.u32(u32::try_from(units.len()).expect("len"));
        for u in units {
            self.f.u32(u32::from(u));
        }
    }
    fn bool(&mut self, b: bool) {
        self.f.byte(u8::from(b));
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum Kind {
    Scene,
    Group,
    Object3D,
    Mesh,
    Instanced,
    Line,
    Ambient,
    Hemisphere,
    Directional,
}

impl Kind {
    const fn code(self) -> u32 {
        match self {
            Self::Scene => 0,
            Self::Group => 1,
            Self::Object3D => 2,
            Self::Mesh => 3,
            Self::Instanced => 4,
            Self::Line => 5,
            Self::Ambient => 6,
            Self::Hemisphere => 7,
            Self::Directional => 8,
        }
    }
    const fn name(self) -> &'static str {
        match self {
            Self::Scene => "Scene",
            Self::Group => "Group",
            Self::Object3D => "Object3D",
            Self::Mesh => "Mesh",
            Self::Instanced => "InstancedMesh",
            Self::Line => "Line",
            Self::Ambient => "AmbientLight",
            Self::Hemisphere => "HemisphereLight",
            Self::Directional => "DirectionalLight",
        }
    }
}

/// Traverse index, material identities and world matrices of a field scene.
struct View<'a> {
    fs: &'a FieldScene,
    order: Vec<NodeId>,
    pos: HashMap<NodeId, usize>,
    world: Vec<civ_renderer::geom::Mat4>,
    mat_ids: HashMap<usize, usize>,
    mats: Vec<usize>,
    /// `geo_hash` per geometry value (thousands of tiles share one box).
    hashes: std::cell::RefCell<HashMap<String, u32>>,
}

impl<'a> View<'a> {
    fn new(fs: &'a FieldScene) -> Self {
        let order = fs.scene.traverse();
        let pos: HashMap<NodeId, usize> = order.iter().enumerate().map(|(i, &n)| (n, i)).collect();
        let world = fs.scene.world_matrices(None);
        let mut v = Self {
            fs,
            order,
            pos,
            world,
            mat_ids: HashMap::new(),
            mats: Vec::new(),
            hashes: std::cell::RefCell::new(HashMap::new()),
        };
        for i in 0..v.order.len() {
            if let Some(m) = v.material_of(v.order[i]) {
                if !v.mat_ids.contains_key(&m) {
                    v.mat_ids.insert(m, v.mats.len());
                    v.mats.push(m);
                }
            }
        }
        v
    }

    fn kind(&self, n: NodeId) -> Kind {
        if n == ROOT {
            return Kind::Scene;
        }
        if self.fs.instanced_at(n).is_some() {
            return Kind::Instanced;
        }
        if self.fs.line_at(n).is_some() {
            return Kind::Line;
        }
        if let Some(l) = self.fs.light_at(n) {
            return match l.kind {
                LightKind::Ambient => Kind::Ambient,
                LightKind::Hemisphere { .. } => Kind::Hemisphere,
                LightKind::Directional { .. } => Kind::Directional,
            };
        }
        match self.fs.scene.nodes[n].kind {
            NodeKind::Group => Kind::Group,
            NodeKind::Object3D => Kind::Object3D,
            NodeKind::Mesh(_) => Kind::Mesh,
            ref k => panic!("unexpected node kind {k:?}"),
        }
    }

    fn material_of(&self, n: NodeId) -> Option<usize> {
        if let Some(m) = self.fs.instanced_at(n) {
            return Some(m.material);
        }
        if let Some(l) = self.fs.line_at(n) {
            return Some(l.material);
        }
        self.fs.scene.nodes[n].mesh().map(|m| m.material())
    }

    fn geo_of(&self, n: NodeId) -> Option<&Geo> {
        if let Some(m) = self.fs.instanced_at(n) {
            return Some(&m.geo);
        }
        if let Some(l) = self.fs.line_at(n) {
            return Some(&l.geo);
        }
        self.fs.scene.nodes[n].mesh().map(|m| &m.geo)
    }

    fn ghash(&self, g: &Geo) -> u32 {
        let key = format!("{g:?}");
        if let Some(&h) = self.hashes.borrow().get(&key) {
            return h;
        }
        let h = geo_hash(&g.mesh());
        self.hashes.borrow_mut().insert(key, h);
        h
    }

    fn mat_type(&self, slot: usize) -> &'static str {
        let dashed = self
            .fs
            .lines
            .iter()
            .any(|l| l.material == slot && l.dash.is_some());
        if dashed {
            "LineDashedMaterial"
        } else {
            self.fs.scene.materials[slot].kind.three_type()
        }
    }

    fn mat_sig(&self, slot: usize) -> u32 {
        let m = &self.fs.scene.materials[slot];
        let mut r = Rec::new();
        let t = self.mat_type(slot);
        r.str(t);
        r.f.u32(m.hex());
        let c = m.linear_color();
        r.f.f64(c.r);
        r.f.f64(c.g);
        r.f.f64(c.b);
        r.f.u32(m.side.three_value());
        let has_flat = matches!(m.kind, MaterialKind::Lambert | MaterialKind::Standard);
        r.f.byte(if has_flat {
            u8::from(m.flat_shading)
        } else {
            2
        });
        r.bool(m.transparent);
        r.f.f64(m.opacity);
        r.bool(m.depth_write);
        r.bool(m.depth_test);
        r.bool(m.vertex_colors);
        if has_flat {
            r.f.byte(1);
            r.f.u32(m.emissive.to_hex());
            r.f.f64(m.emissive.r);
            r.f.f64(m.emissive.g);
            r.f.f64(m.emissive.b);
        } else {
            r.f.byte(0);
        }
        if m.kind == MaterialKind::Standard {
            r.f.f64(m.roughness);
            r.f.f64(m.metalness);
        }
        if let Some(l) = self.fs.lines.iter().find(|l| l.material == slot) {
            if let Some(d) = l.dash {
                r.f.f64(d.dash_size);
                r.f.f64(d.gap_size);
                r.f.f64(d.scale);
            }
        }
        r.f.finish()
    }

    fn parent_index(&self, n: NodeId) -> i64 {
        if n == ROOT {
            return -1;
        }
        self.fs.scene.nodes[n]
            .parent
            .and_then(|p| self.pos.get(&p))
            .map_or(-1, |&i| i64::try_from(i).expect("i64"))
    }

    fn label(&self, n: NodeId) -> String {
        let k = self.kind(n);
        match k {
            Kind::Mesh | Kind::Instanced | Kind::Line => {
                let g = self.geo_of(n).expect("geo");
                let mt = self.mat_type(self.material_of(n).expect("mat"));
                format!("{}:{}:{}:{}", k.name(), g.three_type(), self.ghash(g), mt)
            }
            _ => format!("{}:{}", k.name(), self.fs.scene.nodes[n].name),
        }
    }

    /// `nodeRecord` of `gen_field.ts` into `r`.
    #[allow(clippy::too_many_lines)]
    fn record(&self, n: NodeId, r: &mut Rec) {
        let node = &self.fs.scene.nodes[n];
        let k = self.kind(n);
        r.f.u32(k.code());
        r.str(&node.name);
        r.f.u32(u32::try_from(self.parent_index(n) + 1).expect("parent"));
        for v in [
            node.position.x,
            node.position.y,
            node.position.z,
            node.rotation.x,
            node.rotation.y,
            node.rotation.z,
        ] {
            r.f.f64(v);
        }
        r.str("XYZ");
        let q = node.quaternion;
        for v in [q.x, q.y, q.z, q.w, node.scale.x, node.scale.y, node.scale.z] {
            r.f.f64(v);
        }
        for v in self.world[n].e {
            r.f.f64(v);
        }
        r.bool(node.cast_shadow);
        r.bool(node.receive_shadow);
        r.bool(node.visible);
        #[allow(clippy::cast_sign_loss)]
        r.f.u32(node.render_order as u32);
        if matches!(k, Kind::Mesh | Kind::Instanced | Kind::Line) {
            let g = self.geo_of(n).expect("geo");
            let mid = self.mat_ids[&self.material_of(n).expect("mat")];
            r.f.u32(u32::try_from(mid).expect("mid"));
            r.str(g.three_type());
            r.f.u32(self.ghash(g));
            for v in geo_parameters(g) {
                r.f.f64(v);
            }
            if k == Kind::Line {
                let l = self.fs.line_at(n).expect("line");
                match &l.line_distances {
                    Some(d) => {
                        r.f.byte(1);
                        for &v in d {
                            r.f.f32(v);
                        }
                    }
                    None => r.f.byte(0),
                }
            }
        }
        if k == Kind::Instanced {
            let im = self.fs.instanced_at(n).expect("inst");
            r.f.u32(u32::try_from(im.capacity).expect("cap"));
            r.f.u32(u32::try_from(im.count).expect("count"));
            r.f.u32(f32_fnv(&im.matrices));
            match &im.colors {
                Some(c) => {
                    r.f.byte(1);
                    r.f.u32(f32_fnv(c));
                }
                None => r.f.byte(0),
            }
            match im.bounding_sphere {
                Some(s) => {
                    r.f.byte(1);
                    for v in [s.center.x, s.center.y, s.center.z, s.radius] {
                        r.f.f64(v);
                    }
                }
                None => r.f.byte(0),
            }
        }
        if let Some(l) = self.fs.light_at(n) {
            for v in [l.color.r, l.color.g, l.color.b, l.intensity] {
                r.f.f64(v);
            }
            match &l.kind {
                LightKind::Ambient => {}
                LightKind::Hemisphere { ground } => {
                    for v in [ground.r, ground.g, ground.b] {
                        r.f.f64(v);
                    }
                }
                LightKind::Directional {
                    target_node,
                    target_position,
                    shadow,
                } => {
                    let ti = target_node.map_or(0, |t| self.pos[&t] + 1);
                    r.f.u32(u32::try_from(ti).expect("ti"));
                    let s = shadow;
                    for v in [
                        target_position.x,
                        target_position.y,
                        target_position.z,
                        s.map_size.0,
                        s.map_size.1,
                        s.near,
                        s.far,
                        s.left,
                        s.right,
                        s.top,
                        s.bottom,
                        s.bias,
                        s.normal_bias,
                        s.radius,
                    ] {
                        r.f.f64(v);
                    }
                }
            }
        }
    }

    fn node_sig(&self, n: NodeId) -> u32 {
        let mut r = Rec::new();
        self.record(n, &mut r);
        r.f.finish()
    }
}

fn f32_fnv(a: &[f32]) -> u32 {
    let mut f = Fnv::default();
    for &v in a {
        f.f32(v);
    }
    f.finish()
}

/// Compares one dumped scene (`dumpScene` of `gen_field.ts`) with a Rust field scene.
#[allow(clippy::too_many_lines)]
fn compare_scene(c: &mut Cmp, id: &str, case: &Json, fs: &FieldScene) {
    let v = View::new(fs);
    c.eq(
        &format!("{id} nodeCount"),
        v.order.len(),
        usize::try_from(case.get("nodeCount").i64()).expect("n"),
    );
    // Whole-scene signature: root record, then every top-level child's subtree in order.
    let mut all = Rec::new();
    v.record(ROOT, &mut all);
    let top: Vec<NodeId> = fs.scene.nodes[ROOT].children.clone();
    let runs = case.get("runs").arr();
    let mut i = 0usize;
    let mut run_idx = 0usize;
    while i < top.len() {
        let lb = v.label(top[i]);
        let mut j = i;
        while j < top.len() && v.label(top[j]) == lb {
            j += 1;
        }
        let mut f = Rec::new();
        let mut nodes = 0usize;
        let mut sub: Vec<NodeId> = Vec::new();
        for &t in &top[i..j] {
            for n in fs.scene.traverse_from(t) {
                v.record(n, &mut f);
                v.record(n, &mut all);
                sub.push(n);
                nodes += 1;
            }
        }
        if let Some(w) = runs.get(run_idx) {
            let ctx = format!("{id} run {run_idx} ({lb})");
            c.eq(&format!("{ctx} label"), lb.as_str(), w.get("label").str());
            c.eq(
                &format!("{ctx} start"),
                i,
                usize::try_from(w.get("start").i64()).expect("s"),
            );
            c.eq(
                &format!("{ctx} children"),
                j - i,
                usize::try_from(w.get("children").i64()).expect("c"),
            );
            c.eq(
                &format!("{ctx} nodes"),
                nodes,
                usize::try_from(w.get("nodes").i64()).expect("n"),
            );
            c.eq(&format!("{ctx} sig"), f.f.finish(), w.get("sig").u32());
            for (k, full) in w.get("full").arr().iter().enumerate() {
                let n = sub[k];
                compare_full(c, &format!("{ctx} node {k}"), &v, n, full);
            }
        } else {
            c.err(format!("{id}: extra run {run_idx} ({lb}) in Rust"));
        }
        run_idx += 1;
        i = j;
    }
    c.eq(&format!("{id} runs"), run_idx, runs.len());
    c.eq(&format!("{id} sig"), all.f.finish(), case.get("sig").u32());
    // Materials: identity bijection (first use in traverse order) + content.
    let sigs = case.get("matSigs").arr();
    c.eq(&format!("{id} materials"), v.mats.len(), sigs.len());
    for (mid, (&slot, w)) in v.mats.iter().zip(sigs).enumerate() {
        c.eq(&format!("{id} mat {mid} sig"), v.mat_sig(slot), w.u32());
    }
    for w in case.get("matFull").arr() {
        let mid = usize::try_from(w.get("id").i64()).expect("id");
        let Some(&slot) = v.mats.get(mid) else {
            continue;
        };
        let m = &fs.scene.materials[slot];
        let ctx = format!("{id} mat {mid}");
        c.eq(&format!("{ctx} type"), v.mat_type(slot), w.get("t").str());
        c.eq(&format!("{ctx} hex"), m.hex(), w.get("color").u32());
        let lc = m.linear_color();
        c.fs(
            &format!("{ctx} lin"),
            &[lc.r, lc.g, lc.b],
            &w.get("lin").hx(),
        );
        c.eq(
            &format!("{ctx} side"),
            m.side.three_value(),
            w.get("side").u32(),
        );
        c.eq(
            &format!("{ctx} transparent"),
            m.transparent,
            w.get("transparent").bool(),
        );
        c.f(
            &format!("{ctx} opacity"),
            m.opacity,
            w.get("opacity").hx()[0],
        );
        c.eq(
            &format!("{ctx} depthWrite"),
            m.depth_write,
            w.get("dw").bool(),
        );
        if let Some(r) = w.opt("rough") {
            c.f(&format!("{ctx} rough"), m.roughness, r.hx()[0]);
            c.f(&format!("{ctx} metal"), m.metalness, w.get("metal").hx()[0]);
        }
        if let Some(e) = w.opt("emissive") {
            c.eq(&format!("{ctx} emissive"), m.emissive.to_hex(), e.u32());
        }
        if !w.get("flat").is_null() {
            c.eq(&format!("{ctx} flat"), m.flat_shading, w.get("flat").bool());
        }
    }
    let idx = |ns: &[NodeId]| -> Vec<i64> {
        ns.iter()
            .map(|n| v.pos.get(n).map_or(-1, |&i| i64::try_from(i).expect("i")))
            .collect()
    };
    let web_idx = |j: &Json| -> Vec<i64> { j.arr().iter().map(Json::i64).collect() };
    c.eq(
        &format!("{id} groundPick"),
        idx(&fs.ground_pick),
        web_idx(case.get("groundPick")),
    );
    c.eq(
        &format!("{id} deployZone"),
        idx(&fs.deploy_zone_meshes),
        web_idx(case.get("deployZone")),
    );
    c.eq(
        &format!("{id} deployGroup"),
        fs.deploy_group
            .map_or(-1, |g| i64::try_from(v.pos[&g]).expect("i")),
        case.get("deployGroup").i64(),
    );
}

fn compare_full(c: &mut Cmp, ctx: &str, v: &View<'_>, n: NodeId, w: &Json) {
    let node = &v.fs.scene.nodes[n];
    c.eq(
        &format!("{ctx} index"),
        i64::try_from(v.pos[&n]).expect("i"),
        w.get("i").i64(),
    );
    c.eq(&format!("{ctx} kind"), v.kind(n).name(), w.get("k").str());
    c.eq(
        &format!("{ctx} name"),
        node.name.as_str(),
        w.get("name").str(),
    );
    c.eq(
        &format!("{ctx} parent"),
        v.parent_index(n),
        w.get("parent").i64(),
    );
    c.fs(
        &format!("{ctx} p"),
        &[node.position.x, node.position.y, node.position.z],
        &w.get("p").hx(),
    );
    c.fs(
        &format!("{ctx} r"),
        &[node.rotation.x, node.rotation.y, node.rotation.z],
        &w.get("r").hx(),
    );
    let q = node.quaternion;
    c.fs(&format!("{ctx} q"), &[q.x, q.y, q.z, q.w], &w.get("q").hx());
    c.fs(
        &format!("{ctx} s"),
        &[node.scale.x, node.scale.y, node.scale.z],
        &w.get("s").hx(),
    );
    c.fs(&format!("{ctx} w"), &v.world[n].e, &w.get("w").hx());
    c.eq(&format!("{ctx} cs"), node.cast_shadow, w.get("cs").bool());
    c.eq(
        &format!("{ctx} rs"),
        node.receive_shadow,
        w.get("rs").bool(),
    );
    c.eq(
        &format!("{ctx} ro"),
        i64::from(node.render_order),
        w.get("ro").i64(),
    );
    if let Some(g) = v.geo_of(n) {
        let wg = w.get("geo");
        let mesh = g.mesh();
        c.eq(
            &format!("{ctx} geo type"),
            g.three_type(),
            wg.get("t").str(),
        );
        c.eq(
            &format!("{ctx} vtx"),
            i64::try_from(mesh.vertex_count()).expect("v"),
            wg.get("vtx").i64(),
        );
        c.eq(
            &format!("{ctx} geo hash"),
            geo_hash(&mesh),
            wg.get("hash").u32(),
        );
        c.fs(
            &format!("{ctx} geo par"),
            &geo_parameters(g),
            &wg.get("par").hx(),
        );
        c.eq(
            &format!("{ctx} mat"),
            i64::try_from(v.mat_ids[&v.material_of(n).expect("m")]).expect("m"),
            w.get("mat").i64(),
        );
        if let Some(l) = v.fs.line_at(n) {
            c.eq(
                &format!("{ctx} line pos"),
                f32_hex(&mesh.positions),
                wg.get("pos").str().to_owned(),
            );
            let ld = l.line_distances.as_ref().map(|d| f32_hex(d));
            let wld = if wg.get("ld").is_null() {
                None
            } else {
                Some(wg.get("ld").str().to_owned())
            };
            c.eq(&format!("{ctx} line ld"), ld, wld);
        }
    }
    if let Some(im) = v.fs.instanced_at(n) {
        let wi = w.get("inst");
        c.eq(
            &format!("{ctx} cap"),
            i64::try_from(im.capacity).expect("c"),
            wi.get("cap").i64(),
        );
        c.eq(
            &format!("{ctx} count"),
            i64::try_from(im.count).expect("c"),
            wi.get("count").i64(),
        );
        c.eq(
            &format!("{ctx} mHash"),
            f32_fnv(&im.matrices),
            wi.get("mHash").u32(),
        );
        c.eq(
            &format!("{ctx} first"),
            f32_hex(&im.matrices[..32.min(im.matrices.len())]),
            wi.get("first").str().to_owned(),
        );
        if im.count > 0 {
            c.eq(
                &format!("{ctx} last"),
                f32_hex(&im.matrices[(im.count - 1) * 16..im.count * 16]),
                wi.get("last").str().to_owned(),
            );
        }
        match (&im.colors, wi.get("cHash")) {
            (None, Json::Null) => c.checks += 1,
            (Some(col), Json::Num(h)) => {
                #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
                c.eq(&format!("{ctx} cHash"), f32_fnv(col), *h as u32);
                c.eq(
                    &format!("{ctx} firstColor"),
                    f32_hex(&col[..6.min(col.len())]),
                    wi.get("firstColor").str().to_owned(),
                );
            }
            (r, w) => c.err(format!("{ctx} colors: rust {} web {w:?}", r.is_some())),
        }
        match (im.bounding_sphere, wi.get("bs")) {
            (None, Json::Null) => c.checks += 1,
            (Some(s), Json::Str(h)) => c.fs(
                &format!("{ctx} bs"),
                &[s.center.x, s.center.y, s.center.z, s.radius],
                &hx(h),
            ),
            (r, w) => c.err(format!("{ctx} bs: rust {r:?} web {w:?}")),
        }
    }
    if let Some(l) = v.fs.light_at(n) {
        let wl = w.get("light");
        c.fs(
            &format!("{ctx} light color"),
            &[l.color.r, l.color.g, l.color.b],
            &wl.get("color").hx(),
        );
        c.eq(
            &format!("{ctx} light hex"),
            l.color.to_hex(),
            wl.get("hex").u32(),
        );
        c.f(
            &format!("{ctx} intensity"),
            l.intensity,
            wl.get("intensity").hx()[0],
        );
        match &l.kind {
            LightKind::Hemisphere { ground } => {
                c.fs(
                    &format!("{ctx} ground"),
                    &[ground.r, ground.g, ground.b],
                    &wl.get("ground").hx(),
                );
            }
            LightKind::Directional {
                target_node,
                target_position,
                shadow: s,
            } => {
                c.eq(
                    &format!("{ctx} target"),
                    target_node.map_or(-1, |t| i64::try_from(v.pos[&t]).expect("t")),
                    wl.get("target").i64(),
                );
                c.fs(
                    &format!("{ctx} targetPos"),
                    &[target_position.x, target_position.y, target_position.z],
                    &wl.get("targetPos").hx(),
                );
                c.fs(
                    &format!("{ctx} shadow"),
                    &[
                        s.map_size.0,
                        s.map_size.1,
                        s.near,
                        s.far,
                        s.left,
                        s.right,
                        s.top,
                        s.bottom,
                        s.bias,
                        s.normal_bias,
                        s.radius,
                    ],
                    &wl.get("shadow").hx(),
                );
            }
            LightKind::Ambient => {}
        }
    }
    // The per-node signature last (it covers everything above).
    c.eq(&format!("{ctx} sig"), v.node_sig(n), w.get("sig").u32());
}

fn compare_camera(c: &mut Cmp, ctx: &str, cam: &BattleCamera, w: &Json, nan_agnostic: bool) {
    let mut f = |name: &str, r: &[f64], wv: &[f64]| {
        if nan_agnostic {
            c.eq(&format!("{ctx} {name} len"), r.len(), wv.len());
            for (i, (a, b)) in r.iter().zip(wv).enumerate() {
                if a.is_nan() && b.is_nan() {
                    c.checks += 1;
                } else {
                    c.f(&format!("{ctx} {name}[{i}]"), *a, *b);
                }
            }
        } else {
            c.fs(&format!("{ctx} {name}"), r, wv);
        }
    };
    f("fov", &[cam.fov], &w.get("fov").hx());
    f("aspect", &[cam.aspect], &w.get("aspect").hx());
    f("near", &[cam.near], &w.get("near").hx());
    f("far", &[cam.far], &w.get("far").hx());
    f("zoom", &[cam.zoom], &w.get("zoom").hx());
    f(
        "p",
        &[cam.position.x, cam.position.y, cam.position.z],
        &w.get("p").hx(),
    );
    f(
        "r",
        &[cam.rotation.x, cam.rotation.y, cam.rotation.z],
        &w.get("r").hx(),
    );
    let q = cam.quaternion;
    f("q", &[q.x, q.y, q.z, q.w], &w.get("q").hx());
    f("up", &[cam.up.x, cam.up.y, cam.up.z], &w.get("up").hx());
    f("w", &cam.world_matrix().e, &w.get("w").hx());
    f("proj", &cam.projection_matrix().e, &w.get("proj").hx());
    f(
        "target",
        &[cam.target.x, cam.target.y, cam.target.z],
        &w.get("target").hx(),
    );
    f(
        "dir",
        &[cam.dir.x, cam.dir.y, cam.dir.z],
        &w.get("dir").hx(),
    );
    f(
        "dist",
        &[cam.dist, cam.dist_target, cam.dist_min, cam.dist_max],
        &w.get("dist").hx(),
    );
}

fn compare_siege(c: &mut Cmp, ctx: &str, s: Option<&field::SiegeLayout>, w: &Json) {
    // The web carved a wall (`_carveWallTiles` ran) exactly when the full
    // siege record is present (`rowLo` is emitted only by `siegeRecord`
    // over a constructed scene / a carve) and `wallCol != -1`. Rust must
    // then return `Some`, and `None` otherwise — no silent skip (r2, Ev-1).
    let web_carved = w.opt("rowLo").is_some() && w.get("wallCol").i64() != -1;
    c.eq(&format!("{ctx} present"), s.is_some(), web_carved);
    let Some(s) = s else { return };
    let ints = [
        ("wallCol", s.wall_col),
        ("rowLo", s.row_lo),
        ("rowHi", s.row_hi),
        ("gateCol", s.gate_col),
        ("gateRow", s.gate_row),
    ];
    for (key, v) in ints {
        c.eq(&format!("{ctx} {key}"), i64::from(v), w.get(key).i64());
    }
    c.f(&format!("{ctx} gateHp"), s.gate_hp, w.get("gateHp").num());
    c.eq(
        &format!("{ctx} gateOpen"),
        s.gate_open,
        w.get("gateOpen").bool(),
    );
    let hp: Vec<(i64, f64)> = s
        .wall_tile_hp
        .iter()
        .map(|&(r, h)| (i64::from(r), h))
        .collect();
    let whp: Vec<(i64, f64)> = w
        .get("wallTileHp")
        .arr()
        .iter()
        .map(|e| (e.arr()[0].i64(), e.arr()[1].num()))
        .collect();
    c.eq(&format!("{ctx} wallTileHp"), hp, whp);
}

fn grid_of(case: &Json) -> TerrainGrid {
    TerrainGrid::new(
        case.get("cols").i32(),
        case.get("rows").i32(),
        hex_bytes(case.get("tilesIn").str()),
    )
}

// ---------------------------------------------------------------------------
// Tests.

#[test]
fn field_constructor_matches_web() {
    let fx = load("field.json");
    let mut c = Cmp::default();
    let cases = fx.get("ctor").arr();
    let mut nodes = 0usize;
    for case in cases {
        let id = case.get("id").str();
        let deploy = match case.get("deploy") {
            Json::Null => None,
            d if d.str() == "atk" => Some(DeploySide::Atk),
            _ => Some(DeploySide::Def),
        };
        let bf = build_battle_scene(BattleSceneOpts {
            grid: grid_of(case),
            desert_palette: case.get("desert").bool(),
            siege: !case.get("siege").is_null(),
            deploy,
        });
        c.eq(
            &format!("{id} tilesOut"),
            bytes_fnv(&bf.grid.tiles),
            case.get("tilesOutHash").u32(),
        );
        let ws = case.get("siegeState");
        if case.get("siege").is_null() {
            c.eq(&format!("{id} no siege"), ws.get("wallCol").i64(), -1);
        }
        compare_siege(&mut c, &format!("{id} siege"), bf.siege.as_ref(), ws);
        let env = case.get("env");
        let bg = bf.env.background;
        c.fs(
            &format!("{id} background"),
            &[bg.r, bg.g, bg.b],
            &env.get("background").hx(),
        );
        c.eq(
            &format!("{id} background hex"),
            bg.to_hex(),
            env.get("backgroundHex").u32(),
        );
        let fog = env.get("fog");
        c.eq(&format!("{id} fog type"), "FogExp2", fog.get("t").str());
        let fc = bf.env.fog_color;
        c.fs(
            &format!("{id} fog color"),
            &[fc.r, fc.g, fc.b],
            &fog.get("color").hx(),
        );
        c.f(
            &format!("{id} fog density"),
            bf.env.fog_density,
            fog.get("density").hx()[0],
        );
        let r = case.get("renderer");
        c.eq(
            &format!("{id} shadowMap"),
            bf.renderer.shadow_map_enabled,
            r.get("shadowMap").bool(),
        );
        c.eq(
            &format!("{id} shadowType"),
            bf.renderer.shadow_map_type,
            r.get("shadowType").u32(),
        );
        c.eq(
            &format!("{id} toneMapping"),
            bf.renderer.tone_mapping,
            r.get("toneMapping").u32(),
        );
        c.f(
            &format!("{id} exposure"),
            bf.renderer.tone_mapping_exposure,
            r.get("exposure").hx()[0],
        );
        compare_camera(
            &mut c,
            &format!("{id} camera"),
            &bf.camera,
            case.get("camera"),
            false,
        );
        compare_scene(&mut c, id, case, &bf.field);
        nodes += bf.field.scene.traverse().len();
    }
    println!(
        "field ctor: {} cases, {nodes} nodes, scalars {}, checks {}",
        cases.len(),
        c.scalars,
        c.checks
    );
    c.finish("battle field (constructor)");
}

#[test]
fn field_builders_match_web_on_synthetic_grids() {
    let fx = load("field.json");
    let mut c = Cmp::default();
    let cases = fx.get("synthetic").arr();
    for case in cases {
        let id = case.get("id").str();
        let mut grid = grid_of(case);
        let desert = case.get("desert").bool();
        let mut fs = FieldScene::new();
        let (mut wall_col, mut gate_row) = (-1, -1);
        let mut siege = None;
        let wall = case.get("wall");
        match wall {
            Json::Str(s) if s == "carve" => {
                let s = carve_wall_tiles(&mut grid);
                wall_col = s.wall_col;
                gate_row = s.gate_row;
                siege = Some(s);
            }
            Json::Num(_) => {
                wall_col = wall.i32();
                gate_row = match case.get("gateRow") {
                    Json::Null => field::PLAY_MID_ROW,
                    g => g.i32(),
                };
            }
            _ => {}
        }
        c.eq(
            &format!("{id} tilesOut"),
            bytes_fnv(&grid.tiles),
            case.get("tilesOutHash").u32(),
        );
        compare_siege(
            &mut c,
            &format!("{id} siege"),
            siege.as_ref(),
            case.get("siegeState"),
        );
        let ss = case.get("siegeState");
        c.eq(
            &format!("{id} wallCol (input)"),
            i64::from(wall_col),
            ss.get("wallCol").i64(),
        );
        if !wall.is_null() {
            c.eq(
                &format!("{id} gateRow (input)"),
                i64::from(gate_row),
                ss.get("gateRow").i64(),
            );
        }
        fs.build_battlefield(&grid, desert);
        if !wall.is_null() {
            fs.build_siege_interior_buildings(&grid, wall_col, gate_row);
        }
        match case.get("deploy") {
            Json::Null => {}
            d => fs.build_deploy_zone(
                &grid,
                if d.str() == "atk" {
                    DeploySide::Atk
                } else {
                    DeploySide::Def
                },
            ),
        }
        let outlines = case.get("outlines").arr();
        if !outlines.is_empty() {
            fs.init_deploy_ghost_layer();
            for o in outlines {
                let a = o.arr();
                fs.append_deploy_cell_outline(
                    &grid,
                    a[0].i32(),
                    a[1].i32(),
                    a[2].i32(),
                    a[3].i32(),
                    a[4].u32(),
                    a[5].hx()[0],
                    a[6].bool(),
                );
            }
        }
        compare_scene(&mut c, id, case, &fs);
    }
    println!(
        "field synthetic: {} cases, scalars {}, checks {}",
        cases.len(),
        c.scalars,
        c.checks
    );
    c.finish("battle field (synthetic)");
}

#[test]
fn apply_camera_matches_web() {
    let fx = load("field.json");
    let mut c = Cmp::default();
    for (i, w) in fx.get("applyCamera").arr().iter().enumerate() {
        let inp = w.get("in").hx();
        let mut cam = BattleCamera::new();
        cam.target = PVec3::new(inp[1], 0.0, inp[2]);
        cam.dist = inp[0];
        cam.dist_target = inp[0];
        cam.dist_min = 7.7;
        cam.dist_max = 257.4;
        cam.apply();
        // The NaN-distance case: NaN bit patterns are implementation-defined (P4-36 §3a), NaN-ness compared.
        compare_camera(
            &mut c,
            &format!("applyCamera {i}"),
            &cam,
            w,
            inp[0].is_nan(),
        );
        let e = euler_xyz_from_quaternion(cam.quaternion);
        if !inp[0].is_nan() {
            c.fs(
                &format!("applyCamera {i} euler"),
                &[e.x, e.y, e.z],
                &w.get("r").hx(),
            );
        }
    }
    c.finish("applyCamera");
}

#[test]
fn constants_equal_web() {
    let fx = load("field.json");
    let k = fx.get("consts");
    let mut c = Cmp::default();
    let ints: [(&str, i32); 23] = [
        ("BF_COLS", field::BF_COLS),
        ("BF_ROWS", field::BF_ROWS),
        ("PLAYABLE_COLS", field::PLAYABLE_COLS),
        ("PLAYABLE_ROWS", field::PLAYABLE_ROWS),
        ("PLAY_COL0", field::PLAY_COL0),
        ("PLAY_ROW0", field::PLAY_ROW0),
        ("PLAY_COL1", field::PLAY_COL1),
        ("PLAY_ROW1", field::PLAY_ROW1),
        ("PLAY_MID_COL", field::PLAY_MID_COL),
        ("PLAY_MID_ROW", field::PLAY_MID_ROW),
        ("MAX_PER_SIDE", field::MAX_PER_SIDE),
        ("RANK_WIDTH", field::RANK_WIDTH),
        ("MAX_RANKS", field::MAX_RANKS),
        ("DEPLOY_MARGIN", field::DEPLOY_MARGIN),
        ("FRONT_GAP", field::FRONT_GAP),
        ("ATK_FRONT_COL", field::ATK_FRONT_COL),
        ("DEF_FRONT_COL", field::DEF_FRONT_COL),
        ("ATK_COL_STEP", field::ATK_COL_STEP),
        ("DEF_COL_STEP", field::DEF_COL_STEP),
        ("DEPLOY_MID_COL", field::DEPLOY_MID_COL),
        ("DEPLOY_DEF_MIN_COL", field::DEPLOY_DEF_MIN_COL),
        ("TILE_S", 1),
        ("BF_COLS", 68),
    ];
    for (name, v) in ints {
        c.f(name, f64::from(v), k.get(name).hx()[0]);
    }
    let floats: [(&str, f64); 6] = [
        ("TILE_S", field::TILE_S),
        ("TILE_H", field::TILE_H),
        ("HILL_LIFT", field::HILL_LIFT),
        ("HILL_BUMP_RADIUS", field::HILL_BUMP_RADIUS),
        ("HILL_SUMMIT_Y", field::HILL_SUMMIT_Y),
        ("RIVER_DROP", field::RIVER_DROP),
    ];
    for (name, v) in floats {
        c.f(name, v, k.get(name).hx()[0]);
    }
    let colors: [(&str, u32); 18] = [
        ("FOREST_CONE_COLOR", field::FOREST_CONE_COLOR),
        ("FOREST_CONE_COLOR2", field::FOREST_CONE_COLOR2),
        ("FOREST_TRUNK_COLOR", field::FOREST_TRUNK_COLOR),
        ("HILL_GRASS_COLOR", field::HILL_GRASS_COLOR),
        ("SHRUB_COLOR", field::SHRUB_COLOR),
        ("ROCK_COLOR", field::ROCK_COLOR),
        ("RIVER_WATER_COLOR", field::RIVER_WATER_COLOR),
        ("HILL_GRASS_COLOR_DESERT", field::HILL_GRASS_COLOR_DESERT),
        ("SHRUB_COLOR_DESERT", field::SHRUB_COLOR_DESERT),
        ("ROCK_COLOR_DESERT", field::ROCK_COLOR_DESERT),
        ("GRASS_TUFT_COLOR_A", field::GRASS_TUFT_COLOR_A),
        ("GRASS_TUFT_COLOR_B", field::GRASS_TUFT_COLOR_B),
        ("PEBBLE_COLOR", field::PEBBLE_COLOR),
        ("TINY_BUSH_COLOR", field::TINY_BUSH_COLOR),
        (
            "GRASS_TUFT_COLOR_A_DESERT",
            field::GRASS_TUFT_COLOR_A_DESERT,
        ),
        (
            "GRASS_TUFT_COLOR_B_DESERT",
            field::GRASS_TUFT_COLOR_B_DESERT,
        ),
        ("PEBBLE_COLOR", 0x008a_8478),
        ("TINY_BUSH_COLOR", 0x003f_7a34),
    ];
    for (name, v) in colors {
        c.f(name, f64::from(v), k.get(name).hx()[0]);
    }
    for (key, f) in [
        (
            "BT_FLOOR_COLOR",
            field::floor_color as fn(u8) -> Option<u32>,
        ),
        ("BT_FLOOR_COLOR_DESERT", field::floor_color_desert),
    ] {
        let tbl = k.get(key).arr();
        c.eq(&format!("{key} len"), tbl.len(), 8);
        for e in tbl {
            let kind = u8::try_from(e.arr()[0].i64()).expect("kind");
            c.eq(&format!("{key}[{kind}]"), f(kind), Some(e.arr()[1].u32()));
        }
        c.eq(&format!("{key}[8]"), f(8), None);
    }
    let body: Vec<u32> = k
        .get("SIEGE_BLDG_BODY_COLORS")
        .arr()
        .iter()
        .map(Json::u32)
        .collect();
    c.eq(
        "SIEGE_BLDG_BODY_COLORS",
        field::SIEGE_BLDG_BODY_COLORS.to_vec(),
        body,
    );
    let roof: Vec<u32> = k
        .get("SIEGE_BLDG_ROOF_COLORS")
        .arr()
        .iter()
        .map(Json::u32)
        .collect();
    c.eq(
        "SIEGE_BLDG_ROOF_COLORS",
        field::SIEGE_BLDG_ROOF_COLORS.to_vec(),
        roof,
    );
    c.f(
        "WALL_TILE_HP",
        field::WALL_TILE_HP,
        k.get("WALL_TILE_HP").num(),
    );
    let dcr = k.get("deployClearRanks").arr();
    c.eq(
        "deployClearRanks(false)",
        i64::from(field::deploy_clear_ranks_for(false)),
        dcr[0].i64(),
    );
    c.eq(
        "deployClearRanks(true)",
        i64::from(field::deploy_clear_ranks_for(true)),
        dcr[1].i64(),
    );
    let bsc = k.get("battleSafeCols").arr();
    for (i, preset) in [false, true].into_iter().enumerate() {
        let web: Vec<(i32, i32)> = bsc[i]
            .arr()
            .iter()
            .map(|p| (p.arr()[0].i32(), p.arr()[1].i32()))
            .collect();
        c.eq(
            &format!("battleSafeCols({preset})"),
            field::battle_safe_cols(preset),
            web,
        );
    }
    c.finish("constants");
}

#[test]
fn helpers_match_web() {
    let fx = load("field.json");
    let h = fx.get("helpers");
    let mut c = Cmp::default();
    for e in h.get("lighten").arr() {
        let a = e.arr();
        c.eq("lighten", lighten(a[0].i32(), a[1].hx()[0]), a[2].i32());
    }
    for e in h.get("blend").arr() {
        let a = e.arr();
        c.eq(
            "blend",
            blend(a[0].i32(), a[1].i32(), a[2].hx()[0]),
            a[3].i32(),
        );
    }
    let g = make_gable_roof_geometry();
    let wg = h.get("gable");
    c.eq("gable hash", geo_hash(&g), wg.get("hash").u32());
    c.eq(
        "gable pos",
        f32_hex(&g.positions),
        wg.get("pos").str().to_owned(),
    );
    c.eq(
        "gable nor",
        f32_hex(&g.normals),
        wg.get("nor").str().to_owned(),
    );
    c.eq(
        "gable pos bits",
        g.positions.iter().map(|v| v.to_bits()).collect::<Vec<_>>(),
        hx32(wg.get("pos").str()),
    );
    for e in h.get("cellToWorld").arr() {
        let a = e.arr();
        let inp = a[0].hx();
        let (x, z) = cell_to_world(inp[0], inp[1]);
        c.fs("cellToWorld", &[x, z], &a[1].hx());
    }
    // tileTopY on the 'mix' synthetic grid (LCG seed 7), same as gen_field.ts.
    let mix = fx
        .get("synthetic")
        .arr()
        .iter()
        .find(|s| s.get("id").str() == "mix")
        .expect("mix");
    let grid = grid_of(mix);
    for e in h.get("tileTopY").arr() {
        let a = e.arr();
        c.f(
            "tileTopY",
            tile_top_y(&grid, a[0].i32(), a[1].i32()),
            a[2].hx()[0],
        );
    }
    c.finish("helpers");
}
