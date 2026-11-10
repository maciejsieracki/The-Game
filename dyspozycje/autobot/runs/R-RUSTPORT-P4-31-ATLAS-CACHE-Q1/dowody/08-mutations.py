#!/usr/bin/env python3
"""R-RUSTPORT-P4-31-ATLAS-CACHE-Q1 — mutation run for raster::atlas (RR-T8d).

Each mutation replaces ONE fragment (asserted to occur exactly once) in one
file, runs the atlas tests (lib `raster::atlas` + tests/atlas_*.rs, CPU),
records KILLED/SURVIVED with the names of failing tests, and restores the
file. Run from anywhere:  python3 <this file>
"""
import os
import re
import subprocess
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../../../rust-port/renderer'))
K = 'src/raster/atlas/keys.rs'
S = 'src/raster/atlas/scale.rs'
C = 'src/raster/atlas/cache.rs'
MP = 'src/raster/atlas/mip.rs'
U = 'src/raster/atlas/upload.rs'
G = 'src/raster/atlas/gpu.rs'

M = [
    ("A01", K, "JS trim replaced by Rust str::trim (U+FEFF / U+0085 differ)",
     "s.trim_matches(is_js_whitespace)", "s.trim()"),
    ("A02", K, "toLowerCase dropped",
     "    s.to_lowercase()", "    s.to_owned()"),
    ("A03", K, "population Math.floor -> round",
     "let f = x.floor();", "let f = x.round();"),
    ("A04", K, "era Math.round -> Math.floor in the badge key",
     "Some(e) => format!(\"e{}\", js_number_to_string(js_round_at_least_one(e))),",
     "Some(e) => format!(\"e{}\", js_number_to_string(js_floor_at_least_one(e))),"),
    ("A05", K, "growth label keeps the decimal point (no comma)",
     "js_to_fixed(abs, 1).replacen('.', \",\", 1)", "js_to_fixed(abs, 1)"),
    ("A06", K, "growth label ASCII minus instead of U+2212",
     "let sign = if rounded < 0.0 { \"\\u{2212}\" } else { \"\" };",
     "let sign = if rounded < 0.0 { \"-\" } else { \"\" };"),
    ("A07", K, "LOD segment: level 1 not recognised",
     "    if l == 1.0 {", "    if l == 1.5 {"),
    ("A08", K, "prodKind default 'b' lost",
     "a.prod_kind.as_deref().unwrap_or(\"b\"),", "a.prod_kind.as_deref().unwrap_or(\"\"),"),
    ("A09", K, "w-segment reads hoverExpanded",
     "format!(\"w{}\", u8::from(a.resource_warning)),", "format!(\"w{}\", u8::from(a.hover_expanded)),"),
    ("A10", K, "barbarian emblem key renamed",
     "return \"barb\".to_owned();", "return \"barbarian\".to_owned();"),
    ("A11", K, "worker ring flag inverted",
     "u8::from(owner_id == player_owner_id)", "u8::from(owner_id != player_owner_id)"),
    ("A12", S, "DPI x LOD cap 4 -> 5",
     "pub const BADGE_MAX_TOTAL_SCALE: f64 = 4.0;", "pub const BADGE_MAX_TOTAL_SCALE: f64 = 5.0;"),
    ("A13", S, "DPI cap 3 -> 2",
     "pub const BADGE_MAX_DPR: f64 = 3.0;", "pub const BADGE_MAX_DPR: f64 = 2.0;"),
    ("A14", S, "2048 ceiling not enforced",
     "if w <= limit && h <= limit {", "if true {"),
    ("A15", C, "prune_unused frees nothing",
     ".filter(|k| !live.contains(k.as_str()))", ".filter(|k| live.contains(k.as_str()) && false)"),
    ("A16", C, "LOD purge keeps the wrong level",
     ".filter(|k| !k.ends_with(&keep))", ".filter(|k| k.ends_with(&keep))"),
    ("A17", C, "same-key shortcut removed (re-acquire every sync)",
     "if self.slots.get(id).is_some_and(|s| s.key == key) {", "if false {"),
    ("A18", C, "finish_sync does not prune",
     "let pruned = self.cache.prune_unused(live);", "let pruned = { drop(live); 0 };"),
    ("A19", C, "LOD change does not schedule the purge",
     "self.lod_purge_pending = true;", "self.lod_purge_pending = false;"),
    ("A20", MP, "RGBA8 mip rounding half-up instead of half-even",
     "(MipSpace::Linear, _) => round_half_even_u8(v),", "(MipSpace::Linear, _) => round_half_up_u8(v),"),
    ("A21", MP, "mip tap without the centre offset (box with dropped row)",
     "let p = (i as f32 + 0.5) * ratio - 0.5;", "let p = i as f32 * ratio;"),
    ("A22", MP, "sRGB mips filtered in stored (encoded) space",
     "if space == MipSpace::Srgb && c < 3 {", "if false && c < 3 {"),
    ("A23", MP, "one mip level too few",
     "32 - m.leading_zeros()", "31 - m.leading_zeros()"),
    ("A24", U, "unpremultiply truncates instead of round-half-even",
     "out.push(round_half_even_u8(f64::from(c) * 255.0 / af));",
     "out.push(clamp_trunc(f64::from(c) * 255.0 / af));\n        fn clamp_trunc(v: f64) -> u8 { v.min(255.0) as u8 }"),
    ("A25", U, "LinearFilter textures get a mip chain",
     "MinFilter::Linear => MipChain::single(level0, width, height),",
     "MinFilter::Linear => MipChain::generate(level0, width, height, options.format.mip_space()),"),
    ("A26", U, "straight-alpha colour blend ONE instead of SRC_ALPHA",
     "color: (BlendFactor::SrcAlpha, BlendFactor::OneMinusSrcAlpha),",
     "color: (BlendFactor::One, BlendFactor::OneMinusSrcAlpha),"),
    ("A27", U, "default-filter producers (T1-T6, T15) uploaded as sRGB",
     "(TexFormat::Rgba8Unorm, MinFilter::LinearMipmapLinear)",
     "(TexFormat::Rgba8UnormSrgb, MinFilter::LinearMipmapLinear)"),
    # Round 2 (Evaluator r1 zarzuty 1, 3, 4, 5).
    ("A28", C, "LOD purge matches the suffix anywhere (contains instead of endsWith)",
     ".filter(|k| !k.ends_with(&keep))", ".filter(|k| !k.contains(&keep))"),
    ("A29", U, "unpremultiply keeps RGB for a = 0",
     "out.extend_from_slice(&[0, 0, 0, 0]);", "out.extend_from_slice(&[px[0], px[1], px[2], 0]);"),
    ("A30", G, "read-back usage without COPY_SRC (copy_texture_to_buffer would fail validation)",
     "TEXTURE_USAGE.union(wgpu::TextureUsages::COPY_SRC);", "TEXTURE_USAGE;"),
    # A31 (pass 1) "sRGB RGB re-encode half-even instead of half-up" SURVIVED: an EQUIVALENT
    # mutant — after the non-linear pow an exact .5 practically never occurs (0 differences on
    # the fixture); see 08-mutations-r2-pass1.log and P4-31 §12. Replaced by the alpha channel
    # of sRGB textures, where averages of bytes do hit exact .5 ties.
    ("A31", MP, "sRGB texture alpha rounded half-even instead of half-up",
     "(MipSpace::Srgb, false) => round_half_up_u8(v),",
     "(MipSpace::Srgb, false) => round_half_even_u8(v),"),
]

TEST_CMDS = [
    ["cargo", "test", "--locked", "--lib", "raster::atlas"],
    ["cargo", "test", "--locked", "--test", "atlas_keys", "--test", "atlas_mip", "--test", "atlas_nturns"],
    # Device-free GPU checks (the read-back test itself stays #[ignore]d: no adapter).
    ["cargo", "test", "--locked", "--features", "gpu", "--test", "atlas_gpu"],
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
    print('| ID | file | mutation | result | failing tests |')
    print('|---|---|---|---|---|')
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
            lines = [l for l in err.strip().splitlines() if l.startswith('error')]
            status, who = 'KILLED (build)', lines[0] if lines else 'build error'
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
