#!/usr/bin/env python3
"""Niezalezny weryfikator (python3 -I) wektorow R-RUSTPORT-P6-DYPLOMACJA-PROFIL-WOJNY-POKOJU-Q1.
Przelicza z samych WEJSC wektorow (parametry, wiersze macierzy, wartosci) wyniki funkcji profilu wojny/pokoju
wlasna implementacja w Pythonie (bez Rust i bez kodu weba; semantyka JS: Math.min/max z propagacja NaN, Math.round
przez Fraction, Number->String wg ECMA-262) i porownuje BITOWO z wartosciami wygenerowanymi przez web.
Uzycie: verify-p6-dypl2.py <VECTORS_DIR> <CIV_MATRIX_JSON> <AI_PARAMS_JSON> [--negative]
--negative: kontrola negatywna (celowo zepsuta Math.round) -> weryfikator MUSI wykryc rozbieznosci.
"""
import json, math, struct, sys
from fractions import Fraction

vdir, matrix_path, ai_path = sys.argv[1], sys.argv[2], sys.argv[3]
NEG = "--negative" in sys.argv
INF = float("inf")
NAN = float("nan")


def num(s):
    if s is None:
        return None
    return NAN if s == "undefined" else float(s)


def bits(x):
    return struct.pack("<d", x)


def same(a, b):
    return (a != a and b != b) or bits(a) == bits(b)


def jmin(a, b):
    if a != a or b != b:
        return NAN
    if a == b:
        return a if bits(a)[7] & 0x80 else b  # Math.min(+0, -0) = -0
    return a if a < b else b


def jmax(a, b):
    if a != a or b != b:
        return NAN
    if a == b:
        return b if bits(a)[7] & 0x80 else a  # Math.max(+0, -0) = +0
    return a if a > b else b


def clamp(v, lo, hi):
    return jmin(hi, jmax(lo, v))


def jround(x):
    if NEG:
        return float(math.floor(x)) if math.isfinite(x) else x  # zepsute: floor zamiast round
    if not math.isfinite(x) or x == 0:
        return x
    r = math.floor(Fraction(x) + Fraction(1, 2))
    if r == 0 and x < 0:
        return -0.0
    return float(r)


def js_num_str(x):
    if x != x:
        return "NaN"
    if x == 0:
        return "0"
    if x in (INF, -INF):
        return "Infinity" if x > 0 else "-Infinity"
    sign = "-" if x < 0 else ""
    r = repr(abs(x))
    # r: '123.45', '1e-07', '1.5e+22', '1e+21'
    if "e" in r:
        mant, ex = r.split("e")
        ex = int(ex)
    else:
        mant, ex = r, 0
    if "." in mant:
        ip, fp = mant.split(".")
    else:
        ip, fp = mant, ""
    digits = (ip + fp).lstrip("0")
    lead_zeros = len(ip + fp) - len((ip + fp).lstrip("0"))
    # pozycja przecinka dziesietnego wzgledem poczatku `digits`
    n_pos = len(ip) + ex - lead_zeros
    digits = digits.rstrip("0") or "0"
    k = len(digits)
    n = n_pos
    if k <= n <= 21:
        body = digits + "0" * (n - k)
    elif 0 < n <= 21:
        body = digits[:n] + "." + digits[n:]
    elif -6 < n <= 0:
        body = "0." + "0" * (-n) + digits
    else:
        e = n - 1
        es = "+" if e >= 0 else "-"
        body = digits[0] + ("." + digits[1:] if k > 1 else "") + "e" + es + str(abs(e))
    return sign + body


def parse_params(o):
    if isinstance(o, dict):
        return {k: parse_params(v) for k, v in o.items() if not k.startswith("_")}
    return num(o)


def load(name):
    with open(f"{vdir}/{name}.json", encoding="utf-8") as f:
        return json.load(f)


n_ok = 0
bad = []


def chk(cond, msg):
    global n_ok
    if cond:
        n_ok += 1
    elif len(bad) < 40:
        bad.append(msg)
    else:
        bad.append(None)


def chkn(a, b, msg):
    chk(same(a, b), f"{msg}: py={a!r} web={b!r}")


# ------------------------------------------------------------------ profil
real_matrix = json.load(open(matrix_path, encoding="utf-8"))
real_rows = [
    {"typ": c["typCywilizacji"], "cyw": c["Cywilizacja"], "ikona": c["ikonaId"], "params": {k: float(v) for k, v in c["params"].items()}}
    for c in real_matrix["cywilizacje"]
]
ai_real = json.load(open(ai_path, encoding="utf-8"))["dyplomacja_zdrowie_armii_pokój"]["wartosc"]


def find_row(rows, key):
    k = key.lower()
    for r in rows:
        if r["typ"].lower() == k or r["ikona"].lower() == k or r["cyw"].lower() == k:
            return r
    return None


def ai_val(raw):
    if raw == "REAL":
        return float(ai_real)
    if raw in ("MISSING", "NOENTRY"):
        return None
    v = json.loads(raw)
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        return None
    return float(v) if math.isfinite(float(v)) else None


def profile(P, rows, aiv, key):
    zb = aiv if aiv is not None else P["progZdrowia"]["baza"]
    row = find_row(rows, key) if key else None
    if row is None:
        H = P["hamulecRelacji"]
        return [key, False, 5.0, 3.0, 2.0, 5.0, 5.0, False, P["progWojnyRelacji"]["bazaBrakDanych"], P["progPokojSlabosc"]["bazaBrakDanych"], P["progKrytyczny"]["bazaBrakDanych"], zb, P["minTurWojny"]["bazaBrakDanych"], P["zmeczenie"]["bazaTurBrakDanych"], clamp(jround(H["bazaN"] - H["wagaProgWojny"] * 5), H["minN"], H["maxN"])]
    p = row["params"]
    dip = p.get("dip_prog_wojny", 5.0)
    agr = p.get("ai_agresywnosc", 5.0)
    eks = p.get("ai_ekspansywnosc", 3.0)
    pod = p.get("ai_sklonnosc_podboju", 2.0)
    risk = p.get("ai_tolerancja_ryzyka", 5.0)
    obr = p.get("ai_profil_obronna", 0.0) == 1.0
    W = P["progWojnyRelacji"]
    pw = clamp(W["baza"] + W["wagaProgWojny"] * dip + W["wagaEkspansja"] * (eks - W["ekspansjaSrodek"]) + W["wagaPodboj"] * (pod - W["podbojSrodek"]), W["min"], W["max"])
    S = P["progPokojSlabosc"]
    ps = clamp(S["baza"] - S["wagaAgresja"] * (agr - S["agresjaSrodek"]) + (S["premiaProfilObronny"] if obr else 0.0), S["min"], S["max"])
    K = P["progKrytyczny"]
    pk = clamp(K["baza"] - K["wagaAgresja"] * (agr - K["agresjaSrodek"]), K["min"], K["max"])
    Z = P["progZdrowia"]
    pz = clamp(zb - Z["wagaTolerancja"] * (risk - Z["tolerancjaSrodek"]), Z["min"], Z["max"])
    M = P["minTurWojny"]
    mt = jround(clamp(M["baza"] + (M["premiaAgresjaWysoka"] if agr >= M["agresjaWysoka"] else 0.0) + (M["karaAgresjaNiska"] if agr <= M["agresjaNiska"] else 0.0) + (M["karaProfilObronny"] if obr else 0.0), M["min"], M["max"]))
    T = P["zmeczenie"]
    zt = jmin(T["maksTur"], T["bazaTur"] + T["wagaAgresja"] * agr)
    H = P["hamulecRelacji"]
    hn = clamp(jround(H["bazaN"] - H["wagaProgWojny"] * dip), H["minN"], H["maxN"])
    return [key, True, agr, eks, pod, risk, dip, obr, pw, ps, pk, pz, mt, zt, hn]


def eq_profile(got, want, ctx):
    chk(got[0] == want[0], f"{ctx} civKey {got[0]!r} {want[0]!r}")
    chk(got[1] == want[1] and got[7] == want[7], f"{ctx} flagi")
    for i in [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14]:
        chkn(got[i], num(want[i]), f"{ctx} pole[{i}]")


prof = load("profile")
PS = [parse_params(p) for p in prof["paramsets"]]
syn = [{"typ": r["typ"], "cyw": r["cyw"], "ikona": r["ikona"], "params": {k: num(v) for k, v in r["params"].items()}} for r in prof["synRows"]]
for i, c in enumerate(prof["cases"]):
    rows = real_rows if c["m"] < 0 else syn
    raw = prof["aiVariants"][c["ai"]][1]
    got = profile(PS[c["p"]], rows, ai_val(raw), c["k"])
    eq_profile(got, c["out"], f"profil#{i} key={c['k']!r}")


# ------------------------------------------------------------------ zmeczenie
def frac(t, T):
    turns = jmax(0.0, t) if math.isfinite(t) else 0.0
    if not (T > 0) or turns <= 0:
        return 0.0
    return jmin(1.0, turns / T)


wear = load("weariness")
ms = num(wear["maxShare"])
chkn(ms, 0.5, "maxShare")
for c in wear["cases"]:
    t, T = num(c[0]), num(c[1])
    chkn(frac(t, T), num(c[2]), f"fraction {c[0]} {c[1]}")
    chkn(ms * frac(t, T), num(c[3]), f"share {c[0]} {c[1]}")

# ------------------------------------------------------------------ rejestr


def rec_in(r):
    if r is None:
        return None
    return {"od": num(r["od"]), "u": {k: num(v) for k, v in r["u"].items()}, "o": num(r["o"])}


def wstate(rec, od, key, turn):
    valid = rec if (rec is not None and rec["od"] == od) else None  # Python: NaN == NaN False, jak JS ===
    lost = valid["u"].get(key, 0.0) if valid is not None else 0.0
    since_base = valid["o"] if (valid is not None and valid["o"] is not None) else od
    return [jmax(0.0, turn - od), lost, jmax(0.0, turn - since_base)]


rc = load("record")
for i, c in enumerate(rc["cases"]):
    prev, od, turn = rec_in(c["prev"]), num(c["od"]), num(c["turn"])
    if c["kind"] == "loss":
        # prev.od === od: porownanie jak w JS (NaN nie rowne)
        use_prev = prev is not None and prev["od"] == od
        u = dict(prev["u"]) if use_prev else {}
        u[c["key"]] = u.get(c["key"], 0.0) + 1.0
        want = rec_in(c["out"])
        chkn(od, want["od"], f"loss#{i} od")
        chkn(turn, want["o"], f"loss#{i} ostatnia")
        chk(sorted(u) == sorted(want["u"]), f"loss#{i} klucze")
        for k in u:
            chkn(u[k], want["u"].get(k, NAN), f"loss#{i} u[{k}]")
    else:
        got = wstate(prev, od, c["key"], turn)
        for j in range(3):
            chkn(got[j], num(c["out"][j]), f"state#{i}[{j}]")

# ------------------------------------------------------------------ brake
for c in load("brake")["cases"]:
    P = PS[c["p"]]
    chkn(num(c["x"]) - P["hamulecRelacji"]["progKryzysuMinusPunkty"], num(c["out"]), f"brake {c['x']}")

# ------------------------------------------------------------------ sygnaly
sg = load("signals")
for i, c in enumerate(sg["cases"]):
    P = PS[c["p"]]
    pf = [None, True] + [None] * 13
    pfv = c["pf"]
    ps_, zd, zt = num(pfv[9]), num(pfv[11]), num(pfv[13])
    rw, t, l = num(c["in"][0]), num(c["in"][1]), num(c["in"][2])
    s = num(c["in"][3]) if c["in"][3] is not None else None
    h = num(c["in"][4]) if c["in"][4] is not None else None
    S = P["sygnalyPokoju"]
    r = []
    if rw <= ps_:
        r.append("a")
    if l >= 1 and rw <= S["progRwMiasta"]:
        r.append("b")
    since = s if s is not None else t
    if t >= S["patTurWojny"] and since >= S["patBrakZmianyTur"]:
        r.append("d")
    if frac(t, zt) >= P["zmeczenie"]["progSygnaluPokoju"]:
        r.append("e")
    if h is not None and h < zd:
        r.append("c")
    chk(r == c["out"][1] and (len(r) > 0) == c["out"][0], f"sygnaly#{i} py={r} web={c['out']}")

# ------------------------------------------------------------------ ceny
def civ_mult(P, agr, pod):
    C = P["cenaPokoju"]
    return clamp(1 + C["wagaAgresja"] * (agr - C["agresjaSrodek"]) + C["wagaPodboj"] * (pod - C["podbojSrodek"]), C["mnoznikCywMin"], C["mnoznikCywMax"])


def str_mult(P, rw):
    C = P["cenaPokoju"]
    if rw >= C["progSilyWysoki"]:
        return jmin(C["maxMnoznikSily"], 1 + C["wagaSily"] * (rw - 0.5))
    if rw <= C["progSilyNiski"]:
        return C["mnoznikSilyNiski"]
    return 1.0


pr = load("price")
for i, c in enumerate(pr["cases"]):
    P = PS[c["p"]]
    if c["k"] == "s":
        chkn(str_mult(P, num(c["rw"])), num(c["out"]), f"sila#{i}")
    else:
        chkn(civ_mult(P, num(c["pf"][2]), num(c["pf"][4])), num(c["out"]), f"cyw#{i}")

# ------------------------------------------------------------------ bramka
gt = load("gate")
verd = {"ok": 0, "too_early": 0, "stronger": 0}
for i, c in enumerate(gt["cases"]):
    P = PS[c["p"]]
    C = P["cenaPokoju"]
    agr, pod, mint = num(c["pf"][2]), num(c["pf"][4]), num(c["pf"][12])
    rw, t, l = num(c["in"][0]), num(c["in"][1]), num(c["in"][2])
    turns = jmax(0.0, t)
    fs = rw >= C["odrzucenieRwProg"] and l == 0 and turns < C["odrzucenieMaxTurWojny"]
    chk(fs == c["fs"], f"feeling#{i}")
    if turns < mint:
        out = ["too_early", 1.0, f"za wcześnie na pokój — AI wymaga co najmniej {js_num_str(mint)} tur wojny (obecnie {js_num_str(turns)})"]
    elif turns >= C["turyBezOgraniczenAi"]:
        out = ["ok", jmin(1.0, civ_mult(P, agr, pod)), None]
    elif fs:
        out = ["stronger", 1.0, "AI czuje się silniejsze — odrzuca pokój, dopóki nie straci miasta lub nie minie więcej tur wojny"]
    else:
        out = ["ok", str_mult(P, rw) * civ_mult(P, agr, pod), None]
    verd[out[0]] += 1
    chk(out[0] == c["out"][0] and out[2] == c["out"][2], f"bramka#{i} verdykt/reason py={out[0]},{out[2]!r} web={c['out'][0]},{c['out'][2]!r}")
    chkn(out[1], num(c["out"][1]), f"bramka#{i} mnoznik")

# ------------------------------------------------------------------ main.ts rdzenie
mc = load("main_cores")
for i, c in enumerate(mc["cases"]):
    k = c["k"]
    if k == "army":
        hp = mx = 0.0
        for u in c["units"]:
            if u[0] != c["owner"] or u[1]:
                continue
            m = num(u[2])
            if not (m > 0):
                continue
            uh = m if u[3] is None else num(u[3])
            hp += jmax(0.0, jmin(m, uh))
            mx += m
        got = hp / mx if mx > 0 else None
        want = num(c["out"]) if c["out"] is not None else None
        chk((got is None) == (want is None) and (got is None or same(got, want)), f"army#{i} py={got} web={want}")
    elif k == "wsf":
        if not c["atWar"]:
            chk(c["out"] == ["0", "0", "0", None], f"wsf#{i} poza wojna")
        else:
            stamp = num(c["stamp"]) if c["stamp"] is not None else num(c["turn"])
            got = wstate(rec_in(c["rec"]), stamp, c["key"], num(c["turn"]))
            for j in range(3):
                chkn(got[j], num(c["out"][j]), f"wsf#{i}[{j}]")
            chkn(stamp, num(c["out"][3]), f"wsf#{i} stempel")
    elif k == "rel":
        t = num(c["t"])
        want_called = t > 0
        chk(c["called"] == want_called, f"rel#{i} leniwosc")
        chkn(num(c["out"][0]), t, f"rel#{i} t")
        if want_called:
            chk((c["out"][3] is None) == (c["h"] is None), f"rel#{i} h")
        else:
            chk(c["out"][3] is None, f"rel#{i} h poza wojna")
    elif k == "pws":
        chk((c["out"] is None) == (not c["atWar"]), f"pws#{i}")
        if c["atWar"]:
            chk(c["out"][:3] == ["4", "1", "2"], f"pws#{i} pola")
            chkn(num(c["out"][3]), num(c["rw"]), f"pws#{i} rw")
    elif k == "brk":
        P = PS[c["p"]]
        a, b = c["a"], c["b"]
        higher = a if num(a[8]) >= num(b[8]) else b
        chkn(num(higher[8]) - P["hamulecRelacji"]["progKryzysuMinusPunkty"], num(c["out"][0]), f"brk#{i} prog")
        chkn(num(higher[14]), num(c["out"][1]), f"brk#{i} n")

for b in bad[:40]:
    if b:
        print("ROZBIEZNOSC:", b)
print(f"sprawdzen OK: {n_ok}, rozbieznosci: {len(bad)}; werdykty bramki: {verd}")
sys.exit(0 if (not bad) != NEG else 1)
