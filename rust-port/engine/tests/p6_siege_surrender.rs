//! R-RUSTPORT-P6-SIEGE-SURRENDER-Q1 (W8 3/3): testy kapitulacji oblezenia na wektorach z pinu 07d2fbd72.
//!
//! Wektory: `tests/p6_siege_surrender_vectors/vectors.json`, generator `tests/p6_siege_surrender_gen.mjs`
//! (transkrypcja blokow main.ts z numerami linii w naglowku generatora; web nie jest bundlowany - closure w main.ts).
//! Testy scenariuszowe lacza [`siege_city_turn`] (decyzja ticka, W7) z funkcjami kapitulacji tego modulu.

use civ_engine::domain::siege_enter_city::{
    enter_city_after_surrender, EnterCity, EnterUnit, SiegeEnterDeps,
};
use civ_engine::domain::siege_starvation::{SiegeGarrisonUnit, SiegeStarvationCity};
use civ_engine::domain::siege_surrender::{
    end_map_siege_fields, handle_siege_capitulation_phase, resolve_surrender_path,
    surrender_population_after, transfer_removal_ids, CapitulationAction, SurrenderPath,
};
use civ_engine::domain::siege_turn::siege_city_turn;
use serde_json::Value;

const DATA: &str = include_str!("p6_siege_surrender_vectors/vectors.json");

fn vectors() -> Value {
    serde_json::from_str(DATA).expect("wektory JSON")
}

fn parse_food(v: &Value) -> f64 {
    match v {
        Value::String(s) if s == "NaN" => f64::NAN,
        other => other.as_f64().expect("liczba"),
    }
}

fn expect_action(s: &str) -> CapitulationAction {
    match s {
        "resolve" => CapitulationAction::Resolve,
        "setPending" => CapitulationAction::SetPending,
        "hold" => CapitulationAction::Hold,
        other => panic!("nieznana akcja {other}"),
    }
}

fn expect_path(s: &str) -> SurrenderPath {
    match s {
        "noCity" => SurrenderPath::NoCity,
        "notEnemy" => SurrenderPath::NotEnemy,
        "noCaptor" => SurrenderPath::NoCaptor,
        "transfer" => SurrenderPath::Transfer,
        other => panic!("nieznana galaz {other}"),
    }
}

#[test]
fn vectors_phase_match_pin() {
    let v = vectors();
    for (i, case) in v["phase"].as_array().unwrap().iter().enumerate() {
        let food = parse_food(&case["food"]);
        let got = handle_siege_capitulation_phase(case["pending"].as_bool().unwrap(), food);
        assert_eq!(
            got,
            expect_action(case["expect"].as_str().unwrap()),
            "phase #{i}"
        );
    }
}

#[test]
fn vectors_path_match_pin() {
    let v = vectors();
    for (i, case) in v["path"].as_array().unwrap().iter().enumerate() {
        let pairs: Vec<(i64, i64, bool)> = case["enemyPairs"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| {
                (
                    p[0].as_i64().unwrap(),
                    p[1].as_i64().unwrap(),
                    p[2].as_bool().unwrap(),
                )
            })
            .collect();
        let enemy = |a: i64, b: i64| -> bool {
            if a == b {
                return false;
            }
            if a == 9 || b == 9 {
                return true;
            }
            pairs
                .iter()
                .find(|(x, y, _)| *x == a && *y == b)
                .map(|t| t.2)
                .unwrap_or(false)
        };
        let besieger = case["besieger"].as_i64();
        let got = resolve_surrender_path(
            case["cityFound"].as_bool().unwrap(),
            case["cityOwner"].as_i64().unwrap(),
            besieger,
            &enemy,
        );
        assert_eq!(
            got,
            expect_path(case["expect"].as_str().unwrap()),
            "path #{i}"
        );
    }
}

#[test]
fn vectors_removal_match_pin() {
    let v = vectors();
    for (i, case) in v["removal"].as_array().unwrap().iter().enumerate() {
        let units: Vec<EnterUnit> = case["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|u| EnterUnit {
                id: u["id"].as_str().unwrap().to_string(),
                owner_id: u["ownerId"].as_i64().unwrap(),
                q: u["q"].as_i64().unwrap(),
                r: u["r"].as_i64().unwrap(),
                ..Default::default()
            })
            .collect();
        let city = EnterCity {
            id: "c".into(),
            q: case["city"]["q"].as_i64().unwrap(),
            r: case["city"]["r"].as_i64().unwrap(),
        };
        let got = transfer_removal_ids(&units, &city, case["oldOwner"].as_i64().unwrap());
        let want: Vec<String> = case["expect"]
            .as_array()
            .unwrap()
            .iter()
            .map(|s| s.as_str().unwrap().to_string())
            .collect();
        assert_eq!(got, want, "removal #{i}");
    }
}

#[test]
fn vectors_end_and_population_match_pin() {
    let v = vectors();
    for case in v["end_and_pop"]["ends"].as_array().unwrap() {
        let mut c = SiegeStarvationCity {
            oblegane: Some(true),
            siege_capitulation_pending: case["before"]["siegeCapitulationPending"].as_bool(),
            siege_starve_start_max_hp: case["before"]["siegeStarveStartMaxHp"].as_f64(),
        };
        end_map_siege_fields(&mut c);
        assert_eq!(c.oblegane, Some(false));
        assert_eq!(c.siege_capitulation_pending, Some(false));
        assert_eq!(c.siege_starve_start_max_hp, None);
    }
    for case in v["end_and_pop"]["pops"].as_array().unwrap() {
        let got = surrender_population_after(parse_food(&case["pop"]));
        let want = parse_food(&case["expect"]);
        if want.is_nan() {
            assert!(got.is_nan());
        } else {
            assert_eq!(got, want);
        }
    }
}

// --- Scenariusze: lancuch siege_city_turn (W7) -> kapitulacja (W8 3/3) ---

fn unit(hp: f64, max: f64) -> SiegeGarrisonUnit {
    SiegeGarrisonUnit {
        hp: Some(hp),
        hp_max: Some(max),
        type_id: None,
    }
}

fn besieged(start: Option<f64>) -> SiegeStarvationCity {
    SiegeStarvationCity {
        oblegane: Some(true),
        siege_capitulation_pending: None,
        siege_starve_start_max_hp: start,
    }
}

const NO_HP: &dyn Fn(&str) -> f64 = &|_| 0.0;

#[test]
fn scenario_no_food_without_garrison_sets_pending_then_resolves() {
    // Tick 1: zapasy 0, brak garnizonu -> legacy pending, faza ustawia flage.
    let d = siege_city_turn(&besieged(None), &[], 0.0, NO_HP, Vec::new);
    assert!(d.legacy_pending && !d.surrender);
    assert_eq!(
        handle_siege_capitulation_phase(false, 0.0),
        CapitulationAction::SetPending
    );
    // Tick 2: flaga ustawiona -> przejecie (resolve).
    assert_eq!(
        handle_siege_capitulation_phase(true, 0.0),
        CapitulationAction::Resolve
    );
}

#[test]
fn scenario_attrition_without_surrender_holds_city() {
    // Garnizon 9/10 przy starcie 10: atrycja do 7/10 (0,7 >= 0,5) -> miasto trzyma, brak kapitulacji.
    let d = siege_city_turn(
        &besieged(Some(10.0)),
        &[unit(9.0, 10.0)],
        0.0,
        NO_HP,
        || vec![unit(7.0, 10.0)],
    );
    assert!(d.attrition_applied && !d.surrender && !d.legacy_pending);
    assert_eq!(
        handle_siege_capitulation_phase(false, 0.0),
        CapitulationAction::SetPending
    );
}

#[test]
fn scenario_surrender_with_garrison_removes_defenders_and_enters() {
    // Garnizon 4/10 przy starcie 10 -> kapitulacja w tym ticku; obroncy wlasciciela 1 znikaja z heksu,
    // wchodzi armia oblegajaca (owner 2).
    let d = siege_city_turn(
        &besieged(Some(10.0)),
        &[unit(4.0, 10.0)],
        0.0,
        NO_HP,
        || vec![unit(4.0, 10.0)],
    );
    assert!(d.surrender);
    let city = EnterCity {
        id: "c".into(),
        q: 0,
        r: 0,
    };
    let mk = |id: &str, owner: i64, q: i64, r: i64, oblega: Option<&str>| EnterUnit {
        id: id.into(),
        owner_id: owner,
        q,
        r,
        oblega_city_id: oblega.map(str::to_string),
        category: "land".into(),
        type_id: "inf".into(),
        ..Default::default()
    };
    let mut units = vec![
        mk("def", 1, 0, 0, None),
        mk("att1", 2, 1, 0, Some("c")),
        mk("att2", 2, 1, 0, Some("c")),
    ];
    assert_eq!(
        resolve_surrender_path(true, 1, Some(2), &|a, b| a != b),
        SurrenderPath::Transfer
    );
    let removed = transfer_removal_ids(&units, &city, 1);
    assert_eq!(removed, vec!["def"]);
    units.retain(|u| !removed.contains(&u.id));
    let deps = SiegeEnterDeps {
        is_civilian: &|_| false,
        stack_limit: None,
    };
    let entered = enter_city_after_surrender(&mut units, &city, 2, &deps);
    assert!(!entered.is_empty());
    assert!(entered.iter().all(|id| id.starts_with("att")));
}

#[test]
fn scenario_surrender_without_garrison_has_no_removals() {
    // Kapitulacja bez garnizonu (flaga pending + przejecie): brak obroncow do usuniecia, pop >= 1.
    let city = EnterCity {
        id: "c".into(),
        q: 5,
        r: 5,
    };
    let units = vec![EnterUnit {
        id: "att".into(),
        owner_id: 2,
        q: 5,
        r: 5,
        ..Default::default()
    }];
    assert!(transfer_removal_ids(&units, &city, 1).is_empty());
    assert_eq!(surrender_population_after(0.0), 1.0);
}

#[test]
fn scenario_no_decision_leaves_city_untouched() {
    // Zapasy > 0, brak decyzji: brak akcji fazy i brak galezi przejecia (bez zmian w miescie).
    let d = siege_city_turn(&besieged(None), &[unit(10.0, 10.0)], 5.0, NO_HP, || {
        panic!("atrycja nie powinna byc wywolana")
    });
    assert_eq!(d, Default::default());
    assert_eq!(
        handle_siege_capitulation_phase(false, 5.0),
        CapitulationAction::Hold
    );
    assert_eq!(
        resolve_surrender_path(true, 1, None, &|_, _| true),
        SurrenderPath::NoCaptor
    );
}
