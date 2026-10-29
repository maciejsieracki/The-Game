import re, json
S='/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/k01/'
hdr=open(S+'header.txt',encoding='utf-8').read()
body=open(S+'k01-body.ts',encoding='utf-8').read()
# imported names from header (import {...} from '...'; import X from; import * )
imp={}
for m in re.finditer(r"import\s+(type\s+)?\{([^}]*)\}\s*from\s*'([^']+)'", hdr):
    for part in m.group(2).split(','):
        p=part.strip()
        if not p: continue
        p=re.sub(r'^type\s+','',p)
        name=p.split(' as ')[-1].strip()
        imp[name]=m.group(3)
for m in re.finditer(r"import\s+(?:type\s+)?([A-Za-z_$][\w$]*)\s+from\s*'([^']+)'", hdr):
    imp[m.group(1)]=m.group(2)
# declared in block 1 (top-level)
decl=set(re.findall(r'^(?:export\s+)?(?:async\s+)?(?:function|const|let|class|interface|type)\s+([A-Za-z_$][\w$]*)', body, re.M))
ids=set(re.findall(r'(?<![\w$.])([A-Za-z_$][\w$]*)', body))
used_imp={n:imp[n] for n in ids if n in imp}
print('header imported names', len(imp), 'used by block1', len(used_imp))
bymod={}
for n,mod in sorted(used_imp.items()):
    bymod.setdefault(mod,[]).append(n)
for mod,names in sorted(bymod.items()):
    print(mod, names)
print('block1 declared', len(decl))
# identifiers that are neither declared, imported, nor obvious globals
glob=set('''Math JSON Number String Object Array Boolean Date Promise Set Map Error RegExp parseInt parseFloat isFinite isNaN undefined null true false console document window HTMLElement Element Node Event KeyboardEvent MouseEvent setTimeout clearTimeout requestAnimationFrame Intl encodeURIComponent decodeURIComponent Infinity NaN globalThis Symbol Reflect Array'''.split())
rest=sorted(n for n in ids if n not in decl and n not in imp and n not in glob and not n[0].isupper() or (n not in decl and n not in imp and n not in glob and n.isupper() and len(n)>2))
print('residual identifiers (candidates for module-level unknowns):', len(rest))
print(rest)
