#!/usr/bin/env python3
"""Mutacje P6.M14: kazda zmienia JEDEN fragment kodu Rust, uruchamia testy p6_m14_*, przywraca plik.
Oczekiwanie: test CZERWONY (mutant wykryty). Uzycie (z rust-port/engine, z ustawionym CARGO_TARGET_DIR):
  python3 -I mutate-m14.py
"""
import subprocess
import sys

TERR = "src/domain/territory.rs"
WON = "src/domain/wonder_placement.rs"
MUTANTS = [
    ("owner_at: remis -> ostatni (dist <= best)", TERR, "        if dist < best_dist {", "        if dist <= best_dist {"),
    ("js_trim: bez U+FEFF", TERR, "                | '\\u{FEFF}'\n", ""),
    ("sight: brak wczesnego return 0", TERR, "    if base <= 0.0 {\n        return 0.0;\n    }\n    base + border_radius", "    base + border_radius"),
    ("legal: parsowanie przed centrum", TERR,
     "    if centers.contains(key) {\n        return false;\n    }\n    let Some((q, r)) = parse_hex_key(key) else {\n        return true;\n    };",
     "    let Some((q, r)) = parse_hex_key(key) else {\n        return true;\n    };\n    if centers.contains(key) {\n        return false;\n    }"),
    ("reconcile: bez usuwania centrow", TERR, "            if centers.contains(key.as_str()) {", "            if false && centers.contains(key.as_str()) {"),
    ("reconcile: bez warstwy lost", TERR, "            if lost_for_city.is_some_and(|lost| lost.contains(key.as_str())) {", "            if false && lost_for_city.is_some_and(|lost| lost.contains(key.as_str())) {"),
    ("reconcile: niesparsowalny klucz usuwany", TERR, "        for key in current.keys() {\n            let Some((q, r)) = parse_hex_key(key) else {\n                continue;\n            };", "        for key in current.keys() {\n            let (q, r) = parse_hex_key(key).unwrap_or((0.0, 0.0));"),
    ("owned_by: brak fail-closed", TERR, "    if territory_nodes.is_empty() {\n        return false;\n    }\n    territory_owner_at", "    territory_owner_at"),
    ("filter: pominiecie base", TERR, "        if let Some(base) = base_workable {\n            if !base(q, r) {\n                return false;\n            }\n        }", ""),
    ("religia: bez floor szerzenia", TERR, "szerzenie_max_dystans.unwrap_or(0.0).floor()", "szerzenie_max_dystans.unwrap_or(0.0)"),
    ("religia: bez filtra stanu", TERR, "        if state.is_some() && !has_state && !is_dom && !rel.counts.is_empty() {", "        if false && state.is_some() && !has_state && !is_dom && !rel.counts.is_empty() {"),
    ("religia: bez trim", TERR, "state_religion.map(js_trim)", "state_religion"),
    ("kultura: sight bez pierscienia", TERR, "base + border_radius(kultura_skumulowana)", "base"),
    ("js_number: pusty -> NaN", TERR, "    if t.is_empty() {\n        return 0.0;\n    }", "    if t.is_empty() {\n        return f64::NAN;\n    }"),
    ("js_number: bez hex", TERR, "return radix_literal(rest, 16);", "return f64::NAN;"),
    ("by_owner: bez filtra", TERR, "            if !filter(key, owner) {\n                continue;\n            }", ""),
    ("is_player_hex: zawsze isInTerritory", TERR, "    if !all_nodes.is_empty() {", "    if false && !all_nodes.is_empty() {"),
    ("wonder: dist==0 dopuszczone", WON, "if dist > radius || dist == 0.0 {", "if dist > radius {"),
    ("wonder: bez sortowania q", WON, "            .then(a.1.cmp(&b.1))\n", ""),
    ("wonder: gory dozwolone", WON, "!terrain.is_water() && terrain != TerrainType::Mountains", "!terrain.is_water()"),
    ("wonder: plytkie morze dozwolone", WON, "!terrain.is_water() &&", "terrain != TerrainType::Ocean &&"),
    ("wonder: zajete tylko cuda", WON, "wonders.iter().any(|w| w.q == q && w.r == r) || city_hexes.iter().any(|c| c.q == q && c.r == r)", "wonders.iter().any(|w| w.q == q && w.r == r)"),
    ("wonder owner: building nie dolaczone", WON, "    occupied.extend_from_slice(input.building_wonder_hexes);\n", ""),
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
            ["cargo", "test", "--test", "p6_m14_territory", "--test", "p6_m14_work", "--test", "p6_m14_range", "--test", "p6_m14_wonder", "--no-fail-fast"],
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
