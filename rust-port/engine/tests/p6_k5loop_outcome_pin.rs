//! P6 K5LOOP-OUTCOME (dispatch R-RUSTPORT-P6-K5LOOP-OUTCOME-Q1, runda 5): efekty po ciosie w produkcyjnym
//! `ProdBody::strike` (`_resolveBlowOutcome`, `_applyMoraleDamage`, `_checkRout`, `_startRout`, `_startFade`).
//!
//! Zgodność liczbowa z PINEM `07d2fbd72` (tekst `_resolveBlowOutcome` :9019, `_checkRout` :9783 i reszty efektów
//! WYKONYWANY w generatorze `p6_siege_tactics_loop_body_gen.mjs`, strażnik SHA-256 `outcomeSha256`) jest sprawdzana
//! w `p6_siege_tactics_loop_body_pin.rs` na 320 sekwencjach (stan KAŻDEJ jednostki po KAŻDEJ aktywacji: HP, morale,
//! `dead`/`removed`/`routed`/`acted`/`facing`). Ten plik:
//!  1. sprawdza SHA i niepustość liczników pokrycia tych wektorów (Kill, MoraleOnly, rout po ciosie, boost, gain,
//!     armia w odwrocie),
//!  2. daje nazwane scenariusze (Kill, MoraleOnly, rout-flaga) z ręcznie policzonymi oczekiwaniami,
//!  3. testuje RUST-ONLY (bez wektorów pinu, NIE_ZMIERZONO względem pinu): osłonę wręcz (`_checkMeleeScreenLost`),
//!     tagi `unported` (ripple `shakeAlliesOnLoss`), efekty dowódcy (K5LOOP-TAGS-REST; zgodność z pinem w
//!     `p6_k5loop_tags_rest`) i próg terenu obronnego w `_checkRout`.

use std::collections::BTreeSet;

use civ_engine::domain::siege_tactics_activate::{ActivateScene, ActivateUnit};
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
const OUTCOME_SHA256: &str = "6cc2b1e08bcee451d42d8d022c446c6ef42f8e4d045087dff5a653d7a09f737c";

/// Rzut 0.0: zawsze trafienie (pudło wymaga `roll >= hitPct`, a `hitPct >= hit_min > 0`).
const ROLL: f64 = 0.0;

fn cu(hp: f64, morale: f64) -> CombatUnit {
    CombatUnit {
        hp,
        morale,
        flee_morale: 0.0,
        move_left: 0.0,
        never_rout: false,
        dead: false,
        fading_out: false,
        routed: false,
        removed: false,
        acted: false,
    }
}

fn act(q: i64, r: i64, side_atk: bool) -> ActivateUnit {
    ActivateUnit {
        side_atk,
        q,
        r,
        dead: false,
        fading_out: false,
        routed: false,
        never_rout: false,
        surround_applied: false,
        morale: 100.0,
        flee_morale: 0.0,
        terrain_defence_mult: 1.0,
        range: 1.0,
        on_wall_walkway: false,
        primary_ranged: false,
        mounted: false,
        phalanx: false,
        shooting_disabled: false,
        dry_col: 0.0,
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

fn melee_blow() -> FullBlowInput {
    FullBlowInput {
        ranged: false,
        // Wartość bez znaczenia: `ProdBody` nadpisuje łuk przez `relative_hit` z aktualnego facing obrońcy.
        hit_arc: HitArc::Front,
        attacker: AttackerCu {
            weapon_damage: 5.0,
            piercing: 0.0,
            melee_attack: 10.0,
            missile_attack: None,
            charge_bonus: 0.0,
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
            river_attack_mult: 1.0,
            atk_on_ford: false,
            def_on_ford_raw: false,
            shore_adjacent: false,
            brod_kara_obrona: 0.0,
            brod_bonus_brzegu: 0.0,
            fortify_obrona_proc: 0.0,
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
    }
}

fn scene() -> ActivateScene {
    ActivateScene {
        finished: false,
        manual_mode: false,
        is_player_side: false,
        wall_col: -1,
        gate_open: false,
        wall_tile_hp: Vec::new(),
        siege_machine_range: 0.0,
    }
}

fn unit_ref(side: BattleSide, idx: usize) -> UnitRef {
    UnitRef { side, idx }
}

fn atk0() -> UnitRef {
    unit_ref(BattleSide::Attacker, 0)
}

fn def(i: usize) -> UnitRef {
    unit_ref(BattleSide::Defender, i)
}

fn pu(activate: ActivateUnit, target: Option<usize>, blow: Option<FullBlowInput>) -> ProdUnit {
    ProdUnit {
        activate,
        melee_target: target,
        blow,
        counter_blows: Vec::new(),
        body_ms: 800.0,
        facing: 0.0,
    }
}

fn state_n(atk: Vec<CombatUnit>, def: Vec<CombatUnit>) -> TurnSeqState {
    let mk = |v: Vec<CombatUnit>, base: u64| {
        v.into_iter()
            .enumerate()
            .map(|(i, c)| SeqUnit {
                id: base + i as u64,
                c,
            })
            .collect::<Vec<_>>()
    };
    TurnSeqState {
        atk: mk(atk, 1),
        def: mk(def, 100),
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
    }
}

/// Atakujący `atk0` na (0,0) bije `def0` na (1,0); pozostali obrońcy nie działają. Jeden rzut (trafienie).
fn scenario(
    def_units: Vec<(ActivateUnit, CombatUnit)>,
    atk_morale: f64,
) -> (ProdBody<SequenceRolls>, TurnSeqState) {
    let mut a = act(0, 0, true);
    a.morale = atk_morale;
    let attacker = pu(a, Some(0), Some(melee_blow()));
    let mut st_def = Vec::new();
    let mut pus = Vec::new();
    for (au, c) in def_units {
        let mut d = pu(au, None, None);
        // Obrońca zwrócony na W (Dir.W = 3) ku atakującemu: cios z przodu, bez dodatku flanki/tyłu.
        d.facing = 3.0;
        pus.push(d);
        st_def.push(c);
    }
    let st = state_n(vec![cu(100.0, atk_morale)], st_def);
    let mut body = ProdBody::new(
        [vec![attacker], pus],
        scene(),
        SequenceRolls::new(vec![ROLL]),
    );
    // `moraleMax` atakującego 100 (zysk morale ma pole do wzrostu); obrońcy: domyślnie morale startowe (100).
    body.morale_max[0][0] = 100.0;
    (body, st)
}

fn strike_once(body: &mut ProdBody<SequenceRolls>, st: &mut TurnSeqState) {
    assert_eq!(
        body.start(atk0(), st),
        800.0,
        "unported={:?}",
        body.unported
    );
    body.complete(atk0(), st);
    assert_eq!(body.blows.len(), 1);
    assert!(!body.blows[0].missed, "rzut 0.0 zawsze trafia");
    assert_eq!(body.blows[0].dmg, 5.0, "weapon_damage 5 bez pancerza");
}

fn def_act(q: i64) -> ActivateUnit {
    act(q, 0, false)
}

/// Scenariusz 1 (Kill): cios 5 przy HP 3 zabija. `_startFade` -> `removed`+`dead`, `fadingOut = false`;
/// `_boostEnemiesOnBreak` daje atakującemu (wróg poległego, dystans 1 <= 3) +5, `_gainMorale` +6 (80 -> 91).
/// Ripple `_shakeAlliesOnLoss` (`battleScene.ts:9048`) jest wykonywany (K5LOOP-KILL-RIPPLE, D-INT-2): jedno wywołanie dla
/// poległego, bez tagu w `unported` (brak sojuszników w promieniu, więc bez zmian morale).
#[test]
fn scenariusz_kill_znika_z_pola_i_morale_atakujacego() {
    let (mut body, mut st) = scenario(vec![(def_act(1), cu(3.0, 100.0))], 80.0);
    strike_once(&mut body, &mut st);
    let d = st.def[0].c;
    assert!(d.dead && d.removed && !d.fading_out, "zabity znika z pola");
    assert_eq!(d.hp, 0.0);
    assert_eq!(st.atk[0].c.morale, 91.0, "boost +5 i gain +6");
    assert!(!d.routed, "zabicie nie ustawia routed");
    assert_eq!(
        body.kill_ripples,
        vec![def(0)],
        "ripple przy zabiciu (:9048)"
    );
    assert!(body.unported.iter().all(|(_, t)| *t != "shakeAlliesOnLoss"));
}

/// Scenariusz 2 (MoraleOnly): cios 5 przy maxHp 50 = -10 morale, bez routu i bez zabicia, bez zysku atakującego.
#[test]
fn scenariusz_morale_only_obniza_morale_bez_routu() {
    let (mut body, mut st) = scenario(vec![(def_act(1), cu(50.0, 100.0))], 80.0);
    strike_once(&mut body, &mut st);
    let d = st.def[0].c;
    assert_eq!(d.hp, 45.0);
    assert_eq!(d.morale, 90.0, "100 * (5/50) = 10 strat");
    assert!(!d.routed && !d.dead && !d.removed);
    assert_eq!(st.atk[0].c.morale, 80.0, "brak zysku bez zlamania celu");
    assert!(body.unported.iter().all(|(_, t)| *t != "shakeAlliesOnLoss"));
    assert!(body.kill_ripples.is_empty(), "bez zabicia brak ripple");
}

/// Scenariusz 3 (rout-flaga): morale 12, próg 5 -> po ciosie 2 <= 5. Rout przed śmiercią: `routed`, `acted`,
/// zwrot ku własnej krawędzi (obrońca E = 1), HP > 0; atakujący: boost +5 (wróg złamanego) i gain +6.
#[test]
fn scenariusz_rout_flaga_ustawia_routed_acted_i_facing() {
    let mut c = cu(50.0, 12.0);
    c.flee_morale = 5.0;
    let (mut body, mut st) = scenario(vec![(def_act(1), c)], 80.0);
    // moraleMax 12 = brak armii w odwrocie (ratio 1.0), więc strata 10 bez mnożnika 1.3.
    body.morale_max[1][0] = 12.0;
    strike_once(&mut body, &mut st);
    let d = st.def[0].c;
    assert!(d.routed && d.acted && !d.dead && !d.removed);
    assert_eq!(d.hp, 45.0, "rout przed smiercia: HP zostaje");
    assert_eq!(d.morale, 2.0);
    assert_eq!(body.facing(def(0)), 1.0, "obronca ucieka na E");
    assert_eq!(st.atk[0].c.morale, 91.0, "boost +5 i gain +6");
}

/// Teren obronny (`terrain_defence_mult > 1`): próg ucieczki spada o 5 (5 -> 0), więc morale 2 > 0 = brak routu.
#[test]
fn teren_obronny_obniza_prog_ucieczki() {
    let mut c = cu(50.0, 12.0);
    c.flee_morale = 5.0;
    let mut a = def_act(1);
    a.terrain_defence_mult = 1.5;
    let (mut body, mut st) = scenario(vec![(a, c)], 80.0);
    body.morale_max[1][0] = 12.0;
    strike_once(&mut body, &mut st);
    let d = st.def[0].c;
    assert!(!d.routed, "prog 0, morale 2");
    assert_eq!(d.morale, 2.0);
}

/// Armia w odwrocie (`_armyMoraleRatio` < 0.40): strata z HP razy 1.3 (10 -> 13): 30 -> 17.
#[test]
fn armia_w_odwrocie_zwieksza_strate_morale() {
    let (mut body, mut st) = scenario(vec![(def_act(1), cu(50.0, 30.0))], 80.0);
    body.morale_max[1][0] = 100.0;
    strike_once(&mut body, &mut st);
    assert_eq!(st.def[0].c.morale, 17.0);
}

/// K5LOOP-TAGS-REST (D-INT-2; dawniej `dowodca_jest_nieportowany_i_oznaczony`, oczekiwał tagu `dowodca-fade`):
/// zabicie dowódcy (`_startFade` `:9929-9932`) wykonuje `_removeCommanderMoraleBonus(side)` (`:9993-10005`) dla
/// strony obrońcy. def1 (daleko od poległego: bez ripple) ma bonus 0.25, `moraleMax` 125, morale 100: `ratio` = 0.8,
/// `base` = 100 (`moraleBaseFor` bez bonusu) x 1.5 (obrońca) = 150, `morale = min(150, ceil(150 x 0.8)) = 120`,
/// `moraleMax = 150`, bonus zerowany. def2 ma bonus 0 (pomijany). Brak tagów. Pełna zgodność z pinem: wektory
/// `p6_k5loop_tags_rest` (rodzina `commander`).
#[test]
fn dowodca_zabity_zdejmuje_bonus_morale_strony() {
    let (mut body, mut st) = scenario(
        vec![
            (def_act(1), cu(3.0, 100.0)),
            (def_act(20), cu(50.0, 100.0)),
            (def_act(30), cu(50.0, 70.0)),
        ],
        80.0,
    );
    body.is_army_commander[1][0] = true;
    body.army_leader_bonus_frac[1][1] = 0.25;
    body.morale_max[1][1] = 125.0;
    body.morale_base_plain[1][1] = Some(100.0);
    body.morale_max[1][2] = 90.0;
    strike_once(&mut body, &mut st);
    assert!(st.def[0].c.dead && st.def[0].c.removed);
    assert_eq!(body.unported, vec![]);
    assert_eq!(st.def[1].c.morale, 120.0);
    assert_eq!(body.morale_max[1][1], 150.0);
    assert_eq!(body.army_leader_bonus_frac[1][1], 0.0);
    assert_eq!(st.def[2].c.morale, 70.0, "bez bonusu: bez zmian");
    assert_eq!(body.morale_max[1][2], 90.0);
}

/// K5LOOP-TAGS-REST (mutant T12 Operatora): `ratio = u.moraleMax > 0 ? ... : 0` (`battleScene.ts:9997`). Jednostka z
/// bonusem i `moraleMax = 0`: `ratio = 0`, więc `morale = min(base, ceil(base * 0)) = 0` (bez warunku byłoby `0 / 0 = NaN`).
/// def1: bonus 0.25, `moraleMax` 0, morale 30, baza 80 -> `moraleMax` 120 (x1.5), morale 0.
#[test]
fn dowodca_bonus_przy_zerowym_morale_max_daje_ratio_zero() {
    let (mut body, mut st) = scenario(
        vec![(def_act(1), cu(3.0, 100.0)), (def_act(20), cu(50.0, 30.0))],
        80.0,
    );
    body.is_army_commander[1][0] = true;
    body.army_leader_bonus_frac[1][1] = 0.25;
    body.morale_max[1][1] = 0.0;
    body.morale_base_plain[1][1] = Some(80.0);
    strike_once(&mut body, &mut st);
    assert_eq!(body.unported, vec![]);
    assert_eq!(st.def[1].c.morale.to_bits(), 0.0_f64.to_bits());
    assert_eq!(body.morale_max[1][1], 120.0);
}

/// K5LOOP-TAGS-REST: bonus dowódcy bez wejścia `moraleBaseFor` (adapter nie podał [`ProdBody::morale_base_plain`]) =
/// jawny błąd wejścia `dowodca-bez-bazy-morale` i brak zmiany tej jednostki (bez zgadywania bazy).
#[test]
fn dowodca_bonus_bez_bazy_morale_jest_bledem_wejscia() {
    let (mut body, mut st) = scenario(
        vec![(def_act(1), cu(3.0, 100.0)), (def_act(20), cu(50.0, 100.0))],
        80.0,
    );
    body.is_army_commander[1][0] = true;
    body.army_leader_bonus_frac[1][1] = 0.25;
    body.morale_max[1][1] = 125.0;
    strike_once(&mut body, &mut st);
    assert_eq!(body.unported, vec![(def(1), "dowodca-bez-bazy-morale")]);
    assert_eq!(st.def[1].c.morale, 100.0);
    assert_eq!(body.morale_max[1][1], 125.0);
}

/// RUST-ONLY (bez wektorów pinu): osłona wręcz. Złamanie ostatniej jednostki wręcz (def0) odbiera strzelcowi (def1,
/// `primary_ranged`) 50% morale jednorazowo (40 -> 20), a 20 <= próg 25 daje jego rout; flaga `screenLostApplied`.
#[test]
fn oslona_wrecz_strzelcy_traca_polowe_morale() {
    let mut melee = cu(50.0, 12.0);
    melee.flee_morale = 5.0;
    let mut shooter = cu(40.0, 40.0);
    shooter.flee_morale = 25.0;
    let mut sa = def_act(2);
    sa.primary_ranged = true;
    let (mut body, mut st) = scenario(vec![(def_act(1), melee), (sa, shooter)], 80.0);
    body.morale_max[1][0] = 12.0;
    body.morale_max[1][1] = 40.0;
    strike_once(&mut body, &mut st);
    assert!(st.def[0].c.routed, "def0 zlamany ciosem");
    assert!(body.screen_lost_applied(def(1)), "oslona stracona");
    assert_eq!(st.def[1].c.morale, 20.0, "-50% jednorazowo");
    assert!(
        st.def[1].c.routed && st.def[1].c.acted,
        "20 <= 25: strzelec peka"
    );
}

/// Wektory pinu: SHA fragmentów efektów po ciosie i niepustość liczników pokrycia (Kill, MoraleOnly, rout po ciosie,
/// boost wrogów, zysk morale, armia w odwrocie) oraz zgodność liczników z danymi oczekiwań (liczone niezależnie).
#[test]
fn wektory_pinu_pokrywaja_galezie_efektow() {
    let v: Value = serde_json::from_str(VECTORS).expect("vectors.json");
    assert_eq!(v["outcomeSha256"], OUTCOME_SHA256);
    let cov = &v["coverage"];
    for k in [
        "fxFades",
        "fxShakes",
        "fxGains",
        "fxBoosts",
        "fxCollapse",
        "fxRouts",
        "moraleOnlyHits",
        "moraleDropHits",
        "routedByBlow",
        "removedAfterKill",
    ] {
        assert!(cov[k].as_u64().expect(k) > 0, "pokrycie {k} puste");
    }
    // Niezależne przeliczenie z danych: aktywacje z zabiciem (fx.fades) i z trafieniem bez zabicia/routu.
    let mut fades = 0u64;
    let mut morale_only = 0u64;
    for seq in v["sequences"].as_array().expect("sequences") {
        for e in seq["expect"].as_array().expect("expect") {
            let hit = e["blow"].is_object() && e["blow"]["missed"] == false;
            if e["fx"]["fades"].as_u64().expect("fades") > 0 {
                fades += 1;
            } else if hit && e["fx"]["routs"].as_u64().expect("routs") == 0 {
                morale_only += 1;
            }
        }
    }
    assert_eq!(fades, cov["fxFades"].as_u64().unwrap());
    assert_eq!(morale_only, cov["moraleOnlyHits"].as_u64().unwrap());
}
