//! R-RUSTPORT-P6-RANGED-DAMAGE-NAN-Q1 -- `rangedShotDamage` z pinu 07d2fbd72 (combat.ts:485-495)
//! dla NaN/Infinity: `Math.max(1, Math.round(raw))` propaguje NaN i Infinity.
//!
//! Wektory: `p6_ranged_damage_nan_vectors/ranged.json`, wygenerowane przez
//! `p6_ranged_damage_nan_gen.mjs` z WYKONANIA tekstu pinu (straznik SHA-256 w generatorze).
//! Test na poziomie fazy dystansowej: NaN trafienia/obrazen zachowuje sie jak na pinie
//! (`roll < NaN` jest false -> pudlo; NaN obrazen -> NaN HP celu; Infinity -> HP = -Infinity).
//!
//! Wartosci NaN/Infinity w JSON sa napisami: "NaN", "Infinity", "-Infinity".

use civ_engine::domain::combat::ranged_phase::{
    resolve_ranged_phase, RangedPhaseInput, RangedSide, Side,
};
use civ_engine::domain::unit_power::ranged_shot_damage_f64;
use serde_json::Value;

const VEC: &str = include_str!("p6_ranged_damage_nan_vectors/ranged.json");

fn num(v: &Value, key: &str) -> f64 {
    match &v[key] {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => panic!("nieznany napis liczbowy {other}"),
        },
        other => panic!("pole {key} musi byc liczba, jest {other}"),
    }
}

fn opt(v: &Value, key: &str) -> Option<String> {
    v[key].as_str().map(str::to_owned)
}

#[allow(clippy::too_many_arguments)]
fn side(
    typ: Option<&str>,
    jed: Option<&str>,
    is_ranged: bool,
    ammo: i64,
    hp: f64,
    melee: f64,
    missile: f64,
    melee_defence: f64,
    armor: f64,
    counter: f64,
) -> RangedSide {
    RangedSide {
        counter_typ: typ.map(str::to_owned),
        typ_nazwa: jed.map(str::to_owned),
        is_ranged,
        ammo,
        hp,
        melee_attack: melee,
        missile_attack: missile,
        melee_defence,
        armor,
        counter_mult: counter,
        rout_threshold: 0.0,
        unbreakable: false,
    }
}

#[test]
fn p6_ranged_damage_nan_wektory_z_pinu_zgodne() {
    let root: Value = serde_json::from_str(VEC).expect("ranged.json");
    let rows = root["rows"].as_array().expect("rows");
    assert!(rows.len() >= 200, "za malo wektorow: {}", rows.len());
    let nan_expected = rows.iter().filter(|r| r["expected"] == "NaN").count();
    let inf_expected = rows.iter().filter(|r| r["expected"] == "Infinity").count();
    assert!(
        nan_expected >= 20,
        "wektory musza zawierac NaN: {nan_expected}"
    );
    assert!(
        inf_expected >= 20,
        "wektory musza zawierac Infinity: {inf_expected}"
    );

    for row in rows {
        let typ = opt(row, "typ");
        let jed = opt(row, "jednostka");
        let missile = num(row, "missile");
        let armor = num(row, "armor");
        let counter = num(row, "counter");
        let exp = num(row, "expected");
        let got = ranged_shot_damage_f64(typ.as_deref(), jed.as_deref(), missile, armor, counter);
        let ctx = format!("rangedShotDamage: {row}");
        if exp.is_nan() {
            assert!(got.is_nan(), "oczekiwano NaN, jest {got}: {ctx}");
        } else {
            assert_eq!(got, exp, "{ctx}");
        }
    }
}

#[test]
fn p6_ranged_damage_nan_jawne_przypadki_js() {
    // Math.max(1, Math.round(NaN)) === NaN.
    assert!(ranged_shot_damage_f64(None, None, f64::NAN, 0.0, 1.0).is_nan());
    assert!(ranged_shot_damage_f64(None, None, 10.0, f64::NAN, 1.0).is_nan());
    assert!(ranged_shot_damage_f64(None, None, 10.0, 0.0, f64::NAN).is_nan());
    // Math.round(Infinity) === Infinity; Math.max(1, Infinity) === Infinity.
    assert_eq!(
        ranged_shot_damage_f64(None, None, f64::INFINITY, 0.0, 1.0),
        f64::INFINITY
    );
    // Ujemna kontra: raw < 0 -> podloga 1 (Math.max(1, -x) === 1).
    assert_eq!(ranged_shot_damage_f64(None, None, 10.0, 0.0, -2.0), 1.0);
    // Zero: raw = 0 -> podloga 1.
    assert_eq!(ranged_shot_damage_f64(None, None, 0.0, 0.0, 0.0), 1.0);
    // Math.round(2.5) === 3 (polowki w strone +Infinity).
    assert_eq!(ranged_shot_damage_f64(None, None, 2.5, 0.0, 1.0), 3.0);
    // Procarz x3: (20 - 5) * 1 * 3 = 45.
    assert_eq!(
        ranged_shot_damage_f64(Some("Slinger"), Some("Procarz"), 20.0, 5.0, 1.0),
        45.0
    );
}

/// Regresja (NIE test wektorowy pinu i NIE dowod znaku zera):
/// pancerz -0 daje ten sam wynik co pancerz +0 (JS: `10 - (-0) === 10 === 10 - (+0)`).
/// Znak zera w wyniku ranged jest NIEOBSERWOWALNY: wynik to `js_max(1, ...)`, czyli NaN,
/// Infinity albo liczba >= 1, nigdy zero. Znak zera `js_max`/`js_min` sprawdzaja
/// wektory pinu bit-w-bit w `p6_js_max_sign.rs` (w tym przypadki -0).
#[test]
fn p6_ranged_damage_nan_pancerz_minus_zero_rowny_plus_zero() {
    let armor_minus = ranged_shot_damage_f64(None, None, 10.0, -0.0, 1.0);
    let armor_plus = ranged_shot_damage_f64(None, None, 10.0, 0.0, 1.0);
    assert_eq!(armor_minus, 10.0);
    assert_eq!(armor_minus, armor_plus);
    // Podloga 1 (Math.max(1, x)) dla zerowego missile i zerowych kontr o znaku zera.
    assert_eq!(ranged_shot_damage_f64(None, None, -0.0, -0.0, -0.0), 1.0);
    assert_eq!(ranged_shot_damage_f64(None, None, -0.0, 0.0, 1.0), 1.0);
}

#[test]
fn p6_ranged_damage_nan_roll_mniejsze_od_nan_to_pudlo() {
    // Celnosc NaN (melee NaN): hitChanceTw(NaN) = NaN; `roll < NaN` jest false -> pudlo, bez obrazen.
    let attacker = side(
        Some("Distance"),
        Some("Oszczepnik"),
        true,
        3,
        100.0,
        f64::NAN,
        10.0,
        0.0,
        0.0,
        1.0,
    );
    let defender = side(None, None, false, 0, 100.0, 5.0, 0.0, 5.0, 2.0, 1.0);
    let res = resolve_ranged_phase(
        RangedPhaseInput {
            attacker,
            defender,
            def_final_obrona: 10.0,
            river_mult: 1.0,
            max_rounds: 200,
            start_rounds: 0,
        },
        || 0.0, // roll = 0, najmniejszy mozliwy: nawet wtedy NaN nie trafia
    );
    assert_eq!(res.shots.len(), 3);
    for s in &res.shots {
        assert!(s.hit_pct.is_nan(), "hit_pct NaN");
        assert!(!s.hit, "roll < NaN jest false");
        assert_eq!(s.damage, 0.0);
    }
    assert_eq!(res.hp_defender, 100.0);
    assert!(res.routed.is_empty());
}

#[test]
fn p6_ranged_damage_nan_obrazenia_nan_zeruja_hp_jak_na_pinie() {
    // Pancerz celu NaN: trafienie (roll 0 < 60) z obrazeniami NaN -> hpDef -= NaN -> HP NaN (jak na pinie).
    let attacker = side(
        Some("Distance"),
        Some("Oszczepnik"),
        true,
        1,
        100.0,
        10.0,
        20.0,
        0.0,
        0.0,
        1.0,
    );
    let defender = side(None, None, false, 0, 100.0, 5.0, 0.0, 0.0, f64::NAN, 1.0);
    let res = resolve_ranged_phase(
        RangedPhaseInput {
            attacker,
            defender,
            def_final_obrona: 0.0,
            river_mult: 1.0,
            max_rounds: 200,
            start_rounds: 0,
        },
        || 0.0,
    );
    assert_eq!(res.shots.len(), 1);
    let s = &res.shots[0];
    assert!(s.hit, "roll 0 < hit_pct 60 -> trafienie");
    assert!(s.damage.is_nan(), "obrazenia NaN");
    assert!(s.target_hp.is_nan());
    assert!(res.hp_defender.is_nan());
    assert!(
        res.routed.is_empty(),
        "porownania z NaN sa false: brak rozbicia"
    );
}

#[test]
fn p6_ranged_damage_nan_kontra_nan_zeruje_hp_jak_na_pinie() {
    // Kontra NaN (ctrAtkVsDef): raw = NaN -> obrazenia NaN -> HP NaN.
    let attacker = side(
        Some("Distance"),
        Some("Oszczepnik"),
        true,
        1,
        100.0,
        10.0,
        20.0,
        0.0,
        0.0,
        f64::NAN,
    );
    let defender = side(None, None, false, 0, 100.0, 5.0, 0.0, 0.0, 0.0, 1.0);
    let res = resolve_ranged_phase(
        RangedPhaseInput {
            attacker,
            defender,
            def_final_obrona: 0.0,
            river_mult: 1.0,
            max_rounds: 200,
            start_rounds: 0,
        },
        || 0.0,
    );
    assert_eq!(res.shots.len(), 1);
    assert!(res.shots[0].hit);
    assert!(res.shots[0].damage.is_nan());
    assert!(res.hp_defender.is_nan());
}

#[test]
fn p6_ranged_damage_nan_infinity_rozbija_jednostke() {
    // Atak dystansowy Infinity: celnosc Infinity -> clamp 75; roll 0 trafia; obrazenia Infinity;
    // HP celu = -Infinity; jednostka rozbita (HP <= 0).
    let attacker = side(
        Some("Distance"),
        Some("Oszczepnik"),
        true,
        1,
        100.0,
        0.0,
        f64::INFINITY,
        0.0,
        0.0,
        1.0,
    );
    let defender = side(None, None, false, 0, 100.0, 5.0, 0.0, 0.0, 5.0, 1.0);
    let res = resolve_ranged_phase(
        RangedPhaseInput {
            attacker,
            defender,
            def_final_obrona: 0.0,
            river_mult: 1.0,
            max_rounds: 200,
            start_rounds: 0,
        },
        || 0.0,
    );
    assert_eq!(res.shots.len(), 1);
    let s = &res.shots[0];
    assert!(s.hit);
    assert_eq!(s.hit_pct, 75.0);
    assert_eq!(s.damage, f64::INFINITY);
    assert_eq!(res.hp_defender, f64::NEG_INFINITY);
    assert_eq!(res.routed, vec![Side::Defender]);
}

#[test]
fn p6_ranged_damage_nan_skonczone_bez_zmian() {
    // Zwykla walka (wartosci skonczone): obrazenia calkowite i HP jak przed zmiana typu.
    let attacker = side(
        Some("Slinger"),
        Some("Procarz"),
        true,
        1,
        100.0,
        10.0,
        20.0,
        0.0,
        0.0,
        1.0,
    );
    let defender = side(None, None, false, 0, 100.0, 5.0, 0.0, 0.0, 5.0, 1.0);
    let res = resolve_ranged_phase(
        RangedPhaseInput {
            attacker,
            defender,
            def_final_obrona: 0.0,
            river_mult: 1.0,
            max_rounds: 200,
            start_rounds: 0,
        },
        || 0.0,
    );
    assert_eq!(res.shots[0].damage, 45.0);
    assert_eq!(res.hp_defender, 55.0);
}
