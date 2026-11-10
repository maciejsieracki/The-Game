#!/usr/bin/env python3
"""Testy mutacyjne M16: kazda mutacja zmienia JEDEN fragment `improvement_build.rs` albo tabeli JSON,
uruchamia testy `p6_m16_*` i oczekuje CZERWONEGO wyniku (mutant wykryty). Po kazdej mutacji plik jest
przywracany. Uzycie (z katalogu rust-port/engine):
  python3 -I mutate-m16.py <katalog_engine> <CARGO_TARGET_DIR> [filtr_nazwy]
Wynik: linie `MUTANT <nazwa>: WYKRYTY|PRZEZYL|POMINIETY` oraz podsumowanie.
"""
import os
import subprocess
import sys

ENGINE = sys.argv[1]
TARGET = sys.argv[2]
FILTER = sys.argv[3] if len(sys.argv) > 3 else ""
SRC = os.path.join(ENGINE, "src/domain/improvement_build.rs")
TAB = os.path.join(ENGINE, "data/derived/ulepszenia-budowa.json")

# (nazwa, plik, stary fragment, nowy fragment)
M = [
    ("strip_forest: bez negacji", SRC, "!has(dependent, key)", "has(dependent, key)"),
    ("legacy_farm: nakladka != Las", SRC,
     "if nakladka != Overlay::Las {\n        return false;\n    }\n    normalize_improvement_key(Some(key))",
     "if nakladka == Overlay::Las {\n        return false;\n    }\n    normalize_improvement_key(Some(key))"),
    ("farm_base: las dozwolony", SRC,
     "if nakladka == Overlay::Las {\n        return false;\n    }\n    tables().teren_farma",
     "if nakladka == Overlay::Las {\n        return true;\n    }\n    tables().teren_farma"),
    ("forest_blocked: wyrab zablokowany", SRC,
     "if key == k::WYRAB {\n        return false;\n    }\n    has(&las.zablokowane, key)",
     "if key == k::WYRAB {\n        return true;\n    }\n    has(&las.zablokowane, key)"),
    ("forest_blocked: pomija wspolistnieje", SRC,
     "if has(&las.wspolistnieje, key) {\n        return false;\n    }",
     "if has(&las.wspolistnieje, key) {\n        return true;\n    }"),
    ("replaced: sektor !=", SRC, "if sektor_of(item) == Some(sekt) {", "if sektor_of(item) != Some(sekt) {"),
    ("replaced: solo bez gałęzi else", SRC, "} else if is_food_layer_key(key) {", "} else if false {"),
    ("impact: owce bez negacji", SRC, "key == k::OWCE && !is_owce_base_terrain", "key == k::OWCE && is_owce_base_terrain"),
    ("impact: oboz wymaga las", SRC, "if key == k::OBOZ_LOWIECKI && nakladka != Overlay::Las {", "if key == k::OBOZ_LOWIECKI && nakladka == Overlay::Las {"),
    ("impact: oboz bez tartaku", SRC, "k::OBOZ_LOWIECKI && !existing.iter().any(|item| item == k::TARTAK)", "k::OBOZ_LOWIECKI && existing.iter().any(|item| item == k::TARTAK)"),
    ("food: farma 1 warstwa", SRC, "ex.len() == 1 && (has_i || has_b)", "ex.len() == 1 && has_i"),
    ("food: bydlo wymaga farmy", SRC, "k::IRYGACJA | k::BYDLO => {", "k::IRYGACJA => {"),
    ("deposit: miedz bez ruda", SRC, "|| zloze == Some(k::ZLOZE_RUDA)\n        }", "}"),
    ("clay: bez lowercase", SRC, "js_trim(zloze).to_lowercase() == k::ZLOZE_GLINA", "js_trim(zloze) == k::ZLOZE_GLINA"),
    ("reserve: las", SRC, "hex.overlay != Overlay::Brak && hex.overlay != Overlay::Las", "hex.overlay != Overlay::Brak && hex.overlay == Overlay::Las"),
    ("tarasy: rowne", SRC, "|| has(&tarasy.rowne, &t)", "|| false"),
    ("livestock: era <=", SRC, "era < hod.nowy_swiat_min_epoka_hodowli", "era <= hod.nowy_swiat_min_epoka_hodowli"),
    ("livestock: koszt >", SRC, "horse_stock_available >= hod.stadnina_koszt_koni", "horse_stock_available > hod.stadnina_koszt_koni"),
    ("radius: ceil", SRC, "rad.floor() as i32", "rad.ceil() as i32"),
    ("tech: all->any", SRC, "req.iter().all(|tech| researched.contains(tech))", "req.iter().any(|tech| researched.contains(tech))"),
    ("meta: era", SRC, "            row.epoka,\n        ),\n        tech_id", "            None,\n        ),\n        tech_id"),
    ("qual: fort rival", SRC, "&& !rival_city_territory", "&& true"),
    ("qual: fort own unit", SRC, "|| self.own_unit_hex_keys.contains(hex_key_str.as_str())", ""),
    ("qual: road dist", SRC, "== 1.0", "<= 1.0"),
    ("qual: river present", SRC, "is_some_and(|hex| hex.river_present)", "is_some_and(|hex| false && hex.river_present)"),
    ("qual: bruk", SRC, "has_droga && !has_bruk", "has_droga"),
    ("qual: layers lower", SRC, "let n = lower_trim(&item);", "let n = item.clone();"),
    ("qual: pending", SRC, "if self.pending_undo.contains(pending_key.as_str()) {\n            return true;", "if false && self.pending_undo.contains(pending_key.as_str()) {\n            return true;"),
    ("qual: wyrab clearing", SRC, ".is_some_and(|set| set.contains(&hex_key_str))\n                    && nakladka == Overlay::Las\n                    && self.in_player_territory(q, r)", ".is_some_and(|set| false && set.contains(&hex_key_str))\n                    && nakladka == Overlay::Las\n                    && self.in_player_territory(q, r)"),
    ("qual: territory fallback", SRC, "is_territory_hex_owned_by(q, r, self.player_owner_id_num, self.territory_nodes)", "is_territory_hex_owned_by(q, r, 0, self.territory_nodes)"),
    ("api: click pending", SRC, ".any(|item| *item == format!(\"{hex_key_str}:{key}\"))", ".any(|item| *item != format!(\"{hex_key_str}:{key}\"))"),
    ("api: tech request", SRC, "if !is_improvement_tech_unlocked(key, &self.researched) {", "if is_improvement_tech_unlocked(key, &self.researched) {"),
    ("api: candidate placed", SRC, "for key in state.placed_keys.iter().flatten() {", "for key in state.placed_keys.iter().flatten().take(0) {"),
    ("gallery: oboz", SRC, "k::OBOZ_LOWIECKI => !teren.is_water(),", "k::OBOZ_LOWIECKI => teren.is_water(),"),
    ("gallery: combo bydlo+owce", SRC, "if inc(k::BYDLO) && inc(k::OWCE) && !inc(k::FARMA) {", "if inc(k::BYDLO) && inc(k::LAMA) && !inc(k::FARMA) {"),
    ("scan: enemy", SRC, "out.las_in_enemy_territory += 1;", "out.las_outside_player_reach += 1;"),
    ("reason: all wrong", SRC, "scan.las_wrong_terrain_for_tartak >= scan.las_in_player_territory", "scan.las_wrong_terrain_for_tartak > scan.las_in_player_territory"),
    ("format: las", SRC, "if impact.removes_forest {", "if false {"),
    ("hint: bydlo", SRC, "if key == k::BYDLO {\n        return texts.podpowiedz_bydlo.clone();", "if false {\n        return texts.podpowiedz_bydlo.clone();"),
    ("remove: placed.remove", SRC, "placed.remove(&ch.hex_key);", "let _ = &ch.hex_key;"),
    # tabele JSON
    ("tab: pierscien 1->0", TAB, '"pierscien_kandydatow": 1', '"pierscien_kandydatow": 0'),
    ("tab: kamieniolom sektor", TAB, '"kamieniolom": "kamien"', '"kamieniolom": "surowiec"'),
    ("tab: las zablokowane bez owce", TAB, '"zablokowane": ["irygacja", "tarasy", "farma", "bydlo", "owce"]', '"zablokowane": ["irygacja", "tarasy", "farma", "bydlo"]'),
    ("tab: ladu bez pustyni", TAB, '"ladu": ["laka", "rownina", "wzgorza", "gory", "pustynia"]', '"ladu": ["laka", "rownina", "wzgorza", "gory"]'),
    ("tab: koszt koni", TAB, '"stadnina_koszt_koni": 50', '"stadnina_koszt_koni": 51'),
    ("tab: praca domyslna", TAB, '"praca_bez_wpisu": 20', '"praca_bez_wpisu": 21'),
    ("tab: posterunek tech", TAB, '"posterunek": ["Obróbka drewna", "Murarstwo"]', '"posterunek": ["Obróbka drewna"]'),
    ("tab: nowy swiat epoka", TAB, '"nowy_swiat_min_epoka_hodowli": 3', '"nowy_swiat_min_epoka_hodowli": 2'),
]


def run_tests():
    env = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_PROFILE_DEV_DEBUG="0", CARGO_TARGET_DIR=TARGET)
    r = subprocess.run(
        ["cargo", "test", "--no-fail-fast", "--test", "p6_m16_rules", "--test", "p6_m16_qualifier",
         "--test", "p6_m16_gallery", "--test", "p6_m16_tables"],
        cwd=ENGINE, env=env, capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr


survived = []
detected = 0
skipped = 0
START = os.environ.get("START_AT", "")  # nazwa pierwszej mutacji do uruchomienia (wznowienie po przerwaniu)
started = START == ""
for name, path, old, new in M:
    if not started:
        if name == START:
            started = True
        else:
            continue
    if FILTER and FILTER not in name:
        continue
    text = open(path, encoding="utf8").read()
    n = text.count(old)
    if n != 1:
        print(f"MUTANT {name}: POMINIETY (fragment wystepuje {n}x)", flush=True)
        skipped += 1
        continue
    open(path, "w", encoding="utf8").write(text.replace(old, new))
    try:
        code, out = run_tests()
    finally:
        open(path, "w", encoding="utf8").write(text)
    if code != 0:
        why = "blad kompilacji" if "could not compile" in out else "test czerwony"
        print(f"MUTANT {name}: WYKRYTY ({why})", flush=True)
        detected += 1
    else:
        print(f"MUTANT {name}: PRZEZYL", flush=True)
        survived.append(name)
print(f"PODSUMOWANIE: wykrytych={detected} przezylo={len(survived)} pominietych={skipped}")
for name in survived:
    print("PRZEZYL:", name)
