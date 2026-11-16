//! K5DOC-PROD-UNIT-STAN (T0, dispatch R-RUSTPORT-P6-K5DOC-PROD-UNIT-STAN-T0): wektory `_forwardCol` (pin
//! `gra/src/battle/battleScene.ts:6748`, `_advanceDir` tuż przed nim), wektory `GroupDoctrine` (pin `:1938`) i
//! test wartości domyślnych nowych pól stanu doktryny jednostki (pin spawn `:4555-4576`).

use civ_engine::domain::siege_tactics_activate::{ActivateScene, ActivateUnit};
use civ_engine::domain::siege_tactics_blow::SequenceRolls;
use civ_engine::domain::siege_tactics_doctrine_state::{
    forward_col, BattleUnitClass, GroupDoctrine, ProdDoctrineState,
};
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{ProdBody, ProdUnit};
use civ_engine::domain::siege_tactics_turnseq::UnitRef;

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

fn unit(side_atk: bool, q: i64) -> ProdUnit {
    ProdUnit {
        activate: act(q, 0, side_atk),
        melee_target: None,
        blow: None,
        counter_blows: Vec::new(),
        body_ms: 0.0,
        facing: 0.0,
    }
}

// --- _forwardCol (battleScene.ts:6748; BF_COLS = 68, battleScene.ts:661) ------------------------------------------

#[test]
fn forward_col_dodatni_kierunek_atakujacego() {
    // atk: advanceDir = +1 (battleScene.ts:6742): kolumna rośnie o `steps`.
    assert_eq!(forward_col(BattleSide::Attacker, 10, 1), 11);
    assert_eq!(forward_col(BattleSide::Attacker, 30, 4), 34);
}

#[test]
fn forward_col_ujemny_kierunek_obroncy() {
    // def: advanceDir = -1 (battleScene.ts:6742): kolumna maleje o `steps`.
    assert_eq!(forward_col(BattleSide::Defender, 10, 2), 8);
    assert_eq!(forward_col(BattleSide::Defender, 5, 1), 4);
}

#[test]
fn forward_col_granice_planszy_clamp() {
    // Math.min(BF_COLS - 1 = 67, ...) i Math.max(0, ...) (battleScene.ts:6749).
    assert_eq!(forward_col(BattleSide::Attacker, 67, 1), 67);
    assert_eq!(forward_col(BattleSide::Attacker, 66, 5), 67);
    assert_eq!(forward_col(BattleSide::Defender, 0, 1), 0);
    assert_eq!(forward_col(BattleSide::Defender, 2, 9), 0);
}

#[test]
fn forward_col_zero_krokow_nie_rusza_kolumny() {
    assert_eq!(forward_col(BattleSide::Attacker, 5, 0), 5);
    assert_eq!(forward_col(BattleSide::Defender, 5, 0), 5);
}

// --- GroupDoctrine (battleScene.ts:1938) ----------------------------------------------------------------------------

#[test]
fn group_doctrine_piec_wariantow_z_napisu_pina() {
    assert_eq!(
        GroupDoctrine::parse("defensive"),
        Some(GroupDoctrine::Defensive)
    );
    assert_eq!(GroupDoctrine::parse("steady"), Some(GroupDoctrine::Steady));
    assert_eq!(
        GroupDoctrine::parse("aggressive"),
        Some(GroupDoctrine::Aggressive)
    );
    assert_eq!(
        GroupDoctrine::parse("skirmish"),
        Some(GroupDoctrine::Skirmish)
    );
    assert_eq!(GroupDoctrine::parse("manual"), Some(GroupDoctrine::Manual));
}

#[test]
fn group_doctrine_nieznany_napis_to_brak() {
    assert_eq!(GroupDoctrine::parse(""), None);
    assert_eq!(GroupDoctrine::parse("Defensive"), None);
    assert_eq!(GroupDoctrine::parse("attack"), None);
}

// --- Wartości domyślne pól stanu (pin spawn battleScene.ts:4555-4576) ----------------------------------------------

#[test]
fn domyslne_pola_doktryny_zgodne_z_pinem() {
    let body = ProdBody::new(
        [vec![unit(true, 0)], vec![unit(false, 67)]],
        scene(),
        SequenceRolls::new(Vec::new()),
    );
    let atk = body.doctrine(UnitRef {
        side: BattleSide::Attacker,
        idx: 0,
    });
    // shootingEnabled: true (battleScene.ts:4573; sprawdzane jako `!== false` w :6241).
    assert!(atk.shooting_enabled);
    // unitDoctrine: null -> None (battleScene.ts:4576).
    assert_eq!(atk.unit_doctrine, None);
    // groupId: null -> None (battleScene.ts:4574).
    assert_eq!(atk.group_id, None);
    // rangedKite: true (battleScene.ts:4572).
    assert!(atk.ranged_kite);
    // lastAutoMoveFrom: brak (battleScene.ts:1980, pole opcjonalne).
    assert_eq!(atk.last_auto_move_from, None);
    // antiCavSpear: bez klasy false (battleScene.ts:4558 wyliczane z klasy przy spawnie).
    assert!(!atk.anti_cav_spear);
    // unitTargetPriorities: brak (battleScene.ts:2045).
    assert_eq!(atk.unit_target_priorities, None);

    // Obrońca: te same wartości domyślne (druga strona, ostatnia kolumna wejściowa nie wpływa na stan doktryny).
    let def = body.doctrine(UnitRef {
        side: BattleSide::Defender,
        idx: 0,
    });
    assert_eq!(def, &ProdDoctrineState::default());
    assert!(def.shooting_enabled);
}

#[test]
fn default_stanu_doktryny_ma_klasy_i_priorytety_zgodne_z_wariantami() {
    // Wariant klasy celu z pinu (`BattleUnitClass`, battleScene.ts:1939) jest dostępny do wpisu priorytetów.
    let st = ProdDoctrineState {
        unit_target_priorities: Some(vec![(
            BattleUnitClass::Mounted,
            vec![BattleUnitClass::Ranged, BattleUnitClass::Melee],
        )]),
        ..ProdDoctrineState::default()
    };
    assert!(st.unit_target_priorities.is_some());
    assert_ne!(st, ProdDoctrineState::default());
}

#[test]
fn domyslne_pola_doktryny_dla_wielu_jednostek_i_pustej_strony() {
    // Długości wektorów doktryny = liczba jednostek każdej strony (także 0 dla pustej strony), każdy element domyślny.
    let body = ProdBody::new(
        [
            vec![unit(true, 0), unit(true, 1), unit(true, 2)],
            Vec::new(),
        ],
        scene(),
        SequenceRolls::new(Vec::new()),
    );
    for idx in 0..3 {
        let st = body.doctrine(UnitRef {
            side: BattleSide::Attacker,
            idx,
        });
        assert_eq!(st, &ProdDoctrineState::default(), "atk idx {idx}");
    }
    assert!(body.doctrine[1].is_empty());
    assert_eq!(body.doctrine[0].len(), 3);
}
