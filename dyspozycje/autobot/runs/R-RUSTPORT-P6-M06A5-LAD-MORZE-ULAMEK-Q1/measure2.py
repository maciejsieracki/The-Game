import json, math, sys
from collections import Counter
V = json.load(open(sys.argv[1])); C = V['cases']
def hb(q,r,w,h): return min(q,r,w-1-q,h-1-r)
def cd(q,r,w,h):
    cx=(w-1)/2; cy=(h-1)/2
    dx=(q-cx)/(cx+0.5); dy=(r-cy)/(cy+0.5)
    return math.sqrt(dx*dx+dy*dy)
qr=lambda k: tuple(int(x) for x in k.split(','))
hist=Counter(); maxd=0; interior_true_cases=0
for c in C['apply']:
    d=c['dims']
    if d and d[0]>0 and d[1]>0:
        for k,_ in c['map']:
            q,r=qr(k); x=hb(q,r,d[0],d[1]); hist[x]+=1
print('border dist histogram (apply, dims ok, all cells):', sorted(hist.items()))
# count sort-case center-distance diffs near 0.015 (N-1e-3 .. N+1e-3)
near=Counter()
for c in C['sort']:
    d=c['dims']; w,h=(d[0],d[1]) if d else (1,1)
    pts=[qr(k) for k,_ in c['map']]
    for i in range(len(pts)):
        for j in range(i+1,len(pts)):
            diff=abs(cd(*pts[i],w,h)-cd(*pts[j],w,h))
            for lab,v in (('0.0149',0.0149),('0.015',0.015),('0.0151',0.0151)):
                if abs(diff-v)<5e-4: near[lab]+=1
print('sort center-dist diffs near 0.015 (+-5e-4):', dict(near))
# pairs in apply near 0.04 (+-5e-4)
n04=Counter()
for c in C['apply']:
    sc=[s for _,s in c['scores']]
    for i in range(len(sc)):
        for j in range(i+1,len(sc)):
            diff=abs(sc[i]-sc[j])
            for lab,v in (('0.0399',0.0399),('0.04',0.04),('0.0401',0.0401)):
                if abs(diff-v)<1e-9: n04[lab]+=1
print('apply score-diff pairs exactly 0.04 (count pairs):', dict(n04))
# sort cases: how many have dims None / width 0
print('sort cases dims None:', sum(1 for c in C['sort'] if c['dims'] is None))
# apply cases where first pass leaves land<target with dims ok (interior pass reachable)?
print('apply dims-ok count:', sum(1 for c in C['apply'] if c['dims'] and c['dims'][0]>0 and c['dims'][1]>0))
