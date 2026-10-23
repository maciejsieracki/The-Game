#!/usr/bin/env python3
"""Porownanie wektorow r1 (commit 2422b5ed) z r2: kategorie wspolne musza byc IDENTYCZNE.
Uzycie: python3 -I cmp-vectors-r1-r2.py <web-vectors-r1.json> <web-vectors-r2.json>
(r1: `git show 2422b5ed:rust-port/engine/tests/p6_m04_vectors/web-vectors.json > r1.json`).
Kod wyjscia 0 = wszystkie wspolne kategorie identyczne i metadane (SHA gen-helpers, enumy) identyczne.
"""
import json
import sys

a = json.load(open(sys.argv[1], encoding="utf-8"))
b = json.load(open(sys.argv[2], encoding="utf-8"))
same, diff = [], []
for k in a["cases"]:
    (same if a["cases"][k] == b["cases"].get(k) else diff).append(k)
print("kategorie identyczne:", len(same), same)
print("kategorie rozne:", diff)
print("nowe kategorie w r2:", sorted(set(b["cases"]) - set(a["cases"])))
meta_ok = True
for key in ("sha256", "gen_helpers_lines", "private_exports", "enums"):
    ok = a[key] == b[key]
    meta_ok = meta_ok and ok
    print(key, "identyczne" if ok else "ROZNE")
sys.exit(0 if not diff and meta_ok else 1)
