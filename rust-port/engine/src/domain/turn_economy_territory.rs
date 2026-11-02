//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q2A-Q1: wejscia terenowe ticku ekonomii `advanceCityEconomy`
//! (web pin `4bbef081d`, `gra/src/game/turn-economy.ts`) liczone z `state::City` + mapy.
//!
//! Portowane (numery linii = web):
//! * `computeTerritoryResourceYieldByCity` (`:738-782`) -> [`compute_territory_resource_yield_by_city`];
//! * `computeWorkedMagazynYieldsByCity` (`:824-854`) + `cityWorkedTilesForEconomy` (`:624-681`) ->
//!   [`compute_worked_magazyn_yields_by_city`];
//! * wiazanie z `advanceCityEconomy` (`:2296-2306`): `buildTerritoryNodesFromCities`,
//!   `computeLostToNearerSiblingByCity`, `reconcileAllWorkedTiles` -> [`compute_terrain_inputs`].
//!
//! ROZBIEZNOSC TYPOW (zmierzona, ETAP 1): `state::City` (`state.rs:1683`, `q`/`r` jako `f64`,
//! `okolica_focus`/`okolica_tryb`/`okolica_reczne: Option<Reczne>`) vs `territory::WorkCity`
//! (`territory.rs:299`, `q`/`r` jako `i32`, `okolica_reczne: Option<BTreeMap<String, f64>>` BEZ
//! kolejnosci wstawiania, bez focus/tryb) vs `okolica::OkolicaCity` (`okolica.rs:102`, `q`/`r` jako
//! `i32`, `focus`/`tryb`/`reczne` plaskie, `reczne: Option<Reczne>`). Adaptery [`work_city_of`] i
//! [`okolica_city_of`] sa widokami (kopia pol), istniejace typy sa bez zmian.
//!
//! Zalozenia:
//! * wspolrzedne miasta `q`/`r` (`f64` w `state::City`) sa calkowite jak w webie (`hexes["q,r"]`);
//!   adapter rzutuje `as i32` (ulamkowe wspolrzedne: NIE_ZMIERZONO);
//! * `BuildMap` ma klucz heksa == `coords` (ZALOZENIE Z9 `improvement_build.rs`), a kolejnosc
//!   `BuildMap::hexes()` == `Object.keys(map.hexes)` (kolejnosc wstawiania).

use std::collections::{BTreeMap, BTreeSet};

use crate::data::terrain_map::TerrainYieldsFile;
use crate::domain::economy_yield::{tile_yield_full, WorkedTileImpInput};
use crate::domain::improvement_build::{BuildHex, BuildMap};
use crate::domain::improvements::{
    improvement_keys_for_hex, territory_resource_yield_for_improvement, HexLike, TerrainType,
    TileYield,
};
use crate::domain::okolica::{
    compute_lost_to_nearer_sibling_by_city, is_land_workable_hex, resolve_worked_tiles,
    OkolicaCity, OkolicaYield, ResolveWorkedTilesOpts,
};
use crate::domain::terrain::city_founding::p6_6b::cities::City;
use crate::domain::terrain::city_range_for_population;
use crate::domain::territory::{
    build_territory_nodes_from_cities, reconcile_all_worked_tiles, territory_owner_at,
    TerritoryNode, WorkCity,
};
use crate::domain::turn_economy_resources::{TerritoryResourceYield, WorkedMagazynYield};

/// Mapa + tabela plonow terenu (web `GameMap` + `terrain-yields.json`).
#[derive(Clone, Copy)]
pub struct TerrainContext<'a> {
    pub map: &'a BuildMap,
    pub terrain_yields: &'a TerrainYieldsFile,
}

/// Wejscia terenowe ticku (web: `territoryResourceByCity`, `workedMagazynByCity`,
/// `lostToSiblingByCity`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct TerrainInputs {
    pub territory_resource_by_city: BTreeMap<String, TerritoryResourceYield>,
    pub worked_magazyn_by_city: BTreeMap<String, WorkedMagazynYield>,
    pub lost_to_sibling_by_city: BTreeMap<String, BTreeSet<String>>,
}

/// Adapter `state::City` -> `WorkCity` (`territory.rs:299`). `Reczne` (uporzadkowane) -> `BTreeMap`.
pub fn work_city_of(c: &City) -> WorkCity {
    WorkCity {
        id: c.id.clone(),
        owner_id: c.owner_id,
        q: c.q as i32,
        r: c.r as i32,
        population: c.population,
        okolica_reczne: c
            .okolica_reczne
            .as_ref()
            .map(|r| r.iter().map(|(k, v)| (k.to_owned(), v)).collect()),
    }
}

/// Adapter `state::City` -> `OkolicaCity` (`okolica.rs:102`).
pub fn okolica_city_of(c: &City) -> OkolicaCity {
    OkolicaCity {
        id: c.id.clone(),
        owner_id: c.owner_id,
        q: c.q as i32,
        r: c.r as i32,
        population: c.population,
        focus: c.okolica_focus,
        tryb: c.okolica_tryb,
        reczne: c.okolica_reczne.clone(),
    }
}

/// Web `buildTerritoryNodesFromCities(cities)` (`territory-work.ts:10`) na `state::City`.
pub fn territory_nodes_of(cities: &[City]) -> Vec<TerritoryNode> {
    let work: Vec<WorkCity> = cities.iter().map(work_city_of).collect();
    build_territory_nodes_from_cities(&work)
}

/// Web `reconcileAllWorkedTiles(cities, nodes, lost)` (`:2306`) zapisujacy wynik w `City.okolica_reczne`.
/// Reconcile tylko USUWA klucze, wiec zapis = usuniecie z `Reczne` kluczy nieobecnych w wyniku
/// (zachowuje kolejnosc wstawiania pozostalych, jak `delete` w JS).
pub fn reconcile_city_worked_tiles(
    cities: &mut [City],
    territory_nodes: &[TerritoryNode],
    lost_to_sibling_by_city: &BTreeMap<String, BTreeSet<String>>,
) {
    let mut work: Vec<WorkCity> = cities.iter().map(work_city_of).collect();
    reconcile_all_worked_tiles(&mut work, territory_nodes, Some(lost_to_sibling_by_city));
    for (city, w) in cities.iter_mut().zip(work) {
        let (Some(reczne), Some(kept)) = (city.okolica_reczne.as_mut(), w.okolica_reczne) else {
            continue;
        };
        let stale: Vec<String> = reczne
            .iter()
            .filter(|(k, _)| !kept.contains_key(*k))
            .map(|(k, _)| k.to_owned())
            .collect();
        for key in stale {
            reczne.remove(&key);
        }
    }
}

/// Klucz `TerenBazowy` (web `types/hex.ts`) dla wiersza `terrain-yields.json`.
fn terrain_web_key(t: TerrainType) -> &'static str {
    match t {
        TerrainType::Grassland => "laka",
        TerrainType::Plains => "rownina",
        TerrainType::Hills => "wzgorza",
        TerrainType::Mountains => "gory",
        TerrainType::ShallowWater => "plytkie_morze",
        TerrainType::Ocean => "morze",
        TerrainType::Desert => "pustynia",
        TerrainType::Tundra => "polarny",
    }
}

fn hex_like_of(hex: &BuildHex) -> HexLike {
    HexLike {
        ulepszenie: hex.ulepszenie.clone(),
        ulepszenia: hex.ulepszenia.clone(),
        nakladka: Some(hex.overlay),
        zloze: hex.zloze.clone(),
    }
}

/// Web `tileYield(hexToWorkedTile(hex))` (`:588-598`, `economy.ts` `tileYield`).
pub fn hex_tile_yield(terrain_yields: &TerrainYieldsFile, hex: &BuildHex) -> TileYield {
    let keys = improvement_keys_for_hex(&hex_like_of(hex));
    tile_yield_full(
        terrain_yields,
        &WorkedTileImpInput {
            teren_bazowy: terrain_web_key(hex.terrain),
            nakladka: hex.overlay.web_value(),
            ma_rzeke: hex.river_present,
            ulepszenia_keys: if keys.is_empty() { None } else { Some(&keys) },
            ulepszenie_key: keys.first().map(String::as_str),
            zloze: hex.zloze.as_deref(),
        },
    )
}

/// Web `hexDistance` (`units/setup.ts:358`): `max(|dq|, |dr|, |ds|)`.
fn hex_distance(aq: f64, ar: f64, bq: f64, br: f64) -> f64 {
    let dq = (aq - bq).abs();
    let dr = (ar - br).abs();
    let ds = ((-aq - ar) - (-bq - br)).abs();
    dq.max(dr).max(ds)
}

/// `rec[key] = (rec[key] ?? 0) + amount`. Klucz spoza dziewieciu `TerritoryResourceKey` = panika
/// (niezmiennik danych; pokryty testem `territory_resource_keys_all_mapped`).
fn add_territory_amount(rec: &mut TerritoryResourceYield, key: &str, amount: f64) {
    let slot = match key {
        "drewno" => &mut rec.drewno,
        "kamien" => &mut rec.kamien,
        "glina" => &mut rec.glina,
        "ruda" => &mut rec.ruda,
        "ruda_zelaza" => &mut rec.ruda_zelaza,
        "ruda_cyny" => &mut rec.ruda_cyny,
        "sol" => &mut rec.sol,
        "zloto" => &mut rec.zloto,
        "kon" => &mut rec.kon,
        other => panic!("TerritoryResourceKey spoza listy: {other}"),
    };
    *slot = Some(slot.unwrap_or(0.0) + amount);
}

/// Web `computeTerritoryResourceYieldByCity` (`:738-782`). Iteracja po heksach w kolejnosci mapy;
/// przypisanie do NAJBLIZSZEGO miasta wlasciciela terytorium (remis: pierwsze w tablicy).
pub fn compute_territory_resource_yield_by_city(
    cities: &[City],
    map: &BuildMap,
    territory_nodes: &[TerritoryNode],
    resolve_owner_era: &dyn Fn(i64) -> f64,
) -> BTreeMap<String, TerritoryResourceYield> {
    let mut out: BTreeMap<String, TerritoryResourceYield> = BTreeMap::new();
    if cities.is_empty() {
        return out;
    }
    let nearest_owner_city_id = |q: f64, r: f64, owner_id: i64| -> Option<&str> {
        let mut best: Option<&str> = None;
        let mut best_dist = f64::INFINITY;
        for c in cities {
            if c.owner_id != owner_id {
                continue;
            }
            let d = hex_distance(q, r, c.q, c.r);
            if d < best_dist {
                best_dist = d;
                best = Some(c.id.as_str());
            }
        }
        best
    };
    for hex in map.hexes() {
        let keys = improvement_keys_for_hex(&hex_like_of(hex));
        if keys.is_empty() {
            continue;
        }
        let (q, r) = (f64::from(hex.q), f64::from(hex.r));
        let Some(owner) = territory_owner_at(q, r, territory_nodes) else {
            continue;
        };
        let Some(city_id) = nearest_owner_city_id(q, r, owner) else {
            continue;
        };
        for key in &keys {
            let Some(row) = territory_resource_yield_for_improvement(
                Some(key),
                hex.zloze.as_deref(),
                Some(resolve_owner_era(owner)),
            ) else {
                continue;
            };
            let rec = out.entry(city_id.to_owned()).or_default();
            add_territory_amount(rec, &row.resource_key, row.amount);
        }
    }
    out
}

/// Web `cityWorkedTilesForEconomy` (`:624-681`) zwracajaca HEKSY (centrum + przypisane pola).
fn city_worked_hexes<'m>(
    city: &City,
    ctx: &TerrainContext<'m>,
    territory_nodes: &[TerritoryNode],
    exclude: Option<&BTreeSet<String>>,
) -> Vec<&'m BuildHex> {
    let map = ctx.map;
    let mut out = Vec::new();
    let key_of = |q: f64, r: f64| format!("{},{}", q as i32, r as i32);
    if let Some(h) = map.hex(&key_of(city.q, city.r)) {
        out.push(h);
    }
    let pop = {
        let f = city.population.floor();
        if f.is_nan() {
            f
        } else {
            f.max(0.0)
        }
    };
    if pop <= 0.0 {
        return out;
    }
    let radius = city_range_for_population(pop);
    let yield_of = |q: i32, r: i32| -> OkolicaYield {
        match map.hex(&format!("{q},{r}")) {
            None => OkolicaYield::default(),
            Some(h) => {
                let y = hex_tile_yield(ctx.terrain_yields, h);
                OkolicaYield {
                    zywnosc: y.zywnosc,
                    praca: y.praca,
                    handel: y.handel,
                }
            }
        }
    };
    let land = |q: i32, r: i32| is_land_workable_hex(map, q, r);
    let assigned = resolve_worked_tiles(
        &okolica_city_of(city),
        map,
        &yield_of,
        &ResolveWorkedTilesOpts {
            radius: Some(radius),
            territory_nodes: Some(territory_nodes),
            owner_id: Some(city.owner_id),
            is_workable: Some(&land),
            exclude_hex_keys: exclude,
            ..ResolveWorkedTilesOpts::default()
        },
    );
    for t in assigned {
        if let Some(h) = map.hex(&t.key) {
            out.push(h);
        }
    }
    out
}

/// Web `computeWorkedMagazynYieldsByCity` (`:824-854`): suma drewno/kamien/glina z `tileYield` po
/// polach miasta; wpis tylko gdy ktorakolwiek suma > 0.
pub fn compute_worked_magazyn_yields_by_city(
    cities: &[City],
    ctx: &TerrainContext<'_>,
    territory_nodes: &[TerritoryNode],
    lost_to_sibling_by_city: &BTreeMap<String, BTreeSet<String>>,
) -> BTreeMap<String, WorkedMagazynYield> {
    let mut out = BTreeMap::new();
    for city in cities {
        let worked = city_worked_hexes(
            city,
            ctx,
            territory_nodes,
            lost_to_sibling_by_city.get(&city.id),
        );
        let (mut drewno, mut kamien, mut glina) = (0.0, 0.0, 0.0);
        for h in worked {
            let y = hex_tile_yield(ctx.terrain_yields, h);
            drewno += y.drewno;
            kamien += y.kamien;
            glina += y.glina;
        }
        if drewno > 0.0 || kamien > 0.0 || glina > 0.0 {
            out.insert(
                city.id.clone(),
                WorkedMagazynYield {
                    drewno,
                    kamien,
                    glina,
                },
            );
        }
    }
    out
}

/// Wiazanie `advanceCityEconomy` `:2296-2310` + `:2476`: wezly terytorium -> spor sasiadow ->
/// reconcile `okolica_reczne` (MUTUJE `cities`) -> plony terytorium -> plony magazynowe.
/// `resolve_owner_era` = `resolveOwnerEra ?? (ownerId === 0 ? playerEra : 1)`.
pub fn compute_terrain_inputs(
    cities: &mut [City],
    ctx: &TerrainContext<'_>,
    resolve_owner_era: &dyn Fn(i64) -> f64,
) -> TerrainInputs {
    let territory_nodes = territory_nodes_of(cities);
    let okolica: Vec<OkolicaCity> = cities.iter().map(okolica_city_of).collect();
    let lost = compute_lost_to_nearer_sibling_by_city(&okolica, ctx.map);
    reconcile_city_worked_tiles(cities, &territory_nodes, &lost);
    let territory_resource_by_city = compute_territory_resource_yield_by_city(
        cities,
        ctx.map,
        &territory_nodes,
        resolve_owner_era,
    );
    let worked_magazyn_by_city =
        compute_worked_magazyn_yields_by_city(cities, ctx, &territory_nodes, &lost);
    TerrainInputs {
        territory_resource_by_city,
        worked_magazyn_by_city,
        lost_to_sibling_by_city: lost,
    }
}
