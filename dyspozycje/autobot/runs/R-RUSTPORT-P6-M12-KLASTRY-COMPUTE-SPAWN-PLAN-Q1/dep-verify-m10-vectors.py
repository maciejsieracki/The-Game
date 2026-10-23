#!/usr/bin/env python3
"""NIEZALEZNY weryfikator P6.M10.

Reimplementuje w Pythonie logike masy ladu / bramek / rozmieszczenia srodkow klastrow oraz
punktacje startu z KODU TS (specyfikacja: clusters.ts :59-1345 i startScoring.ts :1-142, pin
edb8fb56), BEZ wykonywania TS, BEZ generatora, BEZ Rust, i porownuje wynik z wektorami z
uruchomionego weba (tests/p6_m10_vectors/web-vectors.json). Dodatkowo:
  - wyciaga regexem z TS (po numerach linii pinu) literaly/stale i porownuje je z tabelami
    `data/derived/mapgen-cluster-mass.json` i `data/derived/start-scoring.json`,
  - ma WLASNA implementacje TimSortu V8 (z opisu algorytmu: Tim Peters listsort + array-sort.tq)
    do kategorii `v8sort` i do rozmieszczenia (komparator pickCenterInMassSpread losuje).

Uzycie: verify-m10-vectors.py <WEB_ROOT> <WEB_VECTORS_JSON> <MASS_TABLE_JSON> <START_TABLE_JSON>
Kod wyjscia: 0 = 0 rozbieznosci.
"""
import functools
import json
import math
import re
import struct
import sys

web_root, vec_path, mass_tbl_path, start_tbl_path = sys.argv[1:5]
V = json.load(open(vec_path, encoding="utf-8"))
TM = json.load(open(mass_tbl_path, encoding="utf-8"))
TS_ = json.load(open(start_tbl_path, encoding="utf-8"))
CL = open(f"{web_root}/gra/src/map/clusters.ts", encoding="utf-8").read().split("\n")
SSC = open(f"{web_root}/gra/src/map/startScoring.ts", encoding="utf-8").read().split("\n")
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


# ----------------------------------------------------------------------------------------------
# 0. Narzedzia JS
# ----------------------------------------------------------------------------------------------
def js_or(a, b):
    return b if (a == 0 or (isinstance(a, float) and math.isnan(a))) else a


M32 = 0xFFFFFFFF


def mulberry32(seed):
    s = seed & M32

    def rnd():
        nonlocal s
        s = (s + 0x6D2B79F5) & M32
        t = ((s ^ (s >> 15)) * (1 | s)) & M32
        t = (t ^ ((t + (((t ^ (t >> 7)) * (61 | t)) & M32)) & M32)) & M32
        return ((t ^ (t >> 14)) & M32) / 4294967296

    return rnd


class Rand:
    def __init__(self, seed):
        self.g = mulberry32(seed)
        self.n = 0

    def __call__(self):
        self.n += 1
        return self.g()


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


def stable_sort(items, cmp):
    """Dla komparatorow SPOJNYCH (bez losowania) wynik nie zalezy od algorytmu stabilnego."""
    return sorted(items, key=functools.cmp_to_key(lambda a, b: 0 if (isinstance(cmp(a, b), float) and math.isnan(cmp(a, b))) else cmp(a, b)))


# ----------------------------------------------------------------------------------------------
# 1. Literaly z TS vs tabele silnika (regex po zrodle, numery linii z pinu)
# ----------------------------------------------------------------------------------------------
def line(file, n):
    return file[n - 1]


def num(rx, text):
    m = re.search(rx, text)
    check(m is not None, f"regex {rx} nie pasuje do: {text}")
    return float(m.group(1)) if m else None


NUM = r"(-?\d+(?:\.\d+)?)"
MS = TM["masy"]
SG = TM["start_gracza"]
WH = TM["wybor_hexu"]
RZ = TM["rozmieszczenie"]

TS_CONST = {
    "MIN_MASS_HEXES_FOR_CENTER": (212, r"MIN_MASS_HEXES_FOR_CENTER = " + NUM, MS["min_masa_srodka_hex"]["wartosc"]),
    "MIN_MASS_HEXES_FOR_SPAWN": (217, r"MIN_MASS_HEXES_FOR_SPAWN = " + NUM, MS["min_masa_spawn_hex"]["wartosc"]),
    "MIN_DEVELOPMENT_HEX_PER_CIV": (222, r"MIN_DEVELOPMENT_HEX_PER_CIV = " + NUM, MS["min_przestrzen_rozwoju_na_cywilizacje"]["wartosc"]),
    "SMALL_MASS_CAP_THRESHOLD_MULT": (224, r"SMALL_MASS_CAP_THRESHOLD = " + NUM + r" \* MIN_DEVELOPMENT_HEX_PER_CIV", MS["prog_malej_masy_mnoznik"]["wartosc"]),
    "DEVELOPMENT_SPACE_RADIUS": (226, r"DEVELOPMENT_SPACE_RADIUS = " + NUM, MS["promien_przestrzeni_rozwoju"]["wartosc"]),
    "ISLAND_FALLBACK_MASS_FRAC": (228, r"ISLAND_FALLBACK_MASS_FRAC = " + NUM, MS["frakcja_wyspy_najwiekszej_masy"]["wartosc"]),
    "FOREIGN_MASS_MIN_ABSOLUTE": (233, r"FOREIGN_MASS_MIN_ABSOLUTE = " + NUM, MS["obca_masa_min_bezwzgledny"]["wartosc"]),
    "FOREIGN_MASS_FRAC_OF_LARGEST": (235, r"FOREIGN_MASS_FRAC_OF_LARGEST = " + NUM, MS["obca_masa_frakcja_najwiekszej"]["wartosc"]),
    "LOCAL_LAND_DOMINANCE_FRAC": (240, r"LOCAL_LAND_DOMINANCE_FRAC = " + NUM, SG["lokalny_lad_frakcja"]["wartosc"]),
    "LOCAL_LAND_DOMINANCE_RADIUS": (244, r"LOCAL_LAND_DOMINANCE_RADIUS = " + NUM, SG["lokalny_lad_promien"]["wartosc"]),
    "PLAYER_START_MIN_MASS_HEXES": (246, r"PLAYER_START_MIN_MASS_HEXES = " + NUM, SG["min_masa_hex"]["wartosc"]),
    "PLAYER_START_MASS_MIN_ABSOLUTE": (248, r"PLAYER_START_MASS_MIN_ABSOLUTE = " + NUM, SG["min_masa_bezwzgledna_hex"]["wartosc"]),
}
TSV = {}
for name, (ln, rx, tbl) in TS_CONST.items():
    v = num(rx, line(CL, ln))
    TSV[name] = v
    check(v == tbl, f"{name}: TS {v} != tabela {tbl}")
check("REGION_MASS_DOMINANCE_FRAC = LOCAL_LAND_DOMINANCE_FRAC;" in line(CL, 242), "alias :242")

# inline literaly (wybor / rozmieszczenie / bramka masy gracza)
inl = [
    (578, r"Math\.floor\(largest \* " + NUM + r"\)", SG["min_masa_frakcja_najwiekszej"]["wartosc"], "frakcja min masy gracza"),
    (679, r"top\.land\.ratio - " + NUM, WH["tolerancja_udzialu_lasu"]["wartosc"], "tol lasu"),
    (678, r"top\.dev - " + NUM, WH["tolerancja_przestrzeni_rozwoju"]["wartosc"], "tol dev"),
    (680, r"top\.sea \+ " + NUM, WH["tolerancja_odleglosci_od_morza"]["wartosc"], "tol sea"),
    (862, r"\* " + NUM + r" : 0\)", WH["waga_bliskosci_preferowanego"]["wartosc"], "waga preferNear"),
    (863, r"rand\(\) \* " + NUM, WH["waga_losowego_rozstrzygniecia"]["wartosc"], "waga rand"),
    (940, r"\? " + NUM + r"$", None, None),
    (968, r"minSeaDist \+ " + NUM, WH["limit_morza_w_wyniku_powyzej_min"]["wartosc"], "sea cap"),
    (976, r"top\.minExist - " + NUM, WH["tolerancja_min_exist_pasma"]["wartosc"], "tol minExist"),
    (979, r"tq \+ " + NUM, WH["tolerancja_obciazenia_cwiartki_pasma"]["wartosc"], "tol cwiartki"),
    (953, r"nNeeded >= " + NUM, WH["min_liczba_typow_filtra_cwiartek"]["wartosc"], "n>=5 filtr"),
    (1035, r"minDist \* " + NUM, RZ["balans_prog_dziury_mnoznik"]["wartosc"], "prog dziury"),
    (1071, r"currentToward - " + NUM, RZ["balans_zblizenie_do_dziury"]["wartosc"], "zblizenie"),
    (1072, r"minDist \* " + NUM, RZ["balans_duza_dziura_mnoznik"]["wartosc"], "duza dziura"),
    (1106, r"iter < " + NUM, RZ["wymus_cwiartki_max_iteracji"]["wartosc"], "iter wymus"),
    (1099, r"centers\.length < " + NUM, RZ["wymus_cwiartki_min_centrow"]["wartosc"], "min centrow wymus"),
    (1120, r"maxQuadLoad <= " + NUM, RZ["wymus_cwiartki_min_obciazenie"]["wartosc"], "min obciazenie"),
    (1283, r"Math\.max\(" + NUM + r", Math\.min\(", RZ["wyrownanie_min_iteracji"]["wartosc"], "wyrownanie min"),
    (1283, r"Math\.min\(" + NUM + r", Math\.ceil", RZ["wyrownanie_max_iteracji"]["wartosc"], "wyrownanie max"),
    (1283, r"nNeeded / " + NUM, RZ["wyrownanie_dzielnik_typow"]["wartosc"], "dzielnik"),
    (1022, r"centers\.length < " + NUM, RZ["min_centrow_wyrownania"]["wartosc"], "min centrow wyrownania"),
    (1253, r"nNeeded \* " + NUM, RZ["straznik_faza2_mnoznik"]["wartosc"], "straznik 2"),
    (1303, r"nNeeded \* " + NUM, RZ["straznik_faza5_mnoznik"]["wartosc"], "straznik 5"),
    (1319, r"nNeeded \* " + NUM, RZ["straznik_faza5b_mnoznik"]["wartosc"], "straznik 5b"),
    (1169, r"Math\.max\(" + NUM + r", minDistBase", RZ["min_twardy_dystans"]["wartosc"], "twardy min"),
]
for ln, rx, tbl, label in inl:
    if tbl is None:
        continue
    check(num(rx, line(CL, ln)) == tbl, f"{label}: linia {ln} != tabela {tbl}")
check(num(r"\? (\d+)$", line(CL, 636)) == WH["sentinel_brak_srodkow"]["wartosc"], "sentinel 999 :636")
check(num(r"\? (\d+)$", line(CL, 941)) == WH["sentinel_brak_srodkow"]["wartosc"], "sentinel 999 :941")
check(num(r"\? (\d+)$", line(CL, 1326)) == WH["sentinel_brak_srodkow"]["wartosc"], "sentinel 999 :1326")

# rozmiar mapy
for ln, lbl in [(154, "mala"), (155, "srednia"), (156, "duza"), (157, "ogromna")]:
    m = re.search(r"area < (\d+)\) return '(\w+)'", line(CL, ln))
    check(m is not None, f"mapSizeLabel :{ln}")
    if m:
        step = TM["rozmiar_mapy"]["progi_pola"][ln - 154]
        check(float(m.group(1)) == step["ponizej"] and m.group(2) == step["etykieta"] == lbl, f"prog {lbl}")
check("return 'super'" in line(CL, 158), "super :158")
m = re.search(r"mala: (\d+), srednia: (\d+), duza: (\d+), ogromna: (\d+), super: (\d+)", line(CL, 163))
check(m is not None, "aktywneTypyFromSize :163")
AKTYWNE = {}
if m:
    for k, vv in zip(["mala", "srednia", "duza", "ogromna", "super"], m.groups()):
        AKTYWNE[k] = int(vv)
        check(int(vv) == TM["rozmiar_mapy"]["aktywne_typy"][k]["wartosc"], f"aktywne {k}")
# ROSTER
roster_ts = []
for ln in range(70, 85):
    m = re.search(r"'(\w+)',", line(CL, ln))
    roster_ts.append(m.group(1) if m else None)
check(roster_ts == TM["roster_klucze"]["wartosc"], "ROSTER_KLUCZE == tabela")
# startScoring
SP = TS_["punktacja"]
PR = TS_["promien_oswietlenia"]
check(num(r"START_REVEAL_RADIUS = " + NUM, line(SSC, 14)) == PR["domyslny_legacy"]["wartosc"], "START_REVEAL_RADIUS")
check(num(r"return " + NUM, line(SSC, 19)) == PR["easy"]["wartosc"], "easy")
check(num(r"return " + NUM, line(SSC, 20)) == PR["hard"]["wartosc"], "hard")
check(num(r"return " + NUM, line(SSC, 21)) == PR["normal"]["wartosc"], "normal")
check(num(r"score \+= " + NUM, line(SSC, 60)) == SP["laka_rownina"]["wartosc"], "laka")
check(num(r"score \+= " + NUM, line(SSC, 63)) == SP["wzgorza"]["wartosc"], "wzgorza")
check(num(r"score -= " + NUM, line(SSC, 66)) == -SP["pustynia"]["wartosc"], "pustynia")
check(num(r"score \+= " + NUM, line(SSC, 69)) == SP["inny_teren"]["wartosc"], "inny")
check(num(r"score \+= " + NUM, line(SSC, 72)) == SP["rzeka_na_hexie"]["wartosc"], "rzeka")
check(num(r"score \+= " + NUM, line(SSC, 78)) == SP["rzeka_u_sasiada"]["wartosc"], "sasiad rzeki")
check(num(r"dq = -" + NUM, line(SSC, 80)) == SP["promien_okolicy"]["wartosc"], "promien okolicy")
check(num(r"dist > " + NUM, line(SSC, 83)) == SP["promien_okolicy"]["wartosc"], "dist > promien")
check(num(r"dist <= " + NUM + r" \?", line(SSC, 86)) == SP["promien_pol_blisko"]["wartosc"], "dist <= blisko")
check(num(r"\? " + NUM + r" : ", line(SSC, 86)) == SP["pola_uprawne_blisko"]["wartosc"], "uprawne blisko")
check(num(r": " + NUM + r";", line(SSC, 86)) == SP["pola_uprawne_dalej"]["wartosc"], "uprawne dalej")
check(num(r"dist >= " + NUM, line(SSC, 87)) == SP["min_dystans_wzniesien"]["wartosc"], "min dystans wzniesien")
check(num(r"score \+= " + NUM, line(SSC, 88)) == SP["gory_w_okolicy"]["wartosc"], "gory")
check(num(r"score \+= " + NUM, line(SSC, 89)) == SP["wzgorza_w_okolicy"]["wartosc"], "wzgorza okolica")
check(num(r"\* " + NUM, line(SSC, 131)) == SP["waga_przestrzeni_rozwoju"]["wartosc"], "waga dev")

# stale uzywane w implementacji ponizej biora wartosci Z TS (regex), nie z tabel
MIN_MASS_CENTER = int(TSV["MIN_MASS_HEXES_FOR_CENTER"])
MIN_DEV_PER_CIV = int(TSV["MIN_DEVELOPMENT_HEX_PER_CIV"])
SMALL_CAP = int(TSV["SMALL_MASS_CAP_THRESHOLD_MULT"]) * MIN_DEV_PER_CIV
DEV_RADIUS = int(TSV["DEVELOPMENT_SPACE_RADIUS"])
ISLAND_FRAC = TSV["ISLAND_FALLBACK_MASS_FRAC"]
FOREIGN_ABS = int(TSV["FOREIGN_MASS_MIN_ABSOLUTE"])
FOREIGN_FRAC = TSV["FOREIGN_MASS_FRAC_OF_LARGEST"]
LOCAL_FRAC = TSV["LOCAL_LAND_DOMINANCE_FRAC"]
LOCAL_RADIUS = int(TSV["LOCAL_LAND_DOMINANCE_RADIUS"])
PS_MIN = int(TSV["PLAYER_START_MIN_MASS_HEXES"])
PS_ABS = int(TSV["PLAYER_START_MASS_MIN_ABSOLUTE"])

c = CASES["consts"]
check(c["MIN_MASS_HEXES_FOR_CENTER"] == MIN_MASS_CENTER, "consts web MIN_MASS_CENTER")
check(c["SMALL_MASS_CAP_THRESHOLD"] == SMALL_CAP, "consts web SMALL_CAP")
check(c["MIN_DEVELOPMENT_HEX_PER_CIV"] == MIN_DEV_PER_CIV, "consts web MIN_DEV")
check(c["PLAYER_START_MASS_MIN_ABSOLUTE"] == PS_ABS and c["PLAYER_START_MIN_MASS_HEXES"] == PS_MIN, "consts web player")
check(vf(c["LOCAL_LAND_DOMINANCE_FRAC"]) == LOCAL_FRAC and vf(c["REGION_MASS_DOMINANCE_FRAC"]) == LOCAL_FRAC, "consts web local")
check(c["ROSTER_KLUCZE"] == roster_ts, "consts web roster")

# ----------------------------------------------------------------------------------------------
# 2. Geometria i mapy
# ----------------------------------------------------------------------------------------------
DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]


def hd(aq, ar, bq, br):
    return max(abs(aq - bq), abs(ar - br), abs((-aq - ar) - (-bq - br)))


C2T = {"m": "morze", "p": "plytkie_morze", "l": "laka", "r": "rownina", "w": "wzgorza", "g": "gory", "u": "pustynia", "o": "polarny"}


class GMap:
    def __init__(self, rep):
        self.w = rep["w"]
        self.h = rep["h"]
        self.t = {}
        self.river = {}
        self.order = []
        for i, ch in enumerate(rep["terrain"]):
            q, r = i % self.w, i // self.w
            self.t[(q, r)] = C2T[ch]
            self.river[(q, r)] = rep["river"][i] == "1"
            self.order.append((q, r))
        self.sea = {}
        for i, d in enumerate(rep["sea"]):
            if d >= 0:
                self.sea[(i % self.w, i // self.w)] = d


MAPS = {k: GMap(v) for k, v in V["maps"].items()}


def habitable(t):
    return t not in ("morze", "gory", "plytkie_morze")


def foundable(t):
    return t not in ("morze", "plytkie_morze", "gory", "polarny")


def ladowe_of(m):
    return [h for h in m.order if habitable(m.t[h])]


def H(v):
    return (v[0], v[1])


def HL(v):
    return [H(x) for x in v]


def fnv(s):
    h = 0xCBF29CE484222325
    for b in s.encode():
        h ^= b
        h = (h * 0x100000001B3) & 0xFFFFFFFFFFFFFFFF
    return f"{h:016x}"


def digest(lst):
    return fnv(";".join(f"{q},{r}" for q, r in lst))


# ----------------------------------------------------------------------------------------------
# 3. Roster, rozmiar mapy
# ----------------------------------------------------------------------------------------------
GAME_EPOCHS = ["kamien", "braz", "zelazo"]


def epoch_idx(e):
    return GAME_EPOCHS.index(e) if e in GAME_EPOCHS else len(GAME_EPOCHS)


def entry_epoch(row):
    direct = row.get("epokaWejscia")
    if direct and direct in GAME_EPOCHS:
        return direct
    legacy = row.get("epokiStartowe")
    if legacy and len(legacy) > 0:
        idx = [epoch_idx(e) for e in legacy if epoch_idx(e) < len(GAME_EPOCHS)]
        if idx:
            return GAME_EPOCHS[min(idx)]
    return GAME_EPOCHS[0]


def roster_for_epoch(rows, epoch):
    if rows is None or not epoch:
        return list(roster_ts)
    avail = {r["ikonaId"] for r in rows if r.get("ikonaId") and epoch_idx(entry_epoch(r)) <= epoch_idx(epoch)}
    return [k for k in roster_ts if k in avail]


for cs in CASES["rosterKluczeForStartEpoch"]:
    got = roster_for_epoch(cs["rows"], cs["epoch"])
    check(got == cs["result"], f"roster {cs['rosterName']} {cs['epoch']}")


def reorder(roster, preferred):
    if not preferred:
        return list(roster)
    rs = set(roster)
    front = []
    seen = set()
    for i in preferred:
        if i and i in rs and i not in seen:
            front.append(i)
            seen.add(i)
    if not front:
        return list(roster)
    return front + [i for i in roster if i not in seen]


for cs in CASES["reorderRosterByPreference"]:
    check(reorder(cs["roster"], cs["preferred"]) == cs["result"], f"reorder {cs['roster']} {cs['preferred']}")


def map_size_label(w, h):
    area = w * h
    if area < 4800:
        return "mala"
    if area < 12000:
        return "srednia"
    if area < 25200:
        return "duza"
    if area < 100000:
        return "ogromna"
    return "super"


for cs in CASES["mapSizeLabel"]:
    check(map_size_label(cs["w"], cs["h"]) == cs["label"], f"mapSizeLabel {cs['w']}x{cs['h']}")
for cs in CASES["aktywneTypyFromSize"]:
    check(AKTYWNE[cs["label"]] == cs["n"], f"aktywne {cs['label']}")


# ----------------------------------------------------------------------------------------------
# 4. Progi, capy, alokacja
# ----------------------------------------------------------------------------------------------
def qual_thr(n):
    return max(MIN_MASS_CENTER, math.floor(n * ISLAND_FRAC))


def foreign_thr(n):
    return max(FOREIGN_ABS, math.floor(n * FOREIGN_FRAC))


def qualifies(size, lens):
    if len(lens) == 1:
        return True
    largest = lens[0] if lens else 0
    return size >= foreign_thr(largest)


def type_cap(size):
    if size < SMALL_CAP:
        return 1
    return max(1, math.floor(size / MIN_DEV_PER_CIV))


for cs in CASES["thresholds"]:
    n = cs["n"]
    check(qual_thr(n) == cs["qualifying"] and foreign_thr(n) == cs["foreign"] and type_cap(n) == cs["cap"], f"progi {n}")
for cs in CASES["massQualifies"]:
    check(qualifies(cs["size"], cs["lens"]) == cs["result"], f"qualifies {cs['lens']} {cs['size']}")
for cs in CASES["qualifyingIndices"]:
    lens = cs["lens"]
    got = [0] if len(lens) == 1 else [i for i in range(len(lens)) if qualifies(lens[i], lens)]
    check(got == cs["result"], f"qualifyingIndices {lens}")


def allocate(n_foreign, lens):
    slots = [0] * len(lens)
    if n_foreign <= 0 or not lens:
        return slots
    if len(lens) == 1:
        slots[0] = n_foreign
        return slots
    caps = [type_cap(m) for m in lens]
    qi = [i for i in range(len(lens)) if qualifies(lens[i], lens)]
    if not qi:
        slots[0] = n_foreign
        return slots
    total = sum(lens[i] for i in qi)
    sq = stable_sort(qi, lambda a, b: lens[b] - lens[a])
    rem = n_foreign
    for mi in sq:
        if rem <= 0:
            break
        if slots[mi] < caps[mi]:
            slots[mi] += 1
            rem -= 1
    entries = []
    assigned = 0
    for mi in qi:
        size = lens[mi]
        exact = rem * size / total
        fl = math.floor(exact)
        room = caps[mi] - slots[mi]
        add = min(fl, room)
        slots[mi] += add
        assigned += add
        entries.append({"i": mi, "rem": exact - fl, "exact": exact, "size": size})
    left = rem - assigned
    entries = stable_sort(entries, lambda a, b: js_or(js_or(js_or(b["rem"] - a["rem"], b["size"] - a["size"]), b["exact"] - a["exact"]), a["i"] - b["i"]))
    for e in entries:
        if left <= 0:
            break
        if slots[e["i"]] < caps[e["i"]]:
            slots[e["i"]] += 1
            left -= 1
    if left > 0:
        for mi in stable_sort(qi, lambda a, b: lens[b] - lens[a]):
            while left > 0 and slots[mi] < caps[mi]:
                slots[mi] += 1
                left -= 1
    return slots


for cs in CASES["allocate"]:
    check(allocate(cs["n"], cs["lens"]) == cs["result"], f"allocate {cs['lens']} n={cs['n']}")


# ----------------------------------------------------------------------------------------------
# 5. Masy, cache, lokalny lad, przestrzen rozwoju, bramki
# ----------------------------------------------------------------------------------------------
def group_masses(ladowe):
    keyset = set(ladowe)
    visited = set()
    masses = []
    for h in ladowe:
        if h in visited:
            continue
        mass = []
        stack = [h]
        visited.add(h)
        while stack:
            cur = stack.pop()
            mass.append(cur)
            for dq, dr in DIRS:
                nk = (cur[0] + dq, cur[1] + dr)
                if nk not in keyset or nk in visited:
                    continue
                visited.add(nk)
                stack.append(nk)
        if len(mass) >= MIN_MASS_CENTER:
            masses.append(mass)
    return stable_sort(masses, lambda a, b: len(b) - len(a))


class Cache:
    def __init__(self, masses):
        self.masses = masses
        self.index = {}
        for mi, m in enumerate(masses):
            for h in m:
                self.index[h] = mi
        self.sets = [set(m) for m in masses]


for cs in CASES["groupMasses"]:
    masses = group_masses(HL(cs["input"]))
    check(len(masses) == cs["count"], f"group count {cs['name']}")
    check([len(m) for m in masses] == cs["sizes"], f"group sizes {cs['name']}")
    check(fnv("|".join(digest(m) for m in masses)) == cs["fnv"], f"group fnv {cs['name']}")
    check([list(h) for h in (masses[0][:5] if masses else [])] == cs["first"], f"group first {cs['name']}")
GM = {cs["name"]: cs for cs in CASES["groupMasses"]}
for cs in CASES["massCache"]:
    masses = group_masses(HL(GM[cs["name"]]["input"]))
    cache = Cache(masses)
    check(len(cache.index) == cs["indexSize"], f"cache index size {cs['name']}")
    entries = []
    for mi, m in enumerate(masses):
        for h in m:
            entries.append(f"{h[0]},{h[1]}={mi}")
    check(fnv(";".join(entries)) == cs["indexFnv"], f"cache index fnv {cs['name']}")
    check([len(s) for s in cache.sets] == cs["setSizes"], f"cache set sizes {cs['name']}")

MASSES = {}
CACHES = {}
for mid, gm in MAPS.items():
    MASSES[mid] = group_masses(ladowe_of(gm))
    CACHES[mid] = Cache(MASSES[mid])


def local_land(gm, q, r, radius=LOCAL_RADIUS):
    land = total = 0
    for dq in range(-radius, radius + 1):
        r1 = max(-radius, -dq - radius)
        r2 = min(radius, -dq + radius)
        for dr in range(r1, r2 + 1):
            t = gm.t.get((q + dq, r + dr))
            if t is None:
                continue
            total += 1
            if habitable(t):
                land += 1
    ratio = land / total if total > 0 else 0
    return ratio, land, total


def dev_space(gm, cache, q, r, radius=DEV_RADIUS):
    mi = cache.index.get((q, r))
    if mi is None:
        return 0
    ms = cache.sets[mi]
    count = 0
    for dq in range(-radius, radius + 1):
        r1 = max(-radius, -dq - radius)
        r2 = min(radius, -dq + radius)
        for dr in range(r1, r2 + 1):
            nk = (q + dq, r + dr)
            if nk not in ms:
                continue
            t = gm.t.get(nk)
            if t is not None and habitable(t):
                count += 1
    return count


def mass_size_at(cache, q, r):
    mi = cache.index.get((q, r))
    return len(cache.masses[mi]) if mi is not None else 0


def passes_local(gm, q, r, minfrac=LOCAL_FRAC, radius=LOCAL_RADIUS):
    return local_land(gm, q, r, radius)[0] >= minfrac


def passes_player(gm, cache, q, r):
    if not passes_local(gm, q, r):
        return False
    size = mass_size_at(cache, q, r)
    largest = len(cache.masses[0]) if cache.masses else 0
    scaled = max(PS_ABS, math.floor(largest * 0.08))
    if size >= scaled:
        return True
    return size >= PS_MIN


for cs in CASES["regionDominance"]:
    masses = MASSES[cs["map"]]
    cache = Cache(masses)
    region = HL(cs["region"])
    center = H(cs["center"])
    cmi = cache.index.get(center)
    per = {}
    for h in region:
        mi = cache.index.get(h)
        if mi is None:
            continue
        per[mi] = per.get(mi, 0) + 1
    dom = -1
    dc = 0
    for mi, cnt in per.items():
        if cnt > dc:
            dc = cnt
            dom = mi
    cc = per.get(cmi, 0) if cmi is not None else 0
    ratio = cc / len(region) if len(region) > 0 else 0
    check(same(ratio, vf(cs["ratio"])) and cmi == cs["centerMassIndex"] and dom == cs["dominantMassIndex"], f"dominance {cs['map']}")

for cs in CASES["localLand"]:
    gm = MAPS[cs["map"]]
    radius = LOCAL_RADIUS if cs["radius"] is None else cs["radius"]
    ratio, land, total = local_land(gm, cs["q"], cs["r"], radius)
    check(same(ratio, vf(cs["ratio"])) and land == cs["landCount"] and total == cs["totalCount"], f"localLand {cs}")
for cs in CASES["localGate"]:
    gm = MAPS[cs["map"]]
    radius = LOCAL_RADIUS if cs["radius"] is None else cs["radius"]
    mf = LOCAL_FRAC if cs["minFrac"] is None else vf(cs["minFrac"])
    check(passes_local(gm, cs["q"], cs["r"], mf, radius) == cs["result"], f"localGate {cs}")
for cs in CASES["devSpace"]:
    radius = DEV_RADIUS if cs["radius"] is None else cs["radius"]
    check(dev_space(MAPS[cs["map"]], CACHES[cs["map"]], cs["q"], cs["r"], radius) == cs["result"], f"devSpace {cs}")
for cs in CASES["massSizeAt"]:
    check(mass_size_at(CACHES[cs["map"]], cs["q"], cs["r"]) == cs["result"], f"massSizeAt {cs}")
for cs in CASES["playerMassGate"]:
    check(passes_player(MAPS[cs["map"]], CACHES[cs["map"]], cs["q"], cs["r"]) == cs["result"], f"playerMassGate {cs}")
for mid, bitsv in CASES["playerMassGateAll"].items():
    gm = MAPS[mid]
    got = "".join("1" if passes_player(gm, CACHES[mid], q, r) else "0" for (q, r) in gm.order)
    check(got == bitsv, f"playerMassGateAll {mid}")
for cs in CASES["isSpawnHabitable"]:
    check(habitable(cs["teren"]) == cs["result"], f"habitable {cs['teren']}")


# ----------------------------------------------------------------------------------------------
# 6. Hooki M11 (wlasna implementacja z TS :1420-1654)
# ----------------------------------------------------------------------------------------------
def quad_index(q, r, midq, midr):
    return (1 if q >= midq else 0) + (1 if r >= midr else 0) * 2


def count_quads(centers, midq, midr):
    cnt = [0, 0, 0, 0]
    for c in centers:
        cnt[quad_index(c[0], c[1], midq, midr)] += 1
    return cnt


def min_quarters(n):
    if n >= 6:
        return 3
    if n >= 5:
        return 3
    if n >= 3:
        return 2
    return 1


def preferred_quads(counts, n):
    if n < 5:
        return None
    required = min_quarters(n)
    occupied = len([c for c in counts if c > 0])
    empty = [q for q in range(4) if counts[q] == 0]
    if occupied < required and len(empty) > 0:
        return set(empty)
    mc = min(counts)
    return set(q for q in range(4) if counts[q] == mc)


def quad_spread(centers, bbox):
    if not centers:
        return (0, 0, 0)
    midq = (bbox["minQ"] + bbox["maxQ"]) / 2
    midr = (bbox["minR"] + bbox["maxR"]) / 2
    quads = set()
    mnq, mxq, mnr, mxr = math.inf, -math.inf, math.inf, -math.inf
    for c in centers:
        quads.add(quad_index(c[0], c[1], midq, midr))
        mnq = min(mnq, c[0])
        mxq = max(mxq, c[0])
        mnr = min(mnr, c[1])
        mxr = max(mxr, c[1])
    return (len(quads), mxq - mnq, mxr - mnr)


def band_penalty(sea, mn, mx):
    if not (mn > 0) and not (mx > 0):
        return 0
    lo = max(0, mn)
    hi = mx if mx > 0 else lo + 5
    if sea < lo:
        return 1000 + (lo - sea)
    if sea > hi:
        return 100 + (sea - hi)
    ideal = (lo + hi) / 2
    return abs(sea - ideal)


def min_sep(c, others):
    if not others:
        return None
    best = math.inf
    for p in others:
        d = hd(c[0], c[1], p[0], p[1])
        if d < best:
            best = d
    return best


for cs in CASES["hooks"]:
    k = cs["kind"]
    if k == "quad":
        check(quad_index(cs["q"], cs["r"], vf(cs["midQ"]), vf(cs["midR"])) == cs["result"], f"hook quad {cs}")
    elif k == "minQuarters":
        check(min_quarters(cs["n"]) == cs["result"], f"hook minQuarters {cs}")
    elif k == "bandPenalty":
        check(same(band_penalty(vf(cs["sea"]), vf(cs["min"]), vf(cs["max"])), vf(cs["result"])), f"hook band {cs}")
    elif k == "countPerQuad":
        check(count_quads(HL(cs["centers"]), vf(cs["midQ"]), vf(cs["midR"])) == cs["result"], f"hook count {cs}")
    elif k == "preferred":
        p = preferred_quads(cs["counts"], cs["nNeeded"])
        check((None if p is None else sorted(p)) == cs["result"], f"hook preferred {cs}")
    elif k == "spread":
        s = quad_spread(HL(cs["centers"]), cs["bbox"])
        r = cs["result"]
        check(s[0] == r["occupiedQuadrants"] and same(s[1], vf(r["qSpan"])) and same(s[2], vf(r["rSpan"])), f"hook spread {cs}")
    elif k == "minSep":
        m = min_sep(H(cs["c"]), HL(cs["others"]))
        check((m is None and cs["result"] is None) or (m is not None and cs["result"] is not None and same(m, vf(cs["result"]))), f"hook minSep {cs}")
    elif k == "seaGate":
        sd = {(a, b): d for a, b, d in cs["sea"]}
        at = sd.get((cs["q"], cs["r"]), 0)
        check(at == cs["at"] and (at >= cs["min"]) == cs["result"], f"hook seaGate {cs}")


# ----------------------------------------------------------------------------------------------
# 7. Kandydaci spawnu, sortowania, wybory
# ----------------------------------------------------------------------------------------------
def cand_in(a):
    return {"h": (a[0], a[1]), "ratio": vf(a[2]), "land": a[3], "total": a[4], "dev": a[5], "sea": vf(a[6])}


def sea_at(gm, use_sea, q, r, fallback):
    if not use_sea:
        return fallback
    return gm.sea.get((q, r), 0)


def passes_sea(gm, use_sea, q, r, mn):
    if not use_sea:
        return True
    return gm.sea.get((q, r), 0) >= mn


def mk_cand(gm, cache, h, use_sea, min_sea):
    ratio, land, total = local_land(gm, h[0], h[1])
    return {"h": h, "ratio": ratio, "land": land, "total": total, "dev": dev_space(gm, cache, h[0], h[1]), "sea": sea_at(gm, use_sea, h[0], h[1], min_sea)}


def cand_cmp(mapcenter, sea_first, mn, mx):
    def cmp(a, b):
        da = hd(a["h"][0], a["h"][1], mapcenter[0], mapcenter[1])
        db = hd(b["h"][0], b["h"][1], mapcenter[0], mapcenter[1])
        if sea_first and b["sea"] != a["sea"]:
            return b["sea"] - a["sea"]
        if not sea_first and (mn > 0 or mx > 0):
            pa = band_penalty(a["sea"], mn, mx)
            pb = band_penalty(b["sea"], mn, mx)
            if pa != pb:
                return pa - pb
        core = js_or(b["dev"] - a["dev"], b["ratio"] - a["ratio"])
        if core != 0:
            return core
        return js_or(js_or(db - da, a["h"][0] - b["h"][0]), a["h"][1] - b["h"][1])

    return cmp


def sort_spawn(cands, mapcenter, sea_first=False, mn=0, mx=0):
    return stable_sort(cands, cand_cmp(mapcenter, sea_first, mn, mx))


for cs in CASES["sortSpawn"]:
    cands = [cand_in(a) for a in cs["cands"]]
    mc = (vf(cs["mapCenter"][0]), vf(cs["mapCenter"][1]))
    got = [list(c["h"]) for c in sort_spawn(cands, mc, cs["seaFirst"], cs["minSea"], cs["maxSea"])]
    check(got == cs["order"], f"sortSpawn {cs['map']}")


def sort_spread(cands, mapcenter, prior, bbox, spread_n, sea_first, mn, mx):
    midq = (bbox["minQ"] + bbox["maxQ"]) / 2
    midr = (bbox["minR"] + bbox["maxR"]) / 2
    qc = count_quads(prior, midq, midr)
    preferred = preferred_quads(qc, spread_n)
    enriched = []
    for c in cands:
        e = dict(c)
        e["quad"] = quad_index(c["h"][0], c["h"][1], midq, midr)
        e["minExist"] = 999 if not prior else min(hd(c["h"][0], c["h"][1], p[0], p[1]) for p in prior)
        enriched.append(e)
    pool = enriched
    if preferred is not None and len(preferred) > 0:
        qf = [c for c in enriched if c["quad"] in preferred]
        if qf:
            pool = qf

    def cmp(a, b):
        if b["minExist"] != a["minExist"]:
            return b["minExist"] - a["minExist"]
        qa = qc[a["quad"]]
        qb = qc[b["quad"]]
        if qa != qb:
            return qa - qb
        base = cand_cmp(mapcenter, sea_first, mn, mx)
        return base(a, b)

    return stable_sort(pool, cmp)


for cs in CASES["sortSpread"]:
    cands = [cand_in(a) for a in cs["cands"]]
    mc = (vf(cs["mapCenter"][0]), vf(cs["mapCenter"][1]))
    got = [list(c["h"]) for c in sort_spread(cands, mc, HL(cs["prior"]), cs["bbox"], cs["spreadN"], cs["seaFirst"], cs["minSea"], cs["maxSea"])]
    check(got == cs["order"], f"sortSpread {cs['map']}")


def pick_tied(cands, rand):
    if not cands:
        return None
    top = cands[0]
    if len(cands) == 1:
        return top["h"]
    tie = [x for x in cands if x["dev"] >= top["dev"] - 1 and x["ratio"] >= top["ratio"] - 0.001 and x["sea"] <= top["sea"] + 1]
    return tie[math.floor(rand() * len(tie))]["h"]


for cs in CASES["pickTied"]:
    rand = Rand(cs["seed"])
    got = pick_tied([cand_in(a) for a in cs["cands"]], rand)
    check((None if got is None else list(got)) == cs["result"] and rand.n == cs["randCalls"], f"pickTied {cs['seed']}")


def player_cands(gm, cache, use_sea, min_sea, require):
    out = []
    for mass in cache.masses:
        for h in mass:
            if not passes_player(gm, cache, h[0], h[1]):
                continue
            sea = sea_at(gm, use_sea, h[0], h[1], min_sea)
            if require and use_sea and not passes_sea(gm, use_sea, h[0], h[1], min_sea):
                continue
            out.append(mk_cand(gm, cache, h, use_sea, min_sea))
    return out


def cand_line(c):
    def fs(x):
        return "Infinity" if x == math.inf else ("-Infinity" if x == -math.inf else (repr(int(x)) if float(x).is_integer() else repr(float(x))))

    return f"{c['h'][0]},{c['h'][1]},{fs(c['ratio'])},{c['land']},{c['total']},{c['dev']},{fs(c['sea'])}"


for cs in CASES["playerCands"]:
    gm = MAPS[cs["map"]]
    got = player_cands(gm, CACHES[cs["map"]], cs["useSea"], cs["minSea"], cs["requireSeaGate"])
    check(len(got) == cs["count"] and fnv(";".join(cand_line(c) for c in got)) == cs["fnv"], f"playerCands {cs['map']} {cs['minSea']}")


def pick_player(gm, cache, ladowe, mapcenter, rand, use_sea, min_sea):
    strict = player_cands(gm, cache, use_sea, min_sea, True)
    if strict:
        strict = sort_spawn(strict, mapcenter)
        picked = pick_tied(strict, rand)
        if picked:
            return picked
    fb = []
    for h in ladowe:
        c = mk_cand(gm, cache, h, use_sea, min_sea)
        if not passes_player(gm, cache, h[0], h[1]):
            continue
        if use_sea and not passes_sea(gm, use_sea, h[0], h[1], min_sea):
            continue
        fb.append(c)
    fb = sort_spawn(fb, mapcenter)
    return fb[0]["h"] if fb else None


for cs in CASES["pickPlayer"]:
    gm = MAPS[cs["map"]]
    rand = Rand(cs["seed"])
    mc = ((gm.w - 1) / 2, (gm.h - 1) / 2)
    got = pick_player(gm, CACHES[cs["map"]], ladowe_of(gm), mc, rand, cs["useSea"], cs["minSea"])
    check((None if got is None else list(got)) == cs["result"] and rand.n == cs["randCalls"], f"pickPlayer {cs['map']} {cs['seed']}")


def pick_best_local(gm, cache, pool, existing, min_dist, rand, use_sea, min_sea):
    base = []
    for h in pool:
        if not all(hd(h[0], h[1], p[0], p[1]) >= min_dist for p in existing):
            continue
        c = mk_cand(gm, cache, h, use_sea, min_sea)
        if c["ratio"] >= LOCAL_FRAC:
            base.append(c)
    cands = [x for x in base if (not use_sea) or passes_sea(gm, use_sea, x["h"][0], x["h"][1], min_sea)]
    sea_first = len(cands) == 0 and use_sea and min_sea > 0
    if sea_first:
        cands = list(base)

    def cmp(a, b):
        if sea_first and b["sea"] != a["sea"]:
            return b["sea"] - a["sea"]
        core = js_or(b["dev"] - a["dev"], b["ratio"] - a["ratio"])
        if core != 0:
            return core
        return js_or(js_or(a["sea"] - b["sea"], a["h"][0] - b["h"][0]), a["h"][1] - b["h"][1])

    cands = stable_sort(cands, cmp)
    if not cands:
        return None
    top = cands[0]
    if len(cands) > 1 and rand:
        tb = [x for x in cands if x["dev"] >= top["dev"] - 1 and x["ratio"] >= top["ratio"] - 0.001 and x["sea"] <= top["sea"] + 1]
        return tb[math.floor(rand() * len(tb))]["h"]
    return top["h"]


for cs in CASES["pickBestLocal"]:
    gm = MAPS[cs["map"]]
    rand = Rand(cs["seed"]) if cs["withRand"] else None
    got = pick_best_local(gm, CACHES[cs["map"]], HL(cs["pool"]), HL(cs["existing"]), cs["minDist"], rand, cs["useSea"], cs["minSea"])
    check((None if got is None else list(got)) == cs["result"] and (rand.n if rand else 0) == cs["randCalls"], f"pickBestLocal {cs['map']}")

for cs in CASES["voronoi"]:
    lad = HL(cs["ladowe"])
    cen = HL(cs["centers"])
    if not cen and lad:
        check(cs["throws"] is True, "voronoi powinno rzucac")
        continue
    regs = [[] for _ in cen]
    for h in lad:
        bi, bd = 0, math.inf
        for ci, c in enumerate(cen):
            d = hd(h[0], h[1], c[0], c[1])
            if d < bd:
                bd, bi = d, ci
        regs[bi].append(h)
    check(cs["throws"] is False and [len(r) for r in regs] == cs["sizes"] and fnv("|".join(digest(r) for r in regs)) == cs["fnv"], "voronoi")

for cs in CASES["centroid"]:
    mass = HL(cs["mass"])
    sq = sr = 0
    for h in mass:
        sq += h[0]
        sr += h[1]
    n = len(mass)
    qv = sq / n if n else math.nan
    rv = sr / n if n else math.nan
    check(same(qv, vf(cs["q"])) and same(rv, vf(cs["r"])), "centroid")


def centroid(mass):
    sq = sr = 0
    for h in mass:
        sq += h[0]
        sr += h[1]
    return (sq / len(mass), sr / len(mass))


def pick_center_in_mass(mass, existing, min_dist, prefer, rand):
    cen = centroid(mass)
    cands = []
    for h in mass:
        if not all(hd(h[0], h[1], p[0], p[1]) >= min_dist for p in existing):
            continue
        sc = hd(h[0], h[1], cen[0], cen[1]) + (hd(h[0], h[1], prefer[0], prefer[1]) * 0.05 if prefer else 0) + (rand() * 0.01 if rand else 0)
        cands.append((h, sc))
    cands = stable_sort(cands, lambda a, b: a[1] - b[1])
    return cands[0][0] if cands else None


for cs in CASES["pickCenterInMass"]:
    mass = MASSES[cs["map"]][cs["massIndex"]]
    check(digest(mass) == cs["massFnv"], "pickCenterInMass: ta sama masa")
    rand = Rand(cs["seed"]) if cs["withRand"] else None
    got = pick_center_in_mass(mass, HL(cs["existing"]), cs["minDist"], H(cs["preferNear"]) if cs["preferNear"] else None, rand)
    check((None if got is None else list(got)) == cs["result"] and (rand.n if rand else 0) == cs["randCalls"], "pickCenterInMass")


def pick_center_gate(gm, cache, mass, existing, min_dist, prefer, rand, use_sea, min_sea):
    cen = centroid(mass)
    base = []
    for h in mass:
        if not all(hd(h[0], h[1], p[0], p[1]) >= min_dist for p in existing):
            continue
        c = mk_cand(gm, cache, h, use_sea, min_sea)
        c["score"] = hd(h[0], h[1], cen[0], cen[1]) + (hd(h[0], h[1], prefer[0], prefer[1]) * 0.05 if prefer else 0)
        if c["ratio"] >= LOCAL_FRAC:
            base.append(c)
    cands = [x for x in base if (not use_sea) or passes_sea(gm, use_sea, x["h"][0], x["h"][1], min_sea)]
    sea_first = len(cands) == 0 and use_sea and min_sea > 0
    if sea_first:
        cands = list(base)

    def cmp(a, b):
        if sea_first and b["sea"] != a["sea"]:
            return b["sea"] - a["sea"]
        core = js_or(b["dev"] - a["dev"], b["ratio"] - a["ratio"])
        if core != 0:
            return core
        return js_or(b["sea"] - a["sea"], a["score"] - b["score"])

    cands = stable_sort(cands, cmp)
    if not cands:
        return None
    top = cands[0]
    if rand and len(cands) > 1:
        tb = [x for x in cands if x["dev"] >= top["dev"] - 1 and x["ratio"] >= top["ratio"] - 0.001]
        return tb[math.floor(rand() * len(tb))]["h"]
    return top["h"]


for cs in CASES["pickCenterGate"]:
    gm = MAPS[cs["map"]]
    mass = MASSES[cs["map"]][cs["massIndex"]]
    rand = Rand(cs["seed"]) if cs["withRand"] else None
    got = pick_center_gate(gm, CACHES[cs["map"]], mass, HL(cs["existing"]), cs["minDist"], H(cs["preferNear"]) if cs["preferNear"] else None, rand, cs["useSea"], cs["minSea"])
    check((None if got is None else list(got)) == cs["result"] and (rand.n if rand else 0) == cs["randCalls"], f"pickCenterGate {cs['map']}")


def pick_center_spread(gm, cache, mass, existing, min_dist, rand, use_sea, min_sea, bbox, n_needed):
    """n_needed: None = brak spreadOpts."""
    midq = (bbox["minQ"] + bbox["maxQ"]) / 2 if bbox else 0
    midr = (bbox["minR"] + bbox["maxR"]) / 2 if bbox else 0
    qc = count_quads(existing, midq, midr) if bbox else None
    base = []
    for h in mass:
        if not all(hd(h[0], h[1], p[0], p[1]) >= min_dist for p in existing):
            continue
        ratio, land, total = local_land(gm, h[0], h[1])
        e = {
            "h": h,
            "ratio": ratio,
            "sea": sea_at(gm, use_sea, h[0], h[1], min_sea),
            "minExist": 999 if not existing else min(hd(h[0], h[1], p[0], p[1]) for p in existing),
            "quad": quad_index(h[0], h[1], midq, midr) if bbox else 0,
        }
        if ratio >= LOCAL_FRAC:
            base.append(e)
    cands = [x for x in base if (not use_sea) or passes_sea(gm, use_sea, x["h"][0], x["h"][1], min_sea)]
    if not cands and use_sea and min_sea > 0:
        cands = list(base)
    if not cands:
        return None
    if bbox and qc is not None and n_needed is not None and n_needed >= 5:
        pref = preferred_quads(qc, n_needed)
        if pref is not None and len(pref) > 0:
            qf = [c for c in cands if c["quad"] in pref]
            if qf:
                cands = qf

    def cmp(a, b):
        if b["minExist"] != a["minExist"]:
            return b["minExist"] - a["minExist"]
        if qc is not None:
            qa = qc[a["quad"]]
            qb = qc[b["quad"]]
            if qa != qb:
                return qa - qb
        asc = min(a["sea"], min_sea + 4)
        bsc = min(b["sea"], min_sea + 4)
        if bsc != asc:
            return bsc - asc
        return js_or((rand() * 2 - 1) if rand else 0, a["h"][0] - b["h"][0])

    cands = v8_sort(cands, cmp)
    top = cands[0]
    if rand and len(cands) > 1:

        def inband(x):
            if x["minExist"] < top["minExist"] - 1:
                return False
            if qc is not None:
                tq = qc[top["quad"]]
                return qc[x["quad"]] <= tq + 1
            return True

        band = [x for x in cands if inband(x)]
        return band[math.floor(rand() * len(band))]["h"]
    return top["h"]


for cs in CASES["pickCenterSpread"]:
    gm = MAPS[cs["map"]]
    mass = MASSES[cs["map"]][cs["massIndex"]]
    rand = Rand(cs["seed"]) if cs["withRand"] else None
    got = pick_center_spread(gm, CACHES[cs["map"]], mass, HL(cs["existing"]), cs["minDist"], rand, cs["useSea"], cs["minSea"], cs["bbox"], cs["nNeeded"])
    check((None if got is None else list(got)) == cs["result"] and (rand.n if rand else 0) == cs["randCalls"], f"pickCenterSpread {cs['map']} {cs['seed']}")

for cs in CASES["pickCenterPool"]:
    gm = MAPS[cs["map"]]
    rand = Rand(cs["seed"])
    lad = ladowe_of(gm)
    xs = [h[0] for h in lad]
    ys = [h[1] for h in lad]
    bbox = {"minQ": min(xs), "maxQ": max(xs), "minR": min(ys), "maxR": max(ys)}
    got = pick_center_spread(gm, CACHES[cs["map"]], HL(cs["pool"]), HL(cs["existing"]), cs["minDist"], rand, cs["useSea"], cs["minSea"], bbox, cs["nNeeded"])
    check((None if got is None else list(got)) == cs["result"] and rand.n == cs["randCalls"], f"pickCenterPool {cs['map']}")


def bbox_of(lad):
    xs = [h[0] for h in lad]
    ys = [h[1] for h in lad]
    return {"minQ": min(xs), "maxQ": max(xs), "minR": min(ys), "maxR": max(ys)}


def balance(gm, cache, centers, ladowe, min_dist, rand, use_sea, min_sea, bbox, max_iter, n_needed):
    if len(centers) < 2 or max_iter <= 0:
        return list(centers)
    out = list(centers)
    for _ in range(max_iter):
        far = None
        for h in ladowe:
            if not passes_local(gm, h[0], h[1]):
                continue
            if use_sea and min_sea > 0 and not passes_sea(gm, use_sea, h[0], h[1], min_sea):
                continue
            mcd = min(hd(h[0], h[1], c[0], c[1]) for c in out)
            if far is None or mcd > far[2]:
                far = (h[0], h[1], mcd)
        if far is None or far[2] < min_dist * 0.75:
            break
        ti, ts = 0, math.inf
        for i in range(len(out)):
            others = [c for j, c in enumerate(out) if j != i]
            m = min_sep(out[i], others)
            sep = math.inf if m is None else m
            if sep < ts:
                ts, ti = sep, i
        others = [c for j, c in enumerate(out) if j != ti]
        reloc = pick_center_spread(gm, cache, ladowe, others, min_dist, rand, use_sea, min_sea, bbox, n_needed)
        if reloc is None:
            break
        toward = hd(reloc[0], reloc[1], far[0], far[1])
        cur = hd(out[ti][0], out[ti][1], far[0], far[1])
        sb = quad_spread(out, bbox)[0]
        sa = quad_spread(others + [reloc], bbox)[0]
        if toward < cur - 2 or far[2] > min_dist * 1.25 or sa > sb:
            out[ti] = reloc
        else:
            break
    return out


def enforce(gm, cache, centers, ladowe, min_dist, rand, use_sea, min_sea, bbox, n_needed):
    if n_needed < 5 or len(centers) < 3:
        return list(centers)
    required = min_quarters(n_needed)
    out = list(centers)
    midq = (bbox["minQ"] + bbox["maxQ"]) / 2
    midr = (bbox["minR"] + bbox["maxR"]) / 2
    for _ in range(10):
        spread = quad_spread(out, bbox)
        if spread[0] >= required:
            break
        counts = count_quads(out, midq, midr)
        ri, ml = -1, -1
        for i, c in enumerate(out):
            q = quad_index(c[0], c[1], midq, midr)
            if counts[q] > ml:
                ml, ri = counts[q], i
        if ri < 0 or ml <= 1:
            break
        others = [c for j, c in enumerate(out) if j != ri]
        reloc = pick_center_spread(gm, cache, ladowe, others, min_dist, rand, use_sea, min_sea, bbox, n_needed)
        if reloc is None:
            break
        ns = quad_spread(others + [reloc], bbox)
        nq = quad_index(reloc[0], reloc[1], midq, midr)
        if ns[0] > spread[0] or counts[nq] == 0:
            out[ri] = reloc
        else:
            break
    return out


for cs in CASES["balance"]:
    gm = MAPS[cs["map"]]
    lad = ladowe_of(gm)
    rand = Rand(cs["seed"])
    mi = 2 if cs["maxIterations"] is None else cs["maxIterations"]
    got = balance(gm, CACHES[cs["map"]], HL(cs["centers"]), lad, cs["minDist"], rand, cs["useSea"], cs["minSea"], bbox_of(lad), mi, cs["nNeeded"])
    check([list(h) for h in got] == cs["result"] and rand.n == cs["randCalls"], f"balance {cs['map']} {cs['seed']}")
for cs in CASES["enforce"]:
    gm = MAPS[cs["map"]]
    lad = ladowe_of(gm)
    rand = Rand(cs["seed"])
    got = enforce(gm, CACHES[cs["map"]], HL(cs["centers"]), lad, cs["minDist"], rand, cs["useSea"], cs["minSea"], bbox_of(lad), cs["nNeeded"])
    check([list(h) for h in got] == cs["result"] and rand.n == cs["randCalls"], f"enforce {cs['map']} {cs['seed']}")


# ---- placeClusterCentersAcrossLandmasses ------------------------------------------------------
PHASES = {}


def phase(name):
    PHASES[name] = PHASES.get(name, 0) + 1


def place(gm, ladowe, cache, n_needed, min_dist_base, mapcenter, rand, margin, bounds, use_sea, min_sea):
    masses = cache.masses
    centers = []
    hard_min = max(1, min_dist_base)
    bb = bbox_of(ladowe) if ladowe else {"minQ": math.inf, "maxQ": -math.inf, "minR": math.inf, "maxR": -math.inf}
    spread_n = n_needed

    def ok_margins(q, r, relax):
        if relax:
            return True
        return q - bounds[0] >= margin and bounds[1] - q >= margin and r - bounds[2] >= margin and bounds[3] - r >= margin

    def try_place(c, md, relax, for_player=False, soft=False):
        if c is None or any(p == c for p in centers):
            return False
        if not ok_margins(c[0], c[1], relax):
            return False
        if any(hd(c[0], c[1], p[0], p[1]) < md for p in centers):
            return False
        if for_player:
            if not passes_player(gm, cache, c[0], c[1]):
                return False
        elif not soft and not passes_local(gm, c[0], c[1]):
            return False
        centers.append(c)
        return True

    lens = [len(m) for m in masses]
    qi = [0] if len(masses) == 1 else [i for i in range(len(masses)) if qualifies(lens[i], lens)]
    pool_full = []
    for mi in qi:
        pool_full.extend(masses[mi])
    pool = pool_full if pool_full else ladowe

    def spread_pick(cands_mass, existing):
        return pick_center_spread(gm, cache, cands_mass, existing, hard_min, rand, use_sea, min_sea, bb, spread_n)

    pc = pick_player(gm, cache, ladowe, mapcenter, rand, use_sea, min_sea)
    if pc:
        centers.append(pc)
    n_foreign = n_needed - len(centers)
    alloc = allocate(n_foreign, lens)
    p_on0 = bool(pc) and cache.index.get(pc) == 0
    qorder = stable_sort(list(qi), lambda a, b: lens[b] - lens[a])

    for mi in qorder:
        if len(centers) >= n_needed:
            break
        target = alloc[mi] if mi < len(alloc) else 0
        p_on = mi == 0 and p_on0
        while len(centers) < n_needed:
            cur = len([c for c in centers if cache.index.get(c) == mi]) - (1 if p_on else 0)
            if cur >= target:
                break
            before = len(centers)
            cand = spread_pick(pool, centers) if len(masses) == 1 else spread_pick(masses[mi], centers)
            try_place(cand, hard_min, False)
            if len(centers) > before:
                phase("faza1_postawiono")
            if len(centers) == before:
                phase("faza1_brak_postepu")
                break

    if len(centers) < n_needed and qorder:
        phase("faza2_wejscie")
        guard = 0
        while len(centers) < n_needed and guard < n_needed * 6:
            guard += 1
            placed = False
            cand = spread_pick(pool, centers) if len(masses) == 1 else None
            if cand:
                if try_place(cand, hard_min, True):
                    placed = True
            if not placed:
                for mi in qorder:
                    if len(centers) >= n_needed:
                        break
                    before = len(centers)
                    try_place(spread_pick(masses[mi], centers), hard_min, True)
                    if len(centers) > before:
                        placed = True
                        break
            if placed:
                phase("faza2_postawiono")
            if not placed:
                break

    if len(centers) >= 2:
        phase("faza3_wejscie")
        iters = max(2, min(6, math.ceil(n_needed / 2)))
        before_bal = list(centers)
        centers = balance(gm, cache, centers, pool, hard_min, rand, use_sea, min_sea, bb, iters, spread_n)

    if len(centers) >= 2 and centers != before_bal:
        phase("faza3_przesunieto")
    if len(centers) >= 3 and n_needed >= 5:
        phase("faza4_wejscie")
        before_enf = list(centers)
        centers = enforce(gm, cache, centers, pool, hard_min, rand, use_sea, min_sea, bb, n_needed)
        if centers != before_enf:
            phase("faza4_przesunieto")

    if len(centers) < n_needed:
        phase("faza5_wejscie")
        guard = 0
        while len(centers) < n_needed and guard < n_needed * 12:
            guard += 1
            before = len(centers)
            try_place(spread_pick(pool, centers), hard_min, True)
            if len(centers) > before:
                phase("faza5_postawiono")
            if len(centers) == before:
                break

    if len(centers) < n_needed:
        phase("faza5b_wejscie")
        guard = 0
        while len(centers) < n_needed and guard < n_needed * 16:
            guard += 1
            before = len(centers)
            cl = []
            for h in pool:
                if all(hd(h[0], h[1], p[0], p[1]) >= hard_min for p in centers):
                    cl.append((h, 999 if not centers else min(hd(h[0], h[1], p[0], p[1]) for p in centers), gm.sea.get(h, 0) if use_sea else 0))
            cl = stable_sort(cl, lambda a, b: js_or(b[1] - a[1], b[2] - a[2]))
            cand = cl[0][0] if cl else None
            try_place(cand, hard_min, True, False, True)
            if len(centers) > before:
                phase("faza5b_postawiono")
            if len(centers) == before:
                break

    return centers[:n_needed] if n_needed >= 0 else centers[:n_needed]


for cs in CASES["place"]:
    gm = MAPS[cs["map"]]
    empty = cs.get("empty")
    lad = [] if empty else ladowe_of(gm)
    cache = Cache([]) if empty else CACHES[cs["map"]]
    rand = Rand(cs["seed"])
    mc = ((gm.w - 1) / 2, (gm.h - 1) / 2)
    got = place(gm, lad, cache, cs["nNeeded"], cs["minDistBase"], mc, rand, cs["margin"], (0, gm.w - 1, 0, gm.h - 1), cs["useSea"], cs["minSea"])
    check([list(h) for h in got] == cs["result"] and rand.n == cs["randCalls"], f"place {cs['map']} n={cs['nNeeded']} seed={cs['seed']}")


# ----------------------------------------------------------------------------------------------
# 8. startScoring
# ----------------------------------------------------------------------------------------------
def can_found(t):
    return foundable(t)


def score_start(gm, q, r):
    t = gm.t.get((q, r))
    if t is None or not can_found(t):
        return -math.inf
    s = 0
    if t in ("laka", "rownina"):
        s += SP["laka_rownina"]["wartosc"]
    elif t == "wzgorza":
        s += SP["wzgorza"]["wartosc"]
    elif t == "pustynia":
        s -= -SP["pustynia"]["wartosc"]
    else:
        s += SP["inny_teren"]["wartosc"]
    if gm.river.get((q, r)):
        s += SP["rzeka_na_hexie"]["wartosc"]
    adj = False
    for dq, dr in [(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]:
        if gm.river.get((q + dq, r + dr)):
            adj = True
    if adj:
        s += SP["rzeka_u_sasiada"]["wartosc"]
    for dq in range(-4, 5):
        for dr in range(-4, 5):
            d = hd(q, r, q + dq, r + dr)
            if d == 0 or d > 4:
                continue
            nb = gm.t.get((q + dq, r + dr))
            if nb is None:
                continue
            if nb in ("laka", "rownina"):
                s += 2 if d <= 2 else 0.5
            if 2 <= d <= 4:
                if nb == "gory":
                    s += 3
                elif nb == "wzgorza":
                    s += 1.5
    return s


for cs in CASES["scoreStart"]:
    check(same(score_start(MAPS[cs["map"]], cs["q"], cs["r"]), vf(cs["score"])), f"scoreStart {cs}")
for mid, lst in CASES["scoreStartAll"].items():
    gm = MAPS[mid]
    for (q, r), want in zip(gm.order, lst):
        check(same(score_start(gm, q, r), vf(want)), f"scoreStartAll {mid} {q},{r}")


def find_best(gm):
    cq = math.floor((gm.w - 1) / 2 + 0.5)
    cr = math.floor((gm.h - 1) / 2 + 0.5)
    lad = [h for h in gm.order if can_found(gm.t[h])]
    masses = group_masses(lad)
    cache = Cache(masses)
    on0 = cache.sets[0] if masses else None
    ordered = sorted(gm.order, key=lambda h: (1 if on0 is None else (0 if h in on0 else 1)))
    best = None
    bs = -math.inf
    bcd = math.inf
    for h in ordered:
        q, r = h
        if not passes_player(gm, cache, q, r):
            continue
        s = score_start(gm, q, r)
        if s == -math.inf:
            continue
        comb = s + dev_space(gm, cache, q, r) * 0.05
        cd = hd(q, r, cq, cr)
        if comb > bs or (comb == bs and cd < bcd):
            bs, bcd, best = comb, cd, h
    return best


for cs in CASES["bestStart"]:
    got = find_best(MAPS[cs["map"]])
    check((None if got is None else list(got)) == cs["result"], f"bestStart {cs['map']}")
for cs in CASES["reveal"]:
    want = PR["easy"]["wartosc"] if cs["diff"] == "easy" else PR["hard"]["wartosc"] if cs["diff"] == "hard" else PR["normal"]["wartosc"]
    check(want == cs["result"], f"reveal {cs['diff']}")

# ----------------------------------------------------------------------------------------------
# 9. Sortowanie V8
# ----------------------------------------------------------------------------------------------
for cs in CASES["v8sort"]:
    items = [{"v": v, "id": i} for i, v in enumerate(cs["input"])]
    rand = Rand(cs["seed"])
    kind = cs["kind"]
    if kind == "num":
        cmpf = lambda a, b: a["v"] - b["v"]
    elif kind == "randSign":
        cmpf = lambda a, b: js_or(rand() * 2 - 1, a["v"] - b["v"])
    elif kind == "randTern":
        cmpf = lambda a, b: math.floor(rand() * 3) - 1
    else:
        cmpf = lambda a, b: math.nan if a["v"] % 7 == 0 else a["v"] - b["v"]
    out = v8_sort(items, cmpf)
    calls = v8_sort.last_calls if len(items) >= 2 else 0
    check([x["id"] for x in out] == cs["order"] and calls == cs["cmpCalls"] and rand.n == cs["randCalls"], f"v8sort {cs['name']} {kind} n={cs['n']}")

print("pokrycie faz place (informacyjnie):", json.dumps(PHASES, sort_keys=True))
print(f"sprawdzen: {checks}, rozbieznosci: {bad}")
sys.exit(1 if bad else 0)
