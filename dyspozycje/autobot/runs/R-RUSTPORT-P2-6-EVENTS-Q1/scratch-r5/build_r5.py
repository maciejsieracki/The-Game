import csv, re, os, subprocess
D = '/home/user/The-Game/dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1'
S = D + '/scratch-r5'
P = '/home/user/The-Game/dyspozycje/rust-port/p2/P2-6-EVENTS.md'
doc = open(P, encoding='utf-8').read().split('\n')

def read_tsv(p):
    with open(p, encoding='utf-8') as f:
        return [l.rstrip('\n').split('\t') for l in f if l.strip()]

files = [l.split('\t') for l in open(S + '/r5.tsv', encoding='utf-8').read().strip().split('\n')]
broad = {a: int(b) for a, b in files}
s5 = {}
for l in open(S + '/s5.tsv', encoding='utf-8').read().strip().split('\n'):
    a, b, c = l.split('\t'); s5[a] = int(c)
extra = {}
for l in open(S + '/extra.tsv', encoding='utf-8').read().strip().split('\n'):
    parts = l.split('\t')
    extra[parts[0]] = parts[2].strip() if len(parts) > 2 else ''
r4 = {}
for row in read_tsv(D + '/pokrycie-gra-src-edb8fb56-r4.tsv')[1:]:
    r4[row[0]] = (row[3], row[4] if len(row) > 4 else '')

catrows = [l for l in doc if re.match(r'^\| E-[0-9]{2} ', l)]
def cat_ids(path):
    parts = path.split('/')
    if len(parts) < 4 or parts[-1] == 'main.ts':
        return []
    rel = parts[-2] + '/' + parts[-1]
    base = parts[-1][:-3]
    distinctive = ('-' in base) or any(ch.isupper() for ch in base) or len(base) >= 10
    pats = [rel] + ([base + '.ts'] if distinctive else [])
    ids = []
    for l in catrows:
        if any(re.search(r'(?<![A-Za-z0-9_/-])' + re.escape(q) + r'(?![A-Za-z0-9_-])', l) for q in pats):
            for e in re.findall(r'E-[0-9]{2}', l):
                if e not in ids: ids.append(e)
    return ids

line355 = doc[354]
map355 = dict((m.group(1), m.group(2)) for m in re.finditer(r'`ui/([A-Za-z]+)\.ts` \((E-[0-9]{2})\)', line355))

manual = {
 'gra/src/battle/battleTerrainTooltip.ts': ('ROZSTRZYGNIETY-R5', 'WYKLUCZONY: `parts.push({text})` (:45-85) buduje etykiety tooltipa terenu po najechaniu (akcja gracza / hover); nie komunikat logiki tury.'),
 'gra/src/game/defenseBreakdown.ts': ('ROZSTRZYGNIETY-R5', 'WYKLUCZONY: `out.push({tekst})` (:304-310) rozbicie obrony do podglądu; dane prezentacji, nie komunikat tury.'),
 'gra/src/game/economy.ts': ('ROZSTRZYGNIETY-R5', 'WYKLUCZONY: fałszywy pozytyw S5 (`BuildingHappinessCatalogEntry`, :541-555) - typ katalogu danych.'),
 'gra/src/game/production.ts': ('ROZSTRZYGNIETY-R5', 'WYKLUCZONY: fałszywy pozytyw S5 (`BuildingCatalogEntry`, :2168-2201) - typ katalogu danych.'),
 'gra/src/game/save.ts': ('ROZSTRZYGNIETY-R5', 'WYKLUCZONY z katalogu: `issues.push({code,message})` (:1101-1111) zwraca problemy wczytywanego zapisu do wywołującego (akcja gracza: wczytanie); nie event tury. Zakres: P2.7.'),
 'gra/src/ui/entityCards/buildingAdapter.ts': ('ROZSTRZYGNIETY-R5', 'WYKLUCZONY: `sections.push`/`reqRows.push` (:215-313) - sekcje karty budynku, prezentacja danych.'),
 'gra/src/ui/entityCards/wonderAdapter.ts': ('ROZSTRZYGNIETY-R5', 'WYKLUCZONY: `bonusRows.push` (:128) - wiersz karty cudu, prezentacja danych.'),
 'gra/src/ui/unitCtxDockDiploGate.ts': ('ROZSTRZYGNIETY-R5', 'WYKLUCZONY: `notifyDiploUiVisibilityChange` (:24) - powiadomienie UI->UI o widoczności; nie logika->UI.'),
 'gra/src/game/era-change-notify.ts': ('POKRYTY-R5', 'POKRYTY: E-27 (eksport buildera HTML toastu; wywołania w main.ts:14366, :14408; P2-6 sekcja 9.2).'),
 'gra/src/game/diplomacy-border-march.ts': ('POKRYTY-R5', 'POKRYTY: E-10 (klasyfikator skutków `classifyPlayerBorderMarchNotice` :254; wywołania main.ts:5180-5219; P2-6 sekcja 9.2).'),
 'gra/src/game/diplomacy-tech-trade.ts': ('WYKLUCZONY-R5', 'WYKLUCZONY: S5 trafienia to wyłącznie komentarze do `showHintMessage` (:126, :149; testy); kod pliku nie wywołuje komunikatu. Wiersz katalogu: sekcja 1 (linia 68).'),
 'gra/src/ui/cityPanel.ts': ('WYKLUCZONY-R5', 'WYKLUCZONY: trafienia to `addEventListener` (drag and drop, kliknięcia) = reakcja UI na akcję gracza (P2-6 sekcja 9.2).'),
 'gra/src/ui/scienceHubHud.ts': ('WYKLUCZONY-R5', 'WYKLUCZONY: reakcja UI na akcję gracza; `showTechDiscoveryNotice` (:337) po kliknięciu gracza. Modal techa z logiki = E-26 (P2-6 sekcja 9.2).'),
}

rows = []
stats = {}
for path in [l.strip() for l in open(S + '/ts.txt', encoding='utf-8') if l.strip()]:
    base = os.path.basename(path)[:-3]
    b = broad.get(path, 0); c5 = s5.get(path, 0); e6 = extra.get(path, '')
    ids = cat_ids(path)
    if path == 'gra/src/main.ts':
        st, dz = 'POKRYTY-zrodlo', 'Źródło wszystkich wywołań komunikatów: E-01…E-60 (wywołania `showHintMessage` i wpisy kronik rozpisane w sekcji 3 i załącznikach A/B).'
    elif path in manual:
        st, dz = manual[path]
    elif ids:
        st, dz = 'POKRYTY', 'POKRYTY: ' + ', '.join(ids) + ' (wiersze sekcji 3).'
    elif base in map355:
        st, dz = 'POKRYTY', 'POKRYTY: ' + map355[base] + ' (mapowanie modułu w P2-6 sekcja 9.2, linia 355).'
    elif r4.get(path, ('', ''))[1]:
        rs, dz = r4[path][0], r4[path][1]
        st = 'ROZSTRZYGNIETY-R4' if rs == 'ROZSTRZYGNIETY-R4' else 'ROZSTRZYGNIETY'
    elif c5 > 0:
        raise SystemExit('UNRESOLVED S5>0: ' + path)
    elif e6:
        st = 'WYKLUCZONY-S6'
        dz = 'WYKLUCZONY: S5=0; S6 = wywołania ' + e6.replace('  ', ' ').strip() + ' (otwarcie panelu, hover, ładowanie, API przeglądarki); nie komunikat logiki tury.'
    else:
        st = 'WYKLUCZONY-ZERO'
        dz = 'WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki.'
    rows.append([path, str(b), str(c5), e6 if e6 else '0', st, dz])
    stats[st] = stats.get(st, 0) + 1

with open(D + '/pokrycie-gra-src-edb8fb56-r5.tsv', 'w', encoding='utf-8') as f:
    f.write('sciezka\tszeroki_r5_broad\tsygnal_S5\tS6_nazwy\tstatus_r5\tdyspozycja_r5\n')
    for r in rows: f.write('\t'.join(r) + '\n')
print(len(rows), stats)
