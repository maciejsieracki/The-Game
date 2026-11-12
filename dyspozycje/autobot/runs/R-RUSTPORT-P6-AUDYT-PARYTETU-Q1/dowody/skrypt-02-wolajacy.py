import os, re, sys
root = sys.argv[1]
eng = os.path.join(root, "rust-port/engine")
srcdirs = [os.path.join(eng, "src"), os.path.join(eng, "benches")]

def prod_text(path):
    s = open(path, encoding="utf-8", errors="replace").read()
    # heuristic: drop #[cfg(test)] blocks (usually trailing module) and tests files
    idx = s.find("#[cfg(test)]")
    if idx >= 0:
        s = s[:idx]
    return s

files = []
for d in srcdirs:
    for dp, dn, fn in os.walk(d):
        for f in fn:
            if f.endswith(".rs"):
                files.append(os.path.join(dp, f))

prod = {p: prod_text(p) for p in files}

mods = []
for p in files:
    if "/src/domain/" in p:
        stem = os.path.splitext(os.path.basename(p))[0]
        if stem == "mod":
            continue
        mods.append((stem, p))

for stem, own in sorted(mods):
    pat = re.compile(r"\b" + re.escape(stem) + r"\b")
    callers = []
    for p, s in prod.items():
        if p == own:
            continue
        if os.path.basename(p) in ("mod.rs",) and "domain" in p:
            # mod.rs declares modules; count only if it has a non-mod-declaration use
            lines = [l for l in s.splitlines() if pat.search(l) and not re.match(r"\s*(pub\s+)?mod\s", l)]
            if not lines:
                continue
        if pat.search(s):
            callers.append(os.path.relpath(p, root))
    print(f"{stem}\t{len(callers)}\t{os.path.relpath(own, root)}\t{' '.join(callers[:4])}")
