//! P6 SIEGE-TAKTYKA K5i-2b (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2B-Q1): test end-to-end `single_blow_full` z kodem weba.
//!
//! Wektory: `p6_siege_tactics_blow_full_vectors/vectors.json`, generowane przez `p6_siege_tactics_blow_full_gen.mjs`
//! (Node 22). Generator WYKONUJE cale cialo `_singleBlow` (battleScene.ts:8812-9010, pin `07d2fbd72`) w `new Function`
//! ze stubami wyjsc spoza zakresu (patrz naglowek generatora). Test sprawdza:
//!
//! * skladanie: argumenty `hitChanceTw` (atak, defFinalObrona, bonus szarzy), argumenty `baseDamage`/`rangeDamage`,
//!   `rangedDamageMultFor` z `unit_power` (nie z wektora), `isCharge`;
//! * wynik ciosu: pudlo/trafienie, `hitPct`, `roll`, obrazenia, HP obroncy, `extraMorale`, `engaged_add`.
//!
//! Strazniki: SHA-256 fragmentow pinu, liczniki galezi (wszystkie > 0), >= 500 przypadkow, NaN/Infinity obecne.

use civ_engine::domain::siege_tactics_blow::{DefenderState, HitArc, Outcome, SequenceRolls};
use civ_engine::domain::siege_tactics_blow_full::{
    compose_blow, single_blow_full, AtkMods, AttackerCu, BlowEnv, DefMods, DefenderCu,
    FullBlowInput,
};

const VECTORS: &str = include_str!("p6_siege_tactics_blow_full_vectors/vectors.json");
const FRAGMENT_SHA256: &str = "b2f9e19f1e35644e0e2ea636a9d50a02dd10d729355de5eb3eb35668910e5526";

fn load() -> serde_json::Value {
    serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em")
}

/// Liczba z wektora: NaN/Infinity zapisane jako tekst.
fn num(v: &serde_json::Value) -> f64 {
    if let Some(s) = v.as_str() {
        return match s {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => other.parse::<f64>().expect("liczba w wektorze"),
        };
    }
    v.as_f64().expect("liczba w wektorze")
}

/// Liczba opcjonalna: `null` -> None.
fn opt_num(v: &serde_json::Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
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

fn build_input(c: &serde_json::Value, top: &serde_json::Value) -> FullBlowInput {
    let i = &c["in"];
    let cu_a = &i["cuA"];
    let cu_d = &i["cuD"];
    let am = &i["atkMods"];
    let dm = &i["defMods"];
    let at_name = i["atkName"].as_str().expect("atkName");
    let river_row = i["riverRow"].as_bool().expect("riverRow");
    FullBlowInput {
        ranged: i["ranged"].as_bool().expect("ranged"),
        hit_arc: arc(i["hitArc"].as_str().expect("hitArc")),
        attacker: AttackerCu {
            weapon_damage: num(&cu_a["weaponDamage"]),
            piercing: num(&cu_a["piercing"]),
            melee_attack: num(&cu_a["meleeAttack"]),
            missile_attack: opt_num(&cu_a["missileAttack"]),
            charge_bonus: num(&cu_a["chargeBonus"]),
            counter_typ: cu_a["counterTyp"].as_str().expect("counterTyp").to_string(),
            typ_nazwa: cu_a["typNazwa"].as_str().expect("typNazwa").to_string(),
        },
        atk_mods: AtkMods {
            atk: num(&am["atk"]),
            ranged_atk: num(&am["rangedAtk"]),
            uderzenie: num(&am["uderzenie"]),
        },
        atk_diff_mult: num(&i["diffA"]),
        atk_mounted: i["attacker"]["mounted"].as_bool().expect("mounted"),
        defender: DefenderCu {
            melee_defence: num(&cu_d["meleeDefence"]),
            armor: num(&cu_d["armor"]),
            kara_flanka: opt_num(&cu_d["Kara obrony z flanki (%)"]),
            kara_tyl: opt_num(&cu_d["Kara obrony z tylu (%)"]),
        },
        def_mods: DefMods {
            obrona: num(&dm["obrona"]),
            pancerz: num(&dm["pancerz"]),
        },
        def_diff_mult: num(&i["diffD"]),
        def_on_wall: i["defender"]["onWall"].as_bool().expect("onWall"),
        def_fortified_in_field: i["defender"]["fortified"].as_bool().expect("fortified"),
        def_wall_civ_mult: num(&i["wallCiv"]),
        def_braces_against_charge: i["braces"].as_bool().expect("braces"),
        first_blow_of_pair: !i["engagedPre"].as_bool().expect("engagedPre"),
        counter_mult: num(&i["ctr"]),
        env: BlowEnv {
            is_city_defense_battle: i["isCity"].as_bool().expect("isCity"),
            wall_bonus_proc: num(&i["wallBonus"]),
            gated_terrain_multiplier: num(&i["gated"]),
            field_terrain_multiplier: num(&i["tdm"]),
            atk_tile_is_river: at_name == "Rzeka",
            river_row_exists: river_row,
            river_attack_mult: num(&top["riverMult"]),
            atk_on_ford: i["atkFord"].as_bool().expect("atkFord"),
            def_on_ford_raw: i["defFord"].as_bool().expect("defFord"),
            shore_adjacent: i["shore"].as_bool().expect("shore"),
            brod_kara_obrona: num(&top["brod"]["karaObrona"]),
            brod_bonus_brzegu: num(&top["brod"]["bonusObronaBrzegu"]),
            fortify_obrona_proc: num(&top["fortify"]),
        },
        defender_state: DefenderState {
            hp: num(&i["defender"]["hp"]),
            max_hp: num(&i["defender"]["maxHp"]),
            morale: 100.0,
            flee_morale: 0.0,
            dead: false,
            fading_out: false,
            routed: false,
            never_rout: false,
            removed: false,
        },
        routed_after_morale: false,
    }
}

#[derive(Default)]
struct Cover {
    total: usize,
    miss: usize,
    hit_melee: usize,
    hit_ranged: usize,
    charge: usize,
    braces_blocks_charge: usize,
    not_first_blow: usize,
    flank_hit: usize,
    rear_hit: usize,
    front_hit: usize,
    mounted_charge_morale: usize,
    on_wall: usize,
    city_battle: usize,
    field_battle: usize,
    fortified_defender: usize,
    ford_defender: usize,
    shore_bonus: usize,
    river_attack: usize,
    slinger_ranged: usize,
    lucznik_ranged: usize,
    other_ranged_mult_one: usize,
    kill: usize,
    morale_only: usize,
    dmg_floor_one: usize,
    nan_case: usize,
    inf_case: usize,
    counter_not_one: usize,
}

#[test]
fn zgodnosc_z_pinem_end_to_end() {
    let v = load();
    assert_eq!(
        v["fragmentSha256"].as_str().expect("sha"),
        FRAGMENT_SHA256,
        "fragmenty pinu zmienione: wygeneruj wektory ponownie i zaktualizuj sume"
    );
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 500, "za malo przypadkow: {}", cases.len());

    let mut cov = Cover::default();
    let mut failures: Vec<String> = Vec::new();

    for c in cases {
        let id = c["id"].as_u64().expect("id");
        let input = build_input(c, &v);
        let o = &c["out"];
        let u = num(&c["in"]["u"]);
        let mut rolls = SequenceRolls::new(vec![u]);
        let full = single_blow_full(&input, &mut rolls);
        let comp = full.composition;
        let blow = &full.blow;
        let mut fail = |what: &str, got: String, want: String| {
            failures.push(format!("#{id} {what}: rust={got} js={want}"));
        };

        // Skladanie: argumenty hitChanceTw.
        let hit_args = o["hitArgs"].as_array().expect("hitArgs");
        let want_hit_atk = num(&hit_args[0]);
        let got_hit_atk = if input.ranged {
            comp.atk_shoot_acc
        } else {
            comp.atk_melee
        };
        if !same(got_hit_atk, want_hit_atk) {
            fail("hit.atk", got_hit_atk.to_string(), want_hit_atk.to_string());
        }
        if !same(comp.def_final_obrona, num(&hit_args[1])) {
            fail(
                "hit.defFinalObrona",
                comp.def_final_obrona.to_string(),
                num(&hit_args[1]).to_string(),
            );
        }
        if !same(comp.charge_hit_bonus, num(&hit_args[2])) {
            fail(
                "hit.bonus",
                comp.charge_hit_bonus.to_string(),
                num(&hit_args[2]).to_string(),
            );
        }
        // Skladanie: baseDamage (melee) / rangeDamage (pocisk) i mnoznik klasy.
        if let Some(b) = o["baseArgs"].as_array() {
            if !same(comp.def_armor, num(&b[1])) {
                fail(
                    "base.armor",
                    comp.def_armor.to_string(),
                    num(&b[1]).to_string(),
                );
            }
            if !same(comp.round_atk_charge, num(&b[3])) {
                fail(
                    "base.charge",
                    comp.round_atk_charge.to_string(),
                    num(&b[3]).to_string(),
                );
            }
            if comp.is_charge != b[4].as_bool().expect("isCharge") {
                fail(
                    "base.isCharge",
                    comp.is_charge.to_string(),
                    b[4].to_string(),
                );
            }
        }
        if let Some(r) = o["rangeArgs"].as_array() {
            if !same(comp.atk_missile, num(&r[0])) {
                fail(
                    "range.missile",
                    comp.atk_missile.to_string(),
                    num(&r[0]).to_string(),
                );
            }
            if !same(comp.def_armor, num(&r[1])) {
                fail(
                    "range.armor",
                    comp.def_armor.to_string(),
                    num(&r[1]).to_string(),
                );
            }
        }
        if !o["rdm"].is_null() {
            let want = num(&o["rdm"]);
            if !same(comp.ranged_class_mult, want) {
                fail("rdm", comp.ranged_class_mult.to_string(), want.to_string());
            }
        }
        // Wynik ciosu (rdzen K5I).
        let want_missed = o["missed"].as_bool().expect("missed");
        if blow.missed != want_missed {
            fail("missed", blow.missed.to_string(), want_missed.to_string());
        }
        if !same(blow.hit_pct, num(&o["hitPct"])) {
            fail(
                "hitPct",
                blow.hit_pct.to_string(),
                num(&o["hitPct"]).to_string(),
            );
        }
        if !same(blow.roll, num(&o["roll"])) {
            fail("roll", blow.roll.to_string(), num(&o["roll"]).to_string());
        }
        if !same(blow.dmg, num(&o["dmg"])) {
            fail("dmg", blow.dmg.to_string(), num(&o["dmg"]).to_string());
        }
        if !same(num(&c["out"]["ret"]), blow.dmg) {
            fail(
                "ret",
                blow.dmg.to_string(),
                num(&c["out"]["ret"]).to_string(),
            );
        }
        if !same(blow.def_hp_after, num(&o["defHpAfter"])) {
            fail(
                "defHpAfter",
                blow.def_hp_after.to_string(),
                num(&o["defHpAfter"]).to_string(),
            );
        }
        if !want_missed {
            let want_extra = num(&o["extraMorale"]);
            if !same(blow.extra_morale, want_extra) {
                fail(
                    "extraMorale",
                    blow.extra_morale.to_string(),
                    want_extra.to_string(),
                );
            }
        }
        let want_charge = o["isCharge"].as_bool().expect("isCharge");
        if blow.is_charge != want_charge {
            fail(
                "isCharge",
                blow.is_charge.to_string(),
                want_charge.to_string(),
            );
        }
        let engaged_after = o["engagedAfter"].as_bool().expect("engagedAfter");
        let engaged_pre = o["engagedBefore"].as_bool().expect("engagedBefore");
        if blow.engaged_add != !input.ranged {
            fail(
                "engagedAdd",
                blow.engaged_add.to_string(),
                (!input.ranged).to_string(),
            );
        }
        if engaged_after != (engaged_pre || !input.ranged) {
            fail(
                "engagedAfter",
                engaged_after.to_string(),
                (engaged_pre || !input.ranged).to_string(),
            );
        }

        // Pokrycie galezi.
        cov.total += 1;
        if want_missed {
            cov.miss += 1;
        } else if input.ranged {
            cov.hit_ranged += 1;
        } else {
            cov.hit_melee += 1;
        }
        if want_charge {
            cov.charge += 1;
        }
        if !input.ranged && !input.first_blow_of_pair {
            cov.not_first_blow += 1;
        }
        if !input.ranged && input.first_blow_of_pair && input.def_braces_against_charge {
            cov.braces_blocks_charge += 1;
        }
        if !want_missed {
            match input.hit_arc {
                HitArc::Flank => cov.flank_hit += 1,
                HitArc::Rear => cov.rear_hit += 1,
                HitArc::Front => cov.front_hit += 1,
            }
            if !input.ranged && want_charge && input.atk_mounted {
                cov.mounted_charge_morale += 1;
            }
            match blow.outcome {
                Outcome::Kill => cov.kill += 1,
                Outcome::MoraleOnly => cov.morale_only += 1,
                Outcome::RoutBeforeDeath | Outcome::None => {}
            }
            if blow.dmg == 1.0 {
                cov.dmg_floor_one += 1;
            }
        }
        if input.def_on_wall {
            cov.on_wall += 1;
        }
        if input.env.is_city_defense_battle {
            cov.city_battle += 1;
        } else {
            cov.field_battle += 1;
        }
        if input.def_fortified_in_field {
            cov.fortified_defender += 1;
        }
        if input.env.def_on_ford_raw && !input.def_on_wall {
            cov.ford_defender += 1;
        }
        if input.env.shore_adjacent
            && input.env.atk_on_ford
            && !input.env.def_on_ford_raw
            && !input.def_on_wall
        {
            cov.shore_bonus += 1;
        }
        if input.env.atk_tile_is_river && input.env.river_row_exists {
            cov.river_attack += 1;
        }
        if input.ranged {
            match (c["out"]["rdmTyp"].as_str(), c["out"]["rdmJedn"].as_str()) {
                (Some("Slinger"), _) => cov.slinger_ranged += 1,
                (Some("Distance"), Some(name))
                    if name.trim().to_lowercase().starts_with("łucznik") =>
                {
                    cov.lucznik_ranged += 1
                }
                _ => cov.other_ranged_mult_one += 1,
            }
        }
        if input.counter_mult != 1.0 {
            cov.counter_not_one += 1;
        }
        let text = c.to_string();
        if text.contains("\"NaN\"") {
            cov.nan_case += 1;
        }
        if text.contains("Infinity") {
            cov.inf_case += 1;
        }
    }

    assert!(
        failures.is_empty(),
        "rozbieznosci z pinem ({}):\n{}",
        failures.len(),
        failures
            .iter()
            .take(40)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );

    // Liczniki galezi: kazda galez musi byc pokryta wektorami.
    let checks: [(&str, usize); 26] = [
        ("miss", cov.miss),
        ("hit_melee", cov.hit_melee),
        ("hit_ranged", cov.hit_ranged),
        ("charge", cov.charge),
        ("braces_blocks_charge", cov.braces_blocks_charge),
        ("not_first_blow", cov.not_first_blow),
        ("flank_hit", cov.flank_hit),
        ("rear_hit", cov.rear_hit),
        ("front_hit", cov.front_hit),
        ("mounted_charge_morale", cov.mounted_charge_morale),
        ("on_wall", cov.on_wall),
        ("city_battle", cov.city_battle),
        ("field_battle", cov.field_battle),
        ("fortified_defender", cov.fortified_defender),
        ("ford_defender", cov.ford_defender),
        ("shore_bonus", cov.shore_bonus),
        ("river_attack", cov.river_attack),
        ("slinger_ranged", cov.slinger_ranged),
        ("lucznik_ranged", cov.lucznik_ranged),
        ("other_ranged_mult_one", cov.other_ranged_mult_one),
        ("kill", cov.kill),
        ("morale_only", cov.morale_only),
        ("dmg_floor_one", cov.dmg_floor_one),
        ("nan_case", cov.nan_case),
        ("inf_case", cov.inf_case),
        ("counter_not_one", cov.counter_not_one),
    ];
    for (name, n) in checks {
        assert!(n > 0, "galaz bez pokrycia: {name}");
    }
    assert!(cov.total >= 500);
}

#[test]
fn ranged_class_mult_z_unit_power_nie_z_wektora() {
    // Slinger x3, lucznik piesi (Distance + "Łucznik") x2, reszta x1: zrodlo to unit_power, nie wektor.
    let base = |typ: &str, jednostka: &str| FullBlowInput {
        ranged: true,
        hit_arc: HitArc::Front,
        attacker: AttackerCu {
            weapon_damage: 5.0,
            piercing: 0.0,
            melee_attack: 10.0,
            missile_attack: Some(10.0),
            charge_bonus: 0.0,
            counter_typ: typ.to_string(),
            typ_nazwa: jednostka.to_string(),
        },
        atk_mods: AtkMods {
            atk: 0.0,
            ranged_atk: 0.0,
            uderzenie: 0.0,
        },
        atk_diff_mult: 1.0,
        atk_mounted: false,
        defender: DefenderCu {
            melee_defence: 0.0,
            armor: 0.0,
            kara_flanka: None,
            kara_tyl: None,
        },
        def_mods: DefMods {
            obrona: 0.0,
            pancerz: 0.0,
        },
        def_diff_mult: 1.0,
        def_on_wall: false,
        def_fortified_in_field: false,
        def_wall_civ_mult: 1.0,
        def_braces_against_charge: false,
        first_blow_of_pair: true,
        counter_mult: 1.0,
        env: BlowEnv {
            is_city_defense_battle: false,
            wall_bonus_proc: 0.0,
            gated_terrain_multiplier: 1.0,
            field_terrain_multiplier: 1.0,
            atk_tile_is_river: false,
            river_row_exists: false,
            river_attack_mult: 0.75,
            atk_on_ford: false,
            def_on_ford_raw: false,
            shore_adjacent: false,
            brod_kara_obrona: 0.25,
            brod_bonus_brzegu: 0.15,
            fortify_obrona_proc: 50.0,
        },
        defender_state: DefenderState {
            hp: 50.0,
            max_hp: 50.0,
            morale: 100.0,
            flee_morale: 0.0,
            dead: false,
            fading_out: false,
            routed: false,
            never_rout: false,
            removed: false,
        },
        routed_after_morale: false,
    };
    let mult = |typ: &str, jednostka: &str| compose_blow(&base(typ, jednostka)).1.ranged_class_mult;
    assert_eq!(mult("Slinger", "Procarz"), 3.0);
    assert_eq!(mult("Distance", "Łucznik"), 2.0);
    assert_eq!(mult("Distance", "Oszczepnik"), 1.0);
    assert_eq!(mult("Mount", "Łucznik"), 1.0);
}

#[test]
fn nan_w_atak_dystansowy_propaguje_jak_math_max() {
    // JS: rangedShotAccuracy(meleeAttack, NaN) = Math.max(a, NaN) = NaN. f64::max zwrocilby a: test pilnuje js_max.
    let mut inp = FullBlowInput {
        ranged: true,
        hit_arc: HitArc::Front,
        attacker: AttackerCu {
            weapon_damage: 5.0,
            piercing: 0.0,
            melee_attack: 10.0,
            missile_attack: Some(f64::NAN),
            charge_bonus: 0.0,
            counter_typ: "Lucznik".to_string(),
            typ_nazwa: "Łucznik".to_string(),
        },
        atk_mods: AtkMods {
            atk: 0.0,
            ranged_atk: 0.0,
            uderzenie: 0.0,
        },
        atk_diff_mult: 1.0,
        atk_mounted: false,
        defender: DefenderCu {
            melee_defence: 0.0,
            armor: 0.0,
            kara_flanka: None,
            kara_tyl: None,
        },
        def_mods: DefMods {
            obrona: 0.0,
            pancerz: 0.0,
        },
        def_diff_mult: 1.0,
        def_on_wall: false,
        def_fortified_in_field: false,
        def_wall_civ_mult: 1.0,
        def_braces_against_charge: false,
        first_blow_of_pair: true,
        counter_mult: 1.0,
        env: BlowEnv {
            is_city_defense_battle: false,
            wall_bonus_proc: 0.0,
            gated_terrain_multiplier: 1.0,
            field_terrain_multiplier: 1.0,
            atk_tile_is_river: false,
            river_row_exists: false,
            river_attack_mult: 0.75,
            atk_on_ford: false,
            def_on_ford_raw: false,
            shore_adjacent: false,
            brod_kara_obrona: 0.25,
            brod_bonus_brzegu: 0.15,
            fortify_obrona_proc: 50.0,
        },
        defender_state: DefenderState {
            hp: 50.0,
            max_hp: 50.0,
            morale: 100.0,
            flee_morale: 0.0,
            dead: false,
            fading_out: false,
            routed: false,
            never_rout: false,
            removed: false,
        },
        routed_after_morale: false,
    };
    let (_, comp) = compose_blow(&inp);
    assert!(comp.atk_shoot_acc.is_nan());
    inp.attacker.missile_attack = None;
    let (_, comp2) = compose_blow(&inp);
    // null -> 0 (`?? 0`): max(10, 0) = 10.
    assert_eq!(comp2.atk_shoot_acc, 10.0);
}
