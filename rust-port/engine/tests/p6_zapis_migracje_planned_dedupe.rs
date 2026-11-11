//! P6-ZAPIS-MIGRACJE (r4): `planned_marches_to_save` zachowuje semantyke JS `Map` (web trzyma
//! plannedMarches w Map): powtorzony klucz nadpisuje wartosc, zachowuje pierwsza pozycje,
//! a `autoMarch` wskazuje pierwszy klucz z wartoscia koncowa.

use civ_engine::domain::pathfinding::ruch_jednostek::{planned_marches_to_save, PlannedMarchDest};

fn dest(q: f64, r: f64) -> PlannedMarchDest {
    PlannedMarchDest {
        dest_q: q,
        dest_r: r,
        attack_unit_id: None,
        general_target_id: None,
    }
}

#[test]
fn p6_zapis_migracje_planned_duplicate_key_overwrites_like_js_map() {
    let marches = vec![
        ("7".to_string(), dest(1.0, 1.0)),
        ("3".to_string(), dest(2.0, 2.0)),
        ("7".to_string(), dest(5.0, 5.0)),
    ];
    let out = planned_marches_to_save(&marches);
    let planned = out.planned_marches.expect("niepuste");
    assert_eq!(planned.len(), 2, "klucz 7 tylko raz");
    assert_eq!(planned[0].0, "7");
    assert_eq!(
        (planned[0].1.dest_q, planned[0].1.dest_r),
        (5.0, 5.0),
        "wartosc koncowa"
    );
    assert_eq!(planned[1].0, "3");
    assert_eq!(out.auto_march, Some(("7".to_string(), 5.0, 5.0)));
}

#[test]
fn p6_zapis_migracje_planned_unique_keys_unchanged() {
    let marches = vec![
        ("3".to_string(), dest(2.0, 2.0)),
        ("7".to_string(), dest(1.0, 1.0)),
    ];
    let out = planned_marches_to_save(&marches);
    assert_eq!(out.auto_march, Some(("3".to_string(), 2.0, 2.0)));
    assert_eq!(out.planned_marches.expect("niepuste").len(), 2);
    assert!(planned_marches_to_save(&[]).planned_marches.is_none());
}
