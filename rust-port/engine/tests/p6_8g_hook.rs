//! P6.8G runda 4 (N1): hak rebalansu `PopulationChangeHooks` wpiety adapterem
//! `OkolicaPopulationHook` z pamiecia `City::okolica_reczne`. Wolanie przez `dyn PopulationChangeHooks`
//! jak w petli `applyPostCentralPopulationGrowth` (city_growth.rs, wywolanie hooks.rebalance...).

use civ_engine::domain::city_growth::p6_7a::growth_v85::PopulationChangeHooks;
use civ_engine::domain::city_growth::p6_7a::GrowthCity;
use civ_engine::domain::improvement_build::{BuildHex, BuildMap};
use civ_engine::domain::improvements::TerrainType;
use civ_engine::domain::okolica::{
    OkolicaFocus, OkolicaPopulationHook, OkolicaTryb, OkolicaYield, Reczne,
};
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::city_founding::p6_6b::cities::City;

/// Mapa laki o promieniu 8 wokol (0,0).
fn flat_map() -> BuildMap {
    let mut hexes = Vec::new();
    for q in -8i32..=8 {
        for r in -8i32..=8 {
            if i32::max(i32::max(q.abs(), r.abs()), (q + r).abs()) <= 8 {
                hexes.push(BuildHex {
                    q,
                    r,
                    terrain: TerrainType::Grassland,
                    overlay: Overlay::Brak,
                    ulepszenie: None,
                    ulepszenia: None,
                    zloze: None,
                    river_present: false,
                });
            }
        }
    }
    BuildMap::new(hexes, vec![])
}

fn equal_yield(_q: i32, _r: i32) -> OkolicaYield {
    OkolicaYield {
        zywnosc: 1.0,
        praca: 0.0,
        handel: 0.0,
    }
}

fn city(tryb: OkolicaTryb, reczne: Option<Reczne>) -> GrowthCity {
    GrowthCity::new(City {
        id: "c1".to_owned(),
        owner_id: 1,
        q: 0.0,
        r: 0.0,
        population: 3.0,
        okolica_tryb: Some(tryb),
        okolica_focus: Some(OkolicaFocus::Zywnosc),
        okolica_reczne: reczne,
        ..City::default()
    })
}

fn reczne_of(keys: &[&str]) -> Reczne {
    let mut r = Reczne::new();
    for k in keys {
        r.set(k, 1.0);
    }
    r
}

#[test]
fn hook_shrink_removes_exact_excess_through_trait_object() {
    let map = flat_map();
    let yf = equal_yield;
    let mut hook = OkolicaPopulationHook {
        map: &map,
        yield_of: &yf,
        territory: None,
    };
    let mut gc = city(
        OkolicaTryb::Reczny,
        Some(reczne_of(&["1,0", "0,1", "-1,1"])),
    );
    {
        let h: &mut dyn PopulationChangeHooks = &mut hook;
        h.rebalance_workers_after_population_change(&mut gc, 3.0, 1.0, None);
    }
    let after = gc
        .city
        .okolica_reczne
        .expect("pole reczne zapisane przez hak");
    assert_eq!(after.count_assigned(), 1, "pop 1 -> dokladnie 1 robotnik");
    assert_eq!(after.iter().count(), 1, "usuniete wpisy znikaja z mapy");
}

#[test]
fn hook_grow_from_empty_seeds_auto_and_fills_population() {
    let map = flat_map();
    let yf = equal_yield;
    let mut hook = OkolicaPopulationHook {
        map: &map,
        yield_of: &yf,
        territory: None,
    };
    let mut gc = city(OkolicaTryb::Reczny, None);
    gc.city.population = 2.0;
    hook.rebalance_workers_after_population_change(&mut gc, 0.0, 2.0, None);
    let after = gc.city.okolica_reczne.expect("seed zapisany");
    assert_eq!(
        after.count_assigned(),
        2,
        "seed z automatu: pop 2 -> 2 robotnikow"
    );
}

#[test]
fn hook_auto_mode_is_noop_and_keeps_absent_field_absent() {
    let map = flat_map();
    let yf = equal_yield;
    let mut hook = OkolicaPopulationHook {
        map: &map,
        yield_of: &yf,
        territory: None,
    };
    let mut gc = city(OkolicaTryb::Auto, None);
    hook.rebalance_workers_after_population_change(&mut gc, 1.0, 3.0, None);
    assert!(
        gc.city.okolica_reczne.is_none(),
        "tryb auto: brak zmiany pola"
    );
}

#[test]
fn hook_unchanged_population_leaves_manual_workers_untouched() {
    let map = flat_map();
    let yf = equal_yield;
    let mut hook = OkolicaPopulationHook {
        map: &map,
        yield_of: &yf,
        territory: None,
    };
    let keys = ["1,0", "0,1"];
    let mut gc = city(OkolicaTryb::Reczny, Some(reczne_of(&keys)));
    hook.on_city_population_changed("c1");
    hook.rebalance_workers_after_population_change(&mut gc, 2.0, 2.0, None);
    let after = gc.city.okolica_reczne.expect("pole zachowane");
    let got: Vec<(&str, f64)> = after.iter().collect();
    assert_eq!(got, vec![("1,0", 1.0), ("0,1", 1.0)]);
}
