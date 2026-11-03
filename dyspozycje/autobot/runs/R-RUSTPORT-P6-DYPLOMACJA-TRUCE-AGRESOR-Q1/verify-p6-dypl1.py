#!/usr/bin/env python3
"""Niezalezny weryfikator (python3 -I) wektorow R-RUSTPORT-P6-DYPLOMACJA-TRUCE-AGRESOR-Q1.
Przelicza WSZYSTKIE wyniki z samych wejsc wektorow wlasna implementacja (semantyka JS: NaN porownania false,
Infinity > 0 true, Math.max/floor), bez Rust i bez kodu weba, i porownuje z `out` zapisanym przez uruchomiony web.
Uzycie: verify-p6-dypl1.py <katalog_wektorow>
"""
import json, math, sys, os

D = sys.argv[1]
ok = 0
bad = []
NAN = float("nan")


def chk(cond, msg):
    global ok
    if cond:
        ok += 1
    else:
        bad.append(msg)


def dec(v):
    if v is None:
        return None
    if isinstance(v, str):
        return {"NaN": NAN, "Infinity": math.inf, "-Infinity": -math.inf}[v]
    return float(v)


def eq(a, b):
    """Rowne jak JSON: NaN == NaN po zakodowaniu; None == None."""
    if a is None or b is None:
        return a is None and b is None
    if isinstance(a, float) and math.isnan(a):
        return isinstance(b, float) and math.isnan(b)
    return a == b


def fin(x):
    return x is not None and math.isfinite(x)


def load(n):
    return json.load(open(os.path.join(D, n), encoding="utf-8"))


# ---------- TRUCE ----------
t = load("truce.json")["truce"]
OPT = (5.0, 10.0, 15.0)


def normalize(x):
    return x if fin(x) and x in OPT else None


for r in t["normalize"]:
    chk(eq(normalize(dec(r["in"])), dec(r["out"])), f"normalize {r}")
for r in t["untilTurn"]:
    d = normalize(dec(r["dur"]))
    s = dec(r["start"])
    want = None if d is None or not fin(s) else s + d
    chk(eq(want, dec(r["out"])), f"untilTurn {r}")
for r in t["active"]:
    u, tu = dec(r["until"]), dec(r["turn"])
    chk(r["out"] == (fin(u) and tu < u), f"active {r}")
for r in t["expiry"]:
    u, tu = dec(r["until"]), dec(r["turn"])
    chk(r["out"] == ("revert_to_war" if fin(u) and tu >= u else "none"), f"expiry {r}")
for r in t["breach"]:
    u, tu = dec(r["until"]), dec(r["turn"])
    chk(r["out"] == (fin(u) and tu < u), f"breach {r}")
for r in t["locked"]:
    tu = dec(r["turn"])
    u = dec(r["until"]) if r["meta"] == "peace" else None
    chk(r["out"] == (fin(u) and tu < u), f"locked {r}")


def jsmax1floor(x):
    if x is None or math.isnan(x):
        return NAN
    if math.isinf(x):
        return x if x > 0 else 1.0
    return max(1.0, float(math.floor(x)))


def jnum(x):
    """JSON.stringify liczby: NaN/Inf -> None."""
    return None if x is None or not math.isfinite(x) else x


for r in t["startLock"]:
    m = dict(r["meta"])
    turn = dec(r["turn"])
    lt = dec(r["lockTurns"])
    turns = jsmax1floor(10.0 if lt is None else lt)
    want = dict(m)
    want["peaceUntilTurn"] = jnum(turn + turns)
    want["n3Window"] = {"turn": jnum(turn), "typ": "pokoj", "charged": False}
    got = r["out"]
    # klucze i wartosci (None w oczekiwanym = null w JSON)
    chk(set(got.keys()) == set(want.keys()), f"startLock keys {r}")
    for k, v in want.items():
        chk(got.get(k) == v, f"startLock {k} {r}")
for r in t["filter"]:
    locked = {(a, b) for a, b in r["locked"]}
    want, calls = [], []
    for ob in r["obligations"]:
        allies = []
        for a in ob["obligatedAllies"]:
            calls.append([a, ob["mustDeclareWarOn"]])
            if (a, ob["mustDeclareWarOn"]) not in locked:
                allies.append(a)
        if allies:
            want.append({**ob, "obligatedAllies": allies})
    chk(want == r["out"], f"filter {r}")
    chk(calls == r["calls"], f"filter calls {r}")
for r in t["saveRound"]:
    chk(json.loads(json.dumps(r["entries"])) == r["entries"], "save round")

# ---------- GATES ----------
g = load("gates.json")["gates"]
PEACE = {"pokoj", "rozejm", "trybut_oferta"}
for r in g["peaceCurrency"]:
    chk(r["out"] == (r["id"] in PEACE), f"peaceCurrency {r}")
for r in g["nap"]:
    chk(r["out"] == r["in"], f"nap {r}")


def gt0(v):
    x = dec(v)
    return x is not None and x > 0


def basket(items):
    return bool(items) and any(i["typ"] in ("zloto", "praca") for i in items)


def has_pay(p):
    if p is None:
        return False
    if gt0(p.get("goldOnce")) or gt0(p.get("goldPerTurn")):
        return True
    return basket(p.get("giveItems")) or basket(p.get("receiveItems"))


for r in g["payload"]:
    chk(r["out"] == has_pay(r["payload"]), f"payload {r}")
for r in g["forbidden"]:
    at_war = True if r["atWar"] is None else r["atWar"]
    want = bool(at_war) and has_pay(r["payload"]) and r["id"] not in PEACE
    chk(r["out"] == want, f"forbidden {r}")

# ---------- HONOR + TREATIES ----------
h = load("honor_treaties.json")
for r in h["honor"]:
    i = r["in"]
    g_ = lambda k, d: d if i.get(k) is None else dec(i[k])
    if dec(i["allyId"]) == 0:
        want = True
    else:
        ratio, wars = dec(i["militaryRatio"]), dec(i["activeWarCount"])
        want = True
        if wars >= g_("maxWarsBeforeRefuse", 1.0):
            want = False
        elif i["peacefulArchetype"] and ratio < g_("minRatioHonorPeaceful", 0.75):
            want = False
        elif ratio < g_("minRatioHonor", 0.55):
            want = False
        elif i.get("trustToRequestingAlly") is not None and dec(i["trustToRequestingAlly"]) < g_("minTrustHonor", 20.0):
            want = False
    chk(r["out"] == want, f"honor {r}")

ALL = {"sojusz_defensywny", "sojusz_pelny", "sojusz_wojskowy"}
BREAK = {"pakt_nieagresji", "sojusz_defensywny", "sojusz_pelny", "sojusz_wojskowy", "otwarte_granice",
         "prawo_wojskowe_przemarszu", "wspolna_walka_barbarzyncy", "umowa_handlowa", "umowa_szlakow", "umowa_wymiany"}


def obligations(deals, ev):
    out = []
    for d in deals:
        if d["rodzaj"] not in ALL:
            continue
        kind = "sojusz_pelny" if d["rodzaj"] == "sojusz_wojskowy" else d["rodzaj"]
        a, b = d["strony"]
        if ev[0] == "att":
            vic, agg = ev[1], ev[2]
            if vic not in (a, b) or kind not in ("sojusz_defensywny", "sojusz_pelny"):
                continue
            ally = b if a == vic else a
            out.append({"mustDeclareWarOn": agg, "obligatedAllies": [ally], "treatyIdsToBreakOnRefusal": [d["id"]]})
        else:
            dec_, tgt = ev[1], ev[2]
            if dec_ not in (a, b) or kind != "sojusz_pelny":
                continue
            ally = b if a == dec_ else a
            out.append({"mustDeclareWarOn": tgt, "obligatedAllies": [ally], "treatyIdsToBreakOnRefusal": [d["id"]]})
    return out


def refusal(obs, joined):
    seen, res = set(), []
    for ob in obs:
        for ally in ob["obligatedAllies"]:
            if ally not in joined:
                for tid in ob["treatyIdsToBreakOnRefusal"]:
                    if tid not in seen:
                        seen.add(tid)
                        res.append(tid)
    return res


for r in h["treaties"]["obligations"]:
    deals, a, b = r["deals"], r["a"], r["b"]
    chk(obligations(deals, ("dec", a, b)) == r["declared"], f"declared {r}")
    chk(obligations(deals, ("att", a, b)) == r["attacked"], f"attacked {r}")
    chk(obligations(deals, ("dec", a, b)) + obligations(deals, ("att", b, a)) == r["forDeclaration"], f"forDecl {r}")
    pair = (min(a, b), max(a, b))
    chk([d["id"] for d in deals if tuple(d["strony"]) == pair and d["rodzaj"] in BREAK] == r["brokenByWar"], f"war {r}")
for r in h["treaties"]["refusal"]:
    chk(refusal(r["obligations"], set(r["joined"])) == r["out"], f"refusal {r}")
for r in h["treaties"]["defensive"]:
    chk(r["out"] == (r["must"] == r["attacker"]), f"defensive {r}")

# ---------- AGGRESSOR ----------
a_ = load("aggressor.json")
DEF = a_["params"]["aggressor"]


def P(p):
    return DEF if p is None else p


def key(x):
    x = dec(x) if not isinstance(x, float) else x
    if x is None:
        return "null"
    if math.isnan(x):
        return "NaN"
    if math.isinf(x):
        return "Infinity" if x > 0 else "-Infinity"
    if x == 0:
        return "0"
    if x == int(x) and abs(x) < 1e21:
        return str(int(x))
    return repr(x)


def mp(m):
    return {k: dec(v) for k, v in m.items()}


def enc_map(m):
    return {k: (("NaN" if math.isnan(v) else ("Infinity" if v > 0 else "-Infinity")) if not math.isfinite(v) else v) for k, v in m.items()}


def same_map(a, b):
    return a.keys() == b.keys() and all(eq(dec(a[k]), dec(b[k])) for k in a)


A = a_["agg"]
for r in A["daje"]:
    chk(r["out"] == (r["cause"] == "bez_powodu"), f"daje {r}")


def cause(i):
    for k, c in (("hamulec", "hamulec"), ("wymuszonaEpoka", "wymuszona_epoka"), ("wymuszonaInna", "wymuszona_inna")):
        if i.get(k):
            return c
    if i.get("zlamanieRozejmu"):
        return "bez_powodu"
    return "casus_belli" if i.get("casusBelliAktywny") else "bez_powodu"


for r in A["cause"]:
    chk(r["out"] == cause(r["in"]), f"cause {r}")
for r in A["ustawFlage"]:
    st, o, tu = mp(r["state"]), dec(r["owner"]), dec(r["turn"])
    p = P(r["params"])
    want = dict(st)
    if r["cause"] == "bez_powodu" and fin(tu) and fin(o):
        dt = tu + dec(p["flagaAgresora"]["trwaTur"])
        k = key(o)
        if not (k in st and st[k] >= dt):
            want[k] = dt
    chk(same_map(r["out"], enc_map(want)), f"ustawFlage {r}")
for r in A["czyAgresor"]:
    st, o, tu = mp(r["state"]), dec(r["owner"]), dec(r["turn"])
    v = st.get(key(o))
    chk(r["out"] == (v is not None and fin(v) and fin(tu) and tu < v), f"czyAgresor {r}")
for r in A["mnoznik"]:
    p = P(r["params"])
    chk(eq(dec(r["out"]), dec(p["wplywNaAI"]["willingnessAllyMnoznik"]) if r["flag"] else 1.0), f"mnoznik {r}")
for r in A["delta"]:
    p = P(r["params"])
    chk(eq(dec(r["out"]), dec(p["wplywNaAI"]["relacjaDeltaSojusz"]) if r["flag"] else 0.0), f"delta {r}")
for r in A["key"]:
    chk(r["out"] == f"{key(r['a'])}>{key(r['b'])}", f"key {r}")
for r in A["ustawCasus"]:
    st, rq, tg, tu = mp(r["state"]), dec(r["req"]), dec(r["tgt"]), dec(r["turn"])
    p = P(r["params"])
    want = dict(st)
    if fin(rq) and fin(tg) and fin(tu) and rq != tg:
        dt = tu + dec(p["casusBelli"]["trwaTur"])
        k = f"{key(rq)}>{key(tg)}"
        if not (k in st and st[k] >= dt):
            want[k] = dt
    chk(same_map(r["out"], enc_map(want)), f"ustawCasus {r}")
for r in A["maCasus"]:
    st = mp(r["state"])
    v = st.get(f"{key(r['req'])}>{key(r['tgt'])}")
    tu = dec(r["turn"])
    chk(r["out"] == (v is not None and fin(v) and fin(tu) and tu < v), f"maCasus {r}")
for r in A["serializuj"]:
    chk(same_map(r["out"], enc_map({k: v for k, v in mp(r["state"]).items() if math.isfinite(v)})), f"serializuj {r}")
for r in A["wczytaj"]:
    raw = r["raw"]
    want = {}
    if isinstance(raw, dict):
        want = {k: float(v) for k, v in raw.items() if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)}
    chk(same_map(r["out"], want), f"wczytaj {r}")

# sekwencje: niezalezny model singletonu
for si, s in enumerate(A["seq"]):
    agg, cb = {}, {}
    for k, op in enumerate(s["ops"]):
        if op["op"] == "wyp":
            at, tu = dec(op["attacker"]), dec(op["turn"])
            if op["cause"] == "bez_powodu" and fin(at) and fin(tu):
                dt = tu + 20.0
                kk = key(at)
                if not (kk in agg and agg[kk] >= dt):
                    agg[kk] = dt
        elif op["op"] == "cb":
            rq, tg, tu = op["req"], op["tgt"], op["turn"]
            if rq != tg:
                dt = tu + 15.0
                kk = f"{rq}>{tg}"
                if not (kk in cb and cb[kk] >= dt):
                    cb[kk] = dt
        elif op["op"] == "reset":
            agg, cb = {}, {}
        else:
            chk(same_map(op["saved"]["aggressorFlagUntilByOwner"], enc_map(agg)), f"seq{si}.{k} zapis agg")
            chk(same_map(op["saved"]["casusBelliUntilByPair"], enc_map(cb)), f"seq{si}.{k} zapis cb")
        snap = s["snaps"][k]
        chk(same_map(snap["agg"], enc_map(agg)), f"seq{si}.{k} agg")
        chk(same_map(snap["cb"], enc_map(cb)), f"seq{si}.{k} cb")
        for q in snap["q"]:
            if isinstance(q[3], bool):
                v = cb.get(f"{q[0]}>{q[1]}")
                chk(q[3] == (v is not None and q[2] < v), f"seq{si}.{k} maCB {q}")
            else:
                v = agg.get(key(float(q[0])))
                act = v is not None and q[1] < v
                chk(q[2] == act and ((q[3] is None) == (not act)) and (not act or q[3] == v), f"seq{si}.{k} agg {q}")


print(f"OK={ok} BAD={len(bad)}")
for b in bad[:20]:
    print("BAD", str(b)[:300])
sys.exit(1 if bad else 0)
