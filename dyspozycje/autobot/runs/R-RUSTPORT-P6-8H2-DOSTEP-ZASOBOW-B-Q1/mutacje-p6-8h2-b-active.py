#!/usr/bin/env python3
"""Mutacje gałęzi sterujących `rust-port/engine/src/domain/resource_access/active_access.rs`
(P6.8H2 partia B, runda 3). Każdy mutant: dokładnie jedno wystąpienie `old` -> `new`,
uruchomienie `cargo test --test p6_8h2_active_access`, przywrócenie pliku.

Ścieżki względne do korzenia repo (położenie skryptu: dyspozycje/autobot/runs/<ID>/).
Uzycie: mutacje-p6-8h2-b-active.py [--from N] [--to M]   (numeracja od 1)
Wynik: wiersz na mutanta na stdout i w `mutacje-wyniki-r3-active.txt` (obok skryptu).
"""
import os
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]  # runs/<ID> -> autobot -> dyspozycje -> korzen repo
SRC = ROOT / "rust-port/engine/src/domain/resource_access/active_access.rs"
RESULTS = HERE / "mutacje-wyniki-r3-active.txt"

# (id, opis, stary fragment, nowy fragment)
MUTANTS = [
    ("M01", "label_for_hex: guard widoczności złoża -> pominięty",
     "if !deposit_visible(hex, era) {\n            return None;\n        }\n        return Some(zloze_name_or_capitalized",
     "if false {\n            return None;\n        }\n        return Some(zloze_name_or_capitalized"),
    ("M02", "label_for_hex: nakładka ZlozeRudy -> None",
     "Overlay::ZlozeRudy => Some(\"Ruda\".to_owned()),",
     "Overlay::ZlozeRudy => None,"),
    ("M03", "hex_hidden_deposit_hint: guard `deposit_visible` -> pominięty",
     "if deposit_visible(hex, era) {\n        return None;\n    }\n    let name",
     "if false {\n        return None;\n    }\n    let name"),
    ("M04", "improvement_unlock_active_on_hex: NO_DEPOSIT -> false",
     "if NO_DEPOSIT_IMPROVEMENTS.contains(&norm) {\n        return true;",
     "if NO_DEPOSIT_IMPROVEMENTS.contains(&norm) {\n        return false;"),
    ("M05", "improvement_unlock_active_on_hex: LIVESTOCK_NO_DEPOSIT -> false",
     "if LIVESTOCK_NO_DEPOSIT.contains(&norm) {\n        return true;",
     "if LIVESTOCK_NO_DEPOSIT.contains(&norm) {\n        return false;"),
    ("M06", "warzelnia_soli: `||` -> `&&`",
     "return hex.terrain == TerrainType::PlytkieMorze || hex.zloze.as_deref() == Some(\"sol\");",
     "return hex.terrain == TerrainType::PlytkieMorze && hex.zloze.as_deref() == Some(\"sol\");"),
    ("M07", "improvement_unlock_active_on_hex: DEPOSIT_LINKED -> pominięte (zawsze true)",
     "if DEPOSIT_LINKED_IMPROVEMENTS.contains(&norm) {\n        return deposit_allows_player_improvement(norm, hex);\n    }",
     "if false {\n        return deposit_allows_player_improvement(norm, hex);\n    }"),
    ("M08", "labels_for_kopalnia_miedzi_on_hex: `||` -> `&&`",
     "if z.as_deref() == Some(\"miedz\") || hex.overlay == Overlay::ZlozeRudy {",
     "if z.as_deref() == Some(\"miedz\") && hex.overlay == Overlay::ZlozeRudy {"),
    ("M09", "active_labels: LIVESTOCK_NOT_RESOURCE -> pominięte",
     "if LIVESTOCK_NOT_RESOURCE.contains(&norm.as_str()) {\n        return Vec::new();",
     "if false {\n        return Vec::new();"),
    ("M10", "collect_active_access: bramka `sight > 0` -> zawsze",
     "if let Some(placed) = placed {\n        if sight > 0.0 {",
     "if let Some(placed) = placed {\n        if true {"),
    ("M11", "collect_active_access: dystans `> sight` -> `>=`",
     "if axial_distance(city.q, city.r, hex.q, hex.r) > sight {\n                    continue;\n                }\n                for key in keys_normalized_only",
     "if axial_distance(city.q, city.r, hex.q, hex.r) >= sight {\n                    continue;\n                }\n                for key in keys_normalized_only"),
    ("M12", "collect_deposit_potential: dystans `> sight` -> `>=`",
     "if axial_distance(city.q, city.r, hex.q, hex.r) > sight {\n            continue;\n        }\n        if let Some(label) = label_for_hex",
     "if axial_distance(city.q, city.r, hex.q, hex.r) >= sight {\n            continue;\n        }\n        if let Some(label) = label_for_hex"),
    ("M13", "collect_deposit_potential: bramka `sight <= 0` -> pominięta",
     "if sight <= 0.0 {\n        return found;\n    }\n    for key in hex_keys_within_radius",
     "if false {\n        return found;\n    }\n    for key in hex_keys_within_radius"),
    ("M14", "collect_active_access: gałąź livestock `kon` -> pominięta",
     "if unlocks.contains(\"kon\") {",
     "if false {"),
    ("M15", "collect_active_access: gałąź Brąz (has_braz_access) -> false",
     "if has_braz_access(EmpireStockArg::Stock(stock), options.built_ids) {",
     "if false {"),
    ("M16", "collect_active_access: gałąź Złoto (owner_has_zloto_stock) -> false",
     "if owner_has_zloto_stock(options.empire_stock) {",
     "if false {"),
    ("M17", "get_city_resource_access: wykluczenie aktywnych z potencjału -> brak",
     ".filter(|label| !active_set.contains(*label))",
     ".filter(|label| true)"),
    ("M18", "parse_surowiec: gałąź `starts_with('[')` -> pominięta",
     "if trimmed.starts_with('[') {",
     "if false {"),
    ("M19", "parse_surowiec: gałąź pustego napisu -> pominięta",
     "SurowiecRaw::One(\"\") => Vec::new(),",
     "SurowiecRaw::One(\"\") if false => Vec::new(),"),
    ("M20", "parse_surowiec: lista -> zwraca pustą",
     "SurowiecRaw::List(list) => list.to_vec(),",
     "SurowiecRaw::List(_list) => Vec::new(),"),
    ("M21", "labels_for_improvement_unlock: filtr pustych etykiet -> brak",
     "        .filter(|label| !label.is_empty())",
     "        .filter(|_label| true)"),
    ("M22", "labels_for_improvement_unlock: filtr pustego klucza -> brak",
     "let Some(key) = improvement_key.filter(|k| !k.is_empty()) else {",
     "let Some(key) = improvement_key else {"),
    ("M23", "pl_collation_cmp: poziom wielkości liter -> pominięty",
     "    match cases(a).cmp(&cases(b)) {",
     "    match std::cmp::Ordering::Equal {"),
    ("M24", "era_ui_name: wpis 2 (Brąz) -> None",
     "2 => Some(\"Brąz\"),",
     "2 => None,"),
    ("M26", "collect_active_access: gałąź `if let Some(placed)` -> nigdy",
     "if let Some(placed) = placed {\n        if sight > 0.0 {",
     "if let Some(placed) = None::<&PlacedMap<'_>> {\n        if sight > 0.0 {"),
    ("M27", "warzelnia_soli: operand `zloze == sol` -> false",
     "return hex.terrain == TerrainType::PlytkieMorze || hex.zloze.as_deref() == Some(\"sol\");",
     "return hex.terrain == TerrainType::PlytkieMorze || false;"),
    ("M28", "improvement_unlock_active_on_hex: brak normalizacji -> true",
     "let Some(norm) = normalize_improvement_key(Some(improvement_key)) else {\n        return false;",
     "let Some(norm) = normalize_improvement_key(Some(improvement_key)) else {\n        return true;"),
    ("M29", "collect_active_access: klucz spoza mapy -> `return` zamiast `continue`",
     "                let Some(hex) = map.hex(hex_key) else {\n                    continue;\n                };",
     "                let Some(hex) = map.hex(hex_key) else {\n                    return found;\n                };"),
    ("M25", "collect_active_access: domyślna kultura `unwrap_or(0.0)` -> 1.0",
     "    let sight = city_sight_radius(city.population, city.kultura.unwrap_or(0.0), border_radius);\n    let mut found = BTreeSet::new();\n\n    if let Some(placed)",
     "    let sight = city_sight_radius(city.population, city.kultura.unwrap_or(1.0), border_radius);\n    let mut found = BTreeSet::new();\n\n    if let Some(placed)"),
]


def run_test() -> int:
    env = dict(os.environ)
    env.setdefault("CARGO_TARGET_DIR", "/dev/shm/p6-8h2-b")
    env.update({"CARGO_INCREMENTAL": "0", "CARGO_PROFILE_DEV_DEBUG": "0",
                "CARGO_PROFILE_TEST_DEBUG": "0"})
    proc = subprocess.run(
        ["cargo", "test", "--test", "p6_8h2_active_access", "-q"],
        cwd=ROOT / "rust-port/engine", env=env,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )
    return proc.returncode


def main() -> int:
    args = sys.argv[1:]
    lo, hi = 1, len(MUTANTS)
    if "--from" in args:
        lo = int(args[args.index("--from") + 1])
    if "--to" in args:
        hi = int(args[args.index("--to") + 1])
    only = set()
    if "--only" in args:
        only = set(args[args.index("--only") + 1].split(","))
    original = SRC.read_text(encoding="utf-8")
    # Bazowy test musi przejsc przed mutacjami.
    base_rc = run_test()
    line = f"BASE rc={base_rc} ({'OK' if base_rc == 0 else 'FAIL'})"
    print(line)
    with RESULTS.open("a", encoding="utf-8") as log:
        log.write(line + "\n")
        if base_rc != 0:
            return 2
        try:
            for idx, (mid, desc, old, new) in enumerate(MUTANTS, start=1):
                if not (lo <= idx <= hi):
                    continue
                if only and mid not in only:
                    continue
                count = original.count(old)
                if count != 1:
                    result = f"{mid} NIE_ZASTOSOWANO (wystapien={count}) {desc}"
                else:
                    SRC.write_text(original.replace(old, new, 1), encoding="utf-8")
                    rc = run_test()
                    result = f"{mid} {'KILLED' if rc != 0 else 'SURVIVED'} rc={rc} {desc}"
                print(result)
                log.write(result + "\n")
                log.flush()
        finally:
            SRC.write_text(original, encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
