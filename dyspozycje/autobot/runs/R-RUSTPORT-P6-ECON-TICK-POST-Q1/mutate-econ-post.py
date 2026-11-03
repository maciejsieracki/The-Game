"""Mutacje POST (python3 -I mutate-econ-post.py <od> <do> | check) -- kazda: dokladnie 1 wystapienie `old` -> `new`,
`cargo test --test p6_econ_post_e2e --test p6_7a_post_central`; KILLED = test pada, COMPILE = nie kompiluje (nie liczone),
SURVIVED = zielono. Plik zawsze przywracany. 'EKW' = oczekiwany mutant rownowazny (dowod w P6-ECON-TICK-POST.md sek. 6)."""
import os
import subprocess
import sys

REPO = '/home/user/The-Game/.claude/worktrees/wf_6dcea91b-ec4-1'
D = REPO + '/rust-port/engine/src/domain/'
ENG = REPO + '/rust-port/engine'
P = D + 'turn_economy_post.rs'
G = D + 'city_growth.rs'

M = [
    # ---- deficyt Zlota ----
    ('P01-rebel-counted-ai', P, '            && o != REBEL_FACTION_OWNER_ID;\n        if is_ai', '            ;\n        if is_ai', ''),
    ('P02-barbarian-counted-ai', P, '            && o != BARBARIAN_OWNER_ID\n            && o != REBEL', '            && o != REBEL', ''),
    ('P03-owner0-not-seeded', P, 'let mut gd_owner_ids: Vec<i64> = vec![0];', 'let mut gd_owner_ids: Vec<i64> = vec![];', ''),
    ('P04-state-keys-ignored', P, 'for &k in states.keys() {', 'for &k in states.keys().filter(|_| false) {', ''),
    ('P05-barb-state-created', P, '        if oid == BARBARIAN_OWNER_ID {\n            continue;\n        }\n        states.entry', '        if false {\n            continue;\n        }\n        states.entry', 'EKW'),
    ('P06-barb-not-filtered', P, '        .filter(|&o| o != BARBARIAN_OWNER_ID)\n        .collect();', '        .filter(|_| true)\n        .collect();', ''),
    ('P07-atrycja-flag-ignored', P, '        if !t.zloto_deficyt_atrycja_aktywna {\n            continue;\n        }', '        if false {\n            continue;\n        }', ''),
    ('P08-civilians-hit', P, 'civilian: is_civilian_unit(&u.category, &u.type_id),', 'civilian: false,', ''),
    ('P09-player-counter-inverted', P, '        if t.owner_id == 0 {\n            player_damaged', '        if t.owner_id != 0 {\n            player_damaged', ''),
    ('P10-player-destroyed-wrong', P, 'player_destroyed += res.destroyed_ids.len();', 'player_destroyed += res.damaged_count;', ''),
    ('P11-hpmax-not-written-back', P, '            dst.hp = src.hp;\n            dst.hp_max = src.hp_max;', '            dst.hp = src.hp;', ''),
    ('P12-cleanup-skipped', P, 'besieger_by_city, &destroyed_ids);\n    GoldDeficitStepOutcome', 'besieger_by_city, &[]);\n    GoldDeficitStepOutcome', ''),
    ('P13-hp-frac-from-stat-mult', P, 'input.params.zloto_deficyt_hp_frac,\n            input.unit_health_by_type', 'input.params.zloto_deficyt_stat_mult,\n            input.unit_health_by_type', ''),
    ('P14-state-seed-skipped', P, '        states.entry(oid).or_insert_with(fresh_gold_deficit_state);', '        let _ = oid;', 'EKW'),
    # ---- wzrost po centrali ----
    ('P20-spichlerz-ceramika-off', P, 'ceramika_active: t.is_some_and(|t| t.spichlerz_ceramika),', 'ceramika_active: false,', ''),
    ('P21-spichlerz-sol-off', P, 'sol_active: t.is_some_and(|t| t.spichlerz_sol),', 'sol_active: false,', ''),
    ('P22-spichlerz-pop-off', P, 'ma_spichlerz_pop: t.is_some_and(|t| t.ma_spichlerz),', 'ma_spichlerz_pop: false,', ''),
    ('P23-spichlerz-ii-off', P, 'ma_spichlerz_ii_pop: t.is_some_and(|t| t.ma_spichlerz_ii),', 'ma_spichlerz_ii_pop: false,', ''),
    ('P24-hunger-not-loaded', P, 'g.hunger_loss_ulamkowy = hunger_loss.get(&id).copied().flatten();', 'g.hunger_loss_ulamkowy = None;', ''),
    ('P25-manpower-not-loaded', P, 'g.manpower = extras.get(&id).and_then(|e| e.manpower);', 'g.manpower = None;', ''),
    ('P26-growth-mult-dropped', P, 'order_growth_mult_by_city: Some(input.growth_mult_map),', 'order_growth_mult_by_city: None,', ''),
    ('P27-mp-max-map-dropped', P, 'manpower_max_mult_by_owner_id: Some(input.manpower_max_mult_by_owner_id),', 'manpower_max_mult_by_owner_id: None,', ''),
    ('P28-pin-matrix-dropped', P, 'pin_matrix: Some(input.matrix),', 'pin_matrix: None,', ''),
    ('P29-happiness-dropped', P, 'happiness_by_city_id: Some(input.happiness_by_city_id),', 'happiness_by_city_id: None,', ''),
    ('P30-citizen-dropped', P, 'citizen_growth_pct_by_city_id: Some(input.citizen_growth_pct_by_city_id),', 'citizen_growth_pct_by_city_id: None,', ''),
    ('P31-owner-era-dropped', P, 'owner_era_by_owner: Some(input.owner_era_by_owner),', 'owner_era_by_owner: None,', ''),
    ('P32-built-dropped', P, 'built_by_city: Some(input.built_by_city),', 'built_by_city: None,', ''),
    ('P33-owner-civ-dropped', P, 'owner_civ_by_owner_id: Some(input.owner_civ_by_owner_id),', 'owner_civ_by_owner_id: None,', ''),
    ('P34-difficulty-forced-normal', P, 'let difficulty = game_difficulty_from_web(input.difficulty).unwrap_or(GameDifficulty::Normal);', 'let difficulty = GameDifficulty::Normal;', ''),
    ('P35-hunger-not-saved', P, '        hunger_loss.insert(src.city.id.clone(), src.hunger_loss_ulamkowy);', '        let _ = &hunger_loss;', ''),
    ('P36-manpower-not-saved', P, '            e.manpower = src.manpower;', '            let _ = src.manpower;', ''),
    ('P37-growth-total-not-saved', P, '    tick.growth = econ.growth;', '    let _ = econ.growth;', ''),
    ('P38-starved-total-not-saved', P, '    tick.starved = econ.starved;', '    let _ = econ.starved;', ''),
    ('P39-ludnosc-po-not-saved', P, '        dst.ludnosc_po = v;', '        let _ = v;', ''),
    ('P40-wzrost-not-saved', P, '        dst.wzrost = v;', '        let _ = v;', ''),
    ('P41-ubytek-not-saved', P, '        dst.ubytek = v;', '        let _ = v;', ''),
    ('P42-wzrost-procent-not-saved', P, '        dst.wzrost_procent = Some(v);', '        let _ = v;', ''),
    ('P43-frac-po-not-saved', P, '        dst.wzrost_ulamkowy_po = Some(v);', '        let _ = v;', ''),
    ('P44-magazyn-po-not-saved', P, '        dst.magazyn_po_turze = v;', '        let _ = v;', ''),
    ('P45-hooks-bypassed', P, '        self.inner.rebalance_workers_after_population_change(\n            city,\n            pop_before,\n            pop_after,\n            exclude_hex_keys,\n        );', '        let _ = (city, pop_before, pop_after, exclude_hex_keys);', ''),
    ('P46-changed-not-collected', P, '        self.changed.push(city_id.to_string());', '        let _ = city_id;', ''),
    # ---- upkeep Pracy ----
    ('P50-upkeep-ge', P, '    if player_upkeep > 0.0 {', '    if player_upkeep >= 0.0 {', ''),
    ('P51-ai-owner0-not-skipped', P, '        if oid == 0 || up <= 0.0 {', '        if up <= 0.0 {', ''),
    ('P52-ai-nonpositive-applied', P, '        if oid == 0 || up <= 0.0 {', '        if oid == 0 {', ''),
    ('P53-ai-default-pool-one', P, '            .copied()\n            .unwrap_or(0.0);', '            .copied()\n            .unwrap_or(1.0);', ''),
    ('P54-rate-not-reduced', P, 'last_praca_rate: last_praca_rate - player_upkeep,', 'last_praca_rate,', ''),
    ('P55-ai-no-floor', P, 'insert(oid, js_max0(cur - up));', 'insert(oid, cur - up);', ''),
    ('P56-player-owner-wrong', P, 'let player_upkeep = praca_upkeep_by_owner.get(&0)', 'let player_upkeep = praca_upkeep_by_owner.get(&1)', ''),
    ('P57-player-no-floor', P, '        pools.player_praca_pool = js_max0(pools.player_praca_pool - player_upkeep);', '        pools.player_praca_pool -= player_upkeep;', ''),
    # ---- city_growth.rs (ext) ----
    ('G01-factor-not-clamped', G, 'js_max(0.0, order_growth_mult)', 'order_growth_mult', ''),
    ('G02-factor-added', G, 'growth_percent * factor', 'growth_percent + factor', ''),
    ('G03-default-mult-zero', G, 'let raw = m.get(&row_city_id).copied().unwrap_or(1.0);', 'let raw = m.get(&row_city_id).copied().unwrap_or(0.0);', ''),
    ('G04-adjusted-eq-ignored', G, 'if adjusted == base_breakdown.total {\n                                base_breakdown', 'if false {\n                                base_breakdown', 'EKW'),
    ('G05-mp-map-value-ignored', G, 'Some(v) => *v,\n                            None => match ext.pin_matrix', 'Some(_) => 1.0,\n                            None => match ext.pin_matrix', ''),
    ('G06-matrix-fallback-neutral', G, 'owner_civ.map(|k| (matrix, k)),\n                                    )\n                                    .max_mult', 'None,\n                                    )\n                                    .max_mult', ''),
    ('G07-legacy-fallback-neutral', G, 'None => legacy_max_mult,', 'None => 1.0,', ''),
    ('G08-total-replaced-by-base', G, '                                GrowthPercentBreakdown {\n                                    total: adjusted,', '                                GrowthPercentBreakdown {\n                                    total: base_breakdown.total,', ''),
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
    env = dict(os.environ, CARGO_TARGET_DIR='/dev/shm/ptq1-mut', CARGO_INCREMENTAL='0',
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
            r = subprocess.run(['cargo', 'test', '-j', '2', '--test', 'p6_econ_post_e2e', '--test', 'p6_7a_post_central'],
                               cwd=ENG, env=env, capture_output=True, text=True, timeout=900)
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
