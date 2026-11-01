#!/usr/bin/env python3
"""P6.M07B-Q2 - niezalezny weryfikator Python OD ZERA (lekcja c).

Implementacja wyprowadzona z ZRODLA TS pinu `edb8fb56` (gra/src/map/gen-helpers.ts, zakres
:5440-5511, :5614-5637, :5847-5880, :5975-6080, :6081-6519, :6988-7093, :7094-7249 oraz
:8975-9075), NIE z kodu Rust i NIE z generatorow .mjs. Sprawdza WSZYSTKIE 15 funkcji zakresu Q2
(wiersze 2, 3, 6, 11, 34-44) na wektorach JSON wygenerowanych z uruchomionego weba.

Zaleznosci (sanitize/repair/violates/centroid/index) tez zaimplementowane tu od zera.
Porownanie: dokladna rownosc (==) dla wszystkich wyjsc, takze score (IEEE double).

Uzycie:  python3 -I verify_m07b2_q2.py   (z katalogu tests/p6_m07b2_vectors)
Wyjscie: linia podsumowania per fn, EXIT=0 gdy zero rozbieznosci.
"""
import json
import math
import os
import sys
from collections import deque

M32 = 0xFFFFFFFF
HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- JS semantics helpers
def js_mod(a, b):
    """JS `%` (znak dzielnej)."""
    return a - b * int(a / b) if isinstance(a, int) and isinstance(b, int) else math.fmod(a, b)


def imul(a, b):
    return ((a & M32) * (b & M32)) & M32


def mulberry32(seed):
    st = [seed & M32]

    def rnd():
        st[0] = (st[0] + 0x6D2B79F5) & M32
        t = st[0]
        t = imul(t ^ (t >> 15), t | 1)
        t = (t ^ ((t + imul(t ^ (t >> 7), t | 61)) & M32)) & M32
        return ((t ^ (t >> 14)) & M32) / 4294967296.0

    return rnd


# ---------------------------------------------------------------- stale z TS
HEX_DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]  # gen-helpers.ts:125
RIVER_MIN_INLAND_FROM_SEA = 2  # :5512
RIVER_HARD_MEANDER_LEN = 8  # :5523
MAIN_RIVER_MIN_PATH_SEP = 3  # :5529
TURN_WIN_HEX = 6  # :6999
TURN_WIN_MAX_SUM = 1  # :7000
CENTROID_CAP = 6000  # domyslne visitCap w estimateLandCentroidFromSeed (:5982)

WATER = {"morze", "plytkie_morze"}  # isWaterTerrainLocal (:152)
RELIEF = {"gory", "wzgorza"}  # isReliefTerrain (:5847)
RIVER_LAND = {"laka", "rownina", "wzgorza", "gory", "pustynia", "polarny"}  # isRiverLandTerrain (:6854)


def hex_key(q, r):
    return f"{q},{r}"


def parse_key(k):
    a, b = k.split(",")
    return int(a), int(b)


def hex_axial_distance(q1, r1, q2, r2):  # :5194 (float-safe, jak JS)
    dq = q1 - q2
    dr = r1 - r2
    return (abs(dq) + abs(dr) + abs(dq + dr)) / 2


def neighbor_dir_index(q, r, nq, nr):  # :6988
    dq = nq - q
    dr = nr - r
    for i, (a, b) in enumerate(HEX_DIRS):
        if a == dq and b == dr:
            return i
    return -1


def river_hex_dir_delta(last, new):  # :5975
    return js_mod(js_mod(new - last, 6) + 6, 6)


def signed_dir_delta(last, new):  # :7003
    raw = river_hex_dir_delta(last, new)
    return raw if raw <= 3 else raw - 6


def path_segment_dirs(path):  # :7008
    dirs = []
    for i in range(len(path) - 1):
        d = neighbor_dir_index(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1])
        if d >= 0:
            dirs.append(d)
    return dirs


def path_signed_turn_deltas(seg):  # :7017
    return [signed_dir_delta(seg[i - 1], seg[i]) for i in range(1, len(seg))]


def is_window_turn_allowed(path, nq, nr):  # :7026 (path niepusty; pusty -> TypeError w JS)
    cur = path[-1]
    step = neighbor_dir_index(cur[0], cur[1], nq, nr)
    if step < 0:
        return False
    dirs = path_segment_dirs(path)
    if not dirs:
        return True
    if abs(signed_dir_delta(dirs[-1], step)) > 1:
        return False
    dirs.append(step)
    deltas = path_signed_turn_deltas(dirs)
    window = deltas[-TURN_WIN_HEX:]
    return abs(sum(window)) <= TURN_WIN_MAX_SUM


def unit_vector(a, b):  # :7051
    x1 = math.sqrt(3) * (a[0] + a[1] / 2)
    y1 = 1.5 * a[1]
    x2 = math.sqrt(3) * (b[0] + b[1] / 2)
    y2 = 1.5 * b[1]
    dx = x2 - x1
    dy = y2 - y1
    ln = math.hypot(dx, dy)
    if ln < 1e-9:
        return (0.0, 0.0)
    return (dx / ln, dy / ln)


def has_sharp_u_turn(path):  # :7064
    if len(path) < 3:
        return False
    for i in range(len(path) - 2):
        v1 = unit_vector(path[i], path[i + 1])
        v2 = unit_vector(path[i + 1], path[i + 2])
        if v1[0] * v2[0] + v1[1] * v2[1] < -0.01:
            return True
    return False


def violates_turn_window(path):  # :7075
    if len(path) < 3:
        return False
    if has_sharp_u_turn(path):
        return True
    deltas = path_signed_turn_deltas(path_segment_dirs(path))
    for i in range(len(deltas)):
        if abs(deltas[i]) > 1:
            return True
        if i + 1 < TURN_WIN_HEX:
            continue
        if abs(sum(deltas[i + 1 - TURN_WIN_HEX:i + 1])) > TURN_WIN_MAX_SUM:
            return True
    return False


def sanitize_path(path):  # :5440
    if len(path) < 2:
        return list(path)
    out = [path[0]]
    seen = {hex_key(*path[0])}
    for p in path[1:]:
        k = hex_key(*p)
        if k in seen:
            continue
        prev = out[-1]
        if hex_axial_distance(prev[0], prev[1], p[0], p[1]) != 1:
            continue
        out.append(p)
        seen.add(k)
    return out


def can_flow(hex_, key, source, block_existing=False, allow_key=None, allow_relief=False):  # :5862
    if hex_ is None or hex_["t"] == "morze":
        return False
    if hex_["t"] in RELIEF and not allow_relief:
        return key == source
    if block_existing and hex_["rz"] is not None and hex_["rz"]["obecna"] and key != allow_key:
        return False
    return True


def repair_adjacency(path, hexes, source):  # :5468
    if len(path) < 2:
        return list(path)
    out = [path[0]]
    visited = {hex_key(*out[0])}
    for i in range(1, len(path)):
        target = path[i]
        tk = hex_key(*target)
        guard = 0
        while guard < 64:
            guard += 1
            cur = out[-1]
            d = hex_axial_distance(cur[0], cur[1], target[0], target[1])
            if d == 0:
                break
            if d == 1:
                out.append(target)
                visited.add(tk)
                break
            best = None
            best_dist = math.inf
            for dq, dr in HEX_DIRS:
                nq, nr = cur[0] + dq, cur[1] + dr
                nk = hex_key(nq, nr)
                if nk in visited and nk != tk:
                    continue
                if not can_flow(hexes.get(nk), nk, source):
                    continue
                nd = hex_axial_distance(nq, nr, target[0], target[1])
                if nd < best_dist:
                    best_dist = nd
                    best = (nq, nr)
            if best is None or best_dist >= d:
                break
            out.append(best)
            visited.add(hex_key(*best))
    return sanitize_path(out)


def sanitize_window(path, hexes, src):  # :7094
    out = sanitize_path(path)
    guard = 0
    while guard < 48 and len(out) >= 3:
        guard += 1
        if not violates_turn_window(out):
            return out
        deltas = path_signed_turn_deltas(path_segment_dirs(out))
        cut = -1
        for i in range(len(deltas)):
            if abs(deltas[i]) > 1:
                cut = i + 1
                break
            if i + 1 >= TURN_WIN_HEX:
                if abs(sum(deltas[i + 1 - TURN_WIN_HEX:i + 1])) > TURN_WIN_MAX_SUM:
                    cut = i + 1
                    break
        if cut <= 0 or cut >= len(out) - 1:
            break
        out = sanitize_path(out[:cut] + out[cut + 1:])
        out = repair_adjacency(out, hexes, src)
    return out


# ---------------------------------------------------------------- edges (partia 1)
def can_receive(hex_):  # :7122
    if hex_ is None or hex_["t"] == "morze":
        return False
    return hex_["t"] != "morze"  # suchy lad (nie woda) albo PlytkieMorze


def mark_edge(hexes, q, r, e):  # :7127
    if e < 0:
        return
    h = hexes.get(hex_key(q, r))
    if not can_receive(h):
        return
    edges = list(h["rz"]["krawedzie"]) if h["rz"] is not None else []
    if e not in edges:
        edges.append(e)
    h["rz"] = {"obecna": len(edges) > 0, "krawedzie": edges}


def mark_edge_pair(hexes, q, r, e):  # :7137
    if e < 0:
        return
    mark_edge(hexes, q, r, e)
    if not (0 <= e < 6):
        return
    dq, dr = HEX_DIRS[e]
    mark_edge(hexes, q + dq, r + dr, (e + 3) % 6)


def corner_step(f, cw):  # :7146
    return js_mod(f + 1, 6) if cw else js_mod(f + 5, 6)


def walk_perimeter(f, t, cw):  # :7150
    if f == t:
        return [f]
    out = []
    c = f
    for _ in range(7):
        out.append(c)
        if c == t:
            break
        c = corner_step(c, cw)
    return out


def corners_along(din, dout, par):  # :7166
    a = js_mod(js_mod(din, 6) + 6, 6)
    b = js_mod(js_mod(dout, 6) + 6, 6)
    if a == b:
        return []
    entries = [(a + 1) % 6, (a + 2) % 6]
    exits = [(b + 1) % 6, (b + 2) % 6]
    best, best_score = [], math.inf
    fallback, fallback_score = [], math.inf
    for en in entries:
        for ex in exits:
            for cw in (True, False):
                walked = walk_perimeter(en, ex, cw)
                if not walked:
                    continue
                score = float(len(walked))
                if score == best_score and js_mod(par, 2) == 0:
                    score += 0 if cw else 0.01
                elif score == best_score:
                    score += 0.01 if cw else 0
                if score < fallback_score:
                    fallback_score = score
                    fallback = walked
                if len(walked) - 1 < 1:
                    continue
                if score < best_score:
                    best_score = score
                    best = walked
    return best if best else fallback


def edge_between(c1, c2):  # :7195
    if c2 == js_mod(c1 + 1, 6):
        return js_mod(c1 + 5, 6)
    if c2 == js_mod(c1 + 5, 6):
        return js_mod(c2 + 5, 6)
    return -1


def transit_idx(din, dout, par):  # :7202
    cs = corners_along(din, dout, par)
    if len(cs) < 2:
        return []
    edges = []
    for i in range(len(cs) - 1):
        ei = edge_between(cs[i], cs[i + 1])
        if ei >= 0 and ei not in edges:
            edges.append(ei)
    return edges


def simplify_render(path):  # :7214
    p = [tuple(x) for x in path]
    if len(p) < 3:
        return p
    changed = True
    guard = 0
    while changed and guard < 4000:
        guard += 1
        changed = False
        for i in range(1, len(p) - 1):
            a = p[i - 1]
            c = p[i + 1]
            if a == c:
                del p[i:i + 2]
                changed = True
                break
            if neighbor_dir_index(a[0], a[1], c[0], c[1]) >= 0:
                del p[i]
                changed = True
                break
    return p


def mark_transit(hexes, path):  # :7232
    rp = simplify_render(path)
    if len(rp) < 2:
        return
    for i in range(len(rp)):
        cur = rp[i]
        din = neighbor_dir_index(cur[0], cur[1], rp[i - 1][0], rp[i - 1][1]) if i > 0 else -1
        dout = neighbor_dir_index(cur[0], cur[1], rp[i + 1][0], rp[i + 1][1]) if i < len(rp) - 1 else -1
        if din < 0 or dout < 0:
            continue
        for ei in transit_idx(din, dout, cur[0] + cur[1]):
            mark_edge_pair(hexes, cur[0], cur[1], ei)


# ---------------------------------------------------------------- coast/grow/meander (Q2)
def nearest_dist(sq, sr, keys):  # :9044 (brute force; indeks musi dac ten sam wynik)
    best = math.inf
    for k in keys:
        q, r = parse_key(k)
        best = min(best, hex_axial_distance(sq, sr, q, r))
    return best


def sep_passes(nq, nr, keys, min_sep):  # riverGrowStepPassesSep (:6070)
    if not keys or min_sep <= 0:
        return True
    return nearest_dist(nq, nr, keys) >= min_sep


def score_toward_centroid(q, r, nq, nr, c):  # :6026
    if c is None:
        return 0
    cur_d = hex_axial_distance(q, r, c[0], c[1])
    next_d = hex_axial_distance(nq, nr, c[0], c[1])
    if next_d < cur_d:
        return 22
    if next_d > cur_d:
        return -12
    return 3


def estimate_centroid(hexes, mq, mr, allow_relief, cap=CENTROID_CAP):  # :5982
    mk = hex_key(mq, mr)
    sq = 0
    sr = 0
    count = 0
    queue = deque([mk])
    seen = {mk}
    while queue and len(seen) < cap:
        k = queue.popleft()
        q, r = parse_key(k)
        h = hexes.get(k)
        if h is not None and h["t"] in RIVER_LAND:
            sq += q
            sr += r
            count += 1
        for dq, dr in HEX_DIRS:
            nk = hex_key(q + dq, r + dr)
            if nk in seen:
                continue
            if not can_flow(hexes.get(nk), nk, mk, False, None, allow_relief):
                continue
            seen.add(nk)
            queue.append(nk)
    if count == 0:
        return None
    return (sq / count, sr / count)


def collect(hexes, path, cur, mk, sea, lc, bl, msep, rel, hard, rlx, rand):  # :6098
    cur_key = hex_key(*cur)
    cur_d = sea.get(cur_key, 0)
    out = []
    for dq, dr in HEX_DIRS:
        nq, nr = cur[0] + dq, cur[1] + dr
        nk = hex_key(nq, nr)
        if not is_window_turn_allowed(path, nq, nr):
            continue
        if not can_flow(hexes.get(nk), nk, mk, True, None, rel):
            continue
        if not sep_passes(nq, nr, bl, msep):
            continue
        nd = sea.get(nk, 0)
        if len(path) >= 1 and nd < RIVER_MIN_INLAND_FROM_SEA:
            continue
        if hard and not rlx and nd < cur_d:
            continue
        cs = score_toward_centroid(cur[0], cur[1], nq, nr, lc)
        score = nd * 28
        if nd > cur_d:
            score += 18
        elif nd == cur_d:
            score += 22 if cs > 8 else (-36 if cs < 0 else 2)
        score += cs * 6.5
        if cs < 0:
            score -= 18
        score += rand() * 0.35
        out.append((nq, nr, score))
    return out


def grow(hexes, mq, mr, sea, rand, cap, hard_len, rel, bl, msep, lc):  # :6181
    mk = hex_key(mq, mr)
    path = [(mq, mr)]
    visited = {mk}
    centroid = lc if lc is not None else estimate_centroid(hexes, mq, mr, rel)
    while len(path) < cap:
        cur = path[-1]
        hard = len(path) < hard_len
        cands = [c for c in collect(hexes, path, cur, mk, sea, centroid, bl, msep, rel, hard, False, rand)
                 if hex_key(c[0], c[1]) not in visited]
        if not cands:
            cands = [c for c in collect(hexes, path, cur, mk, sea, centroid, bl, msep, rel, hard, True, rand)
                     if hex_key(c[0], c[1]) not in visited]
        if not cands:
            break
        cands = sorted(cands, key=lambda c: c[2], reverse=True)
        span = min(3, len(cands))
        idx = min(len(cands) - 1, math.floor(rand() * span))
        pick = cands[idx]
        path.append((pick[0], pick[1]))
        visited.add(hex_key(pick[0], pick[1]))
    return path


def meander(hexes, c, t, sea, used, rand):  # :6485
    cur_k = hex_key(*c)
    cur_d = sea.get(cur_k, 999)
    tk = hex_key(*t)
    to_t = (t[0] - c[0], t[1] - c[1])
    opts = []
    for dq, dr in HEX_DIRS:
        nq, nr = c[0] + dq, c[1] + dr
        nk = hex_key(nq, nr)
        if nk == tk or nk in used:
            continue
        if (dq, dr) == to_t:
            continue
        if not can_flow(hexes.get(nk), nk, "", True):
            continue
        nd = sea.get(nk)
        if nd is None or nd > cur_d:
            continue
        if nd < RIVER_MIN_INLAND_FROM_SEA:
            continue
        touches = any(nq + eq == t[0] and nr + er == t[1] for eq, er in HEX_DIRS)
        if not touches:
            continue
        opts.append((nq, nr))
    if not opts:
        return None
    return opts[math.floor(rand() * len(opts))]


# ---------------------------------------------------------------- driver
def load_hexes(entries):
    d = {}
    for h in entries:
        d[h["k"]] = {"t": h["t"], "n": h["n"], "z": h["z"],
                     "rz": None if h["rz"] is None else {"obecna": h["rz"]["obecna"],
                                                         "krawedzie": list(h["rz"]["krawedzie"])}}
    return d


def flat_pairs(flat):
    return [(flat[i], flat[i + 1]) for i in range(0, len(flat), 2)]


def check_coast(doc, report):
    maps = doc["maps"]
    # sea/ocean z JSON musi byc rowny BFS-owi policzonemu od zera (weryfikacja wejsc)
    for mi, mp in enumerate(maps):
        hx = load_hexes(mp["hexes"])
        sea = {}
        dq = deque()
        for k, h in hx.items():
            if h["t"] in WATER:
                sea[k] = 0
                dq.append(k)
        while dq:
            k = dq.popleft()
            q, r = parse_key(k)
            for a, b in HEX_DIRS:
                nk = hex_key(q + a, r + b)
                if nk in sea or nk not in hx:
                    continue
                sea[nk] = sea[k] + 1
                dq.append(nk)
        if sea != {k: v for k, v in mp["sea"].items()}:
            report["input_mismatch"] += 1
    cache = {}
    for c in doc["cases"]:
        m = c["m"]
        if m not in cache:
            mp = maps[m]
            cache[m] = (load_hexes(mp["hexes"]), mp["sea"], mp["ocean"])
        hexes, sea, _ocean = cache[m]
        fn = c["fn"]
        if fn == "collect":
            path = flat_pairs(c["p"])
            cur = path[-1]
            rand = mulberry32(c["seed"])
            lc = None if c["lc"] is None else tuple(c["lc"])
            bl = None if c["bl"] is None else set(c["bl"])
            out = collect(hexes, path, cur, c["mk"], sea, lc, bl, c["msep"], c["rel"], c["hard"], c["rlx"], rand)
            exp = [tuple(x) for x in c["out"]]
            got = out
            tag = "collect"
        elif fn == "grow":
            lc = None if c["lc"] is None else tuple(c["lc"])
            bl = None if c["bl"] is None else set(c["bl"])
            rand = mulberry32(c["seed"])
            path = grow(hexes, c["mq"], c["mr"], sea, rand, c["sc"], c["hl"], c["rel"], bl, c["msep"], lc)
            exp = flat_pairs(c["out"])
            got = path
            tag = "grow"
        elif fn == "meander":
            rand = mulberry32(c["seed"])
            res = meander(hexes, tuple(c["c"]), tuple(c["t"]), sea, set(c["used"]), rand)
            exp = None if c["out"] is None else tuple(c["out"])
            got = res
            tag = "meander"
        else:
            continue
        report["count"][tag] = report["count"].get(tag, 0) + 1
        if got != exp:
            report["mismatch"][tag] = report["mismatch"].get(tag, 0) + 1
            if len(report["examples"]) < 5:
                report["examples"].append((tag, c.get("seed"), exp, got))


def check_edges(doc, report):
    maps = [[h for h in mp] for mp in doc["maps"]]

    def fresh(mi):
        return load_hexes(maps[mi])

    def snap(hexes, lst):
        out = []
        for h in lst:
            hx = hexes.get(h["k"])
            out.append([h["k"], 1 if (hx and hx["rz"] and hx["rz"]["obecna"]) else 0,
                        list(hx["rz"]["krawedzie"]) if (hx and hx["rz"]) else []])
        return out

    def diff(before, after):
        return [a for b, a in zip(before, after) if b != a]

    for c in doc["cases"]:
        fn = c["fn"]
        tag = fn
        if fn == "canreceive":
            hx = fresh(c["m"]).get(c["k"])
            got = can_receive(hx)
            exp = c["out"]
        elif fn in ("mark_edge", "mark_pair"):
            hexes = fresh(c["m"])
            lst = maps[c["m"]]
            before = snap(hexes, lst)
            (mark_edge if fn == "mark_edge" else mark_edge_pair)(hexes, c["q"], c["r"], c["e"])
            got = diff(before, snap(hexes, lst))
            exp = c["d"]
        elif fn == "mark_transit":
            hexes = fresh(c["m"])
            lst = maps[c["m"]]
            before = snap(hexes, lst)
            mark_transit(hexes, flat_pairs(c["p"]))
            got = diff(before, snap(hexes, lst))
            exp = c["d"]
        elif fn == "simplify":
            got = [list(x) for x in simplify_render(flat_pairs(c["p"]))]
            got = [v for pair in got for v in pair]
            exp = c["out"]
        elif fn == "sanitize_window":
            hexes = fresh(c["m"])
            res = sanitize_window(flat_pairs(c["p"]), hexes, c["src"])
            got = [v for pair in res for v in pair]
            exp = c["out"]
        elif fn == "corner_step":
            got = corner_step(c["f"], c["cw"])
            exp = c["out"]
        elif fn == "walk":
            got = walk_perimeter(c["f"], c["t"], c["cw"])
            exp = c["out"]
        elif fn == "edge_between":
            got = edge_between(c["a"], c["b"])
            exp = c["out"]
        elif fn == "corners":
            got = corners_along(c["i"], c["o"], c["par"])
            exp = c["out"]
        elif fn == "transit_idx":
            got = transit_idx(c["i"], c["o"], c["par"])
            exp = c["out"]
        else:
            continue
        report["count"][tag] = report["count"].get(tag, 0) + 1
        if got != exp:
            report["mismatch"][tag] = report["mismatch"].get(tag, 0) + 1
            if len(report["examples"]) < 5:
                report["examples"].append((tag, exp, got))


def main():
    report = {"count": {}, "mismatch": {}, "examples": [], "input_mismatch": 0}
    coast = json.load(open(os.path.join(HERE, "web-rivers-b-coast-grow.json")))
    edges = json.load(open(os.path.join(HERE, "web-rivers-b-edges.json")))
    check_coast(coast, report)
    check_edges(edges, report)
    total = sum(report["count"].values())
    bad = sum(report["mismatch"].values())
    for k in sorted(report["count"]):
        print(f"{k}: {report['count'][k] - report['mismatch'].get(k, 0)}/{report['count'][k]}")
    print(f"input_sea_mismatch_maps: {report['input_mismatch']}")
    for ex in report["examples"]:
        print("EXAMPLE", ex)
    print(f"TOTAL: {total - bad}/{total} zgodne")
    return 0 if bad == 0 and report["input_mismatch"] == 0 and total > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
