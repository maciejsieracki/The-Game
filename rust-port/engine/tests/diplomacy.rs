use civ_engine::domain::diplomacy::*;
use std::collections::{BTreeMap, BTreeSet};

#[test]
fn production_diplomacy_api_is_public() {
    let relation = civ_engine::domain::diplomacy::Relation::starting();
    assert_eq!(relation.status, RelationStatus::Neutral);
}

fn relation(trust: f64, respect: f64) -> Relation {
    Relation::new(trust, respect, RelationStatus::Neutral)
}

fn context(rel: Relation) -> ProposalEvalContext {
    ProposalEvalContext::new(rel, 10)
}

fn proposal(action: ProposalAction, proposer: u64, responder: u64) -> DiplomaticProposal {
    DiplomaticProposal::new(action, proposer, responder, ProposalPayload::default())
}

#[test]
fn relation_is_clamped_and_events_are_immutable() {
    let source = relation(98.0, 95.0);
    let changed = apply_diplomatic_event(&source, DiplomaticEvent::CommonEnemy);

    assert_eq!(source.trust, 98.0);
    assert_eq!(source.respect, 95.0);
    assert_eq!(changed.trust, 100.0);
    assert_eq!(changed.respect, 100.0);

    let war = apply_diplomatic_event(&relation(80.0, 80.0), DiplomaticEvent::DeclareWar);
    assert_eq!(war.status, RelationStatus::War);
    assert_eq!(war.relation_score(), WAR_RELATION_SCORE_CAP);

    let betrayal = apply_diplomatic_event(&relation(60.0, 60.0), DiplomaticEvent::Betrayal);
    assert_eq!(betrayal.status, RelationStatus::War);
    assert_eq!(betrayal.trust, 0.0);
}

#[test]
fn trust_events_match_the_canonical_one_shot_deltas() {
    let cases = [
        (DiplomaticEvent::Peace, 25.0, 30.0),
        (DiplomaticEvent::CommonEnemy, 25.0, 40.0),
        (DiplomaticEvent::BrokenPromiseByPlayer, 0.0, 30.0),
        (DiplomaticEvent::BrokenPromiseByAi, 0.0, 30.0),
        (DiplomaticEvent::CasusBelliWar, 0.0, 29.0),
        (DiplomaticEvent::BaselessUltimatum, 10.0, 20.0),
        (DiplomaticEvent::FreeTechnologyExchange, 25.0, 30.0),
        (DiplomaticEvent::VoluntaryTreatyBreak, 5.0, 30.0),
    ];

    for (event, expected_trust, expected_respect) in cases {
        let changed = apply_diplomatic_event(&relation(20.0, 30.0), event);
        assert_eq!(changed.trust, expected_trust, "event {event:?}");
        assert_eq!(changed.respect, expected_respect, "event {event:?}");
    }
}

#[test]
fn tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war() {
    let params = DiplomacyParams::default();
    let tick = TickContext {
        active_trade: true,
        peace_tier: Some(PeaceTrustTier::Alliance),
        goodwill: true,
        common_enemy: true,
        same_religion: true,
        different_religion: false,
        common_border: true,
        credibility: Some(100.0),
    };

    assert_eq!(compute_trust_delta(&tick, false, &params), 11.25);
    let changed = tick_relation(&relation(20.0, 30.0), &tick, &params);
    assert_eq!(changed.trust, 31.25);

    let war = Relation::new(20.0, 30.0, RelationStatus::War);
    let war_changed = tick_relation(&war, &tick, &params);
    assert_eq!(war_changed.trust, 0.0);
    assert_eq!(war_changed.respect, 29.0);
}

#[test]
fn pair_state_canonicalizes_reversed_owner_ids_and_expires_deals() {
    let pair = CivilizationPair::new(9, 2);
    assert_eq!(pair, CivilizationPair::new(2, 9));
    assert_eq!(pair.as_tuple(), (2, 9));

    let deal = ActiveDeal::new(TreatyKind::Nap, 9, 2, 4, Some(8));
    let mut state = DiplomacyState::new();
    state.set_relation(pair, relation(40.0, 30.0));
    state.add_deal(deal.clone());
    assert!(state.has_deal(2, 9, Some(TreatyKind::Nap)));

    state.expire_deals(8);
    assert!(!state.has_deal(2, 9, Some(TreatyKind::Nap)));
    assert_eq!(state.relation(9, 2).unwrap().trust, 40.0);
}

#[test]
fn quantity_resource_valuation_uses_blocks_and_floors_requested_units() {
    assert_eq!(trade_step("glina"), 10.0);
    assert_eq!(trade_step("zloto"), 1.0);
    assert_eq!(normalize_resource_quantity("glina", 25.0, None), 20.0);
    assert_eq!(normalize_resource_quantity("glina", 25.0, Some(14.0)), 10.0);
    assert_eq!(quantity_resource_pn("glina", 25.0), Some(4.0));
    assert_eq!(quantity_resource_pn("zloto", 3.0), Some(150.0));
    assert_eq!(quantity_resource_pn("nieznany", 10.0), None);
}

#[test]
fn trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount() {
    let changed = apply_diplomatic_event(&relation(20.0, 30.0), DiplomaticEvent::Trade);
    assert_eq!(changed.trust, 20.0);

    // The source rule is max(1, relation), not an upper clamp.  The proposal
    // path caps relation separately where that is part of its contract.
    assert_eq!(fair_give_pn(10.0, 200.0), 5.0);
}

#[test]
fn transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split() {
    let cities = vec![
        CityResourceState::with_resources("b", 1, [("glina", 7.0)]),
        CityResourceState::with_resources("a", 1, [("glina", 10.0)]),
    ];
    let missing = transfer_quantity_resource("glina", 10.0, 1, 2, None, &cities);
    assert_eq!(missing.moved, 0.0);
    assert_eq!(
        missing.reason,
        Some(ResourceTransferReason::NoRecipientCity)
    );
    assert_eq!(missing.cities, cities);

    let mut cities = cities;
    cities.push(CityResourceState::with_resources("z", 2, [("glina", 0.0)]));
    let result = transfer_quantity_resource("glina", 12.0, 1, 2, Some("z"), &cities);
    assert_eq!(result.moved, 12.0);
    assert_eq!(result.cities[0].resources["glina"], 5.0);
    assert_eq!(result.cities[1].resources["glina"], 0.0);
    assert_eq!(result.cities[2].resources["glina"], 12.0);
}

#[test]
fn tech_and_boolean_resource_transfers_are_immutable_and_idempotent() {
    let mut researched = BTreeMap::new();
    researched.insert(1, BTreeSet::from(["Bronze".to_owned()]));
    let ctx = BasketTransferContext {
        researched_by_owner: researched,
        resource_grants: Vec::new(),
        tech_catalog: Some(vec![TechDefinition::new("Iron", ["Bronze"])]),
    };

    let granted = grant_technology(&ctx, "Iron", 1);
    assert!(granted.granted);
    assert!(granted.context.researched_by_owner[&1].contains("Iron"));
    assert!(!ctx.researched_by_owner[&1].contains("Iron"));

    let duplicate = grant_technology(&granted.context, "Iron", 1);
    assert!(!duplicate.granted);

    let access = grant_resource_access(&granted.context, " zelazo ", 2, 1);
    assert!(access.granted);
    assert_eq!(access.grant_id.as_deref(), Some("sraw_1"));
    assert!(has_resource_access(&access.context, "zelazo", 2, 1));
    let duplicate_access = grant_resource_access(&access.context, "zelazo", 2, 1);
    assert!(!duplicate_access.granted);
}

#[test]
fn technology_transfer_obeys_epoch_and_tier_gates() {
    let mut bronze = TechDefinition::new("Bronze", Vec::<String>::new());
    bronze.era = Some(1);
    bronze.tier = Some(1);
    let mut iron = TechDefinition::new("Iron", Vec::<String>::new());
    iron.era = Some(2);
    iron.tier = Some(1);
    let mut iron_sibling = TechDefinition::new("Iron I B", Vec::<String>::new());
    iron_sibling.era = Some(2);
    iron_sibling.tier = Some(1);
    let mut iron_tier_two = TechDefinition::new("Iron II", Vec::<String>::new());
    iron_tier_two.era = Some(2);
    iron_tier_two.tier = Some(2);

    let ctx = BasketTransferContext {
        researched_by_owner: BTreeMap::new(),
        resource_grants: Vec::new(),
        tech_catalog: Some(vec![
            bronze.clone(),
            iron.clone(),
            iron_sibling,
            iron_tier_two.clone(),
        ]),
    };
    assert!(!grant_technology(&ctx, "Iron", 1).granted);

    let bronze_done = grant_technology(&ctx, "Bronze", 1);
    assert!(bronze_done.granted);
    let iron_done = grant_technology(&bronze_done.context, "Iron", 1);
    assert!(iron_done.granted);
    assert!(!grant_technology(&iron_done.context, "Iron II", 1).granted);
}

#[test]
fn canonical_value_catalog_prices_non_quantity_basket_items() {
    let catalog = ValueCatalog::default();
    assert_eq!(
        basket_item_pn(
            &BasketItem::new(BasketItemKind::Technology, "Garncarstwo", 1.0),
            &catalog
        ),
        Some(40.0)
    );
    assert_eq!(
        basket_item_pn(
            &BasketItem::new(BasketItemKind::BooleanResource, "glina", 1.0),
            &catalog,
        ),
        Some(20.0)
    );
    assert_eq!(
        basket_item_pn(
            &BasketItem::new(BasketItemKind::Deposit, "miedz", 1.0),
            &catalog
        ),
        Some(120.0)
    );
    assert_eq!(
        basket_item_pn(
            &BasketItem::new(BasketItemKind::Unit, "Wojownik", 1.0),
            &catalog
        ),
        Some(10.0)
    );
}

#[test]
fn transferred_unit_spawns_at_near_hex_or_recipient_capital() {
    let mut ctx = UnitTransferContext {
        capital_hex_by_owner: BTreeMap::from([(1, UnitHex { q: 5, r: 5 })]),
        unit_definitions: BTreeMap::from([(
            "Wojownik".to_owned(),
            UnitDefinition {
                movement: Some(3.0),
                role: Some("Swordsman".to_owned()),
                super_unit: false,
                pn_cost: Some(10.0),
            },
        )]),
        ..UnitTransferContext::default()
    };
    let spawned = spawn_transferred_unit("Wojownik", 1, None, &mut ctx);
    assert!(spawned.ok);
    let unit = spawned.unit.unwrap();
    assert_eq!(unit.owner_id, 1);
    assert_eq!(unit.type_id, "Wojownik");
    assert_eq!((unit.q, unit.r), (5, 5));
    assert_eq!(unit.movement_left, 3.0);
    assert_eq!(spawned.pn_cost, Some(10.0));

    let near = spawn_transferred_unit("Wojownik", 1, Some(UnitHex { q: 9, r: 9 }), &mut ctx);
    assert!(near.ok);
    let near_unit = near.unit.unwrap();
    assert_eq!((near_unit.q, near_unit.r), (9, 9));
}

#[test]
fn transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation() {
    let mut ctx = UnitTransferContext::default();
    let unknown = spawn_transferred_unit("NieIstniejeXYZ", 1, None, &mut ctx);
    assert!(!unknown.ok);
    assert_eq!(
        unknown.reason,
        Some(SpawnTransferredUnitReason::UnknownType)
    );
    assert!(ctx.units.is_empty());

    ctx.unit_definitions.insert(
        "Wojownik".to_owned(),
        UnitDefinition {
            pn_cost: Some(10.0),
            ..UnitDefinition::default()
        },
    );
    let missing = spawn_transferred_unit("Wojownik", 1, None, &mut ctx);
    assert!(!missing.ok);
    assert_eq!(missing.pn_cost, Some(10.0));
    assert_eq!(missing.reason, Some(SpawnTransferredUnitReason::NoCapital));
    assert!(ctx.units.is_empty());
}

#[test]
fn cyclic_resource_offer_normalizes_units_and_preserves_direction() {
    let give = vec![BasketItem::quantity_resource("glina", 25.0)];
    let receive = vec![BasketItem::new(BasketItemKind::Gold, "", 4.0)];
    let transfers = build_cyclic_resource_transfers(3, 8, &give, &receive);

    assert_eq!(transfers.len(), 1);
    assert_eq!(transfers[0].resource_key, "glina");
    assert_eq!(transfers[0].units_per_turn, 20.0);
    assert_eq!(transfers[0].seller_owner_id, 3);
    assert_eq!(transfers[0].buyer_owner_id, 8);
    assert_eq!(transfers[0].payment, Some(PaymentKind::Gold));
    assert_eq!(transfers[0].payment_per_turn, 4.0);
}

#[test]
fn proposal_conditions_cover_war_peace_duplicate_and_trade_fairness() {
    let mut peace = proposal(ProposalAction::Peace, 1, 0);
    let peace_ctx = context(Relation::new(50.0, 50.0, RelationStatus::War));
    let accepted = evaluate_proposal(&peace, &peace_ctx);
    assert!(accepted.accepted);
    assert!(accepted.one_shot_trade);
    assert_eq!(accepted.pw_balance, Some(0.0));

    peace.payload.give_pn = Some(0.0);
    peace.payload.receive_pn = Some(0.0);
    let rejected = evaluate_proposal(
        &peace,
        &ProposalEvalContext {
            author_owner_id: Some(0),
            ..peace_ctx.clone()
        },
    );
    assert!(!rejected.accepted);

    let mut trade = proposal(ProposalAction::Trade, 0, 1);
    trade.payload.give_pn = Some(5.0);
    trade.payload.receive_pn = Some(10.0);
    let rejected = evaluate_proposal(&trade, &context(relation(50.0, 50.0)));
    assert!(!rejected.accepted);
    assert!(rejected.reason.contains("PW"));
    assert!(rejected.pw_balance.unwrap() < 0.0);

    let mut fair_trade = trade.clone();
    fair_trade.payload.give_pn = Some(10.0);
    let accepted = evaluate_proposal(&fair_trade, &context(relation(50.0, 50.0)));
    assert!(accepted.accepted);
    assert!(accepted.one_shot_trade);

    let nap = proposal(ProposalAction::Nap, 0, 1);
    let mut nap_ctx = context(relation(60.0, 60.0));
    nap_ctx.active_deals = vec![ActiveDeal::new(TreatyKind::Nap, 0, 1, 10, Some(20))];
    let duplicate = evaluate_proposal(&nap, &nap_ctx);
    assert!(!duplicate.accepted);
    assert!(duplicate.reason.contains("już"));
}

#[test]
fn proposal_builds_treaties_with_canonical_pair_and_duration() {
    let mut nap = proposal(ProposalAction::Nap, 8, 3);
    nap.payload.treaty_turns = Some(12.0);
    let mut ctx = context(relation(70.0, 60.0));
    ctx.proposer_credibility = 10.0;
    let result = evaluate_proposal(&nap, &ctx);

    assert!(result.accepted, "{}", result.reason);
    let deal = result.deal.unwrap();
    assert_eq!(deal.parties.as_tuple(), (3, 8));
    assert_eq!(deal.expires_turn, Some(22));
    assert_eq!(deal.kind, TreatyKind::Nap);
}

#[test]
fn alliance_uses_configured_hegemon_threshold() {
    let alliance = proposal(ProposalAction::DefensiveAlliance, 0, 1);
    let mut ctx = context(relation(100.0, 100.0));
    ctx.military_ratio = 0.5;
    ctx.responder_willingness_ally = 1.0;
    let params = DiplomacyParams {
        alliance_hegemon_military_ratio: 0.6,
        ..DiplomacyParams::default()
    };

    let result = evaluate_proposal_with_params(&alliance, &ctx, params, ValueCatalog::default());
    assert!(!result.accepted);
    assert!(result.reason.contains("Hegemon"));
}

#[test]
fn proposal_rejects_withdrawn_access_and_invalid_tech_exchange() {
    let mut trade = proposal(ProposalAction::Trade, 0, 1);
    trade.payload.give_items = vec![BasketItem::new(BasketItemKind::ResourceAccess, "iron", 1.0)];
    trade.payload.give_pn = Some(100.0);
    let rejected = evaluate_proposal(&trade, &context(relation(80.0, 80.0)));
    assert!(!rejected.accepted);
    assert!(rejected.reason.contains("wycofany"));

    let mut tech = proposal(ProposalAction::Technology, 0, 1);
    tech.payload.tech_id = Some("Iron".into());
    tech.payload.tech_payment_mode = Some(TechPaymentMode::Technology);
    tech.payload.tech_offer_id = Some("Iron".into());
    let rejected = evaluate_proposal(&tech, &context(relation(80.0, 80.0)));
    assert!(!rejected.accepted);
    assert!(rejected.reason.contains("samą siebie"));
}

#[test]
fn serialized_proposal_round_trips_canonical_wire_names() {
    let mut p = proposal(ProposalAction::Trade, 2, 7);
    p.payload.give_items = vec![BasketItem::quantity_resource("glina", 20.0)];
    let json = serde_json::to_string(&p).unwrap();
    assert!(json.contains("handel"));
    assert!(json.contains("surowiec_ilosc"));
    let decoded: DiplomaticProposal = serde_json::from_str(&json).unwrap();
    assert_eq!(decoded, p);
}

#[test]
fn initial_relation_treats_same_minor_type_like_same_type() {
    let params = DiplomacyParams::default();
    let relation = initial_relation(CivilizationKind::Minor, CivilizationKind::Minor, &params);

    assert_eq!(relation.trust, 0.0);
    assert_eq!(relation.respect, params.start_respect);
}

#[test]
fn diplomacy_state_serializes_non_empty_pair_map() {
    let mut state = DiplomacyState::new();
    state.set_relation(CivilizationPair::new(8, 3), relation(40.0, 30.0));

    let json = serde_json::to_string(&state).expect("pair state should be JSON-safe");
    assert!(json.contains("3_8"));
    let decoded: DiplomacyState = serde_json::from_str(&json).expect("pair state should decode");
    assert_eq!(decoded.relation(3, 8), state.relation(3, 8));

    let deal = ActiveDeal::new(TreatyKind::Nap, 8, 3, 4, Some(8));
    let deal_json = serde_json::to_string(&deal).expect("deal should be JSON-safe");
    assert!(deal_json.contains("\"strony\":[3,8]"));
    let decoded_deal: ActiveDeal = serde_json::from_str(&deal_json).unwrap();
    assert_eq!(decoded_deal.parties, CivilizationPair::new(3, 8));
}

#[test]
fn war_currency_gate_allows_only_peace_settlements() {
    let mut trade = proposal(ProposalAction::Trade, 0, 1);
    trade.payload.gold_once = Some(20.0);
    let trade_result = evaluate_proposal(
        &trade,
        &ProposalEvalContext {
            at_war: true,
            ..context(relation(50.0, 50.0))
        },
    );
    assert!(!trade_result.accepted);
    assert!(trade_result.reason.contains("wojna"));

    let mut peace = proposal(ProposalAction::Peace, 0, 1);
    peace.payload.gold_once = Some(20.0);
    let peace_result = evaluate_proposal(
        &peace,
        &ProposalEvalContext {
            at_war: true,
            ..context(relation(50.0, 50.0))
        },
    );
    assert!(peace_result.accepted, "{}", peace_result.reason);
}

#[test]
fn treaty_basket_cannot_bypass_fairness_on_nap() {
    let mut nap = proposal(ProposalAction::Nap, 0, 1);
    nap.payload.give_pn = Some(1.0);
    nap.payload.receive_pn = Some(100.0);
    let result = evaluate_proposal(&nap, &context(relation(100.0, 100.0)));

    assert!(!result.accepted);
    assert!(result.reason.contains("nieuczciwa"));
    assert_eq!(result.pw_balance, Some(-99.0));
}

#[test]
fn quantity_catalog_multiplies_boolean_and_deposit_items() {
    let catalog = ValueCatalog::default();
    assert_eq!(
        basket_item_pn(
            &BasketItem::new(BasketItemKind::BooleanResource, "glina", 2.0),
            &catalog,
        ),
        Some(40.0)
    );
    assert_eq!(
        basket_item_pn(
            &BasketItem::new(BasketItemKind::Deposit, "miedz", 2.0),
            &catalog,
        ),
        Some(240.0)
    );
}

#[test]
fn trade_quantity_mode_builds_cyclic_exchange_deal() {
    let mut trade = proposal(ProposalAction::Trade, 0, 1);
    trade.payload.resource_trade_mode = Some(ResourceTradeMode::PerTurn);
    trade.payload.turns = Some(4.0);
    trade.payload.give_items = vec![BasketItem::quantity_resource("glina", 25.0)];
    trade.payload.receive_items = vec![BasketItem::gold(4.0)];
    let result = evaluate_proposal(&trade, &context(relation(80.0, 80.0)));

    assert!(result.accepted, "{}", result.reason);
    let deal = result.deal.expect("cyclic trade should create a deal");
    assert_eq!(deal.kind, TreatyKind::Exchange);
    assert_eq!(deal.cyclic_resource_transfers.len(), 1);
    assert_eq!(deal.cyclic_resource_transfers[0].units_per_turn, 20.0);
    assert_eq!(deal.expires_turn, Some(14));
}

#[test]
fn trade_basket_valuation_uses_player_side_and_difficulty_multipliers() {
    let mut trade = proposal(ProposalAction::Trade, 0, 1);
    trade.payload.give_items = vec![BasketItem::gold(100.0)];
    trade.payload.receive_items = vec![BasketItem::gold(100.0)];

    let mut easy_context = context(relation(100.0, 100.0));
    easy_context.difficulty = Difficulty::Easy;
    let easy = evaluate_proposal(&trade, &easy_context);
    assert!(easy.accepted, "{}", easy.reason);
    assert_eq!(easy.pw_balance, Some(100.0));

    let mut hard_context = context(relation(100.0, 100.0));
    hard_context.difficulty = Difficulty::Hard;
    let hard = evaluate_proposal(&trade, &hard_context);
    assert!(!hard.accepted);
    assert_eq!(hard.pw_balance, Some(-100.0));
}

#[test]
fn trade_basket_valuation_multiplies_per_turn_currency_only() {
    let mut trade = proposal(ProposalAction::Trade, 0, 1);
    trade.payload.resource_trade_mode = Some(ResourceTradeMode::PerTurn);
    trade.payload.turns = Some(3.0);
    trade.payload.give_items = vec![BasketItem::gold(100.0)];
    trade.payload.receive_items = vec![BasketItem::new(
        BasketItemKind::Technology,
        "Garncarstwo",
        1.0,
    )];

    let result = evaluate_proposal(&trade, &context(relation(100.0, 100.0)));
    assert!(result.accepted, "{}", result.reason);
    assert_eq!(result.pw_balance, Some(260.0));
}

#[test]
fn alliance_sweetener_ease_is_measured_in_points() {
    let mut alliance = proposal(ProposalAction::DefensiveAlliance, 0, 1);
    alliance.payload.give_items = vec![BasketItem::gold(25.0)];
    let mut ctx = context(relation(89.0, 100.0));
    ctx.responder_willingness_ally = 1.0;

    let result = evaluate_proposal(&alliance, &ctx);
    assert!(!result.accepted);
    assert!(result.reason.contains("Zaufanie"));
}

#[test]
fn annexation_requires_vassal_economy_orientation() {
    let mut annexation = proposal(ProposalAction::Annexation, 0, 1);
    annexation.payload.gold_once = Some(200.0);
    let reversed = ActiveDeal {
        economy: Some(TreatyEconomy {
            payer_owner_id: 0,
            receiver_owner_id: 1,
            money_per_turn: 10.0,
        }),
        ..ActiveDeal::new(TreatyKind::Vassalization, 0, 1, 0, None)
    };
    let mut ctx = context(relation(100.0, 100.0));
    ctx.responder_is_city_state = true;
    ctx.proposer_respect = 100.0;
    ctx.wasal_age_turns = Some(10.0);
    ctx.active_deals = vec![reversed];

    let rejected = evaluate_proposal(&annexation, &ctx);
    assert!(!rejected.accepted);
    assert!(rejected.reason.contains("Brak aktywnej"));

    ctx.active_deals[0].economy = Some(TreatyEconomy {
        payer_owner_id: 1,
        receiver_owner_id: 0,
        money_per_turn: 10.0,
    });
    let accepted = evaluate_proposal(&annexation, &ctx);
    assert!(accepted.accepted, "{}", accepted.reason);
}

#[test]
fn peace_price_uses_treaty_duration_precedence_and_multiplier() {
    let mut peace = proposal(ProposalAction::Peace, 0, 1);
    peace.payload.give_pn = Some(500.0);
    peace.payload.turns = Some(20.0);
    peace.payload.treaty_turns = Some(10.0);
    let war_context = ProposalEvalContext {
        at_war: true,
        ..context(relation(50.0, 50.0))
    };

    let ten_turns = evaluate_proposal(&peace, &war_context);
    assert!(ten_turns.accepted, "{}", ten_turns.reason);

    peace.payload.treaty_turns = Some(20.0);
    peace.payload.give_pn = Some(1_999.0);
    let twenty_turns = evaluate_proposal(&peace, &war_context);
    assert!(!twenty_turns.accepted);

    peace.payload.give_pn = Some(2_000.0);
    let twenty_turns_paid = evaluate_proposal(&peace, &war_context);
    assert!(twenty_turns_paid.accepted, "{}", twenty_turns_paid.reason);

    peace.payload.treaty_turns = Some(15.0);
    peace.payload.give_pn = Some(500.0);
    let fifteen_turns = evaluate_proposal(&peace, &war_context);
    assert!(!fifteen_turns.accepted);

    peace.payload.give_pn = Some(1_000.0);
    let fifteen_turns_paid = evaluate_proposal(&peace, &war_context);
    assert!(fifteen_turns_paid.accepted, "{}", fifteen_turns_paid.reason);

    peace.payload.treaty_turns = Some(0.0);
    peace.payload.give_pn = Some(3_999.0);
    let indefinite = evaluate_proposal(&peace, &war_context);
    assert!(!indefinite.accepted);

    peace.payload.give_pn = Some(4_000.0);
    let indefinite_paid = evaluate_proposal(&peace, &war_context);
    assert!(indefinite_paid.accepted, "{}", indefinite_paid.reason);
}

#[test]
fn tribute_offer_zero_gold_once_keeps_recurring_deal() {
    let mut offer = proposal(ProposalAction::TributeOffer, 0, 1);
    offer.payload.gold_per_turn = Some(20.0);
    offer.payload.gold_once = Some(0.0);
    offer.payload.turns = Some(15.0);

    let result = evaluate_proposal(&offer, &context(relation(80.0, 80.0)));
    assert!(result.accepted, "{}", result.reason);
    assert!(!result.one_shot_trade);
    let deal = result.deal.expect("recurring tribute should create a deal");
    assert_eq!(deal.economy.unwrap().money_per_turn, 20.0);
}
