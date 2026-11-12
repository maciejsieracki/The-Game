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

/// Liczniki pokrycia przeliczane z przypadkow w Rust (zarzut 3: nie czytane z pliku).
#[derive(Debug, Default, PartialEq)]
struct Counts {
    cases: u64,
    shots: u64,
    shots_hit_nan_pct: u64,
    shots_nan_damage: u64,
    shots_inf_damage: u64,
    shots_roll_eq: u64,
    shots_roll_just_below: u64,
    shots_roll_just_above: u64,
    shots_target_hp_zero: u64,
    shots_neg_zero_any_field: u64,
    cases_nan_hp: u64,
    cases_minus_inf_hp: u64,
    cases_routed: u64,
}

/// Tolerancja sasiedztwa granicy: roll*100 w odleglosci <= 1e-9 od hitPct (sasiedzi ULP przy hitPct ~ 15..75).
const BOUNDARY_EPS: f64 = 1e-9;

/// Zero ujemne w zapisanym polu zdarzenia (napis "-0" wg konwencji wektorow).
fn is_neg_zero(v: &Value) -> bool {
    matches!(v, Value::String(s) if s == "-0")
}

fn recount(cases: &[Value]) -> Counts {
    let mut c = Counts::default();
    for row in cases {
        c.cases += 1;
        let exp = &row["expected"];
        let hp_atk = field(exp, "hpAtk");
        let hp_def = field(exp, "hpDef");
        if hp_atk.is_nan() || hp_def.is_nan() {
            c.cases_nan_hp += 1;
        }
        if hp_atk == f64::NEG_INFINITY || hp_def == f64::NEG_INFINITY {
            c.cases_minus_inf_hp += 1;
        }
        if !exp["routed"].as_array().unwrap().is_empty() {
            c.cases_routed += 1;
        }
        let draws = row["draws"].as_array().unwrap();
        for (k, shot) in exp["shots"].as_array().unwrap().iter().enumerate() {
            c.shots += 1;
            let hit_pct = num(&shot["hitPct"]);
            let damage = num(&shot["damage"]);
            let target_hp = if shot["targetHp"].is_null() {
                f64::NAN
            } else {
                num(&shot["targetHp"])
            };
            if hit_pct.is_nan() {
                c.shots_hit_nan_pct += 1;
            }
            if damage.is_nan() {
                c.shots_nan_damage += 1;
            }
            if damage == f64::INFINITY {
                c.shots_inf_damage += 1;
            }
            if target_hp == 0.0 {
                c.shots_target_hp_zero += 1;
            }
            if [&shot["hitPct"], &shot["damage"], &shot["targetHp"]]
                .iter()
                .any(|v| is_neg_zero(v))
            {
                c.shots_neg_zero_any_field += 1;
            }
            // Granica rzutu: roll = rng() * 100 (jak w pinie) wzgledem hitPct.
            let roll_pct = num(&draws[k]) * 100.0;
            if roll_pct == hit_pct {
                c.shots_roll_eq += 1;
            } else if hit_pct.is_finite()
                && roll_pct < hit_pct
                && roll_pct >= hit_pct - BOUNDARY_EPS
            {
                c.shots_roll_just_below += 1;
            } else if hit_pct.is_finite()
                && roll_pct > hit_pct
                && roll_pct <= hit_pct + BOUNDARY_EPS
            {
                c.shots_roll_just_above += 1;
            }
        }
    }
    c
}

#[test]
fn p6_combat_harness_wektory_pinu_zgodne() {
    let root: Value = serde_json::from_str(VEC).expect("vectors.json");
    let cases = root["cases"].as_array().expect("cases");
    assert!(cases.len() >= 300, "za malo przypadkow: {}", cases.len());
    // Liczniki pokrycia wylacznie z przeliczenia w Rust (`recount`); `counts` z pliku nie sa czytane.
    let got = recount(cases);
    assert!(
        got.shots_hit_nan_pct >= 20,
        "brak NaN w procencie trafienia"
    );
    assert!(got.shots_nan_damage >= 5, "brak NaN w obrazeniach");
    assert!(got.shots_inf_damage >= 5, "brak Infinity w obrazeniach");
    assert!(got.shots_roll_eq >= 20, "za malo rzutow rownych hitPct");
    assert!(
        got.shots_roll_just_below >= 20,
        "za malo rzutow tuz ponizej hitPct"
    );
    assert!(
        got.shots_roll_just_above >= 20,
        "za malo rzutow tuz powyzej hitPct"
    );
    assert!(
        got.shots_target_hp_zero >= 10,
        "za malo zdarzen z HP celu = 0 (+0)"
    );
    // -0 w hitPct/damage/targetHp jest nieosiagalne w petli pinu (hitPct w [hit_min, hit_max] = [15, 75] lub NaN;
    // damage >= 1 lub NaN; HP celu = hp - dmg z hp > 0 nie daje -0 w IEEE). Asercja pilnuje tego zalozenia.
    assert_eq!(
        got.shots_neg_zero_any_field, 0,
        "pin wyprodukowal -0 w zdarzeniu strzalu: zaktualizuj zalozenia testu"
    );
    assert!(got.cases_nan_hp >= 20, "brak NaN w HP");
    assert!(got.cases_minus_inf_hp >= 20, "brak -Infinity w HP");
    assert!(got.cases_routed >= 50, "za malo roztopien");
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
