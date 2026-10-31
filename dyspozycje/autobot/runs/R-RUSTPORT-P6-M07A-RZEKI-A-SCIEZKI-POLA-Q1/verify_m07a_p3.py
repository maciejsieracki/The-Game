# Niezalezny weryfikator (P6.M07A, partie 2-3): stdlib, napisany OD ZERA z TS pinu edb8fb56
# (gen-helpers.ts: :57-65 mulberry32, :1440-1476 computeLandMassCentroid/continentCenterSquare,
# :1540-1553 hexDistanceToCenterSquare, :4026-4050 oceanConnectedWaterKeys, :5580-5611 drain,
# :5614-5660 pola morza, :5781-5900 dims/pathEndsAtSea, :5903-6172 wzrost/kandydaci/centroid,
# :6988-7036 okno skretu, :8975-9056 indeks sep, :5669-5752 profil). NIE czyta Rusta ani generatora.
# Zakres: drainStep, drainGoal, pathSea (+edge), openOceanDist, grow, collect, nearest, sep, indeks,
# okno skretu, kierunki, bigCap (cap 6000), profil i toFixed. NIE obejmuje purge*, render*,
# coastalRender, audit i scoreSquare (te pokrywaja wektory web + testy Rust + mutacje W24-W31).
# Uzycie: python3 -I verify_m07a_p3.py <WEKTORY-walk.json> <WEKTORY-grow.json>
import json
import math
import sys
from decimal import Decimal, ROUND_HALF_UP

M32 = 0xFFFFFFFF
DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]  # HEX_DIRECTIONS (gen-helpers.ts:125)
WATER = {"morze", "plytkie_morze"}                              # isWaterTerrainLocal (:152)
RIVER_LAND = {"laka", "rownina", "wzgorza", "gory", "pustynia", "polarny"}  # isRiverLandTerrain (:6854)
RELIEF = {"gory", "wzgorza"}                                    # isReliefTerrain (:5847)
MIN_INLAND = 2       # RIVER_MIN_INLAND_FROM_SEA
MOUTH_TAIL = 5       # RIVER_MOUTH_TAIL_LEN
TURN_HEX = 6         # RIVER_TURN_WINDOW_HEX (:6999)
TURN_SUM = 1         # RIVER_TURN_WINDOW_MAX_SUM (:7000)
CELL = 6             # RIVER_SPATIAL_CELL (:8975)
MAX_RING = 24        # nearestDistance maxRing (:9000)
CAP = 6000           # estimateLandCentroidFromSeed visitCap (:5985)
SQ_SIZE = 5          # CONTINENT_CENTER_SQUARE_SIZE (:1460)
INF = float("inf")


def key(q, r):
    return f"{q},{r}"


def parse(k):
    a, b = k.split(",")
    return int(a), int(b)


def hex_dist(q1, r1, q2, r2):
    # hexAxialDistance (:5194) - wspolrzedne moga byc ulamkowe
    dq, dr = q1 - q2, r1 - r2
    return (abs(dq) + abs(dr) + abs(dq + dr)) / 2


def numS(x):
    # JS String(x) dla liczb uzywanych w wektorach (inf/-inf/nan jako tokeny; calkowite bez ".0")
    if math.isinf(x):
        return "inf" if x > 0 else "-inf"
    if math.isnan(x):
        return "nan"
    if float(x).is_integer():
        return str(int(x))
    return repr(float(x))


def num(s):
    return float(s)  # Python float(String) = poprawne zaokraglenie jak JS Number(String)


class Mulberry32:
    # mulberry32 (:57-65) z 32-bitowa arytmetyka JS (Math.imul, >>>, ^)
    def __init__(self, seed):
        self.s = seed & M32

    def __call__(self):
        self.s = (self.s + 0x6D2B79F5) & M32
        s = self.s
        t = ((s ^ (s >> 15)) * ((1 | s) & M32)) & M32
        t = t ^ (((t + (((t ^ (t >> 7)) * ((61 | t) & M32)) & M32)) & M32))
        t &= M32
        return ((t ^ (t >> 14)) & M32) / 4294967296


def load_hexes(rows):
    # wiersz: [klucz, teren, nakladka, zloze, rzekaObecna, krawedzie] -> {key: (teren, rzeka)}
    return {r[0]: {"teren": r[1], "rzeka": r[4] == 1} for r in rows}


def infer_dims(hx):
    mq = mr = 0
    for k in hx:
        q, r = parse(k)
        mq = max(mq, q)
        mr = max(mr, r)
    return mq + 1, mr + 1


def ocean_connected(hx, w, h):
    # oceanConnectedWaterKeys (:4026-4050): morze/plytka woda na brzegu i jej lancuch wody
    conn = set()
    queue = []
    for r in range(h):
        for q in range(w):
            if q != 0 and r != 0 and q != w - 1 and r != h - 1:
                continue
            k = key(q, r)
            if k in hx and hx[k]["teren"] in WATER:
                conn.add(k)
                queue.append(k)
    while queue:
        k = queue.pop()
        q, r = parse(k)
        for dq, dr in DIRS:
            nk = key(q + dq, r + dr)
            if nk in conn:
                continue
            # web :4026-4050: rozszerzenie po calej wodzie (morze i plytka), nie tylko plytkiej
            if hx.get(nk, {}).get("teren") in WATER:
                conn.add(nk)
                queue.append(nk)
    return conn


def sea_dist(hx):
    # buildSeaDistanceField (:5614): BFS od wody po wszystkich heksach mapy
    dist = {}
    queue = []
    for k, v in hx.items():
        if v["teren"] in WATER:
            dist[k] = 0
            queue.append(k)
    qi = 0
    while qi < len(queue):
        k = queue[qi]
        qi += 1
        d = dist[k]
        q, r = parse(k)
        for dq, dr in DIRS:
            nk = key(q + dq, r + dr)
            if nk in dist or nk not in hx:
                continue
            dist[nk] = d + 1
            queue.append(nk)
    return dist


def open_ocean_dist(hx, oc):
    # buildOpenOceanDistanceField (:5640): BFS od oceanu polaczonego z krawedzia
    dist = {}
    queue = []
    for k in oc:
        dist[k] = 0
        queue.append(k)
    qi = 0
    while qi < len(queue):
        k = queue[qi]
        qi += 1
        d = dist[k]
        q, r = parse(k)
        for dq, dr in DIRS:
            nk = key(q + dq, r + dr)
            if nk in dist or nk not in hx:
                continue
            dist[nk] = d + 1
            queue.append(nk)
    return dist


def can_flow(hx, k, source, block_existing=False, allow_key=None, allow_relief=False):
    # canRiverFlowThrough (:5862): Morze nigdy; relief tylko dla zrodla; blok istniejacej rzeki
    h = hx.get(k)
    if h is None or h["teren"] == "morze":
        return False
    if h["teren"] in RELIEF and not allow_relief:
        return k == source
    if block_existing and h["rzeka"] and k != allow_key:
        return False
    return True


def can_drain_step(nk, nd, od, oc, post):
    # canRiverDrainStep (:5580)
    if nk in oc:
        return True
    if nk not in od:
        return False
    if not post:
        return nd >= MIN_INLAND
    if nd >= MIN_INLAND:
        return True
    return od[nk] <= MOUTH_TAIL


def is_drain_goal(q, r, hx, source, oc):
    # isRiverDrainageGoal (:5595); canRiverFlowThrough(hex, nk, source) z domyslnymi flagami
    if key(q, r) in oc:
        return True
    for dq, dr in DIRS:
        nk = key(q + dq, r + dr)
        if nk not in oc:
            continue
        if can_flow(hx, nk, source):
            return True
    return False


def path_ends_at_sea(hx, path, dims=None):
    # pathEndsAtSea (:5797)
    if not path:
        return False
    w, h = dims if dims is not None else infer_dims(hx)
    oc = ocean_connected(hx, w, h)
    lq, lr = path[-1]
    if key(lq, lr) in oc:
        return True
    for dq, dr in DIRS:
        if key(lq + dq, lr + dr) in oc:
            return True
    return False


def estimate_centroid(hx, mq, mr, allow, cap=CAP):
    # estimateLandCentroidFromSeed (:5982): FIFO, warunek seen.size < cap przed pobraniem
    mouth = key(mq, mr)
    queue = [mouth]
    head = 0
    seen = {mouth}
    sq = sr = 0
    cnt = 0
    while head < len(queue) and len(seen) < cap:
        k = queue[head]
        head += 1
        q, r = parse(k)
        h = hx.get(k)
        if h and h["teren"] in RIVER_LAND:
            sq += q
            sr += r
            cnt += 1
        for dq, dr in DIRS:
            nk = key(q + dq, r + dr)
            if nk in seen:
                continue
            if not can_flow(hx, nk, mouth, False, None, allow):
                continue
            seen.add(nk)
            queue.append(nk)
    if cnt == 0:
        return None
    return (sq / cnt, sr / cnt)


def continent_square(hx, mass_keys, size=SQ_SIZE):
    # continentCenterSquare (:1472) + computeLandMassCentroid (:1440)
    land = [k for k in mass_keys if k in hx and hx[k]["teren"] in RIVER_LAND]
    if not land:
        return None
    sq = sum(parse(k)[0] for k in land)
    sr = sum(parse(k)[1] for k in land)
    cen = (sq / len(land), sr / len(land))
    qs = [parse(k)[0] for k in land]
    rs = [parse(k)[1] for k in land]
    span_q = max(qs) - min(qs) + 1
    span_r = max(rs) - min(rs) + 1
    if span_q <= size and span_r <= size:
        bq0, bq1, br0, br1 = min(qs), max(qs), min(rs), max(rs)
    else:
        cq = math.floor(cen[0] + 0.5)  # Math.round (dla dodatnich i ujemnych: w gore przy polowce)
        cr = math.floor(cen[1] + 0.5)
        half = size // 2
        bq0, bq1, br0, br1 = cq - half, cq + half, cr - half, cr + half
    keys = {k for k in land if bq0 <= parse(k)[0] <= bq1 and br0 <= parse(k)[1] <= br1}
    if not keys:
        keys = set(land)
    return {"keys": keys, "centroid": cen}


def dist_to_square(q, r, sq):
    # hexDistanceToCenterSquare (:1540)
    if sq is None or not sq["keys"]:
        return 0
    if key(q, r) in sq["keys"]:
        return 0
    return min(hex_dist(q, r, *parse(k)) for k in sq["keys"])


def score_centroid(q, r, nq, nr, c):
    # scoreRiverStepTowardCentroid (:6026)
    if c is None:
        return 0
    cd = hex_dist(q, r, c[0], c[1])
    nd = hex_dist(nq, nr, c[0], c[1])
    if nd < cd:
        return 22
    if nd > cd:
        return -12
    return 3


def score_square(q, r, nq, nr, sq):
    # scoreRiverStepTowardCenterSquare (:6041)
    if sq is None:
        return 0
    cur = dist_to_square(q, r, sq)
    nxt = dist_to_square(nq, nr, sq)
    if key(nq, nr) in sq["keys"]:
        return 40
    if nxt < cur:
        return 32
    if nxt > cur:
        return -22
    return 4


def score_land_center(q, r, nq, nr, sq, c):
    # scoreRiverStepTowardLandCenter (:6057)
    if sq is not None:
        return score_square(q, r, nq, nr, sq)
    return score_centroid(q, r, nq, nr, c)


def dir_index(q, r, nq, nr):
    # neighborDirIndex (:6988)
    dq, dr = nq - q, nr - r
    for i, d in enumerate(DIRS):
        if d == (dq, dr):
            return i
    return -1


def signed_delta(last, new):
    # signedRiverDirDelta (:7003) z riverHexDirDelta (:5975)
    raw = ((new - last) % 6 + 6) % 6
    return raw if raw <= 3 else raw - 6


def segment_dirs(path):
    # pathSegmentDirs (:7008)
    out = []
    for i in range(len(path) - 1):
        d = dir_index(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1])
        if d >= 0:
            out.append(d)
    return out


def turn_deltas(dirs):
    # pathSignedTurnDeltas (:7017)
    return [signed_delta(dirs[i - 1], dirs[i]) for i in range(1, len(dirs))]


def window_allowed(path, nq, nr):
    # isRiverWindowTurnAllowed (:7026)
    cq, cr = path[-1]
    step = dir_index(cq, cr, nq, nr)
    if step < 0:
        return False
    dirs = segment_dirs(path)
    if not dirs:
        return True
    if abs(signed_delta(dirs[-1], step)) > 1:
        return False
    dirs = dirs + [step]
    deltas = turn_deltas(dirs)
    window = deltas[-TURN_HEX:] if TURN_HEX > 0 else deltas
    return abs(sum(window)) <= TURN_SUM


class Index:
    # RiverHexSpatialIndex (:8981): komorki floor(q/6), dedup po wspolrzednych
    def __init__(self, keys=()):
        self.b = {}
        self.n = 0
        for k in keys:
            self.add(k)

    def add(self, k):
        q, r = parse(k)
        cell = (q // CELL, r // CELL)
        bucket = self.b.setdefault(cell, [])
        if (q, r) in bucket:
            return
        bucket.append((q, r))
        self.n += 1

    def nearest(self, sq, sr):
        # nearestDistance (:9000) bez earlyExit
        if self.n == 0:
            return INF
        c0q, c0r = sq // CELL, sr // CELL
        best = INF
        ring = 0
        while ring <= MAX_RING:
            for dq in range(-ring, ring + 1):
                for dr in range(-ring, ring + 1):
                    if ring > 0 and abs(dq) != ring and abs(dr) != ring:
                        continue
                    for q, r in self.b.get((c0q + dq, c0r + dr), []):
                        d = hex_dist(sq, sr, q, r)
                        if d < best:
                            best = d
            if best != INF and best <= ring * CELL:
                break
            ring += 1
        return best


def nearest_dist(sq, sr, keys, index=None):
    # nearestRiverHexDistance (:9044)
    if index is not None and index.n > 0:
        return index.nearest(sq, sr)
    best = INF
    for k in keys:
        q, r = parse(k)
        best = min(best, hex_dist(sq, sr, q, r))
    return best


def sep_ok(nq, nr, block, min_sep, index=None):
    # riverGrowStepPassesSep (:6070)
    if block is None or len(block) == 0 or min_sep <= 0:
        return True
    return nearest_dist(nq, nr, block, index) >= min_sep


def collect(o, rand):
    # collectInlandDrainGrowCandidates (:6148)
    cur = o["cur"]
    cur_k = key(*cur)
    cur_d = o["sea"].get(cur_k, 0)
    cur_od = o["od"].get(cur_k, INF)
    out = []
    for dq, dr in DIRS:
        nq, nr = cur[0] + dq, cur[1] + dr
        nk = key(nq, nr)
        if not window_allowed(o["path"], nq, nr):
            continue
        if not can_flow(o["hx"], nk, o["src"], True, None, o["relief"]):
            continue
        if not sep_ok(nq, nr, o["block"], o["min_sep"]):
            continue
        nd = o["sea"].get(nk, 0)
        if not o["relax_sea"] and nd < MIN_INLAND:
            continue
        od = o["od"].get(nk, INF)
        if o["hard"] and not o["relax_hard"] and od < cur_od:
            continue
        score = 1200 - od * 30
        if od > cur_od + 0.5:
            score -= 18
        if nd > cur_d + 1:
            score -= 10
        if nd == MIN_INLAND and od < cur_od:
            score += 8
        score += score_land_center(cur[0], cur[1], nq, nr, o["square"], o["centroid"])
        score += rand() * 0.35
        out.append((nq, nr, score))
    return out


def grow(hx, p, rand):
    # growRiverInlandBeforeDrainage (:5903)
    src = key(p["sq"], p["sr"])
    path = [(p["sq"], p["sr"])]
    visited = {src}
    centroid = p["centroid"]
    if centroid is None and p["square"] is not None:
        centroid = p["square"]["centroid"]
    if centroid is None and p["square"] is None:
        centroid = estimate_centroid(hx, p["sq"], p["sr"], p["relief"])
    target = p["target"] if p["growth_max"] is None else max(p["target"], p["growth_max"])
    growth_target = min(p["cap"], target)
    while len(path) < growth_target and len(path) < p["cap"]:
        cur = path[-1]
        hard = len(path) < p["hard"]
        base = dict(hx=hx, path=path, cur=cur, src=src, sea=p["sea"], od=p["od"], centroid=centroid,
                    square=p["square"], block=p["block"], min_sep=p["min_sep"], relief=p["relief"],
                    hard=hard, relax_hard=False, relax_sea=p["relax_sea"])
        cands = [c for c in collect(base, rand) if key(c[0], c[1]) not in visited]
        if not cands:
            cands = [c for c in collect(dict(base, relax_hard=True), rand) if key(c[0], c[1]) not in visited]
        if not cands:
            if hard and len(path) < p["hard"]:
                soft = [c for c in collect(dict(base, relax_hard=True, relax_sea=p["relax_sea"]), rand)
                        if key(c[0], c[1]) not in visited]
                if not soft:
                    break
                soft.sort(key=lambda c: -c[2])
                path.append((soft[0][0], soft[0][1]))
                visited.add(key(soft[0][0], soft[0][1]))
                continue
            break
        cands.sort(key=lambda c: -c[2])
        idx = min(len(cands) - 1, math.floor(rand() * min(3, len(cands))))
        pick = cands[idx]
        path.append((pick[0], pick[1]))
        visited.add(key(pick[0], pick[1]))
    return path


def js_to_fixed(x, d):
    # Number.prototype.toFixed: dokladna wartosc binarna, remis -> wiekszy n (ROUND_HALF_UP)
    if math.isnan(x):
        return "NaN"
    q = Decimal(x).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)
    s = format(q, f".{d}f")
    if x < 0 and not s.startswith("-"):
        s = "-" + s
    return s


def fmt_profile(s, total):
    # formatRiverProfileReport (:5727); None = brak statystyk
    if s is None:
        return "(profiler off — set CIV_RIVER_PROFILE=1)"
    river = s["generateRiversMs"] + s["topUpMs"]
    denom = river if total is None else total

    def pct(ms):
        return js_to_fixed(ms / denom * 100, 1) if denom > 0 else "0.0"

    def f0(ms):
        return js_to_fixed(ms, 0)

    lines = [
        "=== RIVER PROFILE (CIV_RIVER_PROFILE=1) ===",
        f"fieldCache:        {f0(s['fieldCacheMs'])}ms ({pct(s['fieldCacheMs'])}%) ×{s['fieldCacheCalls']}",
        f"generateRivers:    {f0(s['generateRiversMs'])}ms ({pct(s['generateRiversMs'])}%)",
        f"  stage1 (main):   {f0(s['genStage1Ms'])}ms ({pct(s['genStage1Ms'])}%)",
        f"  stage2 (medium): {f0(s['genStage2Ms'])}ms ({pct(s['genStage2Ms'])}%) rounds={s['genStage2Rounds']}",
        f"  stage3 (short):  {f0(s['genStage3Ms'])}ms ({pct(s['genStage3Ms'])}%)",
        f"  decor tributary: {f0(s['genDecorMs'])}ms ({pct(s['genDecorMs'])}%)",
        f"  gen dry-patch:   {f0(s['genDryPatchMs'])}ms ({pct(s['genDryPatchMs'])}%)",
        f"topUp total:       {f0(s['topUpMs'])}ms ({pct(s['topUpMs'])}%)",
    ]
    for i, ms in enumerate(s["topUpPassMs"]):
        lines.append(f"  pass {i + 1}:        {f0(ms)}ms ({pct(ms)}%)")
    lines += [
        f"  hardStarts:      {f0(s['topUpHardStartsMs'])}ms ({pct(s['topUpHardStartsMs'])}%)",
        f"  dryPatch:        {f0(s['topUpDryPatchMs'])}ms ({pct(s['topUpDryPatchMs'])}%)",
        f"  grid+proximity:  {f0(s['topUpGridProxMs'])}ms ({pct(s['topUpGridProxMs'])}%)",
        f"traceRiver:        {f0(s['traceRiverMs'])}ms ({pct(s['traceRiverMs'])}%) ×{s['traceRiverCalls']}",
        f"aStarRiverToSea:   {f0(s['aStarMs'])}ms ({pct(s['aStarMs'])}%) ×{s['aStarCalls']}",
        f"forceFill:         ×{s['forceFillCalls']}",
        f"rivers subtotal:   {f0(river)}ms",
    ]
    return "\n".join(lines)


def morse_connected(hx, w, h):
    # oceanConnectedMorseKeys (:4063): tylko Morze (nie plytka) polaczone z krawedzia
    conn = set()
    queue = []
    for r in range(h):
        for q in range(w):
            if q != 0 and r != 0 and q != w - 1 and r != h - 1:
                continue
            k = key(q, r)
            if k in hx and hx[k]["teren"] == "morze":
                conn.add(k)
                queue.append(k)
    while queue:
        k = queue.pop()
        q, r = parse(k)
        for dq, dr in DIRS:
            nk = key(q + dq, r + dr)
            if nk in hx and hx[nk]["teren"] == "morze" and nk not in conn:
                conn.add(nk)
                queue.append(nk)
    return conn


def audit(hx, w, h):
    # auditMapTerrainData (:5121) z findInlandSeaHexes (:4123) i countOpenOceanLandSpecks (:5006)
    by = {}
    for v in hx.values():
        by[v["teren"]] = by.get(v["teren"], 0) + 1
    mconn = morse_connected(hx, w, h)
    inland = [k for k, v in hx.items() if v["teren"] == "morze" and k not in mconn]
    iset = set(inland)
    visited = set()
    comps = 0
    for start in inland:
        if start in visited:
            continue
        comps += 1
        stack = [start]
        visited.add(start)
        while stack:
            cur = stack.pop()
            q, r = parse(cur)
            for dq, dr in DIRS:
                nk = key(q + dq, r + dr)
                if nk in visited or nk not in iset:
                    continue
                visited.add(nk)
                stack.append(nk)
    specks = 0
    for k, v in hx.items():
        if v["teren"] in WATER:
            continue
        q, r = parse(k)
        dry = 0
        for dq, dr in DIRS:
            nh = hx.get(key(q + dq, r + dr))
            if nh is None:
                continue
            if nh["teren"] not in WATER:
                dry += 1
        if dry == 0:
            specks += 1
    return {"totalHexes": len(hx), "byTeren": by, "openOceanLandSpecks": specks,
            "enclosedInlandMorzeHexes": len(inland), "enclosedInlandMorzeComponents": comps}


def main():
    walk = json.load(open(sys.argv[1], encoding="utf-8"))
    grow_doc = json.load(open(sys.argv[2], encoding="utf-8"))
    counts, fails = {}, []

    def check(kind, ok, info):
        counts[kind] = counts.get(kind, 0) + 1
        if not ok:
            fails.append((kind, str(info)[:300]))

    # ---- partia 2 (uzupelnienie): drainStep, drainGoal, pathSea, pathSeaEdge ----
    wm = walk["maps"]
    cache = {}

    def fields(doc, m):
        k = (id(doc), m)
        if k not in cache:
            hx = load_hexes(doc["maps"][m]["rows"])
            w, h = doc["maps"][m]["w"], doc["maps"][m]["h"]
            oc = ocean_connected(hx, w, h)
            cache[k] = (hx, w, h, oc, sea_dist(hx), open_ocean_dist(hx, oc))
        return cache[k]

    for c in walk["cases"]["drainStep"]:
        hx, w, h, oc, sea, od = fields(walk, c["map"])
        check("drainStep", can_drain_step(c["nk"], c["nd"], od, oc, c["post"]) == c["ret"], c)
    for c in walk["cases"]["drainGoal"]:
        hx, w, h, oc, sea, od = fields(walk, c["map"])
        check("drainGoal", is_drain_goal(c["q"], c["r"], hx, c["src"], oc) == c["ret"], c)
    for c in walk["cases"]["pathSea"]:
        hx = load_hexes(wm[c["map"]]["rows"])
        path = [tuple(p) for p in c["path"]]
        dims = None if c["dims"] is None else tuple(c["dims"])
        check("pathSea", path_ends_at_sea(hx, path, dims) == c["ret"], c)
    for c in walk["cases"]["pathSeaEdge"]:
        hx = load_hexes(wm[c["map"]]["rows"])
        path = [tuple(p) for p in c["path"]]
        dims = None if c["dims"] is None else tuple(c["dims"])
        check("pathSeaEdge", path_ends_at_sea(hx, path, dims) == c["ret"], c)

    # ---- partia 2 (uzupelnienie r5): scoreSquare, scoreLandCenter, audit ----
    for c in walk["cases"]["scoreSquare"]:
        hx = load_hexes(wm[c["map"]]["rows"])
        sq = continent_square(hx, [r[0] for r in wm[c["map"]]["rows"]]) if c["square"] else None
        check("scoreSquare", score_square(c["q"], c["r"], c["nq"], c["nr"], sq) == c["ret"], c)
    for c in walk["cases"]["scoreLandCenter"]:
        hx = load_hexes(wm[c["map"]]["rows"])
        sq = continent_square(hx, [r[0] for r in wm[c["map"]]["rows"]]) if c["square"] else None
        cen = None if c["centroid"] is None else (num(c["centroid"][0]), num(c["centroid"][1]))
        got = score_land_center(c["q"], c["r"], c["nq"], c["nr"], sq, cen)
        check("scoreLandCenter", got == c["ret"], c)
    for c in walk["cases"]["audit"]:
        m = wm[c["map"]]
        got = audit(load_hexes(m["rows"]), m["w"], m["h"])
        check("audit", got == c["ret"], c)

    # ---- partia 3 ----
    gm = grow_doc["maps"]
    gcache = {}

    def gfields(m):
        if m not in gcache:
            hx = load_hexes(gm[m]["rows"])
            w, h = gm[m]["w"], gm[m]["h"]
            oc = ocean_connected(hx, w, h)
            gcache[m] = (hx, sea_dist(hx), open_ocean_dist(hx, oc), oc)
        return gcache[m]

    def key_list(m):
        return [r[0] for r in gm[m]["rows"]]

    def pt(v):
        return None if v is None else (num(v[0]), num(v[1]))

    for c in grow_doc["cases"]["grow"]:
        m = c["map"]
        hx, sea, od, oc = gfields(m)
        square = continent_square(hx, key_list(m)) if c["square"] else None
        block = None if c["block"] is None else set(c["block"])
        rng = Mulberry32(c["seed"])
        p = dict(sq=c["sq"], sr=c["sr"], sea=sea, od=od, target=c["target"], cap=c["cap"], hard=c["hard"],
                 relief=c["allowRelief"], relax_sea=c["relaxSea"], growth_max=c["growthMax"], block=block,
                 min_sep=c["minSep"], centroid=pt(c["centroid"]), square=square)
        got = [[q, r] for q, r in grow(hx, p, rng)]
        check("grow", got == c["ret"], c)

    for c in grow_doc["cases"]["collect"]:
        m = c["map"]
        hx, sea, od, oc = gfields(m)
        square = continent_square(hx, key_list(m)) if c["square"] else None
        block = None if c["block"] is None else set(c["block"])
        path = [tuple(p) for p in c["path"]]
        o = dict(hx=hx, path=path, cur=path[-1], src=c["srcKey"], sea=sea, od=od, centroid=pt(c["centroid"]),
                 square=square, block=block, min_sep=c["minSep"], relief=c["allowRelief"], hard=c["hardMeander"],
                 relax_hard=c["relaxHard"], relax_sea=c["relaxSea"])
        got = collect(o, Mulberry32(c["seed"]))
        want = [(t[0], t[1], num(t[2])) for t in c["ret"]]
        ok = len(got) == len(want) and all(
            g[0] == w[0] and g[1] == w[1] and (g[2] == w[2]) for g, w in zip(got, want))
        check("collect", ok, c)

    for c in grow_doc["cases"]["nearest"]:
        keys = c["keys"]
        idx = Index(keys)
        check("nearestIndexSize", idx.n == c["indexSize"], c)
        check("nearestBrute", numS(nearest_dist(c["sq"], c["sr"], set(keys))) == c["brute"], c)
        check("nearestIndexed", numS(nearest_dist(c["sq"], c["sr"], set(keys), idx)) == c["indexed"], c)

    for c in grow_doc["cases"]["sep"]:
        keys = set(c["keys"])
        idx = Index(c["keys"])
        check("sep", sep_ok(c["nq"], c["nr"], keys, c["minSep"]) == c["ret"], c)
        check("sepIndexed", sep_ok(c["nq"], c["nr"], keys, c["minSep"], idx) == c["retIndexed"], c)

    for c in grow_doc["cases"]["indexAdd"]:
        check("indexAdd", Index(c["keys"]).n == c["size"], c)

    for c in grow_doc["cases"]["window"]:
        path = [tuple(p) for p in c["path"]]
        for s in c["steps"]:
            check("window", window_allowed(path, s["nq"], s["nr"]) == s["ret"], c)
        seg = segment_dirs(path)
        check("segDirs", seg == c["segDirs"], c)
        check("turnDeltas", turn_deltas(seg) == c["turnDeltas"], c)

    for c in grow_doc["cases"]["dirs"]:
        if c["kind"] == "neighbor":
            check("neighborDir", dir_index(0, 0, c["a"], c["b"]) == c["ret"], c)
        else:
            check("signedDelta", signed_delta(c["a"], c["b"]) == c["ret"], c)

    big = grow_doc["meta"]["bigMapIndex"]
    bhx = load_hexes(gm[big]["rows"])
    check("bigMapSize", len(bhx) == 8000, len(bhx))
    for c in grow_doc["cases"]["bigCap"]:
        got = estimate_centroid(bhx, c["sq"], c["sr"], False, c["cap"])
        want = None if c["ret"] is None else (num(c["ret"][0]), num(c["ret"][1]))
        check("bigCap", got == want, c)

    for c in grow_doc["cases"]["toFixed"]:
        check("toFixed", js_to_fixed(num(c["x"]), c["d"]) == c["ret"], c)

    for c in grow_doc["cases"]["profile"]:
        check("profile", fmt_profile(c["stats"], c["total"]) == c["ret"], c)

    per = {}
    for kind, _ in fails:
        per[kind] = per.get(kind, 0) + 1
    print(json.dumps({"checked": counts, "fails": len(fails), "fails_per_kind": per}))
    for kind, info in fails[:8]:
        print("FAIL", kind, info)
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
