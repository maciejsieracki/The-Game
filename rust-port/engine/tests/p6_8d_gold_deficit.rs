//! P6.8D-P1/P2 - `gold-deficit.ts` + `applyGoldDeficitHpLoss` (web pin 91dc998a).
//! Wektory z URUCHOMIONEGO weba (`tests/p6_8d_vectors/gold_deficit.json`, generator
//! `gen-p6-8d-gold-mennica-vectors.mjs` w runie R-RUSTPORT-P6-8D-UTRZYMANIE-OBYWATELI-Q1).
//! Kodowanie: liczba = JSON number; niecalkowita = `{"$f": String(x)}`;
//! NaN/Infinity/-Infinity/-0 = `{"$n": "..."}`; undefined = `{"$undef": true}`; null = null.

use std::collections::BTreeMap;

use civ_engine::domain::turn_economy::gold_deficit::{
    apply_gold_deficit_hp_loss, apply_gold_deficit_stat_mult_to_combat_unit,
    build_gold_deficit_params, fresh_gold_deficit_state, Difficulty, GoldDeficitCombatStats,
    GoldDeficitParams, GoldDeficitRuntime, GoldDeficitState, GoldDeficitTick, GoldDeficitUnit,
    RawGoldDeficitInput, RawGoldDeficitRows, RawParamRow,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_8d_vectors/gold_deficit.json");

/// Tabela maxHp z generatora (`MAXHP_TABLE`) - funkcja `getMaxHp` z webu.
fn max_hp_table(type_id: &str) -> f64 {
    match type_id {
        "tPiech" => 10.0,
        "tLucz" => 7.5,
        "tZero" => 0.0,
        "tNaN" => f64::NAN,
        "tDuzy" => 1000.0,
        "tUjemny" => -5.0,
        "tMikro" => 0.4,
        other => panic!("nieznany typeId w wektorze: {other}"),
    }
}

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("wektory parse")
}

fn arr<'a>(v: &'a Value, what: &str) -> &'a Vec<Value> {
    v.as_array()
        .unwrap_or_else(|| panic!("oczekiwano tablicy: {what}"))
}

/// Dekoduje liczbe z wektora (patrz naglowek pliku). Bez `null`/`undefined`.
fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::Object(o) => {
            if let Some(s) = o.get("$f") {
                return s.as_str().expect("$f").parse::<f64>().expect("$f parse");
            }
            match o.get("$n").and_then(Value::as_str).expect("$n") {
                "NaN" => f64::NAN,
                "Infinity" => f64::INFINITY,
                "-Infinity" => f64::NEG_INFINITY,
                "-0" => -0.0,
                other => panic!("nieznane $n: {other}"),
            }
        }
        other => panic!("nie liczba: {other}"),
    }
}

/// `null` / `{"$undef": true}` => None; inaczej Some(liczba).
fn opt_num(v: &Value) -> Option<f64> {
    if v.is_null() {
        return None;
    }
    if let Some(o) = v.as_object() {
        if o.get("$undef").is_some() {
            return None;
        }
    }
    Some(num(v))
}

/// Porownanie bit-w-bit (NaN == NaN, -0 != 0), zgodne z `Object.is`.
fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

fn same_opt(a: Option<f64>, b: Option<f64>) -> bool {
    match (a, b) {
        (None, None) => true,
        (Some(x), Some(y)) => same(x, y),
        _ => false,
    }
}

fn assert_same(actual: f64, expected: f64, ctx: &str) {
    assert!(
        same(actual, expected),
        "{ctx}: rust={actual:?} web={expected:?}"
    );
}

fn assert_same_opt(actual: Option<f64>, expected: Option<f64>, ctx: &str) {
    assert!(
        same_opt(actual, expected),
        "{ctx}: rust={actual:?} web={expected:?}"
    );
}

fn check_tick(actual: &GoldDeficitTick, json: &Value, ctx: &str) {
    assert_same(
        actual.owner_id as f64,
        num(&json["ownerId"]),
        &format!("{ctx} ownerId"),
    );
    assert_same(
        actual.skarbiec,
        num(&json["skarbiec"]),
        &format!("{ctx} skarbiec"),
    );
    assert_eq!(
        actual.deficyt_zlota,
        json["deficytZlota"].as_bool().unwrap(),
        "{ctx} deficytZlota"
    );
    assert_same(
        actual.tury_deficytu_zlota_po as f64,
        num(&json["turyDeficytuZlotaPo"]),
        &format!("{ctx} turyDeficytuZlotaPo"),
    );
    assert_eq!(
        actual.zloto_deficyt_atrycja_aktywna,
        json["zlotoDeficytAtrycjaAktywna"].as_bool().unwrap(),
        "{ctx} atrycja"
    );
}

fn raw_row(v: &Value) -> Option<RawParamRow> {
    let o = v.as_object()?;
    let f = |k: &str| o.get(k).and_then(Value::as_f64);
    Some(RawParamRow {
        easy: f("easy"),
        normal: f("normal"),
        hard: f("hard"),
    })
}

fn raw_rows(v: &Value) -> RawGoldDeficitRows {
    let row = |k: &str| v.get(k).and_then(raw_row);
    RawGoldDeficitRows {
        zloto_deficyt_stat_mult: row("zloto_deficyt_stat_mult"),
        zloto_deficyt_karencja_tur: row("zloto_deficyt_karencja_tur"),
        zloto_deficyt_hp_frac: row("zloto_deficyt_hp_frac"),
    }
}

fn parse_difficulty(v: &Value) -> Difficulty {
    match v.as_str() {
        Some("easy") => Difficulty::Easy,
        Some("hard") => Difficulty::Hard,
        Some("normal") | None => Difficulty::Normal,
        Some(other) => panic!("trudnosc: {other}"),
    }
}

fn params_from(v: &Value) -> GoldDeficitParams {
    GoldDeficitParams {
        zloto_deficyt_stat_mult: num(&v["zlotoDeficytStatMult"]),
        zloto_deficyt_karencja_tur: num(&v["zlotoDeficytKarencjaTur"]),
        zloto_deficyt_hp_frac: num(&v["zlotoDeficytHpFrac"]),
    }
}

// ---------------------------------------------------------------------------
// buildGoldDeficitParams / freshGoldDeficitState
// ---------------------------------------------------------------------------

#[test]
fn fresh_state_matches_web() {
    let r = root();
    assert_eq!(
        fresh_gold_deficit_state(),
        GoldDeficitState {
            tury_deficytu_zlota: num(&r["freshState"]) as u64
        }
    );
}

#[test]
fn build_params_matches_web_vectors() {
    let r = root();
    let cases = arr(&r["params"], "params");
    assert!(
        cases.len() >= 20,
        "za malo przypadkow params: {}",
        cases.len()
    );
    for (i, c) in cases.iter().enumerate() {
        let ctx = format!("params[{i}] {}", c["name"]);
        let raw = &c["raw"];
        let input = RawGoldDeficitInput {
            ekonomia_miasta: raw.get("ekonomia_miasta").map(raw_rows),
            top: raw_rows(raw),
        };
        let got = build_gold_deficit_params(&input, parse_difficulty(&c["difficulty"]));
        let exp = params_from(&c["expected"]);
        assert_same(
            got.zloto_deficyt_stat_mult,
            exp.zloto_deficyt_stat_mult,
            &format!("{ctx} stat"),
        );
        assert_same(
            got.zloto_deficyt_karencja_tur,
            exp.zloto_deficyt_karencja_tur,
            &format!("{ctx} karencja"),
        );
        assert_same(
            got.zloto_deficyt_hp_frac,
            exp.zloto_deficyt_hp_frac,
            &format!("{ctx} hp"),
        );
    }
}

// ---------------------------------------------------------------------------
// advanceGoldDeficit + akcesory (globalny _lastTicks -> GoldDeficitRuntime)
// ---------------------------------------------------------------------------

#[test]
fn empty_runtime_accessors_match_web() {
    let r = root();
    let rt = GoldDeficitRuntime::new();
    for (k, v) in r["emptyAccessors"].as_object().unwrap() {
        let oid: i64 = k.parse().unwrap();
        assert_eq!(
            rt.is_gold_deficit(oid),
            v["isGoldDeficit"].as_bool().unwrap()
        );
        assert_eq!(
            rt.is_gold_deficit_starving(oid),
            v["isGoldDeficitStarving"].as_bool().unwrap()
        );
        assert_same_opt(
            rt.gold_deficit_countdown(oid, 3.0),
            opt_num(&v["countdown"]),
            "empty countdown",
        );
        assert!(rt.last_gold_deficit_tick(oid).is_none());
        assert!(v["lastTick"].is_null());
    }
}

#[test]
fn advance_sequences_match_web_vectors() {
    let r = root();
    let cases = arr(&r["advance"], "advance");
    assert_eq!(cases.len(), 40, "liczba sekwencji advance");
    for (ci, case) in cases.iter().enumerate() {
        let params = params_from(&case["params"]);
        let mut rt = GoldDeficitRuntime::new();
        let mut states: BTreeMap<i64, GoldDeficitState> = BTreeMap::new();
        for (si, step) in arr(&case["steps"], "steps").iter().enumerate() {
            let ctx = format!(
                "advance[{ci}] {} p{} step{si}",
                case["seq"], case["paramIndex"]
            );
            let table: BTreeMap<i64, f64> = step["treasury"]
                .as_object()
                .unwrap()
                .iter()
                .map(|(k, v)| (k.parse().unwrap(), num(v)))
                .collect();
            let owner_ids: Vec<i64> = arr(&step["ownerIds"], "ownerIds")
                .iter()
                .map(|v| v.as_i64().unwrap())
                .collect();
            let res = rt.advance(
                &owner_ids,
                &mut states,
                |id| *table.get(&id).unwrap_or(&0.0),
                &params,
            );

            // perOwner: dokladna kolejnosc i duplikaty
            let exp_per = arr(&step["perOwner"], "perOwner");
            assert_eq!(res.per_owner.len(), exp_per.len(), "{ctx} perOwner len");
            for (i, (a, e)) in res.per_owner.iter().zip(exp_per.iter()).enumerate() {
                check_tick(a, e, &format!("{ctx} perOwner[{i}]"));
            }

            // byOwner: ostatni wpis per owner (Map.set)
            let exp_by = arr(&step["byOwner"], "byOwner");
            assert_eq!(res.by_owner.len(), exp_by.len(), "{ctx} byOwner len");
            for pair in exp_by {
                let k = pair[0].as_i64().unwrap();
                let a = res
                    .by_owner
                    .get(&k)
                    .unwrap_or_else(|| panic!("{ctx} brak byOwner {k}"));
                check_tick(a, &pair[1], &format!("{ctx} byOwner[{k}]"));
            }

            // stan per owner
            let exp_states: BTreeMap<i64, f64> = arr(&step["states"], "states")
                .iter()
                .map(|p| (p[0].as_i64().unwrap(), num(&p[1])))
                .collect();
            assert_eq!(states.len(), exp_states.len(), "{ctx} states len");
            for (k, v) in &exp_states {
                let got = states
                    .get(k)
                    .unwrap_or_else(|| panic!("{ctx} brak state {k}"));
                assert_same(
                    got.tury_deficytu_zlota as f64,
                    *v,
                    &format!("{ctx} state {k}"),
                );
            }

            // akcesory (w tym owner spoza listy => brak)
            for (k, acc) in step["accessors"].as_object().unwrap() {
                let oid: i64 = k.parse().unwrap();
                let ctxa = format!("{ctx} acc {oid}");
                assert_eq!(
                    rt.is_gold_deficit(oid),
                    acc["isGoldDeficit"].as_bool().unwrap(),
                    "{ctxa} deficit"
                );
                assert_eq!(
                    rt.is_gold_deficit_starving(oid),
                    acc["isGoldDeficitStarving"].as_bool().unwrap(),
                    "{ctxa} starving"
                );
                assert_same_opt(
                    rt.gold_deficit_countdown(oid, params.zloto_deficyt_karencja_tur),
                    opt_num(&acc["countdown"]),
                    &format!("{ctxa} countdown"),
                );
                match rt.last_gold_deficit_tick(oid) {
                    None => assert!(
                        acc["lastTick"].is_null(),
                        "{ctxa} lastTick powinien byc null"
                    ),
                    Some(t) => check_tick(t, &acc["lastTick"], &format!("{ctxa} lastTick")),
                }
            }
        }
    }
}

#[test]
fn clear_resets_runtime_accessors() {
    let params = GoldDeficitParams {
        zloto_deficyt_stat_mult: 0.75,
        zloto_deficyt_karencja_tur: 1.0,
        zloto_deficyt_hp_frac: 0.08,
    };
    let mut rt = GoldDeficitRuntime::new();
    let mut states = BTreeMap::new();
    rt.advance(&[5], &mut states, |_| -1.0, &params);
    assert!(rt.is_gold_deficit(5));
    assert!(rt.is_gold_deficit_starving(5));
    rt.clear();
    assert!(!rt.is_gold_deficit(5));
    assert!(!rt.is_gold_deficit_starving(5));
    assert_eq!(rt.gold_deficit_countdown(5, 1.0), None);
    assert!(rt.last_gold_deficit_tick(5).is_none());
}

// ---------------------------------------------------------------------------
// applyGoldDeficitStatMultToCombatUnit
// ---------------------------------------------------------------------------

#[test]
fn stat_mult_matches_web_vectors() {
    let r = root();
    let cases = arr(&r["statMult"], "statMult");
    assert_eq!(cases.len(), 88);
    for (i, c) in cases.iter().enumerate() {
        let inp = &c["input"];
        let base = GoldDeficitCombatStats {
            melee_attack: num(&inp["meleeAttack"]),
            melee_defence: num(&inp["meleeDefence"]),
            weapon_damage: num(&inp["weaponDamage"]),
            piercing: num(&inp["piercing"]),
            charge_bonus: num(&inp["chargeBonus"]),
            health: num(&inp["health"]),
            missile_attack: num(&inp["missileAttack"]),
            prog_dezercji: opt_num(&c["progInput"]),
        };
        let mult = num(&c["mult"]);
        let got = apply_gold_deficit_stat_mult_to_combat_unit(&base, mult);
        let out = &c["out"];
        let ctx = format!("statMult[{i}] prog={} mult={}", c["progInput"], c["mult"]);
        assert_same(
            got.melee_attack,
            num(&out["meleeAttack"]),
            &format!("{ctx} meleeAttack"),
        );
        assert_same(
            got.melee_defence,
            num(&out["meleeDefence"]),
            &format!("{ctx} meleeDefence"),
        );
        assert_same(
            got.weapon_damage,
            num(&out["weaponDamage"]),
            &format!("{ctx} weaponDamage"),
        );
        assert_same(
            got.piercing,
            num(&out["piercing"]),
            &format!("{ctx} piercing"),
        );
        assert_same(
            got.charge_bonus,
            num(&out["chargeBonus"]),
            &format!("{ctx} chargeBonus"),
        );
        assert_same(got.health, num(&out["health"]), &format!("{ctx} health"));
        assert_same(
            got.missile_attack,
            num(&out["missileAttack"]),
            &format!("{ctx} missileAttack"),
        );
        assert_same_opt(
            got.prog_dezercji,
            opt_num(&out["Prog dezercji (% health)"]),
            &format!("{ctx} prog"),
        );
    }
}

// ---------------------------------------------------------------------------
// applyGoldDeficitHpLoss (8D-P2)
// ---------------------------------------------------------------------------

#[test]
fn hp_loss_matches_web_vectors() {
    let r = root();
    let cases = arr(&r["hpLoss"], "hpLoss");
    assert_eq!(cases.len(), 120);
    for (i, c) in cases.iter().enumerate() {
        let mut units: Vec<GoldDeficitUnit> = arr(&c["inputs"], "inputs")
            .iter()
            .map(|u| GoldDeficitUnit {
                id: u["id"].as_str().unwrap().to_string(),
                owner_id: u["ownerId"].as_i64().unwrap(),
                type_id: u["typeId"].as_str().unwrap().to_string(),
                civilian: u["civilian"].as_bool().unwrap(),
                hp: opt_num(&u["hp"]),
                hp_max: opt_num(&u["hpMax"]),
            })
            .collect();
        let owner = c["ownerId"].as_i64().unwrap();
        let frac = num(&c["hpFrac"]);
        let ctx = format!(
            "hpLoss[{i}] {} owner={owner} frac={}",
            c["scenario"], c["hpFrac"]
        );
        let res = apply_gold_deficit_hp_loss(&mut units, owner, frac, max_hp_table);

        let exp_destroyed: Vec<String> = arr(&c["destroyedIds"], "destroyedIds")
            .iter()
            .map(|v| v.as_str().unwrap().to_string())
            .collect();
        assert_eq!(res.destroyed_ids, exp_destroyed, "{ctx} destroyedIds");
        assert_eq!(
            res.damaged_count as u64,
            c["damagedCount"].as_u64().unwrap(),
            "{ctx} damagedCount"
        );

        let fin = arr(&c["final"], "final");
        assert_eq!(units.len(), fin.len());
        for (u, e) in units.iter().zip(fin.iter()) {
            let uctx = format!("{ctx} unit {}", u.id);
            assert_eq!(u.id, e["id"].as_str().unwrap(), "{uctx} id");
            assert_same_opt(u.hp, opt_num(&e["hp"]), &format!("{uctx} hp"));
            assert_same_opt(u.hp_max, opt_num(&e["hpMax"]), &format!("{uctx} hpMax"));
        }
    }
}

#[test]
fn hp_loss_guard_properties() {
    // Cywil nietykany, zla strona nietykana, frac<=0 => nic.
    let mk = |id: &str, owner: i64, civ: bool, hp: Option<f64>| GoldDeficitUnit {
        id: id.into(),
        owner_id: owner,
        type_id: "tPiech".into(),
        civilian: civ,
        hp,
        hp_max: Some(10.0),
    };
    let mut units = vec![
        mk("c", 1, true, Some(3.0)),
        mk("o", 2, false, Some(3.0)),
        mk("w", 1, false, Some(3.0)),
    ];
    let res = apply_gold_deficit_hp_loss(&mut units, 1, 0.5, max_hp_table);
    assert_eq!(res.damaged_count, 1);
    assert_eq!(units[0].hp, Some(3.0));
    assert_eq!(units[1].hp, Some(3.0));
    assert_eq!(units[2].hp, Some(0.0));
    assert_eq!(res.destroyed_ids, vec!["w".to_string()]);

    let mut units2 = vec![mk("w", 1, false, Some(3.0))];
    let res2 = apply_gold_deficit_hp_loss(&mut units2, 1, 0.0, max_hp_table);
    assert_eq!(res2.damaged_count, 0);
    assert_eq!(units2[0].hp, Some(3.0));
}

#[test]
fn hp_loss_minimum_one_point_and_clamp() {
    // maxHp 10, frac 0.08 => floor(0.8)=0 => strata minimum 1.
    let mut units = vec![GoldDeficitUnit {
        id: "a".into(),
        owner_id: 1,
        type_id: "tPiech".into(),
        civilian: false,
        hp: None,
        hp_max: None,
    }];
    apply_gold_deficit_hp_loss(&mut units, 1, 0.08, max_hp_table);
    assert_eq!(units[0].hp, Some(9.0));
    assert_eq!(units[0].hp_max, Some(10.0));
    // frac > 1 zaciskany do 1 => calkowita strata maxHp.
    let mut units2 = vec![GoldDeficitUnit {
        hp: Some(10.0),
        ..units[0].clone()
    }];
    apply_gold_deficit_hp_loss(&mut units2, 1, 1.5, max_hp_table);
    assert_eq!(units2[0].hp, Some(0.0));
}

// ---------------------------------------------------------------------------
// Pomocnicze: typy wyjsciowe uzywane w testach (zapobiega ostrzezeniom o nieuzywanych).
// ---------------------------------------------------------------------------

#[test]
fn default_params_and_state_types() {
    let s = GoldDeficitState::default();
    assert_eq!(s.tury_deficytu_zlota, 0);
    let p = build_gold_deficit_params(&RawGoldDeficitInput::default(), Difficulty::Normal);
    assert_same(p.zloto_deficyt_stat_mult, 0.75, "fallback stat");
    assert_same(p.zloto_deficyt_karencja_tur, 3.0, "fallback karencja");
    assert_same(p.zloto_deficyt_hp_frac, 0.08, "fallback hp");
}
