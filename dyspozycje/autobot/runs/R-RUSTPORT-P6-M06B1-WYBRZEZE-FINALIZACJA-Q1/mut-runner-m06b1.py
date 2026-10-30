#!/usr/bin/env python3
"""Mut-runner P6.M06B1 (Operator-pomiary r1).

Kazda mutacja: dokladnie jedno wystapienie `old` w pliku (inaczej blad, nie cicha zmiana),
zapis mutanta, `cargo test` na czterech binarkach M06B1 (--no-fail-fast), przywrocenie
oryginalnego bajtu pliku (sha256 sprawdzany przed i po). Wynik: killed (test padl) / survived (testy OK).
Uzycie: python3 -I mut-runner-m06b1.py <ENGINE_DIR> <RESULTS_JSON> [--check] [--from N] [--to M]
Srodowisko: CARGO_INCREMENTAL=0, CARGO_TARGET_DIR (ustawiane przez wywolujacego), CARGO_PROFILE_DEV_DEBUG=0.
"""
import hashlib
import json
import os
import re
import subprocess
import sys

LANDSEA = "src/domain/mapgen/landsea.rs"
COAST_JSON = "data/derived/mapgen-coast.json"
TESTS = [
    "p6_m06b1_coast",
    "p6_m06b1_ocean",
    "p6_m06b1_tables",
    "p6_m06b1_boundary",
    "p6_m06b1_cap",
]

# (id, plik, stary tekst, nowy tekst, opis) - stary tekst musi wystapic DOKLADNIE raz.
MUTS = [
    ("M01-ocean-max-zamiast-min", LANDSEA,
     "    js_max(\n        border + p.bufor_min_dodatek.wartosc,",
     "    js_min(\n        border + p.bufor_min_dodatek.wartosc,",
     "maxOceanBayDepth: zewnetrzne max -> min"),
    ("M02-ocean-floor-zamiast-ceil", LANDSEA,
     "let scaled = (scaled / p.dzielnik_skali.wartosc).floor();",
     "let scaled = (scaled / p.dzielnik_skali.wartosc).ceil();",
     "maxOceanBayDepth: floor -> ceil (skala)"),
    ("M03-purge-rzezba-gt", LANDSEA,
     "if relief_neighbors >= p.min_sasiadow_rzezby.wartosc",
     "if relief_neighbors > p.min_sasiadow_rzezby.wartosc",
     "purge: relief >= N -> > N (granica)"),
    ("M04-purge-suche-gt", LANDSEA,
     "&& dry_land_neighbors >= p.min_sasiadow_suchych.wartosc",
     "&& dry_land_neighbors > p.min_sasiadow_suchych.wartosc",
     "purge: dry >= N -> > N (granica)"),
    ("M05-purge-and-or", LANDSEA,
     "            && dry_land_neighbors >= p.min_sasiadow_suchych.wartosc",
     "            || dry_land_neighbors >= p.min_sasiadow_suchych.wartosc",
     "purge: && -> || (struktura warunku)"),
    ("M06-purge-tylko-gory", LANDSEA,
     "if matches!(nh.terrain, Terrain::Mountains | Terrain::Hills) {",
     "if matches!(nh.terrain, Terrain::Mountains) {",
     "purge: Wzgorza nie liczone jako rzezba (struktura)"),
    ("M07-purge-bez-filtra-bfs", LANDSEA,
     "        if depth.contains_key(&hex_key(q, r)) {\n            continue;\n        }\n        let mut relief_neighbors",
     "        let mut relief_neighbors",
     "purge: brak pominiecia heksow z BFS od krawedzi (struktura)"),
    ("M08-trim-noop", LANDSEA,
     "pub fn trim_deep_ocean_bays(hexes: &mut HexRecord, width: i64, height: i64) -> usize {\n    trim_enclosed_ocean_only(hexes, width, height)",
     "pub fn trim_deep_ocean_bays(hexes: &mut HexRecord, width: i64, height: i64) -> usize {\n    let _ = trim_enclosed_ocean_only(hexes, width, height);\n    0",
     "trimDeepOceanBays: brak zmian (no-op)"),
    ("M09-finalize-passes-min1", LANDSEA,
     "    for _pass in 0..max_passes {",
     "    for _pass in 0..max_passes.min(1) {",
     "finalize: maxPasses -> min(1) (N-2)"),
    ("M10-finalize-passes-plus1", LANDSEA,
     "    for _pass in 0..max_passes {",
     "    for _pass in 0..max_passes + 1 {",
     "finalize: maxPasses -> N+1"),
    ("M11-finalize-passes-minus1", LANDSEA,
     "    for _pass in 0..max_passes {",
     "    for _pass in 0..max_passes.saturating_sub(1) {",
     "finalize: maxPasses -> N-1"),
    ("M12-finalize-early-exit-usuniety", LANDSEA,
     "        if changed == 0 {\n            break;\n        }\n    }\n}\n\n/// Wariant domyslny (web",
     "    }\n}\n\n/// Wariant domyslny (web",
     "finalize: usuniecie wczesnego wyjscia changed==0 (RZEKOMO-RÓWNOWAŻNA, dowod w dokumencie)"),
    ("M13-finalize-break-and-or", LANDSEA,
     "        if find_inland_water_hexes(hexes, width, height).is_empty()\n            && find_dry_land_touching_sea(hexes).is_empty()",
     "        if find_inland_water_hexes(hexes, width, height).is_empty()\n            || find_dry_land_touching_sea(hexes).is_empty()",
     "finalize: warunek stopu && -> ||"),
    ("M14-finalize-brak-pierscienia", LANDSEA,
     "        changed += apply_double_coast_ring(hexes);\n        changed += sanitize_coast_hexes(hexes);",
     "        changed += sanitize_coast_hexes(hexes);",
     "finalize: pominiety pierscien podwojny (struktura)"),
    ("M15-thicken-cap-12-na-1", LANDSEA,
     "    for _pass in 0..p.przebiegi_wygladzania.wartosc {",
     "    for _pass in 0..1 {",
     "thicken: cap przebiegow 12 -> 1"),
    ("M16-thicken-cap-12-na-11", LANDSEA,
     "    for _pass in 0..p.przebiegi_wygladzania.wartosc {",
     "    for _pass in 0..p.przebiegi_wygladzania.wartosc.saturating_sub(1) {",
     "thicken: cap 12 -> 11 (N-1, kod)"),
    ("M17-thicken-cap-12-na-13", LANDSEA,
     "    for _pass in 0..p.przebiegi_wygladzania.wartosc {",
     "    for _pass in 0..p.przebiegi_wygladzania.wartosc + 1 {",
     "thicken: cap 12 -> 13 (N+1, kod)"),
    ("M18-thicken-prog-ladu-gt", LANDSEA,
     "if count_land_neighbors(hexes, q, r) >= p.prog_sasiadow_ladu.wartosc {",
     "if count_land_neighbors(hexes, q, r) > p.prog_sasiadow_ladu.wartosc {",
     "thicken (a): prog >= 4 -> > 4 (granica)"),
    ("M19-thicken-brak-break-fill", LANDSEA,
     "        if to_fill.is_empty() {\n            break;\n        }",
     "",
     "thicken (a): usuniety break przy pustym to_fill (RZEKOMO-RÓWNOWAŻNA)"),
    ("M20-thicken-brak-break-coast", LANDSEA,
     "        if to_coast.is_empty() {\n            break;\n        }",
     "",
     "thicken (b): usuniety break przy pustym to_coast (RZEKOMO-RÓWNOWAŻNA)"),
    ("M21-thicken-ring-min1", LANDSEA,
     "    for _ring in 0..coast_width {",
     "    for _ring in 0..coast_width.min(1) {",
     "thicken (b): pierscien coastWidth -> min(1)"),
    ("M22-flatten-gt", LANDSEA,
     "        if morze_n >= prog {",
     "        if morze_n > prog {",
     "flatten: prog >= 5 -> > 5 (granica)"),
    ("M23-flatten-brak-filtra-rzeki", LANDSEA,
     "        if hex.river_present {\n            continue;\n        }\n",
     "",
     "flatten: brak filtra rzeki (struktura)"),
    ("M24-json-cap-12-na-11", COAST_JSON,
     "\"przebiegi_wygladzania\": { \"wartosc\": 12,",
     "\"przebiegi_wygladzania\": { \"wartosc\": 11,",
     "tabela: cap 12 -> 11"),
    ("M25-json-maxpasses-3-na-2", COAST_JSON,
     "\"max_przebiegow_domyslne\": { \"wartosc\": 3,",
     "\"max_przebiegow_domyslne\": { \"wartosc\": 2,",
     "tabela: domyslne maxPasses 3 -> 2"),
    ("M26-json-maxpasses-3-na-4", COAST_JSON,
     "\"max_przebiegow_domyslne\": { \"wartosc\": 3,",
     "\"max_przebiegow_domyslne\": { \"wartosc\": 4,",
     "tabela: domyslne maxPasses 3 -> 4"),
    ("M27-finalize-passes-min2", LANDSEA,
     "    for _pass in 0..max_passes {",
     "    for _pass in 0..max_passes.min(2) {",
     "finalize: maxPasses -> min(2) (N-1 dla N=3, kod)"),
    ("M28-finalize-passes-plus-jeden-tylko-dla-3", LANDSEA,
     "    for _pass in 0..max_passes {",
     "    for _pass in 0..if max_passes == 3 { 4 } else { max_passes } {",
     "finalize: N=3 -> 4 (N+1 dla N=3, kod)"),
]


def sha(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def run_cargo(engine):
    cmd = ["cargo", "test", "--offline", "--no-fail-fast"]
    for t in TESTS:
        cmd += ["--test", t]
    env = dict(os.environ)
    env["CARGO_INCREMENTAL"] = "0"
    env["CARGO_PROFILE_DEV_DEBUG"] = "0"
    p = subprocess.run(cmd, cwd=engine, env=env, capture_output=True, text=True)
    out = p.stdout + p.stderr
    failed = sorted(set(re.findall(r"^test (\S+) \.\.\. FAILED$", out, re.M)))
    results = re.findall(r"test result: (\w+)\. (\d+) passed; (\d+) failed", out)
    return p.returncode, failed, results, out


def main():
    engine = sys.argv[1]
    results_path = sys.argv[2]
    check = "--check" in sys.argv
    lo = int(sys.argv[sys.argv.index("--from") + 1]) if "--from" in sys.argv else 1
    hi = int(sys.argv[sys.argv.index("--to") + 1]) if "--to" in sys.argv else len(MUTS)
    existing = []
    if os.path.exists(results_path):
        with open(results_path, encoding="utf-8") as fh:
            existing = json.load(fh)
    done = {r["id"] for r in existing}

    for idx, (mid, rel, old, new, desc) in enumerate(MUTS, start=1):
        if idx < lo or idx > hi:
            continue
        path = os.path.join(engine, rel)
        with open(path, encoding="utf-8") as fh:
            original = fh.read()
        n = original.count(old)
        if n != 1:
            print(json.dumps({"id": mid, "error": f"wystapien old = {n}, wymagane 1"}))
            continue
        if check:
            print(json.dumps({"id": mid, "ok": True}))
            continue
        if mid in done:
            print(json.dumps({"id": mid, "skipped": "juz w wynikach"}))
            continue
        before = sha(path)
        mutated = original.replace(old, new, 1)
        try:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(mutated)
            rc, failed, results, cargo_out = run_cargo(engine)
            log_dir = os.environ.get("MUT_LOG_DIR") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "mut-logs")
            os.makedirs(log_dir, exist_ok=True)
            with open(os.path.join(log_dir, mid + ".log"), "w", encoding="utf-8") as lf:
                lf.write(cargo_out)
        finally:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(original)
        after = sha(path)
        rec = {
            "id": mid,
            "plik": rel,
            "opis": desc,
            "verdict": "killed" if rc != 0 else "survived",
            "rc": rc,
            "failed_tests": failed,
            "wyniki": results,
            "sha_przed": before,
            "sha_po": after,
            "przywrocono": before == after,
        }
        existing.append(rec)
        with open(results_path, "w", encoding="utf-8") as fh:
            json.dump(existing, fh, ensure_ascii=False, indent=1)
        print(json.dumps(rec, ensure_ascii=False))


if __name__ == "__main__":
    main()
