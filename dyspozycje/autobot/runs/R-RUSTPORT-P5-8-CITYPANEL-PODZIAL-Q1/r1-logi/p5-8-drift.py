import re, sys, collections
sys.argv = ['inv.py', '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/cityPanel-pin.ts', '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/inv.json']
src = open('/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tools/inv.py', encoding='utf-8').read()
ns = {}
exec(compile(src.split('# SCC (Tarjan)')[0].replace('print(', '(lambda *a, **k: None)('), 'inv', 'exec'), ns)
sec_of = ns['sec_of']
cnt = collections.Counter(); lines_touched = collections.Counter()
for l in open('/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/drift-hunks.txt', encoding='utf-8'):
    m = re.match(r'@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@', l)
    if not m: continue
    a = int(m.group(1)); b = int(m.group(2)) if m.group(2) is not None else 1
    s = sec_of.get(max(a, 1), '?')
    cnt[s] += 1
    lines_touched[s] += b
for s in sorted(cnt, key=lambda x: (len(x), x)):
    print(s, 'hunks', cnt[s], 'old_lines_touched', lines_touched[s])
print('total hunks', sum(cnt.values()))
