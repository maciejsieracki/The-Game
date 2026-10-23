#!/usr/bin/env python3
"""R-RUSTPORT-P4-34-ANCHORS-DOM-Q1 — mutation run for `labels` (RR-T8e).

Each mutation replaces ONE fragment (asserted to occur exactly once) in one
file, runs the label tests (lib `labels` + tests/labels_*.rs), records
KILLED/SURVIVED with the names of the failing tests, and restores the file.
Run from anywhere:  python3 <this file> [M-id ...]   (ids: run only those)
"""
import os
os.environ.setdefault("CARGO_INCREMENTAL", "0")  # disk: no incremental cache per mutation
import re
import subprocess
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../../../rust-port/renderer'))
L = 'src/labels/layout.rs'
S = 'src/labels/shape.rs'
P = 'src/labels/paint.rs'
A = 'src/labels/anchor.rs'
ST = 'src/labels/style.rs'

M = [
    ("M01", L, "LayoutUnit(float) rounds instead of truncating (line-height)",
     "pub fn lu_trunc(v: f32) -> Lu {\n    (v * 64.0) as i32", "pub fn lu_trunc(v: f32) -> Lu {\n    (v * 64.0).round() as i32"),
    ("M02", L, "text width rounded to 1/64 instead of ceil",
     "    (v * 64.0).ceil() as i32", "    (v * 64.0).round() as i32"),
    ("M03", L, "half-leading not floored to whole px",
     "    let asc_lead = floor_px(half(leading));", "    let asc_lead = half(leading);"),
    ("M04", L, "line-height from the raw font size (no 1/64 rounding)",
     "            let fs = lu_round(spec.size_px as f32) as f32 / 64.0;", "            let fs = spec.size_px as f32;"),
    ("M05", L, "font metrics floored instead of rounded",
     "        let v = (u / upem * size + 0.5).floor() as i32;", "        let v = (u / upem * size).floor() as i32;"),
    ("M06", L, "R5 first line not centred",
     "line((&block_spec, lh), &l1, half(content_w - w1), 0)", "line((&block_spec, lh), &l1, 0, 0)"),
    ("M07", L, "R4 text span not centred on the cross axis",
     "    shift(&mut text_frags, icon_w + gap, half(row_h - text_h));", "    shift(&mut text_frags, icon_w + gap, 0);"),
    ("M08", L, "R4 reason max-width ignored",
     "        let rw = max_content.min(max_w);", "        let rw = max_content;"),
    ("M09", L, "R4 border colours swapped (valid/invalid)",
     "            border_color: if valid {", "            border_color: if !valid {"),
    ("M10", S, "DOM text shaped word by word (no kerning across spaces)",
     "                    Some((f, _, s)) if *f == face => s.push(c),",
     "                    Some((f, _, s)) if *f == face && c != ' ' && !s.ends_with(' ') => s.push(c),"),
    ("M11", S, "GPOS kerning scaled by the quantised size instead of the font-key size",
     "kern_16_16(\n                                    pos.x_advance - i32::from(nominal),\n                                    s_key,",
     "kern_16_16(\n                                    pos.x_advance - i32::from(nominal),\n                                    s_eff,"),
    ("M12", S, "font-key size not truncated to 1/100 px",
     "    let k = ((px as f32) * 100.0).trunc() / 100.0;", "    let k = px as f32;"),
    ("M13", ST, "`smaller` ratio 1.25 instead of 1.2",
     "pub const R5_SMALLER_RATIO: f32 = 1.2;", "pub const R5_SMALLER_RATIO: f32 = 1.25;"),
    ("M14", P, "box-shadow not clipped to outside the border box",
     "            Some(inside.pixels_premultiplied()),", "            None,"),
    ("M15", P, "shadow Gaussian sigma = blur (CSS: blur / 2)",
     "    let sigma = blur * 0.5;", "    let sigma = blur;"),
    ("M16", P, "text-shadow offsets negated",
     "        let (dx, dy) = (\n            (s.offset_x * dsf).round() as i64,\n            (s.offset_y * dsf).round() as i64,\n        );",
     "        let (dx, dy) = (\n            -(s.offset_x * dsf).round() as i64,\n            -(s.offset_y * dsf).round() as i64,\n        );"),
    ("M17", P, "element opacity not applied",
     "    if opacity < 1.0 {", "    if opacity < 0.0 {"),
    ("M18", P, "box snapped in device px instead of CSS px (HiDPI)",
     "        let y1 = snap(m + lu_px(layout.height)) * dsf;", "        let y1 = snap((m + lu_px(layout.height)) * dsf);"),
    ("M19", P, "text baseline not snapped to whole CSS px",
     "snap(m + lu_px(f.baseline)),", "m + lu_px(f.baseline),"),
    ("M20", P, "text-shadow layers in list order (first at the bottom)",
     "    for s in layout.text_shadows.iter().rev() {", "    for s in layout.text_shadows.iter() {"),
    ("M21", A, "translate(-50%, -50%) applied as -100% vertically",
     "        AnchorTransform::Center => (x - w * 0.5, y - h * 0.5, w, h),", "        AnchorTransform::Center => (x - w * 0.5, y - h, w, h),"),
    ("M22", A, "CSS left/top not converted to LayoutUnit (round instead of trunc)",
     "    let (l, tp) = (lu_trunc(left as f32), lu_trunc(top as f32));", "    let (l, tp) = ((left * 64.0).round() as i32, (top * 64.0).round() as i32);"),
    ("M23", A, "fade 1 - p instead of 1 - p²",
     "            opacity: 1.0 - p * p,", "            opacity: 1.0 - p,"),
    ("M24", A, "float label kept at p == 1",
     "        if p >= 1.0 {\n            return None;", "        if p > 1.0 {\n            return None;"),
    ("M25", A, "no rise",
     "        wp.y += age * self.rise_rate;", "        wp.y += 0.0 * age * self.rise_rate;"),
    ("M26", A, "siege position floored instead of Math.round",
     "    Some((js_round(px), js_round(py)))", "    Some((px.floor(), py.floor()))"),
    ("M27", A, "worldToClientPx without the far-plane test",
     "    if v.z > 1.0 {\n        return None;\n    }\n    if rect.width", "    if v.z > 1.0e9 {\n        return None;\n    }\n    if rect.width"),
    ("M28", A, "Math.round ties to even/away (x - f > 0.5)",
     "    if x - f >= 0.5 {", "    if x - f > 0.5 {"),
    ("M29", ST, "R15 glow blur 5 px instead of 6 px",
     "        blur: 6.0,", "        blur: 5.0,"),
]

TEST_CMDS = [
    ["cargo", "test", "--locked", "--offline", "--lib", "labels"],
    ["cargo", "test", "--locked", "--offline", "--no-fail-fast", "--test", "labels_scenes", "--test", "labels_layout", "--test", "labels_anchors"],
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
    only = set(sys.argv[1:])
    todo = [m for m in M if not only or m[0] in only]
    killed = 0
    for mid, f, desc, old, new in todo:
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
    print(f'\nkilled {killed}/{len(todo)}')
    sys.exit(0 if killed == len(todo) else 1)


if __name__ == '__main__':
    main()
