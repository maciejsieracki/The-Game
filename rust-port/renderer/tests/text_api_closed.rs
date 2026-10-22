//! "Closed list" guard of the RR-T8b text API (R-RUSTPORT-P4-29-TEXT-FONTS-Q1;
//! the RR-T8a shapes list lives in `tests/raster_api_closed.rs`).
//!
//! The `pub fn`s of every `impl Canvas2dLite` block in `src/raster/text/`
//! must be exactly the 6 text members the web map code uses
//! (`P4-25-TEXT-RASTER-AUDIT.md` §4.1), each with a call site in pin
//! `edb8fb56`; text members the web does not use must not appear.

use std::collections::BTreeSet;

/// `(rust method, Canvas member it mirrors, web call site in pin edb8fb56)`.
const TEXT_MEMBERS: &[(&str, &str, &str)] = &[
    ("set_font", "font", "render/units.ts:6382"),
    ("set_text_align", "textAlign", "render/units.ts:6383"),
    ("set_text_baseline", "textBaseline", "render/units.ts:6384"),
    ("fill_text", "fillText", "render/units.ts:6385"),
    ("stroke_text", "strokeText", "render/unitStatPlate.ts:615"),
    (
        "measure_text",
        "measureText",
        "render/cityMapStatChip.ts:773",
    ),
];

/// Text members of `CanvasRenderingContext2D` the web does NOT use.
const FORBIDDEN: &[&str] = &[
    "set_direction",
    "set_letter_spacing",
    "set_word_spacing",
    "set_font_kerning",
    "set_font_stretch",
    "set_font_variant_caps",
    "set_text_rendering",
    "fill_text_max_width",
    "stroke_text_max_width",
];

fn text_sources() -> Vec<(String, String)> {
    let dir = format!("{}/src/raster/text", env!("CARGO_MANIFEST_DIR"));
    let mut out = Vec::new();
    for e in std::fs::read_dir(&dir).expect("text dir") {
        let p = e.expect("entry").path();
        if p.extension().and_then(|x| x.to_str()) == Some("rs") {
            let s = std::fs::read_to_string(&p).expect("read");
            out.push((p.display().to_string(), s));
        }
    }
    out
}

/// `pub fn` names inside `impl Canvas2dLite` blocks (brace-depth tracked).
fn canvas_methods(src: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut depth = 0i32;
    let mut in_canvas_impl_at: Option<i32> = None;
    for line in src.lines() {
        let t = line.trim_start();
        if t.starts_with("impl Canvas2dLite") {
            in_canvas_impl_at = Some(depth);
        }
        if let (Some(d), Some(rest)) = (in_canvas_impl_at, t.strip_prefix("pub fn ")) {
            if depth == d + 1 {
                let name: String = rest
                    .chars()
                    .take_while(|c| c.is_alphanumeric() || *c == '_')
                    .collect();
                out.push(name);
            }
        }
        for c in line.chars() {
            match c {
                '{' => depth += 1,
                '}' => {
                    depth -= 1;
                    if in_canvas_impl_at == Some(depth) {
                        in_canvas_impl_at = None;
                    }
                }
                _ => {}
            }
        }
    }
    out
}

#[test]
fn text_api_is_exactly_the_six_web_members() {
    let mut found = BTreeSet::new();
    for (path, src) in text_sources() {
        for m in canvas_methods(&src) {
            assert!(found.insert(m.clone()), "{path}: duplicate {m}");
        }
    }
    let want: BTreeSet<String> = TEXT_MEMBERS
        .iter()
        .map(|(r, _, _)| (*r).to_owned())
        .collect();
    assert_eq!(found, want);
    assert_eq!(TEXT_MEMBERS.len(), 6, "P4-25 §4.1 lists 6 text members");
}

#[test]
fn unused_text_members_are_not_implemented() {
    for (path, src) in text_sources() {
        for f in FORBIDDEN {
            assert!(
                !src.contains(&format!("fn {f}(")),
                "{path}: {f} must not exist"
            );
        }
    }
}

#[test]
fn shapes_file_gained_no_public_method() {
    // RR-T8b only adds crate-private hooks to canvas.rs; its public surface
    // stays the RR-T8a list (checked in detail by raster_api_closed.rs).
    let src = std::fs::read_to_string(format!(
        "{}/src/raster/canvas.rs",
        env!("CARGO_MANIFEST_DIR")
    ))
    .expect("canvas.rs");
    for (r, _, _) in TEXT_MEMBERS {
        assert!(!src.contains(&format!("fn {r}(")), "canvas.rs defines {r}");
    }
}
