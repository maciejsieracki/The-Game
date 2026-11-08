//! P6.8I (8I-P2b): port `pickAutoImprovementsSinglePass` (`auto-improvements.ts`); REPIN-AUTOIMPROVE: web main 180c08305.
//!
//! Jeden przebieg pickera: budzet Pracy wspolny dla wywolania, miasta po `id`, heksy po (rzeka,
//! odleglosc, q, r); FAZA 0 (obrona), KROK 0 (wyrab), FAZA 1 (heks po heksie), FAZA 2 (wyrab po typie),
//! sonda nadwyzki (ZASADA 3). `qualifies` czyta ZYWY stan `workingPlaced` (jak webowy kwalifikator
//! trzymajacy referencje do `Map`), wiec kwalifikator jest budowany z biezacego `state` przy kazdym
//! wywolaniu (`Shared::qualifies`).
//!
//! ZALOZENIE (wydajnosc, bez wplywu na zachowanie): `Qualifier::new` liczy zbior heksow rzek przy kazdym
//! wywolaniu; optymalizacja = NASTEPNA-PARTIA (po integracji z wolajacymi).

use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet, HashSet};
use std::rc::Rc;

use super::city_phases::{build_city_env, count_forest, finish_env, Acc, CityEnv};
use super::fort_claim::{pick_fort_claims, FortBudget};
use super::hex_phases::{phase_defense, phase_hexes, phase_probe, phase_wyrab_by_type};
use super::opts::{
    AutoImprovementCity, AutoImprovementPick, PickAutoImprovementsOpts, RoadPlanMemo,
};
use super::road_network_plan::{plan_road_network, RoadNetworkPlanOpts, RoadPlanCity};
use super::{
    deficit_improvement_keys, has_non_food_resource_deficit, js_max, js_min, territory_radius_pin,
    ROAD_KEYS, ZERO_YIELD_IMPROVEMENTS,
};
use crate::domain::freshwater::FreshwaterCtx;
use crate::domain::improvement_build::hex_keys_within_radius;
use crate::domain::improvement_build::{
    is_improvement_tech_unlocked, BuildMap, ImprovementBuildState, PlacedLayers, Qualifier,
};
use crate::domain::improvements::is_improvement_allowed_for_civ;
use crate::domain::terrain::CityNode;
use crate::domain::territory::territory_owner_at;

pub(super) fn cmp_city_id(a: &AutoImprovementCity, b: &AutoImprovementCity) -> std::cmp::Ordering {
    super::cmp_js_str(&a.id, &b.id)
}

fn default_civ_gate(key: &str, civ: Option<&str>) -> bool {
    is_improvement_allowed_for_civ(key, civ)
}

pub(super) fn in_zero_yield(key: &str) -> bool {
    ZERO_YIELD_IMPROVEMENTS.contains(&key)
}

/// Stan wspolny przebiegu (niezmienny poza zywa mapa warstw `state.placed_improvements`).
pub(super) struct Shared<'a> {
    pub map: &'a BuildMap,
    pub state: ImprovementBuildState,
    pub river_hex_keys: HashSet<String>,
    /// REPIN-DELTA-4: rzeki i jeziora (`map/freshwater.ts`), liczone raz na przebieg.
    pub fw: FreshwaterCtx,
    pub unlocked: &'a BTreeSet<String>,
    pub civ_gate: &'a dyn Fn(&str, Option<&str>) -> bool,
    pub civ: Option<&'a str>,
    /// Web `roadPlanMemo` (R-WEB-AI-ROADS-CITY-LINKS-ONLY-Q1): wspolny dla wszystkich przebiegow wywolania.
    pub road_memo: Rc<RefCell<RoadPlanMemo>>,
    pub owner_id: i64,
}

impl Shared<'_> {
    /// Web `roadPlanHexes(...).has(hexKey)` (hunk 27): heks nalezy do planu sieci drog MIEDZY miastami wlasciciela.
    /// Plan liczony leniwie, RAZ na wywolanie `pickAutoImprovements` (pamiec `road_memo`); web trzyma tez cache
    /// MIEDZY turami (`ROAD_PLAN_CACHE`, sama optymalizacja wydajnosci - nie portowany).
    pub fn road_plan_has(&self, hex_key: &str) -> bool {
        if let Some(plan) = &self.road_memo.borrow().plan {
            return plan.contains(hex_key);
        }
        let own: Vec<RoadPlanCity> = self
            .road_memo
            .borrow()
            .cities
            .iter()
            .filter(|c| c.owner_id == self.owner_id)
            .map(|c| RoadPlanCity {
                id: c.id.clone(),
                q: c.q,
                r: c.r,
            })
            .collect();
        let own_full: Vec<AutoImprovementCity> = self
            .road_memo
            .borrow()
            .cities
            .iter()
            .filter(|c| c.owner_id == self.owner_id)
            .cloned()
            .collect();
        let mut road_keys: BTreeSet<(i32, i32)> = BTreeSet::new();
        if let Some(placed) = &self.state.placed_improvements {
            for (hk, v) in placed {
                let layers: Vec<&String> = match v {
                    PlacedLayers::Many(l) => l.iter().collect(),
                    PlacedLayers::One(s) => vec![s],
                };
                if layers.iter().any(|l| ROAD_KEYS.contains(&l.as_str())) {
                    road_keys.insert(parse_key(hk));
                }
            }
        }
        let nodes = self.state.territory_nodes.as_deref().unwrap_or(&[]);
        let mut reach: HashSet<(i32, i32)> = HashSet::new();
        for c in &own_full {
            let rad = territory_radius_pin(&CityNode::city(c.q, c.r, c.population)) + 1.0;
            for k in hex_keys_within_radius(c.q, c.r, rad, self.map) {
                let kk = parse_key(&k);
                if reach.contains(&kk) {
                    continue;
                }
                if territory_owner_at(kk.0, kk.1, nodes) == Some(self.owner_id) {
                    reach.insert(kk);
                }
            }
        }
        let trav = |q: i32, r: i32| reach.contains(&(q, r));
        let plan = plan_road_network(
            &own,
            self.map,
            RoadNetworkPlanOpts {
                is_traversable: Some(&trav),
                extra_road_keys: Some(&road_keys),
            },
        );
        let set: BTreeSet<String> = plan.hexes.iter().map(|(q, r)| format!("{q},{r}")).collect();
        let has = set.contains(hex_key);
        self.road_memo.borrow_mut().plan = Some(set);
        has
    }

    pub fn qualifies(&self, key: &str, q: i32, r: i32) -> bool {
        Qualifier::new(&self.state).qualifies(key, q, r)
    }

    pub fn placed(&self, hk: &str) -> &[String] {
        match self
            .state
            .placed_improvements
            .as_ref()
            .and_then(|m| m.get(hk))
        {
            Some(PlacedLayers::Many(v)) => v,
            _ => &[],
        }
    }

    pub fn add_layer(&mut self, hk: &str, key: &str) {
        let map = self
            .state
            .placed_improvements
            .get_or_insert_with(BTreeMap::new);
        let entry = map
            .entry(hk.to_owned())
            .or_insert_with(|| PlacedLayers::Many(Vec::new()));
        if let PlacedLayers::Many(v) = entry {
            v.push(key.to_owned());
        }
    }

    pub fn hex_layers_contain(&self, hk: &str, key: &str) -> bool {
        self.placed(hk).iter().any(|k| k == key)
    }

    pub fn tech_ok(&self, key: &str) -> bool {
        is_improvement_tech_unlocked(key, self.unlocked)
    }

    pub fn civ_ok(&self, key: &str) -> bool {
        (self.civ_gate)(key, self.civ)
    }

    /// Web `hasRiverAccess` (S3-1): heks NA rzece albo sasiad heksu rzeki (`isRiverAdjacent`).
    pub fn has_river_access(&self, hk: &str) -> bool {
        let (q, r) = parse_key(hk);
        let on_river =
            self.river_hex_keys.contains(hk) || self.map.hex(hk).is_some_and(|h| h.river_present);
        if on_river {
            return true;
        }
        [(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]
            .iter()
            .any(|(dq, dr)| {
                self.river_hex_keys
                    .contains(&format!("{},{}", q + dq, r + dr))
            })
    }

    /// Web `isOnRiver` (auto-improvements.ts:1250 @23dd158e9): heks NA rzece (`riverPaths` albo
    /// wlasne `rzeka.obecna`).
    pub fn is_on_river(&self, hk: &str) -> bool {
        self.river_hex_keys.contains(hk) || self.map.hex(hk).is_some_and(|h| h.river_present)
    }

    /// Web `onRiverHex` (:1268): `hasRiverAccess` LUB sasiad z wlasnym `rzeka.obecna` (picker
    /// FOOD E1-E3).
    pub fn on_river_hex(&self, hk: &str) -> bool {
        if self.has_river_access(hk) {
            return true;
        }
        let (q, r) = parse_key(hk);
        [(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]
            .iter()
            .any(|(dq, dr)| {
                self.map
                    .hex(&format!("{},{}", q + dq, r + dr))
                    .is_some_and(|h| h.river_present)
            })
    }

    /// Web `foodReservedHex` (:1275): `hasRiverAccess` LUB `isFreshwaterReservedHex` (rzeka /
    /// jezioro na heksie lub sasiedzie). Blokada tartaku/obozu (FRESHWATER-LAKE-Q1).
    pub fn food_reserved_hex(&self, hk: &str) -> bool {
        if self.has_river_access(hk) {
            return true;
        }
        let (q, r) = parse_key(hk);
        self.fw.is_freshwater_reserved_hex(self.map, q, r)
    }
}

pub(super) fn parse_key(hk: &str) -> (i32, i32) {
    let mut it = hk.split(',');
    let q = it.next().and_then(|s| s.parse().ok()).unwrap_or(0);
    let r = it.next().and_then(|s| s.parse().ok()).unwrap_or(0);
    (q, r)
}

/// Web `pickAutoImprovementsSinglePass`.
pub fn pick_auto_improvements_single_pass(
    opts: &PickAutoImprovementsOpts,
) -> Vec<AutoImprovementPick> {
    let Some(map) = opts.map else {
        // ZALOZENIE: `map` jest wymagane w webie; brak = brak wyniku (nieosiagalne dla wolajacych).
        return Vec::new();
    };
    let cities = &opts.cities;
    let Some(territory_nodes) = &opts.territory_nodes else {
        return Vec::new();
    };
    if cities.is_empty() {
        return Vec::new();
    }
    let owner_id = opts.owner_id;
    let praca_budget_percent = opts.praca_budget_percent.unwrap_or(100.0);
    let demand_driven = opts.demand_driven;
    let report = |f: &dyn Fn(&mut super::opts::AutoImprovementSurplusReport)| {
        if let Some(sr) = opts.surplus_report {
            f(&mut sr.borrow_mut());
        }
    };

    let deficit_active = has_non_food_resource_deficit(opts.resource_deficit_keys.as_deref());
    report(&|s| s.deficit_active = deficit_active);
    let deficit_open_keys: BTreeSet<String> = if deficit_active {
        deficit_improvement_keys(opts.resource_deficit_keys.as_deref())
            .into_iter()
            .collect()
    } else {
        BTreeSet::new()
    };

    let praca_left = opts.praca_available;
    let reserve = opts.praca_surplus_threshold.unwrap_or(0.0);
    if praca_left <= reserve {
        return Vec::new();
    }
    let global_pula_at_entry = opts.praca_available;

    let imperium_percent_clamped = js_max(0.0, js_min(100.0, praca_budget_percent));
    let cap_value = match opts.improvement_budget_cap {
        Some(c) if c.is_finite() => c,
        _ => (imperium_percent_clamped / 100.0) * global_pula_at_entry,
    };
    let imperium_budget_cap = js_max(0.0, js_min(global_pula_at_entry, cap_value));

    let mut working: BTreeMap<String, PlacedLayers> = BTreeMap::new();
    if let Some(placed) = &opts.placed_improvements {
        for (hk, v) in placed {
            working.insert(hk.clone(), PlacedLayers::Many(v.clone()));
        }
    }
    let horse_stock: f64 = cities.iter().fold(0.0, |sum, c| {
        if c.owner_id != owner_id {
            sum
        } else {
            sum + c.kon_stock.unwrap_or(0.0)
        }
    });
    let mut state = ImprovementBuildState::new(
        map.clone(),
        cities
            .iter()
            .map(|c| CityNode::city(c.q, c.r, c.population))
            .collect(),
    );
    state.territory_nodes = Some(territory_nodes.clone());
    state.player_owner_id_num = Some(owner_id);
    state.placed_improvements = Some(working);
    state.researched_techs = Some(opts.unlocked_techs.clone());
    state.player_civ_archetype = opts.civ_archetype.clone();
    state.player_era = opts.player_era;
    state.horse_stock_available = Some(horse_stock);
    state.trade_route_kon_unlocked = Some(false);

    let mut river_hex_keys = HashSet::new();
    for path in &map.river_paths {
        for (q, r) in path {
            river_hex_keys.insert(format!("{q},{r}"));
        }
    }
    let civ_gate: &dyn Fn(&str, Option<&str>) -> bool = match opts.is_improvement_allowed_for_civ {
        Some(f) => f,
        None => &default_civ_gate,
    };
    let mut sh = Shared {
        map,
        state,
        river_hex_keys,
        fw: FreshwaterCtx::new(map),
        unlocked: &opts.unlocked_techs,
        civ_gate,
        civ: opts.civ_archetype.as_deref(),
        road_memo: opts.road_plan_memo.clone().unwrap_or_else(|| {
            Rc::new(RefCell::new(RoadPlanMemo {
                cities: cities.clone(),
                plan: None,
            }))
        }),
        owner_id,
    };

    if opts.fort_claim_pass {
        return pick_fort_claims(
            opts,
            &mut sh,
            FortBudget {
                praca_left,
                reserve,
                imperium_budget_cap,
                global_pula_at_entry,
                praca_budget_percent,
            },
        );
    }

    let mut ordered_cities: Vec<&AutoImprovementCity> = cities.iter().collect();
    ordered_cities.sort_by(|a, b| cmp_city_id(a, b));
    let mut acc = Acc {
        picks: Vec::new(),
        praca_left,
        global_spent: 0.0,
        scheduled_wyrab: opts.clearing_hex_keys.clone().unwrap_or_default(),
        forest_left: 0.0,
        city_budget_exhausted: false,
        own_fort_circles: None,
    };

    for city in ordered_cities {
        if acc.praca_left <= reserve {
            break;
        }
        let env = build_city_env(
            opts,
            &sh,
            city,
            &deficit_open_keys,
            imperium_budget_cap,
            global_pula_at_entry,
            praca_budget_percent,
            reserve,
            demand_driven,
        );
        report_demand(opts, &env);
        acc.city_budget_exhausted = false;
        let mut env = env;
        phase_defense(&mut sh, &env, &mut acc, opts);
        finish_env(&sh, &acc, &mut env);
        acc.forest_left = count_forest(&sh, &acc, &env.radius_hexes);
        phase_hexes(&mut sh, &env, &mut acc, opts);
        phase_wyrab_by_type(&mut sh, &env, &mut acc, opts);
        phase_probe(&sh, &env, &acc, opts);
    }

    report(&|s| {
        s.surplus = s.demand_active && !s.deficit_active && !s.any_candidate;
    });
    acc.picks
}

fn report_demand(opts: &PickAutoImprovementsOpts, env: &CityEnv) {
    if env.demand_active {
        if let Some(sr) = opts.surplus_report {
            sr.borrow_mut().demand_active = true;
        }
    }
}
