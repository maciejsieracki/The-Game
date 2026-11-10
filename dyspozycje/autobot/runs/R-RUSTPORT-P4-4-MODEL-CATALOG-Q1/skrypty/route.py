"""Symulacja routingu modeli jednostek (§2.1, §2.1b, §2.1c).

Odtwarza `buildUnitModel` z `gra/src/render/units.ts` na pinie:
  1. category === 'super' i nazwa pasuje do SUPER_Z_MODELEM_NAZWANYM -> buildNamedUnit (gdy nie-null);
     w przeciwnym razie buildSuperUnit(cultureFromName(nazwa)).
  2. buildNamedUnit(normName(nazwa)) — reguły `if (...) return X(` z ciała funkcji (tłumaczone 1:1).
  3. buildCategoryModel(category) + applyCultureOverrides.
Kategoria = categoryOf(typeId PL, 'Rola (linia)', Super, 'Typ') (units/setup.ts:239; wołane tak w main.ts:3943,9335,...).
Nazwa podawana do buildUnitModel: PL (mapa: units.ts:6075/6093 typeId; unitMiniPreview.ts:90)
albo EN („Nazwa EN”; battleScene.ts:4198/4366/5102/16262 przez fallback `stats['Jednostka'] ?? bu.nazwa`).
Uruchom: python3 -I .../skrypty/route.py
"""
import json
import os
import re
import sys
import unicodedata
from collections import Counter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pin import show  # noqa: E402

SRC = show('gra/src/render/units.ts')
L = SRC.split('\n')


def norm(s):
    s = unicodedata.normalize('NFD', s or '')
    s = re.sub('[̀-ͯ]', '', s)
    return s.replace('Ł', 'l').replace('ł', 'l').lower()


# --- reguły buildNamedUnit -------------------------------------------------
start = next(i for i, l in enumerate(L) if l.startswith('function buildNamedUnit('))
end = next(i for i in range(start + 1, len(L)) if L[i] == '}')
body = L[start + 1:end]
rules = []
i = 0
while i < len(body):
    ln = body[i].strip()
    if ln.startswith('if (') and re.search(r'\bn\b', ln):
        txt, j = ln, i
        while True:
            depth, stop = 0, None
            for k, ch in enumerate(txt):
                if ch == '(':
                    depth += 1
                elif ch == ')':
                    depth -= 1
                    if depth == 0:
                        stop = k
                        break
            if stop is not None:
                break
            j += 1
            txt += ' ' + body[j].strip()
        cond, rest = txt[3:stop + 1], txt[stop + 1:]
        m = re.search(r'return\s+(\w+)\(', rest) or re.search(r'return\s+(null)', rest)
        if not m:
            k = j + 1
            while 'return' not in body[k]:
                k += 1
            m = re.search(r'return\s+(\w+)\(', body[k])
        tgt = m.group(1)
        pc = (cond.replace('!==', ' != ').replace('===', ' == ').replace('&&', ' and ').replace('||', ' or ')
              .replace('!n.', ' not n.'))
        pc = re.sub(r"n\.includes\(('[^']*')\)", r"(\1 in n)", pc)
        rules.append((pc, tgt, start + 2 + i))
        i = j + 1
        continue
    i += 1

SUPRE = re.compile(re.search(r'const SUPER_Z_MODELEM_NAZWANYM =\s*/(.*?)/;', SRC, re.S).group(1))


def named(n):
    for pc, t, ln in rules:
        if eval(pc, {}, {'n': n}):  # noqa: S307 — warunki z pliku, tylko `in`/==/and/or/not
            return (None if t == 'null' else t), ln
    return None, None


def culture(name):
    n = norm(name)
    if any(k in n for k in ('evocati', 'triarii', 'triari', 'legionist', 'hastati')): return 'rzym'
    if any(k in n for k in ('hieros', 'zastep', 'falanga', 'hoplit')): return 'grecja'
    if any(k in n for k in ('hu ben', 'tygrys', 'chins', 'kusznik')): return 'chiny'
    if any(k in n for k in ('thulwana', 'biale tarcz', 'impi', 'izijula', 'zulu')): return 'zulu'
    if any(k in n for k in ('krolewska gwardia', 'chaska', 'huaracoc', 'estolic', 'inka', 'ink')): return 'inka'
    if any(k in n for k in ('medzaj', 'faraon', 'khopesh', 'egip')): return 'egipt'
    if any(k in n for k in ('sumeru', 'sumer', 'qurub')): return 'sumer'
    if any(k in n for k in ('germansk', 'germanic', 'germanie')): return 'germanie'
    return 'neutral'


def super_unit(name):
    c = culture(name)
    if c == 'rzym':
        return 'buildTriari' if 'triari' in norm(name) else 'buildSuperRome'
    return {'grecja': 'buildSuperGreece', 'germanie': 'buildGermanSuper'}.get(c, "buildCategoryModel('super')")


def category_of(name, role, sup, typ):
    if sup: return 'super'
    n, r = norm(name), norm(role)
    a = lambda kws: any(k in n or k in r for k in kws)  # noqa: E731
    if 'osadnik' in n or 'osadnik' in r: return 'osadnik'
    if any(k in n for k in ('robotnik', 'worker', 'budown')) or 'robotnik' in r: return 'robotnik'
    if any(k in n for k in ('zwiadowca', 'scout', 'zwiad')) or 'zwiadowca' in r: return 'zwiadowca'
    if any(k in n for k in ('galera', 'galley', 'okret', 'statek')) or 'morsk' in r or 'naval' in r: return 'galera'
    if a(('rydwan', 'chariot')): return 'rydwan'
    if a(('konnic', 'jezdz', 'jazd', 'kawaler', 'rycerz', 'cavalry', 'horse')): return 'konnica'
    if any(k in n for k in ('falanga', 'hoplit', 'phalanx')): return 'falanga'
    if any(k in n for k in ('legionist', 'hastati', 'legion')): return 'legionista'
    if a(('wloczn', 'pikinier', 'spear', 'impi')): return 'wlocznik'
    if a(('miecz', 'sword', 'gladi', 'khopesh')): return 'miecznik'
    if a(('luczn', 'archer', 'kusznik', 'crossbow')): return 'lucznik'
    if a(('procarz', 'sling')): return 'procarz'
    if a(('oszczep', 'javelin', 'atlatl', 'estolic')): return 'oszczepnik'
    if a(('maczug', 'chaska', 'club', 'mace', 'champi')): return 'maczuga'
    if a(('topor', 'axe')): return 'topor'
    if a(('taran', 'katapult', 'oblezn', 'siege', 'battering', 'trebuchet')): return 'obleznicza'
    if 'tyrren' in n: return 'topor'
    t = norm(typ or '')
    return {'swordsman': 'miecznik', 'spearman': 'wlocznik', 'falangite': 'falanga', 'mount': 'konnica',
            'distance': 'lucznik', 'slinger': 'procarz', 'naval': 'galera', 'siege': 'obleznicza'}.get(t, 'domyslny')


def route(name, cat):
    n = norm(name)
    if cat == 'super':
        if SUPRE.search(n):
            t, ln = named(n)
            if t:
                return t, ln
        return super_unit(name), None
    t, ln = named(n)
    if t:
        return t, ln
    return f"buildCategoryModel('{cat}')", None


U = json.loads(show('gra/data/units.json'))
rows = []
for u in U:
    sup = str(u.get('Super-jednostka') or '').strip().upper().startswith('T')
    cat = category_of(u['Jednostka'], u.get('Rola (linia)') or '', sup, u.get('Typ'))
    pl, pll = route(u['Jednostka'], cat)
    en_name = u.get('Nazwa EN') or ''
    en, enl = route(en_name, cat) if en_name else ('—', None)
    rows.append((u['Jednostka'], en_name, u.get('Epoka'), cat, 'S' if sup else '', pl, pll, en, enl))

if __name__ == '__main__':
    print('RULES', len(rules), 'DISTINCT_RULE_TARGETS', len({t for _, t, _ in rules if t != 'null'}))
    for r in rows:
        flag = 'DIFF' if r[5] != r[7] else 'same'
        print(f"{r[0]} | EN={r[1]} | {r[2]} | cat={r[3]} | {r[4]} | PL→{r[5]}@{r[6]} | EN→{r[7]}@{r[8]} | {flag}")
    pl_routes = [r[5] for r in rows]
    print('PL_DISTINCT_ROUTES', len(set(pl_routes)))
    print('PL_CATEGORY_FALLBACK', [r[0] for r in rows if r[5].startswith('buildCategoryModel')])
    diffs = [r for r in rows if r[5] != r[7]]
    print('EN_DIFF_COUNT', len(diffs))
    for r in diffs:
        print('  EN_DIFF', r[0], '/', r[1], ':', r[5], '->', r[7])
    targets = {t for _, t, _ in rules if t != 'null'}
    used_pl = set(pl_routes)
    used_en = {r[7] for r in rows}
    print('UNUSED_BY_PL', sorted(targets - used_pl))
    print('UNUSED_BY_PL_AND_EN', sorted(targets - used_pl - used_en))
    print('ROUTE_COUNTS_PL', Counter(pl_routes).most_common(4))
