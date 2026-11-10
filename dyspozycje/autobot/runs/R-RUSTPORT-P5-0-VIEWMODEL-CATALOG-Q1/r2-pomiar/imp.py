import os, re, sys, json, collections
ROOT = sys.argv[1]  # .../gra/src
UI = os.path.join(ROOT, 'ui')
CATS = ('game', 'map', 'units', 'data', 'battle', 'render')
imp_re = re.compile(r'^[ \t]*(import|export)\s+(type\s+)?(\{[^}]*\}|[\w$]+(?:\s*,\s*\{[^}]*\})?|\*\s+as\s+[\w$]+)\s+from\s+[\'"]([^\'"]+)[\'"]', re.M)
res = {}
for dp, _, fs in os.walk(UI):
    for f in fs:
        if not f.endswith('.ts'):
            continue
        p = os.path.join(dp, f)
        src = open(p, encoding='utf-8').read()
        for m in imp_re.finditer(src):
            spec = m.group(4)
            if not spec.startswith('.'):
                continue
            tgt = os.path.normpath(os.path.join(os.path.dirname(p), spec))
            rel = os.path.relpath(tgt, ROOT)
            parts = rel.split(os.sep)
            top = parts[0]
            if top == '..' and len(parts) > 1 and parts[1] == 'data':
                rel = 'gra-data/' + '/'.join(parts[2:]); top = 'gra-data'
            elif top not in CATS:
                continue
            line = src.count('\n', 0, m.start()) + 1
            body = m.group(3)
            names = re.findall(r'(?:type\s+)?([A-Za-z_$][\w$]*)(?:\s+as\s+[\w$]+)?', body.replace('{', ' ').replace('}', ' ').replace(',', ' , '))
            names = [n for n in names if n not in ('type', 'as', '*')]
            res.setdefault(os.path.relpath(p, ROOT), []).append({
                'line': line, 'kw': m.group(1), 'typeonly': bool(m.group(2)), 'mod': rel.replace(os.sep, '/'),
                'body': ' '.join(body.split())})
json.dump(res, open(sys.argv[2], 'w'), indent=1, ensure_ascii=False)
tot = sum(len(v) for v in res.values())
print('files', len(res), 'importlines', tot)
c = collections.Counter(i['mod'].split('/')[0] for v in res.values() for i in v)
print(c)

for f in sorted(res):
    loc = open(os.path.join(ROOT, f), encoding='utf-8').read().count('\n')
    print(f, loc, len(res[f]), sorted({i['mod'] for i in res[f]}))
