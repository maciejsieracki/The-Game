import csv, subprocess, collections, sys

S = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/5c/'
RUN = '/home/user/The-Game/.claude/worktrees/wf_42d3d04d-113-3/dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-5C-Q1/'
REF = 'c86c686bb'
PINS = ['edb8fb56', '91dc998a']


def changed(tsv):
    s = set()
    with open(tsv, encoding='utf-8') as f:
        next(f)
        for line in f:
            p = line.split('\t')
            s.add(p[1])
    return s


E = changed(RUN + 'hunki-edb8-4bbef.tsv')
N = changed(RUN + 'hunki-91dc-4bbef.tsv')
names_E = {}
for p in E:
    names_E.setdefault(p.split('/')[-1], set()).add(p)
names_N = {}
for p in N:
    names_N.setdefault(p.split('/')[-1], set()).add(p)
allnames = sorted(set(names_E) | set(names_N))


def git(args):
    r = subprocess.run(['git'] + args, capture_output=True, text=True, cwd='/home/user/The-Game/.claude/worktrees/wf_42d3d04d-113-3')
    return r.stdout


# 1. pinned Rust files
pin_files = {}
for pin in PINS:
    out = git(['grep', '-l', '-F', pin, REF, '--', 'rust-port'])
    for line in out.splitlines():
        path = line.split(':', 1)[1]
        pin_files.setdefault(path, set()).add(pin)

# 2. Rust files that mention a changed web file basename
cite = collections.defaultdict(set)
for nm in allnames:
    out = git(['grep', '-l', '-F', nm, REF, '--', 'rust-port'])
    for line in out.splitlines():
        path = line.split(':', 1)[1]
        cite[path].add(nm)

rows = []
for path in sorted(pin_files):
    pins = pin_files[path]
    names = cite.get(path, set())
    eh = sorted(n for n in names if n in names_E)
    nh = sorted(n for n in names if n in names_N)
    rows.append([path, ','.join(sorted(pins)), ';'.join(eh), ';'.join(nh)])

with open(RUN + 'wektory-piny.tsv', 'w', encoding='utf-8') as f:
    f.write('rust_plik\tpiny\tweb_zmienione_edb8_4bbef\tweb_zmienione_91dc_4bbef\n')
    for r in rows:
        f.write('\t'.join(r) + '\n')

print('pinned rust files', len(pin_files))
for pin in PINS:
    print(pin, 'files', sum(1 for p in pin_files if pin in pin_files[p]))
both = sum(1 for p in pin_files if len(pin_files[p]) == 2)
print('both pins', both)
cand_N = [r for r in rows if r[3]]
cand_E = [r for r in rows if r[2]]
print('pinned files citing a web file changed in 91dc..4bbef:', len(cand_N))
print('pinned files citing a web file changed in edb8..4bbef:', len(cand_E))
dirs = collections.Counter('/'.join(r[0].split('/')[:3]) for r in cand_E)
print('by dir (edb8 cand):', dict(dirs))
