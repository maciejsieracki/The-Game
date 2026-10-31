//! P6.8G — testy jednostkowe portu `gra/src/game/okolica.ts` (`domain::okolica`).
//! Oczekiwane wartości wyprowadzone ręcznie z kodu webowego (kolejność pętli `hexKeysWithinRadius`,
//! wzory `tileScore`, komparatory `compareScoredOkolicaTiles`). Wektory z uruchomionego weba
//! (pin 91dc998a) NIE są jeszcze wygenerowane — patrz dokument tematu.

use std::collections::BTreeSet;

use civ_engine::domain::improvement_build::{BuildHex, BuildMap};
use civ_engine::domain::improvements::TerrainType;
use civ_engine::domain::okolica::{
    adjust_tile_worker, assign_worked_tiles, compute_lost_to_nearer_sibling_by_city,
    is_land_workable_hex, okolica_tiles, rebalance_workers_after_population_change,
    surrounding_worker_cap, toggle_tile_worker, wagi_for_focus, AssignOptions, OkolicaCity,
    OkolicaFocus, OkolicaTryb, OkolicaYield, Reczne, Wagi,
};
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::{
    axial_distance, city_range_for_population as city_range, CityNode,
};
use civ_engine::domain::territory::TerritoryNode;

fn hx(q: i32, r: i32, terrain: TerrainType) -> BuildHex {
    BuildHex {
        q,
        r,
        terrain,
        overlay: Overlay::Brak,
        ulepszenie: None,
        ulepszenia: None,
        zloze: None,
        river_present: false,
    }
}

/// Pełny dysk hex o promieniu `rad` z jednolitym terenem.
fn disk(rad: i32, terrain: TerrainType) -> BuildMap {
    let mut hexes = Vec::new();
    for q in -rad..=rad {
        for r in -rad..=rad {
            if axial_distance(0, 0, q, r) <= f64::from(rad) {
                hexes.push(hx(q, r, terrain));
            }
        }
    }
    BuildMap::new(hexes, vec![])
}

fn flat(_q: i32, _r: i32) -> OkolicaYield {
    OkolicaYield {
        zywnosc: 1.0,
        praca: 1.0,
        handel: 1.0,
    }
}

fn city(q: i32, r: i32, pop: f64) -> OkolicaCity {
    OkolicaCity {
        id: format!("c{q}_{r}"),
        owner_id: 1,
        q,
        r,
        population: pop,
        focus: None,
        tryb: None,
        reczne: None,
    }
}

fn reczne_of(pairs: &[(&str, f64)]) -> Reczne {
    let mut r = Reczne::new();
    for (k, v) in pairs {
        r.set(k, *v);
    }
    r
}

#[test]
fn city_range_matches_web_params() {
    assert_eq!(city_range(0.0), 0.0);
    assert_eq!(city_range(1.0), 5.0);
    assert_eq!(city_range(9.0), 9.0);
    assert_eq!(city_range(20.0), 15.0);
    assert_eq!(city_range(f64::NAN), 0.0);
}

#[test]
fn wagi_for_focus_values() {
    assert_eq!(
        wagi_for_focus(OkolicaFocus::Zywnosc),
        Wagi {
            zywnosc: 10.0,
            praca: 0.0,
            handel: 0.0
        }
    );
    assert_eq!(
        wagi_for_focus(OkolicaFocus::Produkcja),
        Wagi {
            zywnosc: 0.5,
            praca: 3.0,
            handel: 0.5
        }
    );
    assert_eq!(
        wagi_for_focus(OkolicaFocus::Podatki),
        Wagi {
            zywnosc: 0.5,
            praca: 0.5,
            handel: 3.0
        }
    );
    assert_eq!(
        wagi_for_focus(OkolicaFocus::Zrownowazone),
        Wagi {
            zywnosc: 1.0,
            praca: 1.0,
            handel: 1.0
        }
    );
}

#[test]
fn okolica_tiles_radius_one_order_excludes_center() {
    let map = disk(1, TerrainType::Grassland);
    let tiles = okolica_tiles(0, 0, 1.0, &map, None);
    let keys: Vec<&str> = tiles.iter().map(|t| t.key.as_str()).collect();
    assert_eq!(keys, vec!["-1,0", "-1,1", "0,-1", "0,1", "1,-1", "1,0"]);
    assert!(tiles.iter().all(|t| t.dist == 1.0));
}

#[test]
fn okolica_tiles_radius_quirks() {
    let map = disk(1, TerrainType::Grassland);
    // radius 0 / NaN -> promień 1 (quirk webowy)
    assert_eq!(okolica_tiles(0, 0, 0.0, &map, None).len(), 6);
    assert_eq!(okolica_tiles(0, 0, f64::NAN, &map, None).len(), 6);
    // 0 < radius < 1 -> floor = 0 -> tylko centrum, które jest pomijane
    assert_eq!(okolica_tiles(0, 0, 0.5, &map, None).len(), 0);
}

#[test]
fn land_workable_excludes_ocean_and_mountains_only() {
    let map = BuildMap::new(
        vec![
            hx(0, 0, TerrainType::Grassland),
            hx(1, 0, TerrainType::Ocean),
            hx(2, 0, TerrainType::Mountains),
            hx(0, 1, TerrainType::ShallowWater),
        ],
        vec![],
    );
    assert!(is_land_workable_hex(&map, 0, 0));
    assert!(!is_land_workable_hex(&map, 1, 0));
    assert!(!is_land_workable_hex(&map, 2, 0));
    assert!(is_land_workable_hex(&map, 0, 1));
    assert!(!is_land_workable_hex(&map, 9, 9));
}

#[test]
fn assign_tie_break_distance_then_key() {
    let map = disk(2, TerrainType::Grassland);
    let res = assign_worked_tiles(0, 0, 3.0, &map, &flat, &AssignOptions::default());
    let keys: Vec<&str> = res.iter().map(|t| t.key.as_str()).collect();
    assert_eq!(keys, vec!["-1,0", "-1,1", "0,-1"]);
}

#[test]
fn zywnosc_focus_tie_break_prefers_higher_food() {
    let map = disk(1, TerrainType::Grassland);
    let yield_of = |q: i32, r: i32| match (q, r) {
        (1, 0) => OkolicaYield {
            zywnosc: 2.0,
            praca: 0.0,
            handel: 0.0,
        },
        (0, 1) => OkolicaYield {
            zywnosc: 0.0,
            praca: 2.0,
            handel: 0.0,
        },
        _ => OkolicaYield::default(),
    };
    let opts = AssignOptions {
        focus: Some(OkolicaFocus::Zywnosc),
        ..AssignOptions::default()
    };
    let res = assign_worked_tiles(0, 0, 1.0, &map, &yield_of, &opts);
    assert_eq!(res[0].key, "1,0");
    // bez fokusu żywność o remisie decyduje klucz: "0,1" < "1,0"
    let res2 = assign_worked_tiles(0, 0, 1.0, &map, &yield_of, &AssignOptions::default());
    assert_eq!(res2[0].key, "0,1");
}

#[test]
fn nan_score_is_treated_as_tie_without_panic() {
    let map = disk(1, TerrainType::Grassland);
    let yield_of = |q: i32, r: i32| {
        if (q, r) == (1, 0) {
            OkolicaYield {
                zywnosc: 0.0,
                praca: f64::NAN,
                handel: 0.0,
            }
        } else {
            OkolicaYield::default()
        }
    };
    let all = assign_worked_tiles(0, 0, 6.0, &map, &yield_of, &AssignOptions::default());
    assert_eq!(all.len(), 6);
    let two = assign_worked_tiles(0, 0, 2.0, &map, &yield_of, &AssignOptions::default());
    assert_eq!(two.len(), 2);
}

#[test]
fn other_city_centre_and_exclude_are_removed() {
    let map = disk(6, TerrainType::Grassland);
    let nodes = vec![
        TerritoryNode::new(CityNode::city(0, 0, 5.0), 1),
        TerritoryNode::new(CityNode::city(1, 0, 5.0), 1),
    ];
    let opts = AssignOptions {
        radius: Some(5.0),
        territory_nodes: Some(&nodes),
        owner_id: Some(1),
        ..AssignOptions::default()
    };
    let res = assign_worked_tiles(0, 0, 100.0, &map, &flat, &opts);
    let keys: BTreeSet<&str> = res.iter().map(|t| t.key.as_str()).collect();
    assert!(!keys.contains("1,0"), "centrum obcego miasta wykluczone");
    assert!(keys.contains("-1,0"));

    let mut ex = BTreeSet::new();
    ex.insert("-1,0".to_string());
    let opts_ex = AssignOptions {
        exclude_hex_keys: Some(&ex),
        ..opts
    };
    let res_ex = assign_worked_tiles(0, 0, 100.0, &map, &flat, &opts_ex);
    assert!(res_ex.iter().all(|t| t.key != "-1,0"));
}

#[test]
fn toggle_reasons_and_limit() {
    let map = disk(6, TerrainType::Grassland);
    let yf = flat;
    let c0 = city(0, 0, 0.0);
    let r = toggle_tile_worker(&c0, &map, &yf, 1, 0, None, None, None);
    assert_eq!(r.reason, Some("brak_ludnosci"));

    let mut c = city(0, 0, 1.0);
    c.tryb = Some(OkolicaTryb::Reczny);
    let r = toggle_tile_worker(&c, &map, &yf, 0, 0, None, None, None);
    assert_eq!(r.reason, Some("centrum_miasta"));

    let r = toggle_tile_worker(&c, &map, &yf, 1, 0, None, None, None);
    assert!(r.ok);
    assert_eq!(r.reczne.get("1,0"), 1.0);
    c.reczne = Some(r.reczne);

    let r = toggle_tile_worker(&c, &map, &yf, 0, 1, None, None, None);
    assert_eq!(r.reason, Some("limit_populacji"));

    let r = toggle_tile_worker(&c, &map, &yf, 1, 0, None, None, None);
    assert!(r.ok);
    assert_eq!(r.reczne.get("1,0"), 0.0);
    assert_eq!(r.reczne.count_assigned(), 0);
}

#[test]
fn adjust_is_directional_not_toggle() {
    let map = disk(6, TerrainType::Grassland);
    let mut c = city(0, 0, 2.0);
    c.tryb = Some(OkolicaTryb::Reczny);
    c.reczne = Some(reczne_of(&[("1,0", 1.0)]));

    let plus_occupied = adjust_tile_worker(&c, &map, &flat, 1, 0, 1, None, None, None);
    assert!(!plus_occupied.ok);
    assert_eq!(plus_occupied.reason, Some("juz_obsadzone"));
    assert_eq!(plus_occupied.reczne.get("1,0"), 1.0);

    let minus_empty = adjust_tile_worker(&c, &map, &flat, 0, 1, -1, None, None, None);
    assert_eq!(minus_empty.reason, Some("brak_robotnika"));

    let minus_occupied = adjust_tile_worker(&c, &map, &flat, 1, 0, -1, None, None, None);
    assert!(minus_occupied.ok);
    assert_eq!(minus_occupied.reczne.get("1,0"), 0.0);

    let plus_empty = adjust_tile_worker(&c, &map, &flat, 0, 1, 1, None, None, None);
    assert!(plus_empty.ok);
    assert_eq!(plus_empty.reczne.get("0,1"), 1.0);
}

#[test]
fn rebalance_shrink_removes_lowest_score_tile() {
    let map = disk(6, TerrainType::Grassland);
    let yf = |q: i32, r: i32| {
        if (q, r) == (1, 0) {
            OkolicaYield::default()
        } else {
            OkolicaYield {
                zywnosc: 1.0,
                praca: 1.0,
                handel: 1.0,
            }
        }
    };
    let mut c = city(0, 0, 2.0);
    c.tryb = Some(OkolicaTryb::Reczny);
    c.focus = Some(OkolicaFocus::Produkcja);
    c.reczne = Some(reczne_of(&[("0,1", 1.0), ("1,0", 1.0), ("0,-1", 1.0)]));
    rebalance_workers_after_population_change(&mut c, &map, &yf, 3.0, 2.0, None, None);
    let rec = c.reczne.unwrap();
    assert_eq!(rec.get("1,0"), 0.0);
    assert_eq!(rec.get("0,1"), 1.0);
    assert_eq!(rec.get("0,-1"), 1.0);
    assert_eq!(rec.count_assigned(), 2);
}

#[test]
fn rebalance_shrink_budget_is_exact_and_illegal_first() {
    let map = disk(6, TerrainType::Grassland);
    let yf = |q: i32, r: i32| {
        if (q, r) == (1, 0) {
            OkolicaYield::default()
        } else {
            OkolicaYield {
                zywnosc: 1.0,
                praca: 1.0,
                handel: 1.0,
            }
        }
    };
    let mut c = city(0, 0, 1.0);
    c.tryb = Some(OkolicaTryb::Reczny);
    c.focus = Some(OkolicaFocus::Produkcja);
    // "5,5" poza mapą (dystans 10 > 6) = nielegalny wpis; excess = 3 - 1 = 2
    c.reczne = Some(reczne_of(&[("5,5", 1.0), ("0,1", 1.0), ("1,0", 1.0)]));
    rebalance_workers_after_population_change(&mut c, &map, &yf, 3.0, 1.0, None, None);
    let rec = c.reczne.unwrap();
    assert_eq!(
        rec.count_assigned(),
        1,
        "dokładnie excess wpisów usuniętych"
    );
    assert_eq!(rec.get("5,5"), 0.0);
    assert_eq!(rec.get("1,0"), 0.0);
    assert_eq!(rec.get("0,1"), 1.0);
}

#[test]
fn rebalance_grow_seeds_when_empty_and_adds_when_partial() {
    let map = disk(6, TerrainType::Grassland);
    let mut c = city(0, 0, 0.0);
    c.tryb = Some(OkolicaTryb::Reczny);
    c.focus = Some(OkolicaFocus::Produkcja);
    rebalance_workers_after_population_change(&mut c, &map, &flat, 0.0, 2.0, None, None);
    let rec = c.reczne.clone().unwrap();
    assert_eq!(rec.count_assigned(), 2);
    assert_eq!(rec.get("-1,0"), 1.0);
    assert_eq!(rec.get("-1,1"), 1.0);

    let mut c2 = city(0, 0, 1.0);
    c2.tryb = Some(OkolicaTryb::Reczny);
    c2.reczne = Some(reczne_of(&[("0,1", 1.0)]));
    rebalance_workers_after_population_change(&mut c2, &map, &flat, 1.0, 2.0, None, None);
    let rec2 = c2.reczne.unwrap();
    assert_eq!(rec2.count_assigned(), 2);
    assert_eq!(rec2.get("0,1"), 1.0);
}

#[test]
fn rebalance_auto_mode_is_noop() {
    let map = disk(6, TerrainType::Grassland);
    let mut c = city(0, 0, 3.0);
    rebalance_workers_after_population_change(&mut c, &map, &flat, 1.0, 3.0, None, None);
    assert!(c.reczne.is_none());
}

#[test]
fn lost_to_nearer_sibling_tie_and_closer() {
    let map = disk(7, TerrainType::Grassland);
    let a = city(0, 0, 5.0);
    let b = city(2, 0, 5.0);
    let lost = compute_lost_to_nearer_sibling_by_city(&[a, b], &map);
    let lost_b = lost.get("c2_0").expect("B traci heksy");
    // (1,0): równy dystans 1 od obu; A ma niższy indeks -> wygrywa A, B traci
    assert!(lost_b.contains("1,0"));
    // (0,0): centrum A jest bliżej A (0 < 2) -> B traci
    assert!(lost_b.contains("0,0"));
    let lost_a = lost.get("c0_0").expect("A traci heksy");
    // centrum B jest bliżej B -> A traci
    assert!(lost_a.contains("2,0"));
    assert!(!lost_a.contains("1,0"));
}

#[test]
fn lost_map_empty_for_other_owners() {
    let map = disk(7, TerrainType::Grassland);
    let a = city(0, 0, 5.0);
    let mut b = city(2, 0, 5.0);
    b.owner_id = 2;
    let lost = compute_lost_to_nearer_sibling_by_city(&[a, b], &map);
    assert!(lost.is_empty());
}

/// Zabija mutacje M3 (usuniete `max(0, ...)` w `js_floor_nonneg`, wywolanie z `surrounding_worker_cap`):
/// ujemna populacja daje limit 0 (web `Math.max(0, Math.floor(population))`), a nie ujemny `floor`.
#[test]
fn negative_population_clamps_worker_cap_to_zero() {
    assert_eq!(surrounding_worker_cap(-0.5), 0.0);
    assert_eq!(surrounding_worker_cap(-3.0), 0.0);
    assert_eq!(surrounding_worker_cap(-1.0), 0.0);
    assert_eq!(surrounding_worker_cap(0.0), 0.0);
    assert_eq!(surrounding_worker_cap(2.7), 2.0);
}

/// Ujemna populacja w rebalansie trybu recznym (spadek do ujemnej wartosci) = pusty zbior robotnikow.
#[test]
fn negative_population_rebalance_empties_manual_workers() {
    let map = disk(2, TerrainType::Grassland);
    let mut c = city(0, 0, 3.0);
    c.tryb = Some(OkolicaTryb::Reczny);
    c.reczne = Some(reczne_of(&[("1,0", 1.0), ("0,1", 1.0), ("-1,0", 1.0)]));
    rebalance_workers_after_population_change(&mut c, &map, &flat, 3.0, -2.0, None, None);
    assert_eq!(c.reczne.as_ref().map(|r| r.count_assigned()), Some(0));
}
