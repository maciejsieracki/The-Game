//! P6.8E-P1 - `economy-upkeep.ts` (web pin 91dc998a), czesc P1: magazyny (sekcje A/A2) i parametry B.
//! Wektory z URUCHOMIONEGO weba (`tests/p6_8e_vectors/economy_upkeep_p1.json`, generator
//! `gen-p6-8e-vectors.mjs` w runie R-RUSTPORT-P6-8E-UTRZYMANIE-EKONOMII-Q1). Porownanie BITOWE f64.
//! Kodowanie: calkowita skonczona = JSON number; niecalkowita = `{"$f": String(x)}`;
//! NaN/Infinity/-Infinity/-0 = `{"$n": "..."}`; brak klucza = `undefined` w webie.

use std::collections::BTreeMap;

use civ_engine::domain::city_growth::p6_7a::magazyn_era_multiplier;
use civ_engine::domain::turn_economy::economy_upkeep_p1 as eu;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_8e_vectors/economy_upkeep_p1.json");

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("wektory P1 parse")
}

fn arr<'a>(v: &'a Value, key: &str) -> &'a Vec<Value> {
    v[key]
        .as_array()
        .unwrap_or_else(|| panic!("brak tablicy {key}"))
}

/// Liczba z wektora; `None` gdy to nie liczba (null, napis, brak).
fn try_num(v: &Value) -> Option<f64> {
    match v {
        Value::Number(n) => n.as_f64(),
        Value::Object(o) if o.contains_key("$f") => Some(
            o["$f"]
                .as_str()
                .expect("$f napis")
                .parse::<f64>()
                .expect("$f liczba"),
        ),
        Value::Object(o) if o.contains_key("$n") => Some(match o["$n"].as_str().expect("$n") {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "-0" => -0.0,
            other => panic!("nieznana liczba specjalna {other}"),
        }),
        _ => None,
    }
}

fn num(v: &Value) -> f64 {
    try_num(v).unwrap_or_else(|| panic!("oczekiwano liczby, jest {v}"))
}

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

fn assert_same(label: &str, got: f64, want: f64) {
    assert!(
        same(got, want),
        "{label}: got {got:?} ({:#018x}), web {want:?} ({:#018x})",
        got.to_bits(),
        want.to_bits()
    );
}

fn difficulty(s: &str) -> eu::Difficulty {
    match s {
        "easy" => eu::Difficulty::Easy,
        "normal" => eu::Difficulty::Normal,
        "hard" => eu::Difficulty::Hard,
        other => panic!("nieznana trudnosc {other}"),
    }
}

/// Surowy econ-params z wektora: grupa nieobecna = None; komorka nie-liczbowa = `Other`.
fn raw_from(v: &Value) -> eu::RawEconParamsForUpkeep {
    let group = |name: &str| -> Option<eu::RawGroup> {
        let g = v.get(name)?.as_object()?;
        let mut out = BTreeMap::new();
        for (key, row) in g {
            let mut r = BTreeMap::new();
            for (d, cell) in row.as_object().expect("wiersz obiekt") {
                let c = match try_num(cell) {
                    Some(x) => eu::RawCell::Num(x),
                    None => eu::RawCell::Other,
                };
                r.insert(d.clone(), c);
            }
            out.insert(key.clone(), r);
        }
        Some(out)
    };
    eu::RawEconParamsForUpkeep {
        ekonomia_miasta: group("ekonomia_miasta"),
        budynki: group("budynki"),
        globalne: group("globalne"),
    }
}

fn storage_from(v: &Value) -> eu::StorageParams {
    eu::StorageParams {
        baza_zywnosc: num(&v["bazaZywnosc"]),
        baza_surowce: num(&v["bazaSurowce"]),
        mnoznik_magazynu: num(&v["mnoznikMagazynu"]),
    }
}

fn owner_from(v: &Value) -> eu::OwnerStorageParams {
    eu::OwnerStorageParams {
        baza_surowce_panstwo: num(&v["bazaSurowcePanstwo"]),
        bonus_surowce_na_budynek: num(&v["bonusSurowceNaBudynek"]),
    }
}

fn stores_from(v: &Value) -> eu::CityStores {
    eu::CityStores {
        zywnosc: num(&v["zywnosc"]),
        surowce: map_from(&v["surowce"]),
    }
}

fn map_from(v: &Value) -> BTreeMap<String, f64> {
    v.as_object()
        .map(|o| o.iter().map(|(k, x)| (k.clone(), num(x))).collect())
        .unwrap_or_default()
}

fn assert_map(label: &str, got: &BTreeMap<String, f64>, want: &Value) {
    let want = want.as_object().expect("oczekiwana mapa");
    assert_eq!(
        got.keys().collect::<Vec<_>>(),
        want.keys().collect::<Vec<_>>(),
        "{label}: rozne klucze"
    );
    for (k, w) in want {
        assert_same(&format!("{label}[{k}]"), got[k], num(w));
    }
}

fn assert_stores(label: &str, got: &eu::CityStores, want: &Value) {
    assert_same(
        &format!("{label}.zywnosc"),
        got.zywnosc,
        num(&want["zywnosc"]),
    );
    assert_map(&format!("{label}.surowce"), &got.surowce, &want["surowce"]);
}

#[test]
fn defaults_match_web() {
    let v = vectors();
    let d = &v["defaults"];
    let s = eu::DEFAULT_STORAGE_PARAMS;
    assert_same(
        "DEFAULT_STORAGE.baza_zywnosc",
        s.baza_zywnosc,
        num(&d["storage"]["bazaZywnosc"]),
    );
    assert_same(
        "DEFAULT_STORAGE.baza_surowce",
        s.baza_surowce,
        num(&d["storage"]["bazaSurowce"]),
    );
    assert_same(
        "DEFAULT_STORAGE.mnoznik",
        s.mnoznik_magazynu,
        num(&d["storage"]["mnoznikMagazynu"]),
    );
    let o = eu::DEFAULT_OWNER_STORAGE_PARAMS;
    assert_same(
        "DEFAULT_OWNER.baza",
        o.baza_surowce_panstwo,
        num(&d["ownerStorage"]["bazaSurowcePanstwo"]),
    );
    assert_same(
        "DEFAULT_OWNER.bonus",
        o.bonus_surowce_na_budynek,
        num(&d["ownerStorage"]["bonusSurowceNaBudynek"]),
    );
    let want_keys: Vec<&str> = d["ownerCappedKeys"]
        .as_array()
        .expect("klucze")
        .iter()
        .map(|k| k.as_str().expect("napis"))
        .collect();
    assert_eq!(eu::OWNER_CAPPED_RESOURCE_KEYS.to_vec(), want_keys);
    let u = eu::DEFAULT_UPKEEP_PARAMS;
    assert_eq!(u.budynek_utrzymanie_flat, Some(1.0));
    assert_same("UPKEEP.jednostka", u.jednostka_utrzymanie_std, 1.0);
    assert_same("UPKEEP.ruch", u.zywnosc_jednostka_ruch, 1.0);
    assert_same("UPKEEP.oboz", u.zywnosc_jednostka_oboz, 0.5);
    assert_same("UPKEEP.terytorium", u.zywnosc_mnoznik_terytorium, 1.0);
    assert_same("UPKEEP.poza", u.zywnosc_mnoznik_poza_terytorium, 2.0);
}

#[test]
fn load_storage_params_matches_web() {
    let v = vectors();
    for (i, c) in arr(&v, "loadStorage").iter().enumerate() {
        let raw = raw_from(&c["raw"]);
        let got = eu::load_storage_params(&raw, difficulty(c["difficulty"].as_str().unwrap()));
        let want = storage_from(&c["out"]);
        assert_same(
            &format!("loadStorage[{i}].baza_zywnosc"),
            got.baza_zywnosc,
            want.baza_zywnosc,
        );
        assert_same(
            &format!("loadStorage[{i}].baza_surowce"),
            got.baza_surowce,
            want.baza_surowce,
        );
        assert_same(
            &format!("loadStorage[{i}].mnoznik"),
            got.mnoznik_magazynu,
            want.mnoznik_magazynu,
        );
    }
}

#[test]
fn load_owner_storage_params_matches_web() {
    let v = vectors();
    for (i, c) in arr(&v, "loadOwner").iter().enumerate() {
        let raw = raw_from(&c["raw"]);
        let got =
            eu::load_owner_storage_params(&raw, difficulty(c["difficulty"].as_str().unwrap()));
        let want = owner_from(&c["out"]);
        assert_same(
            &format!("loadOwner[{i}].baza"),
            got.baza_surowce_panstwo,
            want.baza_surowce_panstwo,
        );
        assert_same(
            &format!("loadOwner[{i}].bonus"),
            got.bonus_surowce_na_budynek,
            want.bonus_surowce_na_budynek,
        );
    }
}

#[test]
fn food_and_resource_capacity_match_web() {
    let v = vectors();
    for (i, c) in arr(&v, "foodCap").iter().enumerate() {
        let got = eu::food_storage_capacity(c["ma"].as_bool().unwrap(), &storage_from(&c["p"]));
        assert_same(&format!("foodCap[{i}]"), got, num(&c["out"]));
    }
    for (i, c) in arr(&v, "resCap").iter().enumerate() {
        let got = eu::resource_storage_capacity_per_type(
            c["ma"].as_bool().unwrap(),
            &storage_from(&c["p"]),
        );
        assert_same(&format!("resCap[{i}]"), got, num(&c["out"]));
    }
}

#[test]
fn food_buffer_matches_web() {
    let v = vectors();
    for (i, c) in arr(&v, "foodBuf").iter().enumerate() {
        let input = &c["in"];
        let fb = match input["t"].as_str().unwrap() {
            "num" => eu::FoodBuffer::Num(num(&input["v"])),
            "obj" => eu::FoodBuffer::Obj {
                aktualny: try_num(&input["aktualny"]),
            },
            _ => eu::FoodBuffer::Other,
        };
        assert_same(
            &format!("foodBuf[{i}]"),
            eu::read_city_food_buffer(fb),
            num(&c["out"]),
        );
    }
}

#[test]
fn clamp_and_apply_food_match_web() {
    let v = vectors();
    for (i, c) in arr(&v, "clamp").iter().enumerate() {
        let r = eu::clamp_store(num(&c["a"]), num(&c["c"]));
        assert_same(&format!("clamp[{i}].stored"), r.stored, num(&c["stored"]));
        assert_same(
            &format!("clamp[{i}].overflow"),
            r.overflow,
            num(&c["overflow"]),
        );
    }
    for (i, c) in arr(&v, "applyFood").iter().enumerate() {
        let r = eu::apply_food(num(&c["cur"]), num(&c["delta"]), num(&c["cap"]));
        assert_same(
            &format!("applyFood[{i}].stored"),
            r.stored,
            num(&c["stored"]),
        );
        assert_same(
            &format!("applyFood[{i}].overflow"),
            r.overflow,
            num(&c["overflow"]),
        );
    }
}

#[test]
fn apply_resource_intake_matches_web() {
    let v = vectors();
    for (i, c) in arr(&v, "intake").iter().enumerate() {
        let (stores, overflow) = eu::apply_resource_intake(
            &stores_from(&c["stores"]),
            &map_from(&c["intake"]),
            num(&c["cap"]),
        );
        assert_stores(&format!("intake[{i}].out"), &stores, &c["outStores"]);
        assert_map(&format!("intake[{i}].overflow"), &overflow, &c["overflow"]);
    }
}

#[test]
fn global_capacity_lost_and_conquest_match_web() {
    let v = vectors();
    for (i, c) in arr(&v, "globalCap").iter().enumerate() {
        let flags: Vec<bool> = c["flags"]
            .as_array()
            .unwrap()
            .iter()
            .map(|b| b.as_bool().unwrap())
            .collect();
        let got = eu::global_resource_capacity_per_type(&flags, &storage_from(&c["p"]));
        assert_same(&format!("globalCap[{i}]"), got, num(&c["out"]));
    }
    let lost = eu::on_city_lost();
    assert_stores("lost", &lost, &v["lost"]["out"]);
    for (i, c) in arr(&v, "conquer").iter().enumerate() {
        let (stores, overflow) = eu::on_city_conquered(
            &stores_from(&c["winner"]),
            &stores_from(&c["loser"]),
            num(&c["fcap"]),
            num(&c["rcap"]),
        );
        assert_stores(&format!("conquer[{i}].out"), &stores, &c["outStores"]);
        assert_map(&format!("conquer[{i}].overflow"), &overflow, &c["overflow"]);
    }
}

#[test]
fn owner_capacity_and_era_match_web() {
    let v = vectors();
    // Epoki ulamkowe > 1 -> ograniczona rozbieznosc z `powf` (patrz known_fractional_era_pow_gap).
    for (i, c) in arr(&v, "ownerCap").iter().enumerate() {
        let era = num(&c["era"]);
        let got = eu::owner_resource_capacity_per_type(num(&c["count"]), &owner_from(&c["p"]), era);
        if is_fractional_era_above_one(era) {
            assert_within_ulps(
                &format!("ownerCap[{i}] epoka {era}"),
                got,
                num(&c["out"]),
                2,
            );
            continue;
        }
        assert_same(&format!("ownerCap[{i}]"), got, num(&c["out"]));
    }
    for (i, c) in arr(&v, "ownerEra").iter().enumerate() {
        let era = num(&c["era"]);
        let got = eu::owner_storage_params_for_era(&owner_from(&c["p"]), era);
        let want = owner_from(&c["out"]);
        if is_fractional_era_above_one(era) {
            assert_within_ulps(
                &format!("ownerEra[{i}].baza epoka {era}"),
                got.baza_surowce_panstwo,
                want.baza_surowce_panstwo,
                2,
            );
            assert_within_ulps(
                &format!("ownerEra[{i}].bonus epoka {era}"),
                got.bonus_surowce_na_budynek,
                want.bonus_surowce_na_budynek,
                2,
            );
            continue;
        }
        assert_same(
            &format!("ownerEra[{i}].baza"),
            got.baza_surowce_panstwo,
            want.baza_surowce_panstwo,
        );
        assert_same(
            &format!("ownerEra[{i}].bonus"),
            got.bonus_surowce_na_budynek,
            want.bonus_surowce_na_budynek,
        );
    }
}

/// Rownosc z tolerancja w ulpach dla wartosci skonczonych; NaN/Inf musza byc identyczne klasa.
fn assert_within_ulps(label: &str, got: f64, want: f64, max_ulps: u64) {
    if !want.is_finite() || !got.is_finite() {
        assert!(same(got, want), "{label}: got {got:?}, web {want:?}");
        return;
    }
    let ulps = (got.to_bits() as i64 - want.to_bits() as i64).unsigned_abs();
    assert!(
        ulps <= max_ulps,
        "{label}: {ulps} ulp (got {got:?}, web {want:?})"
    );
}

/// Epoka ulamkowa > 1: `2^(e-1)` liczone przez `powf` (Rust, libm) rozni sie o 1 ulp od `Math.pow`
/// (V8, fdlibm) dla czesci wartosci. Epoka gry jest calkowita, wiec wektory calkowite sa asercja BITOWA;
/// ulamkowe sa liczone osobno w [`known_fractional_era_pow_gap`] (jawna, ograniczona rozbieznosc).
fn is_fractional_era_above_one(era: f64) -> bool {
    era.is_finite() && era > 1.0 && era.fract() != 0.0
}

/// Mnoznik epoki magazynu jest REUZYTY z `city_growth::p6_7a` (bez duplikatu); wektor sprawdza zgodnosc
/// bitowa dla epok calkowitych oraz `known_fractional_era_pow_gap` dla ulamkowych.
#[test]
fn magazyn_era_multiplier_reused_matches_web() {
    let v = vectors();
    for (i, c) in arr(&v, "magazynEra").iter().enumerate() {
        let era = num(&c["era"]);
        if is_fractional_era_above_one(era) {
            continue;
        }
        assert_same(
            &format!("magazynEra[{i}]"),
            magazyn_era_multiplier(era),
            num(&c["out"]),
        );
    }
}

/// Jawna lista znanej rozbieznosci (P6.7A `magazyn_era_multiplier`, nie P6.8E): dla epoki ulamkowej
/// Rust `powf` vs web `Math.pow` - max 1 ulp. Test wymusza, by rozbieznosc byla co najwyzej 1 ulp.
#[test]
fn known_fractional_era_pow_gap() {
    let v = vectors();
    let mut rows = 0usize;
    for c in arr(&v, "magazynEra") {
        let era = num(&c["era"]);
        if !is_fractional_era_above_one(era) {
            continue;
        }
        rows += 1;
        let got = magazyn_era_multiplier(era);
        let want = num(&c["out"]);
        let ulps = (got.to_bits() as i64 - want.to_bits() as i64).unsigned_abs();
        assert!(
            ulps <= 1,
            "epoka {era}: roznica {ulps} ulp (got {got:?}, web {want:?})"
        );
    }
    assert!(rows > 0, "brak wektorow epok ulamkowych");
}

#[test]
fn owner_capped_key_membership_matches_web() {
    let v = vectors();
    for c in arr(&v, "keyCases") {
        let key = c["key"].as_str().unwrap();
        let want = c["out"].as_bool().unwrap();
        assert_eq!(eu::is_owner_capped_resource_key(key), want, "klucz {key:?}");
    }
}

#[test]
fn reconcile_owner_caps_matches_web() {
    let v = vectors();
    for (i, c) in arr(&v, "recon").iter().enumerate() {
        let mut cities: Vec<eu::CityResourceHolder> = c["cities"]
            .as_array()
            .unwrap()
            .iter()
            .map(|city| eu::CityResourceHolder {
                id: city["id"].as_str().unwrap().to_string(),
                owner_id: city["ownerId"].as_i64().unwrap(),
                surowce: city.get("surowce").map(map_from),
            })
            .collect();
        let caps: BTreeMap<i64, f64> = c["cap"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, x)| (k.parse::<i64>().expect("klucz wlasciciela"), num(x)))
            .collect();
        eu::reconcile_owner_resource_caps(&mut cities, |owner| caps.get(&owner).copied());
        let want = arr(c, "out");
        assert_eq!(cities.len(), want.len(), "recon[{i}] liczba miast");
        for (j, (got, w)) in cities.iter().zip(want).enumerate() {
            let label = format!("recon[{i}].city[{j}]");
            assert_eq!(got.id, w["id"].as_str().unwrap(), "{label} id");
            assert_eq!(
                got.owner_id,
                w["ownerId"].as_i64().unwrap(),
                "{label} owner"
            );
            match (&got.surowce, w.get("surowce")) {
                (None, None) => {}
                (Some(g), Some(ws)) => assert_map(&label, g, ws),
                (g, ws) => panic!("{label}: obecnosc surowce rozna: {g:?} vs {ws:?}"),
            }
        }
    }
}
