#!/usr/bin/env python3
"""Mutacje r3 dla P6.M07A (lekcja M06B (d): mutacja na kazdej galezi sterujacej).

Uruchom: python3 -I <ten plik> <KATALOG_ENGINE> <NR_MUTACJI_LUB_all>
Dla kazdej mutacji: podmiana dokladnie jednego wystapienia w rivers_a.rs / rivers_a_fields.rs,
`cargo test --test p6_m07a_rivers_a --test p6_m07a_rivers_a_caps`, przywrocenie pliku.
Wynik: WYKRYTA (testy czerwone) albo NIEWYKRYTA (wszystkie zielone).
"""
import os
import subprocess
import sys

MAPGEN = "src/domain/mapgen"
MUTS = [
    ("M1-block_existing", "rivers_a.rs",
     "if block_existing && hex.river_present && allow_key != Some(cell_key) {",
     "if false && hex.river_present && allow_key != Some(cell_key) {"),
    ("M2-allow_key", "rivers_a.rs",
     "if block_existing && hex.river_present && allow_key != Some(cell_key) {",
     "if block_existing && hex.river_present && true {"),
    ("M3-relief_guard", "rivers_a.rs",
     "if is_relief_terrain(hex.terrain) && !allow_relief_traversal {",
     "if is_relief_terrain(hex.terrain) && false {"),
    ("M4-relief_source", "rivers_a.rs",
     "        return cell_key == source_key;",
     "        return false;"),
    ("M5-sea_guard", "rivers_a.rs",
     "if hex.terrain == Terrain::Sea {\n        return false;",
     "if hex.terrain == Terrain::Sea && false {\n        return false;"),
    ("M6-mala_gap", "rivers_a.rs",
     "MapSizeLabel::Mala => 5,",
     "MapSizeLabel::Mala => 6,"),
    ("M7-repair_cap_63", "rivers_a.rs",
     "while guard < 64 {",
     "while guard < 63 {"),
    ("M8-repair_cap_65", "rivers_a.rs",
     "while guard < 64 {",
     "while guard < 65 {"),
    ("M9-coast_cap_3", "rivers_a.rs",
     "for _guard in 0..4 {",
     "for _guard in 0..3 {"),
    ("M10-coast_cap_5", "rivers_a.rs",
     "for _guard in 0..4 {",
     "for _guard in 0..5 {"),
]


def run_tests(engine):
    env = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_PROFILE_DEV_DEBUG="0",
               CARGO_PROFILE_TEST_DEBUG="0")
    p = subprocess.run(
        ["cargo", "test", "--no-fail-fast", "--test", "p6_m07a_rivers_a", "--test",
         "p6_m07a_rivers_a_caps"],
        cwd=engine, env=env, capture_output=True, text=True, timeout=500)
    out = p.stdout + p.stderr
    failed = [l for l in out.splitlines() if l.startswith("test ") and l.endswith("FAILED")]
    return p.returncode, failed


def main():
    engine = sys.argv[1]
    which = sys.argv[2] if len(sys.argv) > 2 else "all"
    for name, fname, old, new in MUTS:
        if which != "all" and which != name.split("-")[0]:
            continue
        path = os.path.join(engine, MAPGEN, fname)
        with open(path, encoding="utf-8") as fh:
            original = fh.read()
        if original.count(old) != 1:
            print(f"{name}: BLAD podmiany (wystapien={original.count(old)})")
            continue
        try:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(original.replace(old, new, 1))
            rc, failed = run_tests(engine)
        finally:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(original)
        verdict = "WYKRYTA" if rc != 0 else "NIEWYKRYTA"
        print(f"{name}: {verdict} rc={rc} czerwone={len(failed)} {failed[:3]}")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
