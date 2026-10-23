#!/usr/bin/env python3
"""P6.5B - NIEZALEZNY weryfikator wektorow (bez Rust, bez Node).

Osobna implementacja logiki `gra/src/game/manpower.ts` i `gra/src/game/unit-building-bonuses.ts`
(pin edb8fb56) napisana w Pythonie ze zrodel TS i danych weba (`gra/data/*.json`), z semantyka JS
(NaN, -0, Math.floor/ceil/round/min/max, Number#toString, String#trim, typeof). Dla KAZDEGO
przypadku zapisanego w `tests/p6_5b_vectors/*.json` liczy wynik od nowa i porownuje bitowo z
wynikiem URUCHOMIONEGO weba. Dodatkowo `tabela_vs_TS`: tabele Rust (`data/derived/*.json`) porownane
z literalami odczytanymi REGEXEM z tekstu TS oraz kopie danych weba z `rust-port/engine/data`.

Uzycie: python3 -I verify-p65b-vectors.py <WEB_ROOT> <ENGINE_DIR>
Wyjscie: `PRZYPADKOW: n`, `ROZBIEZNOSCI: m` (kod 0 gdy m == 0).
"""
import json
import math
import re
import struct
import sys
from decimal import Decimal
from functools import cmp_to_key
from pathlib import Path

WEB = Path(sys.argv[1])
ENG = Path(sys.argv[2])
VEC = ENG / "tests" / "p6_5b_vectors"
DER = ENG / "data" / "derived"
NAN = float("nan")
INF = float("inf")

CASES = 0
DIFFS = []


def fail(where, got, want):
    DIFFS.append((where, got, want))
    if len(DIFFS) <= 25:
        print(f"ROZBIEZNOSC {where}: python={got!r} web={want!r}")


def isnum(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def bits(x):
    return struct.pack("<d", float(x))


def dec(v):
    if isinstance(v, dict):
        if "$n" in v:
            return {"NaN": NAN, "Infinity": INF, "-Infinity": -INF, "-0": -0.0}[v["$n"]]
        if "$f" in v:
            return float(v["$f"])
        return {k: dec(x) for k, x in v.items()}
    if isinstance(v, list):
        return [dec(x) for x in v]
    return v


def eq(got, want):
    """Rownosc strukturalna: liczby bitowo (NaN == NaN, -0 != 0), reszta ==."""
    if isnum(got) and isnum(want):
        g, w = float(got), float(want)
        return (g != g and w != w) or bits(g) == bits(w)
    if isinstance(got, dict) and isinstance(want, dict):
        return got.keys() == want.keys() and all(eq(got[k], want[k]) for k in got)
    if isinstance(got, list) and isinstance(want, list):
        return len(got) == len(want) and all(eq(a, b) for a, b in zip(got, want))
    return got == want and type(got) is type(want)


def check(where, got, want):
    global CASES
    CASES += 1
    if not eq(got, want):
        fail(where, got, want)


# ---------------------------------------------------------------------------
# semantyka JS
# ---------------------------------------------------------------------------
def floor(x):
    x = float(x)
    if x != x or x in (INF, -INF) or x == 0:
        return x
    return float(math.floor(x))


def ceil(x):
    x = float(x)
    if x != x or x in (INF, -INF) or x == 0:
        return x
    r = float(math.ceil(x))
    return -0.0 if r == 0 and x < 0 else r


def jmin(a, b):
    a, b = float(a), float(b)
    if a != a or b != b:
        return NAN
    if a < b:
        return a
    if b < a:
        return b
    return a if math.copysign(1, a) < 0 else b


def jmax(a, b):
    a, b = float(a), float(b)
    if a != a or b != b:
        return NAN
    if a > b:
        return a
    if b > a:
        return b
    return a if math.copysign(1, a) > 0 else b


def jround(x):
    x = float(x)
    if x != x or x in (INF, -INF) or x == math.floor(x):
        return x
    f = float(math.floor(x))
    r = f + 1 if x - f >= 0.5 else f
    return -0.0 if r == 0 and x < 0 else r


def isfinite(x):
    return isnum(x) and math.isfinite(float(x))


def jstr(x):
    x = float(x)
    if x != x:
        return "NaN"
    if x == 0:
        return "0"
    if x == INF:
        return "Infinity"
    if x == -INF:
        return "-Infinity"
    sign = "-" if x < 0 else ""
    d = Decimal(repr(abs(x)))
    _, digs, exp = d.as_tuple()
    s = "".join(map(str, digs))
    n = len(s) + exp
    s = s.rstrip("0")
    k = len(s)
    if k <= n <= 21:
        body = s + "0" * (n - k)
    elif 0 < n <= 21:
        body = s[:n] + "." + s[n:]
    elif -6 < n <= 0:
        body = "0." + "0" * (-n) + s
    else:
        e = n - 1
        es = ("+" if e >= 0 else "-") + str(abs(e))
        body = s + "e" + es if k == 1 else s[0] + "." + s[1:] + "e" + es
    return sign + body


JS_WS = set(
    "\u0009\u000a\u000b\u000c\u000d       　﻿"
) | {chr(c) for c in range(0x2000, 0x200B)}


def jtrim(s):
    i, j = 0, len(s)
    while i < j and s[i] in JS_WS:
        i += 1
    while j > i and s[j - 1] in JS_WS:
        j -= 1
    return s[i:j]


# localeCompare: kolejnosc podstawowa z zrzutu Intl.Collator (wektor), poziom 3: male przed wielkimi
PRIMARY = None


def lc(a, b):
    w = lambda s: [PRIMARY.index(c.lower()) for c in s]
    wa, wb = w(a), w(b)
    if wa != wb:
        return -1 if wa < wb else 1
    for ca, cb in zip(a, b):
        if ca != cb:
            return -1 if ca.islower() else 1
    return 0


def num_cmp_key(f):
    """JS Array#sort: komparator zwraca liczbe; NaN traktowane jak 0."""

    def wrapped(a, b):
        r = f(a, b)
        if r != r:
            return 0
        return -1 if r < 0 else (1 if r > 0 else 0)

    return cmp_to_key(wrapped)


# ---------------------------------------------------------------------------
# dane weba
# ---------------------------------------------------------------------------
ROWS = json.load(open(WEB / "gra/data/epoka-ludnosc-manpower.json"))["epoki"]
MIASTO = json.load(open(WEB / "gra/data/miasto-params.json"))
REAL_BUILDINGS = json.load(open(WEB / "gra/data/buildings.json"))
CIV_CATEGORIES = {"osadnik", "robotnik", "zwiadowca"}
CIV_TYPES = {"Zwiadowca", "Osadnik", "Robotnik"}  # odczytane regexem ponizej (tabela_vs_TS)
SCOUT = "Zwiadowca"
DEFAULT_REGEN = {"regenProcMaxPerTurn": 2.0, "blockWhenBesieged": True}
DEFAULT_REPLENISH = {"easy": 40.0, "normal": 30.0, "hard": 20.0}


def epoka_row(epoka):
    f = floor(epoka)
    f = 1.0 if (f == 0 or f != f) else f
    e = jmax(1, jmin(10, f))
    for r in ROWS:
        if r["epoka"] == e:
            return r
    return ROWS[0]


def clamp_ludki(p):
    f = floor(p)
    f = 1.0 if (f == 0 or f != f) else f
    return jmax(1, f)


def scaled(base, mm):
    return floor(float(base) * jmax(0.1, mm))


def city_max(ludki, epoka, mm=1.0):
    return scaled(clamp_ludki(ludki) * epoka_row(epoka)["manpowerNaLudka"], mm)


def unit_cost(epoka, mm=1.0):
    return scaled(epoka_row(epoka)["manpowerNaJednostke"], mm)


def unit_cost_type(t, epoka, mm=1.0):
    return 0.0 if t == SCOUT else unit_cost(epoka, mm)


def city_cur(c, epoka, mm=1.0):
    mx = city_max(c["population"], epoka, mm)
    m = c.get("manpower")
    if m is None or not isnum(m) or not math.isfinite(float(m)):
        return mx
    return jmax(0, jmin(mx, floor(m)))


def regen_gain(ludki, epoka, params=None, regen_mult=1.0, mm=1.0):
    params = params or DEFAULT_REGEN
    mx = city_max(ludki, epoka, mm)
    p = float(params["regenProcMaxPerTurn"])
    if mx <= 0 or p <= 0:
        return 0.0
    pct = jmin(100, p) / 100
    return floor(mx * pct * jmax(0, regen_mult))


def civ_mult(bonusy, plus, times):
    mult = 1.0
    if not bonusy:
        return mult
    for b in bonusy:
        t, w = b.get("typ"), b.get("wartosc")
        if t == plus and isnum(w):
            mult *= 1 + float(w)
        elif t == times and isnum(w):
            mult *= float(w)
    return jmax(0.1, mult)


def civ_regen(b):
    return civ_mult(b, "bonus_pobor_regen", "mnoznik_pobor_regen")


def civ_max(b):
    return civ_mult(b, "bonus_pobor_pula", "mnoznik_manpower_max")


def empire_totals(cities, owner, epoka, mm=1.0):
    suma = ludn = rek = 0.0
    for c in cities:
        if c["ownerId"] != owner:
            continue
        suma += clamp_ludki(c["population"])
        ludn += clamp_ludki(c["population"]) * epoka_row(epoka)["ludekNaLudka"]
        rek += city_cur(c, epoka, mm)
    return {"sumaLudkow": suma, "ludnoscAbsolutna": ludn, "rekruci": rek, "poborRaw": ludn + rek}


def deduct(cities, owner, epoka, amount, mm=1.0):
    if amount <= 0:
        return True
    if empire_totals(cities, owner, epoka, mm)["rekruci"] < amount:
        return False
    remaining = float(amount)
    own = [c for c in cities if c["ownerId"] == owner]

    def cmpf(a, b):
        d = city_cur(b, epoka, mm) - city_cur(a, epoka, mm)
        return d if d != 0 else lc(a["id"], b["id"])

    for c in sorted(own, key=num_cmp_key(cmpf)):
        if remaining <= 0:
            break
        cur = city_cur(c, epoka, mm)
        take = jmin(cur, remaining)
        if take > 0:
            c["manpower"] = cur - take
            remaining -= take
    return remaining <= 0


def refund(cities, owner, epoka, amount, mm=1.0):
    if amount <= 0:
        return
    remaining = float(amount)
    own = [c for c in cities if c["ownerId"] == owner]

    def room(c):
        return city_max(c["population"], epoka, mm) - city_cur(c, epoka, mm)

    def cmpf(a, b):
        d = room(b) - room(a)
        return d if d != 0 else lc(a["id"], b["id"])

    for c in sorted(own, key=num_cmp_key(cmpf)):
        if remaining <= 0:
            break
        mx = city_max(c["population"], epoka, mm)
        cur = city_cur(c, epoka, mm)
        rm = mx - cur
        if rm <= 0:
            continue
        add = jmin(rm, remaining)
        c["manpower"] = cur + add
        remaining -= add


def cost_for_heal(heal, mx, uc):
    if heal <= 0 or mx <= 0 or uc <= 0:
        return 0.0
    return jmin(uc, ceil((heal / mx) * uc))


def max_afford(desired, mx, uc, avail):
    if desired <= 0 or mx <= 0 or uc <= 0 or avail <= 0:
        return 0.0
    return jmin(desired, floor(avail * mx / uc))


def heal_cap(mx, cur, pct):
    if mx <= 0 or cur <= 0 or cur >= mx:
        return 0.0
    cap = floor(mx * pct / 100)
    return jmax(0, jmin(cap, mx - cur))


def is_besieged(u, cities):
    if u.get("q") is None or u.get("r") is None:
        return False
    city = next((c for c in cities if c["q"] == u["q"] and c["r"] == u["r"]), None)
    if not city or city["ownerId"] != u["ownerId"]:
        return False
    return city.get("oblegane") is True


def is_civilian(u):
    return u["category"] in CIV_CATEGORIES or u["typeId"] in CIV_TYPES


def replenish_params(difficulty, raw):
    row = raw.get("manpower_uzupelnienie_hp_proc_max_tura") if raw is not None else MIASTO["manpower_uzupelnienie_hp_proc_max_tura"]
    row = row if isinstance(row, dict) else {}

    def pick(key):
        v = row.get(key)
        if isnum(v) and math.isfinite(float(v)) and v >= 0:
            return float(v)
        fb = row.get("normal")
        if isnum(fb) and math.isfinite(float(fb)) and fb >= 0:
            return float(fb)
        return DEFAULT_REPLENISH[key]

    return {"healPctMaxPerTurn": jmin(100, pick(difficulty))}


def regen_params(raw):
    pct = (raw.get("manpower_regen_proc_max_tura") or {}).get("wartosc") if isinstance(raw.get("manpower_regen_proc_max_tura"), dict) else None
    blk_row = raw.get("manpower_regen_blok_oblezenie")
    block = blk_row.get("wartosc") if isinstance(blk_row, dict) else None
    ok = isnum(pct) and pct >= 0
    return {
        "regenProcMaxPerTurn": float(pct) if ok else DEFAULT_REGEN["regenProcMaxPerTurn"],
        "blockWhenBesieged": True if block is None else not (isnum(block) and block == 0),
    }


def allocate(cands, avail):
    total = sum_f(c["desiredMp"] for c in cands)
    if total <= 0 or avail <= 0:
        return
    if total <= avail:
        for c in cands:
            c["allocatedMp"] = c["desiredMp"]
            c["healHp"] = c["desiredHeal"]
        return
    for c in cands:
        c["allocatedMp"] = floor(avail * c["desiredMp"] / total)
        c["healHp"] = max_afford(c["desiredHeal"], c["maxHp"], c["unitCost"], c["allocatedMp"])
        c["allocatedMp"] = cost_for_heal(c["healHp"], c["maxHp"], c["unitCost"])
    used = sum_f(cost_for_heal(c["healHp"], c["maxHp"], c["unitCost"]) for c in cands)
    remaining = jmax(0, avail - used)
    ideal = lambda c: avail * c["desiredMp"] / total
    while remaining > 0:
        elig = [c for c in cands if c["healHp"] < c["desiredHeal"]]

        def cmpf(a, b):
            g = (ideal(b) - b["allocatedMp"]) - (ideal(a) - a["allocatedMp"])
            return g if g != 0 else lc(a["id"], b["id"])

        elig.sort(key=num_cmp_key(cmpf))
        advanced = False
        for c in elig:
            nxt = cost_for_heal(c["healHp"] + 1, c["maxHp"], c["unitCost"])
            inc = nxt - c["allocatedMp"]
            if inc <= remaining:
                c["healHp"] += 1
                c["allocatedMp"] = nxt
                remaining -= inc
                advanced = True
                break
        if not advanced:
            break


def sum_f(it):
    s = 0.0
    for x in it:
        s += float(x)
    return s


def tick_replenish(cities, units, difficulty, era, bon, maxhp, raw):
    params = replenish_params(difficulty, raw)
    eras, bons, hpcalls, cbs = [], [], [], []
    if params["healPctMaxPerTurn"] <= 0 or not units:
        return {"healedCount": 0, "totalMpSpent": 0.0}, eras, bons, hpcalls, cbs
    by_owner = {}
    for u in units:
        if is_civilian(u):
            continue
        by_owner.setdefault(u["ownerId"], []).append(u)
    healed = 0
    spent = 0.0
    for owner, ounits in by_owner.items():
        epoka = era[owner]
        eras.append(owner)
        bons.append(owner)
        mm = civ_max(bon[owner])
        emp = empire_totals(cities, owner, epoka, mm)["rekruci"]
        if emp <= 0:
            continue
        cands = []
        for u in ounits:
            if is_besieged(u, cities):
                continue
            hpcalls.append({"typeId": u["typeId"], "id": u["id"], "hp": u.get("hp"), "hpMax": u.get("hpMax")})
            resolved = maxhp[u["id"]]
            if isnum(resolved) and math.isfinite(float(resolved)) and resolved > 0:
                mx = float(resolved)
            else:
                hm = u.get("hpMax")
                mx = float(hm) if isnum(hm) and math.isfinite(float(hm)) else 0.0
            if mx <= 0:
                continue
            u["hpMax"] = mx
            hp = u.get("hp")
            if hp is None:
                cur = mx
            elif isnum(hp) and math.isfinite(float(hp)):
                cur = jmax(0, jmin(mx, hp))
            else:
                cur = mx
            u["hp"] = cur
            if cur <= 0 or cur >= mx:
                continue
            uc = unit_cost_type(u["typeId"], epoka, mm)
            if uc <= 0 or u["typeId"] == SCOUT:
                continue
            dh = heal_cap(mx, cur, params["healPctMaxPerTurn"])
            if dh <= 0:
                continue
            dm = cost_for_heal(dh, mx, uc)
            if dm <= 0:
                continue
            cands.append({"u": u, "id": u["id"], "maxHp": mx, "curHp": cur, "unitCost": uc, "desiredHeal": dh, "desiredMp": dm, "allocatedMp": 0.0, "healHp": 0.0})
        allocate(cands, emp)
        for c in cands:
            if c["healHp"] <= 0:
                continue
            mc = cost_for_heal(c["healHp"], c["maxHp"], c["unitCost"])
            if mc <= 0:
                continue
            if not deduct(cities, owner, epoka, mc, mm):
                continue
            emp -= mc
            spent += mc
            c["u"]["hp"] = jmin(c["maxHp"], c["curHp"] + c["healHp"])
            cbs.append([c["u"]["id"], c["u"]["hp"], c["maxHp"]])
            healed += 1
    return {"healedCount": healed, "totalMpSpent": spent}, eras, bons, hpcalls, cbs


# ---------------------------------------------------------------------------
# unit-building-bonuses
# ---------------------------------------------------------------------------
ARMOR_IDS = ["kuznia", "kuznia_zelaza", "wielka_kuznia"]
SOFT_IDS = ["koszary", "akademia_wojskowa", "warsztat_oblezniczy"]
ARMOR_MAX, SOFT_MAX = 45, 50
DEPTH = 32


def mnoznik_of(b):
    baza = b.get("baza") if b else None
    v = baza.get("mnoznik") if isinstance(baza, dict) else None
    return float(v) if isnum(v) and math.isfinite(float(v)) and v > 0 else 0.0


def chain(start, by_id, allowed, counted):
    total = 0.0
    cur = start
    depth = 0
    visited = set()
    while cur and depth < DEPTH and cur not in visited:
        visited.add(cur)
        b = by_id.get(cur)
        if b is None:
            break
        if cur in allowed and cur not in counted:
            counted.add(cur)
            total += mnoznik_of(b)
        frm = jtrim(b["upgradeFrom"]) if isinstance(b.get("upgradeFrom"), str) else ""
        cur = frm or None
        depth += 1
    return total


def present_sum(built, buildings, ids):
    if not built or not buildings:
        return 0.0
    bset = set(built)
    by_id = {b["id"]: b for b in buildings}
    allowed = set(ids)
    counted = set()
    total = 0.0
    for i in ids:
        if i not in bset:
            continue
        total += chain(i, by_id, allowed, counted)
    return total


def cumulative(bid, buildings):
    if not buildings:
        return 0.0
    role = role_of(bid)
    if not role:
        return 0.0
    ids = ARMOR_IDS if role == "pancerz" else SOFT_IDS
    return chain(bid, {b["id"]: b for b in buildings}, set(ids), set())


def role_of(bid):
    if bid in ARMOR_IDS:
        return "pancerz"
    if bid in SOFT_IDS:
        return "parametry"
    return None


def proc(unit, key):
    v = unit.get(key) if isinstance(unit, dict) else None
    return float(v) if isnum(v) and math.isfinite(float(v)) and v > 0 else 0.0


BOUNDS_A = [floor(ARMOR_MAX / 3), floor((ARMOR_MAX * 2) / 3)]
BOUNDS_S = [floor(SOFT_MAX / 3), floor((SOFT_MAX * 2) / 3)]


def badge(pp, bounds):
    if not math.isfinite(pp) or pp <= 0:
        return 0
    if pp <= bounds[0]:
        return 1
    if pp <= bounds[1]:
        return 2
    return 3


def best_progress(unit, built, buildings):
    return {
        "pancerzBonusProc": jmax(proc(unit, "pancerzBonusProc"), present_sum(built, buildings, ARMOR_IDS)),
        "parametryBonusProc": jmax(proc(unit, "parametryBonusProc"), present_sum(built, buildings, SOFT_IDS)),
    }


def apply_gain(unit, built, buildings):
    pa, ps = proc(unit, "pancerzBonusProc"), proc(unit, "parametryBonusProc")
    nxt = best_progress(unit, built, buildings)
    ag = jmax(0, nxt["pancerzBonusProc"] - pa)
    sg = jmax(0, nxt["parametryBonusProc"] - ps)
    changed = ag > 0 or sg > 0
    if changed:
        unit["pancerzBonusProc"] = nxt["pancerzBonusProc"]
        unit["parametryBonusProc"] = nxt["parametryBonusProc"]
    return {"changed": changed, "armorGained": ag, "softGained": sg, "armorTotal": nxt["pancerzBonusProc"], "softTotal": nxt["parametryBonusProc"]}


def hint_text(label, city, g):
    parts = []
    if g["armorGained"] > 0:
        parts.append(f"Kuźnia +{jstr(g['armorGained'])}% pancerza (razem +{jstr(g['armorTotal'])}%)")
    if g["softGained"] > 0:
        parts.append(f"Koszary +{jstr(g['softGained'])}% parametrów (razem +{jstr(g['softTotal'])}%)")
    if not parts:
        return ""
    return f"{label} — {city}: {' · '.join(parts)}"


def bonus_label(unit):
    a, s = proc(unit, "pancerzBonusProc"), proc(unit, "parametryBonusProc")
    parts = []
    if a > 0:
        parts.append(f"Pancerz +{jstr(a)}%")
    if s > 0:
        parts.append(f"Parametry +{jstr(s)}%")
    return " · ".join(parts)


def truthy(x):
    return x is not None and x != 0 and x == x and x is not False


# ---------------------------------------------------------------------------
# weryfikacja
# ---------------------------------------------------------------------------
def load(name):
    return json.load(open(VEC / name))


def bl(v):
    """Lista budynkow z wektora: '$real' -> prawdziwe dane weba."""
    if v == "$real":
        return [{"id": b["id"], "baza": b.get("baza"), "upgradeFrom": b.get("upgradeFrom")} for b in REAL_BUILDINGS]
    return dec(v) if v is not None else None


def main():
    global PRIMARY, CIV_TYPES
    fmt = load("format.json")
    PRIMARY = fmt["cases"]["collate"]["primaryOrder"]
    consts = dec(fmt["consts"])

    # --- formaty
    for c in fmt["cases"]["fmt"]["numberToString"]:
        check("numberToString", jstr(dec(c["x"])), c["out"])

    def pop_abs(n):
        n = float(n)
        if n >= 1_000_000:
            m = n / 1_000_000
            return jstr(jround(m) if m >= 10 else jround(m * 10) / 10) + " mln"
        if n >= 1_000:
            t = n / 1_000
            return jstr(jround(t) if t >= 100 else jround(t * 10) / 10) + " tys."
        return jstr(n)

    for c in fmt["cases"]["fmt"]["formatPopulationAbs"]:
        x = dec(c["x"])
        check("formatPopulationAbs", pop_abs(x), c["out"])
        check("formatManpower", pop_abs(x), c["mp"])
    for c in fmt["cases"]["fmt"]["formatObywateleLabel"]:
        n = jmax(0, floor(dec(c["x"])))
        check("formatObywateleLabel", "1 obywatel" if n == 1 else f"{jstr(n)} obywateli", c["out"])
    for c in fmt["cases"]["collate"]["pairs"]:
        check("localeCompare", lc(c["a"], c["b"]), c["out"])

    # --- tabela epok
    for got, want in zip(ROWS, consts["rows"]):
        check("rows", got, want)

    mp = load("manpower.json")["cases"]
    S = mp["scalar"]
    for c in S["epokaManpowerRow"]:
        check("epokaManpowerRow", epoka_row(dec(c["epoka"])), dec(c["out"]))
    for c in S["clampLudki"]:
        check("clampLudki", clamp_ludki(dec(c["ludki"])), dec(c["out"]))
    for c in S["cityLudnoscAbsolutna"]:
        check("cityLudnoscAbsolutna", clamp_ludki(dec(c["ludki"])) * epoka_row(dec(c["epoka"]))["ludekNaLudka"], dec(c["out"]))
    for c in S["cityManpowerMax"]:
        check("cityManpowerMax", city_max(dec(c["ludki"]), dec(c["epoka"]), dec(c["maxMult"])), dec(c["out"]))
    for c in S["unitManpowerCost"]:
        check("unitManpowerCost", unit_cost(dec(c["epoka"]), dec(c["maxMult"])), dec(c["out"]))
    for c in S["unitManpowerCostForType"]:
        check("unitManpowerCostForType", unit_cost_type(c.get("typeId"), dec(c["epoka"]), dec(c["maxMult"])), dec(c["out"]))
    for c in S["rekrutUnitEquivalents"]:
        cost = unit_cost(dec(c["epoka"]), dec(c["maxMult"]))
        out = 0.0 if cost <= 0 else floor(jmax(0, dec(c["rekruci"])) / cost)
        check("rekrutUnitEquivalents", out, dec(c["out"]))
    for c in S["isScoutTypeId"]:
        check("isScoutTypeId", c.get("typeId") == SCOUT, c["out"])
    for c in S["manpowerCostForHeal"]:
        check("manpowerCostForHeal", cost_for_heal(dec(c["healHp"]), dec(c["maxHp"]), dec(c["unitCost"])), dec(c["out"]))
    for c in S["maxAffordableManpowerHeal"]:
        check("maxAffordableManpowerHeal", max_afford(dec(c["desiredHeal"]), dec(c["maxHp"]), dec(c["unitCost"]), dec(c["availableMp"])), dec(c["out"]))
    for c in S["manpowerHealCapForTurn"]:
        check("manpowerHealCapForTurn", heal_cap(dec(c["maxHp"]), dec(c["curHp"]), dec(c["pct"])), dec(c["out"]))
    for c in S["manpowerRegenGain"]:
        check("manpowerRegenGain", regen_gain(dec(c["ludki"]), dec(c["epoka"]), dec(c.get("params")), dec(c["regenMult"]), dec(c["maxMult"])), dec(c["out"]))
    for c in S["regenGainDefaults"]:
        check("regenGainDefaults", regen_gain(c["ludki"], c["epoka"]), dec(c["out"]))

    P = mp["params"]
    for c in P["replenish"]:
        check("loadManpowerReplenishParams", replenish_params(c["difficulty"], dec(c["raw"])), dec(c["out"]))
    for c in P["regen"]:
        check("loadManpowerRegenParams", regen_params(dec(c["raw"])), dec(c["out"]))
    check("defaultRegen", regen_params(MIASTO), consts["defaultRegen"])
    for d in ("easy", "normal", "hard"):
        check("defaultReplenish." + d, replenish_params(d, None), consts["defaultReplenish"][d])
    for c in P["civ"]:
        b = dec(c.get("bonusy"))
        check("civManpowerRegenMult", civ_regen(b), dec(c["regen"]))
        check("civManpowerMaxMult", civ_max(b), dec(c["max"]))
        check("civManpowerMults", {"regenMult": civ_regen(b), "maxMult": civ_max(b)}, dec(c["mults"]))

    C = mp["city"]
    for c in C["cityManpowerCurrent"]:
        check("cityManpowerCurrent", city_cur(dec(c["city"]), dec(c["epoka"]), dec(c["maxMult"])), dec(c["out"]))
    for c in C["tickManpowerRegen"]:
        city, e, mm = dec(c["city"]), dec(c["epoka"]), dec(c["maxMult"])
        params = dec(c.get("params")) or DEFAULT_REGEN
        mx, cur = city_max(city["population"], e, mm), city_cur(city, e, mm)
        if cur >= mx:
            out = mx
        elif params["blockWhenBesieged"] and city.get("oblegane"):
            out = cur
        else:
            gain = regen_gain(city["population"], e, params, dec(c["regenMult"]), mm)
            out = cur if gain <= 0 else jmin(mx, cur + gain)
        check("tickManpowerRegen", out, dec(c["out"]))
    for c in C["cityManpowerSnapshot"]:
        city, e, rm, mm = dec(c["city"]), dec(c["epoka"]), dec(c["regenMult"]), dec(c["maxMult"])
        ludki = clamp_ludki(city["population"])
        row = epoka_row(e)
        kj = scaled(row["manpowerNaJednostke"], mm)
        bi = city_cur(city, e, mm)
        out = {
            "epoka": float(row["epoka"]), "ludki": ludki, "ludnoscAbsolutna": ludki * row["ludekNaLudka"],
            "manpowerMax": scaled(ludki * row["manpowerNaLudka"], mm), "manpowerBiezacy": bi, "kosztJednostki": kj,
            "regenPerTurn": regen_gain(ludki, e, regen_params(MIASTO), rm, mm),
            "werbMaxPrzyPelnejPuli": floor(bi / kj) if kj > 0 else 0.0,
        }
        check("cityManpowerSnapshot", out, dec(c["out"]))
    for c in C["canAffordUnitManpower"]:
        cost = unit_cost_type(c.get("typeId"), dec(c["epoka"]), dec(c["maxMult"]))
        out = True if cost <= 0 else city_cur(dec(c["city"]), dec(c["epoka"]), dec(c["maxMult"])) >= cost
        check("canAffordUnitManpower", out, c["out"])
    for c in C["refreshManpowerAfterPopChange"]:
        city, e, mm = dec(c["city"]), dec(c["epoka"]), dec(c["maxMult"])
        prev = dec(c.get("previousPop"))
        mx, cur = city_max(city["population"], e, mm), city_cur(city, e, mm)
        if prev is not None and prev != city["population"]:
            old = city_max(prev, e, mm)
            out = jmin(mx, cur + (mx - old)) if city["population"] > prev else jmin(cur, mx)
        else:
            out = mx
        check("refreshManpowerAfterPopChange", out, dec(c["out"]))
    for c in C["spendManpower"]:
        city, e, mm = dec(c["city"]), dec(c["epoka"]), dec(c["maxMult"])
        amount = dec(c.get("amount"))
        cost = unit_cost(e, mm) if amount is None else amount
        check("spendManpower", jmax(0, city_cur(city, e, mm) - cost), dec(c["out"]))

    def refund_to_city(city, e, pop_cost, pop_cap, mm, tid):
        mp_refund = unit_cost_type(tid, e, mm)
        raw_pop = city["population"] + pop_cost
        population = jmin(pop_cap, raw_pop) if pop_cap is not None else raw_pop
        mx = city_max(population, e, mm)
        return {"population": population, "manpower": jmin(mx, city_cur(city, e, mm) + mp_refund)}

    for c in C["refundUnitSpawnToCity"]:
        check("refundUnitSpawnToCity", refund_to_city(dec(c["city"]), dec(c["epoka"]), dec(c["popCost"]), dec(c.get("popCap")), dec(c["maxMult"]), c.get("typeId")), dec(c["out"]))
    for c in C["refundDefaults"]:
        check("refundDefaults", refund_to_city(dec(c["city"]), dec(c["epoka"]), 1.0, None, 1.0, None), dec(c["out"]))
    for c in C["tryDeductUnitSpawnCosts"]:
        city, e, mm, pc = dec(c["city"]), dec(c["epoka"]), dec(c["maxMult"]), dec(c["popCost"])
        kosz = unit_cost_type(c.get("typeId"), e, mm)
        cur = city_cur(city, e, mm)
        if cur < kosz:
            out = {"ok": False, "population": city["population"], "manpower": cur, "kosztManpower": kosz, "reason": "brak_manpower"}
        elif pc > 0 and city["population"] <= pc:
            out = {"ok": False, "population": city["population"], "manpower": cur, "kosztManpower": kosz, "reason": "brak_ludnosci"}
        else:
            out = {"ok": True, "population": city["population"] - pc, "manpower": cur - kosz, "kosztManpower": kosz}
        check("tryDeductUnitSpawnCosts", out, dec(c["out"]))
    for c in C["empireTotals"]:
        cities, o, e, mm = dec(c["cities"]), c["ownerId"], dec(c["epoka"]), dec(c["maxMult"])
        t = empire_totals(cities, o, e, mm)
        check("empireSumaLudkow", sum_f(clamp_ludki(x["population"]) for x in cities if x["ownerId"] == o), dec(c["suma"]))
        check("empirePoborTotals", t, dec(c["totals"]))
        check("empireManpowerCurrent", t["rekruci"], dec(c["current"]))
    for c in C["canAffordEmpire"]:
        cities, o, e, mm = dec(c["cities"]), c["ownerId"], dec(c["epoka"]), dec(c["maxMult"])
        kosz = unit_cost_type(c.get("typeId"), e, mm)
        out = True if kosz <= 0 else empire_totals(cities, o, e, mm)["rekruci"] >= kosz
        check("canAffordUnitManpowerEmpire", out, c["out"])

    M = mp["mut"]
    for c in M["deduct"]:
        cities = dec(c["cities"])
        ok = deduct(cities, c["ownerId"], dec(c["epoka"]), dec(c["amount"]), dec(c["maxMult"]))
        check("deductManpowerFromEmpire.ok", ok, c["ok"])
        check("deductManpowerFromEmpire.after", strip_none(cities), dec(c["after"]))
    for c in M["refund"]:
        cities = dec(c["cities"])
        refund(cities, c["ownerId"], dec(c["epoka"]), dec(c["amount"]), dec(c["maxMult"]))
        check("refundManpowerToEmpire", strip_none(cities), dec(c["after"]))
    for c in M["tryDeductEmpire"]:
        cities = dec(c["cities"])
        o, e, mm = c["ownerId"], dec(c["epoka"]), dec(c["maxMult"])
        rc = next((x for x in cities if x["id"] == c["recruitingCityId"] and x["ownerId"] == o), None)
        kosz = unit_cost_type(c.get("typeId"), e, mm)
        rmp = city_cur(rc, e, mm) if rc else 0.0
        rpop = rc["population"] if rc else 0.0
        if rc is None:
            out = {"ok": False, "population": 0.0, "manpower": 0.0, "kosztManpower": kosz, "reason": "brak_manpower"}
        elif kosz > 0 and not deduct(cities, o, e, kosz, mm):
            out = {"ok": False, "population": rpop, "manpower": rmp, "kosztManpower": kosz, "reason": "brak_manpower"}
        else:
            out = {"ok": True, "population": rpop, "manpower": city_cur(rc, e, mm), "kosztManpower": kosz}
        check("tryDeductUnitSpawnCostsEmpire", out, dec(c["out"]))
        check("tryDeductUnitSpawnCostsEmpire.after", strip_none(cities), dec(c["after"]))

    X = mp["misc"]
    for c in X["isUnitInBesiegedLocation"]:
        check("isUnitInBesiegedLocation", is_besieged(dec(c["unit"]), dec(c["cities"])), c["out"])
    for c in X["replenishmentUnitSortKey"]:
        u, cities = dec(c["unit"]), dec(c["cities"])
        key = 2 if is_besieged(u, cities) else (0 if u.get("inGarnizon") is True else 1)
        check("replenishmentUnitSortKey", key, c["out"])
    for c in X["syncLiveUnitHp"]:
        units = dec(c["units"])
        live = next((u for u in units if u["id"] == c["unitId"]), None)
        if live:
            live["hp"] = dec(c["hp"])
            live["hpMax"] = dec(c["hpMax"])
        check("syncLiveUnitHp", units, dec(c["after"]))
    for c in X["isCivilianUnit"]:
        check("isCivilianUnit", is_civilian({"category": c["category"], "typeId": c["typeId"]}), c["out"])

    # --- leczenie
    rp = load("replenish.json")["cases"]["cases"]
    for n, c in enumerate(rp):
        cities, units = dec(c["cities"]), dec(c["units"])
        era = {k: dec(v) for k, v in c["era"]}
        bon = {k: (dec(v) if isinstance(v, list) else None) for k, v in c["bonusy"]}
        maxhp = {k: dec(v) for k, v in c["maxHp"]}
        raw = dec(c["raw"]) if "raw" in c and c["raw"] is not None else None
        result, eras, bons, hpcalls, cbs = tick_replenish(cities, units, c["difficulty"], era, bon, maxhp, raw)
        out = dec(c["out"])
        check(f"tick[{n}].result", result, out["result"])
        check(f"tick[{n}].cities", strip_none(cities), out["cities"])
        check(f"tick[{n}].units", strip_none(units), out["units"])
        check(f"tick[{n}].eraCalls", eras, out["eraCalls"])
        check(f"tick[{n}].bonCalls", bons, out["bonCalls"])
        check(f"tick[{n}].hpCalls", [strip_none(h) for h in hpcalls], out["hpCalls"])
        if c["withCb"]:
            check(f"tick[{n}].cbCalls", cbs, out["cbCalls"])
        else:
            check(f"tick[{n}].cbCalls(brak)", [], out["cbCalls"])

    # --- bonusy budynkow
    bv = load("buildings.json")["cases"]
    check("mnoznikRoleForBuildingId.lista", len(bv["mnoznikRoleForBuildingId"]) > 0, True)
    for c in bv["mnoznikRoleForBuildingId"]:
        check("mnoznikRoleForBuildingId", role_of(c["id"]), c["out"])
    for c in bv["cityBonus"]:
        built, bs = dec(c.get("built")), bl(c.get("buildings"))
        check("cityArmorBonusPercent", present_sum(built, bs, ARMOR_IDS), dec(c["armor"]))
        check("citySoftStatBonusPercent", present_sum(built, bs, SOFT_IDS), dec(c["soft"]))
    for c in bv["cumulative"]:
        check("cumulativeMnoznikForBuildingId", cumulative(c["id"], bl(c.get("buildings"))), dec(c["out"]))
    for c in bv["depth"]:
        bs = dec(c["buildings"])
        check("depth.armor", present_sum(c["built"], bs, ARMOR_IDS), dec(c["armor"]))
        check("depth.cumulative", cumulative("kuznia", bs), dec(c["cumulative"]))
    real = bl("$real")
    for c in bv["real"]:
        check("real.armor", present_sum(c["built"], real, ARMOR_IDS), dec(c["armor"]))
        check("real.soft", present_sum(c["built"], real, SOFT_IDS), dec(c["soft"]))
    for c in bv["realCumulative"]:
        check("realCumulative", cumulative(c["id"], real), dec(c["out"]))
        check("realCumulative.role", role_of(c["id"]), c["role"])
    for c in bv["unitProc"]:
        u = dec(c.get("unit"))
        check("unitPancerzBonusProc", proc(u, "pancerzBonusProc"), dec(c["pancerz"]))
        check("unitParametryBonusProc", proc(u, "parametryBonusProc"), dec(c["parametry"]))
        check("unitPancerzBonusFrac", proc(u, "pancerzBonusProc") / 100, dec(c["frac"]))
        check("unitParametryBonusFrac", proc(u, "parametryBonusProc") / 100, dec(c["fracP"]))
        check("armorPathBadgeLevel", badge(proc(u, "pancerzBonusProc"), BOUNDS_A), c["armorBadge"])
        check("softPathBadgeLevel", badge(proc(u, "parametryBonusProc"), BOUNDS_S), c["softBadge"])
        check("unitBuildingBonusLabel", bonus_label(u), c["label"])
        check("buildingCombatBonusForUnit", {"pancerz": proc(u, "pancerzBonusProc") / 100, "other": proc(u, "parametryBonusProc") / 100}, dec(c["combat"]))
    for c in bv["badgeGrid"]:
        pp = dec(c["pp"])
        check("badgeGrid.armor", badge(pp, BOUNDS_A), c["armor"])
        check("badgeGrid.soft", badge(pp, BOUNDS_S), c["soft"])
    check("ARMOR_PATH_LEVEL_MAX_PP", BOUNDS_A, consts["ARMOR_PATH_LEVEL_MAX_PP"])
    check("SOFT_PATH_LEVEL_MAX_PP", BOUNDS_S, consts["SOFT_PATH_LEVEL_MAX_PP"])
    for c in bv["apply"]:
        u0 = dec(c.get("unit"))
        built, bs = dec(c.get("built")), bl(c.get("buildings"))
        check("bestBuildingProgressAfterCityVisit", best_progress(u0, built, bs), dec(c["best"]))
        nxt = best_progress(u0, built, bs)
        would = nxt["pancerzBonusProc"] != proc(u0, "pancerzBonusProc") or nxt["parametryBonusProc"] != proc(u0, "parametryBonusProc")
        check("buildingProgressWouldChange", would, c["would"])
        live = dict(u0) if isinstance(u0, dict) else {}
        g = apply_gain(live, built, bs)
        check("applyCityVisitBonusGain", g, dec(c["gain"]))
        if not c["emptyInput"]:
            check("applyCityVisitBonusGain.unit", live, dec(c["unitAfter"]))
        check("formatBuildingBonusGainHint", hint_text(c["labelUnit"], c["cityName"], g), c["hint"])
    for c in bv["hint"]:
        check("formatBuildingBonusGainHint.siatka", hint_text("Wojownik", "Rzym", dec(c["gain"])), c["out"])
    for c in bv["merge"]:
        mods = dec(c["mods"])
        bonus = dec(c.get("bonus"))
        if isinstance(bonus, dict):
            if truthy(bonus["pancerz"]):
                mods["pancerz"] += bonus["pancerz"]
            if truthy(bonus["other"]):
                for k in ("atk", "obrona", "uderzenie", "rangedAtk", "health"):
                    mods[k] += bonus["other"]
        check("mergeBuildingBonusIntoStatMultipliers", mods, dec(c["after"]))
        check("merge.same", c["same"], True)

    tabela_vs_ts()

    print(f"PRZYPADKOW: {CASES}")
    print(f"ROZBIEZNOSCI: {len(DIFFS)}")
    return 0 if not DIFFS else 1


def strip_none(x):
    """Usuwa klucze o wartosci None (web: `undefined` = brak klucza w wektorze)."""
    if isinstance(x, dict):
        return {k: strip_none(v) for k, v in x.items() if v is not None}
    if isinstance(x, list):
        return [strip_none(v) for v in x]
    return x


# ---------------------------------------------------------------------------
# tabele Rust vs literaly z tekstu TS
# ---------------------------------------------------------------------------
def tabela_vs_ts():
    ts_m = (WEB / "gra/src/game/manpower.ts").read_text()
    ts_b = (WEB / "gra/src/game/unit-building-bonuses.ts").read_text()
    ts_s = (WEB / "gra/src/units/setup.ts").read_text()
    mpj = json.load(open(DER / "manpower-params.json"))
    ubj = json.load(open(DER / "unit-building-bonuses.json"))
    loc = json.load(open(DER / "locale-compare-ascii.json"))

    def rx(text, pattern, group=1):
        m = re.search(pattern, text, re.S)
        if not m:
            fail("tabela_vs_TS regex", pattern, None)
            return None
        return m.group(group)

    check("tabela_vs_TS.MAX_EPOKA", float(rx(ts_m, r"const MAX_EPOKA = (\d+);")), float(mpj["epoka"]["max"]))
    check("tabela_vs_TS.SCOUT_TYPE_ID", rx(ts_m, r"SCOUT_TYPE_ID = '([^']+)'"), mpj["scout_type_id"])
    check("tabela_vs_TS.DEFAULT_REGEN.pct", float(rx(ts_m, r"DEFAULT_REGEN[^{]*\{\s*regenProcMaxPerTurn: (\d+)")), mpj["domyslne_regen"]["proc_max_na_ture"])
    check("tabela_vs_TS.DEFAULT_REGEN.block", rx(ts_m, r"blockWhenBesieged: (true|false)") == "true", mpj["domyslne_regen"]["blokada_przy_oblezeniu"])
    for k in ("easy", "normal", "hard"):
        check("tabela_vs_TS.DEFAULT_REPLENISH." + k, float(rx(ts_m, k + r": (\d+),\s*\n(?:\s*\w+: \d+,\s*\n)*\}")), mpj["domyslne_uzupelnienie_hp_proc"][k])
    check("tabela_vs_TS.maks_proc", float(rx(ts_m, r"Math\.min\((\d+), pick\(difficulty\)\)")), mpj["maks_proc"])
    floors = re.findall(r"Math\.max\((0\.1), mult\)", ts_m) + re.findall(r"Math\.max\((0\.1), maxMult\)", ts_m)
    check("tabela_vs_TS.floors(3)", [float(f) for f in floors], [mpj["mnozniki_cywilizacji"]["regen_min"], mpj["mnozniki_cywilizacji"]["max_min"], mpj["mnozniki_cywilizacji"]["skalowanie_min"]])
    check("tabela_vs_TS.typ_regen_bonus", rx(ts_m, r"b\.typ === '(bonus_pobor_regen)'"), mpj["mnozniki_cywilizacji"]["typ_regen_bonus"])
    check("tabela_vs_TS.typ_regen_mnoznik", rx(ts_m, r"b\.typ === '(mnoznik_pobor_regen)'"), mpj["mnozniki_cywilizacji"]["typ_regen_mnoznik"])
    check("tabela_vs_TS.typ_pula_bonus", rx(ts_m, r"b\.typ === '(bonus_pobor_pula)'"), mpj["mnozniki_cywilizacji"]["typ_pula_bonus"])
    check("tabela_vs_TS.typ_pula_mnoznik", rx(ts_m, r"b\.typ === '(mnoznik_manpower_max)'"), mpj["mnozniki_cywilizacji"]["typ_pula_mnoznik"])
    sort_keys = [int(x) for x in re.findall(r"return (\d);", rx(ts_m, r"export function replenishmentUnitSortKey.*?\n\}\n", 0))]
    check("tabela_vs_TS.klucze_sortowania", sort_keys, [mpj["klucz_sortowania_leczenia"]["oblezone"], mpj["klucz_sortowania_leczenia"]["garnizon"], mpj["klucz_sortowania_leczenia"]["pole"]])
    check("tabela_vs_TS.powody", re.findall(r"'(brak_\w+)'", rx(ts_m, r"export type UnitSpawnBlockReason = ([^;]+);")), [mpj["powody_blokady"]["brak_manpower"], mpj["powody_blokady"]["brak_ludnosci"]])
    check("tabela_vs_TS.cywilne.kategorie", re.findall(r"'(\w+)'", rx(ts_s, r"CIVILIAN_CATEGORIES = new Set\(\[([^\]]+)\]")), mpj["cywilne"]["kategorie"])
    check("tabela_vs_TS.cywilne.typy", re.findall(r"'(\w+)'", rx(ts_s, r"CIVILIAN_TYPE_IDS = new Set\(\[([^\]]+)\]")), mpj["cywilne"]["typy"])
    check("tabela_vs_TS.obywatel", [rx(ts_m, r"return '1 (\w+)'"), rx(ts_m, r"`\$\{n\} (\w+)`")], [mpj["formatowanie"]["obywatel_jeden"], mpj["formatowanie"]["obywatel_wiele"]])
    check("tabela_vs_TS.progi_format", [float(rx(ts_m, r"n >= (1_000_000)").replace("_", "")), float(rx(ts_m, r"n >= (1_000)\)").replace("_", ""))], [mpj["formatowanie"]["prog_mln"], mpj["formatowanie"]["prog_tys"]])
    check("tabela_vs_TS.sufiksy", [rx(ts_m, r"' (mln)'"), rx(ts_m, r"' (tys\.)'")], [mpj["formatowanie"]["sufiks_mln"].strip(), mpj["formatowanie"]["sufiks_tys"].strip()])
    check("tabela_vs_TS.zaokraglenia", [float(rx(ts_m, r"\(m >= (\d+) \?")), float(rx(ts_m, r"\(t >= (\d+) \?")), float(rx(ts_m, r"Math\.round\(m \* (\d+)\)"))], [mpj["formatowanie"]["prog_calkowite_mln"], mpj["formatowanie"]["prog_calkowite_tys"], mpj["formatowanie"]["krok_dziesiatych"]])
    check("tabela_vs_TS.domyslny_zwrot", float(rx(ts_m, r"refundUnitSpawnToCity\(\s*city[^)]*popCost = (\d+)")), mpj["domyslny_zwrot_koszt_ludnosci"])

    check("tabela_vs_TS.ARMOR_IDS", re.findall(r"'(\w+)'", rx(ts_b, r"ARMOR_BUILDING_IDS: readonly string\[\] = \[([^\]]+)\]")), ubj["sciezka_pancerz"]["budynki"])
    check("tabela_vs_TS.SOFT_IDS", re.findall(r"'(\w+)'", rx(ts_b, r"SOFT_STAT_BUILDING_IDS: readonly string\[\] = \[([^\]]+)\]")), ubj["sciezka_parametry"]["budynki"])
    check("tabela_vs_TS.ARMOR_MAX", float(rx(ts_b, r"ARMOR_PATH_MAX_PP = (\d+);")), ubj["sciezka_pancerz"]["max_pp"])
    check("tabela_vs_TS.SOFT_MAX", float(rx(ts_b, r"SOFT_PATH_MAX_PP = (\d+);")), ubj["sciezka_parametry"]["max_pp"])
    check("tabela_vs_TS.DEPTH", float(rx(ts_b, r"MAX_UPGRADE_CHAIN_DEPTH = (\d+);")), float(ubj["max_glebokosc_lancucha"]))
    check("tabela_vs_TS.tercje", float(rx(ts_b, r"Math\.floor\(ARMOR_PATH_MAX_PP / (\d+)\)")), ubj["liczba_tercji"])
    check("tabela_vs_TS.podstawa_procentu", float(rx(ts_b, r"unitPancerzBonusProc\(unit\) / (\d+);")), ubj["podstawa_procentu"])
    check("tabela_vs_TS.ids==konstanty", [ARMOR_IDS, SOFT_IDS, ARMOR_MAX, SOFT_MAX, DEPTH], [ubj["sciezka_pancerz"]["budynki"], ubj["sciezka_parametry"]["budynki"], ubj["sciezka_pancerz"]["max_pp"], ubj["sciezka_parametry"]["max_pp"], ubj["max_glebokosc_lancucha"]])
    et = ubj["etykiety"]
    check("tabela_vs_TS.etykieta.pancerz", rx(ts_b, r"parts\.push\(`(Pancerz \+)\$\{armor\}%`\)") + "{wartosc}%", et["pancerz"])
    check("tabela_vs_TS.etykieta.parametry", rx(ts_b, r"parts\.push\(`(Parametry \+)\$\{soft\}%`\)") + "{wartosc}%", et["parametry"])
    check("tabela_vs_TS.etykieta.separator", [x for x in re.findall(r"parts\.join\('([^']*)'\)", ts_b)], [et["separator"], et["separator"]])
    check("tabela_vs_TS.etykieta.wzmianka", rx(ts_b, r"return `(\$\{unitLabel\} . \$\{cityName\}: \$\{parts\.join)").count("unitLabel") == 1 and et["wzmianka"] == "{jednostka} \u2014 {miasto}: {czesci}", True)
    check("tabela_vs_TS.etykieta.wzmianka_pancerz", rx(ts_b, r"push\(`(Ku\S+nia) \+\$\{gain\.armorGained\}% pancerza \(razem \+\$\{gain\.armorTotal\}%\)`").replace("ź", "ź"), et["wzmianka_pancerz"].split(" +")[0])
    check("tabela_vs_TS.etykieta.wzmianka_parametry", rx(ts_b, r"push\(`(Koszary) \+\$\{gain\.softGained\}% parametr"), et["wzmianka_parametry"].split(" +")[0])

    # kopie danych weba w silniku == dane weba
    for name in ("epoka-ludnosc-manpower.json", "miasto-params.json", "buildings.json"):
        a = json.load(open(WEB / "gra/data" / name))
        b = json.load(open(ENG / "data" / name))
        check("kopia_danych." + name, a == b, True)
    check("locale.kolejnosc", loc["kolejnosc_podstawowa"], PRIMARY)


if __name__ == "__main__":
    sys.exit(main())
