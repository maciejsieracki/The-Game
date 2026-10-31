//! P6.8I-P2: port `pickAutoImprovements` (`gra/src/game/auto-improvements.ts:419`, pin `91dc998a`).
//!
//! Semantyka 1:1 z webem (kolejnosc petli, komparatory, `Math.min/max` z NaN). ZALOZENIA (zob.
//! raport partii i `P6-8I-AUTO-ULEPSZENIA.md`):
//! - funkcje-callbacki webu (`getFocus`, `getOnlyWorked`, `getWorkedHexKeys`, `getPracaBudgetPercent`,
//!   `getSkipWyrab`) zastapione polami per miasto (`AutoImprovementCity`, mapy po `id`); `None` = `undefined`
//!   (callback zwrocil `undefined`, wtedy obowiazuje wartosc domyslna jak w webie),
//! - `isImprovementAllowedForCiv` nadpisywane parametrem NIE jest portowane: uzywany jest domyslny
//!   `is_improvement_allowed_for_civ` (wektory pinu uzywaja domyslnego),
//! - `surowce.kon` miasta (runtime-owe pole webu) jako `AutoImprovementCity::surowce_kon`,
//! - `qualifies` liczony z aktualnego stanu `placed_improvements` (web: zywa mapa `workingPlaced`);
//!   Rust nie pozwala mutowac stanu pozyczonego przez `Qualifier`, wiec kwalifikator budowany jest na
//!   zadanie (wydajnosc: NIE_ZMIERZONO - swiadomie poza zakresem tej partii).

use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};

use crate::domain::auto_improvements::{
    has_non_food_resource_deficit, priorities_for_ulepszenia_focus, AutoImprovementSurplusReport,
    UlepszeniaFocus, JEDEN_NA_ILU_OBYWATELI, ULEPSZENIA_FOCUS_ZYWNOSC, WYRAB_MIN_FOREST_IN_RADIUS,
    ZERO_YIELD_IMPROVEMENTS,
};
use crate::domain::improvement_build::{
    build_improvement_qualifier, deposit_allows_player_improvement, get_improvement_meta,
    hex_has_deposit_reserve, hex_keys_within_radius, is_improvement_tech_unlocked, BuildHex,
    BuildMap, ImprovementBuildState, PlacedLayers,
};
use crate::domain::improvements::is_improvement_allowed_for_civ;
use crate::domain::start_position::Overlay;
use crate::domain::terrain::{city_territory_radius, CityNode};
use crate::domain::territory::TerritoryNode;

/// Web `AutoImprovementCity` (pin :26) + pola runtime czytane przez picker.
#[derive(Debug, Clone, PartialEq)]
pub struct AutoImprovementCity {
    pub id: String,
    pub owner_id: i64,
    pub q: i32,
    pub r: i32,
    pub population: f64,
    /// `ulepszeniaFocus` (`None` = `undefined`, domyslnie `zrownowazone`).
    pub ulepszenia_focus: Option<UlepszeniaFocus>,
    /// `ulepszeniaOnlyWorked` (`None` = `undefined`, domyslnie `false`).
    pub ulepszenia_only_worked: Option<bool>,
    /// `city.surowce?.kon` (`None` = brak pola -> 0 w sumie stadniny).
    pub surowce_kon: Option<f64>,
}

/// Web `AutoImprovementPick` (pin :36).
#[derive(Debug, Clone, PartialEq)]
pub struct AutoImprovementPick {
    pub owner_id: i64,
    pub city_id: String,
    pub q: i32,
    pub r: i32,
    pub key: String,
    pub koszt_praca: f64,
}

/// Web `PickAutoImprovementsOpts` (pin :246). `None` w polu opcjonalnym = `undefined` w webie.
#[derive(Debug)]
pub struct PickAutoImprovementsOpts<'a> {
    pub cities: &'a [AutoImprovementCity],
    pub owner_id: i64,
    pub map: &'a BuildMap,
    pub territory_nodes: Option<&'a [TerritoryNode]>,
    pub placed_improvements: Option<&'a BTreeMap<String, PlacedLayers>>,
    pub praca_available: f64,
    pub unlocked_techs: &'a BTreeSet<String>,
    /// `pracaBudgetPercent` (domyslnie 100; NaN przechodzi jak w JS).
    pub praca_budget_percent: Option<f64>,
    /// Wynik `getPracaBudgetPercent(city)` wg id miasta; brak wpisu = `undefined`.
    pub city_praca_budget_percent: Option<&'a HashMap<String, f64>>,
    /// `improvementBudgetCap` (`None` = nie-skonczony / `undefined`).
    pub improvement_budget_cap: Option<f64>,
    /// `maxItemsPerCity` (`None` = Infinity).
    pub max_items_per_city: Option<f64>,
    /// `pracaSurplusThreshold ?? 0` (`None` = `undefined` -> 0).
    pub praca_surplus_threshold: Option<f64>,
    /// `skipWyrab` (`None` = `undefined` -> false).
    pub skip_wyrab: Option<bool>,
    /// Wynik `getSkipWyrab(city)` wg id miasta (`Some(map)` = callback podany; brak wpisu -> `skip_wyrab`).
    pub city_skip_wyrab: Option<&'a HashMap<String, bool>>,
    /// `demandDriven` (`None` -> false).
    pub demand_driven: Option<bool>,
    /// `resourceDeficitKeys` (`None` = `undefined`).
    pub resource_deficit_keys: Option<&'a [String]>,
    /// `surplusReport` wypelniany w miejscu.
    pub surplus_report: Option<&'a mut AutoImprovementSurplusReport>,
    pub civ_archetype: Option<String>,
    pub player_era: Option<f64>,
    /// `priorityOverride` (`None` = `undefined`).
    pub priority_override: Option<Vec<String>>,
    /// Wynik `getWorkedHexKeys(city)` wg id miasta (`Some(map)` = callback podany).
    pub worked_hex_keys: Option<&'a HashMap<String, BTreeSet<String>>>,
}

/// `Math.max(0, Math.min(100, x))` z semantyka NaN.
fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a < b {
        a
    } else if b < a {
        b
    } else if a.is_sign_negative() {
        a
    } else {
        b
    }
}

fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a > b {
        a
    } else if b > a {
        b
    } else if a.is_sign_positive() {
        a
    } else {
        b
    }
}

/// `x || 0` dla liczby (NaN i 0 -> 0).
fn or_zero(x: f64) -> f64 {
    if x.is_nan() || x == 0.0 {
        0.0
    } else {
        x
    }
}

/// `Math.max(1, Math.ceil((pop || 0) / JEDEN_NA_ILU_OBYWATELI))`.
fn ceil_per_citizens(pop: f64) -> f64 {
    js_max(1.0, (or_zero(pop) / JEDEN_NA_ILU_OBYWATELI).ceil())
}

fn placed_get(state: &ImprovementBuildState, hk: &str) -> Vec<String> {
    match state.placed_improvements.as_ref().and_then(|m| m.get(hk)) {
        Some(PlacedLayers::One(s)) => vec![s.clone()],
        Some(PlacedLayers::Many(list)) => list.clone(),
        None => Vec::new(),
    }
}

fn placed_push(state: &mut ImprovementBuildState, hk: &str, key: &str) {
    let map = state.placed_improvements.get_or_insert_with(BTreeMap::new);
    let entry = map
        .entry(hk.to_owned())
        .or_insert_with(|| PlacedLayers::Many(Vec::new()));
    let mut list = match entry {
        PlacedLayers::One(s) => vec![s.clone()],
        PlacedLayers::Many(list) => std::mem::take(list),
    };
    list.push(key.to_owned());
    *entry = PlacedLayers::Many(list);
}

fn qualifies(state: &ImprovementBuildState, key: &str, q: i32, r: i32) -> bool {
    build_improvement_qualifier(state).qualifies(key, q, r)
}

fn hex_dist(q: i32, r: i32, cq: i32, cr: i32) -> f64 {
    let dq = q - cq;
    let dr = r - cr;
    (f64::from((dq).abs()) + f64::from((dr).abs()) + f64::from((dq + dr).abs())) / 2.0
}

fn parse_key(k: &str) -> (i32, i32) {
    let (qs, rs) = k.split_once(',').expect("klucz heksu q,r");
    (qs.parse().expect("q"), rs.parse().expect("r"))
}

fn is_forest(map: &BuildMap, hk: &str) -> bool {
    map.hex(hk)
        .is_some_and(|h: &BuildHex| h.overlay == Overlay::Las)
}

/// Web `pickAutoImprovements` (pin :419). Zwraca picki w kolejnosci dodawania.
pub fn pick_auto_improvements(opts: PickAutoImprovementsOpts<'_>) -> Vec<AutoImprovementPick> {
    let PickAutoImprovementsOpts {
        cities,
        owner_id,
        map,
        territory_nodes,
        placed_improvements,
        praca_available,
        unlocked_techs,
        praca_budget_percent,
        city_praca_budget_percent,
        improvement_budget_cap,
        max_items_per_city,
        praca_surplus_threshold,
        skip_wyrab,
        city_skip_wyrab,
        demand_driven,
        resource_deficit_keys,
        surplus_report,
        civ_archetype,
        player_era,
        priority_override,
        worked_hex_keys,
    } = opts;
    let mut surplus_report = surplus_report;

    let Some(territory_nodes) = territory_nodes else {
        return Vec::new();
    };
    if cities.is_empty() {
        return Vec::new();
    }

    let skip_wyrab = skip_wyrab.unwrap_or(false);
    let demand_driven = demand_driven.unwrap_or(false);
    let max_items = max_items_per_city.unwrap_or(f64::INFINITY);
    let praca_pct_default = praca_budget_percent.unwrap_or(100.0);

    // ZASADA 1: niedobor wspolny dla calego wywolania.
    let deficit_active = has_non_food_resource_deficit(resource_deficit_keys);
    if let Some(rep) = surplus_report.as_deref_mut() {
        rep.deficit_active = deficit_active;
    }

    let mut praca_left = praca_available;
    let reserve = praca_surplus_threshold.unwrap_or(0.0);
    if praca_left <= reserve {
        return Vec::new();
    }

    // Pula wejsciowa zamrozona przed wydatkiem (web: globalPracaPulaAtEntry).
    let global_praca_pula_at_entry = praca_available;
    let mut global_spent = 0.0_f64;

    let imperium_percent_clamped = js_max(0.0, js_min(100.0, praca_pct_default));
    let imperium_budget_cap = js_max(
        0.0,
        js_min(
            global_praca_pula_at_entry,
            match improvement_budget_cap {
                Some(cap) if cap.is_finite() => cap,
                _ => (imperium_percent_clamped / 100.0) * global_praca_pula_at_entry,
            },
        ),
    );

    // Stan kwalifikatora: placed_improvements (zywa mapa workingPlaced).
    let mut working: BTreeMap<String, PlacedLayers> = BTreeMap::new();
    if let Some(placed) = placed_improvements {
        for (hk, v) in placed {
            working.insert(hk.clone(), v.clone());
        }
    }

    // Web: `horseStockAvailable` = suma `surowce.kon` miast tego ownera.
    let horse_stock_available: f64 = cities.iter().fold(0.0, |sum, c| {
        if c.owner_id != owner_id {
            return sum;
        }
        sum + c.surowce_kon.unwrap_or(0.0)
    });
    let mut state = ImprovementBuildState::new(
        map.clone(),
        cities
            .iter()
            .map(|c| CityNode {
                q: c.q,
                r: c.r,
                is_outpost: None,
                is_fort: None,
                pop: c.population,
                level: 1.0,
                civ: None,
            })
            .collect(),
    );
    state.territory_nodes = Some(territory_nodes.to_vec());
    state.player_owner_id_num = Some(owner_id);
    state.placed_improvements = Some(working);
    state.researched_techs = Some(unlocked_techs.clone());
    state.player_civ_archetype = civ_archetype.clone();
    state.player_era = player_era;
    state.horse_stock_available = Some(horse_stock_available);
    state.trade_route_kon_unlocked = Some(false);

    // Web `riverHexKeys` (liczone raz na wywolanie).
    let mut river_hex_keys: HashSet<String> = HashSet::new();
    for path in &map.river_paths {
        for (q, r) in path {
            river_hex_keys.insert(format!("{q},{r}"));
        }
    }

    let mut ordered_cities: Vec<&AutoImprovementCity> = cities.iter().collect();
    ordered_cities.sort_by(|a, b| a.id.cmp(&b.id));

    let civ_gate = |key: &str| is_improvement_allowed_for_civ(key, civ_archetype.as_deref());
    let tech_ok = |key: &str| is_improvement_tech_unlocked(key, unlocked_techs);

    let mut picks: Vec<AutoImprovementPick> = Vec::new();
    let mut scheduled_wyrab: HashSet<String> = HashSet::new();

    for city in ordered_cities {
        if praca_left <= reserve {
            break;
        }

        let focus = city.ulepszenia_focus.unwrap_or_default();
        let city_skip = match city_skip_wyrab {
            Some(map_skip) => map_skip.get(&city.id).copied().unwrap_or(skip_wyrab),
            None => skip_wyrab,
        };
        let base_priority: Vec<String> = match &priority_override {
            Some(list) => list.clone(),
            None => priorities_for_ulepszenia_focus(focus, city_skip)
                .into_iter()
                .map(str::to_owned)
                .collect(),
        };
        let only_worked = city.ulepszenia_only_worked.unwrap_or(false);
        let worked_keys: Option<&BTreeSet<String>> = if only_worked {
            worked_hex_keys.and_then(|m| m.get(&city.id))
        } else {
            None
        };

        // ZASADA 1 (runda 4): budowanie napedzane popytem (tylko profil zrownowazone).
        let demand_active = demand_driven && focus == UlepszeniaFocus::Zrownowazone;
        let food_only = demand_active && !deficit_active;
        if demand_active {
            if let Some(rep) = surplus_report.as_deref_mut() {
                rep.demand_active = true;
            }
        }
        let city_percent = match city_praca_budget_percent.and_then(|m| m.get(&city.id)) {
            Some(p) => js_max(0.0, js_min(100.0, *p)),
            None => js_max(0.0, js_min(100.0, praca_pct_default)),
        };
        let city_budget_cap = (city_percent / 100.0) * global_praca_pula_at_entry;
        let effective_city_cap = js_min(city_budget_cap, imperium_budget_cap);

        let radius = city_territory_radius(&CityNode {
            q: city.q,
            r: city.r,
            is_outpost: None,
            is_fort: None,
            pop: city.population,
            level: 1.0,
            civ: None,
        }) + 1.0;
        let mut candidate_hexes: Vec<(i32, i32)> =
            hex_keys_within_radius(city.q, city.r, radius, map)
                .iter()
                .map(|k| parse_key(k))
                .collect();
        candidate_hexes.sort_by(|a, b| a.0.cmp(&b.0).then(a.1.cmp(&b.1)));

        // ZASADA 2: budowa przy obywatelach, z wyjatkiem zloz.
        let hex_allows_key = |state_map: &BuildMap, q: i32, r: i32, key: &str| -> bool {
            match worked_keys {
                None => true,
                Some(set) => {
                    if set.contains(&format!("{q},{r}")) {
                        return true;
                    }
                    state_map.hex(&format!("{q},{r}")).is_some_and(|hex| {
                        hex_has_deposit_reserve(hex) && deposit_allows_player_improvement(key, hex)
                    })
                }
            }
        };

        let radius_hexes = candidate_hexes.clone();
        if let Some(set) = worked_keys {
            candidate_hexes.retain(|&(q, r)| {
                if set.contains(&format!("{q},{r}")) {
                    return true;
                }
                map.hex(&format!("{q},{r}"))
                    .is_some_and(hex_has_deposit_reserve)
            });
        }

        let mut placed_this_city: f64 = 0.0;
        let hex_dist_city = |q: i32, r: i32| hex_dist(q, r, city.q, city.r);

        // Fazy FAZA 0/1/2 i KROK 0 korzystaja z tych samych warunkow co web.
        let hex_phase_priority: Vec<String> = base_priority
            .iter()
            .filter(|k| {
                k.as_str() != "wyrab"
                    && !ZERO_YIELD_IMPROVEMENTS.contains(&k.as_str())
                    && (!food_only || ULEPSZENIA_FOCUS_ZYWNOSC.contains(&k.as_str()))
            })
            .cloned()
            .collect();
        let defense_priority: Vec<String> = if food_only {
            Vec::new()
        } else {
            base_priority
                .iter()
                .filter(|k| ZERO_YIELD_IMPROVEMENTS.contains(&k.as_str()))
                .cloned()
                .collect()
        };

        let mut city_budget_exhausted = false;

        // Kolejnosc heksow: rzeka najpierw, potem odleglosc od miasta, potem (q,r).
        let mut ordered_hexes = candidate_hexes.clone();
        ordered_hexes.sort_by(|a, b| {
            let ar = if river_hex_keys.contains(&format!("{},{}", a.0, a.1)) {
                0
            } else {
                1
            };
            let br = if river_hex_keys.contains(&format!("{},{}", b.0, b.1)) {
                0
            } else {
                1
            };
            ar.cmp(&br)
                .then(hex_dist_city(a.0, a.1).total_cmp(&hex_dist_city(b.0, b.1)))
                .then(a.0.cmp(&b.0))
                .then(a.1.cmp(&b.1))
        });

        // FAZA 0 - OBRONA (posterunek / fort).
        let plonowe_w_promieniu: usize = radius_hexes
            .iter()
            .map(|&(q, r)| {
                placed_get(&state, &format!("{q},{r}"))
                    .iter()
                    .filter(|k| !ZERO_YIELD_IMPROVEMENTS.contains(&k.as_str()))
                    .count()
            })
            .sum();

        if !defense_priority.is_empty() && (plonowe_w_promieniu as f64) >= or_zero(city.population)
        {
            let defense_cap = js_max(
                1.0,
                (or_zero(city.population) / JEDEN_NA_ILU_OBYWATELI).ceil(),
            );
            let mut border_hexes = candidate_hexes.clone();
            border_hexes.sort_by(|a, b| {
                hex_dist_city(b.0, b.1)
                    .total_cmp(&hex_dist_city(a.0, a.1))
                    .then(a.0.cmp(&b.0))
                    .then(a.1.cmp(&b.1))
            });
            for key in &defense_priority {
                let key = key.as_str();
                if global_spent >= effective_city_cap || placed_this_city >= max_items {
                    break;
                }
                if praca_left <= reserve {
                    break;
                }
                let Some(meta) = get_improvement_meta(key) else {
                    continue;
                };
                if !tech_ok(key) || !civ_gate(key) {
                    continue;
                }
                let have = radius_hexes
                    .iter()
                    .filter(|&&(q, r)| {
                        placed_get(&state, &format!("{q},{r}"))
                            .iter()
                            .any(|k| k == key)
                    })
                    .count() as f64;
                if have >= defense_cap {
                    continue;
                }
                for &(q, r) in &border_hexes {
                    if placed_this_city >= max_items {
                        break;
                    }
                    if meta.koszt_praca > praca_left {
                        break;
                    }
                    if praca_left - meta.koszt_praca < reserve {
                        break;
                    }
                    if global_spent + meta.koszt_praca > effective_city_cap {
                        break;
                    }
                    let hk = format!("{q},{r}");
                    if placed_get(&state, &hk)
                        .iter()
                        .any(|k| ZERO_YIELD_IMPROVEMENTS.contains(&k.as_str()))
                    {
                        continue;
                    }
                    if !hex_allows_key(map, q, r, key) {
                        continue;
                    }
                    if !qualifies(&state, key, q, r) {
                        continue;
                    }
                    if let Some(rep) = surplus_report.as_deref_mut() {
                        rep.any_candidate = true;
                    }
                    picks.push(AutoImprovementPick {
                        owner_id,
                        city_id: city.id.clone(),
                        q,
                        r,
                        key: key.to_owned(),
                        koszt_praca: meta.koszt_praca,
                    });
                    praca_left -= meta.koszt_praca;
                    global_spent += meta.koszt_praca;
                    placed_this_city += 1.0;
                    placed_push(&mut state, &hk, key);
                    break;
                }
            }
        }

        // KROK 0 - wyrab na heksie rzeka+las.
        let wyrab_wlaczony = !city_skip && base_priority.iter().any(|k| k == "wyrab");
        let mut forest_left_in_radius: f64 = radius_hexes
            .iter()
            .filter(|&&(q, r)| {
                let hk = format!("{q},{r}");
                !scheduled_wyrab.contains(&hk) && is_forest(map, &hk)
            })
            .count() as f64;

        let rzeki_do_zagospodarowania = wyrab_wlaczony
            && candidate_hexes.iter().any(|&(q, r)| {
                let hk = format!("{q},{r}");
                if !river_hex_keys.contains(&hk) {
                    return false;
                }
                if scheduled_wyrab.contains(&hk) {
                    return false;
                }
                if is_forest(map, &hk) {
                    return true;
                }
                if !placed_get(&state, &hk).is_empty() {
                    return false;
                }
                hex_phase_priority
                    .iter()
                    .any(|k| hex_allows_key(map, q, r, k.as_str()) && qualifies(&state, k, q, r))
            });

        let lesne_min = ceil_per_citizens(city.population);
        let lesne_wymagane: Vec<&str> = ["tartak", "oboz_lowiecki"]
            .into_iter()
            .filter(|k| hex_phase_priority.iter().any(|p| p.as_str() == *k))
            .filter(|k| tech_ok(k) && civ_gate(k))
            .collect();
        let lesne_min_spelnione = lesne_wymagane.iter().all(|k| {
            let have = radius_hexes
                .iter()
                .filter(|&&(q, r)| {
                    placed_get(&state, &format!("{q},{r}"))
                        .iter()
                        .any(|x| x.as_str() == *k)
                })
                .count() as f64;
            have >= lesne_min
        });
        let wolno_karczowac_poza_rzeka = !rzeki_do_zagospodarowania && lesne_min_spelnione;

        // FAZA 1 - heks po heksie.
        for &(q, r) in &ordered_hexes {
            if global_spent >= effective_city_cap
                || placed_this_city >= max_items
                || praca_left <= reserve
            {
                city_budget_exhausted = true;
                break;
            }
            let hk = format!("{q},{r}");

            if wyrab_wlaczony
                && lesne_min_spelnione
                && (river_hex_keys.contains(&hk) || wolno_karczowac_poza_rzeka)
                && !scheduled_wyrab.contains(&hk)
                && is_forest(map, &hk)
                && forest_left_in_radius >= WYRAB_MIN_FOREST_IN_RADIUS
                && !placed_get(&state, &hk)
                    .iter()
                    .any(|k| k == "tartak" || k == "oboz_lowiecki")
                && hex_allows_key(map, q, r, "wyrab")
            {
                if let Some(wyrab_meta) = get_improvement_meta("wyrab") {
                    if tech_ok("wyrab")
                        && civ_gate("wyrab")
                        && wyrab_meta.koszt_praca <= praca_left
                        && praca_left - wyrab_meta.koszt_praca >= reserve
                        && global_spent + wyrab_meta.koszt_praca <= effective_city_cap
                        && qualifies(&state, "wyrab", q, r)
                    {
                        picks.push(AutoImprovementPick {
                            owner_id,
                            city_id: city.id.clone(),
                            q,
                            r,
                            key: "wyrab".to_owned(),
                            koszt_praca: wyrab_meta.koszt_praca,
                        });
                        praca_left -= wyrab_meta.koszt_praca;
                        global_spent += wyrab_meta.koszt_praca;
                        placed_this_city += 1.0;
                        scheduled_wyrab.insert(hk.clone());
                        forest_left_in_radius -= 1.0;
                        continue;
                    }
                }
            }

            for key in &hex_phase_priority {
                let key = key.as_str();
                if global_spent >= effective_city_cap || placed_this_city >= max_items {
                    city_budget_exhausted = true;
                    break;
                }
                let Some(meta) = get_improvement_meta(key) else {
                    continue;
                };
                if meta.koszt_praca > praca_left {
                    continue;
                }
                if praca_left - meta.koszt_praca < reserve {
                    continue;
                }
                if global_spent + meta.koszt_praca > effective_city_cap {
                    continue;
                }
                if !tech_ok(key) || !civ_gate(key) {
                    continue;
                }
                // Straznik duplikatu warstwy na tym heksie.
                if placed_get(&state, &hk).iter().any(|k| k == key) {
                    continue;
                }
                if !hex_allows_key(map, q, r, key) {
                    continue;
                }
                if !qualifies(&state, key, q, r) {
                    continue;
                }
                if let Some(rep) = surplus_report.as_deref_mut() {
                    rep.any_candidate = true;
                }
                picks.push(AutoImprovementPick {
                    owner_id,
                    city_id: city.id.clone(),
                    q,
                    r,
                    key: key.to_owned(),
                    koszt_praca: meta.koszt_praca,
                });
                praca_left -= meta.koszt_praca;
                global_spent += meta.koszt_praca;
                placed_this_city += 1.0;
                placed_push(&mut state, &hk, key);
            }
            if praca_left <= reserve {
                city_budget_exhausted = true;
                break;
            }
        }

        // FAZA 2 - wyrab "po staremu" (tylko przy zapasie, bez niedoboru / przy nie-foodOnly).
        if !city_budget_exhausted
            && !food_only
            && !city_skip
            && base_priority.iter().any(|k| k == "wyrab")
        {
            let key = "wyrab";
            if let Some(meta) = get_improvement_meta(key) {
                let tech_civ_ok = tech_ok(key) && civ_gate(key);
                if tech_civ_ok
                    && meta.koszt_praca <= praca_left
                    && praca_left - meta.koszt_praca >= reserve
                {
                    let forest_count = radius_hexes
                        .iter()
                        .filter(|&&(q, r)| {
                            let hk = format!("{q},{r}");
                            !scheduled_wyrab.contains(&hk) && is_forest(map, &hk)
                        })
                        .count() as f64;
                    if forest_count > WYRAB_MIN_FOREST_IN_RADIUS {
                        while global_spent < effective_city_cap
                            && placed_this_city < max_items
                            && meta.koszt_praca <= praca_left
                        {
                            if praca_left - meta.koszt_praca < reserve {
                                break;
                            }
                            if global_spent + meta.koszt_praca > effective_city_cap {
                                break;
                            }
                            let mut placed_one = false;
                            for &(q, r) in &ordered_hexes {
                                let hk = format!("{q},{r}");
                                if scheduled_wyrab.contains(&hk) {
                                    continue;
                                }
                                if !hex_allows_key(map, q, r, key) {
                                    continue;
                                }
                                if placed_get(&state, &hk)
                                    .iter()
                                    .any(|k| k == "tartak" || k == "oboz_lowiecki")
                                {
                                    continue;
                                }
                                if !qualifies(&state, key, q, r) {
                                    continue;
                                }
                                picks.push(AutoImprovementPick {
                                    owner_id,
                                    city_id: city.id.clone(),
                                    q,
                                    r,
                                    key: key.to_owned(),
                                    koszt_praca: meta.koszt_praca,
                                });
                                praca_left -= meta.koszt_praca;
                                global_spent += meta.koszt_praca;
                                placed_this_city += 1.0;
                                scheduled_wyrab.insert(hk);
                                placed_one = true;
                                break;
                            }
                            if !placed_one {
                                break;
                            }
                        }
                    }
                }
            }
        }

        // ZASADA 3 - sonda kandydatow (tylko przy raporcie i bez dotychczasowego kandydata).
        if let Some(rep) = surplus_report.as_deref_mut() {
            if !rep.any_candidate {
                for &(q, r) in &ordered_hexes {
                    if rep.any_candidate {
                        break;
                    }
                    let hk = format!("{q},{r}");
                    for key in &hex_phase_priority {
                        let key = key.as_str();
                        if get_improvement_meta(key).is_none() {
                            continue;
                        }
                        if !tech_ok(key) || !civ_gate(key) {
                            continue;
                        }
                        if placed_get(&state, &hk).iter().any(|k| k == key) {
                            continue;
                        }
                        if !hex_allows_key(map, q, r, key) {
                            continue;
                        }
                        if !qualifies(&state, key, q, r) {
                            continue;
                        }
                        rep.any_candidate = true;
                        break;
                    }
                }
            }
        }
    }

    if let Some(rep) = surplus_report {
        rep.surplus = rep.demand_active && !rep.deficit_active && !rep.any_candidate;
    }

    picks
}
