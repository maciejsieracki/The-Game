#!/usr/bin/env python3
"""Mutation run for R-RUSTPORT-REPIN-3D-B2-Q1, batches B2 (owner medallion `ringHex`,
plate owner icon 0,80·HEX_R) and B3 (commander star).

Applies each mutant below (one at a time) to the B2/B3 sources, runs
`cargo test --locked --test repin3d_b2 --test overlay_web_parity --test atlas_keys`
and expects a FAIL (mutant killed). Sources are restored after every mutant (also
on error). Run from `rust-port/renderer`:

    CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 \
        python3 tests/repin3d_fixtures/mutate_b2.py

`RANGE=a:b` limits the run to mutants a..b-1. Prints one line per mutant and
`KILLED k/n`; exit 1 if any survived, 2 if a pattern is not found exactly once.

Equivalent (not listed, proof in P4-REPIN-3D.md §10.3): dropping the `!r.is_empty()`
filter of `normalize_ring_hex` — `""` trims to `""` (length 0 ≠ 7) → `None` either way.
"""
import os
import subprocess
import sys

K = 'src/raster/atlas/keys.rs'
E = 'src/units/overlay/emblem.rs'
S = 'src/units/overlay/stat_plate.rs'
V = 'src/units/overlay/veteran_badges.rs'

DISC = '    ctx.fill();\n    ctx.set_stroke_style(ring_color);'
TOP = '    let c = f64::from(CANVAS_PX) / 2.0;\n    ctx.set_stroke_style(ring_color);\n    ctx.set_line_width(DISC_RING_W);\n    arc_full(ctx, c, DISC_R)?;\n    ctx.stroke();\n    Ok(())\n}\n\n/// The owner medallion'
NORM_TRIM = '    let v = js_trim(raw);'
NORM_OK = '    let ok = b.len() == 7 && b[0] == b\'#\' && b[1..].iter().all(u8::is_ascii_hexdigit);'

MUTANTS = [
    # --- B2: plate owner icon (unitStatPlate.ts :154, :162)
    ('icon size back to pin 0.20', [(S, 'pub const PLATE_OWNER_ICON_SIZE: f64 = 0.80 * HEX_R;', 'pub const PLATE_OWNER_ICON_SIZE: f64 = 0.20 * HEX_R;')]),
    ('icon x ignores icon size', [(S, 'PLATE_OWNER_GAP + PLATE_OWNER_ICON_SIZE / 2.0);', 'PLATE_OWNER_GAP + 0.20 * HEX_R / 2.0);')]),
    # --- B2: normalizeRingHex (shared by atlas keys and the medallion)
    ('normalize without trim', [(K, NORM_TRIM, '    let v = raw;')]),
    ('normalize Rust trim', [(K, NORM_TRIM, '    let v = raw.trim();')]),
    ('normalize length 8', [(K, NORM_OK, NORM_OK.replace('b.len() == 7', 'b.len() >= 7'))]),
    ('normalize no # check', [(K, NORM_OK, NORM_OK.replace("b[0] == b'#'", 'b[0] != 0'))]),
    ('normalize no hex check', [(K, NORM_OK, NORM_OK.replace(' && b[1..].iter().all(u8::is_ascii_hexdigit)', ''))]),
    ('normalize alnum check', [(K, 'all(u8::is_ascii_hexdigit)', 'all(u8::is_ascii_alphanumeric)')]),
    ('normalize no lowercase', [(K, '    ok.then(|| v.to_ascii_lowercase())', '    ok.then(|| v.to_owned())')]),
    # --- B2: emblemKey (atlas copy and medallion copy)
    ('atlas key without ring', [(K, '        "civ:{civ}:{}:{ring}",', '        "civ:{civ}:{}",')]),
    ('atlas key fallback text', [(K, 'unwrap_or_else(|| "brass".to_owned());\n    format!(\n        "civ:{civ}:{}:{ring}",', 'unwrap_or_else(|| "mosiadz".to_owned());\n    format!(\n        "civ:{civ}:{}:{ring}",')]),
    ('emblem key without ring', [(E, '    format!("civ:{civ}:{}:{ring}", js_number_string(era))', '    format!("civ:{civ}:{}", js_number_string(era))')]),
    ('emblem key raw ring', [(E, '    let ring = normalize_ring_hex(octx.ring_hex.as_deref()).unwrap_or_else(|| "brass".to_owned());', '    let ring = octx.ring_hex.clone().unwrap_or_else(|| "brass".to_owned());')]),
    # --- B2: ringColorFor / drawing
    ('ring colour for every variant', [(E, '    if variant != EmblemVariant::Civ {\n        return variant.ring_color().to_owned();\n    }\n', '')]),
    ('ring colour fallback city-state', [(E, '    normalize_ring_hex(ring_hex).unwrap_or_else(|| EmblemVariant::Civ.ring_color().to_owned())', '    normalize_ring_hex(ring_hex).unwrap_or_else(|| EmblemVariant::CityState.ring_color().to_owned())')]),
    ('ring colour raw (no normalize)', [(E, '    normalize_ring_hex(ring_hex).unwrap_or_else(|| EmblemVariant::Civ.ring_color().to_owned())', '    ring_hex.map_or_else(|| EmblemVariant::Civ.ring_color().to_owned(), str::to_owned)')]),
    ('ring colour ignored (pin)', [(E, '    let ring_color = ring_color_for(variant, octx.ring_hex.as_deref());', '    let ring_color = variant.ring_color().to_owned();')]),
    ('disc ring brass', [(E, DISC, '    ctx.fill();\n    ctx.set_stroke_style("#e8d88a");')]),
    ('fallback glyph brass', [(E, '    ctx.set_fill_style(ring_color);\n    ctx.set_font(FALLBACK_FONT);', '    ctx.set_fill_style("#e8d88a");\n    ctx.set_font(FALLBACK_FONT);')]),
    ('ring over portrait brass (pin)', [(E, TOP, TOP.replace('ctx.set_stroke_style(ring_color);', 'ctx.set_stroke_style("#e8d88a");'))]),
    # --- B3: commander star (unitVeteranBadges.ts :275-301)
    ('commander lift 0.20', [(V, 'pub const COMMANDER_STAR_LIFT: f64 = 0.25 * HEX_R;', 'pub const COMMANDER_STAR_LIFT: f64 = 0.20 * HEX_R;')]),
    ('commander scale 1.5', [(V, 'pub const COMMANDER_STAR_SCALE: f64 = 1.6;', 'pub const COMMANDER_STAR_SCALE: f64 = 1.5;')]),
    ('commander outline not scaled', [(V, '    let os = VETERAN_STAR_OUTLINE_SCALE * COMMANDER_STAR_SCALE;', '    let os = VETERAN_STAR_OUTLINE_SCALE;')]),
    ('commander outline z 0', [(V, '        [0.0, 0.0, STAR_OUTLINE_OFFSET_Z],\n        [os, os, 1.0],', '        [0.0, 0.0, 0.0],\n        [os, os, 1.0],')]),
    ('commander not tilted', [(V, '    root.position[1] = VETERAN_BADGE_RESERVED_Y + COMMANDER_STAR_LIFT;\n    root.rotation[0] = -BADGE_ROW_TILT_RAD;', '    root.position[1] = VETERAN_BADGE_RESERVED_Y + COMMANDER_STAR_LIFT;')]),
    ('commander star hit missing', [(V, '    star.commander_star_hit = true;', '')]),
    ('commander outline hit missing', [(V, '    outline.commander_star_hit = true;', '')]),
    ('commander outline gold material', [(V, '        veteran_star_outline_material(),\n        [0.0, 0.0, STAR_OUTLINE_OFFSET_Z],', '        veteran_star_material(),\n        [0.0, 0.0, STAR_OUTLINE_OFFSET_Z],')]),
    ('commander never removed', [(V, '        (true, false) => CommanderStarUpdate::Remove,', '        (true, false) => CommanderStarUpdate::Keep,')]),
    ('commander never added', [(V, '        (false, true) => CommanderStarUpdate::Add,', '        (false, true) => CommanderStarUpdate::Keep,')]),
]

TESTS = ['cargo', 'test', '--locked', '--test', 'repin3d_b2', '--test', 'overlay_web_parity',
         '--test', 'atlas_keys']


def main() -> int:
    lo, hi = 0, len(MUTANTS)
    if os.environ.get('RANGE'):
        a, b = os.environ['RANGE'].split(':')
        lo, hi = int(a), min(int(b), len(MUTANTS))
    killed = 0
    total = 0
    survived = []
    for idx in range(lo, hi):
        name, edits = MUTANTS[idx]
        orig = {}
        try:
            for path, old, new in edits:
                if path not in orig:
                    with open(path, encoding='utf-8') as f:
                        orig[path] = f.read()
            cur = dict(orig)
            for path, old, new in edits:
                n = cur[path].count(old)
                if n != 1:
                    print(f'[{idx}] PATTERN x{n}: {name}')
                    return 2
                cur[path] = cur[path].replace(old, new, 1)
            for path, text in cur.items():
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(text)
            r = subprocess.run(TESTS, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
            total += 1
            if r.returncode != 0:
                killed += 1
                print(f'[{idx}] KILLED   {name}', flush=True)
            else:
                survived.append(name)
                print(f'[{idx}] SURVIVED {name}', flush=True)
        finally:
            for path, text in orig.items():
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(text)
    print(f'KILLED {killed}/{total}')
    if survived:
        print('SURVIVED:', survived)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
