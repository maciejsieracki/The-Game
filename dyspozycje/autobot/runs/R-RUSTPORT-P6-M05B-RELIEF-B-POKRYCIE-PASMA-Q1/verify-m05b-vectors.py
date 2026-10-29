#!/usr/bin/env python3
"""NIEZALEZNY weryfikator P6.M05B (relief B: pokrycie siatki, bezpiecznik skupisk, pasma).

Nie wykonuje TS, nie uzywa generatora ani Rust. Sprawdza:
  A. prowenancja: SHA-256 pliku TS (git show edb8fb56:gra/src/map/gen-helpers.ts) == meta wektorow;
     SHA-256 pliku wektorow == skrot z dokumentu tematu;
  B. tabela mapgen-relief-b.json: kazdy lisc ma zrodlo_web, a wartosc wystepuje jako token
     w linii TS/loadera wskazanej przez zrodlo_web (regex, bez wykonania);
  C. fallback pasm z loadera (linie 63-65) == tabela pasma_fallback;
  D. parametry pasm: niezalezna reimplementacja mapGenMountainRangeParams (loader 167-184)
     porownana z przypadkami `params` (out);
  E. niezmienniki stanu wyjsciowego: zbior kluczy bez zmian (ensure/grow/safety/regrow);
     w safety najwieksza skladowa tego samego terenu (gory, wzgorza; sasiedztwo osiowe 6)
     <= maks_skupisko (10); ret jest liczba calkowita >= 0.
Uzycie: verify-m05b-vectors.py <TS_gen-helpers.ts> <loader.ts> <WEB_VECTORS_JSON> <TABLE_JSON>
Kod wyjscia: 0 = 0 rozbieznosci.
"""
import hashlib
import json
import re
import sys
from collections import deque

ts_path, loader_path, vec_path, tbl_path = sys.argv[1:5]
raw = open(vec_path, "rb").read()
V = json.loads(raw)
TBL = json.load(open(tbl_path, encoding="utf-8"))
TS = open(ts_path, encoding="utf-8").read().split("\n")
LOADER = open(loader_path, encoding="utf-8").read().split("\n")

checks = 0
bad = 0


def has_number(line, val):
    """Czy linia zawiera numeryczny literal o wartosci val (np. 0.40 == 0.4, 1.0 == 1)."""
    for tok in re.findall(r"(?<![\w.])\d+(?:\.\d+)?(?![\w.])", line):
        if float(tok) == float(val):
            return True
    return False


def check(cond, msg):
    global checks, bad
    checks += 1
    if not cond:
        bad += 1
        if bad <= 40:
            print("ROZBIEZNOSC:", msg)


# A. prowenancja
ts_bytes = open(ts_path, "rb").read()
ts_sha = hashlib.sha256(ts_bytes).hexdigest()
check(ts_sha == V["meta"]["gen_helpers_sha256"], f"SHA TS {ts_sha} != meta")
vec_sha = hashlib.sha256(raw).hexdigest()
check(vec_sha == "fc6afe31ed7f1051f5df2e3434fa78443d5a52d6559974fc9ac5efefee327a82",
      "SHA pliku wektorow != skrot z dokumentu")
print(f"A: ts_sha={ts_sha[:16]} ts_lines={len(TS)} vec_sha={vec_sha[:16]}")

# B. tabela vs zrodla web
leaves = []


def walk_tbl(node, path):
    if isinstance(node, dict) and "wartosc" in node and "zrodlo_web" in node:
        leaves.append((path, node["wartosc"], node["zrodlo_web"]))
        return
    if isinstance(node, dict):
        for k, v in node.items():
            if k != "meta":
                walk_tbl(v, path + [k])


walk_tbl(TBL, [])
for path, val, src in leaves:
    m = re.match(r"gra/(.+):(\d+)$", src)
    check(m is not None, f"zrodlo_web bez linii: {src}")
    if not m:
        continue
    lno = int(m.group(2))
    line = TS[lno - 1] if m.group(1).endswith("gen-helpers.ts") else LOADER[lno - 1]
    found = has_number(line, val)
    check(found, f"{'/'.join(path)}={val} nie wystepuje w {src}: {line.strip()[:120]}")
print(f"B: lisci tabeli={len(leaves)}")

# C. fallback loadera == tabela
FB = {t: TBL["pasma_fallback"][t] for t in ("low", "medium", "high")}
KEYS = ("hexy_na_pasmo", "max_pasm_na_mase", "dlugosc_min", "dlugosc_max", "min_masa_hexow", "obrzeze_szansa")
for tier, lno in (("low", 63), ("medium", 64), ("high", 65)):
    for k in KEYS:
        v = FB[tier][k]["wartosc"]
        check(has_number(LOADER[lno - 1], v), f"fallback {tier}.{k}={v} nie w linii loadera {lno}")
print("C: fallback sprawdzony")


# D. niezalezna reimplementacja parametrow pasm
def fbv(tier):
    d = FB[tier]
    return {"hexyNaPasmo": d["hexy_na_pasmo"]["wartosc"], "maxPasmNaMase": d["max_pasm_na_mase"]["wartosc"],
            "dlugoscMin": d["dlugosc_min"]["wartosc"], "dlugoscMax": d["dlugosc_max"]["wartosc"],
            "minMasaHexow": d["min_masa_hexow"]["wartosc"], "obrzezeSzansa": d["obrzeze_szansa"]["wartosc"]}


def num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def params(tier, row):
    fb = fbv(tier)
    if row is None:
        return dict(fb)
    dmin = row["dlugosc_min"] if num(row.get("dlugosc_min")) and row["dlugosc_min"] > 0 else fb["dlugoscMin"]
    return {
        "hexyNaPasmo": row["hexy_na_pasmo"] if num(row.get("hexy_na_pasmo")) and row["hexy_na_pasmo"] > 0 else fb["hexyNaPasmo"],
        "maxPasmNaMase": row["max_pasm_na_mase"] if num(row.get("max_pasm_na_mase")) and row["max_pasm_na_mase"] >= 0 else fb["maxPasmNaMase"],
        "dlugoscMin": dmin,
        "dlugoscMax": row["dlugosc_max"] if num(row.get("dlugosc_max")) and row["dlugosc_max"] >= dmin else max(fb["dlugoscMax"], dmin),
        "minMasaHexow": row["min_masa_hexow"] if num(row.get("min_masa_hexow")) and row["min_masa_hexow"] >= 0 else fb["minMasaHexow"],
        "obrzezeSzansa": row["obrzeze_szansa"] if num(row.get("obrzeze_szansa")) and 0 <= row["obrzeze_szansa"] <= 1 else fb["obrzezeSzansa"],
    }


for c in V["cases"]["params"]:
    got = params(c["tier"], c.get("row"))
    exp = c["out"]
    check(set(got) == set(exp) and all(got[k] == exp[k] for k in exp), f"params {c['id']}: py={got} web={exp}")
print("D: parametry sprawdzone:", len(V["cases"]["params"]))


# E. niezmienniki
def max_cluster(state, terrain):
    keys = {k for k, t in state.items() if t == terrain}
    best, seen = 0, set()
    for s in keys:
        if s in seen:
            continue
        q, r = map(int, s.split(","))
        dq = deque([(q, r)])
        seen.add(s)
        size = 0
        while dq:
            cq, cr = dq.popleft()
            size += 1
            for dq_, dr_ in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)):
                nk = f"{cq + dq_},{cr + dr_}"
                if nk in keys and nk not in seen:
                    seen.add(nk)
                    dq.append((cq + dq_, cr + dr_))
        best = max(best, size)
    return best


MAXC = TBL["pasma"]["maks_skupisko_gor_wzgorz"]["wartosc"]
safety_max = 0
grow_max = 0
for kind in ("ensure", "grow", "safety", "regrow"):
    for c in V["cases"][kind]:
        out_state = {k: t for k, t, _b, _n in c["output"]["state"]}
        if "input" in c:
            in_keys = {k for k, _t, _b, _n in c["input"]}
            check(in_keys == set(out_state), f"{c['id']}: zbior kluczy zmieniony")
        ret = c["output"]["ret"]
        check(re.fullmatch(r"-?\d+", str(ret)) is not None and int(ret) >= 0, f"{c['id']}: ret={ret}")
        if kind in ("safety", "grow"):
            mm = max(max_cluster(out_state, "gory"), max_cluster(out_state, "wzgorza"))
            if kind == "safety":
                safety_max = max(safety_max, mm)
                check(mm <= MAXC, f"{c['id']}: skupisko gor/wzgorz {mm} > {MAXC}")
            else:
                grow_max = max(grow_max, mm)
print(f"E: niezmienniki sprawdzone; maks. skupisko gor/wzgorz: safety={safety_max} grow={grow_max} (limit {MAXC})")
print(f"checks={checks} rozbieznosci={bad}")
sys.exit(0 if bad == 0 else 1)
