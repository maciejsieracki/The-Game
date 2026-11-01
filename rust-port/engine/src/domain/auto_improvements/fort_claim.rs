//! P6.8I (8I-P2a): port `pickFortClaims` + `FortClaimArgs` (E-FORT, `auto-improvements.ts:600-730`, pin
//! 4bbef081d). Fort/posterunek na cennym terenie (zloze / gory) na granicy dostepnej budowy, gdy limit
//! miast jest wyczerpany.
//!
//! ZALOZENIE: `territoryOwnerAt(...) === null` jest tu liczone jako "zaden wezel nie obejmuje heksu"
//! (rownowazne dla `null`-owosci: nowa semantyka miasto-przed-fortem/`order` zmienia tylko KTO jest
//! wlascicielem, nie czy ktos nim jest); promienie wezlow wg pinu (`territory_radius_pin`, fort 5 /
//! posterunek 3), bo `terrain::city_territory_radius` czyta jeszcze stare dane 10/5.

use std::collections::BTreeSet;

use super::opts::{AutoImprovementCity, AutoImprovementPick, PickAutoImprovementsOpts};
use super::single_pass::{cmp_city_id, parse_key, Shared};
use super::{js_max, js_min, territory_radius_pin, FORT_CLAIM_KEYS, FORT_CLAIM_MIN_NEW_HEXES};
use crate::domain::improvement_build::{
    get_improvement_meta, hex_has_deposit_reserve, hex_keys_within_radius,
};
use crate::domain::improvements::TerrainType;
use crate::domain::terrain::{axial_distance, CityNode};

/// Wartosci budzetu przekazywane z `pickAutoImprovementsSinglePass` (czesc `FortClaimArgs`).
pub(super) struct FortBudget {
    pub praca_left: f64,
    pub reserve: f64,
    pub imperium_budget_cap: f64,
    pub global_pula_at_entry: f64,
    pub praca_budget_percent: f64,
}

#[derive(Clone, Copy)]
struct Circle {
    q: i32,
    r: i32,
    rad: f64,
}

fn fort_node(is_fort: bool) -> CityNode {
    CityNode {
        q: 0,
        r: 0,
        is_outpost: Some(!is_fort),
        is_fort: Some(is_fort),
        pop: 0.0,
        level: 1.0,
        civ: None,
    }
}

fn radius_of(key: &str) -> f64 {
    let mut n = fort_node(key == "fort");
    n.is_fort = Some(key == "fort");
    n.is_outpost = Some(key == "posterunek");
    territory_radius_pin(&n)
}

struct Best {
    q: i32,
    r: i32,
    key: String,
    gain: f64,
    dist: f64,
    koszt: f64,
}

/// Web `pickFortClaims`.
pub(super) fn pick_fort_claims(
    opts: &PickAutoImprovementsOpts,
    sh: &mut Shared,
    budget: FortBudget,
) -> Vec<AutoImprovementPick> {
    let map = sh.map;
    let owner_id = opts.owner_id;
    let territory_nodes = opts.territory_nodes.clone().unwrap_or_default();
    let mut picks: Vec<AutoImprovementPick> = Vec::new();

    let mut fort_circles: Vec<Circle> = Vec::new();
    for n in &territory_nodes {
        if n.node.is_fort == Some(true) || n.node.is_outpost == Some(true) {
            fort_circles.push(Circle {
                q: n.node.q,
                r: n.node.r,
                rad: territory_radius_pin(&n.node),
            });
        }
    }
    let placed_snapshot: Vec<(String, Vec<String>)> = sh
        .state
        .placed_improvements
        .iter()
        .flatten()
        .map(|(hk, v)| {
            let layers = match v {
                crate::domain::improvement_build::PlacedLayers::Many(l) => l.clone(),
                crate::domain::improvement_build::PlacedLayers::One(s) => vec![s.clone()],
            };
            (hk.clone(), layers)
        })
        .collect();
    for (hk, layers) in &placed_snapshot {
        let (q, r) = parse_key(hk);
        for l in layers {
            if (l == "fort" || l == "posterunek")
                && !fort_circles.iter().any(|f| f.q == q && f.r == r)
            {
                fort_circles.push(Circle {
                    q,
                    r,
                    rad: radius_of(l),
                });
            }
        }
    }
    let mut city_hexes: BTreeSet<String> = BTreeSet::new();
    for n in &territory_nodes {
        if n.node.is_fort != Some(true) && n.node.is_outpost != Some(true) {
            city_hexes.insert(format!("{},{}", n.node.q, n.node.r));
        }
    }
    let mut own_nodes: Vec<Circle> = territory_nodes
        .iter()
        .filter(|n| n.owner_id == owner_id)
        .map(|n| Circle {
            q: n.node.q,
            r: n.node.r,
            rad: territory_radius_pin(&n.node),
        })
        .collect();
    for c in &opts.cities {
        if !own_nodes.iter().any(|n| n.q == c.q && n.r == c.r) {
            own_nodes.push(Circle {
                q: c.q,
                r: c.r,
                rad: territory_radius_pin(&CityNode::city(c.q, c.r, c.population)),
            });
        }
    }
    let mut praca_left = budget.praca_left;
    let mut global_spent = 0.0_f64;
    // `nodesNow` do liczenia zysku: (q, r, promien) wezlow (poczatkowe + postawione w tym wywolaniu).
    let mut nodes_now: Vec<Circle> = territory_nodes
        .iter()
        .map(|n| Circle {
            q: n.node.q,
            r: n.node.r,
            rad: territory_radius_pin(&n.node),
        })
        .collect();
    let keys: Vec<&str> = FORT_CLAIM_KEYS
        .iter()
        .copied()
        .filter(|k| get_improvement_meta(k).is_some() && sh.tech_ok(k) && sh.civ_ok(k))
        .collect();
    if keys.is_empty() {
        return picks;
    }
    let mut ordered: Vec<&AutoImprovementCity> = opts.cities.iter().collect();
    ordered.sort_by(|a, b| cmp_city_id(a, b));
    for city in ordered {
        if praca_left <= budget.reserve {
            break;
        }
        let pct = js_max(
            0.0,
            js_min(
                100.0,
                match opts.get_praca_budget_percent {
                    Some(f) => f(city),
                    None => budget.praca_budget_percent,
                },
            ),
        );
        let effective_city_cap = js_min(
            (pct / 100.0) * budget.global_pula_at_entry,
            budget.imperium_budget_cap,
        );
        let mut best: Option<Best> = None;
        let mut seen: BTreeSet<String> = BTreeSet::new();
        for node in own_nodes.clone() {
            for hk in hex_keys_within_radius(node.q, node.r, node.rad, map) {
                if !seen.insert(hk.clone()) {
                    continue;
                }
                let Some(hex) = map.hex(&hk) else { continue };
                if !(hex.terrain == TerrainType::Gory || hex_has_deposit_reserve(hex)) {
                    continue;
                }
                if city_hexes.contains(&hk) {
                    continue;
                }
                let (q, r) = parse_key(&hk);
                if sh
                    .placed(&hk)
                    .iter()
                    .any(|k| k == "fort" || k == "posterunek")
                {
                    continue;
                }
                for key in &keys {
                    let Some(meta) = get_improvement_meta(key) else {
                        continue;
                    };
                    let rad = radius_of(key);
                    if fort_circles
                        .iter()
                        .any(|f| axial_distance(q, r, f.q, f.r) <= rad + f.rad)
                    {
                        continue;
                    }
                    if !sh.qualifies(key, q, r) {
                        continue;
                    }
                    let mut gain = 0.0;
                    for nk in hex_keys_within_radius(q, r, rad, map) {
                        let Some(nh) = map.hex(&nk) else { continue };
                        if nh.terrain == TerrainType::Morze
                            || nh.terrain == TerrainType::PlytkieMorze
                        {
                            continue;
                        }
                        let (nq, nr) = parse_key(&nk);
                        if nodes_now
                            .iter()
                            .all(|n| axial_distance(nq, nr, n.q, n.r) > n.rad)
                        {
                            gain += 1.0;
                        }
                    }
                    if gain < FORT_CLAIM_MIN_NEW_HEXES {
                        continue;
                    }
                    let mut dist = f64::INFINITY;
                    for n in &own_nodes {
                        dist = js_min(dist, axial_distance(q, r, n.q, n.r));
                    }
                    let better = match &best {
                        None => true,
                        Some(b) => {
                            gain > b.gain
                                || (gain == b.gain && dist > b.dist)
                                || (gain == b.gain
                                    && dist == b.dist
                                    && (q < b.q || (q == b.q && r < b.r)))
                        }
                    };
                    if better {
                        best = Some(Best {
                            q,
                            r,
                            key: (*key).to_owned(),
                            gain,
                            dist,
                            koszt: meta.koszt_praca,
                        });
                    }
                    break;
                }
            }
        }
        let Some(best) = best else { continue };
        if best.koszt > praca_left {
            continue;
        }
        if praca_left - best.koszt < budget.reserve {
            continue;
        }
        if global_spent + best.koszt > effective_city_cap {
            continue;
        }
        picks.push(AutoImprovementPick {
            owner_id,
            city_id: city.id.clone(),
            q: best.q,
            r: best.r,
            key: best.key.clone(),
            koszt_praca: best.koszt,
        });
        praca_left -= best.koszt;
        global_spent += best.koszt;
        let hk = format!("{},{}", best.q, best.r);
        sh.add_layer(&hk, &best.key);
        let c = Circle {
            q: best.q,
            r: best.r,
            rad: radius_of(&best.key),
        };
        fort_circles.push(c);
        own_nodes.push(c);
        nodes_now.push(c);
    }
    picks
}
