//! Wspolne pomocniki testow P6.7A (dolaczane przez `#[path]`). Wektory pochodza z URUCHOMIONEGO weba
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-7A-MIASTA-WZROST-A-Q1/gen-p67a-vectors.mjs`, pin edb8fb56).
#![allow(dead_code)]

use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;

use civ_engine::domain::city_growth::p6_7a::empire_food::{
    EmpireFoodCityRow, EmpireFoodState, EmpireFoodTick, OwnerFoodStates,
};
use civ_engine::domain::city_growth::p6_7a::growth_v85::{
    GrowthCity, GrowthPercentBreakdown, PopulationMatrixResolved, RationParams,
};
use civ_engine::domain::city_growth::p6_7a::{
    game_difficulty_from_web, CityEconomyTick, EconomyTickResult, GameDifficulty,
    SpichlerzCityBonusState,
};
use civ_engine::domain::recruitment::manpower::js_number_to_string;
use civ_engine::domain::terrain::city_founding::p6_6b::cities::{City, WealthState};
use serde_json::{json, Map, Value};

pub fn load(name: &str) -> Value {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/p6_7a_vectors")
        .join(name);
    let text = fs::read_to_string(&p).unwrap_or_else(|e| panic!("brak {}: {e}", p.display()));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("zly JSON {}: {e}", p.display()))
}

pub fn arr<'a>(v: &'a Value, key: &str) -> &'a Vec<Value> {
    v[key]
        .as_array()
        .unwrap_or_else(|| panic!("brak tablicy {key}"))
}

/// Liczba JS z wektora: liczba JSON albo string "NaN" / "Infinity" / "-Infinity" / "-0" / "~ulamek".
/// `None` dla wszystkiego innego (null, inny napis, obiekt, brak) - odpowiednik `typeof x !== 'number'`.
pub fn js_num(v: &Value) -> Option<f64> {
    match v {
        Value::Number(n) => n.as_f64(),
        Value::String(s) => match s.as_str() {
            "NaN" => Some(f64::NAN),
            "Infinity" => Some(f64::INFINITY),
            "-Infinity" => Some(f64::NEG_INFINITY),
            "-0" => Some(-0.0),
            other => other.strip_prefix('~').map(|repr| {
                repr.parse::<f64>()
                    .unwrap_or_else(|e| panic!("ulamek {other}: {e}"))
            }),
        },
        _ => None,
    }
}

pub fn num(v: &Value) -> f64 {
    js_num(v).unwrap_or_else(|| panic!("to nie liczba: {v}"))
}

/// Kodowanie liczby jak w generatorze (replacer): specjalne i niecalkowite jako napisy.
pub fn enc(x: f64) -> Value {
    if x.is_nan() {
        return json!("NaN");
    }
    if x == f64::INFINITY {
        return json!("Infinity");
    }
    if x == f64::NEG_INFINITY {
        return json!("-Infinity");
    }
    if x == 0.0 && x.is_sign_negative() {
        return json!("-0");
    }
    if x.fract() != 0.0 || x.abs() > 9_007_199_254_740_992.0 {
        return Value::String(format!("~{}", js_number_to_string(x)));
    }
    Value::Number(serde_json::Number::from_f64(x).expect("finite"))
}

/// Rownosc BITOWA f64 (NaN == NaN niezaleznie od ladunku).
pub fn assert_bits(label: &str, got: f64, want: f64) {
    let same = (got.is_nan() && want.is_nan()) || got.to_bits() == want.to_bits();
    assert!(same, "{label}: rust={got:?} web={want:?}");
}

/// Rownosc wartosci JSON z liczbami porownywanymi bitowo.
pub fn values_eq(a: &Value, b: &Value) -> bool {
    match (a, b) {
        (Value::Number(x), Value::Number(y)) => {
            let (x, y) = (x.as_f64().expect("f64"), y.as_f64().expect("f64"));
            x.to_bits() == y.to_bits()
        }
        (Value::Array(x), Value::Array(y)) => {
            x.len() == y.len() && x.iter().zip(y).all(|(p, q)| values_eq(p, q))
        }
        (Value::Object(x), Value::Object(y)) => {
            x.len() == y.len()
                && x.iter()
                    .all(|(k, v)| y.get(k).is_some_and(|w| values_eq(v, w)))
        }
        _ => a == b,
    }
}

/// Dekoduje wejscie JSON-owe "surowego" bloba weba (np. `econ-params.json`): zakodowane ulamki
/// (`"~0.06"`) i `"-0"` wracaja do liczb JSON; `"NaN"` / `"Infinity"` zostaja napisami (nie sa liczbami
/// JSON, a funkcje weba i tak traktuja je jak wartosc spoza `Number.isFinite`).
pub fn decode_raw(v: &Value) -> Value {
    match v {
        Value::String(s) if s.starts_with('~') || s == "-0" => {
            let x = js_num(v).expect("liczba");
            Value::Number(serde_json::Number::from_f64(x).expect("skonczona"))
        }
        Value::Array(a) => Value::Array(a.iter().map(decode_raw).collect()),
        Value::Object(o) => {
            Value::Object(o.iter().map(|(k, x)| (k.clone(), decode_raw(x))).collect())
        }
        other => other.clone(),
    }
}

/// Kanonizacja: `{ "__map": [[k, v], ...] }` (Map z weba) sortowane po kluczu; `{ "__set": [...] }` sortowane.
pub fn canon(v: &Value) -> Value {
    match v {
        Value::Array(a) => Value::Array(a.iter().map(canon).collect()),
        Value::Object(o) => {
            if let Some(Value::Array(pairs)) = o.get("__map") {
                let mut ps: Vec<Value> = pairs.iter().map(canon).collect();
                ps.sort_by_key(|p| p[0].to_string());
                let mut m = Map::new();
                m.insert("__map".to_string(), Value::Array(ps));
                return Value::Object(m);
            }
            if let Some(Value::Array(items)) = o.get("__set") {
                let mut xs: Vec<Value> = items.iter().map(canon).collect();
                xs.sort_by_key(Value::to_string);
                let mut m = Map::new();
                m.insert("__set".to_string(), Value::Array(xs));
                return Value::Object(m);
            }
            Value::Object(o.iter().map(|(k, x)| (k.clone(), canon(x))).collect())
        }
        other => other.clone(),
    }
}

pub fn assert_values(label: &str, got: &Value, want: &Value) {
    let (g, w) = (canon(got), canon(want));
    assert!(values_eq(&g, &w), "{label}:\n  rust={g}\n  web ={w}");
}

pub fn text(v: &Value) -> String {
    v.as_str().expect("str").to_string()
}

pub fn opt_text(v: &Value) -> Option<String> {
    v.as_str().map(str::to_string)
}

pub fn strings(v: &Value) -> Vec<String> {
    v.as_array().expect("strings").iter().map(text).collect()
}

/// `{ "absent": true }` w wektorze = argument pominiety (`undefined`).
pub fn absent(v: &Value) -> bool {
    v.get("absent").is_some_and(|x| x == &Value::Bool(true))
}

/// Argument opcjonalny: brak klucza, `absent` i `null` = `None`, inaczej liczba.
pub fn opt_num(v: &Value) -> Option<f64> {
    if v.is_null() || absent(v) {
        None
    } else {
        js_num(v)
    }
}

/// Pary `{ "__map": [[k, v], ...] }` -> `Vec<(Value, Value)>` w kolejnosci wstawiania.
pub fn map_pairs(v: &Value) -> Vec<(Value, Value)> {
    v["__map"]
        .as_array()
        .unwrap_or_else(|| panic!("to nie Map: {v}"))
        .iter()
        .map(|p| (p[0].clone(), p[1].clone()))
        .collect()
}

/// Lista par `[[k, v], ...]` (Map zserializowana jako `[...map.entries()]`).
pub fn pairs(v: &Value) -> Vec<(Value, Value)> {
    v.as_array()
        .unwrap_or_else(|| panic!("to nie lista par: {v}"))
        .iter()
        .map(|p| (p[0].clone(), p[1].clone()))
        .collect()
}

pub fn difficulty(v: &Value) -> Option<GameDifficulty> {
    if absent(v) {
        None
    } else {
        Some(game_difficulty_from_web(v.as_str().expect("trudnosc")).expect("trudnosc"))
    }
}

pub fn spichlerz_state(v: &Value) -> SpichlerzCityBonusState {
    SpichlerzCityBonusState {
        ceramika_active: v["ceramikaActive"].as_bool().expect("bool"),
        sol_active: v["solActive"].as_bool().expect("bool"),
        ma_spichlerz_pop: v["maSpichlerzPop"].as_bool().expect("bool"),
        ma_spichlerz_ii_pop: v["maSpichlerzIIPop"].as_bool().expect("bool"),
    }
}

pub fn opt_spichlerz_state(v: &Value) -> Option<SpichlerzCityBonusState> {
    if v.is_null() {
        None
    } else {
        Some(spichlerz_state(v))
    }
}

pub fn matrix(v: &Value) -> PopulationMatrixResolved {
    PopulationMatrixResolved {
        hunger_loss_multiplier: num(&v["hungerLossMultiplier"]),
        health_growth_multiplier: num(&v["healthGrowthMultiplier"]),
        happiness_base: num(&v["happinessBase"]),
        population_cap_delta: num(&v["populationCapDelta"]),
    }
}

pub fn matrix_value(m: &PopulationMatrixResolved) -> Value {
    json!({
        "hungerLossMultiplier": enc(m.hunger_loss_multiplier),
        "healthGrowthMultiplier": enc(m.health_growth_multiplier),
        "happinessBase": enc(m.happiness_base),
        "populationCapDelta": enc(m.population_cap_delta),
    })
}

pub fn ration_params(v: &Value) -> RationParams {
    RationParams {
        racje_zywnosc_1: num(&v["racjeZywnosc1"]),
        racje_zywnosc_2: num(&v["racjeZywnosc2"]),
        racje_zywnosc_3: num(&v["racjeZywnosc3"]),
        racje_wzrost_proc_1: num(&v["racjeWzrostProc1"]),
        racje_wzrost_proc_2: num(&v["racjeWzrostProc2"]),
        racje_wzrost_proc_3: num(&v["racjeWzrostProc3"]),
    }
}

pub fn ration_params_value(p: &RationParams) -> Value {
    json!({
        "racjeZywnosc1": enc(p.racje_zywnosc_1),
        "racjeZywnosc2": enc(p.racje_zywnosc_2),
        "racjeZywnosc3": enc(p.racje_zywnosc_3),
        "racjeWzrostProc1": enc(p.racje_wzrost_proc_1),
        "racjeWzrostProc2": enc(p.racje_wzrost_proc_2),
        "racjeWzrostProc3": enc(p.racje_wzrost_proc_3),
    })
}

pub fn breakdown_value(b: &GrowthPercentBreakdown) -> Value {
    json!({
        "total": enc(b.total),
        "racje": enc(b.racje),
        "maleMiasto": enc(b.male_miasto),
        "spichlerz": enc(b.spichlerz),
        "zdrowie": enc(b.zdrowie),
        "szczescie": enc(b.szczescie),
        "cywilizacja": enc(b.cywilizacja),
        "zaopatrzenie": enc(b.zaopatrzenie),
    })
}

/// Miasto z wektora -> `GrowthCity` (pola modelowane; brak = `None`).
pub fn growth_city(v: &Value) -> GrowthCity {
    let f = |k: &str| js_num(&v[k]);
    let b = |k: &str| v[k].as_bool();
    let city = City {
        id: opt_text(&v["id"]).unwrap_or_default(),
        owner_id: v["ownerId"].as_i64().unwrap_or(0),
        q: f("q").unwrap_or(0.0),
        r: f("r").unwrap_or(0.0),
        name: opt_text(&v["name"]).unwrap_or_default(),
        population: f("population").unwrap_or(0.0),
        poziom_racji: f("poziomRacji"),
        auto_wyzywienie: b("autoWyzywienie"),
        ration_migrated_v114: b("rationMigratedV114"),
        wzrost_ulamkowy: f("wzrostUlamkowy"),
        tury_bez_doplaty: f("turyBezDoplaty"),
        procent_rozwoj: f("procentRozwoj"),
        wealth_state: v.get("wealthState").map(|w| WealthState {
            poziom: num(&w["poziom"]),
            pula: num(&w["pula"]),
        }),
        ..City::default()
    };
    GrowthCity {
        city,
        hunger_loss_ulamkowy: f("hungerLossUlamkowy"),
        manpower: f("manpower"),
    }
}

/// `GrowthCity` -> kanoniczna postac (tylko pola obecne), jak `levelsOf`/`cityOut` w generatorze.
pub fn growth_city_value(gc: &GrowthCity) -> Value {
    let mut o = Map::new();
    let c = &gc.city;
    o.insert("id".to_string(), json!(c.id));
    if let Some(x) = c.poziom_racji {
        o.insert("poziomRacji".to_string(), enc(x));
    }
    if let Some(x) = c.ration_migrated_v114 {
        o.insert("rationMigratedV114".to_string(), json!(x));
    }
    if let Some(x) = c.wzrost_ulamkowy {
        o.insert("wzrostUlamkowy".to_string(), enc(x));
    }
    if let Some(x) = c.tury_bez_doplaty {
        o.insert("turyBezDoplaty".to_string(), enc(x));
    }
    if let Some(x) = gc.hunger_loss_ulamkowy {
        o.insert("hungerLossUlamkowy".to_string(), enc(x));
    }
    Value::Object(o)
}

/// Jak `growth_city_value`, ale z populacja i manpower (wyniki `applyPostCentralPopulationGrowth`).
pub fn growth_city_full_value(gc: &GrowthCity) -> Value {
    let mut v = growth_city_value(gc);
    if let Value::Object(o) = &mut v {
        o.insert("population".to_string(), enc(gc.city.population));
        if let Some(x) = gc.manpower {
            o.insert("manpower".to_string(), enc(x));
        }
    }
    v
}

pub fn tick(v: &Value) -> CityEconomyTick {
    let f = |k: &str| js_num(&v[k]);
    let b = |k: &str| v[k].as_bool();
    CityEconomyTick {
        city_id: opt_text(&v["cityId"]).unwrap_or_default(),
        owner_id: v["ownerId"].as_i64().unwrap_or(0),
        oblegany: b("oblegany").unwrap_or(false),
        zywnosc_brutto: f("zywnoscBrutto"),
        zywnosc_netto: f("zywnoscNetto").unwrap_or(f64::NAN),
        koszt_racji: f("kosztRacji"),
        bilans_lokalny: f("bilansLokalny"),
        poziom_racji: f("poziomRacji"),
        zdrowie: f("zdrowie").unwrap_or(0.0),
        spichlerz_ceramika: b("spichlerzCeramika"),
        spichlerz_sol: b("spichlerzSol"),
        ma_spichlerz: b("maSpichlerz"),
        ma_spichlerz_ii: b("maSpichlerzII"),
        ludnosc_po: f("ludnoscPo"),
        wzrost: b("wzrost"),
        ubytek: b("ubytek"),
        wzrost_procent: f("wzrostProcent"),
        wzrost_ulamkowy_po: f("wzrostUlamkowyPo"),
        magazyn_po_turze: f("magazynPoTurze"),
    }
}

pub fn tick_value(t: &CityEconomyTick) -> Value {
    let mut o = Map::new();
    o.insert("cityId".to_string(), json!(t.city_id));
    o.insert("ownerId".to_string(), json!(t.owner_id));
    o.insert("oblegany".to_string(), json!(t.oblegany));
    let mut put_n = |k: &str, x: Option<f64>| {
        if let Some(x) = x {
            o.insert(k.to_string(), enc(x));
        }
    };
    put_n("zywnoscBrutto", t.zywnosc_brutto);
    put_n("zywnoscNetto", Some(t.zywnosc_netto));
    put_n("kosztRacji", t.koszt_racji);
    put_n("bilansLokalny", t.bilans_lokalny);
    put_n("poziomRacji", t.poziom_racji);
    put_n("zdrowie", Some(t.zdrowie));
    put_n("ludnoscPo", t.ludnosc_po);
    put_n("wzrostProcent", t.wzrost_procent);
    put_n("wzrostUlamkowyPo", t.wzrost_ulamkowy_po);
    put_n("magazynPoTurze", t.magazyn_po_turze);
    let mut put_b = |k: &str, x: Option<bool>| {
        if let Some(x) = x {
            o.insert(k.to_string(), json!(x));
        }
    };
    put_b("spichlerzCeramika", t.spichlerz_ceramika);
    put_b("spichlerzSol", t.spichlerz_sol);
    put_b("maSpichlerz", t.ma_spichlerz);
    put_b("maSpichlerzII", t.ma_spichlerz_ii);
    put_b("wzrost", t.wzrost);
    put_b("ubytek", t.ubytek);
    Value::Object(o)
}

pub fn econ(v: &Value) -> EconomyTickResult {
    EconomyTickResult {
        per_city: arr(v, "perCity").iter().map(tick).collect(),
        growth: js_num(&v["growth"]).unwrap_or(0.0),
        starved: js_num(&v["starved"]).unwrap_or(0.0),
    }
}

pub fn econ_value(e: &EconomyTickResult) -> Value {
    json!({
        "perCity": e.per_city.iter().map(tick_value).collect::<Vec<_>>(),
        "growth": enc(e.growth),
        "starved": enc(e.starved),
    })
}

pub fn ticks_of(v: &Value) -> Vec<CityEconomyTick> {
    v.as_array().expect("ticks").iter().map(tick).collect()
}

pub fn ticks_value(ts: &[CityEconomyTick]) -> Value {
    Value::Array(ts.iter().map(tick_value).collect())
}

pub fn spichlerz_map(v: &Value) -> Option<BTreeMap<String, SpichlerzCityBonusState>> {
    if v.is_null() {
        return None;
    }
    Some(
        pairs(v)
            .into_iter()
            .map(|(k, s)| (text(&k), spichlerz_state(&s)))
            .collect(),
    )
}

pub fn f64_map(v: &Value) -> Option<BTreeMap<String, f64>> {
    if v.is_null() {
        return None;
    }
    Some(
        pairs(v)
            .into_iter()
            .map(|(k, x)| (text(&k), num(&x)))
            .collect(),
    )
}

pub fn built_map(v: &Value) -> Option<BTreeMap<String, Vec<String>>> {
    if v.is_null() {
        return None;
    }
    Some(
        pairs(v)
            .into_iter()
            .map(|(k, x)| (text(&k), strings(&x)))
            .collect(),
    )
}

pub fn owner_states(v: &Value) -> OwnerFoodStates {
    let mut s = OwnerFoodStates::new();
    for (k, st) in map_pairs(v) {
        s.set(
            k.as_i64().expect("owner"),
            EmpireFoodState {
                zapasy_panstwa: num(&st["zapasyPanstwa"]),
                procent_rozwoj: js_num(&st["procentRozwoj"]),
                tury_ujemnych_zapasow: js_num(&st["turyUjemnychZapasow"]),
            },
        );
    }
    s
}

pub fn owner_states_value(s: &OwnerFoodStates) -> Value {
    let pairs: Vec<Value> = s
        .entries()
        .iter()
        .map(|(k, st)| {
            let mut o = Map::new();
            o.insert("zapasyPanstwa".to_string(), enc(st.zapasy_panstwa));
            if let Some(x) = st.procent_rozwoj {
                o.insert("procentRozwoj".to_string(), enc(x));
            }
            if let Some(x) = st.tury_ujemnych_zapasow {
                o.insert("turyUjemnychZapasow".to_string(), enc(x));
            }
            json!([k, Value::Object(o)])
        })
        .collect();
    json!({ "__map": pairs })
}

pub fn row_value(r: &EmpireFoodCityRow) -> Value {
    let mut o = Map::new();
    o.insert("cityId".to_string(), json!(r.city_id));
    o.insert("name".to_string(), json!(r.name));
    o.insert("produkcja".to_string(), enc(r.produkcja));
    o.insert("kosztRacji".to_string(), enc(r.koszt_racji));
    o.insert("bilans".to_string(), enc(r.bilans));
    o.insert("wzrostProcent".to_string(), enc(r.wzrost_procent));
    o.insert("nakarmione".to_string(), json!(r.nakarmione));
    if let Some(b) = &r.breakdown {
        o.insert("breakdown".to_string(), breakdown_value(b));
    }
    Value::Object(o)
}

pub fn ef_tick_value(t: &EmpireFoodTick) -> Value {
    let fed: Vec<Value> = t
        .fed_by_city_id
        .iter()
        .map(|(k, v)| json!([k, v]))
        .collect();
    json!({
        "ownerId": t.owner_id,
        "uprawaHodowla": enc(t.uprawa_hodowla),
        "wyzwienieLudnosci": enc(t.wyzwienie_ludnosci),
        "nadwyzka": enc(t.nadwyzka),
        "pomocMiastom": enc(t.pomoc_miastom),
        "spichlerzStolicy": enc(t.spichlerz_stolicy),
        "wojsko": enc(t.wojsko),
        "przyrostZapasow": enc(t.przyrost_zapasow),
        "zapasyPrzed": enc(t.zapasy_przed),
        "zapasyPo": enc(t.zapasy_po),
        "maxCap": enc(t.max_cap),
        "kosztArmii": enc(t.koszt_armii),
        "glodWojska": t.glod_wojska,
        "turyUjemnychZapasowPo": enc(t.tury_ujemnych_zapasow_po),
        "glodWojskaAtrycjaAktywna": t.glod_wojska_atrycja_aktywna,
        "zywnoscBrutto": enc(t.zywnosc_brutto),
        "doRozwoju": enc(t.do_rozwoju),
        "doPanstwa": enc(t.do_panstwa),
        "perCityRows": t.per_city_rows.iter().map(row_value).collect::<Vec<_>>(),
        "fedByCityId": { "__map": fed },
    })
}

/// Tik z wektora (stan PRZED `applyPostCentral...`) -> `EmpireFoodTick` (wszystkie pola).
pub fn ef_tick_from(v: &Value) -> EmpireFoodTick {
    let rows = arr(v, "perCityRows")
        .iter()
        .map(|r| EmpireFoodCityRow {
            city_id: text(&r["cityId"]),
            name: opt_text(&r["name"]).unwrap_or_default(),
            produkcja: num(&r["produkcja"]),
            koszt_racji: num(&r["kosztRacji"]),
            bilans: num(&r["bilans"]),
            wzrost_procent: num(&r["wzrostProcent"]),
            nakarmione: r["nakarmione"].as_bool().expect("bool"),
            breakdown: None,
        })
        .collect();
    let fed = map_pairs(&v["fedByCityId"])
        .into_iter()
        .map(|(k, x)| (text(&k), x.as_bool().expect("bool")))
        .collect();
    EmpireFoodTick {
        owner_id: v["ownerId"].as_i64().expect("owner"),
        uprawa_hodowla: num(&v["uprawaHodowla"]),
        wyzwienie_ludnosci: num(&v["wyzwienieLudnosci"]),
        nadwyzka: num(&v["nadwyzka"]),
        pomoc_miastom: num(&v["pomocMiastom"]),
        spichlerz_stolicy: num(&v["spichlerzStolicy"]),
        wojsko: num(&v["wojsko"]),
        przyrost_zapasow: num(&v["przyrostZapasow"]),
        zapasy_przed: num(&v["zapasyPrzed"]),
        zapasy_po: num(&v["zapasyPo"]),
        max_cap: num(&v["maxCap"]),
        koszt_armii: num(&v["kosztArmii"]),
        glod_wojska: v["glodWojska"].as_bool().expect("bool"),
        tury_ujemnych_zapasow_po: num(&v["turyUjemnychZapasowPo"]),
        glod_wojska_atrycja_aktywna: v["glodWojskaAtrycjaAktywna"].as_bool().expect("bool"),
        zywnosc_brutto: num(&v["zywnoscBrutto"]),
        do_rozwoju: num(&v["doRozwoju"]),
        do_panstwa: num(&v["doPanstwa"]),
        per_city_rows: rows,
        fed_by_city_id: fed,
    }
}
