//! Wspolne narzedzia testow P6.M10 (dolaczane przez `#[path]`; plik lezy w `p6_m10_vectors/`,
//! wiec nie jest osobnym crate'm testowym). Wektory: `web-vectors.json` z URUCHOMIONEGO weba
//! (generator `gen-m10-vectors.mjs` w runie). Liczby f64 w wektorach sa TEKSTEM i porownujemy je
//! bit-w-bit (`to_bits`).
//!
//! `WebHooks` to testowa implementacja `ClusterLayoutHooks` (funkcje M11, `clusters.ts:1420-1654`)
//! przepisana z TS; jej zgodnosc z webem pilnuja wektory kategorii `hooks` (test
//! `hooks_match_web` w `p6_m10_placement.rs`), wiec blad hooka nie zaslania bledu M10.
#![allow(dead_code)]

use std::collections::HashMap;
use std::sync::OnceLock;

use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::map_generator::{GeneratedMap, HexTile, Terrain, WorldType};
use civ_engine::domain::mapgen::cluster_mass::{
    ClusterLayoutHooks, LandBBox, QuadrantSpread, SeaDist, SpawnLandCandidate,
};
use civ_engine::domain::rng::Mulberry32;
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("web-vectors.json");

pub fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(WEB_VECTORS).expect("web vectors parse"))
}

pub fn cases(name: &str) -> &'static Vec<Value> {
    web()["cases"][name]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {name}"))
}

pub fn fnv1a64(s: &str) -> String {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for b in s.as_bytes() {
        h ^= u64::from(*b);
        h = h.wrapping_mul(0x0000_0100_0000_01b3);
    }
    format!("{h:016x}")
}

pub fn i(v: &Value) -> i64 {
    v.as_i64().expect("i64")
}

pub fn u(v: &Value) -> usize {
    usize::try_from(v.as_u64().expect("u64")).expect("usize")
}

pub fn s(v: &Value) -> &str {
    v.as_str().expect("str")
}

/// f64 zapisany jako tekst (`Infinity`, `-Infinity`, `NaN`, `-0` tez).
pub fn fv(v: &Value) -> f64 {
    let t = s(v);
    match t {
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        "NaN" => f64::NAN,
        _ => t.parse::<f64>().unwrap_or_else(|_| panic!("f64 z '{t}'")),
    }
}

pub fn same_f64(got: f64, want: f64) -> bool {
    got.to_bits() == want.to_bits() || (got.is_nan() && want.is_nan())
}

pub fn assert_f64(got: f64, want: f64, ctx: &str) {
    assert!(same_f64(got, want), "{ctx}: rust {got:?} != web {want:?}");
}

pub fn hex(v: &Value) -> HexCoord {
    HexCoord::new(i(&v[0]) as i32, i(&v[1]) as i32)
}

pub fn hexes(v: &Value) -> Vec<HexCoord> {
    v.as_array().expect("lista hexow").iter().map(hex).collect()
}

pub fn opt_hex(v: &Value) -> Option<HexCoord> {
    if v.is_null() {
        None
    } else {
        Some(hex(v))
    }
}

pub fn digest_hexes(list: &[HexCoord]) -> String {
    fnv1a64(
        &list
            .iter()
            .map(|h| format!("{},{}", h.q, h.r))
            .collect::<Vec<_>>()
            .join(";"),
    )
}

/// Licznik wywolan `rand()` (porownywany z licznikiem weba).
pub struct CountedRand {
    rng: Mulberry32,
    pub calls: usize,
}

impl CountedRand {
    pub fn new(seed: i64) -> Self {
        Self {
            rng: Mulberry32::new(seed as u32),
            calls: 0,
        }
    }

    pub fn draw(&mut self) -> f64 {
        self.calls += 1;
        self.rng.next_f64()
    }
}

const CODES: [(char, Terrain); 8] = [
    ('m', Terrain::Sea),
    ('p', Terrain::ShallowSea),
    ('l', Terrain::Grassland),
    ('r', Terrain::Plains),
    ('w', Terrain::Hills),
    ('g', Terrain::Mountains),
    ('u', Terrain::Desert),
    ('o', Terrain::Polar),
];

pub fn terrain_of_code(c: char) -> Terrain {
    CODES
        .iter()
        .find(|(k, _)| *k == c)
        .map(|(_, t)| *t)
        .unwrap_or_else(|| panic!("kod terenu {c}"))
}

pub fn map_ids() -> Vec<String> {
    web()["maps"]
        .as_object()
        .expect("maps")
        .keys()
        .cloned()
        .collect()
}

pub fn rep(id: &str) -> &'static Value {
    &web()["maps"][id]
}

/// Mapa z reprezentacji (wiersz po wierszu, jak `Object.values(map.hexes)` w webie).
pub fn map_of(id: &str) -> &'static GeneratedMap {
    static MAPS: OnceLock<HashMap<String, GeneratedMap>> = OnceLock::new();
    let all = MAPS.get_or_init(|| {
        let mut out = HashMap::new();
        for id in map_ids() {
            let r = rep(&id);
            let (w, h) = (u(&r["w"]), u(&r["h"]));
            let terrain: Vec<char> = s(&r["terrain"]).chars().collect();
            let river: Vec<char> = s(&r["river"]).chars().collect();
            assert_eq!(terrain.len(), w * h, "{id}");
            assert_eq!(river.len(), w * h, "{id}");
            let tiles = (0..w * h)
                .map(|k| HexTile {
                    coord: civ_engine::domain::map_generator::HexCoord::new(
                        (k % w) as i32,
                        (k / w) as i32,
                    ),
                    terrain: terrain_of_code(terrain[k]),
                    forest: false,
                    river: river[k] == '1',
                })
                .collect();
            out.insert(
                id.clone(),
                GeneratedMap {
                    width: w as u32,
                    height: h as u32,
                    seed: 0,
                    world_type: WorldType::Continents,
                    tiles,
                },
            );
        }
        out
    });
    all.get(id).unwrap_or_else(|| panic!("brak mapy {id}"))
}

/// `buildSeaDistanceField` zapisany z weba (`-1` = hex nieosiagniety => brak klucza).
pub fn sea_of(id: &str) -> SeaDist {
    let r = rep(id);
    let w = u(&r["w"]);
    r["sea"]
        .as_array()
        .expect("sea")
        .iter()
        .enumerate()
        .filter(|(_, d)| i(d) >= 0)
        .map(|(k, d)| (((k % w) as i32, (k / w) as i32), i(d) as f64))
        .collect()
}

/// Hexy `isSpawnHabitableTerrain` (pula `ladowe` jak w `computeClusters`, clusters.ts:3439).
pub fn ladowe_of(id: &str) -> Vec<HexCoord> {
    use civ_engine::domain::mapgen::cluster_mass::is_spawn_habitable_terrain;
    map_of(id)
        .tiles
        .iter()
        .filter(|t| is_spawn_habitable_terrain(t.terrain))
        .map(|t| HexCoord::new(t.coord.q, t.coord.r))
        .collect()
}

pub fn center_of(id: &str) -> civ_engine::domain::mapgen::cluster_rivals::PointF64 {
    let r = rep(id);
    civ_engine::domain::mapgen::cluster_rivals::PointF64 {
        q: (i(&r["w"]) as f64 - 1.0) / 2.0,
        r: (i(&r["h"]) as f64 - 1.0) / 2.0,
    }
}

pub fn bbox_of_json(v: &Value) -> LandBBox {
    LandBBox {
        min_q: i(&v["minQ"]) as f64,
        max_q: i(&v["maxQ"]) as f64,
        min_r: i(&v["minR"]) as f64,
        max_r: i(&v["maxR"]) as f64,
    }
}

pub fn candidate_of(v: &Value) -> SpawnLandCandidate {
    use civ_engine::domain::mapgen::cluster_mass::LocalLandFraction;
    SpawnLandCandidate {
        h: HexCoord::new(i(&v[0]) as i32, i(&v[1]) as i32),
        land: LocalLandFraction {
            ratio: fv(&v[2]),
            land_count: i(&v[3]),
            total_count: i(&v[4]),
        },
        dev: i(&v[5]) as f64,
        sea: fv(&v[6]),
    }
}

/// Testowa implementacja funkcji M11 (przepisana z `clusters.ts:1420-1654`).
pub struct WebHooks;

impl ClusterLayoutHooks for WebHooks {
    fn sea_dist_at(&self, sea_dist: &SeaDist, q: i32, r: i32) -> f64 {
        sea_dist.get(&(q, r)).copied().unwrap_or(0.0)
    }

    fn passes_min_sea_dist_gate(&self, sea_dist: &SeaDist, q: i32, r: i32, min_dist: f64) -> bool {
        self.sea_dist_at(sea_dist, q, r) >= min_dist
    }

    fn capital_sea_band_penalty(&self, sea: f64, min_dist: f64, max_dist: f64) -> f64 {
        if min_dist <= 0.0 && max_dist <= 0.0 {
            return 0.0;
        }
        let lo = 0f64.max(min_dist);
        let hi = if max_dist > 0.0 { max_dist } else { lo + 5.0 };
        if sea < lo {
            return 1000.0 + (lo - sea);
        }
        if sea > hi {
            return 100.0 + (sea - hi);
        }
        let ideal = (lo + hi) / 2.0;
        (sea - ideal).abs()
    }

    fn land_quadrant_index(&self, q: i32, r: i32, mid_q: f64, mid_r: f64) -> usize {
        let east = usize::from(f64::from(q) >= mid_q);
        let south = usize::from(f64::from(r) >= mid_r);
        east + south * 2
    }

    fn count_centers_per_quadrant(
        &self,
        centers: &[HexCoord],
        mid_q: f64,
        mid_r: f64,
    ) -> [usize; 4] {
        let mut counts = [0usize; 4];
        for c in centers {
            counts[self.land_quadrant_index(c.q, c.r, mid_q, mid_r)] += 1;
        }
        counts
    }

    fn preferred_quadrants_for_spread(
        &self,
        quad_counts: &[usize; 4],
        n_needed: i64,
    ) -> Option<Vec<usize>> {
        if n_needed < 5 {
            return None;
        }
        let required = self.minimum_spread_quarters_required(n_needed);
        let occupied = quad_counts.iter().filter(|c| **c > 0).count();
        let empty: Vec<usize> = (0..4).filter(|q| quad_counts[*q] == 0).collect();
        if occupied < required && !empty.is_empty() {
            return Some(empty);
        }
        let min_count = *quad_counts.iter().min().expect("4 ćwiartki");
        Some((0..4).filter(|q| quad_counts[*q] == min_count).collect())
    }

    fn minimum_spread_quarters_required(&self, n_needed: i64) -> usize {
        if n_needed >= 6 {
            return 3;
        }
        if n_needed >= 5 {
            return 3;
        }
        if n_needed >= 3 {
            return 2;
        }
        1
    }

    fn cluster_center_quadrant_spread(
        &self,
        centers: &[HexCoord],
        land_bbox: &LandBBox,
    ) -> QuadrantSpread {
        if centers.is_empty() {
            return QuadrantSpread {
                occupied_quadrants: 0,
                q_span: 0.0,
                r_span: 0.0,
            };
        }
        let mid_q = (land_bbox.min_q + land_bbox.max_q) / 2.0;
        let mid_r = (land_bbox.min_r + land_bbox.max_r) / 2.0;
        let mut quads = std::collections::HashSet::new();
        let (mut min_q, mut max_q) = (f64::INFINITY, f64::NEG_INFINITY);
        let (mut min_r, mut max_r) = (f64::INFINITY, f64::NEG_INFINITY);
        for c in centers {
            quads.insert(self.land_quadrant_index(c.q, c.r, mid_q, mid_r));
            min_q = min_q.min(f64::from(c.q));
            max_q = max_q.max(f64::from(c.q));
            min_r = min_r.min(f64::from(c.r));
            max_r = max_r.max(f64::from(c.r));
        }
        QuadrantSpread {
            occupied_quadrants: quads.len(),
            q_span: max_q - min_q,
            r_span: max_r - min_r,
        }
    }

    fn min_capital_separation_distance(&self, c: HexCoord, others: &[HexCoord]) -> Option<f64> {
        if others.is_empty() {
            return None;
        }
        let mut best = f64::INFINITY;
        for p in others {
            let d = c.distance(*p) as f64;
            if d < best {
                best = d;
            }
        }
        Some(best)
    }
}
