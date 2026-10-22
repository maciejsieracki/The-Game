use civ_engine::domain::barbarians::{BarbCamp, BarbUnit, CitySnapshot, MapTile, Terrain};
use civ_engine::domain::{CampId, OwnerRef, PlayerId};
use std::collections::HashSet;

#[test]
fn owner_ref_serializes_every_variant_as_the_legacy_number() {
    let cases = [
        (OwnerRef::Player(PlayerId::new(0)), "0"),
        (OwnerRef::Player(PlayerId::new(1)), "1"),
        (OwnerRef::Player(PlayerId::new(42)), "42"),
        (OwnerRef::Barbarian, "-1"),
        (OwnerRef::Rebel, "-99"),
    ];
    for (owner, expected) in cases {
        let encoded = serde_json::to_string(&owner).expect("owner serializes");
        assert_eq!(encoded, expected, "wire form of {owner:?}");
        let decoded: OwnerRef = serde_json::from_str(&encoded).expect("owner deserializes");
        assert_eq!(decoded, owner, "round trip of {owner:?}");
    }
}

#[test]
fn owner_ref_rejects_unknown_negative_numbers() {
    // Deliberate narrowing versus the old `i64`: only the two sentinels the
    // Rust engine represents are accepted. Documented in P3-20 section 3.
    assert!(serde_json::from_str::<OwnerRef>("-2").is_err());
    assert!(serde_json::from_str::<OwnerRef>("-100").is_err());
    assert!(serde_json::from_str::<OwnerRef>("\"1\"").is_err());
}

#[test]
fn owner_ref_refuses_player_ids_that_do_not_fit_the_legacy_number() {
    // `PlayerId` is a u64; the legacy wire number is an i64. Such an id cannot
    // be written, and the serializer must fail instead of wrapping.
    let huge = OwnerRef::Player(PlayerId::new(u64::MAX));
    assert!(serde_json::to_string(&huge).is_err());
    assert_eq!(huge.legacy_i64(), None);
}

#[test]
fn owner_ref_legacy_conversions_match_the_sentinels() {
    assert_eq!(OwnerRef::from_legacy_i64(-1), Some(OwnerRef::Barbarian));
    assert_eq!(OwnerRef::from_legacy_i64(-99), Some(OwnerRef::Rebel));
    assert_eq!(
        OwnerRef::from_legacy_i64(0),
        Some(OwnerRef::Player(PlayerId::new(0)))
    );
    assert_eq!(OwnerRef::from_legacy_i64(-2), None);
    assert_eq!(OwnerRef::from_legacy_i64(i64::MIN), None);

    assert_eq!(OwnerRef::Barbarian.legacy_i64(), Some(-1));
    assert_eq!(OwnerRef::Rebel.legacy_i64(), Some(-99));
    assert_eq!(OwnerRef::Player(PlayerId::new(7)).legacy_i64(), Some(7));
}

#[test]
fn owner_ref_accessors_and_player_conversion() {
    let player = OwnerRef::from(PlayerId::new(3));
    assert_eq!(player.player(), Some(PlayerId::new(3)));
    assert!(!player.is_barbarian());
    assert_eq!(OwnerRef::Barbarian.player(), None);
    assert!(OwnerRef::Barbarian.is_barbarian());
    assert_eq!(OwnerRef::Rebel.player(), None);
    assert!(!OwnerRef::Rebel.is_barbarian());
}

#[test]
fn owner_ref_ordering_matches_the_legacy_i64_order() {
    // Sorting OwnerRef must give the same sequence as sorting the legacy
    // numbers, so no BTreeMap/sort order changes with the migration.
    let legacy: [i64; 6] = [5, -1, 0, -99, 12, 1];
    let mut owners: Vec<OwnerRef> = legacy
        .iter()
        .map(|value| OwnerRef::from_legacy_i64(*value).expect("legacy value is valid"))
        .collect();
    owners.sort();
    let mut sorted_legacy = legacy.to_vec();
    sorted_legacy.sort();
    let back: Vec<i64> = owners
        .iter()
        .map(|owner| owner.legacy_i64().expect("fits"))
        .collect();
    assert_eq!(back, sorted_legacy);
    assert_eq!(
        owners,
        vec![
            OwnerRef::Rebel,
            OwnerRef::Barbarian,
            OwnerRef::Player(PlayerId::new(0)),
            OwnerRef::Player(PlayerId::new(1)),
            OwnerRef::Player(PlayerId::new(5)),
            OwnerRef::Player(PlayerId::new(12)),
        ]
    );
}

#[test]
fn owner_ref_hash_agrees_with_equality() {
    let mut set = HashSet::new();
    assert!(set.insert(OwnerRef::Player(PlayerId::new(2))));
    assert!(set.insert(OwnerRef::Barbarian));
    assert!(set.insert(OwnerRef::Rebel));
    // Equal values built through different paths must hash to the same bucket.
    assert!(!set.insert(OwnerRef::from_legacy_i64(2).expect("valid")));
    assert!(!set.insert(OwnerRef::from_legacy_i64(-1).expect("valid")));
    assert!(!set.insert(OwnerRef::from(PlayerId::new(2))));
    assert_eq!(set.len(), 3);
}

#[test]
fn owner_and_camp_fields_are_plain_numbers_in_struct_json() {
    let mut unit = BarbUnit::new(4, 1, 2).with_camp(9);
    let value = serde_json::to_value(&unit).expect("unit serializes");
    assert_eq!(value["owner_id"], serde_json::json!(-1));
    assert_eq!(value["camp_id"], serde_json::json!(9));

    unit.owner_id = OwnerRef::Rebel;
    unit.camp_id = None;
    let value = serde_json::to_value(&unit).expect("unit serializes");
    assert_eq!(value["owner_id"], serde_json::json!(-99));
    assert_eq!(value["camp_id"], serde_json::Value::Null);

    let city = CitySnapshot::new(3, OwnerRef::Player(PlayerId::new(7)), 0, 0);
    let value = serde_json::to_value(&city).expect("city serializes");
    assert_eq!(value["owner_id"], serde_json::json!(7));

    let owned = MapTile::owned(Terrain::Grassland, OwnerRef::Barbarian);
    let value = serde_json::to_value(&owned).expect("tile serializes");
    assert_eq!(value["owner_id"], serde_json::json!(-1));
    let neutral = MapTile::new(Terrain::Grassland);
    let value = serde_json::to_value(&neutral).expect("tile serializes");
    assert_eq!(value["owner_id"], serde_json::Value::Null);

    let camp = BarbCamp::new(9, 0, 0);
    let value = serde_json::to_value(&camp).expect("camp serializes");
    assert_eq!(value["id"], serde_json::json!(9));
}

#[test]
fn player_keyed_maps_keep_numeric_string_keys() {
    // `researchedByOwner` is keyed by `PlayerId` (transparent newtype). The JSON
    // key must stay the plain player id, as it was for the old `u64` keys.
    use civ_engine::domain::diplomacy::BasketTransferContext;
    use std::collections::{BTreeMap, BTreeSet};

    let mut researched = BTreeMap::new();
    researched.insert(PlayerId::new(1), BTreeSet::from(["Bronze".to_owned()]));
    let context = BasketTransferContext {
        researched_by_owner: researched,
        ..BasketTransferContext::default()
    };
    let value = serde_json::to_value(&context).expect("context serializes");
    assert_eq!(
        value["researchedByOwner"]["1"],
        serde_json::json!(["Bronze"])
    );
    let decoded: BasketTransferContext =
        serde_json::from_value(value).expect("context deserializes");
    assert_eq!(decoded.researched_by_owner, context.researched_by_owner);
}

#[test]
fn camp_id_is_a_transparent_newtype() {
    let camp = CampId::new(9);
    assert_eq!(camp.get(), 9);
    assert_eq!(CampId::from(9_u64), camp);
    assert_eq!(serde_json::to_string(&camp).expect("camp serializes"), "9");
    let decoded: CampId = serde_json::from_str("9").expect("camp deserializes");
    assert_eq!(decoded, camp);
}
