#!/usr/bin/env python3
"""R-RUSTPORT-P4-30-IMAGES-Q1 — mutation run for raster::image (RR-T8c).

Each mutation replaces ONE fragment (asserted to occur exactly once) in one
file, runs the image tests (lib `raster::image` + tests/image_*.rs), records
KILLED/SURVIVED with the names of failing tests, and restores the file.
Run from anywhere:  python3 <this file>
"""
import os
import re
import subprocess
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../../../rust-port/renderer'))
E = 'src/raster/image/emoji.rs'
S = 'src/raster/image/svg.rs'
J = 'src/raster/image/jpeg.rs'
MIP = 'src/raster/image/mip.rs'

M = [
    ("I01", E, "fillStyle alpha ignored for colour glyphs (Z-7)",
     "let alpha = ctx.fill_color_alpha().unwrap_or(1.0);", "let alpha = 1.0_f32;"),
    ("I02", E, "colour glyph origin x snapped to 1/2 px instead of 1/4 px",
     "ox = (ox * 4.0 + 0.5).floor() / 4.0;", "ox = (ox * 2.0 + 0.5).floor() / 2.0;"),
    ("I03", E, "colour glyph origin y not snapped to whole pixels",
     "oy = (oy + 0.5).floor();", "oy += 0.0;"),
    ("I04", E, "no mip level for colour glyphs (bilinear from the 109 ppem strike)",
     "let level = mip_level(s * device_scale(&ctm));", "let level = 0 * mip_level(s * device_scale(&ctm));"),
    ("I05", E, "colour glyph filter nearest instead of bilinear",
     "pub const GLYPH_FILTER: FilterQuality = FilterQuality::Bilinear;", "pub const GLYPH_FILTER: FilterQuality = FilterQuality::Nearest;"),
    ("I06", E, "emoji advance rounded instead of truncated to 16.16",
     "(f64::from(adv) * 65536.0).trunc() / 65536.0", "(f64::from(adv) * 65536.0).round() / 65536.0"),
    ("I07", E, "emoji advance from the f64 scale (no f32 strike scale)",
     "let adv = f32::from(g.advance) * scale;", "let adv = (f64::from(g.advance) * size_px / f64::from(g.ppem)) as f32 + 0.0 * scale;"),
    ("I08", E, "emoji face before the DejaVu fallback (⚔ ☠ become colour)",
     "    push(GlyphSource::Text(FALLBACK_FAMILY.face(spec.weight)));\n    push(GlyphSource::Emoji);",
     "    push(GlyphSource::Emoji);\n    push(GlyphSource::Text(FALLBACK_FAMILY.face(spec.weight)));"),
    ("I09", E, "CSS family \"Noto Color Emoji\" not mapped to the emoji face",
     "        if is_noto_emoji(fam) {", "        if is_noto_emoji(fam) && false {"),
    ("I10", E, "baseline always from the outline primary face (emoji-primary stacks)",
     "    match source_chain(spec)[0] {", "    match GlyphSource::Text(FALLBACK_FAMILY.face(spec.weight)) {"),
    ("I11", E, "bitmap vertical bearing sign flipped",
     "        f: -f64::from(g.bearing_y) * s,", "        f: f64::from(g.bearing_y) * s,"),
    ("I12", E, "text runs placed with the style baseline (double shift)",
     "                ctx.set_text_baseline(\"alphabetic\");\n                ctx.fill_text(s, pen, base_y);",
     "                ctx.set_text_baseline(&style.baseline_css);\n                ctx.fill_text(s, pen, base_y);"),
    ("I13", S, "toFixed with Rust half-to-even ({:.2}) instead of JS half-up",
     "            out.push_str(&js_to_fixed(w * stroke_boost, 2));", "            out.push_str(&format!(\"{:.2}\", w * stroke_boost));"),
    ("I14", S, "currentColor not replaced",
     "    let s = svg.replace(\"currentColor\", stroke_color);", "    let s = svg.replace(\"currentColorX\", stroke_color);"),
    ("I15", S, "SVG rasterised at its intrinsic size and scaled as a bitmap",
     "    let to_device = ctx.ctm().then_local(&local);",
     "    let to_device = ctx.ctm().then_local(&local);\n    if let Ok(r) = img.rasterize(img.width() as u32, img.height() as u32) {\n        let mi = super::mip::MippedImage::new(r);\n        super::mip::draw_bitmap(ctx, &mi, dx, dy, dw, dh);\n        return;\n    }"),
    ("I16", S, "SVG drawn without the current transform",
     "    let to_device = ctx.ctm().then_local(&local);", "    let to_device = Affine::IDENTITY.then_local(&local);"),
    ("I17", S, "device layer compositing does not restore the transform",
     "    ctx.set_transform(ctm.a, ctm.b, ctm.c, ctm.d, ctm.e, ctm.f);\n}", "    let _ = ctm;\n}"),
    ("I18", MIP, "bitmap drawImage without mip levels",
     "    ctx.draw_image(&img.levels[level], dx, dy, dw, dh);", "    ctx.draw_image(&img.levels[0 * level], dx, dy, dw, dh);"),
    ("I19", MIP, "mip box average truncates instead of rounding",
     "o[(y * w as usize + x) * 4 + c] = ((v + 2) >> 2) as u8;", "o[(y * w as usize + x) * 4 + c] = (v >> 2) as u8;"),
    ("I20", MIP, "mip level = ceil instead of floor (one level too small)",
     "    while s <= 0.5 && level < 30 {", "    while s < 1.0 && level < 30 {"),
    ("I21", J, "JPEG red and blue swapped",
     "rgba.extend_from_slice(&[p[0], p[1], p[2], 255]);", "rgba.extend_from_slice(&[p[2], p[1], p[0], 255]);"),
]

TEST_CMDS = [
    ["cargo", "test", "--locked", "--lib", "raster::image"],
    ["cargo", "test", "--locked", "--test", "image_scenes", "--test", "image_metrics", "--test", "image_assets"],
]


def run_tests():
    failed = []
    for cmd in TEST_CMDS:
        p = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
        out = p.stdout + p.stderr
        if p.returncode != 0 and 'test result' not in out:
            return None, out[-3000:]
        failed += re.findall(r'^test (\S+) \.\.\. FAILED', out, re.M)
    return sorted(set(failed)), ''


def main():
    base, err = run_tests()
    if base is None or base:
        print('baseline not green:', base, err)
        sys.exit(2)
    killed = 0
    for mid, f, desc, old, new in M:
        path = os.path.join(ROOT, f)
        src = open(path, encoding='utf-8').read()
        n = src.count(old)
        if n != 1:
            print(f'{mid} {f}: fragment occurs {n}x — ABORT')
            sys.exit(3)
        open(path, 'w', encoding='utf-8').write(src.replace(old, new))
        try:
            failed, err = run_tests()
        finally:
            open(path, 'w', encoding='utf-8').write(src)
        if failed is None:
            status, who = 'KILLED (build)', err.strip().splitlines()[-1] if err.strip() else 'build error'
        elif failed:
            status, who = 'KILLED', ', '.join(failed)
        else:
            status, who = 'SURVIVED', '-'
        if status.startswith('KILLED'):
            killed += 1
        print(f'| {mid} | `{f}` | {desc} | **{status}** | {who} |', flush=True)
    print(f'\nkilled {killed}/{len(M)}')
    sys.exit(0 if killed == len(M) else 1)


if __name__ == '__main__':
    main()
