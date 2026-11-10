"""P4.7 r2 — rachunek budzetu kart nowych modeli (zarzuty E2, E9; python3 -I <ta sciezka>).

Liczy tri/mesh kazdej karty miasta (8 zestawow Brazu x L1..L10, 10 nakladek Zelaza x L4..L10)
oraz tri/mesh/promien per wierzcholek 5 kart cudow. Reguly trojkatow = three r169 jak w
three-mock.js: Box 12, Cyl(n) 4n, Cone(n) 2n, Circle(n) n, pryzma = Cyl3 = 12. 1 bryla = 1 mesh.
Kompozycje = §3.2–3.4 dokumentu P4-7 (r2). Budzety = wyniki/measure.txt (r1, niezmienione).
Wynik: wyniki/budzet_kart.txt; EXIT 1, jesli jakakolwiek karta przekracza budzet.
"""
import math, os, sys

T = {"B": 12, "C3": 12, "C4": 16, "C5": 20, "C6": 24, "C8": 32, "C10": 40, "K4": 8, "K5": 10, "K6": 12, "K8": 16, "O6": 6}

def P(*items):
    """items: (rodzaj, liczba) -> (mesh, tri)."""
    m = sum(n for _, n in items); t = sum(T[k] * n for k, n in items)
    return (m, t)

def add(*xs):
    return (sum(x[0] for x in xs), sum(x[1] for x in xs))

def mul(x, n):
    return (x[0] * n, x[1] * n)

BUD_TRI = [207, 313, 517, 596, 694, 834, 886, 969, 1017, 1087]
BUD_MESH = [17, 26, 42, 48, 55, 66, 71, 77, 80, 86]
MUR = 368
# Harmonogram §3.0 (r2: liczby jawne). Skumulowane liczby na poziom L1..L10.
DOMY = [0, 1, 2, 3, 4, 4, 6, 6, 7, 8]
PIETROWE = [0, 0, 0, 0, 0, 1, 1, 2, 2, 2]
REKW = [0, 1, 2, 2, 3, 4, 4, 5, 5, 6]
DRUGO = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
WSPOLNE = P(("O6", 1), ("B", 1), ("C5", 1), ("B", 1))  # plac Circle6 + sciezka + maszt Cyl5 + proporzec
ULICE = P(("B", 2))

S = {}
# --- 8 zestawow Brazu (r2) ---
S["B-ME"] = dict(v1=P(("B", 3)), v2=P(("C4", 1), ("B", 5)), v3=P(("C4", 1), ("B", 7)),
                 dom=P(("B", 3)), domp=P(("B", 4)),
                 rek=[P(("C5", 1), ("B", 2)), P(("B", 1)), P(("C6", 1), ("K6", 1)), P(("C6", 1), ("K6", 1))],
                 drugo=P(("B", 2)), mur=P(("B", 18 + 4)), ulice_od=7)
S["B-EG"] = dict(v1=P(("B", 2), ("C4", 2)), v2=P(("C4", 2), ("B", 3), ("C5", 1), ("B", 1)),
                 v3=add(P(("C4", 2), ("B", 3), ("C5", 1), ("B", 1)), P(("B", 2), ("K4", 2)), P(("B", 1), ("C5", 4))),
                 dom=P(("B", 3)), domp=P(("B", 4)),
                 rek=[P(("C5", 1), ("B", 2)), P(("C6", 1), ("K6", 1)), P(("B", 2)), P(("B", 1))],
                 drugo=P(("B", 2)), mur=P(("B", 18 + 1), ("C4", 2)), ulice_od=7)
S["B-IN"] = dict(v1=add(P(("C6", 1), ("B", 1)), ULICE), v2=P(("B", 7)), v3=P(("B", 7 + 5)),
                 dom=P(("B", 3)), domp=P(("B", 4)),
                 rek=[P(("C6", 1)), P(("B", 1)), P(("C5", 1))],
                 drugo=P(("B", 1)), mur=P(("B", 16 + 8 + 2)), ulice_od=None)
S["B-AL"] = dict(v1=P(("B", 4)), v2=P(("B", 4 + 1 + 2 + 1)), v3=P(("B", 8 + 2 + 8)),
                 dom=P(("B", 4)), domp=P(("B", 5)),
                 rek=[P(("C5", 1), ("K5", 2)), P(("C5", 1)), P(("B", 1))],
                 drugo=P(("B", 2)), mur=P(("B", 12 + 12)), ulice_od=7)
S["B-EP"] = dict(v1=P(("C8", 1), ("K8", 1), ("B", 1)), v2=P(("B", 1 + 2 + 1 + 2 + 1)),
                 v3=add(P(("B", 7)), P(("B", 6), ("C6", 1), ("B", 1))),
                 dom=P(("B", 4)), domp=P(("B", 5)),  # liczone wariantem drozszym (dlugi dom); okragly = Cyl6+Cone6+drzwi = 3/48
                 rek=[P(("K6", 1)), P(("B", 4)), P(("B", 2))],
                 drugo=P(("B", 3)), mur=add(P(("B", 24)), P(("B", 1), ("K4", 1))), ulice_od=7)
S["B-AZ"] = dict(v1=P(("B", 3), ("C4", 1), ("C5", 2)),
                 v2=add(P(("B", 4)), P(("B", 3), ("C4", 1), ("C5", 2)), mul(P(("B", 1), ("C4", 1)), 2), P(("B", 1), ("C4", 1))),
                 v3=add(P(("B", 4)), P(("B", 3), ("C4", 2), ("C5", 2)), mul(P(("B", 1), ("C4", 1)), 2), P(("B", 1), ("C4", 1))),
                 dom=P(("B", 2), ("C4", 1)), domp=P(("B", 3), ("C4", 1)),
                 rek=[P(("C5", 1), ("K5", 2)), P(("C6", 1)), P(("C5", 1))],
                 drugo=P(("B", 1), ("C4", 1)), mur=P(("B", 12 + 12 + 1), ("C4", 1)), ulice_od=7)
DOM_AN = P(("B", 1), ("C3", 1), ("C4", 1))
S["B-AN"] = dict(v1=mul(DOM_AN, 2), v2=add(P(("B", 3)), mul(DOM_AN, 4)),
                 v3=add(P(("B", 2), ("C3", 1), ("C4", 1)), P(("B", 3)), mul(DOM_AN, 4), P(("B", 3))),
                 dom=DOM_AN, domp=add(DOM_AN, P(("B", 1))),
                 rek=[P(("B", 3)), P(("C5", 1))],
                 drugo=P(("C6", 1), ("K6", 1)), mur=P(("B", 19), ("C4", 1)), ulice_od=7)
CHATA = P(("C6", 1), ("K6", 1), ("B", 1))
S["B-AF"] = dict(v1=add(P(("B", 6)), P(("B", 2)), CHATA),                                   # 6 pali + 1 krowa (2 box) + chata wodza
                 v2=add(P(("B", 10)), P(("B", 4)), P(("C8", 1), ("K8", 1), ("B", 1))),          # 10 pali + 2 krowy + wielka chata
                 v3=add(P(("B", 10)), P(("B", 4)), P(("C8", 1), ("K8", 1), ("B", 1)), P(("B", 5))),  # + isigodlo 5 pali
                 dom=CHATA, domp=P(("C8", 1), ("K8", 1), ("B", 1)),
                 rek=[P(("B", 2), ("K6", 1)), P(("K4", 1), ("B", 1))],
                 drugo=P(("C8", 1), ("K8", 1), ("B", 1)), mur=P(("B", 10 + 14 + 3)), ulice_od=None)  # bez ulic: uklad kolisty

# --- nakladki Zelaza na nowych zestawach (v2z L4-6, v3z L7-10, dom_z zastepuje ceil(n/3) domow, mur_z) ---
Z = {}
Z["Z-ME"] = dict(baza="B-ME", v2=P(("B", 5)), v3=P(("B", 10)), domz=P(("B", 4)), mur=P(("B", 26)))
Z["Z-EG"] = dict(baza="B-EG", v2=add(S["B-EG"]["v2"], P(("C5", 6))), v3=add(S["B-EG"]["v2"], P(("C5", 6)), P(("B", 8))),
                 domz=P(("B", 4)), mur=P(("B", 16 + 4 + 1), ("C4", 2)))
Z["Z-IN"] = dict(baza="B-IN", v2=P(("B", 10)), v3=P(("B", 17)), domz=P(("B", 4)), mur=P(("B", 26)))
Z["Z-AL"] = dict(baza="B-AL", v2=add(P(("B", 2 + 4)), mul(P(("C6", 1), ("B", 1)), 2)),
                 v3=add(P(("B", 2 + 4)), mul(P(("C6", 1), ("B", 1)), 2), P(("B", 3))),
                 domz=P(("B", 5)), mur=add(P(("B", 13)), P(("C6", 6))))
Z["Z-EP"] = dict(baza="B-EP", v2=add(S["B-EP"]["v2"], P(("B", 1), ("K4", 2))),
                 v3=add(S["B-EP"]["v2"], P(("B", 1), ("K4", 2)), P(("B", 2), ("K4", 1))),   # + wieza: korpus + platforma + dach Cone4
                 domz=P(("B", 5)), mur=add(P(("B", 24)), P(("B", 1), ("K4", 1))))
# Z-SL — wariant „grod slowianski” (D-NM-4 = wariant 2): katina + kuznia; v3 + wal grodu wewn. + brama-wieza; domy-polziemianki
Z["Z-SL"] = dict(baza="B-EP", v2=add(P(("B", 4)), P(("B", 1), ("K4", 2))),
                 v3=add(P(("B", 4)), P(("B", 1), ("K4", 2)), P(("B", 6)), P(("B", 1), ("K4", 1))),
                 domz=P(("B", 3)), mur=add(P(("B", 16 + 8)), P(("B", 1), ("K4", 1))))
Z["Z-AZ"] = dict(baza="B-AZ", v2=S["B-AZ"]["v3"], v3=add(S["B-AZ"]["v3"], mul(P(("B", 1), ("C4", 1)), 2)),
                 domz=P(("B", 2), ("C4", 1)), mur=P(("B", 12 + 12 + 1 + 2), ("C4", 1)))
Z["Z-AN"] = dict(baza="B-AN", v2=add(mul(DOM_AN, 4), P(("B", 4))),
                 v3=add(P(("B", 2), ("C3", 1), ("C4", 1)), P(("B", 4)), mul(DOM_AN, 4), P(("B", 2)), P(("B", 3))),  # mur wewn. 2 + tarasy 3
                 domz=add(DOM_AN, P(("B", 1))), mur=P(("B", 19), ("C4", 1)))
Z["Z-AF"] = dict(baza="B-AF", v2=add(P(("B", 12)), P(("B", 4)), P(("C8", 1), ("K8", 1), ("B", 1))),
                 v3=add(P(("B", 8)), P(("B", 4)), P(("C8", 1), ("K8", 1), ("B", 1)), P(("B", 4)), CHATA),  # isibaya 8 + krowy + wielka chata + isigodlo 4 pali + 1 chata
                 domz=CHATA, mur=P(("B", 8 + 16 + 3)))

def city(card, L, z=None):
    i = L - 1
    centrum = card["v1"] if L <= 3 else (card["v2"] if L <= 6 else card["v3"])
    domy, piet = DOMY[i], PIETROWE[i]
    domz_n = 0
    if z is not None and L >= 4:
        centrum = z["v2"] if L <= 6 else z["v3"]
        domz_n = math.ceil((domy + piet) / 3)
    d_reg = max(0, domy - domz_n)
    parts = [WSPOLNE, centrum, mul(card["dom"], d_reg), mul(card["domp"], piet)]
    if z is not None and domz_n:
        parts.append(mul(z["domz"], domz_n))
    rek = card["rek"]
    parts += [rek[k % len(rek)] for k in range(REKW[i])]
    if DRUGO[i]:
        parts.append(card["drugo"])
    if card["ulice_od"] is not None and L >= card["ulice_od"]:
        parts.append(ULICE)
    return add(*parts)

out, bad = [], []
def chk(name, L, mt):
    ok = mt[0] <= BUD_MESH[L - 1] and mt[1] <= BUD_TRI[L - 1]
    if not ok: bad.append(f"{name} L{L} {mt}")
    return ("" if ok else " PRZEKROCZONE")

out.append("## MIASTA BRAZ — karta: mesh/tri na poziom (budzet mesh/tri) + mur kamienny")
for nm, c in S.items():
    row, prev = [], -1
    for L in range(1, 11):
        mt = city(c, L)
        flag = chk(nm, L, mt)
        if mt[1] <= prev: bad.append(f"{nm} L{L} niemonotoniczne tri"); flag += " NIEMONOTONICZNE"
        prev = mt[1]
        row.append(f"L{L}={mt[0]}/{mt[1]}{flag}")
    murok = "" if c["mur"][1] <= MUR else " PRZEKROCZONE"
    if murok: bad.append(f"{nm} mur {c['mur']}")
    out.append(f"{nm}\t" + "  ".join(row) + f"\tmur={c['mur'][0]}/{c['mur'][1]} (<= {MUR}){murok}")

out.append("## ZELAZO — nakladki na nowych zestawach, L4..L10")
for nm, z in Z.items():
    c = S[z["baza"]]
    row, prev = [], city(c, 3)[1]
    for L in range(4, 11):
        mt = city(c, L, z)
        flag = chk(nm, L, mt)
        if mt[1] <= prev: bad.append(f"{nm} L{L} niemonotoniczne tri"); flag += " NIEMONOTONICZNE"
        prev = mt[1]
        row.append(f"L{L}={mt[0]}/{mt[1]}{flag}")
    murok = "" if z["mur"][1] <= MUR else " PRZEKROCZONE"
    if murok: bad.append(f"{nm} mur {z['mur']}")
    out.append(f"{nm}\t" + "  ".join(row) + f"\tmur={z['mur'][0]}/{z['mur'][1]}{murok}")

# --- Z-GR / Z-RZ: delta wzgledem zmierzonych zestawow webu (wyniki/measure.txt, sekcja MODULY) ---
GR = dict(tri=[190, 258, 418, 474, 602, 710, 746, 850, 886, 922], mesh=[15, 20, 33, 37, 46, 55, 57, 65, 68, 71])
RZ = dict(tri=[196, 298, 522, 622, 682, 778, 838, 898, 922, 1018], mesh=[15, 23, 41, 49, 54, 61, 66, 71, 73, 80])
MEGARON, MYKEN, ETRUSK, DOM_GR, CAPANNA = (15, 212), (14, 200), (15, 196), (3, 36), (7, 96)
ZGR_v2 = P(("B", 3 + 1 + 1), ("C3", 1), ("C5", 8))            # krepidoma 3 + cella + drzwi + dach + 8 kolumn
ZGR_v3 = P(("B", 3 + 1 + 1), ("C3", 1), ("C5", 6), ("B", 6))  # heksastyl + teatr 3 rzedy x 2 segmenty
DOM_GR_Z = P(("B", 2), ("C3", 1))                               # dom z dachem dwuspadowym = 3/36
INSULA = P(("B", 2), ("C3", 1))                                 # korpus + drzwi + dach-pryzma = 3/36
FORUM, BAZYLIKA, AKWEDUKT = P(("B", 1)), P(("B", 1), ("C3", 1)), P(("B", 5))
def zlimit(base, L):  # nakladka na zestaw webu: <= max(budzet, pomiar zestawu bazowego)
    return (max(BUD_MESH[L - 1], base["mesh"][L - 1]), max(BUD_TRI[L - 1], base["tri"][L - 1]))
out.append("## Z-GR / Z-RZ — delta centrum+domow wzgledem zmierzonej Grecji/Rzymu; limit = max(budzet, pomiar bazy)")
for L in range(4, 11):
    d = (ZGR_v2 if L <= 6 else ZGR_v3); base = MEGARON if L <= 6 else MYKEN
    mt = (GR["mesh"][L - 1] + d[0] - base[0], GR["tri"][L - 1] + d[1] - base[1])  # domy Zelaza 3/36 = domGrecki 3/36 -> delta 0
    lim = zlimit(GR, L); ok = mt[0] <= lim[0] and mt[1] <= lim[1]
    if not ok: bad.append(f"Z-GR L{L} {mt} > {lim}")
    out.append(f"Z-GR L{L}: {mt[0]}/{mt[1]} (limit {lim[0]}/{lim[1]}){'' if ok else ' PRZEKROCZONE'}")
for L in range(4, 11):
    # L4-6: 2 capanny -> 2 insule, + forum + bazylika; L7-10: 2 z capann -> insule, + forum + bazylika + akwedukt
    swap = mul((INSULA[0] - CAPANNA[0], INSULA[1] - CAPANNA[1]), 2)
    extra = add(FORUM, BAZYLIKA) if L <= 6 else add(FORUM, BAZYLIKA, AKWEDUKT)
    mt = (RZ["mesh"][L - 1] + swap[0] + extra[0], RZ["tri"][L - 1] + swap[1] + extra[1])
    lim = zlimit(RZ, L); ok = mt[0] <= lim[0] and mt[1] <= lim[1]
    if not ok: bad.append(f"Z-RZ L{L} {mt} > {lim}")
    out.append(f"Z-RZ L{L}: {mt[0]}/{mt[1]} (limit {lim[0]}/{lim[1]}){'' if ok else ' PRZEKROCZONE'}")

# --- cuda: bryly z pozycja -> tri/mesh + promien per wierzcholek (wewn., x R; limit 0,50) ---
def verts(kind, a, pos, rot_y=0.0):
    """kind 'B' a=(w,h,d); 'C'/'K' a=(rt,rb,h,seg) — zwraca promienie xz wierzcholkow."""
    x0, y0, z0 = pos; cy, sy = math.cos(rot_y), math.sin(rot_y); pts = []
    if kind == "B":
        w, h, d = a; pts = [(sx * w / 2, sz * d / 2) for sx in (-1, 1) for sz in (-1, 1)]
    else:
        rt, rb, h, seg = a
        for r in (rt, rb):
            pts += [(r * math.sin(i / seg * 2 * math.pi), r * math.cos(i / seg * 2 * math.pi)) for i in range(seg)]
    return [math.hypot(x0 + px * cy + pz * sy, z0 - px * sy + pz * cy) for px, pz in pts]

def wonder(name, bryly):
    m = len(bryly); t = 0; r = 0.0
    for b in bryly:
        kind, a, pos = b[0], b[1], b[2]; ry = b[3] if len(b) > 3 else 0.0
        t += 12 if kind == "B" else (4 * a[3] if kind == "C" else 2 * a[3])
        r = max(r, max(verts(kind, a, pos, ry)))
    ok = m <= 25 and t <= 320 and r <= 0.50
    if not ok: bad.append(f"cud {name} {m}/{t} r={r:.3f}")
    out.append(f"cud {name}\tmesh={m}\ttri={t}\tmaxR_wewn_wierzch={r:.3f} (limit 0.50){'' if ok else ' PRZEKROCZONE'}")
    return m, t

q = math.pi / 4
cards = {
    "nalanda": [("B", (0.15, 0.10, 0.15), (-0.10, 0, z)) for z in (-0.16, 0, 0.16)]
               + [("B", (0.07, 0.012, 0.07), (-0.10, 0.10, z)) for z in (-0.16, 0, 0.16)]
               + [("B", (s, 0.08, s), (0.14, 0, 0)) for s in (0.16, 0.12, 0.08)]
               + [("B", (0.03, 0.06, 0.03), (0.14 + dx, 0.08, dz)) for dx in (-0.06, 0.06) for dz in (-0.06, 0.06)],
    "angkor_wat": [("B", (s, 0.05, s), (0, 0, 0)) for s in (0.44, 0.34, 0.24)]
                  + [x for dx, dz in ((-0.13, -0.13), (-0.13, 0.13), (0.13, -0.13), (0.13, 0.13))
                     for x in (("C", (0.025, 0.04, 0.10, 6), (dx, 0.10, dz)), ("K", (0, 0.03, 0.06, 6), (dx, 0.20, dz)))]
                  + [("C", (0.025, 0.04, 0.14, 6), (0, 0.15, 0)), ("K", (0, 0.03, 0.06, 6), (0, 0.29, 0))]
                  + [("B", (0.52, 0.01, 0.04), (0, 0, s)) for s in (-0.25, 0.25)]
                  + [("B", (0.04, 0.01, 0.44), (s, 0, 0)) for s in (-0.25, 0.25)]
                  + [("B", (0.10, 0.012, 0.06), (0.30, 0, 0))],
    "wielki_dzwon": [("B", (0.30, 0.04, 0.30), (0, 0, 0))]
                    + [("C", (0.015, 0.015, 0.20, 5), (dx, 0.04, dz)) for dx in (-0.10, 0.10) for dz in (-0.10, 0.10)]
                    + [("C", (0.05, 0.20, 0.08, 4), (0, 0.24, 0), q), ("K", (0, 0.03, 0.04, 4), (0, 0.32, 0), q),
                       ("B", (0.22, 0.02, 0.02), (0, 0.22, 0)), ("C", (0.035, 0.055, 0.09, 8), (0, 0.12, 0)),
                       ("B", (0.02, 0.02, 0.02), (0, 0.21, 0))],
    "mauzoleum_teodoryka": [("C", (0.20, 0.20, 0.12, 10), (0, 0, 0)), ("C", (0.15, 0.15, 0.08, 10), (0, 0.12, 0)),
                            ("C", (0.10, 0.17, 0.04, 10), (0, 0.20, 0))]
                           + [("B", (0.03, 0.025, 0.02), (0.165 * math.cos(a), 0.22, 0.165 * math.sin(a)), a) for a in (0, math.pi / 2, math.pi, 3 * math.pi / 2)]
                           + [("B", (0.08, 0.02, 0.06), (0.24, 0, 0)), ("B", (0.08, 0.02, 0.06), (0.24, 0.02, 0))],
    # Monks Mound (wariant 1 D-NM-7): kopiec Cyl4 rb 0,40 (r2: z 0,44), taras -x 0,06, rampa przy +x
    "kopiec_grobowy (Monks Mound)": [("C", (0.27, 0.40, 0.12, 4), (0, 0, 0), q), ("C", (0.14, 0.21, 0.08, 4), (-0.06, 0.12, 0), q),
                                     ("B", (0.18, 0.02, 0.08), (0.32, 0.05, 0)), ("B", (0.10, 0.06, 0.08), (-0.06, 0.20, 0)),
                                     ("C", (0.06, 0.06, 0.11, 3), (-0.06, 0.26, 0))],
    # kurhan celtycki (wariant 2 D-NM-7): kopiec Cyl8 + krepis kamieni + stela + 2 drzewa-strazniki
    "kopiec_grobowy (kurhan)": [("C", (0.18, 0.34, 0.10, 8), (0, 0, 0)), ("C", (0.06, 0.18, 0.06, 8), (0, 0.10, 0))]
                               + [("B", (0.04, 0.03, 0.04), (0.37 * math.cos(a), 0, 0.37 * math.sin(a)), a) for a in [i * math.pi / 4 for i in range(8)]]
                               + [("B", (0.025, 0.12, 0.012), (0.36, 0, 0)), ("C", (0.012, 0.012, 0.06, 5), (-0.30, 0, 0.22)),
                                  ("K", (0, 0.05, 0.10, 5), (-0.30, 0.06, 0.22))],
}
out.append("## CUDA PARKOWANE — karty (budzet <= 25 mesh, <= 320 tri, maxR_wewn_wierzch <= 0,50)")
for n, b in cards.items():
    wonder(n, b)
out.append("WYNIK: " + ("OK — wszystkie karty w budzecie" if not bad else "PRZEKROCZENIA: " + "; ".join(bad)))
txt = "\n".join(out)
here = os.path.dirname(os.path.abspath(__file__))
open(os.path.join(os.path.dirname(here), "wyniki", "budzet_kart.txt"), "w", encoding="utf-8").write(txt + "\n")
print(txt)
sys.exit(1 if bad else 0)
