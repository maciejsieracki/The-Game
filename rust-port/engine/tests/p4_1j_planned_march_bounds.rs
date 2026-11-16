//! P4-1J (R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1, pomiary): granice zakresu `i32` celu marszu.
//!
//! Web trzyma kazda skonczona liczbe (`Number.isFinite`, `planned-march.ts:460`); `PlayableState`
//! trzyma cel jako `i32`. Wartosci `i32::MIN` i `i32::MAX` sa wyrazalne i musza przejsc zapis i odczyt
//! bez zmian; o jeden poza zakresem trafiaja do `PlannedMarchRestoreReport::unrepresentable`.
//! Test domyka mutanty N7/N8 z raportu pomiarow (granice `js_i32` wykluczone, a testy zielone).

#[path = "../src/domain/events.rs"]
#[allow(dead_code)]
mod events;

#[path = "../src/domain/save_load.rs"]
#[allow(dead_code, unused_imports)]
mod save_load;

use civ_engine::domain::playable::MovementPoints;
use civ_engine::domain::playable::PlayablePlannedMarch;
use civ_engine::{PlayableState, PlayableUnit, PlayableUnitKind, PlayerId, PositionDto, UnitId};
use save_load::{
    playable_planned_marches_to_save, restore_playable_planned_marches, SavedPlannedMarch,
};
use serde_json::Number;

fn unit(id: u64) -> PlayableUnit {
    PlayableUnit {
        id: UnitId::new(id),
        owner_id: PlayerId::new(1),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(0, 0),
        movement: MovementPoints::from(1_u8),
        movement_max: MovementPoints::from(1_u8),
        selected: false,
    }
}

fn march(id: u64, q: i32, r: i32) -> PlayablePlannedMarch {
    PlayablePlannedMarch {
        unit_id: UnitId::new(id),
        dest_q: q,
        dest_r: r,
        attack_unit_id: None,
        general_target_id: None,
    }
}

fn saved(id: &str, q: i64, r: i64) -> SavedPlannedMarch {
    SavedPlannedMarch {
        unit_id: id.to_owned(),
        dest_q: Some(Number::from(q)),
        dest_r: Some(Number::from(r)),
        attack_unit_id: None,
        general_target_id: None,
    }
}

#[test]
fn i32_bounds_roundtrip_and_one_past_is_reported() {
    let max = i64::from(i32::MAX);
    let min = i64::from(i32::MIN);
    let mut state = PlayableState::empty();
    state.units = (1..=8).map(unit).collect();
    let list = [
        saved("1", max, 1),
        saved("2", min, 1),
        saved("3", 1, max),
        saved("4", 1, min),
        saved("5", max + 1, 1),
        saved("6", min - 1, 1),
        saved("7", 1, max + 1),
        saved("8", 1, min - 1),
    ];
    let report = restore_playable_planned_marches(&mut state, &list, None, PlayerId::new(1));
    assert_eq!(report.unrepresentable, vec!["5", "6", "7", "8"]);
    let expected = vec![
        march(1, i32::MAX, 1),
        march(2, i32::MIN, 1),
        march(3, 1, i32::MAX),
        march(4, 1, i32::MIN),
    ];
    assert_eq!(state.planned_marches, expected);

    // Zapis tych samych planow: granice zapisane jako liczby calkowite JSON, bez utraty.
    let (planned, auto) = playable_planned_marches_to_save(&expected);
    let coords: Vec<(Option<Number>, Option<Number>)> = planned
        .iter()
        .map(|m| (m.dest_q.clone(), m.dest_r.clone()))
        .collect();
    assert_eq!(
        coords,
        vec![
            (Some(Number::from(max)), Some(Number::from(1))),
            (Some(Number::from(min)), Some(Number::from(1))),
            (Some(Number::from(1)), Some(Number::from(max))),
            (Some(Number::from(1)), Some(Number::from(min))),
        ]
    );
    let auto = auto.expect("autoMarch = pierwszy wpis");
    assert_eq!(auto.dest_q, Some(Number::from(max)));

    // Odczyt zapisu daje ten sam stan (round-trip na granicach).
    let mut again = PlayableState::empty();
    again.units = (1..=8).map(unit).collect();
    let report = restore_playable_planned_marches(&mut again, &planned, None, PlayerId::new(1));
    assert_eq!(report, Default::default());
    assert_eq!(again.planned_marches, expected);
}
