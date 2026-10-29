//! MOD-14 "battle 3D", part 4 (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q4): the
//! Rust `battle::dynamics` port of the per-frame animations and effects of
//! `battle/battleScene.ts` against states produced by RUNNING the web code of
//! `edb8fb56` (three@0.169.0, node v22.22.0) with a recording
//! `requestAnimationFrame`: walking, melee lunges, projectiles, death fades,
//! the ram, the catapult boulder, wall / gate breaches, rout + flee, group
//! markers, bar billboards, float labels and the deploy-phase frame — see
//! `tests/fixtures/battle3d/README.md` ("Part 4") and
//! `dyspozycje/rust-port/p4/P4-36-MOD14-BATTLE-3D.md` §29.
//!
//! The scene is built from the part-3 DTO (`build_battle_scene_with_units`,
//! verified by `tests/battle3d_units.rs`); every event then replays what the
//! web logic decided (facing, rout, retreat cell, morale — Z-36-13) and
//! compares positions bit for bit at every sampled frame, plus unit-model /
//! bar / projectile / rubble / wall / marker signatures (FNV-1a over full node
//! records) and the scene summary. Any difference fails.

#![allow(clippy::float_cmp)]

use std::collections::HashMap;
use std::path::PathBuf;

use civ_renderer::battle::dynamics::{
    billboard_all, breach_gate, breach_wall_tile, deploy_phase_frame, ease_in, ease_out,
    end_deploy_phase, launch_projectile, lerp, make_projectile_mesh, projectile_kind,
    ranged_shot_endpoints, retreat_from_wall, rout_facing, set_facing, tick_fades,
    tick_projectiles, wall_shot_endpoints, Boulder, CanvasOp, Fade, FloatLabel, GroupMarkers,
    GroupNumberTexture, MeleeLunge, MoveAnim, Projectile, ProjectileKind, RamAnim, BLOW_HIT_T,
    BLOW_LUNGE_MS, BLOW_SETTLE_MS, DEATH_FADE_MS, MORALE_GATE_BREACH, MORALE_WALL_BREACH,
    MOVE_STEP_MS, RANGED_FLY_MS, RANGED_GAP_MS, STEP_GAP_MS,
};
use civ_renderer::battle::field::{
    BattleSceneOpts, DeploySide, FieldScene, LightKind, TerrainGrid, BF_COLS, BF_ROWS,
};
use civ_renderer::battle::units::{
    self, build_battle_scene_with_units, remove_unit_from_scene, siege_wall_civ, update_ammo_bar,
    update_morale_bar, BattleScene3, BattleSide, BattleUnitsOpts, PlacedUnit, UnitSpawn,
};
use civ_renderer::geom::{Mat4, Vec3};
use civ_renderer::models::cities::model::js_number_to_string;
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

// ---------------------------------------------------------------------------
// The byte stream of `gen_dynamics.ts` (`nodeRecord` of `gen_units.ts` +
// Sprite, `modelRecord` without skipping group markers, `sceneSummary`).

/// Kind codes of `gen_dynamics.ts::KIND`.
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
        NodeKind::Sprite(_) => (9, "Sprite"),
        ref k @ NodeKind::LineLoop(_) => panic!("unexpected node kind {k:?}"),
    }
}

fn material_of(fs: &FieldScene, n: NodeId) -> Option<usize> {
    if let Some(l) = fs.line_at(n) {
        return Some(l.material);
    }
    if let Some(m) = fs.scene.nodes[n].sprite_material() {
        return Some(m);
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

/// `matSig` of `gen_dynamics.ts` (= `gen_units.ts`).
fn mat_sig(fs: &FieldScene, slot: usize) -> u32 {
    let m = &fs.scene.materials[slot];
    let mut r = Bytes::default();
    r.str(mat_type(fs, slot));
    let c = m.linear_color();
    r.u32(if c.r.is_nan() || c.g.is_nan() || c.b.is_nan() {
        0
    } else {
        m.hex()
    });
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
    r: [f64; 3],
    q: [f64; 4],
    s: [f64; 3],
    vis: bool,
    geo: Option<(String, u32, Vec<f64>)>,
    mat_sig: Option<u32>,
}

/// Pre-order sub-tree of `root` with the world matrices of
/// `root.updateMatrixWorld(true)` (ancestors included when attached).
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

/// `dumpTree(root)` of `gen_dynamics.ts`.
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
        let rot = [node.rotation.x, node.rotation.y, node.rotation.z];
        for v in [node.position.x, node.position.y, node.position.z] {
            r.f64(v);
        }
        for v in rot {
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
        if code == 3 || code == 5 || code == 9 {
            let slot = material_of(fs, n).expect("mat");
            let next = mat_ids.len();
            let mid = *mat_ids.entry(slot).or_insert(next);
            r.u32(u32::try_from(mid).expect("mid"));
            if code != 9 {
                let g = geo_of(fs, n).expect("geo");
                r.str(g.three_type());
                let gh = geo_hash(&g.mesh());
                r.u32(gh);
                let par = units::geo_parameters(g);
                for &v in &par {
                    r.f64(v);
                }
                geo_v = Some((g.three_type().to_owned(), gh, par));
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
            ms_v = Some(ms);
        }
        all.0.extend_from_slice(&r.0);
        out.push(NodeView {
            sig: r.hash(),
            kind: kname,
            parent,
            p: [node.position.x, node.position.y, node.position.z],
            r: rot,
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
fn compare_tree(c: &mut Cmp, ctx: &str, fs: &FieldScene, root: NodeId, w: &Json) {
    let (sig, nodes) = dump_tree(fs, root, false);
    c.eq(
        &format!("{ctx} n"),
        nodes.len(),
        usize::try_from(w.get("n").i64()).expect("n"),
    );
    c.eq(&format!("{ctx} sig"), sig, w.get("sig").u32());
    let Some(wn) = w.opt("nodes") else { return };
    c.eq(&format!("{ctx} nodes len"), nodes.len(), wn.arr().len());
    for (i, (r, wv)) in nodes.iter().zip(wn.arr()).enumerate() {
        let cx = format!("{ctx} node {i}");
        if r.sig == wv.get("sig").u32() {
            c.checks += 1;
            continue;
        }
        c.eq(&format!("{cx} sig"), r.sig, wv.get("sig").u32());
        c.eq(&format!("{cx} kind"), r.kind, wv.get("k").str());
        c.eq(&format!("{cx} parent"), r.parent, wv.get("parent").i64());
        c.fs(&format!("{cx} p"), &r.p, &wv.get("p").hx());
        c.fs(&format!("{cx} r"), &r.r, &wv.get("r").hx());
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
}

/// `modelRecord` of `gen_dynamics.ts`: `[n, meshes, tris, sig, all]`.
fn model_record(fs: &FieldScene, root: NodeId) -> Vec<u32> {
    let mut f = Bytes::default();
    let mut all = Bytes::default();
    let (mut meshes, mut tris, mut n) = (0u32, 0u32, 0u32);
    for (id, world) in subtree_world(fs, root) {
        n += 1;
        let node = &fs.scene.nodes[id];
        let is_line = fs.line_at(id).is_some();
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
        assert!(!is_line);
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
    vec![n, meshes, tris, f.hash(), all.hash()]
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

fn rle_tiles(w: &Json) -> Vec<u8> {
    let mut tiles = Vec::new();
    for pair in w.arr().chunks(2) {
        let k = u8::try_from(pair[0].i64()).expect("kind");
        let n = usize::try_from(pair[1].i64()).expect("count");
        tiles.extend(std::iter::repeat_n(k, n));
    }
    assert_eq!(
        tiles.len(),
        usize::try_from(BF_COLS * BF_ROWS).expect("len")
    );
    tiles
}

fn rle_grid(w: &Json) -> TerrainGrid {
    TerrainGrid::new(BF_COLS, BF_ROWS, rle_tiles(w))
}

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

/// `sceneSummary` of `gen_dynamics.ts`: `[children, nodes, struct]`.
fn scene_summary(fs: &FieldScene) -> Vec<u32> {
    let mut f = Bytes::default();
    for &ch in &fs.scene.nodes[ROOT].children {
        let k = fs.scene.traverse_from(ch).len();
        f.u32(kind_code(fs, ch, false, ROOT).0);
        f.u32(u32::try_from(k).expect("k"));
        f.bool(fs.scene.nodes[ch].visible);
    }
    vec![
        u32::try_from(fs.scene.nodes[ROOT].children.len()).expect("c"),
        u32::try_from(fs.scene.traverse().len()).expect("n"),
        f.hash(),
    ]
}

/// Builds the scene of a web constructor record (DTO + deploy moves).
fn build(rec: &Json) -> BattleScene3 {
    let siege = rec.opt("siege").unwrap_or(&Json::Null);
    let deploy = rec.get("deploy");
    let opts = BattleUnitsOpts {
        field: BattleSceneOpts {
            grid: rle_grid(rec.get("tilesRle")),
            desert_palette: rec.get("desert").bool(),
            siege: !siege.is_null(),
            deploy: if deploy.is_null() {
                None
            } else if deploy.str() == "atk" {
                Some(DeploySide::Atk)
            } else {
                Some(DeploySide::Def)
            },
        },
        siege_civ: siege_wall_civ(
            if siege.is_null() {
                None
            } else {
                siege.opt("civ").map(Json::str)
            },
            None,
        )
        .to_owned(),
        player_side: side_of(rec.get("player").str()),
        units: rec.get("spawn").arr().iter().map(spawn_of).collect(),
    };
    let mut b = build_battle_scene_with_units(opts);
    for m in rec.get("moves").arr() {
        let a = m.arr();
        assert!(b.move_deploy_unit(a[0].str(), a[1].i32(), a[2].i32()));
    }
    b
}

fn unit_ix(b: &BattleScene3, id: &str) -> (BattleSide, usize) {
    if let Some(i) = b.atk.iter().position(|u| u.spawn.id == id) {
        return (BattleSide::Atk, i);
    }
    let i = b
        .def
        .iter()
        .position(|u| u.spawn.id == id)
        .expect("unit id");
    (BattleSide::Def, i)
}

fn unit<'a>(b: &'a BattleScene3, id: &str) -> &'a PlacedUnit {
    match unit_ix(b, id) {
        (BattleSide::Atk, i) => &b.atk[i],
        (BattleSide::Def, i) => &b.def[i],
    }
}

fn unit_mut<'a>(b: &'a mut BattleScene3, id: &str) -> &'a mut PlacedUnit {
    match unit_ix(b, id) {
        (BattleSide::Atk, i) => &mut b.atk[i],
        (BattleSide::Def, i) => &mut b.def[i],
    }
}

/// `posOf(ru)`: group then bar position.
fn pos_of(b: &BattleScene3, id: &str) -> Vec<f64> {
    let u = unit(b, id);
    let s = &b.field.field.scene;
    let (g, p) = (s.nodes[u.group].position, s.nodes[u.bars.group].position);
    vec![g.x, g.y, g.z, p.x, p.y, p.z]
}

fn v3(v: Vec3) -> Vec<f64> {
    vec![v.x, v.y, v.z]
}

/// `unitState(ru)`: `[id, modelRecord, [bars n, bars sig]]`.
fn compare_unit_state(c: &mut Cmp, ctx: &str, b: &BattleScene3, w: &Json) {
    let a = w.arr();
    let u = unit(b, a[0].str());
    let fs = &b.field.field;
    c.eq(
        &format!("{ctx} {} model", a[0].str()),
        model_record(fs, u.group),
        json_u32s(&a[1]),
    );
    let (sig, nodes) = dump_tree(fs, u.bars.group, false);
    c.eq(
        &format!("{ctx} {} bars", a[0].str()),
        vec![u32::try_from(nodes.len()).expect("n"), sig],
        json_u32s(&a[2]),
    );
}

fn grid_rle(g: &TerrainGrid) -> Vec<u32> {
    let mut out = Vec::new();
    let t = &g.tiles;
    let mut i = 0;
    while i < t.len() {
        let mut j = i;
        while j < t.len() && t[j] == t[i] {
            j += 1;
        }
        out.push(u32::from(t[i]));
        out.push(u32::try_from(j - i).expect("run"));
        i = j;
    }
    out
}

/// The dynamics state the test threads through the events.
struct World {
    b: BattleScene3,
    grid: TerrainGrid,
    labels: Vec<FloatLabel>,
    morale: HashMap<String, f64>,
    dead: HashMap<String, bool>,
    group_ids: HashMap<String, Option<String>>,
    markers: GroupMarkers,
}

impl World {
    fn wall_col(&self) -> i32 {
        self.b.field.siege.as_ref().expect("siege").wall_col
    }
    fn is_dead(&self, id: &str) -> bool {
        self.dead.get(id).copied().unwrap_or(false)
    }
}

#[allow(clippy::too_many_lines)]
fn run_event(c: &mut Cmp, w: &mut World, e: &Json, k: usize) {
    let op = e.get("op").str();
    let cx = format!("event {k} {op}");
    match op {
        "move" => {
            let id = e.get("id").str();
            let t0 = e.get("t0").num();
            let facing = e.get("facing").i32();
            let (col, row) = (e.get("col").i32(), e.get("row").i32());
            let anim = {
                let u = unit_mut(&mut w.b, id);
                MoveAnim::start(&w.grid, u, col, row, t0)
            };
            {
                let u = unit(&w.b, id).clone();
                set_facing(&mut w.b.field.field.scene, &u, facing);
            }
            let mut done = false;
            for s in e.get("samples").arr() {
                let a = s.arr();
                if !done {
                    let u = unit(&w.b, id).clone();
                    done = anim.step(&mut w.b.field.field.scene, &u, a[0].num());
                }
                c.fs(
                    &format!("{cx} {id} t={}", a[0].num()),
                    &pos_of(&w.b, id),
                    &a[1].hx(),
                );
                c.eq(&format!("{cx} done"), done, a[2].i64() == 1);
            }
            compare_unit_state(c, &cx, &w.b, e.get("end"));
        }
        "melee" => {
            let (att, def) = (e.get("att").str(), e.get("def").str());
            let t0 = e.get("t0").num();
            let kill = e.get("killAtt").bool();
            let counter = e.get("counter").bool();
            let (ua, ud) = (unit(&w.b, att).clone(), unit(&w.b, def).clone());
            let mut lunge = MeleeLunge::start(&w.grid, (ua.col, ua.row), (ud.col, ud.row), t0);
            set_facing(&mut w.b.field.field.scene, &ua, e.get("attFacing").i32());
            let (mut finished, mut hit_seen, mut blows) = (false, false, 0i64);
            for s in e.get("samples").arr() {
                let a = s.arr();
                let t = a[0].num();
                if !finished {
                    let hit = lunge.hit_due(t);
                    if hit {
                        hit_seen = true;
                        blows += 1;
                        // _singleBlow → damage label for the (live) defender.
                        w.labels
                            .push(FloatLabel::damage(&w.grid, ud.col, ud.row, 0.0));
                        if counter {
                            blows += 1;
                            set_facing(&mut w.b.field.field.scene, &ud, e.get("defFacing").i32());
                            if !kill {
                                w.labels
                                    .push(FloatLabel::damage(&w.grid, ua.col, ua.row, 0.0));
                            }
                        }
                    }
                    let alive = !(kill && hit_seen);
                    let st = lunge.step(&mut w.b.field.field.scene, &ua, t, alive);
                    c.eq(&format!("{cx} hit t={t}"), st.hit, hit);
                    finished = st.finished;
                }
                c.fs(&format!("{cx} {att} t={t}"), &pos_of(&w.b, att), &a[1].hx());
                c.eq(&format!("{cx} blows t={t}"), blows, a[2].i64());
                c.eq(&format!("{cx} finished t={t}"), finished, a[3].i64() == 1);
            }
            c.eq(
                &format!("{cx} sched"),
                json_u32s(e.get("sched")),
                vec![220u32],
            );
            for s in e.get("end").arr() {
                compare_unit_state(c, &cx, &w.b, s);
            }
        }
        "shots" => {
            let mut flights = Vec::new();
            let mut list: Vec<Projectile> = Vec::new();
            for s in e.get("shots").arr() {
                let id = s.get("id").str();
                let u = unit(&w.b, id).clone();
                let target = unit(&w.b, s.get("target").str()).clone();
                let cat = s.get("cat");
                let category = if cat.is_null() {
                    u.spawn.category.clone()
                } else {
                    cat.str().to_owned()
                };
                let kind = projectile_kind(&category, &u.spawn.model_name);
                c.eq(
                    &format!("{cx} {id} kind"),
                    kind.web_name(),
                    s.get("kind").str(),
                );
                set_facing(&mut w.b.field.field.scene, &u, s.get("facing").i32());
                let ammo = num(s.get("ammo"));
                update_ammo_bar(
                    &mut w.b.field.field.scene,
                    &u.bars,
                    u.ammo_bar_shown,
                    ammo,
                    u.spawn.ammo_max,
                );
                let (from, to) =
                    ranged_shot_endpoints(&w.grid, (u.col, u.row), (target.col, target.row));
                let p = launch_projectile(
                    &mut w.b.field.field.scene,
                    kind,
                    from,
                    to,
                    s.get("t0").num(),
                );
                let fs = &w.b.field.field;
                c.eq(
                    &format!("{cx} {id} index"),
                    root_index(fs, p.node),
                    s.get("index").i64(),
                );
                compare_tree(c, &format!("{cx} {id} tree"), fs, p.node, s.get("tree"));
                compare_unit_state(c, &cx, &w.b, s.get("bars"));
                c.eq(
                    &format!("{cx} sched"),
                    json_u32s(s.get("sched")),
                    vec![380u32],
                );
                flights.push(p.node);
                list.push(p);
            }
            for t in e.get("ticks").arr() {
                let a = t.arr();
                let tt = a[0].num();
                tick_projectiles(&mut w.b.field.field.scene, &mut list, tt);
                for (i, (f, wv)) in flights.iter().zip(a[1].arr()).enumerate() {
                    let active = list.iter().any(|p| p.node == *f);
                    if wv.is_null() {
                        c.eq(&format!("{cx} flight {i} t={tt} removed"), active, false);
                        c.eq(
                            &format!("{cx} flight {i} detached"),
                            w.b.field.field.scene.nodes[*f].parent,
                            None,
                        );
                    } else {
                        c.eq(&format!("{cx} flight {i} t={tt} active"), active, true);
                        c.fs(
                            &format!("{cx} flight {i} t={tt}"),
                            &v3(w.b.field.field.scene.nodes[*f].position),
                            &wv.hx(),
                        );
                    }
                }
                c.eq(
                    &format!("{cx} t={tt} n"),
                    list.len(),
                    usize::try_from(a[2].i64()).expect("n"),
                );
                c.eq(
                    &format!("{cx} t={tt} summary"),
                    scene_summary(&w.b.field.field),
                    json_u32s(&a[3]),
                );
            }
        }
        "fade" => {
            let ids: Vec<&str> = e.get("ids").arr().iter().map(Json::str).collect();
            let t0s: Vec<f64> = e.get("t0s").arr().iter().map(Json::num).collect();
            let mut list: Vec<(usize, Fade)> = ids
                .iter()
                .zip(&t0s)
                .map(|(id, &t)| (unit_ix(&w.b, id).1, Fade { start: t }))
                .collect();
            for s in e.get("samples").arr() {
                let a = s.arr();
                let t = a[0].num();
                let atk = w.b.atk.clone();
                tick_fades(&mut w.b.field.field.scene, &atk, &mut list, t);
                for (id, wv) in ids.iter().zip(a[1].arr()) {
                    let v = wv.arr();
                    let fading = list.iter().any(|(i, _)| w.b.atk[*i].spawn.id == *id);
                    compare_unit_state(c, &format!("{cx} t={t}"), &w.b, &v[0]);
                    c.eq(&format!("{cx} {id} fading t={t}"), fading, v[2].i64() == 1);
                    let u = unit(&w.b, id);
                    let sc = &w.b.field.field.scene;
                    c.eq(
                        &format!("{cx} {id} vis"),
                        sc.nodes[u.group].visible,
                        v[3].bool(),
                    );
                    c.eq(
                        &format!("{cx} {id} bars vis"),
                        sc.nodes[u.bars.group].visible,
                        v[4].bool(),
                    );
                    if v[1].i64() == 1 {
                        w.dead.insert((*id).to_owned(), true);
                    }
                }
                c.eq(
                    &format!("{cx} t={t} n"),
                    list.len(),
                    usize::try_from(a[2].i64()).expect("n"),
                );
            }
        }
        "ram" => {
            let id = e.get("id").str();
            let u = unit(&w.b, id).clone();
            let start = w.b.field.field.scene.nodes[u.group].position;
            c.fs(&format!("{cx} start"), &v3(start), &e.get("start").hx());
            let g = e.get("gate").arr();
            let anim = RamAnim::start(start, (g[0].i32(), g[1].i32()), e.get("t0").num());
            let mut done = false;
            for s in e.get("samples").arr() {
                let a = s.arr();
                if !done {
                    done = anim.step(
                        &mut w.b.field.field.scene,
                        u.group,
                        a[0].num(),
                        a[1].i64() == 1,
                    );
                }
                c.fs(
                    &format!("{cx} t={}", a[0].num()),
                    &v3(w.b.field.field.scene.nodes[u.group].position),
                    &a[2].hx(),
                );
                c.eq(
                    &format!("{cx} done t={}", a[0].num()),
                    done,
                    a[3].i64() == 1,
                );
            }
            compare_unit_state(c, &cx, &w.b, e.get("end"));
        }
        "boulder" => {
            let id = e.get("id").str();
            let u = unit(&w.b, id).clone();
            let row = e.get("row").i32();
            let wall_col = w.wall_col();
            let (from, to) = wall_shot_endpoints(&w.grid, (u.col, u.row), wall_col, row);
            let bo = Boulder::spawn(&mut w.b.field.field.scene, from, to, e.get("t0").num());
            compare_tree(
                c,
                &format!("{cx} tree"),
                &w.b.field.field,
                bo.node,
                e.get("tree"),
            );
            let mut removed = false;
            for s in e.get("samples").arr() {
                let a = s.arr();
                if !removed {
                    removed = bo.step(&mut w.b.field.field.scene, a[0].num(), false);
                }
                let sc = &w.b.field.field.scene;
                if a[1].is_null() {
                    c.eq(
                        &format!("{cx} removed t={}", a[0].num()),
                        sc.nodes[bo.node].parent,
                        None,
                    );
                } else {
                    c.fs(
                        &format!("{cx} t={}", a[0].num()),
                        &v3(sc.nodes[bo.node].position),
                        &a[1].hx(),
                    );
                }
                c.eq(
                    &format!("{cx} children t={}", a[0].num()),
                    sc.nodes[ROOT].children.len(),
                    usize::try_from(a[2].i64()).expect("n"),
                );
            }
            c.eq(
                &format!("{cx} sched"),
                json_u32s(e.get("sched")),
                vec![700u32],
            );
            // The scheduled hit: '-dmg (mur)' label, then the breach (HP 1 → 0).
            let clock = 61_000.25;
            w.labels.push(FloatLabel::wall(wall_col, row, clock));
            breach(c, w, e, &cx, row, clock);
        }
        "breachWall" => {
            let row = e.get("row").i32();
            breach(c, w, e, &cx, row, 62_000.0 + f64::from(row));
        }
        "breachGate" => {
            let g = e.get("gate").arr();
            let wall = w.b.wall.clone();
            breach_gate(
                &mut w.b.field.field.scene,
                &mut w.grid,
                wall.as_ref(),
                g[0].i32(),
                g[1].i32(),
            );
            for m in e.get("morale").arr() {
                let a = m.arr();
                let id = a[0].str();
                let morale = num(&a[1]);
                w.morale.insert(id.to_owned(), morale);
                if a[2].i64() == 0 {
                    let u = unit(&w.b, id).clone();
                    update_morale_bar(
                        &mut w.b.field.field.scene,
                        &u.bars,
                        morale,
                        u.spawn.morale_max,
                    );
                }
            }
            c.eq(&format!("{cx} routs"), e.get("routs").arr().len(), 0);
            for s in e.get("defs").arr() {
                compare_unit_state(c, &cx, &w.b, s);
            }
            let fs = &w.b.field.field;
            let wall = w.b.wall.as_ref().expect("wall");
            c.eq(
                &format!("{cx} wall"),
                model_record(fs, wall.group),
                json_u32s(e.get("wall")),
            );
            compare_tree(
                c,
                &format!("{cx} wall tree"),
                fs,
                wall.group,
                e.get("wallTree"),
            );
            c.eq(
                &format!("{cx} tiles"),
                grid_rle(&w.grid),
                json_u32s(e.get("tiles")),
            );
            c.eq(
                &format!("{cx} summary"),
                scene_summary(fs),
                json_u32s(e.get("summary")),
            );
        }
        "flee" => {
            let id = e.get("id").str();
            let side = unit(&w.b, id).spawn.side;
            for r in e.get("routs").arr() {
                let u = unit(&w.b, r.str()).clone();
                set_facing(&mut w.b.field.field.scene, &u, rout_facing(side));
            }
            let frames = e.get("frames").arr();
            let mut fi = 0;
            for m in e.get("moves").arr() {
                let a = m.arr();
                let anim = {
                    let u = unit_mut(&mut w.b, id);
                    MoveAnim::start(&w.grid, u, a[1].i32(), a[2].i32(), a[3].num())
                };
                let u = unit(&w.b, id).clone();
                set_facing(&mut w.b.field.field.scene, &u, a[4].i32());
                for _ in 0..2 {
                    let f = frames[fi].arr();
                    fi += 1;
                    anim.step(&mut w.b.field.field.scene, &u, f[0].num());
                    c.fs(
                        &format!("{cx} t={}", f[0].num()),
                        &pos_of(&w.b, id),
                        &f[1].hx(),
                    );
                }
            }
            c.eq(&format!("{cx} frames"), fi, frames.len());
            if e.get("removed").i64() == 1 {
                let mut u = unit(&w.b, id).clone();
                remove_unit_from_scene(&mut w.b.field.field.scene, &mut u);
                *unit_mut(&mut w.b, id) = u;
                w.dead.insert(id.to_owned(), true);
            }
            let u = unit(&w.b, id);
            let sc = &w.b.field.field.scene;
            let vis = e.get("vis").arr();
            c.eq(
                &format!("{cx} vis"),
                sc.nodes[u.group].visible,
                vis[0].bool(),
            );
            c.eq(
                &format!("{cx} bars vis"),
                sc.nodes[u.bars.group].visible,
                vis[1].bool(),
            );
            c.eq(
                &format!("{cx} summary"),
                scene_summary(&w.b.field.field),
                json_u32s(e.get("summary")),
            );
        }
        "markers" => {
            for m in e.get("marks").arr() {
                let id = m.get("id").str();
                let gid = m.get("gid");
                let gid = if gid.is_null() {
                    None
                } else {
                    Some(gid.str().to_owned())
                };
                w.group_ids.insert(id.to_owned(), gid.clone());
                let u = unit(&w.b, id).clone();
                w.markers.update(
                    &mut w.b.field.field,
                    &u,
                    gid.as_deref(),
                    m.get("dead").bool(),
                );
                let mk = w.markers.get(id).cloned();
                let tree = m.get("tree");
                c.eq(&format!("{cx} {id} present"), mk.is_some(), !tree.is_null());
                if let Some(mk) = &mk {
                    compare_tree(
                        c,
                        &format!("{cx} {id} frame"),
                        &w.b.field.field,
                        mk.group,
                        tree,
                    );
                }
                c.eq(
                    &format!("{cx} {id} model"),
                    model_record(&w.b.field.field, u.group),
                    json_u32s(m.get("model")),
                );
                let tex = m.get("tex").arr();
                let sprite_tex = mk
                    .as_ref()
                    .and_then(|x| x.sprite.as_ref())
                    .map(|(_, t)| t.clone());
                c.eq(
                    &format!("{cx} {id} textures"),
                    usize::from(sprite_tex.is_some()),
                    tex.len(),
                );
                if let (Some(t), Some(wt)) = (sprite_tex, tex.first()) {
                    compare_texture(c, &format!("{cx} {id}"), &t, wt);
                }
            }
            // sync: roster[0] dead, roster[3] ungrouped, roster[6] grouped '4'
            let after = e.get("sync").get("after").arr();
            for a in after {
                let a = a.arr();
                let id = a[0].str();
                let gid = if a[1].is_null() {
                    None
                } else {
                    Some(a[1].str().to_owned())
                };
                w.group_ids.insert(id.to_owned(), gid);
            }
            let first = after[0].arr()[0].str().to_owned();
            w.dead.insert(first.clone(), true);
            let roster: Vec<(PlacedUnit, Option<String>, bool)> =
                w.b.atk
                    .iter()
                    .map(|u| {
                        (
                            u.clone(),
                            w.group_ids.get(&u.spawn.id).cloned().flatten(),
                            w.is_dead(&u.spawn.id),
                        )
                    })
                    .collect();
            let refs: Vec<(&PlacedUnit, Option<&str>, bool)> = roster
                .iter()
                .map(|(u, g, d)| (u, g.as_deref(), *d))
                .collect();
            w.markers.sync_all(&mut w.b.field.field, &refs);
            w.dead.insert(first, false);
            for a in after {
                let a = a.arr();
                let u = unit(&w.b, a[0].str());
                c.eq(
                    &format!("{cx} sync {} model", a[0].str()),
                    model_record(&w.b.field.field, u.group),
                    json_u32s(&a[3]),
                );
            }
            // textures created by the sync, in roster order
            let wtex = e.get("sync").get("tex").arr();
            let made: Vec<GroupNumberTexture> = refs
                .iter()
                .filter(|(u, g, d)| g.is_some_and(|g| !g.is_empty()) && !d && !u.removed)
                .filter_map(|(u, _, _)| w.markers.get(&u.spawn.id))
                .filter_map(|m| m.sprite.as_ref().map(|(_, t)| t.clone()))
                .collect();
            c.eq(&format!("{cx} sync textures"), made.len(), wtex.len());
            for (t, wt) in made.iter().zip(wtex) {
                compare_texture(c, &format!("{cx} sync"), t, wt);
            }
            c.eq(
                &format!("{cx} summary"),
                scene_summary(&w.b.field.field),
                json_u32s(e.get("summary")),
            );
        }
        "billboard" => {
            for cam in e.get("cams").arr() {
                let camera = &mut w.b.field.camera;
                camera.dist = cam.get("dist").num();
                let t = cam.get("target");
                if !t.is_null() {
                    let t = t.arr();
                    camera.target =
                        civ_renderer::pick::three::Vec3::new(t[0].num(), t[1].num(), t[2].num());
                }
                camera.apply();
                let cp = camera.position;
                c.fs(
                    &format!("{cx} camera"),
                    &[cp.x, cp.y, cp.z],
                    &cam.get("cam").hx(),
                );
                let rows = cam.get("rows").arr();
                let all: Vec<PlacedUnit> = w.b.atk.iter().chain(w.b.def.iter()).cloned().collect();
                let flags: Vec<(&PlacedUnit, bool)> = all
                    .iter()
                    .zip(rows)
                    .map(|(u, r)| (u, r.arr()[1].i64() == 0))
                    .collect();
                billboard_all(
                    &mut w.b.field.field.scene,
                    &flags,
                    Vec3::new(cp.x, cp.y, cp.z),
                );
                c.eq(&format!("{cx} rows"), all.len(), rows.len());
                for (u, r) in all.iter().zip(rows) {
                    let r = r.arr();
                    c.eq(&format!("{cx} id"), u.spawn.id.as_str(), r[0].str());
                    c.eq(
                        &format!("{cx} {} dead", u.spawn.id),
                        w.is_dead(&u.spawn.id),
                        r[1].i64() == 1,
                    );
                    let (sig, nodes) = dump_tree(&w.b.field.field, u.bars.group, false);
                    c.eq(
                        &format!("{cx} {} bars", u.spawn.id),
                        vec![u32::try_from(nodes.len()).expect("n"), sig],
                        vec![r[2].u32(), r[3].u32()],
                    );
                }
                compare_tree(
                    c,
                    &format!("{cx} first"),
                    &w.b.field.field,
                    w.b.atk[0].bars.group,
                    cam.get("first"),
                );
            }
        }
        "labels" => {
            let wl = e.get("labels").arr();
            c.eq(&format!("{cx} count"), w.labels.len(), wl.len());
            for (i, (l, x)) in w.labels.iter().zip(wl).enumerate() {
                let a = x.arr();
                c.fs(&format!("{cx} {i} world"), &v3(l.world), &a[0].hx());
                c.f(&format!("{cx} {i} start"), l.start, a[1].num());
                c.f(&format!("{cx} {i} duration"), l.duration, a[2].num());
                c.f(&format!("{cx} {i} rise"), l.rise_rate, a[3].num());
            }
            let mut alive = vec![true; w.labels.len()];
            let mut opacity = vec![String::new(); w.labels.len()];
            for t in e.get("ticks").arr() {
                let a = t.arr();
                let tt = a[0].num();
                let mut projected = Vec::new();
                for (i, l) in w.labels.iter().enumerate() {
                    if !alive[i] {
                        continue;
                    }
                    match l.sample(tt) {
                        None => alive[i] = false,
                        Some((p, o)) => {
                            projected.push(p);
                            opacity[i] = js_number_to_string(o);
                        }
                    }
                }
                let wp = a[1].arr();
                c.eq(&format!("{cx} t={tt} projected"), projected.len(), wp.len());
                for (i, (p, x)) in projected.iter().zip(wp).enumerate() {
                    c.fs(&format!("{cx} t={tt} p{i}"), &v3(*p), &x.hx());
                }
                for (i, x) in a[2].arr().iter().enumerate() {
                    if x.is_null() {
                        c.eq(&format!("{cx} t={tt} label {i} removed"), alive[i], false);
                    } else {
                        c.eq(
                            &format!("{cx} t={tt} label {i} opacity"),
                            opacity[i].as_str(),
                            x.str(),
                        );
                    }
                }
                c.eq(
                    &format!("{cx} t={tt} n"),
                    alive.iter().filter(|&&x| x).count(),
                    usize::try_from(a[3].i64()).expect("n"),
                );
            }
        }
        other => panic!("unknown op {other}"),
    }
}

fn compare_texture(c: &mut Cmp, ctx: &str, t: &GroupNumberTexture, w: &Json) {
    let a = w.arr();
    c.eq(&format!("{ctx} tex label"), t.label.as_str(), a[0].str());
    c.eq(&format!("{ctx} tex canvas"), a[2].bool(), true);
    let ops = a[1].arr();
    let s = GroupNumberTexture::SIZE;
    // ['createElement', 'canvas'], …ops…, ['size', w, h]
    c.eq(
        &format!("{ctx} createElement"),
        ops[0].arr()[1].str(),
        "canvas",
    );
    let last = ops[ops.len() - 1].arr();
    c.eq(
        &format!("{ctx} size"),
        (last[1].u32(), last[2].u32()),
        (s, s),
    );
    let mid = &ops[1..ops.len() - 1];
    let rust = t.ops();
    c.eq(&format!("{ctx} ops len"), rust.len(), mid.len());
    for (r, x) in rust.iter().zip(mid) {
        let x = x.arr();
        let nums = |i: usize| x[i].num();
        let ok = match r {
            CanvasOp::FillStyle(v) => {
                x[0].str() == "set" && x[1].str() == "fillStyle" && x[2].str() == *v
            }
            CanvasOp::StrokeStyle(v) => {
                x[0].str() == "set" && x[1].str() == "strokeStyle" && x[2].str() == *v
            }
            CanvasOp::LineWidth(v) => {
                x[0].str() == "set" && x[1].str() == "lineWidth" && nums(2) == *v
            }
            CanvasOp::Font(v) => x[0].str() == "set" && x[1].str() == "font" && x[2].str() == *v,
            CanvasOp::TextAlign(v) => {
                x[0].str() == "set" && x[1].str() == "textAlign" && x[2].str() == *v
            }
            CanvasOp::TextBaseline(v) => {
                x[0].str() == "set" && x[1].str() == "textBaseline" && x[2].str() == *v
            }
            CanvasOp::FillRect(a, b, cc, d) => {
                x[0].str() == "fillRect"
                    && [nums(1), nums(2), nums(3), nums(4)] == [*a, *b, *cc, *d]
            }
            CanvasOp::StrokeRect(a, b, cc, d) => {
                x[0].str() == "strokeRect"
                    && [nums(1), nums(2), nums(3), nums(4)] == [*a, *b, *cc, *d]
            }
            CanvasOp::FillText(s, a, b) => {
                x[0].str() == "fillText" && x[1].str() == s && nums(2) == *a && nums(3) == *b
            }
        };
        c.eq(&format!("{ctx} op {r:?}"), ok, true);
    }
}

/// The scene part of `_breachWallTile(row)` + the logic's outcome (`changed`).
fn breach(c: &mut Cmp, w: &mut World, e: &Json, cx: &str, row: i32, clock: f64) {
    let wall = w.b.wall.clone();
    let wall_col = w.wall_col();
    let kids0 = w.b.field.field.scene.nodes[ROOT].children.len();
    let (rubble, label) = breach_wall_tile(
        &mut w.b.field.field.scene,
        &mut w.grid,
        wall.as_ref(),
        wall_col,
        row,
        clock,
    );
    w.labels.push(label);
    let fs = &w.b.field.field;
    c.eq(
        &format!("{cx} rubble root"),
        fs.scene.nodes[ROOT].children[kids0..].to_vec(),
        rubble.clone(),
    );
    let wr = e.get("rubble").arr();
    c.eq(&format!("{cx} rubble n"), rubble.len(), wr.len());
    for (i, (n, x)) in rubble.iter().zip(wr).enumerate() {
        compare_tree(c, &format!("{cx} rubble {i}"), fs, *n, x);
    }
    if let Some(changed) = e.opt("changed") {
        for ch in changed.arr() {
            let a = ch.arr();
            let id = a[0].str();
            if a[4].i64() == 1 {
                // a defender catapult on the tile is destroyed: dead, fadingOut set,
                // fadeStart = performance.now() — no scene change (W-17).
                w.dead.insert(id.to_owned(), true);
            } else {
                let mut u = unit(&w.b, id).clone();
                retreat_from_wall(
                    &mut w.b.field.field.scene,
                    &w.grid,
                    &mut u,
                    a[1].i32(),
                    a[2].i32(),
                );
                *unit_mut(&mut w.b, id) = u;
            }
            c.eq(
                &format!("{cx} {id} onWall"),
                unit(&w.b, id).on_wall_walkway,
                a[3].i64() == 1,
            );
        }
        // MORALE_WALL_BREACH = 0: every live defender's morale bar is refreshed unchanged.
        let defs: Vec<PlacedUnit> = w.b.def.clone();
        for u in &defs {
            if w.is_dead(&u.spawn.id) {
                continue;
            }
            let m = w.morale.get(&u.spawn.id).copied().unwrap_or(u.spawn.morale);
            update_morale_bar(
                &mut w.b.field.field.scene,
                &u.bars,
                js_max0(m - MORALE_WALL_BREACH),
                u.spawn.morale_max,
            );
        }
        for ch in changed.arr() {
            compare_unit_state(c, cx, &w.b, &ch.arr()[7]);
        }
    }
    c.eq(&format!("{cx} routs"), e.get("routs").arr().len(), 0);
    let fs = &w.b.field.field;
    let wall = w.b.wall.as_ref().expect("wall");
    c.eq(
        &format!("{cx} wall"),
        model_record(fs, wall.group),
        json_u32s(e.get("wall")),
    );
    c.eq(
        &format!("{cx} summary"),
        scene_summary(fs),
        json_u32s(e.get("summary")),
    );
    c.eq(
        &format!("{cx} tiles"),
        grid_rle(&w.grid),
        json_u32s(e.get("tiles")),
    );
}

fn js_max0(v: f64) -> f64 {
    if v > 0.0 || v.is_nan() {
        v
    } else {
        0.0
    }
}

#[test]
fn dynamics_match_web() {
    let d = load("dynamics.json");
    assert_eq!(d.get("three").str(), "169");
    let rec = d.get("siege");
    let b = build(rec);
    let morale = rec
        .get("spawn")
        .arr()
        .iter()
        .map(|r| {
            let s = spawn_of(r);
            (s.id, s.morale)
        })
        .collect();
    let mut w = World {
        b,
        grid: rle_grid(d.get("tilesNow")),
        labels: Vec::new(),
        morale,
        dead: HashMap::new(),
        group_ids: HashMap::new(),
        markers: GroupMarkers::default(),
    };
    let mut c = Cmp::default();
    let events = d.get("events").arr();
    for (k, e) in events.iter().enumerate() {
        run_event(&mut c, &mut w, e, k);
    }
    println!(
        "dynamics: {} events, {} scalars + {} checks compared bit for bit",
        events.len(),
        c.scalars,
        c.checks
    );
    c.finish("dynamics");
}

#[test]
fn deploy_phase_matches_web() {
    let d = load("dynamics.json");
    let rec = d.get("deploy");
    let mut b = build(rec);
    let mut c = Cmp::default();
    // group markers of the deploy UI's automatic grouping (Z-36-9)
    let mut markers = GroupMarkers::default();
    let groups = rec.get("groups").arr();
    let mut n_markers = 0;
    for g in groups {
        let a = g.arr();
        let u = unit(&b, a[0].str()).clone();
        let gid = if a[1].is_null() {
            None
        } else {
            Some(a[1].str())
        };
        markers.update(&mut b.field.field, &u, gid, false);
        c.eq(
            &format!("marker {}", a[0].str()),
            markers.get(a[0].str()).is_some(),
            a[2].i64() == 1,
        );
        n_markers += usize::from(a[2].i64() == 1);
        c.eq(
            &format!("marker model {}", a[0].str()),
            model_record(&b.field.field, u.group),
            json_u32s(&a[3]),
        );
    }
    println!(
        "deploy: {} player units, {n_markers} group markers",
        groups.len()
    );
    // a stale preview child, cleared by the deploy frame
    let stale = b.field.field.scene.add_group(b.orders.preview);
    b.field.field.scene.node(stale).set_name("stalePreview");
    let alive = vec![true; b.atk.len() + b.def.len()];
    deploy_phase_frame(&mut b, &alive);
    let f = rec.get("frame");
    let fs = &b.field.field;
    c.eq(
        "frame summary",
        scene_summary(fs),
        json_u32s(f.get("summary")),
    );
    compare_tree(&mut c, "frame lines", fs, b.orders.lines, f.get("lines"));
    for (u, x) in b.atk.iter().chain(b.def.iter()).zip(f.get("bars").arr()) {
        let (sig, nodes) = dump_tree(fs, u.bars.group, false);
        c.eq(
            &format!("frame bars {}", u.spawn.id),
            vec![u32::try_from(nodes.len()).expect("n"), sig],
            json_u32s(x),
        );
    }
    end_deploy_phase(&mut b);
    let e = rec.get("end");
    let fs = &b.field.field;
    c.eq(
        "end summary",
        scene_summary(fs),
        json_u32s(e.get("summary")),
    );
    compare_tree(&mut c, "end lines", fs, b.orders.lines, e.get("lines"));
    compare_tree(
        &mut c,
        "end deploy group",
        fs,
        fs.deploy_group.expect("group"),
        e.get("deployGroup"),
    );
    compare_tree(
        &mut c,
        "end ghosts",
        fs,
        fs.deploy_ghost_group.expect("ghosts"),
        e.get("ghost"),
    );
    let z = e.get("zone").arr();
    c.eq(
        "zone meshes",
        fs.deploy_zone_meshes.len(),
        usize::try_from(z[0].i64()).expect("n"),
    );
    c.eq(
        "zone visible",
        fs.deploy_zone_meshes
            .iter()
            .filter(|&&m| fs.scene.nodes[m].visible)
            .count(),
        usize::try_from(z[1].i64()).expect("n"),
    );
    c.finish("deploy");
}

#[test]
fn projectiles_match_web() {
    let d = load("dynamics.json");
    let mut c = Cmp::default();
    for k in d.get("projectileKinds").arr() {
        let a = k.arr();
        let r = projectile_kind(a[0].str(), a[1].str());
        c.eq(
            &format!("kind {:?} {:?}", a[0].str(), a[1].str()),
            r.web_name(),
            a[2].str(),
        );
    }
    for m in d.get("projectileMeshes").arr() {
        let kind = match m.get("kind").str() {
            "arrow" => ProjectileKind::Arrow,
            "javelin" => ProjectileKind::Javelin,
            "pilum" => ProjectileKind::Pilum,
            _ => ProjectileKind::Sling,
        };
        let mut fs = FieldScene::new();
        let n = fs.scene.graft_detached(make_projectile_mesh(kind));
        compare_tree(&mut c, kind.web_name(), &fs, n, m.get("tree"));
    }
    println!("projectiles: {} scalars + {} checks", c.scalars, c.checks);
    c.finish("projectiles");
}

#[test]
fn constants_and_easing_equal_web() {
    let d = load("dynamics.json");
    let mut c = Cmp::default();
    let k = d.get("consts");
    for (name, v) in [
        ("MOVE_STEP_MS", MOVE_STEP_MS),
        ("STEP_GAP_MS", STEP_GAP_MS),
        ("RANGED_FLY_MS", RANGED_FLY_MS),
        ("RANGED_GAP_MS", RANGED_GAP_MS),
        ("DEATH_FADE_MS", DEATH_FADE_MS),
        ("BLOW_LUNGE_MS", BLOW_LUNGE_MS),
        ("BLOW_HIT_T", BLOW_HIT_T),
        ("BLOW_SETTLE_MS", BLOW_SETTLE_MS),
        ("MORALE_GATE_BREACH", MORALE_GATE_BREACH),
        ("MORALE_WALL_BREACH", MORALE_WALL_BREACH),
    ] {
        c.f(name, v, k.get(name).hx()[0]);
    }
    c.eq("keys", k.obj().len(), 10);
    for e in d.get("easing").arr() {
        let a = e.arr();
        let x = a[0].hx()[0];
        c.fs(
            &format!("easing {x}"),
            &[lerp(-3.5, 7.25, x), ease_out(x), ease_in(x)],
            &a[1].hx(),
        );
    }
    c.finish("constants");
}

/// `out.pomiary` (`gen_dynamics.ts` §14, Operator "pomiary" r1): `_breachGate`
/// mesh hiding on a freshly placed wall of EVERY style (the `breachGate`
/// event covers `rzym` only; the band `TILE_S·1.5 + TILE_S·0.6` decides
/// meshes of `egipt` and `celtowie`), and the facing `_startRout` gives each
/// side with the resulting `group.rotation.y`.
#[test]
fn gate_styles_and_rout_facing_match_web() {
    let d = load("dynamics.json");
    let p = d.get("pomiary");
    let mut b = build(d.get("siege"));
    let layout = b.field.siege.clone().expect("siege");
    let mut grid = rle_grid(d.get("tilesNow"));
    let mut c = Cmp::default();
    let vis = |fs: &FieldScene, g: NodeId| -> String {
        fs.scene.nodes[g]
            .children
            .iter()
            .map(|&k| if fs.scene.nodes[k].visible { '1' } else { '0' })
            .collect()
    };
    let styles = p.get("gateStyles").arr();
    c.eq("gate styles", styles.len(), 9);
    for g in styles {
        let civ = g.get("civ").str();
        let fs = &mut b.field.field;
        let pw = units::place_siege_wall(&mut fs.scene, civ, &layout).expect("wall");
        let kids = &fs.scene.nodes[pw.group].children;
        let meshes = kids
            .iter()
            .filter(|&&k| fs.scene.nodes[k].is_mesh())
            .count();
        c.eq(&format!("{civ} n"), kids.len() as i64, g.get("n").i64());
        c.eq(
            &format!("{civ} meshes"),
            meshes as i64,
            g.get("meshes").i64(),
        );
        c.eq(
            &format!("{civ} before"),
            vis(fs, pw.group).as_str(),
            g.get("before").str(),
        );
        breach_gate(&mut fs.scene, &mut grid, Some(&pw), -1, layout.gate_row);
        c.eq(
            &format!("{civ} after"),
            vis(fs, pw.group).as_str(),
            g.get("after").str(),
        );
        c.eq(
            &format!("{civ} gate"),
            fs.scene.nodes[pw.user_data.gate].visible,
            g.get("gate").bool(),
        );
    }
    let routs = p.get("routs").arr();
    c.eq("routs", routs.len(), 2);
    for r in routs {
        let a = r.arr();
        let id = a[0].str();
        let u = unit(&b, id).clone();
        let side = u.spawn.side;
        c.eq(&format!("{id} side"), side, side_of(a[1].str()));
        let facing = rout_facing(side);
        c.eq(&format!("{id} facing"), i64::from(facing), a[2].i64());
        let sc = &mut b.field.field.scene;
        set_facing(sc, &u, 2);
        set_facing(sc, &u, facing);
        c.f(
            &format!("{id} rotation.y"),
            sc.nodes[u.group].rotation.y,
            a[3].hx()[0],
        );
    }
    println!(
        "gate styles + rout facing: {} scalars + {} checks",
        c.scalars, c.checks
    );
    c.finish("pomiary");
}
