//! P6 COMBAT-NAN-INF (R-RUSTPORT-P6-NAN-INF-WEKTORY-Q1, #137) -- wektory pinu 07d2fbd72 dla NaN / Inf /
//! ulamkow w amunicji (`resolveAmmo`) i `maxRounds` (petla dystansu `resolveCombat`) porownane z
//! `ranged_phase::resolve_ranged_phase`.
//!
//! Wektory: `p6_combat_nan_inf_vectors/vectors.json`, wygenerowane przez `p6_combat_nan_inf_gen.mjs`
//! z WYKONANIA tekstu pinu (straznik SHA-256). Kazdy wiersz zawiera wejscia pinu, oczekiwane wyniki pinu
//! oraz pole `rust`:
//!   - `applicable = true`: Rust dostaje `ammoAtk` / `ammoDef` jako liczby calkowite. Dla NaN i +-Infinity
//!     jest to WARTOSC ZASTEPCZA (np. NaN -> 0, +Infinity -> 1000000), bo `ammo: i64` nie przenosi tych
//!     wartosci. Generator wykonal pin takze z zastepcza i sprawdzil, ze zdarzenia strzalow, HP, rundy i rout
//!     sa takie same jak dla oryginalu. Oczekiwane wyniki w `rust.expected` pochodza z tego przebiegu.
//!   - `applicable = false`: ulamki 0.5 i 2.5. Brak wartosci calkowitej w i64, a zaokraglenie to niewdrozona
//!     decyzja techniczna (recon NAN-INF-AMUNICJA-ROZPOZNANIE §4). NIE_ZMIERZONO po stronie Rust.
//!
//! Poza zakresem (NIE_ZMIERZONO): log tekstowy pinu (naglowek `=== Faza dystansowa ===`, komunikat limitu)
//! jest sprawdzany tylko w generatorze (Rust nie produkuje logu); flaga dystansowa (`isRangedUnit`) jest
//! wejsciem Rusta (`is_ranged`), wyprowadzonym z `missileAttack > 0` w generatorze na podstawie pinu.
//!
//! Limit krokow: kazda petla konczy sie przez `max_rounds` (w wektorach 5) albo brak amunicji / HP / rout;
//! generator nie produkuje wierszy bez limitu. Losowania: zapisana sekwencja, brak losowania = panika.

use civ_engine::domain::combat::ranged_phase::{
    resolve_ranged_phase, RangedPhaseInput, RangedPhaseResult, RangedSide, Side,
};
use serde_json::Value;

const VEC: &str = include_str!("p6_combat_nan_inf_vectors/vectors.json");

/// Liczba wierszy, dla ktorych Rust mierzy wynik (wszystkie z `rust.applicable = true`).
const EXPECTED_MEASURED: usize = 16;
/// Wiersze pin-only (ulamki), oczekiwane w tej kolejnosci.
const EXPECTED_NOT_MEASURED: [&str; 2] = ["V-A1-0.5", "V-A1-2.5"];

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

fn field(obj: &Value, key: &str) -> f64 {
    num(&obj[key])
}

fn opt(obj: &Value, key: &str) -> Option<String> {
    obj[key].as_str().map(str::to_owned)
}

/// Rownosc jak w JS dla wartosci zmiennoprzecinkowych: NaN == NaN, a zera rozroznione po znaku.
fn same(got: f64, exp: f64) -> bool {
    if exp.is_nan() {
        got.is_nan()
    } else {
        got.to_bits() == exp.to_bits()
    }
}

fn side_name(s: Side) -> &'static str {
    match s {
        Side::Attacker => "attacker",
        Side::Defender => "defender",
    }
}

fn build_input(row: &Value) -> RangedPhaseInput {
    let i = &row["pin"]["input"];
    let rust = &row["rust"];
    let atk_u = &i["attacker"];
    let def_u = &i["defender"];
    let attacker = RangedSide {
        counter_typ: opt(atk_u, "counterTyp"),
        typ_nazwa: opt(atk_u, "typNazwa"),
        is_ranged: i["atkIsRanged"].as_bool().expect("atkIsRanged"),
        ammo: rust["ammoAtk"].as_i64().expect("rust.ammoAtk"),
        hp: field(i, "hpAtk"),
        melee_attack: field(i, "atkMelee0"),
        missile_attack: field(i, "atkMissile0"),
        // Obrona atakujacego: cel strzalu obroncy (`hitChanceTw(..., atkObrona0)`).
        melee_defence: field(i, "atkObrona0"),
        // Pancerz atakujacego: cel strzalu obroncy (`rangedShotDamage(defender, defMissile0, atkPanc0, ...)`).
        armor: field(i, "atkPanc0"),
        counter_mult: field(i, "ctrAtkVsDef"),
        rout_threshold: field(i, "routAtk"),
        unbreakable: atk_u["unbreakable"].as_bool().unwrap_or(false),
    };
    let defender = RangedSide {
        counter_typ: opt(def_u, "counterTyp"),
        typ_nazwa: opt(def_u, "typNazwa"),
        is_ranged: i["defIsRanged"].as_bool().expect("defIsRanged"),
        ammo: rust["ammoDef"].as_i64().expect("rust.ammoDef"),
        hp: field(i, "hpDef"),
        melee_attack: field(i, "defMelee0"),
        missile_attack: field(i, "defMissile0"),
        // Obrona obroncy nie jest czytana przez strzal atakujacego (tam uzywane jest `defFinalObrona`).
        melee_defence: 0.0,
        // Pancerz obroncy: cel strzalu atakujacego (`rangedShotDamage(attacker, atkMissile0, defPanc0, ...)`).
        armor: field(i, "defPanc0"),
        counter_mult: field(i, "ctrDefVsAtk"),
        rout_threshold: field(i, "routDef"),
        unbreakable: def_u["unbreakable"].as_bool().unwrap_or(false),
    };
    RangedPhaseInput {
        attacker,
        defender,
        def_final_obrona: field(i, "defFinalObrona"),
        river_mult: field(i, "terrRiverMult"),
        max_rounds: u32::try_from(i["maxRounds"].as_u64().expect("maxRounds"))
            .expect("maxRounds mieści się w u32"),
        start_rounds: u32::try_from(i["totalRounds"].as_u64().expect("totalRounds"))
            .expect("totalRounds mieści się w u32"),
    }
}

/// Uruchamia fazę dystansową z zapisaną sekwencja losowan. Zwraca wynik i liczbe zuzytych losowan.
fn run_row(row: &Value) -> (RangedPhaseResult, usize) {
    let draws: Vec<f64> = row["draws"]
        .as_array()
        .expect("draws")
        .iter()
        .map(num)
        .collect();
    let mut idx = 0usize;
    let res = resolve_ranged_phase(build_input(row), || {
        let v = *draws
            .get(idx)
            .unwrap_or_else(|| panic!("brak losowania nr {idx} (wektor zuzywa wiecej)"));
        idx += 1;
        v
    });
    (res, idx)
}

fn check_row(n: usize, row: &Value) {
    let id = row["id"].as_str().unwrap_or("?");
    let ctx = format!("{id} (wiersz {n})");
    let (res, used) = run_row(row);
    let exp = &row["rust"]["expected"];
    let exp_shots = exp["shots"].as_array().expect("rust.expected.shots");

    // Jedno losowanie na strzal: zuzycie = liczba strzalow w pinie.
    assert_eq!(used, exp_shots.len(), "{ctx}: zuzycie losowan");
    assert!(
        same(res.hp_attacker, field(exp, "hpAtk")),
        "{ctx}: HP atakujacego {} != pin {}",
        res.hp_attacker,
        field(exp, "hpAtk")
    );
    assert!(
        same(res.hp_defender, field(exp, "hpDef")),
        "{ctx}: HP obroncy {} != pin {}",
        res.hp_defender,
        field(exp, "hpDef")
    );
    assert_eq!(
        res.ammo_attacker,
        exp["ammoAtk"].as_i64().expect("rust.expected.ammoAtk"),
        "{ctx}: amunicja atakujacego po walce"
    );
    assert_eq!(
        res.ammo_defender,
        exp["ammoDef"].as_i64().expect("rust.expected.ammoDef"),
        "{ctx}: amunicja obroncy po walce"
    );
    assert_eq!(
        u64::from(res.rounds),
        exp["rounds"].as_u64().expect("rounds"),
        "{ctx}: rundy (m+1 po trafieniu w limit)"
    );
    let routed: Vec<&str> = res.routed.iter().map(|s| side_name(*s)).collect();
    let exp_routed: Vec<&str> = exp["routed"]
        .as_array()
        .expect("routed")
        .iter()
        .map(|v| v.as_str().expect("routed: napis"))
        .collect();
    assert_eq!(routed, exp_routed, "{ctx}: rout");

    assert_eq!(res.shots.len(), exp_shots.len(), "{ctx}: liczba strzalow");
    for (k, (got, e)) in res.shots.iter().zip(exp_shots.iter()).enumerate() {
        assert_eq!(
            side_name(got.side),
            e["side"].as_str().unwrap(),
            "{ctx}: strona strzalu {k}"
        );
        assert_eq!(
            u64::from(got.round),
            e["round"].as_u64().unwrap(),
            "{ctx}: runda strzalu {k}"
        );
        assert_eq!(
            got.hit,
            e["hit"].as_bool().unwrap(),
            "{ctx}: trafienie strzalu {k}"
        );
        assert!(
            same(got.hit_pct, field(e, "hitPct")),
            "{ctx}: hitPct strzalu {k}: {} != pin {}",
            got.hit_pct,
            field(e, "hitPct")
        );
        assert!(
            same(got.damage, field(e, "damage")),
            "{ctx}: obrazenia strzalu {k}: {} != pin {}",
            got.damage,
            field(e, "damage")
        );
        // Chybienie: pin nie loguje HP celu (targetHp = null), wiec porownanie tylko gdy pin je podaje.
        if !e["targetHp"].is_null() {
            assert!(
                same(got.target_hp, field(e, "targetHp")),
                "{ctx}: HP celu po strzale {k}: {} != pin {}",
                got.target_hp,
                field(e, "targetHp")
            );
        }
    }
}

fn cases() -> Vec<Value> {
    let doc: Value = serde_json::from_str(VEC).expect("p6_combat_nan_inf_vectors/vectors.json");
    doc["cases"].as_array().expect("cases").clone()
}

#[test]
fn nan_inf_applicable_rows_match_pin() {
    let cases = cases();
    let mut measured = 0usize;
    for (n, row) in cases.iter().enumerate() {
        if row["rust"]["applicable"].as_bool() == Some(true) {
            check_row(n, row);
            measured += 1;
        }
    }
    assert_eq!(measured, EXPECTED_MEASURED, "liczba zmierzonych wierszy");
}

#[test]
fn nan_inf_fractional_rows_are_recorded_not_measured() {
    // Ulamki (0.5, 2.5): brak wartosci calkowitej w i64 -> NIE_ZMIERZONO po stronie Rust (recon §4).
    let cases = cases();
    let not_measured: Vec<&str> = cases
        .iter()
        .filter(|r| r["rust"]["applicable"].as_bool() != Some(true))
        .map(|r| r["id"].as_str().expect("id"))
        .collect();
    assert_eq!(not_measured, EXPECTED_NOT_MEASURED.to_vec());
    for row in cases
        .iter()
        .filter(|r| r["rust"]["applicable"].as_bool() != Some(true))
    {
        let reason = row["rust"]["skip"].as_str().unwrap_or("");
        assert!(
            !reason.is_empty(),
            "brak powodu NIE_ZMIERZONO dla {}",
            row["id"]
        );
    }
}

#[test]
fn nan_inf_vectors_cover_all_groups() {
    // Zakres zlecony: V-A1 (8), V-A2 (1), V-A3 (1), V-K2 (8).
    let cases = cases();
    let count = |g: &str| {
        cases
            .iter()
            .filter(|r| r["group"].as_str() == Some(g))
            .count()
    };
    assert_eq!(count("V-A1"), 8, "V-A1: wartosci ammoAtk");
    assert_eq!(count("V-A2"), 1, "V-A2: NaN vs ammoDef 3");
    assert_eq!(count("V-A3"), 1, "V-A3: +Inf, maxRounds 5");
    assert_eq!(
        count("V-K2"),
        8,
        "V-K2: jednostki missileAttack > 0 bez amunicji"
    );
}

#[test]
fn k2_ranged_flag_with_no_ammo_yields_no_shots_and_no_rounds() {
    // V-K2: dystansowa flaga (`is_ranged = true`) z amunicja '—' (0): zero strzalow i zero rund.
    let cases = cases();
    let k2: Vec<&Value> = cases
        .iter()
        .filter(|r| r["group"].as_str() == Some("V-K2"))
        .collect();
    assert_eq!(k2.len(), 8);
    for row in k2 {
        let (res, used) = run_row(row);
        assert_eq!(used, 0, "{}: brak losowan", row["id"]);
        assert!(res.shots.is_empty(), "{}: brak strzalow", row["id"]);
        assert_eq!(res.rounds, 0, "{}: brak rund", row["id"]);
        assert_eq!(res.ammo_attacker, 0, "{}: amunicja atakujacego", row["id"]);
        assert!(res.routed.is_empty(), "{}: brak rout", row["id"]);
    }
}
