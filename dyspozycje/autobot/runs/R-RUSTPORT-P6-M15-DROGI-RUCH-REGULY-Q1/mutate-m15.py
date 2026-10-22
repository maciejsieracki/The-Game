#!/usr/bin/env python3
"""Mutacje P6.M15: kazda zmienia JEDEN fragment roads.rs, uruchamia testy p6_m15_roads, przywraca plik.
Oczekiwanie: test CZERWONY (mutant wykryty). Uzycie (z rust-port/engine, z CARGO_TARGET_DIR):
  python3 -I mutate-m15.py
"""
import subprocess
import sys

R = "src/domain/roads.rs"
MUTANTS = [
    ("is_road: bez bruku", R, "key == names.ulepszenie_droga || key == names.ulepszenie_droga_brukowana", "key == names.ulepszenie_droga"),
    ("is_road: bez drogi zwyklej", R, "key == names.ulepszenie_droga || key == names.ulepszenie_droga_brukowana", "key == names.ulepszenie_droga_brukowana"),
    ("has_road: all zamiast any", R, "        .any(|key| is_road_improvement_key(key))\n}", "        .all(|key| is_road_improvement_key(key))\n}"),
    ("modifier: Infinity nie zwracane wprost", R, "    if cost == f64::INFINITY {\n        return f64::INFINITY;\n    }\n", ""),
    ("modifier: bez podlogi bruku", R, "        return js_max(\n            road_bruk_min_move_cost(),\n            cost / road_bruk_move_speed_mult(),\n        );", "        return cost / road_bruk_move_speed_mult();"),
    ("modifier: podloga zwyklej drogi", R, "        return cost / road_move_speed_mult();", "        return js_max(road_min_move_cost(), cost / road_move_speed_mult());"),
    ("modifier: droga przed brukiem", R, "    if has(&names.ulepszenie_droga_brukowana) {", "    if has(&names.ulepszenie_droga) && !has(&names.ulepszenie_droga_brukowana) {"),
    ("modifier: bez sprawdzenia pola ulepszenie", R, "keys.iter().any(|key| key == name) || hex.ulepszenie.as_deref() == Some(name)", "keys.iter().any(|key| key == name)"),
    ("modifier: mnoznik drogi z bruku", R, "        return cost / road_move_speed_mult();", "        return cost / road_bruk_move_speed_mult();"),
    ("js_max: f64::max (NaN gubiony)", R, "    if a.is_nan() || b.is_nan() {\n        f64::NAN\n    } else {\n        a.max(b)\n    }", "    a.max(b)"),
    ("index: wiodace zero dozwolone", R, "    if key.len() > 1 && key.starts_with('0') {\n        return None;\n    }\n", ""),
    ("index: granica 2^32-1", R, "u64::from(u32::MAX - 1)", "u64::from(u32::MAX)"),
    ("collect: bez porzadku indeksow", R, "    indexed.sort_by_key(|(index, _, _)| *index);\n", ""),
    ("collect: indeksy odwrocone", R, "        .into_iter()\n        .map(|(_, key, hex)| (key, hex))\n        .chain(others)", "        .into_iter()\n        .map(|(_, key, hex)| (key, hex))\n        .rev()\n        .chain(others)"),
    ("collect: pierwszy zamiast ostatniego duplikatu", R, "            Some(slot) => slot.1 = hex,", "            Some(_) => {}"),
]

survived = []
ONLY = sys.argv[1:]
for name, path, old, new in MUTANTS:
    if ONLY and not any(o in name for o in ONLY):
        continue
    src = open(path, encoding="utf-8").read()
    if new is None:
        print(f"POMINIETO (brak definicji): {name}")
        continue
    if src.count(old) != 1:
        print(f"BLAD: fragment nie wystepuje dokladnie raz: {name} ({src.count(old)})")
        sys.exit(2)
    open(path, "w", encoding="utf-8").write(src.replace(old, new))
    try:
        r = subprocess.run(
            ["cargo", "test", "--test", "p6_m15_roads", "--no-fail-fast"],
            capture_output=True, text=True,
        )
        out = r.stdout + r.stderr
        failed = [l for l in out.splitlines() if l.startswith("test ") and l.endswith("FAILED")]
        if r.returncode == 0:
            survived.append(name)
            print(f"PRZEZYL   : {name}")
        elif "error[" in out or "error:" in out and not failed:
            print(f"KOMPILACJA: {name} (mutant nie kompiluje sie)")
            survived.append(name + " [nie kompiluje]")
        else:
            print(f"WYKRYTY   : {name} -> {len(failed)} testow czerwonych: {', '.join(l.split()[1] for l in failed[:4])}")
    finally:
        open(path, "w", encoding="utf-8").write(src)
print(f"mutantow={len([m for m in MUTANTS if m[3] is not None])} przezylo/niekompilujace={len(survived)}")
for s in survived:
    print("  ", s)
sys.exit(0 if not survived else 1)
