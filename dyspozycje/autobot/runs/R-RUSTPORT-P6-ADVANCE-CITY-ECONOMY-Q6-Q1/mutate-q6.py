"""Mutacje modulow Q6 (python3 -I mutate-q6.py <od> <do>) -- kazda: dokladnie 1 wystapienie `old` -> `new`,
`cargo test --test p6_adv_q6_wire`; KILLED = test pada, COMPILE = nie kompiluje (nie liczone), SURVIVED = zielono.
Plik zawsze przywracany. 'EKW' = oczekiwany mutant rownowazny (dowod w P6-ADVANCE-CITY-ECONOMY-Q6.md sek. 6)."""
import os
import subprocess
import sys

REPO = '/home/user/The-Game/.claude/worktrees/wf_a22404f5-1a2-1'
D = REPO + '/rust-port/engine/src/domain/'
ENG = REPO + '/rust-port/engine'
T = D + 'turn_economy_inputs_trade.rs'
W = D + 'turn_economy_inputs_wonders.rs'
S = D + 'turn_economy_inputs_state.rs'
R = D + 'turn_economy_wire.rs'

M = [
    ('M01-idx-no-max0', T, 'let idx = dystans.floor().min(hi).max(0.0);', 'let idx = dystans.floor().min(hi);', 'EKW'),
    ('M02-curve-swap', T, 'TradeRouteMedium::Land => &params.dochody_ladowe,', 'TradeRouteMedium::Land => &params.dochody_morskie,', ''),
    ('M03-intl-mult-off', T, 'base * TRADE_ROUTE_INTERNATIONAL_MULTIPLIER', 'base', ''),
    ('M04-ceil-to-floor', T, '(before_half / TRADE_ROUTE_INCOME_HALF_DIVISOR).ceil()', '(before_half / TRADE_ROUTE_INCOME_HALF_DIVISOR).floor()', ''),
    ('M05-from-wonder-ceil', T, '(route_income * (1.0 + from_wonder)).floor()', '(route_income * (1.0 + from_wonder)).ceil()', ''),
    ('M06-to-wonder-nofloor', T, '(route_income * (1.0 + to_wonder)).floor()', '(route_income * (1.0 + to_wonder))', ''),
    ('M07-from-targ-nofloor', T, '(from_after_wonder * (1.0 + from_targ)).floor()', '(from_after_wonder * (1.0 + from_targ))', ''),
    ('M08-to-targ-nofloor', T, '(to_after_wonder * (1.0 + to_targ)).floor()', '(to_after_wonder * (1.0 + to_targ))', ''),
    ('M09-maritime-all', T, 'if route.medium == TradeRouteMedium::Sea {', 'if true {', ''),
    ('M10-disconnected-counted', T, '        if !route.is_connected() {\n            continue;\n        }\n        let route_income', '        let route_income', ''),
    ('M11-bonus-ignores-building', T, 'if !route.is_connected() || !route.building_unlocked {', 'if !route.is_connected() {', ''),
    ('M12-bonus-rate', T, 'TRADE_ROUTE_BUILDING_BONUS_RATE: f64 = 0.05;', 'TRADE_ROUTE_BUILDING_BONUS_RATE: f64 = 0.06;', ''),
    ('M13-sea-count-all', T, 'if !route.is_connected() || route.medium != TradeRouteMedium::Sea {', 'if !route.is_connected() {', ''),
    ('M14-extra-routes', T, 'let extra = (count - 1.0).max(0.0);', 'let extra = *count;', ''),
    ('M15-port-bonus', T, 'PORT_SEA_TRADE_BONUS_PIENIADZ: f64 = 1.0;', 'PORT_SEA_TRADE_BONUS_PIENIADZ: f64 = 2.0;', ''),
    ('M16-sea-not-in-maritime', T, '        *b.maritime_by_city.entry(city.clone()).or_insert(0.0) += bonus;\n', '', ''),
    ('M17-bonus-uses-loaded-params', T, '            &PinTradeIncomeParams::default(),\n        ),\n    }', '            income_params,\n        ),\n    }', ''),
    ('M18-loader-empty-ok', T, 'Some(a) if !a.is_empty() && a.iter()', 'Some(a) if a.iter()', ''),
    ('M19-default-lad', T, '    1.0, 1.0, 2.0, 3.0, 3.0, 4.0, 4.0, 5.0, 6.0, 6.0, 7.0, 7.0, 8.0,', '    1.0, 2.0, 2.0, 3.0, 3.0, 4.0, 4.0, 5.0, 6.0, 6.0, 7.0, 7.0, 8.0,', ''),
    ('W01-city-era-gate-off', W, 'let m = &w.bonusy.miasto;\n        if !(owner_era <= w.absolut as f64) {', 'let m = &w.bonusy.miasto;\n        if false {', ''),
    ('W02-trade-era-gate-off', W, '        if !(owner_era <= w.absolut as f64) {\n            continue;\n        }\n        for s in', '        if false {\n            continue;\n        }\n        for s in', ''),
    ('W03-zadowolenie-dropped', W, '        t.zadowolenie += g(m.zadowolenie);\n', '', ''),
    ('W04-obrona-dropped', W, '        t.obrona += g(m.obrona);\n', '', ''),
    ('W05-handel-morski-ignored', W, 's.cel.as_deref() == Some("handel_morski") && medium != TradeRouteMedium::Sea', 'false', ''),
    ('W06-typ-not-checked', W, 'if s.typ != "handel_procent" {', 'if false {', ''),
    ('W07-rfind-to-find', W, 'w.cuda.iter().rfind(|c| c.id == id)', 'w.cuda.iter().find(|c| c.id == id)', 'EKW'),
    ('W08-dedupe-off', W, 'if !seen.insert(oid) {', 'if false {', 'EKW'),
    ('W09-empty-yield-kept', W, 'if has_any_wonder_city_yield(&bonus) {', 'if true {', ''),
    ('W10-has-any-no-obrona', W, '        || b.obrona != 0.0\n', '', ''),
    ('W11-loop-praca-zero', W, 'praca: self.praca,', 'praca: 0.0,', ''),
    ('W12-trade-total-overwrite', W, 'total += s.wartosc;', 'total = s.wartosc;', ''),
    ('S01-grace-turns', S, 'MENNICA_ZLOTO_GRACE_TURNS: f64 = 1.0;', 'MENNICA_ZLOTO_GRACE_TURNS: f64 = 2.0;', ''),
    ('S02-prepare-no-reset', S, '            state.grace_turns_left.insert(owner_id, 0.0);\n', '            let _ = 0;\n', ''),
    ('S03-had-access-is-some', S, 'state.had_access_last_turn.get(&owner_id) == Some(&true)', 'state.had_access_last_turn.get(&owner_id).is_some()', ''),
    ('S04-finalize-flip', S, '        if !now {\n            let grace', '        if now {\n            let grace', ''),
    ('S05-no-decrement', S, 'state.grace_turns_left.insert(owner_id, grace - 1.0);', 'state.grace_turns_left.insert(owner_id, grace);', ''),
    ('S06-no-snapshot', S, '        state.had_access_last_turn.insert(owner_id, now);\n', '', ''),
    ('S07-grace-ge', S, '.copied().unwrap_or(0.0) > 0.0\n}', '.copied().unwrap_or(0.0) >= 0.0\n}', ''),
    ('S08-order-le', S, 'if order < best_order {', 'if order <= best_order {', ''),
    ('S09-capital-no-owner-check', S, '.any(|c| &c.id == explicit && c.owner_id == owner_id)', '.any(|c| &c.id == explicit)', ''),
    ('S10-tax-lt', S, 'owner_cities.is_empty() || tax <= 0.0 {', 'owner_cities.is_empty() || tax < 0.0 {', ''),
    ('S11-target-last', S, '.unwrap_or(owner_cities[0]);', '.unwrap_or(owner_cities[owner_cities.len() - 1]);', ''),
    ('S12-empty-owner-not-skipped', S, 'owner_cities.is_empty() || tax <= 0.0 {', 'tax <= 0.0 {', ''),
    ('S13-city-order-nan', S, 'let Some(rest) = id.strip_prefix("city") else {\n        return f64::INFINITY;\n    };', 'let Some(rest) = id.strip_prefix("city") else {\n        return 0.0;\n    };', ''),
    ('R01-sum-owner-eq', R, 'if tk.owner_id != owner_id {', 'if tk.owner_id == owner_id {', ''),
    ('R02-sum-ztras-dropped', R, '        s.pieniadz_z_tras += tk.pieniadz_z_tras;\n    }\n    s\n}\n\n/// Web `sumEconomyForPlayerCities`', '    }\n    s\n}\n\n/// Web `sumEconomyForPlayerCities`', ''),
    ('R03-player-cities-neq', R, '.filter(|c| c.owner_id == owner_id)\n        .map(|c| c.id.as_str())', '.filter(|c| c.owner_id != owner_id)\n        .map(|c| c.id.as_str())', ''),
    ('R04-treasury-no-upkeep', R, 'if self.upkeep_applied > 0.0 {', 'if false {', ''),
    ('R05-science-flip', R, 'if self.is_human {\n            before + self.sum.nauka', 'if !self.is_human {\n            before + self.sum.nauka', ''),
    ('R06-deficyt-false', R, 'Some(b) if b.utrzymanie_razem > 0.0 => (b.utrzymanie_razem, b.deficyt),', 'Some(b) if b.utrzymanie_razem > 0.0 => (b.utrzymanie_razem, false),', ''),
    ('R07-humans-as-ai', R, 'bank_one(h, true, cities);', 'bank_one(h, false, cities);', ''),
    ('R08-ai-includes-barbarian', R, '!ctx.human_owner_ids.contains(&o) && o != BARBARIAN_OWNER_ID && o != REBEL_FACTION_OWNER_ID', '!ctx.human_owner_ids.contains(&o) && o != REBEL_FACTION_OWNER_ID', ''),
    ('R09-ai-includes-rebel', R, '!ctx.human_owner_ids.contains(&o) && o != BARBARIAN_OWNER_ID && o != REBEL_FACTION_OWNER_ID', '!ctx.human_owner_ids.contains(&o) && o != BARBARIAN_OWNER_ID', ''),
    ('R10-no-resource-deduct', R, '                deduct_building_stock_cost_across_cities(cities, owner_id, res);\n', '', ''),
    ('R11-has-now-no-stock', R, 'Some(s) => owner_has_zloto_stock(Some(s)),\n            None => false,\n        };\n        zl || (ctx.native_zloto_access)(o)\n    };\n    prepare', 'Some(_) => false,\n            None => false,\n        };\n        zl || (ctx.native_zloto_access)(o)\n    };\n    prepare', ''),
    ('R12-no-zloto-label', R, 'if has_now_pre(o) && !out.iter().any(|l| l == "Złoto") {', 'if false {', ''),
    ('R13-no-prepare', R, '    prepare_mennica_zloto_grace_for_tick(grace, &map_owner_ids, &has_now_pre);\n', '', ''),
    ('R14-finalize-pre-state', R, 'finalize_mennica_zloto_grace_after_tick(grace, &map_owner_ids, &has_now_post);', 'finalize_mennica_zloto_grace_after_tick(grace, &map_owner_ids, &has_now_pre);', ''),
    ('R15-manual-tax-wrong-map', R, 'manual_work_tax_by_city: &manual_tax,', 'manual_work_tax_by_city: &trade.maritime_trade_income_by_city,', ''),
    ('R16-building-bonus-wrong-map', R, 'trade_route_building_bonus_by_city: &trade.trade_route_building_bonus_by_city,', 'trade_route_building_bonus_by_city: &trade.trade_income_by_city,', ''),
    ('R17-wonder-trade-era-one', R, '            (ctx.owner_era)(owner),\n            medium,', '            1.0,\n            medium,', ''),
    ('R18-targowisko-zero', R, '            econ_cfg.budynek_targowisko_bonus_handlu\n        } else {', '            0.0\n        } else {', ''),
    ('R19-default-income-params', R, 'load_pin_trade_income_params(Some(ctx.econ_params), ctx.difficulty);', 'crate::domain::turn_economy_inputs_trade::PinTradeIncomeParams::default(); let _ = load_pin_trade_income_params(Some(ctx.econ_params), ctx.difficulty);', ''),
    ('R20-stock-snapshot-empty', R, 'stock_snapshot.get(&o).cloned().unwrap_or_default() };', 'StockRecord::new() };', ''),
    ('R21-labels-dedupe-off', R, 'if !out.contains(&l) {', 'if true {', 'EKW'),
    ('R22-wonder-map-loop-era', R, '        &city_owner_ids,\n        ctx.owner_era,\n    );', '        &city_owner_ids,\n        &|_| 1.0,\n    );', ''),
]


def run(cmd):
    return subprocess.run(cmd, cwd=ENG, capture_output=True, text=True,
                          env={**os.environ, 'CARGO_TARGET_DIR': '/dev/shm/q6a', 'CARGO_INCREMENTAL': '0',
                               'CARGO_PROFILE_DEV_DEBUG': '0', 'CARGO_PROFILE_TEST_DEBUG': '0'})


lo = int(sys.argv[1]) if len(sys.argv) > 1 else 0
hi = int(sys.argv[2]) if len(sys.argv) > 2 else len(M)
for i, (mid, path, old, new, flag) in enumerate(M):
    if not (lo <= i < hi):
        continue
    src = open(path).read()
    if src.count(old) != 1:
        print(f'{mid}: BAD-ANCHOR ({src.count(old)} wystapien)', flush=True)
        continue
    try:
        open(path, 'w').write(src.replace(old, new))
        p = run(['cargo', 'test', '-j', '2', '--test', 'p6_adv_q6_wire'])
        out = p.stdout + p.stderr
        if 'error[' in out or 'could not compile' in out:
            res = 'COMPILE'
        elif p.returncode != 0:
            res = 'KILLED'
        else:
            res = 'SURVIVED'
    finally:
        open(path, 'w').write(src)
    print(f'{mid}: {res} {flag}', flush=True)
