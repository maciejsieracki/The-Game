//! Wspolne narzedzia testow P6.M12 (dolaczane przez `#[path]`; plik lezy w `p6_m12_vectors/`, wiec
//! nie jest osobnym crate'm testowym). Wektory: `web-vectors.json` z URUCHOMIONEGO weba (generator
//! `gen-m12-vectors.mjs` w runie). Wyniki `computeClusters` / `buildClusterSpawnPlan` to same liczby
//! calkowite i napisy, wiec porownanie jest dokladne (zadnych f64 do porownania bitowego).
#![allow(dead_code)]

use std::collections::HashMap;
use std::sync::OnceLock;

use civ_engine::data::civilizations::{parse_civs, CivsFile};
use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::map_generator::{GeneratedMap, HexTile, Terrain, WorldType};
use civ_engine::domain::mapgen::cluster_compute::{ClusterPlacement, ComputeClustersOpts};
use civ_engine::domain::mapgen::cluster_mass::{ClusterCity, TypeCluster};
use civ_engine::domain::unit_epoch::CivEntryRow;
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

pub fn hex(v: &Value) -> HexCoord {
    HexCoord::new(i(&v[0]) as i32, i(&v[1]) as i32)
}

pub fn hexes(v: &Value) -> Vec<HexCoord> {
    v.as_array().expect("lista hexow").iter().map(hex).collect()
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

/// Dane cywilizacji (`gra/data/civs.json`, identyczne z danymi weba pinu).
pub fn civs() -> &'static CivsFile {
    static C: OnceLock<CivsFile> = OnceLock::new();
    C.get_or_init(|| parse_civs().expect("civs.json parse"))
}

/// Wiersze rosteru (`civs.cywilizacje` jako `CivEntryEpochRow`) + magazyn `epokiStartowe`.
pub struct RosterRows {
    startowe: Vec<Vec<&'static str>>,
}

impl RosterRows {
    pub fn new() -> Self {
        Self {
            startowe: civs()
                .cywilizacje
                .iter()
                .map(|c| c.epoki_startowe.iter().map(String::as_str).collect())
                .collect(),
        }
    }

    pub fn rows(&self) -> Vec<CivEntryRow<'_>> {
        civs()
            .cywilizacje
            .iter()
            .zip(self.startowe.iter())
            .map(|(c, st)| CivEntryRow {
                ikona_id: Some(c.ikona_id.as_str()),
                epoka_wejscia: Some(c.epoka_wejscia.as_str()),
                epoki_startowe: Some(st.as_slice()),
            })
            .collect()
    }
}

/// Wejscie przypadku `compute` (pola `spec` z wektora).
pub struct Spec {
    pub seed: Option<u32>,
    pub aktywne_typy: Option<i64>,
    pub player_typ: Option<String>,
    pub min_dystans: Option<i64>,
    pub rywale: Option<i64>,
    pub min_dyst_kl: Option<i64>,
    pub epoch: Option<String>,
    pub roster: bool,
    pub pools: bool,
    pub preferred: Option<Vec<String>>,
}

fn opt_i(v: &Value) -> Option<i64> {
    if v.is_null() {
        None
    } else {
        Some(i(v))
    }
}

fn opt_s(v: &Value) -> Option<String> {
    if v.is_null() {
        None
    } else {
        Some(s(v).to_string())
    }
}

pub fn spec_of(v: &Value) -> Spec {
    Spec {
        seed: opt_i(&v["seed"]).map(|x| u32::try_from(x).expect("seed u32")),
        aktywne_typy: opt_i(&v["aktywneTypy"]),
        player_typ: opt_s(&v["playerTyp"]),
        min_dystans: opt_i(&v["minDystans"]),
        rywale: opt_i(&v["rywale"]),
        min_dyst_kl: opt_i(&v["minDystKl"]),
        epoch: opt_s(&v["epoch"]),
        roster: v["roster"].as_bool().unwrap_or(false),
        pools: v["pools"].as_bool().unwrap_or(false),
        preferred: if v["preferred"].is_null() {
            None
        } else {
            Some(
                v["preferred"]
                    .as_array()
                    .expect("preferred")
                    .iter()
                    .map(|x| s(x).to_string())
                    .collect(),
            )
        },
    }
}

impl Spec {
    pub fn opts<'a>(&'a self, rows: Option<&'a [CivEntryRow<'a>]>) -> ComputeClustersOpts<'a> {
        ComputeClustersOpts {
            seed: self.seed,
            aktywne_typy: self.aktywne_typy,
            player_typ: self.player_typ.as_deref(),
            min_dystans: self.min_dystans,
            rywale_na_klaster: self.rywale,
            min_dystans_klastrow: self.min_dyst_kl,
            start_epoch_id: self.epoch.as_deref(),
            civ_roster: if self.roster { rows } else { None },
            preferred_civ_ids: self.preferred.as_deref(),
        }
    }
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

/// Klaster zapisany przez generator (`clusterOut`) -> `TypeCluster`.
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

/// Sygnatura pola morza w kolejnosci hexow mapy (jak `seaSignature` w generatorze).
pub fn sea_signature(map: &GeneratedMap, sea: &HashMap<(i32, i32), f64>) -> (usize, String) {
    let parts: Vec<String> = map
        .tiles
        .iter()
        .map(|t| {
            let k = (t.coord.q, t.coord.r);
            match sea.get(&k) {
                Some(d) => format!("{},{}={}", k.0, k.1, *d as i64),
                None => format!("{},{}=-", k.0, k.1),
            }
        })
        .collect();
    (sea.len(), fnv1a64(&parts.join(";")))
}

/// Porownanie wyniku z wektorem `placementOut`. Zwraca opis pierwszej roznicy.
pub fn placement_diff(map: &GeneratedMap, got: &ClusterPlacement, want: &Value) -> Option<String> {
    macro_rules! eq {
        ($name:expr, $a:expr, $b:expr) => {
            if $a != $b {
                return Some(format!("{}: rust {:?} != web {:?}", $name, $a, $b));
            }
        };
    }
    eq!("rozmiar", got.rozmiar_mapy.key(), s(&want["rozmiar"]));
    eq!("aktywne", got.aktywne_typy, i(&want["aktywne"]));
    eq!("requested", got.requested_typy, i(&want["requested"]));
    eq!(
        "minDyst",
        got.min_dystans_miasta_panstwa,
        i(&want["minDyst"])
    );
    eq!(
        "maxDyst",
        got.max_dystans_miasta_panstwa,
        i(&want["maxDyst"])
    );
    eq!(
        "minObcy",
        got.min_dystans_obcy_od_gracza,
        i(&want["minObcy"])
    );
    eq!(
        "playerTypIndex",
        got.player_typ_index,
        u(&want["playerTypIndex"])
    );
    let want_k = want["klastry"].as_array().expect("klastry");
    eq!("liczba klastrow", got.klastry.len(), want_k.len());
    for (idx, (g, w)) in got.klastry.iter().zip(want_k).enumerate() {
        let wk = cluster_of(w);
        if *g != wk {
            return Some(format!("klaster {idx}: rust {g:?} != web {wk:?}"));
        }
    }
    match (&got.spawn_cache, &want["cache"]) {
        (None, Value::Null) => {}
        (Some(_), Value::Null) => return Some("rust ma spawnCache, web nie".to_string()),
        (None, _) => return Some("web ma spawnCache, rust nie".to_string()),
        (Some(c), w) => {
            eq!("ladoweN", c.ladowe.len(), u(&w["ladoweN"]));
            eq!("ladoweFnv", digest_hexes(&c.ladowe), s(&w["ladoweFnv"]));
            eq!("massesN", c.land_cache.masses.len(), u(&w["massesN"]));
            let sizes: Vec<usize> = c.land_cache.masses.iter().map(Vec::len).collect();
            let want_sizes: Vec<usize> = w["massSizes"]
                .as_array()
                .expect("sizes")
                .iter()
                .map(u)
                .collect();
            eq!("massSizes", sizes, want_sizes);
            let mf = fnv1a64(
                &c.land_cache
                    .masses
                    .iter()
                    .map(|m| digest_hexes(m))
                    .collect::<Vec<_>>()
                    .join("|"),
            );
            eq!("massesFnv", mf, s(&w["massesFnv"]));
            let (n, f) = sea_signature(map, &c.sea_dist);
            eq!("sea.n", n, u(&w["sea"]["n"]));
            eq!("sea.fnv", f, s(&w["sea"]["fnv"]));
        }
    }
    None
}
