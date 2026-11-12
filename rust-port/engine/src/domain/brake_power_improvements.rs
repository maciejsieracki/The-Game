//! P6-POWER-ULEPSZENIA (Q1): producent skladnika `ulepszenia` (`ulepszenieTerenu`) `computeObjectivePower`.
//!
//! Web (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75):
//! - `countImprovementsForOwner(ownerId)` = `nodes.length === 0 ? 0 : countImprovementsForNodes(nodes)`,
//!   gra/src/main.ts:2643-2653 (galaz cache `hudPureScope` nie zmienia wartosci);
//! - `nodes` = `statsTerritoryNodesForOwner(ownerId)` = `foundingNodesForOwner(owner, cityNodesForOwner(owner),
//!   fortNodes)`, gra/src/main.ts:5657 / :5661 (miasta wlasciciela jako `{q, r, pop, level: 1}`) oraz
//!   gra/src/game/fort-territory.ts:199 (wlasne, nie-bezuzyteczne forty/posterunki);
//! - `countImprovementsForNodes(nodes)`, gra/src/main.ts:2654-2668: suma po UNII dyskow promieni
//!   `cityTerritoryRadius(node)` (gra/src/map/territory.ts:89) po ISTNIEJACYCH heksach mapy, bez duplikatow
//!   (`seen`), kazdy heks wnosi `improvementKeysForHex(hex).length` (gra/src/game/terrain-improvements.ts:358),
//!   czyli liczbe roznych, znanych kluczy warstw ulepszen tego heksa.
//! - Wklad do Power: `ulepszenia.count * coeff.ulepszenie_terenu` (power-params.json `ulepszenie_terenu.pkt` = 5,
//!   liczone w `brake_power::compute_objective_power`); producent zwraca surowy licznik, tak jak `terytorium`.
//!
//! Wektory: tests/p6_power_improvements_vectors/vectors.json (generator tests/p6_power_improvements_gen.mjs
//! wykonuje wyciete funkcje weba z pinu 07d2fbd72). Ta funkcja NIE jest wpisywana przez `apply_produced`
//! (jak terytorium) - wolajacy W8 podaje wynik w `ObjectivePowerRaw`.

use std::collections::BTreeSet;

use super::brake_power_army::TerritoryCityInput;
use super::improvement_build::BuildHex;
use super::improvements::{improvement_keys_for_hex, HexLike};
use super::terrain::{city_territory_radius, founding_nodes_for_owner, CityNode, FortNode};

/// Web `improvementKeysForHex(hex).length` dla heksa w postaci `HexLike` (pola czytane przez klucze: warstwy i
/// pojedyncze ulepszenie; nakladka i zloze nie wplywaja na liczbe kluczy).
pub fn improvement_count_for_hex(hex: &HexLike) -> usize {
    improvement_keys_for_hex(hex).len()
}

/// Jak `improvement_count_for_hex`, dla heksa mapy budowania (`BuildHex`, pola `ulepszenie`/`ulepszenia`).
pub fn improvement_count_for_build_hex(hex: &BuildHex) -> usize {
    improvement_count_for_hex(&HexLike {
        ulepszenie: hex.ulepszenie.clone(),
        ulepszenia: hex.ulepszenia.clone(),
        ..HexLike::default()
    })
}

/// Web `hexKeysWithinRadiusRaw` / `hexKeysWithinRadius` (okolica.ts): wspolrzedne dysku hex; promien
/// niefinityczny lub <= 0 -> 0 (web `Math.floor`). Kolejnosc bez znaczenia (suma po zbiorze).
fn hex_disk(cq: i32, cr: i32, rad: f64) -> Vec<(i32, i32)> {
    let r = if rad.is_finite() && rad > 0.0 {
        rad.floor() as i32
    } else {
        0
    };
    let mut out = Vec::new();
    for dq in -r..=r {
        let lo = (-r).max(-dq - r);
        let hi = r.min(-dq + r);
        for dr in lo..=hi {
            out.push((cq + dq, cr + dr));
        }
    }
    out
}

/// Web `countImprovementsForNodes(nodes)` (main.ts:2654-2668). `hex_improvements(q, r)` = web `map.hexes[key]`
/// istnieje ? `Some(improvementKeysForHex(hex).length)` : `None`. Heks spoza mapy nie wchodzi do `seen`
/// (jak w webie: `if (!hex) continue` przed `seen.add`).
pub fn count_improvements_for_nodes(
    nodes: &[CityNode],
    hex_improvements: &dyn Fn(i32, i32) -> Option<usize>,
) -> usize {
    let mut seen: BTreeSet<(i32, i32)> = BTreeSet::new();
    let mut total = 0;
    for node in nodes {
        for (q, r) in hex_disk(node.q, node.r, city_territory_radius(node)) {
            if seen.contains(&(q, r)) {
                continue;
            }
            let Some(count) = hex_improvements(q, r) else {
                continue;
            };
            seen.insert((q, r));
            total += count;
        }
    }
    total
}

/// Producent `ulepszenia` (web `countImprovementsForOwner(ownerId)`, main.ts:2643). Wezly = miasta wlasciciela
/// (`CityNode::city`, jak web `cityNodesForOwner`) + wlasne nie-bezuzyteczne forty/posterunki
/// (`founding_nodes_for_owner`, jak web `foundingNodesForOwner`). Brak wezlow -> 0 (web).
pub fn ulepszenia_for_owner(
    cities: &[TerritoryCityInput],
    forts: &[FortNode],
    owner_id: i64,
    hex_improvements: &dyn Fn(i32, i32) -> Option<usize>,
) -> f64 {
    let own: Vec<CityNode> = cities
        .iter()
        .filter(|c| c.owner_id == owner_id)
        .map(|c| CityNode::city(c.q, c.r, c.population))
        .collect();
    let nodes = founding_nodes_for_owner(owner_id, &own, forts);
    if nodes.is_empty() {
        return 0.0;
    }
    count_improvements_for_nodes(&nodes, hex_improvements) as f64
}
