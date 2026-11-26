# Model: swiezo zdobyte miasto (pop 5, epoka 1, trudnosc normal) - Szczescie, Prawo, Porzadek.
# UWAGA: to REIMPLEMENTACJA wzorow z kodu (gra/src/game/society-breakdown.ts, order.ts,
# post-capture-law.ts, culture-religion.ts) w Pythonie, NIE bundle esbuild z gry.
# Wartosci parametrow z gra/data/society-params.json (normal) i buildings.json (swiatynia baza=2).
# Uruchomienie: python3 -I dyspozycje/analizy/model-kultura-religia-2026-11-26.py
import math

def r1(x):  # zaokraglenie jak clampPct: 0.1
    return round(x * 10) / 10

def clamp(x, lo, hi):
    return min(hi, max(lo, x))

# --- parametry (normal, era 1) ---
X_ERA1 = 10          # szczescie_skala_kultura_religia[0] (normal)
SZ_MAX_BASE = 30     # szczescie_max_epoka[0][normal]
PR_MAX_BASE = 35     # prawo_max_epoka[0][normal]
POP = 5
POP_REF = 2
POP_WSP = 0.04
MULT = round((1 + POP_WSP) ** (POP - POP_REF), 2)   # popScaleMultiplier
SZ_MAX = round(SZ_MAX_BASE * MULT, 2)              # 33.6
PR_MAX = round(PR_MAX_BASE * MULT, 2)              # 39.2
PER_UNIT = 20        # prawo_garnizon_per_jednostka (normal)
CAP_UNITS = 5        # prawo_garnizon_cap_jednostek (normal)
SZ_CAP = 120         # SZ_PCT_CAP
PR_CAP = 170         # prawo_pct_cap
TEMPLE = 2           # swiatynia: baza zadowolenie (poziom 1)
WAGA_SZ = 0.5
WAGA_PR = 0.5
PORPCT_CAP = 120

def happy_line(x, share):           # szczescie = 2*x*udzial - x
    return 2 * x * share - x

def porpct(n_units, own_culture, own_religion, temple, x=X_ERA1,
           clamp_sz=True, post_capture_law=False):
    kult = happy_line(x, own_culture)
    rel = happy_line(x, own_religion)
    sz_net = kult + rel + (TEMPLE if temple else 0)
    sz_pct = 100 * sz_net / SZ_MAX
    if clamp_sz:
        sz_pct = r1(clamp(sz_pct, 0, SZ_CAP))
    else:
        sz_pct = r1(min(SZ_CAP, sz_pct))
    pr_net = PER_UNIT * min(n_units, CAP_UNITS)
    pr_pct = r1(clamp(100 * pr_net / PR_MAX, 0, PR_CAP))
    if post_capture_law:
        pr_pct = 100.0
    por = r1(clamp(WAGA_SZ * sz_pct + WAGA_PR * pr_pct, 0, PORPCT_CAP))
    return sz_pct, pr_pct, por

def band(p):
    if p >= 90: return 'lad'
    if p >= 70: return 'spokoj'
    if p >= 50: return 'napiecie'
    if p >= 30: return 'niepokoj'
    if p >= 12: return 'bunt'
    return 'bunt_skrajny'

def tier(p):
    if p >= 90: return 'order'
    if p >= 30: return 'neutral'
    return 'unrest'

SCEN = [('a) wlasna kultura + wlasna religia', 1, 1),
        ('b) obca kultura, wlasna religia',   0, 1),
        ('c) wlasna kultura, obca religia',   1, 0),
        ('d) obca kultura + obca religia',    0, 0)]

def min_units(own_c, own_r, temple, target=30, **kw):
    for n in range(0, CAP_UNITS + 2):
        if porpct(n, own_c, own_r, temple, **kw)[2] >= target:
            return n
    return None   # nieosiagalne

def table(label, **kw):
    print(f'== {label}')
    print('scenariusz | swiatynia | garn | Sz% | Pr% | Por% | pasmo | tier')
    for name, c, r in SCEN:
        for temple in (False, True):
            for n in (0, 1, 2, 4, 6):
                sz, pr, por = porpct(n, c, r, temple, **kw)
                print(f'{name} | {"tak" if temple else "nie"} | {n} | {sz} | {pr} | {por} | {band(por)} | {tier(por)}')
    print('-- minimalna liczba jednostek do tier neutral (Por% >= 30):')
    for name, c, r in SCEN:
        print(f'   {name}: bez swiatyni={min_units(c, r, False, **kw)}, ze swiatynia={min_units(c, r, True, **kw)}')
    print()

if __name__ == '__main__':
    table('MALY = obecne wartosci (Sz obciete do 0%)', clamp_sz=True)
    table('MALY + prawo 100% (post-capture law, 5 tur po podboju)', clamp_sz=True, post_capture_law=True)
    print('== Wariant bez obciecia Sz od dolu (tylko cap 120); x (era 1) = 10 / 12 / 14 / 16:')
    for x in (10, 12, 14, 16):
        print(f'-- x = {x}')
        for name, c, r in SCEN:
            print(f'   {name}: bez swiatyni={min_units(c, r, False, x=x, clamp_sz=False)}, ze swiatynia={min_units(c, r, True, x=x, clamp_sz=False)}')
