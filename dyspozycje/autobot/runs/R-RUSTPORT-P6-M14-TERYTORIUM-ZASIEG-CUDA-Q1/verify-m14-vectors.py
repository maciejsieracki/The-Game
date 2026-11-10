#!/usr/bin/env python3
"""Niezalezny weryfikator wektorow P6.M14 (R-RUSTPORT-P6-M14-TERYTORIUM-ZASIEG-CUDA-Q1).

NIE uzywa TypeScript, Node, gen-m14-vectors.mjs ani kodu Rust. Semantyke territory.ts /
territory-work.ts / range-hexes.ts / wonder-placement.ts implementuje od nowa w Pythonie na
podstawie TEKSTU zrodel weba (git archive edb8fb56): wejscia bierze z wektorow JSON, wynik liczy
sam i porownuje z wyjsciem zapisanym z URUCHOMIONEGO weba. Stale (fort/posterunek/min/cap) czyta
z gra/data/*.json. Dodatkowo sprawdza kotwice tekstowe zrodel.

Uzycie:  python3 -I verify-m14-vectors.py <WEB_ROOT> <VECTORS_DIR>
Wyjscie: 0 = 0 rozbieznosci, 1 = rozbieznosci, 2 = blad wejscia.
"""
import json
import math
import re
import sys
from pathlib import Path

if len(sys.argv) != 3:
    print("usage: <WEB_ROOT> <VECTORS_DIR>")
    sys.exit(2)
web = Path(sys.argv[1])
vdir = Path(sys.argv[2])

checks = 0
diffs = 0


def expect(label, got, want):
    global checks, diffs
    checks += 1
    if got != want:
        diffs += 1
        if diffs <= 40:
            print(f"ROZBIEZNOSC {label}: py={got!r} json={want!r}")


def rd(rel):
    return (web / rel).read_text(encoding="utf-8")


def load(name):
    return json.loads((vdir / name).read_text(encoding="utf-8"))


# ---------- kotwice tekstowe zrodel ----------
SRC = {n: rd(f"gra/src/map/{n}.ts").split("\n") for n in ["territory", "territory-work", "range-hexes", "wonder-placement"]}
expect("linie territory.ts", len(SRC["territory"]) - 1, 145)
expect("linie territory-work.ts", len(SRC["territory-work"]) - 1, 166)
expect("linie range-hexes.ts", len(SRC["range-hexes"]) - 1, 115)
expect("linie wonder-placement.ts", len(SRC["wonder-placement"]) - 1, 119)
T = "\n".join(SRC["territory"])
for needle in [
    "if (node.isFort)    return 10;",
    "if (node.isOutpost) return 5;",
    "return cityRangeForPopulation(node.pop);",
    "if (dist < bestDist) {",
    "if (dist > radius) continue;",
    "playerOwnerId = 0",
    "return territoryOwnerAt(q, r, allNodes) === playerOwnerId;",
]:
    expect(f"kotwica territory.ts: {needle}", needle in T, True)
WK = "\n".join(SRC["territory-work"])
for needle in ["level: 1,", "if (!territoryNodes.length) return false;", "if (centers.has(key)) return false;",
               "if (!Number.isFinite(q) || !Number.isFinite(r)) return true;", "if (!city.okolicaReczne) continue;"]:
    expect(f"kotwica territory-work.ts: {needle}", needle in WK, True)
RH = "\n".join(SRC["range-hexes"])
for needle in ["ownerId = 0,", "stateReligion?.trim() || null", "Math.max(0, Math.floor(params.szerzenieMaxDystans ?? 0))",
               "if (rangeR <= 0) continue;", "if (sight <= 0) continue;", "level: 1,"]:
    expect(f"kotwica range-hexes.ts: {needle}", needle in RH, True)
WP = "\n".join(SRC["wonder-placement"])
for needle in ["if (dist > radius || dist === 0) continue;", "candidates.sort((a, b) => a.dist - b.dist || a.q - b.q || a.r - b.r);",
               "return !isWaterTerrain(t) && t !== TerenBazowy.Gory;", "seen.set(`${h.q},${h.r}`, h);"]:
    expect(f"kotwica wonder-placement.ts: {needle}", needle in WP, True)
OK = rd("gra/src/game/okolica.ts")
for needle in ["if (pop <= 0) return 0;", "return Math.min(Math.max(CITY_RANGE_MIN, pop), CITY_RANGE_CAP);",
               "if (base <= 0) return 0;", "return base + cityBorderRadius(kulturaSkumulowana);"]:
    expect(f"kotwica okolica.ts: {needle}", needle in OK, True)

# ---------- stale z danych weba ----------
ti = json.loads(rd("gra/data/terrain-improvements.json"))
mp = json.loads(rd("gra/data/miasto-params.json"))
FORT_R = ti["fort"]["zasieg_terytorium"]
OUTPOST_R = ti["posterunek"]["zasieg_terytorium"]
RANGE_MIN = mp["zasieg_okolicy_baza"]["wartosc"]
RANGE_CAP = mp["zasieg_okolicy_max"]["wartosc"]
expect("fort=10 (kotwica danych)", FORT_R, 10)
expect("posterunek=5 (kotwica danych)", OUTPOST_R, 5)


# ---------- dekodowanie liczb specjalnych ----------
def dec(v):
    if isinstance(v, str):
        return {"NaN": math.nan, "Infinity": math.inf, "-Infinity": -math.inf, "-0": -0.0}[v]
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else v


def same(a, b):
    """Rownosc bitowa dla float (NaN==NaN, -0 != 0)."""
    if isinstance(a, float) and isinstance(b, float):
        if math.isnan(a) and math.isnan(b):
            return True
        return math.copysign(1.0, a) == math.copysign(1.0, b) and a == b
    return a == b


# ---------- semantyka JS ----------
JS_WS = "\t\n\u000b\u000c\r                  　﻿"


def js_trim(s):
    return s.strip(JS_WS)


DEC_RE = re.compile(r"^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$", re.A)


def js_number(s):
    t = js_trim(s)
    if t == "":
        return 0.0
    if t in ("Infinity", "+Infinity"):
        return math.inf
    if t == "-Infinity":
        return -math.inf
    m = re.match(r"^0[xX]([0-9a-fA-F]+)$", t)
    if m:
        return float(int(m.group(1), 16))
    m = re.match(r"^0[oO]([0-7]+)$", t)
    if m:
        return float(int(m.group(1), 8))
    m = re.match(r"^0[bB]([01]+)$", t)
    if m:
        return float(int(m.group(1), 2))
    if DEC_RE.match(t):
        return float(t)
    return math.nan


def parse_key(key):
    parts = key.split(",")
    q = js_number(parts[0]) if len(parts) > 0 else math.nan
    r = js_number(parts[1]) if len(parts) > 1 else math.nan
    if math.isfinite(q) and math.isfinite(r):
        return q, r
    return None


# ---------- territory.ts ----------
def axial(aq, ar, bq, br):
    a_s = -aq - ar
    b_s = -bq - br
    return (abs(aq - bq) + abs(ar - br) + abs(a_s - b_s)) / 2


def range_for_pop(pop):
    pop = dec(pop)
    p = math.floor(pop) if math.isfinite(pop) else 0
    if p <= 0:
        return 0.0
    return float(min(max(RANGE_MIN, p), RANGE_CAP))


def radius(node):
    if node.get("isFort"):
        return float(FORT_R)
    if node.get("isOutpost"):
        return float(OUTPOST_R)
    return range_for_pop(node["pop"])


def owner_at(q, r, nodes):
    best_owner, best = None, math.inf
    for n in nodes:
        rad = radius(n)
        d = axial(q, r, n["q"], n["r"])
        if d > rad:
            continue
        if d < best:
            best, best_owner = d, n["ownerId"]
    return best_owner


def in_territory(q, r, nodes):
    return any(axial(q, r, n["q"], n["r"]) <= radius(n) for n in nodes)


def player_hex(q, r, player_nodes, all_nodes, owner):
    if len(all_nodes) > 0:
        return owner_at(q, r, all_nodes) == owner
    return in_territory(q, r, player_nodes)


d = load("territory.json")
expect("CITY_RANGE_MIN", d["constants"]["CITY_RANGE_MIN"], RANGE_MIN)
expect("CITY_RANGE_CAP", d["constants"]["CITY_RANGE_CAP"], RANGE_CAP)
for i, c in enumerate(d["radius"]):
    expect(f"radius[{i}]", same(radius(c["node"]), dec(c["out"])), True)
for i, c in enumerate(d["axial"]):
    expect(f"axial[{i}]", same(axial(dec(c["a"][0]), dec(c["a"][1]), dec(c["b"][0]), dec(c["b"][1])), dec(c["out"])), True)
for i, c in enumerate(d["range_for_pop"]):
    expect(f"range_for_pop[{i}]", same(range_for_pop(c["pop"]), dec(c["out"])), True)
borders = {(repr(dec(b["kultura"]))): dec(b["ring"]) for b in d["border"]}
# niezalezna regula pierscieni kultury (FALLBACK_CULTURE_PARAMS 100/250/500) wzgledem tabeli z weba
src_cr = rd("gra/src/game/culture-religion.ts")
th = [int(x) for x in re.findall(r"progZasieg[123]:\s+(\d+),", src_cr)[:3]]
expect("progi kultury 100/250/500 (kotwica)", th, [100, 250, 500])
for b in d["border"]:
    k = dec(b["kultura"])
    k = k if math.isfinite(k) else 0.0  # finiteOr(v, 0) (culture-religion.ts:146)
    ring = 3 if k >= th[2] else 2 if k >= th[1] else 1 if k >= th[0] else 0
    expect(f"border[{b['kultura']}]", float(ring), dec(b["ring"]))
for i, c in enumerate(d["sight"]):
    pop = dec(c["pop"])
    kult = 0.0 if c["kultura"] is None else dec(c["kultura"])
    base = range_for_pop(pop)
    got = 0.0 if base <= 0 else base + borders[repr(kult)]
    expect(f"sight[{i}]", same(got, dec(c["out"])), True)
for i, c in enumerate(d["owner_at"]):
    expect(f"owner_at[{i}]", owner_at(dec(c["q"]), dec(c["r"]), c["nodes"]), c["out"])
for i, c in enumerate(d["in_territory"]):
    expect(f"in_territory[{i}]", in_territory(dec(c["q"]), dec(c["r"]), c["nodes"]), c["out"])
for i, c in enumerate(d["player_hex"]):
    expect(f"player_hex[{i}]", player_hex(dec(c["q"]), dec(c["r"]), c["playerNodes"], c["allNodes"], c.get("playerOwnerId", 0)), c["out"])

# ---------- territory-work.ts ----------
w = load("work.json")


def owned_by(q, r, owner, nodes):
    if not nodes:
        return False
    return owner_at(q, r, nodes) == owner


for i, c in enumerate(w["build"]):
    got = [{"q": x["q"], "r": x["r"], "pop": x["population"], "level": 1, "ownerId": x["ownerId"]} for x in c["cities"]]
    expect(f"build[{i}]", got, c["out"])
for i, c in enumerate(w["owned_by"]):
    expect(f"owned_by[{i}]", owned_by(dec(c["q"]), dec(c["r"]), c["ownerId"], c["nodes"]), c["out"])
for i, c in enumerate(w["filter"]):
    blocked = None if c["blocked"] is None else {tuple(b) for b in c["blocked"]}
    got = []
    for q, r in c["queries"]:
        if blocked is not None and (q, r) in blocked:
            got.append(False)
        else:
            got.append(owned_by(q, r, c["ownerId"], c["nodes"]))
    expect(f"filter[{i}]", got, c["out"])
for i, c in enumerate(w["center_keys"]):
    expect(f"center_keys[{i}]", sorted({f"{x['q']},{x['r']}" for x in c["cities"]}), c["out"])


def reczne_legal(key, owner, centers, nodes, lost):
    if key in centers:
        return False
    pk = parse_key(key) if len(key.split(",")) >= 1 else None
    # Number.isFinite sprawdzane na q i r (web `parts[0]`, `parts[1]`)
    if pk is None:
        return True
    if not owned_by(pk[0], pk[1], owner, nodes):
        return False
    if lost is not None and key in lost:
        return False
    return True


for i, c in enumerate(w["reczne_legal"]):
    lost = None if c["lost"] is None else set(c["lost"])
    expect(f"reczne_legal[{i}] {c['key']!r}", reczne_legal(c["key"], c["ownerId"], set(c["centers"]), c["nodes"], lost), c["out"])


def reconcile_owner(cities, nodes, owner, lost):
    cities = json.loads(json.dumps(cities))
    changed = False
    centers = {f"{x['q']},{x['r']}" for x in cities}
    for city in cities:
        if city["ownerId"] != owner:
            continue
        if "okolicaReczne" not in city:
            continue
        reczne = dict(city["okolicaReczne"])
        cc = False
        lost_c = None if lost is None else lost.get(city["id"])
        for key in list(reczne.keys()):
            pk = parse_key(key)
            if pk is None:
                continue
            if key in centers:
                del reczne[key]
                cc = True
                continue
            if not owned_by(pk[0], pk[1], owner, nodes):
                del reczne[key]
                cc = True
                continue
            if lost_c is not None and key in lost_c:
                del reczne[key]
                cc = True
        if cc:
            city["okolicaReczne"] = reczne
            changed = True
    return changed, cities


for i, c in enumerate(w["reconcile_owner"]):
    lost = None if c["lost"] is None else {k: set(v) for k, v in c["lost"].items()}
    changed, after = reconcile_owner(c["cities"], c["nodes"], c["ownerId"], lost)
    expect(f"reconcile_owner[{i}].changed", changed, c["changed"])
    expect(f"reconcile_owner[{i}].after", after, c["after"])
for i, c in enumerate(w["reconcile_all"]):
    lost = None if c["lost"] is None else {k: set(v) for k, v in c["lost"].items()}
    cities = c["cities"]
    for oid in sorted({x["ownerId"] for x in cities}):
        _, cities = reconcile_owner(cities, c["nodes"], oid, lost)
    expect(f"reconcile_all[{i}]", cities, c["after"])

# ---------- range-hexes.ts ----------
rg = load("range.json")
for i, c in enumerate(rg["by_owner"]):
    out = {}
    f = c["filter"]
    for key in c["keys"]:
        pk = parse_key(key)
        if pk is None:
            continue
        o = owner_at(pk[0], pk[1], c["nodes"])
        if o is None:
            continue
        if f is not None and (o in f["denyOwners"] or key in f["denyKeys"]):
            continue
        out.setdefault(str(o), set()).add(key)
    expect(f"by_owner[{i}]", {k: sorted(v) for k, v in out.items()}, c["out"])
border_tab = {repr(dec(b["kultura"])): dec(b["ring"]) for b in rg["border"]}
for i, c in enumerate(rg["culture"]):
    owner = c.get("ownerId", 0)
    out = set()
    for ct in c["cities"]:
        if ct["ownerId"] != owner:
            continue
        base = range_for_pop(ct["population"])
        sight = 0.0 if base <= 0 else base + border_tab[repr(dec(ct["kultura"]))]
        if sight <= 0:
            continue
        for key in c["keys"]:
            pk = parse_key(key)
            if pk is None:
                continue
            if axial(pk[0], pk[1], ct["q"], ct["r"]) <= sight:
                out.add(key)
    expect(f"culture[{i}]", sorted(out), c["out"])


def canon(counts):
    return json.dumps(sorted(counts.items()))


dom_tab = {(canon(r["counts"]), r["progDominacjiPct"]): r["result"] for r in rg["dominant"]}
# niezalezne przeliczenie dominantReligion z tekstu zrodla (leadingReligion/total/prog)
for r in rg["dominant"]:
    counts = {k: v for k, v in r["counts"].items() if isinstance(v, (int, float)) and v > 0}
    total = sum(counts.values())
    if total <= 0:
        want = {"religion": None, "share": 0, "status": "none"}
    else:
        lead_n = max(counts.values())
        # remis: pierwszy wg leadingReligion (porzadek kluczy); sprawdzamy tylko status/religion gdy bez remisu
        leaders = [k for k, v in counts.items() if v == lead_n]
        share = lead_n / total
        thr = max(0, min(100, r["progDominacjiPct"])) / 100
        if share > thr:
            want = {"religion": leaders[0] if len(leaders) == 1 else r["result"]["religion"], "share": share, "status": "dominant"}
        else:
            want = {"religion": None, "share": share, "status": "mixed"}
    expect(f"dominant {r['counts']} prog={r['progDominacjiPct']}", (want["religion"], want["status"]), (r["result"]["religion"], r["result"]["status"]))
for i, c in enumerate(rg["religion"]):
    owner = c.get("ownerId", 0)
    sd = c["szerzenieMaxDystans"]
    spread = max(0, math.floor(sd if sd is not None else 0))
    st = c["stateReligion"]
    state = js_trim(st) if st is not None else None
    state = state or None
    out = set()
    for ct in c["cities"]:
        if ct["ownerId"] != owner:
            continue
        rel = c["relig"].get(ct["id"], {"counts": {}})
        dom = dom_tab[(canon(rel["counts"]), c["progDominacjiPct"])]
        has_state = bool(state and rel["counts"].get(state, 0) > 0)
        is_dom = bool(state and dom["religion"] == state and dom["status"] == "dominant")
        if state and not has_state and not is_dom and len(rel["counts"]) > 0:
            continue
        node = {"pop": ct["population"], "isOutpost": ct.get("isOutpost"), "isFort": ct.get("isFort")}
        range_r = radius(node) + spread
        if range_r <= 0:
            continue
        for key in c["keys"]:
            pk = parse_key(key)
            if pk is None:
                continue
            if axial(pk[0], pk[1], ct["q"], ct["r"]) <= range_r:
                out.add(key)
    expect(f"religion[{i}]", sorted(out), c["out"])

# ---------- wonder-placement.ts ----------
wd = load("wonder.json")
WATER = {"morze", "plytkie_morze"}


def city_list(hexes, city, occupied, city_hexes):
    node = {"pop": city["population"], "isOutpost": city.get("isOutpost"), "isFort": city.get("isFort")}
    rad = radius(node)
    cands = []
    for h in hexes:
        dist = axial(h["q"], h["r"], city["q"], city["r"])
        if dist > rad or dist == 0:
            continue
        if h["terrain"] in WATER or h["terrain"] == "gory":
            continue
        if any(o["q"] == h["q"] and o["r"] == h["r"] for o in occupied) or any(o["q"] == h["q"] and o["r"] == h["r"] for o in city_hexes):
            continue
        cands.append((dist, h["q"], h["r"]))
    cands.sort()
    return [{"q": q, "r": r} for _, q, r in cands]


for i, c in enumerate(wd["city"]):
    expect(f"wonder.city[{i}]", city_list(c["hexes"], c["city"], c["occupiedWonderHexes"], c["cityHexes"]), c["out"])
for i, c in enumerate(wd["pick"]):
    lst = city_list(c["hexes"], c["city"], c["occupiedWonderHexes"], c["cityHexes"])
    expect(f"wonder.pick[{i}]", lst[0] if lst else None, c["out"])
for i, c in enumerate(wd["owner"]):
    occ = c["occupiedWonderHexes"] + c["buildingWonderHexes"]
    seen = {}
    for city in c["playerCities"]:
        for h in city_list(c["hexes"], city, occ, c["cityHexes"]):
            seen[(h["q"], h["r"])] = h  # dict zachowuje pozycje pierwszego wstawienia, jak JS Map
    expect(f"wonder.owner[{i}]", list(seen.values()), c["out"])

print(f"checks={checks} rozbieznosci={diffs}")
sys.exit(0 if diffs == 0 else 1)
