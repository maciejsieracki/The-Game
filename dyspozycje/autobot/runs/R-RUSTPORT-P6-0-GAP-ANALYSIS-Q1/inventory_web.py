#!/usr/bin/env python3
# Inwentarz plikow gra/src/game/** z drzewa web (wyekstrahowanego przez git archive edb8fb56).
# Uzycie: python3 -I inventory_web.py <root_gra_src> > web-inventory.tsv
# Kolumny: plik, LOC_niepuste, LOC_surowe, N_eksportow, importy_wewnetrzne, komentarz, eksporty
import os, re, sys

root = sys.argv[1]
base = os.path.join(root, "game")
EXP = re.compile(r"^export\s+(?:default\s+)?(?:declare\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|interface|type|enum|abstract\s+class)\s+([A-Za-z_$][\w$]*)", re.M)
EXP_LIST = re.compile(r"^export\s*\{([^}]*)\}", re.M)
IMP = re.compile(r"""(?:from|import)\s*\(?\s*['"](\.{1,2}/[^'"]+)['"]""")
rows = []
for dp, _, fns in os.walk(base):
    for fn in fns:
        p = os.path.join(dp, fn)
        rel = os.path.relpath(p, base).replace(os.sep, "/")
        with open(p, encoding="utf-8", errors="replace") as f:
            src = f.read()
        lines = src.splitlines()
        nonempty = sum(1 for l in lines if l.strip())
        exps = set(EXP.findall(src))
        for grp in EXP_LIST.findall(src):
            for item in grp.split(","):
                item = item.strip()
                if item:
                    exps.add(item.split(" as ")[-1].strip())
        imps = sorted({os.path.basename(m.rstrip("/")).split(".")[0] for m in IMP.findall(src)})
        first = ""
        for l in lines[:6]:
            s = l.strip()
            if s.startswith("//") or s.startswith("/*") or s.startswith("*"):
                first = s.lstrip("/*").strip()
                break
        rows.append((rel, nonempty, len(lines), len(exps), ",".join(imps), first, ",".join(sorted(exps))))
rows.sort()
print("plik\tLOC_niepuste\tLOC_surowe\tN_eksportow\timporty_wewn\tkomentarz\teksporty")
for r in rows:
    print("\t".join(str(x) for x in r))
