# Mutacje P6.8B-P1b-c2c (available_production). Uruchomienie z korzenia worktree:
#   python3 <ten plik> [B1 B2 ...]
# Zrodlo czytane z dysku na starcie i przywracane bajt w bajt w `finally`.
# Klasa COMPILE-ERROR nie jest liczona jako zabicie. Testy: p6_8b_c2c_vectors (cala binarka).
import os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "../../../.."))
ENG = os.path.join(ROOT, "rust-port/engine")
SRC = os.path.join(ENG, "src/domain/production_units.rs")
orig = open(SRC, encoding="utf8").read()

allm = {
    "B1": ("    if b.cost.epoka_wejscia.is_some_and(|e| e > epoch) {", "    if b.cost.epoka_wejscia.is_some_and(|e| e >= epoch) {"),
    "B2": ("        if id == \"palisada\" && (built.contains(&\"mury\") || built.contains(&\"fort\")) {", "        if false {"),
    "B3": ("        if is_building_suppressed_from_production(&lite_of(b)) {", "        if false {"),
    "B4": ("            if !built.contains(&upgrade_from) {", "            if false {"),
    "B5": ("            if is_building_superseded_by_upgrade(id, built, &links) {\n                continue;\n            }\n            if building_type_committed(id, built, ctx.production_queue) {", "            if false {\n                continue;\n            }\n            if building_type_committed(id, built, ctx.production_queue) {"),
    "B6": ("            if building_type_committed(id, built, ctx.production_queue) {\n                continue;\n            }\n        } else {", "            if false {\n                continue;\n            }\n        } else {"),
    "B7": ("        let tech = js_trim(b.tech_unlock.as_deref().unwrap_or(\"\"));\n        if !tech.is_empty() && tech != \"-\" && tech != \"\\u{2014}\" && !techs.contains(&tech) {", "        let tech = js_trim(b.tech_unlock.as_deref().unwrap_or(\"\"));\n        if false {"),
    "B8": ("        if !building_location_allowed(b.cost.lokalizacja.as_deref(), ctx.cost.is_capital) {", "        if false {"),
    "B9": ("        if !city_building_prereq_met(prereq, &built_owned, &prereq_rows, &superseded) {", "        if false {"),
    "B10": ("        if is_water_access_building(id) && !ctx.city_has_coast_or_river {", "        if false {"),
    "B11": ("        if !ctx.show_resource_gated_buildings\n            && !building_resource_gate_met(", "        if false\n            && !building_resource_gate_met("),
    "B12": ("    if !is_scout_exception && (unit_epoch > epoch || unit_epoch < epoch - 1.0) {", "    if !is_scout_exception && (unit_epoch > epoch || unit_epoch < epoch) {"),
    "B13": ("        let is_scout_exception = typ == \"Civilian\";", "        let is_scout_exception = false;"),
    "B14": ("        } else if civ_has_replacement_for(&repl_rows, &u.cost.jednostka, civ) {", "        } else if false {"),
    "B15": ("        if unit_epoch >= 2.0\n            && !built.contains(&\"koszary\")", "        if unit_epoch >= 3.0\n            && !built.contains(&\"koszary\")"),
    # (r4 obrona) kolejnosc budynki-przed-jednostkami w production_item_order (wejscie permutowane w testach)
    "B16": ("(ProductionKind::Budynek, ProductionKind::Jednostka) => Ordering::Less,", "(ProductionKind::Budynek, ProductionKind::Jednostka) => Ordering::Greater,"),
    "B16b": ("(ProductionKind::Jednostka, ProductionKind::Budynek) => Ordering::Greater,", "(ProductionKind::Jednostka, ProductionKind::Budynek) => Ordering::Less,"),
    "B17": ("    let level = if ctx.building_level.is_finite() {", "    let level = if true {"),
    "B18": ("        if typ == \"Naval\" && !ctx.city_has_coast_or_river {\n            continue;", "        if false {\n            continue;"),
    "B19": ("        if u.cost.super_jednostka.as_deref() == Some(\"TAK\")\n            && ctx\n                .alive_unit_type_names\n                .contains(&u.cost.jednostka.as_str())\n        {\n            continue;", "        if false {\n            continue;"),
    "B21": ("        if !is_blank_replacement(zamiast) {\n            if !is_civ_special_replacement(&u.as_replacement_row(), civ) {", "        if !is_blank_replacement(zamiast) {\n            if false {"),
    # (r4 obrona) tie-break po nazwie w cost_then_name_order (wspolny z c2b)
    "B22": ("    replacement_name_compare(&a.nazwa, &b.nazwa)\n}", "    std::cmp::Ordering::Equal\n}"),
    # (r4 obrona) B20 = bramka narodowosci jednostek w petli jednostek available_production (inna galaz niz c2b M10: wzorzec z `civ`, nie `civ_nation`)
    "B20": ("        if !unit_allowed_for_civ_nation(nacja, civ) {", "        if false {"),
    "B23": ("                item_cost(ProductionKind::Budynek, id, &data, level),", "                item_cost(ProductionKind::Budynek, id, &data, 1.0),"),
}
sel = sys.argv[1:] or list(allm)
env = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_PROFILE_DEV_DEBUG="0", CARGO_PROFILE_TEST_DEBUG="0")
try:
    for k in sel:
        a, b = allm[k]
        n = orig.count(a)
        if n != 1:
            print(k, "pattern count", n, flush=True)
            continue
        open(SRC, "w", encoding="utf8").write(orig.replace(a, b))
        p = subprocess.run(["cargo", "test", "--test", "p6_8b_c2c_vectors"], cwd=ENG, env=env,
                           capture_output=True, text=True, timeout=500)
        out = p.stdout + p.stderr
        if "could not compile" in out or "error[" in out:
            status = "COMPILE-ERROR"
        else:
            status = "KILLED" if p.returncode != 0 else "SURVIVED"
        fails = [l.strip() for l in out.splitlines() if l.strip().startswith("test ") and "FAILED" in l]
        print(k, status, fails[:2], "rc=", p.returncode, flush=True)
finally:
    open(SRC, "w", encoding="utf8").write(orig)
    print("restored_bytes_identical", open(SRC, encoding="utf8").read() == orig, flush=True)
