#!/usr/bin/env python3
"""Mutation check for R-RUSTPORT-P4-13 unit_core tests.

Each mutation replaces exactly one source snippet (must occur exactly once),
runs the unit_core tests, records whether they FAILED (= mutation detected),
and restores the original file byte-for-byte. Run from anywhere:
  python3 -I mutate.py <renderer-dir>
"""
import pathlib
import subprocess
import sys

R = pathlib.Path(sys.argv[1])
U = 'src/models/unit_core/'
MUT = [
    ('M01 fdlibm S1 constant', U + 'jstrig.rs', 'const S1: f64 = -1.66666666666666324348e-01;', 'const S1: f64 = -1.66666666666666e-01;'),
    ('M02 libm sin/cos in Euler->quat', U + 'model.rs', 'let c1 = (eu.x / 2.0).js_cos();', 'let c1 = (eu.x / 2.0).cos();'),
    ('M03 p1 fist offset 0.014', U + 'p1.rs', '.set_pos_v(wrist.plus(p1_dir(th_f).scale(0.014 * HEX_R)));', '.set_pos_v(wrist.plus(p1_dir(th_f).scale(0.015 * HEX_R)));'),
    ('M04 galera material order', U + 'galera.rs', '    let m_eye_w = m.mat(EYE_WHITE, 0.02, 0.60);\n    let m_eye_d = m.mat(EYE_DARK, 0.05, 0.55);', '    let m_eye_d = m.mat(EYE_DARK, 0.05, 0.55);\n    let m_eye_w = m.mat(EYE_WHITE, 0.02, 0.60);'),
    ('M05 rule order taran okuty / taran', U + 'routing.rs', 'if has("taran okuty") || has("bronze-shod ram") || has("bronze shod ram") {', 'if has("taran okuty-x") {'),
    ('M06 cultureFromName drops "ink"', U + 'routing.rs', '        || has("ink")\n', ''),
    ('M07 skip list without miecznik', U + 'category.rs', '                | Self::Miecznik\n', ''),
    ('M08 embark scale 0.78', U + 'category.rs', 'n.scale = n.scale.scale(0.78);', 'n.scale = n.scale.scale(0.79);'),
    ('M09 celtic retint crest missing', U + 'category.rs', 'let crest = m.retint(COLOR_RED_VIV, COLOR_TROUSERS);', 'let crest = 0;'),
    ('M10 rule table row', U + 'routing.rs', '("Taran okuty", Base::TaranOkutyOpus5),', '("Taran okuty", Base::BatteringRam),'),
    ('M11 normName keeps combining marks', U + 'routing.rs', "        if ('\\u{300}'..='\\u{36f}').contains(&c) {\n            continue;\n        }\n", ''),
    ('M12 horse leg upper length rear', U + 'horse.rs', 'let lu = if rear { 0.092 * HEX_R } else { 0.088 * HEX_R };', 'let lu = if rear { 0.090 * HEX_R } else { 0.088 * HEX_R };'),
    ('M13 decorateChariot sub not rotated', U + 'category.rs', '    let sub = m.add_group(ROOT);\n    m.node(sub).rot_y(PI);', '    let sub = m.add_group(ROOT);'),
    ('M14 legion fall-through removed', U + 'routing.rs', 'if has("legion") && !has("hastati") {\n        return None;', 'if has("legion-x") && !has("hastati") {\n        return None;'),
    ('M15 super whitelist entry', U + 'routing.rs', '        "qurubuti",\n    ];', '        "qurubuti-x",\n    ];'),
    ('M16 base avatar eye offset', U + 'avatar.rs', 'let eye_x_off = 0.030 * HEX_R;', 'let eye_x_off = 0.031 * HEX_R;'),
    ('M17 setFromUnitVectors w term', U + 'model.rs', '        w = r;\n    }\n    let l', '        w = r * 1.0000001;\n    }\n    let l'),
    ('M18 leaf blade layer z', U + 'model.rs', 'quad(w1, y1, w2, y2, -0.006, true);', 'quad(w1, y1, w2, y2, -0.005, true);'),
    ('M19 culture overlay sumer colour', U + 'category.rs', 'let m_cop = m.mat(0xc8_843e, 0.55, 0.32);', 'let m_cop = m.mat(0xc8_843f, 0.55, 0.32);'),
    ('M20 named unused crossbow fletch', U + 'named_unused.rs', '.set_pos(cb_x, cb_y + 0.020 * HEX_R, cb_z + 0.10 * HEX_R);', '.set_pos(cb_x, cb_y + 0.021 * HEX_R, cb_z + 0.10 * HEX_R);'),
    ('M21 Euler ZYX arm sign (obrona r1, zarzut 5)', U + 'model.rs', 'EulerOrder::Zyx => (\n            s1 * c2 * c3 - c1 * s2 * s3,', 'EulerOrder::Zyx => (\n            s1 * c2 * c3 + c1 * s2 * s3,'),
    ('M22 Euler order ignored = old release behaviour (obrona r1, zarzut 5)', U + 'model.rs', 'let (x, y, z, w) = match eu.order {', 'let (x, y, z, w) = match {\n        let _ = eu.order;\n        EulerOrder::Xyz\n    } {'),
]

TESTS = ['--test', 'unit_core_web_parity', '--test', 'unit_core_model_rule', '--test', 'unit_core_trig']
detected = 0
build_errors = 0
for name, rel, old, new in MUT:
    p = R / rel
    orig = p.read_bytes()
    text = orig.decode()
    n = text.count(old)
    if n != 1:
        print(f'{name}: SNIPPET COUNT {n} (skipped)')
        continue
    p.write_text(text.replace(old, new, 1))
    try:
        res = subprocess.run(['cargo', 'test', '--locked', '--no-fail-fast', *TESTS], cwd=R, capture_output=True, text=True)
        failing = [l for l in res.stdout.splitlines() if l.startswith('test ') and l.endswith('FAILED')]
        # Obrona r1: a non-zero exit without any FAILED test is a build/infra
        # error (e.g. ENOSPC in the linker), not a killed mutant.
        if res.returncode != 0 and not failing:
            build_errors += 1
            tail = [l for l in res.stderr.splitlines() if l.strip()][-1:]
            print(f'{name}: BUILD-ERROR (not counted) {tail}')
            continue
        killed = res.returncode != 0
        detected += killed
        print(f'{name}: {"DETECTED" if killed else "SURVIVED"} {failing}')
    finally:
        p.write_bytes(orig)
        assert p.read_bytes() == orig, f'{rel} not restored'
print(f'detected {detected}/{len(MUT)}, build errors {build_errors}')
sys.exit(0 if detected == len(MUT) and build_errors == 0 else 1)
