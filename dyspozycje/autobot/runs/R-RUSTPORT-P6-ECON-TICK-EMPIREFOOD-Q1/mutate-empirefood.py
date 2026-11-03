"""Mutacje modulow EmpireFood (python3 -I mutate-empirefood.py <od> <do> | check) -- kazda: dokladnie 1 wystapienie `old` -> `new`,
`cargo test --test p6_empirefood_e2e`; KILLED = test pada, COMPILE = nie kompiluje (nie liczone), SURVIVED = zielono.
Plik zawsze przywracany. 'EKW' = oczekiwany mutant rownowazny (dowod w P6-ECON-TICK-EMPIREFOOD.md sek. 6)."""
import os
import subprocess
import sys

REPO = '/home/user/The-Game/.claude/worktrees/wf_b2abd3fe-984-1'
D = REPO + '/rust-port/engine/src/domain/'
ENG = REPO + '/rust-port/engine'
A = D + 'turn_economy_attrition.rs'
F = D + 'turn_economy_empirefood.rs'
R = D + 'turn_economy_wire.rs'

M = [
    # ---- atrycja (army-starvation.ts) ----
    ('A01-frac-no-upper-clamp', A, 'let frac = js_max(0.0, js_min(1.0, hp_frac));', 'let frac = js_max(0.0, hp_frac);', ''),
    ('A02-frac-zero-passes', A, 'if frac <= 0.0 {\n        return StarvationResult::default();', 'if frac < 0.0 {\n        return StarvationResult::default();', ''),
    ('A03-owner-filter-inverted', A, 'if u.owner_id != owner_id {\n            continue;\n        }\n        if is_civilian_unit', 'if u.owner_id == owner_id {\n            continue;\n        }\n        if is_civilian_unit', ''),
    ('A04-civilians-hit', A, '        if is_civilian_unit(&u.category, &u.type_id) {\n            continue;\n        }\n', '', ''),
    ('A05-maxhp-zero-passes', A, 'if max_hp <= 0.0 {\n            continue;', 'if max_hp < 0.0 {\n            continue;', 'EKW'),
    ('A06-loss-ceil', A, '(max_hp * frac).floor()', '(max_hp * frac).ceil()', ''),
    ('A07-loss-no-min1', A, 'let loss = js_max(1.0, (max_hp * frac).floor());', 'let loss = (max_hp * frac).floor();', ''),
    ('A08-hp-below-zero', A, 'let hp = js_max(0.0, u.hp.unwrap_or(max_hp) - loss);', 'let hp = u.hp.unwrap_or(max_hp) - loss;', 'EKW'),
    ('A09-destroy-lt', A, '        if hp <= 0.0 {\n            out.destroyed_ids', '        if hp < 0.0 {\n            out.destroyed_ids', ''),
    ('A10-damaged-count-off', A, '        out.damaged_count += 1;\n', '', ''),
    ('A11-hpmax-not-backfilled', A, '        if u.hp_max.is_none() {\n            u.hp_max = Some(max_hp);\n        }\n', '', 'EKW'),
    ('A12-hp-not-backfilled', A, '        if u.hp.is_none() {\n            u.hp = Some(max_hp);\n        }\n', '', 'EKW'),
    ('A13-sync-no-upper-clamp', A, 'js_max(0.0, js_min(max_hp, hp))', 'js_max(0.0, hp)', ''),
    ('A14-sync-hpmax-not-set', A, '    u.hp_max = Some(max_hp);\n    if let Some(hp) = u.hp {', '    if let Some(hp) = u.hp {', ''),
    ('A15-sync-infinite-kept', A, 'u.hp = Some(if hp.is_finite() {', 'u.hp = Some(if true {', 'NIE_ZMIERZONO'),
    # ---- sprzatanie po zniszczonych (main.ts:34692-34745) ----
    ('C01-garn-flag-ignored', A, '        if u.in_garnizon {\n            // `cityAtUnit(u)`', '        if true {\n            // `cityAtUnit(u)`', ''),
    ('C02-cityatunit-owner-ignored', A, '.find(|c| c.owner_id == u.owner_id && c.q == u.q && c.r == u.r)', '.find(|c| c.q == u.q && c.r == u.r)', ''),
    ('C03-retain-inverted', A, 'units.retain(|u| !destroyed.contains(u.id.as_str()));', 'units.retain(|u| destroyed.contains(u.id.as_str()));', ''),
    ('C04-still-marked-ignored', A, '        if still_marked {\n            continue;\n        }', '        if false {\n            continue;\n        }', ''),
    ('C05-not-besieged-ended', A, '        if !sc.oblegane {\n            continue;\n        }', '        if false {\n            continue;\n        }', ''),
    ('C06-besieger-map-ignored', A, '.or_else(|| besieger_by_city.get(siege_city_id).copied())', '.or(None)', ''),
    ('C07-adjacent-le', A, 'hex_distance(x.q, x.r, sc.q, sc.r) == 1.0', 'hex_distance(x.q, x.r, sc.q, sc.r) <= 1.0', ''),
    ('C08-adjacent-owner-ignored', A, '.any(|x| x.owner_id == b && hex_distance', '.any(|x| hex_distance', ''),
    ('C09-adj-inverted', A, '        if !adj {\n            end_map_siege_engine', '        if adj {\n            end_map_siege_engine', ''),
    ('C10-end-oblegane-kept', A, '        c.oblegane = false;\n        c.oblegajacy_owner_id = None;', '        c.oblegajacy_owner_id = None;', ''),
    ('C11-end-owner-kept', A, '        c.oblegajacy_owner_id = None;\n        c.siege_capitulation_pending = false;', '        c.siege_capitulation_pending = false;', ''),
    ('C12-end-cap-kept', A, '        c.siege_capitulation_pending = false;\n        c.has_siege_machines = false;', '        c.has_siege_machines = false;', ''),
    ('C13-end-machines-kept', A, '        c.has_siege_machines = false;\n    }', '    }', ''),
    ('C14-end-units-oblega-kept', A, '            u.oblega_city_id = None;\n        }\n    }\n    besieger_by_city.remove(city_id);', '        }\n    }\n    besieger_by_city.remove(city_id);', 'EKW'),
    ('C15-end-besieger-kept', A, '    besieger_by_city.remove(city_id);\n}', '}', ''),
    ('C16-garn-count-flag-ignored', A, '.filter(|u| u.owner_id == owner && u.q == q && u.r == r && u.in_garnizon)\n            .count();\n        cities[idx]', '.filter(|u| u.owner_id == owner && u.q == q && u.r == r)\n            .count();\n        cities[idx]', ''),
    ('C17-garn-count-owner-ignored', A, '.filter(|u| u.owner_id == owner && u.q == q && u.r == r && u.in_garnizon)\n            .count();\n        cities[idx]', '.filter(|u| u.q == q && u.r == r && u.in_garnizon)\n            .count();\n        cities[idx]', ''),
    ('C18-garn-not-synced', A, '        cities[idx].garnizon = Some(n as f64);\n', '', ''),
    ('C19-hexdist-ds-dropped', A, 'js_max(js_max(dq, dr), ds)', 'js_max(dq, dr)', ''),
    # ---- koszt zywnosci armii / sumy ----
    ('F01-military-owner-inverted', F, '        if u.owner_id != owner_id {\n            continue;\n        }\n        let like', '        if u.owner_id == owner_id {\n            continue;\n        }\n        let like', ''),
    ('F02-garrison-flag-ignored', F, 'let in_sol = u.in_garnizon\n            && u.garrison_city_id', 'let in_sol = u.garrison_city_id', 'EKW'),
    ('F03-own-territory-ignored', F, 'spichlerz_army_food_cost_multiplier(sol_army, u.on_own_territory, in_sol)', 'spichlerz_army_food_cost_multiplier(sol_army, true, in_sol)', ''),
    ('F04-camping-ignored', F, 'camping: u.camping,', 'camping: false,', ''),
    ('F05-sol-army-off', F, '            sol_army_by_owner.contains(&owner),', '            false,', ''),
    ('F06-sol-cities-off', F, '            sol_city_ids_by_owner.get(&owner).unwrap_or(&empty_set),\n        )\n    };', '            &empty_set,\n        )\n    };', ''),
    ('F07-refresh-uses-netto', F, 'total += tick.bilans_lokalny.unwrap_or(tick.zywnosc_netto);', 'total += tick.zywnosc_netto;', 'EKW'),
    ('F08-refresh-start', F, 'let mut total = 0.0;\n    for tick in per_city {', 'let mut total = 1.0;\n    for tick in per_city {', ''),
    # ---- adaptery ----
    ('F09-obl-flag-dropped', F, '        oblegany: t.oblegany,', '        oblegany: false,', ''),
    ('F10-owner-era-one', F, '        owner_era: Some(t.owner_era),', '        owner_era: Some(1.0),', ''),
    ('F11-wb-netto-skipped', F, '    dst.zywnosc_netto = src.zywnosc_netto;\n', '', ''),
    ('F12-wb-poziom-skipped', F, '    if let Some(v) = src.poziom_racji {\n        dst.poziom_racji = v;\n    }', '', ''),
    ('F13-wb-koszt-skipped', F, '    if let Some(v) = src.koszt_racji {\n        dst.koszt_racji = v;\n    }', '', ''),
    ('F14-wb-bilans-skipped', F, '    if let Some(v) = src.bilans_lokalny {\n        dst.bilans_lokalny = v;\n    }', '', ''),
    ('F15-total-not-applied', F, '    if let Some(t) = total_zywnosc {\n        tick.total_zywnosc = t;\n    }', '', ''),
    ('F16-brutto-dropped', F, '        zywnosc_brutto: Some(t.zywnosc_brutto),', '        zywnosc_brutto: None,', ''),
    # ---- blok ----
    ('F17-spichlerz-sol-off', F, 'sol_active: tick.and_then(|t| t.spichlerz_sol).unwrap_or(false),', 'sol_active: false,', 'EKW'),
    ('F18-spichlerz-ceramika-off', F, 'ceramika_active: tick.and_then(|t| t.spichlerz_ceramika).unwrap_or(false),', 'ceramika_active: false,', 'EKW'),
    ('F19-spichlerz-ma-ii-off', F, 'ma_spichlerz_ii_pop: tick.and_then(|t| t.ma_spichlerz_ii).unwrap_or(false),', 'ma_spichlerz_ii_pop: false,', ''),
    ('F20-akwedukt-ignored', F, 'let ma_akwedukt = built.iter().any(|b| b == "akwedukt");', 'let ma_akwedukt = false;', ''),
    ('F21-spichlerz-bldg-ignored', F, 'let ma_spichlerz = city_has_spichlerz_building(built);', 'let ma_spichlerz = false;', ''),
    ('F22-civ-delta-ignored', F, 'let civ_key = ctx\n            .owner_civ_by_owner_id\n            .get(&c.owner_id)\n            .map(String::as_str);', 'let civ_key: Option<&str> = None;', ''),
    ('F23-popcap-prog-swapped', F, 'akwedukt_prog_ludnosci: econ_cfg.akwedukt_prog_ludnosci,', 'akwedukt_prog_ludnosci: econ_cfg.spichlerz_prog_ludnosci,', ''),
    ('F24-popcap-max-swapped', F, 'akwedukt_max_ludnosci: econ_cfg.akwedukt_max_ludnosci,', 'akwedukt_max_ludnosci: econ_cfg.akwedukt_prog_ludnosci,', ''),
    ('F25-negative-city-owner', F, 'if c.owner_id >= 0 && !owner_ids.contains(&c.owner_id) {', 'if !owner_ids.contains(&c.owner_id) {', ''),
    ('F26-negative-state-owner', F, 'if oid >= 0 && !owner_ids.contains(&oid) {', 'if !owner_ids.contains(&oid) {', ''),
    ('F27-state-owners-skipped', F, '    for oid in st.states.keys() {\n        if oid >= 0', '    for oid in Vec::<i64>::new() {\n        if oid >= 0', 'EKW'),
    ('F28-balance-managed-all', F, '                only_auto_managed: human,\n                require_flow_balance: human,', '                only_auto_managed: false,\n                require_flow_balance: human,', ''),
    ('F29-balance-flow-off', F, '                only_auto_managed: human,\n                require_flow_balance: human,', '                only_auto_managed: human,\n                require_flow_balance: false,', ''),
    ('F30-balance-no-army-cost', F, '                require_flow_balance: human,\n                koszt_armii,', '                require_flow_balance: human,\n                koszt_armii: 0.0,', ''),
    ('F31-balance-no-popcap', F, '                koszt_armii,\n                pop_cap_by_city_id: Some(&pop_cap_by_city_id),\n            },\n            &mut gcities,\n            &mut econ,\n        );\n        if auto_result', '                koszt_armii,\n                pop_cap_by_city_id: None,\n            },\n            &mut gcities,\n            &mut econ,\n        );\n        if auto_result', ''),
    ('F32-pending-for-ai', F, '            if human {\n                pending_auto_ration', '            if !human {\n                pending_auto_ration', ''),
    ('F33-raise-for-citystates', F, 'if !ctx.typ_city_copy_owners.contains(&owner_id) {', 'if ctx.typ_city_copy_owners.contains(&owner_id) {', ''),
    ('F34-raise-surplus-off', F, '                    require_production_surplus: human,', '                    require_production_surplus: false,', ''),
    ('F35-raise-managed-all', F, '                    require_production_surplus: human,\n                    only_auto_managed: human,', '                    require_production_surplus: human,\n                    only_auto_managed: false,', ''),
    ('F36-raise-no-army-cost', F, '                    only_auto_managed: human,\n                    koszt_armii,', '                    only_auto_managed: human,\n                    koszt_armii: 0.0,', ''),
    ('F37-raise-no-popcap', F, '                    koszt_armii,\n                    pop_cap_by_city_id: Some(&pop_cap_by_city_id),\n                },\n                &mut gcities,\n                &mut econ,\n            );\n            if raise', '                    koszt_armii,\n                    pop_cap_by_city_id: None,\n                },\n                &mut gcities,\n                &mut econ,\n            );\n            if raise', ''),
    ('F38-raise-adjust-ignored', F, '            if raise.adjusted {\n                any_adjusted = true;\n            }', '', ''),
    ('F39-any-refresh-skipped', F, '    if any_adjusted {\n        total_zywnosc = Some(refresh_economy_food_totals(&econ.per_city));\n    }', '', ''),
    ('F40-clamp-zapasy-zero', F, 'let zapasy0 = st.states.get(h_oid).map_or(0.0, |s| s.zapasy_panstwa);', 'let zapasy0 = 0.0;', ''),
    ('F41-clamp-humans-seat', F, 'human_owner_ids: vec![0],', 'human_owner_ids: vec![h_oid],', ''),
    ('F42-clamp-ge', F, 'if cur > max_safe {', 'if cur >= max_safe {', ''),
    ('F43-clamp-skipped', F, 'gc.city.poziom_racji = Some(max_safe);\n                    clamped_any = true;', 'clamped_any = true;', ''),
    ('F44-clamp-recompute-skipped', F, '    if clamped_any {\n        recompute_city_food_balances_in_econ(\n            &mut econ.per_city,\n            &gcities,\n            Some(&spichlerz_by_city),\n        );\n', '    if clamped_any {\n', ''),
    ('F45-clamp-popcap-none', F, '                    pop_cap_by_city_id: Some(&pop_cap_by_city_id),\n                    human_owner_ids', '                    pop_cap_by_city_id: None,\n                    human_owner_ids', ''),
    ('F46-era-resolver-dropped', F, '        Some(ctx.owner_era),', '        None,', ''),
    ('F47-magazyn-count-dropped', F, '        Some(ctx.built_by_city),\n        Some(ctx.owner_era),', '        None,\n        Some(ctx.owner_era),', ''),
    ('F48-unit-owners-dropped', F, 'let unit_owner_ids: Vec<i64> = ctx.econ_units.iter().map(|u| u.owner_id).collect();', 'let unit_owner_ids: Vec<i64> = Vec::new();', ''),
    ('F49-atrycja-gate-off', F, '        if !t.glod_wojska_atrycja_aktywna {\n            continue;\n        }', '', ''),
    ('F50-hpfrac-const', F, '            ef_params.glod_wojska_hp_frac,', '            0.08,', ''),
    ('F51-player-count-inverted', F, 'if t.owner_id == 0 {', 'if t.owner_id != 0 {', ''),
    ('F52-sync-skipped', F, '        sync_runtime_unit_hp_state(u, mx);', '        let _ = mx;', ''),
    ('F53-cleanup-destroyed-empty', F, '        st.besieger_by_city,\n        &destroyed_all,', '        st.besieger_by_city,\n        &[],', ''),
    ('F54-hunger-dropped', F, '.map(|g| (g.city.id.clone(), g.hunger_loss_ulamkowy))', '.map(|g| (g.city.id.clone(), None))', ''),
    ('F55-cities-not-copied-back', F, '        *dst = src.city.clone();', '        let _ = (&dst, &src);', ''),
    # ---- N3: atrycja garnizonu miast oblezonych (main.ts:34986-35004) ----
    ('N01-garrison-flag-ignored', A, '.filter(|(_, u)| u.owner_id == owner && u.q == q && u.r == r && u.in_garnizon)', '.filter(|(_, u)| u.owner_id == owner && u.q == q && u.r == r)', ''),
    ('N02-garrison-owner-ignored', A, '.filter(|(_, u)| u.owner_id == owner && u.q == q && u.r == r && u.in_garnizon)', '.filter(|(_, u)| u.q == q && u.r == r && u.in_garnizon)', ''),
    ('N03-empty-garrison-logged', A, '        if idxs.is_empty() {\n            continue;\n        }', '', ''),
    ('N04-hpmax-not-written-back', A, '            units[i].hp_max = sub[k].hp_max;\n', '', 'EKW'),
    ('N05-hp-not-written-back', A, '            units[i].hp = sub[k].hp;\n', '', ''),
    ('N06-destroyed-not-removed', A, 'if !starv.destroyed_ids.is_empty() {\n            units.retain', 'if false {\n            units.retain', ''),
    ('N07-garnizon-not-synced', A, '        cities[ci].garnizon = Some(n as f64);\n        log.push', '        log.push', ''),
    ('N08-hpfrac-const', F, '        &besieged,\n        ef_params.glod_wojska_hp_frac,', '        &besieged,\n        0.08,', ''),
    ('N09-besieged-inverted', F, '        .filter(|t| t.oblegany)\n        .map(|t| t.city_id.clone())', '        .filter(|t| !t.oblegany)\n        .map(|t| t.city_id.clone())', ''),
    ('N10-n3-count-flag-ignored', A, '.filter(|u| u.owner_id == owner && u.q == q && u.r == r && u.in_garnizon)\n            .count();\n        cities[ci]', '.filter(|u| u.owner_id == owner && u.q == q && u.r == r)\n            .count();\n        cities[ci]', ''),
    # ---- wiazanie ----
    ('R01-block-on-clone', R, '            &mut tick.result,\n            &sol_army,', '            &mut tick.result.clone(),\n            &sol_army,', ''),
    ('R02-sol-state-empty', R, 'sol.sol_army_by_owner.clone(),\n            sol.sol_city_ids_by_owner.clone(),', 'BTreeSet::new(),\n            BTreeMap::new(),', ''),
    ('R03-humans-empty', R, 'let human_ids: Vec<i64> = ctx.human_owner_ids.iter().copied().collect();', 'let human_ids: Vec<i64> = Vec::new();', ''),
    ('R04-typ-city-ignored', R, 'typ_city_copy_owners: f.typ_city_copy_owners,', 'typ_city_copy_owners: &BTreeSet::new(),', ''),
    ('R05-food-skipped', R, 'let empire_food = food.map(|mut f| {', 'let empire_food = food.filter(|_| false).map(|mut f| {', ''),
]


def count(path, old):
    with open(path) as fh:
        return fh.read().count(old)


def main():
    if len(sys.argv) > 1 and sys.argv[1] == 'check':
        bad = 0
        for name, path, old, new, tag in M:
            c = count(path, old)
            if c != 1:
                bad += 1
                print('NOMATCH', name, c)
        print('check: %d mutacji, niepasujacych %d' % (len(M), bad))
        return
    lo, hi = int(sys.argv[1]), int(sys.argv[2])
    env = dict(os.environ, CARGO_TARGET_DIR='/dev/shm/ef_q1_mut', CARGO_INCREMENTAL='0',
               CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')
    for i, (name, path, old, new, tag) in enumerate(M):
        if i < lo or i >= hi:
            continue
        with open(path) as fh:
            orig = fh.read()
        if orig.count(old) != 1:
            print('%-34s NOMATCH(%d)' % (name, orig.count(old)), flush=True)
            continue
        try:
            with open(path, 'w') as fh:
                fh.write(orig.replace(old, new))
            r = subprocess.run(['cargo', 'test', '-j', '2', '--test', 'p6_empirefood_e2e'], cwd=ENG, env=env,
                               capture_output=True, text=True, timeout=900)
            out = r.stdout + r.stderr
            if r.returncode == 0:
                res = 'SURVIVED'
            elif 'could not compile' in out or 'error[E' in out:
                res = 'COMPILE'
            else:
                res = 'KILLED'
        finally:
            with open(path, 'w') as fh:
                fh.write(orig)
        print('%-34s %-9s %s' % (name, res, tag), flush=True)


main()
