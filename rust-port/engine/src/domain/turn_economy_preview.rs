//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q4-Q1 (dlug -Q4b, pin weba `4bbef081d`): port 1:1
//! `simulateResourcePipelineForPreview` (`gra/src/game/turn-economy.ts:1389-1560`, hunki `:1406` i
//! `:1547`) na PRODUKCYJNYM `state::City`.
//!
//! Podglad HUD odtwarza potok zasobow ticku (wplyw z mapy -> konwertery -> drain Spichlerza) na KOPII puli
//! wlasciciela (`ownerResourceStockAll`), bez mutacji miast i bez reconcile pol roboczych (w odroznieniu od
//! `advance_city_economy_resources_with_map`, ktore wola `reconcile_city_worked_tiles`). Wyniki:
//! `spichlerz_by_city` i `ceramika_by_owner` (pula Ceramiki po drainach, wejscie bonusu Garncarni).
//!
//! Zalozenie Z-Q4b-1: wejscia terenowe (`lostToSibling`, plony terytorium, plony magazynowe) liczone
//! NIEMUTUJACO z publicznych funkcji `turn_economy_territory.rs` / `okolica` (web: `:1440-1445`).
//! Zalozenie Z-Q4b-2: `territory_nodes = None` odpowiada `territoryNodes ?? buildTerritoryNodesFromCities`.

use std::collections::BTreeMap;

use serde_json::Value;

use crate::domain::building_costs::p6_7b::{
    load_spichlerz_drain_params, load_throughput, owner_resource_stock_all,
    resolve_spichlerz_city_bonus_state, spichlerz_ceramika_drain_amount, SpichlerzCityBonusState,
    SpichlerzDrainPayResult, StockRecord,
};
use crate::domain::civ_matrix::js_compat::js_min;
use crate::domain::okolica::compute_lost_to_nearer_sibling_by_city;
use crate::domain::terrain::city_founding::p6_6b::cities::City;
use crate::domain::territory::TerritoryNode;
use crate::domain::turn_economy_advance::{
    owner_era_for, owner_resource_cap_for, AdvanceCityEconomyInput,
};
use crate::domain::turn_economy_resources::{
    apply_stolarnia_drewno_map_inflow, converter_building_id_for_recipe,
    converter_throughputs_for_era, default_converter_recipes, run_converters,
    runtime_active_built_ids_for_city, ConverterRecipe, ResourceTickResolvers, WorkedMagazynYield,
};
use crate::domain::turn_economy_territory::{
    compute_territory_resource_yield_by_city, compute_worked_magazyn_yields_by_city,
    okolica_city_of, territory_nodes_of, TerrainContext,
};

/// Wynik `simulateResourcePipelineForPreview` (web: `{ spichlerzByCity, ceramikaByOwner }`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct PreviewPipelineOutcome {
    pub spichlerz_by_city: BTreeMap<String, SpichlerzCityBonusState>,
    pub ceramika_by_owner: BTreeMap<i64, f64>,
}

/// Web `credit` (`:1493-1497`): `pool[key] = Math.min(cap, (pool[key] ?? 0) + Math.floor(raw * mult))`,
/// pomijane gdy `raw` brak albo `!(raw > 0)`.
fn credit(pool: &mut StockRecord, cap: f64, key: &str, raw: Option<f64>, mult: f64) {
    let Some(raw) = raw else { return };
    if raw.is_nan() || raw <= 0.0 {
        return;
    }
    let current = pool.get(key).copied().unwrap_or(0.0);
    pool.insert(key.to_owned(), js_min(cap, current + (raw * mult).floor()));
}

/// Web `simulateResourcePipelineForPreview` (`:1389-1560`). `cities` nie sa mutowane.
pub fn simulate_resource_pipeline_for_preview(
    cities: &[City],
    terrain: &TerrainContext<'_>,
    territory_nodes: Option<&[TerritoryNode]>,
    input: &AdvanceCityEconomyInput<'_>,
) -> PreviewPipelineOutcome {
    let null = Value::Null;
    let raw = input.econ_params.unwrap_or(&null);
    let drain_params = load_spichlerz_drain_params(input.econ_params, input.difficulty);

    let mut owner_ids: Vec<i64> = Vec::new();
    for c in cities {
        if !owner_ids.contains(&c.owner_id) {
            owner_ids.push(c.owner_id);
        }
    }

    // `:1409-1418` liczniki Magazynow (surowe `builtIds`).
    let built_of = |city: &City| -> &[String] {
        input
            .built_by_city
            .get(&city.id)
            .map(Vec::as_slice)
            .unwrap_or(&[])
    };
    let mut magazyn: BTreeMap<i64, f64> = BTreeMap::new();
    for c in cities {
        for id in built_of(c) {
            if id == "magazyn" {
                *magazyn.entry(c.owner_id).or_insert(0.0) += 1.0;
            }
        }
    }
    let cap_for = |o: i64| owner_resource_cap_for(input, &magazyn, o);

    // `:1440-1453` wejscia terenowe NIEMUTUJACO (bez reconcile pol roboczych).
    let owned_nodes;
    let nodes: &[TerritoryNode] = match territory_nodes {
        Some(n) => n,
        None => {
            owned_nodes = territory_nodes_of(cities);
            &owned_nodes
        }
    };
    let okolica: Vec<_> = cities.iter().map(okolica_city_of).collect();
    let lost = compute_lost_to_nearer_sibling_by_city(&okolica, terrain.map);
    let era = |o: i64| owner_era_for(input, o);
    let territory_resource_by_city =
        compute_territory_resource_yield_by_city(cities, terrain.map, nodes, &era);
    let worked_magazyn_by_city =
        compute_worked_magazyn_yields_by_city(cities, terrain, nodes, &lost);

    let zloto = input.resolvers.owner_zloto_access;
    let tick_resolvers = || ResourceTickResolvers {
        owner_active_labels: input.resolvers.owner_active_labels,
        owner_zloto_access: Some(zloto),
    };

    // `:1454-1476` liczniki Stolarni / Kamieniarni (aktywne w runtime, stan z resolvera).
    let mut stolarnia: BTreeMap<i64, f64> = BTreeMap::new();
    let mut kamieniarski: BTreeMap<i64, f64> = BTreeMap::new();
    for c in cities {
        let stock_override = input.resolvers.owner_empire_stock.map(|f| f(c.owner_id));
        let active = runtime_active_built_ids_for_city(
            built_of(c),
            c.owner_id,
            &tick_resolvers(),
            stock_override.as_ref(),
        );
        if active.iter().any(|x| x == "stolarnia") {
            *stolarnia.entry(c.owner_id).or_insert(0.0) += 1.0;
        }
        if active.iter().any(|x| x == "kamieniarski") {
            *kamieniarski.entry(c.owner_id).or_insert(0.0) += 1.0;
        }
    }
    let stolarnia_bonus = load_throughput(
        raw,
        "budynek_stolarnia_bonus_drewna_civ",
        input.difficulty,
        0.10,
    );
    let kamieniarski_bonus = load_throughput(
        raw,
        "budynek_kamieniarski_bonus_kamienia_civ",
        input.difficulty,
        0.10,
    );

    let mut out = PreviewPipelineOutcome::default();
    for &owner_id in &owner_ids {
        let mut pool: StockRecord = owner_resource_stock_all(cities, owner_id);
        let cap = cap_for(owner_id);

        // Faza 1 (`:1485-1519`): wplyw z mapy do puli.
        for c in cities.iter().filter(|c| c.owner_id == owner_id) {
            let terr = territory_resource_by_city.get(&c.id);
            let worked = worked_magazyn_by_city
                .get(&c.id)
                .copied()
                .unwrap_or_else(WorkedMagazynYield::default);
            let kamien_mult =
                1.0 + kamieniarski_bonus * kamieniarski.get(&owner_id).copied().unwrap_or(0.0);
            let drewno_base = terr.and_then(|t| t.drewno).unwrap_or(0.0) + worked.drewno;
            let drewno_credit = apply_stolarnia_drewno_map_inflow(
                drewno_base,
                stolarnia.get(&owner_id).copied().unwrap_or(0.0),
                stolarnia_bonus,
            );
            if drewno_credit > 0.0 {
                credit(&mut pool, cap, "drewno", Some(drewno_credit), 1.0);
            }
            credit(
                &mut pool,
                cap,
                "kamien",
                Some(terr.and_then(|t| t.kamien).unwrap_or(0.0) + worked.kamien),
                kamien_mult,
            );
            credit(
                &mut pool,
                cap,
                "glina",
                Some(terr.and_then(|t| t.glina).unwrap_or(0.0) + worked.glina),
                1.0,
            );
            if let Some(t) = terr {
                credit(&mut pool, cap, "ruda", t.ruda, 1.0);
                credit(&mut pool, cap, "ruda_zelaza", t.ruda_zelaza, 1.0);
                credit(&mut pool, cap, "ruda_cyny", t.ruda_cyny, 1.0);
                credit(&mut pool, cap, "sol", t.sol, 1.0);
                credit(&mut pool, cap, "zloto", t.zloto, 1.0);
                credit(&mut pool, cap, "kon", t.kon, 1.0);
            }
        }

        // Faza 2 (`:1520-1537`): konwertery na kopii puli; bramka runtime widzi biezaca pule.
        let throughputs = converter_throughputs_for_era(raw, input.difficulty, era(owner_id));
        for c in cities.iter().filter(|c| c.owner_id == owner_id) {
            let active = runtime_active_built_ids_for_city(
                built_of(c),
                owner_id,
                &tick_resolvers(),
                Some(&pool),
            );
            let recipes: Vec<ConverterRecipe> = default_converter_recipes()
                .iter()
                .filter(|r| {
                    active
                        .iter()
                        .any(|b| b == converter_building_id_for_recipe(r))
                })
                .copied()
                .collect();
            if recipes.is_empty() {
                continue;
            }
            pool = run_converters(&recipes, &pool, &throughputs, &|_| cap);
        }

        // Faza 3 (`:1538-1558`): drain Spichlerza po kolei miast, na tej samej puli.
        for c in cities.iter().filter(|c| c.owner_id == owner_id) {
            let built = built_of(c);
            let has_i = built.iter().any(|b| b == "spichlerz");
            let has_ii = built.iter().any(|b| b == "spichlerz_ii");
            if !has_i && !has_ii {
                out.spichlerz_by_city.insert(
                    c.id.clone(),
                    resolve_spichlerz_city_bonus_state(
                        built,
                        SpichlerzDrainPayResult {
                            ceramika_paid: false,
                            sol_paid: false,
                        },
                    ),
                );
                continue;
            }
            let ceramika_amount = spichlerz_ceramika_drain_amount(built, &drain_params);
            let ceramika_paid = pool.get("ceramika").copied().unwrap_or(0.0) >= ceramika_amount;
            let sol_paid = has_ii && pool.get("sol").copied().unwrap_or(0.0) >= drain_params.sol_ii;
            if ceramika_paid {
                let v = pool.get("ceramika").copied().unwrap_or(0.0) - ceramika_amount;
                pool.insert("ceramika".to_owned(), v);
            }
            if sol_paid {
                let v = pool.get("sol").copied().unwrap_or(0.0) - drain_params.sol_ii;
                pool.insert("sol".to_owned(), v);
            }
            out.spichlerz_by_city.insert(
                c.id.clone(),
                resolve_spichlerz_city_bonus_state(
                    built,
                    SpichlerzDrainPayResult {
                        ceramika_paid,
                        sol_paid,
                    },
                ),
            );
        }
        out.ceramika_by_owner
            .insert(owner_id, pool.get("ceramika").copied().unwrap_or(0.0));
    }
    out
}
