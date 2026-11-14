//! R-RUSTPORT-P6-ZLOZE-GRANTS-STATE-Q1: pole `DiplomacyState::zloze_grants` oraz operacje stanu
//! `suspend` (wojna) i `deactivate` (wygasniecie umowy) zgodne z pinem `07d2fbd72f758705f8e1d59cc4968027ffbafe75`:
//! Funkcje pina: `suspendZlozeGrantsForWar` (`gra/src/game/diplomacy-pn-engine.ts:331`) oraz
//! `deactivateZlozeGrantsForDeal` (`gra/src/game/diplomacy-pn-engine.ts:346`).
//! Wektory generuje `p6_zloze_grants_state_gen.mjs` (wykonanie tekstu pina w node, straznik SHA-256).
//! Wiring do produkcyjnej tury/handlu NIE jest w tym tescie (zostaje w #104 czesc 2).

use civ_engine::domain::diplomacy::{
    deactivate_zloze_grants_for_deal, suspend_zloze_grants_for_war, DiplomacyState, ZlozeGrant,
};
use civ_engine::domain::PlayerId;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_zloze_grants_state_vectors/vectors.json");

fn p(id: i64) -> PlayerId {
    PlayerId::new(id as u64)
}

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json")
}

fn as_i64(v: &Value) -> i64 {
    v.as_i64().expect("liczba calkowita")
}

fn grant_from(v: &Value) -> ZlozeGrant {
    ZlozeGrant {
        granter_owner_id: p(as_i64(&v["granterOwnerId"])),
        grantee_owner_id: p(as_i64(&v["granteeOwnerId"])),
        partner_id: p(as_i64(&v["partnerId"])),
        zloze_id: v["zlozeId"].as_str().expect("zlozeId").to_string(),
        hex_key: v["hexKey"].as_str().expect("hexKey").to_string(),
        active: v["active"].as_bool().expect("active"),
        deal_id: v["dealId"].as_str().map(str::to_string),
    }
}

fn grants_from(v: &Value) -> Vec<ZlozeGrant> {
    v.as_array()
        .expect("tablica grantow")
        .iter()
        .map(grant_from)
        .collect()
}

#[test]
fn vectors_meet_minimum_counts_and_pin() {
    let v = vectors();
    assert_eq!(v["meta"]["pin"], "07d2fbd72f758705f8e1d59cc4968027ffbafe75");
    let susp = v["suspend"].as_array().expect("suspend");
    let deact = v["deactivate"].as_array().expect("deactivate");
    assert!(susp.len() >= 150, "suspend: {} < 150", susp.len());
    assert!(deact.len() >= 150, "deactivate: {} < 150", deact.len());
}

#[test]
fn suspend_zloze_grants_for_war_matches_pin_vectors() {
    let v = vectors();
    let mut active_before_and_after_inactive = 0usize;
    let mut pair_hits_both_directions = 0usize;
    for case in v["suspend"].as_array().expect("suspend") {
        let grants = grants_from(&case["grants"]);
        let a = p(as_i64(&case["ownerA"]));
        let b = p(as_i64(&case["ownerB"]));
        let expected = grants_from(&case["expected"]);
        let got = suspend_zloze_grants_for_war(&grants, a, b);
        assert_eq!(got, expected, "przypadek {}", case["name"]);

        for (before, after) in grants.iter().zip(got.iter()) {
            if before.active && !after.active {
                active_before_and_after_inactive += 1;
            }
        }
        let forward = grants
            .iter()
            .any(|g| g.active && g.granter_owner_id == a && g.grantee_owner_id == b);
        let backward = grants
            .iter()
            .any(|g| g.active && g.granter_owner_id == b && g.grantee_owner_id == a);
        if forward && backward {
            pair_hits_both_directions += 1;
        }
    }
    assert!(
        active_before_and_after_inactive > 0,
        "wektory musza zawierac aktywne granty wygaszone przez wojne"
    );
    assert!(
        pair_hits_both_directions > 0,
        "wektory musza zawierac pary z grantami w obu kierunkach"
    );
}

#[test]
fn deactivate_zloze_grants_for_deal_matches_pin_vectors() {
    let v = vectors();
    let mut hits = 0usize;
    let mut deactivated = 0usize;
    for case in v["deactivate"].as_array().expect("deactivate") {
        let grants = grants_from(&case["grants"]);
        let deal_id = case["dealId"].as_str().expect("dealId");
        let expected = grants_from(&case["expected"]);
        let got = deactivate_zloze_grants_for_deal(&grants, deal_id);
        assert_eq!(got, expected, "przypadek {}", case["name"]);

        for (before, after) in grants.iter().zip(got.iter()) {
            if before.active && !after.active {
                deactivated += 1;
            }
        }
        if grants
            .iter()
            .any(|g| g.active && g.deal_id.as_deref() == Some(deal_id))
        {
            hits += 1;
        }
    }
    assert!(hits > 0, "wektory musza zawierac trafienia deala");
    assert!(deactivated > 0, "wektory musza zawierac wygaszone granty");
}

#[test]
fn state_methods_delegate_to_pure_functions() {
    let mut state = DiplomacyState {
        zloze_grants: vec![
            ZlozeGrant {
                granter_owner_id: p(1),
                grantee_owner_id: p(2),
                partner_id: p(2),
                zloze_id: "z1".into(),
                hex_key: "h1".into(),
                active: true,
                deal_id: Some("d1".into()),
            },
            ZlozeGrant {
                granter_owner_id: p(3),
                grantee_owner_id: p(4),
                partner_id: p(4),
                zloze_id: "z2".into(),
                hex_key: "h2".into(),
                active: true,
                deal_id: Some("d1".into()),
            },
        ],
        ..Default::default()
    };
    state.suspend_zloze_grants_for_war(p(2), p(1));
    assert!(
        !state.zloze_grants[0].active,
        "para (1,2) wygaszona w obu kierunkach"
    );
    assert!(state.zloze_grants[1].active, "inna para nietknieta");

    state.deactivate_zloze_grants_for_deal("d1");
    assert!(
        !state.zloze_grants[1].active,
        "deal d1 wygasza grant innej pary"
    );
}

#[test]
fn state_without_zloze_grants_field_loads_as_empty_list() {
    // Stary zapis: brak klucza `zloze_grants` (format sprzed dodania pola).
    let state: DiplomacyState = serde_json::from_str(r#"{"deals":[]}"#).expect("stary zapis");
    assert!(state.zloze_grants.is_empty());

    let empty: DiplomacyState = serde_json::from_str("{}").expect("pusty zapis");
    assert!(empty.zloze_grants.is_empty());

    // Pelny round-trip stanu bez pola: usuniecie klucza z biezacej serializacji.
    let mut value = serde_json::to_value(DiplomacyState::default()).expect("to_value");
    value
        .as_object_mut()
        .expect("obiekt stanu")
        .remove("zloze_grants");
    let legacy: DiplomacyState = serde_json::from_value(value).expect("legacy round-trip");
    assert!(legacy.zloze_grants.is_empty());
}

#[test]
fn zloze_grant_round_trip_uses_camel_case_and_omits_missing_deal_id() {
    let with_none = ZlozeGrant {
        granter_owner_id: p(1),
        grantee_owner_id: p(2),
        partner_id: p(3),
        zloze_id: "zloze-A".into(),
        hex_key: "hex-7".into(),
        active: true,
        deal_id: None,
    };
    let json = serde_json::to_value(&with_none).expect("to_value none");
    let obj = json.as_object().expect("obiekt");
    for key in [
        "granterOwnerId",
        "granteeOwnerId",
        "partnerId",
        "zlozeId",
        "hexKey",
        "active",
    ] {
        assert!(obj.contains_key(key), "brak klucza {key}");
    }
    assert!(
        !obj.contains_key("dealId"),
        "dealId musi byc pominiety przy None"
    );
    assert!(
        !obj.contains_key("granter_owner_id"),
        "klucze snake_case niedozwolone"
    );
    let back: ZlozeGrant = serde_json::from_value(json).expect("back none");
    assert_eq!(back, with_none);

    let with_some = ZlozeGrant {
        deal_id: Some("deal-9".into()),
        ..with_none
    };
    let json = serde_json::to_value(&with_some).expect("to_value some");
    assert_eq!(json["dealId"], "deal-9");
    let back: ZlozeGrant = serde_json::from_value(json).expect("back some");
    assert_eq!(back, with_some);
}

#[test]
fn state_loads_web_save_key_zloze_grants_camel_case() {
    // Zapis webowy trzyma granty pod kluczem `zlozeGrants` (pin 07d2fbd72, main.ts:47251).
    let web = r#"{"deals":[],"zlozeGrants":[{"granterOwnerId":1,"granteeOwnerId":2,"partnerId":2,"zlozeId":"z1","hexKey":"h1","active":true,"dealId":"d1"},{"granterOwnerId":3,"granteeOwnerId":4,"partnerId":4,"zlozeId":"z2","hexKey":"h2","active":false}]}"#;
    let state: DiplomacyState = serde_json::from_str(web).expect("zapis webowy");
    assert_eq!(state.zloze_grants.len(), 2);
    assert_eq!(state.zloze_grants[0].deal_id.as_deref(), Some("d1"));
    assert_eq!(state.zloze_grants[1].deal_id, None);
    assert!(state.zloze_grants[0].active);
    assert!(!state.zloze_grants[1].active);

    // Serializacja pozostaje pod kluczem snake_case `zloze_grants`.
    let out = serde_json::to_value(&state).expect("to_value");
    assert!(out.get("zloze_grants").is_some());
    assert!(out.get("zlozeGrants").is_none());
}

/// Test samospojnosci (round-trip wlasnego typu): NIE dowodzi parytetu z pinem.
/// Parytet pokrywaja testy `suspend_..._matches_pin_vectors` i `deactivate_..._matches_pin_vectors`.
#[test]
fn vector_grants_round_trip_through_json() {
    let v = vectors();
    for case in v["suspend"].as_array().expect("suspend") {
        for grant in grants_from(&case["grants"]) {
            let json = serde_json::to_value(&grant).expect("to_value");
            let back: ZlozeGrant = serde_json::from_value(json).expect("from_value");
            assert_eq!(back, grant, "przypadek {}", case["name"]);
        }
    }
}
