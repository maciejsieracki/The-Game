//! Messages between the spike webview (`ui/spike.js`) and Rust.
//!
//! `MapInput` / `MapInputEvent` follow the shape of P4-5B §3.1 (subset used by
//! the spike) so the IPC latency is measured on a realistic payload, not on an
//! empty ping.

use serde::{Deserialize, Serialize};

use crate::regions::CssRect;

/// P4-5B §3.1 `scene`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Scene {
    Map,
    Battle,
}

/// Modifier keys.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct Mods {
    pub shift: bool,
    pub ctrl: bool,
    pub alt: bool,
    pub meta: bool,
}

/// P4-5B §3.1 `MapInputEvent` (subset).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum MapInputEvent {
    PointerMove {
        x: f64,
        y: f64,
    },
    PointerDown {
        x: f64,
        y: f64,
        button: u8,
        mods: Mods,
    },
    PointerUp {
        x: f64,
        y: f64,
        button: u8,
        mods: Mods,
    },
    Wheel {
        x: f64,
        y: f64,
        delta_y: f64,
    },
    Key {
        key: String,
        down: bool,
    },
}

/// P4-5B §3.1 `MapInput`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MapInput {
    pub scene: Scene,
    pub over_ui: bool,
    pub ev: MapInputEvent,
}

/// Webview -> Rust: one measured input event.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TimedInput {
    pub seq: u32,
    /// `performance.now()` at send time.
    pub t_js: f64,
    pub input: MapInput,
}

/// Rust -> webview: one measured event (`r2w_ping`).
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct R2wPing {
    pub seq: u32,
    /// Rust ms since spike start at emit time.
    pub t_rust: f64,
    /// Last one of the series.
    pub last: bool,
}

/// Webview -> Rust: result of the Rust -> webview series, one receive time
/// per ping (`performance.now()`), indexed by `seq`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct R2wResult {
    pub received: Vec<R2wReceived>,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct R2wReceived {
    pub seq: u32,
    pub t_rust: f64,
    pub t_js_recv: f64,
}

/// A named UI rectangle (subset of P4-5B §4.1 `HitRegions.rects`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct NamedRect {
    pub id: String,
    #[serde(flatten)]
    pub rect: CssRect,
}

/// Webview -> Rust: current UI rectangles (subset of P4-5B §4.1).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct UiRects {
    pub seq: u64,
    pub viewport_w: f64,
    pub viewport_h: f64,
    pub device_pixel_ratio: f64,
    pub rects: Vec<NamedRect>,
}

impl UiRects {
    pub fn css_rects(&self) -> Vec<CssRect> {
        self.rects.iter().map(|r| r.rect).collect()
    }
}

/// What a platform hook observed in the native window (outside the webview).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum NativeEventKind {
    /// Mouse button press, physical px relative to the hooked window.
    ButtonDown {
        button: u8,
        x_phys: f64,
        y_phys: f64,
    },
    /// Key press (platform virtual key / keyval).
    KeyDown {
        code: u32,
    },
    FocusIn,
    FocusOut,
}

/// Native event with its origin and time.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct NativeEvent {
    /// Rust ms since spike start.
    pub t_rust: f64,
    /// e.g. `win32:main-subclass`, `win32:m2-child`, `gtk:toplevel`.
    pub source: String,
    pub kind: NativeEventKind,
}

/// Webview -> Rust: what the page itself observed (DOM listeners).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DomObservation {
    /// `pointerdown`, `keydown`, `click-ui-button`, ...
    pub kind: String,
    pub x: Option<f64>,
    pub y: Option<f64>,
    pub key: Option<String>,
    pub target_id: Option<String>,
    /// `document.hasFocus()` at that moment.
    pub has_focus: bool,
    pub t_js: f64,
}

/// Webview -> Rust: answer of the owner to a wizard question.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct WizardAnswer {
    pub step: String,
    pub answer: String,
    pub note: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn timed_input_from_js_json() {
        // Exactly what ui/spike.js sends (externally tagged enum).
        let js = r#"{"seq":7,"t_js":1234.5,"input":{"scene":"Map","over_ui":false,"ev":{"PointerMove":{"x":10.5,"y":20}}}}"#;
        let v: TimedInput = serde_json::from_str(js).unwrap();
        assert_eq!(v.seq, 7);
        assert_eq!(v.input.ev, MapInputEvent::PointerMove { x: 10.5, y: 20.0 });
        assert!(!v.input.over_ui);
    }

    #[test]
    fn ui_rects_flattened() {
        let js = r#"{"seq":3,"viewport_w":1280,"viewport_h":800,"device_pixel_ratio":1.25,
                     "rects":[{"id":"panel","x":900,"y":0,"w":380,"h":800}]}"#;
        let v: UiRects = serde_json::from_str(js).unwrap();
        assert_eq!(v.rects[0].id, "panel");
        assert_eq!(
            v.css_rects()[0],
            CssRect {
                x: 900.0,
                y: 0.0,
                w: 380.0,
                h: 800.0
            }
        );
    }

    #[test]
    fn native_event_roundtrip() {
        let e = NativeEvent {
            t_rust: 1.0,
            source: "win32:main-subclass".into(),
            kind: NativeEventKind::ButtonDown {
                button: 0,
                x_phys: 5.0,
                y_phys: 6.0,
            },
        };
        let s = serde_json::to_string(&e).unwrap();
        assert!(s.contains("\"ButtonDown\""));
        assert_eq!(serde_json::from_str::<NativeEvent>(&s).unwrap(), e);
    }

    #[test]
    fn r2w_result_from_js_json() {
        let js = r#"{"received":[{"seq":0,"t_rust":10.0,"t_js_recv":5.5}]}"#;
        let v: R2wResult = serde_json::from_str(js).unwrap();
        assert_eq!(v.received.len(), 1);
    }
}
