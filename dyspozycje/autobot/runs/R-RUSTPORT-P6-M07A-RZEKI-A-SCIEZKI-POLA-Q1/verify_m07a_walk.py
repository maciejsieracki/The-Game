# Niezalezny weryfikator partii 2 (P6.M07A): stdlib, napisany OD ZERA z TS pinu edb8fb56
# (gen-helpers.ts :5121-5168, :5580-5611, :5781-5900, :5974-6067). Nie czyta Rusta.
# Sprawdza funkcje samodzielne wzgledem wektorow (kierunki, delty, rekonstrukcja, scoring
# centroidu i kwadratu bez kwadratu, wymiary, zrodla rzek, BFS centroidu z capem).
# Uzycie: python3 verify_m07a_walk.py <WEKTORY.json>
import json, sys

VEC = sys.argv[1]
doc = json.load(open(VEC, encoding="utf-8"))
maps, cases = doc["maps"], doc["cases"]

RELIEF = {"gory", "wzgorza"}                       # isReliefTerrain
RIVER_LAND = {"laka", "rownina", "wzgorza", "gory", "pustynia", "polarny"}  # isRiverLandTerrain
DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]  # HEX_DIRECTIONS

def key(q, r):
    return f"{q},{r}"

def parse(k):
    a, b = k.split(",")
    return int(a), int(b)

def build(m):
    # wiersz: [klucz, teren, nakladka, zloze, rzekaObecna, krawedzie]
    return {row[0]: {"teren": row[1], "rzeka": row[4] == 1} for row in maps[m]["rows"]}

def can_flow(hx, k, source, allow_relief):
    # canRiverFlowThrough(hex, cellKey, sourceKey, blockExisting=false, allowKey=undefined, allow)
    if hx is None or hx["teren"] == "morze":
        return False
    if hx["teren"] in RELIEF and not allow_relief:
        return k == source
    return True

def centroid_seed(hx, mq, mr, allow, cap):
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
            if not can_flow(hx.get(nk), nk, mouth, allow):
                continue
            seen.add(nk)
            queue.append(nk)
    if cnt == 0:
        return None
    return (sq / cnt, sr / cnt)

def ser(c):
    return None if c is None else [repr_js(c[0]), repr_js(c[1])]

def repr_js(x):
    # JS String(number): liczby calkowite bez ".0"; reszta najkrotsza reprezentacja.
    if float(x).is_integer():
        return str(int(x))
    return repr(float(x))

def dist_f(q1, r1, q2, r2):
    dq, dr = q1 - q2, r1 - r2
    return (abs(dq) + abs(dr) + abs(dq + dr)) / 2

def score_centroid(q, r, nq, nr, c):
    if c is None:
        return 0
    cd = dist_f(q, r, c[0], c[1])
    nd = dist_f(nq, nr, c[0], c[1])
    if nd < cd:
        return 22
    if nd > cd:
        return -12
    return 3

fails = []
counts = {}

def check(kind, ok, info):
    counts[kind] = counts.get(kind, 0) + 1
    if not ok:
        fails.append((kind, info))

for c in cases["dirs"]:
    fq, fr = c["from"]; tq, tr = c["to"]
    check("dirs", [tq - fq, tr - fr] == c["ret"], c)

for c in cases["dirDelta"]:
    v = ((c["next"] - c["last"]) % 6 + 6) % 6   # JS % ma znak dzielnej, ale +6 %6 normalizuje
    check("dirDelta", v == c["ret"], c)

for c in cases["sameDir"]:
    check("sameDir", (c["a"] == c["b"]) == c["ret"], c)

for c in cases["reconstruct"]:
    came = dict((ch, pa) for ch, pa in c["pairs"])
    path = []
    cur = c["end"]
    while cur is not None:
        path.append(list(parse(cur)))
        cur = came.get(cur)
    path.reverse()
    check("reconstruct", path == c["ret"], c)

for c in cases["reliefSource"]:
    check("reliefSource", (c["terrain"] in RELIEF) == c["ret"], c)

for c in cases["dims"]:
    rows = maps[c["map"]]["rows"]
    mq = max([0] + [parse(r[0])[0] for r in rows])
    mr = max([0] + [parse(r[0])[1] for r in rows])
    check("dims", [mq + 1, mr + 1] == c["ret"], c)

for kind in ("centroidSeed", "centroidMouth"):
    for c in cases[kind]:
        hx = build(c["map"])
        got = centroid_seed(hx, c["mq"], c["mr"], c["allowRelief"], c["cap"])
        check(kind, ser(got) == c["ret"], c)

for c in cases["scoreCentroid"]:
    cen = None if c["centroid"] is None else (float(c["centroid"][0]), float(c["centroid"][1]))
    check("scoreCentroid", score_centroid(c["q"], c["r"], c["nq"], c["nr"], cen) == c["ret"], c)

for c in cases["scoreLandCenter"]:
    # Galaz bez kwadratu (square=false): wynik = scoreCentroid.
    if c["square"]:
        continue
    cen = None if c["centroid"] is None else (float(c["centroid"][0]), float(c["centroid"][1]))
    check("scoreLandCenter", score_centroid(c["q"], c["r"], c["nq"], c["nr"], cen) == c["ret"], c)

print(json.dumps({"checked": counts, "fails": len(fails)}))
for kind, info in fails[:5]:
    print("FAIL", kind, json.dumps(info)[:300])
sys.exit(1 if fails else 0)
