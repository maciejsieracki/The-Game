//! P6.8G (runda 4, N1): wpiecie haka `PopulationChangeHooks::rebalance_workers_after_population_change`
//! (`city_growth.rs`, wolany przez `applyPostCentralPopulationGrowth` po zmianie populacji; web
//! `rebalanceWorkersAfterPopulationChange`, `okolica.ts:437`). Adapter posiada mape, plony
//! (`yieldOfMapHex` wstrzykiwane) i terytorium; pamiec trybu recznego to `City::okolica_reczne`.
//! ZALOZENIE (r4): `onCityPopulationChanged` (callback UI, web) nie ma konsumenta w Rust - no-op.

use std::collections::BTreeSet;

use super::*;
use crate::domain::city_growth::p6_7a::growth_v85::{GrowthCity, PopulationChangeHooks};

/// Adapter haka rebalansu: `map`, `yield_of` i `territory` pochodza od wywolujacego (jak w webie).
pub struct OkolicaPopulationHook<'a> {
    pub map: &'a BuildMap,
    pub yield_of: &'a dyn Fn(i32, i32) -> OkolicaYield,
    pub territory: Option<&'a [TerritoryNode]>,
}

impl PopulationChangeHooks for OkolicaPopulationHook<'_> {
    fn rebalance_workers_after_population_change(
        &mut self,
        city: &mut GrowthCity,
        pop_before: f64,
        pop_after: f64,
        exclude_hex_keys: Option<&BTreeSet<String>>,
    ) {
        let c = &mut city.city;
        let mut oc = OkolicaCity {
            id: c.id.clone(),
            owner_id: c.owner_id,
            q: c.q as i32,
            r: c.r as i32,
            population: pop_after,
            focus: c.okolica_focus,
            tryb: c.okolica_tryb,
            reczne: c.okolica_reczne.take(),
        };
        rebalance_workers_after_population_change(
            &mut oc,
            self.map,
            self.yield_of,
            pop_before,
            pop_after,
            self.territory,
            exclude_hex_keys,
        );
        c.okolica_reczne = oc.reczne;
    }

    fn on_city_population_changed(&mut self, _city_id: &str) {}
}
