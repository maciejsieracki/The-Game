"""Mutacje modulu turn_economy_advance.rs (python3 -I mutate.py <od> <do>).
Kazda mutacja: dokladnie 1 wystapienie `old` -> `new`, `cargo test --test p6_adv_city_econ_pipeline`,
KILLED gdy testy padaja, COMPILE gdy sie nie kompiluje (nie liczone do zabitych), SURVIVED gdy zielono.
Plik zawsze przywracany. EKW = mutant rownowazny (dowod w P6-ADVANCE-CITY-ECONOMY.md sek. 7).
"""
import os
import subprocess
import sys

REPO = '/home/user/The-Game/.claude/worktrees/wf_5dee3e19-131-1'
SRC = REPO + '/rust-port/engine/src/domain/turn_economy_advance.rs'
RUN = REPO + '/dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q1'
M = [
    ('M01-mennica-id', '.any(|x| x == "mennica"))', '.any(|x| x == "mennice"))', ''),
    ('M02-mennica-default-true', '.map(|b| b.iter().any(|x| x == "mennica"))\n            .unwrap_or(false);', '.map(|b| b.iter().any(|x| x == "mennica"))\n            .unwrap_or(true);', ''),
    ('M03-era-owner0', 'None if owner_id == 0 => input.player_era,', 'None if owner_id == 1 => input.player_era,', ''),
    ('M04-era-default', '        None => 1.0,\n    }\n}', '        None => 2.0,\n    }\n}', ''),
    ('M05-raw-row-plus1', 'Some(n) => RawCell::Num(n),', 'Some(n) => RawCell::Num(n + 1.0),', ''),
    ('M06-diff-easy', '"easy" => Difficulty::Easy,', '"easy" => Difficulty::Hard,', ''),
    ('M07-diff-hard', '"hard" => Difficulty::Hard,', '"hard" => Difficulty::Easy,', ''),
    ('M08-cap-mag-default', '            .copied()\n            .unwrap_or(0.0),\n        &params,', '            .copied()\n            .unwrap_or(1.0),\n        &params,', ''),
    ('M09-waluta-lower-dropped', 'tech.contains("Waluta") || tech.contains("waluta")', 'tech.contains("Waluta")', ''),
    ('M10-zloto-access-ignored', 'if !(input.resolvers.owner_zloto_access)(owner_id) {', 'if false {', ''),
    ('M11-drain-threshold-le', 'if empire_zloto_stock(Some(&pool)) < MENNICA_ZLOTO_DRAIN_PER_TURN {', 'if empire_zloto_stock(Some(&pool)) <= MENNICA_ZLOTO_DRAIN_PER_TURN {', ''),
    ('M12-drain-no-assign', '        assign_owner_resource_stock_from_pool(cities, owner_id, &deduct_mennica_zloto_drain(&pool));\n', '        let _ = deduct_mennica_zloto_drain(&pool);\n', ''),
    ('M13-tech-fallback-empty', 'None => input.player_zbadane.clone(),', 'None => BTreeSet::new(),', ''),
    ('M14-writeback-removed', '        c.surowce = h.surowce;\n', '        let _ = h;\n', ''),
    ('M15-reconcile-removed', '    reconcile_city_resource_caps(cities, input, &magazyn);\n', '', ''),
    ('M16-drain-removed', '    apply_mennica_zloto_drain_for_owners(cities, &mennica_owners, input);\n', '', ''),
    ('M17-stol-bonus-fallback', '"budynek_stolarnia_bonus_drewna_civ",\n        input.difficulty,\n        0.10,', '"budynek_stolarnia_bonus_drewna_civ",\n        input.difficulty,\n        0.11,', ''),
    ('M18-kam-bonus-fallback', '        input.difficulty,\n        0.10,\n    );\n\n    let zloto', '        input.difficulty,\n        0.20,\n    );\n\n    let zloto', ''),
    ('M19-stol-count-raw', 'if runtime.iter().any(|x| x == "stolarnia") {', 'if b_ids.iter().any(|x| x == "stolarnia") {', ''),
    ('M20-kam-count-raw', 'if runtime.iter().any(|x| x == "kamieniarski") {', 'if b_ids.iter().any(|x| x == "kamieniarski") {', ''),
    ('M21-mag-count-runtime', 'if b_ids.iter().any(|x| x == "magazyn") {', 'if runtime.iter().any(|x| x == "magazyn") {', ''),
    ('M22-count-no-stock-override', 'let runtime = runtime_active_built_ids_for_city(\n            b_ids,\n            c.owner_id,\n            &tick_resolvers(),\n            stock_override.as_ref(),', 'let runtime = runtime_active_built_ids_for_city(\n            b_ids,\n            c.owner_id,\n            &tick_resolvers(),\n            None,', ''),
    ('M23-garn-gate-open', 'let garn = if runtime.iter().any(|x| x == "garncarnia") {', 'let garn = if true {', ''),
    ('M24-ma-spichlerz-ii', 'ma_spichlerz: state.ma_spichlerz_pop,', 'ma_spichlerz: state.ma_spichlerz_ii_pop,', ''),
    ('M25-sol-uses-ceramika', 'spichlerz_sol: state.sol_active,', 'spichlerz_sol: state.ceramika_active,', ''),
    ('M26-garn-unwrap-default', '                .unwrap_or(0.0)\n        } else {\n            0.0\n        };', '                .unwrap_or(1.0)\n        } else {\n            0.0\n        };', 'EKW'),
    ('M27-thr-era-fixed', 'converter_throughputs_for_era(raw, input.difficulty, owner_era_for(input, o));', 'converter_throughputs_for_era(raw, input.difficulty, 1.0 + 0.0 * owner_era_for(input, o));', ''),
    ('M28-cap-closure-no-mag', 'let cap = |o: i64| owner_resource_cap_for(input, &magazyn, o);', 'let cap = |o: i64| owner_resource_cap_for(input, &BTreeMap::new(), o);', ''),
    ('M29-storage-reads-budynki', '.and_then(|e| e.get("globalne"))', '.and_then(|e| e.get("budynki"))', ''),
    ('M30-cap-era-one', '    let era = owner_era_for(input, owner_id);\n    owner_resource_capacity_per_type(', '    let era = 1.0 + 0.0 * owner_era_for(input, owner_id);\n    owner_resource_capacity_per_type(', ''),
    ('M31-stol-count-swapped', 'stolarnia_count_by_owner: &stolarnia,', 'stolarnia_count_by_owner: &kamieniarski,', ''),
    ('M32-kam-count-swapped', 'kamieniarski_count_by_owner: &kamieniarski,', 'kamieniarski_count_by_owner: &stolarnia,', ''),
    ('M33-bonus-swapped', '        stolarnia_bonus_drewna_civ: stolarnia_bonus,\n        kamieniarski_bonus_kamienia_civ: kamieniarski_bonus,\n        converter_throughputs_for_owner', '        stolarnia_bonus_drewna_civ: kamieniarski_bonus,\n        kamieniarski_bonus_kamienia_civ: stolarnia_bonus,\n        converter_throughputs_for_owner', ''),
    ('M34-stol-increment-2', '*stolarnia.entry(c.owner_id).or_insert(0.0) += 1.0;', '*stolarnia.entry(c.owner_id).or_insert(0.0) += 2.0;', ''),
    ('M35-mennica-owner-shift', 'owners.insert(c.owner_id);', 'owners.insert(c.owner_id + 1);', ''),
    ('M36-drain-not-deducted', '&deduct_mennica_zloto_drain(&pool));', '&pool);', ''),
    ('M37-raw-row-other-num0', 'None => RawCell::Other,', 'None => RawCell::Num(0.0),', ''),
    ('M38-zloto-resolver-none', 'owner_zloto_access: Some(zloto),', 'owner_zloto_access: None,', ''),
    ('M39-labels-dropped', 'owner_active_labels: input.resolvers.owner_active_labels,', 'owner_active_labels: None,', ''),
    ('M40-kam-increment-2', '*kamieniarski.entry(c.owner_id).or_insert(0.0) += 1.0;', '*kamieniarski.entry(c.owner_id).or_insert(0.0) += 2.0;', ''),
]


def main():
    lo, hi = int(sys.argv[1]), int(sys.argv[2])
    orig = open(SRC).read()
    env = dict(os.environ, CARGO_TARGET_DIR='/dev/shm/p6ace_mut', CARGO_INCREMENTAL='0',
               CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')
    try:
        for name, old, new, tag in M[lo:hi]:
            if orig.count(old) != 1:
                print(f'{name}: PATTERN-COUNT={orig.count(old)}', flush=True)
                continue
            open(SRC, 'w').write(orig.replace(old, new))
            r = subprocess.run(['cargo', 'test', '-j', '2', '--test', 'p6_adv_city_econ_pipeline'], cwd=REPO + '/rust-port/engine',
                               env=env, capture_output=True, text=True, timeout=500)
            out = r.stdout + r.stderr
            if 'error[' in out or 'could not compile' in out:
                res = 'COMPILE'
            else:
                res = 'SURVIVED' if r.returncode == 0 else 'KILLED'
            open(f'{RUN}/mut-{name}.log', 'w').write(out[-1500:] + f'\nRESULT={res}\n')
            print(f'{name}: {res} {tag}', flush=True)
    finally:
        open(SRC, 'w').write(orig)


main()
