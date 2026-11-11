//! R-RUSTPORT-P6-WIRE-WAR-SIEGE-AIAI-TURN-Q1 (W7), obrona r1: sekwencyjnosc `run_ai_ai_peace_turn`
//! i memoizacja callbackow w obrebie wpisu. Testy z MUTUJACYM stanem (pay zmienia bilans zwyciezcy),
//! ktorych nie maja wektory z generatora (tam pay/finalize tylko loguja).

use std::cell::{Cell, RefCell};
use std::collections::HashSet;

use civ_engine::domain::diplomacy_ai_forced_peace::{
    register_ai_peace_request, AiPeaceAction, AiPeaceKind, AiPeaceRequestStore, AiPeaceTickAction,
    AiPeaceTickEnv, AiPeaceTickEnvV2, GateVerdict, PeaceBalanceShape, PeacePriceQuote,
};
use civ_engine::domain::diplomacy_multiwar_peace::{PeaceAsset, PeaceAssetKind, PeacePaymentPlan};
use civ_engine::domain::war_turn_ai_ai::run_ai_ai_peace_turn;

fn zloto(id: &str, amount: f64) -> PeaceAsset {
    PeaceAsset {
        kind: PeaceAssetKind::Zloto,
        id: id.to_string(),
        amount,
        pn: amount,
        forbidden: false,
    }
}

fn miasto(id: &str) -> PeaceAsset {
    PeaceAsset {
        kind: PeaceAssetKind::Miasto,
        id: id.to_string(),
        amount: 1.0,
        pn: 10.0,
        forbidden: false,
    }
}

#[test]
fn second_entry_gate_sees_payment_of_first_entry() {
    // Zwyciezca 0 ma bilans -10. Wpis A (przegrany 1, wymaga 10) placi 10 -> bilans 0.
    // Wpis B (przegrany 2, wymaga 5): bilans zwyciezcy po zaplacie = 0 + 5 = 5 >= 0 -> tick (accept_paid).
    // Kolejnosc "wszystko wycenione przed zaplata" widzialaby -10 + 5 = -5 i wstrzymalaby B.
    let winner_bal = Cell::new(-10.0_f64);
    let mut store = AiPeaceRequestStore::new();
    register_ai_peace_request(&mut store, "1,0", 1, 0, 0.0, AiPeaceKind::Pokoj);
    register_ai_peace_request(&mut store, "2,0", 2, 0, 0.0, AiPeaceKind::Pokoj);

    let pe = |_: i64, _: i64| true;
    let sh = |_: i64, _: i64| 0.2;
    let gt = |_: i64, _: i64| GateVerdict::Ok;
    let pr = |_: i64, loser: i64, _: AiPeaceKind| PeacePriceQuote {
        required_pn: if loser == 1 { 10.0 } else { 5.0 },
        tolerance_pn: 0.0,
        balance: PeaceBalanceShape::Linear {
            balance0: winner_bal.get(),
            slope: 1.0,
        },
    };
    let asf = |_: i64, _: i64, _: &HashSet<String>| -> Vec<PeaceAsset> { vec![zloto("g", 100.0)] };
    let cco = |_: &str, _: i64, _: i64| false;
    let base = AiPeaceTickEnv {
        turn: 1.0,
        limit: None,
        pair_eligible: &pe,
        requester_share_of: &sh,
        gate_verdict: &gt,
        price: &pr,
        assets: &asf,
        city_cession_ok: &cco,
        battle_pending: false,
    };
    let allowed = |_: i64, _: i64| true;
    let loser_bal = |_: i64, _: i64, _: AiPeaceKind, _: f64| Some(1000.0);
    let pay_log: RefCell<Vec<(i64, f64)>> = RefCell::new(Vec::new());
    let mut pay = |loser: i64, _: i64, plan: &PeacePaymentPlan| {
        pay_log.borrow_mut().push((loser, plan.covered_pn));
        winner_bal.set(winner_bal.get() + plan.covered_pn);
    };
    let mut fin = |_: i64, _: i64, _: AiPeaceKind| {};
    let mut log = |_: &str| {};

    let env = AiPeaceTickEnvV2 {
        base,
        peace_allowed: Some(&allowed),
        loser_balance_for: Some(&loser_bal),
    };
    let out = run_ai_ai_peace_turn(&mut store, &env, &mut pay, &mut fin, &mut log);

    assert_eq!(out.len(), 2);
    assert_eq!(out[0].action, AiPeaceTickAction::AcceptPaid);
    assert_eq!(out[1].action, AiPeaceTickAction::AcceptPaid);
    assert_eq!(*pay_log.borrow(), vec![(1, 10.0), (2, 5.0)]);
    assert_eq!(winner_bal.get(), 5.0);
    assert!(store.is_empty());
}

#[test]
fn asset_and_city_callbacks_are_memoized_within_one_entry() {
    // Jeden wpis. assets({}) zwraca miasto c1 (wartosc 10 = wymagane). cco("c1") = false -> skip {c1}
    // -> assets({c1}) zwraca zloto. Tick ma powtorzyc te same wyniki z pamieci: assets 2 razy, cco 1 raz.
    let assets_calls = Cell::new(0usize);
    let cco_calls = Cell::new(0usize);
    let mut store = AiPeaceRequestStore::new();
    register_ai_peace_request(&mut store, "1,0", 1, 0, 0.0, AiPeaceKind::Pokoj);

    let pe = |_: i64, _: i64| true;
    let sh = |_: i64, _: i64| 0.2;
    let gt = |_: i64, _: i64| GateVerdict::Ok;
    let pr = |_: i64, _: i64, _: AiPeaceKind| PeacePriceQuote {
        required_pn: 10.0,
        tolerance_pn: 0.0,
        balance: PeaceBalanceShape::Linear {
            balance0: 0.0,
            slope: 1.0,
        },
    };
    let asf = |_: i64, _: i64, skip: &HashSet<String>| -> Vec<PeaceAsset> {
        assets_calls.set(assets_calls.get() + 1);
        if skip.contains("c1") {
            vec![zloto("g", 100.0)]
        } else {
            vec![miasto("c1")]
        }
    };
    let cco = |_: &str, _: i64, _: i64| -> bool {
        cco_calls.set(cco_calls.get() + 1);
        false
    };
    let base = AiPeaceTickEnv {
        turn: 1.0,
        limit: None,
        pair_eligible: &pe,
        requester_share_of: &sh,
        gate_verdict: &gt,
        price: &pr,
        assets: &asf,
        city_cession_ok: &cco,
        battle_pending: false,
    };
    let allowed = |_: i64, _: i64| true;
    let loser_bal = |_: i64, _: i64, _: AiPeaceKind, _: f64| Some(1000.0);
    let mut pays = 0usize;
    let mut pay = |_: i64, _: i64, _: &PeacePaymentPlan| pays += 1;
    let mut fin = |_: i64, _: i64, _: AiPeaceKind| {};
    let mut log = |_: &str| {};

    let env = AiPeaceTickEnvV2 {
        base,
        peace_allowed: Some(&allowed),
        loser_balance_for: Some(&loser_bal),
    };
    let out = run_ai_ai_peace_turn(&mut store, &env, &mut pay, &mut fin, &mut log);

    assert_eq!(out.len(), 1);
    assert_eq!(out[0].action, AiPeaceTickAction::AcceptPaid);
    assert_eq!(pays, 1);
    assert_eq!(
        assets_calls.get(),
        2,
        "assets: po jednym wywolaniu na zbior pominiec"
    );
    assert_eq!(cco_calls.get(), 1, "cityCessionOk: raz na miasto");
}

#[test]
fn balance_hold_reports_decision_fields_and_keeps_entry_queued() {
    // Bilans zwyciezcy -20, plan pokrywa 10 -> po zaplacie -10 < 0: wait Z planem, bez zaplaty,
    // wpis zostaje. Decyzja niesie bilanse (zaokraglone) i tury od prosby, jak web.
    let mut store = AiPeaceRequestStore::new();
    register_ai_peace_request(&mut store, "1,0", 1, 0, 0.0, AiPeaceKind::Pokoj);

    let pe = |_: i64, _: i64| true;
    let sh = |_: i64, _: i64| 0.2;
    let gt = |_: i64, _: i64| GateVerdict::Ok;
    let pr = |_: i64, _: i64, _: AiPeaceKind| PeacePriceQuote {
        required_pn: 10.0,
        tolerance_pn: 0.0,
        balance: PeaceBalanceShape::Linear {
            balance0: -20.0,
            slope: 1.0,
        },
    };
    let asf = |_: i64, _: i64, _: &HashSet<String>| -> Vec<PeaceAsset> { vec![zloto("g", 10.0)] };
    let cco = |_: &str, _: i64, _: i64| false;
    let base = AiPeaceTickEnv {
        turn: 3.0,
        limit: None,
        pair_eligible: &pe,
        requester_share_of: &sh,
        gate_verdict: &gt,
        price: &pr,
        assets: &asf,
        city_cession_ok: &cco,
        battle_pending: false,
    };
    let allowed = |_: i64, _: i64| true;
    let loser_bal = |_: i64, _: i64, _: AiPeaceKind, _: f64| Some(1000.0);
    let mut pay = |_: i64, _: i64, _: &PeacePaymentPlan| panic!("zaplata niedozwolona");
    let mut fin = |_: i64, _: i64, _: AiPeaceKind| panic!("finalize niedozwolone");
    let mut log = |_: &str| {};

    let env = AiPeaceTickEnvV2 {
        base,
        peace_allowed: Some(&allowed),
        loser_balance_for: Some(&loser_bal),
    };
    let out = run_ai_ai_peace_turn(&mut store, &env, &mut pay, &mut fin, &mut log);

    assert_eq!(out.len(), 1);
    assert_eq!(out[0].action, AiPeaceTickAction::Wait);
    assert!(out[0].plan.is_some());
    let d = out[0].decision.as_ref().expect("decyzja wait z bilansem");
    assert_eq!(d.action, AiPeaceAction::Wait);
    assert_eq!(d.balance_before, -20.0);
    assert_eq!(d.balance_after, -10.0);
    assert_eq!(d.turns_since, 3.0);
    assert!(store.has("1,0"));
}

#[test]
fn loser_balance_none_checks_only_winner_balance() {
    // Web isAiAiPeaceBalanceAllowed(winner, loser|undefined, min): gdy loserBalanceFor zwraca undefined,
    // bilans przegranego NIE jest sprawdzany. Ten sam wpis i ten sam bilans zwyciezcy po zaplacie (= 10):
    // loser = None -> accept_paid (jedna zaplata); loser = Some(-1000) -> wait (zadnej zaplaty, wpis zostaje).
    fn run(loser_after: Option<f64>) -> (Vec<AiPeaceTickAction>, Vec<(i64, f64)>, bool) {
        let winner_bal = Cell::new(0.0_f64);
        let mut store = AiPeaceRequestStore::new();
        register_ai_peace_request(&mut store, "1,0", 1, 0, 0.0, AiPeaceKind::Pokoj);
        let pe = |_: i64, _: i64| true;
        let sh = |_: i64, _: i64| 0.2;
        let gt = |_: i64, _: i64| GateVerdict::Ok;
        let pr = |_: i64, _: i64, _: AiPeaceKind| PeacePriceQuote {
            required_pn: 10.0,
            tolerance_pn: 0.0,
            balance: PeaceBalanceShape::Linear {
                balance0: winner_bal.get(),
                slope: 1.0,
            },
        };
        let asf =
            |_: i64, _: i64, _: &HashSet<String>| -> Vec<PeaceAsset> { vec![zloto("g", 100.0)] };
        let cco = |_: &str, _: i64, _: i64| false;
        let base = AiPeaceTickEnv {
            turn: 1.0,
            limit: None,
            pair_eligible: &pe,
            requester_share_of: &sh,
            gate_verdict: &gt,
            price: &pr,
            assets: &asf,
            city_cession_ok: &cco,
            battle_pending: false,
        };
        let allowed = |_: i64, _: i64| true;
        let loser_bal = move |_: i64, _: i64, _: AiPeaceKind, _: f64| loser_after;
        let pay_log: RefCell<Vec<(i64, f64)>> = RefCell::new(Vec::new());
        let mut pay = |loser: i64, _: i64, plan: &PeacePaymentPlan| {
            pay_log.borrow_mut().push((loser, plan.covered_pn));
            winner_bal.set(winner_bal.get() + plan.covered_pn);
        };
        let mut fin = |_: i64, _: i64, _: AiPeaceKind| {};
        let mut log = |_: &str| {};
        let env = AiPeaceTickEnvV2 {
            base,
            peace_allowed: Some(&allowed),
            loser_balance_for: Some(&loser_bal),
        };
        let out = run_ai_ai_peace_turn(&mut store, &env, &mut pay, &mut fin, &mut log);
        let actions = out.iter().map(|o| o.action).collect();
        let pays = pay_log.borrow().clone();
        (actions, pays, store.has("1,0"))
    }

    let (actions, pays, still_stored) = run(None);
    assert_eq!(actions, vec![AiPeaceTickAction::AcceptPaid]);
    assert_eq!(pays, vec![(1, 10.0)]);
    assert!(!still_stored);

    let (actions, pays, still_stored) = run(Some(-1000.0));
    assert_eq!(actions, vec![AiPeaceTickAction::Wait]);
    assert!(pays.is_empty());
    assert!(still_stored);
}
