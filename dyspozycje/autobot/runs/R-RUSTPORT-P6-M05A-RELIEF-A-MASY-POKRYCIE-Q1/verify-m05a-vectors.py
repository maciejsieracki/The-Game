#!/usr/bin/env python3
"""NIEZALEZNY weryfikator P6.M05A (relief A: masy ladu, pokrycie siatki fair play).

Reimplementuje w Pythonie logike z KODU TS (specyfikacja: gen-helpers.ts :1408-2365, pin edb8fb56,
oraz fallback sufitu z map-gen-params-loader.ts :36-40) BEZ wykonywania TS, BEZ generatora, BEZ Rust,
i porownuje wynik z wektorami z uruchomionego weba (tests/p6_m05a_vectors/web-vectors.json). Dodatkowo:
  - wyciaga regexem z TS (po numerach linii pinu) KAZDA wartosc balansu i porownuje z tabela
    `data/derived/mapgen-relief-a.json` (zbior sprawdzonych == zbior lisci tabeli),
  - audytuje literaly liczbowe zakresu 1408-2365: kazdy literal inny niz {0, 1, 2} musi lezec w
    linii wskazanej przez `zrodlo_web` tabeli,
  - ma WLASNY TimSort V8 (z opisu algorytmu; skopiowany z weryfikatora P6.M04/M10),
  - ma WLASNY mulberry32 (imul/ToInt32 w liczbach calkowitych Pythona) i WLASNE Math.round/min/max
    (NaN, -0, Fraction),
  - liczy NIEZALEZNIE masy ladu, komorki siatki i odwolania do komorek (len + skrot FNV-1a).

Uzycie: verify-m05a-vectors.py <WEB_ROOT> <WEB_VECTORS_JSON> <TABLE_JSON>
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
LOADER_TEXT = open(f"{web_root}/gra/src/data/map-gen-params-loader.ts", encoding="utf-8").read()
LD = LOADER_TEXT.split("\n")
PARAMS = json.load(open(f"{web_root}/gra/data/map-gen-params.json", encoding="utf-8"))
CASES = V["cases"]
E_TB = V["enums"]["tb"]
E_NAK = V["enums"]["nak"]
POOL = V["maps"]

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
# 1. Literaly z TS (regex po zrodle, numery linii z pinu) vs tabela silnika
# ----------------------------------------------------------------------------------------------
def line(n):
    return GH[n - 1]


def ldline(n):
    return LD[n - 1]


NUM = r"(\d+(?:\.\d+)?)"


def tv(path):
    node = TBL
    for p in path.split("/"):
        node = node[p]
    return node["wartosc"], node["zrodlo_web"]


CHECKED = set()


def grab(text, rx, count, where):
    m = re.search(rx, text)
    check(m is not None, f"{where}: regex {rx!r} nie pasuje do: {text!r}")
    return [float(m.group(i + 1)) for i in range(count)] if m else [None] * count


def table_check(path, ts_value, file_prefix, n):
    CHECKED.add(path)
    value, src = tv(path)
    check(src == f"{file_prefix}:{n}", f"{path}: zrodlo_web {src} != {file_prefix}:{n}")
    check(ts_value is not None and same(value, ts_value), f"tabela {path}={value} != TS {ts_value} ({src})")


GHP = "gra/src/map/gen-helpers.ts"
LDP = "gra/src/data/map-gen-params-loader.ts"

# wartosci TS uzywane DALEJ przez logike (NIE z tabeli - niezaleznie)
TS = {}

TS["center_size"] = grab(line(1460), r"CONTINENT_CENTER_SQUARE_SIZE = " + NUM, 1, "1460")[0]
table_check("kwadrat_centrum/rozmiar_boku", TS["center_size"], GHP, 1460)

TS["forest_share"] = {}
for tier, n in (("low", 1591), ("medium", 1592), ("high", 1593)):
    TS["forest_share"][tier] = grab(line(n), tier + r": " + NUM, 1, str(n))[0]
    table_check(f"las/udzial_suchego_ladu/{tier}", TS["forest_share"][tier], GHP, n)
TS["forest_cap"] = grab(line(1605), r"FOREST_OVERLAY_CAP_FRAC = " + NUM, 1, "1605")[0]
table_check("las/sufit_nakladki_ulamek", TS["forest_cap"], GHP, 1605)

TS["bonus"] = {"gory": {}, "wzgorza": {}}
for name, n in (("gory", 1621), ("wzgorza", 1626)):
    hi, lo, me = grab(line(n), r"tier === 'high' \? " + NUM + r" : tier === 'low' \? " + NUM + r" : " + NUM + r";", 3, str(n))
    TS["bonus"][name] = {"high": hi, "low": lo, "medium": me}
    for tier in ("low", "medium", "high"):
        table_check(f"limit_bonusu_reliefu/{name}/{tier}", TS["bonus"][name][tier], GHP, n)

TS["spread_mtn"] = grab(line(1678), r"pickSpreadReliefKeys\(candidates, nMtn, " + NUM + r"\)", 1, "1678")[0]
TS["spread_hi"] = grab(line(1717), r"pickSpreadReliefKeys\(candidates, nHi, " + NUM + r"\)", 1, "1717")[0]
table_check("rozrzut_reliefu/min_odleglosc_gor", TS["spread_mtn"], GHP, 1678)
table_check("rozrzut_reliefu/min_odleglosc_wzgorz", TS["spread_hi"], GHP, 1717)

TS["min_cell"] = {"gory": {}, "wzgorza": {}}
for name, n in (("gory", 1779), ("wzgorza", 1780)):
    lo, me, hi = grab(line(n), r"\{ low: " + NUM + r", medium: " + NUM + r", high: " + NUM + r" \}", 3, str(n))
    TS["min_cell"][name] = {"low": lo, "medium": me, "high": hi}
    for tier in ("low", "medium", "high"):
        table_check(f"minima_komorki/{name}/{tier}", TS["min_cell"][name][tier], GHP, n)

TS["cell_size"] = {}
for name, first in (("woda", 1800), ("zelazo", 1810), ("miedz", 1820), ("las", 1839)):
    hi = grab(line(first), r"tier === 'high'\) return " + NUM + r";", 1, str(first))[0]
    lo = grab(line(first + 1), r"tier === 'low'\) return " + NUM + r";", 1, str(first + 1))[0]
    me = grab(line(first + 2), r"^\s*return " + NUM + r";", 1, str(first + 2))[0]
    TS["cell_size"][name] = {"low": lo, "medium": me, "high": hi}
    table_check(f"rozmiary_komorek/{name}/high", hi, GHP, first)
    table_check(f"rozmiary_komorek/{name}/low", lo, GHP, first + 1)
    table_check(f"rozmiary_komorek/{name}/medium", me, GHP, first + 2)

TS["minland_floor"], TS["minland_frac"] = grab(
    line(1849), r"Math\.max\(" + NUM + r", Math\.floor\(cellSize \* " + NUM + r"\)\)", 2, "1849")
table_check("min_ladu_w_komorce/dolna_granica", TS["minland_floor"], GHP, 1849)
table_check("min_ladu_w_komorce/ulamek_rozmiaru_komorki", TS["minland_frac"], GHP, 1849)

TS["min_river"] = grab(line(1777), r"MIN_RIVER_SOURCES_PER_WATER_CELL = " + NUM, 1, "1777")[0]
table_check("pokrycie/min_zrodel_rzek_na_komorke_wody", TS["min_river"], GHP, 1777)
TS["copper_mult"] = grab(line(2005), r"Math\.round\(ironCellSize \* " + NUM + r"\)", 1, "2005")[0]
table_check("pokrycie/mnoznik_miedzi_wzgledem_zelaza", TS["copper_mult"], GHP, 2005)
TS["cover_th"] = grab(line(2021), r"\) >= " + NUM + r";", 1, "2021")[0]
table_check("pokrycie/prog_pokrycia_siatki", TS["cover_th"], GHP, 2021)

TS["hi_mul"] = grab(line(2055), r"score \*= " + NUM + r";", 1, "2055")[0]
TS["border_cap"], TS["border_w"] = grab(
    line(2056), r"Math\.min\(" + NUM + r", hexBorderDistance\(q, r, width, height\)\) \* " + NUM + r";", 2, "2056")
TS["shallow_pen"] = grab(line(2057), r"score -= " + NUM + r";", 1, "2057")[0]
TS["rand_w"] = grab(line(2058), r"score \+= rand\(\) \* " + NUM + r";", 1, "2058")[0]
TS["guard_extra"] = grab(line(2084), r"guard\+\+ < land\.length \+ " + NUM + r"\)", 1, "2084")[0]
TS["passes"] = grab(line(2317), r"pass < " + NUM + r";", 1, "2317")[0]
check(grab(line(2352), r"pass < " + NUM + r";", 1, "2352")[0] == TS["passes"], "2352: liczba przebiegow miedzi != zelaza")
for path, val, n in (
    ("wymuszanie/mnoznik_wyniku_wzgorza", TS["hi_mul"], 2055),
    ("wymuszanie/limit_odleglosci_od_brzegu", TS["border_cap"], 2056),
    ("wymuszanie/waga_odleglosci_od_brzegu", TS["border_w"], 2056),
    ("wymuszanie/kara_plytkie_morze", TS["shallow_pen"], 2057),
    ("wymuszanie/waga_losowa", TS["rand_w"], 2058),
    ("wymuszanie/dodatek_do_straznika_petli", TS["guard_extra"], 2084),
    ("wymuszanie/max_przebiegow_domykania_komorek", TS["passes"], 2317),
):
    table_check(path, val, GHP, n)

TS["cap_mult"] = grab(line(2181), r"RELIEF_OVERFLOW_CAP_MULT = " + NUM + r";", 1, "2181")[0]
table_check("sufit_przepelnienia/mnoznik", TS["cap_mult"], GHP, 2181)
TS["fb_cap"] = {"gory": {}, "wzgorza": {}}
for tier, n in (("low", 37), ("medium", 38), ("high", 39)):
    m_, h_ = grab(ldline(n), tier + r": \{ mountain: " + NUM + r", highland: " + NUM + r" \}", 2, f"loader:{n}")
    TS["fb_cap"]["gory"][tier] = m_
    TS["fb_cap"]["wzgorza"][tier] = h_
    table_check(f"sufit_przepelnienia/fallback_gory/{tier}", m_, LDP, n)
    table_check(f"sufit_przepelnienia/fallback_wzgorza/{tier}", h_, LDP, n)

# stale z zakresu M04 uzywane przez relief (bufor brzegu, udzialy reliefu) - z TS, nie z Rust
TS["border"] = grab(GH_TEXT, r"export const MAP_BORDER_OCEAN_HEXES = " + NUM + r";", 1, "MAP_BORDER_OCEAN_HEXES")[0]
TS["relief_frac"] = {}
m0 = re.search(r"const FALLBACK_RELIEF_FRAC: Record<ReliefDensityTier, \{ mountain: number; highland: number \}> = \{\n(.*?)\n\};", GH_TEXT, re.S)
check(m0 is not None, "FALLBACK_RELIEF_FRAC nie znaleziono")
for tier in ("low", "medium", "high"):
    mm = re.search(tier + r": \{ mountain: " + NUM + r", highland: " + NUM + r" \}", m0.group(1))
    check(mm is not None, f"FALLBACK_RELIEF_FRAC.{tier}")
    TS["relief_frac"][tier] = (float(mm.group(1)), float(mm.group(2)))

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

# ----------------------------------------------------------------------------------------------
# 1b. Audyt literalow liczbowych zakresu 1408-2365: poza {0,1,2} tylko w liniach zrodel tabeli
# ----------------------------------------------------------------------------------------------
TABLE_LINES = set()


def collect_lines(node):
    if isinstance(node, dict):
        if "zrodlo_web" in node:
            m = re.match(rf"{re.escape(GHP)}:(\d+)$", node["zrodlo_web"])
            if m:
                TABLE_LINES.add(int(m.group(1)))
            for extra in re.findall(rf"{re.escape(GHP)}:(\d+)", node.get("uwaga", "")):
                TABLE_LINES.add(int(extra))
            return
        for v in node.values():
            collect_lines(v)


collect_lines(TBL)
in_block = False
AUDIT = []
for n in range(1408, 2366):
    t = line(n)
    code = t
    if in_block:
        if "*/" in code:
            code = code.split("*/", 1)[1]
            in_block = False
        else:
            continue
    # usun bloki /* ... */ w jednej linii
    code = re.sub(r"/\*.*?\*/", "", code)
    if "/*" in code:
        code = code.split("/*", 1)[0]
        in_block = True
    code = code.split("//", 1)[0]
    code = re.sub(r"'[^']*'", "''", code)
    code = re.sub(r"`[^`]*`", "``", code)
    for m in re.finditer(r"(?<![\w.])\d+(?:\.\d+)?(?![\w])", code):
        val = float(m.group(0))
        if val in (0.0, 1.0, 2.0):
            continue
        AUDIT.append((n, m.group(0), t.strip()))
        check(n in TABLE_LINES, f"literal {m.group(0)} w gen-helpers.ts:{n} poza zrodlami tabeli: {t.strip()!r}")
print(f"audyt literalow: {len(AUDIT)} literalow poza {{0,1,2}}, wszystkie w liniach zrodel tabeli")

# ----------------------------------------------------------------------------------------------
# 2. Logika (z KODU TS) - reimplementacja w Pythonie
# ----------------------------------------------------------------------------------------------
DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]
TIERS = ["low", "medium", "high"]


def num_str(f):
    f = float(f)
    if math.isnan(f):
        return "NaN"
    if math.isinf(f):
        return "Infinity" if f > 0 else "-Infinity"
    if f == 0.0:
        return "0"
    if f == math.floor(f) and abs(f) < 1e21:
        return str(int(f))
    return repr(f)


def hk(q, r):
    return f"{num_str(q)},{num_str(r)}"


def is_water(tb):
    return tb in ("morze", "plytkie_morze")


def forest_eligible(tb):
    return (not is_water(tb)) and tb not in ("gory", "pustynia", "polarny")


def river_land(tb):
    return tb in ("laka", "rownina", "wzgorza", "gory", "pustynia", "polarny")


def fnv1a64(s):
    h = 0xCBF29CE484222325
    for b in s.encode("utf-8"):
        h ^= b
        h = (h * 0x100000001B3) & 0xFFFFFFFFFFFFFFFF
    return f"{h:016x}"


def uniq(seq):
    return list(dict.fromkeys(seq))


def tier_get(tbl, tier):
    return tbl[tier]


def min_mtn(tier):
    return TS["min_cell"]["gory"][tier]


def min_hi(tier):
    return TS["min_cell"]["wzgorza"][tier]


def iron_size(tier):
    return TS["cell_size"]["zelazo"][tier]


def copper_size(tier):
    return TS["cell_size"]["miedz"][tier]


def min_land(size):
    return js_max2(TS["minland_floor"], js_floor(js_mul(size, TS["minland_frac"])))


def overflow_frac(tier, params=None):
    """mapGenReliefOverflowCapFrac (map-gen-params-loader.ts:154-163) z JSON weba + fallback z TS."""
    src = (params or PARAMS).get("gestosc", {}).get("relief_overflow_cap_frac")
    row = src.get(tier) if isinstance(src, dict) else None
    fbm, fbh = TS["fb_cap"]["gory"][tier], TS["fb_cap"]["wzgorza"][tier]
    if not isinstance(row, dict):
        return fbm, fbh

    def ok(v):
        return isinstance(v, (int, float)) and not isinstance(v, bool) and v > 0

    return (float(row["mountain"]) if ok(row.get("mountain")) else fbm,
            float(row["highland"]) if ok(row.get("highland")) else fbh)


def bonus_cap_mtn(tier, n):
    return js_max2(0, js_ceil(js_mul(n, TS["bonus"]["gory"][tier])))


def bonus_cap_hi(tier, n):
    return js_max2(0, js_ceil(js_mul(n, TS["bonus"]["wzgorza"][tier])))


def spread_cap_mtn(tier, n):
    return js_max2(min_mtn(tier), js_ceil(js_mul(n, overflow_frac(tier)[0])))


def spread_cap_hi(tier, n):
    return js_max2(min_hi(tier), js_ceil(js_mul(n, overflow_frac(tier)[1])))


def relief_frac(tier):
    return TS["relief_frac"][tier]


def border_dist(q, r, w, h):
    return js_min(q, r, w - 1 - q, h - 1 - r)


def in_border(q, r, w, h):
    return border_dist(q, r, w, h) < TS["border"]


def relief_candidate(hx, q, r, w, h):
    if is_water(hx["tb"]):
        return False
    return not in_border(q, r, w, h)


# --- mapy z puli -------------------------------------------------------------------------------
TEMPLATES = {}


def pool_template(mid):
    if mid in TEMPLATES:
        return TEMPLATES[mid]
    m = POOL[mid]
    check(m["id"] == mid, f"id mapy {mid}")
    hexes = {}
    scratch = {}
    for i in range(len(m["q"])):
        q, r = m["q"][i], m["r"][i]
        k = f"{q},{r}"
        hexes[k] = {"q": q, "r": r, "tb": E_TB[int(m["tb"][i])], "nak": E_NAK[int(m["nak"][i])],
                    "riv": m["riv"][i] == "1", "zl": m["zl"][i] == "1"}
        if m["noise"][i] is not None:
            scratch[k] = vf(m["noise"][i])
    TEMPLATES[mid] = (hexes, scratch, float(m["w"]), float(m["h"]))
    return TEMPLATES[mid]


def fresh(mid):
    hexes, scratch, w, h = pool_template(mid)
    return {k: dict(v) for k, v in hexes.items()}, scratch, w, h


def dump(hexes):
    tb = "".join(str(E_TB.index(h["tb"])) for h in hexes.values())
    nak = "".join(str(E_NAK.index(h["nak"])) for h in hexes.values())
    zl = "".join("1" if h["zl"] else "0" for h in hexes.values())
    return tb, nak, zl


BASE = {}


def base_of(mid):
    if mid not in BASE:
        BASE[mid] = dump(pool_template(mid)[0])
    return BASE[mid]


def diff_list(mid, hexes):
    bt, bn, bz = base_of(mid)
    at, an, az = dump(hexes)
    return [[i, at[i], an[i], az[i]] for i in range(len(bt)) if (bt[i], bn[i], bz[i]) != (at[i], an[i], az[i])]


def state_hash(hexes):
    tb, nak, zl = dump(hexes)
    return fnv1a64(f"{tb}|{nak}|{zl}")


def check_state(mid, hexes, case, what):
    check(diff_list(mid, hexes) == case["diff"], f"{what}: zmiany stanu")
    check(state_hash(hexes) == case["hash"], f"{what}: skrot stanu")


# --- mulberry32 (imul / ToInt32 w liczbach calkowitych) -----------------------------------------
def imul(a, b):
    return ((a & M32) * (b & M32)) & M32


class Rng:
    def __init__(self, seed):
        self.s = seed & M32
        self.n = 0

    def __call__(self):
        self.n += 1
        self.s = (self.s + 0x6D2B79F5) & M32
        t = imul(self.s ^ (self.s >> 15), 1 | self.s)
        t = (t ^ ((t + imul(t ^ (t >> 7), 61 | t)) & M32)) & M32
        return ((t ^ (t >> 14)) & M32) / 4294967296.0


# --- grupy, centroid, kwadrat -------------------------------------------------------------------
def pkey(k):
    parts = k.split(",")
    return int(parts[0]), int(parts[1])


def group_masses(hexes):
    visited = set()
    groups = []
    for key, hx in hexes.items():
        if is_water(hx["tb"]):
            continue
        if key in visited:
            continue
        mass = []
        stack = [key]
        visited.add(key)
        while stack:
            k = stack.pop()
            mass.append(k)
            q, r = pkey(k)
            for dq, dr in DIRS:
                nk = hk(q + dq, r + dr)
                if nk in visited:
                    continue
                nh = hexes.get(nk)
                if nh is None or is_water(nh["tb"]):
                    continue
                visited.add(nk)
                stack.append(nk)
        groups.append(mass)
    return groups


def centroid_of(hexes, mass_keys):
    sq = sr = 0
    count = 0
    for k in mass_keys:
        h = hexes.get(k)
        if h is None or not river_land(h["tb"]):
            continue
        q, r = pkey(k)
        sq += q
        sr += r
        count += 1
    if count == 0:
        return None
    return (sq / count, sr / count)


def center_square(hexes, mass_keys, size=None):
    size = TS["center_size"] if size is None else size
    land = [k for k in mass_keys if k in hexes and river_land(hexes[k]["tb"])]
    if not land:
        return None
    c = centroid_of(hexes, land)
    if c is None:
        return None
    qmin = rmin = math.inf
    qmax = rmax = -math.inf
    for k in land:
        q, r = pkey(k)
        qmin = js_min2(qmin, q)
        qmax = js_max2(qmax, q)
        rmin = js_min2(rmin, r)
        rmax = js_max2(rmax, r)
    span_q = qmax - qmin + 1
    span_r = rmax - rmin + 1
    if span_q <= size and span_r <= size:
        bb = (qmin, qmax, rmin, rmax)
    else:
        cq = js_round(c[0])
        cr = js_round(c[1])
        half = js_floor(size / 2)
        bb = (cq - half, cq + half, cr - half, cr + half)
    keys = []
    seen = set()
    for k in land:
        q, r = pkey(k)
        if q >= bb[0] and q <= bb[1] and r >= bb[2] and r <= bb[3]:
            if k not in seen:
                seen.add(k)
                keys.append(k)
    if not keys:
        for k in land:
            if k not in seen:
                seen.add(k)
                keys.append(k)
    return {"keys": keys, "bbox": bb, "centroid": c}


def axial_dist(q1, r1, q2, r2):
    dq = float(q1) - float(q2)
    dr = float(r1) - float(r2)
    return (abs(dq) + abs(dr) + abs(dq + dr)) / 2


def dist_center(q, r, sq):
    if sq is None or len(sq["keys"]) == 0:
        return 0.0
    if hk(q, r) in set(sq["keys"]):
        return 0.0
    min_d = math.inf
    for hkey in sq["keys"]:
        cq, cr = pkey(hkey)
        min_d = js_min2(min_d, axial_dist(q, r, cq, cr))
    return min_d


def cont_value(i, n, variant):
    if i % 19 == 5:
        return None
    v = (i * 7 + i // 5) % n
    if variant == 2:
        if i % 23 == 0:
            v = n + 5
        elif i % 29 == 0:
            v = -3
        elif i % 31 == 0:
            v = n
    return v


def cont_map(hexes, n, variant):
    cont = {}
    for i, (k, hx) in enumerate(hexes.items()):
        if is_water(hx["tb"]):
            continue
        v = cont_value(i, n, variant)
        if v is not None:
            cont[k] = v
    return cont


def partition(hexes, typ, cont, n):
    if typ in ("kontynenty", "wyspy") and cont is not None and n > 0:
        zones = [[] for _ in range(int(js_floor(n)))]
        for key, hx in hexes.items():
            if is_water(hx["tb"]):
                continue
            ci = js_min2(n - 1, js_max2(0, cont.get(key, 0)))
            zones[int(ci)].append(key)
        return [z for z in zones if z]
    return group_masses(hexes)


def land_by_cell(mass_set, size):
    cells = {}
    for key in mass_set:
        q, r = pkey(key)
        ck = f"{num_str(js_floor(js_div(q, size)))},{num_str(js_floor(js_div(r, size)))}"
        cells.setdefault(ck, []).append((q, r))
    return cells


# --- liczniki komorek ---------------------------------------------------------------------------
def hx_at(hexes, q, r):
    return hexes.get(f"{q},{r}")


def count_tb(cell, hexes, tb):
    n = 0
    for q, r in cell:
        h = hx_at(hexes, q, r)
        if h is not None and h["tb"] == tb:
            n += 1
    return n


def cnt_mtn(cell, hexes):
    return count_tb(cell, hexes, "gory")


def cnt_hi(cell, hexes):
    return count_tb(cell, hexes, "wzgorza")


def has_iron(cell, hexes, tier="medium"):
    return cnt_mtn(cell, hexes) >= min_mtn(tier)


def has_copper(cell, hexes, tier="medium"):
    return cnt_hi(cell, hexes) >= min_hi(tier)


def elig_relief(cell, hexes):
    n = 0
    for q, r in cell:
        h = hx_at(hexes, q, r)
        if h is not None and not is_water(h["tb"]):
            n += 1
    return n


def can_host(cell, hexes, minl):
    if elig_relief(cell, hexes) < minl:
        return False
    for q, r in cell:
        h = hx_at(hexes, q, r)
        if h is not None and h["riv"]:
            return True
    return False


def elig_forest(cell, hexes):
    n = 0
    for q, r in cell:
        h = hx_at(hexes, q, r)
        if h is not None and forest_eligible(h["tb"]):
            n += 1
    return n


def grid_ratio(mass_keys, hexes, size, pkg):
    mass_set = uniq(mass_keys)
    ml = min_land(size)
    need = hit = 0
    for land in land_by_cell(mass_set, size).values():
        if elig_relief(land, hexes) < ml:
            continue
        need += 1
        if pkg(land):
            hit += 1
    return hit / need if need > 0 else 1.0


def iron_ratio(keys, hexes, size, tier="medium"):
    return grid_ratio(keys, hexes, size, lambda land: has_iron(land, hexes, tier))


def copper_ratio(keys, hexes, size, tier="medium"):
    return grid_ratio(keys, hexes, size, lambda land: has_copper(land, hexes, tier))


def relief_ratio(keys, hexes, iron_cs, copper_cs=None):
    cs = copper_cs if copper_cs is not None else js_round(js_mul(iron_cs, TS["copper_mult"]))
    return (iron_ratio(keys, hexes, iron_cs) + copper_ratio(keys, hexes, cs)) / 2


def assert_cov(keys, hexes, tier):
    return relief_ratio(keys, hexes, iron_size(tier), copper_size(tier)) >= TS["cover_th"]


# --- rozmieszczanie (applyReliefByNoiseRank i spolka) -------------------------------------------
def pick_spread(cands, count, min_dist):
    if count <= 0 or len(cands) == 0:
        return []
    picked = []
    for k, _n in cands:
        if len(picked) >= count:
            break
        q, r = pkey(k)
        spaced = True
        for pk in picked:
            pq, pr = pkey(pk)
            dq = abs(q - pq)
            dr = abs(r - pr)
            ds = abs((-q - r) - (-pq - pr))
            d = js_max(dq, dr, ds)
            if not (d >= min_dist):
                spaced = False
                break
        if spaced:
            picked.append(k)
    for k, _n in cands:
        if len(picked) >= count:
            break
        if k not in picked:
            picked.append(k)
    return picked


def noise_of(scratch, k):
    return scratch.get(k, 0.0)


def candidates_for(land, hexes, scratch, skip, w, h):
    res = []
    for q, r in land:
        k = f"{q},{r}"
        hx = hexes.get(k)
        if hx is None or hx["tb"] == skip:
            continue
        if not relief_candidate(hx, q, r, w, h):
            continue
        res.append((k, noise_of(scratch, k)))
    return v8_sort(res, lambda a, b: b[1] - a[1])


def apply_iron(hexes, scratch, tier, keys, w, h):
    fr = relief_frac(tier)
    cs = iron_size(tier)
    ml = min_land(cs)
    mass_set = uniq(keys)
    for land in land_by_cell(mass_set, cs).values():
        if len(land) < ml:
            continue
        cands = candidates_for(land, hexes, scratch, "gory", w, h)
        if len(cands) == 0:
            continue
        bonus = js_round(js_mul(len(cands), fr[0]))
        n_mtn = js_min2(bonus, bonus_cap_mtn(tier, len(cands)))
        if n_mtn <= 0:
            continue
        for k in pick_spread(cands, n_mtn, TS["spread_mtn"]):
            hexes[k]["tb"] = "gory"
            hexes[k]["nak"] = "brak"


def apply_copper(hexes, scratch, tier, keys, w, h):
    fr = relief_frac(tier)
    cs = copper_size(tier)
    ml = min_land(cs)
    mass_set = uniq(keys)
    for land in land_by_cell(mass_set, cs).values():
        if len(land) < ml:
            continue
        cands = candidates_for(land, hexes, scratch, "wzgorza", w, h)
        if len(cands) == 0:
            continue
        bonus = js_round(js_mul(len(cands), fr[1]))
        n_hi = js_min2(bonus, bonus_cap_hi(tier, len(cands)))
        if n_hi <= 0:
            continue
        for k in pick_spread(cands, n_hi, TS["spread_hi"]):
            hexes[k]["tb"] = "wzgorza"
            hexes[k]["nak"] = "brak"


def apply_to_keys(hexes, scratch, tier, keys, w, h):
    if len(keys) == 0:
        return
    apply_iron(hexes, scratch, tier, keys, w, h)
    apply_copper(hexes, scratch, tier, keys, w, h)


def apply_rank(hexes, scratch, tier, w, h, typ, cont, n):
    for part in partition(hexes, typ, cont, n):
        keys = []
        for key in part:
            hx = hexes.get(key)
            if hx is None:
                continue
            q, r = pkey(key)
            if relief_candidate(hx, q, r, w, h):
                keys.append(key)
        apply_to_keys(hexes, scratch, tier, keys, w, h)


# --- wymuszanie ---------------------------------------------------------------------------------
def pick_force(land, hexes, scratch, w, h, want, avoid, rand, protect_hi, protect_mtn):
    filtered = []
    for q, r in land:
        k = f"{q},{r}"
        if k in avoid:
            continue
        hx = hexes.get(k)
        if hx is None or is_water(hx["tb"]):
            continue
        if want == "mountain" and hx["tb"] == "gory":
            continue
        if want == "highland" and hx["tb"] == "wzgorza":
            continue
        if want == "mountain" and protect_hi and hx["tb"] == "wzgorza":
            continue
        if want == "highland" and protect_mtn and hx["tb"] == "gory":
            continue
        filtered.append((q, r))
    ranked = []
    for q, r in filtered:
        k = f"{q},{r}"
        score = noise_of(scratch, k)
        if want == "highland":
            score *= TS["hi_mul"]
        score += js_min2(TS["border_cap"], border_dist(q, r, w, h)) * TS["border_w"]
        if hexes[k]["tb"] == "plytkie_morze":
            score -= TS["shallow_pen"]
        score += rand() * TS["rand_w"]
        ranked.append((q, r, score))
    ranked = v8_sort(ranked, lambda a, b: b[2] - a[2])
    if not ranked:
        return None
    return (ranked[0][0], ranked[0][1])


def force_type(land, hexes, scratch, w, h, rand, want, min_count, tier):
    def count():
        return cnt_mtn(land, hexes) if want == "mountain" else cnt_hi(land, hexes)

    if count() >= min_count:
        return False
    changed = False
    placed = set()
    guard = 0
    while count() < min_count:
        g = guard
        guard += 1
        if not (g < len(land) + TS["guard_extra"]):
            break
        protect_hi = want == "mountain" and cnt_hi(land, hexes) <= min_hi(tier)
        protect_mtn = want == "highland" and cnt_mtn(land, hexes) <= min_mtn(tier)
        spot = pick_force(land, hexes, scratch, w, h, want, placed, rand, protect_hi, protect_mtn)
        if spot is None:
            spot = pick_force(land, hexes, scratch, w, h, want, placed, rand, False, False)
        if spot is None:
            ranked = []
            for q, r in land:
                k = f"{q},{r}"
                if k in placed:
                    continue
                hx = hexes.get(k)
                if hx is None or is_water(hx["tb"]):
                    continue
                if want == "mountain" and hx["tb"] == "gory":
                    continue
                if want == "highland" and hx["tb"] == "wzgorza":
                    continue
                ranked.append((q, r, noise_of(scratch, k)))
            ranked = v8_sort(ranked, lambda a, b: b[2] - a[2])
            if not ranked:
                break
            spot = (ranked[0][0], ranked[0][1])
        k = f"{spot[0]},{spot[1]}"
        forced = hexes[k]
        forced["tb"] = "gory" if want == "mountain" else "wzgorza"
        forced["nak"] = "brak"
        forced["zl"] = False
        placed.add(k)
        changed = True
    return changed


def force_iron(land, hexes, scratch, w, h, rand, tier):
    return force_type(land, hexes, scratch, w, h, rand, "mountain", min_mtn(tier), tier)


def force_copper(land, hexes, scratch, w, h, rand, tier):
    return force_type(land, hexes, scratch, w, h, rand, "highland", min_hi(tier), tier)


def force_relief(land, hexes, scratch, w, h, rand):
    a = force_iron(land, hexes, scratch, w, h, rand, "medium")
    b = force_copper(land, hexes, scratch, w, h, rand, "medium")
    return a or b


# --- sufit przepelnienia ------------------------------------------------------------------------
def cap_mtn(land, hexes, scratch, tier, spread_only=False):
    mn = min_mtn(tier)
    base_max = spread_cap_mtn(tier, len(land)) if spread_only else js_max2(mn, bonus_cap_mtn(tier, len(land)) + mn)
    mx = base_max * TS["cap_mult"]
    mountains = []
    for q, r in land:
        h = hx_at(hexes, q, r)
        if h is not None and h["tb"] == "gory":
            mountains.append((q, r, noise_of(scratch, f"{q},{r}"), h["zl"]))
    mountains = v8_sort(mountains, lambda a, b: a[2] - b[2])
    changed = False
    total = len(mountains)
    i = 0
    while total > mx and total > mn and i < len(mountains):
        cand = mountains[i]
        if cand[3]:
            i += 1
            continue
        d = hexes[f"{cand[0]},{cand[1]}"]
        d["tb"] = "wzgorza"
        d["nak"] = "brak"
        d["zl"] = False
        changed = True
        total -= 1
        del mountains[i]
    return changed


def cap_hi(land, hexes, scratch, tier, spread_only=False):
    mn = min_hi(tier)
    base_max = spread_cap_hi(tier, len(land)) if spread_only else js_max2(mn, bonus_cap_hi(tier, len(land)) + mn)
    mx = base_max * TS["cap_mult"]
    hs = []
    for q, r in land:
        h = hx_at(hexes, q, r)
        if h is not None and h["tb"] == "wzgorza":
            hs.append((q, r, noise_of(scratch, f"{q},{r}"), h["zl"]))
    hs = v8_sort(hs, lambda a, b: a[2] - b[2])
    changed = False
    total = len(hs)
    i = 0
    while total > mx and total > mn and i < len(hs):
        cand = hs[i]
        if cand[3]:
            i += 1
            continue
        d = hexes[f"{cand[0]},{cand[1]}"]
        d["tb"] = "rownina"
        d["nak"] = "brak"
        d["zl"] = False
        changed = True
        total -= 1
        del hs[i]
    return changed


def cap_iron_spread(hexes, scratch, tier, mass_set):
    cs = iron_size(tier)
    ml = min_land(cs)
    for land in land_by_cell(uniq(mass_set), cs).values():
        if len(land) < ml:
            continue
        cap_mtn(land, hexes, scratch, tier, True)
        cap_hi(land, hexes, scratch, tier, True)


def cap_relief(land, hexes, scratch, tier):
    return cap_mtn(land, hexes, scratch, tier) or cap_hi(land, hexes, scratch, tier)


def ensure_mass(kind, hexes, scratch, tier, w, h, mass_set, rand, skip_cap):
    size = iron_size(tier) if kind == "iron" else copper_size(tier)
    ml = min_land(size)
    eligible = [land for land in land_by_cell(uniq(mass_set), size).values() if elig_relief(land, hexes) >= ml]
    fixed = 0

    def pkg(land):
        return has_iron(land, hexes, tier) if kind == "iron" else has_copper(land, hexes, tier)

    if not skip_cap:
        for land in eligible:
            if kind == "iron":
                cap_mtn(land, hexes, scratch, tier)
            else:
                cap_hi(land, hexes, scratch, tier)
    p = 0
    while p < TS["passes"]:
        inner = 0
        cells = v8_sort(list(eligible), lambda a, b: (1 if pkg(a) else 0) - (1 if pkg(b) else 0))
        for land in cells:
            if pkg(land):
                continue
            if kind == "iron":
                ch = force_iron(land, hexes, scratch, w, h, rand, tier)
            else:
                ch = force_copper(land, hexes, scratch, w, h, rand, tier)
            if ch:
                inner += 1
        fixed += inner
        if inner == 0:
            break
        p += 1
    return fixed


# ----------------------------------------------------------------------------------------------
# 3. Weryfikacja kategorii wektorow
# ----------------------------------------------------------------------------------------------
tiers_ok = TIERS

# 3.0 stale
C0 = CASES["consts"]
check(same(TS["center_size"], vf(C0["CONTINENT_CENTER_SQUARE_SIZE"])), "CONTINENT_CENTER_SQUARE_SIZE")
check(same(TS["min_river"], vf(C0["MIN_RIVER_SOURCES_PER_WATER_CELL"])), "MIN_RIVER_SOURCES_PER_WATER_CELL")
check(same(min_mtn("medium"), vf(C0["MIN_MOUNTAINS_IRON_CELL"])), "MIN_MOUNTAINS_IRON_CELL")
check(same(min_hi("medium"), vf(C0["MIN_HIGHLANDS_COPPER_CELL"])), "MIN_HIGHLANDS_COPPER_CELL")
check(same(TS["cap_mult"], vf(C0["RELIEF_OVERFLOW_CAP_MULT"])), "RELIEF_OVERFLOW_CAP_MULT")
check(same(TS["forest_cap"], vf(C0["FOREST_OVERLAY_CAP_FRAC"])), "FOREST_OVERLAY_CAP_FRAC")
for row in C0["perTier"]:
    t_ = row["tier"]
    check(same(TS["forest_share"][t_], vf(row["FOREST_SHARE_OF_DRY_LAND"])), f"FOREST_SHARE {t_}")
    check(same(min_mtn(t_), vf(row["RELIEF_MIN_MOUNTAINS"])) and same(min_mtn(t_), vf(row["minMountainsIronCell"])), f"min gory {t_}")
    check(same(min_hi(t_), vf(row["RELIEF_MIN_HIGHLANDS"])) and same(min_hi(t_), vf(row["minHighlandsCopperCell"])), f"min wzgorza {t_}")
    check(same(TS["cell_size"]["woda"][t_], vf(row["waterCoverageCellSize"])), f"woda {t_}")
    check(same(iron_size(t_), vf(row["ironCoverageCellSize"])), f"zelazo {t_}")
    check(same(copper_size(t_), vf(row["copperCoverageCellSize"])), f"miedz {t_}")
    check(same(iron_size(t_), vf(row["reliefCoverageCellSize"])), f"relief {t_}")
    check(same(iron_size(t_), vf(row["fairPlayResourceCellSize"])), f"fairplay {t_}")
    check(same(TS["cell_size"]["las"][t_], vf(row["forestCoverageCellSize"])), f"las {t_}")
    of = overflow_frac(t_)
    check(same(of[0], vf(row["overflowCapFrac"][0])) and same(of[1], vf(row["overflowCapFrac"][1])), f"sufit {t_}")
D0 = C0["defaults"]
check(same(min_mtn("medium"), vf(D0["minMountainsIronCell"])) and same(min_hi("medium"), vf(D0["minHighlandsCopperCell"])), "defaults min")
check(same(TS["cell_size"]["woda"]["medium"], vf(D0["waterCoverageCellSize"])), "defaults woda")
check(same(iron_size("medium"), vf(D0["ironCoverageCellSize"])), "defaults zelazo")
check(same(copper_size("medium"), vf(D0["copperCoverageCellSize"])), "defaults miedz")
check(same(iron_size("medium"), vf(D0["reliefCoverageCellSize"])), "defaults relief")
check(same(iron_size("medium"), vf(D0["fairPlayResourceCellSize"])), "defaults fairplay")
check(same(TS["cell_size"]["las"]["medium"], vf(D0["forestCoverageCellSize"])), "defaults las")

# 3.1 sufit przepelnienia z uszkodzonym JSON (zbudowanie JSON wariantu niezaleznie od generatora nie jest
#     potrzebne: Rust i weryfikator dostaja ten sam wejsciowy wiersz, a wynik weba jest wyrocznia)
for var in CASES["overflowVariants"]:
    for row in var["rows"]:
        t_ = row["tier"]
        fake = {"gestosc": {"relief_overflow_cap_frac": {t_: {}}}}
        if row["mountainIn"] is not None:
            fake["gestosc"]["relief_overflow_cap_frac"][t_]["mountain"] = vf(row["mountainIn"])
        if row["highlandIn"] is not None:
            fake["gestosc"]["relief_overflow_cap_frac"][t_]["highland"] = vf(row["highlandIn"])
        got = overflow_frac(t_, fake)
        check(same(got[0], vf(row["out"][0])) and same(got[1], vf(row["out"][1])), f"sufit wariant {var['name']} {t_}")

# 3.2 capy
for t_, cnt, bm, bh, sm, sh in CASES["caps"]:
    n = vf(cnt)
    check(same(bonus_cap_mtn(t_, n), vf(bm)), f"bonusCapMountain {t_} {cnt}")
    check(same(bonus_cap_hi(t_, n), vf(bh)), f"bonusCapHighland {t_} {cnt}")
    check(same(spread_cap_mtn(t_, n), vf(sm)), f"spreadCapMountain {t_} {cnt}")
    check(same(spread_cap_hi(t_, n), vf(sh)), f"spreadCapHighland {t_} {cnt}")

# 3.3 minLand
for s_, a, b in CASES["minLand"]:
    check(same(min_land(vf(s_)), vf(a)) and same(min_land(vf(s_)), vf(b)), f"minLand {s_}")

# 3.4 landHexesByCoverageCell
for c in CASES["landCells"]:
    got = land_by_cell(uniq(c["keys"]), vf(c["cellSize"]))
    want = c["out"]
    check(len(got) == len(want), f"landCells liczba komorek {c['cellSize']}")
    for (ck, cell), w_ in zip(got.items(), want):
        check(ck == w_[0] and [list(p) for p in cell] == w_[1], f"landCells komorka {ck}")

# 3.5 pickSpreadReliefKeys
for c in CASES["pickSpread"]:
    cands = [(k, vf(n)) for k, n in c["cands"]]
    check(pick_spread(cands, vf(c["count"]), vf(c["minDist"])) == c["out"], f"pickSpread {c['count']} {c['minDist']}")

# 3.6 masy, centroid, kwadrat, odleglosc
MASSES = {}


def masses_of(mid):
    if mid not in MASSES:
        MASSES[mid] = group_masses(fresh(mid)[0])
    return MASSES[mid]


for c in CASES["masses"]:
    hexes = fresh(c["map"])[0]
    keys = list(hexes)
    ix = {k: i for i, k in enumerate(keys)}
    got = [[ix[k] for k in ms] for ms in masses_of(c["map"])]
    check(got == c["out"], f"masy mapa {c['map']}")

for c in CASES["center"]:
    hexes = fresh(c["map"])[0]
    keys = list(hexes)
    ix = {k: i for i, k in enumerate(keys)}
    ks = [keys[i] for i in c["keys"]] if c["massIdx"] is None else masses_of(c["map"])[c["massIdx"]]
    cen = centroid_of(hexes, ks)
    if c["centroid"] is None:
        check(cen is None, f"centroid mapa {c['map']} powinien byc null")
    else:
        check(cen is not None and same(cen[0], vf(c["centroid"][0])) and same(cen[1], vf(c["centroid"][1])), f"centroid mapa {c['map']}")
    for sqv in c["squares"]:
        size = None if sqv["size"] is None else vf(sqv["size"])
        sq = center_square(hexes, ks, size)
        if sqv["out"] is None:
            check(sq is None, f"kwadrat mapa {c['map']} powinien byc null")
            continue
        check(sq is not None, f"kwadrat mapa {c['map']} nie powinien byc null")
        if sq is None:
            continue
        check([ix[k] for k in sq["keys"]] == sqv["out"]["keys"], f"kwadrat klucze mapa {c['map']}")
        check(all(same(a, vf(b)) for a, b in zip(sq["bbox"], sqv["out"]["bbox"])), f"kwadrat bbox mapa {c['map']}")
        check(same(sq["centroid"][0], vf(sqv["out"]["centroid"][0])) and same(sq["centroid"][1], vf(sqv["out"]["centroid"][1])), f"kwadrat centroid mapa {c['map']}")
        for q_, r_, d_ in sqv["dist"]:
            check(same(dist_center(vf(q_), vf(r_), sq), vf(d_)), f"dystans {q_},{r_} mapa {c['map']}")
for q_, r_, d_ in CASES["nullSquareDist"]:
    check(same(dist_center(vf(q_), vf(r_), None), vf(d_)), "dystans bez kwadratu")

# 3.7 partycje
for c in CASES["partition"]:
    hexes = fresh(c["map"])[0]
    ix = {k: i for i, k in enumerate(hexes)}
    cont = None if c["variant"] == 0 else cont_map(hexes, c["nOrig"], c["variant"])
    zones = partition(hexes, c["typ"], cont, c["n"])
    idxs = [[ix[k] for k in z] for z in zones]
    check(len(idxs) == c["zones"], f"partycje liczba stref mapa {c['map']} {c['typ']}")
    check([len(z) for z in idxs] == c["sizes"], f"partycje rozmiary mapa {c['map']} {c['typ']}")
    check([fnv1a64(",".join(str(i) for i in z)) for z in idxs] == c["hashes"], f"partycje skroty mapa {c['map']} {c['typ']}")

# 3.8 las-kwalifikujacy
for code, want in CASES["forestEligible"]:
    check(forest_eligible(E_TB[code]) == bool(want), f"forestEligible {E_TB[code]}")
for code, want in CASES["riverLand"]:
    check(river_land(E_TB[code]) == bool(want), f"isRiverLandTerrain {E_TB[code]}")


# odwolanie do komorki: liczone przez weryfikator (masa -> komorki), len + skrot FNV-1a
def cell_of(c):
    mass = masses_of(c["map"])[c["massIdx"]]
    cells = list(land_by_cell(uniq(mass), float(c["size"])).values())
    cell = cells[c["cellIdx"]]
    check(len(cell) == c["len"], f"komorka len mapa {c['map']}")
    check(fnv1a64(";".join(f"{q},{r}" for q, r in cell)) == c["cellHash"], f"komorka skrot mapa {c['map']}")
    return cell


# 3.9 liczniki komorek
for c in CASES["cellCounts"]:
    hexes = fresh(c["map"])[0]
    cell = cell_of(c) + [tuple(p) for p in c["extra"]]
    t_ = c["tier"]
    what = f"cellCounts mapa {c['map']} {t_}"
    check(cnt_mtn(cell, hexes) == c["mtn"] and cnt_hi(cell, hexes) == c["hi"], f"{what} liczniki")
    check((cnt_mtn(cell, hexes) > 0) == bool(c["hasM"]) and (cnt_hi(cell, hexes) > 0) == bool(c["hasH"]), f"{what} has")
    check(has_iron(cell, hexes, t_) == bool(c["iron"]) and has_copper(cell, hexes, t_) == bool(c["copper"]), f"{what} pakiety")
    check(has_iron(cell, hexes) == bool(c["ironDef"]) and has_copper(cell, hexes) == bool(c["copperDef"]), f"{what} pakiety domyslne")
    check((cnt_mtn(cell, hexes) > 0 and cnt_hi(cell, hexes) > 0) == bool(c["relief"]), f"{what} relief")
    check(elig_relief(cell, hexes) == c["eligRelief"] == c["eligDep"], f"{what} eligible")
    check(can_host(cell, hexes, c["minLand"]) == bool(c["canHost"]), f"{what} canHost")
    check(elig_forest(cell, hexes) == c["eligForest"], f"{what} eligForest")

# 3.9b granica `eligible < minLand` (minLand = liczba -1 / 0 / +1)
for c in CASES["canHostEdge"]:
    hexes = fresh(c["map"])[0]
    cell = cell_of(c) + [tuple(p) for p in c["extra"]]
    check(can_host(cell, hexes, c["minLand"]) == bool(c["out"]), f"canHostEdge mapa {c['map']} minLand {c['minLand']}")

# 3.10 wskazniki pokrycia
for c in CASES["ratios"]:
    hexes = fresh(c["map"])[0]
    masses = masses_of(c["map"])
    keys = [k for ms in masses for k in ms] if c["all"] else list(masses[c["massIdx"]])
    if c["dup"]:
        keys.append(keys[0])
    t_ = c["tier"]
    what = f"ratios mapa {c['map']} {t_}"
    for cs, a, b in c["iron"]:
        check(same(iron_ratio(keys, hexes, vf(cs), t_), vf(a)) and same(iron_ratio(keys, hexes, vf(cs)), vf(b)), f"{what} iron {cs}")
    for cs, a, b in c["copper"]:
        check(same(copper_ratio(keys, hexes, vf(cs), t_), vf(a)) and same(copper_ratio(keys, hexes, vf(cs)), vf(b)), f"{what} copper {cs}")
    for _tag, ics, ccs, out in c["relief"]:
        check(same(relief_ratio(keys, hexes, vf(ics), None if ccs is None else vf(ccs)), vf(out)), f"{what} relief {ics}")
    check(assert_cov(keys, hexes, t_) == bool(c["assert"]), f"{what} assert")

# 3.11 pickReliefForceHex
for c in CASES["pickForce"]:
    hexes, scratch, w, h = fresh(c["map"])
    cell = cell_of(c)
    rng = Rng(c["seed"])
    got = pick_force(cell, hexes, scratch, w, h, c["want"], set(c["avoid"]), rng, bool(c["ph"]), bool(c["pm"]))
    what = f"pickForce mapa {c['map']} {c['want']}"
    check((None if got is None else [got[0], got[1]]) == c["out"], f"{what} wynik")
    check(rng.n == c["calls"], f"{what} liczba losowan")
    check(same(rng(), vf(c["next"])), f"{what} nastepna wartosc")

# 3.11b pickReliefForceHex z heksami wody w liscie `land`
for c in CASES["pickForceWater"]:
    hexes, scratch, w, h = fresh(c["map"])
    cell = cell_of(c) + [tuple(p) for p in c["waterExtra"]]
    check(len(c["waterExtra"]) >= 1 and all(is_water(hexes[f"{q},{r}"]["tb"]) for q, r in c["waterExtra"]), f"pickForceWater mapa {c['map']} woda")
    rng = Rng(c["seed"])
    got = pick_force(cell, hexes, scratch, w, h, c["want"], set(), rng, False, False)
    what = f"pickForceWater mapa {c['map']} {c['want']}"
    check((None if got is None else [got[0], got[1]]) == c["out"], f"{what} wynik")
    check(rng.n == c["calls"], f"{what} liczba losowan")
    check(same(rng(), vf(c["next"])), f"{what} nastepna wartosc")

# 3.12 forceType + opakowania
for c in CASES["forceType"]:
    hexes, scratch, w, h = fresh(c["map"])
    cell = cell_of(c)
    rng = Rng(c["seed"])
    k, t_ = c["kind"], c["tier"]
    if k == "type-mountain":
        ret = force_type(cell, hexes, scratch, w, h, rng, "mountain", vf(c["minCount"]), t_)
    elif k == "type-highland":
        ret = force_type(cell, hexes, scratch, w, h, rng, "highland", vf(c["minCount"]), t_)
    elif k == "iron":
        ret = force_iron(cell, hexes, scratch, w, h, rng, t_)
    elif k == "copper":
        ret = force_copper(cell, hexes, scratch, w, h, rng, t_)
    else:
        ret = force_relief(cell, hexes, scratch, w, h, rng)
    what = f"forceType mapa {c['map']} {k} {t_}"
    check(ret == bool(c["ret"]), f"{what} wynik")
    check(rng.n == c["calls"], f"{what} liczba losowan")
    check(same(rng(), vf(c["next"])), f"{what} nastepna wartosc")
    check_state(c["map"], hexes, c, what)

# 3.13 capCell
for c in CASES["capCell"]:
    hexes, scratch, w, h = fresh(c["map"])
    cell = cell_of(c)
    k, t_ = c["kind"], c["tier"]
    if k == "mtn":
        ret = cap_mtn(cell, hexes, scratch, t_)
    elif k == "hi":
        ret = cap_hi(cell, hexes, scratch, t_)
    elif k == "mtn-spread":
        ret = cap_mtn(cell, hexes, scratch, t_, True)
    elif k == "hi-spread":
        ret = cap_hi(cell, hexes, scratch, t_, True)
    else:
        ret = cap_relief(cell, hexes, scratch, t_)
    what = f"capCell mapa {c['map']} {k} {t_}"
    check(ret == bool(c["ret"]), f"{what} wynik")
    check_state(c["map"], hexes, c, what)

# 3.14 capSpread / ensureMass
for c in CASES["capSpread"]:
    hexes, scratch, w, h = fresh(c["map"])
    cap_iron_spread(hexes, scratch, c["tier"], masses_of(c["map"])[c["massIdx"]])
    check_state(c["map"], hexes, c, f"capSpread mapa {c['map']} {c['tier']}")
for c in CASES["ensureMass"]:
    hexes, scratch, w, h = fresh(c["map"])
    rng = Rng(c["seed"])
    fixed = ensure_mass(c["kind"], hexes, scratch, c["tier"], w, h, masses_of(c["map"])[c["massIdx"]], rng, bool(c["skipCap"]))
    what = f"ensureMass mapa {c['map']} {c['kind']} {c['tier']} skip={c['skipCap']}"
    check(fixed == c["fixed"], f"{what} fixed")
    check(rng.n == c["calls"], f"{what} liczba losowan")
    check(same(rng(), vf(c["next"])), f"{what} nastepna wartosc")
    check_state(c["map"], hexes, c, what)

# 3.15 applyKeys / applyRank
for c in CASES["applyKeys"]:
    hexes, scratch, w, h = fresh(c["map"])
    spec = c["spec"]
    allkeys = list(hexes)
    if spec["type"] == "allLand":
        keys = [k for k in allkeys if not is_water(hexes[k]["tb"])]
    elif spec["type"] == "mass":
        keys = list(masses_of(c["map"])[spec["massIdx"]])
        if spec["dup"]:
            keys.append(keys[0])
    else:
        keys = [allkeys[i] for i in spec["keys"]]
    if c["kind"] == "iron":
        apply_iron(hexes, scratch, c["tier"], keys, w, h)
    elif c["kind"] == "copper":
        apply_copper(hexes, scratch, c["tier"], keys, w, h)
    else:
        apply_to_keys(hexes, scratch, c["tier"], keys, w, h)
    check_state(c["map"], hexes, c, f"applyKeys mapa {c['map']} {c['kind']} {c['tier']} {spec['type']}")
for c in CASES["applyRank"]:
    hexes, scratch, w, h = fresh(c["map"])
    cont = cont_map(hexes, c["n"], c["variant"]) if c["n"] > 0 else None
    apply_rank(hexes, scratch, c["tier"], w, h, c["typ"], cont, c["n"])
    check_state(c["map"], hexes, c, f"applyRank mapa {c['map']} {c['typ']} {c['tier']}")
for c in CASES["applyRankDefault"]:
    hexes, scratch, w, h = fresh(c["map"])
    apply_rank(hexes, scratch, c["tier"], w, h, "pangea", None, 0)
    check_state(c["map"], hexes, c, f"applyRankDefault mapa {c['map']} {c['tier']}")

# 3.16 ochrona zloza
check(CASES["depositProtected"] == [[0, 0], [1, 0], [2, 1]], "isDepositProtectedFromOverflowCap")

# 3.17 sumy kontrolne zrodla
import hashlib

check(hashlib.sha256(GH_TEXT.encode("utf-8")).hexdigest() == V["meta"]["gen_helpers_sha256"], "sha256 gen-helpers.ts != wektory (inny pin?)")
check(len(GH) - 1 == V["meta"]["gen_helpers_lines"] == 12561, f"gen-helpers.ts: liczba linii {len(GH) - 1} != 12561 (pin edb8fb56)")

print(f"checks={checks} rozbieznosci={bad}")
sys.exit(1 if bad else 0)
