//! Linux (GTK3 + WebKitGTK) platform code of the spike.
//!
//! - Native input hook: `button-press-event` / `key-press-event` on the Tauri
//!   `gtk::ApplicationWindow` (top level). WebKit consumes events that reach
//!   the web view, so the top level should only see events that missed it.
//! - M1: `gdk::Window::input_shape_combine_region` on the web view's own
//!   `GdkWindow`, region = union of the UI rects. Guard: when the web view has
//!   NO own GdkWindow (it shares the top level's), applying the shape to the
//!   top level would make the hole click-through to the DESKTOP, so the spike
//!   refuses and reports why (= NIE_ZMIERZONO with reason).
//!   ZAŁOŻENIE Z-S4: GDK coordinates are logical px = CSS px (WebKit zoom 1),
//!   so the CSS rects are used directly (not the physical ones).
//! - M2: not implemented on Linux in round 1 (stub, explicit error).
//!
//! Status: could NOT be compiled in the agent container (no GTK/WebKit dev
//! packages); compile and runtime: NIE_ZMIERZONO.

use gtk::prelude::*;
use tauri::WebviewWindow;

use super::{push_native, with_platform_webview};
use crate::protocol::NativeEventKind;
use crate::regions::{CssRect, PhysRect};

pub const NATIVE_HOOKS_DESCRIPTION: &str =
    "linux: gtk button-press-event / key-press-event na ApplicationWindow; M1: gdk input_shape_combine_region na GdkWindow web view";

/// Install the GTK signal handlers. Called from `setup` (main thread):
/// fire-and-forget through `run_on_main_thread`.
pub fn install_native_hooks(ww: &WebviewWindow) -> Result<String, String> {
    let ww2 = ww.clone();
    ww.run_on_main_thread(move || match ww2.gtk_window() {
        Ok(win) => {
            win.add_events(
                gtk::gdk::EventMask::BUTTON_PRESS_MASK | gtk::gdk::EventMask::KEY_PRESS_MASK,
            );
            win.connect_button_press_event(|_, ev| {
                let (x, y) = ev.position();
                let button = ev.button().saturating_sub(1).min(255) as u8;
                push_native(
                    "gtk:toplevel",
                    NativeEventKind::ButtonDown {
                        button,
                        x_phys: x,
                        y_phys: y,
                    },
                );
                gtk::glib::Propagation::Proceed
            });
            win.connect_key_press_event(|_, ev| {
                push_native(
                    "gtk:toplevel",
                    NativeEventKind::KeyDown {
                        code: ev.hardware_keycode() as u32,
                    },
                );
                gtk::glib::Propagation::Proceed
            });
            win.connect_focus_in_event(|_, _| {
                push_native("gtk:toplevel", NativeEventKind::FocusIn);
                gtk::glib::Propagation::Proceed
            });
            win.connect_focus_out_event(|_, _| {
                push_native("gtk:toplevel", NativeEventKind::FocusOut);
                gtk::glib::Propagation::Proceed
            });
            crate::log::line("gtk: sygnaly button/key/focus podpiete na ApplicationWindow");
        }
        Err(e) => crate::log::line(format!("gtk_window BLAD: {e}")),
    })
    .map_err(|e| format!("run_on_main_thread: {e}"))?;
    Ok("sygnaly GTK zaplanowane".into())
}

fn shape(ww: &WebviewWindow, rects: Option<Vec<CssRect>>) -> Result<String, String> {
    let ww2 = ww.clone();
    with_platform_webview(ww, move |pw| -> Result<String, String> {
        let wv = pw.inner();
        let wv_gdk = wv
            .window()
            .ok_or("web view nie ma GdkWindow (niezrealizowany?)")?;
        let top_gdk = ww2
            .gtk_window()
            .map_err(|e| format!("gtk_window: {e}"))?
            .window()
            .ok_or("ApplicationWindow bez GdkWindow")?;
        if wv_gdk == top_gdk {
            return Err(
                "web view dzieli GdkWindow z oknem glownym - ksztalt wejscia przepuscilby klik do pulpitu; M1 przez input shape niewykonalne bez osobnego GdkWindow"
                    .into(),
            );
        }
        match rects {
            Some(rects) => {
                let ints: Vec<gtk::cairo::RectangleInt> = rects
                    .iter()
                    .map(|r| {
                        let l = r.x.floor() as i32;
                        let t = r.y.floor() as i32;
                        let rr = (r.x + r.w).ceil() as i32;
                        let b = (r.y + r.h).ceil() as i32;
                        gtk::cairo::RectangleInt::new(l, t, rr - l, b - t)
                    })
                    .collect();
                let region = gtk::cairo::Region::create_rectangles(&ints);
                wv_gdk.input_shape_combine_region(&region, 0, 0);
                Ok(format!("input_shape_combine_region na GdkWindow web view: {} prostokatow (px CSS = px GDK, Z-S4)", ints.len()))
            }
            None => {
                // full rectangle of the web view = no shape restriction
                let (w, h) = (wv_gdk.width(), wv_gdk.height());
                let region = gtk::cairo::Region::create_rectangle(&gtk::cairo::RectangleInt::new(
                    0, 0, w, h,
                ));
                wv_gdk.input_shape_combine_region(&region, 0, 0);
                Ok(format!("input shape przywrocony do {w}x{h}"))
            }
        }
    })?
}

pub fn apply_m1_region(
    ww: &WebviewWindow,
    _phys: &[PhysRect],
    css: &[CssRect],
) -> Result<String, String> {
    if css.is_empty() {
        return Err("brak prostokatow UI".into());
    }
    shape(ww, Some(css.to_vec()))
}

pub fn clear_m1_region(ww: &WebviewWindow) -> Result<String, String> {
    shape(ww, None)
}

/// No M2 implementation on Linux in round 1: the type only has to satisfy
/// `create_surface`.
pub type ChildTarget = WebviewWindow;

pub fn create_m2_child(
    _ww: &WebviewWindow,
    _phys: &[PhysRect],
    _w: u32,
    _h: u32,
) -> Result<ChildTarget, String> {
    Err("NIE_ZAIMPLEMENTOWANO na Linuksie w rundzie 1 (okno-dziecko GTK/X11 nad WebKitGTK); M2 = NIE_ZMIERZONO".into())
}
