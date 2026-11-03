"""Mutacje R-RUSTPORT-P6-TRADE-INCOME-PIN-Q1. Uzycie (z korzenia worktree): python3 -I mutate-trade-pin.py <od> <do> <wynik.txt>
Kazda mutacja: zamiana dokladnie jednego fragmentu w pliku zrodlowym -> `cargo test --test p6_trade_pin --test trade` ->
KILLED (czerwone), SURVIVED (zielone), COMPILE (blad kompilacji, wylaczone z wyniku), BRAK-KOTWICY. Plik jest przywracany po kazdej mutacji."""
import os
import subprocess
import sys

ROOT = os.getcwd()
ENG = f"{ROOT}/rust-port/engine"
TRADE = f"{ENG}/src/domain/trade.rs"
INP = f"{ENG}/src/domain/turn_economy_inputs_trade.rs"
APPLY = f"{ENG}/src/domain/trade_flow_apply.rs"
T = TRADE

M = [
    # id, file, old, new, opis
    ("M01", T, "(before_half / TRADE_ROUTE_INCOME_HALF_DIVISOR).ceil()", "(before_half / TRADE_ROUTE_INCOME_HALF_DIVISOR).floor()", "ceil/2 -> floor/2"),
    ("M02", T, "        base * TRADE_ROUTE_INTERNATIONAL_MULTIPLIER\n    };", "        base\n    };", "brak x2 miedzy ownerami"),
    ("M03", T, "let before_half = if route.owner_id == route.to_owner_id {", "let before_half = if route.owner_id != route.to_owner_id {", "x2 odwrocone"),
    ("M04", T, "let idx = dystans.floor().min(hi).max(0.0);", "let idx = dystans.floor().max(0.0);", "brak obciecia indeksu krzywej"),
    ("M05", T, "TradeRouteMedium::Land => &params.dochody_ladowe,", "TradeRouteMedium::Land => &params.dochody_morskie,", "krzywe lad/morze zamienione"),
    ("M06", T, "(route_income * (1.0 + wonder)).floor()", "(route_income * (1.0 + wonder)).ceil()", "premia cudu ceil"),
    ("M07", T, "(after_wonder * (1.0 + targ)).floor()", "(after_wonder * (1.0 + targ)).ceil()", "premia Targowiska ceil"),
    ("M08", T, "if route.medium == TradeRouteMedium::Sea {\n            *out.maritime_by_city", "if route.medium != TradeRouteMedium::Sea {\n            *out.maritime_by_city", "podzbior morski odwrocony"),
    ("M09", T, "    if !route.is_connected() || !route.building_unlocked {\n        return 0.0;", "    if !route.is_connected() {\n        return 0.0;", "premia budynkowa bez budynku"),
    ("M10", T, "            count\n                .checked_sub(1)", "            count\n                .checked_sub(0)", "bonus Portu od pierwszej trasy"),
    ("M11", T, "for route in routes.iter().filter(|route| route.is_connected()) {\n        let route_income", "for route in routes.iter() {\n        let route_income", "dochod z niepolaczonych tras"),
    ("M12", T, ".map(|building_id| built_by_city.building_count(city_id, building_id))", ".map(|building_id| usize::from(built_by_city.contains_building(city_id, building_id)))", "limit liczy unikaty zamiast wpisow"),
    ("M13", T, "    1 + trade_route_limit_for_city(city_id, built_by_city)", "    trade_route_limit_for_city(city_id, built_by_city)", "slot istnienia bez bazowego"),
    ("M14", T, "!self.is_water() && !matches!(self, Self::Mountains)", "!self.is_water() && !matches!(self, Self::Mountains | Self::Tundra)", "Tundra nieprzejezdna"),
    ("M15", T, ".saturating_add(self.height_r as usize)\n            .max(1)", ".saturating_add(self.height_r as usize)\n            .max(2)", "budzet BFS min 2"),
    ("M16", T, "if from_city.coordinate() == to_city.coordinate() {\n                return", "if false && from_city.coordinate() == to_city.coordinate() {\n                return", "ten sam heks bez skrotu"),
    ("M17", T, "    if distance <= 1 {\n        return true;", "    if distance <= 0 {\n        return true;", "prefiltr sasiadow"),
    ("M18", T, "            if !need_path {\n                return CityConnectionResult::connected(distance, Vec::new());\n            }\n            let mut goals", "            let mut goals", "need_path=false uruchamia BFS (ladowy)"),
    ("M19", T, "if !water_components_may_connect(map, cache, &starts, &to_water) {", "if false {", "brak prefiltra wod"),
    ("M20", T, "if !land_components_may_connect(map, cache, from_city, to_city, distance) {", "if false {", "brak prefiltra ladu"),
    ("M21", T, "    best_city\n        .map(|(_, owner)| owner)\n        .or(best_fort.map(|(_, owner, _)| owner))", "    best_fort\n        .map(|(_, owner, _)| owner)\n        .or(best_city.map(|(_, owner)| owner))", "fort przed miastem"),
    ("M22", T, "Some(order)) => order < best_order,", "Some(order)) => order > best_order,", "pozniejszy fort wygrywa"),
    ("M23", T, "} else if best_city.is_none_or(|(best_distance, _)| distance < best_distance) {", "} else if best_city.is_none_or(|(best_distance, _)| distance <= best_distance) {", "remis miast: ostatni"),
    ("M24", T, "    if owner_a == owner_b {\n        return false;", "    if false {\n        return false;", "ten sam owner ma granice"),
    ("M25", T, "let diff = income_right - income_left;", "let diff = income_left - income_right;", "sortowanie rosnaco po dochodzie"),
    ("M26", T, "right\n            .is_existing\n            .cmp(&left.is_existing)", "left\n            .is_existing\n            .cmp(&right.is_existing)", "nowe przed istniejacymi"),
    ("M27", T, "            .then_with(|| locale_compare(&left.id, &right.id))\n    });", "            .then_with(|| left.id.cmp(&right.id))\n    });", "tie-break bajtowy zamiast localeCompare"),
    ("M28", T, "return if a.is_ascii_lowercase() {\n                Ordering::Less", "return if a.is_ascii_lowercase() {\n                Ordering::Greater", "wielkie litery przed malymi"),
    ("M29", T, "sorted.sort_by(|left, right| locale_compare(&left.id, &right.id));", "sorted.sort_by(|left, right| left.id.cmp(&right.id));", "trasy wewnetrzne: sort bajtowy"),
    ("M30", T, "if owner_cities.len() < 2 || !has_trade_tech(*owner_id) {", "if owner_cities.len() < 2 {", "brama techu dla tras wewnetrznych"),
    ("M31", T, "            || !has_trade_tech(*owner_a)\n                || !has_trade_tech(*owner_b)", "            || !has_trade_tech(*owner_a)", "brama techu partnera"),
    ("M32", T, "if is_at_war(*owner_a, *owner_b)\n                || !has_trade_treaty", "if false\n                || !has_trade_treaty", "wojna nie blokuje nowych tras"),
    ("M33", T, "|| !has_trade_treaty(*owner_a, *owner_b)", "", "umowa nie jest wymagana"),
    ("M34", T, "if from_used >= trade_route_existence_limit_for_city(&candidate.from.id, built_by_city)", "if from_used > trade_route_existence_limit_for_city(&candidate.from.id, built_by_city)", "off-by-one slotu istnienia"),
    ("M35", T, "let building_unlocked = from_buildings < from_limit && to_buildings < to_limit;", "let building_unlocked = from_buildings < from_limit || to_buildings < to_limit;", "slot budynku: LUB zamiast I"),
    ("M36", T, "if existing_pairs.insert(pair) {", "if { existing_pairs.insert(pair); true } {", "brak dedupu istniejacych par"),
    ("M37", T, "let territory = if internal { None } else { territory_nodes };", "let territory = territory_nodes;", "granica wymagana takze dla wewnetrznych"),
    ("M38", T, "let amount = surplus.floor();", "let amount = surplus.ceil();", "przeplyw ceil"),
    ("M39", T, "let surplus = donor_stock - params.min_stock_reserve;", "let surplus = donor_stock;", "przeplyw bez rezerwy"),
    ("M40", T, "            if from_stock == to_stock {\n                continue;\n            }\n            let (donor, recipient)", "            let (donor, recipient)", "przeplyw przy rownych zapasach"),
    ("M41", T, "    active_routes.sort_by(|left, right| locale_compare(&left.id, &right.id));\n\n    let mut flows", "    let mut flows", "przeplyw bez sortowania tras"),
    ("M42", T, ".min_by(|left, right| locale_compare(&left.route_id, &right.route_id))", ".max_by(|left, right| locale_compare(&left.route_id, &right.route_id))", "pierwszy grant: ostatni po id"),
    ("M43", T, '"brak wspólnej granicy lądowej z {label}"', '"brak granicy z {label}"', "tekst diagnozy granicy"),
    ("M44", T, "if !values.is_empty()\n                    && values.iter().all(|v| finite_number(Some(v)).is_some()) =>", "if values.iter().all(|v| finite_number(Some(v)).is_some()) =>", "loader krzywej akceptuje pusta tablice"),
    ("M45", T, 'format!("cywilizacja {partner_owner_id}")', 'format!("civ {partner_owner_id}")', "domyslna etykieta partnera"),
    ("M46", APPLY, "        Some(cap),\n", "        None,\n", "cap odbiorcy pominiety"),
    ("M47", APPLY, "        deduct_building_stock_cost_across_cities(cities, flow.from_owner_id.get() as i64, &cost);\n", "", "brak poboru u dawcy"),
    ("M48", T, ".filter(|route| !previous.contains(route.id.as_str()))", ".filter(|route| previous.contains(route.id.as_str()))", "diff: dodane odwrocone"),
    ("M49", T, "    let building_unlocked = trade_route_limit_for_city(&from_city.id, built_by_city) > 0\n        && trade_route_limit_for_city(&to_city.id, built_by_city) > 0;", "    let building_unlocked = trade_route_limit_for_city(&from_city.id, built_by_city) > 0\n        || trade_route_limit_for_city(&to_city.id, built_by_city) > 0;", "create: budynek LUB"),
    ("M50", T, "        for neighbour in city.coordinate().neighbours() {\n            if let Some(id) = components.get(&neighbour) {\n                ids.insert(*id);\n            }\n        }", "", "prefiltr ladu bez sasiadow miasta"),
    ("M51", T, "    if city_id_a < city_id_b {\n        format!(\"{city_id_a}~{city_id_b}\")", "    if city_id_a > city_id_b {\n        format!(\"{city_id_a}~{city_id_b}\")", "klucz pary odwrocony"),
    ("M52", T, "    if dystans.is_nan() {", "    if false {", "NaN dystansu (semantyka JS Math.min)"),
    ("M53", INP, "            routes,\n            &PinTradeIncomeParams::default(),", "            routes,\n            income_params,", "premia budynkowa z krzywych trudnosci"),
    ("M54", INP, "        *b.maritime_by_city.entry(city.clone()).or_insert(0.0) += bonus;\n", "", "bonus Portu nie dopisany do mapy morskiej"),
]

lo, hi, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
env = dict(os.environ, CARGO_TARGET_DIR="/dev/shm/tradepin/target", CARGO_INCREMENTAL="0",
           CARGO_PROFILE_DEV_DEBUG="0", CARGO_PROFILE_TEST_DEBUG="0")
tests = ["--test", "p6_trade_pin", "--test", "trade", "--test", "p6_adv_q6_wire"]
with open(out, "a") as log:
    for idx, (mid, path, old, new, desc) in enumerate(M):
        if not (lo <= idx < hi):
            continue
        src = open(path).read()
        if src.count(old) != 1:
            log.write(f"{mid}\tBRAK-KOTWICY({src.count(old)})\t{desc}\n")
            log.flush()
            continue
        open(path, "w").write(src.replace(old, new))
        try:
            p = subprocess.run(["cargo", "test", "-j", "2", "--no-fail-fast", *tests], cwd=ENG, env=env,
                               capture_output=True, text=True, timeout=560)
            text = p.stdout + p.stderr
        finally:
            open(path, "w").write(src)
        if "error[E" in text or "could not compile" in text:
            status = "COMPILE"
        elif "FAILED" in text or "panicked" in text:
            status = "KILLED"
        elif p.returncode == 0:
            status = "SURVIVED"
        else:
            status = "KILLED?rc=%d" % p.returncode
        log.write(f"{mid}\t{status}\t{desc}\n")
        log.flush()
