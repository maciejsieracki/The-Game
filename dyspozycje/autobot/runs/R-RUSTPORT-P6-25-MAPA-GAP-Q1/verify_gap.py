#!/usr/bin/env python3
"""Niezalezna kontrola binarnego kryterium sukcesu P6-25 na WYNIKOWYM dokumencie (parsuje markdown, nie dane skryptu).
Uzycie: verify_gap.py <WEB_ROOT> <doc.md>
Sprawdza: (1) 25 plikow web = 25 wierszy §3; (2) liczba wierszy §4 = liczba eksportow policzona OSOBNYM regexem po zrodle;
(3) kazdy plik web ma wiersze w §4; (4) ID tematow unikalne i kazde odwolane `temat` w §4 istnieje w §6; (5) brak pustych statusow;
(6) RUNDA 2: LOC tematow = niepuste linie zakresow, zakresy rozlaczne, kazdy symbol §4 w zakresie swojego tematu, wzorce tests/p6_m<id>_*,
domkniecie M09 (callgraph-rivals.txt) w zakresie M09, §6b ujawnia zasieg kontroli kolizji."""
import os, re, sys

web, doc = sys.argv[1], sys.argv[2]
mapdir = os.path.join(web, 'gra', 'src', 'map')
files = sorted(f for f in os.listdir(mapdir) if f.endswith('.ts'))
txt = open(doc, encoding='utf-8').read()

# (2) niezalezne liczenie eksportow: osobny regex (inny niz inventory_map.py)
total = 0
per = {}
for f in files:
    src = open(os.path.join(mapdir, f), encoding='utf-8').read()
    n = len(re.findall(r'(?m)^export\s+(?:declare\s+)?(?:async\s+)?(?:abstract\s+)?(?:function|const|let|var|class|interface|enum)\s', src))
    n += len(re.findall(r'(?m)^export\s+type\s+[A-Za-z_$]', src))
    for m in re.finditer(r'(?ms)^export\s+(?:type\s+)?\{([^}]*)\}', src):
        n += len([x for x in m.group(1).split(',') if x.strip()])
    n += len(re.findall(r'(?m)^export\s+\*', src))
    per[f] = n
    total += n

sec4 = txt.split('## 4. Tabela per symbol')[1].split('## 5.')[0]
rows4 = [l for l in sec4.split('\n') if re.match(r'\| \d+ \| `', l)]
sec3 = txt.split('## 3. Tabela per plik')[1].split('## 4.')[0]
rows3 = [l for l in sec3.split('\n') if re.match(r'\| \d+ \| `', l)]
print(f'pliki web = {len(files)}; wiersze §3 = {len(rows3)}')
print(f'eksporty (niezalezny regex) = {total}; wiersze §4 = {len(rows4)}')
ok = True
if len(files) != len(rows3):
    ok = False; print('BLAD: liczba plikow != wiersze §3')
if total != len(rows4):
    ok = False; print('BLAD: liczba eksportow != wiersze §4')
cnt4 = {}
for l in rows4:
    fn = re.match(r'\| \d+ \| `([^:`]+):\d+`', l).group(1)
    cnt4[fn] = cnt4.get(fn, 0) + 1
for f in files:
    if per[f] != cnt4.get(f, 0):
        ok = False; print(f'BLAD: {f}: niezalezny regex {per[f]} != wiersze §4 {cnt4.get(f, 0)}')
sec6 = txt.split('## 6. Backlog')[1].split('### 6a.')[0]
ids = re.findall(r'`R-RUSTPORT-P6-(M\w+?)-[A-Z0-9-]+-Q1`', sec6)
print('tematy backlogu:', len(ids), 'unikalnych:', len(set(ids)))
if len(ids) != len(set(ids)):
    ok = False; print('BLAD: duplikaty ID')
used = set()
for l in rows4:
    cells = [c.strip() for c in re.split(r'(?<!\\)\|', l)]
    # kolumny: '', #, plik:linia, symbol, rodzaj, klasa, LOC, uzywane, rust, status, test, temat, uwagi, ''
    status, temat = cells[9], cells[11]
    if status not in ('ISTNIEJE-ZWERYFIKOWANE', 'CZĘŚCIOWO', 'BRAK', 'NIE-DOTYCZY'):
        ok = False; print('BLAD: status', status, l[:80])
    if temat != '-':
        used.add(temat)
missing = used - set(ids)
print('tematy uzyte w §4 ale nieobecne w §6:', sorted(missing))
if missing:
    ok = False

# (6) RUNDA 2: zakresy tematow (rozlaczne, LOC, symbole w zakresach), wzorce testow, wycinek M09, zasieg kontroli kolizji
def nonempty(fn, lo, hi):
    L = open(os.path.join(mapdir, fn), encoding='utf-8').read().split('\n')
    return sum(1 for x in L[lo - 1:hi] if x.strip())


topics = {}
for l in sec6.split('\n'):
    m = re.match(r'\| `R-RUSTPORT-P6-(M\w+?)-[A-Z0-9-]+-Q1` \| (\d+) \| (\S+) \| ([^|]*) \| ([^|]*) \|', l)
    if m:
        topics[m.group(1)] = dict(loc=int(m.group(2)), ranges=[(f, int(a), int(b)) for f, a, b in re.findall(r'`([^`]+\.ts)`:(\d+)-(\d+)', m.group(4))],
                                  allow=re.findall(r'`([^`]+)`', m.group(5)))
owner = {}
for tid, t in topics.items():
    calc = sum(nonempty(f, a, b) for f, a, b in t['ranges'])
    if calc != t['loc']:
        ok = False; print(f'BLAD: {tid}: LOC w tabeli {t["loc"]} != niepuste linie zakresow {calc}')
    for f, a, b in t['ranges']:
        for ln in range(a, b + 1):
            if (f, ln) in owner and owner[(f, ln)] != tid:
                ok = False; print(f'BLAD: zakresy {tid} i {owner[(f, ln)]} nachodza na {f}:{ln}'); break
            owner[(f, ln)] = tid
    tl = tid.lower()
    for need in (f'tests/p6_{tl}_*.rs', f'tests/p6_{tl}_vectors/**'):
        if tid != 'M00' and need not in t['allow']:
            ok = False; print(f'BLAD: allowlista {tid} bez wzorca {need}')
    bad = [x for x in t['allow'] if x.startswith('tests/') and not x.startswith(f'tests/p6_{tl}_')]
    if bad:
        ok = False; print(f'BLAD: allowlista {tid} ma wzorce testow innego tematu: {bad}')
print('tematy z zakresami:', len(topics), '; LOC i rozlacznosc zakresow sprawdzone')
out = 0
for l in rows4:
    cells = [c.strip() for c in re.split(r'(?<!\\)\|', l)]
    fl, temat = cells[2].strip('`'), cells[11]
    if temat == '-':
        continue
    f, ln = fl.split(':')
    if owner.get((f, int(ln))) != temat:
        out += 1; ok = False; print(f'BLAD: symbol {cells[3]} ({fl}) temat {temat} poza zakresem tematu (wlasciciel linii: {owner.get((f, int(ln)))})')
print('symbole poza zakresem swojego tematu:', out)
# wycinek M09: kazda deklaracja domkniecia rywali (poza juz portowanymi) lezy w zakresie M09
here = os.path.dirname(os.path.abspath(__file__))
skip = {'ClusterSpawnSlot', 'ForeignTypeClusterGroup'}
miss = []
cur = None
for l in open(os.path.join(here, 'callgraph-rivals.txt'), encoding='utf-8'):
    if l.startswith('-- '):
        cur = l[3:].split(':')[0]
    elif l.startswith('  ') and l.strip() and cur != 'gen-helpers.ts':
        loc_, name, n = l.rstrip('\n').split('\t')
        a, b = loc_.strip().split(':')[1].split('-')
        if name in skip:
            continue
        for ln in range(int(a), int(b) + 1):
            if owner.get((cur, ln)) != 'M09' and nonempty(cur, ln, ln):
                miss.append((cur, name, ln)); break
print('deklaracje domkniecia rywali poza zakresem M09:', miss)
if miss:
    ok = False
sec6b = txt.split('### 6b.')[1].split('### 6c.')[0]
if 'NIE_ZMIERZONO' not in sec6b or 'P6.2-P6.24' not in sec6b:
    ok = False; print('BLAD: §6b nie ujawnia zasiegu kontroli kolizji (P6.2-P6.24 NIE_ZMIERZONO)')
print('WYNIK:', 'OK' if ok else 'BLAD')
sys.exit(0 if ok else 1)
