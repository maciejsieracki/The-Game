#!/usr/bin/env python3
"""Runner mutacji P6.M06B2 (R-RUSTPORT-P6-M06B2-WYSPY-FINALIZACJA-Q1).

Kazda mutacja = dokladnie jedno wystapienie tekstu `old` w pliku `landsea.rs` (inaczej blad),
zamiana na `new`, `cargo test --offline --test <binarki>`, przywrocenie pliku (sha256 przed = po).
Uzycie: python3 mut-runner-m06b2.py <KATALOG_ENGINE> <WYJSCIE.json> [ID,ID,...]
"""
import hashlib
import json
import os
import subprocess
import sys
import time

ENGINE = sys.argv[1]
OUT = sys.argv[2]
ONLY = set(sys.argv[3].split(",")) if len(sys.argv) > 3 and sys.argv[3] else None
SRC = os.path.join(ENGINE, "src", "domain", "mapgen", "landsea.rs")

TINY = ["p6_m06b2_tiny"]
FIN = ["p6_m06b2_finalize"]
SPK = ["p6_m06b2_specks"]
ENF = ["p6_m06b2_enforce"]

MUTS = [
    {
        "id": "M01", "sym": "removeTinyLandIslands", "web": "gen-helpers.ts:4946",
        "desc": "prog wielkosci: > zamiast >= (granica N)",
        "old": "        if comp.len() >= min_hexes {\n            continue;\n        }",
        "new": "        if comp.len() > min_hexes {\n            continue;\n        }",
        "tests": TINY,
    },
    {
        "id": "M02", "sym": "removeTinyLandIslands", "web": "gen-helpers.ts:4946",
        "desc": "sasiad Plytkie Morze traktowany jako lad (lacza skladowe)",
        "old": "                let Some(nh) = hexes.get(&nk) else { continue };\n                if is_water_terrain_local(nh.terrain) {",
        "new": "                let Some(nh) = hexes.get(&nk) else { continue };\n                if nh.terrain == Terrain::Sea {",
        "tests": TINY,
    },
    {
        "id": "M03", "sym": "minTinyIslandHexesForTyp", "web": "gen-helpers.ts:4996",
        "desc": "typ wyspy -> prog ziemi (6 zamiast 4)",
        "old": "        WorldType::Islands => t.wyspy.wartosc,",
        "new": "        WorldType::Islands => t.ziemia.wartosc,",
        "tests": TINY,
    },
    {
        "id": "M04", "sym": "countOpenOceanLandSpecks", "web": "gen-helpers.ts:5006",
        "desc": "warunek specka: <= 1 sasiad lądu zamiast == 0",
        "old": ".filter(|(_, h)| dry_land_neighbor_count(hexes, h.q, h.r) == 0)",
        "new": ".filter(|(_, h)| dry_land_neighbor_count(hexes, h.q, h.r) <= 1)",
        "tests": SPK,
    },
    {
        "id": "M05", "sym": "purgeOpenOceanLandSpecks", "web": "gen-helpers.ts:5027",
        "desc": "purge: prog sasiadow > 1 zamiast > 0 (usuwa tez lad z 1 sasiadem)",
        "old": "        if dry_land_neighbor_count(hexes, q, r) > 0 {\n            continue;\n        }\n        if let Some(hx) = hexes.get_mut(key) {",
        "new": "        if dry_land_neighbor_count(hexes, q, r) > 1 {\n            continue;\n        }\n        if let Some(hx) = hexes.get_mut(key) {",
        "tests": SPK + FIN,
    },
    {
        "id": "M06", "sym": "finalizeLandMassAfterCoast", "web": "gen-helpers.ts:5060-5062",
        "desc": "usuniety warunek przerwania petli (purged === 0 && pass > 0) - oczekiwany ROWNOWAZNY",
        "old": "        if purged == 0 && pass > 0 {\n            break;\n        }\n",
        "new": "",
        "tests": FIN,
    },
    {
        "id": "M07", "sym": "finalizeLandMassAfterCoast", "web": "gen-helpers.ts:5063",
        "desc": "suma zwrotu pomija purge (total += purged usuniete)",
        "old": "        total += purged;\n        if purged == 0 && pass > 0 {",
        "new": "        if purged == 0 && pass > 0 {",
        "tests": FIN,
    },
    {
        "id": "M08", "sym": "finalizeLandMassAfterCoast", "web": "gen-helpers.ts:5066-5067",
        "desc": "usuniete enforceMapBorderOcean po finalizacji wybrzeza",
        "old": "    finalize_coast_and_inland_water(hexes, width, height, coast_passes, max_inland_pool_size);\n    enforce_map_border_ocean(hexes, width, height, None);",
        "new": "    finalize_coast_and_inland_water(hexes, width, height, coast_passes, max_inland_pool_size);",
        "tests": FIN,
    },
    {
        "id": "M09", "sym": "enforceTargetDryLandFraction", "web": "gen-helpers.ts:5101",
        "desc": "pierwsza granica tolerancji: >= zamiast >",
        "old": "    if (land - target_land).abs() > tolerance_hexes {\n        adjusted += apply_land_fraction_by_score(",
        "new": "    if (land - target_land).abs() >= tolerance_hexes {\n        adjusted += apply_land_fraction_by_score(",
        "tests": ENF,
    },
    {
        "id": "M10", "sym": "enforceTargetDryLandFraction", "web": "gen-helpers.ts:5104",
        "desc": "usuniety applyCoastRing w galezi tolerancji",
        "old": "        apply_coast_ring(hexes);\n",
        "new": "",
        "tests": ENF,
    },
    {
        "id": "M11", "sym": "enforceTargetDryLandFraction", "web": "gen-helpers.ts:5088-5090",
        "desc": "gorny klamp celu 0.85 -> 0.86",
        "old": "        js_min(susza.klamp_max.wartosc, target_land_fraction),",
        "new": "        js_min(susza.klamp_max.wartosc + 0.01, target_land_fraction),",
        "tests": ENF,
    },
    {
        "id": "M12", "sym": "enforceTargetDryLandFraction", "web": "gen-helpers.ts:5094",
        "desc": "wybrzeze w enforce: 2 przebiegi zamiast 1",
        "old": "    finalize_coast_and_inland_water(hexes, width, height, 1, max_inland_pool_size);",
        "new": "    finalize_coast_and_inland_water(hexes, width, height, 2, max_inland_pool_size);",
        "tests": ENF,
    },
    {
        "id": "M13", "sym": "enforceTargetDryLandFraction", "web": "gen-helpers.ts:5084",
        "desc": "tolerancja w heksach +1",
        "old": "js_round(total * tolerance_pct_points / 100.0));",
        "new": "js_round(total * tolerance_pct_points / 100.0) + 1.0);",
        "tests": ENF,
    },
]


def sha(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def run_cargo(tests):
    cmd = ["cargo", "test", "--offline"]
    for t in tests:
        cmd += ["--test", t]
    env = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_PROFILE_DEV_DEBUG="0", CARGO_PROFILE_TEST_DEBUG="0")
    p = subprocess.run(cmd, cwd=ENGINE, env=env, capture_output=True, text=True, timeout=540)
    text = p.stdout + p.stderr
    failed = [line.strip() for line in text.splitlines() if line.strip().startswith("test ") and line.strip().endswith("FAILED")]
    return p.returncode, failed


def main():
    results = {}
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as fh:
            results = json.load(fh)
    original = open(SRC, "rb").read()
    sha_before = sha(SRC)
    for m in MUTS:
        if ONLY is not None and m["id"] not in ONLY:
            continue
        text = original.decode("utf-8")
        occurrences = text.count(m["old"])
        entry = {"sym": m["sym"], "web": m["web"], "desc": m["desc"], "occurrences": occurrences}
        if occurrences != 1:
            entry["wynik"] = "BLAD_DOPASOWANIA"
            results[m["id"]] = entry
            continue
        mutated = text.replace(m["old"], m["new"], 1)
        t0 = time.time()
        try:
            with open(SRC, "w", encoding="utf-8", newline="") as fh:
                fh.write(mutated)
            rc, failed = run_cargo(m["tests"])
        finally:
            with open(SRC, "wb") as fh:
                fh.write(original)
        entry["sek"] = round(time.time() - t0, 1)
        entry["exit"] = rc
        entry["failed_tests"] = failed[:12]
        entry["wynik"] = "ZABITA" if rc != 0 else "PRZEZYTA"
        results[m["id"]] = entry
        with open(OUT, "w", encoding="utf-8") as fh:
            json.dump(results, fh, ensure_ascii=False, indent=1)
    sha_after = sha(SRC)
    results["_przywrocenie"] = {"sha_przed": sha_before, "sha_po": sha_after, "zgodne": sha_before == sha_after}
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(results, fh, ensure_ascii=False, indent=1)
    print(json.dumps({k: v.get("wynik") for k, v in results.items()}, ensure_ascii=False))


if __name__ == "__main__":
    main()
