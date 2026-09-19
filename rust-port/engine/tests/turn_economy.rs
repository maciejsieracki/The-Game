use civ_engine::domain::turn_economy::{
    resolve_turn, EconomyBalances, EconomyFlow, TurnEconomy, TurnEconomyError,
};

fn income() -> EconomyFlow {
    EconomyFlow {
        treasury: 8,
        science: 4,
        culture: 2,
        food: 10,
        work: 12,
        resources: [("drewno".to_owned(), 20), ("kamien".to_owned(), 3)]
            .into_iter()
            .collect(),
    }
}

#[test]
fn settlement_credits_income_before_paying_expenses() {
    let mut economy = TurnEconomy::from_parts(
        7,
        EconomyBalances {
            treasury: 5,
            work: 1,
            ..EconomyBalances::zero()
        },
    )
    .expect("valid turn");
    let expenses = EconomyFlow {
        treasury: 12,
        work: 10,
        ..EconomyFlow::zero()
    };

    let result = economy
        .settle_turn(income(), &expenses)
        .expect("turn settles");

    assert_eq!(result.turn, 7);
    assert_eq!(result.next_turn, 8);
    assert_eq!(result.paid.treasury, 12, "5 + 8 income pays the full cost");
    assert_eq!(result.unpaid.treasury, 0);
    assert_eq!(
        result.paid.work, 10,
        "existing and current-turn Work are spendable"
    );
    assert_eq!(result.unpaid.work, 0);
    assert_eq!(result.after.treasury, 1);
    assert_eq!(result.after.work, 0, "Work resets after spending");
    assert_eq!(result.work_reset, 3);
    assert_eq!(economy.turn(), 8);
}

#[test]
fn resource_costs_are_paid_independently_and_never_underflow() {
    let mut economy = TurnEconomy::new();
    economy
        .balances_mut()
        .resources
        .insert("drewno".to_owned(), 5);

    let expenses = EconomyFlow {
        treasury: 3,
        food: 4,
        resources: [("drewno".to_owned(), 8), ("kamien".to_owned(), 2)]
            .into_iter()
            .collect(),
        ..EconomyFlow::zero()
    };
    let result = economy
        .settle_turn(EconomyFlow::zero(), &expenses)
        .expect("turn settles despite deficits");

    assert_eq!(result.paid.treasury, 0);
    assert_eq!(result.unpaid.treasury, 3);
    assert_eq!(result.paid.food, 0);
    assert_eq!(result.unpaid.food, 4);
    assert_eq!(result.paid.resources.get("drewno"), Some(&5));
    assert_eq!(result.unpaid.resources.get("drewno"), Some(&3));
    assert_eq!(result.unpaid.resources.get("kamien"), Some(&2));
    assert!(result.unpaid.has_deficit());
    assert_eq!(economy.balances().resource("drewno"), 0);
    assert_eq!(economy.balances().resource("kamien"), 0);
}

#[test]
fn unused_work_is_reset_but_persistent_balances_carry_forward() {
    let mut economy = TurnEconomy::new();
    let first = economy
        .settle_turn(
            EconomyFlow {
                treasury: 9,
                work: 6,
                ..EconomyFlow::zero()
            },
            &EconomyFlow {
                work: 2,
                ..EconomyFlow::zero()
            },
        )
        .expect("first turn settles");

    assert_eq!(first.work_reset, 4);
    assert_eq!(first.after.work, 0);
    assert_eq!(first.after.treasury, 9);

    let second = economy
        .settle_turn(EconomyFlow::zero(), &EconomyFlow::zero())
        .expect("second turn settles");
    assert_eq!(second.before.treasury, 9);
    assert_eq!(second.before.work, 0);
    assert_eq!(second.after.treasury, 9);
    assert_eq!(second.next_turn, 3);
}

#[test]
fn pure_preview_does_not_mutate_input_balances() {
    let balances = EconomyBalances {
        treasury: 10,
        resources: [("drewno".to_owned(), 4)].into_iter().collect(),
        ..EconomyBalances::zero()
    };
    let expenses = EconomyFlow {
        treasury: 3,
        resources: [("drewno".to_owned(), 2)].into_iter().collect(),
        ..EconomyFlow::zero()
    };

    let result = resolve_turn(4, &balances, income(), &expenses).expect("preview settles");

    assert_eq!(result.after.treasury, 15);
    assert_eq!(result.after.resource("drewno"), 22);
    assert_eq!(balances.treasury, 10);
    assert_eq!(balances.resource("drewno"), 4);
}

#[test]
fn settlement_and_balances_round_trip_through_serde() {
    let mut economy = TurnEconomy::new();
    economy
        .settle_turn(income(), &EconomyFlow::zero())
        .expect("turn settles");

    let encoded = serde_json::to_string(&economy).expect("economy serializes");
    let decoded: TurnEconomy = serde_json::from_str(&encoded).expect("economy deserializes");
    assert_eq!(decoded, economy);
    assert_eq!(decoded.balances().resource("drewno"), 20);
    assert_eq!(decoded.balances().work, 0);
}

#[test]
fn invalid_and_overflow_turn_boundaries_are_rejected_without_mutation() {
    assert_eq!(
        TurnEconomy::from_parts(0, EconomyBalances::zero()),
        Err(TurnEconomyError::InvalidTurn(0))
    );

    let mut economy = TurnEconomy::from_parts(u32::MAX, EconomyBalances::zero())
        .expect("maximum turn is valid until settlement");
    let before = economy.clone();
    assert_eq!(
        economy.settle_turn(income(), &EconomyFlow::zero()),
        Err(TurnEconomyError::TurnOverflow)
    );
    assert_eq!(economy, before, "overflow is a transactional no-op");

    let invalid_json = r#"{"turn":0,"balances":{"treasury":0,"science":0,"culture":0,"food":0,"work":0,"resources":{}}}"#;
    let decoded: Result<TurnEconomy, _> = serde_json::from_str(invalid_json);
    assert!(
        decoded.is_err(),
        "serialized ledgers keep the one-based invariant"
    );
}

#[test]
fn flow_helpers_are_deterministic_and_saturating() {
    let mut flow = EconomyFlow::zero();
    flow.add_resource("drewno", u64::MAX);
    flow.add_resource("drewno", 1);
    assert_eq!(flow.resource("drewno"), u64::MAX);
    assert!(!flow.is_zero());
    assert!(EconomyFlow::zero().is_zero());
    assert!(resolve_turn(0, &EconomyBalances::zero(), flow, &EconomyFlow::zero()).is_err());
}
