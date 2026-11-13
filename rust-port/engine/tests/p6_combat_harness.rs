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
            same(got.damage, num(&want["damage"])),
            "{sctx}: obrazenia {} != pin {}",
            got.damage,
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

/// Sasiedztwo ULP granicy: `roll_pct` jest dokladnie nastepnym double pod `hit_pct` (hit_pct skonczony, > 0).
fn is_ulp_below(roll_pct: f64, hit_pct: f64) -> bool {
    hit_pct.is_finite() && hit_pct > 0.0 && roll_pct == f64::from_bits(hit_pct.to_bits() - 1)
}

/// Sasiedztwo ULP granicy: `roll_pct` jest dokladnie nastepnym double nad `hit_pct` (hit_pct skonczony, > 0).
fn is_ulp_above(roll_pct: f64, hit_pct: f64) -> bool {
    hit_pct.is_finite() && hit_pct > 0.0 && roll_pct == f64::from_bits(hit_pct.to_bits() + 1)
}

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
            } else if is_ulp_below(roll_pct, hit_pct) {
                c.shots_roll_just_below += 1;
            } else if is_ulp_above(roll_pct, hit_pct) {
                c.shots_roll_just_above += 1;
            }
        }
    }
    c
}

/// Liczniki zapisane w pliku (`counts`, wygenerowane przez `p6_combat_harness_gen.mjs`).
/// Klucze JSON wg generatora; pola jak w `Counts`.
fn counts_from_file(root: &Value) -> Result<Counts, String> {
    let c = &root["counts"];
    let u = |key: &str| -> Result<u64, String> {
        c[key]
            .as_u64()
            .ok_or_else(|| format!("brak licznika `{key}` w pliku"))
    };
    Ok(Counts {
        cases: u("cases")?,
        shots: u("shots")?,
        shots_hit_nan_pct: u("shotsHitNaNPct")?,
        shots_nan_damage: u("shotsNaNDamage")?,
        shots_inf_damage: u("shotsInfDamage")?,
        shots_roll_eq: u("shotsRollEq")?,
        shots_roll_just_below: u("shotsRollJustBelow")?,
        shots_roll_just_above: u("shotsRollJustAbove")?,
        shots_target_hp_zero: u("shotsTargetHpZero")?,
        shots_neg_zero_any_field: u("shotsNegZeroAnyField")?,
        cases_nan_hp: u("casesNaNHp")?,
        cases_minus_inf_hp: u("casesMinusInfHp")?,
        cases_routed: u("casesRouted")?,
    })
}

/// Przeliczenie licznikow w Rust musi byc zgodne z licznikami w pliku (wszystkie pola).
fn counts_agree(root: &Value) -> Result<(), String> {
    let cases = root["cases"].as_array().ok_or("brak `cases` w pliku")?;
    let got = recount(cases);
    let file = counts_from_file(root)?;
    if got == file {
        Ok(())
    } else {
        Err(format!("przeliczone w Rust {got:?} != w pliku {file:?}"))
    }
}

#[test]
fn p6_combat_harness_wektory_pinu_zgodne() {
    let root: Value = serde_json::from_str(VEC).expect("vectors.json");
    let cases = root["cases"].as_array().expect("cases");
    assert!(cases.len() >= 300, "za malo przypadkow: {}", cases.len());
    // Liczniki pokrycia przeliczane z przypadkow w Rust (`recount`) i wymagane zgodne z `counts` w pliku.
    if let Err(msg) = counts_agree(&root) {
        panic!("liczniki pokrycia: {msg}");
    }
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
fn p6_combat_harness_mutacja_licznika_daje_fail() {
    // Kazdy licznik w pliku, zmieniony o 1, musi dac niezgodnosc z przeliczeniem w Rust.
    const KEYS: [&str; 13] = [
        "cases",
        "shots",
        "shotsHitNaNPct",
        "shotsNaNDamage",
        "shotsInfDamage",
        "shotsRollEq",
        "shotsRollJustBelow",
        "shotsRollJustAbove",
        "shotsTargetHpZero",
        "shotsNegZeroAnyField",
        "casesNaNHp",
        "casesMinusInfHp",
        "casesRouted",
    ];
    let mut root: Value = serde_json::from_str(VEC).expect("vectors.json");
    counts_agree(&root).expect("bazowe liczniki pliku musza byc zgodne");
    for key in KEYS {
        let orig = root["counts"][key].clone();
        let v = orig.as_u64().expect("licznik liczbowy");
        root["counts"][key] = Value::from(v + 1);
        assert!(
            counts_agree(&root).is_err(),
            "mutacja licznika `{key}` w pliku nie dala FAIL"
        );
        root["counts"][key] = orig;
    }
    counts_agree(&root).expect("po przywroceniu zgodne");
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
/// Jeden strzal lukiem atakujacego (obronca bez dystansu, ammo 1, HP duze): `rng` zwraca dokladnie `draw`.
/// Wejscia odpowiadaja petli pinu `Phase 0: Ranged` (gra/src/game/combat.ts): `roll = rng() * 100`, `hit = roll < hitPct`.
fn one_ranged_shot(draw: f64, def_final_obrona: f64) -> RangedPhaseResult {
    let input = RangedPhaseInput {
        attacker: RangedSide {
            counter_typ: Some("Distance".to_owned()),
            typ_nazwa: Some("Łucznik".to_owned()),
            is_ranged: true,
            ammo: 1,
            hp: 50.0,
            melee_attack: 10.0,
            missile_attack: 10.0,
            melee_defence: 5.0,
            armor: 2.0,
            counter_mult: 1.0,
            rout_threshold: 0.0,
            unbreakable: false,
        },
        defender: RangedSide {
            counter_typ: None,
            typ_nazwa: None,
            is_ranged: false,
            ammo: 0,
            hp: 30.0,
            melee_attack: 5.0,
            missile_attack: 0.0,
            melee_defence: 0.0,
            armor: 2.0,
            counter_mult: 1.0,
            rout_threshold: 0.0,
            unbreakable: false,
        },
        def_final_obrona,
        river_mult: 1.0,
        max_rounds: 5,
        start_rounds: 0,
    };
    resolve_ranged_phase(input, || draw)
}

/// Szuka losowania `d` z `d * 100.0 == target` przez sasiedztwo bitowe od `target / 100.0`.
/// Zwraca `None`, gdy takiego `d` nie ma (nie każda wartość roll = d*100 jest osiągalna).
fn draw_giving_roll(target: f64) -> Option<f64> {
    let base = target / 100.0;
    let mut up = base;
    let mut down = base;
    for _ in 0..8 {
        if up * 100.0 == target {
            return Some(up);
        }
        if down * 100.0 == target {
            return Some(down);
        }
        up = f64::from_bits(up.to_bits() + 1);
        down = f64::from_bits(down.to_bits() - 1);
    }
    None
}

/// Szuka wejscia, dla ktorego hitPct `h` ma osiagalne losowania dla `h`, `h - 1 ulp` i `h + 1 ulp`.
/// Zwraca (`defFinalObrona`, `h`, losowania: rowne, ponizej, powyzej).
fn find_boundary_input() -> (f64, f64, f64, f64, f64) {
    for k in 0..400u32 {
        let obrona = 20.0 + f64::from(k) * 0.37;
        let h = one_ranged_shot(0.0, obrona).shots[0].hit_pct;
        if !(h.is_finite() && h > 0.0 && h < 100.0) {
            continue;
        }
        let below = f64::from_bits(h.to_bits() - 1);
        let above = f64::from_bits(h.to_bits() + 1);
        if let (Some(d_eq), Some(d_below), Some(d_above)) = (
            draw_giving_roll(h),
            draw_giving_roll(below),
            draw_giving_roll(above),
        ) {
            return (obrona, h, d_eq, d_below, d_above);
        }
    }
    panic!("brak wejscia z osiagalnym roll == hitPct i roll = hitPct +/- 1 ulp");
}

#[test]
fn p6_combat_harness_roll_na_hitpct_odwraca_trafienie() {
    let (obrona, h, d_eq, d_below, d_above) = find_boundary_input();

    // roll == hitPct: `roll < hitPct` jest false -> pudlo, bez obrazen, HP celu bez zmian.
    let eq = one_ranged_shot(d_eq, obrona);
    assert_eq!(
        eq.shots[0].hit_pct.to_bits(),
        h.to_bits(),
        "roll==hitPct: hitPct bez zmian"
    );
    assert!(!eq.shots[0].hit, "roll == hitPct musi byc pudlem");
    assert_eq!(
        eq.shots[0].damage.to_bits(),
        0.0f64.to_bits(),
        "pudlo: obrazenia +0"
    );
    assert_eq!(
        eq.hp_defender.to_bits(),
        30.0f64.to_bits(),
        "pudlo: HP obroncy bez zmian"
    );

    // roll tuz PONIZEJ hitPct (1 ulp): trafienie, obrazenia > 0, HP celu spada o obrazenia.
    let lo = one_ranged_shot(d_below, obrona);
    assert!(
        lo.shots[0].hit,
        "roll tuz ponizej hitPct musi byc trafieniem"
    );
    assert!(lo.shots[0].damage > 0.0, "trafienie: obrazenia > 0");
    assert_eq!(
        lo.hp_defender.to_bits(),
        (30.0 - lo.shots[0].damage).to_bits(),
        "trafienie: HP obroncy = 30 - obrazenia"
    );

    // roll tuz POWYZEJ hitPct (1 ulp): pudlo.
    let hi = one_ranged_shot(d_above, obrona);
    assert!(!hi.shots[0].hit, "roll tuz powyzej hitPct musi byc pudlem");
    assert_eq!(
        hi.shots[0].damage.to_bits(),
        0.0f64.to_bits(),
        "pudlo: obrazenia +0"
    );
}

#[test]
fn p6_combat_harness_znak_zera_w_polach_zdarzen() {
    // Sprawdza bit znaku (nie tylko liczbe) pol zdarzen strzalow wyprodukowanych przez Rust.
    let root: Value = serde_json::from_str(VEC).expect("vectors.json");
    let cases = root["cases"].as_array().expect("cases");
    let mut zera = 0u64;
    let mut checked = 0u64;
    for (n, row) in cases.iter().enumerate() {
        let (res, _) = run_row(row);
        let exp_shots = row["expected"]["shots"].as_array().expect("expected.shots");
        assert_eq!(
            res.shots.len(),
            exp_shots.len(),
            "przypadek {n}: liczba zdarzen strzalow"
        );
        for (k, (shot, exp)) in res.shots.iter().zip(exp_shots.iter()).enumerate() {
            for (name, v, exp_v) in [
                ("hitPct", shot.hit_pct, &exp["hitPct"]),
                ("damage", shot.damage, &exp["damage"]),
                ("targetHp", shot.target_hp, &exp["targetHp"]),
            ] {
                checked += 1;
                if v == 0.0 {
                    zera += 1;
                    // Znak zera porownywany z pinem (napis "-0" w wektorze = -0.0), nie z zalozeniem na sztywno.
                    assert!(
                        !exp_v.is_null(),
                        "przypadek {n} strzal {k}: pole {name} = 0 bez wartosci w pinie"
                    );
                    let exp_f = num(exp_v);
                    assert_eq!(
                        v.is_sign_negative(),
                        exp_f.is_sign_negative(),
                        "przypadek {n} strzal {k}: znak zera pola {name} rozni sie od pina"
                    );
                }
            }
        }
    }
    assert!(checked > 0, "brak zdarzen strzalow do sprawdzenia");
    assert!(zera > 0, "brak zer w polach zdarzen: test bez pokrycia");
}
