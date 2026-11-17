//! P6-WIRE-R7K7C (runda 3, zarzuty obrony 1, 2, 4): produkcyjna sciezka platnosci Praca w `advance_turn`.
//!
//! Przeplyw: `advance_turn` -> `run_diplomacy_war_phase` -> `tick_cyclic_resource_trade_deals`
//! (bramka `praca_of(kupujacy) >= z`, pin `main.ts:24155`) -> `apply_cyclic_outcome` -> `pay_work_floored`
//! (zapis, pin `main.ts:24015-24016` + podloga `main.ts:34879-34882`) -> `apply_dipl_deltas_to_state`.
//!
//! Oczekiwane wartosci wyprowadzone z formul pinu (rachunek recznie wedlug powyzszych linii, bez uruchamiania
//! pinu w tym tescie; wektory D3 w `p6_r7k7c_d3.rs` pochodza z generatora). Scenariusze:
//!   A) jedna umowa Praca 30/tura, kupujacy = gracz (pula 50): tura 1 zaplacona (50 -> 20, sprzedawca 0 -> 30),
//!      tura 2 bramka 20 < 30 -> brak dostawy, salda bez zmian.
//!   B) dwie umowy Praca od tego samego platnika (gracz, pula 50) do dwoch sprzedawcow (AI 2, AI 3), 30/tura.
//!      Kolejnosc umow w `deals` ma znaczenie: X przed Y -> (gracz 20, AI2 30, AI3 0); Y przed X -> (20, 0, 30).

use civ_engine::domain::diplomacy::{ActiveDeal, CyclicResourceTransfer, PaymentKind, TreatyKind};
use civ_engine::domain::playable::{
    PlayableCity, PlayableGame, StartGameParams, FOUNDING_CITY_POPULATION,
};
use civ_engine::domain::{CityId, PlayerId, PositionDto};

const HUMAN: u64 = 1;
const AI2: u64 = 2;
const AI3: u64 = 3;

fn cyclic_work(seller: u64) -> CyclicResourceTransfer {
    CyclicResourceTransfer {
        resource_key: "drewno".to_owned(),
        units_per_turn: 10.0,
        seller_owner_id: PlayerId::new(seller),
        buyer_owner_id: PlayerId::new(HUMAN),
        payment: Some(PaymentKind::Work),
        payment_per_turn: 30.0,
        seller_failed_turns: 0,
        buyer_failed_turns: 0,
    }
}

fn work_deal(id: &str, seller: u64) -> ActiveDeal {
    let mut d = ActiveDeal::new(
        TreatyKind::TradeRoute,
        PlayerId::new(HUMAN),
        PlayerId::new(seller),
        1,
        None,
    );
    d.id = id.to_owned();
    d.cyclic_resource_transfers = vec![cyclic_work(seller)];
    d
}

/// Scenariusz wspolny: gracz z pula Pracy 50, sprzedawcy AI 2 i AI 3 z miastami-stolicami i zapasem drewna.
fn scenario(deals: Vec<ActiveDeal>) -> PlayableGame {
    let mut game = PlayableGame::new(StartGameParams {
        seed: 11,
        ..StartGameParams::default()
    })
    .expect("scenario");
    game.add_player(AI2, "AI2".to_owned()).expect("ai2");
    game.add_player(AI3, "AI3".to_owned()).expect("ai3");
    let mut state = game.state().clone();
    for (city, owner) in [(900u64, AI2), (901u64, AI3)] {
        state.cities.push(PlayableCity {
            id: CityId::new(city),
            owner_id: PlayerId::new(owner),
            name: format!("city-{owner}"),
            position: PositionDto::new(5, owner as u16 * 4),
            is_capital: true,
            population: FOUNDING_CITY_POPULATION,
            culture: 0,
        });
        state
            .economy
            .city_stock
            .insert(city, [("drewno".to_owned(), 100.0)].into_iter().collect());
    }
    state.economy.praca_pool_by_owner.insert(HUMAN, 50.0);
    for d in deals {
        state.war.diplomacy.add_deal(d);
    }
    PlayableGame::from_state(state)
}

fn pools(game: &PlayableGame) -> (f64, f64, f64) {
    let p = &game.state().economy.praca_pool_by_owner;
    (
        p.get(&HUMAN).copied().unwrap_or(0.0),
        p.get(&AI2).copied().unwrap_or(0.0),
        p.get(&AI3).copied().unwrap_or(0.0),
    )
}

#[test]
fn praca_w_umowie_cyklicznej_przez_advance_turn() {
    let mut game = scenario(vec![work_deal("praca-a", AI2)]);
    game.advance_turn().expect("tura 1");
    assert_eq!(
        pools(&game),
        (20.0, 30.0, 0.0),
        "tura 1: zaplacone 30 Pracy"
    );
    game.advance_turn().expect("tura 2");
    assert_eq!(
        pools(&game),
        (20.0, 30.0, 0.0),
        "tura 2: gracz ma 20 < 30, bez platnosci"
    );
}

#[test]
fn kolejnosc_platnosci_praca_przez_advance_turn() {
    // Kolejnosc X (AI 2) przed Y (AI 3): X zaplacona (50 -> 20), Y bramka 20 < 30 -> brak platnosci.
    let mut game = scenario(vec![work_deal("praca-x", AI2), work_deal("praca-y", AI3)]);
    game.advance_turn().expect("tura 1");
    assert_eq!(pools(&game), (20.0, 30.0, 0.0), "X przed Y: AI2 dostaje 30");
}

#[test]
fn kolejnosc_platnosci_praca_odwrocona_daje_inny_wynik() {
    // Ta sama para umow, odwrotna kolejnosc w `deals`: Y zaplacona, X nie. Wynik rozny od powyzszego.
    let mut game = scenario(vec![work_deal("praca-y", AI3), work_deal("praca-x", AI2)]);
    game.advance_turn().expect("tura 1");
    assert_eq!(pools(&game), (20.0, 0.0, 30.0), "Y przed X: AI3 dostaje 30");
}
