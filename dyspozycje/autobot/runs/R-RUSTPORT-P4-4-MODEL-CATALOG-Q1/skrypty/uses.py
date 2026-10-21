"""Eksportowane `build*/make*` w render/** i liczba ich użyć poza własnym plikiem (gra/src i spoza gra/src).
EXT=0 w gra/src => eksport nieużywany przez grę (ewentualnie tylko narzędzia: kolumna TOOLS).
Uruchom: python3 -I .../skrypty/uses.py
"""
import os
import re
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pin import PIN, sh  # noqa: E402

ex = sh('git', 'grep', '-n', '-E', r'^export (async )?function (build|make)\w+', PIN, '--', 'gra/src/render').strip().split('\n')
seen = set()
for l in ex:
    _, f, ln, rest = l.split(':', 3)
    name = re.search(r'function (\w+)', rest).group(1)
    if (f, name) in seen:
        continue
    seen.add((f, name))

    def users(scope, excl):
        out = sh('git', 'grep', '-l', '-w', name, PIN, '--', *scope).split()
        return [o.split(':', 1)[1] for o in out if o.split(':', 1)[1] != excl]
    ext = users(['gra/src'], f)
    tools = users(['gra', ':!gra/src'], f)
    print(f"{f.replace('gra/src/render/', '')} {name} EXT {len(ext)} TOOLS {len(tools)} {','.join(e.replace('gra/src/', '') for e in ext[:3])}")
