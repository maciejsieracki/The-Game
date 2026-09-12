#[path = "../src/domain/unit_epoch.rs"]
mod unit_epoch;

use unit_epoch::{available_units, Epoch, UnitEpoch};

fn military(id: &str, epoch: Epoch) -> UnitEpoch {
    UnitEpoch::new(id, epoch)
}

#[test]
fn current_and_previous_epochs_are_available() {
    let units = vec![
        military("wojownik", Epoch::Stone),
        military("wlocznik", Epoch::Bronze),
        military("kusznik", Epoch::Iron),
    ];

    let available = available_units(Epoch::Iron, &units);

    assert_eq!(
        available.iter().map(|unit| unit.id()).collect::<Vec<_>>(),
        ["wlocznik", "kusznik"]
    );
}

#[test]
fn units_older_than_the_previous_epoch_are_rejected() {
    let units = vec![
        military("wojownik", Epoch::Stone),
        military("wlocznik", Epoch::Bronze),
    ];

    let available = available_units(Epoch::Iron, &units);

    assert!(available.iter().all(|unit| unit.id() != "wojownik"));
    assert_eq!(available.len(), 1);
}

#[test]
fn scout_is_available_in_every_epoch() {
    let scout = UnitEpoch::new("Zwiadowca", Epoch::Stone);
    let explicit_scout = UnitEpoch::scout("scout", Epoch::Stone);

    assert_eq!(scout.epoch(), Epoch::Stone);
    assert!(scout.is_scout());
    assert!(explicit_scout.is_scout());
    assert!(scout.is_available_in(Epoch::Stone));
    assert!(scout.is_available_in(Epoch::Bronze));
    assert!(scout.is_available_in(Epoch::Iron));
}

#[test]
fn non_scout_from_current_epoch_is_available_but_future_unit_is_not() {
    let current = military("wlocznik", Epoch::Bronze);
    let future = military("kusznik", Epoch::Iron);

    assert!(current.is_available_in(Epoch::Bronze));
    assert!(!future.is_available_in(Epoch::Bronze));
}

#[test]
fn epoch_labels_round_trip_and_reject_unknown_values() {
    for (label, epoch) in [
        ("Kamień", Epoch::Stone),
        ("Brąz", Epoch::Bronze),
        ("Żelazo", Epoch::Iron),
    ] {
        assert_eq!(label.parse::<Epoch>().expect("known epoch"), epoch);
        assert_eq!(epoch.as_str(), label);
    }

    assert!("Nieznana".parse::<Epoch>().is_err());
}
