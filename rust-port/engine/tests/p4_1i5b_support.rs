//! P4-1I5b (`R-RUSTPORT-P4-1I5B-BATTLE-ACTIONS-SIEGE`): wspólny sprawdzian 1:1 akcji silnika i DTO, włączany do testów
//! wektorów (`#[path = "p4_1i5b_support.rs"] mod support;`). Oczekiwany DTO jest budowany NIEZALEŻNIE od
//! `actions_to_dto` (pole po polu, wyczerpujący `match` po [`BattleAction`] bez `_ =>`), więc zamiana pól, zły wariant
//! albo pominięta akcja w konwersji daje rozbieżność. Czasy z pinu: `Move.arriveAt = t0 + 240`, `Shot.landAt = t0 +
//! 380`, `Boulder.landAt = t0 + 700`, `Ram.until = t0 + 320` (`battleScene.ts:1010`, `:1012`, `:7555`, `:7340`).
//! Plik jest też osobnym crate'em testowym (własny test samosprawdzenia na końcu).

use std::collections::BTreeMap;

use civ_engine::domain::siege_tactics_actions::{
    actions_to_dto, winner_dto, Actor, BattleAction, TimedAction,
};
use civ_engine::domain::siege_tactics_atk_b::{RAM_ANIM_MS, WALL_HIT_FLY_MS};
use civ_engine::domain::siege_tactics_blow::ClashTag;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{MOVE_STEP_MS, RANGED_FLY_MS};
use civ_engine::domain::siege_tactics_turnseq::{TurnSeqState, UnitRef};
use civ_view_model::battle::{
    BattleActionDto, BattleActionKindDto as K, BattleActorDto, BattleClashTagDto,
};
use civ_view_model::ids::UnitId;

/// Id jednostki z rosteru (`st.atk` / `st.def`).
pub fn dto_id(st: &TurnSeqState, u: UnitRef) -> UnitId {
    let list = match u.side {
        BattleSide::Attacker => &st.atk,
        BattleSide::Defender => &st.def,
    };
    UnitId::try_new(list[u.idx].id).expect("id")
}

fn cell(c: (i64, i64)) -> (i32, i32) {
    (
        i32::try_from(c.0).expect("kolumna i32"),
        i32::try_from(c.1).expect("wiersz i32"),
    )
}

fn row(r: i64) -> i32 {
    i32::try_from(r).expect("wiersz i32")
}

/// Oczekiwany DTO akcji (specyfikacja pola po polu, bez użycia `actions_to_dto`).
pub fn expected_kind(st: &TurnSeqState, a: &BattleAction) -> K {
    let id = |u: UnitRef| dto_id(st, u);
    match a {
        BattleAction::Turn { round_no } => K::Turn {
            round_no: *round_no,
        },
        BattleAction::Facing { unit, dir } => K::Facing {
            id: id(*unit),
            #[allow(clippy::cast_possible_truncation)]
            dir: *dir as i32,
        },
        BattleAction::Melee {
            attacker,
            target,
            hit_at,
        } => K::Melee {
            attacker: id(*attacker),
            target: id(*target),
            hit_at: *hit_at,
        },
        BattleAction::TowerShot {
            row: r,
            target,
            land_at,
        } => K::TowerShot {
            row: row(*r),
            target: id(*target),
            land_at: *land_at,
        },
        BattleAction::Damage { target, dmg } => K::Damage {
            target: id(*target),
            dmg: *dmg,
        },
        BattleAction::Clash {
            attacker,
            target,
            dmg,
            tag,
            text,
        } => K::Clash {
            attacker: match attacker {
                Actor::Unit(u) => BattleActorDto::Unit { id: id(*u) },
                Actor::Tower(r) => BattleActorDto::Tower { row: row(*r) },
            },
            target: id(*target),
            dmg: *dmg,
            tag: match tag {
                ClashTag::Plain => BattleClashTagDto::Plain,
                ClashTag::Padl => BattleClashTagDto::Padl,
                ClashTag::Rout => BattleClashTagDto::Rout,
            },
            text: text.clone(),
        },
        BattleAction::Rout { unit } => K::Rout { id: id(*unit) },
        BattleAction::Kill { unit } => K::Kill { id: id(*unit) },
        BattleAction::Log { text } => K::Log { text: text.clone() },
        BattleAction::End { winner } => K::End {
            winner: winner_dto(*winner),
        },
        BattleAction::Move {
            unit,
            from,
            to,
            arrive_at,
        } => {
            let (fc, fr) = cell(*from);
            let (tc, tr) = cell(*to);
            K::Move {
                id: id(*unit),
                from_col: fc,
                from_row: fr,
                to_col: tc,
                to_row: tr,
                arrive_at: *arrive_at,
            }
        }
        BattleAction::Shot {
            attacker,
            target,
            land_at,
        } => K::Shot {
            attacker: id(*attacker),
            target: id(*target),
            land_at: *land_at,
        },
        BattleAction::Leave { unit } => K::Leave { id: id(*unit) },
        BattleAction::Shaken {
            unit,
            fallen,
            morale,
        } => K::Shaken {
            id: id(*unit),
            fallen: id(*fallen),
            morale: *morale,
        },
        BattleAction::ClimbWall { unit, from, to } => {
            let (fc, fr) = cell(*from);
            let (tc, tr) = cell(*to);
            K::ClimbWall {
                id: id(*unit),
                from_col: fc,
                from_row: fr,
                to_col: tc,
                to_row: tr,
            }
        }
        BattleAction::Boulder {
            unit,
            row: r,
            land_at,
        } => K::Boulder {
            id: id(*unit),
            row: row(*r),
            land_at: *land_at,
        },
        BattleAction::WallDamage {
            row: r,
            dmg,
            hp_after,
        } => K::WallDamage {
            row: row(*r),
            dmg: *dmg,
            hp_after: *hp_after,
        },
        BattleAction::Ram { unit, until } => K::Ram {
            id: id(*unit),
            until: *until,
        },
        BattleAction::GateDamage { dmg, hp_after } => K::GateDamage {
            dmg: *dmg,
            hp_after: *hp_after,
        },
        BattleAction::WallBreach { row: r } => K::WallBreach { row: row(*r) },
        BattleAction::GateBreach => K::GateBreach {},
        BattleAction::TowerDestroyed { row: r } => K::TowerDestroyed { row: row(*r) },
        BattleAction::LeaveField { unit, from, to } => {
            let (fc, fr) = cell(*from);
            let (tc, tr) = cell(*to);
            K::LeaveField {
                id: id(*unit),
                from_col: fc,
                from_row: fr,
                to_col: tc,
                to_row: tr,
            }
        }
    }
}

/// Nazwa wariantu (licznik pokrycia).
pub fn kind_name(a: &BattleAction) -> &'static str {
    match a {
        BattleAction::Turn { .. } => "Turn",
        BattleAction::Facing { .. } => "Facing",
        BattleAction::Melee { .. } => "Melee",
        BattleAction::TowerShot { .. } => "TowerShot",
        BattleAction::Damage { .. } => "Damage",
        BattleAction::Clash { .. } => "Clash",
        BattleAction::Rout { .. } => "Rout",
        BattleAction::Kill { .. } => "Kill",
        BattleAction::Log { .. } => "Log",
        BattleAction::End { .. } => "End",
        BattleAction::Move { .. } => "Move",
        BattleAction::Shot { .. } => "Shot",
        BattleAction::Leave { .. } => "Leave",
        BattleAction::Shaken { .. } => "Shaken",
        BattleAction::ClimbWall { .. } => "ClimbWall",
        BattleAction::Boulder { .. } => "Boulder",
        BattleAction::WallDamage { .. } => "WallDamage",
        BattleAction::Ram { .. } => "Ram",
        BattleAction::GateDamage { .. } => "GateDamage",
        BattleAction::WallBreach { .. } => "WallBreach",
        BattleAction::GateBreach => "GateBreach",
        BattleAction::TowerDestroyed { .. } => "TowerDestroyed",
        BattleAction::LeaveField { .. } => "LeaveField",
    }
}

/// Czas z pinu, jaki DTO musi nieść względem `t0` (`None` = wariant bez czasu końca).
fn pin_end(d: &BattleActionDto) -> Option<(f64, f64)> {
    match &d.action {
        K::Move { arrive_at, .. } => Some((*arrive_at, d.t0 + MOVE_STEP_MS)),
        K::Shot { land_at, .. } => Some((*land_at, d.t0 + RANGED_FLY_MS)),
        K::Boulder { land_at, .. } => Some((*land_at, d.t0 + WALL_HIT_FLY_MS)),
        K::Ram { until, .. } => Some((*until, d.t0 + RAM_ANIM_MS)),
        _ => None,
    }
}

/// `actions_to_dto` przekłada akcje 1:1 (ta sama kolejność, `t0` bit w bit, każdy wariant pole po polu =
/// [`expected_kind`], liczby bit w bit przez porównanie serializacji JSON), a czasy końca = `t0` + stała pinu.
/// Rozbieżności trafiają do `failures`; zwraca DTO i licznik wariantów.
pub fn check_dto_1to1(
    name: &str,
    actions: &[TimedAction],
    st: &TurnSeqState,
    failures: &mut Vec<String>,
    counts: &mut BTreeMap<&'static str, usize>,
) -> Vec<BattleActionDto> {
    let dto = match actions_to_dto(actions, st) {
        Ok(d) => d,
        Err(e) => {
            failures.push(format!("{name}: actions_to_dto {e:?}"));
            return Vec::new();
        }
    };
    if dto.len() != actions.len() {
        failures.push(format!(
            "{name}: DTO {} != akcje {}",
            dto.len(),
            actions.len()
        ));
        return dto;
    }
    for (k, (a, d)) in actions.iter().zip(&dto).enumerate() {
        *counts.entry(kind_name(&a.action)).or_default() += 1;
        if a.t0.to_bits() != d.t0.to_bits() {
            failures.push(format!("{name}[{k}]: t0 {} != {}", d.t0, a.t0));
        }
        let want = expected_kind(st, &a.action);
        let same = serde_json::to_string(&want).expect("json")
            == serde_json::to_string(&d.action).expect("json")
            && want == d.action;
        if !same {
            failures.push(format!("{name}[{k}]: {:?} -> {:?}", a.action, d.action));
        }
        if let Some((got, pin)) = pin_end(d) {
            if got.to_bits() != pin.to_bits() {
                failures.push(format!(
                    "{name}[{k}]: czas końca {got} != t0 + stała pinu {pin}"
                ));
            }
        }
    }
    dto
}

/// Samosprawdzenie: na rosterze 2 + 2 każdy wariant przechodzi 1:1, a zamiana pól w DTO jest wykrywana.
#[test]
fn support_samosprawdzenie() {
    use civ_engine::domain::siege_tactics_loop::LoopWinner;
    use civ_engine::domain::siege_tactics_turnseq::SeqUnit;
    use civ_engine::domain::siege_tactics_unit::CombatUnit;
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
    let st = TurnSeqState {
        atk: vec![su(1), su(2)],
        def: vec![su(11), su(12)],
        turn_order: Vec::new(),
        turn_idx: 0,
        round_no: 0,
        siege_wall_col: 5,
        manual_mode: false,
        player_side: BattleSide::Attacker,
        finished: false,
        awaiting_orders: false,
        auto_battle_suspended: false,
        busy: false,
        auto_batch_planning: false,
        queued_order_ids: Default::default(),
    };
    let a0 = UnitRef {
        side: BattleSide::Attacker,
        idx: 0,
    };
    let a1 = UnitRef {
        side: BattleSide::Attacker,
        idx: 1,
    };
    let d0 = UnitRef {
        side: BattleSide::Defender,
        idx: 0,
    };
    let d1 = UnitRef {
        side: BattleSide::Defender,
        idx: 1,
    };
    let ta = |t0: f64, action: BattleAction| TimedAction { t0, action };
    let list = vec![
        ta(0.0, BattleAction::Turn { round_no: 1 }),
        ta(0.0, BattleAction::Facing { unit: a0, dir: 1.0 }),
        ta(
            0.0,
            BattleAction::ClimbWall {
                unit: a0,
                from: (3, 7),
                to: (5, 7),
            },
        ),
        ta(
            10.0,
            BattleAction::Boulder {
                unit: a1,
                row: 8,
                land_at: 710.0,
            },
        ),
        ta(
            20.0,
            BattleAction::Ram {
                unit: a1,
                until: 340.0,
            },
        ),
        ta(
            20.0,
            BattleAction::GateDamage {
                dmg: 14.0,
                hp_after: 0.0,
            },
        ),
        ta(20.0, BattleAction::GateBreach),
        ta(
            710.0,
            BattleAction::WallDamage {
                row: 8,
                dmg: 16.0,
                hp_after: 0.0,
            },
        ),
        ta(710.0, BattleAction::TowerDestroyed { row: 8 }),
        ta(710.0, BattleAction::WallBreach { row: 8 }),
        ta(
            710.0,
            BattleAction::LeaveField {
                unit: d0,
                from: (5, 8),
                to: (6, 8),
            },
        ),
        ta(710.0, BattleAction::Kill { unit: d1 }),
        ta(800.0, BattleAction::Leave { unit: d0 }),
        ta(
            800.0,
            BattleAction::Shaken {
                unit: d1,
                fallen: d0,
                morale: 30.0,
            },
        ),
        ta(
            900.0,
            BattleAction::End {
                winner: LoopWinner::Attacker,
            },
        ),
    ];
    let mut failures = Vec::new();
    let mut counts = BTreeMap::new();
    let dto = check_dto_1to1("samo", &list, &st, &mut failures, &mut counts);
    assert!(failures.is_empty(), "{failures:?}");
    assert_eq!(dto.len(), list.len());
    assert_eq!(counts.values().sum::<usize>(), list.len());
    // Oczekiwanie wykrywa zamianę pól (`from`/`to` zejścia z muru).
    let swapped = K::LeaveField {
        id: dto_id(&st, d0),
        from_col: 6,
        from_row: 8,
        to_col: 5,
        to_row: 8,
    };
    assert_ne!(expected_kind(&st, &list[10].action), swapped);
}
