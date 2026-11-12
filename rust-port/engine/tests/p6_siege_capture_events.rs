//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q7-Q1: wektory z pinu dla `recordCityCaptureEvent` / `recordCivElimEvent`
//! (BRAK -> Ported, event store).
//!
//! Zrodlo wektorow: `tests/p6_siege_capture_events_vectors/vectors.json` wygenerowane przez
//! `tests/p6_siege_capture_events_gen.mjs` (wycina funkcje z pinu 07d2fbd72f758705f8e1d59cc4968027ffbafe75
//! i wykonuje je w node; stan domkniecia w pamieci, spektakl poza zakresem).
//!
//! Sprawdzane po kazdym kroku: pelny `warEventLog` (kolejnosc, pola), mapa szczegolow eliminacji,
//! mapa szczegolow zdobycia (tytul, nazwa, podtytul, wiersze po lustrzeniu, tytul bilansu) i licznik odswiezen HUD.

use civ_engine::domain::siege_capture_events::{
    capture_report_one_line, capture_report_short_line, mirror_capture_report_rows_for_victim,
    CaptureEventStore, CaptureRow, CityCaptureArgs,
};
use serde_json::{json, Map, Value};

const DATA: &str = include_str!("p6_siege_capture_events_vectors/vectors.json");

fn row_from(v: &Value) -> CaptureRow {
    CaptureRow {
        label: v["label"].as_str().expect("label").to_string(),
        value: v["value"].as_str().expect("value").to_string(),
        tone: v.get("tone").and_then(Value::as_str).map(str::to_string),
        group: v.get("group").and_then(Value::as_str).map(str::to_string),
    }
}

fn rows_from(v: &Value) -> Vec<CaptureRow> {
    v.as_array().expect("rows").iter().map(row_from).collect()
}

fn row_to_json(r: &CaptureRow) -> Value {
    let mut m = Map::new();
    m.insert("label".into(), json!(r.label));
    m.insert("value".into(), json!(r.value));
    if let Some(t) = &r.tone {
        m.insert("tone".into(), json!(t));
    }
    if let Some(g) = &r.group {
        m.insert("group".into(), json!(g));
    }
    Value::Object(m)
}

/// Snapshot w tym samym ksztalcie, co `snapshot()` w generatorze (klucze JS, bez `spectacle`).
fn snapshot(s: &CaptureEventStore) -> Value {
    let log: Vec<Value> = s
        .war_event_log
        .iter()
        .map(|e| {
            json!({
                "id": e.id,
                "icon": e.icon,
                "title": e.title,
                "subtitle": e.subtitle,
                "kind": e.kind,
                "negative": e.negative,
                "turnCreated": e.turn_created,
            })
        })
        .collect();
    let civ: Map<String, Value> = s
        .civ_elim_details
        .iter()
        .map(|(k, d)| {
            (
                k.clone(),
                json!({ "civLabel": d.civ_label, "details": d.details, "cause": d.cause }),
            )
        })
        .collect();
    let city: Map<String, Value> = s
        .city_capture_details
        .iter()
        .map(|(k, d)| {
            (
                k.clone(),
                json!({
                    "title": d.title,
                    "cityName": d.city_name,
                    "subtitle": d.subtitle,
                    "rows": d.rows.iter().map(row_to_json).collect::<Vec<_>>(),
                    "rowsTitle": d.rows_title,
                }),
            )
        })
        .collect();
    json!({
        "hudRefreshes": s.hud_refreshes,
        "warEventLog": log,
        "civElim": civ,
        "city": city,
    })
}

#[test]
fn capture_events_match_pin_step_by_step() {
    let doc: Value = serde_json::from_str(DATA).expect("vectors.json");
    let scenarios = doc["scenarios"].as_array().expect("scenarios");
    assert!(
        scenarios.len() >= 7,
        "za malo scenariuszy: {}",
        scenarios.len()
    );
    let mut steps_checked = 0usize;

    for sc in scenarios {
        let name = sc["name"].as_str().expect("name");
        let mut store = CaptureEventStore::default();
        for (idx, step) in sc["steps"].as_array().expect("steps").iter().enumerate() {
            let op = &step["step"];
            match op["op"].as_str().expect("op") {
                "setTurn" => store.turn = op["turn"].as_i64().expect("turn"),
                "civElim" => {
                    let cause = op.get("cause").and_then(Value::as_str);
                    store.record_civ_elim_event(
                        op["csOwnerId"].as_i64().expect("csOwnerId"),
                        op["civLabel"].as_str().expect("civLabel"),
                        op["details"].as_str().expect("details"),
                        cause,
                    );
                }
                "cityCapture" => {
                    let a = &op["args"];
                    let rows = rows_from(&a["rows"]);
                    let args = CityCaptureArgs {
                        city_id: a["cityId"].as_str().expect("cityId"),
                        city_name: a["cityName"].as_str().expect("cityName"),
                        old_owner: a["oldOwner"].as_i64().expect("oldOwner"),
                        new_owner: a["newOwner"].as_i64().expect("newOwner"),
                        rows: &rows,
                        victim_label: a["victimLabel"].as_str().expect("victimLabel"),
                        captor_label: a["captorLabel"].as_str().expect("captorLabel"),
                        eliminated_civ_label: a.get("eliminatedCivLabel").and_then(Value::as_str),
                    };
                    store.record_city_capture_event(&args);
                }
                other => panic!("nieznana operacja {other}"),
            }
            let got = snapshot(&store);
            assert_eq!(
                got, step["snapshot"],
                "scenariusz `{name}`, krok {idx} ({})",
                op["op"]
            );
            steps_checked += 1;
        }
    }
    assert!(steps_checked >= 30, "za malo krokow: {steps_checked}");
}

#[test]
fn report_line_helpers_match_pin_on_gain_and_loss_rows() {
    let rows = vec![
        CaptureRow {
            label: "Złoto".into(),
            value: "+120".into(),
            tone: Some("gain".into()),
            group: Some("lup".into()),
        },
        CaptureRow {
            label: "Ludność".into(),
            value: "+1".into(),
            tone: Some("gain".into()),
            group: Some("przejete".into()),
        },
        CaptureRow {
            label: "Pula pracy".into(),
            value: "−30".into(),
            tone: Some("loss".into()),
            group: Some("strata".into()),
        },
    ];
    // Lustro: tylko gain + '+' -> loss + U+2212; reszta bez zmian.
    let mirrored = mirror_capture_report_rows_for_victim(&rows);
    assert_eq!(mirrored[0].value, "\u{2212}120");
    assert_eq!(mirrored[0].tone.as_deref(), Some("loss"));
    assert_eq!(mirrored[1].value, "\u{2212}1");
    assert_eq!(mirrored[2], rows[2]);
    // Krotka linia = tylko grupa `lup`.
    assert_eq!(capture_report_short_line(&rows), "Złoto: +120");
    assert_eq!(
        capture_report_one_line(&rows),
        "Złoto: +120 \u{00b7} Ludność: +1 \u{00b7} Pula pracy: −30"
    );
    // Brak wierszy `lup` -> pusta linia (nie panika).
    assert_eq!(capture_report_short_line(&rows[1..2]), "");
}

#[test]
fn ai_to_ai_capture_leaves_store_untouched() {
    let mut store = CaptureEventStore {
        turn: 9,
        ..Default::default()
    };
    let rows: Vec<CaptureRow> = Vec::new();
    store.record_city_capture_event(&CityCaptureArgs {
        city_id: "z1",
        city_name: "Z",
        old_owner: 2,
        new_owner: 3,
        rows: &rows,
        victim_label: "A",
        captor_label: "B",
        eliminated_civ_label: None,
    });
    assert!(store.war_event_log.is_empty());
    assert!(store.city_capture_details.is_empty());
    assert_eq!(store.hud_refreshes, 0);
}
