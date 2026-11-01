//! P6.M07B-Q4 partia 4b: zrodla rzek (podnoze, zrodliska, gory/wzgorza, rozstaw).
//! Web (pin `4bbef081d`, gen-helpers.ts): `collectFoothillRiverSources` (:6867),
//! `collectPlainSpringSources` (:6900), `collectRiverSources` (:6926), `pickSpreadRiverSources`
//! (:6960). Wektory: `tests/p6_m07b4_vectors/web-rivers-b-q4.json` (`gen_q4_vectors.mjs`).

use std::collections::{HashMap, HashSet};

use crate::domain::mapgen::params::DensityTier;
use crate::domain::mapgen::prims::{hex_key, HEX_DIRECTIONS};
use crate::domain::mapgen::rivers_a::walk::is_relief_river_source;
use crate::domain::mapgen::rivers_a::{hex_axial_distance, is_river_land_terrain, neighbour};
use crate::domain::mapgen::terrain_class::HexRecord;

/// Web `collectFoothillRiverSources(hexes, width, height, margin, seaDist)` (:6867). Nizina
/// (lad rzeczny, nie relief) z `seaDist` w `[2, 120]` (brak wpisu = 0 -> odrzucony) i sasiadem
/// reliefowym; kolejnosc: rzad `r`, potem `q` (zakresy `margin..dim-margin`).
pub fn collect_foothill_river_sources(
    hexes: &HexRecord,
    width: i64,
    height: i64,
    margin: i64,
    sea_dist: &HashMap<String, i64>,
) -> Vec<(i64, i64)> {
    let mut out = Vec::new();
    for r in margin..height - margin {
        for q in margin..width - margin {
            let Some(hex) = hexes.get(&hex_key(q, r)) else {
                continue;
            };
            if !is_river_land_terrain(hex.terrain) || is_relief_river_source(hex.terrain) {
                continue;
            }
            let d = sea_dist.get(&hex_key(q, r)).copied().unwrap_or(0);
            if !(2..=120).contains(&d) {
                continue;
            }
            let relief_adj = HEX_DIRECTIONS.iter().any(|&dir| {
                let (nq, nr) = neighbour(q, r, dir);
                hexes
                    .get(&hex_key(nq, nr))
                    .is_some_and(|nh| is_relief_river_source(nh.terrain))
            });
            if relief_adj {
                out.push((q, r));
            }
        }
    }
    out
}

/// Web `collectPlainSpringSources(hexes, width, height, margin, seaDist, rand, tier)` (:6900).
/// Jak podnoze, ale `seaDist` w `[3, 65]` i losowanie: `rand()` wolane TYLKO dla heksow, ktore
/// przeszly wczesniejsze filtry; odrzut gdy `rand() > sampleRate` (high 0.11, low 0.035, medium 0.065).
pub fn collect_plain_spring_sources(
    hexes: &HexRecord,
    width: i64,
    height: i64,
    margin: i64,
    sea_dist: &HashMap<String, i64>,
    rand: &mut dyn FnMut() -> f64,
    tier: DensityTier,
) -> Vec<(i64, i64)> {
    let sample_rate = match tier {
        DensityTier::High => 0.11,
        DensityTier::Low => 0.035,
        DensityTier::Medium => 0.065,
    };
    let mut out = Vec::new();
    for r in margin..height - margin {
        for q in margin..width - margin {
            let Some(hex) = hexes.get(&hex_key(q, r)) else {
                continue;
            };
            if !is_river_land_terrain(hex.terrain) || is_relief_river_source(hex.terrain) {
                continue;
            }
            let d = sea_dist.get(&hex_key(q, r)).copied().unwrap_or(0);
            if !(3..=65).contains(&d) {
                continue;
            }
            if rand() > sample_rate {
                continue;
            }
            out.push((q, r));
        }
    }
    out
}

/// Web `collectRiverSources(hexes, width, height, margin)` (:6926): gory i wzgorza w `margin`.
pub fn collect_river_sources(
    hexes: &HexRecord,
    width: i64,
    height: i64,
    margin: i64,
) -> Vec<(i64, i64)> {
    let mut sources = Vec::new();
    for r in margin..height - margin {
        for q in margin..width - margin {
            let Some(hex) = hexes.get(&hex_key(q, r)) else {
                continue;
            };
            if is_relief_river_source(hex.terrain) {
                sources.push((q, r));
            }
        }
    }
    sources
}

/// Web `pickSpreadRiverSources(sources, count, minSep, seaDist, usedSources, rand)` (:6960).
/// Ranking: `rand()` (remis) wolane raz na KAZDE nieuzyte zrodlo w kolejnosci wejscia; sort
/// stabilny po `seaDist` malejaco (brak = 0), potem `tie` rosnaco; wybor zachlanny z odstepem
/// `hexAxialDistance >= minSep` od juz wybranych, do `count` sztuk.
pub fn pick_spread_river_sources(
    sources: &[(i64, i64)],
    count: i64,
    min_sep: i64,
    sea_dist: &HashMap<String, i64>,
    used_sources: &HashSet<String>,
    rand: &mut dyn FnMut() -> f64,
) -> Vec<(i64, i64)> {
    struct Ranked {
        q: i64,
        r: i64,
        dist: i64,
        tie: f64,
    }
    let mut ranked: Vec<Ranked> = Vec::new();
    for &(q, r) in sources {
        let k = hex_key(q, r);
        if used_sources.contains(&k) {
            continue;
        }
        let dist = sea_dist.get(&k).copied().unwrap_or(0);
        ranked.push(Ranked {
            q,
            r,
            dist,
            tie: rand(),
        });
    }
    ranked.sort_by(|a, b| {
        b.dist.cmp(&a.dist).then_with(|| {
            let d = a.tie - b.tie;
            if d < 0.0 {
                std::cmp::Ordering::Less
            } else if d > 0.0 {
                std::cmp::Ordering::Greater
            } else {
                std::cmp::Ordering::Equal
            }
        })
    });
    let mut picked: Vec<(i64, i64)> = Vec::new();
    for s in &ranked {
        if picked.len() as i64 >= count {
            break;
        }
        let too_close = picked
            .iter()
            .any(|&(pq, pr)| hex_axial_distance(pq, pr, s.q, s.r) < min_sep);
        if too_close {
            continue;
        }
        picked.push((s.q, s.r));
    }
    picked
}
