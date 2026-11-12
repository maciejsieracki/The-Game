//! P6 SIEGE-TAKTYKA K5g0 (#217): testy zgodnosci `domain::siege_tactics_autophase::resolve_auto_batch_phase`
//! z `gra/src/battle/autoBatchPhase.ts` (pin `07d2fbd72`).
//!
//! Wektory: `p6_siege_tactics_autophase_vectors/vectors.json`, generowane przez `p6_siege_tactics_autophase_gen.mjs`
//! przez WYKONANIE calego pliku pinu (po stripTypeScriptTypes), z straznikiem SHA-256 zrodla.
//! Wartosci nieskonczone sa w JSON jako napisy "NaN", "Infinity", "-Infinity"; `undefined` jest pomijane.
//!
//! Pokrycie: test liczy kategorie wyjsc (`meta`) i wymaga, by kazda kategoria wystapila w wektorach.
//! To NIE jest pomiar pokrycia linii (V8/llvm-cov nie uruchomiono): NIE_ZMIERZONO.

use civ_engine::domain::siege_tactics_autophase::{
    resolve_auto_batch_phase, AutoBatchIntent, AutoBatchIntentKind, AutoBatchPhase,
    AutoBatchResolution, AutoBatchStep, AutoBatchUnitSnapshot,
};
use std::collections::BTreeMap;

const VECTORS: &str = include_str!("p6_siege_tactics_autophase_vectors/vectors.json");

fn load() -> serde_json::Value {
    serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em")
}

/// Liczba z JSON: zwykla liczba albo napis dla NaN/Infinity (generator).
fn num(v: &serde_json::Value) -> f64 {
    if let Some(x) = v.as_f64() {
        return x;
    }
    match v.as_str().expect("liczba lub napis") {
        "NaN" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        other => other.parse().expect("liczba w napisie"),
    }
}

fn phase(s: &str) -> AutoBatchPhase {
    match s {
        "atk" => AutoBatchPhase::Atk,
        "def" => AutoBatchPhase::Def,
        other => panic!("strona {other}"),
    }
}

fn kind(s: &str) -> AutoBatchIntentKind {
    match s {
        "hold" => AutoBatchIntentKind::Hold,
        "move" => AutoBatchIntentKind::Move,
        "attack" => AutoBatchIntentKind::Attack,
        other => panic!("rodzaj {other}"),
    }
}

fn kind_name(k: AutoBatchIntentKind) -> &'static str {
    match k {
        AutoBatchIntentKind::Hold => "hold",
        AutoBatchIntentKind::Move => "move",
        AutoBatchIntentKind::Attack => "attack",
    }
}

fn phase_name(p: AutoBatchPhase) -> &'static str {
    match p {
        AutoBatchPhase::Atk => "atk",
        AutoBatchPhase::Def => "def",
    }
}

fn flag(v: &serde_json::Value, key: &str) -> bool {
    v.get(key).and_then(|x| x.as_bool()).unwrap_or(false)
}

fn parse_steps(v: &serde_json::Value) -> Vec<AutoBatchStep> {
    v.as_array()
        .map(|arr| {
            arr.iter()
                .map(|s| AutoBatchStep {
                    col: num(&s["col"]),
                    row: num(&s["row"]),
                })
                .collect()
        })
        .unwrap_or_default()
}

fn parse_unit(v: &serde_json::Value) -> AutoBatchUnitSnapshot {
    AutoBatchUnitSnapshot {
        id: v["id"].as_str().unwrap().to_string(),
        side: phase(v["side"].as_str().unwrap()),
        q: num(&v["q"]),
        r: num(&v["r"]),
        dead: flag(v, "dead"),
        fading_out: flag(v, "fadingOut"),
        routed: flag(v, "routed"),
        removed: flag(v, "removed"),
        acted: flag(v, "acted"),
        hp: v.get("hp").map(num),
        occupies: v.get("occupies").and_then(|x| x.as_bool()),
    }
}

fn parse_intent(v: &serde_json::Value) -> AutoBatchIntent {
    AutoBatchIntent {
        unit_id: v["unitId"].as_str().unwrap().to_string(),
        side: phase(v["side"].as_str().unwrap()),
        kind: kind(v["kind"].as_str().unwrap()),
        steps: parse_steps(&v["steps"]),
        target_id: v
            .get("targetId")
            .and_then(|x| x.as_str())
            .map(str::to_string),
    }
}

/// Porownanie liczb z dokladnoscia bitowa (NaN == NaN, -0 == 0 jak w JS `===` dla wynikow; tu wystarczy `==`
/// plus obsluga NaN).
fn same_num(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

fn same_resolution(got: &AutoBatchResolution, exp: &serde_json::Value) -> bool {
    let exp_steps = parse_steps(&exp["steps"]);
    let exp_target = exp
        .get("targetId")
        .and_then(|x| x.as_str())
        .map(str::to_string);
    got.unit_id == exp["unitId"].as_str().unwrap()
        && phase_name(got.side) == exp["side"].as_str().unwrap()
        && kind_name(got.kind) == exp["kind"].as_str().unwrap()
        && got.target_id == exp_target
        && got.blocked == exp["blocked"].as_bool().unwrap()
        && got.steps.len() == exp_steps.len()
        && got
            .steps
            .iter()
            .zip(exp_steps.iter())
            .all(|(g, e)| same_num(g.col, e.col) && same_num(g.row, e.row))
}

#[test]
fn wektory_auto_batch_zgodne_z_pinem() {
    let v = load();
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 300, "wektory: {}", cases.len());

    let mut cat: BTreeMap<&'static str, usize> = BTreeMap::new();
    for (i, c) in cases.iter().enumerate() {
        let p = phase(c["phase"].as_str().unwrap());
        let units_json = c["units"].as_array().unwrap();
        let intents_json = c["intents"].as_array().unwrap();
        let units: Vec<AutoBatchUnitSnapshot> = units_json.iter().map(parse_unit).collect();
        let intents: Vec<AutoBatchIntent> = intents_json.iter().map(parse_intent).collect();

        let got = resolve_auto_batch_phase(p, &units, &intents);
        let exp = c["expect"].as_array().expect("expect");
        assert_eq!(got.len(), exp.len(), "przypadek {i}: liczba rozstrzygniec");
        for (j, (g, e)) in got.iter().zip(exp.iter()).enumerate() {
            assert!(
                same_resolution(g, e),
                "przypadek {i} pozycja {j}: {g:?} != {e}"
            );
        }

        // Kategorie wyjsc (pokrycie galezi wyprowadzone z wejsc i wyjsc, nie z V8 coverage).
        for g in &got {
            let key = match (g.kind, g.blocked) {
                (AutoBatchIntentKind::Attack, false) => "attack:ok",
                (AutoBatchIntentKind::Hold, true) if g.target_id.is_none() => "blocked:hold",
                (AutoBatchIntentKind::Move, true) => "blocked:move-prefix",
                (AutoBatchIntentKind::Move, false) => "move:ok",
                (AutoBatchIntentKind::Hold, false) => "hold:copy",
                _ => "other",
            };
            *cat.entry(key).or_insert(0) += 1;
        }
        if units.iter().any(|u| u.hp.is_some_and(|h| !h.is_finite())) {
            *cat.entry("in:hp-nonfinite").or_insert(0) += 1;
        }
        if units.iter().any(|u| !u.q.is_finite() || !u.r.is_finite()) {
            *cat.entry("in:coord-nonfinite").or_insert(0) += 1;
        }
        if units.iter().any(|u| u.occupies == Some(false)) {
            *cat.entry("in:occupies-false").or_insert(0) += 1;
        }
        let mut seen = std::collections::HashSet::new();
        if intents
            .iter()
            .any(|it| !seen.insert((it.unit_id.clone(), phase_name(it.side))))
        {
            *cat.entry("in:duplicate-intent").or_insert(0) += 1;
        }
        if intents.iter().any(|it| it.target_id.as_deref() == Some("")) {
            *cat.entry("in:empty-target").or_insert(0) += 1;
        }
        if units.len() > got.len() {
            *cat.entry("skip:unit-filtered").or_insert(0) += 1;
        }
    }

    // Kazda galaz musi byc pokryta wektorami (kontrola, ze generator nie zubozal przypadkow).
    for key in [
        "attack:ok",
        "blocked:hold",
        "blocked:move-prefix",
        "move:ok",
        "hold:copy",
        "in:hp-nonfinite",
        "in:coord-nonfinite",
        "in:occupies-false",
        "in:duplicate-intent",
        "in:empty-target",
        "skip:unit-filtered",
    ] {
        assert!(
            cat.get(key).copied().unwrap_or(0) > 0,
            "brak pokrycia kategorii {key}: {cat:?}"
        );
    }
    eprintln!("K5g0 przypadki: {}", cases.len());
    for (k, n) in &cat {
        eprintln!("K5g0 kategoria {k}: {n}");
    }
}

#[test]
fn bariera_zajetego_kafelka_i_kolizja_sciezek() {
    // Zajety kafelek na poczatku fazy jest bariera, takze dla ruchu jednostki zajetej.
    let units = vec![
        AutoBatchUnitSnapshot {
            id: "a".into(),
            side: AutoBatchPhase::Atk,
            q: 0.0,
            r: 0.0,
            dead: false,
            fading_out: false,
            routed: false,
            removed: false,
            acted: false,
            hp: None,
            occupies: None,
        },
        AutoBatchUnitSnapshot {
            id: "b".into(),
            side: AutoBatchPhase::Atk,
            q: 1.0,
            r: 0.0,
            dead: false,
            fading_out: false,
            routed: false,
            removed: false,
            acted: false,
            hp: None,
            occupies: None,
        },
    ];
    let intents = vec![
        AutoBatchIntent {
            unit_id: "a".into(),
            side: AutoBatchPhase::Atk,
            kind: AutoBatchIntentKind::Move,
            steps: vec![AutoBatchStep { col: 1.0, row: 0.0 }],
            target_id: None,
        },
        AutoBatchIntent {
            unit_id: "b".into(),
            side: AutoBatchPhase::Atk,
            kind: AutoBatchIntentKind::Move,
            steps: vec![AutoBatchStep { col: 2.0, row: 0.0 }],
            target_id: None,
        },
    ];
    let got = resolve_auto_batch_phase(AutoBatchPhase::Atk, &units, &intents);
    assert_eq!(got.len(), 2);
    assert!(
        got[0].blocked && got[0].steps.is_empty(),
        "a wpada na zajety kafelek b"
    );
    assert!(
        !got[1].blocked && got[1].steps.len() == 1,
        "b rusza sie swobodnie"
    );
}
