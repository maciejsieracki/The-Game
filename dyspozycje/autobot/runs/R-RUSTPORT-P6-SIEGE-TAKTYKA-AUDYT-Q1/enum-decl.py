#!/usr/bin/env python3
"""Porownanie nazwa-po-nazwie: deklaracje battleScene.ts (pin) vs wiersze tabeli w P6-SIEGE-TAKTYKA.md.

Uzycie (pin czytany przez git show, poza repo):
  git show 07d2fbd72f758705f8e1d59cc4968027ffbafe75:gra/src/battle/battleScene.ts > /tmp/bs_pin.ts
  python3 -I enum-decl.py /tmp/bs_pin.ts dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md [old|new]

old = wzorzec z §0 przed obroną r5 (tylko metody bez `static`, bez pól-funkcji)
new = wzorzec rozszerzony (metody z `static` + pola-funkcje `= (...) =>`) — stan po obronie r5
"""
import re
import sys

PIN, DOC = sys.argv[1], sys.argv[2]
MODE = sys.argv[3] if len(sys.argv) > 3 else "new"
KW = re.compile(
    r"siege|wall|gate|breach|tower|tick|round|rout|morale|check|_ff|fast|rang|_do|sortie|palis|machin|ram|stall|end|draw|winner|verdict|climb|pomin|manual|auto",
    re.I,
)
OLD = re.compile(r"^  (private |public |protected )?(async )?[A-Za-z_]\w*\(")
NEW_M = re.compile(r"^  (private |public |protected )?(static )?(async )?[A-Za-z_]\w*\(")
NEW_A = re.compile(r"^  (private |public |protected )?(readonly )?[A-Za-z_]\w* = (async )?\(")
NAME = re.compile(r"^  (?:private |public |protected )?(?:static )?(?:readonly )?(?:async )?([A-Za-z_]\w*)\s*(?:\(|=)")

with open(PIN, encoding="utf-8") as f:
    lines = f.read().split("\n")

hits = []
for i, line in enumerate(lines, 1):
    if MODE == "old":
        ok = OLD.search(line)
    else:
        ok = NEW_M.search(line) or NEW_A.search(line)
    if ok and KW.search(line):
        m = NAME.search(line)
        hits.append((i, m.group(1)))

print(f"tryb={MODE}")
print(f"linii wzorca: {len(hits)}")
print("trafienia tri(: " + str([i for i, n in hits if n == "tri"]))
decl = [(i, n) for i, n in hits if n != "tri"]
pin_names = sorted(set(n for _, n in decl))
print(f"deklaracje unikalne (bez tri): {len(pin_names)}")

with open(DOC, encoding="utf-8") as f:
    doc_text = f.read()
sec1 = doc_text.split("\n## 2. ")[0]  # tylko tabele §1..§1d (wiersze L2–L5)
row_names = set()
for row in sec1.split("\n"):
    m = re.match(r"^\| ([0-9]+(?:\.[0-9]+)?[a-z]?) \| (.*?) \|", row)
    if m:
        row_names.update(re.findall(r"`([A-Za-z_]\w*)", m.group(2)))

missing_in_doc = [n for n in pin_names if n not in row_names]
print(f"pin -> brak wiersza w tabeli: {len(missing_in_doc)} {missing_in_doc}")
for i, n in decl:
    if n in missing_in_doc:
        print(f"   pin:{i} {n}")
extra_in_doc = sorted(n for n in row_names if n not in pin_names)
print(f"tabela -> nazwa spoza deklaracji wzorca: {len(extra_in_doc)}")
print("   " + ", ".join(extra_in_doc))
