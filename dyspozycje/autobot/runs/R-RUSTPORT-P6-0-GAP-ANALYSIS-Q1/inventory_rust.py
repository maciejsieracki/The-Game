#!/usr/bin/env python3
# Inwentarz drzewa Rust rust-port/engine/src (pliki .rs).
# Uzycie: python3 -I inventory_rust.py <root_engine_src> > rust-inventory.tsv
# Kolumny: plik, LOC_niepuste, N_pub_fn, N_pub_items(struct/enum/trait/type/const), N_testow(#[test]), N_cfg_test_mod
import os, re, sys

root = sys.argv[1]
PUBFN = re.compile(r"^\s*pub(?:\([^)]*\))?\s+(?:async\s+)?(?:const\s+)?fn\s+(\w+)", re.M)
PUBITEM = re.compile(r"^\s*pub(?:\([^)]*\))?\s+(?:struct|enum|trait|type|const|static)\s+(\w+)", re.M)
TEST = re.compile(r"#\[test\]")
CFGT = re.compile(r"#\[cfg\(test\)\]")
rows = []
for dp, _, fns in os.walk(root):
    for fn in fns:
        if not fn.endswith(".rs"):
            continue
        p = os.path.join(dp, fn)
        rel = os.path.relpath(p, root).replace(os.sep, "/")
        with open(p, encoding="utf-8", errors="replace") as f:
            src = f.read()
        nonempty = sum(1 for l in src.splitlines() if l.strip())
        rows.append((rel, nonempty, len(PUBFN.findall(src)), len(PUBITEM.findall(src)), len(TEST.findall(src)), len(CFGT.findall(src))))
rows.sort()
print("plik\tLOC_niepuste\tN_pub_fn\tN_pub_items\tN_testow\tN_cfg_test")
for r in rows:
    print("\t".join(str(x) for x in r))
