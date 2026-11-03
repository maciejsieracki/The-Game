"""Mutacje HEAL-MAXHP (python3 -I mutate-heal-maxhp.py <od> <do>) - kazda: dokladnie 1 wystapienie `old` -> `new`,
`cargo test -j 2 --test p6_heal_maxhp_wire`; KILLED = test pada, COMPILE = nie kompiluje (nie liczone), SURVIVED = zielono.
Plik zawsze przywracany. 'EKW' = oczekiwany mutant rownowazny (dowod w P6-ECON-TICK-HEAL-MAXHP.md)."""
import os
import subprocess
import sys

REPO = '/home/user/The-Game/.claude/worktrees/wf_a1fcb6af-fd0-1'
ENG = REPO + '/rust-port/engine'
U = ENG + '/src/domain/unit_health.rs'
A = ENG + '/src/domain/turn_economy_advance.rs'

M = [
    ('H01-fallback-30', U, 'UNIT_HEALTH_FALLBACK: f64 = 30.0;', 'UNIT_HEALTH_FALLBACK: f64 = 31.0;', ''),
    ('H02-vet-frac-1', U, '[0.0, 0.10, 0.15, 0.20]', '[0.0, 0.11, 0.15, 0.20]', ''),
    ('H03-vet-frac-2', U, '[0.0, 0.10, 0.15, 0.20]', '[0.0, 0.10, 0.16, 0.20]', ''),
    ('H04-vet-frac-3', U, '[0.0, 0.10, 0.15, 0.20]', '[0.0, 0.10, 0.15, 0.21]', ''),
    ('H05-vet-max-tracked', U, 'VETERAN_MAX_BATTLES_TRACKED: f64 = 3.0;', 'VETERAN_MAX_BATTLES_TRACKED: f64 = 2.0;', ''),
    ('H06-won-floor-ceil', U, 'Some(v) if v.is_finite() && v > 0.0 => v.floor(),', 'Some(v) if v.is_finite() && v > 0.0 => v.ceil(),', ''),
    ('H07-won-ge0', U, 'Some(v) if v.is_finite() && v > 0.0 => v.floor(),', 'Some(v) if v.is_finite() && v >= 0.0 => v.floor(),', 'EKW'),
    ('H08-won-nonfinite', U, 'Some(v) if v.is_finite() && v > 0.0 => v.floor(),', 'Some(v) if v > 0.0 => v.floor(),', ''),
    ('H09-star-no-min', U, 'veteran_battles_won(battles_survived).min(VETERAN_MAX_BATTLES_TRACKED)', 'veteran_battles_won(battles_survived)', 'EKW'),
    ('H10-wins-no-max0', U, 'wins.floor().clamp(0.0, VETERAN_MAX_BATTLES_TRACKED)', 'wins.floor().min(VETERAN_MAX_BATTLES_TRACKED)', ''),
    ('H11-wins-no-floor', U, 'wins.floor().clamp(0.0, VETERAN_MAX_BATTLES_TRACKED)', 'wins.clamp(0.0, VETERAN_MAX_BATTLES_TRACKED)', ''),
    ('H12-vet-from-wrong', U, 'veteran_combat_bonus_frac(live.and_then(|u| u.battles_survived)),', '0.0,', ''),
    ('H13-parametry-dropped', U, 'unit_parametry_bonus_frac(progress.as_ref()),\n        veteran_combat', '0.0,\n        veteran_combat', ''),
    ('H14-parametry-no-live', U, 'parametry_bonus_proc: u.parametry_bonus_proc,', 'parametry_bonus_proc: None,', ''),
    ('H15-emh-multiply-twice', U, 'base_hp * (1.0 + (parametry_bonus_frac + veteran_bonus_frac))', 'base_hp * (1.0 + parametry_bonus_frac) * (1.0 + veteran_bonus_frac)', ''),
    ('H16-emh-minus', U, 'base_hp * (1.0 + (parametry_bonus_frac + veteran_bonus_frac))', 'base_hp * (1.0 + (parametry_bonus_frac - veteran_bonus_frac))', ''),
    ('H17-emh-no-round', U, 'round_card_stat(base_hp * (1.0 +', '(base_hp * (1.0 +', ''),
    ('H18-card-nonfinite-keep', U, '    if !n.is_finite() {\n        return 0.0;\n    }\n    let r', '    if n.is_nan() {\n        return 0.0;\n    }\n    let r', ''),
    ('H19-card-tenth', U, 'let r = js_round(n * 10.0) / 10.0;', 'let r = js_round(n * 100.0) / 100.0;', ''),
    ('H20-card-snap-eps', U, '(r - js_round(r)).abs() < 1e-6', '(r - js_round(r)).abs() < 0.5', ''),
    ('H21-card-snap-off', U, '(r - js_round(r)).abs() < 1e-6', '(r - js_round(r)).abs() < 0.0', ''),
    ('H22-health-uses-capital', U, 'Some(r) => r.health_lc as f64,', 'Some(r) => r.health as f64,', ''),
    ('H23-health-none', U, 'None => UNIT_HEALTH_FALLBACK,\n    }\n}\n\n/// Web `roundCardStat`', 'None => 0.0,\n    }\n}\n\n/// Web `roundCardStat`', ''),
    ('H24-value-capital-first', U, 'let lower = def.and_then(|d| d.get("health"));', 'let lower = def.and_then(|d| d.get("Health"));', ''),
    ('H25-value-null-passes', U, 'Some(v) if !v.is_null() => Some(v),', 'Some(v) => Some(v),', ''),
    ('H26-norm-em-dash', U, 'if s == "---" || s == "\\u{2014}" || s.is_empty() {', 'if s == "---" || s.is_empty() {', ''),
    ('H27-norm-dashes', U, 'if s == "---" || s == "\\u{2014}" || s.is_empty() {', 'if s == "\\u{2014}" || s.is_empty() {', ''),
    ('H28-norm-empty', U, 'if s == "---" || s == "\\u{2014}" || s.is_empty() {', 'if s == "---" || s == "\\u{2014}" {', ''),
    ('H29-norm-bool', U, '            if *b {\n                1.0\n            } else {\n                0.0\n            }', '            0.0', ''),
    ('H30-norm-nan-keep', U, '    if n.is_nan() {\n        fallback\n    } else {\n        n\n    }', '    n', ''),
    ('H31-pf-neg', U, 'neg = b[i] == b\'-\';', 'neg = false;', ''),
    ('H32-pf-infinity', U, 'if t[i..].starts_with("Infinity") {', 'if false {', ''),
    ('H33-pf-exponent', U, "if i < b.len() && (b[i] == b'e' || b[i] == b'E') {", 'if false {', ''),
    ('H34-pf-dot', U, "if i < b.len() && b[i] == b'.' {", 'if false {', ''),
    ('H35-pf-ws', U, 'c.is_whitespace() || c == \'\\u{feff}\' || c == \'\\u{a0}\'', 'c == \' \'', ''),
    ('H36-adapter-first-row', U, 'by_type.entry(u.jednostka.as_str()).or_insert(u);', 'by_type.insert(u.jednostka.as_str(), u);', 'EKW'),
    ('H37-adapter-ignores-unit', U, 'move |type_id, unit| self.max_hp(type_id, Some(unit))', 'move |type_id, _unit| self.max_hp(type_id, None)', ''),
    ('A01-advance-passes-fn', A, '        get_max_hp,\n        None,\n', '        &|_, _| 100.0,\n        None,\n', ''),
]


def run(name, path, old, new, tag):
    src = open(path).read()
    if src.count(old) != 1:
        return f'{name}: BAD-ANCHOR ({src.count(old)} wystapien)'
    open(path, 'w').write(src.replace(old, new))
    try:
        env = dict(os.environ, CARGO_TARGET_DIR='/dev/shm/hm_q1_mut', CARGO_INCREMENTAL='0',
                   CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')
        p = subprocess.run(['cargo', 'test', '-j', '2', '--test', 'p6_heal_maxhp_wire'], cwd=ENG, env=env,
                           capture_output=True, text=True, timeout=570)
        out = p.stdout + p.stderr
        if p.returncode == 0:
            res = 'SURVIVED'
        elif 'could not compile' in out or 'error[E' in out or 'error: ' in out and 'test result' not in out:
            res = 'COMPILE'
        else:
            res = 'KILLED'
    finally:
        open(path, 'w').write(src)
    return f'{name}: {res}' + (f' [{tag}]' if tag else '')


lo, hi = int(sys.argv[1]), int(sys.argv[2])
for m in M[lo:hi]:
    print(run(*m), flush=True)
