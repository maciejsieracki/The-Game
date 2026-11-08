#!/usr/bin/env python3
"""Mutation runner (R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1 r5).

Usage: mutate.py <module_rel_path> <state_json> <budget_s> <test args...>
- generates operator mutants of the module (one occurrence per mutant),
- runs `cargo test <test args>` per mutant, restores the file after each run,
- resumable: results appended to state_json; stops when budget_s is spent.
"""
import json
import os
import re
import subprocess
import sys
import time

ENGINE = '/home/user/The-Game/.claude/worktrees/wf_28708855-6ed-1/rust-port/engine'
TARGET_DIR = ENGINE + '/.r5-target'

RULES = [
    ('ge2gt', r'>=', '>'),
    ('le2lt', r'<=', '<'),
    ('gt2ge', r'(?<![-=])>(?!=)', '>='),
    ('lt2le', r'(?<!<)<(?![=<])', '<='),
    ('and2or', r'&&', '||'),
    ('or2and', r'\|\|', '&&'),
    ('eq2ne', r'==', '!='),
    ('ne2eq', r'!=', '=='),
    ('notdrop', r'!(?=[A-Za-z_(])', ''),
    ('plus2minus', r'(?<=\w|\))\s\+\s', ' - '),
    ('minus2plus', r'(?<=\w|\))\s-\s(?=[\w(])', ' + '),
    ('max2min', r'\bjs_max\(|\.max\(', None),
    ('min2max', r'\bjs_min\(|\.min\(', None),
    ('true2false', r'\btrue\b', 'false'),
    ('false2true', r'\bfalse\b', 'true'),
    ('zero2one', r'(?<![\w.])0\.0(?![\w.])', '1.0'),
    ('one2zero', r'(?<![\w.])1\.0(?![\w.])', '0.0'),
    ('drop_continue', r'\bcontinue;', ';'),
    ('drop_break', r'\bbreak;', ';'),
]


def mutants_for(lines):
    out = []
    for idx, line in enumerate(lines):
        stripped = line.lstrip()
        if stripped.startswith('//') or stripped.startswith('///') or stripped.startswith('//!'):
            continue
        for name, pat, rep in RULES:
            for m in re.finditer(pat, line):
                if name in ('max2min', 'min2max'):
                    s = m.group(0)
                    if s.startswith('js_max'):
                        new = s.replace('js_max', 'js_min')
                    elif s.startswith('js_min'):
                        new = s.replace('js_min', 'js_max')
                    elif s == '.max(':
                        new = '.min('
                    else:
                        new = '.max('
                    newline = line[:m.start()] + new + line[m.end():]
                else:
                    newline = line[:m.start()] + (m.expand(rep) if rep is not None else '') + line[m.end():]
                if newline == line:
                    continue
                out.append({'id': f'L{idx + 1}:{name}:{m.start()}', 'line': idx, 'text': newline,
                            'orig': line.rstrip('\n'), 'op': name})
                break  # one occurrence per rule per line
    return out


def main():
    rel, state_path, budget, *test_args = sys.argv[1:]
    budget = float(budget)
    path = os.path.join(ENGINE, rel)
    with open(path, encoding='utf-8') as f:
        lines = f.read().split('\n')
    lines_nl = [l + '\n' for l in lines[:-1]] + ([lines[-1]] if lines[-1] else [])
    muts = mutants_for(lines_nl)
    state = {}
    if os.path.exists(state_path):
        with open(state_path) as f:
            state = json.load(f)
    results = state.setdefault('results', {})
    state['total'] = len(muts)
    start = time.time()
    orig_text = ''.join(lines_nl)
    try:
        for m in muts:
            if m['id'] in results:
                continue
            if time.time() - start > budget:
                break
            new_lines = list(lines_nl)
            new_lines[m['line']] = m['text'] if m['text'].endswith('\n') else m['text'] + '\n'
            with open(path, 'w', encoding='utf-8') as f:
                f.write(''.join(new_lines))
            env = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0',
                       CARGO_PROFILE_TEST_DEBUG='0', CARGO_TARGET_DIR=TARGET_DIR)
            t0 = time.time()
            try:
                p = subprocess.run(['cargo', 'test', '-q'] + test_args, cwd=ENGINE, env=env,
                                   capture_output=True, text=True, timeout=600)
                out = p.stdout + p.stderr
                if 'could not compile' in out or re.search(r'error\[E\d+\]', out):
                    verdict = 'COMPILE_ERR'
                elif p.returncode == 0:
                    verdict = 'SURVIVED'
                else:
                    verdict = 'KILLED'
            except subprocess.TimeoutExpired:
                verdict = 'KILLED_TIMEOUT'
            results[m['id']] = {'v': verdict, 'op': m['op'], 'orig': m['orig'].strip(),
                                'mut': m['text'].strip(), 's': round(time.time() - t0, 1)}
            with open(state_path, 'w') as f:
                json.dump(state, f, indent=1, ensure_ascii=False)
    finally:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(orig_text)
    done = len(results)
    killed = sum(1 for r in results.values() if r['v'].startswith('KILLED'))
    surv = [k for k, r in results.items() if r['v'] == 'SURVIVED']
    ce = [k for k, r in results.items() if r['v'] == 'COMPILE_ERR']
    print(f'total={len(muts)} done={done} killed={killed} survived={len(surv)} compile_err={len(ce)}')
    print('pending=', len(muts) - done)
    for k in surv:
        r = results[k]
        print('SURV', k, '|', r['orig'][:110], '=>', r['mut'][:110], flush=True)
    for k in ce:
        print('CE', k)


if __name__ == '__main__':
    main()
