//! P6.7A - `empire-food.ts` (magazyn zywnosci imperium, autowyzywienie) + `recomputeCityFoodBalancesInEcon`.
//! Wektory z URUCHOMIONEGO weba (pin edb8fb56), porownanie BITOWE f64; oczekiwania wylacznie z
//! `tests/p6_7a_vectors/empire.json`.

#[path = "p6_7a_vectors/common.rs"]
mod common;

use std::collections::BTreeMap;

use civ_engine::domain::city_growth::p6_7a::empire_food::{
    advance_empire_food, auto_balance_rations_to_solvency, auto_raise_rations_for_growth,
    build_empire_food_params, clamp_food_split_pct, compute_empire_city_food_nadwyzka,
    compute_empire_food_max_cap, compute_empire_food_net_delta,
    compute_empire_food_net_delta_from_city_foods, fresh_empire_food_state, get_city_food_split,
    get_empire_food_split, is_city_auto_wyzywienie_enabled, is_empire_city_food_solvent,
    max_safe_poziom_racji_for_city, resolve_equal_growth_ration_plan, simulate_city_food_all_fed,
    simulate_city_food_central_pool, wyzywienie_poziom_na_limicie, AutoBalanceRationsOpts,
    AutoRaiseRationsOpts, AutoRationAdjustResult, EmpireFoodRuntime, EqualGrowthRationPlanOpts,
    MaxSafePoziomOpts, OwnerFoodStates, DEFAULT_HUMAN_OWNER_IDS,
};
use civ_engine::domain::city_growth::p6_7a::growth_v85::GrowthCity;
use civ_engine::domain::city_growth::p6_7a::{
    game_difficulty_from_web, recompute_city_food_balances_in_econ, GameDifficulty,
};
use civ_engine::domain::terrain::city_founding::p6_6b::cities::City;
use common::*;
use serde_json::{json, Value};

fn data() -> Value {
    load("empire.json")
}

fn cities_of(v: &Value) -> Vec<GrowthCity> {
    v.as_array()
        .expect("miasta")
        .iter()
        .map(growth_city)
        .collect()
}

#[test]
fn wyzywienie_poziom_na_limicie_matches_web() {
    let p = load("params.json");
    assert_bits(
        "na limicie",
        wyzywienie_poziom_na_limicie(),
        num(&p["WYZYWIENIE_POZIOM_NA_LIMICIE"]),
    );
}

#[test]
fn recompute_city_food_balances_matches_web() {
    for (i, c) in arr(&data(), "recompute").iter().enumerate() {
        let cities = cities_of(&c["cities"]);
        let mut ticks = ticks_of(&c["ticks"]);
        let sp = spichlerz_map(&c["spichlerz"]);
        recompute_city_food_balances_in_econ(&mut ticks, &cities, sp.as_ref());
        assert_values(&format!("recompute[{i}]"), &ticks_value(&ticks), &c["out"]);
    }
}

#[test]
fn simulation_helpers_match_web() {
    // `simulate` z empire.json + przypadki graniczne z edge.json (ujemne zapasy "przed")
    let (main, edge) = (data(), load("edge.json"));
    let cases = arr(&main, "simulate").iter().chain(arr(&edge, "simulate"));
    for (i, c) in cases.enumerate() {
        let ticks = ticks_of(&c["ticks"]);
        let owner = c["owner"].as_i64().expect("owner");
        let zap = num(&c["zap"]);
        let koszt = num(&c["koszt"]);
        assert_bits(
            &format!("nadwyzka[{i}]"),
            compute_empire_city_food_nadwyzka(&ticks, owner),
            num(&c["nadwyzka"]),
        );
        assert_bits(
            &format!("pool[{i}]"),
            simulate_city_food_central_pool(zap, &ticks, owner),
            num(&c["pool"]),
        );
        assert_eq!(
            simulate_city_food_all_fed(zap, &ticks, owner),
            c["allFed"].as_bool().expect("bool"),
            "allFed[{i}]"
        );
        assert_eq!(
            is_empire_city_food_solvent(zap, &ticks, owner, koszt),
            c["solvent"].as_bool().expect("bool"),
            "solvent[{i}]"
        );
        assert_eq!(
            is_empire_city_food_solvent(zap, &ticks, owner, 0.0),
            c["solventDefault"].as_bool().expect("bool"),
            "solventDefault[{i}]"
        );
    }
}

#[test]
fn advance_empire_food_matches_web() {
    let params_file = load("params.json");
    // `advance` z empire.json + przypadki graniczne z edge.json (ulamkowa karencja glodu wojska)
    let (main, edge) = (data(), load("edge.json"));
    let cases = arr(&main, "advance").iter().chain(arr(&edge, "advance"));
    for (i, c) in cases.enumerate() {
        let d = game_difficulty_from_web(c["d"].as_str().expect("d")).expect("trudnosc");
        let raw = decode_raw(&if c["raw"] == Value::String("econ".to_string()) {
            params_file["econParamsRawForBuild"].clone()
        } else {
            c["raw"].clone()
        });
        let params = build_empire_food_params(&raw, d);
        // parametry zbudowane w Rust musza zgadzac sie z tymi, ktore web przekazal do funkcji
        assert_values(
            &format!("params[{i}]"),
            &json!({
                "centralCapBaza": enc(params.central_cap_baza),
                "centralCapBonusMagazyn": enc(params.central_cap_bonus_magazyn),
                "glodWojskaHpFrac": enc(params.glod_wojska_hp_frac),
                "glodWojskaKarencjaTur": enc(params.glod_wojska_karencja_tur),
                "glodWojskaStatMult": enc(params.glod_wojska_stat_mult),
            }),
            &json!({
                "centralCapBaza": c["params"]["centralCapBaza"],
                "centralCapBonusMagazyn": c["params"]["centralCapBonusMagazyn"],
                "glodWojskaHpFrac": c["params"]["glodWojskaHpFrac"],
                "glodWojskaKarencjaTur": c["params"]["glodWojskaKarencjaTur"],
                "glodWojskaStatMult": c["params"]["glodWojskaStatMult"],
            }),
        );
        let econ_in = econ(&c["econ"]);
        let unit_owners: Vec<i64> = c["unitOwners"]
            .as_array()
            .expect("unitOwners")
            .iter()
            .map(|x| x.as_i64().expect("owner"))
            .collect();
        let army: BTreeMap<i64, f64> = c["armyCost"]
            .as_object()
            .expect("armyCost")
            .iter()
            .map(|(k, v)| (k.parse().expect("owner"), num(v)))
            .collect();
        let mut states = owner_states(&c["statesBefore"]);
        let built = built_map(&c["built"]);
        let era: Option<BTreeMap<i64, f64>> = c["eraByOwner"].as_object().map(|o| {
            o.iter()
                .map(|(k, v)| (k.parse().expect("owner"), num(v)))
                .collect()
        });
        let era_fn = era
            .as_ref()
            .map(|m| move |o: i64| m.get(&o).copied().unwrap_or(1.0));
        let mut military = |o: i64| army.get(&o).copied().expect("koszt armii dla wlasciciela");
        let mut rt = EmpireFoodRuntime::new();
        let res = advance_empire_food(
            &econ_in,
            &unit_owners,
            &mut states,
            &params,
            built.as_ref(),
            era_fn.as_ref().map(|f| f as &dyn Fn(i64) -> f64),
            &mut military,
            &mut rt,
        );
        let want = &c["out"];
        assert_values(
            &format!("perOwner[{i}]"),
            &Value::Array(res.per_owner.iter().map(ef_tick_value).collect()),
            &want["perOwner"],
        );
        let keys: Vec<Value> = res.per_owner.iter().map(|t| json!(t.owner_id)).collect();
        let mut got_keys = keys.clone();
        got_keys.sort_by_key(Value::to_string);
        let mut want_keys = want["byOwnerKeys"].as_array().expect("keys").clone();
        want_keys.sort_by_key(Value::to_string);
        assert_eq!(got_keys, want_keys, "byOwner[{i}] klucze");
        assert_values(
            &format!("statesAfter[{i}]"),
            &owner_states_value(&states),
            &want["statesAfter"],
        );
        // akcesory runtime (HUD)
        let karencja = params.glod_wojska_karencja_tur;
        check_accessors(
            &format!("[{i}]"),
            &rt,
            &states,
            karencja,
            arr(want, "accessors"),
        );
        // runda 2b (edge.json): cykl zycia runtime po realnym advance
        if let Some(after_clear) = want.get("accessorsAfterClear") {
            // `clearLastEmpireFoodTicks` czysci tiki ORAZ `_maxCapByOwner` (zamyka mutanta [85])
            let mut cleared = rt.clone();
            cleared.clear_last_empire_food_ticks();
            check_accessors(
                &format!("afterClear[{i}]"),
                &cleared,
                &states,
                karencja,
                after_clear.as_array().expect("accessorsAfterClear"),
            );
            // `_setLastEmpireFoodTicks` z wstrzyknietym tikiem wlasciciela -1 (zamyka mutanta [84]): guardy
            // `isBarbarian` w `isArmyHungry`/`isArmyStarving` sa nieosiagalne przez sama `advanceEmpireFood`
            if let Some(inj) = want.get("injected").filter(|v| !v.is_null()) {
                let base_owner = inj["baseOwner"].as_i64().expect("baseOwner");
                let mut ticks: BTreeMap<i64, _> = BTreeMap::new();
                for a in arr(want, "accessors") {
                    let o = a["o"].as_i64().expect("owner");
                    if let Some(t) = rt.get_last_empire_food_tick(o) {
                        ticks.insert(o, t.clone());
                    }
                }
                let mut barb = ticks
                    .get(&base_owner)
                    .expect("tik wlasciciela bazowego")
                    .clone();
                barb.owner_id = -1;
                barb.glod_wojska = true;
                barb.glod_wojska_atrycja_aktywna = true;
                ticks.insert(-1, barb);
                let mut injected = cleared.clone();
                injected.set_last_empire_food_ticks(ticks);
                check_accessors(
                    &format!("injected[{i}]"),
                    &injected,
                    &states,
                    karencja,
                    arr(inj, "accessors"),
                );
            }
        }
    }
}

/// Akcesory runtime (HUD) wzgledem oczekiwan weba (`accessors`, `accessorsAfterClear`, `injected.accessors`).
fn check_accessors(
    tag: &str,
    rt: &EmpireFoodRuntime,
    states: &OwnerFoodStates,
    karencja: f64,
    list: &[Value],
) {
    for a in list {
        let o = a["o"].as_i64().expect("owner");
        assert_bits(
            &format!("reserve{tag} {o}"),
            rt.get_empire_food_reserve(states, o),
            num(&a["reserve"]),
        );
        assert_bits(
            &format!("maxCap{tag} {o}"),
            rt.get_empire_food_max_cap(o),
            num(&a["maxCap"]),
        );
        assert_eq!(
            rt.is_army_hungry(o),
            a["hungry"].as_bool().expect("bool"),
            "hungry{tag} {o}"
        );
        assert_eq!(
            rt.is_army_starving(o),
            a["starving"].as_bool().expect("bool"),
            "starving{tag} {o}"
        );
        let cd = rt.get_army_starvation_countdown(o, karencja);
        match (&a["countdown"], cd) {
            (w, None) => assert!(w.get("isNull").is_some(), "countdown{tag} {o} web={w}"),
            (w, Some(x)) => assert_bits(&format!("countdown{tag} {o}"), x, num(w)),
        }
        let last = rt.get_last_empire_food_tick(o).map(ef_tick_value);
        match (&a["last"], last) {
            (Value::Null, None) => {}
            (w, Some(g)) => assert_values(&format!("last{tag} {o}"), &g, w),
            (w, None) => panic!("last{tag} {o}: web={w} rust=None"),
        }
    }
}

#[test]
fn runtime_clear_and_deprecated_helpers_match_web() {
    let d = data();
    let mut rt = EmpireFoodRuntime::new();
    rt.clear_last_empire_food_ticks();
    let states = owner_states(&json!({ "__map": [] }));
    for a in arr(&d, "afterClear") {
        let o = a["o"].as_i64().expect("owner");
        assert_bits(
            "reserve",
            rt.get_empire_food_reserve(&states, o),
            num(&a["reserve"]),
        );
        assert_bits("maxCap", rt.get_empire_food_max_cap(o), num(&a["maxCap"]));
        assert_eq!(rt.is_army_hungry(o), a["hungry"].as_bool().expect("bool"));
        assert_eq!(
            rt.is_army_starving(o),
            a["starving"].as_bool().expect("bool")
        );
        assert!(rt.get_last_empire_food_tick(o).is_none() && a["last"].is_null());
    }
    assert_bits(
        "split",
        get_empire_food_split(0),
        num(&d["split"]["getEmpireFoodSplit"]),
    );
    for c in arr(&d["split"], "clamp") {
        assert_bits("clamp", clamp_food_split_pct(num(&c["x"])), num(&c["out"]));
    }
    for c in arr(&d["legacy"], "cityFoodSplit") {
        let got = get_city_food_split(js_num(&c["city"]["poziomRacji"]));
        if c.get("defaultPct").is_some() {
            // `_defaultPct` jest ignorowany przez web
            assert_bits("split(2, 40)", got, num(&c["out"]));
        } else {
            assert_bits("split", got, num(&c["out"]));
        }
    }
    for c in arr(&d["legacy"], "netDelta") {
        assert_bits(
            "netDelta",
            compute_empire_food_net_delta(num(&c["b"]), num(&c["k"])),
            num(&c["out"]),
        );
    }
    for c in arr(&d["legacy"], "netDeltaFromCities") {
        let xs: Vec<f64> = c["xs"].as_array().expect("xs").iter().map(num).collect();
        assert_bits(
            "netDeltaFromCities",
            compute_empire_food_net_delta_from_city_foods(&xs, num(&c["k"])),
            num(&c["out"]),
        );
    }
    let p = build_empire_food_params(&json!({}), GameDifficulty::Normal);
    assert_bits(
        "maxCap legacy",
        compute_empire_food_max_cap(&p),
        num(&d["legacy"]["maxCap"]["out"]),
    );
    for c in arr(&d["legacy"], "fresh") {
        let s = fresh_empire_food_state();
        assert_bits(
            "fresh zapasy",
            s.zapasy_panstwa,
            num(&c["out"]["zapasyPanstwa"]),
        );
        assert_bits(
            "fresh tury",
            s.tury_ujemnych_zapasow.expect("ustawione"),
            num(&c["out"]["turyUjemnychZapasow"]),
        );
        assert!(s.procent_rozwoj.is_none() && c["out"].get("procentRozwoj").is_none());
    }
    for c in arr(&d["legacy"], "autoEnabled") {
        let city = City {
            owner_id: c["city"]["ownerId"].as_i64().expect("owner"),
            auto_wyzywienie: c["city"]["autoWyzywienie"].as_bool(),
            ..City::default()
        };
        let force = if absent(&c["force"]) {
            false
        } else {
            c["force"].as_bool().expect("bool")
        };
        let human: Vec<i64> = if absent(&c["humanIds"]) {
            DEFAULT_HUMAN_OWNER_IDS.to_vec()
        } else {
            c["humanIds"]
                .as_array()
                .expect("humanIds")
                .iter()
                .map(|x| x.as_i64().expect("owner"))
                .collect()
        };
        assert_eq!(
            is_city_auto_wyzywienie_enabled(&city, force, &human),
            c["out"].as_bool().expect("bool"),
            "autoEnabled {c}"
        );
    }
}

struct Scenario {
    cities: Vec<GrowthCity>,
    econ: civ_engine::domain::city_growth::p6_7a::EconomyTickResult,
    owner: i64,
    zap: f64,
    koszt: f64,
    sp: Option<BTreeMap<String, civ_engine::domain::city_growth::p6_7a::SpichlerzCityBonusState>>,
    pop_cap: Option<BTreeMap<String, f64>>,
    only_auto: bool,
    flow: bool,
}

fn scenario(c: &Value) -> Scenario {
    Scenario {
        cities: cities_of(&c["cities"]),
        econ: econ(&c["econ"]),
        owner: c["ownerId"].as_i64().expect("owner"),
        zap: num(&c["zap"]),
        koszt: num(&c["kosztArmii"]),
        sp: spichlerz_map(&c["spichlerz"]),
        pop_cap: f64_map(&c["popCap"]),
        only_auto: c["onlyAuto"].as_bool().expect("bool"),
        flow: c["flow"].as_bool().expect("bool"),
    }
}

fn cities_after_value(cities: &[GrowthCity]) -> Value {
    Value::Array(cities.iter().map(growth_city_value).collect())
}

fn result_value(r: &AutoRationAdjustResult) -> Value {
    json!({
        "adjusted": r.adjusted,
        "changes": r.changes.iter().map(|c| json!({
            "cityId": c.city_id,
            "name": c.name,
            "oldLevel": enc(c.old_level),
            "newLevel": enc(c.new_level),
        })).collect::<Vec<_>>(),
    })
}

#[test]
fn equal_growth_plan_matches_web() {
    // `plan` z empire.json + `planFlow` z edge.json (kryterium FLOW gracza, runda 2b)
    let (main, edge) = (data(), load("edge.json"));
    for (i, c) in arr(&main, "plan")
        .iter()
        .chain(arr(&edge, "planFlow"))
        .enumerate()
    {
        let mut s = scenario(c);
        let plan = resolve_equal_growth_ration_plan(
            &EqualGrowthRationPlanOpts {
                owner_id: s.owner,
                zapasy_przed: s.zap,
                spichlerz_by_city: s.sp.as_ref(),
                only_auto_managed: s.only_auto,
                require_flow_balance: s.flow,
                koszt_armii: s.koszt,
                pop_cap_by_city_id: s.pop_cap.as_ref(),
            },
            &mut s.cities,
            &mut s.econ,
        );
        let level_pairs: Vec<Value> = plan
            .level_by_city_id
            .iter()
            .map(|(k, v)| json!([k, enc(*v)]))
            .collect();
        let got = json!({
            "plan": {
                "uniformLevel": enc(plan.uniform_level),
                "levelByCityId": { "__map": level_pairs },
                "atPopCapCityIds": plan.at_pop_cap_city_ids,
                "allFed": plan.all_fed,
            },
            "citiesAfter": cities_after_value(&s.cities),
            "econAfter": econ_value(&s.econ),
        });
        assert_values(&format!("plan[{i}]"), &got, &c["out"]);
    }
}

#[test]
fn auto_balance_matches_web() {
    // `balance` z empire.json + `balanceFlow` z edge.json (kryterium FLOW gracza, runda 2b)
    let (main, edge) = (data(), load("edge.json"));
    for (i, c) in arr(&main, "balance")
        .iter()
        .chain(arr(&edge, "balanceFlow"))
        .enumerate()
    {
        let mut s = scenario(c);
        let r = auto_balance_rations_to_solvency(
            &AutoBalanceRationsOpts {
                owner_id: s.owner,
                zapasy_przed: s.zap,
                spichlerz_by_city: s.sp.as_ref(),
                only_auto_managed: s.only_auto,
                require_flow_balance: s.flow,
                koszt_armii: s.koszt,
                pop_cap_by_city_id: s.pop_cap.as_ref(),
            },
            &mut s.cities,
            &mut s.econ,
        );
        let got = json!({
            "result": result_value(&r),
            "citiesAfter": cities_after_value(&s.cities),
            "econAfter": econ_value(&s.econ),
        });
        assert_values(&format!("balance[{i}]"), &got, &c["out"]);
    }
}

#[test]
fn auto_raise_matches_web() {
    // `raise` z empire.json + `raiseFlow` z edge.json (kryterium FLOW gracza, runda 2b; zamyka mutanta [107])
    let (main, edge) = (data(), load("edge.json"));
    for (i, c) in arr(&main, "raise")
        .iter()
        .chain(arr(&edge, "raiseFlow"))
        .enumerate()
    {
        let mut s = scenario(c);
        let r = auto_raise_rations_for_growth(
            &AutoRaiseRationsOpts {
                owner_id: s.owner,
                zapasy_przed: s.zap,
                spichlerz_by_city: s.sp.as_ref(),
                require_production_surplus: c["surplus"].as_bool().expect("bool"),
                only_auto_managed: s.only_auto,
                koszt_armii: s.koszt,
                pop_cap_by_city_id: s.pop_cap.as_ref(),
            },
            &mut s.cities,
            &mut s.econ,
        );
        let got = json!({
            "result": result_value(&r),
            "citiesAfter": cities_after_value(&s.cities),
            "econAfter": econ_value(&s.econ),
        });
        assert_values(&format!("raise[{i}]"), &got, &c["out"]);
    }
}

#[test]
fn max_safe_poziom_matches_web() {
    for (i, c) in arr(&data(), "maxSafe").iter().enumerate() {
        let mut s = scenario(c);
        let human: Vec<i64> = if absent(&c["human"]) {
            DEFAULT_HUMAN_OWNER_IDS.to_vec()
        } else {
            c["human"]
                .as_array()
                .expect("human")
                .iter()
                .map(|x| x.as_i64().expect("owner"))
                .collect()
        };
        let level = max_safe_poziom_racji_for_city(
            &MaxSafePoziomOpts {
                city_id: text(&c["target"]),
                owner_id: s.owner,
                zapasy_przed: s.zap,
                spichlerz_by_city: s.sp.as_ref(),
                koszt_armii: s.koszt,
                pop_cap_by_city_id: s.pop_cap.as_ref(),
                human_owner_ids: human,
            },
            &mut s.cities,
            &mut s.econ,
        );
        let got = json!({
            "level": enc(level),
            "citiesAfter": cities_after_value(&s.cities),
            "econAfter": econ_value(&s.econ),
        });
        assert_values(&format!("maxSafe[{i}]"), &got, &c["out"]);
    }
}
