import re, collections
D='/home/user/The-Game/dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1'
txt=open(D+'/scratch-r5/stage1.md',encoding='utf-8').read()
lines=txt.split('\n')
sec_start=[i for i,l in enumerate(lines) if l.startswith('## 3. Katalog')][0]
sec_end=[i for i,l in enumerate(lines) if l.startswith('### 3.F')][0]
st=collections.Counter(); cls=collections.Counter(); ids=[]
for l in lines[sec_start:sec_end]:
    if not re.match(r'^\| E-[0-9]{2} ', l): continue
    cells=[c.strip() for c in l.strip().strip('|').split(' | ')]
    ids.append(cells[0])
    if len(cells)==10: s=cells[8]; c=cells[9]
    elif len(cells)==8: s=cells[6]; c=cells[7]
    else: raise SystemExit('bad cols %s %d'%(cells[0],len(cells)))
    m=re.match(r'\**(GOTOWY|CZĘŚCIOWY|BRAK|WYKLUCZONY)',s.replace('**',''))
    st[m.group(1) if m else 'INNE:'+s[:20]]+=1
    tok=re.findall(r'\*\*([LHWKDS])\*\*|^([LHWKDS])\b',c.replace('**',''))
    cls[c[:1].replace('*','')]+=1
print('rows',len(ids),'unique',len(set(ids)))
print('status',dict(st))
print('class first char',dict(cls))
print('S-class cells:', sum(1 for l in lines if re.search(r'\| \**S\** \|',l) or re.search(r'\|\s*\*\*S\*\*',l)))
print('BRAK-39 mentions:', [i+1 for i,l in enumerate(lines) if re.search(r'BRAK[^|\n]{0,12}39|39[^|\n]{0,12}BRAK',l)])
