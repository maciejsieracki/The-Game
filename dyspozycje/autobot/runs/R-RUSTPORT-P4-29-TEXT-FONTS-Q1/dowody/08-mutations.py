#!/usr/bin/env python3
"""R-RUSTPORT-P4-29-TEXT-FONTS-Q1 — mutation run for raster::text (RR-T8b).

Each mutation replaces ONE fragment (asserted to occur exactly once) in one
file, runs the text tests (lib `raster::text` + tests/text_*.rs), records
KILLED/SURVIVED with the names of failing tests, and restores the file.
Run from rust-port/renderer:  python3 <this file>
"""
import re
import subprocess
import sys

M = [
    ("M01", "src/raster/text/mod.rs", "no word-by-word shaping (kerning across spaces)",
     "Some((f, s)) if *f == face && !space && !prev_space => s.push(c),",
     "Some((f, s)) if *f == face => s.push(c),"),
    ("M02", "src/raster/text/mod.rs", "em-box ascent not rounded to 1/64 px",
     "(v * 64.0).round() / 64.0", "v"),
    ("M03", "src/raster/text/mod.rs", "middle baseline = em ascent - size/3",
     "TextBaseline::Middle => em_ascent - size / 2.0,", "TextBaseline::Middle => em_ascent - size / 3.0,"),
    ("M04", "src/raster/text/mod.rs", "hanging baseline kept in f64 (Chromium: float)",
     "TextBaseline::Hanging => f64::from((0.8 * ascent) as f32),", "TextBaseline::Hanging => 0.8 * ascent,"),
    ("M05", "src/raster/text/mod.rs", "textAlign center shifts by the full width",
     "TextAlign::Center => -shaped.width / 2.0,", "TextAlign::Center => -shaped.width,"),
    ("M06", "src/raster/text/mod.rs", "glyph origin y not snapped to whole pixels",
     "ody = (ody + 0.5).floor();", "ody += 0.0;"),
    ("M07", "src/raster/text/mod.rs", "glyph origin x snapped to 1/2 px instead of 1/4 px",
     "odx = (odx * 4.0 + 0.5).floor() / 4.0;", "odx = (odx * 2.0 + 0.5).floor() / 2.0;"),
    ("M08", "src/raster/text/mod.rs", "advance scale = PxScale height (ascent-descent) instead of em",
     "let k = spec.size_px / lf.upem;\n        let mut buf",
     "let k = spec.size_px / (lf.hhea_ascent + lf.hhea_descent);\n        let mut buf"),
    ("M09", "src/raster/text/mod.rs", "shaping without the kern feature (no GPOS kerning)",
     "let out = rustybuzz::shape(&lf.hb, &[], buf);",
     "let out = rustybuzz::shape(&lf.hb, &[rustybuzz::Feature::new(rustybuzz::ttf_parser::Tag::from_bytes(b\"kern\"), 0, ..)], buf);"),
    ("M10", "src/raster/text/mod.rs", "per-glyph fallback disabled (always the primary face)",
     ".find(|f| fonts::loaded(*f).glyph(c).is_some())", ".find(|_| false)"),
    ("M11", "src/raster/text/mod.rs", "tab not replaced by a space",
     "'\\t' | '\\n' | '\\u{0C}' | '\\r' => ' ',", "'\\n' | '\\u{0C}' | '\\r' => ' ',"),
    ("M12", "src/raster/text/mod.rs", "truncateName measures without the ellipsis",
     "    let mut s: Vec<u16> = name.encode_utf16().collect();\n    while s.len() > 1 && ctx.measure_text(&(utf16_lossy(&s) + \"…\")).width > max_w {",
     "    let mut s: Vec<u16> = name.encode_utf16().collect();\n    while s.len() > 1 && ctx.measure_text(&utf16_lossy(&s)).width > max_w {"),
    ("M13", "src/raster/text/fonts.rs", "weight 500 selects Bold",
     "let bold = weight > 500;", "let bold = weight >= 500;"),
    ("M14", "src/raster/text/fonts.rs", "sans-serif mapped to DejaVu Sans",
     "FamilyName::SansSerif => Some(BundledFamily::LiberationSans),", "FamilyName::SansSerif => Some(BundledFamily::DejaVuSans),"),
    ("M15", "src/raster/text/font.rs", "bold = 600",
     "\"bold\" | \"bolder\" => 700,", "\"bold\" | \"bolder\" => 600,"),
    ("M16", "src/raster/text/font.rs", "em relative to 16px",
     "\"em\" => 10.0,", "\"em\" => 16.0,"),
    ("M17", "src/raster/canvas.rs", "fillText painted with the stroke style",
     "    pub(crate) fn fill_device_path(&mut self, path: tiny_skia::Path) {\n        let Some(paint) = self.paint(true,",
     "    pub(crate) fn fill_device_path(&mut self, path: tiny_skia::Path) {\n        let Some(paint) = self.paint(false,"),
    ("M18", "src/raster/text/mod.rs", "ideographic baseline sign flipped",
     "TextBaseline::Ideographic => -descent,", "TextBaseline::Ideographic => descent,"),
    ("M19", "src/raster/text/mod.rs", "glyph outline y not flipped (font y-up kept)",
     "-f64::from(p.y) * k);", "f64::from(p.y) * k);"),
    ("M20", "src/raster/text/mod.rs", "origin snapping also under rotation",
     "let snap = ctm.is_axis_aligned();", "let snap = true;"),
    ("M21", "src/raster/text/mod.rs", "invalid font resets to the default instead of keeping the value",
     "            None => false,\n        }\n    }\n\n    /// `ctx.textAlign",
     "            None => {\n                self.text_state_mut().font = FontSpec::default();\n                false\n            }\n        }\n    }\n\n    /// `ctx.textAlign"),
    ("M22", "src/raster/text/mod.rs", "bottom baseline = -em ascent",
     "TextBaseline::Bottom => em_ascent - size,", "TextBaseline::Bottom => -em_ascent,"),
    ("M23", "src/raster/canvas.rs", "text state not part of save/restore (restore keeps current text state)",
     "        if let Some(s) = self.stack.pop() {\n            self.state = s;\n        }",
     "        if let Some(s) = self.stack.pop() {\n            let t = self.state.text.clone();\n            self.state = s;\n            self.state.text = t;\n        }"),
]

TESTS = ["--test", "text_api_closed", "--test", "text_fonts", "--test", "text_metrics",
         "--test", "text_scenes", "--test", "text_upper"]


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    return p.returncode, p.stdout + p.stderr


killed = 0
for mid, path, desc, old, new in M:
    src = open(path, encoding="utf-8").read()
    n = src.count(old)
    if n != 1:
        print(f"{mid} BAD-PATTERN count={n} {path}: {desc}")
        sys.exit(2)
    open(path, "w", encoding="utf-8").write(src.replace(old, new))
    try:
        rc1, out1 = run(["cargo", "test", "--lib", "raster::text", "-q"])
        rc2, out2 = run(["cargo", "test", "-q"] + TESTS)
        out = out1 + out2
        if "error[" in out and "could not compile" in out:
            status = "COMPILE-ERROR"
        elif rc1 != 0 or rc2 != 0:
            status = "KILLED"
            killed += 1
        else:
            status = "SURVIVED"
        failing = sorted(set(re.findall(r"^\s{4}(\S+)$", out, re.M)))
        failing = [f for f in failing if not f.startswith("-")]
        print(f"{mid} | {path} | {desc} | {status} | {', '.join(failing)}", flush=True)
    finally:
        open(path, "w", encoding="utf-8").write(src)
print(f"RESULT {killed}/{len(M)} killed")
