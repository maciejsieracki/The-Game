#!/usr/bin/env python3
"""Niezalezny weryfikator wektorow P6.1C (R-RUSTPORT-P6-1C-START-KLASTRA-Q1).

NIE uzywa TypeScript, Node, generatora gen-p61c-vectors.mjs ani kodu Rust. Semantyke
buildClusterStartPlan / pickSecondHumanStartHex / hashPos / seedIncaLlamaDeposits /
braz-access / startRelationForPair implementuje od nowa w Pythonie na podstawie TEKSTU zrodel
weba (git archive edb8fb56), a nastepnie porownuje z wektorami JSON (tests/p6_1c_vectors).
Wejscia (spawnPlan, mapy, nagrane wywolania pickNextCityName) bierze z JSON; wynik liczy sam.
Dodatkowo sprawdza kotwice tekstowe zrodel (stale, kluczowe linie).

Uzycie:
  python3 -I verify-p61c-vectors.py <WEB_ROOT> <VECTORS_DIR>
Wyjscie: 0 = 0 rozbieznosci, 1 = co najmniej jedna rozbieznosc, 2 = blad wejscia.
"""
import json
import math
import re
import sys
from pathlib import Path

if len(sys.argv) != 3:
    print("usage: <WEB_ROOT> <VECTORS_DIR>")
    sys.exit(2)
web = Path(sys.argv[1])
vdir = Path(sys.argv[2])


def rd(rel):
    return (web / rel).read_text(encoding="utf-8")


def load(name):
    return json.loads((vdir / name).read_text(encoding="utf-8"))


checks = 0
diffs = 0


def expect(label, got, want):
    global checks, diffs
    checks += 1
    if got != want:
        diffs += 1
        if diffs <= 40:
            print(f"ROZBIEZNOSC {label}: py={got!r} json={want!r}")


def anchor(label, text, needle):
    expect(f"kotwica {label}", needle in text, True)


# ---------------------------------------------------------------------------
# kotwice tekstowe zrodel
# ---------------------------------------------------------------------------
cs = rd("gra/src/game/cluster-start.ts")
sp = rd("gra/src/map/cluster-spawn.ts")
il = rd("gra/src/game/inca-llama-seed.ts")
ba = rd("gra/src/game/braz-access.ts")
ti = rd("gra/src/game/terrain-improvements.ts")
dl = rd("gra/src/game/diplomacy-layers.ts")
ci = rd("gra/src/game/cities.ts")

anchor("cs duplikat", cs, "input.secondHumanCivId !== undefined && input.secondHumanCivId === input.playerCivId")
anchor("cs slotIsCityState", cs, "const slotIsCityState = slot.isSameTypeRival || !slot.isClusterCapital;")
anchor("cs kolizja", cs, "return hexDistance(slot.q, slot.r, prev.q, prev.r) < minDist;")
anchor("cs tryb domyslny", cs, "input.humanDistanceMode ?? 'losowo'")
anchor("cs owner fallback", cs, "Math.max(0, ...reservedOwnerIds) + 1")
anchor("cs rivals fallback", cs, "Math.max(0, ...reservedOwnerIdsSecond) + 1")
anchor("cs nazwa fallback", cs, "slot.nazwaMiasta || 'Miasto'")
anchor("cs promocja", cs, "typCityCopyOwners.delete(substituteCapitalOwnerId);")
anchor("sp xor", sp, "mulberry32(seed ^ 0x5eed2f00)")
anchor("sp ulamek blisko", sp, "const count = Math.max(1, Math.ceil(withDist.length * 0.1));\n    pool = withDist.slice(0, count);")
anchor("sp ulamek daleko", sp, "const count = Math.max(1, Math.ceil(withDist.length * 0.1));\n    pool = withDist.slice(-count);")
anchor("sp idx", sp, "const idx = Math.min(pool.length - 1, Math.floor(rng() * pool.length));")
anchor("sp land filter", sp, "if (isWaterTerrain(h.terenBazowy) || h.terenBazowy === TerenBazowy.Gory ||\n        h.terenBazowy === TerenBazowy.Polarny) continue;")
anchor("il hash", il, "Math.imul(q | 0, 0x27d4eb2d)")
anchor("il stale", il, "export const LLAMA_START_RADIUS = 3;")
anchor("il stale2", il, "export const LLAMA_PER_START = 3;")
anchor("ba id", ba, "export const PIEC_HUTNICZY_BUILDING_ID = 'odlewnia_brazu';")
anchor("ba key", ba, "export const KOPALNIA_MIEDZI_KEY = 'kopalnia_miedzi';")
anchor("ci start cs", ci, "export const MIN_CITY_DISTANCE_START_CITY_STATE = 3;")
anchor("ti alias", ti, "pastwisko: 'bydlo',")

# ---------------------------------------------------------------------------
# stale z zrodel (nie z JSON)
# ---------------------------------------------------------------------------
m = re.search(r"export const MIN_CITY_DISTANCE_START_CITY_STATE = (\d+);", ci)
START_CS = int(m.group(1))
miasto = json.loads(rd("gra/data/miasto-params.json"))
MIN_CITY = miasto["min_dystans_miast"]["wartosc"]
dipl = json.loads(rd("gra/data/diplomacy.json"))["params"]
LEGACY_ALIASES = dict(re.findall(r"^\s*(\w+): '(\w+)',$", re.search(r"LEGACY_KEY_ALIASES[^{]*\{(.*?)\};", ti, re.S).group(1), re.M))
IMPROVEMENTS = json.loads(rd("gra/data/terrain-improvements.json"))
mk = re.search(r"export const KOPALNIA_MIEDZI_KEY = '(\w+)';", ba)
COPPER = mk.group(1)
PIEC = re.search(r"export const PIEC_HUTNICZY_BUILDING_ID = '(\w+)';", ba).group(1)
LLAMA_R = int(re.search(r"export const LLAMA_START_RADIUS = (\d+);", il).group(1))
LLAMA_N = int(re.search(r"export const LLAMA_PER_START = (\d+);", il).group(1))


def clamp(n, lo, hi):
    return max(lo, min(hi, n))


def start_relation(same):
    z = dipl["startZaufanie"]
    z += dipl["rywalizacjaTenSamTyp_zaufanie"] if same else dipl["roznicaKulturowa_zaufanie"]
    return {"zaufanie": clamp(z, 0, 100), "respekt": dipl["startRespekt"], "status": "neutralni"}


def hex_distance(aq, ar, bq, br):
    return max(abs(aq - bq), abs(ar - br), abs((-aq - ar) - (-bq - br)))


M32 = 0xFFFFFFFF


def imul(a, b):
    return (a * b) & M32


def mulberry32(seed):
    st = [seed & M32]

    def rnd():
        st[0] = (st[0] + 0x6D2B79F5) & M32
        v = st[0]
        t = imul(v ^ (v >> 15), 1 | v)
        t = (t ^ ((t + imul(t ^ (t >> 7), 61 | t)) & M32)) & M32
        return ((t ^ (t >> 14)) & M32) / 4294967296

    return rnd


# ---------------------------------------------------------------------------
# constants
# ---------------------------------------------------------------------------
cv = load("cluster-start.json")
maps = load("maps.json")["maps"]
c = cv["constants"]
expect("MIN_CITY_DISTANCE", MIN_CITY, c["MIN_CITY_DISTANCE"])
expect("MIN_CITY_DISTANCE_START_CITY_STATE", START_CS, c["MIN_CITY_DISTANCE_START_CITY_STATE"])
expect("startRelation same", start_relation(True), c["startRelationSameType"])
expect("startRelation other", start_relation(False), c["startRelationOtherType"])
expect("PIEC", PIEC, c["PIEC_HUTNICZY_BUILDING_ID"])
expect("COPPER", COPPER, c["KOPALNIA_MIEDZI_KEY"])
expect("LLAMA_R", LLAMA_R, c["LLAMA_START_RADIUS"])
expect("LLAMA_N", LLAMA_N, c["LLAMA_PER_START"])

# ---------------------------------------------------------------------------
# pickSecondHumanStartHex
# ---------------------------------------------------------------------------
WATER = {"morze", "plytkie_morze"}


def land_of(map_id):
    return [(h[0], h[1]) for h in maps[map_id]["hexes"] if h[2] not in WATER and h[2] != "gory" and h[2] != "polarny"]


def pick_second(land, primary, mode, seed, min_distance, occupied):
    cand = []
    for q, r in land:
        d = hex_distance(q, r, primary["q"], primary["r"])
        if d < min_distance:
            continue
        if not all(hex_distance(q, r, o["q"], o["r"]) >= min_distance for o in occupied):
            continue
        cand.append((q, r, d))
    if not cand:
        return None
    cand.sort(key=lambda x: x[2])  # stabilne
    if mode == "blisko":
        n = max(1, int(math.ceil(len(cand) * 0.1)))
        pool = cand[:n]
    elif mode == "daleko":
        n = max(1, int(math.ceil(len(cand) * 0.1)))
        pool = cand[-n:]
    else:
        pool = cand
    rng = mulberry32((seed ^ 0x5EED2F00) & M32)
    idx = min(len(pool) - 1, int(math.floor(rng() * len(pool))))
    p = pool[idx]
    return {"q": p[0], "r": p[1]}


land_cache = {}
for row in cv["pickSecond"]:
    land = land_cache.setdefault(row["map"], land_of(row["map"]))
    got = pick_second(land, row["primary"], row["mode"], row["seed"], row["minDistance"], row["occupied"])
    expect(f"pickSecond {row['map']} {row['primary']} {row['mode']} {row['seed']} {row['minDistance']}", got, row["result"])

# ---------------------------------------------------------------------------
# buildClusterStartPlan
# ---------------------------------------------------------------------------
def build_plan(case):
    inp = case["input"]
    sp_ = case["spawnPlan"]
    land = land_cache.setdefault(case["map"], land_of(case["map"]))
    if inp["secondHumanCivId"] is not None and inp["secondHumanCivId"] == inp["playerCivId"]:
        raise ValueError("dup")
    names = list(case["names"])
    name_i = [0]

    def pick_name(typ, used, fallback):
        call = names[name_i[0]]
        name_i[0] += 1
        assert call["typ"] == typ and call["used"] == used and call["fallback"] == fallback, (case["label"], call, typ, used, fallback)
        return call["result"]

    ai_owner_civ = []  # (owner, typ) w kolejnosci wstawienia
    display = []
    simplified = []
    foreign_owners = []
    typ_copy = []
    start_rel = []
    spawn_cities = []
    ai_hexes = []
    accepted = set()
    accepted_for_distance = [(sp_["playerStartHex"]["q"], sp_["playerStartHex"]["r"], False)]
    names_by_civ = {}

    def mset(lst, k, v):
        for i, (kk, _) in enumerate(lst):
            if kk == k:
                lst[i] = (k, v)
                return
        lst.append((k, v))

    def sadd(lst, v):
        if v not in lst:
            lst.append(v)

    for slot in sp_["slots"]:
        is_cap = slot.get("isClusterCapital")
        slot_cs = bool(slot["isSameTypeRival"]) or not bool(is_cap)
        collides = False
        for pq, pr, pcs in accepted_for_distance:
            md = START_CS if (pcs or slot_cs) else MIN_CITY
            if hex_distance(slot["q"], slot["r"], pq, pr) < md:
                collides = True
                break
        if collides:
            continue
        used = names_by_civ.setdefault(slot["typ"], [])
        if inp["hasPools"]:
            nm = pick_name(slot["typ"], list(used), slot["nazwaMiasta"] or "Miasto")
        else:
            nm = slot["nazwaMiasta"]
        sadd(used, nm)
        owner = slot["ownerId"]
        mset(ai_owner_civ, owner, slot["typ"])
        mset(display, owner, nm)
        if slot["isSameTypeRival"]:
            sadd(simplified, owner)
        else:
            sadd(foreign_owners, owner)
        if not is_cap:
            sadd(typ_copy, owner)
        mset(start_rel, owner, start_relation(bool(slot["isSameTypeRival"])))
        spawn_cities.append({"q": slot["q"], "r": slot["r"], "ownerId": owner, "name": nm})
        ai_hexes.append({"q": slot["q"], "r": slot["r"], "ownerId": owner})
        accepted_for_distance.append((slot["q"], slot["r"], slot_cs))
        accepted.add(owner)

    promoted = []
    clusters = []
    for g in sp_["foreignTypeClusters"]:
        oids = []
        poss = []
        for i, oid in enumerate(g["ownerIds"]):
            if oid not in accepted:
                continue
            if i >= len(g["positions"]):
                continue
            oids.append(oid)
            poss.append(g["positions"][i])
        if not oids:
            continue
        clusters.append({"typ": g["typ"], "ownerIds": oids, "positions": poss})
        orig = g["ownerIds"][0] if g["ownerIds"] else None
        sub = oids[0]
        if orig is not None and orig not in accepted:
            promoted.append(sub)
            if sub in typ_copy:
                typ_copy.remove(sub)
    caps = [o for o in sp_["clusterCapitalOwnerIds"] if o in accepted] + promoted

    second_hex = None
    second_owner = None
    if inp["secondHumanCivId"] is not None:
        mode = inp["humanDistanceMode"] or "losowo"
        occupied = [{"q": a["q"], "r": a["r"]} for a in ai_hexes] + sp_["pendingSameTypeRivalHexes"]
        second_hex = pick_second(land, sp_["playerStartHex"], mode, inp["seed"], START_CS, occupied)
        if second_hex is not None:
            reserved = [a["ownerId"] for a in ai_hexes] + sp_["pendingSameTypeRivalOwnerIds"]
            second_owner = inp["secondHumanOwnerId"] if inp["secondHumanOwnerId"] is not None else max([0] + reserved) + 1
    pend2 = []
    if second_hex is not None and second_owner is not None:
        reserved2 = [a["ownerId"] for a in ai_hexes] + sp_["pendingSameTypeRivalOwnerIds"] + [second_owner]
        nxt = max([0] + reserved2) + 1
        for _ in range(sp_["pendingSameTypeRivals"]):
            pend2.append(nxt)
            nxt += 1
    if inp["hasPools"]:
        assert name_i[0] == len(names), (case["label"], "nie zuzyto wszystkich nazw")
    return {
        "playerStartHex": sp_["playerStartHex"],
        "playerStartCityName": sp_["playerStartCityName"],
        "secondPlayerStartHex": second_hex,
        "secondPlayerOwnerId": second_owner,
        "aiStartHexes": ai_hexes,
        "spawnCities": spawn_cities,
        "foreignTypeClusters": clusters,
        "aiOwnerCivMap": [[k, v] for k, v in ai_owner_civ],
        "ownerDisplayName": [[k, v] for k, v in display],
        "simplifiedDiplomacyOwners": simplified,
        "foreignTypeOwners": foreign_owners,
        "typCityCopyOwners": typ_copy,
        "startRelations": [[k, v] for k, v in start_rel],
        "pendingSameTypeRivals": sp_["pendingSameTypeRivals"],
        "pendingSameTypeRivalHexes": sp_["pendingSameTypeRivalHexes"],
        "pendingSameTypeRivalOwnerIds": sp_["pendingSameTypeRivalOwnerIds"],
        "pendingSameTypeRivalsSecond": len(pend2),
        "pendingSameTypeRivalOwnerIdsSecond": pend2,
        "clusterCapitalOwnerIds": caps,
    }


for case in cv["cases"]:
    got = build_plan(case)
    for key, want in case["plan"].items():
        expect(f"plan {case['label']} {key}", got[key], want)
    expect(f"plan {case['label']} klucze", sorted(got.keys()), sorted(case["plan"].keys()))

expect("duplikat komunikat", "secondHumanCivId ('rzymianie') nie może być" in cv["duplicateCivError"], True)

# ---------------------------------------------------------------------------
# hashPos + seedIncaLlamaDeposits
# ---------------------------------------------------------------------------
def hash_pos(seed, q, r):
    h = (imul(q & M32, 0x27D4EB2D) ^ imul(r & M32, 0x165667B1) ^ imul(seed & M32, 0x9E3779B1)) & M32
    h ^= h >> 15
    h = imul(h, 0x2C1B3C6D)
    h ^= h >> 12
    return (h & M32) / 4294967296


lv = load("llama.json")
for row in lv["hash"]:
    expect(f"hash {row['seed']} {row['q']} {row['r']}", hash_pos(row["seed"], row["q"], row["r"]), float(row["hText"]))
    expect(f"hash json {row['seed']} {row['q']} {row['r']}", hash_pos(row["seed"], row["q"], row["r"]), row["h"])

base_cache = {}


def base_map(map_id):
    if map_id not in base_cache:
        base_cache[map_id] = {(h[0], h[1]): {"t": h[2], "n": h[3], "z": h[4]} for h in maps[map_id]["hexes"]}
    return {k: dict(v) for k, v in base_cache[map_id].items()}


def seed_llama(mp, seed, starts, avoid, per_start, radius):
    seeded = 0
    used_global = set()
    for st in starts:
        cands = []
        rad = int(radius) if radius > 0 else 0
        keys = []
        for dq in range(-rad, rad + 1):
            lo = max(-rad, -dq - rad)
            hi = min(rad, -dq + rad)
            for dr in range(lo, hi + 1):
                k = (st["q"] + dq, st["r"] + dr)
                if k in mp:
                    keys.append(k)
        for k in keys:
            if f"{k[0]},{k[1]}" in avoid or k in used_global:
                continue
            hx = mp[k]
            if hx["t"] not in ("wzgorza", "gory"):
                continue
            if hx["n"] != "brak":
                continue
            if hx["z"]:
                continue
            cands.append((k, hash_pos(seed, k[0], k[1])))
        cands.sort(key=lambda x: x[1])
        i = 0
        while i < len(cands) and i < per_start:
            k = cands[i][0]
            mp[k]["n"] = "zloze_lamy"
            used_global.add(k)
            seeded += 1
            i += 1
    return seeded


for case in lv["cases"]:
    mp = base_map(case["map"])
    for q, r, z in case["zloze"]:
        mp[(q, r)]["z"] = z
    before = {k: v["n"] for k, v in mp.items()}
    per = case["perStart"] if case["perStart"] is not None else LLAMA_N
    rad = case["radius"] if case["radius"] is not None else LLAMA_R
    seeded = seed_llama(mp, case["seed"], case["starts"], set(case["avoid"]), per, rad)
    expect(f"llama {case['label']} seeded", seeded, case["seeded"])
    changed = sorted([k[0], k[1], before[k], v["n"]] for k, v in mp.items() if v["n"] != before[k])
    expect(f"llama {case['label']} changed", changed, sorted(case["changed"]))

# ---------------------------------------------------------------------------
# braz-access
# ---------------------------------------------------------------------------
bv = load("braz.json")
PROTO = {"constructor", "toString", "__proto__", "hasOwnProperty"}


def normalize(raw):
    if not raw or raw == "brak":
        return None
    key = LEGACY_ALIASES.get(raw, raw)
    if key in IMPROVEMENTS:
        return key
    if raw in IMPROVEMENTS:
        return raw
    return None


expect("improvementKeys", bv["improvementKeys"], [k for k in IMPROVEMENTS if not k.startswith("_")])
for row in bv["normalize"]:
    expect(f"normalize {row['raw']!r}", normalize(row["raw"]), row["result"])
for row in bv["normalizeProtoOutOfDomain"]:
    # artefakt JS: web zwraca klucz prototypu; poza domena Pythona/Rust (tez None)
    expect(f"proto {row['raw']!r}", row["raw"] in PROTO, True)


def layers(imp):
    if isinstance(imp, str):
        k = normalize(imp)
        return [k] if k else []
    return [k for k in (normalize(str(x)) for x in imp) if k]


for row in bv["copper"]:
    if not row["hasMap"] or not row["values"]:
        got = False
    else:
        got = any(k == COPPER for imp in row["values"] for k in layers(imp))
        # klucze prototypu: web zwraca je, ale nie rowna sie COPPER - wynik ten sam
    expect(f"copper {row['label']}", got, row["result"])


def has_piec(ids):
    return PIEC in ids or "odlewnia_zelaza" in ids or "wielka_odlewnia" in ids


for row in bv["piec"]:
    expect(f"piec {row['builtIds']}", has_piec(row["builtIds"]), row["result"])
for row in bv["access"]:
    st = row["stock"]
    has_stock = st["kind"] == "record" and (st["value"].get("braz", 0) or 0) > 0
    got = has_stock if row["builtIds"] is None else (has_stock and has_piec(row["builtIds"]))
    expect(f"access {row}", got, row["result"])

print(f"RAZEM: {checks} sprawdzen, rozbieznosci: {diffs}")
sys.exit(1 if diffs else 0)
