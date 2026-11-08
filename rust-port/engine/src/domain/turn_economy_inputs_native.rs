//! R-RUSTPORT-P6-ECON-TICK-STATE-SOURCES-Q1: natywny dostep do surowcow, granty z tras i etykiety aktywne,
//! 1:1 z `gra/src/main.ts` (pin `4bbef081d`):
//! `placedImprovementsForOwner` (`:5030-5050`), `empireHasGlinianka` (`:5071-5080`),
//! `ownerHasNativeResourceAccess` (`:5088-5121`), `recomputeTradeRouteResourceGrants` (`:5125`),
//! `ownerHasZlotoAccessNow` (`:5180-5184`), `empireActiveResourceLabelsForOwner` (`:3234-3258`).
//!
//! Stan swiata (`cities`, `cityBuilt`, `placedImprovements`, `map`) podaje wolajacy w [`StateSourcesWorld`];
//! funkcje sa czyste i nie mutuja stanu. Reuzywane (NIE duplikowane): `territory::territory_owner_at`,
//! `resource_access::{empire_has_kopalnia_zlota, empire_has_kopalnia_na_zlozu_zelaza, has_zelazo_access}`,
//! `start_position::{empire_has_kopalnia_miedzi, city_has_piec_hutniczy, web_normalize_improvement_key}`,
//! `resource_access::active_access::{compute_empire_livestock_unlocks, get_city_resource_access_for_city}`,
//! `trade::{compute_trade_route_resource_grants, has_trade_route_resource_access}`.
//!
//! ZALOZENIA (do akceptacji): Z-SS-1 `fortTerritoryNodes(fortNodes)` (`main.ts:5001`) dostarcza wolajacy w
//! `extra_territory_nodes` (modul `fort_territory.rs` istnieje, ale stan fortow to wejscie wolajacego);
//! Z-SS-2 `city.kultura` (`main.ts:3244`, pole dynamiczne spoza typu `City`) -> `kultura_by_city` (brak = 0, jak `?? 0`);
//! Z-SS-3 `hex.wlasciciel` -> `hex_owners` (`BuildHex` nie ma pola); Z-SS-4 epoka `empireEpochForOwner` jest calkowita
//! (`Math.max(1, Math.min(10, era))`, `main.ts:2218`), rzutowanie `as i64`; Z-SS-5 `border_radius` = wstrzykniete
//! `cityBorderRadius` (jak Z2 w `active_access.rs`).
//!
//! REPIN-EKONOMIA-F (R-WEB-IRON-NATIVE-ACCESS-FIX-Q1, `main.ts:5506`): natywny dostep do zelaza to teraz
//! `ownerHasNativeZelazoAccess(hasKopalnia, citySurowceSumForOwner, builtIds miast ownera)` (`zelazo-access.ts:101-107`) —
//! dawna wada weba (`boolean` w miejscu `empireStock` => zawsze `false`) zostala w webie NAPRAWIONA i port ja odtwarza.

use std::collections::{BTreeMap, HashMap};

use crate::domain::improvement_build::BuildMap;
use crate::domain::resource_access::active_access::{
    compute_empire_livestock_unlocks, get_city_resource_access_for_city, ResourceAccessCity,
    ResourceAccessOptions,
};
use crate::domain::resource_access::{
    empire_has_kopalnia_na_zlozu_zelaza, empire_has_kopalnia_zlota, owner_has_native_zelazo_access,
    HexZlozeMap, Placed,
};
use crate::domain::start_position::{
    city_has_piec_hutniczy, empire_has_kopalnia_miedzi, web_normalize_improvement_key,
    PlacedImprovement,
};
use crate::domain::terrain::city_founding::p6_6b::cities::City;
use crate::domain::terrain::CityNode;
use crate::domain::territory::{parse_hex_key, territory_owner_at, TerritoryNode};
use crate::domain::trade::{
    compute_trade_route_resource_grants, has_trade_route_resource_access, TradeRoute,
    TradeRouteResourceGrant,
};
use crate::domain::PlayerId;

/// Stan swiata czytany przez zrodla (web: closure `cities`, `cityBuilt`, `placedImprovements`, `map`).
pub struct StateSourcesWorld<'a> {
    pub cities: &'a [City],
    /// `cityBuilt` (`cityId -> budynki`).
    pub built_by_city: &'a BTreeMap<String, Vec<String>>,
    /// `placedImprovements` w kolejnosci wstawiania (`PlacedLayers = string[]`, `main.ts:2893`).
    pub placed: &'a [(String, Vec<String>)],
    /// Z-SS-1: wezly fortow/posterunkow (`fortTerritoryNodes`).
    pub extra_territory_nodes: &'a [TerritoryNode],
    pub map: &'a BuildMap,
    /// Z-SS-3: `hex.wlasciciel` po kluczu `"q,r"`.
    pub hex_owners: &'a HashMap<String, String>,
    /// Z-SS-2: `city.kultura` po `city.id` (brak = 0).
    pub kultura_by_city: &'a BTreeMap<String, f64>,
}

/// Web `buildAllTerritoryNodes` (`main.ts:4991-5003`): miasta `{pop, level: 1, ownerId}` + wezly fortow.
pub fn build_all_territory_nodes(w: &StateSourcesWorld<'_>) -> Vec<TerritoryNode> {
    let mut nodes: Vec<TerritoryNode> = w
        .cities
        .iter()
        .map(|c| {
            TerritoryNode::new(
                CityNode::city(c.q as i32, c.r as i32, c.population),
                c.owner_id,
            )
        })
        .collect();
    nodes.extend(w.extra_territory_nodes.iter().cloned());
    nodes
}

/// Web `placedImprovementsForOwner(ownerId)` (`main.ts:5030-5050`): ulepszenia w terytorium ownera.
pub fn placed_improvements_for_owner(
    w: &StateSourcesWorld<'_>,
    owner_id: i64,
) -> Vec<(String, Vec<String>)> {
    let nodes = build_all_territory_nodes(w);
    let mut out = Vec::new();
    for (hex_key, layers) in w.placed {
        let Some((q, r)) = parse_hex_key(hex_key) else {
            continue;
        };
        if territory_owner_at(q, r, &nodes) == Some(owner_id) {
            out.push((hex_key.clone(), layers.clone()));
        }
    }
    out
}

fn as_placed_map(p: &[(String, Vec<String>)]) -> Vec<(&str, Placed<'_>)> {
    p.iter()
        .map(|(k, v)| (k.as_str(), Placed::Many(v.as_slice())))
        .collect()
}

/// Web `empireHasGlinianka` (`main.ts:5071-5080`).
pub fn empire_has_glinianka(placed: &[(String, Vec<String>)]) -> bool {
    placed.iter().any(|(_, layers)| {
        layers
            .iter()
            .any(|raw| web_normalize_improvement_key(raw).as_deref() == Some("glinianka"))
    })
}

fn hex_zloze_map(w: &StateSourcesWorld<'_>, placed: &[(String, Vec<String>)]) -> HexZlozeMap {
    let mut m = HexZlozeMap::new();
    for (k, _) in placed {
        if let Some(h) = w.map.hex(k) {
            m.insert(k.clone(), h.zloze.clone());
        }
    }
    m
}

fn owner_cities<'a>(
    w: &'a StateSourcesWorld<'_>,
    owner_id: i64,
) -> impl Iterator<Item = (&'a City, &'a [String])> {
    w.cities
        .iter()
        .filter(move |c| c.owner_id == owner_id)
        .map(|c| {
            (
                c,
                w.built_by_city.get(&c.id).map(Vec::as_slice).unwrap_or(&[]),
            )
        })
}

/// Web `citySurowceSumForOwner(ownerId)` (`main.ts:3485`) = `sumCitySurowce(cities.filter(owner).map(c => c.surowce))`
/// (`diplomacy-goods.ts:126-138`): suma `City.surowce` po miastach ownera; wartosci nieskonczone/NaN pomijane.
pub fn city_surowce_sum_for_owner(
    w: &StateSourcesWorld<'_>,
    owner_id: i64,
) -> BTreeMap<String, f64> {
    let mut out: BTreeMap<String, f64> = BTreeMap::new();
    for c in w.cities.iter().filter(|c| c.owner_id == owner_id) {
        let Some(rec) = c.surowce.as_ref() else {
            continue;
        };
        for (k, v) in rec {
            if !v.is_finite() {
                continue;
            }
            *out.entry(k.clone()).or_insert(0.0) += *v;
        }
    }
    out
}

/// Web `ownerHasNativeResourceAccess(ownerId, key)` (`main.ts:5088-5121`), klucze:
/// `braz`, `zelazo`, `cegla`, `zloto`, `kon` (inny klucz => galaz `kon`, jak web).
pub fn owner_has_native_resource_access(
    w: &StateSourcesWorld<'_>,
    owner_id: i64,
    key: &str,
) -> bool {
    let own = placed_improvements_for_owner(w, owner_id);
    match key {
        "braz" => {
            let layers: Vec<PlacedImprovement> = own
                .iter()
                .map(|(_, l)| PlacedImprovement::Layers(l.clone()))
                .collect();
            if !empire_has_kopalnia_miedzi(Some(layers.iter())) {
                return false;
            }
            owner_cities(w, owner_id).any(|(_, built)| city_has_piec_hutniczy(built))
        }
        "zelazo" => {
            let view = as_placed_map(&own);
            let zloze = hex_zloze_map(w, &own);
            let has_kopalnia =
                empire_has_kopalnia_na_zlozu_zelaza(Some(view.as_slice()), Some(&zloze));
            // R-WEB-IRON-NATIVE-ACCESS-FIX-Q1 (`main.ts:5506`): zapas panstwa (`citySurowceSumForOwner`), nie boolean.
            let stock = city_surowce_sum_for_owner(w, owner_id);
            owner_has_native_zelazo_access(
                has_kopalnia,
                Some(&stock),
                owner_cities(w, owner_id).map(|(_, built)| built),
            )
        }
        "cegla" => {
            if !empire_has_glinianka(&own) {
                return false;
            }
            owner_cities(w, owner_id).any(|(_, built)| built.iter().any(|b| b == "cegielnia"))
        }
        "zloto" => {
            let view = as_placed_map(&own);
            empire_has_kopalnia_zlota(Some(view.as_slice()))
        }
        _ => {
            let view = as_placed_map(&own);
            let owner_s = owner_id.to_string();
            compute_empire_livestock_unlocks(
                view.as_slice(),
                w.map,
                Some(owner_s.as_str()),
                Some(w.hex_owners),
            )
            .contains("kon")
        }
    }
}

/// Web `recomputeTradeRouteResourceGrants` (`main.ts:5125`): `computeTradeRouteResourceGrants(tradeRoutes, native)`.
pub fn recompute_trade_route_resource_grants(
    w: &StateSourcesWorld<'_>,
    routes: &[TradeRoute],
) -> Vec<TradeRouteResourceGrant> {
    compute_trade_route_resource_grants(routes, |o, k| {
        owner_has_native_resource_access(w, o.get() as i64, k)
    })
}

/// Czesc `ownerHasZlotoAccessNow` BEZ zapasu w skarbcu (`main.ts:5180-5184`): Kopalnia zlota LUB grant z trasy.
/// To dokladnie wejscie `GameEconomyContext::native_zloto_access` (zapas liczy wiazanie).
pub fn owner_native_or_trade_zloto_access(
    w: &StateSourcesWorld<'_>,
    grants: &[TradeRouteResourceGrant],
    owner_id: i64,
) -> bool {
    owner_has_native_resource_access(w, owner_id, "zloto")
        // Trasy/granty istnieja tylko dla ownerow >= 0 (`PlayerId` bez znaku); owner ujemny nie ma grantu.
        || (owner_id >= 0
            && has_trade_route_resource_access(grants, PlayerId::new(owner_id as u64), "zloto"))
}

/// Web `empireBuiltIdsForOwner` (`main.ts:3217-3226`).
pub fn empire_built_ids_for_owner(
    w: &StateSourcesWorld<'_>,
    owner_id: i64,
) -> std::collections::BTreeSet<String> {
    let mut ids = std::collections::BTreeSet::new();
    for (_, built) in owner_cities(w, owner_id) {
        ids.extend(built.iter().cloned());
    }
    ids
}

/// Web `empireActiveResourceLabelsForOwner(ownerId)` (`main.ts:3234-3258`): unia etykiet aktywnych miast ownera
/// (kolejnosc pierwszego wystapienia, `Set`) + `Cegla` (budynek `cegielnia`) + `Ceramika` (`garncarnia`).
pub fn empire_active_resource_labels_for_owner(
    w: &StateSourcesWorld<'_>,
    owner_id: i64,
    owner_era: i64,
    border_radius: &dyn Fn(f64) -> f64,
) -> Vec<String> {
    let mut labels: Vec<String> = Vec::new();
    let built_empire = empire_built_ids_for_owner(w, owner_id);
    let own = placed_improvements_for_owner(w, owner_id);
    let view = as_placed_map(&own);
    let owner_s = owner_id.to_string();
    for (c, built) in owner_cities(w, owner_id) {
        let access = get_city_resource_access_for_city(
            ResourceAccessCity {
                q: c.q as i32,
                r: c.r as i32,
                population: c.population,
                kultura: Some(w.kultura_by_city.get(&c.id).copied().unwrap_or(0.0)),
            },
            w.map,
            Some(view.as_slice()),
            owner_era,
            border_radius,
            ResourceAccessOptions {
                built_ids: Some(built),
                empire_livestock_unlocks: None,
                empire_stock: None,
                owner_id: Some(owner_s.as_str()),
                hex_owners: Some(w.hex_owners),
            },
        );
        for l in access.active {
            if !labels.contains(&l) {
                labels.push(l);
            }
        }
    }
    if built_empire.contains("cegielnia") && !labels.iter().any(|l| l == "Cegła") {
        labels.push("Cegła".to_string());
    }
    if built_empire.contains("garncarnia") && !labels.iter().any(|l| l == "Ceramika") {
        labels.push("Ceramika".to_string());
    }
    labels
}

/// Pomocnik wiazania: gotowe wejscia `GameEconomyContext` (`native_zloto_access`, `empire_active_labels`) ze stanu.
pub struct StateSources<'a> {
    pub world: StateSourcesWorld<'a>,
    pub grants: Vec<TradeRouteResourceGrant>,
    pub owner_era: &'a dyn Fn(i64) -> f64,
    pub border_radius: &'a dyn Fn(f64) -> f64,
}

impl<'a> StateSources<'a> {
    /// `recomputeTradeRouteResourceGrants()` zaraz po odswiezeniu tras (`main.ts:5125`).
    pub fn new(
        world: StateSourcesWorld<'a>,
        routes: &[TradeRoute],
        owner_era: &'a dyn Fn(i64) -> f64,
        border_radius: &'a dyn Fn(f64) -> f64,
    ) -> Self {
        let grants = recompute_trade_route_resource_grants(&world, routes);
        Self {
            world,
            grants,
            owner_era,
            border_radius,
        }
    }

    /// Wejscie `native_zloto_access`.
    pub fn native_zloto_access(&self, owner_id: i64) -> bool {
        owner_native_or_trade_zloto_access(&self.world, &self.grants, owner_id)
    }

    /// Wejscie `empire_active_labels`.
    pub fn empire_active_labels(&self, owner_id: i64) -> Vec<String> {
        empire_active_resource_labels_for_owner(
            &self.world,
            owner_id,
            (self.owner_era)(owner_id) as i64,
            self.border_radius,
        )
    }

    /// R-RUSTPORT-P6-ECON-TICK-ORDER-LANE-Q1: `orderMultMap` (`main.ts:35789`) jako zrodlo stanu ticku. Mapa jest
    /// PRODUKTEM petli porzadku (`order_effects_lane::compute_order_lane`, `main.ts:35358-35789`) liczonej PO ticku z
    /// jego `econ.perCity`; wynik zasila `order_mult_by_city` KOLEJNEGO ticku (web: mapa trwala miedzy turami, `state`).
    /// `ctx.owner_era` ma byc tym samym resolverem co `StateSources::owner_era` (`empireEpochForOwner`).
    pub fn order_mult_map(
        &self,
        cities: &mut [crate::domain::order_effects_lane::OrderLaneCity],
        state: &mut crate::domain::order_effects_lane::OrderLaneState,
        ctx: &crate::domain::order_effects_lane::OrderLaneCtx<'_>,
    ) -> (
        crate::domain::order_effects_lane::OrderLaneOutput,
        BTreeMap<String, crate::domain::turn_economy_loop::OrderYieldMults>,
    ) {
        let out = crate::domain::order_effects_lane::compute_order_lane(cities, state, ctx);
        (out, state.order_mult_map.clone())
    }
}
