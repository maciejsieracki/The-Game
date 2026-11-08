//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1 (runda 3): zgodnosc `diplomacy_multiwar_peace.rs` z URUCHOMIONYM
//! webem (pin `origin/main` a61337844). Wektory: `tests/p6_dyplo_multiwar_gates_data/peace.json`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1/gen-multiwar-vectors.cjs`
//! (sekcja 4: `planPeacePayment`, `planEscalatedPeacePayment`, `stepPairState` z prawdziwych plikow weba).
//! Liczby: `String(x)`; NaN porownywane jako NaN; -0 == 0.

use civ_engine::domain::diplomacy_multiwar_peace::*;
use serde_json::Value;

const PEACE: &str = include_str!("p6_dyplo_multiwar_gates_data/peace.json");

/// Liczba jako JSON-number lub `String(x)`.
fn num(v: &Value) -> f64 {
    if let Some(f) = v.as_f64() {
        return f;
    }
    let s = v
        .as_str()
        .unwrap_or_else(|| panic!("liczba oczekiwana, jest {v}"));
    match s {
        "NaN" | "undefined" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        _ => s
            .parse::<f64>()
            .unwrap_or_else(|_| panic!("nie liczba: {s}")),
    }
}

fn same(actual: f64, expected: &Value, ctx: &str) {
    let e = num(expected);
    if e.is_nan() {
        assert!(actual.is_nan(), "{ctx}: oczekiwano NaN, jest {actual}");
    } else {
        assert!(actual == e, "{ctx}: oczekiwano {e}, jest {actual}");
    }
}

fn kind_of(s: &str) -> PeaceAssetKind {
    match s {
        "zloto" => PeaceAssetKind::Zloto,
        "surowiec_ilosc" => PeaceAssetKind::SurowiecIlosc,
        "miasto" => PeaceAssetKind::Miasto,
        other => panic!("nieznany rodzaj {other}"),
    }
}

fn assets_of(sets: &Value, name: &str) -> Vec<PeaceAsset> {
    sets[name]
        .as_array()
        .unwrap_or_else(|| panic!("brak zestawu {name}"))
        .iter()
        .map(|a| PeaceAsset {
            kind: kind_of(a["kind"].as_str().unwrap()),
            id: a["id"].as_str().unwrap().to_string(),
            amount: num(&a["amount"]),
            pn: num(&a["pn"]),
            forbidden: a
                .get("forbidden")
                .and_then(|f| f.as_bool())
                .unwrap_or(false),
        })
        .collect()
}

fn check_plan(plan: &PeacePaymentPlan, out: &Value, ctx: &str) {
    let items = out["items"].as_array().unwrap();
    assert_eq!(plan.items.len(), items.len(), "{ctx}: liczba pozycji");
    for (i, (got, exp)) in plan.items.iter().zip(items.iter()).enumerate() {
        let c = format!("{ctx} item[{i}]");
        assert_eq!(
            got.kind,
            kind_of(exp["kind"].as_str().unwrap()),
            "{c}: rodzaj"
        );
        assert_eq!(got.id, exp["id"].as_str().unwrap(), "{c}: id");
        same(got.amount, &exp["amount"], &format!("{c}: amount"));
        same(got.pn, &exp["pn"], &format!("{c}: pn"));
    }
    same(
        plan.covered_pn,
        &out["coveredPn"],
        &format!("{ctx}: coveredPn"),
    );
    same(
        plan.shortfall_pn,
        &out["shortfallPn"],
        &format!("{ctx}: shortfallPn"),
    );
    assert_eq!(plan.full, out["full"].as_bool().unwrap(), "{ctx}: full");
    let h = &out["histogram"];
    assert_eq!(
        plan.histogram.zloto,
        num(&h["zloto"]) as i64,
        "{ctx}: hist zloto"
    );
    assert_eq!(
        plan.histogram.surowiec_ilosc,
        num(&h["surowiec_ilosc"]) as i64,
        "{ctx}: hist surowiec"
    );
    assert_eq!(
        plan.histogram.miasto,
        num(&h["miasto"]) as i64,
        "{ctx}: hist miasto"
    );
}

fn vectors() -> Value {
    serde_json::from_str(PEACE).expect("peace.json musi sie parsowac")
}

#[test]
fn plan_peace_payment_matches_web() {
    let v = vectors();
    let mut n = 0;
    for c in v["payment"].as_array().unwrap() {
        if c["fn"] != "planPeacePayment" {
            continue;
        }
        let set = c["set"].as_str().unwrap();
        let assets = assets_of(&v["sets"], set);
        let req = num(&c["in"]["requiredPn"]);
        let plan = plan_peace_payment(req, &assets);
        check_plan(&plan, &c["out"], &format!("planPeacePayment[{set}, {req}]"));
        n += 1;
    }
    assert!(n >= 60, "za malo wektorow planPeacePayment: {n}");
}

#[test]
fn plan_escalated_peace_payment_matches_web() {
    let v = vectors();
    let mut n = 0;
    for c in v["payment"].as_array().unwrap() {
        if c["fn"] != "planEscalatedPeacePayment" {
            continue;
        }
        let set = c["set"].as_str().unwrap();
        let assets = assets_of(&v["sets"], set);
        let req = num(&c["in"]["requiredPn"]);
        let mc = num(&c["in"]["maxCities"]);
        let plan = plan_escalated_peace_payment(req, &assets, mc);
        check_plan(
            &plan,
            &c["out"],
            &format!("planEscalatedPeacePayment[{set}, {req}, {mc}]"),
        );
        n += 1;
    }
    assert!(n >= 200, "za malo wektorow planEscalatedPeacePayment: {n}");
}

#[test]
fn step_pair_state_matches_web() {
    let v = vectors();
    let mut seqs = 0;
    for sq in v["stepPairState"].as_array().unwrap() {
        let mut store: WarWearinessStore = Default::default();
        for e in sq["init"].as_array().unwrap() {
            store.insert(
                e["key"].as_str().unwrap().to_string(),
                WarWearinessPairState {
                    war_start: num(&e["warStart"]),
                    peak: num(&e["peak"]),
                    stage: num(&e["stage"]) as i64,
                    rejected_offers: num(&e["rejectedOffers"]) as i64,
                    last_offer_turn: num(&e["lastOfferTurn"]),
                },
            );
        }
        for (i, s) in sq["steps"].as_array().unwrap().iter().enumerate() {
            let ctx = format!("stepPairState seq{seqs} krok{i}");
            let st = step_pair_state(
                &mut store,
                s["key"].as_str().unwrap(),
                num(&s["warStart"]),
                num(&s["level"]),
            );
            let o = &s["out"];
            same(st.war_start, &o["warStart"], &format!("{ctx}: warStart"));
            same(st.peak, &o["peak"], &format!("{ctx}: peak"));
            assert_eq!(st.stage, num(&o["stage"]) as i64, "{ctx}: stage");
            assert_eq!(
                st.rejected_offers,
                num(&o["rejectedOffers"]) as i64,
                "{ctx}: rejectedOffers"
            );
            same(
                st.last_offer_turn,
                &o["lastOfferTurn"],
                &format!("{ctx}: lastOfferTurn"),
            );
        }
        seqs += 1;
    }
    assert_eq!(seqs, 3);
}
