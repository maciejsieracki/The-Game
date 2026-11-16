//! P4-1H (`R-RUSTPORT-P4-1H-CANCEL-Q2`): `cancel_planned_march` 1:1 z galezia `unitId !== undefined`
//! web `clearPlannedMarch(unitId, force)` (`gra/src/main.ts:31051-31056` @ `07d2fbd72`):
//!
//! ```text
//! if (!force && plannedMarches.get(unitId)?.attackUnitId) return;
//! plannedMarches.delete(unitId);
//! marchAttackTargets.delete(unitId);
//! marchStopNotified.delete(unitId);
//! marchStopDetail.delete(unitId);
//! ```
//!
//! Wektory (a)-(f) na czystej logice `PlayableState::clear_planned_march_for_unit`, (d)/(e)/(g) na
//! komendzie `PlayableGame::cancel_planned_march` i w obu adapterach `bridge.rs`. Wartosci oczekiwane
//! wyprowadzone z kodu pinu (powyzej), nie z uruchomionego webu (NIE_ZMIERZONO, dopuszczalne).
//! Przypadki gry z planami i obca jednostka: `playable.rs`, modul `cancel_planned_march_game_tests`.

#[path = "../src/bridge.rs"]
#[allow(dead_code)]
mod bridge;

use bridge::{CivEngineAdapter, EngineCommand, EnginePort, MockEngineAdapter};
use civ_engine::domain::playable::MovementPoints;
use civ_engine::domain::playable::{PlayableMarchStopReason, PlayablePlannedMarch};
use civ_engine::{
    PlayableError, PlayableGame, PlayableState, PlayableUnit, PlayableUnitKind, PlayerId,
    PositionDto, StartGameParams, UnitId,
};

/// Jednostka gracza ze scenariusza startowego (`STARTING_UNIT_ID`).
const OWN: u64 = 1;
const OWN_B: u64 = 2;
const OWN_C: u64 = 3;
const ENEMY: u64 = 77;

fn march(unit: u64, q: i32, r: i32, attack: Option<u64>) -> PlayablePlannedMarch {
    PlayablePlannedMarch {
        unit_id: UnitId::new(unit),
        dest_q: q,
        dest_r: r,
        attack_unit_id: attack.map(UnitId::new),
        general_target_id: None,
    }
}

fn unit(id: u64, owner: u64) -> PlayableUnit {
    PlayableUnit {
        id: UnitId::new(id),
        owner_id: PlayerId::new(owner),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(2, 1),
        movement: MovementPoints::from(1_u8),
        movement_max: MovementPoints::from(1_u8),
        selected: false,
    }
}

/// Stan z planami trzech jednostek; `OWN` ma plan z atakiem lub bez, wpisy we wszystkich 4 mapach.
fn state_with_plans(own_attack: Option<u64>) -> PlayableState {
    build_state(Some(own_attack))
}

/// Oczekiwany stan po usunieciu wpisow `OWN` (web `Map.delete` x4, `main.ts:31053-31056`),
/// zbudowany NIEZALEZNIE od kodu produkcyjnego: ten sam fikstur, w ktorym wpisow `OWN` po prostu
/// nigdy nie wstawiono (jednostka `OWN` nadal istnieje w `units`).
fn expected_without_own() -> PlayableState {
    build_state(None)
}

/// `own`: `Some(attack)` = wstaw wpisy `OWN` do 4 map; `None` = pomin wszystkie wpisy `OWN`.
fn build_state(own: Option<Option<u64>>) -> PlayableState {
    let mut state = PlayableGame::new(StartGameParams::default())
        .expect("scenariusz startowy")
        .state()
        .clone();
    state.units.push(unit(OWN_B, 1));
    state.units.push(unit(OWN_C, 1));
    state.units.push(unit(ENEMY, 2));
    state.planned_marches = vec![march(OWN_C, 7, 3, None)];
    if let Some(own_attack) = own {
        state.planned_marches.push(march(OWN, 4, 2, own_attack));
    }
    state.planned_marches.push(march(OWN_B, 5, 5, Some(ENEMY)));
    if let Some(Some(target)) = own {
        state
            .march_attack_targets
            .insert(UnitId::new(OWN), UnitId::new(target));
    }
    state
        .march_attack_targets
        .insert(UnitId::new(OWN_B), UnitId::new(ENEMY));
    let ids: &[u64] = if own.is_some() {
        &[OWN, OWN_B, OWN_C]
    } else {
        &[OWN_B, OWN_C]
    };
    for &id in ids {
        state
            .march_stop_notified
            .insert(UnitId::new(id), PlayableMarchStopReason::Obstacle);
        state
            .march_stop_detail
            .insert(UnitId::new(id), format!("Wstrzymano {id}"));
    }
    state
}

fn has_entries(state: &PlayableState, id: u64) -> [bool; 4] {
    let id = UnitId::new(id);
    [
        state.planned_marches.iter().any(|plan| plan.unit_id == id),
        state.march_attack_targets.contains_key(&id),
        state.march_stop_notified.contains_key(&id),
        state.march_stop_detail.contains_key(&id),
    ]
}

fn json(state: &PlayableState) -> String {
    serde_json::to_string(state).expect("serializacja stanu")
}

// (a) force=false + plan z attackUnitId -> return, stan bajt-w-bajt bez zmian (main.ts:31052).
#[test]
fn a_no_force_keeps_attack_plan_byte_for_byte() {
    let before = state_with_plans(Some(ENEMY));
    let mut state = before.clone();
    state.clear_planned_march_for_unit(UnitId::new(OWN), false);
    assert_eq!(state, before);
    assert_eq!(json(&state), json(&before), "bajt-w-bajt");
    assert_eq!(has_entries(&state, OWN), [true; 4]);
}

// (b) force=false bez ataku -> 4 mapy wyczyszczone dla tej jednostki (main.ts:31053-31056).
#[test]
fn b_no_force_without_attack_clears_four_maps() {
    let before = state_with_plans(None);
    assert_eq!(has_entries(&before, OWN), [true, false, true, true]);
    let mut state = before.clone();
    state.clear_planned_march_for_unit(UnitId::new(OWN), false);
    assert_eq!(has_entries(&state, OWN), [false; 4]);
    assert_eq!(state, expected_without_own());
}

// (c) force=true z atakiem -> wyczyszczone (galaz `!force` nie blokuje).
#[test]
fn c_force_clears_attack_plan() {
    let mut state = state_with_plans(Some(ENEMY));
    state.clear_planned_march_for_unit(UnitId::new(OWN), true);
    assert_eq!(has_entries(&state, OWN), [false; 4]);
    assert_eq!(state, expected_without_own());
}

// (c') force=true bez ataku -> tez wyczyszczone.
#[test]
fn c_force_clears_plain_plan() {
    let mut state = state_with_plans(None);
    state.clear_planned_march_for_unit(UnitId::new(OWN), true);
    assert_eq!(state, expected_without_own());
}

// (d) brak planu -> bez zmian (Map.delete brakujacego klucza); komenda -> Ok.
#[test]
fn d_no_plan_is_ok_without_changes() {
    for force in [false, true] {
        let mut game = PlayableGame::new(StartGameParams::default()).expect("scenariusz");
        let before = game.state().clone();
        assert_eq!(game.cancel_planned_march(OWN, force), Ok(()));
        assert_eq!(game.state(), &before);
        assert_eq!(json(game.state()), json(&before));
    }
    // Wpisy powiadomien bez planu (web: osobne mapy) tez sa czyszczone - delete jest bezwarunkowy.
    let mut state = state_with_plans(None);
    state
        .planned_marches
        .retain(|plan| plan.unit_id != UnitId::new(OWN));
    state.clear_planned_march_for_unit(UnitId::new(OWN), false);
    assert_eq!(state, expected_without_own());
    // Jednostka bez zadnego wpisu: stan identyczny.
    let mut state = state_with_plans(None);
    state.units.push(unit(9, 1));
    let before = state.clone();
    state.clear_planned_march_for_unit(UnitId::new(9), false);
    assert_eq!(state, before);
}

// (e) podwojne wywolanie -> drugie bez zmian (i Ok na komendzie).
#[test]
fn e_double_call_is_idempotent() {
    for force in [false, true] {
        let mut state = state_with_plans(None);
        state.clear_planned_march_for_unit(UnitId::new(OWN), force);
        let after_first = state.clone();
        state.clear_planned_march_for_unit(UnitId::new(OWN), force);
        assert_eq!(state, after_first);
    }
    let mut game = PlayableGame::new(StartGameParams::default()).expect("scenariusz");
    assert_eq!(game.cancel_planned_march(OWN, true), Ok(()));
    let after_first = game.state().clone();
    assert_eq!(game.cancel_planned_march(OWN, true), Ok(()));
    assert_eq!(game.state(), &after_first);
}

// (f) inne jednostki z planami nietkniete, kolejnosc `planned_marches` zachowana.
#[test]
fn f_other_units_untouched_and_order_kept() {
    for (own_attack, force) in [(None, false), (Some(ENEMY), true), (None, true)] {
        let mut state = state_with_plans(own_attack);
        state.clear_planned_march_for_unit(UnitId::new(OWN), force);
        assert_eq!(
            state.planned_marches,
            vec![march(OWN_C, 7, 3, None), march(OWN_B, 5, 5, Some(ENEMY))],
            "kolejnosc web Map po delete"
        );
        assert_eq!(has_entries(&state, OWN_B), [true; 4]);
        assert_eq!(has_entries(&state, OWN_C), [true, false, true, true]);
    }
    // Usuniecie z poczatku i konca wektora.
    let mut state = state_with_plans(None);
    state.clear_planned_march_for_unit(UnitId::new(OWN_C), false);
    assert_eq!(
        state.planned_marches,
        vec![march(OWN, 4, 2, None), march(OWN_B, 5, 5, Some(ENEMY))]
    );
    state.clear_planned_march_for_unit(UnitId::new(OWN_B), true);
    assert_eq!(state.planned_marches, vec![march(OWN, 4, 2, None)]);
}

// (g) nieznana jednostka -> Err(UnitNotFound), stan bez zmian (decyzja techniczna REJESTR-RUST 15.11).
// Obca jednostka (UnitNotOwned) wymaga wstawienia jednostki do `PlayableGame`: `playable.rs`,
// `cancel_planned_march_game_tests::foreign_and_unknown_units_are_rejected_without_changes`.
#[test]
fn g_unknown_unit_is_rejected_without_changes() {
    for force in [false, true] {
        let mut game = PlayableGame::new(StartGameParams::default()).expect("scenariusz");
        let before = game.state().clone();
        assert_eq!(
            game.cancel_planned_march(999_999, force),
            Err(PlayableError::UnitNotFound(999_999))
        );
        assert_eq!(game.state(), &before);
    }
}

// Mutacja „pomin warunek attack” jest wykrywana przez (a) i przez
// `playable.rs::cancel_planned_march_game_tests` (wynik mutacji w raportach 01/02a).

// Kontrakt bridge: ten sam w obu adapterach.
#[test]
fn bridge_adapters_share_the_contract() {
    let create = EngineCommand::CreateSession {
        params: StartGameParams::default(),
    };
    let mut civ = CivEngineAdapter::default();
    let mut mock = MockEngineAdapter::default();
    let civ_start = civ.execute(create.clone()).expect("civ create");
    let mock_start = mock.execute(create).expect("mock create");
    assert_eq!(civ_start, mock_start);

    for force in [false, true] {
        let ok = EngineCommand::CancelPlannedMarch {
            unit_id: OWN,
            force,
        };
        assert_eq!(civ.execute(ok.clone()).expect("civ ok"), civ_start);
        assert_eq!(mock.execute(ok).expect("mock ok"), mock_start);

        let unknown = EngineCommand::CancelPlannedMarch {
            unit_id: 999_999,
            force,
        };
        let civ_err = civ.execute(unknown.clone()).expect_err("civ unknown");
        let mock_err = mock.execute(unknown).expect_err("mock unknown");
        assert_eq!(civ_err, mock_err);
        assert_eq!(civ_err.message, "unit 999999 does not exist");
        assert_eq!(civ.state(), &civ_start);
        assert_eq!(mock.state(), &mock_start);
    }
}

#[test]
fn mock_rejects_cancel_before_session() {
    let mut mock = MockEngineAdapter::default();
    let before = mock.state().clone();
    let error = mock
        .execute(EngineCommand::CancelPlannedMarch {
            unit_id: OWN,
            force: false,
        })
        .expect_err("brak sesji");
    assert_eq!(error.message, "create session before cancelling a march");
    assert_eq!(mock.state(), &before);
}

#[test]
fn command_serde_shape() {
    let command = EngineCommand::CancelPlannedMarch {
        unit_id: 5,
        force: true,
    };
    let value = serde_json::to_value(&command).expect("json");
    assert_eq!(
        value,
        serde_json::json!({"kind": "cancel_planned_march", "unit_id": 5, "force": true})
    );
    let back: EngineCommand = serde_json::from_value(value).expect("odczyt");
    assert_eq!(back, command);
}
