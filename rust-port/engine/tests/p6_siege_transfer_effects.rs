//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q3-Q1: testy behawioralne `apply_transfer_with_effects`
//! (applyCapturePopulationLoss + sanitizeProductionQueue(newOwner)).
//!
//! Oczekiwania wyprowadzone z czytania pinu 07d2fbd72: `gra/src/game/cities.ts:1235-1251` (utrata obywatela),
//! `gra/src/main.ts:17700-17790` (kolejnosc Transferu), `gra/src/main.ts:5123-5140` (sanityzacja).
//! NIE_ZMIERZONO wzgledem wykonania pinu: wektory generatora nadal stubuja applyCapturePopulationLoss.

use civ_engine::domain::production_units::{CityProduction, ProductionItem, ProductionKind};
use civ_engine::domain::siege_enter_city::EnterUnit;
use civ_engine::domain::siege_transfer::{
    apply_transfer, apply_transfer_with_effects, TransferCity, TransferExtras, TransferProduction,
};
use civ_engine::domain::siege_transfer_effects::{CapturePopLossInput, CAPTURE_POP_LOSS_PIN};

fn city(owner: i64, population: f64) -> TransferCity {
    TransferCity {
        owner_id: owner,
        population,
        q: 2,
        r: 2,
        found_by_owner: Some(true),
        rebel_state: None,
        start_city_state: None,
    }
}

fn pop_input(prev: i64, new: i64) -> CapturePopLossInput {
    CapturePopLossInput {
        prev_owner: prev,
        new_owner: new,
        rebel_prev_owner_snapshot: None,
        captured_from_owner_id: None,
        founded_by: None,
        found_by_owner: Some(true),
        capture_pop_loss: CAPTURE_POP_LOSS_PIN,
    }
}

fn item(id: &str, postep: Option<f64>) -> ProductionItem {
    ProductionItem {
        kind: ProductionKind::Budynek,
        id: id.to_owned(),
        nazwa: id.to_owned(),
        koszt: 10.0,
        postep,
        is_general: None,
    }
}

fn prod(items: Vec<ProductionItem>) -> CityProduction {
    CityProduction {
        kolejka: items,
        postep: 0.0,
        wstrzymana: None,
        rekrutacja: None,
    }
}

#[test]
fn utrata_obywatela_przy_zdobyciu_obcego_miasta() {
    let mut c = city(1, 5.0);
    let mut units: Vec<EnterUnit> = Vec::new();
    let out = apply_transfer_with_effects(
        &mut c,
        2,
        false,
        &mut units,
        None,
        TransferExtras {
            pop_loss: Some(pop_input(1, 2)),
            wonder_gate_ok: None,
        },
    );
    assert_eq!(c.population, 4.0);
    assert_eq!(c.owner_id, 2);
    let loss = out
        .capture_loss
        .expect("applyCapturePopulationLoss wykonany");
    assert_eq!(loss.loss, 1.0);
    assert_eq!(loss.captured_from_owner_id, 1);
    assert!(out.performed.contains(&"applyCapturePopulationLoss"));
}

#[test]
fn odzyskanie_miasta_nie_traci_obywatela() {
    let mut c = city(1, 5.0);
    let mut units: Vec<EnterUnit> = Vec::new();
    let mut input = pop_input(1, 2);
    input.captured_from_owner_id = Some(2);
    let out = apply_transfer_with_effects(
        &mut c,
        2,
        false,
        &mut units,
        None,
        TransferExtras {
            pop_loss: Some(input),
            wonder_gate_ok: None,
        },
    );
    assert_eq!(c.population, 5.0);
    assert!(out.capture_loss.expect("wykonany").reclaim);
}

#[test]
fn tryb_legacy_nie_stosuje_utraty_obywatela() {
    let mut c = city(1, 5.0);
    let mut units: Vec<EnterUnit> = Vec::new();
    let out = apply_transfer(&mut c, 2, false, &mut units, None);
    assert_eq!(c.population, 5.0);
    assert!(out.capture_loss.is_none());
    assert!(!out.performed.contains(&"applyCapturePopulationLoss"));
}

#[test]
fn banked_liczony_z_wyniku_sanityzacji_nie_z_surowej_kolejki() {
    // Kolejka: front "a" (2 Pracy), stolicowe "palac" (3) i "cud" (4). "cud" odrzuca bramka cudu
    // zdobywcy, wiec web liczy banked z wyniku sanityzacji = 3, a nie 7 (surowa kolejka).
    let p = prod(vec![
        item("a", Some(2.0)),
        item("palac", Some(3.0)),
        item("cud", Some(4.0)),
    ]);
    let is_cap = |i: &ProductionItem| i.id == "palac" || i.id == "cud";
    let mut c = city(1, 5.0);
    let mut units: Vec<EnterUnit> = Vec::new();
    let gate = |i: &ProductionItem| i.id != "cud";
    let out = apply_transfer_with_effects(
        &mut c,
        2,
        false,
        &mut units,
        Some(TransferProduction {
            prod: &p,
            is_new_capital: false,
            is_capital_only_building: &is_cap,
        }),
        TransferExtras {
            pop_loss: None,
            wonder_gate_ok: Some(&gate),
        },
    );
    assert_eq!(out.forfeited_praca_to_new, 3.0);
    assert_eq!(out.refunded_praca_to_old, 0.0);
    let kolejka = out.production.expect("kolejka po przejeciu").kolejka;
    let ids: Vec<&str> = kolejka.iter().map(|i| i.id.as_str()).collect();
    assert_eq!(ids, vec!["a"]);
    assert!(out.performed.contains(&"sanitizeProductionQueue"));
}

#[test]
fn laczony_front_cud_i_stolicowy_banked_sumuje_trzy_skladniki() {
    // Kolejka: front "cud" (postep 4 = prod.postep, odrzucony przez bramke cudow zdobywcy),
    // "a" (postep 2, zwykly), "palac" (postep 3, stolicowy na indeksie 2 = banked).
    // Oczekiwane (wg semantyki filter_queue/drop_front_item i web: wonder + front + banked):
    //   sanityzacja: front cud -> forfeit 4; "a" awansuje na front (prod.postep 2), "palac" zostaje na indeksie 1;
    //   banked = 3 (palac poza frontem); filtr stolicy usuwa palac bez zwrotu frontu.
    // Lacznie forfeited_praca_to_new = 4 + 0 + 3 = 7; kolejka = ["a"].
    let mut p = prod(vec![
        item("cud", Some(4.0)),
        item("a", Some(2.0)),
        item("palac", Some(3.0)),
    ]);
    p.postep = 4.0;
    let is_cap = |i: &ProductionItem| i.id == "palac" || i.id == "cud";
    let gate = |i: &ProductionItem| i.id != "cud";
    let mut c = city(1, 5.0);
    let mut units: Vec<EnterUnit> = Vec::new();
    let out = apply_transfer_with_effects(
        &mut c,
        2,
        false,
        &mut units,
        Some(TransferProduction {
            prod: &p,
            is_new_capital: false,
            is_capital_only_building: &is_cap,
        }),
        TransferExtras {
            pop_loss: None,
            wonder_gate_ok: Some(&gate),
        },
    );
    assert_eq!(out.forfeited_praca_to_new, 4.0 + 3.0);
    assert_eq!(out.refunded_praca_to_old, 0.0);
    let ids: Vec<String> = out
        .production
        .expect("kolejka")
        .kolejka
        .iter()
        .map(|i| i.id.clone())
        .collect();
    assert_eq!(ids, vec!["a".to_owned()]);
}

#[test]
fn bez_bramki_sanityzacja_wykonana_bez_odrzucen() {
    // Brak bramki (None) = bramka przepuszczajaca: sanitizeProductionQueue nadal sie wykonuje (jak w web),
    // a cud w kolejce NIE jest odrzucany, bo bez bramki nie ma predykatu. Odstepstwo od weba tylko przy cudach.
    let p = prod(vec![item("a", Some(2.0)), item("cud", Some(4.0))]);
    let is_cap = |_: &ProductionItem| false;
    let mut c = city(1, 5.0);
    let mut units: Vec<EnterUnit> = Vec::new();
    let out = apply_transfer_with_effects(
        &mut c,
        2,
        false,
        &mut units,
        Some(TransferProduction {
            prod: &p,
            is_new_capital: false,
            is_capital_only_building: &is_cap,
        }),
        TransferExtras::default(),
    );
    assert!(out.performed.contains(&"sanitizeProductionQueue"));
    assert_eq!(out.forfeited_praca_to_new, 0.0);
    let kolejka = out.production.expect("kolejka").kolejka;
    assert_eq!(kolejka.len(), 2);
}

#[test]
#[should_panic(expected = "pop_loss.new_owner != new_owner")]
fn niespojny_pop_loss_jest_wykrywany() {
    let mut c = city(1, 5.0);
    let mut units: Vec<EnterUnit> = Vec::new();
    let _ = apply_transfer_with_effects(
        &mut c,
        2,
        false,
        &mut units,
        None,
        TransferExtras {
            pop_loss: Some(pop_input(1, 3)),
            wonder_gate_ok: None,
        },
    );
}
