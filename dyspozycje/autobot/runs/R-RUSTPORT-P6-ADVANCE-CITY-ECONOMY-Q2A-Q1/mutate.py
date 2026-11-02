"""Mutacje modulow turn_economy_territory.rs / turn_economy_advance.rs (python3 -I mutate.py <od> <do>).
Kazda mutacja: dokladnie 1 wystapienie `old` -> `new`, `cargo test --test p6_adv_q2a_pipeline`,
KILLED gdy testy padaja, COMPILE gdy sie nie kompiluje (nie liczone do zabitych), SURVIVED gdy zielono.
Plik zawsze przywracany. EKW = mutant rownowazny (dowod plik:linia w P6-ADVANCE-CITY-ECONOMY-Q2A.md sek. 6).
"""
import os
import subprocess
import sys

REPO = '/home/user/The-Game/.claude/worktrees/wf_9161e2df-7d1-1'
T = REPO + '/rust-port/engine/src/domain/turn_economy_territory.rs'
A = REPO + '/rust-port/engine/src/domain/turn_economy_advance.rs'
RUN = REPO + '/dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q2A-Q1'
M = [
    ('T01-work-city-q-r-swapped', T, '        q: c.q as i32,\n        r: c.r as i32,\n        population: c.population,\n        okolica_reczne: c', '        q: c.r as i32,\n        r: c.q as i32,\n        population: c.population,\n        okolica_reczne: c', ''),
    ('T02-okolica-focus-dropped', T, 'focus: c.okolica_focus,', 'focus: None,', ''),
    ('T03-okolica-tryb-dropped', T, 'tryb: c.okolica_tryb,', 'tryb: None,', ''),
    ('T04-okolica-reczne-dropped', T, 'reczne: c.okolica_reczne.clone(),', 'reczne: None,', ''),
    ('T05-reconcile-filter-inverted', T, '.filter(|(k, _)| !kept.contains_key(*k))', '.filter(|(k, _)| kept.contains_key(*k))', ''),
    ('T06-reconcile-skipped', T, '    reconcile_all_worked_tiles(&mut work, territory_nodes, Some(lost_to_sibling_by_city));\n', '    let _ = (&mut work, territory_nodes, lost_to_sibling_by_city);\n', ''),
    ('T07-reconcile-no-lost', T, 'Some(lost_to_sibling_by_city));\n    for (city, w)', 'None);\n    for (city, w)', ''),
    ('T08-reconcile-no-remove', T, '            reczne.remove(&key);', '            let _ = &key;', ''),
    ('T09-hills-key', T, 'TerrainType::Hills => "wzgorza",', 'TerrainType::Hills => "rownina",', ''),
    ('T10-desert-key', T, 'TerrainType::Desert => "pustynia",', 'TerrainType::Desert => "polarny",', ''),
    ('T11-tundra-key', T, 'TerrainType::Tundra => "polarny",', 'TerrainType::Tundra => "pustynia",', ''),
    ('T12-shallow-key', T, 'TerrainType::ShallowWater => "plytkie_morze",', 'TerrainType::ShallowWater => "morze",', ''),
    ('T13-hexlike-nakladka-none', T, 'nakladka: Some(hex.overlay),', 'nakladka: None,', 'EKW'),
    ('T14-river-dropped', T, 'ma_rzeke: hex.river_present,', 'ma_rzeke: false,', ''),
    ('T15-overlay-dropped', T, 'nakladka: hex.overlay.web_value(),', 'nakladka: "brak",', ''),
    ('T16-ulepszenia-keys-none', T, 'ulepszenia_keys: if keys.is_empty() { None } else { Some(&keys) },', 'ulepszenia_keys: None,', ''),
    ('T17-ulepszenie-key-none', T, 'ulepszenie_key: keys.first().map(String::as_str),', 'ulepszenie_key: None,', 'EKW'),
    ('T18-zloze-none', T, 'zloze: hex.zloze.as_deref(),\n        },\n    )\n}', 'zloze: None,\n        },\n    )\n}', 'EKW'),
    ('T19-hexdist-ds-sign', T, '((-aq - ar) - (-bq - br)).abs()', '((-aq - ar) + (-bq - br)).abs()', ''),
    ('T20-hexdist-max-min', T, 'dq.max(dr).max(ds)', 'dq.max(dr).min(ds)', ''),
    ('T21-amount-overwrite', T, '*slot = Some(slot.unwrap_or(0.0) + amount);', '*slot = Some(amount);', ''),
    ('T22-ruda-slot', T, '"ruda" => &mut rec.ruda,', '"ruda" => &mut rec.ruda_zelaza,', ''),
    ('T23-kon-slot', T, '"kon" => &mut rec.kon,', '"kon" => &mut rec.zloto,', ''),
    ('T24-empty-cities-return-removed', T, '    if cities.is_empty() {\n        return out;\n    }\n', '', 'EKW'),
    ('T25-nearest-tie-last', T, '            if d < best_dist {\n                best_dist = d;\n                best = Some(c.id.as_str());', '            if d <= best_dist {\n                best_dist = d;\n                best = Some(c.id.as_str());', ''),
    ('T26-nearest-owner-filter-off', T, '            if c.owner_id != owner_id {\n                continue;\n            }\n            let d = hex_distance', '            let d = hex_distance', ''),
    ('T27-keys-empty-skip-removed', T, '        if keys.is_empty() {\n            continue;\n        }\n        let (q, r) = (f64::from(hex.q)', '        let (q, r) = (f64::from(hex.q)', 'EKW'),
    ('T28-owner-none-defaults-0', T, 'let Some(owner) = territory_owner_at(q, r, territory_nodes) else {\n            continue;\n        };', 'let owner = territory_owner_at(q, r, territory_nodes).unwrap_or(0);', ''),
    ('T29-era-fixed-1', T, 'Some(resolve_owner_era(owner)),', 'Some(1.0 + 0.0 * resolve_owner_era(owner)),', ''),
    ('T30-centre-not-pushed', T, '    if let Some(h) = map.hex(&key_of(city.q, city.r)) {\n        out.push(h);\n    }', '    if let Some(_h) = map.hex(&key_of(city.q, city.r)) {}', ''),
    ('T31-pop-floor-removed', T, 'let f = city.population.floor();', 'let f = city.population;', 'EKW'),
    ('T32-pop-max0-removed', T, '            f.max(0.0)\n', '            f\n', 'EKW'),
    ('T33-pop-le-lt', T, '    if pop <= 0.0 {\n        return out;', '    if pop < 0.0 {\n        return out;', 'EKW'),
    ('T34-radius-plus1', T, 'let radius = city_range_for_population(pop);', 'let radius = city_range_for_population(pop + 1.0);', ''),
    ('T35-yield-missing-default', T, 'None => OkolicaYield::default(),', 'None => OkolicaYield { zywnosc: 9.0, praca: 9.0, handel: 9.0 },', 'EKW'),
    ('T36-yield-praca-handel', T, 'praca: y.praca,', 'praca: y.handel,', ''),
    ('T37-yield-zywnosc-praca', T, 'zywnosc: y.zywnosc,', 'zywnosc: y.praca,', ''),
    ('T38-opts-owner-none', T, 'owner_id: Some(city.owner_id),', 'owner_id: None,', ''),
    ('T39-opts-territory-none', T, 'territory_nodes: Some(territory_nodes),', 'territory_nodes: None,', ''),
    ('T40-opts-workable-none', T, 'is_workable: Some(&land),', 'is_workable: None,', ''),
    ('T41-opts-exclude-none', T, 'exclude_hex_keys: exclude,', 'exclude_hex_keys: None,', ''),
    ('T42-sum-drewno-kamien', T, 'drewno += y.drewno;', 'drewno += y.kamien;', ''),
    ('T43-sum-kamien-glina', T, 'kamien += y.kamien;', 'kamien += y.glina;', ''),
    ('T44-sum-glina-drewno', T, 'glina += y.glina;', 'glina += y.drewno;', ''),
    ('T45-entry-threshold-and', T, 'if drewno > 0.0 || kamien > 0.0 || glina > 0.0 {', 'if drewno > 0.0 && kamien > 0.0 && glina > 0.0 {', ''),
    ('T46-entry-threshold-ge', T, 'if drewno > 0.0 || kamien > 0.0 || glina > 0.0 {', 'if drewno >= 0.0 || kamien > 0.0 || glina > 0.0 {', ''),
    ('T47-reconcile-call-removed', T, '    reconcile_city_worked_tiles(cities, &territory_nodes, &lost);\n', '', ''),
    ('T48-worked-no-lost', T, 'compute_worked_magazyn_yields_by_city(cities, ctx, &territory_nodes, &lost);', 'compute_worked_magazyn_yields_by_city(cities, ctx, &territory_nodes, &BTreeMap::new());', ''),
    ('T49-nodes-from-empty', T, '    let territory_nodes = territory_nodes_of(cities);\n    let okolica', '    let territory_nodes = territory_nodes_of(&cities[..0]);\n    let okolica', ''),
    ('A01-era-fixed', A, 'let era = |o: i64| owner_era_for(input, o);', 'let era = |_o: i64| 1.0;', ''),
    ('A02-uses-param-terr', A, 'territory_resource_by_city: &inputs.territory_resource_by_city,', 'territory_resource_by_city: input.territory_resource_by_city,', ''),
    ('A03-uses-param-worked', A, 'worked_magazyn_by_city: &inputs.worked_magazyn_by_city,', 'worked_magazyn_by_city: input.worked_magazyn_by_city,', ''),
    ('A04-tech-resolver-dropped', A, 'owner_tech: input.resolvers.owner_tech,\n            owner_zloto_access: input.resolvers.owner_zloto_access,\n            owner_active_labels: input.resolvers.owner_active_labels,\n            owner_empire_stock: input.resolvers.owner_empire_stock,\n        },\n        territory', 'owner_tech: None,\n            owner_zloto_access: input.resolvers.owner_zloto_access,\n            owner_active_labels: input.resolvers.owner_active_labels,\n            owner_empire_stock: input.resolvers.owner_empire_stock,\n        },\n        territory', ''),
    ('A05-era-resolver-dropped', A, 'owner_era: input.resolvers.owner_era,\n            owner_tech', 'owner_era: None,\n            owner_tech', ''),
    ('A06-zloto-resolver-open', A, 'owner_zloto_access: input.resolvers.owner_zloto_access,\n            owner_active_labels', 'owner_zloto_access: &|_| true,\n            owner_active_labels', ''),
    ('A07-labels-dropped', A, 'owner_active_labels: input.resolvers.owner_active_labels,\n            owner_empire_stock', 'owner_active_labels: None,\n            owner_empire_stock', ''),
    ('A08-stock-dropped', A, 'owner_empire_stock: input.resolvers.owner_empire_stock,\n        },\n        territory', 'owner_empire_stock: None,\n        },\n        territory', ''),
    ('A09-econ-dropped', A, 'econ_params: input.econ_params,', 'econ_params: None,', ''),
    ('A10-difficulty-fixed', A, 'difficulty: input.difficulty,\n        player_era', 'difficulty: "normal",\n        player_era', ''),
    ('A11-player-era-fixed', A, 'player_era: input.player_era,\n        player_zbadane', 'player_era: 1.0,\n        player_zbadane', ''),
    ('A12-built-dropped', A, 'built_by_city: input.built_by_city,\n        econ_params', 'built_by_city: &BTreeMap::new(),\n        econ_params', ''),
    ('T50-lost-output-empty', T, 'lost_to_sibling_by_city: lost,', 'lost_to_sibling_by_city: BTreeMap::new(),', ''),
    ('T51-sol-slot', T, '"sol" => &mut rec.sol,', '"sol" => &mut rec.zloto,', ''),
    ('T52-hexdist-dq-sum', T, 'let dq = (aq - bq).abs();', 'let dq = (aq + bq).abs();', ''),
    ('T53-work-city-owner', T, '        owner_id: c.owner_id,\n        q: c.q as i32,\n        r: c.r as i32,\n        population: c.population,\n        okolica_reczne: c', '        owner_id: 0,\n        q: c.q as i32,\n        r: c.r as i32,\n        population: c.population,\n        okolica_reczne: c', ''),
]


def main():
    lo, hi = int(sys.argv[1]), int(sys.argv[2])
    env = dict(os.environ, CARGO_TARGET_DIR='/dev/shm/q2a_mut', CARGO_INCREMENTAL='0',
               CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')
    for name, path, old, new, tag in M[lo:hi]:
        orig = open(path).read()
        if orig.count(old) != 1:
            print(f'{name}: PATTERN-COUNT={orig.count(old)}', flush=True)
            continue
        try:
            open(path, 'w').write(orig.replace(old, new))
            r = subprocess.run(['cargo', 'test', '-j', '2', '--test', 'p6_adv_q2a_pipeline'], cwd=REPO + '/rust-port/engine',
                               env=env, capture_output=True, text=True, timeout=500)
            out = r.stdout + r.stderr
            if 'error[' in out or 'could not compile' in out:
                res = 'COMPILE'
            else:
                res = 'SURVIVED' if r.returncode == 0 else 'KILLED'
            open(f'{RUN}/mut-{name}.log', 'w').write(out[-1500:] + f'\nRESULT={res}\n')
            print(f'{name}: {res} {tag}', flush=True)
        finally:
            open(path, 'w').write(orig)


main()
