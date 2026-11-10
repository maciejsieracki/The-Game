import sys

p, old, new = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(p, encoding="utf-8").read()
if old not in s:
    sys.exit("brak wzorca: " + old)
open(p, "w", encoding="utf-8").write(s.replace(old, new, 1))
