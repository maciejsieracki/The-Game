//! R-RUSTPORT-P4-1F6: port `gra/src/game/first-player-city.ts` i domkniec `isInStartReveal` /
//! `canFoundPlayerCityAt` (`gra/src/main.ts:12886-12943`) @ `07d2fbd72`.
//! Wartosci oczekiwane wyprowadzone z kodu pinu (NIE_ZMIERZONO w uruchomionym webie, dopuszczalne).

use civ_engine::domain::start_reveal::{
    hex_distance, is_awaiting_first_player_city, is_hex_in_start_reveal,
    validate_first_player_city_placement, PlacementCheck, StartRevealContext,
    FIRST_CITY_START_REVEAL_DENIED,
};

/// `isHexInStartReveal` na granicy promienia: dystans == `startRevealRadius` -> `true`
/// (`first-player-city.ts:32`, `<=`), dystans == promien + 1 -> `false`.
#[test]
fn start_reveal_boundary_is_inclusive() {
    let radius = 3.0;
    let start = Some((2.0, -1.0));
    // (5,-1): dq 3, dr 0, ds 3 -> 3 == promien
    assert_eq!(hex_distance(5.0, -1.0, 2.0, -1.0), 3.0);
    assert!(is_hex_in_start_reveal(
        5.0,
        -1.0,
        true,
        start,
        radius,
        hex_distance
    ));
    // (2,2): dq 0, dr 3, ds 3 -> 3 == promien
    assert!(is_hex_in_start_reveal(
        2.0,
        2.0,
        true,
        start,
        radius,
        hex_distance
    ));
    // (6,-1): dystans 4 > 3
    assert!(!is_hex_in_start_reveal(
        6.0,
        -1.0,
        true,
        start,
        radius,
        hex_distance
    ));
    // srodek
    assert!(is_hex_in_start_reveal(
        2.0,
        -1.0,
        true,
        start,
        radius,
        hex_distance
    ));
}

/// `if (!awaitingFirstCity || playerStartHex === null) return true;` (`first-player-city.ts:31`).
#[test]
fn start_reveal_open_when_not_awaiting_or_no_start_hex() {
    assert!(is_hex_in_start_reveal(
        50.0,
        50.0,
        false,
        Some((0.0, 0.0)),
        1.0,
        hex_distance
    ));
    assert!(is_hex_in_start_reveal(
        50.0,
        50.0,
        true,
        None,
        1.0,
        hex_distance
    ));
    // NaN w dystansie: `NaN <= r` = false (Math.max propaguje NaN, `units/setup.ts:366`)
    assert!(!is_hex_in_start_reveal(
        f64::NAN,
        0.0,
        true,
        Some((0.0, 0.0)),
        5.0,
        hex_distance
    ));
}

/// `isAwaitingFirstPlayerCity` (`first-player-city.ts:14-20`).
#[test]
fn awaiting_first_city() {
    assert!(is_awaiting_first_player_city(false, [1, 2], 0));
    assert!(!is_awaiting_first_player_city(false, [1, 0], 0));
    assert!(!is_awaiting_first_player_city(true, [], 0));
    assert!(is_awaiting_first_player_city(false, [], 3));
    assert!(!is_awaiting_first_player_city(false, [3], 3));
}

/// `validateFirstPlayerCityPlacement` (`first-player-city.ts:36-48`).
#[test]
fn validate_placement_branches() {
    // baza odrzuca -> powod bazy, nawet poza kregiem
    assert_eq!(
        validate_first_player_city_placement(0.0, 0.0, true, false, false, "za blisko"),
        PlacementCheck {
            ok: false,
            reason: "za blisko".to_owned()
        }
    );
    // oczekiwanie i poza kregiem -> FIRST_CITY_START_REVEAL_DENIED
    let r = validate_first_player_city_placement(0.0, 0.0, true, false, true, "");
    assert!(!r.ok);
    assert_eq!(r.reason, FIRST_CITY_START_REVEAL_DENIED);
    assert_eq!(
        FIRST_CITY_START_REVEAL_DENIED,
        "poza oświetlonym obszarem startu"
    );
    // bez oczekiwania krag nie ma znaczenia
    assert!(validate_first_player_city_placement(0.0, 0.0, false, false, true, "").ok);
    assert_eq!(
        validate_first_player_city_placement(0.0, 0.0, true, true, true, "x"),
        PlacementCheck {
            ok: true,
            reason: String::new()
        }
    );
}

/// `canFoundPlayerCityAt` (`main.ts:12923-12943`) = baza `canFoundCity` + walidacja kregu.
#[test]
fn can_found_player_city_at_composes_base_and_reveal() {
    let ctx = StartRevealContext {
        awaiting_first_city: true,
        player_start_hex: Some((0.0, 0.0)),
        start_reveal_radius: 2.0,
    };
    let ok_base = |_: f64, _: f64| PlacementCheck {
        ok: true,
        reason: String::new(),
    };
    assert!(ctx.can_found_player_city_at(2.0, 0.0, ok_base).ok);
    let out = ctx.can_found_player_city_at(3.0, 0.0, ok_base);
    assert_eq!(out.reason, FIRST_CITY_START_REVEAL_DENIED);
    let bad = ctx.can_found_player_city_at(1.0, 0.0, |_, _| PlacementCheck {
        ok: false,
        reason: "morze".to_owned(),
    });
    assert_eq!(bad.reason, "morze");
    // po pierwszym miescie krag nie obowiazuje
    let later = StartRevealContext {
        awaiting_first_city: false,
        ..ctx
    };
    assert!(later.is_in_start_reveal(30.0, 0.0));
    assert!(later.can_found_player_city_at(30.0, 0.0, ok_base).ok);
}
