# R-RUSTPORT-P4-29-TEXT-FONTS-Q1 — obrona r3: mutacje zarzutów 1–5 Evaluatora r3 (E4, E6, E7, E9, E11, M20).
# Kryterium: mutant ZABITY, jeśli padnie co najmniej jeden NOWY test obrony r3
# (tests/text_edge_cases.rs albo text_scenes::rotated_text_origin_is_not_quantised).
# Złoty hash (scenes_match_golden_hashes) celowo NIE liczy się do kryterium (zarzut 5).
# Uruchomienie: python3 05-obrona-r3-mutations.py <ścieżka rust-port/renderer>
# (CARGO_TARGET_DIR poza repo, CARGO_INCREMENTAL=0 itd. z otoczenia).
import subprocess
import sys

R = sys.argv[1]
MOD = 'src/raster/text/mod.rs'
M = [
    ('R3-E4a prepare: \\n nie zamieniany', MOD,
     "'\\t' | '\\n' | '\\u{0C}' | '\\r' => ' ',", "'\\t' | '\\u{0C}' | '\\r' => ' ',"),
    ('R3-E4b prepare: \\r nie zamieniany', MOD,
     "'\\t' | '\\n' | '\\u{0C}' | '\\r' => ' ',", "'\\t' | '\\n' | '\\u{0C}' => ' ',"),
    ('R3-E4c prepare: \\f nie zamieniany', MOD,
     "'\\t' | '\\n' | '\\u{0C}' | '\\r' => ' ',", "'\\t' | '\\n' | '\\r' => ' ',"),
    ('R3-E6 y_offset: odwrocony znak', MOD,
     'y: -f64::from(pos.y_offset) * k,', 'y: f64::from(pos.y_offset) * k,'),
    ('R3-E6b y_offset: pominiety', MOD,
     'y: -f64::from(pos.y_offset) * k,', 'y: 0.0,'),
    ('R3-E9 x_offset: pominiety', MOD,
     'x: pen + f64::from(pos.x_offset) * k,', 'x: pen,'),
    ('R3-E9b x_offset: odwrocony znak', MOD,
     'x: pen + f64::from(pos.x_offset) * k,', 'x: pen - f64::from(pos.x_offset) * k,'),
    ('R3-E7 draw_text: brak straznika is_finite', MOD,
     'if !(x.is_finite() && y.is_finite()) {\n            return;\n        }',
     'if false {\n            return;\n        }'),
    ('R3-E11a utf16_lossy: samotny surogat usuniety', MOD,
     'String::from_utf16_lossy(units)',
     'char::decode_utf16(units.iter().copied()).filter_map(Result::ok).collect()'),
    ('R3-E11b utf16_lossy: samotny surogat -> ?', MOD,
     'String::from_utf16_lossy(units)',
     "char::decode_utf16(units.iter().copied()).map(|r| r.unwrap_or('?')).collect()"),
    ('R3-M20 kwantyzacja poczatku glifu takze przy obrocie', MOD,
     'let snap = ctm.is_axis_aligned();', 'let snap = true;'),
]
NEW = [
    ['cargo', 'test', '--locked', '--test', 'text_edge_cases'],
    ['cargo', 'test', '--locked', '--test', 'text_scenes', 'rotated_text_origin_is_not_quantised'],
]
killed = 0
for name, f, a, b in M:
    p = R + '/' + f
    orig = open(p, 'rb').read()
    s = orig.decode()
    assert s.count(a) == 1, (name, s.count(a))
    open(p, 'wb').write(s.replace(a, b).encode())
    try:
        failed, build_err = [], False
        for cmd in NEW:
            r = subprocess.run(cmd, cwd=R, capture_output=True, text=True)
            if r.returncode != 0 and 'test result' not in r.stdout:
                build_err = True
            failed += [l.split()[1] for l in r.stdout.splitlines() if l.startswith('test ') and l.endswith('FAILED')]
        res = 'KILLED' if failed else ('BUILD-ERROR' if build_err else 'SURVIVED')
        killed += res == 'KILLED'
        print(f'{name}\t{res}\t{";".join(failed)}', flush=True)
    finally:
        open(p, 'wb').write(orig)
print(f'KILLED {killed}/{len(M)}')
