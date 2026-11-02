//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q4-Q1 (pin weba 4bbef081d): petla miast ticku ekonomii
//! `advanceCityEconomy` (P12 stolica/liczba miast, P17 plony miasta, P18 Wealth/splitPraca/handel,
//! P19 oblezenie/wzrost V8.5, P20 manpower) na PRODUKCYJNYM `state::City`. Wektory z URUCHOMIONEGO weba
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q4-Q1/gen-p6-adv-q4-vectors.mjs`).

#[path = "p6_7b_vectors/common.rs"]
mod common;

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::data::buildings_tech::parse_buildings;
use civ_engine::data::civilizations::Num;
use civ_engine::data::terrain_map::{parse_terrain_yields, TerrainYieldsFile};
use civ_engine::domain::civ_matrix::load_civ_matrix;
use civ_engine::domain::improvement_build::{terrain_from_web_value, BuildHex, BuildMap};
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::city_founding::p6_6b::cities::{
    City, CityPodzialHandlu, CityPodzialPracy, FoodBuffer, OkolicaFocus, OkolicaTryb, WealthState,
};
use civ_engine::domain::turn_economy_advance::{
    AdvanceCityEconomyInput, AdvanceResolvers, UpkeepHealthInput,
};
use civ_engine::domain::turn_economy_loop::{
    advance_city_economy_loop, AdvanceLoopInput, CityLoopData, CityLoopExtra, CityLoopMaps,
    OrderYieldMults, WonderYieldBonus,
};
use civ_engine::domain::turn_economy_territory::TerrainContext;
use civ_engine::domain::turn_economy_upkeep::unit_rows_from_json_str;
use common::*;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_adv_q4_vectors/q4.json");
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

fn tick_bits(label: &str, got: f64, w: &Value, key: &str) {
    assert!(w.get(key).is_some(), "{label}: brak pola weba {key}");
    assert_bits(&format!("{label} {key}"), got, num(&w[key]));
}

fn yield_bits(label: &str, y: &civ_engine::domain::turn_economy_loop::LoopYield, w: &Value) {
    tick_bits(label, y.praca, w, "praca");
    tick_bits(label, y.pieniadz, w, "pieniadz");
    tick_bits(label, y.zywnosc, w, "zywnosc");
    tick_bits(label, y.nauka, w, "nauka");
    tick_bits(label, y.luksus, w, "luksus");
    tick_bits(label, y.kultura, w, "kultura");
}

#[test]
fn city_loop_matches_running_web() {
    let d: Value = serde_json::from_str(VECTORS).expect("q4.json");
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
    let maps: Vec<BuildMap> = arr(&d, "maps").iter().map(build_map).collect();
    let ty: TerrainYieldsFile = parse_terrain_yields().expect("terrain-yields.json");
    let society: Value = serde_json::from_str(SOCIETY).unwrap();
    let unit_rows = unit_rows_from_json_str(UNITS).expect("units.json");
    let buildings = parse_buildings().expect("buildings.json");
    let scenarios = arr(&d, "scenarios");
    assert!(scenarios.len() >= 600, "scenariuszy {}", scenarios.len());

    let (mut n_ticks, mut n_siege, mut n_norm, mut n_capital, mut n_corr, mut n_wonder) =
        (0, 0, 0, 0, 0, 0);
    let (mut n_order, mut n_immun, mut n_mp, mut n_wealth_change, mut n_ph, mut n_pp) =
        (0, 0, 0, 0, 0, 0);
    for s in scenarios {
        let name = text(&s["name"]);
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
        let era: Option<BTreeMap<i64, f64>> =
            om["era"].as_object().map(|_| owner_map(&om["era"], num));
        let era_f = |o: i64| era.as_ref().unwrap()[&o];
        let tech: Option<BTreeMap<i64, BTreeSet<String>>> = om["tech"]
            .as_object()
            .map(|_| owner_map(&om["tech"], |v| strings(v).into_iter().collect()));
        let tech_f = |o: i64| tech.as_ref().unwrap().get(&o).cloned().unwrap_or_default();
        let zloto_map: BTreeMap<i64, bool> = owner_map(&om["zloto"], |v| v.as_bool().unwrap());
        let zloto = |o: i64| zloto_map.get(&o).copied().unwrap_or(true);
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
                owner_active_labels: None,
                owner_empire_stock: None,
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
        let def_h: BTreeMap<i64, CityPodzialHandlu> =
            owner_map(&om["defH"], |v| CityPodzialHandlu {
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
                matrix: &matrix,
                buildings: &buildings,
            },
        };
        let map = &maps[s["mapIdx"].as_u64().unwrap() as usize];
        let ctx = TerrainContext {
            map,
            terrain_yields: &ty,
        };
        let out = advance_city_economy_loop(
            &mut cities,
            &mut extras,
            &ctx,
            &input,
            &UpkeepHealthInput {
                society_params: Some(&society),
                unit_rows: &unit_rows,
            },
            &lp,
        );
        let w = &s["out"];

        // ---- ticki per miasto ----
        let want_ticks = arr(w, "perCity");
        assert_eq!(out.per_city.len(), want_ticks.len(), "{name} liczba ticków");
        assert_eq!(out.diag.len(), want_ticks.len(), "{name} diag");
        for (t, wt) in out.per_city.iter().zip(want_ticks) {
            let l = format!("{name} {}", t.city_id);
            assert_eq!(t.city_id, text(&wt["cityId"]), "{l} id");
            assert_eq!(t.owner_id, wt["ownerId"].as_i64().unwrap(), "{l} owner");
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
                tick_bits(&l, got, wt, key);
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
                assert_eq!(got, wt[key].as_bool().unwrap(), "{l} {key}");
            }
            match (t.wzrost_procent, wt.get("wzrostProcent")) {
                (Some(g), Some(x)) => assert_bits(&format!("{l} wzrostProcent"), g, num(x)),
                (None, None) => {}
                (g, x) => panic!("{l} wzrostProcent rust={g:?} web={x:?}"),
            }
            match (t.wzrost_ulamkowy_po, wt.get("wzrostUlamkowyPo")) {
                (Some(g), Some(x)) => assert_bits(&format!("{l} wzrostUlamkowyPo"), g, num(x)),
                (None, None) => {}
                (g, x) => panic!("{l} wzrostUlamkowyPo rust={g:?} web={x:?}"),
            }
            n_ticks += 1;
            if t.oblegany {
                n_siege += 1;
            } else {
                n_norm += 1;
            }
            n_wonder += usize::from(wonder.contains_key(&t.owner_id));
            n_order += usize::from(order.contains_key(&t.city_id));
        }

        // ---- sumy ----
        let wt = &w["totals"];
        tick_bits(&name, out.cities, wt, "cities");
        tick_bits(&name, out.total_praca, wt, "praca");
        tick_bits(&name, out.total_pieniadz, wt, "pieniadz");
        tick_bits(&name, out.total_nauka, wt, "nauka");
        tick_bits(&name, out.total_luksus, wt, "luksus");
        tick_bits(&name, out.total_kultura, wt, "kultura");
        tick_bits(&name, out.total_zywnosc, wt, "zywnosc");
        tick_bits(&name, out.total_praca_pula, wt, "pracaPula");

        // ---- dochod per owner (incomeByOwner) ----
        let want_inc = w["income"].as_object().unwrap();
        assert_eq!(out.income_by_owner.len(), want_inc.len(), "{name} income");
        for (o, v) in &out.income_by_owner {
            assert_bits(
                &format!("{name} income {o}"),
                *v,
                num(&want_inc[&o.to_string()]),
            );
        }

        // ---- wartosci posrednie (korupcja, plony) ----
        for dg in &out.diag {
            let l = format!("{name} {} diag", dg.city_id);
            let lc = &w["lc"][&dg.city_id];
            assert_eq!(dg.is_capital, lc["isCapital"].as_bool().unwrap(), "{l} cap");
            assert_bits(&l, dg.dystans_od_stolicy, num(&lc["dystans"]));
            assert_bits(&l, dg.liczba_miast, num(&lc["liczbaMiast"]));
            assert_bits(&l, dg.strata_bazowa, num(&lc["strataBazowa"]));
            assert_bits(&l, dg.redukcja_budynkow, num(&lc["redukcja"]));
            assert_bits(&l, dg.strata_fraction, num(&lc["strataFraction"]));
            assert_eq!(dg.n_worked as f64, num(&lc["nWorked"]), "{l} nWorked");
            assert_eq!(
                dg.ma_mennica,
                lc["mennica"].as_bool().unwrap(),
                "{l} mennica"
            );
            assert_eq!(
                dg.waluta_odkryta,
                lc["waluta"].as_bool().unwrap(),
                "{l} waluta"
            );
            yield_bits(&format!("{l} y0"), &dg.y0, &lc["y0"]);
            yield_bits(&format!("{l} y1"), &dg.y1, &lc["y1"]);
            n_capital += usize::from(dg.is_capital);
            n_corr += usize::from(dg.strata_fraction > 0.0);
        }

        // ---- stan miast po ticku ----
        for (c, wa) in cities.iter().zip(arr(w, "after")) {
            let l = format!("{name} {} after", c.id);
            assert_eq!(c.id, text(&wa["id"]), "{l}");
            match (c.wealth_state, wa["wealthState"].as_object()) {
                (Some(ws), Some(x)) => {
                    assert_bits(&format!("{l} poziom"), ws.poziom, num(&x["poziom"]));
                    assert_bits(&format!("{l} pula"), ws.pula, num(&x["pula"]));
                }
                (None, None) => {}
                (g, x) => panic!("{l} wealthState rust={g:?} web={x:?}"),
            }
            assert_bits(
                &format!("{l} immunitet"),
                c.wealth_immunity_remaining.unwrap_or(f64::NAN),
                if wa["immun"].is_null() {
                    f64::NAN
                } else {
                    num(&wa["immun"])
                },
            );
            match (&c.magazyn_zywnosci, &wa["food"]) {
                (None, Value::Null) => {}
                (Some(FoodBuffer::Legacy { .. } | FoodBuffer::Other), Value::String(s))
                    if s == "obj" => {}
                (Some(FoodBuffer::Number(g)), x) => {
                    assert_bits(&format!("{l} food"), *g, num(x));
                }
                (g, x) => panic!("{l} food rust={g:?} web={x:?}"),
            }
            let ex = extras.get(&c.id).copied().unwrap_or_default();
            let want_mp = if wa["manpower"].is_null() {
                None
            } else {
                Some(num(&wa["manpower"]))
            };
            match (ex.manpower, want_mp) {
                (Some(g), Some(x)) => assert_bits(&format!("{l} manpower"), g, x),
                (None, None) => {}
                (g, x) => panic!("{l} manpower rust={g:?} web={x:?}"),
            }
            n_mp += usize::from(ex.manpower.is_some());
            n_immun += usize::from(c.wealth_immunity_remaining.is_some());
            n_wealth_change += usize::from(c.wealth_state.is_some());
            n_ph += usize::from(c.podzial_handlu.is_some());
            n_pp += usize::from(c.podzial_pracy.is_some());
        }
    }
    eprintln!(
        "q4: scenariuszy {} ticki {n_ticks} (oblezone {n_siege}, normalne {n_norm}) stolice {n_capital} korupcja>0 {n_corr} cuda {n_wonder} order {n_order} manpower {n_mp} immunitet {n_immun} wealth {n_wealth_change} ph {n_ph} pp {n_pp}",
        scenarios.len()
    );
    assert!(n_ticks >= 1400, "ticki {n_ticks}");
    assert!(
        n_siege >= 200 && n_norm >= 1000,
        "galezie {n_siege}/{n_norm}"
    );
    assert!(n_corr >= 300, "korupcja {n_corr}");
}
