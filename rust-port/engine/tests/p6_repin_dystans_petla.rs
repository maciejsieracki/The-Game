//! R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1 -- testy portu fazy dystansowej `resolveCombat`
//! (web `combat.ts` "Phase 0: Ranged"). Wektory `dystans-petla.json` wygenerowane przez
//! `p6_repin_dystans_petla_gen.mjs` z uruchomionego kodu weba (origin/main, esbuild, Node 22):
//! sekwencja losowan zapisana z wywolania weba, strzaly sparsowane z jego logu.

use civ_engine::domain::combat::ranged_phase::{
    resolve_ranged_phase, RangedPhaseInput, RangedSide, Side,
};
use civ_engine::domain::unit_power::ranged_shot_damage;
use serde_json::Value;

const VEC: &str = include_str!("p6_repin_dystans_vectors/dystans-petla.json");

fn f(v: &Value, k: &str) -> f64 {
    v[k].as_f64().unwrap_or(0.0)
}

fn side(u: &Value, ammo: i64, counter_mult: f64) -> RangedSide {
    let health = f(u, "health");
    let prog = u["Prog dezercji (% health)"].as_f64().unwrap_or(0.0);
    RangedSide {
        counter_typ: u["counterTyp"].as_str().map(str::to_owned),
        typ_nazwa: u["typNazwa"].as_str().map(str::to_owned),
        is_ranged: f(u, "missileAttack") > 0.0,
        ammo,
        hp: health,
        melee_attack: f(u, "meleeAttack"),
        missile_attack: f(u, "missileAttack"),
        melee_defence: f(u, "meleeDefence"),
        armor: f(u, "armor"),
        counter_mult,
        rout_threshold: prog * health,
        unbreakable: u["unbreakable"].as_bool().unwrap_or(false),
    }
}

#[test]
fn p6_repin_dystans_petla_matches_web() {
    let root: Value = serde_json::from_str(VEC).expect("dystans-petla.json");
    let cases = root["cases"].as_array().expect("cases");
    assert_eq!(cases.len(), 600);
    let (mut total_shots, mut with_rout, mut with_limit) = (0usize, 0usize, 0usize);
    for (n, c) in cases.iter().enumerate() {
        let a = &c["attacker"];
        let d = &c["defender"];
        let struct_pct = f(c, "structPct");
        let input = RangedPhaseInput {
            attacker: side(a, c["attackerAmmo"].as_i64().unwrap(), 1.0),
            defender: side(d, c["defenderAmmo"].as_i64().unwrap(), 1.0),
            def_final_obrona: f(d, "meleeDefence") * (1.0 + struct_pct / 100.0),
            river_mult: 1.0,
            max_rounds: c["maxRounds"].as_u64().unwrap() as u32,
            start_rounds: 0,
        };
        let draws: Vec<f64> = c["draws"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_f64().unwrap())
            .collect();
        let mut it = draws.iter();
        let res = resolve_ranged_phase(input, || *it.next().expect("za malo losowan"));
        assert_eq!(it.next(), None, "przypadek {n}: nadmiar losowan");

        let exp = c["expected"]["shots"].as_array().unwrap();
        assert_eq!(res.shots.len(), exp.len(), "przypadek {n}: liczba strzalow");
        for (s, e) in res.shots.iter().zip(exp) {
            let ctx = format!("przypadek {n} R{}", s.round);
            assert_eq!(s.round as u64, e["round"].as_u64().unwrap(), "{ctx}");
            let want = if e["side"] == "attacker" {
                Side::Attacker
            } else {
                Side::Defender
            };
            assert_eq!(s.side, want, "{ctx}");
            assert_eq!(s.hit, e["hit"].as_bool().unwrap(), "{ctx} trafienie");
            assert!((s.hit_pct - f(e, "hitPct")).abs() < 1e-9, "{ctx} hit%");
            if s.hit {
                assert_eq!(s.damage as f64, f(e, "damage"), "{ctx} obrazenia");
                assert_eq!(s.target_hp, f(e, "targetHp"), "{ctx} HP celu");
            }
        }
        total_shots += exp.len();
        let hint = c["expected"]["routedHint"].as_bool().unwrap();
        assert_eq!(
            !res.routed.is_empty(),
            hint,
            "przypadek {n}: rout/zniszczenie"
        );
        if hint {
            with_rout += 1;
        }
        let limit = c["expected"]["limit"].as_bool().unwrap();
        if limit {
            with_limit += 1;
            assert!(res.rounds > c["maxRounds"].as_u64().unwrap() as u32);
        }
    }
    assert!(total_shots > 2000, "za malo strzalow: {total_shots}");
    assert!(with_rout > 20, "za malo routow: {with_rout}");
    assert!(with_limit > 5, "za malo limitow rund: {with_limit}");
}

#[test]
fn p6_repin_dystans_petla_uses_ranged_shot_damage() {
    // Procarz x3: (20 - 5) * 1 * 3 = 45 -- dowod, ze petla korzysta z mnoznika klasy strzelca.
    let shooter = RangedSide {
        counter_typ: Some("Slinger".into()),
        typ_nazwa: Some("Procarz".into()),
        is_ranged: true,
        ammo: 1,
        hp: 100.0,
        melee_attack: 10.0,
        missile_attack: 20.0,
        melee_defence: 0.0,
        armor: 0.0,
        counter_mult: 1.0,
        rout_threshold: 0.0,
        unbreakable: false,
    };
    let target = RangedSide {
        is_ranged: false,
        ammo: 0,
        hp: 100.0,
        armor: 5.0,
        counter_typ: Some("Spearman".into()),
        typ_nazwa: Some("Hoplita".into()),
        missile_attack: 0.0,
        ..shooter.clone()
    };
    let res = resolve_ranged_phase(
        RangedPhaseInput {
            attacker: shooter,
            defender: target,
            def_final_obrona: 0.0,
            river_mult: 1.0,
            max_rounds: 200,
            start_rounds: 0,
        },
        || 0.0,
    );
    assert_eq!(res.shots.len(), 1);
    assert_eq!(
        res.shots[0].damage,
        ranged_shot_damage(Some("Slinger"), Some("Procarz"), 20.0, 5.0, 1.0)
    );
    assert_eq!(res.shots[0].damage, 45);
    assert_eq!(res.hp_defender, 55.0);
}

#[test]
fn p6_repin_dystans_petla_no_ranged_units_is_noop() {
    let u = RangedSide {
        counter_typ: None,
        typ_nazwa: None,
        is_ranged: false,
        ammo: 5,
        hp: 10.0,
        melee_attack: 1.0,
        missile_attack: 0.0,
        melee_defence: 1.0,
        armor: 0.0,
        counter_mult: 1.0,
        rout_threshold: 0.0,
        unbreakable: false,
    };
    let res = resolve_ranged_phase(
        RangedPhaseInput {
            attacker: u.clone(),
            defender: u,
            def_final_obrona: 1.0,
            river_mult: 1.0,
            max_rounds: 200,
            start_rounds: 0,
        },
        || panic!("brak strzalow -- rng nie moze byc wolany"),
    );
    assert_eq!(res.rounds, 0);
    assert!(res.shots.is_empty() && res.routed.is_empty());
}
