#!/usr/bin/env python3
"""Niezalezny weryfikator logiki P6.M07A (partia 1), napisany od zera w Pythonie (stdlib).

Nie uzywa kodu Rust ani generatora TS. Implementuje logike wedlug zrodla TS pinu edb8fb56
(gen-helpers.ts): hexAxialDistance (:5194), assertRiverPathAdjacent (:5400), splitAdjacentRiverChains
(:5415), sanitizeRiverPath (:5440), riverPathHasRevisitedHex (:5457), repairRiverPathAdjacency (:5468),
riversQuotaForLandMass (:5187), mainRiverCoastMouthMaxGapForDims (:5554, progi z newGameMapDefaults.ts),
canRiverFlowThrough (:5862), riverPathRespectsSeaBuffer (:5561), buildSeaDistanceField (:5614).
Porownuje wynik z wektorami `web-rivers-a.json` (wyprodukowane przez URUCHOMIONY web).

Uzycie: python3 -I verify_m07a_logic.py <sciezka/web-rivers-a.json>
Wyjscie: linia na kazdy zestaw przypadkow + `RESULT: PASS|FAIL`; kod wyjscia 0 tylko przy PASS.
Pominiete (NIE_ZMIERZONO tutaj): purge* (earthTemplateLandAt), render*, coastalRender, fields.oceanConnected
i openOceanDist, profiler, reszta symboli partii 2-4 (nieportowane).
"""
import json
import math
import sys
from collections import deque

# Kolejnosc jak w TS HEX_DIRECTIONS (gen-helpers.ts:125-128) - wazna dla remisow w repair.
DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]
INF = float("inf")


def key(q, r):
    return f"{q},{r}"


def hex_dist(q1, r1, q2, r2):
    dq = q1 - q2
    dr = r1 - r2
    return (abs(dq) + abs(dr) + abs(dq + dr)) // 2  # zawsze parzysta suma


def js_round(x):
    return math.floor(x + 0.5)  # JS Math.round dla x >= 0


def is_water(terr):
    return terr in ("morze", "plytkie_morze")  # isWaterTerrainLocal (:152)


def sanitize(path):
    if len(path) < 2:
        return list(path)
    out = [path[0]]
    seen = {key(*path[0])}
    for p in path[1:]:
        k = key(*p)
        if k in seen:
            continue
        prev = out[-1]
        if hex_dist(prev[0], prev[1], p[0], p[1]) != 1:
            continue
        out.append(p)
        seen.add(k)
    return out


def has_revisit(path):
    seen = set()
    for p in path:
        k = key(*p)
        if k in seen:
            return True
        seen.add(k)
    return False


def is_adjacent(path):
    for i in range(1, len(path)):
        if hex_dist(path[i - 1][0], path[i - 1][1], path[i][0], path[i][1]) != 1:
            return False
    return True


def split_chains(path):
    if len(path) < 2:
        return []
    chains = []
    chain = [path[0]]
    for cur in path[1:]:
        prev = chain[-1]
        if hex_dist(prev[0], prev[1], cur[0], cur[1]) == 1:
            chain.append(cur)
        else:
            if len(chain) >= 2:
                chains.append(chain)
            chain = [cur]
    if len(chain) >= 2:
        chains.append(chain)
    return chains


def quota(n, tier):
    if n < 8:
        return 0
    if n < 14:
        return 3
    per = {"high": 1, "low": 5}.get(tier, 2)  # tier None/medium -> 2
    return max(3, js_round(n / per))


def mouth_gap(w, h):
    return 5 if w * h < 4800 else 7  # 'mala' = area < 4800 (newGameMapDefaults.ts:64)


def flow(hx, cell, src, block, allow, relief):
    """canRiverFlowThrough (:5862). hx: dict {'t': terr, 'rz': bool} albo None."""
    if hx is None or hx["t"] == "morze":
        return False
    if hx["t"] in ("gory", "wzgorza") and not relief:
        return cell == src
    if block and hx["rz"] and cell != allow:
        return False
    return True


def repair(path, hexes, src):
    """repairRiverPathAdjacency (:5468)."""
    if len(path) < 2:
        return list(path)
    out = [path[0]]
    visited = {key(*path[0])}
    for target in path[1:]:
        tk = key(*target)
        guard = 0
        while guard < 64:
            guard += 1
            cur = out[-1]
            d = hex_dist(cur[0], cur[1], target[0], target[1])
            if d == 0:
                break
            if d == 1:
                out.append(target)
                visited.add(tk)
                break
            best = None
            best_d = INF
            for dq, dr in DIRS:
                nq, nr = cur[0] + dq, cur[1] + dr
                nk = key(nq, nr)
                if nk in visited and nk != tk:
                    continue
                if not flow(hexes.get(nk), nk, src, False, None, False):
                    continue
                nd = hex_dist(nq, nr, target[0], target[1])
                if nd < best_d:
                    best_d = nd
                    best = (nq, nr)
            if best is None or best_d >= d:
                break
            out.append(best)
            visited.add(key(*best))
    return sanitize(out)


def sea_field(hexes):
    dist = {}
    dq_ = deque()
    for k, hx in hexes.items():
        if is_water(hx["t"]):
            dist[k] = 0
            dq_.append(k)
    while dq_:
        k = dq_.popleft()
        q, r = (int(x) for x in k.split(","))
        for dq, dr in DIRS:
            nk = key(q + dq, r + dr)
            if nk in dist or nk not in hexes:
                continue
            dist[nk] = dist[k] + 1
            dq_.append(nk)
    return dist


def sea_buffer_ok(hexes, path, sdist, min_inland, tail):
    if not path:
        return False
    body_end = max(0, len(path) - tail)
    for p in path[:body_end]:
        k = key(*p)
        hx = hexes.get(k)
        if hx is None or is_water(hx["t"]):
            return False
        if sdist.get(k, 0) < min_inland:
            return False
    return True


def main():
    if len(sys.argv) != 2:
        print("uzycie: verify_m07a_logic.py <web-rivers-a.json>")
        return 2
    with open(sys.argv[1], encoding="utf-8") as fh:
        doc = json.load(fh)
    cases = doc["cases"]
    maps = doc["maps"]
    hex_cache = {}

    def hexes_of(idx):
        if idx not in hex_cache:
            d = {}
            for row in maps[idx]["rows"]:
                d[row[0]] = {"t": row[1], "rz": row[4] == 1}
            hex_cache[idx] = d
        return hex_cache[idx]

    def pts(lst):
        return [(c[0], c[1]) for c in lst]

    results = []
    failures = 0

    def check(name, total, bad):
        nonlocal failures
        failures += len(bad)
        status = "OK" if not bad else "FAIL"
        extra = "" if not bad else f" pierwszy={bad[0]}"
        results.append(f"{name}: {total - len(bad)}/{total} {status}{extra}")

    # quota
    bad = []
    for c in cases["quota"]:
        tier = c["tier"] if c["tier"] is not None else "medium"
        got = quota(c["n"], tier)
        if got != c["ret"]:
            bad.append((c["n"], c["tier"], got, c["ret"]))
    check("quota", len(cases["quota"]), bad)

    # stale i progi
    c0 = cases["constants"][0]
    const_bad = []
    if c0["RIVER_MIN_INLAND_FROM_SEA"] != 2 or c0["RIVER_MIN_MAIN_LEN"] != 3:
        const_bad.append("min")
    if c0["RIVER_HARD_MEANDER_LEN"] != 8 or c0["RIVER_MOUTH_TAIL_LEN"] != 5:
        const_bad.append("meander/tail")
    if c0["MAIN_RIVER_MIN_PATH_SEP"] != 3 or c0["MEDIUM_TRIBUTARY_SPACING_HEX"] != 4:
        const_bad.append("sep/spacing")
    if c0["MEDIUM_TRIBUTARY_MIN_NET_LEN"] != 7 or c0["MAIN_RIVER_COAST_MOUTH_MAX_GAP"] != 7:
        const_bad.append("netlen/gap")
    check("constants", 4, const_bad)

    # mouthGap
    bad = [(c["w"], c["h"], mouth_gap(c["w"], c["h"]), c["ret"])
           for c in cases["mouthGap"] if mouth_gap(c["w"], c["h"]) != c["ret"]]
    check("mouthGap", len(cases["mouthGap"]), bad)

    # czyste sciezki
    bad = [c["path"] for c in cases["sanitize"]
           if [list(p) for p in sanitize(pts(c["path"]))] != c["ret"]]
    check("sanitize", len(cases["sanitize"]), bad)
    bad = [c["path"] for c in cases["revisited"] if has_revisit(pts(c["path"])) != c["ret"]]
    check("revisited", len(cases["revisited"]), bad)
    bad = [c["path"] for c in cases["adjacent"] if is_adjacent(pts(c["path"])) != c["ret"]]
    check("adjacent", len(cases["adjacent"]), bad)
    bad = [c["path"] for c in cases["split"]
           if [[list(p) for p in ch] for ch in split_chains(pts(c["path"]))] != c["ret"]]
    check("split", len(cases["split"]), bad)

    # canRiverFlowThrough (wszystkie galezie)
    bad = []
    for c in cases["flow"]:
        hx = hexes_of(c["map"]).get(c["cell"])
        got = flow(hx, c["cell"], c["src"], c["block"], c["allow"], c["relief"])
        if got != c["ret"]:
            bad.append(c)
    check("flow", len(cases["flow"]), bad)

    # repairRiverPathAdjacency
    bad = []
    for c in cases["repair"]:
        got = repair(pts(c["path"]), hexes_of(c["map"]), c["sourceKey"])
        if [list(p) for p in got] != c["ret"]:
            bad.append((c["map"], c["sourceKey"]))
    check("repair", len(cases["repair"]), bad)

    # repairCap (N-1/N/N+1 wokol capu 64)
    bad = []
    for c in cases["repairCap"]:
        got = repair(pts(c["path"]), hexes_of(c["map"]), c["sourceKey"])
        if [list(p) for p in got] != c["ret"] or len(got) != min(c["D"] + 1, 65):
            bad.append((c["D"], c["dir"]))
    check("repairCap", len(cases["repairCap"]), bad)

    # riverPathRespectsSeaBuffer z polem morza (buildSeaDistanceField)
    sea_cache = {}
    bad = []
    for c in cases["seaBuffer"]:
        if c["map"] not in sea_cache:
            sea_cache[c["map"]] = sea_field(hexes_of(c["map"]))
        got = sea_buffer_ok(hexes_of(c["map"]), pts(c["path"]), sea_cache[c["map"]],
                            c["minInland"], c["mouthTail"])
        if got != c["ret"]:
            bad.append(c["map"])
    check("seaBuffer", len(cases["seaBuffer"]), bad)

    # pole morza (seaDist) - pelne porownanie map
    bad = []
    for c in cases["fields"]:
        got = sorted(sea_field(hexes_of(c["map"])).items())
        exp = sorted((k, d) for k, d in c["seaDist"])
        if got != exp:
            bad.append(c["map"])
    check("fields.seaDist", len(cases["fields"]), bad)

    for line in results:
        print(line)
    ok = failures == 0
    print(f"RESULT: {'PASS' if ok else 'FAIL'} (bledy={failures})")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
