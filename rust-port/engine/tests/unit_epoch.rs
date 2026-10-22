#[path = "../src/domain/unit_epoch.rs"]
mod unit_epoch;

use unit_epoch::{
    available_units, civ_entry_epoch, civ_ids_available_at_game_epoch,
    format_civ_entry_epoch_label, game_epoch_hud_label, game_epoch_index,
    is_civ_available_at_game_epoch, parse_game_epoch_id, CivEntryRow, Epoch, UnitEpoch,
    GAME_EPOCH_ORDER,
};

/// P6.1 r2: harness włącza ten plik przez `#[path]`; wywołuje cały publiczny API wejścia cywilizacji
/// (bez `allow(dead_code)`). Pełne wektory z weba: `tests/p6_1_civ_entry_epoch.rs`.
#[test]
fn p6_1_civ_entry_api_is_exercised() {
    assert_eq!(GAME_EPOCH_ORDER.len(), 3);
    assert_eq!(parse_game_epoch_id("braz"), Some(Epoch::Bronze));
    assert_eq!(game_epoch_index("zelazo"), 2);
    assert_eq!(
        civ_entry_epoch(None, Some(&["zelazo", "braz"])),
        Epoch::Bronze
    );
    let row = CivEntryRow {
        ikona_id: Some("X"),
        epoka_wejscia: Some("zelazo"),
        epoki_startowe: None,
    };
    assert!(!is_civ_available_at_game_epoch(row, "braz"));
    assert!(is_civ_available_at_game_epoch(row, "zelazo"));
    assert_eq!(civ_ids_available_at_game_epoch(&[row], "zelazo"), ["X"]);
    assert_eq!(
        format_civ_entry_epoch_label(row),
        "Wejście: Żelazo · dostępne: Żelazo"
    );
    assert_eq!(game_epoch_hud_label(2.5), "Epoka żelaza");
}

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
