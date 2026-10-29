import re, json, sys
S='/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/k01/'
lines=open(S+'pin-cityPanel.ts',encoding='utf-8').read().split('\n')
if lines[-1]=='': lines.pop()
N=len(lines)
pm=json.load(open(S+'pomiar-r2.json'))
ub=pm['unit_block']
decl_re = re.compile(r'^(?:export\s+)?(?:async\s+)?(?:function|const|let|class|interface|type)\s+([A-Za-z_$][\w$]*)')
kind_re = re.compile(r'(function|const|let|class|interface|type)\s+[A-Za-z_$]')
starts=[]
for i,l in enumerate(lines,1):
    if l and not l[0].isspace() and l[0] not in '})];/*' and not l.startswith('//'):
        m=decl_re.match(l)
        if m: starts.append((i,m.group(1),kind_re.search(l).group(1)))
units=[]
if starts[0][0]>1: units.append(('<HEADER>',1,starts[0][0]-1,'header'))
for k,(ln,name,kind) in enumerate(starts):
    end=starts[k+1][0]-1 if k+1<len(starts) else N
    units.append((name,ln,end,kind))
print('units',len(units), 'in pomiar', len(ub))
missing=[u[0] for u in units if u[0] not in ub]
print('missing from pomiar', missing[:20], len(missing))
b1=[u for u in units if ub.get(u[0])==1]
print('block1 units', len(b1), 'loc', sum(b-a+1 for _,a,b,_ in b1))
json.dump([(n,a,b,k) for n,a,b,k in b1], open(S+'b1-units.json','w'))
hdr=[u for u in units if u[0]=='<HEADER>'][0]
open(S+'header.txt','w').write('\n'.join(lines[hdr[1]-1:hdr[2]]))
body='\n\n'.join('\n'.join(lines[a-1:b]) for n,a,b,k in b1)
open(S+'k01-body.ts','w').write(body)
