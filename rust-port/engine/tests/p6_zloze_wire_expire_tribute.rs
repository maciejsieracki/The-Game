//! R-RUSTPORT-P6-ZLOZE-WIRE-EXPIRE-TRIBUTE-Q1 (#104 czesc 2): produkcyjna tura `run_war_turn` wygasza granty
//! zlozy (`DiplomacyState::zloze_grants`) powiazane z umowa, ktora znika w D1 (`expireTreaties`) albo w D6
//! (zerwanie za daninę, `res.broken`). Pin: `gra/src/main.ts` `runDiplomacyTurnTick` (ok. 24222-24294),
//! funkcja `deactivateZlozeGrantsForDeal` (`gra/src/game/diplomacy-pn-engine.ts:346`).
//!
//! Wektory: `p6_zloze_wire_expire_tribute_vectors/vectors.json`, generowane przez
//! `p6_zloze_wire_expire_tribute_gen.mjs` (wykonanie tekstu pina w node, straznik SHA-256).

use std::collections::BTreeMap;

use civ_engine::domain::ai_diplomacy_turn::{PairKey, PairWarParams};
use civ_engine::domain::brake_inputs::OwnerFacts;
use civ_engine::domain::brake_power::{Component, ObjectivePowerRaw};
use civ_engine::domain::diplomacy::{
    ActiveDeal, CityResourceState, TreatyEconomy, TreatyKind, ZlozeGrant,
};
use civ_engine::domain::turn_war_dipl_steps::DiplStepsInputs;
use civ_engine::domain::turn_war_pipeline::{
    run_war_turn, PeaceLockFacts, WarTurnConfig, WarTurnContext, WarTurnError, WarTurnInputs,
    WarTurnReport,
};
use civ_engine::domain::war_turn_state::WarTurnState;
use civ_engine::domain::PlayerId;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_zloze_wire_expire_tribute_vectors/vectors.json");

const HUMAN: i64 = 1;
const AI_A: i64 = 2;
const AI_B: i64 = 3;

fn p(id: i64) -> PlayerId {
    PlayerId::new(id as u64)
}

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json")
}

fn grant_from(v: &Value) -> ZlozeGrant {
    ZlozeGrant {
        granter_owner_id: p(v["granterOwnerId"].as_i64().expect("granterOwnerId")),
        grantee_owner_id: p(v["granteeOwnerId"].as_i64().expect("granteeOwnerId")),
        partner_id: p(v["partnerId"].as_i64().expect("partnerId")),
        zloze_id: v["zlozeId"].as_str().expect("zlozeId").to_string(),
        hex_key: v["hexKey"].as_str().expect("hexKey").to_string(),
        active: v["active"].as_bool().expect("active"),
        deal_id: v["dealId"].as_str().map(str::to_string),
    }
}

fn str_list(v: &Value) -> Vec<String> {
    v.as_array()
        .expect("lista")
        .iter()
        .map(|x| x.as_str().expect("id").to_string())
        .collect()
}

// ---------------------------------------------------------------------------------------------
// Mini-swiat (jak w p6_wire_war_dipl_steps.rs)
// ---------------------------------------------------------------------------------------------

#[allow(non_snake_case)]
fn P(v: f64) -> Component {
    Component::Provided(v)
}

fn power(owner_id: i64, miasta: f64, jednostki: f64) -> ObjectivePowerRaw {
    ObjectivePowerRaw {
        owner_id,
        epoka: 1.0,
        jednostki: P(jednostki),
        wygrane_bitwy: P(0.0),
        bitwy_pkt_sum: Component::ExplicitZero,
        suma_ludkow: P(0.0),
        rekrut_ekw: P(0.0),
        miasta: P(miasta),
        heksy_terytorium: P(0.0),
        budynki: P(0.0),
        tech_zbadane: P(0.0),
        ulepszenia_terenu: P(0.0),
        kultura_imperium: Component::ExplicitZero,
        miasta_jednosc_religii: Component::ExplicitZero,
        zdobycze_power: Component::ExplicitZero,
    }
}

fn facts(city_count: f64) -> OwnerFacts {
    OwnerFacts {
        is_barbarian: false,
        is_city_copy: false,
        eliminated: false,
        city_count,
    }
}

fn city(id: &str, owner: i64, drewno: f64) -> CityResourceState {
    let mut c = CityResourceState::new(id, p(owner));
    c.resources.insert("drewno".to_owned(), drewno);
    c
}

fn world_inputs() -> WarTurnInputs {
    let mut inputs = WarTurnInputs {
        me_id: HUMAN,
        human_ids: vec![HUMAN],
        contacts: vec![AI_A, AI_B],
        city_owner_ids: vec![HUMAN, AI_A, AI_A, AI_B],
        ai_start_owner_ids: vec![AI_A, AI_B],
        ..WarTurnInputs::default()
    };
    inputs.owner_facts.insert(HUMAN, facts(1.0));
    inputs.owner_facts.insert(AI_A, facts(2.0));
    inputs.owner_facts.insert(AI_B, facts(1.0));
    for id in [HUMAN, AI_A, AI_B] {
        inputs.epochs.insert(id, 1.0);
    }
    inputs.power_raw.insert(HUMAN, power(HUMAN, 1.0, 1.0));
    inputs.power_raw.insert(AI_A, power(AI_A, 2.0, 3.0));
    inputs.power_raw.insert(AI_B, power(AI_B, 1.0, 1.0));
    inputs.peace_locks = Some(PeaceLockFacts::default());
    inputs.dipl = DiplStepsInputs {
        treasury: BTreeMap::from([(HUMAN, 100.0), (AI_A, 0.0), (AI_B, 50.0)]),
        praca_pool: BTreeMap::new(),
        cities: Some(vec![
            city("10", HUMAN, 0.0),
            city("20", AI_A, 25.0),
            city("21", AI_A, 0.0),
            city("30", AI_B, 0.0),
        ]),
        capital_city: BTreeMap::from([(HUMAN, "10".to_owned())]),
        army_m: BTreeMap::from([(AI_A, 3.0), (AI_B, 1.0), (HUMAN, 1.0)]),
        brake_flag_off: false,
        ..DiplStepsInputs::default()
    };
    inputs
}

fn config() -> WarTurnConfig {
    let mut params: BTreeMap<PairKey, PairWarParams> = BTreeMap::new();
    params.insert(
        (AI_A, AI_B),
        PairWarParams {
            prog: 1000.0,
            n: 2.0,
        },
    );
    WarTurnConfig::new(params, false)
}

fn run_turn(
    war: &mut WarTurnState,
    turn: f64,
    inputs: &WarTurnInputs,
    cfg: &WarTurnConfig,
) -> Result<WarTurnReport, WarTurnError> {
    let mut ctx = WarTurnContext {
        war,
        turn,
        inputs,
        config: cfg,
    };
    run_war_turn(&mut ctx)
}

/// Umowa wygasajaca w turze 2 (D1: `wygasaTura > turn` jest fałszem dla turn = 2).
fn nap_expiring_at_2() -> ActiveDeal {
    let mut d = ActiveDeal::new(TreatyKind::Nap, p(HUMAN), p(AI_A), 1, Some(2));
    d.id = "nap-wygasa".to_owned();
    d
}

/// Umowa bez terminu, ktora przetrwa cala ture.
fn live_nap() -> ActiveDeal {
    let mut d = ActiveDeal::new(TreatyKind::Nap, p(AI_A), p(AI_B), 1, None);
    d.id = "pakt-zywy".to_owned();
    d
}

/// Danina AI_B -> HUMAN, 40 na ture (D6: przy skarbcu 50 zaplacona, przy 10 zerwana).
fn tribute_deal() -> ActiveDeal {
    let mut d = ActiveDeal::new(TreatyKind::Vassalization, p(AI_B), p(HUMAN), 1, None);
    d.id = "danina".to_owned();
    d.economy = Some(TreatyEconomy {
        payer_owner_id: p(AI_B),
        receiver_owner_id: p(HUMAN),
        money_per_turn: 40.0,
    });
    d
}

// ---------------------------------------------------------------------------------------------
// Testy
// ---------------------------------------------------------------------------------------------

#[test]
fn production_turn_deactivates_zloze_grants_like_pin() {
    let v = vectors();
    assert_eq!(v["pin"], "07d2fbd72f758705f8e1d59cc4968027ffbafe75");
    let fixture: Vec<ZlozeGrant> = v["fixtureGrants"]
        .as_array()
        .expect("fixtureGrants")
        .iter()
        .map(grant_from)
        .collect();
    let scenarios = v["scenarios"].as_array().expect("scenarios");
    assert_eq!(scenarios.len(), 2);

    let mut checked_d1 = false;
    let mut checked_d6 = false;

    for sc in scenarios {
        let name = sc["name"].as_str().expect("name");
        let want_expired = str_list(&sc["expiredIds"]);
        let want_broken = str_list(&sc["brokenIds"]);

        let mut inputs = world_inputs();
        let cfg = config();
        let mut war = WarTurnState::default();
        war.diplomacy.add_deal(nap_expiring_at_2());
        war.diplomacy.add_deal(live_nap());
        war.diplomacy.add_deal(tribute_deal());
        war.diplomacy.zloze_grants = fixture.clone();
        if !want_broken.is_empty() {
            // Skarbiec platnika za maly na daninę 40 -> zerwanie w D6.
            inputs.dipl.treasury.insert(AI_B, 10.0);
        }

        let rep = run_turn(&mut war, 2.0, &inputs, &cfg).expect(name);

        let got_expired = rep.dipl.expired_deals.clone();
        assert_eq!(got_expired, want_expired, "{name}: umowy wygasle w D1");
        assert_eq!(
            rep.dipl.payments.broken, want_broken,
            "{name}: zerwane za daninę w D6"
        );

        let want_active: Vec<bool> = sc["expectedActive"]
            .as_array()
            .expect("expectedActive")
            .iter()
            .map(|b| b.as_bool().expect("bool"))
            .collect();
        let got_grants = &war.diplomacy.zloze_grants;
        assert_eq!(got_grants.len(), fixture.len(), "{name}: liczba grantow");
        for (i, (g, f)) in got_grants.iter().zip(&fixture).enumerate() {
            assert_eq!(g.zloze_id, f.zloze_id, "{name}: kolejnosc grantow [{i}]");
            assert_eq!(g.deal_id, f.deal_id, "{name}: deal_id [{i}]");
            assert_eq!(
                g.active, want_active[i],
                "{name}: active grantu {}",
                g.zloze_id
            );
        }

        let active_of = |zid: &str| {
            got_grants
                .iter()
                .find(|g| g.zloze_id == zid)
                .expect("grant")
                .active
        };
        if name == "d1-wygasniecie" {
            // D1: grant umowy wygasajacej gaśnie; danina (nie zerwana) zostaje aktywna.
            assert!(
                !active_of("z-wygasla"),
                "D1 wygasza grant umowy wygasajacej"
            );
            assert!(
                active_of("z-danina"),
                "bez zerwania D6 danina zostaje aktywna"
            );
            checked_d1 = true;
        }
        if name == "d1-i-d6-zerwanie-za-danine" {
            // D6: grant zerwanej daniny gaśnie (oprócz grantu z D1).
            assert!(
                !active_of("z-wygasla"),
                "D1 wygasza grant umowy wygasajacej"
            );
            assert!(!active_of("z-danina"), "D6 wygasza grant zerwanej daniny");
            checked_d6 = true;
        }
        // Granty bez powiazania albo z zywa umowa zawsze zostaja aktywne.
        assert!(active_of("z-zywa"), "{name}: grant zywej umowy bez zmian");
        assert!(
            active_of("z-bez-umowy"),
            "{name}: grant bez umowy bez zmian"
        );
        assert!(
            !active_of("z-juz-nieaktywna"),
            "{name}: nieaktywny pozostaje nieaktywny"
        );
    }

    assert!(checked_d1, "scenariusz D1 sprawdzony");
    assert!(checked_d6, "scenariusz D1+D6 sprawdzony");
}
