//! P6 K5LOOP-TAGS-REST (dispatch R-RUSTPORT-P6-K5LOOP-TAGS-REST-Q1, T4), rodzina `fx`: zgodność [`ProdBody`] z TEKSTEM
//! pinu `07d2fbd72` dla efektów utraty dowódcy armii (`_startRout` `:9803-9806`, `_startFade` `:9929-9932` ->
//! `_removeCommanderMoraleBonus` `:9993-10005`, `_disableManualIfCommanderLost` `:10007-10015`) i kontrataku strzelca
//! podstawowego (`_defenderCounters` `:9090-9091`, `return !canShoot(defender)`), w sekwencjach wielu aktywacji.
//!
//! Wektory: `p6_k5loop_tags_rest_vectors/vectors_fx.json` z `p6_k5loop_tags_rest_gen.mjs` (harness
//! `p6_siege_tactics_loop_body_gen.mjs` + tekst pinu `canShoot`, efektów dowódcy; strażnik `tagsSha256`). Porównanie po
//! KAŻDEJ aktywacji jak w `p6_siege_tactics_loop_body_pin` (ślad, cios, kontratak, stan każdej jednostki, `engaged`) plus
//! `moraleMax` i `armyLeaderMoraleBonusFrac` każdej jednostki, a `ProdBody::unported` musi być PUSTE po każdej aktywacji
//! (dawne tagi `dowodca-rout`, `dowodca-fade`, `kontratak-strzelec` zniknęły). Strażnik czasu 90 s.

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

const VECTORS: &str = include_str!("p6_k5loop_tags_rest_vectors/vectors_fx.json");
const TAGS_SHA256: &str = "e30f68e6ed53b31e3023b406202df1eeb8e431cd9e88995c48ae59fdb19aa2e3";
const ACTIVATE_SHA256: &str = "3be85ac2fba725bf618b61c817c891c1d994d2b7df3615d01552c6c2774ddb00";
const BLOW_SHA256: &str = "b2f9e19f1e35644e0e2ea636a9d50a02dd10d729355de5eb3eb35668910e5526";
const UNIT_FRAGMENT_SHA256: &str =
    "d1b401a2275ab01569dd16ec1a6a3618ae56b592dd13c4f900b82b252755016c";
const UNITS_SHA256: &str = "7b509817d1c613a526ea0e8066a62f340f46a29fedd6f79f0c647195727bc6d7";
const DOATTACK_SHA256: &str = "592a6cbc279655a09b13fe9cd5ccbad24b325fa093610d685d5d9461729b41c1";
const FACING_SHA256: &str = "6d4858eded6e566c91a2874b30a5eabff0080b477bbf29c02a1a67f69493eae3";
/// Fragmenty efektów po ciosie (`_resolveBlowOutcome`, `_applyMoraleDamage`, `_startRout`, `_startFade`, ...).
const OUTCOME_SHA256: &str = "6cc2b1e08bcee451d42d8d022c446c6ef42f8e4d045087dff5a653d7a09f737c";
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
        // Łuk nie jest szablonem (r4): ProdBody liczy go w `complete` z facing obrońcy; wartość tu jest nadpisywana.
        hit_arc: HitArc::Front,
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
        primary_ranged: b(&u["primaryRanged"]),
        mounted: b(&u["mounted"]),
        phalanx: b(&u["phalanx"]),
        shooting_disabled: false,
        dry_col: -1.0,
        held_after_fallback: false,
        player_order_none: true,
        // `canShoot(ru) = ru.rangedBase && ru.ammoLeft > 0` (`:1457-1459`).
        can_shoot: b(&u["rangedBase"]) && num(&u["ammoLeft"]) > 0.0,
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
    commander_units: usize,
    commander_lost: usize,
    bonus_removed: usize,
    bonus_nan_removed: usize,
    shooter_counter: usize,
    shooter_no_counter: usize,
    // Obrona r1 (Z1/Z2): rodziny wymuszone `shooter2` i `cmdHalf` generatora (sekwencje 500..639).
    sec_shooter_counter: usize,
    primary_no_base_counter: usize,
    cmd_half_capped: usize,
    activations: usize,
    facing_changes: usize,
    reverse_arc_diff: usize,
    blows: usize,
    counters: usize,
    counter_kills: usize,
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
    fx_fades: usize,
    fx_gains: usize,
    fx_boosts: usize,
    fx_collapse: usize,
    fx_routs: usize,
}

/// Jawne błędy wejścia adaptera (D-SD-1, dispatch T4: zostają): brak [`MoveTerrain`] (`*-brak-terenu`,
/// `ucieczka-routed`) albo brak szablonu ciosu/strzału (`*-bez-szablonu`).
fn is_input_error_tag(t: &str) -> bool {
    t.ends_with("-brak-terenu") || t.ends_with("-bez-szablonu") || t == "ucieczka-routed"
}

/// Strażnik czasu: pętla bez końca daje czytelny FAIL zamiast zawieszenia binarki.
fn with_timeout(label: &'static str, f: impl FnOnce() + Send + 'static) {
    let (tx, rx) = std::sync::mpsc::channel();
    let worker = std::thread::spawn(move || {
        let r = std::panic::catch_unwind(std::panic::AssertUnwindSafe(f));
        let _ = tx.send(r.is_ok());
        if let Err(e) = r {
            std::panic::resume_unwind(e);
        }
    });
    match rx.recv_timeout(std::time::Duration::from_secs(90)) {
        Ok(true) => worker.join().expect("watek testu"),
        Ok(false) => {
            let _ = worker.join();
            panic!("{label}: rozbieznosc z pinem (szczegoly wyzej)");
        }
        Err(_) => panic!("{label}: brak konca w 90 s"),
    }
}

#[test]
fn dowodca_i_kontratak_strzelca_zgodne_z_pinem() {
    with_timeout("tags-rest-fx", run_fx);
}

fn run_fx() {
    let v = load();
    assert_eq!(v["tagsSha256"], TAGS_SHA256, "canShoot + efekty dowodcy");
    assert_eq!(v["activateSha256"], ACTIVATE_SHA256, "fragmenty aktywacji");
    assert_eq!(v["blowSha256"], BLOW_SHA256, "fragmenty ciosu");
    assert_eq!(
        v["unitFragmentSha256"], UNIT_FRAGMENT_SHA256,
        "toCombatUnit"
    );
    assert_eq!(v["unitsSha256"], UNITS_SHA256, "units.json");
    assert_eq!(v["doAttackSha256"], DOATTACK_SHA256, "_doAttack");
    assert_eq!(v["outcomeSha256"], OUTCOME_SHA256, "efekty po ciosie");
    assert_eq!(
        v["facingSha256"], FACING_SHA256,
        "facing: _nearestEnemy/_updateFacing/relativeHit/_doMeleeAttack"
    );
    let seqs = v["sequences"].as_array().expect("sequences");
    // 500 losowych + 80 `shooter2` + 60 `cmdHalf` (Obrona r1, Z1/Z2).
    assert_eq!(seqs.len(), 640, "sekwencje");

    let mut cov = Cover::default();
    let mut failures: Vec<String> = Vec::new();
    // Historia ciosow (atakujacy, cel, luk) w biezacej sekwencji: do pokrycia "A->B, potem B->A z innym lukiem".
    let mut arc_hist: Vec<(String, String, HitArc)> = Vec::new();

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
                counter_blows: u["counters"]
                    .as_array()
                    .expect("counters")
                    .iter()
                    .map(blow_input)
                    .collect(),
                body_ms: BODY_MS,
                facing: num(&u["facing"]),
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
        // `moraleMax`, `isArmyCommander`, `bu.armyLeaderMoraleBonusFrac`, `moraleBaseFor` bez bonusu (wejścia adaptera),
        // `rangedBase` i `ammoLeft` (`canShoot`).
        for (k, u) in units.iter().enumerate() {
            let (ix, i) = if k < n_atk { (0, k) } else { (1, k - n_atk) };
            body.morale_max[ix][i] = num(&u["moraleMax"]);
            body.is_army_commander[ix][i] = b(&u["commander"]);
            body.army_leader_bonus_frac[ix][i] = num(&u["leaderFrac"]);
            body.morale_base_plain[ix][i] = Some(num(&u["plainBase"]));
            body.ranged_base[ix][i] = b(&u["rangedBase"]);
            body.ammo_left[ix][i] = num(&u["ammoLeft"]);
            if b(&u["commander"]) {
                cov.commander_units += 1;
            }
        }
        let _ = n_def;
        arc_hist.clear();
        let mut facing_prev: Vec<f64> = units.iter().map(|u| num(&u["facing"])).collect();

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
            let counters_before = body.counters.len();
            // K5LOOP-KILL-RIPPLE (D-INT-2): ripple przy zabiciu jest wykonywany; licznik wywołań = `kill_ripples`.
            let shakes_before = body.kill_ripples.len();
            let dur = body.start(unit, &st);
            body.complete(unit, &mut st);
            let who = format!("#{id} act{k} {}", tag(unit));
            // Kryterium T4: poza jawnymi błędami wejścia (harness bez `MoveTerrain`: `*-brak-terenu`, `ucieczka-routed`;
            // brak szablonu: `*-bez-szablonu`) żadnej ścieżki nieportowanej (dawne `dowodca-*`, `kontratak-strzelec`).
            if body.unported.iter().any(|(_, t)| !is_input_error_tag(t)) {
                failures.push(format!("{who}: unported {:?}", body.unported));
            }
            body.unported.clear();
            if e["fx"]["commander"].as_u64().expect("fx.commander") > 0 {
                cov.commander_lost += 1;
            }

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
                // Obrona r1: po rozbieżności `missed` (zgłoszonej wyżej) pin nie ma `extraMorale` (null): bez paniki.
                if !r.missed && !b(&w["missed"]) {
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
                if r.hit_arc != arc(w["arc"].as_str().expect("arc")) {
                    failures.push(format!(
                        "{who}: hitArc rust={:?} js={}",
                        r.hit_arc, w["arc"]
                    ));
                }
                let me = tag(unit);
                let tgt = tag(r.target);
                if arc_hist
                    .iter()
                    .any(|(a2, t2, arc2)| *a2 == tgt && *t2 == me && *arc2 != r.hit_arc)
                {
                    cov.reverse_arc_diff += 1;
                }
                arc_hist.push((me, tgt, r.hit_arc));
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

            // --- kontratak obrońcy (pin: _defenderCounters + COUNTER-ATTACK po ciosie głównym) ---
            let new_counters = body.counters.len() - counters_before;
            if e["counter"].is_null() && !e["blow"].is_null() {
                let t = e["blow"]["target"].as_u64().expect("target") as usize;
                let off = if side == BattleSide::Attacker {
                    n_atk
                } else {
                    0
                };
                let tu = &units[off + t];
                let after = &e["units"][off + t];
                if b(&tu["primaryRanged"])
                    && num(&tu["ammoLeft"]) > 0.0
                    && !b(&after["dead"])
                    && !b(&after["routed"])
                    && !b(&after["fadingOut"])
                {
                    cov.shooter_no_counter += 1;
                }
            }
            if e["counter"].is_null() {
                if new_counters != 0 {
                    failures.push(format!("{who}: rust wykonal kontratak, pin nie"));
                }
            } else if new_counters != 1 {
                failures.push(format!(
                    "{who}: pin kontratak, rust counters={new_counters}"
                ));
            } else {
                let w = &e["counter"];
                let r = &body.counters[counters_before];
                cov.counters += 1;
                if body.units[usize::from(r.attacker.side == BattleSide::Defender)][r.attacker.idx]
                    .activate
                    .primary_ranged
                {
                    cov.shooter_counter += 1;
                }
                // Obrona r1 (Z1): flagi kontratakującego z WEKTORA (niezależne `primaryRanged` / `rangedBase` / `ammoLeft`).
                let cu = &units[if r.attacker.side == BattleSide::Attacker {
                    r.attacker.idx
                } else {
                    n_atk + r.attacker.idx
                }];
                if b(&cu["rangedBase"]) && !b(&cu["primaryRanged"]) && num(&cu["ammoLeft"]) > 0.0 {
                    cov.sec_shooter_counter += 1;
                }
                if b(&cu["primaryRanged"]) && !b(&cu["rangedBase"]) {
                    cov.primary_no_base_counter += 1;
                }
                // Kontratak: atakuje obrońca z tej aktywacji (defender), celem jest jednostka aktywna (unit).
                if r.target != unit || r.attacker.side == side {
                    failures.push(format!(
                        "{who}: kontratak strony/celu rust={}>{}",
                        tag(r.attacker),
                        tag(r.target)
                    ));
                }
                let want_target = w["target"].as_u64().expect("target") as usize;
                if want_target != unit.idx {
                    failures.push(format!(
                        "{who}: counter.target js={want_target} != {}",
                        unit.idx
                    ));
                }
                if r.missed != b(&w["missed"]) {
                    failures.push(format!(
                        "{who}: counter missed rust={} js={}",
                        r.missed, w["missed"]
                    ));
                }
                for (name, got, want) in [
                    ("hitPct", r.hit_pct, num(&w["hitPct"])),
                    ("roll", r.roll, num(&w["roll"])),
                    ("dmg", r.dmg, num(&w["dmg"])),
                    ("defHpAfter", r.def_hp_after, num(&w["defHpAfter"])),
                ] {
                    if got != want {
                        failures.push(format!("{who}: counter {name} rust={got} js={want}"));
                    }
                }
                if !r.missed && !b(&w["missed"]) {
                    let want_extra = num(&w["extraMorale"]);
                    if r.extra_morale != want_extra {
                        failures.push(format!(
                            "{who}: counter extraMorale rust={} js={want_extra}",
                            r.extra_morale
                        ));
                    }
                    if r.def_hp_after == 0.0 {
                        cov.counter_kills += 1;
                    }
                }
                if r.is_charge != b(&w["isCharge"]) {
                    failures.push(format!(
                        "{who}: counter isCharge rust={} js={}",
                        r.is_charge, w["isCharge"]
                    ));
                }
                if r.hit_arc != arc(w["arc"].as_str().expect("arc")) {
                    failures.push(format!(
                        "{who}: counter hitArc rust={:?} js={}",
                        r.hit_arc, w["arc"]
                    ));
                }
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
                // Morale NaN (bonus dowódcy NaN przez `ratio`): bity NaN z JS i Rust mogą się różnić, wartość ta sama.
                if !(ru.morale.is_nan() && num(&wu["morale"]).is_nan()) {
                    chk("morale", ru.morale, num(&wu["morale"]));
                }
                let ix = usize::from(r.side == BattleSide::Defender);
                let mm_got = body.morale_max[ix][r.idx];
                let mm_want = num(&wu["moraleMax"]);
                if !(mm_got.is_nan() && mm_want.is_nan()) {
                    chk("moraleMax", mm_got, mm_want);
                }
                let lf_got = body.army_leader_bonus_frac[ix][r.idx];
                let lf_want = num(&wu["leaderFrac"]);
                if !(lf_got.is_nan() && lf_want.is_nan()) {
                    chk("leaderFrac", lf_got, lf_want);
                }
                let prev_lf = if k == 0 {
                    num(&units[i]["leaderFrac"])
                } else {
                    num(&expect[k - 1]["units"][i]["leaderFrac"])
                };
                if lf_want == 0.0 && (prev_lf > 0.0 || prev_lf.is_nan()) {
                    cov.bonus_removed += 1;
                    if prev_lf.is_nan() {
                        cov.bonus_nan_removed += 1;
                    }
                    // Obrona r1 (Z2): `Math.min(base, Math.ceil(base * ratio))` (`:10002`) przy bazie 55.5 i `ratio` 1.
                    let m = num(&wu["morale"]);
                    if prev_lf > 0.0 && m == mm_want && m.fract() != 0.0 {
                        cov.cmd_half_capped += 1;
                    }
                }
                chk("moveLeft", ru.move_left, num(&wu["moveLeft"]));
                chk("facing", body.facing(r), num(&wu["facing"]));
                for (what, got, want) in [
                    ("dead", ru.dead, b(&wu["dead"])),
                    ("fadingOut", ru.fading_out, b(&wu["fadingOut"])),
                    ("removed", ru.removed, b(&wu["removed"])),
                    ("acted", ru.acted, b(&wu["acted"])),
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
            for (i, prev) in facing_prev.iter_mut().enumerate() {
                let r = if i < n_atk {
                    UnitRef {
                        side: BattleSide::Attacker,
                        idx: i,
                    }
                } else {
                    UnitRef {
                        side: BattleSide::Defender,
                        idx: i - n_atk,
                    }
                };
                let now = body.facing(r);
                if now != *prev {
                    cov.facing_changes += 1;
                }
                *prev = now;
            }

            // --- ripple `_shakeAlliesOnLoss` (`:9048`): liczba wywołań z pinu = liczba wpisów `kill_ripples` ---
            let shakes_now = body.kill_ripples.len() - shakes_before;
            if body.unported.iter().any(|(_, t)| *t == "shakeAlliesOnLoss") {
                failures.push(format!("{who}: tag shakeAlliesOnLoss po wpieciu ripple"));
            }
            let want_shakes = e["fx"]["shakes"].as_u64().expect("fx.shakes") as usize;
            if shakes_now != want_shakes {
                failures.push(format!(
                    "{who}: shakeAlliesOnLoss rust={shakes_now} js={want_shakes}"
                ));
            }
            for (name, want) in [
                ("fades", &mut cov.fx_fades),
                ("gains", &mut cov.fx_gains),
                ("boosts", &mut cov.fx_boosts),
                ("collapse", &mut cov.fx_collapse),
                ("routs", &mut cov.fx_routs),
            ] {
                if e["fx"][name].as_u64().expect("fx") > 0 {
                    *want += 1;
                }
            }

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

    // Pokrycie T4 (liczone z porównanych danych; progi z generatora: commanderLost 65, commanderBonusRemoved 48,
    // commanderBonusNaN 24, shooterCounter 44, shooterNoCounter 151).
    eprintln!(
        "pokrycie T4: dowodcy={} utrata={} bonus_zdjety={} bonus_nan={} kontratak_strzelca={} strzelec_bez_kontrataku={}",
        cov.commander_units,
        cov.commander_lost,
        cov.bonus_removed,
        cov.bonus_nan_removed,
        cov.shooter_counter,
        cov.shooter_no_counter
    );
    assert!(
        cov.commander_lost >= 50,
        "utrata dowodcy: {}",
        cov.commander_lost
    );
    assert!(
        cov.bonus_removed >= 40,
        "bonus zdjety: {}",
        cov.bonus_removed
    );
    assert!(
        cov.bonus_nan_removed >= 15,
        "bonus NaN: {}",
        cov.bonus_nan_removed
    );
    assert!(
        cov.shooter_counter >= 30,
        "kontratak strzelca bez amunicji: {}",
        cov.shooter_counter
    );
    assert!(
        cov.shooter_no_counter >= 100,
        "strzelec z amunicja bez kontrataku: {}",
        cov.shooter_no_counter
    );
    // Obrona r1 (Z1/Z2): progi jak w generatorze (secShooterCounter 40, primaryNoBaseCounter 10, cmdHalfCapped 40).
    eprintln!(
        "pokrycie obrony r1: kontratak_strzelca_niepodstawowego={} kontratak_bez_rangedBase={} morale_bazy_55_5={}",
        cov.sec_shooter_counter, cov.primary_no_base_counter, cov.cmd_half_capped
    );
    assert!(
        cov.sec_shooter_counter >= 40,
        "kontratak strzelca rangedBase && !primaryRanged z amunicja: {}",
        cov.sec_shooter_counter
    );
    assert!(
        cov.primary_no_base_counter >= 10,
        "kontratak primaryRanged && !rangedBase: {}",
        cov.primary_no_base_counter
    );
    assert!(
        cov.cmd_half_capped >= 40,
        "morale = moraleMax = niecalkowita baza po utracie dowodcy: {}",
        cov.cmd_half_capped
    );
    // Pokrycie: wszystkie galezie musza wystapic w wektorach (liczone z porownanych danych).
    assert!(cov.activations >= 1000, "aktywacje: {}", cov.activations);
    assert!(
        cov.facing_changes > 0,
        "zmiany facing (_updateFacing/_doMeleeAttack)"
    );
    assert!(
        cov.reverse_arc_diff > 0,
        "cios A->B i potem B->A z innym lukiem: {}",
        cov.reverse_arc_diff
    );
    assert!(cov.blows >= 500, "ciosy: {}", cov.blows);
    assert!(cov.counters >= 300, "kontrataki: {}", cov.counters);
    assert!(cov.counter_kills > 0, "zabicia kontratakiem");
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
    assert!(cov.fx_fades > 0, "efekt zabicia (_startFade)");
    assert!(cov.fx_gains > 0, "_gainMorale atakujacego/wrogow");
    assert!(cov.fx_boosts > 0, "_boostEnemiesOnBreak");
    assert!(cov.fx_collapse > 0, "armia w odwrocie (mnoznik 1.3)");
    assert!(cov.fx_routs > 0, "_startRout");
    assert!(
        cov.target_dead_filtered > 0,
        "cel martwy/uciekajacy odfiltrowany"
    );
}

/// Rodzina `siege`: ucieczka przy murze (dawny tag `ucieczka-oblezenie`, dług M19 z T2b) wobec tekstu pinu wykonanego
/// przez `p6_k5loop_tags_rest_siege_gen.mjs` (harness T2b `p6_k5loop_siege_atk_b_gen.mjs`, ten sam strażnik SHA-256
/// wycinków): `_fleeStep` (`:9845-9897`) z bramką `_doMove` `siegeWallCol >= 0 && _siegeMoveRefused` (`:8689`), teren z
/// murem (`MoveTerrain` z wektora), zagrożenia strzelców na koronie i wież (`_siegeShooterThreats` `:7924-7937`).
mod siege {
    use std::collections::{BTreeMap, BTreeSet, HashMap};
    use std::sync::mpsc;
    use std::time::Duration;

    use civ_engine::domain::siege_tactics_actions::{BattleAction, TimedAction};
    use civ_engine::domain::siege_tactics_activate::{ActivateEvent, ActivateScene, ActivateUnit};
    use civ_engine::domain::siege_tactics_approach::SiegeTowerRef;
    use civ_engine::domain::siege_tactics_atk_b::SiegeStructStats;
    use civ_engine::domain::siege_tactics_autobatch::cell_key;
    use civ_engine::domain::siege_tactics_blow::RollSource;
    use civ_engine::domain::siege_tactics_doctrine_state::GroupDoctrine;
    use civ_engine::domain::siege_tactics_doctrine_target::AttackDirection;
    use civ_engine::domain::siege_tactics_end::BattleSide;
    use civ_engine::domain::siege_tactics_loop::{LoopBody, ProdBody, ProdUnit, MOVE_STEP_MS};
    use civ_engine::domain::siege_tactics_move_effects::MoveTerrain;
    use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
    use civ_engine::domain::siege_tactics_unit::CombatUnit;
    use serde_json::Value;

    const VECTORS: &str = include_str!("p6_k5loop_tags_rest_vectors/vectors_siege.json");
    const VECTORS_NAN: &str = include_str!("p6_k5loop_tags_rest_vectors/vectors_siege_nan.json");
    const VECTORS_EDGE: &str = include_str!("p6_k5loop_tags_rest_vectors/vectors_siege_edge.json");
    const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
    /// Strażnik generatora (`EXPECTED_SHA256`, ten sam co `p6_k5loop_siege_atk_b_gen.mjs`).
    const PIN_SHA256: &str = "489ddf8ec4d902b13ccd8e83109506ef34d3659b0657aef924f821661d441699";
    const LOOP_GUARD: Duration = Duration::from_secs(90);
    const BF_ROWS: i64 = 156;

    /// Ucieczka nie losuje: każdy rzut = błąd testu.
    pub(super) struct NoRolls;

    impl RollSource for NoRolls {
        fn next_unit(&mut self) -> f64 {
            panic!("rzut w ucieczce (pin nie losuje)");
        }
    }

    fn b(v: &Value) -> bool {
        v.as_bool().expect("bool")
    }
    fn bo(v: &Value) -> bool {
        v.as_bool().unwrap_or(false)
    }
    fn num(v: &Value) -> f64 {
        match v.as_str() {
            Some("NaN") => f64::NAN,
            Some("Infinity") => f64::INFINITY,
            Some("-Infinity") => f64::NEG_INFINITY,
            _ => v.as_f64().expect("liczba"),
        }
    }
    fn int(v: &Value) -> i64 {
        v.as_i64().expect("calkowita")
    }
    fn num_or(v: &Value, d: f64) -> f64 {
        if v.is_null() {
            d
        } else {
            num(v)
        }
    }
    fn same_f64(a: f64, b: f64) -> bool {
        a.to_bits() == b.to_bits() || (a.is_nan() && b.is_nan())
    }
    fn tag_of(u: UnitRef) -> String {
        match u.side {
            BattleSide::Attacker => format!("atk{}", u.idx),
            BattleSide::Defender => format!("def{}", u.idx),
        }
    }
    fn unit_of(tag: &str) -> UnitRef {
        if let Some(i) = tag.strip_prefix("atk") {
            UnitRef {
                side: BattleSide::Attacker,
                idx: i.parse().expect("idx"),
            }
        } else {
            UnitRef {
                side: BattleSide::Defender,
                idx: tag.strip_prefix("def").expect("def").parse().expect("idx"),
            }
        }
    }

    /// Teren z wektora (reguła `terrainMapOf` generatora): mur w `wallCol` poza bramą otwartą, kafle specjalne.
    struct VecTerrain {
        wall_col: i64,
        gate_row: i64,
        gate_open: bool,
        tiles: BTreeMap<(i64, i64), (bool, f64, bool)>,
    }

    impl VecTerrain {
        fn from(t: &Value) -> Self {
            let mut tiles = BTreeMap::new();
            for x in t["tiles"].as_array().expect("tiles") {
                tiles.insert(
                    (int(&x["c"]), int(&x["r"])),
                    (b(&x["pass"]), num(&x["cost"]), b(&x["ford"])),
                );
            }
            VecTerrain {
                wall_col: int(&t["wallCol"]),
                gate_row: int(&t["gateRow"]),
                gate_open: b(&t["gateOpen"]),
                tiles,
            }
        }
        fn key(col: f64, row: f64) -> (i64, i64) {
            assert!(col.fract() == 0.0 && row.fract() == 0.0, "pole calkowite");
            (col as i64, row as i64)
        }
        fn wall(&self, c: i64, r: i64) -> bool {
            (0..BF_ROWS).contains(&r)
                && c == self.wall_col
                && !(self.gate_open && (r == self.gate_row - 1 || r == self.gate_row))
        }
    }

    impl MoveTerrain for VecTerrain {
        fn passable(&self, col: f64, row: f64) -> bool {
            let (c, r) = Self::key(col, row);
            !self.wall(c, r) && self.tiles.get(&(c, r)).is_none_or(|t| t.0)
        }
        fn move_cost(&self, col: f64, row: f64) -> f64 {
            self.tiles.get(&Self::key(col, row)).map_or(1.0, |t| t.1)
        }
        fn is_ford(&self, col: f64, row: f64) -> bool {
            self.tiles.get(&Self::key(col, row)).is_some_and(|t| t.2)
        }
        fn cavalry_multiplier(&self, _col: f64, _row: f64) -> f64 {
            1.0
        }
    }

    fn act(u: &Value, side_atk: bool, doctrine_auto: bool) -> ActivateUnit {
        let ammo = num_or(&u["ammoLeft"], 0.0);
        let ranged_base = bo(&u["rangedBase"]);
        ActivateUnit {
            side_atk,
            q: int(&u["q"]),
            r: int(&u["r"]),
            dead: false,
            fading_out: false,
            routed: false,
            never_rout: bo(&u["neverRout"]),
            surround_applied: bo(&u["surroundApplied"]),
            morale: num_or(&u["morale"], 100.0),
            flee_morale: num_or(&u["fleeMorale"], 0.0),
            terrain_defence_mult: num_or(&u["tdm"], 1.0),
            range: num_or(&u["range"], 1.0),
            on_wall_walkway: bo(&u["onWall"]),
            primary_ranged: bo(&u["primaryRanged"]),
            mounted: bo(&u["mounted"]),
            phalanx: bo(&u["phalanx"]),
            shooting_disabled: u["shootingEnabled"].as_bool() == Some(false),
            dry_col: num_or(&u["dryCol"], -1.0),
            held_after_fallback: false,
            player_order_none: true,
            can_shoot: ranged_base && ammo > 0.0,
            is_siege_unit: bo(&u["siege"]),
            is_siege_tower: bo(&u["tower"]),
            is_ram: bo(&u["ram"]),
            is_catapult: bo(&u["cata"]),
            doctrine_auto,
            doctrine_manual: false,
        }
    }

    fn stats_of(u: &Value) -> Option<SiegeStructStats> {
        let s = &u["resolvedStats"];
        if s.is_null() {
            return None;
        }
        Some(SiegeStructStats {
            wall_attack: num(&s["wallAttack"]),
            missile_attack: num(&s["missileAttack"]),
            impact: num(&s["impact"]),
            weapon_damage: num(&s["weaponDamage"]),
        })
    }

    pub(super) struct Built {
        pub body: ProdBody<NoRolls>,
        pub st: TurnSeqState,
        pub acting: UnitRef,
    }

    /// Ciało i stan z wektora (jak `build` w `p6_k5loop_siege_atk_b.rs`), jednostka działająca po dowolnej stronie.
    pub(super) fn build(case: &Value) -> Built {
        let sides = [&case["atk"], &case["def"]];
        let acting = UnitRef {
            side: if case["acting"]["side"] == "def" {
                BattleSide::Defender
            } else {
                BattleSide::Attacker
            },
            idx: case["acting"]["idx"].as_u64().expect("idx") as usize,
        };
        let aix = usize::from(acting.side == BattleSide::Defender);
        let e = &case["expect"];
        let wall_col = int(&case["wallCol"]);
        let doctrine_auto = b(&e["doctrineAuto"]);
        let mut units: [Vec<ProdUnit>; 2] = [Vec::new(), Vec::new()];
        let mut seq: [Vec<SeqUnit>; 2] = [Vec::new(), Vec::new()];
        for (ix, list) in sides.iter().enumerate() {
            for (i, u) in list.as_array().expect("lista").iter().enumerate() {
                let dead = b(&u["dead"]);
                let me = ix == aix && i == acting.idx;
                units[ix].push(ProdUnit {
                    activate: act(u, ix == 0, me && doctrine_auto),
                    melee_target: None,
                    blow: None,
                    counter_blows: Vec::new(),
                    body_ms: 0.0,
                    facing: num(&u["facing"]),
                });
                seq[ix].push(SeqUnit {
                    id: (ix * 100 + seq[ix].len()) as u64,
                    c: CombatUnit {
                        hp: num_or(&u["hp"], 100.0),
                        morale: num_or(&u["morale"], 100.0),
                        flee_morale: num_or(&u["fleeMorale"], 0.0),
                        move_left: num(&u["moveLeft"]),
                        never_rout: bo(&u["neverRout"]),
                        dead,
                        fading_out: b(&u["fadingOut"]),
                        routed: b(&u["routed"]),
                        removed: dead,
                        acted: false,
                    },
                });
            }
        }
        let [atk_seq, def_seq] = seq;
        let st = TurnSeqState {
            atk: atk_seq,
            def: def_seq,
            turn_order: Vec::new(),
            turn_idx: 0,
            round_no: 1,
            siege_wall_col: wall_col,
            manual_mode: false,
            player_side: BattleSide::Attacker,
            finished: false,
            awaiting_orders: false,
            auto_battle_suspended: false,
            busy: false,
            auto_batch_planning: false,
            queued_order_ids: BTreeSet::new(),
        };
        let wall_tile_hp: Vec<(i64, f64)> = case["wallTiles"]
            .as_array()
            .expect("wallTiles")
            .iter()
            .map(|t| (int(&t[0]), num(&t[1])))
            .collect();
        let scene = ActivateScene {
            finished: false,
            manual_mode: false,
            is_player_side: false,
            wall_col,
            gate_open: b(&case["gateOpen"]),
            wall_tile_hp,
            siege_machine_range: f64::NAN,
        };
        let mut body = ProdBody::new(units, scene, NoRolls)
            .with_terrain(Box::new(VecTerrain::from(&case["terrain"])));
        body.wall_ever_breached = b(&case["wallEverBreached"]);
        body.siege_gate_col = int(&case["gateCol"]);
        body.siege_gate_row = int(&case["gateRow"]);
        body.siege_wall_tiles_init = case["wallTilesInit"].as_u64().expect("init") as usize;
        body.tower_at_wall_rows = case["towerAtWallRows"]
            .as_array()
            .expect("towerAtWallRows")
            .iter()
            .map(int)
            .collect();
        body.gate_hp = num(&case["gateHp"]);
        body.siege_towers = case["towers"]
            .as_array()
            .expect("towers")
            .iter()
            .map(|t| SiegeTowerRef {
                destroyed: b(&t["destroyed"]),
                row: num(&t["row"]),
            })
            .collect();
        body.tower_range = num(&case["towerRange"]);
        for (ix, list) in sides.iter().enumerate() {
            for (i, u) in list.as_array().expect("lista").iter().enumerate() {
                let ds = &mut body.doctrine[ix][i];
                ds.unit_doctrine = u["unitDoctrine"]
                    .as_str()
                    .map(|s| GroupDoctrine::parse(s).expect("doktryna"));
                assert!(u["groupId"].is_null(), "scenariusze bez grup");
                ds.anti_cav_spear = bo(&u["antiCavSpear"]);
                ds.shooting_enabled = u["shootingEnabled"].as_bool().unwrap_or(true);
                let rb = bo(&u["rangedBase"]);
                body.ranged_base[ix][i] = rb;
                body.ammo_left[ix][i] = num_or(&u["ammoLeft"], 0.0);
                body.range_base[ix][i] = if rb { num_or(&u["range"], 1.0) } else { 0.0 };
                body.morale_max[ix][i] = num_or(&u["moraleMax"], 100.0);
                body.siege_machine_range[ix][i] = Some(num_or(&u["machRange"], 1.0));
                body.siege_stats[ix][i] = stats_of(u);
                body.attack_direction[ix][i] = match u["attackDirection"].as_str() {
                    None | Some("front") => AttackDirection::Front,
                    Some("bok") => AttackDirection::Bok,
                    Some("tyl") => AttackDirection::Tyl,
                    Some(other) => panic!("kierunek {other}"),
                };
            }
        }
        body.sync_occupancy(&st);
        Built { body, st, acting }
    }

    pub(super) fn load_from(src: &str) -> Value {
        let v: Value = serde_json::from_str(src).expect("wektory");
        assert_eq!(v["pin"].as_str(), Some(PIN));
        assert_eq!(v["pinSha256"].as_str(), Some(PIN_SHA256));
        v
    }

    fn label(ev: &ActivateEvent) -> Option<String> {
        Some(match ev {
            ActivateEvent::Flee => "flee".into(),
            ActivateEvent::ApplyTerrainRange => "terrainRange".into(),
            ActivateEvent::UpdateFacing => "facing".into(),
            ActivateEvent::DoctrineStep => "doctrine".into(),
            ActivateEvent::Done
            | ActivateEvent::ResetPlayerOrder
            | ActivateEvent::UpdateMoraleBar
            | ActivateEvent::StartRout
            | ActivateEvent::PerformPlayerOrder => return None,
            other => format!("{other:?}"),
        })
    }

    /// Jedna aktywacja (ucieczka) wobec pinu: ślad, czas, kroki `Move` z czasami, stan wszystkich jednostek, `occByKey`,
    /// kolejność `Rout`/`Kill`/`Leave`/`Shaken`, chwile routów i zejść z pola, brak tagów.
    pub(super) fn check_case(case: &Value, failures: &mut Vec<String>) -> String {
        let name = case["name"].as_str().expect("name").to_string();
        let e = &case["expect"];
        let Built {
            mut body,
            mut st,
            acting,
        } = build(case);
        let aix = usize::from(acting.side == BattleSide::Defender);
        let mut fail = |what: &str, got: String, want: String| {
            failures.push(format!("{name}: {what}: rust={got} pin={want}"));
        };
        body.set_now(0.0);
        let start_pos = body.unit_cell(acting).expect("pozycja");
        let dur = body.start(acting, &st);
        body.complete(acting, &mut st);
        assert!(
            body.take_timers().is_empty(),
            "{name}: ucieczka bez odroczen"
        );
        let got_trace: Vec<String> = body.trace[0].1.iter().filter_map(label).collect();
        let want_trace: Vec<String> = e["trace"]
            .as_array()
            .expect("trace")
            .iter()
            .map(|t| t.as_str().expect("t").to_string())
            .collect();
        if got_trace != want_trace {
            fail("slad", format!("{got_trace:?}"), format!("{want_trace:?}"));
        }
        if !same_f64(dur, num(&e["duration"])) {
            fail("czas", format!("{dur}"), format!("{}", e["duration"]));
        }
        let fin = &e["final"];
        let pos = body.unit_cell(acting).expect("pozycja");
        if pos != (int(&fin["q"]), int(&fin["r"])) {
            fail(
                "pozycja",
                format!("{pos:?}"),
                format!("({},{})", fin["q"], fin["r"]),
            );
        }
        let ml = st.unit(acting).c.move_left;
        if !same_f64(ml, num(&fin["moveLeft"])) {
            fail("moveLeft", format!("{ml}"), format!("{}", fin["moveLeft"]));
        }
        if body.facing(acting) != num(&fin["facing"]) {
            fail(
                "facing",
                format!("{}", body.facing(acting)),
                format!("{}", fin["facing"]),
            );
        }
        if body.units[aix][acting.idx].activate.on_wall_walkway != b(&fin["onWall"]) {
            fail("onWall", "?".into(), format!("{}", fin["onWall"]));
        }
        let actions: Vec<TimedAction> = body.pending_actions().to_vec();
        let moves: Vec<TimedAction> = actions
            .iter()
            .filter(|ta| matches!(ta.action, BattleAction::Move { unit, .. } if unit == acting))
            .cloned()
            .collect();
        let mut want_moves: Vec<TimedAction> = Vec::new();
        let mut prev = start_pos;
        for s in e["steps"].as_array().expect("steps") {
            let to = (int(&s["col"]), int(&s["row"]));
            let t0 = num(&s["t"]);
            want_moves.push(TimedAction {
                t0,
                action: BattleAction::Move {
                    unit: acting,
                    from: prev,
                    to,
                    arrive_at: t0 + MOVE_STEP_MS,
                },
            });
            prev = to;
        }
        if moves != want_moves {
            fail("Move", format!("{moves:?}"), format!("{want_moves:?}"));
        }
        if !e["refused"].as_array().expect("refused").is_empty() {
            fail(
                "odmowa bramki muru w ucieczce",
                "-".into(),
                format!("{}", e["refused"]),
            );
        }
        for u in e["units"].as_array().expect("units") {
            let r = unit_of(u["unit"].as_str().expect("unit"));
            let six = usize::from(r.side == BattleSide::Defender);
            let au = &body.units[six][r.idx].activate;
            let c = st.unit(r).c;
            let got = (au.q, au.r, au.on_wall_walkway, c.routed, c.dead, c.removed);
            let want = (
                int(&u["q"]),
                int(&u["r"]),
                b(&u["onWall"]),
                b(&u["routed"]),
                b(&u["dead"]),
                b(&u["removed"]),
            );
            if got != want {
                fail(
                    &format!("jednostka {}", u["unit"]),
                    format!("{got:?}"),
                    format!("{want:?}"),
                );
            }
            if !same_f64(c.morale, num(&u["morale"])) {
                fail(
                    &format!("morale {}", u["unit"]),
                    format!("{}", c.morale),
                    format!("{}", u["morale"]),
                );
            }
            if body.facing(r) != num(&u["facing"]) {
                fail(
                    &format!("facing {}", u["unit"]),
                    format!("{}", body.facing(r)),
                    format!("{}", u["facing"]),
                );
            }
        }
        let mut got_order: Vec<String> = Vec::new();
        for ta in &actions {
            match &ta.action {
                BattleAction::Rout { unit } => got_order.push(format!("R:{}", tag_of(*unit))),
                BattleAction::Kill { unit } => got_order.push(format!("K:{}", tag_of(*unit))),
                BattleAction::Leave { unit } => got_order.push(format!("L:{}", tag_of(*unit))),
                BattleAction::Shaken { unit, .. } => got_order.push(format!("S:{}", tag_of(*unit))),
                _ => {}
            }
        }
        let want_order: Vec<String> = e["order"]
            .as_array()
            .expect("order")
            .iter()
            .map(|x| x.as_str().expect("o").to_string())
            .collect();
        if got_order != want_order {
            fail(
                "kolejnosc akcji sceny",
                format!("{got_order:?}"),
                format!("{want_order:?}"),
            );
        }
        let times = |kind: &str| -> Vec<(String, f64)> {
            e[kind]
                .as_array()
                .expect("lista")
                .iter()
                .map(|x| (x["unit"].as_str().unwrap_or("").to_string(), num(&x["t"])))
                .collect()
        };
        let got_routs: Vec<(String, f64)> = actions
            .iter()
            .filter_map(|ta| match ta.action {
                BattleAction::Rout { unit } => Some((tag_of(unit), ta.t0)),
                _ => None,
            })
            .collect();
        if got_routs != times("routs") {
            fail(
                "routy",
                format!("{got_routs:?}"),
                format!("{:?}", times("routs")),
            );
        }
        let got_leaves: Vec<(String, f64)> = actions
            .iter()
            .filter_map(|ta| match ta.action {
                BattleAction::Leave { unit } => Some((tag_of(unit), ta.t0)),
                _ => None,
            })
            .collect();
        if got_leaves != times("leaves") {
            fail(
                "zejscia z pola",
                format!("{got_leaves:?}"),
                format!("{:?}", times("leaves")),
            );
        }
        let want_occ: HashMap<_, String> = e["occ"]
            .as_array()
            .expect("occ")
            .iter()
            .map(|o| {
                (
                    cell_key(num(&o[0]), num(&o[1])),
                    o[2].as_str().expect("tag").to_string(),
                )
            })
            .collect();
        if body.occ_by_key() != &want_occ {
            fail(
                "occByKey",
                format!("{:?}", body.occ_by_key()),
                format!("{want_occ:?}"),
            );
        }
        if !body.unported.is_empty() {
            fail("unported", format!("{:?}", body.unported), "[]".into());
        }
        format!(
            "{}:{}",
            case["kind"].as_str().expect("kind"),
            e["branch"].as_str().expect("branch")
        )
    }

    fn run_family(src: &'static str) -> (Vec<String>, HashMap<String, usize>, usize) {
        let v = load_from(src);
        let mut failures = Vec::new();
        let mut cov: HashMap<String, usize> = HashMap::new();
        let cases = v["cases"].as_array().expect("cases");
        for case in cases {
            let k = check_case(case, &mut failures);
            *cov.entry(k).or_default() += 1;
            let kind = case["kind"].as_str().expect("kind").to_string();
            *cov.entry(kind).or_default() += 1;
            let e = &case["expect"];
            if e["steps"].as_array().expect("steps").len() >= 2 {
                *cov.entry("multiStep".into()).or_default() += 1;
            }
            if !e["leaves"].as_array().expect("leaves").is_empty() {
                *cov.entry("left".into()).or_default() += 1;
            }
            if !e["shaken"].as_array().expect("shaken").is_empty() {
                *cov.entry("shaken".into()).or_default() += 1;
            }
        }
        (failures, cov, cases.len())
    }

    fn guarded(
        label: &'static str,
        src: &'static str,
    ) -> (Vec<String>, HashMap<String, usize>, usize) {
        let (tx, rx) = mpsc::channel();
        std::thread::Builder::new()
            .name(label.into())
            .stack_size(64 * 1024 * 1024)
            .spawn(move || {
                let _ = tx.send(run_family(src));
            })
            .expect("watek");
        rx.recv_timeout(LOOP_GUARD).unwrap_or_else(|_| {
            panic!("{label}: przekroczony straznik czasu {LOOP_GUARD:?} (petla bez konca?)")
        })
    }

    fn report(label: &str, failures: &[String]) {
        assert!(
            failures.is_empty(),
            "{label}: {} rozbieznosci z pinem, pierwsze:\n{}",
            failures.len(),
            failures
                .iter()
                .take(15)
                .cloned()
                .collect::<Vec<_>>()
                .join("\n")
        );
    }

    fn at_least(cov: &HashMap<String, usize>, key: &str, n: usize) {
        let got = cov.get(key).copied().unwrap_or(0);
        assert!(got >= n, "pokrycie {key}: {got} < {n} ({cov:?})");
    }

    #[test]
    fn ucieczka_przy_murze_zgodna_z_pinem() {
        let (failures, cov, n) = guarded("siege", VECTORS);
        report("siege", &failures);
        eprintln!("pokrycie siege: {cov:?}");
        assert_eq!(n, 660);
        at_least(&cov, "flee-atk", 220);
        at_least(&cov, "flee-def", 220);
        at_least(&cov, "surround", 140);
        // Dług M19 (T2b): krok ukośny `dr = +2` w głąb zasięgu strzelca na koronie (bez `ru.routed` w
        // `_siegeApproachRestricted` byłby odrzucony), dla jednostki rozbitej wcześniej i rozbitej okrążeniem.
        at_least(&cov, "m19:flee-steps", 40);
        at_least(&cov, "m19-surround:flee-steps", 40);
        at_least(&cov, "multiStep", 300);
        at_least(&cov, "flee-def:flee-steps", 150);
        at_least(&cov, "surround:flee-steps", 100);
    }

    /// Lekcja NaN: `moveLeft = NaN` (preludium `_fleeStep` przepuszcza NaN, callback `ru.moveLeft > 0` kończy po kroku).
    #[test]
    fn ucieczka_przy_murze_nan_zgodna_z_pinem() {
        let (failures, cov, n) = guarded("siege-nan", VECTORS_NAN);
        report("siege-nan", &failures);
        assert_eq!(n, 160);
        assert_eq!(
            cov.get("multiStep").copied().unwrap_or(0),
            0,
            "NaN: najwyzej jeden krok"
        );
        at_least(&cov, "flee-atk:flee-steps", 50);
        at_least(&cov, "flee-def:flee-steps", 50);
    }

    /// Krawędzie planszy (mur w kolumnach 1, 2, 66, 67, wiersze 0/155): zejście z pola na krawędzi własnej strony
    /// (`_removeUnitFromScene` + ripple `_shakeAlliesOnLoss`), granice `nc`/`nr` w `_fleeStep`.
    #[test]
    fn ucieczka_przy_murze_krawedzie_zgodna_z_pinem() {
        let (failures, cov, n) = guarded("siege-edge", VECTORS_EDGE);
        report("siege-edge", &failures);
        eprintln!("pokrycie siege-edge: {cov:?}");
        assert_eq!(n, 200);
        at_least(&cov, "left", 60);
        at_least(&cov, "shaken", 40);
    }
}

/// Kryterium zamknięcia T4 (RUST-ONLY, bez wektorów pinu na poziomie CAŁEJ bitwy: NIE_ZMIERZONO, patrz raport):
/// pełna bitwa AUTO z murem przez [`SiegeLoop`] + [`ProdBody`] (teren z murem i otwartą bramą, wieże strzelające w
/// czasie aktywacji, strzelcy na koronie, dowódca obrońcy z bonusem morale armii, szablony ciosów, kontrataków i
/// strzałów podane przez „adapter” testu) kończy się bez ścieżek nieportowanych poza jawnymi błędami wejścia
/// (`*-brak-terenu`, `*-bez-szablonu`, `ucieczka-routed`). Zgodność gałęzi z pinem: rodziny `fx` i `siege` wyżej oraz
/// dotychczasowe testy K5LOOP.
mod battle {
    use std::collections::BTreeSet;

    use civ_engine::domain::siege_tactics_activate::{ActivateEvent, ActivateScene, ActivateUnit};
    use civ_engine::domain::siege_tactics_blow::{DefenderState, HitArc, SequenceRolls};
    use civ_engine::domain::siege_tactics_blow_full::{
        AtkMods, AttackerCu, BlowEnv, DefMods, DefenderCu, FullBlowInput,
    };
    use civ_engine::domain::siege_tactics_clock::VirtualClock;
    use civ_engine::domain::siege_tactics_end::BattleSide;
    use civ_engine::domain::siege_tactics_loop::{
        neutral_tower_shot_template, LoopTimer, ProdBody, ProdUnit, SiegeEnv, SiegeLoop,
    };
    use civ_engine::domain::siege_tactics_move_effects::MoveTerrain;
    use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState};
    use civ_engine::domain::siege_tactics_unit::CombatUnit;

    const W: i64 = 30;
    const GATE_ROW: i64 = 78;

    struct WallTerrain;

    impl MoveTerrain for WallTerrain {
        fn passable(&self, col: f64, row: f64) -> bool {
            // Mur w kolumnie `W`, brama otwarta w wierszach `GATE_ROW - 1`, `GATE_ROW`.
            !(col as i64 == W && row as i64 != GATE_ROW && row as i64 != GATE_ROW - 1)
        }
        fn move_cost(&self, _col: f64, _row: f64) -> f64 {
            1.0
        }
        fn is_ford(&self, _col: f64, _row: f64) -> bool {
            false
        }
        fn cavalry_multiplier(&self, _col: f64, _row: f64) -> f64 {
            1.0
        }
    }

    fn blow(ranged: bool, wd: f64) -> FullBlowInput {
        FullBlowInput {
            ranged,
            hit_arc: HitArc::Front,
            attacker: AttackerCu {
                weapon_damage: wd,
                piercing: 1.0,
                melee_attack: 12.0,
                missile_attack: Some(10.0),
                charge_bonus: 2.0,
                counter_typ: String::new(),
                typ_nazwa: String::new(),
            },
            atk_mods: AtkMods {
                atk: 0.0,
                ranged_atk: 0.0,
                uderzenie: 0.0,
            },
            atk_diff_mult: 1.0,
            atk_mounted: false,
            defender: DefenderCu {
                melee_defence: 4.0,
                armor: 2.0,
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
                is_city_defense_battle: true,
                wall_bonus_proc: 0.0,
                gated_terrain_multiplier: 1.0,
                field_terrain_multiplier: 1.0,
                atk_tile_is_river: false,
                river_row_exists: false,
                river_attack_mult: 1.0,
                atk_on_ford: false,
                def_on_ford_raw: false,
                shore_adjacent: false,
                brod_kara_obrona: 0.0,
                brod_bonus_brzegu: 0.0,
                fortify_obrona_proc: 0.0,
            },
            defender_state: DefenderState {
                hp: 60.0,
                max_hp: 60.0,
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

    #[derive(Clone, Copy)]
    enum Kind {
        Melee,
        Cavalry,
        Archer,
    }

    fn act(side_atk: bool, q: i64, r: i64, kind: Kind, on_wall: bool, morale: f64) -> ActivateUnit {
        ActivateUnit {
            side_atk,
            q,
            r,
            dead: false,
            fading_out: false,
            routed: false,
            never_rout: false,
            surround_applied: false,
            morale,
            flee_morale: 15.0,
            terrain_defence_mult: 1.0,
            range: if matches!(kind, Kind::Archer) {
                5.0
            } else {
                1.0
            },
            on_wall_walkway: on_wall,
            primary_ranged: matches!(kind, Kind::Archer),
            mounted: matches!(kind, Kind::Cavalry),
            phalanx: false,
            shooting_disabled: false,
            dry_col: -1.0,
            held_after_fallback: false,
            player_order_none: true,
            can_shoot: matches!(kind, Kind::Archer),
            is_siege_unit: false,
            is_siege_tower: false,
            is_ram: false,
            is_catapult: false,
            doctrine_auto: side_atk,
            doctrine_manual: false,
        }
    }

    /// Prosty generator liczb (LCG) dla rzutów: deterministyczny, różny dla ziaren.
    fn rolls(seed: u64, n: usize) -> Vec<f64> {
        let mut x = seed.wrapping_mul(6_364_136_223_846_793_005).wrapping_add(1);
        (0..n)
            .map(|_| {
                x = x
                    .wrapping_mul(6_364_136_223_846_793_005)
                    .wrapping_add(1_442_695_040_888_963_407);
                ((x >> 11) as f64) / ((1u64 << 53) as f64)
            })
            .collect()
    }

    struct Outcome {
        unported: Vec<&'static str>,
        flees: usize,
        commander_bonus_removed: bool,
        finished: bool,
    }

    fn battle(seed: u64, atk_morale: f64) -> Outcome {
        // Atakujący przed murem (piechota, jazda, łucznik), obrońcy: łucznicy na koronie, piechota za murem, dowódca.
        let atk_spec: Vec<(i64, i64, Kind)> = vec![
            (W - 5, 76, Kind::Melee),
            (W - 5, 77, Kind::Melee),
            (W - 5, 78, Kind::Melee),
            (W - 5, 79, Kind::Melee),
            (W - 7, 75, Kind::Cavalry),
            (W - 8, 78, Kind::Archer),
        ];
        let def_spec: Vec<(i64, i64, Kind, bool)> = vec![
            (W, 74, Kind::Archer, true),
            (W, 81, Kind::Archer, true),
            (W + 1, 77, Kind::Melee, false),
            (W + 1, 78, Kind::Melee, false),
            (W + 2, 78, Kind::Melee, false),
        ];
        let n_atk = atk_spec.len();
        let n_def = def_spec.len();
        let mut units: [Vec<ProdUnit>; 2] = [Vec::new(), Vec::new()];
        for (i, &(q, r, k)) in atk_spec.iter().enumerate() {
            units[0].push(ProdUnit {
                activate: act(true, q, r, k, false, atk_morale),
                melee_target: Some(i % n_def),
                blow: Some(blow(false, 9.0)),
                counter_blows: (0..n_def).map(|_| blow(false, 6.0)).collect(),
                body_ms: 150.0,
                facing: 1.0,
            });
        }
        for (i, &(q, r, k, on_wall)) in def_spec.iter().enumerate() {
            units[1].push(ProdUnit {
                activate: act(false, q, r, k, on_wall, 80.0),
                melee_target: Some(i % n_atk),
                blow: Some(blow(false, 9.0)),
                counter_blows: (0..n_atk).map(|_| blow(false, 6.0)).collect(),
                body_ms: 150.0,
                facing: 3.0,
            });
        }
        let cu = |hp: f64, morale: f64| CombatUnit {
            hp,
            morale,
            flee_morale: 15.0,
            move_left: 0.0,
            never_rout: false,
            dead: false,
            fading_out: false,
            routed: false,
            removed: false,
            acted: false,
        };
        let st = TurnSeqState {
            atk: (0..n_atk)
                .map(|i| SeqUnit {
                    id: i as u64,
                    c: cu(60.0, atk_morale),
                })
                .collect(),
            def: (0..n_def)
                .map(|i| SeqUnit {
                    id: 100 + i as u64,
                    c: cu(60.0, 80.0),
                })
                .collect(),
            turn_order: Vec::new(),
            turn_idx: 0,
            round_no: 0,
            siege_wall_col: W,
            manual_mode: false,
            player_side: BattleSide::Attacker,
            finished: false,
            awaiting_orders: false,
            auto_battle_suspended: false,
            busy: false,
            auto_batch_planning: false,
            queued_order_ids: BTreeSet::new(),
        };
        let wall_rows: Vec<i64> = (60..100)
            .filter(|r| *r != GATE_ROW && *r != GATE_ROW - 1)
            .collect();
        let scene = ActivateScene {
            finished: false,
            manual_mode: false,
            is_player_side: false,
            wall_col: W,
            gate_open: true,
            wall_tile_hp: wall_rows.iter().map(|r| (*r, 40.0)).collect(),
            siege_machine_range: f64::NAN,
        };
        let mut body = ProdBody::new(units, scene, SequenceRolls::new(rolls(seed, 400_000)))
            .with_terrain(Box::new(WallTerrain));
        body.siege_wall_tiles_init = wall_rows.len();
        body.siege_gate_col = W;
        body.siege_gate_row = GATE_ROW;
        // Strzelcy: szablony strzału na każdego wroga, amunicja skończona dla atakującego łucznika.
        for (i, spec) in atk_spec.iter().enumerate() {
            if matches!(spec.2, Kind::Archer) {
                body.ammo_left[0][i] = 6.0;
                for t in 0..n_def {
                    body.ranged_blows[0][i].insert(t, blow(true, 7.0));
                }
            }
        }
        for (i, spec) in def_spec.iter().enumerate() {
            if matches!(spec.2, Kind::Archer) {
                for t in 0..n_atk {
                    body.ranged_blows[1][i].insert(t, blow(true, 7.0));
                }
            }
        }
        // Dowódca obrońcy (def2, przy bramie) i bonus morale armii jego strony; dowódca atakującego (atk1) z bonusem
        // swojej strony (w AUTO bez trybu ręcznego tylko efekt morale, `_disableManualIfCommanderLost` bez skutku).
        body.is_army_commander[1][2] = true;
        body.is_army_commander[0][1] = true;
        for i in 0..n_atk {
            body.army_leader_bonus_frac[0][i] = 0.1;
            body.morale_base_plain[0][i] = Some(50.0);
        }
        for i in 0..n_def {
            body.army_leader_bonus_frac[1][i] = 0.2;
            body.morale_base_plain[1][i] = Some(60.0);
            body.morale_max[1][i] = 100.0;
        }
        for i in 0..n_atk {
            body.morale_max[0][i] = 100.0;
        }
        let env = SiegeEnv {
            body,
            tower_rows: vec![70, 86],
            pending_tower_shots: Vec::new(),
            tower_range: 4.0,
            tower_shot: Some(neutral_tower_shot_template()),
            wall_tile_rows: wall_rows.clone(),
            wall_ever_breached: false,
            no_breach_cap: 60,
            move_points: [vec![3.0; n_atk], vec![2.0; n_def]],
            morale_max: [vec![100.0; n_atk], vec![100.0; n_def]],
        };
        let mut lp = SiegeLoop::new(st, env);
        let mut clock = VirtualClock::<LoopTimer>::new();
        lp.run(&mut clock, 20_000);
        assert_eq!(lp.unsupported, None, "ziarno {seed}");
        let body = &lp.env.body;
        let flees = body
            .trace
            .iter()
            .filter(|(_, ev)| ev.contains(&ActivateEvent::Flee))
            .count();
        Outcome {
            unported: body.unported.iter().map(|(_, t)| *t).collect(),
            flees,
            commander_bonus_removed: body.army_leader_bonus_frac[1].iter().all(|f| *f == 0.0)
                || body.army_leader_bonus_frac[0].iter().all(|f| *f == 0.0),
            finished: lp.winner.is_some(),
        }
    }

    #[test]
    fn pelna_bitwa_auto_z_murem_bez_tagow_poza_wejsciowymi() {
        let (tx, rx) = std::sync::mpsc::channel();
        std::thread::spawn(move || {
            let mut flees = 0;
            let mut finished = 0;
            let mut bonus = 0;
            for (k, seed) in (1..=12u64).enumerate() {
                let morale = [18.0, 25.0, 40.0, 60.0][k % 4];
                let o = battle(seed, morale);
                let bad: Vec<&str> = o
                    .unported
                    .iter()
                    .copied()
                    .filter(|t| !super::is_input_error_tag(t))
                    .collect();
                assert!(
                    bad.is_empty(),
                    "ziarno {seed}: tagi spoza bledow wejscia {bad:?}"
                );
                flees += o.flees;
                finished += usize::from(o.finished);
                bonus += usize::from(o.commander_bonus_removed);
            }
            let _ = tx.send((flees, finished, bonus));
        });
        let (flees, finished, bonus) = rx
            .recv_timeout(std::time::Duration::from_secs(90))
            .expect("bitwy bez konca w 90 s albo panika (szczegoly wyzej)");
        eprintln!(
            "pelna bitwa: ucieczki={flees} zakonczone={finished}/12 bonus_dowodcy_zdjety={bonus}"
        );
        assert!(flees > 0, "ucieczka przy murze w pelnej bitwie");
        assert!(finished > 0, "co najmniej jedna bitwa zakonczona");
        // Utrata dowódcy w tym zestawie bitew nie występuje (licznik raportowany, bez progu): efekty dowódcy wobec
        // pinu sprawdza rodzina `fx` (65 aktywacji z utratą dowódcy).
    }
}
