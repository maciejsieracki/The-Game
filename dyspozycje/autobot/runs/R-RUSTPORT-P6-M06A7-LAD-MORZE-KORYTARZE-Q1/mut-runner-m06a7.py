# Mut-runner P6.M06A7 (partia 1). Kazda mutacja: podmiana tekstu w pliku (assert: dokladnie 1 trafienie),
# cargo test --test p6_m06a7_annular, wynik zapisany do mut-results-m06a7.json, plik przywracany w finally.
# Uzycie: python3 -I mut-runner-m06a7.py <IDX_OD> <IDX_DO>   (z katalogu worktree)
import json
import os
import subprocess
import sys

ROOT = os.getcwd()
ENGINE = os.path.join(ROOT, "rust-port/engine")
LANDSEA = os.path.join(ENGINE, "src/domain/mapgen/landsea.rs")
IMPROV = os.path.join(ENGINE, "src/domain/improvements.rs")
DATA = os.path.join(ENGINE, "data/derived/mapgen-landsea-pangea-annular.json")
RUN = os.path.join(ROOT, "dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A7-LAD-MORZE-KORYTARZE-Q1")
RES = os.path.join(RUN, "mut-results-m06a7.json")

ANN_OLD = """    js_max(
        t.annular_min,
        js_min(
            t.annular_max,
            js_round(t.annular_baza + map_scale * t.annular_mnoznik),
        ),
    )"""

BRIDGE_OLD = """pub fn is_pangea_bridge_water(t: Terrain) -> bool {
    is_water_terrain_local(t)
}"""

JS_ROUND_OLD = "    if x - floor >= 0.5 {"

MUTANTS = [
    # id, opis (gałąź kontrolna), plik, old, new
    ("K1", "dolny clamp: max -> min", LANDSEA, ANN_OLD,
     ANN_OLD.replace("    js_max(\n        t.annular_min", "    js_min(\n        t.annular_min")),
    ("K2", "gorny clamp: min -> max", LANDSEA, ANN_OLD,
     ANN_OLD.replace("        js_min(\n            t.annular_max", "        js_max(\n            t.annular_max")),
    ("K3", "round usuniety", LANDSEA, ANN_OLD,
     ANN_OLD.replace("js_round(t.annular_baza + map_scale * t.annular_mnoznik)", "(t.annular_baza + map_scale * t.annular_mnoznik)")),
    ("K4", "round -> floor", LANDSEA, ANN_OLD,
     ANN_OLD.replace("js_round(t.annular_baza + map_scale * t.annular_mnoznik)", "(t.annular_baza + map_scale * t.annular_mnoznik).floor()")),
    ("K5", "round -> floor(x+0.5)", LANDSEA, ANN_OLD,
     ANN_OLD.replace("js_round(t.annular_baza + map_scale * t.annular_mnoznik)", "(t.annular_baza + map_scale * t.annular_mnoznik + 0.5).floor()")),
    ("K6", "sqrt usuniety (skala liniowa)", LANDSEA, "let map_scale = ((width * height) / t.annular_skala_pola).sqrt();",
     "let map_scale = (width * height) / t.annular_skala_pola;"),
    ("K7", "iloczyn w*h -> w+h", LANDSEA, "((width * height) / t.annular_skala_pola)",
     "((width + height) / t.annular_skala_pola)"),
    ("K8", "mnoznik pominiety", LANDSEA, "js_round(t.annular_baza + map_scale * t.annular_mnoznik)",
     "js_round(t.annular_baza + map_scale)"),
    ("K9", "js_round: porownanie > zamiast >= (granica polowki)", IMPROV, JS_ROUND_OLD,
     "    if x - floor > 0.5 {"),
    ("K10", "js_round: prog 0.499 zamiast 0.5", IMPROV, JS_ROUND_OLD,
     "    if x - floor >= 0.499 {"),
    ("B1", "most: tylko Morze (bez PlytkieMorze)", LANDSEA, BRIDGE_OLD,
     "pub fn is_pangea_bridge_water(t: Terrain) -> bool {\n    matches!(t, Terrain::Sea)\n}"),
    ("B2", "most: zawsze false", LANDSEA, BRIDGE_OLD,
     "pub fn is_pangea_bridge_water(_t: Terrain) -> bool {\n    false\n}"),
    ("B3", "most: zawsze true", LANDSEA, BRIDGE_OLD,
     "pub fn is_pangea_bridge_water(_t: Terrain) -> bool {\n    true\n}"),
    ("B4", "most: + Gory", LANDSEA, BRIDGE_OLD,
     "pub fn is_pangea_bridge_water(t: Terrain) -> bool {\n    is_water_terrain_local(t) || matches!(t, Terrain::Mountains)\n}"),
    ("D1", "dane: baza 6 -> 7", DATA, '"annular_baza": 6,', '"annular_baza": 7,'),
    ("D2", "dane: mnoznik 2.6 -> 2.5", DATA, '"annular_mnoznik": 2.6,', '"annular_mnoznik": 2.5,'),
    ("D3", "dane: skala 20160 -> 20161", DATA, '"annular_skala_pola": 20160,', '"annular_skala_pola": 20161,'),
    ("D4", "dane: min 6 -> 5", DATA, '"annular_min": 6,', '"annular_min": 5,'),
    ("D5", "dane: max 22 -> 23", DATA, '"annular_max": 22', '"annular_max": 23'),
]


def read(p):
    with open(p, "rb") as f:
        return f.read()


def write(p, b):
    with open(p, "wb") as f:
        f.write(b)


def run_one(mid, desc, path, old, new):
    orig = read(path)
    text = orig.decode("utf-8")
    n = text.count(old)
    if n != 1:
        return {"id": mid, "desc": desc, "error": f"old wystapil {n} razy"}
    mutated = text.replace(old, new, 1)
    if mutated == text:
        return {"id": mid, "desc": desc, "error": "mutacja nie zmienia pliku"}
    env = dict(os.environ)
    env.update({"CARGO_INCREMENTAL": "0", "CARGO_PROFILE_DEV_DEBUG": "0",
                "CARGO_TARGET_DIR": "/home/user/cargo-target-shared/wf_1accf3de-da0-2"})
    try:
        write(path, mutated.encode("utf-8"))
        p = subprocess.run(["cargo", "test", "--test", "p6_m06a7_annular"], cwd=ENGINE,
                           env=env, capture_output=True, text=True, timeout=540)
        out = p.stdout + p.stderr
        summary = [l for l in out.splitlines() if l.startswith("test result") or "FAILED" in l or "panicked" in l]
        return {"id": mid, "desc": desc, "exit": p.returncode,
                "killed": p.returncode != 0,
                "summary": summary[:8]}
    finally:
        write(path, orig)


def main():
    lo, hi = int(sys.argv[1]), int(sys.argv[2])
    results = json.load(open(RES)) if os.path.exists(RES) else []
    done = {r["id"] for r in results}
    for idx, (mid, desc, path, old, new) in enumerate(MUTANTS):
        if idx < lo or idx > hi or mid in done:
            continue
        r = run_one(mid, desc, path, old, new)
        results.append(r)
        with open(RES, "w") as f:
            json.dump(results, f, ensure_ascii=False, indent=1)
        print(mid, r.get("killed"), r.get("exit"), r.get("error", ""), flush=True)


if __name__ == "__main__":
    main()
