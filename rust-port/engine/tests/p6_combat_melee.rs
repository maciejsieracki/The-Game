//! P6 COMBAT-MELEE-VEKTORY (R-RUSTPORT-P6-COMBAT-MELEE-VEKTORY-Q1) -- test STRUKTURALNY wektorow pinu
//! 07d2fbd72 dla fazy zwarcia (melee) `resolveCombat` (combat.ts, blok "Phase 1 & 2: Melee").
//!
//! Wektory: `p6_combat_melee_vectors/vectors.json`, wygenerowane przez `p6_combat_melee_gen.mjs`
//! z WYKONANIA tekstu pinu. Ten test NIE porownuje wynikow z portem (port fazy zwarcia jest w #136).
//! Sprawdza wyłacznie: straznik SHA-256 wyciętego tekstu pinu, zgodnosc liczników z zawartoscia
//! przypadkow oraz niepustosc (liczniki > 0).

use serde_json::Value;

const VEC: &str = include_str!("p6_combat_melee_vectors/vectors.json");

/// Straznik: SHA-256 wycietych fragmentow pinu (funkcje + blok fazy zwarcia), zapisany przez generator.
const EXPECT_FRAGMENT_SHA256: &str =
    "cab87df78457c3c2a2c320b9b92ad3eb602cf4be36a42b69834801993a2bf27e";
/// Straznik: SHA-256 combat-params.json w pinie.
const EXPECT_PARAMS_SHA256: &str =
    "5cc90d60c76da67039a1330261a00584933216c8ec80bff3db5183b05c07326e";

fn u(v: &Value, key: &str) -> u64 {
    v[key]
        .as_u64()
        .unwrap_or_else(|| panic!("counts.{key} musi byc liczba calkowita"))
}

/// Liczba w JSON: liczba albo napis ("NaN", "Infinity", "-Infinity", "-0", "0.5").
fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "-0" => -0.0,
            other => other
                .parse::<f64>()
                .unwrap_or_else(|_| panic!("nieznany napis liczbowy {other}")),
        },
        other => panic!("oczekiwano liczby, jest {other}"),
    }
}

#[test]
fn melee_vectors_guard_hashes_match_pin() {
    let root: Value = serde_json::from_str(VEC).expect("vectors.json jest poprawnym JSON");
    assert_eq!(
        root["source"]["fragmentSha256"].as_str(),
        Some(EXPECT_FRAGMENT_SHA256),
        "straznik: fragmenty pinu (faza zwarcia) zmienione wzgledem wektorow"
    );
    assert_eq!(
        root["source"]["paramsSha256"].as_str(),
        Some(EXPECT_PARAMS_SHA256),
        "straznik: combat-params.json zmieniony wzgledem wektorow"
    );
}

#[test]
fn melee_vectors_counts_agree_with_cases_and_are_nonempty() {
    let root: Value = serde_json::from_str(VEC).expect("vectors.json jest poprawnym JSON");
    let counts = &root["counts"];
    let cases = root["cases"].as_array().expect("cases jest tablica");

    let steps: Vec<&Value> = cases
        .iter()
        .flat_map(|c| c["expected"]["steps"].as_array().expect("steps").iter())
        .collect();
    let count_phase = |p: &str| steps.iter().filter(|s| s["phase"] == p).count() as u64;
    let count_hit = |h: bool| steps.iter().filter(|s| s["hit"] == h).count() as u64;

    assert_eq!(u(counts, "cases"), cases.len() as u64, "counts.cases");
    assert_eq!(u(counts, "steps"), steps.len() as u64, "counts.steps");
    assert_eq!(
        u(counts, "stepsCharge"),
        count_phase("charge"),
        "counts.stepsCharge"
    );
    assert_eq!(
        u(counts, "stepsMelee"),
        count_phase("melee"),
        "counts.stepsMelee"
    );
    assert_eq!(u(counts, "stepsHit"), count_hit(true), "counts.stepsHit");
    assert_eq!(u(counts, "stepsMiss"), count_hit(false), "counts.stepsMiss");
    assert_eq!(
        u(counts, "casesRouted"),
        cases
            .iter()
            .filter(|c| !c["expected"]["routed"]
                .as_array()
                .expect("routed")
                .is_empty())
            .count() as u64,
        "counts.casesRouted"
    );
    assert_eq!(
        u(counts, "casesLimitReached"),
        cases
            .iter()
            .filter(|c| c["expected"]["limitReached"] == true)
            .count() as u64,
        "counts.casesLimitReached"
    );
    // roll*100 === hitPct na poziomie kroku (ta sama arytmetyka IEEE co w generatorze JS).
    let roll_eq = steps
        .iter()
        .filter(|s| num(&s["roll"]) * 100.0 == num(&s["hitPct"]))
        .count() as u64;
    assert_eq!(u(counts, "stepsRollEq"), roll_eq, "counts.stepsRollEq");

    // Niepustosc (kryterium 2): przypadki i kroki zwarcia > 0.
    assert!(u(counts, "cases") > 0, "brak przypadkow");
    assert!(u(counts, "steps") > 0, "brak krokow zwarcia");
    assert!(u(counts, "stepsCharge") > 0, "brak krokow szarzy");
    assert!(u(counts, "stepsMelee") > 0, "brak krokow zwarcia (R2+)");
    assert!(u(counts, "stepsHit") > 0, "brak trafien");
    assert!(u(counts, "stepsMiss") > 0, "brak chybien");
    assert!(u(counts, "casesRouted") > 0, "brak przypadkow z rout");
    assert!(
        u(counts, "stepsRollEq") > 0,
        "brak przypadkow granicznych roll == hitPct"
    );
}

/// Wejscia (input) musza byc bez null i bez surowych liczb niecalkowitych: NaN/Infinity/-0
/// i niecalkowite wartosci zapisane jako napisy (generator: enc / encRec). Pola liczbowe
/// musza dac sie sparsowac przez `num`.
fn assert_input_encoded(v: &Value, path: &str, key: &str) {
    const NUM_KEYS: &[&str] = &[
        "meleeAttack",
        "meleeDefence",
        "armor",
        "chargeBonus",
        "weaponDamage",
        "piercing",
        "atk",
        "obrona",
        "pancerz",
        "uderzenie",
        "atkDiffMult",
        "defDiffMult",
        "terrRiverMult",
        "hpAtk",
        "hpDef",
        "defFinalObrona",
        "ctrAtkVsDef",
        "ctrDefVsAtk",
        "routAtk",
        "routDef",
    ];
    match v {
        Value::Null => panic!("{path}: null w wejsciu (NaN/Infinity zgubione przez JSON)"),
        Value::Number(n) => assert!(
            n.is_i64() || n.is_u64(),
            "{path}: surowa liczba niecalkowita {n} (wymagany napis)"
        ),
        Value::String(s) => {
            if NUM_KEYS.contains(&key) {
                let _ = num(v);
                assert!(!s.is_empty(), "{path}: pusty napis liczbowy");
            }
        }
        Value::Bool(_) => {}
        Value::Object(m) => {
            for (k, x) in m {
                assert_input_encoded(x, &format!("{path}.{k}"), k);
            }
        }
        Value::Array(a) => {
            for (i, x) in a.iter().enumerate() {
                assert_input_encoded(x, &format!("{path}[{i}]"), key);
            }
        }
    }
}

#[test]
fn melee_vectors_inputs_have_no_null_and_no_raw_floats() {
    let root: Value = serde_json::from_str(VEC).expect("vectors.json jest poprawnym JSON");
    for (i, c) in root["cases"].as_array().expect("cases").iter().enumerate() {
        for key in ["attacker", "defender", "modsCharge", "modsRound"] {
            assert_input_encoded(&c["input"][key], &format!("przypadek {i}.{key}"), key);
        }
    }
}

#[test]
fn melee_vectors_each_case_has_draw_per_step() {
    let root: Value = serde_json::from_str(VEC).expect("vectors.json jest poprawnym JSON");
    for (i, c) in root["cases"].as_array().expect("cases").iter().enumerate() {
        let steps = c["expected"]["steps"].as_array().expect("steps");
        let draws = c["draws"].as_array().expect("draws");
        assert_eq!(
            steps.len(),
            draws.len(),
            "przypadek {i}: jedno losowanie na krok"
        );
    }
}
