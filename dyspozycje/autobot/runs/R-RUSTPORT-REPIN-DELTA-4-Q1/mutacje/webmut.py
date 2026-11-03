import json, os, shutil, subprocess, sys
SP = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad'
TOOLS = '/home/user/The-Game/.claude/worktrees/wf_737bd667-9f6-1/dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-4-Q1/tools'
MUT = {
    'm12': ("          && !onRiverHex(hexKey)\n", "          && !riverHexKeys.has(hexKey)\n"),
    'm17': ("        placedThisCity--;\n", ""),
}
def gen(webname, out):
    r = subprocess.run(['node', '--experimental-transform-types', '--no-warnings', '--import', './repin-b-loader-register.mjs',
                        './gen-p6-8i-pick-vectors.mjs', f'{SP}/{webname}', f'{SP}/{out}'], cwd=TOOLS, capture_output=True, text=True)
    print(webname, r.stdout.splitlines()[0] if r.stdout else r.stderr[:300])
gen('web23', 'o_23')
base = json.load(open(f'{SP}/o_23/pick.json'))['scenarios']
for m, (a, b) in MUT.items():
    d = f'{SP}/web{m}'
    shutil.rmtree(d, ignore_errors=True)
    shutil.copytree(f'{SP}/web23', d)
    f = d + '/gra/src/game/auto-improvements.ts'
    s = open(f).read()
    assert s.count(a) == 1, (m, s.count(a))
    open(f, 'w').write(s.replace(a, b))
    gen(f'web{m}', f'o_{m}')
    mut = json.load(open(f'{SP}/o_{m}/pick.json'))['scenarios']
    diff = [x['name'] for x, y in zip(base, mut) if x['expected'] != y['expected']]
    print(m, 'scenariusze', len(base), 'roznica webowa', len(diff), diff[:10])
