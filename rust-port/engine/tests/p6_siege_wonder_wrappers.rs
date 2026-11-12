//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q9-Q1: wektory z pinu dla wrapperow `beginWonderTransferWatch` i `settleWonderTransfer`
//! (`civ_engine::domain::siege_wonder_wrappers`).
//!
//! Zrodlo wektorow: `tests/p6_siege_wonder_wrappers_vectors/vectors.json` wygenerowane przez
//! `tests/p6_siege_wonder_wrappers_gen.mjs` (wycina obie funkcje z `gra/src/main.ts` pinu
//! 07d2fbd72f758705f8e1d59cc4968027ffbafe75 i wykonuje je w node; strazy SHA-256 w generatorze).
//!
//! `territoryOwnerAt` jest atrapa-stubem (najblizszy wezel w promieniu) po obu stronach: wektory testuja kontrakt
//! wrapperow, nie port terytorium.
//!
//! Dlug testowy Q8 (NaN, liczby niecalkowite, duze ID, duplikaty wonderId w chain): patrz testy `dlug_*` nizej.
//! Typy Rust to i32 (ownerId, q, r, tura); wartosci NaN/Infinity/niecalkowite NIE MAJA reprezentacji w typie
//! i nie moga wejsc do wrapperow - wektory ich nie zawieraja (asercja `dlug_wejscia_sa_calkowite_i32`).

use civ_engine::domain::siege_wonder_watch::{TransferableWonder, WonderTerritorySnapshot};
use civ_engine::domain::siege_wonder_wrappers::{
    begin_wonder_transfer_watch, settle_wonder_transfer, ExcludedCity, WonderTerritoryNode,
};
use serde_json::{json, Map, Value};
use std::collections::BTreeMap;

const DATA: &str = include_str!("p6_siege_wonder_wrappers_vectors/vectors.json");

/// Stub `territoryOwnerAt` z generatora: najblizszy wezel w swoim promieniu (remis = pierwszy), brak = None.
fn stub_owner_at(q: i32, r: i32, nodes: &[WonderTerritoryNode]) -> Option<i32> {
    let mut best: Option<i32> = None;
    let mut best_d = i64::MAX;
    for n in nodes {
        let dq = (q as i64) - (n.q as i64);
        let dr = (r as i64) - (n.r as i64);
        let ds = (-(q as i64) - (r as i64)) - (-(n.q as i64) - (n.r as i64));
        let d = (dq.abs() + dr.abs() + ds.abs()) / 2;
        if d <= n.radius as i64 && d < best_d {
            best_d = d;
            best = Some(n.owner_id);
        }
    }
    best
}

fn int(v: &Value, key: &str) -> i32 {
    let x = v[key]
        .as_i64()
        .unwrap_or_else(|| panic!("pole {key} nie jest calkowite: {}", v[key]));
    i32::try_from(x).unwrap_or_else(|_| panic!("pole {key} poza i32: {x}"))
}

fn wonders_from(v: &Value) -> Vec<TransferableWonder> {
    v.as_array()
        .expect("wonders")
        .iter()
        .map(|w| TransferableWonder {
            wonder_id: w["wonderId"].as_str().expect("wonderId").to_string(),
            q: int(w, "q"),
            r: int(w, "r"),
            owner_id: int(w, "ownerId"),
        })
        .collect()
}

fn wonders_to_json(ws: &[TransferableWonder]) -> Value {
    Value::Array(
        ws.iter()
            .map(|w| json!({"wonderId": w.wonder_id, "q": w.q, "r": w.r, "ownerId": w.owner_id}))
            .collect(),
    )
}

fn nodes_from(v: &Value) -> Vec<WonderTerritoryNode> {
    v.as_array()
        .expect("nodes")
        .iter()
        .map(|n| WonderTerritoryNode {
            q: int(n, "q"),
            r: int(n, "r"),
            radius: int(n, "radius"),
            owner_id: int(n, "ownerId"),
            is_fort: n["isFort"].as_bool().unwrap_or(false),
            is_outpost: n["isOutpost"].as_bool().unwrap_or(false),
        })
        .collect()
}

fn exclude_from(v: &Value) -> Option<ExcludedCity> {
    if v.is_null() {
        None
    } else {
        Some(ExcludedCity {
            q: int(v, "q"),
            r: int(v, "r"),
            owner_id: int(v, "ownerId"),
        })
    }
}

/// JS `Map` z JSON: klucz nieobecny = brak wpisu; null = `None`; liczba = `Some`.
fn snapshot_from(v: &Value) -> WonderTerritorySnapshot {
    v.as_object()
        .expect("snapshot object")
        .iter()
        .map(|(k, val)| {
            (
                k.clone(),
                if val.is_null() {
                    None
                } else {
                    Some(i32::try_from(val.as_i64().expect("wartosc migawki")).expect("i32"))
                },
            )
        })
        .collect()
}

fn snapshot_to_json(s: &WonderTerritorySnapshot) -> Value {
    let m: Map<String, Value> = s
        .iter()
        .map(|(k, v)| (k.clone(), v.map(Value::from).unwrap_or(Value::Null)))
        .collect();
    Value::Object(m)
}

fn names_from(v: &Value) -> BTreeMap<String, String> {
    v.as_object()
        .expect("names")
        .iter()
        .map(|(k, val)| (k.clone(), val.as_str().expect("nazwa").to_string()))
        .collect()
}

fn cases(group: &str) -> Vec<Value> {
    let root: Value = serde_json::from_str(DATA).expect("vectors.json");
    root["cases"][group].as_array().expect("grupa").clone()
}

#[test]
fn begin_wektory_z_pinu() {
    let cs = cases("begin");
    assert!(cs.len() >= 100, "za malo przypadkow begin: {}", cs.len());
    for (idx, c) in cs.iter().enumerate() {
        let wonders = wonders_from(&c["input"]["wonders"]);
        let nodes = nodes_from(&c["input"]["nodes"]);
        let got = begin_wonder_transfer_watch(
            &wonders,
            &nodes,
            exclude_from(&c["input"]["exclude"]),
            stub_owner_at,
        );
        let got_json = match got {
            None => Value::Null,
            Some(s) => snapshot_to_json(&s),
        };
        assert_eq!(got_json, c["expected"]["snapshot"], "begin przypadek {idx}");
    }
}

#[test]
fn settle_wektory_z_pinu() {
    let cs = cases("settle");
    assert!(cs.len() >= 100, "za malo przypadkow settle: {}", cs.len());
    for (idx, c) in cs.iter().enumerate() {
        check_settle(idx, c);
    }
}

#[test]
fn chain_wektory_z_pinu() {
    let cs = cases("chain");
    assert!(cs.len() >= 60, "za malo przypadkow chain: {}", cs.len());
    for (idx, c) in cs.iter().enumerate() {
        let mut wonders = wonders_from(&c["input"]["wonders"]);
        let nodes_before = nodes_from(&c["input"]["nodesBefore"]);
        let nodes_after = nodes_from(&c["input"]["nodesAfter"]);
        let names = names_from(&c["input"]["names"]);
        let turn = int(&c["input"], "turn");
        let me = int(&c["input"], "me");

        let before = begin_wonder_transfer_watch(&wonders, &nodes_before, None, stub_owner_at);
        assert_eq!(
            before.as_ref().map(snapshot_to_json).unwrap_or(Value::Null),
            c["expected"]["before"],
            "chain {idx}: migawka PRZED"
        );
        let out = settle_wonder_transfer(
            before.as_ref(),
            &mut wonders,
            &nodes_after,
            stub_owner_at,
            turn,
            me,
            |id| names.get(id).cloned(),
        );
        assert_outcome(idx, &out, &wonders, c);
    }
}

fn check_settle(idx: usize, c: &Value) {
    let mut wonders = wonders_from(&c["input"]["wonders"]);
    let nodes = nodes_from(&c["input"]["nodes"]);
    let names = names_from(&c["input"]["names"]);
    let before: Option<WonderTerritorySnapshot> = match &c["input"]["before"] {
        Value::Null => None,
        v => Some(snapshot_from(v)),
    };
    let out = settle_wonder_transfer(
        before.as_ref(),
        &mut wonders,
        &nodes,
        stub_owner_at,
        int(&c["input"], "turn"),
        int(&c["input"], "me"),
        |id| names.get(id).cloned(),
    );
    assert_outcome(idx, &out, &wonders, c);
}

fn assert_outcome(
    idx: usize,
    out: &civ_engine::domain::siege_wonder_wrappers::SettleOutcome,
    wonders: &[TransferableWonder],
    c: &Value,
) {
    let exp = &c["expected"];
    assert_eq!(
        out.transferred as u64,
        exp["transferred"].as_u64().expect("transferred"),
        "przypadek {idx}: liczba przeniesien"
    );
    let logs: Vec<&str> = out.events.iter().map(|e| e.log_line.as_str()).collect();
    let exp_logs: Vec<&str> = exp["logs"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap())
        .collect();
    assert_eq!(logs, exp_logs, "przypadek {idx}: logi");

    let notices: Vec<Value> = out
        .events
        .iter()
        .filter_map(|e| e.notice.as_ref())
        .map(|n| {
            json!({
                "variant": n.variant,
                "nazwa": n.nazwa,
                "locationLabel": n.location_label,
                "bodyHtml": n.body_html,
                "showOnMapWonderId": n.show_on_map_wonder_id,
            })
        })
        .collect();
    assert_eq!(
        Value::Array(notices),
        exp["notices"],
        "przypadek {idx}: powiadomienia"
    );

    let ui: Vec<&str> = out.ui_calls.clone();
    let exp_ui: Vec<&str> = exp["uiTrace"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap())
        .collect();
    assert_eq!(ui, exp_ui, "przypadek {idx}: wolania UI");

    assert_eq!(
        wonders_to_json(wonders),
        exp["wonders"],
        "przypadek {idx}: stan cudow po settle"
    );
}

#[test]
fn pokrycie_galezi_jest_realne() {
    let mut transfers = 0usize;
    let mut mine = 0usize;
    let mut rival = 0usize;
    let mut chain_with_transfer = 0usize;
    let mut empty_before = 0usize;
    for c in cases("settle") {
        let n = c["expected"]["transferred"].as_u64().unwrap();
        if n > 0 {
            transfers += 1;
        }
        for notice in c["expected"]["notices"].as_array().unwrap() {
            match notice["variant"].as_str().unwrap() {
                "mine" => mine += 1,
                "rival" => rival += 1,
                _ => {}
            }
        }
        if c["input"]["before"].is_null() {
            empty_before += 1;
        }
    }
    for c in cases("chain") {
        if c["expected"]["transferred"].as_u64().unwrap() > 0 {
            chain_with_transfer += 1;
        }
    }
    assert!(
        transfers >= 30,
        "za malo settle z przeniesieniem: {transfers}"
    );
    assert!(mine >= 10, "za malo powiadomien 'mine': {mine}");
    assert!(rival >= 10, "za malo powiadomien 'rival': {rival}");
    assert!(
        chain_with_transfer >= 10,
        "za malo chain z przeniesieniem: {chain_with_transfer}"
    );
    assert!(empty_before >= 1, "brak przypadku before=null");
}

#[test]
fn dlug_wejscia_sa_calkowite_i32() {
    // Dlug Q8 (zarzut 3): liczby niecalkowite, NaN, ID poza i32 i duplikaty wonderId.
    // Typy Rust sa i32, wiec NaN/Infinity/niecalkowite nie maja reprezentacji: asercja, ze zadne wejscie
    // w wektorach ich nie zawiera (generator i tak nie emituje NaN/Infinity; tu sprawdzamy kazde pole liczbowe).
    let mut dup_cases = 0usize;
    let mut extreme_cases = 0usize;
    for group in ["begin", "settle", "chain"] {
        for c in cases(group) {
            let inp = &c["input"];
            let mut has_dup = false;
            let ws = wonders_from(&inp["wonders"]);
            for (i, a) in ws.iter().enumerate() {
                if ws[i + 1..].iter().any(|b| b.wonder_id == a.wonder_id) {
                    has_dup = true;
                }
            }
            if has_dup {
                dup_cases += 1;
            }
            let mut extreme = false;
            for w in &ws {
                if w.owner_id == i32::MAX || w.owner_id == i32::MIN {
                    extreme = true;
                }
            }
            if inp["turn"].as_i64() == Some(i32::MAX as i64) || extreme {
                extreme_cases += 1;
            }
        }
    }
    assert!(dup_cases >= 10, "za malo duplikatow wonderId: {dup_cases}");
    assert!(
        extreme_cases >= 10,
        "za malo duzych ID / tur: {extreme_cases}"
    );
}

#[test]
fn dlug_duplikaty_wonderid_pierwsze_dopasowanie() {
    // Zachowanie TS `applyWonderTransfers` (`find`): plan ma dwa wpisy o tym samym wonderId, ale
    // `apply` przenosi tylko PIERWSZE dopasowanie; drugi wpis nie przenosi (from != aktualny wlasciciel).
    let mut wonders = vec![
        TransferableWonder {
            wonder_id: "dup".into(),
            q: 0,
            r: 0,
            owner_id: 1,
        },
        TransferableWonder {
            wonder_id: "dup".into(),
            q: 1,
            r: 0,
            owner_id: 1,
        },
    ];
    let nodes_before = vec![WonderTerritoryNode {
        q: 0,
        r: 0,
        radius: 5,
        owner_id: 1,
        is_fort: false,
        is_outpost: false,
    }];
    let nodes_after = vec![WonderTerritoryNode {
        owner_id: 2,
        ..nodes_before[0].clone()
    }];
    let before = begin_wonder_transfer_watch(&wonders, &nodes_before, None, stub_owner_at).unwrap();
    assert_eq!(before.get("dup"), Some(&Some(1)));
    let out = settle_wonder_transfer(
        Some(&before),
        &mut wonders,
        &nodes_after,
        stub_owner_at,
        7,
        3,
        |_| None,
    );
    // Plan: 2 wpisy (oba z from=1 -> to=2); apply: tylko pierwszy przenosi.
    assert_eq!(out.events.len(), 2, "plan ma wpis dla kazdego wystapienia");
    assert_eq!(
        out.transferred, 1,
        "apply przenosi tylko pierwsze dopasowanie"
    );
    assert_eq!(wonders[0].owner_id, 2);
    assert_eq!(
        wonders[1].owner_id, 1,
        "drugi wpis o tym samym wonderId nie przenosi"
    );
    assert_eq!(out.ui_calls.len(), 3);
}

#[test]
fn dlug_wartosci_skrajne_i32() {
    // Duze ID wlascicieli przechodza przez plan i apply bez przepelnienia (granice i32).
    // Dodatni skrajny przypadek: MAX-1 -> MAX (cywilizacja, owner_id >= 0), tura = i32::MAX.
    let mut wonders = vec![TransferableWonder {
        wonder_id: "big".into(),
        q: 0,
        r: 0,
        owner_id: i32::MAX - 1,
    }];
    let nodes_before = vec![WonderTerritoryNode {
        q: 0,
        r: 0,
        radius: 1,
        owner_id: i32::MAX - 1,
        is_fort: false,
        is_outpost: false,
    }];
    let nodes_after = vec![WonderTerritoryNode {
        owner_id: i32::MAX,
        ..nodes_before[0].clone()
    }];
    let before = begin_wonder_transfer_watch(&wonders, &nodes_before, None, stub_owner_at).unwrap();
    assert_eq!(before.get("big"), Some(&Some(i32::MAX - 1)));
    let out = settle_wonder_transfer(
        Some(&before),
        &mut wonders,
        &nodes_after,
        stub_owner_at,
        i32::MAX,
        i32::MAX,
        |_| None,
    );
    assert_eq!(out.transferred, 1);
    assert_eq!(wonders[0].owner_id, i32::MAX);
    assert_eq!(out.events[0].transfer.from_owner_id, i32::MAX - 1);
    assert_eq!(out.events[0].transfer.to_owner_id, i32::MAX);
    assert_eq!(
        out.events[0].notice.as_ref().map(|n| n.variant),
        Some("mine"),
        "me_owner_id == MAX: przejecie przez gracza"
    );
    assert!(out.events[0]
        .log_line
        .starts_with("[Cuda] Tura 2147483647:"));

    // Ujemny skrajny przypadek: wlasciciel cudu MIN (nie-cywilizacja), PRZED != wlasciciel -> brak spojnosci.
    let mut wonders_min = vec![TransferableWonder {
        wonder_id: "neg".into(),
        q: 0,
        r: 0,
        owner_id: i32::MIN,
    }];
    let before_min =
        begin_wonder_transfer_watch(&wonders_min, &nodes_after, None, stub_owner_at).unwrap();
    let out_min = settle_wonder_transfer(
        Some(&before_min),
        &mut wonders_min,
        &nodes_after,
        stub_owner_at,
        i32::MAX,
        i32::MAX,
        |_| None,
    );
    assert_eq!(
        out_min.transferred, 0,
        "MIN nie jest cywilizacja: brak przeniesienia"
    );
    assert_eq!(wonders_min[0].owner_id, i32::MIN);
}
