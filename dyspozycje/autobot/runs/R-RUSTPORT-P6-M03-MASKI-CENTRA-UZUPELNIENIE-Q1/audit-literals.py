import re
import sys

path, start = sys.argv[1], int(sys.argv[2])
lines = open(path, encoding='utf8').read().split('\n')
tok = re.compile(r'(?<![A-Za-z_0-9.])(\d[\d_]*(?:\.\d[\d_]*)?(?:e-?\d+)?)(?![A-Za-z_0-9]|\.\d)')
counts = {}
rows = []
for i, line in enumerate(lines[start - 1:], start):
    code = re.sub(r'//.*$', '', line)
    code = re.sub(r'"[^"]*"', '""', code)
    for m in tok.finditer(code):
        v = m.group(1)
        counts.setdefault(v, []).append(i)
        rows.append((i, v, line.strip()))
for i, v, line in rows:
    print(f'{i}: {v}   | {line}')
print('--- PODSUMOWANIE tokenow (wartosc: liczba wystapien) ---')
for v, ls in sorted(counts.items(), key=lambda kv: (float(kv[0].replace('_', '')), kv[0])):
    print(f'{v}: {len(ls)} (linie {", ".join(map(str, ls[:12]))}{"..." if len(ls) > 12 else ""})')
