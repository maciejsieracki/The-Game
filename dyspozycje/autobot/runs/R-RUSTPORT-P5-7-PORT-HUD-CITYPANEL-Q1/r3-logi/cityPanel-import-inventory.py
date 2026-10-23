#!/usr/bin/env python3
"""Inwentarz importów `gra/src/ui/cityPanel.ts` (pin edb8fb56) — P5.7 r3, przygotowanie portu r4.

Użycie: python3 -I cityPanel-import-inventory.py <PIN_DIR>/gra/src/ui/cityPanel.ts
Dla każdego modułu źródłowego: linie importu, każdy symbol (typ / wartość), liczba wierszy użycia poza blokiem importów
oraz pierwsze 8 numerów wierszy. Liczenie = wystąpienie identyfikatora jako całego słowa (nie po kropce).
"""
import re
import sys

src = open(sys.argv[1], encoding='utf8').read()
lines = src.split('\n')
imps = []
for m in re.finditer(r'^import\s+(type\s+)?(\{[^}]*\}|[\w*$\s,]+?)\s+from\s+[\'"]([^\'"]+)[\'"];?', src, re.M):
    ln = src[:m.start()].count('\n') + 1
    end = src[:m.end()].count('\n') + 1
    is_type = bool(m.group(1))
    body = m.group(2).strip()
    names = []
    if body.startswith('{'):
        for part in body[1:-1].split(','):
            part = part.strip()
            if not part:
                continue
            t = is_type
            if part.startswith('type '):
                t = True
                part = part[5:].strip()
            names.append((part.split(' as ')[-1].strip(), t))
    else:
        for part in body.split(','):
            part = part.strip()
            if part.startswith('* as '):
                part = part[5:].strip()
            if part:
                names.append((part, is_type))
    imps.append((ln, end, m.group(3), names))
for m in re.finditer(r'^import\s+[\'"]([^\'"]+)[\'"];', src, re.M):
    ln = src[:m.start()].count('\n') + 1
    imps.append((ln, ln, m.group(1), []))
import_lines = set()
for ln, end, _, _ in imps:
    import_lines.update(range(ln, end + 1))
bymod = {}
for ln, end, mod, names in imps:
    bymod.setdefault(mod, []).append((ln, end, names))
tot = 0
tot_val = 0
cats = {}
for mod in sorted(bymod, key=lambda x: (not x.startswith('../'), x)):
    entries = bymod[mod]
    cat = mod.split('/')[1] if mod.startswith('../') else ('ui' if mod.startswith('./') else 'pakiet')
    print(f'## {mod}  [{cat}]  (import @ ' + ', '.join(f':{a}' if a == b else f':{a}-{b}' for a, b, _ in entries) + ')')
    for _, _, names in entries:
        for nm, t in names:
            rx = re.compile(r'(?<![\w$.])' + re.escape(nm) + r'(?![\w$])')
            uses = [i + 1 for i, l in enumerate(lines) if (i + 1) not in import_lines and rx.search(l)]
            tot += 1
            if not t:
                tot_val += 1
            cats.setdefault(cat, [0, 0])
            cats[cat][0] += 1
            cats[cat][1] += 0 if t else 1
            print(f'  {"typ  " if t else "wart."} {nm}: wierszy_użycia={len(uses)} pierwsze={uses[:8]}')
print('# podsumowanie wg katalogu (symbole / w tym wartości): ' + ', '.join(f'{k}={v[0]}/{v[1]}' for k, v in sorted(cats.items())))
print(f'# modułów_źródłowych={len(bymod)} symboli={tot} wartości={tot_val} typów={tot - tot_val} LOC={len(lines) - (1 if src.endswith(chr(10)) else 0)}')
