#!/usr/bin/env python3
"""R-RUSTPORT-P4-1E-CITY-VIEW-Q1: test mutacji producenta widoku miast.

Kazda mutacja zmienia JEDNO wyliczenie w `rust-port/engine/src/domain/city_view.rs`, uruchamia
`cargo test --test view_city_pin_vectors` i oczekuje FAIL (mutant zabity). Plik jest zawsze przywracany.
Wymaga CARGO_TARGET_DIR poza repo (uzywany z otoczenia).

Uzycie: python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P4-1E-CITY-VIEW-Q1/gen/mutacje.py
"""
import os
import subprocess
import sys

MUTATIONS = [
    ("defenseTier mur 2->1", "WallKind::Stone => 2,", "WallKind::Stone => 1,"),
    ("mur -> palisada", "CityFortificationKind::Mur => WallKind::Stone,", "CityFortificationKind::Mur => WallKind::Palisada,"),
    ("prodActive bez wstrzymania", "prod_active: front.is_some() && !paused,", "prod_active: front.is_some(),"),
    ("wzrost tez dla obcych", "let growth = if is_player_city { facts.growth } else { None };", "let growth = facts.growth;"),
    ("stolica miasta-panstwa", "let is_capital = !owner_view.is_city_state && owner.capital_city_id", "let is_capital = owner.capital_city_id"),
    ("poziom min 0", "level: population.clamp(1.0, 10.0),", "level: population.clamp(0.0, 10.0),"),
    ("sojusz z umowy pominiety", "        return MapOutlineKind::Ally;\n    }\n    MapOutlineKind::Neutral", "        return MapOutlineKind::Neutral;\n    }\n    MapOutlineKind::Neutral"),
    ("ringHex dla miasta-panstwa", "ring_hex: if is_barbarian || is_city_state {", "ring_hex: if is_barbarian {"),
    ("mgla: wlasne miasto ukryte", "            || city.owner_id == inputs.viewer\n", ""),
    ("ostrzezenie odwrocone", "resource_warning = !can_afford_building_stock(", "resource_warning = can_afford_building_stock("),
    ("pokoj -> neutralni", "RelationStatus::Peace => RelationToViewer::Pokoj,", "RelationStatus::Peace => RelationToViewer::Neutralni,"),
    ("stolica zapasowa = najmlodsze", "if best.is_none_or(|b| order < b) {", "if best.is_none_or(|b| order > b) {"),
    ("bunt: || -> &&", "revolt: facts.order_bunt || facts.order_revolt_warning,", "revolt: facts.order_bunt && facts.order_revolt_warning,"),
    ("brazowa cywilizacja slowian", "\"germanie\" | \"slowianie\" => \"germanie\",", "\"germanie\" => \"germanie\","),
    ("jednostki na heksie: !=", ".filter(|u| u.position == city.position)", ".filter(|u| u.position != city.position)"),
    ("etykieta bez widza", "player_owner_id: Some(owner_i64(inputs.viewer)),", "player_owner_id: None,"),
    ("miasto-panstwo: bez simplified", "simplified_owners: Some(&inputs.city_states.simplified_owners),", "simplified_owners: None,"),
    ("miasto-panstwo: bez typCopy", "typ_copy_owners: Some(&inputs.city_states.typ_copy_owners),", "typ_copy_owners: None,"),
    ("miasto-panstwo: bez startCityState miast", "cities: Some(city_refs),", "cities: None,"),
    ("kolor bez kolorHex", "return parse_hex_color(&row.kolor_hex);", "return OWNER_COLORS_FALLBACK[0];"),
    ("prodPaused zawsze false", "let paused = prod.is_some_and(|p| p.wstrzymana == Some(true));", "let paused = false;"),
    ("growthStarving odwrocone", "growth_starving: growth.is_some_and(|g| !g.nakarmione),", "growth_starving: growth.is_some_and(|g| g.nakarmione),"),
    ("oblezenie pominiete", "besieged: facts.besieged,", "besieged: false,"),
    ("brak koloru z kosztu pustego", "if !cost.is_empty() {", "if cost.is_empty() {"),
    ("epoka startu ignorowana", "game_start_era(&state.params.epoch_id),", "1.0,"),
    ("displayName pominiete", "display_name: civ_display_name(civs, civ_key),", "display_name: None,"),
    # Obrona r1 (mutanty Evaluatora r1, ktore przezyly przed dopisaniem scenariusza
    # `przeniesiona_stolica_obce_jednostki_paleta`):
    ("E4 jawna stolica pominieta (zawsze najstarsze)", ".find(|c| c.is_capital && c.owner_id == owner)", ".find(|c| false && c.is_capital && c.owner_id == owner)"),
    ("E14 jednostki na heksie tylko wlasciciela miasta", ".filter(|u| u.position == city.position)", ".filter(|u| u.position == city.position && u.owner_id == city.owner_id)"),
    ("E7 ringHex bez dopelnienia do 6 cyfr", 'format!("#{color:06x}")', 'format!("#{color:x}")'),
    ("E8 paleta zapasowa % 7", "let idx = usize::try_from(owner_id % 8).unwrap_or(0);", "let idx = usize::try_from(owner_id % 7).unwrap_or(0);"),
]


def main() -> int:
    here = os.path.dirname(os.path.abspath(__file__))
    repo = subprocess.run(["git", "rev-parse", "--show-toplevel"], cwd=here, check=True,
                          capture_output=True).stdout.decode().strip()
    engine = os.path.join(repo, "rust-port", "engine")
    path = os.path.join(engine, "src", "domain", "city_view.rs")
    with open(path, encoding="utf-8") as f:
        original = f.read()
    survived = []
    try:
        for name, old, new in MUTATIONS:
            count = original.count(old)
            if count != 1:
                print(f"BLAD MUTACJI {name!r}: wzorzec wystepuje {count} razy", file=sys.stderr)
                return 2
            with open(path, "w", encoding="utf-8") as f:
                f.write(original.replace(old, new))
            res = subprocess.run(["cargo", "test", "-q", "--test", "view_city_pin_vectors"],
                                 cwd=engine, capture_output=True)
            out = res.stdout.decode() + res.stderr.decode()
            if "error[" in out and res.returncode != 0 and "test result" not in out:
                verdict = "ZABITY (kompilacja)"
            elif res.returncode != 0:
                verdict = "ZABITY"
            else:
                verdict = "PRZEZYL"
                survived.append(name)
            print(f"{verdict:20} exit={res.returncode}  {name}")
    finally:
        with open(path, "w", encoding="utf-8") as f:
            f.write(original)
    print(f"mutantow: {len(MUTATIONS)}, zabitych: {len(MUTATIONS) - len(survived)}, przezylo: {len(survived)}")
    return 1 if survived else 0


if __name__ == "__main__":
    sys.exit(main())
