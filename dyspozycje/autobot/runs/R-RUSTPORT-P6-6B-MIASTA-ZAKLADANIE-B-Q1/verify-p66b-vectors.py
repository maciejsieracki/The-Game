#!/usr/bin/env python3
"""Niezalezny weryfikator wektorow P6.6B (R-RUSTPORT-P6-6B-MIASTA-ZAKLADANIE-B-Q1).

NIE uzywa TypeScript, Node, gen-p66b-vectors.mjs ani kodu Rust. Semantyke display-names.ts /
empire-city-defaults.ts / cities.ts implementuje od nowa w Pythonie na podstawie TEKSTU zrodel weba
(git archive edb8fb56): wejscia bierze z wektorow JSON, wynik liczy sam i porownuje z wyjsciem zapisanym
z URUCHOMIONEGO weba (bitowo dla f64). Stale czyta z tekstu zrodel (regex) i z gra/data/*.json. Wyniki
zaleznosci spoza zakresu (readCityFoodBuffer, ensureCityRationDefaults, Date.now) sa wejsciem (zapisane
z prawdziwego weba).

Uzycie:  python3 -I verify-p66b-vectors.py <WEB_ROOT> <VECTORS_DIR>
Wyjscie: 0 = 0 rozbieznosci, 1 = rozbieznosci, 2 = blad wejscia.
"""
import json
import math
import re
import struct
import sys
from pathlib import Path

if len(sys.argv) != 3:
    print("usage: <WEB_ROOT> <VECTORS_DIR>")
    sys.exit(2)
web = Path(sys.argv[1])
vdir = Path(sys.argv[2])

checks = 0
diffs = 0
NAN = float("nan")
INF = float("inf")


def bits(x):
    if math.isnan(x):
        return "nan"
    return struct.pack(">d", x).hex()


def is_special(s):
    return s in ("NaN", "Infinity", "-Infinity", "-0") or s.startswith("~")


def is_num(v):
    """typeof v === 'number' dla wartosci z wektora."""
    if isinstance(v, bool):
        return False
    if isinstance(v, (int, float)):
        return True
    return isinstance(v, str) and is_special(v)


def N(v):
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


def canon(v):
    """Kanoniczna postac wartosci wektora: liczby -> float, reszta bez zmian."""
    if isinstance(v, bool) or v is None:
        return v
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        return N(v) if is_special(v) else v
    if isinstance(v, list):
        return [canon(x) for x in v]
    if isinstance(v, dict):
        return {k: canon(x) for k, x in v.items()}
    return v


def same(a, b):
    if isinstance(a, bool) or isinstance(b, bool):
        return isinstance(a, bool) and isinstance(b, bool) and a == b
    if isinstance(a, float) and isinstance(b, float):
        return bits(a) == bits(b)
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(same(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(same(a[k], b[k]) for k in a)
    return a == b and type(a) is type(b)


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


# ---------------------------------------------------------------------------
# semantyka JS
# ---------------------------------------------------------------------------
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


def jround(x):
    if math.isnan(x) or math.isinf(x):
        return x
    fl = math.floor(x)
    r = float(fl + 1) if (x - fl) >= 0.5 else float(fl)
    if r == 0 and (x < 0 or bits(x) == bits(-0.0)):
        return -0.0
    return r


def jfloor(x):
    if math.isnan(x) or math.isinf(x) or x == 0:
        return x
    return float(math.floor(x))


def jstr(x):
    if math.isnan(x):
        return "NaN"
    if math.isinf(x):
        return "Infinity" if x > 0 else "-Infinity"
    if x == 0:
        return "0"
    if x == int(x) and abs(x) < 1e21:
        return str(int(x))
    r = repr(x)
    if "e" in r:
        m, e = r.split("e")
        ex = int(e)
        r = f"{m}e{'+' if ex >= 0 else '-'}{abs(ex)}"
    return r


JS_WS = set("\t\n\u000b\u000c\r \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff")


def jtrim(s):
    i, j = 0, len(s)
    while i < j and s[i] in JS_WS:
        i += 1
    while j > i and s[j - 1] in JS_WS:
        j -= 1
    return s[i:j]


def clamp01(x):
    return jmax(0.0, jmin(100.0, x))


# ---------------------------------------------------------------------------
# kotwice tekstowe zrodel (liczby linii i kluczowe fragmenty)
# ---------------------------------------------------------------------------
SRC = {n: rd(f"gra/src/game/{n}.ts") for n in ["cities", "empire-city-defaults", "display-names"]}
LINES = {n: len(t.split("\n")) - 1 for n, t in SRC.items()}
expect("linie cities.ts", LINES["cities"], 1393)
expect("linie empire-city-defaults.ts", LINES["empire-city-defaults"], 554)
expect("linie display-names.ts", LINES["display-names"], 311)
for needle in [
    "export const MIN_PODZIAL_PRACY_BUDYNKI_PERCENT = 50;",
    "export const MAX_PODZIAL_PRACY_BUDYNKI_PERCENT = 100;",
    "export const AI_FIXED_PROCENT_BUDYNKI = 50;",
    "export const MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA = 10;",
    "export const MAX_PROCENT_NAUKA = 60;",
    "export const HANDEL_PCT_STEP = 10;",
    "export const DEFAULT_ULEPSZENIA_PRACA_PERCENT: UlepszeniaPracaPercent = 33;",
    "export const AI_MAJOR_ULEPSZENIA_PRACA_PERCENT: UlepszeniaPracaPercent = 100;",
    "export const MAX_ULEPSZENIA_PRACA_AUTO_PERCENT: UlepszeniaPracaPercent = 100;",
    "export const MIN_CITY_DISTANCE_START_CITY_STATE = 3;",
    "const base = opts.gameConfig.cityLimitBase ?? 10;",
    "const limit = base + (era - 1) * 5;",
    "wealthImmunityRemaining: 5,",
    "export const DEFAULT_OKOLICA_FOCUS: OkolicaFocus = 'zywnosc';",
    "export const DEFAULT_BUDOWA_TRYB: BudowaTryb = 'reczny';",
    "export const AI_DEFAULT_BUDOWA_TRYB: BudowaTryb = 'zrownowazone';",
    "if (oid === 0) continue;",
]:
    expect(f"kotwica: {needle}", needle in SRC["cities"] + SRC["empire-city-defaults"], True)

MIN_B = float(re.search(r"MIN_PODZIAL_PRACY_BUDYNKI_PERCENT = (\d+);", SRC["cities"]).group(1))
MAX_B = float(re.search(r"MAX_PODZIAL_PRACY_BUDYNKI_PERCENT = (\d+);", SRC["cities"]).group(1))
DEF_B = float(re.search(r"DEFAULT_PODZIAL_PRACY[^=]*= \{\s*procentBudynki: (\d+),", SRC["cities"]).group(1))
AI_B = float(re.search(r"AI_FIXED_PROCENT_BUDYNKI = (\d+);", SRC["cities"]).group(1))
ZAS3 = float(re.search(r"MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA = (\d+);", SRC["cities"]).group(1))
MAX_N = float(re.search(r"MAX_PROCENT_NAUKA = (\d+);", SRC["cities"]).group(1))
STEP = float(re.search(r"HANDEL_PCT_STEP = (\d+);", SRC["cities"]).group(1))
UPD_DEF = float(re.search(r"DEFAULT_ULEPSZENIA_PRACA_PERCENT: UlepszeniaPracaPercent = (\d+);", SRC["cities"]).group(1))
UPD_AI = float(re.search(r"AI_MAJOR_ULEPSZENIA_PRACA_PERCENT: UlepszeniaPracaPercent = (\d+);", SRC["cities"]).group(1))
UPD_MAX = float(re.search(r"MAX_ULEPSZENIA_PRACA_AUTO_PERCENT: UlepszeniaPracaPercent = (\d+);", SRC["cities"]).group(1))
DIST_CS = float(re.search(r"MIN_CITY_DISTANCE_START_CITY_STATE = (\d+);", SRC["cities"]).group(1))
HS = re.search(r"DEFAULT_PODZIAL_HANDLU[^=]*= \{\s*procentNauka:\s+(\d+),\s*procentPieniadz:\s+(\d+),\s*procentLuksus:\s+(\d+),", SRC["cities"])
DEF_H = {"procentNauka": float(HS.group(1)), "procentPieniadz": float(HS.group(2)), "procentLuksus": float(HS.group(3))}
MIASTO = json.loads(rd("gra/data/miasto-params.json"))
MIN_DIST = float(MIASTO["min_dystans_miast"]["wartosc"])
POP_V85 = rd("gra/src/game/population-growth-v85.ts")
DEF_RACJI = float(re.search(r"export const DEFAULT_POZIOM_RACJI: PoziomRacji = (\d+);", POP_V85).group(1))
WYZ_MAX = float(re.search(r"export const WYZYWIENIE_MAX = (\d+);", POP_V85).group(1))
CITY_NAMES = re.findall(r"'([^']+)',", re.search(r"const CITY_NAMES: readonly string\[\] = \[(.*?)\];", SRC["cities"], re.S).group(1))
LABEL = re.search(r"CITY_STATE_LABEL = '([^']+)';", SRC["display-names"]).group(1)
SEP = re.search(r"CITY_STATE_SEPARATOR = '([^']+)';", SRC["display-names"]).group(1)
BUDOWA_DEF_PRIO = re.findall(r"'(\w+)'", re.search(r"DEFAULT_BUDOWA_PRIORYTET_TYPOW: readonly BudowaFocus\[\] = \[(.*?)\];", SRC["cities"], re.S).group(1))
BUDOWA_TYP = re.findall(r"'(\w+)'", re.search(r"BUDOWA_TYP_FOCUS: readonly BudowaFocus\[\] = \[(.*?)\];", SRC["cities"], re.S).group(1))
PULA_LBL = re.search(r"PODZIAL_PRACY_PULA_LBL = '([^']+)';", SRC["cities"]).group(1)
PULA_LBL_PELNA = re.search(r"PODZIAL_PRACY_PULA_LBL_PELNA = '([^']+)';", SRC["cities"]).group(1)
TIP_PARTS = re.search(r"PODZIAL_PRACY_PULA_TIP = (.*?)';\n", SRC["cities"], re.S).group(1) + "'"
PULA_TIP = "".join(re.findall(r"'([^']*)'", TIP_PARTS))

# ===========================================================================
# display-names.ts
# ===========================================================================
D = load("display.json")
expect("display.label", D["constants"]["label"], LABEL)
expect("display.separator", D["constants"]["separator"], SEP)


def fmt(base, is_cs):
    b = jtrim(base if base is not None else "")
    if not b:
        return ""
    return b + SEP + LABEL if is_cs else b


def strip(name):
    suffix = SEP + LABEL
    return name[: -len(suffix)] if name.endswith(suffix) else name


TECH = [re.compile(p, re.I | re.A) for p in (r"Rywal [0-9]+", r"AI [0-9]+", r"oid-[0-9]+")]
expect("kotwica display: regexy", all(x in SRC["display-names"] for x in ["/^Rywal \\d+$/i", "/^AI \\d+$/i", "/^oid-\\d+$/i"]), True)


def technical(name):
    t = jtrim(name if name is not None else "")
    if not t:
        return True
    return any(rx.fullmatch(t) for rx in TECH)


for i, row in enumerate(D["format"]):
    expect(f"format[{i}]", fmt(row["base"], row["isCs"]), row["out"])
for i, row in enumerate(D["strip"]):
    expect(f"strip[{i}]", strip(row["name"]), row["out"])
for i, row in enumerate(D["technical"]):
    expect(f"technical[{i}]", technical(row["name"]), row["out"])
for i, row in enumerate(D["slot"]):
    if row["player"]:
        want = False
    elif row["rival"]:
        want = True
    else:
        want = not row["cap"]
    expect(f"slot[{i}]", want, row["out"])


def owner_cs(owner, opts):
    if owner <= 0:
        return False
    if opts is None:
        return False
    if owner in opts.get("simplified", []):
        return True
    if owner in opts.get("typCopy", []):
        return True
    return any(c["ownerId"] == owner and bool(c.get("startCityState")) for c in opts.get("cities", []))


for i, row in enumerate(D["ownerCs"]):
    expect(f"ownerCs[{i}]", owner_cs(row["ownerId"], row["opts"]), row["out"])
for i, row in enumerate(D["clear"]):
    before = row["before"]
    if before is not True:
        expect(f"clear[{i}].ret", False, row["ret"])
        expect(f"clear[{i}].after", before, row["after"])
    else:
        expect(f"clear[{i}].ret", True, row["ret"])
        expect(f"clear[{i}].after", False, row["after"])


def force(owner, opts):
    if owner <= 0:
        return False
    if owner_cs(owner, opts["base"] if opts else None):
        return True
    pk = jtrim((opts or {}).get("playerCivKey") or "")
    ok = jtrim((opts or {}).get("ownerCivKey") or "")
    caps = (opts or {}).get("clusterCapitalOwnerIds")
    if pk and ok and pk == ok and not (caps is not None and owner in caps):
        return True
    return False


for i, row in enumerate(D["force"]):
    expect(f"force[{i}]", force(row["ownerId"], row["opts"]), row["out"])


def clean(v):
    return strip(v) if (v and not technical(v)) else None


def foreign_name(city, civ):
    c = clean(city)
    if c is not None:
        return c
    c = clean(civ)
    if c is not None:
        return c
    return ""


def map_label(city, opts):
    player = (opts or {}).get("playerOwnerId")
    player = 0 if player is None else player
    foreign = city["ownerId"] != player
    is_cs = foreign and bool(city.get("startCityState"))
    cs_owner = (opts or {}).get("isCityStateOwner") is True
    if foreign and (opts or {}).get("isCapital") is True and not is_cs and not cs_owner:
        base = foreign_name(city["name"], opts.get("civDisplayName"))
        if base:
            return fmt(base, False)
    return fmt(city["name"], is_cs)


for i, row in enumerate(D["mapLabel"]):
    expect(f"mapLabel[{i}]", map_label(row["city"], row["opts"]), row["out"])
for i, row in enumerate(D["diplo"]):
    expect(f"diplo[{i}]", fmt(strip(row["base"]), owner_cs(row["ownerId"], row["opts"])), row["out"])


def resolve(inp):
    cached, cityName, civ = inp.get("cached"), inp.get("cityName"), inp.get("civDisplayName")
    is_cs, is_cap = inp["isCityState"], bool(inp.get("isClusterCapital"))
    cc, cv, ch = clean(cityName), clean(civ), clean(cached)
    if is_cap and cv:
        return cv
    if is_cs and cc and cv and cc != cv:
        return cc + SEP + cv
    if is_cs and cv:
        return cv
    if is_cs and cc:
        return cc
    if (not is_cs) and cv:
        return cv
    if ch:
        return ch
    if cc:
        return cc
    if cv:
        return cv
    if cached is not None and jtrim(cached):
        return strip(cached)
    if cityName is not None and jtrim(cityName):
        return strip(cityName)
    return ""


for i, row in enumerate(D["resolve"]):
    expect(f"resolve[{i}]", resolve(row["input"]), row["out"])


def sanitize(base, civ):
    t = jtrim(base if base is not None else "")
    if t and not technical(t):
        return strip(t)
    c = strip(civ) if (civ and not technical(civ)) else None
    return c if c is not None else ""


for i, row in enumerate(D["sanitize"]):
    expect(f"sanitize[{i}]", sanitize(row["base"], row["civ"]), row["out"])
for i, row in enumerate(D["foreign"]):
    expect(f"foreign[{i}]", foreign_name(row["city"], row["civ"]), row["out"])

# ===========================================================================
# cities.ts - procenty, polityka, handel
# ===========================================================================
P = load("percent.json")
K = P["constants"]
expect("const.okolica", (K["okolicaFocus"], K["okolicaTryb"]), ("zywnosc", "auto"))
expect("const.budowa", (K["budowaFocus"], K["budowaTryb"]), ("zrownowazone", "reczny"))
expect("const.ulepszenia", (K["ulepszeniaFocus"], K["ulepszeniaTryb"]), ("zrownowazone", "reczny"))
expect("const.onlyWorked", K["ulepszeniaOnlyWorked"], True)
expect("const.wolno", K["ulepszeniaWolnoWycinacLas"], False)
expect("const.praca", canon(K["ulepszeniaPracaPercent"]), UPD_DEF)
expect("const.aiMajor", canon(K["aiMajorUlepszeniaPracaPercent"]), UPD_AI)
expect("const.maxAuto", canon(K["maxUlepszeniaPracaAutoPercent"]), UPD_MAX)
expect("const.prio", K["budowaPriorytetTypow"], BUDOWA_DEF_PRIO)
expect("const.typ", K["budowaTypFocus"], BUDOWA_TYP)
expect("const.handel", canon(K["podzialHandlu"]), DEF_H)
expect("const.pracy", canon(K["podzialPracy"]), {"procentBudynki": DEF_B})
expect("const.minB", canon(K["minPodzialPracyBudynki"]), MIN_B)
expect("const.maxB", canon(K["maxPodzialPracyBudynki"]), MAX_B)
expect("const.aiB", canon(K["aiFixedProcentBudynki"]), AI_B)
expect("const.maxPula", canon(K["maxProcentPuliImperium"]), 100.0 - MIN_B)
expect("const.zasada3", canon(K["minProcentPuliZasada3"]), ZAS3)
expect("const.lblPula", K["lblPula"], PULA_LBL)
expect("const.lblPulaPelna", K["lblPulaPelna"], PULA_LBL_PELNA)
expect("const.tip", K["tipPula"], PULA_TIP)
expect("const.minPula", canon(K["minProcentPuliImperium"]), 100.0 - MAX_B)
expect("const.rozwoj", canon(K["procentRozwoj"]), 100.0)
expect("const.rozwojWyz", canon(K["procentRozwojWyzywienie"]), jround(DEF_RACJI / WYZ_MAX * 100))
expect("const.step", canon(K["handelPctStep"]), STEP)
expect("const.maxNauka", canon(K["maxProcentNauka"]), MAX_N)
expect("const.aiNauka", canon(K["aiFixedProcentNauka"]), MAX_N)
expect("const.minCity", canon(K["minCityDistance"]), MIN_DIST)
expect("const.minCityCs", canon(K["minCityDistanceStartCityState"]), DIST_CS)
expect("const.empty", K["emptyBiblioteka"], [])
expect("const.racji", canon(K["defaultPoziomRacji"]), DEF_RACJI)
expect("const.wyzMax", canon(K["wyzywienieMax"]), WYZ_MAX)
expect("const.wealth", canon(K["freshWealth"]), {"poziom": 1.0, "pula": 0.0})
expect("wealth.ts: freshWealthState", "return { poziom: 1, pula: 0 };" in rd("gra/src/game/wealth.ts"), True)


def typed(v):
    return N(v) if is_num(v) else None


def clamp_upd(n):
    if n is None or not math.isfinite(n):
        return UPD_DEF
    return jmax(0.0, jmin(UPD_MAX, jround(n)))


def clamp_prac(n):
    if n is None or not math.isfinite(n):
        return DEF_B
    return jmax(MIN_B, jmin(MAX_B, jround(n)))


for i, row in enumerate(P["clampUlepszenia"]):
    expect(f"clampUlepszenia[{i}]", clamp_upd(typed(row["n"])), N(row["out"]))
for i, row in enumerate(P["clampPodzial"]):
    expect(f"clampPodzial[{i}]", clamp_prac(typed(row["n"])), N(row["out"]))
for i, row in enumerate(P["pulaZBudynkow"]):
    expect(f"pulaZBudynkow[{i}]", 100.0 - clamp_prac(typed(row["n"])), N(row["out"]))
for i, row in enumerate(P["podzialZPuli"]):
    n = typed(row["n"])
    p = jmax(100.0 - MAX_B, jmin(100.0 - MIN_B, jround(n))) if (n is not None and math.isfinite(n)) else 100.0 - DEF_B
    expect(f"podzialZPuli[{i}]", {"procentBudynki": clamp_prac(100.0 - p)}, canon(row["out"]))


def snap(n):
    return jmax(0.0, jmin(100.0, jround(n / STEP) * STEP))


for i, row in enumerate(P["snap"]):
    expect(f"snap[{i}]", snap(N(row["n"])), N(row["out"]))
for i, row in enumerate(P["migratePerTurn"]):
    n = N(row["n"])
    expect(f"migrate[{i}]", 33.0 if n == 1 else 66.0 if n == 2 else 100.0, N(row["out"]))
for i, row in enumerate(P["resolveRaw"]):
    nv, lv = row["newVal"], row["legacy"]
    if is_num(nv):
        want = clamp_upd(N(nv))
    elif is_num(lv) and N(lv) in (1.0, 2.0, 3.0):
        want = {1.0: 33.0, 2.0: 66.0, 3.0: 100.0}[N(lv)]
    else:
        want = UPD_DEF
    expect(f"resolveRaw[{i}]", want, N(row["out"]))


def normalize(s):
    p, n, l = snap(N(s["procentPieniadz"])), snap(N(s["procentNauka"])), snap(N(s["procentLuksus"]))
    n = jmin(n, MAX_N)
    total = p + n + l
    if total != 100:
        l = clamp01(l + (100 - total))
        total = p + n + l
        if total != 100:
            n = clamp01(n + (100 - total))
            n = jmin(n, MAX_N)
            total = p + n + l
            if total != 100:
                p = clamp01(p + (100 - total))
    return {"procentPieniadz": p, "procentNauka": n, "procentLuksus": l}


for i, row in enumerate(P["normalize"]):
    expect(f"normalize[{i}]", normalize(row["split"]), canon(row["out"]))

ORDER = ["procentPieniadz", "procentNauka", "procentLuksus"]


def adjust(cur, changed, new_val):
    cur = {k: N(v) for k, v in cur.items()}
    nxt = dict(cur)
    cv = snap(new_val)
    if changed == "procentNauka":
        cv = jmin(cv, MAX_N)
    nxt[changed] = cv
    keys = [k for k in ORDER if k != changed]
    rem = 100 - nxt[changed]
    if rem < 0:
        nxt[changed] = 100.0
        for k in keys:
            nxt[k] = 0.0
        return nxt
    k0, k1 = keys
    nk = k0 if k0 == "procentNauka" else (k1 if k1 == "procentNauka" else None)
    nonk = (k1 if nk == k0 else (k0 if nk == k1 else None)) if nk is not None else None
    if nk is not None and nonk is not None:
        if cur[nk] >= MAX_N:
            nxt["procentNauka"] = jmin(MAX_N, rem)
            nxt[nonk] = jmax(0.0, rem - nxt["procentNauka"])
            return nxt
    others = cur[k0] + cur[k1]
    if others <= 0:
        half = jround(rem / 2 / STEP) * STEP
        nxt[k0] = half
        nxt[k1] = rem - half
        if k0 == "procentNauka" and nxt["procentNauka"] > MAX_N:
            nxt["procentNauka"] = MAX_N
            nxt[k1] = rem - nxt["procentNauka"]
        elif k1 == "procentNauka" and nxt["procentNauka"] > MAX_N:
            nxt["procentNauka"] = MAX_N
            nxt[k0] = rem - nxt["procentNauka"]
        nxt[k0] = clamp01(nxt[k0])
        nxt[k1] = clamp01(nxt[k1])
        return nxt
    v0 = snap(rem * cur[k0] / others)
    if v0 > rem:
        v0 = jfloor(rem / STEP) * STEP
    if k0 == "procentNauka" and v0 > MAX_N:
        v0 = MAX_N
    nxt[k0] = v0
    nxt[k1] = rem - v0
    nxt[k0] = clamp01(nxt[k0])
    nxt[k1] = clamp01(nxt[k1])
    if k1 == "procentNauka" and nxt["procentNauka"] > MAX_N:
        nxt["procentNauka"] = MAX_N
        nxt[k0] = rem - nxt["procentNauka"]
        nxt[k0] = clamp01(nxt[k0])
    return nxt


for i, row in enumerate(P["adjust"]):
    expect(f"adjust[{i}]", adjust(row["split"], row["key"], N(row["newVal"])), canon(row["out"]))


def fresh_policy(owner, ai):
    pol = {"focus": "zrownowazone", "tryb": "reczny", "onlyWorked": True, "pracaAutoPercent": UPD_DEF, "wolnoWycinacLas": False}
    if owner in ai:
        pol["pracaAutoPercent"] = UPD_AI
    return pol


expect("policy.fresh", fresh_policy(None, []), canon(P["policy"]["fresh"]))
for i, row in enumerate(P["policy"]["forOwner"]):
    expect(f"forOwner[{i}]", fresh_policy(row["ownerId"], row["ai"]), canon(row["out"]))


def cap(pool, pct):
    return jfloor(pool * clamp01(pct) / 100)


for i, row in enumerate(P["policy"]["cap"]):
    expect(f"cap[{i}]", cap(N(row["pool"]), N(row["percent"])), N(row["out"]))
for i, row in enumerate(P["policy"]["capForOwner"]):
    pct = fresh_policy(row["ownerId"], row["ai"])["pracaAutoPercent"]
    expect(f"capForOwner[{i}]", cap(N(row["pool"]), pct), N(row["out"]))


def effective(city, emp):
    if city.get("ulepszeniaOverride") is True:
        return {
            "focus": city.get("ulepszeniaFocus", "zrownowazone"),
            "tryb": city.get("ulepszeniaTryb", "reczny"),
            "onlyWorked": city.get("ulepszeniaOnlyWorked", True),
            "pracaAutoPercent": clamp_upd(typed(city["ulepszeniaPracaPercent"]) if "ulepszeniaPracaPercent" in city else None),
            "wolnoWycinacLas": city.get("ulepszeniaWolnoWycinacLas", False),
            "override": True,
        }
    return {
        "focus": emp["focus"], "tryb": emp["tryb"], "onlyWorked": emp["onlyWorked"],
        "pracaAutoPercent": canon(emp["pracaAutoPercent"]),
        "wolnoWycinacLas": emp.get("wolnoWycinacLas", False), "override": False,
    }


for i, row in enumerate(P["effective"]):
    expect(f"effective[{i}]", effective(row["city"], row["empire"]), canon(row["out"]))

for i, row in enumerate(P["budowa"]["isTyp"]):
    expect(f"isTyp[{i}]", row["f"] != "zrownowazone", row["out"])


def sanitize_prio(lst):
    f = [x for x in (lst or []) if x != "zrownowazone"]
    return list(BUDOWA_DEF_PRIO) if not f else f


for i, row in enumerate(P["budowa"]["sanitize"]):
    expect(f"sanitizePrio[{i}]", sanitize_prio(row["list"]), row["out"])
for i, row in enumerate(P["budowa"]["isAuto"]):
    t = row["t"] or "reczny"
    expect(f"isAuto[{i}]", t in ("priorytet", "lista", "zrownowazone"), row["out"])

# ===========================================================================
# biblioteka list budowy
# ===========================================================================
L = load("lists.json")
seq = 0


def new_id(now):
    global seq
    seq += 1
    return f"budowa-lista-{jstr(N(now))}-{seq}"


def valid_item(x):
    return isinstance(x, dict) and isinstance(x.get("id"), str) and isinstance(x.get("nazwa"), str) and isinstance(x.get("budynki"), list)


def valid_array(raw):
    return isinstance(raw, list) and all(valid_item(x) for x in raw)


def load_lib(meta, nows):
    it = iter(nows)
    m = meta if isinstance(meta, dict) else {}
    raw_new = m.get("budowaListaBiblioteka")
    if valid_array(raw_new):
        return [{"id": s["id"], "nazwa": s["nazwa"], "budynki": list(s["budynki"])} for s in raw_new]
    raw_leg = m.get("budowaListaSzablony")
    if isinstance(raw_leg, dict) and any(k in raw_leg for k in "ABC"):
        out = []
        for slot in "ABC":
            b = raw_leg.get(slot)
            if isinstance(b, list) and len(b) > 0:
                out.append({"id": new_id(next(it)), "nazwa": f"Lista {slot}", "budynki": list(b)})
        return out
    if valid_array(raw_leg):
        return [{"id": s["id"], "nazwa": s["nazwa"], "budynki": list(s["budynki"])} for s in raw_leg]
    return []


for i, row in enumerate(L["sequence"]):
    if row["kind"] == "load":
        expect(f"load[{i}]", canon(load_lib(row["meta"], row["nows"])), canon(row["out"]))
    else:
        expect(f"newId[{i}]", new_id(row["nows"][0]), row["out"])


def default_nazwa(bib):
    used = {jtrim(s["nazwa"]).lower() for s in bib}
    for n in range(1, 1000):
        cand = f"Lista {n}"
        if cand.lower() not in used:
            return cand
    return f"Lista {len(bib) + 1}"


for i, row in enumerate(L["defaultNazwa"]):
    if "fullRange" in row:
        bib = [{"nazwa": f"Lista {n}"} for n in range(1, row["fullRange"] + 1)] + [{"nazwa": x} for x in row.get("extra", [])]
    else:
        bib = row["bib"]
    expect(f"defaultNazwa[{i}]", default_nazwa(bib), row["out"])


def dedupe(arr):
    seen, out = set(), []
    for x in arr:
        if not x or x in seen:
            continue
        seen.add(x)
        out.append(x)
    return out


for i, row in enumerate(L["dedupe"]):
    expect(f"dedupe[{i}]", dedupe(row["arr"]), row["out"])

# ===========================================================================
# empire-city-defaults.ts
# ===========================================================================
E = load("empire.json")
DEFAULT_PRACY = {"procentBudynki": DEF_B}


def norm_p(split):
    return {"procentBudynki": clamp_prac(typed(split["procentBudynki"]))}


def p_equal(a, b):
    return clamp_prac(typed(a["procentBudynki"])) == clamp_prac(typed(b["procentBudynki"]))


def get_def(d, owner):
    return d.get(owner)


expect("empire.fresh.podzial", canon(E["podzial"]["fresh"]), canon(DEFAULT_PRACY))
for i, row in enumerate(E["podzial"]["equal"]):
    expect(f"p.equal[{i}]", p_equal(row["a"], row["b"]), row["out"])
for i, row in enumerate(E["podzial"]["resolve"]):
    c, od, fb = row["city"], row["ownerDefault"], row["fallback"]
    if c.get("podzialPracyOverride") and c.get("podzialPracy"):
        want = norm_p(c["podzialPracy"])
    elif od:
        want = norm_p(od)
    elif c.get("podzialPracy"):
        want = norm_p(c["podzialPracy"])
    else:
        want = norm_p(fb or DEFAULT_PRACY)
    expect(f"p.resolve[{i}]", want, canon(row["out"]))
for i, row in enumerate(E["podzial"]["local"]):
    raw = typed(row["raw"])
    pb = clamp_prac(raw)
    od = row["ownerDefault"]
    gl = clamp_prac(typed(od["procentBudynki"]) if od else DEF_B)
    want = {"podzialPracyOverride": False} if pb == gl else {"podzialPracy": {"procentBudynki": pb}, "podzialPracyOverride": True}
    expect(f"p.local[{i}]", want, canon(row["out"]))


def omap(entries):
    return {k: v for k, v in entries}


def city_in(c):
    return json.loads(json.dumps(c))


def migrate_podzial(cities, defaults, saved):
    if saved:
        for oid, split in saved:
            defaults[oid] = norm_p(split)
    else:
        for c in cities:
            if c["ownerId"] not in defaults:
                defaults[c["ownerId"]] = norm_p(c.get("podzialPracy") or DEFAULT_PRACY)
        for c in cities:
            if "podzialPracyOverride" in c:
                continue
            d = defaults.get(c["ownerId"], DEFAULT_PRACY)
            if not c.get("podzialPracy"):
                c["podzialPracyOverride"] = False
                continue
            c["podzialPracy"] = norm_p(c["podzialPracy"])
            differs = not p_equal(c["podzialPracy"], d)
            c["podzialPracyOverride"] = differs
            if not differs:
                del c["podzialPracy"]
    for c in cities:
        if c.get("podzialPracy"):
            c["podzialPracy"] = norm_p(c["podzialPracy"])
    for c in cities:
        if c["ownerId"] not in defaults:
            defaults[c["ownerId"]] = norm_p(DEFAULT_PRACY)


def run_migration(label, rows, fn, norm_val=lambda v: v):
    for i, row in enumerate(rows):
        cities = [city_in(c) for c in row["cities"]]
        defaults = {}
        order = []
        for k, v in row["ownerDefaults"]:
            defaults[k] = v
        fn(cities, defaults, row["saved"])
        expect(f"{label}[{i}].cities", canon(cities), canon(row["citiesOut"]))
        expect(f"{label}[{i}].defaults", canon([[k, v] for k, v in defaults.items()]), canon(row["ownerDefaultsOut"]))


run_migration("p.migrate", E["podzial"]["migrate"], migrate_podzial)

# okolica
expect("empire.fresh.okolica", E["okolica"]["fresh"], "zywnosc")
for i, row in enumerate(E["okolica"]["resolve"]):
    c, od = row["city"], row["ownerDefault"]
    if c.get("okolicaFocusOverride") and c.get("okolicaFocus"):
        want = c["okolicaFocus"]
    else:
        want = od or c.get("okolicaFocus") or "zywnosc"
    expect(f"o.resolve[{i}]", want, row["out"])
for i, row in enumerate(E["okolica"]["broadcast"]):
    cities = [city_in(c) for c in row["cities"]]
    for c in cities:
        if c["ownerId"] != row["ownerId"] or c.get("okolicaFocusOverride"):
            continue
        c["okolicaFocus"] = row["focus"]
    expect(f"o.broadcast[{i}]", canon(cities), canon(row["out"]))


def migrate_okolica(cities, defaults, saved):
    if saved:
        for oid, f in saved:
            defaults[oid] = f
    else:
        for c in cities:
            if c["ownerId"] not in defaults:
                defaults[c["ownerId"]] = c.get("okolicaFocus") or "zywnosc"
        for c in cities:
            if "okolicaFocusOverride" in c:
                continue
            d = defaults.get(c["ownerId"], "zywnosc")
            differs = bool(c.get("okolicaFocus")) and c["okolicaFocus"] != d
            c["okolicaFocusOverride"] = differs
            if not differs:
                c["okolicaFocus"] = d
    for c in cities:
        if c["ownerId"] not in defaults:
            defaults[c["ownerId"]] = "zywnosc"


run_migration("o.migrate", E["okolica"]["migrate"], migrate_okolica)

# budowa
FRESH_PROFIL = {"budowaFocus": "zrownowazone", "budowaTryb": "reczny"}
expect("empire.fresh.budowa", E["budowa"]["fresh"], FRESH_PROFIL)
expect("empire.aiTryb", E["budowa"]["aiTryb"], "zrownowazone")
for i, row in enumerate(E["budowa"]["equal"]):
    expect(f"b.equal[{i}]", row["a"] == row["b"], row["out"])
for i, row in enumerate(E["budowa"]["resolve"]):
    c, od = row["city"], row["ownerDefault"]
    if c.get("budowaFocusOverride") and c.get("budowaFocus") and c.get("budowaTryb"):
        want = {"budowaFocus": c["budowaFocus"], "budowaTryb": c["budowaTryb"]}
    elif od:
        want = od
    else:
        want = {"budowaFocus": c.get("budowaFocus") or "zrownowazone", "budowaTryb": c.get("budowaTryb") or "reczny"}
    expect(f"b.resolve[{i}]", want, row["out"])


def bcast(cities, owner, profil):
    for c in cities:
        if c["ownerId"] != owner or c.get("budowaFocusOverride"):
            continue
        c["budowaFocus"] = profil["budowaFocus"]
        c["budowaTryb"] = profil["budowaTryb"]


for i, row in enumerate(E["budowa"]["broadcast"]):
    cities = [city_in(c) for c in row["cities"]]
    bcast(cities, row["ownerId"], row["profil"])
    expect(f"b.broadcast[{i}]", canon(cities), canon(row["out"]))


def migrate_budowa(cities, defaults, saved):
    if saved:
        for oid, p in saved:
            defaults[oid] = dict(p)
    else:
        for c in cities:
            if c["ownerId"] not in defaults:
                defaults[c["ownerId"]] = {"budowaFocus": c.get("budowaFocus") or "zrownowazone", "budowaTryb": c.get("budowaTryb") or "reczny"}
        for c in cities:
            if "budowaFocusOverride" in c:
                continue
            d = defaults.get(c["ownerId"], FRESH_PROFIL)
            if not c.get("budowaFocus") or not c.get("budowaTryb"):
                c["budowaFocusOverride"] = False
                continue
            differs = not (c["budowaFocus"] == d["budowaFocus"] and c["budowaTryb"] == d["budowaTryb"])
            c["budowaFocusOverride"] = differs
            if not differs:
                c["budowaFocus"] = d["budowaFocus"]
                c["budowaTryb"] = d["budowaTryb"]
    for c in cities:
        if c["ownerId"] not in defaults:
            defaults[c["ownerId"]] = dict(FRESH_PROFIL)


run_migration("b.migrate", E["budowa"]["migrate"], migrate_budowa)
for i, row in enumerate(E["budowa"]["forOwner"]):
    owner = row["ownerId"]
    want = FRESH_PROFIL if (owner < 0 or owner in row["barb"]) else {"budowaFocus": "zrownowazone", "budowaTryb": "zrownowazone"}
    expect(f"b.forOwner[{i}]", want, row["out"])

for i, row in enumerate(E["budowa"]["upgrade"]):
    cities = [city_in(c) for c in row["cities"]]
    defaults = {k: dict(v) for k, v in row["ownerDefaults"]}
    owners = list(defaults.keys())
    for c in cities:
        if c["ownerId"] not in owners:
            owners.append(c["ownerId"])
    upgraded = []
    for oid in owners:
        if oid < 0 or oid in row["barb"]:
            continue
        if oid == 0:
            continue
        cur = defaults.get(oid)
        if cur and cur["budowaTryb"] != "reczny":
            continue
        nxt = {"budowaFocus": cur["budowaFocus"] if cur else "zrownowazone", "budowaTryb": "zrownowazone"}
        defaults[oid] = nxt
        bcast(cities, oid, nxt)
        upgraded.append(oid)
    expect(f"b.upgrade[{i}].upgraded", upgraded, row["upgraded"])
    expect(f"b.upgrade[{i}].cities", canon(cities), canon(row["citiesOut"]))
    expect(f"b.upgrade[{i}].defaults", canon([[k, v] for k, v in defaults.items()]), canon(row["ownerDefaultsOut"]))

# racje
expect("empire.fresh.racji", canon(E["racji"]["fresh"]), DEF_RACJI)
for i, row in enumerate(E["racji"]["resolve"]):
    c, od = row["city"], row["ownerDefault"]
    if c.get("poziomRacjiOverride") and "poziomRacji" in c:
        want = N(c["poziomRacji"])
    elif od is not None:
        want = N(od)
    elif "poziomRacji" in c:
        want = N(c["poziomRacji"])
    else:
        want = DEF_RACJI
    expect(f"r.resolve[{i}]", want, N(row["out"]))
for i, row in enumerate(E["racji"]["broadcast"]):
    cities = [city_in(c) for c in row["cities"]]
    for c in cities:
        if c["ownerId"] != row["ownerId"] or c.get("poziomRacjiOverride"):
            continue
        c["poziomRacji"] = row["poziom"]
    expect(f"r.broadcast[{i}]", canon(cities), canon(row["out"]))
for i, row in enumerate(E["racji"]["broadcastAuto"]):
    cities = [city_in(c) for c in row["cities"]]
    for c in cities:
        if c["ownerId"] != row["ownerId"] or c.get("poziomRacjiOverride"):
            continue
        c["autoWyzywienie"] = True
    expect(f"r.auto[{i}]", canon(cities), canon(row["out"]))


def migrate_racji(cities, defaults, saved):
    if saved:
        for oid, p in saved:
            defaults[oid] = p
    else:
        for c in cities:
            if c["ownerId"] not in defaults:
                defaults[c["ownerId"]] = c["poziomRacji"] if "poziomRacji" in c else DEF_RACJI
        for c in cities:
            if "poziomRacjiOverride" in c:
                continue
            d = N(defaults.get(c["ownerId"], DEF_RACJI))
            differs = "poziomRacji" in c and N(c["poziomRacji"]) != d
            c["poziomRacjiOverride"] = differs
            if not differs:
                c["poziomRacji"] = d
    for c in cities:
        if c["ownerId"] not in defaults:
            defaults[c["ownerId"]] = DEF_RACJI


run_migration("r.migrate", E["racji"]["migrate"], migrate_racji)

# ===========================================================================
# cities.ts - ensure*, zakladanie
# ===========================================================================
C = load("cities.json")
BUD_PRIO = list(BUDOWA_DEF_PRIO)
WEALTH0 = {"poziom": 1.0, "pula": 0.0}


def ensure_podzial(c):
    if c.get("podzialHandluOverride") and c.get("podzialHandlu"):
        c["podzialHandlu"] = normalize(c["podzialHandlu"])
    elif c.get("podzialHandluOverride") and not c.get("podzialHandlu"):
        c["podzialHandlu"] = dict(DEF_H)
    if not c.get("podzialPracy"):
        c["podzialPracy"] = dict(DEFAULT_PRACY)
    else:
        c["podzialPracy"] = {"procentBudynki": clamp_prac(typed(c["podzialPracy"]["procentBudynki"]))}


def food_equal(a, b):
    return a == b


for i, row in enumerate(C["podzial"]):
    c = city_in(row["city"])
    ensure_podzial(c)
    c.pop("magazynZywnosci", None)
    out = dict(row["out"])
    out.pop("magazynZywnosci", None)
    want_in = {k: v for k, v in c.items() if not (k in ("ulepszeniaPracaPercent", "ulepszeniaPerTurn") and not is_num(v))}
    expect(f"ensurePodzial[{i}]", canon(want_in), canon(out))


def ensure_save(c, food_buf, ration):
    ensure_podzial(c)
    if "wealthState" not in c:
        c["wealthState"] = dict(WEALTH0)
    if "okolicaFocus" not in c:
        c["okolicaFocus"] = "zywnosc"
    if "okolicaTryb" not in c:
        c["okolicaTryb"] = "auto"
    if "budowaFocus" not in c:
        c["budowaFocus"] = "zrownowazone"
    raw = c.get("budowaTryb")
    if raw == "auto":
        c["budowaTryb"] = "priorytet"
        if not c.get("budowaPriorytetTypow"):
            c["budowaPriorytetTypow"] = [c.get("budowaFocus") or "zrownowazone"]
    elif "budowaTryb" not in c:
        c["budowaTryb"] = "reczny"
    prio = c.get("budowaPriorytetTypow") or []
    if c["budowaTryb"] == "priorytet":
        only_z = len(prio) > 0 and all(f == "zrownowazone" for f in prio)
        if only_z:
            c["budowaTryb"] = "zrownowazone"
            c["budowaPriorytetTypow"] = list(BUD_PRIO)
            c["budowaFocus"] = "zrownowazone"
        elif any(f == "zrownowazone" for f in prio):
            c["budowaPriorytetTypow"] = sanitize_prio(prio)
    if c["budowaTryb"] == "zrownowazone":
        if not c.get("budowaPriorytetTypow"):
            c["budowaPriorytetTypow"] = list(BUD_PRIO)
        else:
            c["budowaPriorytetTypow"] = sanitize_prio(c["budowaPriorytetTypow"])
        c["budowaFocus"] = "zrownowazone"
    if c["budowaTryb"] == "priorytet" and not c.get("budowaPriorytetTypow"):
        c["budowaPriorytetTypow"] = sanitize_prio([c.get("budowaFocus") or "zrownowazone"])
    if "budowaLista" not in c:
        c["budowaLista"] = []
    if c.get("ulepszeniaOverride") is True:
        c.setdefault("ulepszeniaFocus", "zrownowazone")
        c.setdefault("ulepszeniaTryb", "reczny")
        c.setdefault("ulepszeniaOnlyWorked", True)
        c.setdefault("ulepszeniaWolnoWycinacLas", False)
        newv = c.get("ulepszeniaPracaPercent")
        leg = c.get("ulepszeniaPerTurn")
        if is_num(newv):
            res = clamp_upd(N(newv))
        elif is_num(leg) and N(leg) in (1.0, 2.0, 3.0):
            res = {1.0: 33.0, 2.0: 66.0, 3.0: 100.0}[N(leg)]
        else:
            res = UPD_DEF
        c["ulepszeniaPracaPercent"] = clamp_upd(res)
    buf = N(food_buf)
    cur = c.get("magazynZywnosci")
    if not (is_num(cur) and N(cur) == buf):
        c["magazynZywnosci"] = buf
    for k, v in ration.items():
        if v is None:
            c.pop(k, None)
        else:
            c[k] = v
    c.setdefault("surowce", {})
    c.setdefault("postepBudynkowUsuniete", {})


for i, row in enumerate(C["save"]):
    c = city_in(row["city"])
    ensure_save(c, row["foodBuf"], row["ration"])
    want_in = {k: v for k, v in c.items() if not (k in ("ulepszeniaPracaPercent", "ulepszeniaPerTurn") and not is_num(v))}
    expect(f"ensureSave[{i}]", canon(want_in), canon(row["out"]))

# zakladanie
MAPS = [{k: t for k, t in m} for m in C["found"]["maps"]]
WATER = ("morze", "plytkie_morze")


def hexd(aq, ar, bq, br):
    dq = abs(aq - bq)
    dr = abs(ar - br)
    ds = abs((-aq - ar) - (-bq - br))
    return jmax(jmax(dq, dr), ds)


def can_found(q, r, cities, hexes, opts):
    key = f"{jstr(q)},{jstr(r)}"
    if key not in hexes:
        return {"ok": False, "reason": "poza mapa"}, []
    t = hexes[key]
    if t in WATER:
        return {"ok": False, "reason": "morze"}, []
    if t == "gory":
        return {"ok": False, "reason": "gory"}, []
    o = opts or {}
    calls = []
    if not o.get("clusterStartSlot"):
        for c in cities:
            md = DIST_CS if (o.get("foundingCityState") or c.get("startCityState")) else MIN_DIST
            if hexd(q, r, N(c["q"]), N(c["r"])) < md:
                return {"ok": False, "reason": "za blisko innego miasta"}, calls
    if o.get("territory") is not None:
        calls.append((q, r))
        if key not in o["territory"]:
            return {"ok": False, "reason": "poza terytorium"}, calls
    if "ownerId" in o and "ownerEra" in o and "gameConfig" in o:
        base = o["gameConfig"].get("cityLimitBase")
        base = 10.0 if base is None else N(base)
        era = jmax(1.0, N(o["ownerEra"]))
        limit = base + (era - 1) * 5
        n = sum(1 for c in cities if c["ownerId"] == o["ownerId"] and c.get("foundedByOwner") is not False)
        if n >= limit:
            return {"ok": False, "reason": "limit miast na tej epoce"}, calls
    return {"ok": True, "reason": ""}, calls


can_found_full = can_found


for i, row in enumerate(C["found"]["can"]):
    got, calls = can_found_full(N(row["q"]), N(row["r"]), row["cities"], MAPS[row["mapIdx"]], row["opts"])
    expect(f"can[{i}]", got, canon(row["out"]))
    expect(f"can[{i}].calls", len(calls), len(row["territoryCalls"]))
    for j, (cq, cr) in enumerate(calls):
        expect(f"can[{i}].calls[{j}]", [cq, cr], canon(row["territoryCalls"][j]))


def new_city(q, r, owner, idx, name, full, cs):
    c = {
        "id": f"city{idx}", "ownerId": owner, "q": q, "r": r, "name": name, "population": 1.0,
        "wealthState": dict(WEALTH0), "wealthImmunityRemaining": 5.0, "podzialHandluOverride": False,
        "podzialPracy": dict(DEFAULT_PRACY), "podzialPracyOverride": False, "okolicaFocusOverride": False,
        "budowaFocusOverride": False, "procentRozwoj": jround(DEF_RACJI / WYZ_MAX * 100), "poziomRacji": DEF_RACJI,
        "poziomRacjiOverride": False, "foundedByOwner": True,
    }
    if full:
        c["autoWyzywienie"] = True
        c["budowaTryb"] = "zrownowazone"
        if cs:
            c["startCityState"] = True
    return c


for i, row in enumerate(C["found"]["foundCity"]):
    s = row["settler"]
    opts = {"territory": row["territory"]} if row["territory"] is not None else None
    res, calls = can_found_full(N(s["q"]), N(s["r"]), row["cities"], MAPS[row["mapIdx"]], opts)
    want = new_city(N(s["q"]), N(s["r"]), s["ownerId"], len(row["cities"]), row["name"], False, False) if res["ok"] else None
    expect(f"foundCity[{i}]", canon(want), canon(row["out"]))
    expect(f"foundCity[{i}].calls", len(calls), row["calls"])
for i, row in enumerate(C["found"]["foundCityAt"]):
    res, _ = can_found_full(N(row["q"]), N(row["r"]), row["cities"], MAPS[row["mapIdx"]], {"foundingCityState": row["foundingCityState"], "clusterStartSlot": row["clusterStartSlot"]})
    want = new_city(N(row["q"]), N(row["r"]), row["ownerId"], len(row["cities"]), row["name"], True, row["foundingCityState"]) if res["ok"] else None
    expect(f"foundCityAt[{i}]", canon(want), canon(row["out"]))


def city_name(idx):
    if idx >= 0 and idx < len(CITY_NAMES):
        return CITY_NAMES[int(idx)] if idx == int(idx) else None
    return "Miasto " + jstr(idx + 1)


for i, row in enumerate(C["found"]["fromVillage"]):
    opts = {"territory": row["territory"]} if row["territory"] is not None else None
    res, calls = can_found_full(N(row["q"]), N(row["r"]), row["cities"], MAPS[row["mapIdx"]], opts)
    if not res["ok"]:
        want = {"ok": False, "reason": res["reason"]}
    else:
        res2, _ = can_found_full(N(row["q"]), N(row["r"]), row["cities"], MAPS[row["mapIdx"]], {"foundingCityState": False, "clusterStartSlot": False})
        if not res2["ok"]:
            want = {"ok": False, "reason": "foundCityAt zwrocil null (niespodziewane)"}
        else:
            want = {"ok": True, "city": new_city(N(row["q"]), N(row["r"]), 0, len(row["cities"]), city_name(float(len(row["cities"]))), True, False)}
    expect(f"fromVillage[{i}]", canon(want), canon(row["out"]))
    expect(f"fromVillage[{i}].calls", len(calls), len(row["territoryCalls"]))
for i, row in enumerate(C["found"]["cityName"]):
    expect(f"cityName[{i}]", city_name(N(row["index"])), row["out"])
for i, row in enumerate(C["found"]["counts"]):
    expect(f"counts[{i}]", row["f"] is not False, row["out"])
for i, row in enumerate(C["found"]["independent"]):
    expect(f"independent[{i}]", row["f"] is True, row["out"])

print(f"sprawdzen={checks} rozbieznosci={diffs}")
sys.exit(0 if diffs == 0 else 1)
