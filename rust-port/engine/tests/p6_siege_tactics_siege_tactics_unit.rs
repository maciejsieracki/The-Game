//! P6 SIEGE-TAKTYKA K5a (#217): testy zgodnosci `domain::siege_tactics_unit` z kodem weba.
//!
//! Wektory: `p6_siege_tactics_siege_tactics_unit_vectors/vectors.json`, generowane przez
//! `p6_siege_tactics_siege_tactics_unit_gen.mjs` przez WYKONANIE tekstu pinu `gra/src/battle/battleScene.ts`
//! (pin 07d2fbd72): `alive` (5617), `aliveA`/`aliveD` (10159-10160), `totalDead`, `out` (10263), `_checkRout`
//! (9783-9797) z `MORALE_TERRAIN_RESIST` (1143). Wartosci nieskonczone sa w JSON jako napisy "NaN", "Infinity", "-Infinity".

use civ_engine::domain::siege_tactics_unit::{
    alive_end, alive_power, effective_flee_threshold, is_out, should_rout, side_alive_end,
    total_dead, CombatUnit,
};
use std::collections::BTreeMap;

const VECTORS: &str = include_str!("p6_siege_tactics_siege_tactics_unit_vectors/vectors.json");

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

fn flag(v: &serde_json::Value, key: &str) -> bool {
    v[key]
        .as_bool()
        .unwrap_or_else(|| panic!("pole {key} nie jest bool"))
}

/// Jednostka z flagami z wektora; pola niezwiazane z predykatami ustawione neutralnie.
fn unit_from_flags(v: &serde_json::Value) -> CombatUnit {
    CombatUnit {
        hp: 1.0,
        morale: 0.0,
        flee_morale: 0.0,
        move_left: 0.0,
        never_rout: false,
        dead: flag(v, "dead"),
        fading_out: flag(v, "fadingOut"),
        routed: flag(v, "routed"),
        removed: flag(v, "removed"),
        acted: false,
    }
}

#[test]
fn wektory_alive_zgodne_z_webem() {
    let v = load();
    let cases = v["alive"].as_array().expect("alive");
    assert!(cases.len() >= 300, "wektory alive: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let u = unit_from_flags(c);
        assert_eq!(
            alive_power(&u),
            c["expect"].as_bool().unwrap(),
            "alive #{i}"
        );
    }
}

#[test]
fn wektory_out_zgodne_z_webem() {
    let v = load();
    let cases = v["out"].as_array().expect("out");
    assert!(cases.len() >= 300, "wektory out: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        // Wektor `out` niesie tylko `dead` i `routed` (pin `const out = u.dead || u.routed`).
        let u = CombatUnit {
            dead: flag(c, "dead"),
            routed: flag(c, "routed"),
            ..unit_from_flags(&serde_json::json!({
                "dead": false, "fadingOut": false, "routed": false, "removed": false
            }))
        };
        assert_eq!(is_out(&u), c["expect"].as_bool().unwrap(), "out #{i}");
    }
}

#[test]
fn wektory_alive_end_i_total_dead_zgodne_z_webem() {
    let v = load();
    let cases = v["sides"].as_array().expect("sides");
    assert!(cases.len() >= 300, "wektory sides: {}", cases.len());
    let mut a_true = 0_usize;
    let mut d_true = 0_usize;
    for (i, c) in cases.iter().enumerate() {
        let atk: Vec<CombatUnit> = c["atk"]
            .as_array()
            .unwrap()
            .iter()
            .map(unit_from_flags)
            .collect();
        let def: Vec<CombatUnit> = c["def"]
            .as_array()
            .unwrap()
            .iter()
            .map(unit_from_flags)
            .collect();
        let got_a = side_alive_end(&atk);
        let got_d = side_alive_end(&def);
        assert_eq!(got_a, c["expectAliveA"].as_bool().unwrap(), "aliveA #{i}");
        assert_eq!(got_d, c["expectAliveD"].as_bool().unwrap(), "aliveD #{i}");
        let mut all = atk.clone();
        all.extend(def.iter().copied());
        assert_eq!(
            total_dead(&all) as u64,
            c["expectTotalDead"].as_u64().unwrap(),
            "totalDead #{i}"
        );
        // Spojnosc z predykatem jednostkowym (ten sam warunek co `some` w pinie).
        assert_eq!(
            got_a,
            atk.iter().any(alive_end),
            "aliveA = some(alive_end) #{i}"
        );
        a_true += usize::from(got_a);
        d_true += usize::from(got_d);
    }
    // Pokrycie: oba wyniki wystepuja po obu stronach.
    assert!(a_true > 0 && a_true < cases.len(), "aliveA: {a_true}");
    assert!(d_true > 0 && d_true < cases.len(), "aliveD: {d_true}");
}

#[test]
fn wektory_should_rout_zgodne_z_webem() {
    let v = load();
    let cases = v["rout"].as_array().expect("rout");
    assert!(cases.len() >= 300, "wektory rout: {}", cases.len());
    let mut tags: BTreeMap<String, usize> = BTreeMap::new();
    for (i, c) in cases.iter().enumerate() {
        let u = CombatUnit {
            hp: 1.0,
            morale: num(&c["morale"]),
            flee_morale: num(&c["fleeMorale"]),
            move_left: 0.0,
            never_rout: flag(c, "neverRout"),
            dead: flag(c, "dead"),
            fading_out: flag(c, "fadingOut"),
            routed: flag(c, "routed"),
            removed: false,
            acted: false,
        };
        let flee = effective_flee_threshold(u.flee_morale, num(&c["terrMult"]));
        let got = should_rout(&u, flee);
        assert_eq!(
            got,
            c["expectRout"].as_bool().unwrap(),
            "_checkRout #{i} ({})",
            c["tag"]
        );
        *tags
            .entry(c["tag"].as_str().unwrap().to_string())
            .or_insert(0) += 1;
    }
    eprintln!("K5a rout tags: {tags:?}");
    // Pokrycie galezi: kazda galaz pinu w wektorach.
    for tag in [
        "early_return",
        "terrain_gt1_rout",
        "terrain_gt1_hold",
        "terrain_le1_rout",
        "terrain_le1_hold",
        "terrain_gt1_rout_nan_morale",
        "terrain_le1_rout_nan_morale",
    ] {
        assert!(
            tags.get(tag).copied().unwrap_or(0) > 0,
            "brak przypadku galezi {tag}"
        );
    }
}

#[test]
fn obrona_terenowa_obniza_prog_z_obcieciem_do_zera() {
    // Web: flee = Math.max(0, fleeMorale - MORALE_TERRAIN_RESIST) gdy mult > 1.
    assert_eq!(effective_flee_threshold(20.0, 1.5), 15.0);
    assert_eq!(effective_flee_threshold(3.0, 2.0), 0.0);
    assert_eq!(
        effective_flee_threshold(20.0, 1.0),
        20.0,
        "mult == 1 nie zmienia progu"
    );
    assert_eq!(
        effective_flee_threshold(20.0, f64::NAN),
        20.0,
        "NaN > 1 jest false"
    );
    assert!(
        effective_flee_threshold(f64::NAN, 2.0).is_nan(),
        "Math.max(0, NaN) = NaN"
    );
}

#[test]
fn martwa_lub_rozbita_jednostka_nie_jest_ponownie_rozbijana() {
    let base = CombatUnit {
        hp: 0.0,
        morale: 0.0,
        flee_morale: 50.0,
        move_left: 0.0,
        never_rout: false,
        dead: false,
        fading_out: false,
        routed: false,
        removed: false,
        acted: false,
    };
    assert!(should_rout(&base, 50.0), "morale 0 <= prog 50 -> rozbicie");
    assert!(!should_rout(&CombatUnit { dead: true, ..base }, 50.0));
    assert!(!should_rout(
        &CombatUnit {
            fading_out: true,
            ..base
        },
        50.0
    ));
    assert!(!should_rout(
        &CombatUnit {
            routed: true,
            ..base
        },
        50.0
    ));
    assert!(!should_rout(
        &CombatUnit {
            never_rout: true,
            ..base
        },
        50.0
    ));
}

#[test]
fn wektory_zawieraja_minus_zero() {
    // Odpowiedz na zarzut: -0 jest zakodowane jawnie jako napis "-0" (JSON.stringify(-0) dawalby "0").
    let v = load();
    let rout = v["rout"].as_array().expect("rout");
    let neg0: Vec<&serde_json::Value> = rout
        .iter()
        .filter(|c| c["morale"].as_str() == Some("-0"))
        .collect();
    assert!(
        !neg0.is_empty(),
        "brak przypadku morale = -0 w wektorach rout"
    );
    assert!(num(&neg0[0]["morale"]).is_sign_negative());
}
