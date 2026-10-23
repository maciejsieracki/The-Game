"""Kontrole negatywne weryfikatora Python P6.M03.
1) zmiana jednej komorki wektora masks.json -> >= 1 rozbieznosc,
2) podmiana fpow na math.pow -> wiele rozbieznosci,
3) podmiana fhypot na math.hypot -> wiele rozbieznosci,
4) podmiana fsin na math.sin -> wiele rozbieznosci.
Kazdy wariant to kopia weryfikatora + kopia katalogu wektorow w katalogu tymczasowym."""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

root, vec, engine = sys.argv[1], sys.argv[2], sys.argv[3]
src = open('/home/user/scratch-m03/gen/verify-m03-web.py', encoding='utf8').read()
tmp = tempfile.mkdtemp(prefix='m03-neg-', dir='/home/user/scratch-m03')


def run(name, code, vec_dir):
    path = os.path.join(tmp, f'{name}.py')
    open(path, 'w', encoding='utf8').write(code)
    p = subprocess.run(['python3', '-I', path, root, vec_dir, engine], capture_output=True, text=True)
    lines = [l for l in p.stdout.splitlines() if l.startswith(('SPRAWDZEN', 'ROZBIEZNOSCI'))]
    print(f'{name}: exit={p.returncode} ' + ' | '.join(lines))


# 1. zmieniony wektor
vdir = os.path.join(tmp, 'vec')
shutil.copytree(vec, vdir)
m = json.load(open(f'{vdir}/masks.json', encoding='utf8'))
case = next(c for c in m['cases'] if 'values' in c and c['type'] == 'wyspy' and c['w'] == 36)
old = case['values'][500]
case['values'][500] = '0.5' if old != '0.5' else '0.25'
json.dump(m, open(f'{vdir}/masks.json', 'w', encoding='utf8'))
run('neg1-zmieniony-wektor', src, vdir)

# 2-4. podmiana funkcji na libm
a = src.replace('def fpow(x, y):', 'def fpow(x, y):\n    try:\n        return math.pow(x, y)\n    except (ValueError, OverflowError):\n        return _fpow_orig(x, y)\n\n\ndef _fpow_orig(x, y):', 1)
run('neg2-pow-libm', a, vec)
b = src.replace('def fhypot(a, b):', 'def fhypot(a, b):\n    return math.hypot(a, b)\n\n\ndef _fhypot_orig(a, b):', 1)
run('neg3-hypot-libm', b, vec)
c = src.replace('def fsin(x):', 'def fsin(x):\n    try:\n        return math.sin(x)\n    except ValueError:\n        return NAN\n\n\ndef _fsin_orig(x):', 1)
run('neg4-sin-libm', c, vec)
shutil.rmtree(tmp)
