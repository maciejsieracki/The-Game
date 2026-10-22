//! P6.M09 - minimalny wycinek rywali klastra. Temat wlasciciel: R-RUSTPORT-P6-M09-KLASTRY-RYWALE-MIN-Q1.
//! Zakres web (P6-25 §6): cluster-spawn.ts (wycinek rywali), clusters.ts (wycinek rywali i stale).
//!
//! Port 1:1 (pin web `edb8fb56`) tych deklaracji `gra/src/map/clusters.ts` i
//! `gra/src/map/cluster-spawn.ts`, ktore domyka `buildSameTypeRivalSlots`,
//! `buildSameTypeRivalCandidateHexes` i `groupForeignTypeClusters` (P6.1C RUNDA-2):
//! rozmieszczenie miast-panstw tego samego typu wokol stolicy gracza (lancuch hubow,
//! polplaszczyzna, najblizszy legalny lad, ponowienia ziaren).
//!
//! Zalozenia domeny wejsc (jak w grze; zapisane w `P6-M09-KLASTRY-RYWALE-MIN.md` §5):
//! - ziarno `seed` jest liczba `0..=2^32-1` (`u32`); web robi `>>> 0` / `% 6` na ziarnie
//!   nieujemnym, wiec to ta sama domena (ujemne ziarno w webie psuje `HEX_DIRECTIONS[...]`);
//! - liczniki i odstepy (`count`, `min_dist`, `ring_dist`) sa liczbami calkowitymi (`i64`);
//! - wspolrzedne hexow to calkowite `i32`; srodek mapy i os polplaszczyzny sa `f64`
//!   (srodek mapy bywa polowkowy: `(szerokosc - 1) / 2`).
//!
//! Stale balansowe: `data/derived/mapgen-cluster-rivals.json` (edytowalne). Stale
//! ALGORYTMICZNE (xor/przesuniecia ziaren) to nazwane `const` ponizej z odnosnikiem do weba.
//! Powtarzane z webu uzycia `mulberry32`, `HEX_DIRECTIONS` i `hexDistanceAxial` korzystaja z
//! gotowych odpowiednikow w Rust (`rng::Mulberry32`, `HexCoord::neighbors`, `HexCoord::distance`).

use std::collections::HashSet;

use crate::data::derived::mapgen_cluster_rivals;
use crate::domain::city_names::CityNamesPoolsData;
use crate::domain::civ_names::{cluster_rival_city_name, player_start_city_name, CivNamesDef};
use crate::domain::hex::HexCoord;
use crate::domain::map_generator::GeneratedMap;
use crate::domain::rng::Mulberry32;
use crate::domain::start_position::{
    land_hexes_from_terrain, ClusterSpawnSlot, ForeignTypeClusterGroup,
};
use crate::domain::PlayerId;

/// `clusters.ts:1927` (`mulberry32((seed ^ 0x9e3779b9) >>> 0)`): maska ziarna lancucha hubow.
const HUB_CHAIN_SEED_XOR: u32 = 0x9e37_79b9;
/// `clusters.ts:2075-2078`: przesuniecia ziarna w kolejnych ponowieniach pakowania
/// (`(seed + C) >>> 0`; pierwsze ponowienie uzywa samego `seed`).
const RETRY_SEED_ADDS: [u32; 3] = [0x517c_c1b7, 0x85eb_ca6b, 0xc2b2_ae35];

/// Punkt o wspolrzednych rzeczywistych (web `{ q: number; r: number }` dla srodka mapy).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PointF64 {
    pub q: f64,
    pub r: f64,
}

/// Web `SameTypeRivalHalfPlaneAxis` (`clusters.ts:1870`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SameTypeRivalHalfPlaneAxis {
    pub dq: f64,
    pub dr: f64,
}

/// Web `ForeignClusterBuffer` (`clusters.ts:1538`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ForeignClusterBuffer {
    pub q: i32,
    pub r: i32,
    pub radius: f64,
}

/// Web `anchor?: { q, r, minDist }` z opcji pakowania.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct AnchorHex {
    pub q: i32,
    pub r: i32,
    pub min_dist: i64,
}

/// Web `opts` funkcji `packCityStatesHubChain` (`clusters.ts:1918-1924`).
#[derive(Debug, Clone, Copy, Default)]
pub struct HubChainOpts<'a> {
    pub exclude_hex: Option<HexCoord>,
    pub anchor: Option<AnchorHex>,
    pub half_plane_axis: Option<SameTypeRivalHalfPlaneAxis>,
    pub foreign_buffers: &'a [ForeignClusterBuffer],
}

/// Web `opts` funkcji `packCityStatesAroundCapital` (`clusters.ts:2044-2053`).
#[derive(Debug, Clone, Copy, Default)]
pub struct PackAroundCapitalOpts<'a> {
    pub exclude_hex: Option<HexCoord>,
    pub anchor: Option<AnchorHex>,
    pub growth_reserve: Option<i64>,
    pub half_plane_axis: Option<SameTypeRivalHalfPlaneAxis>,
    pub foreign_buffers: &'a [ForeignClusterBuffer],
    /// `ringDistances?.length ? [...] : [MAX_HEX]` - pusta lub brak = domyslny pierscien.
    pub ring_distances: Option<&'a [i64]>,
}

/// Wynik `packCityStatesAroundCapital`: `{ stateCities, growthSlot }`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PackedCityStates {
    pub state_cities: Vec<HexCoord>,
    pub growth_slot: Option<HexCoord>,
}

fn dist(a: HexCoord, b: HexCoord) -> i64 {
    i64::from(a.distance(b))
}

fn same(a: HexCoord, b: HexCoord) -> bool {
    a.q == b.q && a.r == b.r
}

// --- stale (clusters.ts:38-58) -------------------------------------------------------------

/// Web `CLUSTER_CITY_STATE_MIN_HEX` (`clusters.ts:42`).
pub fn cluster_city_state_min_hex() -> i64 {
    mapgen_cluster_rivals()
        .promien_miasta_panstwa_min_hex
        .wartosc
}

/// Web `CLUSTER_CITY_STATE_MAX_HEX` (`clusters.ts:47`).
pub fn cluster_city_state_max_hex() -> i64 {
    mapgen_cluster_rivals()
        .promien_miasta_panstwa_max_hex
        .wartosc
}

/// Web `MIN_DIST_START_CITY_STATE` (`clusters.ts:49`) = alias `CLUSTER_CITY_STATE_MIN_HEX`.
/// UWAGA: to NIE jest `min_city_distance_start_city_state` (=3, `cities.ts:1122`).
pub fn min_dist_start_city_state() -> i64 {
    cluster_city_state_min_hex()
}

/// Web `MIN_DIST_FOREIGN_FROM_PLAYER` (`clusters.ts:54`).
pub fn min_dist_foreign_from_player() -> i64 {
    mapgen_cluster_rivals().min_dystans_obce_od_gracza.wartosc
}

/// Web `MIN_DIST_FOREIGN_IN_CLUSTER` (`clusters.ts:56`) = alias `MIN_DIST_START_CITY_STATE`.
pub fn min_dist_foreign_in_cluster() -> i64 {
    min_dist_start_city_state()
}

/// Web `CLUSTER_GROWTH_RESERVE` (`clusters.ts:58`).
pub fn cluster_growth_reserve() -> i64 {
    mapgen_cluster_rivals().rezerwa_wzrostu_klastra.wartosc
}

// --- narzedzia ------------------------------------------------------------------------------

/// Web `shuffleInPlace` (`clusters.ts:168`): Fisher-Yates od konca, `floor(rand() * (i + 1))`.
pub fn shuffle_in_place<T>(arr: &mut [T], rand: &mut Mulberry32) {
    let mut i = arr.len();
    while i > 1 {
        i -= 1;
        let j = (rand.next_f64() * ((i + 1) as f64)).floor() as usize;
        arr.swap(i, j);
    }
}

/// Web `clusterPackRadius` (`clusters.ts:1347`).
pub fn cluster_pack_radius(max_miast: i64, min_dist: i64) -> i64 {
    let p = &mapgen_cluster_rivals().pakowanie;
    let rings = p
        .min_pierscieni
        .wartosc
        .max(((max_miast.max(1) as f64).sqrt() * p.wspolczynnik_pierscieni.wartosc).ceil() as i64);
    (min_dist * p.min_promien_w_odstepach.wartosc).max(rings * min_dist)
}

/// Web `passesForeignClusterBufferGate` (`clusters.ts:1544`).
pub fn passes_foreign_cluster_buffer_gate(h: HexCoord, buffers: &[ForeignClusterBuffer]) -> bool {
    for b in buffers {
        if (dist(h, HexCoord::new(b.q, b.r)) as f64) < b.radius {
            return false;
        }
    }
    true
}

/// Web `landPoolNearCore` (`clusters.ts:1771`, prywatna): pola lade w promieniu od rdzenia,
/// posortowane od najblizszych (`d`, potem `q`, potem `r`; sortowanie stabilne).
pub fn land_pool_near_core(
    region: &[HexCoord],
    centrum: HexCoord,
    max_miast: i64,
    min_dist: i64,
    max_radius: Option<i64>,
) -> Vec<HexCoord> {
    let params = &mapgen_cluster_rivals().pakowanie;
    let pack_r = max_radius.unwrap_or_else(|| cluster_pack_radius(max_miast, min_dist));
    let mut near: Vec<(HexCoord, i64)> = region
        .iter()
        .map(|c| (*c, dist(*c, centrum)))
        .filter(|(_, d)| *d <= pack_r)
        .collect();
    near.sort_by(|a, b| {
        a.1.cmp(&b.1)
            .then(a.0.q.cmp(&b.0.q))
            .then(a.0.r.cmp(&b.0.r))
    });
    let mut near: Vec<HexCoord> = near.into_iter().map(|x| x.0).collect();
    if near.len() as i64 >= max_miast {
        return near;
    }
    // Twardy limit klastra miast-panstw - bez rozszerzania poza maxRadius.
    if max_radius.is_some() {
        return if near.is_empty() {
            region.to_vec()
        } else {
            near
        };
    }
    // Za malo pol w pierwszym pierscieniu - rozszerz promien stopniowo (legacy / obce typy).
    let mut expanded = pack_r + min_dist;
    while (near.len() as i64) < max_miast
        && expanded <= pack_r + min_dist * params.rozszerzenie_max_krokow_w_odstepach.wartosc
    {
        for c in region {
            if near.iter().any(|p| same(*p, *c)) {
                continue;
            }
            if dist(*c, centrum) <= expanded {
                near.push(*c);
            }
            if near.len() as i64 >= max_miast * params.pula_max_mnoznik.wartosc {
                break;
            }
        }
        expanded += min_dist;
    }
    if near.is_empty() {
        region.to_vec()
    } else {
        near
    }
}

/// Web `hexesAtDistance` (`clusters.ts:1848`, prywatna): UWAGA - to NIE jest scisly pierscien;
/// frontier po `dist` krokach z deduplikacja tylko w obrebie kroku (obejmuje takze bliskie hexy).
pub fn hexes_at_distance(q: i32, r: i32, dist: i64) -> Vec<HexCoord> {
    if dist <= 0 {
        return vec![HexCoord::new(q, r)];
    }
    let mut frontier = vec![HexCoord::new(q, r)];
    for _ in 0..dist {
        let mut next: Vec<HexCoord> = Vec::new();
        let mut seen: HashSet<(i32, i32)> = HashSet::new();
        for h in &frontier {
            for n in h.neighbors() {
                if !seen.insert((n.q, n.r)) {
                    continue;
                }
                next.push(n);
            }
        }
        frontier = next;
    }
    frontier
}

// --- polplaszczyzna (clusters.ts:1869-1904) --------------------------------------------------

/// Web `computeSameTypeRivalHalfPlaneAxis` (`clusters.ts:1879`).
pub fn compute_same_type_rival_half_plane_axis(
    capital: HexCoord,
    map_center: PointF64,
    seed: u32,
) -> SameTypeRivalHalfPlaneAxis {
    let dq = map_center.q - f64::from(capital.q);
    let dr = map_center.r - f64::from(capital.r);
    let len_sq = dq * dq + dr * dr;
    if len_sq
        < mapgen_cluster_rivals()
            .polplaszczyzna
            .prog_dlugosci_kw
            .wartosc
    {
        let dirs = HexCoord::new(0, 0).neighbors();
        let dir = dirs[(seed as usize) % dirs.len()];
        return SameTypeRivalHalfPlaneAxis {
            dq: f64::from(dir.q),
            dr: f64::from(dir.r),
        };
    }
    SameTypeRivalHalfPlaneAxis { dq, dr }
}

/// Web `isInSameTypeRivalHalfPlane` (`clusters.ts:1895`); `margin = None` => domyslny z tabeli.
pub fn is_in_same_type_rival_half_plane(
    hex: HexCoord,
    capital: HexCoord,
    axis: SameTypeRivalHalfPlaneAxis,
    margin: Option<f64>,
) -> bool {
    let margin = margin.unwrap_or(mapgen_cluster_rivals().polplaszczyzna.margines.wartosc);
    let vq = f64::from(hex.q - capital.q);
    let vr = f64::from(hex.r - capital.r);
    vq * axis.dq + vr * axis.dr >= margin
}

// --- pakowanie miast-panstw (clusters.ts:1906-2165) -------------------------------------------

/// Web `packCityStatesHubChain` (`clusters.ts:1911`).
#[allow(clippy::too_many_arguments)]
pub fn pack_city_states_hub_chain(
    land_hexes: &[HexCoord],
    core: HexCoord,
    count: i64,
    min_sep: i64,
    ring_dist: i64,
    seed: u32,
    opts: &HubChainOpts<'_>,
) -> Vec<HexCoord> {
    if count <= 0 {
        return Vec::new();
    }
    let mut rand = Mulberry32::new(seed ^ HUB_CHAIN_SEED_XOR);
    let mut placed: Vec<HexCoord> = Vec::new();
    let exclude = opts.exclude_hex.unwrap_or(core);
    let land_set: HashSet<(i32, i32)> = land_hexes.iter().map(|h| (h.q, h.r)).collect();

    let valid_candidate = |h: HexCoord, hub: HexCoord, placed: &[HexCoord]| -> bool {
        if !land_set.contains(&(h.q, h.r)) {
            return false;
        }
        if let Some(axis) = opts.half_plane_axis {
            if !is_in_same_type_rival_half_plane(h, core, axis, None) {
                return false;
            }
        }
        if same(h, exclude) {
            return false;
        }
        if !passes_foreign_cluster_buffer_gate(h, opts.foreign_buffers) {
            return false;
        }
        if dist(h, hub) != ring_dist {
            return false;
        }
        if dist(h, core) < min_sep {
            return false;
        }
        if let Some(a) = opts.anchor {
            if dist(h, HexCoord::new(a.q, a.r)) < a.min_dist {
                return false;
            }
        }
        if placed.iter().any(|p| same(*p, h)) {
            return false;
        }
        placed.iter().all(|p| dist(h, *p) >= min_sep)
    };

    let mut hub_queue: Vec<HexCoord> = vec![core];
    let mut hub_idx = 0usize;

    while (placed.len() as i64) < count && hub_idx < hub_queue.len() {
        let hub = hub_queue[hub_idx];
        hub_idx += 1;
        // Jedno MP na iteracje - valid_candidate musi widziec aktualne `placed`.
        while (placed.len() as i64) < count {
            let mut cands: Vec<HexCoord> = hexes_at_distance(hub.q, hub.r, ring_dist)
                .into_iter()
                .filter(|h| valid_candidate(*h, hub, &placed))
                .collect();
            if cands.is_empty() {
                break;
            }
            shuffle_in_place(&mut cands, &mut rand);
            cands.sort_by(|a, b| a.q.cmp(&b.q).then(a.r.cmp(&b.r)));
            let c = cands[0];
            placed.push(c);
            hub_queue.push(c);
        }
    }

    placed
}

/// Web `opts` funkcji `packNearestLegalLand` (`clusters.ts:1982-1987`); `exclude_hex` wymagane.
#[derive(Debug, Clone, Copy)]
pub struct NearestLegalLandOpts<'a> {
    pub exclude_hex: HexCoord,
    pub anchor: Option<AnchorHex>,
    pub half_plane_axis: Option<SameTypeRivalHalfPlaneAxis>,
    pub foreign_buffers: &'a [ForeignClusterBuffer],
}

/// Web `packNearestLegalLand` (`clusters.ts:1975`, prywatna).
pub fn pack_nearest_legal_land(
    land_hexes: &[HexCoord],
    core: HexCoord,
    count: i64,
    min_sep: i64,
    initial: &[HexCoord],
    opts: &NearestLegalLandOpts<'_>,
) -> Vec<HexCoord> {
    let take = (count.max(0) as usize).min(initial.len());
    let mut placed: Vec<HexCoord> = initial[..take].to_vec();
    let exclude = opts.exclude_hex;

    struct Cand {
        h: HexCoord,
        preferred: bool,
        hub_distance: i64,
        core_distance: i64,
    }

    while (placed.len() as i64) < count {
        let mut candidates: Vec<Cand> = land_hexes
            .iter()
            .copied()
            .filter(|h| {
                if same(*h, exclude) {
                    return false;
                }
                if let Some(a) = opts.anchor {
                    if dist(*h, HexCoord::new(a.q, a.r)) < a.min_dist {
                        return false;
                    }
                }
                if !passes_foreign_cluster_buffer_gate(*h, opts.foreign_buffers) {
                    return false;
                }
                if dist(*h, core) < min_sep {
                    return false;
                }
                placed.iter().all(|p| dist(*h, *p) >= min_sep)
            })
            .map(|h| {
                let core_distance = dist(h, core);
                let hub_distance = placed
                    .iter()
                    .map(|p| dist(h, *p))
                    .fold(core_distance, i64::min);
                Cand {
                    h,
                    preferred: match opts.half_plane_axis {
                        Some(axis) => is_in_same_type_rival_half_plane(h, core, axis, None),
                        None => false,
                    },
                    hub_distance,
                    core_distance,
                }
            })
            .collect();
        candidates.sort_by(|a, b| {
            i64::from(b.preferred)
                .cmp(&i64::from(a.preferred))
                .then(a.hub_distance.cmp(&b.hub_distance))
                .then(a.core_distance.cmp(&b.core_distance))
                .then(a.h.q.cmp(&b.h.q))
                .then(a.h.r.cmp(&b.h.r))
        });
        match candidates.first() {
            Some(next) => placed.push(next.h),
            None => break,
        }
    }

    placed
}

/// Web `packCityStatesAroundCapital` (`clusters.ts:2036`).
#[allow(clippy::too_many_arguments)]
pub fn pack_city_states_around_capital(
    all_land: &[HexCoord],
    region: &[HexCoord],
    capital: HexCoord,
    state_city_count: i64,
    min_dist: i64,
    seed: u32,
    opts: &PackAroundCapitalOpts<'_>,
) -> PackedCityStates {
    if state_city_count <= 0 {
        return PackedCityStates {
            state_cities: Vec::new(),
            growth_slot: None,
        };
    }
    let growth_reserve = opts.growth_reserve.unwrap_or_else(cluster_growth_reserve);
    let total_pack = state_city_count + growth_reserve;
    let exclude_hex = opts.exclude_hex.unwrap_or(capital);
    let hub_opts = HubChainOpts {
        exclude_hex: Some(exclude_hex),
        anchor: opts.anchor,
        half_plane_axis: opts.half_plane_axis,
        foreign_buffers: opts.foreign_buffers,
    };
    let nearest_opts = NearestLegalLandOpts {
        exclude_hex,
        anchor: opts.anchor,
        half_plane_axis: opts.half_plane_axis,
        foreign_buffers: opts.foreign_buffers,
    };
    let expanded_r = cluster_pack_radius(total_pack, min_dist)
        * mapgen_cluster_rivals()
            .pakowanie
            .rozszerzony_promien_mnoznik
            .wartosc;

    let mut pools: Vec<Vec<HexCoord>> = Vec::new();
    let near_region = land_pool_near_core(region, capital, total_pack, min_dist, None);
    let near_region_len = near_region.len();
    pools.push(near_region);
    let near_expanded =
        land_pool_near_core(region, capital, total_pack, min_dist, Some(expanded_r));
    let near_expanded_len = near_expanded.len();
    if near_expanded_len > near_region_len {
        pools.push(near_expanded);
    }
    if all_land.len() > near_expanded_len {
        pools.push(all_land.to_vec());
    }

    let seeds = [
        seed,
        seed.wrapping_add(RETRY_SEED_ADDS[0]),
        seed.wrapping_add(RETRY_SEED_ADDS[1]),
        seed.wrapping_add(RETRY_SEED_ADDS[2]),
    ];

    // Zadany minimalny odstep jest twardym kontraktem (web: `minDistLevels = [minDist]`).
    let min_dist_levels = [min_dist];

    let default_rings = [cluster_city_state_max_hex()];
    let ring_distances: &[i64] = match opts.ring_distances {
        Some(rd) if !rd.is_empty() => rd,
        _ => &default_rings,
    };

    let mut best: Vec<HexCoord> = Vec::new();
    'rings: for &ring_dist in ring_distances {
        for &try_min_dist in &min_dist_levels {
            let sep = try_min_dist;
            for pool in &pools {
                for &s in &seeds {
                    let packed = pack_city_states_hub_chain(
                        pool, capital, total_pack, sep, ring_dist, s, &hub_opts,
                    );
                    if packed.len() > best.len() {
                        best = packed;
                    }
                    if best.len() as i64 >= state_city_count {
                        break;
                    }
                }
                if best.len() as i64 >= state_city_count {
                    break;
                }
            }
            if best.len() as i64 >= state_city_count {
                break;
            }
        }
        if best.len() as i64 >= state_city_count {
            break 'rings;
        }
    }

    // Dokladne pierscienie sa preferowane, ale zablokowany pierscien nie moze po cichu wymazac
    // zadanych slotow: uzupelnij prefiks najblizszym legalnym ladem (twardy minimalny odstep).
    if (best.len() as i64) < total_pack {
        for pool in pools
            .iter()
            .map(Vec::as_slice)
            .chain(std::iter::once(all_land))
        {
            let nearest =
                pack_nearest_legal_land(pool, capital, total_pack, min_dist, &best, &nearest_opts);
            if nearest.len() > best.len() {
                best = nearest;
            }
            if best.len() as i64 >= total_pack {
                break;
            }
        }
    }

    let count = state_city_count as usize;
    let growth_slot = if best.len() > count {
        Some(best[count])
    } else {
        None
    };
    best.truncate(count);
    PackedCityStates {
        state_cities: best,
        growth_slot,
    }
}

/// Web `packRivalCitiesAroundCore` (`clusters.ts:2144`).
pub fn pack_rival_cities_around_core(
    land_hexes: &[HexCoord],
    core: HexCoord,
    rival_count: i64,
    min_dist: i64,
    seed: u32,
    map_center: Option<PointF64>,
) -> Vec<HexCoord> {
    if rival_count <= 0 {
        return Vec::new();
    }
    let half_plane_axis =
        map_center.map(|center| compute_same_type_rival_half_plane_axis(core, center, seed));
    pack_city_states_around_capital(
        land_hexes,
        land_hexes,
        core,
        rival_count,
        min_dist,
        seed,
        &PackAroundCapitalOpts {
            exclude_hex: Some(core),
            growth_reserve: Some(0),
            half_plane_axis,
            ..PackAroundCapitalOpts::default()
        },
    )
    .state_cities
}

// --- cluster-spawn.ts (wycinek rywali) ---------------------------------------------------------

/// Web `landHexesFromMap` (`cluster-spawn.ts:71`): DANE-JUZ-W-RUST jako
/// `start_position::land_hexes_from_terrain`; tu cienki adapter na `GeneratedMap` (kolejnosc
/// kafli mapy = kolejnosc `Object.values(map.hexes)`).
pub fn land_hexes_from_game_map(map: &GeneratedMap) -> Vec<HexCoord> {
    land_hexes_from_terrain(
        map.tiles
            .iter()
            .map(|t| (HexCoord::new(t.coord.q, t.coord.r), t.terrain)),
    )
}

/// Web `mapCenterFromGameMap` (`cluster-spawn.ts:81`): `((szerokoscQ - 1) / 2, (wysokoscR - 1) / 2)`.
pub fn map_center_from_game_map(map: &GeneratedMap) -> PointF64 {
    PointF64 {
        q: (f64::from(map.width) - 1.0) / 2.0,
        r: (f64::from(map.height) - 1.0) / 2.0,
    }
}

/// Web `buildSameTypeRivalSlots` (`cluster-spawn.ts:91`).
#[allow(clippy::too_many_arguments)]
pub fn build_same_type_rival_slots(
    map: &GeneratedMap,
    civs: &[CivNamesDef],
    core: HexCoord,
    player_typ: &str,
    rival_count: i64,
    seed: u32,
    first_owner_id: PlayerId,
    pools: Option<&CityNamesPoolsData>,
) -> Vec<ClusterSpawnSlot> {
    if rival_count <= 0 {
        return Vec::new();
    }
    let positions = pack_rival_cities_around_core(
        &land_hexes_from_game_map(map),
        core,
        rival_count,
        min_dist_start_city_state(),
        seed,
        Some(map_center_from_game_map(map)),
    );
    let mut slots: Vec<ClusterSpawnSlot> = Vec::new();
    let mut used_names: HashSet<String> = HashSet::new();
    let own = player_start_city_name(civs, player_typ, pools, Some(&used_names));
    used_names.insert(own);
    // Web: `ownerId++` po kazdym slocie => kolejne numery od `firstOwnerId`.
    for ((idx, pos), owner_id) in positions.iter().enumerate().zip(first_owner_id.get()..) {
        let nazwa_miasta =
            cluster_rival_city_name(civs, player_typ, (idx + 1) as i64, pools, Some(&used_names));
        used_names.insert(nazwa_miasta.clone());
        slots.push(ClusterSpawnSlot {
            owner_id: PlayerId::new(owner_id),
            hex: *pos,
            city_name: nazwa_miasta,
            typ: player_typ.to_owned(),
            is_same_type_rival: true,
            is_player_capital: false,
            is_cluster_capital: None,
        });
    }
    slots
}

/// Web `buildSameTypeRivalCandidateHexes` (`cluster-spawn.ts:140`).
pub fn build_same_type_rival_candidate_hexes(
    map: &GeneratedMap,
    core: HexCoord,
    rival_count: i64,
    seed: u32,
) -> Vec<HexCoord> {
    if rival_count <= 0 {
        return Vec::new();
    }
    let land = land_hexes_from_game_map(map);
    let min_dist = min_dist_start_city_state();
    let map_center = map_center_from_game_map(map);
    pack_city_states_around_capital(
        &land,
        &land,
        core,
        rival_count,
        min_dist,
        seed,
        &PackAroundCapitalOpts {
            exclude_hex: Some(core),
            growth_reserve: Some(0),
            half_plane_axis: Some(compute_same_type_rival_half_plane_axis(
                core, map_center, seed,
            )),
            ..PackAroundCapitalOpts::default()
        },
    )
    .state_cities
}

/// Web `groupForeignTypeClusters` (`cluster-spawn.ts:195`): grupuje sloty obcych typow wg `typ`
/// (kolejnosc grup = kolejnosc pierwszego wystapienia, jak wstawianie do `Map`).
pub fn group_foreign_type_clusters(slots: &[ClusterSpawnSlot]) -> Vec<ForeignTypeClusterGroup> {
    let mut groups: Vec<ForeignTypeClusterGroup> = Vec::new();
    for slot in slots {
        if slot.is_same_type_rival {
            continue;
        }
        let idx = match groups.iter().position(|g| g.typ == slot.typ) {
            Some(i) => i,
            None => {
                groups.push(ForeignTypeClusterGroup {
                    typ: slot.typ.clone(),
                    owner_ids: Vec::new(),
                    positions: Vec::new(),
                });
                groups.len() - 1
            }
        };
        groups[idx].owner_ids.push(slot.owner_id);
        groups[idx].positions.push(slot.hex);
    }
    groups
}
