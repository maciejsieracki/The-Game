//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q6-Q1 (pin weba 23dd158e9; wektory zregenerowane z uruchomionego weba tego pinu (REPIN-VECTORS-POSTMERGE-Q1)): WIAZANIE `advance_city_economy` z petla tury
//! (`turn_economy_wire::run_economy_tick_for_game`) i moduly wejsc (`turn_economy_inputs_{trade,wonders,state}`).
//! Porownanie BITOWE z URUCHOMIONYM webem
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q6-Q1/gen-p6-adv-q6-vectors.mjs`): wszystkie pola
//! `EconomyTickResult`, stan miast PO ticku i PO bankowaniu (odjete utrzymanie surowcowe), pośrednie mapy wejsc
//! (dochod z tras, premia budynkowa, reczny podatek, cuda, stolica), lask Mennicy po `finalize`, skarbiec/nauka po
//! bankowaniu per owner (kolejnosc dzialan f64 jak w `main.ts`).

#[path = "p6_7b_vectors/common.rs"]
mod common;

use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet};

use civ_engine::data::buildings_tech::{parse_buildings, parse_wonders};
use civ_engine::data::civilizations::Num;
use civ_engine::data::terrain_map::{parse_terrain_yields, TerrainYieldsFile};
use civ_engine::domain::civ_matrix::load_civ_matrix;
use civ_engine::domain::improvement_build::{terrain_from_web_value, BuildHex, BuildMap};
use civ_engine::domain::okolica::Reczne;
use civ_engine::domain::recruitment::manpower::ManpowerHealUnit;
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::city_founding::p6_6b::cities::{
    City, CityPodzialHandlu, CityPodzialPracy, FoodBuffer, OkolicaFocus, OkolicaTryb, WealthState,
};
use civ_engine::domain::trade::{TradeRoute, TradeRouteMedium, TradeRouteStatus};
use civ_engine::domain::turn_economy_inputs_state::{
    build_manual_work_tax_by_city, capital_city_id_for_owner, MennicaZlotoGraceState,
};
use civ_engine::domain::turn_economy_inputs_trade::{
    build_trade_tick_inputs, load_pin_trade_income_params,
};
use civ_engine::domain::turn_economy_inputs_wonders::{
    build_wonder_city_yields_by_owner_map, sum_wonder_city_yields_for_owner,
    sum_wonder_trade_route_bonus_for_owner, wonder_ids_owned_by, PlacedWonderRef,
};
use civ_engine::domain::turn_economy_loop::{CityLoopExtra, OrderYieldMults};
use civ_engine::domain::turn_economy_territory::TerrainContext;
use civ_engine::domain::turn_economy_tick::{EconUnit, HealRequest};
use civ_engine::domain::turn_economy_upkeep::unit_rows_from_json_str;
use civ_engine::domain::turn_economy_wire::{
    run_economy_tick_for_game, GameEconomyContext, GameEconomyTickOutcome,
};
use civ_engine::domain::PlayerId;
use common::*;
use serde_json::{json, Value};

const VECTORS: &str = include_str!("p6_adv_q6_vectors/q6.json");
const ECON: &str = include_str!("../data/econ-params.json");
const SOCIETY: &str = include_str!("../data/society-params.json");
const UNITS: &str = include_str!("../data/units.json");

fn build_map(m: &Value) -> BuildMap {
    let hexes = m["hexes"]
        .as_array()
        .unwrap()
        .iter()
        .map(|h| {
            let a = h.as_array().unwrap();
            let mut hex = BuildHex::new(
                a[0].as_i64().unwrap() as i32,
                a[1].as_i64().unwrap() as i32,
                terrain_from_web_value(a[2].as_str().unwrap()).expect("teren"),
                Overlay::from_web_value(a[3].as_str().unwrap()).expect("nakladka"),
            );
            hex.river_present = a[4].as_i64().unwrap() == 1;
            hex.ulepszenie = a[5].as_str().map(str::to_owned);
            hex.ulepszenia = a[6].as_array().map(|l| l.iter().map(text).collect());
            hex.zloze = a[7].as_str().map(str::to_owned);
            hex
        })
        .collect();
    BuildMap::new(hexes, Vec::new())
}

fn opt_num(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

fn city_of(c: &Value) -> City {
    let food = &c["food"];
    let magazyn = if food.get("none").is_some() {
        None
    } else if let Some(n) = food.get("num") {
        Some(FoodBuffer::Number(num(n)))
    } else if let Some(o) = food.get("obj") {
        Some(FoodBuffer::Legacy {
            aktualny: o.get("aktualny").and_then(js_num),
        })
    } else {
        Some(FoodBuffer::Other)
    };
    City {
        id: text(&c["id"]),
        owner_id: c["owner"].as_i64().unwrap(),
        q: num(&c["q"]),
        r: num(&c["r"]),
        name: text(&c["id"]),
        population: num(&c["pop"]),
        surowce: c.get("surowce").and_then(|s| {
            s.as_object()
                .map(|o| o.iter().map(|(k, x)| (k.clone(), num(x))).collect())
        }),
        okolica_tryb: c["tryb"]
            .as_str()
            .map(|s| OkolicaTryb::from_web(s).expect("tryb")),
        okolica_focus: c["focus"]
            .as_str()
            .map(|s| OkolicaFocus::from_web(s).expect("focus")),
        magazyn_zywnosci: magazyn,
        okolica_reczne: c.get("reczne").and_then(Value::as_array).map(|pairs| {
            let mut r = Reczne::new();
            for p in pairs {
                r.set(p[0].as_str().unwrap(), num(&p[1]));
            }
            r
        }),
        wzrost_ulamkowy: opt_num(&c["frac"]),
        poziom_racji: opt_num(&c["racja"]),
        procent_rozwoj: opt_num(&c["proc"]),
        wealth_state: c["wealth"].as_object().map(|w| WealthState {
            poziom: num(&w["poziom"]),
            pula: num(&w["pula"]),
        }),
        wealth_immunity_remaining: opt_num(&c["immun"]),
        podzial_handlu: c["ph"].as_object().map(|p| CityPodzialHandlu {
            procent_nauka: num(&p["n"]),
            procent_pieniadz: num(&p["p"]),
            procent_luksus: num(&p["l"]),
        }),
        podzial_handlu_override: c["ph"].as_object().map(|p| p["over"].as_bool().unwrap()),
        podzial_pracy: c["pp"].as_object().map(|p| CityPodzialPracy {
            procent_budynki: num(&p["b"]),
        }),
        podzial_pracy_override: c["pp"].as_object().map(|p| p["over"].as_bool().unwrap()),
        ..City::default()
    }
}

fn str_map<T>(v: &Value, f: impl Fn(&Value) -> T) -> BTreeMap<String, T> {
    v.as_object()
        .unwrap()
        .iter()
        .map(|(k, x)| (k.clone(), f(x)))
        .collect()
}

fn owner_map<T>(v: &Value, f: impl Fn(&Value) -> T) -> BTreeMap<i64, T> {
    v.as_object()
        .unwrap()
        .iter()
        .map(|(k, x)| (k.parse::<i64>().unwrap(), f(x)))
        .collect()
}

macro_rules! chk {
    ($cond:expr, $($arg:tt)*) => {
        if !$cond {
            return Err(format!($($arg)*));
        }
    };
}

fn bits(got: f64, want: f64) -> bool {
    (got.is_nan() && want.is_nan()) || got.to_bits() == want.to_bits()
}

fn chk_bits(label: &str, got: f64, want: f64) -> Result<(), String> {
    chk!(bits(got, want), "{label}: rust={got:?} web={want:?}");
    Ok(())
}

fn chk_tick(label: &str, got: f64, w: &Value, key: &str) -> Result<(), String> {
    chk!(w.get(key).is_some(), "{label}: brak pola weba {key}");
    chk_bits(&format!("{label} {key}"), got, num(&w[key]))
}

fn opt_unit_num(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

fn heal_unit_of(u: &Value) -> ManpowerHealUnit {
    ManpowerHealUnit {
        id: text(&u["id"]),
        owner_id: u["ownerId"].as_i64().unwrap(),
        type_id: text(&u["typeId"]),
        category: text(&u["category"]),
        hp: opt_unit_num(&u["hp"]),
        hp_max: opt_unit_num(&u["hpMax"]),
        parametry_bonus_proc: opt_unit_num(&u["parametryBonusProc"]),
        battles_survived: opt_unit_num(&u["battlesSurvived"]),
        q: u["q"].as_i64().map(|x| x as i32),
        r: u["r"].as_i64().map(|x| x as i32),
        in_garnizon: u["inGarnizon"].as_bool(),
    }
}

fn chk_rec(label: &str, got: &BTreeMap<String, f64>, want: &Value) -> Result<(), String> {
    let w = want
        .as_object()
        .ok_or(format!("{label}: web nie jest rekordem"))?;
    chk!(
        got.len() == w.len(),
        "{label}: klucze rust={:?} web={:?}",
        got.keys().collect::<Vec<_>>(),
        w.keys().collect::<Vec<_>>()
    );
    for (k, v) in got {
        let x = w
            .get(k)
            .ok_or(format!("{label}: klucz {k} nieobecny w webie"))?;
        chk_bits(&format!("{label}.{k}"), *v, num(x))?;
    }
    Ok(())
}

fn chk_owner_recs(
    label: &str,
    got: &BTreeMap<i64, BTreeMap<String, f64>>,
    want: &Value,
) -> Result<(), String> {
    let w = want.as_object().unwrap();
    let want_keys: BTreeSet<i64> = w.keys().map(|k| k.parse().unwrap()).collect();
    let got_keys: BTreeSet<i64> = got.keys().copied().collect();
    chk!(
        want_keys == got_keys,
        "{label}: wlasciciele rust={got_keys:?} web={want_keys:?}"
    );
    for (o, rec) in got {
        chk_rec(&format!("{label}[{o}]"), rec, &w[&o.to_string()])?;
    }
    Ok(())
}

/// Porownanie WSZYSTKICH pol `EconomyTickResult` + stanu miast + leczenia z webem.
fn compare(name: &str, s: &Value, ran: &Ran) -> Result<(), String> {
    let w = &s["out"];
    let r = &ran.out.result;

    // ---- perCity (36 pol) ----
    let want_ticks = arr(w, "perCity");
    chk!(
        r.per_city.len() == want_ticks.len(),
        "{name} liczba tickow {} vs {}",
        r.per_city.len(),
        want_ticks.len()
    );
    for (t, wt) in r.per_city.iter().zip(want_ticks) {
        let l = format!("{name} {}", t.city_id);
        chk!(t.city_id == text(&wt["cityId"]), "{l} id");
        chk!(t.owner_id == wt["ownerId"].as_i64().unwrap(), "{l} owner");
        for (got, key) in [
            (t.owner_era, "ownerEra"),
            (t.praca, "praca"),
            (t.pieniadz, "pieniadz"),
            (t.pieniadz_brutto, "pieniadzBrutto"),
            (t.zywnosc_netto, "zywnoscNetto"),
            (t.nauka, "nauka"),
            (t.luksus, "luksus"),
            (t.kultura, "kultura"),
            (t.ludnosc_przed, "ludnoscPrzed"),
            (t.ludnosc_po, "ludnoscPo"),
            (t.zdrowie, "zdrowie"),
            (t.do_budynkow, "doBudynkow"),
            (t.do_puli, "doPuli"),
            (t.wealth_mnoznik, "wealthMnoznik"),
            (t.wealth_zadowolenie, "wealthZadowolenie"),
            (
                t.garncarnia_surplus_zadowolenie,
                "garncarniaSurplusZadowolenie",
            ),
            (t.pieniadz_z_pracy, "pieniadzZPracy"),
            (t.pieniadz_z_tras, "pieniadzZTras"),
            (t.magazyn_po_turze, "magazynPoTurze"),
            (t.procent_rozwoj, "procentRozwoj"),
            (t.zywnosc_brutto, "zywnoscBrutto"),
            (t.koszt_racji, "kosztRacji"),
            (t.bilans_lokalny, "bilansLokalny"),
            (t.poziom_racji, "poziomRacji"),
        ] {
            chk_tick(&l, got, wt, key)?;
        }
        for (got, key) in [
            (t.wzrost, "wzrost"),
            (t.ubytek, "ubytek"),
            (t.oblegany, "oblegany"),
            (t.oblegany_glod, "obleganyGlod"),
            (t.ma_spichlerz, "maSpichlerz"),
            (t.ma_spichlerz_ii, "maSpichlerzII"),
            (t.spichlerz_ceramika, "spichlerzCeramika"),
            (t.spichlerz_sol, "spichlerzSol"),
        ] {
            chk!(got == wt[key].as_bool().unwrap(), "{l} {key}");
        }
        match (t.wzrost_procent, wt.get("wzrostProcent")) {
            (Some(g), Some(x)) => chk_bits(&format!("{l} wzrostProcent"), g, num(x))?,
            (None, None) => {}
            (g, x) => return Err(format!("{l} wzrostProcent rust={g:?} web={x:?}")),
        }
        match (t.wzrost_ulamkowy_po, wt.get("wzrostUlamkowyPo")) {
            (Some(g), Some(x)) => chk_bits(&format!("{l} wzrostUlamkowyPo"), g, num(x))?,
            (None, None) => {}
            (g, x) => return Err(format!("{l} wzrostUlamkowyPo rust={g:?} web={x:?}")),
        }
    }

    // ---- sumy i growth/starved ----
    let wt = &w["totals"];
    chk_tick(name, r.cities, wt, "cities")?;
    chk_tick(name, r.total_praca, wt, "praca")?;
    chk_tick(name, r.total_pieniadz, wt, "pieniadz")?;
    chk_tick(name, r.total_nauka, wt, "nauka")?;
    chk_tick(name, r.total_luksus, wt, "luksus")?;
    chk_tick(name, r.total_kultura, wt, "kultura")?;
    chk_tick(name, r.total_zywnosc, wt, "zywnosc")?;
    chk_tick(name, r.total_praca_pula, wt, "pracaPula")?;
    chk_tick(name, r.growth, wt, "growth")?;
    chk_tick(name, r.starved, wt, "starved")?;

    // ---- incomeByOwner (wejscie P23) ----
    let want_inc = w["income"].as_object().unwrap();
    chk!(
        ran.out.city_loop.income_by_owner.len() == want_inc.len(),
        "{name} income"
    );
    for (o, v) in &ran.out.city_loop.income_by_owner {
        chk_bits(
            &format!("{name} income {o}"),
            *v,
            num(&want_inc[&o.to_string()]),
        )?;
    }

    // ---- P23: upkeepByOwner ----
    let wu = w["upkeep"].as_object().unwrap();
    let want_owners: BTreeSet<i64> = wu.keys().map(|k| k.parse().unwrap()).collect();
    let got_owners: BTreeSet<i64> = r.upkeep_by_owner.keys().copied().collect();
    chk!(
        want_owners == got_owners,
        "{name} upkeepByOwner wlasciciele rust={got_owners:?} web={want_owners:?}"
    );
    for (o, b) in &r.upkeep_by_owner {
        let x = &wu[&o.to_string()];
        let l = format!("{name} upkeep[{o}]");
        chk_bits(&format!("{l} budynki"), b.utrzymanie_budynki, num(&x["b"]))?;
        chk_bits(
            &format!("{l} jednostki"),
            b.utrzymanie_jednostki,
            num(&x["j"]),
        )?;
        chk_bits(&format!("{l} razem"), b.utrzymanie_razem, num(&x["r"]))?;
        chk_bits(&format!("{l} saldo"), b.saldo, num(&x["s"]))?;
        chk!(b.deficyt == x["d"].as_bool().unwrap(), "{l} deficyt");
    }
    chk_owner_recs(
        &format!("{name} resourceUpkeepByOwner"),
        &r.resource_upkeep_by_owner,
        &w["resUp"],
    )?;
    chk_owner_recs(
        &format!("{name} resourceUpkeepBuildingsByOwner"),
        &r.resource_upkeep_buildings_by_owner,
        &w["resUpB"],
    )?;
    chk_owner_recs(
        &format!("{name} resourceUpkeepUnitsByOwner"),
        &r.resource_upkeep_units_by_owner,
        &w["resUpU"],
    )?;
    // ---- P4: pracaUpkeepByOwner ----
    let wp = w["praca"].as_object().unwrap();
    chk!(
        r.praca_upkeep_by_owner.len() == wp.len(),
        "{name} pracaUpkeepByOwner liczba"
    );
    for (o, v) in &r.praca_upkeep_by_owner {
        chk_bits(&format!("{name} praca[{o}]"), *v, num(&wp[&o.to_string()]))?;
    }

    // ---- stan miast po ticku (wlacznie z pulami MP po leczeniu) ----
    for (c, wa) in ran.cities.iter().zip(arr(w, "after")) {
        let l = format!("{name} {} after", c.id);
        chk!(c.id == text(&wa["id"]), "{l}");
        match (c.wealth_state, wa["wealthState"].as_object()) {
            (Some(ws), Some(x)) => {
                chk_bits(&format!("{l} poziom"), ws.poziom, num(&x["poziom"]))?;
                chk_bits(&format!("{l} pula"), ws.pula, num(&x["pula"]))?;
            }
            (None, None) => {}
            (g, x) => return Err(format!("{l} wealthState rust={g:?} web={x:?}")),
        }
        chk_bits(
            &format!("{l} immunitet"),
            c.wealth_immunity_remaining.unwrap_or(f64::NAN),
            if wa["immun"].is_null() {
                f64::NAN
            } else {
                num(&wa["immun"])
            },
        )?;
        match (&c.magazyn_zywnosci, &wa["food"]) {
            (None, Value::Null) => {}
            (Some(FoodBuffer::Legacy { .. } | FoodBuffer::Other), Value::String(x))
                if x == "obj" => {}
            (Some(FoodBuffer::Number(g)), x) => chk_bits(&format!("{l} food"), *g, num(x))?,
            (g, x) => return Err(format!("{l} food rust={g:?} web={x:?}")),
        }
        let ex = ran.extras.get(&c.id).copied().unwrap_or_default();
        let want_mp = if wa["manpower"].is_null() {
            None
        } else {
            Some(num(&wa["manpower"]))
        };
        match (ex.manpower, want_mp) {
            (Some(g), Some(x)) => chk_bits(&format!("{l} manpower"), g, x)?,
            (None, None) => {}
            (g, x) => return Err(format!("{l} manpower rust={g:?} web={x:?}")),
        }
    }

    // ---- P24: leczenie ----
    match (&w["heal"], ran.out.heal) {
        (Value::Null, None) => {}
        (wh, Some(_)) => {
            let want_units = arr(wh, "units");
            chk!(
                ran.heal_units.len() == want_units.len(),
                "{name} heal jednostki"
            );
            for (u, wu) in ran.heal_units.iter().zip(want_units) {
                let l = format!("{name} heal {}", u.id);
                chk!(u.id == text(&wu["id"]), "{l} id");
                chk_bits(
                    &format!("{l} hp"),
                    u.hp.unwrap_or(f64::NAN),
                    if wu["hp"].is_null() {
                        f64::NAN
                    } else {
                        num(&wu["hp"])
                    },
                )?;
                chk_bits(
                    &format!("{l} hpMax"),
                    u.hp_max.unwrap_or(f64::NAN),
                    if wu["hpMax"].is_null() {
                        f64::NAN
                    } else {
                        num(&wu["hpMax"])
                    },
                )?;
            }
            let canon = |v: &Value| -> String {
                let c = |x: &Value| {
                    js_num(x).map_or(x.to_string(), |n| format!("{:016x}", n.to_bits()))
                };
                v.as_array()
                    .unwrap()
                    .iter()
                    .map(|call| {
                        let a = call.as_array().unwrap();
                        format!("{}:{}:{}", a[0].as_str().unwrap(), c(&a[1]), c(&a[2]))
                    })
                    .collect::<Vec<_>>()
                    .join("|")
            };
            chk!(
                canon(&Value::Array(ran.hp_calls.clone())) == canon(&wh["calls"]),
                "{name} wywolania onUnitHpChanged"
            );
        }
        (wh, None) => return Err(format!("{name} heal: rust=None web={wh}")),
    }
    Ok(())
}

struct Ctx {
    matrix: civ_engine::data::civilizations::CivMatrixFile,
    maps: Vec<BuildMap>,
    ty: TerrainYieldsFile,
    society: Value,
    unit_rows: Vec<civ_engine::domain::turn_economy::economy_upkeep_p2::UnitRow>,
    buildings: Vec<civ_engine::data::buildings_tech::Building>,
    wonders: civ_engine::data::buildings_tech::Wonders,
}

struct Ran {
    out: civ_engine::domain::turn_economy_tick::AdvanceTickOutcome,
    wire: GameEconomyTickOutcome,
    cities: Vec<City>,
    extras: BTreeMap<String, CityLoopExtra>,
    heal_units: Vec<ManpowerHealUnit>,
    hp_calls: Vec<Value>,
    grace: MennicaZlotoGraceState,
    routes: Vec<TradeRoute>,
    placed: Vec<PlacedWonderRef>,
    capital: BTreeMap<i64, String>,
    tax: BTreeMap<i64, f64>,
}

fn route_of(r: &Value) -> TradeRoute {
    TradeRoute::from_parts(
        text(&r["id"]),
        text(&r["fromCityId"]),
        text(&r["toCityId"]),
        PlayerId::new(r["ownerId"].as_u64().unwrap()),
        PlayerId::new(r["toOwnerId"].as_u64().unwrap()),
        match r["medium"].as_str().unwrap() {
            "lad" => TradeRouteMedium::Land,
            _ => TradeRouteMedium::Sea,
        },
        r["dystans"].as_u64().unwrap() as u32,
        match r["status"].as_str().unwrap() {
            "polaczony" => TradeRouteStatus::Connected,
            _ => TradeRouteStatus::NoConnection,
        },
        r["budynekOdblokowany"].as_bool().unwrap(),
    )
}

/// Jedno uruchomienie Rust (wiazanie) dla scenariusza. `skip_native` = kontrola negatywna (natywny dostep pomijany).
fn run_rust(ctx: &Ctx, s: &Value) -> Ran {
    let mut cities: Vec<City> = arr(s, "cities").iter().map(city_of).collect();
    let mut extras: BTreeMap<String, CityLoopExtra> = arr(s, "cities")
        .iter()
        .map(|c| {
            (
                text(&c["id"]),
                CityLoopExtra {
                    oblegane: c["obl"].as_bool().unwrap(),
                    garnizon: opt_num(&c["garn"]),
                    manpower: opt_num(&c["mp"]),
                },
            )
        })
        .collect();
    let built: BTreeMap<String, Vec<String>> = arr(s, "cities")
        .iter()
        .map(|c| (text(&c["id"]), strings(&c["built"])))
        .collect();
    let om = &s["om"];
    let q = &s["q6in"];
    let era: BTreeMap<i64, f64> = owner_map(&q["era"], num);
    let era_f = |o: i64| era.get(&o).copied().unwrap_or(1.0);
    let tech: BTreeMap<i64, BTreeSet<String>> =
        owner_map(&q["tech"], |v| strings(v).into_iter().collect());
    let tech_f = |o: i64| tech.get(&o).cloned().unwrap_or_default();
    let native: BTreeMap<i64, bool> = owner_map(&q["native"], |v| v.as_bool().unwrap());
    let native_f = |o: i64| native.get(&o).copied().unwrap_or(false);
    let labels: BTreeMap<i64, Vec<String>> = owner_map(&q["labels"], strings);
    let labels_f = |o: i64| labels.get(&o).cloned().unwrap_or_default();
    let zbadane: BTreeSet<String> = strings(&om["zbadane"]).into_iter().collect();
    let diff = text(&s["difficulty"]);
    let econ = match &s["econ"] {
        Value::Null => serde_json::from_str::<Value>(ECON).expect("econ-params.json"),
        e => e.clone(),
    };
    let civ: BTreeMap<i64, String> = om["civ"]
        .as_object()
        .unwrap()
        .iter()
        .filter(|(_, v)| !v.is_null())
        .map(|(k, v)| (k.parse().unwrap(), text(v)))
        .collect();
    let order: BTreeMap<String, OrderYieldMults> = str_map(&s["order"], |m| OrderYieldMults {
        production_mult: num(&m["prod"]),
        pieniadz_mult: num(&m["pien"]),
        nauka_mult: num(&m["nauka"]),
        kultura_mult: num(&m["kult"]),
    });
    let def_h: BTreeMap<i64, CityPodzialHandlu> = owner_map(&om["defH"], |v| CityPodzialHandlu {
        procent_nauka: num(&v["n"]),
        procent_pieniadz: num(&v["p"]),
        procent_luksus: num(&v["l"]),
    });
    let def_p: BTreeMap<i64, CityPodzialPracy> = owner_map(&om["defP"], |v| CityPodzialPracy {
        procent_budynki: num(v),
    });
    let routes: Vec<TradeRoute> = arr(q, "routes").iter().map(route_of).collect();
    let placed: Vec<PlacedWonderRef> = arr(q, "placed")
        .iter()
        .map(|p| PlacedWonderRef {
            owner_id: p["owner"].as_i64().unwrap(),
            wonder_id: text(&p["id"]),
        })
        .collect();
    let tax: BTreeMap<i64, f64> = owner_map(&q["tax"], num);
    let capital: BTreeMap<i64, String> = owner_map(&q["capital"], text);
    let humans: BTreeSet<i64> = arr(q, "humans")
        .iter()
        .map(|v| v.as_i64().unwrap())
        .collect();
    let mut grace = MennicaZlotoGraceState {
        grace_turns_left: owner_map(&q["grace"]["left"], num),
        had_access_last_turn: owner_map(&q["grace"]["had"], |v| v.as_bool().unwrap()),
    };
    let tctx = TerrainContext {
        map: &ctx.maps[s["mapIdx"].as_u64().unwrap() as usize],
        terrain_yields: &ctx.ty,
    };
    let econ_units: Vec<EconUnit> = arr(s, "units")
        .iter()
        .map(|u| EconUnit {
            owner_id: u["owner"].as_i64().unwrap(),
            type_id: text(&u["typeId"]),
        })
        .collect();
    let mut heal_units: Vec<ManpowerHealUnit> = if s["heal"].is_object() {
        arr(&s["heal"], "units").iter().map(heal_unit_of).collect()
    } else {
        Vec::new()
    };
    let max_hp: BTreeMap<String, f64> = s["heal"]["maxHpByType"]
        .as_object()
        .map(|o| o.iter().map(|(k, v)| (k.clone(), num(v))).collect())
        .unwrap_or_default();
    let get_max_hp = |t: &str, _u: &ManpowerHealUnit| max_hp[t];
    let hp_calls: RefCell<Vec<Value>> = RefCell::new(Vec::new());
    let mut on_changed = |id: &str, hp: f64, hp_max: f64| {
        hp_calls
            .borrow_mut()
            .push(json!([id, enc(hp), enc(hp_max)]));
    };
    let heal = if s["heal"].is_object() {
        Some(HealRequest {
            units: &mut heal_units,
            get_max_hp: &get_max_hp,
            on_unit_hp_changed: Some(&mut on_changed),
        })
    } else {
        None
    };
    let gctx = GameEconomyContext {
        difficulty: &diff,
        player_era: num(&s["playerEra"]),
        player_zbadane: &zbadane,
        econ_params: &econ,
        terrain: &tctx,
        matrix: &ctx.matrix,
        buildings: &ctx.buildings,
        unit_rows: &ctx.unit_rows,
        society_params: Some(&ctx.society),
        wonders: &ctx.wonders,
        built_by_city: &built,
        owner_civ_by_owner_id: &civ,
        order_mult_by_city: &order,
        owner_default_podzial_handlu_by_owner: &def_h,
        owner_default_podzial_pracy_by_owner: &def_p,
        trade_routes: &routes,
        placed_wonders: &placed,
        pending_manual_work_tax_by_owner: &tax,
        capital_city_id_by_owner: &capital,
        human_owner_ids: &humans,
        econ_units: &econ_units,
        owner_era: &era_f,
        owner_tech: &tech_f,
        native_zloto_access: &native_f,
        empire_active_labels: &labels_f,
    };
    let wire = run_economy_tick_for_game(&mut cities, &mut extras, &mut grace, &gctx, heal);
    let hp_calls = hp_calls.into_inner();
    Ran {
        out: wire.tick.clone(),
        wire,
        cities,
        extras,
        heal_units,
        hp_calls,
        grace,
        routes,
        placed,
        capital,
        tax,
    }
}

/// Porownanie czesci Q6: pośrednie mapy wejsc, bankowanie, lask, stan zapasow miast PO bankowaniu.
fn compare_q6(ctx: &Ctx, name: &str, s: &Value, ran: &Ran) -> Result<(), String> {
    let w = &s["out"]["q6"];
    let q = &s["q6in"];
    let diff = text(&s["difficulty"]);
    let econ = match &s["econ"] {
        Value::Null => serde_json::from_str::<Value>(ECON).expect("econ-params.json"),
        e => e.clone(),
    };
    let era: BTreeMap<i64, f64> = owner_map(&q["era"], num);
    let era_f = |o: i64| era.get(&o).copied().unwrap_or(1.0);

    // ---- parametry krzywych handlu ----
    let ip = load_pin_trade_income_params(Some(&econ), &diff);
    let want_lad: Vec<f64> = arr(&w["inputs"]["incomeParams"], "lad")
        .iter()
        .map(num)
        .collect();
    let want_mor: Vec<f64> = arr(&w["inputs"]["incomeParams"], "morze")
        .iter()
        .map(num)
        .collect();
    chk!(
        ip.dochody_ladowe.len() == want_lad.len() && ip.dochody_morskie.len() == want_mor.len(),
        "{name} dlugosc krzywych"
    );
    for (i, (g, x)) in ip.dochody_ladowe.iter().zip(&want_lad).enumerate() {
        chk_bits(&format!("{name} lad[{i}]"), *g, *x)?;
    }
    for (i, (g, x)) in ip.dochody_morskie.iter().zip(&want_mor).enumerate() {
        chk_bits(&format!("{name} morze[{i}]"), *g, *x)?;
    }

    // ---- cuda: trade bonus per owner/medium, mapa plonow miasta ----
    let wt = w["inputs"]["wonderTrade"].as_object().unwrap();
    for (o, v) in wt {
        let o: i64 = o.parse().unwrap();
        let ids = wonder_ids_owned_by(&ran.placed, o);
        for (medium, key) in [
            (TradeRouteMedium::Land, "lad"),
            (TradeRouteMedium::Sea, "morze"),
        ] {
            let got = sum_wonder_trade_route_bonus_for_owner(&ctx.wonders, &ids, era_f(o), medium);
            chk_bits(&format!("{name} wonderTrade[{o}].{key}"), got, num(&v[key]))?;
        }
    }
    let owner_ids: Vec<i64> = ran.cities.iter().map(|c| c.owner_id).collect();
    let wm = build_wonder_city_yields_by_owner_map(&ctx.wonders, &ran.placed, &owner_ids, &era_f);
    let want_wm = w["inputs"]["wonderMap"].as_object().unwrap();
    let got_keys: BTreeSet<i64> = wm.keys().copied().collect();
    let want_keys: BTreeSet<i64> = want_wm.keys().map(|k| k.parse().unwrap()).collect();
    chk!(
        got_keys == want_keys,
        "{name} mapa cudow wlasciciele rust={got_keys:?} web={want_keys:?}"
    );
    for (o, b) in &wm {
        let x = &want_wm[&o.to_string()];
        let full = sum_wonder_city_yields_for_owner(
            &ctx.wonders,
            &wonder_ids_owned_by(&ran.placed, *o),
            era_f(*o),
        );
        for (g, k) in [
            (full.pieniadz, "pieniadz"),
            (full.zywnosc, "zywnosc"),
            (full.nauka, "nauka"),
            (full.kultura, "kultura"),
            (full.zadowolenie, "zadowolenie"),
            (full.praca, "praca"),
            (full.obrona, "obrona"),
        ] {
            chk_bits(&format!("{name} wonder[{o}].{k}"), g, num(&x[k]))?;
        }
        chk_bits(
            &format!("{name} wonderLoop[{o}]"),
            b.praca,
            num(&x["praca"]),
        )?;
    }

    // ---- trasy (te same funkcje co w wiazaniu) ----
    let era_owner = |o: i64, m: TradeRouteMedium| {
        sum_wonder_trade_route_bonus_for_owner(
            &ctx.wonders,
            &wonder_ids_owned_by(&ran.placed, o),
            era_f(o),
            m,
        )
    };
    let built: BTreeMap<String, Vec<String>> = arr(s, "cities")
        .iter()
        .map(|c| (text(&c["id"]), strings(&c["built"])))
        .collect();
    let targ_val = civ_engine::domain::economy_city_params::load_econ_params(&econ, &diff)
        .budynek_targowisko_bonus_handlu;
    let targ = |cid: &str| {
        if built
            .get(cid)
            .is_some_and(|b| b.iter().any(|x| x == "targowisko"))
        {
            targ_val
        } else {
            0.0
        }
    };
    let ti = build_trade_tick_inputs(&ran.routes, &ip, &era_owner, &targ);
    chk_rec(
        &format!("{name} tradeIncome"),
        &ti.trade_income_by_city,
        &w["inputs"]["tradeIncome"],
    )?;
    chk_rec(
        &format!("{name} maritime"),
        &ti.maritime_trade_income_by_city,
        &w["inputs"]["maritime"],
    )?;
    chk_rec(
        &format!("{name} buildingBonus"),
        &ti.trade_route_building_bonus_by_city,
        &w["inputs"]["bonus"],
    )?;

    // ---- reczny podatek + stolica ----
    let mt = build_manual_work_tax_by_city(&ran.tax, &ran.capital, &ran.cities);
    chk_rec(&format!("{name} manualTax"), &mt, &w["inputs"]["manualTax"])?;
    for (o, v) in w["inputs"]["capital"].as_object().unwrap() {
        let o: i64 = o.parse().unwrap();
        let got = capital_city_id_for_owner(o, &ran.capital, &ran.cities);
        let want = v.as_str().map(str::to_owned);
        chk!(got == want, "{name} stolica[{o}] rust={got:?} web={want:?}");
    }

    // ---- lask Mennicy po finalize ----
    let gl: BTreeMap<i64, f64> = owner_map(&w["graceAfter"]["left"], num);
    chk!(
        ran.grace.grace_turns_left.len() == gl.len(),
        "{name} lask liczba rust={:?} web={gl:?}",
        ran.grace.grace_turns_left
    );
    for (o, v) in &ran.grace.grace_turns_left {
        chk_bits(&format!("{name} lask[{o}]"), *v, gl[o])?;
    }
    let gh: BTreeMap<i64, bool> = owner_map(&w["graceAfter"]["had"], |v| v.as_bool().unwrap());
    chk!(
        ran.grace.had_access_last_turn == gh,
        "{name} migawka dostepu rust={:?} web={gh:?}",
        ran.grace.had_access_last_turn
    );

    // ---- bankowanie ----
    let wb = arr(w, "banks");
    chk!(
        ran.wire.banks.len() == wb.len(),
        "{name} banki rust={} web={}",
        ran.wire.banks.len(),
        wb.len()
    );
    for (b, x) in ran.wire.banks.iter().zip(wb) {
        let l = format!("{name} bank[{}]", b.owner_id);
        chk!(b.owner_id == x["owner"].as_i64().unwrap(), "{l} owner");
        chk!(b.is_human == x["human"].as_bool().unwrap(), "{l} human");
        for (g, k) in [
            (b.sum.pieniadz, "pieniadz"),
            (b.sum.nauka, "nauka"),
            (b.sum.do_puli, "doPuli"),
            (b.sum.praca, "praca"),
            (b.sum.kultura, "kultura"),
            (b.sum.pieniadz_z_tras, "pieniadzZTras"),
        ] {
            chk_bits(&format!("{l} sum.{k}"), g, num(&x["sum"][k]))?;
        }
        chk_bits(
            &format!("{l} utrzymanie"),
            b.upkeep_applied,
            num(&x["upkeepApplied"]),
        )?;
        chk!(b.deficyt == x["deficyt"].as_bool().unwrap(), "{l} deficyt");
        chk_rec(
            &format!("{l} resDeducted"),
            &b.resource_upkeep_deducted,
            &x["resDeducted"],
        )?;
        let before = &q["before"][b.owner_id.to_string()];
        let (sk, na) = if before.is_object() {
            (num(&before["sk"]), num(&before["na"]))
        } else {
            (0.0, 0.0)
        };
        let bonus = q["aiBonus"]
            .get(b.owner_id.to_string())
            .map(num)
            .unwrap_or(0.0);
        chk_bits(
            &format!("{l} skarbiec po"),
            b.apply_treasury(sk),
            num(&x["skarbPo"]),
        )?;
        chk_bits(
            &format!("{l} nauka po"),
            b.apply_science(na, bonus),
            num(&x["naukaPo"]),
        )?;
    }

    // ---- zapasy miast PO bankowaniu ----
    for (c, wa) in ran.cities.iter().zip(arr(&s["out"], "after")) {
        match (&c.surowce, wa["surowce"].is_null()) {
            (None, true) => {}
            (Some(m), false) => chk_rec(&format!("{name} {} surowce po", c.id), m, &wa["surowce"])?,
            (g, _) => {
                return Err(format!(
                    "{name} {} surowce rust={g:?} web={}",
                    c.id, wa["surowce"]
                ))
            }
        }
    }
    Ok(())
}

fn make_ctx(d: &Value) -> Ctx {
    let mut matrix = load_civ_matrix().file.clone();
    for (civ, params) in d["matrixPatch"].as_object().unwrap() {
        let row = matrix
            .cywilizacje
            .iter_mut()
            .find(|c| &c.ikona_id == civ)
            .unwrap_or_else(|| panic!("brak cywilizacji {civ}"));
        for (k, v) in params.as_object().unwrap() {
            let n = v.as_f64().unwrap();
            let val = if n.fract() == 0.0 {
                Num::Int(n as i64)
            } else {
                Num::Float(n)
            };
            row.params.insert(k.clone(), val);
        }
    }
    Ctx {
        matrix,
        maps: arr(d, "maps").iter().map(build_map).collect(),
        ty: parse_terrain_yields().expect("terrain-yields.json"),
        society: serde_json::from_str(SOCIETY).unwrap(),
        unit_rows: unit_rows_from_json_str(UNITS).expect("units.json"),
        buildings: parse_buildings().expect("buildings.json"),
        wonders: parse_wonders().expect("wonders.json"),
    }
}

/// Wiazanie `run_economy_tick_for_game` zgodne z URUCHOMIONYM webem: tick (wszystkie pola), wejscia, lask, bankowanie.
#[test]
fn game_economy_wiring_matches_running_web() {
    let d: Value = serde_json::from_str(VECTORS).expect("q6.json");
    let ctx = make_ctx(&d);
    let scenarios = arr(&d, "scenarios");
    assert!(scenarios.len() >= 290, "scenariuszy {}", scenarios.len());
    let (mut n_ticks, mut n_routes, mut n_sea, mut n_wonder, mut n_tax, mut n_deficyt) =
        (0, 0, 0, 0, 0, 0);
    let (mut n_res, mut n_grace, mut n_heal, mut n_human, mut n_barb) = (0, 0, 0, 0, 0);
    for s in scenarios {
        let name = text(&s["name"]);
        let ran = run_rust(&ctx, s);
        if let Err(e) = compare(&name, s, &ran) {
            panic!("{e}");
        }
        if let Err(e) = compare_q6(&ctx, &name, s, &ran) {
            panic!("{e}");
        }
        n_ticks += ran.out.result.per_city.len();
        n_routes += usize::from(ran.routes.iter().any(|r| r.is_connected()));
        n_sea += usize::from(
            ran.routes
                .iter()
                .any(|r| r.is_connected() && r.medium == TradeRouteMedium::Sea),
        );
        n_wonder += usize::from(
            !s["out"]["q6"]["inputs"]["wonderMap"]
                .as_object()
                .unwrap()
                .is_empty(),
        );
        n_tax += usize::from(
            !s["out"]["q6"]["inputs"]["manualTax"]
                .as_object()
                .unwrap()
                .is_empty(),
        );
        n_deficyt += usize::from(ran.wire.banks.iter().any(|b| b.deficyt));
        n_res += usize::from(
            ran.wire
                .banks
                .iter()
                .any(|b| !b.resource_upkeep_deducted.is_empty()),
        );
        n_grace += usize::from(ran.grace.grace_turns_left.values().any(|v| *v > 0.0));
        n_heal += usize::from(!ran.hp_calls.is_empty());
        n_human += usize::from(ran.wire.banks.iter().any(|b| b.is_human));
        n_barb += usize::from(ran.cities.iter().any(|c| c.owner_id == -1));
        let _ = &ran.heal_units;
        let _ = &ran.extras;
    }
    eprintln!(
        "q6: scenariuszy {} ticki {n_ticks} trasy {n_routes} morskie {n_sea} cuda {n_wonder} reczny podatek {n_tax} deficyt {n_deficyt} odjecie surowcow {n_res} lask>0 {n_grace} leczenie {n_heal} gracz-czlowiek {n_human} barbarzynca {n_barb}",
        scenarios.len()
    );
    assert!(n_ticks >= 600, "ticki {n_ticks}");
    assert!(n_routes >= 150, "trasy {n_routes}");
    assert!(n_sea >= 100, "morskie {n_sea}");
    assert!(n_wonder >= 100, "cuda {n_wonder}");
    assert!(n_tax >= 120, "podatek {n_tax}");
    assert!(n_deficyt >= 150, "deficyt {n_deficyt}");
    assert!(n_res >= 200, "odjecie surowcow {n_res}");
    assert!(n_grace >= 20, "lask {n_grace}");
    assert!(n_heal >= 15, "leczenie {n_heal}");
    assert!(n_human >= 80, "czlowiek {n_human}");
    assert!(n_barb >= 15, "barbarzynca {n_barb}");
}

/// Kontrola negatywna: pomijanie natywnego dostepu do zlota / zerowe utrzymanie / brak cudow ZMIENIA wynik
/// (test nie jest pusty): ten sam scenariusz z wejsciami zmienionymi musi rozjechac sie z webem.
#[test]
fn negative_control_changed_inputs_diverge_from_web() {
    let d: Value = serde_json::from_str(VECTORS).expect("q6.json");
    let ctx = make_ctx(&d);
    let (mut changed, mut diverged) = (0, 0);
    for s in arr(&d, "scenarios") {
        let routes = arr(&s["q6in"], "routes");
        if !routes.iter().any(|r| r["status"] == "polaczony") {
            continue;
        }
        changed += 1;
        // mutacja wejscia: wszystkie trasy o dystansie +3
        let mut m = s.clone();
        for r in m["q6in"]["routes"].as_array_mut().unwrap() {
            let dd = r["dystans"].as_u64().unwrap();
            r["dystans"] = json!(dd + 3);
        }
        let ran = run_rust(&ctx, &m);
        if compare(&text(&s["name"]), s, &ran).is_err()
            || compare_q6(&ctx, &text(&s["name"]), s, &ran).is_err()
        {
            diverged += 1;
        }
    }
    eprintln!("kontrola negatywna: scenariuszy z trasami {changed}, rozjechanych po zmianie wejscia {diverged}");
    assert!(changed >= 150, "z trasami {changed}");
    assert!(
        diverged * 10 >= changed * 8,
        "zmiana wejscia rozjechala tylko {diverged}/{changed}"
    );
}
