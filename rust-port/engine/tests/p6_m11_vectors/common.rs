//! Wspolne narzedzia testow P6.M11 (dolaczane przez `#[path]`; plik lezy w `p6_m11_vectors/`,
//! wiec nie jest osobnym crate'm testowym). Wektory: `web-vectors.json` z URUCHOMIONEGO weba
//! (generator `gen-m11-vectors.mjs` w runie). Liczby f64 w wektorach sa TEKSTEM i porownujemy je
//! bit-w-bit (`to_bits`). Funkcje M11 uzywaja PRAWDZIWEJ implementacji cechy
//! `ClusterLayoutHooks` z `cluster_layout` (w M10 byla testowa `WebHooks`).
#![allow(dead_code)]

use std::collections::HashMap;
use std::sync::OnceLock;

use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::map_generator::{GeneratedMap, HexTile, Terrain, WorldType};
use civ_engine::domain::mapgen::cluster_mass::{
    ClusterCity, LandBBox, SeaDist, SpawnLandCandidate, TypeCluster,
};
use civ_engine::domain::mapgen::cluster_rivals::{AnchorHex, PointF64};
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
    // Porownanie BITOWE (rozroznia 0 i -0, kazda inna wartosc musi miec identyczne bity).
    // Jedyny wyjatek: NaN. W JS istnieje jedna wartosc NaN (ECMAScript: brak obserwowalnego
    // ladunku/znaku), a wektory zapisuja ja tekstem "NaN"; Rust produkuje NaN o bitach zaleznych
    // od instrukcji (0.0/0.0 na x86 daje 0xFFF8...), wiec oba NaN sprowadzamy do kanonicznego.
    let canon = |x: f64| if x.is_nan() { f64::NAN } else { x };
    canon(got).to_bits() == canon(want).to_bits()
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

pub fn center_of(id: &str) -> PointF64 {
    let r = rep(id);
    PointF64 {
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

/// `[ "q", "r" ]` zapisane jako tekst (f64) -> punkt.
pub fn pt(v: &Value) -> PointF64 {
    PointF64 {
        q: fv(&v[0]),
        r: fv(&v[1]),
    }
}

/// `[q, r, minDist]` albo `null` -> anchor.
pub fn anchor_of(v: &Value) -> Option<AnchorHex> {
    if v.is_null() {
        return None;
    }
    Some(AnchorHex {
        q: i(&v[0]) as i32,
        r: i(&v[1]) as i32,
        min_dist: i(&v[2]),
    })
}

/// `{ minQ, maxQ, minR, maxR }` albo `null`.
pub fn opt_bbox(v: &Value) -> Option<LandBBox> {
    if v.is_null() {
        None
    } else {
        Some(bbox_of_json(v))
    }
}

/// Klaster zapisany przez generator (`kOut`) -> `TypeCluster`.
pub fn cluster_of(v: &Value) -> TypeCluster {
    TypeCluster {
        typ_index: u(&v["typIndex"]),
        typ: s(&v["typ"]).to_string(),
        centrum: hex(&v["centrum"]),
        miasta: cities_of(&v["miasta"]),
        pending_state_slots: if v["pending"].is_null() {
            None
        } else {
            Some(hexes(&v["pending"]))
        },
        growth_slot: match &v["growth"] {
            Value::String(t) if t == "absent" => None,
            Value::String(t) if t == "null" => Some(None),
            other => Some(Some(hex(other))),
        },
    }
}

pub fn clusters_of(v: &Value) -> Vec<TypeCluster> {
    v.as_array()
        .expect("klastry")
        .iter()
        .map(cluster_of)
        .collect()
}

pub fn cities_of(v: &Value) -> Vec<ClusterCity> {
    v.as_array()
        .expect("miasta")
        .iter()
        .map(|m| ClusterCity {
            q: i(&m[0]) as i32,
            r: i(&m[1]) as i32,
            is_capital: m[2].as_bool().expect("isCapital"),
        })
        .collect()
}

/// Pula `ladowe` mapy (memo; kolejnosc kafli mapy).
pub fn lad(id: &str) -> &'static Vec<HexCoord> {
    static M: OnceLock<HashMap<String, Vec<HexCoord>>> = OnceLock::new();
    M.get_or_init(|| {
        map_ids()
            .into_iter()
            .map(|k| (ladowe_of(&k), k))
            .map(|(v, k)| (k, v))
            .collect()
    })
    .get(id)
    .unwrap_or_else(|| panic!("brak mapy {id}"))
}

/// Cache mas mapy (memo): `createMassLandCache(ladowe)`.
pub fn cache(id: &str) -> &'static civ_engine::domain::mapgen::cluster_mass::MassLandCache {
    static M: OnceLock<HashMap<String, civ_engine::domain::mapgen::cluster_mass::MassLandCache>> =
        OnceLock::new();
    M.get_or_init(|| {
        map_ids()
            .into_iter()
            .map(|k| {
                let c = civ_engine::domain::mapgen::cluster_mass::create_mass_land_cache(lad(&k));
                (k, c)
            })
            .collect()
    })
    .get(id)
    .unwrap_or_else(|| panic!("brak mapy {id}"))
}

/// Pole morza mapy (memo).
pub fn sea(id: &str) -> &'static SeaDist {
    static M: OnceLock<HashMap<String, SeaDist>> = OnceLock::new();
    M.get_or_init(|| {
        map_ids()
            .into_iter()
            .map(|k| (k.clone(), sea_of(&k)))
            .collect()
    })
    .get(id)
    .unwrap_or_else(|| panic!("brak mapy {id}"))
}

/// `{ n, fnv }` regionu (kolejnosc hexow ma znaczenie).
pub fn region_matches(region: &[HexCoord], want: &Value) -> bool {
    region.len() == u(&want["n"]) && digest_hexes(region) == s(&want["fnv"])
}

pub fn regions_match(regions: &[Vec<HexCoord>], want: &Value) -> bool {
    let w = want.as_array().expect("regiony");
    regions.len() == w.len() && regions.iter().zip(w).all(|(r, d)| region_matches(r, d))
}
