#!/usr/bin/env python3
"""NIEZALEZNY weryfikator P6.M04 (klasyfikacja terenu i granice mapy).

Reimplementuje w Pythonie logike z KODU TS (specyfikacja: gen-helpers.ts :233-236 i :825-1407, pin
edb8fb56) BEZ wykonywania TS, BEZ generatora, BEZ Rust, i porownuje wynik z wektorami z
uruchomionego weba (tests/p6_m04_vectors/web-vectors.json). Dodatkowo:
  - wyciaga regexem z TS (po numerach linii pinu) literaly/stale i porownuje je z tabela
    `data/derived/mapgen-terrain-class.json`,
  - sprawdza kotwice tekstowe stalych algorytmicznych (hasze, maski) w zrodle TS,
  - ma WLASNY TimSort V8 (z opisu algorytmu; skopiowany z weryfikatora P6.M10) do komparatora
    NIEprzechodniego `applyMarginalLandZoneCaps` i `sortLandKeysForErosion`,
  - liczy NIEZALEZNIE zaleznosci lasu (odleglosc od morza, partycje, komorki pokrycia) i porownuje je
    z wartosciami zapisanymi z weba.

Uzycie: verify-m04-vectors.py <WEB_ROOT> <WEB_VECTORS_JSON> <TABLE_JSON>
Kod wyjscia: 0 = 0 rozbieznosci.
"""
import functools
import json
import math
import re
import struct
import sys
from fractions import Fraction

web_root, vec_path, tbl_path = sys.argv[1:4]
V = json.load(open(vec_path, encoding="utf-8"))
TBL = json.load(open(tbl_path, encoding="utf-8"))
GH_TEXT = open(f"{web_root}/gra/src/map/gen-helpers.ts", encoding="utf-8").read()
GH = GH_TEXT.split("\n")
CASES = V["cases"]
E_TB = V["enums"]["tb"]
E_NAK = V["enums"]["nak"]

checks = 0
bad = 0


def check(cond, msg):
    global checks, bad
    checks += 1
    if not cond:
        bad += 1
        if bad <= 40:
            print("ROZBIEZNOSC:", msg)


def bits(x):
    return struct.pack(">d", float(x))


def vf(t):
    """f64 zapisany jako tekst w wektorach."""
    if t == "Infinity":
        return math.inf
    if t == "-Infinity":
        return -math.inf
    if t == "NaN":
        return math.nan
    return float(t)


def same(a, b):
    a = float(a)
    b = float(b)
    if math.isnan(a) and math.isnan(b):
        return True
    return bits(a) == bits(b)


M32 = 0xFFFFFFFF


# ---- TimSort V8 (z opisu algorytmu; komparator zwraca liczbe, NaN == 0) ---------------------
def v8_sort(items, cmp):
    n = len(items)
    if n < 2:
        return list(items)
    work = list(range(n))
    calls = [0]

    def C(x, y):
        calls[0] += 1
        v = cmp(items[x], items[y])
        return 0 if (isinstance(v, float) and math.isnan(v)) else v

    runs = []
    min_gallop = [7]

    def gallop_left(arr, key, base, length, hint):
        last = 0
        off = 1
        if C(arr[base + hint], key) < 0:
            maxofs = length - hint
            while off < maxofs:
                if C(arr[base + hint + off], key) >= 0:
                    break
                last = off
                off = (off << 1) + 1
            if off > maxofs:
                off = maxofs
            last += hint
            off += hint
        else:
            maxofs = hint + 1
            while off < maxofs:
                if C(arr[base + hint - off], key) < 0:
                    break
                last = off
                off = (off << 1) + 1
            if off > maxofs:
                off = maxofs
            last, off = hint - off, hint - last
        last += 1
        while last < off:
            m = last + ((off - last) >> 1)
            if C(arr[base + m], key) < 0:
                last = m + 1
            else:
                off = m
        return off

    def gallop_right(arr, key, base, length, hint):
        last = 0
        off = 1
        if C(key, arr[base + hint]) < 0:
            maxofs = hint + 1
            while off < maxofs:
                if C(key, arr[base + hint - off]) >= 0:
                    break
                last = off
                off = (off << 1) + 1
            if off > maxofs:
                off = maxofs
            last, off = hint - off, hint - last
        else:
            maxofs = length - hint
            while off < maxofs:
                if C(key, arr[base + hint + off]) < 0:
                    break
                last = off
                off = (off << 1) + 1
            if off > maxofs:
                off = maxofs
            last += hint
            off += hint
        last += 1
        while last < off:
            m = last + ((off - last) >> 1)
            if C(key, arr[base + m]) < 0:
                off = m
            else:
                last = m + 1
        return off

    def merge_low(ba, la, bb, lb):
        tmp = work[ba : ba + la]
        dest = ba
        ct = 0
        cb = bb
        work[dest] = work[cb]
        dest += 1
        cb += 1
        lb -= 1
        state = None
        if lb == 0:
            state = "succeed"
        elif la == 1:
            state = "copyb"
        else:
            mg = min_gallop[0]
            while state is None:
                wa = wb = 0
                while True:
                    if C(work[cb], tmp[ct]) < 0:
                        work[dest] = work[cb]
                        dest += 1
                        cb += 1
                        wb += 1
                        lb -= 1
                        wa = 0
                        if lb == 0:
                            state = "succeed"
                            break
                        if wb >= mg:
                            break
                    else:
                        work[dest] = tmp[ct]
                        dest += 1
                        ct += 1
                        wa += 1
                        la -= 1
                        wb = 0
                        if la == 1:
                            state = "copyb"
                            break
                        if wa >= mg:
                            break
                if state:
                    break
                mg += 1
                first = True
                while wa >= 7 or wb >= 7 or first:
                    first = False
                    mg = max(1, mg - 1)
                    min_gallop[0] = mg
                    wa = gallop_right(tmp, work[cb], ct, la, 0)
                    if wa > 0:
                        work[dest : dest + wa] = tmp[ct : ct + wa]
                        dest += wa
                        ct += wa
                        la -= wa
                        if la == 1:
                            state = "copyb"
                            break
                        if la == 0:
                            state = "succeed"
                            break
                    work[dest] = work[cb]
                    dest += 1
                    cb += 1
                    lb -= 1
                    if lb == 0:
                        state = "succeed"
                        break
                    wb = gallop_left(work, tmp[ct], cb, lb, 0)
                    if wb > 0:
                        work[dest : dest + wb] = work[cb : cb + wb]
                        dest += wb
                        cb += wb
                        lb -= wb
                        if lb == 0:
                            state = "succeed"
                            break
                    work[dest] = tmp[ct]
                    dest += 1
                    ct += 1
                    la -= 1
                    if la == 1:
                        state = "copyb"
                        break
                if state:
                    break
                mg += 1
                min_gallop[0] = mg
        if state == "succeed":
            if la > 0:
                work[dest : dest + la] = tmp[ct : ct + la]
        else:
            work[dest : dest + lb] = work[cb : cb + lb]
            work[dest + lb] = tmp[ct]

    def merge_high(ba, la, bb, lb):
        tmp = work[bb : bb + lb]
        dest = bb + lb - 1
        ct = lb - 1
        ca = ba + la - 1
        work[dest] = work[ca]
        dest -= 1
        ca -= 1
        la -= 1
        state = None
        if la == 0:
            state = "succeed"
        elif lb == 1:
            state = "copya"
        else:
            mg = min_gallop[0]
            while state is None:
                wa = wb = 0
                while True:
                    if C(tmp[ct], work[ca]) < 0:
                        work[dest] = work[ca]
                        dest -= 1
                        ca -= 1
                        wa += 1
                        la -= 1
                        wb = 0
                        if la == 0:
                            state = "succeed"
                            break
                        if wa >= mg:
                            break
                    else:
                        work[dest] = tmp[ct]
                        dest -= 1
                        ct -= 1
                        wb += 1
                        lb -= 1
                        wa = 0
                        if lb == 1:
                            state = "copya"
                            break
                        if wb >= mg:
                            break
                if state:
                    break
                mg += 1
                first = True
                while wa >= 7 or wb >= 7 or first:
                    first = False
                    mg = max(1, mg - 1)
                    min_gallop[0] = mg
                    k = gallop_right(work, tmp[ct], ba, la, la - 1)
                    wa = la - k
                    if wa > 0:
                        dest -= wa
                        ca -= wa
                        work[dest + 1 : dest + 1 + wa] = work[ca + 1 : ca + 1 + wa]
                        la -= wa
                        if la == 0:
                            state = "succeed"
                            break
                    work[dest] = tmp[ct]
                    dest -= 1
                    ct -= 1
                    lb -= 1
                    if lb == 1:
                        state = "copya"
                        break
                    k = gallop_left(tmp, work[ca], 0, lb, lb - 1)
                    wb = lb - k
                    if wb > 0:
                        dest -= wb
                        ct -= wb
                        work[dest + 1 : dest + 1 + wb] = tmp[ct + 1 : ct + 1 + wb]
                        lb -= wb
                        if lb == 1:
                            state = "copya"
                            break
                        if lb == 0:
                            state = "succeed"
                            break
                    work[dest] = work[ca]
                    dest -= 1
                    ca -= 1
                    la -= 1
                    if la == 0:
                        state = "succeed"
                        break
                if state:
                    break
                mg += 1
                min_gallop[0] = mg
        if state == "succeed":
            if lb > 0:
                work[dest - (lb - 1) : dest + 1] = tmp[0:lb]
        else:
            dest -= la
            ca -= la
            work[dest + 1 : dest + 1 + la] = work[ca + 1 : ca + 1 + la]
            work[dest] = tmp[ct]

    def merge_at(i):
        ba, la = runs[i]
        bb, lb = runs[i + 1]
        runs[i] = (ba, la + lb)
        if i == len(runs) - 3:
            runs[i + 1] = runs[i + 2]
        runs.pop()
        k = gallop_right(work, work[bb], ba, la, 0)
        ba += k
        la -= k
        if la == 0:
            return
        lb = gallop_left(work, work[ba + la - 1], bb, lb, lb - 1)
        if lb == 0:
            return
        if la <= lb:
            merge_low(ba, la, bb, lb)
        else:
            merge_high(ba, la, bb, lb)

    def invariant(i):
        if i < 2:
            return True
        return runs[i - 2][1] > runs[i - 1][1] + runs[i][1]

    def merge_collapse():
        while len(runs) > 1:
            i = len(runs) - 2
            if not invariant(i + 1) or not invariant(i):
                if runs[i - 1][1] < runs[i + 1][1]:
                    i -= 1
                merge_at(i)
            elif runs[i][1] <= runs[i + 1][1]:
                merge_at(i)
            else:
                break

    def merge_force():
        while len(runs) > 1:
            i = len(runs) - 2
            if i > 0 and runs[i - 1][1] < runs[i + 1][1]:
                i -= 1
            merge_at(i)

    def count_run(low_arg, high):
        low = low_arg + 1
        if low == high:
            return 1
        rl = 2
        desc = C(work[low], work[low - 1]) < 0
        prev = work[low]
        for idx in range(low + 1, high):
            cur = work[idx]
            o = C(cur, prev)
            if desc:
                if o >= 0:
                    break
            elif o < 0:
                break
            prev = cur
            rl += 1
        if desc:
            work[low_arg : low_arg + rl] = work[low_arg : low_arg + rl][::-1]
        return rl

    def bin_ins(low, start_arg, high):
        start = low + 1 if low == start_arg else start_arg
        while start < high:
            left = low
            right = start
            pivot = work[right]
            while left < right:
                mid = left + ((right - left) >> 1)
                if C(pivot, work[mid]) < 0:
                    right = mid
                else:
                    left = mid + 1
            for p in range(start, left, -1):
                work[p] = work[p - 1]
            work[left] = pivot
            start += 1

    def min_run(n):
        r = 0
        while n >= 64:
            r |= n & 1
            n >>= 1
        return n + r

    low = 0
    remaining = n
    mr = min_run(remaining)
    while remaining != 0:
        cur = count_run(low, low + remaining)
        if cur < mr:
            forced = min(mr, remaining)
            bin_ins(low, low + cur, low + forced)
            cur = forced
        runs.append((low, cur))
        merge_collapse()
        low += cur
        remaining -= cur
    merge_force()
    v8_sort.last_calls = calls[0]
    return [items[i] for i in work]


v8_sort.last_calls = 0


# ----------------------------------------------------------------------------------------------
# 0. Narzedzia JS (liczby f64 jako float Pythona)
# ----------------------------------------------------------------------------------------------
INF = math.inf
NAN = math.nan


def is_nan(x):
    return isinstance(x, float) and math.isnan(x)


def js_div(a, b):
    a = float(a)
    b = float(b)
    if b == 0.0:
        if a == 0.0 or math.isnan(a):
            return NAN
        neg = (math.copysign(1.0, a) < 0) != (math.copysign(1.0, b) < 0)
        return -INF if neg else INF
    return a / b


def js_mul(a, b):
    return float(a) * float(b)


def to_int32(x):
    """JS ToInt32 dla liczby (float albo int)."""
    if isinstance(x, float):
        if math.isnan(x) or math.isinf(x):
            return 0
        x = int(x)  # obciecie ku zeru, dowolna precyzja
    x &= M32
    return x - (1 << 32) if x & 0x80000000 else x


def js_floor(x):
    x = float(x)
    if math.isnan(x) or math.isinf(x):
        return x
    return float(math.floor(x))


def js_ceil(x):
    x = float(x)
    if math.isnan(x) or math.isinf(x):
        return x
    return float(math.ceil(x))


def js_round(x):
    """Math.round: polowka w kierunku +inf, dokladnie (Fraction), zachowuje -0."""
    x = float(x)
    if math.isnan(x) or math.isinf(x) or x == 0.0:
        return x
    r = math.floor(Fraction(x) + Fraction(1, 2))
    if r == 0 and x < 0:
        return -0.0
    return float(r)


def js_min2(a, b):
    a = float(a)
    b = float(b)
    if math.isnan(a) or math.isnan(b):
        return NAN
    if a == 0.0 and b == 0.0:
        return -0.0 if (math.copysign(1.0, a) < 0 or math.copysign(1.0, b) < 0) else 0.0
    return a if a < b else b


def js_max2(a, b):
    a = float(a)
    b = float(b)
    if math.isnan(a) or math.isnan(b):
        return NAN
    if a == 0.0 and b == 0.0:
        return 0.0 if (math.copysign(1.0, a) > 0 or math.copysign(1.0, b) > 0) else -0.0
    return a if a > b else b


def js_min(*xs):
    r = xs[0]
    for x in xs[1:]:
        r = js_min2(r, x)
    return float(r)


def js_max(*xs):
    r = xs[0]
    for x in xs[1:]:
        r = js_max2(r, x)
    return float(r)


def js_pow2(x):
    try:
        return float(x) ** 2.0
    except OverflowError:
        return INF


def js_sqrt(x):
    x = float(x)
    if math.isnan(x) or x < 0:
        return NAN
    return math.sqrt(x)


def sub(a, b):
    return float(a) - float(b)


def key(q, r):
    return f"{int(q)},{int(r)}"


def parse_key(k):
    parts = k.split(",")
    return int(float(parts[0])), int(float(parts[1]))


def hex_key_js(q, r):
    """String(q) dla liczb calkowitych."""
    return f"{q},{r}"


# ----------------------------------------------------------------------------------------------
# 1. Literaly z TS vs tabela silnika (regex po zrodle, numery linii z pinu)
# ----------------------------------------------------------------------------------------------
def line(n):
    return GH[n - 1]


NUM = r"(-?\d+(?:\.\d+)?)"


def num(n, rx):
    m = re.search(rx, line(n))
    check(m is not None, f"gen-helpers.ts:{n}: regex {rx!r} nie pasuje do: {line(n)!r}")
    return float(m.group(1)) if m else None


def nums(n, rx, count):
    m = re.search(rx, line(n))
    check(m is not None, f"gen-helpers.ts:{n}: regex {rx!r} nie pasuje do: {line(n)!r}")
    return [float(m.group(i + 1)) for i in range(count)] if m else [None] * count


def tv(path):
    node = TBL
    for p in path.split("/"):
        node = node[p]
    return node["wartosc"], node["zrodlo_web"]


CHECKED = set()


def table_check(path, ts_value):
    CHECKED.add(path)
    value, src = tv(path)
    m = re.match(r"gra/src/map/gen-helpers\.ts:(\d+)$", src)
    check(m is not None, f"{path}: zrodlo_web {src}")
    check(ts_value is not None and same(value, ts_value), f"tabela {path}={value} != TS {ts_value} ({src})")


def table_line_ok(path, n):
    _, src = tv(path)
    check(src.endswith(f":{n}"), f"{path}: zrodlo_web {src} != :{n}")


T_CLS = {
    "klasyfikacja/prog_pustyni_domyslny": (934, r"desert \?\? " + NUM),
    "klasyfikacja/prog_gor_domyslny": (935, r"mountain \?\? " + NUM),
    "klasyfikacja/prog_wzgorz_domyslny": (936, r"highland \?\? " + NUM),
    "klasyfikacja/elev_ponizej_ktorego_woda_lub_laka": (941, r"elevContinental < " + NUM),
    "klasyfikacja/landmask_ponizej_ktorego_morze": (943, r"landMask < " + NUM),
    "klasyfikacja/pustynia_elev_wiekszy_niz": (955, r"elevContinental > " + NUM),
    "klasyfikacja/pustynia_elev_mniejszy_niz": (956, r"elevContinental < " + NUM),
    "klasyfikacja/rownina_prog_sumy": (959, r"\) > " + NUM),
    "bramki_wysokosci_reliefu/prog_niski_mtn_max_wlacznie": (862, r"mtnTh <= " + NUM),
    "bramki_wysokosci_reliefu/prog_wysoki_mtn_min_wlacznie": (865, r"mtnTh >= " + NUM),
    "przeplot_rownina_laka/amplituda_globalna": (881, r"TERRAIN_GLOBAL_MIX_AMP = " + NUM),
    "przeplot_rownina_laka/amplituda_komorkowa": (882, r"TERRAIN_CELL_JITTER_AMP = " + NUM),
    "przeplot_rownina_laka/rozmiar_komorki_hex": (890, r"return " + NUM),
    "nakladka_lasu/bonus_wnetrza_ladu_max": (1053, r"\* " + NUM + r" : 0"),
    "nakladka_lasu/mnoznik_strefy_umiarkowanej": (1062, r"\? " + NUM + r" : "),
    "nakladka_lasu/mnoznik_poza_strefa_umiarkowana": (1062, r" : " + NUM + r";"),
    "nakladka_lasu/minimum_sufitu_komorki": (1066, r"Math\.max\(" + NUM + r","),
    "brzeg_mapy/twardy_ocean_hex": (1177, r"MAP_BORDER_OCEAN_HEXES = " + NUM),
    "brzeg_mapy/strefa_stopniowanego_ladu_hex": (1180, r"MAP_MARGIN_LAND_ZONE_HEXES = " + NUM),
    "brzeg_mapy/przyrost_limitu_ladu_na_pierscien": (1193, r"return " + NUM + r" \* \(d - 1\)"),
    "brzeg_mapy/limit_pelnego_ladu_w_fade": (1299, r"cap / " + NUM),
    "brzeg_mapy/waga_rozproszenia_brzegu": (1201, r"\* " + NUM + r";"),
    "brzeg_mapy/tolerancja_remisu_rozproszenia": (1268, r"> " + NUM),
    "brzeg_mapy/max_sasiadow_ladu_przy_dosypywaniu": (1276, r">= " + NUM),
    "brzeg_mapy/minimum_marginesu_krawedzi_rect": (1320, r"Math\.max\(marginQ, " + NUM),
    "srodek_mapy/minimum_biasu_radialnego": (1309, r"Math\.max\(" + NUM + r","),
    "srodek_mapy/promien_biasu_radialnego": (1309, r"dist / " + NUM),
    "srodek_mapy/wykladnik_biasu_radialnego": (1309, r", " + NUM + r"\)\);"),
}
for path, (n, rx) in T_CLS.items():
    table_check(path, num(n, rx))
    table_line_ok(path, n)

# minimum_lasu: `typ === 'pangea' ? 0 : 1`
m = re.search(r"'pangea' \? " + NUM + r" : " + NUM, line(1064))
check(m is not None, "gen-helpers.ts:1064: minForest")
if m:
    table_check("nakladka_lasu/minimum_lasu_pangea", float(m.group(1)))
    table_check("nakladka_lasu/minimum_lasu_poza_pangea", float(m.group(2)))
table_line_ok("nakladka_lasu/minimum_lasu_pangea", 1064)
table_line_ok("nakladka_lasu/minimum_lasu_poza_pangea", 1064)

# wiersze bramek wysokosci (reliefElevGates): kolejnosc pol w literalach `{ mountain, highland, landMaskHi, landMaskMtn }`
for row, n in (("niski", 863), ("sredni", 868), ("wysoki", 866)):
    vals = nums(n, r"mountain: " + NUM + r", highland: " + NUM + r", landMaskHi: " + NUM + r", landMaskMtn: " + NUM, 4)
    for name, v in zip(("mountain", "highland", "land_mask_hi", "land_mask_mtn"), vals):
        table_check(f"bramki_wysokosci_reliefu/{row}/{name}", v)
        table_line_ok(f"bramki_wysokosci_reliefu/{row}/{name}", n)

# REAPPLY_RELIEF_BUDGET_FRAC (1104-1106) i FALLBACK_RELIEF_FRAC (1166-1168)
for tier, n in (("low", 1104), ("medium", 1105), ("high", 1106)):
    table_check(f"relief_po_dopasowaniu_ladu/budzet_ulamek_ladu/{tier}", num(n, tier + r": " + NUM))
    table_line_ok(f"relief_po_dopasowaniu_ladu/budzet_ulamek_ladu/{tier}", n)
for tier, n in (("low", 1166), ("medium", 1167), ("high", 1168)):
    a, b = nums(n, tier + r": \{ mountain: " + NUM + r", highland: " + NUM, 2)
    table_check(f"relief_po_dopasowaniu_ladu/docelowy_udzial_gor/{tier}", a)
    table_check(f"relief_po_dopasowaniu_ladu/docelowy_udzial_wzgorz/{tier}", b)
    table_line_ok(f"relief_po_dopasowaniu_ladu/docelowy_udzial_gor/{tier}", n)
    table_line_ok(f"relief_po_dopasowaniu_ladu/docelowy_udzial_wzgorz/{tier}", n)

# kotwice tekstowe stalych ALGORYTMICZNYCH uzytych w tej implementacji (hasze, maski) i struktury
for n, needle in (
    (900, "374761393"), (900, "668265263"), (900, "2246822519"),
    (901, "1274126177"), (901, ">>> 13"), (902, ">>> 16"), (903, "4294967296"),
    (1200, "73856093"), (1200, "19349663"), (1200, "0xffff"), (1201, "0xffff"),
    (912, "Math.floor(q / cellSize)"), (913, "Math.floor(r / cellSize)"), (914, "- 0.5) * 2"),
    (918, "* 0.5 - 0.5)"), (1306, "cx + 0.5"), (1128, "mapHeight ?"), (1153, "Math.floor(landCount * budgetFrac)"),
    (1056, "b.n - a.n"), (1151, "b.n - a.n"), (1062, "temperate_north"), (1062, "temperate_south"),
    (1060, "Math.floor(land.length / 2)"), (1065, "Math.round(eligible.length * share * zoneShareMul)"),
    (1066, "Math.ceil(eligible.length * FOREST_OVERLAY_CAP_FRAC)"), (1268, "Math.abs(sb - sa)"),
    (1269, "countLandNeighborsInSet"), (1250, "Math.round(ring.length * cap)"),
):
    check(needle in line(n), f"kotwica {needle!r} nie w gen-helpers.ts:{n}: {line(n)!r}")

HEXDIR = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]
dir_text = " ".join(GH[124:127])
parsed_dirs = [(int(a), int(b)) for a, b in re.findall(r"\[\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*\]", dir_text)]
check(parsed_dirs == HEXDIR, f"HEX_DIRECTIONS z TS: {parsed_dirs}")

# stale prywatne weba vs wektory consts
C = CASES["consts"]
check(same(vf(C["TERRAIN_GLOBAL_MIX_AMP"]), num(881, r"= " + NUM)), "const TERRAIN_GLOBAL_MIX_AMP")
check(same(vf(C["TERRAIN_CELL_JITTER_AMP"]), num(882, r"= " + NUM)), "const TERRAIN_CELL_JITTER_AMP")
check(same(vf(C["terenCoverageCellSize"]), num(890, r"return " + NUM)), "const terenCoverageCellSize")
check(same(vf(C["MAP_BORDER_OCEAN_HEXES"]), num(1177, r"= " + NUM)), "const MAP_BORDER_OCEAN_HEXES")
check(same(vf(C["MAP_MARGIN_LAND_ZONE_HEXES"]), num(1180, r"= " + NUM)), "const MAP_MARGIN_LAND_ZONE_HEXES")
for tier, n in (("low", 1104), ("medium", 1105), ("high", 1106)):
    check(same(vf(C["REAPPLY_RELIEF_BUDGET_FRAC"][tier]), num(n, tier + r": " + NUM)), f"const REAPPLY {tier}")
FOREST_SHARE = {
    "low": num(1591, r"low: " + NUM), "medium": num(1592, r"medium: " + NUM), "high": num(1593, r"high: " + NUM),
}
for tier, v in FOREST_SHARE.items():
    check(same(vf(C["FOREST_SHARE_OF_DRY_LAND"][tier]), v), f"const FOREST_SHARE {tier}")
FOREST_CAP = num(1605, r"= " + NUM)
check(same(vf(C["FOREST_OVERLAY_CAP_FRAC"]), FOREST_CAP), "const FOREST_OVERLAY_CAP_FRAC")
FOREST_CELL = {"high": num(1839, r"return " + NUM), "low": num(1840, r"return " + NUM), "medium": num(1841, r"return " + NUM)}
MIN_LAND_FLOOR = num(1849, r"Math\.max\(" + NUM + r",")
MIN_LAND_MUL = num(1849, r"cellSize \* " + NUM)

# wartosci wykorzystywane przez implementacje Pythona - TYLKO z TS (nie z tabeli ani z Rust)
D_DES = num(934, r"desert \?\? " + NUM)
D_MTN = num(935, r"mountain \?\? " + NUM)
D_HI = num(936, r"highland \?\? " + NUM)
ELEV_SEA = num(941, r"elevContinental < " + NUM)
LM_SEA = num(943, r"landMask < " + NUM)
DES_LO = num(955, r"elevContinental > " + NUM)
DES_HI = num(956, r"elevContinental < " + NUM)
PLAINS = num(959, r"\) > " + NUM)
GLOBAL_AMP = num(881, r"= " + NUM)
CELL_AMP = num(882, r"= " + NUM)
CELL_SIZE_DEFAULT = num(890, r"return " + NUM)
BORDER_OCEAN = num(1177, r"= " + NUM)
MARGIN_ZONE = num(1180, r"= " + NUM)
CAP_STEP = num(1193, r"return " + NUM + r" \*")
FADE_FULL = num(1299, r"cap / " + NUM)
SCATTER_W = num(1201, r"\* " + NUM + r";")
TIE_TOL = num(1268, r"> " + NUM)
MAX_NEIGH = num(1276, r">= " + NUM)
EDGE_MIN = num(1320, r"Math\.max\(marginQ, " + NUM)
RAD_MIN = num(1309, r"Math\.max\(" + NUM + r",")
RAD_R = num(1309, r"dist / " + NUM)
INLAND = num(1053, r"\* " + NUM + r" : 0")
ZMUL_T = num(1062, r"\? " + NUM + r" : ")
ZMUL_O = num(1062, r" : " + NUM + r";")
CAP_MIN = num(1066, r"Math\.max\(" + NUM + r",")
CLIMATE_BUF_FRAC = num(187, r"= " + NUM)
CLIMATE_POLAR = num(178, r"= " + NUM)
CLIMATE_DESERT_HALF_ROWS = num(180, r"= " + NUM)
CLIMATE_PLAINS_HALF = num(184, r"= " + NUM)
EARTH_TXT = open(f"{web_root}/gra/src/map/earth-land-mask.ts", encoding="utf-8").read()
EARTH_REF_ROWS = float(re.search(r"EARTH_POLAR_OCEAN_REF_ROWS = (\d+)", EARTH_TXT).group(1))
EARTH_BORDER = float(re.search(r"EARTH_PLAYABLE_BORDER = (\d+)", EARTH_TXT).group(1))
EARTH_CAP_FRAC = float(re.search(r"Math\.round\(innerH \* (\d+\.\d+)\)", EARTH_TXT).group(1))
EARTH_REF_INNER = float(re.search(r"EARTH_POLAR_OCEAN_REF_INNER_H = (\d+)", EARTH_TXT).group(1))
RELIEF_BUDGET = {t: num(n, t + r": " + NUM) for t, n in (("low", 1104), ("medium", 1105), ("high", 1106))}


# ----------------------------------------------------------------------------------------------
# 2. Implementacja Pythona (z TS jako specyfikacji)
# ----------------------------------------------------------------------------------------------
def latitudinal_ocean_buffer_rows(height, is_earth):
    if is_earth:
        inner = js_max(1, float(height) - 1 - 2 * EARTH_BORDER)  # earthPlayableInnerHeight
        scaled = js_round(EARTH_REF_ROWS * inner / EARTH_REF_INNER)
        cap = js_max(EARTH_REF_ROWS, js_round(inner * EARTH_CAP_FRAC))
        return js_max(2, js_min(scaled, cap))
    return js_max(2, js_round(float(height) * CLIMATE_BUF_FRAC))


def is_in_lat_buffer(r, height, is_earth):
    buf = latitudinal_ocean_buffer_rows(height, is_earth)
    return r < buf or r >= height - buf


def climate_band_at(r, height, is_earth=False):
    buf = latitudinal_ocean_buffer_rows(height, is_earth)
    inner_h = js_max(1, height - 2 * buf)
    rel_r = (r - buf) / js_max(1, inner_h - 1)
    if rel_r < 0 or rel_r > 1:
        return "polar_north" if r < height / 2 else "polar_south"
    half = CLIMATE_DESERT_HALF_ROWS / inner_h
    d_lo = 0.5 - half
    d_hi = 0.5 + half
    p_n_lo = d_lo - CLIMATE_PLAINS_HALF
    p_s_hi = d_hi + CLIMATE_PLAINS_HALF
    if rel_r < CLIMATE_POLAR:
        return "polar_north"
    if rel_r < p_n_lo:
        return "temperate_north"
    if rel_r < d_lo:
        return "plains_north"
    if rel_r < d_hi:
        return "desert"
    if rel_r < p_s_hi:
        return "plains_south"
    if rel_r < 1 - CLIMATE_POLAR:
        return "temperate_south"
    return "polar_south"


def hash_int3(a, b, c):
    h = to_int32(js_mul(a, 374761393.0)) ^ to_int32(js_mul(b, 668265263.0)) ^ to_int32(js_mul(c, 2246822519.0))
    h = to_int32(h)
    u = h & M32
    x = to_int32(h ^ (u >> 13))
    h = to_int32((x * 1274126177) & M32)  # Math.imul
    u = h & M32
    r = (h ^ (u >> 16)) & M32
    return r / 4294967296


def cell_bias(q, r, seed, cell=None):
    cs = CELL_SIZE_DEFAULT if cell is None else cell
    cx = js_floor(js_div(q, cs))
    cy = js_floor(js_div(r, cs))
    return (hash_int3(cx, cy, seed) - 0.5) * 2


def jitter(forn, desn, bias):
    glob = ((forn + desn) * 0.5 - 0.5) * GLOBAL_AMP
    loc = bias * CELL_AMP
    return glob + loc


def elev_gates(mtn_th):
    if mtn_th <= 0.55:
        return {"mountain": 0.10, "highland": 0.08, "lmhi": 0.12, "lmmtn": 0.15}
    if mtn_th >= 0.75:
        return {"mountain": 0.22, "highland": 0.18, "lmhi": 0.30, "lmmtn": 0.35}
    return {"mountain": 0.14, "highland": 0.11, "lmhi": 0.20, "lmmtn": 0.22}


def can_desert(band):
    return band is None or band == "desert"


def th_get(th, k, default):
    if th is None:
        return default
    v = th.get(k)
    return default if v is None else vf(v)


def classify(elev, lm, mtn, forn, desn, th, band, bias):
    des_th = th_get(th, "desert", D_DES)
    mtn_th = th_get(th, "mountain", D_MTN)
    hi_th = th_get(th, "highland", D_HI)
    g = elev_gates(mtn_th)
    if elev < ELEV_SEA:
        return "morze" if lm < LM_SEA else "laka"
    is_hi = mtn > hi_th and lm > g["lmhi"]
    is_mtn = mtn > mtn_th and lm > g["lmmtn"]
    if is_mtn and elev > g["mountain"]:
        return "gory"
    if is_hi and elev > g["highland"]:
        return "wzgorza"
    if can_desert(band) and desn > des_th and elev > DES_LO and elev < DES_HI:
        return "pustynia"
    if elev + jitter(forn, desn, bias) > PLAINS:
        return "rownina"
    return "laka"


def classify_flat(elev, lm, mtn, forn, desn, th, band, bias):
    des_th = th_get(th, "desert", D_DES)
    if elev < ELEV_SEA:
        return "laka"
    if can_desert(band) and desn > des_th and elev > DES_LO and elev < DES_HI:
        return "pustynia"
    if elev + jitter(forn, desn, bias) > PLAINS:
        return "rownina"
    return "laka"


def is_water(tb):
    return tb == "morze" or tb == "plytkie_morze"


def forest_eligible(tb):
    return (not is_water(tb)) and tb != "gory" and tb != "pustynia" and tb != "polarny"


class Hx:
    __slots__ = ("q", "r", "tb", "nak", "riv", "edges", "zl")

    def __init__(self, q, r, tb, nak, riv, edges, zl):
        self.q, self.r, self.tb, self.nak, self.riv, self.edges, self.zl = q, r, tb, nak, riv, edges, zl


def decode_spec(spec):
    hexes = {}
    for q, r, tb, nak, riv, zl in spec:
        hexes[key(q, r)] = Hx(q, r, E_TB[tb], E_NAK[nak], bool(riv), [0, 3] if riv else [], bool(zl))
    return hexes


def dump_state(hexes):
    return [[h.q, h.r, E_TB.index(h.tb), E_NAK.index(h.nak), 1 if h.riv else 0, len(h.edges), 1 if h.zl else 0] for h in hexes.values()]


def set_morze(h):
    h.tb = "morze"
    h.nak = "brak"
    h.riv = False
    h.edges = []
    h.zl = False


def set_laka(h):
    h.tb = "laka"
    h.nak = "brak"
    h.zl = False


def reapply_land(hexes, scratch, seed, th, map_height, tier):
    cands = []
    land_count = 0
    for k, hx in hexes.items():
        if is_water(hx.tb):
            continue
        s = scratch.get(k)
        if s is None:
            continue
        land_count += 1
        band = climate_band_at(hx.r, map_height) if map_height else None
        bias = cell_bias(float(hx.q), float(hx.r), seed)
        full = classify(s[0], s[1], s[2], s[3], s[4], th, band, bias)
        if full == "gory" or full == "wzgorza":
            flat = classify_flat(s[0], s[1], s[2], s[3], s[4], th, band, bias)
            hx.tb = flat
            hx.nak = "brak"
            cands.append((k, s[2], full))
        else:
            hx.tb = "laka" if full == "morze" else full
            hx.nak = "brak"
    if not cands:
        return
    cands = sorted(cands, key=lambda c: -c[1])  # stabilnie malejaco po mtnNoise
    budget = math.floor(land_count * RELIEF_BUDGET[tier])
    for i in range(min(budget, len(cands))):
        k, _, want = cands[i]
        hx = hexes.get(k)
        if hx is None:
            continue
        hx.tb = want
        hx.nak = "brak"


def sea_distance(hexes):
    dist = {}
    queue = []
    for k, hx in hexes.items():
        if is_water(hx.tb):
            dist[k] = 0
            queue.append(k)
    qi = 0
    while qi < len(queue):
        k = queue[qi]
        qi += 1
        d = dist[k]
        q, r = parse_key(k)
        for dq, dr in HEXDIR:
            nk = key(q + dq, r + dr)
            if nk in dist:
                continue
            if nk not in hexes:
                continue
            dist[nk] = d + 1
            queue.append(nk)
    return dist


def group_land_masses(hexes):
    visited = set()
    groups = []
    for k, hx in hexes.items():
        if is_water(hx.tb):
            continue
        if k in visited:
            continue
        mass = []
        stack = [k]
        visited.add(k)
        while stack:
            kk = stack.pop()
            mass.append(kk)
            q, r = parse_key(kk)
            for dq, dr in HEXDIR:
                nk = key(q + dq, r + dr)
                if nk in visited:
                    continue
                nh = hexes.get(nk)
                if nh is None or is_water(nh.tb):
                    continue
                visited.add(nk)
                stack.append(nk)
        groups.append(mass)
    return groups


def partitions_for(hexes, typ, continent_of, n_cont):
    if (typ == "kontynenty" or typ == "wyspy") and continent_of is not None and n_cont > 0:
        zones = [[] for _ in range(int(n_cont))]
        for k, hx in hexes.items():
            if is_water(hx.tb):
                continue
            ci = min(n_cont - 1, max(0, continent_of.get(k, 0)))
            zones[int(ci)].append(k)
        return [z for z in zones if z]
    return group_land_masses(hexes)


def land_by_cell(mass_set, cell_size):
    cells = {}
    for k in mass_set:
        q, r = parse_key(k)
        ck = f"{int(js_floor(q / cell_size))},{int(js_floor(r / cell_size))}"
        cells.setdefault(ck, []).append([q, r])
    return cells  # dict zachowuje kolejnosc wstawiania jak Map


def reapply_forest(hexes, scratch, typ, tier, continent_of, n_cont, map_height):
    share = FOREST_SHARE[tier]
    cell_size = FOREST_CELL[tier]
    min_land = max(MIN_LAND_FLOOR, math.floor(cell_size * MIN_LAND_MUL))
    sea = sea_distance(hexes)
    for hx in hexes.values():
        if hx.nak == "las":
            hx.nak = "brak"
    assigned = 0
    for part in partitions_for(hexes, typ, continent_of, n_cont):
        mass_set = list(dict.fromkeys(k for k in part if (k not in hexes) or not is_water(hexes[k].tb)))
        max_sea = 1
        for k in mass_set:
            d = sea.get(k, 0)
            if d > max_sea:
                max_sea = d
        for land in land_by_cell(mass_set, cell_size).values():
            if len(land) < min_land:
                continue
            eligible = []
            for q, r in land:
                h = hexes.get(key(q, r))
                if h is None or not forest_eligible(h.tb) or h.nak != "brak":
                    continue
                if map_height and climate_band_at(r, map_height) == "desert":
                    continue
                sd = sea.get(key(q, r), 0)
                boost = (sd / max_sea) * INLAND if max_sea > 1 else 0
                eligible.append((key(q, r), scratch.get(key(q, r), 0.0) + boost))
            eligible = sorted(eligible, key=lambda e: -e[1])
            if not eligible:
                continue
            mid = land[len(land) // 2]
            band = climate_band_at(mid[1], map_height) if map_height else "temperate_north"
            zmul = ZMUL_T if band in ("temperate_north", "temperate_south") else ZMUL_O
            min_forest = 0 if typ == "pangea" else 1
            target = max(min_forest, js_round(len(eligible) * share * zmul))
            cap = min(target, max(CAP_MIN, math.ceil(len(eligible) * FOREST_CAP)))
            for i in range(int(min(cap, len(eligible)))):
                hexes[eligible[i][0]].nak = "las"
                assigned += 1
    return assigned


def border_dist(q, r, w, h):
    return js_min(q, r, w - 1 - q, h - 1 - r)


def margin_cap(d):
    if d < BORDER_OCEAN:
        return 0.0
    if d <= MARGIN_ZONE:
        return CAP_STEP * (d - 1)
    return None


def center_norm(q, r, w, h):
    cx = (w - 1) / 2
    cy = (h - 1) / 2
    dx = js_div(q - cx, cx + 0.5)
    dy = js_div(r - cy, cy + 0.5)
    return js_sqrt(dx * dx + dy * dy)


def radial_bias(q, r, w, h):
    dist = center_norm(q, r, w, h)
    return js_max(RAD_MIN, 1 - js_pow2(js_div(dist, RAD_R)))


def edge_fade(q, r, w, h):
    b = BORDER_OCEAN
    nq = js_div(q, js_max(1, w - 1))
    nr = js_div(r, js_max(1, h - 1))
    mq = js_div(b, js_max(1, w - 1))
    mr = js_div(b, js_max(1, h - 1))
    return js_min(
        js_div(js_min(nq, 1 - nq), js_max(mq, EDGE_MIN)),
        js_div(js_min(nr, 1 - nr), js_max(mr, EDGE_MIN)),
        1,
    )


def mask_fade(q, r, w, h):
    d = border_dist(q, r, w, h)
    cap = margin_cap(d)
    if cap is None:
        return 1.0
    if cap <= 0:
        return 0.0
    return js_min(1, cap / FADE_FULL)


def in_border(q, r, w, h, buf=None):
    b = BORDER_OCEAN if buf is None else buf
    return border_dist(q, r, w, h) < b


def scatter(q, r, scores):
    base = scores.get(key(q, r), 0.0)
    n = (to_int32(js_mul(q, 73856093.0)) ^ to_int32(js_mul(r, 19349663.0))) & 0xFFFF
    return base + (n / 0xFFFF) * SCATTER_W


def land_neighbors(hexes, q, r):
    n = 0
    for dq, dr in HEXDIR:
        nh = hexes.get(key(q + dq, r + dr))
        if nh is not None and not is_water(nh.tb):
            n += 1
    return n


def morse_neighbors(hexes, q, r):
    n = 0
    for dq, dr in HEXDIR:
        nh = hexes.get(key(q + dq, r + dr))
        if nh is not None and is_water(nh.tb):
            n += 1
    return n


ERODE = ["plytkie_morze", "laka", "pustynia", "rownina", "wzgorza", "gory"]


def erode_rank(tb):
    return ERODE.index(tb) if tb in ERODE else len(ERODE)


def sort_for_erosion(keys, hexes, scores, w, h):
    def cmp(a, b):
        pa = parse_key(a)
        pb = parse_key(b)
        ba = border_dist(pa[0], pa[1], w, h)
        bb = border_dist(pb[0], pb[1], w, h)
        if ba != bb:
            return ba - bb
        ca = center_norm(pa[0], pa[1], w, h)
        cb = center_norm(pb[0], pb[1], w, h)
        if abs(ca - cb) > 0.015:
            return cb - ca
        na = morse_neighbors(hexes, pa[0], pa[1])
        nb = morse_neighbors(hexes, pb[0], pb[1])
        if na != nb:
            return nb - na
        ra = erode_rank(hexes[a].tb)
        rb = erode_rank(hexes[b].tb)
        if ra != rb:
            return ra - rb
        return scores.get(a, 0.0) - scores.get(b, 0.0)

    return v8_sort(list(keys), cmp)


def keys_at_distance(w, h, d):
    out = []
    for r in range(h):
        for q in range(w):
            if border_dist(q, r, w, h) != d:
                continue
            out.append(key(q, r))
    return out


def marginal_caps(hexes, scores, w, h):
    adjusted = 0
    d = 0
    while d <= MARGIN_ZONE:
        cap = margin_cap(float(d))
        this_d = d
        d += 1
        if cap is None:
            continue
        ring = keys_at_distance(w, h, this_d)
        if not ring:
            continue
        land = sum(1 for k in ring if not is_water(hexes[k].tb))
        target = js_round(len(ring) * cap)
        if land > target:
            land_keys = [k for k in ring if not is_water(hexes[k].tb)]
            for k in sort_for_erosion(land_keys, hexes, scores, w, h):
                if land <= target:
                    break
                set_morze(hexes[k])
                land -= 1
                adjusted += 1
        elif land < target:
            morse = [k for k in ring if is_water(hexes[k].tb)]

            def cmp(a, b):
                pa = parse_key(a)
                pb = parse_key(b)
                sa = scatter(pa[0], pa[1], scores)
                sb = scatter(pb[0], pb[1], scores)
                if abs(sb - sa) > TIE_TOL:
                    return sb - sa
                return land_neighbors(hexes, pa[0], pa[1]) - land_neighbors(hexes, pb[0], pb[1])

            morse = v8_sort(morse, cmp)
            for k in morse:
                if land >= target:
                    break
                q, r = parse_key(k)
                if land_neighbors(hexes, q, r) >= MAX_NEIGH:
                    continue
                set_laka(hexes[k])
                land += 1
                adjusted += 1
    return adjusted


def relief_candidate(hx, q, r, w, h):
    if is_water(hx.tb):
        return False
    return not in_border(q, r, w, h)


# ----------------------------------------------------------------------------------------------
# 3. Porownanie z wektorami z uruchomionego weba
# ----------------------------------------------------------------------------------------------
def cmp_state(actual, expected, what):
    exp = expected
    check(len(actual) == len(exp), f"{what}: liczba heksow {len(actual)} != {len(exp)}")
    for n, (a, e) in enumerate(zip(actual, exp)):
        if a != e:
            check(False, f"{what}: heks #{n} {a} != {e}")
            return
        checks_add()


def checks_add():
    global checks
    checks += 1


# stale / sumy kontrolne zrodla
import hashlib

check(hashlib.sha256(GH_TEXT.encode("utf-8")).hexdigest() == V["sha256"]["gen-helpers.ts"], "sha256 gen-helpers.ts != wektory (inny pin?)")
check(len(GH) - 1 == 12561, f"gen-helpers.ts: liczba linii {len(GH) - 1} != 12561 (pin edb8fb56)")

# 3.1 latBuffer
for r, h, e, want in CASES["latBuffer"]:
    check(is_in_lat_buffer(r, h, bool(e)) == bool(want), f"latBuffer r={r} h={h} e={e}")

# 3.2 hashInt3
for a, b, c, out in CASES["hashInt3"]:
    check(same(hash_int3(vf(a), vf(b), vf(c)), vf(out)), f"hashInt3 {a},{b},{c}")

# 3.3 cellBias
for q, r, seed, cs, out in CASES["cellBias"]:
    got = cell_bias(vf(q), vf(r), vf(seed), None if cs is None else vf(cs))
    check(same(got, vf(out)), f"cellBias {q},{r},{seed},{cs}: {got} != {out}")

# 3.4 jitter
for f_, d_, b_, out in CASES["jitter"]:
    check(same(jitter(vf(f_), vf(d_), vf(b_)), vf(out)), f"jitter {f_},{d_},{b_}")

# 3.5 elevGates
for th, m, hl, lh, lm in CASES["elevGates"]:
    g = elev_gates(vf(th))
    check(same(g["mountain"], vf(m)) and same(g["highland"], vf(hl)) and same(g["lmhi"], vf(lh)) and same(g["lmmtn"], vf(lm)), f"elevGates {th}")

# 3.6 classify / classifyFlat
for name, fn in (("classify", classify), ("classifyFlat", classify_flat)):
    for row in CASES[name]:
        elev, lm, mtn, fo, de, th, band, bias, tbc = row
        got = fn(vf(elev), vf(lm), vf(mtn), vf(fo), vf(de), th, band, 0.0 if bias is None else vf(bias))
        check(got == E_TB[tbc], f"{name} {row}: {got} != {E_TB[tbc]}")

# 3.7 reapplyLand
for n, c in enumerate(CASES["reapplyLand"]):
    hexes = decode_spec(c["spec"])
    scratch = {s[0]: [vf(x) for x in s[1:]] for s in c["scratch"]}
    th = c["th"]
    reapply_land(hexes, scratch, vf(c["seed"]), th, c["mapHeight"], c["tier"])
    cmp_state(dump_state(hexes), c["out"], f"reapplyLand #{n}")

# 3.8 reapplyForest (+ niezalezne policzenie zaleznosci i porownanie z wartosciami zapisanymi z weba)
for n, c in enumerate(CASES["reapplyForest"]):
    hexes = decode_spec(c["spec"])
    scratch = {s[0]: vf(s[1]) for s in c["scratch"]}
    cont = None if c["continentOf"] is None else {k: v for k, v in c["continentOf"]}
    deps = c["deps"]
    tier = c["tier"]
    check(same(FOREST_SHARE[tier], vf(deps["share"])), f"forest#{n} share")
    check(same(FOREST_CAP, vf(deps["capFrac"])), f"forest#{n} capFrac")
    check(same(FOREST_CELL[tier], vf(deps["cellSize"])), f"forest#{n} cellSize")
    check(same(max(MIN_LAND_FLOOR, math.floor(FOREST_CELL[tier] * MIN_LAND_MUL)), vf(deps["minLand"])), f"forest#{n} minLand")
    sd = sea_distance(hexes)
    exp_sd = {key(s[0], s[1]): vf(d) for s, d in zip(c["spec"], deps["seaDist"]) if d is not None}
    check(all(same(sd[k], v) for k, v in exp_sd.items()) and set(sd) == set(exp_sd), f"forest#{n} seaDist (niezaleznie policzona)")
    parts = partitions_for(hexes, c["typ"], cont, float(c["nContinents"]))
    check(parts == deps["partitions"], f"forest#{n} partycje (niezaleznie policzone)")
    for part, call in zip(parts, deps["cellCalls"]):
        mass_set = list(dict.fromkeys(k for k in part if (k not in hexes) or not is_water(hexes[k].tb)))
        cells = land_by_cell(mass_set, FOREST_CELL[tier])
        check([[ck, v] for ck, v in cells.items()] == call["cells"], f"forest#{n} komorki pokrycia (niezaleznie)")
    assigned = reapply_forest(hexes, scratch, c["typ"], tier, cont, float(c["nContinents"]), c["mapHeight"])
    check(assigned == c["assigned"], f"forest#{n} assigned {assigned} != {c['assigned']}")
    cmp_state(dump_state(hexes), c["out"], f"reapplyForest #{n}")

# 3.9 erosionSort
for n, c in enumerate(CASES["erosionSort"]):
    hexes = decode_spec(c["spec"])
    scores = {k: vf(v) for k, v in c["scores"]}
    got = sort_for_erosion(c["keys"], hexes, scores, c["w"], c["h"])
    check(got == c["out"], f"erosionSort #{n}")

# 3.10 marginZone
for n, c in enumerate(CASES["marginZone"]):
    hexes = decode_spec(c["spec"])
    scores = {k: vf(v) for k, v in c["scores"]}
    adj = marginal_caps(hexes, scores, c["w"], c["h"])
    check(adj == c["adjusted"], f"marginZone #{n} adjusted {adj} != {c['adjusted']}")
    cmp_state(dump_state(hexes), c["out"], f"marginZone #{n}")

# 3.11 setHex
for n, c in enumerate(CASES["setHex"]):
    hm = decode_spec(c["spec"])
    hl = decode_spec(c["spec"])
    for h in hm.values():
        set_morze(h)
    for h in hl.values():
        set_laka(h)
    cmp_state(dump_state(hm), c["morze"], f"setHex morze #{n}")
    cmp_state(dump_state(hl), c["laka"], f"setHex laka #{n}")

# 3.12 marginCap
for d, out in CASES["marginCap"]:
    got = margin_cap(vf(d))
    if out is None:
        check(got is None, f"marginCap {d}")
    else:
        check(got is not None and same(got, vf(out)), f"marginCap {d}")

# 3.13 fades
for row in CASES["fades"]:
    q, r, w, h = (vf(x) for x in row[:4])
    check(same(mask_fade(q, r, w, h), vf(row[4])), f"landMaskBorderFade {row[:4]}")
    check(same(radial_bias(q, r, w, h), vf(row[5])), f"mapCenterRadialBias {row[:4]}")
    check(same(edge_fade(q, r, w, h), vf(row[6])), f"mapEdgeRectFade {row[:4]}")
    check(same(center_norm(q, r, w, h), vf(row[7])), f"mapCenterDistanceNorm {row[:4]}")
    check(same(border_dist(q, r, w, h), vf(row[8])), f"hexBorderDistance {row[:4]}")
    check(in_border(q, r, w, h) == bool(row[9]), f"isInMapBorder {row[:4]}")
    check((border_dist(q, r, w, h) <= MARGIN_ZONE) == bool(row[10]), f"isInMapMarginZone {row[:4]}")

for q, r, w, h, b, out in CASES["inBorderBuf"]:
    check(in_border(vf(q), vf(r), vf(w), vf(h), vf(b)) == bool(out), f"isInMapBorder buf {q},{r},{w},{h},{b}")

# 3.14 borderGrid
for n, c in enumerate(CASES["borderGrid"]):
    w, h = c["w"], c["h"]
    hexes = decode_spec(c["spec"])
    for b, expect in zip(c["buffers"], c["counts"]):
        bb = BORDER_OCEAN if b is None else vf(b)
        cnt = sum(1 for r in range(h) for q in range(w) if border_dist(q, r, w, h) < bb)
        check(cnt == expect, f"countMapBorderHexes #{n} {b}: {cnt} != {expect}")
    found = []
    for r in range(h):
        for q in range(w):
            if border_dist(q, r, w, h) >= BORDER_OCEAN:
                continue
            hx = hexes.get(key(q, r))
            if hx is None or hx.tb == "morze":
                continue
            found.append(key(q, r))
    check(found == c["found"], f"findLandInMapBorder #{n}")
    eb = BORDER_OCEAN if c["enforceBuffer"] is None else vf(c["enforceBuffer"])
    conv = 0
    enforced = decode_spec(c["spec"])
    for r in range(h):
        for q in range(w):
            if not (border_dist(q, r, w, h) < eb):
                continue
            hx = enforced.get(key(q, r))
            if hx is None or hx.tb == "morze":
                continue
            set_morze(hx)
            conv += 1
    check(conv == c["converted"], f"enforceMapBorderOcean #{n} converted {conv} != {c['converted']}")
    cmp_state(dump_state(enforced), c["enforceOut"], f"enforceMapBorderOcean #{n}")
    for d, expect in enumerate(c["keysAt"]):
        dd = 0.5 if d == 13 else d
        check(keys_at_distance(w, h, dd) == expect, f"keysAtBorderDistance #{n} d={dd}")
    for hx, (ln, rel) in zip(hexes.values(), c["perHex"]):
        check(land_neighbors(hexes, hx.q, hx.r) == ln, f"countLandNeighborsInSet #{n}")
        check(relief_candidate(hx, hx.q, hx.r, w, h) == bool(rel), f"isReliefCandidateHex #{n}")

# 3.15 scatter
for q, r, sv, out in CASES["scatter"]:
    scores = {} if sv is None else {key(q, r): vf(sv)}
    check(same(scatter(q, r, scores), vf(out)), f"marginScatterScore {q},{r}")

# ----------------------------------------------------------------------------------------------
# kazda wartosc tabeli (liscie {wartosc, zrodlo_web}) musi byc porownana z TS
LEAVES = set()


def walk(node, path):
    if isinstance(node, dict):
        if "wartosc" in node and "zrodlo_web" in node:
            LEAVES.add(path)
            return
        for k, v in node.items():
            if k != "meta":
                walk(v, f"{path}/{k}" if path else k)


walk(TBL, "")
check(LEAVES == CHECKED, f"wartosci tabeli niesprawdzone: {sorted(LEAVES - CHECKED)}; nadmiarowe: {sorted(CHECKED - LEAVES)}")
print(f"wartosci tabeli sprawdzone wzgledem TS: {len(CHECKED)}/{len(LEAVES)}")
print(f"checks={checks} rozbieznosci={bad}")
sys.exit(1 if bad else 0)
