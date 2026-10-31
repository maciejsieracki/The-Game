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

// ---------------------------------------------------------------------------------------------
// Automat (auto-okolica)
// ---------------------------------------------------------------------------------------------

/// Web `assignWorkedTiles` (`okolica.ts:348`): `population` NAJLEPSZYCH pól (score malejąco).
/// Remis: bliżej centrum, potem klucz. `population` niefinite / <=0 -> [].
pub fn assign_worked_tiles(
    center_q: i32,
    center_r: i32,
    population: f64,
    map: &BuildMap,
    yield_of: &dyn Fn(i32, i32) -> OkolicaYield,
    opts: &AssignOptions<'_>,
) -> Vec<OkolicaTile> {
    let radius = opts
        .radius
        .unwrap_or_else(|| city_range_for_population(population));
    let filter = effective_is_workable(opts);
    let tiles = okolica_tiles(center_q, center_r, radius, map, Some(&*filter));
    let scored: Vec<ScoredTile<'_>> = tiles
        .iter()
        .map(|t| {
            let y = yield_of(t.q, t.r);
            let potential = opts.potential_of.map_or(0.0, |f| f(t.q, t.r));
            ScoredTile {
                t,
                s: tile_assign_score(y, opts.wagi, potential),
                zywnosc: y.zywnosc,
                potential,
            }
        })
        .collect();
    let scored = stable_sort_by(scored, &|a, b| compare_scored(a, b, opts.focus));
    let pop = if population.is_finite() {
        population
    } else {
        0.0
    };
    let n = pop.floor().max(0.0).min(scored.len() as f64) as usize;
    scored.into_iter().take(n).map(|x| x.t.clone()).collect()
}

/// Opcje z fokusem żywności: potencjał żywności tylko dla `zywnosc` (web `assignOptionsForFocus`).
fn with_focus_potential<'a>(
    base: AssignOptions<'a>,
    focus: OkolicaFocus,
    potential: &'a dyn Fn(i32, i32) -> f64,
) -> AssignOptions<'a> {
    let mut opts = base;
    opts.focus = Some(focus);
    if focus == OkolicaFocus::Zywnosc {
        opts.potential_of = Some(potential);
    }
    opts
}

/// Web `resolveWorkedTiles` (`okolica.ts:380`): auto lub ręczne przypisanie pól.
pub fn resolve_worked_tiles(
    city: &OkolicaCity,
    map: &BuildMap,
    yield_of: &dyn Fn(i32, i32) -> OkolicaYield,
    opts: &ResolveWorkedTilesOpts<'_>,
) -> Vec<OkolicaTile> {
    let pop = js_floor_nonneg(city.population);
    let radius = opts
        .radius
        .unwrap_or_else(|| city_range_for_population(pop));
    let tryb = opts.tryb.or(city.tryb).unwrap_or(DEFAULT_OKOLICA_TRYB);
    let focus = opts.focus.or(city.focus).unwrap_or(DEFAULT_OKOLICA_FOCUS);

    if tryb == OkolicaTryb::Reczny {
        let filter_base = AssignOptions {
            is_workable: opts.is_workable,
            territory_nodes: opts.territory_nodes,
            owner_id: opts.owner_id,
            exclude_hex_keys: opts.exclude_hex_keys,
            ..AssignOptions::default()
        };
        let work_filter = effective_is_workable(&filter_base);
        let tiles = okolica_tiles(city.q, city.r, radius, map, Some(&*work_filter));
        let owned;
        let reczne: &Reczne = match (opts.reczne, city.reczne.as_ref()) {
            (Some(r), _) => r,
            (None, Some(r)) => r,
            (None, None) => {
                owned = Reczne::new();
                &owned
            }
        };
        let mut out = Vec::new();
        for (key, count) in reczne.iter() {
            if count.is_nan() || count <= 0.0 {
                continue;
            }
            if let Some(t) = tiles.iter().find(|t| t.key == key) {
                out.push(t.clone());
            }
        }
        if out.len() as f64 > pop {
            out.truncate(pop as usize);
        }
        return out;
    }

    let pot = |q: i32, r: i32| food_potential_of_map_hex(map, q, r);
    let base = AssignOptions {
        radius: Some(radius),
        is_workable: opts.is_workable,
        territory_nodes: opts.territory_nodes,
        owner_id: Some(opts.owner_id.unwrap_or(city.owner_id)),
        exclude_hex_keys: opts.exclude_hex_keys,
        wagi: Some(wagi_for_focus(focus)),
        ..AssignOptions::default()
    };
    assign_worked_tiles(
        city.q,
        city.r,
        pop,
        map,
        yield_of,
        &with_focus_potential(base, focus, &pot),
    )
}

/// Web `seedReczneFromAuto` (`okolica.ts:415`): pierwsze wejście w tryb ręczny — kopia auto.
pub fn seed_reczne_from_auto(
    city: &OkolicaCity,
    map: &BuildMap,
    yield_of: &dyn Fn(i32, i32) -> OkolicaYield,
    territory: Option<&[TerritoryNode]>,
    exclude: Option<&BTreeSet<String>>,
) -> Reczne {
    let pop = js_floor_nonneg(city.population);
    let mut out = Reczne::new();
    if pop <= 0.0 {
        return out;
    }
    let radius = city_range_for_population(pop);
    let focus = city.focus.unwrap_or(DEFAULT_OKOLICA_FOCUS);
    let land = |q: i32, r: i32| is_land_workable_hex(map, q, r);
    let pot = |q: i32, r: i32| food_potential_of_map_hex(map, q, r);
    let base = AssignOptions {
        radius: Some(radius),
        is_workable: Some(&land),
        territory_nodes: territory,
        owner_id: Some(city.owner_id),
        exclude_hex_keys: exclude,
        wagi: Some(wagi_for_focus(focus)),
        ..AssignOptions::default()
    };
    let tiles = assign_worked_tiles(
        city.q,
        city.r,
        pop,
        map,
        yield_of,
        &with_focus_potential(base, focus, &pot),
    );
    for t in &tiles {
        out.set(&t.key, 1.0);
    }
    out
}

// ---------------------------------------------------------------------------------------------
// Tryb ręczny: rebalans, adjust (+1/-1), toggle
// ---------------------------------------------------------------------------------------------

/// Web `rebalanceWorkersAfterPopulationChange` (`okolica.ts:437`). Tylko tryb ręczny.
/// Przy spadku usuwa DOKŁADNIE `excess` wpisów (także nielegalne — B3), po jednym na iterację.
#[allow(clippy::too_many_arguments)] // sygnatura 1:1 z web `rebalanceWorkersAfterPopulationChange`
pub fn rebalance_workers_after_population_change(
    city: &mut OkolicaCity,
    map: &BuildMap,
    yield_of: &dyn Fn(i32, i32) -> OkolicaYield,
    pop_before: f64,
    pop_after: f64,
    territory: Option<&[TerritoryNode]>,
    exclude: Option<&BTreeSet<String>>,
) {
    if pop_before == pop_after {
        return;
    }
    let tryb = city.tryb.unwrap_or(DEFAULT_OKOLICA_TRYB);
    let pop = js_floor_nonneg(pop_after);
    if tryb != OkolicaTryb::Reczny {
        return;
    }

    let radius = city_range_for_population(pop);
    let focus = city.focus.unwrap_or(DEFAULT_OKOLICA_FOCUS);
    let wagi = wagi_for_focus(focus);
    let work_filter = terrain_and_territory_filter(map, territory, city.owner_id, exclude);
    let tiles = okolica_tiles(city.q, city.r, radius, map, Some(&*work_filter));
    let mut reczne = city.reczne.clone().unwrap_or_default();

    if pop_after > pop_before {
        if reczne.count_assigned() == 0 && pop > 0.0 {
            let mut seeded_city = city.clone();
            seeded_city.population = pop;
            city.reczne = Some(seed_reczne_from_auto(
                &seeded_city,
                map,
                yield_of,
                territory,
                exclude,
            ));
            return;
        }
        let mut need = pop - reczne.count_assigned() as f64;
        let mut salt: i64 = 0;
        while need > 0.0 {
            let free: Vec<&OkolicaTile> =
                tiles.iter().filter(|t| reczne.get(&t.key) < 1.0).collect();
            if free.is_empty() {
                break;
            }
            let seed = i64::from(city.q) * 997 + i64::from(city.r) * 991 + (pop as i64) * 17 + salt;
            let idx = pick_deterministic_index(seed, free.len());
            let key = free[idx].key.clone();
            reczne.set(&key, 1.0);
            need -= 1.0;
            salt += 1;
        }
        city.reczne = Some(reczne);
        return;
    }

    if pop_after < pop_before {
        let mut excess = reczne.count_assigned() as f64 - pop;
        while excess > 0.0 {
            let keys: Vec<String> = reczne
                .iter()
                .filter(|(_, v)| *v > 0.0)
                .map(|(k, _)| k.to_owned())
                .collect();
            if keys.is_empty() {
                break;
            }
            let mut worst_key: Option<String> = None;
            let mut worst_score = f64::INFINITY;
            let mut worst_dist = -1.0_f64;
            for key in &keys {
                let (s, dist) = match tiles.iter().find(|t| &t.key == key) {
                    None => {
                        let dist = match parse_hex_key(key) {
                            Some((q, r)) => axial_distance(city.q, city.r, q, r),
                            None => f64::NAN,
                        };
                        (f64::NEG_INFINITY, dist)
                    }
                    Some(t) => {
                        let potential = if focus == OkolicaFocus::Zywnosc {
                            food_potential_of_map_hex(map, t.q, t.r)
                        } else {
                            0.0
                        };
                        (
                            tile_assign_score(yield_of(t.q, t.r), Some(wagi), potential),
                            t.dist,
                        )
                    }
                };
                if s < worst_score || (s == worst_score && dist > worst_dist) {
                    worst_score = s;
                    worst_dist = dist;
                    worst_key = Some(key.clone());
                }
            }
            if let Some(k) = worst_key {
                reczne.remove(&k);
            }
            excess -= 1.0;
        }
        city.reczne = Some(reczne);
    }
}

/// Web `adjustTileWorker` (`okolica.ts:487`): kierunkowy +1/-1, NIE toggle.
/// +1 na obsadzonym polu = `juz_obsadzone` (bez zdjęcia); -1 na pustym = `brak_robotnika`.
#[allow(clippy::too_many_arguments)] // sygnatura 1:1 z web `adjustTileWorker`
pub fn adjust_tile_worker(
    city: &OkolicaCity,
    map: &BuildMap,
    yield_of: &dyn Fn(i32, i32) -> OkolicaYield,
    q: i32,
    r: i32,
    delta: i8,
    radius: Option<f64>,
    territory: Option<&[TerritoryNode]>,
    exclude: Option<&BTreeSet<String>>,
) -> WorkerEdit {
    let pop = js_floor_nonneg(city.population);
    let rad = radius.unwrap_or_else(|| city_range_for_population(pop));
    let key = hex_key(q, r);
    let mut reczne = city.reczne.clone().unwrap_or_default();
    if city.tryb.unwrap_or(DEFAULT_OKOLICA_TRYB) != OkolicaTryb::Reczny {
        reczne = seed_reczne_from_auto(city, map, yield_of, territory, exclude);
    }
    let current = reczne.get(&key);
    let assigned = reczne.count_assigned() as f64;

    if delta == 1 {
        if current >= 1.0 {
            return WorkerEdit {
                ok: false,
                reczne,
                reason: Some("juz_obsadzone"),
            };
        }
        if assigned >= pop {
            return WorkerEdit {
                ok: false,
                reczne,
                reason: Some("limit_populacji"),
            };
        }
        let work_filter = terrain_and_territory_filter(map, territory, city.owner_id, exclude);
        let tiles = okolica_tiles(city.q, city.r, rad, map, Some(&*work_filter));
        if !tiles.iter().any(|t| t.key == key) {
            if exclude.is_some_and(|e| e.contains(&key)) {
                return WorkerEdit {
                    ok: false,
                    reczne,
                    reason: Some("zajete_przez_inne_miasto"),
                };
            }
            if territory.is_some_and(|nodes| !is_territory_hex_owned_by(q, r, city.owner_id, nodes))
            {
                return WorkerEdit {
                    ok: false,
                    reczne,
                    reason: Some("obce_terytorium"),
                };
            }
            return WorkerEdit {
                ok: false,
                reczne,
                reason: Some("poza_zasiegiem"),
            };
        }
        reczne.set(&key, 1.0);
        return WorkerEdit {
            ok: true,
            reczne,
            reason: None,
        };
    }

    if current <= 0.0 {
        return WorkerEdit {
            ok: false,
            reczne,
            reason: Some("brak_robotnika"),
        };
    }
    reczne.remove(&key);
    WorkerEdit {
        ok: true,
        reczne,
        reason: None,
    }
}

/// Web `surroundingWorkerCap` (`okolica.ts:523`): `max(0, floor(population))`.
pub fn surrounding_worker_cap(population: f64) -> f64 {
    js_floor_nonneg(population)
}

/// Web `toggleTileWorker` (`okolica.ts:541`): klik zajęte = zdejmij; wolne + wolne sloty = dodaj.
/// Centrum miasta zawsze odrzucane.
#[allow(clippy::too_many_arguments)] // sygnatura 1:1 z web `toggleTileWorker`
pub fn toggle_tile_worker(
    city: &OkolicaCity,
    map: &BuildMap,
    yield_of: &dyn Fn(i32, i32) -> OkolicaYield,
    q: i32,
    r: i32,
    radius: Option<f64>,
    territory: Option<&[TerritoryNode]>,
    exclude: Option<&BTreeSet<String>>,
) -> WorkerEdit {
    let pop = surrounding_worker_cap(city.population);
    if pop <= 0.0 {
        return WorkerEdit {
            ok: false,
            reczne: Reczne::new(),
            reason: Some("brak_ludnosci"),
        };
    }
    if q == city.q && r == city.r {
        return WorkerEdit {
            ok: false,
            reczne: city.reczne.clone().unwrap_or_default(),
            reason: Some("centrum_miasta"),
        };
    }

    let rad = radius.unwrap_or_else(|| city_range_for_population(js_max(1.0, pop)));
    let key = hex_key(q, r);
    let mut reczne = city.reczne.clone().unwrap_or_default();
    if city.tryb.unwrap_or(DEFAULT_OKOLICA_TRYB) != OkolicaTryb::Reczny {
        let auto = seed_reczne_from_auto(city, map, yield_of, territory, exclude);
        reczne = if auto.get(&key) >= 1.0 {
            auto
        } else {
            Reczne::new()
        };
    }

    // B1: zdejmowanie obsadzonego pola PRZED filtrem terenu/terytorium (dane ze starych zapisów).
    if reczne.get(&key) >= 1.0 {
        reczne.remove(&key);
        return WorkerEdit {
            ok: true,
            reczne,
            reason: None,
        };
    }

    let work_filter = terrain_and_territory_filter(map, territory, city.owner_id, exclude);
    let in_range = okolica_tiles(city.q, city.r, rad, map, Some(&*work_filter))
        .iter()
        .any(|t| t.key == key);
    if !in_range {
        if exclude.is_some_and(|e| e.contains(&key)) {
            return WorkerEdit {
                ok: false,
                reczne,
                reason: Some("zajete_przez_inne_miasto"),
            };
        }
        if territory.is_some_and(|nodes| !is_territory_hex_owned_by(q, r, city.owner_id, nodes)) {
            return WorkerEdit {
                ok: false,
                reczne,
                reason: Some("obce_terytorium"),
            };
        }
        return WorkerEdit {
            ok: false,
            reczne,
            reason: Some("poza_zasiegiem"),
        };
    }

    let assigned = reczne.count_assigned() as f64;
    if assigned < pop {
        reczne.set(&key, 1.0);
        return WorkerEdit {
            ok: true,
            reczne,
            reason: None,
        };
    }
    WorkerEdit {
        ok: false,
        reczne,
        reason: Some("limit_populacji"),
    }
}

// ---------------------------------------------------------------------------------------------
// Spór o sąsiedni heks (P-HEKS-SPOR-SASIAD)
// ---------------------------------------------------------------------------------------------

/// Web `computeLostToNearerSiblingByCity` (`okolica.ts:800`): cityId -> heksy w promieniu tego
/// miasta, które PRZEGRAŁO z bliższym miastem tego samego właściciela (remis: wcześniejszy indeks).
pub fn compute_lost_to_nearer_sibling_by_city(
    cities: &[OkolicaCity],
    map: &BuildMap,
) -> BTreeMap<String, BTreeSet<String>> {
    #[derive(Clone)]
    struct Sib {
        id: String,
        q: i32,
        r: i32,
        radius: f64,
    }

    let mut out: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    // Map.set w pętli: dla zdublowanych id ostatni indeks wygrywa.
    let mut city_index: HashMap<&str, f64> = HashMap::new();
    for (i, c) in cities.iter().enumerate() {
        city_index.insert(c.id.as_str(), i as f64);
    }

    let mut by_owner: BTreeMap<i64, Vec<Sib>> = BTreeMap::new();
    for c in cities {
        let radius = city_range_for_population(js_floor_nonneg(c.population));
        if radius <= 0.0 {
            continue;
        }
        by_owner.entry(c.owner_id).or_default().push(Sib {
            id: c.id.clone(),
            q: c.q,
            r: c.r,
            radius,
        });
    }

    for owner_cities in by_owner.values() {
        if owner_cities.len() < 2 {
            continue;
        }
        for city_a in owner_cities {
            let near: Vec<&Sib> = owner_cities
                .iter()
                .filter(|o| {
                    o.id != city_a.id
                        && axial_distance(city_a.q, city_a.r, o.q, o.r) <= city_a.radius + o.radius
                })
                .collect();
            if near.is_empty() {
                continue;
            }
            let candidates = okolica_tiles(city_a.q, city_a.r, city_a.radius, map, None);
            let mut lost: BTreeSet<String> = BTreeSet::new();
            for t in &candidates {
                let mut winner_is_a = true;
                let mut winner_dist = t.dist;
                let mut winner_index = city_index
                    .get(city_a.id.as_str())
                    .copied()
                    .unwrap_or(f64::INFINITY);
                for sib in &near {
                    let d = axial_distance(t.q, t.r, sib.q, sib.r);
                    if d > sib.radius {
                        continue;
                    }
                    let sib_index = city_index
                        .get(sib.id.as_str())
                        .copied()
                        .unwrap_or(f64::INFINITY);
                    if d < winner_dist || (d == winner_dist && sib_index < winner_index) {
                        winner_dist = d;
                        winner_is_a = false;
                        winner_index = sib_index;
                    }
                }
                if !winner_is_a {
                    lost.insert(t.key.clone());
                }
            }
            if !lost.is_empty() {
                out.insert(city_a.id.clone(), lost);
            }
        }
    }
    out
}

/// Web `collectWorkedHexKeysForOwner` (`okolica.ts:662`): heksy z 👤 dla miast właściciela.
pub fn collect_worked_hex_keys_for_owner(
    cities: &[OkolicaCity],
    map: &BuildMap,
    owner_id: i64,
    yield_of: &dyn Fn(i32, i32) -> OkolicaYield,
    is_workable: Option<&dyn Fn(i32, i32) -> bool>,
    territory: Option<&[TerritoryNode]>,
) -> BTreeSet<String> {
    let mut keys = BTreeSet::new();
    let lost = compute_lost_to_nearer_sibling_by_city(cities, map);
    for city in cities.iter().filter(|c| c.owner_id == owner_id) {
        let worked = resolve_worked_tiles(
            city,
            map,
            yield_of,
            &ResolveWorkedTilesOpts {
                is_workable,
                territory_nodes: territory,
                owner_id: Some(owner_id),
                exclude_hex_keys: lost.get(&city.id),
                ..ResolveWorkedTilesOpts::default()
            },
        );
        for t in worked {
            keys.insert(t.key);
        }
    }
    keys
}

/// Web `collectWorkedHexOwnerMap` (`okolica.ts:690`): hexKey -> ownerId miasta.
pub fn collect_worked_hex_owner_map(
    cities: &[OkolicaCity],
    map: &BuildMap,
    yield_of: &dyn Fn(i32, i32) -> OkolicaYield,
    is_workable: Option<&dyn Fn(i32, i32) -> bool>,
    territory: Option<&[TerritoryNode]>,
) -> BTreeMap<String, i64> {
    let mut by_key = BTreeMap::new();
    let lost = compute_lost_to_nearer_sibling_by_city(cities, map);
    for city in cities {
        let worked = resolve_worked_tiles(
            city,
            map,
            yield_of,
            &ResolveWorkedTilesOpts {
                is_workable,
                territory_nodes: territory,
                owner_id: Some(city.owner_id),
                exclude_hex_keys: lost.get(&city.id),
                ..ResolveWorkedTilesOpts::default()
            },
        );
        for t in worked {
            by_key.insert(t.key, city.owner_id);
        }
    }
    by_key
}
