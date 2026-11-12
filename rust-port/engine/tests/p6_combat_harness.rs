//! P6 COMBAT-HARNESS (R-RUSTPORT-P6-COMBAT-HARNESS-Q1) -- wektory pinu 07d2fbd72 dla petli dystansu
//! `resolveCombat` (combat.ts, blok "Phase 0: Ranged") porownane z `ranged_phase::resolve_ranged_phase`.
//!
//! Wektory: `p6_combat_harness_vectors/vectors.json`, wygenerowane przez `p6_combat_harness_gen.mjs`
//! z WYKONANIA tekstu pinu (straznik SHA-256 fragmentow w generatorze). Kazdy przypadek: wejscia
//! petli (wartosci przed petla), zapisana sekwencja losowan RNG (jedno na strzal, kolejnosc ATK, DEF),
//! oczekiwane: HP stron, amunicja, liczba rund, rout, zdarzenia strzalow (runda, strona, trafienie,
//! procent trafienia, obrazenia, HP celu).
//!
//! Porownanie wartosci zmiennoprzecinkowych: NaN == NaN; pozostale bit-w-bit (rozroznia -0 od +0).
//! Liczby w JSON jako napisy: "NaN", "Infinity", "-Infinity", "-0".
//!
//! Poza zakresem tego testu (NIE_ZMIERZONO): faza zwarcia, modyfikatory civ/budynkow/teren przed petla
//! (wejscia sa wstrzykiwane), log tekstowy (Rust nie produkuje logu; porownane sa zdarzenia strzalow).

use civ_engine::domain::combat::ranged_phase::{
    resolve_ranged_phase, RangedPhaseInput, RangedPhaseResult, RangedSide, Side,
};
use serde_json::Value;

const VEC: &str = include_str!("p6_combat_harness_vectors/vectors.json");

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

fn build_input(row: &Value) -> RangedPhaseInput {
    let i = &row["input"];
    let atk_u = &i["attacker"];
    let def_u = &i["defender"];
    let attacker = RangedSide {
        counter_typ: opt(atk_u, "counterTyp"),
        typ_nazwa: opt(atk_u, "typNazwa"),
        is_ranged: i["atkIsRanged"].as_bool().expect("atkIsRanged"),
        ammo: i["ammoAtk"].as_i64().expect("ammoAtk"),
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
        ammo: i["ammoDef"].as_i64().expect("ammoDef"),
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
        max_rounds: i["maxRounds"].as_u64().expect("maxRounds") as u32,
        start_rounds: i["totalRounds"].as_u64().expect("totalRounds") as u32,
    }
}

fn run_row(row: &Value) -> (RangedPhaseResult, usize) {
    let draws: Vec<f64> = row["draws"]
        .as_array()
        .expect("draws")
        .iter()
        .map(num)
        .collect();
    let mut idx = 0usize;
    let input = build_input(row);
    let res = resolve_ranged_phase(input, || {
        let v = *draws
            .get(idx)
            .unwrap_or_else(|| panic!("brak losowania nr {idx} (pin zuzyl wiecej)"));
        idx += 1;
        v
    });
    (res, idx)
}

fn check_row(n: usize, row: &Value) {
    let (res, used) = run_row(row);
    let exp = &row["expected"];
    let ctx = format!("przypadek {n}");
    assert_eq!(
        used,
        row["draws"].as_array().unwrap().len(),
        "{ctx}: zuzycie losowan"
    );
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
        exp["ammoAtk"].as_i64().unwrap(),
        "{ctx}: amunicja ATK"
    );
    assert_eq!(
        res.ammo_defender,
        exp["ammoDef"].as_i64().unwrap(),
        "{ctx}: amunicja DEF"
    );
    assert_eq!(
        res.rounds as u64,
        exp["rounds"].as_u64().unwrap(),
        "{ctx}: rundy"
    );
    let routed: Vec<&str> = exp["routed"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap())
        .collect();
    let got_routed: Vec<&str> = res
        .routed
        .iter()
        .map(|s| match s {
            Side::Attacker => "attacker",
            Side::Defender => "defender",
        })
        .collect();
    assert_eq!(got_routed, routed, "{ctx}: rout");

    let shots = exp["shots"].as_array().unwrap();
    assert_eq!(res.shots.len(), shots.len(), "{ctx}: liczba strzalow");
    for (k, (got, want)) in res.shots.iter().zip(shots.iter()).enumerate() {
        let sctx = format!("{ctx} strzal {k}");
        assert_eq!(
            got.round as u64,
            want["round"].as_u64().unwrap(),
            "{sctx}: runda"
        );
        let want_side = match want["side"].as_str().unwrap() {
            "attacker" => Side::Attacker,
            _ => Side::Defender,
        };
        assert_eq!(got.side, want_side, "{sctx}: strona");
        assert_eq!(got.hit, want["hit"].as_bool().unwrap(), "{sctx}: trafienie");
        assert!(
            same(got.hit_pct, num(&want["hitPct"])),
            "{sctx}: procent trafienia {} != pin {}",
            got.hit_pct,
            num(&want["hitPct"])
        );
        assert!(
            same(got.damage_exact, num(&want["damage"])),
            "{sctx}: obrazenia {} != pin {}",
            got.damage_exact,
            num(&want["damage"])
        );
        if !want["targetHp"].is_null() {
            assert!(
                same(got.target_hp, num(&want["targetHp"])),
                "{sctx}: HP celu {} != pin {}",
                got.target_hp,
                num(&want["targetHp"])
            );
        }
    }
}

#[test]
fn p6_combat_harness_wektory_pinu_zgodne() {
    let root: Value = serde_json::from_str(VEC).expect("vectors.json");
    let cases = root["cases"].as_array().expect("cases");
    assert!(cases.len() >= 300, "za malo przypadkow: {}", cases.len());
    let c = &root["counts"];
    assert!(
        c["shotsHitNaNPct"].as_u64().unwrap() >= 20,
        "brak NaN w procencie trafienia"
    );
    assert!(
        c["shotsNaNDamage"].as_u64().unwrap() >= 5,
        "brak NaN w obrazeniach"
    );
    assert!(
        c["shotsInfDamage"].as_u64().unwrap() >= 5,
        "brak Infinity w obrazeniach"
    );
    assert!(c["casesNaNHp"].as_u64().unwrap() >= 20, "brak NaN w HP");
    assert!(
        c["casesMinusInfHp"].as_u64().unwrap() >= 20,
        "brak -Infinity w HP"
    );
    assert!(
        c["casesRouted"].as_u64().unwrap() >= 50,
        "za malo roztopien"
    );
    for (n, row) in cases.iter().enumerate() {
        check_row(n, row);
    }
}

#[test]
fn p6_combat_harness_nan_roll_i_nan_hp() {
    // Pin: `roll < hitPct` z hitPct = NaN (melee NaN) jest false -> pudlo, bez obrazen; HP celu bez zmian.
    let miss = serde_json::json!({
        "input": {
            "attacker": {"counterTyp": "Distance", "typNazwa": "Łucznik", "unbreakable": false},
            "defender": {"counterTyp": "Distance", "typNazwa": "Łucznik", "unbreakable": false},
            "atkIsRanged": true, "defIsRanged": false, "ammoAtk": 2, "ammoDef": 0,
            "hpAtk": 50, "hpDef": 30, "totalRounds": 0, "maxRounds": 5,
            "atkMelee0": "NaN", "atkMissile0": 10, "atkObrona0": 5, "atkPanc0": 2,
            "defMelee0": 5, "defMissile0": 0, "defPanc0": 2,
            "defFinalObrona": 20, "terrRiverMult": 1, "ctrAtkVsDef": 1, "ctrDefVsAtk": 1,
            "routAtk": 0, "routDef": 0
        },
        "draws": [0.0, 0.0],
        "expected": {
            "hpAtk": 50, "hpDef": 30, "ammoAtk": 0, "ammoDef": 0, "rounds": 2,
            "routed": [],
            "shots": [
                {"round": 1, "side": "attacker", "hit": false, "hitPct": "NaN", "damage": 0, "targetHp": null},
                {"round": 2, "side": "attacker", "hit": false, "hitPct": "NaN", "damage": 0, "targetHp": null}
            ]
        }
    });
    check_row(0, &miss);
    // Pin: `hpDef > 0` z hpDef = NaN jest false -> petla dystansu sie nie zaczyna (0 strzalow, 0 rund).
    let nan_hp = serde_json::json!({
        "input": {
            "attacker": {"counterTyp": "Distance", "typNazwa": "Łucznik", "unbreakable": false},
            "defender": {"counterTyp": "Distance", "typNazwa": "Łucznik", "unbreakable": false},
            "atkIsRanged": true, "defIsRanged": false, "ammoAtk": 2, "ammoDef": 0,
            "hpAtk": 50, "hpDef": "NaN", "totalRounds": 0, "maxRounds": 5,
            "atkMelee0": 30, "atkMissile0": 10, "atkObrona0": 5, "atkPanc0": 2,
            "defMelee0": 5, "defMissile0": 0, "defPanc0": 2,
            "defFinalObrona": 20, "terrRiverMult": 1, "ctrAtkVsDef": 1, "ctrDefVsAtk": 1,
            "routAtk": 0, "routDef": 0
        },
        "draws": [],
        "expected": {
            "hpAtk": 50, "hpDef": "NaN", "ammoAtk": 2, "ammoDef": 0, "rounds": 0,
            "routed": [], "shots": []
        }
    });
    check_row(1, &nan_hp);
}
