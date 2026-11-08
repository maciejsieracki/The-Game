#!/usr/bin/env python3
"""REPIN-AUTOIMPROVE r2: mutacje galezi sterujacych NOWEGO/ZMIENIONEGO kodu (Rust).

Kazdy mutant = jedna podmiana tekstu (n-te wystapienie `old` -> `new`) w pliku
rust-port/engine/src/..., potem testy; oczekiwane FAIL (KILLED). Plik jest przywracany po kazdym mutancie
i weryfikowany bajt w bajt na koncu. Testy: `cargo test --test p6_8i_pick pick_auto` z filtrem rodzin scenariuszy
(`P6_8I_ONLY=<prefiksy>`; nazwy rodzin w generatorze) oraz/lub `--test p6_repin_autoimpr_terrain` / `p6_m16_qualifier`.

Uzycie:  python3 mutate-repin.py <od> <do> <plik_wyniku>     (indeksy [od, do))
         python3 mutate-repin.py list
Wynik: linie `ID: KILLED|SURVIVED|INVALID(compile)|TIMEOUT`.
"""
import os
import signal
import subprocess
import sys


def _term(signum, frame):
    raise KeyboardInterrupt  # uruchamia blok finally (przywrocenie pliku) przy SIGTERM z `timeout`


signal.signal(signal.SIGTERM, _term)

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..', '..'))
ENGINE = os.environ.get('MUT_ENGINE') or os.path.join(REPO, 'rust-port', 'engine')
SRC = os.path.join(ENGINE, 'src', 'domain')

M = []


def m(mid, rel, old, new, tests, occ=1):
    M.append((mid, rel, old, new, tests, occ))


CP = 'auto_improvements/city_phases.rs'
HP = 'auto_improvements/hex_phases.rs'
SP = 'auto_improvements/single_pass.rs'
PK = 'auto_improvements/pick.rs'
RP = 'auto_improvements/road_network_plan.rs'
AB = 'auto_improvements/auto_build_gate.rs'
RL = 'auto_improvements/relief_preserving.rs'
IB = 'improvement_build.rs'
IM = 'improvements.rs'
AI = 'auto_improvements.rs'

# zestawy testow: (P6_8I_ONLY, [dodatkowe --test])
T_CI = ('ci-,fh-,fhk-,fhb-,hc-,hunt-,df-,kz-', [])   # r3: +kz- (F8: N35 remis, N20 Gory)
T_RC = ('rc-,rcd-,ci-,rb1-,rb2-,rb3-,kz-', [])        # r3: +kz- (F8: N20 wycinka na nie-farmowym)
T_RP = ('rp-', ['p6_repin_autoimpr_terrain'])
T_RA = ('ra-,rc-,ci-,rk-,rn-,rb1-,rb2-,rb3-', [])
T_K7 = ('kz7-', [])   # R-RUSTPORT-REPIN-AUTOIMPROVE-MUTANTY-Q1: rodzina kz7- (N56-N58, F11)
T_TERR = (None, ['p6_repin_autoimpr_terrain'])
T_PLAN = T_TERR  # plan drog: 400 planow z weba (szybko)
T_M16 = (None, ['p6_repin_autoimpr_terrain', 'p6_m16_qualifier'])
T_REL = (None, ['p6_8i_relief'])

# ---- city_phases.rs: hex_allows_key / is_river_no_citizen_clear_hex -------------------------------------
m('N01_allows_horse_true', CP, 'return key == "stadnina";', 'return true;', T_CI)
m('N02_allows_horse_false', CP, 'return key == "stadnina";', 'return false;', T_CI)
m('N03_allows_horse_drop', CP, 'if self.fort_horse_extra.contains(&hk) {', 'if false {', T_CI)
m('N04_allows_clear_drop', CP, 'if key == "wyrab" && self.is_river_no_citizen_clear_hex(sh, q, r) {', 'if false {', T_RC)
m('N05_allows_clear_le', CP, 'self.river_no_citizen_clears.get() < self.river_no_citizen_max', 'self.river_no_citizen_clears.get() <= self.river_no_citizen_max', T_RC)
m('N06_allows_clear_gt', CP, 'self.river_no_citizen_clears.get() < self.river_no_citizen_max', 'self.river_no_citizen_clears.get() > self.river_no_citizen_max', T_RC)
m('N07_allows_clear_keyany', CP, 'if key == "wyrab" && self.is_river_no_citizen_clear_hex(sh, q, r) {', 'if self.is_river_no_citizen_clear_hex(sh, q, r) {', T_RC)
m('N08_allows_food_drop', CP, 'if FOOD_IMPROVEMENT_KEYS.contains(&key) {', 'if false {', T_CI)
m('N09_allows_food_none_false', CP, '.is_none_or(|w| w.contains(&hk));', '.is_some_and(|w| w.contains(&hk));', T_CI)
m('N10_allows_food_neg', CP, '.is_none_or(|w| w.contains(&hk));', '.is_none_or(|w| !w.contains(&hk));', T_CI)
m('N11_allows_default_false', CP, '        }\n        true\n    }\n\n    /// Web `wyrabMaSens`', '        }\n        false\n    }\n\n    /// Web `wyrabMaSens`', T_CI)
m('N12_clear_drop_pass', CP, 'if !self.river_clear_no_citizen_pass\n            ||', 'if false\n            ||', T_RC)
m('N13_clear_drop_zyw', CP, '!(self.focus == UlepszeniaFocus::Zywnosc\n                || self.focus == UlepszeniaFocus::Zrownowazone)', '!(self.focus == UlepszeniaFocus::Zrownowazone)', T_RC)
m('N14_clear_drop_zrown', CP, '!(self.focus == UlepszeniaFocus::Zywnosc\n                || self.focus == UlepszeniaFocus::Zrownowazone)', '!(self.focus == UlepszeniaFocus::Zywnosc)', T_RC)
m('N15_clear_focus_and', CP, 'self.focus == UlepszeniaFocus::Zywnosc\n                || self.focus == UlepszeniaFocus::Zrownowazone)\n        {\n            return false;', 'self.focus == UlepszeniaFocus::Zywnosc\n                && self.focus == UlepszeniaFocus::Zrownowazone)\n        {\n            return false;', T_RC)
m('N16_clear_worked_inv', CP, 'if worked.contains(&hk) {\n            return false;\n        }\n        sh.map.hex(&hk).is_some_and(|hx| {', 'if !worked.contains(&hk) {\n            return false;\n        }\n        sh.map.hex(&hk).is_some_and(|hx| {', T_RC)
m('N17_clear_worked_drop', CP, 'if worked.contains(&hk) {\n            return false;\n        }\n        sh.map.hex(&hk).is_some_and(|hx| {', 'if false {\n            return false;\n        }\n        sh.map.hex(&hk).is_some_and(|hx| {', T_RC)
m('N18_clear_noworked_true', CP, 'let Some(worked) = &self.food_worked_keys else {\n            return false;', 'let Some(worked) = &self.food_worked_keys else {\n            return true;', T_RC)
m('N19_clear_overlay_brak', CP, 'hx.overlay == Overlay::Las\n                && is_farm_base_terrain(hx.terrain, Overlay::Brak)\n                && sh.on_river_hex(&hk)', 'hx.overlay != Overlay::Las\n                && is_farm_base_terrain(hx.terrain, Overlay::Brak)\n                && sh.on_river_hex(&hk)', T_RC)
m('N20_clear_drop_farmbase', CP, '&& is_farm_base_terrain(hx.terrain, Overlay::Brak)\n                && sh.on_river_hex(&hk)', '&& sh.on_river_hex(&hk)', T_RC)
m('N21_clear_drop_river', CP, '&& is_farm_base_terrain(hx.terrain, Overlay::Brak)\n                && sh.on_river_hex(&hk)', '&& is_farm_base_terrain(hx.terrain, Overlay::Brak)', T_RC)
m('N22_wyrabsens_las', CP, '.is_some_and(|hx| is_farm_base_terrain(hx.terrain, Overlay::Brak))\n    }\n\n    pub(super) fn river_krok0_ok', '.is_some_and(|hx| is_farm_base_terrain(hx.terrain, Overlay::Las))\n    }\n\n    pub(super) fn river_krok0_ok', T_CI)
m('N23_wyrabsens_true', CP, '.is_some_and(|hx| is_farm_base_terrain(hx.terrain, Overlay::Brak))\n    }\n\n    pub(super) fn river_krok0_ok', '.is_some_and(|_| true)\n    }\n\n    pub(super) fn river_krok0_ok', T_CI)
m('N24_road_gate_drop', CP, 'if ROAD_KEYS.contains(&key) && !sh.road_plan_has(hex_key) {', 'if false {', T_RP)
m('N25_road_gate_inv', CP, 'if ROAD_KEYS.contains(&key) && !sh.road_plan_has(hex_key) {', 'if ROAD_KEYS.contains(&key) && sh.road_plan_has(hex_key) {', T_RP)
m('N26_road_gate_keys', CP, 'if ROAD_KEYS.contains(&key) && !sh.road_plan_has(hex_key) {', 'if key == "droga" && !sh.road_plan_has(hex_key) {', T_RP)
# build_city_env
m('N27_env_center_drop', CP, 'set.insert(format!("{},{}", city.q, city.r));', 'let _ = &set;', T_CI)
m('N28_env_skipwyrab_false', CP, 'let city_skip_wyrab = opts.skip_wyrab;', 'let city_skip_wyrab = false;', ('ra-,stg-,rnd-1', []))
m('N29_env_horse_owner_drop', CP, '|| n.owner_id != opts.owner_id', '|| false', T_CI)
m('N30_env_horse_fortcond', CP, 'if !(n.node.is_fort == Some(true) || n.node.is_outpost == Some(true))', 'if !(n.node.is_fort == Some(true))', T_CI)
m('N31_env_horse_fortcond2', CP, 'if !(n.node.is_fort == Some(true) || n.node.is_outpost == Some(true))', 'if !(n.node.is_outpost == Some(true))', T_CI)
m('N32_env_horse_ring_drop', CP, 'if in_city_ring.contains(&(hq, hr)) || fort_horse_extra.contains(&k) {', 'if fort_horse_extra.contains(&k) {', T_CI)
m('N33_env_horse_deposit_drop', CP, 'if !hex_has_horse_deposit(hx) {', 'if false {', T_CI)
m('N34_env_horse_tie_greater', CP, 'cmp_js_str(&c.id, &b.id) == std::cmp::Ordering::Less', 'cmp_js_str(&c.id, &b.id) == std::cmp::Ordering::Greater', T_CI)
m('N35_env_horse_tie_drop', CP, 'let tie = d == bd', 'let tie = false', T_CI)
m('N36_env_horse_lt_le', CP, 'if d < bd || tie {', 'if d <= bd || tie {', T_CI)
m('N37_env_horse_nearest_any', CP, 'if best.is_some_and(|b| b.id == city.id) {', 'if best.is_some() {', T_CI)
m('N38_env_horse_push_drop', CP, 'for k in &fort_horse_extra {\n        candidate_hexes.push(parse_key(k));\n    }', 'for k in &fort_horse_extra {\n        let _ = parse_key(k);\n    }', T_CI)
m('N39_env_max_default', CP, '.unwrap_or(RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY),', '.unwrap_or(RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY + 1.0),', T_RC)
# ---- hex_phases.rs ---------------------------------------------------------------------------------------
m('N40_hp_defense_cap_drop', HP, 'if acc.global_spent >= env.effective_city_cap {\n            break;\n        }\n        if acc.praca_left <= env.reserve {', 'if false {\n            break;\n        }\n        if acc.praca_left <= env.reserve {', ('df-,ra-', []))
m('N41_hp_counter_krok0_drop', HP, 'if env.is_river_no_citizen_clear_hex(sh, q, r) {\n                        env.river_no_citizen_clears\n                            .set(env.river_no_citizen_clears.get() + 1.0);\n                    }', 'let _ = ();', T_RC)
m('N42_hp_counter_faza2_drop', HP, 'if env.is_river_no_citizen_clear_hex(sh, q, r) {\n                env.river_no_citizen_clears\n                    .set(env.river_no_citizen_clears.get() + 1.0);\n            }', 'let _ = ();', ('rc-,ra-,ci-,stg-', []))
m('N43_hp_probe_noworked_return', HP, 'if sr.borrow().any_candidate || env.food_worked_keys.is_none() {\n        return;', 'if sr.borrow().any_candidate {\n        return;', T_CI)
m('N44_hp_probe_allows_inv', HP, 'if env.hex_allows_key(sh, q, r, key) {\n                continue;\n            }\n            if get_improvement_meta(key).is_none() {\n                continue;\n            }\n            if !sh.tech_ok(key) || !sh.civ_ok(key) {\n                continue;\n            }\n            if sh.hex_layers_contain(&hex_key, key) {\n                continue;\n            }\n            if env.key_blocked_on_hex(sh, acc, key, &hex_key) {\n                continue;\n            }\n            if !sh.qualifies(key, q, r) {\n                continue;\n            }\n            sr.borrow_mut().filter_waiting_keys', 'if !env.hex_allows_key(sh, q, r, key) {\n                continue;\n            }\n            if get_improvement_meta(key).is_none() {\n                continue;\n            }\n            if !sh.tech_ok(key) || !sh.civ_ok(key) {\n                continue;\n            }\n            if sh.hex_layers_contain(&hex_key, key) {\n                continue;\n            }\n            if env.key_blocked_on_hex(sh, acc, key, &hex_key) {\n                continue;\n            }\n            if !sh.qualifies(key, q, r) {\n                continue;\n            }\n            sr.borrow_mut().filter_waiting_keys', T_CI)
m('N45_hp_probe_blocked_drop', HP, 'if env.key_blocked_on_hex(sh, acc, key, &hex_key) {\n                continue;\n            }\n            if !sh.qualifies(key, q, r) {\n                continue;\n            }\n            sr.borrow_mut().filter_waiting_keys', 'if false {\n                continue;\n            }\n            if !sh.qualifies(key, q, r) {\n                continue;\n            }\n            sr.borrow_mut().filter_waiting_keys', T_CI)
m('N46_hp_probe_qualifies_drop', HP, 'if !sh.qualifies(key, q, r) {\n                continue;\n            }\n            sr.borrow_mut().filter_waiting_keys', 'if false {\n                continue;\n            }\n            sr.borrow_mut().filter_waiting_keys', T_CI)
m('N47_hp_probe_seen_drop', HP, 'if sr.borrow().filter_waiting_keys.contains(&hex_key) {\n            continue;\n        }', 'if false {\n            continue;\n        }', T_CI)
# ---- pick.rs ---------------------------------------------------------------------------------------------
m('N48_pk_krok0_deficit_drop', PK, 'if staged_cities.is_empty() || !deficit_picks.is_empty() {', 'if staged_cities.is_empty() {', T_RA)
m('N49_pk_krok0_prio', PK, 'o.cities = staged_cities.clone();\n                o.priority_override = Some(vec!["wyrab".to_owned()]);', 'o.cities = staged_cities.clone();\n                o.priority_override = Some(vec!["farma".to_owned()]);', T_RA)
m('N50_pk_krok0_spent_drop', PK, 'let stage_opts = run.after(river_clear_spent + deficit_spent, |o| {', 'let stage_opts = run.after(deficit_spent, |o| {', T_RA)
m('N51_pk_stagespent_drop', PK, 'let stage_spent = river_clear_spent + deficit_spent + sum(&staged_picks);', 'let stage_spent = deficit_spent + sum(&staged_picks);', T_RA)
m('N52_pk_done_drop', PK, 'let food_and_fallback_done = river_clear_picks.is_empty()\n        && staged_picks.is_empty()', 'let food_and_fallback_done = staged_picks.is_empty()', T_RA)
m('N53_pk_record_normal_drop', PK, 'run.record(&normal);', 'let _ = &normal;', T_RA)
m('N54_pk_normalspent_drop', PK, 'let normal_spent = side_spent + sum(&normal);', 'let normal_spent = side_spent;', T_RA)
m('N55_pk_k7_drop_stage', PK, '        && !earlier_stage_is_pending\n        && !fallback_is_pending\n        && !fort_is_pending\n        && (deficit_cities', '        && !fallback_is_pending\n        && !fort_is_pending\n        && (deficit_cities', T_RA)
m('N56_pk_k7_drop_fallback', PK, '        && !earlier_stage_is_pending\n        && !fallback_is_pending\n        && !fort_is_pending\n        && (deficit_cities', '        && !earlier_stage_is_pending\n        && !fort_is_pending\n        && (deficit_cities', T_K7)
m('N57_pk_k7_drop_fort', PK, '        && !fallback_is_pending\n        && !fort_is_pending\n        && (deficit_cities', '        && !fallback_is_pending\n        && (deficit_cities', T_K7)
m('N58_pk_k7_drop_deficit', PK, '&& (deficit_cities.is_empty() || !deficit_is_pending_now(&run))\n    {\n        no_citizen_clear_picks', '&& true\n    {\n        no_citizen_clear_picks', T_K7)
m('N59_pk_k7_floor_pool_drop', PK, 'js_max(0.0, opts.praca_available - normal_spent - no_citizen_floor);', 'js_max(0.0, opts.praca_available - normal_spent);', T_RC)
m('N60_pk_k7_floor_cap_drop', PK, 'run.total_budget - normal_spent - no_citizen_floor,', 'run.total_budget - normal_spent,', T_RC)
m('N61_pk_k7_pass_flag_drop', PK, 'o.river_clear_no_citizen_pass = true;', 'o.river_clear_no_citizen_pass = false;', T_RC)
m('N62_pk_k7_floor_default', PK, '.unwrap_or(RIVER_CLEAR_NO_CITIZEN_POOL_FLOOR);', '.unwrap_or(RIVER_CLEAR_NO_CITIZEN_POOL_FLOOR + 1.0);', T_RC)
m('N63_pk_k7_cities_other', PK, 'o.cities = staged_cities.clone();\n                o.priority_override = Some(vec!["wyrab".to_owned()]);\n                o.river_forest_clearing_only = true;\n                o.river_hexes_only = false;\n                o.off_river_clearing = false;\n                o.irrigation_needs_farm = true;\n                o.river_clear_no_citizen_pass = true;', 'o.cities = other_cities.clone();\n                o.priority_override = Some(vec!["wyrab".to_owned()]);\n                o.river_forest_clearing_only = true;\n                o.river_hexes_only = false;\n                o.off_river_clearing = false;\n                o.irrigation_needs_farm = true;\n                o.river_clear_no_citizen_pass = true;', T_RC)
m('N64_pk_order_drop_krok0', PK, 'out.extend(river_clear_picks);', 'let _ = &river_clear_picks;', T_RA)
m('N65_pk_order_drop_k7', PK, 'out.extend(no_citizen_clear_picks);', 'let _ = &no_citizen_clear_picks;', T_RC)
m('N66_pk_k7_onlywyrab', PK, 'o.priority_override = Some(vec!["wyrab".to_owned()]);\n                o.river_forest_clearing_only = true;\n                o.river_hexes_only = false;\n                o.off_river_clearing = false;\n                o.irrigation_needs_farm = true;\n                o.river_clear_no_citizen_pass = true;', 'o.river_forest_clearing_only = true;\n                o.river_hexes_only = false;\n                o.off_river_clearing = false;\n                o.irrigation_needs_farm = true;\n                o.river_clear_no_citizen_pass = true;', T_RC)
# ---- single_pass.rs: plan drog ---------------------------------------------------------------------------
m('N67_sp_road_owner_drop', SP, '.filter(|c| c.owner_id == self.owner_id)\n            .map(|c| RoadPlanCity {', '.map(|c| RoadPlanCity {', T_RP)
m('N68_sp_road_radius_plus', SP, 'territory_radius_pin(&CityNode::city(c.q, c.r, c.population)) + 1.0;', 'territory_radius_pin(&CityNode::city(c.q, c.r, c.population)) + 0.0;', T_RP)
m('N69_sp_road_owner_check', SP, 'if territory_owner_at(kk.0, kk.1, nodes) == Some(self.owner_id) {', 'if territory_owner_at(kk.0, kk.1, nodes).is_some() {', T_RP)
m('N70_sp_road_keys_drop', SP, 'road_keys.insert(parse_key(hk));', 'let _ = parse_key(hk);', T_RP)
m('N71_sp_road_memo_drop', SP, 'if let Some(plan) = &self.road_memo.borrow().plan {\n            return plan.contains(hex_key);\n        }', 'if false {\n            return false;\n        }', T_RP)
m('N72_sp_road_traversable_drop', SP, 'is_traversable: Some(&trav),', 'is_traversable: None,', T_RP)
m('N73_sp_road_extra_drop', SP, 'extra_road_keys: Some(&road_keys),', 'extra_road_keys: None,', T_RP)
# ---- road_network_plan.rs ---------------------------------------------------------------------------------
m('N74_rp_cost_hills', RP, 'const COST_HILLS: i64 = 150;', 'const COST_HILLS: i64 = 100;', T_PLAN)
m('N75_rp_cost_mountain', RP, 'const COST_MOUNTAIN: i64 = 600;', 'const COST_MOUNTAIN: i64 = 300;', T_PLAN)
m('N76_rp_cost_road', RP, 'const COST_ROAD: i64 = 10;', 'const COST_ROAD: i64 = 50;', T_PLAN)
m('N77_rp_cost_planned', RP, 'const COST_PLANNED: i64 = 5;', 'const COST_PLANNED: i64 = 50;', T_PLAN)
m('N78_rp_cost_city', RP, 'const COST_CITY: i64 = 1;', 'const COST_CITY: i64 = 40;', T_PLAN)
m('N79_rp_nearest_k', RP, 'const NEAREST_K: usize = 5;', 'const NEAREST_K: usize = 1;', T_PLAN)
m('N80_rp_cap_formula', RP, 'let cap = COST_BASE * 3 * last_d + COST_MOUNTAIN;', 'let cap = COST_BASE * last_d;', T_PLAN)
m('N81_rp_n_lt_2', RP, 'if n < 2 {', 'if n < 1 {', T_PLAN)
m('N82_rp_sort_ids', RP, 'sorted.sort_by(|a, b| super::cmp_js_str(&a.id, &b.id));', 'sorted.sort_by(|a, b| b.id.cmp(&a.id));', T_PLAN)
m('N83_rp_land_pustynia', RP, '            | TerrainType::Gory\n            | TerrainType::Pustynia', '            | TerrainType::Gory', T_PLAN)
m('N84_rp_planned_cheaper', RP, 'if planned.is_some_and(|p| p.contains(&nk)) && w > COST_PLANNED {', 'if false && w > COST_PLANNED {', T_PLAN)
m('N85_rp_triangle_skip', RP, 'if axial_dist(nb[i], nb[j]) == 1 {', 'if axial_dist(nb[i], nb[j]) == 2 {', T_PLAN)
m('N86_rp_conn_check', RP, 'if nb.iter().all(|x| seen.contains(x)) {\n            planned.remove(&h);', 'if true {\n            planned.remove(&h);', T_PLAN)
m('N87_rp_kruskal_skip', RP, 'if a == b {\n            continue;\n        }\n        uf[a] = b;\n        chosen.push(*e);', 'uf[a] = b;\n        chosen.push(*e);', T_PLAN)
m('N88_rp_comp_tie', RP, 'd < b.2 || (d == b.2 && (i < b.0 || (i == b.0 && j < b.1)))', 'd < b.2', T_PLAN)
m('N89_rp_dij_left', RP, 'if left <= 0 {', 'if left < 0 {', T_PLAN)
m('N90_rp_dij_cap', RP, 'if nd > cap {', 'if nd >= cap {', T_PLAN)
m('N91_rp_trav_check', RP, 'Some(_) if self.opts.is_traversable.is_some_and(|f| !f(k.0, k.1)) => -1,', 'Some(_) if false => -1,', T_PLAN)
m('N92_rp_extra_road', RP, 'self.opts.extra_road_keys.is_some_and(|e| e.contains(&k))\n                        || hex_has_road(hex)', 'hex_has_road(hex)', T_PLAN)
# ---- improvement_build.rs / improvements.rs / gate / relief ------------------------------------------------
m('N93_ib_outpost_empty', IB, 'if all_nodes.is_empty() {\n        return false;\n    }\n    if territory_owner_at(q, r, all_nodes) != Some(owner_id) {', 'if false {\n        return false;\n    }\n    if territory_owner_at(q, r, all_nodes) != Some(owner_id) {', T_M16)
m('N94_ib_outpost_owner', IB, 'if territory_owner_at(q, r, all_nodes) != Some(owner_id) {\n        return false;\n    }\n    [(1, 0)', 'if false {\n        return false;\n    }\n    [(1, 0)', T_M16)
m('N95_ib_outpost_border', IB, '.any(|(dq, dr)| territory_owner_at(q + dq, r + dr, all_nodes) != Some(owner_id))', '.all(|(dq, dr)| territory_owner_at(q + dq, r + dr, all_nodes) != Some(owner_id))', T_M16)
m('N96_ib_posterunek_fallback', IB, '.map(|c| TerritoryNode::new(c.clone(), self.player_owner_id_num))', '.map(|c| TerritoryNode::new(c.clone(), self.player_owner_id_num + 1))', T_M16)
m('N97_ib_river_neighbor', IB, 'if self.state.map.hex(&nk).is_some_and(|hex| hex.river_present) {\n                return true;\n            }', '', T_M16)
m('N98_ib_horse_zloze', IB, 'crate::domain::improvements::hex_has_horse_deposit_like(Some(hex.overlay), hex.zloze.as_deref())', 'hex.overlay == Overlay::ZlozeKonia', T_CI)
m('N99_ib_candidates_owner', IB, 'if node.owner_id != owner_num {\n            continue;\n        }\n        let rad = city_territory_radius(&node.node) + tables().file.domyslne.pierscien_kandydatow;', 'if false {\n            continue;\n        }\n        let rad = city_territory_radius(&node.node) + tables().file.domyslne.pierscien_kandydatow;', T_M16)
m('N100_ib_horse_unlock_hex', IB, 'return hex_has_horse_deposit(hex)\n            || trade_route_kon_unlocked', 'return hex.overlay == Overlay::ZlozeKonia\n            || trade_route_kon_unlocked', T_M16)
m('N101_im_era_base', IM, 'if base.is_nan() || base <= 0.0 || (era != 2.0 && era != 3.0) {', 'if base.is_nan() || base < 0.0 || (era != 2.0 && era != 3.0) {', T_TERR)
m('N102_im_era_cond', IM, '(era != 2.0 && era != 3.0)', '(era != 2.0)', T_TERR)
m('N103_im_era_stats', IM, 'if !ERA_SCALED_YIELD_STATS.contains(&stat) {\n        return base;\n    }', 'if false {\n        return base;\n    }', T_TERR)
m('N104_im_era_formula', IM, 'base + (era - 1.0)', 'base + era', T_TERR)
m('N105_im_all_producers_set', IM, 'if !rules()\n        .terytorium\n        .ulepszenia\n        .iter()\n        .any(|row| row.ulepszenie == key)\n    {\n        return base_amount;', 'if key != "tartak" {\n        return base_amount;', T_TERR)
m('N106_im_all_era_norm', IM, 'Some(era) if era.fract() == 0.0 && era > first && era <= production.epoka_max as f64 => era,\n        _ => first,\n    };\n    js_round(base_amount * production.mnoznik_za_epoke.powf(normalized - first))\n}\n\nfn territory_yield_amount_for_key', 'Some(era) if era.fract() == 0.0 && era > first => era,\n        _ => first,\n    };\n    js_round(base_amount * production.mnoznik_za_epoke.powf(normalized - first))\n}\n\nfn territory_yield_amount_for_key', T_TERR)
m('N107_im_bonus_scaled', IM, 'let scaled = |stat: &str, v: Option<f64>| {\n        v.filter(|x| *x != 0.0 && !x.is_nan())\n            .map(|x| improvement_yield_for_era(key, stat, x, era))\n    };', 'let scaled = |_stat: &str, v: Option<f64>| v.filter(|x| *x != 0.0 && !x.is_nan());', T_TERR)
m('N108_im_horse_konie', IM, '== "konie"', '== "kon"', T_TERR)
m('N109_gate_human', AB, '        .any(|h| *h == owner_id || (h.is_nan() && owner_id.is_nan()))', '        .any(|h| *h == owner_id)', T_TERR)
m('N110_gate_allowed_ai', AB, 'if !is_human_seat_owner(owner_id, human_owner_ids) {\n        return true;', 'if !is_human_seat_owner(owner_id, human_owner_ids) {\n        return false;', T_TERR)
m('N111_gate_enabled', AB, '    auto_build_enabled\n}', '    true\n}', T_TERR)
m('N112_gate_savemeta', AB, 'matches!(raw, Some(Value::Bool(true)))', 'matches!(raw, Some(Value::Bool(_)))', T_TERR)
m('N113_gate_newgame', AB, 'Some(Value::Bool(b)) => *b,\n        _ => AUTO_BUILD_ENABLED_DEFAULT,', 'Some(Value::Bool(b)) => *b,\n        _ => true,', T_TERR)
m('N114_gate_default', AB, 'pub const AUTO_BUILD_ENABLED_DEFAULT: bool = false;', 'pub const AUTO_BUILD_ENABLED_DEFAULT: bool = true;', T_TERR)
m('N115_relief_oboz', RL, '    "tartak",\n    "oboz_lowiecki",\n];', '    "tartak",\n    "oboz_lowieckiX",\n];', T_REL)
m('N116_ai_food_keys_wyrab', AI, '    "warzelnia_soli",\n    "wyrab",\n];', '    "warzelnia_soli",\n    "wyrabX",\n];', T_CI)
m('N117_ai_food_keys_oboz', AI, '    "warzelnia_soli",\n    "wyrab",\n];', '    "warzelnia_soli",\n    "oboz_lowiecki",\n];', T_CI)
m('N118_ai_clear_max', AI, 'pub const RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY: f64 = 2.0;', 'pub const RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY: f64 = 3.0;', T_RC)
m('N119_ai_clear_floor', AI, 'pub const RIVER_CLEAR_NO_CITIZEN_POOL_FLOOR: f64 = 60.0;', 'pub const RIVER_CLEAR_NO_CITIZEN_POOL_FLOOR: f64 = 30.0;', T_RC)


def run_tests(tests):
    only, extra = tests
    env = dict(os.environ)
    env.update({'CARGO_INCREMENTAL': '0', 'CARGO_PROFILE_DEV_DEBUG': '0', 'CARGO_PROFILE_TEST_DEBUG': '0'})
    cmds = []
    if only is not None:
        e = dict(env)
        e['P6_8I_ONLY'] = only
        cmds.append((['cargo', 'test', '--test', 'p6_8i_pick', 'pick_auto'], e))
    for t in extra:
        cmds.append((['cargo', 'test', '--test', t], env))
    verdict = 'SURVIVED'
    for cmd, e in cmds:
        try:
            p = subprocess.run(cmd, cwd=ENGINE, env=e, capture_output=True, text=True, timeout=420)
        except subprocess.TimeoutExpired:
            return 'TIMEOUT'
        out = p.stdout + p.stderr
        if 'could not compile' in out or 'error[E' in out:
            return 'INVALID(compile)'
        if p.returncode != 0:
            return 'KILLED'
    return verdict


def main():
    if len(sys.argv) >= 2 and sys.argv[1] == 'list':
        for i, (mid, rel, old, new, tests, occ) in enumerate(M):
            print(i, mid, rel)
        return
    lo, hi, outp = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
    ids = os.environ.get('MUT_IDS')
    idset = set(ids.split(',')) if ids else None
    for i in range(lo, min(hi, len(M))):
        mid, rel, old, new, tests, occ = M[i]
        if idset is not None and mid.split('_')[0] not in idset:
            continue
        path = os.path.join(SRC, rel)
        orig = open(path, encoding='utf-8').read()
        idx = -1
        for _ in range(occ):
            idx = orig.find(old, idx + 1)
            if idx < 0:
                break
        if idx < 0:
            res = 'NOOP(brak tekstu)'
        else:
            mutated = orig[:idx] + new + orig[idx + len(old):]
            open(path, 'w', encoding='utf-8').write(mutated)
            try:
                res = run_tests(tests)
            finally:
                open(path, 'w', encoding='utf-8').write(orig)
        with open(outp, 'a') as f:
            f.write(f'{mid}: {res}\n')
        print(mid, res, flush=True)
        assert open(path, encoding='utf-8').read() == orig, 'plik nie przywrocony'


if __name__ == '__main__':
    main()
