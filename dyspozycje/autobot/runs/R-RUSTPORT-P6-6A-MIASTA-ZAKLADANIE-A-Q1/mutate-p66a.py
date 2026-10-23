#!/usr/bin/env python3
"""Mutacje P6.6A: kazda zmienia JEDEN fragment kodu Rust / tabeli JSON, uruchamia testy p6_6a_*,
przywraca plik. Oczekiwanie: test CZERWONY (mutant wykryty). Uzycie (z rust-port/engine, z ustawionym
CARGO_TARGET_DIR):  python3 -I mutate-p66a.py [fragment-nazwy ...]
Krotka: (nazwa, plik, stary_fragment, nowy_fragment, ktore_wystapienie) - ktore_wystapienie=None wymaga
dokladnie jednego wystapienia; liczba n >= 1 oznacza n-te wystapienie (gdy fragment powtarza sie w pliku).
"""
import subprocess
import sys

ST = "src/domain/state.rs"
TE = "src/domain/terrain.rs"
J_FOUND = "data/derived/city-founding-params.json"
J_HEX = "data/derived/city-hex-clear-rules.json"
J_CONQ = "data/derived/conquest-stability-params.json"

M = [
    # --- city_founding ---
    ("pick: remis -> ostatni", ST, "Some(tied[idx as usize])", "Some(tied[tied.len() - 1])", None),
    ("pick: AI bez progu min", ST, "            js_max(pop_cost + 1.0, params.ai_source_min_pop)\n", "            pop_cost + 1.0\n", None),
    ("pick: gracz tez ma prog AI", ST, "let min_pop = if owner_id > 0 {", "let min_pop = if owner_id >= 0 {", None),
    ("pick: rand zawsze wolane", ST, "        if tied.len() == 1 {", "        if false {", None),
    ("pick: bez obslugi NaN/ujemnego indeksu", ST, "        if idx.is_nan() || idx < 0.0 {", "        if false {", None),
    ("pick: brak js_min (indeks poza zakresem)", ST, "let idx = crate::domain::recruitment::army_merge::js_min(len - 1.0, (rand() * len).floor());", "let idx = (rand() * len).floor();", None),
    ("evaluate: komunikat min ludnosci bez progu AI", ST, "js_max(koszt_ludnosc + 1.0, params.ai_source_min_pop)", "koszt_ludnosc + 1.0", None),
    ("evaluate: skarbiec <=", ST, "        if treasury_praca < koszt_praca {", "        if treasury_praca <= koszt_praca {", 1),
    ("evaluate: pierwsze miasto platne", ST, "let first_free = !is_subsequent_found_city(&owner_ids, owner_id);", "let first_free = is_subsequent_found_city(&owner_ids, owner_id);", None),
    ("can_afford: ludnosc <=", ST, "source_city_population - koszt_ludnosc < 1.0", "source_city_population - koszt_ludnosc <= 1.0", None),
    ("can_afford: skarbiec <=", ST, "        if treasury_praca < koszt_praca {", "        if treasury_praca <= koszt_praca {", 2),
    ("read_param: nieskonczone przechodzi", ST, "Some(v) if v.is_finite() => v,", "Some(v) => v,", None),
    ("label: odwrocone free", ST, "        if first_city_free {\n            return texts.etykieta_darmowe.clone();", "        if !first_city_free {\n            return texts.etykieta_darmowe.clone();", None),
    ("is_subsequent: != zamiast ==", ST, "player_city_owner_ids.contains(&owner_id)", "!player_city_owner_ids.contains(&owner_id)", None),
    ("tabela: prog AI 3 -> 2", J_FOUND, '"ai_source_min_pop": 3', '"ai_source_min_pop": 2', None),
    # --- city_hex_clear ---
    ("hex: domyslnie nie-gora", TE, "mountain_clears_all.unwrap_or(true)", "mountain_clears_all.unwrap_or(false)", None),
    ("hex: gora wykrywana odwrotnie", TE, "let mountain = hex.teren == TerrainType::Gory;", "let mountain = hex.teren != TerrainType::Gory;", None),
    ("hex: zloza odwrocone", TE, ".any(|kept| kept == nakladka.web_value())", ".any(|kept| kept != nakladka.web_value())", None),
    ("hex: snapshot po czyszczeniu", TE,
     "        *center_worked_tile = Some(hex_to_worked_tile(hex));\n        let mountain = hex.teren == TerrainType::Gory;\n        clear_hex_for_city_center(hex, Some(mountain));",
     "        let mountain = hex.teren == TerrainType::Gory;\n        clear_hex_for_city_center(hex, Some(mountain));\n        *center_worked_tile = Some(hex_to_worked_tile(hex));", None),
    ("hex: gora nie kasuje zloza", TE, "            hex.zloze = None;\n            hex.improvement_key = None;\n            return;", "            hex.improvement_key = None;\n            return;", None),
    ("hex: gora nie kasuje klucza ulepszenia", TE, "            hex.improvement_key = None;\n            return;", "            return;", None),
    ("hex: nie-gora kasuje zloza", TE, "(hex.nakladka != Overlay::Brak && !is_kept_deposit(hex.nakladka, rules));", "(hex.nakladka != Overlay::Brak && is_kept_deposit(hex.nakladka, rules));", None),
    ("hex: las zostaje", TE, "let clears = hex.nakladka == Overlay::Las\n            ||", "let clears = hex.nakladka == Overlay::Brak\n            ||", None),
    ("hex: brak heksu tez zapisuje snapshot", TE, "        let Some(hex) = hexes.get_mut(&(q, r)) else {\n            return;\n        };", "        let Some(hex) = hexes.get_mut(&(q, r)) else {\n            *center_worked_tile = None;\n            return;\n        };", None),
    ("tabela: droga nie zostaje", J_HEX, '"droga", "droga_brukowana"', '"droga_brukowana"', None),
    # --- conquest_stability ---
    ("conquest: prog obcej kultury <=", ST, "own_culture_share < conquest_stability_params().prog_obca_kultura", "own_culture_share <= conquest_stability_params().prog_obca_kultura", None),
    ("conquest: niestabilny = lub", ST, "is_foreign_culture_dominant(own_culture_share) && foreign_religion_dominant", "is_foreign_culture_dominant(own_culture_share) || foreign_religion_dominant", None),
    ("revolt: garnizon >= 0", ST, "        if garnizon_count > 0.0 {", "        if garnizon_count >= 0.0 {", None),
    ("revolt: odwrocony predykat niestabilnosci", ST, "        if !is_conquest_unstable(own_culture_share, foreign_religion_dominant) {", "        if is_conquest_unstable(own_culture_share, foreign_religion_dominant) {", None),
    ("captured: clamp bez semantyki JS", ST, "js_max(0.0, js_min(1.0, x))", "x.max(0.0).min(1.0)", None),
    ("captured: ten sam wlasciciel nie konczy", ST, "        if new_owner == previous_owner {", "        if false {", None),
    ("captured: brak fallbacku kulturaOwnShare", ST, "city.own_culture_share\n                .or(city.kultura_own_share)\n                .unwrap_or(1.0)", "city.own_culture_share.unwrap_or(1.0)", None),
    ("captured: kulturaOwnShare inna niz own", ST, "        city.kultura_own_share = Some(share);", "        city.kultura_own_share = Some(1.0 - share);", None),
    ("captured: ten sam okreg nie czysci", ST, "                clear_city_culture_mix(city);\n                return;", "                return;", None),
    ("clear_city_culture_mix: zostaje kulturaOwnShare", ST, "        city.kultura_own_share = None;\n    }\n\n    /// Web `CityCaptureCultureOpts`", "    }\n\n    /// Web `CityCaptureCultureOpts`", None),
    ("tick: konwersja kultury dla share <= 1", ST, "        if share < 1.0 {", "        if share <= 1.0 {", None),
    ("tick: rate odwrocony", ST, "culture_rate_applied: share - own_culture_share,", "culture_rate_applied: own_culture_share - share,", 1),
    ("tick: converted bez religii", ST, "            religion_converted: 0.0,", "            religion_converted: 1.0,", None),
    ("tick: pusta religia wlasciciela konwertuje", ST, "foreign_religion_dominant && !r.is_empty()", "foreign_religion_dominant", None),
    ("tick: religia bez obcej dominacji", ST, "owner_religion.filter(|r| foreign_religion_dominant && !r.is_empty())", "owner_religion.filter(|r| !r.is_empty())", None),
    ("ids: sad -> stela", ST, '"hasSad" => out.has_sad = present,', '"hasSad" => out.has_stela = present,', None),
    ("ids: swiatynia -> kregi", ST, '"hasSwiatynia" => out.has_swiatynia = present,', '"hasSwiatynia" => out.has_kamienne_kregi = present,', None),
    ("tabela: teatr nie daje amfiteatru", J_CONQ, '"teatr", "akademia"', '"akademia"', None),
    ("tabela: prog obcej kultury 0.5 -> 0.4", J_CONQ, '"prog_obca_kultura": 0.5', '"prog_obca_kultura": 0.4', None),
    ("tabela: mnoznik buntu 1.5 -> 1.4", J_CONQ, '"mnoznik_ryzyka_buntu_niestabilny_bez_garnizonu": 1.5', '"mnoznik_ryzyka_buntu_niestabilny_bez_garnizonu": 1.4', None),
    # --- visibility ---
    ("vis: zasieg < zamiast <=", ST, "hex_distance_f64(qf, rf, qf + dq, rf + dr) <= sight", "hex_distance_f64(qf, rf, qf + dq, rf + dr) < sight", None),
    ("vis: odleglosc bez trzeciej osi", ST, "dq.max(dr).max(ds)", "dq.max(dr)", None),
    ("vis: miasto = DEFAULT", ST, "if type_id == Some(city_type_id.as_str()) {", "if type_id != Some(city_type_id.as_str()) {", None),
    ("vis: Ruch przed Widok pola", ST, "if let Some((Some(widok), _)) = def {", "if let Some((_, Some(widok))) = def {", None),
    ("vis: DEFAULT_SIGHT >= 0", ST, "if value > 0.0 {", "if value >= 0.0 {", None),
    ("vis: garnizon wroga widoczny", ST, "                    return u.owner_id == player;", "                    return true;", None),
    ("vis: ladu nie odslania plytkiego morza", ST, "terrain != TerenBazowy::Morze\n", "terrain != TerenBazowy::PlytkieMorze\n", None),
    ("vis: dry = nie morze", ST, "!is_water_terrain(terrain)", "terrain != TerenBazowy::Morze", None),
    ("vis: miasto z zasiegiem 0 odslania centrum", ST, "            if sight <= 0.0 {\n                continue;", "            if sight < 0.0 {\n                continue;", None),
    ("vis: zasieg startu 0", ST, ".unwrap_or(visibility_params().start_reveal_radius)", ".unwrap_or(0.0)", None),
    ("vis: kultura domyslna 100", ST, "c.kultura.unwrap_or(0.0)", "c.kultura.unwrap_or(100.0)", None),
    ("vis: gracz domyslny 1", ST, "player_owner_id.unwrap_or(0)", "player_owner_id.unwrap_or(1)", None),
    ("vis: render odwrocony", ST, "        if !reveal_all_land {", "        if reveal_all_land {", None),
    ("vis: start nawet przy widocznych", ST, "        if !visible.is_empty() {\n            return visible;", "        if false {\n            return visible;", None),
    ("vis: sciezka tylko ostatni heks", ST, "        for (q, r) in path_hexes {", "        for (q, r) in path_hexes.iter().rev().take(1) {", None),
    ("vis: addExplored nie dodaje", ST, "        for key in visible {\n            explored.insert(*key);\n        }", "        let _ = visible;", None),
]

def tests_for(name, path):
    """Binaria testowe, ktore pokrywaja mutowany modul (reszta nie zalezy od zmienionego fragmentu)."""
    if path == J_FOUND or name.startswith(("pick:", "evaluate:", "can_afford:", "read_param:", "label:", "is_subsequent:")):
        t = ["p6_6a_founding"]
    elif path == J_HEX or name.startswith("hex:"):
        t = ["p6_6a_hexclear"]
    elif path == J_CONQ or name.startswith(("conquest:", "revolt:", "captured:", "clear_city", "tick:", "ids:")):
        t = ["p6_6a_conquest"]
    else:
        t = ["p6_6a_visibility"]
    if path.endswith(".json"):
        t.append("p6_6a_tables")
    out = []
    for x in t:
        out += ["--test", x]
    return out


import os

ONLY = sys.argv[1:]
SKIP = int(os.environ.get("MUT_SKIP", "0"))
survived = []
ran = 0
for idx, (name, path, old, new, nth) in enumerate(M):
    if idx < SKIP:
        continue
    if ONLY and not any(o in name for o in ONLY):
        continue
    ran += 1
    src = open(path, encoding="utf-8").read()
    cnt = src.count(old)
    if os.environ.get("MUT_CHECK"):
        ok = (cnt == 1) if nth is None else (cnt >= nth)
        print(("OK    " if ok else "BRAK  ") + f"{cnt}x: {name}")
        if not ok:
            survived.append(name)
        continue
    if nth is None:
        if cnt != 1:
            print(f"BLAD: fragment nie wystepuje dokladnie raz: {name} ({cnt})")
            sys.exit(2)
        mutated = src.replace(old, new)
    else:
        if cnt < nth:
            print(f"BLAD: brak {nth}. wystapienia: {name} ({cnt})")
            sys.exit(2)
        idx = -1
        for _ in range(nth):
            idx = src.index(old, idx + 1)
        mutated = src[:idx] + new + src[idx + len(old):]
    open(path, "w", encoding="utf-8").write(mutated)
    try:
        r = subprocess.run(
            ["cargo", "test", "--no-fail-fast"] + tests_for(name, path),
            capture_output=True, text=True,
        )
        out = r.stdout + r.stderr
        failed = [l for l in out.splitlines() if l.startswith("test ") and l.endswith("FAILED")]
        if r.returncode == 0:
            survived.append(name)
            print(f"PRZEZYL   : {name}")
        elif "error[" in out or ("error:" in out and not failed):
            print(f"KOMPILACJA: {name} (mutant nie kompiluje sie)")
            survived.append(name + " [nie kompiluje]")
        else:
            print(f"WYKRYTY   : {name} -> {len(failed)} testow czerwonych: {', '.join(l.split()[1] for l in failed[:3])}")
    finally:
        open(path, "w", encoding="utf-8").write(src)
print(f"mutantow={ran} przezylo/niekompilujace={len(survived)}")
for s in survived:
    print("  ", s)
sys.exit(0 if not survived else 1)
