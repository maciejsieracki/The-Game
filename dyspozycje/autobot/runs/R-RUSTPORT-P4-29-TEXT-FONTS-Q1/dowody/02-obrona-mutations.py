import subprocess
R = '/home/user/The-Game/.claude/worktrees/wf_ba6243e3-648-3/rust-port/renderer'
M = [
    ('O1-E03 truncate_name fit <= -> <', 'src/raster/text/mod.rs', 'if ctx.measure_text(name).width <= max_w {', 'if ctx.measure_text(name).width < max_w {', 'text_metrics'),
    ('O2-E09 hover len>1 -> >2', 'src/raster/text/mod.rs', 'max_w && units.len() > 1 {', 'max_w && units.len() > 2 {', 'text_metrics'),
    ('O3-E05 bolder -> 400', 'src/raster/text/font.rs', '"bold" | "bolder" => 700,', '"bold" => 700,\n                            "bolder" => 400,', 'text_metrics'),
    ('O4 name loop > -> >=', 'src/raster/text/mod.rs', 'while s.len() > 1 && ctx.measure_text(&(utf16_lossy(&s) + "…")).width > max_w {\n        s.pop();\n    }\n    utf16_lossy(&s) + "…"\n}', 'while s.len() > 1 && ctx.measure_text(&(utf16_lossy(&s) + "…")).width >= max_w {\n        s.pop();\n    }\n    utf16_lossy(&s) + "…"\n}', 'text_metrics'),
    ('O5 hover fit > -> >=', 'src/raster/text/mod.rs', 'if ctx.measure_text(line).width > max_w && units', 'if ctx.measure_text(line).width >= max_w && units', 'text_metrics'),
    ('O6 hover loop guard >1 -> nonempty', 'src/raster/text/mod.rs', '        while s.len() > 1 && ctx', '        while !s.is_empty() && ctx', 'text_metrics'),
    ('O7 width +1 ulp', 'src/raster/text/mod.rs', 'ShapedText { glyphs, width: pen }', 'ShapedText { glyphs, width: pen * (1.0 + f64::EPSILON) }', 'text_metrics'),
    ('O8 fixture tamper versions.txt', 'tests/fixtures/text/versions.txt', None, 'X', 'text_fonts'),
    ('O9 fixture tamper ref rgba 1 bit', 'tests/fixtures/text/ref/t10_glyph_civ.rgba', None, 'BYTE', 'text_fonts'),
]
for name, f, a, b, t in M:
    p = R + '/' + f
    orig = open(p, 'rb').read()
    if a is None:
        if b == 'BYTE':
            d = bytearray(orig)
            d[100] ^= 1
            new = bytes(d)
        else:
            new = orig + b.encode()
    else:
        s = orig.decode()
        assert s.count(a) == 1, (name, s.count(a))
        new = s.replace(a, b).encode()
    open(p, 'wb').write(new)
    try:
        r = subprocess.run(['cargo', 'test', '--locked', '--test', t], cwd=R, capture_output=True, text=True)
        res = 'KILLED' if r.returncode != 0 else 'SURVIVED'
        failed = [l for l in r.stdout.splitlines() if l.endswith('FAILED') and l.startswith('test ')]
        print(f'{name}\t{res}\t{";".join(failed)}', flush=True)
    finally:
        open(p, 'wb').write(orig)
