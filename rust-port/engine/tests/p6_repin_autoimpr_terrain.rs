//! REPIN-AUTOIMPROVE (R-RUSTPORT-REPIN-AUTOIMPROVE-ZYWNOSC-RZEKA-Q1, runda 2): wektory z URUCHOMIONEGO weba
//! (pin web main 180c08305), generator: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-AUTOIMPROVE-ZYWNOSC-RZEKA-Q1/tools/
//! gen-repin-autoimpr-terrain-vectors.mjs`:
//! - `terrain.json`: `terrain-improvements.ts` (hunki 86-100: skalowanie plonow epoka, x1,5 dla surowcow terytorium,
//!   `hexHasHorseDeposit` + zloze 'konie' w `improvementHidesDepositOnHex`);
//! - `gate.json`: `auto-build-gate.ts` (AUTOBUILD domyslnie wylaczony, tylko gracz);
//! - `roadplan.json`: `road-network-plan.ts` (`planRoadNetwork`, MST drog miedzy miastami).
//!
//! Kodowanie: NaN/Infinity/-Infinity -> napis; `undefined` -> "$undef".

use std::collections::BTreeSet;

use civ_engine::domain::auto_improvements::auto_build_gate::{
    auto_build_from_new_game_param, auto_build_from_save_meta, is_auto_build_allowed_for_owner,
    is_human_seat_owner, AUTO_BUILD_DISABLED_HINT, AUTO_BUILD_ENABLED_DEFAULT,
};
use civ_engine::domain::auto_improvements::road_network_plan::{
    plan_road_network, RoadNetworkPlanOpts, RoadPlanCity,
};
use civ_engine::domain::improvement_build::{terrain_from_web_value, BuildHex, BuildMap};
use civ_engine::domain::improvements::{
    apply_improvement_bonus, apply_improvement_bonus_era, apply_improvement_bonuses,
    apply_improvement_bonuses_era, hex_has_horse_deposit_like, improvement_bonus_for_key,
    improvement_bonus_for_key_era, improvement_hides_deposit_on_hex, improvement_yield_for_era,
    resource_production_amount_for_era, territory_resource_yield_for_improvement, CatalogBonus,
    TileYield,
};
use civ_engine::domain::start_position::Overlay;
use serde_json::Value;

const TERRAIN: &str = include_str!("p6_repin_autoimpr_vectors/terrain.json");
const GATE: &str = include_str!("p6_repin_autoimpr_vectors/gate.json");
const ROADPLAN: &str = include_str!("p6_repin_autoimpr_vectors/roadplan.json");

fn n(v: &Value) -> f64 {
    match v {
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => panic!("nieznany napis liczbowy {other}"),
        },
        other => other
            .as_f64()
            .unwrap_or_else(|| panic!("nie liczba: {other}")),
    }
}

/// `undefined` ("$undef") i brak -> `None`.
fn on(v: &Value) -> Option<f64> {
    match v {
        Value::String(s) if s == "$undef" => None,
        Value::Null => None,
        other => Some(n(other)),
    }
}

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

fn cases<'a>(root: &'a Value, name: &str) -> &'a Vec<Value> {
    root["cases"][name]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {name}"))
}

fn strs(v: &Value) -> Vec<String> {
    v.as_array()
        .expect("tablica")
        .iter()
        .map(|x| x.as_str().expect("napis").to_owned())
        .collect()
}

fn overlay_of(hex: &Value) -> Option<Overlay> {
    hex.get("nakladka")
        .and_then(Value::as_str)
        .map(|s| Overlay::from_web_value(s).expect("nakladka"))
}

fn zloze_of(hex: &Value) -> Option<&str> {
    hex.get("zloze").and_then(Value::as_str)
}

fn yield_of(v: &Value) -> TileYield {
    TileYield {
        zywnosc: n(&v["zywnosc"]),
        praca: n(&v["praca"]),
        handel: n(&v["handel"]),
        drewno: n(&v["drewno"]),
        kamien: n(&v["kamien"]),
        glina: n(&v["glina"]),
        ruda: 0.0,
        ruda_zelaza: 0.0,
    }
}

fn assert_yield(label: &str, got: &TileYield, want: &TileYield) {
    for (name, g, w) in [
        ("zywnosc", got.zywnosc, want.zywnosc),
        ("praca", got.praca, want.praca),
        ("handel", got.handel, want.handel),
        ("drewno", got.drewno, want.drewno),
        ("kamien", got.kamien, want.kamien),
        ("glina", got.glina, want.glina),
    ] {
        assert!(same(g, w), "{label}.{name}: rust {g:?}, web {w:?}");
    }
}

#[test]
fn vectors_pin_is_web_main_180c08305() {
    for raw in [TERRAIN, GATE, ROADPLAN] {
        let d: Value = serde_json::from_str(raw).unwrap();
        assert_eq!(d["pin"].as_str(), Some("180c08305"));
    }
}

#[test]
fn improvement_yield_for_era_matches_web() {
    let root: Value = serde_json::from_str(TERRAIN).unwrap();
    let cs = cases(&root, "improvementYieldForEra");
    assert!(cs.len() >= 5000);
    for c in cs {
        let got = improvement_yield_for_era(
            c["key"].as_str().unwrap(),
            c["stat"].as_str().unwrap(),
            n(&c["base"]),
            on(&c["era"]),
        );
        assert!(same(got, n(&c["out"])), "case={c} rust={got:?}");
    }
}

#[test]
fn improvement_bonus_for_key_with_era_matches_web() {
    let root: Value = serde_json::from_str(TERRAIN).unwrap();
    for c in cases(&root, "improvementBonusForKey") {
        let key = c["key"].as_str().unwrap();
        let era = on(&c["era"]);
        let got: CatalogBonus = improvement_bonus_for_key_era(key, era);
        let want = &c["out"];
        for (name, g) in [
            ("zywnosc", got.zywnosc),
            ("praca", got.praca),
            ("handel", got.handel),
            ("pieniadz", got.pieniadz),
            ("drewno", got.drewno),
            ("kamien", got.kamien),
            ("glina", got.glina),
        ] {
            let w = want.get(name).and_then(on);
            match (g, w) {
                (None, None) => {}
                (Some(g), Some(w)) => assert!(same(g, w), "{c} {name}: rust {g:?} web {w:?}"),
                (g, w) => panic!("{c} {name}: rust {g:?} web {w:?}"),
            }
        }
        if era.is_none() {
            assert_eq!(improvement_bonus_for_key(key), got, "{key}");
        }
    }
}

#[test]
fn apply_improvement_bonus_with_era_matches_web() {
    let root: Value = serde_json::from_str(TERRAIN).unwrap();
    for c in cases(&root, "applyImprovementBonus") {
        let key = c["key"].as_str().unwrap();
        let era = on(&c["era"]);
        let mut y = yield_of(&c["yield"]);
        apply_improvement_bonus_era(&mut y, Some(key), era);
        assert_yield(&format!("{c}"), &y, &yield_of(&c["out"]));
        if era.is_none() {
            let mut y2 = yield_of(&c["yield"]);
            apply_improvement_bonus(&mut y2, Some(key));
            assert_yield(&format!("{c} (stara sygnatura)"), &y2, &y);
        }
    }
    for c in cases(&root, "applyImprovementBonuses") {
        let keys = strs(&c["keys"]);
        let era = on(&c["era"]);
        let mut y = yield_of(&c["yield"]);
        apply_improvement_bonuses_era(&mut y, &keys, era);
        assert_yield(&format!("{c}"), &y, &yield_of(&c["out"]));
        if era.is_none() {
            let mut y2 = yield_of(&c["yield"]);
            apply_improvement_bonuses(&mut y2, &keys);
            assert_yield(&format!("{c} (stara sygnatura)"), &y2, &y);
        }
    }
}

#[test]
fn territory_and_production_era_scaling_matches_web() {
    let root: Value = serde_json::from_str(TERRAIN).unwrap();
    let mut scaled = 0;
    for c in cases(&root, "territoryResourceYieldForImprovement") {
        let key = match &c["key"] {
            Value::String(s) if s == "$undef" => None,
            Value::Null => None,
            other => Some(other.as_str().unwrap()),
        };
        let got = territory_resource_yield_for_improvement(key, None, on(&c["era"]));
        match (got, &c["out"]) {
            (None, Value::Null) => {}
            (Some(g), want) if !want.is_null() => {
                scaled += 1;
                assert_eq!(g.resource_key, want["resourceKey"].as_str().unwrap(), "{c}");
                assert!(same(g.amount, n(&want["amount"])), "{c}: rust {}", g.amount);
            }
            (g, want) => panic!("{c}: rust {g:?} web {want}"),
        }
    }
    assert!(scaled > 100);
    for c in cases(&root, "resourceProductionAmountForEra") {
        let got = resource_production_amount_for_era(
            c["key"].as_str().unwrap(),
            n(&c["base"]),
            on(&c["era"]),
        );
        assert!(same(got, n(&c["out"])), "{c}: rust {got:?}");
    }
}

#[test]
fn horse_deposit_predicate_matches_web() {
    let root: Value = serde_json::from_str(TERRAIN).unwrap();
    let mut yes = 0;
    for c in cases(&root, "hexHasHorseDeposit") {
        let hex = &c["hex"];
        let got = hex_has_horse_deposit_like(overlay_of(hex), zloze_of(hex));
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
        yes += usize::from(got);
    }
    assert!(yes > 10);
    for c in cases(&root, "improvementHidesDepositOnHex") {
        let hex = &c["hex"];
        let got = improvement_hides_deposit_on_hex(
            c["key"].as_str().unwrap(),
            overlay_of(hex),
            zloze_of(hex),
        );
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
    }
}

fn raw_value(c: &Value) -> Option<Value> {
    match &c["raw"] {
        Value::String(s) if s == "$undef" => None,
        other => Some(other.clone()),
    }
}

#[test]
fn auto_build_gate_matches_web() {
    let root: Value = serde_json::from_str(GATE).unwrap();
    assert_eq!(
        root["constants"]["AUTO_BUILD_ENABLED_DEFAULT"].as_bool(),
        Some(AUTO_BUILD_ENABLED_DEFAULT)
    );
    assert_eq!(
        root["constants"]["AUTO_BUILD_DISABLED_HINT"].as_str(),
        Some(AUTO_BUILD_DISABLED_HINT)
    );
    for c in cases(&root, "isHumanSeatOwner") {
        let humans: Vec<f64> = c["humans"].as_array().unwrap().iter().map(n).collect();
        assert_eq!(
            is_human_seat_owner(n(&c["owner"]), &humans),
            c["out"].as_bool().unwrap(),
            "{c}"
        );
    }
    let mut n_allowed = 0;
    for c in cases(&root, "isAutoBuildAllowedForOwner") {
        let humans: Vec<f64> = c["humans"].as_array().unwrap().iter().map(n).collect();
        let got = is_auto_build_allowed_for_owner(
            n(&c["owner"]),
            &humans,
            c["enabled"].as_bool().unwrap(),
        );
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
        n_allowed += usize::from(got);
    }
    assert!(n_allowed > 10);
    for c in cases(&root, "autoBuildFromSaveMeta") {
        let raw = raw_value(c);
        assert_eq!(
            auto_build_from_save_meta(raw.as_ref()),
            c["out"].as_bool().unwrap(),
            "{c}"
        );
    }
    for c in cases(&root, "autoBuildFromNewGameParam") {
        let raw = raw_value(c);
        assert_eq!(
            auto_build_from_new_game_param(raw.as_ref()),
            c["out"].as_bool().unwrap(),
            "{c}"
        );
    }
}

#[test]
fn plan_road_network_matches_web() {
    let root: Value = serde_json::from_str(ROADPLAN).unwrap();
    let plans = root["plans"].as_array().unwrap();
    assert!(plans.len() >= 400);
    let mut non_empty = 0;
    for (i, p) in plans.iter().enumerate() {
        let hexes: Vec<BuildHex> = p["hexes"]
            .as_array()
            .unwrap()
            .iter()
            .map(|h| {
                let a = h.as_array().unwrap();
                let q = a[0].as_i64().unwrap() as i32;
                let r = a[1].as_i64().unwrap() as i32;
                let t = terrain_from_web_value(a[2].as_str().unwrap()).expect("teren");
                let mut hx = BuildHex::new(q, r, t, Overlay::Brak);
                hx.ulepszenie = Some(a[3].as_str().unwrap_or("brak").to_owned());
                hx.ulepszenia = a[4]
                    .as_array()
                    .map(|l| l.iter().map(|x| x.as_str().unwrap().to_owned()).collect());
                hx
            })
            .collect();
        let map = BuildMap::new(hexes, Vec::new());
        let cities: Vec<RoadPlanCity> = p["cities"]
            .as_array()
            .unwrap()
            .iter()
            .map(|c| RoadPlanCity {
                id: c["id"].as_str().unwrap().to_owned(),
                q: c["q"].as_i64().unwrap() as i32,
                r: c["r"].as_i64().unwrap() as i32,
            })
            .collect();
        let parse = |k: &str| -> (i32, i32) {
            let (a, b) = k.split_once(',').unwrap();
            (a.parse().unwrap(), b.parse().unwrap())
        };
        let trav: Option<BTreeSet<(i32, i32)>> = p["trav"]
            .as_array()
            .map(|a| a.iter().map(|k| parse(k.as_str().unwrap())).collect());
        let trav_fn = |q: i32, r: i32| trav.as_ref().is_some_and(|t| t.contains(&(q, r)));
        let extra: BTreeSet<(i32, i32)> = p["extra"]
            .as_array()
            .unwrap()
            .iter()
            .map(|k| parse(k.as_str().unwrap()))
            .collect();
        let opts = RoadNetworkPlanOpts {
            is_traversable: if trav.is_some() { Some(&trav_fn) } else { None },
            // pusty zbior == brak (`extraRoadKeys?.has` zawsze false)
            extra_road_keys: Some(&extra),
        };
        let got = plan_road_network(&cities, &map, opts);
        let want = &p["out"];
        let got_hexes: Vec<String> = got.hexes.iter().map(|(q, r)| format!("{q},{r}")).collect();
        assert_eq!(got_hexes, strs(&want["hexes"]), "plan #{i} hexes");
        let want_edges: Vec<(String, String, i64)> = want["edges"]
            .as_array()
            .unwrap()
            .iter()
            .map(|e| {
                (
                    e["a"].as_str().unwrap().to_owned(),
                    e["b"].as_str().unwrap().to_owned(),
                    e["cost"].as_i64().unwrap(),
                )
            })
            .collect();
        let got_edges: Vec<(String, String, i64)> = got
            .edges
            .iter()
            .map(|e| (e.a.clone(), e.b.clone(), e.cost))
            .collect();
        assert_eq!(got_edges, want_edges, "plan #{i} edges");
        assert_eq!(
            got.disconnected,
            want["disconnected"].as_u64().unwrap() as usize,
            "plan #{i} disconnected"
        );
        non_empty += usize::from(!got.hexes.is_empty());
    }
    assert!(non_empty >= 250, "za malo niepustych planow: {non_empty}");
}
