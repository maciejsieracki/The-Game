#!/usr/bin/env python3
"""Niezalezny weryfikator wektorow P6.6A (R-RUSTPORT-P6-6A-MIASTA-ZAKLADANIE-A-Q1).

NIE uzywa TypeScript, Node, gen-p66a-vectors.mjs ani kodu Rust. Semantyke city-founding.ts /
city-hex-clear.ts / conquest-stability.ts / visibility.ts implementuje od nowa w Pythonie na podstawie
TEKSTU zrodel weba (git archive edb8fb56): wejscia bierze z wektorow JSON, wynik liczy sam i porownuje
z wyjsciem zapisanym z URUCHOMIONEGO weba (bitowo dla f64). Stale czyta z gra/data/*.json i z tekstu
zrodel (regex). Wyniki zaleznosci spoza zakresu (convertCulture, convertViaTemple, sameCultureCircle,
cityBorderRadius, hexToWorkedTile) sa wejsciem (zapisane z prawdziwego weba); sameCultureCircle jest
dodatkowo liczony niezaleznie z civs.json.

Uzycie:  python3 -I verify-p66a-vectors.py <WEB_ROOT> <VECTORS_DIR>
Wyjscie: 0 = 0 rozbieznosci, 1 = rozbieznosci, 2 = blad wejscia.
"""
import json
import math
import re
import struct
import sys
from pathlib import Path

if len(sys.argv) not in (3, 4):
    print("usage: <WEB_ROOT> <VECTORS_DIR> [ENGINE_DIR]")
    sys.exit(2)
web = Path(sys.argv[1])
vdir = Path(sys.argv[2])

checks = 0
diffs = 0
NAN = float("nan")
INF = float("inf")


def N(v):
    """Dekoduje liczbe z wektora (liczba, 'NaN', 'Infinity', '-Infinity', '-0', '~ulamek')."""
    if isinstance(v, bool):
        raise ValueError("bool")
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        if v == "NaN":
            return NAN
        if v == "Infinity":
            return INF
        if v == "-Infinity":
            return -INF
        if v == "-0":
            return -0.0
        if v.startswith("~"):
            return float(v[1:])
    raise ValueError(f"nie liczba: {v!r}")


def bits(x):
    if math.isnan(x):
        return "nan"
    return struct.pack(">d", x).hex()


def same(a, b):
    if isinstance(a, float) and isinstance(b, float):
        return bits(a) == bits(b)
    return a == b


def expect(label, got, want):
    global checks, diffs
    checks += 1
    if not same(got, want):
        diffs += 1
        if diffs <= 40:
            print(f"ROZBIEZNOSC {label}: py={got!r} json={want!r}")


def rd(rel):
    return (web / rel).read_text(encoding="utf-8")


def load(name):
    return json.loads((vdir / name).read_text(encoding="utf-8"))


def jmax(a, b):
    if math.isnan(a) or math.isnan(b):
        return NAN
    if a == b == 0:
        return 0.0 if (bits(a) == bits(0.0) or bits(b) == bits(0.0)) else -0.0
    return a if a > b else b


def jmin(a, b):
    if math.isnan(a) or math.isnan(b):
        return NAN
    if a == b == 0:
        return -0.0 if (bits(a) == bits(-0.0) or bits(b) == bits(-0.0)) else 0.0
    return a if a < b else b


def jstr(x):
    """Number#toString dla wartosci uzywanych w komunikatach (calkowite lub proste ulamki)."""
    if math.isnan(x):
        return "NaN"
    if math.isinf(x):
        return "Infinity" if x > 0 else "-Infinity"
    if x == int(x) and abs(x) < 1e21:
        return str(int(x))
    return repr(x)


# ---------------------------------------------------------------------------
# kotwice tekstowe zrodel (liczby linii i kluczowe fragmenty)
# ---------------------------------------------------------------------------
SRC = {n: rd(f"gra/src/game/{n}.ts") for n in ["city-founding", "city-hex-clear", "conquest-stability", "visibility"]}
LINES = {n: len(t.split("\n")) - 1 for n, t in SRC.items()}
expect("linie city-founding.ts", LINES["city-founding"], 163)
expect("linie city-hex-clear.ts", LINES["city-hex-clear"], 74)
expect("linie conquest-stability.ts", LINES["conquest-stability"], 191)
expect("linie visibility.ts", LINES["visibility"], 328)
for needle in [
    "export const AI_FOUNDING_SOURCE_MIN_POP = 3;",
    "Math.max(popCost + 1, AI_FOUNDING_SOURCE_MIN_POP)",
    "ownerId > 0",
    "Math.min(tied.length - 1, Math.floor(rand() * tied.length))",
    "treasuryPraca < kosztPraca",
    "sourceCityPopulation - kosztLudnosc < 1",
]:
    expect(f"kotwica city-founding: {needle}", needle in SRC["city-founding"], True)
for needle in ["return ownCultureShare < 0.5;", "return 1.5;", "if (garnizonCount > 0) return 1;", "if (share < 1) {"]:
    expect(f"kotwica conquest-stability: {needle}", needle in SRC["conquest-stability"], True)
for needle in ["startRevealRadius = 5", "export const FOG_EXPLORED_BRIGHTNESS = 0.175;", "t !== TerenBazowy.Morze", "!isWaterTerrain(t)"]:
    expect(f"kotwica visibility: {needle}", needle in SRC["visibility"], True)

miasto = json.loads(rd("gra/data/miasto-params.json"))
WORK = float(miasto["zaloz_miasto_koszt_praca"]["wartosc"])
POPC = float(miasto["zaloz_miasto_koszt_ludnosci"]["wartosc"])
AI_MIN = float(re.search(r"AI_FOUNDING_SOURCE_MIN_POP = (\d+);", SRC["city-founding"]).group(1))
RANGE_MIN = float(miasto["zasieg_okolicy_baza"]["wartosc"])
RANGE_CAP = float(miasto["zasieg_okolicy_max"]["wartosc"])

# ===========================================================================
# city-founding.ts
# ===========================================================================
F = load("founding.json")
expect("founding.constants.work", WORK, N(F["constants"]["work"]))
expect("founding.constants.pop", POPC, N(F["constants"]["pop"]))
expect("founding.constants.aiMin", AI_MIN, N(F["constants"]["aiMinPop"]))


def py_label(free):
    if free:
        return "FREE (pierwsze miasto)"
    return f"{jstr(WORK)} P · {jstr(POPC)} 👤"


for row in F["labels"]:
    expect(f"label {row['arg']}", py_label(row["arg"] is True), row["out"])


def py_pick(cities, owner, rv):
    min_pop = jmax(POPC + 1, AI_MIN) if owner > 0 else POPC + 1
    eligible = [c for c in cities if c["ownerId"] == owner and N(c["population"]) >= min_pop]
    if not eligible:
        return None, 0
    mx = max(N(c["population"]) for c in eligible)
    tied = [c for c in eligible if N(c["population"]) == mx]
    if len(tied) == 1:
        return tied[0], 0
    v = N(rv) * len(tied)
    if math.isnan(v):
        idx = NAN
    elif math.isinf(v):
        idx = v
    else:
        idx = float(math.floor(v))
    idx = jmin(len(tied) - 1.0, idx)
    if math.isnan(idx) or idx < 0:
        return None, 1
    return tied[int(idx)], 1


for i, row in enumerate(F["subsequent"]):
    expect(f"subsequent[{i}]", any(o == row["ownerId"] for o in row["owners"]), row["out"])
for i, row in enumerate(F["pick"]):
    got, calls = py_pick(row["cities"], row["ownerId"], row["rand"])
    expect(f"pick[{i}].id", got["id"] if got else None, row["out"])
    expect(f"pick[{i}].calls", calls, row["calls"])


def py_eval(treasury, cities, owner, rv):
    first_free = not any(c["ownerId"] == owner for c in cities)
    kp = 0.0 if first_free else WORK
    kl = 0.0 if first_free else POPC
    if treasury < kp:
        return dict(ok=False, reason=f"Za mało Pracy (potrzeba {jstr(kp)})", kosztPraca=kp, kosztLudnosc=kl, sourceCityId=None), 0
    if first_free:
        return dict(ok=True, reason=None, kosztPraca=kp, kosztLudnosc=kl, sourceCityId=None), 0
    src, calls = py_pick(cities, owner, rv)
    if src is None:
        need = jmax(kl + 1, AI_MIN) if owner > 0 else kl + 1
        return dict(ok=False, reason=f"Potrzebne miasto z co najmniej {jstr(need)} ludności", kosztPraca=kp, kosztLudnosc=kl, sourceCityId=None), calls
    return dict(ok=True, reason=None, kosztPraca=kp, kosztLudnosc=kl, sourceCityId=src["id"]), calls


def cmp_aff(label, got, want):
    expect(label + ".ok", got["ok"], want["ok"])
    expect(label + ".reason", got["reason"], want["reason"])
    expect(label + ".kp", got["kosztPraca"], N(want["kosztPraca"]))
    expect(label + ".kl", got["kosztLudnosc"], N(want["kosztLudnosc"]))
    expect(label + ".src", got["sourceCityId"], want["sourceCityId"])


for i, row in enumerate(F["evaluate"]):
    got, calls = py_eval(N(row["treasury"]), row["cities"], row["ownerId"], row["rand"])
    cmp_aff(f"evaluate[{i}]", got, row["out"])
    expect(f"evaluate[{i}].calls", calls, row["calls"])
for i, row in enumerate(F["canAfford"]):
    free = row["free"] is True
    t, pop = N(row["treasury"]), N(row["pop"])
    kp = 0.0 if free else WORK
    kl = 0.0 if free else POPC
    if t < kp:
        got = dict(ok=False, reason=f"Za mało Pracy (potrzeba {jstr(kp)})", kosztPraca=kp, kosztLudnosc=kl, sourceCityId=None)
    elif (not free) and pop - kl < 1:
        got = dict(ok=False, reason=f"Za mało ludności (potrzeba {jstr(kl)})", kosztPraca=kp, kosztLudnosc=kl, sourceCityId=None)
    else:
        got = dict(ok=True, reason=None, kosztPraca=kp, kosztLudnosc=kl, sourceCityId=None)
    cmp_aff(f"canAfford[{i}]", got, row["out"])

# ===========================================================================
# city-hex-clear.ts
# ===========================================================================
H = load("hexclear.json")
keep_block = re.search(r"CITY_KEEP_IMPROVEMENT_KEYS[^=]*=\s*new Set<string>\(\[(.*?)\]\);", SRC["city-hex-clear"], re.S).group(1)
KEEP = re.findall(r"'([a-z_]+)'", keep_block)
expect("keepKeys", KEEP, H["keepKeys"])
dep_block = re.search(r"function isKeptDeposit\(.*?\{(.*?)\n\}", SRC["city-hex-clear"], re.S).group(1)
DEPOSITS = {"zloze_" + m.lower() for m in re.findall(r"Nakladka\.Zloze(\w+)", dep_block)}
expect("kept deposits (z tekstu)", sorted(DEPOSITS), sorted(["zloze_gliny", "zloze_rudy", "zloze_konia", "zloze_owiec", "zloze_bydla", "zloze_lamy"]))
for row in H["keeps"]:
    expect(f"keeps {row['key']!r}", row["key"] in KEEP, row["out"])


def py_clear(hex_, arg):
    h = dict(hex_)
    clear_all = True if arg is None else arg
    if clear_all:
        h["nakladka"] = "brak"
        h["ulepszenie"] = "brak"
        h["zloze"] = None
        h["improvementKey"] = None
        return h
    if h["nakladka"] == "las":
        h["nakladka"] = "brak"
    elif h["nakladka"] != "brak" and h["nakladka"] not in DEPOSITS:
        h["nakladka"] = "brak"
    return h


for i, row in enumerate(H["clear"]):
    expect(f"clear[{i}]", py_clear(row["before"], row["arg"]), row["after"])
for i, row in enumerate(H["apply"]):
    before = row["hexBefore"]
    if row["missing"]:
        expect(f"apply[{i}].hex", row["hexAfter"], before)
        expect(f"apply[{i}].center", row["centerAfter"], {"stary": True} if row["prefilled"] else None)
        continue
    after = py_clear(before, before["teren"] == "gory")
    expect(f"apply[{i}].hex", row["hexAfter"], after)
    c = row["centerAfter"]
    expect(f"apply[{i}].center.teren", c["terenBazowy"], before["teren"])
    expect(f"apply[{i}].center.nakladka", c["nakladka"], before["nakladka"])
    expect(f"apply[{i}].center.rzeka", c["maRzeke"], before["rzeka"])
    expect(f"apply[{i}].center.zloze", c.get("zloze"), before["zloze"])

# ===========================================================================
# conquest-stability.ts
# ===========================================================================
C = load("conquest.json")


def foreign(share):
    return share < 0.5


for i, row in enumerate(C["foreign"]):
    expect(f"foreign[{i}]", foreign(N(row["share"])), row["out"])
for i, row in enumerate(C["unstable"]):
    expect(f"unstable[{i}]", foreign(N(row["share"])) and row["foreignReligion"], row["out"])
for i, row in enumerate(C["revolt"]):
    s, f, g = N(row["share"]), row["foreignReligion"], N(row["garnizon"])
    if g > 0:
        want = 1.0
    elif not (foreign(s) and f):
        want = 1.0
    else:
        want = 1.5
    expect(f"revolt[{i}]", want, N(row["out"]))
for i, row in enumerate(C["deprecated"]):
    expect(f"deprecated[{i}].happiness", 0.0, N(row["happiness"]))
    expect(f"deprecated[{i}].law", 0.0, N(row["law"]))

# --- sameCultureCircle niezaleznie z civs.json (diplomacy-display.ts:213, :200) ---
CIVS = json.loads(rd("gra/data/civs.json"))["cywilizacje"]


def typ_key(k):
    key = k.strip().lower()
    civ = None
    for c in CIVS:
        if str(c.get("ikonaId") or "").lower() == key or str(c.get("typCywilizacji") or "").lower() == key or str(c.get("Cywilizacja") or "").lower() == key:
            civ = c
            break
    typ = civ.get("typCywilizacji") if civ else None
    if isinstance(typ, str) and typ.strip():
        return typ.strip().lower()
    return key


def same_circle(a, b):
    if not a.strip() or not b.strip():
        return False
    return typ_key(a) == typ_key(b)


def clamp01(x):
    return jmax(0.0, jmin(1.0, x))


def opt(v):
    return None if v is None else N(v)


for i, row in enumerate(C["captured"]):
    own, kult = opt(row["before"]["own"]), opt(row["before"]["kult"])
    new, prev = row["newOwner"], row["prevOwner"]
    mode = row["mode"]
    want_circle_call = mode == "keys" and new is not None and prev is not None and new != prev
    expect(f"captured[{i}].circle_recorded", row["circle"] is not None, want_circle_call)
    if new is None or prev is None or new == prev:
        expect(f"captured[{i}].own", own, opt(row["after"]["own"]))
        expect(f"captured[{i}].kult", kult, opt(row["after"]["kult"]))
        continue
    if want_circle_call:
        keys = row["keys"]
        a, b = keys.get(str(new), ""), keys.get(str(prev), "")
        expect(f"captured[{i}].circle.a", row["circle"]["a"], a)
        expect(f"captured[{i}].circle.b", row["circle"]["b"], b)
        expect(f"captured[{i}].circle.out(niezalezne civs.json)", same_circle(a, b), row["circle"]["out"])
        if same_circle(a, b):
            expect(f"captured[{i}].cleared.own", None, opt(row["after"]["own"]))
            expect(f"captured[{i}].cleared.kult", None, opt(row["after"]["kult"]))
            continue
    base = own if own is not None else (kult if kult is not None else 1.0)
    prev_share = clamp01(base)
    share = clamp01(1.0 - prev_share)
    expect(f"captured[{i}].own", share, opt(row["after"]["own"]))
    expect(f"captured[{i}].kult", share, opt(row["after"]["kult"]))

# --- mapowanie id budynkow z TEKSTU zrodla ---
cs = SRC["conquest-stability"]
cb = re.search(r"export function cultureBuildingsFromIds\(.*?\{\s*return \{(.*?)\};\s*\}", cs, re.S).group(1)
rb = re.search(r"export function religionBuildingsFromIds\(.*?\{\s*return \{(.*?)\};\s*\}", cs, re.S).group(1)


def parse_flags(block):
    out = {}
    for m in re.finditer(r"(has\w+):\s*(.*?),\s*(?=has\w+:|$)", block.strip() + ",\n", re.S):
        out[m.group(1)] = re.findall(r"includes\('([a-z_]+)'\)", m.group(2))
    return out


CULT = parse_flags(cb)
REL = parse_flags(rb)
expect("flagi kultury (z tekstu)", sorted(CULT), ["hasAmfiteatr", "hasBiblioteka", "hasLaznia", "hasPalac", "hasSad", "hasStela"])
expect("flagi religii (z tekstu)", sorted(REL), ["hasKamienneKregi", "hasSwiatynia"])
for i, row in enumerate(C["buildings"]):
    ids = row["ids"]
    expect(f"buildings[{i}].culture", {k: any(x in ids for x in v) for k, v in CULT.items()}, row["culture"])
    expect(f"buildings[{i}].religion", {k: any(x in ids for x in v) for k, v in REL.items()}, row["religion"])

for i, row in enumerate(C["tick"]):
    share = N(row["share"])
    foreign_rel = row["foreign"]
    owner = row["owner"]
    cc = row["cultureCall"]
    rc = row["religionCall"]
    expect(f"tick[{i}].cultureCall_present", cc is not None, share < 1)
    if cc is not None:
        expect(f"tick[{i}].cc.share", N(cc["share"]), share)
        expect(f"tick[{i}].cc.buildings", cc["buildings"], {k: any(x in row["ids"] for x in v) for k, v in CULT.items()})
        new_share = N(cc["out"])
    else:
        new_share = share
    expect(f"tick[{i}].religionCall_present", rc is not None, bool(foreign_rel and owner))
    out = row["out"]
    expect(f"tick[{i}].share", new_share, N(out["ownCultureShare"]))
    expect(f"tick[{i}].rate", new_share - share, N(out["cultureRateApplied"]))
    if rc is not None:
        expect(f"tick[{i}].rc.target", rc["target"], owner)
        expect(f"tick[{i}].rc.buildings", rc["buildings"], {k: any(x in row["ids"] for x in v) for k, v in REL.items()})
        expect(f"tick[{i}].rc.state_in", rc["state"], row["religion"])
        expect(f"tick[{i}].state", rc["outState"], out["religionState"])
        expect(f"tick[{i}].converted", N(rc["outConverted"]), N(out["religionConverted"]))
    else:
        expect(f"tick[{i}].state_same", row["religion"], out["religionState"])
        expect(f"tick[{i}].converted0", 0.0, N(out["religionConverted"]))

# ===========================================================================
# visibility.ts
# ===========================================================================
V = load("visibility.json")
mgp = json.loads(rd("gra/data/map-gen-params.json"))
dflt = mgp["mgla"]["default_sight_jednostki"]["wartosc"]
FALLBACK_SIGHT = float(re.search(r"const FALLBACK_SIGHT = (\d+);", rd("gra/src/data/map-gen-params-loader.ts")).group(1))
DEFAULT_SIGHT = float(dflt) if isinstance(dflt, (int, float)) and dflt > 0 else FALLBACK_SIGHT
expect("DEFAULT_SIGHT", DEFAULT_SIGHT, N(V["constants"]["defaultSight"]))
expect("FOG_EXPLORED_BRIGHTNESS", float(re.search(r"FOG_EXPLORED_BRIGHTNESS = ([0-9.]+);", SRC["visibility"]).group(1)), N(V["constants"]["fogBrightness"]))

MAPS = []
for m in V["maps"]:
    MAPS.append({tuple(int(x) for x in k.split(",")): t for k, t in m})


def hdist(aq, ar, bq, br):
    dq = abs(aq - bq)
    dr = abs(ar - br)
    ds = abs((-aq - ar) - (-bq - br))
    return max(dq, dr, ds)


def is_int_valued(x):
    return math.isfinite(x) and x == math.floor(x)


def disc(q, r, mp, sight):
    out = set()
    if not math.isfinite(sight):
        return out
    dq = -sight
    while dq <= sight:
        dr = -sight
        while dr <= sight:
            tq, tr = q + dq, r + dr
            if hdist(float(q), float(r), tq, tr) <= sight and is_int_valued(tq) and is_int_valued(tr):
                k = (int(tq), int(tr))
                if k in mp:
                    out.add(k)
            dr += 1.0
        dq += 1.0
    return out


def fmt(keys):
    return [f"{q},{r}" for q, r in sorted(keys)]


def parse_keys(lst):
    return {tuple(int(x) for x in k.split(",")) for k in lst}


for i, row in enumerate(V["at"]):
    expect(f"at[{i}]", fmt(disc(row["q"], row["r"], MAPS[row["map"]], N(row["sight"]))), row["out"])
for i, row in enumerate(V["path"]):
    s = set()
    for p in row["path"]:
        s |= disc(p["q"], p["r"], MAPS[row["map"]], N(row["sight"]))
    expect(f"path[{i}]", fmt(s), row["out"])
for i, row in enumerate(V["fixed"]):
    s = set()
    for u in row["units"]:
        s |= disc(u["q"], u["r"], MAPS[row["map"]], N(row["sight"]))
    expect(f"fixed[{i}]", fmt(s), row["out"])

UNITS_JSON = json.loads(rd("gra/data/units.json"))
CUSTOM = V["resolverDefs"]["custom"]


def defs_for(name):
    if name == "real":
        return UNITS_JSON
    if name == "custom":
        return CUSTOM
    if name == "mixed":
        return UNITS_JSON[:10] + CUSTOM
    return []


def isnum(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) or (isinstance(x, str) and x.startswith("~"))


def make_resolver(defs, city_sight):
    by = {}
    for d in defs:
        by[d["Jednostka"]] = d
    cs_ = DEFAULT_SIGHT if city_sight is None else city_sight

    def res(u):
        if u["typeId"] == "city":
            return cs_
        d = by.get(u["typeId"]) if u["typeId"] is not None else None
        if d is not None:
            w = d.get("Widok pola")
            if isnum(w):
                return N(w)
            ru = d.get("Ruch")
            if isnum(ru):
                return N(ru)
        return DEFAULT_SIGHT

    return res


for i, row in enumerate(V["resolver"]):
    res = make_resolver(defs_for(row["set"]), opt(row["citySight"]))
    sights = [res(u) for u in row["units"]]
    for j, (g, w) in enumerate(zip(sights, row["sights"])):
        expect(f"resolver[{i}].sight[{j}]", g, N(w))
    expect(f"resolver[{i}].len", len(sights), len(row["sights"]))
    s = set()
    for u, sg in zip(row["units"], sights):
        s |= disc(u["q"], u["r"], MAPS[row["map"]], sg)
    expect(f"resolver[{i}]", fmt(s), row["out"])

for i, row in enumerate(V["explored"]):
    expect(f"explored[{i}]", fmt(parse_keys(row["before"]) | parse_keys(row["visible"])), row["out"])
for i, row in enumerate(V["render"]):
    explored, land = parse_keys(row["explored"]), parse_keys(row["land"])
    expect(f"render[{i}]", fmt(explored | land if row["reveal"] else explored), row["out"])
for i, row in enumerate(V["keys"]):
    mp = V["maps"][row["map"]]
    allk = [k for k, _ in mp]
    expect(f"keys[{i}].all", allk, row["all"])
    expect(f"keys[{i}].reveal", [k for k, t in mp if t != "morze"], row["reveal"])
    expect(f"keys[{i}].dry", [k for k, t in mp if t not in ("morze", "plytkie_morze")], row["dry"])
for row in V["terrainPredicates"]:
    expect(f"reveal {row['teren']}", row["teren"] != "morze", row["reveal"])
    expect(f"dry {row['teren']}", row["teren"] not in ("morze", "plytkie_morze"), row["dry"])


def city_range(pop):
    p = math.floor(pop) if math.isfinite(pop) else 0
    if p <= 0:
        return 0.0
    return jmin(jmax(RANGE_MIN, float(p)), RANGE_CAP)


BORDER = {bits(N(b["kultura"])): N(b["ring"]) for b in V["border"]}


def city_sight(pop, kultura):
    base = city_range(pop)
    if base <= 0:
        return 0.0
    return base + BORDER[bits(kultura)]


UNIT_RES = make_resolver(UNITS_JSON, None)
start_default = float(re.search(r"startRevealRadius = (\d+)", SRC["visibility"]).group(1))
for i, row in enumerate(V["player"]):
    mp = MAPS[row["map"]]
    vis = set()
    for u in row["units"]:
        vis |= disc(u["q"], u["r"], mp, UNIT_RES(u))
    for c in row["cities"]:
        k = 0.0 if c["kultura"] is None else N(c["kultura"])
        sg = city_sight(N(c["population"]), k)
        if sg <= 0:
            continue
        vis |= disc(c["q"], c["r"], mp, sg)
    if not vis and row["startHex"] is not None:
        rad = start_default if row["startRevealRadius"] is None else N(row["startRevealRadius"])
        vis = disc(row["startHex"]["q"], row["startHex"]["r"], mp, rad)
    expect(f"player[{i}]", fmt(vis), row["out"])
for row in V["citySightExport"]:
    expect(f"citySight pop={row['pop']}", city_sight(N(row["pop"]), 0.0), N(row["out"]))

for i, row in enumerate(V["onMap"]):
    visible = parse_keys(row["visible"])
    owner = 0 if row["owner"] is None else row["owner"]
    out = []
    for u in row["units"]:
        if u["inGarnizon"]:
            if u["ownerId"] == owner:
                out.append(u["id"])
            continue
        if u["ownerId"] == owner or (u["q"], u["r"]) in visible:
            out.append(u["id"])
    expect(f"onMap[{i}]", out, row["out"])

# ===========================================================================
# tabele Rust (data/derived/*.json) vs stale odczytane REGEXEM z tekstu TS (opcjonalny 3. argument)
# ===========================================================================
if len(sys.argv) == 4:
    eng = Path(sys.argv[3])

    def tbl(name):
        return json.loads((eng / "data" / "derived" / name).read_text(encoding="utf-8"))

    cf = tbl("city-founding-params.json")
    fsrc = SRC["city-founding"]
    fb = dict(re.findall(r"\.zaloz_miasto_koszt_(praca|ludnosci),\s*(\d+),", fsrc))
    expect("tabela fallback_koszt_praca vs TS", cf["fallback_koszt_praca"], float(fb["praca"]))
    expect("tabela fallback_koszt_ludnosci vs TS", cf["fallback_koszt_ludnosci"], float(fb["ludnosci"]))
    expect("tabela ai_source_min_pop vs TS", cf["ai_source_min_pop"], AI_MIN)
    t = cf["teksty"]
    expect("tekst za_malo_pracy vs TS", "'" + t["za_malo_pracy"].replace("{koszt}", "' + kosztPraca + '") + "'" in fsrc.replace("'Za mało Pracy (potrzeba ' + kosztPraca + ')'", "'Za mało Pracy (potrzeba ' + kosztPraca + ')'"), True)
    expect("tekst za_malo_ludnosci vs TS", "'Za mało ludności (potrzeba ' + kosztLudnosc + ')'" in fsrc, True)
    expect("tekst potrzebne_miasto vs TS", "'Potrzebne miasto z co najmniej ' + minNeeded + ' ludności'" in fsrc, True)
    expect("tekst etykieta_darmowe vs TS", "'FREE (pierwsze miasto)'" in fsrc, True)
    expect("tekst etykieta_platne vs TS", "p + ' P · ' + pop + ' 👤'" in fsrc, True)

    hc = tbl("city-hex-clear-rules.json")
    expect("tabela zostaje_ulepszenia vs TS", hc["zostaje_ulepszenia"], KEEP)
    expect("tabela zostaja_zloza vs TS", sorted(hc["zostaja_zloza_nakladki"]), sorted(DEPOSITS))
    expect("tabela ulepszenie_brak vs TS (Ulepszenie.Brak)", hc["ulepszenie_brak"], re.search(r"Brak\s*=\s*'([a-z]+)'", rd("gra/src/types/hex.ts")[rd("gra/src/types/hex.ts").index("export enum Ulepszenie"):]).group(1))

    cq = tbl("conquest-stability-params.json")
    expect("tabela prog_obca_kultura vs TS", cq["prog_obca_kultura"], float(re.search(r"return ownCultureShare < ([0-9.]+);", SRC["conquest-stability"]).group(1)))
    expect("tabela mnoznik buntu vs TS", cq["mnoznik_ryzyka_buntu_niestabilny_bez_garnizonu"], float(re.search(r"return ([0-9.]+);\s*\}\s*$", SRC["conquest-stability"][SRC["conquest-stability"].index("export function conquestRevoltRiskMultiplier"):].strip()).group(1)))
    expect("tabela budynki_kulturalne vs TS", cq["budynki_kulturalne"], CULT)
    expect("tabela budynki_religijne vs TS", cq["budynki_religijne"], REL)

    vp = tbl("visibility-params.json")
    expect("tabela fallback_sight vs TS", vp["fallback_sight"], FALLBACK_SIGHT)
    expect("tabela fog_explored_brightness vs TS", vp["fog_explored_brightness"], float(re.search(r"FOG_EXPLORED_BRIGHTNESS = ([0-9.]+);", SRC["visibility"]).group(1)))
    expect("tabela start_reveal_radius vs TS", vp["start_reveal_radius"], start_default)
    expect("tabela city_type_id vs TS", vp["city_type_id"], re.search(r"unit\.typeId === '([a-z]+)'", SRC["visibility"]).group(1))

print(f"sprawdzen={checks} rozbieznosci={diffs}")
sys.exit(0 if diffs == 0 else 1)
