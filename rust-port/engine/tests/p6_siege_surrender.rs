//! R-RUSTPORT-P6-SIEGE-SURRENDER-Q1 (W8 3/3): testy kapitulacji oblezenia na wektorach z pinu 07d2fbd72.
//!
//! Wektory: `tests/p6_siege_surrender_vectors/vectors.json`, generator `tests/p6_siege_surrender_gen.mjs`.
//! Generator WYKONUJE wycinki funkcji z pinu (`resolveSiegeSurrender`, `endMapSiege`, `besiegerOwnerForCity`,
//! `handleSiegeCapitulationPhase`, `hexDistance`) w `with` na Proxy; oczekiwania sa wynikiem tego wykonania,
//! nie reczna transkrypcja. Galaz `resolveSiegeSurrender` jest odczytywana z logu wywolan pinu.

use civ_engine::domain::siege_enter_city::{
    enter_city_after_surrender, EnterCity, EnterUnit, SiegeEnterDeps,
};
use civ_engine::domain::siege_starvation::{SiegeGarrisonUnit, SiegeStarvationCity};
use civ_engine::domain::siege_surrender::{
    besieger_owner_for_city, end_map_siege_fields, handle_siege_capitulation_phase,
    resolve_surrender_path, surrender_population_after, surrender_tick_action,
    transfer_removal_ids, BesiegerCity, BesiegerUnit, CapitulationAction, SurrenderPath,
    SurrenderTickAction,
};
use civ_engine::domain::siege_turn::{siege_city_turn, SiegeTurnDecision};
use serde_json::Value;

const DATA: &str = include_str!("p6_siege_surrender_vectors/vectors.json");

fn vectors() -> Value {
    serde_json::from_str(DATA).expect("wektory JSON")
}

fn parse_num(v: &Value) -> f64 {
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
    let cases = v["phase"].as_array().unwrap();
    assert!(cases.len() >= 100);
    for (i, case) in cases.iter().enumerate() {
        let food = parse_num(&case["food"]);
        let got = handle_siege_capitulation_phase(case["pending"].as_bool().unwrap(), food);
        assert_eq!(
            got,
            expect_action(case["expect"].as_str().unwrap()),
            "phase #{i}"
        );
    }
}

#[test]
fn vectors_besieger_match_pin() {
    let v = vectors();
    let cases = v["besieger"].as_array().unwrap();
    assert!(cases.len() >= 30);
    for (i, case) in cases.iter().enumerate() {
        let c = &case["city"];
        let city = BesiegerCity {
            owner_id: c["ownerId"].as_i64().unwrap(),
            q: c["q"].as_i64().unwrap(),
            r: c["r"].as_i64().unwrap(),
            oblegajacy_owner_id: c["oblegajacyOwnerId"].as_i64(),
        };
        let units: Vec<BesiegerUnit> = case["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|u| BesiegerUnit {
                owner_id: u["ownerId"].as_i64().unwrap(),
                q: u["q"].as_i64().unwrap(),
                r: u["r"].as_i64().unwrap(),
            })
            .collect();
        let got = besieger_owner_for_city(&city, case["stored"].as_i64(), &units);
        assert_eq!(got, case["expect"].as_i64(), "besieger #{i}");
    }
}

#[test]
fn vectors_path_match_pin() {
    let v = vectors();
    let cases = v["path"].as_array().unwrap();
    assert!(cases.len() >= 200);
    for (i, case) in cases.iter().enumerate() {
        // Tablica wrogosci z pinu (areEnemyOwners wykonany w generatorze), bez zadnej reguly po stronie Rust.
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
            pairs
                .iter()
                .find(|(x, y, _)| *x == a && *y == b)
                .map(|t| t.2)
                .expect("para z tablicy pinu")
        };
        let got = resolve_surrender_path(
            case["cityFound"].as_bool().unwrap(),
            case["cityOwner"].as_i64().unwrap(),
            case["besieger"].as_i64(),
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
    let cases = v["removal"].as_array().unwrap();
    assert!(cases.len() >= 80);
    let mut non_empty = 0;
    for (i, case) in cases.iter().enumerate() {
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
        if !want.is_empty() {
            non_empty += 1;
        }
        assert_eq!(got, want, "removal #{i}");
    }
    assert!(
        non_empty >= 5,
        "za malo przypadkow z usunieciem: {non_empty}"
    );
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
        let want = &case["expect"];
        // Web `undefined` po `delete` = Rust None; `Some(false)` odpowiada web `false`.
        assert_eq!(
            c.oblegane,
            Some(want["oblegane"].as_bool().unwrap()),
            "oblegane"
        );
        assert_eq!(
            c.siege_capitulation_pending,
            Some(want["siegeCapitulationPending"].as_bool().unwrap()),
            "pending"
        );
        assert_eq!(
            c.siege_starve_start_max_hp,
            want["siegeStarveStartMaxHp"].as_f64(),
            "start"
        );
    }
    for case in v["end_and_pop"]["pops"].as_array().unwrap() {
        let got = surrender_population_after(parse_num(&case["pop"]));
        let want = parse_num(&case["expect"]);
        if want.is_nan() {
            assert!(got.is_nan());
        } else {
            assert_eq!(got, want);
        }
    }
}

// --- Lacznik decyzja -> akcja i scenariusze lancucha siege_city_turn (W7) -> kapitulacja (W8 3/3) ---

fn unit(hp: f64, max: f64) -> SiegeGarrisonUnit {
    SiegeGarrisonUnit {
        hp: Some(hp),
        hp_max: Some(max),
        type_id: None,
    }
}

fn besieged(start: Option<f64>, pending: Option<bool>) -> SiegeStarvationCity {
    SiegeStarvationCity {
        oblegane: Some(true),
        siege_capitulation_pending: pending,
        siege_starve_start_max_hp: start,
    }
}

const NO_HP: &dyn Fn(&str) -> f64 = &|_| 0.0;

#[test]
fn scenario_no_food_without_garrison_sets_pending_then_surrenders() {
    // Tick 1: zapasy 0, brak garnizonu -> legacy; lacznik wola faze, ktora ustawia flage (web C3-Q3=B).
    let d1 = siege_city_turn(&besieged(None, None), &[], 0.0, NO_HP, Vec::new);
    assert!(d1.legacy_pending && !d1.surrender);
    assert_eq!(
        surrender_tick_action(&d1, false, 0.0),
        SurrenderTickAction::CapitulationPhase(CapitulationAction::SetPending)
    );
    // Tick 2: flaga ustawiona. Web: siegeStarvationState zwraca surrender (nie legacy), wiec lacznik daje
    // Surrender -> resolveSiegeSurrender. Galaz CapitulationPhase(Resolve) nie wystepuje w tym przeplywie.
    let d2 = siege_city_turn(&besieged(None, Some(true)), &[], 0.0, NO_HP, Vec::new);
    assert!(d2.surrender && !d2.legacy_pending);
    assert_eq!(
        surrender_tick_action(&d2, true, 0.0),
        SurrenderTickAction::Surrender
    );
}

#[test]
fn scenario_attrition_without_surrender_holds_city() {
    // Garnizon 9/10 przy starcie 10: atrycja do 7/10 (0,7 >= 0,5) -> miasto trzyma, brak kapitulacji.
    let d = siege_city_turn(
        &besieged(Some(10.0), None),
        &[unit(9.0, 10.0)],
        0.0,
        NO_HP,
        || vec![unit(7.0, 10.0)],
    );
    assert!(d.attrition_applied && !d.surrender && !d.legacy_pending);
    // Lacznik nie wola niczego: brak zmiany stanu miasta w tym ticku.
    assert_eq!(
        surrender_tick_action(&d, false, 0.0),
        SurrenderTickAction::None
    );
}

#[test]
fn scenario_surrender_with_garrison_removes_defenders_and_enters() {
    // Garnizon 4/10 przy starcie 10 -> kapitulacja w tym ticku; obroncy wlasciciela 1 znikaja z heksu,
    // wchodzi armia oblegajaca (owner 2).
    let d = siege_city_turn(
        &besieged(Some(10.0), None),
        &[unit(4.0, 10.0)],
        0.0,
        NO_HP,
        || vec![unit(4.0, 10.0)],
    );
    assert_eq!(
        surrender_tick_action(&d, false, 0.0),
        SurrenderTickAction::Surrender
    );
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
    // Kapitulacja bez garnizonu: brak obroncow do usuniecia, populacja >= 1.
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
    // Zapasy > 0, brak decyzji: brak akcji lacznika, brak galezi przejecia.
    let d = siege_city_turn(
        &besieged(None, None),
        &[unit(10.0, 10.0)],
        5.0,
        NO_HP,
        || panic!("atrycja nie powinna byc wywolana"),
    );
    assert_eq!(d, SiegeTurnDecision::default());
    assert_eq!(
        surrender_tick_action(&d, false, 5.0),
        SurrenderTickAction::None
    );
    assert_eq!(
        handle_siege_capitulation_phase(false, 5.0),
        CapitulationAction::Hold
    );
}
