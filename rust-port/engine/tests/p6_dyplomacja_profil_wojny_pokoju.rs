//! R-RUSTPORT-P6-DYPLOMACJA-PROFIL-WOJNY-POKOJU-Q1: zgodnosc `diplomacy_war_peace_profile.rs`
//! z URUCHOMIONYM webem (pin `23dd158e9`). Wektory generuje
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-PROFIL-WOJNY-POKOJU-Q1/gen-p6-dypl2-vectors.mjs`
//! (esbuild z `git archive 23dd158e9`). Liczby w wektorach to `String(x)` (NaN / Infinity / "-0"
//! zachowane); porownanie BITOWE (NaN == NaN, -0 != 0). `undefined` na wejsciu = NaN (generator
//! sprawdza rownowaznosc po stronie weba).

use std::collections::BTreeMap;

use civ_engine::domain::diplomacy_war_peace_profile::*;
use serde_json::Value;

const PROFILE: &str = include_str!("p6_dyplomacja_profil_wojny_pokoju_vectors/profile.json");
const WEARINESS: &str = include_str!("p6_dyplomacja_profil_wojny_pokoju_vectors/weariness.json");
const RECORD: &str = include_str!("p6_dyplomacja_profil_wojny_pokoju_vectors/record.json");
const BRAKE: &str = include_str!("p6_dyplomacja_profil_wojny_pokoju_vectors/brake.json");
const SIGNALS: &str = include_str!("p6_dyplomacja_profil_wojny_pokoju_vectors/signals.json");
const PRICE: &str = include_str!("p6_dyplomacja_profil_wojny_pokoju_vectors/price.json");
const GATE: &str = include_str!("p6_dyplomacja_profil_wojny_pokoju_vectors/gate.json");
const MAIN: &str = include_str!("p6_dyplomacja_profil_wojny_pokoju_vectors/main_cores.json");

fn load(s: &str) -> Value {
    serde_json::from_str(s).expect("wektory musza sie parsowac")
}

/// `String(x)` -> f64; "undefined" -> NaN.
fn n(v: &Value) -> f64 {
    let s = v
        .as_str()
        .unwrap_or_else(|| panic!("liczba jako ciag, jest {v}"));
    if s == "undefined" {
        return f64::NAN;
    }
    s.parse::<f64>()
        .unwrap_or_else(|_| panic!("nie liczba: {s}"))
}

fn on(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(n(v))
    }
}

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

fn assert_same(a: f64, b: f64, ctx: &str) {
    assert!(same(a, b), "{ctx}: rust={a:?} web={b:?}");
}

fn assert_opt(a: Option<f64>, b: Option<f64>, ctx: &str) {
    match (a, b) {
        (None, None) => {}
        (Some(x), Some(y)) => assert_same(x, y, ctx),
        _ => panic!("{ctx}: rust={a:?} web={b:?}"),
    }
}

/// Liscie-ciagi liczb -> liczby JSON (pomija klucze `_*`), potem `WarPeaceParams`.
fn numify(v: &Value) -> Value {
    match v {
        Value::String(_) => {
            let f = n(v);
            serde_json::Number::from_f64(f).map(Value::Number).unwrap()
        }
        Value::Object(m) => Value::Object(
            m.iter()
                .filter(|(k, _)| !k.starts_with('_'))
                .map(|(k, x)| (k.clone(), numify(x)))
                .collect(),
        ),
        other => other.clone(),
    }
}

fn paramsets(d: &Value) -> Vec<WarPeaceParams> {
    d["paramsets"]
        .as_array()
        .unwrap()
        .iter()
        .map(|p| serde_json::from_value(numify(p)).expect("params"))
        .collect()
}

fn pf_from(v: &Value) -> WarPeaceProfile {
    let a = v.as_array().unwrap();
    WarPeaceProfile {
        civ_key: a[0].as_str().map(|s| s.to_string()),
        has_data: a[1].as_bool().unwrap(),
        agresywnosc: n(&a[2]),
        ekspansywnosc: n(&a[3]),
        sklonnosc_podboju: n(&a[4]),
        tolerancja_ryzyka: n(&a[5]),
        prog_wojny_macierz: n(&a[6]),
        profil_obronny: a[7].as_bool().unwrap(),
        prog_wojny_relacji: n(&a[8]),
        prog_pokoj_slabosc: n(&a[9]),
        prog_krytyczny: n(&a[10]),
        prog_zdrowia: n(&a[11]),
        min_tur_wojny: n(&a[12]),
        zmeczenie_t: n(&a[13]),
        hamulec_n: n(&a[14]),
    }
}

fn assert_profile(got: &WarPeaceProfile, want: &WarPeaceProfile, ctx: &str) {
    assert_eq!(got.civ_key, want.civ_key, "{ctx}: civ_key");
    assert_eq!(got.has_data, want.has_data, "{ctx}: has_data");
    assert_eq!(
        got.profil_obronny, want.profil_obronny,
        "{ctx}: profil_obronny"
    );
    for (name, g, w) in [
        ("agresywnosc", got.agresywnosc, want.agresywnosc),
        ("ekspansywnosc", got.ekspansywnosc, want.ekspansywnosc),
        (
            "sklonnosc_podboju",
            got.sklonnosc_podboju,
            want.sklonnosc_podboju,
        ),
        (
            "tolerancja_ryzyka",
            got.tolerancja_ryzyka,
            want.tolerancja_ryzyka,
        ),
        (
            "prog_wojny_macierz",
            got.prog_wojny_macierz,
            want.prog_wojny_macierz,
        ),
        (
            "prog_wojny_relacji",
            got.prog_wojny_relacji,
            want.prog_wojny_relacji,
        ),
        (
            "prog_pokoj_slabosc",
            got.prog_pokoj_slabosc,
            want.prog_pokoj_slabosc,
        ),
        ("prog_krytyczny", got.prog_krytyczny, want.prog_krytyczny),
        ("prog_zdrowia", got.prog_zdrowia, want.prog_zdrowia),
        ("min_tur_wojny", got.min_tur_wojny, want.min_tur_wojny),
        ("zmeczenie_t", got.zmeczenie_t, want.zmeczenie_t),
        ("hamulec_n", got.hamulec_n, want.hamulec_n),
    ] {
        assert_same(g, w, &format!("{ctx}: {name}"));
    }
}

fn syn_rows(d: &Value) -> Vec<MatrixRowLite> {
    d["synRows"]
        .as_array()
        .unwrap()
        .iter()
        .map(|r| MatrixRowLite {
            typ_cywilizacji: r["typ"].as_str().unwrap().to_string(),
            cywilizacja: r["cyw"].as_str().unwrap().to_string(),
            ikona_id: r["ikona"].as_str().unwrap().to_string(),
            params: r["params"]
                .as_object()
                .unwrap()
                .iter()
                .map(|(k, v)| (k.clone(), n(v)))
                .collect(),
        })
        .collect()
}

/// Wartosc `wartosc` wariantu ai-params: indeks wariantu -> `Option<f64>` (jak `typeof number`).
fn ai_value(d: &Value, idx: usize) -> Option<f64> {
    let v = &d["aiVariants"][idx];
    let raw = v[1].as_str().unwrap();
    match raw {
        "REAL" => embedded_zdrowie_ai_value(),
        "MISSING" | "NOENTRY" | "null" | "true" | "\"0.5\"" => None,
        other => Some(other.replace("1e999", "inf").parse::<f64>().unwrap()),
    }
}

#[test]
fn profil_zgodny_z_webem() {
    let d = load(PROFILE);
    let ps = paramsets(&d);
    let syn = syn_rows(&d);
    let mut checked = 0usize;
    for (i, c) in d["cases"].as_array().unwrap().iter().enumerate() {
        let p = &ps[c["p"].as_u64().unwrap() as usize];
        let key: Option<&str> = c["k"].as_str();
        let ai = ai_value(&d, c["ai"].as_u64().unwrap() as usize);
        let rows: &[MatrixRowLite] = if c["m"].as_i64().unwrap() < 0 {
            embedded_matrix_rows()
        } else {
            &syn
        };
        let want = pf_from(&c["out"]);
        let got = resolve_war_peace_profile_with(key, p, rows, ai);
        assert_profile(&got, &want, &format!("profil #{i} key={key:?} ai={ai:?}"));
        // sciezka osadzona (macierz i ai-params z danych Rust) tam, gdzie wariant = rzeczywiste dane
        if c["m"].as_i64().unwrap() < 0 && c["ai"].as_u64().unwrap() == 0 {
            let got2 = resolve_war_peace_profile(key, p);
            assert_profile(&got2, &want, &format!("profil osadzony #{i} key={key:?}"));
        }
        checked += 1;
    }
    assert!(checked > 3000, "za malo wektorow profilu: {checked}");
}

#[test]
fn zdrowie_baza_wartosc_ai_i_dane_osadzone() {
    let p = war_peace_params();
    assert_eq!(embedded_zdrowie_ai_value(), Some(0.4));
    assert_eq!(zdrowie_baza_z_ai_params(p), 0.4);
    assert_eq!(zdrowie_baza_z_ai_params_value(None, p), p.prog_zdrowia.baza);
    assert_eq!(
        zdrowie_baza_z_ai_params_value(Some(f64::NAN), p),
        p.prog_zdrowia.baza
    );
    assert_eq!(
        zdrowie_baza_z_ai_params_value(Some(f64::INFINITY), p),
        p.prog_zdrowia.baza
    );
    assert_eq!(zdrowie_baza_z_ai_params_value(Some(0.9), p), 0.9);
    assert_eq!(war_weariness_max_share(), 0.5);
    assert_eq!(ZDROWIE_AI_PARAM_KEY, "dyplomacja_zdrowie_armii_pokój");
}

#[test]
fn zmeczenie_zgodne_z_webem() {
    let d = load(WEARINESS);
    assert_same(war_weariness_max_share(), n(&d["maxShare"]), "maxShare");
    for c in d["cases"].as_array().unwrap() {
        let (t, tt) = (n(&c[0]), n(&c[1]));
        assert_same(
            war_weariness_fraction(t, tt),
            n(&c[2]),
            &format!("fraction t={t} T={tt}"),
        );
        assert_same(
            war_weariness_share(t, tt),
            n(&c[3]),
            &format!("share t={t} T={tt}"),
        );
    }
}

fn rec_from(v: &Value) -> Option<WarCityRecord> {
    if v.is_null() {
        return None;
    }
    Some(WarCityRecord {
        od: n(&v["od"]),
        utraty: v["u"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, x)| (k.clone(), n(x)))
            .collect::<BTreeMap<_, _>>(),
        ostatnia_tura: on(&v["o"]),
    })
}

fn assert_rec(got: &WarCityRecord, want: &WarCityRecord, ctx: &str) {
    assert_same(got.od, want.od, &format!("{ctx}: od"));
    assert_opt(
        got.ostatnia_tura,
        want.ostatnia_tura,
        &format!("{ctx}: ostatnia_tura"),
    );
    assert_eq!(
        got.utraty.keys().collect::<Vec<_>>(),
        want.utraty.keys().collect::<Vec<_>>(),
        "{ctx}: klucze utrat"
    );
    for (k, v) in &got.utraty {
        assert_same(*v, want.utraty[k], &format!("{ctx}: utraty[{k}]"));
    }
}

#[test]
fn rejestr_utraconych_miast_zgodny_z_webem() {
    let d = load(RECORD);
    let (mut nl, mut ns) = (0, 0);
    for (i, c) in d["cases"].as_array().unwrap().iter().enumerate() {
        let prev = rec_from(&c["prev"]);
        let od = n(&c["od"]);
        let key = c["key"].as_str().unwrap();
        let turn = n(&c["turn"]);
        match c["kind"].as_str().unwrap() {
            "loss" => {
                let got = record_war_city_loss(prev.as_ref(), od, key, turn);
                assert_rec(&got, &rec_from(&c["out"]).unwrap(), &format!("loss #{i}"));
                nl += 1;
            }
            _ => {
                let got = war_state_from_record(prev.as_ref(), od, key, turn);
                let o = &c["out"];
                assert_same(
                    got.turns_at_war,
                    n(&o[0]),
                    &format!("state #{i} turnsAtWar"),
                );
                assert_same(got.lost_cities, n(&o[1]), &format!("state #{i} lostCities"));
                assert_same(
                    got.turns_since_city_change,
                    n(&o[2]),
                    &format!("state #{i} since"),
                );
                ns += 1;
            }
        }
    }
    assert!(nl >= 3000 && ns >= 3000, "{nl} {ns}");
}

#[test]
fn prog_kryzysu_hamulca_zgodny_z_webem() {
    let d = load(BRAKE);
    let ps = paramsets(&load(SIGNALS));
    for c in d["cases"].as_array().unwrap() {
        let p = &ps[c["p"].as_u64().unwrap() as usize];
        let x = n(&c["x"]);
        assert_same(
            brake_relation_threshold(x, p),
            n(&c["out"]),
            &format!("brake x={x}"),
        );
    }
}

#[test]
fn sygnaly_pokoju_zgodne_z_webem() {
    let d = load(SIGNALS);
    let ps = paramsets(&d);
    let mut with_c = 0usize;
    let mut with_empty = 0usize;
    for (i, c) in d["cases"].as_array().unwrap().iter().enumerate() {
        let p = &ps[c["p"].as_u64().unwrap() as usize];
        let pf = pf_from(&c["pf"]);
        let a = c["in"].as_array().unwrap();
        let input = PeaceSignalInput {
            rw: n(&a[0]),
            turns_at_war: n(&a[1]),
            lost_cities_in_war: n(&a[2]),
            turns_since_city_change: on(&a[3]),
            army_health_share: on(&a[4]),
        };
        let got = ai_peace_signals(&input, &pf, p);
        let want_wants = c["out"][0].as_bool().unwrap();
        let want_reasons: Vec<&str> = c["out"][1]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap())
            .collect();
        assert_eq!(got.wants_peace, want_wants, "sygnaly #{i} wants");
        assert_eq!(got.reasons, want_reasons, "sygnaly #{i} reasons {input:?}");
        if want_reasons.contains(&"c") {
            with_c += 1;
        }
        if want_reasons.is_empty() {
            with_empty += 1;
        }
    }
    assert!(
        with_c > 100 && with_empty > 100,
        "pokrycie: c={with_c} puste={with_empty}"
    );
}

#[test]
fn ceny_pokoju_zgodne_z_webem() {
    let d = load(PRICE);
    let ps = paramsets(&d);
    for (i, c) in d["cases"].as_array().unwrap().iter().enumerate() {
        let p = &ps[c["p"].as_u64().unwrap() as usize];
        let want = n(&c["out"]);
        match c["k"].as_str().unwrap() {
            "s" => assert_same(
                peace_strength_price_multiplier(n(&c["rw"]), p),
                want,
                &format!("sila #{i} rw={}", c["rw"]),
            ),
            _ => assert_same(
                peace_civ_price_multiplier(&pf_from(&c["pf"]), p),
                want,
                &format!("cyw #{i}"),
            ),
        }
    }
}

#[test]
fn bramka_pokoju_ai_zgodna_z_webem() {
    let d = load(GATE);
    let ps = paramsets(&d);
    let (mut ok, mut early, mut strong) = (0, 0, 0);
    for (i, c) in d["cases"].as_array().unwrap().iter().enumerate() {
        let p = &ps[c["p"].as_u64().unwrap() as usize];
        let pf = pf_from(&c["pf"]);
        let a = c["in"].as_array().unwrap();
        let input = PeaceAiGateInput {
            rw: n(&a[0]),
            turns_at_war: n(&a[1]),
            lost_cities_in_war: n(&a[2]),
        };
        assert_eq!(
            is_feeling_stronger(&input, p),
            c["fs"].as_bool().unwrap(),
            "czuje sie silniejsze #{i} {input:?}"
        );
        let got = evaluate_peace_ai_gate(&input, &pf, p);
        let o = &c["out"];
        let verdict = match o[0].as_str().unwrap() {
            "ok" => {
                ok += 1;
                PeaceGateVerdict::Ok
            }
            "too_early" => {
                early += 1;
                PeaceGateVerdict::TooEarly
            }
            "stronger" => {
                strong += 1;
                PeaceGateVerdict::Stronger
            }
            other => panic!("nieznany werdykt {other}"),
        };
        assert_eq!(got.verdict, verdict, "bramka #{i} werdykt {input:?}");
        assert_same(
            got.price_multiplier,
            n(&o[1]),
            &format!("bramka #{i} mnoznik"),
        );
        assert_eq!(got.reason.as_deref(), o[2].as_str(), "bramka #{i} reason");
    }
    assert!(
        ok > 1000 && early > 1000 && strong > 100,
        "{ok} {early} {strong}"
    );
}

#[test]
fn rdzenie_main_ts_zgodne_z_webem() {
    let d = load(MAIN);
    let ps = paramsets(&d);
    let mut counts = BTreeMap::<String, usize>::new();
    for (i, c) in d["cases"].as_array().unwrap().iter().enumerate() {
        let kind = c["k"].as_str().unwrap().to_string();
        *counts.entry(kind.clone()).or_default() += 1;
        match kind.as_str() {
            "army" => {
                let units: Vec<ArmyHealthUnit> = c["units"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|u| ArmyHealthUnit {
                        owner_id: u[0].as_i64().unwrap(),
                        civilian: u[1].as_bool().unwrap(),
                        max_hp: n(&u[2]),
                        hp: on(&u[3]),
                    })
                    .collect();
                let got = army_health_share(&units, c["owner"].as_i64().unwrap());
                assert_opt(got, on(&c["out"]), &format!("army #{i}"));
            }
            "wsf" => {
                let rec = rec_from(&c["rec"]);
                let (st, stamp) = war_state_for_pair(
                    c["atWar"].as_bool().unwrap(),
                    on(&c["stamp"]),
                    rec.as_ref(),
                    c["key"].as_str().unwrap(),
                    n(&c["turn"]),
                );
                let o = &c["out"];
                assert_same(st.turns_at_war, n(&o[0]), &format!("wsf #{i} t"));
                assert_same(st.lost_cities, n(&o[1]), &format!("wsf #{i} l"));
                assert_same(st.turns_since_city_change, n(&o[2]), &format!("wsf #{i} s"));
                assert_opt(stamp, on(&o[3]), &format!("wsf #{i} stamp"));
            }
            "rel" => {
                let mut called = false;
                let st = WarState {
                    turns_at_war: n(&c["t"]),
                    lost_cities: 2.0,
                    turns_since_city_change: 3.0,
                };
                let h = on(&c["h"]);
                let r = rel_war_fields(st, || {
                    called = true;
                    h
                });
                assert_eq!(called, c["called"].as_bool().unwrap(), "rel #{i} leniwosc");
                let o = &c["out"];
                assert_same(r.turns_at_war, n(&o[0]), "rel t");
                assert_same(r.lost_cities_in_war, n(&o[1]), "rel l");
                assert_same(r.turns_since_city_change, n(&o[2]), "rel s");
                assert_opt(r.army_health_share, on(&o[3]), "rel h");
            }
            "pws" => {
                let st = WarState {
                    turns_at_war: 4.0,
                    lost_cities: 1.0,
                    turns_since_city_change: 2.0,
                };
                let got = proposal_war_state(c["atWar"].as_bool().unwrap(), st, n(&c["rw"]));
                match (&got, c["out"].is_null()) {
                    (None, true) => {}
                    (Some(g), false) => {
                        let o = &c["out"];
                        assert_same(g.turns_at_war, n(&o[0]), "pws t");
                        assert_same(g.lost_cities_responder, n(&o[1]), "pws l");
                        assert_same(g.turns_since_city_change, n(&o[2]), "pws s");
                        assert_same(g.responder_rw, n(&o[3]), "pws rw");
                    }
                    _ => panic!("pws #{i}: {got:?} vs {}", c["out"]),
                }
            }
            "brk" => {
                let p = &ps[c["p"].as_u64().unwrap() as usize];
                let (prog, nn) = brake_war_params(&pf_from(&c["a"]), &pf_from(&c["b"]), p);
                assert_same(prog, n(&c["out"][0]), &format!("brk #{i} prog"));
                assert_same(nn, n(&c["out"][1]), &format!("brk #{i} n"));
            }
            other => panic!("nieznany rodzaj {other}"),
        }
    }
    for k in ["army", "wsf", "rel", "pws", "brk"] {
        assert!(counts.get(k).copied().unwrap_or(0) > 0, "brak wektorow {k}");
    }
}

#[test]
fn dane_osadzone_rowne_pinowi_i_przyklady_z_opisu_jsona() {
    // JSON opisuje przyklady: po premii obronnej Zulusi 0.33, Chinczycy 0.54 (`_zalozenie_premiaProfilObronny`).
    let p = war_peace_params();
    assert_eq!(p.prog_pokoj_slabosc.premia_profil_obronny, 0.05);
    let zulus = resolve_war_peace_profile(Some("zulusi"), p);
    let chin = resolve_war_peace_profile(Some("chinczycy"), p);
    assert!(zulus.has_data && chin.has_data);
    let r2 = |x: f64| (x * 100.0).round() / 100.0;
    assert_eq!(r2(zulus.prog_pokoj_slabosc), 0.33);
    assert_eq!(r2(chin.prog_pokoj_slabosc), 0.54);
    // gracz / nieznany = wartosci bazowe z JSON
    let none = resolve_war_peace_profile(None, p);
    assert!(!none.has_data);
    assert_eq!(none.civ_key, None);
    assert_eq!(none.prog_wojny_relacji, 30.0);
    assert_eq!(none.hamulec_n, 6.0); // round(8 - 0.5*5) = round(5.5) = 6
    assert_eq!(
        resolve_war_peace_profile(Some(""), p).civ_key.as_deref(),
        Some("")
    );
}
