//! R-RUSTPORT-P6-ELIMINACJA-Q1: czysta funkcja eliminacji wlasciciela (`domain::eliminacja::eliminate_owner`).
//!
//! - Wektory: `p6_eliminacja_vectors/vectors.json` (generator `p6_eliminacja_gen.mjs` WYKONUJE tekst
//!   `eliminateOwner` z pinu 07d2fbd72 w node i sprawdza SHA-256 zrodel). Kazdy przypadek = stan poczatkowy
//!   (jednostki, `eliminatedOwners`, akumulatory bitwy i zdobyczy, pary dyplomacji) + sekwencja eliminacji;
//!   po kazdym kroku porownanie calego zakresu snapshotu z webem.
//! - Zakres porownania: patrz naglowek `domain/eliminacja.rs` (NIE_ZMIERZONO = reszta pol `eliminateOwner`).
//! - Zgodnosc wsteczna: brak nowych pol serde w `PlayableState` / `WarTurnState` (nic do testowania).

use civ_engine::domain::diplomacy::{CivilizationPair, Relation, RelationStatus};
use civ_engine::domain::eliminacja::eliminate_owner;
use civ_engine::domain::playable::{PlayableState, PlayableUnit, PlayableUnitKind};
use civ_engine::domain::types::PositionDto;
use civ_engine::domain::{PlayerId, UnitId};
use serde_json::Value;

fn vectors() -> Value {
    serde_json::from_str(include_str!("p6_eliminacja_vectors/vectors.json")).expect("vectors")
}

fn unit(id: u64, owner: u64) -> PlayableUnit {
    PlayableUnit {
        id: UnitId::new(id),
        owner_id: PlayerId::new(owner),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(0, 0),
        movement: 2,
        movement_max: 2,
        selected: false,
    }
}

fn pairs_f64(v: &Value) -> Vec<(i64, f64)> {
    v.as_array()
        .expect("tablica par")
        .iter()
        .map(|p| {
            (
                p[0].as_i64().expect("klucz"),
                p[1].as_f64().expect("wartosc"),
            )
        })
        .collect()
}

fn pairs_u64(v: &Value) -> Vec<(u64, u64)> {
    v.as_array()
        .expect("tablica par")
        .iter()
        .map(|p| (p[0].as_u64().expect("a"), p[1].as_u64().expect("b")))
        .collect()
}

fn i64s(v: &Value) -> Vec<i64> {
    v.as_array()
        .expect("tablica")
        .iter()
        .map(|x| x.as_i64().expect("liczba"))
        .collect()
}

fn build_state(init: &Value) -> (PlayableState, Vec<i64>) {
    let mut state = PlayableState::empty();
    for (i, o) in init["unit_owners"]
        .as_array()
        .expect("units")
        .iter()
        .enumerate()
    {
        state
            .units
            .push(unit(i as u64 + 1, o.as_u64().expect("owner")));
    }
    state.war.battle_power_pts_by_owner = pairs_f64(&init["battle"]);
    state.war.zdobycze_power_by_owner = pairs_f64(&init["zdobycze"]);
    for (a, b) in pairs_u64(&init["relations"]) {
        state.war.diplomacy.relations.insert(
            CivilizationPair::new(PlayerId::new(a), PlayerId::new(b)),
            Relation::new(0.0, 0.0, RelationStatus::Neutral),
        );
    }
    let mut eliminated = i64s(&init["eliminated"]);
    eliminated.sort_unstable();
    (state, eliminated)
}

fn sorted_pairs_f64(mut v: Vec<(i64, f64)>) -> Vec<(i64, f64)> {
    v.sort_by_key(|a| a.0);
    v
}

#[test]
fn wektory_pinu_eliminacji_zgodne_z_webem_krok_po_kroku() {
    let v = vectors();
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 150, "za malo przypadkow: {}", cases.len());
    let mut kroki = 0usize;
    for (ci, case) in cases.iter().enumerate() {
        let (mut state, mut elim) = build_state(&case["init"]);
        for step in case["steps"].as_array().expect("steps") {
            let owner = step["owner"].as_i64().expect("owner");
            let wynik = eliminate_owner(&mut state, &mut elim, owner);
            kroki += 1;
            let ctx = format!("przypadek {ci}, krok owner={owner}");
            assert_eq!(
                wynik.pominieta,
                step["expect_pominieta"].as_bool().unwrap(),
                "{ctx}: pominieta"
            );
            assert_eq!(
                wynik.usuniete_jednostki as i64,
                step["expect_usuniete_jednostki"].as_i64().unwrap(),
                "{ctx}: usuniete_jednostki"
            );
            assert_eq!(
                wynik.usuniete_relacje as i64,
                step["expect_usuniete_relacje"].as_i64().unwrap(),
                "{ctx}: usuniete_relacje"
            );
            let jednostki: Vec<u64> = state.units.iter().map(|u| u.id.get()).collect();
            let oczek_jednostki: Vec<u64> = step["expect_units"]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_u64().unwrap())
                .collect();
            assert_eq!(
                jednostki, oczek_jednostki,
                "{ctx}: jednostki (id po kolejnosci)"
            );
            let mut elim_sorted = elim.clone();
            elim_sorted.sort_unstable();
            assert_eq!(
                elim_sorted,
                i64s(&step["expect_eliminated"]),
                "{ctx}: eliminatedOwners"
            );
            assert_eq!(
                sorted_pairs_f64(state.war.battle_power_pts_by_owner.clone()),
                sorted_pairs_f64(pairs_f64(&step["expect_battle"])),
                "{ctx}: battlePowerPtsByOwner"
            );
            assert_eq!(
                sorted_pairs_f64(state.war.zdobycze_power_by_owner.clone()),
                sorted_pairs_f64(pairs_f64(&step["expect_zdobycze"])),
                "{ctx}: zdobyczePowerByOwner"
            );
            let relacje: Vec<(u64, u64)> = state
                .war
                .diplomacy
                .relations
                .keys()
                .map(|p| (p.first.get(), p.second.get()))
                .collect();
            assert_eq!(
                relacje,
                pairs_u64(&step["expect_relations"]),
                "{ctx}: relacje (pary)"
            );
        }
    }
    assert!(kroki >= 400, "za malo krokow: {kroki}");
}

#[test]
fn wlasciciel_zero_i_powtorka_sa_no_op() {
    let mut state = PlayableState::empty();
    state.units.push(unit(1, 0));
    state.units.push(unit(2, 1));
    let mut elim = vec![1];
    let r0 = eliminate_owner(&mut state, &mut elim, 0);
    assert!(r0.pominieta);
    assert_eq!(state.units.len(), 2);
    let r1 = eliminate_owner(&mut state, &mut elim, 1);
    assert!(r1.pominieta);
    assert_eq!(r1.usuniete_jednostki, 0);
    assert_eq!(state.units.len(), 2);
    assert_eq!(elim, vec![1]);
}

#[test]
fn ujemny_wlasciciel_nie_usuwa_nikogo_ale_trafia_do_zbioru() {
    // Web: eliminateOwner(-5) dopisuje -5 do eliminatedOwners i nie ma jednostek ani par o takim id.
    let mut state = PlayableState::empty();
    state.units.push(unit(1, 2));
    let mut elim = Vec::new();
    let r = eliminate_owner(&mut state, &mut elim, -5);
    assert!(!r.pominieta);
    assert_eq!(r.usuniete_jednostki, 0);
    assert_eq!(elim, vec![-5]);
    assert_eq!(state.units.len(), 1);
}
