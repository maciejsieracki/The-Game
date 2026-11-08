//! P6.8I (8I-P2c): port `pickAutoImprovements` (`auto-improvements.ts`, REPIN-AUTOIMPROVE: web 180c08305) -
//! orkiestrator etapow: KROK 1 brakujacy surowiec, KROK 0 wycinka rzeczna na polu obywatela (hunki 30, 31, 34, 36),
//! KROK 2 etapy zywnosciowe E1-E6, sciezka zapasowa, KROK 2b E-FORT, KROK 3 drogi, KROK 7 wycinka rzeczna BEZ
//! obywatela (hunk 42). Kazdy przebieg to `pick_auto_improvements_single_pass` na kopii opcji (`after`).
//! Limit liczby sztuk na miasto (`maxItemsPerCity`) USUNIETY z pickera (LIM), `getOnlyWorked` & spol. (PRZ) tez.

use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet};
use std::rc::Rc;

use super::opts::{
    AutoImprovementCity, AutoImprovementPick, FoodStages, PickAutoImprovementsOpts, PlacedMap,
    RoadPlanMemo, UlepszeniaFocus, DEFAULT_ULEPSZENIA_FOCUS,
};
use super::single_pass::pick_auto_improvements_single_pass;
use super::{
    actionable_deficit_keys, deficit_improvement_keys, js_max, js_min, FOOD_STAGES,
    RIVER_CLEAR_NO_CITIZEN_POOL_FLOOR, ROAD_KEYS,
};

/// `Number.MAX_SAFE_INTEGER` jako `f64`.
const MAX_SAFE: f64 = 9_007_199_254_740_991.0;

fn is_food_stage_city(opts: &PickAutoImprovementsOpts, city: &AutoImprovementCity) -> bool {
    match opts.food_improvement_stages {
        Some(FoodStages::PerCity(f)) => f(city),
        Some(FoodStages::Flag(b)) => b,
        None => false,
    }
}

fn focus_of(opts: &PickAutoImprovementsOpts, c: &AutoImprovementCity) -> UlepszeniaFocus {
    match opts.get_focus {
        Some(f) => f(c),
        None => c.ulepszenia_focus.unwrap_or(DEFAULT_ULEPSZENIA_FOCUS),
    }
}

fn sum(picks: &[AutoImprovementPick]) -> f64 {
    picks.iter().fold(0.0, |n, p| n + p.koszt_praca)
}

/// Stan wspolny przebiegow tego wywolania (web: `mergedPlaced`, `clearingSeed`, `totalBudget`).
struct Run<'o, 'a> {
    opts: &'o PickAutoImprovementsOpts<'a>,
    actionable: Vec<String>,
    merged: PlacedMap,
    clearing: BTreeSet<String>,
    total_budget: f64,
}

impl<'a> Run<'_, 'a> {
    /// Web `after(spent, extra)`: opcje przebiegu po wydatku `spent` (wspolna koperta imperium).
    fn after(
        &self,
        spent: f64,
        extra: impl FnOnce(&mut PickAutoImprovementsOpts<'a>),
    ) -> PickAutoImprovementsOpts<'a> {
        let mut o = self.opts.clone();
        o.resource_deficit_keys = Some(self.actionable.clone());
        o.placed_improvements = Some(self.merged.clone());
        o.praca_available = js_max(0.0, self.opts.praca_available - spent);
        o.improvement_budget_cap = Some(js_max(0.0, self.total_budget - spent));
        o.clearing_hex_keys = Some(self.clearing.clone());
        o.food_improvement_stages = Some(FoodStages::Flag(false));
        extra(&mut o);
        o
    }

    fn record(&mut self, picks: &[AutoImprovementPick]) {
        for pick in picks {
            let hk = format!("{},{}", pick.q, pick.r);
            if pick.key == "wyrab" {
                self.clearing.insert(hk);
            } else {
                self.merged.entry(hk).or_default().push(pick.key.clone());
            }
        }
    }
}

/// Sonda: ten sam przebieg z nieograniczonym budzetem (czy istnieje cel czekajacy na Prace).
fn unlimited(mut o: PickAutoImprovementsOpts<'_>) -> PickAutoImprovementsOpts<'_> {
    o.praca_available = MAX_SAFE;
    o.improvement_budget_cap = Some(MAX_SAFE);
    o.praca_budget_percent = Some(100.0);
    o.get_praca_budget_percent = None;
    o.praca_surplus_threshold = Some(0.0);
    o
}

fn deficit_pass_opts<'a>(
    run: &Run<'_, 'a>,
    deficit_cities: &[AutoImprovementCity],
    deficit_keys: &[String],
) -> PickAutoImprovementsOpts<'a> {
    run.after(0.0, |o| {
        o.cities = deficit_cities.to_vec();
        o.priority_override = Some(deficit_keys.to_vec());
        o.river_forest_clearing_only = false;
        o.river_hexes_only = false;
        o.off_river_clearing = false;
    })
}

/// Web `pickAutoImprovements`: wrapper tworzacy pamiec planu drog (`roadPlanMemo`, wspolna dla wszystkich
/// przebiegow tego wywolania) i delegujacy do `pickAutoImprovementsStaged`.
pub fn pick_auto_improvements(opts: &PickAutoImprovementsOpts) -> Vec<AutoImprovementPick> {
    let mut o = opts.clone();
    o.road_plan_memo = Some(Rc::new(RefCell::new(RoadPlanMemo {
        cities: opts.cities.clone(),
        plan: None,
    })));
    pick_auto_improvements_staged(&o)
}

fn pick_auto_improvements_staged(opts: &PickAutoImprovementsOpts) -> Vec<AutoImprovementPick> {
    let staged_cities: Vec<AutoImprovementCity> = opts
        .cities
        .iter()
        .filter(|c| is_food_stage_city(opts, c))
        .cloned()
        .collect();
    if staged_cities.is_empty() || opts.territory_nodes.is_none() {
        return pick_auto_improvements_single_pass(opts);
    }
    let other_cities: Vec<AutoImprovementCity> = opts
        .cities
        .iter()
        .filter(|c| !is_food_stage_city(opts, c))
        .cloned()
        .collect();
    let total_budget = match opts.improvement_budget_cap {
        Some(c) if c.is_finite() => js_max(0.0, c),
        _ => (js_max(0.0, opts.praca_available)
            * js_max(
                0.0,
                js_min(100.0, opts.praca_budget_percent.unwrap_or(100.0)),
            )
            / 100.0)
            .floor(),
    };
    let mut merged: PlacedMap = BTreeMap::new();
    if let Some(p) = &opts.placed_improvements {
        for (hk, v) in p {
            merged.insert(hk.clone(), v.clone());
        }
    }
    let mut run = Run {
        opts,
        actionable: actionable_deficit_keys(opts.resource_deficit_keys.as_deref()),
        merged,
        clearing: opts.clearing_hex_keys.clone().unwrap_or_default(),
        total_budget,
    };

    // KROK 1 (K2/K3): brakujacy surowiec - jego ulepszenie NA PRZOD.
    let deficit_keys: Vec<String> = if opts.demand_driven {
        deficit_improvement_keys(opts.resource_deficit_keys.as_deref())
    } else {
        Vec::new()
    };
    let deficit_cities: Vec<AutoImprovementCity> = if deficit_keys.is_empty() {
        Vec::new()
    } else {
        staged_cities
            .iter()
            .filter(|c| focus_of(opts, c) == UlepszeniaFocus::Zrownowazone)
            .cloned()
            .collect()
    };
    let mut deficit_picks: Vec<AutoImprovementPick> = Vec::new();
    if !deficit_cities.is_empty() {
        deficit_picks = pick_auto_improvements_single_pass(&deficit_pass_opts(
            &run,
            &deficit_cities,
            &deficit_keys,
        ));
        run.record(&deficit_picks);
    }
    let deficit_spent = sum(&deficit_picks);

    // KROK 0 (R-WEB-AUTOIMPROVE-RIVER-FOREST-FIRST-PRIORITY-Q1): wycinka lasu PRZY RZECE na polu obywatela to PIERWSZY
    // krok etapowy zywnosci (przed E1-E6). Niedobor (KROK 1) zostaje przed nia; gdy niedobor juz stawia ulepszenie
    // w tej turze, wycinka czeka (dispatch b, kontrakt S3-1). Nie ustawia `earlier_stage_is_pending`.
    let river_clear_picks: Vec<AutoImprovementPick> =
        if staged_cities.is_empty() || !deficit_picks.is_empty() {
            Vec::new()
        } else {
            pick_auto_improvements_single_pass(&run.after(deficit_spent, |o| {
                o.cities = staged_cities.clone();
                o.priority_override = Some(vec!["wyrab".to_owned()]);
                o.river_forest_clearing_only = true;
                o.river_hexes_only = false;
                o.off_river_clearing = false;
                o.irrigation_needs_farm = true;
            }))
        };
    run.record(&river_clear_picks);
    let river_clear_spent = sum(&river_clear_picks);
    // Brak limitu liczby sztuk na miasto: wszystkie miasta etapowe biora udzial w etapach.
    let food_cities: Vec<AutoImprovementCity> = staged_cities.clone();

    // KROK 2: etapy zywnosciowe E1...E6.
    let mut staged_picks: Vec<AutoImprovementPick> = Vec::new();
    let mut earlier_stage_is_pending = false;
    if !food_cities.is_empty() {
        for stage in FOOD_STAGES.iter() {
            let stage_opts = run.after(river_clear_spent + deficit_spent, |o| {
                o.cities = food_cities.clone();
                o.priority_override = Some(stage.keys.iter().map(|k| (*k).to_owned()).collect());
                o.river_forest_clearing_only = stage.river_forest_clearing_only;
                o.river_hexes_only = stage.river_hexes_only;
                o.off_river_clearing = stage.off_river_clearing;
                o.irrigation_needs_farm = true;
            });
            let stage_picks = pick_auto_improvements_single_pass(&stage_opts);
            if !stage_picks.is_empty() {
                staged_picks = stage_picks;
                break;
            }
            let mut probe = unlimited(stage_opts);
            probe.surplus_report = None;
            if !pick_auto_improvements_single_pass(&probe).is_empty() {
                earlier_stage_is_pending = true;
                break;
            }
        }
    }
    run.record(&staged_picks);
    let stage_spent = river_clear_spent + deficit_spent + sum(&staged_picks);

    // Sciezka zapasowa (zwykla wycinka) dopiero gdy zaden etap nie ma celu.
    let mut fallback_picks: Vec<AutoImprovementPick> = Vec::new();
    let mut fallback_is_pending = false;
    if staged_picks.is_empty() && !earlier_stage_is_pending && !food_cities.is_empty() {
        let fallback_opts = run.after(stage_spent, |o| o.cities = food_cities.clone());
        fallback_picks = pick_auto_improvements_single_pass(&fallback_opts);
        run.record(&fallback_picks);
        if fallback_picks.is_empty() {
            let mut probe = unlimited(fallback_opts);
            probe.surplus_report = None;
            fallback_is_pending = !pick_auto_improvements_single_pass(&probe).is_empty();
        }
    }
    let fallback_spent = stage_spent + sum(&fallback_picks);

    // KROK 3 / 2b: przygotowanie warunkow.
    let road_cities: Vec<AutoImprovementCity> = if opts.demand_driven {
        food_cities
            .iter()
            .filter(|c| focus_of(opts, c) == UlepszeniaFocus::Zrownowazone)
            .cloned()
            .collect()
    } else {
        Vec::new()
    };
    let food_and_fallback_done = river_clear_picks.is_empty()
        && staged_picks.is_empty()
        && !earlier_stage_is_pending
        && fallback_picks.is_empty()
        && !fallback_is_pending
        && deficit_picks.is_empty();
    let mut deficit_pending_memo: Option<bool> = None;
    let mut deficit_is_pending_now = |run: &Run| -> bool {
        if let Some(v) = deficit_pending_memo {
            return v;
        }
        let v = !deficit_cities.is_empty() && {
            let mut probe = unlimited(deficit_pass_opts(run, &deficit_cities, &deficit_keys));
            probe.surplus_report = None;
            !pick_auto_improvements_single_pass(&probe).is_empty()
        };
        deficit_pending_memo = Some(v);
        v
    };

    // KROK 2b - E-FORT.
    let mut fort_picks: Vec<AutoImprovementPick> = Vec::new();
    let mut fort_is_pending = false;
    if opts.city_limit_exhausted
        && !road_cities.is_empty()
        && food_and_fallback_done
        && !deficit_is_pending_now(&run)
    {
        let fort_opts = run.after(fallback_spent, |o| {
            o.cities = road_cities.clone();
            o.fort_claim_pass = true;
            o.surplus_report = None;
            o.river_forest_clearing_only = false;
            o.river_hexes_only = false;
            o.off_river_clearing = false;
        });
        fort_picks = pick_auto_improvements_single_pass(&fort_opts);
        run.record(&fort_picks);
        if fort_picks.is_empty() {
            fort_is_pending = !pick_auto_improvements_single_pass(&unlimited(fort_opts)).is_empty();
        }
    }
    let fort_spent = fallback_spent + sum(&fort_picks);

    // KROK 3 - drogi (najnizszy priorytet).
    let mut road_picks: Vec<AutoImprovementPick> = Vec::new();
    if !road_cities.is_empty()
        && food_and_fallback_done
        && fort_picks.is_empty()
        && !fort_is_pending
        && !deficit_is_pending_now(&run)
    {
        road_picks = pick_auto_improvements_single_pass(&run.after(fort_spent, |o| {
            o.cities = road_cities.clone();
            o.priority_override = Some(ROAD_KEYS.iter().map(|k| (*k).to_owned()).collect());
            o.roads_pass = true;
            o.surplus_report = None;
            o.river_forest_clearing_only = false;
            o.river_hexes_only = false;
            o.off_river_clearing = false;
        }));
        run.record(&road_picks);
    }
    let side_spent = fort_spent + sum(&road_picks);

    // Zawodowe profile (nie-zywnosciowe) w tym samym wywolaniu - po aktualnej fazie zywnosci, w tej samej kopercie.
    let normal: Vec<AutoImprovementPick> = if other_cities.is_empty() {
        Vec::new()
    } else {
        pick_auto_improvements_single_pass(&run.after(side_spent, |o| {
            o.cities = other_cities.clone();
        }))
    };
    run.record(&normal);
    let normal_spent = side_spent + sum(&normal);

    // KROK 7 (R-WEB-AUTOIMPROVE-RIVER-FOREST-CLEAR-NO-CITIZEN-Q1): wycinka lasu przy rzece takze na heksie BEZ
    // obywatela - OSTATNI krok i WYLACZNIE z reszty budzetu (ponad podloge puli); tylko gdy zaden wczesniejszy
    // cel (etap, sciezka zapasowa, fort, niedobor) nie czeka na Prace.
    let no_citizen_floor = opts
        .river_clear_no_citizen_pool_floor
        .unwrap_or(RIVER_CLEAR_NO_CITIZEN_POOL_FLOOR);
    let mut no_citizen_clear_picks: Vec<AutoImprovementPick> = Vec::new();
    if !staged_cities.is_empty()
        && !earlier_stage_is_pending
        && !fallback_is_pending
        && !fort_is_pending
        && (deficit_cities.is_empty() || !deficit_is_pending_now(&run))
    {
        no_citizen_clear_picks =
            pick_auto_improvements_single_pass(&run.after(normal_spent, |o| {
                o.praca_available =
                    js_max(0.0, opts.praca_available - normal_spent - no_citizen_floor);
                o.improvement_budget_cap = Some(js_max(
                    0.0,
                    run.total_budget - normal_spent - no_citizen_floor,
                ));
                o.cities = staged_cities.clone();
                o.priority_override = Some(vec!["wyrab".to_owned()]);
                o.river_forest_clearing_only = true;
                o.river_hexes_only = false;
                o.off_river_clearing = false;
                o.irrigation_needs_farm = true;
                o.river_clear_no_citizen_pass = true;
                o.surplus_report = None;
            }));
        run.record(&no_citizen_clear_picks);
    }

    let mut out: Vec<AutoImprovementPick> = Vec::new();
    out.extend(deficit_picks);
    out.extend(river_clear_picks);
    out.extend(staged_picks);
    out.extend(fallback_picks);
    out.extend(fort_picks);
    out.extend(road_picks);
    out.extend(normal);
    out.extend(no_citizen_clear_picks);
    out
}
