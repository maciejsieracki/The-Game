//! Shared helpers of the `tests/repin3d_*` suites (R-RUSTPORT-REPIN-3D-A-Q1):
//! the minimal JSON reader, the bit-exact comparison bookkeeping and the
//! node-record byte stream of `dumpTree` — copied verbatim from
//! `tests/battle3d_units.rs` (part 3 of MOD-14, which stays unchanged); only
//! visibility (`pub`) and the fixture directory (`tests/repin3d_fixtures/`)
//! differ. Every generator of `tests/repin3d_fixtures/` hashes nodes with the
//! same `dumpTree` / `nodeRecord` / `matSig` as `gen_units.ts`.

#![allow(dead_code, clippy::float_cmp)]

use std::collections::HashMap;
use std::path::PathBuf;

use civ_renderer::battle::field::{FieldScene, LightKind};
use civ_renderer::battle::units;
use civ_renderer::geom::Mat4;
use civ_renderer::scene::{geo_hash, Fnv, Geo, MaterialKind, NodeId, NodeKind};

// Minimal JSON reader (no dependencies; fixtures are trusted files produced
// by the reference script). UTF-8 strings and `\uXXXX` escapes supported.

#[derive(Debug, Clone)]
pub enum Json {
    Null,
    Bool(bool),
    Num(f64),
    Str(String),
    Arr(Vec<Json>),
    Obj(Vec<(String, Json)>),
}

#[allow(dead_code)] // the same reader as tests/misc_web_parity.rs; not every accessor is used here
impl Json {
    pub fn get(&self, key: &str) -> &Json {
        self.opt(key).unwrap_or_else(|| panic!("missing key {key}"))
    }
    pub fn opt(&self, key: &str) -> Option<&Json> {
        match self {
            Json::Obj(kv) => kv.iter().find(|(k, _)| k == key).map(|(_, v)| v),
            _ => None,
        }
    }
    pub fn num(&self) -> f64 {
        match self {
            Json::Num(n) => *n,
            other => panic!("not a number: {other:?}"),
        }
    }
    pub fn arr(&self) -> &[Json] {
        match self {
            Json::Arr(a) => a,
            other => panic!("not an array: {other:?}"),
        }
    }
    pub fn str(&self) -> &str {
        match self {
            Json::Str(s) => s,
            other => panic!("not a string: {other:?}"),
        }
    }
    pub fn bool(&self) -> bool {
        match self {
            Json::Bool(b) => *b,
            other => panic!("not a bool: {other:?}"),
        }
    }
    pub fn is_null(&self) -> bool {
        matches!(self, Json::Null)
    }
    pub fn obj(&self) -> &[(String, Json)] {
        match self {
            Json::Obj(kv) => kv,
            other => panic!("not an object: {other:?}"),
        }
    }
    #[allow(clippy::cast_possible_truncation)]
    pub fn i64(&self) -> i64 {
        let n = self.num();
        assert!(n.fract() == 0.0 && n.abs() < 9e15, "not an integer: {n}");
        n as i64
    }
    pub fn i32(&self) -> i32 {
        i32::try_from(self.i64()).expect("i32")
    }
    pub fn u32(&self) -> u32 {
        u32::try_from(self.i64()).expect("u32")
    }
    pub fn hx(&self) -> Vec<f64> {
        hx(self.str())
    }
}

pub struct Parser<'a> {
    pub s: &'a [u8],
    pub i: usize,
}

impl Parser<'_> {
    pub fn ws(&mut self) {
        while self.i < self.s.len() && self.s[self.i].is_ascii_whitespace() {
            self.i += 1;
        }
    }
    pub fn lit(&mut self, l: &str) {
        assert!(
            self.s[self.i..].starts_with(l.as_bytes()),
            "bad literal at {}",
            self.i
        );
        self.i += l.len();
    }
    pub fn value(&mut self) -> Json {
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
    pub fn string(&mut self) -> String {
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

pub fn load(name: &str) -> Json {
    let p: PathBuf = [
        env!("CARGO_MANIFEST_DIR"),
        "tests",
        "repin3d_fixtures",
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
pub fn hx(s: &str) -> Vec<f64> {
    assert_eq!(s.len() % 16, 0, "bad hx length");
    (0..s.len() / 16)
        .map(|i| f64::from_bits(u64::from_str_radix(&s[i * 16..i * 16 + 16], 16).expect("hex")))
        .collect()
}

pub fn hex_bytes(s: &str) -> Vec<u8> {
    (0..s.len() / 2)
        .map(|i| u8::from_str_radix(&s[i * 2..i * 2 + 2], 16).expect("hex"))
        .collect()
}

// ---------------------------------------------------------------------------
// Comparison bookkeeping.

#[derive(Default)]
pub struct Cmp {
    pub scalars: usize,
    pub checks: usize,
    pub errors: Vec<String>,
}

impl Cmp {
    pub fn f(&mut self, ctx: &str, rust: f64, web: f64) {
        self.scalars += 1;
        if rust.to_bits() != web.to_bits() {
            self.err(format!(
                "{ctx}: rust {rust:e} ({:#x}) web {web:e} ({:#x})",
                rust.to_bits(),
                web.to_bits()
            ));
        }
    }
    pub fn fs(&mut self, ctx: &str, rust: &[f64], web: &[f64]) {
        if rust.len() != web.len() {
            self.err(format!("{ctx}: len rust {} web {}", rust.len(), web.len()));
            return;
        }
        for (i, (r, w)) in rust.iter().zip(web).enumerate() {
            self.f(&format!("{ctx}[{i}]"), *r, *w);
        }
    }
    pub fn eq<T: PartialEq + std::fmt::Debug>(&mut self, ctx: &str, rust: T, web: T) {
        self.checks += 1;
        if rust != web {
            self.err(format!("{ctx}: rust {rust:?} web {web:?}"));
        }
    }
    pub fn err(&mut self, e: String) {
        if self.errors.len() < 60 {
            self.errors.push(e);
        } else if self.errors.len() == 60 {
            self.errors.push("…".into());
        }
    }
    pub fn finish(&self, what: &str) {
        assert!(
            self.errors.is_empty(),
            "{what}: {} differences:\n{}",
            self.errors.len(),
            self.errors.join("\n")
        );
    }
}

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// The byte stream of `gen_units.ts` (`nodeRecord`, `matSig`, `modelRecord`).

#[derive(Default)]
pub struct Bytes(pub Vec<u8>);

impl Bytes {
    pub fn byte(&mut self, b: u8) {
        self.0.push(b);
    }
    pub fn u32(&mut self, v: u32) {
        self.0.extend_from_slice(&v.to_le_bytes());
    }
    /// NaN hashed as one canonical pattern, like `gen_units.ts` (bit patterns
    /// of NaN are implementation-defined; P4-36 §3a).
    pub fn f32(&mut self, v: f32) {
        let v = if v.is_nan() {
            f32::from_bits(0x7fc0_0000)
        } else {
            v
        };
        self.0.extend_from_slice(&v.to_le_bytes());
    }
    pub fn f64(&mut self, v: f64) {
        let v = if v.is_nan() {
            f64::from_bits(0x7ff8_0000_0000_0000)
        } else {
            v
        };
        self.0.extend_from_slice(&v.to_le_bytes());
    }
    pub fn bool(&mut self, b: bool) {
        self.byte(u8::from(b));
    }
    pub fn str(&mut self, s: &str) {
        let units: Vec<u16> = s.encode_utf16().collect();
        self.u32(u32::try_from(units.len()).expect("len"));
        for u in units {
            self.u32(u32::from(u));
        }
    }
    pub fn hash(&self) -> u32 {
        let mut f = Fnv::default();
        for &b in &self.0 {
            f.byte(b);
        }
        f.finish()
    }
}

/// Kind codes of `gen_units.ts::KIND`.
pub fn kind_code(
    fs: &FieldScene,
    n: NodeId,
    root_is_scene: bool,
    root: NodeId,
) -> (u32, &'static str) {
    if root_is_scene && n == root {
        return (0, "Scene");
    }
    if fs.instanced_at(n).is_some() {
        return (4, "InstancedMesh");
    }
    if fs.line_at(n).is_some() {
        return (5, "Line");
    }
    if let Some(l) = fs.light_at(n) {
        return match l.kind {
            LightKind::Ambient => (6, "AmbientLight"),
            LightKind::Hemisphere { .. } => (7, "HemisphereLight"),
            LightKind::Directional { .. } => (8, "DirectionalLight"),
        };
    }
    match fs.scene.nodes[n].kind {
        NodeKind::Group => (1, "Group"),
        NodeKind::Object3D => (2, "Object3D"),
        NodeKind::Mesh(_) => (3, "Mesh"),
        ref k => panic!("unexpected node kind {k:?}"),
    }
}

pub fn material_of(fs: &FieldScene, n: NodeId) -> Option<usize> {
    if let Some(l) = fs.line_at(n) {
        return Some(l.material);
    }
    fs.scene.nodes[n].mesh().map(|m| m.material())
}

pub fn geo_of(fs: &FieldScene, n: NodeId) -> Option<&Geo> {
    if let Some(l) = fs.line_at(n) {
        return Some(&l.geo);
    }
    fs.scene.nodes[n].mesh().map(|m| &m.geo)
}

pub fn mat_type(fs: &FieldScene, slot: usize) -> &'static str {
    if fs
        .lines
        .iter()
        .any(|l| l.material == slot && l.dash.is_some())
    {
        "LineDashedMaterial"
    } else {
        fs.scene.materials[slot].kind.three_type()
    }
}

/// `matSig` of `gen_units.ts` (= `gen_field.ts`).
pub fn mat_sig(fs: &FieldScene, slot: usize) -> u32 {
    let m = &fs.scene.materials[slot];
    let mut r = Bytes::default();
    r.str(mat_type(fs, slot));
    // three's `getHex()` sums the three rounded channels, so ONE NaN channel
    // makes the whole value NaN, which `>>> 0` hashes as 0 (`Color::to_hex`
    // rounds per channel instead — observation W-12, reachable only through
    // a NaN morale, `barUpdates` case 10). The linear channels are compared
    // exactly right below.
    let c0 = m.linear_color();
    r.u32(if c0.r.is_nan() || c0.g.is_nan() || c0.b.is_nan() {
        0
    } else {
        m.hex()
    });
    let c = m.linear_color();
    r.f64(c.r);
    r.f64(c.g);
    r.f64(c.b);
    r.u32(m.side.three_value());
    let has_flat = matches!(m.kind, MaterialKind::Lambert | MaterialKind::Standard);
    r.byte(if has_flat {
        u8::from(m.flat_shading)
    } else {
        2
    });
    r.bool(m.transparent);
    r.f64(m.opacity);
    r.bool(m.depth_write);
    r.bool(m.depth_test);
    r.bool(m.vertex_colors);
    if has_flat {
        r.byte(1);
        r.u32(m.emissive.to_hex());
        r.f64(m.emissive.r);
        r.f64(m.emissive.g);
        r.f64(m.emissive.b);
    } else {
        r.byte(0);
    }
    if m.kind == MaterialKind::Standard {
        r.f64(m.roughness);
        r.f64(m.metalness);
    }
    if let Some(l) = fs.lines.iter().find(|l| l.material == slot) {
        if let Some(d) = l.dash {
            r.f64(d.dash_size);
            r.f64(d.gap_size);
            r.f64(d.scale);
        }
    }
    r.hash()
}

/// One node of a dumped sub-tree, as Rust sees it (for diagnostics).
pub struct NodeView {
    sig: u32,
    kind: &'static str,
    parent: i64,
    p: [f64; 3],
    q: [f64; 4],
    s: [f64; 3],
    vis: bool,
    geo: Option<(String, u32, Vec<f64>)>,
    mat_sig: Option<u32>,
}

/// Pre-order sub-tree of `root` with the world matrices of
/// `root.updateMatrixWorld(true)`: `parent.matrixWorld * matrix` when `root`
/// is attached (the ancestors' world matrices as `scene.updateMatrixWorld`
/// left them), `matrix` when it is detached.
pub fn subtree_world(fs: &FieldScene, root: NodeId) -> Vec<(NodeId, Mat4)> {
    let sc = &fs.scene;
    let mut chain = Vec::new();
    let mut p = sc.nodes[root].parent;
    while let Some(id) = p {
        chain.push(id);
        p = sc.nodes[id].parent;
    }
    let mut parent_world: Option<Mat4> = None;
    for &id in chain.iter().rev() {
        let local = sc.local_matrix(id);
        parent_world = Some(parent_world.map_or(local, |w| w.mul(&local)));
    }
    let mut out = Vec::new();
    let mut stack = vec![(root, parent_world)];
    while let Some((id, pw)) = stack.pop() {
        let local = sc.local_matrix(id);
        let world = pw.map_or(local, |w| w.mul(&local));
        out.push((id, world));
        for &c in sc.nodes[id].children.iter().rev() {
            stack.push((c, Some(world)));
        }
    }
    out
}

/// `dumpTree(root)` of `gen_units.ts`: node records in traverse order.
pub fn dump_tree(fs: &FieldScene, root: NodeId, root_is_scene: bool) -> (u32, Vec<NodeView>) {
    let sub = subtree_world(fs, root);
    let pos: HashMap<NodeId, usize> = sub.iter().enumerate().map(|(i, &(n, _))| (n, i)).collect();
    let mut mat_ids: HashMap<usize, usize> = HashMap::new();
    let mut all = Bytes::default();
    let mut out = Vec::new();
    for &(n, world) in &sub {
        let node = &fs.scene.nodes[n];
        let (code, kname) = kind_code(fs, n, root_is_scene, root);
        let mut r = Bytes::default();
        r.u32(code);
        r.str(&node.name);
        let parent = if n == root {
            -1
        } else {
            node.parent
                .and_then(|p| pos.get(&p))
                .map_or(-1, |&i| i64::try_from(i).expect("i64"))
        };
        r.u32(u32::try_from(parent + 1).expect("parent"));
        for v in [
            node.position.x,
            node.position.y,
            node.position.z,
            node.rotation.x,
            node.rotation.y,
            node.rotation.z,
        ] {
            r.f64(v);
        }
        r.str("XYZ");
        let q = node.quaternion;
        for v in [q.x, q.y, q.z, q.w, node.scale.x, node.scale.y, node.scale.z] {
            r.f64(v);
        }
        for v in world.e {
            r.f64(v);
        }
        r.bool(node.cast_shadow);
        r.bool(node.receive_shadow);
        r.bool(node.visible);
        #[allow(clippy::cast_sign_loss)]
        r.u32(node.render_order as u32);
        let mut geo_v = None;
        let mut ms_v = None;
        if code == 3 || code == 5 {
            let g = geo_of(fs, n).expect("geo");
            let slot = material_of(fs, n).expect("mat");
            let next = mat_ids.len();
            let mid = *mat_ids.entry(slot).or_insert(next);
            r.u32(u32::try_from(mid).expect("mid"));
            r.str(g.three_type());
            let gh = geo_hash(&g.mesh());
            r.u32(gh);
            let par = units::geo_parameters(g);
            for &v in &par {
                r.f64(v);
            }
            let ms = mat_sig(fs, slot);
            r.u32(ms);
            if code == 5 {
                let l = fs.line_at(n).expect("line");
                match &l.line_distances {
                    Some(d) => {
                        r.byte(1);
                        for &v in d {
                            r.f32(v);
                        }
                    }
                    None => r.byte(0),
                }
            }
            geo_v = Some((g.three_type().to_owned(), gh, par));
            ms_v = Some(ms);
        }
        all.0.extend_from_slice(&r.0);
        out.push(NodeView {
            sig: r.hash(),
            kind: kname,
            parent,
            p: [node.position.x, node.position.y, node.position.z],
            q: [q.x, q.y, q.z, q.w],
            s: [node.scale.x, node.scale.y, node.scale.z],
            vis: node.visible,
            geo: geo_v,
            mat_sig: ms_v,
        });
    }
    (all.hash(), out)
}

/// Compares `dump_tree` with a web `dumpTree` record (`{ n, sig, nodes? }`).
pub fn compare_tree(
    c: &mut Cmp,
    ctx: &str,
    fs: &FieldScene,
    root: NodeId,
    root_is_scene: bool,
    w: &Json,
) {
    let (sig, nodes) = dump_tree(fs, root, root_is_scene);
    c.eq(
        &format!("{ctx} n"),
        nodes.len(),
        usize::try_from(w.get("n").i64()).expect("n"),
    );
    c.eq(&format!("{ctx} sig"), sig, w.get("sig").u32());
    let Some(wn) = w.opt("nodes") else { return };
    for (i, (r, wv)) in nodes.iter().zip(wn.arr()).enumerate() {
        let cx = format!("{ctx} node {i}");
        if r.sig == wv.get("sig").u32() {
            c.checks += 1;
            continue;
        }
        // Field-level report of a differing node.
        c.eq(&format!("{cx} sig"), r.sig, wv.get("sig").u32());
        c.eq(&format!("{cx} kind"), r.kind, wv.get("k").str());
        c.eq(&format!("{cx} parent"), r.parent, wv.get("parent").i64());
        c.fs(&format!("{cx} p"), &r.p, &wv.get("p").hx());
        c.fs(&format!("{cx} q"), &r.q, &wv.get("q").hx());
        c.fs(&format!("{cx} s"), &r.s, &wv.get("s").hx());
        c.eq(&format!("{cx} vis"), r.vis, wv.get("vis").bool());
        if let (Some((t, gh, par)), Some(wg)) = (&r.geo, wv.opt("geo")) {
            c.eq(&format!("{cx} geo type"), t.as_str(), wg.get("t").str());
            c.eq(&format!("{cx} geo hash"), *gh, wg.get("hash").u32());
            c.fs(&format!("{cx} geo par"), par, &wg.get("par").hx());
        }
        if let (Some(ms), Some(wm)) = (r.mat_sig, wv.opt("matSig")) {
            c.eq(&format!("{cx} matSig"), ms, wm.u32());
        }
    }
    c.eq(&format!("{ctx} nodes len"), nodes.len(), wn.arr().len());
}
