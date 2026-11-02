//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q5-Q1 (pin weba 4bbef081d): CALA funkcja `advanceCityEconomy`
//! (`advance_city_economy` w `turn_economy_tick.rs`): petla miast + P23 utrzymanie per owner + P24 leczenie.
//! Porownanie BITOWE wszystkich pol `EconomyTickResult` z URUCHOMIONYM webem
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q5-Q1/gen-p6-adv-q5-vectors.mjs`), w tym klasa `live`
//! (resolvery ZYWE i MEMOIZOWANE jak w `main.ts:5210-5253`; domkniecie Z-Q4-3).

#[path = "p6_7b_vectors/common.rs"]
mod common;

use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet};

use civ_engine::data::buildings_tech::parse_buildings;
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
use civ_engine::domain::turn_economy_advance::{
    AdvanceCityEconomyInput, AdvanceResolvers, UpkeepHealthInput,
};
use civ_engine::domain::turn_economy_loop::{
    AdvanceLoopInput, CityLoopData, CityLoopExtra, CityLoopMaps, OrderYieldMults, WonderYieldBonus,
};
use civ_engine::domain::turn_economy_territory::TerrainContext;
use civ_engine::domain::turn_economy_tick::{advance_city_economy, EconUnit, HealRequest};
use civ_engine::domain::turn_economy_upkeep::unit_rows_from_json_str;
use common::*;
use serde_json::{json, Value};

const VECTORS: &str = include_str!("p6_adv_q5_vectors/q5.json");
const ECON: &str = include_str!("../data/econ-params.json");
const SOCIETY: &str = include_str!("../data/society-params.json");
const UNITS: &str = include_str!("../data/units.json");
/// Syntetyczne tabele `units` (kolejnosc kluczy wiersza istotna, wiec osobne pliki tekstowe).
const ALT_UNIT_TABLES: [&str; 6] = [
    include_str!("p6_adv_q5_vectors/unit_table_0.json"),
    include_str!("p6_adv_q5_vectors/unit_table_1.json"),
    include_str!("p6_adv_q5_vectors/unit_table_2.json"),
    include_str!("p6_adv_q5_vectors/unit_table_3.json"),
    include_str!("p6_adv_q5_vectors/unit_table_4.json"),
    include_str!("p6_adv_q5_vectors/unit_table_5.json"),
];

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

fn base_econ() -> Value {
    serde_json::from_str(ECON).expect("econ-params.json")
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

struct Ctx {
    matrix: civ_engine::data::civilizations::CivMatrixFile,
    maps: Vec<BuildMap>,
    ty: TerrainYieldsFile,
    society: Value,
    unit_rows: Vec<civ_engine::domain::turn_economy::economy_upkeep_p2::UnitRow>,
    buildings: Vec<civ_engine::data::buildings_tech::Building>,
    alt_unit_rows: Vec<Vec<civ_engine::domain::turn_economy::economy_upkeep_p2::UnitRow>>,
    alt_buildings: Vec<Vec<civ_engine::data::buildings_tech::Building>>,
}

#[derive(Default)]
struct Called {
    zloto: BTreeSet<i64>,
    labels: BTreeSet<i64>,
    stock: BTreeSet<i64>,
}

struct Ran {
    out: civ_engine::domain::turn_economy_tick::AdvanceTickOutcome,
    cities: Vec<City>,
    extras: BTreeMap<String, CityLoopExtra>,
    heal_units: Vec<ManpowerHealUnit>,
    hp_calls: Vec<Value>,
    called: Called,
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

/// Jedno uruchomienie Rust dla scenariusza. `zloto_override` (kontrola negatywna) podmienia wartosci resolvera
/// dostepu do zlota w scenariuszach `live` na wartosci "po drenazu".
fn run_rust(ctx: &Ctx, s: &Value, zloto_override: Option<&BTreeMap<i64, bool>>) -> Ran {
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
    let wout = &s["out"];
    let era: Option<BTreeMap<i64, f64>> = om["era"].as_object().map(|_| owner_map(&om["era"], num));
    let era_f = |o: i64| era.as_ref().unwrap()[&o];
    let tech: Option<BTreeMap<i64, BTreeSet<String>>> = om["tech"]
        .as_object()
        .map(|_| owner_map(&om["tech"], |v| strings(v).into_iter().collect()));
    let tech_f = |o: i64| tech.as_ref().unwrap().get(&o).cloned().unwrap_or_default();

    let is_live = s["live"].is_object();
    let labels_defined = is_live && s["live"]["labelsDefined"].as_bool().unwrap();
    let called = RefCell::new(Called::default());

    let zloto_map: BTreeMap<i64, bool> = if is_live {
        match zloto_override {
            Some(o) => o.clone(),
            None => owner_map(&wout["live"]["val"]["zloto"], |v| v.as_bool().unwrap()),
        }
    } else {
        owner_map(&om["zloto"], |v| v.as_bool().unwrap())
    };
    let zloto = |o: i64| {
        called.borrow_mut().zloto.insert(o);
        zloto_map.get(&o).copied().unwrap_or(true)
    };
    let gate_labels: Option<BTreeMap<i64, Vec<String>>> = if is_live {
        labels_defined.then(|| owner_map(&wout["live"]["val"]["labels"], strings))
    } else {
        om["gate"]
            .as_object()
            .map(|g| owner_map(&g["labels"], strings))
    };
    let labels_f = |o: i64| {
        called.borrow_mut().labels.insert(o);
        gate_labels
            .as_ref()
            .unwrap()
            .get(&o)
            .cloned()
            .unwrap_or_default()
    };
    let to_stock = |v: &Value| -> BTreeMap<String, f64> {
        v.as_object()
            .unwrap()
            .iter()
            .map(|(k, x)| (k.clone(), num(x)))
            .collect()
    };
    let gate_stock: Option<BTreeMap<i64, BTreeMap<String, f64>>> = if is_live {
        labels_defined.then(|| owner_map(&wout["live"]["val"]["stock"], to_stock))
    } else {
        om["gate"]
            .as_object()
            .map(|g| owner_map(&g["stock"], to_stock))
    };
    let stock_f = |o: i64| {
        called.borrow_mut().stock.insert(o);
        gate_stock.as_ref().unwrap()[&o].clone()
    };
    let zbadane: BTreeSet<String> = strings(&om["zbadane"]).into_iter().collect();
    let diff = text(&s["difficulty"]);
    let econ = match &s["econ"] {
        Value::Null => base_econ(),
        e => e.clone(),
    };
    let empty_terr = BTreeMap::new();
    let empty_worked = BTreeMap::new();
    let input = AdvanceCityEconomyInput {
        built_by_city: &built,
        econ_params: Some(&econ),
        difficulty: &diff,
        player_era: num(&s["playerEra"]),
        player_zbadane: &zbadane,
        resolvers: AdvanceResolvers {
            owner_era: era.as_ref().map(|_| &era_f as &dyn Fn(i64) -> f64),
            owner_tech: tech
                .as_ref()
                .map(|_| &tech_f as &dyn Fn(i64) -> BTreeSet<String>),
            owner_zloto_access: &zloto,
            owner_active_labels: gate_labels
                .as_ref()
                .map(|_| &labels_f as &dyn Fn(i64) -> Vec<String>),
            owner_empire_stock: gate_stock
                .as_ref()
                .map(|_| &stock_f as &dyn Fn(i64) -> BTreeMap<String, f64>),
        },
        territory_resource_by_city: &empty_terr,
        worked_magazyn_by_city: &empty_worked,
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
    let wonder: BTreeMap<i64, WonderYieldBonus> = owner_map(&om["wonder"], |b| {
        let g = |k: &str| b.get(k).map(num).unwrap_or(0.0);
        WonderYieldBonus {
            pieniadz: g("pieniadz"),
            zywnosc: g("zywnosc"),
            nauka: g("nauka"),
            kultura: g("kultura"),
            praca: g("praca"),
        }
    });
    let tbonus = str_map(&s["tbonus"], num);
    let tinc = str_map(&s["tinc"], num);
    let marit = str_map(&s["marit"], num);
    let mtax = str_map(&s["mtax"], num);
    let def_h: BTreeMap<i64, CityPodzialHandlu> = owner_map(&om["defH"], |v| CityPodzialHandlu {
        procent_nauka: num(&v["n"]),
        procent_pieniadz: num(&v["p"]),
        procent_luksus: num(&v["l"]),
    });
    let def_p: BTreeMap<i64, CityPodzialPracy> = owner_map(&om["defP"], |v| CityPodzialPracy {
        procent_budynki: num(v),
    });
    let lp = AdvanceLoopInput {
        maps: CityLoopMaps {
            owner_civ_by_owner_id: &civ,
            order_mult_by_city: &order,
            wonder_city_yields_by_owner: &wonder,
            trade_route_building_bonus_by_city: &tbonus,
            trade_income_by_city: &tinc,
            maritime_trade_income_by_city: &marit,
            manual_work_tax_by_city: &mtax,
            owner_default_podzial_handlu_by_owner: &def_h,
            owner_default_podzial_pracy_by_owner: &def_p,
        },
        data: CityLoopData {
            matrix: &ctx.matrix,
            buildings: match s["bldCat"].as_u64() {
                Some(i) => &ctx.alt_buildings[i as usize],
                None => &ctx.buildings,
            },
        },
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
    let get_max_hp = |t: &str| max_hp[t];
    let mut hp_calls: Vec<Value> = Vec::new();
    let mut on_changed = |id: &str, hp: f64, hp_max: f64| {
        hp_calls.push(json!([id, enc(hp), enc(hp_max)]));
    };
    let has_heal = s["heal"].is_object();
    let heal = if has_heal {
        Some(HealRequest {
            units: &mut heal_units,
            get_max_hp: &get_max_hp,
            on_unit_hp_changed: Some(&mut on_changed),
        })
    } else {
        None
    };
    let out = advance_city_economy(
        &mut cities,
        &mut extras,
        &tctx,
        &input,
        &UpkeepHealthInput {
            society_params: Some(&ctx.society),
            unit_rows: match s["unitTable"].as_u64() {
                Some(i) => &ctx.alt_unit_rows[i as usize],
                None => &ctx.unit_rows,
            },
        },
        &lp,
        &econ_units,
        heal,
    );
    Ran {
        out,
        cities,
        extras,
        heal_units,
        hp_calls,
        called: called.into_inner(),
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
        alt_unit_rows: ALT_UNIT_TABLES
            .iter()
            .map(|t| unit_rows_from_json_str(t).expect("unit_table"))
            .collect(),
        alt_buildings: arr(d, "buildingCatalogs")
            .iter()
            .map(|c| serde_json::from_value(c.clone()).expect("katalog budynkow"))
            .collect(),
    }
}

#[test]
fn whole_advance_city_economy_matches_running_web() {
    let d: Value = serde_json::from_str(VECTORS).expect("q5.json");
    let ctx = make_ctx(&d);
    let scenarios = arr(&d, "scenarios");
    assert!(scenarios.len() >= 650, "scenariuszy {}", scenarios.len());
    let (mut n_ticks, mut n_units, mut n_heal, mut n_res_units, mut n_deficyt) = (0, 0, 0, 0, 0);
    let (mut n_owner_units_only, mut n_levels) = (0, 0);
    for s in scenarios {
        let name = text(&s["name"]);
        let ran = run_rust(&ctx, s, None);
        if let Err(e) = compare(&name, s, &ran) {
            panic!("{e}");
        }
        n_ticks += ran.out.result.per_city.len();
        n_units += usize::from(!arr(s, "units").is_empty());
        n_heal += usize::from(!ran.hp_calls.is_empty());
        n_res_units += usize::from(
            ran.out
                .result
                .resource_upkeep_units_by_owner
                .values()
                .any(|m| !m.is_empty()),
        );
        n_deficyt += ran
            .out
            .result
            .upkeep_by_owner
            .values()
            .filter(|b| b.deficyt)
            .count();
        let city_owners: BTreeSet<i64> = ran.cities.iter().map(|c| c.owner_id).collect();
        n_owner_units_only += usize::from(
            ran.out
                .result
                .upkeep_by_owner
                .keys()
                .any(|o| !city_owners.contains(o)),
        );
        n_levels += usize::from(
            ran.out
                .result
                .upkeep_by_owner
                .values()
                .any(|b| b.utrzymanie_budynki > 0.0),
        );
    }
    eprintln!(
        "q5: scenariuszy {} ticki {n_ticks} z jednostkami {n_units} z leczeniem {n_heal} utrzymanie surowcowe jednostek {n_res_units} deficyty {n_deficyt} owner tylko z jednostkami {n_owner_units_only} utrzymanie budynkow>0 {n_levels}",
        scenarios.len()
    );
    assert!(n_ticks >= 1500, "ticki {n_ticks}");
    assert!(n_units >= 250, "jednostki {n_units}");
    assert!(n_heal >= 25, "leczenie {n_heal}");
    assert!(
        n_res_units >= 100,
        "utrzymanie surowcowe jednostek {n_res_units}"
    );
    assert!(n_deficyt >= 100, "deficyty {n_deficyt}");
    assert!(
        n_owner_units_only >= 10,
        "owner tylko z jednostkami {n_owner_units_only}"
    );
    assert!(n_levels >= 300, "utrzymanie budynkow {n_levels}");
}

/// Z-Q4-3 / Z-Q5-1: web (resolvery ZYWE i MEMOIZOWANE, `main.ts:5210-5253`) vs Rust (drenaz PRZED petla,
/// resolvery wstrzykniete jako wartosci pierwszego wolania):
/// (1) pierwsze wolanie KAZDEGO resolvera w webie jest PRZED drenazem (faza 0 lub 1, nigdy 2) - z pomiaru;
/// (2) przy zdefiniowanych etykietach (jak w `main.ts`) pierwsze wolanie jest w fazie 0 (liczniki `:2373-2402`);
/// (3) Rust woła resolvery tylko dla ownerow, ktorych woła web;
/// (4) kontrola negatywna: wartosc "po drenazu" zamiast wartosci pierwszego wolania ZMIENIA wynik (test nie jest pusty).
#[test]
fn zloto_resolver_is_snapshot_before_drain_z_q4_3() {
    let d: Value = serde_json::from_str(VECTORS).expect("q5.json");
    let ctx = make_ctx(&d);
    let (mut n_live, mut n_phase0, mut n_phase1_nolabels, mut n_differs, mut n_post_diff) =
        (0, 0, 0, 0, 0);
    for s in arr(&d, "scenarios") {
        if !s["live"].is_object() {
            continue;
        }
        n_live += 1;
        let name = text(&s["name"]);
        let live = &s["out"]["live"];
        let labels_defined = s["live"]["labelsDefined"].as_bool().unwrap();
        for kind in ["zloto", "labels", "stock"] {
            for (o, ph) in live["first"][kind].as_object().unwrap() {
                let ph = ph.as_i64().unwrap();
                assert!(
                    ph == 0 || ph == 1,
                    "{name} {kind}[{o}] pierwsze wolanie w fazie {ph} (po drenazu)"
                );
                if labels_defined {
                    assert_eq!(
                        ph, 0,
                        "{name} {kind}[{o}]: z etykietami pierwsze wolanie ma byc w fazie 0"
                    );
                    n_phase0 += 1;
                } else if kind == "zloto" {
                    assert_eq!(ph, 1, "{name} zloto[{o}] bez etykiet");
                    n_phase1_nolabels += 1;
                }
            }
        }
        let ran = run_rust(&ctx, s, None);
        compare(&name, s, &ran).unwrap_or_else(|e| panic!("{e}"));
        let web_zloto: BTreeSet<i64> = live["first"]["zloto"]
            .as_object()
            .unwrap()
            .keys()
            .map(|k| k.parse().unwrap())
            .collect();
        let web_labels: BTreeSet<i64> = live["first"]["labels"]
            .as_object()
            .unwrap()
            .keys()
            .map(|k| k.parse().unwrap())
            .collect();
        let web_stock: BTreeSet<i64> = live["first"]["stock"]
            .as_object()
            .unwrap()
            .keys()
            .map(|k| k.parse().unwrap())
            .collect();
        assert!(
            ran.called.zloto.is_subset(&web_zloto),
            "{name}: Rust woła zloto dla ownera nieobecnego w webie: {:?} vs {web_zloto:?}",
            ran.called.zloto
        );
        assert!(
            ran.called.labels.is_subset(&web_labels),
            "{name}: labels {:?} vs {web_labels:?}",
            ran.called.labels
        );
        assert!(
            ran.called.stock.is_subset(&web_stock),
            "{name}: stock {:?} vs {web_stock:?}",
            ran.called.stock
        );

        // kontrola negatywna: wartosci "po drenazu"
        let post: BTreeMap<i64, bool> = owner_map(&live["post"]["zloto"], |v| v.as_bool().unwrap());
        let val: BTreeMap<i64, bool> = owner_map(&live["val"]["zloto"], |v| v.as_bool().unwrap());
        let differs = post.iter().any(|(o, v)| val.get(o).is_some_and(|x| x != v));
        if differs {
            n_post_diff += 1;
            let mut merged = val.clone();
            for (o, v) in &post {
                if merged.contains_key(o) {
                    merged.insert(*o, *v);
                }
            }
            let bad = run_rust(&ctx, s, Some(&merged));
            if compare(&name, s, &bad).is_err() {
                n_differs += 1;
            }
        }
    }
    eprintln!(
        "z-q4-3: scenariuszy live {n_live}, pierwsze wolanie w fazie 0 (z etykietami) {n_phase0}, faza 1 (bez etykiet, zloto) {n_phase1_nolabels}, wartosc po drenazu rozna od memo {n_post_diff}, z tego zmienia wynik Rust {n_differs}"
    );
    assert!(n_live >= 80, "live {n_live}");
    assert!(n_phase0 >= 200, "faza 0 {n_phase0}");
    assert!(
        n_post_diff >= 10,
        "kontrfaktyk rozny od memo w {n_post_diff}"
    );
    assert!(
        n_differs >= 5,
        "kontrola negatywna: wartosc po drenazu zmienia wynik tylko w {n_differs} scenariuszach"
    );
}
