//! Scratch measurement (NOT committed): breakdown of the snapshot size,
//! key-name overhead, sensitivity to assumed unit/city density, validate()
//! time, and JSON dumps for external compression checks.

#[path = "../tests/common/mod.rs"]
mod common;

use common::{synthetic_view, Scenario, SCENARIOS};
use serde_json::Value;
use std::time::{Duration, Instant};

const RUNS: usize = 15;

fn median(mut v: Vec<Duration>) -> f64 {
    v.sort();
    v[v.len() / 2].as_secs_f64() * 1000.0
}

/// Bytes spent on object keys (`"key":`) in a JSON value.
fn key_bytes(v: &Value) -> usize {
    match v {
        Value::Object(m) => m
            .iter()
            .map(|(k, x)| serde_json::to_string(k).unwrap().len() + 1 + key_bytes(x))
            .sum(),
        Value::Array(a) => a.iter().map(key_bytes).sum(),
        _ => 0,
    }
}

/// Same value with every object turned into an array of its values (positional
/// encoding, an alternative the contract does not define; estimate only).
fn positional(v: &Value) -> Value {
    match v {
        Value::Object(m) => Value::Array(m.values().map(positional).collect()),
        Value::Array(a) => Value::Array(a.iter().map(positional).collect()),
        x => x.clone(),
    }
}

fn main() {
    let dump = std::env::args().nth(1);
    println!("== A. podzial pelnego JSON (B) i narzut nazw kluczy ==");
    println!("| scenariusz | pelny | map | hexState | fog | owners | cities | units | stacks | territory | overlays+reszta | klucze w pelnym | klucze % | pozycyjny pelny | pozycyjny hexState | B/miasto | B/jednostka |");
    println!("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
    for s in &SCENARIOS {
        let view = synthetic_view(s);
        let full = serde_json::to_string(&view).unwrap();
        let v: Value = serde_json::from_str(&full).unwrap();
        let part = |k: &str| serde_json::to_string(&v[k]).unwrap().len();
        let (map, hs, fog, ow, ci, un, st, te) = (
            part("map"),
            part("hexState"),
            part("fog"),
            part("owners"),
            part("cities"),
            part("units"),
            part("stacks"),
            part("territory"),
        );
        let rest = full.len() - (map + hs + fog + ow + ci + un + st + te);
        let kb = key_bytes(&v);
        let pos_full = serde_json::to_string(&positional(&v)).unwrap().len();
        let pos_hs = serde_json::to_string(&positional(&v["hexState"])).unwrap().len();
        let nc = view.cities.len();
        let nu = view.units.len();
        println!(
            "| {} | {} | {} | {} | {} | {} | {} | {} | {} | {} | {} | {} | {:.1} | {} | {} | {} | {} |",
            s.name,
            full.len(),
            map,
            hs,
            fog,
            ow,
            ci,
            un,
            st,
            te,
            rest,
            kb,
            100.0 * kb as f64 / full.len() as f64,
            pos_full,
            pos_hs,
            if nc > 0 { format!("{:.0}", ci as f64 / nc as f64) } else { "-".into() },
            if nu > 0 { format!("{:.0}", un as f64 / nu as f64) } else { "-".into() },
        );
        if let Some(dir) = &dump {
            let tag = format!("{}_{}", s.hexes(), if s.owners > 0 { "late" } else { "empty" });
            std::fs::write(format!("{dir}/full_{tag}.json"), &full).unwrap();
            let (_, layers) = view.clone().split();
            std::fs::write(
                format!("{dir}/layers_{tag}.json"),
                serde_json::to_string(&layers).unwrap(),
            )
            .unwrap();
        }
    }

    println!();
    println!("== B. wrazliwosc na zalozenia gestosci (8000 heksow, 8 wlascicieli) ==");
    println!("| heksy/miasto | heksy/jednostke | miasta | jednostki | pelny [B] | warstwy [B] | B/heks pelny | ser. pelny [ms] | ser. warstwy [ms] | validate [ms] |");
    println!("|---|---|---|---|---|---|---|---|---|---|");
    for (hpc, hpu) in [(120, 24), (60, 12), (60, 6), (30, 6), (30, 3)] {
        let s = Scenario {
            name: "sens",
            width: 100,
            height: 80,
            owners: 8,
            hexes_per_city: hpc,
            hexes_per_unit: hpu,
        };
        let view = synthetic_view(&s);
        view.validate().expect("valid");
        let full = serde_json::to_string(&view).unwrap();
        let (_, layers) = view.clone().split();
        let lj = serde_json::to_string(&layers).unwrap();
        let (mut a, mut b, mut c) = (Vec::new(), Vec::new(), Vec::new());
        for _ in 0..RUNS {
            let t = Instant::now();
            let x = serde_json::to_string(&view).unwrap();
            a.push(t.elapsed());
            std::hint::black_box(x);
            let t = Instant::now();
            let x = serde_json::to_string(&layers).unwrap();
            b.push(t.elapsed());
            std::hint::black_box(x);
            let t = Instant::now();
            view.validate().unwrap();
            c.push(t.elapsed());
        }
        println!(
            "| {} | {} | {} | {} | {} | {} | {:.1} | {:.2} | {:.2} | {:.3} |",
            hpc,
            hpu,
            view.cities.len(),
            view.units.len(),
            full.len(),
            lj.len(),
            full.len() as f64 / s.hexes() as f64,
            median(a),
            median(b),
            median(c)
        );
    }
}
