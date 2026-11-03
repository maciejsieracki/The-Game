//! R-RUSTPORT-P6-ECON-TICK-EMPIREFOOD-Q1 (R1 obrona, zarzut A05): test jednostkowy granicy `maxHp <= 0`
//! w `applyArmyStarvationHpLoss` (`army-starvation.ts:58`), nieosiagalnej z `units.json`, ale funkcja jest publiczna.

use civ_engine::domain::turn_economy_attrition::{apply_army_starvation_hp_loss, AttritionUnit};

fn unit(hp: Option<f64>, hp_max: Option<f64>) -> AttritionUnit {
    AttritionUnit {
        id: "u1".into(),
        owner_id: 1,
        type_id: "Wojownik".into(),
        category: "piechota".into(),
        hp,
        hp_max,
        oblega_city_id: None,
        in_garnizon: false,
        q: 0.0,
        r: 0.0,
    }
}

#[test]
fn zero_max_hp_is_skipped_and_unit_untouched() {
    // hpMax = 0 -> `maxHp <= 0` -> continue (bez zmian, bez zliczenia). Mutant `< 0` zadalby strate 1 HP.
    let mut us = vec![unit(Some(5.0), Some(0.0))];
    let r = apply_army_starvation_hp_loss(&mut us, 1, 0.5, &|_| 10.0);
    assert_eq!(r.damaged_count, 0);
    assert!(r.destroyed_ids.is_empty());
    assert_eq!(us[0].hp, Some(5.0));
    assert_eq!(us[0].hp_max, Some(0.0));
}

#[test]
fn zero_max_hp_from_getter_is_skipped() {
    let mut us = vec![unit(None, None)];
    let r = apply_army_starvation_hp_loss(&mut us, 1, 0.5, &|_| 0.0);
    assert_eq!(r.damaged_count, 0);
    assert_eq!(us[0].hp, None);
    assert_eq!(us[0].hp_max, None);
}

#[test]
fn positive_max_hp_is_damaged() {
    let mut us = vec![unit(Some(10.0), Some(10.0))];
    let r = apply_army_starvation_hp_loss(&mut us, 1, 0.5, &|_| 10.0);
    assert_eq!(r.damaged_count, 1);
    assert_eq!(us[0].hp, Some(5.0));
}
