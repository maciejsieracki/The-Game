//! P6.8I (8I-P2b, cz. 3): fazy per-miasto `pickAutoImprovementsSinglePass` (pin 4bbef081d): FAZA 0 obrona,
//! KROK 0 + FAZA 1 heks po heksie, FAZA 2 wyrab po typie, sonda nadwyzki (ZASADA 3).

use super::city_phases::{count_forest, hex_dist, pop_or_zero, Acc, CityEnv};
use super::opts::{AutoImprovementCity, AutoImprovementPick, PickAutoImprovementsOpts};
use super::single_pass::{in_zero_yield, Shared};
use super::{js_max, JEDEN_NA_ILU_OBYWATELI, WYRAB_MIN_FOREST_IN_RADIUS};
use crate::domain::improvement_build::get_improvement_meta;
use crate::domain::start_position::Overlay;

pub(super) fn push_pick(
    acc: &mut Acc,
    opts: &PickAutoImprovementsOpts,
    city: &AutoImprovementCity,
    (q, r): (i32, i32),
    key: &str,
    koszt: f64,
) {
    acc.picks.push(AutoImprovementPick {
        owner_id: opts.owner_id,
        city_id: city.id.clone(),
        q,
        r,
        key: key.to_owned(),
        koszt_praca: koszt,
    });
    acc.praca_left -= koszt;
    acc.global_spent += koszt;
    acc.placed_this_city += 1.0;
}

/// FAZA 0 - OBRONA (posterunek/fort na granicy zasiegu miasta, pulap `ceil(pop/10)`).
pub(super) fn phase_defense(
    sh: &mut Shared,
    env: &CityEnv,
    acc: &mut Acc,
    opts: &PickAutoImprovementsOpts,
) {
    let plonowe = env.radius_hexes.iter().fold(0.0, |n, &(q, r)| {
        n + sh
            .placed(&format!("{q},{r}"))
            .iter()
            .filter(|k| !in_zero_yield(k))
            .count() as f64
    });
    let pop = pop_or_zero(env.city.population);
    if env.defense_priority.is_empty() || plonowe < pop {
        return;
    }
    let defense_cap = js_max(1.0, (pop / JEDEN_NA_ILU_OBYWATELI).ceil());
    let mut border: Vec<(i32, i32)> = env.candidate_hexes.clone();
    border.sort_by(|a, b| {
        hex_dist(&env.city, b.0, b.1)
            .partial_cmp(&hex_dist(&env.city, a.0, a.1))
            .unwrap_or(std::cmp::Ordering::Equal)
            .then(a.0.cmp(&b.0))
            .then(a.1.cmp(&b.1))
    });
    for key in &env.defense_priority {
        if acc.global_spent >= env.effective_city_cap || acc.placed_this_city >= env.max_items {
            break;
        }
        if acc.praca_left <= env.reserve {
            break;
        }
        let Some(meta) = get_improvement_meta(key) else {
            continue;
        };
        if !sh.tech_ok(key) || !sh.civ_ok(key) {
            continue;
        }
        let have = env
            .radius_hexes
            .iter()
            .filter(|&&(q, r)| sh.hex_layers_contain(&format!("{q},{r}"), key))
            .count() as f64;
        if have >= defense_cap {
            continue;
        }
        for &(q, r) in &border {
            if acc.placed_this_city >= env.max_items {
                break;
            }
            if meta.koszt_praca > acc.praca_left {
                break;
            }
            if acc.praca_left - meta.koszt_praca < env.reserve {
                break;
            }
            if acc.global_spent + meta.koszt_praca > env.effective_city_cap {
                break;
            }
            let hk = format!("{q},{r}");
            if sh.placed(&hk).iter().any(|k| in_zero_yield(k)) {
                continue;
            }
            if !env.hex_allows_key(sh, q, r, key) {
                continue;
            }
            if !sh.qualifies(key, q, r) {
                continue;
            }
            if let Some(sr) = opts.surplus_report {
                sr.borrow_mut().any_candidate = true;
            }
            push_pick(acc, opts, &env.city, (q, r), key, meta.koszt_praca);
            sh.add_layer(&hk, key);
            break;
        }
    }
}

/// KROK 0 (wyrab) i FAZA 1 (heks po heksie).
pub(super) fn phase_hexes(
    sh: &mut Shared,
    env: &CityEnv,
    acc: &mut Acc,
    opts: &PickAutoImprovementsOpts,
) {
    for &(q, r) in &env.ordered_hexes {
        if acc.global_spent >= env.effective_city_cap
            || acc.placed_this_city >= env.max_items
            || acc.praca_left <= env.reserve
        {
            acc.city_budget_exhausted = true;
            break;
        }
        let hex_key = format!("{q},{r}");
        if step0_applies(sh, env, acc, q, r, &hex_key) {
            if let Some(meta) = get_improvement_meta("wyrab") {
                if sh.tech_ok("wyrab")
                    && sh.civ_ok("wyrab")
                    && meta.koszt_praca <= acc.praca_left
                    && acc.praca_left - meta.koszt_praca >= env.reserve
                    && acc.global_spent + meta.koszt_praca <= env.effective_city_cap
                    && sh.qualifies("wyrab", q, r)
                {
                    push_pick(acc, opts, &env.city, (q, r), "wyrab", meta.koszt_praca);
                    acc.scheduled_wyrab.insert(hex_key);
                    acc.forest_left -= 1.0;
                    continue;
                }
            }
        }
        for key in &env.hex_phase_priority {
            if acc.global_spent >= env.effective_city_cap || acc.placed_this_city >= env.max_items {
                acc.city_budget_exhausted = true;
                break;
            }
            let Some(meta) = get_improvement_meta(key) else {
                continue;
            };
            if meta.koszt_praca > acc.praca_left
                || acc.praca_left - meta.koszt_praca < env.reserve
                || acc.global_spent + meta.koszt_praca > env.effective_city_cap
            {
                continue;
            }
            if !sh.tech_ok(key) || !sh.civ_ok(key) {
                continue;
            }
            if sh.hex_layers_contain(&hex_key, key) {
                continue;
            }
            if (key == "tartak" || key == "oboz_lowiecki") && env.river_krok0_ok(sh, acc, q, r) {
                continue;
            }
            if !env.hex_allows_key(sh, q, r, key) {
                continue;
            }
            if env.key_blocked_on_hex(sh, acc, key, &hex_key) {
                continue;
            }
            if !sh.qualifies(key, q, r) {
                continue;
            }
            if let Some(sr) = opts.surplus_report {
                sr.borrow_mut().any_candidate = true;
            }
            push_pick(acc, opts, &env.city, (q, r), key, meta.koszt_praca);
            sh.add_layer(&hex_key, key);
        }
        if acc.praca_left <= env.reserve {
            acc.city_budget_exhausted = true;
            break;
        }
    }
}

/// Warunek wejscia w KROK 0 (rzeka+las ALBO wyrab poza rzeka z bramkami).
fn step0_applies(sh: &Shared, env: &CityEnv, acc: &Acc, q: i32, r: i32, hex_key: &str) -> bool {
    if env.river_krok0_ok(sh, acc, q, r) {
        return true;
    }
    env.wyrab_wlaczony
        && (env.off_river_clearing || env.lesne_min_spelnione)
        && env.wolno_karczowac_poza_rzeka
        && !sh.river_hex_keys.contains(hex_key)
        && !acc.scheduled_wyrab.contains(hex_key)
        && sh.map.hex(hex_key).map(|h| h.overlay) == Some(Overlay::Las)
        && env.wyrab_ma_sens(sh, q, r)
        && (env.off_river_clearing || acc.forest_left >= WYRAB_MIN_FOREST_IN_RADIUS)
        && !sh
            .placed(hex_key)
            .iter()
            .any(|k| k == "tartak" || k == "oboz_lowiecki")
        && env.hex_allows_key(sh, q, r, "wyrab")
}

/// FAZA 2 - `wyrab` po typie (stare zasady, z progiem zachowania lasu).
pub(super) fn phase_wyrab_by_type(
    sh: &mut Shared,
    env: &CityEnv,
    acc: &mut Acc,
    opts: &PickAutoImprovementsOpts,
) {
    if env.river_forest_clearing_only
        || acc.city_budget_exhausted
        || env.demand_active
        || env.city_skip_wyrab
        || !env.base_priority.iter().any(|k| k == "wyrab")
    {
        return;
    }
    let key = "wyrab";
    let Some(meta) = get_improvement_meta(key) else {
        return;
    };
    let tech_ok = sh.tech_ok(key) && sh.civ_ok(key);
    if !(tech_ok
        && meta.koszt_praca <= acc.praca_left
        && acc.praca_left - meta.koszt_praca >= env.reserve)
    {
        return;
    }
    let forest_count = count_forest(sh, acc, &env.radius_hexes);
    if forest_count < WYRAB_MIN_FOREST_IN_RADIUS {
        return;
    }
    while acc.global_spent < env.effective_city_cap
        && acc.placed_this_city < env.max_items
        && meta.koszt_praca <= acc.praca_left
    {
        if acc.praca_left - meta.koszt_praca < env.reserve {
            break;
        }
        if acc.global_spent + meta.koszt_praca > env.effective_city_cap {
            break;
        }
        let mut placed_one = false;
        for &(q, r) in &env.ordered_hexes {
            let hk = format!("{q},{r}");
            if acc.scheduled_wyrab.contains(&hk) {
                continue;
            }
            if !env.wyrab_ma_sens(sh, q, r) {
                continue;
            }
            if !env.hex_allows_key(sh, q, r, key) {
                continue;
            }
            if sh
                .placed(&hk)
                .iter()
                .any(|k| k == "tartak" || k == "oboz_lowiecki")
            {
                continue;
            }
            if !sh.qualifies(key, q, r) {
                continue;
            }
            acc.picks.push(AutoImprovementPick {
                owner_id: opts.owner_id,
                city_id: env.city.id.clone(),
                q,
                r,
                key: key.to_owned(),
                koszt_praca: meta.koszt_praca,
            });
            acc.praca_left -= meta.koszt_praca;
            acc.global_spent += meta.koszt_praca;
            acc.placed_this_city += 1.0;
            acc.scheduled_wyrab.insert(hk);
            placed_one = true;
            break;
        }
        if !placed_one {
            break;
        }
    }
}

/// ZASADA 3 - sonda kandydatow (bez testow kosztu; nie dodaje pickow).
pub(super) fn phase_probe(sh: &Shared, env: &CityEnv, acc: &Acc, opts: &PickAutoImprovementsOpts) {
    let Some(sr) = opts.surplus_report else {
        return;
    };
    if sr.borrow().any_candidate {
        return;
    }
    for &(q, r) in &env.ordered_hexes {
        if sr.borrow().any_candidate {
            break;
        }
        let hex_key = format!("{q},{r}");
        for key in &env.hex_phase_priority {
            if get_improvement_meta(key).is_none() {
                continue;
            }
            if !sh.tech_ok(key) || !sh.civ_ok(key) {
                continue;
            }
            if sh.hex_layers_contain(&hex_key, key) {
                continue;
            }
            if !env.hex_allows_key(sh, q, r, key) {
                continue;
            }
            if env.key_blocked_on_hex(sh, acc, key, &hex_key) {
                continue;
            }
            if !sh.qualifies(key, q, r) {
                continue;
            }
            sr.borrow_mut().any_candidate = true;
            break;
        }
    }
}
