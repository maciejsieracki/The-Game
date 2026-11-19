//! P4-1I5b (`R-RUSTPORT-P4-1I5B-BATTLE-ACTIONS-SIEGE`, #370): `actions_to_dto` dla wariantów oblężenia i ucieczki
//! (`Leave`, `Shaken`, `ClimbWall`, `Boulder`, `WallDamage`, `Ram`, `GateDamage`, `WallBreach`, `GateBreach`,
//! `TowerDestroyed`, `LeaveField`): konwersja 1:1, brak błędów „bez DTO”, błędy zakresu (wiersz/pole poza `i32`,
//! jednostka spoza rosteru) i walidacja listy (`validate_actions`) przenoszona jako `ActionError::Invalid`.

#[path = "p4_1i5b_support.rs"]
mod support;

use std::collections::BTreeMap;

use civ_engine::domain::siege_tactics_actions::{
    actions_to_dto, ActionError, BattleAction, TimedAction,
};
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use civ_view_model::battle::BattleActionKindDto as K;
use civ_view_model::ids::UnitId;
use civ_view_model::ViewError;

fn state() -> TurnSeqState {
    let cu = CombatUnit {
        hp: 10.0,
        morale: 50.0,
        flee_morale: 0.0,
        move_left: 0.0,
        never_rout: false,
        dead: false,
        fading_out: false,
        routed: false,
        removed: false,
        acted: false,
    };
    let su = |id: u64| SeqUnit { id, c: cu };
    TurnSeqState {
        atk: vec![su(7), su(8)],
        def: vec![su(1007), su(1008)],
        turn_order: Vec::new(),
        turn_idx: 0,
        round_no: 0,
        siege_wall_col: 31,
        manual_mode: false,
        player_side: BattleSide::Attacker,
        finished: false,
        awaiting_orders: false,
        auto_battle_suspended: false,
        busy: false,
        auto_batch_planning: false,
        queued_order_ids: Default::default(),
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

fn ta(t0: f64, action: BattleAction) -> TimedAction {
    TimedAction { t0, action }
}

fn uid(v: u64) -> UnitId {
    UnitId::try_new(v).unwrap()
}

/// Sekwencja wyłomu i taranu jak w pinie (kolejność wywołań sceny `_attackWallTile` → `_schedule(700)` →
/// `_breachWallTile`, `_attackGate` → `_animateRam` → `gateHp` → `_breachGate`, `_fleeStep` → ripple).
fn siege_list() -> Vec<TimedAction> {
    vec![
        ta(
            0.0,
            BattleAction::ClimbWall {
                unit: atk(0),
                from: (30, 70),
                to: (31, 70),
            },
        ),
        ta(
            100.0,
            BattleAction::Boulder {
                unit: atk(1),
                row: 72,
                land_at: 800.0,
            },
        ),
        ta(
            200.0,
            BattleAction::Ram {
                unit: atk(1),
                until: 520.0,
            },
        ),
        ta(
            200.0,
            BattleAction::GateDamage {
                dmg: 14.0,
                hp_after: 6.0,
            },
        ),
        ta(
            800.0,
            BattleAction::WallDamage {
                row: 72,
                dmg: 16.0,
                hp_after: 0.0,
            },
        ),
        ta(800.0, BattleAction::TowerDestroyed { row: 72 }),
        ta(800.0, BattleAction::WallBreach { row: 72 }),
        ta(
            800.0,
            BattleAction::LeaveField {
                unit: def(0),
                from: (31, 72),
                to: (32, 73),
            },
        ),
        ta(
            800.0,
            BattleAction::LeaveField {
                unit: def(1),
                from: (31, 72),
                to: (31, 72),
            },
        ),
        ta(900.0, BattleAction::GateBreach),
        ta(1000.0, BattleAction::Leave { unit: def(0) }),
        ta(
            1000.0,
            BattleAction::Shaken {
                unit: def(1),
                fallen: def(0),
                morale: 37.5,
            },
        ),
    ]
}

#[test]
fn wszystkie_warianty_i5b_maja_dto_1do1() {
    let st = state();
    let list = siege_list();
    let mut failures = Vec::new();
    let mut counts = BTreeMap::new();
    let dto = support::check_dto_1to1("i5b", &list, &st, &mut failures, &mut counts);
    assert!(failures.is_empty(), "{failures:?}");
    for k in [
        "Leave",
        "Shaken",
        "ClimbWall",
        "Boulder",
        "WallDamage",
        "Ram",
        "GateDamage",
        "WallBreach",
        "GateBreach",
        "TowerDestroyed",
        "LeaveField",
    ] {
        assert!(counts.get(k).copied().unwrap_or(0) >= 1, "brak {k}");
    }
    // Pola bez zamiany (wartości jawnie, nie przez wspólny helper).
    assert_eq!(
        dto[0].action,
        K::ClimbWall {
            id: uid(7),
            from_col: 30,
            from_row: 70,
            to_col: 31,
            to_row: 70
        }
    );
    assert_eq!(
        dto[1].action,
        K::Boulder {
            id: uid(8),
            row: 72,
            land_at: 800.0
        }
    );
    assert_eq!(
        dto[2].action,
        K::Ram {
            id: uid(8),
            until: 520.0
        }
    );
    assert_eq!(
        dto[3].action,
        K::GateDamage {
            dmg: 14.0,
            hp_after: 6.0
        }
    );
    assert_eq!(
        dto[4].action,
        K::WallDamage {
            row: 72,
            dmg: 16.0,
            hp_after: 0.0
        }
    );
    assert_eq!(dto[5].action, K::TowerDestroyed { row: 72 });
    assert_eq!(dto[6].action, K::WallBreach { row: 72 });
    assert_eq!(
        dto[7].action,
        K::LeaveField {
            id: uid(1007),
            from_col: 31,
            from_row: 72,
            to_col: 32,
            to_row: 73
        }
    );
    assert_eq!(
        dto[8].action,
        K::LeaveField {
            id: uid(1008),
            from_col: 31,
            from_row: 72,
            to_col: 31,
            to_row: 72
        }
    );
    assert_eq!(dto[9].action, K::GateBreach {});
    assert_eq!(dto[10].action, K::Leave { id: uid(1007) });
    assert_eq!(
        dto[11].action,
        K::Shaken {
            id: uid(1008),
            fallen: uid(1007),
            morale: 37.5
        }
    );
    let t0: Vec<f64> = dto.iter().map(|d| d.t0).collect();
    assert_eq!(
        t0,
        vec![0.0, 100.0, 200.0, 200.0, 800.0, 800.0, 800.0, 800.0, 800.0, 900.0, 1000.0, 1000.0]
    );
}

#[test]
fn wiersz_i_pole_poza_i32_to_blad() {
    let st = state();
    let big = i64::from(i32::MAX) + 1;
    let small = i64::from(i32::MIN) - 1;
    for (a, want) in [
        (
            BattleAction::Boulder {
                unit: atk(0),
                row: big,
                land_at: 700.0,
            },
            ActionError::Row(big),
        ),
        (
            BattleAction::WallDamage {
                row: small,
                dmg: 1.0,
                hp_after: 0.0,
            },
            ActionError::Row(small),
        ),
        (BattleAction::WallBreach { row: big }, ActionError::Row(big)),
        (
            BattleAction::TowerDestroyed { row: big },
            ActionError::Row(big),
        ),
    ] {
        assert_eq!(
            actions_to_dto(&[ta(0.0, a.clone())], &st),
            Err(want),
            "{a:?}"
        );
    }
    for k in 0..4 {
        let mut c = [30_i64, 70, 31, 70];
        c[k] = big;
        let climb = BattleAction::ClimbWall {
            unit: atk(0),
            from: (c[0], c[1]),
            to: (c[2], c[3]),
        };
        assert_eq!(
            actions_to_dto(&[ta(0.0, climb)], &st),
            Err(ActionError::Cell(big)),
            "wspinaczka pole {k}"
        );
        let leave = BattleAction::LeaveField {
            unit: def(0),
            from: (c[0], c[1]),
            to: (c[2], c[3]),
        };
        assert_eq!(
            actions_to_dto(&[ta(0.0, leave)], &st),
            Err(ActionError::Cell(big)),
            "zejscie pole {k}"
        );
    }
}

#[test]
fn jednostka_spoza_rosteru_to_blad() {
    let st = state();
    let out = atk(5);
    let outd = def(9);
    for a in [
        BattleAction::Leave { unit: outd },
        BattleAction::Shaken {
            unit: outd,
            fallen: def(0),
            morale: 1.0,
        },
        BattleAction::ClimbWall {
            unit: out,
            from: (30, 1),
            to: (31, 1),
        },
        BattleAction::Boulder {
            unit: out,
            row: 1,
            land_at: 700.0,
        },
        BattleAction::Ram {
            unit: out,
            until: 320.0,
        },
        BattleAction::LeaveField {
            unit: outd,
            from: (31, 1),
            to: (32, 1),
        },
    ] {
        let want = match &a {
            BattleAction::Leave { unit }
            | BattleAction::Shaken { unit, .. }
            | BattleAction::ClimbWall { unit, .. }
            | BattleAction::Boulder { unit, .. }
            | BattleAction::Ram { unit, .. }
            | BattleAction::LeaveField { unit, .. } => *unit,
            other => panic!("{other:?}"),
        };
        assert_eq!(
            actions_to_dto(&[ta(0.0, a.clone())], &st),
            Err(ActionError::UnitOutOfRange(want)),
            "{a:?}"
        );
    }
    // Poległy (`fallen`) spoza rosteru też jest błędem.
    assert_eq!(
        actions_to_dto(
            &[ta(
                0.0,
                BattleAction::Shaken {
                    unit: def(0),
                    fallen: outd,
                    morale: 1.0
                }
            )],
            &st
        ),
        Err(ActionError::UnitOutOfRange(outd))
    );
}

fn invalid_field(r: Result<Vec<civ_view_model::battle::BattleActionDto>, ActionError>) -> String {
    match r {
        Err(ActionError::Invalid(
            ViewError::NonFinite { field }
            | ViewError::OutOfRange { field, .. }
            | ViewError::LengthMismatch { field, .. },
        )) => field,
        other => panic!("oczekiwany Invalid: {other:?}"),
    }
}

#[test]
fn walidacja_listy_przenoszona() {
    let st = state();
    let one = |t0: f64, a: BattleAction| actions_to_dto(&[ta(t0, a)], &st);
    // Czasy: t0 - 1 błąd, t0 poprawne (obie strony nierówności `>= t0`).
    assert_eq!(
        invalid_field(one(
            100.0,
            BattleAction::Ram {
                unit: atk(0),
                until: 99.0
            }
        )),
        "actions[0].action.until"
    );
    one(
        100.0,
        BattleAction::Ram {
            unit: atk(0),
            until: 100.0,
        },
    )
    .unwrap();
    assert_eq!(
        invalid_field(one(
            100.0,
            BattleAction::Boulder {
                unit: atk(0),
                row: 3,
                land_at: 99.0
            }
        )),
        "actions[0].action.landAt"
    );
    assert_eq!(
        invalid_field(one(
            0.0,
            BattleAction::GateDamage {
                dmg: 0.0,
                hp_after: 1.0
            }
        )),
        "actions[0].action.dmg"
    );
    assert_eq!(
        invalid_field(one(
            0.0,
            BattleAction::WallDamage {
                row: 3,
                dmg: 1.0,
                hp_after: -1.0
            }
        )),
        "actions[0].action.hpAfter"
    );
    assert_eq!(
        invalid_field(one(
            0.0,
            BattleAction::Shaken {
                unit: def(0),
                fallen: def(0),
                morale: 1.0
            }
        )),
        "actions[0].action.fallen (!= id)"
    );
    assert_eq!(
        invalid_field(one(
            0.0,
            BattleAction::Shaken {
                unit: def(0),
                fallen: def(1),
                morale: -1.0
            }
        )),
        "actions[0].action.morale"
    );
    assert_eq!(
        invalid_field(one(
            0.0,
            BattleAction::ClimbWall {
                unit: atk(0),
                from: (30, 70),
                to: (31, 71)
            }
        )),
        "actions[0].action.toRow (== fromRow)"
    );
    assert_eq!(
        invalid_field(one(0.0, BattleAction::WallBreach { row: -1 })),
        "actions[0].action.row"
    );
    assert_eq!(
        invalid_field(one(
            0.0,
            BattleAction::LeaveField {
                unit: def(0),
                from: (31, 2),
                to: (-1, 2)
            }
        )),
        "actions[0].action.toCol"
    );
    // Kolejność czasu z nowymi akcjami: cofnięty `t0` = błąd z indeksem.
    let mut list = siege_list();
    list[5].t0 = 799.0;
    assert_eq!(invalid_field(actions_to_dto(&list, &st)), "actions[5].t0");
}
