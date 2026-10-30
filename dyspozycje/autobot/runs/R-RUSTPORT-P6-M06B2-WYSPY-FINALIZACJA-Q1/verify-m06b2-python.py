#!/usr/bin/env python3
"""Niezalezny weryfikator P6.M06B2 (Python, od zera z TS pinu edb8fb56; NIE korzysta z kodu Rust).

Zakres (uczciwie, patrz dossier P6-M06B2 §7): `minTinyIslandHexesForTyp` (:4992), `removeTinyLandIslands`
(:4946), `countOpenOceanLandSpecks` (:5006), `purgeOpenOceanLandSpecks` (:5027). Symbole
`finalizeLandMassAfterCoast` (:5050) i `enforceTargetDryLandFraction` (:5079) NIE sa tu odtwarzane:
zalezą od lancucha helperow (applyLandFractionByScore, finalizeCoastAndInlandWater), ktorego niezalezna
reimplementacja jest poza zakresem tej partii; ich wektory weryfikuje test Rust wzgledem weba.

Uzycie: python3 -I verify-m06b2-python.py <KATALOG_WEB_TS (gra/src/map/gen-helpers.ts)> <KATALOG_WEKTOROW>
Wyjscie: liczby przypadkow i rozbieznosci (0 = zgodnosc z wektorem z weba).
"""
import json
import os
import re
import sys

WEB_TS, VEC = sys.argv[1], sys.argv[2]
WATER = {"morze", "plytkie_morze"}
DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]


def hkey(q, r):
    return f"{q},{r}"


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


def is_water(t):
    return t in WATER


def qr(k):
    a, b = k.split(",")
    return int(a), int(b)


def set_hex_to_morze(h):
    # TS setHexToMorze (gen-helpers.ts:3325): terenBazowy=Morze, nakladka=Brak, rzeka wylaczona, zloze usuniete.
    h["t"] = "morze"
    h["n"] = "brak"
    h["ro"] = False
    h["ed"] = []
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


def ts_min_tiny_values(path):
    """Wartosci `minTinyIslandHexesForTyp` czytane wprost z TS (:4992-4998), bez JSON z repo."""
    text = open(path, encoding="utf-8").read()
    m = re.search(r"export function minTinyIslandHexesForTyp\(typ: TypSwiata\): number \{(.*?)\n\}", text, re.S)
    if not m:
        raise SystemExit("nie znaleziono minTinyIslandHexesForTyp w TS")
    body = m.group(1)
    vals = dict((a, int(b)) for a, b in re.findall(r"case '([a-z]+)': return (\d+);", body))
    return vals


def main():
    tv = ts_min_tiny_values(WEB_TS)
    report = {"progi_ts": tv}
    tiny = json.load(open(os.path.join(VEC, "web-tiny.json"), encoding="utf-8"))
    specks = json.load(open(os.path.join(VEC, "web-specks.json"), encoding="utf-8"))

    mismatches = []
    n_min = 0
    for c in tiny["cases"]["minTyp"]:
        n_min += 1
        if tv.get(c["typ"]) is None or int(c["out"]) != tv[c["typ"]]:
            mismatches.append(("minTyp", c["typ"], c["out"], tv.get(c["typ"])))

    n_tiny = 0
    for c in tiny["cases"]["tiny"]:
        n_tiny += 1
        rows = tiny["maps"][c["mi"]]["rows"]
        hexes = load_hexes(rows)
        ret = remove_tiny(hexes, c["min"])
        exp_ret = c["out"]["ret"]
        exp_state = expected_from(rows, c["out"]["diff"])
        if ret != exp_ret or dump(hexes) != exp_state:
            mismatches.append(("removeTiny", c["id"], ret, exp_ret))

    n_cnt = 0
    n_purge = 0
    for c in specks["cases"]["specks"]:
        n_cnt += 1
        rows = specks["maps"][c["mi"]]["rows"]
        got = count_specks(load_hexes(rows))
        if got != int(c["out"]):
            mismatches.append(("countSpecks", c["id"], got, c["out"]))

    for c in specks["cases"]["purge"]:
        n_purge += 1
        rows = specks["maps"][c["mi"]]["rows"]
        hexes = load_hexes(rows)
        ret = purge_specks(hexes)
        exp_state = expected_from(rows, c["out"]["diff"])
        if ret != c["out"]["ret"] or dump(hexes) != exp_state:
            mismatches.append(("purgeSpecks", c["id"], ret, c["out"]["ret"]))
        if count_specks(hexes) != 0:
            mismatches.append(("purgeSpecks-po", c["id"], count_specks(hexes), 0))

    report.update({
        "minTyp": n_min,
        "removeTiny": n_tiny,
        "countSpecks": n_cnt,
        "purgeSpecks": n_purge,
        "rozbieznosci": len(mismatches),
        "przyklady": mismatches[:10],
    })
    print(json.dumps(report, ensure_ascii=False, indent=1))
    return 0 if not mismatches else 1


if __name__ == "__main__":
    sys.exit(main())
