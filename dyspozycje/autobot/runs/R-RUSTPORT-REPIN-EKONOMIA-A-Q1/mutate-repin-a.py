#!/usr/bin/env python3
"""Mutacje portu manpower (pin 91dc998a) - R-RUSTPORT-REPIN-EKONOMIA-A-Q1 (Operator-pomiary R2).

Uzycie: python3 -I mutate-repin-a.py <ENGINE_DIR> <CARGO_TARGET_DIR> <ID,ID,...|all>
Dla kazdej mutacji: sprawdza, ze wzorzec wystepuje DOKLADNIE raz, podmienia go, uruchamia
wskazane binarki testowe (`cargo test --test X`), zapisuje EXIT i PRZYWRACA plik (takze przy bledzie).
Wynik: `MUTACJA id: WYKRYTA|NIEWYKRYTA (...)`. WYKRYTA = testy zwrocily exit != 0.
"""
import os
import subprocess
import sys
from pathlib import Path

ENGINE = Path(sys.argv[1])
TARGET = sys.argv[2]
WANT = sys.argv[3].split(",") if len(sys.argv) > 3 else ["all"]
RS = Path("src/domain/recruitment.rs")

MUT = [
    ("K01-skalowanie-dolna-0.1", RS,
     "(base * js_max(0.0, factor)).floor()", "(base * js_max(0.1, factor)).floor()",
     ["p6_5b_manpower", "p6_7a_growth", "p6_repin_a_costmult"]),
    ("K02-nieskonczony-mnoznik-0", RS,
     "let factor = if max_mult.is_finite() { max_mult } else { 1.0 };",
     "let factor = if max_mult.is_finite() { max_mult } else { 0.0 };",
     ["p6_5b_manpower", "p6_repin_a_costmult"]),
    ("K03-macierz-bez-klampy-0", RS,
     "Some(v) if v.is_finite() => js_max(0.0, 1.0 + v),",
     "Some(v) if v.is_finite() => 1.0 + v,",
     ["p6_5b_manpower", "p6_repin_a_costmult"]),
    ("K04-koszt-typu-uzywa-maxMult", RS,
     "        unit_manpower_cost(epoka, cost_mult)\n    }\n\n    /// Web `cityManpowerCurrent`",
     "        unit_manpower_cost(epoka, _max_mult)\n    }\n\n    /// Web `cityManpowerCurrent`",
     ["p6_5b_manpower", "p6_repin_a_costmult"]),
    ("K05-replenish-koszt-uzywa-maxMult", RS,
     "let cost_mult = mults.cost_mult;",
     "let cost_mult = mults.max_mult;",
     ["p6_5b_replenish", "p6_5b_manpower", "p6_repin_a_costmult"]),
    ("K06-zerowy-koszt-bez-galezi", RS,
     "if unit_cost == 0.0 {\n                    // Web: koszt 0",
     "if false && unit_cost == 0.0 {\n                    // Web: koszt 0",
     ["p6_5b_replenish", "p6_repin_a_costmult"]),
    ("K07-zerowy-koszt-nie-leczy", RS,
     "let new_hp = js_min(max_hp, cur_hp + desired_heal);\n                    units[index].hp",
     "let new_hp = cur_hp;\n                    units[index].hp",
     ["p6_5b_replenish", "p6_repin_a_costmult"]),
    ("K08-powrot-wczesnego-wyjscia-empireMp", RS,
     "let mut empire_mp = empire_manpower_current(cities, owner_id, epoka, max_mult);",
     "let mut empire_mp = empire_manpower_current(cities, owner_id, epoka, max_mult);\n            if empire_mp <= 0.0 { continue; }",
     ["p6_5b_replenish", "p6_repin_a_costmult"]),
    ("K09-override-macierzy-ignorowany", RS,
     "if from_override.is_some() {",
     "if false && from_override.is_some() {",
     ["p6_5b_manpower", "p6_repin_a_costmult"]),
]


def run(cmd, cwd, env):
    p = subprocess.run(cmd, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    return p.returncode, p.stdout.decode("utf-8", "replace")


def main():
    env = dict(os.environ)
    env["CARGO_INCREMENTAL"] = "0"
    env["CARGO_TARGET_DIR"] = TARGET
    env["CARGO_PROFILE_DEV_DEBUG"] = "0"
    for mid, path, old, new, tests in MUT:
        if "all" not in WANT and mid.split("-")[0] not in WANT and mid not in WANT:
            continue
        full = ENGINE / path
        orig = full.read_text(encoding="utf-8")
        cnt = orig.count(old)
        if cnt != 1:
            print(f"MUTACJA {mid}: BLAD wzorzec wystapil {cnt}x", flush=True)
            continue
        try:
            full.write_text(orig.replace(old, new, 1), encoding="utf-8")
            worst = 0
            detail = []
            for t in tests:
                rc, out = run(["cargo", "test", "--test", t, "--no-fail-fast"], str(ENGINE), env)
                detail.append(f"{t}:exit={rc}")
                if rc != 0:
                    worst = rc
                    failed = [l for l in out.splitlines() if l.strip().startswith("test ") and "FAILED" in l][:2]
                    detail.append("fail=" + " | ".join(failed))
            status = "WYKRYTA" if worst != 0 else "NIEWYKRYTA"
            print(f"MUTACJA {mid}: {status} ({'; '.join(detail)})", flush=True)
        finally:
            full.write_text(orig, encoding="utf-8")
    print("KONIEC", flush=True)


main()
