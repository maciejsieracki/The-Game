import re, os, sys, json
root = sys.argv[1]  # .../pin/gra
src = os.path.join(root, 'src')
RX = re.compile(r"""(?:^|[\s;])(?:import|export)\s+(?:type\s+)?(?:[\w$*{},\s]+?\s+from\s+)?['"]([^'"\n]+)['"]|import\(\s*['"]([^'"\n]+)['"]\s*\)""", re.M | re.S)
URLRX = re.compile(r"""new\s+URL\(\s*['"]([^'"\n]+)['"]""")
def resolve(f, spec):
    if not spec.startswith('.'):
        return ('pkg', spec)
    p = os.path.normpath(os.path.join(os.path.dirname(f), spec.split('?')[0]))
    for c in [p, p + '.ts', p + '.tsx', p + '/index.ts', p + '.js']:
        if os.path.isfile(c):
            return ('file', c)
    return ('missing', p)
out = {}
for d, _, fs in os.walk(src):
    for n in fs:
        if n.endswith('.ts'):
            f = os.path.join(d, n)
            t = open(f, encoding='utf-8').read()
            lst = []
            for m in RX.finditer(t):
                spec = m.group(1) or m.group(2)
                kind, v = resolve(f, spec)
                line = t.count('\n', 0, m.start(0) + 1) + 1
                lst.append([spec, kind, os.path.relpath(v, root) if kind != 'pkg' else v, line])
            for m in URLRX.finditer(t):
                spec = m.group(1)
                kind, v = resolve(f, spec)
                line = t.count('\n', 0, m.start(0)) + 1
                lst.append([spec, 'url-' + kind, os.path.relpath(v, root) if kind != 'pkg' else v, line])
            out[os.path.relpath(f, root)] = lst
json.dump(out, open(sys.argv[2], 'w'), indent=0)
