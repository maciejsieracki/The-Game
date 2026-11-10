"""Mutanty REPIN-EKONOMIA-E. Uzycie (z korzenia repo, drzewo czyste): python3 -I mutate-e.py <REPO_ROOT> [prefiks-id ...]
Dla kazdego mutanta: podmienia dokladnie 1 wystapienie `old` -> `new` w pliku Rust, uruchamia 2 nowe testy
(`p6_repin_ekonomia_e_citizen`, `p6_repin_ekonomia_e_spichlerz`), przywraca plik, zapisuje `mut-<id>.log` w katalogu
runu (OLD/NEW, lista FAILED, VERDICT=KILLED|SURVIVED|COMPILE-ERROR, jedna linia EXIT=).
Srodowisko: CARGO_TARGET_DIR=/dev/shm/e-spich-target, -j 2, CARGO_INCREMENTAL=0, DEBUG=0."""
import os
import re
import subprocess
import sys

ROOT = sys.argv[1]
ENG = ROOT + '/rust-port/engine'
RUN = ROOT + '/dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-E-SPICHLERZ-STAWKA-Q1'
RP = 'src/domain/resource_production.rs'
BC = 'src/domain/building_costs.rs'
M = [
('E-M01-rate-no-isfinite', RP, 'Some(v) if v.is_finite() && v >= 0.0 => v,', 'Some(v) if v >= 0.0 => v,'),
('E-M02-rate-zero-invalid', RP, 'Some(v) if v.is_finite() && v >= 0.0 => v,', 'Some(v) if v.is_finite() && v > 0.0 => v,'),
('E-M03-rate-negative-ok', RP, 'Some(v) if v.is_finite() && v >= 0.0 => v,', 'Some(v) if v.is_finite() => v,'),
('E-M04-fallback-const-2', RP, 'pub const CITIZEN_UPKEEP_RATE_PER_CITIZEN: f64 = 1.0;', 'pub const CITIZEN_UPKEEP_RATE_PER_CITIZEN: f64 = 2.0;'),
('E-M05-row-exact-last', RP, 'rows.iter().find(|row| row.epoka == wanted)', 'rows.iter().rev().find(|row| row.epoka == wanted)'),
('E-M06-row-below-last-dup', RP, 'Some(current) if row.epoka <= current.epoka => Some(current),', 'Some(current) if row.epoka < current.epoka => Some(current),'),
('E-M07-row-below-min', RP, 'Some(current) if row.epoka <= current.epoka => Some(current),', 'Some(current) if row.epoka >= current.epoka => Some(current),'),
('E-M08-wanted-no-max1', RP, 'era.floor().max(1.0) as i64', 'era.floor() as i64'),
('E-M09-nonfinite-era-2', RP, '''    } else {
        1
    };
    if let Some(exact)''', '''    } else {
        2
    };
    if let Some(exact)'''),
('E-M10-below-fallback-last', RP, 'Some(best.unwrap_or(first))', 'Some(best.unwrap_or(rows.last().unwrap()))'),
('E-M11-drain-ignores-era-rate', RP, '''    let rate = citizen_upkeep_rate_for_era(table, era);
    let need = (pop * rate).floor();
    let mut available = Vec::new();
    let mut missing = Vec::new();
    let mut deductions''', '''    let rate = CITIZEN_UPKEEP_RATE_PER_CITIZEN;
    let need = (pop * rate).floor();
    let mut available = Vec::new();
    let mut missing = Vec::new();
    let mut deductions'''),
('E-M12-cov-haspop-any', RP, 'population.is_some_and(f64::is_finite)', 'population.is_some()'),
('E-M13-cov-pop-no-positive-guard', RP, 'Some(p) if has_pop && p > 0.0 => p.floor(),', 'Some(p) if has_pop => p.floor(),'),
('E-M14-cov-gate-strict', RP, 'if has_pop { have >= need } else { have > 0.0 }', 'if has_pop { have > need } else { have > 0.0 }'),
('E-M15-cov-gate-legacy-ge', RP, 'if has_pop { have >= need } else { have > 0.0 }', 'if has_pop { have >= need } else { have >= 0.0 }'),
('E-M16-cov-always-pop-gate', RP, 'if has_pop { have >= need } else { have > 0.0 }', 'have >= need'),
('E-M17-cov-need-no-floor', RP, '''    let need = (pop * rate).floor();
    let mut available = Vec::new();
    let mut missing = Vec::new();
    for key in required {
        let have = positive_stock(empire_stock, key);''', '''    let need = pop * rate;
    let mut available = Vec::new();
    let mut missing = Vec::new();
    for key in required {
        let have = positive_stock(empire_stock, key);'''),
('E-M18-cov-rate-none', RP, '''        required: required.to_vec(),
        rate_per_citizen: Some(rate),
        available,
        missing,
        happiness_delta,
        growth_pct_delta,
    }
}

/// Realny drenaz''', '''        required: required.to_vec(),
        rate_per_citizen: None,
        available,
        missing,
        happiness_delta,
        growth_pct_delta,
    }
}

/// Realny drenaz'''),
('E-M19-display-ignores-cov-rate', RP, '''    let rate = coverage
        .rate_per_citizen
        .unwrap_or(CITIZEN_UPKEEP_RATE_PER_CITIZEN);''', '''    let rate = CITIZEN_UPKEEP_RATE_PER_CITIZEN;'''),
('E-M20-display-fallback-zero', RP, '''        .unwrap_or(CITIZEN_UPKEEP_RATE_PER_CITIZEN);
    let qty''', '''        .unwrap_or(0.0);
    let qty'''),
('E-M21-drain-rate-none', RP, '''            required: required.to_vec(),
            rate_per_citizen: Some(rate),
            available,''', '''            required: required.to_vec(),
            rate_per_citizen: None,
            available,'''),
('E-M22-drain-no-floor', RP, '''    let need = (pop * rate).floor();
    let mut available = Vec::new();
    let mut missing = Vec::new();
    let mut deductions''', '''    let need = pop * rate;
    let mut available = Vec::new();
    let mut missing = Vec::new();
    let mut deductions'''),
('E-M23-cov-pop-no-floor', RP, 'Some(p) if has_pop && p > 0.0 => p.floor(),', 'Some(p) if has_pop && p > 0.0 => p,'),
('E-M24-cov-rate-fixed', RP, '''    let required = citizen_required_resources_for_era(table, era);
    let rate = citizen_upkeep_rate_for_era(table, era);
    let has_pop''', '''    let required = citizen_required_resources_for_era(table, era);
    let rate = CITIZEN_UPKEEP_RATE_PER_CITIZEN;
    let has_pop'''),
('E-M25-required-ignores-row', RP, '''    citizen_upkeep_row_for_era(table, era)
        .map(|row| row.surowce.as_slice())
        .unwrap_or(&[])''', '''    table
        .epoki
        .first()
        .map(|row| row.surowce.as_slice())
        .unwrap_or(&[])'''),
('S-M01-amount-swap', BC, '''        if built_ids.contains(building_ii) {
            params.ceramika_ii
        } else {
            params.ceramika_i
        }''', '''        if built_ids.contains(building_ii) {
            params.ceramika_i
        } else {
            params.ceramika_ii
        }'''),
('S-M02-amount-always-i', BC, '''        if built_ids.contains(building_ii) {
            params.ceramika_ii
        } else {''', '''        if false && built_ids.contains(building_ii) {
            params.ceramika_ii
        } else {'''),
('S-M03-pay-sol-gate-uses-cer-ii', BC, '''>= drain_params.sol_ii
        {
            if !dry_run {
                let cost = StockRecord::from([(params.klucz_sol.clone(), drain_params.sol_ii)]);''', '''>= drain_params.ceramika_ii
        {
            if !dry_run {
                let cost = StockRecord::from([(params.klucz_sol.clone(), drain_params.sol_ii)]);'''),
('S-M04-pay-deduct-sol-wrong', BC, 'let cost = StockRecord::from([(params.klucz_sol.clone(), drain_params.sol_ii)]);', 'let cost = StockRecord::from([(params.klucz_sol.clone(), drain_params.ceramika_i)]);'),
('S-M05-pay-deduct-cer-wrong', BC, 'StockRecord::from([(params.klucz_ceramika.clone(), ceramika_amount)]);', 'StockRecord::from([(params.klucz_ceramika.clone(), drain_params.ceramika_i)]);'),
('S-M06-pay-cer-gate-strict', BC, 'if owner_resource_stock(cities, owner_id, &params.klucz_ceramika) >= ceramika_amount {', 'if owner_resource_stock(cities, owner_id, &params.klucz_ceramika) > ceramika_amount {'),
('S-M07-load-zero-invalid', BC, '''            if v >= 0.0 {
                v
            } else {''', '''            if v > 0.0 {
                v
            } else {'''),
('S-M08-load-negative-ok', BC, '''            if v >= 0.0 {
                v
            } else {
                SPICHLERZ_DRAIN_FALLBACK_PER_TURN
            }''', '''            if true {
                v
            } else {
                SPICHLERZ_DRAIN_FALLBACK_PER_TURN
            }'''),
('S-M09-load-none-zero', BC, '''            let Some(raw) = raw else {
                return SPICHLERZ_DRAIN_FALLBACK_PER_TURN;
            };''', '''            let Some(raw) = raw else {
                return 0.0;
            };'''),
('S-M10-throughput-ignores-difficulty', BC, '.and_then(|row| row.get(difficulty))', '.and_then(|row| row.get("normal"))'),
('S-M11-dry-run-always-i', BC, '''        let ceramika_amount = spichlerz_ceramika_drain_amount(built_ids, drain_params);
        SpichlerzDrainPayResult {''', '''        let ceramika_amount = drain_params.ceramika_i;
        SpichlerzDrainPayResult {'''),
('S-M12-inactive-fallback-params', BC, '''                &opts.drain_params,
            );''', '''                &SpichlerzDrainParams::FALLBACK,
            );'''),
('S-M13-key-sol-eq-cer-ii', BC, 'pub const SPICHLERZ_DRAIN_JSON_KEY_SOL_II: &str = "budynek_spichlerz_ii_zuzywa_sol";', 'pub const SPICHLERZ_DRAIN_JSON_KEY_SOL_II: &str = "budynek_spichlerz_ii_zuzywa_ceramika";'),
('S-M14-fallback-24', BC, 'pub const SPICHLERZ_DRAIN_FALLBACK_PER_TURN: f64 = 25.0;', 'pub const SPICHLERZ_DRAIN_FALLBACK_PER_TURN: f64 = 24.0;'),
('S-M15-load-ii-reads-i-key', BC, 'ceramika_ii: read(SPICHLERZ_DRAIN_JSON_KEY_CERAMIKA_II),', 'ceramika_ii: read(SPICHLERZ_DRAIN_JSON_KEY_CERAMIKA_I),'),
('S-M16-throughput-row-not-object-ok', BC, '''            .and_then(|group| group.get(param_key))
            .and_then(serde_json::Value::as_object)
            .and_then(|row| row.get(difficulty))''', '''            .and_then(|group| group.get(param_key))
            .and_then(|row| row.get(difficulty))'''),
('S-M17-pay-dry-run-mutates', BC, '''            if !dry_run {
                let cost = StockRecord::from([(params.klucz_ceramika.clone(), ceramika_amount)]);''', '''            if true {
                let cost = StockRecord::from([(params.klucz_ceramika.clone(), ceramika_amount)]);'''),
('S-M18-pay-sol-no-hasii', BC, '''        if has_ii
            && owner_resource_stock(cities, owner_id, &params.klucz_sol) >= drain_params.sol_ii
        {
            if !dry_run {''', '''        if owner_resource_stock(cities, owner_id, &params.klucz_sol) >= drain_params.sol_ii
        {
            if !dry_run {'''),
('S-M19-throughput-nonfinite-accept', BC, '''            .and_then(serde_json::Value::as_f64)
            .filter(|v| v.is_finite())
            .unwrap_or(fallback)''', '''            .and_then(serde_json::Value::as_f64)
            .unwrap_or(fallback)'''),
]
sel = sys.argv[2:]
tests = ['--test', 'p6_repin_ekonomia_e_citizen', '--test', 'p6_repin_ekonomia_e_spichlerz']
env = dict(os.environ, CARGO_TARGET_DIR='/dev/shm/e-spich-target', CARGO_INCREMENTAL='0',
           CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')
for mid, f, old, new in M:
    if sel and not any(mid.startswith(x) for x in sel):
        continue
    path = ENG + '/' + f
    orig = open(path).read()
    if orig.count(old) != 1:
        print(mid, 'SKIP-NOMATCH', orig.count(old))
        continue
    open(path, 'w').write(orig.replace(old, new))
    try:
        r = subprocess.run(['cargo', 'test', '-j', '2'] + tests, cwd=ENG, env=env,
                           capture_output=True, text=True, timeout=500)
        out = r.stdout + r.stderr
        code = r.returncode
    finally:
        open(path, 'w').write(orig)
    failed = [l for l in out.splitlines() if re.match(r'test .* FAILED', l)]
    comp = 'error[' in out or 'could not compile' in out
    verdict = 'KILLED' if code != 0 and not comp else ('COMPILE-ERROR' if comp else 'SURVIVED')
    with open(RUN + '/mut-' + mid + '.log', 'w') as fh:
        fh.write('MUTANT %s file=%s\nOLD:\n%s\nNEW:\n%s\n\nFAILED TESTS:\n%s\nVERDICT=%s\nEXIT=%s\n' % (mid, f, old, new, '\n'.join(failed), verdict, code))
    print(mid, verdict, len(failed), flush=True)
