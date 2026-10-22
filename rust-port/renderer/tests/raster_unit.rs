//! Structural known-pixel tests of `raster::Canvas2dLite`
//! (R-RUSTPORT-P4-28-RASTER-SHAPES-Q1): full fills, anti-aliased edges of
//! known coverage, gradients at control points, clip, transforms, joins,
//! shadows, `drawImage`, error cases.

use std::f64::consts::{PI, TAU};

use civ_renderer::raster::{Canvas2dLite, RasterError, RasterImage};

fn px(c: &Canvas2dLite, x: u32, y: u32) -> [u8; 4] {
    let i = ((y * c.width() + x) * 4) as usize;
    let p = c.pixels_premultiplied();
    [p[i], p[i + 1], p[i + 2], p[i + 3]]
}

fn alpha_sum(c: &Canvas2dLite) -> f64 {
    c.pixels_premultiplied()
        .chunks_exact(4)
        .map(|p| f64::from(p[3]) / 255.0)
        .sum()
}

fn canvas(w: u32, h: u32) -> Canvas2dLite {
    Canvas2dLite::new(w, h).expect("size")
}

#[test]
fn zero_size_canvas_is_an_error() {
    assert_eq!(
        Canvas2dLite::new(0, 4).err(),
        Some(RasterError::InvalidSize)
    );
}

#[test]
fn integer_fill_rect_is_exact() {
    let mut c = canvas(8, 8);
    c.set_fill_style("#336699");
    c.fill_rect(2.0, 3.0, 4.0, 2.0);
    for y in 0..8 {
        for x in 0..8 {
            let inside = (2..6).contains(&x) && (3..5).contains(&y);
            let want = if inside {
                [0x33, 0x66, 0x99, 255]
            } else {
                [0; 4]
            };
            assert_eq!(px(&c, x, y), want, "({x},{y})");
        }
    }
}

#[test]
fn default_fill_style_is_opaque_black() {
    let mut c = canvas(2, 2);
    c.fill_rect(0.0, 0.0, 2.0, 2.0);
    assert_eq!(px(&c, 1, 1), [0, 0, 0, 255]);
}

#[test]
fn antialiased_vertical_edge_has_known_coverage() {
    // Left edge at x = 1.25 → pixel 1 is 75 % covered, right edge at 3.5 →
    // pixel 3 is 50 % covered.
    let mut c = canvas(5, 1);
    c.set_fill_style("#ffffff");
    c.fill_rect(1.25, 0.0, 2.25, 1.0);
    let a: Vec<u8> = (0..5).map(|x| px(&c, x, 0)[3]).collect();
    assert_eq!(a[0], 0);
    assert!((190..=192).contains(&a[1]), "75 %: {}", a[1]);
    assert_eq!(a[2], 255);
    assert!((127..=128).contains(&a[3]), "50 %: {}", a[3]);
    assert_eq!(a[4], 0);
}

#[test]
fn circle_area_matches_pi_r_squared() {
    let mut c = canvas(64, 64);
    c.begin_path();
    c.arc(32.0, 32.0, 20.0, 0.0, TAU, false).expect("arc");
    c.fill();
    let area = alpha_sum(&c);
    let want = PI * 400.0;
    // Curves reach the scan converter as chords of quads, so the AA area is a
    // little below πr² (Chromium too: same mass ±0.5 % on the T-scenes,
    // P4-28 §5.3). A radius error of 0.5 px would already be −5 %.
    assert!((area - want).abs() / want < 0.01, "area {area} vs {want}");
    assert_eq!(px(&c, 32, 32)[3], 255);
    assert_eq!(px(&c, 2, 2)[3], 0);
}

#[test]
fn path_survives_fill_and_overlapping_fills_accumulate() {
    let mut c = canvas(4, 4);
    c.set_fill_style("rgba(0,0,0,0.5)");
    c.begin_path();
    c.move_to(0.0, 0.0);
    c.line_to(4.0, 0.0);
    c.line_to(4.0, 4.0);
    c.line_to(0.0, 4.0);
    c.close_path();
    c.fill();
    let once = px(&c, 2, 2)[3];
    c.fill();
    let twice = px(&c, 2, 2)[3];
    assert!((127..=128).contains(&once), "{once}");
    // 1 - (1 - 0.5)^2 = 0.75
    assert!((190..=192).contains(&twice), "{twice}");
}

#[test]
fn begin_path_clears_the_path() {
    let mut c = canvas(4, 4);
    c.move_to(0.0, 0.0);
    c.line_to(4.0, 0.0);
    c.line_to(4.0, 4.0);
    c.begin_path();
    c.fill();
    assert!(c.pixels_premultiplied().iter().all(|&b| b == 0));
}

#[test]
fn vertical_gradient_hits_control_points() {
    let mut c = canvas(1, 256);
    let mut g = c.create_linear_gradient(0.0, 0.0, 0.0, 256.0);
    g.add_color_stop(0.0, "#000000").expect("stop");
    g.add_color_stop(0.5, "#ff0000").expect("stop");
    g.add_color_stop(1.0, "#ffffff").expect("stop");
    c.set_fill_style_gradient(&g);
    c.fill_rect(0.0, 0.0, 1.0, 256.0);
    // Pixel centre y + 0.5 → t = (y + 0.5) / 256.
    let r = |y| px(&c, 0, y)[0];
    let gch = |y| px(&c, 0, y)[1];
    assert!(r(0) <= 2, "{}", r(0));
    assert!(r(127) >= 252 && gch(127) <= 2, "{:?}", px(&c, 0, 127));
    assert!(r(64) >= 126 && r(64) <= 129, "{}", r(64));
    assert!(gch(255) >= 252, "{:?}", px(&c, 0, 255));
    assert!(c
        .pixels_premultiplied()
        .chunks_exact(4)
        .all(|p| p[3] == 255));
}

#[test]
fn gradient_follows_the_ctm_at_paint_time() {
    // createLinearGradient(0,0,0,10) under scale 2 spans device rows 0..20.
    let mut c = canvas(1, 20);
    let mut g = c.create_linear_gradient(0.0, 0.0, 0.0, 10.0);
    g.add_color_stop(0.0, "#000").expect("stop");
    g.add_color_stop(1.0, "#fff").expect("stop");
    c.set_transform(2.0, 0.0, 0.0, 2.0, 0.0, 0.0);
    c.set_fill_style_gradient(&g);
    c.fill_rect(0.0, 0.0, 1.0, 10.0);
    let mid = px(&c, 0, 10)[0];
    assert!((125..=136).contains(&mid), "{mid}");
}

#[test]
fn degenerate_gradients_paint_nothing() {
    let mut c = canvas(4, 4);
    let mut g = c.create_linear_gradient(1.0, 1.0, 1.0, 1.0);
    g.add_color_stop(0.0, "#fff").expect("stop");
    c.set_fill_style_gradient(&g);
    c.fill_rect(0.0, 0.0, 4.0, 4.0);
    let empty = c.create_linear_gradient(0.0, 0.0, 4.0, 0.0);
    c.set_fill_style_gradient(&empty);
    c.fill_rect(0.0, 0.0, 4.0, 4.0);
    assert!(c.pixels_premultiplied().iter().all(|&b| b == 0));
}

#[test]
fn color_stop_errors() {
    let c = canvas(1, 1);
    let mut g = c.create_linear_gradient(0.0, 0.0, 1.0, 0.0);
    assert_eq!(g.add_color_stop(1.5, "#fff"), Err(RasterError::IndexSize));
    assert_eq!(
        g.add_color_stop(f64::NAN, "#fff"),
        Err(RasterError::IndexSize)
    );
    assert_eq!(g.add_color_stop(0.5, "bogus"), Err(RasterError::Syntax));
}

#[test]
fn clip_limits_drawing_and_restore_removes_it() {
    let mut c = canvas(32, 32);
    c.save();
    c.begin_path();
    c.arc(16.0, 16.0, 8.0, 0.0, TAU, false).expect("arc");
    c.clip();
    c.set_fill_style("#00ff00");
    c.fill_rect(0.0, 0.0, 32.0, 32.0);
    assert_eq!(px(&c, 16, 16), [0, 255, 0, 255]);
    assert_eq!(px(&c, 2, 2), [0; 4]);
    let area = alpha_sum(&c);
    assert!(
        (area - PI * 64.0).abs() / (PI * 64.0) < 0.03,
        "clip area {area}"
    );
    c.restore(); // also restores fillStyle (set after save) to black
    c.fill_rect(0.0, 0.0, 4.0, 4.0);
    assert_eq!(px(&c, 2, 2), [0, 0, 0, 255]);
}

#[test]
fn empty_clip_path_clips_everything() {
    let mut c = canvas(4, 4);
    c.begin_path();
    c.clip();
    c.fill_rect(0.0, 0.0, 4.0, 4.0);
    assert!(c.pixels_premultiplied().iter().all(|&b| b == 0));
}

#[test]
fn clear_rect_respects_clip() {
    let mut c = canvas(8, 1);
    c.set_fill_style("#fff");
    c.fill_rect(0.0, 0.0, 8.0, 1.0);
    c.begin_path();
    c.move_to(0.0, 0.0);
    c.line_to(4.0, 0.0);
    c.line_to(4.0, 1.0);
    c.line_to(0.0, 1.0);
    c.clip();
    c.clear_rect(0.0, 0.0, 8.0, 1.0);
    assert_eq!(px(&c, 1, 0)[3], 0);
    assert_eq!(px(&c, 6, 0)[3], 255);
}

#[test]
fn translate_rotate_and_set_transform() {
    let mut c = canvas(16, 16);
    c.translate(10.0, 10.0);
    c.fill_rect(0.0, 0.0, 2.0, 2.0);
    assert_eq!(px(&c, 10, 10)[3], 255);
    assert_eq!(px(&c, 11, 11)[3], 255);
    assert_eq!(px(&c, 9, 9)[3], 0);
    // rotate(π/2) about (10,10): +x → +y, so (0..2, -2..0) maps to x 10..12, y 10..12 again.
    let mut r = canvas(16, 16);
    r.translate(10.0, 10.0);
    r.rotate(PI / 2.0);
    r.fill_rect(0.0, -2.0, 2.0, 2.0);
    assert_eq!(px(&r, 10, 10)[3], 255, "rotated");
    assert_eq!(px(&r, 11, 11)[3], 255, "rotated");
    assert_eq!(px(&r, 8, 8)[3], 0, "rotated");
    let mut s = canvas(16, 16);
    s.translate(5.0, 5.0);
    s.set_transform(2.0, 0.0, 0.0, 2.0, 0.0, 0.0); // replaces, not multiplies
    s.fill_rect(1.0, 1.0, 1.0, 1.0);
    assert_eq!(px(&s, 2, 2)[3], 255);
    assert_eq!(px(&s, 3, 3)[3], 255);
    assert_eq!(px(&s, 4, 4)[3], 0);
    assert_eq!(px(&s, 7, 7)[3], 0);
}

#[test]
fn save_restore_restores_style_and_transform() {
    let mut c = canvas(4, 1);
    c.set_fill_style("#ff0000");
    c.save();
    c.set_fill_style("#0000ff");
    c.translate(2.0, 0.0);
    c.restore();
    c.fill_rect(0.0, 0.0, 1.0, 1.0);
    assert_eq!(px(&c, 0, 0), [255, 0, 0, 255]);
    c.restore(); // empty stack: no-op
}

#[test]
fn stroke_rect_one_pixel_on_half_pixels() {
    let mut c = canvas(16, 16);
    c.set_stroke_style("#ffffff");
    c.stroke_rect(2.5, 2.5, 10.0, 10.0);
    assert_eq!(px(&c, 7, 2)[3], 255, "top edge");
    assert_eq!(px(&c, 2, 7)[3], 255, "left edge");
    // A 1 px stroke is a Skia/tiny-skia AA hairline (no joins): the corner
    // pixel is only partly covered (Chromium: scene h1_battle_minimap).
    assert!(px(&c, 12, 12)[3] >= 128, "corner");
    assert_eq!(px(&c, 7, 7)[3], 0, "interior");
    assert_eq!(px(&c, 7, 1)[3], 0, "outside");
}

#[test]
fn line_width_is_ignored_when_not_positive() {
    let mut c = canvas(16, 16);
    c.set_line_width(4.0);
    c.set_line_width(0.0);
    c.set_line_width(-1.0);
    c.set_line_width(f64::NAN);
    c.begin_path();
    c.move_to(0.0, 8.0);
    c.line_to(16.0, 8.0);
    c.stroke();
    // 4 px wide line centred on y = 8 covers rows 6..10.
    assert_eq!(px(&c, 8, 6)[3], 255);
    assert_eq!(px(&c, 8, 9)[3], 255);
    assert_eq!(px(&c, 8, 5)[3], 0);
}

fn corner(join: &str) -> Canvas2dLite {
    let mut c = canvas(40, 40);
    assert!(c.set_line_join(join));
    c.set_line_width(10.0);
    c.begin_path();
    c.move_to(5.0, 30.0);
    c.line_to(30.0, 30.0);
    c.line_to(30.0, 5.0);
    c.stroke();
    c
}

#[test]
fn line_joins_differ_only_at_the_outer_corner() {
    let miter = corner("miter");
    let round = corner("round");
    let bevel = corner("bevel");
    // The miter fills the square corner (34,34); bevel cuts it; round is between.
    assert_eq!(px(&miter, 34, 34)[3], 255);
    assert_eq!(px(&bevel, 34, 34)[3], 0);
    assert!(px(&round, 34, 34)[3] < 255);
    assert!(alpha_sum(&miter) > alpha_sum(&round));
    assert!(alpha_sum(&round) > alpha_sum(&bevel));
    let mut c = canvas(1, 1);
    assert!(!c.set_line_join("square"));
}

#[test]
fn miter_limit_ten_bevels_sharp_angles() {
    // Angle ≈ 5.7°: miter length / width = 1 / sin(θ/2) ≈ 20 > 10 → bevel.
    let mut c = canvas(200, 40);
    c.set_line_width(4.0);
    c.begin_path();
    c.move_to(10.0, 10.0);
    c.line_to(110.0, 20.0);
    c.line_to(10.0, 30.0);
    c.stroke();
    // A miter tip would reach x ≈ 110 + 2·20 = 150.
    for x in 116..200 {
        for y in 0..40 {
            assert_eq!(px(&c, x, y)[3], 0, "({x},{y})");
        }
    }
}

#[test]
fn miter_limit_ten_keeps_a_20_degree_miter() {
    // Angle 20°: miter ratio 1 / sin(10°) ≈ 5.76 — between tiny-skia's
    // default limit 4 (would bevel) and the Canvas default 10 (miter).
    // Tip = 100 + (4 / 2) · 5.76 ≈ 111.5 on the bisector y = 30.
    let mut c = canvas(128, 60);
    c.set_line_width(4.0);
    c.begin_path();
    c.move_to(21.215_5, 16.108_0);
    c.line_to(100.0, 30.0);
    c.line_to(21.215_5, 43.892_0);
    c.stroke();
    // A bevel would end at x ≈ 100.35; the miter wedge is ≈ 2.6 px wide at 104.
    assert!(
        px(&c, 104, 30)[3] > 200,
        "miter tip present: {:?}",
        px(&c, 104, 30)
    );
    assert!(px(&c, 109, 30)[3] > 0, "miter tip reaches past 109");
    assert_eq!(px(&c, 114, 30)[3], 0, "tip ends before 112");
}

#[test]
fn round_rect_radius_is_clamped_to_half_side() {
    let mut c = canvas(20, 20);
    c.begin_path();
    c.round_rect(0.0, 0.0, 20.0, 20.0, 100.0)
        .expect("roundRect");
    c.fill();
    let area = alpha_sum(&c);
    assert!(
        (area - PI * 100.0).abs() / (PI * 100.0) < 0.03,
        "area {area}"
    );
    assert_eq!(
        c.round_rect(0.0, 0.0, 1.0, 1.0, -1.0),
        Err(RasterError::IndexSize)
    );
}

#[test]
fn negative_radii_are_errors() {
    let mut c = canvas(4, 4);
    assert_eq!(
        c.arc(1.0, 1.0, -1.0, 0.0, 1.0, false),
        Err(RasterError::IndexSize)
    );
    assert_eq!(
        c.arc_to(0.0, 0.0, 1.0, 1.0, -1.0),
        Err(RasterError::IndexSize)
    );
}

#[test]
fn arc_to_corner_matches_quarter_circle() {
    // Square 20×20 with r = 10 corners at all four = circle of r 10.
    let mut c = canvas(20, 20);
    c.begin_path();
    c.move_to(10.0, 0.0);
    c.arc_to(20.0, 0.0, 20.0, 20.0, 10.0).expect("arcTo");
    c.arc_to(20.0, 20.0, 0.0, 20.0, 10.0).expect("arcTo");
    c.arc_to(0.0, 20.0, 0.0, 0.0, 10.0).expect("arcTo");
    c.arc_to(0.0, 0.0, 20.0, 0.0, 10.0).expect("arcTo");
    c.close_path();
    c.fill();
    let area = alpha_sum(&c);
    assert!(
        (area - PI * 100.0).abs() / (PI * 100.0) < 0.03,
        "area {area}"
    );
}

#[test]
fn quadratic_curve_without_subpath_starts_at_control_point() {
    let mut c = canvas(20, 20);
    c.begin_path();
    c.quadratic_curve_to(0.0, 0.0, 20.0, 0.0);
    c.line_to(20.0, 20.0);
    c.line_to(0.0, 20.0);
    c.close_path();
    c.fill();
    // The subpath starts at (0,0) → full square.
    assert!((alpha_sum(&c) - 400.0).abs() < 1.0);
}

#[test]
fn shadow_is_drawn_below_and_offset() {
    let mut c = canvas(20, 30);
    c.set_shadow_color("rgba(0,0,255,1)");
    c.set_shadow_offset_y(10.0);
    c.set_fill_style("#ff0000");
    c.fill_rect(5.0, 5.0, 10.0, 10.0);
    assert_eq!(px(&c, 10, 10), [255, 0, 0, 255], "shape on top");
    assert_eq!(px(&c, 10, 20), [0, 0, 255, 255], "hard shadow (blur 0)");
    assert_eq!(px(&c, 10, 27), [0; 4]);
    // Transparent shadow colour → no shadow.
    let mut d = canvas(20, 30);
    d.set_shadow_offset_y(10.0);
    d.fill_rect(5.0, 5.0, 10.0, 10.0);
    assert_eq!(px(&d, 10, 20), [0; 4]);
}

#[test]
fn shadow_blur_spreads_and_conserves_mass() {
    let mut c = canvas(40, 40);
    c.set_shadow_color("#000");
    c.set_shadow_blur(4.0);
    c.set_shadow_offset_y(0.0);
    c.set_fill_style("rgba(0,0,0,0)");
    c.fill_rect(15.0, 15.0, 10.0, 10.0);
    // The transparent shape casts no shadow (alpha source); now opaque:
    assert!(c.pixels_premultiplied().iter().all(|&b| b == 0));
    c.set_fill_style("#fff");
    c.fill_rect(15.0, 15.0, 10.0, 10.0);
    // Blurred shadow leaks outside the 10×10 square, mass ≈ 100.
    assert!(px(&c, 13, 20)[3] > 0, "blur halo");
    let outside: f64 = (0..40)
        .flat_map(|y| (0..40).map(move |x| (x, y)))
        .filter(|&(x, y)| !(15..25).contains(&x) || !(15..25).contains(&y))
        .map(|(x, y)| f64::from(px(&c, x, y)[3]) / 255.0)
        .sum();
    assert!(outside > 10.0 && outside < 60.0, "halo mass {outside}");
}

#[test]
fn draw_image_copies_and_scales() {
    let img =
        RasterImage::from_straight_rgba8(2, 1, &[255, 0, 0, 255, 0, 0, 255, 128]).expect("image");
    assert_eq!((img.width(), img.height()), (2, 1));
    let mut c = canvas(6, 2);
    c.draw_image(&img, 1.0, 0.0, 2.0, 1.0);
    assert_eq!(px(&c, 1, 0), [255, 0, 0, 255]);
    assert_eq!(px(&c, 2, 0), [0, 0, 128, 128]);
    assert_eq!(px(&c, 0, 0), [0; 4]);
    assert_eq!(px(&c, 1, 1), [0; 4]);
    // Negative size is normalised (no flip): same pixels at dx-2.
    let mut d = canvas(6, 2);
    d.draw_image(&img, 3.0, 0.0, -2.0, 1.0);
    assert_eq!(px(&d, 1, 0), [255, 0, 0, 255]);
    assert!(RasterImage::from_straight_rgba8(2, 2, &[0; 4]).is_err());
}

#[test]
fn straight_output_unpremultiplies() {
    let mut c = canvas(1, 1);
    c.set_fill_style("rgba(255,0,0,0.5)");
    c.fill_rect(0.0, 0.0, 1.0, 1.0);
    let s = c.to_rgba8_straight();
    assert_eq!(s[0], 255);
    assert_eq!(s[1], 0);
    assert!((127..=128).contains(&s[3]));
}

#[test]
fn non_finite_arguments_are_ignored() {
    let mut c = canvas(4, 4);
    c.fill_rect(f64::NAN, 0.0, 4.0, 4.0);
    c.translate(f64::INFINITY, 0.0);
    c.rotate(f64::NAN);
    c.set_transform(1.0, 0.0, 0.0, 1.0, f64::NAN, 0.0);
    c.fill_rect(0.0, 0.0, 1.0, 1.0);
    assert_eq!(px(&c, 0, 0)[3], 255);
    assert_eq!(px(&c, 1, 1)[3], 0);
}

#[test]
fn line_to_without_subpath_acts_as_move_to() {
    // Spec: lineTo with no subpath = moveTo. The polygon is then the
    // triangle (2,6) (12,2) (12,12) of area 50; anchored at (0,0) it would be 26.
    let mut c = canvas(16, 16);
    c.begin_path();
    c.line_to(2.0, 6.0);
    c.line_to(12.0, 2.0);
    c.line_to(12.0, 12.0);
    c.fill();
    // AA chords lose ~2 % of the mass on diagonals (see circle tests).
    assert!((alpha_sum(&c) - 50.0).abs() < 2.0, "{}", alpha_sum(&c));
}

#[test]
fn equal_offset_stops_keep_insertion_order() {
    // Hard stop at 0.5: red first, then blue (spec: same offset → order added).
    let mut c = canvas(16, 1);
    let mut g = c.create_linear_gradient(0.0, 0.0, 16.0, 0.0);
    g.add_color_stop(0.5, "#ff0000").expect("stop");
    g.add_color_stop(0.5, "#0000ff").expect("stop");
    c.set_fill_style_gradient(&g);
    c.fill_rect(0.0, 0.0, 16.0, 1.0);
    assert_eq!(px(&c, 2, 0), [255, 0, 0, 255]);
    assert_eq!(px(&c, 13, 0), [0, 0, 255, 255]);
}
