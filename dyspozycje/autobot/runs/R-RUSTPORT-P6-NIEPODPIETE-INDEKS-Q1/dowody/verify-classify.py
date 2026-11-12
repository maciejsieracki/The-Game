#!/usr/bin/env python3
"""Klasyfikuje trafienia git grep dla nazw z verify-git-grep.tsv, ktore maja licznik > 0.

Uzycie (z korzenia repo): python3 -I <ten-plik> <verify-git-grep.tsv>
Dla kazdej nazwy z licznikiem > 0 wypisuje rodzaje trafien (poza liniami definicji fn i use):
  komentarz = linia zaczyna sie od // lub /* lub * (w tym doc-komentarze ///, //!)
  kod:<plik> = linia kodu w pliku .rs (zwykle blok #[cfg(test)] albo test w src/, skrypt python ich nie liczy)
  dane:<plik> = trafienie w pliku innym niz .rs (np. JSON)
  string = trafienie wewnatrz literalu tekstowego w kodzie
Nazwa jest zero-wolaniem produkcyjnym, gdy nie ma w kodzie produkcyjnym zadnego "kod:" spoza testow;
tu rozroznienie testow vs produkcji jest wykonane przez skrypt-niepodpiete.py (cfg(test) blankowany);
ta klasyfikacja tylko pokazuje, czym sa trafienia git grep.
"""
import collections
import os
import re
import subprocess
import sys

TSV = sys.argv[1]
names = []
with open(TSV, encoding="utf-8") as fh:
    next(fh)
    for line in fh:
        name, cnt = line.rstrip("\n").split("\t")
        if int(cnt) > 0:
            names.append(name)

cls = collections.Counter()
examples = collections.defaultdict(list)
for n in names:
    out = subprocess.run(
        ["git", "grep", "-n", "-w", "-e", n, "--", "rust-port", ":!*/tests/*", ":!*/benches/*"],
        capture_output=True, text=True,
    ).stdout.splitlines()
    kinds = set()
    for line in out:
        parts = line.split(":", 2)
        if len(parts) < 3:
            continue
        f, _ln, content = parts
        if re.search(r"fn " + re.escape(n) + r"([^A-Za-z0-9_]|$)", content) or re.match(r"^\s*(pub )?use ", content):
            continue
        s = content.strip()
        if not f.endswith(".rs"):
            kinds.add("dane")
        elif s.startswith(("//", "/*", "*")):
            kinds.add("komentarz")
        elif re.search(r'"[^"]*\b' + re.escape(n) + r'\b[^"]*"', s):
            kinds.add("string")
        else:
            kinds.add("kod")
    key = "+".join(sorted(kinds)) or "tylko_definicje_lub_use"
    cls[key] += 1
    if len(examples[key]) < 5:
        examples[key].append(n)

print("nazwy z licznikiem > 0: %d" % len(names))
for k, v in cls.most_common():
    print("%-28s %4d   przyklady: %s" % (k, v, ", ".join(examples[k])))

# Ryzyko liczenia po nazwie (uproszczone, git grep, bez wykluczenia cfg(test)):
# nazwy pub fn zdefiniowane w domain wiecej niz raz, i ile definicji to obejmuje.
defs = subprocess.run(
    ["git", "grep", "-h", "-E", "^[[:space:]]*pub fn [A-Za-z_][A-Za-z0-9_]*", "--", "rust-port/engine/src/domain"],
    capture_output=True, text=True,
).stdout.splitlines()
cnt = collections.Counter(re.search(r"pub fn ([A-Za-z_][A-Za-z0-9_]*)", d).group(1) for d in defs)
shared = {k: v for k, v in cnt.items() if v > 1}
print("definicje pub fn w domain (git grep, w tym cfg(test)): %d" % len(defs))
print("nazwy definiowane > 1 raz: %d, obejmuja definicji: %d" % (len(shared), sum(shared.values())))
