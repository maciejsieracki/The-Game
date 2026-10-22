//! macOS (WKWebView) platform code of the spike: STUBS in round 1.
//!
//! M1 on macOS needs a WKWebView subclass (or a swizzled method) overriding
//! `hitTest:` so that points outside the UI rects return `nil` and fall
//! through to the content view below; that requires `objc2` class definition
//! code and was not written in round 1. M2 (NSView child above the web view)
//! likewise. Rendering (check 1), IPC (4), memory (5) and fullscreen (7) DO
//! run on macOS; checks 2, 3 and 6 end as NIE_ZMIERZONO with this reason.
//!
//! macOS is not a target platform today (bundle: msi/nsis only, P4-3 D-RR-2).

use tauri::WebviewWindow;

use crate::regions::{CssRect, PhysRect};

pub const NATIVE_HOOKS_DESCRIPTION: &str = "macos: BRAK (stub w rundzie 1)";

const STUB: &str =
    "NIE_ZAIMPLEMENTOWANO na macOS w rundzie 1 (wymaga podklasy WKWebView z hitTest: przez objc2)";

pub fn install_native_hooks(_ww: &WebviewWindow) -> Result<String, String> {
    Err(STUB.into())
}

pub fn apply_m1_region(
    _ww: &WebviewWindow,
    _phys: &[PhysRect],
    _css: &[CssRect],
) -> Result<String, String> {
    Err(STUB.into())
}

pub fn clear_m1_region(_ww: &WebviewWindow) -> Result<String, String> {
    Err(STUB.into())
}

pub type ChildTarget = WebviewWindow;

pub fn create_m2_child(
    _ww: &WebviewWindow,
    _phys: &[PhysRect],
    _w: u32,
    _h: u32,
) -> Result<ChildTarget, String> {
    Err(STUB.into())
}
