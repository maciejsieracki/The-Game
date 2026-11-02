"""Mutacje modulow turn_economy_upkeep.rs / turn_economy_health.rs / wiazania w turn_economy_advance.rs
(python3 -I mutate.py <od> <do>).
Kazda mutacja: dokladnie 1 wystapienie `old` -> `new`, `cargo test --test p6_adv_q3_pipeline`,
KILLED gdy testy padaja, COMPILE gdy sie nie kompiluje (nie liczone do zabitych), SURVIVED gdy zielono.
Plik zawsze przywracany. EKW = mutant rownowazny (dowod plik:linia w P6-ADVANCE-CITY-ECONOMY-Q3.md sek. 6).
"""
import os
import subprocess
import sys

REPO = '/home/user/The-Game/.claude/worktrees/wf_b5517ef2-da8-3'
D = REPO + '/rust-port/engine/src/domain/'
U = D + 'turn_economy_upkeep.rs'
H = D + 'turn_economy_health.rs'
A = D + 'turn_economy_advance.rs'
RUN = REPO + '/dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q3-Q1'
M = [
    # ---- P4 turn_economy_upkeep.rs
    ('U01-cost-clamp-removed', U, '    let cost = js_max(\n        0.0,\n        load_resource_improvement_upkeep_cost(econ_params, difficulty),\n    );', '    let cost = load_resource_improvement_upkeep_cost(econ_params, difficulty);', 'EKW'),
    ('U02-inner-clamp-removed', U, '            upkeep += js_max(\n                0.0,\n                js_round(cost * terrain_improvement_era_multiplier(Some(era))),\n            );', '            upkeep += js_round(cost * terrain_improvement_era_multiplier(Some(era)));', 'EKW'),
    ('U03-contains-inverted', U, 'if !upkeep_keys.contains(key) {', 'if upkeep_keys.contains(key) {', ''),
    ('U04-empty-skip-removed', U, '        if imp_keys.is_empty() {\n            continue;\n        }\n        let Some(owner)', '        let Some(owner)', 'EKW'),
    ('U05-owner-none-default', U, 'let Some(owner) = territory_owner_at(hex.q, hex.r, territory_nodes) else {\n            continue;\n        };', 'let owner = territory_owner_at(hex.q, hex.r, territory_nodes).unwrap_or(0);', ''),
    ('U06-upkeep-ge-zero', U, 'if upkeep > 0.0 {', 'if upkeep >= 0.0 {', ''),
    ('U07-era-mult-fixed', U, 'terrain_improvement_era_multiplier(Some(era))', 'terrain_improvement_era_multiplier(Some(1.0 + 0.0 * era))', ''),
    ('U08-era-for-key-fixed', U, 'let era = terrain_improvement_era_for_key(Some(key));', 'let era = 1.0 + 0.0 * terrain_improvement_era_for_key(Some(key));', ''),
    ('U09-round-away', U, 'js_round(cost * terrain_improvement_era_multiplier(Some(era))),', '(cost * terrain_improvement_era_multiplier(Some(era))).round(),', 'EKW'),
    ('U10-owner-sum-overwrite', U, '*out.entry(owner).or_insert(0.0) += upkeep;', '*out.entry(owner).or_insert(0.0) = upkeep;', ''),
    ('U11-key-sum-overwrite', U, '            upkeep += js_max(', '            upkeep = js_max(', ''),
    ('U12-q-r-swapped', U, 'territory_owner_at(hex.q, hex.r, territory_nodes)', 'territory_owner_at(hex.r, hex.q, territory_nodes)', ''),
    ('U13-cost-fallback-zero', U, '        difficulty,\n        1.0,\n    )\n}', '        difficulty,\n        0.0,\n    )\n}', ''),
    ('U14-cost-key-typo', U, 'const PRACA_UPKEEP_KEY: &str = "ulepszenie_surowcowe_upkeep_praca";', 'const PRACA_UPKEEP_KEY: &str = "ulepszenie_surowcowe_upkeep_prace";', ''),
    ('U15-budynki-group-wrong', U, 'budynki: raw_group(econ, "budynki"),', 'budynki: raw_group(econ, "globalne"),', ''),
    ('U16-em-group-wrong', U, 'ekonomia_miasta: raw_group(econ, "ekonomia_miasta"),', 'ekonomia_miasta: raw_group(econ, "budynki"),', ''),
    ('U17-globalne-group-wrong', U, 'globalne: raw_group(econ, "globalne"),', 'globalne: raw_group(econ, "budynki"),', ''),
    ('U18-storage-default-raw', U, 'storage: load_storage_params(&raw, d),', 'storage: load_storage_params(&RawEconParamsForUpkeep::default(), d),', ''),
    ('U19-upkeep-default-raw', U, 'upkeep: load_upkeep_params(&raw, d),', 'upkeep: load_upkeep_params(&RawEconParamsForUpkeep::default(), d),', ''),
    ('U20-ration-null', U, 'ration: build_ration_params(econ_params.unwrap_or(&null), game_difficulty),', 'ration: build_ration_params(&null, game_difficulty),', ''),
    ('U21-ration-easy-hard', U, '"easy" => GameDifficulty::Easy,', '"easy" => GameDifficulty::Hard,', ''),
    ('U22-ration-hard-easy', U, '"hard" => GameDifficulty::Hard,', '"hard" => GameDifficulty::Easy,', ''),
    ('U23-unit-table-empty', U, 'unit_upkeep_table: build_unit_upkeep_table(unit_rows),', 'unit_upkeep_table: build_unit_upkeep_table(&[]),', ''),
    ('U24-cell-number-other', U, 'Value::Number(n) => n.as_f64().map_or(UnitCell::Other, UnitCell::Num),', 'Value::Number(_) => UnitCell::Other,', ''),
    ('U25-cell-string-other', U, 'Value::String(s) => UnitCell::Text(s.clone()),', 'Value::String(_) => UnitCell::Other,', ''),
    ('U26-cell-null-other', U, 'Value::Null => UnitCell::Null,', 'Value::Null => UnitCell::Other,', ''),
    ('U27-dup-key-first-wins', U, 'Some(slot) => slot.1 = cell,', 'Some(_) => {}', ''),
    ('U28-dup-key-push', U, 'None => row.push((k, cell)),', 'None => {}', ''),
    ('U29-upkeep-diff-enum-fixed', U, '    crate::domain::turn_economy_advance::difficulty_enum(difficulty)', '    crate::domain::turn_economy_advance::difficulty_enum("normal")', ''),
    # ---- P10/P16 turn_economy_health.rs
    ('H01-fallback-rzeka', H, 'rd("zdrowie_rzeka", 2.0)', 'rd("zdrowie_rzeka", 3.0)', ''),
    ('H02-fallback-akwedukt', H, 'rd("zdrowie_akwedukt", 4.0)', 'rd("zdrowie_akwedukt", 5.0)', ''),
    ('H03-fallback-studnia', H, 'rd("zdrowie_studnia", 2.0)', 'rd("zdrowie_studnia", 3.0)', ''),
    ('H04-fallback-targowisko', H, 'rd("zdrowie_targowisko", 2.0)', 'rd("zdrowie_targowisko", 3.0)', ''),
    ('H05-fallback-laznia', H, 'rd("zdrowie_laznia_publiczna", 5.0)', 'rd("zdrowie_laznia_publiczna", 6.0)', ''),
    ('H06-fallback-ceramika', H, 'rd("zdrowie_ceramika", 1.0)', 'rd("zdrowie_ceramika", 2.0)', ''),
    ('H07-fallback-zagesz', H, 'rd("zdrowie_kara_zagęszczenie", -1.0)', 'rd("zdrowie_kara_zagęszczenie", -2.0)', ''),
    ('H08-fallback-prog', H, 'rd("zdrowie_prog_zagęszczenia", 4.0)', 'rd("zdrowie_prog_zagęszczenia", 5.0)', ''),
    ('H09-fallback-bagno', H, 'rd("zdrowie_kara_bagno", -1.0)', 'rd("zdrowie_kara_bagno", -2.0)', ''),
    ('H10-fallback-las', H, 'rd("zdrowie_bonus_las", 1.0)', 'rd("zdrowie_bonus_las", 2.0)', ''),
    ('H11-fallback-dzungla', H, 'rd("zdrowie_kara_dzungla", -1.0)', 'rd("zdrowie_kara_dzungla", -2.0)', ''),
    ('H12-fallback-brak-wody', H, 'rd("zdrowie_kara_brak_wody", -2.0)', 'rd("zdrowie_kara_brak_wody", -3.0)', ''),
    ('H13-fallback-legacy', H, 'rd("zdrowie_male_miasto_bonus", 1.0)', 'rd("zdrowie_male_miasto_bonus", 2.0)', ''),
    ('H14-legacy-le-lt', H, 'let legacy = if pop <= self.prog_zagoszczenia {', 'let legacy = if pop < self.prog_zagoszczenia {', ''),
    ('H15-osiedle-key-typo', H, '                pick_osiedle_pop_bonus(block, "zdrowie_bonus_osiedle_pop", pop, difficulty, legacy)', '                pick_osiedle_pop_bonus(block, "zdrowie_bonus_osiedle_pop_x", pop, difficulty, legacy)', ''),
    ('H16-filter-finite-removed', H, '            .filter(|v| v.is_finite())\n            .unwrap_or(fallback)', '            .unwrap_or(fallback)', 'EKW'),
    ('H17-zdrowie-is-object-removed', H, '        .filter(|z| z.is_object())\n', '', 'EKW'),
    ('H18-osiedle-block-is-object', H, 'let block = if self.osiedle_block.is_object() {', 'let block = if true {', 'EKW'),
    ('H19-unknown-difficulty-normal', H, '        difficulty: difficulty_of(difficulty),', '        difficulty: Some(difficulty_of(difficulty).unwrap_or(Difficulty::Normal)),', ''),
    ('H20-neighbors-entry', H, '[(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]', '[(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1)]', ''),
    ('H21-river-present-ignored', H, '.is_some_and(|hex| hex.river_present)', '.is_some_and(|hex| !hex.river_present)', ''),
    ('H22-river-center-removed', H, '    if rivers.contains(&(cq, cr)) {\n        return true;\n    }\n', '', ''),
    ('H23-integral-fract', H, 'x.is_finite() && x.fract() == 0.0 &&', 'x.is_finite() && x.fract() != 0.0 &&', ''),
    ('H24-las-eq-ne', H, 'if hex.overlay == Overlay::Las {', 'if hex.overlay != Overlay::Las {', ''),
    ('H25-radius-plus1', H, 'let radius = city_range_for_population(ctx.population);', 'let radius = city_range_for_population(ctx.population + 1.0);', ''),
    ('H26-water-true-false', H, 'let mut ma_rzeke = has_water_access == Some(true);', 'let mut ma_rzeke = has_water_access == Some(false);', ''),
    ('H27-tiles-any-all', H, 'ma_rzeke = tiles_have_river.iter().any(|&r| r);', 'ma_rzeke = tiles_have_river.iter().all(|&r| r);', ''),
    ('H28-rzeka-sign', H, '        z += hp.rzeka;', '        z -= hp.rzeka;', ''),
    ('H29-akwedukt-sign', H, '        z += hp.akwedukt;', '        z -= hp.akwedukt;', ''),
    ('H30-studnia-sign', H, '        z += hp.studnia;', '        z -= hp.studnia;', ''),
    ('H31-targowisko-sign', H, '        z += hp.targowisko;', '        z -= hp.targowisko;', ''),
    ('H32-laznia-sign', H, '        z += hp.laznia_publiczna;', '        z -= hp.laznia_publiczna;', ''),
    ('H33-zagesz-ge', H, 'if ludnosc > hp.prog_zagoszczenia {', 'if ludnosc >= hp.prog_zagoszczenia {', ''),
    ('H34-zagesz-plus1', H, 'z += hp.kara_zagoszczenie * (ludnosc - hp.prog_zagoszczenia);', 'z += hp.kara_zagoszczenie * (ludnosc - hp.prog_zagoszczenia + 1.0);', ''),
    ('H35-brak-wody-or', H, 'if !ma_rzeke && !ma_studnie && !ma_akwedukt {', 'if !ma_rzeke || !ma_studnie && !ma_akwedukt {', ''),
    ('H36-brak-wody-no-studnia', H, 'if !ma_rzeke && !ma_studnie && !ma_akwedukt {', 'if !ma_rzeke && !ma_akwedukt {', ''),
    ('H37-brak-wody-no-akwedukt', H, 'if !ma_rzeke && !ma_studnie && !ma_akwedukt {', 'if !ma_rzeke && !ma_studnie {', ''),
    ('H38-las-sign', H, '            z += hp.bonus_las;', '            z -= hp.bonus_las;', ''),
    ('H39-spichlerz-sign', H, '        z += spichlerz_zdrowie_bonus;', '        z -= spichlerz_zdrowie_bonus;', ''),
    ('H40-garncarnia-sign', H, '        z += garncarnia_surplus_zdrowie;', '        z -= garncarnia_surplus_zdrowie;', ''),
    ('H41-round-away', H, '    js_round(z)\n}', '    z.round()\n}', ''),
    ('H42-truthy-osiedle-removed', H, 'if truthy(osiedle_v) {', 'if true {', 'EKW'),
    ('H43-truthy-spichlerz-removed', H, 'if truthy(spichlerz_zdrowie_bonus) {', 'if true {', 'EKW'),
    ('H44-osiedle-skipped', H, 'if truthy(osiedle_v) {\n        z += osiedle_v;', 'if truthy(osiedle_v) {\n        z += 0.0;', ''),
    ('H45-scan-break-removed', H, '                    has_las = true;\n                    break;', '                    has_las = true;', 'EKW'),
    # ---- wiazanie w turn_economy_advance.rs
    ('W01-nodes-empty', A, 'let territory_nodes = territory_nodes_of(cities);\n    let praca_upkeep_by_owner', 'let territory_nodes = territory_nodes_of(&cities[..0]);\n    let praca_upkeep_by_owner', ''),
    ('W02-praca-difficulty', A, '        terrain.map,\n        &territory_nodes,\n        input.econ_params,\n        input.difficulty,\n    );', '        terrain.map,\n        &territory_nodes,\n        input.econ_params,\n        "normal",\n    );', ''),
    ('W03-praca-econ-none', A, '        terrain.map,\n        &territory_nodes,\n        input.econ_params,\n        input.difficulty,\n    );', '        terrain.map,\n        &territory_nodes,\n        None,\n        input.difficulty,\n    );', ''),
    ('W04-params-units-empty', A, 'load_advance_upkeep_params(input.econ_params, input.difficulty, extra.unit_rows)', 'load_advance_upkeep_params(input.econ_params, input.difficulty, &[])', ''),
    ('W05-params-econ-none', A, 'load_advance_upkeep_params(input.econ_params, input.difficulty, extra.unit_rows)', 'load_advance_upkeep_params(None, input.difficulty, extra.unit_rows)', ''),
    ('W06-health-society-none', A, 'load_health_params(extra.society_params, input.difficulty)', 'load_health_params(None, input.difficulty)', ''),
    ('W07-health-difficulty', A, 'load_health_params(extra.society_params, input.difficulty)', 'load_health_params(extra.society_params, "normal")', ''),
    ('W08-state-ii-swap', A, 'ma_spichlerz_pop: v.ma_spichlerz,\n                ma_spichlerz_ii_pop: v.ma_spichlerz_ii,', 'ma_spichlerz_pop: v.ma_spichlerz_ii,\n                ma_spichlerz_ii_pop: v.ma_spichlerz,', ''),
    ('W09-spichlerz-bonus-zero', A, 'spichlerz_health_bonus(&state),', '0.0 * spichlerz_health_bonus(&state),', ''),
    ('W10-water-false', A, 'let has_water = city_has_water_access_in(c.q, c.r, terrain.map, &rivers);', 'let has_water = false && city_has_water_access_in(c.q, c.r, terrain.map, &rivers);', ''),
    ('W11-water-arg-none', A, '            Some(has_water),\n            Some(&ctx),', '            None,\n            Some(&ctx),', ''),
    ('W12-ctx-none', A, '            Some(has_water),\n            Some(&ctx),', '            Some(has_water),\n            None,', ''),
    ('W13-ctx-population-zero', A, '            population: c.population,\n            map: terrain.map,\n        };\n        let zdrowie', '            population: 0.0,\n            map: terrain.map,\n        };\n        let zdrowie', ''),
    ('W14-ludnosc-zero', A, '        let zdrowie = compute_city_health(\n            c.population,', '        let zdrowie = compute_city_health(\n            0.0,', ''),
    ('W15-built-ids-empty', A, '            &[],\n            &runtime,', '            &[],\n            &[],', ''),
    ('W16-runtime-vs-built', A, '            &[],\n            &runtime,', '            &[],\n            built_ids,', 'EKW'),
    ('W17-state-find-first', A, 'match views.iter().find(|v| v.city_id == c.id) {', 'match views.first() {', ''),
    ('W18-state-ceramika-sol-unused', A, 'ceramika_active: v.spichlerz_ceramika,\n                sol_active: v.spichlerz_sol,', 'ceramika_active: false,\n                sol_active: false,', 'EKW'),
    ('W19-zdrowie-order', A, 'zdrowie_by_city.push((c.id.clone(), zdrowie));', 'zdrowie_by_city.insert(0, (c.id.clone(), zdrowie));', ''),
]


def main():
    lo, hi = int(sys.argv[1]), int(sys.argv[2])
    env = dict(os.environ, CARGO_TARGET_DIR='/dev/shm/p6q3-target', CARGO_INCREMENTAL='0',
               CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')
    for name, path, old, new, tag in M[lo:hi]:
        orig = open(path).read()
        if orig.count(old) != 1:
            print(f'{name}: PATTERN-COUNT={orig.count(old)}', flush=True)
            continue
        try:
            open(path, 'w').write(orig.replace(old, new))
            r = subprocess.run(['cargo', 'test', '-j', '2', '--offline', '--test', 'p6_adv_q3_pipeline'], cwd=REPO + '/rust-port/engine',
                               env=env, capture_output=True, text=True, timeout=500)
            out = r.stdout + r.stderr
            if 'error[' in out or 'could not compile' in out:
                res = 'COMPILE'
            else:
                res = 'SURVIVED' if r.returncode == 0 else 'KILLED'
            open(f'/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/mut-{name}.log', 'w').write(out[-1200:] + f'\nRESULT={res}\n')
            print(f'{name}: {res} {tag}', flush=True)
        finally:
            open(path, 'w').write(orig)


main()
