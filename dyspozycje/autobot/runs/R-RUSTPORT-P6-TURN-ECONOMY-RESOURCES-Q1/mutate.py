"""Mutacje modulu turn_economy_resources.rs (python3 -I mutate.py <od> <do>).
Kazda mutacja: dokladnie 1 wystapienie `old` -> `new`, `cargo test --test p6_turn_econ_res_pipeline`,
KILLED gdy testy padaja (lub kompilacja sie nie udaje - raportowane osobno jako COMPILE), SURVIVED gdy zielono.
Plik zawsze przywracany. Zmienne: REPO (worktree), CARGO_TARGET_DIR=/dev/shm/p6ter_mut.
EKW = mutant rownowazny (dowod w P6-TURN-ECONOMY-RESOURCES.md) - oczekiwany SURVIVED.
"""
import os
import subprocess
import sys

REPO = '/home/user/The-Game/.claude/worktrees/wf_a3087678-639-1'
SRC = REPO + '/rust-port/engine/src/domain/turn_economy_resources.rs'
RUN = REPO + '/dyspozycje/autobot/runs/R-RUSTPORT-P6-TURN-ECONOMY-RESOURCES-Q1'
M = [
    ('M01-drewno-credit-gt1', 'if drewno_credit > 0.0 {', 'if drewno_credit > 1.0 {', ''),
    ('M02-floor-to-round', '(raw * mult).floor(), Some(cap));', '(raw * mult).round(), Some(cap));', ''),
    ('M03-raw-guard-lt0', 'if raw.is_nan() || raw <= 0.0 {', 'if raw < 0.0 {', 'EKW'),
    ('M04-kamien-mult-minus', '        let kamien_mult = 1.0\n            + input', '        let kamien_mult = 1.0\n            - input', ''),
    ('M05-glina-removed', '        credit_territory(cities, "glina", Some(glina_base), 1.0);\n', '', ''),
    ('M06-sol-reads-zloto', 'credit_territory(cities, "sol", t.sol, 1.0);', 'credit_territory(cities, "sol", t.zloto, 1.0);', ''),
    ('M07-kon-removed', '        credit_territory(cities, "kon", t.kon, 1.0);\n', '', ''),
    ('M08-pool-override-none', '                Some(&pool),\n            );\n            let active', '                None,\n            );\n            let active', ''),
    ('M09-cap-plus1', 'pool = run_converters(&active, &pool, &owner_throughputs, &|_| cap);', 'pool = run_converters(&active, &pool, &owner_throughputs, &|_| cap + 1.0);', ''),
    ('M10-assign-removed', '        assign_owner_resource_stock_from_pool(cities, owner_id, &pool);\n', '', ''),
    ('M11-drain-dry-run', '            built_ids,\n            false,\n            &input.spichlerz_drain_params,', '            built_ids,\n            true,\n            &input.spichlerz_drain_params,', ''),
    ('M12-sol-map-uses-ceramika', 'if state.sol_active {', 'if state.ceramika_active {', ''),
    ('M13-cegielnia-glina-1', 'inputs: &[("glina", 2.0), ("drewno", 1.0)],', 'inputs: &[("glina", 1.0), ("drewno", 1.0)],', ''),
    ('M14-limit-in-round', '(have(stores, k) / per_cykl).floor()', '(have(stores, k) / per_cykl).round()', ''),
    ('M15-per-cykl-lt0', 'if *per_cykl <= 0.0 {', 'if *per_cykl < 0.0 {', 'EKW'),
    ('M16-wolne-no-max', 'let wolne = js_max(0.0, output_capacity - have(stores, recipe.output));', 'let wolne = output_capacity - have(stores, recipe.output);', ''),
    ('M17-tput-ge0', 'let tput = if throughput.is_finite() && throughput > 0.0 {', 'let tput = if throughput.is_finite() && throughput >= 0.0 {', 'EKW'),
    ('M18-era-no-garncarnia', ' && recipe_id != "garncarnia"', '', ''),
    ('M19-era-pct-011', 'CONVERTER_ERA_SCALING_PCT: f64 = 0.10;', 'CONVERTER_ERA_SCALING_PCT: f64 = 0.11;', ''),
    ('M20-era-ge1', 'if era.is_finite() && era > 1.0 { era }', 'if era.is_finite() && era >= 1.0 { era }', 'EKW'),
    ('M21-stol-no-floor', 'js_max(0.0, stolarnia_count.floor())', 'js_max(0.0, stolarnia_count)', ''),
    ('M22-inflow-base-lt0', 'if !base_drewno.is_finite() || base_drewno <= 0.0 {', 'if !base_drewno.is_finite() || base_drewno < 0.0 {', ''),
    ('M23-happiness-ge0', 'ceramika_po_drain.is_finite() && ceramika_po_drain > 0.0', 'ceramika_po_drain.is_finite() && ceramika_po_drain >= 0.0', 'EKW'),
    ('M24-garn-no-floor', 'js_max(0.0, ceramika_after.floor())', 'js_max(0.0, ceramika_after)', ''),
    ('M25-sim-strict', 'if has_spichlerz && ceramika >= amount {', 'if has_spichlerz && ceramika > amount {', ''),
    ('M26-drained-inverted', 'let ceramika_after = if stock_already_drained {', 'let ceramika_after = if !stock_already_drained {', ''),
    ('M27-sim-amount-i', 'let amount = spichlerz_ceramika_drain_amount(built_ids, drain_params);', 'let amount = drain_params.ceramika_i;', ''),
    ('M28-phase-no-override', '    input.spichlerz_drain_params = drain_params;\n', '', ''),
    ('M29-garn-drained-false', '        input.built_by_city,\n        true,', '        input.built_by_city,\n        false,', ''),
    ('M30-reason-swap', '} else if limit_wejscia == 0.0 {\n            ConverterReason::BrakWejscia\n        } else if limit_wyjscia == 0.0 {', '} else if limit_wyjscia == 0.0 {\n            ConverterReason::BrakWejscia\n        } else if limit_wejscia == 0.0 {', ''),
    ('M31-have-no-finite', 'Some(v) if v.is_finite() => *v,', 'Some(v) => *v,', ''),
    ('M32-fallback-zero', '.unwrap_or(recipe.throughput_fallback);', '.unwrap_or(0.0);', ''),
    ('M33-owner-dup', 'if !owner_ids.contains(&c.owner_id()) {', 'if true {', ''),
    ('M34-worked-drewno-dropped', 'unwrap_or(0.0) + worked.drewno;', 'unwrap_or(0.0);', ''),
    ('M35-zloto-access-none', 'resolve_owner_zloto_access: resolvers.owner_zloto_access,', 'resolve_owner_zloto_access: None,', 'EKW'),
    ('M36-owner-id-none', 'owner_id: Some(owner_id),\n        resolve_owner_zloto_access', 'owner_id: None,\n        resolve_owner_zloto_access', 'EKW'),
    ('M37-labels-ignored', 'let Some(labels) = resolvers.owner_active_labels else {\n        return built_ids.to_vec();\n    };', 'let _ = resolvers.owner_active_labels;\n    return built_ids.to_vec();\n    #[allow(unreachable_code)]\n    let labels = |_o: i64| Vec::<String>::new();', 'EKW'),
    ('M38-consumed-skip-output', 'have(stores, recipe.output) + recipe.output_amount * cykle,', 'have(stores, recipe.output),', ''),
    ('M39-credit-cap-none', 'credit_owner_resource_stock(cities, owner_id, "drewno", drewno_credit, Some(cap));', 'credit_owner_resource_stock(cities, owner_id, "drewno", drewno_credit, None);', ''),
    ('M40-garn-owner-any-city', '            c.owner_id() == owner_id\n                && built_by_city', '            built_by_city', ''),
]


def main():
    lo, hi = int(sys.argv[1]), int(sys.argv[2])
    orig = open(SRC).read()
    env = dict(os.environ, CARGO_TARGET_DIR='/dev/shm/p6ter_mut', CARGO_INCREMENTAL='0',
               CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')
    try:
        for name, old, new, tag in M[lo:hi]:
            if orig.count(old) != 1:
                print(f'{name}: PATTERN-COUNT={orig.count(old)}', flush=True)
                continue
            open(SRC, 'w').write(orig.replace(old, new))
            r = subprocess.run(['cargo', 'test', '-j', '2', '--test', 'p6_turn_econ_res_pipeline'], cwd=REPO + '/rust-port/engine',
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
