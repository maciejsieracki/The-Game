//! R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW: producent nakladek `tradeRoutes`, `workerFields`
//! i `okolica` (kontrakt DTO §3.7, typy `civ-view-model` z P4-1F1 bez zmian).
//!
//! Zrodlo prawdy: web na pinie `07d2fbd72` (`gra/src/…`):
//! * szlaki = `refreshTradeRoutesOverlay` (`main.ts:15379-15397`): przelacznik i panel miasta
//!   (`:15381-15382`), pusta lista (`:15383`), `cityById = new Map(cities.map(...))` (`:15384`, przy
//!   zdublowanym id wygrywa OSTATNIE miasto), filtr `status === 'polaczony'` (`:15387`), filtr cudzej
//!   trasy z literalem `0` (`:15388`, NIE widz — rozpoznanie P4-1F §5 pkt 3), brak miasta (`:15389-15391`),
//!   wejscie `TradeRouteOverlayInput` (`render/tradeRoutesOverlay.ts:18-24`), kolejnosc = `tradeRoutes`;
//! * pola robotnikow = `refreshWorkerFieldOverlay` (`main.ts:15432-15448`): przelacznik i panel miasta
//!   (`:15434`), `collectWorkedHexOwnerMap(cities, map, { isWorkable: okolicaHexWorkable, territoryNodes:
//!   buildAllTerritoryNodes(), eraForOwner: empireEpochForOwner })` (`:15435-15439`, `game/okolica.ts:811-834`),
//!   kolejnosc `Map`; mgla NIE filtruje wpisow (web tylko przyciemnia sprite'y w rendererze, `:15442-15447`);
//! * okolica = `syncOkolicaOverlay` (`main.ts:6644-6666`): panel miasta (`:6645`), `cities.find` po id
//!   (`:6649-6650`), tylko miasto aktywnego fotela `isMe(city.ownerId)` (`:6651`, `isMe` = `ownerId === ME()`,
//!   `main.ts:13748-13750`), `range: cityRangeForPopulation(city.population)` (`:6658`, populacja NIE
//!   zaokraglona), `workedKeys: okolicaWorkedKeySet(city)` (`:6625-6635`: `resolveWorkedTiles` z plonem z
//!   epoka wlasciciela, `isWorkable`, `territoryNodes`, `ownerId`, `excludeHexKeys:
//!   siblingClaimedHexKeysForCity(city)` = `computeLostToNearerSiblingByCity(cities, map).get(city.id)`,
//!   `main.ts:5701-5703`), `yieldOf` z epoka wlasciciela (`:6660`), `showYields: true` (`:6661`), `ownerId`
//!   miasta (`:6664`).
//!
//! Decyzje techniczne (raport `01-operator-r1.md`):
//! * Z-1F4-1 (stan tras): web trzyma `tradeRoutes` jako zmienna modulu `main.ts` (`:3454`), poza `GameState`;
//!   `PlayableState` nie ma tego pola. Trasy podaje WOLAJACY (`&[TradeRoute]`, typ `trade.rs:427`) —
//!   `PlayableState` i zapis bez zmian.
//! * Z-1F4-2 (miasta): wejscie = `&[City]` (`state.rs`, model ekonomii z `okolicaFocus/okolicaTryb/
//!   okolicaReczne`, ktorych `PlayableCity` nie niesie — rozpoznanie §3 pkt 5) w kolejnosci webowego `cities`.
//!   `City.id` (tekst) laczy sie z `TradeRoute.fromCityId/toCityId` (tekst) i z id panelu miasta (`CityId`
//!   DTO) przez zapis dziesietny (konwencja `war_world_view.rs:83-84`: `city.id.get().to_string()`).
//! * Z-1F4-3 (`okolica.yields`): wpis dla KAZDEGO heksa zasiegu (`collectRangeKeys`,
//!   `render/cityOkolicaOverlay.ts:239-249`), w kolejnosci `hexKeysWithinRadius` (`game/okolica.ts:66-89`).
//!   Filtr etykiet (`Morze`/`Gory`, ulepszenie kryjace, pusta etykieta; `cityOkolicaOverlay.ts:283-296`)
//!   zostaje w rendererze (P4-1G), ktory zna teren i `coveringImprovement` z `MapViewDto`; `yieldOf` jest
//!   czysty, wiec nadmiar wpisow nie zmienia obrazu.
//! * Z-1F4-4: `isCityPanelOpen()` i `getOpenCityPanelCityId()` to w webie dwa rozne odczyty
//!   (`ui/cityPanel.ts:12569-12576`: ramka UX vs `activeCity`), wiec [`OverlaysUi`] niesie oba pola.
//! * Z-1F4-5: wspolrzedne miasta `q/r` (`f64`) rzutowane `as i32` jak `okolica_city_of`
//!   (`turn_economy_territory.rs:77-88`).
#![forbid(unsafe_code)]

use std::collections::HashMap;
use std::fmt;

use civ_view_model::{
    CityId, HexCoord, OkolicaViewDto, OwnerRef, TileYieldDto, TradeMedium, TradeRouteDto,
    WorkerFieldDto,
};

use crate::data::terrain_map::TerrainYieldsFile;
use crate::domain::improvement_build::{hex_keys_within_radius, BuildMap};
use crate::domain::okolica::{
    collect_worked_hex_owner_map_by_owner_yield, compute_lost_to_nearer_sibling_by_city,
    is_land_workable_hex, resolve_worked_tiles, OkolicaCity, OkolicaYield, ResolveWorkedTilesOpts,
};
use crate::domain::terrain::city_founding::p6_6b::cities::City;
use crate::domain::terrain::{axial_distance, city_range_for_population};
use crate::domain::territory::TerritoryNode;
use crate::domain::trade::{TradeRoute, TradeRouteMedium, TradeRouteStatus};
use crate::domain::turn_economy_territory::{hex_tile_yield, okolica_city_of};

/// Swiat czytany przez producenta (web: domkniecia `cities`, `map`, `buildAllTerritoryNodes()`,
/// `empireEpochForOwner`). Tylko odczyt.
#[derive(Clone, Copy)]
pub struct OverlaysWorld<'a> {
    /// Web `cities` w kolejnosci tablicy (Z-1F4-2).
    pub cities: &'a [City],
    /// Web `map`.
    pub map: &'a BuildMap,
    /// `terrain-yields.json` (plon heksa, `yieldOfMapHex`).
    pub terrain_yields: &'a TerrainYieldsFile,
    /// Web `buildAllTerritoryNodes()` (`main.ts:5667-5678`: miasta + forty/posterunki).
    pub territory_nodes: &'a [TerritoryNode],
    /// Web `empireEpochForOwner(ownerId)` (`main.ts:2419`).
    pub era_for_owner: &'a dyn Fn(i64) -> f64,
}

/// Stan UI czytany przez nakladki (web: zmienne `main.ts`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct OverlaysUi {
    /// `showTradeRoutesOverlay` (domyslnie `true`, `main.ts:15358`, reset `:15455`).
    pub show_trade_routes: bool,
    /// `showWorkerOverlay` (domyslnie `true`, `main.ts:15419`, reset `:15453`).
    pub show_worker_overlay: bool,
    /// `isCityPanelOpen()` (`ui/cityPanel.ts:12569-12571`: ramka UX miasta otwarta).
    pub city_panel_open: bool,
    /// `getOpenCityPanelCityId()` (`ui/cityPanel.ts:12574-12576`: `activeCity?.id ?? null`).
    pub open_city_id: Option<CityId>,
    /// `ME()` — aktywny fotel czlowieka (`main.ts:13729-13731`).
    pub viewer_owner_id: i64,
}

/// Wartosc stanu bez reprezentacji w DTO.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum OverlaysViewError {
    /// `ownerId` miasta spoza `OwnerRef` (gracz `0..=2^53-1`, `-1`, `-99`).
    OwnerOutOfRange(i64),
}

impl fmt::Display for OverlaysViewError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::OwnerOutOfRange(v) => write!(f, "ownerId {v} poza zakresem OwnerRef"),
        }
    }
}

impl std::error::Error for OverlaysViewError {}

fn owner_ref(owner_id: i64) -> Result<OwnerRef, OverlaysViewError> {
    OwnerRef::from_legacy_i64(owner_id).ok_or(OverlaysViewError::OwnerOutOfRange(owner_id))
}

fn city_hex(c: &City) -> HexCoord {
    HexCoord::new(c.q as i32, c.r as i32)
}

/// Web `yieldOfMapHex(map, q, r, ownerEra)` (`game/okolica.ts:459-477`): brak heksa = `{}`.
fn map_hex_yield(world: &OverlaysWorld<'_>, q: i32, r: i32, owner_era: f64) -> TileYieldDto {
    match world.map.hex(&format!("{q},{r}")) {
        None => TileYieldDto {
            zywnosc: None,
            praca: None,
            handel: None,
        },
        Some(h) => {
            let y = hex_tile_yield(world.terrain_yields, h, Some(owner_era));
            TileYieldDto {
                zywnosc: Some(y.zywnosc),
                praca: Some(y.praca),
                handel: Some(y.handel),
            }
        }
    }
}

/// Plon do rankingu okolicy (`TileYield` weba; brak pola = `0` w `tileAssignScore`).
fn okolica_yield(world: &OverlaysWorld<'_>, q: i32, r: i32, owner_era: f64) -> OkolicaYield {
    let y = map_hex_yield(world, q, r, owner_era);
    OkolicaYield {
        zywnosc: y.zywnosc.unwrap_or(0.0),
        praca: y.praca.unwrap_or(0.0),
        handel: y.handel.unwrap_or(0.0),
    }
}

fn okolica_cities(cities: &[City]) -> Vec<OkolicaCity> {
    cities.iter().map(okolica_city_of).collect()
}

/// `overlays.tradeRoutes` — web `refreshTradeRoutesOverlay` (`main.ts:15379-15397`).
#[must_use]
pub fn trade_routes_view(
    routes: &[TradeRoute],
    cities: &[City],
    ui: &OverlaysUi,
) -> Vec<TradeRouteDto> {
    let mut out = Vec::new();
    if !ui.show_trade_routes || ui.city_panel_open || routes.is_empty() {
        return out;
    }
    // `new Map(cities.map(c => [c.id, c]))`: przy zdublowanym id wygrywa ostatni wpis.
    let mut city_by_id: HashMap<&str, &City> = HashMap::new();
    for c in cities {
        city_by_id.insert(c.id.as_str(), c);
    }
    for route in routes {
        if route.status != TradeRouteStatus::Connected {
            continue;
        }
        // `:15388` — literal `0`, nie widz (R2-3: trasa AI<->AI / wewnetrzna obcych).
        if route.owner_id.get() != 0 && route.to_owner_id.get() != 0 {
            continue;
        }
        let (Some(from), Some(to)) = (
            city_by_id.get(route.from_city_id.as_str()),
            city_by_id.get(route.to_city_id.as_str()),
        ) else {
            continue;
        };
        out.push(TradeRouteDto {
            from: city_hex(from),
            to: city_hex(to),
            medium: match route.medium {
                TradeRouteMedium::Land => TradeMedium::Lad,
                TradeRouteMedium::Sea => TradeMedium::Morze,
            },
        });
    }
    out
}

/// `overlays.workerFields` — web `refreshWorkerFieldOverlay` (`main.ts:15432-15448`), kolejnosc `Map`
/// z [`collect_worked_hex_owner_map_by_owner_yield`]; bez filtra mgly.
pub fn worker_fields_view(
    world: &OverlaysWorld<'_>,
    ui: &OverlaysUi,
) -> Result<Vec<WorkerFieldDto>, OverlaysViewError> {
    if !ui.show_worker_overlay || ui.city_panel_open {
        return Ok(Vec::new());
    }
    let cities = okolica_cities(world.cities);
    let land = |q: i32, r: i32| is_land_workable_hex(world.map, q, r);
    let yield_of_for_owner =
        |owner: i64, q: i32, r: i32| okolica_yield(world, q, r, (world.era_for_owner)(owner));
    let worked = collect_worked_hex_owner_map_by_owner_yield(
        &cities,
        world.map,
        &yield_of_for_owner,
        Some(&land),
        Some(world.territory_nodes),
    );
    worked
        .into_iter()
        .filter_map(|(key, owner)| world.map.hex(&key).map(|h| (h.q, h.r, owner)))
        .map(|(q, r, owner)| {
            Ok(WorkerFieldDto {
                hex: HexCoord::new(q, r),
                owner_id: owner_ref(owner)?,
            })
        })
        .collect()
}

/// `overlays.okolica` — web `syncOkolicaOverlay` (`main.ts:6644-6666`) z `okolicaWorkedKeySet`
/// (`:6625-6635`). `None` = brak warstwy (panel zamkniety, brak miasta, miasto innego fotela).
pub fn okolica_view(
    world: &OverlaysWorld<'_>,
    ui: &OverlaysUi,
) -> Result<Option<OkolicaViewDto>, OverlaysViewError> {
    if !ui.city_panel_open {
        return Ok(None);
    }
    let Some(city_id) = ui.open_city_id else {
        return Ok(None);
    };
    let wanted = city_id.get().to_string();
    let Some(city) = world.cities.iter().find(|c| c.id == wanted) else {
        return Ok(None);
    };
    if city.owner_id != ui.viewer_owner_id {
        return Ok(None);
    }
    let owner_era = (world.era_for_owner)(city.owner_id);
    let range = city_range_for_population(city.population);

    // `okolicaWorkedKeySet(city)` (`:6625-6635`).
    let all = okolica_cities(world.cities);
    let lost = compute_lost_to_nearer_sibling_by_city(&all, world.map);
    let land = |q: i32, r: i32| is_land_workable_hex(world.map, q, r);
    let yield_of = |q: i32, r: i32| okolica_yield(world, q, r, owner_era);
    let worked = resolve_worked_tiles(
        &okolica_city_of(city),
        world.map,
        &yield_of,
        &ResolveWorkedTilesOpts {
            is_workable: Some(&land),
            territory_nodes: Some(world.territory_nodes),
            owner_id: Some(city.owner_id),
            exclude_hex_keys: lost.get(&city.id),
            ..ResolveWorkedTilesOpts::default()
        },
    );
    // `new Set(worked.map(t => t.key))`: pierwsze wystapienie klucza wyznacza pozycje.
    let mut worked_hexes: Vec<HexCoord> = Vec::new();
    for t in &worked {
        let hex = HexCoord::new(t.q, t.r);
        if !worked_hexes.contains(&hex) {
            worked_hexes.push(hex);
        }
    }

    // `collectRangeKeys` (`render/cityOkolicaOverlay.ts:239-249`) + `yieldOf` (Z-1F4-3).
    let center = city_hex(city);
    let mut yields = Vec::new();
    for key in hex_keys_within_radius(center.q, center.r, range, world.map) {
        let Some(h) = world.map.hex(&key) else {
            continue;
        };
        if axial_distance(center.q, center.r, h.q, h.r) <= range {
            yields.push((
                HexCoord::new(h.q, h.r),
                map_hex_yield(world, h.q, h.r, owner_era),
            ));
        }
    }

    Ok(Some(OkolicaViewDto {
        city_id,
        city_hex: center,
        range,
        worked_hexes,
        yields,
        show_yields: Some(true),
        owner_id: owner_ref(city.owner_id)?,
    }))
}
