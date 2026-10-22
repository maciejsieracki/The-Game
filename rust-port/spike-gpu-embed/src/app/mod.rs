//! Tauri application of the spike (feature `app`).
//!
//! Layers (D-RR-2 = A): one Tauri window `main`, transparent; wgpu renders into
//! the window's own surface (bottom); the transparent webview with the HTML
//! wizard panel lies on top. The wizard (`ui/spike.js`) drives the owner
//! through the checks and calls the commands below; Rust evaluates and writes
//! the report (`wyniki/raport-*.json`) and the log (`wyniki/log-*.txt`).
//!
//! Platform code (input region M1, child window M2, native input hooks) lives
//! in `platform_*.rs`; what is not implemented for a platform returns an
//! explicit error that ends up as `NIE_ZMIERZONO` with the reason.

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc::{self, Receiver, Sender};
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};

use crate::clock::{self, ClockOffset, SyncSample};
use crate::gpu::{self, wgpu, FrameOutcome, Gpu, WindowTarget};
use crate::log;
use crate::memory::{current_process_memory, webview_memory, GpuAllocSample, MemorySample};
use crate::protocol::{
    DomObservation, NativeEvent, NativeEventKind, R2wPing, R2wResult, TimedInput, UiRects,
    WizardAnswer,
};
use crate::regions::{css_to_physical, PhysRect};
use crate::report::{
    eval_focus, eval_fullscreen, eval_input_split, eval_ipc, eval_memory, eval_render, CheckId,
    ClickObservation, FocusObservation, Report, Status, IPC_EVENTS,
};
use crate::stats::latency_stats;

#[cfg(target_os = "macos")]
#[path = "platform_macos.rs"]
mod platform;
#[cfg(any(
    target_os = "linux",
    target_os = "dragonfly",
    target_os = "freebsd",
    target_os = "netbsd",
    target_os = "openbsd"
))]
#[path = "platform_linux.rs"]
mod platform;
#[cfg(windows)]
#[path = "platform_windows.rs"]
mod platform;

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------

/// Render thread commands.
enum RenderCmd {
    Resize(u32, u32),
    /// Switch rendering to another surface (M2 child window), physical size.
    SwitchSurface(wgpu::Surface<'static>, u32, u32, String),
}

#[derive(Default)]
struct Ipc {
    /// (mode, seq, t_js, t_rust_recv)
    w2r: Vec<(String, u32, f64, f64)>,
    w2r_stats: serde_json::Map<String, Value>,
    r2w_stats: Option<Value>,
    w2r_status: Option<(Status, String)>,
    r2w_status: Option<(Status, String)>,
}

#[derive(Default)]
struct Guided {
    /// label -> observation ("m1_hole", "m1_ui", "m2_hole", "m2_ui")
    clicks: Vec<(String, ClickObservation, Vec<NativeEvent>)>,
    /// label -> (marker index into NATIVE, start time)
    open_windows: Vec<(String, usize)>,
    focus: FocusObservation,
    focus_notes: Vec<String>,
    answers: Vec<WizardAnswer>,
    m1_apply: Option<Result<String, String>>,
    m2_apply: Option<Result<String, String>>,
    fullscreen: Option<(Option<bool>, Option<bool>, Vec<String>)>,
}

struct Shared {
    report: Mutex<Report>,
    native: Mutex<Vec<NativeEvent>>,
    dom: Mutex<Vec<DomObservation>>,
    ui_rects: Mutex<Option<UiRects>>,
    clock: Mutex<Option<ClockOffset>>,
    ipc: Mutex<Ipc>,
    guided: Mutex<Guided>,
    frames: AtomicU64,
    skipped: AtomicU64,
    skip_reasons: Mutex<Vec<String>>,
    first_frame_ms: Mutex<Option<f64>>,
    render_tx: Mutex<Option<Sender<RenderCmd>>>,
    instance: Mutex<Option<wgpu::Instance>>,
    /// Clone of the render device, for the wgpu memory counter (5).
    device: Mutex<Option<wgpu::Device>>,
    memory: Mutex<Vec<MemorySample>>,
    resized_events: AtomicU64,
    finished: AtomicBool,
    out_dir: PathBuf,
    stamp: String,
}

static SHARED: OnceLock<Shared> = OnceLock::new();

fn st() -> &'static Shared {
    SHARED.get().expect("shared state initialised in run()")
}

/// Called by platform hooks (any thread).
#[cfg_attr(target_os = "macos", allow(dead_code))]
pub(crate) fn push_native(source: &str, kind: NativeEventKind) {
    let ev = NativeEvent {
        t_rust: log::now_ms(),
        source: source.into(),
        kind,
    };
    log::line(format!("NATIVE {ev:?}"));
    if let Some(s) = SHARED.get() {
        s.native.lock().unwrap().push(ev);
    }
}

fn out_dir() -> PathBuf {
    if let Ok(d) = std::env::var("SPIKE_OUT_DIR") {
        return PathBuf::from(d);
    }
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("wyniki")
}

fn main_window(app: &AppHandle) -> Result<WebviewWindow, String> {
    app.get_webview_window("main")
        .ok_or_else(|| "brak okna 'main'".to_string())
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

fn start_rendering(app: &AppHandle) -> Result<(), String> {
    let ww = main_window(app)?;
    let size = ww.inner_size().map_err(|e| format!("inner_size: {e}"))?;
    let scale = ww
        .scale_factor()
        .map_err(|e| format!("scale_factor: {e}"))?;
    {
        let mut r = st().report.lock().unwrap();
        r.env("window_inner_size_phys", json!([size.width, size.height]));
        r.env("window_scale_factor", scale);
    }
    // Display handle: needed by some backends (GLES/Wayland); WebviewWindow
    // implements HasDisplayHandle + Debug + Send + Sync.
    let instance = wgpu::Instance::new(wgpu::InstanceDescriptor::new_with_display_handle_from_env(
        Box::new(ww.clone()),
    ));
    // Surface created on the main thread (setup) - required on macOS.
    let surface = instance
        .create_surface(ww.clone())
        .map_err(|e| format!("create_surface(okno Tauri): {e}"))?;
    let gpu = Gpu::new(instance.clone(), Some(&surface))?;
    log::line(format!("GPU adapter: {}", gpu.adapter_info_json()));
    match gpu::offscreen_selftest(&gpu) {
        Ok(t) => {
            log::line(format!("GPU offscreen self-test: {t:?}"));
            st().report
                .lock()
                .unwrap()
                .env("gpu_offscreen_selftest", serde_json::to_value(&t).unwrap());
        }
        Err(e) => {
            log::line(format!("GPU offscreen self-test ERROR: {e}"));
            st().report
                .lock()
                .unwrap()
                .env("gpu_offscreen_selftest_error", e);
        }
    }
    let target = WindowTarget::new(&gpu, surface, size.width, size.height)?;
    log::line(format!("surface okna glownego: {}", target.describe()));
    {
        let mut r = st().report.lock().unwrap();
        r.env("gpu_adapter", gpu.adapter_info_json());
        r.env("surface_main", target.describe());
    }
    *st().instance.lock().unwrap() = Some(instance);
    *st().device.lock().unwrap() = Some(gpu.device.clone());
    let (tx, rx) = mpsc::channel();
    *st().render_tx.lock().unwrap() = Some(tx);
    std::thread::Builder::new()
        .name("spike-render".into())
        .spawn(move || render_loop(gpu, target, rx))
        .map_err(|e| format!("watek renderowania: {e}"))?;
    Ok(())
}

fn render_loop(gpu: Gpu, mut target: WindowTarget, rx: Receiver<RenderCmd>) {
    loop {
        while let Ok(cmd) = rx.try_recv() {
            match cmd {
                RenderCmd::Resize(w, h) => target.resize(&gpu, w, h),
                RenderCmd::SwitchSurface(surface, w, h, label) => {
                    match WindowTarget::new(&gpu, surface, w, h) {
                        Ok(t) => {
                            log::line(format!("render: przelaczono na {label}: {}", t.describe()));
                            target = t;
                        }
                        Err(e) => {
                            log::line(format!("render: przelaczenie na {label} NIEUDANE: {e}"))
                        }
                    }
                }
            }
        }
        match target.render(&gpu) {
            FrameOutcome::Presented => {
                let n = st().frames.fetch_add(1, Ordering::Relaxed) + 1;
                if n == 1 {
                    let t = log::now_ms();
                    *st().first_frame_ms.lock().unwrap() = Some(t);
                    log::line("render: pierwsza klatka przekazana do prezentacji");
                    std::thread::spawn(memory_sampler);
                }
            }
            FrameOutcome::Skipped(why) => {
                let n = st().skipped.fetch_add(1, Ordering::Relaxed);
                if n < 20 {
                    log::line(format!("render: klatka pominieta: {why}"));
                    st().skip_reasons.lock().unwrap().push(why.into());
                }
                std::thread::sleep(Duration::from_millis(16));
            }
        }
    }
}

/// Run `f` on the main (event loop) thread and wait for its result.
/// MUST NOT be called from the main thread itself (would dead-lock) - only
/// from async commands, which run on the async runtime threads.
#[cfg_attr(not(windows), allow(dead_code))]
pub(crate) fn on_main<T: Send + 'static>(
    ww: &WebviewWindow,
    f: impl FnOnce() -> T + Send + 'static,
) -> Result<T, String> {
    let (tx, rx) = mpsc::channel();
    ww.run_on_main_thread(move || {
        let _ = tx.send(f());
    })
    .map_err(|e| format!("run_on_main_thread: {e}"))?;
    rx.recv_timeout(Duration::from_secs(5))
        .map_err(|e| format!("run_on_main_thread: brak wyniku w 5 s ({e})"))
}

/// Run `f` with the platform webview (`with_webview`) and wait for the result.
/// Same rule as [`on_main`]: never from the main thread.
#[cfg_attr(target_os = "macos", allow(dead_code))]
pub(crate) fn with_platform_webview<T: Send + 'static>(
    ww: &WebviewWindow,
    f: impl FnOnce(tauri::webview::PlatformWebview) -> T + Send + 'static,
) -> Result<T, String> {
    let (tx, rx) = mpsc::channel();
    ww.with_webview(move |pw| {
        let _ = tx.send(f(pw));
    })
    .map_err(|e| format!("with_webview: {e}"))?;
    rx.recv_timeout(Duration::from_secs(5))
        .map_err(|e| format!("with_webview: brak wyniku w 5 s ({e})"))
}

/// wgpu's own GPU memory counter (P4-3 §9 pkt 13), backend permitting.
fn gpu_alloc_sample() -> GpuAllocSample {
    let report = st()
        .device
        .lock()
        .unwrap()
        .as_ref()
        .map(|d| d.generate_allocator_report());
    match report {
        Some(Some(r)) => GpuAllocSample {
            available: true,
            allocated_bytes: Some(r.total_allocated_bytes),
            reserved_bytes: Some(r.total_reserved_bytes),
            blocks: Some(r.blocks.len() as u64),
            note: "wgpu Device::generate_allocator_report: pamiec przydzielona przez alokator wgpu; NIE caly VRAM (lancuch wymiany i pamiec sterownika poza raportem)".into(),
        },
        Some(None) => GpuAllocSample {
            note: "backend wgpu nie udostepnia raportu alokatora (generate_allocator_report = None)".into(),
            ..GpuAllocSample::default()
        },
        None => GpuAllocSample {
            note: "brak urzadzenia wgpu w chwili probki".into(),
            ..GpuAllocSample::default()
        },
    }
}

/// Memory samples at 0, 10, 30, 60 and 65 s after the first frame.
fn memory_sampler() {
    let t0 = std::time::Instant::now();
    for target_s in [0.0, 10.0, 30.0, 60.0, 65.0] {
        let wait = target_s - t0.elapsed().as_secs_f64();
        if wait > 0.0 {
            std::thread::sleep(Duration::from_secs_f64(wait));
        }
        let t_s = t0.elapsed().as_secs_f64();
        match current_process_memory() {
            Ok((rss, private, source)) => {
                let webview = webview_memory();
                let gpu_alloc = gpu_alloc_sample();
                log::line(format!(
                    "PAMIEC t={t_s:.1}s rss={rss} private={private:?} ({source}); webview measured={} rss={:?} procesow={} ({}; {})",
                    webview.measured,
                    webview.rss_bytes,
                    webview.processes.len(),
                    webview.source,
                    webview.note
                ));
                log::line(format!("PAMIEC t={t_s:.1}s gpu_alloc={gpu_alloc:?}"));
                st().memory.lock().unwrap().push(MemorySample {
                    t_s,
                    rss_bytes: rss,
                    private_bytes: private,
                    source,
                    webview,
                    gpu_alloc,
                });
            }
            Err(e) => log::line(format!("PAMIEC t={t_s:.1}s BLAD: {e}")),
        }
    }
}

// ---------------------------------------------------------------------------
// Commands (all async: they run off the main thread, so a command that waits
// - fullscreen test, with_webview round trip - never blocks the event loop).
// ---------------------------------------------------------------------------

#[tauri::command(rename_all = "snake_case")]
async fn spike_clock_now() -> Result<f64, String> {
    Ok(log::now_ms())
}

#[tauri::command(rename_all = "snake_case")]
async fn spike_clock_samples(samples: Vec<SyncSample>) -> Result<ClockOffset, String> {
    let o = clock::estimate_offset(&samples).ok_or("brak poprawnych probek zegara")?;
    log::line(format!("ZEGAR: {o:?}"));
    *st().clock.lock().unwrap() = Some(o);
    Ok(o)
}

#[tauri::command(rename_all = "snake_case")]
async fn spike_pointer_move(mode: String, input: TimedInput) -> Result<(), String> {
    let t = log::now_ms();
    st().ipc
        .lock()
        .unwrap()
        .w2r
        .push((mode, input.seq, input.t_js, t));
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
async fn spike_w2r_done(mode: String) -> Result<Value, String> {
    let off = st()
        .clock
        .lock()
        .unwrap()
        .ok_or("brak synchronizacji zegara")?;
    let mut ipc = st().ipc.lock().unwrap();
    let lat: Vec<f64> = ipc
        .w2r
        .iter()
        .filter(|(m, ..)| *m == mode)
        .map(|(_, _, t_js, t_r)| clock::latency_webview_to_rust(*t_js, *t_r, off.offset_ms))
        .collect();
    let stats = latency_stats(&lat);
    let (status, msg) = eval_ipc(stats.as_ref(), IPC_EVENTS);
    let v = json!({ "mode": mode, "stats": stats, "status_rule": format!("{status:?}"), "msg": msg,
                    "clock": off, "received": lat.len() });
    log::line(format!(
        "IPC w2r [{mode}]: {msg} (zegar +-{:.3} ms)",
        off.uncertainty_ms
    ));
    ipc.w2r_stats.insert(mode.clone(), v.clone());
    // The status of check 4a is taken from the PACED series (one event per
    // frame, like real PointerMove after coalescing, P4-5B §3.1); the burst
    // series is reported as data only.
    if mode == "paced" {
        ipc.w2r_status = Some((
            status,
            format!("{msg}; niepewnosc zegara +-{:.3} ms", off.uncertainty_ms),
        ));
    }
    Ok(v)
}

#[tauri::command(rename_all = "snake_case")]
async fn spike_r2w_start(app: AppHandle, count: u32, interval_ms: u64) -> Result<(), String> {
    std::thread::spawn(move || {
        for seq in 0..count {
            let p = R2wPing {
                seq,
                t_rust: log::now_ms(),
                last: seq + 1 == count,
            };
            if let Err(e) = app.emit("r2w_ping", p) {
                log::line(format!("IPC r2w emit BLAD seq={seq}: {e}"));
            }
            std::thread::sleep(Duration::from_millis(interval_ms));
        }
    });
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
async fn spike_r2w_result(result: R2wResult) -> Result<Value, String> {
    let off = st()
        .clock
        .lock()
        .unwrap()
        .ok_or("brak synchronizacji zegara")?;
    let lat: Vec<f64> = result
        .received
        .iter()
        .map(|r| clock::latency_rust_to_webview(r.t_rust, r.t_js_recv, off.offset_ms))
        .collect();
    let stats = latency_stats(&lat);
    let (status, msg) = eval_ipc(stats.as_ref(), IPC_EVENTS);
    log::line(format!(
        "IPC r2w: {msg} (zegar +-{:.3} ms)",
        off.uncertainty_ms
    ));
    let v = json!({ "stats": stats, "msg": msg, "clock": off, "received": lat.len() });
    let mut ipc = st().ipc.lock().unwrap();
    ipc.r2w_stats = Some(v.clone());
    ipc.r2w_status = Some((
        status,
        format!("{msg}; niepewnosc zegara +-{:.3} ms", off.uncertainty_ms),
    ));
    Ok(v)
}

#[tauri::command(rename_all = "snake_case")]
async fn spike_ui_rects(rects: UiRects) -> Result<(), String> {
    log::line(format!(
        "UI rects seq={} n={} dpr={}",
        rects.seq,
        rects.rects.len(),
        rects.device_pixel_ratio
    ));
    *st().ui_rects.lock().unwrap() = Some(rects);
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
async fn spike_dom(obs: DomObservation) -> Result<(), String> {
    log::line(format!("DOM {obs:?}"));
    st().dom.lock().unwrap().push(obs);
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
async fn spike_answer(answer: WizardAnswer) -> Result<(), String> {
    log::line(format!("ODPOWIEDZ {answer:?}"));
    st().guided.lock().unwrap().answers.push(answer);
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
async fn spike_status() -> Result<Value, String> {
    let first = *st().first_frame_ms.lock().unwrap();
    Ok(json!({
        "frames": st().frames.load(Ordering::Relaxed),
        "skipped": st().skipped.load(Ordering::Relaxed),
        "render_s": first.map(|f| (log::now_ms() - f) / 1000.0),
        "memory_samples": st().memory.lock().unwrap().len(),
        "native_events": st().native.lock().unwrap().len(),
        "platform": std::env::consts::OS,
        "force_m2": std::env::var("SPIKE_FORCE_M2").map(|v| v == "1").unwrap_or(false),
    }))
}

/// Start of a guided click/key window: remember where the native log is.
#[tauri::command(rename_all = "snake_case")]
async fn spike_window_begin(label: String) -> Result<(), String> {
    let idx = st().native.lock().unwrap().len();
    let mut g = st().guided.lock().unwrap();
    g.open_windows.retain(|(l, _)| *l != label);
    g.open_windows.push((label.clone(), idx));
    log::line(format!("OKNO POMIARU start: {label} (native idx {idx})"));
    Ok(())
}

fn native_since(label: &str) -> Result<Vec<NativeEvent>, String> {
    let idx = {
        let g = st().guided.lock().unwrap();
        g.open_windows
            .iter()
            .find(|(l, _)| l == label)
            .map(|(_, i)| *i)
            .ok_or_else(|| format!("okno pomiaru {label} nie zostalo otwarte"))?
    };
    Ok(st().native.lock().unwrap()[idx..].to_vec())
}

/// Poll: how many native button presses / key presses since the window began.
#[tauri::command(rename_all = "snake_case")]
async fn spike_window_poll(label: String) -> Result<Value, String> {
    let ev = native_since(&label)?;
    let buttons = ev
        .iter()
        .filter(|e| matches!(e.kind, NativeEventKind::ButtonDown { .. }))
        .count();
    let keys = ev
        .iter()
        .filter(|e| matches!(e.kind, NativeEventKind::KeyDown { .. }))
        .count();
    Ok(json!({ "buttons": buttons, "keys": keys }))
}

/// End of a guided click window: store what native/webview saw.
#[tauri::command(rename_all = "snake_case")]
async fn spike_click_end(label: String, webview_seen: bool) -> Result<ClickObservation, String> {
    let ev = native_since(&label)?;
    let native = ev
        .iter()
        .any(|e| matches!(e.kind, NativeEventKind::ButtonDown { .. }));
    let obs = ClickObservation {
        native,
        webview: webview_seen,
    };
    log::line(format!("KLIK {label}: {obs:?}; zdarzenia natywne: {ev:?}"));
    let mut g = st().guided.lock().unwrap();
    g.clicks.retain(|(l, ..)| *l != label);
    g.clicks.push((label, obs, ev));
    Ok(obs)
}

/// End of a guided key window ("direct" / "after_set_focus").
#[tauri::command(rename_all = "snake_case")]
async fn spike_key_end(label: String, webview_seen: bool, has_focus: bool) -> Result<(), String> {
    let ev = native_since(&label)?;
    let native_key = ev
        .iter()
        .any(|e| matches!(e.kind, NativeEventKind::KeyDown { .. }));
    let mut g = st().guided.lock().unwrap();
    match label.as_str() {
        "key_direct" => g.focus.webview_direct = Some(webview_seen),
        "key_after_set_focus" => g.focus.webview_after_set_focus = Some(webview_seen),
        _ => return Err(format!("nieznana etykieta {label}")),
    }
    g.focus.native_saw_key |= native_key;
    let note = format!("{label}: webview={webview_seen} document.hasFocus={has_focus} natywny_klawisz={native_key}");
    log::line(format!("FOKUS {note}; zdarzenia natywne: {ev:?}"));
    g.focus_notes.push(note);
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
async fn spike_webview_set_focus(app: AppHandle) -> Result<(), String> {
    let ww = main_window(&app)?;
    let r = ww
        .as_ref()
        .set_focus()
        .map_err(|e| format!("Webview::set_focus: {e}"));
    log::line(format!("Webview::set_focus -> {r:?}"));
    r
}

fn current_phys_rects(ww: &WebviewWindow) -> Result<(Vec<PhysRect>, f64, u32, u32), String> {
    let rects = st()
        .ui_rects
        .lock()
        .unwrap()
        .clone()
        .ok_or("brak prostokatow UI z webview")?;
    let scale = ww.scale_factor().map_err(|e| e.to_string())?;
    let size = ww.inner_size().map_err(|e| e.to_string())?;
    let phys = css_to_physical(&rects.css_rects(), scale, size.width, size.height);
    Ok((phys, scale, size.width, size.height))
}

#[tauri::command(rename_all = "snake_case")]
async fn spike_m1_apply(app: AppHandle) -> Result<String, String> {
    let ww = main_window(&app)?;
    let (phys, scale, w, h) = current_phys_rects(&ww)?;
    let css = st()
        .ui_rects
        .lock()
        .unwrap()
        .clone()
        .map(|r| r.css_rects())
        .unwrap_or_default();
    log::line(format!(
        "M1: okno {w}x{h} phys, scale {scale}, UI phys {phys:?}"
    ));
    let r = platform::apply_m1_region(&ww, &phys, &css);
    log::line(format!("M1 apply -> {r:?}"));
    st().guided.lock().unwrap().m1_apply = Some(r.clone());
    r
}

#[tauri::command(rename_all = "snake_case")]
async fn spike_m1_clear(app: AppHandle) -> Result<String, String> {
    let ww = main_window(&app)?;
    let r = platform::clear_m1_region(&ww);
    log::line(format!("M1 clear -> {r:?}"));
    r
}

#[tauri::command(rename_all = "snake_case")]
async fn spike_m2_start(app: AppHandle) -> Result<String, String> {
    let ww = main_window(&app)?;
    let _ = platform::clear_m1_region(&ww);
    let (phys, _scale, w, h) = current_phys_rects(&ww)?;
    let res = (|| {
        let child = platform::create_m2_child(&ww, &phys, w, h)?;
        let instance = st()
            .instance
            .lock()
            .unwrap()
            .clone()
            .ok_or("brak instancji wgpu")?;
        let surface = instance
            .create_surface(child)
            .map_err(|e| format!("create_surface(okno-dziecko M2): {e}"))?;
        let tx = st()
            .render_tx
            .lock()
            .unwrap()
            .clone()
            .ok_or("brak watku renderowania")?;
        tx.send(RenderCmd::SwitchSurface(
            surface,
            w,
            h,
            "okno-dziecko M2".into(),
        ))
        .map_err(|e| format!("render cmd: {e}"))?;
        Ok::<String, String>(format!(
            "okno-dziecko M2 {w}x{h}, region = okno minus {} prostokatow UI",
            phys.len()
        ))
    })();
    log::line(format!("M2 start -> {res:?}"));
    st().guided.lock().unwrap().m2_apply = Some(res.clone());
    res
}

#[tauri::command(rename_all = "snake_case")]
async fn spike_fullscreen_test(app: AppHandle) -> Result<Value, String> {
    let ww = main_window(&app)?;
    let mut notes = Vec::new();
    let r0 = st().resized_events.load(Ordering::Relaxed);
    let before = ww.is_fullscreen().map_err(|e| e.to_string())?;
    notes.push(format!("przed: is_fullscreen={before}"));
    let mut on = None;
    let mut off = None;
    match ww.set_fullscreen(true) {
        Ok(()) => {
            std::thread::sleep(Duration::from_millis(1500));
            on = ww.is_fullscreen().ok();
            notes.push(format!(
                "set_fullscreen(true) + 1.5 s: is_fullscreen={on:?}, Resized od startu testu: {}",
                st().resized_events.load(Ordering::Relaxed) - r0
            ));
        }
        Err(e) => notes.push(format!("set_fullscreen(true) BLAD: {e}")),
    }
    let r1 = st().resized_events.load(Ordering::Relaxed);
    match ww.set_fullscreen(false) {
        Ok(()) => {
            std::thread::sleep(Duration::from_millis(1500));
            off = ww.is_fullscreen().ok();
            notes.push(format!(
                "set_fullscreen(false) + 1.5 s: is_fullscreen={off:?}, Resized po wyjsciu: {}",
                st().resized_events.load(Ordering::Relaxed) - r1
            ));
        }
        Err(e) => notes.push(format!("set_fullscreen(false) BLAD: {e}")),
    }
    for n in &notes {
        log::line(format!("FULLSCREEN {n}"));
    }
    st().guided.lock().unwrap().fullscreen = Some((on, off, notes.clone()));
    Ok(json!({ "after_on": on, "after_off": off, "notes": notes }))
}

#[tauri::command(rename_all = "snake_case")]
async fn spike_finish() -> Result<Value, String> {
    let path = finalize("przycisk Zakoncz w kreatorze")?;
    Ok(json!({ "report": path, "summary": st().report.lock().unwrap().summary_lines() }))
}

// ---------------------------------------------------------------------------
// Evaluation + report
// ---------------------------------------------------------------------------

fn answer(step: &str) -> Option<String> {
    st().guided
        .lock()
        .unwrap()
        .answers
        .iter()
        .rev()
        .find(|a| a.step == step)
        .map(|a| a.answer.clone())
}

fn click(label: &str) -> Option<(ClickObservation, Vec<NativeEvent>)> {
    st().guided
        .lock()
        .unwrap()
        .clicks
        .iter()
        .find(|(l, ..)| l == label)
        .map(|(_, o, e)| (*o, e.clone()))
}

fn finalize(reason: &str) -> Result<String, String> {
    let s = st();
    let frames = s.frames.load(Ordering::Relaxed);
    let skipped = s.skipped.load(Ordering::Relaxed);
    let mut report = s.report.lock().unwrap().clone();
    report.env("finalize_reason", reason);
    report.env("frames_presented", frames);
    report.env("frames_skipped", skipped);
    report.env(
        "frame_skip_reasons_first20",
        json!(*s.skip_reasons.lock().unwrap()),
    );
    report.env("ui_rects_last", json!(*s.ui_rects.lock().unwrap()));
    report.env("clock_offset", json!(*s.clock.lock().unwrap()));
    report.env("native_hooks", json!(platform::NATIVE_HOOKS_DESCRIPTION));

    // (1) render under webview
    let a1 = answer("p1_visible");
    let (st1, msg1) = eval_render(frames, a1.as_deref());
    report.set(
        CheckId::P1RenderPodWebview,
        st1,
        vec![msg1],
        json!({ "frames": frames, "skipped": skipped, "answer": a1 }),
    );

    let g = s.guided.lock().unwrap();
    let m1_apply = g.m1_apply.clone();
    let m2_apply = g.m2_apply.clone();
    let focus = g.focus;
    let focus_notes = g.focus_notes.clone();
    let fullscreen = g.fullscreen.clone();
    drop(g);

    // (2) M1
    match &m1_apply {
        Some(Err(e)) => report.set(
            CheckId::P2M1RegionWejscia,
            Status::NieZmierzono,
            vec![format!(
                "M1 niedostepne na tej platformie / blad zastosowania: {e}"
            )],
            Value::Null,
        ),
        None => {}
        Some(Ok(applied)) => {
            let h = click("m1_hole");
            let u = click("m1_ui");
            let (mut stt, msg) = eval_input_split(h.as_ref().map(|x| x.0), u.as_ref().map(|x| x.0));
            let vis = answer("m1_visible");
            let mut ev = vec![format!("zastosowano: {applied}"), msg];
            if stt == Status::Pass && vis.as_deref() != Some("TAK") {
                stt = Status::Fail;
                ev.push(format!(
                    "wizualnie po M1: {vis:?} (wymagane TAK: panel i trojkat widoczne)"
                ));
            } else {
                ev.push(format!("wizualnie po M1: {vis:?}"));
            }
            report.set(
                CheckId::P2M1RegionWejscia,
                stt,
                ev,
                json!({ "hole": h, "ui": u, "visible": vis }),
            );
        }
    }

    // (3) M2
    let m1_status = report.get(CheckId::P2M1RegionWejscia).status;
    match &m2_apply {
        None if m1_status == Status::Pass => report.set(
            CheckId::P3M2OdwroconeWarstwy,
            Status::NieZmierzono,
            vec!["pominiete: M1 = PASS (dispatch: M2 tylko gdy M1 sie nie uda; wymus SPIKE_FORCE_M2=1)".into()],
            Value::Null,
        ),
        None => {}
        Some(Err(e)) => report.set(
            CheckId::P3M2OdwroconeWarstwy,
            Status::NieZmierzono,
            vec![format!("M2 niedostepne na tej platformie / blad: {e}")],
            Value::Null,
        ),
        Some(Ok(applied)) => {
            let h = click("m2_hole");
            let u = click("m2_ui");
            let (mut stt, msg) = eval_input_split(h.as_ref().map(|x| x.0), u.as_ref().map(|x| x.0));
            let vis = answer("m2_visible");
            let mut ev = vec![format!("zastosowano: {applied}"), msg];
            if stt == Status::Pass && vis.as_deref() != Some("TAK") {
                stt = Status::Fail;
            }
            ev.push(format!("wizualnie po M2: {vis:?}"));
            report.set(CheckId::P3M2OdwroconeWarstwy, stt, ev, json!({ "hole": h, "ui": u, "visible": vis }));
        }
    }

    // (4) IPC
    let ipc = s.ipc.lock().unwrap();
    if let Some((stt, msg)) = &ipc.w2r_status {
        report.set(
            CheckId::P4aIpcWebviewDoRust,
            *stt,
            vec![msg.clone()],
            Value::Object(ipc.w2r_stats.clone()),
        );
    }
    if let Some((stt, msg)) = &ipc.r2w_status {
        report.set(
            CheckId::P4bIpcRustDoWebview,
            *stt,
            vec![msg.clone()],
            ipc.r2w_stats.clone().unwrap_or(Value::Null),
        );
    }
    drop(ipc);

    // (5) memory
    let mem = s.memory.lock().unwrap().clone();
    let (st5, ev5) = eval_memory(&mem);
    report.set(CheckId::P5Pamiec60s, st5, ev5, json!(mem));

    // (6) focus
    if focus.webview_direct.is_some() || focus.webview_after_set_focus.is_some() {
        let (st6, msg6) = eval_focus(focus);
        let mut ev = vec![msg6];
        ev.extend(focus_notes);
        report.set(CheckId::P6FokusKlawiatury, st6, ev, json!(focus));
    } else {
        report.set(
            CheckId::P6FokusKlawiatury,
            Status::NieZmierzono,
            vec!["brak klikniecia, ktore dotarlo do okna natywnego (M1/M2) - test fokusu niewykonalny".into()],
            Value::Null,
        );
    }

    // (7) fullscreen
    if let Some((on, off, notes)) = fullscreen {
        let (st7, msg7) = eval_fullscreen(on, off);
        let mut ev = vec![msg7];
        ev.extend(notes);
        report.set(
            CheckId::P7Fullscreen,
            st7,
            ev,
            json!({ "after_on": on, "after_off": off }),
        );
    }

    report.env("native_events", json!(*s.native.lock().unwrap()));
    report.env("dom_observations", json!(*s.dom.lock().unwrap()));
    report.env("answers", json!(s.guided.lock().unwrap().answers));
    report.log = report.summary_lines();

    std::fs::create_dir_all(&s.out_dir).map_err(|e| format!("{}: {e}", s.out_dir.display()))?;
    let path = s
        .out_dir
        .join(format!("raport-{}-{}.json", std::env::consts::OS, s.stamp));
    std::fs::write(&path, report.to_json_pretty())
        .map_err(|e| format!("{}: {e}", path.display()))?;
    for l in report.summary_lines() {
        log::line(format!("WYNIK {l}"));
    }
    log::line(format!(
        "RAPORT zapisany: {} (powod: {reason})",
        path.display()
    ));
    *s.report.lock().unwrap() = report;
    s.finished.store(true, Ordering::Relaxed);
    Ok(path.display().to_string())
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/// Run the spike application.
pub fn run() {
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "0".into());
    let out = out_dir();
    let _ = std::fs::create_dir_all(&out);
    let log_path = out.join(format!("log-{}-{}.txt", std::env::consts::OS, stamp));
    match log::open(&log_path) {
        Ok(()) => log::line(format!("log: {}", log_path.display())),
        Err(e) => log::line(format!(
            "log: nie mozna otworzyc {} ({e}); tylko stderr",
            log_path.display()
        )),
    }
    let mut report = Report::new();
    report.env("log_file", log_path.display().to_string());
    report.env("tauri_version", tauri::VERSION);
    report.env("wgpu_version", "30.0.1");
    report.env("spike_version", env!("CARGO_PKG_VERSION"));
    report.env(
        "force_m2",
        std::env::var("SPIKE_FORCE_M2")
            .map(|v| v == "1")
            .unwrap_or(false),
    );
    report.env(
        "env_vars",
        json!({
            "WGPU_BACKEND": std::env::var("WGPU_BACKEND").ok(),
            "WAYLAND_DISPLAY": std::env::var("WAYLAND_DISPLAY").ok(),
            "DISPLAY": std::env::var("DISPLAY").ok(),
            "XDG_SESSION_TYPE": std::env::var("XDG_SESSION_TYPE").ok(),
            "GDK_BACKEND": std::env::var("GDK_BACKEND").ok(),
            "WEBKIT_DISABLE_COMPOSITING_MODE": std::env::var("WEBKIT_DISABLE_COMPOSITING_MODE").ok(),
        }),
    );
    let _ = SHARED.set(Shared {
        report: Mutex::new(report),
        native: Mutex::new(Vec::new()),
        dom: Mutex::new(Vec::new()),
        ui_rects: Mutex::new(None),
        clock: Mutex::new(None),
        ipc: Mutex::new(Ipc::default()),
        guided: Mutex::new(Guided::default()),
        frames: AtomicU64::new(0),
        skipped: AtomicU64::new(0),
        skip_reasons: Mutex::new(Vec::new()),
        first_frame_ms: Mutex::new(None),
        render_tx: Mutex::new(None),
        instance: Mutex::new(None),
        device: Mutex::new(None),
        memory: Mutex::new(Vec::new()),
        resized_events: AtomicU64::new(0),
        finished: AtomicBool::new(false),
        out_dir: out,
        stamp,
    });
    let default_hook = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        log::line(format!("PANIC: {info}"));
        default_hook(info);
    }));

    let app = tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();
            if let Err(e) = start_rendering(&handle) {
                log::line(format!("RENDER START BLAD: {e}"));
                st().report.lock().unwrap().env("render_start_error", e);
            }
            match main_window(&handle).and_then(|ww| platform::install_native_hooks(&ww)) {
                Ok(m) => log::line(format!("haki natywne: {m}")),
                Err(e) => {
                    log::line(format!("haki natywne BLAD/STUB: {e}"));
                    st().report.lock().unwrap().env("native_hooks_error", e);
                }
            }
            Ok(())
        })
        .on_window_event(|_window, event| match event {
            tauri::WindowEvent::Resized(size) => {
                st().resized_events.fetch_add(1, Ordering::Relaxed);
                log::line(format!(
                    "WindowEvent::Resized {}x{}",
                    size.width, size.height
                ));
                if let Some(tx) = st().render_tx.lock().unwrap().as_ref() {
                    let _ = tx.send(RenderCmd::Resize(size.width, size.height));
                }
            }
            tauri::WindowEvent::ScaleFactorChanged { scale_factor, .. } => {
                log::line(format!("WindowEvent::ScaleFactorChanged {scale_factor}"));
            }
            tauri::WindowEvent::Focused(f) => log::line(format!("WindowEvent::Focused({f})")),
            tauri::WindowEvent::CloseRequested { .. } if !st().finished.load(Ordering::Relaxed) => {
                if let Err(e) = finalize("zamkniecie okna przed koncem kreatora") {
                    log::line(format!("RAPORT BLAD: {e}"));
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            spike_clock_now,
            spike_clock_samples,
            spike_pointer_move,
            spike_w2r_done,
            spike_r2w_start,
            spike_r2w_result,
            spike_ui_rects,
            spike_dom,
            spike_answer,
            spike_status,
            spike_window_begin,
            spike_window_poll,
            spike_click_end,
            spike_key_end,
            spike_webview_set_focus,
            spike_m1_apply,
            spike_m1_clear,
            spike_m2_start,
            spike_fullscreen_test,
            spike_finish,
        ])
        .build(tauri::generate_context!());
    match app {
        Ok(app) => app.run(|_, _| {}),
        Err(e) => {
            log::line(format!("TAURI BUILD BLAD: {e}"));
            let mut r = st().report.lock().unwrap().clone();
            r.env("tauri_build_error", e.to_string());
            let p = st().out_dir.join(format!(
                "raport-{}-{}.json",
                std::env::consts::OS,
                st().stamp
            ));
            let _ = std::fs::write(&p, r.to_json_pretty());
            std::process::exit(1);
        }
    }
}
