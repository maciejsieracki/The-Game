//! P6.M11 - uklad stolic klastrow. Temat wlasciciel: R-RUSTPORT-P6-M11-KLASTRY-UKLAD-STOLIC-Q1.
//! Zakres web (P6-25 §6): clusters.ts:1351-1537, 1553-1769, 1801-1846, 2166-3361 (+ pojedyncze linie).
//!
//! Port 1:1 (pin web `edb8fb56`) deklaracji `gra/src/map/clusters.ts`: stale i bramki odleglosci
//! stolic od morza oraz od siebie (`:1351-1537`), cwiartki bboxa ladu i wybor hexu spawnu z bramkami
//! stolicy (`:1553-1769`), losowy wybor miast (`:1801-1846`) oraz planowanie klastra (stolica na
//! krawedzi + miasta-panstwa), przydzial typow do srodkow, wymuszanie dominacji lokalnego ladu,
//! twarda separacja stolic, separacja brył, dopakowanie miast-panstw i wyrownanie cwiartek
//! (`:2166-3361`).
//!
//! Zaleznosci: M10 (`cluster_mass`: masy, bramki, wybory srodkow, TimSort V8, typ `TypeCluster`)
//! i M09 (`cluster_rivals`: pakowanie miast-panstw). Ten modul DOSTARCZA implementacje cechy
//! [`ClusterLayoutHooks`] ([`ClusterLayoutM11`]), ktorej M10 wymagal jako wstrzyknietych domkniec.
//!
//! Zachowania weba odtworzone 1:1 (zalozenia w `P6-M11-KLASTRY-UKLAD-STOLIC.md` §6):
//! - `Array.prototype.sort` z komparatorem WOLAJACYM `rand()` (`pickCapitalHexInRegion`) idzie
//!   przez `js_array_sort_by` (TimSort V8) - liczba i kolejnosc wywolan `rand()` jest czescia
//!   kontraktu;
//! - `pickCapitalHexInRegion` sortuje `seaPool` W MIEJSCU; gdy zaden filtr nie utworzyl nowej
//!   tablicy, jest to ta sama tablica co `region` wywolujacego, wiec region zmienia kolejnosc
//!   (odtworzone: `region: &mut Vec<HexCoord>`);
//! - mutacje wejsc (`klastry`, `clusterRegions`, `centrumy`, `regiony`) sa jawne (`&mut`).
//!
//! Stale balansowe: `data/derived/mapgen-cluster-layout.json` (edytowalne). Stale z zakresu M09
//! (`CLUSTER_CITY_STATE_MAX_HEX`, `CLUSTER_GROWTH_RESERVE`, `MIN_DIST_FOREIGN_IN_CLUSTER`) czyta kod
//! z `cluster_rivals`. Stale ALGORYTMICZNE (mnozniki ziaren) to nazwane `const` ponizej.

use crate::data::derived::{mapgen_cluster_layout, ClusterActiveTypes};
use crate::domain::hex::HexCoord;
use crate::domain::map_generator::GeneratedMap;
use crate::domain::mapgen::cluster_mass::{
    allocate_typy_to_masses, assign_voronoi_regions, development_space_score, js_array_sort_by,
    local_land_fraction, mass_land_cache_from_masses, passes_local_land_gate,
    passes_player_start_mass_gate, pick_best_local_land_spawn, pick_center_in_mass_spread,
    pick_player_cluster_center, pick_tied_spawn_land_candidate, qualifying_mass_indices_for_spawn,
    sort_spawn_candidates_with_spread_bias, sort_spawn_land_candidates, ClusterCity,
    ClusterLayoutHooks, LandBBox, MassLandCache, MassesOrCache, QuadrantSpread, RandRef, SeaDist,
    SpawnLandCandidate, TypeCluster,
};
use crate::domain::mapgen::cluster_rivals::{
    cluster_city_state_max_hex, cluster_growth_reserve, compute_same_type_rival_half_plane_axis,
    min_dist_foreign_in_cluster, min_dist_start_city_state, pack_city_states_around_capital,
    pack_rival_cities_around_core, passes_foreign_cluster_buffer_gate, AnchorHex,
    ForeignClusterBuffer, PackAroundCapitalOpts, PointF64,
};
use crate::domain::mapgen::params::MapSizeLabel;

pub use crate::domain::mapgen::cluster_mass::ClusterSpreadOpts;

/// Mnoznik ziarna per indeks klastra: `(seed + ki * 0x9e3779b1) >>> 0`
/// (`clusters.ts:2779, 2873, 3138, 3340`).
const KI_SEED_MUL: u32 = 0x9e37_79b1;
/// `(seed + ki * 0x85ebca6b) >>> 0` - luzne ponowienie dopakowania (`clusters.ts:2901`).
const REPACK_LOOSE_SEED_MUL: u32 = 0x85eb_ca6b;
/// `(seed + ki * 0xc2b2ae35) >>> 0` - ostatnia szansa dopakowania (`clusters.ts:2927`).
const REPACK_DESPERATE_SEED_MUL: u32 = 0xc2b2_ae35;
/// `(seed + 17) >>> 0` - ziarno osi polplaszczyzny w luznym ponowieniu (`clusters.ts:2910`).
const REPACK_AXIS_SEED_ADD: u32 = 17;
/// Domyslne ziarno `buildClusterLayoutWithEdgeCapital` (`seed = 42`, `clusters.ts:2280`) i
/// `seed ?? 42` w `buildClusterCities` (`:2335`).
const DEFAULT_LAYOUT_SEED: u32 = 42;

// ---------------------------------------------------------------------------------------------
// Narzedzia: JS Math.max/min, odleglosc
// ---------------------------------------------------------------------------------------------

/// JS `a || b` dla liczb: `b`, gdy `a` jest falszywe (`0`, `-0`, `NaN`).
fn or0(a: f64, b: f64) -> f64 {
    if a == 0.0 || a.is_nan() {
        b
    } else {
        a
    }
}

/// JS `Math.max(a, b)`: NaN zaraza wynik, `+0` wygrywa z `-0`.
fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == 0.0 && b == 0.0 {
        return if a.is_sign_positive() { a } else { b };
    }
    if a > b {
        a
    } else {
        b
    }
}

/// Web `hexDistanceAxial` na liczbach rzeczywistych (kolejnosc dzialan jak w `gen-helpers.ts:135`).
fn dist_f(aq: f64, ar: f64, bq: f64, br: f64) -> f64 {
    let dq = (aq - bq).abs();
    let dr = (ar - br).abs();
    let ds = ((-aq - ar) - (-bq - br)).abs();
    dq.max(dr).max(ds)
}

fn dist_hh(a: HexCoord, b: HexCoord) -> f64 {
    dist_f(
        f64::from(a.q),
        f64::from(a.r),
        f64::from(b.q),
        f64::from(b.r),
    )
}

fn dist_hp(a: HexCoord, p: PointF64) -> f64 {
    dist_f(f64::from(a.q), f64::from(a.r), p.q, p.r)
}

fn dist_i(a: HexCoord, b: HexCoord) -> i64 {
    i64::from(a.distance(b))
}

fn same(a: HexCoord, b: HexCoord) -> bool {
    a.q == b.q && a.r == b.r
}

/// Web `shuffleInPlace` (`clusters.ts:168`) na dowolnym zrodle `rand` (M09 ma wersje na
/// `Mulberry32`; tu strumien jest wstrzykniety jak w webie): Fisher-Yates od konca.
pub fn shuffle_in_place_with<T>(arr: &mut [T], rand: RandRef<'_>) {
    let mut i = arr.len();
    while i > 1 {
        i -= 1;
        let j = (rand() * ((i + 1) as f64)).floor() as usize;
        arr.swap(i, j);
    }
}

/// `(seed + ki * mul) >>> 0` na `u32` (arytmetyka modulo 2^32 jak `>>> 0`).
fn mix_seed(seed: u32, ki: usize, mul: u32) -> u32 {
    seed.wrapping_add((ki as u32).wrapping_mul(mul))
}

// ---------------------------------------------------------------------------------------------
// clusters.ts:1351-1537 - promienie, odleglosc od morza, separacja stolic
// ---------------------------------------------------------------------------------------------

fn per_size(t: &ClusterActiveTypes, label: MapSizeLabel) -> i64 {
    match label {
        MapSizeLabel::Mala => t.mala.wartosc,
        MapSizeLabel::Srednia => t.srednia.wartosc,
        MapSizeLabel::Duza => t.duza.wartosc,
        MapSizeLabel::Ogromna => t.ogromna.wartosc,
        MapSizeLabel::Super => t.super_.wartosc,
    }
}

/// Web `clusterCityStateRadius` (`clusters.ts:1353`).
pub fn cluster_city_state_radius() -> i64 {
    cluster_city_state_max_hex()
}

/// Web `clusterHubChainReachHex` (`clusters.ts:1361`).
pub fn cluster_hub_chain_reach_hex(state_city_count: i64) -> i64 {
    let n = 1.max(state_city_count + cluster_growth_reserve());
    cluster_city_state_max_hex() * n
}

/// Web `capitalMinSeaDist` (`clusters.ts:1370`).
pub fn capital_min_sea_dist(rozmiar: MapSizeLabel) -> i64 {
    per_size(
        &mapgen_cluster_layout().morze_stolicy.min_odleglosc_od_morza,
        rozmiar,
    )
}

/// Szerokosc pasa stolicy od morza (`+ 5`, `clusters.ts:1386`).
pub fn capital_sea_band_width() -> i64 {
    mapgen_cluster_layout().morze_stolicy.szerokosc_pasa.wartosc
}

/// Web `capitalMaxSeaDist` (`clusters.ts:1385`).
pub fn capital_max_sea_dist(rozmiar: MapSizeLabel) -> i64 {
    capital_min_sea_dist(rozmiar) + capital_sea_band_width()
}

fn min_short_side() -> i64 {
    mapgen_cluster_layout()
        .morze_stolicy
        .min_krotszy_bok_mapy
        .wartosc
}

/// Web `capitalMinSeaDistForMap` (`clusters.ts:1395`).
pub fn capital_min_sea_dist_for_map(rozmiar: MapSizeLabel, map_w: i64, map_h: i64) -> i64 {
    if map_w.min(map_h) < min_short_side() {
        return 0;
    }
    capital_min_sea_dist(rozmiar)
}

/// Web `capitalMaxSeaDistForMap` (`clusters.ts:1405`).
pub fn capital_max_sea_dist_for_map(rozmiar: MapSizeLabel, map_w: i64, map_h: i64) -> i64 {
    if map_w.min(map_h) < min_short_side() {
        return 0;
    }
    capital_max_sea_dist(rozmiar)
}

/// Web `clusterCohesionMaxHex` (`clusters.ts:1416`).
pub fn cluster_cohesion_max_hex(state_city_count: i64) -> i64 {
    cluster_hub_chain_reach_hex(state_city_count)
}

/// Web `seaDistAt` (`clusters.ts:1420`): `seaDist.get(key) ?? 0`.
pub fn sea_dist_at(sea_dist: &SeaDist, q: i32, r: i32) -> f64 {
    sea_dist.get(&(q, r)).copied().unwrap_or(0.0)
}

/// Web `passesMinSeaDistGate` (`clusters.ts:1428`).
pub fn passes_min_sea_dist_gate(sea_dist: &SeaDist, q: i32, r: i32, min_dist: f64) -> bool {
    sea_dist_at(sea_dist, q, r) >= min_dist
}

/// Web `passesCapitalSeaBandGate` (`clusters.ts:1438`): `min <= seaDist <= max` (`max <= 0` =
/// tylko min).
pub fn passes_capital_sea_band_gate(
    sea_dist: &SeaDist,
    q: i32,
    r: i32,
    min_dist: f64,
    max_dist: f64,
) -> bool {
    let d = sea_dist_at(sea_dist, q, r);
    if min_dist > 0.0 && d < min_dist {
        return false;
    }
    if max_dist > 0.0 && d > max_dist {
        return false;
    }
    true
}

/// Web `capitalSeaBandPenalty` (`clusters.ts:1452`): 0 w srodku pasa, duza poza pasem.
/// `!(x > 0)` jest celowe: dla `NaN` daje `true` (jak w JS), czego `x <= 0` nie daje.
#[allow(clippy::neg_cmp_op_on_partial_ord)]
pub fn capital_sea_band_penalty(sea: f64, min_dist: f64, max_dist: f64) -> f64 {
    let t = &mapgen_cluster_layout().morze_stolicy;
    if !(min_dist > 0.0) && !(max_dist > 0.0) {
        return 0.0;
    }
    let lo = js_max(0.0, min_dist);
    let hi = if max_dist > 0.0 {
        max_dist
    } else {
        lo + t.szerokosc_pasa.wartosc as f64
    };
    if sea < lo {
        return t.kara_ponizej_pasa.wartosc + (lo - sea);
    }
    if sea > hi {
        return t.kara_powyzej_pasa.wartosc + (sea - hi);
    }
    let ideal = (lo + hi) / 2.0;
    (sea - ideal).abs()
}

/// Web `capitalMinSeparation` (`clusters.ts:1470`).
pub fn capital_min_separation(rozmiar: MapSizeLabel) -> i64 {
    per_size(
        &mapgen_cluster_layout().separacja_stolic.min_odstep,
        rozmiar,
    )
}

/// Web `capitalMinSeparationForMap` (`clusters.ts:1485`).
pub fn capital_min_separation_for_map(rozmiar: MapSizeLabel, map_w: i64, map_h: i64) -> i64 {
    if map_w.min(map_h) < min_short_side() {
        return 0;
    }
    capital_min_separation(rozmiar)
}

/// Web `clusterBodySeparation` (`clusters.ts:1500`).
pub fn cluster_body_separation(rozmiar: MapSizeLabel) -> i64 {
    capital_min_separation(rozmiar)
}

/// Web `clusterCenterPlacementSep` (`clusters.ts:1508`).
pub fn cluster_center_placement_sep(rozmiar: MapSizeLabel) -> i64 {
    capital_min_separation(rozmiar)
        + mapgen_cluster_layout()
            .separacja_stolic
            .dodatek_odstepu_srodkow
            .wartosc
}

/// Web `clusterBodySeparationForMap` (`clusters.ts:1512`).
pub fn cluster_body_separation_for_map(rozmiar: MapSizeLabel, map_w: i64, map_h: i64) -> i64 {
    if map_w.min(map_h) < min_short_side() {
        return 0;
    }
    cluster_body_separation(rozmiar)
}

/// Web `clusterCenterPlacementSepForMap` (`clusters.ts:1522`).
pub fn cluster_center_placement_sep_for_map(rozmiar: MapSizeLabel, map_w: i64, map_h: i64) -> i64 {
    if map_w.min(map_h) < min_short_side() {
        return 0;
    }
    cluster_center_placement_sep(rozmiar)
}

/// Web `clusterBodyBufferRadius` (`clusters.ts:1533`): `ceil(S / 2)`; nieskonczone lub `<= 0` -> 0.
pub fn cluster_body_buffer_radius(s_cluster: f64) -> f64 {
    if !s_cluster.is_finite() || s_cluster <= 0.0 {
        return 0.0;
    }
    (s_cluster / 2.0).ceil()
}

// ---------------------------------------------------------------------------------------------
// clusters.ts:1553-1654 - cwiartki bboxa ladu i separacja stolic
// ---------------------------------------------------------------------------------------------

/// Web `landQuadrantIndex` (`clusters.ts:1555`): `east + south * 2`.
pub fn land_quadrant_index(q: i32, r: i32, mid_q: f64, mid_r: f64) -> usize {
    let east = usize::from(f64::from(q) >= mid_q);
    let south = usize::from(f64::from(r) >= mid_r);
    east + south * 2
}

/// Web `countCentersPerQuadrant` (`clusters.ts:1566`, prywatna).
pub fn count_centers_per_quadrant(centers: &[HexCoord], mid_q: f64, mid_r: f64) -> [usize; 4] {
    let mut counts = [0usize; 4];
    for c in centers {
        counts[land_quadrant_index(c.q, c.r, mid_q, mid_r)] += 1;
    }
    counts
}

/// Web `minimumSpreadQuartersRequired` (`clusters.ts:1579`).
pub fn minimum_spread_quarters_required(n_needed: i64) -> usize {
    let t = &mapgen_cluster_layout().cwiartki;
    t.progi_minimum
        .iter()
        .find(|s| n_needed >= s.od_liczby_typow)
        .map_or(t.w_przeciwnym_razie_min_cwiartek.wartosc, |s| {
            s.min_cwiartek
        })
}

/// Web `preferredQuadrantsForSpread` (`clusters.ts:1589`, prywatna): `None` = `null`; wynik to
/// `Set` w kolejnosci rosnacej.
pub fn preferred_quadrants_for_spread(
    quad_counts: &[usize; 4],
    n_needed: i64,
) -> Option<Vec<usize>> {
    if n_needed
        < mapgen_cluster_layout()
            .cwiartki
            .min_typow_preferencji
            .wartosc
    {
        return None;
    }
    let required = minimum_spread_quarters_required(n_needed);
    let occupied = quad_counts.iter().filter(|c| **c > 0).count();
    let empty: Vec<usize> = (0..4).filter(|q| quad_counts[*q] == 0).collect();
    if occupied < required && !empty.is_empty() {
        return Some(empty);
    }
    let min_count = quad_counts.iter().copied().min().unwrap_or(0);
    Some((0..4).filter(|q| quad_counts[*q] == min_count).collect())
}

/// Web `clusterCenterQuadrantSpread` (`clusters.ts:1603`).
pub fn cluster_center_quadrant_spread(
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
    let mut quads = [false; 4];
    let mut min_q = f64::INFINITY;
    let mut max_q = f64::NEG_INFINITY;
    let mut min_r = f64::INFINITY;
    let mut max_r = f64::NEG_INFINITY;
    for c in centers {
        quads[land_quadrant_index(c.q, c.r, mid_q, mid_r)] = true;
        let (cq, cr) = (f64::from(c.q), f64::from(c.r));
        if cq < min_q {
            min_q = cq;
        }
        if cq > max_q {
            max_q = cq;
        }
        if cr < min_r {
            min_r = cr;
        }
        if cr > max_r {
            max_r = cr;
        }
    }
    QuadrantSpread {
        occupied_quadrants: quads.iter().filter(|b| **b).count(),
        q_span: max_q - min_q,
        r_span: max_r - min_r,
    }
}

/// Web `passesMinCapitalSeparationGate` (`clusters.ts:1631`).
pub fn passes_min_capital_separation_gate(
    c: HexCoord,
    prior_capitals: &[HexCoord],
    min_sep: f64,
) -> bool {
    if !min_sep.is_finite() || min_sep <= 0.0 || prior_capitals.is_empty() {
        return true;
    }
    prior_capitals.iter().all(|p| dist_hh(c, *p) >= min_sep)
}

/// Web `minCapitalSeparationDistance` (`clusters.ts:1643`): `None` = `null` (brak innych).
pub fn min_capital_separation_distance(c: HexCoord, others: &[HexCoord]) -> Option<f64> {
    if others.is_empty() {
        return None;
    }
    let mut best = f64::INFINITY;
    for p in others {
        let d = dist_hh(c, *p);
        if d < best {
            best = d;
        }
    }
    Some(best)
}

/// Implementacja cechy [`ClusterLayoutHooks`] na funkcjach tego modulu (domkniecia, ktorych
/// wymagal M10, `clusters.ts:1420-1654`).
#[derive(Debug, Clone, Copy, Default)]
pub struct ClusterLayoutM11;

/// Gotowa instancja uzywana przez funkcje tego modulu.
pub const HOOKS: ClusterLayoutM11 = ClusterLayoutM11;

impl ClusterLayoutHooks for ClusterLayoutM11 {
    fn sea_dist_at(&self, sea_dist: &SeaDist, q: i32, r: i32) -> f64 {
        sea_dist_at(sea_dist, q, r)
    }

    fn passes_min_sea_dist_gate(&self, sea_dist: &SeaDist, q: i32, r: i32, min_dist: f64) -> bool {
        passes_min_sea_dist_gate(sea_dist, q, r, min_dist)
    }

    fn capital_sea_band_penalty(&self, sea: f64, min_dist: f64, max_dist: f64) -> f64 {
        capital_sea_band_penalty(sea, min_dist, max_dist)
    }

    fn land_quadrant_index(&self, q: i32, r: i32, mid_q: f64, mid_r: f64) -> usize {
        land_quadrant_index(q, r, mid_q, mid_r)
    }

    fn count_centers_per_quadrant(
        &self,
        centers: &[HexCoord],
        mid_q: f64,
        mid_r: f64,
    ) -> [usize; 4] {
        count_centers_per_quadrant(centers, mid_q, mid_r)
    }

    fn preferred_quadrants_for_spread(
        &self,
        quad_counts: &[usize; 4],
        n_needed: i64,
    ) -> Option<Vec<usize>> {
        preferred_quadrants_for_spread(quad_counts, n_needed)
    }

    fn minimum_spread_quarters_required(&self, n_needed: i64) -> usize {
        minimum_spread_quarters_required(n_needed)
    }

    fn cluster_center_quadrant_spread(
        &self,
        centers: &[HexCoord],
        land_bbox: &LandBBox,
    ) -> QuadrantSpread {
        cluster_center_quadrant_spread(centers, land_bbox)
    }

    fn min_capital_separation_distance(&self, c: HexCoord, others: &[HexCoord]) -> Option<f64> {
        min_capital_separation_distance(c, others)
    }
}

// ---------------------------------------------------------------------------------------------
// clusters.ts:1656-1768 - hex spawnu z bramkami stolicy
// ---------------------------------------------------------------------------------------------

/// Web `PickSpawnHexWithCapitalGatesOpts` (`clusters.ts:1656`). Domyslne wartosci jak
/// destrukturyzacja w `:1705-1716`: `require_local_land = true`, reszta `false`/`0`/brak.
#[derive(Debug, Clone, Copy)]
pub struct PickSpawnHexOpts<'a> {
    pub sea_dist: Option<&'a SeaDist>,
    pub min_sea_dist: f64,
    /// `None` = pole nieobecne (`opts.maxSeaDist != null` falszywe).
    pub max_sea_dist: Option<f64>,
    pub prior_capitals: &'a [HexCoord],
    pub min_capital_sep: f64,
    pub require_player_mass_gate: bool,
    pub require_local_land: bool,
    pub preferred: Option<HexCoord>,
    pub progressive_soft_sea: bool,
    pub land_bbox: Option<LandBBox>,
    /// `spreadN` (`undefined` / liczba); falszywe (`0`) i `< 5` wylaczaja bias cwiartek.
    pub spread_n: Option<i64>,
}

impl Default for PickSpawnHexOpts<'_> {
    fn default() -> Self {
        Self {
            sea_dist: None,
            min_sea_dist: 0.0,
            max_sea_dist: None,
            prior_capitals: &[],
            min_capital_sep: 0.0,
            require_player_mass_gate: false,
            require_local_land: true,
            preferred: None,
            progressive_soft_sea: false,
            land_bbox: None,
            spread_n: None,
        }
    }
}

/// Web `{ landBBox, spreadN }` rozlewane (`...spreadGateOpts`) do opcji wyboru hexu.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SpreadGateOpts {
    pub land_bbox: LandBBox,
    pub spread_n: i64,
}

/// Web `seaDistRescueLadder` (`clusters.ts:1678`): pelny wymog, potem miekszy; `Set` zachowuje
/// pierwsze wystapienie.
pub fn sea_dist_rescue_ladder(min_sea_dist: f64) -> Vec<f64> {
    if !min_sea_dist.is_finite() || min_sea_dist <= 0.0 {
        return vec![0.0];
    }
    let t = &mapgen_cluster_layout().ratunek_morza;
    let floor_step = t.dolna_granica_stopnia.wartosc;
    let steps = [
        min_sea_dist,
        js_max(
            floor_step,
            (min_sea_dist * t.mnoznik_ceil_pierwszy.wartosc).ceil(),
        ),
        js_max(
            floor_step,
            (min_sea_dist * t.mnoznik_ceil_drugi.wartosc).ceil(),
        ),
        js_max(floor_step, (min_sea_dist * t.mnoznik_floor.wartosc).floor()),
        floor_step,
        0.0,
    ];
    let mut out: Vec<f64> = Vec::new();
    for s in steps {
        if !out.contains(&s) {
            out.push(s);
        }
    }
    out
}

/// Web `pickSpawnHexWithCapitalGates` (`clusters.ts:1697`): twarde bramki (lokalny lad, masa
/// gracza, morze, separacja stolic); brak kandydata = `None`.
pub fn pick_spawn_hex_with_capital_gates(
    map: &GeneratedMap,
    pool: &[HexCoord],
    land_cache: &MassLandCache,
    map_center: PointF64,
    rand: RandRef<'_>,
    opts: &PickSpawnHexOpts<'_>,
) -> Option<HexCoord> {
    let band = capital_sea_band_width() as f64;
    let min_sea_dist = opts.min_sea_dist;
    let max_sea_dist = match opts.max_sea_dist {
        Some(m) => m,
        None => {
            if min_sea_dist > 0.0 {
                min_sea_dist + band
            } else {
                0.0
            }
        }
    };

    let sea_steps: Vec<f64> = if opts.progressive_soft_sea {
        sea_dist_rescue_ladder(min_sea_dist)
    } else {
        vec![min_sea_dist]
    };

    for sea_min in sea_steps {
        let passes = |h: HexCoord| -> bool {
            if opts.require_local_land && !passes_local_land_gate(map, h.q, h.r, None, None) {
                return false;
            }
            if opts.require_player_mass_gate
                && !passes_player_start_mass_gate(map, h.q, h.r, MassesOrCache::Cache(land_cache))
            {
                return false;
            }
            if let Some(sd) = opts.sea_dist {
                if sea_min > 0.0 && !passes_min_sea_dist_gate(sd, h.q, h.r, sea_min) {
                    return false;
                }
            }
            if !passes_min_capital_separation_gate(h, opts.prior_capitals, opts.min_capital_sep) {
                return false;
            }
            true
        };

        if let Some(preferred) = opts.preferred {
            if passes(preferred) {
                let band_ok = match opts.sea_dist {
                    None => true,
                    Some(sd) => {
                        max_sea_dist <= 0.0
                            || sea_min < min_sea_dist
                            || passes_capital_sea_band_gate(
                                sd,
                                preferred.q,
                                preferred.r,
                                sea_min,
                                max_sea_dist,
                            )
                    }
                };
                if band_ok {
                    return Some(preferred);
                }
            }
        }

        let mut candidates: Vec<SpawnLandCandidate> = pool
            .iter()
            .copied()
            .filter(|h| passes(*h))
            .map(|h| SpawnLandCandidate {
                h,
                land: local_land_fraction(map, h.q, h.r, None),
                dev: development_space_score(map, h.q, h.r, MassesOrCache::Cache(land_cache), None)
                    as f64,
                sea: opts
                    .sea_dist
                    .map_or(sea_min, |sd| sea_dist_at(sd, h.q, h.r)),
            })
            .collect();
        if candidates.is_empty() {
            continue;
        }

        // Pelny wymog min: najpierw pas min...max; soft ladder - tylko >= seaMin.
        let band_max = if sea_min >= min_sea_dist && max_sea_dist > 0.0 {
            max_sea_dist
        } else {
            0.0
        };
        if band_max > 0.0 {
            let in_band: Vec<SpawnLandCandidate> = candidates
                .iter()
                .copied()
                .filter(|c| c.sea <= band_max)
                .collect();
            if !in_band.is_empty() {
                candidates = in_band;
            }
        }

        let sort_max = or0(band_max, max_sea_dist);
        let bias_min = mapgen_cluster_layout()
            .cwiartki
            .min_typow_biasu_wyboru_hexu
            .wartosc;
        let use_bias = match (opts.land_bbox.as_ref(), opts.spread_n) {
            (Some(_), Some(n)) => n != 0 && n >= bias_min && !opts.prior_capitals.is_empty(),
            _ => false,
        };
        if use_bias {
            sort_spawn_candidates_with_spread_bias(
                &mut candidates,
                map_center,
                opts.prior_capitals,
                opts.land_bbox.as_ref().expect("bbox"),
                opts.spread_n.expect("spreadN"),
                false,
                sea_min,
                sort_max,
                &HOOKS,
            );
        } else {
            sort_spawn_land_candidates(
                &mut candidates,
                map_center,
                false,
                sea_min,
                sort_max,
                &HOOKS,
            );
        }
        let first = candidates[0].h;
        return Some(pick_tied_spawn_land_candidate(&candidates, &mut *rand).unwrap_or(first));
    }
    None
}

// ---------------------------------------------------------------------------------------------
// clusters.ts:1801-1846 - losowy wybor miast (Poisson)
// ---------------------------------------------------------------------------------------------

/// Web `opts` funkcji `poissonPickCities` (`clusters.ts:1807-1812`).
#[derive(Debug, Clone, Copy, Default)]
pub struct PoissonOpts {
    pub min_dist_from: Option<HexCoord>,
    /// `minDistFromValue ?? 0`.
    pub min_dist_from_value: Option<i64>,
    pub exclude_hex: Option<HexCoord>,
}

/// Web `poissonPickCities` (`clusters.ts:1802`, prywatna; w webie bez wywolan, port 1:1).
pub fn poisson_pick_cities(
    region: &[HexCoord],
    max_miast: i64,
    min_dist: i64,
    rand: RandRef<'_>,
    opts: &PoissonOpts,
) -> Vec<HexCoord> {
    let p = &mapgen_cluster_layout().poisson;
    let mut shuffled_region: Vec<HexCoord> = region.to_vec();
    shuffle_in_place_with(&mut shuffled_region, &mut *rand);

    let mut picked: Vec<HexCoord> = Vec::new();
    let anchor_min = opts.min_dist_from_value.unwrap_or(0);

    let too_close = |picked: &[HexCoord], c: HexCoord, limit: i64| -> bool {
        if let Some(e) = opts.exclude_hex {
            if same(c, e) {
                return true;
            }
        }
        if let Some(a) = opts.min_dist_from {
            if dist_i(c, a) < anchor_min {
                return true;
            }
        }
        picked.iter().any(|q| dist_i(c, *q) < limit)
    };

    for c in &shuffled_region {
        if picked.len() as i64 >= max_miast {
            break;
        }
        if !too_close(&picked, *c, min_dist) {
            picked.push(*c);
        }
    }

    if picked.len() < p.min_wybranych_przed_luzem.wartosc && min_dist > min_dist_start_city_state()
    {
        let luz_min = min_dist_start_city_state().max(min_dist - p.luz_odstepu.wartosc);
        for c in &shuffled_region {
            if picked.len() as i64 >= max_miast {
                break;
            }
            if picked.iter().any(|q| same(*q, *c)) {
                continue;
            }
            if !too_close(&picked, *c, luz_min) {
                picked.push(*c);
            }
        }
    }
    picked
}

// ---------------------------------------------------------------------------------------------
// clusters.ts:2166-2402 - planowanie klastra: stolica na krawedzi + miasta-panstwa
// ---------------------------------------------------------------------------------------------

/// Web `ClusterLayoutPlan` (`clusters.ts:2168`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClusterLayoutPlan {
    pub capital: HexCoord,
    pub state_cities: Vec<HexCoord>,
    pub growth_slot: Option<HexCoord>,
}

/// Wynik `buildClusterCities` / `buildClusterCitiesSimpleFallback`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClusterCitiesResult {
    pub cities: Vec<ClusterCity>,
    pub pending_state_slots: Vec<HexCoord>,
    pub growth_slot: Option<HexCoord>,
}

/// Wynik `buildClusterCitiesWithLandGate` (`{ ...layout, centrum }`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClusterCitiesWithCentrum {
    pub cities: Vec<ClusterCity>,
    pub pending_state_slots: Vec<HexCoord>,
    pub growth_slot: Option<HexCoord>,
    pub centrum: HexCoord,
}

/// Web `centroidOf` (`clusters.ts:2175`, prywatna).
pub fn centroid_of(hexes: &[HexCoord]) -> PointF64 {
    if hexes.is_empty() {
        return PointF64 { q: 0.0, r: 0.0 };
    }
    let mut sq = 0.0f64;
    let mut sr = 0.0f64;
    for h in hexes {
        sq += f64::from(h.q);
        sr += f64::from(h.r);
    }
    PointF64 {
        q: sq / hexes.len() as f64,
        r: sr / hexes.len() as f64,
    }
}

/// Web `isFarEnough` (`clusters.ts:2183`, prywatna; w webie bez wywolan, port 1:1).
pub fn is_far_enough(c: HexCoord, others: &[HexCoord], min_dist: f64) -> bool {
    others.iter().all(|o| dist_hh(c, *o) >= min_dist)
}

/// Region wywolujacego albo wlasna kopia (modeluje aliasowanie tablicy JS: filtr tworzy nowa
/// tablice, brak filtra zostawia ta sama).
fn slice_of<'a>(own: &'a Option<Vec<HexCoord>>, region: &'a [HexCoord]) -> &'a [HexCoord] {
    own.as_deref().unwrap_or(region)
}

/// Web `pickCapitalHexInRegion` (`clusters.ts:2195`, prywatna): twarda bramka seaDist, potem
/// preferencja obwodu. `region` jest `&mut`, bo web sortuje `seaPool` W MIEJSCU, a ta tablica
/// bywa TA SAMA co `region` (gdy zaden filtr nie utworzyl nowej).
#[allow(clippy::too_many_arguments)]
pub fn pick_capital_hex_in_region(
    region: &mut Vec<HexCoord>,
    blob_center: PointF64,
    rand: RandRef<'_>,
    map: Option<&GeneratedMap>,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    anchor: Option<AnchorHex>,
    prior_capitals: &[HexCoord],
    min_capital_sep: f64,
) -> Option<HexCoord> {
    let band = capital_sea_band_width() as f64;
    // `candidates`: None = ta sama tablica co `region`.
    let mut candidates: Option<Vec<HexCoord>> = None;
    if let Some(a) = anchor {
        let filtered: Vec<HexCoord> = slice_of(&candidates, region)
            .iter()
            .copied()
            .filter(|c| dist_i(*c, HexCoord::new(a.q, a.r)) >= a.min_dist)
            .collect();
        if !filtered.is_empty() {
            candidates = Some(filtered);
        }
    }
    if let Some(m) = map {
        let gated: Vec<HexCoord> = slice_of(&candidates, region)
            .iter()
            .copied()
            .filter(|c| passes_local_land_gate(m, c.q, c.r, None, None))
            .collect();
        if !gated.is_empty() {
            candidates = Some(gated);
        }
    }
    if min_capital_sep > 0.0 && !prior_capitals.is_empty() {
        let sep_gated: Vec<HexCoord> = slice_of(&candidates, region)
            .iter()
            .copied()
            .filter(|c| passes_min_capital_separation_gate(*c, prior_capitals, min_capital_sep))
            .collect();
        if sep_gated.is_empty() {
            return None;
        }
        candidates = Some(sep_gated);
    }
    if slice_of(&candidates, region).is_empty() {
        return None;
    }

    // FALA 188: seaDist mieknie w regionie (sep juz przefiltrowany) - unikaj dropu civ.
    // `sea_own`: None = ta sama tablica co `candidates`.
    let mut sea_own: Option<Vec<HexCoord>> = None;
    let mut active_min_sea = min_sea_dist;
    if let Some(sd) = sea_dist {
        if min_sea_dist > 0.0 {
            let mut found: Option<Vec<HexCoord>> = None;
            for sea_min in sea_dist_rescue_ladder(min_sea_dist) {
                let sea_gated: Vec<HexCoord> = slice_of(&candidates, region)
                    .iter()
                    .copied()
                    .filter(|c| passes_min_sea_dist_gate(sd, c.q, c.r, sea_min))
                    .collect();
                if !sea_gated.is_empty() {
                    found = Some(sea_gated);
                    active_min_sea = sea_min;
                    break;
                }
            }
            sea_own = Some(found?);
        }
    }

    let band_max = if active_min_sea >= min_sea_dist && min_sea_dist > 0.0 {
        min_sea_dist + band
    } else {
        0.0
    };
    if band_max > 0.0 {
        if let Some(sd) = sea_dist {
            let in_band: Vec<HexCoord> = match &sea_own {
                Some(v) => v.as_slice(),
                None => slice_of(&candidates, region),
            }
            .iter()
            .copied()
            .filter(|c| sea_dist_at(sd, c.q, c.r) <= band_max)
            .collect();
            if !in_band.is_empty() {
                sea_own = Some(in_band);
            }
        }
    }

    let jitter_w = mapgen_cluster_layout()
        .wybor_stolicy
        .waga_losowego_rozstrzygniecia
        .wartosc;
    let cmp = |a: &HexCoord, b: &HexCoord, rand: &mut dyn FnMut() -> f64| -> f64 {
        let sea_a = sea_dist.map_or(0.0, |sd| sea_dist_at(sd, a.q, a.r));
        let sea_b = sea_dist.map_or(0.0, |sd| sea_dist_at(sd, b.q, b.r));
        // FALA 200: pas min...max (np. 10-15), nie "najblizej brzegu".
        if min_sea_dist > 0.0 || band_max > 0.0 {
            let hi = or0(band_max, min_sea_dist + band);
            let pa = capital_sea_band_penalty(sea_a, active_min_sea, hi);
            let pb = capital_sea_band_penalty(sea_b, active_min_sea, hi);
            if pa != pb {
                return pa - pb;
            }
        }
        let da = dist_hp(*a, blob_center);
        let db = dist_hp(*b, blob_center);
        let jitter = rand() * jitter_w;
        or0(
            or0((db + jitter) - (da + jitter), f64::from(a.q - b.q)),
            f64::from(a.r - b.r),
        )
    };

    // Sortowanie W MIEJSCU: wlasna tablica, albo `candidates`, albo (alias) `region`.
    if let Some(v) = sea_own.as_mut() {
        js_array_sort_by(v, |a, b| cmp(a, b, &mut *rand));
        return Some(v[0]);
    }
    match candidates.as_mut() {
        Some(v) => {
            js_array_sort_by(v, |a, b| cmp(a, b, &mut *rand));
            Some(v[0])
        }
        None => {
            js_array_sort_by(region, |a, b| cmp(a, b, &mut *rand));
            Some(region[0])
        }
    }
}

/// `[{ capital }, ...stateCities]` jako `ClusterCity[]` (wspolny ksztalt w web:
/// `layoutToClusterCities`, `clusters.ts:2308`).
fn cities_from(capital: HexCoord, state_cities: &[HexCoord]) -> Vec<ClusterCity> {
    let mut cities = vec![ClusterCity {
        q: capital.q,
        r: capital.r,
        is_capital: true,
    }];
    for s in state_cities {
        cities.push(ClusterCity {
            q: s.q,
            r: s.r,
            is_capital: false,
        });
    }
    cities
}

/// Web `buildClusterLayoutWithEdgeCapital` (`clusters.ts:2271`). `growth_reserve = None` =>
/// `CLUSTER_GROWTH_RESERVE`, `seed = None` => 42.
#[allow(clippy::too_many_arguments)]
pub fn build_cluster_layout_with_edge_capital(
    region: &mut Vec<HexCoord>,
    centrum: HexCoord,
    state_city_count: i64,
    min_dist: i64,
    rand: RandRef<'_>,
    anchor: Option<AnchorHex>,
    growth_reserve: Option<i64>,
    map: Option<&GeneratedMap>,
    seed: Option<u32>,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    prior_capitals: &[HexCoord],
    min_capital_sep: f64,
) -> Option<ClusterLayoutPlan> {
    if state_city_count < 0 {
        return None;
    }
    let growth_reserve = growth_reserve.unwrap_or_else(cluster_growth_reserve);
    let seed = seed.unwrap_or(DEFAULT_LAYOUT_SEED);

    let blob_center = if region.is_empty() {
        centroid_of(&[centrum])
    } else {
        centroid_of(region)
    };
    let capital = pick_capital_hex_in_region(
        region,
        blob_center,
        &mut *rand,
        map,
        sea_dist,
        min_sea_dist,
        anchor,
        prior_capitals,
        min_capital_sep,
    )?;

    let packed = pack_city_states_around_capital(
        region,
        region,
        capital,
        state_city_count,
        min_dist,
        seed,
        &PackAroundCapitalOpts {
            exclude_hex: Some(capital),
            anchor,
            growth_reserve: Some(growth_reserve),
            ..PackAroundCapitalOpts::default()
        },
    );
    Some(ClusterLayoutPlan {
        capital,
        state_cities: packed.state_cities,
        growth_slot: packed.growth_slot,
    })
}

/// Web `layoutToClusterCities` (`clusters.ts:2308`, prywatna).
pub fn layout_to_cluster_cities(layout: &ClusterLayoutPlan) -> Vec<ClusterCity> {
    cities_from(layout.capital, &layout.state_cities)
}

/// Web `buildClusterCities` (`clusters.ts:2320`, prywatna). `seed = None` => 42.
#[allow(clippy::too_many_arguments)]
pub fn build_cluster_cities(
    region: &mut Vec<HexCoord>,
    centrum: HexCoord,
    state_city_count: i64,
    min_dist: i64,
    rand: RandRef<'_>,
    anchor: Option<AnchorHex>,
    seed: Option<u32>,
    map: Option<&GeneratedMap>,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    prior_capitals: &[HexCoord],
    min_capital_sep: f64,
) -> ClusterCitiesResult {
    let layout = build_cluster_layout_with_edge_capital(
        region,
        centrum,
        state_city_count,
        min_dist,
        &mut *rand,
        anchor,
        Some(cluster_growth_reserve()),
        map,
        Some(seed.unwrap_or(DEFAULT_LAYOUT_SEED)),
        sea_dist,
        min_sea_dist,
        prior_capitals,
        min_capital_sep,
    );
    match layout {
        None => build_cluster_cities_simple_fallback(
            region,
            centrum,
            state_city_count,
            min_dist,
            anchor,
            seed.unwrap_or(DEFAULT_LAYOUT_SEED),
            map,
            sea_dist,
            min_sea_dist,
            prior_capitals,
            min_capital_sep,
        ),
        Some(l) => ClusterCitiesResult {
            cities: layout_to_cluster_cities(&l),
            pending_state_slots: l.state_cities,
            growth_slot: l.growth_slot,
        },
    }
}

/// Web `buildClusterCitiesSimpleFallback` (`clusters.ts:2355`, prywatna). Parametr `centrum`
/// jest w webie NIEUZYWANY (zachowany dla zgodnosci sygnatury).
#[allow(clippy::too_many_arguments)]
pub fn build_cluster_cities_simple_fallback(
    region: &mut Vec<HexCoord>,
    _centrum: HexCoord,
    state_city_count: i64,
    min_dist: i64,
    anchor: Option<AnchorHex>,
    seed: u32,
    map: Option<&GeneratedMap>,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    prior_capitals: &[HexCoord],
    min_capital_sep: f64,
) -> ClusterCitiesResult {
    let empty = ClusterCitiesResult {
        cities: Vec::new(),
        pending_state_slots: Vec::new(),
        growth_slot: None,
    };
    // `pool = region` (ta sama tablica) albo wynik `filter` (nowa).
    let mut filtered: Option<Vec<HexCoord>> = None;
    if let Some(a) = anchor {
        let f: Vec<HexCoord> = region
            .iter()
            .copied()
            .filter(|h| dist_i(*h, HexCoord::new(a.q, a.r)) >= a.min_dist)
            .collect();
        if !f.is_empty() {
            filtered = Some(f);
        }
    }
    let pool: &mut Vec<HexCoord> = match filtered.as_mut() {
        Some(f) => f,
        None => region,
    };
    if pool.is_empty() {
        return empty;
    }

    let cen = centroid_of(pool);
    let mut zero = || 0.0f64;
    let Some(capital) = pick_capital_hex_in_region(
        pool,
        cen,
        &mut zero,
        map,
        sea_dist,
        min_sea_dist,
        anchor,
        prior_capitals,
        min_capital_sep,
    ) else {
        return empty;
    };

    let packed = pack_city_states_around_capital(
        pool,
        pool,
        capital,
        state_city_count,
        min_dist,
        seed,
        &PackAroundCapitalOpts {
            exclude_hex: Some(capital),
            anchor,
            growth_reserve: Some(0),
            ..PackAroundCapitalOpts::default()
        },
    );
    ClusterCitiesResult {
        cities: cities_from(capital, &packed.state_cities),
        pending_state_slots: packed.state_cities,
        growth_slot: packed.growth_slot,
    }
}

// ---------------------------------------------------------------------------------------------
// clusters.ts:2404-2587 - przydzial typow i dominacja lokalnego ladu
// ---------------------------------------------------------------------------------------------

/// Web `assignTypesToClusterCenters` (`clusters.ts:2408`, prywatna). Wynik ma dlugosc
/// `max(centrumy.len(), 1)` (web: `aktywneKlucze[0] = playerKlucz` rozszerza pusta tablice).
pub fn assign_types_to_cluster_centers(
    centrumy: &[HexCoord],
    masses: &[Vec<HexCoord>],
    player_klucz: &str,
    roster_bez_gracza: &[String],
    rand: RandRef<'_>,
) -> Vec<String> {
    let hex_index = mass_land_cache_from_masses(masses.to_vec()).hex_index;
    let n_foreign = centrumy.len().saturating_sub(1) as i64;
    let foreign_allocation = allocate_typy_to_masses(n_foreign, masses);

    let mut centers_by_mass: std::collections::HashMap<usize, Vec<usize>> =
        std::collections::HashMap::new();
    for (ci, c) in centrumy.iter().enumerate().skip(1) {
        let Some(mi) = hex_index.get(&(c.q, c.r)).copied() else {
            continue;
        };
        centers_by_mass.entry(mi).or_default().push(ci);
    }

    let mut shuffled_types: Vec<String> = roster_bez_gracza.to_vec();
    shuffle_in_place_with(&mut shuffled_types, &mut *rand);

    let len = centrumy.len().max(1);
    let mut aktywne: Vec<Option<String>> = vec![None; len];
    aktywne[0] = Some(player_klucz.to_string());

    let mut type_idx = 0usize;
    let mut mass_order = qualifying_mass_indices_for_spawn(masses);
    js_array_sort_by(&mut mass_order, |a, b| {
        masses[*b].len() as f64 - masses[*a].len() as f64
    });

    let next_type = |ci: usize, type_idx: &mut usize| -> String {
        let t = shuffled_types.get(*type_idx).cloned();
        *type_idx += 1;
        t.unwrap_or_else(|| format!("typ{ci}"))
    };

    for mi in &mass_order {
        let center_indices: Vec<usize> = centers_by_mass.get(mi).cloned().unwrap_or_default();
        let quota = foreign_allocation.get(*mi).copied().unwrap_or(0).max(0) as usize;
        for ci in center_indices.iter().take(quota) {
            aktywne[*ci] = Some(next_type(*ci, &mut type_idx));
        }
    }

    for (ci, slot) in aktywne.iter_mut().enumerate().skip(1) {
        // `!aktywneKlucze[ci]`: brak wpisu albo pusty lancuch.
        if slot.as_deref().is_none_or(str::is_empty) {
            *slot = Some(next_type(ci, &mut type_idx));
        }
    }

    aktywne.into_iter().map(Option::unwrap_or_default).collect()
}

/// Wynik `enforceLocalLandDominance`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LocalLandDominanceResult {
    pub centrumy: Vec<HexCoord>,
    pub regiony: Vec<Vec<HexCoord>>,
    pub aktywne_klucze: Vec<String>,
}

/// Web `enforceLocalLandDominance` (`clusters.ts:2455`, prywatna). `centrumy` i `regiony` sa
/// MUTOWANE w miejscu (jak w webie) i dodatkowo zwracane w przefiltrowanej postaci. `None` =
/// web rzuca `TypeError` (pusta lista srodkow: `centrumy[0]!.q`). Zalozenie domeny:
/// `regiony.len() == centrumy.len()`.
#[allow(clippy::too_many_arguments)]
pub fn enforce_local_land_dominance(
    map: &GeneratedMap,
    centrumy: &mut [HexCoord],
    regiony: &mut [Vec<HexCoord>],
    aktywne_klucze: &[String],
    ladowe: &[HexCoord],
    land_cache: &MassLandCache,
    rand: RandRef<'_>,
    min_dist: f64,
    map_center: PointF64,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
) -> Option<LocalLandDominanceResult> {
    let masses = &land_cache.masses;
    let mut relocated = false;

    for ci in 0..centrumy.len() {
        let center = centrumy[ci];
        let ok = if ci == 0 {
            passes_player_start_mass_gate(map, center.q, center.r, MassesOrCache::Cache(land_cache))
        } else {
            passes_local_land_gate(map, center.q, center.r, None, None)
        };
        if ok {
            continue;
        }

        let region: Vec<HexCoord> = regiony.get(ci).cloned().unwrap_or_default();
        let others: Vec<HexCoord> = centrumy
            .iter()
            .enumerate()
            .filter(|(i, _)| *i != ci)
            .map(|(_, c)| *c)
            .collect();
        let mut new_center: Option<HexCoord>;
        if ci == 0 {
            new_center = pick_player_cluster_center(
                map,
                MassesOrCache::Cache(land_cache),
                ladowe,
                map_center,
                &mut *rand,
                sea_dist,
                min_sea_dist,
                &HOOKS,
            );
        } else {
            new_center = pick_best_local_land_spawn(
                map,
                &region,
                &others,
                min_dist,
                land_cache,
                Some(&mut *rand),
                sea_dist,
                min_sea_dist,
                &HOOKS,
            );
            if new_center.is_none() {
                let mut qualifying = qualifying_mass_indices_for_spawn(masses);
                js_array_sort_by(&mut qualifying, |a, b| {
                    masses[*b].len() as f64 - masses[*a].len() as f64
                });
                for mi in qualifying {
                    new_center = pick_center_in_mass_spread(
                        map,
                        &masses[mi],
                        &others,
                        min_dist,
                        land_cache,
                        Some(&mut *rand),
                        sea_dist,
                        min_sea_dist,
                        None,
                        None,
                        &HOOKS,
                    );
                    if new_center.is_some() {
                        break;
                    }
                }
            }
        }

        if let Some(nc) = new_center {
            centrumy[ci] = nc;
            relocated = true;
        }
    }

    if relocated {
        let new_regiony = assign_voronoi_regions(ladowe, centrumy)?;
        for (i, slot) in regiony.iter_mut().enumerate() {
            *slot = new_regiony[i].clone();
        }
    }

    let mut keep: Vec<bool> = centrumy
        .iter()
        .enumerate()
        .map(|(ci, c)| ci == 0 || passes_local_land_gate(map, c.q, c.r, None, None))
        .collect();

    let land_bbox = LandBBox::from_hexes(ladowe);
    let dominance_spread_gate = SpreadGateOpts {
        land_bbox,
        spread_n: centrumy.len() as i64,
    };

    // FALA 188/193: relokacja zamiast dropu - nigdy nie ucinaj typow gdy lad istnieje.
    for ci in 1..centrumy.len() {
        if keep[ci] {
            continue;
        }
        let others: Vec<HexCoord> = centrumy
            .iter()
            .enumerate()
            .filter(|(i, _)| *i != ci && keep[*i])
            .map(|(_, c)| *c)
            .collect();
        let mut rescued = pick_spawn_hex_with_capital_gates(
            map,
            ladowe,
            land_cache,
            map_center,
            &mut *rand,
            &gate_opts(
                sea_dist,
                min_sea_dist,
                &others,
                min_dist,
                true,
                false,
                Some(&dominance_spread_gate),
            ),
        );
        if rescued.is_none() {
            rescued = pick_spawn_hex_with_capital_gates(
                map,
                ladowe,
                land_cache,
                map_center,
                &mut *rand,
                &gate_opts(
                    sea_dist,
                    min_sea_dist,
                    &others,
                    min_dist,
                    false,
                    false,
                    Some(&dominance_spread_gate),
                ),
            );
        }
        if let Some(r) = rescued {
            centrumy[ci] = r;
        }
        // Zostaw oryginal - lepiej slabszy hex niz drop.
        keep[ci] = true;
    }

    let c0 = *centrumy.first()?;
    if !passes_local_land_gate(map, c0.q, c0.r, None, None)
        || !passes_player_start_mass_gate(map, c0.q, c0.r, MassesOrCache::Cache(land_cache))
    {
        let forced = pick_player_cluster_center(
            map,
            MassesOrCache::Cache(land_cache),
            ladowe,
            map_center,
            &mut *rand,
            sea_dist,
            min_sea_dist,
            &HOOKS,
        );
        if let Some(f) = forced {
            centrumy[0] = f;
            let new_regiony = assign_voronoi_regions(ladowe, centrumy)?;
            for (i, slot) in regiony.iter_mut().enumerate() {
                *slot = new_regiony[i].clone();
            }
            keep[0] = true;
        }
    }

    let new_centrumy: Vec<HexCoord> = centrumy
        .iter()
        .enumerate()
        .filter(|(i, _)| keep[*i])
        .map(|(_, c)| *c)
        .collect();
    let new_aktywne: Vec<String> = aktywne_klucze
        .iter()
        .enumerate()
        .filter(|(i, _)| keep.get(*i).copied().unwrap_or(false))
        .map(|(_, k)| k.clone())
        .collect();
    let new_regiony = assign_voronoi_regions(ladowe, &new_centrumy)?;

    Some(LocalLandDominanceResult {
        centrumy: new_centrumy,
        regiony: new_regiony,
        aktywne_klucze: new_aktywne,
    })
}

/// Zestaw opcji wyboru hexu uzywany przez wszystkie petle napraw (`progressiveSoftSea: true`,
/// `...spreadGateOpts`).
fn gate_opts<'a>(
    sea_dist: Option<&'a SeaDist>,
    min_sea_dist: f64,
    prior_capitals: &'a [HexCoord],
    min_capital_sep: f64,
    require_local_land: bool,
    require_player_mass_gate: bool,
    spread: Option<&SpreadGateOpts>,
) -> PickSpawnHexOpts<'a> {
    PickSpawnHexOpts {
        sea_dist,
        min_sea_dist,
        prior_capitals,
        min_capital_sep,
        require_local_land,
        require_player_mass_gate,
        progressive_soft_sea: true,
        land_bbox: spread.map(|s| s.land_bbox),
        spread_n: spread.map(|s| s.spread_n),
        ..PickSpawnHexOpts::default()
    }
}

// ---------------------------------------------------------------------------------------------
// clusters.ts:2589-2656 - klaster z bramka lokalnego ladu
// ---------------------------------------------------------------------------------------------

/// Web `clusterCapitalPos` (`clusters.ts:2589`, prywatna).
pub fn cluster_capital_pos(cities: &[ClusterCity], fallback: HexCoord) -> HexCoord {
    cities
        .iter()
        .find(|m| m.is_capital)
        .or_else(|| cities.first())
        .map_or(fallback, |c| HexCoord::new(c.q, c.r))
}

/// Web `buildClusterCitiesWithLandGate` (`clusters.ts:2597`, prywatna).
#[allow(clippy::too_many_arguments)]
pub fn build_cluster_cities_with_land_gate(
    map: &GeneratedMap,
    region: &mut Vec<HexCoord>,
    centrum: HexCoord,
    state_city_count: i64,
    min_dist: i64,
    rand: RandRef<'_>,
    anchor: Option<AnchorHex>,
    seed: u32,
    land_cache: &MassLandCache,
    existing_centers: &[HexCoord],
    min_cluster_dist: f64,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    prior_capitals: &[HexCoord],
    min_capital_sep: f64,
) -> Option<ClusterCitiesWithCentrum> {
    let masses = &land_cache.masses;
    let mut active_centrum = centrum;
    for _attempt in 0..mapgen_cluster_layout().wybor_stolicy.proby_ladu.wartosc {
        let layout = build_cluster_cities(
            region,
            active_centrum,
            state_city_count,
            min_dist,
            &mut *rand,
            anchor,
            Some(seed),
            Some(map),
            sea_dist,
            min_sea_dist,
            prior_capitals,
            min_capital_sep,
        );
        let cap = cluster_capital_pos(&layout.cities, active_centrum);
        let land_ok = passes_local_land_gate(map, cap.q, cap.r, None, None);
        let sea_ok = sea_dist.is_none_or(|sd| {
            min_sea_dist <= 0.0 || passes_min_sea_dist_gate(sd, cap.q, cap.r, min_sea_dist)
        });
        let sep_ok = passes_min_capital_separation_gate(cap, prior_capitals, min_capital_sep);
        if land_ok && sea_ok && sep_ok {
            return Some(ClusterCitiesWithCentrum {
                cities: layout.cities,
                pending_state_slots: layout.pending_state_slots,
                growth_slot: layout.growth_slot,
                centrum: active_centrum,
            });
        }
        let alt_center = pick_best_local_land_spawn(
            map,
            region,
            existing_centers,
            min_cluster_dist,
            land_cache,
            Some(&mut *rand),
            sea_dist,
            min_sea_dist,
            &HOOKS,
        );
        let mut next_center = alt_center;
        if next_center.is_none() {
            let mut qualifying = qualifying_mass_indices_for_spawn(masses);
            js_array_sort_by(&mut qualifying, |a, b| {
                masses[*b].len() as f64 - masses[*a].len() as f64
            });
            for mi in qualifying {
                next_center = pick_center_in_mass_spread(
                    map,
                    &masses[mi],
                    existing_centers,
                    min_cluster_dist,
                    land_cache,
                    Some(&mut *rand),
                    sea_dist,
                    min_sea_dist,
                    None,
                    None,
                    &HOOKS,
                );
                if next_center.is_some() {
                    break;
                }
            }
        }
        active_centrum = next_center?;
    }
    None
}

// ---------------------------------------------------------------------------------------------
// clusters.ts:2654-2804 - twarda separacja stolic
// ---------------------------------------------------------------------------------------------

/// Web `clusterCapitalHex` (`clusters.ts:2654`, prywatna): stolica albo pierwsze miasto.
pub fn cluster_capital_hex(k: &TypeCluster) -> Option<HexCoord> {
    k.miasta
        .iter()
        .find(|x| x.is_capital)
        .or_else(|| k.miasta.first())
        .map(|m| HexCoord::new(m.q, m.r))
}

/// `dropCluster` z `enforceHardCapitalSeparationOnKlastry` / `enforceClusterBodySeparationOnKlastry`
/// (`clusters.ts:2679, 3041`): usuwa klaster i region, przenumerowuje `typIndex`.
fn drop_cluster(
    klastry: &mut Vec<TypeCluster>,
    cluster_regions: &mut Vec<Vec<HexCoord>>,
    ki: usize,
) {
    if ki < klastry.len() {
        klastry.remove(ki);
    }
    if ki < cluster_regions.len() {
        cluster_regions.remove(ki);
    }
    for (i, k) in klastry.iter_mut().enumerate() {
        k.typ_index = i;
    }
}

/// Wspolna 3-stopniowa relokacja stolicy w petlach napraw (region -> globalnie z lokalnym ladem
/// -> globalnie bez lokalnego ladu), `clusters.ts:2728-2763` i `:3087-3122`.
#[allow(clippy::too_many_arguments)]
fn relocate_capital(
    region: &mut Vec<HexCoord>,
    map: &GeneratedMap,
    rand: RandRef<'_>,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    anchor: Option<AnchorHex>,
    prior_caps: &[HexCoord],
    min_capital_sep: f64,
    ladowe: &[HexCoord],
    land_cache: &MassLandCache,
    map_center: PointF64,
    require_player_mass_gate: bool,
    spread_gate_opts: Option<&SpreadGateOpts>,
) -> Option<HexCoord> {
    let blob_center = centroid_of(region);
    let mut new_cap = pick_capital_hex_in_region(
        region,
        blob_center,
        &mut *rand,
        Some(map),
        sea_dist,
        min_sea_dist,
        anchor,
        prior_caps,
        min_capital_sep,
    );
    if new_cap.is_none() {
        new_cap = pick_spawn_hex_with_capital_gates(
            map,
            ladowe,
            land_cache,
            map_center,
            &mut *rand,
            &gate_opts(
                sea_dist,
                min_sea_dist,
                prior_caps,
                min_capital_sep,
                true,
                require_player_mass_gate,
                spread_gate_opts,
            ),
        );
    }
    if new_cap.is_none() {
        new_cap = pick_spawn_hex_with_capital_gates(
            map,
            ladowe,
            land_cache,
            map_center,
            &mut *rand,
            &gate_opts(
                sea_dist,
                min_sea_dist,
                prior_caps,
                min_capital_sep,
                false,
                require_player_mass_gate,
                spread_gate_opts,
            ),
        );
    }
    new_cap
}

/// Stan petli napraw: wspolne wejscia obu funkcji `enforce*SeparationOnKlastry`.
fn anchor_for(
    fix_ki: usize,
    player_cap: Option<HexCoord>,
    min_dyst_obcy_od_gracza: i64,
) -> Option<AnchorHex> {
    if fix_ki == 0 {
        return None;
    }
    player_cap.map(|p| AnchorHex {
        q: p.q,
        r: p.r,
        min_dist: min_dyst_obcy_od_gracza,
    })
}

/// Web `enforceHardCapitalSeparationOnKlastry` (`clusters.ts:2660`, prywatna): pary stolic
/// roznych civ >= `minCapitalSep` - relokacja w regionie lub drop typu.
#[allow(clippy::too_many_arguments)]
pub fn enforce_hard_capital_separation_on_klastry(
    klastry: &mut Vec<TypeCluster>,
    cluster_regions: &mut Vec<Vec<HexCoord>>,
    map: &GeneratedMap,
    rand: RandRef<'_>,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    min_capital_sep: f64,
    min_dyst_obcy_od_gracza: i64,
    ladowe: &[HexCoord],
    land_cache: &MassLandCache,
    seed: u32,
    state_city_count: i64,
    map_center: PointF64,
    min_dyst_miasta_panstwa: i64,
    spread_gate_opts: Option<&SpreadGateOpts>,
) {
    if !min_capital_sep.is_finite() || min_capital_sep <= 0.0 {
        return;
    }
    let guard_mul = mapgen_cluster_layout()
        .straznicy
        .twarda_separacja_mnoznik
        .wartosc;

    let mut repaired = true;
    let mut guard = 0usize;
    // `repaired && guard++ < klastry.length * 4`.
    while repaired && {
        let ok = guard < klastry.len() * guard_mul;
        guard += 1;
        ok
    } {
        repaired = false;
        let mut caps: Vec<(HexCoord, usize)> = Vec::new();
        for (ki, k) in klastry.iter().enumerate() {
            if let Some(c) = cluster_capital_hex(k) {
                caps.push((c, ki));
            }
        }

        'outer: for i in 0..caps.len() {
            for j in (i + 1)..caps.len() {
                let d = dist_hh(caps[i].0, caps[j].0);
                if d >= min_capital_sep {
                    continue;
                }

                let fix_idx = if caps[j].1 > caps[i].1 { j } else { i };
                let fix_ki = caps[fix_idx].1;
                if cluster_regions
                    .get(fix_ki)
                    .is_none_or(std::vec::Vec::is_empty)
                {
                    drop_cluster(klastry, cluster_regions, fix_ki);
                    repaired = true;
                    break 'outer;
                }

                let prior_caps: Vec<HexCoord> = caps
                    .iter()
                    .enumerate()
                    .filter(|(idx, _)| *idx != fix_idx)
                    .map(|(_, c)| c.0)
                    .collect();

                let player_cap = caps.iter().find(|c| c.1 == 0).map(|c| c.0);
                let anchor = anchor_for(fix_ki, player_cap, min_dyst_obcy_od_gracza);

                let new_cap = relocate_capital(
                    &mut cluster_regions[fix_ki],
                    map,
                    &mut *rand,
                    sea_dist,
                    min_sea_dist,
                    anchor,
                    &prior_caps,
                    min_capital_sep,
                    ladowe,
                    land_cache,
                    map_center,
                    fix_ki == 0,
                    spread_gate_opts,
                );
                let Some(new_cap) = new_cap else {
                    drop_cluster(klastry, cluster_regions, fix_ki);
                    repaired = true;
                    break 'outer;
                };

                let min_dist = if fix_ki == 0 {
                    min_dyst_miasta_panstwa
                } else {
                    min_dist_foreign_in_cluster()
                };
                let packed = pack_city_states_around_capital(
                    ladowe,
                    &cluster_regions[fix_ki],
                    new_cap,
                    state_city_count,
                    min_dist,
                    mix_seed(seed, fix_ki, KI_SEED_MUL),
                    &PackAroundCapitalOpts {
                        exclude_hex: Some(new_cap),
                        anchor,
                        ..PackAroundCapitalOpts::default()
                    },
                );
                let k = &mut klastry[fix_ki];
                k.miasta = cities_from(new_cap, &packed.state_cities);
                k.growth_slot = Some(packed.growth_slot);
                if fix_ki == 0 {
                    k.pending_state_slots = Some(pack_rival_cities_around_core(
                        ladowe,
                        new_cap,
                        state_city_count,
                        min_dyst_miasta_panstwa,
                        seed,
                        Some(map_center),
                    ));
                }
                caps[fix_idx] = (new_cap, fix_ki);
                repaired = true;
                break 'outer;
            }
        }
    }
}

// ---------------------------------------------------------------------------------------------
// clusters.ts:2806-2992 - bufory obcych klastrow i dopakowanie miast-panstw
// ---------------------------------------------------------------------------------------------

/// Web `allClusterCities` (`clusters.ts:2807`, prywatna).
pub fn all_cluster_cities(k: &TypeCluster) -> Vec<HexCoord> {
    k.miasta.iter().map(|m| HexCoord::new(m.q, m.r)).collect()
}

/// Web `foreignBuffersForCluster` (`clusters.ts:2812`, prywatna).
pub fn foreign_buffers_for_cluster(
    klastry: &[TypeCluster],
    exclude_ki: usize,
    buffer_radius: f64,
) -> Vec<ForeignClusterBuffer> {
    let mut out = Vec::new();
    for (ki, k) in klastry.iter().enumerate() {
        if ki == exclude_ki {
            continue;
        }
        if let Some(cap) = cluster_capital_hex(k) {
            out.push(ForeignClusterBuffer {
                q: cap.q,
                r: cap.r,
                radius: buffer_radius,
            });
        }
    }
    out
}

/// Web `foreignRepackAnchor` (`clusters.ts:2827`, prywatna): anchor od gracza dla obcych MP -
/// pomijany gdy po body-sep stolica jest za blisko.
pub fn foreign_repack_anchor(
    ki: usize,
    cap: HexCoord,
    player_cap: Option<HexCoord>,
    min_dyst_obcy_od_gracza: i64,
) -> Option<AnchorHex> {
    if ki == 0 {
        return None;
    }
    let player_cap = player_cap?;
    let cap_dist = dist_i(cap, player_cap);
    if cap_dist + cluster_city_state_max_hex() < min_dyst_obcy_od_gracza {
        return None;
    }
    Some(AnchorHex {
        q: player_cap.q,
        r: player_cap.r,
        min_dist: min_dyst_obcy_od_gracza,
    })
}

/// Web `repackClusterStateCitiesIfSparse` (`clusters.ts:2843`, prywatna). Parametr
/// `clusterRegions` jest w webie NIEUZYWANY (zachowany dla zgodnosci sygnatury).
#[allow(clippy::too_many_arguments)]
pub fn repack_cluster_state_cities_if_sparse(
    klastry: &mut [TypeCluster],
    _cluster_regions: &[Vec<HexCoord>],
    ki: usize,
    state_city_count: i64,
    min_dyst_obcy_od_gracza: i64,
    ladowe: &[HexCoord],
    seed: u32,
    buffer_radius: f64,
    map_center: PointF64,
    min_dyst_miasta_panstwa: i64,
) {
    let rp = &mapgen_cluster_layout().repack;
    let Some(k) = klastry.get(ki) else {
        return;
    };
    let Some(cap) = cluster_capital_hex(k) else {
        return;
    };
    let mp_now = k.miasta.iter().filter(|m| !m.is_capital).count() as i64;
    if mp_now >= state_city_count {
        return;
    }

    let player_cap = klastry.first().and_then(cluster_capital_hex);
    let anchor = foreign_repack_anchor(ki, cap, player_cap, min_dyst_obcy_od_gracza);
    let foreign_bufs = foreign_buffers_for_cluster(klastry, ki, buffer_radius);
    let min_dist = if ki == 0 {
        min_dyst_miasta_panstwa
    } else {
        min_dist_foreign_in_cluster()
    };
    // Pelny lad - region Voronoi czesto za maly po body-sep (BUG-INKOWIE-MP-BRAK).
    let packed = pack_city_states_around_capital(
        ladowe,
        ladowe,
        cap,
        state_city_count,
        min_dist,
        mix_seed(seed, ki, KI_SEED_MUL),
        &PackAroundCapitalOpts {
            exclude_hex: Some(cap),
            anchor,
            foreign_buffers: &foreign_bufs,
            growth_reserve: Some(cluster_growth_reserve()),
            half_plane_axis: if ki == 0 {
                Some(compute_same_type_rival_half_plane_axis(
                    cap, map_center, seed,
                ))
            } else {
                None
            },
            ring_distances: None,
        },
    );

    let mut valid_mp: Vec<HexCoord> = packed
        .state_cities
        .iter()
        .copied()
        .filter(|s| passes_foreign_cluster_buffer_gate(*s, &foreign_bufs))
        .collect();
    let mut used_growth = packed.growth_slot;

    // Last-resort: krawedz mapy / ciasny bufor / anchor niemozliwy (seed 17,32,85 Inkowie).
    if valid_mp.is_empty() {
        let loose_radius = js_max(
            0.0,
            (buffer_radius / rp.luzny_bufor_dzielnik.wartosc).floor(),
        );
        let loose_bufs = foreign_buffers_for_cluster(klastry, ki, loose_radius);
        let loose_min = rp
            .luzny_min_dystans_dolny
            .wartosc
            .max(min_dist - rp.luzny_min_dystans_odjecie.wartosc);
        let mut rings: Vec<i64> = vec![cluster_city_state_max_hex()];
        rings.extend(rp.pierscienie_po_maksymalnym.wartosc.iter().copied());
        let retry = pack_city_states_around_capital(
            ladowe,
            ladowe,
            cap,
            state_city_count,
            loose_min,
            mix_seed(seed, ki, REPACK_LOOSE_SEED_MUL),
            &PackAroundCapitalOpts {
                exclude_hex: Some(cap),
                // Stolica juz na mapie - nie wymuszaj 12 hex od gracza na MP.
                anchor: None,
                foreign_buffers: &loose_bufs,
                growth_reserve: Some(0),
                ring_distances: Some(&rings),
                half_plane_axis: if ki == 0 {
                    Some(compute_same_type_rival_half_plane_axis(
                        cap,
                        map_center,
                        seed.wrapping_add(REPACK_AXIS_SEED_ADD),
                    ))
                } else {
                    None
                },
            },
        );
        valid_mp = retry
            .state_cities
            .iter()
            .copied()
            .filter(|s| passes_foreign_cluster_buffer_gate(*s, &loose_bufs))
            .collect();
        used_growth = retry.growth_slot;

        // Desperate: minDist=2, bez buforow - tylko sep w klastrze.
        if valid_mp.is_empty() {
            let desperate = pack_city_states_around_capital(
                ladowe,
                ladowe,
                cap,
                state_city_count,
                rp.ostateczny_min_dystans.wartosc,
                mix_seed(seed, ki, REPACK_DESPERATE_SEED_MUL),
                &PackAroundCapitalOpts {
                    exclude_hex: Some(cap),
                    foreign_buffers: &[],
                    growth_reserve: Some(0),
                    ring_distances: Some(&rp.pierscienie_ostateczne.wartosc),
                    ..PackAroundCapitalOpts::default()
                },
            );
            valid_mp = desperate.state_cities;
            used_growth = desperate.growth_slot;
        }

        if valid_mp.is_empty() {
            return;
        }
    }

    let take = (state_city_count.max(0) as usize).min(valid_mp.len());
    let k = &mut klastry[ki];
    k.miasta = cities_from(cap, &valid_mp[..take]);
    k.growth_slot = Some(used_growth);
    if ki == 0 {
        k.pending_state_slots = Some(pack_rival_cities_around_core(
            ladowe,
            cap,
            state_city_count,
            min_dyst_miasta_panstwa,
            seed,
            Some(map_center),
        ));
    }
}

/// Web `repackAllSparseClusterStateCities` (`clusters.ts:2967`, prywatna).
#[allow(clippy::too_many_arguments)]
pub fn repack_all_sparse_cluster_state_cities(
    klastry: &mut [TypeCluster],
    cluster_regions: &[Vec<HexCoord>],
    state_city_count: i64,
    min_dyst_obcy_od_gracza: i64,
    ladowe: &[HexCoord],
    seed: u32,
    buffer_radius: f64,
    map_center: PointF64,
    min_dyst_miasta_panstwa: i64,
) {
    for ki in 0..klastry.len() {
        repack_cluster_state_cities_if_sparse(
            klastry,
            cluster_regions,
            ki,
            state_city_count,
            min_dyst_obcy_od_gracza,
            ladowe,
            seed,
            buffer_radius,
            map_center,
            min_dyst_miasta_panstwa,
        );
    }
}

// ---------------------------------------------------------------------------------------------
// clusters.ts:2994-3234 - separacja brył klastrów
// ---------------------------------------------------------------------------------------------

/// `bodyViolation(i, j)` z `enforceClusterBodySeparationOnKlastry` (`clusters.ts:3019`).
fn body_violation(
    klastry: &[TypeCluster],
    i: usize,
    j: usize,
    min_capital_sep: f64,
    buffer_radius: f64,
) -> bool {
    let cities_a = all_cluster_cities(&klastry[i]);
    let cities_b = all_cluster_cities(&klastry[j]);
    let cap_a = cluster_capital_hex(&klastry[i]);
    let cap_b = cluster_capital_hex(&klastry[j]);
    for a in &cities_a {
        for b in &cities_b {
            let d = dist_hh(*a, *b);
            let a_is_cap = cap_a.is_some_and(|c| same(*a, c));
            let b_is_cap = cap_b.is_some_and(|c| same(*b, c));
            if a_is_cap && b_is_cap {
                if d < min_capital_sep {
                    return true;
                }
            } else if d < buffer_radius {
                // Web: `else if (aIsCap || bIsCap) { d < bufferRadius } else if (d < bufferRadius)`.
                return true;
            }
        }
    }
    false
}

/// Web `enforceClusterBodySeparationOnKlastry` (`clusters.ts:2998`, prywatna): twarda bramka
/// sep brył - stolice >= `minCapitalSep`, MP >= bufor S/2 od obcych stolic.
#[allow(clippy::too_many_arguments)]
pub fn enforce_cluster_body_separation_on_klastry(
    klastry: &mut Vec<TypeCluster>,
    cluster_regions: &mut Vec<Vec<HexCoord>>,
    map: &GeneratedMap,
    rand: RandRef<'_>,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    s_cluster: f64,
    min_capital_sep: f64,
    min_dyst_obcy_od_gracza: i64,
    ladowe: &[HexCoord],
    land_cache: &MassLandCache,
    seed: u32,
    state_city_count: i64,
    map_center: PointF64,
    min_dyst_miasta_panstwa: i64,
    buffer_radius: f64,
    spread_gate_opts: Option<&SpreadGateOpts>,
) {
    if !s_cluster.is_finite() || s_cluster <= 0.0 {
        return;
    }
    let guard_mul = mapgen_cluster_layout()
        .straznicy
        .separacja_bryl_mnoznik
        .wartosc;

    let mut repaired = true;
    let mut guard = 0usize;
    while repaired && {
        let ok = guard < klastry.len() * guard_mul;
        guard += 1;
        ok
    } {
        repaired = false;

        'outer: for i in 0..klastry.len() {
            for j in (i + 1)..klastry.len() {
                if !body_violation(klastry, i, j, min_capital_sep, buffer_radius) {
                    continue;
                }

                let fix_ki = j;
                if cluster_regions
                    .get(fix_ki)
                    .is_none_or(std::vec::Vec::is_empty)
                {
                    drop_cluster(klastry, cluster_regions, fix_ki);
                    repaired = true;
                    break 'outer;
                }

                let mut prior_caps: Vec<HexCoord> = Vec::new();
                for (ki, k) in klastry.iter().enumerate() {
                    if ki == fix_ki {
                        continue;
                    }
                    if let Some(c) = cluster_capital_hex(k) {
                        prior_caps.push(c);
                    }
                }

                let player_cap = klastry.first().and_then(cluster_capital_hex);
                let anchor = anchor_for(fix_ki, player_cap, min_dyst_obcy_od_gracza);

                let foreign_bufs = foreign_buffers_for_cluster(klastry, fix_ki, buffer_radius);
                let new_cap = relocate_capital(
                    &mut cluster_regions[fix_ki],
                    map,
                    &mut *rand,
                    sea_dist,
                    min_sea_dist,
                    anchor,
                    &prior_caps,
                    min_capital_sep,
                    ladowe,
                    land_cache,
                    map_center,
                    fix_ki == 0,
                    spread_gate_opts,
                );
                let Some(new_cap) = new_cap else {
                    drop_cluster(klastry, cluster_regions, fix_ki);
                    repaired = true;
                    break 'outer;
                };

                let min_dist = if fix_ki == 0 {
                    min_dyst_miasta_panstwa
                } else {
                    min_dist_foreign_in_cluster()
                };
                let packed = pack_city_states_around_capital(
                    ladowe,
                    &cluster_regions[fix_ki],
                    new_cap,
                    state_city_count,
                    min_dist,
                    mix_seed(seed, fix_ki, KI_SEED_MUL),
                    &PackAroundCapitalOpts {
                        exclude_hex: Some(new_cap),
                        anchor,
                        foreign_buffers: &foreign_bufs,
                        half_plane_axis: if fix_ki == 0 {
                            Some(compute_same_type_rival_half_plane_axis(
                                new_cap, map_center, seed,
                            ))
                        } else {
                            None
                        },
                        ..PackAroundCapitalOpts::default()
                    },
                );
                {
                    let k = &mut klastry[fix_ki];
                    k.miasta = cities_from(new_cap, &packed.state_cities);
                    k.growth_slot = Some(packed.growth_slot);
                    if fix_ki == 0 {
                        k.pending_state_slots = Some(pack_rival_cities_around_core(
                            ladowe,
                            new_cap,
                            state_city_count,
                            min_dyst_miasta_panstwa,
                            seed,
                            Some(map_center),
                        ));
                    }
                }

                let conflicts = |klastry: &[TypeCluster]| -> bool {
                    (0..klastry.len()).any(|ki| {
                        ki != fix_ki
                            && body_violation(
                                klastry,
                                ki.min(fix_ki),
                                ki.max(fix_ki),
                                min_capital_sep,
                                buffer_radius,
                            )
                    })
                };
                if conflicts(klastry) {
                    // Zostaw tylko stolice - MP klastra naprawianego moga lamac bufor.
                    {
                        let k = &mut klastry[fix_ki];
                        k.miasta = vec![ClusterCity {
                            q: new_cap.q,
                            r: new_cap.r,
                            is_capital: true,
                        }];
                        k.pending_state_slots = Some(Vec::new());
                        k.growth_slot = Some(None);
                    }
                    // FALA 188: obetnij tez obce MP kolidujace z ta stolica (zamiast dropu civ).
                    for (ki, other) in klastry.iter_mut().enumerate() {
                        if ki == fix_ki {
                            continue;
                        }
                        let other_cap = cluster_capital_hex(other);
                        other.miasta.retain(|m| {
                            let mh = HexCoord::new(m.q, m.r);
                            if other_cap.is_some_and(|oc| same(mh, oc)) {
                                return true;
                            }
                            dist_hh(mh, new_cap) >= buffer_radius
                        });
                        if ki == 0 {
                            let slots = other.pending_state_slots.take().unwrap_or_default();
                            other.pending_state_slots = Some(
                                slots
                                    .into_iter()
                                    .filter(|s| dist_hh(*s, new_cap) >= buffer_radius)
                                    .collect(),
                            );
                        }
                    }
                    let mut still_cap_conflict = conflicts(klastry);
                    if still_cap_conflict {
                        // Ostatnia proba: globalny relocate z soft sea, bez dropu od razu.
                        let last_try = pick_spawn_hex_with_capital_gates(
                            map,
                            ladowe,
                            land_cache,
                            map_center,
                            &mut *rand,
                            &gate_opts(
                                sea_dist,
                                min_sea_dist,
                                &prior_caps,
                                min_capital_sep,
                                false,
                                fix_ki == 0,
                                spread_gate_opts,
                            ),
                        );
                        if let Some(lt) = last_try {
                            klastry[fix_ki].miasta = vec![ClusterCity {
                                q: lt.q,
                                r: lt.r,
                                is_capital: true,
                            }];
                            still_cap_conflict = conflicts(klastry);
                        }
                        if still_cap_conflict {
                            drop_cluster(klastry, cluster_regions, fix_ki);
                        }
                    }
                }
                repaired = true;
                break 'outer;
            }
        }
    }
}

// ---------------------------------------------------------------------------------------------
// clusters.ts:3236-3356 - wyrownanie cwiartek na faktycznych stolicach
// ---------------------------------------------------------------------------------------------

/// Web `enforceQuarterSpreadOnKlastry` (`clusters.ts:3240`, prywatna).
#[allow(clippy::too_many_arguments)]
pub fn enforce_quarter_spread_on_klastry(
    klastry: &mut [TypeCluster],
    cluster_regions: &[Vec<HexCoord>],
    map: &GeneratedMap,
    land_cache: &MassLandCache,
    ladowe: &[HexCoord],
    land_bbox: &LandBBox,
    n_needed: i64,
    rand: RandRef<'_>,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    min_capital_sep: f64,
    min_dyst_obcy_od_gracza: i64,
    seed: u32,
    state_city_count: i64,
    map_center: PointF64,
    min_dyst_miasta_panstwa: i64,
    body_buffer_radius: f64,
) {
    let q = &mapgen_cluster_layout().cwiartki;
    if n_needed < q.wyrownanie_min_typow.wartosc
        || klastry.len() < q.wyrownanie_min_klastrow.wartosc
    {
        return;
    }
    let required = minimum_spread_quarters_required(n_needed);
    let mid_q = (land_bbox.min_q + land_bbox.max_q) / 2.0;
    let mid_r = (land_bbox.min_r + land_bbox.max_r) / 2.0;
    let spread_gate = SpreadGateOpts {
        land_bbox: *land_bbox,
        spread_n: n_needed,
    };

    for _iter in 0..q.wyrownanie_max_iteracji.wartosc {
        let mut caps: Vec<(HexCoord, usize)> = Vec::new();
        for (ki, k) in klastry.iter().enumerate() {
            if let Some(c) = cluster_capital_hex(k) {
                caps.push((c, ki));
            }
        }
        if caps.len() < q.wyrownanie_min_klastrow.wartosc {
            break;
        }

        let centers: Vec<HexCoord> = caps.iter().map(|c| c.0).collect();
        let spread = cluster_center_quadrant_spread(&centers, land_bbox);
        if spread.occupied_quadrants >= required {
            break;
        }

        let counts = count_centers_per_quadrant(&centers, mid_q, mid_r);
        let mut relocate_ki: Option<usize> = None;
        let mut max_load: i64 = -1;
        for c in &caps {
            let quad = land_quadrant_index(c.0.q, c.0.r, mid_q, mid_r);
            if counts[quad] as i64 > max_load {
                max_load = counts[quad] as i64;
                relocate_ki = Some(c.1);
            }
        }
        let Some(relocate_ki) = relocate_ki else {
            break;
        };
        if max_load <= q.wyrownanie_min_obciazenie.wartosc as i64 {
            break;
        }

        let prior_caps: Vec<HexCoord> = caps
            .iter()
            .filter(|c| c.1 != relocate_ki)
            .map(|c| c.0)
            .collect();
        let player_cap = caps.iter().find(|c| c.1 == 0).map(|c| c.0);
        let anchor = anchor_for(relocate_ki, player_cap, min_dyst_obcy_od_gracza);
        let region: &[HexCoord] = cluster_regions
            .get(relocate_ki)
            .map_or(ladowe, Vec::as_slice);

        let mut new_cap = pick_spawn_hex_with_capital_gates(
            map,
            ladowe,
            land_cache,
            map_center,
            &mut *rand,
            &gate_opts(
                sea_dist,
                min_sea_dist,
                &prior_caps,
                min_capital_sep,
                true,
                relocate_ki == 0,
                Some(&spread_gate),
            ),
        );
        if new_cap.is_none() {
            new_cap = pick_spawn_hex_with_capital_gates(
                map,
                ladowe,
                land_cache,
                map_center,
                &mut *rand,
                &gate_opts(
                    sea_dist,
                    min_sea_dist,
                    &prior_caps,
                    min_capital_sep,
                    false,
                    relocate_ki == 0,
                    Some(&spread_gate),
                ),
            );
        }
        let Some(new_cap) = new_cap else {
            break;
        };

        let new_quad = land_quadrant_index(new_cap.q, new_cap.r, mid_q, mid_r);
        let old_cap = caps
            .iter()
            .find(|c| c.1 == relocate_ki)
            .map(|c| c.0)
            .expect("stolica relokowanego klastra");
        let old_quad = land_quadrant_index(old_cap.q, old_cap.r, mid_q, mid_r);
        let mut with_new = prior_caps.clone();
        with_new.push(new_cap);
        let new_spread = cluster_center_quadrant_spread(&with_new, land_bbox);
        if new_spread.occupied_quadrants <= spread.occupied_quadrants && counts[new_quad] != 0 {
            break;
        }
        if new_quad == old_quad && counts[old_quad] <= q.wyrownanie_min_obciazenie.wartosc {
            break;
        }

        let min_dist = if relocate_ki == 0 {
            min_dyst_miasta_panstwa
        } else {
            min_dist_foreign_in_cluster()
        };
        let foreign_bufs = foreign_buffers_for_cluster(klastry, relocate_ki, body_buffer_radius);
        let packed = pack_city_states_around_capital(
            ladowe,
            if region.is_empty() { ladowe } else { region },
            new_cap,
            state_city_count,
            min_dist,
            mix_seed(seed, relocate_ki, KI_SEED_MUL),
            &PackAroundCapitalOpts {
                exclude_hex: Some(new_cap),
                anchor,
                foreign_buffers: &foreign_bufs,
                ..PackAroundCapitalOpts::default()
            },
        );
        let k = &mut klastry[relocate_ki];
        k.miasta = cities_from(new_cap, &packed.state_cities);
        k.centrum = new_cap;
        k.growth_slot = Some(packed.growth_slot);
        if relocate_ki == 0 {
            k.pending_state_slots = Some(pack_rival_cities_around_core(
                ladowe,
                new_cap,
                state_city_count,
                min_dyst_miasta_panstwa,
                seed,
                Some(map_center),
            ));
        }
    }
}
