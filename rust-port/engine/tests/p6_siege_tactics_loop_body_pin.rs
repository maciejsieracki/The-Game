//! P6 SIEGE-TAKTYKA K5-LOOP-BODY (r3, dispatch R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-BODY-Q1): zgodność produkcyjnego
//! ciała jednostki [`ProdBody`] z TEKSTEM pinu `07d2fbd72`.
//!
//! Wektory: `p6_siege_tactics_loop_body_vectors/vectors.json` z `p6_siege_tactics_loop_body_gen.mjs`. Generator
//! WYKONUJE tekst pinu `_activateUnit` -> `_doAttack` -> `_singleBlow` (z prawdziwymi helperami ciosu: `toCombatUnit`,
//! `hitChanceTw`, `baseDamage`, `flankRearDefensePenalty` itd.) na sekwencjach aktywacji wielu jednostek. Zastubowane są
//! WYŁĄCZNIE efekty zewnętrzne (RNG = kolejka rzutów, render/animacja, ruch/doktryna/wieże, wybór celu, dane sceny,
//! skutki `_resolveBlowOutcome` poza zabiciem) — patrz nagłówek generatora.
//!
//! Porównanie po KAŻDEJ aktywacji: ślad zdarzeń `_activateUnit` (`done`/`flee`/`terrainRange`/`moraleBar`/`startRout`/
//! `facing`/`attack:i`/`advanceStep`/...), wynik ciosu (trafienie, `hitPct`, `roll`, `dmg`, HP obrońcy, `extraMorale`,
//! szarża), stan KAŻDEJ jednostki (HP, dead, fadingOut, routed, morale, surroundApplied, moveLeft) i zbiór `engaged`.
//!
//! Zakres (jak ProdBody): AUTO, bez oblężenia, cios w zwarciu, bez strzelca, bez doktryny. Poza zakresem (osobne tematy):
//! efekty `_resolveBlowOutcome` (morale/rout po ciosie), kontratak, timing `BLOW_HIT_T`, doktryna, strzelec, mur, ruch.

use std::collections::BTreeSet;

use civ_engine::domain::siege_tactics_activate::{ActivateEvent, ActivateScene, ActivateUnit};
use civ_engine::domain::siege_tactics_blow::{DefenderState, HitArc, SequenceRolls};
use civ_engine::domain::siege_tactics_blow_full::{
    AtkMods, AttackerCu, BlowEnv, DefMods, DefenderCu, FullBlowInput,
};
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{LoopBody, ProdBody, ProdUnit};
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_siege_tactics_loop_body_vectors/vectors.json");
const ACTIVATE_SHA256: &str = "3be85ac2fba725bf618b61c817c891c1d994d2b7df3615d01552c6c2774ddb00";
const BLOW_SHA256: &str = "b2f9e19f1e35644e0e2ea636a9d50a02dd10d729355de5eb3eb35668910e5526";
const UNIT_FRAGMENT_SHA256: &str =
    "d1b401a2275ab01569dd16ec1a6a3618ae56b592dd13c4f900b82b252755016c";
const UNITS_SHA256: &str = "7b509817d1c613a526ea0e8066a62f340f46a29fedd6f79f0c647195727bc6d7";
const DOATTACK_SHA256: &str = "592a6cbc279655a09b13fe9cd5ccbad24b325fa093610d685d5d9461729b41c1";
const BODY_MS: f64 = 800.0;

fn num(v: &Value) -> f64 {
    v.as_str()
        .expect("liczba jako tekst")
        .parse::<f64>()
        .expect("liczba w wektorze")
}

fn opt_num(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

fn b(v: &Value) -> bool {
    v.as_bool().expect("bool")
}

fn side_of(s: &str) -> BattleSide {
    match s {
        "atk" => BattleSide::Attacker,
        "def" => BattleSide::Defender,
        other => panic!("strona {other}"),
    }
}

fn arc(s: &str) -> HitArc {
    match s {
        "front" => HitArc::Front,
        "flank" => HitArc::Flank,
        "rear" => HitArc::Rear,
        other => panic!("kierunek {other}"),
    }
}

fn tag(r: UnitRef) -> String {
    let s = match r.side {
        BattleSide::Attacker => "atk",
        BattleSide::Defender => "def",
    };
    format!("{s}{}", r.idx)
}

fn label(e: &ActivateEvent) -> String {
    match e {
        ActivateEvent::Done => "done".into(),
        ActivateEvent::Flee => "flee".into(),
        ActivateEvent::ApplyTerrainRange => "terrainRange".into(),
        ActivateEvent::PerformPlayerOrder => "playerOrder".into(),
        ActivateEvent::ResetPlayerOrder => "resetOrder".into(),
        ActivateEvent::DoctrineStep => "doctrineStep".into(),
        ActivateEvent::UpdateMoraleBar => "moraleBar".into(),
        ActivateEvent::StartRout => "startRout".into(),
        ActivateEvent::UpdateFacing => "facing".into(),
        ActivateEvent::TowerClimb => "towerClimb".into(),
        ActivateEvent::InfantryToTower => "infToTower".into(),
        ActivateEvent::RamTowerStep => "ramTower".into(),
        ActivateEvent::Attack { target } => format!("attack:{target}"),
        ActivateEvent::AttackWallTile { row } => format!("attackWall:{row}"),
        ActivateEvent::AdvanceToward { col, row } => format!("advanceToward:{col},{row}"),
        ActivateEvent::RangedAction => "rangedAction".into(),
        ActivateEvent::FallBackStep => "fallBack".into(),
        ActivateEvent::CavalryAction => "cavalry".into(),
        ActivateEvent::PhalanxAction => "phalanx".into(),
        ActivateEvent::AdvanceStep => "advanceStep".into(),
    }
}

fn blow_input(t: &Value) -> FullBlowInput {
    FullBlowInput {
        ranged: false,
        hit_arc: arc(t["arc"].as_str().expect("arc")),
        attacker: AttackerCu {
            weapon_damage: num(&t["atk"]["weaponDamage"]),
            piercing: num(&t["atk"]["piercing"]),
            melee_attack: num(&t["atk"]["meleeAttack"]),
            missile_attack: Some(num(&t["atk"]["missileAttack"])),
            charge_bonus: num(&t["atk"]["chargeBonus"]),
            counter_typ: t["atk"]["counterTyp"].as_str().expect("typ").to_string(),
            typ_nazwa: t["atk"]["typNazwa"].as_str().expect("nazwa").to_string(),
        },
        atk_mods: AtkMods {
            atk: num(&t["atkMods"]["atk"]),
            ranged_atk: num(&t["atkMods"]["rangedAtk"]),
            uderzenie: num(&t["atkMods"]["uderzenie"]),
        },
        atk_diff_mult: num(&t["atkDiff"]),
        atk_mounted: b(&t["atkMounted"]),
        defender: DefenderCu {
            melee_defence: num(&t["def"]["meleeDefence"]),
            armor: num(&t["def"]["armor"]),
            kara_flanka: opt_num(&t["def"]["karaFlanka"]),
            kara_tyl: opt_num(&t["def"]["karaTyl"]),
        },
        def_mods: DefMods {
            obrona: num(&t["defMods"]["obrona"]),
            pancerz: num(&t["defMods"]["pancerz"]),
        },
        def_diff_mult: num(&t["defDiff"]),
        def_on_wall: b(&t["defOnWall"]),
        def_fortified_in_field: b(&t["defFortified"]),
        def_wall_civ_mult: num(&t["wallCiv"]),
        def_braces_against_charge: b(&t["defBraces"]),
        // Ustawiane przez ProdBody ze zbioru `engaged` (szablon nie decyduje).
        first_blow_of_pair: true,
        counter_mult: num(&t["ctr"]),
        env: BlowEnv {
            is_city_defense_battle: b(&t["isCity"]),
            wall_bonus_proc: num(&t["wallBonus"]),
            gated_terrain_multiplier: num(&t["gated"]),
            field_terrain_multiplier: num(&t["fieldMult"]),
            atk_tile_is_river: b(&t["atkRiver"]),
            river_row_exists: b(&t["riverRow"]),
            river_attack_mult: num(&t["riverMult"]),
            atk_on_ford: b(&t["atkFord"]),
            def_on_ford_raw: b(&t["defFord"]),
            shore_adjacent: b(&t["shore"]),
            brod_kara_obrona: num(&t["brodKara"]),
            brod_bonus_brzegu: num(&t["brodBrzeg"]),
            fortify_obrona_proc: num(&t["fortify"]),
        },
        defender_state: DefenderState {
            hp: 1.0,
            max_hp: num(&t["defMaxHp"]),
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

fn activate_unit_of(u: &Value) -> ActivateUnit {
    ActivateUnit {
        side_atk: u["side"] == "atk",
        q: u["q"].as_i64().expect("q"),
        r: u["r"].as_i64().expect("r"),
        dead: b(&u["dead"]),
        fading_out: b(&u["fadingOut"]),
        routed: b(&u["routed"]),
        never_rout: b(&u["neverRout"]),
        surround_applied: b(&u["surroundApplied"]),
        morale: num(&u["morale"]),
        flee_morale: num(&u["fleeMorale"]),
        terrain_defence_mult: num(&u["tdmOwn"]),
        range: 1.0,
        on_wall_walkway: b(&u["onWall"]),
        primary_ranged: false,
        mounted: b(&u["mounted"]),
        phalanx: b(&u["phalanx"]),
        shooting_disabled: false,
        dry_col: -1.0,
        held_after_fallback: false,
        player_order_none: true,
        can_shoot: false,
        is_siege_unit: false,
        is_siege_tower: false,
        is_ram: false,
        is_catapult: false,
        doctrine_auto: false,
        doctrine_manual: false,
    }
}

fn combat_unit_of(u: &Value) -> CombatUnit {
    CombatUnit {
        hp: num(&u["hp"]),
        morale: num(&u["morale"]),
        flee_morale: num(&u["fleeMorale"]),
        move_left: num(&u["moveLeft"]),
        never_rout: b(&u["neverRout"]),
        dead: b(&u["dead"]),
        fading_out: b(&u["fadingOut"]),
        routed: b(&u["routed"]),
        removed: false,
        acted: false,
    }
}

fn load() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json")
}

#[derive(Default)]
struct Cover {
    activations: usize,
    blows: usize,
    hits: usize,
    misses: usize,
    charges: usize,
    kills: usize,
    flee_skipped: usize,
    done_finished: usize,
    done_dead_or_fading: usize,
    surround: usize,
    start_rout: usize,
    advance_step: usize,
    cavalry: usize,
    phalanx: usize,
    repeat_blow: usize,
    flank_or_rear: usize,
    target_dead_filtered: usize,
    move_left_seqs: usize,
    fading_seqs: usize,
    routed_seqs: usize,
    on_wall_seqs: usize,
}

#[test]
fn zgodnosc_ciala_z_tekstem_pinu_end_to_end() {
    let v = load();
    assert_eq!(v["activateSha256"], ACTIVATE_SHA256, "fragmenty aktywacji");
    assert_eq!(v["blowSha256"], BLOW_SHA256, "fragmenty ciosu");
    assert_eq!(
        v["unitFragmentSha256"], UNIT_FRAGMENT_SHA256,
        "toCombatUnit"
    );
    assert_eq!(v["unitsSha256"], UNITS_SHA256, "units.json");
    assert_eq!(v["doAttackSha256"], DOATTACK_SHA256, "_doAttack");
    let seqs = v["sequences"].as_array().expect("sequences");
    assert!(seqs.len() >= 200, "za malo sekwencji: {}", seqs.len());

    let mut cov = Cover::default();
    let mut failures: Vec<String> = Vec::new();

    for seq in seqs {
        let id = seq["id"].as_u64().expect("id");
        let units = seq["units"].as_array().expect("units");
        let n_atk = seq["nAtk"].as_u64().expect("nAtk") as usize;
        let n_def = units.len() - n_atk;
        let mut pus: [Vec<ProdUnit>; 2] = [Vec::new(), Vec::new()];
        let mut st = TurnSeqState {
            atk: Vec::new(),
            def: Vec::new(),
            turn_order: Vec::new(),
            turn_idx: 0,
            round_no: 1,
            siege_wall_col: -1,
            manual_mode: false,
            player_side: BattleSide::Attacker,
            finished: false,
            awaiting_orders: false,
            auto_battle_suspended: false,
            busy: false,
            auto_batch_planning: false,
            queued_order_ids: BTreeSet::new(),
        };
        for (k, u) in units.iter().enumerate() {
            let side = side_of(u["side"].as_str().expect("side"));
            let pu = ProdUnit {
                activate: activate_unit_of(u),
                melee_target: u["target"].as_u64().map(|t| t as usize),
                blow: if u["blow"].is_null() {
                    None
                } else {
                    Some(blow_input(&u["blow"]))
                },
                body_ms: BODY_MS,
            };
            let su = SeqUnit {
                id: k as u64,
                c: combat_unit_of(u),
            };
            match side {
                BattleSide::Attacker => {
                    pus[0].push(pu);
                    st.atk.push(su);
                }
                BattleSide::Defender => {
                    pus[1].push(pu);
                    st.def.push(su);
                }
            }
        }
        let rolls: Vec<f64> = seq["rolls"]
            .as_array()
            .expect("rolls")
            .iter()
            .map(num)
            .collect();
        let scene = ActivateScene {
            finished: false,
            manual_mode: false,
            is_player_side: false,
            wall_col: -1,
            gate_open: false,
            wall_tile_hp: Vec::new(),
            siege_machine_range: 0.0,
        };
        let mut body = ProdBody::new(pus, scene, SequenceRolls::new(rolls));
        let _ = n_def;

        if units.iter().any(|u| num(&u["moveLeft"]) > 0.0) {
            cov.move_left_seqs += 1;
        }
        if units.iter().any(|u| b(&u["fadingOut"])) {
            cov.fading_seqs += 1;
        }
        if units.iter().any(|u| b(&u["routed"])) {
            cov.routed_seqs += 1;
        }
        if units.iter().any(|u| b(&u["onWall"])) {
            cov.on_wall_seqs += 1;
        }

        let acts = seq["acts"].as_array().expect("acts");
        let expect = seq["expect"].as_array().expect("expect");
        assert_eq!(acts.len(), expect.len());
        // Stan przed aktywacja (do asercji sladu dla dead/fadingOut/routed): [atk..., def...].
        let mut before: Vec<CombatUnit> = st.atk.iter().chain(st.def.iter()).map(|s| s.c).collect();
        let mut blows_done: Vec<(String, usize)> = Vec::new();
        for (k, (a, e)) in acts.iter().zip(expect.iter()).enumerate() {
            cov.activations += 1;
            let side = side_of(a["side"].as_str().expect("side"));
            let idx = a["idx"].as_u64().expect("idx") as usize;
            let unit = UnitRef { side, idx };
            let flat = match side {
                BattleSide::Attacker => idx,
                BattleSide::Defender => n_atk + idx,
            };
            let finished = b(&a["finished"]);
            st.finished = finished;
            let trace_before = body.trace.len();
            let blows_before = body.blows.len();
            let dur = body.start(unit, &st);
            body.complete(unit, &mut st);
            let who = format!("#{id} act{k} {}", tag(unit));

            // --- slad zdarzen ---
            assert_eq!(
                body.trace.len(),
                trace_before + 1,
                "{who}: dokladnie jeden slad"
            );
            let got_trace: Vec<String> = body.trace[trace_before]
                .1
                .iter()
                .filter(|ev| !matches!(ev, ActivateEvent::ResetPlayerOrder))
                .map(label)
                .collect();
            let want_trace: Vec<String> = e["trace"]
                .as_array()
                .expect("trace")
                .iter()
                .map(|t| t.as_str().expect("t").to_string())
                .collect();
            if got_trace != want_trace {
                failures.push(format!("{who} trace rust={got_trace:?} js={want_trace:?}"));
            }
            for t in &want_trace {
                match t.as_str() {
                    "moraleBar" => cov.surround += 1,
                    "startRout" => cov.start_rout += 1,
                    "advanceStep" => cov.advance_step += 1,
                    "cavalry" => cov.cavalry += 1,
                    "phalanx" => cov.phalanx += 1,
                    _ => {}
                }
            }

            // --- asercje na slad dla finished/dead/fadingOut/routed (pin: gałęzie przed czymkolwiek innym) ---
            let pre = before[flat];
            if finished {
                cov.done_finished += 1;
                if want_trace != ["done"] {
                    failures.push(format!("{who}: finished => [done], js={want_trace:?}"));
                }
            } else if pre.dead || pre.fading_out {
                cov.done_dead_or_fading += 1;
                if want_trace != ["done"] || !e["blow"].is_null() {
                    failures.push(format!("{who}: dead/fadingOut => [done] bez ciosu"));
                }
            } else if pre.routed {
                cov.flee_skipped += 1;
                if want_trace != ["flee"] || !e["blow"].is_null() {
                    failures.push(format!("{who}: routed => [flee] bez ciosu"));
                }
            }

            // --- wynik ciosu ---
            let new_blows = body.blows.len() - blows_before;
            if e["blow"].is_null() {
                if new_blows != 0 {
                    failures.push(format!("{who}: rust wykonal cios, pin nie"));
                }
                if dur != 0.0 {
                    failures.push(format!("{who}: dur={dur} bez ciosu"));
                }
            } else if new_blows != 1 {
                failures.push(format!("{who}: pin cios, rust blows={new_blows}"));
            } else {
                let w = &e["blow"];
                let r = &body.blows[blows_before];
                cov.blows += 1;
                if dur != BODY_MS {
                    failures.push(format!("{who}: dur={dur}"));
                }
                let want_target = w["target"].as_u64().expect("target") as usize;
                if r.target.idx != want_target {
                    failures.push(format!("{who}: target {} != {want_target}", r.target.idx));
                }
                if r.missed != b(&w["missed"]) {
                    failures.push(format!(
                        "{who}: missed rust={} js={}",
                        r.missed, w["missed"]
                    ));
                }
                let mut chk = |name: &str, got: f64, want: f64| {
                    if got != want {
                        failures.push(format!("{who}: {name} rust={got} js={want}"));
                    }
                };
                chk("hitPct", r.hit_pct, num(&w["hitPct"]));
                chk("roll", r.roll, num(&w["roll"]));
                chk("dmg", r.dmg, num(&w["dmg"]));
                chk("defHpAfter", r.def_hp_after, num(&w["defHpAfter"]));
                if !r.missed {
                    chk("extraMorale", r.extra_morale, num(&w["extraMorale"]));
                    if r.extra_morale > 0.0 {
                        cov.flank_or_rear += 1;
                    }
                }
                if r.is_charge != b(&w["isCharge"]) {
                    failures.push(format!(
                        "{who}: isCharge rust={} js={}",
                        r.is_charge, w["isCharge"]
                    ));
                }
                if r.missed {
                    cov.misses += 1;
                } else {
                    cov.hits += 1;
                }
                if r.is_charge {
                    cov.charges += 1;
                }
                if !r.missed && r.def_hp_after == 0.0 {
                    cov.kills += 1;
                }
                let key = (tag(unit), want_target);
                if blows_done.contains(&key) {
                    cov.repeat_blow += 1;
                }
                blows_done.push(key);
            }

            // --- stan wszystkich jednostek ---
            let want_units = e["units"].as_array().expect("units");
            for (i, wu) in want_units.iter().enumerate() {
                let (r, ru) = if i < n_atk {
                    (
                        UnitRef {
                            side: BattleSide::Attacker,
                            idx: i,
                        },
                        st.atk[i].c,
                    )
                } else {
                    (
                        UnitRef {
                            side: BattleSide::Defender,
                            idx: i - n_atk,
                        },
                        st.def[i - n_atk].c,
                    )
                };
                let name = tag(r);
                let mut chk = |what: &str, got: f64, want: f64| {
                    if got != want {
                        failures.push(format!("{who}: {name}.{what} rust={got} js={want}"));
                    }
                };
                chk("hp", ru.hp, num(&wu["hp"]));
                chk("morale", ru.morale, num(&wu["morale"]));
                chk("moveLeft", ru.move_left, num(&wu["moveLeft"]));
                for (what, got, want) in [
                    ("dead", ru.dead, b(&wu["dead"])),
                    ("fadingOut", ru.fading_out, b(&wu["fadingOut"])),
                    ("routed", ru.routed, b(&wu["routed"])),
                    (
                        "surroundApplied",
                        body.surround_applied(r),
                        b(&wu["surroundApplied"]),
                    ),
                ] {
                    if got != want {
                        failures.push(format!("{who}: {name}.{what} rust={got} js={want}"));
                    }
                }
            }
            before = st.atk.iter().chain(st.def.iter()).map(|s| s.c).collect();

            // --- zbior engaged ---
            let mut got_engaged: Vec<String> = body
                .engaged
                .iter()
                .map(|(x, y)| format!("{}>{}", tag(*x), tag(*y)))
                .collect();
            got_engaged.sort();
            let want_engaged: Vec<String> = e["engaged"]
                .as_array()
                .expect("engaged")
                .iter()
                .map(|t| t.as_str().expect("t").to_string())
                .collect();
            if got_engaged != want_engaged {
                failures.push(format!(
                    "{who}: engaged rust={got_engaged:?} js={want_engaged:?}"
                ));
            }
            // Cel martwy/uciekajacy odfiltrowany: jednostka z celem w zwarciu nie ma `attack:` w sladzie.
            if want_trace.contains(&"advanceStep".to_string()) {
                let target = units[flat]["target"].as_u64();
                if let Some(t) = target {
                    let ti = match side {
                        BattleSide::Attacker => n_atk + t as usize,
                        BattleSide::Defender => t as usize,
                    };
                    let tu = &expect[..k]
                        .last()
                        .map(|p| p["units"][ti].clone())
                        .unwrap_or_else(|| units[ti].clone());
                    if b(&tu["dead"]) || b(&tu["fadingOut"]) || b(&tu["routed"]) {
                        cov.target_dead_filtered += 1;
                    }
                }
            }
        }
    }

    assert!(
        failures.is_empty(),
        "{} rozbieznosci (pierwsze 25):\n{}",
        failures.len(),
        failures
            .iter()
            .take(25)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );

    // Pokrycie: wszystkie galezie musza wystapic w wektorach (liczone z porownanych danych).
    assert!(cov.activations >= 1000, "aktywacje: {}", cov.activations);
    assert!(cov.blows >= 500, "ciosy: {}", cov.blows);
    assert!(cov.hits > 100 && cov.misses > 100, "trafienia/pudla");
    assert!(cov.charges > 0, "szarza");
    assert!(cov.kills > 0, "zabicia");
    assert!(
        cov.repeat_blow > 0,
        "powtorny cios w tej samej parze (engaged)"
    );
    assert!(cov.flank_or_rear > 0, "flanka/tyl");
    assert!(cov.flee_skipped > 0, "routed => flee bez ciosu");
    assert!(cov.done_dead_or_fading > 0, "dead/fadingOut => done");
    assert!(cov.done_finished > 0, "finished => done");
    assert!(cov.surround > 0 && cov.start_rout > 0, "okrazenie i rout");
    assert!(cov.advance_step > 0, "brak celu => marsz");
    assert!(cov.cavalry > 0 && cov.phalanx > 0, "kawaleria/falanga");
    assert!(cov.move_left_seqs > 0, "moveLeft > 0");
    assert!(
        cov.fading_seqs > 0 && cov.routed_seqs > 0,
        "fadingOut/routed"
    );
    assert!(cov.on_wall_seqs > 0, "obronca na murze");
    assert!(
        cov.target_dead_filtered > 0,
        "cel martwy/uciekajacy odfiltrowany"
    );
}
