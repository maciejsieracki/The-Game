#!/usr/bin/env python3
"""Niezalezny weryfikator (python3 -I) wektorow R-RUSTPORT-P6-ECON-TICK-ORDER-LANE-Q1.
Przelicza z samych danych wejsciowych wektorow (bez Rust i bez kodu weba) wyniki weba dla funkcji czystych i niezmienniki petli:
 makeRng (culture-religion.ts:974, ziarno 0 -> stan 1), orderEffectsWithCivMatrix, cultureHappiness, convertCulture,
 accumulateCulture, cultureAccrualWithModifier, religionOwnShare/religionHappiness, convertViaTemple, spreadReligion (kolejnosc
 i przyrost), isOwnerAtWarInRelations, countLawGarrisonOnCityHex, applyCultureReligionPressureToTarget, oraz niezmienniki
 petli: orderValueMap == porPct, orderMultMap == f(tier, efekty), bunt <=> migracja populacji, rebelia => owner -99.
Uzycie: verify-p6-order-lane.py <order_lane.json> [--tamper]   (--tamper: kontrola negatywna, zmienia 1 wartosc weba)
"""
import json, math, sys

d = json.load(open(sys.argv[1], encoding="utf-8"))
if "--tamper" in sys.argv:
    d["cultCases"][0]["hap"] += 1.0
    d["rngCases"][0]["seq"][2] += 1e-9
n_ok = 0
bad = []
M32 = 0xFFFFFFFF


def chk(cond, msg):
    global n_ok
    if cond:
        n_ok += 1
    else:
        bad.append(msg)


def jsround(x):
    return math.floor(x + 0.5)


def jsmax(a, b):
    return a if a > b else b


def imul(a, b):
    return (a * b) & M32


def make_rng(seed):
    if not math.isfinite(seed):
        seed = 0
    a = int(math.trunc(seed)) % (1 << 32)
    a = a or 1
    def nxt():
        nonlocal a
        a = (a + 0x6D2B79F5) & M32
        t = imul(a ^ (a >> 15), 1 | a)
        t = ((t + imul(t ^ (t >> 7), 61 | t)) & M32) ^ t
        return ((t ^ (t >> 14)) & M32) / 4294967296
    return nxt


for c in d["rngCases"]:
    g = make_rng(c["seed"])
    for k, w in enumerate(c["seq"]):
        chk(g() == w, f"rng seed={c['seed']} #{k}")

# --- orderEffectsWithCivMatrix ---
for i, c in enumerate(d["effectsCases"]):
    e, m, o = c["eff"], c["mods"], c["out"]
    def ap(base, key):
        mod = m.get(key)
        f = jsmax(0, 1 + mod) if mod is not None else 1
        return jsmax(0, base * f)
    chk(o["productionMult"] == ap(e["productionMult"], "porzadek_produkcja_proc"), f"eff{i} prod")
    chk(o["pieniadzMult"] == ap(e["pieniadzMult"], "porzadek_pieniadz_proc"), f"eff{i} pien")
    chk(o["tradeMult"] == ap(e["tradeMult"], "porzadek_pieniadz_proc"), f"eff{i} trade")
    chk(o["naukaMult"] == ap(e["naukaMult"], "porzadek_nauka_proc"), f"eff{i} nauka")
    chk(o["kulturaMult"] == ap(e["kulturaMult"], "porzadek_kultura_proc"), f"eff{i} kult")
    chk(o["growthMult"] == ap(e["growthMult"], "porzadek_wzrost_proc"), f"eff{i} wzrost")
    chk(o["revoltRisk"] == e["revoltRisk"], f"eff{i} risk")

# --- kultura ---
for i, c in enumerate(d["cultCases"]):
    p = dict(c["cpar"])
    share = c["share"]
    sh = 1.0 if share is None else min(1.0, max(0.0, share))
    if sh < 0.25: hap = p["karaLt25"]
    elif sh < 0.5: hap = p["karaLt50"]
    elif sh >= 1: hap = p["zadowolenie100"]
    elif sh >= 0.75: hap = p["zadowolenie75"]
    else: hap = p["zadowolenie50"]
    chk(c["hap"] == hap, f"cult{i} hap")
    s0 = 0.0 if share is None else min(1.0, max(0.0, share))
    h = c["has"]
    rate = p["konwersjaBaza"]
    for flag, key in (("hasAmfiteatr", "konwersjaAmfiteatr"), ("hasBiblioteka", "konwersjaBiblioteka"), ("hasPalac", "konwersjaPalac"),
                      ("hasStela", "konwersjaStela"), ("hasSad", "konwersjaSad"), ("hasLaznia", "konwersjaLaznia")):
        if h[flag]: rate += p[key]
    rate = min(max(rate, 0.0), p["konwersjaCapTura"])
    chk(c["conv"] == min(1.0, max(0.0, s0 + rate / 100)), f"cult{i} conv")
    def rad(x):
        return 3 if x >= p["progZasieg3"] else 2 if x >= p["progZasieg2"] else 1 if x >= p["progZasieg1"] else 0
    before = max(0.0, c["kum"]); gain = max(0.0, c["perTurn"])
    chk(c["acc"]["kulturaSkumulowana"] == before + gain, f"cult{i} acc")
    chk(c["acc"]["poprzedniZasieg"] == rad(before) and c["acc"]["nowyZasieg"] == rad(before + gain), f"cult{i} zasieg")
    chk(c["radius"] == rad(c["kum"]), f"cult{i} radius")
    f = max(0, 1 + c["modifier"])
    chk(c["accr"] == max(0.0, c["perTurn"]) * f, f"cult{i} accr")

# --- religia ---
def total(counts):
    return sum(v for v in counts.values() if v > 0)


for i, c in enumerate(d["relCases"]):
    rp = dict(c["rpar"]); st = c["state"]["counts"]
    t = total(st)
    own = c["ownR"]
    osh = 0.5 if (t <= 0 or own is None) else min(1.0, max(0.0, (st.get(own, 0) if st.get(own, 0) > 0 else 0) / t))
    chk(c["ownShare"] == osh, f"rel{i} ownShare")
    chk(c["hap"] == 2 * osh - 1, f"rel{i} hap")
    chk(c["isEmpty"] == (t <= 0), f"rel{i} isEmpty")
    # convertViaTemple
    target = c["target"]
    clone = {k: v for k, v in st.items() if v > 0}
    rate = rp["konwersjaBazaPct"] + (rp["konwersjaSwiatyniaPct"] if c["b"]["hasSwiatynia"] else 0) + (rp["konwersjaKregiPct"] if c["b"]["hasKamienneKregi"] else 0)
    rate = max(0, rate) / 100
    tc = clone.get(target, 0) if target else 0
    conv = t - tc
    if not target or t <= 0 or conv <= 0:
        want_state, want_n = dict(clone), 0
    else:
        to = jsround(rate * conv)
        if to <= 0 and rate > 0: to = 1
        to = min(to, conv)
        rem = to
        donors = sorted([k for k in clone if k != target and clone[k] > 0], key=lambda k: (-clone[k], k))
        for k in donors:
            if rem <= 0: break
            take = min(rem, clone[k]); clone[k] -= take
            if clone[k] <= 0: del clone[k]
            rem -= take
        act = to - rem
        clone[target] = tc + act
        want_state, want_n = clone, act
    chk(c["conv"]["state"]["counts"] == want_state and c["conv"]["converted"] == want_n, f"rel{i} convertViaTemple")
    # spreadReligion
    sp = dict(c["sp"])
    lead, best = None, -1
    for k in sorted(st):
        v = st[k] if st[k] > 0 else 0
        if v > best: best, lead = v, k
    dom = None
    if t > 0 and lead is not None and best / t > min(100.0, max(0.0, rp["progDominacjiPct"])) / 100:
        dom = lead
    if dom is None:
        chk(c["spread"] == [], f"rel{i} spread(brak dominujacej)")
    else:
        elig = [n for n in c["neighbors"] if n["distance"] >= 1 and n["distance"] <= sp["szerzenieMaxDystans"]]
        slots = int(max(0, math.floor(sp["szybkoscSzerzeniaBazowa"] + (sp["swiatyniaBonusSzerzenia"] if c["hasSw"] else 0))))
        slots = min(slots, len(elig))
        pr = 1 if c["pressure"] is None else max(0, c["pressure"])
        order = sorted(elig, key=lambda n: (n["distance"], n["id"]))
        evs = []
        for n in order[:slots]:
            cur = n["state"]["counts"].get(dom, 0)
            added = pr
            if n.get("population") is not None:
                room = max(0, n["population"] - total(n["state"]["counts"]))
                added = min(added, max(0, room))
            nc = dict(n["state"]["counts"]); nc[dom] = cur + added
            evs.append({"id": n["id"], "religion": dom, "added": added, "state": {"counts": nc}})
        chk(c["spread"] == evs, f"rel{i} spreadReligion")

# --- wojna / garnizon ---
for i, c in enumerate(d["garrCases"]):
    n = sum(1 for u in c["units"] if u["ownerId"] == c["o"] and u["q"] == c["q"] and u["r"] == c["r"] and not u.get("oblegaCityId"))
    chk(c["out"] == n, f"garr{i}")
for i, c in enumerate(d["warCases"]):
    res = False
    def num(s):
        s = s.strip()
        if s == "": return 0
        try: return int(s)
        except ValueError: return None
    for key, war in c["rel"]:
        if not war: continue
        parts = key.split("_")
        if len(parts) != 2: continue
        a, b = num(parts[0]), num(parts[1])
        if a == -1 or b == -1: continue
        if a == c["o"] or b == c["o"]:
            res = True; break
    chk(c["out"] == res, f"war{i}")

# --- presja ---
def clamp(x, lo, hi): return lo if x < lo else hi if x > hi else x
for i, c in enumerate(d["pressCases"]):
    cs = c["cs"]; srm = {k: v for k, v in c["srm"]}
    def ect(o): return sum(max(0.0, (x.get("kulturaSkumulowana") or 0)) for x in cs if x["ownerId"] == o)
    def ert(o):
        r = srm.get(o)
        if not r: return 0
        return sum(((x.get("religionState") or {"counts": {}})["counts"].get(r, 0)) for x in cs if x["ownerId"] == o)
    t = c["tOwner"]
    chk(c["ect"] == ect(t) and c["ert"] == ert(t), f"press{i} totals")
    mix = c["tshare"] is not None
    share = clamp(c["tshare"], 0, 1) if mix else 1
    rel = dict(c["relPct"]) if c["relPct"] else {}
    rate = max(0, c["rate"]) / 100
    tot = ert(t)
    for s in c["srcOwners"]:
        if s == t: continue
        if not mix: continue
        if ect(s) > ect(t): share = clamp(share - rate, 0, 1)
        elif ect(t) > ect(s): share = clamp(share + rate, 0, 1)
        rs = ert(s)
        if rs > tot: rel[str(s)] = clamp(rel.get(str(s), 0) + c["rate"], 0, 100)
        elif tot > rs: rel[str(t)] = clamp(rel.get(str(t), 100) - c["rate"], 0, 100)
    chk(c["out"]["ownCultureShare"] == share, f"press{i} share")
    chk({str(k): v for k, v in c["out"]["religionPressurePct"].items()} == rel, f"press{i} relPct")

# --- niezmienniki petli ---
bunt_total = 0
for sc in d["scenarios"] + d["e2e"]:
    o = sc["out"]; inp = sc["in"]; i = inp["idx"]
    reps = o["reports"]
    chk(len(reps) == len(inp["cities"]), f"lane{i} liczba raportow")
    draws = 0
    for r in reps:
        cid = r["cityId"]
        chk(o["orderValueMap"][cid] == r["porPct"], f"lane{i} {cid} orderValueMap==porPct")
        m = o["orderMultMap"][cid]
        chk(all(m[k] >= 0 for k in m), f"lane{i} {cid} mnozniki >= 0")
        if r["bunt"]:
            bunt_total += 1
            chk(r["tier"] == "unrest" or r["porPct"] < 90, f"lane{i} {cid} bunt tylko przy niskim porzadku")
    pops_before = {c["id"]: c["population"] for c in inp["cities"]}
    pops_after = {c["id"]: c["population"] for c in o["cities"]}
    nb = sum(1 for r in reps if r["bunt"])
    moved = sum(max(0, pops_before[k] - pops_after[k]) for k in pops_before)
    chk(moved <= nb, f"lane{i} suma ubytkow populacji <= liczba buntow ({moved} vs {nb})")
    chk(sum(pops_before.values()) == sum(pops_after.values()), f"lane{i} populacja zachowana")
    chk(o["rngDraws"] <= len(reps), f"lane{i} rngDraws <= miasta")
    for cid in o["rebelled"]:
        c = next(c for c in o["cities"] if c["id"] == cid)
        chk(c["ownerId"] == -99 and c["rebelState"] is True, f"lane{i} {cid} rebelia => owner -99")
        chk(c.get("rebelProtectionTurnsRemaining") == 20, f"lane{i} {cid} okno ochrony 20 tur")

print(f"sprawdzen OK={n_ok} rozbieznosci={len(bad)} bunt_total={bunt_total}")
for b in bad[:20]:
    print("ROZBIEZNOSC:", b)
sys.exit(1 if bad else 0)
