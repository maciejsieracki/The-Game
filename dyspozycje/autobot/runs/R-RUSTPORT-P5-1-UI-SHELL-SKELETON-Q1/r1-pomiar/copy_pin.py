"""Copy files byte-for-byte from pin `edb8fb56` (via `git show`) into frontend-v2 and write the manifest.

Usage: python3 -I copy_pin.py <worktree> <closure.json>
"""
import hashlib, json, os, subprocess, sys

PIN = 'edb8fb56'
wt = sys.argv[1]
c = json.load(open(sys.argv[2]))
dest_root = os.path.join(wt, 'src-tauri', 'frontend-v2')

files = []  # (pin path relative to repo, dest relative to frontend-v2)
for k in c['clean']:  # 'src/ui/x.ts'
    files.append(('gra/' + k, k))
    for a in c['assets'].get(k, []):
        files.append(('gra/' + a, a))
files.append(('gra/src/vite-env.d.ts', 'src/vite-env.d.ts'))
files.append(('gra/index.html', 'index.html'))
files.append(('gra/tsconfig.json', 'tsconfig.json'))

seen = set()
manifest = []
for pin_path, rel in files:
    if rel in seen:
        continue
    seen.add(rel)
    data = subprocess.run(['git', '-C', wt, 'show', f'{PIN}:{pin_path}'], check=True, capture_output=True).stdout
    out = os.path.join(dest_root, rel)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'wb') as fh:
        fh.write(data)
    manifest.append({'path': rel, 'pin': f'{PIN}:{pin_path}', 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)})

manifest.sort(key=lambda m: m['path'])
os.makedirs(os.path.join(dest_root, 'tools'), exist_ok=True)
with open(os.path.join(dest_root, 'tools', 'pin-manifest.json'), 'w', encoding='utf-8', newline='\n') as fh:
    json.dump({'pin': PIN, 'source': 'git show <pin>:<path>', 'files': manifest}, fh, indent=2, ensure_ascii=False)
    fh.write('\n')
print(len(manifest), 'files copied')
