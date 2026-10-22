//! RR-T2a camera tests: the Rust `CameraController` state machine replayed
//! on event streams that were run through the **web** `CameraController`
//! (`render/camera.ts` from `edb8fb56`, imported unchanged, three@0.169.0),
//! see `tests/fixtures/camera/README.md` and
//! `dyspozycje/rust-port/p4/P4-11-CAMERA-TERRAIN-CPU.md`.
//!
//! Tolerance is zero: after every event the target, distance, camera
//! position and `matrixWorld` must be equal bit for bit.

#![allow(clippy::float_cmp)]

use std::path::PathBuf;

use civ_renderer::camera::{
    CameraController, CameraOptions, InputGate, NoGate, DRAG_THRESHOLD_PX, MAX_FRAME_DT,
};
use civ_renderer::pick::camera::far_clip_roblox;
use civ_renderer::pick::hex::ClientRect;
use civ_renderer::pick::three::Vec3;

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
        assert!(n.fract() == 0.0 && n.abs() < 1e9, "not an i32: {n}");
        #[allow(clippy::cast_possible_truncation)]
        let v = n as i32;
        v
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
        "camera",
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

fn rect(j: &Json) -> ClientRect {
    ClientRect {
        left: j.get("left").num(),
        top: j.get("top").num(),
        width: j.get("width").num(),
        height: j.get("height").num(),
    }
}

fn opt_rect(j: Option<&Json>) -> Option<ClientRect> {
    match j {
        None => None,
        Some(v) if v.is_null() => None,
        Some(v) => Some(rect(v)),
    }
}

/// `x >= left && y >= top && x < left + width && y < top + height` (gen.ts `inRect`).
fn in_rect(r: Option<ClientRect>, x: f64, y: f64) -> bool {
    r.is_some_and(|r| x >= r.left && y >= r.top && x < r.left + r.width && y < r.top + r.height)
}

/// The scripted UI predicates of gen.ts.
#[derive(Default)]
struct ScriptGate {
    block: Option<ClientRect>,
    wheel_block: Option<ClientRect>,
    separate_wheel: bool,
    edge: bool,
}

impl InputGate for ScriptGate {
    fn block_pointer_at(&self, x: f64, y: f64) -> bool {
        in_rect(self.block, x, y)
    }
    fn block_wheel_at(&self, x: f64, y: f64) -> bool {
        if self.separate_wheel {
            in_rect(self.wheel_block, x, y)
        } else {
            self.block_pointer_at(x, y)
        }
    }
    fn edge_pan_active(&self) -> bool {
        self.edge
    }
}

fn same(a: f64, b: f64) -> bool {
    a.to_bits() == b.to_bits() || (a == 0.0 && b == 0.0)
}

#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
fn u32_of(j: &Json) -> u32 {
    j.num() as u32
}

/// Compares one recorded web state with the Rust controller; returns
/// `(mismatching scalars, compared scalars)`.
fn compare(
    label: &str,
    st: &Json,
    c: &CameraController,
    w: u32,
    h: u32,
    log: &mut Vec<String>,
) -> (usize, usize) {
    let f = c.focus_state();
    let mut bad = 0;
    let mut chk = |what: &str, got: f64, want: f64| {
        if !same(got, want) {
            bad += 1;
            if log.len() < 20 {
                log.push(format!("{label} {what}: rust {got:e} web {want:e}"));
            }
        }
    };
    chk("tx", f.x, st.get("tx").num());
    chk("tz", f.z, st.get("tz").num());
    chk("d", f.dist, st.get("d").num());
    let p = c.position();
    let wp = st.get("p").f64s();
    chk("p.x", p.x, wp[0]);
    chk("p.y", p.y, wp[1]);
    chk("p.z", p.z, wp[2]);
    let mut n = 6;
    if let Some(wj) = st.opt("w") {
        let m = c
            .pick_camera(far_clip_roblox(w, h))
            .matrices(1280.0, 720.0)
            .world;
        let ww = wj.f64s();
        for (got, want) in m.e.iter().zip(&ww) {
            chk("w", *got, *want);
        }
        n += 16;
    }
    (bad, n)
}

struct Replay {
    scenarios: usize,
    steps: usize,
    scalars: usize,
    mismatches: usize,
    log: Vec<String>,
}

fn replay() -> Replay {
    let data = load("camera.json");
    assert_eq!(data.get("dragThresholdPx").num(), DRAG_THRESHOLD_PX);
    let mut out = Replay {
        scenarios: 0,
        steps: 0,
        scalars: 0,
        mismatches: 0,
        log: Vec::new(),
    };
    for sc in data.get("scenarios").arr() {
        out.scenarios += 1;
        let name = sc.get("name").str().to_string();
        let w = u32_of(sc.get("W"));
        let h = u32_of(sc.get("H"));
        let r0 = rect(sc.get("rect"));
        let scene_pos = sc.get("scenePos").f64s();
        let center = sc.get("center").f64s();
        let opts = match sc.get("opts").str() {
            "game" => CameraOptions::world_map(w, h),
            "default" => CameraOptions::default(),
            "custom" => {
                let c = sc.get("custom");
                CameraOptions {
                    min_dist: c.get("minDist").num(),
                    max_dist: c.get("maxDist").num(),
                    key_pan_speed: c.get("keyPanSpeed").num(),
                    mouse_pan_factor: c.get("mousePanFactor").num(),
                    zoom_factor: c.get("zoomFactor").num(),
                    edge_pan_zone_px: c.get("edgePanZonePx").num(),
                    edge_pan_speed: Some(c.get("edgePanSpeed").num()),
                }
            }
            other => panic!("opts {other}"),
        };
        let mut c = if sc.get("opts").str() == "game" {
            let c = CameraController::for_world_map(w, h, r0);
            assert_eq!(
                c.focus_state(),
                CameraController::new(
                    Vec3::new(scene_pos[0], scene_pos[1], scene_pos[2]),
                    (center[0], center[1]),
                    opts,
                    r0,
                )
                .focus_state()
            );
            c
        } else {
            CameraController::new(
                Vec3::new(scene_pos[0], scene_pos[1], scene_pos[2]),
                (center[0], center[1]),
                opts,
                r0,
            )
        };
        let lim = sc.get("limits");
        assert_eq!(
            c.dist_limits(),
            (lim.get("minDist").num(), lim.get("maxDist").num()),
            "{name} limits"
        );
        let mut gate = ScriptGate {
            separate_wheel: sc.get("separateWheel").bool(),
            ..ScriptGate::default()
        };
        let (b, n) = compare(
            &format!("{name} init"),
            sc.get("init"),
            &c,
            w,
            h,
            &mut out.log,
        );
        out.scalars += n;
        out.mismatches += b;
        for (i, step) in sc.get("steps").arr().iter().enumerate() {
            let s = step.get("s");
            let num = |k: &str| s.get(k).num();
            match s.get("k").str() {
                "down" => {
                    let b = s.opt("b").map_or(0, Json::i32);
                    c.mouse_down(b, num("x"), num("y"), &gate);
                }
                "move" => c.mouse_move(num("x"), num("y")),
                "up" => c.mouse_up(),
                "wheel" => {
                    c.wheel(num("x"), num("y"), num("dy"), &gate);
                }
                "kd" => c.key_down(s.get("key").str()),
                "ku" => c.key_up(s.get("key").str()),
                "blur" => c.blur(),
                "leave" => c.mouse_leave(),
                "frame" => c.update(1.0 / 60.0, &gate),
                "focus" => c.focus_at(num("x"), num("z"), s.opt("d").map(Json::num)),
                "edge" => gate.edge = s.get("on").bool(),
                "block" => gate.block = opt_rect(s.opt("r")),
                "wblock" => gate.wheel_block = opt_rect(s.opt("r")),
                "rect" => c.set_canvas_rect(rect(s.get("r"))),
                other => panic!("step {other}"),
            }
            out.steps += 1;
            let (b, n) = compare(
                &format!("{name} step {i}"),
                step.get("st"),
                &c,
                w,
                h,
                &mut out.log,
            );
            out.scalars += n;
            out.mismatches += b;
        }
    }
    out
}

#[test]
fn camera_controller_matches_web_100_percent() {
    let r = replay();
    println!(
        "camera parity: scenarios={} steps={} scalars={} mismatches={}",
        r.scenarios, r.steps, r.scalars, r.mismatches
    );
    for l in &r.log {
        println!("  {l}");
    }
    assert!(r.scenarios >= 30 && r.steps >= 6000, "fixture too small");
    assert_eq!(r.mismatches, 0, "camera state differs from the web");
}

#[test]
fn fixture_covers_every_branch() {
    // Guard against a regenerated fixture that silently drops a case.
    let data = load("camera.json");
    let mut kinds = std::collections::BTreeMap::<String, usize>::new();
    for sc in data.get("scenarios").arr() {
        for st in sc.get("steps").arr() {
            *kinds
                .entry(st.get("s").get("k").str().to_string())
                .or_default() += 1;
        }
    }
    for k in [
        "down", "move", "up", "wheel", "kd", "ku", "blur", "leave", "frame", "focus", "edge",
        "block", "wblock", "rect",
    ] {
        assert!(
            kinds.get(k).copied().unwrap_or(0) > 0,
            "no step of kind {k}"
        );
    }
}

// ---------------------------------------------------------------------------
// Rust-only behaviour (no web counterpart): time scaling of continuous pan (Q2).

fn moving_controller() -> CameraController {
    let r = ClientRect {
        left: 0.0,
        top: 0.0,
        width: 1280.0,
        height: 720.0,
    };
    let mut c = CameraController::for_world_map(40, 30, r);
    c.key_down("d");
    c
}

#[test]
fn frame_at_60_fps_is_exactly_one_web_frame() {
    assert_eq!(CameraController::frame_factor(1.0 / 60.0), 1.0);
    let mut a = moving_controller();
    let before = a.focus_state();
    a.update(1.0 / 60.0, &NoGate);
    let speed = 0.3 * (before.dist / 30.0);
    assert_eq!(a.focus_state().x.to_bits(), (before.x + speed).to_bits());
}

#[test]
fn pan_scales_with_dt_and_long_frames_are_capped() {
    let mut a = moving_controller();
    let x0 = a.focus_state().x;
    a.update(1.0 / 30.0, &NoGate);
    let mut b = moving_controller();
    b.update(1.0 / 60.0, &NoGate);
    b.update(1.0 / 60.0, &NoGate);
    let da = a.focus_state().x - x0;
    let db = b.focus_state().x - x0;
    assert!(
        (da - db).abs() < 1e-12,
        "30 fps frame = two 60 fps frames ({da} vs {db})"
    );

    let mut capped = moving_controller();
    capped.update(5.0, &NoGate);
    let mut ref_c = moving_controller();
    ref_c.update(MAX_FRAME_DT, &NoGate);
    assert_eq!(capped.focus_state(), ref_c.focus_state());
    assert_eq!(CameraController::frame_factor(MAX_FRAME_DT), 6.0);

    for dt in [0.0, -1.0, f64::NAN] {
        let mut z = moving_controller();
        let s0 = z.focus_state();
        z.update(dt, &NoGate);
        assert_eq!(z.focus_state(), s0, "dt={dt} must not move");
    }
}

#[test]
fn drag_and_wheel_do_not_depend_on_dt() {
    let mut c = moving_controller();
    c.key_up("d");
    let s0 = c.focus_state();
    c.mouse_down(0, 100.0, 100.0, &NoGate);
    c.mouse_move(103.0, 104.0); // 5 px: still a click
    assert_eq!(c.focus_state(), s0);
    assert!(!c.drag_armed());
    c.mouse_move(103.6, 104.8); // 3.6² + 4.8² rounds to 35.99999999999999 < 36: still a click
    assert!(!c.drag_armed());
    c.mouse_move(106.0, 100.0); // exactly 6 px: arms, no jump
    assert!(c.drag_armed());
    assert_eq!(c.focus_state(), s0);
    c.mouse_move(116.0, 100.0);
    let s1 = c.focus_state();
    assert!(s1.x < s0.x && s1.z == s0.z);
    assert!(
        c.wheel(1.0, 1.0, 0.0, &NoGate),
        "deltaY 0 zooms in (web quirk)"
    );
    assert!(c.focus_state().dist < s1.dist);
}
