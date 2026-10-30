#!/usr/bin/env python3
"""Niezalezny weryfikator REPIN-WOJNA-2 R3 (uruchomienie: python3 -I verify-r3.py <REPO_ROOT>).

Reimplementacja OD ZERA z TS pinu dc8a3adc (bez kodu Rust):
  - planned-march.ts:426-490 (validateAutoMarchFromSave, plannedMarchesFromSave, plannedMarchesToSave)
  - battle-mode.ts:9-14, main.ts:29052-29060, main.ts:40819-40821
Porownuje z wektorami wygenerowanymi z URUCHOMIONEGO weba (pliki w tests/p6_repin_wojna_2_r3_vectors/).
Dodatkowo: nearest_living_general z NaN - symulacja V8 TimSort (n < 64) i wynik vs wektory weba.
"""
import json
import math
import sys
from pathlib import Path

root = Path(sys.argv[1]) / "rust-port/engine/tests/p6_repin_wojna_2_r3_vectors"


def finite(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)


def nonempty_str(x):
    return isinstance(x, str) and len(x) > 0


def validate_auto(saved, units, owner):
    if not isinstance(saved, dict) or not isinstance(saved.get("leaderId"), str):
        return None
    u = next((x for x in units if x["id"] == saved["leaderId"]), None)
    if u is None or u["ownerId"] != owner:
        return None
    if u["q"] == saved.get("destQ") and u["r"] == saved.get("destR"):
        return None
    if not finite(saved.get("destQ")) or not finite(saved.get("destR")):
        return None
    return saved


def from_save(saved, planned, units, owner):
    out = {}
    if isinstance(planned, list):
        for uid, dest in planned:
            if not isinstance(dest, dict) or not finite(dest.get("destQ")) or not finite(dest.get("destR")):
                continue
            u = next((x for x in units if x["id"] == uid), None)
            if u is None or u["ownerId"] != owner:
                continue
            has_gen = nonempty_str(dest.get("generalTargetId"))
            if u["q"] == dest["destQ"] and u["r"] == dest["destR"] and not has_gen:
                continue
            entry = {"destQ": dest["destQ"], "destR": dest["destR"]}
            if nonempty_str(dest.get("attackUnitId")):
                entry["attackUnitId"] = dest["attackUnitId"]
            if has_gen:
                entry["generalTargetId"] = dest["generalTargetId"]
            out[uid] = entry
    legacy = validate_auto(saved, units, owner)
    if legacy is not None and legacy["leaderId"] not in out:
        out[legacy["leaderId"]] = {"destQ": legacy["destQ"], "destR": legacy["destR"]}
    return out


def to_save(marches):
    if not marches:
        return {}
    planned = {}
    first = None
    for uid, dest in marches:
        entry = {"destQ": dest["destQ"], "destR": dest["destR"]}
        if nonempty_str(dest.get("attackUnitId")):
            entry["attackUnitId"] = dest["attackUnitId"]
        if nonempty_str(dest.get("generalTargetId")):
            entry["generalTargetId"] = dest["generalTargetId"]
        planned[uid] = entry
        if first is None:
            first = {"leaderId": uid, "destQ": dest["destQ"], "destR": dest["destR"]}
    return {"autoMarch": first, "plannedMarches": planned}


def is_auto_only(version, manual):
    return version == 1 and manual is False


def dist(aq, ar, bq, br):
    dq = aq - bq
    dr = ar - br
    return (abs(dq) + abs(dr) + abs(dq + dr)) / 2


def js_cmp(unit):
    # Komparator webu: (dist(a)-dist(b)) || a.id.localeCompare(b.id); NaN jest falsy.
    def cmp(a, b):
        d = dist(unit["q"], unit["r"], a["q"], a["r"]) - dist(unit["q"], unit["r"], b["q"], b["r"])
        if d and not math.isnan(d):
            return -1 if d < 0 else 1
        # ids ASCII w wektorach: localeCompare == porownanie kodow
        return (a["id"] > b["id"]) - (a["id"] < b["id"])
    return cmp


def v8_sort_n_lt_64(arr, cmp):
    # TimSort V8 dla n < 64: CountAndMakeRun + BinaryInsertionSort (bez scalania).
    a = list(arr)
    n = len(a)
    if n < 2:
        return a
    desc = cmp(a[1], a[0]) < 0
    run = 2
    prev = a[1]
    for idx in range(2, n):
        cur = a[idx]
        order = cmp(cur, prev)
        if (order >= 0) if desc else (order < 0):
            break
        prev = cur
        run += 1
    if desc:
        a[:run] = a[:run][::-1]
    for start in range(run, n):
        pivot = a[start]
        left, right = 0, start
        while left < right:
            mid = left + ((right - left) >> 1)
            if cmp(pivot, a[mid]) < 0:
                right = mid
            else:
                left = mid + 1
        a[left + 1:start + 1] = a[left:start]
        a[left] = pivot
    return a


def nearest(unit, roster):
    if unit.get("isGeneral") or unit.get("dead") or unit.get("removed") or unit.get("routed"):
        return None
    el = [c for c in roster if c["id"] != unit["id"] and c["ownerId"] == unit["ownerId"]
          and c.get("isGeneral") and not c.get("dead") and not c.get("removed") and not c.get("routed")
          and (c.get("hp") is None or c["hp"] > 0)]
    if not el:
        return None
    return v8_sort_n_lt_64(el, js_cmp(unit))[0]["id"]


def check_nearest():
    def f(x):
        return float(x) if isinstance(x, str) else x
    cases = json.loads((root / "nearest-nan.json").read_text())
    bad = 0
    with_nan = 0
    for c in cases:
        conv = lambda o: {**o, "q": f(o["q"]), "r": f(o["r"]), "ownerId": f(o["ownerId"])}
        unit = conv(c["unit"])
        roster = [conv(g) for g in c["roster"]]
        if any(math.isnan(g["q"]) or math.isnan(g["r"]) for g in roster):
            with_nan += 1
        if nearest(unit, roster) != c["out"]:
            bad += 1
    print(f"verify-r3 nearest: cases={len(cases)} withNaN={with_nan} mismatches={bad}")
    return bad


def main():
    fails = 0
    pm = json.loads((root / "planned-march-general.json").read_text())
    n_from = 0
    for case in pm["fromSave"]:
        got = from_save(case["saved"], case["planned"], case["units"], case["owner"])
        want = {uid: d for uid, d in case["out"]}
        if list(got.items()) != list(want.items()):
            fails += 1
            if fails < 5:
                print("FROM-SAVE MISMATCH", json.dumps(case)[:300], got, want)
        n_from += 1
    n_to = 0
    for case in pm["toSave"]:
        got = to_save([(uid, d) for uid, d in case["marches"]])
        if got != case["out"]:
            fails += 1
            if fails < 5:
                print("TO-SAVE MISMATCH", json.dumps(case)[:300], got, case["out"])
        n_to += 1

    bm = json.loads((root / "battle-mode-restore.json").read_text())
    # wektory: version/manual kodowane jako 'undef' | 'NaN' | liczba | napis (JS)
    def dec(x):
        if x == "undef":
            return "UNDEF"
        if x == "NaN":
            return float("nan")
        return x

    vers = [dec(x) for x in bm["versions"]]
    mans = [dec(x) for x in bm["manuals"]]
    n_bm = 0
    idx = 0
    for v in vers:
        for m in mans:
            for me in (True, False):
                row = bm["rows"][idx]
                idx += 1
                ver = v if (isinstance(v, (int, float)) and not isinstance(v, bool) and not (isinstance(v, float) and math.isnan(v)) and v == 1) else None
                restored = 1 if ver == 1 else None
                auto = me and is_auto_only(restored, m if m is not None and m != "UNDEF" else None)
                want = row["restoredThenAuto"] == 1
                if auto != want:
                    fails += 1
                    print("BM MISMATCH", row)
                raw = is_auto_only(1 if (isinstance(v, (int, float)) and not isinstance(v, bool) and not (isinstance(v, float) and math.isnan(v)) and v == 1) else None, m if m != "UNDEF" else None)
                if raw != (row["rawAuto"] == 1):
                    fails += 1
                    print("BM RAW MISMATCH", row)
                n_bm += 1
    fails += check_nearest()
    print(f"verify-r3: fromSave={n_from} toSave={n_to} battleMode={n_bm} fails={fails}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
