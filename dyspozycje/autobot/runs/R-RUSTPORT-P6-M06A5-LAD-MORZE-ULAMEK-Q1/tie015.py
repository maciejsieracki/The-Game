import math
def cd(q,r,w,h):
    cx=(w-1)/2; cy=(h-1)/2
    dx=(q-cx)/(cx+0.5); dy=(r-cy)/(cy+0.5)
    return math.sqrt(dx*dx+dy*dy)
hits=[]
for w in range(1,25):
    for h in range(1,25):
        cells=[(q,r) for r in range(h) for q in range(w)]
        vals=[(cd(q,r,w,h),q,r) for q,r in cells]
        vals.sort()
        xs=[v for v,_,_ in vals]
        for i,(a,qa,ra) in enumerate(vals):
            # candidates b with |a-b| approx 0.015
            for target in (a-0.015, a+0.015):
                # binary-ish scan
                lo=0; import bisect
                j=bisect.bisect_left(xs,target-1e-9)
                while j<len(xs) and xs[j]<=target+1e-9:
                    b,qb,rb=vals[j]
                    if abs(abs(a-b)-0.015)==0.0:
                        hits.append((w,h,(qa,ra),(qb,rb)))
                    j+=1
                if len(hits)>5: break
            if len(hits)>5: break
        if len(hits)>5: break
    if len(hits)>5: break
print('exact f64 |ca-cb|==0.015 hits (w,h<=24):', len(hits), hits[:5])
