//! R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1: produkcyjna sciezka zdobycia stolicy
//! (`apply_capital_capture_with_plunder`) = Transfer + `run_capital_capture_plunder` + akumulator zdobyczy w `PlayableState`.
//!
//! Wartosci oczekiwane pochodza z wektorow pinu 07d2fbd72 w `tests/p6_siege_capital_plunder_vectors/vectors.json`:
//! * `h05-elim-player-wins-triumph` (2 -> 0, eliminacja, lostPower 120): `main.store` (skarbiec 0 = 120, praca 35,
//!   nauka 47, techy {a,b,c}) i `main.zdobycze` = {"0": 120};
//! * `h04-capital-ai-keeps-cities` (2 -> 0, przejecie stolicy, zostaja miasta): skarbiec 0 = 120, brak zdobyczy;
//! * `h09-elim-barb-captor` (2 -> -1, eliminacja, zdobywca barbarzynca): brak zdobyczy (`main.zdobycze` = {}).
//!
//! Granica: wektory pinu sa generowane przez `p6_siege_capital_plunder_gen.mjs`; ten test NIE weryfikuje SHA-256 pliku
//! wektorow (NIE_ZMIERZONO w tym temacie) - wartosci sa zapisane jawnie wg powyzszych case'ow.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::playable::PlayableState;
use civ_engine::domain::siege_capital_plunder::{
    OwnerResourceAccess, PlunderCity, PlunderLabels, PlunderState,
};
use civ_engine::domain::siege_transfer::{
    apply_capital_capture_with_plunder, CapitalPlunderCtx, CapitalTransferArgs, TransferCity,
    TransferExtras,
};

#[derive(Default)]
struct Store {
    treasury: BTreeMap<i64, f64>,
    praca: BTreeMap<i64, f64>,
    nauka: BTreeMap<i64, f64>,
    techs: BTreeMap<i64, BTreeSet<String>>,
}

impl OwnerResourceAccess for Store {
    fn get_treasury(&self, o: i64) -> f64 {
        self.treasury.get(&o).copied().unwrap_or(0.0)
    }
    fn set_treasury(&mut self, o: i64, v: f64) {
        self.treasury.insert(o, v);
    }
    fn get_praca_pool(&self, o: i64) -> f64 {
        self.praca.get(&o).copied().unwrap_or(0.0)
    }
    fn set_praca_pool(&mut self, o: i64, v: f64) {
        self.praca.insert(o, v);
    }
    fn get_nauka_pool(&self, o: i64) -> f64 {
        self.nauka.get(&o).copied().unwrap_or(0.0)
    }
    fn set_nauka_pool(&mut self, o: i64, v: f64) {
        self.nauka.insert(o, v);
    }
    fn get_researched_techs(&self, o: i64) -> BTreeSet<String> {
        self.techs.get(&o).cloned().unwrap_or_default()
    }
    fn add_researched_techs(&mut self, o: i64, ids: &[String]) {
        self.techs.entry(o).or_default().extend(ids.iter().cloned());
    }
    fn food_supported(&self) -> bool {
        false
    }
    fn get_food_reserve(&self, _o: i64) -> f64 {
        0.0
    }
    fn set_food_reserve(&mut self, _o: i64, _v: f64) {}
    fn get_food_capacity(&self, _o: i64) -> Option<f64> {
        None
    }
}

struct Labels;

impl PlunderLabels for Labels {
    fn civ_label(&self, o: i64) -> String {
        format!("civ{o}")
    }
    fn moc_label(&self) -> String {
        "Moc".to_string()
    }
    fn civ_display_name(&self, o: i64) -> Option<String> {
        Some(format!("disp{o}"))
    }
    fn civ_key_for_owner_id(&self, o: i64) -> String {
        format!("key{o}")
    }
    fn one_line(&self, kind: &str) -> String {
        format!("OL:{kind}")
    }
    fn spectacle(&self, label: &str) -> String {
        format!("spec:{label}")
    }
}

fn city(id: &str, owner: i64, population: f64) -> PlunderCity {
    PlunderCity {
        id: id.to_string(),
        name: format!("Miasto {id}"),
        owner_id: owner,
        population,
        surowce: BTreeMap::new(),
    }
}

fn player_store() -> Store {
    let mut s = Store::default();
    s.treasury.insert(0, 20.0);
    s.treasury.insert(2, 100.0);
    s.praca.insert(0, 5.0);
    s.praca.insert(2, 30.0);
    s.nauka.insert(0, 7.0);
    s.nauka.insert(2, 40.0);
    s.techs
        .insert(0, ["b"].iter().map(|x| x.to_string()).collect());
    s.techs
        .insert(2, ["a", "b", "c"].iter().map(|x| x.to_string()).collect());
    s
}

/// Uruchamia produkcyjna sciezke dla miasta `c1` (indeks 0) z wlasciciela 2 do `new_owner`.
fn run_capture(
    cities: &mut Vec<PlunderCity>,
    store: &mut Store,
    playable: &mut PlayableState,
    new_owner: i64,
    population: f64,
    lost_power: f64,
) -> (
    civ_engine::domain::siege_transfer::CapitalCaptureResult,
    PlunderState,
) {
    let mut tc = TransferCity {
        owner_id: 2,
        population,
        q: 0,
        r: 0,
        found_by_owner: None,
        rebel_state: None,
        start_city_state: None,
    };
    let mut plunder_state = PlunderState::default();
    let mut units = Vec::new();
    let labels = Labels;
    let ctx = CapitalPlunderCtx {
        access: store,
        labels: &labels,
        plunder_state: &mut plunder_state,
        cities,
        city_index: 0,
        building_count: 2,
        triumph_unification: false,
    };
    let res = apply_capital_capture_with_plunder(
        &mut tc,
        CapitalTransferArgs {
            new_owner,
            was_independent_city_state: false,
            units: &mut units,
            production: None,
            extras: TransferExtras::default(),
        },
        ctx,
        playable,
        || lost_power,
    );
    assert_eq!(
        tc.owner_id, new_owner,
        "Transfer zmienia wlasciciela miasta"
    );
    (res, plunder_state)
}

#[test]
fn elimination_by_player_matches_pin_h05_and_records_zdobycz() {
    let mut cities = vec![city("c1", 2, 12.0)];
    let mut store = player_store();
    let mut playable = PlayableState::empty();

    let (res, _) = run_capture(&mut cities, &mut store, &mut playable, 0, 12.0, 120.0);

    // Pin h05: eliminacja, zwrot = wiersz ELIMINACJA dla civ2.
    let elim = res.elimination.expect("eliminacja zwraca szczegoly");
    assert_eq!(elim.eliminated_civ_label, "civ2");
    assert_eq!(elim.eliminated_details, "OL:eliminacja");
    // Pin h05 main.store: skarbiec/praca/nauka/techy zdobywcy po przejeciu.
    assert_eq!(store.get_treasury(0), 120.0);
    assert_eq!(store.get_praca_pool(0), 35.0);
    assert_eq!(store.get_nauka_pool(0), 47.0);
    assert_eq!(
        store.get_researched_techs(0),
        ["a", "b", "c"]
            .iter()
            .map(|x| x.to_string())
            .collect::<BTreeSet<_>>()
    );
    // Pin h05 main.zdobycze = {"0": 120}: akumulator zdobyczy zapisany w stanie gry.
    assert!(res.zdobycze_recorded);
    assert_eq!(playable.war.zdobycze_power_for(0), 120.0);
    assert_eq!(res.lost_power, 120.0);
    assert!(!res.ui_calls.is_empty(), "wywolania UI sa zapisane");
}

#[test]
fn capital_capture_with_surviving_cities_matches_pin_h04_without_zdobycz() {
    let mut cities = vec![city("c1", 2, 9.0), city("c2", 2, 9.0)];
    let mut store = player_store();
    let mut playable = PlayableState::empty();

    let (res, _) = run_capture(&mut cities, &mut store, &mut playable, 0, 9.0, 120.0);

    // Pin h04: przejecie stolicy (bez eliminacji), skarbiec zdobywcy = 20 + 100.
    assert!(res.elimination.is_none());
    assert_eq!(store.get_treasury(0), 120.0);
    assert_eq!(store.get_praca_pool(0), 5.0);
    // Brak zdobyczy Power w tej galezi (pin h04: main.zdobycze = {}).
    assert!(!res.zdobycze_recorded);
    assert_eq!(playable.war.zdobycze_power_for(0), 0.0);
    // Pierwsze wywolanie UI w galezi stolicy to mocLabel (kolejnosc web).
    assert_eq!(res.ui_calls[0]["fn"], "mocLabel");
}

#[test]
fn barbarian_captor_elimination_records_no_zdobycz_pin_h09() {
    let mut cities = vec![city("c1", 2, 9.0)];
    let mut store = player_store();
    let mut playable = PlayableState::empty();

    let (res, _) = run_capture(&mut cities, &mut store, &mut playable, -1, 9.0, 120.0);

    // Pin h09: zdobywca barbarzynca -> brak zdobyczy (barbarianCapturedPowerGain = 0).
    assert!(res.elimination.is_none());
    assert!(!res.zdobycze_recorded);
    assert_eq!(playable.war.zdobycze_power_for(-1), 0.0);
    assert_eq!(
        store.get_treasury(-1),
        0.0,
        "barbarzynca nie dostaje zasobow (pin h09)"
    );
}
