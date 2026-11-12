//! R-RUSTPORT-P6-UNIT-REPLACE-L3-Q1 etap 2: stan ekonomii zamiany w `PlayableState` i komenda
//! gracza `replace_unit` (adapter `replace_unit_wired`). Testy behawioralne end-to-end na
//! `PlayableGame`: sukces, brak srodkow, brak magazynu, blokada pinu, jednostka uzyta w turze,
//! oraz zgodnosc wsteczna zapisu sprzed zmiany (`pre-etap2-state.json`).

use civ_engine::domain::building_costs::p6_7b::{
    unit_stock_cost, EpochInput, StockRecord, UnitStockCostSource,
};
use civ_engine::domain::playable::{PlayableError, PlayableGame, PlayableState, StartGameParams};
use civ_engine::domain::unit_replace::UnitReplaceFail;
use civ_engine::domain::unit_replace_wiring::{ReplaceUnitDef, UNKNOWN_NEW_TYPE_DETAIL};
use std::collections::BTreeMap;

const PRE_ETAP2_STATE: &str = include_str!("p6_unit_replace_l3_state_vectors/pre-etap2-state.json");
const HUMAN_UNIT: u64 = 1;

fn procarz_source() -> UnitStockCostSource {
    UnitStockCostSource {
        jednostka: Some("Procarz".to_owned()),
        typ: Some("Slinger".to_owned()),
        epoka: EpochInput::Text("Brąz".to_owned()),
        surowiec: Some("Drewno".to_owned()),
        surowiec_ilosc: Some(25.0),
    }
}

/// Tabela definicji: `Wojownik` (typ startowy, 10 HP) i `Procarz` (koszt Pieniadz 4 + drewno).
fn defs() -> BTreeMap<String, ReplaceUnitDef> {
    let mut table = BTreeMap::new();
    table.insert(
        "Wojownik".to_owned(),
        ReplaceUnitDef {
            category: "Wrecz".to_owned(),
            money_cost: 2.0,
            stock_source: None,
            max_hp: 10.0,
        },
    );
    table.insert(
        "Procarz".to_owned(),
        ReplaceUnitDef {
            category: "Dystans".to_owned(),
            money_cost: 4.0,
            stock_source: Some(procarz_source()),
            max_hp: 20.0,
        },
    );
    table
}

fn game() -> PlayableGame {
    PlayableGame::new(StartGameParams {
        seed: 7,
        ..StartGameParams::default()
    })
    .expect("scenariusz startowy")
}

fn drewno_pool(amount: f64) -> StockRecord {
    StockRecord::from([("drewno".to_owned(), amount)])
}

/// Typ i flaga uzycia jednostki gracza w stanie zamiany (`None` = brak wpisu).
fn replace_view(game: &PlayableGame) -> (Option<String>, bool) {
    let state = game.state().economy.units.get(&HUMAN_UNIT);
    (
        state.and_then(|s| s.type_id.clone()),
        state.is_some_and(|s| s.replace_used_this_turn),
    )
}

#[test]
fn stan_domyslny_nie_pojawia_sie_w_dto() {
    let game = game();
    assert!(game.state().economy.is_default());
    let json = serde_json::to_value(game.state()).expect("json");
    assert!(
        json.get("economy").is_none(),
        "pole economy pomijane gdy domyslne"
    );
}

#[test]
fn zapis_sprzed_etapu_2_laduje_sie_bez_zmian() {
    let before: PlayableState = serde_json::from_str(PRE_ETAP2_STATE).expect("stary zapis");
    assert!(
        before.economy.is_default(),
        "brak pola economy = stan domyslny"
    );
    let old: serde_json::Value = serde_json::from_str(PRE_ETAP2_STATE).expect("json");
    let reserialized = serde_json::to_value(&before).expect("json");
    assert_eq!(reserialized, old, "ponowny zapis nie zmienia formatu");
}

#[test]
fn sukces_pobiera_pieniadz_i_surowce_zmienia_typ_i_hp() {
    let mut game = game();
    game.set_human_treasury(10.0).expect("skarbiec");
    game.set_capital_stock(drewno_pool(100.0)).expect("stolica");
    let table = defs();
    let cost = unit_stock_cost(Some(&procarz_source()));
    assert!(!cost.is_empty(), "koszt surowcowy procarza niepusty");

    game.replace_unit(HUMAN_UNIT, "Procarz", &table, None)
        .expect("zamiana ma sie udac");

    let economy = &game.state().economy;
    assert_eq!(economy.treasury, 6.0, "Pieniadz 4 pobrany z 10");
    for (key, amount) in &cost {
        assert_eq!(
            economy.city_stock[&capital(&game)][key],
            100.0 - amount,
            "surowiec {key}"
        );
    }
    let unit = &game.state().units[0];
    assert_eq!(unit.movement, 0, "zamiana zuzywa ruch");
    assert_eq!(replace_view(&game).0.as_deref(), Some("Procarz"));
    // Stare HP = pelne (brak pola hp -> oldMaxHp 10), ratio 1 -> nowe HP = maxHp 20.
    assert_eq!(economy.units[&HUMAN_UNIT].hp, Some(20.0));
}

fn capital(game: &PlayableGame) -> u64 {
    game.state()
        .cities
        .iter()
        .find(|c| c.is_capital)
        .map(|c| c.id.get())
        .expect("stolica")
}

#[test]
fn brak_srodkow_odrzuca_bez_mutacji() {
    let mut game = game();
    game.set_human_treasury(3.0).expect("skarbiec");
    game.set_capital_stock(drewno_pool(100.0)).expect("stolica");
    let before = game.state().clone();

    let err = game
        .replace_unit(HUMAN_UNIT, "Procarz", &defs(), None)
        .expect_err("za malo Pieniadza");
    assert_eq!(
        err,
        PlayableError::UnitReplaceRejected {
            reason: UnitReplaceFail::Money,
            detail: None
        }
    );
    assert_eq!(game.state(), &before, "odrzucenie nie zmienia stanu");
}

#[test]
fn brak_magazynu_odrzuca_bez_mutacji() {
    let mut game = game();
    game.set_human_treasury(100.0).expect("skarbiec");
    game.set_capital_stock(drewno_pool(10.0)).expect("stolica");
    let before = game.state().clone();

    let err = game
        .replace_unit(HUMAN_UNIT, "Procarz", &defs(), None)
        .expect_err("za malo drewna");
    assert!(matches!(
        err,
        PlayableError::UnitReplaceRejected {
            reason: UnitReplaceFail::Stock,
            ..
        }
    ));
    assert_eq!(game.state(), &before, "odrzucenie nie zmienia stanu");
}

#[test]
fn blokada_pinu_odrzuca_z_powodem() {
    let mut game = game();
    game.set_human_treasury(100.0).expect("skarbiec");
    game.set_capital_stock(drewno_pool(100.0)).expect("stolica");

    let err = game
        .replace_unit(
            HUMAN_UNIT,
            "Procarz",
            &defs(),
            Some("Limit super-jednostek".to_owned()),
        )
        .expect_err("blokada pinu");
    assert_eq!(
        err,
        PlayableError::UnitReplaceRejected {
            reason: UnitReplaceFail::Gate,
            detail: Some("Limit super-jednostek".to_owned())
        }
    );
}

#[test]
fn nieznany_typ_docelowy_jest_blokada_z_powodem() {
    let mut game = game();
    game.set_human_treasury(100.0).expect("skarbiec");
    game.set_capital_stock(drewno_pool(100.0)).expect("stolica");

    let err = game
        .replace_unit(HUMAN_UNIT, "Nieistniejacy", &defs(), None)
        .expect_err("brak definicji");
    assert_eq!(
        err,
        PlayableError::UnitReplaceRejected {
            reason: UnitReplaceFail::Gate,
            detail: Some(UNKNOWN_NEW_TYPE_DETAIL.to_owned())
        }
    );
}

#[test]
fn jednostka_uzyta_w_turze_jest_odrzucana_do_kolejnej_tury() {
    let mut game = game();
    game.set_human_treasury(100.0).expect("skarbiec");
    game.set_capital_stock(drewno_pool(100.0)).expect("stolica");
    let table = defs();

    game.replace_unit(HUMAN_UNIT, "Procarz", &table, None)
        .expect("pierwsza zamiana");
    assert_eq!(replace_view(&game), (Some("Procarz".to_owned()), true));

    let before = game.state().clone();
    let err = game
        .replace_unit(HUMAN_UNIT, "Wojownik", &table, None)
        .expect_err("druga zamiana w tej samej turze");
    assert_eq!(
        err,
        PlayableError::UnitReplaceRejected {
            reason: UnitReplaceFail::Used,
            detail: None
        }
    );
    assert_eq!(game.state(), &before, "odrzucenie nie zmienia stanu");

    game.advance_turn().expect("koniec tury");
    assert_eq!(replace_view(&game), (Some("Procarz".to_owned()), false));
    game.replace_unit(HUMAN_UNIT, "Wojownik", &table, None)
        .expect("w nowej turze zamiana znow dozwolona");
}

#[test]
fn zamiana_nie_zmienia_pozostalych_pol_stanu() {
    let mut game = game();
    game.set_human_treasury(100.0).expect("skarbiec");
    game.set_capital_stock(drewno_pool(100.0)).expect("stolica");
    let mut before = game.state().clone();

    game.replace_unit(HUMAN_UNIT, "Procarz", &defs(), None)
        .expect("zamiana");
    // Poza ekonomia i ruchem jednostki (zuzyty) reszta stanu jest identyczna.
    before.economy = game.state().economy.clone();
    before.status = game.state().status.clone();
    before.units[0].movement = 0;
    assert_eq!(game.state(), &before);
}

#[test]
fn wartosc_niesko_nczona_w_ekonomii_jest_odrzucana() {
    let mut game = game();
    assert_eq!(
        game.set_human_treasury(f64::NAN),
        Err(PlayableError::NonFiniteEconomy)
    );
    assert_eq!(
        game.set_capital_stock(drewno_pool(f64::INFINITY)),
        Err(PlayableError::NonFiniteEconomy)
    );
    assert!(game.state().economy.is_default(), "stan bez zmian");
}

#[test]
fn zapis_sprzed_etapu_2_jest_wyjsciem_generatora_startu() {
    // Dowod pochodzenia fixture: start (seed 7), wybor i ruch jednostki 1 o jeden heks w prawo,
    // potem jedno przejscie tury (turn 2, PlayerActions). Kod po zmianie daje ten sam JSON
    // (wartosci); pole economy jest pominiete, wiec zapis sprzed etapu 2 ma ten sam ksztalt.
    // Sekwencja ustalona eksperymentalnie (bez niej fixture rozni sie pozycja jednostki).
    let mut started = game();
    let from = started.state().units[0].position;
    let to = civ_engine::domain::PositionDto::new(from.x() + 1, from.y());
    started.select_unit(HUMAN_UNIT).expect("wybor jednostki");
    started.move_unit(HUMAN_UNIT, to).expect("ruch jednostki");
    started.advance_turn().expect("tura 1");
    let generated = serde_json::to_value(started.state()).expect("json");
    let old: serde_json::Value = serde_json::from_str(PRE_ETAP2_STATE).expect("json");
    assert_eq!(
        generated, old,
        "fixture = wyjscie generatora startu sprzed zmiany"
    );
}
