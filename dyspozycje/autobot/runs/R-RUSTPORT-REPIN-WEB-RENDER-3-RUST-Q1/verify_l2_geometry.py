#!/usr/bin/env python3
"""R-RUSTPORT-REPIN-WEB-RENDER-3-RUST-Q1 — independent L2 verifier (no Rust, no web code).

Claim checked: the indexed merged decor (web 9b019a7d8 / Rust index_identical_vertices) is
GEOMETRICALLY IDENTICAL to the old non-indexed soup (web edb8fb56 fixture):
  expand(new.position, new.index) == old.position   (bit for bit, as f32)
  expand(new.color,    new.index) == old.color
and the index is canonical: unique vertices pairwise bit-distinct, in first-occurrence order,
element type Uint16Array iff unique <= 65535.

usage: verify_l2_geometry.py <old mergedecor.json> <new mergedecor.json>
"""
import json
import struct
import sys


def bits(v):
    if isinstance(v, str):
        v = {"NaN": float("nan"), "-0": -0.0, "Infinity": float("inf"), "-Infinity": float("-inf")}[v]
    return struct.unpack("<I", struct.pack("<f", v))[0]


def main(old_p, new_p):
    old = {c["name"]: c for c in json.load(open(old_p))["cases"]}
    new = json.load(open(new_p))["cases"]
    errs, checked = [], 0
    for c in new:
        name = c["name"]
        m = c["after"].get("merged")
        mo = old[name]["after"].get("merged")
        if (m is None) != (mo is None):
            errs.append(f"{name}: merged presence differs")
            continue
        if m is None:
            continue
        P = [bits(x) for x in m["position"]]
        C = [bits(x) for x in m["color"]]
        OP = [bits(x) for x in mo["position"]]
        OC = [bits(x) for x in mo["color"]]
        idx = m["index"]
        if idx is None:
            ep, ec = P, C
        else:
            ep = [P[3 * i + k] for i in idx for k in range(3)]
            ec = [C[3 * i + k] for i in idx for k in range(3)]
        if ep != OP:
            errs.append(f"{name}: expanded positions != old soup")
        if ec != OC:
            errs.append(f"{name}: expanded colours != old soup")
        n_unique = len(P) // 3
        keys = [tuple(P[3 * u:3 * u + 3] + C[3 * u:3 * u + 3]) for u in range(n_unique)]
        if len(set(keys)) != n_unique:
            errs.append(f"{name}: unique vertices are not pairwise distinct")
        if idx is not None:
            seen = -1
            for i in idx:
                if i > seen + 1:
                    errs.append(f"{name}: index not in first-occurrence order")
                    break
                seen = max(seen, i)
            want_t = "Uint16Array" if n_unique <= 65535 else "Uint32Array"
            if m["indexType"] != want_t:
                errs.append(f"{name}: indexType {m['indexType']} != {want_t}")
            print(f"{name}: soup {len(idx)} -> unique {n_unique} vertices, "
                  f"vertex bytes {len(idx) * 24} -> {n_unique * 24} (+ index {len(idx) * 2} B)")
        checked += 1
    for e in errs:
        print("FAIL", e)
    print(f"verify_l2_geometry: {'FAIL' if errs else 'OK'} ({checked} merged cases)")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1], sys.argv[2]))
