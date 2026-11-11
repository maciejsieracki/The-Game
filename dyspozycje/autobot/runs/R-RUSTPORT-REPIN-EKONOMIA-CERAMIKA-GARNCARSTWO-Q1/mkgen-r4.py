import re, sys, os
# uzycie: mkgen.py <gen_src> <gen_out> <pin_data_csv> <pin_src_csv "dest=srcfile;...">
src, out, pin_data, pin_src = sys.argv[1:5]
R = os.environ.get('R_WT', '/home/user/The-Game/.claude/worktrees/wf_6b34d676-080-1')
s = open(src).read()
REF = os.environ.get('PIN_REF','638e90bea')
s = re.sub(r"'rev-parse', '(4bbef081d|23dd158e9)'", "'rev-parse', '%s'" % REF, s)
if not os.environ.get('NO_SEA_PATCH'):
    s = s.replace("W.computeSeaTradeBonusIncomeByCity(W.computeSeaTradeRouteCountByCity(routes))",
              "W.computeSeaTradeBonusIncomeByCity(W.computeSeaTradeRouteCountByCity(routes), builtByCity)")
s = s.replace("W.resolvePopulationCapMatrixDelta(civKey)));",
              "W.resolvePopulationCapMatrixDelta(civKey), builtIds.includes('spichlerz_ii')));")
tar = "execFileSync('tar', ['-xf', join(workDir, 'pin.tar'), '-C', workDir]);"
assert tar in s, 'brak linii tar'
block = tar + "\n"
for f in [x for x in pin_data.split(',') if x]:
    block += "execFileSync('cp', ['%s/rust-port/engine/data/%s.json', join(workDir, 'gra/data/%s.json')]);\n" % (R, f, f)
for pair in [x for x in pin_src.split(';') if x]:
    dest, fil = pair.split('=')
    block += "execFileSync('cp', ['%s', join(workDir, '%s')]);\n" % (fil, dest)
s = s.replace(tar, block, 1)
open(out, 'w').write(s)
print('ok', out, block.count('cp'))
