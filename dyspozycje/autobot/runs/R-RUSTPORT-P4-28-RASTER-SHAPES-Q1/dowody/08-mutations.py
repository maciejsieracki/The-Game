#!/usr/bin/env python3
"""R-RUSTPORT-P4-28 — mutation run for the raster module.

Each mutation replaces exactly one source fragment (asserted to occur once),
runs the raster test suite (lib unit tests + tests/raster_*.rs, release), and
restores the file. KILLED = the suite fails; SURVIVED = it passes.

Usage (from rust-port/renderer): python3 -I <this file> [first last]
"""
import subprocess
import sys

MUTATIONS = [
    ("M01", "src/raster/path.rs", "const CONIC_TOLERANCE: f32 = 0.25;", "const CONIC_TOLERANCE: f32 = 1.0;",
     "conic→quad tolerance 4× coarser"),
    ("M02", "src/raster/path.rs", "        if !anticlockwise && e - s >= TWO_PI_F32 {\n            e = s + TWO_PI_F32;",
     "        if !anticlockwise && e - s >= TWO_PI_F32 {\n            e = s + TWO_PI_F32 * 0.5;",
     "full circle becomes a half circle"),
    ("M03", "src/raster/path.rs", "let dist = (r * (1.0 - cosh) / sinh).abs();", "let dist = (r * (1.0 + cosh) / sinh).abs();",
     "arcTo tangent distance formula"),
    ("M04", "src/raster/path.rs", "            if scale < 1.0 {\n                r *= scale;", "            if scale < 0.0 {\n                r *= scale;",
     "roundRect radius not clamped"),
    ("M05", "src/raster/canvas.rs", "const MITER_LIMIT: f32 = 10.0;", "const MITER_LIMIT: f32 = 4.0;",
     "miter limit = tiny-skia default 4 instead of Canvas 10"),
    ("M06", "src/raster/canvas.rs", "            blend_mode: BlendMode::DestinationOut,\n            anti_alias: false,",
     "            blend_mode: BlendMode::DestinationOut,\n            anti_alias: true,",
     "clearRect anti-aliased (Chromium is not)"),
    ("M07", "src/raster/canvas.rs", "FilterQuality::Bilinear", "FilterQuality::Nearest",
     "drawImage nearest instead of bilinear"),
    ("M08", "src/raster/canvas.rs", "if self.stops.is_empty() || (self.x0 == self.x1 && self.y0 == self.y1) {",
     "if self.stops.is_empty() {", "degenerate gradient paints (should paint nothing)"),
    ("M09", "src/raster/canvas.rs", "        let user = if ctm == Affine::IDENTITY {", "        let user = if true {",
     "stroke ignores the CTM for the outline geometry"),
    ("M10", "src/raster/color.rs", "let short = |i: usize| d[i] * 17;", "let short = |i: usize| d[i] * 16;",
     "#rgb expansion ×16 instead of ×17"),
    ("M11", "src/raster/color.rs", "v.clamp(0.0, 255.0).round() as u8", "v.clamp(0.0, 255.0).floor() as u8",
     "rgb() channel floor instead of round"),
    ("M12", "src/raster/shadow.rs", "let sigma = (blur / 2.0) as f32;", "let sigma = blur as f32;",
     "shadow sigma = blur instead of blur/2"),
    ("M13", "src/raster/canvas.rs", "m.fill_path(&p, FillRule::Winding, true, Transform::identity());",
     "m.fill_path(&p, FillRule::Winding, false, Transform::identity());", "first clip not anti-aliased"),
    ("M14", "src/raster/canvas.rs", "        if let Some(s) = self.stack.pop() {\n            self.state = s;",
     "        if let Some(s) = self.stack.pop() {\n            let clip = self.state.clip.take();\n            self.state = s;\n            self.state.clip = clip;",
     "restore keeps the clip"),
    ("M15", "src/raster/path.rs", "    let dir = if cw { 1.0 } else { -1.0 };", "    let dir = 1.0;",
     "anticlockwise arcs drawn clockwise"),
    ("M16", "src/raster/canvas.rs", "            b: s,\n            c: -s,", "            b: -s,\n            c: s,",
     "rotate() direction inverted"),
    ("M17", "src/raster/canvas.rs", "let at = self.stops.partition_point(|(o, _)| *o <= offset);",
     "let at = self.stops.partition_point(|(o, _)| *o < offset);",
     "equal-offset colour stops inserted before (not after) earlier ones"),
    ("M18", "src/raster/canvas.rs", "&& (state.shadow_blur > 0.0 || state.shadow_offset_y != 0.0);",
     "&& state.shadow_blur > 0.0;", "offset-only (blur 0) shadow dropped"),
    ("M19", "src/raster/path.rs", "        if self.current.is_none() {\n            self.move_dev(p);\n            return;\n        }\n        self.segs.push(Seg::Line(p));",
     "        self.segs.push(Seg::Line(p));", "lineTo without subpath does not act as moveTo"),
    ("M20", "src/raster/canvas.rs", "            Style::Gradient(g) => g.shader(shader_ts)?,",
     "            Style::Gradient(g) => g.shader(Transform::identity())?,", "gradient ignores the CTM"),
]

CMD = ["cargo", "test", "--release", "--locked", "--no-fail-fast", "--lib", "--test", "raster_scenes", "--test", "raster_unit",
       "--test", "raster_color", "--test", "raster_api_closed"]


def main():
    lo, hi = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) == 3 else (1, len(MUTATIONS))
    killed = 0
    for mid, path, old, new, why in MUTATIONS[lo - 1:hi]:
        src = open(path).read()
        assert src.count(old) == 1, f"{mid}: fragment occurs {src.count(old)}x"
        open(path, "w").write(src.replace(old, new))
        try:
            r = subprocess.run(CMD, capture_output=True, text=True)
        finally:
            open(path, "w").write(src)
        out = r.stdout + r.stderr
        failed = [l.split()[1] for l in out.splitlines() if l.startswith("test ") and l.endswith("FAILED")]
        verdict = "KILLED" if r.returncode != 0 else "SURVIVED"
        killed += verdict == "KILLED"
        print(f"{mid} {verdict} exit={r.returncode} [{path}] {why}; failing tests: {', '.join(failed) or '-'}", flush=True)
    print(f"killed {killed}/{hi - lo + 1}")


main()
