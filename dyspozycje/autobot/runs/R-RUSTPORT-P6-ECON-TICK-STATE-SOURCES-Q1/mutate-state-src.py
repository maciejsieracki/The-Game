#!/usr/bin/env python3
"""Mutacje R-RUSTPORT-P6-ECON-TICK-STATE-SOURCES-Q1: kazda mutacja = jedna zamiana tekstu w module zrodel;
zabita, gdy `cargo test --test p6_state_src` NIE przechodzi (blad kompilacji liczony osobno jako COMPILE).
Uzycie: mutate-state-src.py <ENGINE_DIR> <TARGET_DIR> <START> <END>   (zakres indeksow mutacji, lacznie ze START, bez END)
"""
import subprocess, sys, os, shutil

engine, target, start, end = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
D = os.path.join(engine, "src/domain")
N = "turn_economy_inputs_native.rs"
C = "turn_economy_inputs_civ.rs"
P = "turn_economy_inputs_podzial.rs"

MUT = [
    # --- native ---
    (N, "if territory_owner_at(q, r, &nodes) == Some(owner_id)", "if territory_owner_at(q, r, &nodes) != Some(owner_id)", "placed: filtr wlasciciela odwrocony"),
    (N, "if territory_owner_at(q, r, &nodes) == Some(owner_id) {\n            out.push", "if true {\n            out.push", "placed: brak filtra terytorium"),
    (N, "nodes.extend(w.extra_territory_nodes.iter().cloned());", "", "wezly fortow pominiete"),
    (N, "CityNode::city(c.q as i32, c.r as i32, c.population)", "CityNode::city(c.q as i32, c.r as i32, 1.0)", "wezel miasta: pop=1"),
    (N, "if !empire_has_kopalnia_miedzi(Some(layers.iter())) {\n                return false;\n            }", "", "braz: brak bramki miedzi"),
    (N, "owner_cities(w, owner_id).any(|(_, built)| city_has_piec_hutniczy(built))", "owner_cities(w, owner_id).all(|(_, built)| city_has_piec_hutniczy(built))", "braz: any->all"),
    (N, "if !has_kopalnia {\n                return false;\n            }", "", "zelazo: brak bramki kopalni"),
    (N, "owner_cities(w, owner_id).any(|(_, built)| has_zelazo_access(None, Some(built)))", "owner_cities(w, owner_id).any(|_| true)", "zelazo: dostep przez odlewnie zamiast literalnego false"),
    (N, "if !empire_has_glinianka(&own) {\n                return false;\n            }", "", "cegla: brak bramki gliniank"),
    (N, 'built.iter().any(|b| b == "cegielnia")', 'built.iter().any(|b| b == "garncarnia")', "cegla: zly budynek"),
    (N, 'layers\n            .iter()\n            .any(|raw| web_normalize_improvement_key(raw).as_deref() == Some("glinianka"))', 'layers\n            .iter()\n            .any(|raw| raw.as_str() == "glinianka" || raw.as_str() == "kopalnia_zlota")', "glinianka: zly klucz"),
    (N, '"zloto" => {\n            let view = as_placed_map(&own);\n            empire_has_kopalnia_zlota(Some(view.as_slice()))', '"zloto" => {\n            let view = as_placed_map(&own);\n            !empire_has_kopalnia_zlota(Some(view.as_slice()))', "zloto: negacja"),
    (N, "Some(owner_s.as_str()),\n                Some(w.hex_owners),\n            )\n            .contains(\"kon\")", "None,\n                Some(w.hex_owners),\n            )\n            .contains(\"kon\")", "kon: brak filtra wlasciciela"),
    (N, '.contains("kon")', '.contains("braz")', "kon: zly klucz"),
    (N, "owner_has_native_resource_access(w, o.get() as i64, k)", "owner_has_native_resource_access(w, o.get() as i64, \"zloto\")", "grant: zawsze klucz zloto"),
    (N, "owner_has_native_resource_access(w, owner_id, \"zloto\")\n        // Trasy", "false\n        // Trasy", "zloto NT: brak natywnego"),
    (N, "|| (owner_id >= 0\n            && has_trade_route_resource_access(grants, PlayerId::new(owner_id as u64), \"zloto\"))", "|| false", "zloto NT: brak grantu"),
    (N, "if built_empire.contains(\"cegielnia\") && !labels.iter().any(|l| l == \"Cegła\") {", "if false {", "etykiety: brak Cegla"),
    (N, "if built_empire.contains(\"garncarnia\") && !labels.iter().any(|l| l == \"Ceramika\") {", "if false {", "etykiety: brak Ceramika"),
    (N, "kultura: Some(w.kultura_by_city.get(&c.id).copied().unwrap_or(0.0)),", "kultura: Some(0.0),", "etykiety: kultura=0"),
    (N, "owner_era,\n            border_radius,\n            ResourceAccessOptions", "1,\n            border_radius,\n            ResourceAccessOptions", "etykiety: epoka=1"),
    (N, "owner_id: Some(owner_s.as_str()),\n                hex_owners: Some(w.hex_owners),", "owner_id: None,\n                hex_owners: Some(w.hex_owners),", "etykiety: brak ownerId"),
    (N, "built_ids: Some(built),", "built_ids: None,", "etykiety: brak builtIds"),
    (N, "Some(view.as_slice()),\n            owner_era,", "None,\n            owner_era,", "etykiety: brak placed"),
    (N, "(self.owner_era)(owner_id) as i64", "(self.owner_era)(0) as i64", "StateSources: epoka ownera 0"),
    # --- civ ---
    (C, "out.entry(HUMAN_OWNER_PRIMARY).or_insert_with(|| {", "out.insert(HUMAN_OWNER_PRIMARY, \"x\".to_string());\n    out.entry(HUMAN_OWNER_PRIMARY).or_insert_with(|| {", "civ: zawsze nadpisz gracza"),
    (C, "Some(c) if !c.is_empty() => c,", "Some(c) => c,", "civ: pusty ciag nie spada na grecy"),
    (C, "for (oid, civ) in ai_owner_civ_map {\n        out.insert(*oid, civ.clone());\n    }", "for (oid, civ) in ai_owner_civ_map {\n        out.entry(*oid).or_insert_with(|| civ.clone());\n    }", "civ: AI nie nadpisuje"),
    (C, 'pub const DEFAULT_PLAYER_CIV: &str = "grecy";', 'pub const DEFAULT_PLAYER_CIV: &str = "rzymianie";', "civ: zly fallback"),
    # --- podzial ---
    (P, "procent_nauka: ai_fixed_procent_nauki(),", "procent_nauka: default_podzial_handlu().procent_nauka,", "podzial: AI nauka = gracza"),
    (P, "procent_budynki: ai_fixed_procent_budynki(),", "procent_budynki: 70.0,", "podzial: AI praca = 70"),
    (P, "            if o == 0 {\n                fresh_owner_default_podzial_handlu()", "            if o == 1 {\n                fresh_owner_default_podzial_handlu()", "podzial: init handlu wyjatek ownera 0 zmieniony"),
    (P, "            if o == 0 {\n                fresh_owner_default_podzial_pracy()", "            if o == 1 {\n                fresh_owner_default_podzial_pracy()", "podzial: init pracy wyjatek ownera 0 zmieniony"),
    (P, "    pracy.entry(o).or_insert_with(|| {\n        if is_human(o) {", "    pracy.entry(o).or_insert_with(|| {\n        if !is_human(o) {", "podzial: seed pracy is_human odwrocony"),
    (P, "    handlu.entry(o).or_insert_with(|| {\n        if is_human(o) {", "    handlu.entry(o).or_insert_with(|| {\n        if !is_human(o) {", "podzial: seed handlu is_human odwrocony"),
    (P, "    for &o in human_owner_ids {\n        m.insert(o, fresh_owner_default_podzial_handlu());", "    for &o in human_owner_ids.iter().take(1) {\n        m.insert(o, fresh_owner_default_podzial_handlu());", "podzial: tylko pierwszy czlowiek (handlu)"),
]

def run(args):
    return subprocess.run(args, cwd=engine, capture_output=True, text=True,
                          env={**os.environ, "CARGO_TARGET_DIR": target, "CARGO_INCREMENTAL": "0",
                               "CARGO_PROFILE_DEV_DEBUG": "0", "CARGO_PROFILE_TEST_DEBUG": "0"})

for i in range(start, min(end, len(MUT))):
    f, a, b, desc = MUT[i]
    path = os.path.join(D, f)
    src = open(path, encoding="utf-8").read()
    if src.count(a) != 1:
        print(f"[{i:02d}] BLAD-KOTWICY ({src.count(a)}x) {desc}", flush=True)
        continue
    open(path, "w", encoding="utf-8").write(src.replace(a, b))
    try:
        r = run(["cargo", "test", "-j", "2", "--test", "p6_state_src"])
        out = r.stdout + r.stderr
        if r.returncode == 0:
            verdict = "PRZEZYLA"
        elif "error[E" in out or "error: could not compile" in out:
            verdict = "COMPILE"
        else:
            verdict = "ZABITA"
    finally:
        open(path, "w", encoding="utf-8").write(src)
    print(f"[{i:02d}] {verdict:9s} {f} :: {desc}", flush=True)
