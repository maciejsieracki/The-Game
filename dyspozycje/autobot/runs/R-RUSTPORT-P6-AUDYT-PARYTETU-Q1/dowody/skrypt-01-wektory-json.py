import json, os, sys
root = sys.argv[1]
base = os.path.join(root, "rust-port/engine/tests")
for dp, dn, fn in os.walk(base):
    if "/fixtures" in dp:
        continue
    for f in sorted(fn):
        if not f.endswith(".json"):
            continue
        p = os.path.join(dp, f)
        rel = os.path.relpath(p, root)
        try:
            d = json.load(open(p, encoding="utf-8"))
        except Exception as e:
            print(f"{rel}\tPARSE_ERR\t{e}")
            continue
        if isinstance(d, list):
            print(f"{rel}\tlist\t{len(d)}")
        elif isinstance(d, dict):
            lists = {k: len(v) for k, v in d.items() if isinstance(v, list)}
            if lists:
                print(f"{rel}\tdict\t" + ",".join(f"{k}={v}" for k, v in lists.items()))
            else:
                print(f"{rel}\tdict-nolist\t{len(d)} keys")
