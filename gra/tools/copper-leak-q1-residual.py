import json,sys
rows=[json.loads(l) for l in open(sys.argv[1])]
rows=[d for d in rows if d.get('ev')=='turn']
pt=0; pos=[]; neg=0
for d in rows:
    r=d['phase'].get('ruda',{}); ry=d['phase'].get('ry',{})
    tot=sum(r.values()); raw=sum(x['raw'] for x in ry.values()); res=tot-pt-raw
    if res>0: pos.append((d['turn'],tot,pt,raw,res))
    if res<0: neg+=1
    pt=tot
print('turns',len(rows),'turns with positive unexplained residual',len(pos),'turns with sink',neg)
for p in pos: print(p)
print('final total',pt,'sum raw all turns',sum(sum(x['raw'] for x in d['phase'].get('ry',{}).values()) for d in rows))
