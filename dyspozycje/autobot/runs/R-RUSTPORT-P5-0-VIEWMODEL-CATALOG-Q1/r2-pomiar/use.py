import json, re, sys, os
ROOT = sys.argv[1]
d = json.load(open(sys.argv[2]))
out = {}
for f in sorted(d):
    src = open(os.path.join(ROOT, f), encoding='utf-8').read().split('\n')
    rows = []
    for i in d[f]:
        body = i['body']
        if '=' in body and '{' not in body[:2]:
            # default import name or garbage
            pass
        syms = []
        m = re.match(r'^\{(.*?)\}', body)
        if m:
            for part in m.group(1).split(','):
                part = part.strip()
                if not part:
                    continue
                t = part.startswith('type ')
                part = part[5:] if t else part
                nm = part.split(' as ')[-1].strip()
                syms.append((nm, t or i['typeonly']))
        else:
            nm = body.split()[-1] if body else ''
            if i['kw'] == 'import':
                syms.append((nm, i['typeonly']))
        for nm, t in syms:
            pat = re.compile(r'(?<![\w$.])' + re.escape(nm) + r'(?![\w$])')
            lines = [n + 1 for n, l in enumerate(src) if pat.search(l) and not (i['line'] <= n + 1 <= i['line'] + 40 and ('import' in l or l.strip().startswith(nm) or l.strip().startswith('type ' + nm) or l.strip().startswith('}')))]
            rows.append({'mod': i['mod'], 'imp': i['line'], 'sym': nm, 'type': t, 'uses': len(lines), 'at': lines[:6]})
    out[f] = rows
json.dump(out, open(sys.argv[3], 'w'), indent=0, ensure_ascii=False)
for f, rows in out.items():
    print('##', f)
    for r in rows:
        print(f"  {r['mod']}:{r['sym']}{' [T]' if r['type'] else ''} imp:{r['imp']} uses={r['uses']} at={r['at']}")
