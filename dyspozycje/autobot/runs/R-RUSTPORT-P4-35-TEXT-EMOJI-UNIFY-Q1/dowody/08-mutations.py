"""Mutation runner for R-RUSTPORT-P4-35 (scratch, not committed).

Each mutation: (id, file, old, new, description). Applies one at a time,
runs the textmix + RR-T8c tests, restores the file.
"""
import subprocess, sys, pathlib

ROOT = pathlib.Path('/home/user/The-Game/.claude/worktrees/wf_eca72282-efa-1/rust-port/renderer')
T = 'src/raster/text/mod.rs'
E = 'src/raster/image/emoji.rs'
M = [
    ('U01', T, 'if emoji::has_color_glyph(&self.text_state().font, text) {', 'if false && emoji::has_color_glyph(&self.text_state().font, text) {', 'fill/stroke_text: colour branch never taken (pre-RR-T8f .notdef)'),
    ('U02', T, 'let width = if emoji::has_color_glyph(font, text) {', 'let width = if false && emoji::has_color_glyph(font, text) {', 'measure_text: colour advance ignored'),
    ('U03', T, 'let dy = emoji::emoji_aware_baseline_shift(&st.font, st.baseline);', 'let dy = baseline_shift(&st.font, st.baseline);', 'text-only baseline from the first outline face (RR-T8b) instead of the primary face'),
    ('U04', E, '    f32_total(&run_widths(spec, &runs(spec, text)))', '    run_widths(spec, &runs(spec, text)).iter().sum()', 'measure: RR-T8c f64 sum of runs (no f32 accumulation)'),
    ('U05', E, '    f64::from(widths.iter().fold(0.0_f32, |acc, w| acc + *w as f32))', '    f64::from(widths.iter().sum::<f64>() as f32)', 'f32 rounding only of the f64 total'),
    ('U06', E, '            Run::Emoji(gs, _) => gs.iter().map(|g| color_advance(g, spec.size_px)).sum(),', '            Run::Emoji(gs, _) => f64::from(gs.iter().fold(0.0_f32, |a, g| a + color_advance(g, spec.size_px) as f32)),', 'colour run: per-glyph f32 accumulation'),
    ('U07', E, '        TextPaint::Stroke => ctx.stroke_color_alpha(),', '        TextPaint::Stroke => ctx.fill_color_alpha(),', 'strokeText colour glyph alpha from fillStyle'),
    ('U08', E, '                        draw_color_glyph(ctx, &g, png, spec.size_px, gx, base_y, alpha);', '                        if paint == TextPaint::Fill {\n                            draw_color_glyph(ctx, &g, png, spec.size_px, gx, base_y, alpha);\n                        }', 'strokeText skips colour glyphs'),
    ('U09', E, '    let total = f32_total(&widths);', '    let total: f64 = widths.iter().sum();', 'alignment by the f64 run sum instead of measureText width'),
    ('U10', E, '        color_glyph(c).is_some()\n            && pick_source(', '        color_glyph(c).is_some()\n            || pick_source(', 'has_color_glyph ignores the fallback chain (⚔ ☠ coloured)'),
    ('U11', E, '    let base_y = y + emoji_aware_baseline_shift(&spec, baseline);', '    let base_y = y;', 'mixed: textBaseline ignored'),
    ('U12', E, '        TextAlign::Center => x - total / 2.0,\n        TextAlign::End | TextAlign::Right => x - total,\n    };\n    let base_y', '        TextAlign::Center => x - total,\n        TextAlign::End | TextAlign::Right => x - total,\n    };\n    let base_y', 'mixed: center aligned as right'),
    ('U13', T, '    if let Some(p) = build_path(&shaped, &spec, x, baseline_y, &ctx.ctm()) {\n        ctx.paint_text_path(p, paint);', '    if let Some(p) = build_path(&shaped, &spec, x, baseline_y, &ctx.ctm()) {\n        ctx.paint_text_path(p, TextPaint::Fill);', 'mixed strokeText fills its outline runs'),
    ('U14', E, '    ctx.set_text_baseline(&style.baseline_css);\n    ctx.fill_text(text, x, y);', '    ctx.fill_text(text, x, y);', 'emoji::fill_text delegation forgets textBaseline'),
    ('U15', E, '        TextAlign::End | TextAlign::Right => x - total,\n    };\n    let base_y', '        TextAlign::End | TextAlign::Right => x,\n    };\n    let base_y', 'mixed: end/right aligned as left'),
    ('U16', E, '    .unwrap_or(1.0);\n    let mut pen = x0;', '    .map(|_| 1.0_f32)\n    .unwrap_or(1.0);\n    let mut pen = x0;', 'colour glyph alpha always 1 (Z-7 lost)'),
]
TESTS = ['--test', 'textmix_manifest', '--test', 'textmix_chromium', '--test', 'textmix_unify', '--test', 'image_scenes', '--test', 'image_metrics', '--test', 'text_scenes', '--test', 'cityoverlay_web_parity', '--test', 'overlay_web_parity']
only = set(sys.argv[1:])
for mid, f, old, new, desc in M:
    if only and mid not in only:
        continue
    p = ROOT / f
    src = p.read_text()
    assert src.count(old) == 1, (mid, src.count(old))
    p.write_text(src.replace(old, new))
    try:
        r = subprocess.run(['cargo', 'test', '--locked', '--no-fail-fast', *TESTS], cwd=ROOT, capture_output=True, text=True)
        out = r.stdout + r.stderr
        if 'error[' in out or 'could not compile' in out:
            verdict = 'COMPILE_ERROR'
            killers = []
        else:
            killers = sorted({l.split()[1] for l in out.splitlines() if l.startswith('test ') and l.rstrip().endswith('FAILED')})
            verdict = 'KILLED' if killers else 'SURVIVED'
        print(f'{mid}\t{verdict}\t{desc}\t{",".join(killers)}', flush=True)
    finally:
        p.write_text(src)
