//! MOD-14 "battle 3D", part 3 (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3): the
//! Rust `battle::units` port of the unit placement and overlays of
//! `battle/battleScene.ts` against object graphs produced by RUNNING the web
//! code of `edb8fb56` (three@0.169.0, node v22.22.0): `new BattleScene(opts)`
//! with armies (presets of `testBattle.ts`, synthetic rosters over every
//! `units.json` row, sieges, deploy mode) plus post-construction operations,
//! and the overlay methods called directly with injected lookups — see
//! `tests/fixtures/battle3d/README.md` ("Part 3") and
//! `dyspozycje/rust-port/p4/P4-36-MOD14-BATTLE-3D.md` §19.
//!
//! Every unit model enters the unit-core signature (geometry hash, material,
//! world matrix of every mesh) plus a hash of every node's kind / visibility /
//! world matrix; every bar stack, arrow, ring and ghost enters a FNV-1a
//! signature of its full node records (kind, name, parent, position, Euler,
//! quaternion, scale, world matrix, shadows, visibility, `renderOrder`,
//! material identity + signature, geometry type / hash / parameters, line
//! distances) — byte for byte the stream of `gen_units.ts`. Any difference
//! fails.

#![allow(clippy::float_cmp)]

use std::collections::HashMap;
use std::path::PathBuf;

use civ_renderer::battle::field::{
    cell_to_world, BattleSceneOpts, DeploySide, FieldScene, LightKind, TerrainGrid, BF_COLS,
    BF_ROWS,
};
use civ_renderer::battle::units::{
    self, add_selection_ring, build_battle_scene_with_units, climb_onto_wall_walkway, dir_yaw,
    make_fallback_avatar, make_order_arrow, make_unit_bars, refresh_battle_move_ghosts,
    refresh_deploy_ghosts, refresh_deploy_ghosts_at, refresh_deploy_selection_visuals,
    refresh_queued_order_visuals, refresh_unit_ring_color, remove_selection_ring,
    remove_unit_from_scene, side_color, siege_wall_civ, update_ammo_bar,
    update_deploy_placement_preview, update_hp_bar, update_morale_bar, update_order_preview,
    BattleQueries, BattleScene3, BattleSide, BattleUnitsOpts, DeployDrag, OrderLayer, OrderUnit,
    PlacedUnit, PlayerOrder, PreviewState, RosterUnit, SelectionRings, UnitSpawn, P3,
};
use civ_renderer::geom::Mat4;
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

// ---------------------------------------------------------------------------
// The byte stream of `gen_units.ts` (`nodeRecord`, `matSig`, `modelRecord`).

#[derive(Default)]
struct Bytes(Vec<u8>);

impl Bytes {
    fn byte(&mut self, b: u8) {
        self.0.push(b);
    }
    fn u32(&mut self, v: u32) {
        self.0.extend_from_slice(&v.to_le_bytes());
    }
    /// NaN hashed as one canonical pattern, like `gen_units.ts` (bit patterns
    /// of NaN are implementation-defined; P4-36 §3a).
    fn f32(&mut self, v: f32) {
        let v = if v.is_nan() {
            f32::from_bits(0x7fc0_0000)
        } else {
            v
        };
        self.0.extend_from_slice(&v.to_le_bytes());
    }
    fn f64(&mut self, v: f64) {
        let v = if v.is_nan() {
            f64::from_bits(0x7ff8_0000_0000_0000)
        } else {
            v
        };
        self.0.extend_from_slice(&v.to_le_bytes());
    }
    fn bool(&mut self, b: bool) {
        self.byte(u8::from(b));
    }
    fn str(&mut self, s: &str) {
        let units: Vec<u16> = s.encode_utf16().collect();
        self.u32(u32::try_from(units.len()).expect("len"));
        for u in units {
            self.u32(u32::from(u));
        }
    }
    fn hash(&self) -> u32 {
        let mut f = Fnv::default();
        for &b in &self.0 {
            f.byte(b);
        }
        f.finish()
    }
}

/// Kind codes of `gen_units.ts::KIND`.
fn kind_code(fs: &FieldScene, n: NodeId, root_is_scene: bool, root: NodeId) -> (u32, &'static str) {
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

fn material_of(fs: &FieldScene, n: NodeId) -> Option<usize> {
    if let Some(l) = fs.line_at(n) {
        return Some(l.material);
    }
    fs.scene.nodes[n].mesh().map(|m| m.material())
}

fn geo_of(fs: &FieldScene, n: NodeId) -> Option<&Geo> {
    if let Some(l) = fs.line_at(n) {
        return Some(&l.geo);
    }
    fs.scene.nodes[n].mesh().map(|m| &m.geo)
}

fn mat_type(fs: &FieldScene, slot: usize) -> &'static str {
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
fn mat_sig(fs: &FieldScene, slot: usize) -> u32 {
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
struct NodeView {
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
fn subtree_world(fs: &FieldScene, root: NodeId) -> Vec<(NodeId, Mat4)> {
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
fn dump_tree(fs: &FieldScene, root: NodeId, root_is_scene: bool) -> (u32, Vec<NodeView>) {
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
fn compare_tree(
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

/// `modelRecord` of `gen_units.ts`: `[n, meshes, tris, sig, all]`.
fn model_record(fs: &FieldScene, root: NodeId) -> [u32; 5] {
    let mut f = Bytes::default();
    let mut all = Bytes::default();
    let (mut meshes, mut tris, mut n) = (0u32, 0u32, 0u32);
    for (id, world) in subtree_world(fs, root) {
        n += 1;
        let node = &fs.scene.nodes[id];
        all.u32(match node.kind {
            NodeKind::Mesh(_) => 3,
            NodeKind::Group => 1,
            _ => 2,
        });
        all.bool(node.visible);
        for v in world.e {
            all.f64(v);
        }
        let NodeKind::Mesh(md) = &node.kind else {
            continue;
        };
        let g = md.geo.mesh();
        meshes += 1;
        tris += u32::try_from(g.triangle_count()).expect("tris");
        f.u32(geo_hash(&g));
        let mt = &fs.scene.materials[md.material()];
        f.u32(mt.hex());
        f.f64(mt.metalness);
        f.f64(mt.roughness);
        f.byte(u8::from(mt.transparent));
        f.f64(mt.opacity);
        f.byte(u8::from(mt.flat_shading));
        for v in world.e {
            f.f64(v);
        }
    }
    f.u32(meshes);
    [n, meshes, tris, f.hash(), all.hash()]
}

fn json_u32s(w: &Json) -> Vec<u32> {
    w.arr().iter().map(Json::u32).collect()
}

/// A JSON number, or the binary64 bits of a non-finite / `-0` value.
fn num(w: &Json) -> f64 {
    match w {
        Json::Str(s) => hx(s)[0],
        other => other.num(),
    }
}

fn side_of(s: &str) -> BattleSide {
    match s {
        "atk" => BattleSide::Atk,
        "def" => BattleSide::Def,
        other => panic!("side {other}"),
    }
}

fn rle_grid(w: &Json) -> TerrainGrid {
    let a = w.arr();
    let mut tiles = Vec::new();
    for pair in a.chunks(2) {
        let k = u8::try_from(pair[0].i64()).expect("kind");
        let n = usize::try_from(pair[1].i64()).expect("count");
        tiles.extend(std::iter::repeat_n(k, n));
    }
    assert_eq!(
        tiles.len(),
        usize::try_from(BF_COLS * BF_ROWS).expect("len")
    );
    TerrainGrid::new(BF_COLS, BF_ROWS, tiles)
}

/// A DTO row of `unitsRecord` → the Rust input.
fn spawn_of(row: &Json) -> UnitSpawn {
    let a = row.arr();
    let v: Vec<f64> = a[9].arr().iter().map(num).collect();
    UnitSpawn {
        id: a[0].str().to_owned(),
        side: side_of(a[1].str()),
        col: a[2].i32(),
        row: a[3].i32(),
        facing: a[4].i32(),
        on_wall_walkway: a[5].i64() == 1,
        category: a[6].str().to_owned(),
        model_name: a[7].str().to_owned(),
        owner_color: a[8].u32(),
        hp: v[0],
        max_hp: v[1],
        morale: v[2],
        morale_max: v[3],
        ammo_left: v[4],
        ammo_max: v[5],
    }
}

fn root_index(fs: &FieldScene, n: NodeId) -> i64 {
    fs.scene.nodes[ROOT]
        .children
        .iter()
        .position(|&c| c == n)
        .map_or(-1, |i| i64::try_from(i).expect("i64"))
}

/// `sceneSummary` of `gen_units.ts`.
fn scene_summary(fs: &FieldScene) -> (usize, usize, u32) {
    let mut f = Bytes::default();
    for &ch in &fs.scene.nodes[ROOT].children {
        let k = fs.scene.traverse_from(ch).len();
        f.u32(kind_code(fs, ch, false, ROOT).0);
        f.u32(u32::try_from(k).expect("k"));
        f.bool(fs.scene.nodes[ch].visible);
    }
    (
        fs.scene.nodes[ROOT].children.len(),
        fs.scene.traverse().len(),
        f.hash(),
    )
}

fn compare_summary(c: &mut Cmp, ctx: &str, fs: &FieldScene, w: &Json) {
    let (ch, n, st) = scene_summary(fs);
    c.eq(
        &format!("{ctx} root children"),
        ch,
        usize::try_from(w.get("children").i64()).expect("c"),
    );
    c.eq(
        &format!("{ctx} nodes"),
        n,
        usize::try_from(w.get("nodes").i64()).expect("n"),
    );
    c.eq(&format!("{ctx} struct"), st, w.get("struct").u32());
}

/// Compares every unit of `units` (atk then def) with `unitsRecord` rows.
fn compare_units(c: &mut Cmp, ctx: &str, b: &BattleScene3, w: &Json) {
    let fs = &b.field.field;
    let rows = w.get("rows").arr();
    let all: Vec<&PlacedUnit> = b.atk.iter().chain(b.def.iter()).collect();
    c.eq(&format!("{ctx} unit count"), all.len(), rows.len());
    for (i, (u, row)) in all.iter().zip(rows).enumerate() {
        let a = row.arr();
        let cx = format!("{ctx} unit {i} {}", a[0].str());
        c.eq(&format!("{cx} id"), u.spawn.id.as_str(), a[0].str());
        c.eq(
            &format!("{cx} ammoBarShown"),
            u.ammo_bar_shown,
            a[1].i64() == 1,
        );
        c.eq(&format!("{cx} fallback"), u.fallback_model, false);
        c.eq(
            &format!("{cx} group index"),
            root_index(fs, u.group),
            a[2].i64(),
        );
        c.eq(
            &format!("{cx} bars index"),
            root_index(fs, u.bars.group),
            a[3].i64(),
        );
        c.eq(
            &format!("{cx} model"),
            model_record(fs, u.group).to_vec(),
            json_u32s(&a[4]),
        );
        let wb = json_u32s(&a[5]);
        let (bsig, bnodes) = dump_tree(fs, u.bars.group, false);
        c.eq(
            &format!("{cx} bars"),
            vec![u32::try_from(bnodes.len()).expect("n"), bsig],
            wb,
        );
    }
    if let (Some(first), Some(wf)) = (all.first(), w.opt("firstBars")) {
        if !wf.is_null() {
            compare_tree(
                c,
                &format!("{ctx} first bars"),
                fs,
                first.bars.group,
                false,
                wf,
            );
        }
    }
}

/// The spawn DTO rows (`spawn`: state right after `_placeUnits` / `_placeUnitsOneSide`).
fn spawns_of(w: &Json) -> Vec<UnitSpawn> {
    w.arr().iter().map(spawn_of).collect()
}

/// Replays the `_moveDeployUnit` calls the web made (`moves`: `[id, col, row]`).
fn apply_moves(b: &mut BattleScene3, w: &Json) -> usize {
    let moves = w.arr();
    for m in moves {
        let a = m.arr();
        assert!(
            b.move_deploy_unit(a[0].str(), a[1].i32(), a[2].i32()),
            "move of unknown unit"
        );
    }
    moves.len()
}

fn find_unit<'a>(b: &'a mut BattleScene3, id: &str) -> &'a mut PlacedUnit {
    b.atk
        .iter_mut()
        .chain(b.def.iter_mut())
        .find(|u| u.spawn.id == id)
        .unwrap_or_else(|| panic!("unit {id}"))
}

#[test]
#[allow(clippy::too_many_lines)]
fn units_constructor_matches_web() {
    let d = load("units.json");
    assert_eq!(d.get("three").str(), "169");
    let mut c = Cmp::default();
    let (mut n_units, mut n_moves) = (0usize, 0usize);
    for case in d.get("ctor").arr() {
        let id = case.get("id").str();
        let siege = case.get("siege");
        let deploy = case.get("deploy");
        let (civ, def_civ) = if siege.is_null() {
            (None, None)
        } else {
            (
                siege.opt("civ").map(Json::str),
                siege.opt("defCiv").map(Json::str),
            )
        };
        let opts = BattleUnitsOpts {
            field: BattleSceneOpts {
                grid: rle_grid(case.get("tilesRle")),
                desert_palette: case.get("desert").bool(),
                siege: !siege.is_null(),
                deploy: if deploy.is_null() {
                    None
                } else if deploy.str() == "atk" {
                    Some(DeploySide::Atk)
                } else {
                    Some(DeploySide::Def)
                },
            },
            siege_civ: siege_wall_civ(civ, def_civ).to_owned(),
            player_side: side_of(case.get("player").str()),
            units: spawns_of(case.get("spawn")),
        };
        n_units += opts.units.len();
        let mut b = build_battle_scene_with_units(opts);
        n_moves += apply_moves(&mut b, case.get("moves"));
        compare_summary(&mut c, id, &b.field.field, case.get("scene"));
        compare_units(&mut c, id, &b, case.get("units"));
        // Wall placement.
        let ww = case.get("wall");
        c.eq(
            &format!("{id} wall present"),
            b.wall.is_some(),
            !ww.is_null(),
        );
        if let (Some(w), false) = (&b.wall, ww.is_null()) {
            let fs = &b.field.field;
            c.eq(
                &format!("{id} wall index"),
                root_index(fs, w.group),
                ww.get("index").i64(),
            );
            let m = ww.get("m");
            c.eq(
                &format!("{id} wall model"),
                model_record(fs, w.group).to_vec(),
                ["n", "meshes", "tris", "sig", "all"]
                    .iter()
                    .map(|k| m.get(k).u32())
                    .collect::<Vec<_>>(),
            );
            let n = &fs.scene.nodes[w.group];
            c.fs(
                &format!("{id} wall p"),
                &[n.position.x, n.position.y, n.position.z],
                &ww.get("p").hx(),
            );
            c.fs(
                &format!("{id} wall r"),
                &[n.rotation.x, n.rotation.y, n.rotation.z],
                &ww.get("r").hx(),
            );
            c.fs(
                &format!("{id} wall q"),
                &[
                    n.quaternion.x,
                    n.quaternion.y,
                    n.quaternion.z,
                    n.quaternion.w,
                ],
                &ww.get("q").hx(),
            );
            c.eq(
                &format!("{id} wall rowWallMeshes"),
                w.user_data.row_wall_meshes.as_ref().map_or(0, Vec::len),
                usize::try_from(ww.get("rows").i64()).expect("rows"),
            );
            c.eq(
                &format!("{id} wall rowBreachPanels"),
                w.user_data.row_breach_panels.as_ref().map_or(0, Vec::len),
                usize::try_from(ww.get("breach").i64()).expect("breach"),
            );
            // userData node ids point into the battle scene: the gate group is in the wall subtree.
            let sub: Vec<NodeId> = fs.scene.traverse_from(w.group);
            c.eq(
                &format!("{id} wall gate in subtree"),
                sub.contains(&w.user_data.gate),
                true,
            );
        }
        c.eq(
            &format!("{id} deployGhosts index"),
            b.field
                .field
                .deploy_ghost_group
                .map_or(-1, |g| root_index(&b.field.field, g)),
            case.get("deployGhostIndex").i64(),
        );
        // Post-construction operations.
        for p in case.get("posts").arr() {
            let op = p.get("op").str();
            let cx = format!("{id} {op}");
            match op {
                "resetAtk" | "resetDef" => {
                    let side = if op == "resetAtk" {
                        BattleSide::Atk
                    } else {
                        BattleSide::Def
                    };
                    let spawns: Vec<UnitSpawn> = spawns_of(p.get("spawn"))
                        .into_iter()
                        .filter(|s| s.side == side)
                        .collect();
                    // The constructor's deploy UI selects nothing (rings: none).
                    b.reset_deploy_side(
                        side,
                        &spawns,
                        &mut SelectionRings::default(),
                        &mut Vec::new(),
                    );
                    n_moves += apply_moves(&mut b, p.get("moves"));
                    compare_units(&mut c, &cx, &b, p.get("units"));
                    compare_summary(&mut c, &cx, &b.field.field, p.get("scene"));
                }
                "removeOne" => {
                    let ids: Vec<String> = p
                        .get("ids")
                        .arr()
                        .iter()
                        .map(|v| v.str().to_owned())
                        .collect();
                    for (k, vid) in ids.iter().enumerate() {
                        let mut u = find_unit(&mut b, vid).clone();
                        remove_unit_from_scene(&mut b.field.field.scene, &mut u);
                        *find_unit(&mut b, vid) = u;
                        let u = find_unit(&mut b, vid).clone();
                        let wv = p.get("vis").arr()[k].arr();
                        let sc = &b.field.field.scene;
                        c.eq(
                            &format!("{cx} {vid} visible"),
                            (sc.nodes[u.group].visible, sc.nodes[u.bars.group].visible),
                            (wv[0].bool(), wv[1].bool()),
                        );
                    }
                    compare_summary(&mut c, &cx, &b.field.field, p.get("scene"));
                }
                "removeAll" => {
                    b.remove_all_units();
                    compare_summary(&mut c, &cx, &b.field.field, p.get("scene"));
                }
                "climb" => {
                    let uid = p.get("id").str().to_owned();
                    let (wall_col, row) = (p.get("wallCol").i32(), p.get("row").i32());
                    let mut u = find_unit(&mut b, &uid).clone();
                    climb_onto_wall_walkway(&mut b.field.field.scene, &mut u, wall_col, row);
                    let sc = &b.field.field.scene;
                    let gp = sc.nodes[u.group].position;
                    let bp = sc.nodes[u.bars.group].position;
                    c.fs(
                        &format!("{cx} group"),
                        &[gp.x, gp.y, gp.z],
                        &p.get("gp").hx(),
                    );
                    c.fs(
                        &format!("{cx} bars"),
                        &[bp.x, bp.y, bp.z],
                        &p.get("bp").hx(),
                    );
                    c.eq(
                        &format!("{cx} q r"),
                        (u.col, u.row),
                        (p.get("q").i32(), p.get("r").i32()),
                    );
                    c.eq(
                        &format!("{cx} onWall"),
                        u.on_wall_walkway,
                        p.get("onWall").bool(),
                    );
                }
                other => panic!("unknown post {other}"),
            }
        }
    }
    println!(
        "units ctor: {} cases, {n_units} units, {n_moves} deploy moves, scalars {}, checks {}",
        d.get("ctor").arr().len(),
        c.scalars,
        c.checks
    );
    c.finish("units ctor");
}

#[test]
fn bars_and_fallback_match_web() {
    let d = load("units.json");
    let dir = d.get("direct");
    let mut c = Cmp::default();
    for (i, w) in dir.get("bars").arr().iter().enumerate() {
        let mut fs = FieldScene::new();
        let b = make_unit_bars(&mut fs.scene, w.get("color").u32(), w.get("shown").bool());
        compare_tree(
            &mut c,
            &format!("bars {i}"),
            &fs,
            b.group,
            false,
            w.get("tree"),
        );
    }
    for (i, w) in dir.get("fallback").arr().iter().enumerate() {
        let fs = FieldScene {
            scene: make_fallback_avatar(w.get("color").u32()),
            ..FieldScene::new()
        };
        compare_tree(
            &mut c,
            &format!("fallback {i}"),
            &fs,
            ROOT,
            false,
            w.get("tree"),
        );
    }
    for (i, w) in dir.get("barUpdates").arr().iter().enumerate() {
        let v = w.get("in").hx();
        let shown = v[6] == 1.0;
        let mut fs = FieldScene::new();
        let b = make_unit_bars(&mut fs.scene, 0x003a_6ad0, shown);
        update_hp_bar(&mut fs.scene, &b, v[0], v[1]);
        update_morale_bar(&mut fs.scene, &b, v[2], v[3]);
        update_ammo_bar(&mut fs.scene, &b, shown, v[4], v[5]);
        compare_tree(
            &mut c,
            &format!("barUpdate {i}"),
            &fs,
            b.group,
            false,
            w.get("tree"),
        );
    }
    for w in dir.get("dirYaw").arr() {
        let a = w.arr();
        c.f(
            &format!("dirYaw {}", a[0].i64()),
            dir_yaw(a[0].i32()),
            a[1].hx()[0],
        );
    }
    for w in dir.get("sideColor").arr() {
        let a = w.arr();
        c.eq(
            &format!("sideColor {} {}", a[0].str(), a[1].str()),
            side_color(side_of(a[0].str()), side_of(a[1].str())),
            a[2].u32(),
        );
    }
    println!("bars: scalars {}, checks {}", c.scalars, c.checks);
    c.finish("bars");
}

#[test]
#[allow(clippy::too_many_lines)]
fn selection_rings_match_web() {
    let d = load("units.json");
    let w = d.get("direct").get("rings");
    let mut c = Cmp::default();
    let mut fs = FieldScene::new();
    let g1 = fs.scene.detached_group();
    let g2 = fs.scene.detached_group();
    let g3 = fs.scene.detached_group();
    fs.scene.set_pos(g1, 3.0, 0.2, 4.0);
    fs.scene.nodes[g1].rot_y(1.25);
    fs.scene.set_pos(g2, -1.0, 0.0, 2.0);
    fs.scene.set_scale_scalar(g2, 1.3);
    let mut rings = SelectionRings::default();
    add_selection_ring(&mut fs.scene, &mut rings, "u1", g1, false);
    add_selection_ring(&mut fs.scene, &mut rings, "u2", g2, true);
    add_selection_ring(&mut fs.scene, &mut rings, "u1", g1, false);
    add_selection_ring(&mut fs.scene, &mut rings, "u3", g3, false);
    for (k, g) in [g1, g2, g3].into_iter().enumerate() {
        compare_tree(
            &mut c,
            &format!("afterAdd {k}"),
            &fs,
            g,
            false,
            &w.get("afterAdd").arr()[k],
        );
    }
    refresh_unit_ring_color(&mut fs.scene, &rings, "u1", true);
    refresh_unit_ring_color(&mut fs.scene, &rings, "u2", false);
    let r3 = rings.get("u3").expect("u3 ring");
    fs.scene.set_pos(r3, 9.0, 9.0, 9.0);
    remove_selection_ring(&mut fs.scene, &mut rings, "u3", g3);
    remove_selection_ring(&mut fs.scene, &mut rings, "u3", g3);
    for (k, g) in [g1, g2, g3].into_iter().enumerate() {
        compare_tree(
            &mut c,
            &format!("afterRefresh {k}"),
            &fs,
            g,
            false,
            &w.get("afterRefresh").arr()[k],
        );
    }
    let g4 = fs.scene.detached_group();
    fs.scene.set_scale_scalar(g4, 2.0);
    let r2 = rings.get("u2").expect("u2");
    fs.scene.set_pos(r2, 0.0, 5.0, 0.0);
    let r1 = rings.get("u1").expect("u1");
    fs.scene.set_pos(r1, 0.0, 6.0, 0.0);
    let roster = vec![
        RosterUnit {
            id: "u1".into(),
            group: g1,
            dead: false,
            removed: false,
        },
        RosterUnit {
            id: "u2".into(),
            group: g2,
            dead: false,
            removed: false,
        },
        RosterUnit {
            id: "u4".into(),
            group: g4,
            dead: true,
            removed: false,
        },
    ];
    refresh_deploy_selection_visuals(&mut fs, &roster, &["u2".to_owned()], &rings);
    for (k, g) in [g1, g2, g4].into_iter().enumerate() {
        compare_tree(
            &mut c,
            &format!("afterVisuals {k}"),
            &fs,
            g,
            false,
            &w.get("afterVisuals").arr()[k],
        );
    }
    println!("rings: checks {}", c.checks);
    c.finish("rings");
}

fn p3(v: &[f64]) -> P3 {
    P3::new(v[0], v[1], v[2])
}

#[test]
fn order_arrows_match_web() {
    let d = load("units.json");
    let mut c = Cmp::default();
    for (i, w) in d.get("direct").get("arrows").arr().iter().enumerate() {
        let v = w.get("in").hx();
        let mut fs = FieldScene::new();
        let g = make_order_arrow(
            &mut fs.scene,
            p3(&v[0..3]),
            p3(&v[3..6]),
            w.get("atk").bool(),
            w.get("pre").bool(),
        );
        compare_tree(&mut c, &format!("arrow {i}"), &fs, g, false, w.get("tree"));
    }
    println!("arrows: checks {}", c.checks);
    c.finish("arrows");
}

// ---------------------------------------------------------------------------
// Overlay cases: the fake runtime units and injected lookups of gen_units.ts.

fn mix_grid(d: &Json) -> TerrainGrid {
    TerrainGrid::new(
        BF_COLS,
        BF_ROWS,
        hex_bytes(d.get("direct").get("tilesHex").str()),
    )
}

/// `fakeUnit(id, side, q, r, extra)`: group at `cellToWorld(q, r)` (+ `tileTopY`).
fn fake(id: &str, side: BattleSide, q: i32, r: i32) -> OrderUnit {
    let (x, z) = cell_to_world(f64::from(q), f64::from(r));
    OrderUnit {
        id: id.to_owned(),
        side,
        col: q,
        row: r,
        x,
        z,
        dead: false,
        removed: false,
        routed: false,
        group_id: None,
        formation_offset: None,
        order: PlayerOrder::None,
    }
}

fn with(mut u: OrderUnit, f: impl FnOnce(&mut OrderUnit)) -> OrderUnit {
    f(&mut u);
    u
}

/// `overlayInst(ghostLayer)`.
fn overlay(ghost: bool) -> (FieldScene, OrderLayer) {
    let mut fs = FieldScene::new();
    let layer = OrderLayer::create(&mut fs.scene, ROOT);
    if ghost {
        fs.init_deploy_ghost_layer();
    }
    (fs, layer)
}

#[test]
fn queued_order_visuals_match_web() {
    let d = load("units.json");
    let grid = mix_grid(&d);
    let mut c = Cmp::default();
    for (i, w) in d.get("direct").get("queued").arr().iter().enumerate() {
        let (mut fs, mut layer) = overlay(false);
        let atk = vec![
            with(fake("a0", BattleSide::Atk, 30, 70), |u| {
                u.order = PlayerOrder::Move { col: 40, row: 72 }
            }),
            with(fake("a1", BattleSide::Atk, 31, 71), |u| {
                u.order = PlayerOrder::Attack {
                    target: "d0".into(),
                }
            }),
            with(fake("a2", BattleSide::Atk, 32, 72), |u| {
                u.order = PlayerOrder::Attack {
                    target: "d1".into(),
                }
            }),
            with(fake("a3", BattleSide::Atk, 33, 73), |u| {
                u.order = PlayerOrder::Move { col: 33, row: 73 }
            }),
            with(fake("a4", BattleSide::Atk, 34, 74), |u| {
                u.order = PlayerOrder::Move { col: 20, row: 90 };
                u.routed = true;
            }),
            fake("a5", BattleSide::Atk, 35, 75),
            with(fake("a6", BattleSide::Atk, 12, 30), |u| {
                u.order = PlayerOrder::Attack {
                    target: "d2".into(),
                }
            }),
            with(fake("a7", BattleSide::Atk, 13, 31), |u| {
                u.order = PlayerOrder::Move { col: 13, row: 32 }
            }),
        ];
        let def = vec![
            with(fake("d0", BattleSide::Def, 45, 80), |u| {
                u.order = PlayerOrder::Move { col: 41, row: 80 }
            }),
            with(fake("d1", BattleSide::Def, 46, 81), |u| u.dead = true),
            with(fake("d2", BattleSide::Def, 47, 60), |u| {
                u.order = PlayerOrder::Attack {
                    target: "a0".into(),
                }
            }),
            with(fake("d3", BattleSide::Def, 48, 61), |u| {
                u.order = PlayerOrder::Attack {
                    target: "a2".into(),
                };
                u.removed = true;
            }),
        ];
        let queued: Vec<String> = ["a1", "a7", "d2"].iter().map(|s| (*s).to_owned()).collect();
        let stale = make_order_arrow(
            &mut fs.scene,
            P3::new(1.0, 0.0, 1.0),
            P3::new(5.0, 0.0, 5.0),
            true,
            false,
        );
        fs.scene.attach(layer.lines, stale);
        layer.queued.push(stale);
        let running = w.get("started").bool() && !w.get("finished").bool();
        let (roster, enemies) = if w.get("player").str() == "atk" {
            (&atk, &def)
        } else {
            (&def, &atk)
        };
        refresh_queued_order_visuals(
            &mut fs.scene,
            &mut layer,
            &grid,
            running,
            roster,
            enemies,
            &queued,
        );
        c.eq(
            &format!("queued {i} count"),
            layer.queued.len(),
            usize::try_from(w.get("queued").i64()).expect("q"),
        );
        compare_tree(
            &mut c,
            &format!("queued {i}"),
            &fs,
            ROOT,
            true,
            w.get("scene"),
        );
    }
    println!("queued: checks {}", c.checks);
    c.finish("queued");
}

/// The injected lookups of one overlay case (mirrors of the JS closures).
struct Q<'a> {
    grid: &'a TerrainGrid,
    roster: Vec<OrderUnit>,
    occ: Vec<((i32, i32), OrderUnit)>,
    dest: Vec<(String, i32, i32)>,
    zone: i32,
    /// preview cases: `_isDeployCellOk = passable && col !== 21`; ghost cases: passable + occupancy.
    ghost_cases: bool,
    layout: Option<Vec<(String, i32, i32)>>,
}

impl BattleQueries for Q<'_> {
    fn player_unit(&self, id: &str) -> Option<&OrderUnit> {
        self.roster.iter().find(|u| u.id == id)
    }
    fn occupant(&self, col: i32, row: i32) -> Option<&OrderUnit> {
        self.occ
            .iter()
            .find(|(k, _)| *k == (col, row))
            .map(|(_, u)| u)
    }
    fn passable_for(&self, _unit: Option<&OrderUnit>, col: i32, row: i32) -> bool {
        self.grid.passable(col, row)
    }
    fn group_members(&self, gid: &str) -> Vec<String> {
        if gid == "g1" {
            ["a5", "a6", "a7", "a8", "zz"]
                .iter()
                .map(|s| (*s).to_owned())
                .collect()
        } else {
            Vec::new()
        }
    }
    fn move_destinations(&self, _col: i32, _row: i32) -> Vec<(String, i32, i32)> {
        self.dest.clone()
    }
    fn in_deploy_player_zone(&self, col: i32, _row: i32) -> bool {
        col < self.zone
    }
    fn deploy_placement_layout(
        &self,
        units: &[&OrderUnit],
        col: i32,
        row: i32,
    ) -> Vec<(String, i32, i32)> {
        if let Some(l) = &self.layout {
            return l.clone();
        }
        units
            .iter()
            .enumerate()
            .map(|(i, u)| {
                let i = i32::try_from(i).expect("i");
                (u.id.clone(), col + i, row - i)
            })
            .collect()
    }
    fn deploy_ghost_layout(&self, units: &[&OrderUnit], d: DeployDrag) -> Vec<(String, i32, i32)> {
        if let Some(l) = &self.layout {
            return l.clone();
        }
        units
            .iter()
            .enumerate()
            .map(|(i, u)| {
                let i = i32::try_from(i).expect("i");
                (
                    u.id.clone(),
                    d.anchor_col + i,
                    d.anchor_row
                        + ((d.cur_row - d.anchor_row) >> 1)
                        + i * (d.cur_col - d.anchor_col),
                )
            })
            .collect()
    }
    fn deploy_cell_ok(&self, col: i32, row: i32, skip: &[String]) -> bool {
        if self.ghost_cases {
            self.grid.passable(col, row)
                && self
                    .occupant(col, row)
                    .is_none_or(|o| skip.iter().any(|s| s == &o.id))
        } else {
            self.grid.passable(col, row) && col != 21
        }
    }
}

/// The preview cases of `gen_units.ts` §7 (inputs that are not in the JSON are mirrored here).
#[derive(Clone, Copy)]
struct PreviewCase {
    deploy_phase: bool,
    drag: bool,
    manual: bool,
    sel: &'static [&'static str],
    hover: Option<&'static str>,
    tile: Option<(i32, i32)>,
    occ: Option<&'static str>,
    dest: &'static [(&'static str, i32, i32)],
    ghost: bool,
}

#[allow(clippy::too_many_lines)]
fn preview_cases() -> Vec<(&'static str, PreviewCase)> {
    let base = PreviewCase {
        deploy_phase: false,
        drag: false,
        manual: true,
        sel: &[],
        hover: None,
        tile: None,
        occ: None,
        dest: &[],
        ghost: true,
    };
    vec![
        (
            "hover-enemy",
            PreviewCase {
                sel: &["a0", "a1", "a4", "zz"],
                hover: Some("d0"),
                tile: Some((45, 80)),
                ..base
            },
        ),
        (
            "hover-dead-enemy-tile-occ",
            PreviewCase {
                sel: &["a0", "a2"],
                hover: Some("d1"),
                tile: Some((47, 60)),
                occ: Some("d2"),
                ..base
            },
        ),
        (
            "hover-own-tile-free",
            PreviewCase {
                sel: &["a0", "a1", "a2", "a3"],
                hover: Some("a3"),
                tile: Some((40, 70)),
                dest: &[("a0", 41, 70), ("a1", 40, 71), ("a2", 40, 69)],
                ..base
            },
        ),
        (
            "group-members",
            PreviewCase {
                sel: &["a5", "a6", "a0"],
                tile: Some((50, 100)),
                dest: &[("a5", 51, 100), ("a7", 50, 99)],
                ..base
            },
        ),
        (
            "no-tile",
            PreviewCase {
                sel: &["a0"],
                ..base
            },
        ),
        (
            "not-manual",
            PreviewCase {
                manual: false,
                sel: &["a0"],
                tile: Some((40, 70)),
                ..base
            },
        ),
        (
            "no-selection",
            PreviewCase {
                tile: Some((40, 70)),
                ..base
            },
        ),
        (
            "move-no-ghost-layer",
            PreviewCase {
                sel: &["a0", "a1"],
                tile: Some((3, 2)),
                dest: &[("a0", 3, 2)],
                ghost: false,
                ..base
            },
        ),
        (
            "tile-own-occupant",
            PreviewCase {
                sel: &["a1"],
                tile: Some((30, 70)),
                occ: Some("a0"),
                dest: &[("a1", 30, 70)],
                ..base
            },
        ),
        (
            "deploy-phase-hover",
            PreviewCase {
                deploy_phase: true,
                sel: &["a0", "a1"],
                tile: Some((20, 75)),
                ..base
            },
        ),
        (
            "deploy-phase-drag",
            PreviewCase {
                deploy_phase: true,
                drag: true,
                sel: &["a0"],
                tile: Some((20, 75)),
                ..base
            },
        ),
    ]
}

fn preview_roster() -> Vec<OrderUnit> {
    vec![
        fake("a0", BattleSide::Atk, 30, 70),
        fake("a1", BattleSide::Atk, 31, 71),
        with(fake("a2", BattleSide::Atk, 32, 72), |u| u.dead = true),
        fake("a3", BattleSide::Atk, 40, 70),
        with(fake("a4", BattleSide::Atk, 34, 74), |u| u.routed = true),
        with(fake("a5", BattleSide::Atk, 35, 75), |u| {
            u.group_id = Some("g1".into())
        }),
        with(fake("a6", BattleSide::Atk, 36, 76), |u| {
            u.group_id = Some("g1".into())
        }),
        with(fake("a7", BattleSide::Atk, 37, 77), |u| {
            u.group_id = Some("g1".into());
            u.formation_offset = Some((-1, 2));
        }),
        with(fake("a8", BattleSide::Atk, 38, 78), |u| {
            u.group_id = Some("g1".into());
            u.removed = true;
        }),
    ]
}

fn preview_enemies() -> Vec<OrderUnit> {
    vec![
        fake("d0", BattleSide::Def, 45, 80),
        with(fake("d1", BattleSide::Def, 46, 81), |u| u.dead = true),
        fake("d2", BattleSide::Def, 47, 60),
    ]
}

#[test]
fn order_preview_matches_web() {
    let d = load("units.json");
    let grid = mix_grid(&d);
    let mut c = Cmp::default();
    let web = d.get("direct").get("preview").arr();
    let cases = preview_cases();
    c.eq("preview case count", cases.len(), web.len());
    for ((id, pc), w) in cases.iter().zip(web) {
        c.eq("preview id", *id, w.get("id").str());
        let (mut fs, layer) = overlay(pc.ghost);
        let roster = preview_roster();
        let enemies = preview_enemies();
        let lookup = |k: &str| {
            roster
                .iter()
                .chain(enemies.iter())
                .find(|u| u.id == k)
                .cloned()
                .expect("unit")
        };
        let mut occ = Vec::new();
        if let (Some(o), Some(t)) = (pc.occ, pc.tile) {
            occ.push((t, lookup(o)));
        }
        occ.push(((41, 70), lookup("a3")));
        let q = Q {
            grid: &grid,
            roster: roster.clone(),
            occ,
            dest: pc
                .dest
                .iter()
                .map(|&(k, a, b)| (k.to_owned(), a, b))
                .collect(),
            zone: 33,
            ghost_cases: false,
            layout: None,
        };
        let st = PreviewState {
            deploy_phase: pc.deploy_phase,
            drag: pc.drag.then_some(DeployDrag {
                anchor_col: 20,
                anchor_row: 75,
                cur_col: 22,
                cur_row: 78,
            }),
            manual_input_active: pc.manual,
            selected: pc.sel.iter().map(|s| (*s).to_owned()).collect(),
            player_side: BattleSide::Atk,
            hover_unit: pc.hover.map(lookup),
            tile: pc.tile,
        };
        update_order_preview(&mut fs, &layer, &grid, &q, &st);
        compare_tree(
            &mut c,
            &format!("preview {id}"),
            &fs,
            ROOT,
            true,
            w.get("scene"),
        );
    }
    println!("preview: checks {}", c.checks);
    c.finish("preview");
}

#[test]
fn ghosts_match_web() {
    let d = load("units.json");
    let grid = mix_grid(&d);
    let mut c = Cmp::default();
    // The ghost cases of gen_units.ts §8: [id, fn, ghost, sel, deployPhase, drag, tile, dest, layout, zone, twice].
    type G = (
        &'static str,
        &'static str,
        bool,
        &'static [&'static str],
        bool,
        Option<(i32, i32, i32, i32)>,
        Option<(i32, i32)>,
        &'static [(&'static str, i32, i32)],
        &'static [(&'static str, i32, i32)],
        i32,
        bool,
    );
    let cases: Vec<G> = vec![
        (
            "move-ghosts",
            "move",
            true,
            &["a0", "a1", "a2"],
            false,
            None,
            Some((40, 70)),
            &[("a0", 41, 70), ("a1", 40, 71), ("zz", 12, 12), ("a2", 3, 3)],
            &[],
            999,
            false,
        ),
        (
            "move-ghosts-river",
            "move",
            true,
            &["a0"],
            false,
            None,
            Some((0, 0)),
            &[("a0", 0, 0), ("a1", 30, 70), ("a3", 40, 70)],
            &[],
            999,
            false,
        ),
        (
            "move-no-layer",
            "move",
            false,
            &["a0"],
            false,
            None,
            Some((41, 70)),
            &[("a0", 41, 70)],
            &[],
            999,
            false,
        ),
        (
            "move-empty-sel",
            "move",
            true,
            &[],
            false,
            None,
            Some((41, 70)),
            &[("a0", 41, 70)],
            &[],
            999,
            false,
        ),
        (
            "drag",
            "drag",
            true,
            &["a0", "a1", "a3", "zz"],
            false,
            Some((20, 75, 26, 70)),
            None,
            &[],
            &[("a0", 20, 75), ("a1", 21, 74), ("a3", 22, 76)],
            999,
            true,
        ),
        (
            "drag-partial-layout",
            "drag",
            false,
            &["a0", "a1"],
            false,
            Some((5, 140, 5, 140)),
            None,
            &[],
            &[("a1", 6, 141)],
            999,
            false,
        ),
        (
            "drag-none",
            "drag",
            true,
            &["a0"],
            false,
            None,
            None,
            &[],
            &[("a0", 1, 1)],
            999,
            false,
        ),
        (
            "drag-dead-only",
            "drag",
            true,
            &["a2"],
            false,
            Some((1, 1, 2, 2)),
            None,
            &[],
            &[("a2", 1, 1)],
            999,
            false,
        ),
        (
            "at",
            "at",
            true,
            &["a0", "a1", "a3"],
            true,
            None,
            Some((15, 60)),
            &[],
            &[("a0", 15, 60), ("a1", 16, 59), ("a3", 21, 58)],
            999,
            false,
        ),
        (
            "at-from-scratch",
            "at",
            false,
            &["a1"],
            true,
            None,
            Some((3, 150)),
            &[],
            &[("a1", 2, 155)],
            999,
            false,
        ),
        (
            "at-not-deploy",
            "at",
            true,
            &["a0"],
            false,
            None,
            Some((15, 60)),
            &[],
            &[("a0", 15, 60)],
            999,
            false,
        ),
        (
            "placement-zone",
            "placement",
            true,
            &["a0", "a1"],
            true,
            None,
            Some((20, 70)),
            &[],
            &[("a0", 20, 70), ("a1", 19, 71)],
            33,
            false,
        ),
        (
            "placement-out-of-zone",
            "placement",
            true,
            &["a0"],
            true,
            None,
            Some((40, 70)),
            &[],
            &[("a0", 40, 70)],
            33,
            false,
        ),
        (
            "placement-no-tile",
            "placement",
            true,
            &["a0"],
            true,
            None,
            None,
            &[],
            &[],
            33,
            false,
        ),
        (
            "placement-drag",
            "placement",
            true,
            &["a0", "a1"],
            true,
            Some((10, 30, 14, 36)),
            None,
            &[],
            &[("a0", 10, 30), ("a1", 12, 33)],
            33,
            false,
        ),
        (
            "placement-no-phase",
            "placement",
            true,
            &["a0"],
            false,
            None,
            Some((20, 70)),
            &[],
            &[],
            33,
            false,
        ),
    ];
    let web = d.get("direct").get("ghosts").arr();
    c.eq("ghost case count", cases.len(), web.len());
    for (case, w) in cases.iter().zip(web) {
        let &(id, func, ghost, sel, deploy_phase, drag, tile, dest, layout, zone, twice) = case;
        c.eq("ghost id", id, w.get("id").str());
        let (mut fs, layer) = overlay(ghost);
        let _ = layer;
        let roster = vec![
            fake("a0", BattleSide::Atk, 30, 70),
            fake("a1", BattleSide::Atk, 31, 71),
            with(fake("a2", BattleSide::Atk, 32, 72), |u| u.dead = true),
            fake("a3", BattleSide::Atk, 40, 70),
        ];
        let occ = vec![
            ((30, 70), roster[0].clone()),
            ((31, 71), roster[1].clone()),
            ((40, 70), roster[3].clone()),
        ];
        let q = Q {
            grid: &grid,
            roster: roster.clone(),
            occ,
            dest: dest.iter().map(|&(k, a, b)| (k.to_owned(), a, b)).collect(),
            zone,
            ghost_cases: true,
            layout: Some(
                layout
                    .iter()
                    .map(|&(k, a, b)| (k.to_owned(), a, b))
                    .collect(),
            ),
        };
        let st = PreviewState {
            deploy_phase,
            drag: drag.map(|(a, b, cc, dd)| DeployDrag {
                anchor_col: a,
                anchor_row: b,
                cur_col: cc,
                cur_row: dd,
            }),
            manual_input_active: true,
            selected: sel.iter().map(|s| (*s).to_owned()).collect(),
            player_side: BattleSide::Atk,
            hover_unit: None,
            tile,
        };
        for _ in 0..(if twice { 2 } else { 1 }) {
            match func {
                "move" => {
                    let (tc, tr) = tile.expect("tile");
                    refresh_battle_move_ghosts(&mut fs, &grid, &q, &st.selected, tc, tr);
                }
                "drag" => refresh_deploy_ghosts(&mut fs, &grid, &q, &st.selected, st.drag),
                "at" => {
                    let (tc, tr) = tile.expect("tile");
                    refresh_deploy_ghosts_at(&mut fs, &grid, &q, &st, tc, tr);
                }
                _ => update_deploy_placement_preview(&mut fs, &grid, &q, &st),
            }
        }
        compare_tree(
            &mut c,
            &format!("ghosts {id}"),
            &fs,
            ROOT,
            true,
            w.get("scene"),
        );
    }
    println!("ghosts: checks {}", c.checks);
    c.finish("ghosts");
}

#[test]
fn constants_equal_web() {
    let d = load("units.json");
    let k = d.get("consts");
    let mut c = Cmp::default();
    for (name, v) in [
        ("HPBAR_W", units::HPBAR_W),
        ("HPBAR_H", units::HPBAR_H),
        ("HPBAR_Y", units::HPBAR_Y),
        ("BAR_GAP_Y", units::BAR_GAP_Y),
        ("MORALEBAR_Y", units::MORALEBAR_Y),
        ("AMMOBAR_Y", units::AMMOBAR_Y),
        ("AMMOBAR_COLOR", f64::from(units::AMMOBAR_COLOR)),
        ("BAR_OUTLINE_PAD", units::BAR_OUTLINE_PAD),
        ("BAR_OUTLINE_Z", units::BAR_OUTLINE_Z),
        ("ORDER_LINE_Y", units::ORDER_LINE_Y),
        ("ORDER_COLOR_MOVE", f64::from(units::ORDER_COLOR_MOVE)),
        ("ORDER_COLOR_ATTACK", f64::from(units::ORDER_COLOR_ATTACK)),
        ("ORDER_MOVE_OPACITY", units::ORDER_MOVE_OPACITY),
        ("ORDER_ATTACK_OPACITY", units::ORDER_ATTACK_OPACITY),
    ] {
        c.f(name, v, k.get(name).hx()[0]);
    }
    let dd: Vec<(i32, i32)> = k
        .get("DIR_DELTA")
        .arr()
        .iter()
        .map(|p| (p.arr()[0].i32(), p.arr()[1].i32()))
        .collect();
    c.eq("DIR_DELTA", units::DIR_DELTA.to_vec(), dd);
    c.finish("consts");
}
