use civ_engine::domain::{CampId, OwnerRef, PlayerId};

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
    assert!(serde_json::from_str::<OwnerRef>("-2").is_err());
    assert!(serde_json::from_str::<OwnerRef>("-100").is_err());
    assert!(serde_json::from_str::<OwnerRef>("\"1\"").is_err());
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
    assert_eq!(OwnerRef::Player(PlayerId::new(u64::MAX)).legacy_i64(), None);
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
fn owner_ref_ordering_and_hashing_are_stable() {
    let mut owners = vec![
        OwnerRef::Rebel,
        OwnerRef::Player(PlayerId::new(2)),
        OwnerRef::Barbarian,
        OwnerRef::Player(PlayerId::new(1)),
    ];
    owners.sort();
    assert_eq!(
        owners,
        vec![
            OwnerRef::Player(PlayerId::new(1)),
            OwnerRef::Player(PlayerId::new(2)),
            OwnerRef::Barbarian,
            OwnerRef::Rebel,
        ]
    );
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
