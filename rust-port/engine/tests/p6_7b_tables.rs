//! P6.7B - testy KSZTALTU i SPOJNOSCI tabeli `data/derived/building-cost-params.json` (bez pinow wartosci
//! balansu: zmiana liczby w tabeli nie wymaga zmiany testu, o ile ksztalt i odwolania pozostaja poprawne),
//! oraz zgodnosc portu z tabelami rozwinietymi P3-19 (`building-stock-costs.json`, `unit-stock-costs.json`,
//! `building-work-costs.json`, `building-work-states.json`) policzona na danych `buildings.json`/`units.json`.

use std::collections::BTreeSet;
use std::fs;
use std::path::PathBuf;

use civ_engine::data::derived::{
    building_cost_params, parse_building_cost_params, parse_building_stock_costs,
    parse_building_work_costs, parse_building_work_states, parse_unit_stock_costs,
    BUILDING_COST_ZLOTO_TOKEN,
};
use civ_engine::domain::building_costs::p6_7b::{
    apply_building_cost_pace, building_era_cost_multiplier, building_stock_cost,
    epoch_cost_multiplier, scale_cost_by_epoch, unit_stock_cost, BuildingStockSource, EpochInput,
    PaceInput, StockRecord, UnitStockCostSource,
};
use serde_json::Value;

fn engine_data(name: &str) -> Value {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("data")
        .join(name);
    let text = fs::read_to_string(&p).unwrap_or_else(|e| panic!("brak {}: {e}", p.display()));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("zly JSON {}: {e}", p.display()))
}

fn building_ids() -> BTreeSet<String> {
    engine_data("buildings.json")
        .as_array()
        .expect("buildings")
        .iter()
        .map(|b| b["id"].as_str().expect("id").to_string())
        .collect()
}

fn is_unique<T: Ord + Clone>(items: &[T]) -> bool {
    items.iter().cloned().collect::<BTreeSet<_>>().len() == items.len()
}

#[test]
fn params_file_parses_and_has_no_unresolved_tokens() {
    let raw = parse_building_cost_params().expect("parse");
    assert!(raw
        .bramka
        .etykiety_ascii
        .iter()
        .any(|e| e.etykieta == BUILDING_COST_ZLOTO_TOKEN));
    let params = building_cost_params();
    let zloto = &params.wejscia_z_innych_modulow_weba.zloto_label;
    for entry in &params.bramka.etykiety_ascii {
        assert_ne!(entry.etykieta, BUILDING_COST_ZLOTO_TOKEN);
    }
    for deposit in &params.bramka.zloza_budynkow {
        assert!(deposit
            .etykiety
            .iter()
            .all(|l| l != BUILDING_COST_ZLOTO_TOKEN));
    }
    let key = &params.wejscia_z_innych_modulow_weba.zloto_stock_klucz;
    let entry = params
        .bramka
        .etykiety_ascii
        .iter()
        .find(|e| &e.klucz == key)
        .expect("etykieta zlota w tabeli bramki");
    assert_eq!(&entry.etykieta, zloto, "jedno zrodlo etykiety Zlota");
}

#[test]
fn pace_and_era_tables_have_valid_shape() {
    let params = building_cost_params();
    let keys: Vec<&str> = params
        .tempo_kosztow_budynkow
        .iter()
        .map(|e| e.klucz.as_str())
        .collect();
    assert!(keys.len() >= 2 && is_unique(&keys));
    for entry in &params.tempo_kosztow_budynkow {
        assert!(
            entry.mnoznik.is_finite() && entry.mnoznik > 0.0,
            "{entry:?}"
        );
    }
    let eras = &params.epoki;
    assert!(eras.domyslny_mnoznik > 0.0 && eras.domyslna_epoka_wejscia_budynku >= 0.0);
    // progi sprawdzane w kolejnosci pliku musza malec (inaczej nizszy prog przyslania wyzszy)
    for pair in eras.progi.windows(2) {
        assert!(pair[0].min_epoka > pair[1].min_epoka, "progi nie maleja");
    }
    for threshold in &eras.progi {
        assert!(threshold.mnoznik > 0.0 && threshold.min_epoka.is_finite());
    }
    let all_words: Vec<&str> = eras
        .slowa
        .iter()
        .flat_map(|g| g.slowa.iter().map(String::as_str))
        .collect();
    assert!(is_unique(&all_words), "slowo epoki przypisane dwa razy");
    for group in &eras.slowa {
        assert!(group.mnoznik > 0.0 && !group.slowa.is_empty());
        for word in &group.slowa {
            // slowo musi byc osiagalne: po normalizacji daje wlasny mnoznik
            assert_eq!(
                epoch_cost_multiplier(&EpochInput::Text(word.clone())),
                group.mnoznik,
                "slowo epoki {word:?} nieosiagalne albo sprzeczne z grupa"
            );
        }
    }
}

#[test]
fn storage_and_label_tables_are_consistent() {
    let params = building_cost_params();
    let label_keys: Vec<&str> = params
        .magazyn
        .etykiety
        .iter()
        .map(|e| e.klucz.as_str())
        .collect();
    assert!(is_unique(&label_keys));
    let pool_keys: Vec<&str> = params
        .magazyn
        .klucze_magazynu_panstwa
        .iter()
        .map(String::as_str)
        .collect();
    assert!(is_unique(&pool_keys));
    for key in &pool_keys {
        assert!(label_keys.contains(key), "klucz {key} bez etykiety");
    }
    let gate_keys: Vec<&str> = params
        .bramka
        .etykiety_ascii
        .iter()
        .map(|e| e.klucz.as_str())
        .collect();
    let gate_labels: Vec<&str> = params
        .bramka
        .etykiety_ascii
        .iter()
        .map(|e| e.etykieta.as_str())
        .collect();
    assert!(is_unique(&gate_keys) && is_unique(&gate_labels));
    for key in &gate_keys {
        assert!(pool_keys.contains(key), "klucz bramki {key} poza magazynem");
    }
    for deposit in &params.bramka.zloza_budynkow {
        for label in &deposit.etykiety {
            assert!(
                gate_labels.contains(&label.as_str()),
                "etykieta {label} zloza {} poza tabela etykiet",
                deposit.budynek
            );
        }
    }
    for converter in &params.bramka.konwertery {
        assert!(gate_labels.contains(&converter.etykieta.as_str()));
    }
}

#[test]
fn building_references_exist_in_buildings_json() {
    let ids = building_ids();
    let params = building_cost_params();
    let gate = &params.bramka;
    let mut referenced: Vec<&str> = Vec::new();
    referenced.extend(gate.zloza_budynkow.iter().map(|d| d.budynek.as_str()));
    referenced.extend(gate.dostep_wodny.iter().map(String::as_str));
    referenced.extend(gate.konwertery.iter().map(|c| c.budynek.as_str()));
    referenced.push(gate.mennica_budynek.as_str());
    referenced.push(params.spichlerz.budynek_i.as_str());
    referenced.push(params.spichlerz.budynek_ii.as_str());
    for prereq in &gate.prerekwizyty_miasta {
        referenced.push(prereq.budynek.as_str());
        match &prereq.wymaga {
            civ_engine::data::derived::BuildingGatePrereqValue::One(id) => referenced.push(id),
            civ_engine::data::derived::BuildingGatePrereqValue::Many(list) => {
                referenced.extend(list.iter().map(String::as_str));
            }
        }
    }
    for id in referenced {
        assert!(
            ids.contains(id),
            "budynek {id} z tabeli nie istnieje w buildings.json"
        );
    }
    let prereq_ids: Vec<&str> = gate
        .prerekwizyty_miasta
        .iter()
        .map(|p| p.budynek.as_str())
        .collect();
    assert!(is_unique(&prereq_ids));
    let deposit_ids: Vec<&str> = gate
        .zloza_budynkow
        .iter()
        .map(|d| d.budynek.as_str())
        .collect();
    assert!(is_unique(&deposit_ids));
    for id in &params.spichlerz.wykluczone_z_bramki_runtime {
        assert!(
            *id == params.spichlerz.budynek_i || *id == params.spichlerz.budynek_ii,
            "wykluczony {id} nie jest Spichlerzem"
        );
    }
}

#[test]
fn spichlerz_and_unit_parameters_have_valid_shape() {
    let params = building_cost_params();
    let s = &params.spichlerz;
    assert!(s.drain_ceramika_na_ture > 0.0 && s.drain_sol_na_ture > 0.0);
    assert!(s.racja_mnoznik_ii > 0.0 && s.racja_mnoznik_i > 0.0);
    assert!(s.cap_imperium_i > 0.0 && s.cap_imperium_ii_pelny >= s.cap_imperium_i);
    assert!(s.armia_mnoznik_poza_terytorium > 0.0 && s.garnizon_mnoznik_sol > 0.0);
    let pool_keys = &params.magazyn.klucze_magazynu_panstwa;
    assert!(pool_keys.contains(&s.klucz_ceramika) && pool_keys.contains(&s.klucz_sol));
    let u = &params.jednostki;
    assert!(u.kon_koszt_bazowy > 0 && pool_keys.contains(&u.kon_klucz));
    assert!(!u.typ_jezdny.is_empty() && !u.znacznik_braku_surowca.is_empty());
    let foreign = &params.wejscia_z_innych_modulow_weba;
    assert!(foreign.r_stawki_fala2_mnoznik > 0.0 && foreign.mennica_zloto_drain_na_ture > 0.0);
    assert!(pool_keys.contains(&foreign.zloto_stock_klucz));
    let messages = &params.bramka.komunikaty;
    assert!(!messages.brak_prefiks.is_empty() && !messages.separator.is_empty());
}

#[test]
fn nfd_strip_table_has_valid_shape() {
    let lookup = civ_engine::data::derived::nfd_strip_lookup();
    let file = &lookup.file;
    // wpisy: unikalne punkty kodowe, poza wycinanym zakresem i sylabami Hangul, bez pustych kluczy
    let code_points: Vec<u32> = file.wpisy.iter().map(|(cp, _)| *cp).collect();
    assert!(is_unique(&code_points) && !code_points.is_empty());
    assert_eq!(lookup.by_code_point.len(), code_points.len());
    let hangul = file.hangul;
    let hangul_end = hangul.s_base + hangul.l_count * hangul.v_count * hangul.t_count;
    for (cp, replacement) in &file.wpisy {
        assert!(char::from_u32(*cp).is_some(), "punkt kodowy {cp:#X}");
        assert!(!(file.wycinany_zakres.od..=file.wycinany_zakres.do_).contains(cp));
        assert!(!(hangul.s_base..hangul_end).contains(cp));
        assert!(
            !replacement.is_empty() || *cp < 0x10000,
            "pusty rozklad {cp:#X}"
        );
    }
    assert!(file.wycinany_zakres.od <= file.wycinany_zakres.do_);
    // rangi: unikalne punkty kodowe, rangi >= 1, dense (bez luk)
    let rank_cps: Vec<u32> = file
        .kolejnosc_znakow_laczacych
        .iter()
        .map(|(cp, _)| *cp)
        .collect();
    assert!(is_unique(&rank_cps) && !rank_cps.is_empty());
    let ranks: BTreeSet<u32> = file
        .kolejnosc_znakow_laczacych
        .iter()
        .map(|(_, rank)| *rank)
        .collect();
    assert_eq!(ranks.iter().next(), Some(&1));
    assert_eq!(
        ranks.iter().next_back().copied(),
        u32::try_from(ranks.len()).ok(),
        "rangi nie sa ciagle"
    );
}

fn building_source(b: &Value) -> BuildingStockSource {
    BuildingStockSource {
        epoka_wejscia: b["epokaWejscia"].as_f64(),
        koszt_surowce: b["koszt_surowce"].as_object().map(|m| {
            m.iter()
                .map(|(k, v)| (k.clone(), v.as_f64()))
                .collect::<std::collections::BTreeMap<_, _>>()
        }),
    }
}

#[test]
fn building_stock_cost_matches_flattened_p3_19_table() {
    let buildings = engine_data("buildings.json");
    let table = parse_building_stock_costs().expect("building-stock-costs.json");
    let mut compared = 0;
    for b in buildings.as_array().expect("buildings") {
        let id = b["id"].as_str().expect("id");
        let row = table
            .wiersze
            .iter()
            .find(|r| r.budynek == id)
            .unwrap_or_else(|| panic!("tabela rozwinieta bez budynku {id}"));
        let got = building_stock_cost(Some(&building_source(b)));
        let want: StockRecord = row
            .koszt_surowce
            .iter()
            .map(|(k, v)| (k.clone(), f64::from(*v)))
            .collect();
        assert_eq!(got, want, "koszt surowcowy budynku {id}");
        compared += 1;
    }
    assert_eq!(compared, table.wiersze.len());
}

#[test]
fn unit_stock_cost_matches_flattened_p3_19_table() {
    let units = engine_data("units.json");
    let table = parse_unit_stock_costs().expect("unit-stock-costs.json");
    let mut compared = 0;
    for u in units.as_array().expect("units") {
        let name = u["Jednostka"].as_str().expect("Jednostka");
        let row = table
            .wiersze
            .iter()
            .find(|r| r.jednostka == name)
            .unwrap_or_else(|| panic!("tabela rozwinieta bez jednostki {name}"));
        let source = UnitStockCostSource {
            jednostka: Some(name.to_string()),
            typ: u["Typ"].as_str().map(str::to_string),
            epoka: match &u["Epoka"] {
                Value::String(s) => EpochInput::Text(s.clone()),
                Value::Number(n) => EpochInput::Number(n.as_f64().expect("f64")),
                _ => EpochInput::Other,
            },
            surowiec: u["Surowiec"].as_str().map(str::to_string),
            surowiec_ilosc: u["Surowiec (ilość)"].as_f64(),
        };
        let got = unit_stock_cost(Some(&source));
        let want: StockRecord = row
            .surowiec
            .iter()
            .map(|(k, v)| (k.clone(), f64::from(*v)))
            .collect();
        assert_eq!(got, want, "koszt surowcowy jednostki {name}");
        compared += 1;
    }
    assert_eq!(compared, table.wiersze.len());
}

#[test]
fn era_multiplier_matches_flattened_work_tables() {
    let work = parse_building_work_costs().expect("building-work-costs.json");
    for row in &work.wiersze {
        assert_eq!(
            building_era_cost_multiplier(Some(row.epoka_wejscia as f64)),
            row.baza.mnoznik_ery as f64,
            "mnoznik ery budynku {}",
            row.budynek
        );
        assert_eq!(
            scale_cost_by_epoch(
                row.baza.koszt_budowy as f64,
                &EpochInput::Number(row.epoka_wejscia as f64)
            ),
            f64::from(row.praca_bazowa),
            "Praca bazowa budynku {}",
            row.budynek
        );
    }
}

#[test]
fn pace_matches_flattened_work_states_for_normal_mode() {
    let states = parse_building_work_states().expect("building-work-states.json");
    let mut compared = 0;
    for row in &states.wiersze {
        for value in &row.wartosci {
            if value.tryb != "normalny" || value.znizka_cywilizacji != 0.0 {
                continue;
            }
            let got = apply_building_cost_pace(
                f64::from(row.koszt_przed_tempem),
                PaceInput::Key(&value.pace),
            );
            assert_eq!(
                got,
                f64::from(value.praca),
                "Praca {} poziom {} tempo {}",
                row.budynek,
                row.poziom,
                value.pace
            );
            compared += 1;
        }
    }
    assert!(compared > 150, "za malo porownan: {compared}");
}
