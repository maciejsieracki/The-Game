# P6.8I2: mutacje galezi sterujacych `pick.rs` (pickAutoImprovements) - skrypt W REPO, sciezki wzgledne.
# Uzycie (z korzenia worktree):
#   python3 dyspozycje/autobot/runs/R-RUSTPORT-P6-8I2-AUTO-ULEPSZENIA-PICK-Q1/mutacje/mutate-pick.py 1 2 3
# Dla kazdego ID: podmiana JEDNEGO dopasowania (asercja liczby wystapien == 1), `cargo test --test p6_8i2_pick`,
# przywrocenie pliku z kopii (ZAWSZE, takze po bledzie). Wynik: KILLED (test czerwony) / SURVIVED (zielony).
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
TARGET = ROOT / "rust-port/engine/src/domain/auto_improvements/pick.rs"
BACKUP = Path("/dev/shm/p68i2-pick-orig.rs")
ENV = dict(os.environ, CARGO_TARGET_DIR="/dev/shm/p68i2-target", CARGO_INCREMENTAL="0",
           CARGO_PROFILE_DEV_DEBUG="0", CARGO_PROFILE_TEST_DEBUG="0")

MUTANTS = {
    1: ("FAZA0: prog plonowych >= pop -> >",
        "(plonowe_w_promieniu as f64) >= or_zero(city.population)",
        "(plonowe_w_promieniu as f64) > or_zero(city.population)"),
    2: ("lesneMin: ceil -> floor",
        "(or_zero(pop) / JEDEN_NA_ILU_OBYWATELI).ceil()",
        "(or_zero(pop) / JEDEN_NA_ILU_OBYWATELI).floor()"),
    3: ("FAZA0 defenseCap: ceil -> floor",
        "(or_zero(city.population) / JEDEN_NA_ILU_OBYWATELI).ceil(),",
        "(or_zero(city.population) / JEDEN_NA_ILU_OBYWATELI).floor(),"),
    4: ("kolejnosc heksow: rzeka odwrocona",
        "ar.cmp(&br)",
        "br.cmp(&ar)"),
    5: ("kolejnosc heksow: odleglosc odwrocona",
        ".then(hex_dist_city(a.0, a.1).total_cmp(&hex_dist_city(b.0, b.1)))",
        ".then(hex_dist_city(b.0, b.1).total_cmp(&hex_dist_city(a.0, a.1)))"),
    6: ("KROK0: brak bramki rzeka/poza-rzeka (wolno_karczowac=true)",
        "let wolno_karczowac_poza_rzeka = !rzeki_do_zagospodarowania && lesne_min_spelnione;",
        "let wolno_karczowac_poza_rzeka = true;"),
    7: ("foodOnly wylaczone",
        "let food_only = demand_active && !deficit_active;",
        "let food_only = false;"),
    8: ("demandActive bez warunku profilu zrownowazone",
        "let demand_active = demand_driven && focus == UlepszeniaFocus::Zrownowazone;",
        "let demand_active = demand_driven;"),
    9: ("effectiveCityCap bez pulapu imperium",
        "let effective_city_cap = js_min(city_budget_cap, imperium_budget_cap);",
        "let effective_city_cap = city_budget_cap;"),
    10: ("KROK0: prog lasu > zamiast >=",
         "&& forest_left_in_radius >= WYRAB_MIN_FOREST_IN_RADIUS",
         "&& forest_left_in_radius > WYRAB_MIN_FOREST_IN_RADIUS"),
    11: ("FAZA2: prog lasu > zamiast >=",
         "if forest_count >= WYRAB_MIN_FOREST_IN_RADIUS {",
         "if forest_count > WYRAB_MIN_FOREST_IN_RADIUS {"),
    12: ("ZASADA3: sonda kandydatow wylaczona",
         "if !rep.any_candidate {",
         "if false {"),
    13: ("ZASADA3: formula nadwyzki bez any_candidate",
         "rep.surplus = rep.demand_active && !rep.deficit_active && !rep.any_candidate;",
         "rep.surplus = rep.demand_active && !rep.any_candidate;"),
    14: ("FAZA1: straznik duplikatu warstwy wylaczony",
         "if placed_get(&state, &hk).iter().any(|k| k == key) {\n                    continue;\n                }\n                if !hex_allows_key(map, q, r, key) {",
         "if false {\n                    continue;\n                }\n                if !hex_allows_key(map, q, r, key) {"),
    15: ("kolejnosc miast: odwrocona",
         "ordered_cities.sort_by(|a, b| a.id.cmp(&b.id));",
         "ordered_cities.sort_by(|a, b| b.id.cmp(&a.id));"),
    16: ("ZASADA2: zloze nie wraca do puli kandydatow",
         "hex_has_deposit_reserve(hex) && deposit_allows_player_improvement(key, hex)",
         "false && deposit_allows_player_improvement(key, hex)"),
    17: ("js_min: NaN ignorowany (jak f64::min)",
         "if a.is_nan() || b.is_nan() {\n        f64::NAN\n    } else if a < b {",
         "if false {\n        f64::NAN\n    } else if a < b {"),
    18: ("KROK0 wyrab: reserve >= -> >",
         "&& praca_left - wyrab_meta.koszt_praca >= reserve",
         "&& praca_left - wyrab_meta.koszt_praca > reserve"),
    19: ("FAZA0: pominiete sprawdzenie pulapu obronnego (have >= cap)",
         "if have >= defense_cap {\n                    continue;\n                }",
         "if false {\n                    continue;\n                }"),
    20: ("ZASADA2 citySkipWyrab: fallback false zamiast skip_wyrab",
         "map_skip.get(&city.id).copied().unwrap_or(skip_wyrab)",
         "map_skip.get(&city.id).copied().unwrap_or(false)"),
}


def run_one(mid):
    label, old, new = MUTANTS[mid]
    text = TARGET.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        return f"M{mid:02d} ERROR dopasowan={count} ({label})"
    mutated = text.replace(old, new, 1)
    try:
        TARGET.write_text(mutated, encoding="utf-8")
        proc = subprocess.run(
            ["cargo", "test", "-j", "2", "--test", "p6_8i2_pick"],
            cwd=ROOT / "rust-port/engine", env=ENV, capture_output=True, text=True, timeout=540,
        )
        out = proc.stdout + proc.stderr
        panics = sum(1 for ln in out.splitlines() if "panicked at" in ln)
        compile_err = "could not compile" in out or "error[E" in out
        if compile_err:
            status = "COMPILE_ERROR"
        elif proc.returncode != 0:
            status = "KILLED"
        else:
            status = "SURVIVED"
        return f"M{mid:02d} {status} rc={proc.returncode} panics={panics} ({label})"
    finally:
        TARGET.write_text(text, encoding="utf-8")


def main(argv):
    if not BACKUP.exists() or "--refresh" in argv:
        shutil.copyfile(TARGET, BACKUP)
    ids = [int(a) for a in argv if a.isdigit()]
    for mid in ids:
        print(run_one(mid), flush=True)
    if TARGET.read_text(encoding="utf-8") != BACKUP.read_text(encoding="utf-8"):
        print("RESTORE_MISMATCH")
        return 2
    print("RESTORED OK")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
