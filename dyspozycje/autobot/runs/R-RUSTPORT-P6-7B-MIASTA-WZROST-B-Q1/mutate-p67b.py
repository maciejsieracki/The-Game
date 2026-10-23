#!/usr/bin/env python3
"""Mutacje P6.7B: kazda zmienia JEDEN fragment kodu Rust / tabeli JSON, uruchamia testy p6_7b_*,
przywraca plik i sprawdza czystosc drzewa (git diff dla mutowanego pliku == stan sprzed mutacji).
Oczekiwanie: test CZERWONY (mutant wykryty). SEKWENCYJNIE (jedna kompilacja naraz), z timeoutem na mutanta.
Uzycie (z rust-port/engine, z ustawionym CARGO_TARGET_DIR):  python3 -I mutate-p67b.py [fragment-nazwy ...]
Krotka: (nazwa, plik, stary_fragment, nowy_fragment, ktore_wystapienie) - ktore_wystapienie=None wymaga
dokladnie jednego wystapienia; liczba n >= 1 oznacza n-te wystapienie (gdy fragment powtarza sie w pliku).
Tryb MUT_CHECK=1 tylko sprawdza, czy kazdy fragment wystepuje oczekiwana liczbe razy.
Zmienne: MUT_SKIP=n (pomin n pierwszych), MUT_END=n (zakoncz przed n), MUT_TIMEOUT=sekundy (domyslnie 900).
"""
import hashlib
import os
import signal
import subprocess
import sys

# SIGTERM -> normalne zakonczenie, aby `finally` przywrocilo mutowany plik
signal.signal(signal.SIGTERM, lambda *_: sys.exit(143))

BC = "src/domain/building_costs.rs"
DR = "src/data/derived.rs"
JP = "data/derived/building-cost-params.json"
JN = "data/derived/nfd-strip-table.json"

M = [
    # --- tempo kosztow ---
    ("cost: tempo - brak dolnej granicy 1", BC, "        js_max(\n            1.0,\n            js_math_round(base_cost * building_cost_pace_multiplier(pace)),\n        )", "        js_math_round(base_cost * building_cost_pace_multiplier(pace))", None),
    ("cost: tempo - nieznany klucz = 1", BC, ".map_or(f64::NAN, |entry| entry.mnoznik),", ".map_or(1.0, |entry| entry.mnoznik),", None),
    ("cost: tempo - mnoznik liczbowy bez znaku", BC, "PaceInput::Multiplier(m) => m,", "PaceInput::Multiplier(m) => m.abs(),", None),
    # --- epoki ---
    ("cost: epoka - prog >", BC, ".find(|threshold| ordinal >= threshold.min_epoka)", ".find(|threshold| ordinal > threshold.min_epoka)", None),
    ("cost: epoka - brak progu = 0", BC, ".map_or(eras.domyslny_mnoznik, |threshold| threshold.mnoznik)", ".map_or(0.0, |threshold| threshold.mnoznik)", None),
    ("cost: epoka - bez floor", BC, "EpochInput::Number(n) if n.is_finite() => multiplier_for_ordinal(n.floor()),", "EpochInput::Number(n) if n.is_finite() => multiplier_for_ordinal(*n),", None),
    ("cost: epoka - nieskonczona jak 3", BC, "EpochInput::Number(_) | EpochInput::Other => eras.domyslny_mnoznik,", "EpochInput::Number(_) | EpochInput::Other => multiplier_for_ordinal(3.0),", None),
    ("cost: epoka - bez sciezki cyfr", BC, "if is_decimal_literal(&normalized) {", "if false {", None),
    ("cost: epoka - cyfry puste czesci", BC, "let all_digits = |part: &str| !part.is_empty() && part.bytes().all(|b| b.is_ascii_digit());", "let all_digits = |part: &str| part.bytes().all(|b| b.is_ascii_digit());", None),
    ("cost: epoka - cyfry nie-ASCII", BC, "part.bytes().all(|b| b.is_ascii_digit());", "part.bytes().all(|b| b.is_ascii_digit() || b >= 0x80);", None),
    ("cost: epoka - slowo jako przedrostek", BC, ".find(|group| group.slowa.contains(&normalized))", ".find(|group| group.slowa.iter().any(|w| normalized.starts_with(w.as_str())))", None),
    ("cost: skala - ujemny koszt", BC, "if !cost.is_finite() || cost < 0.0 {", "if !cost.is_finite() {", None),
    ("cost: skala - zero", BC, "        if cost == 0.0 {\n            return 0.0;\n        }\n", "", None),
    ("cost: skala - brak dolnej granicy 1", BC, "js_max(1.0, js_math_round(cost * epoch_cost_multiplier(epoch)))", "js_math_round(cost * epoch_cost_multiplier(epoch))", None),
    ("cost: era budynku - domyslna epoka", BC, "_ => building_cost_params().epoki.domyslna_epoka_wejscia_budynku,", "_ => 3.0,", None),
    ("cost: era budynku - round zamiast floor", BC, "Some(n) if n.is_finite() => n.floor(),", "Some(n) if n.is_finite() => n.round(),", None),
    ("cost: rekord FALA2 bez mnoznika", BC, "js_max(1.0, js_math_round(v * fala2))", "js_max(1.0, js_math_round(v))", None),
    ("cost: rekord FALA2 - filtr skonczonosci", BC, "value.filter(|v| is_positive_finite(*v))", "value.filter(|v| v.is_finite())", None),
    ("cost: rekord FALA2 - brak dolnej granicy 1", BC, "out.insert(key.clone(), js_max(1.0, js_math_round(v * fala2)));", "out.insert(key.clone(), js_math_round(v * fala2));", None),
    ("cost: koszt budynku bez mnoznika ery", BC, "js_math_round(amount * era_multiplier)", "js_math_round(amount)", None),
    ("cost: brakuje - >=", BC, "            if brak > 0.0 {", "            if brak >= 0.0 {", None),
    ("cost: brakuje - odwrocona roznica", BC, "let brak = need - have;", "let brak = have - need;", None),
    ("cost: stac - <=", BC, "            if have < *need {", "            if have <= *need {", None),
    ("cost: pobor - bez dolnej granicy 0", BC, "next.insert(key.clone(), js_max(0.0, have - need));", "next.insert(key.clone(), have - need);", None),
    ("cost: pobor - pusta baza", BC, "let mut next = city_surowce.cloned().unwrap_or_default();", "let mut next = StockRecord::new();", None),
    ("cost: etykieta - brak etykiety", BC, ".map_or_else(|| key.to_owned(), |e| e.etykieta.clone())", ".map_or_else(|| key.to_uppercase(), |e| e.etykieta.clone())", None),
    # --- pula panstwa ---
    ("pool: suma - tylko skonczone", BC, "                if value.is_finite() {", "                if !value.is_nan() {", None),
    ("pool: suma - filtr wlasciciela", BC, "            if city.owner_id() != owner_id {\n                continue;\n            }\n            let Some(surowce) = city.surowce() else {", "            let Some(surowce) = city.surowce() else {", None),
    ("pool: zapas - suma", BC, "            total += city_stock(city, key);", "            total = city_stock(city, key);", None),
    ("pool: zwrot - tylko dodatnie", BC, "if is_positive_finite(*amount) {", "if *amount > 0.0 {", 1),
    ("pool: przypisanie - tylko dodatnie", BC, "if is_positive_finite(*amount) {", "if *amount > 0.0 {", 2),
    ("pool: pobor - NaN/0 koszt", BC, "if need.is_nan() || need <= 0.0 {", "if need.is_nan() {", None),
    ("pool: pobor - zerowi posiadacze", BC, "city_stock(&cities[i], key) > 0.0)", "city_stock(&cities[i], key) >= 0.0)", None),
    ("pool: pobor - kierunek sortowania", BC, "let diff = city_stock(&cities[b], key) - city_stock(&cities[a], key);", "let diff = city_stock(&cities[a], key) - city_stock(&cities[b], key);", None),
    ("pool: pobor - remis po id odwrocony", BC, "diff_ordering(diff).unwrap_or_else(|| js_str_cmp(cities[a].id(), cities[b].id()))", "diff_ordering(diff).unwrap_or_else(|| js_str_cmp(cities[b].id(), cities[a].id()))", 1),
    ("pool: kredyt - remis po id odwrocony", BC, "diff_ordering(diff).unwrap_or_else(|| js_str_cmp(cities[a].id(), cities[b].id()))", "diff_ordering(diff).unwrap_or_else(|| js_str_cmp(cities[b].id(), cities[a].id()))", 2),
    ("pool: id jak bajty UTF-8", BC, "a.encode_utf16().cmp(b.encode_utf16())", "a.cmp(b)", None),
    ("pool: NaN roznicy nie jest remisem", BC, "        if diff.is_nan() {\n            Some(Ordering::Equal)", "        if diff.is_nan() {\n            None", None),
    ("pool: pobor - cala potrzeba", BC, "let take = have.min(need);", "let take = need;", None),
    ("pool: kredyt - kwota <= 0", BC, "if !amount.is_finite() || amount <= 0.0 {", "if !amount.is_finite() {", None),
    ("pool: kredyt - cap musi byc skonczony", BC, "if let Some(cap) = cap_per_type.filter(|cap| cap.is_finite()) {", "if let Some(cap) = cap_per_type {", None),
    ("pool: kredyt - cap bez dolnej granicy", BC, "to_add = js_max(0.0, js_min(to_add, cap - current));", "to_add = js_min(to_add, cap - current);", None),
    ("pool: kredyt - kierunek sortowania", BC, "let diff = city_stock(&cities[a], key) - city_stock(&cities[b], key);", "let diff = city_stock(&cities[b], key) - city_stock(&cities[a], key);", None),
    ("pool: kredyt - ostatni zamiast pierwszego", BC, "let target = owner_cities[0];", "let target = owner_cities[owner_cities.len() - 1];", None),
    ("pool: kredyt - zero", BC, "        if to_add <= 0.0 {\n            return 0.0;\n        }\n", "        if to_add < 0.0 {\n            return 0.0;\n        }\n", None),
    ("pool: przypisanie - bez zerowania", BC, "                surowce.clear();", "                let _ = surowce.len();", None),
    ("pool: sortowanie niestabilne", BC, "while j > 0 && cmp(&items[j - 1], &items[j]) == Ordering::Greater {", "while j > 0 && cmp(&items[j - 1], &items[j]) != Ordering::Less {", None),
    # --- jednostki ---
    ("unit: Typ bez trim", BC, "if js_trim(unit.typ.as_deref().unwrap_or(\"\")) != params.typ_jezdny {", "if unit.typ.as_deref().unwrap_or(\"\") != params.typ_jezdny {", None),
    ("unit: wyjatek bez trim", BC, "js_trim(unit.jednostka.as_deref().unwrap_or(\"\")) != params.wyjatek_kon_jednostka", "unit.jednostka.as_deref().unwrap_or(\"\") != params.wyjatek_kon_jednostka", None),
    ("unit: Surowiec bez trim", BC, "let raw_name = js_trim(unit.surowiec.as_deref().unwrap_or(\"\"));", "let raw_name = unit.surowiec.as_deref().unwrap_or(\"\");", None),
    ("unit: znacznik braku surowca", BC, "if !raw_name.is_empty() && raw_name != params.znacznik_braku_surowca {", "if !raw_name.is_empty() {", None),
    ("unit: ilosc skonczona", BC, "unit.surowiec_ilosc.filter(|v| is_positive_finite(*v))", "unit.surowiec_ilosc.filter(|v| *v > 0.0)", None),
    ("unit: pusty klucz", BC, "                if !key.is_empty() {", "                if true {", None),
    ("unit: kon dodawany do surowca", BC, "let current = out.get(&params.kon_klucz).copied().unwrap_or(0.0);", "let current = 0.0;", None),
    ("unit: kon bez skali ery", BC, "current + scale_cost_by_epoch(mount_unit_horse_stock_cost(), &unit.epoka),", "current + mount_unit_horse_stock_cost(),", None),
    # --- NFD ---
    ("nfd: znaki laczace zostaja", BC, "            if (range.od..=range.do_).contains(&cp) {\n                continue;\n            }\n", "", None),
    ("nfd: Hangul - samogloska", BC, "hangul.v_base + (index % (hangul.v_count * hangul.t_count)) / hangul.t_count;", "hangul.v_base + (index % (hangul.v_count * hangul.t_count)) / hangul.t_count + 1;", None),
    ("nfd: Hangul - spolgloska koncowa", BC, "                if t_index != 0 {", "                if t_index != 1 {", None),
    ("nfd: Hangul - spolgloska poczatkowa", BC, "let lead = hangul.l_base + index / (hangul.v_count * hangul.t_count);", "let lead = hangul.l_base + index / hangul.t_count;", None),
    ("nfd: brak kanonicznego uporzadkowania", BC, "run.sort_by_key(|c| rank[&u32::from(*c)]);", "let _ = &run;", None),
    ("nfd: bez malych liter", BC, "js_trim(&nfd_strip(s)).to_lowercase()", "js_trim(&nfd_strip(s)).to_string()", None),
    ("nfd: trim Rust zamiast JS", BC, "js_trim(&nfd_strip(s)).to_lowercase()", "nfd_strip(s).trim().to_lowercase()", None),
    # --- bramki ---
    ("gate: Mennica - strict >", BC, "            >= building_cost_params()\n                .wejscia_z_innych_modulow_weba\n                .mennica_zloto_drain_na_ture", "            > building_cost_params()\n                .wejscia_z_innych_modulow_weba\n                .mennica_zloto_drain_na_ture", None),
    ("gate: Zloto - filtr dodatnich", BC, "            .filter(|v| is_positive_finite(*v))\n            .unwrap_or(0.0)", "            .filter(|v| v.is_finite())\n            .unwrap_or(0.0)", None),
    ("gate: konwerter - bez budynku", BC, "&& built_ids.is_some_and(|ids| ids.contains(&converter.budynek))", "&& built_ids.is_some()", None),
    ("gate: zapas > 0", BC, "if stock.get(ascii_key).copied().unwrap_or(0.0) > 0.0 {", "if stock.get(ascii_key).copied().unwrap_or(0.0) >= 0.0 {", None),
    ("gate: etykiety - bez deduplikacji", BC, "if !out.iter().any(|l| l == label) {", "if true {", None),
    ("gate: wymagany surowiec bez trim", BC, "let key = js_trim(building.wymagany_surowiec.as_deref().unwrap_or(\"\")).to_lowercase();", "let key = building.wymagany_surowiec.as_deref().unwrap_or(\"\").to_lowercase();", None),
    ("gate: wymagany surowiec bez malych liter", BC, "let key = js_trim(building.wymagany_surowiec.as_deref().unwrap_or(\"\")).to_lowercase();", "let key = js_trim(building.wymagany_surowiec.as_deref().unwrap_or(\"\")).to_string();", None),
    ("gate: bramka budowy - any", BC, "            .all(|label| label_satisfied(label, empire_built_ids, empire_stock))", "            .any(|label| label_satisfied(label, empire_built_ids, empire_stock))", None),
    ("gate: Mennica runtime - odwrocony resolver", BC, "return resolve(owner_id);", "return !resolve(owner_id);", None),
    ("gate: Mennica runtime - zawsze prawda", BC, "return mennica_runtime_gate_met(empire_stock, options);", "return true;", 1),
    ("gate: runtime - bez wybudowanych", BC, "            .all(|label| label_satisfied(label, Some(runtime_active_built_ids), empire_stock))", "            .all(|label| label_satisfied(label, None, empire_stock))", None),
    ("gate: filtr - dodatkowy wymagany surowiec", BC, "                    wymagany_surowiec: None,\n                };\n                if building_runtime_gate_met(", "                    wymagany_surowiec: Some(\"zloto\".into()),\n                };\n                if building_runtime_gate_met(", None),
    ("gate: filtr - odwrocona bramka", BC, "if !has_deposit_runtime_gate(id) {", "if has_deposit_runtime_gate(id) {", None),
    ("gate: filtr - kolejnosc aktywnych", BC, "                    &active,\n", "                    &[],\n", None),
    ("gate: prerekwizyt - pusty napis", BC, "            Some(BuildingGatePrereqValue::One(id)) if id.is_empty() => return true,\n", "", None),
    ("gate: prerekwizyt - and", BC, "built_list.contains(id) || is_superseded(id, built_list, buildings)", "built_list.contains(id) && is_superseded(id, built_list, buildings)", None),
    ("gate: prerekwizyt - brak = niespelniony", BC, "            None => return true,\n", "            None => return false,\n", None),
    ("gate: brakujace etykiety - odwrocone", BC, ".filter(|label| !label_satisfied(label, Some(runtime_active_built_ids), empire_stock))", ".filter(|label| label_satisfied(label, Some(runtime_active_built_ids), empire_stock))", None),
    ("gate: brakujace - Mennica odwrocona", BC, "            if mennica_runtime_gate_met(empire_stock, options) {\n                return Vec::new();", "            if !mennica_runtime_gate_met(empire_stock, options) {\n                return Vec::new();", None),
    ("gate: Spichlerz wylaczony z bramki", BC, "            .any(|id| id == building_id)\n        {\n            return false;", "            .any(|id| id == building_id)\n        {\n            return true;", None),
    # --- Spichlerz ---
    ("sp: drain Ceramiki - strict >", BC, "            >= params.drain_ceramika_na_ture\n", "            > params.drain_ceramika_na_ture\n", None),
    ("sp: drain Soli - strict >", BC, "&params.klucz_sol) >= params.drain_sol_na_ture\n", "&params.klucz_sol) > params.drain_sol_na_ture\n", None),
    ("sp: dry-run pobiera", BC, "if !dry_run {", "if dry_run {", 1),
    ("sp: dry-run - Ceramika", BC, "                >= params.drain_ceramika_na_ture,", "                > params.drain_ceramika_na_ture,", None),
    ("sp: stan - Pop bez II", BC, "let ma_spichlerz_pop = ceramika_active && !ma_spichlerz_ii_pop;", "let ma_spichlerz_pop = ceramika_active;", None),
    ("sp: stan - Sol tylko II", BC, "let sol_active = has_ii && drain.sol_paid;", "let sol_active = drain.sol_paid;", None),
    ("sp: stan - II wymaga II", BC, "let ma_spichlerz_ii_pop = has_ii && ceramika_active && sol_active;", "let ma_spichlerz_ii_pop = ceramika_active && sol_active;", None),
    ("sp: zdrowie II", BC, "return params.zdrowie_ii;", "return params.zdrowie_i;", None),
    ("sp: wzrost II", BC, "return params.wzrost_procent_ii;", "return params.wzrost_procent_i;", None),
    ("sp: racja II", BC, "return params.racja_mnoznik_ii;", "return params.racja_mnoznik_i;", None),
    ("sp: zadowolenie - domyslna", BC, ".unwrap_or(building_cost_params().spichlerz.zadowolenie_json_domyslne);", ".unwrap_or(0.0);", None),
    ("sp: yields - tylko jeden", BC, "spichlerz_mapped = true;", "spichlerz_mapped = false;", None),
    ("sp: armia poza terytorium", BC, "if !on_own_territory && sol_army_bonus_active {", "if on_own_territory && sol_army_bonus_active {", None),
    ("sp: armia garnizon", BC, "m *= params.garnizon_mnoznik_sol;", "m = params.garnizon_mnoznik_sol;", None),
    ("sp: nieaktywny - brak budynku", BC, "if !opts.built_ids.iter().any(|id| id == building_id) {", "if false {", None),
    ("sp: nieaktywny - Sol tylko II", BC, "if building_id == params.budynek_ii && !drain.sol_paid {", "if !drain.sol_paid {", None),
    ("sp: nieaktywny - separator", BC, "messages.brak_prefiks,\n            missing_labels.join(&messages.separator)", "messages.brak_prefiks,\n            missing_labels.join(\",\")", None),
    ("sp: nieaktywny - budynek z opcji", BC, "let building = opts.building.unwrap_or(&fallback);", "let building = &fallback;", None),
    ("sp: posiadanie - and", BC, ".any(|id| *id == params.budynek_i || *id == params.budynek_ii)", ".any(|id| *id == params.budynek_i && *id == params.budynek_ii)", None),
    # --- tabele JSON ---
    ("tab: tempo normalny", JP, '{ "klucz": "normalny", "mnoznik": 2.0 }', '{ "klucz": "normalny", "mnoznik": 3.0 }', None),
    ("tab: prog ery 3", JP, '{ "min_epoka": 3, "mnoznik": 4 }', '{ "min_epoka": 3, "mnoznik": 5 }', None),
    ("tab: prog ery 2", JP, '{ "min_epoka": 2, "mnoznik": 2 }', '{ "min_epoka": 2, "mnoznik": 3 }', None),
    ("tab: slowo epoki", JP, '"slowa": ["kamien", "stone", "1"]', '"slowa": ["kamien", "1"]', None),
    ("tab: FALA2", JP, '"r_stawki_fala2_mnoznik": 2', '"r_stawki_fala2_mnoznik": 3', None),
    ("tab: koszt koni", JP, '"kon_koszt_bazowy": 25', '"kon_koszt_bazowy": 26', None),
    ("tab: drain Ceramiki", JP, '"drain_ceramika_na_ture": 25', '"drain_ceramika_na_ture": 24', None),
    ("tab: zdrowie II", JP, '"zdrowie_ii": 10', '"zdrowie_ii": 11', None),
    ("tab: racja I", JP, '"racja_mnoznik_i": 0.75', '"racja_mnoznik_i": 0.7', None),
    ("tab: prerekwizyt Akademii", JP, '{ "budynek": "akademia", "wymaga": "biblioteka" }', '{ "budynek": "akademia", "wymaga": "studnia" }', None),
    ("tab: zloze Kuzni", JP, '{ "budynek": "kuznia", "etykiety": ["Ruda"] }', '{ "budynek": "kuznia", "etykiety": ["Kamień"] }', None),
    ("tab: etykieta Stali (bramka)", JP, '{ "klucz": "stal", "etykieta": "Stal" }', '{ "klucz": "stal", "etykieta": "Stal." }', 2),
    ("tab: drain Mennicy", JP, '"mennica_zloto_drain_na_ture": 1', '"mennica_zloto_drain_na_ture": 2', None),
    ("tab: komunikat Brak", JP, '"brak_prefiks": "Brak: "', '"brak_prefiks": "Brakuje: "', None),
    ("tab: konwerter Cegly", JP, '{ "etykieta": "Cegła", "budynek": "cegielnia" }', '{ "etykieta": "Cegła", "budynek": "garncarnia" }', None),
    ("tab: Spichlerz poza bramka", JP, '"wykluczone_z_bramki_runtime": ["spichlerz", "spichlerz_ii"]', '"wykluczone_z_bramki_runtime": ["spichlerz"]', None),
    ("tab: dostep wodny", JP, '"dostep_wodny": ["port", "port_wielki"]', '"dostep_wodny": ["port"]', None),
    ("tab: cap Spichlerza", JP, '"cap_imperium_i": 1000', '"cap_imperium_i": 999', None),
    ("tab: armia poza terytorium", JP, '"armia_mnoznik_poza_terytorium": 0.5', '"armia_mnoznik_poza_terytorium": 0.6', None),
    ("tab: wyjatek koni", JP, '"wyjatek_kon_jednostka": "Rydwan (woły)"', '"wyjatek_kon_jednostka": "Rydwan"', None),
    ("tab: etykieta Zlota (token)", JP, '"zloto_label": "Złoto"', '"zloto_label": "Złoto."', None),
    ("tab: NFD wpis", JN, '    [192,"A"],', '    [192,"B"],', None),
    ("tab: NFD Hangul t_count", JN, '"t_count": 28', '"t_count": 27', None),
    ("tab: NFD ranga znaku", JN, '"kolejnosc_znakow_laczacych": [\n    [', '"kolejnosc_znakow_laczacych": [\n    [0,0],\n    [', None),
    # --- parser ---
    ("dr: token Zlota nie zamieniany", DR, "if text == BUILDING_COST_ZLOTO_TOKEN {", "if false {", None),
    ("dr: indeks NFD", DR, "let by_code_point = file.wpisy.iter().cloned().collect();", "let by_code_point = std::collections::HashMap::new();", None),
]


def tests_for(name, path):
    """Binaria testowe, ktore pokrywaja mutowany fragment."""
    if path != BC:
        return ["p6_7b_cost", "p6_7b_pool", "p6_7b_gate", "p6_7b_spichlerz", "p6_7b_tables", "p6_7b_nfd"]
    prefix = name.split(":")[0]
    return {
        "cost": ["p6_7b_cost", "p6_7b_tables"],
        "unit": ["p6_7b_cost", "p6_7b_tables"],
        "pool": ["p6_7b_pool", "p6_7b_spichlerz"],
        "nfd": ["p6_7b_nfd", "p6_7b_cost"],
        "gate": ["p6_7b_gate", "p6_7b_spichlerz", "p6_7b_tables"],
        "sp": ["p6_7b_spichlerz", "p6_7b_gate"],
    }[prefix]


def digest(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


ONLY = sys.argv[1:]
SKIP = int(os.environ.get("MUT_SKIP", "0"))
END = int(os.environ.get("MUT_END", str(10**9)))
TIMEOUT = int(os.environ.get("MUT_TIMEOUT", "900"))
survived = []
ran = 0
for idx, (name, path, old, new, nth) in enumerate(M):
    if idx < SKIP or idx >= END:
        continue
    if ONLY and not any(o in name for o in ONLY):
        continue
    ran += 1
    src = open(path, encoding="utf-8").read()
    before = digest(path)
    cnt = src.count(old)
    if os.environ.get("MUT_CHECK"):
        ok = (cnt == 1) if nth is None else (cnt >= nth)
        print(("OK    " if ok else "BRAK  ") + f"{cnt}x: [{idx}] {name}")
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
        pos = -1
        for _ in range(nth):
            pos = src.index(old, pos + 1)
        mutated = src[:pos] + new + src[pos + len(old):]
    open(path, "w", encoding="utf-8").write(mutated)
    try:
        args = ["cargo", "test", "--no-fail-fast"]
        for t in tests_for(name, path):
            args += ["--test", t]
        try:
            r = subprocess.run(args, capture_output=True, text=True, timeout=TIMEOUT)
            out = r.stdout + r.stderr
            rc = r.returncode
            timed_out = False
        except subprocess.TimeoutExpired as e:
            out = (e.stdout or b"").decode("utf-8", "replace") if isinstance(e.stdout, bytes) else (e.stdout or "")
            rc = -1
            timed_out = True
        failed = [l for l in out.splitlines() if l.startswith("test ") and l.endswith("FAILED")]
        if timed_out:
            print(f"TIMEOUT   : [{idx}] {name}")
            survived.append(name + " [timeout]")
        elif rc == 0:
            survived.append(name)
            print(f"PRZEZYL   : [{idx}] {name}")
        elif "error[" in out or ("error:" in out and not failed):
            print(f"KOMPILACJA: [{idx}] {name} (mutant nie kompiluje sie)")
            survived.append(name + " [nie kompiluje]")
        else:
            print(f"WYKRYTY   : [{idx}] {name} -> {len(failed)} testow czerwonych: {', '.join(l.split()[1] for l in failed[:3])}")
    finally:
        open(path, "w", encoding="utf-8").write(src)
        if digest(path) != before:
            print(f"BLAD: plik {path} nie wrocil do stanu sprzed mutacji po [{idx}] {name}")
            sys.exit(3)
        # czystosc drzewa: tylko pliki tematu moga byc zmienione/nieSledzone (sprawdzane przez wolajacego)
    sys.stdout.flush()
print(f"mutantow={ran} przezylo/niekompilujace={len(survived)}")
for s in survived:
    print("  ", s)
sys.exit(0 if not survived else 1)
