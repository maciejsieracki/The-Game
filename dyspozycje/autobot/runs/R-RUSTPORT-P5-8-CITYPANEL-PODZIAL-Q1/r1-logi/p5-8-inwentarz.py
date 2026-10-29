import re, sys, json, collections
SRC = sys.argv[1]
lines = open(SRC, encoding='utf-8').read().split('\n')
if lines and lines[-1]=='': lines.pop()
N = len(lines)
# section definitions: id, title, start, end (inclusive, 1-based)
SECTIONS = [
("A1","Nagłówek i importy",1,284),
("A2","Typy i CityPanelConfig",285,608),
("B","Stan kolejek i edycja kolejki (drag/reorder)",609,859),
("C","Narzędzia formatowania, ETA, skala",860,1038),
("D","Model widoku miasta (CityView, computeView)",1039,1347),
("E","Podział pracy, żywność, wzrost",1348,1636),
("F","Snap imperium i paski zasobów (lokalne)",1637,1754),
("G","Stałe, zakładki, ikony marki",1755,1947),
("H","Style CSS (ensureStyles)",1948,3014),
("I","Porządek i zdrowie (order, society)",3015,3550),
("J","Zdrowie, surowce, żywność (karty)",3551,3835),
("K","Kultura i religia",3836,4221),
("L","Wspólne bloki szczegółów (breakdown, chipy)",4222,4637),
("M","Ekonomia: handel, skarbiec, praca",4638,5193),
("N","Magazyn",5194,5473),
("O","Górny pasek i karty szczegółów",5474,6092),
("P","Akcje kolejki, ikony budowy, scroll-list",6093,6477),
("Q","Budynki: dane, utrzymanie, wymagania, infokarta",6478,7135),
("R","Karty techów i prymitywy szczegółów",7136,7464),
("S","Karty budynku/jednostki (entity-card + legacy)",7465,8049),
("T","Rekrutacja i kolejka rekrutacji/budowy",8050,8428),
("U","Lista produkcji, budowy i rekrutacji",8429,9256),
("V","Budowle posiadane i garnizon",9257,9494),
("W","Okolica i podgląd pracowanych kafli",9495,10157),
("X","Stan modułu, nawigacja, szkielet, most UX",10158,10383),
("Y","Pasek W3 (chipy przepływów)",10384,10693),
("Z","Pasek zasobów cywilizacji, nagłówek, szyny, zamknięcie",10694,10844),
("AA","Handel: karta i suwaki",10845,11055),
("AB","Chrome mapy, profile okolicy/budowy, lista budowy",11056,11474),
("AC","Pasek statystyk i helpery sekcji",11475,11539),
("AD","Zakładki, szyny ikon, malowanie sekcji",11540,11947),
("AE","Publiczne API wejścia",11948,11986),
]
cov = [0]*(N+2)
for sid,_,a,b in SECTIONS:
    for i in range(a,b+1): cov[i]+=1
bad=[i for i in range(1,N+1) if cov[i]!=1]
assert not bad, ('coverage problem', bad[:10])
sec_of = {}
for sid,_,a,b in SECTIONS:
    for i in range(a,b+1): sec_of[i]=sid
decl_re = re.compile(r'^(?:export\s+)?(?:async\s+)?(?:function|const|let|class|interface|type)\s+([A-Za-z_$][\w$]*)')
defs = {}
for i,l in enumerate(lines,1):
    m = decl_re.match(l)
    if m: defs.setdefault(m.group(1), sec_of[i])
imp_names = {}
text_imp = '\n'.join(lines[:284])
for m in re.finditer(r"import\s+(type\s+)?\{([^}]*)\}\s+from\s+'([^']+)'", text_imp):
    for n in m.group(2).split(','):
        n=n.strip()
        if not n: continue
        n=re.sub(r'^type\s+','',n)
        n=n.split(' as ')[-1].strip()
        imp_names[n]=m.group(3)
for m in re.finditer(r"import\s+([A-Za-z_]\w*)\s+from\s+'([^']+)'", text_imp):
    imp_names[m.group(1)]=m.group(2)
ident_re = re.compile(r'(?<![\w$.])([A-Za-z_$][\w$]*)')
out = {'sections':[], 'total_lines':N}
for sid,title,a,b in SECTIONS:
    body = '\n'.join(lines[a-1:b])
    idents = set(ident_re.findall(body))
    deps=set(); mods=collections.Counter(); names=set()
    for idn in idents:
        if idn in defs and defs[idn]!=sid and sid not in ('A1','A2'):
            deps.add(defs[idn])
        if idn in imp_names:
            names.add(idn); mods[imp_names[idn]]+=1
    out['sections'].append({'id':sid,'title':title,'from':a,'to':b,'loc':b-a+1,
        'deps_sections':sorted(deps),'imports_modules':sorted(mods.keys()),
        'imported_names':sorted(names)})
out['total_loc_sum']=sum(s['loc'] for s in out['sections'])
json.dump(out, open(sys.argv[2],'w',encoding='utf-8'), ensure_ascii=False, indent=1)
print('LOC sum', out['total_loc_sum'], 'lines', N)
for s in out['sections']:
    print(f"{s['id']:3} {s['loc']:5} {s['from']:5}-{s['to']:<5} deps={','.join(s['deps_sections'])}")

# SCC (Tarjan) on section graph
graph={s['id']:set(s['deps_sections']) for s in out['sections']}
idx={}; low={}; st=[]; on=set(); sccs=[]; c=[0]
import sys as _s
_s.setrecursionlimit(10000)
def strong(v):
    idx[v]=low[v]=c[0]; c[0]+=1; st.append(v); on.add(v)
    for w in graph[v]:
        if w not in idx: strong(w); low[v]=min(low[v],low[w])
        elif w in on: low[v]=min(low[v],idx[w])
    if low[v]==idx[v]:
        comp=[]
        while True:
            w=st.pop(); on.discard(w); comp.append(w)
            if w==v: break
        sccs.append(sorted(comp))
for v in graph:
    if v not in idx: strong(v)
print('SCC>1:', [c for c in sccs if len(c)>1])
out['sccs']=[c for c in sccs if len(c)>1]
json.dump(out, open(sys.argv[2],'w',encoding='utf-8'), ensure_ascii=False, indent=1)
