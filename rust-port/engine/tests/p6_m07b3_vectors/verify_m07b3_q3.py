#!/usr/bin/env python3
"""P6.M07B-Q3 - niezalezny weryfikator Python OD ZERA.

Implementacja 8 symboli Q3 wyprowadzona z ZRODLA TS pinu `4bbef081d`
(gra/src/map/gen-helpers.ts :6233-6706 w pinie `4bbef081d`: traceRiverFromCoast, greedyRiverDrainToSea,
RiverAStarOpenHeap, aStarRiverToSea, injectRiverMeanders, extendRiverToMinimumLength,
extendRiverToWybrzeze, finishRiverMouthAtSea), NIE z kodu Rust i NIE z generatora .mjs.
Zaleznosci z Q2 (sanitize/repair/window/meander/centroid) importowane z niezaleznego weryfikatora
Q2 (`../p6_m07b2_vectors/verify_m07b2_q2.py`, tez Python od zera); pola odleglosci, ocean polaczony,
kwadrat centrum i punktacja kwadratu - zaimplementowane tu od zera.
Porownanie: dokladna rownosc (==) wszystkich wyjsc (sciezki), kopiec takze bit-w-bit (f jako float).

Uzycie:  python3 -I verify_m07b3_q3.py   (z katalogu tests/p6_m07b3_vectors)
Wyjscie: linia per fn, na koncu TOTAL i EXIT=<kod> (zero rozbieznosci -> 0).
"""
import json
import math
import os
import sys
from collections import deque

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "p6_m07b2_vectors"))
import verify_m07b2_q2 as q2  # noqa: E402

HEX_DIRS = q2.HEX_DIRS
hex_key = q2.hex_key
parse_key = q2.parse_key
INF = math.inf
RIVER_MOUTH_TAIL_LEN = 5  # :5526
RIVER_MIN_INLAND_FROM_SEA = 2  # :5512
WATER = {"morze", "plytkie_morze"}  # isWaterTerrainLocal (:152)
RELIEF = {"gory", "wzgorza"}  # isReliefTerrain (:5847)
RIVER_LAND = {"laka", "rownina", "wzgorza", "gory", "pustynia", "polarny"}  # :6854


# ------------------------------------------------------------------ pola (od zera z TS)
def build_sea(hexes):  # buildSeaDistanceField (:5614)
    dist = {}
    queue = deque()
    for k, h in hexes.items():
        if h["t"] in WATER:
            dist[k] = 0
            queue.append(k)
    while queue:
        k = queue.popleft()
        q, r = parse_key(k)
        for dq, dr in HEX_DIRS:
            nk = hex_key(q + dq, r + dr)
            if nk in dist or nk not in hexes:
                continue
            dist[nk] = dist[k] + 1
            queue.append(nk)
    return dist


def ocean_connected(hexes, w, h):  # oceanConnectedWaterKeys (:4026)
    conn = set()
    stack = []
    for r in range(h):
        for q in range(w):
            if q != 0 and r != 0 and q != w - 1 and r != h - 1:
                continue
            k = hex_key(q, r)
            hx = hexes.get(k)
            if hx is None or hx["t"] not in WATER:
                continue
            conn.add(k)
            stack.append(k)
    while stack:
        k = stack.pop()
        q, r = parse_key(k)
        for dq, dr in HEX_DIRS:
            nk = hex_key(q + dq, r + dr)
            nh = hexes.get(nk)
            if nh is None or nh["t"] not in WATER or nk in conn:
                continue
            conn.add(nk)
            stack.append(nk)
    return conn


def build_open(hexes, oc):  # buildOpenOceanDistanceField (:5640)
    dist = {}
    queue = deque()
    for k in oc:
        dist[k] = 0
        queue.append(k)
    while queue:
        k = queue.popleft()
        q, r = parse_key(k)
        for dq, dr in HEX_DIRS:
            nk = hex_key(q + dq, r + dr)
            if nk in dist or nk not in hexes:
                continue
            dist[nk] = dist[k] + 1
            queue.append(nk)
    return dist


def infer_dims(hexes):  # inferMapDimsFromHexes (:5781)
    mq = mr = 0
    for k in hexes:
        q, r = parse_key(k)
        mq = max(mq, q)
        mr = max(mr, r)
    return mq + 1, mr + 1


# ------------------------------------------------------------------ predykaty drenazu
def can_drain_step(nk, nd, open_, oc, post):  # canRiverDrainStep (:5580)
    if nk in oc:
        return True
    od = open_.get(nk)
    if od is None:
        return False
    if not post:
        return nd >= RIVER_MIN_INLAND_FROM_SEA
    if nd >= RIVER_MIN_INLAND_FROM_SEA:
        return True
    return od <= RIVER_MOUTH_TAIL_LEN


def drainage_goal(q, r, hexes, source, oc):  # isRiverDrainageGoal (:5595)
    if hex_key(q, r) in oc:
        return True
    for dq, dr in HEX_DIRS:
        nk = hex_key(q + dq, r + dr)
        if nk not in oc:
            continue
        if q2.can_flow(hexes.get(nk), nk, source):
            return True
    return False


def ends_at_sea(path, oc):  # pathEndsAtSea (:5797)
    if not path:
        return False
    lq, lr = path[-1]
    if hex_key(lq, lr) in oc:
        return True
    return any(hex_key(lq + dq, lr + dr) in oc for dq, dr in HEX_DIRS)


def reconstruct(came, end):  # reconstructRiverPath (:5887)
    out = []
    cur = end
    while cur is not None:
        out.append(parse_key(cur))
        cur = came.get(cur)
    out.reverse()
    return out


# ------------------------------------------------------------------ kopiec (:6342)
def less(a, b):
    return a[0] < b[0] or (a[0] == b[0] and a[1] < b[1])


def heap_push(d, f, seq, key):
    d.append([f, seq, key])
    i = len(d) - 1
    while i > 0:
        p = (i - 1) >> 1
        if less(d[i], d[p]):
            d[i], d[p] = d[p], d[i]
            i = p
        else:
            break


def heap_pop(d):
    if not d:
        return None
    top = d[0]
    last = d.pop()
    if d:
        d[0] = last
        i = 0
        while True:
            best = i
            l = 2 * i + 1
            r = l + 1
            if l < len(d) and less(d[l], d[best]):
                best = l
            if r < len(d) and less(d[r], d[best]):
                best = r
            if best == i:
                break
            d[i], d[best] = d[best], d[i]
            i = best
    return top


# ------------------------------------------------------------------ A* (:6388)
def astar(hexes, s, sea, open_, oc, max_len, rand, rel):
    sk = hex_key(*s)
    h0 = open_.get(sk, sea.get(sk))
    if h0 is None:
        return []
    if sk in oc:
        return [tuple(s)]
    g = {sk: 0.0}
    came = {}
    openset = {sk}
    fs = {sk: float(h0)}
    heap = []
    seq = 0
    heap_push(heap, float(h0), seq, sk)
    seq += 1
    best_k = sk
    best_h = float(h0)
    while openset:
        current = ""
        while heap:
            e = heap_pop(heap)
            k = e[2]
            if k not in openset:
                continue
            if fs.get(k, INF) != e[0]:
                continue
            current = k
            break
        if not current:
            break
        cur_g = g[current]
        cur_h = float(open_[current]) if current in open_ else INF
        q, r = parse_key(current)
        if cur_h < best_h:
            best_h = cur_h
            best_k = current
        if drainage_goal(q, r, hexes, sk, oc):
            return reconstruct(came, current)
        openset.discard(current)
        if cur_g >= max_len:
            continue
        prev = came.get(current)
        in_dir = None
        if prev is not None:
            pq, pr = parse_key(prev)
            in_dir = (q - pq, r - pr)
        for dq, dr in HEX_DIRS:
            nk = hex_key(q + dq, r + dr)
            if not q2.can_flow(hexes.get(nk), nk, sk, True, None, rel):
                continue
            nd = sea.get(nk, INF)
            if not can_drain_step(nk, nd, open_, oc, True):
                continue
            step = 1.0
            if in_dir is not None and in_dir == (dq, dr):
                step += 0.18 + rand() * 0.12
            tg = cur_g + step
            if tg > max_len + 2:
                continue
            if tg >= g.get(nk, INF):
                continue
            came[nk] = current
            g[nk] = tg
            nf = tg + (float(open_[nk]) if nk in open_ else INF)
            fs[nk] = nf
            openset.add(nk)
            heap_push(heap, nf, seq, nk)
            seq += 1
    if best_k != sk:
        q, r = parse_key(best_k)
        if drainage_goal(q, r, hexes, sk, oc):
            return reconstruct(came, best_k)
    return [tuple(s)]


# ------------------------------------------------------------------ greedy (:6277)
def greedy(hexes, s, sea, open_, oc, max_len, rand, src, rel):
    path = [tuple(s)]
    visited = {hex_key(*s)}
    for _ in range(max_len):
        cur = path[-1]
        ck = hex_key(*cur)
        if drainage_goal(cur[0], cur[1], hexes, src, oc):
            return path
        cod = open_.get(ck)
        if cod is None:
            break
        in_dir = None
        if len(path) >= 2:
            pv = path[-2]
            in_dir = (cur[0] - pv[0], cur[1] - pv[1])
        cands = []
        for dq, dr in HEX_DIRS:
            nq, nr = cur[0] + dq, cur[1] + dr
            nk = hex_key(nq, nr)
            if nk in visited:
                continue
            if not q2.is_window_turn_allowed(path, nq, nr):
                continue
            if not q2.can_flow(hexes.get(nk), nk, src, True, None, rel):
                continue
            nd = sea.get(nk, INF)
            if not can_drain_step(nk, nd, open_, oc, True):
                continue
            od = float(open_[nk]) if nk in open_ else INF
            if od > cod + 0.5:
                continue
            score = od * 12 + rand() * 0.35
            if in_dir is not None and in_dir == (dq, dr):
                score -= 1.8
            cands.append((nq, nr, score))
        if not cands:
            break
        cands = sorted(cands, key=lambda c: c[2])  # stabilny, rosnaco
        path.append((cands[0][0], cands[0][1]))
        visited.add(hex_key(cands[0][0], cands[0][1]))
    last = path[-1]
    if len(path) > 1 and drainage_goal(last[0], last[1], hexes, src, oc):
        return path
    return []


# ------------------------------------------------------------------ meandry / wydluzanie
def inject(path, hexes, sea, rand, max_extra):  # :6527
    if len(path) < 5 or max_extra <= 0:
        return [tuple(p) for p in path]
    result = [tuple(p) for p in path]
    extra = 0
    straight = 0
    last = None
    i = 0
    while i < len(result) - 2 and extra < max_extra:
        d = (result[i + 1][0] - result[i][0], result[i + 1][1] - result[i][1])
        if last is not None and last == d:
            straight += 1
        else:
            straight = 1
            last = d
        if straight >= 4 and not (rand() >= 0.34):
            used = {hex_key(*p) for p in result}
            bend = q2.meander(hexes, result[i + 1], result[i + 2], sea, used, rand)
            if bend is not None:
                result.insert(i + 2, bend)
                extra += 1
                straight = 0
                i += 2
        i += 1
    return q2.repair_adjacency(q2.sanitize_path(result), hexes, hex_key(*path[0]))


def extmin(path, hexes, sea, rand, min_len, cap):  # :6570
    if len(path) >= min_len or len(path) < 3:
        return [tuple(p) for p in path]
    src = hex_key(*path[0])
    out = [tuple(p) for p in path]
    for _ in range(12):
        if not (len(out) < min_len and len(out) < cap):
            break
        need = min(min_len - len(out), cap - len(out), 6)
        m = inject(out, hexes, sea, rand, need)
        if len(m) > len(out):
            out = m
            continue
        mid = max(1, math.floor(len(out) * 0.45))
        used = {hex_key(*p) for p in out}
        a = out[mid]
        b = out[min(len(out) - 1, mid + 1)]
        bend = q2.meander(hexes, a, b, sea, used, rand)
        if bend is not None:
            out = out[: mid + 1] + [bend] + out[mid + 1:]
            out = q2.repair_adjacency(q2.sanitize_path(out), hexes, src)
        else:
            break
    return out


def wybrzeze(hexes, path, sea):  # :6603
    path = [tuple(p) for p in path]
    if not path:
        return path
    visited = {hex_key(*p) for p in path}
    cq, cr = path[-1]
    for _ in range(RIVER_MOUTH_TAIL_LEN):
        end = hexes.get(hex_key(cq, cr))
        if end is None:
            break
        if end["t"] in WATER:
            break
        best = None
        best_score = INF
        for dq, dr in HEX_DIRS:
            nq, nr = cq + dq, cr + dr
            nk = hex_key(nq, nr)
            if nk in visited:
                continue
            nh = hexes.get(nk)
            if nh is None or nh["t"] == "morze" or nh["t"] in RELIEF:
                continue
            score = float(sea[nk]) if nk in sea else 999.0
            if nh["t"] == "plytkie_morze":
                score -= 8
            if score < best_score:
                best_score = score
                best = (nq, nr)
        if best is None:
            break
        path.append(best)
        visited.add(hex_key(*best))
        cq, cr = best
    return path


def finish(hexes, path, sea, open_, oc, src):  # :6648
    path = [tuple(p) for p in path]
    if not path:
        return path
    if drainage_goal(path[-1][0], path[-1][1], hexes, src, oc):
        return path
    visited = {hex_key(*p) for p in path}
    cur = path[-1]
    for _ in range(RIVER_MOUTH_TAIL_LEN + 2):
        if drainage_goal(cur[0], cur[1], hexes, src, oc):
            return path
        best = None
        best_score = INF
        for dq, dr in HEX_DIRS:
            nq, nr = cur[0] + dq, cur[1] + dr
            nk = hex_key(nq, nr)
            if nk in visited:
                continue
            nh = hexes.get(nk)
            if nh is None or nh["t"] == "morze" or nh["t"] in RELIEF:
                continue
            nd = sea.get(nk, INF)
            shallow = nh["t"] == "plytkie_morze"
            if not shallow and not can_drain_step(nk, nd, open_, oc, True):
                continue
            if not q2.can_flow(nh, nk, src) and not shallow:
                continue
            score = float(open_[nk]) if nk in open_ else float(nd)
            if shallow:
                score -= 15
            if score < best_score:
                best_score = score
                best = (nq, nr)
        if best is None:
            break
        path.append(best)
        visited.add(hex_key(*best))
        cur = best
    return path


# ------------------------------------------------------------------ trace z wybrzeza (:6233)
def land_centroid(hexes, keys):  # computeLandMassCentroid (:1440)
    sq = sr = n = 0
    for k in keys:
        h = hexes.get(k)
        if h is None or h["t"] not in RIVER_LAND:
            continue
        q, r = parse_key(k)
        sq += q
        sr += r
        n += 1
    return None if n == 0 else (sq / n, sr / n)


def center_square(hexes, mass_keys, size):  # continentCenterSquare (:1472)
    land = [k for k in mass_keys if hexes.get(k) is not None and hexes[k]["t"] in RIVER_LAND]
    if not land:
        return None
    cen = land_centroid(hexes, land)
    if cen is None:
        return None
    qs = [parse_key(k)[0] for k in land]
    rs = [parse_key(k)[1] for k in land]
    span_q = max(qs) - min(qs) + 1
    span_r = max(rs) - min(rs) + 1
    if span_q <= size and span_r <= size:
        bq0, bq1, br0, br1 = min(qs), max(qs), min(rs), max(rs)
    else:
        cq = js_round(cen[0])
        cr = js_round(cen[1])
        half = size // 2
        bq0, bq1, br0, br1 = cq - half, cq + half, cr - half, cr + half
    keys = [k for k in land if bq0 <= parse_key(k)[0] <= bq1 and br0 <= parse_key(k)[1] <= br1]
    if not keys:
        keys = list(land)
    return {"keys": set(keys), "centroid": cen}


def js_round(x):  # Math.round
    return math.floor(x + 0.5)


def dist_square(q, r, sq):  # hexDistanceToCenterSquare (:1539)
    if sq is None or not sq["keys"]:
        return 0
    if hex_key(q, r) in sq["keys"]:
        return 0
    return min(q2.hex_axial_distance(q, r, *parse_key(k)) for k in sq["keys"])


def score_square(q, r, nq, nr, sq):  # scoreRiverStepTowardCenterSquare (:6038)
    cur_d = dist_square(q, r, sq)
    next_d = dist_square(nq, nr, sq)
    if hex_key(nq, nr) in sq["keys"]:
        return 40
    if next_d < cur_d:
        return 32
    if next_d > cur_d:
        return -22
    return 4


def collect_sq(hexes, path, cur, mk, sea, lc, sq, bl, msep, rel, hard, rlx, rand):  # :6098
    cur_d = sea.get(hex_key(*cur), 0)
    out = []
    for dq, dr in HEX_DIRS:
        nq, nr = cur[0] + dq, cur[1] + dr
        nk = hex_key(nq, nr)
        if not q2.is_window_turn_allowed(path, nq, nr):
            continue
        if not q2.can_flow(hexes.get(nk), nk, mk, True, None, rel):
            continue
        if not q2.sep_passes(nq, nr, bl, msep):
            continue
        nd = sea.get(nk, 0)
        if len(path) >= 1 and nd < RIVER_MIN_INLAND_FROM_SEA:
            continue
        if hard and not rlx and nd < cur_d:
            continue
        cs = score_square(cur[0], cur[1], nq, nr, sq) if sq is not None else q2.score_toward_centroid(cur[0], cur[1], nq, nr, lc)
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


def grow_sq(hexes, mq, mr, sea, rand, cap, hard_len, rel, bl, msep, lc, sq):  # :6181
    mk = hex_key(mq, mr)
    path = [(mq, mr)]
    visited = {mk}
    if lc is not None:
        centroid = lc
    elif sq is not None:
        centroid = sq["centroid"]
    else:
        centroid = q2.estimate_centroid(hexes, mq, mr, rel)
    while len(path) < cap:
        cur = path[-1]
        hard = len(path) < hard_len
        cands = [c for c in collect_sq(hexes, path, cur, mk, sea, centroid, sq, bl, msep, rel, hard, False, rand)
                 if hex_key(c[0], c[1]) not in visited]
        if not cands:
            cands = [c for c in collect_sq(hexes, path, cur, mk, sea, centroid, sq, bl, msep, rel, hard, True, rand)
                     if hex_key(c[0], c[1]) not in visited]
        if not cands:
            break
        cands = sorted(cands, key=lambda c: c[2], reverse=True)
        span = min(3, len(cands))
        idx = min(len(cands) - 1, math.floor(rand() * span))
        pk = cands[idx]
        path.append((pk[0], pk[1]))
        visited.add(hex_key(pk[0], pk[1]))
    return path


def trace(mp, hexes, c, ml):
    mode = c["mode"]
    mq, mr = c["mq"], c["mr"]
    if mode in (1, 2):
        w, h = mp["w"], mp["h"]
    elif mode == 4:
        w, h = mp["w"] + c["dw"], mp["h"] + c["dh"]
    else:  # tryby 0 i 3: wymiary wnioskowane z mapy (mapHeight brak w trybie 3)
        w, h = infer_dims(hexes)
    sea = mp["sea"] if mode in (1, 2, 3) else build_sea(hexes)
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
        open_ = build_open(hexes, oc)
    else:
        oc = ocean_connected(hexes, w, h)
        open_ = build_open(hexes, oc)
    rand = q2.mulberry32(c["seed"]) if c["seed"] is not None else (lambda: 0.0)
    mk = hex_key(mq, mr)
    d = sea.get(mk)
    if d is None or d > 2:
        return []
    hl = c["hl"] if c["hl"] is not None else 8
    rel = c["rel"] if c["rel"] is not None else False
    msep = c["msep"] if c["msep"] is not None else 3
    sq = center_square(hexes, [hh["k"] for hh in mp["hexes"]], c["sq"]) if c["sq"] is not None else None
    lc = tuple(c["lc"]) if c["lc"] is not None else None
    path = grow_sq(hexes, mq, mr, sea, rand, ml, hl, rel, c["bl"], msep, lc, sq)
    if len(path) < 2:
        return []
    rev = list(reversed(path))
    if not ends_at_sea(rev, oc):
        return []
    return rev


# ------------------------------------------------------------------ sterownik
def flat(path):
    return [x for p in path for x in p]


def pert_fields(mp, pt):
    """Pola mapy bez kluczy z `pt` (null = bez zmian) - perturbacje z generatora."""
    if not pt:
        return mp["sea"], mp["open"], set(mp["oc"])
    srm, orm, ocrm = set(pt["srm"]), set(pt["orm"]), set(pt["ocrm"])
    return ({k: v for k, v in mp["sea"].items() if k not in srm},
            {k: v for k, v in mp["open"].items() if k not in orm},
            {k for k in mp["oc"] if k not in ocrm})


def run_case(maps, hx, c):
    f = c["fn"]
    mp = maps[c["m"]] if "m" in c else None
    hexes = hx[c["m"]] if "m" in c else None
    if f == "heap":
        d = []
        outs = []
        for op in c["ops"]:
            if op[0] == "push":
                heap_push(d, INF if op[1] == "inf" else float(op[1]), op[2], op[3])
            else:
                e = heap_pop(d)
                outs.append([("inf" if e[0] == INF else e[0]), e[1], e[2]])
        snap = [[("inf" if e[0] == INF else e[0]), e[1], e[2]] for e in d]
        want_outs = c["outs"]
        ok = len(outs) == len(want_outs) and all(
            (o[0] == w[0] if isinstance(o[0], str) or isinstance(w[0], str) else float(o[0]) == float(w[0]))
            and o[1] == w[1] and o[2] == w[2] for o, w in zip(outs, want_outs))
        ok = ok and len(snap) == len(c["snap"]) and all(
            (s[0] == w[0] if isinstance(s[0], str) or isinstance(w[0], str) else float(s[0]) == float(w[0]))
            and s[1] == w[1] and s[2] == w[2] for s, w in zip(snap, c["snap"]))
        return ok
    rand_of = lambda seed: (q2.mulberry32(seed) if seed is not None else (lambda: 0.0))
    sea_, open__, oc_ = pert_fields(mp, c.get("pt")) if mp is not None else (None, None, None)
    if f == "astar":
        got = flat(astar(hexes, tuple(c["s"]), sea_, open__, oc_, c["ml"], rand_of(c["seed"]), c["rel"]))
        return got == c["out"]
    if f == "greedy":
        got = flat(greedy(hexes, tuple(c["s"]), sea_, open__, oc_, c["ml"], rand_of(c["seed"]), c["sk"], c["rel"]))
        return got == c["out"]
    if f == "trace":
        return flat(trace(mp, hexes, c, c["ml"])) == c["out"]
    if f == "inject":
        return flat(inject(q2.flat_pairs(c["p"]), hexes, sea_, rand_of(c["seed"]), c["mx"])) == c["out"]
    if f == "extmin":
        return flat(extmin(q2.flat_pairs(c["p"]), hexes, sea_, rand_of(c["seed"]), c["min"], c["cap"])) == c["out"]
    if f == "wyb":
        return flat(wybrzeze(hexes, q2.flat_pairs(c["p"]), sea_)) == c["out"]
    if f == "fin":
        return flat(finish(hexes, q2.flat_pairs(c["p"]), sea_, open__, oc_, c["sk"])) == c["out"]
    if f == "sweep":
        kind = c["kind"]
        for i, want in enumerate(c["outs"]):
            n = c["lo"] + i
            if kind == "astar":
                got = astar(hexes, tuple(c["s"]), mp["sea"], mp["open"], set(mp["oc"]), n, rand_of(c["seed"]), False)
            elif kind == "greedy":
                got = greedy(hexes, tuple(c["s"]), mp["sea"], mp["open"], set(mp["oc"]), n, rand_of(c["seed"]), c["sk"], False)
            elif kind == "trace":
                got = trace(mp, hexes, c, n)
            elif kind == "startd":
                c2 = dict(c)
                c2["sd"] = {"k": f'{c["mq"]},{c["mr"]}', "v": c["vs"][i]}
                got = trace(mp, hexes, c2, c["ml"])
            elif kind == "inject":
                got = inject(q2.flat_pairs(c["p"]), hexes, mp["sea"], rand_of(c["seed"]), n)
            elif kind == "extmin":
                got = extmin(q2.flat_pairs(c["p"]), hexes, mp["sea"], rand_of(c["seed"]), n, c["cap"])
            elif kind == "extcap":
                got = extmin(q2.flat_pairs(c["p"]), hexes, mp["sea"], rand_of(c["seed"]), c["min"], n)
            else:
                raise SystemExit(f"sweep {kind}")
            if flat(got) != want:
                return False
        return True
    raise SystemExit(f"fn {f}")


def main():
    with open(os.path.join(HERE, "web-rivers-b-q3.json")) as fh:
        doc = json.load(fh)
    maps = doc["maps"]
    hx = [q2.load_hexes(m["hexes"]) for m in maps]
    # wejscia: sea/open/oc z JSON musza byc rowne policzonym od zera
    mism = 0
    for m, h in zip(maps, hx):
        oc = ocean_connected(h, m["w"], m["h"])
        if build_sea(h) != m["sea"] or oc != set(m["oc"]) or build_open(h, oc) != m["open"]:
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
