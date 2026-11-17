//! P6-WIRE-R7K7C (#299, runda 2, zarzut 5): platnosci Praca w D3 (cykliczny handel) wobec wektorow z pinu.
//!
//! Wektory: `p6_r7k7c_vectors/d3_work.json` (generator `p6_r7k7c_vectors/d3_work_gen.mjs`, wykonuje tekst pinu
//! 07d2fbd72 `gra/src/main.ts`: `ownerPracaPool`/`setOwnerPracaPool` z podloga `Math.max(0, value)` przez Node).
//! Kazdy wektor = sekwencja platnosci w jednej turze (ta sama pula moze byc platnikiem i odbiorca wielokrotnie)
//! oraz stan koncowy wedlug pinu. Test sprawdza: stan Rust po sekwencji == pin, oraz `pula_start + przyrost == stan`.

use std::collections::BTreeMap;

use civ_engine::domain::turn_war_dipl_steps::pay_work_floored;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_r7k7c_vectors/d3_work.json");

fn close(a: f64, b: f64) -> bool {
    (a - b).abs() <= 1e-9 * a.abs().max(b.abs()).max(1.0)
}

fn pool_map(v: &Value) -> BTreeMap<i64, f64> {
    v.as_object()
        .expect("pools is object")
        .iter()
        .map(|(k, x)| {
            (
                k.parse::<i64>().expect("owner id"),
                x.as_f64().expect("pool value"),
            )
        })
        .collect()
}

#[test]
fn wektory_d3_praca_z_pinu_zgodne() {
    let doc: Value = serde_json::from_str(VECTORS).expect("d3_work.json parses");
    let vectors = doc["vectors"].as_array().expect("vectors array");
    assert!(
        vectors.len() >= 150,
        "wymagane >= 150 wektorow D3, jest {}",
        vectors.len()
    );
    for v in vectors {
        let id = v["id"].as_u64().unwrap();
        let reference = v["ref"].as_str().unwrap();
        let start = pool_map(&v["pools"]);
        let mut praca = start.clone();
        let mut delta: BTreeMap<i64, f64> = BTreeMap::new();
        for pay in v["payments"].as_array().unwrap() {
            let buyer = pay[0].as_i64().unwrap();
            let seller = pay[1].as_i64().unwrap();
            let z = pay[2].as_f64().unwrap();
            pay_work_floored(&mut praca, &mut delta, buyer, seller, z)
                .expect("finite payment accepted");
        }
        for (owner, expect) in v["expect"].as_object().unwrap() {
            let owner: i64 = owner.parse().unwrap();
            let expect = expect.as_f64().unwrap();
            let got = praca.get(&owner).copied().unwrap_or(0.0);
            assert!(
                close(got, expect),
                "wektor {id} ({reference}) wlasciciel {owner}: rust {got} != pin {expect}"
            );
            // Przyrost raportu (apply) musi dawac ten sam stan: start + przyrost = stan koncowy.
            let start_v = start.get(&owner).copied().unwrap_or(0.0);
            let d = delta.get(&owner).copied().unwrap_or(0.0);
            assert!(
                close(start_v + d, got),
                "wektor {id} wlasciciel {owner}: start {start_v} + przyrost {d} != stan {got}"
            );
        }
    }
}

#[test]
fn podloga_po_kazdym_zapisie_a_nie_tylko_na_koncu() {
    // Pula 1 = 5 placi 10 (pula 1: 5 -> 0, podloga), pula 2 = 0 dostaje 10 (-> 10).
    // Druga platnosc: 2 placi 10 (10 -> 0), 1 dostaje 10 (0 -> 10). Pin: stan koncowy 1 = 10, 2 = 0.
    // Bez podlogi po kazdym zapisie wynik bylby inny (1: 5 - 10 + 10 = 5; 2: 10 - 10 = 0).
    let mut praca: BTreeMap<i64, f64> = BTreeMap::from([(1, 5.0)]);
    let mut delta = BTreeMap::new();
    pay_work_floored(&mut praca, &mut delta, 1, 2, 10.0).unwrap();
    pay_work_floored(&mut praca, &mut delta, 2, 1, 10.0).unwrap();
    assert_eq!(praca.get(&1).copied(), Some(10.0));
    assert_eq!(praca.get(&2).copied(), Some(0.0));
    assert_eq!(delta.get(&1).copied(), Some(5.0));
    assert_eq!(delta.get(&2).copied(), Some(0.0));
}

#[test]
fn brak_wpisu_platnika_to_zero_i_zapis_tworzy_wpis() {
    let mut praca: BTreeMap<i64, f64> = BTreeMap::new();
    let mut delta = BTreeMap::new();
    pay_work_floored(&mut praca, &mut delta, 7, 8, 3.0).unwrap();
    assert_eq!(praca.get(&7).copied(), Some(0.0));
    assert_eq!(praca.get(&8).copied(), Some(3.0));
    assert_eq!(delta.get(&7).copied(), Some(0.0));
    assert_eq!(delta.get(&8).copied(), Some(3.0));
}

#[test]
fn niefinitna_platnosc_odrzuca_bez_zmian() {
    let mut praca: BTreeMap<i64, f64> = BTreeMap::from([(1, 5.0)]);
    let mut delta = BTreeMap::new();
    assert!(pay_work_floored(&mut praca, &mut delta, 1, 2, f64::NAN).is_err());
    assert_eq!(praca.get(&1).copied(), Some(5.0));
}
