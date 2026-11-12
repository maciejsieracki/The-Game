import os, re, sys
root = sys.argv[1]
tests = os.path.join(root, "rust-port/engine/tests")
vec = {}
for line in open(sys.argv[2], encoding="utf-8"):
    parts = line.rstrip("\n").split("\t")
    if len(parts) == 3:
        vec[os.path.basename(parts[0])] = (parts[1], parts[2])
rows = []
for dp, dn, fn in os.walk(tests):
    if "/fixtures" in dp:
        continue
    for f in sorted(fn):
        if not f.endswith(".rs"):
            continue
        p = os.path.join(dp, f)
        src = open(p, encoding="utf-8", errors="replace").read()
        n_test = len(re.findall(r"#\[test\]", src))
        refs = sorted(set(re.findall(r"([A-Za-z0-9_\-]+\.json)", src)))
        refs_v = [r for r in refs if r in vec]
        rel = os.path.relpath(p, root)
        if n_test == 0 and not refs_v:
            continue
        cases = "; ".join(f"{r}={vec[r][1]}" for r in refs_v)
        rows.append(f"{rel}\t{n_test}\t{cases if cases else '-'}")
for r in rows:
    print(r)
