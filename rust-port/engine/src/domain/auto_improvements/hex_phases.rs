//! P6.8I (8I-P2b, cz. 3): fazy per-miasto `pickAutoImprovementsSinglePass` (REPIN-AUTOIMPROVE: web 180c08305): FAZA 0 obrona,
//! KROK 0 + FAZA 1 heks po heksie, FAZA 2 wyrab po typie, sonda nadwyzki (ZASADA 3).

use super::city_phases::{count_forest, hex_dist, pop_or_zero, Acc, CityEnv};
use super::opts::{AutoImprovementCity, AutoImprovementPick, PickAutoImprovementsOpts};
use super::single_pass::{in_zero_yield, Shared};
use super::{territory_radius_pin, WYRAB_MIN_FOREST_IN_RADIUS};
use crate::domain::improvement_build::get_improvement_meta;
use crate::domain::improvement_build::PlacedLayers;
use crate::domain::start_position::Overlay;
use crate::domain::terrain::{axial_distance, CityNode};

/// Web `fortKeyRadius` (auto-improvements.ts:773 @23dd158e9): promien twardego terytorium fortu (5) /
/// posterunku (3).
fn fort_key_radius(key: &str) -> f64 {
    territory_radius_pin(&CityNode {
        q: 0,
        r: 0,
        is_outpost: Some(key == "posterunek"),
        is_fort: Some(key == "fort"),
        pop: 0.0,
        level: 1.0,
        civ: None,
    })
}

/// Web `getOwnFortCircles` (:1293-1313): kola wlasnych fortow/posterunkow (wezly terytorium wlasciciela
/// + warstwy bez wezla, np. postawione wczesniej w tym wywolaniu). Liczone leniwie, raz na przebieg.
fn own_fort_circles<'a>(
    sh: &Shared,
    acc: &'a mut Acc,
    owner_id: i64,
) -> &'a mut Vec<(i32, i32, f64)> {
    if acc.own_fort_circles.is_none() {
        let mut out: Vec<(i32, i32, f64)> = Vec::new();
        let mut node_at: std::collections::HashSet<(i32, i32)> = std::collections::HashSet::new();
        for tn in sh.state.territory_nodes.as_deref().unwrap_or(&[]) {
            let n = &tn.node;
            if n.is_fort != Some(true) && n.is_outpost != Some(true) {
                continue;
            }
            node_at.insert((n.q, n.r));
            if tn.owner_id == owner_id {
                out.push((n.q, n.r, territory_radius_pin(n)));
            }
        }
        if let Some(placed) = &sh.state.placed_improvements {
            for (hk, layers) in placed {
                let (q, r) = super::single_pass::parse_key(hk);
                if node_at.contains(&(q, r)) {
                    continue;
                }
                if let PlacedLayers::Many(v) = layers {
                    for l in v {
                        if l == "fort" || l == "posterunek" {
                            out.push((q, r, fort_key_radius(l)));
                        }
                    }
                }
            }
        }
        acc.own_fort_circles = Some(out);
    }
    acc.own_fort_circles.as_mut().expect("kola")
}

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
}

/// FAZA 0 - OBRONA (posterunek/fort na granicy zasiegu miasta). Pulap `defenseCap = ceil(pop/10)` ZLIKWIDOWANY
/// (hunki 16, 28, 32, 33, 38-40, 61-67: limitem zostaje budzet Pracy, `plonowe >= pop` i reguly polozenia).
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
    let zero_start = acc.picks.len();
    let mut border: Vec<(i32, i32)> = env.candidate_hexes.clone();
    border.sort_by(|a, b| {
        hex_dist(&env.city, b.0, b.1)
            .partial_cmp(&hex_dist(&env.city, a.0, a.1))
            .unwrap_or(std::cmp::Ordering::Equal)
            .then(a.0.cmp(&b.0))
            .then(a.1.cmp(&b.1))
    });
    for key in &env.defense_priority {
        if acc.global_spent >= env.effective_city_cap {
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
        for &(q, r) in &border {
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
            // U-3 (hunk :1569-1573): kolo kandydata w CALOSCI wewnatrz kola wlasnego fortu/posterunku
            // (istniejacego albo zaplanowanego) nie daje nowego heksu terytorium - odpada.
            let is_fort_key = key == "fort" || key == "posterunek";
            if is_fort_key {
                let cand_rad = fort_key_radius(key);
                if own_fort_circles(sh, acc, opts.owner_id)
                    .iter()
                    .any(|&(fq, fr, frad)| axial_distance(q, r, fq, fr) + cand_rad <= frad)
                {
                    continue;
                }
            }
            if let Some(sr) = opts.surplus_report {
                sr.borrow_mut().any_candidate = true;
            }
            push_pick(acc, opts, &env.city, (q, r), key, meta.koszt_praca);
            if is_fort_key {
                own_fort_circles(sh, acc, opts.owner_id).push((q, r, fort_key_radius(key)));
            }
            sh.add_layer(&hk, key);
            break;
        }
    }
    // U-3 (hunk :1587-1608, obrona): posterunek zaplanowany PRZED fortem, ktorego kolo go w calosci
    // obejmuje, nic nie daje - cofamy go (zwrot Pracy, miejsca w miescie i warstwy).
    let zero_new: Vec<AutoImprovementPick> = acc.picks[zero_start..]
        .iter()
        .filter(|p| p.city_id == env.city.id && (p.key == "fort" || p.key == "posterunek"))
        .cloned()
        .collect();
    for pk in &zero_new {
        if pk.key != "posterunek" {
            continue;
        }
        let enclosed = zero_new.iter().any(|o| {
            !std::ptr::eq(o, pk)
                && o.key == "fort"
                && axial_distance(pk.q, pk.r, o.q, o.r) + fort_key_radius("posterunek")
                    <= fort_key_radius("fort")
        });
        if !enclosed {
            continue;
        }
        let Some(idx) = acc
            .picks
            .iter()
            .position(|p| p.city_id == pk.city_id && p.q == pk.q && p.r == pk.r && p.key == pk.key)
        else {
            continue;
        };
        acc.picks.remove(idx);
        acc.praca_left += pk.koszt_praca;
        acc.global_spent -= pk.koszt_praca;
        let hk = format!("{},{}", pk.q, pk.r);
        if let Some(placed) = sh.state.placed_improvements.as_mut() {
            let left: Vec<String> = match placed.get(&hk) {
                Some(PlacedLayers::Many(v)) => {
                    v.iter().filter(|l| *l != "posterunek").cloned().collect()
                }
                _ => Vec::new(),
            };
            if matches!(placed.get(&hk), Some(PlacedLayers::Many(_))) {
                if left.is_empty() {
                    placed.remove(&hk);
                } else {
                    placed.insert(hk, PlacedLayers::Many(left));
                }
            }
        }
        let rad = fort_key_radius("posterunek");
        let circles = own_fort_circles(sh, acc, opts.owner_id);
        if let Some(ci) = circles
            .iter()
            .position(|&(cq, cr, crad)| cq == pk.q && cr == pk.r && crad == rad)
        {
            circles.remove(ci);
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
        if acc.global_spent >= env.effective_city_cap || acc.praca_left <= env.reserve {
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
                    if env.is_river_no_citizen_clear_hex(sh, q, r) {
                        env.river_no_citizen_clears
                            .set(env.river_no_citizen_clears.get() + 1.0);
                    }
                    acc.scheduled_wyrab.insert(hex_key);
                    acc.forest_left -= 1.0;
                    continue;
                }
            }
        }
        for key in &env.hex_phase_priority {
            if acc.global_spent >= env.effective_city_cap {
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
        && !sh.on_river_hex(hex_key)
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
    while acc.global_spent < env.effective_city_cap && meta.koszt_praca <= acc.praca_left {
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
            if env.is_river_no_citizen_clear_hex(sh, q, r) {
                env.river_no_citizen_clears
                    .set(env.river_no_citizen_clears.get() + 1.0);
            }
            acc.praca_left -= meta.koszt_praca;
            acc.global_spent += meta.koszt_praca;
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
    // Hunk 83 (Q3, wskaznik niewydanego budzetu): gdy nadal brak kandydatow, a regula obywateli jest aktywna
    // (`foodWorkedKeys`), policz heksy promienia, ktore odpadly WYLACZNIE przez `hexAllowsKey`. Nie dodaje pickow.
    if sr.borrow().any_candidate || env.food_worked_keys.is_none() {
        return;
    }
    for &(q, r) in &env.radius_hexes {
        let hex_key = format!("{q},{r}");
        if sr.borrow().filter_waiting_keys.contains(&hex_key) {
            continue;
        }
        for key in &env.hex_phase_priority {
            if env.hex_allows_key(sh, q, r, key) {
                continue;
            }
            if get_improvement_meta(key).is_none() {
                continue;
            }
            if !sh.tech_ok(key) || !sh.civ_ok(key) {
                continue;
            }
            if sh.hex_layers_contain(&hex_key, key) {
                continue;
            }
            if env.key_blocked_on_hex(sh, acc, key, &hex_key) {
                continue;
            }
            if !sh.qualifies(key, q, r) {
                continue;
            }
            sr.borrow_mut().filter_waiting_keys.insert(hex_key.clone());
            break;
        }
    }
}
