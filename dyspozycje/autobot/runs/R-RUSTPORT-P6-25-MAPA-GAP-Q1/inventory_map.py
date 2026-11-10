#!/usr/bin/env python3
"""Inwentarz eksportow gra/src/map (pin edb8fb56). Uzycie: inventory_map.py <katalog_map> > exports.tsv"""
import re, sys, os
d = sys.argv[1]
decl = re.compile(r'^export\s+(?:declare\s+)?(?:default\s+)?(async\s+function\*?|function\*?|const|let|var|class|interface|type|enum|abstract class)\s+([A-Za-z_$][\w$]*)')
rexp = re.compile(r'^export\s+(type\s+)?\{([^}]*)\}(?:\s+from\s+[\'"]([^\'"]+)[\'"])?')
rexp_star = re.compile(r'^export\s+\*')
print("plik\tloc_niepuste\tloc_all\tlinia\tkind\tsymbol\tfrom")
for fn in sorted(os.listdir(d)):
    if not fn.endswith('.ts'): continue
    lines = open(os.path.join(d, fn), encoding='utf-8').read().split('\n')
    loc = sum(1 for l in lines if l.strip())
    i = 0; n = 0
    while i < len(lines):
        l = lines[i]
        m = decl.match(l)
        if m:
            print(f"{fn}\t{loc}\t{len(lines)}\t{i+1}\t{m.group(1).split()[-1]}\t{m.group(2)}\t-"); n += 1
        elif l.startswith('export {') or l.startswith('export type {'):
            j = i; buf = l
            while '}' not in buf and j+1 < len(lines):
                j += 1; buf += ' ' + lines[j]
            # dopisz 'from' z kolejnej linii jesli jest
            k = j
            if 'from' not in buf and k+1 < len(lines) and lines[k+1].strip().startswith('from'):
                buf += ' ' + lines[k+1]
            mm = re.match(r'export\s+(type\s+)?\{([^}]*)\}(?:\s+from\s+[\'"]([^\'"]+)[\'"])?', buf)
            if mm:
                for s in mm.group(2).split(','):
                    s = s.strip()
                    if not s: continue
                    is_type = bool(mm.group(1)) or bool(re.match(r'^type\s+', s))
                    s = re.sub(r'^type\s+', '', s)
                    name = s.split(' as ')[-1].strip()
                    kind = 'reexport-type' if is_type else 'reexport'
                    print(f"{fn}\t{loc}\t{len(lines)}\t{i+1}\t{kind}\t{name}\t{mm.group(3) or '-'}"); n += 1
            i = j
        elif rexp_star.match(l):
            print(f"{fn}\t{loc}\t{len(lines)}\t{i+1}\tstar\t*\t{l}"); n += 1
        i += 1
    if n == 0:
        print(f"{fn}\t{loc}\t{len(lines)}\t0\tnone\t(brak eksportow)\t-")
