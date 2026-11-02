"""Mutacje -Q4b: `turn_economy_preview.rs` (test p6_adv_q4_preview) + ponowny pomiar L122 w `turn_economy_loop.rs`
(test p6_adv_q4_pipeline, teraz z fixture q4c.json, tryb reczny). Uzycie: python3 -I mutate-q4b.py check | <od> <do> | ids i,j,k
KILLED = test pada; COMPILE = nie kompiluje (nie liczone); SURVIVED = zielono. Plik zawsze przywracany.
Flaga 'EKW' = oczekiwany mutant rownowazny (dowod plik:linia w P6-ADVANCE-CITY-ECONOMY-Q4.md sek. 6b).
"""
import os
import subprocess
import sys

REPO = '/home/user/The-Game/.claude/worktrees/wf_34613405-855-3'
ENG = REPO + '/rust-port/engine'
FP = ENG + '/src/domain/turn_economy_preview.rs'
FL = ENG + '/src/domain/turn_economy_loop.rs'
RUN = REPO + '/dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q4-Q1'

P = 'preview'
# (id, plik, test, old, new, flaga)
M = [
    ('P01-credit-skip-zero', FP, P, 'if raw.is_nan() || raw <= 0.0 {', 'if raw < 0.0 {', ''),
    ('P02-credit-no-cap', FP, P, 'js_min(cap, current + (raw * mult).floor())', 'current + (raw * mult).floor()', ''),
    ('P03-credit-no-floor', FP, P, 'current + (raw * mult).floor()', 'current + (raw * mult)', ''),
    ('P04-credit-ceil', FP, P, 'current + (raw * mult).floor()', 'current + (raw * mult).ceil()', ''),
    ('P05-credit-drewno-key', FP, P, 'credit(&mut pool, cap, "drewno", Some(drewno_credit), 1.0);', 'credit(&mut pool, cap, "kamien", Some(drewno_credit), 1.0);', ''),
    ('P06-drewno-ge', FP, P, 'if drewno_credit > 0.0 {', 'if drewno_credit >= 0.0 {', 'EKW'),
    ('P07-kamien-mult-bonus', FP, P, '1.0 + kamieniarski_bonus * kamieniarski', '1.0 + stolarnia_bonus * kamieniarski', ''),
    ('P08-kamien-worked-sign', FP, P, 'unwrap_or(0.0) + worked.kamien', 'unwrap_or(0.0) - worked.kamien', ''),
    ('P09-glina-worked-field', FP, P, 'unwrap_or(0.0) + worked.glina', 'unwrap_or(0.0) + worked.kamien', ''),
    ('P10-drewno-no-territory', FP, P, 'terr.and_then(|t| t.drewno).unwrap_or(0.0) + worked.drewno', 'worked.drewno', ''),
    ('P11-drewno-no-worked', FP, P, 'terr.and_then(|t| t.drewno).unwrap_or(0.0) + worked.drewno', 'terr.and_then(|t| t.drewno).unwrap_or(0.0)', ''),
    ('P12-ruda-zelaza-field', FP, P, '"ruda_zelaza", t.ruda_zelaza', '"ruda_zelaza", t.ruda', ''),
    ('P13-sol-field', FP, P, '"sol", t.sol', '"sol", t.zloto', ''),
    ('P14-kon-removed', FP, P, '                credit(&mut pool, cap, "kon", t.kon, 1.0);\n', '', ''),
    ('P15-ruda-cyny-removed', FP, P, '                credit(&mut pool, cap, "ruda_cyny", t.ruda_cyny, 1.0);\n', '', ''),
    ('P16-zloto-removed', FP, P, '                credit(&mut pool, cap, "zloto", t.zloto, 1.0);\n', '', ''),
    ('P17-ruda-removed', FP, P, '                credit(&mut pool, cap, "ruda", t.ruda, 1.0);\n', '', ''),
    ('P18-territory-skipped', FP, P, 'if let Some(t) = terr {', 'if let Some(t) = terr.filter(|_| false) {', ''),
    ('P19-stolarnia-id', FP, P, 'x == "stolarnia"', 'x == "kamieniarski"', ''),
    ('P20-kamieniarski-id', FP, P, 'x == "kamieniarski"', 'x == "stolarnia"', ''),
    ('P21-magazyn-id', FP, P, 'if id == "magazyn" {', 'if id == "magazyn_x" {', ''),
    ('P22-magazyn-plus2', FP, P, '*magazyn.entry(c.owner_id).or_insert(0.0) += 1.0;', '*magazyn.entry(c.owner_id).or_insert(0.0) += 2.0;', ''),
    ('P23-cap-no-magazyn', FP, P, 'owner_resource_cap_for(input, &magazyn, o)', 'owner_resource_cap_for(input, &BTreeMap::new(), o)', ''),
    ('P24-owner-dedup-inverted', FP, P, 'if !owner_ids.contains(&c.owner_id) {', 'if owner_ids.contains(&c.owner_id) {', ''),
    ('P25-count-override-none', FP, P, 'stock_override.as_ref(),\n        );\n        if active.iter().any(|x| x == "stolarnia")', 'None,\n        );\n        if active.iter().any(|x| x == "stolarnia")', ''),
    ('P26-conv-override-none', FP, P, 'Some(&pool),\n            );\n            let recipes', 'None,\n            );\n            let recipes', ''),
    ('P27-recipe-all', FP, P, '.any(|b| b == converter_building_id_for_recipe(r))', '.all(|b| b == converter_building_id_for_recipe(r))', ''),
    ('P28-recipes-empty-no-continue', FP, P, 'if recipes.is_empty() {\n                continue;\n            }', 'if recipes.is_empty() {}', 'EKW'),
    ('P29-conv-cap-inf', FP, P, '&|_| cap)', '&|_| f64::INFINITY)', ''),
    ('P30-throughput-era-one', FP, P, 'era(owner_id));\n        for c in cities', '1.0);\n        for c in cities', ''),
    ('P31-has-i-id', FP, P, 'b == "spichlerz")', 'b == "spichlerz_ii")', ''),
    ('P32-has-ii-id', FP, P, 'b == "spichlerz_ii")', 'b == "spichlerz")', ''),
    ('P33-ceramika-gt', FP, P, '>= ceramika_amount;', '> ceramika_amount;', ''),
    ('P34-sol-gt', FP, P, '>= drain_params.sol_ii;', '> drain_params.sol_ii;', ''),
    ('P35-sol-no-has-ii', FP, P, 'let sol_paid = has_ii && pool', 'let sol_paid = pool', ''),
    ('P36-ceramika-not-deducted', FP, P, 'if ceramika_paid {\n                let v', 'if false {\n                let v', ''),
    ('P37-ceramika-plus', FP, P, '- ceramika_amount;', '+ ceramika_amount;', ''),
    ('P38-sol-not-deducted', FP, P, 'if sol_paid {\n                let v', 'if false {\n                let v', ''),
    ('P39-sol-plus', FP, P, '- drain_params.sol_ii;', '+ drain_params.sol_ii;', ''),
    ('P40-no-spichlerz-no-continue', FP, P, '                );\n                continue;\n            }\n            let ceramika_amount', '                );\n            }\n            let ceramika_amount', ''),
    ('P41-owner-ceramika-key', FP, P, '.insert(owner_id, pool.get("ceramika")', '.insert(owner_id, pool.get("sol")', ''),
    ('P42-nodes-empty', FP, P, 'owned_nodes = territory_nodes_of(cities);', 'owned_nodes = Vec::new();', ''),
    ('P43-lost-empty', FP, P, 'compute_worked_magazyn_yields_by_city(cities, terrain, nodes, &lost)', 'compute_worked_magazyn_yields_by_city(cities, terrain, nodes, &Default::default())', ''),
    ('P44-era-one', FP, P, 'let era = |o: i64| owner_era_for(input, o);', 'let era = |_o: i64| 1.0;', ''),
    ('P45-drain-difficulty', FP, P, 'load_spichlerz_drain_params(input.econ_params, input.difficulty)', 'load_spichlerz_drain_params(input.econ_params, "normal")', ''),
    ('P46-stolarnia-bonus-key', FP, P, '        "budynek_stolarnia_bonus_drewna_civ",', '        "budynek_kamieniarski_bonus_kamienia_civ",', ''),
    ('P47-zloto-resolver-none', FP, P, 'owner_zloto_access: Some(zloto),', 'owner_zloto_access: None,', ''),
    ('P48-pool-from-empty', FP, P, 'let mut pool: StockRecord = owner_resource_stock_all(cities, owner_id);', 'let mut pool: StockRecord = StockRecord::new();', ''),
    ('P49-owner-cap-loop', FP, P, 'let cap = cap_for(owner_id);', 'let cap = cap_for(0);', ''),
    ('L122-pop-zero-not-early', FL, 'pipeline', 'if pop <= 0.0 {\n        return out;', 'if pop < 0.0 {\n        return out;', ''),
]


def run(test):
    env = dict(os.environ)
    env.update({'CARGO_TARGET_DIR': '/dev/shm/ev_q4b', 'CARGO_INCREMENTAL': '0', 'CARGO_PROFILE_DEV_DEBUG': '0', 'CARGO_PROFILE_TEST_DEBUG': '0'})
    name = 'p6_adv_q4_preview' if test == P else 'p6_adv_q4_pipeline'
    p = subprocess.run(['cargo', 'test', '-j', '2', '--test', name], cwd=ENG, env=env, capture_output=True, text=True, timeout=420)
    return p.returncode, p.stdout + p.stderr


def main():
    if sys.argv[1] == 'check':
        bad = []
        for m in M:
            n = open(m[1]).read().count(m[3])
            if n != 1:
                bad.append((m[0], n))
        print('mutantow', len(M), 'zle:', bad)
        return
    if sys.argv[1] == 'ids':
        want = set(int(x) for x in sys.argv[2].split(','))
    else:
        want = set(range(int(sys.argv[1]), int(sys.argv[2])))
    out = open(RUN + '/mutacje-q4b-wynik.txt', 'a')
    for idx, (mid, f, test, old, new, flag) in enumerate(M):
        if idx not in want:
            continue
        src = open(f).read()
        assert src.count(old) == 1, (mid, src.count(old))
        try:
            open(f, 'w').write(src.replace(old, new))
            code, text = run(test)
        except subprocess.TimeoutExpired:
            code, text = -1, 'TIMEOUT'
        finally:
            open(f, 'w').write(src)
        if 'error[' in text or 'could not compile' in text:
            res = 'COMPILE'
        elif code == 0 and 'test result: ok' in text:
            res = 'SURVIVED'
        elif code == -1:
            res = 'TIMEOUT'
        else:
            res = 'KILLED'
        line = '%s: %s%s' % (mid, res, (' ' + flag) if flag and res == 'SURVIVED' else '')
        print(line, flush=True)
        out.write(line + '\n')
        out.flush()


main()
