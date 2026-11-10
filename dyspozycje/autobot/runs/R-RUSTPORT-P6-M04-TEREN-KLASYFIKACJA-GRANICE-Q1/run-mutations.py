#!/usr/bin/env python3
"""Testy negatywne (mutacje) P6.M04: kazda mutacja zmienia JEDEN fragment kodu/tabeli silnika,
uruchamia testy p6_m04_* i oczekuje CZERWONYCH testow. Plik jest po kazdej mutacji przywracany
z kopii w pamieci (a na koncu weryfikowany bajt w bajt).

Uzycie (z rust-port/engine, z ustawionym CARGO_TARGET_DIR / CARGO_INCREMENTAL=0):
  python3 ../../dyspozycje/autobot/runs/R-RUSTPORT-P6-M04-TEREN-KLASYFIKACJA-GRANICE-Q1/run-mutations.py [--dry] [id ...]
--dry: tylko sprawdza, czy kazdy fragment pasuje (bez kompilacji).
"""
import re
import subprocess
import sys

LIB = "src/domain/mapgen/terrain_class.rs"
TBL = "data/derived/mapgen-terrain-class.json"
TESTS = [
    "--test", "p6_m04_classify", "--test", "p6_m04_reapply", "--test", "p6_m04_border",
    "--test", "p6_m04_tables",
]

# (id, plik, stary fragment, nowy fragment, ktore wystapienie (1-based) albo 0 = wymagane jedyne)
MUTATIONS = [
    ("hash-shift13", LIB, ">> 13)", ">> 12)", 0),
    ("hash-shift16", LIB, ">> 16) as i32) as u32) as f64", ">> 15) as i32) as u32) as f64", 0),
    ("hash-const-a", LIB, "a * 374_761_393.0", "a * 374_761_394.0", 0),
    ("hash-imul-const", LIB, "wrapping_mul(1_274_126_177)", "wrapping_mul(1_274_126_179)", 0),
    ("cell-bias-offset", LIB, "(hash_int3(cx, cy, seed) - 0.5) * 2.0", "(hash_int3(cx, cy, seed) - 0.25) * 2.0", 0),
    ("cell-bias-floor-to-trunc", LIB, "let cx = (q / cell_size).floor();", "let cx = (q / cell_size).trunc();", 0),
    ("jitter-center", LIB, "((for_noise + des_noise) * 0.5 - 0.5)", "((for_noise + des_noise) * 0.5 - 0.25)", 0),
    ("jitter-uses-global-only", LIB, "global + local", "global", 0),
    ("gates-low-le-to-lt", LIB, "if mtn_th <= g.prog_niski_mtn_max_wlacznie.wartosc {", "if mtn_th < g.prog_niski_mtn_max_wlacznie.wartosc {", 0),
    ("gates-high-ge-to-gt", LIB, "if mtn_th >= g.prog_wysoki_mtn_min_wlacznie.wartosc {", "if mtn_th > g.prog_wysoki_mtn_min_wlacznie.wartosc {", 0),
    ("classify-sea-lt-to-le", LIB, "if elev_continental < c.elev_ponizej_ktorego_woda_lub_laka.wartosc {\n        // Ocean", "if elev_continental <= c.elev_ponizej_ktorego_woda_lub_laka.wartosc {\n        // Ocean", 0),
    ("classify-landmask-lt-to-le", LIB, "if land_mask < c.landmask_ponizej_ktorego_morze.wartosc {", "if land_mask <= c.landmask_ponizej_ktorego_morze.wartosc {", 0),
    ("classify-highland-gt-to-ge", LIB, "let is_highlands = mtn_noise > hi_th", "let is_highlands = mtn_noise >= hi_th", 0),
    ("classify-mountain-elev-gt-to-ge", LIB, "if is_mountain && elev_continental > elev_g.mountain {", "if is_mountain && elev_continental >= elev_g.mountain {", 0),
    ("classify-highland-elev-gt-to-ge", LIB, "} else if is_highlands && elev_continental > elev_g.highland {", "} else if is_highlands && elev_continental >= elev_g.highland {", 0),
    ("classify-desert-lo-gt-to-ge", LIB, "&& elev_continental > c.pustynia_elev_wiekszy_niz.wartosc", "&& elev_continental >= c.pustynia_elev_wiekszy_niz.wartosc", 1),
    ("classify-no-climate-gate", LIB, "crate::domain::mapgen::prims::can_assign_climate_desert(climate_band)\n            && des_noise > des_th\n            && elev_continental > c.pustynia_elev_wiekszy_niz.wartosc\n            && elev_continental < c.pustynia_elev_mniejszy_niz.wartosc\n        {\n            teren_bazowy = Terrain::Desert;\n        } else if elev_continental", "true\n            && des_noise > des_th\n            && elev_continental > c.pustynia_elev_wiekszy_niz.wartosc\n            && elev_continental < c.pustynia_elev_mniejszy_niz.wartosc\n        {\n            teren_bazowy = Terrain::Desert;\n        } else if elev_continental", 1),
    ("classify-plains-gt-to-ge", LIB, "> c.rownina_prog_sumy.wartosc\n        {\n            teren_bazowy = Terrain::Plains;\n        } else {\n            teren_bazowy = Terrain::Grassland;\n        }\n    }", ">= c.rownina_prog_sumy.wartosc\n        {\n            teren_bazowy = Terrain::Plains;\n        } else {\n            teren_bazowy = Terrain::Grassland;\n        }\n    }", 1),
    ("flat-low-elev-to-sea", LIB, "if elev_continental < c.elev_ponizej_ktorego_woda_lub_laka.wartosc {\n        teren_bazowy = Terrain::Grassland;", "if elev_continental < c.elev_ponizej_ktorego_woda_lub_laka.wartosc {\n        teren_bazowy = Terrain::Sea;", 0),
    ("flat-desert-threshold-ignored", LIB, "    let des_th = thresholds\n        .and_then(|t| t.desert)\n        .unwrap_or(c.prog_pustyni_domyslny.wartosc);\n    let teren_bazowy;\n\n    if elev_continental < c.elev_ponizej_ktorego_woda_lub_laka.wartosc {\n        teren_bazowy = Terrain::Grassland;", "    let des_th = c.prog_pustyni_domyslny.wartosc;\n    let teren_bazowy;\n\n    if elev_continental < c.elev_ponizej_ktorego_woda_lub_laka.wartosc {\n        teren_bazowy = Terrain::Grassland;", 0),
    ("forest-cap-ceil-to-floor", LIB, "(len * hooks.forest_overlay_cap_frac()).ceil()", "(len * hooks.forest_overlay_cap_frac()).floor()", 0),
    ("forest-no-zone-mul", LIB, "js_round(len * share * zone_share_mul)", "js_round(len * share)", 0),
    ("forest-sort-ascending", LIB, "js_array_sort_by(&mut eligible, |a, b| b.n - a.n);", "js_array_sort_by(&mut eligible, |a, b| a.n - b.n);", 0),
    ("forest-keep-old-forest", LIB, "if hex.overlay == Nakladka::Las {\n            hex.overlay = Nakladka::Brak;\n        }\n    }\n\n    let mut assigned", "if false {\n            hex.overlay = Nakladka::Brak;\n        }\n    }\n\n    let mut assigned", 0),
    ("forest-pangea-min", LIB, "let min_forest = if typ == WorldType::Pangea {", "let min_forest = if typ == WorldType::Islands {", 0),
    ("forest-mid-index", LIB, "let mid = land[land.len() / 2];", "let mid = land[(land.len() - 1) / 2];", 0),
    ("forest-height-zero-truthy", LIB, "    let forest = &mapgen_terrain_class().nakladka_lasu;\n    let map_height = map_height.filter(|h| *h != 0);", "    let forest = &mapgen_terrain_class().nakladka_lasu;", 0),
    ("forest-min-land-lt-to-le", LIB, "if (land.len() as f64) < min_land {", "if (land.len() as f64) <= min_land {", 0),
    ("forest-ignores-desert-band", LIB, "&& !map_height.is_some_and(|mh| {\n                                climate_band_at(r, mh, false) == ClimateBand::Desert\n                            })", "", 0),
    ("land-sea-to-grass-removed", LIB, "hex.terrain = if full.teren_bazowy == Terrain::Sea {\n                Terrain::Grassland\n            } else {\n                full.teren_bazowy\n            };", "hex.terrain = full.teren_bazowy;", 0),
    ("land-budget-floor-to-ceil", LIB, "let budget = (land_count * budget_frac).floor();", "let budget = (land_count * budget_frac).ceil();", 0),
    ("land-sort-ascending", LIB, "js_array_sort_by(&mut relief_candidates, |a, b| b.n - a.n);", "js_array_sort_by(&mut relief_candidates, |a, b| a.n - b.n);", 0),
    ("land-count-not-counted", LIB, "land_count += 1.0;", "land_count += 0.0;", 0),
    ("land-height-zero-truthy", LIB, "    let map_height = map_height.filter(|h| *h != 0);\n    let mut relief_candidates", "    let mut relief_candidates", 0),
    ("land-flat-restore-skipped", LIB, "hex.terrain = flat.teren_bazowy;", "hex.terrain = full.teren_bazowy;", 0),
    ("fractions-highland-tier", LIB, "highland: t.docelowy_udzial_wzgorz.low.wartosc,", "highland: t.docelowy_udzial_wzgorz.medium.wartosc,", 0),
    ("cap-le-to-lt", LIB, "if d <= map_margin_land_zone_hexes() {\n        return Some(", "if d < map_margin_land_zone_hexes() {\n        return Some(", 0),
    ("cap-d-minus-1", LIB, "* (d - 1.0),", "* d,", 0),
    ("radial-sign", LIB, "1.0 - js_pow(", "1.0 + js_pow(", 0),
    ("radial-min-removed", LIB, "js_max(\n        c.minimum_biasu_radialnego.wartosc,\n        1.0 - js_pow(", "js_min(\n        c.minimum_biasu_radialnego.wartosc,\n        1.0 - js_pow(", 0),
    ("edge-fade-margin-clamp", LIB, "js_max(margin_q, min_margin)", "margin_q", 0),
    ("border-dist-height", LIB, "height - 1.0 - r", "height - r", 0),
    ("in-border-lt-to-le", LIB, "hex_border_distance(q, r, width, height) < b\n}", "hex_border_distance(q, r, width, height) <= b\n}", 0),
    ("find-land-skips-shallow", LIB, "Some(hex) if hex.terrain != Terrain::Sea => bad.push(key),", "Some(hex) if !is_water_terrain_local(hex.terrain) => bad.push(key),", 0),
    ("enforce-skips-shallow", LIB, "if hex.terrain == Terrain::Sea {\n                continue;\n            }\n            set_hex_to_morze(hex);", "if is_water_terrain_local(hex.terrain) {\n                continue;\n            }\n            set_hex_to_morze(hex);", 0),
    ("count-border-le", LIB, "is_in_map_border(q as f64, r as f64, width as f64, height as f64, Some(b)) {\n                n += 1;", "hex_border_distance(q as f64, r as f64, width as f64, height as f64) <= b {\n                n += 1;", 0),
    ("margin-tie-direction", LIB, "return sb - sa;", "return sa - sb;", 0),
    ("margin-neighbors-ge-to-gt", LIB, ">= params.max_sasiadow_ladu_przy_dosypywaniu.wartosc", "> params.max_sasiadow_ladu_przy_dosypywaniu.wartosc", 0),
    ("margin-target-floor", LIB, "let target_land = js_round(ring.len() as f64 * cap);", "let target_land = (ring.len() as f64 * cap).floor();", 0),
    ("margin-erosion-le-to-lt", LIB, "if (land as f64) <= target_land {\n                    break;", "if (land as f64) < target_land {\n                    break;", 0),
    ("margin-fill-ge-to-gt", LIB, "if (land as f64) >= target_land {\n                    break;", "if (land as f64) > target_land {\n                    break;", 0),
    ("scatter-mask", LIB, "& 0xffff;\n    base +", "& 0xfffe;\n    base +", 0),
    ("lat-buffer-ge-to-gt", LIB, "r < buf || r >= i64::from(height) - buf", "r < buf || r > i64::from(height) - buf", 0),
    ("morze-keeps-river", LIB, "hex.river_present = false;\n    hex.river_edges.clear();", "hex.river_edges.clear();", 0),
    ("morze-keeps-edges", LIB, "hex.river_present = false;\n    hex.river_edges.clear();", "hex.river_present = false;", 0),
    ("morze-keeps-deposit", LIB, "hex.river_edges.clear();\n    hex.has_deposit = false;", "hex.river_edges.clear();", 0),
    ("laka-keeps-deposit", LIB, "hex.terrain = Terrain::Grassland;\n    hex.overlay = Nakladka::Brak;\n    hex.has_deposit = false;", "hex.terrain = Terrain::Grassland;\n    hex.overlay = Nakladka::Brak;", 0),
    ("laka-clears-river", LIB, "hex.terrain = Terrain::Grassland;\n    hex.overlay = Nakladka::Brak;\n    hex.has_deposit = false;", "hex.terrain = Terrain::Grassland;\n    hex.overlay = Nakladka::Brak;\n    hex.river_present = false;\n    hex.has_deposit = false;", 0),
    # RUNDA 2 (zarzut 3): mutacja uznana w r1 za rownowazna - zabijana WEKTORAMI ukierunkowanymi
    # (`reapplyForestTie`: max == 1 + remisy FP + skladowe bez wody; web z ta mutacja daje inny wynik).
    ("forest-inland-gt-to-ge", LIB, "let inland_boost = if max_sea_in_part > 1.0 {", "let inland_boost = if max_sea_in_part >= 1.0 {", 0),
    # RUNDA 2 (zarzut 4): `parseHexKey` / `Number(string)` na kluczach brzegowych z weba
    ("parse-key-old-simplified", LIB, "        Some(s) => js_string_to_number(s),", "        Some(s) => {\n            let t = s.trim();\n            if t.is_empty() {\n                0.0\n            } else {\n                t.parse::<f64>().unwrap_or(f64::NAN)\n            }\n        }", 0),
    ("parse-key-missing-second-zero", LIB, "        None => f64::NAN,\n        Some(s) => js_string_to_number(s),", "        None => 0.0,\n        Some(s) => js_string_to_number(s),", 0),
    ("parse-ws-rust-set", LIB, "let s = raw.trim_matches(is_js_whitespace);", "let s = raw.trim_matches(char::is_whitespace);", 0),
    ("parse-ws-no-feff", LIB, "                | '\\u{3000}'\n                | '\\u{feff}'\n", "                | '\\u{3000}'\n", 0),
    ("parse-ws-no-en-quad-range", LIB, "let en_quad_to_hair_space = ('\\u{2000}'..='\\u{200a}').contains(&c);", "let en_quad_to_hair_space = false;", 0),
    ("parse-hex-prefix-removed", LIB, "        (\"0x\", 16),\n        (\"0X\", 16),\n", "        (\"0X\", 16),\n", 0),
    ("parse-binary-prefix-removed", LIB, "        (\"0b\", 2),\n        (\"0B\", 2),\n", "        (\"0B\", 2),\n", 0),
    ("parse-radix-empty-digits-ok", LIB, "if digits.is_empty() || !digits.chars().all(|c| c.is_digit(radix)) {", "if !digits.chars().all(|c| c.is_digit(radix)) {", 0),
    ("parse-radix-rounding-no-sticky", LIB, "if rem > half || (rem == half && (sticky || mantissa & 1 == 1)) {", "if rem > half || (rem == half && mantissa & 1 == 1) {", 0),
    ("parse-radix-rounding-truncate", LIB, "if rem > half || (rem == half && (sticky || mantissa & 1 == 1)) {", "if false {", 0),
    ("parse-infinity-case-insensitive", LIB, "if body == \"Infinity\" {", "if body.eq_ignore_ascii_case(\"infinity\") {", 0),
    # `parse-exponent-without-digits-ok` (usuniecie sprawdzenia `i == exp_start`) przezyla w r2 i jest ROWNOWAZNA
    # (patrz EQUIVALENT ponizej); zastapiona mutacja z realnym skutkiem (wielka litera wykladnika):
    ("parse-exponent-uppercase-rejected", LIB, "if i < bytes.len() && (bytes[i] == b'e' || bytes[i] == b'E') {", "if i < bytes.len() && bytes[i] == b'e' {", 0),
    ("parse-sign-dropped", LIB, "    let sign = if negative { -1.0 } else { 1.0 };", "    let sign = if negative { 1.0 } else { 1.0 };", 0),
    ("js-round-half", LIB, "if x - floor >= 0.5 { floor + 1.0 } else { floor };", "if x - floor > 0.5 { floor + 1.0 } else { floor };", 0),
    ("js-max-nan", LIB, "fn js_max(a: f64, b: f64) -> f64 {\n    if a.is_nan() || b.is_nan() {\n        return f64::NAN;\n    }", "fn js_max(a: f64, b: f64) -> f64 {\n    if a.is_nan() {\n        return b;\n    }\n    if b.is_nan() {\n        return a;\n    }", 0),
    ("js-min-nan", LIB, "fn js_min(a: f64, b: f64) -> f64 {\n    if a.is_nan() || b.is_nan() {\n        return f64::NAN;\n    }", "fn js_min(a: f64, b: f64) -> f64 {\n    if a.is_nan() {\n        return b;\n    }\n    if b.is_nan() {\n        return a;\n    }", 0),
    ("table-prog-pustyni", TBL, None, None, "prog_pustyni_domyslny"),
    ("table-rownina-prog", TBL, None, None, "rownina_prog_sumy"),
    ("table-amp-komorkowa", TBL, None, None, "amplituda_komorkowa"),
    ("table-amp-globalna", TBL, None, None, "amplituda_globalna"),
    ("table-rozmiar-komorki", TBL, None, None, "rozmiar_komorki_hex"),
    ("table-budzet-medium", TBL, None, None, "budzet_medium"),
    ("table-mnoznik-umiarkowana", TBL, None, None, "mnoznik_strefy_umiarkowanej"),
    ("table-bonus-wnetrza", TBL, None, None, "bonus_wnetrza_ladu_max"),
    ("table-twardy-ocean", TBL, None, None, "twardy_ocean_hex"),
    ("table-waga-rozproszenia", TBL, None, None, "waga_rozproszenia_brzegu"),
    ("table-fade-limit", TBL, None, None, "limit_pelnego_ladu_w_fade"),
    ("table-min-bias", TBL, None, None, "minimum_biasu_radialnego"),
    ("table-niski-mountain", TBL, None, None, "niski_mountain"),
    ("table-max-sasiadow", TBL, None, None, "max_sasiadow_ladu_przy_dosypywaniu"),
    ("table-min-sufitu", TBL, None, None, "minimum_sufitu_komorki"),
    ("table-udzial-gor-high", TBL, None, None, "udzial_gor_high"),
]

NEW_VALUE = {
    "prog_pustyni_domyslny": "0.62",
    "rownina_prog_sumy": "0.36",
    "amplituda_komorkowa": "0.66",
    "amplituda_globalna": "0.13",
    "rozmiar_komorki_hex": "5",
    "mnoznik_strefy_umiarkowanej": "1.36",
    "bonus_wnetrza_ladu_max": "0.15",
    "twardy_ocean_hex": "3",
    "waga_rozproszenia_brzegu": "0.39",
    "limit_pelnego_ladu_w_fade": "0.46",
    "minimum_biasu_radialnego": "0.13",
    "max_sasiadow_ladu_przy_dosypywaniu": "4",
    "minimum_sufitu_komorki": "100",
}


def mutate_table(text, key):
    if key == "budzet_medium":
        pat = re.compile(r'("budzet_ulamek_ladu": \{.*?"medium": \{ "wartosc": )(-?[0-9.]+)', re.S)
        new = "0.26"
    elif key == "niski_mountain":
        pat = re.compile(r'("niski": \{\s*"mountain": \{ "wartosc": )(-?[0-9.]+)', re.S)
        new = "0.11"
    elif key == "udzial_gor_high":
        pat = re.compile(r'("docelowy_udzial_gor": \{.*?"high": \{ "wartosc": )(-?[0-9.]+)', re.S)
        new = "0.25"
    else:
        pat = re.compile(r'("' + re.escape(key) + r'": \{ "wartosc": )(-?[0-9.]+)')
        new = NEW_VALUE[key]
    m = pat.search(text)
    assert m, f"brak klucza {key}"
    return text[: m.start(2)] + new + text[m.end(2):]


# Mutacje ROWNOWAZNE (analiza; nie ma testu, ktory moglby je wykryc) - uzasadnienie tez w P6-M04 §6a.
# Sa jawnie WYLACZONE z listy MUTATIONS i drukowane w podsumowaniu (EQUIVALENT), zeby nie znikaly po cichu.
# Uwaga: `table-min-sufitu` w przebiegu r1 (wartosc 2 -> 3) tez byla rownowazna (petla `min(cap, len)` i
# `ceil(len * 0.95)` ograniczaja wynik niezaleznie od 2 vs 3); zastapiona wartoscia 100, ktora zmienia wynik.
# RUNDA 2: `forest-inland-gt-to-ge` USUNIETA z tej listy - nie jest rownowazna (zarzut 3 Evaluatora r1):
# `forNoise + 0.14` zwija sasiednie wartosci (remisy FP, np. 0 i 1e-20 => 0.14), a heksy ladu bez wpisu w polu
# odleglosci (`?? 0`) nie dostaja bonusu; web z ta mutacja daje inny wynik w 29/48 map z max == 1
# (`stats.forestTie` w wektorach). Zabijana testem `reapply_forest_overlay_targeted_inland_cases_match_web`.
EQUIVALENT = {
    "parse-exponent-without-digits-ok": "usuniecie sprawdzenia `i == exp_start` w `js_string_to_number` nic nie zmienia: gdy po `e`/`E` "
                                        "(i opcjonalnym znaku) nie ma cyfr, nastepujacy po nim `body.parse::<f64>()` ZAWSZE zwraca Err "
                                        "(std: wykladnik wymaga >= 1 cyfry; zmierzone dla '1e', '1e+', '1e-', '1.e', '.e1', '1E', '5e+', "
                                        "'0e', '.5e', '5.e+' w std-parse-exponent-proof.txt) => NaN, tak samo jak z wczesnym wyjsciem; "
                                        "sprawdzenie zostaje jako jawne odwzorowanie gramatyki ECMA-262 (obrona w glebi)",
    "land-restore-keeps-overlay": "po przywroceniu reliefu `hex.nakladka = Brak` jest redundantne: ten sam heks dostal "
                                  "`flatNak` w petli pierwszego przebiegu, a `classifyTerrainFlat` ma `const nakladka: Nakladka = "
                                  "Nakladka.Brak;` (gen-helpers.ts:986, nigdy nie przypisywana ponownie) - dowod z kodu, nie z probek",
    "fade-cap-le-to-lt": "`cap <= 0 -> 0` vs `cap < 0`: `marginLandCapForBorderDistance` zwraca 0 (literal +0), `0.05 * (d - 1)` "
                         "dla d >= 2 (>= 0.05) albo null; dla cap == +0 galaz `Math.min(1, 0 / 0.45)` daje +0 (ten sam wzorzec "
                         "bitowy), cap < 0 / -0 / NaN jest nieosiagalne (NaN: oba warunki falszywe)",
}

args = [a for a in sys.argv[1:] if not a.startswith("--")]
DRY = "--dry" in sys.argv
if args:
    wanted = set(args)
    MUTATIONS = [m for m in MUTATIONS if m[0] in wanted]

orig = {p: open(p, encoding="utf-8").read() for p in (LIB, TBL)}


def build(mid, path, old, new, nth):
    text = orig[path]
    if old is None:
        mutated = mutate_table(text, nth)
    else:
        count = text.count(old)
        if nth == 0:
            assert count == 1, f"{mid}: fragment wystepuje {count}x"
            mutated = text.replace(old, new)
        else:
            assert count >= nth, f"{mid}: fragment wystepuje {count}x < {nth}"
            parts = text.split(old)
            mutated = old.join(parts[:nth]) + new + old.join(parts[nth:])
    assert mutated != text, f"{mid}: mutacja nic nie zmienia"
    return mutated


if DRY:
    for m in MUTATIONS:
        build(*m)
    print(f"DRY OK: {len(MUTATIONS)} mutacji pasuje")
    sys.exit(0)

import hashlib
import signal
import time

# SIGTERM/SIGINT => normalne wyjscie, zeby blok `finally` PRZYWROCIL pliki (w r2 przerwany przebieg
# zostawil zmutowany plik; odtworzono go dopiero po skrocie SHA-256 oryginalu - patrz §6).
signal.signal(signal.SIGTERM, lambda *_: sys.exit(143))
signal.signal(signal.SIGINT, lambda *_: sys.exit(130))


def disk_sha(path):
    """SHA-256 BAJTOW pliku z dysku (nie z kopii w pamieci)."""
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


# RUNDA 2 (zarzut 5): dowod przywrocenia PER PLIK I PER MUTACJA - skrot bajtow z dysku przed przebiegiem,
# po kazdej mutacji (po przywroceniu) i na koncu. Rozbieznosc => natychmiastowy blad (exit 3).
ORIG_SHA = {p: disk_sha(p) for p in (LIB, TBL)}
print("SHA256 poczatkowe: " + " ".join(f"{p}={h}" for p, h in ORIG_SHA.items()))
sys.stdout.flush()


def restore_and_check(mid):
    for p, t in orig.items():
        with open(p, "w", encoding="utf-8", newline="") as fh:
            fh.write(t)
    bad = [p for p in ORIG_SHA if disk_sha(p) != ORIG_SHA[p]]
    status = "PRZYWROCONO " + " ".join(f"{p}:sha256={disk_sha(p)[:16]}..={'OK' if p not in bad else 'ROZNI-SIE'}" for p in ORIG_SHA)
    print(f"   {mid}: {status}")
    if bad:
        print(f"BLAD KRYTYCZNY: plik(i) {bad} po mutacji {mid} nie sa identyczne bajt w bajt z oryginalem")
        sys.exit(3)


def run_tests():
    r = subprocess.run(["cargo", "test", "--no-fail-fast", *TESTS], capture_output=True, text=True)
    out = r.stdout + r.stderr
    failed = sorted(set(re.findall(r"^test (\S+) \.\.\. FAILED", out, re.M)))
    compile_err = "error[" in out or "could not compile" in out
    infra = "No space left on device" in out
    return out, failed, compile_err, infra


detected = 0
survived = []
infra_retries = []
try:
    for mid, path, old, new, nth in MUTATIONS:
        text = orig[path]
        mutated = build(mid, path, old, new, nth)
        with open(path, "w", encoding="utf-8", newline="") as fh:
            fh.write(mutated)
        out, failed, compile_err, infra = run_tests()
        attempts = 0
        while compile_err and infra and attempts < 8:
            # przyczyna INFRA (np. brak miejsca na dysku): to NIE jest wynik mutacji - czekaj i powtorz
            attempts += 1
            infra_retries.append(f"{mid}#{attempts}")
            print(f"INFRA     {mid}: " + " | ".join(l for l in out.splitlines() if "error" in l)[:200] + f" -> powtorzenie {attempts}/8 po 60 s")
            sys.stdout.flush()
            time.sleep(60)
            out, failed, compile_err, infra = run_tests()
        restore_and_check(mid)
        if compile_err:
            print(f"BLAD-KOMPILACJI {mid}: " + " | ".join(l for l in out.splitlines() if "error" in l)[:300])
            survived.append(mid + " (blad kompilacji)")
        elif failed:
            detected += 1
            print(f"WYKRYTA   {mid}: {len(failed)} testow FAILED: {', '.join(failed[:4])}")
        else:
            survived.append(mid)
            print(f"PRZEZYLA  {mid}: wszystkie testy zielone")
        sys.stdout.flush()
finally:
    for p, t in orig.items():
        with open(p, "w", encoding="utf-8", newline="") as fh:
            fh.write(t)
final_ok = all(disk_sha(p) == ORIG_SHA[p] for p in ORIG_SHA)
print("SHA256 koncowe:    " + " ".join(f"{p}={disk_sha(p)}" for p in ORIG_SHA))
print(f"ROWNOWAZNE (wylaczone z listy, patrz §6a): {sorted(EQUIVALENT)}")
print(f"POWTORZENIA Z POWODU INFRA: {infra_retries}")
print(f"PODSUMOWANIE: wykryte {detected}/{len(MUTATIONS)}, przezyly: {survived}, pliki przywrocone bajt w bajt (SHA-256 poczatek == koniec): {final_ok}")
sys.exit(0 if not survived and final_ok else 1)
