//! P6 SIEGE-TAKTYKA K5-LOOP-BODY (runda 2 Operatora, dispatch R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-BODY-Q1):
//! testy produkcyjnego ciała jednostki [`ProdBody`] (K5H `activate_unit` + K5I `single_blow_full`).
//!
//! To NIE są wektory zgodności z pinem (`07d2fbd72`): generator wektorów nie został rozszerzony w tej rundzie
//! (NIE_ZMIERZONO w raporcie). Testy sprawdzają wyłącznie spójność składania: cios w zwarciu daje ten sam wynik co
//! bezpośrednie `single_blow_full` z tym samym rzutem; gałęzie spoza zakresu nie wykonują efektów i są zapisane
//! w `unported`; jednostka martwa / znikająca nic nie robi.

use std::collections::BTreeSet;

use civ_engine::domain::siege_tactics_activate::{ActivateScene, ActivateUnit};
use civ_engine::domain::siege_tactics_blow::{DefenderState, HitArc, Outcome, SequenceRolls};
use civ_engine::domain::siege_tactics_blow_full::{
    single_blow_full, AtkMods, AttackerCu, BlowEnv, DefMods, DefenderCu, FullBlowInput,
};
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{LoopBody, ProdBody, ProdUnit};
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;

const ROLL: f64 = 0.5;

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

fn state(atk: CombatUnit, def: CombatUnit) -> TurnSeqState {
    TurnSeqState {
        atk: vec![SeqUnit { id: 1, c: atk }],
        def: vec![SeqUnit { id: 2, c: def }],
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

/// Jednostka atakująca sąsiada (melee) i obrońca bez akcji.
fn body_with(attacker: ActivateUnit, blow: Option<FullBlowInput>) -> ProdBody<SequenceRolls> {
    let a = ProdUnit {
        activate: attacker,
        melee_target: Some(0),
        blow,
        body_ms: 800.0,
    };
    let d = ProdUnit {
        activate: act(1, 0, false),
        melee_target: None,
        blow: None,
        body_ms: 0.0,
    };
    ProdBody::new([vec![a], vec![d]], scene(), SequenceRolls::new(vec![ROLL]))
}

fn atk0() -> UnitRef {
    UnitRef {
        side: BattleSide::Attacker,
        idx: 0,
    }
}

#[test]
fn cios_w_zwarciu_daje_wynik_single_blow_full() {
    let mut body = body_with(act(0, 0, true), Some(melee_blow()));
    let mut st = state(cu(100.0, 100.0), cu(50.0, 100.0));
    let dur = body.start(atk0(), &st);
    assert_eq!(
        dur, 800.0,
        "cios w zwarciu ma czas z wejscia adaptera; unported={:?}",
        body.unported
    );
    body.complete(atk0(), &mut st);

    // Oczekiwany wynik: to samo wejscie i ten sam rzut, bez sterownika.
    let expected = single_blow_full(&melee_blow(), &mut SequenceRolls::new(vec![ROLL]));
    assert_eq!(
        st.def[0].c.hp, expected.blow.def_hp_after,
        "HP obroncy = def_hp_after"
    );
    assert_eq!(
        st.def[0].c.dead,
        expected.blow.outcome == Outcome::Kill,
        "zabicie tylko przy Outcome::Kill"
    );
    if expected.blow.outcome != Outcome::None {
        assert!(
            body.unported
                .contains(&(atk0(), "resolveBlowOutcome-efekty")),
            "efekty _resolveBlowOutcome sa zapisane jako nieportowane"
        );
    }
}

#[test]
fn ucieczka_routed_nic_nie_robi_i_jest_zapisana() {
    let mut a = act(0, 0, true);
    a.routed = true;
    let mut body = body_with(a, Some(melee_blow()));
    let mut st = state(
        CombatUnit {
            routed: true,
            ..cu(100.0, 10.0)
        },
        cu(50.0, 100.0),
    );
    assert_eq!(body.start(atk0(), &st), 0.0);
    body.complete(atk0(), &mut st);
    assert_eq!(st.def[0].c.hp, 50.0, "routed nie atakuje");
    assert_eq!(body.unported, vec![(atk0(), "ucieczka-routed")]);
}

#[test]
fn jednostka_znikajaca_nie_ma_efektow_ani_wpisow() {
    let mut body = body_with(act(0, 0, true), Some(melee_blow()));
    let mut st = state(
        CombatUnit {
            fading_out: true,
            ..cu(100.0, 100.0)
        },
        cu(50.0, 100.0),
    );
    assert_eq!(body.start(atk0(), &st), 0.0);
    body.complete(atk0(), &mut st);
    assert_eq!(st.def[0].c.hp, 50.0);
    assert!(
        body.unported.is_empty(),
        "fadingOut konczy _activateUnit bez gałęzi"
    );
}

#[test]
fn doktryna_i_mur_sa_poza_zakresem_i_zapisane() {
    let mut a = act(0, 0, true);
    a.doctrine_auto = true;
    let mut body = body_with(a, Some(melee_blow()));
    let mut st = state(cu(100.0, 100.0), cu(50.0, 100.0));
    assert_eq!(body.start(atk0(), &st), 0.0);
    body.complete(atk0(), &mut st);
    assert_eq!(
        st.def[0].c.hp, 50.0,
        "doktryna nie jest wykonywana przez ten klocek"
    );
    assert_eq!(body.unported, vec![(atk0(), "doktryna")]);

    let mut body = body_with(act(0, 0, true), Some(melee_blow()));
    let mut st = state(cu(100.0, 100.0), cu(50.0, 100.0));
    st.siege_wall_col = 5;
    assert_eq!(body.start(atk0(), &st), 0.0);
    body.complete(atk0(), &mut st);
    assert_eq!(st.def[0].c.hp, 50.0);
    assert_eq!(body.unported, vec![(atk0(), "oblezenie")]);
}
