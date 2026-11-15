import json,sys
a=json.load(open(sys.argv[1])); b=json.load(open(sys.argv[2]))
for k in sorted(set(a)|set(b)):
    va,vb=a.get(k),b.get(k)
    if va==vb: continue
    if isinstance(va,list) and isinstance(vb,list):
        d=[i for i,(x,y) in enumerate(zip(va,vb)) if x!=y]
        print(k,'len',len(va),len(vb),'diff idx count',len(d))
        for i in d[:4]: print('  A',json.dumps(va[i],ensure_ascii=False)[:400]); print('  B',json.dumps(vb[i],ensure_ascii=False)[:400])
    else: print(k, repr(va)[:200], '|', repr(vb)[:200])
