//! P6.M12 - klastry: compute i plan spawnu. Temat wlasciciel: R-RUSTPORT-P6-M12-KLASTRY-COMPUTE-SPAWN-PLAN-Q1.
//! Zakres web (P6-25 §6): cluster-spawn.ts:54-69, 166-188, 210-445, clusters.ts:127-144, 3362-4250.
//!
//! Port 1:1 (pin web `edb8fb56`) dwoch funkcji domykajacych mapgen klastrow:
//! - `computeClusters` (`gra/src/map/clusters.ts:3373-4250`) -> [`compute_clusters`]: rozmieszczenie
//!   klastrow typow cywilizacji na mapie (srodki na masach ladu, dominacja lokalnego ladu, przydzial
//!   typow, klaster gracza, klastry obce, dopelnienia, naprawy separacji i cwiartek) + typ wyniku
//!   `ClusterPlacement` (`:127-144`);
//! - `buildClusterSpawnPlan` (`gra/src/map/cluster-spawn.ts:210-445`) -> [`build_cluster_spawn_plan`]:
//!   plan spawnu (slot gracza, sloty obcych typow z nazwami, rezerwacje ownerId dla rywali tego
//!   samego typu) + typy `ClusterSpawnPlan` (`:54-69`) i `BuildClusterSpawnInput` (`:166-188`).
//!
//! Wszystkie funkcje pomocnicze `computeClusters` sa juz w Rust (M09 pakowanie miast-panstw, M10
//! masy/bramki/wybory srodkow, M11 uklad stolic i naprawy); ten modul je WOLA w kolejnosci weba i
//! przekazuje ten sam strumien `rand` (`mulberry32(seed)`), wiec liczba i kolejnosc wywolan `rand()`
//! jest czescia kontraktu. Jedyna zaleznosc spoza zakresow M09-M12 to `buildSeaDistanceField`
//! (`gen-helpers.ts:5614`), portowana TU jako [`build_sea_distance_field`] (zadne inne M* jej jeszcze
//! nie dostarczylo; patrz dokument P6-M12 §6).
//!
//! Zalozenia domeny wejsc (jak w M09-M11): `seed` jest `u32`; liczniki i odstepy (`rywaleNaKlaster`,
//! `minDystans`, `minDystansKlastrow`) sa liczbami calkowitymi (`i64`); wspolrzedne hexow `i32`.
//!
//! Zachowania weba odtworzone 1:1: regiony klastrow (`regiony[ci]`) sa TYMI SAMYMI tablicami co
//! `clusterRegions[ki]` - `pickCapitalHexInRegion` zmienia ich kolejnosc W MIEJSCU (M11 §6.1), wiec
//! region jest przenoszony (nie kopiowany) z `regiony` do `cluster_regions`. Gdzie web rzuca
//! `TypeError` port zwraca [`ClusterComputeError`]: [`ClusterComputeError::NoClusterCenters`]
//! (brak srodka klastra - w webie nieosiagalne) i [`ClusterComputeError::DiagnosticRegionMissing`]
//! (BLAD WEBA: dziennik diagnostyczny na koncu `computeClusters` czyta `regiony[ci]!.length` dla
//! klastra dopelnionego, ktory nie ma regionu Voronoi, i rzuca - zaobserwowane w 23 z 545 nagran).
//!
//! Stale balansowe: `data/derived/mapgen-cluster-compute.json` (edytowalne). Stale z zakresow M09-M11
//! czyta kod z ich tabel/funkcji. Stale ALGORYTMICZNE (maski i mnozniki ziaren, domyslne ziarno) to
//! nazwane `const` ponizej z odnosnikiem do weba.

use std::collections::{HashMap, HashSet, VecDeque};
use std::{error::Error, fmt};

use crate::data::civilizations::CivsFile;
use crate::data::derived::mapgen_cluster_compute;
use crate::domain::city_names::CityNamesPoolsData;
use crate::domain::civ_names::{
    civ_names_defs_from_file, cluster_rival_city_name, foreign_capital_city_name,
    player_start_city_name, CivNamesDef,
};
use crate::domain::hex::HexCoord;
use crate::domain::map_generator::{GeneratedMap, Terrain};
use crate::domain::mapgen::cluster_layout::{
    assign_types_to_cluster_centers, build_cluster_cities_with_land_gate,
    capital_min_sea_dist_for_map, capital_min_separation_for_map, cluster_body_buffer_radius,
    cluster_body_separation_for_map, cluster_capital_hex, cluster_capital_pos,
    cluster_center_placement_sep_for_map, enforce_cluster_body_separation_on_klastry,
    enforce_hard_capital_separation_on_klastry, enforce_local_land_dominance,
    enforce_quarter_spread_on_klastry, foreign_buffers_for_cluster,
    passes_min_capital_separation_gate, passes_min_sea_dist_gate,
    pick_spawn_hex_with_capital_gates, repack_all_sparse_cluster_state_cities,
    sea_dist_rescue_ladder, ClusterCitiesWithCentrum, PickSpawnHexOpts, SpreadGateOpts, HOOKS,
};
use crate::domain::mapgen::cluster_mass::{
    aktywne_typy_from_size, assign_voronoi_regions, create_mass_land_cache, map_size_label,
    passes_local_land_gate, passes_player_start_mass_gate, pick_player_cluster_center,
    place_cluster_centers_across_landmasses, reorder_roster_by_preference, roster_klucze,
    roster_klucze_for_start_epoch, ClusterCity, ClusterSpawnCache, LandBBox, MapBounds,
    MassLandCache, MassesOrCache, RandRef, SeaDist, TypeCluster,
};
use crate::domain::mapgen::cluster_rivals::{
    cluster_city_state_max_hex, cluster_growth_reserve, compute_same_type_rival_half_plane_axis,
    group_foreign_type_clusters, land_hexes_from_game_map, map_center_from_game_map,
    min_dist_foreign_from_player, min_dist_foreign_in_cluster, min_dist_start_city_state,
    pack_city_states_around_capital, pack_rival_cities_around_core, shuffle_in_place, AnchorHex,
    PackAroundCapitalOpts, PointF64,
};
use crate::domain::mapgen::params::MapSizeLabel;
use crate::domain::mapgen::prims::{is_water_terrain_local, HEX_DIRECTIONS};
use crate::domain::rng::Mulberry32;
use crate::domain::start_position::{
    ClusterSpawnPlan as StartClusterSpawnPlan, ClusterSpawnSlot, ForeignTypeClusterGroup,
};
use crate::domain::unit_epoch::CivEntryRow;
use crate::domain::PlayerId;

/// Domyslne ziarno `computeClusters` (`opts?.seed ?? 42`, `clusters.ts:3396`). Stala algorytmiczna.
const DEFAULT_SEED: u32 = 42;
/// Mnoznik ziarna per indeks klastra: `(seed + ci * 0x9e3779b1) >>> 0` (`clusters.ts:3972`).
const KI_SEED_MUL: u32 = 0x9e37_79b1;
/// Maska ziarna wyboru hexu gracza: `mulberry32(seed ^ 0xca041a01)` (`cluster-spawn.ts:283`).
const PLAYER_CAP_SEED_XOR: u32 = 0xca04_1a01;
/// Maska ziarna drugiej proby: `mulberry32(seed ^ 0xca041a02)` (`cluster-spawn.ts:304`).
const PLAYER_CAP_RETRY_SEED_XOR: u32 = 0xca04_1a02;

// ---------------------------------------------------------------------------------------------
// Typy (clusters.ts:127-144, cluster-spawn.ts:54-69, 166-188)
// ---------------------------------------------------------------------------------------------

/// Web `ClusterPlacement` (`clusters.ts:128`). `requestedTypy?` jest w webie zawsze ustawione
/// (oba `return`), wiec tu `i64`. `spawn_cache`: `None` tylko przy braku lądu (wczesny `return`).
#[derive(Debug, Clone, PartialEq)]
pub struct ClusterPlacement {
    pub rozmiar_mapy: MapSizeLabel,
    pub aktywne_typy: i64,
    pub requested_typy: i64,
    pub min_dystans_miasta_panstwa: i64,
    pub max_dystans_miasta_panstwa: i64,
    pub min_dystans_obcy_od_gracza: i64,
    pub player_typ_index: usize,
    pub klastry: Vec<TypeCluster>,
    pub spawn_cache: Option<ClusterSpawnCache>,
}

/// Web `opts` funkcji `computeClusters` (`clusters.ts:3375-3394`). `None` = pole nieobecne
/// (`undefined`); `civ_roster` = wiersze `civs.json` (potrzebne z `start_epoch_id`).
#[derive(Debug, Clone, Copy, Default)]
pub struct ComputeClustersOpts<'a> {
    pub seed: Option<u32>,
    pub aktywne_typy: Option<i64>,
    pub player_typ: Option<&'a str>,
    pub min_dystans: Option<i64>,
    pub rywale_na_klaster: Option<i64>,
    pub min_dystans_klastrow: Option<i64>,
    pub start_epoch_id: Option<&'a str>,
    pub civ_roster: Option<&'a [CivEntryRow<'a>]>,
    pub preferred_civ_ids: Option<&'a [String]>,
}

/// Bledy portu tam, gdzie web rzuca `TypeError`.
#[derive(Debug, Clone, PartialEq)]
pub enum ClusterComputeError {
    /// Niepusty lad, ale zadnego srodka klastra (`assignVoronoiRegions` na pustej liscie srodkow:
    /// `regiony[0]` jest `undefined`, `.push` rzuca `TypeError`). Przy niepustej puli `ladowe`
    /// `placeClusterCentersAcrossLandmasses` zawsze zwraca przynajmniej jeden srodek (faza 5b bez
    /// bramek), wiec ten wariant jest w webie nieosiagalny (zadne z 842 nagran) - zachowany, bo
    /// `assign_voronoi_regions` (M10) zwraca w tym miejscu `None`.
    NoClusterCenters,
    /// Diagnostyczny `console.warn` na koncu `computeClusters` (`clusters.ts:4228-4233`) buduje
    /// napis z `regiony[ci]!.length`: gdy klaster o indeksie `ci` ma mniej niz `rywaleNaKlaster + 1`
    /// miast, a `ci >= regiony.length` (klastrow jest wiecej niz regionow Voronoi, bo dopelnienia
    /// dodaly klastry), `regiony[ci]` jest `undefined` i web rzuca `TypeError` ("Cannot read
    /// properties of undefined (reading 'length')"). To BLAD WEBA odtworzony 1:1 (zaobserwowany na
    /// wektorach: `k7`, `p123`, `k3small`, `s_*`, mapy brzegowe). `placement` to wynik, ktory web
    /// zdazyl zbudowac PRZED rzuceniem (do porownania z wektorami "bez dziennika", patrz doc §6).
    DiagnosticRegionMissing {
        cluster_index: usize,
        placement: Box<ClusterPlacement>,
    },
}

impl fmt::Display for ClusterComputeError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NoClusterCenters => write!(
                formatter,
                "computeClusters: brak jakiegokolwiek srodka klastra przy niepustym ladzie \
                 (web: TypeError w assignVoronoiRegions)"
            ),
            Self::DiagnosticRegionMissing { cluster_index, .. } => write!(
                formatter,
                "computeClusters: klaster {cluster_index} ma za malo miast, a regiony[{cluster_index}] \
                 nie istnieje (web: TypeError 'Cannot read properties of undefined (reading \
                 length)' w logu diagnostycznym clusters.ts:4231)"
            ),
        }
    }
}

impl Error for ClusterComputeError {}

/// Web `ClusterSpawnPlan` (`cluster-spawn.ts:54`) Z polem `placement`. Wersja bez `placement`
/// (wejscie `build_cluster_start_plan`) to [`StartClusterSpawnPlan`] - patrz [`Self::to_start_plan`].
/// `pending_same_type_rivals` to `rywaleNaKlaster` (web: `number`).
#[derive(Debug, Clone, PartialEq)]
pub struct ClusterSpawnPlan {
    pub player_start_hex: HexCoord,
    pub player_start_city_name: String,
    pub slots: Vec<ClusterSpawnSlot>,
    pub foreign_type_clusters: Vec<ForeignTypeClusterGroup>,
    pub placement: ClusterPlacement,
    pub pending_same_type_rivals: i64,
    pub pending_same_type_rival_hexes: Vec<HexCoord>,
    pub cluster_capital_owner_ids: Vec<PlayerId>,
    pub pending_same_type_rival_owner_ids: Vec<PlayerId>,
}

impl ClusterSpawnPlan {
    /// Wejscie `start_position::build_cluster_start_plan` (web `cluster-start.ts` czyta wynik
    /// `buildClusterSpawnPlan` bez pola `placement`). `pending_same_type_rivals` ujemne -> 0.
    pub fn to_start_plan(&self) -> StartClusterSpawnPlan {
        StartClusterSpawnPlan {
            player_start_hex: self.player_start_hex,
            player_start_city_name: self.player_start_city_name.clone(),
            slots: self.slots.clone(),
            foreign_type_clusters: self.foreign_type_clusters.clone(),
            pending_same_type_rivals: u32::try_from(self.pending_same_type_rivals.max(0))
                .unwrap_or(u32::MAX),
            pending_same_type_rival_hexes: self.pending_same_type_rival_hexes.clone(),
            cluster_capital_owner_ids: self.cluster_capital_owner_ids.clone(),
            pending_same_type_rival_owner_ids: self.pending_same_type_rival_owner_ids.clone(),
        }
    }
}

/// Web `BuildClusterSpawnInput` (`cluster-spawn.ts:167`). `civs` = `CivsData` (z niego wynika
/// `civs.cywilizacje` jako roster epoki i definicje nazw miast).
#[derive(Debug, Clone, Copy)]
pub struct BuildClusterSpawnInput<'a> {
    pub map: &'a GeneratedMap,
    pub civs: &'a CivsFile,
    pub seed: u32,
    pub player_typ: &'a str,
    pub rywale_na_klaster: i64,
    pub aktywne_typy: Option<i64>,
    pub start_epoch_id: Option<&'a str>,
    pub city_names_pools: Option<&'a CityNamesPoolsData>,
    pub preferred_civ_ids: Option<&'a [String]>,
}

// ---------------------------------------------------------------------------------------------
// Narzedzia
// ---------------------------------------------------------------------------------------------

fn dist(a: HexCoord, b: HexCoord) -> i64 {
    i64::from(a.distance(b))
}

/// `Math.floor(a / b)` dla calkowitych `a`, `b > 0` (ujemne `a` tez poprawnie).
fn floor_div(a: i64, b: i64) -> i64 {
    a.div_euclid(b)
}

/// `(seed + ci * 0x9e3779b1) >>> 0` na `u32`.
fn mix_seed(seed: u32, ci: usize) -> u32 {
    seed.wrapping_add((ci as u32).wrapping_mul(KI_SEED_MUL))
}

fn hex_of_tile(t: &crate::domain::map_generator::HexTile) -> HexCoord {
    HexCoord::new(t.coord.q, t.coord.r)
}

/// Web `buildSeaDistanceField` (`gen-helpers.ts:5614`): odleglosc (w hexach) do najblizszego
/// Morza/Plytkiego Morza - BFS od brzegu; hex nieosiagalny nie ma wpisu.
pub fn build_sea_distance_field(map: &GeneratedMap) -> SeaDist {
    let known: HashSet<(i32, i32)> = map.tiles.iter().map(|t| (t.coord.q, t.coord.r)).collect();
    let mut dist: SeaDist = HashMap::new();
    let mut queue: VecDeque<(i32, i32)> = VecDeque::new();
    for t in &map.tiles {
        if is_water_terrain_local(t.terrain) {
            dist.insert((t.coord.q, t.coord.r), 0.0);
            queue.push_back((t.coord.q, t.coord.r));
        }
    }
    while let Some((q, r)) = queue.pop_front() {
        let d = dist[&(q, r)];
        for (dq, dr) in HEX_DIRECTIONS {
            let nk = (q + dq, r + dr);
            if dist.contains_key(&nk) || !known.contains(&nk) {
                continue;
            }
            dist.insert(nk, d + 1.0);
            queue.push_back(nk);
        }
    }
    dist
}

/// Pula `ladowe` z `computeClusters` (`clusters.ts:3439`): bez Morza, Gor i Plytkiego Morza.
fn land_pool(map: &GeneratedMap) -> Vec<HexCoord> {
    map.tiles
        .iter()
        .filter(|t| {
            !matches!(
                t.terrain,
                Terrain::Sea | Terrain::Mountains | Terrain::ShallowSea
            )
        })
        .map(hex_of_tile)
        .collect()
}

/// Wspolny kontekst wywolan `pickSpawnHexWithCapitalGates` w `computeClusters`.
struct PickCtx<'a> {
    map: &'a GeneratedMap,
    ladowe: &'a [HexCoord],
    land_cache: &'a MassLandCache,
    map_center: PointF64,
    sea_dist: &'a SeaDist,
    min_sea_dist: f64,
    spread: SpreadGateOpts,
}

/// Opcje jednego wywolania (pola, ktorymi web rozni wywolania).
#[derive(Clone, Copy)]
struct PickReq<'a> {
    prior: &'a [HexCoord],
    min_sep: f64,
    require_local_land: bool,
    require_player_mass_gate: bool,
    preferred: Option<HexCoord>,
    progressive_soft_sea: bool,
}

impl PickCtx<'_> {
    /// Wywolanie z `...spreadGateOpts` (wszystkie w `computeClusters`).
    fn pick(&self, rand: RandRef<'_>, req: &PickReq<'_>) -> Option<HexCoord> {
        pick_spawn_hex_with_capital_gates(
            self.map,
            self.ladowe,
            self.land_cache,
            self.map_center,
            rand,
            &PickSpawnHexOpts {
                sea_dist: Some(self.sea_dist),
                min_sea_dist: self.min_sea_dist,
                max_sea_dist: None,
                prior_capitals: req.prior,
                min_capital_sep: req.min_sep,
                require_player_mass_gate: req.require_player_mass_gate,
                require_local_land: req.require_local_land,
                preferred: req.preferred,
                progressive_soft_sea: req.progressive_soft_sea,
                land_bbox: Some(self.spread.land_bbox),
                spread_n: Some(self.spread.spread_n),
            },
        )
    }
}

/// Uklad klastra gracza (`playerLayout`). Pole `pendingStateSlots` ukladu jest w webie
/// NIEUZYWANE po przypisaniu (klaster gracza dostaje `playerStateSlots`, `clusters.ts:3837`),
/// wiec nie jest tu przechowywane.
#[derive(Debug, Clone)]
struct Layout {
    cities: Vec<ClusterCity>,
    growth_slot: Option<HexCoord>,
}

impl Layout {
    fn single_capital(h: HexCoord) -> Self {
        Self {
            cities: vec![ClusterCity {
                q: h.q,
                r: h.r,
                is_capital: true,
            }],
            growth_slot: None,
        }
    }

    fn empty() -> Self {
        Self {
            cities: Vec::new(),
            growth_slot: None,
        }
    }
}

impl From<ClusterCitiesWithCentrum> for Layout {
    fn from(r: ClusterCitiesWithCentrum) -> Self {
        Self {
            cities: r.cities,
            growth_slot: r.growth_slot,
        }
    }
}

/// Stan klastra gracza zmieniany przez `resolvePlayerCapitalPos` (`clusters.ts:3685`).
struct PlayerState {
    centrum_final: HexCoord,
    capital_pos: HexCoord,
    layout: Layout,
}

fn cities_with_state(cap: HexCoord, state: &[HexCoord]) -> Vec<ClusterCity> {
    let mut cities = vec![ClusterCity {
        q: cap.q,
        r: cap.r,
        is_capital: true,
    }];
    for s in state {
        cities.push(ClusterCity {
            q: s.q,
            r: s.r,
            is_capital: false,
        });
    }
    cities
}

/// Klaster z samej stolicy (dopelnienia: `pendingStateSlots: []`, `growthSlot: null`).
fn capital_only_cluster(typ_index: usize, typ: String, cap: HexCoord) -> TypeCluster {
    TypeCluster {
        typ_index,
        typ,
        centrum: cap,
        miasta: vec![ClusterCity {
            q: cap.q,
            r: cap.r,
            is_capital: true,
        }],
        pending_state_slots: Some(Vec::new()),
        growth_slot: Some(None),
    }
}

// ---------------------------------------------------------------------------------------------
// computeClusters (clusters.ts:3362-4250)
// ---------------------------------------------------------------------------------------------

/// Web `computeClusters` (`clusters.ts:3373`): rozmieszczenie klastrow typow na mapie.
/// `Err` odpowiada `TypeError` weba (patrz [`ClusterComputeError`]).
#[allow(clippy::too_many_lines)]
pub fn compute_clusters(
    map: &GeneratedMap,
    opts: &ComputeClustersOpts<'_>,
) -> Result<ClusterPlacement, ClusterComputeError> {
    let tbl = mapgen_cluster_compute();
    let seed = opts.seed.unwrap_or(DEFAULT_SEED);
    let player_typ_klucz: String = opts
        .player_typ
        .map_or_else(|| roster_klucze()[0].clone(), str::to_owned);
    let state_city_count = opts
        .rywale_na_klaster
        .unwrap_or(tbl.domyslne.rywale_na_klaster.wartosc);
    let min_dyst_miasta_panstwa = opts.min_dystans.unwrap_or_else(min_dist_start_city_state);

    let mut rng = Mulberry32::new(seed);

    // --- Wymiary mapy ---
    let (mut min_q, mut max_q, mut min_r, mut max_r) = (i32::MAX, i32::MIN, i32::MAX, i32::MIN);
    for t in &map.tiles {
        min_q = min_q.min(t.coord.q);
        max_q = max_q.max(t.coord.q);
        min_r = min_r.min(t.coord.r);
        max_r = max_r.max(t.coord.r);
    }
    // Pusta mapa: web liczy W = H = -Infinity (`area = Infinity` => 'super', `Math.min(W, H) < 80`
    // => ForMap = 0, `floor(-Infinity / 15)` < 4); port: W = H = -1 daje te same wartosci.
    let empty_map = map.tiles.is_empty();
    let (w, h): (i64, i64) = if empty_map {
        (-1, -1)
    } else {
        (
            i64::from(max_q) - i64::from(min_q) + 1,
            i64::from(max_r) - i64::from(min_r) + 1,
        )
    };

    let rozmiar_mapy = if empty_map {
        MapSizeLabel::Super
    } else {
        map_size_label(w, h)
    };
    let requested_typy = opts
        .aktywne_typy
        .unwrap_or_else(|| aktywne_typy_from_size(rozmiar_mapy));
    let epoch_roster = roster_klucze_for_start_epoch(opts.civ_roster, opts.start_epoch_id);
    let roster_cap = if epoch_roster.is_empty() {
        roster_klucze().len()
    } else {
        epoch_roster.len()
    } as i64;
    let n_typy = requested_typy.min(roster_cap);

    let min_capital_sep_early = capital_min_separation_for_map(rozmiar_mapy, w, h);
    let center_placement_sep = cluster_center_placement_sep_for_map(rozmiar_mapy, w, h);
    let short_side = w.min(h);
    let min_dyst_klastrow: i64 = opts.min_dystans_klastrow.unwrap_or_else(|| {
        if center_placement_sep > 0 {
            center_placement_sep
        } else if min_capital_sep_early > 0 {
            min_capital_sep_early
        } else {
            tbl.dystans_klastrow
                .min_zapas_krotszy_bok
                .wartosc
                .max(floor_div(
                    short_side,
                    tbl.dystans_klastrow.dzielnik_krotszego_boku.wartosc,
                ))
        }
    });
    let min_dyst_obcy_od_gracza = min_dist_foreign_from_player().max(min_dyst_klastrow);

    // --- Pola ladowe (bez Morza, Gor i Plytkiego Morza) ---
    let ladowe = land_pool(map);

    if ladowe.is_empty() {
        return Ok(ClusterPlacement {
            rozmiar_mapy,
            aktywne_typy: 0,
            requested_typy: n_typy,
            min_dystans_miasta_panstwa: min_dyst_miasta_panstwa,
            max_dystans_miasta_panstwa: cluster_city_state_max_hex(),
            min_dystans_obcy_od_gracza: min_dyst_obcy_od_gracza,
            player_typ_index: 0,
            klastry: Vec::new(),
            spawn_cache: None,
        });
    }

    // Tasowanie lad. pol (wynik w webie nieuzywany; ZUZYWA strumien `rand` - to pierwszy jego
    // konsument). Jedyna implementacja `shuffleInPlace` na `Mulberry32` to `cluster_rivals::
    // shuffle_in_place` (M09); duplikat `cluster_layout::shuffle_in_place_with` (M11, na
    // wstrzyknietym `rand`) NIE jest tu uzywany. Domkniecie `rand` powstaje DOPIERO po tasowaniu.
    let mut shuffled_lad = ladowe.clone();
    shuffle_in_place(&mut shuffled_lad, &mut rng);
    let mut rand_fn = || rng.next_f64();
    let rand: RandRef<'_> = &mut rand_fn;

    let map_center = PointF64 {
        q: (f64::from(min_q) + f64::from(max_q)) / 2.0,
        r: (f64::from(min_r) + f64::from(max_r)) / 2.0,
    };
    let margin_brzeg = tbl.margines_brzegu.minimum.wartosc.max(floor_div(
        min_dyst_klastrow,
        tbl.margines_brzegu.dzielnik_dystansu_klastrow.wartosc,
    ));
    let sea_dist = build_sea_distance_field(map);
    let min_sea_dist = capital_min_sea_dist_for_map(rozmiar_mapy, w, h) as f64;
    let min_capital_sep = capital_min_separation_for_map(rozmiar_mapy, w, h) as f64;
    let s_cluster = cluster_body_separation_for_map(rozmiar_mapy, w, h) as f64;
    let body_buffer_radius = cluster_body_buffer_radius(s_cluster);
    let land_cache = create_mass_land_cache(&ladowe);
    let land_bbox = LandBBox::from_hexes(&ladowe);
    let spread = SpreadGateOpts {
        land_bbox,
        spread_n: n_typy,
    };
    let ctx = PickCtx {
        map,
        ladowe: &ladowe,
        land_cache: &land_cache,
        map_center,
        sea_dist: &sea_dist,
        min_sea_dist,
        spread,
    };
    let min_dyst_klastrow_f = min_dyst_klastrow as f64;

    // --- SRODKI TYPOW: rowno po masach ladu ---
    let mut centrumy = place_cluster_centers_across_landmasses(
        map,
        &ladowe,
        &land_cache,
        n_typy,
        min_dyst_klastrow_f,
        map_center,
        &mut *rand,
        margin_brzeg as f64,
        MapBounds {
            min_q,
            max_q,
            min_r,
            max_r,
        },
        Some(&sea_dist),
        min_sea_dist,
        &HOOKS,
    );

    // FALA 188: dopelnij brakujace srodki - twarda sep + seaDist + lokalny lad.
    while (centrumy.len() as i64) < n_typy {
        let cap = ctx.pick(
            &mut *rand,
            &PickReq {
                prior: &centrumy,
                min_sep: min_dyst_klastrow_f,
                require_local_land: true,
                require_player_mass_gate: centrumy.is_empty(),
                preferred: None,
                progressive_soft_sea: false,
            },
        );
        let Some(cap) = cap else {
            break;
        };
        centrumy.push(cap);
    }

    let roster_source: Vec<String> = if epoch_roster.is_empty() {
        roster_klucze()
    } else {
        epoch_roster
    };
    let player_in_epoch = roster_source.contains(&player_typ_klucz);
    let player_klucz: String = if player_in_epoch {
        player_typ_klucz
    } else {
        roster_source[0].clone()
    };

    // --- VORONOI: kazdy ladowy hex -> najblizszy srodek ---
    let mut active_centrumy: Vec<HexCoord> = centrumy.clone();
    let mut regiony = assign_voronoi_regions(&ladowe, &active_centrumy)
        .ok_or(ClusterComputeError::NoClusterCenters)?;

    // MAP-SPAWN-Q1 B: lokalny lad >= 70% w promieniu stolicy (relokacja / pominiecie typu).
    let placeholder_klucze: Vec<String> = (0..active_centrumy.len())
        .map(|i| {
            if i == 0 {
                player_klucz.clone()
            } else {
                format!("typ{i}")
            }
        })
        .collect();
    let dominance = enforce_local_land_dominance(
        map,
        &mut active_centrumy,
        &mut regiony,
        &placeholder_klucze,
        &ladowe,
        &land_cache,
        &mut *rand,
        min_dyst_klastrow_f,
        map_center,
        Some(&sea_dist),
        min_sea_dist,
    )
    .ok_or(ClusterComputeError::NoClusterCenters)?;
    active_centrumy = dominance.centrumy;
    regiony = dominance.regiony;

    // Typy przypisane do mas PO finalnych srodkach; preferowane typy gracza na poczatek listy.
    let roster_bez_gracza = reorder_roster_by_preference(
        &roster_source
            .iter()
            .filter(|k| **k != player_klucz)
            .cloned()
            .collect::<Vec<_>>(),
        opts.preferred_civ_ids,
    );
    let foreign_slice: Vec<String> = roster_bez_gracza
        .iter()
        .take(usize::try_from((n_typy - 1).max(0)).unwrap_or(0))
        .cloned()
        .collect();
    let mut active_klucze = assign_types_to_cluster_centers(
        &active_centrumy,
        &land_cache.masses,
        &player_klucz,
        &foreign_slice,
        &mut *rand,
    );
    while active_klucze.len() < active_centrumy.len() {
        active_klucze.push(format!("typ{}", active_klucze.len()));
    }

    // FALA 193: dopelnij srodki po dropie dominance.
    while (active_centrumy.len() as i64) < n_typy {
        let req = PickReq {
            prior: &active_centrumy,
            min_sep: min_dyst_klastrow_f,
            require_local_land: (active_centrumy.len() as i64) < n_typy - 1,
            require_player_mass_gate: false,
            preferred: None,
            progressive_soft_sea: true,
        };
        match ctx.pick(&mut *rand, &req) {
            Some(cap) => active_centrumy.push(cap),
            None => {
                let last = ctx.pick(
                    &mut *rand,
                    &PickReq {
                        require_local_land: false,
                        ..req
                    },
                );
                match last {
                    Some(last) => active_centrumy.push(last),
                    None => break,
                }
            }
        }
    }
    if active_centrumy.len() > regiony.len() || active_centrumy.len() > active_klucze.len() {
        regiony = assign_voronoi_regions(&ladowe, &active_centrumy)
            .ok_or(ClusterComputeError::NoClusterCenters)?;
        active_klucze = assign_types_to_cluster_centers(
            &active_centrumy,
            &land_cache.masses,
            &player_klucz,
            &foreign_slice,
            &mut *rand,
        );
        while active_klucze.len() < active_centrumy.len() {
            active_klucze.push(format!("typ{}", active_klucze.len()));
        }
    }

    // --- MIASTA: klaster gracza, obce typy min 12 od stolicy, mp obcych min 5 w klastrze ---
    let mut klastry: Vec<TypeCluster> = Vec::new();
    let mut cluster_regions: Vec<Vec<HexCoord>> = Vec::new();
    let mut placed_capitals: Vec<HexCoord> = Vec::new();

    let player_centrum = active_centrumy[0];
    // `playerRegion = regiony[0]` jest TA SAMA tablica co `clusterRegions[0]` (mutowana w miejscu).
    let mut player_region = regiony.get_mut(0).map(std::mem::take).unwrap_or_default();
    let player_layout_result = build_cluster_cities_with_land_gate(
        map,
        &mut player_region,
        player_centrum,
        state_city_count,
        min_dyst_miasta_panstwa,
        &mut *rand,
        None,
        seed,
        &land_cache,
        &[],
        min_dyst_klastrow_f,
        Some(&sea_dist),
        min_sea_dist,
        &placed_capitals,
        min_capital_sep,
    );

    let mut st = PlayerState {
        centrum_final: player_centrum,
        capital_pos: player_centrum,
        layout: Layout::empty(),
    };
    if let Some(res) = player_layout_result {
        st.centrum_final = res.centrum;
        st.layout = res.into();
    } else if let Some(forced) = pick_player_cluster_center(
        map,
        MassesOrCache::Cache(&land_cache),
        &ladowe,
        map_center,
        &mut *rand,
        Some(&sea_dist),
        min_sea_dist,
        &HOOKS,
    ) {
        st.centrum_final = forced;
        st.layout = Layout::single_capital(forced);
    }

    st.capital_pos = cluster_capital_pos(&st.layout.cities, st.centrum_final);

    let resolve_player_capital_pos =
        |st: &mut PlayerState, rand: RandRef<'_>, placed: &[HexCoord]| {
            let resolved = ctx.pick(
                rand,
                &PickReq {
                    prior: placed,
                    min_sep: min_capital_sep,
                    require_local_land: true,
                    require_player_mass_gate: true,
                    preferred: Some(st.capital_pos),
                    progressive_soft_sea: false,
                },
            );
            if let Some(resolved) = resolved {
                st.centrum_final = resolved;
                st.capital_pos = resolved;
                st.layout = Layout::single_capital(resolved);
            }
        };

    if !passes_player_start_mass_gate(
        map,
        st.capital_pos.q,
        st.capital_pos.r,
        MassesOrCache::Cache(&land_cache),
    ) {
        resolve_player_capital_pos(&mut st, &mut *rand, &placed_capitals);
    }

    if min_sea_dist > 0.0
        && !passes_min_sea_dist_gate(&sea_dist, st.capital_pos.q, st.capital_pos.r, min_sea_dist)
    {
        let fixed = ctx.pick(
            &mut *rand,
            &PickReq {
                prior: &placed_capitals,
                min_sep: min_capital_sep,
                require_local_land: true,
                require_player_mass_gate: true,
                preferred: None,
                progressive_soft_sea: false,
            },
        );
        if let Some(fixed) = fixed {
            let relocated = build_cluster_cities_with_land_gate(
                map,
                &mut player_region,
                fixed,
                state_city_count,
                min_dyst_miasta_panstwa,
                &mut *rand,
                None,
                seed,
                &land_cache,
                &[],
                min_dyst_klastrow_f,
                Some(&sea_dist),
                min_sea_dist,
                &placed_capitals,
                min_capital_sep,
            );
            let relocated_ok = relocated.as_ref().is_some_and(|rl| {
                let cap_q_r = rl
                    .cities
                    .iter()
                    .find(|m| m.is_capital)
                    .map_or((fixed.q, fixed.r), |m| (m.q, m.r));
                passes_min_sea_dist_gate(&sea_dist, cap_q_r.0, cap_q_r.1, min_sea_dist)
                    && passes_min_capital_separation_gate(
                        cluster_capital_pos(&rl.cities, fixed),
                        &placed_capitals,
                        min_capital_sep,
                    )
            });
            if let (true, Some(rl)) = (relocated_ok, relocated) {
                st.centrum_final = rl.centrum;
                st.capital_pos = rl
                    .cities
                    .iter()
                    .find(|m| m.is_capital)
                    .or_else(|| rl.cities.first())
                    .map_or(fixed, |c| HexCoord::new(c.q, c.r));
                st.layout = rl.into();
            } else if passes_min_sea_dist_gate(&sea_dist, fixed.q, fixed.r, min_sea_dist)
                && passes_min_capital_separation_gate(fixed, &placed_capitals, min_capital_sep)
            {
                st.centrum_final = fixed;
                st.capital_pos = fixed;
                st.layout = Layout::single_capital(fixed);
            }
        }
    }

    if min_capital_sep > 0.0
        && !passes_min_capital_separation_gate(st.capital_pos, &placed_capitals, min_capital_sep)
    {
        resolve_player_capital_pos(&mut st, &mut *rand, &placed_capitals);
    }

    placed_capitals.push(st.capital_pos);
    let player_capital_pos = st.capital_pos;

    // Pre-plan panstw gracza: ciasne skupisko wokol stolicy.
    let player_state_slots = pack_rival_cities_around_core(
        &ladowe,
        player_capital_pos,
        state_city_count,
        min_dyst_miasta_panstwa,
        seed,
        Some(map_center),
    );
    let player_repack = pack_city_states_around_capital(
        &ladowe,
        &player_region,
        player_capital_pos,
        state_city_count,
        min_dyst_miasta_panstwa,
        seed,
        &PackAroundCapitalOpts {
            exclude_hex: Some(player_capital_pos),
            growth_reserve: Some(cluster_growth_reserve()),
            half_plane_axis: Some(compute_same_type_rival_half_plane_axis(
                player_capital_pos,
                map_center,
                seed,
            )),
            foreign_buffers: &[],
            ..PackAroundCapitalOpts::default()
        },
    );
    if !player_repack.state_cities.is_empty() {
        st.layout = Layout {
            cities: cities_with_state(player_capital_pos, &player_repack.state_cities),
            growth_slot: player_repack.growth_slot,
        };
    }

    klastry.push(TypeCluster {
        typ_index: 0,
        typ: active_klucze
            .first()
            .cloned()
            .unwrap_or_else(|| player_klucz.clone()),
        centrum: st.centrum_final,
        miasta: st.layout.cities.clone(),
        pending_state_slots: Some(player_state_slots),
        growth_slot: Some(st.layout.growth_slot),
    });
    cluster_regions.push(player_region);

    let mut ci = 1usize;
    while ci < active_centrumy.len() {
        let centrum = active_centrumy[ci];
        let mut region = regiony.get_mut(ci).map(std::mem::take).unwrap_or_default();
        let mut foreign_layout = build_cluster_cities_with_land_gate(
            map,
            &mut region,
            centrum,
            state_city_count,
            min_dist_foreign_in_cluster(),
            &mut *rand,
            Some(AnchorHex {
                q: player_capital_pos.q,
                r: player_capital_pos.r,
                min_dist: min_dyst_obcy_od_gracza,
            }),
            seed,
            &land_cache,
            &active_centrumy[..ci],
            min_dyst_klastrow_f,
            Some(&sea_dist),
            min_sea_dist,
            &placed_capitals,
            min_capital_sep,
        );
        if foreign_layout.as_ref().is_none_or(|l| l.cities.is_empty()) {
            let retry_cap = ctx.pick(
                &mut *rand,
                &PickReq {
                    prior: &placed_capitals,
                    min_sep: min_capital_sep,
                    require_local_land: true,
                    require_player_mass_gate: false,
                    preferred: Some(centrum),
                    progressive_soft_sea: true,
                },
            );
            if let Some(retry_cap) = retry_cap {
                foreign_layout = Some(single_capital_result(retry_cap));
                active_centrumy[ci] = retry_cap;
            }
        }
        // FALA 188: ostatnia szansa - bez bramki lokalnego ladu 70% + soft seaDist.
        if foreign_layout.as_ref().is_none_or(|l| l.cities.is_empty()) {
            let last_cap = ctx.pick(
                &mut *rand,
                &PickReq {
                    prior: &placed_capitals,
                    min_sep: min_capital_sep,
                    require_local_land: false,
                    require_player_mass_gate: false,
                    preferred: Some(centrum),
                    progressive_soft_sea: true,
                },
            );
            if let Some(last_cap) = last_cap {
                foreign_layout = Some(single_capital_result(last_cap));
                active_centrumy[ci] = last_cap;
            }
        }
        let Some(foreign_layout) = foreign_layout.filter(|l| !l.cities.is_empty()) else {
            ci += 1;
            continue;
        };

        let foreign_cap_city = foreign_layout
            .cities
            .iter()
            .find(|m| m.is_capital)
            .unwrap_or(&foreign_layout.cities[0]);
        let foreign_cap = HexCoord::new(foreign_cap_city.q, foreign_cap_city.r);
        // FALA 188: nie dropuj po soft-sea rescue - sep ponizej jest twarde.
        let soft_sea_floor = sea_dist_rescue_ladder(min_sea_dist)
            .last()
            .copied()
            .unwrap_or(0.0);
        if soft_sea_floor > 0.0
            && !passes_min_sea_dist_gate(&sea_dist, foreign_cap.q, foreign_cap.r, soft_sea_floor)
        {
            ci += 1;
            continue;
        }
        if !passes_min_capital_separation_gate(foreign_cap, &placed_capitals, min_capital_sep) {
            ci += 1;
            continue;
        }
        let foreign_anchor = AnchorHex {
            q: player_capital_pos.q,
            r: player_capital_pos.r,
            min_dist: min_dyst_obcy_od_gracza,
        };
        let foreign_bufs = foreign_buffers_for_cluster(&klastry, klastry.len(), body_buffer_radius);
        let foreign_repack = pack_city_states_around_capital(
            &ladowe,
            &region,
            foreign_cap,
            state_city_count,
            min_dist_foreign_in_cluster(),
            mix_seed(seed, ci),
            &PackAroundCapitalOpts {
                exclude_hex: Some(foreign_cap),
                anchor: Some(foreign_anchor),
                foreign_buffers: &foreign_bufs,
                ..PackAroundCapitalOpts::default()
            },
        );

        klastry.push(TypeCluster {
            typ_index: klastry.len(),
            typ: active_klucze
                .get(ci)
                .cloned()
                .unwrap_or_else(|| format!("typ{ci}")),
            centrum: foreign_layout.centrum,
            miasta: cities_with_state(foreign_cap, &foreign_repack.state_cities),
            pending_state_slots: None,
            growth_slot: Some(foreign_repack.growth_slot.or(foreign_layout.growth_slot)),
        });
        cluster_regions.push(region);
        placed_capitals.push(foreign_cap);
        ci += 1;
    }

    // FALA 193: po `continue` w petli obcych - dopelnij brakujace typy.
    {
        let used_typs: HashSet<String> = klastry.iter().map(|k| k.typ.clone()).collect();
        let mut unused_keys: Vec<String> = Vec::new();
        for k in roster_source
            .iter()
            .filter(|k| **k != player_klucz && !used_typs.contains(*k))
            .chain(
                active_klucze
                    .iter()
                    .filter(|k| **k != player_klucz && !used_typs.contains(*k)),
            )
        {
            if !unused_keys.contains(k) {
                unused_keys.push(k.clone());
            }
        }
        let top_up_radius = tbl
            .region_dopelnienia
            .minimum_promienia
            .wartosc
            .max(floor_div(
                min_dyst_klastrow,
                tbl.region_dopelnienia.dzielnik_dystansu_klastrow.wartosc,
            ));
        let mut key_idx = 0usize;
        while (klastry.len() as i64) < n_typy {
            let cap = ctx.pick(
                &mut *rand,
                &PickReq {
                    prior: &placed_capitals,
                    min_sep: min_capital_sep,
                    require_local_land: false,
                    require_player_mass_gate: false,
                    preferred: None,
                    progressive_soft_sea: true,
                },
            );
            let Some(cap) = cap else {
                break;
            };
            let chosen = if dist(cap, player_capital_pos) < min_dyst_obcy_od_gracza {
                // sprobuj inny hex - nie akceptuj zbyt blisko gracza
                let mut prior = placed_capitals.clone();
                prior.push(player_capital_pos);
                let alt = ctx.pick(
                    &mut *rand,
                    &PickReq {
                        prior: &prior,
                        min_sep: min_capital_sep.max(min_dyst_obcy_od_gracza as f64),
                        require_local_land: false,
                        require_player_mass_gate: false,
                        preferred: None,
                        progressive_soft_sea: true,
                    },
                );
                let Some(alt) = alt else {
                    break;
                };
                alt
            } else {
                cap
            };
            let typ = unused_keys
                .get(key_idx)
                .cloned()
                .unwrap_or_else(|| format!("typ{}", klastry.len()));
            key_idx += 1;
            klastry.push(capital_only_cluster(klastry.len(), typ, chosen));
            cluster_regions.push(
                ladowe
                    .iter()
                    .filter(|h| dist(**h, chosen) <= top_up_radius)
                    .copied()
                    .collect(),
            );
            placed_capitals.push(chosen);
        }
    }

    // FALA 185: repack MP gracza z buforami obcych klastrow.
    if !klastry.is_empty() && !klastry[0].miasta.is_empty() {
        let player_cap = cluster_capital_hex(&klastry[0]).unwrap_or(player_capital_pos);
        let player_bufs = foreign_buffers_for_cluster(&klastry, 0, body_buffer_radius);
        let player_region_final: &[HexCoord] = cluster_regions.first().map_or(&[], Vec::as_slice);
        let repack_final = pack_city_states_around_capital(
            &ladowe,
            player_region_final,
            player_cap,
            state_city_count,
            min_dyst_miasta_panstwa,
            seed,
            &PackAroundCapitalOpts {
                exclude_hex: Some(player_cap),
                growth_reserve: Some(cluster_growth_reserve()),
                half_plane_axis: Some(compute_same_type_rival_half_plane_axis(
                    player_cap, map_center, seed,
                )),
                foreign_buffers: &player_bufs,
                ..PackAroundCapitalOpts::default()
            },
        );
        if !repack_final.state_cities.is_empty() || repack_final.growth_slot.is_some() {
            klastry[0].miasta = cities_with_state(player_cap, &repack_final.state_cities);
            klastry[0].pending_state_slots = Some(repack_final.state_cities);
            klastry[0].growth_slot = Some(repack_final.growth_slot);
        }
    }

    enforce_hard_capital_separation_on_klastry(
        &mut klastry,
        &mut cluster_regions,
        map,
        &mut *rand,
        Some(&sea_dist),
        min_sea_dist,
        min_capital_sep,
        min_dyst_obcy_od_gracza,
        &ladowe,
        &land_cache,
        seed,
        state_city_count,
        map_center,
        min_dyst_miasta_panstwa,
        Some(&spread),
    );

    enforce_cluster_body_separation_on_klastry(
        &mut klastry,
        &mut cluster_regions,
        map,
        &mut *rand,
        Some(&sea_dist),
        min_sea_dist,
        s_cluster,
        min_capital_sep,
        min_dyst_obcy_od_gracza,
        &ladowe,
        &land_cache,
        seed,
        state_city_count,
        map_center,
        min_dyst_miasta_panstwa,
        body_buffer_radius,
        Some(&spread),
    );

    // FALA 193: HARD sep moze dropnac typ - dopelnij z powrotem do nTypy (sep twarde).
    if (klastry.len() as i64) < n_typy {
        let mut caps_now: Vec<HexCoord> = klastry.iter().filter_map(cluster_capital_hex).collect();
        let used_typs: HashSet<String> = klastry.iter().map(|k| k.typ.clone()).collect();
        let unused_keys: Vec<&String> = roster_source
            .iter()
            .filter(|k| !used_typs.contains(*k))
            .collect();
        let mut key_idx = 0usize;
        while (klastry.len() as i64) < n_typy {
            let cap = ctx.pick(
                &mut *rand,
                &PickReq {
                    prior: &caps_now,
                    min_sep: min_capital_sep,
                    require_local_land: false,
                    require_player_mass_gate: false,
                    preferred: None,
                    progressive_soft_sea: true,
                },
            );
            let Some(cap) = cap else {
                break;
            };
            let typ = unused_keys
                .get(key_idx)
                .map_or_else(|| format!("typ{}", klastry.len()), |k| (*k).clone());
            key_idx += 1;
            klastry.push(capital_only_cluster(klastry.len(), typ, cap));
            cluster_regions.push(Vec::new());
            caps_now.push(cap);
        }
    }

    // FALA 196: koncowe wyrownanie cwiartek po sep/top-up.
    enforce_quarter_spread_on_klastry(
        &mut klastry,
        &cluster_regions,
        map,
        &land_cache,
        &ladowe,
        &land_bbox,
        n_typy,
        &mut *rand,
        Some(&sea_dist),
        min_sea_dist,
        min_capital_sep,
        min_dyst_obcy_od_gracza,
        seed,
        state_city_count,
        map_center,
        min_dyst_miasta_panstwa,
        body_buffer_radius,
    );

    // BUG-INKOWIE-MP-BRAK: body-sep / ciasny region czesto zostawia sama stolice obcego typu.
    repack_all_sparse_cluster_state_cities(
        &mut klastry,
        &cluster_regions,
        state_city_count,
        min_dyst_obcy_od_gracza,
        &ladowe,
        seed,
        body_buffer_radius,
        map_center,
        min_dyst_miasta_panstwa,
    );

    // Logowanie diagnostyczne weba (`clusters.ts:4225-4235`): `console.warn` nie ma efektu na wynik,
    // ALE jego napis zawiera `regiony[ci]!.length`, a `regiony` ma tyle elementow, ile bylo srodkow
    // Voronoi - klaster dopelniony (indeks >= liczba regionow) z za mala liczba miast rzuca w webie.
    // Wynik obliczony PRZED rzuceniem dolaczamy do bledu (web go juz zbudowal, ale go nie zwraca).
    let missing_region = klastry
        .iter()
        .enumerate()
        .find(|(ki, k)| (k.miasta.len() as i64) < state_city_count + 1 && *ki >= regiony.len())
        .map(|(ki, _)| ki);

    let placed_typy = klastry.iter().filter(|k| !k.miasta.is_empty()).count() as i64;

    let placement = ClusterPlacement {
        rozmiar_mapy,
        aktywne_typy: placed_typy,
        requested_typy: n_typy,
        min_dystans_miasta_panstwa: min_dyst_miasta_panstwa,
        max_dystans_miasta_panstwa: cluster_city_state_max_hex(),
        min_dystans_obcy_od_gracza: min_dyst_obcy_od_gracza,
        player_typ_index: 0,
        klastry,
        spawn_cache: Some(ClusterSpawnCache {
            sea_dist,
            land_cache,
            ladowe,
        }),
    };
    match missing_region {
        Some(cluster_index) => Err(ClusterComputeError::DiagnosticRegionMissing {
            cluster_index,
            placement: Box::new(placement),
        }),
        None => Ok(placement),
    }
}

/// `{ cities: [{ q, r, isCapital: true }], pendingStateSlots: [], growthSlot: null, centrum }`
/// (wynik zastepczy po ponowieniu wyboru stolicy obcego klastra).
fn single_capital_result(cap: HexCoord) -> ClusterCitiesWithCentrum {
    ClusterCitiesWithCentrum {
        cities: vec![ClusterCity {
            q: cap.q,
            r: cap.r,
            is_capital: true,
        }],
        pending_state_slots: Vec::new(),
        growth_slot: None,
        centrum: cap,
    }
}

// ---------------------------------------------------------------------------------------------
// buildClusterSpawnPlan (cluster-spawn.ts:210-445)
// ---------------------------------------------------------------------------------------------

/// Web `buildClusterSpawnPlan` (`cluster-spawn.ts:216`): rozmieszcza klastry i przypisuje nazwy +
/// ownerId (deterministycznie). `Err` jak w [`compute_clusters`].
#[allow(clippy::too_many_lines)]
pub fn build_cluster_spawn_plan(
    input: &BuildClusterSpawnInput<'_>,
) -> Result<ClusterSpawnPlan, ClusterComputeError> {
    let BuildClusterSpawnInput {
        map,
        civs,
        seed,
        player_typ,
        rywale_na_klaster,
        aktywne_typy,
        start_epoch_id,
        city_names_pools,
        preferred_civ_ids,
    } = *input;
    let civ_defs: Vec<CivNamesDef> = civ_names_defs_from_file(civs);

    let startowe: Vec<Vec<&str>> = civs
        .cywilizacje
        .iter()
        .map(|c| c.epoki_startowe.iter().map(String::as_str).collect())
        .collect();
    let roster: Vec<CivEntryRow<'_>> = civs
        .cywilizacje
        .iter()
        .zip(startowe.iter())
        .map(|(c, s)| CivEntryRow {
            ikona_id: Some(c.ikona_id.as_str()),
            epoka_wejscia: Some(c.epoka_wejscia.as_str()),
            epoki_startowe: Some(s.as_slice()),
        })
        .collect();

    let placement = compute_clusters(
        map,
        &ComputeClustersOpts {
            seed: Some(seed),
            aktywne_typy,
            player_typ: Some(player_typ),
            rywale_na_klaster: Some(rywale_na_klaster),
            start_epoch_id,
            civ_roster: Some(&roster),
            preferred_civ_ids,
            ..ComputeClustersOpts::default()
        },
    )?;

    let fallback_hex = HexCoord::new(0, 0);
    let player_cluster = placement.klastry.get(placement.player_typ_index);
    let Some(player_cluster) = player_cluster.filter(|k| !k.miasta.is_empty()) else {
        return Ok(ClusterSpawnPlan {
            player_start_hex: fallback_hex,
            player_start_city_name: player_start_city_name(
                &civ_defs,
                player_typ,
                city_names_pools,
                None,
            ),
            slots: Vec::new(),
            foreign_type_clusters: Vec::new(),
            placement,
            pending_same_type_rivals: rywale_na_klaster,
            pending_same_type_rival_hexes: Vec::new(),
            cluster_capital_owner_ids: Vec::new(),
            pending_same_type_rival_owner_ids: Vec::new(),
        });
    };

    let cap_pos_raw = cluster_capital_hex(player_cluster).unwrap_or(fallback_hex);
    let spawn_cache = placement.spawn_cache.as_ref();
    let own_land_cache: MassLandCache;
    let land_cache: &MassLandCache = match spawn_cache {
        Some(c) => &c.land_cache,
        None => {
            own_land_cache = create_mass_land_cache(&land_hexes_from_game_map(map));
            &own_land_cache
        }
    };
    let sea_dist: Option<&SeaDist> = spawn_cache.map(|c| &c.sea_dist);
    let (map_w, map_h) = (i64::from(map.width), i64::from(map.height));
    let min_sea_dist = capital_min_sea_dist_for_map(placement.rozmiar_mapy, map_w, map_h) as f64;
    let min_capital_sep =
        capital_min_separation_for_map(placement.rozmiar_mapy, map_w, map_h) as f64;

    // Stolice obcych typow z computeClusters - do bramki sep przy relokacji gracza.
    let planned_foreign_capitals: Vec<HexCoord> = placement
        .klastry
        .iter()
        .filter(|k| k.typ_index != placement.player_typ_index)
        .filter_map(cluster_capital_hex)
        .collect();

    let mut cap_pos = cap_pos_raw;
    let map_center = map_center_from_game_map(map);
    let own_land_pool: Vec<HexCoord>;
    let land_pool_ref: &[HexCoord] = match spawn_cache {
        Some(c) => &c.ladowe,
        None => {
            own_land_pool = land_hexes_from_game_map(map);
            &own_land_pool
        }
    };

    let player_pick = |xor: u32, preferred: Option<HexCoord>| {
        let mut rng = Mulberry32::new(seed ^ xor);
        let mut rand_fn = || rng.next_f64();
        pick_spawn_hex_with_capital_gates(
            map,
            land_pool_ref,
            land_cache,
            map_center,
            &mut rand_fn,
            &PickSpawnHexOpts {
                sea_dist,
                min_sea_dist,
                max_sea_dist: None,
                prior_capitals: &planned_foreign_capitals,
                min_capital_sep,
                require_player_mass_gate: true,
                require_local_land: true,
                preferred,
                progressive_soft_sea: false,
                land_bbox: None,
                spread_n: None,
            },
        )
    };
    if let Some(resolved) = player_pick(PLAYER_CAP_SEED_XOR, Some(cap_pos)) {
        cap_pos = resolved;
    } else if let Some(retry) = player_pick(PLAYER_CAP_RETRY_SEED_XOR, None) {
        // FALA 176: zero soft-fail - drugi rzut bez preferred; ostatecznie hard apply i tak
        // dropnie obce stolice kolidujace z graczem.
        cap_pos = retry;
    }

    let mut slots: Vec<ClusterSpawnSlot> = Vec::new();
    let mut next_owner_id: u64 = 1;
    let mut placed_capitals: Vec<HexCoord> = vec![cap_pos];

    // Miasta-panstwa tego samego typu - dopiero po zalozeniu miasta gracza.
    let pending_same_type_rivals = rywale_na_klaster;
    let pending_same_type_rival_hexes: Vec<HexCoord> = player_cluster
        .pending_state_slots
        .as_ref()
        .cloned()
        .unwrap_or_default();

    // Obcy typ: pelny klaster miast-kopii.
    for klaster in &placement.klastry {
        if klaster.typ_index == placement.player_typ_index {
            continue;
        }
        let cap_city = klaster
            .miasta
            .iter()
            .find(|m| m.is_capital)
            .or_else(|| klaster.miasta.first());
        let Some(cap_city) = cap_city else {
            continue;
        };
        let cap = HexCoord::new(cap_city.q, cap_city.r);
        // MAP-SPAWN-Q2 B: lokalny lad >= 70% (jak gracz).
        if !passes_local_land_gate(map, cap.q, cap.r, None, None) {
            continue;
        }
        if !passes_min_capital_separation_gate(cap, &placed_capitals, min_capital_sep) {
            continue;
        }
        for m in &klaster.miasta {
            let owner_id = PlayerId::new(next_owner_id);
            next_owner_id += 1;
            slots.push(ClusterSpawnSlot {
                owner_id,
                hex: HexCoord::new(m.q, m.r),
                city_name: String::new(),
                typ: klaster.typ.clone(),
                is_same_type_rival: false,
                is_player_capital: false,
                is_cluster_capital: Some(m.is_capital),
            });
        }
        placed_capitals.push(cap);
    }

    // Zarezerwuj ownerId dla deferred same-type rivals PO obcych slotach.
    let mut pending_same_type_rival_owner_ids: Vec<PlayerId> = Vec::new();
    for _ in 0..pending_same_type_rivals.max(0) {
        pending_same_type_rival_owner_ids.push(PlayerId::new(next_owner_id));
        next_owner_id += 1;
    }

    // HARD final gate apply: stolice roznych civ >= minCapitalSep (zero fail-open).
    let mut hard_placed_capitals: Vec<HexCoord> = vec![cap_pos];
    let mut hard_accepted_slots: Vec<ClusterSpawnSlot> = Vec::new();
    let mut dropped_foreign_typs: HashSet<String> = HashSet::new();
    for slot in slots {
        if slot.is_cluster_capital == Some(true) {
            if !passes_min_capital_separation_gate(slot.hex, &hard_placed_capitals, min_capital_sep)
            {
                dropped_foreign_typs.insert(slot.typ.clone());
                continue;
            }
            hard_placed_capitals.push(slot.hex);
        }
        if dropped_foreign_typs.contains(&slot.typ) {
            continue;
        }
        hard_accepted_slots.push(slot);
    }
    let hard_cluster_capital_owner_ids: Vec<PlayerId> = hard_accepted_slots
        .iter()
        .filter(|s| s.is_cluster_capital == Some(true))
        .map(|s| s.owner_id)
        .collect();

    let mut used_names_by_civ: HashMap<String, HashSet<String>> = HashMap::new();
    let mut rival_index_by_civ: HashMap<String, i64> = HashMap::new();
    let mut named_accepted_slots: Vec<ClusterSpawnSlot> = Vec::new();
    for slot in hard_accepted_slots {
        let used = used_names_by_civ.entry(slot.typ.clone()).or_default();
        let name = if slot.is_cluster_capital == Some(true) {
            foreign_capital_city_name(&civ_defs, &slot.typ, city_names_pools, Some(&*used))
        } else {
            let rival_index = rival_index_by_civ.get(&slot.typ).copied().unwrap_or(0) + 1;
            rival_index_by_civ.insert(slot.typ.clone(), rival_index);
            cluster_rival_city_name(
                &civ_defs,
                &slot.typ,
                rival_index,
                city_names_pools,
                Some(&*used),
            )
        };
        used.insert(name.clone());
        named_accepted_slots.push(ClusterSpawnSlot {
            city_name: name,
            ..slot
        });
    }

    let foreign_type_clusters = group_foreign_type_clusters(&named_accepted_slots);
    Ok(ClusterSpawnPlan {
        player_start_hex: cap_pos,
        player_start_city_name: player_start_city_name(
            &civ_defs,
            player_typ,
            city_names_pools,
            None,
        ),
        slots: named_accepted_slots,
        foreign_type_clusters,
        placement,
        pending_same_type_rivals,
        pending_same_type_rival_hexes,
        cluster_capital_owner_ids: hard_cluster_capital_owner_ids,
        pending_same_type_rival_owner_ids,
    })
}
