#!/usr/bin/env python3
"""P6.M07B-Q4 - niezalezny weryfikator Python OD ZERA.

Implementacja 7 symboli Q4 wyprowadzona z ZRODLA TS pinu `4bbef081d` (gra/src/map/gen-helpers.ts:
traceRiver :6708, traceRiverForGridFill :6822, collectFoothillRiverSources :6867,
collectPlainSpringSources :6900, collectRiverSources :6926, capRiverQuotas :6943,
pickSpreadRiverSources :6960 oraz zaleznosci wzrostu `growRiverInlandBeforeDrainage` :5903 i
`collectInlandDrainGrowCandidates` :6149), NIE z kodu Rust i NIE z generatora .mjs.
Zaleznosci Q2/Q3 (A*, zjazd, wydluzanie, ogon ujscia, sanityzacja okna, naprawa sasiedztwa, pola
morza) importowane z niezaleznych weryfikatorow Q2/Q3 (Python od zera).
Porownanie: dokladna rownosc (==) wszystkich wyjsc.

Uzycie:  python3 -I verify_m07b4_q4.py   (z katalogu tests/p6_m07b4_vectors)
Wyjscie: linia per fn, na koncu TOTAL i EXIT=<kod> (zero rozbieznosci -> 0).
"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "p6_m07b2_vectors"))
sys.path.insert(0, os.path.join(HERE, "..", "p6_m07b3_vectors"))
import verify_m07b2_q2 as q2  # noqa: E402
import verify_m07b3_q3 as q3  # noqa: E402

HEX_DIRS = q2.HEX_DIRS
hex_key = q2.hex_key
INF = math.inf
RIVER_MOUTH_TAIL_LEN = 5  # :5526
RIVER_MIN_INLAND_FROM_SEA = 2  # :5512
WATER = {"morze", "plytkie_morze"}  # isWaterTerrainLocal
RELIEF_SRC = {"gory", "wzgorza"}  # isReliefRiverSource (:5792)
RIVER_LAND = {"laka", "rownina", "wzgorza", "gory", "pustynia", "polarny"}  # isRiverLandTerrain (:6854)


# ------------------------------------------------------------------ wzrost w glab ladu (:5903, :6149)
def score_land_center(q, r, nq, nr, sq, lc):  # :6058
    if sq is not None:
        return q3.score_square(q, r, nq, nr, sq)
    return q2.score_toward_centroid(q, r, nq, nr, lc)


def collect_inland(hexes, path, cur, sk, sea, open_, lc, sq, bl, msep, rel, hard, relax_hard, relax_sea, rand):
    cur_key = hex_key(*cur)
    cur_d = sea.get(cur_key, 0)
    cur_od = open_.get(cur_key, INF)
    out = []
    for dq, dr in HEX_DIRS:
        nq, nr = cur[0] + dq, cur[1] + dr
        nk = hex_key(nq, nr)
        if not q2.is_window_turn_allowed(path, nq, nr):
            continue
        if not q2.can_flow(hexes.get(nk), nk, sk, True, None, rel):
            continue
        if not q2.sep_passes(nq, nr, bl, msep):
            continue
        nd = sea.get(nk, 0)
        if not relax_sea and nd < RIVER_MIN_INLAND_FROM_SEA:
            continue
        od = open_.get(nk, INF)
        if hard and not relax_hard and od < cur_od:
            continue
        score = 1200 - od * 30
        if od > cur_od + 0.5:
            score -= 18
        if nd > cur_d + 1:
            score -= 10
        if nd == RIVER_MIN_INLAND_FROM_SEA and od < cur_od:
            score += 8
        score += score_land_center(cur[0], cur[1], nq, nr, sq, lc)
        score += rand() * 0.35
        out.append((nq, nr, score))
    return out


def sort_desc(cands):
    return sorted(cands, key=lambda c: c[2], reverse=True)  # stabilny, remis = kolejnosc wejscia


def grow_inland(hexes, sq_, sr_, sea, open_, rand, inland_target, step_cap, hard_len, rel, relax_sea,
                growth_max, bl, msep, lc, sqr):
    sk = hex_key(sq_, sr_)
    path = [(sq_, sr_)]
    visited = {sk}
    if lc is not None:
        centroid = lc
    elif sqr is not None:
        centroid = sqr["centroid"]
    else:
        centroid = q2.estimate_centroid(hexes, sq_, sr_, rel)
    target = min(step_cap, max(inland_target, growth_max) if growth_max is not None else inland_target)
    while len(path) < target and len(path) < step_cap:
        cur = path[-1]
        hard = len(path) < hard_len

        def cands_for(relax_hard, rsea):
            return [c for c in collect_inland(hexes, path, cur, sk, sea, open_, centroid, sqr, bl, msep, rel,
                                              hard, relax_hard, rsea, rand)
                    if hex_key(c[0], c[1]) not in visited]

        cands = cands_for(False, relax_sea)
        if not cands:
            cands = cands_for(True, relax_sea)
        if not cands:
            if hard and len(path) < hard_len:
                soft = cands_for(True, relax_sea)
                if not soft:
                    break
                pk = sort_desc(soft)[0]
                path.append((pk[0], pk[1]))
                visited.add(hex_key(pk[0], pk[1]))
                continue
            break
        cands = sort_desc(cands)
        idx = min(len(cands) - 1, math.floor(rand() * min(3, len(cands))))
        pk = cands[idx]
        path.append((pk[0], pk[1]))
        visited.add(hex_key(pk[0], pk[1]))
    return path


# ------------------------------------------------------------------ traceRiver (:6708)
def resolve(mp, hexes, c):
    """Pola jak web: seaDist, wymiary, openOceanDist, oceanConnected wg trybu opcji."""
    mode = c["mode"]
    if mode in (1, 2):
        w, h = mp["w"], mp["h"]
    elif mode == 4:
        w, h = mp["w"] + c["dw"], mp["h"] + c["dh"]
    else:  # tryby 0 i 3 (3: brak mapHeight): wymiary wnioskowane
        w, h = q3.infer_dims(hexes)
    sea = mp["sea"] if mode in (1, 2, 3) else q3.build_sea(hexes)
    sd = c.get("sd")
    if sd:
        sea = dict(sea)
        if sd["v"] is None:
            sea.pop(sd["k"], None)
        else:
            sea[sd["k"]] = sd["v"]
    if mode == 1:
        oc = set(mp["oc"])
        open_ = mp["open"]
    elif mode == 2:
        rm = set(c["ocrm"])
        oc = {k for k in mp["oc"] if k not in rm}
        open_ = q3.build_open(hexes, oc)
    else:
        oc = q3.ocean_connected(hexes, w, h)
        open_ = q3.build_open(hexes, oc)
    return sea, w, h, open_, oc


def sea_buffer_ok(hexes, path, sea):  # riverPathRespectsSeaBuffer (:5561), domyslne 2 / 5
    if not path:
        return False
    body_end = max(0, len(path) - RIVER_MOUTH_TAIL_LEN)
    for i in range(body_end):
        p = path[i]
        hx = hexes.get(hex_key(*p))
        if hx is None or hx["t"] in WATER:
            return False
        if sea.get(hex_key(*p), 0) < RIVER_MIN_INLAND_FROM_SEA:
            return False
    return True


def trace_river(mp, hexes, c, ml, min_len, rand):
    sea, w, h, open_, oc = resolve(mp, hexes, c)
    sk = hex_key(c["sq"], c["sr"])
    start_dist = sea.get(sk)
    if start_dist is None:
        return []
    inland = min_len if min_len is not None else 4
    tail = c["tail"] if c["tail"] is not None else RIVER_MOUTH_TAIL_LEN
    hl = c["hl"] if c["hl"] is not None else 8
    rel = c["rel"] if c["rel"] is not None else False
    relax = c["relax"] if c["relax"] is not None else False
    step_cap = max(inland + tail + 12, min(ml, math.ceil(start_dist * 2.5) + inland + 10))
    growth_max = min(step_cap - tail - 4, ml)
    msep = c["msep"] if c["msep"] is not None else 0
    sqr = q3.center_square(hexes, [hh["k"] for hh in mp["hexes"]], c["sqr"]) if c["sqr"] is not None else None
    lc = tuple(c["lc"]) if c["lc"] is not None else None
    path = grow_inland(hexes, c["sq"], c["sr"], sea, open_, rand, inland, step_cap, hl, rel, relax,
                       growth_max, c["bl"], msep, lc, sqr)
    tail_from = path[-1]
    budget = max(tail + 4, step_cap - len(path) + 1)
    drain = q3.astar(hexes, tail_from, sea, open_, oc, budget, rand, rel)
    if len(drain) <= 1:
        drain = q3.greedy(hexes, tail_from, sea, open_, oc, budget, rand, sk, rel)
    if len(drain) > 1:
        path = path + drain[1:]
    elif len(path) <= 1:
        path = q3.astar(hexes, (c["sq"], c["sr"]), sea, open_, oc, step_cap, rand, rel)
        if len(path) <= 1:
            path = q3.greedy(hexes, (c["sq"], c["sr"]), sea, open_, oc, step_cap, rand, sk, rel)
    if len(path) > step_cap:
        path = path[:step_cap]
    path = q3.wybrzeze(hexes, path, sea)
    path = q3.finish(hexes, path, sea, open_, oc, sk)
    path = q2.repair_adjacency(path, hexes, sk)
    path = q2.sanitize_window(path, hexes, sk)
    if not relax:
        if not sea_buffer_ok(hexes, path, sea) or not q3.ends_at_sea(path, oc):
            return []
    elif not q3.ends_at_sea(path, oc):
        return []
    return path


def rand_of(seed):
    return q2.mulberry32(seed) if seed is not None else (lambda: 0.0)


def grid_fill(mp, hexes, c):
    cat, acc = c["cat"], c["acc"]
    if c["fast"]:
        tries = [acc, max(3, math.floor(acc * 0.75))]
    else:
        tries = [cat, max(acc, math.floor(cat * 0.6)), acc, 3]
    rand = rand_of(c["seed"])  # jedna funkcja wspolna dla wszystkich prob
    seen = set()
    for t in tries:
        if str(t) in seen:
            continue
        seen.add(str(t))
        path = trace_river(mp, hexes, c, c["ml"], t, rand)
        if len(path) < acc:
            continue
        if not c["rb"]:
            return path
        _, _, _, _, oc = resolve(mp, hexes, c)
        if q3.ends_at_sea(path, oc):
            return path
    return []


# ------------------------------------------------------------------ zrodla (:6867-6987)
def foothill(hexes, w, h, margin, sea):
    out = []
    for r in range(margin, h - margin):
        for q in range(margin, w - margin):
            hx = hexes.get(hex_key(q, r))
            if hx is None or hx["t"] not in RIVER_LAND:
                continue
            if hx["t"] in RELIEF_SRC:
                continue
            d = sea.get(hex_key(q, r), 0)
            if d < 2 or d > 120:
                continue
            adj = False
            for dq, dr in HEX_DIRS:
                nh = hexes.get(hex_key(q + dq, r + dr))
                if nh is not None and nh["t"] in RELIEF_SRC:
                    adj = True
                    break
            if adj:
                out.append((q, r))
    return out


def spring(hexes, w, h, margin, sea, rand, tier):
    rate = 0.11 if tier == "high" else (0.035 if tier == "low" else 0.065)
    out = []
    for r in range(margin, h - margin):
        for q in range(margin, w - margin):
            hx = hexes.get(hex_key(q, r))
            if hx is None or hx["t"] not in RIVER_LAND:
                continue
            if hx["t"] in RELIEF_SRC:
                continue
            d = sea.get(hex_key(q, r), 0)
            if d < 3 or d > 65:
                continue
            if rand() > rate:
                continue
            out.append((q, r))
    return out


def sources(hexes, w, h, margin):
    out = []
    for r in range(margin, h - margin):
        for q in range(margin, w - margin):
            hx = hexes.get(hex_key(q, r))
            if hx is None:
                continue
            if hx["t"] in RELIEF_SRC:
                out.append((q, r))
    return out


def cap_quotas(quotas, max_total):
    q = [max(0, n) for n in quotas]
    s = sum(q)
    if s <= max_total:
        return q
    while s > max_total:
        idx = 0
        for i in range(1, len(q)):
            if q[i] > q[idx]:
                idx = i
        if (q[idx] if idx < len(q) else 0) <= 1:
            break
        q[idx] -= 1
        s -= 1
    return q


def pick_spread(srcs, count, min_sep, sea, used, rand):
    ranked = []
    for (q, r) in srcs:
        if hex_key(q, r) in used:
            continue
        ranked.append((q, r, sea.get(hex_key(q, r), 0), rand()))
    ranked.sort(key=lambda s: (-s[2], s[3]))
    picked = []
    for (q, r, _, _) in ranked:
        if len(picked) >= count:
            break
        if any(q2.hex_axial_distance(pq, pr, q, r) < min_sep for pq, pr in picked):
            continue
        picked.append((q, r))
    return picked


# ------------------------------------------------------------------ sterownik
def flat(path):
    return [x for p in path for x in p]


def sea_with(mp, c):
    """seaDist mapy bez kluczy `pt.srm`, z nadpisaniami `sov` (generator: applyPert + seaWithSov)."""
    sea = mp["sea"]
    if c.get("pt"):
        sea = {k: v for k, v in sea.items() if k not in set(c["pt"]["srm"])}
    if c.get("sov"):
        sea = dict(sea)
        for k, v in c["sov"]:
            sea[k] = v
    return sea


def run_one(maps, hx, c, kind=None, n=None):
    """Wynik (splaszczony) dla przypadku `c`; `kind`/`n` = nadpisanie parametru sweepu."""
    f = kind or c["fn"]
    mp = maps[c["m"]] if "m" in c else None
    hexes = hx[c["m"]] if "m" in c else None
    if f == "trace" or f == "trace_maxlen" or f == "trace_minlen" or f == "trace_tail":
        ml = n if f == "trace_maxlen" else c["ml"]
        mn = n if f == "trace_minlen" else c["minLen"]
        cc = dict(c)
        if f == "trace_tail":
            cc["tail"] = n
        return flat(trace_river(mp, hexes, cc, ml, mn, rand_of(c["seed"])))
    if f in ("grid", "grid_accept", "grid_catalog"):
        cc = dict(c)
        if f == "grid_accept":
            cc["acc"] = n
        if f == "grid_catalog":
            cc["cat"] = n
        return flat(grid_fill(mp, hexes, cc))
    if f in ("foothill", "spring", "sources"):
        sea = sea_with(mp, c)
        if f == "foothill":
            return flat(foothill(hexes, c["w"], c["h"], c["margin"], sea))
        if f == "spring":
            return flat(spring(hexes, c["w"], c["h"], c["margin"], sea, rand_of(c["seed"]), c["tier"]))
        return flat(sources(hexes, c["w"], c["h"], c["margin"]))
    if f in ("pick", "pick_count", "pick_minsep"):
        sea = sea_with(mp, c)
        count = n if f == "pick_count" else c["count"] if "count" in c else None
        ms = n if f == "pick_minsep" else c["ms"] if "ms" in c else None
        return flat(pick_spread(q2.flat_pairs(c["srcs"]), count, ms, sea, set(c.get("used", [])), rand_of(c["seed"])))
    if f == "cap":
        return cap_quotas(c["quotas"], n if n is not None else c["mt"])
    raise SystemExit(f"fn {f}")


def run_case(maps, hx, c):
    if c["fn"] != "sweep":
        return run_one(maps, hx, c) == c["out"]
    kind = c["kind"]
    for i, want in enumerate(c["outs"]):
        if run_one(maps, hx, c, kind, c["lo"] + i) != want:
            return False
    return True


def main():
    with open(os.path.join(HERE, "web-rivers-b-q4.json")) as fh:
        doc = json.load(fh)
    maps = doc["maps"]
    hx = [q2.load_hexes(m["hexes"]) for m in maps]
    mism = 0
    for m, h in zip(maps, hx):
        oc = q3.ocean_connected(h, m["w"], m["h"])
        if q3.build_sea(h) != m["sea"] or oc != set(m["oc"]) or q3.build_open(h, oc) != m["open"]:
            mism += 1
    print(f"input_field_mismatch_maps: {mism}")
    tot = ok = 0
    per = {}
    bad = []
    for i, c in enumerate(doc["cases"]):
        good = run_case(maps, hx, c)
        key = c["fn"] if c["fn"] != "sweep" else "sweep_" + c["kind"]
        a = per.setdefault(key, [0, 0])
        a[0] += 1
        tot += 1
        if good:
            a[1] += 1
            ok += 1
        else:
            bad.append(i)
    for k in sorted(per):
        print(f"{k}: {per[k][1]}/{per[k][0]} zgodne")
    print(f"TOTAL: {ok}/{tot} zgodne")
    if bad:
        print("ROZBIEZNE (pierwsze 10 indeksow):", bad[:10])
    code = 0 if (not bad and mism == 0) else 1
    print(f"EXIT={code}")
    sys.exit(code)


if __name__ == "__main__":
    main()
