//! P6.8G: port `gra/src/game/okolica.ts` (wybór obrabianych pól miasta) — czysta logika.
//!
//! Plony pola są WSTRZYKIWANE (`yield_of`); ten moduł robi tylko WYBÓR.
//! Reużyte istniejące symbole (NIE duplikowane): `terrain::city_range_for_population`,
//! `terrain::axial_distance`, `improvement_build::hex_keys_within_radius`,
//! `territory::{is_territory_hex_owned_by, make_territory_workable_filter}`,
//! `improvements::{improvement_keys_for_hex, food_potential_for_hex}`.
//!
//! Kontrakt JS, który trzeba zachować (patrz komentarze przy funkcjach):
//! - `okolicaTiles`: `radius` niedodatnie / NaN -> promień 1; `floor` dla ułamków.
//! - komparatory: wynik NaN jest traktowany jak remis (`Equal`) i NIE przechodzi do
//!   kolejnych kryteriów; sortowanie jest stabilne (jak V8 `Array.prototype.sort`).
//! - `Object.entries(reczne)`: kolejność wstawiania (`Reczne` to uporządkowany wektor).

use std::cmp::Ordering;
use std::collections::{BTreeMap, BTreeSet, HashMap};

use super::improvement_build::{hex_key, hex_keys_within_radius, BuildHex, BuildMap};
use super::improvements::{food_potential_for_hex, improvement_keys_for_hex, HexLike, TerrainType};
pub use super::state::p6_6b::cities::{OkolicaFocus, OkolicaTryb};
use super::terrain::{axial_distance, city_range_for_population};
use super::territory::{is_territory_hex_owned_by, TerritoryNode};

/// Web `DEFAULT_OKOLICA_FOCUS` (`cities.ts:56`).
pub const DEFAULT_OKOLICA_FOCUS: OkolicaFocus = OkolicaFocus::Zywnosc;
/// Web `DEFAULT_OKOLICA_TRYB` (`cities.ts:57`).
pub const DEFAULT_OKOLICA_TRYB: OkolicaTryb = OkolicaTryb::Auto;

// ---------------------------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------------------------

/// Web `Record<string, number>` dla `okolicaReczne`: zachowuje kolejność wstawiania (jak JS).
/// Ustawienie istniejącego klucza nie zmienia jego pozycji; `remove` + `set` dopisuje na koniec.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Reczne {
    entries: Vec<(String, f64)>,
}

impl Reczne {
    pub fn new() -> Self {
        Self::default()
    }

    /// `reczne[key] ?? 0` — brak klucza = 0.
    pub fn get(&self, key: &str) -> f64 {
        self.entries
            .iter()
            .find(|(k, _)| k == key)
            .map_or(0.0, |(_, v)| *v)
    }

    pub fn set(&mut self, key: &str, value: f64) {
        if let Some(entry) = self.entries.iter_mut().find(|(k, _)| k == key) {
            entry.1 = value;
        } else {
            self.entries.push((key.to_owned(), value));
        }
    }

    pub fn remove(&mut self, key: &str) {
        self.entries.retain(|(k, _)| k != key);
    }

    /// `Object.values(reczne).filter(n => n > 0).length`.
    pub fn count_assigned(&self) -> usize {
        self.entries.iter().filter(|(_, v)| *v > 0.0).count()
    }

    pub fn iter(&self) -> impl Iterator<Item = (&str, f64)> {
        self.entries.iter().map(|(k, v)| (k.as_str(), *v))
    }
}

/// Web `TileYield` (`economy.ts:256`) w zakresie czytanym przez okolicę (`zywnosc`, `praca`, `handel`).
#[derive(Debug, Clone, Copy, Default, PartialEq)]
pub struct OkolicaYield {
    pub zywnosc: f64,
    pub praca: f64,
    pub handel: f64,
}

/// Web `OkolicaTile` (`okolica.ts:113`).
#[derive(Debug, Clone, PartialEq)]
pub struct OkolicaTile {
    pub q: i32,
    pub r: i32,
    pub key: String,
    pub dist: f64,
}

/// Wagi rankingu (`wagiForFocus`). Brak wag w opcjach = 1/1/1 (web `?? 1`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Wagi {
    pub zywnosc: f64,
    pub praca: f64,
    pub handel: f64,
}

/// Podzbiór webowego `City` czytany przez okolicę.
#[derive(Debug, Clone, PartialEq)]
pub struct OkolicaCity {
    pub id: String,
    pub owner_id: i64,
    pub q: i32,
    pub r: i32,
    pub population: f64,
    pub focus: Option<OkolicaFocus>,
    pub tryb: Option<OkolicaTryb>,
    pub reczne: Option<Reczne>,
}

/// Wynik `adjustTileWorker` / `toggleTileWorker` (web `{ ok, reczne, reason? }`).
#[derive(Debug, Clone, PartialEq)]
pub struct WorkerEdit {
    pub ok: bool,
    pub reczne: Reczne,
    pub reason: Option<&'static str>,
}

/// Web `AssignOptions` (`okolica.ts:127`).
#[derive(Clone, Copy, Default)]
pub struct AssignOptions<'a> {
    pub radius: Option<f64>,
    pub is_workable: Option<&'a dyn Fn(i32, i32) -> bool>,
    pub wagi: Option<Wagi>,
    pub focus: Option<OkolicaFocus>,
    /// Bonus potencjału żywności (fokus żywność).
    pub potential_of: Option<&'a dyn Fn(i32, i32) -> f64>,
    pub territory_nodes: Option<&'a [TerritoryNode]>,
    pub owner_id: Option<i64>,
    pub exclude_hex_keys: Option<&'a BTreeSet<String>>,
}

/// Web `ResolveWorkedTilesOpts` (`okolica.ts:235`).
#[derive(Clone, Copy, Default)]
pub struct ResolveWorkedTilesOpts<'a> {
    pub focus: Option<OkolicaFocus>,
    pub tryb: Option<OkolicaTryb>,
    pub reczne: Option<&'a Reczne>,
    pub radius: Option<f64>,
    pub is_workable: Option<&'a dyn Fn(i32, i32) -> bool>,
    pub territory_nodes: Option<&'a [TerritoryNode]>,
    pub owner_id: Option<i64>,
    pub exclude_hex_keys: Option<&'a BTreeSet<String>>,
}

// ---------------------------------------------------------------------------------------------
// Pomocnicze semantyki JS
// ---------------------------------------------------------------------------------------------

/// JS `Math.max(0, Math.floor(x))` — NaN propaguje się (JS `Math.max` zwraca NaN).
fn js_floor_nonneg(x: f64) -> f64 {
    let f = x.floor();
    if f.is_nan() {
        f
    } else {
        f.max(0.0)
    }
}

/// JS `Math.max(a, b)` — NaN propaguje się.
fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else {
        a.max(b)
    }
}

/// Wynik komparatora JS: `d < 0` -> mniejszy, `d > 0` -> większy, inaczej (w tym NaN) remis.
fn js_cmp_diff(d: f64) -> Ordering {
    if d < 0.0 {
        Ordering::Less
    } else if d > 0.0 {
        Ordering::Greater
    } else {
        Ordering::Equal
    }
}

/// Stabilne sortowanie przez scalanie. Nie panikuje dla niespójnych komparatorów (NaN),
/// w odróżnieniu od `slice::sort_by`, który od Rust 1.81 może zgłosić panikę.
fn stable_sort_by<T>(items: Vec<T>, cmp: &impl Fn(&T, &T) -> Ordering) -> Vec<T> {
    if items.len() <= 1 {
        return items;
    }
    let mut left = items;
    let right = left.split_off(left.len() / 2);
    let left = stable_sort_by(left, cmp);
    let right = stable_sort_by(right, cmp);
    let mut out = Vec::with_capacity(left.len() + right.len());
    let mut li = left.into_iter().peekable();
    let mut ri = right.into_iter().peekable();
    loop {
        let take_right = match (li.peek(), ri.peek()) {
            (Some(a), Some(b)) => cmp(b, a) == Ordering::Less,
            (Some(_), None) => false,
            (None, Some(_)) => true,
            (None, None) => break,
        };
        if take_right {
            out.extend(ri.next());
        } else {
            out.extend(li.next());
        }
    }
    out
}

/// Sortowanie jak V8 `Array.prototype.sort` (TimSort, `array-sort.tq`) dla `n < 64`: przy takim
/// rozmiarze minrun = n, wiec caly array to jeden run: `CountAndMakeRun` (ewentualne odwrocenie
/// malejacego prefiksu) + `BinaryInsertionSort` (porownanie `cmp(pivot, a[mid])`, `< 0` = w lewo).
/// Dla niespojnych komparatorow (NaN -> remis) wynik zalezy od tej dokladnej sciezki (P6.8G, B6).
/// Dla `n >= 64` (brak wektora) zostaje `stable_sort_by`; patrz dokument tematu (ZALOZENIE B6).
fn v8_sort_by<T>(items: Vec<T>, cmp: &impl Fn(&T, &T) -> Ordering) -> Vec<T> {
    let n = items.len();
    if n >= 64 {
        return stable_sort_by(items, cmp);
    }
    if n < 2 {
        return items;
    }
    let mut a = items;
    // CountAndMakeRun(0, n): kolejnosc porownan jak w V8 (current = a[idx], previous = a[idx-1]).
    let descending = cmp(&a[1], &a[0]) == Ordering::Less;
    let mut run = 2;
    while run < n {
        let order = cmp(&a[run], &a[run - 1]);
        let breaks = if descending {
            order != Ordering::Less
        } else {
            order == Ordering::Less
        };
        if breaks {
            break;
        }
        run += 1;
    }
    if descending {
        a[..run].reverse();
    }
    // BinaryInsertionSort(0, run, n).
    for start in run..n {
        let pivot = a.remove(start);
        let mut left = 0;
        let mut right = start;
        while left < right {
            let mid = left + ((right - left) >> 1);
            if cmp(&pivot, &a[mid]) == Ordering::Less {
                right = mid;
            } else {
                left = mid + 1;
            }
        }
        a.insert(left, pivot);
    }
    a
}

/// Web `pickDeterministicIndex`: `((seed % length) + length) % length`.
fn pick_deterministic_index(seed: i64, length: usize) -> usize {
    if length == 0 {
        return 0;
    }
    seed.rem_euclid(length as i64) as usize
}

/// Parsuje klucz `"q,r"` (web `Number(parts[0])`, `Number(parts[1])`).
fn parse_hex_key(key: &str) -> Option<(i32, i32)> {
    let (q, r) = key.split_once(',')?;
    Some((q.parse().ok()?, r.parse().ok()?))
}

// ---------------------------------------------------------------------------------------------
// Zasięg i geometria
// ---------------------------------------------------------------------------------------------

/// Web `isLandWorkableHex` (`okolica.ts:85`): heks istnieje i nie jest Morze ani Góry.
/// Płytkie morze (`ShallowWater`) jest obsadzalne — zgodnie z webem.
pub fn is_land_workable_hex(map: &BuildMap, q: i32, r: i32) -> bool {
    match map.hex(&hex_key(q, r)) {
        None => false,
        Some(h) => h.terrain != TerrainType::Ocean && h.terrain != TerrainType::Mountains,
    }
}

/// Web `okolicaTiles` (`okolica.ts:145`): pola w `hexDistance <= radius` od centrum, istniejące w
/// mapie, bez centrum. `radius` niedodatnie / NaN -> 1 (quirk webowy).
pub fn okolica_tiles(
    center_q: i32,
    center_r: i32,
    radius: f64,
    map: &BuildMap,
    is_workable: Option<&dyn Fn(i32, i32) -> bool>,
) -> Vec<OkolicaTile> {
    let rad = if radius.is_finite() && radius > 0.0 {
        radius.floor()
    } else {
        1.0
    };
    let mut out = Vec::new();
    for key in hex_keys_within_radius(center_q, center_r, rad, map) {
        let Some((q, r)) = parse_hex_key(&key) else {
            continue;
        };
        if q == center_q && r == center_r {
            continue;
        }
        let dist = axial_distance(center_q, center_r, q, r);
        if dist > rad {
            continue;
        }
        if let Some(f) = is_workable {
            if !f(q, r) {
                continue;
            }
        }
        out.push(OkolicaTile { q, r, key, dist });
    }
    out
}

// ---------------------------------------------------------------------------------------------
// Wynik pola
// ---------------------------------------------------------------------------------------------

/// Web `tileScore` (`okolica.ts:169`): ważona suma plonów (domyślnie wagi 1/1/1).
pub fn tile_score(y: OkolicaYield, wagi: Option<Wagi>) -> f64 {
    let wz = wagi.map_or(1.0, |w| w.zywnosc);
    let wp = wagi.map_or(1.0, |w| w.praca);
    let wh = wagi.map_or(1.0, |w| w.handel);
    y.zywnosc * wz + y.praca * wp + y.handel * wh
}

/// Web `tileAssignScore` (`okolica.ts:177`): `tileScore + foodPotential`.
pub fn tile_assign_score(y: OkolicaYield, wagi: Option<Wagi>, food_potential: f64) -> f64 {
    tile_score(y, wagi) + food_potential
}

/// Web `wagiForFocus` (`okolica.ts:265`).
pub fn wagi_for_focus(focus: OkolicaFocus) -> Wagi {
    match focus {
        OkolicaFocus::Zywnosc => Wagi {
            zywnosc: 10.0,
            praca: 0.0,
            handel: 0.0,
        },
        OkolicaFocus::Produkcja => Wagi {
            zywnosc: 0.5,
            praca: 3.0,
            handel: 0.5,
        },
        OkolicaFocus::Podatki => Wagi {
            zywnosc: 0.5,
            praca: 0.5,
            handel: 3.0,
        },
        OkolicaFocus::Zrownowazone => Wagi {
            zywnosc: 1.0,
            praca: 1.0,
            handel: 1.0,
        },
    }
}

/// Web `foodPotentialOfMapHex` (`okolica.ts:199`): czyta WSZYSTKIE warstwy ulepszeń.
pub fn food_potential_of_map_hex(map: &BuildMap, q: i32, r: i32) -> f64 {
    let Some(h) = map.hex(&hex_key(q, r)) else {
        return 0.0;
    };
    let keys = improvement_keys_for_hex(&hex_like(h));
    food_potential_for_hex(h.terrain, h.overlay, &keys)
}

fn hex_like(h: &BuildHex) -> HexLike {
    HexLike {
        ulepszenie: h.ulepszenie.clone(),
        ulepszenia: h.ulepszenia.clone(),
        nakladka: Some(h.overlay),
        zloze: h.zloze.clone(),
    }
}

#[derive(Clone, Copy)]
struct ScoredTile<'t> {
    t: &'t OkolicaTile,
    s: f64,
    zywnosc: f64,
    potential: f64,
}

/// Web `compareScoredOkolicaTiles` (`okolica.ts:275`). Każde `!==` + `-` w JS daje dla NaN
/// wynik NaN, czyli remis bez przejścia do dalszych kryteriów — zachowane przez `js_cmp_diff`.
fn compare_scored(a: &ScoredTile<'_>, b: &ScoredTile<'_>, focus: Option<OkolicaFocus>) -> Ordering {
    if b.s != a.s {
        return js_cmp_diff(b.s - a.s);
    }
    if focus == Some(OkolicaFocus::Zywnosc) {
        if b.zywnosc != a.zywnosc {
            return js_cmp_diff(b.zywnosc - a.zywnosc);
        }
        if b.potential != a.potential {
            return js_cmp_diff(b.potential - a.potential);
        }
    }
    if a.t.dist != b.t.dist {
        return js_cmp_diff(a.t.dist - b.t.dist);
    }
    // Klucze "q,r" mają alfabet [-0-9,]; dla tego alfabetu porządek bajtowy = localeCompare (ICU),
    // bo ',' i '-' nigdy nie stoją na tej samej pozycji w dwóch różnych kluczach.
    a.t.key.cmp(&b.t.key)
}

// ---------------------------------------------------------------------------------------------
// Filtry pracy (terytorium, centra, spór sąsiadów)
// ---------------------------------------------------------------------------------------------

/// Web `cityCenterKeysFromTerritoryNodes` (`okolica.ts:94`): centra WSZYSTKICH miast (bez
/// posterunków/fortów). `None` gdy brak węzłów albo zbiór pusty.
fn city_center_keys_from_nodes(nodes: Option<&[TerritoryNode]>) -> Option<BTreeSet<String>> {
    let nodes = nodes?;
    let set: BTreeSet<String> = nodes
        .iter()
        .filter(|n| !n.node.is_outpost.unwrap_or(false) && !n.node.is_fort.unwrap_or(false))
        .map(|n| hex_key(n.node.q, n.node.r))
        .collect();
    if set.is_empty() {
        None
    } else {
        Some(set)
    }
}

/// Dokłada do filtra bezwarunkowe wykluczenie centrów (`centers`) i `excludeHexKeys`.
/// Kolejność jak w web: centrum, potem wykluczenie, potem bazowy filtr.
fn with_center_and_exclude<'a>(
    base: Box<dyn Fn(i32, i32) -> bool + 'a>,
    centers: Option<BTreeSet<String>>,
    exclude: Option<&'a BTreeSet<String>>,
) -> Box<dyn Fn(i32, i32) -> bool + 'a> {
    if centers.is_none() && exclude.is_none() {
        return base;
    }
    Box::new(move |q, r| {
        let key = hex_key(q, r);
        if centers.as_ref().is_some_and(|c| c.contains(&key)) {
            return false;
        }
        if exclude.is_some_and(|e| e.contains(&key)) {
            return false;
        }
        base(q, r)
    })
}

/// Web `effectiveIsWorkable` (`okolica.ts:333`). Zwraca zawsze filtr (brak filtra = `true`).
fn effective_is_workable<'a>(opts: &AssignOptions<'a>) -> Box<dyn Fn(i32, i32) -> bool + 'a> {
    let base: Box<dyn Fn(i32, i32) -> bool + 'a> = match (opts.territory_nodes, opts.owner_id) {
        (Some(nodes), Some(owner)) => {
            let inner = opts.is_workable;
            Box::new(move |q, r| {
                inner.is_none_or(|f| f(q, r)) && is_territory_hex_owned_by(q, r, owner, nodes)
            })
        }
        _ => {
            let inner = opts.is_workable;
            Box::new(move |q, r| inner.is_none_or(|f| f(q, r)))
        }
    };
    with_center_and_exclude(
        base,
        city_center_keys_from_nodes(opts.territory_nodes),
        opts.exclude_hex_keys,
    )
}

/// Web `terrainAndTerritoryFilter` (`okolica.ts:309`).
fn terrain_and_territory_filter<'a>(
    map: &'a BuildMap,
    territory: Option<&'a [TerritoryNode]>,
    owner_id: i64,
    exclude: Option<&'a BTreeSet<String>>,
) -> Box<dyn Fn(i32, i32) -> bool + 'a> {
    let base: Box<dyn Fn(i32, i32) -> bool + 'a> = match territory {
        Some(nodes) => Box::new(move |q, r| {
            is_land_workable_hex(map, q, r) && is_territory_hex_owned_by(q, r, owner_id, nodes)
        }),
        None => Box::new(move |q, r| is_land_workable_hex(map, q, r)),
    };
    with_center_and_exclude(base, city_center_keys_from_nodes(territory), exclude)
}

mod auto;
mod manual;
mod sasiedztwo;

pub use auto::*;
pub use manual::*;
pub use sasiedztwo::*;
