//! P6 SIEGE-TAKTYKA K5i (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I-Q1): testy zgodnosci `domain::siege_tactics_blow` z kodem weba.
//!
//! Wektory: `p6_siege_tactics_blow_vectors/vectors.json`, generowane przez `p6_siege_tactics_blow_gen.mjs` (Node 22).
//! Generator WYKONUJE zakresy linii pinu `07d2fbd72` (battleScene.ts: 8894-8900, 8958-9010, 9020-9068; combat.ts: 440-517)
//! w `new Function` ze stubem sceny; straznik SHA-256 jest w generatorze. Rzut `Math.random` = wejscie wektora (`r01`).
//! Test sprawdza: pudlo/trafienie, `isCharge`, zwracane obrazenia, HP po ciosie i dokladna liste efektow sceny.
//! Pokrycie galezi jest liczone i asertowane (liczniki ponizej).

use civ_engine::domain::siege_tactics_blow::{
    single_blow, BlowInput, ClashTag, DefenderState, HitArc, Outcome, SceneEffect, SequenceRolls,
    Side,
};

const VECTORS: &str = include_str!("p6_siege_tactics_blow_vectors/vectors.json");

fn load() -> serde_json::Value {
    serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em")
}

/// Liczba z wektora: JSON nie ma NaN/Infinity, wiec sa zapisane jako tekst.
fn num(v: &serde_json::Value) -> f64 {
    if let Some(s) = v.as_str() {
        return match s {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => panic!("nieznana liczba w wektorze: {other}"),
        };
    }
    v.as_f64().expect("liczba")
}

/// Rownosc jak w wektorach: NaN == NaN.
fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

fn arc(s: &str) -> HitArc {
    match s {
        "front" => HitArc::Front,
        "flank" => HitArc::Flank,
        "rear" => HitArc::Rear,
        other => panic!("nieznany kierunek: {other}"),
    }
}

fn input_from(i: &serde_json::Value) -> BlowInput {
    BlowInput {
        ranged: i["ranged"].as_bool().unwrap(),
        first_blow_of_pair: !i["engagedBefore"].as_bool().unwrap(),
        defender_braces_against_charge: i["braces"].as_bool().unwrap(),
        attacker_mounted: i["mounted"].as_bool().unwrap(),
        hit_arc: arc(i["hitArc"].as_str().unwrap()),
        atk_melee: num(&i["atkMelee"]),
        atk_shoot_acc: num(&i["atkShootAcc"]),
        def_final_obrona: num(&i["defFinalObrona"]),
        round_atk_charge: num(&i["roundAtkCharge"]),
        def_armor: num(&i["defArmor"]),
        atk_missile: num(&i["atkMissile"]),
        weapon_damage: num(&i["weaponDamage"]),
        piercing: num(&i["piercing"]),
        ctr_atk_vs_def: num(&i["ctrAtkVsDef"]),
        ranged_class_mult: num(&i["rangedClassMult"]),
        defender: DefenderState {
            hp: num(&i["defHp"]),
            max_hp: num(&i["defMaxHp"]),
            morale: num(&i["morale"]),
            flee_morale: num(&i["fleeMorale"]),
            dead: i["dead"].as_bool().unwrap(),
            fading_out: i["fadingOut"].as_bool().unwrap(),
            routed: i["routed"].as_bool().unwrap(),
            never_rout: i["neverRout"].as_bool().unwrap(),
            removed: i["removed"].as_bool().unwrap(),
        },
        routed_after_morale: i["routedAfter"].as_bool().unwrap(),
    }
}

/// Efekt z wektora (`{e, dmg?, extra?, who?, amount?, tag?}`) na enum Rust.
fn effect_from(e: &serde_json::Value) -> SceneEffect {
    match e["e"].as_str().unwrap() {
        "UpdateHpBar" => SceneEffect::UpdateHpBar,
        "ApplyMoraleDamage" => SceneEffect::ApplyMoraleDamage {
            dmg: num(&e["dmg"]),
            extra_morale: num(&e["extra"]),
        },
        "GainMorale" => SceneEffect::GainMorale {
            side: match e["who"].as_str().unwrap() {
                "atk" => Side::Attacker,
                "def" => Side::Defender,
                other => panic!("nieznana strona: {other}"),
            },
            amount: num(&e["amount"]),
        },
        "StartFade" => SceneEffect::StartFade,
        "ShakeAllies" => SceneEffect::ShakeAllies,
        "BoostEnemies" => SceneEffect::BoostEnemies,
        "PushClash" => SceneEffect::PushClash {
            tag: match e["tag"].as_str().unwrap() {
                "rout" => ClashTag::Rout,
                "padl" => ClashTag::Padl,
                "" => ClashTag::Plain,
                other => panic!("nieznany tag: {other}"),
            },
        },
        other => panic!("nieznany efekt: {other}"),
    }
}

fn effects_eq(got: &[SceneEffect], want: &[SceneEffect]) -> bool {
    got.len() == want.len()
        && got.iter().zip(want).all(|(g, w)| match (g, w) {
            (
                SceneEffect::ApplyMoraleDamage {
                    dmg: gd,
                    extra_morale: ge,
                },
                SceneEffect::ApplyMoraleDamage {
                    dmg: wd,
                    extra_morale: we,
                },
            ) => same(*gd, *wd) && same(*ge, *we),
            (
                SceneEffect::GainMorale {
                    side: gs,
                    amount: ga,
                },
                SceneEffect::GainMorale {
                    side: ws,
                    amount: wa,
                },
            ) => gs == ws && same(*ga, *wa),
            _ => g == w,
        })
}

#[derive(Default, Debug)]
struct Coverage {
    total: usize,
    miss: usize,
    hit_melee_charge: usize,
    hit_melee_plain: usize,
    hit_ranged: usize,
    arc_flank: usize,
    arc_rear: usize,
    charge_extra_morale: usize,
    outcome_rout_before_death: usize,
    outcome_kill: usize,
    outcome_morale_only: usize,
    morale_only_with_rout: usize,
    dmg_floor_applied: usize,
    nan_inputs: usize,
    infinite_inputs: usize,
}

#[test]
fn wektory_zgodne_z_pinem_i_pokrycie_galezi() {
    let v = load();
    let cases = v["cases"].as_array().expect("cases");
    assert!(
        cases.len() >= 500,
        "minimum 500 przypadkow, jest {}",
        cases.len()
    );
    let mut cov = Coverage::default();

    for case in cases {
        let id = case["id"].as_str().unwrap();
        let i = &case["input"];
        let e = &case["expect"];
        let input = input_from(i);

        let mut rolls = SequenceRolls::new(vec![num(&i["r01"])]);
        let out = single_blow(&input, &mut rolls);

        // Zgodnosc z pinem.
        assert_eq!(out.missed, e["missed"].as_bool().unwrap(), "{id}: pudlo");
        assert_eq!(
            out.is_charge,
            e["isCharge"].as_bool().unwrap(),
            "{id}: isCharge"
        );
        assert!(
            same(out.dmg, num(&e["returned"])),
            "{id}: dmg {} != {}",
            out.dmg,
            num(&e["returned"])
        );
        assert!(
            same(out.def_hp_after, num(&e["defHpAfter"])),
            "{id}: HP po ciosie {} != {}",
            out.def_hp_after,
            num(&e["defHpAfter"])
        );
        let want: Vec<SceneEffect> = e["events"]
            .as_array()
            .unwrap()
            .iter()
            .map(effect_from)
            .collect();
        assert!(
            effects_eq(&out.effects, &want),
            "{id}: efekty {:?} != {:?}",
            out.effects,
            want
        );

        // Pokrycie (liczniki).
        cov.total += 1;
        let inputs_text = i.to_string();
        if inputs_text.contains("\"NaN\"") {
            cov.nan_inputs += 1;
        }
        if inputs_text.contains("Infinity") {
            cov.infinite_inputs += 1;
        }
        if out.missed {
            cov.miss += 1;
            assert!(out.effects.is_empty(), "{id}: pudlo bez efektow");
            continue;
        }
        if input.ranged {
            cov.hit_ranged += 1;
        } else if out.is_charge {
            cov.hit_melee_charge += 1;
        } else {
            cov.hit_melee_plain += 1;
        }
        if input.hit_arc == HitArc::Flank {
            cov.arc_flank += 1;
        }
        if input.hit_arc == HitArc::Rear {
            cov.arc_rear += 1;
        }
        if !input.ranged && input.attacker_mounted && out.is_charge && out.extra_morale >= 15.0 {
            cov.charge_extra_morale += 1;
        }
        match out.outcome {
            Outcome::RoutBeforeDeath => cov.outcome_rout_before_death += 1,
            Outcome::Kill => cov.outcome_kill += 1,
            Outcome::MoraleOnly => {
                cov.outcome_morale_only += 1;
                if input.routed_after_morale {
                    cov.morale_only_with_rout += 1;
                }
            }
            Outcome::None => panic!("{id}: trafienie bez rozstrzygniecia"),
        }
        // Obrażenia min 1 (podloga) wystepuja, gdy surowe * kontra < 0.5.
        if out.dmg == 1.0 {
            cov.dmg_floor_applied += 1;
        }
    }

    eprintln!("pokrycie galezi K5i: {cov:?}");
    assert!(cov.miss > 0, "brak pudel");
    assert!(cov.hit_melee_charge > 0, "brak szarzy wrecz");
    assert!(cov.hit_melee_plain > 0, "brak trafien wrecz bez szarzy");
    assert!(cov.hit_ranged > 0, "brak trafien dystansowych");
    assert!(cov.arc_flank > 0 && cov.arc_rear > 0, "brak flanki/tylu");
    assert!(cov.charge_extra_morale > 0, "brak extraMorale szarzy");
    assert!(
        cov.outcome_rout_before_death > 0,
        "brak rout przed smiercia"
    );
    assert!(cov.outcome_kill > 0, "brak zabicia");
    assert!(cov.outcome_morale_only > 0, "brak zwyklego spadku morale");
    assert!(
        cov.morale_only_with_rout > 0,
        "brak morale z rout (tag rout)"
    );
    assert!(cov.dmg_floor_applied > 0, "brak podlogi obrazen 1");
    assert!(cov.nan_inputs > 0, "brak przypadkow NaN");
    assert!(cov.infinite_inputs > 0, "brak przypadkow Infinity");
}

#[test]
fn hit_pct_w_granicach_tw_i_rzut_zuzyty_raz() {
    // hitPct jest zawsze w [hit_min, hit_max] = [15, 75] dla skonczonych danych wejsciowych.
    let v = load();
    for case in v["cases"].as_array().unwrap() {
        let i = &case["input"];
        if i.to_string().contains("NaN") || i.to_string().contains("Infinity") {
            continue;
        }
        let input = input_from(i);
        let mut rolls = SequenceRolls::new(vec![num(&i["r01"])]);
        let out = single_blow(&input, &mut rolls);
        assert!(
            (15.0..=75.0).contains(&out.hit_pct),
            "{}: hitPct {}",
            case["id"],
            out.hit_pct
        );
        assert!(
            (out.roll - num(&i["r01"]) * 100.0).abs() < 1e-12,
            "rzut = u*100"
        );
    }
}

#[test]
fn brak_wlasnego_rng_rzut_z_wstrzyknietej_sekwencji() {
    // Dwa identyczne ciosy z ta sama sekwencja daja ten sam wynik (brak stanu losowego w module).
    let v = load();
    let case = &v["cases"][0];
    let input = input_from(&case["input"]);
    let a = single_blow(&input, &mut SequenceRolls::new(vec![0.37]));
    let b = single_blow(&input, &mut SequenceRolls::new(vec![0.37]));
    assert_eq!(a, b);
}
