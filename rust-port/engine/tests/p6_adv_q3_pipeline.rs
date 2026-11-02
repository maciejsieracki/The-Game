//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q3-Q1 (pin weba 4bbef081d): plastry utrzymania i zdrowia ticku
//! ekonomii `advanceCityEconomy`: P4 `computePracaUpkeepByOwner`, P5 parametry (`loadUpkeepParams`,
//! `loadStorageParams`, `buildRationParams`, `buildUnitUpkeepTable`), P10 `loadHealthParams`,
//! P16 `computeCityHealth` + `cityHasWaterAccess`. Wektory z URUCHOMIONEGO weba
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q3-Q1/gen-p6-adv-q3-vectors.mjs`).

#[path = "p6_7b_vectors/common.rs"]
mod common;

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::data::terrain_map::{parse_terrain_yields, TerrainYieldsFile};
use civ_engine::domain::improvement_build::{terrain_from_web_value, BuildHex, BuildMap};
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::city_founding::p6_6b::cities::{City, OkolicaFocus, OkolicaTryb};
use civ_engine::domain::territory::{CityNode, TerritoryNode, TerritoryOrder};
use civ_engine::domain::turn_economy_advance::{
    advance_city_economy_resources_with_map, advance_city_economy_upkeep_health,
    AdvanceCityEconomyInput, AdvanceResolvers, UpkeepHealthInput,
};
use civ_engine::domain::turn_economy_health::{
    city_has_water_access, compute_city_health, load_health_params, CityHealthMapContext,
};
use civ_engine::domain::turn_economy_territory::{territory_nodes_of, TerrainContext};
use civ_engine::domain::turn_economy_upkeep::{
    compute_praca_upkeep_by_owner, load_advance_upkeep_params, unit_rows_from_json_str,
};
use common::*;
use serde_json::{json, Value};

const VECTORS: &str = include_str!("p6_adv_q3_vectors/q3.json");
const ECON: &str = include_str!("../data/econ-params.json");
const SOCIETY: &str = include_str!("../data/society-params.json");
const UNITS: &str = include_str!("../data/units.json");

fn data() -> Value {
    serde_json::from_str(VECTORS).expect("q3.json")
}

fn base_econ() -> Value {
    serde_json::from_str(ECON).expect("econ-params.json")
}

fn base_society() -> Value {
    serde_json::from_str(SOCIETY).expect("society-params.json")
}

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
    let rivers = m["rivers"]
        .as_array()
        .unwrap()
        .iter()
        .map(|p| {
            p.as_array()
                .unwrap()
                .iter()
                .map(|c| (c[0].as_i64().unwrap() as i32, c[1].as_i64().unwrap() as i32))
                .collect()
        })
        .collect();
    BuildMap::new(hexes, rivers)
}

fn city_of(c: &Value) -> City {
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
        ..City::default()
    }
}

/// `webData(praca)` generatora: nadpisanie wiersza `budynki.ulepszenie_surowcowe_upkeep_praca`.
fn econ_for(praca: &Value) -> Value {
    let mut econ = base_econ();
    let key = "ulepszenie_surowcowe_upkeep_praca";
    match praca {
        Value::Null => {}
        Value::String(s) if s == "no-row" => {
            econ["budynki"].as_object_mut().unwrap().remove(key);
        }
        Value::String(s) if s == "no-group" => {
            econ.as_object_mut().unwrap().remove("budynki");
        }
        Value::String(s) if s == "row-string" => econ["budynki"][key] = json!("x"),
        Value::String(s) if s == "row-array" => econ["budynki"][key] = json!([3, 4, 5]),
        Value::Object(_) => econ["budynki"][key] = praca.clone(),
        other => panic!("praca: {other}"),
    }
    econ
}

fn owner_map_value(m: &BTreeMap<i64, f64>) -> Value {
    Value::Object(m.iter().map(|(k, v)| (k.to_string(), enc(*v))).collect())
}

fn field(label: &str, got: f64, want: &Value, key: &str) {
    assert_bits(&format!("{label} {key}"), got, num(&want[key]));
}

/// Wariant `societyRaw` z wektora (`real` | `none` | `{v: ...}`).
fn soc_of(h: &Value) -> Option<Value> {
    if text(&h["soc"]) == "real" {
        return Some(base_society());
    }
    let sv = &h["socValue"];
    if sv.get("none").is_some() {
        None
    } else {
        Some(sv["v"].clone())
    }
}

fn terrain_yields() -> TerrainYieldsFile {
    parse_terrain_yields().expect("terrain-yields.json")
}

#[test]
fn tick_upkeep_health_and_params_match_running_web() {
    let d = data();
    let maps: Vec<BuildMap> = arr(&d, "maps").iter().map(build_map).collect();
    let ty = terrain_yields();
    let society = base_society();
    let unit_rows = unit_rows_from_json_str(UNITS).expect("units.json");
    let scenarios = arr(&d, "scenarios");
    assert!(scenarios.len() >= 600);
    let (mut n_praca, mut n_hp, mut n_hneg, mut n_water_b) = (0, 0, 0, 0);
    for s in scenarios {
        let name = text(&s["name"]);
        let mut cities: Vec<City> = arr(s, "cities").iter().map(city_of).collect();
        let built: BTreeMap<String, Vec<String>> = arr(s, "cities")
            .iter()
            .map(|c| (text(&c["id"]), strings(&c["built"])))
            .collect();
        let era: Option<BTreeMap<i64, f64>> = s["eraByOwner"].as_object().map(|o| {
            o.iter()
                .map(|(k, v)| (k.parse::<i64>().unwrap(), num(v)))
                .collect()
        });
        let era_f = |o: i64| era.as_ref().unwrap()[&o];
        let zloto = |_: i64| true;
        let diff = text(&s["difficulty"]);
        let zbadane = BTreeSet::new();
        let empty_terr = BTreeMap::new();
        let empty_worked = BTreeMap::new();
        let econ = econ_for(&s["praca"]);
        let input = AdvanceCityEconomyInput {
            built_by_city: &built,
            econ_params: Some(&econ),
            difficulty: &diff,
            player_era: num(&s["playerEra"]),
            player_zbadane: &zbadane,
            resolvers: AdvanceResolvers {
                owner_era: era.as_ref().map(|_| &era_f as &dyn Fn(i64) -> f64),
                owner_tech: None,
                owner_zloto_access: &zloto,
                owner_active_labels: None,
                owner_empire_stock: None,
            },
            territory_resource_by_city: &empty_terr,
            worked_magazyn_by_city: &empty_worked,
        };
        let map = &maps[s["mapIdx"].as_u64().unwrap() as usize];
        let ctx = TerrainContext {
            map,
            terrain_yields: &ty,
        };
        let (out, _ti) = advance_city_economy_resources_with_map(&mut cities, &ctx, &input);
        let up = advance_city_economy_upkeep_health(
            &cities,
            &ctx,
            &input,
            &out.per_city,
            &UpkeepHealthInput {
                society_params: Some(&society),
                unit_rows: &unit_rows,
            },
        );
        let w = &s["out"];

        assert_values(
            &format!("{name} praca"),
            &owner_map_value(&up.praca_upkeep_by_owner),
            &w["praca"],
        );
        let want_z = arr(w, "zdrowie");
        assert_eq!(
            up.zdrowie_by_city.len(),
            want_z.len(),
            "{name} liczba miast"
        );
        for ((id, z), wz) in up.zdrowie_by_city.iter().zip(want_z) {
            assert_eq!(id, &text(&wz[0]), "{name} id");
            assert_bits(&format!("{name} zdrowie {id}"), *z, num(&wz[1]));
            n_hneg += usize::from(*z < 0.0);
        }
        n_praca += usize::from(!up.praca_upkeep_by_owner.is_empty());

        let p = &w["params"];
        let u = &up.params.upkeep;
        let label = format!("{name} upkeep");
        field(
            &label,
            u.budynek_utrzymanie_flat.unwrap(),
            &p["upkeep"],
            "budynekUtrzymanieFlat",
        );
        field(
            &label,
            u.jednostka_utrzymanie_std,
            &p["upkeep"],
            "jednostkaUtrzymanieStd",
        );
        field(
            &label,
            u.zywnosc_jednostka_oboz,
            &p["upkeep"],
            "zywnoscJednostkaOboz",
        );
        field(
            &label,
            u.zywnosc_jednostka_ruch,
            &p["upkeep"],
            "zywnoscJednostkaRuch",
        );
        field(
            &label,
            u.zywnosc_mnoznik_poza_terytorium,
            &p["upkeep"],
            "zywnoscMnoznikPozaTerytorium",
        );
        field(
            &label,
            u.zywnosc_mnoznik_terytorium,
            &p["upkeep"],
            "zywnoscMnoznikTerytorium",
        );
        let st = &up.params.storage;
        let label = format!("{name} storage");
        field(&label, st.baza_surowce, &p["storage"], "bazaSurowce");
        field(&label, st.baza_zywnosc, &p["storage"], "bazaZywnosc");
        field(
            &label,
            st.mnoznik_magazynu,
            &p["storage"],
            "mnoznikMagazynu",
        );
        let ra = &up.params.ration;
        let label = format!("{name} ration");
        field(
            &label,
            ra.racje_wzrost_proc_1,
            &p["ration"],
            "racjeWzrostProc1",
        );
        field(
            &label,
            ra.racje_wzrost_proc_2,
            &p["ration"],
            "racjeWzrostProc2",
        );
        field(
            &label,
            ra.racje_wzrost_proc_3,
            &p["ration"],
            "racjeWzrostProc3",
        );
        field(&label, ra.racje_zywnosc_1, &p["ration"], "racjeZywnosc1");
        field(&label, ra.racje_zywnosc_2, &p["ration"], "racjeZywnosc2");
        field(&label, ra.racje_zywnosc_3, &p["ration"], "racjeZywnosc3");
        let hp = &up.health_params;
        let label = format!("{name} health");
        let h = &p["health"];
        field(&label, hp.rzeka, h, "rzeka");
        field(&label, hp.akwedukt, h, "akwedukt");
        field(&label, hp.studnia, h, "studnia");
        field(&label, hp.targowisko, h, "targowisko");
        field(&label, hp.laznia_publiczna, h, "lazniaPubliczna");
        field(&label, hp.ceramika, h, "ceramika");
        field(&label, hp.kara_zagoszczenie, h, "karaZagoszczenie");
        field(&label, hp.prog_zagoszczenia, h, "progZagoszczenia");
        field(&label, hp.kara_bagno, h, "karaBagno");
        field(&label, hp.bonus_las, h, "bonusLas");
        field(&label, hp.kara_dzungla, h, "karaDzungla");
        field(&label, hp.kara_brak_wody, h, "karaBrakWody");
        for pair in arr(h, "osiedle") {
            assert_bits(
                &format!("{label} osiedle({})", pair[0]),
                hp.osiedle_pop_bonus(num(&pair[0])),
                num(&pair[1]),
            );
        }
        n_hp += 1;
        n_water_b += usize::from(cities.iter().any(|c| city_has_water_access(c.q, c.r, map)));
        if name.starts_with("rand-0") {
            // tabela utrzymania jednostek (jedno zrodlo: units.json) -- identyczna w kazdym scenariuszu
            let want: BTreeMap<String, f64> = d["unitTable"]
                .as_object()
                .unwrap()
                .iter()
                .map(|(k, v)| (k.clone(), num(v)))
                .collect();
            assert_eq!(up.params.unit_upkeep_table, want, "tabela jednostek");
            assert!(want.len() >= 50);
        }
    }
    // pokrycie: scenariusze realnie cwicza upkeep, zdrowie ujemne i dostep do wody
    assert!(n_praca >= 400, "praca niepuste: {n_praca}");
    assert!(n_hp >= 600);
    assert!(n_hneg >= 100, "zdrowie ujemne: {n_hneg}");
    assert!(n_water_b >= 100, "woda: {n_water_b}");
}

#[test]
fn direct_praca_upkeep_with_fort_and_outpost_nodes_matches_web() {
    let d = data();
    let maps: Vec<BuildMap> = arr(&d, "maps").iter().map(build_map).collect();
    let (mut ordered, mut nonempty) = (0, 0);
    for s in arr(&d, "directPraca") {
        let name = text(&s["name"]);
        let cities: Vec<City> = arr(s, "cities")
            .iter()
            .map(|c| City {
                id: text(&c["id"]),
                owner_id: c["ownerId"].as_i64().unwrap(),
                q: num(&c["q"]),
                r: num(&c["r"]),
                population: num(&c["pop"]),
                ..City::default()
            })
            .collect();
        let map = &maps[s["mapIdx"].as_u64().unwrap() as usize];
        let mut city_nodes = territory_nodes_of(&cities);
        let mut fort_nodes: Vec<TerritoryNode> = Vec::new();
        for f in arr(s, "forts") {
            let mut node = CityNode::city(
                f["q"].as_i64().unwrap() as i32,
                f["r"].as_i64().unwrap() as i32,
                0.0,
            );
            if f["kind"] == "fort" {
                node.is_fort = Some(true);
            } else {
                node.is_outpost = Some(true);
            }
            let order = f.get("order").map(|o| TerritoryOrder {
                turn: o["turn"].as_i64().unwrap(),
                seq: o["seq"].as_i64().unwrap(),
            });
            ordered += usize::from(order.is_some());
            fort_nodes.push(TerritoryNode::with_order(
                node,
                f["owner"].as_i64().unwrap(),
                order,
            ));
        }
        let nodes: Vec<TerritoryNode> = if s["fortsFirst"].as_bool().unwrap() {
            fort_nodes.append(&mut city_nodes);
            fort_nodes
        } else {
            city_nodes.append(&mut fort_nodes);
            city_nodes
        };
        let econ = econ_for(&s["praca"]);
        let got = compute_praca_upkeep_by_owner(map, &nodes, Some(&econ), &text(&s["difficulty"]));
        assert_values(&format!("{name} praca"), &owner_map_value(&got), &s["out"]);
        nonempty += usize::from(!got.is_empty());
    }
    assert!(ordered >= 20, "order: {ordered}");
    assert!(nonempty >= 40, "niepuste: {nonempty}");
}

#[test]
fn direct_city_health_and_water_access_match_web() {
    let d = data();
    let maps: Vec<BuildMap> = arr(&d, "maps").iter().map(build_map).collect();
    let (mut ctx_n, mut noctx_n, mut water_n, mut frac_n) = (0, 0, 0, 0);
    for (i, h) in arr(&d, "hdirect").iter().enumerate() {
        let label = format!("hdirect-{i} soc={}", text(&h["soc"]));
        let map = &maps[h["mapIdx"].as_u64().unwrap() as usize];
        let (q, r) = (num(&h["q"]), num(&h["r"]));
        let water = city_has_water_access(q, r, map);
        assert_eq!(
            water,
            h["water"].as_bool().unwrap(),
            "{label} woda ({q},{r})"
        );
        water_n += usize::from(water);
        frac_n += usize::from(q.fract() != 0.0 || r.fract() != 0.0 || !q.is_finite());
        let soc_val: Option<Value> = soc_of(h);
        let diff = text(&h["difficulty"]);
        let hp = load_health_params(soc_val.as_ref(), &diff);
        let tiles: Vec<bool> = arr(h, "tiles")
            .iter()
            .map(|b| b.as_bool().unwrap())
            .collect();
        let built = strings(&h["built"]);
        let ludnosc = num(&h["ludnosc"]);
        let use_ctx = h["useCtx"].as_bool().unwrap();
        let ctx = CityHealthMapContext {
            q,
            r,
            population: num(&h["ctxPop"]),
            map,
        };
        // web `computeCityHealthBreakdown(...).total`: z kontekstem mapy -> dostep do wody z mapy
        // (`hasWaterAccess` zdefiniowane), bez kontekstu -> skan `tiles[].maRzeke`.
        let got = compute_city_health(
            ludnosc,
            &tiles,
            &built,
            &hp,
            if use_ctx { Some(water) } else { None },
            if use_ctx { Some(&ctx) } else { None },
            0.0,
            0.0,
        );
        assert_bits(&label, got, num(&h["total"]));
        if use_ctx {
            ctx_n += 1;
        } else {
            noctx_n += 1;
        }
    }
    assert!(
        ctx_n >= 600 && noctx_n >= 100,
        "ctx={ctx_n} noctx={noctx_n}"
    );
    assert!(water_n >= 40, "woda: {water_n}");
    assert!(frac_n >= 50, "ulamkowe/nieskonczone q,r: {frac_n}");
}

#[test]
fn p5_params_from_damaged_econ_match_web() {
    let d = data();
    let keys = &d["p5keys"];
    assert_eq!(keys["upkeep"].as_array().unwrap().len(), 6);
    let mut non_default = 0;
    for (i, s) in arr(&d, "p5direct").iter().enumerate() {
        let label = format!("p5-{i}");
        let diff = text(&s["difficulty"]);
        let p = load_advance_upkeep_params(Some(&s["econ"]), &diff, &[]);
        let o = &s["out"];
        let u = &p.upkeep;
        field(
            &label,
            u.budynek_utrzymanie_flat.unwrap(),
            &o["upkeep"],
            "budynekUtrzymanieFlat",
        );
        field(
            &label,
            u.jednostka_utrzymanie_std,
            &o["upkeep"],
            "jednostkaUtrzymanieStd",
        );
        field(
            &label,
            u.zywnosc_jednostka_oboz,
            &o["upkeep"],
            "zywnoscJednostkaOboz",
        );
        field(
            &label,
            u.zywnosc_jednostka_ruch,
            &o["upkeep"],
            "zywnoscJednostkaRuch",
        );
        field(
            &label,
            u.zywnosc_mnoznik_poza_terytorium,
            &o["upkeep"],
            "zywnoscMnoznikPozaTerytorium",
        );
        field(
            &label,
            u.zywnosc_mnoznik_terytorium,
            &o["upkeep"],
            "zywnoscMnoznikTerytorium",
        );
        field(&label, p.storage.baza_surowce, &o["storage"], "bazaSurowce");
        field(&label, p.storage.baza_zywnosc, &o["storage"], "bazaZywnosc");
        field(
            &label,
            p.storage.mnoznik_magazynu,
            &o["storage"],
            "mnoznikMagazynu",
        );
        let ra = &p.ration;
        field(
            &label,
            ra.racje_wzrost_proc_1,
            &o["ration"],
            "racjeWzrostProc1",
        );
        field(
            &label,
            ra.racje_wzrost_proc_2,
            &o["ration"],
            "racjeWzrostProc2",
        );
        field(
            &label,
            ra.racje_wzrost_proc_3,
            &o["ration"],
            "racjeWzrostProc3",
        );
        field(&label, ra.racje_zywnosc_1, &o["ration"], "racjeZywnosc1");
        field(&label, ra.racje_zywnosc_2, &o["ration"], "racjeZywnosc2");
        field(&label, ra.racje_zywnosc_3, &o["ration"], "racjeZywnosc3");
        non_default +=
            usize::from(u.zywnosc_jednostka_oboz != 0.5 || p.storage.baza_zywnosc != 20.0);
    }
    assert!(
        non_default >= 20,
        "uszkodzone econ zmieniaja wartosci: {non_default}"
    );
}

#[test]
fn unit_upkeep_table_from_damaged_rows_matches_web() {
    let d = data();
    let mut nonempty = 0;
    for (i, s) in arr(&d, "unitDirect").iter().enumerate() {
        let rows = unit_rows_from_json_str(&text(&s["rowsJson"])).expect("rowsJson");
        let p = load_advance_upkeep_params(Some(&base_econ()), "normal", &rows);
        let want: BTreeMap<String, f64> = s["out"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.clone(), num(v)))
            .collect();
        assert_eq!(p.unit_upkeep_table, want, "unit-{i}");
        nonempty += usize::from(!want.is_empty());
    }
    assert!(nonempty >= 30, "niepuste: {nonempty}");
}

#[test]
fn health_params_loader_reads_zdrowie_block_only() {
    // dowod, ze loader czyta sekcje `zdrowie`, a nie caly obiekt: ten sam zestaw liczb na `real` i `{zdrowie: real.zdrowie}`
    let real = base_society();
    let wrapped = json!({ "zdrowie": real["zdrowie"].clone(), "inne": 1 });
    for diff in ["easy", "normal", "hard"] {
        assert_eq!(
            load_health_params(Some(&real), diff),
            load_health_params(Some(&wrapped), diff)
        );
    }
    // brak society -> fallbacki weba (normal): rzeka 2, akwedukt 4, ..., prog 4
    let hp = load_health_params(None, "normal");
    assert_eq!(
        (
            hp.rzeka,
            hp.akwedukt,
            hp.studnia,
            hp.targowisko,
            hp.laznia_publiczna,
            hp.prog_zagoszczenia,
            hp.kara_brak_wody
        ),
        (2.0, 4.0, 2.0, 2.0, 5.0, 4.0, -2.0)
    );
}

#[test]
fn health_params_all_society_variants_and_difficulties_match_web() {
    let d = data();
    let mut weird = 0;
    for (i, h) in arr(&d, "hparams").iter().enumerate() {
        let label = format!(
            "hparams-{i} soc={} diff={}",
            text(&h["soc"]),
            text(&h["difficulty"])
        );
        let hp = load_health_params(soc_of(h).as_ref(), &text(&h["difficulty"]));
        let o = &h["out"];
        field(&label, hp.rzeka, o, "rzeka");
        field(&label, hp.akwedukt, o, "akwedukt");
        field(&label, hp.studnia, o, "studnia");
        field(&label, hp.targowisko, o, "targowisko");
        field(&label, hp.laznia_publiczna, o, "lazniaPubliczna");
        field(&label, hp.ceramika, o, "ceramika");
        field(&label, hp.kara_zagoszczenie, o, "karaZagoszczenie");
        field(&label, hp.prog_zagoszczenia, o, "progZagoszczenia");
        field(&label, hp.kara_bagno, o, "karaBagno");
        field(&label, hp.bonus_las, o, "bonusLas");
        field(&label, hp.kara_dzungla, o, "karaDzungla");
        field(&label, hp.kara_brak_wody, o, "karaBrakWody");
        for pair in arr(o, "osiedle") {
            assert_bits(
                &format!("{label} osiedle({})", pair[0]),
                hp.osiedle_pop_bonus(num(&pair[0])),
                num(&pair[1]),
            );
        }
        weird += usize::from(text(&h["difficulty"]) == "weird");
    }
    assert!(weird >= 30, "nieznana trudnosc: {weird}");
}

#[test]
fn compute_city_health_with_spichlerz_and_garncarnia_args_matches_web() {
    let d = data();
    let maps: Vec<BuildMap> = arr(&d, "maps").iter().map(build_map).collect();
    let (mut spich, mut garn, mut no_water_arg) = (0, 0, 0);
    for (i, h) in arr(&d, "hfull").iter().enumerate() {
        let label = format!("hfull-{i}");
        let map = &maps[h["mapIdx"].as_u64().unwrap() as usize];
        let hp = load_health_params(soc_of(h).as_ref(), &text(&h["difficulty"]));
        let tiles: Vec<bool> = arr(h, "tiles")
            .iter()
            .map(|b| b.as_bool().unwrap())
            .collect();
        let ctx = CityHealthMapContext {
            q: num(&h["q"]),
            r: num(&h["r"]),
            population: num(&h["ctxPop"]),
            map,
        };
        let has_water = h["hasWater"].as_bool();
        let got = compute_city_health(
            num(&h["ludnosc"]),
            &tiles,
            &strings(&h["built"]),
            &hp,
            has_water,
            if h["useCtx"].as_bool().unwrap() {
                Some(&ctx)
            } else {
                None
            },
            num(&h["spich"]),
            num(&h["garn"]),
        );
        assert_bits(&label, got, num(&h["out"]));
        spich += usize::from(num(&h["spich"]) != 0.0);
        garn += usize::from(num(&h["garn"]) != 0.0);
        no_water_arg += usize::from(has_water.is_none());
    }
    assert!(
        spich >= 300 && garn >= 300 && no_water_arg >= 150,
        "{spich} {garn} {no_water_arg}"
    );
}

#[test]
fn unit_rows_duplicate_keys_follow_json_parse_semantics() {
    // JS `JSON.parse` zachowuje pierwsza pozycje klucza i bierze OSTATNIA wartosc (zweryfikowane w node).
    let rows = unit_rows_from_json_str(
        r#"[{"Jednostka":"X","Utrzymanie (Pieniadz/ture)":1,"Epoka":null,"Utrzymanie (Pieniadz/ture)":3}]"#,
    )
    .unwrap();
    assert_eq!(rows[0].len(), 3);
    assert_eq!(rows[0][1].0, "Utrzymanie (Pieniadz/ture)");
    let p = load_advance_upkeep_params(Some(&base_econ()), "normal", &rows);
    assert_eq!(p.unit_upkeep_table.get("X"), Some(&3.0));
    // wartosci niecalkowite / bool / tablica / obiekt: bool, tablica i obiekt nie sa liczba
    let rows = unit_rows_from_json_str(
        r#"[{"Jednostka":"B","Utrzymanie A":true,"Utrzymanie B":[1],"Utrzymanie C":{"x":1},"Utrzymanie D":2.5,"Epoka":1}]"#,
    )
    .unwrap();
    let p = load_advance_upkeep_params(Some(&base_econ()), "normal", &rows);
    assert_eq!(p.unit_upkeep_table.get("B"), Some(&3.0)); // 2.5 -> round(2.5 * 1) = 3
}
