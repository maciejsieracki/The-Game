import os, subprocess, sys

# Mutacje galezi sterujacych (REPIN-WOJNA-NOWE-C r1). Uruchomienie: python3 mutate-c.py <ID>... (puste = wszystkie).
# Kazda mutacja: podmiana dokladnie jednego wystapienia, testy dwoch plikow testowych, przywrocenie pliku.
RUN = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(RUN, '..', '..', '..', '..'))
ENG = os.path.join(ROOT, 'rust-port', 'engine')
ENV = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_TARGET_DIR='/home/user/cargo-target-shared/wf_2fae1a05-0e5-1', CARGO_PROFILE_DEV_DEBUG='0')

MR = f'{ENG}/src/domain/ai_move_range.rs'
DB = f'{ENG}/src/domain/diplomacy_tick_war_brake.rs'

MUTS = {
 'R01-truncate-inf-not-stop': (MR, 'if c == f64::INFINITY {', 'if false {'),
 'R02-truncate-budget-ge': (MR, 'if spent + c > budget {', 'if spent + c >= budget {'),
 'R03-minmove-budget-gt1': (MR, 'if budget >= 1.0 && c != f64::INFINITY {', 'if budget > 1.0 && c != f64::INFINITY {'),
 'R04-minmove-no-inf-check': (MR, 'if budget >= 1.0 && c != f64::INFINITY {', 'if budget >= 1.0 {'),
 'R05-truncate-no-spend': (MR, 'spent += c;', 'spent += 0.0;'),
 'R06-truncate-missing-continue': (MR, 'let Some(&c) = hex_costs.get(&h) else {\n            break;', 'let Some(&c) = hex_costs.get(&h) else {\n            continue;'),
 'R07-farthest-len-lt1': (MR, 'if budget.is_nan() || budget <= 0.0 || path.len() < 2 {', 'if budget.is_nan() || budget <= 0.0 || path.len() < 1 {'),
 'R08-farthest-blocked-inverted': (MR, 'Some(set) if set.contains(&cut[end - 1]) => end -= 1,', 'Some(set) if !set.contains(&cut[end - 1]) => end -= 1,'),
 'R09-farthest-returns-first': (MR, 'Some(cut[end - 1])', 'Some(cut[0])'),
 'R10-occupancy-no-accumulate': (MR, '*occ.entry(k).or_insert(0) += 1;', 'occ.insert(k, 1);'),
 'R11-claim-occupied-gt1': (MR, 'if occ.get(to).copied().unwrap_or(0) > 0 {', 'if occ.get(to).copied().unwrap_or(0) > 1 {'),
 'R12-claim-keep-zero-source': (MR, 'if n > 1 {', 'if n > 0 {'),
 'R13-claim-target-reset': (MR, 'occ.insert(to.clone(), t + 1);', 'occ.insert(to.clone(), 1);'),
 'D01-flag-default-inverted': (DB, 'flag_override.unwrap_or(DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT)', 'flag_override.unwrap_or(!DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT)'),
 'D02-advance-prog-strict': (DB, 'if zaufanie.is_nan() || zaufanie > p.kryzys_prog_zaufania {', 'if zaufanie.is_nan() || zaufanie >= p.kryzys_prog_zaufania {'),
 'D03-warning-strict': (DB, 'warning_active: counter >= warn_at,', 'warning_active: counter > warn_at,'),
 'D04-war-trigger-strict': (DB, 'war_trigger_ready: counter >= p.kryzys_tur_do_wojny,', 'war_trigger_ready: counter > p.kryzys_tur_do_wojny,'),
 'D05-prev-no-floor': (DB, 'prev_counter.floor()', 'prev_counter'),
 'D06-warnat-plus': (DB, 'let warn_at = p.kryzys_tur_do_wojny - p.kryzys_ostrzezenie_tur_przed;', 'let warn_at = p.kryzys_tur_do_wojny + p.kryzys_ostrzezenie_tur_przed;'),
 'D07-atwar-ignored': (DB, 'if at_war {', 'if false {'),
 'D08-krok-pow-offset': (DB, 'top_val * js_pow(p.wymiana_mnoznik_na_epoke, e - top_f)', 'top_val * js_pow(p.wymiana_mnoznik_na_epoke, e - top_f + 1.0)'),
 'D09-min-tur-strict': (DB, 'if input.kolejne_tury_dostaw < p.wymiana_min_tur_dostaw {', 'if input.kolejne_tury_dostaw <= p.wymiana_min_tur_dostaw {'),
 'D10-trade-no-max-cap': (DB, 'js_min(js_min(surowy, p.wymiana_max_per_tura), headroom)', 'js_min(surowy, headroom)'),
 'D11-parse-zero-kept': (DB, 'if n.is_finite() && n > 0.0 {', 'if n.is_finite() && n >= 0.0 {'),
 'D12-parse-no-floor': (DB, 'out.push((k.clone(), n.floor()));', 'out.push((k.clone(), n));'),
 'D13-queue-counter-ignored': (DB, 'if y.counter != x.counter {', 'if false {'),
 'D14-queue-owner-desc': (DB, 'return xl.cmp(&yl);', 'return yl.cmp(&xl);'),
 'D15-declarer-tie-max': (DB, 'a.owner_id.min(b.owner_id)', 'a.owner_id.max(b.owner_id)'),
 'D16-dobra-no-clamp': (DB, 'next: if r - 1.0 > 0.0 { r - 1.0 } else { 0.0 },', 'next: r - 1.0,'),
 'D17-elig-zero-city': (DB, '&& o.city_count > 0.0', '&& o.city_count >= 0.0'),
 'D18-pairs-self-included': (DB, 'for j in (i + 1)..owners.len() {', 'for j in i..owners.len() {'),
}

def run_one(mid):
    path, old, new = MUTS[mid]
    orig = open(path, encoding='utf-8').read()
    n = orig.count(old)
    if n != 1:
        print(f'{mid}: SKIP (wystapien={n})', flush=True)
        return
    try:
        open(path, 'w', encoding='utf-8').write(orig.replace(old, new))
        r = subprocess.run(
            ['cargo', 'test', '--test', 'p6_repin_wojna_c_move_range', '--test', 'p6_repin_wojna_c_war_brake'],
            cwd=ENG, env=ENV, capture_output=True, text=True, timeout=900)
        out = r.stdout + r.stderr
        status = 'KILLED' if r.returncode != 0 else 'SURVIVED'
        failed = [l.strip() for l in out.splitlines() if l.strip().startswith('test ') and 'FAILED' in l]
        log = os.path.join(RUN, f'mut-c-{mid}.log')
        with open(log, 'w', encoding='utf-8') as f:
            f.write(out)
            f.write(f'\nEXIT={r.returncode}\n')
        print(f'{mid}: {status} exit={r.returncode} failing={len(failed)} {failed[:2]}', flush=True)
    finally:
        open(path, 'w', encoding='utf-8').write(orig)

ids = sys.argv[1:] or list(MUTS)
for mid in ids:
    run_one(mid)
