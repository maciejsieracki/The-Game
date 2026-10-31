//! Wspolne pomocniki testow P6.6B (dolaczane przez `#[path]`). Wektory pochodza z URUCHOMIONEGO weba
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-6B-MIASTA-ZAKLADANIE-B-Q1/gen-p66b-vectors.mjs`, pin edb8fb56).
#![allow(dead_code)]

use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;

use civ_engine::domain::pathfinding::ruch_jednostek::{
    RuchHex, RuchMapa, TerenBazowy as RuchTeren,
};
use civ_engine::domain::recruitment::manpower::js_number_to_string;
use civ_engine::domain::terrain::city_founding::p6_6b::cities::{
    BudowaFocus, BudowaTryb, City, CityPodzialHandlu, CityPodzialPracy, FoodBuffer, OkolicaFocus,
    OkolicaTryb, UlepszeniaFocus, UlepszeniaTryb, WealthState,
};
use serde_json::{json, Map, Value};

pub fn load(name: &str) -> Value {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/p6_6b_vectors")
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
/// `None` dla wszystkiego innego (null, inny napis, obiekt...) - odpowiednik `typeof x !== 'number'`.
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
    if x.fract() != 0.0 {
        return Value::String(format!("~{}", js_number_to_string(x)));
    }
    Value::Number(serde_json::Number::from_f64(x).expect("finite"))
}

/// Rownosc BITOWA f64 (NaN == NaN niezaleznie od ladunku).
pub fn assert_bits(label: &str, got: f64, want: f64) {
    let same = (got.is_nan() && want.is_nan()) || got.to_bits() == want.to_bits();
    assert!(same, "{label}: rust={got:?} web={want:?}");
}

/// Rownosc wartosci JSON z liczbami porownywanymi bitowo (PosInt == Float o tej samej wartosci).
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

pub fn assert_values(label: &str, got: &Value, want: &Value) {
    assert!(
        values_eq(got, want),
        "{label}:\n  rust={got}\n  web ={want}"
    );
}

pub fn text(v: &Value) -> String {
    v.as_str().expect("str").to_string()
}

pub fn opt_text(v: &Value) -> Option<String> {
    v.as_str().map(str::to_string)
}

pub fn opt_bool(v: &Value) -> Option<bool> {
    v.as_bool()
}

pub fn strings(v: &Value) -> Vec<String> {
    v.as_array().expect("strings").iter().map(text).collect()
}

pub fn ids(v: &Value) -> Vec<i64> {
    v.as_array()
        .expect("ids")
        .iter()
        .map(|x| x.as_i64().expect("id"))
        .collect()
}

fn f64_map(v: &Value) -> BTreeMap<String, f64> {
    v.as_object()
        .expect("mapa")
        .iter()
        .map(|(k, x)| (k.clone(), num(x)))
        .collect()
}

fn map_value(m: &BTreeMap<String, f64>) -> Value {
    let mut o = Map::new();
    for (k, x) in m {
        o.insert(k.clone(), enc(*x));
    }
    Value::Object(o)
}

pub fn handel(v: &Value) -> CityPodzialHandlu {
    CityPodzialHandlu {
        procent_nauka: num(&v["procentNauka"]),
        procent_pieniadz: num(&v["procentPieniadz"]),
        procent_luksus: num(&v["procentLuksus"]),
    }
}

pub fn handel_value(h: &CityPodzialHandlu) -> Value {
    json!({
        "procentNauka": enc(h.procent_nauka),
        "procentPieniadz": enc(h.procent_pieniadz),
        "procentLuksus": enc(h.procent_luksus),
    })
}

pub fn podzial(v: &Value) -> CityPodzialPracy {
    CityPodzialPracy {
        procent_budynki: num(&v["procentBudynki"]),
    }
}

pub fn podzial_value(p: &CityPodzialPracy) -> Value {
    json!({ "procentBudynki": enc(p.procent_budynki) })
}

pub fn food_buffer(v: &Value) -> FoodBuffer {
    if let Some(x) = js_num(v) {
        return FoodBuffer::Number(x);
    }
    match v {
        Value::Object(o) => FoodBuffer::Legacy {
            aktualny: o.get("aktualny").and_then(js_num),
        },
        _ => FoodBuffer::Other,
    }
}

/// Wektorowe `City` -> `City` Rust (pola, ktore port modeluje; brak pola = `None`).
pub fn city_from(v: &Value) -> City {
    let f = |k: &str| js_num(&v[k]);
    let b = |k: &str| v[k].as_bool();
    let s = |k: &str| opt_text(&v[k]);
    City {
        id: s("id").unwrap_or_default(),
        owner_id: v["ownerId"].as_i64().unwrap_or(0),
        q: f("q").unwrap_or(0.0),
        r: f("r").unwrap_or(0.0),
        name: s("name").unwrap_or_default(),
        population: f("population").unwrap_or(0.0),
        magazyn_zywnosci: v.get("magazynZywnosci").map(food_buffer),
        surowce: v.get("surowce").map(f64_map),
        podzial_handlu_override: b("podzialHandluOverride"),
        podzial_handlu: v.get("podzialHandlu").map(handel),
        podzial_pracy_override: b("podzialPracyOverride"),
        podzial_pracy: v.get("podzialPracy").map(podzial),
        poziom_racji: f("poziomRacji"),
        poziom_racji_override: b("poziomRacjiOverride"),
        auto_wyzywienie: b("autoWyzywienie"),
        ration_migrated_v114: b("rationMigratedV114"),
        wzrost_ulamkowy: f("wzrostUlamkowy"),
        tury_bez_doplaty: f("turyBezDoplaty"),
        procent_rozwoj: f("procentRozwoj"),
        okolica_focus: s("okolicaFocus").map(|x| OkolicaFocus::from_web(&x).expect("okolicaFocus")),
        okolica_focus_override: b("okolicaFocusOverride"),
        okolica_tryb: s("okolicaTryb").map(|x| OkolicaTryb::from_web(&x).expect("okolicaTryb")),
        okolica_reczne: None,
        budowa_focus: s("budowaFocus").map(|x| BudowaFocus::from_web(&x).expect("budowaFocus")),
        budowa_tryb: s("budowaTryb").map(|x| BudowaTryb::from_web(&x).expect("budowaTryb")),
        budowa_focus_override: b("budowaFocusOverride"),
        budowa_priorytet_typow: v.get("budowaPriorytetTypow").map(|a| {
            strings(a)
                .iter()
                .map(|x| BudowaFocus::from_web(x).expect("priorytet"))
                .collect()
        }),
        budowa_lista: v.get("budowaLista").map(strings),
        ulepszenia_override: b("ulepszeniaOverride"),
        ulepszenia_focus: s("ulepszeniaFocus")
            .map(|x| UlepszeniaFocus::from_web(&x).expect("ulepszeniaFocus")),
        ulepszenia_tryb: s("ulepszeniaTryb")
            .map(|x| UlepszeniaTryb::from_web(&x).expect("ulepszeniaTryb")),
        ulepszenia_only_worked: b("ulepszeniaOnlyWorked"),
        ulepszenia_wolno_wycinac_las: b("ulepszeniaWolnoWycinacLas"),
        ulepszenia_praca_percent: f("ulepszeniaPracaPercent"),
        ulepszenia_per_turn: f("ulepszeniaPerTurn"),
        wealth_state: v.get("wealthState").map(|w| WealthState {
            poziom: num(&w["poziom"]),
            pula: num(&w["pula"]),
        }),
        wealth_immunity_remaining: f("wealthImmunityRemaining"),
        founded_by_owner: b("foundedByOwner"),
        start_city_state: b("startCityState"),
        postep_budynkow_usuniete: v.get("postepBudynkowUsuniete").map(f64_map),
    }
}

/// `City` Rust -> kanoniczna postac z generatora (`cityOut`): tylko pola obecne.
pub fn city_value(c: &City) -> Value {
    let mut o = Map::new();
    let mut put = |k: &str, v: Value| {
        o.insert(k.to_string(), v);
    };
    put("id", json!(c.id));
    put("ownerId", json!(c.owner_id));
    put("q", enc(c.q));
    put("r", enc(c.r));
    put("name", json!(c.name));
    put("population", enc(c.population));
    if let Some(m) = &c.magazyn_zywnosci {
        match m {
            FoodBuffer::Number(x) => put("magazynZywnosci", enc(*x)),
            // stare zapisy (obiekt / inna wartosc) przechodza przez funkcje, ktore nie dotykaja magazynu;
            // testy takich funkcji usuwaja to pole z obu stron (patrz `without_food`)
            FoodBuffer::Legacy { .. } | FoodBuffer::Other => put("magazynZywnosci", Value::Null),
        }
    }
    if let Some(m) = &c.surowce {
        put("surowce", map_value(m));
    }
    if let Some(x) = c.podzial_handlu_override {
        put("podzialHandluOverride", json!(x));
    }
    if let Some(x) = &c.podzial_handlu {
        put("podzialHandlu", handel_value(x));
    }
    if let Some(x) = c.podzial_pracy_override {
        put("podzialPracyOverride", json!(x));
    }
    if let Some(x) = &c.podzial_pracy {
        put("podzialPracy", podzial_value(x));
    }
    if let Some(x) = c.poziom_racji {
        put("poziomRacji", enc(x));
    }
    if let Some(x) = c.poziom_racji_override {
        put("poziomRacjiOverride", json!(x));
    }
    if let Some(x) = c.auto_wyzywienie {
        put("autoWyzywienie", json!(x));
    }
    if let Some(x) = c.ration_migrated_v114 {
        put("rationMigratedV114", json!(x));
    }
    if let Some(x) = c.wzrost_ulamkowy {
        put("wzrostUlamkowy", enc(x));
    }
    if let Some(x) = c.tury_bez_doplaty {
        put("turyBezDoplaty", enc(x));
    }
    if let Some(x) = c.procent_rozwoj {
        put("procentRozwoj", enc(x));
    }
    if let Some(x) = c.okolica_focus {
        put("okolicaFocus", json!(x.web_value()));
    }
    if let Some(x) = c.okolica_focus_override {
        put("okolicaFocusOverride", json!(x));
    }
    if let Some(x) = c.okolica_tryb {
        put("okolicaTryb", json!(x.web_value()));
    }
    if let Some(x) = c.budowa_focus {
        put("budowaFocus", json!(x.web_value()));
    }
    if let Some(x) = c.budowa_tryb {
        put("budowaTryb", json!(x.web_value()));
    }
    if let Some(x) = c.budowa_focus_override {
        put("budowaFocusOverride", json!(x));
    }
    if let Some(x) = &c.budowa_priorytet_typow {
        put(
            "budowaPriorytetTypow",
            Value::Array(x.iter().map(|f| json!(f.web_value())).collect()),
        );
    }
    if let Some(x) = &c.budowa_lista {
        put("budowaLista", json!(x));
    }
    if let Some(x) = c.ulepszenia_override {
        put("ulepszeniaOverride", json!(x));
    }
    if let Some(x) = c.ulepszenia_focus {
        put("ulepszeniaFocus", json!(x.web_value()));
    }
    if let Some(x) = c.ulepszenia_tryb {
        put("ulepszeniaTryb", json!(x.web_value()));
    }
    if let Some(x) = c.ulepszenia_only_worked {
        put("ulepszeniaOnlyWorked", json!(x));
    }
    if let Some(x) = c.ulepszenia_wolno_wycinac_las {
        put("ulepszeniaWolnoWycinacLas", json!(x));
    }
    if let Some(x) = c.ulepszenia_praca_percent {
        put("ulepszeniaPracaPercent", enc(x));
    }
    if let Some(x) = c.ulepszenia_per_turn {
        put("ulepszeniaPerTurn", enc(x));
    }
    if let Some(w) = &c.wealth_state {
        put(
            "wealthState",
            json!({ "poziom": enc(w.poziom), "pula": enc(w.pula) }),
        );
    }
    if let Some(x) = c.wealth_immunity_remaining {
        put("wealthImmunityRemaining", enc(x));
    }
    if let Some(x) = c.founded_by_owner {
        put("foundedByOwner", json!(x));
    }
    if let Some(x) = c.start_city_state {
        put("startCityState", json!(x));
    }
    if let Some(m) = &c.postep_budynkow_usuniete {
        put("postepBudynkowUsuniete", map_value(m));
    }
    Value::Object(o)
}

/// Rownosc `FoodBuffer` z porownaniem BITOWYM liczb (NaN == NaN).
pub fn food_eq(a: Option<FoodBuffer>, b: Option<FoodBuffer>) -> bool {
    let same = |x: f64, y: f64| (x.is_nan() && y.is_nan()) || x.to_bits() == y.to_bits();
    match (a, b) {
        (None, None) => true,
        (Some(FoodBuffer::Number(x)), Some(FoodBuffer::Number(y))) => same(x, y),
        (Some(FoodBuffer::Legacy { aktualny: x }), Some(FoodBuffer::Legacy { aktualny: y })) => {
            match (x, y) {
                (None, None) => true,
                (Some(x), Some(y)) => same(x, y),
                _ => false,
            }
        }
        (Some(FoodBuffer::Other), Some(FoodBuffer::Other)) => true,
        _ => false,
    }
}

/// Usuwa `magazynZywnosci` (pole moze miec postac spoza liczby, niemodelowana w wyjsciu).
pub fn without_food(mut v: Value) -> Value {
    if let Value::Object(o) = &mut v {
        o.remove("magazynZywnosci");
    }
    v
}

pub fn ruch_terrain(s: &str) -> RuchTeren {
    RuchTeren::from_web(s).unwrap_or_else(|| panic!("teren {s}"))
}

/// Mapa z listy `[["q,r", "teren"], ...]`.
pub fn ruch_map(v: &Value) -> RuchMapa {
    let mut map = RuchMapa::new();
    for pair in v.as_array().expect("mapa") {
        let key = pair[0].as_str().expect("klucz");
        let (q, r) = key.split_once(',').expect("klucz q,r");
        map.insert(
            (q.parse().expect("q"), r.parse().expect("r")),
            RuchHex::new(ruch_terrain(pair[1].as_str().expect("teren"))),
        );
    }
    map
}
