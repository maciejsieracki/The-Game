//! P3.21: `CityId` newtype contract. The JSON form must stay a bare number
//! (`#[serde(transparent)]`), both as a value and as a map key.

use civ_engine::domain::barbarians::{BarbCityGarrison, BarbCityGarrisonSpawn, BarbUnit};
use civ_engine::domain::{CityId, PlayerId};
use std::collections::BTreeMap;

#[test]
fn city_id_serializes_as_bare_number() {
    let encoded = serde_json::to_string(&CityId::new(42)).expect("city id serializes");
    assert_eq!(encoded, "42");
    let decoded: CityId = serde_json::from_str("42").expect("city id deserializes");
    assert_eq!(decoded, CityId::new(42));
}

#[test]
fn city_id_conversions_round_trip() {
    let id = CityId::from(7_u64);
    assert_eq!(id.get(), 7);
    assert_eq!(CityId::new(id.get()), id);
    assert_eq!(id.to_string(), "7");
}

#[test]
fn city_id_ordering_matches_raw_value() {
    let mut ids = vec![CityId::new(3), CityId::new(1), CityId::new(2)];
    ids.sort();
    assert_eq!(ids, vec![CityId::new(1), CityId::new(2), CityId::new(3)]);
}

#[test]
fn city_id_map_keys_stay_numeric_in_json() {
    let map: BTreeMap<CityId, Vec<String>> =
        BTreeMap::from([(CityId::new(5), vec!["Spichlerz".to_owned()])]);
    let encoded = serde_json::to_string(&map).expect("map serializes");
    assert_eq!(encoded, r#"{"5":["Spichlerz"]}"#);
    let decoded: BTreeMap<CityId, Vec<String>> =
        serde_json::from_str(&encoded).expect("map deserializes");
    assert_eq!(decoded, map);
}

#[test]
fn barbarian_city_garrison_json_keeps_numeric_city_id() {
    let city = BarbCityGarrison {
        city_id: CityId::new(12),
        q: 1,
        r: -1,
        spawn_cooldown: 2,
    };
    let encoded = serde_json::to_string(&city).expect("garrison serializes");
    assert!(encoded.starts_with(r#"{"city_id":12,"#), "got {encoded}");
    let decoded: BarbCityGarrison = serde_json::from_str(&encoded).expect("garrison deserializes");
    assert_eq!(decoded, city);

    let spawn = BarbCityGarrisonSpawn {
        city_id: CityId::new(12),
        q: 0,
        r: 0,
        unit_type: "Wojownik".to_owned(),
    };
    let encoded = serde_json::to_string(&spawn).expect("spawn serializes");
    assert!(encoded.starts_with(r#"{"city_id":12,"#), "got {encoded}");
}

#[test]
fn barbarian_cleared_cities_round_trip_as_numbers() {
    let mut unit = BarbUnit::new(1, 0, 0);
    unit.cleared_city_ids.insert(CityId::new(9));
    unit.cleared_city_ids.insert(CityId::new(4));
    let encoded = serde_json::to_string(&unit).expect("unit serializes");
    assert!(
        encoded.contains(r#""cleared_city_ids":[4,9]"#),
        "got {encoded}"
    );
    let decoded: BarbUnit = serde_json::from_str(&encoded).expect("unit deserializes");
    assert_eq!(decoded, unit);
    assert!(decoded.cleared_city_ids.contains(&CityId::new(9)));
}

#[test]
fn player_and_city_ids_are_distinct_types() {
    // Same raw value, different domains: equality is only defined per type.
    assert_eq!(PlayerId::new(3).get(), CityId::new(3).get());
}
