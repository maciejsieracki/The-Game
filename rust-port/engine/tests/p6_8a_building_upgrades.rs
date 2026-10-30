//! R-RUSTPORT-P6-8A-PRODUKCJA-KOSZTY-Q1, partia 8A-P1 (pin webu 91dc998a):
//! testy portu `gra/src/game/building-upgrades.ts` (modul `domain::building_costs::building_upgrades`).
//!
//! Oczekiwane wartosci wyprowadzone z kodu web (funkcja po funkcji, `building-upgrades.ts`).
//! Wektory JSON z generatora uruchomionego na weba (`gen-p6-8a-vectors.mjs`) NIE zostaly jeszcze
//! wygenerowane w tej rundzie (NASTEPNA-PARTIA); te testy sa jawnymi przypadkami granicznymi.

use civ_engine::data::economy_society::parse_miasto_params;
use civ_engine::domain::building_costs::building_upgrades::{
    building_stat_summary_lines, building_structural_defense_bonus_line,
    building_structural_defense_bonus_percent, city_has_amfiteatr_line, city_has_biblioteka_line,
    city_has_mur_line, city_has_palac_line, city_palac_tier, group_built_building_ids,
    is_building_suppressed_from_production, upgrade_chain_steps, upgrade_composition_lines,
    upgrade_production_display_name, BuildingGroupLite, BuildingUpgradeLite, BUILDING_GROUP_ORDER,
};
use std::collections::HashMap;

fn b(id: &str, nazwa: &str, from: Option<&str>) -> BuildingUpgradeLite {
    BuildingUpgradeLite {
        id: id.to_string(),
        nazwa: nazwa.to_string(),
        upgrade_from: from.map(str::to_string),
        ..Default::default()
    }
}

fn map(pairs: &[(&str, f64)]) -> Option<HashMap<String, f64>> {
    Some(pairs.iter().map(|(k, v)| (k.to_string(), *v)).collect())
}

#[test]
fn suppressed_only_true_hides() {
    assert!(is_building_suppressed_from_production(Some(true)));
    assert!(!is_building_suppressed_from_production(Some(false)));
    assert!(!is_building_suppressed_from_production(None));
}

#[test]
fn upgrade_chain_is_oldest_first_and_trims_from() {
    let list = vec![
        b("a", "A", None),
        b("b", "B", Some(" a ")),
        b("c", "C", Some("b")),
    ];
    let ids: Vec<&str> = upgrade_chain_steps("c", &list)
        .iter()
        .map(|x| x.id.as_str())
        .collect();
    assert_eq!(ids, vec!["a", "b", "c"]);
    assert!(upgrade_chain_steps("nieistnieje", &list).is_empty());
}

#[test]
fn upgrade_chain_missing_predecessor_stops() {
    let list = vec![b("c", "C", Some("brak"))];
    let ids: Vec<&str> = upgrade_chain_steps("c", &list)
        .iter()
        .map(|x| x.id.as_str())
        .collect();
    assert_eq!(ids, vec!["c"]);
}

#[test]
fn upgrade_chain_cycle_terminates() {
    // Web zapetliloby sie; Rust przerywa na powtorzeniu (ZALOZENIE w module).
    let list = vec![b("x", "X", Some("y")), b("y", "Y", Some("x"))];
    assert_eq!(upgrade_chain_steps("x", &list).len(), 2);
}

#[test]
fn production_display_name_branches() {
    let list = vec![b("stara", "Stara", None), b("nowa", "Nowa", Some("stara"))];
    assert_eq!(
        upgrade_production_display_name(&list[1], &list),
        "Rozbuduj Stara → Nowa"
    );
    assert_eq!(upgrade_production_display_name(&list[0], &list), "Stara");
    let orphan = b("o", "Osierocony", Some("  nieznany "));
    assert_eq!(
        upgrade_production_display_name(&orphan, std::slice::from_ref(&orphan)),
        "Rozbuduj nieznany → Osierocony"
    );
}

#[test]
fn composition_lines_empty_for_single_step() {
    let list = vec![b("a", "A", None), b("b", "B", Some("a"))];
    assert!(upgrade_composition_lines("a", &list).is_empty());
    assert_eq!(
        upgrade_composition_lines("b", &list),
        vec![
            "Łańcuch: A → B".to_string(),
            "Bonusy w silniku = suma poprzednich poziomów (zapisane w JSON tego budynku)."
                .to_string(),
        ]
    );
}

#[test]
fn stat_summary_orders_keys_and_skips_zero_rows() {
    let mut def = b("magazyn", "Magazyn", None);
    def.baza = map(&[("pieniadz", 3.0), ("obrona", 0.0)]);
    def.przyrost = map(&[("pieniadz", 1.0), ("praca", 2.0)]);
    assert_eq!(
        building_stat_summary_lines(&def, None),
        vec!["praca +2/poz".to_string(), "pieniadz 3 +1/poz".to_string()]
    );
}

#[test]
fn stat_summary_mnoznik_line_uses_cumulative_chain_when_list_given() {
    let mut kuznia = b("kuznia", "Kuznia", None);
    kuznia.baza = map(&[("mnoznik", 10.0)]);
    let mut zelaza = b("kuznia_zelaza", "Kuznia zelaza", Some("kuznia"));
    zelaza.baza = map(&[("mnoznik", 20.0)]);
    let list = vec![kuznia, zelaza.clone()];
    assert_eq!(
        building_stat_summary_lines(&zelaza, Some(&list)),
        vec!["Pancerz (jednostki) +30%".to_string()]
    );
    // Bez listy: tylko wlasny procent (web: `def.baza?.mnoznik ?? 0`).
    assert_eq!(
        building_stat_summary_lines(&zelaza, None),
        vec!["Pancerz (jednostki) +20%".to_string()]
    );
}

#[test]
fn stat_summary_mnoznik_line_absent_for_unrecognised_building() {
    let mut def = b("magazyn", "Magazyn", None);
    def.baza = map(&[("mnoznik", 50.0)]);
    assert!(building_stat_summary_lines(&def, None).is_empty());
}

#[test]
fn city_presence_helpers() {
    assert!(city_has_biblioteka_line(&["akademia"]));
    assert!(!city_has_biblioteka_line(&["teatr"]));
    assert!(city_has_amfiteatr_line(&["teatr"]));
    assert!(city_has_mur_line(&["palisada"]));
    assert!(city_has_mur_line(&["fort"]));
    assert!(!city_has_mur_line(&["kuznia"]));
    assert!(city_has_palac_line(&["palac_ii"]));
    assert!(!city_has_palac_line(&[]));
}

#[test]
fn palac_tier_is_highest_present() {
    assert_eq!(city_palac_tier(&[]), None);
    assert_eq!(city_palac_tier(&["palac"]), Some(1));
    assert_eq!(city_palac_tier(&["palac", "palac_ii"]), Some(2));
    assert_eq!(
        city_palac_tier(&["palac_iii", "palac", "palac_ii"]),
        Some(3)
    );
}

#[test]
fn structural_defense_values_and_lines_match_web() {
    let params = parse_miasto_params().expect("miasto-params.json");
    assert_eq!(
        building_structural_defense_bonus_percent("palisada", &params),
        Some(100.0)
    );
    assert_eq!(
        building_structural_defense_bonus_percent("mury", &params),
        Some(200.0)
    );
    assert_eq!(
        building_structural_defense_bonus_percent("fort", &params),
        Some(100.0)
    );
    assert_eq!(
        building_structural_defense_bonus_percent("baszta", &params),
        Some(100.0)
    );
    assert_eq!(
        building_structural_defense_bonus_percent("kuznia", &params),
        None
    );
    assert_eq!(
        building_structural_defense_bonus_line("palisada", &params).as_deref(),
        Some("Obrona (jednostki broniące miasta) +100% — zastąpione przez Mury kamienne")
    );
    assert_eq!(
        building_structural_defense_bonus_line("mury", &params).as_deref(),
        Some("Obrona (jednostki broniące miasta) +200% — zastępuje Palisadę drewnianą")
    );
    assert_eq!(
        building_structural_defense_bonus_line("baszta", &params).as_deref(),
        Some("Obrona (jednostki broniące miasta) +100% dodatkowo (wymaga Murów w mieście)")
    );
    assert_eq!(
        building_structural_defense_bonus_line("kuznia", &params),
        None
    );
}

#[test]
fn group_built_buildings_fixed_order_fallback_last() {
    let defs = vec![
        BuildingGroupLite {
            id: "a".into(),
            grupa: Some("Wiara".into()),
        },
        BuildingGroupLite {
            id: "b".into(),
            grupa: None,
        },
        BuildingGroupLite {
            id: "c".into(),
            grupa: Some("  Zdrowie ".into()),
        },
        BuildingGroupLite {
            id: "d".into(),
            grupa: Some("   ".into()),
        },
        BuildingGroupLite {
            id: "e".into(),
            grupa: Some("Wiara".into()),
        },
        BuildingGroupLite {
            id: "f".into(),
            grupa: Some("Nowa grupa".into()),
        },
    ];
    let out = group_built_building_ids(&["e", "b", "c", "d", "a", "zzz", "f"], &defs);
    // Osiem grup zawsze obecnych w stalej kolejnosci.
    let names: Vec<&str> = out.iter().map(|g| g.grupa.as_str()).collect();
    assert_eq!(&names[..8], &BUILDING_GROUP_ORDER[..]);
    // Nieznane grupy na koncu w kolejnosci wystapienia: "Inne" (b, d, zzz) a potem "Nowa grupa" (f).
    assert_eq!(names[8], "Inne");
    assert_eq!(names[9], "Nowa grupa");
    assert_eq!(names.len(), 10);
    let wiara = out.iter().find(|g| g.grupa == "Wiara").unwrap();
    assert_eq!(wiara.ids, vec!["e".to_string(), "a".to_string()]);
    let zdrowie = out.iter().find(|g| g.grupa == "Zdrowie").unwrap();
    assert_eq!(zdrowie.ids, vec!["c".to_string()]);
    let inne = &out[8];
    assert_eq!(
        inne.ids,
        vec!["b".to_string(), "d".to_string(), "zzz".to_string()]
    );
    let puste = out.iter().find(|g| g.grupa == "Żywność").unwrap();
    assert!(puste.ids.is_empty());
}
