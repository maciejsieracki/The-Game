#!/usr/bin/env python3
"""Niezalezny weryfikator P6.M06A8 (Operator-pomiary r1).

Nie uzywa kodu Rust ani wektorow jako zrodla algorytmu. Implementuje na nowo
`groupDryLandMassKeys` (gen-helpers.ts :4338) i `ensurePangeaSingleContinent`
(:4375) wedlug zrodla TS pina edb8fb56 (fill :4595 = 0, jak w instrumentowanej
kopii). Stale HEX_DIRECTIONS i predykaty wody/lądu sa czytane z zrodla TS
(regex), nie wpisane z Rust.

Uzycie:
  python3 -I verify-m06a8-independent.py <WEB_gen-helpers.ts> <ensure-vectors.json> <raport.json>

Wyjscie: podsumowanie na stdout + raport JSON (liczby trafien granic).
"""
import json
import math
import re
import sys
from collections import Counter

WEB_TS, VEC_PATH, OUT_PATH = sys.argv[1], sys.argv[2], sys.argv[3]
src = open(WEB_TS, encoding="utf-8").read()

# --- stale z zrodla TS -------------------------------------------------------
m = re.search(r"export const HEX_DIRECTIONS[^=]*=\s*\[(.*?)\]\s*as const", src, re.S)
DIRS = [(int(a), int(b)) for a, b in re.findall(r"\[\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*\]", m.group(1))]
assert len(DIRS) == 6, DIRS
m = re.search(r"function isWaterTerrainLocal\(tb: TerenBazowy\): boolean \{\s*return (.*?);\s*\}", src, re.S)
WATER_EXPR = m.group(1)
WATER = set(re.findall(r"TerenBazowy\.(\w+)", WATER_EXPR))
WATER = {{"Morze": "Morze", "PlytkieMorze": "PlytkieMorze"}[w] for w in WATER}
assert WATER == {"Morze", "PlytkieMorze"}, WATER
# Nazwy TerenBazowy w wektorach = nazwy Rust; mapowanie web Morze->'Morze', PlytkieMorze->'PlytkieMorze'.


def js_round(x):
    return math.floor(x + 0.5)


def parse_key(k):
    """parseHexKey: Number(parts[0]), Number(parts[1]); NaN -> None (brak sasiadow)."""
    parts = k.split(",")
    if len(parts) < 2:
        return None
    a, b = parts[0], parts[1]
    if not (re.fullmatch(r"-?\d+", a) and re.fullmatch(r"-?\d+", b)):
        return None
    return int(a), int(b)


def hkey(q, r):
    return f"{q},{r}"


def is_water(t):
    return t in WATER


def is_dry(t):
    return not is_water(t)


def group_dry(hexes):
    visited = set()
    groups = []
    for key in hexes:  # Object.keys = kolejnosc wstawiania
        h = hexes[key]
        if h is None or not is_dry(h):
            continue
        if key in visited:
            continue
        mass = []
        stack = [key]
        visited.add(key)
        while stack:
            k = stack.pop()
            mass.append(k)
            qr = parse_key(k)
            if qr is None:
                continue
            q, r = qr
            for dq, dr in DIRS:
                nk = hkey(q + dq, r + dr)
                if nk in visited:
                    continue
                nh = hexes.get(nk)
                if nh is None or not is_dry(nh):
                    continue
                visited.add(nk)
                stack.append(nk)
        groups.append(mass)
    return groups


def ensure(hexes, w, h, cov):
    map_scale = math.sqrt((w * h) / 20160)
    max_bridge = max(18, min(48, js_round(16 + map_scale * 6)))
    cov["max_bridge"] = max_bridge
    converted = 0
    iters = 0
    for _ in range(12):
        iters += 1
        masses = sorted(group_dry(hexes), key=lambda m_: -len(m_))  # stabilne, jak V8
        if len(masses) <= 1:
            break
        main = masses[0]
        main_set = set(main)
        dist, parent, queue = {}, {}, []
        for k in main:
            qr = parse_key(k)
            if qr is None:
                continue
            q, r = qr
            for dq, dr in DIRS:
                nk = hkey(q + dq, r + dr)
                nh = hexes.get(nk)
                if nh is None or not is_water(nh) or nk in dist:
                    continue
                dist[nk] = 1
                parent[nk] = k
                queue.append(nk)
        hit = None
        qi = 0
        while qi < len(queue):
            cur = queue[qi]
            qi += 1
            d = dist[cur]
            if d > max_bridge:
                cov["bfs_skipped_d_gt_N"] += 1
                if d == max_bridge + 1:
                    cov["bfs_skipped_d_eq_N_plus_1"] += 1
                continue
            cov["bfs_expanded"] += 1
            if d == max_bridge:
                cov["bfs_expanded_d_eq_N"] += 1
            q, r = parse_key(cur)
            found = False
            for dq, dr in DIRS:
                nk = hkey(q + dq, r + dr)
                nh = hexes.get(nk)
                if nh is None:
                    continue
                if is_dry(nh):
                    if nk not in main_set:
                        hit = cur
                        cov["hit_at_d"][d] += 1
                        found = True
                        break
                    continue
                if not is_water(nh) or nk in dist:
                    continue
                dist[nk] = d + 1
                parent[nk] = cur
                queue.append(nk)
            if found:
                break
        if hit is None:
            cov["no_hit_iter"] += 1
            limit = max(60, math.floor(len(main) * 0.25))
            cov["limit_last"] = limit
            for other in masses[1:]:
                n = len(other)
                cov["foreign_size_vs_limit"][str(n - limit)] += 1
                if n > limit:
                    continue
                for k in other:
                    hh = hexes.get(k)
                    if hh is not None and is_dry(hh):
                        hexes[k] = "Morze"
                        converted += 1
            break
        cur = hit
        path_len = 0
        capped = False
        while cur is not None and path_len <= max_bridge + 2:
            if cur not in hexes:
                break
            if is_water(hexes[cur]):
                hexes[cur] = "Laka"
                converted += 1
            if cur in main_set:
                break
            cur = parent.get(cur)
            path_len += 1
        else:
            if cur is not None and cur not in main_set:
                capped = True
        if capped:
            cov["path_capped"] += 1
    cov["iters"][str(iters)] += 1
    return converted  # fill :4595 = 0


def main():
    doc = json.load(open(VEC_PATH, encoding="utf-8"))
    cases = doc["cases"]
    fam_fail = Counter()
    fam_n = Counter()
    mism = []
    cover_by_family = {}
    for c in cases:
        fam = c["family"]
        fam_n[fam] += 1
        order = c["order"]
        hexes = {k: t for k, t in order}
        assert len(hexes) == len(order), c["id"]
        # group
        got_g = group_dry(dict(hexes))
        if got_g != c["group"]:
            fam_fail[fam + ":group"] += 1
            if len(mism) < 10:
                mism.append((c["id"], "group"))
        # ensure
        cov = {
            "bfs_expanded": 0, "bfs_expanded_d_eq_N": 0, "bfs_skipped_d_gt_N": 0,
            "bfs_skipped_d_eq_N_plus_1": 0, "hit_at_d": Counter(), "no_hit_iter": 0,
            "limit_last": None, "foreign_size_vs_limit": Counter(), "path_capped": 0,
            "iters": Counter(), "max_bridge": None,
        }
        hx = dict(hexes)
        conv = ensure(hx, c["w"], c["h"], cov)
        after = [[k, hx[k]] for k in hexes]
        if conv != c["converted"]:
            fam_fail[fam + ":converted"] += 1
            if len(mism) < 10:
                mism.append((c["id"], "converted", conv, c["converted"]))
        if after != c["after"]:
            fam_fail[fam + ":after"] += 1
            if len(mism) < 10:
                mism.append((c["id"], "after"))
        fc = cover_by_family.setdefault(fam, Counter())
        fc["cases"] += 1
        if cov["bfs_expanded_d_eq_N"]:
            fc["cases_bfs_expands_d_eq_N"] += 1
        if cov["bfs_skipped_d_eq_N_plus_1"]:
            fc["cases_bfs_skips_d_eq_N_plus_1"] += 1
        for d, v in cov["hit_at_d"].items():
            fc[f"hit_at_d_offset_{d - cov['max_bridge']:+d}"] += 1
        if cov["no_hit_iter"]:
            fc["cases_no_hit_limit_branch"] += 1
        for off, v in cov["foreign_size_vs_limit"].items():
            fc[f"foreign_size_minus_limit_{int(off):+d}"] += v
        if cov["path_capped"]:
            fc["cases_path_capped"] += 1
        if any(int(k) >= 12 for k in cov["iters"]):
            fc["cases_hit_iter_cap"] += 1
    total_fail = sum(fam_fail.values())
    summary = {
        "cases": len(cases),
        "mismatch_total": total_fail,
        "mismatch_by_kind": dict(fam_fail),
        "cases_by_family": dict(fam_n),
        "first_mismatches": mism,
        "coverage_by_family": {f: dict(sorted(v.items())) for f, v in cover_by_family.items()},
    }
    json.dump(summary, open(OUT_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=1, sort_keys=True)
    print(f"cases={len(cases)} mismatch_total={total_fail}")
    print(json.dumps(summary["coverage_by_family"], ensure_ascii=False, indent=1, sort_keys=True))
    return 0 if total_fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
