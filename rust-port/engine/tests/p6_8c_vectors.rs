//! P6.8C (pin webu 91dc998a): porownanie Rust z WEKTORAMI z URUCHOMIONEGO weba dla symboli
//! production.ts 1253-1976: frontItem, etaTurns, buildingWorkPerTurn, unitRecruitmentCapacityPerTurn,
//! enqueue, forfeitedProgressForIndex, bank/withdraw postepBudynkowUsuniete, sanitizeBuildQueue,
//! dequeue, filterQueue, promoteToFront, insertAtFront, advanceProduction.
//!
//! Wektory: `tests/p6_8c_vectors/p8c.json`, generowane przez
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-8C-PRODUKCJA-KOLEJKA-Q1/gen-p6-8c-vectors.mjs`
//! (Node 22 + loader TS: PRAWDZIWE production.ts z pinu 91dc998a).
//!
//! Kodowanie: calkowita |x|<=2^53 = JSON number; inna skonczona = {"$f": "..."};
//! NaN/Infinity/-Infinity/-0 = {"$n": "..."}; nieobecne pole = {"absent": true}; null = null.

use std::collections::BTreeMap;

use civ_engine::domain::production_queue::{
    advance_production, bank_removed_building_progress, building_work_per_turn, dequeue, enqueue,
    eta_turns, filter_queue, forfeited_progress_for_index, front_item, insert_at_front,
    promote_to_front, sanitize_build_queue, unit_recruitment_capacity_per_turn,
    withdraw_banked_building_progress, PostepBudynkowUsuniete,
};
use civ_engine::domain::production_units::{CityProduction, ProductionItem, ProductionKind};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_8c_vectors/p8c.json");

fn dec_num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::Object(o) => {
            if let Some(s) = o.get("$f") {
                s.as_str().expect("$f").parse::<f64>().expect("$f parse")
            } else if let Some(s) = o.get("$n") {
                match s.as_str().expect("$n") {
                    "NaN" => f64::NAN,
                    "Infinity" => f64::INFINITY,
                    "-Infinity" => f64::NEG_INFINITY,
                    "-0" => -0.0,
                    other => panic!("nieznane $n: {other}"),
                }
            } else {
                panic!("oczekiwano liczby, dostalem obiekt {o:?}")
            }
        }
        other => panic!("oczekiwano liczby: {other:?}"),
    }
}

fn is_absent(v: Option<&Value>) -> bool {
    match v {
        None => true,
        Some(Value::Object(o)) => o.get("absent").is_some(),
        _ => false,
    }
}

/// Parametr opcjonalny: nieobecny = `None` (wolajacy podstawia web-domyslne 0).
fn dec_arg(v: Option<&Value>) -> Option<f64> {
    if is_absent(v) {
        None
    } else {
        Some(dec_num(v.expect("arg")))
    }
}

fn dec_item(v: &Value) -> ProductionItem {
    let kind = match v["kind"].as_str().expect("kind") {
        "budynek" => ProductionKind::Budynek,
        "jednostka" => ProductionKind::Jednostka,
        other => panic!("kind {other}"),
    };
    ProductionItem {
        kind,
        id: v["id"].as_str().expect("id").to_string(),
        nazwa: v["nazwa"].as_str().expect("nazwa").to_string(),
        koszt: dec_num(&v["koszt"]),
        postep: if is_absent(v.get("postep")) {
            None
        } else {
            Some(dec_num(&v["postep"]))
        },
        is_general: v.get("isGeneral").and_then(Value::as_bool),
    }
}

fn dec_queue(v: &Value) -> Vec<ProductionItem> {
    v.as_array()
        .expect("kolejka")
        .iter()
        .map(dec_item)
        .collect()
}

fn dec_prod(v: &Value) -> CityProduction {
    CityProduction {
        kolejka: dec_queue(&v["kolejka"]),
        postep: dec_num(&v["postep"]),
        wstrzymana: v.get("wstrzymana").and_then(Value::as_bool),
        rekrutacja: if is_absent(v.get("rekrutacja")) {
            None
        } else {
            Some(dec_queue(&v["rekrutacja"]))
        },
    }
}

fn dec_opt_item(v: &Value) -> Option<ProductionItem> {
    if v.is_null() {
        None
    } else {
        Some(dec_item(v))
    }
}

/// `{"map": ...}` -> `None` gdy pole `postepBudynkowUsuniete` nieobecne (web `undefined`).
fn dec_map(v: &Value) -> Option<PostepBudynkowUsuniete> {
    if is_absent(Some(v)) {
        return None;
    }
    let o = v.as_object().expect("mapa");
    Some(o.iter().map(|(k, x)| (k.clone(), dec_num(x))).collect())
}

fn feq(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

fn feq_opt(a: Option<f64>, b: Option<f64>) -> bool {
    match (a, b) {
        (None, None) => true,
        (Some(x), Some(y)) => feq(x, y),
        _ => false,
    }
}

fn eq_item(a: &ProductionItem, b: &ProductionItem) -> bool {
    a.kind == b.kind
        && a.id == b.id
        && a.nazwa == b.nazwa
        && feq(a.koszt, b.koszt)
        && feq_opt(a.postep, b.postep)
        && a.is_general == b.is_general
}

fn eq_opt_item(a: &Option<ProductionItem>, b: &Option<ProductionItem>) -> bool {
    match (a, b) {
        (None, None) => true,
        (Some(x), Some(y)) => eq_item(x, y),
        _ => false,
    }
}

fn eq_queue(a: &[ProductionItem], b: &[ProductionItem]) -> bool {
    a.len() == b.len() && a.iter().zip(b).all(|(x, y)| eq_item(x, y))
}

fn eq_prod(a: &CityProduction, b: &CityProduction) -> bool {
    eq_queue(&a.kolejka, &b.kolejka)
        && feq(a.postep, b.postep)
        && a.wstrzymana == b.wstrzymana
        && match (&a.rekrutacja, &b.rekrutacja) {
            (None, None) => true,
            (Some(x), Some(y)) => eq_queue(x, y),
            _ => false,
        }
}

fn eq_map(a: &Option<PostepBudynkowUsuniete>, b: &Option<PostepBudynkowUsuniete>) -> bool {
    match (a, b) {
        (None, None) => true,
        (Some(x), Some(y)) => {
            x.len() == y.len() && x.iter().all(|(k, v)| y.get(k).is_some_and(|w| feq(*v, *w)))
        }
        _ => false,
    }
}

fn load() -> Vec<Value> {
    let root: Value = serde_json::from_str(VECTORS).expect("wektor JSON P8C");
    assert_eq!(root["pin"].as_str(), Some("91dc998a"));
    root["cases"].as_array().expect("cases").clone()
}

/// Liczba przypadkow po operacji -- chroni przed cicha utrata wektorow.
fn count(cases: &[Value], op: &str) -> usize {
    cases.iter().filter(|c| c["op"] == op).count()
}

#[test]
fn p8c_vectors_front_eta_work_capacity() {
    let cases = load();
    let mut n = 0;
    for c in &cases {
        match c["op"].as_str().unwrap() {
            "frontItem" => {
                let prod = dec_prod(&c["prod"]);
                let got = front_item(&prod).cloned();
                assert!(eq_opt_item(&got, &dec_opt_item(&c["out"])), "frontItem {c}");
            }
            "etaTurns" => {
                let got = eta_turns(
                    dec_num(&c["koszt"]),
                    dec_num(&c["postep"]),
                    dec_num(&c["praca"]),
                );
                let exp = if c["out"].is_null() {
                    None
                } else {
                    Some(dec_num(&c["out"]))
                };
                assert!(feq_opt(got, exp), "etaTurns {c}");
            }
            "buildingWorkPerTurn" => {
                let bonus = dec_arg(c.get("bonus")).unwrap_or(0.0);
                let got = building_work_per_turn(dec_num(&c["praca"]), bonus);
                assert!(feq(got, dec_num(&c["out"])), "buildingWorkPerTurn {c}");
            }
            "unitRecruitmentCapacityPerTurn" => {
                let bonus = dec_arg(c.get("bonus")).unwrap_or(0.0);
                let got = unit_recruitment_capacity_per_turn(dec_num(&c["base"]), bonus);
                assert!(
                    feq(got, dec_num(&c["out"])),
                    "unitRecruitmentCapacityPerTurn {c}"
                );
            }
            _ => continue,
        }
        n += 1;
    }
    assert_eq!(
        n,
        count(&cases, "frontItem")
            + count(&cases, "etaTurns")
            + count(&cases, "buildingWorkPerTurn")
            + count(&cases, "unitRecruitmentCapacityPerTurn")
    );
}

#[test]
fn p8c_vectors_enqueue_forfeit_bank_withdraw() {
    let cases = load();
    for c in &cases {
        match c["op"].as_str().unwrap() {
            "enqueue" => {
                let prod = dec_prod(&c["prod"]);
                let item = dec_item(&c["item"]);
                let mut map = if c["city"].is_null() {
                    None
                } else {
                    dec_map(&c["city"]["map"])
                };
                let got = if c["city"].is_null() {
                    enqueue(&prod, &item, None)
                } else {
                    enqueue(&prod, &item, Some(&mut map))
                };
                assert!(
                    eq_prod(&got, &dec_prod(&c["out"]["prod"])),
                    "enqueue prod {c}"
                );
                assert!(eq_map(&map, &dec_map(&c["out"]["map"])), "enqueue map {c}");
            }
            "forfeitedProgressForIndex" => {
                let prod = dec_prod(&c["prod"]);
                let got = forfeited_progress_for_index(&prod, dec_num(&c["index"]));
                assert!(feq(got, dec_num(&c["out"])), "forfeited {c}");
            }
            "bankRemovedBuildingProgress" => {
                let prod = dec_prod(&c["prod"]);
                let mut map = dec_map(&c["map"]);
                bank_removed_building_progress(&mut map, &prod, dec_num(&c["index"]));
                assert!(eq_map(&map, &dec_map(&c["out"]["map"])), "bank {c}");
            }
            "withdrawBankedBuildingProgress" => {
                let mut map = dec_map(&c["map"]);
                let got =
                    withdraw_banked_building_progress(&mut map, c["buildingId"].as_str().unwrap());
                assert!(feq(got, dec_num(&c["out"]["value"])), "withdraw value {c}");
                assert!(eq_map(&map, &dec_map(&c["out"]["map"])), "withdraw map {c}");
            }
            _ => continue,
        }
    }
    for op in [
        "enqueue",
        "forfeitedProgressForIndex",
        "bankRemovedBuildingProgress",
        "withdrawBankedBuildingProgress",
    ] {
        assert!(count(&cases, op) > 0, "brak wektorow: {op}");
    }
}

#[test]
fn p8c_vectors_queue_ops() {
    let cases = load();
    for c in &cases {
        match c["op"].as_str().unwrap() {
            "sanitizeBuildQueue" => {
                let got = sanitize_build_queue(&dec_prod(&c["prod"]));
                assert!(
                    eq_prod(&got.prod, &dec_prod(&c["out"]["prod"])),
                    "sanitize prod {c}"
                );
                assert!(
                    feq(got.refunded_praca, dec_num(&c["out"]["refundedPraca"])),
                    "sanitize refund {c}"
                );
            }
            "dequeue" => {
                let prod = dec_prod(&c["prod"]);
                let mut map = if c["city"].is_null() {
                    None
                } else {
                    dec_map(&c["city"]["map"])
                };
                let got = if c["city"].is_null() {
                    dequeue(&prod, dec_num(&c["index"]), None)
                } else {
                    dequeue(&prod, dec_num(&c["index"]), Some(&mut map))
                };
                assert!(
                    eq_prod(&got, &dec_prod(&c["out"]["prod"])),
                    "dequeue prod {c}"
                );
                assert!(eq_map(&map, &dec_map(&c["out"]["map"])), "dequeue map {c}");
            }
            "filterQueue" => {
                let prod = dec_prod(&c["prod"]);
                let keep: fn(&ProductionItem) -> bool = match c["keep"].as_str().unwrap() {
                    "only_budynek" => |i| i.kind == ProductionKind::Budynek,
                    "only_jednostka" => |i| i.kind == ProductionKind::Jednostka,
                    "none" => |_| false,
                    "all" => |_| true,
                    "not_koszary" => |i| i.id != "koszary",
                    "not_zamek" => |i| i.id != "zamek",
                    "only_nieistnieje" => |i| i.id == "nieistnieje",
                    other => panic!("nieznany predykat {other}"),
                };
                let got = filter_queue(&prod, keep);
                assert!(
                    eq_prod(&got.prod, &dec_prod(&c["out"]["prod"])),
                    "filter prod {c}"
                );
                assert!(
                    feq(got.forfeited_postep, dec_num(&c["out"]["forfeitedPostep"])),
                    "filter forfeited {c}"
                );
            }
            "promoteToFront" => {
                let got = promote_to_front(&dec_prod(&c["prod"]), dec_num(&c["index"]));
                assert!(eq_prod(&got, &dec_prod(&c["out"])), "promote {c}");
            }
            "insertAtFront" => {
                let got = insert_at_front(
                    &dec_prod(&c["prod"]),
                    &dec_item(&c["item"]),
                    dec_num(&c["activePostep"]),
                );
                assert!(eq_prod(&got, &dec_prod(&c["out"])), "insertAtFront {c}");
            }
            "advanceProduction" => {
                let bonus = dec_arg(c.get("bonus")).unwrap_or(0.0);
                let got = advance_production(&dec_prod(&c["prod"]), dec_num(&c["praca"]), bonus);
                assert!(
                    eq_prod(&got.prod, &dec_prod(&c["out"]["prod"])),
                    "advance prod {c}"
                );
                assert!(
                    eq_opt_item(&got.completed, &dec_opt_item(&c["out"]["completed"])),
                    "advance completed {c}"
                );
                let exp_over = dec_arg(c["out"].get("overflowToPool"));
                assert!(
                    feq_opt(got.overflow_to_pool, exp_over),
                    "advance overflow {c}"
                );
            }
            _ => continue,
        }
    }
    for op in [
        "sanitizeBuildQueue",
        "dequeue",
        "filterQueue",
        "promoteToFront",
        "insertAtFront",
        "advanceProduction",
    ] {
        assert!(count(&cases, op) > 0, "brak wektorow: {op}");
    }
}

// --- Testy progowe i jawne (granice, NaN, brakujace klucze) -------------------------------

fn bud(id: &str, koszt: f64, postep: Option<f64>) -> ProductionItem {
    ProductionItem {
        kind: ProductionKind::Budynek,
        id: id.to_string(),
        nazwa: id.to_string(),
        koszt,
        postep,
        is_general: None,
    }
}

fn jed(id: &str, koszt: f64, postep: Option<f64>) -> ProductionItem {
    ProductionItem {
        kind: ProductionKind::Jednostka,
        ..bud(id, koszt, postep)
    }
}

fn prod(kolejka: Vec<ProductionItem>, postep: f64) -> CityProduction {
    CityProduction {
        kolejka,
        postep,
        wstrzymana: None,
        rekrutacja: None,
    }
}

#[test]
fn eta_turns_threshold_and_nan() {
    // praca <= 0 lub NaN -> brak oszacowania (N-1 / N / N+1 wokol zera).
    assert_eq!(eta_turns(10.0, 0.0, 0.0), None);
    assert_eq!(eta_turns(10.0, 0.0, -1.0), None);
    assert_eq!(eta_turns(10.0, 0.0, f64::NAN), None);
    // ukonczone albo nadwyzka postepu -> minimum 1 tura.
    assert_eq!(eta_turns(10.0, 10.0, 1.0), Some(1.0));
    assert_eq!(eta_turns(10.0, 25.0, 1.0), Some(1.0));
    // granica ceil: koszt-postep = N*praca (N tur), N+1 (N+1 tur), N-1 (N-1 tur).
    assert_eq!(eta_turns(10.0, 0.0, 5.0), Some(2.0));
    assert_eq!(eta_turns(11.0, 0.0, 5.0), Some(3.0));
    assert_eq!(eta_turns(9.0, 0.0, 5.0), Some(2.0));
    // NaN w koszcie propaguje sie (Math.max(1, NaN) = NaN w webie), nie jest zamieniany na 1.
    assert!(eta_turns(f64::NAN, 0.0, 5.0).unwrap().is_nan());
}

#[test]
fn unit_capacity_min_one_and_no_carry() {
    assert_eq!(unit_recruitment_capacity_per_turn(0.0, 0.0), 0.0);
    assert_eq!(unit_recruitment_capacity_per_turn(0.5, 0.0), 1.0);
    assert_eq!(unit_recruitment_capacity_per_turn(2.9, 0.0), 2.0);
    assert_eq!(unit_recruitment_capacity_per_turn(2.0, 0.5), 3.0);
    assert_eq!(unit_recruitment_capacity_per_turn(f64::NAN, 0.0), 0.0);
}

#[test]
fn bank_overwrites_and_withdraw_consumes() {
    let p = prod(
        vec![bud("koszary", 30.0, None), bud("zamek", 120.0, None)],
        12.0,
    );
    let mut map: Option<PostepBudynkowUsuniete> = None;
    // usuniecie frontu (index 0) banku 12; brak mapy tworzy ja dopiero teraz.
    bank_removed_building_progress(&mut map, &p, 0.0);
    assert_eq!(map.as_ref().unwrap().get("koszary"), Some(&12.0));
    // ponowny zapis NADPISUJE (nie sumuje).
    let p2 = prod(vec![bud("koszary", 30.0, Some(7.0))], 0.0);
    bank_removed_building_progress(&mut map, &p2, 0.0);
    // front z postep 0 -> brak zapisu, stara wartosc zostaje bez zmian? Nie: forfeited 0 = no-op.
    assert_eq!(map.as_ref().unwrap().get("koszary"), Some(&12.0));
    let p3 = prod(
        vec![bud("x", 1.0, None), bud("koszary", 30.0, Some(7.0))],
        0.0,
    );
    bank_removed_building_progress(&mut map, &p3, 1.0);
    assert_eq!(map.as_ref().unwrap().get("koszary"), Some(&7.0));
    // withdraw konsumuje; drugi withdraw = 0.
    assert_eq!(withdraw_banked_building_progress(&mut map, "koszary"), 7.0);
    assert_eq!(withdraw_banked_building_progress(&mut map, "koszary"), 0.0);
    // klucze prototypowe nie maja wpisu -> 0 bez psucia mapy.
    assert_eq!(
        withdraw_banked_building_progress(&mut map, "constructor"),
        0.0
    );
}

#[test]
fn bank_ignores_units_and_proto_key() {
    let p = prod(
        vec![
            jed("Wojownik", 10.0, None),
            bud("__proto__", 5.0, Some(3.0)),
        ],
        4.0,
    );
    let mut map: Option<PostepBudynkowUsuniete> = None;
    bank_removed_building_progress(&mut map, &p, 0.0);
    // jednostka na froncie nie jest bankowana, ale mapa nie powstaje (forfeited tez nie jest zapisane).
    assert!(map.is_none());
    bank_removed_building_progress(&mut map, &p, 1.0);
    // web: `city.postepBudynkowUsuniete = {}` powstaje, zapis `__proto__` jest pomijany.
    assert_eq!(map, Some(BTreeMap::new()));
}

#[test]
fn dequeue_front_forfeits_own_and_new_front_regains_banked() {
    // front traci SWOJ postep (remainder 0); nowy front odzyskuje swoj zbankowany postep.
    let p = prod(
        vec![bud("koszary", 30.0, None), bud("zamek", 120.0, Some(9.0))],
        12.0,
    );
    let got = dequeue(&p, 0.0, None);
    assert_eq!(got.postep, 9.0);
    assert_eq!(got.kolejka.len(), 1);
    assert_eq!(got.kolejka[0].postep, None);
    // poza zakresem / NaN / ulamek = kopia bez zmian.
    assert_eq!(dequeue(&p, 2.0, None), p);
    assert_eq!(dequeue(&p, f64::NAN, None), p);
    assert_eq!(dequeue(&p, 0.5, None), p);
}

#[test]
fn advance_completes_at_threshold_and_pauses() {
    // postep + praca == koszt -> ukonczenie (N); N-1 -> bez ukonczenia.
    let p = prod(vec![bud("koszary", 30.0, None)], 25.0);
    let at = advance_production(&p, 5.0, 0.0);
    assert!(at.completed.is_some());
    assert_eq!(at.overflow_to_pool, None);
    let below = advance_production(&p, 4.0, 0.0);
    assert!(below.completed.is_none());
    assert_eq!(below.prod.postep, 29.0);
    // pauza: brak Pracy, kolejka zachowana.
    let mut paused = p.clone();
    paused.wstrzymana = Some(true);
    let r = advance_production(&paused, 100.0, 0.0);
    assert!(r.completed.is_none());
    assert_eq!(r.prod.postep, 25.0);
    // pusta kolejka: calosc Pracy do puli.
    let empty = prod(Vec::new(), 0.0);
    assert_eq!(
        advance_production(&empty, 3.0, 0.0).overflow_to_pool,
        Some(3.0)
    );
    assert_eq!(
        advance_production(&empty, f64::NAN, 0.0).overflow_to_pool,
        None
    );
}

#[test]
fn advance_speed_bonus_applies_to_buildings_only() {
    let b = prod(vec![bud("koszary", 30.0, None)], 0.0);
    // 10 * 1.5 = 15 Pracy/tura dla budynku.
    assert_eq!(advance_production(&b, 10.0, 0.5).prod.postep, 15.0);
    let u = prod(vec![jed("Wojownik", 30.0, None)], 0.0);
    // jednostki bez bonusu.
    assert_eq!(advance_production(&u, 10.0, 0.5).prod.postep, 10.0);
}

#[test]
fn enqueue_unit_is_gated_and_banked_progress_restored() {
    let p = prod(vec![bud("koszary", 30.0, None)], 0.0);
    let unit = enqueue(&p, &jed("Wojownik", 10.0, None), None);
    assert_eq!(
        unit.kolejka.len(),
        1,
        "jednostka nie trafia do kolejki budynkowej"
    );
    let mut map: Option<PostepBudynkowUsuniete> =
        Some(BTreeMap::from([("zamek".to_string(), 40.0)]));
    let added = enqueue(&p, &bud("zamek", 120.0, None), Some(&mut map));
    assert_eq!(added.kolejka[1].postep, Some(40.0));
    assert_eq!(
        map.as_ref().unwrap().get("zamek"),
        None,
        "zapis konsumowany"
    );
}

#[test]
fn sanitize_refunds_legacy_units_front_and_waiting() {
    let p = prod(
        vec![
            jed("Wojownik", 10.0, Some(4.0)),
            bud("koszary", 30.0, None),
            jed("Galera", 7.5, Some(2.5)),
        ],
        6.0,
    );
    let r = sanitize_build_queue(&p);
    assert_eq!(r.prod.kolejka.len(), 1);
    assert_eq!(r.refunded_praca, 2.5 + 6.0);
}

#[test]
fn promote_to_front_moves_progress_per_item() {
    let p = prod(
        vec![bud("koszary", 30.0, None), bud("zamek", 120.0, Some(9.0))],
        12.0,
    );
    let r = promote_to_front(&p, 1.0);
    assert_eq!(r.postep, 9.0);
    assert_eq!(r.kolejka[0].id, "zamek");
    assert_eq!(r.kolejka[0].postep, None);
    assert_eq!(r.kolejka[1].postep, Some(12.0));
}
