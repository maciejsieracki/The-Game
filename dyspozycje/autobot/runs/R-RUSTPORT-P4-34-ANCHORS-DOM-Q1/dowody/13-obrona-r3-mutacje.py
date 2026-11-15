import subprocess, sys, os
root = sys.argv[1]
f = os.path.join(root, 'src/labels/anchor.rs')
orig = open(f).read()
muts = [
 ('E6', 'world_to_client_px: usuniety warunek rect.height <= 0',
  'if rect.width <= 0.0 || rect.height <= 0.0 {', 'if rect.width <= 0.0 {'),
 ('E7', 'siege_label_position: wp.z > 1 -> wp.z >= 1',
  '    if wp.z > 1.0 {\n        return None;\n    }\n    let px', '    if wp.z >= 1.0 {\n        return None;\n    }\n    let px'),
 ('O3', 'world_to_client_px: v.z > 1 -> v.z >= 1',
  '    let v = cam.project(p);\n    if v.z > 1.0 {\n        return None;\n    }\n    if rect.width',
  '    let v = cam.project(p);\n    if v.z >= 1.0 {\n        return None;\n    }\n    if rect.width'),
 ('O4', 'js_round: -0 dla x w [-0.5, 0) (Math.round zamiast wartosci CSS)',
  '    if x - f >= 0.5 {\n        f + 1.0\n', '    if x - f >= 0.5 {\n        (f + 1.0).copysign(x)\n'),
]
for mid, desc, a, b in muts:
    assert orig.count(a) == 1, mid
    open(f, 'w').write(orig.replace(a, b))
    try:
        r = subprocess.run(['cargo', 'test', '--locked', '--test', 'labels_anchors'], cwd=root, capture_output=True, text=True)
        out = r.stdout + r.stderr
        failed = [l for l in out.splitlines() if l.startswith('test ') and l.endswith('FAILED')]
        print(f'{mid} | {desc} | exit={r.returncode} | {"ZABITA" if r.returncode != 0 else "PRZEZYLA"} | {failed}', flush=True)
    finally:
        open(f, 'w').write(orig)
print('restored', open(f).read() == orig)
