import sys
parts = sys.argv[1:-1]
out = sys.argv[-1]
txt = ''.join(open(p, encoding='utf-8').read() for p in parts)
open(out, 'w', encoding='utf-8', newline='\n').write(txt)
print(len(txt.splitlines()), 'lines')
