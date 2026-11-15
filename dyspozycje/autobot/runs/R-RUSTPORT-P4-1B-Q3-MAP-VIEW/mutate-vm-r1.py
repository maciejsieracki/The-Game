"""Mutacja reguly dlugosci w view-model/src/validate.rs: test validate musi byc czerwony."""
import os
import subprocess
import sys

ROOT = sys.argv[1]  # rust-port/view-model
OUT = sys.argv[2]
SRC = os.path.join(ROOT, 'src/validate.rs')
OLD = """    len(
        "map.riverRenderPaths",
        map.rivers.len(),
        map.river_render_paths.len(),
    )?;
"""
orig = open(SRC).read()
assert orig.count(OLD) == 1
try:
    open(SRC, 'w').write(orig.replace(OLD, ''))
    p = subprocess.run(['cargo', 'test', '--test', 'validate'], cwd=ROOT, capture_output=True, text=True)
    out = p.stdout + p.stderr
    failed = [l.split()[1] for l in out.splitlines() if l.startswith('test ') and l.endswith('FAILED')]
    verdict = 'WYKRYTA' if p.returncode != 0 and failed else 'NIEWYKRYTA'
    line = f'{verdict:10} | M8 brak reguly riverRenderPaths.len == rivers.len (view-model) | exit={p.returncode} | czerwone: {", ".join(failed)}'
finally:
    open(SRC, 'w').write(orig)
print(line)
with open(OUT, 'a') as f:
    f.write(line + '\n')
