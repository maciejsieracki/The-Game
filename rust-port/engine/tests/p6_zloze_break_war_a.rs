//! R-RUSTPORT-P6-ZLOZE-WIRE-WAR-BREAK-A-Q1 (etap a): czysta domena zerwania traktatow przy wojnie
//! i przy dobrowolnym zerwaniu, na jawnym stanie `DiplomacyState`, zgodna z pinem
//! `07d2fbd72f758705f8e1d59cc4968027ffbafe75`:
//! - `breakTreatiesOnWar` (`gra/src/main.ts:23686`) -> `DiplomacyState::break_treaties_on_war`;
//! - `breakTreatyVoluntarily` (`gra/src/main.ts:22741`) -> `DiplomacyState::break_treaty_voluntarily`;
//! - plan `voluntaryTreatyBreakPlan` (`gra/src/game/diplomacy-penalty-preview.ts:192`) ->
//!   `voluntary_treaty_break_plan`.
//!
//! Wektory generuje `p6_zloze_break_war_a_gen.mjs` (wykonanie tekstu pina w node, straznik SHA-256).
//!
//! Poza zakresem etapu a (zostaje na etap b / osobne tematy): kara wiarygodnosci, zdarzenia
//! `zlamana_obietnica`, okno karencji N3 (`setDiploPairMeta`), N5, karencja WspolnaWalkaBarbarzyncy.

use civ_engine::domain::diplomacy::{
    deactivate_zloze_grants_for_deal, trade_treaty_break_penalty_free, voluntary_treaty_break_plan,
    ActiveDeal, DiplomacyState, TreatyKind, VoluntaryTreatyBreakPlan, ZlozeGrant,
};
use civ_engine::domain::PlayerId;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_zloze_break_war_a_vectors/vectors.json");

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

/// Umowa w formacie pinu (`id`, `rodzaj`, `strony`, `wygasaTura`, `zawartaTura`) — `ActiveDeal` ma te same klucze.
fn deals_from(v: &Value) -> Vec<ActiveDeal> {
    v.as_array()
        .expect("tablica umow")
        .iter()
        .map(|d| serde_json::from_value(d.clone()).expect("ActiveDeal z wektora"))
        .collect()
}

fn plan_from(v: &Value) -> VoluntaryTreatyBreakPlan {
    VoluntaryTreatyBreakPlan {
        penalty_free: v["penaltyFree"].as_bool().expect("penaltyFree"),
        open_n3_window: v["openN3Window"].as_bool().expect("openN3Window"),
        n5_charged: v["n5Charged"].as_bool().expect("n5Charged"),
    }
}

fn deal_ids(deals: &[ActiveDeal]) -> Vec<&str> {
    deals.iter().map(|d| d.id.as_str()).collect()
}

fn state_for(deals: &Value, grants: &Value) -> DiplomacyState {
    DiplomacyState {
        deals: deals_from(deals),
        zloze_grants: grants_from(grants),
        ..Default::default()
    }
}

#[test]
fn vectors_meet_minimum_counts_and_pin() {
    let v = vectors();
    assert_eq!(v["meta"]["pin"], "07d2fbd72f758705f8e1d59cc4968027ffbafe75");
    let war = v["war"].as_array().expect("war");
    let vol = v["voluntary"].as_array().expect("voluntary");
    assert!(war.len() >= 150, "war: {} < 150", war.len());
    assert!(vol.len() >= 150, "voluntary: {} < 150", vol.len());
}

#[test]
fn break_treaties_on_war_matches_pin_vectors() {
    let v = vectors();
    let mut with_broken = 0usize;
    let mut without_broken = 0usize;
    let mut grant_deactivated_by_deal = 0usize;
    let mut grant_suspended_by_war = 0usize;
    for case in v["war"].as_array().expect("war") {
        let mut state = state_for(&case["deals"], &case["grants"]);
        let a = p(as_i64(&case["ownerA"]));
        let b = p(as_i64(&case["ownerB"]));
        let before_grants = state.zloze_grants.clone();

        let broken = state.break_treaties_on_war(a, b);

        let expected_ids: Vec<String> = case["expected"]["brokenIds"]
            .as_array()
            .expect("brokenIds")
            .iter()
            .map(|x| x.as_str().expect("id").to_string())
            .collect();
        assert_eq!(broken, expected_ids, "przypadek {}: id", case["name"]);
        let expected_deals = deals_from(&case["expected"]["deals"]);
        assert_eq!(
            state.deals, expected_deals,
            "przypadek {}: umowy",
            case["name"]
        );
        let expected_grants = grants_from(&case["expected"]["grants"]);
        assert_eq!(
            state.zloze_grants, expected_grants,
            "przypadek {}: granty",
            case["name"]
        );

        if broken.is_empty() {
            without_broken += 1;
        } else {
            with_broken += 1;
        }
        for (before, after) in before_grants.iter().zip(state.zloze_grants.iter()) {
            if before.active && !after.active {
                let by_deal = before
                    .deal_id
                    .as_deref()
                    .is_some_and(|id| broken.iter().any(|b| b == id));
                if by_deal {
                    grant_deactivated_by_deal += 1;
                } else {
                    grant_suspended_by_war += 1;
                }
            }
        }
    }
    assert!(with_broken > 0, "wektory: wojna z umowa zerwana");
    assert!(without_broken > 0, "wektory: wojna bez umowy do zerwania");
    assert!(
        grant_deactivated_by_deal > 0,
        "wektory: granty wygaszone przez zerwana umowe"
    );
    assert!(
        grant_suspended_by_war > 0,
        "wektory: granty zawieszone przez wojne"
    );
}

#[test]
fn break_treaty_voluntarily_matches_pin_vectors() {
    let v = vectors();
    let mut penalty_free = 0usize;
    let mut open_n3 = 0usize;
    let mut n5 = 0usize;
    let mut not_found = 0usize;
    for case in v["voluntary"].as_array().expect("voluntary") {
        let deals_in = &case["deals"];
        let grants_in = &case["grants"];
        let mut state = state_for(deals_in, grants_in);
        let deal_id = case["dealId"].as_str().expect("dealId");
        let turn = u32::try_from(as_i64(&case["turn"])).expect("tura");
        let expected = &case["expected"];

        let result = state.break_treaty_voluntarily(deal_id, turn);

        if expected["found"].as_bool() == Some(false) {
            not_found += 1;
            assert!(result.is_none(), "przypadek {}: brak umowy", case["name"]);
            assert_eq!(
                state.deals,
                deals_from(deals_in),
                "przypadek {}: stan umow",
                case["name"]
            );
            assert_eq!(
                state.zloze_grants,
                grants_from(grants_in),
                "przypadek {}: stan grantow",
                case["name"]
            );
            continue;
        }
        let result = result.unwrap_or_else(|| panic!("przypadek {}: brak wyniku", case["name"]));
        assert_eq!(result.deal_id, deal_id, "przypadek {}: id", case["name"]);
        let plan = plan_from(&expected["plan"]);
        assert_eq!(result.plan, plan, "przypadek {}: plan", case["name"]);
        assert_eq!(
            state.deals,
            deals_from(&expected["deals"]),
            "przypadek {}: umowy",
            case["name"]
        );
        assert_eq!(
            state.zloze_grants,
            grants_from(&expected["grants"]),
            "przypadek {}: granty",
            case["name"]
        );

        if plan.penalty_free {
            penalty_free += 1;
        }
        if plan.open_n3_window {
            open_n3 += 1;
        }
        if plan.n5_charged {
            n5 += 1;
        }
    }
    assert!(
        penalty_free > 0,
        "wektory: handel zawarty >= 10 tur temu (bez kary)"
    );
    assert!(open_n3 > 0, "wektory: traktat bezterminowy (okno N3)");
    assert!(n5 > 0, "wektory: traktat czasowy (N5)");
    assert!(not_found > 0, "wektory: nieistniejace id umowy");
}

#[test]
fn trade_penalty_free_boundary_is_ten_turns() {
    let trade: ActiveDeal = serde_json::from_value(serde_json::json!({
        "id": "t1", "rodzaj": "umowa_szlakow", "strony": [1, 2],
        "wygasaTura": 40, "zawartaTura": 0
    }))
    .expect("trade");
    assert!(
        !trade_treaty_break_penalty_free(&trade, 9),
        "9 tur: nadal z kara"
    );
    assert!(
        trade_treaty_break_penalty_free(&trade, 10),
        "10 tur: bez kary"
    );
    let plan = voluntary_treaty_break_plan(&trade, 9);
    assert!(plan.n5_charged && !plan.penalty_free && !plan.open_n3_window);
    let plan = voluntary_treaty_break_plan(&trade, 10);
    assert_eq!(
        plan,
        VoluntaryTreatyBreakPlan {
            penalty_free: true,
            open_n3_window: false,
            n5_charged: false
        }
    );
}

#[test]
fn alliance_is_never_penalty_free_and_opens_n3_when_open_ended() {
    let alliance: ActiveDeal = serde_json::from_value(serde_json::json!({
        "id": "s1", "rodzaj": "sojusz_pelny", "strony": [1, 2],
        "wygasaTura": null, "zawartaTura": 0
    }))
    .expect("alliance");
    assert_eq!(alliance.kind, TreatyKind::FullAlliance);
    assert!(!trade_treaty_break_penalty_free(&alliance, 50));
    let plan = voluntary_treaty_break_plan(&alliance, 50);
    assert_eq!(
        plan,
        VoluntaryTreatyBreakPlan {
            penalty_free: false,
            open_n3_window: true,
            n5_charged: false
        }
    );
}

#[test]
fn war_break_keeps_unrelated_pairs_and_deals() {
    let deals: Vec<ActiveDeal> = deals_from(&serde_json::json!([
        {"id": "x1", "rodzaj": "pakt_nieagresji", "strony": [1, 2], "wygasaTura": null, "zawartaTura": 0},
        {"id": "x2", "rodzaj": "wasalizacja", "strony": [1, 2], "wygasaTura": null, "zawartaTura": 0},
        {"id": "x3", "rodzaj": "sojusz_defensywny", "strony": [1, 3], "wygasaTura": null, "zawartaTura": 0}
    ]));
    let mut state = DiplomacyState {
        deals,
        ..Default::default()
    };
    let broken = state.break_treaties_on_war(p(2), p(1));
    assert_eq!(
        broken,
        vec!["x1".to_string()],
        "wasalizacja nie zrywa sie wojna"
    );
    assert_eq!(deal_ids(&state.deals), vec!["x2", "x3"]);
}

#[test]
fn deactivate_helper_is_reused_by_voluntary_break() {
    // Spojnosc: wygaszenie grantow przez umowe to ta sama funkcja, co w `deactivate_zloze_grants_for_deal`.
    let grant = ZlozeGrant {
        granter_owner_id: p(1),
        grantee_owner_id: p(2),
        partner_id: p(2),
        zloze_id: "z1".into(),
        hex_key: "h1".into(),
        active: true,
        deal_id: Some("d1".into()),
    };
    let direct = deactivate_zloze_grants_for_deal(std::slice::from_ref(&grant), "d1");
    let mut state = DiplomacyState {
        deals: deals_from(&serde_json::json!([
            {"id": "d1", "rodzaj": "pakt_nieagresji", "strony": [1, 2], "wygasaTura": 30, "zawartaTura": 0}
        ])),
        zloze_grants: vec![grant],
        ..Default::default()
    };
    let res = state
        .break_treaty_voluntarily("d1", 5)
        .expect("umowa istnieje");
    assert!(res.plan.n5_charged);
    assert_eq!(state.zloze_grants, direct);
    assert!(state.deals.is_empty());
}
