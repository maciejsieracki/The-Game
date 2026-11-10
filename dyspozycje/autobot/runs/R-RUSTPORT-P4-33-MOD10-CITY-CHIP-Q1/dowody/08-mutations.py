#!/usr/bin/env python3
"""R-RUSTPORT-P4-33-MOD10-CITY-CHIP-Q1 — mutation run.

Each mutation replaces ONE fragment (asserted to occur exactly once) in
rust-port/renderer/src/cities/overlay/*.rs, runs the MOD-10 tests
(`cargo test --locked --lib cities::overlay` + `--test cityoverlay_web_parity`)
and restores the file (also on SIGTERM / SIGINT). KILLED = some test failed.

Usage (from the repository root):
  python3 dyspozycje/autobot/runs/R-RUSTPORT-P4-33-MOD10-CITY-CHIP-Q1/dowody/08-mutations.py
"""
import os
import pathlib
import re
import signal
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[5]
CRATE = ROOT / "rust-port" / "renderer"
SRC = CRATE / "src" / "cities" / "overlay"

M = [
    ("C01", "stat_chip.rs", "pub const CITY_NAME_BUDGET_BASE: f64 = 305.0;", "pub const CITY_NAME_BUDGET_BASE: f64 = 260.0;",
     "name budget base 305 -> 260 (round-3 value)"),
    ("C02", "stat_chip.rs", "let portrait = content.portrait.filter(|_| !content.is_city_state);", "let portrait = content.portrait;",
     "portrait also drawn for a city-state"),
    ("C03", "stat_chip.rs", "pub const PILL_RING_LINE_W: f64 = 2.0;", "pub const PILL_RING_LINE_W: f64 = 1.0;",
     "pill ring 2 px -> 1 px"),
    ("C04", "stat_chip.rs", "pub const CAPITAL_INNER_RING_INSET: f64 = 6.0;", "pub const CAPITAL_INNER_RING_INSET: f64 = 5.0;",
     "capital inner ring inset 6 -> 5"),
    ("C05", "stat_chip.rs", "growth_w = measure.measure_text(l).width.ceil();", "growth_w = measure.measure_text(l).width;",
     "growth slot width not rounded up (Math.ceil dropped)"),
    ("C06", "stat_chip.rs", "let max_text_w = w - x - warn_w - 6.0;", "let max_text_w = w - warn_w - 6.0;",
     "hover row budget without the web's '- x'"),
    ("C07", "stat_chip.rs", "format!(\"{cat} \\u{b7} {name}\")", "format!(\"{cat} - {name}\")",
     "hover row separator ' · ' -> ' - '"),
    ("C08", "stat_chip.rs", "let kind = input.prod_kind.as_deref().filter(|k| !k.is_empty());",
     "let kind = input.prod_kind.as_deref().filter(|k| !k.is_empty()).or(Some(\"budynek\"));",
     "production icon requested without a prodKind"),
    ("C09", "stat_chip.rs", "js_number_string(js_round(gg * 0.55)),", "js_number_string(js_round(gg * 0.6)),",
     "medallion disc green darkened by 0.6 instead of 0.55"),
    ("C10", "stat_chip.rs", "pub const NAME_FONT: &str = \"700 22px", "pub const NAME_FONT: &str = \"700 21px",
     "name font 22 px -> 21 px"),
    ("C11", "stat_chip.rs", "let (fill, stroke) = DEFENSE_COLORS[usize::from(tier >= 2)];", "let (fill, stroke) = DEFENSE_COLORS[usize::from(tier >= 1)];",
     "palisade shield drawn in the gold palette"),
    ("C12", "stat_chip.rs", "pub const BADGE_WORLD_H: f64 = 0.52;", "pub const BADGE_WORLD_H: f64 = 0.5;",
     "badge sprite world height 0.52 -> 0.5"),
    ("C13", "stat_chip.rs", "        &l.pop_str,\n        cx,\n        cy + 1.0,\n",
     "        &l.pop_str,\n        cx,\n        cy,\n",
     "population digits without the +1 px offset"),
    ("C14", "stat_chip.rs", "        civ_icon_id: \"grecy\".into(),", "        civ_icon_id: \"rzym\".into(),",
     "legacy overload with another civ"),
    ("C15", "okolica.rs", "pub const YIELD_WORKED_DIGIT_SCALE: f64 = 1.28;", "pub const YIELD_WORKED_DIGIT_SCALE: f64 = 1.2;",
     "worked-field digits 1.28 -> 1.2"),
    ("C16", "okolica.rs", "s.position = [x, surface_y + world_h * 0.38, z];", "s.position = [x, surface_y + world_h * 0.4, z];",
     "label lifted by 0.4 instead of 0.38 of its height"),
    ("C17", "okolica.rs", "if key != city_key && map.covering_improvement.contains(&key) {", "if map.covering_improvement.contains(&key) {",
     "city centre hidden under a covering improvement"),
    ("C18", "okolica.rs", "hex_distance(f64::from(cq), f64::from(cr), f64::from(q), f64::from(r)) <= range",
     "hex_distance(f64::from(cq), f64::from(cr), f64::from(q), f64::from(r)) < range",
     "range ring excluded (< instead of <=)"),
    ("C19", "okolica.rs", "pub const WORKER_BADGE_GLYPH_PX: f64 = 13.0;", "pub const WORKER_BADGE_GLYPH_PX: f64 = 16.0;",
     "okolica 👤 glyph 13 px -> 16 px (world-map size)"),
    ("C20", "okolica.rs", "if t == Terrain::Morze || t == Terrain::Gory {\n                continue;\n            }\n            if key != city_key",
     "if t == Terrain::Morze || t == Terrain::Gory || t == Terrain::PlytkieMorze {\n                continue;\n            }\n            if key != city_key",
     "shallow sea treated as unworkable (isWaterTerrain)"),
    ("C21", "okolica.rs", "trace::set_shadow_blur(ctx, if worked { 3.0 } else { 2.0 });", "trace::set_shadow_blur(ctx, 2.0);",
     "worked digits with the idle shadow blur"),
    ("C22", "worker_field.rs", "let badge_r = if is_player { 11.0 } else { 12.0 };", "let badge_r = 12.0;",
     "player worker badge radius 11 -> 12"),
    ("C23", "worker_field.rs", "pub const WORKER_BASE_OPACITY: f64 = 0.9;", "pub const WORKER_BASE_OPACITY: f64 = 1.0;",
     "worker icon opacity 0.9 -> 1"),
    ("C24", "worker_field.rs", "        s.visible = bri > 0.0;", "        s.visible = bri >= 0.0;",
     "fog: unexplored worker icons stay visible"),
    ("C25", "worker_field.rs", "    let i = owner_id % 8.0;", "    let i = owner_id.rem_euclid(8.0);",
     "palette index wraps negatives (JS % keeps the sign)"),
    ("C26", "mod.rs", "    let h = hex.unwrap_or(0);", "    let h = hex.unwrap_or(0x00ff_ffff);",
     "undefined owner colour painted white instead of black"),
    # round 2
    ("C27", "okolica.rs", "trace::set_shadow_offset_y(ctx, 1.0);", "trace::set_shadow_offset_y(ctx, 2.0);",
     "yield digit shadow offset 1 -> 2"),
    ("C28", "okolica.rs", "\"rgba(0,0,0,0.75)\"", "\"rgba(0,0,0,0.6)\"",
     "worked digit shadow alpha 0.75 -> 0.6"),
]

# tests that compare with the Rust output itself, not with the web
SELF = {"textures_match_golden_hashes", "rendering_twice_is_identical"}

ORIG = {}


def restore(*_):
    for p, t in ORIG.items():
        p.write_text(t)
    sys.exit(1)


signal.signal(signal.SIGTERM, restore)
signal.signal(signal.SIGINT, restore)


def run():
    r = subprocess.run(
        "cargo test --locked --lib cities::overlay 2>&1; echo LIBEXIT=$?; "
        "cargo test --locked --test cityoverlay_web_parity 2>&1; echo ITEXIT=$?",
        shell=True, cwd=CRATE, capture_output=True, text=True, env=os.environ)
    out = r.stdout
    failed = sorted(set(re.findall(r"^test (\S+) \.\.\. FAILED", out, re.M)))
    compile_err = "error[E" in out or "could not compile" in out
    ok = "LIBEXIT=0" in out and "ITEXIT=0" in out
    return ok, failed, compile_err


def main():
    for mid, f, old, _new, _what in M:  # every fragment exactly once, before any build
        n = (SRC / f).read_text().count(old)
        assert n == 1, f"{mid}: fragment occurs {n} times"
    ok, failed, ce = run()
    print(f"baseline: ok={ok} failed={failed} compile_error={ce}", flush=True)
    if not ok:
        sys.exit("baseline must pass")
    killed = 0
    web_killed = 0
    print("| ID | file | mutation | result | killed by | without the golden hash |")
    print("|---|---|---|---|---|---|")
    for mid, f, old, new, what in M:
        p = SRC / f
        text = p.read_text()
        n = text.count(old)
        assert n == 1, f"{mid}: fragment occurs {n} times"
        ORIG[p] = text
        p.write_text(text.replace(old, new))
        try:
            ok, failed, ce = run()
        finally:
            p.write_text(text)
            ORIG.pop(p, None)
        res = "**KILLED**" if not ok else "SURVIVED"
        killed += not ok
        why = "compile error" if ce else ", ".join(failed)
        web = [t for t in failed if t not in SELF]
        web_killed += bool(web)
        print(f"| {mid} | `src/cities/overlay/{f}` | {what} | {res} | {why} | {'yes' if web else '**NO**'} |", flush=True)
    print(f"\nResult: {killed}/{len(M)} killed, {web_killed}/{len(M)} by a test other than the golden hash / rendering_twice")
    # the tree is clean again
    d = subprocess.run(["git", "diff", "--stat", "--", str(SRC)], cwd=ROOT, capture_output=True, text=True).stdout
    print("git diff after the run:", d.strip() or "(none)")
    sys.exit(0 if killed == len(M) and web_killed == len(M) else 1)


main()
