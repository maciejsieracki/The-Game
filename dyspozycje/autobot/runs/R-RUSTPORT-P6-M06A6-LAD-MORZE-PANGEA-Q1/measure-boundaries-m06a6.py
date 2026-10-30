#!/usr/bin/env python3
"""Pomiar trafien wektorow P6.M06A6 na progach decyzyjnych (N-1 / N / N+1).

Liczy, ile przypadkow/elementow wektorow z uruchomionego weba trafia dokladnie w prog
kazdego porownania sterujacego. Geometria i progi odtwarzane z danych wejsciowych wektora
(klucze, terreny, wyniki), wyłącznie do ZLICZANIA trafien; wynik funkcji nie jest tu
liczony (to robi test Rust vs web).

Uzycie: python3 <run>/measure-boundaries-m06a6.py <katalog z wektorami>
"""
import json
import math
import sys

vec_dir = sys.argv[1]
WATER = {"Morze", "PlytkieMorze"}
EPS = 1e-12


def key(k):
    q, r = k.split(",")
    return int(q), int(r)


def load(name, sect):
    return json.load(open(f"{vec_dir}/{name}"))["cases"][sect]


def num(v):
    return float("nan") if v == "NaN" else float(v)


def dry(hexes):
    return [k for k, t in hexes.items() if t not in WATER]


out = {}

# ---------- erode ----------
hits = {"bbox_stop_equal": 0, "rim_qmin_off": {1: 0, 2: 0, 3: 0}, "rim_qmax_off": {1: 0, 2: 0, 3: 0},
        "rim_rmin_off": {1: 0, 2: 0, 3: 0}, "rim_rmax_off": {1: 0, 2: 0, 3: 0},
        "tol_tie_pairs": 0, "eroded_eq_max": 0, "cases": 0}
for c in load("erode-vectors.json", "erode"):
    hits["cases"] += 1
    hexes = dict(c["map"])
    scores = {k: num(v) for k, v in c["scores"]}
    target = num(c["target"])
    mx = int(c["max"])
    lk = dry(hexes)
    if not lk:
        continue
    qs = [key(k)[0] for k in lk]
    rs = [key(k)[1] for k in lk]
    qmin, qmax, rmin, rmax = min(qs), max(qs), min(rs), max(rs)
    area = max(1, (qmax - qmin + 1) * (rmax - rmin + 1))
    if abs(len(lk) / area - target) < EPS:
        hits["bbox_stop_equal"] += 1
    for k in lk:
        q, r = key(k)
        for name, val, base in (("rim_qmin_off", q, qmin), ("rim_rmin_off", r, rmin)):
            d = val - base
            if d in (1, 2, 3):
                hits[name][d] += 1
        for name, val, base in (("rim_qmax_off", q, qmax), ("rim_rmax_off", r, rmax)):
            d = base - val
            if d in (1, 2, 3):
                hits[name][d] += 1
    # pary w tolerancji sortowania (|sa-sb| == 0.02 na granicy)
    rim = [k for k in lk if (lambda q, r: q <= qmin + 2 or q >= qmax - 2 or r <= rmin + 2 or r >= rmax - 2)(*key(k))]
    for i in range(len(rim)):
        for j in range(i + 1, len(rim)):
            if abs(abs(scores.get(rim[i], 0.0) - scores.get(rim[j], 0.0)) - 0.02) < EPS:
                hits["tol_tie_pairs"] += 1
    if c["expect"]["eroded"] == mx:
        hits["eroded_eq_max"] += 1
out["erode"] = hits

# ---------- carve ----------
ch = {"cases": 0, "minland_79_80_81": {79: 0, 80: 0, 81: 0}, "aspect_eq_maxaspect": 0,
      "across_eq_depth_off": {-1: 0, 0: 0, 1: 0}, "nearmid_eq": 0, "dist_eq_depth": 0,
      "carved_eq_max": 0, "carved_gt0_cases": 0}
for c in load("carve-vectors.json", "carve"):
    ch["cases"] += 1
    hexes = dict(c["map"])
    scores = {k: num(v) for k, v in c["scores"]}
    max_aspect = num(c["maxAspect"])
    max_carve = int(c["maxCarve"])
    lk = dry(hexes)
    n = len(lk)
    if n in ch["minland_79_80_81"]:
        ch["minland_79_80_81"][n] += 1
    if n < 80 or not lk:
        continue
    qs = [key(k)[0] for k in lk]
    rs = [key(k)[1] for k in lk]
    qmin, qmax, rmin, rmax = min(qs), max(qs), min(rs), max(rs)
    span_q, span_r = qmax - qmin + 1, rmax - rmin + 1
    aspect = max(span_q, span_r) / max(1, min(span_q, span_r))
    if abs(aspect - max_aspect) < EPS:
        ch["aspect_eq_maxaspect"] += 1
    if aspect <= max_aspect:
        continue
    long_is_q = span_q >= span_r
    mid = (qmin + qmax) / 2 if long_is_q else (rmin + rmax) / 2
    smin, smax = (rmin, rmax) if long_is_q else (qmin, qmax)
    short_span = smax - smin + 1
    depth = max(3, math.floor(short_span * 0.28))
    long_span = max(span_q, span_r)
    cands = []
    for k in lk:
        q, r = key(k)
        along, across = (q, r) if long_is_q else (r, q)
        on_long = across <= smin + depth or across >= smax - depth
        d_near = abs(along - mid)
        if abs(d_near - long_span * 0.42) < EPS:
            ch["nearmid_eq"] += 1
        for off in (-1, 0, 1):
            if across - smin == depth + off:
                ch["across_eq_depth_off"][off] += 1
        if on_long and d_near < long_span * 0.42:
            cands.append((scores.get(k, 0.0), across))
    cands.sort(key=lambda x: x[0])
    carved = 0
    for _, across in cands:
        if carved >= max_carve:
            break
        dist = min(across - smin, smax - across)
        if dist == depth:
            ch["dist_eq_depth"] += 1
        if dist > depth:
            continue
        carved += 1
    if carved == max_carve:
        ch["carved_eq_max"] += 1
    if carved == c["expect"]["carved"] and carved > 0:
        ch["carved_gt0_cases"] += 1
out["carve"] = ch

# ---------- continent fraction ----------
cf = {"cases": 0, "target_eq_clamp_bound": 0, "quota_round_half_tie": 0, "land_eq_quota": 0}
for c in load("contfrac-vectors.json", "contfrac"):
    cf["cases"] += 1
    t = num(c["target"])
    if t in (0.15, 0.85):
        cf["target_eq_clamp_bound"] += 1
    hexes = dict(c["map"])
    total = len(hexes)
    clamped = max(0.15, min(0.85, t)) if not math.isnan(t) else float("nan")
    if math.isnan(clamped):
        continue
    target_land = total * clamped
    if abs((target_land - math.floor(target_land)) - 0.5) < EPS:
        cf["quota_round_half_tie"] += 1
out["contfrac"] = cf

print(json.dumps(out, indent=2, ensure_ascii=False))
