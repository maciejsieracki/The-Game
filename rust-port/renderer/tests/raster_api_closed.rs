//! "Closed list" guard of the RR-T8a API (R-RUSTPORT-P4-28-RASTER-SHAPES-Q1,
//! P4-25 §6 "test «lista wywołań §4.1 zamknięta»").
//!
//! The public methods of `raster::{Canvas2dLite, CanvasGradient, RasterImage}`
//! are read from the source and must equal the list below: every Canvas 2D
//! member the web map code uses for shapes (P4-25 §4.1, 28 of 34 members;
//! the 6 text members are RR-T8b) plus a few non-Canvas helpers. Members the
//! web does not use must not appear.

use std::collections::BTreeSet;

/// `(rust method, Canvas member it mirrors, web call site in pin edb8fb56)`.
const CANVAS_MEMBERS: &[(&str, &str, &str)] = &[
    ("begin_path", "beginPath", "render/units.ts:6330"),
    ("move_to", "moveTo", "render/unitStatPlate.ts:320"),
    ("line_to", "lineTo", "render/cityMapStatChip.ts:415"),
    ("arc", "arc", "render/units.ts:6331"),
    ("arc_to", "arcTo", "render/unitStatPlate.ts:321"),
    (
        "quadratic_curve_to",
        "quadraticCurveTo",
        "render/cityMapStatChip.ts:416",
    ),
    ("close_path", "closePath", "render/unitStatPlate.ts:325"),
    ("round_rect", "roundRect", "render/units.ts:6590"),
    ("fill", "fill", "render/units.ts:6333"),
    ("stroke", "stroke", "render/units.ts:6346"),
    ("fill_rect", "fillRect", "render/units.ts:6353"),
    ("stroke_rect", "strokeRect", "battle/battleScene.ts:18656"),
    ("clear_rect", "clearRect", "render/units.ts:6324"),
    ("set_line_width", "lineWidth", "render/units.ts:6345"),
    ("set_line_join", "lineJoin", "render/unitStatPlate.ts:612"),
    (
        "set_fill_style",
        "fillStyle = <css>",
        "render/units.ts:6332",
    ),
    (
        "set_fill_style_gradient",
        "fillStyle = <gradient>",
        "render/cityMapStatChip.ts:859",
    ),
    (
        "set_stroke_style",
        "strokeStyle = <css>",
        "render/units.ts:6344",
    ),
    (
        "create_linear_gradient",
        "createLinearGradient",
        "render/cityMapStatChip.ts:856",
    ),
    ("save", "save", "render/units.ts:6349"),
    ("restore", "restore", "render/units.ts:6354"),
    ("translate", "translate", "render/units.ts:6350"),
    ("rotate", "rotate", "render/units.ts:6351"),
    (
        "set_transform",
        "setTransform",
        "render/cityMapStatChip.ts:851",
    ),
    ("clip", "clip", "render/unitOwnerEmblem.ts:273"),
    (
        "set_shadow_color",
        "shadowColor",
        "render/cityOkolicaOverlay.ts:175",
    ),
    (
        "set_shadow_blur",
        "shadowBlur",
        "render/cityOkolicaOverlay.ts:176",
    ),
    (
        "set_shadow_offset_y",
        "shadowOffsetY",
        "render/cityOkolicaOverlay.ts:177",
    ),
    ("draw_image", "drawImage", "render/unitOwnerEmblem.ts:279"),
];

/// Non-Canvas helpers on `Canvas2dLite` (construction and read-back).
const CANVAS_HELPERS: &[&str] = &[
    "new",
    "width",
    "height",
    "pixels_premultiplied",
    "to_rgba8_straight",
    "rgba_hash",
];

const GRADIENT_METHODS: &[&str] = &["add_color_stop"];
const IMAGE_METHODS: &[&str] = &["from_straight_rgba8", "from_canvas", "width", "height"];

/// Canvas members the web does NOT use (P4-25 §4.1 "Nieużywane" + members
/// the dispatch named but the pin does not call). None may be implemented.
const FORBIDDEN: &[&str] = &[
    "set_global_alpha",
    "set_global_composite_operation",
    "set_line_dash",
    "bezier_curve_to",
    "ellipse",
    "create_radial_gradient",
    "create_conic_gradient",
    "create_pattern",
    "set_filter",
    "set_image_smoothing_enabled",
    "set_image_smoothing_quality",
    "set_letter_spacing",
    "set_font_kerning",
    "get_image_data",
    "put_image_data",
    "scale",
    "set_line_cap",
    "set_miter_limit",
    "set_shadow_offset_x",
    "transform",
    "reset_transform",
    "rect",
    "is_point_in_path",
    // strokeStyle is only ever assigned CSS strings in the pin (P4-28 §4).
    "set_stroke_style_gradient",
];

/// `pub fn` names per `impl <Type>` block of a source file.
fn pub_fns(src: &str) -> Vec<(String, String)> {
    let mut out = Vec::new();
    let mut current = String::new();
    for line in src.lines() {
        let t = line.trim_start();
        if let Some(rest) = t.strip_prefix("impl ") {
            current = rest.split([' ', '{', '<']).next().unwrap_or("").to_owned();
        }
        if let Some(rest) = t.strip_prefix("pub fn ") {
            let name: String = rest
                .chars()
                .take_while(|c| c.is_alphanumeric() || *c == '_')
                .collect();
            out.push((current.clone(), name));
        }
    }
    out
}

fn src(file: &str) -> String {
    let path = format!("{}/src/raster/{file}", env!("CARGO_MANIFEST_DIR"));
    std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"))
}

fn methods_of(fns: &[(String, String)], ty: &str) -> BTreeSet<String> {
    fns.iter()
        .filter(|(t, _)| t == ty)
        .map(|(_, n)| n.clone())
        .collect()
}

#[test]
fn canvas_api_is_exactly_the_web_subset() {
    let fns = pub_fns(&src("canvas.rs"));
    let got = methods_of(&fns, "Canvas2dLite");
    let want: BTreeSet<String> = CANVAS_MEMBERS
        .iter()
        .map(|(r, _, _)| (*r).to_owned())
        .chain(CANVAS_HELPERS.iter().map(|s| (*s).to_owned()))
        .collect();
    assert_eq!(got, want, "Canvas2dLite public methods");
    assert_eq!(
        methods_of(&fns, "CanvasGradient"),
        GRADIENT_METHODS.iter().map(|s| (*s).to_owned()).collect()
    );
    assert_eq!(
        methods_of(&fns, "RasterImage"),
        IMAGE_METHODS.iter().map(|s| (*s).to_owned()).collect()
    );
}

#[test]
fn all_28_shape_members_of_p4_25_are_covered() {
    // 34 members in P4-25 §4.1 minus 6 text members (font, textAlign,
    // textBaseline, fillText, strokeText, measureText) = 28.
    let members: BTreeSet<&str> = CANVAS_MEMBERS
        .iter()
        .map(|(_, m, _)| m.split(' ').next().unwrap_or(m))
        .collect();
    assert_eq!(members.len(), 28, "{members:?}");
}

#[test]
fn unused_canvas_members_are_not_implemented() {
    for file in [
        "canvas.rs",
        "color.rs",
        "path.rs",
        "shadow.rs",
        "metric.rs",
        "mod.rs",
    ] {
        for (ty, name) in pub_fns(&src(file)) {
            assert!(
                !FORBIDDEN.contains(&name.as_str()),
                "{file}: {ty}::{name} is outside the web subset"
            );
        }
    }
}
