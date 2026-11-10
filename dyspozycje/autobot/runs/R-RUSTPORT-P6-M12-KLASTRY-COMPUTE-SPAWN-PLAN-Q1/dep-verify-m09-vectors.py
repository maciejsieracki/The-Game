#!/usr/bin/env python3
"""NIEZALEZNY weryfikator P6.M09.

Reimplementuje w Pythonie logike wycinka rywali klastra z KODU TS (specyfikacja: clusters.ts,
cluster-spawn.ts z pinu edb8fb56), BEZ wykonywania TS, BEZ generatora, BEZ Rust, i porownuje wynik
z wektorami z uruchomionego weba. Dodatkowo wyciaga regexem z TS literaly/stale i porownuje je
z tabela silnika `data/derived/mapgen-cluster-rivals.json`.

Uzycie: verify-m09-vectors.py <WEB_ROOT> <WEB_VECTORS_JSON> <MAPS_JSON> <DERIVED_JSON>
Kod wyjscia: 0 = 0 rozbieznosci.
"""
import json
import math
import re
import sys

web_root, vec_path, maps_path, derived_path = sys.argv[1:5]
V = json.load(open(vec_path, encoding="utf-8"))
MAPS = json.load(open(maps_path, encoding="utf-8"))
D = json.load(open(derived_path, encoding="utf-8"))
CL = open(f"{web_root}/gra/src/map/clusters.ts", encoding="utf-8").read().split("\n")
CS = open(f"{web_root}/gra/src/map/cluster-spawn.ts", encoding="utf-8").read().split("\n")

checks = 0
bad = 0


def check(cond, msg):
    global checks, bad
    checks += 1
    if not cond:
        bad += 1
        if bad <= 40:
            print("ROZBIEZNOSC:", msg)


# ----------------------------------------------------------------------------------------------
# 1. Literaly z TS vs tabela silnika (regex po zrodle, numery linii z pinu)
# ----------------------------------------------------------------------------------------------
def line(file, n):
    return file[n - 1]


def num(rx, text):
    m = re.search(rx, text)
    check(m is not None, f"regex {rx} nie pasuje do: {text}")
    return float(m.group(1)) if m else None


consts_ts = {
    "min": num(r"CLUSTER_CITY_STATE_MIN_HEX = (-?\d+(?:\.\d+)?);", line(CL, 42)),
    "max": num(r"CLUSTER_CITY_STATE_MAX_HEX = (-?\d+(?:\.\d+)?);", line(CL, 47)),
    "foreign": num(r"MIN_DIST_FOREIGN_FROM_PLAYER = (-?\d+(?:\.\d+)?);", line(CL, 54)),
    "reserve": num(r"CLUSTER_GROWTH_RESERVE = (-?\d+(?:\.\d+)?);", line(CL, 58)),
}
check("MIN_DIST_START_CITY_STATE = CLUSTER_CITY_STATE_MIN_HEX;" in line(CL, 49), "alias :49")
check("MIN_DIST_FOREIGN_IN_CLUSTER = MIN_DIST_START_CITY_STATE;" in line(CL, 56), "alias :56")
check(consts_ts["min"] == D["promien_miasta_panstwa_min_hex"]["wartosc"], "min_hex")
check(consts_ts["max"] == D["promien_miasta_panstwa_max_hex"]["wartosc"], "max_hex")
check(consts_ts["foreign"] == D["min_dystans_obce_od_gracza"]["wartosc"], "foreign")
check(consts_ts["reserve"] == D["rezerwa_wzrostu_klastra"]["wartosc"], "reserve")
P = D["pakowanie"]
check(num(r"Math\.max\((\d+), Math\.ceil", line(CL, 1348)) == P["min_pierscieni"]["wartosc"], "min_pierscieni")
check(num(r"\* (\d+\.\d+)\)\);", line(CL, 1348)) == P["wspolczynnik_pierscieni"]["wartosc"], "wspolczynnik")
check(num(r"Math\.max\(minDist \* (\d+),", line(CL, 1349)) == P["min_promien_w_odstepach"]["wartosc"], "min_promien")
check(num(r"packR \+ minDist \* (\d+)", line(CL, 1791)) == P["rozszerzenie_max_krokow_w_odstepach"]["wartosc"], "rozszerzenie")
check(num(r"maxMiast \* (\d+)\) break", line(CL, 1795)) == P["pula_max_mnoznik"]["wartosc"], "pula_max")
check(num(r"clusterPackRadius\(totalPack, minDist\) \* (\d+);", line(CL, 2065)) == P["rozszerzony_promien_mnoznik"]["wartosc"], "rozszerzony")
check(num(r"lenSq < (\d+\.\d+)\)", line(CL, 1887)) == D["polplaszczyzna"]["prog_dlugosci_kw"]["wartosc"], "prog")
check(num(r"margin = (-?\d+\.\d+),", line(CL, 1899)) == D["polplaszczyzna"]["margines"]["wartosc"], "margin")
# stale algorytmiczne nazwane w Rust: sprawdzenie obecnosci w TS
check("0x9e3779b9" in line(CL, 1927), "xor ziarna :1927")
for n, c in ((2076, "0x517cc1b7"), (2077, "0x85ebca6b"), (2078, "0xc2b2ae35")):
    check(c in line(CL, n), f"przesuniecie ziarna :{n}")

# ----------------------------------------------------------------------------------------------
# 2. Reimplementacja logiki (z kodu TS jako specyfikacji)
# ----------------------------------------------------------------------------------------------
M32 = 0xFFFFFFFF
DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]
MIN_HEX = int(consts_ts["min"])
MAX_HEX = int(consts_ts["max"])
RESERVE = int(consts_ts["reserve"])


def imul(a, b):
    return ((a & M32) * (b & M32)) & M32


def mulberry32(seed):
    s = [seed & M32]

    def nxt():
        s[0] = (s[0] + 0x6D2B79F5) & M32
        t = imul(s[0] ^ (s[0] >> 15), 1 | s[0])
        t = t ^ ((t + imul(t ^ (t >> 7), 61 | t)) & M32)
        return ((t ^ (t >> 14)) & M32) / 4294967296

    return nxt


def hd(a, b):
    dq = abs(a[0] - b[0])
    dr = abs(a[1] - b[1])
    ds = abs((-a[0] - a[1]) - (-b[0] - b[1]))
    return max(dq, dr, ds)


def shuffle(arr, rand):
    for i in range(len(arr) - 1, 0, -1):
        j = math.floor(rand() * (i + 1))
        arr[i], arr[j] = arr[j], arr[i]


def pack_radius(max_miast, min_dist):
    rings = max(2, math.ceil(math.sqrt(max(1, max_miast)) * 1.35))
    return max(min_dist * 2, rings * min_dist)


def buffer_gate(h, buffers):
    for b in buffers:
        if hd(h, (b["q"], b["r"])) < b["radius"]:
            return False
    return True


def land_pool(region, centrum, max_miast, min_dist, max_radius=None):
    pack_r = max_radius if max_radius is not None else pack_radius(max_miast, min_dist)
    near = [(c, hd(c, centrum)) for c in region]
    near = [x for x in near if x[1] <= pack_r]
    near.sort(key=lambda x: (x[1], x[0][0], x[0][1]))
    near = [x[0] for x in near]
    if len(near) >= max_miast:
        return near
    if max_radius is not None:
        return near if len(near) > 0 else list(region)
    expanded = pack_r + min_dist
    while len(near) < max_miast and expanded <= pack_r + min_dist * 6:
        for c in region:
            if c in near:
                continue
            if hd(c, centrum) <= expanded:
                near.append(c)
            if len(near) >= max_miast * 3:
                break
        expanded += min_dist
    return near if len(near) > 0 else list(region)


def hexes_at(q, r, dist):
    if dist <= 0:
        return [(q, r)]
    frontier = [(q, r)]
    for _ in range(dist):
        nxt = []
        seen = set()
        for h in frontier:
            for d in DIRS:
                n = (h[0] + d[0], h[1] + d[1])
                if n in seen:
                    continue
                seen.add(n)
                nxt.append(n)
        frontier = nxt
    return frontier


def axis_for(capital, center, seed):
    dq = center[0] - capital[0]
    dr = center[1] - capital[1]
    if dq * dq + dr * dr < 0.25:
        d = DIRS[seed % 6]
        return (float(d[0]), float(d[1]))
    return (dq, dr)


def in_half(hexc, capital, ax, margin=-0.01):
    return (hexc[0] - capital[0]) * ax[0] + (hexc[1] - capital[1]) * ax[1] >= margin


def hub_chain(land, core, count, min_sep, ring_dist, seed, ex=None, anchor=None, ax=None, bufs=()):
    if count <= 0:
        return []
    rand = mulberry32((seed ^ 0x9E3779B9) & M32)
    placed = []
    exclude = ex if ex is not None else core
    land_set = set(land)

    def valid(h, hub):
        if h not in land_set:
            return False
        if ax is not None and not in_half(h, core, ax):
            return False
        if h == exclude:
            return False
        if not buffer_gate(h, bufs):
            return False
        if hd(h, hub) != ring_dist:
            return False
        if hd(h, core) < min_sep:
            return False
        if anchor is not None and hd(h, (anchor["q"], anchor["r"])) < anchor["minDist"]:
            return False
        if h in placed:
            return False
        return all(hd(h, p) >= min_sep for p in placed)

    queue = [core]
    idx = 0
    while len(placed) < count and idx < len(queue):
        hub = queue[idx]
        idx += 1
        while len(placed) < count:
            cands = [h for h in hexes_at(hub[0], hub[1], ring_dist) if valid(h, hub)]
            if not cands:
                break
            shuffle(cands, rand)
            cands.sort(key=lambda h: (h[0], h[1]))
            placed.append(cands[0])
            queue.append(cands[0])
    return placed


def nearest_legal(land, core, count, min_sep, initial, exclude, anchor=None, ax=None, bufs=()):
    placed = list(initial[:count])
    while len(placed) < count:
        rows = []
        for h in land:
            if h == exclude:
                continue
            if anchor is not None and hd(h, (anchor["q"], anchor["r"])) < anchor["minDist"]:
                continue
            if not buffer_gate(h, bufs):
                continue
            if hd(h, core) < min_sep:
                continue
            if not all(hd(h, p) >= min_sep for p in placed):
                continue
            hub_d = min([hd(h, core)] + [hd(h, p) for p in placed])
            pref = in_half(h, core, ax) if ax is not None else False
            rows.append((0 if pref else 1, hub_d, hd(h, core), h[0], h[1], h))
        rows.sort(key=lambda x: x[:5])
        if not rows:
            break
        placed.append(rows[0][5])
    return placed


def around_capital(all_land, region, capital, n, min_dist, seed, ex=None, anchor=None, growth=None,
                   ax=None, bufs=(), rings=None):
    if n <= 0:
        return [], None
    reserve = growth if growth is not None else RESERVE
    total = n + reserve
    exclude = ex if ex is not None else capital
    expanded_r = pack_radius(total, min_dist) * 2
    pools = []
    near_region = land_pool(region, capital, total, min_dist)
    pools.append(near_region)
    near_expanded = land_pool(region, capital, total, min_dist, expanded_r)
    if len(near_expanded) > len(near_region):
        pools.append(near_expanded)
    if len(all_land) > len(near_expanded):
        pools.append(all_land)
    seeds = [seed, (seed + 0x517CC1B7) & M32, (seed + 0x85EBCA6B) & M32, (seed + 0xC2B2AE35) & M32]
    ring_list = list(rings) if rings else [MAX_HEX]
    best = []
    done = False
    for rd in ring_list:
        for pool in pools:
            for s in seeds:
                packed = hub_chain(pool, capital, total, min_dist, rd, s, exclude, anchor, ax, bufs)
                if len(packed) > len(best):
                    best = packed
                if len(best) >= n:
                    break
            if len(best) >= n:
                break
        if len(best) >= n:
            done = True
            break
    if len(best) < total:
        for pool in pools + [all_land]:
            nearest = nearest_legal(pool, capital, total, min_dist, best, exclude, anchor, ax, bufs)
            if len(nearest) > len(best):
                best = nearest
            if len(best) >= total:
                break
    return best[:n], (best[n] if len(best) > n else None)


# ----------------------------------------------------------------------------------------------
# 3. Porownanie z wektorami
# ----------------------------------------------------------------------------------------------
C = V["cases"]
FIX = {k: [tuple(h) for h in v] for k, v in V["fixtures"].items()}
T = lambda l: [tuple(h) for h in l]
FL = lambda s: float(s)


def conv_opts(o):
    return dict(
        ex=tuple(o["exclude"]) if "exclude" in o else None,
        anchor=o.get("anchor"),
        ax=(FL(o["axis"]["dq"]), FL(o["axis"]["dr"])) if "axis" in o else None,
        bufs=[{"q": b["q"], "r": b["r"], "radius": FL(b["radius"])} for b in o.get("buffers", [])],
    )


for c in C["clusterPackRadius"]:
    check(pack_radius(c["maxMiast"], c["minDist"]) == c["out"], f"packRadius {c}")

for c in C["shuffle"]:
    arr = list(range(c["n"]))
    shuffle(arr, mulberry32(c["seed"]))
    check(arr == c["out"], f"shuffle {c}")

for c in C["bufferGate"]:
    bufs = [{"q": b["q"], "r": b["r"], "radius": FL(b["radius"])} for b in c["buffers"]]
    check(buffer_gate(tuple(c["h"]), bufs) == c["out"], f"bufferGate {c}")

for c in C["hexesAt"]:
    check(hexes_at(c["q"], c["r"], c["dist"]) == T(c["out"]), f"hexesAt {c}")

for c in C["axis"]:
    got = axis_for(tuple(c["capital"]), (FL(c["center"][0]), FL(c["center"][1])), c["seed"])
    want = (FL(c["out"]["dq"]), FL(c["out"]["dr"]))
    check(got == want and math.copysign(1, got[0]) == math.copysign(1, want[0]), f"axis {c}")

for c in C["halfPlane"]:
    margin = FL(c["margin"]) if c["margin"] is not None else -0.01
    got = in_half(tuple(c["hex"]), tuple(c["capital"]), (FL(c["axis"]["dq"]), FL(c["axis"]["dr"])), margin)
    check(got == c["out"], f"halfPlane {c}")

for c in C["landPool"]:
    got = land_pool(FIX[c["land"]], tuple(c["centrum"]), c["maxMiast"], c["minDist"], c["maxRadius"])
    check(got == T(c["out"]), f"landPool {c['land']} {c['centrum']}")

for c in C["hubChain"]:
    kw = conv_opts(c["opts"])
    got = hub_chain(FIX[c["land"]], tuple(c["core"]), c["count"], c["minSep"], c["ringDist"], c["seed"], **kw)
    check(got == T(c["out"]), f"hubChain {c['land']} {c['core']} {c['count']}")

for c in C["nearest"]:
    kw = conv_opts(c["opts"])
    ex = kw.pop("ex")
    got = nearest_legal(FIX[c["land"]], tuple(c["core"]), c["count"], c["minSep"], T(c["initial"]), ex, **kw)
    check(got == T(c["out"]), f"nearest {c['land']} {c['core']} {c['count']}")

for c in C["aroundCapital"]:
    kw = conv_opts(c["opts"])
    allv = FIX[c["land"]]
    region = allv if c["region"] is None else T(c["region"])
    growth = c["opts"].get("growthReserve")
    rings = c["opts"].get("ringDistances")
    cities, slot = around_capital(allv, region, tuple(c["core"]), c["stateCityCount"], c["minDist"], c["seed"],
                                  growth=growth, rings=rings, **kw)
    check(cities == T(c["out"]["stateCities"]), f"aroundCapital cities {c['land']} {c['core']}")
    want_slot = tuple(c["out"]["growthSlot"]) if c["out"]["growthSlot"] else None
    check(slot == want_slot, f"aroundCapital slot {c['land']} {c['core']}")

for c in C["rivalCore"]:
    land = FIX[c["land"]]
    core = tuple(c["core"])
    ax = None
    if c["mapCenter"] is not None:
        ax = axis_for(core, (FL(c["mapCenter"][0]), FL(c["mapCenter"][1])), c["seed"])
    cities, _ = around_capital(land, land, core, c["rivalCount"], c["minDist"], c["seed"], ex=core, growth=0, ax=ax)
    check(cities == T(c["out"]), f"rivalCore {c['land']} {c['core']}")

# mapy: ziemia, srodek, kandydaci, sloty (geometria + wlasciciele; nazwy tylko ksztalt)
LAND_TERRAIN_EXCLUDED = {"morze", "plytkie_morze", "gory", "polarny"}
map_land = {}
map_center = {}
for mid, m in MAPS["maps"].items():
    map_land[mid] = [(r[0], r[1]) for r in m["hexes"] if r[2] not in LAND_TERRAIN_EXCLUDED]
    map_center[mid] = ((m["szerokoscQ"] - 1) / 2, (m["wysokoscR"] - 1) / 2)
for c in C["mapHelpers"]:
    check(len(map_land[c["map"]]) == c["landCount"], f"mapHelpers landCount {c['map']}")
    check(map_center[c["map"]] == (FL(c["center"][0]), FL(c["center"][1])), f"mapHelpers center {c['map']}")

for c in C["candidates"]:
    land = map_land[c["map"]]
    core = tuple(c["core"])
    if c["rivalCount"] <= 0:
        got = []
    else:
        ax = axis_for(core, map_center[c["map"]], c["seed"])
        got, _ = around_capital(land, land, core, c["rivalCount"], MIN_HEX, c["seed"], ex=core, growth=0, ax=ax)
    check(got == T(c["out"]), f"candidates {c['map']} {c['core']} {c['rivalCount']}")

for c in C["slots"]:
    land = map_land[c["map"]]
    core = tuple(c["core"])
    if c["rivalCount"] <= 0:
        pos = []
    else:
        ax = axis_for(core, map_center[c["map"]], c["seed"])
        pos, _ = around_capital(land, land, core, c["rivalCount"], MIN_HEX, c["seed"], ex=core, growth=0, ax=ax)
    out = c["out"]
    check(len(out) == len(pos), f"slots len {c['map']} {c['core']}")
    names = set()
    for idx, (s, p) in enumerate(zip(out, pos)):
        check((s["q"], s["r"]) == p, f"slots pos {c['map']} {idx}")
        check(s["ownerId"] == c["firstOwnerId"] + idx, f"slots owner {c['map']} {idx}")
        check(s["typ"] == c["typ"] and s["isSameTypeRival"] is True and s["isPlayerCapital"] is False
              and s["hasIsClusterCapital"] is False, f"slots flags {c['map']} {idx}")
        check(isinstance(s["nazwaMiasta"], str) and s["nazwaMiasta"] != "", f"slots name {c['map']} {idx}")
        names.add(s["nazwaMiasta"])
    check(len(names) == len(out), f"slots unique names {c['map']} {c['core']}")

for c in C["group"]:
    order = []
    groups = {}
    for s in c["slots"]:
        if s["isSameTypeRival"]:
            continue
        if s["typ"] not in groups:
            groups[s["typ"]] = {"typ": s["typ"], "ownerIds": [], "positions": []}
            order.append(s["typ"])
        groups[s["typ"]]["ownerIds"].append(s["ownerId"])
        groups[s["typ"]]["positions"].append((s["q"], s["r"]))
    got = [groups[t] for t in order]
    want = [{"typ": g["typ"], "ownerIds": g["ownerIds"], "positions": T(g["positions"])} for g in c["out"]]
    check(got == want, f"group {c['slots']}")

for c in C["seedIndependence"]:
    for s in c["seeds"]:
        got = hub_chain(FIX[c["land"]], tuple(c["core"]), c["count"], c["minSep"], c["ringDist"], s)
        check(got == T(c["out"]), f"seedIndependence {c['land']} seed {s}")

# stale
cc = C["consts"]
check(cc["CLUSTER_CITY_STATE_MIN_HEX"] == MIN_HEX and cc["MIN_DIST_START_CITY_STATE"] == MIN_HEX
      and cc["MIN_DIST_FOREIGN_IN_CLUSTER"] == MIN_HEX, "consts aliasy")

print(f"RAZEM: {checks} sprawdzen, rozbieznosci: {bad}")
sys.exit(1 if bad else 0)
