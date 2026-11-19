//! P4-1I5a (`R-RUSTPORT-P4-1I5A-BATTLE-ACTIONS-MOVE-SHOT`, #370): `actions_to_dto` dla [`BattleAction::Move`] i
//! [`BattleAction::Shot`] (D-WIR-6, D-WIR-7). Pin `07d2fbd72`, `gra/src/battle/battleScene.ts`: `_doMove` `:8714-8776`
//! (`ru.q = col; ru.r = row` `:8731`, `_updateFacing` `:8750`, `const t0 = this._now()` `:8752`, `MOVE_STEP_MS` `:1010`),
//! `_doRangedAttack` `:9179-9235` (zwrot `:9182-9184`, pocisk `:9218-9221`, `_schedule(RANGED_FLY_MS, …)` `:9224`).
//!
//! Zgodność z wektorami pinu (kroki i strzały z `ProdBody` na wektorach K5LOOP-CLOSE r2/r3/r4) sprawdzają testy
//! `move_dto_zgodne_z_wektorami` (r2), `strzal_i_ruch_dto_zgodne_z_wektorami` (r3) i
//! `move_i_shot_dto_1do1_w_wektorach_r4` (r4). Ten plik: przypadki brzegowe konwersji (id z rosteru obu stron, kolejność,
//! zakres `i32`, walidacja listy).

use std::collections::BTreeSet;

use civ_engine::domain::siege_tactics_actions::{
    actions_to_dto, ActionError, BattleAction, TimedAction,
};
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{MOVE_STEP_MS, RANGED_FLY_MS};
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use civ_view_model::battle::{BattleActionDto, BattleActionKindDto as K};
use civ_view_model::ids::UnitId;
use civ_view_model::ViewError;

fn cu() -> CombatUnit {
    CombatUnit {
        hp: 100.0,
        morale: 100.0,
        flee_morale: 0.0,
        move_left: 3.0,
        never_rout: false,
        dead: false,
        fading_out: false,
        routed: false,
        removed: false,
        acted: false,
    }
}

/// Atakujący: id 11, 12; obrońcy: id 21, 22 (id różne od indeksów, żeby pomylenie strony/indeksu było widoczne).
fn state() -> TurnSeqState {
    TurnSeqState {
        atk: vec![SeqUnit { id: 11, c: cu() }, SeqUnit { id: 12, c: cu() }],
        def: vec![SeqUnit { id: 21, c: cu() }, SeqUnit { id: 22, c: cu() }],
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

fn atk(idx: usize) -> UnitRef {
    UnitRef {
        side: BattleSide::Attacker,
        idx,
    }
}

fn def(idx: usize) -> UnitRef {
    UnitRef {
        side: BattleSide::Defender,
        idx,
    }
}

fn uid(v: u64) -> UnitId {
    UnitId::try_new(v).expect("id")
}

fn ta(t0: f64, action: BattleAction) -> TimedAction {
    TimedAction { t0, action }
}

fn mv(unit: UnitRef, from: (i64, i64), to: (i64, i64), t0: f64) -> TimedAction {
    ta(
        t0,
        BattleAction::Move {
            unit,
            from,
            to,
            arrive_at: t0 + MOVE_STEP_MS,
        },
    )
}

fn shot(attacker: UnitRef, target: UnitRef, t0: f64) -> TimedAction {
    ta(
        t0,
        BattleAction::Shot {
            attacker,
            target,
            land_at: t0 + RANGED_FLY_MS,
        },
    )
}

/// Sekwencja jak w pinie: zwrot + krok obrońcy (`:8750-8752`), zwrot + strzał atakującego (`:9182-9184`, `:9218`),
/// etykieta obrażeń w chwili trafienia (`:9226`).
#[test]
fn ruch_i_strzal_na_dto_1do1() {
    let st = state();
    let actions = vec![
        ta(
            1000.0,
            BattleAction::Facing {
                unit: def(1),
                dir: 3.0,
            },
        ),
        mv(def(1), (41, 67), (40, 67), 1000.0),
        ta(
            1240.0,
            BattleAction::Facing {
                unit: atk(0),
                dir: 1.0,
            },
        ),
        shot(atk(0), def(1), 1240.0),
        ta(
            1620.0,
            BattleAction::Damage {
                target: def(1),
                dmg: 4.0,
            },
        ),
    ];
    let dto = actions_to_dto(&actions, &st).expect("dto");
    let want = vec![
        BattleActionDto {
            t0: 1000.0,
            action: K::Facing {
                id: uid(22),
                dir: 3,
            },
        },
        BattleActionDto {
            t0: 1000.0,
            action: K::Move {
                id: uid(22),
                from_col: 41,
                from_row: 67,
                to_col: 40,
                to_row: 67,
                arrive_at: 1240.0,
            },
        },
        BattleActionDto {
            t0: 1240.0,
            action: K::Facing {
                id: uid(11),
                dir: 1,
            },
        },
        BattleActionDto {
            t0: 1240.0,
            action: K::Shot {
                attacker: uid(11),
                target: uid(22),
                land_at: 1620.0,
            },
        },
        BattleActionDto {
            t0: 1620.0,
            action: K::Damage {
                target: uid(22),
                dmg: 4.0,
            },
        },
    ];
    assert_eq!(dto, want);
}

/// Pola kroku nie są zamieniane ani przestawiane (from/to, kolumna/wiersz).
#[test]
fn pola_kroku_bez_zamiany() {
    let st = state();
    let dto = actions_to_dto(&[mv(atk(1), (3, 9), (4, 10), 0.0)], &st).expect("dto");
    assert_eq!(
        dto[0].action,
        K::Move {
            id: uid(12),
            from_col: 3,
            from_row: 9,
            to_col: 4,
            to_row: 10,
            arrive_at: MOVE_STEP_MS,
        }
    );
    // Czas niecałkowity (zegar wirtualny) przechodzi bit w bit.
    let dto = actions_to_dto(&[mv(atk(1), (3, 9), (4, 9), 1777.125)], &st).expect("dto");
    assert_eq!(dto[0].t0.to_bits(), 1777.125_f64.to_bits());
    match dto[0].action {
        K::Move { arrive_at, .. } => assert_eq!(arrive_at.to_bits(), 2017.125_f64.to_bits()),
        ref other => panic!("{other:?}"),
    }
}

/// Współrzędna poza `i32` = jawny błąd [`ActionError::Cell`], bez obcięcia.
#[test]
fn wspolrzedna_poza_i32_to_blad() {
    let st = state();
    let big = i64::from(i32::MAX) + 1;
    for (from, to, bad) in [
        ((big, 0), (0, 0), big),
        ((0, big), (0, 0), big),
        ((0, 0), (big, 0), big),
        ((0, 0), (0, -big - 1), -big - 1),
    ] {
        assert_eq!(
            actions_to_dto(&[mv(atk(0), from, to, 0.0)], &st),
            Err(ActionError::Cell(bad))
        );
    }
    // Granica `i32` jeszcze mieści się.
    let edge = i64::from(i32::MIN);
    assert!(actions_to_dto(&[mv(atk(0), (edge, 0), (0, 0), 0.0)], &st).is_ok());
}

/// Jednostka spoza rosteru (krok i strzał, w tym cel) = [`ActionError::UnitOutOfRange`].
#[test]
fn jednostka_spoza_rosteru() {
    let st = state();
    assert_eq!(
        actions_to_dto(&[mv(atk(5), (1, 1), (2, 1), 0.0)], &st),
        Err(ActionError::UnitOutOfRange(atk(5)))
    );
    assert_eq!(
        actions_to_dto(&[shot(atk(0), def(9), 0.0)], &st),
        Err(ActionError::UnitOutOfRange(def(9)))
    );
    assert_eq!(
        actions_to_dto(&[shot(def(7), atk(0), 0.0)], &st),
        Err(ActionError::UnitOutOfRange(def(7)))
    );
}

fn invalid_field(r: Result<Vec<BattleActionDto>, ActionError>) -> String {
    match r {
        Err(ActionError::Invalid(
            ViewError::NonFinite { field }
            | ViewError::OutOfRange { field, .. }
            | ViewError::LengthMismatch { field, .. },
        )) => field,
        other => panic!("oczekiwany Invalid, jest {other:?}"),
    }
}

/// Walidacja listy (`validate_actions`) obejmuje nowe warianty: krok w miejscu, koniec przed startem, NaN, strzał w
/// samego siebie (ten sam `UnitId` po obu stronach to też błąd `DuplicateId` rosteru).
#[test]
fn walidacja_listy_z_ruchem_i_strzalem() {
    let st = state();
    assert!(
        invalid_field(actions_to_dto(&[mv(atk(0), (2, 2), (2, 2), 0.0)], &st))
            .starts_with("actions[0].action.to")
    );
    let early = ta(
        100.0,
        BattleAction::Move {
            unit: atk(0),
            from: (1, 1),
            to: (2, 1),
            arrive_at: 99.0,
        },
    );
    assert_eq!(
        invalid_field(actions_to_dto(&[early], &st)),
        "actions[0].action.arriveAt"
    );
    let nan = ta(
        0.0,
        BattleAction::Shot {
            attacker: atk(0),
            target: def(0),
            land_at: f64::NAN,
        },
    );
    assert_eq!(
        invalid_field(actions_to_dto(&[nan], &st)),
        "actions[0].action.landAt"
    );
    let back = ta(
        10.0,
        BattleAction::Shot {
            attacker: atk(0),
            target: def(0),
            land_at: 9.0,
        },
    );
    assert_eq!(
        invalid_field(actions_to_dto(&[back], &st)),
        "actions[0].action.landAt"
    );
    // Kolejność czasu: krok przed wcześniejszą akcją.
    let list = vec![
        shot(atk(0), def(0), 500.0),
        mv(def(0), (1, 1), (2, 1), 400.0),
    ];
    assert_eq!(invalid_field(actions_to_dto(&list, &st)), "actions[1].t0");
    // Strzelec i cel z tym samym id (roster z duplikatem) = `DuplicateId` przed konwersją.
    let mut dup = state();
    dup.def[0].id = 11;
    assert_eq!(
        actions_to_dto(&[shot(atk(0), def(0), 0.0)], &dup),
        Err(ActionError::DuplicateId(11))
    );
}

/// Warianty I5b nadal są jawnym błędem (nie cichym pominięciem), także gdy lista zawiera wcześniej `Move`/`Shot`.
#[test]
fn warianty_i5b_nadal_bledem_po_ruchu() {
    let st = state();
    let list = vec![
        mv(atk(0), (1, 1), (2, 1), 0.0),
        shot(atk(1), def(0), 10.0),
        ta(20.0, BattleAction::Leave { unit: atk(0) }),
    ];
    assert_eq!(
        actions_to_dto(&list, &st),
        Err(ActionError::LeaveWithoutDto(atk(0)))
    );
}
