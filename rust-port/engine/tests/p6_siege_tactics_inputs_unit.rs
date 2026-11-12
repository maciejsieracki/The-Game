//! P6 SIEGE-TAKTYKA K5i-2a4 (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A4-Q1): zgodnosc `domain::siege_tactics_inputs_unit` z pinem.
//!
//! Wektory: `p6_siege_tactics_inputs_unit_vectors/vectors.json` z `p6_siege_tactics_inputs_unit_gen.mjs` (wykonanie TEKSTU pinu
//! `07d2fbd72`, straznik SHA-256 fragmentow i calego `gra/data/units.json` pinu w generatorze). Wartosci JS kodowane tagami
//! `["n","..."] | ["s","..."] | ["z"] | ["u"] | ["b",bool]`. Kazda funkcja ma wolajacego; pokrycie galezi jest liczone i asertowane.
//! Dodatkowo test kompozycji: `CombatUnitModel` -> `BlowInput` -> `single_blow` (rdzen K5I).

use civ_engine::domain::siege_tactics_blow::{
    single_blow, BlowInput, DefenderState, HitArc, SequenceRolls,
};
use civ_engine::domain::siege_tactics_inputs_unit::{
    apply_army_hunger_stat_mult_to_combat_unit, apply_gold_deficit_stat_mult_to_combat_unit,
    apply_veteran_frac_to_combat_unit, combat_norm_field, combat_stat_field, combat_unit_from_def,
    to_combat_unit, unit_row_stat, BattleUnitIn, CombatUnitFromDefOpts, CombatUnitModel, StatRow,
    ToCombatUnitOpts, UVal,
};
use std::collections::HashMap;

const VECTORS: &str = include_str!("p6_siege_tactics_inputs_unit_vectors/vectors.json");

fn num_from_str(s: &str) -> f64 {
    match s {
        "NaN" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        "-0" => -0.0,
        other => other.parse::<f64>().expect("liczba w wektorze"),
    }
}

fn val(v: &serde_json::Value) -> UVal {
    let a = v.as_array().expect("tag");
    match a[0].as_str().unwrap() {
        "u" => UVal::Undef,
        "z" => UVal::Null,
        "n" => UVal::Num(num_from_str(a[1].as_str().unwrap())),
        "s" => UVal::Str(a[1].as_str().unwrap().to_string()),
        "b" => UVal::Bool(a[1].as_bool().unwrap()),
        other => panic!("nieznany tag {other}"),
    }
}

fn num(v: &serde_json::Value) -> f64 {
    match val(v) {
        UVal::Num(n) => n,
        other => panic!("oczekiwano liczby, jest {other:?}"),
    }
}

/// `Option<f64>`: `["u"]`/`["z"]` -> None.
fn opt_num(v: &serde_json::Value) -> Option<f64> {
    match val(v) {
        UVal::Undef | UVal::Null => None,
        UVal::Num(n) => Some(n),
        other => panic!("oczekiwano liczby/undef/null, jest {other:?}"),
    }
}

/// Rownosc dokladna: te same bity (rozroznia -0 i 0), NaN == NaN.
fn same_f(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

fn same_u(a: &UVal, b: &UVal) -> bool {
    match (a, b) {
        (UVal::Num(x), UVal::Num(y)) => same_f(*x, *y),
        _ => a == b,
    }
}

fn record(v: &serde_json::Value) -> StatRow {
    v.as_object()
        .expect("rekord")
        .iter()
        .map(|(k, x)| (k.clone(), val(x)))
        .collect()
}

/// Wiersz jednostki pinu (`units` w wektorach: natywny JSON) -> `StatRow`.
fn unit_row(u: &serde_json::Value) -> StatRow {
    u.as_object()
        .unwrap()
        .iter()
        .map(|(k, x)| {
            let v = match x {
                serde_json::Value::Null => UVal::Null,
                serde_json::Value::Bool(b) => UVal::Bool(*b),
                serde_json::Value::Number(n) => UVal::Num(n.as_f64().unwrap()),
                serde_json::Value::String(s) => UVal::Str(s.clone()),
                other => panic!("pole nieskalarne {other}"),
            };
            (k.clone(), v)
        })
        .collect()
}

/// Wiersz z wektora: `unit` (indeks lub -1) + `set`/`del`.
fn stats_of(units: &[StatRow], i: &serde_json::Value) -> StatRow {
    let idx = i["unit"].as_i64().unwrap();
    let mut row = if idx >= 0 {
        units[idx as usize].clone()
    } else {
        StatRow::new()
    };
    for k in i["del"].as_array().unwrap() {
        row.remove(k.as_str().unwrap());
    }
    for (k, v) in record(&i["set"]) {
        row.insert(k, v);
    }
    row
}

fn cu_from_row(units: &[StatRow], i: &serde_json::Value) -> CombatUnitModel {
    combat_unit_from_def(&stats_of(units, i), &CombatUnitFromDefOpts::default())
}

/// Porownanie CALEGO `CombatUnit` z oczekiwanym (kazde pole, bity f64).
fn assert_cu(id: &str, got: &CombatUnitModel, want: &serde_json::Value) {
    let f = |k: &str| num(&want[k]);
    let s = |k: &str| match val(&want[k]) {
        UVal::Str(s) => s,
        other => panic!("{id}: {k}: oczekiwano napisu, jest {other:?}"),
    };
    assert!(
        same_u(&got.typ_nazwa, &val(&want["typNazwa"])),
        "{id}: typNazwa {:?} != {:?}",
        got.typ_nazwa,
        val(&want["typNazwa"])
    );
    assert_eq!(got.counter_typ, s("counterTyp"), "{id}: counterTyp");
    assert_eq!(got.rola, s("rola"), "{id}: rola");
    for (name, g) in [
        ("meleeAttack", got.melee_attack),
        ("meleeDefence", got.melee_defence),
        ("weaponDamage", got.weapon_damage),
        ("armor", got.armor),
        ("piercing", got.piercing),
        ("chargeBonus", got.charge_bonus),
        ("health", got.health),
        ("missileAttack", got.missile_attack),
        ("Kara obrony z flanki (%)", got.kara_flanka),
        ("Kara obrony z tylu (%)", got.kara_tyl),
    ] {
        assert!(same_f(g, f(name)), "{id}: {name}: {g} != {}", f(name));
    }
    for (name, g) in [
        ("canonicalEffectiveMaxHp", got.canonical_effective_max_hp),
        ("canonicalCurrentHp", got.canonical_current_hp),
        ("veteranHealthBonusFrac", got.veteran_health_bonus_frac),
        ("Prog dezercji (% health)", got.prog_dezercji),
    ] {
        let w = opt_num(&want[name]);
        match (g, w) {
            (None, None) => {}
            (Some(a), Some(b)) => assert!(same_f(a, b), "{id}: {name}: {a} != {b}"),
            (a, b) => panic!("{id}: {name}: {a:?} != {b:?}"),
        }
    }
    for (name, g) in [
        ("Zasieg ataku (hex)", &got.zasieg_ataku),
        ("Ilosc pociskow", &got.ilosc_pociskow),
        ("Ruch w bitwie (heksy)", &got.ruch_w_bitwie),
        ("Super-jednostka", &got.super_jednostka),
    ] {
        assert!(
            same_u(g, &val(&want[name])),
            "{id}: {name}: {g:?} != {:?}",
            val(&want[name])
        );
    }
}

/// Wejscie rdzenia K5I zbudowane ze statow `CombatUnit` (atakujacy) - sklada tylko to, co daje model jednostki.
fn blow_from_cu(cu: &CombatUnitModel, ranged: bool) -> BlowInput {
    BlowInput {
        ranged,
        first_blow_of_pair: true,
        defender_braces_against_charge: false,
        attacker_mounted: false,
        hit_arc: HitArc::Front,
        atk_melee: cu.melee_attack,
        atk_shoot_acc: 0.0,
        def_final_obrona: 10.0,
        round_atk_charge: cu.charge_bonus,
        def_armor: cu.armor,
        atk_missile: cu.missile_attack,
        weapon_damage: cu.weapon_damage,
        piercing: cu.piercing,
        ctr_atk_vs_def: 1.0,
        ranged_class_mult: 1.0,
        defender: DefenderState {
            hp: 200.0,
            max_hp: 200.0,
            morale: 100.0,
            flee_morale: 20.0,
            dead: false,
            fading_out: false,
            routed: false,
            never_rout: false,
            removed: false,
        },
        routed_after_morale: false,
    }
}

#[derive(Default, Debug)]
struct Cov {
    per_fn: HashMap<String, usize>,
    norm_missing: usize,
    norm_parsed_str: usize,
    norm_nan_fallback: usize,
    norm_num: usize,
    row_def_none: usize,
    row_primary: usize,
    row_legacy: usize,
    row_fallback: usize,
    row_primary_nan: usize,
    sf_first: usize,
    sf_second: usize,
    sf_none: usize,
    fd_prog_some: usize,
    fd_prog_none: usize,
    fd_health_upper: usize,
    fd_opts_typ: usize,
    fd_def_jednostka: usize,
    fd_empty_name: usize,
    fd_counter_typ_row: usize,
    fd_counter_typ_opts: usize,
    fd_counter_typ_jednostka: usize,
    fd_counter_typ_empty: usize,
    fd_rola_opts: usize,
    fd_rola_row: usize,
    fd_rola_default: usize,
    fd_hp_opts: usize,
    fd_hp_default: usize,
    fd_canonical: usize,
    fd_nonstr_name: usize,
    fd_ascii_reach: usize,
    fd_diacritic_reach: usize,
    fd_reach_null: usize,
    vet_zero: usize,
    vet_nan: usize,
    vet_applied: usize,
    vet_prog_null: usize,
    vet_prog_some: usize,
    wk_noop: usize,
    wk_applied: usize,
    wk_nan: usize,
    wk_prog_null: usize,
    tcu_stats_null: usize,
    tcu_kategoria_name: usize,
    tcu_vet: usize,
    tcu_hungry_applied: usize,
    tcu_hungry_skipped: usize,
    tcu_gold_applied: usize,
    tcu_gold_skipped: usize,
    tcu_both: usize,
    tcu_defaults: usize,
    tcu_hp_nullish: usize,
    tcu_hp_given: usize,
    nan_out: usize,
    inf_out: usize,
    compose_cases: usize,
    compose_hits: usize,
}

fn count_nan_inf(cov: &mut Cov, cu: &CombatUnitModel) {
    let all = [
        cu.melee_attack,
        cu.melee_defence,
        cu.weapon_damage,
        cu.armor,
        cu.piercing,
        cu.charge_bonus,
        cu.health,
        cu.missile_attack,
    ];
    if all.iter().any(|x| x.is_nan()) {
        cov.nan_out += 1;
    }
    if all.iter().any(|x| x.is_infinite()) {
        cov.inf_out += 1;
    }
}

#[test]
fn wektory_zgodne_z_pinem_i_pokrycie_galezi() {
    let v: serde_json::Value = serde_json::from_str(VECTORS).expect("vectors.json");
    let cases = v["cases"].as_array().unwrap();
    assert!(
        cases.len() >= 500,
        "minimum 500 przypadkow, jest {}",
        cases.len()
    );
    let unit_vals = v["units"].as_array().unwrap();
    assert!(
        unit_vals.len() >= 75,
        "minimum 75 jednostek, jest {}",
        unit_vals.len()
    );
    assert_eq!(
        v["pin"].as_str().unwrap(),
        "07d2fbd72f758705f8e1d59cc4968027ffbafe75"
    );
    let units: Vec<StatRow> = unit_vals.iter().map(unit_row).collect();
    let mut cov = Cov::default();

    for case in cases {
        let id = case["id"].as_str().unwrap();
        let f = case["fn"].as_str().unwrap();
        let i = &case["input"];
        let e = &case["expect"];
        *cov.per_fn.entry(f.to_string()).or_default() += 1;
        match f {
            "combatNormField" => {
                let (x, fb) = (val(&i["v"]), num(&i["fallback"]));
                let got = combat_norm_field(&x, fb);
                assert!(same_f(got, num(&e["v"])), "{id}: {got} != {}", num(&e["v"]));
                match &x {
                    UVal::Undef | UVal::Null => cov.norm_missing += 1,
                    UVal::Str(s) if s.is_empty() || s == "---" || s == "\u{2014}" => {
                        cov.norm_missing += 1
                    }
                    UVal::Str(_) if !got.is_nan() && same_f(got, fb) => cov.norm_nan_fallback += 1,
                    UVal::Str(_) => cov.norm_parsed_str += 1,
                    UVal::Num(n) if n.is_nan() => cov.norm_nan_fallback += 1,
                    UVal::Num(_) => cov.norm_num += 1,
                    UVal::Bool(_) => {}
                }
            }
            "unitRowStat" => {
                let fb = num(&i["fallback"]);
                let legacy = match val(&i["legacy"]) {
                    UVal::Str(s) => Some(s),
                    _ => None,
                };
                let def = if i["def"].is_array() {
                    None
                } else {
                    Some(record(&i["def"]["o"]))
                };
                let got = unit_row_stat(
                    def.as_ref(),
                    i["primary"].as_str().unwrap(),
                    legacy.as_deref(),
                    fb,
                );
                assert!(same_f(got, num(&e["v"])), "{id}: {got} != {}", num(&e["v"]));
                match &def {
                    None => cov.row_def_none += 1,
                    Some(d) => {
                        let pv = d.get("armor");
                        let lv = d.get("Pancerz");
                        let missing = |x: Option<&UVal>| match x {
                            None | Some(UVal::Null) => true,
                            Some(UVal::Str(s)) => s.is_empty() || s == "---" || s == "\u{2014}",
                            _ => false,
                        };
                        if !missing(pv) {
                            cov.row_primary += 1;
                            if got.is_nan() || same_f(got, fb) {
                                cov.row_primary_nan += 1;
                            }
                        } else if legacy.is_some() && !missing(lv) {
                            cov.row_legacy += 1;
                        } else {
                            cov.row_fallback += 1;
                        }
                    }
                }
            }
            "combatStatField" => {
                let s = record(&i["s"]);
                let got = combat_stat_field(&s, &["a", "b"]);
                let want = val(&e["v"]);
                let got_v = got.cloned().unwrap_or(UVal::Undef);
                assert!(same_u(&got_v, &want), "{id}: {got_v:?} != {want:?}");
                match got {
                    None => cov.sf_none += 1,
                    Some(g) if s.get("a").is_some_and(|a| std::ptr::eq(a, g)) => cov.sf_first += 1,
                    Some(_) => cov.sf_second += 1,
                }
            }
            "combatUnitFromDef" => {
                let stats = stats_of(&units, i);
                let o = &i["opts"];
                let opts = CombatUnitFromDefOpts {
                    typ_nazwa: match val(&o["typNazwa"]) {
                        UVal::Undef => None,
                        other => Some(other),
                    },
                    rola: match val(&o["rola"]) {
                        UVal::Str(s) => Some(s),
                        UVal::Undef => None,
                        other => panic!("{id}: rola {other:?}"),
                    },
                    hp: opt_num(&o["hp"]),
                };
                let got = combat_unit_from_def(&stats, &opts);
                assert_cu(id, &got, &e["cu"]);
                count_nan_inf(&mut cov, &got);
                match got.prog_dezercji {
                    Some(_) => cov.fd_prog_some += 1,
                    None => cov.fd_prog_none += 1,
                }
                if matches!(stats.get("health"), None | Some(UVal::Null))
                    && stats.contains_key("Health")
                {
                    cov.fd_health_upper += 1;
                }
                match &opts.typ_nazwa {
                    Some(UVal::Null) | None => {
                        if matches!(stats.get("Jednostka"), None | Some(UVal::Null)) {
                            cov.fd_empty_name += 1;
                        } else {
                            cov.fd_def_jednostka += 1;
                        }
                    }
                    Some(_) => cov.fd_opts_typ += 1,
                }
                if !matches!(&got.typ_nazwa, UVal::Str(_)) {
                    cov.fd_nonstr_name += 1;
                }
                let nullish = |k: &str| matches!(stats.get(k), None | Some(UVal::Null));
                if !nullish("Typ") {
                    cov.fd_counter_typ_row += 1;
                } else if matches!(&opts.typ_nazwa, Some(x) if !matches!(x, UVal::Null | UVal::Undef))
                {
                    cov.fd_counter_typ_opts += 1;
                } else if !nullish("Jednostka") {
                    cov.fd_counter_typ_jednostka += 1;
                } else {
                    cov.fd_counter_typ_empty += 1;
                }
                if opts.rola.is_some() {
                    cov.fd_rola_opts += 1;
                } else if !nullish("Rola (linia)") {
                    cov.fd_rola_row += 1;
                } else {
                    cov.fd_rola_default += 1;
                }
                if opts.hp.is_some() {
                    cov.fd_hp_opts += 1;
                } else {
                    cov.fd_hp_default += 1;
                }
                if got.canonical_effective_max_hp.is_some() || got.canonical_current_hp.is_some() {
                    cov.fd_canonical += 1;
                }
                let has = |k: &str| stats.get(k).is_some_and(|x| !matches!(x, UVal::Null));
                if has("Zasieg ataku (hex)") && !has("Zasi\u{119}g ataku (hex)") {
                    cov.fd_ascii_reach += 1;
                }
                if has("Zasi\u{119}g ataku (hex)") {
                    cov.fd_diacritic_reach += 1;
                }
                if got.zasieg_ataku == UVal::Null {
                    cov.fd_reach_null += 1;
                }
            }
            "applyVeteranFrac" => {
                let mut cu = cu_from_row(&units, i);
                cu.veteran_health_bonus_frac = opt_num(&i["vhbf"]);
                let frac = num(&i["frac"]);
                let got = apply_veteran_frac_to_combat_unit(&cu, frac);
                assert_cu(id, &got, &e["cu"]);
                count_nan_inf(&mut cov, &got);
                if frac == 0.0 {
                    cov.vet_zero += 1;
                    assert_eq!(
                        format!("{got:?}"),
                        format!("{cu:?}"),
                        "{id}: frac=0 -> bez zmian"
                    );
                } else if frac.is_nan() {
                    cov.vet_nan += 1;
                    assert_eq!(
                        format!("{got:?}"),
                        format!("{cu:?}"),
                        "{id}: frac=NaN -> bez zmian"
                    );
                } else {
                    cov.vet_applied += 1;
                    if cu.prog_dezercji.is_none() {
                        cov.vet_prog_null += 1;
                    } else {
                        cov.vet_prog_some += 1;
                    }
                    assert_eq!(
                        got.armor.to_bits(),
                        cu.armor.to_bits(),
                        "{id}: pancerz bez zmian"
                    );
                }
            }
            "applyArmyHunger" | "applyGoldDeficit" => {
                let cu = cu_from_row(&units, i);
                let mult = num(&i["mult"]);
                let got = if f == "applyArmyHunger" {
                    apply_army_hunger_stat_mult_to_combat_unit(&cu, mult)
                } else {
                    apply_gold_deficit_stat_mult_to_combat_unit(&cu, mult)
                };
                assert_cu(id, &got, &e["cu"]);
                count_nan_inf(&mut cov, &got);
                if mult >= 1.0 || mult <= 0.0 {
                    cov.wk_noop += 1;
                    assert_eq!(
                        format!("{got:?}"),
                        format!("{cu:?}"),
                        "{id}: mult poza (0,1) -> bez zmian"
                    );
                } else if mult.is_nan() {
                    cov.wk_nan += 1;
                } else {
                    cov.wk_applied += 1;
                }
                if cu.prog_dezercji.is_none() {
                    cov.wk_prog_null += 1;
                }
            }
            "toCombatUnit" => {
                let b = &i["bu"];
                let stats = match i["statsNull"].as_str() {
                    Some(_) => None,
                    None => Some(stats_of(&units, i)),
                };
                let bu = BattleUnitIn {
                    stats: stats.clone(),
                    kategoria: b["kategoria"].as_str().unwrap().to_string(),
                    hp: opt_num(&b["hp"]),
                    veteran_bonus_frac: opt_num(&b["veteranBonusFrac"]),
                    army_hungry: b["armyHungry"].as_bool().unwrap(),
                    gold_deficit: b["goldDeficit"].as_bool().unwrap(),
                };
                // args: [hungerMult, skipHunger, goldMult, skipGold]; `undefined` / brak -> wartosci domyslne pinu.
                let args = i["args"].as_array().unwrap();
                let mut opts = ToCombatUnitOpts::default();
                if let Some(a) = args.first() {
                    if let UVal::Num(n) = val(a) {
                        opts.army_hunger_stat_mult = n;
                    }
                }
                if let Some(a) = args.get(1) {
                    if let UVal::Bool(x) = val(a) {
                        opts.skip_hunger = x;
                    }
                }
                if let Some(a) = args.get(2) {
                    if let UVal::Num(n) = val(a) {
                        opts.gold_deficit_stat_mult = n;
                    }
                }
                if let Some(a) = args.get(3) {
                    if let UVal::Bool(x) = val(a) {
                        opts.skip_gold_deficit = x;
                    }
                }
                let got = to_combat_unit(&bu, &opts);
                assert_cu(id, &got, &e["cu"]);
                count_nan_inf(&mut cov, &got);
                if args.is_empty() || args.iter().all(|a| matches!(val(a), UVal::Undef)) {
                    cov.tcu_defaults += 1;
                }
                if stats.is_none() {
                    cov.tcu_stats_null += 1;
                }
                let jed = stats.as_ref().and_then(|s| s.get("Jednostka"));
                if matches!(jed, None | Some(UVal::Null)) {
                    cov.tcu_kategoria_name += 1;
                    assert!(
                        matches!(&got.typ_nazwa, UVal::Str(s) if *s == bu.kategoria),
                        "{id}: typNazwa z kategorii"
                    );
                }
                if bu
                    .veteran_bonus_frac
                    .is_some_and(|x| x != 0.0 && !x.is_nan())
                {
                    cov.tcu_vet += 1;
                }
                if bu.army_hungry {
                    if opts.skip_hunger {
                        cov.tcu_hungry_skipped += 1;
                    } else {
                        cov.tcu_hungry_applied += 1;
                    }
                }
                if bu.gold_deficit {
                    if opts.skip_gold_deficit {
                        cov.tcu_gold_skipped += 1;
                    } else {
                        cov.tcu_gold_applied += 1;
                    }
                }
                if bu.army_hungry && bu.gold_deficit && !opts.skip_hunger && !opts.skip_gold_deficit
                {
                    cov.tcu_both += 1;
                }
                if bu.hp.is_some() {
                    cov.tcu_hp_given += 1;
                } else {
                    cov.tcu_hp_nullish += 1;
                }

                // Kompozycja z rdzeniem K5I: CombatUnit z Rust vs CombatUnit z pinu -> ten sam wynik `single_blow`.
                let want_cu = {
                    let mut w = got.clone();
                    let f = |k: &str| num(&e["cu"][k]);
                    w.melee_attack = f("meleeAttack");
                    w.weapon_damage = f("weaponDamage");
                    w.piercing = f("piercing");
                    w.armor = f("armor");
                    w.charge_bonus = f("chargeBonus");
                    w.missile_attack = f("missileAttack");
                    w
                };
                for (idx, ranged) in [false, true].into_iter().enumerate() {
                    let r = [0.01, 0.5][idx];
                    let a = single_blow(
                        &blow_from_cu(&got, ranged),
                        &mut SequenceRolls::new(vec![r]),
                    );
                    let b = single_blow(
                        &blow_from_cu(&want_cu, ranged),
                        &mut SequenceRolls::new(vec![r]),
                    );
                    cov.compose_cases += 1;
                    assert_eq!(a.missed, b.missed, "{id}: kompozycja: pudlo");
                    assert!(
                        same_f(a.dmg, b.dmg),
                        "{id}: kompozycja: dmg {} != {}",
                        a.dmg,
                        b.dmg
                    );
                    assert!(
                        same_f(a.def_hp_after, b.def_hp_after),
                        "{id}: kompozycja: HP"
                    );
                    if !a.missed {
                        cov.compose_hits += 1;
                    }
                }
            }
            other => panic!("{id}: nieznana funkcja {other}"),
        }
    }

    eprintln!("pokrycie K5i-2a4: {cov:?}");
    for (f, min) in [
        ("combatNormField", 100),
        ("unitRowStat", 100),
        ("combatStatField", 100),
        ("combatUnitFromDef", 200),
        ("applyVeteranFrac", 100),
        ("applyArmyHunger", 100),
        ("applyGoldDeficit", 100),
        ("toCombatUnit", 500),
    ] {
        assert!(
            cov.per_fn.get(f).copied().unwrap_or(0) >= min,
            "{f}: za malo wywolan w wektorach"
        );
    }
    macro_rules! pos {
        ($($n:ident),+) => { $( assert!(cov.$n > 0, concat!("brak pokrycia: ", stringify!($n))); )+ };
    }
    pos!(
        norm_missing,
        norm_parsed_str,
        norm_nan_fallback,
        norm_num,
        row_def_none,
        row_primary,
        row_legacy,
        row_fallback,
        row_primary_nan,
        sf_first,
        sf_second,
        sf_none,
        fd_prog_some,
        fd_prog_none,
        fd_health_upper,
        fd_opts_typ,
        fd_def_jednostka,
        fd_empty_name,
        fd_counter_typ_row,
        fd_counter_typ_opts,
        fd_counter_typ_jednostka,
        fd_counter_typ_empty,
        fd_rola_opts,
        fd_rola_row,
        fd_rola_default,
        fd_hp_opts,
        fd_hp_default,
        fd_canonical,
        fd_nonstr_name,
        fd_ascii_reach,
        fd_diacritic_reach,
        fd_reach_null,
        vet_zero,
        vet_nan,
        vet_applied,
        vet_prog_null,
        vet_prog_some,
        wk_noop,
        wk_applied,
        wk_nan,
        wk_prog_null,
        tcu_stats_null,
        tcu_kategoria_name,
        tcu_vet,
        tcu_hungry_applied,
        tcu_hungry_skipped,
        tcu_gold_applied,
        tcu_gold_skipped,
        tcu_both,
        tcu_defaults,
        tcu_hp_nullish,
        tcu_hp_given,
        nan_out,
        inf_out,
        compose_cases,
        compose_hits
    );
}

/// Dane pinu: wektory pokrywaja WSZYSTKIE jednostki z `gra/data/units.json` pinu (>= 75) w `toCombatUnit` z domyslnymi parametrami.
#[test]
fn kazda_jednostka_pinu_ma_wywolanie_to_combat_unit() {
    let v: serde_json::Value = serde_json::from_str(VECTORS).unwrap();
    let n_units = v["units"].as_array().unwrap().len();
    let mut seen = vec![false; n_units];
    for c in v["cases"].as_array().unwrap() {
        if c["fn"] == "toCombatUnit"
            && c["input"]["set"].as_object().unwrap().is_empty()
            && c["input"]["del"].as_array().unwrap().is_empty()
        {
            seen[c["input"]["unit"].as_i64().unwrap() as usize] = true;
        }
    }
    assert!(n_units >= 75);
    assert!(
        seen.iter().all(|x| *x),
        "jednostki bez niezmodyfikowanego wywolania toCombatUnit"
    );
}
