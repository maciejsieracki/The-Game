"""Przydział rekordów units.json do PLIKÓW z geometrią (§2.1d, §4.2 paczki 4–7).

Dla każdej trasy PL z route.py: jeśli funkcja jest importowana w units.ts -> plik źródłowy importu;
jeśli zdefiniowana w units.ts -> pliki importowanych funkcji wołanych w jej ciele (opakowanie),
a gdy brak takich wywołań -> units.ts (geometria w pliku). buildCategoryModel('x') -> ciało `case 'x'`.
Uruchom: python3 -I .../skrypty/unitfiles.py
"""
import os
import re
import sys
from collections import defaultdict
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import route  # noqa: E402

SRC = route.SRC
L = route.L

# importowane nazwy -> plik
imported = {}
for m in re.finditer(r"import\s*\{([^}]*)\}\s*from\s*'\./([^']+)'", SRC):
    for part in m.group(1).split(','):
        part = part.strip()
        if not part or part.startswith('type '):
            continue
        local = part.split(' as ')[-1].strip()
        imported[local] = m.group(2).replace('.ts', '') + '.ts'


def body_of(fn):
    i = next((k for k, l in enumerate(L) if re.match(r'^(export )?function ' + re.escape(fn) + r'\(', l)), None)
    if i is None:
        return None
    j = i
    while L[j] != '}':
        j += 1
    return '\n'.join(L[i:j + 1])


def case_body(cat):
    b = body_of('buildCategoryModel')
    m = re.search(r"case '" + cat + r"'\s*:(.*?)(?=\n\s*case '|\n\s*default\s*:)", b, re.S)
    return m.group(1) if m else ''


def files_for(fn, depth=0):
    if fn in imported:
        return {imported[fn]}
    b = body_of(fn)
    if b is None or depth > 3:
        return {'units.ts'}
    called = {c for c in re.findall(r'\b(\w+)\(', b) if c in imported}
    code = [x for x in b.split('\n') if x.strip() and not x.strip().startswith(('//', '*', '/*'))]
    if called:
        out = set()
        for c in called:
            out |= files_for(c, depth + 1)
        if len(code) > 8:      # funkcja ma też własną geometrię w units.ts (nie jest samym opakowaniem)
            out.add('units.ts')
        return out
    # opakowanie na inną funkcję lokalną
    inner = [c for c in re.findall(r'return\s+(\w+)\(', b) if c != fn and body_of(c)]
    if inner and len(b.split('\n')) <= 8:
        return files_for(inner[0], depth + 1)
    return {'units.ts'}


per_file = defaultdict(list)
rec_files = []
for r in route.rows:
    name, ep, tgt = r[0], r[2], r[5]
    m = re.match(r"buildCategoryModel\('(\w+)'\)", tgt)
    if m:
        cb = case_body(m.group(1))
        fs = {imported[c] for c in re.findall(r'\b(\w+)\(', cb) if c in imported} or {'units.ts'}
    elif tgt == 'decorateChariot':
        fs = {'units.ts'}  # decorateChariot + case 'rydwan' (oba w units.ts)
        cb = case_body('rydwan')
        fs |= {imported[c] for c in re.findall(r'\b(\w+)\(', cb) if c in imported}
    else:
        fs = files_for(tgt)
    rec_files.append((name, ep, tgt, sorted(fs)))
    for f in fs:
        per_file[f].append(f'{name} [{ep}]')

if __name__ == '__main__':
    for name, ep, tgt, fs in rec_files:
        print(f'{name} | {ep} | {tgt} | {",".join(fs)}')
    print()
    for f in sorted(per_file):
        eps = defaultdict(int)
        for x in per_file[f]:
            eps[x.rsplit('[', 1)[1][:-1]] += 1
        print(f'FILE {f} | {len(per_file[f])} rek. | epoki {dict(eps)} | {"; ".join(per_file[f])}')
    unit_files = sorted({v for v in imported.values()})
    print('\nIMPORTED_MODEL_FILES', len(unit_files))
    print('FILES_WITHOUT_RECORD', [f for f in unit_files if f not in per_file])
    print('\n# modele nazwane bez rekordu (route.py UNUSED_BY_PL) + martwe -> pliki')
    for fn in ['buildCeltWarrior', 'buildCrossbowman', 'buildGermanWarrior', 'buildHierosLochos', 'buildLegionRzymski',
               'buildHastati', 'buildBerserker']:
        print('UNUSED', fn, '->', sorted(files_for(fn)))
    print('\n# ścieżka EN (route.py EN_DIFF) -> pliki')
    for r in route.rows:
        if r[5] != r[7]:
            m = re.match(r"buildCategoryModel\('(\w+)'\)", r[7])
            fs = ({imported[c] for c in re.findall(r'\b(\w+)\(', case_body(m.group(1))) if c in imported} or {'units.ts'}) \
                if m else files_for(r[7])
            print('EN', r[1], '->', r[7], '->', sorted(fs))
