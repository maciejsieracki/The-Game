//! Result report of the spike (JSON file) and the PASS/FAIL rules.
//!
//! Every check starts as `NIE_ZMIERZONO`. A check changes only when the run
//! produced evidence; the evidence strings go into the report verbatim.
//! Thresholds are ASSUMPTIONS (ZAŁOŻENIE) documented in
//! `dyspozycje/rust-port/p4/P4-15-GPU-SPIKE.md` §6; the raw numbers are always
//! in the report so the owner/orchestrator can re-judge them.

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use crate::memory::MemorySample;
use crate::stats::LatencyStats;

/// Report schema id (bump on incompatible change).
pub const SCHEMA: &str = "spike-gpu-embed/2";
/// Topic id.
pub const TEMAT: &str = "R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1";

/// ZAŁOŻENIE Z-S1: one-way IPC p95 must fit one 60 Hz frame.
pub const IPC_P95_LIMIT_MS: f64 = 16.7;
/// ZAŁOŻENIE Z-S2: RSS growth between the ~10 s and the >= 60 s sample.
pub const MEMORY_GROWTH_LIMIT_BYTES: i64 = 32 * 1024 * 1024;
/// Number of events per IPC series (dispatch: 1000 `PointerMove`).
pub const IPC_EVENTS: usize = 1000;

/// Status of one check.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Status {
    #[serde(rename = "PASS")]
    Pass,
    #[serde(rename = "FAIL")]
    Fail,
    #[serde(rename = "NIE_ZMIERZONO")]
    NieZmierzono,
}

/// Check ids, mapped 1:1 onto the dispatch points (1)-(7).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CheckId {
    /// (1) wgpu frame (colour + triangle) under a transparent webview with HTML on top.
    P1RenderPodWebview,
    /// (2) M1: hole -> native window, UI rect -> webview.
    P2M1RegionWejscia,
    /// (3) M2: inverted layers (native child window above the webview).
    P3M2OdwroconeWarstwy,
    /// (4a) IPC webview -> Rust, 1000 `PointerMove`.
    P4aIpcWebviewDoRust,
    /// (4b) IPC Rust -> webview, 1000 events.
    P4bIpcRustDoWebview,
    /// (5) process memory after 1 min of rendering.
    P5Pamiec60s,
    /// (6) keyboard focus after a click into the native window.
    P6FokusKlawiatury,
    /// (7) `Window::is_fullscreen` after `set_fullscreen`.
    P7Fullscreen,
}

impl CheckId {
    pub const ALL: [CheckId; 8] = [
        CheckId::P1RenderPodWebview,
        CheckId::P2M1RegionWejscia,
        CheckId::P3M2OdwroconeWarstwy,
        CheckId::P4aIpcWebviewDoRust,
        CheckId::P4bIpcRustDoWebview,
        CheckId::P5Pamiec60s,
        CheckId::P6FokusKlawiatury,
        CheckId::P7Fullscreen,
    ];

    pub fn title(self) -> &'static str {
        match self {
            CheckId::P1RenderPodWebview => {
                "(1) Klatka wgpu (kolor + trojkat) pod przezroczystym webview z HTML nad nia"
            }
            CheckId::P2M1RegionWejscia => {
                "(2) M1: klik w dziure -> okno natywne; klik w prostokat UI -> webview"
            }
            CheckId::P3M2OdwroconeWarstwy => {
                "(3) M2: odwrocone warstwy (natywne okno-dziecko nad webview)"
            }
            CheckId::P4aIpcWebviewDoRust => {
                "(4a) IPC webview -> Rust: 1000 x PointerMove (min/p50/p95/max)"
            }
            CheckId::P4bIpcRustDoWebview => {
                "(4b) IPC Rust -> webview: 1000 zdarzen (min/p50/p95/max)"
            }
            CheckId::P5Pamiec60s => {
                "(5) Pamiec procesu po 1 min renderowania (+ procesy webview osobno)"
            }
            CheckId::P6FokusKlawiatury => "(6) Fokus klawiatury po kliknieciu w okno natywne",
            CheckId::P7Fullscreen => "(7) Window::is_fullscreen po set_fullscreen",
        }
    }

    /// Open questions of P4-3 / P4-5B this check answers.
    pub fn maps_to(self) -> &'static str {
        match self {
            CheckId::P1RenderPodWebview => {
                "P4-3 §2.3 'Przezroczystosc'/'Windows'/'Linux'; §9 pkt 4 CZESCIOWO (kolejnosc warstw + przezroczystosc; DPI nie); RR-T1"
            }
            CheckId::P2M1RegionWejscia => "P4-5B §15 pkt 1 (M1); §2 M1; T14; P4-3 §9 pkt 4 CZESCIOWO (warstwy)",
            CheckId::P3M2OdwroconeWarstwy => "P4-5B §15 pkt 1 (M2); P4-3 §2.3 'Ryzyko krytyczne'",
            CheckId::P4aIpcWebviewDoRust => "P4-5B §15 pkt 3 CZESCIOWO (PointerMove; HitRegions nie); P4-3 §9 pkt 16 CZESCIOWO (IPC bez wejscie->klatka); D-RR-10",
            CheckId::P4bIpcRustDoWebview => "P4-5B §15 pkt 3 CZESCIOWO (ladunek zastepczy HoverChanged/CameraState)",
            CheckId::P5Pamiec60s => "P4-3 §7 CZESCIOWO: RSS procesu spike'a (status) + procesy webview potomne (informacyjnie; macOS NIE_ZMIERZONO); P4-3 §9 pkt 13 CZESCIOWO (licznik alokatora wgpu, nie caly VRAM)",
            CheckId::P6FokusKlawiatury => "P4-5B §15 pkt 2; Z3; P4-3 §9 pkt 4 CZESCIOWO (fokus)",
            CheckId::P7Fullscreen => "P4-5B §15 pkt 8 CZESCIOWO (set_fullscreen; Escape nie); §10; T13",
        }
    }
}

/// One check of the report.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Check {
    pub id: CheckId,
    pub title: String,
    pub maps_to: String,
    pub status: Status,
    /// Human-readable evidence lines (raw values, which hook, which answer).
    pub evidence: Vec<String>,
    /// Raw data (statistics, samples, observations).
    pub data: Value,
}

/// The full report.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Report {
    pub schema: String,
    pub temat: String,
    pub platform: Map<String, Value>,
    pub environment: Map<String, Value>,
    pub checks: Vec<Check>,
    pub log: Vec<String>,
}

impl Default for Report {
    fn default() -> Self {
        Self::new()
    }
}

impl Report {
    /// All checks `NIE_ZMIERZONO`, platform filled from `std::env::consts`.
    pub fn new() -> Self {
        let mut platform = Map::new();
        platform.insert("os".into(), Value::from(std::env::consts::OS));
        platform.insert("arch".into(), Value::from(std::env::consts::ARCH));
        platform.insert("family".into(), Value::from(std::env::consts::FAMILY));
        Report {
            schema: SCHEMA.into(),
            temat: TEMAT.into(),
            platform,
            environment: Map::new(),
            checks: CheckId::ALL
                .iter()
                .map(|&id| Check {
                    id,
                    title: id.title().into(),
                    maps_to: id.maps_to().into(),
                    status: Status::NieZmierzono,
                    evidence: vec!["nie wykonano w tym przebiegu".into()],
                    data: Value::Null,
                })
                .collect(),
            log: Vec::new(),
        }
    }

    pub fn get(&self, id: CheckId) -> &Check {
        self.checks
            .iter()
            .find(|c| c.id == id)
            .expect("all ids present")
    }

    /// Replace status, evidence and data of one check.
    pub fn set(&mut self, id: CheckId, status: Status, evidence: Vec<String>, data: Value) {
        let c = self
            .checks
            .iter_mut()
            .find(|c| c.id == id)
            .expect("all ids present");
        c.status = status;
        c.evidence = evidence;
        c.data = data;
    }

    pub fn env(&mut self, key: &str, value: impl Into<Value>) {
        self.environment.insert(key.into(), value.into());
    }

    /// One line per check: `P1RenderPodWebview: PASS`.
    pub fn summary_lines(&self) -> Vec<String> {
        self.checks
            .iter()
            .map(|c| {
                let s = serde_json::to_value(c.status)
                    .ok()
                    .and_then(|v| v.as_str().map(String::from));
                format!("{:?}: {}", c.id, s.unwrap_or_default())
            })
            .collect()
    }

    pub fn to_json_pretty(&self) -> String {
        serde_json::to_string_pretty(self).expect("report is always serialisable")
    }
}

// ---------------------------------------------------------------------------
// Evaluation rules (pure; unit-tested).
// ---------------------------------------------------------------------------

/// Owner's answer to "do you see the colour + triangle under the panel?".
pub fn eval_render(frames_presented: u64, owner_answer: Option<&str>) -> (Status, String) {
    match owner_answer {
        None => (
            Status::NieZmierzono,
            format!("brak odpowiedzi wlasciciela; klatek przekazanych do prezentacji: {frames_presented}"),
        ),
        Some("TAK") if frames_presented > 0 => (
            Status::Pass,
            format!("wlasciciel: TAK (widac kolor + trojkat pod panelem HTML); klatek: {frames_presented}"),
        ),
        Some("TAK") => (
            Status::Fail,
            "wlasciciel: TAK, ale 0 klatek wgpu przekazanych do prezentacji - sprzeczne, uznane za FAIL".into(),
        ),
        Some(other) => (
            Status::Fail,
            format!("wlasciciel: {other}; klatek: {frames_presented}"),
        ),
    }
}

/// What one guided click reached.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct ClickObservation {
    /// A platform hook saw a button press in the native window.
    pub native: bool,
    /// The page saw `pointerdown` / `click`.
    pub webview: bool,
}

/// M1/M2 rule: hole -> native only, UI rect -> webview only.
pub fn eval_input_split(
    hole: Option<ClickObservation>,
    ui: Option<ClickObservation>,
) -> (Status, String) {
    match (hole, ui) {
        (Some(h), Some(u)) => {
            let ok_h = h.native && !h.webview;
            let ok_u = u.webview && !u.native;
            let st = if ok_h && ok_u {
                Status::Pass
            } else {
                Status::Fail
            };
            (
                st,
                format!(
                    "dziura: natywne={} webview={} ({}); UI: webview={} natywne={} ({})",
                    h.native,
                    h.webview,
                    if ok_h { "OK" } else { "ZLE" },
                    u.webview,
                    u.native,
                    if ok_u { "OK" } else { "ZLE" }
                ),
            )
        }
        _ => (
            Status::NieZmierzono,
            format!("niepelna obserwacja: dziura={hole:?} UI={ui:?}"),
        ),
    }
}

/// IPC rule: all events delivered and p95 within [`IPC_P95_LIMIT_MS`].
pub fn eval_ipc(stats: Option<&LatencyStats>, expected: usize) -> (Status, String) {
    match stats {
        None => (Status::NieZmierzono, "brak probek".into()),
        Some(s) if s.count < expected => (
            Status::Fail,
            format!("dostarczono {}/{} zdarzen (utrata), p95={:.3} ms", s.count, expected, s.p95_ms),
        ),
        Some(s) if s.p95_ms <= IPC_P95_LIMIT_MS => (
            Status::Pass,
            format!(
                "n={} min={:.3} p50={:.3} p95={:.3} max={:.3} ms (prog p95 <= {IPC_P95_LIMIT_MS} ms, ZALOZENIE Z-S1)",
                s.count, s.min_ms, s.p50_ms, s.p95_ms, s.max_ms
            ),
        ),
        Some(s) => (
            Status::Fail,
            format!(
                "n={} min={:.3} p50={:.3} p95={:.3} max={:.3} ms > prog {IPC_P95_LIMIT_MS} ms (ZALOZENIE Z-S1)",
                s.count, s.min_ms, s.p50_ms, s.p95_ms, s.max_ms
            ),
        ),
    }
}

/// Memory rule: needs a sample at t >= 60 s; growth of the SPIKE PROCESS RSS
/// vs the first sample at t >= 10 s must stay within
/// [`MEMORY_GROWTH_LIMIT_BYTES`]. The webview (descendant) processes are
/// reported on their own evidence line; they do NOT change the status
/// (ZAŁOŻENIE Z-S14) and are marked NIE_ZMIERZONO when not read.
pub fn eval_memory(samples: &[MemorySample]) -> (Status, Vec<String>) {
    let base = samples.iter().find(|s| s.t_s >= 10.0);
    let end = samples.iter().rev().find(|s| s.t_s >= 60.0);
    let mib = |v: f64| v / (1024.0 * 1024.0);
    match (base, end) {
        (Some(b), Some(e)) => {
            let growth = e.rss_bytes as i64 - b.rss_bytes as i64;
            let msg = format!(
                "proces spike'a: RSS t={:.1}s: {:.1} MiB; t={:.1}s: {:.1} MiB; przyrost {:.1} MiB (prog {} MiB, ZALOZENIE Z-S2); zrodlo: {}; VRAM poza procesem NIE_ZMIERZONO",
                b.t_s,
                mib(b.rss_bytes as f64),
                e.t_s,
                mib(e.rss_bytes as f64),
                mib(growth as f64),
                MEMORY_GROWTH_LIMIT_BYTES / (1024 * 1024),
                e.source
            );
            let web = match (b.webview.rss_bytes, e.webview.rss_bytes) {
                (Some(wb), Some(we)) if b.webview.measured && e.webview.measured => format!(
                    "procesy webview (potomne): RSS t={:.1}s: {:.1} MiB ({} proc.); t={:.1}s: {:.1} MiB ({} proc.); przyrost {:.1} MiB - informacyjnie, nie zmienia statusu (ZALOZENIE Z-S14); {}; zrodlo: {}",
                    b.t_s,
                    mib(wb as f64),
                    b.webview.processes.len(),
                    e.t_s,
                    mib(we as f64),
                    e.webview.processes.len(),
                    mib(we as f64 - wb as f64),
                    e.webview.note,
                    e.webview.source
                ),
                _ => format!(
                    "procesy webview: NIE_ZMIERZONO ({})",
                    if e.webview.note.is_empty() { &b.webview.note } else { &e.webview.note }
                ),
            };
            let status = if growth <= MEMORY_GROWTH_LIMIT_BYTES {
                Status::Pass
            } else {
                Status::Fail
            };
            let g = &e.gpu_alloc;
            let gpu = match (g.available, g.allocated_bytes, g.reserved_bytes) {
                (true, Some(al), Some(re)) => format!(
                    "licznik pamieci GPU wgpu (generate_allocator_report) t={:.1}s: przydzielone {:.1} MiB, zarezerwowane {:.1} MiB, blokow {} - informacyjnie; {}",
                    e.t_s,
                    mib(al as f64),
                    mib(re as f64),
                    g.blocks.unwrap_or(0),
                    g.note
                ),
                _ => format!("licznik pamieci GPU wgpu: NIE_ZMIERZONO ({})", g.note),
            };
            (status, vec![msg, web, gpu])
        }
        _ => (
            Status::NieZmierzono,
            vec![format!(
                "brak probek t>=10 s i t>=60 s (probek: {}); procesy webview: NIE_ZMIERZONO",
                samples.len()
            )],
        ),
    }
}

/// Keyboard focus observation after a click into the native window.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct FocusObservation {
    /// Key pressed right after the native click reached the page.
    pub webview_direct: Option<bool>,
    /// Key pressed after `Webview::set_focus()` reached the page.
    pub webview_after_set_focus: Option<bool>,
    /// A platform hook saw the key in the native window.
    pub native_saw_key: bool,
}

/// Focus rule: PASS when keys reach the webview after a native click, directly
/// or after `Webview::set_focus` (P4-5B Z3 expects the latter as the remedy).
pub fn eval_focus(o: FocusObservation) -> (Status, String) {
    let msg = format!(
        "klawisz po kliku w okno natywne -> webview: {:?}; po Webview::set_focus -> webview: {:?}; hak natywny widzial klawisz: {}",
        o.webview_direct, o.webview_after_set_focus, o.native_saw_key
    );
    match (o.webview_direct, o.webview_after_set_focus) {
        (Some(true), _) | (_, Some(true)) => (Status::Pass, msg),
        (Some(false), Some(false)) => (Status::Fail, msg),
        _ => (Status::NieZmierzono, msg),
    }
}

/// Fullscreen rule: `is_fullscreen()` is `true` after `set_fullscreen(true)`
/// and `false` after `set_fullscreen(false)`.
pub fn eval_fullscreen(after_on: Option<bool>, after_off: Option<bool>) -> (Status, String) {
    let msg = format!("is_fullscreen po set(true): {after_on:?}; po set(false): {after_off:?}");
    match (after_on, after_off) {
        (Some(true), Some(false)) => (Status::Pass, msg),
        (Some(_), Some(_)) => (Status::Fail, msg),
        _ => (Status::NieZmierzono, msg),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::latency_stats;

    #[test]
    fn new_report_is_all_nie_zmierzono() {
        let r = Report::new();
        assert_eq!(r.checks.len(), 8);
        assert!(r.checks.iter().all(|c| c.status == Status::NieZmierzono));
        let json = r.to_json_pretty();
        assert!(json.contains("\"NIE_ZMIERZONO\""));
        assert!(json.contains(SCHEMA));
        assert!(json.contains(TEMAT));
        let back: Report = serde_json::from_str(&json).unwrap();
        assert_eq!(back, r);
    }

    #[test]
    fn set_and_summary() {
        let mut r = Report::new();
        r.set(
            CheckId::P7Fullscreen,
            Status::Pass,
            vec!["x".into()],
            Value::Null,
        );
        assert_eq!(r.get(CheckId::P7Fullscreen).status, Status::Pass);
        let s = r.summary_lines();
        assert!(s.contains(&"P7Fullscreen: PASS".to_string()));
        assert!(s.contains(&"P1RenderPodWebview: NIE_ZMIERZONO".to_string()));
    }

    #[test]
    fn render_rule() {
        assert_eq!(eval_render(100, None).0, Status::NieZmierzono);
        assert_eq!(eval_render(100, Some("TAK")).0, Status::Pass);
        assert_eq!(eval_render(0, Some("TAK")).0, Status::Fail);
        assert_eq!(eval_render(100, Some("NIE")).0, Status::Fail);
        assert_eq!(eval_render(100, Some("MIGA")).0, Status::Fail);
    }

    #[test]
    fn input_split_rule() {
        let good_h = ClickObservation {
            native: true,
            webview: false,
        };
        let good_u = ClickObservation {
            native: false,
            webview: true,
        };
        assert_eq!(eval_input_split(Some(good_h), Some(good_u)).0, Status::Pass);
        // hole click swallowed by the webview (typical without M1)
        let bad_h = ClickObservation {
            native: false,
            webview: true,
        };
        assert_eq!(eval_input_split(Some(bad_h), Some(good_u)).0, Status::Fail);
        // both received -> not a clean split
        let both = ClickObservation {
            native: true,
            webview: true,
        };
        assert_eq!(eval_input_split(Some(good_h), Some(both)).0, Status::Fail);
        assert_eq!(eval_input_split(None, Some(good_u)).0, Status::NieZmierzono);
    }

    #[test]
    fn ipc_rule() {
        let fast: Vec<f64> = (0..1000).map(|i| (i % 10) as f64 * 0.1).collect();
        let s = latency_stats(&fast).unwrap();
        assert_eq!(eval_ipc(Some(&s), 1000).0, Status::Pass);
        assert_eq!(eval_ipc(Some(&s), 1001).0, Status::Fail); // lost one
        let slow: Vec<f64> = (0..1000)
            .map(|i| if i < 900 { 1.0 } else { 40.0 })
            .collect();
        let s2 = latency_stats(&slow).unwrap();
        assert_eq!(eval_ipc(Some(&s2), 1000).0, Status::Fail); // p95 = 40
        assert_eq!(eval_ipc(None, 1000).0, Status::NieZmierzono);
    }

    fn ms(t: f64, mib: u64) -> MemorySample {
        MemorySample {
            t_s: t,
            rss_bytes: mib * 1024 * 1024,
            private_bytes: None,
            source: "t".into(),
            webview: Default::default(),
            gpu_alloc: Default::default(),
        }
    }

    #[test]
    fn memory_rule() {
        assert_eq!(
            eval_memory(&[ms(0.0, 100), ms(10.0, 150), ms(60.5, 160)]).0,
            Status::Pass
        );
        assert_eq!(eval_memory(&[ms(10.0, 150), ms(61.0, 190)]).0, Status::Fail);
        assert_eq!(
            eval_memory(&[ms(10.0, 150), ms(30.0, 151)]).0,
            Status::NieZmierzono
        );
        assert_eq!(eval_memory(&[]).0, Status::NieZmierzono);
        // shrinking memory is fine
        assert_eq!(eval_memory(&[ms(10.0, 150), ms(60.0, 120)]).0, Status::Pass);
    }

    #[test]
    fn memory_webview_line() {
        // not measured -> explicit NIE_ZMIERZONO line with the reason
        let (st, ev) = eval_memory(&[ms(10.0, 150), ms(60.0, 150)]);
        assert_eq!(st, Status::Pass);
        assert_eq!(ev.len(), 3);
        assert!(
            ev[1].starts_with("procesy webview: NIE_ZMIERZONO"),
            "{ev:?}"
        );
        assert!(
            ev[2].starts_with("licznik pamieci GPU wgpu: NIE_ZMIERZONO"),
            "{ev:?}"
        );
        // measured on both samples -> numbers; big webview growth does not
        // change the status (Z-S14)
        let web = |mib: u64| {
            crate::memory::summarize_children(
                vec![crate::memory::ChildProcess {
                    pid: 2,
                    ppid: 1,
                    name: "msedgewebview2.exe".into(),
                    rss_bytes: Some(mib * 1024 * 1024),
                    private_bytes: None,
                    error: None,
                }],
                "test",
            )
        };
        let mut a = ms(10.0, 150);
        a.webview = web(200);
        let mut b = ms(60.0, 150);
        b.webview = web(400);
        b.gpu_alloc = crate::memory::GpuAllocSample {
            available: true,
            allocated_bytes: Some(3 * 1024 * 1024),
            reserved_bytes: Some(64 * 1024 * 1024),
            blocks: Some(2),
            note: "n".into(),
        };
        let (st, ev) = eval_memory(&[a, b]);
        assert!(
            ev[2].contains("3.0 MiB") && ev[2].contains("64.0 MiB"),
            "{ev:?}"
        );
        assert_eq!(st, Status::Pass);
        assert!(
            ev[1].contains("200.0 MiB") && ev[1].contains("400.0 MiB"),
            "{ev:?}"
        );
        assert!(ev[1].contains("Z-S14"));
    }

    #[test]
    fn focus_rule() {
        let mut o = FocusObservation::default();
        assert_eq!(eval_focus(o).0, Status::NieZmierzono);
        o.webview_direct = Some(false);
        o.webview_after_set_focus = Some(true);
        assert_eq!(eval_focus(o).0, Status::Pass);
        o.webview_after_set_focus = Some(false);
        assert_eq!(eval_focus(o).0, Status::Fail);
        o.webview_direct = Some(true);
        assert_eq!(eval_focus(o).0, Status::Pass);
    }

    #[test]
    fn fullscreen_rule() {
        assert_eq!(eval_fullscreen(Some(true), Some(false)).0, Status::Pass);
        assert_eq!(eval_fullscreen(Some(false), Some(false)).0, Status::Fail);
        assert_eq!(eval_fullscreen(Some(true), None).0, Status::NieZmierzono);
    }
}
