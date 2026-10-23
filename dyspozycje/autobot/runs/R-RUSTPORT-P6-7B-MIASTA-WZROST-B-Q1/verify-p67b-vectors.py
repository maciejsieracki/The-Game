#!/usr/bin/env python3
"""Niezalezny weryfikator wektorow P6.7B (R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1).

NIE uzywa TypeScript, Node, gen-p67b-vectors.mjs ani kodu Rust. Semantyke building-cost-tempo.ts /
building-stock-cost.ts / building-resource-gate.ts (oraz wejsc: zloto-access.ts, r-stawki-strojenie.ts,
production.isBuildingSupersededByUpgrade) implementuje od nowa w Pythonie na podstawie TEKSTU zrodel weba
(git archive edb8fb56): wejscia bierze z wektorow JSON, wynik liczy sam i porownuje z wyjsciem zapisanym
z URUCHOMIONEGO weba (bitowo dla f64). Stale (mnozniki, etykiety, mapy zlozy i prerekwizytow, stale
Spichlerza) czyta z tekstu zrodel weba (regex), nie z danych Rust. Normalizacje NFD sprawdza przez
`unicodedata` Pythona (Unicode 14.0); punkty kodowe nieprzypisane w tej wersji sa pomijane i liczone.

Uzycie:  python3 -I verify-p67b-vectors.py <WEB_ROOT> <VECTORS_DIR>
Wyjscie: 0 = 0 rozbieznosci, 1 = rozbieznosci, 2 = blad wejscia.
"""
import functools
import json
import math
import re
import struct
import sys
import unicodedata
from pathlib import Path

if len(sys.argv) != 3:
    print("usage: <WEB_ROOT> <VECTORS_DIR>")
    sys.exit(2)
web = Path(sys.argv[1])
vdir = Path(sys.argv[2])
game = web / "gra/src/game"

checks = 0
diffs = 0
NAN = float("nan")
INF = float("inf")


def bits(x):
    if math.isnan(x):
        return "nan"
    return struct.pack(">d", x).hex()


def is_special(s):
    return s in ("NaN", "Infinity", "-Infinity", "-0") or s.startswith("~")


def N(v):
    """Liczba z wektora (None gdy to nie liczba JS)."""
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        if v == "NaN":
            return NAN
        if v == "Infinity":
            return INF
        if v == "-Infinity":
            return -INF
        if v == "-0":
            return -0.0
        if v.startswith("~"):
            return float(v[1:])
    return None


def same(a, b):
    if isinstance(a, float) and isinstance(b, float):
        return bits(a) == bits(b)
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(same(a[k], b[k]) for k in a)
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return len(a) == len(b) and all(same(x, y) for x, y in zip(a, b))
    return a == b


def check(label, got, want):
    global checks, diffs
    checks += 1
    if not same(got, want):
        diffs += 1
        if diffs <= 40:
            print(f"ROZBIEZNOSC {label}: python={got!r} web={want!r}")


def dec_rec(obj):
    """Rekord Record<string, number> z wektora: tylko wartosci liczbowe."""
    out = {}
    for k, v in obj.items():
        n = N(v)
        if n is not None:
            out[k] = n
    return out


def dec_opt_rec(obj):
    return dec_rec(obj) if isinstance(obj, dict) else None


def rec_expect(obj):
    return {k: N(v) for k, v in obj.items()}


# ----------------------------------------------------------------------------------------------
# Stale z TEKSTU zrodel weba
# ----------------------------------------------------------------------------------------------
src_tempo = (game / "building-cost-tempo.ts").read_text(encoding="utf-8")
src_stock = (game / "building-stock-cost.ts").read_text(encoding="utf-8")
src_gate = (game / "building-resource-gate.ts").read_text(encoding="utf-8")
src_zloto = (game / "zloto-access.ts").read_text(encoding="utf-8")
src_rstaw = (game / "r-stawki-strojenie.ts").read_text(encoding="utf-8")


def const_num(text, name):
    m = re.search(r"export const " + re.escape(name) + r"\s*(?::[^=]+)?=\s*(-?\d+(?:\.\d+)?)\s*;", text)
    if not m:
        raise SystemExit(f"brak stalej {name}")
    return float(m.group(1))


def const_str(text, name):
    m = re.search(r"export const " + re.escape(name) + r"\s*(?::[^=]+)?=\s*'([^']*)'\s*;", text)
    if not m:
        raise SystemExit(f"brak stalej {name}")
    return m.group(1)


PACE = {m.group(1): float(m.group(2)) for m in re.finditer(r"^\s+(niski|normalny|wysoki):\s*([\d.]+),", src_tempo, re.M)}
FALA2 = const_num(src_rstaw, "R_STAWKI_FALA2_MULT")
MOUNT_COST = const_num(src_stock, "MOUNT_UNIT_HORSE_STOCK_COST")
MOUNT_KEY = const_str(src_stock, "MOUNT_UNIT_HORSE_STOCK_KEY")
MOUNT_EXEMPT = const_str(src_stock, "MOUNT_HORSE_EXEMPT_UNIT")
ZLOTO_LABEL = const_str(src_zloto, "ZLOTO_LABEL")
ZLOTO_KEY = const_str(src_zloto, "ZLOTO_STOCK_KEY")
MENNICA_DRAIN = const_num(src_zloto, "MENNICA_ZLOTO_DRAIN_PER_TURN")
SP_CERAMIKA = const_num(src_gate, "SPICHLERZ_DRAIN_CERAMIKA_PER_TURN")
SP_SOL = const_num(src_gate, "SPICHLERZ_DRAIN_SOL_PER_TURN")
SP_CAP_I = const_num(src_gate, "SPICHLERZ_EMPIRE_CAP_I")
SP_CAP_II = const_num(src_gate, "SPICHLERZ_EMPIRE_CAP_II_FULL")

# progi mnoznika ery (buildingEraCostMultiplier i epochCostMultiplier maja te same progi)
ERA_THRESH = [(float(a), float(b)) for a, b in re.findall(r"(?:ordinal|era) >= (\d+)\) return (\d+);", src_stock)]
assert len(ERA_THRESH) == 4 and ERA_THRESH[:2] == ERA_THRESH[2:], ERA_THRESH
ERA_THRESH = ERA_THRESH[:2]


def block(text, start_pat):
    i = text.index(start_pat)
    j = text.index("\n};", i)
    return text[i:j]


def lit(s):
    s = s.strip()
    return ZLOTO_LABEL if s == "ZLOTO_LABEL" else s.strip("'")


LABEL_BY_ASCII = {}
for m in re.finditer(r"^\s+(\w+):\s*(ZLOTO_LABEL|'[^']*'),", block(src_gate, "const LABEL_BY_ASCII"), re.M):
    LABEL_BY_ASCII[m.group(1)] = lit(m.group(2))
ASCII_BY_LABEL = {v: k for k, v in LABEL_BY_ASCII.items()}

STOCK_LABEL = {}
for m in re.finditer(r"^\s+(\w+):\s*'([^']*)',", block(src_stock, "export const STOCK_RESOURCE_LABEL"), re.M):
    STOCK_LABEL[m.group(1)] = m.group(2)
_ek = src_stock.index("export const EMPIRE_STOCK_RESOURCE_KEYS")
EMPIRE_KEYS = re.findall(r"'(\w+)'", src_stock[_ek : src_stock.index("] as const;", _ek)])

DEPOSIT = {}
for line in block(src_gate, "const DEPOSIT_LINKED_BUILDING_LABELS").splitlines():
    code = line.split("//")[0]
    m = re.match(r"\s+(\w+):\s*\[(.*?)\],", code)
    if m:
        DEPOSIT[m.group(1)] = [lit(x) for x in re.findall(r"ZLOTO_LABEL|'[^']*'", m.group(2))]

PREREQ = {}
for line in block(src_gate, "export const CITY_BUILDING_PREREQ").splitlines():
    code = line.split("//")[0]
    m = re.match(r"\s+(\w+):\s*(\[[^\]]*\]|'[^']*'),", code)
    if m:
        v = m.group(2)
        PREREQ[m.group(1)] = re.findall(r"'([^']*)'", v) if v.startswith("[") else v.strip("'")

WATER = set(re.findall(r"'(\w+)'", re.search(r"WATER_ACCESS_BUILDING_IDS[^=]*=\s*new Set\(\[(.*?)\]\)", src_gate).group(1)))
SP_EXCLUDED = set(re.findall(r"'(\w+)'", re.search(r"SPICHLERZ_RUNTIME_EXCLUDED = new Set\(\[(.*?)\]\)", src_gate).group(1)))
CAP_CONV = [("Cegła", "cegielnia"), ("Ceramika", "garncarnia")]
for lab, bid in CAP_CONV:
    assert f"label === '{lab}' && empireBuiltIds?.includes('{bid}')" in src_gate


# ----------------------------------------------------------------------------------------------
# Semantyka JS
# ----------------------------------------------------------------------------------------------
JS_WS = set(
    "\t\n\v\f\r                  　﻿"
)


def js_trim(s):
    i, j = 0, len(s)
    while i < j and s[i] in JS_WS:
        i += 1
    while j > i and s[j - 1] in JS_WS:
        j -= 1
    return s[i:j]


def js_round(x):
    if math.isnan(x) or math.isinf(x) or x == 0:
        return x
    f = math.floor(x)
    r = f + 1.0 if (x - f) >= 0.5 else float(f)
    if r == 0 and x < 0:
        return -0.0
    return float(r)


def js_max(a, b):
    if math.isnan(a) or math.isnan(b):
        return NAN
    if a == 0 and b == 0:
        return b if math.copysign(1, a) < 0 else a
    return a if a >= b else b


def js_min(a, b):
    if math.isnan(a) or math.isnan(b):
        return NAN
    if a == 0 and b == 0:
        return a if math.copysign(1, a) < 0 else b
    return a if a <= b else b


def fmul(a, b):
    try:
        return a * b
    except OverflowError:
        return INF


def strip_lower(s):
    n = unicodedata.normalize("NFD", s)
    n = "".join(c for c in n if not ("̀" <= c <= "ͯ"))
    return js_trim(n).lower()


def era_mult_ordinal(o):
    for lo, m in ERA_THRESH:
        if o >= lo:
            return m
    return 1.0


EPOCH_WORDS = {}
for m in re.finditer(r"normalized === '([^']*)'", src_stock):
    pass
# slowa epok: kolejne `if (...normalized === 'x' || ...) return N;`
_stm = src_stock[src_stock.index("if (/^\\d+") : src_stock.index("  return 1;\n}\n\n/** Scale")]
for cond, ret in re.findall(r"if \(((?:[^)]|\n)*?)\)\s*return (\d+);", _stm):
    for w in re.findall(r"normalized === '([^']*)'", cond):
        EPOCH_WORDS[w] = float(ret)


def epoch_mult(e):
    t = e["t"]
    if t == "n":
        n = N(e["v"])
        if math.isfinite(n):
            return era_mult_ordinal(math.floor(n))
        return 1.0
    if t == "o":
        return 1.0
    norm = strip_lower(e["v"])
    if re.fullmatch(r"[0-9]+(?:\.[0-9]+)?", norm):
        v = float(norm)  # Python: za duze napisy daja inf, jak Number() w JS
        return epoch_mult({"t": "n", "v": v}) if math.isfinite(v) else 1.0
    return EPOCH_WORDS.get(norm, 1.0)


def scale_cost(cost, e):
    if not math.isfinite(cost) or cost < 0:
        return 0.0
    if cost == 0:
        return 0.0
    return js_max(1.0, js_round(fmul(cost, epoch_mult(e))))


def era_cost_mult(e):
    if e["t"] == "n" and math.isfinite(N(e["v"])):
        return era_mult_ordinal(math.floor(N(e["v"])))
    return era_mult_ordinal(1.0)


def scale_stock_record(raw):
    out = {}
    if raw is None:
        return out
    for k, v in raw.items():
        n = N(v["v"]) if v.get("t") == "n" else None
        if n is not None and math.isfinite(n) and n > 0:
            out[k] = js_max(1.0, js_round(fmul(n, FALA2)))
    return out


def building_stock_cost(b):
    if "absent" in b:
        return {}
    kosz = b.get("koszt")
    raw = kosz["v"] if kosz and kosz.get("t") == "r" else None
    fala2 = scale_stock_record(raw)
    em = era_cost_mult(b["epoka"]) if "epoka" in b else era_mult_ordinal(1.0)
    if em == 1:
        return fala2
    return {k: js_max(1.0, js_round(fmul(a, em))) for k, a in fala2.items()}


def sub(a, b):
    return a - b


def unit_stock_cost(u):
    out = {}
    if "absent" in u:
        return out
    raw = js_trim(u.get("surowiec") or "")
    if raw and raw != "-":
        il = N(u["ilosc"]["v"]) if "ilosc" in u and u["ilosc"]["t"] == "n" else None
        if il is not None and math.isfinite(il) and il > 0:
            key = strip_lower(raw)
            if key:
                out[key] = scale_cost(il, u.get("epoka", {"t": "o"}))
    typ = js_trim(u.get("typ") or "")
    name = js_trim(u.get("j") or "")
    if typ == "Mount" and name != MOUNT_EXEMPT:
        out[MOUNT_KEY] = out.get(MOUNT_KEY, 0.0) + scale_cost(MOUNT_COST, u.get("epoka", {"t": "o"}))
    return out


def unit_mount(u):
    if "absent" in u:
        return False
    return js_trim(u.get("typ") or "") == "Mount" and js_trim(u.get("j") or "") != MOUNT_EXEMPT


# ---- pula miast ----
def utf16(s):
    return s.encode("utf-16-be", "surrogatepass")


def cmp_id(a, b):
    ua, ub = utf16(a), utf16(b)
    # porownanie jednostek UTF-16 (pary 2 bajty)
    for i in range(0, min(len(ua), len(ub)), 2):
        x, y = ua[i : i + 2], ub[i : i + 2]
        if x != y:
            return -1 if x < y else 1
    return (len(ua) > len(ub)) - (len(ua) < len(ub))


def js_cmp(diff):
    if math.isnan(diff):
        return 0
    return -1 if diff < 0 else (1 if diff > 0 else None)


def st(c, key):
    s = c.get("surowce")
    return s.get(key, 0.0) if s is not None else 0.0


def mk_cities(lst):
    out = []
    for c in lst:
        d = {"id": c["id"], "ownerId": c["ownerId"]}
        if "surowce" in c:
            d["surowce"] = dec_rec(c["surowce"])
        out.append(d)
    return out


def view(cities):
    out = []
    for c in cities:
        d = {"id": c["id"], "ownerId": c["ownerId"]}
        if "surowce" in c:
            d["surowce"] = c["surowce"]
        out.append(d)
    return out


def js_sort(items, keyfn_cmp):
    # stabilne sortowanie przez wstawianie (jak Array.prototype.sort dla spojnych komparatorow)
    items = list(items)
    for i in range(1, len(items)):
        j = i
        while j > 0 and keyfn_cmp(items[j - 1], items[j]) > 0:
            items[j - 1], items[j] = items[j], items[j - 1]
            j -= 1
    return items


def owner_all(cities, owner):
    pool = {}
    for c in cities:
        if c["ownerId"] != owner or "surowce" not in c:
            continue
        for k, v in c["surowce"].items():
            if math.isfinite(v):
                pool[k] = pool.get(k, 0.0) + v
    return pool


def owner_one(cities, owner, key):
    t = 0.0
    for c in cities:
        if c["ownerId"] == owner:
            t += st(c, key)
    return t


def credit(cities, owner, key, amount, cap=None):
    if not math.isfinite(amount) or amount <= 0:
        return 0.0
    oc = [c for c in cities if c["ownerId"] == owner]
    if not oc:
        return 0.0
    to_add = amount
    if cap is not None and math.isfinite(cap):
        cur = owner_one(cities, owner, key)
        to_add = js_max(0.0, js_min(to_add, cap - cur))
    if to_add <= 0:
        return 0.0

    def cmp(a, b):
        d = js_cmp(st(a, key) - st(b, key))
        return d if d is not None else cmp_id(a["id"], b["id"])

    target = js_sort(oc, cmp)[0]
    target.setdefault("surowce", {})
    target["surowce"][key] = target["surowce"].get(key, 0.0) + to_add
    return to_add


def deduct_across(cities, owner, cost):
    oc = [c for c in cities if c["ownerId"] == owner]
    for key, need in cost.items():
        if not (need > 0):
            continue
        holders = [c for c in oc if st(c, key) > 0]

        def cmp(a, b):
            d = js_cmp(st(b, key) - st(a, key))
            return d if d is not None else cmp_id(a["id"], b["id"])

        for c in js_sort(holders, cmp):
            if need <= 0:
                break
            have = st(c, key)
            take = min(have, need)
            c.setdefault("surowce", {})
            c["surowce"][key] = have - take
            need -= take


def refund(cities, owner, cost):
    for k, a in cost.items():
        if math.isfinite(a) and a > 0:
            credit(cities, owner, k, a)


def assign(cities, owner, pool):
    for c in cities:
        if c["ownerId"] == owner and "surowce" in c:
            c["surowce"] = {}
    for k, a in pool.items():
        if math.isfinite(a) and a > 0:
            credit(cities, owner, k, a)


# ---- bramki ----
def required_labels(b):
    out = []
    for l in DEPOSIT.get(b["id"], []):
        if l not in out:
            out.append(l)
    wym = b.get("wym")
    key = js_trim(wym).lower() if isinstance(wym, str) else ""
    if key and key in LABEL_BY_ASCII and LABEL_BY_ASCII[key] not in out:
        out.append(LABEL_BY_ASCII[key])
    return out


def label_sat(label, built, stock):
    for lab, bid in CAP_CONV:
        if label == lab and built is not None and bid in built:
            return True
    ak = ASCII_BY_LABEL.get(label)
    if ak and stock is not None and stock.get(ak, 0.0) > 0:
        return True
    return False


def zloto_stock(stock):
    if stock is None:
        return 0.0
    v = stock.get(ZLOTO_KEY)
    return v if v is not None and math.isfinite(v) and v > 0 else 0.0


def can_feed(stock, grace=False):
    return True if grace else zloto_stock(stock) >= MENNICA_DRAIN


def has_deposit_gate(bid):
    return bid not in SP_EXCLUDED and bid in DEPOSIT


KIND = {
    "none": None,
    "empty": (None, False),
    "owner": (1, False),
    "resolver-only": (None, True),
    "resolver-owner0": (0, True),
    "resolver-owner1": (1, True),
    "resolver-owner2": (2, True),
    "resolver-owner4": (4, True),
}


def make_resolver(kind, table):
    calls = []

    def r(owner):
        calls.append(owner)
        return table[str(owner)]

    return r, calls


def mennica_gate(stock, kind, table, calls_sink):
    opt = KIND[kind]
    if opt is not None:
        owner, has_res = opt
        if has_res and owner is not None:
            r, calls = make_resolver(kind, table)
            res = r(owner)
            calls_sink.extend(calls)
            return res
    return can_feed(stock)


def runtime_gate(b, rt, stock, kind, table, calls_sink):
    if b["id"] == "mennica":
        return mennica_gate(stock, kind, table, calls_sink)
    req = required_labels(b)
    return all(label_sat(l, rt, stock) for l in req)


def filter_active(built, stock, kind, table, calls_sink):
    active = []
    changed = True
    while changed:
        changed = False
        for i in built:
            if i in active:
                continue
            if not has_deposit_gate(i):
                active.append(i)
                changed = True
                continue
            if runtime_gate({"id": i}, list(active), stock, kind, table, calls_sink):
                active.append(i)
                changed = True
    return active


def prereq_met(prereq, built, buildings):
    """Zwraca (wynik, lista wywolan isSuperseded) - kolejnosc i skracanie jak w `some`."""
    if prereq is None or prereq == "":
        return True, []
    ids = [prereq] if isinstance(prereq, str) else prereq
    calls = []
    for i in ids:
        if i in built:
            return True, calls
        res = any(b.get("upgradeFrom") == i and b["id"] in built for b in buildings)
        calls.append((i, res))
        if res:
            return True, calls
    return False, calls


def sp_drain(cities, owner, built, dry):
    has_i = "spichlerz" in built
    has_ii = "spichlerz_ii" in built
    if not has_i and not has_ii:
        return {"ceramikaPaid": False, "solPaid": False}
    cer = sol = False
    if owner_one(cities, owner, "ceramika") >= SP_CERAMIKA:
        if not dry:
            deduct_across(cities, owner, {"ceramika": SP_CERAMIKA})
        cer = True
    if has_ii and owner_one(cities, owner, "sol") >= SP_SOL:
        if not dry:
            deduct_across(cities, owner, {"sol": SP_SOL})
        sol = True
    return {"ceramikaPaid": cer, "solPaid": sol}


def sp_state(built, drain):
    has_ii = "spichlerz_ii" in built
    has_i = "spichlerz" in built
    if not has_i and not has_ii:
        return {"ceramikaActive": False, "solActive": False, "maSpichlerzPop": False, "maSpichlerzIIPop": False}
    cer = drain["ceramikaPaid"]
    sol = has_ii and drain["solPaid"]
    ii = has_ii and cer and sol
    pop = cer and not ii
    return {"ceramikaActive": cer, "solActive": sol, "maSpichlerzPop": pop, "maSpichlerzIIPop": ii}


# wartosci bonusow Spichlerza z TEKSTU zrodla (funkcje `return N;`)
def fn_returns(name):
    i = src_gate.index(f"export function {name}(")
    j = src_gate.index("\n}\n", i)
    return [float(x) for x in re.findall(r"return (-?\d+(?:\.\d+)?);", src_gate[i:j])]


HEALTH = fn_returns("spichlerzHealthBonus")  # [10, 5, 0]
GROWTH = fn_returns("spichlerzGrowthBonusPercent")  # [2, 1, 0]
RATION = fn_returns("spichlerzRationFoodCostMultiplier")  # [0.5, 0.75, 1]
HAPPY_DEFAULT = float(re.search(r"jsonBonus = (\d+)", src_gate).group(1))
ARMY = [float(x) for x in re.findall(r"m \*= (\d+(?:\.\d+)?);", src_gate)]
assert len(HEALTH) == 3 and len(GROWTH) == 3 and len(RATION) == 3 and len(ARMY) == 2


def sp_yields(built, state):
    eff = "spichlerz_ii" if state["maSpichlerzIIPop"] else ("spichlerz" if state["maSpichlerzPop"] else None)
    out = []
    mapped = False
    for i in built:
        if i in ("spichlerz", "spichlerz_ii"):
            if not mapped and eff:
                out.append(eff)
                mapped = True
            continue
        out.append(i)
    return out


def tooltip(missing):
    return "" if not missing else "Brak: " + ", ".join(missing)


def missing_runtime(b, rt, stock, kind, table, calls_sink):
    if b["id"] == "mennica":
        return [] if mennica_gate(stock, kind, table, calls_sink) else [ZLOTO_LABEL]
    return [l for l in required_labels(b) if not label_sat(l, rt, stock)]


# ----------------------------------------------------------------------------------------------
# Weryfikacja
# ----------------------------------------------------------------------------------------------
cost = json.loads((vdir / "cost.json").read_text(encoding="utf-8"))
nfd = json.loads((vdir / "nfd.json").read_text(encoding="utf-8"))
pool = json.loads((vdir / "pool.json").read_text(encoding="utf-8"))
gate = json.loads((vdir / "gate.json").read_text(encoding="utf-8"))

# --- stale ---
c = cost["constants"]
check("PACE", {k: v for k, v in PACE.items()}, {p[0]: N(p[1]) for p in c["pace"]})
check("mountCost", MOUNT_COST, N(c["mountCost"]))
check("mountKey", MOUNT_KEY, c["mountKey"])
check("mountExempt", MOUNT_EXEMPT, c["mountExempt"])
check("labels", list(STOCK_LABEL.items()), [tuple(p) for p in c["labels"]])
check("empireKeys", EMPIRE_KEYS, c["empireKeys"])
check("fala2", FALA2, N(c["fala2"]))
check("zloto", (ZLOTO_LABEL, ZLOTO_KEY, MENNICA_DRAIN), (c["zlotoLabel"], c["zlotoKey"], N(c["mennicaDrain"])))
check("depositIds", list(DEPOSIT.keys()), c["depositIds"])
check("prereq", list(PREREQ.items()), [tuple(p) for p in c["prereq"]])
check("water", sorted(WATER), sorted(c["water"]))
check("spichlerz", (SP_CERAMIKA, SP_SOL, SP_CAP_I, SP_CAP_II),
      (N(c["spichlerz"]["drainCeramika"]), N(c["spichlerz"]["drainSol"]), N(c["spichlerz"]["capI"]), N(c["spichlerz"]["capIIFull"])))

# --- tempo ---
for i, t in enumerate(cost["pace"]):
    base = N(t["base"])
    if "k" in t["pace"]:
        m = PACE.get(t["pace"]["k"], NAN)
    else:
        m = N(t["pace"]["n"])
    check(f"pace#{i}", js_max(1.0, js_round(fmul(base, m))), N(t["out"]))

for i, t in enumerate(cost["epochMult"]):
    check(f"epochMult#{i}", epoch_mult(t["epoch"]), N(t["out"]))
for i, t in enumerate(cost["scaleCost"]):
    check(f"scaleCost#{i}", scale_cost(N(t["cost"]), t["epoch"]), N(t["out"]))
for i, t in enumerate(cost["eraMult"]):
    check(f"eraMult#{i}", era_cost_mult(t["epoka"]), N(t["out"]))
for t in cost["buildingStock"]:
    check(f"buildingStock {t['id']}", building_stock_cost(t["building"]), rec_expect(t["out"]))
for i, t in enumerate(cost["stock"]):
    have = dec_opt_rec(t.get("have"))
    cst = dec_rec(t["cost"])
    h = have or {}
    miss = {}
    for k, need in cst.items():
        b = need - h.get(k, 0.0)
        if b > 0:
            miss[k] = b
    check(f"missing#{i}", miss, rec_expect(t["missing"]))
    can = all(not (h.get(k, 0.0) < need) for k, need in cst.items())
    check(f"can#{i}", can, t["can"])
    nxt = dict(h)
    for k, need in cst.items():
        nxt[k] = js_max(0.0, nxt.get(k, 0.0) - need)
    check(f"deduct#{i}", nxt, rec_expect(t["deduct"]))
for t in cost["labels"]:
    check(f"label {t['key']!r}", STOCK_LABEL.get(t["key"], t["key"]), t["out"])
for t in cost["units"]:
    check(f"unit {t['id']}", unit_stock_cost(t["unit"]), rec_expect(t["out"]))
    check(f"unit mount {t['id']}", unit_mount(t["unit"]), t["mount"])

# --- NFD ---
known = {cp: key for cp, key in nfd["changed"]}
unassigned = 0
nfd_checked = 0
for cp in range(0, 0x110000):
    if 0xD800 <= cp <= 0xDFFF:
        continue
    ch = chr(cp)
    if unicodedata.category(ch) == "Cn":
        unassigned += 1
        continue
    s = js_trim(ch)
    if s == "" or s == "-":
        want = None
    else:
        want = strip_lower(s)
        if want == "":
            want = None
    web_key = known[cp] if cp in known else ch
    nfd_checked += 1
    # JS: klucz liczony z `rawName` po trim; znak pusty po trim => brak klucza
    checks += 1
    if want != web_key:
        diffs += 1
        if diffs <= 40:
            print(f"ROZBIEZNOSC nfd U+{cp:04X}: python={want!r} web={web_key!r}")
for s, key in nfd["sequences"]:
    raw = js_trim(s)
    if raw and raw != "-":
        k = strip_lower(raw)
        want = k if k else None
    else:
        want = None
    check(f"nfd seq {s!r}", want, key)

# --- pula ---
for i, t in enumerate(pool["ownerAll"]):
    check(f"ownerAll#{i}", owner_all(mk_cities(t["cities"]), t["owner"]), rec_expect(t["out"]))
for i, t in enumerate(pool["ownerOne"]):
    check(f"ownerOne#{i}", owner_one(mk_cities(t["cities"]), t["owner"], t["key"]), N(t["out"]))
for i, t in enumerate(pool["deduct"]):
    cs = mk_cities(t["cities"])
    deduct_across(cs, t["owner"], dec_rec(t["cost"]))
    check(f"pool.deduct#{i}", view(cs), [{**x, **({"surowce": rec_expect(x["surowce"])} if "surowce" in x else {})} for x in t["after"]])
for i, t in enumerate(pool["refund"]):
    cs = mk_cities(t["cities"])
    refund(cs, t["owner"], dec_rec(t["cost"]))
    check(f"pool.refund#{i}", view(cs), [{**x, **({"surowce": rec_expect(x["surowce"])} if "surowce" in x else {})} for x in t["after"]])
for i, t in enumerate(pool["credit"]):
    cs = mk_cities(t["cities"])
    cap = N(t["cap"]) if "cap" in t else None
    ret = credit(cs, t["owner"], t["key"], N(t["amount"]), cap)
    check(f"pool.credit.ret#{i}", ret, N(t["ret"]))
    check(f"pool.credit#{i}", view(cs), [{**x, **({"surowce": rec_expect(x["surowce"])} if "surowce" in x else {})} for x in t["after"]])
for i, t in enumerate(pool["assign"]):
    cs = mk_cities(t["cities"])
    assign(cs, t["owner"], dec_rec(t["pool"]))
    check(f"pool.assign#{i}", view(cs), [{**x, **({"surowce": rec_expect(x["surowce"])} if "surowce" in x else {})} for x in t["after"]])
for t in pool["explicit"]:
    cs = mk_cities(t["cities"])
    if t["op"] == "deduct":
        deduct_across(cs, t["owner"], dec_rec(t["cost"]))
    else:
        ret = credit(cs, t["owner"], t["key"], N(t["amount"]))
        check(f"explicit.ret {t['name']}", ret, N(t["ret"]))
    check(f"explicit {t['name']}", view(cs), [{**x, **({"surowce": rec_expect(x["surowce"])} if "surowce" in x else {})} for x in t["after"]])

# --- bramki ---
table = gate["resolverTable"]


def GB(b):
    return {"id": b["id"], "wym": b.get("wym")}


for i, t in enumerate(gate["required"]):
    check(f"required#{i}", required_labels(GB(t["b"])), t["out"])
for i, t in enumerate(gate["labelSatisfied"]):
    check(f"labelSat#{i}", label_sat(t["label"], t.get("built"), dec_opt_rec(t.get("stock"))), t["out"])
for t in gate["accessOnly"]:
    check("accessOnly", False, t["out"])
for i, t in enumerate(gate["resourceGate"]):
    req = required_labels(GB(t["b"]))
    stock = dec_opt_rec(t.get("stock"))
    check(f"resourceGate#{i}", all(label_sat(l, t.get("built"), stock) for l in req), t["out"])
for t in gate["hasRuntimeGate"]:
    check(f"hasRuntimeGate {t['id']}", has_deposit_gate(t["id"]), t["out"])
for i, t in enumerate(gate["runtimeGate"]):
    sink = []
    res = runtime_gate(GB(t["b"]), t["rtBuilt"], dec_opt_rec(t.get("stock")), t["opt"]["kind"], table, sink)
    check(f"runtimeGate#{i}", res, t["out"])
    check(f"runtimeGate.calls#{i}", sink, t["opt"]["calls"])
for i, t in enumerate(gate["missingLabels"]):
    sink = []
    res = missing_runtime(GB(t["b"]), t["rtBuilt"], dec_opt_rec(t.get("stock")), t["opt"]["kind"], table, sink)
    check(f"missingLabels#{i}", res, t["out"])
    check(f"missingLabels.calls#{i}", sink, t["opt"]["calls"])
for i, t in enumerate(gate["filter"]):
    sink = []
    res = filter_active(t["built"], dec_opt_rec(t.get("stock")), t["opt"]["kind"], table, sink)
    check(f"filter#{i}", res, t["out"])
    check(f"filter.calls#{i}", sink, t["opt"]["calls"])
for i, t in enumerate(gate["prereq"]):
    res, calls = prereq_met(t.get("prereq"), t["built"], t["buildings"])
    check(f"prereq#{i}", res, t["out"])
    check(f"prereq.calls#{i}", [(a, r) for a, r in calls], [(x["id"], x["out"]) for x in t["calls"]])
    for x in t["calls"]:
        check(f"prereq.args#{i}", (x["built"], x["buildings"]), (t["built"], t["buildings"]))
for i, t in enumerate(gate["mennica"]):
    stock = dec_opt_rec(t.get("stock")) if isinstance(t.get("stock"), dict) else None
    g = t.get("grace")
    check(f"mennica#{i}", can_feed(stock, bool(g)), t["out"])
for i, t in enumerate(gate["spDrain"]):
    cs = mk_cities(t["cities"])
    res = sp_drain(cs, t["owner"], t["built"], bool(t.get("dry")))
    check(f"spDrain#{i}", res, t["out"])
    check(f"spDrain.after#{i}", view(cs), [{**x, **({"surowce": rec_expect(x["surowce"])} if "surowce" in x else {})} for x in t["after"]])
for i, t in enumerate(gate["spState"]):
    check(f"spState#{i}", sp_state(t["built"], t["drain"]), t["out"])
for t in gate["spBonus"]:
    s = t["state"]
    check("spHealth", HEALTH[0] if s["maSpichlerzIIPop"] else (HEALTH[1] if s["maSpichlerzPop"] else HEALTH[2]), N(t["health"]))
    check("spGrowth", GROWTH[0] if s["maSpichlerzIIPop"] else (GROWTH[1] if s["maSpichlerzPop"] else GROWTH[2]), N(t["growth"]))
    check("spRation", RATION[0] if s["maSpichlerzIIPop"] else (RATION[1] if s["maSpichlerzPop"] else RATION[2]), N(t["ration"]))
    for h in t["happiness"]:
        jb = N(h["json"]) if "json" in h else HAPPY_DEFAULT
        check("spHappy", jb if s["maSpichlerzIIPop"] else 0.0, N(h["out"]))
    for y in t["yields"]:
        check("spYields", sp_yields(y["built"], s), y["out"])
for t in gate["spArmy"]:
    m = 1.0
    if (not t["own"]) and t["sol"]:
        m *= ARMY[0]
    if t["garrison"]:
        m *= ARMY[1]
    check("spArmy", m, N(t["out"]))
for t in gate["spHas"]:
    check("spHas", ("spichlerz" in t["built"]) or ("spichlerz_ii" in t["built"]), t["out"])
for i, t in enumerate(gate["inactive"]):
    bid = t["buildingId"]
    cs = mk_cities(t["cities"])
    sink = []
    if bid in ("spichlerz", "spichlerz_ii"):
        if bid not in t["builtIds"]:
            res = {"inactive": False, "missingLabels": [], "tooltip": ""}
        else:
            d = sp_drain(cs, t["owner"], t["builtIds"], True)
            miss = [] if d["ceramikaPaid"] else ["Ceramika"]
            if bid == "spichlerz_ii" and not d["solPaid"]:
                miss.append("Sól")
            res = {"inactive": bool(miss), "missingLabels": miss, "tooltip": tooltip(miss)}
    elif not has_deposit_gate(bid):
        res = {"inactive": False, "missingLabels": [], "tooltip": ""}
    else:
        b = GB(t["building"]) if "building" in t else {"id": bid}
        kind = t["opt"]["kind"]
        stock = dec_opt_rec(t.get("stock"))
        # opts.resolveOwnerZlotoAccess przekazany tylko gdy rodzaj opcji ma resolver; ownerId zawsze z opts.ownerId
        opt = KIND[kind]
        if b["id"] == "mennica":
            if opt is not None and opt[1]:
                r, calls = make_resolver(kind, table)
                ok = r(t["owner"])
                sink.extend(calls)
            else:
                ok = can_feed(stock)
            miss = [] if ok else [ZLOTO_LABEL]
        else:
            miss = [l for l in required_labels(b) if not label_sat(l, t["rtBuilt"], stock)]
        res = {"inactive": bool(miss), "missingLabels": miss, "tooltip": tooltip(miss)}
    check(f"inactive#{i} {bid}", res, t["out"])
    check(f"inactive.calls#{i}", sink, t["opt"]["calls"])

print(f"sprawdzen={checks} rozbieznosci={diffs} nfd_punktow={nfd_checked} nfd_nieprzypisane_w_unicode14={unassigned}")
sys.exit(0 if diffs == 0 else 1)
