"""Independent comparison: sha256(frontend-v2 file) vs sha256(git show <pin>:<path>).

Usage: python3 -I shatable.py <worktree> <out_table.md>
Prints log lines; writes markdown table.
"""
import hashlib, json, os, subprocess, sys
wt = sys.argv[1]
fe = os.path.join(wt, 'src-tauri', 'frontend-v2')
man = json.load(open(os.path.join(fe, 'tools', 'pin-manifest.json'), encoding='utf-8'))
rows = ['| # | Plik w `src-tauri/frontend-v2/` | Źródło (`git show`) | Bajty | sha256 kopii | sha256 pinu | Zgodny |', '|---:|---|---|---:|---|---|---|']
bad = 0
for i, f in enumerate(man['files'], 1):
    blob = subprocess.run(['git', '-C', wt, 'show', f['pin']], check=True, capture_output=True).stdout
    pin_sha = hashlib.sha256(blob).hexdigest()
    data = open(os.path.join(fe, f['path']), 'rb').read()
    cp_sha = hashlib.sha256(data).hexdigest()
    ok = pin_sha == cp_sha
    bad += not ok
    print(f"{'OK ' if ok else 'BAD'} {cp_sha} {pin_sha} {f['path']} <- {f['pin']}")
    rows.append(f"| {i} | `{f['path']}` | `{f['pin']}` | {len(data)} | `{cp_sha}` | `{pin_sha}` | {'TAK' if ok else '**NIE**'} |")
print(f'files={len(man["files"])} mismatches={bad}')
open(sys.argv[2], 'w', encoding='utf-8', newline='\n').write('\n'.join(rows) + '\n')
sys.exit(1 if bad else 0)
