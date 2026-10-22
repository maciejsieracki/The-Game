//! Windows (WebView2) platform code of the spike.
//!
//! - Native input hook: `SetWindowSubclass` on the Tauri (tao) top-level HWND;
//!   records WM_*BUTTONDOWN / WM_KEYDOWN / WM_SETFOCUS / WM_KILLFOCUS.
//! - M1: `SetWindowRgn` on the WebView2 host window (wry container
//!   `WRY_WEBVIEW`, the controller's `ParentWindow`), region = union of the UI
//!   rects. Outside the region a click should hit the top-level HWND.
//!   Known side effect (P4-5B §2 M1): the region also clips DRAWING of the
//!   webview.
//! - M2: own child HWND `SPIKE_M2_MAP` above the webview (HWND_TOP), region =
//!   client area minus UI rects; wgpu renders into it; its window procedure
//!   records the clicks.
//!
//! Status: written against windows 0.61.3 / webview2-com 0.38.2 signatures;
//! `cargo check --target x86_64-pc-windows-msvc` result is in the run log of
//! R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1. Runtime behaviour: NIE_ZMIERZONO.

use std::num::NonZeroIsize;

use raw_window_handle::{
    DisplayHandle, HandleError, HasDisplayHandle, HasWindowHandle, RawDisplayHandle,
    RawWindowHandle, Win32WindowHandle, WindowHandle, WindowsDisplayHandle,
};
use tauri::WebviewWindow;
use windows::core::{w, PCWSTR};
use windows::Win32::Foundation::{HINSTANCE, HWND, LPARAM, LRESULT, WPARAM};
use windows::Win32::Graphics::Gdi::{
    CombineRgn, CreateRectRgn, DeleteObject, SetWindowRgn, HRGN, RGN_DIFF, RGN_OR,
};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::UI::Shell::{DefSubclassProc, SetWindowSubclass};
use windows::Win32::UI::WindowsAndMessaging::{
    CreateWindowExW, DefWindowProcW, RegisterClassExW, SetWindowPos, CS_HREDRAW, CS_VREDRAW,
    HWND_TOP, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE, WINDOW_EX_STYLE, WM_KEYDOWN, WM_KILLFOCUS,
    WM_LBUTTONDOWN, WM_MBUTTONDOWN, WM_RBUTTONDOWN, WM_SETFOCUS, WNDCLASSEXW, WS_CHILD,
    WS_CLIPSIBLINGS, WS_VISIBLE,
};

use super::{on_main, push_native, with_platform_webview};
use crate::protocol::NativeEventKind;
use crate::regions::{CssRect, PhysRect};

pub const NATIVE_HOOKS_DESCRIPTION: &str =
    "windows: SetWindowSubclass na HWND okna Tauri (WM_*BUTTONDOWN, WM_KEYDOWN, WM_SETFOCUS/KILLFOCUS); M2: wlasna procedura okna-dziecka";

const SUBCLASS_ID: usize = 0x5350_4B31; // "SPK1"

fn lparam_xy(lp: LPARAM) -> (f64, f64) {
    let x = (lp.0 & 0xffff) as u16 as i16 as f64;
    let y = ((lp.0 >> 16) & 0xffff) as u16 as i16 as f64;
    (x, y)
}

fn record(source: &str, msg: u32, wp: WPARAM, lp: LPARAM) {
    let kind = match msg {
        WM_LBUTTONDOWN | WM_RBUTTONDOWN | WM_MBUTTONDOWN => {
            let (x, y) = lparam_xy(lp);
            let button = match msg {
                WM_LBUTTONDOWN => 0,
                WM_MBUTTONDOWN => 1,
                _ => 2,
            };
            Some(NativeEventKind::ButtonDown {
                button,
                x_phys: x,
                y_phys: y,
            })
        }
        WM_KEYDOWN => Some(NativeEventKind::KeyDown { code: wp.0 as u32 }),
        WM_SETFOCUS => Some(NativeEventKind::FocusIn),
        WM_KILLFOCUS => Some(NativeEventKind::FocusOut),
        _ => None,
    };
    if let Some(k) = kind {
        push_native(source, k);
    }
}

unsafe extern "system" fn main_subclass_proc(
    hwnd: HWND,
    msg: u32,
    wp: WPARAM,
    lp: LPARAM,
    _id: usize,
    _data: usize,
) -> LRESULT {
    record("win32:main-subclass", msg, wp, lp);
    unsafe { DefSubclassProc(hwnd, msg, wp, lp) }
}

unsafe extern "system" fn m2_child_proc(hwnd: HWND, msg: u32, wp: WPARAM, lp: LPARAM) -> LRESULT {
    record("win32:m2-child", msg, wp, lp);
    unsafe { DefWindowProcW(hwnd, msg, wp, lp) }
}

fn main_hwnd(ww: &WebviewWindow) -> Result<isize, String> {
    ww.hwnd()
        .map(|h| h.0 as isize)
        .map_err(|e| format!("WebviewWindow::hwnd: {e}"))
}

/// Install the subclass. Called from `setup` (main thread): fire-and-forget.
pub fn install_native_hooks(ww: &WebviewWindow) -> Result<String, String> {
    let hwnd = main_hwnd(ww)?;
    ww.run_on_main_thread(move || {
        let ok = unsafe {
            SetWindowSubclass(
                HWND(hwnd as *mut _),
                Some(main_subclass_proc),
                SUBCLASS_ID,
                0,
            )
        };
        crate::log::line(format!(
            "SetWindowSubclass(main HWND {hwnd:#x}) -> {}",
            ok.as_bool()
        ));
    })
    .map_err(|e| format!("run_on_main_thread: {e}"))?;
    Ok(format!("SetWindowSubclass zaplanowany na HWND {hwnd:#x}"))
}

/// WebView2 host HWND (wry `WRY_WEBVIEW` container) = controller.ParentWindow.
fn webview_host_hwnd(ww: &WebviewWindow) -> Result<isize, String> {
    with_platform_webview(ww, |pw| {
        let controller = pw.controller();
        let mut h = HWND::default();
        unsafe { controller.ParentWindow(&mut h) }
            .map(|_| h.0 as isize)
            .map_err(|e| format!("ICoreWebView2Controller::ParentWindow: {e}"))
    })?
}

/// Union of rects as an HRGN (caller passes ownership to SetWindowRgn).
unsafe fn union_region(rects: &[PhysRect]) -> HRGN {
    let rgn = unsafe { CreateRectRgn(0, 0, 0, 0) };
    for r in rects {
        let part = unsafe { CreateRectRgn(r.x, r.y, r.x + r.w, r.y + r.h) };
        unsafe {
            let _ = CombineRgn(Some(rgn), Some(rgn), Some(part), RGN_OR);
            let _ = DeleteObject(part.into());
        }
    }
    rgn
}

pub fn apply_m1_region(
    ww: &WebviewWindow,
    phys: &[PhysRect],
    _css: &[CssRect],
) -> Result<String, String> {
    if phys.is_empty() {
        return Err("brak prostokatow UI - region bylby pusty (webview niewidoczny)".into());
    }
    let host = webview_host_hwnd(ww)?;
    let rects = phys.to_vec();
    let r = on_main(ww, move || unsafe {
        let rgn = union_region(&rects);
        SetWindowRgn(HWND(host as *mut _), Some(rgn), true)
    })?;
    if r == 0 {
        return Err(format!("SetWindowRgn(host {host:#x}) zwrocil 0"));
    }
    Ok(format!(
        "SetWindowRgn na hoście WebView2 HWND {host:#x}: {} prostokatow",
        phys.len()
    ))
}

pub fn clear_m1_region(ww: &WebviewWindow) -> Result<String, String> {
    let host = webview_host_hwnd(ww)?;
    let r = on_main(ww, move || unsafe {
        SetWindowRgn(HWND(host as *mut _), None, true)
    })?;
    Ok(format!("SetWindowRgn(host {host:#x}, NULL) -> {r}"))
}

/// Child HWND as a wgpu surface target.
#[derive(Debug, Clone, Copy)]
pub struct ChildTarget {
    hwnd: isize,
    hinstance: isize,
}

impl HasWindowHandle for ChildTarget {
    fn window_handle(&self) -> Result<WindowHandle<'_>, HandleError> {
        let mut h =
            Win32WindowHandle::new(NonZeroIsize::new(self.hwnd).ok_or(HandleError::Unavailable)?);
        h.hinstance = NonZeroIsize::new(self.hinstance);
        // SAFETY: the child window lives until the process exits (the spike
        // never destroys it).
        Ok(unsafe { WindowHandle::borrow_raw(RawWindowHandle::Win32(h)) })
    }
}

impl HasDisplayHandle for ChildTarget {
    fn display_handle(&self) -> Result<DisplayHandle<'_>, HandleError> {
        Ok(unsafe {
            DisplayHandle::borrow_raw(RawDisplayHandle::Windows(WindowsDisplayHandle::new()))
        })
    }
}

pub fn create_m2_child(
    ww: &WebviewWindow,
    phys: &[PhysRect],
    w: u32,
    h: u32,
) -> Result<ChildTarget, String> {
    let parent = main_hwnd(ww)?;
    let rects = phys.to_vec();
    on_main(ww, move || -> Result<ChildTarget, String> {
        unsafe {
            let hmodule =
                GetModuleHandleW(PCWSTR::null()).map_err(|e| format!("GetModuleHandleW: {e}"))?;
            let hinstance: HINSTANCE = hmodule.into();
            let class_name = w!("SPIKE_M2_MAP");
            let class = WNDCLASSEXW {
                cbSize: std::mem::size_of::<WNDCLASSEXW>() as u32,
                style: CS_HREDRAW | CS_VREDRAW,
                lpfnWndProc: Some(m2_child_proc),
                hInstance: hinstance,
                lpszClassName: class_name,
                ..Default::default()
            };
            // 0 also when already registered (second run in the same process) -> ignored.
            let _ = RegisterClassExW(&class);
            let child = CreateWindowExW(
                WINDOW_EX_STYLE::default(),
                class_name,
                PCWSTR::null(),
                WS_CHILD | WS_VISIBLE | WS_CLIPSIBLINGS,
                0,
                0,
                w as i32,
                h as i32,
                Some(HWND(parent as *mut _)),
                None,
                Some(hinstance),
                None,
            )
            .map_err(|e| format!("CreateWindowExW(SPIKE_M2_MAP): {e}"))?;
            SetWindowPos(
                child,
                Some(HWND_TOP),
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
            )
            .map_err(|e| format!("SetWindowPos(HWND_TOP): {e}"))?;
            // region = whole client area minus the UI rects
            let rgn = CreateRectRgn(0, 0, w as i32, h as i32);
            for r in &rects {
                let part = CreateRectRgn(r.x, r.y, r.x + r.w, r.y + r.h);
                let _ = CombineRgn(Some(rgn), Some(rgn), Some(part), RGN_DIFF);
                let _ = DeleteObject(part.into());
            }
            if SetWindowRgn(child, Some(rgn), true) == 0 {
                return Err("SetWindowRgn(okno-dziecko M2) zwrocil 0".into());
            }
            crate::log::line(format!(
                "M2: okno-dziecko HWND {:#x} nad webview",
                child.0 as isize
            ));
            Ok(ChildTarget {
                hwnd: child.0 as isize,
                hinstance: hinstance.0 as isize,
            })
        }
    })?
}
