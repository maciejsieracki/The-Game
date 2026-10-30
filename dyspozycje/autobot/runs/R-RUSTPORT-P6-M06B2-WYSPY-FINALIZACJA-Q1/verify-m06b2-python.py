#!/usr/bin/env python3
"""Niezalezny weryfikator P6.M06B2 (Python, od zera z TS pinu edb8fb56; NIE korzysta z kodu Rust).

Zakres (r2, wszystkie 6 symboli partii M06B2):
  - minTinyIslandHexesForTyp (gen-helpers.ts:4992)       - wartosci czytane z TS regexem
  - removeTinyLandIslands (:4946)
  - countOpenOceanLandSpecks (:5006), purgeOpenOceanLandSpecks (:5027)
  - finalizeLandMassAfterCoast (:5050) wraz z lancuchem: finalizeCoastAndInlandWater (:4787),
    removeInlandWaterPools (:4137), removeSmallInlandWaterPools (:4276), applyDoubleCoastRing (:3923),
    applyCoastRing (:3894), sanitizeCoastHexes (:3975), findDryLandTouchingSea (:3949),
    findInlandWaterHexes (:4109), oceanConnectedWaterKeys (:4026), enforceMapBorderOcean (:1388)
  - enforceTargetDryLandFraction (:5079) wraz z applyLandFractionByScore (:3444), sortLandKeysForErosion
    (:3207), mapCenterDistanceNorm (:1326), hexBorderDistance (:1334), isInMapBorder (:1338),
    countLandSeaHexes (:3268), setHexToMorze (:3325), setHexToLaka (:3332)
Stale z TS (regex, nie z repo): progi minTiny, PANGEA_LAND_FILL_MIN_SCORE (:3438),
MAP_BORDER_OCEAN_HEXES (:1177), MAP_MARGIN_LAND_ZONE_HEXES (:1180), ERODE_TERRAIN_ORDER (:3279).
Wektory (JSON) sluza WYLACZNIE jako wejscie/oczekiwany wynik weba; logika jest tutaj.

Uzycie: python3 -I verify-m06b2-python.py <KATALOG_WEB_TS (gra/src/map/gen-helpers.ts)> <KATALOG_WEKTOROW>
Wyjscie: liczby przypadkow i rozbieznosci (0 = zgodnosc z wektorem z weba).
"""
import functools
import json
import math
import os
import re
import sys

WEB_TS, VEC = sys.argv[1], sys.argv[2]
WATER = {"morze", "plytkie_morze"}
DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]


def ts_const(text, pattern, cast):
    m = re.search(pattern, text)
    if not m:
        raise SystemExit(f"brak stalej w TS: {pattern}")
    return cast(m.group(1))


TS_TEXT = open(WEB_TS, encoding="utf-8").read()
PANGEA_MIN = ts_const(TS_TEXT, r"const PANGEA_LAND_FILL_MIN_SCORE = ([0-9.]+);", float)
BORDER_B = ts_const(TS_TEXT, r"export const MAP_BORDER_OCEAN_HEXES = (\d+);", int)
MARGIN_Z = ts_const(TS_TEXT, r"export const MAP_MARGIN_LAND_ZONE_HEXES = (\d+);", int)
ERODE_ORDER = re.search(r"const ERODE_TERRAIN_ORDER: TerenBazowy\[\] = \[(.*?)\];", TS_TEXT, re.S)
ERODE_NAMES = {"PlytkieMorze": "plytkie_morze", "Laka": "laka", "Pustynia": "pustynia",
               "Rownina": "rownina", "Wzgorza": "wzgorza", "Gory": "gory"}
ERODE_RANK = {ERODE_NAMES[n]: i for i, n in enumerate(re.findall(r"TerenBazowy\.(\w+)", ERODE_ORDER.group(1)))}


def js_round(x):
    # JS Math.round: half up (w strone +inf); Python round() jest bankierskie - nie uzywac.
    return math.floor(x + 0.5)


def hkey(q, r):
    return f"{q},{r}"


def qr(k):
    a, b = k.split(",")
    return int(a), int(b)


def is_water(t):
    return t in WATER


def is_dry(t):
    return not is_water(t)


def load_hexes(rows):
    hexes = {}
    for k, terr, nak, z, ro, ed in rows:
        hexes[k] = {"t": terr, "n": nak, "z": z == 1, "ro": ro == 1, "ed": list(ed)}
    return hexes


def dump(hexes):
    return [[k, h["t"], h["n"], 1 if h["z"] else 0, 1 if h["ro"] else 0, list(h["ed"])] for k, h in hexes.items()]


def expected_from(rows, diff):
    """Stan oczekiwany = wiersze wejsciowe z podmienionymi wierszami z diff (po kluczu, kolejnosc zachowana)."""
    new = {r[0]: r for r in diff}
    return [new.get(r[0], r) for r in rows]


# ---------- helpery siatki (TS: gen-helpers.ts 1326-1341, 3202-3205, 3268-3323) ----------
def border_dist(q, r, W, H):
    return min(q, r, W - 1 - q, H - 1 - r)


def in_border(q, r, W, H, buf=None):
    b = BORDER_B if buf is None else buf
    return border_dist(q, r, W, H) < b


def center_norm(q, r, W, H):
    cx = (W - 1) / 2
    cy = (H - 1) / 2
    dx = (q - cx) / (cx + 0.5)
    dy = (r - cy) / (cy + 0.5)
    return math.sqrt(dx * dx + dy * dy)


def count_land_sea(hexes):
    land = sum(1 for h in hexes.values() if not is_water(h["t"]))
    return land, len(hexes) - land


def set_hex_to_morze(h):
    # TS setHexToMorze (gen-helpers.ts:3325): Morze, nakladka Brak, rzeka wylaczona, zloze usuniete.
    h["t"] = "morze"
    h["n"] = "brak"
    h["ro"] = False
    h["ed"] = []
    h["z"] = False


def set_hex_to_laka(h):
    # TS setHexToLaka (gen-helpers.ts:3332): Laka, nakladka Brak, zloze usuniete; rzeka BEZ zmiany.
    h["t"] = "laka"
    h["n"] = "brak"
    h["z"] = False


def dry_neighbors(hexes, q, r):
    n = 0
    for dq, dr in DIRS:
        nh = hexes.get(hkey(q + dq, r + dr))
        if nh is None:
            continue
        if not is_water(nh["t"]):
            n += 1
    return n


def water_neighbors(hexes, q, r):
    n = 0
    for dq, dr in DIRS:
        nh = hexes.get(hkey(q + dq, r + dr))
        if nh is not None and is_water(nh["t"]):
            n += 1
    return n


def dry_neighbor_count_any(hexes, q, r):
    # TS countLandNeighbors (:3304) = sasiedzi suchego lądu.
    return dry_neighbors(hexes, q, r)


# ---------- M06B1-lancuch: finalizeCoastAndInlandWater ----------
def ocean_connected(hexes, W, H):
    # TS oceanConnectedWaterKeys (gen-helpers.ts:4026): BFS po wodzie od wody na krawedzi mapy.
    conn = set()
    queue = []
    for r in range(H):
        for q in range(W):
            if q != 0 and r != 0 and q != W - 1 and r != H - 1:
                continue
            k = hkey(q, r)
            h = hexes.get(k)
            if h is None or not is_water(h["t"]):
                continue
            conn.add(k)
            queue.append(k)
    while queue:
        k = queue.pop()
        q, r = qr(k)
        for dq, dr in DIRS:
            nk = hkey(q + dq, r + dr)
            nh = hexes.get(nk)
            if nh is None or not is_water(nh["t"]) or nk in conn:
                continue
            conn.add(nk)
            queue.append(nk)
    return conn


def find_inland_water(hexes, W, H):
    # TS findInlandWaterHexes (:4109).
    ocean = ocean_connected(hexes, W, H)
    return [k for k, h in hexes.items() if is_water(h["t"]) and k not in ocean]


def remove_inland_water_pools(hexes, W, H):
    # TS removeInlandWaterPools (:4137): zmienia TYLKO teren, nakladke i zloze (rzeka bez zmian).
    inland = find_inland_water(hexes, W, H)
    for k in inland:
        h = hexes[k]
        h["t"] = "laka"
        h["n"] = "brak"
        h["z"] = False
    return len(inland)


def remove_small_inland_water_pools(hexes, W, H, max_pool):
    # TS removeSmallInlandWaterPools (:4276).
    inland = find_inland_water(hexes, W, H)
    inland_set = set(inland)
    visited = set()
    converted = 0
    for start in inland:
        if start in visited:
            continue
        comp = []
        stack = [start]
        visited.add(start)
        while stack:
            k = stack.pop()
            comp.append(k)
            q, r = qr(k)
            for dq, dr in DIRS:
                nk = hkey(q + dq, r + dr)
                if nk not in inland_set or nk in visited:
                    continue
                visited.add(nk)
                stack.append(nk)
        if len(comp) > max_pool:
            continue
        for k in comp:
            h = hexes[k]
            h["t"] = "laka"
            h["n"] = "brak"
            h["z"] = False
            converted += 1
    return converted


def apply_coast_ring(hexes):
    # TS applyCoastRing (:3894): Morze przy suchym lądzie -> Plytkie (rzeka bez zmian).
    to_coast = []
    for k, h in hexes.items():
        if h["t"] != "morze":
            continue
        q, r = qr(k)
        for dq, dr in DIRS:
            nb = hexes.get(hkey(q + dq, r + dr))
            if nb is not None and is_dry(nb["t"]):
                to_coast.append(k)
                break
    for k in to_coast:
        h = hexes[k]
        h["t"] = "plytkie_morze"
        h["n"] = "brak"
        h["z"] = False
    return len(to_coast)


def apply_double_coast_ring(hexes):
    # TS applyDoubleCoastRing (:3923).
    n = apply_coast_ring(hexes)
    to_coast = []
    for k, h in hexes.items():
        if h["t"] != "morze":
            continue
        q, r = qr(k)
        for dq, dr in DIRS:
            nb = hexes.get(hkey(q + dq, r + dr))
            if nb is not None and nb["t"] == "plytkie_morze":
                to_coast.append(k)
                break
    for k in to_coast:
        h = hexes[k]
        h["t"] = "plytkie_morze"
        h["n"] = "brak"
        h["z"] = False
    return n + len(to_coast)


def find_dry_touching_sea(hexes):
    # TS findDryLandTouchingSea (:3949).
    bad = []
    for k, h in hexes.items():
        if not is_dry(h["t"]):
            continue
        q, r = qr(k)
        for dq, dr in DIRS:
            nb = hexes.get(hkey(q + dq, r + dr))
            if nb is not None and nb["t"] == "morze":
                bad.append(k)
                break
    return bad


def sanitize_coast(hexes):
    # TS sanitizeCoastHexes (:3975): sieroty Plytkie (bez lancucha do lądu) -> Morze (setHexToMorze).
    valid = set()
    queue = []
    for k, h in hexes.items():
        if h["t"] != "plytkie_morze":
            continue
        q, r = qr(k)
        for dq, dr in DIRS:
            nb = hexes.get(hkey(q + dq, r + dr))
            if nb is not None and is_dry(nb["t"]):
                valid.add(k)
                queue.append(k)
                break
    while queue:
        k = queue.pop()
        q, r = qr(k)
        for dq, dr in DIRS:
            nk = hkey(q + dq, r + dr)
            if nk in valid:
                continue
            nh = hexes.get(nk)
            if nh is not None and nh["t"] == "plytkie_morze":
                valid.add(nk)
                queue.append(nk)
    fixed = 0
    for k, h in hexes.items():
        if h["t"] != "plytkie_morze" or k in valid:
            continue
        set_hex_to_morze(h)
        fixed += 1
    return fixed


def finalize_coast_and_inland_water(hexes, W, H, max_passes=3, pool=None):
    # TS finalizeCoastAndInlandWater (gen-helpers.ts:4787). pool = maxInlandPoolSize albo None.
    for _ in range(max_passes):
        changed = 0
        if pool is not None:
            changed += remove_small_inland_water_pools(hexes, W, H, pool)
        else:
            changed += remove_inland_water_pools(hexes, W, H)
        changed += apply_double_coast_ring(hexes)
        changed += sanitize_coast(hexes)
        if pool is not None:
            changed += remove_small_inland_water_pools(hexes, W, H, pool)
        else:
            changed += remove_inland_water_pools(hexes, W, H)
        if len(find_inland_water(hexes, W, H)) == 0 and len(find_dry_touching_sea(hexes)) == 0:
            break
        if changed == 0:
            break


def enforce_map_border_ocean(hexes, W, H):
    # TS enforceMapBorderOcean (gen-helpers.ts:1388): pas d=0..1 -> Morze (r zewnetrzne, q wewnetrzne).
    converted = 0
    for r in range(H):
        for q in range(W):
            if not in_border(q, r, W, H):
                continue
            h = hexes.get(hkey(q, r))
            if h is None or h["t"] == "morze":
                continue
            set_hex_to_morze(h)
            converted += 1
    return converted


# ---------- M06B2: usuwanie wysp i wlasciwa finalizacja ----------
def remove_tiny(hexes, min_hexes):
    # TS removeTinyLandIslands (gen-helpers.ts:4946).
    visited = set()
    removed = 0
    for k in list(hexes.keys()):
        if k in visited:
            continue
        h = hexes.get(k)
        if h is None or is_water(h["t"]):
            continue
        stack = [k]
        comp = []
        visited.add(k)
        while stack:
            cur = stack.pop()
            comp.append(cur)
            q, r = qr(cur)
            for dq, dr in DIRS:
                nk = hkey(q + dq, r + dr)
                if nk in visited:
                    continue
                nh = hexes.get(nk)
                if nh is None or is_water(nh["t"]):
                    continue
                visited.add(nk)
                stack.append(nk)
        if len(comp) >= min_hexes:
            continue
        for c in comp:
            if c in hexes:
                set_hex_to_morze(hexes[c])
                removed += 1
    return removed


def count_specks(hexes):
    # TS countOpenOceanLandSpecks (gen-helpers.ts:5006).
    n = 0
    for k, h in hexes.items():
        if is_water(h["t"]):
            continue
        q, r = qr(k)
        if dry_neighbors(hexes, q, r) == 0:
            n += 1
    return n


def purge_specks(hexes):
    # TS purgeOpenOceanLandSpecks (gen-helpers.ts:5027): sekwencyjnie, stan sasiadow czytany na biezaco.
    removed = 0
    for k in list(hexes.keys()):
        h = hexes[k]
        if is_water(h["t"]):
            continue
        q, r = qr(k)
        if dry_neighbors(hexes, q, r) > 0:
            continue
        set_hex_to_morze(h)
        removed += 1
    return removed


def min_tiny_for_typ(typ, values):
    return values[typ]


def finalize_land_mass_after_coast(hexes, typ, W, H, values, pool=None, coast_passes=2):
    # TS finalizeLandMassAfterCoast (gen-helpers.ts:5050).
    min_hexes = min_tiny_for_typ(typ, values)
    total = 0
    for pass_i in range(3):
        total += remove_tiny(hexes, min_hexes)
        purged = purge_specks(hexes)
        total += purged
        if purged == 0 and pass_i > 0:
            break
    finalize_coast_and_inland_water(hexes, W, H, coast_passes, pool)
    enforce_map_border_ocean(hexes, W, H)
    return total


# ---------- enforceTargetDryLandFraction (gen-helpers.ts:5079) ----------
def js_cmp_num(x):
    return x


def erode_rank(terr):
    return ERODE_RANK.get(terr, len(ERODE_RANK))


def sort_land_keys_for_erosion(keys, hexes, scores, W, H):
    # TS sortLandKeysForErosion (:3207): komparator niesymetryczny z tolerancja - sortowanie stabilne (TimSort).
    def cmp(a, b):
        qa, ra_ = qr(a)
        qb, rb_ = qr(b)
        ba = border_dist(qa, ra_, W, H)
        bb = border_dist(qb, rb_, W, H)
        if ba != bb:
            return ba - bb
        ca = center_norm(qa, ra_, W, H)
        cb = center_norm(qb, rb_, W, H)
        if abs(ca - cb) > 0.015:
            return cb - ca
        na = water_neighbors(hexes, qa, ra_)
        nb = water_neighbors(hexes, qb, rb_)
        if na != nb:
            return nb - na
        rka = erode_rank(hexes[a]["t"])
        rkb = erode_rank(hexes[b]["t"])
        if rka != rkb:
            return rka - rkb
        return scores.get(a, 0) - scores.get(b, 0)

    return sorted(keys, key=functools.cmp_to_key(cmp))


def apply_land_fraction_by_score(hexes, scores, target, W, H, fill_bias="center", min_mask=PANGEA_MIN):
    # TS applyLandFractionByScore (gen-helpers.ts:3444); width/height zawsze podane w enforce.
    clamped = max(0.15, min(0.85, target))
    keys = list(hexes.keys())
    total = len(keys)
    target_land = js_round(total * clamped)
    land, _ = count_land_sea(hexes)
    adjusted = 0

    def border_ok(k):
        q, r = qr(k)
        return not in_border(q, r, W, H)

    def interior_ok(k):
        q, r = qr(k)
        return border_dist(q, r, W, H) > MARGIN_Z

    if land < target_land:
        def ok_morse(k):
            if hexes[k]["t"] != "morze" or not border_ok(k):
                return False
            if fill_bias == "mask" and scores.get(k, 0) < min_mask:
                return False
            return True

        cands = [k for k in keys if ok_morse(k)]

        def cmp_fill(a, b):
            sa = scores.get(a, 0)
            sb = scores.get(b, 0)
            if abs(sb - sa) > 0.04:
                return sb - sa
            if fill_bias == "mask":
                return (a > b) - (a < b)  # localeCompare dla kluczy "q,r" (ASCII cyfry i przecinek)
            qa, ra_ = qr(a)
            qb, rb_ = qr(b)
            da = center_norm(qa, ra_, W, H)
            db = center_norm(qb, rb_, W, H)
            return da - db

        cands.sort(key=functools.cmp_to_key(cmp_fill))
        for k in cands:
            if land >= target_land:
                break
            set_hex_to_laka(hexes[k])
            land += 1
            adjusted += 1
        if land < target_land:
            interior = []
            for k in keys:
                if hexes[k]["t"] != "morze" or not interior_ok(k):
                    continue
                if fill_bias == "mask" and scores.get(k, 0) < min_mask:
                    continue
                interior.append(k)
            interior.sort(key=functools.cmp_to_key(lambda a, b: scores.get(b, 0) - scores.get(a, 0)))
            for k in interior:
                if land >= target_land:
                    break
                set_hex_to_laka(hexes[k])
                land += 1
                adjusted += 1
    elif land > target_land:
        dry = [k for k in keys if is_dry(hexes[k]["t"])]
        cands = sort_land_keys_for_erosion(dry, hexes, scores, W, H)
        for k in cands:
            if land <= target_land:
                break
            set_hex_to_morze(hexes[k])
            land -= 1
            adjusted += 1
    return adjusted


def enforce_target_dry_land_fraction(hexes, scores, target, W, H, coast_opts_pool=None,
                                     tol_pp=3, fill_bias="center", min_mask=PANGEA_MIN):
    # TS enforceTargetDryLandFraction (gen-helpers.ts:5079). Zwraca `adjusted`.
    clamped = max(0.15, min(0.85, target))
    total = len(hexes)
    target_land = js_round(total * clamped)
    tol_hexes = max(1, js_round(total * tol_pp / 100))
    adjusted = 0

    adjusted += apply_land_fraction_by_score(hexes, scores, clamped, W, H, fill_bias, min_mask)
    enforce_map_border_ocean(hexes, W, H)
    finalize_coast_and_inland_water(hexes, W, H, 1, coast_opts_pool)
    enforce_map_border_ocean(hexes, W, H)

    land, _ = count_land_sea(hexes)
    if abs(land - target_land) > tol_hexes:
        adjusted += apply_land_fraction_by_score(hexes, scores, clamped, W, H, fill_bias, min_mask)
        enforce_map_border_ocean(hexes, W, H)
        apply_coast_ring(hexes)
        land, _ = count_land_sea(hexes)
        if abs(land - target_land) > tol_hexes:
            adjusted += apply_land_fraction_by_score(hexes, scores, clamped, W, H, fill_bias, min_mask)
            enforce_map_border_ocean(hexes, W, H)
    return adjusted


# ---------- driver ----------
def scores_map(rows, arr):
    return {r[0]: float(v) for r, v in zip(rows, arr)}


def ts_min_tiny_values(text):
    """Wartosci `minTinyIslandHexesForTyp` czytane wprost z TS (:4992-4998), bez JSON z repo."""
    m = re.search(r"export function minTinyIslandHexesForTyp\(typ: TypSwiata\): number \{(.*?)\n\}", text, re.S)
    if not m:
        raise SystemExit("nie znaleziono minTinyIslandHexesForTyp w TS")
    return dict((a, int(b)) for a, b in re.findall(r"case '([a-z]+)': return (\d+);", m.group(1)))


def load(name):
    with open(os.path.join(VEC, name), encoding="utf-8") as fh:
        return json.load(fh)


def check_state(rows, hexes, diff):
    return dump(hexes) == expected_from(rows, diff)


def main():
    tv = ts_min_tiny_values(TS_TEXT)
    report = {"progi_ts": tv, "stale_ts": {"PANGEA_MIN": PANGEA_MIN, "BORDER_B": BORDER_B,
                                           "MARGIN_Z": MARGIN_Z, "ERODE_RANK": ERODE_RANK}}
    mismatches = []
    counts = {}

    def bump(k):
        counts[k] = counts.get(k, 0) + 1

    tiny = load("web-tiny.json")
    specks = load("web-specks.json")
    fin = load("web-finalize.json")
    enf = load("web-enforce.json")
    probe = load("web-enforce-probe.json")
    large = load("web-enforce-large.json")

    for c in tiny["cases"]["minTyp"]:
        bump("minTyp")
        if tv.get(c["typ"]) is None or int(c["out"]) != tv[c["typ"]]:
            mismatches.append(("minTyp", c["typ"], c["out"], tv.get(c["typ"])))

    for c in tiny["cases"]["tiny"]:
        bump("removeTiny")
        rows = tiny["maps"][c["mi"]]["rows"]
        hexes = load_hexes(rows)
        ret = remove_tiny(hexes, c["min"])
        if ret != c["out"]["ret"] or not check_state(rows, hexes, c["out"]["diff"]):
            mismatches.append(("removeTiny", c["id"], ret, c["out"]["ret"]))

    for c in specks["cases"]["specks"]:
        bump("countSpecks")
        rows = specks["maps"][c["mi"]]["rows"]
        got = count_specks(load_hexes(rows))
        if got != int(c["out"]):
            mismatches.append(("countSpecks", c["id"], got, c["out"]))

    for c in specks["cases"]["purge"]:
        bump("purgeSpecks")
        rows = specks["maps"][c["mi"]]["rows"]
        hexes = load_hexes(rows)
        ret = purge_specks(hexes)
        if ret != c["out"]["ret"] or not check_state(rows, hexes, c["out"]["diff"]):
            mismatches.append(("purgeSpecks", c["id"], ret, c["out"]["ret"]))
        if count_specks(hexes) != 0:
            mismatches.append(("purgeSpecks-po", c["id"], count_specks(hexes), 0))

    for c in fin["cases"]["finalize"]:
        bump("finalizeLandMass")
        rows = fin["maps"][c["mi"]]["rows"]
        hexes = load_hexes(rows)
        cp = 2 if c["coastPasses"] is None else c["coastPasses"]
        pool = None if c["pool"] is None else c["pool"]
        ret = finalize_land_mass_after_coast(hexes, c["typ"], c["W"], c["H"], tv, pool, cp)
        if ret != c["out"]["ret"] or not check_state(rows, hexes, c["out"]["diff"]):
            mismatches.append(("finalizeLandMass", c["id"], ret, c["out"]["ret"]))

    for c in enf["cases"]["enforce"]:
        bump("enforce")
        rows = enf["maps"][c["mi"]]["rows"]
        sc = scores_map(rows, enf["maps"][c["mi"]]["scores"])
        hexes = load_hexes(rows)
        ret = enforce_target_dry_land_fraction(hexes, sc, c["target"], c["W"], c["H"], None, c["tol"], c["bias"])
        if ret != c["out"]["ret"] or not check_state(rows, hexes, c["out"]["diff"]):
            mismatches.append(("enforce", c["id"], ret, c["out"]["ret"]))

    for name, doc, kind in (("probe", probe, "enforceProbe"), ("large", large, "enforceLarge")):
        for c in doc["cases"][kind]:
            bump(f"enforce-{name}")
            rows = doc["maps"][c["mi"]]["rows"]
            sc = scores_map(rows, doc["maps"][c["mi"]]["scores"])
            hexes = load_hexes(rows)
            min_mask = c.get("minScore", PANGEA_MIN)
            ret = enforce_target_dry_land_fraction(hexes, sc, c["target"], c["W"], c["H"], None,
                                                   c["tol"], c["bias"], min_mask)
            if ret != c["out"]["ret"] or not check_state(rows, hexes, c["out"]["diff"]):
                mismatches.append((f"enforce-{name}", c["id"], ret, c["out"]["ret"]))

    report.update({
        "przypadki": counts,
        "rozbieznosci": len(mismatches),
        "przyklady": mismatches[:10],
    })
    print(json.dumps(report, ensure_ascii=False, indent=1))
    return 0 if not mismatches else 1


if __name__ == "__main__":
    sys.exit(main())
