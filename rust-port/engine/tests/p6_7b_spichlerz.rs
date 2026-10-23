//! P6.7B - `building-resource-gate.ts`, czesc Spichlerza: drain Ceramiki/Soli z puli panstwa, stan
//! bonusow, zdrowie/wzrost/racje/zadowolenie, id budynkow do yieldow, mnoznik zywnosci wojska, limity
//! oraz status nieaktywnego budynku (`resolveOwnedBuildingInactiveStatus`).
//! Wektory z URUCHOMIONEGO weba (pin edb8fb56), porownanie BITOWE f64; oczekiwania wylacznie z `gate.json`.

#[path = "p6_7b_vectors/common.rs"]
mod common;

use civ_engine::domain::building_costs::p6_7b::{
    built_ids_for_spichlerz_yields, city_has_spichlerz_building, pay_spichlerz_drain_for_city,
    resolve_owned_building_inactive_status, resolve_spichlerz_city_bonus_state,
    spichlerz_army_food_cost_multiplier, spichlerz_drain_ceramika_per_turn,
    spichlerz_drain_dry_run, spichlerz_drain_sol_per_turn, spichlerz_empire_cap_i,
    spichlerz_empire_cap_ii_full, spichlerz_growth_bonus_percent,
    spichlerz_happiness_bonus_from_json, spichlerz_health_bonus,
    spichlerz_ration_food_cost_multiplier, InactiveStatusOptions, SpichlerzCityBonusState,
    SpichlerzDrainPayResult,
};
use common::*;
use serde_json::Value;

fn data() -> Value {
    load("gate.json")
}

fn drain_result(v: &Value) -> SpichlerzDrainPayResult {
    SpichlerzDrainPayResult {
        ceramika_paid: v["ceramikaPaid"].as_bool().expect("ceramikaPaid"),
        sol_paid: v["solPaid"].as_bool().expect("solPaid"),
    }
}

fn bonus_state(v: &Value) -> SpichlerzCityBonusState {
    SpichlerzCityBonusState {
        ceramika_active: v["ceramikaActive"].as_bool().expect("ceramikaActive"),
        sol_active: v["solActive"].as_bool().expect("solActive"),
        ma_spichlerz_pop: v["maSpichlerzPop"].as_bool().expect("maSpichlerzPop"),
        ma_spichlerz_ii_pop: v["maSpichlerzIIPop"].as_bool().expect("maSpichlerzIIPop"),
    }
}

#[test]
fn constants_match_running_web() {
    let d = data();
    let s = &d["constants"]["spichlerz"];
    assert_bits(
        "drain ceramika",
        spichlerz_drain_ceramika_per_turn(),
        num(&s["drainCeramika"]),
    );
    assert_bits(
        "drain sol",
        spichlerz_drain_sol_per_turn(),
        num(&s["drainSol"]),
    );
    assert_bits("cap I", spichlerz_empire_cap_i(), num(&s["capI"]));
    assert_bits(
        "cap II",
        spichlerz_empire_cap_ii_full(),
        num(&s["capIIFull"]),
    );
}

#[test]
fn pay_drain_matches_running_web() {
    let d = data();
    let cases = arr(&d, "spDrain");
    assert!(cases.len() >= 1800);
    let mut paid = 0;
    let mut sol = 0;
    for (i, c) in cases.iter().enumerate() {
        let mut cities = cities_from(&c["cities"]);
        let owner = c["owner"].as_i64().expect("owner");
        let built = strings(&c["built"]);
        let dry = c["dry"].as_bool().unwrap_or(false);
        let dry_preview = spichlerz_drain_dry_run(&cities, owner, &built);
        let got = pay_spichlerz_drain_for_city(&mut cities, owner, &built, dry);
        let want = drain_result(&c["out"]);
        assert_eq!(got, want, "spDrain #{i}");
        if dry {
            assert_eq!(dry_preview, want, "spDrain dry-run #{i}");
        }
        assert_values(
            &format!("spDrain after #{i}"),
            &cities_value(&cities),
            &c["after"],
        );
        paid += usize::from(want.ceramika_paid);
        sol += usize::from(want.sol_paid);
    }
    assert!(
        paid > 100 && sol > 50,
        "za malo oplaconych drain: {paid}/{sol}"
    );
}

#[test]
fn bonus_state_matches_running_web() {
    let d = data();
    let cases = arr(&d, "spState");
    assert_eq!(cases.len(), 32);
    for (i, c) in cases.iter().enumerate() {
        let got =
            resolve_spichlerz_city_bonus_state(&strings(&c["built"]), drain_result(&c["drain"]));
        assert_eq!(got, bonus_state(&c["out"]), "spState #{i}");
    }
}

#[test]
fn bonuses_and_yields_match_running_web() {
    let d = data();
    let cases = arr(&d, "spBonus");
    assert_eq!(cases.len(), 16);
    for c in cases {
        let st = bonus_state(&c["state"]);
        let label = format!("{st:?}");
        assert_bits(
            &format!("health {label}"),
            spichlerz_health_bonus(&st),
            num(&c["health"]),
        );
        assert_bits(
            &format!("growth {label}"),
            spichlerz_growth_bonus_percent(&st),
            num(&c["growth"]),
        );
        assert_bits(
            &format!("ration {label}"),
            spichlerz_ration_food_cost_multiplier(&st),
            num(&c["ration"]),
        );
        for h in arr(c, "happiness") {
            let json_bonus = h.get("json").map(num);
            assert_bits(
                &format!("happiness {label} {json_bonus:?}"),
                spichlerz_happiness_bonus_from_json(&st, json_bonus),
                num(&h["out"]),
            );
        }
        for y in arr(c, "yields") {
            assert_eq!(
                built_ids_for_spichlerz_yields(&strings(&y["built"]), &st),
                strings(&y["out"]),
                "yields {label} {}",
                y["built"]
            );
        }
    }
}

#[test]
fn army_food_multiplier_matches_running_web() {
    let d = data();
    let cases = arr(&d, "spArmy");
    assert_eq!(cases.len(), 8);
    for c in cases {
        assert_bits(
            &format!("army {c}"),
            spichlerz_army_food_cost_multiplier(
                c["sol"].as_bool().expect("sol"),
                c["own"].as_bool().expect("own"),
                c["garrison"].as_bool().expect("garrison"),
            ),
            num(&c["out"]),
        );
    }
}

#[test]
fn city_has_spichlerz_matches_running_web() {
    let d = data();
    for c in arr(&d, "spHas") {
        assert_eq!(
            city_has_spichlerz_building(&strings(&c["built"])),
            c["out"].as_bool().expect("out"),
            "spHas {}",
            c["built"]
        );
    }
}

#[test]
fn inactive_status_matches_running_web() {
    let d = data();
    let table = &d["resolverTable"];
    let cases = arr(&d, "inactive");
    assert!(cases.len() >= 1800);
    let mut inactive = 0;
    let mut active_gated = 0;
    for (i, c) in cases.iter().enumerate() {
        let cities = cities_from(&c["cities"]);
        let built = strings(&c["builtIds"]);
        let rt = strings(&c["rtBuilt"]);
        let stock = opt_stock_rec(&c["stock"]);
        let building = c.get("building").map(gate_building);
        let id = text(&c["buildingId"]);
        let got = with_options(&c["opt"], table, |options| {
            let opts = InactiveStatusOptions {
                built_ids: &built,
                all_cities: &cities,
                owner_id: c["owner"].as_i64().expect("owner"),
                runtime_active_built_ids: &rt,
                empire_stock: stock.as_ref(),
                building: building.as_ref(),
                resolve_owner_zloto_access: options.and_then(|o| o.resolve_owner_zloto_access),
            };
            resolve_owned_building_inactive_status(&id, &opts)
        });
        let want = &c["out"];
        assert_eq!(
            got.inactive,
            want["inactive"].as_bool().expect("inactive"),
            "inactive #{i} {id}"
        );
        assert_eq!(
            got.missing_labels,
            strings(&want["missingLabels"]),
            "missing #{i} {id}"
        );
        assert_eq!(got.tooltip, text(&want["tooltip"]), "tooltip #{i} {id}");
        inactive += usize::from(got.inactive);
        active_gated += usize::from(!got.inactive);
    }
    assert!(
        inactive > 200 && active_gated > 200,
        "zbyt jednostronne dane"
    );
}
