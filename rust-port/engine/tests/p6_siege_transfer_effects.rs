//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q3-Q1 (r2): skutki przejecia miasta porownane z WEKTORAMI Z PINU.
//!
//! Wektory: `tests/p6_siege_transfer_vectors/vectors.json`, sekcja `effects` (`popLoss`, `queue`), generator
//! `tests/p6_siege_transfer_gen.mjs`. Generator WYKONUJE na pinie 07d2fbd72 `applyCapturePopulationLoss`,
//! `sanitizeProductionQueue`, `sanitizeBuildQueue` i `filterQueue` (bez stubow); oczekiwane wartosci to wynik tego
//! wykonania. Zadna liczba nie jest wpisana recznie w tym pliku.

use civ_engine::domain::production_queue::sanitize_build_queue;
use civ_engine::domain::production_units::{CityProduction, ProductionItem, ProductionKind};
use civ_engine::domain::siege_transfer_effects::{
    apply_capture_population_loss, sanitize_production_queue_for_owner, CapturePopLossInput,
    CAPTURE_POP_LOSS_PIN,
};
use serde_json::Value;

const DATA: &str = include_str!("p6_siege_transfer_vectors/vectors.json");

fn parse_num(v: &Value) -> f64 {
    match v {
        Value::String(s) if s == "NaN" => f64::NAN,
        other => other.as_f64().expect("liczba"),
    }
}

fn opt_i64(v: &Value) -> Option<i64> {
    match v {
        Value::Null => None,
        other => Some(other.as_i64().expect("calkowita")),
    }
}

fn opt_bool(v: &Value) -> Option<bool> {
    match v {
        Value::Null => None,
        Value::Bool(b) => Some(*b),
        other => panic!("nieoczekiwana wartosc flagi {other}"),
    }
}

fn opt_f64(v: &Value) -> Option<f64> {
    match v {
        Value::Null => None,
        other => Some(parse_num(other)),
    }
}

fn kind_of(s: &str) -> ProductionKind {
    match s {
        "budynek" => ProductionKind::Budynek,
        "jednostka" => ProductionKind::Jednostka,
        other => panic!("nieznany rodzaj {other}"),
    }
}

fn kind_name(k: &ProductionKind) -> &'static str {
    match k {
        ProductionKind::Budynek => "budynek",
        ProductionKind::Jednostka => "jednostka",
    }
}

fn prod_from(v: &Value) -> CityProduction {
    let kolejka = v["kolejka"]
        .as_array()
        .expect("kolejka[]")
        .iter()
        .map(|i| ProductionItem {
            kind: kind_of(i["kind"].as_str().unwrap()),
            id: i["id"].as_str().unwrap().to_owned(),
            nazwa: i["id"].as_str().unwrap().to_owned(),
            koszt: 10.0,
            postep: opt_f64(&i["postep"]),
            is_general: None,
        })
        .collect();
    CityProduction {
        kolejka,
        postep: parse_num(&v["postep"]),
        wstrzymana: None,
        rekrutacja: None,
    }
}

fn assert_kolejka_eq(got: &CityProduction, exp: &Value, ctx: &str) {
    let exp_items = exp["kolejka"].as_array().expect("kolejka[]");
    assert_eq!(got.kolejka.len(), exp_items.len(), "{ctx}: dlugosc kolejki");
    for (g, e) in got.kolejka.iter().zip(exp_items) {
        assert_eq!(g.id, e["id"].as_str().unwrap(), "{ctx}: id");
        assert_eq!(
            kind_name(&g.kind),
            e["kind"].as_str().unwrap(),
            "{ctx}: kind"
        );
        assert_eq!(g.postep, opt_f64(&e["postep"]), "{ctx}: postep {}", g.id);
    }
    assert_eq!(
        got.postep,
        parse_num(&exp["postep"]),
        "{ctx}: postep kolejki"
    );
}

fn root() -> Value {
    serde_json::from_str(DATA).expect("wektory JSON")
}

#[test]
fn pin_capture_pop_loss_constant_matches_rust() {
    assert_eq!(
        root()["capturePopLoss"].as_u64().expect("liczba"),
        u64::from(CAPTURE_POP_LOSS_PIN),
        "CAPTURE_POP_LOSS z pinu != CAPTURE_POP_LOSS_PIN"
    );
}

#[test]
fn effects_pop_loss_vectors_match_pin() {
    let root = root();
    let cases = root["effects"]["popLoss"].as_array().expect("popLoss[]");
    assert!(cases.len() >= 100, "za malo wektorow: {}", cases.len());
    let mut losses = 0;
    for (idx, case) in cases.iter().enumerate() {
        let inp = &case["input"];
        let exp = &case["expect"];
        let input = CapturePopLossInput {
            prev_owner: inp["prevOwner"].as_i64().unwrap(),
            new_owner: inp["newOwner"].as_i64().unwrap(),
            rebel_prev_owner_snapshot: opt_i64(&inp["rebelPrevOwnerSnapshot"]),
            captured_from_owner_id: opt_i64(&inp["capturedFromOwnerId"]),
            founded_by: opt_i64(&inp["foundedBy"]),
            found_by_owner: opt_bool(&inp["foundedByOwner"]),
            capture_pop_loss: CAPTURE_POP_LOSS_PIN,
        };
        let out = apply_capture_population_loss(parse_num(&inp["pop"]), &input);
        assert_eq!(out.loss, parse_num(&exp["loss"]), "popLoss {idx}: loss");
        let pop_exp = parse_num(&exp["population"]);
        assert!(
            (out.population.is_nan() && pop_exp.is_nan()) || out.population == pop_exp,
            "popLoss {idx}: population {} != {}",
            out.population,
            pop_exp
        );
        assert_eq!(
            Some(out.captured_from_owner_id),
            opt_i64(&exp["capturedFromOwnerId"]),
            "popLoss {idx}: capturedFromOwnerId"
        );
        assert_eq!(
            out.founded_by,
            opt_i64(&exp["foundedBy"]),
            "popLoss {idx}: foundedBy"
        );
        if out.loss > 0.0 {
            losses += 1;
        }
    }
    assert!(losses >= 10, "za malo wektorow z realna strata: {losses}");
}

#[test]
fn effects_queue_vectors_match_pin() {
    let root = root();
    let prefix = root["wonderPrefix"].as_str().expect("wonderPrefix");
    let cases = root["effects"]["queue"].as_array().expect("queue[]");
    assert!(cases.len() >= 100, "za malo wektorow: {}", cases.len());
    for (idx, case) in cases.iter().enumerate() {
        let inp = &case["input"];
        let exp = &case["expect"];
        let prod = prod_from(&inp["prod"]);
        let table = &inp["wonderOk"];
        // parseWonderProdId + wonderGateOk z tabeli scenariusza (jak w pinie: pozycja spoza prefiksu przechodzi).
        let gate = |item: &ProductionItem| match item.id.strip_prefix(prefix) {
            Some("") => true,
            Some(wid) => table[wid].as_bool() == Some(true),
            None => true,
        };
        let out = sanitize_production_queue_for_owner(&prod, gate);
        assert_kolejka_eq(&out.prod, exp, &format!("queue {idx}"));
        let credited = out.refunded_praca + out.forfeited_postep;
        assert_eq!(
            credited,
            parse_num(&exp["praca"]),
            "queue {idx}: Praca zapisana w puli zdobywcy (zwrot + zbankowany postep)"
        );
        // Idempotencja drugiej sanityzacji (web wola sanitizeBuildQueue dwa razy): na wyniku pierwszej
        // sanityzacji zwrot = 0 i kolejka sie nie zmienia.
        let once = sanitize_build_queue(&prod);
        let twice = sanitize_build_queue(&once.prod);
        assert_eq!(
            twice.refunded_praca, 0.0,
            "queue {idx}: idempotencja zwrotu"
        );
        assert_eq!(twice.prod, once.prod, "queue {idx}: idempotencja kolejki");
    }
}

#[test]
#[should_panic(expected = "pop_loss.new_owner != new_owner")]
fn niespojny_pop_loss_jest_wykrywany() {
    use civ_engine::domain::siege_enter_city::EnterUnit;
    use civ_engine::domain::siege_transfer::{
        apply_transfer_with_effects, TransferCity, TransferExtras,
    };
    let mut c = TransferCity {
        owner_id: 1,
        population: 1.0,
        q: 0,
        r: 0,
        found_by_owner: None,
        rebel_state: None,
        start_city_state: None,
    };
    let mut units: Vec<EnterUnit> = Vec::new();
    let _ = apply_transfer_with_effects(
        &mut c,
        2,
        false,
        &mut units,
        None,
        TransferExtras {
            pop_loss: Some(CapturePopLossInput {
                prev_owner: 1,
                new_owner: 3,
                rebel_prev_owner_snapshot: None,
                captured_from_owner_id: None,
                founded_by: None,
                found_by_owner: None,
                capture_pop_loss: CAPTURE_POP_LOSS_PIN,
            }),
            wonder_gate_ok: None,
        },
    );
}
