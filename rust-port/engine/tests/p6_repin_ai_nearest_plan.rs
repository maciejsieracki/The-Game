//! P6-REPIN-AI-PRIORYTETY-CEL-Q1 (FALA 553 NEARCITY, dlug "REPIN wyboru celu"): remis odleglosci w planerze.
//!
//! Web `tieBeforeTarget` (warAllInCapital.ts:413): gdy oba cele maja `defenders` -- slabiej broniony, potem
//! nizsze id miasta; inaczej `cmpTarget` (q, r, id). Rust: `plan_war_all_in_capital_with_defenders`.

use std::collections::{HashMap, HashSet};

use civ_engine::domain::pathfinding::ruch_jednostek::{Klucz, RuchHex, RuchMapa, TerenBazowy};
use civ_engine::domain::war_all_in_capital::{
    plan_war_all_in_capital, plan_war_all_in_capital_with_defenders, WarAllInPlanOpts,
    WarAllInUnit, WarCapitalTarget,
};
use civ_engine::domain::war_all_in_capital_nav::WarAllInNav;
use civ_engine::domain::war_target_select::{split_city_targets, WarCityTarget};

fn land_map(w: i32, h: i32) -> RuchMapa {
    let mut map = RuchMapa::new();
    for q in 0..w {
        for r in 0..h {
            map.insert((q, r), RuchHex::new(TerenBazowy::Laka));
        }
    }
    map
}

fn city(owner: i64, id: &str, q: i32, r: i32, defenders: Option<i64>) -> WarCityTarget {
    WarCityTarget {
        target: WarCapitalTarget {
            owner_id: owner,
            city_id: id.to_string(),
            q,
            r,
        },
        defenders,
    }
}

#[test]
fn remis_odleglosci_wybiera_slabiej_bronione_miasto() {
    let map = land_map(10, 4);
    let blocked: HashSet<Klucz> = HashSet::new();
    let nav = WarAllInNav {
        map: &map,
        allow_sea: false,
        blocked: &blocked,
        occupied: None,
    };
    let units = [WarAllInUnit {
        id: "u1".to_string(),
        q: 0,
        r: 0,
        ruch_left: None,
    }];
    // Z (0,0): "a" (3,1) i "b" (4,0) sa obie w odleglosci 4 (remis). cmpTarget wybralby "a" (mniejsze q).
    let targets = vec![city(2, "a", 3, 1, Some(3)), city(2, "b", 4, 0, Some(1))];
    let (plain, defs) = split_city_targets(&targets);
    assert_eq!(defs.get("a"), Some(&3));
    assert_eq!(defs.get("b"), Some(&1));

    let with = plan_war_all_in_capital_with_defenders(
        &units,
        &plain,
        &defs,
        &nav,
        WarAllInPlanOpts::default(),
    );
    assert_eq!(
        with.orders.first().map(|o| o.target_city_id.as_str()),
        Some("b")
    );

    // Bez defenders (stolice / stara sciezka): dokladnie dotychczasowy cmpTarget -> "a".
    let without = plan_war_all_in_capital(&units, &plain, &nav, WarAllInPlanOpts::default());
    assert_eq!(
        without.orders.first().map(|o| o.target_city_id.as_str()),
        Some("a")
    );
    let empty: HashMap<String, i64> = HashMap::new();
    let same = plan_war_all_in_capital_with_defenders(
        &units,
        &plain,
        &empty,
        &nav,
        WarAllInPlanOpts::default(),
    );
    assert_eq!(same, without);
}

#[test]
fn remis_defenders_rowne_wybiera_nizsze_id_miasta() {
    let map = land_map(10, 4);
    let blocked: HashSet<Klucz> = HashSet::new();
    let nav = WarAllInNav {
        map: &map,
        allow_sea: false,
        blocked: &blocked,
        occupied: None,
    };
    let units = [WarAllInUnit {
        id: "u1".to_string(),
        q: 0,
        r: 0,
        ruch_left: None,
    }];
    let targets = vec![city(2, "z", 3, 1, Some(2)), city(2, "m", 4, 0, Some(2))];
    let (plain, defs) = split_city_targets(&targets);
    let got = plan_war_all_in_capital_with_defenders(
        &units,
        &plain,
        &defs,
        &nav,
        WarAllInPlanOpts::default(),
    );
    assert_eq!(
        got.orders.first().map(|o| o.target_city_id.as_str()),
        Some("m")
    );
}
