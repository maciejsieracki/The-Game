//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1 (runda 3, partia B): zgodnosc `run_war_weariness_tick` z URUCHOMIONYM
//! webem (origin/main 5dd53e60f, `runWarWearinessTick` w gra/src/game/war-weariness.ts).
//! Wektory: `tests/p6_dyplo_multiwar2_tick_data/tick.json`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1/gen-weariness-tick.mts`.
//! Wejscia (sekwencje tur, store, wyceny, aktywa) i wyniki (outcomes, pays, finalizes, store) z weba.
//! Pole `logs` = liczba wywolan `d.log` (tekst pomijany: `toFixed`).

use civ_engine::domain::diplomacy_multiwar::{war_weariness_level, WAR_WEARINESS_PARAMS};
use civ_engine::domain::diplomacy_multiwar_peace::{
    PeaceAsset, PeaceAssetKind, PeaceHistogram, PeacePaymentPlan, WarWearinessPairState,
    WarWearinessStore,
};
use civ_engine::domain::diplomacy_war_weariness_tick::*;
use serde_json::Value;
use std::collections::HashSet;

const TICK: &str = include_str!("p6_dyplo_multiwar2_tick_data/tick.json");

/// Liczba jako JSON-number lub string (`"NaN"`).
fn num(v: &Value) -> f64 {
    if let Some(f) = v.as_f64() {
        return f;
    }
    match v
        .as_str()
        .unwrap_or_else(|| panic!("liczba oczekiwana, jest {v}"))
    {
        "NaN" => f64::NAN,
        s => s
            .parse::<f64>()
            .unwrap_or_else(|_| panic!("nie liczba: {s}")),
    }
}

fn same(actual: f64, expected: &Value, ctx: &str) {
    let e = num(expected);
    if e.is_nan() {
        assert!(actual.is_nan(), "{ctx}: oczekiwano NaN, jest {actual}");
    } else {
        assert!(
            actual == e || (actual - e).abs() <= 1e-12 * e.abs().max(1.0),
            "{ctx}: {actual} != {e}"
        );
    }
}

fn kind(s: &str) -> PeaceAssetKind {
    match s {
        "zloto" => PeaceAssetKind::Zloto,
        "surowiec_ilosc" => PeaceAssetKind::SurowiecIlosc,
        "miasto" => PeaceAssetKind::Miasto,
        other => panic!("nieznany rodzaj aktywa {other}"),
    }
}

fn action_name(a: WearinessAction) -> &'static str {
    match a {
        WearinessAction::None => "none",
        WearinessAction::MutualPeace => "mutual_peace",
        WearinessAction::OfferAccepted => "offer_accepted",
        WearinessAction::OfferRejected => "offer_rejected",
    }
}

fn pair_key(a: i64, b: i64) -> String {
    if a < b {
        format!("{a}-{b}")
    } else {
        format!("{b}-{a}")
    }
}

fn info_of(v: &Value) -> WearinessWarInfo {
    WearinessWarInfo {
        war_start: num(&v["warStart"]),
        turns_at_war: num(&v["turnsAtWar"]),
        lost_a: num(&v["lostA"]),
        lost_b: num(&v["lostB"]),
        turns_since_city_change: num(&v["turnsSinceCityChange"]),
    }
}

fn check_plan(plan: &PeacePaymentPlan, e: &Value, ctx: &str) {
    let ids: Vec<&str> = e["ids"]
        .as_array()
        .unwrap()
        .iter()
        .map(|x| x.as_str().unwrap())
        .collect();
    let got: Vec<&str> = plan.items.iter().map(|i| i.id.as_str()).collect();
    assert_eq!(got, ids, "{ctx}: ids planu");
    same(
        plan.covered_pn,
        &e["coveredPn"],
        &format!("{ctx}: coveredPn"),
    );
    assert_eq!(plan.full, e["full"].as_bool().unwrap(), "{ctx}: full");
    let h = &e["histogram"];
    assert_eq!(
        plan.histogram,
        PeaceHistogram {
            zloto: h["zloto"].as_i64().unwrap(),
            surowiec_ilosc: h["surowiec_ilosc"].as_i64().unwrap(),
            miasto: h["miasto"].as_i64().unwrap(),
        },
        "{ctx}: histogram"
    );
}

#[test]
fn run_war_weariness_tick_matches_web() {
    let doc: Value = serde_json::from_str(TICK).unwrap();
    let scenarios = doc["scenarios"].as_array().unwrap();
    let mut n_ticks = 0;
    let mut n_actions = std::collections::BTreeMap::<&str, usize>::new();

    for sc in scenarios {
        let name = sc["name"].as_str().unwrap();
        let mut store: WarWearinessStore = Default::default();
        for e in sc["store0"].as_array().unwrap() {
            store.insert(
                e["key"].as_str().unwrap().to_string(),
                WarWearinessPairState {
                    war_start: num(&e["state"]["warStart"]),
                    peak: num(&e["state"]["peak"]),
                    stage: e["state"]["stage"].as_i64().unwrap(),
                    rejected_offers: e["state"]["rejectedOffers"].as_i64().unwrap(),
                    last_offer_turn: num(&e["state"]["lastOfferTurn"]),
                },
            );
        }

        for (ti, (t_in, t_exp)) in sc["ticks"]
            .as_array()
            .unwrap()
            .iter()
            .zip(sc["expect"].as_array().unwrap())
            .enumerate()
        {
            let ctx0 = format!("{name} tura#{ti}");
            let turn = num(&t_in["turn"]);
            let pairs: Vec<(i64, i64)> = t_in["pairs"]
                .as_array()
                .unwrap()
                .iter()
                .map(|p| (p[0].as_i64().unwrap(), p[1].as_i64().unwrap()))
                .collect();
            let info = &t_in["info"];
            let share = &t_in["share"];
            let cities = &t_in["cities"];
            let price = &t_in["price"];
            let assets_in = &t_in["assets"];
            let not_ok: Vec<&str> = t_in["notOk"]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_str().unwrap())
                .collect();
            let battle_pending = t_in["battlePending"].as_bool().unwrap();

            let assets_of = |l: i64, w: i64, skip: &HashSet<String>| -> Vec<PeaceAsset> {
                let key = format!("{l}:{w}");
                assets_in[key.as_str()]
                    .as_array()
                    .map(|arr| {
                        arr.iter()
                            .filter(|a| !skip.contains(a["id"].as_str().unwrap()))
                            .map(|a| PeaceAsset {
                                kind: kind(a["kind"].as_str().unwrap()),
                                id: a["id"].as_str().unwrap().to_string(),
                                amount: num(&a["amount"]),
                                pn: num(&a["pn"]),
                                forbidden: a["forbidden"].as_bool().unwrap_or(false),
                            })
                            .collect()
                    })
                    .unwrap_or_default()
            };
            let pk = |a: i64, b: i64| pair_key(a, b);
            let wi = |a: i64, b: i64| info_of(&info[format!("{a}:{b}").as_str()]);
            let sh = |x: i64, y: i64| num(&share[format!("{x}:{y}").as_str()]);
            // Brak klucza = `undefined` w webie: wartość używana dopiero po wczesnych wyjściach
            // (ownCities nie wpływa na wynik tych ścieżek), więc tu 0.0 jest neutralne.
            let cc = |o: i64| {
                cities
                    .get(o.to_string().as_str())
                    .filter(|v| !v.is_null())
                    .map(num)
                    .unwrap_or(0.0)
            };
            let pr = |w: i64, l: i64| {
                let p = &price[format!("{w}:{l}").as_str()];
                PeacePriceQuote {
                    required_pn: num(&p["requiredPn"]),
                    tolerance_pn: num(&p["tolerancePn"]),
                    balance0: num(&p["balance0"]),
                    slope: num(&p["slope"]),
                }
            };
            let ok = |id: &str, _l: i64, _w: i64| !not_ok.contains(&id);

            let env = WearinessTickEnv {
                pair_key: &pk,
                war_info: &wi,
                share_of: &sh,
                city_count_of: &cc,
                price: &pr,
                assets: &assets_of,
                city_cession_ok: &ok,
                battle_pending,
            };

            let mut pays: Vec<(i64, i64, Vec<String>, f64)> = Vec::new();
            let mut fins: Vec<(i64, i64, f64)> = Vec::new();
            let mut logs = 0usize;
            let outs = run_war_weariness_tick(
                &mut store,
                turn,
                &pairs,
                &env,
                |l, w, plan| {
                    pays.push((
                        l,
                        w,
                        plan.items.iter().map(|i| i.id.clone()).collect(),
                        plan.covered_pn,
                    ));
                },
                |l, w, lock| fins.push((l, w, lock)),
                |_m| logs += 1,
            );

            // outcomes
            let exp_outs = t_exp["outcomes"].as_array().unwrap();
            assert_eq!(outs.len(), exp_outs.len(), "{ctx0}: liczba wynikow");
            for (i, (o, e)) in outs.iter().zip(exp_outs).enumerate() {
                let ctx = format!("{ctx0} wynik#{i}");
                assert_eq!(o.pair_key, e["pairKey"].as_str().unwrap(), "{ctx}: pairKey");
                assert_eq!(
                    action_name(o.action),
                    e["action"].as_str().unwrap(),
                    "{ctx}: action"
                );
                *n_actions.entry(action_name(o.action)).or_default() += 1;
                same(o.level, &e["level"], &format!("{ctx}: level"));
                assert_eq!(o.stage, e["stage"].as_i64().unwrap(), "{ctx}: stage");
                match (&o.plan, e["plan"].is_null()) {
                    (None, true) => {}
                    (Some(p), false) => check_plan(p, &e["plan"], &ctx),
                    _ => panic!("{ctx}: plan obecny/brak niezgodny z webem"),
                }
            }

            // side effects
            let exp_pays = t_exp["pays"].as_array().unwrap();
            assert_eq!(pays.len(), exp_pays.len(), "{ctx0}: liczba pay");
            for (i, (p, e)) in pays.iter().zip(exp_pays).enumerate() {
                let ctx = format!("{ctx0} pay#{i}");
                assert_eq!(
                    (p.0, p.1),
                    (e["loser"].as_i64().unwrap(), e["winner"].as_i64().unwrap()),
                    "{ctx}"
                );
                let ids: Vec<&str> = e["ids"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|x| x.as_str().unwrap())
                    .collect();
                assert_eq!(
                    p.2.iter().map(String::as_str).collect::<Vec<_>>(),
                    ids,
                    "{ctx}: ids"
                );
                same(p.3, &e["coveredPn"], &format!("{ctx}: coveredPn"));
            }
            let exp_fins = t_exp["finalizes"].as_array().unwrap();
            assert_eq!(fins.len(), exp_fins.len(), "{ctx0}: liczba finalize");
            for (i, (f, e)) in fins.iter().zip(exp_fins).enumerate() {
                let ctx = format!("{ctx0} finalize#{i}");
                assert_eq!(f.0, e["loser"].as_i64().unwrap(), "{ctx}: loser");
                assert_eq!(f.1, e["winner"].as_i64().unwrap(), "{ctx}: winner");
                same(f.2, &e["lockTurns"], &format!("{ctx}: lockTurns"));
            }
            assert_eq!(
                logs as i64,
                t_exp["logs"].as_i64().unwrap(),
                "{ctx0}: liczba logow"
            );

            // stan store po ticku (posortowany po kluczu, jak w generatorze)
            let mut snap: Vec<(&String, &WarWearinessPairState)> = store.iter().collect();
            snap.sort_by(|a, b| a.0.cmp(b.0));
            let exp_store = t_exp["store"].as_array().unwrap();
            assert_eq!(snap.len(), exp_store.len(), "{ctx0}: liczba wpisow store");
            for ((k, s), e) in snap.iter().zip(exp_store) {
                let ctx = format!("{ctx0} store[{k}]");
                assert_eq!(k.as_str(), e["key"].as_str().unwrap(), "{ctx}: klucz");
                same(s.war_start, &e["warStart"], &format!("{ctx}: warStart"));
                same(s.peak, &e["peak"], &format!("{ctx}: peak"));
                assert_eq!(s.stage, e["stage"].as_i64().unwrap(), "{ctx}: stage");
                assert_eq!(
                    s.rejected_offers,
                    e["rejectedOffers"].as_i64().unwrap(),
                    "{ctx}: rejectedOffers"
                );
                same(
                    s.last_offer_turn,
                    &e["lastOfferTurn"],
                    &format!("{ctx}: lastOfferTurn"),
                );
            }
            n_ticks += 1;
        }
    }
    assert_eq!(
        scenarios.len(),
        30,
        "liczba scenariuszy (16 bazowych + 14 granicznych r5)"
    );
    assert_eq!(n_ticks, 37, "liczba tur");
    // Każda gałąź decyzyjna ma co najmniej jeden przypadek w wektorach.
    for a in ["none", "mutual_peace", "offer_accepted", "offer_rejected"] {
        assert!(
            n_actions.get(a).copied().unwrap_or(0) > 0,
            "brak wektora dla {a}"
        );
    }
}

fn base_env_pieces() -> (WearinessWarInfo, PeacePriceQuote) {
    (
        WearinessWarInfo {
            war_start: 0.0,
            turns_at_war: 0.0,
            lost_a: 0.0,
            lost_b: 0.0,
            turns_since_city_change: 0.0,
        },
        PeacePriceQuote {
            required_pn: 100.0,
            tolerance_pn: 0.0,
            balance0: 0.0,
            slope: 1.0,
        },
    )
}

/// Granice progów (N-1 / N / N+1) dla oferty przegrywającego: start oferty od tury 8, cooldown 3 tury.
#[test]
fn offer_threshold_boundaries_n_minus_1_n_n_plus_1() {
    let (_, q) = base_env_pieces();
    let assets = vec![PeaceAsset {
        kind: PeaceAssetKind::Zloto,
        id: "g".into(),
        amount: 1000.0,
        pn: 1000.0,
        forbidden: false,
    }];
    let run_at = |turns: f64, lost_a: f64| -> WearinessAction {
        let mut store: WarWearinessStore = Default::default();
        let info = WearinessWarInfo {
            war_start: 0.0,
            turns_at_war: turns,
            lost_a,
            lost_b: 0.0,
            turns_since_city_change: turns,
        };
        let pk = |a: i64, b: i64| pair_key(a, b);
        let wi = move |_a: i64, _b: i64| info;
        let sh = |x: i64, _y: i64| if x == 1 { 0.3 } else { 0.7 };
        let cc = |_o: i64| 6.0;
        let pr = move |_w: i64, _l: i64| q;
        let asg = |_l: i64, _w: i64, _s: &HashSet<String>| assets.clone();
        let ok = |_id: &str, _l: i64, _w: i64| true;
        let env = WearinessTickEnv {
            pair_key: &pk,
            war_info: &wi,
            share_of: &sh,
            city_count_of: &cc,
            price: &pr,
            assets: &asg,
            city_cession_ok: &ok,
            battle_pending: false,
        };
        let outs = run_war_weariness_tick(
            &mut store,
            0.0,
            &[(1, 2)],
            &env,
            |_, _, _| {},
            |_, _, _| {},
            |_| {},
        );
        outs[0].action
    };
    // Z utratą miasta: start od 8 tur (ofertaOdTurWojny = 8); N-1 = 7 blokuje, N = 8 i N+1 = 9 przepuszczają.
    assert_eq!(run_at(7.0, 1.0), WearinessAction::None);
    assert_ne!(run_at(8.0, 1.0), WearinessAction::None);
    assert_ne!(run_at(9.0, 1.0), WearinessAction::None);
}

/// Cooldown: N-1 (2 tury) blokuje, N (3 tury) przepuszcza, jak w webie (`d.turn - last < 3`).
#[test]
fn cooldown_boundary_n_minus_1_n() {
    let mut store: WarWearinessStore = Default::default();
    let pk = |a: i64, b: i64| pair_key(a, b);
    let wi = |_a: i64, _b: i64| WearinessWarInfo {
        war_start: 0.0,
        turns_at_war: 30.0,
        lost_a: 1.0,
        lost_b: 0.0,
        turns_since_city_change: 30.0,
    };
    let sh = |x: i64, _y: i64| if x == 1 { 0.3 } else { 0.7 };
    let cc = |_o: i64| 6.0;
    let pr = |_w: i64, _l: i64| PeacePriceQuote {
        required_pn: 100.0,
        tolerance_pn: 0.0,
        balance0: -10_000.0,
        slope: 1.0,
    };
    let asg = |_l: i64, _w: i64, _s: &HashSet<String>| {
        vec![PeaceAsset {
            kind: PeaceAssetKind::Zloto,
            id: "g".into(),
            amount: 10.0,
            pn: 10.0,
            forbidden: false,
        }]
    };
    let ok = |_id: &str, _l: i64, _w: i64| true;
    let mut run = |turn: f64| -> WearinessAction {
        let env = WearinessTickEnv {
            pair_key: &pk,
            war_info: &wi,
            share_of: &sh,
            city_count_of: &cc,
            price: &pr,
            assets: &asg,
            city_cession_ok: &ok,
            battle_pending: false,
        };
        run_war_weariness_tick(
            &mut store,
            turn,
            &[(1, 2)],
            &env,
            |_, _, _| {},
            |_, _, _| {},
            |_| {},
        )[0]
        .action
    };
    assert_eq!(run(30.0), WearinessAction::OfferRejected);
    assert_eq!(
        run(32.0),
        WearinessAction::None,
        "N-1: 2 tury po ofercie = cooldown"
    );
    assert_eq!(
        run(33.0),
        WearinessAction::OfferRejected,
        "N: 3 tury = koniec cooldownu"
    );
}

/// Oferta przegrywającego (tura 30, strata 1 miasta, udział 0.3, wymagane 150 PW, zapłata złotem 150 PW).
/// Zwraca akcję i listę `finalize`.
fn one_offer(balance0: f64, slope: f64) -> (WearinessAction, Vec<(i64, i64, f64)>) {
    let mut store: WarWearinessStore = Default::default();
    let info = WearinessWarInfo {
        war_start: 0.0,
        turns_at_war: 30.0,
        lost_a: 1.0,
        lost_b: 0.0,
        turns_since_city_change: 30.0,
    };
    let pk = |a: i64, b: i64| pair_key(a, b);
    let wi = move |_a: i64, _b: i64| info;
    let sh = |x: i64, _y: i64| if x == 1 { 0.3 } else { 0.7 };
    let cc = |_o: i64| 6.0;
    let pr = move |_w: i64, _l: i64| PeacePriceQuote {
        required_pn: 100.0,
        tolerance_pn: 0.0,
        balance0,
        slope,
    };
    let asg = |_l: i64, _w: i64, _s: &HashSet<String>| {
        vec![PeaceAsset {
            kind: PeaceAssetKind::Zloto,
            id: "g".into(),
            amount: 150.0,
            pn: 150.0,
            forbidden: false,
        }]
    };
    let ok = |_id: &str, _l: i64, _w: i64| true;
    let env = WearinessTickEnv {
        pair_key: &pk,
        war_info: &wi,
        share_of: &sh,
        city_count_of: &cc,
        price: &pr,
        assets: &asg,
        city_cession_ok: &ok,
        battle_pending: false,
    };
    let mut fins = Vec::new();
    let outs = run_war_weariness_tick(
        &mut store,
        30.0,
        &[(1, 2)],
        &env,
        |_, _, _| {},
        |l, w, t| fins.push((l, w, t)),
        |_| {},
    );
    (outs[0].action, fins)
}

/// Granica bilansu (>= -tol) i człon tolerancji symetrii zmęczenia (0.5 * poziom * wymagane = 0.5*0.18*150 = 13.5).
#[test]
fn balance_boundary_and_fatigue_tolerance() {
    // Tolerancja = 0 + (0.5 * poziom) * wymagane (ta sama kolejność działań co w porcie).
    let lvl = war_weariness_level(30.0, 1.0, Some(30.0), &WAR_WEARINESS_PARAMS);
    let tol = 0.0 + (0.5 * lvl) * 150.0;
    // Bilans dokładnie = -tol (slope 0, więc bilans = balance0 bez zaokrągleń): przyjęcie (>=).
    let (a, fins) = one_offer(-tol, 0.0);
    assert_eq!(a, WearinessAction::OfferAccepted, "bilans = -tol");
    assert_eq!(fins, vec![(1, 2, 40.0)]);
    // Tuż poniżej granicy: odrzucenie.
    assert_eq!(
        one_offer(-tol - 1.0, 0.0).0,
        WearinessAction::OfferRejected,
        "poza tolerancją"
    );
    // Bilans -10 (slope 1, zapłata 150) mieści się w tolerancji 13.5: przyjęcie.
    assert_eq!(
        one_offer(-160.0, 1.0).0,
        WearinessAction::OfferAccepted,
        "tolerancja zmęczenia"
    );
    // Bilans -20 (slope 1) wykracza poza tolerancję 13.5: odrzucenie.
    assert_eq!(
        one_offer(-170.0, 1.0).0,
        WearinessAction::OfferRejected,
        "poza tolerancją"
    );
}

/// NaN w cenie / udziale: brak paniki, zachowanie jak w JS (porównania fałszywe).
#[test]
fn nan_share_selects_b_as_loser() {
    let mut store: WarWearinessStore = Default::default();
    let pk = |a: i64, b: i64| pair_key(a, b);
    let wi = |_a: i64, _b: i64| WearinessWarInfo {
        war_start: 0.0,
        turns_at_war: 200.0,
        lost_a: 0.0,
        lost_b: 0.0,
        turns_since_city_change: 200.0,
    };
    let sh = |_x: i64, _y: i64| f64::NAN;
    let cc = |_o: i64| 6.0;
    let pr = |_w: i64, _l: i64| PeacePriceQuote {
        required_pn: 1.0,
        tolerance_pn: 0.0,
        balance0: 0.0,
        slope: 1.0,
    };
    let asg = |_l: i64, _w: i64, _s: &HashSet<String>| Vec::new();
    let ok = |_id: &str, _l: i64, _w: i64| true;
    let mut fins = Vec::new();
    let env = WearinessTickEnv {
        pair_key: &pk,
        war_info: &wi,
        share_of: &sh,
        city_count_of: &cc,
        price: &pr,
        assets: &asg,
        city_cession_ok: &ok,
        battle_pending: false,
    };
    let outs = run_war_weariness_tick(
        &mut store,
        200.0,
        &[(1, 2)],
        &env,
        |_, _, _| {},
        |l, w, t| fins.push((l, w, t)),
        |_| {},
    );
    assert_eq!(outs[0].action, WearinessAction::MutualPeace);
    assert_eq!(fins, vec![(2, 1, 40.0)], "NaN udzial: przegrany = b (2)");
}
