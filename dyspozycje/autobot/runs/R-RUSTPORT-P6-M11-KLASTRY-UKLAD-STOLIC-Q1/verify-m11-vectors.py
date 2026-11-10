#!/usr/bin/env python3
"""NIEZALEZNY weryfikator P6.M11.

Reimplementuje w Pythonie logike ukladu stolic klastrow z KODU TS (specyfikacja: clusters.ts
:1351-1537, :1553-1769, :1801-1846, :2166-3361, pin edb8fb56), BEZ wykonywania TS, BEZ generatora,
BEZ Rust, i porownuje wynik z wektorami z uruchomionego weba (tests/p6_m11_vectors/web-vectors.json).
Dodatkowo:
  - wyciaga regexem z TS (po numerach linii pinu) literaly i stale i porownuje je z tabela
    `data/derived/mapgen-cluster-layout.json` (oraz sprawdza obecnosc stalych algorytmicznych),
  - korzysta z NIEZALEZNYCH weryfikatorow zaleznosci (M10: masy/bramki/wybory/TimSort V8; M09:
    pakowanie miast-panstw), uruchamianych BEZ ZMIAN (`dep-verify-m10-vectors.py`,
    `dep-verify-m09-vectors.py`) - ich wlasne sprawdzenia licza sie do wyniku, a ich funkcje sa
    uzywane jako zaleznosci (te same mapy: wektory M10 i M11 maja identyczne mapy - test w Rust).

Uzycie: verify-m11-vectors.py <WEB_ROOT> <M11_VECTORS> <LAYOUT_TABLE> <M10_VECTORS> <M10_MASS_TABLE>
                              <M10_START_TABLE> <M09_VECTORS> <M09_MAPS> <M09_TABLE>
Kod wyjscia: 0 = 0 rozbieznosci (razem z zaleznosciami).
"""
import io
import json
import math
import os
import re
import sys
import contextlib

(web_root, vec_path, layout_tbl_path, m10_vec, m10_mass_tbl, m10_start_tbl, m09_vec, m09_maps, m09_tbl) = sys.argv[1:10]
HERE = os.path.dirname(os.path.abspath(__file__))

# ----------------------------------------------------------------------------------------------
# 0. Zaleznosci: uruchom niezalezne weryfikatory M10 i M09 (bez zmian) i pobierz ich funkcje
# ----------------------------------------------------------------------------------------------
dep_checks = 0
dep_bad = 0


def run_dep(path, argv):
    global dep_checks, dep_bad
    ns = {"__name__": "dep", "__file__": path}
    old_argv = sys.argv
    sys.argv = [path] + argv
    out = io.StringIO()
    code = None
    try:
        with contextlib.redirect_stdout(out):
            exec(compile(open(path, encoding="utf-8").read(), path, "exec"), ns)
    except SystemExit as e:
        code = e.code
    finally:
        sys.argv = old_argv
    dep_checks += ns["checks"]
    dep_bad += ns["bad"]
    print(f"[zaleznosc] {os.path.basename(path)}: sprawdzen {ns['checks']}, rozbieznosci {ns['bad']}, exit {code}")
    if ns["bad"]:
        print(out.getvalue()[-2000:])
    return ns


N10 = run_dep(os.path.join(HERE, "dep-verify-m10-vectors.py"), [web_root, m10_vec, m10_mass_tbl, m10_start_tbl])
N09 = run_dep(os.path.join(HERE, "dep-verify-m09-vectors.py"), [web_root, m09_vec, m09_maps, m09_tbl])

V = json.load(open(vec_path, encoding="utf-8"))
LT = json.load(open(layout_tbl_path, encoding="utf-8"))
CL = open(f"{web_root}/gra/src/map/clusters.ts", encoding="utf-8").read().split("\n")
CASES = V["cases"]

checks = 0
bad = 0


def check(cond, msg):
    global checks, bad
    checks += 1
    if not cond:
        bad += 1
        if bad <= 40:
            print("ROZBIEZNOSC:", msg)


# funkcje i obiekty z zaleznosci (M10)
bits = N10["bits"]
vf = N10["vf"]
same = N10["same"]
js_or = N10["js_or"]
Rand = N10["Rand"]
v8_sort = N10["v8_sort"]
stable_sort = N10["stable_sort"]
hd4 = N10["hd"]  # hd(aq, ar, bq, br)
GMap = N10["GMap"]
Cache = N10["Cache"]
MAPS = N10["MAPS"]
CACHES = N10["CACHES"]
MASSES = N10["MASSES"]
ladowe_of = N10["ladowe_of"]
local_land = N10["local_land"]
dev_space = N10["dev_space"]
passes_local = N10["passes_local"]
passes_player = N10["passes_player"]
mk_cand = N10["mk_cand"]
sort_spawn = N10["sort_spawn"]
sort_spread = N10["sort_spread"]
pick_tied = N10["pick_tied"]
pick_player = N10["pick_player"]
pick_best_local = N10["pick_best_local"]
pick_center_spread = N10["pick_center_spread"]
allocate = N10["allocate"]
qualifies = N10["qualifies"]
fnv = N10["fnv"]
digest = N10["digest"]
HL = N10["HL"]
H = N10["H"]
DIRS = N10["DIRS"]
# funkcje z zaleznosci (M09)
around_capital = N09["around_capital"]
shuffle9 = N09["shuffle"]
axis_for = N09["axis_for"]
buffer_gate = N09["buffer_gate"]

for mid in MAPS:
    pass
# mapy M11 == mapy M10 (te same specyfikacje generateMap i ziarna) - jawny test:
for mid, rep in V["maps"].items():
    gm = MAPS[mid]
    check(gm.w == rep["w"] and gm.h == rep["h"], f"mapa {mid} rozmiar")
    check("".join({"morze": "m", "plytkie_morze": "p", "laka": "l", "rownina": "r", "wzgorza": "w", "gory": "g", "pustynia": "u", "polarny": "o"}[gm.t[h]] for h in gm.order) == rep["terrain"], f"mapa {mid} teren")


def hd(a, b):
    return hd4(a[0], a[1], b[0], b[1])


# ----------------------------------------------------------------------------------------------
# 1. Literaly z TS vs tabela silnika (regex po zrodle, numery linii z pinu)
# ----------------------------------------------------------------------------------------------
def line(n):
    return CL[n - 1]


NUM = r"(-?\d+(?:\.\d+)?)"


def num(rx, text):
    m = re.search(rx, text)
    check(m is not None, f"regex {rx} nie pasuje do: {text}")
    return float(m.group(1)) if m else None


LABELS = ["mala", "srednia", "duza", "ogromna", "super"]


def lut(first, key_rx_unused=None):
    out = {}
    for k, ln in enumerate(range(first, first + 5)):
        m = re.search(r"(\w+): (\d+),", line(ln))
        check(m is not None and m.group(1) == LABELS[k], f"LUT :{ln}")
        out[LABELS[k]] = int(m.group(2)) if m else None
    return out


MIN_SEA = lut(1372)
SEP = lut(1472)
for lbl in LABELS:
    check(MIN_SEA[lbl] == LT["morze_stolicy"]["min_odleglosc_od_morza"][lbl]["wartosc"], f"tabela minSea {lbl}")
    check(SEP[lbl] == LT["separacja_stolic"]["min_odstep"][lbl]["wartosc"], f"tabela sep {lbl}")
BAND = int(num(r"capitalMinSeaDist\(rozmiar\) \+ " + NUM, line(1386)))
check(BAND == LT["morze_stolicy"]["szerokosc_pasa"]["wartosc"], "tabela szerokosc pasa")
for ln in (1459, 1719, 2244, 2255):
    check(int(num(r"[+] " + NUM, line(ln))) == BAND, f"szerokosc pasa :{ln}")
SHORT = int(num(r"short < " + NUM, line(1401)))
for ln in (1411, 1491, 1518, 1528):
    check(int(num(r"short < " + NUM, line(ln))) == SHORT, f"krotszy bok :{ln}")
check(SHORT == LT["morze_stolicy"]["min_krotszy_bok_mapy"]["wartosc"], "tabela krotszy bok")
PEN_LOW = num(r"return " + NUM + r" \+ \(lo - sea\)", line(1460))
PEN_HIGH = num(r"return " + NUM + r" \+ \(sea - hi\)", line(1461))
check(PEN_LOW == LT["morze_stolicy"]["kara_ponizej_pasa"]["wartosc"], "tabela kara ponizej")
check(PEN_HIGH == LT["morze_stolicy"]["kara_powyzej_pasa"]["wartosc"], "tabela kara powyzej")
PLACE_ADD = int(num(r"capitalMinSeparation\(rozmiar\) \+ " + NUM, line(1509)))
check(PLACE_ADD == LT["separacja_stolic"]["dodatek_odstepu_srodkow"]["wartosc"], "tabela dodatek srodkow")
L1 = num(r"Math\.ceil\(minSeaDist \* " + NUM + r"\)", line(1682))
L2 = num(r"Math\.ceil\(minSeaDist \* " + NUM + r"\)", line(1683))
L3 = num(r"Math\.floor\(minSeaDist \* " + NUM + r"\)", line(1684))
LFLOOR = num(r"Math\.max\(" + NUM + r", ", line(1682))
for ln in (1683, 1684):
    check(num(r"Math\.max\(" + NUM + r", ", line(ln)) == LFLOOR, f"drabinka dolna granica :{ln}")
check(line(1685).strip() == f"{int(LFLOOR)},", "drabinka stopien przedostatni :1685")
check(line(1686).strip().startswith("0,"), "drabinka ostatni stopien 0 :1686")
LR = LT["ratunek_morza"]
check(L1 == LR["mnoznik_ceil_pierwszy"]["wartosc"] and L2 == LR["mnoznik_ceil_drugi"]["wartosc"] and L3 == LR["mnoznik_floor"]["wartosc"], "tabela mnozniki drabinki")
check(LFLOOR == LR["dolna_granica_stopnia"]["wartosc"], "tabela dolna granica drabinki")
QSTEPS = []
for ln in (1580, 1581, 1582):
    m = re.search(r"nNeeded >= (\d+)\) return (\d+);", line(ln))
    check(m is not None, f"progi cwiartek :{ln}")
    QSTEPS.append((int(m.group(1)), int(m.group(2))) if m else None)
QELSE = int(num(r"return " + NUM + r";", line(1583)))
tq = LT["cwiartki"]
check([(s["od_liczby_typow"], s["min_cwiartek"]) for s in tq["progi_minimum"]] == QSTEPS, "tabela progi cwiartek")
check(QELSE == tq["w_przeciwnym_razie_min_cwiartek"]["wartosc"], "tabela cwiartki else")
PREF_MIN = int(num(r"nNeeded < " + NUM, line(1593)))
BIAS_MIN = int(num(r"spreadN >= " + NUM, line(1758)))
ENF_MIN_N = int(num(r"nNeeded < " + NUM, line(3259)))
ENF_MIN_K = int(num(r"klastry\.length < " + NUM, line(3259)))
ENF_ITERS = int(num(r"iter < " + NUM, line(3265)))
ENF_CAPS_MIN = int(num(r"caps\.length < " + NUM, line(3271)))
ENF_LOAD = int(num(r"maxLoad <= " + NUM, line(3287)))
ENF_LOAD2 = int(num(r"counts\[oldQuad\]! <= " + NUM, line(3329)))
check(PREF_MIN == tq["min_typow_preferencji"]["wartosc"], "tabela pref min")
check(BIAS_MIN == tq["min_typow_biasu_wyboru_hexu"]["wartosc"], "tabela bias min")
check(ENF_MIN_N == tq["wyrownanie_min_typow"]["wartosc"], "tabela wyrownanie min typow")
check(ENF_MIN_K == tq["wyrownanie_min_klastrow"]["wartosc"] and ENF_CAPS_MIN == ENF_MIN_K, "tabela wyrownanie min klastrow")
check(ENF_ITERS == tq["wyrownanie_max_iteracji"]["wartosc"], "tabela wyrownanie iteracje")
check(ENF_LOAD == tq["wyrownanie_min_obciazenie"]["wartosc"] and ENF_LOAD2 == ENF_LOAD, "tabela wyrownanie obciazenie")
JITTER = num(r"rand\(\) \* " + NUM + r";", line(2261))
ATTEMPTS = int(num(r"attempt < " + NUM, line(2616)))
check(JITTER == LT["wybor_stolicy"]["waga_losowego_rozstrzygniecia"]["wartosc"], "tabela jitter")
check(ATTEMPTS == LT["wybor_stolicy"]["proby_ladu"]["wartosc"], "tabela proby")
PO_MIN = int(num(r"picked\.length < " + NUM, line(1835)))
PO_LUZ = int(num(r"minDist - " + NUM, line(1836)))
check(PO_MIN == LT["poisson"]["min_wybranych_przed_luzem"]["wartosc"], "tabela poisson min")
check(PO_LUZ == LT["poisson"]["luz_odstepu"]["wartosc"], "tabela poisson luz")
G_HARD = int(num(r"klastry\.length \* " + NUM, line(2693)))
G_BODY = int(num(r"klastry\.length \* " + NUM, line(3055)))
check(G_HARD == LT["straznicy"]["twarda_separacja_mnoznik"]["wartosc"], "tabela straznik twarda")
check(G_BODY == LT["straznicy"]["separacja_bryl_mnoznik"]["wartosc"], "tabela straznik bryly")
LOOSE_DIV = int(num(r"bufferRadius / " + NUM, line(2892)))
LOOSE_MIN_FLOOR = int(num(r"Math\.max\(" + NUM + r", minDist", line(2894)))
LOOSE_MIN_SUB = int(num(r"minDist - " + NUM, line(2894)))
m = re.search(r"\[CLUSTER_CITY_STATE_MAX_HEX, (\d+), (\d+), (\d+)\]", line(2908))
check(m is not None, "pierscienie ratunkowe :2908")
RINGS_AFTER = [int(x) for x in m.groups()] if m else []
m = re.search(r"ringDistances: \[(\d+), (\d+)\]", line(2932))
check(m is not None, "pierscienie ostateczne :2932")
RINGS_DESP = [int(x) for x in m.groups()] if m else []
DESP_MIN = int(num(NUM + r",", line(2926)))
RP = LT["repack"]
check(LOOSE_DIV == RP["luzny_bufor_dzielnik"]["wartosc"], "tabela repack dzielnik")
check(LOOSE_MIN_FLOOR == RP["luzny_min_dystans_dolny"]["wartosc"], "tabela repack dolny")
check(LOOSE_MIN_SUB == RP["luzny_min_dystans_odjecie"]["wartosc"], "tabela repack odjecie")
check(RINGS_AFTER == RP["pierscienie_po_maksymalnym"]["wartosc"], "tabela pierscienie po max")
check(RINGS_DESP == RP["pierscienie_ostateczne"]["wartosc"], "tabela pierscienie ostateczne")
check(DESP_MIN == RP["ostateczny_min_dystans"]["wartosc"], "tabela desperate minDist")
# stale algorytmiczne (nazwane const w Rust): obecnosc w TS
for ln in (2779, 2873, 3138, 3340):
    check("0x9e3779b1" in line(ln), f"mnoznik ziarna ki :{ln}")
check("0x85ebca6b" in line(2901), "mnoznik luzny :2901")
check("0xc2b2ae35" in line(2927), "mnoznik desperate :2927")
check("(seed + 17)" in line(2910), "przesuniecie osi +17 :2910")
check("seed = 42" in line(2280), "domyslne ziarno layoutu :2280")
check("seed ?? 42" in line(2335), "domyslne ziarno buildClusterCities :2335")
# stale M09 uzywane przez M11 (nie kopiujemy: czytamy z TS)
MAX_HEX = int(num(r"CLUSTER_CITY_STATE_MAX_HEX = " + NUM + r";", line(47)))
MIN_START = int(num(r"CLUSTER_CITY_STATE_MIN_HEX = " + NUM + r";", line(42)))
RESERVE = int(num(r"CLUSTER_GROWTH_RESERVE = " + NUM + r";", line(58)))
check("MIN_DIST_START_CITY_STATE = CLUSTER_CITY_STATE_MIN_HEX;" in line(49), "alias :49")
check("MIN_DIST_FOREIGN_IN_CLUSTER = MIN_DIST_START_CITY_STATE;" in line(56), "alias :56")
FOREIGN_IN = MIN_START
M32 = 0xFFFFFFFF


# ----------------------------------------------------------------------------------------------
# 2. Reimplementacja logiki M11 (z kodu TS jako specyfikacji)
# ----------------------------------------------------------------------------------------------
def js_max(a, b):
    if (isinstance(a, float) and math.isnan(a)) or (isinstance(b, float) and math.isnan(b)):
        return math.nan
    if a == 0 and b == 0:
        pa = math.copysign(1, a) > 0 if isinstance(a, float) else True
        pb = math.copysign(1, b) > 0 if isinstance(b, float) else True
        return a if pa else b
    return a if a > b else b


def is_nan(x):
    return isinstance(x, float) and math.isnan(x)


def cap_min_sea(lbl):
    return MIN_SEA[lbl]


def cap_max_sea(lbl):
    return cap_min_sea(lbl) + BAND


def for_map(fn, lbl, w, h):
    return 0 if min(w, h) < SHORT else fn(lbl)


def body_buffer(s):
    if not math.isfinite(s) or s <= 0:
        return 0
    return math.ceil(s / 2)


def sea_at_map(gm, q, r):
    return gm.sea.get((q, r), 0)


def band_gate(gm, q, r, mn, mx):
    d = sea_at_map(gm, q, r)
    if mn > 0 and d < mn:
        return False
    if mx > 0 and d > mx:
        return False
    return True


def penalty(sea, mn, mx):
    if not (mn > 0) and not (mx > 0):
        return 0
    lo = js_max(0, mn)
    hi = mx if mx > 0 else lo + BAND
    if sea < lo:
        return PEN_LOW + (lo - sea)
    if sea > hi:
        return PEN_HIGH + (sea - hi)
    ideal = (lo + hi) / 2
    return abs(sea - ideal)


def quad_idx(q, r, midq, midr):
    east = 1 if q >= midq else 0
    south = 1 if r >= midr else 0
    return east + south * 2


def count_quads(centers, midq, midr):
    c = [0, 0, 0, 0]
    for h in centers:
        c[quad_idx(h[0], h[1], midq, midr)] += 1
    return c


def min_quarters(n):
    for thr, v in QSTEPS:
        if n >= thr:
            return v
    return QELSE


def preferred(counts, n):
    if n < PREF_MIN:
        return None
    required = min_quarters(n)
    occupied = len([c for c in counts if c > 0])
    empty = [q for q in range(4) if counts[q] == 0]
    if occupied < required and len(empty) > 0:
        return empty
    mc = min(counts)
    return [q for q in range(4) if counts[q] == mc]


def quad_spread(centers, bbox):
    if not centers:
        return (0, 0, 0)
    midq = (bbox["minQ"] + bbox["maxQ"]) / 2
    midr = (bbox["minR"] + bbox["maxR"]) / 2
    quads = set()
    mnq, mxq, mnr, mxr = math.inf, -math.inf, math.inf, -math.inf
    for c in centers:
        quads.add(quad_idx(c[0], c[1], midq, midr))
        mnq = min(mnq, c[0])
        mxq = max(mxq, c[0])
        mnr = min(mnr, c[1])
        mxr = max(mxr, c[1])
    return (len(quads), mxq - mnq, mxr - mnr)


def sep_gate(c, prior, min_sep):
    if not math.isfinite(min_sep) or min_sep <= 0 or len(prior) == 0:
        return True
    return all(hd(c, p) >= min_sep for p in prior)


def min_sep_dist(c, others):
    if not others:
        return None
    best = math.inf
    for p in others:
        d = hd(c, p)
        if d < best:
            best = d
    return best


def ladder(m):
    if not math.isfinite(m) or m <= 0:
        return [0]
    steps = [m, js_max(LFLOOR, math.ceil(m * L1)), js_max(LFLOOR, math.ceil(m * L2)), js_max(LFLOOR, math.floor(m * L3)), LFLOOR, 0]
    out = []
    for s in steps:
        if s not in out:
            out.append(s)
    return out


def fo(x):
    return None if x is None else list(x)


def FV(t):
    return vf(t)


# --- czyste stale / funkcje liczbowe ---
for c in CASES["byLabel"]:
    l = c["label"]
    check(cap_min_sea(l) == c["minSea"] and cap_max_sea(l) == c["maxSea"], f"byLabel sea {l}")
    check(SEP[l] == c["minSep"] and SEP[l] == c["bodySep"] and SEP[l] + PLACE_ADD == c["placementSep"], f"byLabel sep {l}")
check(MAX_HEX == CASES["radius"]["cityStateRadius"], "clusterCityStateRadius")
for c in CASES["hubReach"]:
    n = max(1, c["n"] + RESERVE)
    check(MAX_HEX * n == c["reach"] and c["reach"] == c["cohesion"], f"hubReach {c['n']}")
for c in CASES["forMap"]:
    l, w, h = c["label"], c["w"], c["h"]
    check(for_map(cap_min_sea, l, w, h) == c["minSea"], f"forMap minSea {c}")
    check(for_map(cap_max_sea, l, w, h) == c["maxSea"], f"forMap maxSea {c}")
    check(for_map(lambda x: SEP[x], l, w, h) == c["minSep"] == c["bodySep"], f"forMap sep {c}")
    check(for_map(lambda x: SEP[x] + PLACE_ADD, l, w, h) == c["placementSep"], f"forMap placement {c}")
for c in CASES["bodyBuffer"]:
    check(same(body_buffer(FV(c["s"])), FV(c["result"])), f"bodyBuffer {c}")
for c in CASES["seaGates"]:
    gm = MAPS[c["map"]]
    q, r, mn, mx = c["q"], c["r"], FV(c["min"]), FV(c["max"])
    check(same(sea_at_map(gm, q, r), FV(c["at"])), f"seaDistAt {c}")
    check((sea_at_map(gm, q, r) >= mn) == c["gate"], f"seaGate {c}")
    check(band_gate(gm, q, r, mn, mx) == c["band"], f"seaBand {c}")
for c in CASES["bandPenalty"]:
    check(same(penalty(FV(c["sea"]), FV(c["min"]), FV(c["max"])), FV(c["result"])), f"bandPenalty {c}")
for c in CASES["quadrant"]:
    check(quad_idx(c["q"], c["r"], FV(c["midQ"]), FV(c["midR"])) == c["result"], f"quadrant {c}")
for c in CASES["minQuarters"]:
    check(min_quarters(c["n"]) == c["result"], f"minQuarters {c}")
for c in CASES["countPerQuad"]:
    check(count_quads(HL(c["centers"]), FV(c["midQ"]), FV(c["midR"])) == c["result"], "countPerQuad")
for c in CASES["spreadQuad"]:
    s = quad_spread(HL(c["centers"]), c["bbox"])
    check(s[0] == c["occupied"] and same(s[1], FV(c["qSpan"])) and same(s[2], FV(c["rSpan"])), f"spreadQuad {c}")
for c in CASES["minSepGate"]:
    check(sep_gate(H(c["c"]), HL(c["prior"]), FV(c["minSep"])) == c["result"], f"minSepGate {c}")
for c in CASES["minSepDist"]:
    m = min_sep_dist(H(c["c"]), HL(c["others"]))
    check((m is None and c["result"] is None) or (m is not None and c["result"] is not None and same(m, FV(c["result"]))), f"minSepDist {c}")
for c in CASES["preferredQuads"]:
    p = preferred(c["counts"], c["n"])
    check(p == c["result"], f"preferredQuads {c}")
for c in CASES["ladder"]:
    got = ladder(FV(c["min"]))
    want = [FV(x) for x in c["result"]]
    check(len(got) == len(want) and all(same(a, b) for a, b in zip(got, want)), f"ladder {c}")


# --- pickSpawnHexWithCapitalGates (clusters.ts:1697) ---
def pick_spawn(gm, cache, pool, mapcenter, rand, o):
    use_sea = o["useSea"]
    min_sea = o["minSea"]
    max_sea = o["maxSea"] if o["maxSea"] is not None else (min_sea + BAND if min_sea > 0 else 0)
    prior = HL(o["prior"])
    min_sep = o["minSep"]
    bbox = o["bbox"]
    spread_n = o["spreadN"]
    steps = ladder(min_sea) if o["progressive"] else [min_sea]
    for sea_min in steps:

        def passes(h):
            if o["reqLocal"] and not passes_local(gm, h[0], h[1]):
                return False
            if o["reqPlayer"] and not passes_player(gm, cache, h[0], h[1]):
                return False
            if use_sea and sea_min > 0 and not (sea_at_map(gm, h[0], h[1]) >= sea_min):
                return False
            if not sep_gate(h, prior, min_sep):
                return False
            return True

        pref = H(o["preferred"]) if o["preferred"] else None
        if pref and passes(pref):
            if (not use_sea) or max_sea <= 0 or sea_min < min_sea or band_gate(gm, pref[0], pref[1], sea_min, max_sea):
                return pref
        cands = [mk_cand(gm, cache, h, use_sea, sea_min) for h in pool if passes(h)]
        if not cands:
            continue
        band_max = max_sea if (sea_min >= min_sea and max_sea > 0) else 0
        if band_max > 0:
            inb = [c for c in cands if c["sea"] <= band_max]
            if inb:
                cands = inb
        mx = band_max or max_sea
        if bbox and spread_n and spread_n >= BIAS_MIN and len(prior) > 0:
            cands = sort_spread(cands, mapcenter, prior, bbox, spread_n, False, sea_min, mx)
        else:
            cands = sort_spawn(cands, mapcenter, False, sea_min, mx)
        picked = pick_tied(cands, rand)
        return picked if picked is not None else cands[0]["h"]
    return None


PS_STATS = {"some": 0, "none": 0}
for c in CASES["pickSpawn"] + CASES["pickSpawnExtra"]:
    gm = MAPS[c["map"]]
    pool = ladowe_of(gm) if c["pool"] is None else HL(c["pool"])
    rand = Rand(c["seed"])
    mc = ((gm.w - 1) / 2, (gm.h - 1) / 2)
    got = pick_spawn(gm, CACHES[c["map"]], pool, mc, rand, c)
    check(fo(got) == c["result"] and rand.n == c["randCalls"], f"pickSpawn {c['map']} seed={c['seed']}")
    PS_STATS["some" if got else "none"] += 1


# --- poissonPickCities, centroidOf, isFarEnough ---
def shuffle_with(arr, rand):
    for i in range(len(arr) - 1, 0, -1):
        j = math.floor(rand() * (i + 1))
        arr[i], arr[j] = arr[j], arr[i]


def poisson(region, max_miast, min_dist, rand, anchor, anchor_val, exclude):
    sh = list(region)
    shuffle_with(sh, rand)
    picked = []
    a_min = anchor_val if anchor_val is not None else 0

    def too_close(c, limit):
        if exclude is not None and c == exclude:
            return True
        if anchor is not None and hd(c, anchor) < a_min:
            return True
        return any(hd(c, p) < limit for p in picked)

    for c in sh:
        if len(picked) >= max_miast:
            break
        if not too_close(c, min_dist):
            picked.append(c)
    if len(picked) < PO_MIN and min_dist > MIN_START:
        luz = max(MIN_START, min_dist - PO_LUZ)
        for c in sh:
            if len(picked) >= max_miast:
                break
            if c in picked:
                continue
            if not too_close(c, luz):
                picked.append(c)
    return picked


for c in CASES["poisson"] + CASES["poissonExtra"]:
    rand = Rand(c["seed"])
    got = poisson(HL(c["region"]), c["maxMiast"], c["minDist"], rand, H(c["anchor"]) if c["anchor"] else None, c["anchorVal"], H(c["exclude"]) if c["exclude"] else None)
    check([list(h) for h in got] == c["result"] and rand.n == c["randCalls"], "poisson")


def centroid_of(hexes):
    if not hexes:
        return (0, 0)
    sq = sr = 0
    for h in hexes:
        sq += h[0]
        sr += h[1]
    return (sq / len(hexes), sr / len(hexes))


for c in CASES["centroid"]:
    p = centroid_of(HL(c["list"]))
    check(same(p[0], FV(c["q"])) and same(p[1], FV(c["r"])), "centroidOf")
for c in CASES["farEnough"]:
    got = all(hd(H(c["c"]), o) >= FV(c["minDist"]) for o in HL(c["others"]))
    check(got == c["result"], "isFarEnough")


# --- pickCapitalHexInRegion: sortowanie W MIEJSCU, alias seaPool === region (clusters.ts:2195) ---
def pick_capital(gm, region, blob, rand, use_map, use_sea, min_sea, anchor, prior, min_sep):
    candidates = region
    if anchor:
        filtered = [c for c in candidates if hd(c, (anchor[0], anchor[1])) >= anchor[2]]
        if len(filtered) > 0:
            candidates = filtered
    if use_map:
        gated = [c for c in candidates if passes_local(gm, c[0], c[1])]
        if len(gated) > 0:
            candidates = gated
    if min_sep > 0 and len(prior) > 0:
        sep_gated = [c for c in candidates if sep_gate(c, prior, min_sep)]
        if len(sep_gated) == 0:
            return None
        candidates = sep_gated
    if len(candidates) == 0:
        return None
    sea_pool = candidates
    active = min_sea
    if use_sea and min_sea > 0:
        sea_pool = []
        for sm in ladder(min_sea):
            g = [c for c in candidates if sea_at_map(gm, c[0], c[1]) >= sm]
            if len(g) > 0:
                sea_pool = g
                active = sm
                break
        if len(sea_pool) == 0:
            return None
    band_max = min_sea + BAND if (active >= min_sea and min_sea > 0) else 0
    if band_max > 0 and use_sea:
        inb = [c for c in sea_pool if sea_at_map(gm, c[0], c[1]) <= band_max]
        if len(inb) > 0:
            sea_pool = inb

    def cmp(a, b):
        sa = sea_at_map(gm, a[0], a[1]) if use_sea else 0
        sb = sea_at_map(gm, b[0], b[1]) if use_sea else 0
        if min_sea > 0 or band_max > 0:
            hi = band_max or (min_sea + BAND)
            pa = penalty(sa, active, hi)
            pb = penalty(sb, active, hi)
            if pa != pb:
                return pa - pb
        da = hd4(a[0], a[1], blob[0], blob[1])
        db = hd4(b[0], b[1], blob[0], blob[1])
        jitter = rand() * JITTER
        return js_or(js_or((db + jitter) - (da + jitter), a[0] - b[0]), a[1] - b[1])

    sea_pool[:] = v8_sort(sea_pool, cmp)  # sort() w miejscu - mutuje tez `region`, gdy to ta sama lista
    return sea_pool[0]


def reg_digest(r):
    return {"n": len(r), "fnv": digest(r)}


CHANGED = 0
for c in CASES["pickCapital"] + CASES["pickCapitalExtra"]:
    gm = MAPS[c["map"]]
    region = HL(c["region"])
    before = list(region)
    rand = Rand(c["seed"])
    blob = (FV(c["blob"][0]), FV(c["blob"][1]))
    got = pick_capital(gm, region, blob, rand, c["useMap"], c["useSea"], c["minSea"], c["anchor"], HL(c["prior"]), c["minSep"])
    check(fo(got) == c["result"] and rand.n == c["randCalls"], f"pickCapital {c['map']} seed={c['seed']}")
    check(reg_digest(region) == c["regionAfter"], f"pickCapital regionAfter {c['map']} seed={c['seed']}")
    check((region != before) == c["changed"], "pickCapital changed")
    CHANGED += 1 if region != before else 0


# --- planowanie klastra (clusters.ts:2271-2402) ---
def anchor_dict(a):
    return None if a is None else {"q": a[0], "r": a[1], "minDist": a[2]}


def build_layout(gm, region, centrum, count, min_dist, rand, anchor, growth_reserve, use_map, seed, use_sea, min_sea, prior, min_sep):
    if count < 0:
        return None
    blob = centroid_of(region if len(region) > 0 else [centrum])
    cap = pick_capital(gm, region, blob, rand, use_map, use_sea, min_sea, anchor, prior, min_sep)
    if cap is None:
        return None
    st, gs = around_capital(region, region, cap, count, min_dist, seed if seed is not None else 42, ex=cap, anchor=anchor_dict(anchor), growth=growth_reserve if growth_reserve is not None else RESERVE)
    return {"capital": cap, "state": st, "growth": gs}


def cities_of_layout(l):
    return [[l["capital"][0], l["capital"][1], True]] + [[s[0], s[1], False] for s in l["state"]]


def build_fallback(gm, region, count, min_dist, anchor, seed, use_map, use_sea, min_sea, prior, min_sep):
    pool = region
    if anchor:
        f = [h for h in region if hd(h, (anchor[0], anchor[1])) >= anchor[2]]
        if len(f) > 0:
            pool = f
    if len(pool) == 0:
        return {"cities": [], "pending": [], "growth": None}
    cen = centroid_of(pool)
    cap = pick_capital(gm, pool, cen, lambda: 0, use_map, use_sea, min_sea, anchor, prior, min_sep)
    if cap is None:
        return {"cities": [], "pending": [], "growth": None}
    st, gs = around_capital(pool, pool, cap, count, min_dist, seed, ex=cap, anchor=anchor_dict(anchor), growth=0)
    return {"cities": [[cap[0], cap[1], True]] + [[s[0], s[1], False] for s in st], "pending": st, "growth": gs}


def build_cities(gm, region, centrum, count, min_dist, rand, anchor, seed, use_map, use_sea, min_sea, prior, min_sep):
    lay = build_layout(gm, region, centrum, count, min_dist, rand, anchor, RESERVE, use_map, seed if seed is not None else 42, use_sea, min_sea, prior, min_sep)
    if lay is None:
        return build_fallback(gm, region, count, min_dist, anchor, seed if seed is not None else 42, use_map, use_sea, min_sea, prior, min_sep)
    return {"cities": cities_of_layout(lay), "pending": lay["state"], "growth": lay["growth"]}


def layout_json(l):
    if l is None:
        return None
    return {"capital": list(l["capital"]), "state": [list(s) for s in l["state"]], "growth": fo(l["growth"])}


def cities_json(r):
    return {"cities": r["cities"], "pending": [list(h) for h in r["pending"]], "growth": fo(r["growth"])}


for c in CASES["layout"]:
    gm = MAPS[c["map"]]
    region = HL(c["region"])
    rand = Rand(c["randSeed"])
    got = build_layout(gm, region, H(c["centrum"]), c["count"], c["minDist"], rand, c["anchor"], c["growthReserve"], c["useMap"], c["seed"], c["useSea"], c["minSea"], HL(c["prior"]), c["minSep"])
    check(layout_json(got) == c["result"] and rand.n == c["randCalls"] and reg_digest(region) == c["regionAfter"], f"layout {c['map']} {c['randSeed']}")
    if got:
        check(cities_of_layout(got) == c["cities"], "layoutToClusterCities")

for c in CASES["cities"]:
    gm = MAPS[c["map"]]
    region = HL(c["region"])
    rand = Rand(c["randSeed"])
    got = build_cities(gm, region, H(c["centrum"]), c["count"], c["minDist"], rand, c["anchor"], c["seed"], c["useMap"], c["useSea"], c["minSea"], HL(c["prior"]), c["minSep"])
    check(cities_json(got) == c["result"] and rand.n == c["randCalls"] and reg_digest(region) == c["regionAfter"], f"cities {c['map']} {c['randSeed']}")

for c in CASES["fallback"]:
    gm = MAPS[c["map"]]
    region = HL(c["region"])
    got = build_fallback(gm, region, c["count"], c["minDist"], c["anchor"], c["seed"], c["useMap"], c["useSea"], c["minSea"], HL(c["prior"]), c["minSep"])
    check(cities_json(got) == c["result"] and reg_digest(region) == c["regionAfter"], f"fallback {c['map']} {c['seed']}")


def qualifying_idx(masses):
    if len(masses) == 1:
        return [0]
    lens = [len(m) for m in masses]
    return [i for i in range(len(masses)) if qualifies(lens[i], lens)]


def by_size_desc(masses, idx):
    return stable_sort(list(idx), lambda a, b: len(masses[b]) - len(masses[a]))


def cap_pos(cities, fallback):
    cap = None
    for m in cities:
        if m[2]:
            cap = m
            break
    if cap is None and cities:
        cap = cities[0]
    return (cap[0], cap[1]) if cap else fallback


def alt_center(gm, cache, region, existing, min_cluster_dist, rand, use_sea, min_sea):
    alt = pick_best_local(gm, cache, region, existing, min_cluster_dist, rand, use_sea, min_sea)
    if alt is None:
        masses = cache.masses
        for mi in by_size_desc(masses, qualifying_idx(masses)):
            alt = pick_center_spread(gm, cache, masses[mi], existing, min_cluster_dist, rand, use_sea, min_sea, None, None)
            if alt:
                break
    return alt


def land_gate(gm, cache, region, centrum, count, min_dist, rand, anchor, seed, existing, min_cluster_dist, use_sea, min_sea, prior, min_sep):
    active = centrum
    for _ in range(ATTEMPTS):
        lay = build_cities(gm, region, active, count, min_dist, rand, anchor, seed, True, use_sea, min_sea, prior, min_sep)
        cap = cap_pos(lay["cities"], active)
        land_ok = passes_local(gm, cap[0], cap[1])
        sea_ok = (not use_sea) or min_sea <= 0 or sea_at_map(gm, cap[0], cap[1]) >= min_sea
        sep_ok = sep_gate(cap, prior, min_sep)
        if land_ok and sea_ok and sep_ok:
            return dict(lay, centrum=active)
        nxt = alt_center(gm, cache, region, existing, min_cluster_dist, rand, use_sea, min_sea)
        if not nxt:
            return None
        active = nxt
    return None


for c in CASES["landGate"]:
    gm = MAPS[c["map"]]
    region = HL(c["region"])
    rand = Rand(c["randSeed"])
    got = land_gate(gm, CACHES[c["map"]], region, H(c["centrum"]), c["count"], c["minDist"], rand, c["anchor"], c["seed"], HL(c["existing"]), c["minClusterDist"], c["useSea"], c["minSea"], HL(c["prior"]), c["minSep"])
    want = c["result"]
    gj = None if got is None else dict(cities_json(got), centrum=list(got["centrum"]))
    check(gj == want and rand.n == c["randCalls"] and reg_digest(region) == c["regionAfter"], f"landGate {c['map']} {c['randSeed']}")

for c in CASES["capitalPos"]:
    check(list(cap_pos(c["cities"], H(c["fb"]))) == c["result"], "clusterCapitalPos")


# --- assignTypesToClusterCenters (clusters.ts:2408) ---
def assign_types(centrumy, masses, player, roster, rand):
    index = {}
    for mi, m in enumerate(masses):
        for h in m:
            index[h] = mi
    n_foreign = max(0, len(centrumy) - 1)
    alloc = allocate(n_foreign, [len(m) for m in masses])
    by_mass = {}
    for ci in range(1, len(centrumy)):
        mi = index.get(centrumy[ci])
        if mi is None:
            continue
        by_mass.setdefault(mi, []).append(ci)
    shuffled = list(roster)
    shuffle_with(shuffled, rand)
    keys = {0: player}
    t = [0]

    def take(ci):
        v = shuffled[t[0]] if t[0] < len(shuffled) else f"typ{ci}"
        t[0] += 1
        return v

    for mi in by_size_desc(masses, qualifying_idx(masses)):
        cis = list(by_mass.get(mi, []))
        quota = alloc[mi] if mi < len(alloc) else 0
        for k in range(min(len(cis), quota)):
            ci = cis[k]
            keys[ci] = take(ci)
    for ci in range(1, len(centrumy)):
        if not keys.get(ci):
            keys[ci] = take(ci)
    n = max(len(centrumy), 1)
    return [keys.get(i) for i in range(n)]


for c in CASES["assignTypes"]:
    gm = MAPS[c["map"]]
    rand = Rand(c["seed"])
    got = assign_types(HL(c["centrumy"]), MASSES[c["map"]], c["playerKlucz"], c["roster"], rand)
    check(got == c["result"] and rand.n == c["randCalls"], f"assignTypes {c['map']} {c['seed']}")


# --- enforceLocalLandDominance (clusters.ts:2455) ---
def voronoi(ladowe, centers):
    if not centers and ladowe:
        return None
    regs = [[] for _ in centers]
    for h in ladowe:
        bi, bd = 0, math.inf
        for ci, ce in enumerate(centers):
            d = hd(h, ce)
            if d < bd:
                bd, bi = d, ci
        regs[bi].append(h)
    return regs


def enforce_local(gm, cache, centrumy, regiony, keys, ladowe, rand, min_dist, mapcenter, use_sea, min_sea):
    """Zwraca None gdy web rzuca (pusta lista srodkow). centrumy/regiony mutowane w miejscu."""
    masses = cache.masses
    relocated = False
    for ci in range(len(centrumy)):
        c = centrumy[ci]
        ok = passes_player(gm, cache, c[0], c[1]) if ci == 0 else passes_local(gm, c[0], c[1])
        if ok:
            continue
        region = regiony[ci] if ci < len(regiony) else []
        others = [x for i2, x in enumerate(centrumy) if i2 != ci]
        if ci == 0:
            nc = pick_player(gm, cache, ladowe, mapcenter, rand, use_sea, min_sea)
        else:
            nc = pick_best_local(gm, cache, region, others, min_dist, rand, use_sea, min_sea)
            if nc is None:
                for mi in by_size_desc(masses, qualifying_idx(masses)):
                    nc = pick_center_spread(gm, cache, masses[mi], others, min_dist, rand, use_sea, min_sea, None, None)
                    if nc:
                        break
        if nc:
            centrumy[ci] = nc
            relocated = True
    if relocated:
        nr = voronoi(ladowe, centrumy)
        if nr is None:
            return None
        for i2 in range(len(regiony)):
            regiony[i2] = nr[i2]
    keep = [True if ci == 0 else passes_local(gm, c[0], c[1]) for ci, c in enumerate(centrumy)]
    xs = [h[0] for h in ladowe]
    ys = [h[1] for h in ladowe]
    bbox = {"minQ": min(xs) if xs else math.inf, "maxQ": max(xs) if xs else -math.inf, "minR": min(ys) if ys else math.inf, "maxR": max(ys) if ys else -math.inf}
    spread_n = len(centrumy)
    for ci in range(1, len(centrumy)):
        if keep[ci]:
            continue
        others = [x for i2, x in enumerate(centrumy) if i2 != ci and keep[i2]]
        o = {"useSea": use_sea, "minSea": min_sea, "maxSea": None, "prior": [list(p) for p in others], "minSep": min_dist, "bbox": bbox, "spreadN": spread_n, "preferred": None, "progressive": True, "reqPlayer": False, "reqLocal": True}
        rescued = pick_spawn(gm, cache, ladowe, mapcenter, rand, o)
        if not rescued:
            o2 = dict(o, reqLocal=False)
            rescued = pick_spawn(gm, cache, ladowe, mapcenter, rand, o2)
        if rescued:
            centrumy[ci] = rescued
            keep[ci] = True
        else:
            keep[ci] = True
    if not centrumy:
        return None
    c0 = centrumy[0]
    if (not passes_local(gm, c0[0], c0[1])) or (not passes_player(gm, cache, c0[0], c0[1])):
        forced = pick_player(gm, cache, ladowe, mapcenter, rand, use_sea, min_sea)
        if forced:
            centrumy[0] = forced
            nr = voronoi(ladowe, centrumy)
            if nr is None:
                return None
            for i2 in range(len(regiony)):
                regiony[i2] = nr[i2]
            keep[0] = True
    new_c = [c for i2, c in enumerate(centrumy) if keep[i2]]
    new_k = [k for i2, k in enumerate(keys) if i2 < len(keep) and keep[i2]]
    nr = voronoi(ladowe, new_c)
    if nr is None:
        return None
    return {"centrumy": new_c, "regiony": nr, "keys": new_k}


for c in CASES["localDominance"] + CASES["localDominanceExtra"]:
    gm = MAPS[c["map"]]
    lad = ladowe_of(gm)
    centrumy = HL(c["centrumy"])
    regiony = voronoi(lad, centrumy)
    rand = Rand(c["seed"])
    mc = ((gm.w - 1) / 2, (gm.h - 1) / 2)
    out = enforce_local(gm, CACHES[c["map"]], centrumy, regiony, list(c["keys"]), lad, rand, c["minDist"], mc, c["useSea"], c["minSea"])
    check((out is None) == c["threw"], f"localDominance rzuca {c['map']}")
    check([list(h) for h in centrumy] == c["mutCentrumy"] and [reg_digest(r) for r in regiony] == c["mutRegiony"], f"localDominance mutacje wejsc {c['map']}")
    check(rand.n == c["randCalls"], f"localDominance rand {c['map']}")
    if out is not None:
        w = c["result"]
        check([list(h) for h in out["centrumy"]] == w["centrumy"] and [reg_digest(r) for r in out["regiony"]] == w["regiony"] and out["keys"] == w["keys"], f"localDominance wynik {c['map']}")
check(CASES["localDominanceEmpty"]["threw"] is True, "localDominance: pusta lista rzuca (web)")
gm0 = MAPS[CASES["localDominanceEmpty"]["map"]]
check(enforce_local(gm0, CACHES[CASES["localDominanceEmpty"]["map"]], [], [], [], ladowe_of(gm0), Rand(1), 8, ((gm0.w - 1) / 2, (gm0.h - 1) / 2), False, 0) is None, "localDominance pusta lista (port)")


# ----------------------------------------------------------------------------------------------
# 3. Klastry: pomocnicze i naprawy (clusters.ts:2654-3356)
# ----------------------------------------------------------------------------------------------
def k_in(o):
    k = {"typIndex": o["typIndex"], "typ": o["typ"], "centrum": H(o["centrum"]), "miasta": [[m[0], m[1], m[2]] for m in o["miasta"]]}
    k["pending"] = None if o["pending"] is None else HL(o["pending"])
    k["growth"] = o["growth"] if o["growth"] in ("absent", "null") else H(o["growth"])
    return k


def k_out(k):
    g = k["growth"]
    return {
        "typIndex": k["typIndex"],
        "typ": k["typ"],
        "centrum": list(k["centrum"]),
        "miasta": [[m[0], m[1], m[2]] for m in k["miasta"]],
        "pending": None if k["pending"] is None else [list(h) for h in k["pending"]],
        "growth": g if g in ("absent", "null") else list(g),
    }


def cap_hex(k):
    for m in k["miasta"]:
        if m[2]:
            return (m[0], m[1])
    return (k["miasta"][0][0], k["miasta"][0][1]) if k["miasta"] else None


def foreign_bufs(klastry, excl, radius):
    out = []
    for ki, k in enumerate(klastry):
        if ki == excl:
            continue
        cap = cap_hex(k)
        if cap:
            out.append({"q": cap[0], "r": cap[1], "radius": radius})
    return out


def repack_anchor(ki, cap, player_cap, min_obcy):
    if ki == 0 or not player_cap:
        return None
    if hd(cap, player_cap) + MAX_HEX < min_obcy:
        return None
    return {"q": player_cap[0], "r": player_cap[1], "minDist": min_obcy}


for fi, c in enumerate(CASES["clusterHelpers"]):
    ks = [k_in(o) for o in CASES["fixtures"][fi]["klastry"]]
    check([fo(cap_hex(k)) for k in ks] == c["caps"], f"clusterCapitalHex fixture {fi}")
    check([[list((m[0], m[1])) for m in k["miasta"]] for k in ks] == c["all"], f"allClusterCities fixture {fi}")
    rb = c["rb"]
    got = [[[b["q"], b["r"], b["radius"]] for b in foreign_bufs(ks, ki, rb)] for ki in range(len(ks))]
    want = [[[x[0], x[1], vf(x[2])] for x in row] for row in c["buffers"]]
    check(got == want, f"foreignBuffersForCluster fixture {fi}")
    pcap = cap_hex(ks[0])
    for a in c["anchors"]:
        ki = a["ki"]
        cap = cap_hex(ks[ki])
        r = repack_anchor(ki, cap, pcap, a["md"])
        check((None if r is None else [r["q"], r["r"], r["minDist"]]) == a["result"], f"foreignRepackAnchor {fi}/{ki}")
for e in CASES["clusterHelpersEdge"]:
    k = {"miasta": [[m[0], m[1], m[2]] for m in e["miasta"]]}
    check(fo(cap_hex(k)) == e["cap"], "clusterCapitalHex brzegowe")
for a in CASES["foreignAnchorEdge"]:
    r = repack_anchor(a["ki"], H(a["cap"]), H(a["player"]) if a["player"] else None, a["md"])
    check((1 if r else 0) == a["result"], "foreignRepackAnchor brzegowe")


def drop_cluster(klastry, regions, ki):
    del klastry[ki]
    del regions[ki]
    for i2, k in enumerate(klastry):
        k["typIndex"] = i2


def pick_gates(gm, cache, ladowe, mapcenter, rand, use_sea, min_sea, prior, min_sep, req_local, req_player, gate):
    o = {"useSea": use_sea, "minSea": min_sea, "maxSea": None, "prior": [list(p) for p in prior], "minSep": min_sep, "bbox": gate["bbox"] if gate else None, "spreadN": gate["spreadN"] if gate else None, "preferred": None, "progressive": True, "reqPlayer": req_player, "reqLocal": req_local}
    return pick_spawn(gm, cache, ladowe, mapcenter, rand, o)


def relocate_cap(gm, cache, region, rand, use_sea, min_sea, anchor, prior, min_sep, ladowe, mapcenter, req_player, gate):
    blob = centroid_of(region)
    nc = pick_capital(gm, region, blob, rand, True, use_sea, min_sea, anchor, prior, min_sep)
    if not nc:
        nc = pick_gates(gm, cache, ladowe, mapcenter, rand, use_sea, min_sea, prior, min_sep, True, req_player, gate)
    if not nc:
        nc = pick_gates(gm, cache, ladowe, mapcenter, rand, use_sea, min_sea, prior, min_sep, False, req_player, gate)
    return nc


def pack(all_land, region, cap, count, min_dist, seed, ex, anchor, growth, ax, bufs, rings=None):
    return around_capital(all_land, region, cap, count, min_dist, seed, ex=ex, anchor=anchor, growth=growth, ax=ax, bufs=bufs, rings=rings)


def rival_cities(ladowe, core, count, min_dist, seed, mapcenter):
    if count <= 0:
        return []
    ax = axis_for(core, mapcenter, seed)
    st, _ = around_capital(ladowe, ladowe, core, count, min_dist, seed, ex=core, growth=0, ax=ax)
    return st


def mix(seed, ki, mul):
    return (seed + ki * mul) & M32


def cities_list(cap, st):
    return [[cap[0], cap[1], True]] + [[s[0], s[1], False] for s in st]


def enforce_hard(gm, cache, klastry, regions, rand, use_sea, min_sea, min_sep, min_obcy, ladowe, seed, count, mapcenter, min_mp, gate):
    if not math.isfinite(min_sep) or min_sep <= 0:
        return
    repaired = True
    guard = 0
    while True:
        if not repaired:
            break
        ok = guard < len(klastry) * G_HARD
        guard += 1
        if not ok:
            break
        repaired = False
        caps = []
        for ki, k in enumerate(klastry):
            c = cap_hex(k)
            if c:
                caps.append([c[0], c[1], ki])
        done = False
        for i2 in range(len(caps)):
            for j in range(i2 + 1, len(caps)):
                d = hd((caps[i2][0], caps[i2][1]), (caps[j][0], caps[j][1]))
                if d >= min_sep:
                    continue
                fix_idx = j if caps[j][2] > caps[i2][2] else i2
                fix_ki = caps[fix_idx][2]
                region = regions[fix_ki] if fix_ki < len(regions) else None
                if region is None or len(region) == 0:
                    drop_cluster(klastry, regions, fix_ki)
                    repaired = True
                    done = True
                    break
                prior = [(c[0], c[1]) for idx, c in enumerate(caps) if idx != fix_idx]
                pc = next((c for c in caps if c[2] == 0), None)
                anchor = None if (fix_ki == 0 or pc is None) else [pc[0], pc[1], min_obcy]
                nc = relocate_cap(gm, cache, region, rand, use_sea, min_sea, anchor, prior, min_sep, ladowe, mapcenter, fix_ki == 0, gate)
                if not nc:
                    drop_cluster(klastry, regions, fix_ki)
                    repaired = True
                    done = True
                    break
                k = klastry[fix_ki]
                md = min_mp if fix_ki == 0 else FOREIGN_IN
                st, gs = pack(ladowe, region, nc, count, md, mix(seed, fix_ki, 0x9E3779B1), nc, anchor_dict(anchor), None, None, ())
                k["miasta"] = cities_list(nc, st)
                k["growth"] = gs if gs is not None else "null"
                if fix_ki == 0:
                    k["pending"] = rival_cities(ladowe, nc, count, min_mp, seed, mapcenter)
                caps[fix_idx] = [nc[0], nc[1], fix_ki]
                repaired = True
                done = True
                break
            if done:
                break


def fixture_state(c):
    fx = CASES["fixtures"][c["fixture"]]
    gm = MAPS[fx["map"]]
    lad = ladowe_of(gm)
    klastry = [k_in(o) for o in fx["klastry"]]
    regions = voronoi(lad, HL(fx["centers"]))
    return fx, gm, lad, klastry, regions


def gate_of(c, gm):
    if c["gate"] is None:
        return None
    lad = ladowe_of(gm)
    xs = [h[0] for h in lad]
    ys = [h[1] for h in lad]
    return {"bbox": {"minQ": min(xs), "maxQ": max(xs), "minR": min(ys), "maxR": max(ys)}, "spreadN": c["gate"]["spreadN"]}


def check_after(klastry, regions, c, label):
    w = c["after"]
    check([k_out(k) for k in klastry] == w["klastry"] and [reg_digest(r) for r in regions] == w["regions"], label)


REPAIR_STATS = {}
for c in CASES["repair_hard"]:
    fx, gm, lad, klastry, regions = fixture_state(c)
    rand = Rand(c["randSeed"])
    mc = ((gm.w - 1) / 2, (gm.h - 1) / 2)
    before = [k_out(k) for k in klastry]
    enforce_hard(gm, CACHES[fx["map"]], klastry, regions, rand, c["useSea"], c["minSea"], FV(c["minSep"]), c["minDystObcy"], lad, c["seed"], fx["stateCount"], mc, c["minMp"], gate_of(c, gm))
    check_after(klastry, regions, c, f"hard fixture {c['fixture']}")
    check(rand.n == c["randCalls"], f"hard rand fixture {c['fixture']}")
    REPAIR_STATS["hard_changed"] = REPAIR_STATS.get("hard_changed", 0) + (1 if [k_out(k) for k in klastry] != before else 0)


def body_violation(klastry, i2, j, min_sep, buf):
    ca = [(m[0], m[1]) for m in klastry[i2]["miasta"]]
    cb = [(m[0], m[1]) for m in klastry[j]["miasta"]]
    capa = cap_hex(klastry[i2])
    capb = cap_hex(klastry[j])
    for a in ca:
        for b in cb:
            d = hd(a, b)
            ai = capa is not None and a == capa
            bi = capb is not None and b == capb
            if ai and bi:
                if d < min_sep:
                    return True
            elif ai or bi:
                if d < buf:
                    return True
            elif d < buf:
                return True
    return False


def enforce_body(gm, cache, klastry, regions, rand, use_sea, min_sea, s_cluster, min_sep, min_obcy, ladowe, seed, count, mapcenter, min_mp, buf, gate):
    if not math.isfinite(s_cluster) or s_cluster <= 0:
        return
    repaired = True
    guard = 0
    while True:
        if not repaired:
            break
        ok = guard < len(klastry) * G_BODY
        guard += 1
        if not ok:
            break
        repaired = False
        done = False
        for i2 in range(len(klastry)):
            for j in range(i2 + 1, len(klastry)):
                if not body_violation(klastry, i2, j, min_sep, buf):
                    continue
                fix_ki = j
                region = regions[fix_ki] if fix_ki < len(regions) else None
                if region is None or len(region) == 0:
                    drop_cluster(klastry, regions, fix_ki)
                    repaired = True
                    done = True
                    break
                prior = []
                for ki, k in enumerate(klastry):
                    if ki == fix_ki:
                        continue
                    c = cap_hex(k)
                    if c:
                        prior.append(c)
                pc = cap_hex(klastry[0])
                anchor = None if (fix_ki == 0 or not pc) else [pc[0], pc[1], min_obcy]
                fbufs = foreign_bufs(klastry, fix_ki, buf)
                nc = relocate_cap(gm, cache, region, rand, use_sea, min_sea, anchor, prior, min_sep, ladowe, mapcenter, fix_ki == 0, gate)
                if not nc:
                    drop_cluster(klastry, regions, fix_ki)
                    repaired = True
                    done = True
                    break
                k = klastry[fix_ki]
                md = min_mp if fix_ki == 0 else FOREIGN_IN
                ax = axis_for(nc, mapcenter, seed) if fix_ki == 0 else None
                st, gs = pack(ladowe, region, nc, count, md, mix(seed, fix_ki, 0x9E3779B1), nc, anchor_dict(anchor), None, ax, fbufs)
                k["miasta"] = cities_list(nc, st)
                k["growth"] = gs if gs is not None else "null"
                if fix_ki == 0:
                    k["pending"] = rival_cities(ladowe, nc, count, min_mp, seed, mapcenter)
                still_bad = any(body_violation(klastry, min(ki, fix_ki), max(ki, fix_ki), min_sep, buf) for ki in range(len(klastry)) if ki != fix_ki)
                if still_bad:
                    k["miasta"] = [[nc[0], nc[1], True]]
                    k["pending"] = []
                    k["growth"] = "null"
                    for ki in range(len(klastry)):
                        if ki == fix_ki:
                            continue
                        other = klastry[ki]
                        ocap = cap_hex(other)
                        other["miasta"] = [m for m in other["miasta"] if (ocap is not None and (m[0], m[1]) == ocap) or hd((m[0], m[1]), nc) >= buf]
                        if ki == 0:
                            other["pending"] = [s for s in (other["pending"] or []) if hd(s, nc) >= buf]
                    cap_conflict = any(body_violation(klastry, min(ki, fix_ki), max(ki, fix_ki), min_sep, buf) for ki in range(len(klastry)) if ki != fix_ki)
                    if cap_conflict:
                        last = pick_gates(gm, cache, ladowe, mapcenter, rand, use_sea, min_sea, prior, min_sep, False, fix_ki == 0, gate)
                        if last:
                            k["miasta"] = [[last[0], last[1], True]]
                            cap_conflict = any(body_violation(klastry, min(ki, fix_ki), max(ki, fix_ki), min_sep, buf) for ki in range(len(klastry)) if ki != fix_ki)
                        if cap_conflict:
                            drop_cluster(klastry, regions, fix_ki)
                repaired = True
                done = True
                break
            if done:
                break


for c in CASES["repair_body"]:
    fx, gm, lad, klastry, regions = fixture_state(c)
    rand = Rand(c["randSeed"])
    mc = ((gm.w - 1) / 2, (gm.h - 1) / 2)
    before = [k_out(k) for k in klastry]
    enforce_body(gm, CACHES[fx["map"]], klastry, regions, rand, c["useSea"], c["minSea"], FV(c["sCluster"]), c["minSep"], c["minDystObcy"], lad, c["seed"], fx["stateCount"], mc, c["minMp"], FV(c["buf"]), gate_of(c, gm))
    check_after(klastry, regions, c, f"body fixture {c['fixture']}")
    check(rand.n == c["randCalls"], f"body rand fixture {c['fixture']}")
    REPAIR_STATS["body_changed"] = REPAIR_STATS.get("body_changed", 0) + (1 if [k_out(k) for k in klastry] != before else 0)


def repack_one(klastry, ki, count, min_obcy, ladowe, seed, buf, mapcenter, min_mp):
    if ki >= len(klastry):
        return
    k = klastry[ki]
    cap = cap_hex(k)
    if not cap:
        return
    mp_now = len([m for m in k["miasta"] if not m[2]])
    if mp_now >= count:
        return
    pcap = cap_hex(klastry[0])
    anchor = repack_anchor(ki, cap, pcap, min_obcy)
    fb = foreign_bufs(klastry, ki, buf)
    md = min_mp if ki == 0 else FOREIGN_IN
    ax = axis_for(cap, mapcenter, seed) if ki == 0 else None
    st, gs = pack(ladowe, ladowe, cap, count, md, mix(seed, ki, 0x9E3779B1), cap, anchor, RESERVE, ax, fb)
    valid = [s for s in st if buffer_gate(s, fb)]
    used = gs
    if len(valid) == 0:
        loose_r = max(0, math.floor(buf / LOOSE_DIV))
        lb = foreign_bufs(klastry, ki, loose_r)
        lmin = max(LOOSE_MIN_FLOOR, md - LOOSE_MIN_SUB)
        ax2 = axis_for(cap, mapcenter, (seed + 17) & M32) if ki == 0 else None
        rings = [MAX_HEX] + RINGS_AFTER
        st2, gs2 = pack(ladowe, ladowe, cap, count, lmin, mix(seed, ki, 0x85EBCA6B), cap, None, 0, ax2, lb, rings)
        valid = [s for s in st2 if buffer_gate(s, lb)]
        used = gs2
        if len(valid) == 0:
            st3, gs3 = pack(ladowe, ladowe, cap, count, DESP_MIN, mix(seed, ki, 0xC2B2AE35), cap, None, 0, None, [], RINGS_DESP)
            valid = st3
            used = gs3
        if len(valid) == 0:
            return
    k["miasta"] = cities_list(cap, valid[:count])
    k["growth"] = used if used is not None else "null"
    if ki == 0:
        k["pending"] = rival_cities(ladowe, cap, count, min_mp, seed, mapcenter)


for c in CASES["repair_repackOne"] + CASES["repair_repackOneExtra"]:
    fx, gm, lad, klastry, regions = fixture_state(c)
    mc = ((gm.w - 1) / 2, (gm.h - 1) / 2)
    before = [k_out(k) for k in klastry]
    repack_one(klastry, c["ki"], fx["stateCount"], c["minDystObcy"], lad, c["seed"], c["buf"], mc, c["minMp"])
    check_after(klastry, regions, c, f"repackOne fixture {c['fixture']}")
    REPAIR_STATS["repackOne_changed"] = REPAIR_STATS.get("repackOne_changed", 0) + (1 if [k_out(k) for k in klastry] != before else 0)
for c in CASES["repair_repackAll"] + CASES["repair_repackAllExtra"]:
    fx, gm, lad, klastry, regions = fixture_state(c)
    mc = ((gm.w - 1) / 2, (gm.h - 1) / 2)
    before = [k_out(k) for k in klastry]
    for ki in range(len(klastry)):
        repack_one(klastry, ki, fx["stateCount"], c["minDystObcy"], lad, c["seed"], c["buf"], mc, c["minMp"])
    check_after(klastry, regions, c, f"repackAll fixture {c['fixture']}")
    REPAIR_STATS["repackAll_changed"] = REPAIR_STATS.get("repackAll_changed", 0) + (1 if [k_out(k) for k in klastry] != before else 0)


def enforce_quarter(gm, cache, klastry, regions, ladowe, bbox, n_needed, rand, use_sea, min_sea, min_sep, min_obcy, seed, count, mapcenter, min_mp, buf):
    if n_needed < ENF_MIN_N or len(klastry) < ENF_MIN_K:
        return
    required = min_quarters(n_needed)
    midq = (bbox["minQ"] + bbox["maxQ"]) / 2
    midr = (bbox["minR"] + bbox["maxR"]) / 2
    gate = {"bbox": bbox, "spreadN": n_needed}
    for _ in range(ENF_ITERS):
        caps = []
        for ki, k in enumerate(klastry):
            c = cap_hex(k)
            if c:
                caps.append((c[0], c[1], ki))
        if len(caps) < ENF_CAPS_MIN:
            break
        centers = [(c[0], c[1]) for c in caps]
        spread = quad_spread(centers, bbox)
        if spread[0] >= required:
            break
        counts = count_quads(centers, midq, midr)
        rel = -1
        max_load = -1
        for c in caps:
            q = quad_idx(c[0], c[1], midq, midr)
            if counts[q] > max_load:
                max_load = counts[q]
                rel = c[2]
        if rel < 0 or max_load <= ENF_LOAD:
            break
        prior = [(c[0], c[1]) for c in caps if c[2] != rel]
        pc = next((c for c in caps if c[2] == 0), None)
        anchor = None if (rel == 0 or pc is None) else [pc[0], pc[1], min_obcy]
        region = regions[rel] if rel < len(regions) else ladowe
        nc = pick_gates(gm, cache, ladowe, mapcenter, rand, use_sea, min_sea, prior, min_sep, True, rel == 0, gate)
        if not nc:
            nc = pick_gates(gm, cache, ladowe, mapcenter, rand, use_sea, min_sea, prior, min_sep, False, rel == 0, gate)
        if not nc:
            break
        new_q = quad_idx(nc[0], nc[1], midq, midr)
        oc = next(c for c in caps if c[2] == rel)
        old_q = quad_idx(oc[0], oc[1], midq, midr)
        ns_ = quad_spread(prior + [nc], bbox)
        if ns_[0] <= spread[0] and counts[new_q] != 0:
            break
        if new_q == old_q and counts[old_q] <= ENF_LOAD2:
            break
        k = klastry[rel]
        md = min_mp if rel == 0 else FOREIGN_IN
        fb = foreign_bufs(klastry, rel, buf)
        st, gs = pack(ladowe, region if len(region) > 0 else ladowe, nc, count, md, mix(seed, rel, 0x9E3779B1), nc, anchor_dict(anchor), None, None, fb)
        k["miasta"] = cities_list(nc, st)
        k["centrum"] = nc
        k["growth"] = gs if gs is not None else "null"
        if rel == 0:
            k["pending"] = rival_cities(ladowe, nc, count, min_mp, seed, mapcenter)


for c in CASES["repair_quarter"]:
    fx, gm, lad, klastry, regions = fixture_state(c)
    rand = Rand(c["randSeed"])
    mc = ((gm.w - 1) / 2, (gm.h - 1) / 2)
    xs = [h[0] for h in lad]
    ys = [h[1] for h in lad]
    bbox = {"minQ": min(xs), "maxQ": max(xs), "minR": min(ys), "maxR": max(ys)}
    before = [k_out(k) for k in klastry]
    enforce_quarter(gm, CACHES[fx["map"]], klastry, regions, lad, bbox, c["nNeeded"], rand, c["useSea"], c["minSea"], c["minSep"], c["minDystObcy"], c["seed"], fx["stateCount"], mc, c["minMp"], c["buf"])
    check_after(klastry, regions, c, f"quarter fixture {c['fixture']}")
    check(rand.n == c["randCalls"], f"quarter rand fixture {c['fixture']}")
    REPAIR_STATS["quarter_changed"] = REPAIR_STATS.get("quarter_changed", 0) + (1 if [k_out(k) for k in klastry] != before else 0)

print("pokrycie (informacyjnie):", json.dumps({"pickSpawn": PS_STATS, "pickCapital_region_zmieniony": CHANGED, "naprawy_zmienione": REPAIR_STATS}, sort_keys=True))
total = checks + dep_checks
total_bad = bad + dep_bad
print(f"sprawdzen M11: {checks}, rozbieznosci M11: {bad}")
print(f"RAZEM (M11 + zaleznosci M10/M09): {total} sprawdzen, rozbieznosci: {total_bad}")
sys.exit(1 if total_bad else 0)
