"""Niezalezny weryfikator wektorow teren.json (uruchamiac: python3 -I verify-teren.py <teren.json>).
Reguly wg decyzji wlasciciela #15-#19 (promienie 5/3, miasto przed fortem, wczesniejszy fort wygrywa spor,
zdobycie fortu wejsciem wojska), zaimplementowane NIEZALEZNIE od kodu weba i Rust (inna struktura: wybor
minimum po kluczu zamiast sekwencyjnego porownania)."""
import json
import sys

d = json.load(open(sys.argv[1]))
assert d["pin"] == "4bbef081d"


def dist(aq, ar, bq, br):
    return (abs(aq - bq) + abs(ar - br) + abs((-aq - ar) - (-bq - br))) // 2


def radius(n):
    if n.get("isFort"):
        return 5
    if n.get("isOutpost"):
        return 3
    pop = int(n["pop"])
    return 0 if pop <= 0 else max(5, min(pop, 15))


def is_fort(n):
    return bool(n.get("isFort") or n.get("isOutpost"))


def owner_at(q, r, nodes):
    cands = [n for n in nodes if dist(q, r, n["q"], n["r"]) <= radius(n)]
    cities = [n for n in cands if not is_fort(n)]
    if cities:
        # najblizsze miasto, remis -> pierwsze w tablicy
        best = min(range(len(cities)), key=lambda k: (dist(q, r, cities[k]["q"], cities[k]["r"]), k))
        return cities[best]["ownerId"]
    forts = [n for n in cands if is_fort(n)]
    if not forts:
        return None
    # sekwencyjne zachowanie: biezacy zwyciezca zmienia sie tylko gdy kandydat jest lepszy wg reguly
    win = forts[0]
    for n in forts[1:]:
        if n.get("order") and win.get("order"):
            a, b = n["order"], win["order"]
            better = (a["turn"], a["seq"]) < (b["turn"], b["seq"])
        else:
            better = dist(q, r, n["q"], n["r"]) < dist(q, r, win["q"], win["r"])
        if better:
            win = n
    return win["ownerId"]


bad = 0
for c in d["radiusCases"]:
    assert radius(c["node"]) == c["radius"], c
    node = dict(c["node"], ownerId=c["ownerId"])
    for e in c["edge"]:
        assert owner_at(e["q"], e["r"], [node]) == e["owner"], (c, e)
        assert (e["d"] <= c["radius"]) == (e["owner"] is not None)
n = 0
for c in d["ownerCases"]:
    for q in c["queries"]:
        got = owner_at(q["q"], q["r"], c["nodes"])
        if got != q["owner"]:
            bad += 1
            print("OWNER MISMATCH", c["nodes"], q)
        n += 1


def fort_nodes(forts):
    out = []
    for f in forts:
        if f.get("contestedUseless"):
            continue
        node = {"q": f["q"], "r": f["r"], "pop": 0, "level": 1, "ownerId": f["ownerId"]}
        node["isFort" if f["type"] == "fort" else "isOutpost"] = True
        if "seq" in f:
            node["order"] = {"turn": f.get("builtAtTurn", 0), "seq": f["seq"]}
        out.append(node)
    return out


def norm(n):
    return {"q": n["q"], "r": n["r"], "ownerId": n["ownerId"], "isFort": bool(n.get("isFort")), "isOutpost": bool(n.get("isOutpost")), "order": n.get("order")}


for c in d["ftnCases"]:
    assert [norm(x) for x in fort_nodes(c["forts"])] == [norm(x) for x in c["nodes"]], c

nf = 0
for c in d["foreignCases"]:
    allnodes = c["cities"] + fort_nodes(c["forts"])
    for q in c["queries"]:
        near = any(
            f["ownerId"] != q["ownerId"] and not f.get("contestedUseless")
            and dist(q["q"], q["r"], f["q"], f["r"]) <= (5 if f["type"] == "fort" else 3)
            for f in c["forts"]
        )
        res = near and (lambda o: o is not None and o != q["ownerId"])(owner_at(q["q"], q["r"], allnodes))
        assert res == q["result"], (c, q)
        nf += 1

for c in d["seqCases"]:
    seqs = [f["seq"] for f in c["forts"] if "seq" in f]
    assert (max(seqs) + 1 if seqs else 0) == c["next"]
    nxt = c["next"]
    after = []
    filled = 0
    for f in c["forts"]:
        g = dict(f)
        if "seq" not in g:
            g["seq"] = nxt
            nxt += 1
            g.setdefault("builtAtTurn", 0)
            filled += 1
        after.append(g)
    assert filled == c["filled"] and after == c["after"], c

ne = 0
for c in d["captureCases"]:
    war = set(c["war"])
    enemy = lambda a, b: c["selfEnemy"] if a == b else "%d,%d" % (min(a, b), max(a, b)) in war
    forts = [dict(f) for f in c["forts"]]
    evs = []
    for f in forts:
        here = [u for u in c["units"] if (u["q"], u["r"]) == (f["q"], f["r"])]
        if not here or any(u["ownerId"] == f["ownerId"] for u in here):
            continue
        atk = [u for u in here if u["military"] and u["ownerId"] != c["barbarian"] and enemy(u["ownerId"], f["ownerId"])]
        owners = {u["ownerId"] for u in atk}
        if len(owners) != 1 or any(u["ownerId"] not in owners for u in here):
            continue
        new = atk[0]["ownerId"]
        evs.append({"q": f["q"], "r": f["r"], "type": f["type"], "prevOwnerId": f["ownerId"], "newOwnerId": new})
        f["ownerId"] = new
    assert evs == c["events"] and forts == c["after"], c
    ne += len(evs)

print("OK owner_queries=%d mismatches=%d foreign=%d capture_events=%d" % (n, bad, nf, ne))
sys.exit(1 if bad else 0)
