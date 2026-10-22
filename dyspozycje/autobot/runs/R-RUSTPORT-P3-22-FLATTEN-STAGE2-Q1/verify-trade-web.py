#!/usr/bin/env python3
"""Niezalezny weryfikator HANDEL (inna metoda niz generator).

Uzycie: python3 -I verify-trade-web.py <korzen_wyeksportowany_z_git_archive> <repo_json> <web-values.json>
Metoda: szuka definicji kazdego ID po CALYM gra/src (regex na deklaracji `const ID`),
a NIE po numerze linii z tabeli. Sprawdza:
  - dokladnie jedna definicja ID w gra/src;
  - plik:linia w JSON Rust (definicja_web) == miejsce znalezione przez weryfikator;
  - wartosc (klasa a) z linii definicji == wartosc w JSON Rust == wartosc generatora;
  - linia uzycia (uzycie_web) zawiera ID;
  - klasa b: wartosci po trudnosci z bloku definicji == JSON Rust == generator.
Wypisuje liczbe rozbieznosci; 0 = zgodnosc.
"""
import json
import os
import re
import sys

web_root, repo_json, gen_json = sys.argv[1], sys.argv[2], sys.argv[3]
src = os.path.join(web_root, "gra", "src")
texts = {}
for dp, _, fns in os.walk(src):
    for fn in fns:
        if fn.endswith(".ts"):
            full = os.path.join(dp, fn)
            with open(full, encoding="utf-8") as fh:
                texts[os.path.relpath(full, web_root).replace(os.sep, "/")] = fh.read().split("\n")

rust = {r["id"]: r for r in json.load(open(repo_json, encoding="utf-8"))["wiersze"]}
gen = json.load(open(gen_json, encoding="utf-8"))
disc = []
checked = 0
VAL = re.compile(r"=\s*(-?[0-9]+(?:\.[0-9]+)?)\s*;")
PER = re.compile(r"\b(easy|normal|hard)\s*:\s*(-?[0-9]+(?:\.[0-9]+)?)")

for cid, row in rust.items():
    pat = re.compile(r"const\s+" + re.escape(cid) + r"\b")
    defs = [(rel, i, ln) for rel, lines in texts.items() for i, ln in enumerate(lines, 1) if pat.search(ln)]
    if len(defs) != 1:
        disc.append(f"{cid}: liczba definicji w gra/src = {len(defs)} (oczekiwano 1)")
        continue
    rel, line_no, ln = defs[0]
    if row["definicja_web"] != f"{rel}:{line_no}":
        disc.append(f"{cid}: definicja_web w JSON {row['definicja_web']} != weryfikator {rel}:{line_no}")
    use_loc = row["uzycie_web"].split(" ")[0]
    use_rel, use_no = use_loc.rsplit(":", 1)
    use_line = texts[use_rel][int(use_no) - 1]
    if cid not in use_line:
        disc.append(f"{cid}: linia uzycia {use_loc} nie zawiera ID: {use_line.strip()!r}")
    if row["klasa"] == "a":
        m = VAL.search(ln)
        val = float(m.group(1)) if m else None
        if val != row["wartosc"]:
            disc.append(f"{cid}: wartosc web={val} rust-json={row['wartosc']}")
        if gen.get(cid, {}).get("wartosc") != val:
            disc.append(f"{cid}: generator={gen.get(cid)} weryfikator={val}")
    else:
        per = {m.group(1): float(m.group(2)) for ln2 in texts[rel][line_no - 1: line_no + 4] for m in PER.finditer(ln2)}
        if per != row.get("wartosci_po_trudnosci") or per != gen[cid]["wartosci_po_trudnosci"]:
            disc.append(f"{cid}: web={per} rust={row.get('wartosci_po_trudnosci')} gen={gen[cid]}")
    checked += 1

print(f"sprawdzono wierszy: {checked} z {len(rust)}")
for d in disc:
    print("ROZBIEZNOSC:", d)
print(f"LICZBA ROZBIEZNOSCI: {len(disc)}")
