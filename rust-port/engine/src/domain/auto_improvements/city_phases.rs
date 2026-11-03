//! P6.8I (8I-P2b, cz. 2): per-miasto czesc `pickAutoImprovementsSinglePass` (pin 4bbef081d): wyliczenia
//! per miasto (`CityEnv`), FAZA 0 obrona, KROK 0 + FAZA 1 heks po heksie, FAZA 2 wyrab po typie, sonda
//! nadwyzki (ZASADA 3). Wywolywane z `single_pass::pick_auto_improvements_single_pass`.

use std::cell::Cell;
use std::collections::BTreeSet;

use super::opts::{
    AutoImprovementCity, AutoImprovementPick, PickAutoImprovementsOpts, UlepszeniaFocus,
    DEFAULT_ULEPSZENIA_FOCUS,
};
use super::single_pass::{in_zero_yield, parse_key, Shared};
use super::{
    js_max, js_min, priorities_for_ulepszenia_focus, FOREST_BUILDING_KEYS, JEDEN_NA_ILU_OBYWATELI,
    RIVER_DEVELOPMENT_KEYS, ROAD_KEYS, ULEPSZENIA_FOOD_ONLY_ZROWNOWAZONE,
};
use crate::domain::improvement_build::{
    deposit_allows_player_improvement, get_improvement_meta, hex_has_deposit_reserve,
    hex_keys_within_radius, is_farm_base_terrain,
};
use crate::domain::improvements::TerrainType;
use crate::domain::start_position::Overlay;
use crate::domain::terrain::CityNode;

pub(super) fn jbool_focus(
    c: &AutoImprovementCity,
    opts: &PickAutoImprovementsOpts,
) -> UlepszeniaFocus {
    match opts.get_focus {
        Some(f) => f(c),
        None => c.ulepszenia_focus.unwrap_or(DEFAULT_ULEPSZENIA_FOCUS),
    }
}

/// Wynik wyliczen per miasto, niezmienny w trakcie faz.
pub(super) struct CityEnv {
    pub(super) city: AutoImprovementCity,
    pub(super) base_priority: Vec<String>,
    pub(super) hex_phase_priority: Vec<String>,
    pub(super) defense_priority: Vec<String>,
    pub(super) worked_keys: Option<BTreeSet<String>>,
    pub(super) candidate_hexes: Vec<(i32, i32)>,
    pub(super) radius_hexes: Vec<(i32, i32)>,
    pub(super) ordered_hexes: Vec<(i32, i32)>,
    pub(super) effective_city_cap: f64,
    pub(super) reserve: f64,
    pub(super) max_items: f64,
    pub(super) demand_active: bool,
    pub(super) city_skip_wyrab: bool,
    pub(super) tartak_dozwolony: bool,
    pub(super) wyrab_wlaczony: bool,
    pub(super) wyrab_tylko_pod_farme: bool,
    pub(super) rzeki_do_zagospodarowania: bool,
    pub(super) lesne_min_spelnione: bool,
    pub(super) wolno_karczowac_poza_rzeka: bool,
    pub(super) river_forest_clearing_only: bool,
    pub(super) off_river_clearing: bool,
    pub(super) irrigation_needs_farm: bool,
    pub(super) hill_memo: Cell<Option<(usize, bool)>>,
}

/// Zmienny stan przebiegu.
pub(super) struct Acc {
    pub(super) picks: Vec<AutoImprovementPick>,
    pub(super) praca_left: f64,
    pub(super) global_spent: f64,
    pub(super) placed_this_city: f64,
    pub(super) scheduled_wyrab: BTreeSet<String>,
    pub(super) forest_left: f64,
    pub(super) city_budget_exhausted: bool,
    /// Web `ownFortCircles` (U-3, R-WEB-AUTO-FORT-DIAG-Q1): leniwie liczone kola WLASNYCH fortow/posterunkow.
    pub(super) own_fort_circles: Option<Vec<(i32, i32, f64)>>,
}

pub(super) fn hex_dist(city: &AutoImprovementCity, q: i32, r: i32) -> f64 {
    let dq = f64::from(q) - f64::from(city.q);
    let dr = f64::from(r) - f64::from(city.r);
    (dq.abs() + dr.abs() + (dq + dr).abs()) / 2.0
}

impl CityEnv {
    /// Web `hexAllowsKey` (ZASADA 2).
    pub(super) fn hex_allows_key(&self, sh: &Shared, q: i32, r: i32, key: &str) -> bool {
        let Some(worked) = &self.worked_keys else {
            return true;
        };
        if worked.contains(&format!("{q},{r}")) {
            return true;
        }
        // isDepositHexForKey
        sh.map.hex(&format!("{q},{r}")).is_some_and(|hex| {
            hex_has_deposit_reserve(hex) && deposit_allows_player_improvement(key, hex)
        })
    }

    pub(super) fn wyrab_ma_sens(&self, sh: &Shared, q: i32, r: i32) -> bool {
        if !self.wyrab_tylko_pod_farme {
            return true;
        }
        sh.map
            .hex(&format!("{q},{r}"))
            .is_some_and(|hx| is_farm_base_terrain(hx.terrain, Overlay::Brak))
    }

    pub(super) fn river_krok0_ok(&self, sh: &Shared, acc: &Acc, q: i32, r: i32) -> bool {
        let hk = format!("{q},{r}");
        if !self.wyrab_wlaczony || get_improvement_meta("wyrab").is_none() {
            return false;
        }
        if !self.wyrab_ma_sens(sh, q, r) {
            return false;
        }
        // REPIN-DELTA-4 hunk auto-improvements.ts:1671 (`riverHexKeys.has` -> `onRiverHex`).
        if !sh.on_river_hex(&hk) {
            return false;
        }
        if acc.scheduled_wyrab.contains(&hk) {
            return false;
        }
        if sh.map.hex(&hk).map(|h| h.overlay) != Some(Overlay::Las) {
            return false;
        }
        if sh
            .placed(&hk)
            .iter()
            .any(|k| k == "tartak" || k == "oboz_lowiecki")
        {
            return false;
        }
        if !self.hex_allows_key(sh, q, r, "wyrab") {
            return false;
        }
        if !sh.tech_ok("wyrab") || !sh.civ_ok("wyrab") {
            return false;
        }
        sh.qualifies("wyrab", q, r)
    }

    pub(super) fn hill_tartak_pending(&self, sh: &Shared, acc: &Acc) -> bool {
        if let Some((at, val)) = self.hill_memo.get() {
            if at == acc.picks.len() {
                return val;
            }
        }
        let mut found = false;
        for &(q, r) in &self.ordered_hexes {
            let hk = format!("{q},{r}");
            let Some(hx) = sh.map.hex(&hk) else { continue };
            if hx.terrain != TerrainType::Wzgorza || hx.overlay != Overlay::Las {
                continue;
            }
            // hunk :1778 (`hasRiverAccess` -> `foodReservedHex`).
            if sh.food_reserved_hex(&hk) {
                continue;
            }
            if sh.hex_layers_contain(&hk, "tartak") {
                continue;
            }
            if acc.scheduled_wyrab.contains(&hk) {
                continue;
            }
            if !self.hex_allows_key(sh, q, r, "tartak") {
                continue;
            }
            if !sh.qualifies("tartak", q, r) {
                continue;
            }
            found = true;
            break;
        }
        self.hill_memo.set(Some((acc.picks.len(), found)));
        found
    }

    /// Web `keyBlockedOnHex` (bramki rodzaju ulepszenia na heksie, wspolne dla FAZY 1 i sondy).
    pub(super) fn key_blocked_on_hex(
        &self,
        sh: &Shared,
        acc: &Acc,
        key: &str,
        hex_key: &str,
    ) -> bool {
        let livestock = key == "bydlo" || key == "owce" || key == "lama";
        // hunk :1791 (`riverHexKeys.has` -> `onRiverHex`).
        if livestock && !sh.on_river_hex(hex_key) {
            return true;
        }
        if key == "irygacja"
            && self.irrigation_needs_farm
            && !sh.hex_layers_contain(hex_key, "farma")
        {
            return true;
        }
        if key == "tartak" && !self.tartak_dozwolony {
            return true;
        }
        // hunk :1808 (`hasRiverAccess` -> `foodReservedHex`; zero awaryjnego tartaku/obozu).
        if (key == "tartak" || key == "oboz_lowiecki") && sh.food_reserved_hex(hex_key) {
            return true;
        }
        if key == "tartak"
            && sh.map.hex(hex_key).map(|h| h.terrain) != Some(TerrainType::Wzgorza)
            && self.hill_tartak_pending(sh, acc)
        {
            return true;
        }
        false
    }
}

#[allow(clippy::too_many_arguments)]
pub(super) fn build_city_env(
    opts: &PickAutoImprovementsOpts,
    sh: &Shared,
    city: &AutoImprovementCity,
    deficit_open_keys: &BTreeSet<String>,
    imperium_budget_cap: f64,
    global_pula_at_entry: f64,
    praca_budget_percent: f64,
    reserve: f64,
    max_items: f64,
    demand_driven: bool,
) -> CityEnv {
    let focus = jbool_focus(city, opts);
    let city_skip_wyrab = match opts.get_skip_wyrab {
        Some(f) => f(city),
        None => opts.skip_wyrab,
    };
    let demand_active = demand_driven && focus == UlepszeniaFocus::Zrownowazone;
    let raw_priority: Vec<String> = match &opts.priority_override {
        Some(p) => p.clone(),
        None => priorities_for_ulepszenia_focus(focus, city_skip_wyrab),
    };
    let base_priority: Vec<String> = raw_priority
        .into_iter()
        .filter(|k| {
            focus != UlepszeniaFocus::Zywnosc || !FOREST_BUILDING_KEYS.contains(&k.as_str())
        })
        .filter(|k| {
            !demand_active
                || k == "wyrab"
                || ULEPSZENIA_FOOD_ONLY_ZROWNOWAZONE.contains(&k.as_str())
                || deficit_open_keys.contains(k)
                || (opts.roads_pass && ROAD_KEYS.contains(&k.as_str()))
        })
        .collect();
    let only_worked = match opts.get_only_worked {
        Some(f) => f(city),
        None => city.ulepszenia_only_worked.unwrap_or(false),
    };
    let worked_keys: Option<BTreeSet<String>> = match (only_worked, opts.get_worked_hex_keys) {
        (true, Some(f)) => {
            let mut set = f(city);
            if focus == UlepszeniaFocus::Zywnosc || focus == UlepszeniaFocus::Zrownowazone {
                set.insert(format!("{},{}", city.q, city.r));
            }
            Some(set)
        }
        _ => None,
    };

    let city_percent = js_max(
        0.0,
        js_min(
            100.0,
            match opts.get_praca_budget_percent {
                Some(f) => f(city),
                None => praca_budget_percent,
            },
        ),
    );
    let city_budget_cap = (city_percent / 100.0) * global_pula_at_entry;
    let effective_city_cap = js_min(city_budget_cap, imperium_budget_cap);

    let node = CityNode::city(city.q, city.r, city.population);
    let radius = super::territory_radius_pin(&node) + 1.0;
    let mut candidate_hexes: Vec<(i32, i32)> =
        hex_keys_within_radius(city.q, city.r, radius, sh.map)
            .iter()
            .map(|k| parse_key(k))
            .collect();
    candidate_hexes.sort_by(|a, b| a.0.cmp(&b.0).then(a.1.cmp(&b.1)));
    let radius_hexes = candidate_hexes.clone();
    if let Some(worked) = &worked_keys {
        candidate_hexes.retain(|&(q, r)| {
            let hk = format!("{q},{r}");
            worked.contains(&hk) || sh.map.hex(&hk).is_some_and(hex_has_deposit_reserve)
        });
    }
    let mut ordered_hexes: Vec<(i32, i32)> = candidate_hexes
        .iter()
        .copied()
        .filter(|&(q, r)| !opts.river_hexes_only || sh.on_river_hex(&format!("{q},{r}")))
        .collect();
    ordered_hexes.sort_by(|a, b| {
        // hunk :1481-1491: 3 stopnie - NA rzece (0) < tylko sasiad rzeki (1) < reszta (2).
        let rank = |h: (i32, i32)| -> i32 {
            let k = format!("{},{}", h.0, h.1);
            if sh.is_on_river(&k) {
                0
            } else if sh.on_river_hex(&k) {
                1
            } else {
                2
            }
        };
        let ar = rank(*a);
        let br = rank(*b);
        ar.cmp(&br)
            .then(
                hex_dist(city, a.0, a.1)
                    .partial_cmp(&hex_dist(city, b.0, b.1))
                    .unwrap_or(std::cmp::Ordering::Equal),
            )
            .then(a.0.cmp(&b.0))
            .then(a.1.cmp(&b.1))
    });

    let hex_phase_priority: Vec<String> = base_priority
        .iter()
        .filter(|k| k.as_str() != "wyrab" && !in_zero_yield(k))
        .cloned()
        .collect();
    let defense_priority: Vec<String> = if demand_active {
        Vec::new()
    } else {
        base_priority
            .iter()
            .filter(|k| in_zero_yield(k))
            .cloned()
            .collect()
    };

    let wyrab_wlaczony = !city_skip_wyrab && base_priority.iter().any(|k| k == "wyrab");
    let wyrab_tylko_pod_farme = demand_active || focus == UlepszeniaFocus::Zywnosc;
    let tartak_dozwolony = !demand_active
        || opts
            .resource_deficit_keys
            .as_ref()
            .is_some_and(|ks| ks.iter().any(|k| k == "drewno"));

    CityEnv {
        city: city.clone(),
        base_priority,
        hex_phase_priority,
        defense_priority,
        worked_keys,
        candidate_hexes,
        radius_hexes,
        ordered_hexes,
        effective_city_cap,
        reserve,
        max_items,
        demand_active,
        city_skip_wyrab,
        tartak_dozwolony,
        wyrab_wlaczony,
        wyrab_tylko_pod_farme,
        rzeki_do_zagospodarowania: false,
        lesne_min_spelnione: false,
        wolno_karczowac_poza_rzeka: false,
        river_forest_clearing_only: opts.river_forest_clearing_only,
        off_river_clearing: opts.off_river_clearing,
        irrigation_needs_farm: opts.irrigation_needs_farm,
        hill_memo: Cell::new(None),
    }
}

/// Czesc wyliczen per miasto liczona PO FAZIE 0 (web: po obronie, na biezacym `workingPlaced`).
pub(super) fn finish_env(sh: &Shared, acc: &Acc, env: &mut CityEnv) {
    let city = env.city.clone();
    env.rzeki_do_zagospodarowania = !env.off_river_clearing
        && env.wyrab_wlaczony
        && env
            .candidate_hexes
            .iter()
            .any(|&(q, r)| river_to_develop(sh, acc, env, q, r));
    let lesne_min = js_max(
        1.0,
        (pop_or_zero(city.population) / JEDEN_NA_ILU_OBYWATELI).ceil(),
    );
    let lesne_wymagane: Vec<&str> = ["tartak", "oboz_lowiecki"]
        .into_iter()
        .filter(|k| {
            !env.demand_active
                && env.tartak_dozwolony
                && env.hex_phase_priority.iter().any(|p| p == k)
        })
        .filter(|k| sh.tech_ok(k) && sh.civ_ok(k))
        .collect();
    env.lesne_min_spelnione = lesne_wymagane.iter().all(|k| {
        let mut have = 0.0;
        for &(q, r) in &env.radius_hexes {
            if sh.hex_layers_contain(&format!("{q},{r}"), k) {
                have += 1.0;
            }
            if have >= lesne_min {
                return true;
            }
        }
        false
    });
    env.wolno_karczowac_poza_rzeka = !env.river_forest_clearing_only
        && !env.rzeki_do_zagospodarowania
        && (env.off_river_clearing || env.lesne_min_spelnione);
}

pub(super) fn pop_or_zero(p: f64) -> f64 {
    if p.is_nan() {
        0.0
    } else {
        p
    }
}

/// Wnetrze `rzekiDoZagospodarowania.some(...)` dla jednego heksu kandydata.
pub(super) fn river_to_develop(sh: &Shared, acc: &Acc, env: &CityEnv, q: i32, r: i32) -> bool {
    let hk = format!("{q},{r}");
    // hunk :1697 (`riverHexKeys.has` -> `onRiverHex`).
    if !sh.on_river_hex(&hk) {
        return false;
    }
    if acc.scheduled_wyrab.contains(&hk) {
        return false;
    }
    if sh.map.hex(&hk).map(|h| h.overlay) == Some(Overlay::Las) && env.river_krok0_ok(sh, acc, q, r)
    {
        return true;
    }
    let placed_here = sh.placed(&hk);
    env.hex_phase_priority.iter().any(|k| {
        if !RIVER_DEVELOPMENT_KEYS.contains(&k.as_str()) {
            return false;
        }
        if placed_here.iter().any(|p| p == k) {
            return false;
        }
        if (k == "bydlo" || k == "owce" || k == "lama") && !sh.on_river_hex(&hk) {
            return false;
        }
        if !sh.tech_ok(k) || !sh.civ_ok(k) {
            return false;
        }
        env.hex_allows_key(sh, q, r, k) && sh.qualifies(k, q, r)
    })
}

pub(super) fn count_forest(sh: &Shared, acc: &Acc, hexes: &[(i32, i32)]) -> f64 {
    hexes.iter().fold(0.0, |n, &(q, r)| {
        let hk = format!("{q},{r}");
        if acc.scheduled_wyrab.contains(&hk) {
            return n;
        }
        if sh.map.hex(&hk).map(|h| h.overlay) == Some(Overlay::Las) {
            n + 1.0
        } else {
            n
        }
    })
}
