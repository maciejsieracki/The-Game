#!/usr/bin/env python3
"""R-RUSTPORT-P4-32-MOD08-UNIT-OVERLAY-Q1 — mutation run.

Each mutation replaces ONE fragment (asserted to occur exactly once) in
rust-port/renderer/src/units/overlay/*.rs, runs the overlay tests
(`cargo test --locked --lib units::overlay` + `--test overlay_web_parity`)
and restores the file. KILLED = some test failed.

Usage (from the repository root): python3 dyspozycje/autobot/runs/R-RUSTPORT-P4-32-MOD08-UNIT-OVERLAY-Q1/dowody/08-mutations.py
"""
import pathlib
import re
import signal
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[5]
CRATE = ROOT / "rust-port" / "renderer"
SRC = CRATE / "src" / "units" / "overlay"

M = [
    ("O01", "emblem.rs", "        if octx.is_barbarian {\n            EmblemVariant::Barbarian\n        } else if octx.is_city_state {\n            EmblemVariant::CityState\n",
     "        if octx.is_city_state {\n            EmblemVariant::CityState\n        } else if octx.is_barbarian {\n            EmblemVariant::Barbarian\n",
     "variant: city-state checked before barbarians"),
    ("O02", "emblem.rs", ".unwrap_or(\"\")).to_lowercase();", ".unwrap_or(\"\")).to_owned();", "emblem key not lower-cased"),
    ("O03", "emblem.rs", "pub const DISC_R: f64 = 54.0;", "pub const DISC_R: f64 = 53.0;", "disc radius 54 -> 53"),
    ("O04", "emblem.rs", "            ring_on_top(&mut ctx)?;\n", "", "ring not stroked again over the portrait"),
    ("O05", "emblem.rs", "draw_bitmap(ctx, img, c - w / 2.0, c - r, w, h);", "draw_bitmap(ctx, img, c - w / 2.0, c - h / 2.0, w, h);", "portrait centred instead of top-anchored"),
    ("O06", "emblem.rs", "pub const DISC_RING_W: f64 = 14.0;", "pub const DISC_RING_W: f64 = 7.0;", "ring width 14 -> 7 (pre R-ZETON-PASKI value)"),
    ("O07", "emblem.rs", "variant.fallback_glyph(), c, c + 3.0);", "variant.fallback_glyph(), c, c);", "fallback glyph without the +3 px offset"),
    ("O08", "emblem.rs", "    let civ = js_trim(octx.civ_id.as_deref().unwrap_or(\"\"));", "    let civ = octx.civ_id.as_deref().unwrap_or(\"\");", "asset lookup with an untrimmed civId"),
    ("O09", "stat_plate.rs", "pub const PLATE_BAR_GAP: f64 = 0.042 * HEX_R;", "pub const PLATE_BAR_GAP: f64 = 0.028 * HEX_R;", "bar gap 0.042 -> 0.028"),
    ("O10", "stat_plate.rs", "    if !v.is_finite() {\n        return 1.0;\n    }", "    if !v.is_finite() {\n        return 0.0;\n    }", "missing bar value = empty bar instead of full"),
    ("O11", "stat_plate.rs", "        if frac <= VITALS_HP_LOW_FRAC {", "        if frac < VITALS_HP_LOW_FRAC {", "HP red band uses < instead of <="),
    ("O12", "stat_plate.rs", "    n.visible = frac > 0.002;", "    n.visible = frac > 0.0;", "fill visible threshold 0.002 -> 0"),
    ("O13", "stat_plate.rs", "    let m = js_round(move_frac * 1000.0);", "    let m = (move_frac * 1000.0).floor();", "packBars floors the movement fraction"),
    ("O14", "stat_plate.rs", "    if n <= 0.0 {\n        return String::new();", "    if n < 0.0 {\n        return String::new();", "power 0 shown as a digit"),
    ("O15", "stat_plate.rs", "POWER_DIGIT_ADVANCE.min((POWER_BOX_INNER_W - POWER_DIGIT_W) / gaps)", "POWER_DIGIT_ADVANCE.max((POWER_BOX_INNER_W - POWER_DIGIT_W) / gaps)", "digit advance not tightened for long numbers"),
    ("O16", "stat_plate.rs", "ctx.set_line_width(js_round(hf * 0.22));", "ctx.set_line_width(js_round(hf * 0.15));", "digit outline width 0.22 -> 0.15 of the height"),
    ("O17", "stat_plate.rs", "            bar_h_px * 0.32,", "            bar_h_px * 0.5,", "trough corner radius 0.32 -> 0.5 of the bar height"),
    ("O18", "upgrade_badges.rs", "soft_level, -x));", "soft_level, x));", "Barracks badge on the right"),
    ("O19", "upgrade_badges.rs", "pub const ICON_GAP: f64 = 0.050 * HEX_R;", "pub const ICON_GAP: f64 = 0.030 * HEX_R;", "icon gap 0.05 -> 0.03"),
    ("O20", "upgrade_badges.rs", "pub const ICON_STROKE_BOOST: f64 = 1.6;", "pub const ICON_STROKE_BOOST: f64 = 1.0;", "badge icon stroke not boosted"),
    ("O21", "veteran_badges.rs", "pub const STAR_INNER_FRAC: f64 = 0.42;", "pub const STAR_INNER_FRAC: f64 = 0.5;", "star inner radius 0.42 -> 0.5"),
    ("O22", "veteran_badges.rs", "pub const STAR_OUTLINE_OFFSET_Z: f64 = -0.012 * HEX_R;", "pub const STAR_OUTLINE_OFFSET_Z: f64 = 0.012 * HEX_R;", "outline star in front of the star"),
    ("O23", "veteran_badges.rs", ".scale(0.45);", ".scale(0.5);", "star emissive 45 % -> 50 %"),
    ("O24", "mod.rs", "        side: Side::Double,", "        side: Side::Front,", "flat plate material single-sided"),
    ("O25", "mod.rs", "    if n.abs() >= 1e21 {", "    if n.abs() >= 1e300 {", "JS exponent form of String(n) dropped (1e21 printed in full)"),
]

def run():
    r = subprocess.run(
        "cargo test --locked --lib units::overlay 2>&1; echo LIBEXIT=$?; cargo test --locked --test overlay_web_parity 2>&1; echo ITEXIT=$?",
        shell=True, cwd=CRATE, capture_output=True, text=True)
    out = r.stdout
    failed = sorted(set(re.findall(r"^test (\S+) \.\.\. FAILED", out, re.M)))
    compile_err = "error[E" in out or "could not compile" in out
    ok = "LIBEXIT=0" in out and "ITEXIT=0" in out
    return ok, failed, compile_err

def main():
    # SIGTERM/SIGINT → SystemExit, so the `finally` below restores the file.
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(143))
    ok, failed, _ = run()
    assert ok, f"baseline not green: {failed}"
    print("baseline green")
    killed = 0
    rows = []
    only = set(sys.argv[1:])  # optional: mutation ids to run
    for mid, f, old, new, desc in M:
        if only and mid not in only:
            continue
        p = SRC / f
        src = p.read_text()
        assert src.count(old) == 1, f"{mid}: fragment occurs {src.count(old)}x"
        p.write_text(src.replace(old, new))
        try:
            ok, failed, cerr = run()
        finally:
            p.write_text(src)
        res = "KILLED" if not ok else "SURVIVED"
        if not ok:
            killed += 1
        why = "compile error" if cerr and not failed else ", ".join(failed)
        rows.append(f"| {mid} | `src/units/overlay/{f}` | {desc} | **{res}** | {why} |")
        print(rows[-1], flush=True)
    print(f"\nResult: {killed}/{len(M)} killed")
    ok, failed, _ = run()
    assert ok, "tree not restored"
    print("restored tree green")
    return 0 if killed == len(M) else 1

if __name__ == "__main__":
    sys.exit(main())
