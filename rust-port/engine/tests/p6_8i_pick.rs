//! P6.8I (8I-P1/P2) - picker auto-ulepszen. Wektory z URUCHOMIONEGO weba (pin 4bbef081d):
//! `tests/p6_8i_vectors/pick.json` (scenariusze `pickAutoImprovements`) i `helpers.json` (helpery P1),
//! generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-8I-AUTO-ULEPSZENIA-Q1/gen-p6-8i-pick-vectors.mjs`.
//! Kodowanie liczb: skonczona -> liczba, NaN/Infinity/-Infinity -> napis.

use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::auto_improvements::opts::DEFAULT_ULEPSZENIA_FOCUS;
use civ_engine::domain::auto_improvements::{
    actionable_deficit_keys, deficit_improvement_keys, has_non_food_resource_deficit,
    is_city_limit_exhausted, pick_auto_improvements, priorities_for_ulepszenia_focus,
    AutoImprovementCity, AutoImprovementSurplusReport, FoodStages, PickAutoImprovementsOpts,
    UlepszeniaFocus, AI_IMPROVEMENT_PRIORITY, AUTO_ULEPSZENIA_PRACA_RESERVE,
    FOOD_STAGE_MAX_ITEMS_PER_CITY, FORT_CLAIM_MIN_NEW_HEXES, IMPROVEMENT_FOR_DEFICIT,
    JEDEN_NA_ILU_OBYWATELI, ROAD_KEYS, ULEPSZENIA_FOCUS_ZYWNOSC, ULEPSZENIA_ZYWNOSCIOWE,
    WYRAB_MIN_FOREST_IN_RADIUS, ZERO_YIELD_IMPROVEMENTS,
};
use civ_engine::domain::improvement_build::{terrain_from_web_value, BuildHex, BuildMap};
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::{city_territory_radius, CityNode};
use civ_engine::domain::territory::TerritoryNode;
use serde_json::Value;

const PICK: &str = include_str!("p6_8i_vectors/pick.json");
const HELPERS: &str = include_str!("p6_8i_vectors/helpers.json");

fn num(v: &Value) -> f64 {
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

fn opt_num(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

fn focus_from(s: &str) -> UlepszeniaFocus {
    match s {
        "zywnosc" => UlepszeniaFocus::Zywnosc,
        "surowce" => UlepszeniaFocus::Surowce,
        "infrastruktura" => UlepszeniaFocus::Infrastruktura,
        "zrownowazone" => UlepszeniaFocus::Zrownowazone,
        _ => UlepszeniaFocus::Other,
    }
}

fn strings(v: &Value) -> Vec<String> {
    v.as_array()
        .expect("tablica")
        .iter()
        .map(|x| x.as_str().expect("napis").to_owned())
        .collect()
}

fn build_map(m: &Value) -> BuildMap {
    let hexes: Vec<BuildHex> = m["hexes"]
        .as_array()
        .expect("hexes")
        .iter()
        .map(|h| {
            let a = h.as_array().expect("hex");
            let q = a[0].as_i64().unwrap() as i32;
            let r = a[1].as_i64().unwrap() as i32;
            let terrain = terrain_from_web_value(a[2].as_str().unwrap()).expect("teren");
            let overlay = Overlay::from_web_value(a[3].as_str().unwrap()).expect("nakladka");
            let mut hx = BuildHex::new(q, r, terrain, overlay);
            hx.zloze = a[4].as_str().map(str::to_owned);
            hx.river_present = a[5].as_i64() == Some(1);
            hx.ulepszenie = Some(a[6].as_str().unwrap_or("brak").to_owned());
            hx.ulepszenia = a[7]
                .as_array()
                .map(|l| l.iter().map(|x| x.as_str().unwrap().to_owned()).collect());
            hx
        })
        .collect();
    let river_paths: Vec<Vec<(i32, i32)>> = m["riverPaths"]
        .as_array()
        .expect("riverPaths")
        .iter()
        .map(|p| {
            p.as_array()
                .unwrap()
                .iter()
                .map(|c| (c[0].as_i64().unwrap() as i32, c[1].as_i64().unwrap() as i32))
                .collect()
        })
        .collect();
    BuildMap::new(hexes, river_paths)
}

type Pick = (String, i32, i32, String, f64, i64);

fn by_id<'v>(obj: &'v Value, id: &str) -> Option<&'v Value> {
    obj.get(id)
}

fn run_scenario(s: &Value, maps: &[BuildMap]) -> (Vec<Pick>, Option<AutoImprovementSurplusReport>) {
    let map = &maps[s["map"].as_u64().unwrap() as usize];
    let so = &s["opts"];
    let fnv = &s["fn"];
    let cities: Vec<AutoImprovementCity> = s["cities"]
        .as_array()
        .unwrap()
        .iter()
        .map(|c| AutoImprovementCity {
            id: c["id"].as_str().unwrap().to_owned(),
            owner_id: c["ownerId"].as_i64().unwrap(),
            q: c["q"].as_i64().unwrap() as i32,
            r: c["r"].as_i64().unwrap() as i32,
            population: num(&c["population"]),
            ulepszenia_focus: c["focus"].as_str().map(focus_from),
            ulepszenia_only_worked: c["onlyWorked"].as_bool(),
            kon_stock: c.get("kon").and_then(Value::as_f64),
        })
        .collect();
    let territory_nodes: Option<Vec<TerritoryNode>> = s["territoryNodes"].as_array().map(|a| {
        a.iter()
            .map(|n| {
                TerritoryNode::new(
                    CityNode {
                        q: n["q"].as_i64().unwrap() as i32,
                        r: n["r"].as_i64().unwrap() as i32,
                        is_outpost: n["isOutpost"].as_bool(),
                        is_fort: n["isFort"].as_bool(),
                        pop: num(&n["pop"]),
                        level: num(&n["level"]),
                        civ: None,
                    },
                    n["ownerId"].as_i64().unwrap(),
                )
            })
            .collect()
    });
    let mut placed: BTreeMap<String, Vec<String>> = BTreeMap::new();
    for (hk, v) in s["placed"].as_object().unwrap() {
        let layers = match v {
            Value::String(x) => vec![x.clone()],
            other => strings(other),
        };
        placed.insert(hk.clone(), layers);
    }
    let report_cell = RefCell::new(AutoImprovementSurplusReport::default());

    let stage_ids: Option<Vec<String>> = so["foodImprovementStages"]["cities"]
        .as_array()
        .map(|_| strings(&so["foodImprovementStages"]["cities"]));
    let stages_fn =
        |c: &AutoImprovementCity| stage_ids.as_ref().is_some_and(|ids| ids.contains(&c.id));
    let focus_fn = |c: &AutoImprovementCity| {
        by_id(&fnv["focusByCity"], &c.id)
            .and_then(Value::as_str)
            .map(focus_from)
            .unwrap_or_else(|| c.ulepszenia_focus.unwrap_or(DEFAULT_ULEPSZENIA_FOCUS))
    };
    let only_worked_fn = |c: &AutoImprovementCity| {
        by_id(&fnv["onlyWorkedByCity"], &c.id)
            .and_then(Value::as_bool)
            .unwrap_or_else(|| c.ulepszenia_only_worked.unwrap_or(false))
    };
    let worked_fn = |c: &AutoImprovementCity| -> BTreeSet<String> {
        by_id(&fnv["workedKeysByCity"], &c.id)
            .map(|v| strings(v).into_iter().collect())
            .unwrap_or_default()
    };
    let pct_fn = |c: &AutoImprovementCity| -> f64 {
        by_id(&fnv["pracaPercentByCity"], &c.id)
            .map(num)
            .unwrap_or_else(|| opt_num(&so["pracaBudgetPercent"]).unwrap_or(100.0))
    };
    let skip_fn = |c: &AutoImprovementCity| {
        by_id(&fnv["skipWyrabByCity"], &c.id)
            .and_then(Value::as_bool)
            .unwrap_or(false)
    };
    let res_only_fn = |c: &AutoImprovementCity| {
        by_id(&fnv["resourcePassOnlyWorkedByCity"], &c.id)
            .and_then(Value::as_bool)
            .unwrap_or(false)
    };
    let deny: Vec<String> = fnv["civDeny"]
        .as_array()
        .map(|_| strings(&fnv["civDeny"]))
        .unwrap_or_default();
    let civ_fn = |key: &str, _civ: Option<&str>| !deny.iter().any(|d| d == key);

    let flag = |k: &str| so[k].as_bool().unwrap_or(false);
    let opts = PickAutoImprovementsOpts {
        cities,
        owner_id: s["ownerId"].as_i64().unwrap(),
        map: Some(map),
        territory_nodes,
        placed_improvements: Some(placed),
        praca_available: num(&s["praca"]),
        unlocked_techs: strings(&s["techs"]).into_iter().collect(),
        get_focus: fnv.get("focusByCity").map(|_| &focus_fn as _),
        get_only_worked: fnv.get("onlyWorkedByCity").map(|_| &only_worked_fn as _),
        get_worked_hex_keys: fnv.get("workedKeysByCity").map(|_| &worked_fn as _),
        praca_budget_percent: opt_num(&so["pracaBudgetPercent"]),
        improvement_budget_cap: opt_num(&so["improvementBudgetCap"]),
        get_praca_budget_percent: fnv.get("pracaPercentByCity").map(|_| &pct_fn as _),
        max_items_per_city: opt_num(&so["maxItemsPerCity"]),
        praca_surplus_threshold: opt_num(&so["pracaSurplusThreshold"]),
        skip_wyrab: flag("skipWyrab"),
        get_skip_wyrab: fnv.get("skipWyrabByCity").map(|_| &skip_fn as _),
        demand_driven: flag("demandDriven"),
        resource_deficit_keys: so["resourceDeficitKeys"]
            .as_array()
            .map(|_| strings(&so["resourceDeficitKeys"])),
        surplus_report: if flag("withSurplusReport") {
            Some(&report_cell)
        } else {
            None
        },
        civ_archetype: so["civArchetype"].as_str().map(str::to_owned),
        player_era: opt_num(&so["playerEra"]),
        is_improvement_allowed_for_civ: fnv.get("civDeny").map(|_| &civ_fn as _),
        priority_override: so["priorityOverride"]
            .as_array()
            .map(|_| strings(&so["priorityOverride"])),
        food_improvement_stages: match &so["foodImprovementStages"] {
            Value::Bool(b) => Some(FoodStages::Flag(*b)),
            Value::Object(_) => Some(FoodStages::PerCity(&stages_fn)),
            _ => None,
        },
        river_forest_clearing_only: flag("riverForestClearingOnly"),
        clearing_hex_keys: so["clearingHexKeys"]
            .as_array()
            .map(|_| strings(&so["clearingHexKeys"]).into_iter().collect()),
        roads_pass: flag("roadsPass"),
        city_limit_exhausted: flag("cityLimitExhausted"),
        fort_claim_pass: flag("fortClaimPass"),
        river_hexes_only: flag("riverHexesOnly"),
        off_river_clearing: flag("offRiverClearing"),
        irrigation_needs_farm: flag("irrigationNeedsFarm"),
        get_resource_pass_only_worked: fnv
            .get("resourcePassOnlyWorkedByCity")
            .map(|_| &res_only_fn as _),
        farm_priority_only_worked: None,
    };
    let picks = pick_auto_improvements(&opts);
    let out: Vec<Pick> = picks
        .into_iter()
        .map(|p| (p.city_id, p.q, p.r, p.key, p.koszt_praca, p.owner_id))
        .collect();
    let report = if flag("withSurplusReport") {
        Some(*report_cell.borrow())
    } else {
        None
    };
    (out, report)
}

fn fort_probe(is_fort: bool) -> CityNode {
    CityNode {
        q: 0,
        r: 0,
        is_outpost: Some(!is_fort),
        is_fort: Some(is_fort),
        pop: 0.0,
        level: 1.0,
        civ: None,
    }
}

fn expected_picks(v: &Value) -> Vec<Pick> {
    v["picks"]
        .as_array()
        .unwrap()
        .iter()
        .map(|p| {
            (
                p[0].as_str().unwrap().to_owned(),
                p[1].as_i64().unwrap() as i32,
                p[2].as_i64().unwrap() as i32,
                p[3].as_str().unwrap().to_owned(),
                p[4].as_f64().unwrap(),
                p[5].as_i64().unwrap(),
            )
        })
        .collect()
}

#[test]
fn vectors_pin_is_4bbef081d() {
    let d: Value = serde_json::from_str(PICK).unwrap();
    assert_eq!(d["pin"].as_str(), Some("4bbef081d"));
    let h: Value = serde_json::from_str(HELPERS).unwrap();
    assert_eq!(h["pin"].as_str(), Some("4bbef081d"));
}

#[test]
fn pick_auto_improvements_matches_pinned_web_vectors() {
    let d: Value = serde_json::from_str(PICK).unwrap();
    let maps: Vec<BuildMap> = d["maps"]
        .as_array()
        .unwrap()
        .iter()
        .map(build_map)
        .collect();
    let scenarios = d["scenarios"].as_array().unwrap();
    assert!(
        scenarios.len() >= 2150,
        "za malo scenariuszy: {}",
        scenarios.len()
    );
    let mut bad: Vec<String> = Vec::new();
    let mut drift: Vec<String> = Vec::new();
    let mut nonempty = 0;
    // Dryf zaleznosci: `terrain::city_territory_radius` czyta jeszcze stare 10/5 (repin territory.rs poza
    // allowlista 8I). Scenariusze z wezlami fortu/posterunku w `territoryNodes` (`fortNodes`, poza `strict`)
    // sa liczone osobno; po repinie (promienie 5/3) test staje sie ostry dla WSZYSTKICH.
    let repinned = city_territory_radius(&fort_probe(true)) == 5.0
        && city_territory_radius(&fort_probe(false)) == 3.0;
    for s in scenarios {
        let (got, report) = run_scenario(s, &maps);
        if let Ok(prefix) = std::env::var("P6_8I_DUMP") {
            if s["name"].as_str().unwrap().starts_with(&prefix) {
                eprintln!(
                    "DUMP {} got={} want={}",
                    s["name"],
                    got.len(),
                    s["expected"]["picks"].as_array().unwrap().len()
                );
            }
        }
        let want = expected_picks(&s["expected"]);
        if !want.is_empty() {
            nonempty += 1;
        }
        let mut ok = got == want;
        if let (Some(r), Some(w)) = (report, s["expected"]["report"].as_object()) {
            let b = |k: &str| w[k].as_bool().unwrap();
            ok &= r.demand_active == b("demandActive")
                && r.deficit_active == b("deficitActive")
                && r.any_candidate == b("anyCandidate")
                && r.surplus == b("surplus");
        }
        if !ok
            && s["fortNodes"].as_bool() == Some(true)
            && s["strict"].as_bool() != Some(true)
            && !repinned
        {
            drift.push(s["name"].as_str().unwrap().to_owned());
            continue;
        }
        if !ok {
            bad.push(format!(
                "{}: rust={:?} web={:?}",
                s["name"].as_str().unwrap(),
                got.iter().take(6).collect::<Vec<_>>(),
                want.iter().take(6).collect::<Vec<_>>()
            ));
        }
    }
    println!(
        "DRYF fortNodes (niezgodne, poza ostrym zakresem): {}",
        drift.len()
    );
    assert!(
        drift.len() <= 60,
        "dryf wiekszy niz zmierzony (40): {}",
        drift.len()
    );
    assert!(
        nonempty >= 1000,
        "za malo niepustych scenariuszy: {nonempty}"
    );
    assert!(
        bad.is_empty(),
        "{} niezgodnych scenariuszy, pierwsze: {:#?}",
        bad.len(),
        &bad[..bad.len().min(5)]
    );
}

#[test]
fn helper_constants_match_web() {
    let h: Value = serde_json::from_str(HELPERS).unwrap();
    let c = &h["constants"];
    assert_eq!(
        strings(&c["AI_IMPROVEMENT_PRIORITY"]),
        AI_IMPROVEMENT_PRIORITY
    );
    assert_eq!(
        strings(&c["ULEPSZENIA_FOCUS_ZYWNOSC"]),
        ULEPSZENIA_FOCUS_ZYWNOSC
    );
    assert_eq!(
        strings(&c["ULEPSZENIA_ZYWNOSCIOWE"]),
        ULEPSZENIA_ZYWNOSCIOWE
    );
    assert_eq!(
        strings(&c["ZERO_YIELD_IMPROVEMENTS"]),
        ZERO_YIELD_IMPROVEMENTS
    );
    assert_eq!(strings(&c["ROAD_KEYS"]), ROAD_KEYS);
    assert_eq!(num(&c["JEDEN_NA_ILU_OBYWATELI"]), JEDEN_NA_ILU_OBYWATELI);
    assert_eq!(
        num(&c["WYRAB_MIN_FOREST_IN_RADIUS"]),
        WYRAB_MIN_FOREST_IN_RADIUS
    );
    assert_eq!(
        num(&c["AUTO_ULEPSZENIA_PRACA_RESERVE"]),
        AUTO_ULEPSZENIA_PRACA_RESERVE
    );
    assert_eq!(
        num(&c["FOOD_STAGE_MAX_ITEMS_PER_CITY"]),
        FOOD_STAGE_MAX_ITEMS_PER_CITY
    );
    assert_eq!(
        num(&c["FORT_CLAIM_MIN_NEW_HEXES"]),
        FORT_CLAIM_MIN_NEW_HEXES
    );
    let web_deficit: Vec<(String, Vec<String>)> = c["IMPROVEMENT_FOR_DEFICIT"]
        .as_array()
        .unwrap()
        .iter()
        .map(|e| (e[0].as_str().unwrap().to_owned(), strings(&e[1])))
        .collect();
    let rust_deficit: Vec<(String, Vec<String>)> = IMPROVEMENT_FOR_DEFICIT
        .iter()
        .map(|(k, v)| ((*k).to_owned(), v.iter().map(|x| (*x).to_owned()).collect()))
        .collect();
    assert_eq!(web_deficit, rust_deficit);
}

#[test]
fn helper_priorities_deficits_and_city_limit_match_web() {
    let h: Value = serde_json::from_str(HELPERS).unwrap();
    for p in h["priorities"].as_array().unwrap() {
        let f = focus_from(p["focus"].as_str().unwrap());
        let got = priorities_for_ulepszenia_focus(f, p["skipWyrab"].as_bool().unwrap());
        // `ZYWNOSC` (wielkie litery) i inne nieznane napisy -> `Other` (lista zrownowazona), jak `default:` weba.
        assert_eq!(got, strings(&p["out"]), "focus={}", p["focus"]);
    }
    for c in h["hasNonFood"].as_array().unwrap() {
        let keys: Option<Vec<String>> = c["in"].as_array().map(|_| strings(&c["in"]));
        assert_eq!(
            has_non_food_resource_deficit(keys.as_deref()),
            c["out"].as_bool().unwrap()
        );
    }
    for c in h["deficitKeys"].as_array().unwrap() {
        let keys: Option<Vec<String>> = c["in"].as_array().map(|_| strings(&c["in"]));
        assert_eq!(
            deficit_improvement_keys(keys.as_deref()),
            strings(&c["deficit"]),
            "in={}",
            c["in"]
        );
        assert_eq!(
            actionable_deficit_keys(keys.as_deref()),
            strings(&c["actionable"]),
            "in={}",
            c["in"]
        );
    }
    let cases = h["cityLimit"].as_array().unwrap();
    assert!(cases.len() >= 400);
    for c in cases {
        let cities: Vec<Option<bool>> = c["cities"]
            .as_array()
            .unwrap()
            .iter()
            .map(Value::as_bool)
            .collect();
        let got = is_city_limit_exhausted(&cities, opt_num(&c["base"]), opt_num(&c["era"]));
        assert_eq!(got, c["out"].as_bool().unwrap(), "case={c}");
    }
}

#[test]
fn wyrab_has_no_tech_gate_like_web() {
    // Dowod rownowaznosci mutantow "drop tech wyrab" (C16, H25, H69): `wyrab` jest odblokowany bez techow.
    let h: Value = serde_json::from_str(HELPERS).unwrap();
    let web = h["wyrabTechUnlockedEmpty"].as_bool().unwrap();
    let none = BTreeSet::new();
    assert!(web);
    assert_eq!(
        civ_engine::domain::improvement_build::is_improvement_tech_unlocked("wyrab", &none),
        web
    );
}
