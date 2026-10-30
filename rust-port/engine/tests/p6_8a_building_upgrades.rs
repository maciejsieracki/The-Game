//! P6.8A-P1 (pin webu 91dc998a): helpery `gra/src/game/building-upgrades.ts` bez zaleznosci od danych.
//!
//! UWAGA (Operator R1): wektory tu sa wyprowadzone recznie z kodu TS (nie z uruchomionego weba).
//! Wektory z uruchomionego weba (generator) - NASTEPNA-PARTIA / R2.

use civ_engine::domain::production_units::{
    building_structural_defense_bonus_line, building_structural_defense_bonus_percent,
    city_has_amfiteatr_line, city_has_biblioteka_line, city_has_mur_line, city_has_palac_line,
    city_palac_tier, group_built_building_ids, is_building_suppressed_from_production,
    structural_defense_param_key, upgrade_chain_steps, upgrade_composition_lines,
    upgrade_production_display_name, BuildingGroupLite, BuildingUpgradeLite,
    BUILDING_GROUP_FALLBACK, BUILDING_GROUP_ORDER,
};

fn b(id: &str, nazwa: &str, from: Option<&str>, suppressed: Option<bool>) -> BuildingUpgradeLite {
    BuildingUpgradeLite {
        id: id.to_string(),
        nazwa: nazwa.to_string(),
        upgrade_from: from.map(|s| s.to_string()),
        suppressed,
    }
}

fn catalog() -> Vec<BuildingUpgradeLite> {
    vec![
        b("palisada", "Palisada", None, None),
        b("mury", "Mury", Some("palisada"), None),
        b("fort", "Cytadela", Some("mury"), None),
        b("teatr", "Teatr", None, Some(true)),
        b("palac", "Pałac", None, None),
        b("palac_ii", "Pałac II", Some("palac"), None),
        b("palac_iii", "Pałac III", Some("palac_ii"), None),
        b("akademia", "Akademia", Some("  "), None),
    ]
}

#[test]
fn suppressed_only_when_strictly_true() {
    assert!(is_building_suppressed_from_production(&b(
        "teatr",
        "T",
        None,
        Some(true)
    )));
    assert!(!is_building_suppressed_from_production(&b(
        "teatr",
        "T",
        None,
        Some(false)
    )));
    assert!(!is_building_suppressed_from_production(&b(
        "teatr", "T", None, None
    )));
}

#[test]
fn chain_duplicate_ids_last_entry_wins_like_js_map() {
    // web: `new Map(buildings.map(b => [b.id, b]))` -- ostatni duplikat wygrywa.
    let cat = vec![
        b("x", "Stara", None, None),
        b("y", "Nastepca", Some("x"), None),
        b("x", "Nowa", None, None),
    ];
    let names: Vec<&str> = upgrade_chain_steps("y", &cat)
        .iter()
        .map(|x| x.nazwa.as_str())
        .collect();
    assert_eq!(names, vec!["Nowa", "Nastepca"]);
}

#[test]
fn chain_is_oldest_first_and_stops_at_root() {
    let cat = catalog();
    let ids: Vec<&str> = upgrade_chain_steps("fort", &cat)
        .iter()
        .map(|x| x.id.as_str())
        .collect();
    assert_eq!(ids, vec!["palisada", "mury", "fort"]);
    let single: Vec<&str> = upgrade_chain_steps("palisada", &cat)
        .iter()
        .map(|x| x.id.as_str())
        .collect();
    assert_eq!(single, vec!["palisada"]);
}

#[test]
fn chain_empty_for_unknown_id_and_blank_upgrade_from_is_root() {
    let cat = catalog();
    assert!(upgrade_chain_steps("nieistnieje", &cat).is_empty());
    let ids: Vec<&str> = upgrade_chain_steps("akademia", &cat)
        .iter()
        .map(|x| x.id.as_str())
        .collect();
    assert_eq!(ids, vec!["akademia"]);
}

#[test]
fn chain_missing_predecessor_keeps_successor() {
    let cat = vec![b("mury", "Mury", Some("palisada_brak"), None)];
    let ids: Vec<&str> = upgrade_chain_steps("mury", &cat)
        .iter()
        .map(|x| x.id.as_str())
        .collect();
    assert_eq!(ids, vec!["mury"]);
}

#[test]
fn chain_cycle_guard_terminates() {
    let cat = vec![b("a", "A", Some("b"), None), b("b", "B", Some("a"), None)];
    let ids: Vec<&str> = upgrade_chain_steps("a", &cat)
        .iter()
        .map(|x| x.id.as_str())
        .collect();
    assert_eq!(ids, vec!["b", "a"]);
}

#[test]
fn display_name_for_upgrade_and_plain() {
    let cat = catalog();
    assert_eq!(
        upgrade_production_display_name(&cat[1], &cat),
        "Rozbuduj Palisada → Mury"
    );
    assert_eq!(upgrade_production_display_name(&cat[0], &cat), "Palisada");
    let orphan = b("x", "Iks", Some("brak"), None);
    assert_eq!(
        upgrade_production_display_name(&orphan, &cat),
        "Rozbuduj brak → Iks"
    );
}

#[test]
fn composition_lines_empty_for_root_two_lines_for_chain() {
    let cat = catalog();
    assert!(upgrade_composition_lines("palisada", &cat).is_empty());
    let lines = upgrade_composition_lines("mury", &cat);
    assert_eq!(lines.len(), 2);
    assert_eq!(lines[0], "Łańcuch: Palisada → Mury");
}

#[test]
fn city_building_line_predicates() {
    assert!(city_has_biblioteka_line(&["akademia"]));
    assert!(!city_has_biblioteka_line(&["teatr"]));
    assert!(city_has_amfiteatr_line(&["teatr"]));
    assert!(!city_has_amfiteatr_line(&["biblioteka"]));
    assert!(city_has_mur_line(&["palisada"]));
    assert!(city_has_mur_line(&["fort"]));
    assert!(!city_has_mur_line(&["baszta"]));
    assert!(city_has_palac_line(&["palac_ii"]));
    assert!(!city_has_palac_line(&[]));
}

#[test]
fn palac_tier_takes_highest_and_none_when_absent() {
    assert_eq!(city_palac_tier(&[]), None);
    assert_eq!(city_palac_tier(&["palac"]), Some(1));
    assert_eq!(
        city_palac_tier(&["palac", "palac_iii", "palac_ii"]),
        Some(3)
    );
    assert_eq!(city_palac_tier(&["palac", "palac_ii"]), Some(2));
}

#[test]
fn structural_defense_keys_and_percent_rules() {
    assert_eq!(
        structural_defense_param_key("palisada"),
        Some("bonus_obrona_palisada_proc")
    );
    assert_eq!(
        structural_defense_param_key("fort"),
        Some("bonus_obrona_cytadela_proc")
    );
    assert_eq!(structural_defense_param_key("akademia"), None);
    assert_eq!(
        building_structural_defense_bonus_percent("mury", Some(25.0)),
        Some(25.0)
    );
    assert_eq!(
        building_structural_defense_bonus_percent("mury", Some(0.0)),
        None
    );
    assert_eq!(
        building_structural_defense_bonus_percent("mury", Some(-5.0)),
        None
    );
    assert_eq!(
        building_structural_defense_bonus_percent("mury", None),
        None
    );
    assert_eq!(
        building_structural_defense_bonus_percent("akademia", Some(25.0)),
        None
    );
}

#[test]
fn structural_defense_lines_per_building() {
    assert_eq!(
        building_structural_defense_bonus_line("palisada", Some(10.0)).as_deref(),
        Some("Obrona (jednostki broniące miasta) +10% — zastąpione przez Mury kamienne")
    );
    assert_eq!(
        building_structural_defense_bonus_line("fort", Some(15.5)).as_deref(),
        Some("Obrona (jednostki broniące miasta) +15.5% dodatkowo (wymaga Murów w mieście)")
    );
    assert_eq!(
        building_structural_defense_bonus_line("fort", Some(0.0)),
        None
    );
}

#[test]
fn group_order_is_eight_and_all_present_when_empty() {
    assert_eq!(BUILDING_GROUP_ORDER.len(), 8);
    let groups = group_built_building_ids(&[], &[]);
    let names: Vec<&str> = groups.iter().map(|g| g.grupa.as_str()).collect();
    assert_eq!(names, BUILDING_GROUP_ORDER.to_vec());
    assert!(groups.iter().all(|g| g.ids.is_empty()));
}

#[test]
fn group_assigns_in_builtin_order_with_fallback_appended_last() {
    let defs = vec![
        BuildingGroupLite {
            id: "mury".into(),
            grupa: Some("Wojsko i obrona".into()),
        },
        BuildingGroupLite {
            id: "biblioteka".into(),
            grupa: Some(" Nauka i kultura ".into()),
        },
        BuildingGroupLite {
            id: "palisada".into(),
            grupa: Some("Wojsko i obrona".into()),
        },
        BuildingGroupLite {
            id: "dziwny".into(),
            grupa: None,
        },
        BuildingGroupLite {
            id: "pusty".into(),
            grupa: Some("   ".into()),
        },
    ];
    let groups = group_built_building_ids(
        &["palisada", "biblioteka", "mury", "dziwny", "pusty"],
        &defs,
    );
    assert_eq!(groups.len(), 9);
    let wojsko = groups
        .iter()
        .find(|g| g.grupa == "Wojsko i obrona")
        .unwrap();
    assert_eq!(wojsko.ids, vec!["palisada".to_string(), "mury".to_string()]);
    let nauka = groups
        .iter()
        .find(|g| g.grupa == "Nauka i kultura")
        .unwrap();
    assert_eq!(nauka.ids, vec!["biblioteka".to_string()]);
    let last = groups.last().unwrap();
    assert_eq!(last.grupa, BUILDING_GROUP_FALLBACK);
    assert_eq!(last.ids, vec!["dziwny".to_string(), "pusty".to_string()]);
}
