#!/usr/bin/env python3
"""Niezalezny weryfikator (od zera, bez Rusta) dla rivers_b/turn.rs - P6.M07B partia 1.

Logika odtworzona z TS gra/src/map/gen-helpers.ts @ edb8fb56:
  HEX_DIRECTIONS (125-129), riverHexDirDelta (5975), neighborDirIndex (6988),
  signedRiverDirDelta / pathSegmentDirs / pathSignedTurnDeltas (7003-7025),
  riverSegmentUnitVector (7051), riverPathHasSharpUTurn (7064), riverPathViolatesTurnWindow (7075).
Sprawdza wszystkie wektory z web-rivers-b-turn.json (kazdy przypadek) i zgodnosc statystyk.
Format v2: sciezka = plaski, parzysty ciag [q0,r0,q1,r1,...] w polu "p".
Uruchom: python3 -I verify_m07b_turn.py <sciezka do web-rivers-b-turn.json>
"""
import json
import math
import sys

HEX_DIRECTIONS = [(+1, 0), (+1, -1), (0, -1), (-1, 0), (-1, +1), (0, +1)]
DEFAULT_WINDOW = 6
DEFAULT_MAX_SUM = 1


def hex_dir_delta(last_dir, new_dir):
    return ((new_dir - last_dir) % 6 + 6) % 6


def neighbor_dir_index(q, r, nq, nr):
    dq, dr = nq - q, nr - r
    for i, (hq, hr) in enumerate(HEX_DIRECTIONS):
        if hq == dq and hr == dr:
            return i
    return -1


def signed_dir_delta(last_dir, new_dir):
    raw = hex_dir_delta(last_dir, new_dir)
    return raw if raw <= 3 else raw - 6


def segment_dirs(path):
    out = []
    for i in range(len(path) - 1):
        d = neighbor_dir_index(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1])
        if d >= 0:
            out.append(d)
    return out


def signed_turn_deltas(dirs):
    return [signed_dir_delta(dirs[i - 1], dirs[i]) for i in range(1, len(dirs))]


def unit_vector(a, b):
    def xy(c):
        return (math.sqrt(3) * (c[0] + c[1] / 2), 1.5 * c[1])
    x1, y1 = xy(a)
    x2, y2 = xy(b)
    dx, dy = x2 - x1, y2 - y1
    ln = math.hypot(dx, dy)
    if ln < 1e-9:
        return (0.0, 0.0)
    return (dx / ln, dy / ln)


def has_sharp_u_turn(path):
    if len(path) < 3:
        return False
    for i in range(len(path) - 2):
        v1 = unit_vector(path[i], path[i + 1])
        v2 = unit_vector(path[i + 1], path[i + 2])
        if v1[0] * v2[0] + v1[1] * v2[1] < -0.01:
            return True
    return False


def violates_turn_window(path, window=DEFAULT_WINDOW, max_sum=DEFAULT_MAX_SUM):
    if len(path) < 3:
        return False
    if has_sharp_u_turn(path):
        return True
    deltas = signed_turn_deltas(segment_dirs(path))
    for i in range(len(deltas)):
        if abs(deltas[i]) > 1:
            return True
        if i + 1 < window:
            continue
        if abs(sum(deltas[i + 1 - window:i + 1])) > max_sum:
            return True
    return False


def main():
    doc = json.load(open(sys.argv[1], encoding="utf-8"))
    counts = {"unit": 0, "uturn": 0, "viol": 0}
    true_counts = {"uturn": 0, "viol": 0}
    fails = []
    max_unit_err = 0.0
    for v in doc["vectors"]:
        kind = v["fn"]
        counts[kind] += 1
        if kind == "unit":
            ex = unit_vector(v["a"], v["b"])
            got = (v["x"], v["y"])
            err = max(abs(ex[0] - got[0]), abs(ex[1] - got[1]))
            max_unit_err = max(max_unit_err, err)
            if err > 1e-12:
                fails.append(("unit", v))
            continue
        flat = v["p"]
        path = [(flat[i], flat[i + 1]) for i in range(0, len(flat), 2)]
        if kind == "uturn":
            res = has_sharp_u_turn(path)
        else:
            if "windowHex" in v:
                res = violates_turn_window(path, v["windowHex"], v["maxSum"])
            else:
                res = violates_turn_window(path)
        if res:
            true_counts[kind] += 1
        if res != v["out"]:
            fails.append((kind, v))
    st = doc["stats"]
    stats_ok = (
        counts["unit"] == st["unit"] and counts["uturn"] == st["uturn"]
        and counts["viol"] == st["viol"] and true_counts["uturn"] == st["uturnTrue"]
        and true_counts["viol"] == st["violTrue"]
    )
    print(json.dumps({"vectors": len(doc["vectors"]), "fails": len(fails),
                      "stats_ok": stats_ok, "max_unit_err": max_unit_err,
                      "uturnTrue": true_counts["uturn"], "violTrue": true_counts["viol"]}))
    return 0 if (not fails and stats_ok) else 1


if __name__ == "__main__":
    sys.exit(main())
