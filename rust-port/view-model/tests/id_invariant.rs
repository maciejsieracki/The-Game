//! Criterion 3: the id newtypes keep their value through JSON and enforce the
//! contract bound `id <= 2^53 - 1` (contract §4 pt 4, D-DTO-2 = B).

mod common;

use civ_view_model::*;
use common::*;
use serde_json::{json, Value};

const SAFE: u64 = (1 << 53) - 1;

#[test]
fn bound_is_js_max_safe_integer() {
    assert_eq!(MAX_SAFE_ID, SAFE);
    assert_eq!(MAX_SAFE_ID, 9_007_199_254_740_991);
}

#[test]
fn try_new_accepts_up_to_bound_and_rejects_above() {
    assert_eq!(UnitId::try_new(SAFE).unwrap().get(), SAFE);
    assert_eq!(CityId::try_new(0).unwrap().get(), 0);
    assert_eq!(
        PlayerId::try_new(SAFE + 1),
        Err(IdOutOfRange { value: SAFE + 1 })
    );
    assert!(CityId::try_new(u64::MAX).is_err());
    assert!(UnitId::try_from(SAFE + 1).is_err());
    assert_eq!(UnitId::try_from(5).unwrap(), uid(5));
}

#[test]
fn ids_serialize_as_plain_numbers_and_keep_value() {
    for v in [0, 1, 7, 1_000_000, SAFE] {
        let u = UnitId::try_new(v).unwrap();
        let text = serde_json::to_string(&u).unwrap();
        assert_eq!(text, v.to_string());
        let back: UnitId = serde_json::from_str(&text).unwrap();
        assert_eq!(back.get(), v);
        let c: CityId = serde_json::from_value(json!(v)).unwrap();
        assert_eq!(c.get(), v);
        let p: PlayerId = serde_json::from_value(json!(v)).unwrap();
        assert_eq!(p.get(), v);
    }
}

#[test]
fn ids_above_bound_or_not_unsigned_integers_are_rejected() {
    for bad in [
        json!(SAFE + 1),
        json!(u64::MAX),
        json!(-1),
        json!(1.5),
        json!("7"),
        Value::Null,
    ] {
        assert!(
            serde_json::from_value::<UnitId>(bad.clone()).is_err(),
            "{bad}"
        );
        assert!(
            serde_json::from_value::<CityId>(bad.clone()).is_err(),
            "{bad}"
        );
        assert!(
            serde_json::from_value::<PlayerId>(bad.clone()).is_err(),
            "{bad}"
        );
    }
}

#[test]
fn display_is_decimal_for_the_adapter() {
    assert_eq!(uid(42).to_string(), "42");
    assert_eq!(
        CityId::try_new(SAFE).unwrap().to_string(),
        "9007199254740991"
    );
}

/// `OwnerRef`: one JSON number, `-99` rebels, `-1` barbarians, `>= 0` player
/// (engine `ids.rs:105-121`, web owner values).
#[test]
fn owner_ref_json_values() {
    let cases = [
        (OwnerRef::Rebel, -99_i64),
        (OwnerRef::Barbarian, -1),
        (player(0), 0),
        (player(3), 3),
        (
            OwnerRef::Player(PlayerId::try_new(SAFE).unwrap()),
            SAFE as i64,
        ),
    ];
    for (owner, n) in cases {
        assert_eq!(serde_json::to_value(owner).unwrap(), json!(n));
        assert_eq!(owner.legacy_i64(), n);
        assert_eq!(OwnerRef::from_legacy_i64(n), Some(owner));
        let back: OwnerRef = serde_json::from_value(json!(n)).unwrap();
        assert_eq!(back, owner);
    }
    assert_eq!(REBEL_OWNER_JSON, -99);
    assert_eq!(BARBARIAN_OWNER_JSON, -1);
}

#[test]
fn owner_ref_rejects_other_values() {
    for bad in [-2_i64, -98, -100, i64::MIN, SAFE as i64 + 1, i64::MAX] {
        assert_eq!(OwnerRef::from_legacy_i64(bad), None, "{bad}");
        assert!(
            serde_json::from_value::<OwnerRef>(json!(bad)).is_err(),
            "{bad}"
        );
    }
    assert!(serde_json::from_value::<OwnerRef>(json!(1.0)).is_err());
    assert!(serde_json::from_value::<OwnerRef>(json!("0")).is_err());
}

/// The order of `owners[]` (contract §3.4: `-99 < -1 < 0 < …`).
#[test]
fn owner_ref_order_matches_legacy_numbers() {
    let mut owners = vec![player(2), OwnerRef::Barbarian, player(0), OwnerRef::Rebel];
    owners.sort();
    assert_eq!(
        owners,
        vec![OwnerRef::Rebel, OwnerRef::Barbarian, player(0), player(2)]
    );
    let nums: Vec<i64> = owners.iter().map(|o| o.legacy_i64()).collect();
    let mut sorted = nums.clone();
    sorted.sort_unstable();
    assert_eq!(nums, sorted);
}

/// Every id in a full snapshot keeps its value after a JSON round-trip, and
/// the ids stand at the same JSON places.
#[test]
fn ids_survive_snapshot_round_trip() {
    let mut view = sample_view();
    // Push one of each id to the bound.
    view.units[0].id = UnitId::try_new(SAFE).unwrap();
    view.stacks.visible_ids[0] = UnitId::try_new(SAFE).unwrap();
    view.cities[0].id = CityId::try_new(SAFE).unwrap();
    view.owners[1].owner_id = OwnerRef::Player(PlayerId::try_new(SAFE).unwrap());

    let text = serde_json::to_string(&view).unwrap();
    let back: RenderViewDto = serde_json::from_str(&text).unwrap();

    let ids = |v: &RenderViewDto| -> Vec<u64> {
        let mut out: Vec<u64> = v.units.iter().map(|u| u.id.get()).collect();
        out.extend(v.cities.iter().map(|c| c.id.get()));
        out.extend(v.stacks.visible_ids.iter().map(|u| u.get()));
        out.extend(v.stacks.badge_by_rep_id.iter().map(|(u, _)| u.get()));
        out.extend(v.stacks.vitals_by_rep_id.iter().map(|(u, _)| u.get()));
        out.extend(v.sieges.iter().map(|s| s.city_id.get()));
        out.extend(
            v.owners
                .iter()
                .filter_map(|o| o.capital_city_id.map(CityId::get)),
        );
        out.extend(
            v.battle
                .iter()
                .flat_map(|b| b.setup.units.iter().map(|u| u.id.get())),
        );
        out
    };
    let owners = |v: &RenderViewDto| -> Vec<i64> {
        let mut out: Vec<i64> = v.owners.iter().map(|o| o.owner_id.legacy_i64()).collect();
        out.extend(v.units.iter().map(|u| u.owner_id.legacy_i64()));
        out.extend(v.cities.iter().map(|c| c.owner_id.legacy_i64()));
        out.push(v.viewer.owner_id.legacy_i64());
        out
    };
    assert_eq!(ids(&back), ids(&view));
    assert_eq!(owners(&back), owners(&view));
    assert!(ids(&view).contains(&SAFE));

    let tree: Value = serde_json::from_str(&text).unwrap();
    assert_eq!(tree["units"][0]["id"], json!(SAFE));
    assert_eq!(tree["cities"][0]["id"], json!(SAFE));
    assert_eq!(tree["owners"][1]["ownerId"], json!(SAFE));
    assert_eq!(tree["owners"][0]["ownerId"], json!(-1));
    assert_eq!(tree["units"][1]["ownerId"], json!(-99));
}

/// A snapshot whose JSON carries an id above the bound does not deserialize.
#[test]
fn snapshot_with_unsafe_id_is_rejected() {
    let mut tree = serde_json::to_value(sample_view()).unwrap();
    tree["units"][0]["id"] = json!(SAFE + 1);
    assert!(serde_json::from_value::<RenderViewDto>(tree).is_err());

    let mut tree = serde_json::to_value(sample_view()).unwrap();
    tree["stacks"]["badgeByRepId"][0][0] = json!(SAFE + 1);
    assert!(serde_json::from_value::<RenderViewDto>(tree).is_err());

    let mut tree = serde_json::to_value(sample_view()).unwrap();
    tree["viewer"]["ownerId"] = json!(-2);
    assert!(serde_json::from_value::<RenderViewDto>(tree).is_err());
}
