#!/usr/bin/env python3
"""Mutacje kodu/tabel P6.5B: kazda mutacja musi zostac WYKRYTA przez testy (exit != 0).

Uzycie: mutate-p65b.py <ENGINE_DIR> <CARGO_TARGET_DIR> <ID,ID,...|all|check>
Dla kazdej mutacji: zapisuje kopie pliku, podmienia DOKLADNIE jedno wystapienie, uruchamia wskazany
test, zapisuje wynik i PRZYWRACA plik (takze przy bledzie). Wynik: linie `MUTACJA id: WYKRYTA|NIEWYKRYTA`.
Tryb `check` tylko liczy wystapienia wzorcow (kazdy musi wystapic dokladnie raz).
"""
import os
import re
import subprocess
import sys
from pathlib import Path

ENGINE = Path(sys.argv[1])
TARGET = sys.argv[2]
WANT = sys.argv[3].split(",") if len(sys.argv) > 3 else ["all"]
RS = "src/domain/recruitment.rs"
CB = "src/domain/combat.rs"
MPJ = "data/derived/manpower-params.json"
UBJ = "data/derived/unit-building-bonuses.json"
LCJ = "data/derived/locale-compare-ascii.json"

MUTATIONS = [
    # --- manpower.ts
    ("M01-epoka-bez-gornej-klamry", RS, "let e = js_max(f64::from(bounds.min), js_min(f64::from(bounds.max), base));", "let e = js_max(f64::from(bounds.min), base);", "p6_5b_manpower"),
    ("M02-ludki-zero-nie-jest-1", RS, "        let floored = population.floor();\n        js_max(\n            min,\n            if floored == 0.0 || floored.is_nan() {", "        let floored = population.floor();\n        js_max(\n            min,\n            if floored.is_nan() {", "p6_5b_manpower"),
    ("M03-skalowanie-round", RS, "                max_mult,\n            ))\n        .floor()", "                max_mult,\n            ))\n        .round()", "p6_5b_manpower"),
    ("M04-zwiadowca-ma-koszt", RS, "        if is_scout_type_id(type_id) {\n            return 0.0;\n        }\n        unit_manpower_cost(epoka, max_mult)", "        unit_manpower_cost(epoka, max_mult)", "p6_5b_manpower"),
    ("M05-pula-bez-floor", RS, "Some(manpower) if manpower.is_finite() => js_max(0.0, js_min(max, manpower.floor())),", "Some(manpower) if manpower.is_finite() => js_max(0.0, js_min(max, manpower)),", "p6_5b_manpower"),
    ("M06-regen-blok-oblegane-false", RS, "if params.block_when_besieged && city.oblegane == Some(true) {", "if params.block_when_besieged && city.oblegane.is_some() {", "p6_5b_manpower"),
    ("M07-regen-round", RS, "(max * pct * js_max(0.0, regen_mult)).floor()", "(max * pct * js_max(0.0, regen_mult)).round()", "p6_5b_manpower"),
    ("M08-limit-leczenia-ceil", RS, "(max_hp * params.heal_pct_max_per_turn / manpower_params().maks_proc).floor()", "(max_hp * params.heal_pct_max_per_turn / manpower_params().maks_proc).ceil()", "p6_5b_manpower"),
    ("M09-koszt-leczenia-floor", RS, "js_min(unit_cost, ((heal_hp / max_hp) * unit_cost).ceil())", "js_min(unit_cost, ((heal_hp / max_hp) * unit_cost).floor())", "p6_5b_manpower"),
    ("M10-max-leczenie-ceil", RS, "js_min(desired_heal, (available_mp * max_hp / unit_cost).floor())", "js_min(desired_heal, (available_mp * max_hp / unit_cost).ceil())", "p6_5b_manpower"),
    ("M11-odejmij-remis-bez-id", RS, "            if cur_diff != 0.0 {\n                cur_diff\n            } else {\n                f64::from(locale_compare(&a.id, &b.id))\n            }", "            if cur_diff != 0.0 {\n                cur_diff\n            } else {\n                0.0\n            }", "p6_5b_manpower"),
    ("M12-odejmij-kierunek", RS, "let cur_diff = city_manpower_current(b, epoka, max_mult)\n                - city_manpower_current(a, epoka, max_mult);", "let cur_diff = city_manpower_current(a, epoka, max_mult)\n                - city_manpower_current(b, epoka, max_mult);", "p6_5b_manpower"),
    ("M13-zwrot-kierunek-miejsca", RS, "let room_diff = room_of(b) - room_of(a);", "let room_diff = room_of(a) - room_of(b);", "p6_5b_manpower"),
    ("M14-zwrot-bez-limitu-miejsca", RS, "let add = js_min(room, remaining);", "let add = room;", "p6_5b_manpower"),
    ("M15-locale-wielkie-przed-malymi", LCJ, '"male_przed_wielkimi": true', '"male_przed_wielkimi": false', "p6_5b_format"),
    ("M16-locale-kolejnosc-znakow", LCJ, '" _-,;:!?.', '" -_,;:!?.', "p6_5b_format"),
    ("M17-przydzial-round", RS, "(available_mp * candidate.desired_mp / total_desired_mp).floor()", "(available_mp * candidate.desired_mp / total_desired_mp).round()", "p6_5b_replenish"),
    ("M18-reszta-kierunek-luki", RS, "let gap_diff = (ideal_mp(cb) - cb.allocated_mp) - (ideal_mp(ca) - ca.allocated_mp);", "let gap_diff = (ideal_mp(ca) - ca.allocated_mp) - (ideal_mp(cb) - cb.allocated_mp);", "p6_5b_replenish"),
    ("M19-reszta-remis-id-odwrocony", RS, "f64::from(locale_compare(&ca.unit_id, &cb.unit_id))", "f64::from(locale_compare(&cb.unit_id, &ca.unit_id))", "p6_5b_replenish"),
    ("M20-oblezenie-bez-wlasciciela", RS, "city.owner_id == owner_id && city.oblegane == Some(true)", "city.oblegane == Some(true)", "p6_5b_manpower"),
    ("M21-hp-bez-klamry", RS, "Some(hp) if hp.is_finite() => js_max(0.0, js_min(max_hp, hp)),", "Some(hp) if hp.is_finite() => hp,", "p6_5b_replenish"),
    ("M22-hpmax-bez-uzupelnienia", RS, "                units[index].hp_max = Some(max_hp);\n", "", "p6_5b_replenish"),
    ("M23-cywilne-tylko-kategorie", RS, "table.kategorie.iter().any(|c| c == category) || table.typy.iter().any(|t| t == type_id)", "table.kategorie.iter().any(|c| c == category)", "p6_5b_manpower"),
    ("M24-callback-hpmax", RS, "callback(&units[unit].id, new_hp, max_hp);", "callback(&units[unit].id, new_hp, cur_hp);", "p6_5b_replenish"),
    ("M25-liczba-remis-parzysta", RS, ".filter(|c| c % 2 == 0)", ".filter(|c| c % 2 == 1)", "p6_5b_format"),
    ("M26-liczba-prog-wykladnika", RS, "let body = if k <= n && n <= 21 {", "let body = if k <= n && n <= 20 {", "p6_5b_format"),
    ("M27-format-prog-tys-calkowite", MPJ, '"prog_calkowite_tys": 100', '"prog_calkowite_tys": 10', "p6_5b_format"),
    ("M28-mnoznik-max-dolna-granica", MPJ, '"max_min": 0.1', '"max_min": 0.2', "p6_5b_manpower"),
    ("M29-domyslny-regen", MPJ, '"proc_max_na_ture": 2,', '"proc_max_na_ture": 3,', "p6_5b_manpower"),
    ("M30-tabela-epok-max", MPJ, '"max": 10,', '"max": 9,', "p6_5b_manpower"),
    ("M33-ludki-bez-dolnej-granicy", RS, "        js_max(\n            min,\n            if floored == 0.0 || floored.is_nan() {\n                min\n            } else {\n                floored\n            },\n        )\n", "        if floored == 0.0 || floored.is_nan() {\n            min\n        } else {\n            floored\n        }\n", "p6_5b_manpower"),
    ("M31-zwrot-limit-ludnosci", RS, "Some(cap) => js_min(cap, raw_pop),", "Some(cap) => cap,", "p6_5b_manpower"),
    ("M32-przyrost-puli-przy-wzroscie", RS, "return js_min(max, cur + (max - old_max));", "return js_min(max, cur);", "p6_5b_manpower"),
    # --- unit-building-bonuses.ts
    ("B01-trim-rust", CB, "text.trim_matches(is_js_whitespace)", "text.trim()", "p6_5b_bonuses"),
    ("B02-glebokosc-lancucha", CB, "if id.is_empty() || depth >= max_depth || visited_this_chain.contains(&id) {", "if id.is_empty() || depth > max_depth || visited_this_chain.contains(&id) {", "p6_5b_bonuses"),
    ("B03-bez-globalnego-licznika", CB, "if allowed.contains(id.as_str()) && !counted_global.contains(&id) {", "if allowed.contains(id.as_str()) {", "p6_5b_bonuses"),
    ("B04-ogniwa-spoza-sciezki", CB, "if allowed.contains(id.as_str()) && !counted_global.contains(&id) {", "if !counted_global.contains(&id) {", "p6_5b_bonuses"),
    ("B05-mnoznik-ujemny", CB, "Some(v) if v.is_finite() && v > 0.0 => v,\n            _ => 0.0,\n        }\n    }\n\n    /// Znaki obcinane", "Some(v) if v.is_finite() => v,\n            _ => 0.0,\n        }\n    }\n\n    /// Znaki obcinane", "p6_5b_bonuses"),
    ("B06-duplikat-id-pierwszy", CB, "by_id.insert(building.id.as_str(), building);", "by_id.entry(building.id.as_str()).or_insert(building);", "p6_5b_bonuses"),
    ("B07-prog-tercji-ceil", CB, "((max_pp * second) / tercje).floor(),", "((max_pp * second) / tercje).ceil(),", "p6_5b_bonuses"),
    ("B08-odznaka-granica-pierwsza", CB, "if pp <= bounds[0] {", "if pp < bounds[0] {", "p6_5b_bonuses"),
    ("B09-najlepszy-bez-max", CB, "pancerz_bonus_proc: js_max(unit_pancerz_bonus_proc(unit), city_armor),", "pancerz_bonus_proc: city_armor,", "p6_5b_bonuses"),
    ("B10-zmiana-i-zamiast-lub", CB, "let changed = armor_gained > 0.0 || soft_gained > 0.0;", "let changed = armor_gained > 0.0 && soft_gained > 0.0;", "p6_5b_bonuses"),
    ("B11-zapis-parametrow-pominiety", CB, "            unit.parametry_bonus_proc = Some(next.parametry_bonus_proc);\n", "", "p6_5b_bonuses"),
    ("B12-separator-wzmianki", CB, '("czesci", &parts.join(&labels.separator)),', '("czesci", &parts.join(", ")),', "p6_5b_bonuses"),
    ("B13-scalanie-bez-zasiegu", CB, "            *mods.ranged_atk_mut() += bonus.other;\n", "", "p6_5b_bonuses"),
    ("B14-prawda-bez-nan", CB, "x != 0.0 && !x.is_nan()", "x != 0.0", "p6_5b_bonuses"),
    ("B15-procent-podstawa", UBJ, '"podstawa_procentu": 100', '"podstawa_procentu": 10', "p6_5b_bonuses"),
    ("B16-etykieta-separator", UBJ, '"separator": " · "', '"separator": " | "', "p6_5b_bonuses"),
    ("B17-sciezka-bez-wielkiej-kuzni", UBJ, '"budynki": ["kuznia", "kuznia_zelaza", "wielka_kuznia"]', '"budynki": ["kuznia", "kuznia_zelaza"]', "p6_5b_bonuses"),
    ("B18-limit-lancucha-tabela", UBJ, '"max_glebokosc_lancucha": 32', '"max_glebokosc_lancucha": 31', "p6_5b_bonuses"),
    ("B19-proc-jednostki-nieskonczone", CB, "Some(v) if v.is_finite() && v > 0.0 => v,\n            _ => 0.0,\n        }\n    }\n\n    /// Web `unitPancerzBonusProc`", "Some(v) if v > 0.0 => v,\n            _ => 0.0,\n        }\n    }\n\n    /// Web `unitPancerzBonusProc`", "p6_5b_bonuses"),
    ("B21-cecha-zdrowie-na-atk", CB, "        fn health_mut(&mut self) -> &mut f64 {\n            &mut self.health\n        }", "        fn health_mut(&mut self) -> &mut f64 {\n            &mut self.atk\n        }", "p6_5b_bonuses"),
    ("B20-zamkniecie-5a-tercje", UBJ, '"liczba_tercji": 3', '"liczba_tercji": 4', "p6_5b_tables"),
]

# Grupy mutacji budowane jednym `cargo test --no-fail-fast`. Werdykt czlonka = wynik JEGO binarium, wiec
# grupa jest wazna tylko, gdy mutacja jednego czlonka NIE moze zmienic wyniku binarium drugiego (zarzut 6 r2,
# dowod statyczny: dowody/mutation-independence-r2.txt):
#  - mutacje B* (combat.rs / unit-building-bonuses.json) trafiaja WYLACZNIE binaria p6_5b_bonuses/p6_5b_tables;
#    binaria p6_5b_manpower/_replenish/_format nie importuja domain::combat, a recruitment.rs nie wola combat.rs,
#  - mutacje M* (recruitment.rs / manpower-params.json / locale-compare-ascii.json) nie trafiaja binarium
#    p6_5b_bonuses, bo combat::unit_building_bonuses uzywa z recruitment TYLKO `js_max` i `js_number_to_string`;
#    mutacje w `js_number_to_string` (M25, M26) wolno wiec uruchamiac wylacznie pojedynczo,
#  - grupa ma co najwyzej jedna mutacje B* i jedna M*; wiele mutacji M* (ten sam kod/dane, wspolne binaria
#    manpower/replenish/format) NIGDY w jednej grupie (r1 mialo takie grupy: M25+M21+M29, M26+M22, M27+M24 -
#    w r2 przeliczone pojedynczo).
# Powod grupowania: maszyna jest wspoldzielona (load ~12-20), pojedynczy build trwa kilka minut.
SKIP_DONE = {"M01", "M02", "M03", "M04", "M05"}  # wykonane w trybie pojedynczym (mutation-evidence-r1-part0.txt)
SINGLE_ONLY = {"M25", "M26"}
GROUPS = [
    ["B01", "M06"], ["B02", "M08"], ["B03", "M09"], ["B04", "M12"], ["B05", "M13"], ["B06", "M14"],
    ["B07", "M20"], ["B08", "M23"], ["B09", "M28"], ["B10", "M30"], ["B11", "M31"], ["B12", "M32"],
    ["B13", "M33"], ["B14", "M11"], ["B15"], ["B16", "M17"], ["B17", "M18"], ["B18", "M19"],
    ["B19", "M07"], ["B20", "M10"], ["B21"],
    ["M25"], ["M21"], ["M29"], ["M26"], ["M22"], ["M27"], ["M24"], ["M15"], ["M16"],
]
GROUPS = [[m for m in g if m != "M04x"] for g in GROUPS]
BY_PREFIX = {m[0].split("-")[0]: m for m in MUTATIONS}

env = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_TARGET_DIR=TARGET, CARGO_PROFILE_DEV_DEBUG="0", RUST_BACKTRACE="0")


def parse_binaries(text):
    """{binarium: 'ok'|'FAILED'} z wyjscia `cargo test --no-fail-fast`."""
    result, current = {}, None
    for line in text.splitlines():
        m = re.match(r"\s*Running tests/(\w+)\.rs", line)
        if m:
            current = m.group(1)
        m = re.match(r"test result: (ok|FAILED)", line)
        if m and current:
            result[current] = m.group(1)
            current = None
    return result


def run_group(ids):
    muts = [BY_PREFIX[i] for i in ids]
    tests = [m[4] for m in muts]
    assert len(set(tests)) == len(tests), f"grupa {ids}: binaria czlonkow musza byc rozne"
    assert sum(i.startswith("B") for i in ids) <= 1 and sum(i.startswith("M") for i in ids) <= 1, f"grupa {ids}: max 1 B i 1 M"
    assert len(ids) == 1 or not (set(ids) & SINGLE_ONLY), f"grupa {ids}: mutacje w js_number_to_string tylko pojedynczo"
    originals = {}
    texts = {}
    try:
        for mid, rel, old, new, test in muts:
            path = ENGINE / rel
            if rel not in originals:
                originals[rel] = path.read_text(encoding="utf-8")
                texts[rel] = originals[rel]
            if texts[rel].count(old) != 1:
                print(f"MUTACJA {mid}: BLAD (wzorzec wystepuje {texts[rel].count(old)}x)")
                return False
            texts[rel] = texts[rel].replace(old, new)
        for rel, text in texts.items():
            (ENGINE / rel).write_text(text, encoding="utf-8")
        cmd = ["cargo", "test", "--no-fail-fast"] + [x for t in tests for x in ("--test", t)]
        proc = subprocess.run(cmd, cwd=ENGINE, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        out = proc.stdout
        binaries = parse_binaries(out)
        ok = True
        for mid, rel, old, new, test in muts:
            verdict = binaries.get(test)
            failed_tests = [l for l in out.splitlines() if l.startswith("test ") and l.endswith("FAILED")]
            if verdict == "FAILED":
                label, exit_code = "WYKRYTA", 101
            elif verdict == "ok":
                label, exit_code = "NIEWYKRYTA", 0
                ok = False
            else:
                label, exit_code = "BLAD-BUDOWY", -1
                ok = False
            members = " + ".join(m[0].split("-")[0] for m in muts)
            print(f"MUTACJA {mid} ({rel}, test {test}): {label} (exit={exit_code}); grupa [{members}]; {'; '.join(l[5:-10] for l in failed_tests[:3])[:200]}", flush=True)
        return ok
    finally:
        for rel, text in originals.items():
            (ENGINE / rel).write_text(text, encoding="utf-8")


failed = False
if WANT == ["check"]:
    for mid, rel, old, new, test in MUTATIONS:
        count = (ENGINE / rel).read_text(encoding="utf-8").count(old)
        print(f"{mid}: {count}x", "" if count == 1 else "<<< BLAD")
        failed = failed or count != 1
    covered = {m for g in GROUPS for m in g} | SKIP_DONE
    missing = [m[0] for m in MUTATIONS if m[0].split("-")[0] not in covered and m[0].split("-")[0] != "M02"]
    print("niepokryte przez grupy:", missing)
    sys.exit(1 if failed or missing else 0)
if WANT == ["all"]:
    for g in GROUPS:
        if not run_group(g):
            failed = True
else:
    for g in GROUPS:
        if any(i in WANT for i in g):
            if not run_group(g):
                failed = True
sys.exit(1 if failed else 0)
