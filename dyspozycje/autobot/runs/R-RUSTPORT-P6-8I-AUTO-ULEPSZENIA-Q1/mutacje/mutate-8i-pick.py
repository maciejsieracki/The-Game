#!/usr/bin/env python3
"""P6.8I (runda 4): mutacje galezi sterujacych pickera auto-ulepszen (Rust).

Kazdy mutant = jedna podmiana tekstu (n-te wystapienie `old` -> `new`) w pliku
rust-port/engine/src/domain/auto_improvements/<plik>, potem `cargo test --test p6_8i_pick`;
oczekiwane FAIL (KILLED). Plik jest przywracany po kazdym mutancie, a na koncu weryfikowany bajt w bajt.
Sciezki wzgledne od korzenia repo (skrypt lezy w dyspozycje/autobot/runs/<ID>/mutacje/).

Uzycie (z dowolnego katalogu):  python3 mutate-8i-pick.py <od> <do> [plik_wyniku]
  uruchamia mutanty o indeksach [od, do) i dopisuje linie `ID: KILLED|SURVIVED|NOOP|TIMEOUT` do pliku wyniku.
  `python3 mutate-8i-pick.py list` wypisuje tabele (indeks, ID, plik, opis).
"""
import os
import signal
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..', '..'))
# MUT_ENGINE: opcjonalna KOPIA katalogu rust-port/engine (rownolegle workery); domyslnie engine z repo.
ENGINE = os.environ.get('MUT_ENGINE') or os.path.join(REPO, 'rust-port', 'engine')
SRC = os.path.join(ENGINE, 'src', 'domain')
TARGET = os.environ.get('MUT_TARGET', '/dev/shm/p6-8i-mut')

M = []


def m(mid, rel, old, new, occ=1, desc=''):
    M.append((mid, rel, old, new, occ, desc))


CP = 'auto_improvements/city_phases.rs'
HP = 'auto_improvements/hex_phases.rs'
SP = 'auto_improvements/single_pass.rs'
FC = 'auto_improvements/fort_claim.rs'
PK = 'auto_improvements/pick.rs'
P1 = 'auto_improvements.rs'

# ---- city_phases.rs: hex_allows_key / wyrab_ma_sens / river_krok0_ok -------------------------------
m('C01_hexallows_noworked_false', CP, 'let Some(worked) = &self.worked_keys else {\n            return true;', 'let Some(worked) = &self.worked_keys else {\n            return false;')
m('C02_hexallows_worked_false', CP, 'if worked.contains(&format!("{q},{r}")) {\n            return true;', 'if worked.contains(&format!("{q},{r}")) {\n            return false;')
m('C03_hexallows_deposit_or', CP, 'hex_has_deposit_reserve(hex) && deposit_allows_player_improvement(key, hex)', 'hex_has_deposit_reserve(hex) || deposit_allows_player_improvement(key, hex)')
m('C04_hexallows_deposit_dropallows', CP, 'hex_has_deposit_reserve(hex) && deposit_allows_player_improvement(key, hex)', 'hex_has_deposit_reserve(hex) && true')
m('C05_wyrabsens_nofilter_false', CP, 'if !self.wyrab_tylko_pod_farme {\n            return true;', 'if !self.wyrab_tylko_pod_farme {\n            return false;')
m('C06_wyrabsens_overlay', CP, 'is_farm_base_terrain(hx.terrain, Overlay::Brak)', 'is_farm_base_terrain(hx.terrain, Overlay::Las)')
m('C07_krok0_or_meta', CP, '!self.wyrab_wlaczony || get_improvement_meta("wyrab").is_none()', '!self.wyrab_wlaczony && get_improvement_meta("wyrab").is_none()')
m('C08_krok0_drop_sens', CP, 'if !self.wyrab_ma_sens(sh, q, r) {\n            return false;', 'if false {\n            return false;')
m('C09_krok0_drop_river', CP, 'if !sh.river_hex_keys.contains(&hk) {\n            return false;', 'if false {\n            return false;', occ=1)
m('C10_krok0_drop_scheduled', CP, 'if acc.scheduled_wyrab.contains(&hk) {\n            return false;', 'if false {\n            return false;', occ=1)
m('C11_krok0_overlay_neg', CP, '!= Some(Overlay::Las) {\n            return false;', '== Some(Overlay::Las) {\n            return false;')
m('C12_krok0_drop_oboz', CP, '.any(|k| k == "tartak" || k == "oboz_lowiecki")', '.any(|k| k == "tartak")')
m('C13_krok0_drop_tartak', CP, '.any(|k| k == "tartak" || k == "oboz_lowiecki")', '.any(|k| k == "oboz_lowiecki")')
m('C14_krok0_drop_hexallows', CP, 'if !self.hex_allows_key(sh, q, r, "wyrab") {\n            return false;', 'if false {\n            return false;')
m('C15_krok0_drop_civ', CP, 'if !sh.tech_ok("wyrab") || !sh.civ_ok("wyrab") {', 'if !sh.tech_ok("wyrab") {')
m('C16_krok0_drop_tech', CP, 'if !sh.tech_ok("wyrab") || !sh.civ_ok("wyrab") {', 'if !sh.civ_ok("wyrab") {')
m('C17_krok0_qualifies_true', CP, 'sh.qualifies("wyrab", q, r)\n    }', 'true\n    }')
# hill_tartak_pending
m('C18_hill_memo_stale', CP, 'if at == acc.picks.len() {', 'if true {')
m('C19_hill_terrain_and', CP, 'hx.terrain != TerrainType::Wzgorza || hx.overlay != Overlay::Las', 'hx.terrain != TerrainType::Wzgorza && hx.overlay != Overlay::Las')
m('C20_hill_drop_riveraccess', CP, 'if sh.has_river_access(&hk) {', 'if false {')
m('C21_hill_drop_tartakhere', CP, 'if sh.hex_layers_contain(&hk, "tartak") {', 'if false {')
m('C22_hill_drop_scheduled', CP, 'if acc.scheduled_wyrab.contains(&hk) {\n                continue;', 'if false {\n                continue;', occ=1, desc='2. wystapienie tekstu w pliku to hill (kontekst z continue)')
m('C23_hill_drop_hexallows', CP, 'if !self.hex_allows_key(sh, q, r, "tartak") {', 'if false {')
m('C24_hill_qualifies_true', CP, 'if !sh.qualifies("tartak", q, r) {', 'if false {')
# key_blocked_on_hex
m('C25_block_livestock', CP, 'if livestock && !sh.river_hex_keys.contains(hex_key) {', 'if false {')
m('C26_block_livestock_names', CP, 'let livestock = key == "bydlo" || key == "owce" || key == "lama";', 'let livestock = key == "bydlo" || key == "owce";')
m('C27_block_irrig_dropflag', CP, '&& self.irrigation_needs_farm', '&& true')
m('C28_block_irrig_negfarm', CP, '&& !sh.hex_layers_contain(hex_key, "farma")', '&& sh.hex_layers_contain(hex_key, "farma")')
m('C29_block_tartak_dozwolony', CP, 'if key == "tartak" && !self.tartak_dozwolony {', 'if key == "tartak" && self.tartak_dozwolony {')
m('C30_block_river_dropoboz', CP, '(key == "tartak" || key == "oboz_lowiecki") && sh.has_river_access(hex_key)', 'key == "tartak" && sh.has_river_access(hex_key)')
m('C31_block_river_droptartak', CP, '(key == "tartak" || key == "oboz_lowiecki") && sh.has_river_access(hex_key)', 'key == "oboz_lowiecki" && sh.has_river_access(hex_key)')
m('C32_block_hill_terrain_neg', CP, '.map(|h| h.terrain) != Some(TerrainType::Wzgorza)', '.map(|h| h.terrain) == Some(TerrainType::Wzgorza)')
m('C33_block_hill_pending_neg', CP, '&& self.hill_tartak_pending(sh, acc)', '&& !self.hill_tartak_pending(sh, acc)')
# build_city_env
m('C34_env_skipwyrab_default', CP, 'None => opts.skip_wyrab,', 'None => false,')
m('C35_env_demand_nofocus', CP, 'demand_driven && focus == UlepszeniaFocus::Zrownowazone', 'demand_driven')
m('C36_env_override_ignored', CP, 'Some(p) => p.clone(),', 'Some(_) => priorities_for_ulepszenia_focus(focus, city_skip_wyrab),')
m('C37_env_zywnosc_forest_filter', CP, 'focus != UlepszeniaFocus::Zywnosc || !FOREST_BUILDING_KEYS.contains(&k.as_str())', 'true')
m('C38_env_demand_wyrab', CP, '|| k == "wyrab"\n', '|| false\n')
m('C39_env_demand_foodonly', CP, '|| ULEPSZENIA_FOOD_ONLY_ZROWNOWAZONE.contains(&k.as_str())', '|| false')
m('C40_env_demand_deficitopen', CP, '|| deficit_open_keys.contains(k)', '|| false')
m('C41_env_demand_roads', CP, '|| (opts.roads_pass && ROAD_KEYS.contains(&k.as_str()))', '|| false')
m('C42_env_onlyworked_default', CP, 'None => city.ulepszenia_only_worked.unwrap_or(false),', 'None => city.ulepszenia_only_worked.unwrap_or(true),')
m('C43_env_worked_center_dropzrown', CP, 'if focus == UlepszeniaFocus::Zywnosc || focus == UlepszeniaFocus::Zrownowazone {', 'if focus == UlepszeniaFocus::Zywnosc {')
m('C44_env_worked_center_dropzyw', CP, 'if focus == UlepszeniaFocus::Zywnosc || focus == UlepszeniaFocus::Zrownowazone {', 'if focus == UlepszeniaFocus::Zrownowazone {')
m('C45_env_worked_needs_getter', CP, '(true, Some(f)) => {', '(false, Some(f)) => {')
m('C46_env_citycap_scale', CP, 'let city_budget_cap = (city_percent / 100.0) * global_pula_at_entry;', 'let city_budget_cap = (city_percent / 100.0) * global_pula_at_entry * 2.0;')
m('C47_env_citycap_dropimperium', CP, 'let effective_city_cap = js_min(city_budget_cap, imperium_budget_cap);', 'let effective_city_cap = city_budget_cap;')
m('C48_env_citycap_onlyimperium', CP, 'let effective_city_cap = js_min(city_budget_cap, imperium_budget_cap);', 'let effective_city_cap = imperium_budget_cap;')
m('C49_env_citypercent_noclamp_hi', CP, 'js_min(\n            100.0,\n            match opts.get_praca_budget_percent {', 'js_min(\n            1.0e9,\n            match opts.get_praca_budget_percent {')
m('C50_env_radius_plus1', CP, 'let radius = super::territory_radius_pin(&node) + 1.0;', 'let radius = super::territory_radius_pin(&node) + 0.0;')
m('C51_env_retain_and', CP, 'worked.contains(&hk) || sh.map.hex(&hk).is_some_and(hex_has_deposit_reserve)', 'worked.contains(&hk) && sh.map.hex(&hk).is_some_and(hex_has_deposit_reserve)')
m('C52_env_retain_nodeposit', CP, 'worked.contains(&hk) || sh.map.hex(&hk).is_some_and(hex_has_deposit_reserve)', 'worked.contains(&hk)')
m('C53_env_riveronly_filter', CP, '!opts.river_hexes_only || sh.river_hex_keys', 'true || sh.river_hex_keys')
m('C54_env_order_river_reverse', CP, 'ar.cmp(&br)', 'br.cmp(&ar)')
m('C55_env_order_nodist', CP, '.partial_cmp(&hex_dist(city, b.0, b.1))', '.partial_cmp(&hex_dist(city, a.0, a.1))')
m('C56_env_order_q_reverse', CP, '.then(a.0.cmp(&b.0))\n            .then(a.1.cmp(&b.1))', '.then(b.0.cmp(&a.0))\n            .then(a.1.cmp(&b.1))')
m('C57_env_order_r_reverse', CP, '.then(a.0.cmp(&b.0))\n            .then(a.1.cmp(&b.1))', '.then(a.0.cmp(&b.0))\n            .then(b.1.cmp(&a.1))')
m('C58_env_hexphase_keepwyrab', CP, '.filter(|k| k.as_str() != "wyrab" && !in_zero_yield(k))', '.filter(|k| !in_zero_yield(k))')
m('C59_env_hexphase_keepzero', CP, '.filter(|k| k.as_str() != "wyrab" && !in_zero_yield(k))', '.filter(|k| k.as_str() != "wyrab")')
m('C60_env_defense_demand', CP, 'let defense_priority: Vec<String> = if demand_active {', 'let defense_priority: Vec<String> = if false {')
m('C61_env_defense_filter_neg', CP, '.filter(|k| in_zero_yield(k))\n            .cloned()', '.filter(|k| !in_zero_yield(k))\n            .cloned()')
m('C62_env_wyrabon_dropskip', CP, 'let wyrab_wlaczony = !city_skip_wyrab && base_priority', 'let wyrab_wlaczony = true && base_priority')
m('C63_env_wyrabon_dropincl', CP, '&& base_priority.iter().any(|k| k == "wyrab");', '&& true;')
m('C64_env_wyrab_pod_farme_dropdemand', CP, 'let wyrab_tylko_pod_farme = demand_active || focus == UlepszeniaFocus::Zywnosc;', 'let wyrab_tylko_pod_farme = focus == UlepszeniaFocus::Zywnosc;')
m('C65_env_wyrab_pod_farme_dropzyw', CP, 'let wyrab_tylko_pod_farme = demand_active || focus == UlepszeniaFocus::Zywnosc;', 'let wyrab_tylko_pod_farme = demand_active;')
m('C66_env_tartak_demand', CP, 'let tartak_dozwolony = !demand_active', 'let tartak_dozwolony = demand_active')
m('C67_env_tartak_drewno', CP, 'ks.iter().any(|k| k == "drewno")', 'ks.iter().any(|k| k == "kamien")')
# finish_env
m('C68_fin_rzeki_dropoff', CP, 'env.rzeki_do_zagospodarowania = !env.off_river_clearing\n        && env.wyrab_wlaczony', 'env.rzeki_do_zagospodarowania = env.wyrab_wlaczony')
m('C69_fin_rzeki_dropwlaczony', CP, '&& env.wyrab_wlaczony\n        && env\n            .candidate_hexes', '&& env\n            .candidate_hexes')
m('C70_fin_lesnemin_floor', CP, '(pop_or_zero(city.population) / JEDEN_NA_ILU_OBYWATELI).ceil()', '(pop_or_zero(city.population) / JEDEN_NA_ILU_OBYWATELI).floor()')
m('C71_fin_lesnemin_max0', CP, 'js_max(\n        1.0,\n        (pop_or_zero', 'js_max(\n        0.0,\n        (pop_or_zero')
m('C72_fin_lesnereq_demand', CP, '!env.demand_active\n                && env.tartak_dozwolony', 'true\n                && env.tartak_dozwolony')
m('C73_fin_lesnereq_tartakdoz', CP, '&& env.tartak_dozwolony\n                && env.hex_phase_priority', '&& true\n                && env.hex_phase_priority')
m('C74_fin_lesnereq_inprio', CP, '&& env.hex_phase_priority.iter().any(|p| p == k)', '&& true')
m('C75_fin_lesnereq_droptech', CP, '.filter(|k| sh.tech_ok(k) && sh.civ_ok(k))', '.filter(|k| sh.civ_ok(k))')
m('C76_fin_lesnereq_dropciv', CP, '.filter(|k| sh.tech_ok(k) && sh.civ_ok(k))', '.filter(|k| sh.tech_ok(k))')
m('C77_fin_all_to_any', CP, 'env.lesne_min_spelnione = lesne_wymagane.iter().all(|k| {', 'env.lesne_min_spelnione = lesne_wymagane.iter().any(|k| {')
m('C78_fin_have_gt', CP, 'if have >= lesne_min {', 'if have > lesne_min {')
m('C79_fin_have_counts_all', CP, 'if sh.hex_layers_contain(&format!("{q},{r}"), k) {\n                have += 1.0;', 'if true {\n                have += 1.0;')
m('C80_fin_wolno_droponly', CP, 'env.wolno_karczowac_poza_rzeka = !env.river_forest_clearing_only\n        &&', 'env.wolno_karczowac_poza_rzeka = true\n        &&')
m('C81_fin_wolno_droprzeki', CP, '&& !env.rzeki_do_zagospodarowania\n        && (env.off_river_clearing', '&& true\n        && (env.off_river_clearing')
m('C82_fin_wolno_dropoff', CP, '(env.off_river_clearing || env.lesne_min_spelnione);', 'env.lesne_min_spelnione;')
m('C83_fin_wolno_droplesne', CP, '(env.off_river_clearing || env.lesne_min_spelnione);', 'env.off_river_clearing;')
m('C84_popornan', CP, 'if p.is_nan() {\n        0.0', 'if false {\n        0.0')
# river_to_develop
m('C85_rtd_drop_river', CP, 'if !sh.river_hex_keys.contains(&hk) {\n        return false;', 'if false {\n        return false;')
m('C86_rtd_drop_scheduled', CP, 'if acc.scheduled_wyrab.contains(&hk) {\n        return false;', 'if false {\n        return false;')
m('C87_rtd_krok0_or', CP, '== Some(Overlay::Las) && env.river_krok0_ok(sh, acc, q, r)', '== Some(Overlay::Las) || env.river_krok0_ok(sh, acc, q, r)')
m('C88_rtd_drop_devkeys', CP, 'if !RIVER_DEVELOPMENT_KEYS.contains(&k.as_str()) {', 'if false {')
m('C89_rtd_drop_placedhere', CP, 'if placed_here.iter().any(|p| p == k) {', 'if false {')
m('C90_rtd_drop_tech', CP, 'if !sh.tech_ok(k) || !sh.civ_ok(k) {\n            return false;', 'if !sh.civ_ok(k) {\n            return false;')
m('C91_rtd_drop_civ', CP, 'if !sh.tech_ok(k) || !sh.civ_ok(k) {\n            return false;', 'if !sh.tech_ok(k) {\n            return false;')
m('C92_rtd_and_to_or', CP, 'env.hex_allows_key(sh, q, r, k) && sh.qualifies(k, q, r)', 'env.hex_allows_key(sh, q, r, k) || sh.qualifies(k, q, r)')
m('C93_rtd_drop_qualifies', CP, 'env.hex_allows_key(sh, q, r, k) && sh.qualifies(k, q, r)', 'env.hex_allows_key(sh, q, r, k)')
m('C94_countforest_drop_scheduled', CP, 'if acc.scheduled_wyrab.contains(&hk) {\n            return n;', 'if false {\n            return n;')
m('C95_countforest_overlay', CP, 'if sh.map.hex(&hk).map(|h| h.overlay) == Some(Overlay::Las) {\n            n + 1.0', 'if sh.map.hex(&hk).map(|h| h.overlay) != Some(Overlay::Las) {\n            n + 1.0')
m('C96_focus_default', CP, 'None => c.ulepszenia_focus.unwrap_or(DEFAULT_ULEPSZENIA_FOCUS),', 'None => c.ulepszenia_focus.unwrap_or(UlepszeniaFocus::Surowce),')
m('C97_hexdist_halve', CP, '(dq.abs() + dr.abs() + (dq + dr).abs()) / 2.0', '(dq.abs() + dr.abs() + (dq + dr).abs()) / 3.0')

# ---- hex_phases.rs ------------------------------------------------------------------------------
m('H01_def_plonowe_le', HP, 'plonowe < pop {', 'plonowe <= pop {')
m('H02_def_drop_empty', HP, 'if env.defense_priority.is_empty() || plonowe < pop {', 'if plonowe < pop {')
m('H03_def_cap_floor', HP, 'js_max(1.0, (pop / JEDEN_NA_ILU_OBYWATELI).ceil())', 'js_max(1.0, (pop / JEDEN_NA_ILU_OBYWATELI).floor())')
m('H04_def_cap_max0', HP, 'js_max(1.0, (pop / JEDEN_NA_ILU_OBYWATELI).ceil())', 'js_max(0.0, (pop / JEDEN_NA_ILU_OBYWATELI).ceil())')
m('H05_def_border_asc', HP, '.partial_cmp(&hex_dist(&env.city, a.0, a.1))', '.partial_cmp(&hex_dist(&env.city, b.0, b.1))')
m('H06_def_top_spent_gt', HP, 'if acc.global_spent >= env.effective_city_cap || acc.placed_this_city >= env.max_items {', 'if acc.global_spent > env.effective_city_cap || acc.placed_this_city >= env.max_items {', occ=1)
m('H07_def_top_placed_gt', HP, 'if acc.global_spent >= env.effective_city_cap || acc.placed_this_city >= env.max_items {', 'if acc.global_spent >= env.effective_city_cap || acc.placed_this_city > env.max_items {', occ=1)
m('H08_def_reserve_lt', HP, 'if acc.praca_left <= env.reserve {\n            break;\n        }\n        let Some(meta)', 'if acc.praca_left < env.reserve {\n            break;\n        }\n        let Some(meta)')
m('H09_def_drop_tech', HP, 'if !sh.tech_ok(key) || !sh.civ_ok(key) {', 'if !sh.civ_ok(key) {', occ=1)
m('H10_def_drop_civ', HP, 'if !sh.tech_ok(key) || !sh.civ_ok(key) {', 'if !sh.tech_ok(key) {', occ=1)
m('H11_def_have_gt', HP, 'if have >= defense_cap {', 'if have > defense_cap {')
m('H12_def_inner_placed_gt', HP, 'if acc.placed_this_city >= env.max_items {\n                break;\n            }\n            if meta.koszt_praca > acc.praca_left {', 'if acc.placed_this_city > env.max_items {\n                break;\n            }\n            if meta.koszt_praca > acc.praca_left {')
m('H13_def_inner_cost_ge', HP, 'if meta.koszt_praca > acc.praca_left {\n                break;', 'if meta.koszt_praca >= acc.praca_left {\n                break;')
m('H14_def_inner_reserve_le', HP, 'if acc.praca_left - meta.koszt_praca < env.reserve {\n                break;', 'if acc.praca_left - meta.koszt_praca <= env.reserve {\n                break;')
m('H15_def_inner_cap_ge', HP, 'if acc.global_spent + meta.koszt_praca > env.effective_city_cap {\n                break;', 'if acc.global_spent + meta.koszt_praca >= env.effective_city_cap {\n                break;')
m('H16_def_drop_zeroyield_hex', HP, 'if sh.placed(&hk).iter().any(|k| in_zero_yield(k)) {', 'if false {')
m('H17_def_drop_hexallows', HP, 'if !env.hex_allows_key(sh, q, r, key) {', 'if false {', occ=1)
m('H18_def_drop_qualifies', HP, 'if !sh.qualifies(key, q, r) {', 'if false {', occ=1)
m('H19_def_report_candidate', HP, 'if let Some(sr) = opts.surplus_report {\n                sr.borrow_mut().any_candidate = true;\n            }\n            push_pick(acc, opts, &env.city, (q, r), key, meta.koszt_praca);\n            sh.add_layer(&hk, key);\n            break;', 'push_pick(acc, opts, &env.city, (q, r), key, meta.koszt_praca);\n            sh.add_layer(&hk, key);\n            break;')
m('H20_def_no_break_after_pick', HP, 'sh.add_layer(&hk, key);\n            break;\n        }\n    }\n}\n\n/// KROK 0', 'sh.add_layer(&hk, key);\n        }\n    }\n}\n\n/// KROK 0')
m('H21_hex_top_reserve_lt', HP, '|| acc.praca_left <= env.reserve\n        {', '|| acc.praca_left < env.reserve\n        {')
m('H22_hex_top_spent_gt', HP, 'if acc.global_spent >= env.effective_city_cap\n            || acc.placed_this_city >= env.max_items', 'if acc.global_spent > env.effective_city_cap\n            || acc.placed_this_city >= env.max_items')
m('H23_hex_top_placed_gt', HP, '|| acc.placed_this_city >= env.max_items\n            || acc.praca_left <= env.reserve', '|| acc.placed_this_city > env.max_items\n            || acc.praca_left <= env.reserve')
m('H24_hex_step0_off', HP, 'if step0_applies(sh, env, acc, q, r, &hex_key) {', 'if false {')
m('H25_hex_wyrab_drop_tech', HP, 'if sh.tech_ok("wyrab")\n                    && sh.civ_ok("wyrab")', 'if sh.civ_ok("wyrab")')
m('H26_hex_wyrab_drop_civ', HP, 'if sh.tech_ok("wyrab")\n                    && sh.civ_ok("wyrab")', 'if sh.tech_ok("wyrab")')
m('H27_hex_wyrab_cost_lt', HP, '&& meta.koszt_praca <= acc.praca_left\n                    && acc.praca_left - meta.koszt_praca >= env.reserve', '&& meta.koszt_praca < acc.praca_left\n                    && acc.praca_left - meta.koszt_praca >= env.reserve')
m('H28_hex_wyrab_reserve_gt', HP, '&& acc.praca_left - meta.koszt_praca >= env.reserve\n                    && acc.global_spent', '&& acc.praca_left - meta.koszt_praca > env.reserve\n                    && acc.global_spent')
m('H29_hex_wyrab_cap_lt', HP, '&& acc.global_spent + meta.koszt_praca <= env.effective_city_cap\n                    && sh.qualifies("wyrab", q, r)', '&& acc.global_spent + meta.koszt_praca < env.effective_city_cap\n                    && sh.qualifies("wyrab", q, r)')
m('H30_hex_wyrab_qualifies_true', HP, '&& sh.qualifies("wyrab", q, r)\n                {', '&& true\n                {')
m('H31_hex_wyrab_forest_dec', HP, 'acc.forest_left -= 1.0;\n                    continue;', 'continue;')
m('H32_hex_wyrab_no_continue', HP, 'acc.scheduled_wyrab.insert(hex_key);\n                    acc.forest_left -= 1.0;\n                    continue;', 'acc.scheduled_wyrab.insert(hex_key.clone());\n                    acc.forest_left -= 1.0;')
m('H33_hex_wyrab_no_schedule', HP, 'acc.scheduled_wyrab.insert(hex_key);\n                    acc.forest_left', 'acc.forest_left')
m('H34_hex_key_top_spent_gt', HP, 'if acc.global_spent >= env.effective_city_cap || acc.placed_this_city >= env.max_items {', 'if acc.global_spent > env.effective_city_cap || acc.placed_this_city >= env.max_items {', occ=2)
m('H35_hex_key_top_placed_gt', HP, 'if acc.global_spent >= env.effective_city_cap || acc.placed_this_city >= env.max_items {', 'if acc.global_spent >= env.effective_city_cap || acc.placed_this_city > env.max_items {', occ=2)
m('H36_hex_key_cost_ge', HP, 'if meta.koszt_praca > acc.praca_left\n                || acc.praca_left', 'if meta.koszt_praca >= acc.praca_left\n                || acc.praca_left')
m('H37_hex_key_reserve_le', HP, '|| acc.praca_left - meta.koszt_praca < env.reserve\n                || acc.global_spent', '|| acc.praca_left - meta.koszt_praca <= env.reserve\n                || acc.global_spent')
m('H38_hex_key_cap_ge', HP, '|| acc.global_spent + meta.koszt_praca > env.effective_city_cap\n            {', '|| acc.global_spent + meta.koszt_praca >= env.effective_city_cap\n            {')
m('H39_hex_key_drop_tech', HP, 'if !sh.tech_ok(key) || !sh.civ_ok(key) {', 'if !sh.civ_ok(key) {', occ=2)
m('H40_hex_key_drop_civ', HP, 'if !sh.tech_ok(key) || !sh.civ_ok(key) {', 'if !sh.tech_ok(key) {', occ=2)
m('H41_hex_key_drop_dup', HP, 'if sh.hex_layers_contain(&hex_key, key) {', 'if false {', occ=1)
m('H42_hex_key_krok0_dropoboz', HP, '(key == "tartak" || key == "oboz_lowiecki") && env.river_krok0_ok(sh, acc, q, r)', 'key == "tartak" && env.river_krok0_ok(sh, acc, q, r)')
m('H43_hex_key_krok0_droptartak', HP, '(key == "tartak" || key == "oboz_lowiecki") && env.river_krok0_ok(sh, acc, q, r)', 'key == "oboz_lowiecki" && env.river_krok0_ok(sh, acc, q, r)')
m('H44_hex_key_drop_hexallows', HP, 'if !env.hex_allows_key(sh, q, r, key) {', 'if false {', occ=2)
m('H45_hex_key_drop_blocked', HP, 'if env.key_blocked_on_hex(sh, acc, key, &hex_key) {', 'if false {', occ=1)
m('H46_hex_key_drop_qualifies', HP, 'if !sh.qualifies(key, q, r) {', 'if false {', occ=2)
m('H47_hex_key_report_candidate', HP, 'if let Some(sr) = opts.surplus_report {\n                sr.borrow_mut().any_candidate = true;\n            }\n            push_pick(acc, opts, &env.city, (q, r), key, meta.koszt_praca);\n            sh.add_layer(&hex_key, key);', 'push_pick(acc, opts, &env.city, (q, r), key, meta.koszt_praca);\n            sh.add_layer(&hex_key, key);')
m('H48_hex_key_no_layer', HP, 'push_pick(acc, opts, &env.city, (q, r), key, meta.koszt_praca);\n            sh.add_layer(&hex_key, key);', 'push_pick(acc, opts, &env.city, (q, r), key, meta.koszt_praca);')
m('H49_hex_end_reserve_lt', HP, 'if acc.praca_left <= env.reserve {\n            acc.city_budget_exhausted = true;\n            break;\n        }\n    }\n}', 'if acc.praca_left < env.reserve {\n            acc.city_budget_exhausted = true;\n            break;\n        }\n    }\n}')
m('H50_hex_exhausted_flag_top', HP, 'acc.city_budget_exhausted = true;\n            break;\n        }\n        let hex_key', 'break;\n        }\n        let hex_key')
# step0_applies
m('H51_s0_drop_wlaczony', HP, 'env.wyrab_wlaczony\n        && (env.off_river_clearing || env.lesne_min_spelnione)', 'true\n        && (env.off_river_clearing || env.lesne_min_spelnione)')
m('H52_s0_drop_lesne', HP, '&& (env.off_river_clearing || env.lesne_min_spelnione)\n        && env.wolno', '&& env.off_river_clearing\n        && env.wolno')
m('H53_s0_drop_off', HP, '&& (env.off_river_clearing || env.lesne_min_spelnione)\n        && env.wolno', '&& env.lesne_min_spelnione\n        && env.wolno')
m('H54_s0_drop_wolno', HP, '&& env.wolno_karczowac_poza_rzeka', '&& true')
m('H55_s0_drop_river', HP, '&& !sh.river_hex_keys.contains(hex_key)', '&& true')
m('H56_s0_drop_scheduled', HP, '&& !acc.scheduled_wyrab.contains(hex_key)', '&& true')
m('H57_s0_overlay_neg', HP, '.map(|h| h.overlay) == Some(Overlay::Las)\n        && env.wyrab_ma_sens', '.map(|h| h.overlay) != Some(Overlay::Las)\n        && env.wyrab_ma_sens')
m('H58_s0_drop_sens', HP, '&& env.wyrab_ma_sens(sh, q, r)\n        && (env', '&& true\n        && (env')
m('H59_s0_forest_gt', HP, 'acc.forest_left >= WYRAB_MIN_FOREST_IN_RADIUS', 'acc.forest_left > WYRAB_MIN_FOREST_IN_RADIUS')
m('H60_s0_forest_dropoff', HP, '(env.off_river_clearing || acc.forest_left >= WYRAB_MIN_FOREST_IN_RADIUS)', 'acc.forest_left >= WYRAB_MIN_FOREST_IN_RADIUS')
m('H61_s0_forest_dropforest', HP, '(env.off_river_clearing || acc.forest_left >= WYRAB_MIN_FOREST_IN_RADIUS)', 'env.off_river_clearing')
m('H62_s0_drop_tartakobóz', HP, '&& !sh\n            .placed(hex_key)\n            .iter()\n            .any(|k| k == "tartak" || k == "oboz_lowiecki")\n        && env.hex_allows_key', '&& true\n        && env.hex_allows_key')
m('H63_s0_drop_hexallows', HP, '&& env.hex_allows_key(sh, q, r, "wyrab")\n}', '&& true\n}')
# phase_wyrab_by_type
m('H64_w2_drop_riveronly', HP, 'if env.river_forest_clearing_only\n        || acc.city_budget_exhausted', 'if false\n        || acc.city_budget_exhausted')
m('H65_w2_drop_exhausted', HP, '|| acc.city_budget_exhausted\n        || env.demand_active', '|| false\n        || env.demand_active')
m('H66_w2_drop_demand', HP, '|| env.demand_active\n        || env.city_skip_wyrab', '|| false\n        || env.city_skip_wyrab')
m('H67_w2_drop_skip', HP, '|| env.city_skip_wyrab\n        ||', '|| false\n        ||')
m('H68_w2_drop_incl', HP, '|| !env.base_priority.iter().any(|k| k == "wyrab")\n    {', '|| false\n    {')
m('H69_w2_drop_tech', HP, 'let tech_ok = sh.tech_ok(key) && sh.civ_ok(key);', 'let tech_ok = sh.civ_ok(key);')
m('H70_w2_drop_civ', HP, 'let tech_ok = sh.tech_ok(key) && sh.civ_ok(key);', 'let tech_ok = sh.tech_ok(key);')
m('H71_w2_cost_lt', HP, '&& meta.koszt_praca <= acc.praca_left\n        && acc.praca_left - meta.koszt_praca >= env.reserve)', '&& meta.koszt_praca < acc.praca_left\n        && acc.praca_left - meta.koszt_praca >= env.reserve)')
m('H72_w2_reserve_gt', HP, '&& acc.praca_left - meta.koszt_praca >= env.reserve)', '&& acc.praca_left - meta.koszt_praca > env.reserve)')
m('H73_w2_forest_le', HP, 'if forest_count < WYRAB_MIN_FOREST_IN_RADIUS {', 'if forest_count <= WYRAB_MIN_FOREST_IN_RADIUS {')
m('H74_w2_while_spent_le', HP, 'while acc.global_spent < env.effective_city_cap', 'while acc.global_spent <= env.effective_city_cap')
m('H75_w2_while_placed_le', HP, '&& acc.placed_this_city < env.max_items', '&& acc.placed_this_city <= env.max_items')
m('H76_w2_while_cost_lt', HP, '&& meta.koszt_praca <= acc.praca_left\n    {', '&& meta.koszt_praca < acc.praca_left\n    {')
m('H77_w2_inner_reserve_le', HP, 'if acc.praca_left - meta.koszt_praca < env.reserve {\n            break;\n        }\n        if acc.global_spent', 'if acc.praca_left - meta.koszt_praca <= env.reserve {\n            break;\n        }\n        if acc.global_spent')
m('H78_w2_inner_cap_ge', HP, 'if acc.global_spent + meta.koszt_praca > env.effective_city_cap {\n            break;\n        }\n        let mut placed_one', 'if acc.global_spent + meta.koszt_praca >= env.effective_city_cap {\n            break;\n        }\n        let mut placed_one')
m('H79_w2_drop_scheduled', HP, 'if acc.scheduled_wyrab.contains(&hk) {\n                continue;', 'if false {\n                continue;')
m('H80_w2_drop_sens', HP, 'if !env.wyrab_ma_sens(sh, q, r) {\n                continue;', 'if false {\n                continue;')
m('H81_w2_drop_hexallows', HP, 'if !env.hex_allows_key(sh, q, r, key) {', 'if false {', occ=3)
m('H82_w2_drop_oboz', HP, '.any(|k| k == "tartak" || k == "oboz_lowiecki")', '.any(|k| k == "tartak")', occ=2)
m('H83_w2_drop_tartak', HP, '.any(|k| k == "tartak" || k == "oboz_lowiecki")', '.any(|k| k == "oboz_lowiecki")', occ=2)
m('H84_w2_drop_qualifies', HP, 'if !sh.qualifies(key, q, r) {', 'if false {', occ=3)
m('H85_w2_no_schedule', HP, 'acc.scheduled_wyrab.insert(hk);\n            placed_one = true;', 'placed_one = true;')
m('H86_w2_no_spend', HP, 'acc.praca_left -= meta.koszt_praca;\n            acc.global_spent += meta.koszt_praca;\n            acc.placed_this_city += 1.0;\n            acc.scheduled_wyrab', 'acc.scheduled_wyrab')
m('H87_w2_owner', HP, 'owner_id: opts.owner_id,\n                city_id: env.city.id.clone(),', 'owner_id: opts.owner_id + 1,\n                city_id: env.city.id.clone(),')
# probe
m('H88_probe_drop_early', HP, 'if sr.borrow().any_candidate {\n        return;', 'if false {\n        return;')
m('H89_probe_drop_loopbreak', HP, 'if sr.borrow().any_candidate {\n            break;', 'if false {\n            break;')
m('H90_probe_drop_tech', HP, 'if !sh.tech_ok(key) || !sh.civ_ok(key) {', 'if !sh.civ_ok(key) {', occ=3)
m('H91_probe_drop_civ', HP, 'if !sh.tech_ok(key) || !sh.civ_ok(key) {', 'if !sh.tech_ok(key) {', occ=3)
m('H92_probe_drop_dup', HP, 'if sh.hex_layers_contain(&hex_key, key) {', 'if false {', occ=2)
m('H93_probe_drop_hexallows', HP, 'if !env.hex_allows_key(sh, q, r, key) {', 'if false {', occ=4)
m('H94_probe_drop_blocked', HP, 'if env.key_blocked_on_hex(sh, acc, key, &hex_key) {', 'if false {', occ=2)
m('H95_probe_drop_qualifies', HP, 'if !sh.qualifies(key, q, r) {', 'if false {', occ=4)
m('H96_probe_never_set', HP, 'sr.borrow_mut().any_candidate = true;\n            break;', 'break;')
m('H97_pushpick_nospent', HP, 'acc.praca_left -= koszt;\n    acc.global_spent += koszt;', 'acc.praca_left -= koszt;')
m('H98_pushpick_noplaced', HP, 'acc.global_spent += koszt;\n    acc.placed_this_city += 1.0;', 'acc.global_spent += koszt;')
m('H99_pushpick_nopraca', HP, 'acc.praca_left -= koszt;\n    acc.global_spent', 'acc.global_spent')

# ---- single_pass.rs -------------------------------------------------------------------------------
m('S01_river_drop_present', SP, '|| self.map.hex(hk).is_some_and(|h| h.river_present)', '')
m('S02_river_drop_n1', SP, '[(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]', '[(-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]')
m('S03_river_drop_n2', SP, '[(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]', '[(1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]')
m('S04_river_drop_n3', SP, '[(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]', '[(1, 0), (-1, 0), (0, -1), (1, -1), (-1, 1)]')
m('S05_river_drop_n4', SP, '[(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]', '[(1, 0), (-1, 0), (0, 1), (1, -1), (-1, 1)]')
m('S06_river_drop_n5', SP, '[(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]', '[(1, 0), (-1, 0), (0, 1), (0, -1), (-1, 1)]')
m('S07_river_drop_n6', SP, '[(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]', '[(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1)]')
m('S08_river_neighbors_off', SP, '        if on_river {\n            return true;\n        }\n        [(1, 0)', '        if on_river {\n            return true;\n        }\n        if true {\n            return false;\n        }\n        [(1, 0)')
m('S09_pool_reserve_lt', SP, 'if praca_left <= reserve {\n        return Vec::new();', 'if praca_left < reserve {\n        return Vec::new();')
m('S10_cap_nonfinite', SP, 'Some(c) if c.is_finite() => c,', 'Some(c) => c,')
m('S11_cap_pct_noclamp_lo', SP, 'js_max(0.0, js_min(100.0, praca_budget_percent))', 'js_min(100.0, praca_budget_percent)')
m('S12_cap_pct_noclamp_hi', SP, 'js_max(0.0, js_min(100.0, praca_budget_percent))', 'js_max(0.0, praca_budget_percent)')
m('S13_cap_nomaxzero', SP, 'js_max(0.0, js_min(global_pula_at_entry, cap_value))', 'js_min(global_pula_at_entry, cap_value)')
m('S14_cap_nopool', SP, 'js_max(0.0, js_min(global_pula_at_entry, cap_value))', 'js_max(0.0, cap_value)')
m('S15_horse_owner_neg', SP, 'if c.owner_id != owner_id {', 'if c.owner_id == owner_id {')
m('S16_horse_nokon', SP, 'sum + c.kon_stock.unwrap_or(0.0)', 'sum')
m('S17_trade_route_true', SP, 'state.trade_route_kon_unlocked = Some(false);', 'state.trade_route_kon_unlocked = Some(true);')
m('S18_era_dropped', SP, 'state.player_era = opts.player_era;', 'state.player_era = None;')
m('S19_civ_dropped', SP, 'state.player_civ_archetype = opts.civ_archetype.clone();', 'state.player_civ_archetype = None;')
m('S20_techs_dropped', SP, 'state.researched_techs = Some(opts.unlocked_techs.clone());', 'state.researched_techs = Some(Default::default());')
m('S21_territory_dropped', SP, 'state.territory_nodes = Some(territory_nodes.clone());', 'state.territory_nodes = Some(Vec::new());')
m('S22_owner_dropped', SP, 'state.player_owner_id_num = Some(owner_id);', 'state.player_owner_id_num = Some(owner_id + 1);')
m('S23_placed_dropped', SP, 'working.insert(hk.clone(), PlacedLayers::Many(v.clone()));', 'let _ = v;')
m('S24_fortpass_off', SP, 'if opts.fort_claim_pass {', 'if false {')
m('S25_cities_order_reverse', SP, 'ordered_cities.sort_by(|a, b| cmp_city_id(a, b));', 'ordered_cities.sort_by(|a, b| cmp_city_id(b, a));')
m('S26_clearing_seed_dropped', SP, 'scheduled_wyrab: opts.clearing_hex_keys.clone().unwrap_or_default(),', 'scheduled_wyrab: Default::default(),')
m('S27_loop_reserve_lt', SP, 'if acc.praca_left <= reserve {\n            break;', 'if acc.praca_left < reserve {\n            break;')
m('S28_no_reset_placed', SP, 'acc.placed_this_city = 0.0;\n        acc.city_budget_exhausted = false;', 'acc.city_budget_exhausted = false;')
m('S29_no_reset_exhausted', SP, 'acc.placed_this_city = 0.0;\n        acc.city_budget_exhausted = false;', 'acc.placed_this_city = 0.0;')
m('S30_report_deficit_dropped', SP, 'report(&|s| s.deficit_active = deficit_active);', '')
m('S31_surplus_drop_demand', SP, 's.surplus = s.demand_active && !s.deficit_active && !s.any_candidate;', 's.surplus = !s.deficit_active && !s.any_candidate;')
m('S32_surplus_drop_deficit', SP, 's.surplus = s.demand_active && !s.deficit_active && !s.any_candidate;', 's.surplus = s.demand_active && !s.any_candidate;')
m('S33_surplus_drop_candidate', SP, 's.surplus = s.demand_active && !s.deficit_active && !s.any_candidate;', 's.surplus = s.demand_active && !s.deficit_active;')
m('S34_report_demand_always', SP, 'if env.demand_active {\n        if let Some(sr)', 'if true {\n        if let Some(sr)')
m('S35_deficit_open_always_empty', SP, 'let deficit_open_keys: BTreeSet<String> = if deficit_active {', 'let deficit_open_keys: BTreeSet<String> = if false {')
m('S36_default_civ_gate_true', SP, 'is_improvement_allowed_for_civ(key, civ)\n}', 'let _ = (key, civ);\n    true\n}')
m('S37_empty_cities_continues', SP, 'if cities.is_empty() {\n        return Vec::new();', 'if false {\n        return Vec::new();')
m('S38_idsort_bytes', P1, 'a.encode_utf16().cmp(b.encode_utf16())', 'a.as_bytes().cmp(b.as_bytes())')

# ---- fort_claim.rs --------------------------------------------------------------------------------
m('F01_nodes_dropoutpost', FC, 'if n.node.is_fort == Some(true) || n.node.is_outpost == Some(true) {', 'if n.node.is_fort == Some(true) {')
m('F02_nodes_dropfort', FC, 'if n.node.is_fort == Some(true) || n.node.is_outpost == Some(true) {', 'if n.node.is_outpost == Some(true) {')
m('F03_layers_dropfort', FC, 'if (l == "fort" || l == "posterunek")', 'if (l == "posterunek")')
m('F04_layers_dropposterunek', FC, 'if (l == "fort" || l == "posterunek")', 'if (l == "fort")')
m('F05_layers_dedupe_off', FC, '&& !fort_circles.iter().any(|f| f.q == q && f.r == r)', '&& true')
m('F06_cityhexes_dropfort', FC, 'if n.node.is_fort != Some(true) && n.node.is_outpost != Some(true) {', 'if n.node.is_outpost != Some(true) {')
m('F07_cityhexes_dropoutpost', FC, 'if n.node.is_fort != Some(true) && n.node.is_outpost != Some(true) {', 'if n.node.is_fort != Some(true) {')
m('F08_own_owner_filter', FC, '.filter(|n| n.owner_id == owner_id)', '.filter(|n| n.owner_id != owner_id)')
m('F09_own_city_dedupe', FC, 'if !own_nodes.iter().any(|n| n.q == c.q && n.r == c.r) {', 'if true {')
m('F10_keys_tech', FC, '&& sh.tech_ok(k)', '&& true')
m('F11_keys_civ', FC, '&& sh.civ_ok(k)', '&& true')
m('F12_keys_empty_return', FC, 'if keys.is_empty() {\n        return picks;', 'if false {\n        return picks;')
m('F13_reserve_lt', FC, 'if praca_left <= budget.reserve {\n            break;', 'if praca_left < budget.reserve {\n            break;')
m('F14_cap_drop_imperium', FC, 'js_min(\n            (pct / 100.0) * budget.global_pula_at_entry,\n            budget.imperium_budget_cap,\n        )', '(pct / 100.0) * budget.global_pula_at_entry')
m('F15_pct_default', FC, 'None => budget.praca_budget_percent,', 'None => 100.0,')
m('F16_seen_off', FC, 'if !seen.insert(hk.clone()) {\n                    continue;', 'if false {\n                    continue;')
m('F17_valuable_or_to_and', FC, 'if !(hex.terrain == TerrainType::Gory || hex_has_deposit_reserve(hex)) {', 'if !(hex.terrain == TerrainType::Gory && hex_has_deposit_reserve(hex)) {')
m('F18_valuable_dropgory', FC, 'if !(hex.terrain == TerrainType::Gory || hex_has_deposit_reserve(hex)) {', 'if !hex_has_deposit_reserve(hex) {')
m('F19_valuable_dropdeposit', FC, 'if !(hex.terrain == TerrainType::Gory || hex_has_deposit_reserve(hex)) {', 'if !(hex.terrain == TerrainType::Gory) {')
m('F20_cityhex_skip_off', FC, 'if city_hexes.contains(&hk) {', 'if false {')
m('F21_existing_fort_skip_off', FC, 'if sh\n                    .placed(&hk)\n                    .iter()\n                    .any(|k| k == "fort" || k == "posterunek")', 'if false')
m('F22_circle_overlap_le', FC, '.any(|f| axial_distance(q, r, f.q, f.r) <= rad + f.rad)', '.any(|f| axial_distance(q, r, f.q, f.r) < rad + f.rad)')
m('F23_circle_overlap_off', FC, '.any(|f| axial_distance(q, r, f.q, f.r) <= rad + f.rad)', '.any(|f| false && f.q == q)')
m('F24_qualifies_off', FC, 'if !sh.qualifies(key, q, r) {\n                        continue;', 'if false {\n                        continue;')
m('F25_gain_sea_morze', FC, 'if nh.terrain == TerrainType::Morze\n                            || nh.terrain == TerrainType::PlytkieMorze\n                        {', 'if nh.terrain == TerrainType::PlytkieMorze\n                        {')
m('F26_gain_sea_plytkie', FC, 'if nh.terrain == TerrainType::Morze\n                            || nh.terrain == TerrainType::PlytkieMorze\n                        {', 'if nh.terrain == TerrainType::Morze\n                        {')
m('F27_gain_owner_gt', FC, '.all(|n| axial_distance(nq, nr, n.q, n.r) > n.rad)', '.all(|n| axial_distance(nq, nr, n.q, n.r) >= n.rad)')
m('F28_gain_owner_off', FC, 'if nodes_now\n                            .iter()\n                            .all(|n| axial_distance(nq, nr, n.q, n.r) > n.rad)\n                        {', 'if true {')
m('F29_gain_min', FC, 'if gain < FORT_CLAIM_MIN_NEW_HEXES {', 'if gain <= FORT_CLAIM_MIN_NEW_HEXES {')
m('F30_better_gain', FC, 'gain > b.gain\n', 'gain < b.gain\n')
m('F31_better_dist', FC, '|| (gain == b.gain && dist > b.dist)', '|| (gain == b.gain && dist < b.dist)')
m('F32_better_q', FC, '(q < b.q || (q == b.q && r < b.r))', '(q > b.q || (q == b.q && r < b.r))')
m('F33_better_r', FC, '(q < b.q || (q == b.q && r < b.r))', '(q < b.q || (q == b.q && r > b.r))')
m('F34_no_break_first_key', FC, '                    break;\n                }\n            }\n        }\n        let Some(best) = best else {', '                }\n            }\n        }\n        let Some(best) = best else {')
m('F35_cost_gt', FC, 'if best.koszt > praca_left {\n            continue;', 'if best.koszt >= praca_left {\n            continue;')
m('F36_reserve_le', FC, 'if praca_left - best.koszt < budget.reserve {\n            continue;', 'if praca_left - best.koszt <= budget.reserve {\n            continue;')
m('F37_cap_ge', FC, 'if global_spent + best.koszt > effective_city_cap {\n            continue;', 'if global_spent + best.koszt >= effective_city_cap {\n            continue;')
m('F38_no_layer', FC, 'sh.add_layer(&hk, &best.key);', '')
m('F39_no_circle', FC, 'fort_circles.push(c);\n        own_nodes.push(c);\n        nodes_now.push(c);', 'own_nodes.push(c);\n        nodes_now.push(c);')
m('F40_no_ownnode', FC, 'fort_circles.push(c);\n        own_nodes.push(c);\n        nodes_now.push(c);', 'fort_circles.push(c);\n        nodes_now.push(c);')
m('F41_no_nodesnow', FC, 'fort_circles.push(c);\n        own_nodes.push(c);\n        nodes_now.push(c);', 'fort_circles.push(c);\n        own_nodes.push(c);')
m('F42_no_spend', FC, 'praca_left -= best.koszt;\n        global_spent += best.koszt;', 'global_spent += best.koszt;')
m('F43_no_globalspent', FC, 'praca_left -= best.koszt;\n        global_spent += best.koszt;', 'praca_left -= best.koszt;')
m('F44_radius_fort', FC, 'let mut n = fort_node(key == "fort");\n    n.is_fort = Some(key == "fort");', 'let mut n = fort_node(key == "fort");\n    n.is_fort = Some(key != "fort");')
m('F45_cities_order', FC, 'ordered.sort_by(|a, b| cmp_city_id(a, b));', 'ordered.sort_by(|a, b| cmp_city_id(b, a));')

# ---- pick.rs (etapy) ------------------------------------------------------------------------------
m('P01_maxitems_stage', PK, 'let max_items_stage = js_min(max_items, FOOD_STAGE_MAX_ITEMS_PER_CITY);', 'let max_items_stage = FOOD_STAGE_MAX_ITEMS_PER_CITY;')
m('P02_total_budget_nofloor', PK, '            .floor(),', '            ,')
m('P03_total_budget_cap', PK, 'Some(c) if c.is_finite() => js_max(0.0, c),', 'Some(c) if c.is_finite() => c,')
m('P04_deficit_demand_off', PK, 'let deficit_keys: Vec<String> = if opts.demand_driven {', 'let deficit_keys: Vec<String> = if true {')
m('P05_deficit_cities_focus', PK, '.filter(|c| focus_of(opts, c) == UlepszeniaFocus::Zrownowazone)\n            .cloned()\n            .collect()\n    };\n    let mut deficit_picks', '.cloned()\n            .collect()\n    };\n    let mut deficit_picks')
m('P06_deficit_record_off', PK, 'run.record(&deficit_picks);', '')
m('P07_used_by_city_lt', PK, '.unwrap_or(0.0) < max_items)', '.unwrap_or(0.0) <= max_items)')
m('P08_food_cities_all', PK, '.filter(|c| used_by_city.get(c.id.as_str()).copied().unwrap_or(0.0) < max_items)', '.filter(|c| { let _ = c; true })')
m('P09_stage_onlyfirst_break_off', PK, 'if !stage_picks.is_empty() {\n                staged_picks = stage_picks;\n                break;', 'if !stage_picks.is_empty() {\n                staged_picks = stage_picks;')
m('P10_stage_probe_never_pending', PK, 'earlier_stage_is_pending = true;', 'earlier_stage_is_pending = false;')
m('P11_stage_probe_no_break', PK, 'earlier_stage_is_pending = true;\n                break;', 'earlier_stage_is_pending = true;')
m('P12_stage_irrigation_needs_farm', PK, 'o.irrigation_needs_farm = true;', 'o.irrigation_needs_farm = false;')
m('P13_stage_riveronly', PK, 'o.river_hexes_only = stage.river_hexes_only;', 'o.river_hexes_only = false;')
m('P14_stage_riverforest', PK, 'o.river_forest_clearing_only = stage.river_forest_clearing_only;', 'o.river_forest_clearing_only = false;')
m('P15_stage_offriver', PK, 'o.off_river_clearing = stage.off_river_clearing;', 'o.off_river_clearing = false;')
m('P16_stage_maxitems', PK, 'o.max_items_per_city = Some(max_items_stage);\n            });\n            let stage_picks', 'o.max_items_per_city = Some(1.0e9);\n            });\n            let stage_picks')
m('P17_stage_override_keys', PK, 'o.priority_override = Some(stage.keys.iter().map(|k| (*k).to_owned()).collect());', 'o.priority_override = None;')
m('P18_stage_spent', PK, 'let stage_opts = run.after(deficit_spent, |o| {', 'let stage_opts = run.after(0.0, |o| {')
m('P19_record_staged_off', PK, 'run.record(&staged_picks);', '')
m('P20_fallback_cond_staged', PK, 'if staged_picks.is_empty() && !earlier_stage_is_pending && !food_cities.is_empty() {', 'if !earlier_stage_is_pending && !food_cities.is_empty() {')
m('P21_fallback_cond_pending', PK, 'if staged_picks.is_empty() && !earlier_stage_is_pending && !food_cities.is_empty() {', 'if staged_picks.is_empty() && !food_cities.is_empty() {')
m('P22_fallback_record_off', PK, 'run.record(&fallback_picks);', '')
m('P23_fallback_probe_off', PK, 'fallback_is_pending = !pick_auto_improvements_single_pass(&probe).is_empty();', 'fallback_is_pending = false;')
m('P24_roadcities_demand', PK, 'let road_cities: Vec<AutoImprovementCity> = if opts.demand_driven {', 'let road_cities: Vec<AutoImprovementCity> = if true {')
m('P25_roadcities_focus', PK, '.filter(|c| focus_of(opts, c) == UlepszeniaFocus::Zrownowazone)\n            .cloned()\n            .collect()\n    } else {\n        Vec::new()\n    };\n    let food_and_fallback_done', '.cloned()\n            .collect()\n    } else {\n        Vec::new()\n    };\n    let food_and_fallback_done')
m('P26_done_drop_staged', PK, 'let food_and_fallback_done = staged_picks.is_empty()\n        &&', 'let food_and_fallback_done = true\n        &&')
m('P27_done_drop_pending', PK, '&& !earlier_stage_is_pending\n        && fallback_picks', '&& true\n        && fallback_picks')
m('P28_done_drop_fallback', PK, '&& fallback_picks.is_empty()\n        && !fallback_is_pending', '&& true\n        && !fallback_is_pending')
m('P29_done_drop_fallbackpending', PK, '&& !fallback_is_pending\n        && deficit_picks', '&& true\n        && deficit_picks')
m('P30_done_drop_deficit', PK, '&& deficit_picks.is_empty();', '&& true;')
m('P31_deficit_memo_off', PK, 'if let Some(v) = deficit_pending_memo {\n            return v;\n        }', '')
m('P32_deficit_pending_cities', PK, 'let v = !deficit_cities.is_empty() && {', 'let v = true && {')
m('P33_fort_cond_limit', PK, 'if opts.city_limit_exhausted\n        &&', 'if true\n        &&')
m('P34_fort_cond_roadcities', PK, '&& !road_cities.is_empty()\n        && food_and_fallback_done\n        && !deficit_is_pending_now(&run)\n    {\n        let fort_opts', '&& true\n        && food_and_fallback_done\n        && !deficit_is_pending_now(&run)\n    {\n        let fort_opts')
m('P35_fort_cond_done', PK, '&& food_and_fallback_done\n        && !deficit_is_pending_now(&run)\n    {\n        let fort_opts', '&& true\n        && !deficit_is_pending_now(&run)\n    {\n        let fort_opts')
m('P36_fort_cond_deficit', PK, '&& !deficit_is_pending_now(&run)\n    {\n        let fort_opts', '&& true\n    {\n        let fort_opts')
m('P37_fort_pass_flag', PK, 'o.fort_claim_pass = true;', 'o.fort_claim_pass = false;')
m('P38_fort_record_off', PK, 'run.record(&fort_picks);', '')
m('P39_fort_probe_off', PK, 'fort_is_pending = !pick_auto_improvements_single_pass(&unlimited(fort_opts)).is_empty();', 'fort_is_pending = false;')
m('P40_fort_spent', PK, 'let fort_spent = fallback_spent + sum(&fort_picks);', 'let fort_spent = fallback_spent;')
m('P41_road_cond_fort_picks', PK, '&& fort_picks.is_empty()\n        && !fort_is_pending', '&& true\n        && !fort_is_pending')
m('P42_road_cond_fort_pending', PK, '&& !fort_is_pending\n        && !deficit_is_pending_now(&run)\n    {\n        road_picks', '&& true\n        && !deficit_is_pending_now(&run)\n    {\n        road_picks')
m('P43_road_cond_deficit', PK, '&& !deficit_is_pending_now(&run)\n    {\n        road_picks', '&& true\n    {\n        road_picks')
m('P44_road_cond_done', PK, '&& food_and_fallback_done\n        && fort_picks.is_empty()', '&& true\n        && fort_picks.is_empty()')
m('P45_road_roadspass', PK, 'o.roads_pass = true;', 'o.roads_pass = false;')
m('P46_road_override', PK, 'o.priority_override = Some(ROAD_KEYS.iter().map(|k| (*k).to_owned()).collect());', 'o.priority_override = None;')
m('P47_road_maxitems', PK, 'o.max_items_per_city = Some(max_items_stage);\n        }));\n        run.record(&road_picks);', 'o.max_items_per_city = Some(1.0e9);\n        }));\n        run.record(&road_picks);')
m('P48_road_spent', PK, 'run.after(fort_spent, |o| {\n            o.cities = road_cities.clone();', 'run.after(0.0, |o| {\n            o.cities = road_cities.clone();')
m('P49_normal_spent', PK, 'run.after(side_spent, |o| {', 'run.after(0.0, |o| {')
m('P50_other_cities', PK, 'o.cities = other_cities.clone();', 'o.cities = Vec::new();')
m('P51_after_placed', PK, 'o.placed_improvements = Some(self.merged.clone());', 'o.placed_improvements = self.opts.placed_improvements.clone();')
m('P52_after_clearing', PK, 'o.clearing_hex_keys = Some(self.clearing.clone());', 'o.clearing_hex_keys = self.opts.clearing_hex_keys.clone();')
m('P53_after_praca', PK, 'o.praca_available = js_max(0.0, self.opts.praca_available - spent);', 'o.praca_available = self.opts.praca_available;')
m('P54_after_cap', PK, 'o.improvement_budget_cap = Some(js_max(0.0, self.total_budget - spent));', 'o.improvement_budget_cap = Some(self.total_budget);')
m('P55_after_deficitkeys', PK, 'o.resource_deficit_keys = Some(self.actionable.clone());', 'o.resource_deficit_keys = self.opts.resource_deficit_keys.clone();')
m('P56_record_wyrab_clearing', PK, 'if pick.key == "wyrab" {\n                self.clearing.insert(hk);', 'if pick.key == "wyrab" {\n                self.merged.entry(hk).or_default().push(pick.key.clone());')
m('P57_unlimited_pool', PK, 'o.praca_available = MAX_SAFE;', 'o.praca_available = o.praca_available;')
m('P58_unlimited_cap', PK, 'o.improvement_budget_cap = Some(MAX_SAFE);', 'o.improvement_budget_cap = o.improvement_budget_cap;')
m('P59_unlimited_percent', PK, 'o.praca_budget_percent = Some(100.0);', 'o.praca_budget_percent = o.praca_budget_percent;')
m('P60_unlimited_getpercent', PK, 'o.get_praca_budget_percent = None;', '')
m('P61_unlimited_maxitems', PK, 'o.max_items_per_city = Some(f64::INFINITY);', 'o.max_items_per_city = o.max_items_per_city;')
m('P62_unlimited_reserve', PK, 'o.praca_surplus_threshold = Some(0.0);', 'o.praca_surplus_threshold = o.praca_surplus_threshold;')
m('P63_deficit_pass_onlyworked', PK, 'o.get_only_worked = opts.get_resource_pass_only_worked.or(opts.get_only_worked);', 'o.get_only_worked = opts.get_only_worked;')
m('P64_deficit_pass_override', PK, 'o.priority_override = Some(deficit_keys.to_vec());', 'o.priority_override = None;')
m('P65_deficit_pass_flags', PK, 'o.river_forest_clearing_only = false;\n        o.river_hexes_only = false;\n        o.off_river_clearing = false;\n    })\n}', 'o.river_forest_clearing_only = o.river_forest_clearing_only;\n    })\n}')
m('P66_staged_empty_fallback_single', PK, 'if staged_cities.is_empty() || opts.territory_nodes.is_none() {', 'if staged_cities.is_empty() {')
m('P67_staged_flag_percity', PK, 'Some(FoodStages::Flag(b)) => b,', 'Some(FoodStages::Flag(b)) => !b,')
m('P68_staged_percity_neg', PK, 'Some(FoodStages::PerCity(f)) => f(city),', 'Some(FoodStages::PerCity(f)) => !f(city),')
m('P69_other_cities_neg', PK, '.filter(|c| !is_food_stage_city(opts, c))', '.filter(|c| is_food_stage_city(opts, c))')
m('P70_out_order', PK, 'out.extend(deficit_picks);\n    out.extend(staged_picks);', 'out.extend(staged_picks);\n    out.extend(deficit_picks);')

# ---- auto_improvements.rs (helpery P1) ------------------------------------------------------------
m('A01_hasnonfood_neg', P1, 'Some(keys) => keys.iter().any(|k| k != "zywnosc"),', 'Some(keys) => keys.iter().any(|k| k == "zywnosc"),')
m('A02_priorities_skipwyrab', P1, '.filter(|k| !skip_wyrab || **k != "wyrab")', '.filter(|k| true || **k != "wyrab")')
m('A03_priorities_other_list', P1, 'UlepszeniaFocus::Zrownowazone | UlepszeniaFocus::Other => &AI_IMPROVEMENT_PRIORITY,', 'UlepszeniaFocus::Zrownowazone | UlepszeniaFocus::Other => &ULEPSZENIA_FOCUS_ZYWNOSC,')
m('A04_priorities_infra', P1, 'UlepszeniaFocus::Infrastruktura => &ULEPSZENIA_FOCUS_INFRASTRUKTURA,', 'UlepszeniaFocus::Infrastruktura => &ULEPSZENIA_FOCUS_SUROWCE,')
m('A05_deficit_wyrab', P1, 'if *imp != "wyrab" && !out.iter().any(|o| o == imp) {', 'if !out.iter().any(|o| o == imp) {')
m('A06_deficit_dedupe', P1, 'if *imp != "wyrab" && !out.iter().any(|o| o == imp) {', 'if *imp != "wyrab" {')
m('A07_actionable_neg', P1, '.filter(|k| !deficit_improvement_keys(Some(std::slice::from_ref(*k))).is_empty())', '.filter(|k| deficit_improvement_keys(Some(std::slice::from_ref(*k))).is_empty())')
m('A08_limit_ge', P1, 'founded >= limit', 'founded > limit')
m('A09_limit_era_step', P1, '(js_max(1.0, owner_era.unwrap_or(1.0)) - 1.0) * 5.0', '(js_max(1.0, owner_era.unwrap_or(1.0)) - 1.0) * 4.0')
m('A10_limit_era_max', P1, 'js_max(1.0, owner_era.unwrap_or(1.0))', 'owner_era.unwrap_or(1.0)')
m('A11_limit_founded_filter', P1, 'filter(|c| **c != Some(false))', 'filter(|c| **c == Some(true))')
m('A12_limit_finite', P1, 'city_limit_base.filter(|b| b.is_finite())', 'city_limit_base')
m('A13_territory_fort_radius', P1, 'pub const FORT_TERRITORY_RADIUS_PIN: f64 = 5.0;', 'pub const FORT_TERRITORY_RADIUS_PIN: f64 = 10.0;')
m('A14_territory_outpost_radius', P1, 'pub const OUTPOST_TERRITORY_RADIUS_PIN: f64 = 3.0;', 'pub const OUTPOST_TERRITORY_RADIUS_PIN: f64 = 5.0;')
m('A15_territory_fort_flag', P1, 'if node.is_fort == Some(true) {\n        return FORT_TERRITORY_RADIUS_PIN;', 'if node.is_fort == Some(false) {\n        return FORT_TERRITORY_RADIUS_PIN;')
m('A16_jsmax_nan', P1, 'pub(crate) fn js_max(a: f64, b: f64) -> f64 {\n    if a.is_nan() || b.is_nan() {', 'pub(crate) fn js_max(a: f64, b: f64) -> f64 {\n    if false {')
m('A17_jsmin_nan', P1, 'pub(crate) fn js_min(a: f64, b: f64) -> f64 {\n    if a.is_nan() || b.is_nan() {', 'pub(crate) fn js_min(a: f64, b: f64) -> f64 {\n    if false {')


def run(idx):
    mid, rel, old, new, occ, desc = M[idx]
    path = os.path.join(SRC, rel)
    with open(path, 'r', encoding='utf-8') as f:
        orig = f.read()
    pos = -1
    for _ in range(occ):
        pos = orig.find(old, pos + 1)
        if pos < 0:
            return 'NOOP(not found)'
    mutated = orig[:pos] + new + orig[pos + len(old):]
    if mutated == orig:
        return 'NOOP(same)'
    env = dict(os.environ)
    env.update({'CARGO_TARGET_DIR': TARGET, 'CARGO_INCREMENTAL': '1',
                'CARGO_PROFILE_DEV_DEBUG': '0', 'CARGO_PROFILE_TEST_DEBUG': '0'})
    try:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(mutated)
        try:
            for _attempt in range(4):
                r = subprocess.run(['cargo', 'test', '--test', 'p6_8i_pick', '-q'], cwd=ENGINE, env=env,
                                   capture_output=True, text=True, timeout=240)
                out = r.stdout + r.stderr
                if 'signal: 9' in out or 'SIGKILL' in out:
                    continue  # OOM killer (inne procesy na maszynie): ponow
                break
            if r.returncode == 0:
                return 'SURVIVED'
            if 'error[E' in out or 'could not compile' in out:
                with open(os.path.join(HERE, 'compile-error-debug.txt'), 'a', encoding='utf-8') as dbg:
                    dbg.write(f'--- {mid}\n{out[-1500:]}\n')
                return 'COMPILE_ERROR'
            return 'KILLED'
        except subprocess.TimeoutExpired:
            return 'KILLED(TIMEOUT)'
    finally:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(orig)


def _on_term(signum, frame):
    # `timeout` wysyla SIGTERM: rzuc wyjatek, zeby `finally` w run() przywrocil plik.
    raise SystemExit(143)


signal.signal(signal.SIGTERM, _on_term)


def main():
    if len(sys.argv) >= 2 and sys.argv[1] == 'list':
        for i, (mid, rel, old, new, occ, desc) in enumerate(M):
            print(i, mid, rel)
        print('total', len(M))
        return
    if sys.argv[1] == 'ids':
        # python3 mutate-8i-pick.py ids <plik_wyniku> ID1 ID2 ...  (uruchamia wskazane mutanty po ID)
        outp = sys.argv[2]
        wanted = sys.argv[3:]
        for i, row in enumerate(M):
            if row[0] in wanted or row[0].split('_')[0] in wanted:
                res = run(i)
                line = f'{row[0]}: {res}'
                print(line, flush=True)
                with open(outp, 'a', encoding='utf-8') as f:
                    f.write(line + '\n')
        return
    lo, hi = int(sys.argv[1]), int(sys.argv[2])
    outp = sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, 'pick-wynik.txt')
    for i in range(lo, min(hi, len(M))):
        res = run(i)
        line = f'{M[i][0]}: {res}'
        print(line, flush=True)
        with open(outp, 'a', encoding='utf-8') as f:
            f.write(line + '\n')


if __name__ == '__main__':
    main()
