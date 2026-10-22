#!/usr/bin/env python3
"""Niezalezny weryfikator wektorow P6.M02 (R-RUSTPORT-P6-M02-PARAMETRY-NOWEJ-GRY-Q1).

NIE uzywa TypeScript, Node, generatora gen-m02-vectors.mjs ani kodu Rust. Semantyke
generator.ts (rozmiary) / newGameMapDefaults.ts / deposit-era.ts / riverGenSwitch.ts implementuje
od nowa w Pythonie na podstawie TEKSTU zrodel weba (git archive edb8fb56) i danych JSON weba
(map-gen-params.json, e-start-params.json, civs.json), po czym porownuje z wektorami
(tests/p6_m02_vectors/*.json). Float = 16 cyfr hex bitow IEEE-754 (porownanie bitowe).
Dodatkowo sprawdza kotwice tekstowe zrodel (stale, kluczowe linie).

Uzycie:  python3 -I verify-m02-vectors.py <WEB_ROOT> <VECTORS_DIR>
Wyjscie: 0 = 0 rozbieznosci, 1 = co najmniej jedna rozbieznosc, 2 = blad wejscia.
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


def bits(x):
    return struct.pack(">d", float(x)).hex()


def js_round(x):
    return math.floor(x + 0.5)


def clamp(n, lo, hi):
    return max(lo, min(hi, n))


# ---------------------------------------------------------------------------
# kotwice tekstowe zrodel
# ---------------------------------------------------------------------------
ng = rd("gra/src/map/newGameMapDefaults.ts")
gt = rd("gra/src/map/generator.ts")
de = rd("gra/src/map/deposit-era.ts")
rs = rd("gra/src/map/riverGenSwitch.ts")
gh = rd("gra/src/map/gen-helpers.ts")
pl = rd("gra/src/util/norm-pl-label.ts")
for label, text, needle in [
    ("mapSizeFromDims 4800", ng, "if (area < 4800) return 'mala';"),
    ("mapSizeFromDims 12000", ng, "if (area < 12000) return 'srednia';"),
    ("mapSizeFromDims 25200", ng, "if (area < 25200) return 'duza';"),
    ("mapSizeFromDims 100000", ng, "if (area < 100000) return 'ogromna';"),
    ("riverMinPath high 35", ng, "if (tier === 'high') return 35;"),
    ("riverMinPath low 15", ng, "if (tier === 'low') return 15;"),
    ("riverMinPath medium 25", ng, "return 25;"),
    ("gridCell high 5", ng, "if (tier === 'high') return 5;"),
    ("gridCell low 10", ng, "if (tier === 'low') return 10;"),
    ("cap tier", ng, "const cap = tier === 'low' ? 5 : tier === 'high' ? 8 : 6;"),
    ("RIVER_REF_AREA", ng, "export const RIVER_REF_AREA = 168 * 120;"),
    ("tributary", ng, "const tributaryCell = Math.max(3, Math.round(mainCell * 0.5));"),
    ("minLen", ng, "clamp(Math.round(tierMinLen * Math.max(0.65, areaScale)), 6, tierMinLen),"),
    ("minLen dim", ng, "Math.floor(minDim * 0.35),"),
    ("maxLen", ng, "Math.max(minLen * 2, Math.floor(minDim * 0.22), Math.round(minLen * 3)),"),
    ("maxLen cap", ng, "Math.floor(minDim * 0.75),"),
    ("hardMeander", ng, "const hardMeanderLen = clamp(Math.round(8 * areaScale), 3, 8);"),
    ("mouthTail", ng, "const mouthTailLen = clamp(Math.round(5 * areaScale), 3, 5);"),
    ("minInland", ng, "const minInlandFromSea = minDim >= 40 ? 2 : 1;"),
    ("reliefSearchMax", ng, "const reliefSearchMax = clamp(Math.round(14 * areaScale), 6, 28);"),
    ("largeMap", ng, "const largeMap = areaScale >= 1.35;"),
    ("feederPasses large", ng, "? clamp(2 + Math.floor(areaScale * 0.4), 2, 4)"),
    ("feederPasses small", ng, ": clamp(4 + Math.floor(areaScale), 4, 10);"),
    ("topUp small", ng, ": clamp(6 + Math.floor(areaScale * 2), 6, 16);"),
    ("minInlandCell", ng, "const minInlandCell = Math.max(4, Math.floor(minLen * 0.35));"),
    ("sepMult", ng, "feederSourceSepMult: 0.35,"),
    ("expandSourceRadius", ng, "expandSourceRadius: clamp(Math.round(2 * areaScale), 1, 5),"),
    ("legacy limits", ng, "minLen: area > 20000 ? 5 : 4,"),
    ("legacy max", ng, "maxLen: Math.max(40, Math.floor(minDim * 0.22)),"),
    ("legacy margin", ng, "margin: Math.max(2, Math.floor(minDim * 0.025)),"),
    ("forest", ng, "return Math.max(0.32, mapGenForestThreshold(tier) - 0.12);"),
    ("areaBoost", ng, "const areaBoost = Math.max(1, Math.sqrt((w * h) / 5000));"),
    ("maxRivers", ng, "return Math.max(2, Math.round(base * scale * areaBoost));"),
    ("land opts", ng, "[80, 70, 60, 50, 40, 30, 20] as const"),
    ("land clamp", ng, "return Math.max(0.15, Math.min(0.85, opts.landFraction));"),
    ("MAX_MIAST", ng, "export const MAX_MIAST_PANSTWA = 9;"),
    ("MAX_TYPY", ng, "export const MAX_TYPY_CYWILIZACJI_MENU = 15;"),
    ("pool", ng, "kamien: 8,\n  braz: 14,\n  zelazo: 15,"),
    ("typy kamien", ng, "kamien: [3, 4, 5, 6, 7, 8],"),
    ("typy braz", ng, "braz: [4, 5, 6, 9, 11, 13],"),
    ("typy zelazo", ng, "zelazo: [4, 5, 6, 10, 12, 14],"),
    ("miasta t0", ng, "{ min: 2, default: 3, max: 4 },"),
    ("miasta t1", ng, "{ min: 3, default: 4, max: 5 },"),
    ("miasta t2", ng, "{ min: 4, default: 5, max: 7 },"),
    ("miasta t3", ng, "{ min: 5, default: 6, max: 8 },"),
    ("miasta t4", ng, "{ min: 6, default: 7, max: MAX_MIAST_PANSTWA },"),
    ("miasta t5", ng, "{ min: 7, default: 8, max: MAX_MIAST_PANSTWA },"),
    ("normQuality bez z", ng, ".replace(/[ę]/g, 'e')\n    .replace(/[^a-z0-9]/g, '');"),
    ("normPl z", pl, ".replace(/[żź]/g, 'z')"),
    ("land pangea", gh, "case 'pangea': return 0.60;"),
    ("land kontynenty", gh, "case 'kontynenty': return 0.30;"),
    ("land wyspy", gh, "case 'wyspy': return 0.50;"),
    ("land ziemia", gh, "case 'ziemia': return 0.21;"),
    ("wegiel hidden", de, "if (hex.zloze.trim().toLowerCase() === 'wegiel') return false;"),
    ("default era 1", de, "return 1;"),
    ("river default true", rs, "return true;"),
    ("river default phase", rs, "return 'main+medium';"),
    ("rozmiar menu labels", gt, "'Malenki',\n  'Mały',\n  'Standardowy',\n  'Duży',\n  'Ogromny',\n  'Super Huge',"),
]:
    expect(f"kotwica {label}", needle in text, True)

# ---------------------------------------------------------------------------
# dane weba (JSON)
# ---------------------------------------------------------------------------
mg = json.loads(rd("gra/data/map-gen-params.json"))
es = json.loads(rd("gra/data/e-start-params.json"))
civs = json.loads(rd("gra/data/civs.json"))

TIERS = ["low", "medium", "high"]
SIZES = ["malenki", "maly", "standardowy", "duzy", "ogromny", "superogromny"]
MENU_KEYS = ["Malenki", "Mały", "Standardowy", "Duży", "Ogromny", "Super Huge"]


def norm_pl(label):
    s = label.lower()
    s = s.replace("ł", "l").replace("ó", "o").replace("ą", "a").replace("à", "a").replace("ę", "e")
    s = s.replace("ż", "z").replace("ź", "z")
    return re.sub(r"[^a-z0-9]", "", s)


def norm_q(label):
    s = label.lower()
    s = s.replace("ł", "l").replace("ó", "o").replace("ą", "a").replace("à", "a").replace("ę", "e")
    return re.sub(r"[^a-z0-9]", "", s)


def rozmiar_from(label):
    n = norm_pl(label)
    if n.startswith("malen") or n == "malenki":
        return "malenki"
    if n.startswith("mal") or n == "maly" or n == "small":
        return "maly"
    if n.startswith("stand") or n.startswith("sre") or n == "standardowy" or n == "medium":
        return "standardowy"
    if n.startswith("duz") or n == "large":
        return "duzy"
    if n.startswith("super") or n == "superhuge" or n == "kolosalny":
        return "superogromny"
    if n.startswith("ogr") or n == "ogromny" or n == "xlarge":
        return "ogromny"
    return "standardowy"


DIMS = mg["generator"]["rozmiar_dims"]


def dims_of(label):
    d = DIMS[rozmiar_from(label)]
    return d[0], d[1]


def size_label_dims(w, h):
    area = w * h
    if area < 4800:
        return "mala"
    if area < 12000:
        return "srednia"
    if area < 25200:
        return "duza"
    if area < 100000:
        return "ogromna"
    return "super"


def size_label_menu(label):
    return size_label_dims(*dims_of(label))


def skala_row(label):
    n = norm_pl(label)
    for key, row in es["skala_mapy"].items():
        if norm_pl(key) == n:
            return row
    return None


def e_rywale(label):
    r = skala_row(label)
    return None if r is None else r.get("rywale_ai")


def e_miasta(label):
    r = skala_row(label)
    return None if r is None else r.get("miasta_panstwa")


def norm_epoch(e):
    n = e.lower().replace("ł", "l").strip()
    if n in ("braz", "bronz"):
        return "braz"
    if n in ("zelazo", "iron"):
        return "zelazo"
    return "kamien"


def e_per_epoka(label, epoch):
    r = skala_row(label)
    if r is None:
        return None
    t = r.get("typy_cywilizacji_per_epoka", {}).get(norm_epoch(epoch))
    return None if t is None else {"min": t["min"], "default": t["default"], "max": t["max"]}


def e_typy_legacy(label):
    r = skala_row(label)
    if r is None:
        return None
    k = r.get("typy_cywilizacji_per_epoka", {}).get("kamien", {}).get("default")
    if isinstance(k, (int, float)) and k > 0:
        return k
    return r.get("typy_cywilizacji")


POOL = {"kamien": 8, "braz": 14, "zelazo": 15}
TYPY_FALLBACK = {
    "kamien": [3, 4, 5, 6, 7, 8],
    "braz": [4, 5, 6, 9, 11, 13],
    "zelazo": [4, 5, 6, 10, 12, 14],
}
MAX_M = 9
MIASTA_TIER = [
    {"min": 2, "default": 3, "max": 4},
    {"min": 3, "default": 4, "max": 5},
    {"min": 4, "default": 5, "max": 7},
    {"min": 5, "default": 6, "max": 8},
    {"min": 6, "default": 7, "max": MAX_M},
    {"min": 7, "default": 8, "max": MAX_M},
]


def tier_index(label):
    return SIZES.index(rozmiar_from(label))


def triple_from_default(d, pool):
    mx = min(d + 1, pool)
    mn = max(1, d - 1)
    adj = min(max(d, 1), pool)
    if mn >= mx:
        mn = max(1, mx - 1)
    if adj <= mn:
        adj = min(mn + 1, mx)
    if adj >= mx:
        adj = max(mn + 1, mx - 1)
    return {"min": mn, "default": adj, "max": mx}


def civ_triple(label, epoch="kamien"):
    ep = norm_epoch(epoch)
    fe = e_per_epoka(label, ep)
    if fe:
        return fe
    legacy = e_typy_legacy(label)
    if legacy is not None and legacy > 0:
        return triple_from_default(legacy, POOL[ep])
    d = TYPY_FALLBACK[ep][tier_index(label)]
    return triple_from_default(d, POOL[ep])


def aktywne(label, epoch="zelazo"):
    return civ_triple(label, epoch)["max"]


def clamp_miasta(raw, allow_zero=False):
    n = math.floor(raw) if math.isfinite(raw) else raw
    fl = 0 if allow_zero else 1
    if not math.isfinite(n) or n < fl:
        return fl
    return int(min(n, MAX_M))


def miasta_triple(label):
    fe = e_miasta(label)
    if fe is not None and fe > 0:
        cd = clamp_miasta(fe)
        mx = min(cd + 1, MAX_M)
        mn = max(1, cd - 1)
        if mn >= mx:
            mn = max(1, mx - 1)
        return {"min": mn, "default": cd, "max": mx}
    return MIASTA_TIER[tier_index(label)]


def bundle(t, dh, lh, hh):
    opts = [str(t["min"]), str(t["default"]), str(t["max"])]
    descs = [dh if n == str(t["default"]) else (lh if int(n) < t["default"] else hh) for n in opts]
    return {"opts": opts, "descs": descs, "domyslny": max(0, opts.index(str(t["default"])))}


def default_rywale(label):
    fe = e_rywale(label)
    if fe is not None and fe >= 0:
        return fe
    return mg["mapa_skala"]["domyslni_rywale"][size_label_menu(label)]


def rywale_menu(label):
    d = default_rywale(label)
    mt = aktywne(label)
    mx = max(1, min(mt - 1, d + 2))
    mn = max(1, d - 1)
    opts, descs = [], []
    for n in range(mn, mx + 1):
        opts.append(str(n))
        descs.append("Zalecane dla tej mapy" if n == d else ("Mniej starć" if n < d else "Gęstsza mapa"))
    dom = opts.index(str(d)) if str(d) in opts else 0
    return {"opts": opts, "descs": descs, "domyslny": max(0, dom)}


def typ_swiata(label):
    n = norm_pl(label)
    return n if n in ("kontynenty", "pangea", "wyspy", "ziemia") else "kontynenty"


def density_from(label):
    n = norm_q(label)
    if n in ("malo", "low"):
        return "low"
    if n in ("duzo", "high"):
        return "high"
    return "medium"


def is_large(label):
    return norm_q(label) in ("duzy", "ogromny")


G = mg["gestosc"]


def river_min_path(t):
    return 35 if t == "high" else (15 if t == "low" else 25)


def river_cell(t):
    return 5 if t == "high" else (10 if t == "low" else 5)


def river_cap(t):
    return 5 if t == "low" else (8 if t == "high" else 6)


def trace_min_len(c, t="medium"):
    return min(c, river_cap(t))


REF = 168 * 120


def area_scale(w, h):
    return math.sqrt((w * h) / REF)


def river_params(t, w, h):
    a = area_scale(w, h)
    md = min(w, h)
    tml = river_min_path(t)
    cap = river_cap(t)
    main = river_cell(t)
    trib = max(3, js_round(main * 0.5))
    ml = min(clamp(js_round(tml * max(0.65, a)), 6, tml), math.floor(md * 0.35))
    xl = min(max(ml * 2, math.floor(md * 0.22), js_round(ml * 3)), math.floor(md * 0.75))
    gtl = clamp(min(ml, cap), 3, max(3, math.floor(md * 0.12)))
    fml = clamp(max(3, gtl - 1), 3, max(3, math.floor(md * 0.08)))
    hm = clamp(js_round(8 * a), 3, 8)
    mt = clamp(js_round(5 * a), 3, 5)
    mi = 2 if md >= 40 else 1
    rsm = clamp(js_round(14 * a), 6, 28)
    large = a >= 1.35
    if large:
        fp = clamp(2 + math.floor(a * 0.4), 2, 4)
        tp = clamp(2 + math.floor(a * 0.4), 2, 4)
    else:
        fp = clamp(4 + math.floor(a), 4, 10)
        tp = clamp(6 + math.floor(a * 2), 6, 16)
    mic = max(4, math.floor(ml * 0.35))
    return a, {
        "minDim": md, "mainCell": main, "tributaryCell": trib, "mainGridStride": 1, "minLen": ml,
        "maxLen": xl, "gridTraceMinLen": gtl, "feederMinLen": fml, "hardMeanderLen": hm,
        "mouthTailLen": mt, "minInlandFromSea": mi, "reliefSearchMin": 2, "reliefSearchMax": rsm,
        "reliefSourceBonus": 0, "feederPasses": fp, "topUpPasses": tp,
        "expandSourceRadius": clamp(js_round(2 * a), 1, 5), "minInlandCell": mic,
    }


def trace_limits(label):
    w, h = dims_of(label)
    md = min(w, h)
    return {
        "minLen": 5 if w * h > 20000 else 4,
        "maxLen": max(40, math.floor(md * 0.22)),
        "margin": max(2, math.floor(md * 0.025)),
    }


def trace_for_map(label, t):
    w, h = dims_of(label)
    _, p = river_params(t, w, h)
    return {"minLen": p["minLen"], "maxLen": p["maxLen"], "margin": trace_limits(label)["margin"]}


def max_rivers_legacy(label, t):
    base = G["rzeki_max_mala_mapa"][t]
    sc = G["river_scale"][size_label_menu(label)]
    w, h = dims_of(label)
    boost = max(1, math.sqrt((w * h) / 5000))
    return max(2, js_round(base * sc * boost))


# ---------------------------------------------------------------------------
# norm
# ---------------------------------------------------------------------------
for row in load("norm.json"):
    expect(f"normPl {row['label']!r}", norm_pl(row["label"]), row["pl"])
    expect(f"normQuality {row['label']!r}", norm_q(row["label"]), row["quality"])

# ---------------------------------------------------------------------------
# generator
# ---------------------------------------------------------------------------
gj = load("generator.json")
for k in SIZES:
    expect(f"ROZMIAR_DIMS {k}", DIMS[k], gj["rozmiarDims"][k])
    expect(f"rozmiarToDims {k}", {"w": DIMS[k][0], "h": DIMS[k][1]}, gj["rozmiarToDims"][k])
expect("rozmiarKeysOrder", SIZES, gj["rozmiarKeysOrder"])
expect("menuLabels", MENU_KEYS, gj["menuLabels"])
for row in gj["fromMenuLabel"]:
    expect(f"rozmiarFromMenuLabel {row['label']!r}", rozmiar_from(row["label"]), row["rozmiar"])
    w, h = dims_of(row["label"])
    expect(f"menuLabelToDims {row['label']!r}", {"w": w, "h": h}, row["dims"])

# ---------------------------------------------------------------------------
# newGameMapDefaults
# ---------------------------------------------------------------------------
ngj = load("new-game.json")
EPOCHS = ngj["epochs"]
for row in ngj["mapSizeFromDims"]:
    expect(f"mapSizeLabelFromDims {row['w']}x{row['h']}", size_label_dims(row["w"], row["h"]), row["label"])

for row in ngj["perLabel"]:
    l = row["label"]
    expect(f"mapSizeFromMenu {l!r}", size_label_menu(l), row["mapSizeFromMenu"])
    expect(f"defaultRywale {l!r}", default_rywale(l), row["defaultRywale"])
    expect(f"rywaleMenu {l!r}", rywale_menu(l), row["rywaleMenu"])
    expect(f"typSwiata {l!r}", typ_swiata(l), row["typSwiata"])
    expect(f"density {l!r}", density_from(l), row["density"])
    expect(f"isLarge {l!r}", is_large(l), row["isLarge"])
    fe = e_miasta(l)
    md = clamp_miasta(fe) if fe is not None and fe > 0 else miasta_triple(l)["default"]
    expect(f"miastaDefault {l!r}", md, row["miastaDefault"])
    expect(
        f"miastaMenu {l!r}",
        bundle(miasta_triple(l), "Zalecane dla tej mapy (np. Sparta, Kapua) — min 3 hex", "Mniej miast w klastrze", "Więcej miast w klastrze"),
        row["miastaMenu"],
    )
    for i, t in enumerate(TIERS):
        expect(f"maxRiversLegacy {l!r} {t}", max_rivers_legacy(l, t), row["maxRiversLegacy"][i])
        expect(f"riverTraceForMap {l!r} {t}", trace_for_map(l, t), row["riverTraceForMap"][i])
    expect(f"riverTraceLimits {l!r}", trace_limits(l), row["riverTraceLimits"])
    expect(f"aktywneDefault {l!r}", aktywne(l), row["aktywneDefault"])
    expect(f"civTripleDefault {l!r}", civ_triple(l), row["civTripleDefault"])
    civ_hint = ("Zalecane dla tej mapy (obce klastry ≥5 hex od stolicy)", "Mniej frakcji na mapie", "Więcej frakcji na mapie")
    expect(f"civMenuDefault {l!r}", bundle(civ_triple(l), *civ_hint), row["civMenuDefault"])
    expect(f"civDefaultDefault {l!r}", max(1, civ_triple(l)["default"]), row["civDefaultDefault"])
    for i, e in enumerate(EPOCHS):
        expect(f"aktywne {l!r} {e!r}", aktywne(l, e), row["aktywne"][i])
        expect(f"civTriple {l!r} {e!r}", civ_triple(l, e), row["civTriple"][i])
        expect(f"civMenuNoRoster {l!r} {e!r}", bundle(civ_triple(l, e), *civ_hint), row["civMenuNoRoster"][i])
        expect(f"civDefaultNoRoster {l!r} {e!r}", max(1, civ_triple(l, e)["default"]), row["civDefaultNoRoster"][i])

# rostery
ENTRY = ["kamien", "braz", "zelazo"]


def game_idx(e):
    return ENTRY.index(e) if e in ENTRY else len(ENTRY)


def entry_epoch(c):
    d = c.get("epokaWejscia")
    if d and d in ENTRY:
        return d
    leg = c.get("epokiStartowe")
    if leg and len(leg) > 0:
        idx = [game_idx(e) for e in leg if game_idx(e) < len(ENTRY)]
        if idx:
            return ENTRY[min(idx)]
    return "kamien"


def available(roster, epoch):
    return [c["ikonaId"] for c in roster if c.get("ikonaId") and game_idx(entry_epoch(c)) <= game_idx(epoch)]


def clamp_to_epoch(t, epoch, roster):
    if not epoch or not roster:
        return t
    em = len(available(roster, epoch))
    if em <= 0:
        return t
    mx = min(t["max"], em)
    d = min(t["default"], mx)
    mn = min(t["min"], mx)
    if mn > mx:
        mn = max(1, mx - 1)
    if d < mn:
        d = mx
    if d > mx:
        d = mx
    return {"min": mn, "default": d, "max": mx}


for case in ngj["rosterCases"]:
    roster = ngj["rosters"][case["roster"]]
    l = case["label"]
    e = case["epoch"] if case["epoch"] is not None else "kamien"
    t = clamp_to_epoch(civ_triple(l, e), e, roster)
    ctx = f"{case['roster']} {l!r} {case['epoch']!r}"
    expect(f"rosterMenu {ctx}", bundle(t, *civ_hint), case["menu"])
    d = civ_triple(l, e)["default"]
    if roster:
        d = min(d, len(available(roster, e)))
    expect(f"rosterDef {ctx}", max(1, d), case["def"])
    if case["epoch"] is not None:
        expect(f"maxCiv {ctx}", len(available(roster, e)), case["maxCiv"])

expect("maxMiast", MAX_M, ngj["maxMiast"])
expect("maxTypyMenu", 15, ngj["maxTypyMenu"])
expect("epochPool", POOL, ngj["epochPool"])
expect("defaultPlayerCivId", es["defaulty"]["player_civ_id"], ngj["defaultPlayerCivId"])
expect("defaultStartEpochId", es["defaulty"]["start_epoch_id"], ngj["defaultStartEpochId"])
expect("landFractionPercentOpts", [80, 70, 60, 50, 40, 30, 20], ngj["landFractionPercentOpts"])
expect("riverRefArea", REF, ngj["riverRefArea"])
expect("baselineRarity", bits(G["baseline_rarity_mult"]), ngj["baselineRarity"])
expect("defaultWorldDensity", {k: "medium" for k in ("resources", "rivers", "desert", "forest", "relief")}, ngj["defaultWorldDensity"])
expect("densityToLabel", ["Mało", "Normalnie", "Dużo"], ngj["densityToLabel"])

# clampMiasta
JSRAW = {'js:"5"': 5.0, 'js:""': 0.0, 'js:"abc"': float("nan"), "js:null": 0.0, "js:undefined": float("nan"), "js:true": 1.0}
for row in ngj["clampMiasta"]:
    raw = row["raw"]
    if isinstance(raw, str):
        v = JSRAW.get(raw)
        if v is None:
            v = {"NaN": float("nan"), "Infinity": float("inf"), "-Infinity": float("-inf")}[raw]
    else:
        v = float(raw)
    expect(f"clampMiasta {raw!r} {row['allowZero']!r}", clamp_miasta(v, bool(row["allowZero"])), row["result"])

# presety
for row in ngj["presets"]:
    lb = row["labels"]
    rl = lb.get("relief") or lb["rivers"] or "Normalnie"
    want = {
        "resources": density_from(lb["resources"]),
        "rivers": density_from(lb["rivers"]),
        "desert": density_from(lb["desert"]),
        "forest": density_from(lb["forest"]),
        "relief": density_from(rl),
    }
    expect(f"preset {lb}", want, row["result"])

# tier fns
for row in ngj["tierFns"]:
    t = row["tier"]
    expect(f"multiplier {t}", bits(G["surowce_mult"][t]), row["multiplier"])
    expect(f"maxRiversBase {t}", G["rzeki_max_mala_mapa"][t], row["maxRiversBase"])
    expect(f"minPath {t}", river_min_path(t), row["minPath"])
    expect(f"gridCell {t}", river_cell(t), row["gridCell"])
    expect(f"desert {t}", bits(G["desert_noise_threshold"][t]), row["desert"])
    expect(f"forest {t}", bits(max(0.32, G["forest_noise_threshold"][t] - 0.12)), row["forest"])
    expect(f"mountain {t}", bits(G["mountain_noise_threshold"][t]), row["mountain"])
    expect(f"highland {t}", bits(G["highland_noise_threshold"][t]), row["highland"])
    expect(f"traceMinLen {t}", [trace_min_len(c, t) for c in range(41)], row["traceMinLen"])
    if row["traceMinLenDefaultTier"] is not None:
        expect("traceMinLen default", [trace_min_len(c) for c in range(41)], row["traceMinLenDefaultTier"])
    expect(f"scaleMaxRivers {t}", [0, 5, 77], row["scaleMaxRivers"])

# river params
for row in ngj["riverParams"]:
    a, ints = river_params(row["tier"], row["w"], row["h"])
    ctx = f"{row['tier']} {row['w']}x{row['h']}"
    expect(f"areaScale {ctx}", bits(a), row["areaScale"])
    expect(f"areaScaleFn {ctx}", bits(a), row["areaScaleFn"])
    expect(f"feederSourceSepMult {ctx}", bits(0.35), row["feederSourceSepMult"])
    expect(f"minDim {ctx}", ints["minDim"], row["minDim"])
    expect(f"riverInts {ctx}", ints, row["ints"])

# land fraction
LAND = {"pangea": 0.60, "kontynenty": 0.30, "wyspy": 0.50, "ziemia": 0.21}
OPTS = [80, 70, 60, 50, 40, 30, 20]


def default_percent(typ):
    pct = js_round(LAND[typ] * 100)
    if pct in OPTS:
        return pct
    best = OPTS[0]
    for v in OPTS:
        if abs(v - pct) < abs(best - pct):
            best = v
    return best


for row in ngj["landFraction"]:
    t = row["typ"]
    expect(f"defaultPercent {t}", default_percent(t), row["defaultPercent"])
    expect(f"noOpts {t}", bits(LAND[t]), row["noOpts"])
    expect(f"emptyOpts {t}", bits(LAND[t]), row["emptyOpts"])
for row in ngj["landFractionOpts"]:
    lf = row["landFraction"]
    if lf is None:
        want = LAND[row["typ"]]
    else:
        v = {"NaN": float("nan"), "Infinity": float("inf"), "-Infinity": float("-inf")}[lf] if isinstance(lf, str) else float(lf)
        want = max(0.15, min(0.85, v)) if math.isfinite(v) else LAND[row["typ"]]
    expect(f"landFractionOpts {row['typ']} {lf!r}", bits(want), row["result"])

# resolveWorldGenNumbers
for row in ngj["worldGenNumbers"]:
    o = row["opts"]
    wd = (o or {}).get("worldDensity") or {k: "medium" for k in ("resources", "rivers", "desert", "forest", "relief")}
    label = (o or {}).get("mapSizeMenuLabel") or "Standardowy"
    rel = wd.get("relief") or wd["rivers"] or "medium"
    base = G["baseline_rarity_mult"] if (o or {}).get("worldDensity") else 1
    ctx = f"opts={o}"
    expect(f"wg resourceMult {ctx}", bits(G["surowce_mult"][wd["resources"]]), row["resourceMult"])
    expect(f"wg resourceBaseline {ctx}", bits(base), row["resourceBaseline"])
    expect(f"wg maxRivers {ctx}", max_rivers_legacy(label, wd["rivers"]), row["maxRivers"])
    expect(f"wg desert {ctx}", bits(G["desert_noise_threshold"][wd["desert"]]), row["desertThreshold"])
    expect(f"wg forest {ctx}", bits(max(0.32, G["forest_noise_threshold"][wd["forest"]] - 0.12)), row["forestThreshold"])
    expect(f"wg mountain {ctx}", bits(G["mountain_noise_threshold"][rel]), row["mountainThreshold"])
    expect(f"wg highland {ctx}", bits(G["highland_noise_threshold"][rel]), row["highlandThreshold"])
    expect(f"wg riverTrace {ctx}", trace_for_map(label, wd["rivers"]), row["riverTrace"])

# ---------------------------------------------------------------------------
# deposit-era
# ---------------------------------------------------------------------------
dj = load("deposit-era.json")
METAL = {"miedz": 2, "zelazo": 3, "wegiel": 8, "cyna": 2}
METAL.update(mg["metal_deposit_min_era"])
expect("metalEra", METAL, dj["metalEra"])


def min_era_for(hex_):
    if hex_.get("zlozeMinEra") is not None:
        return hex_["zlozeMinEra"]
    z = (hex_.get("zloze") or "").strip().lower()
    if z and z in METAL:
        return METAL[z]
    return 1


def visible(hex_, era):
    if not hex_.get("zloze"):
        return True
    if hex_["zloze"].strip().lower() == "wegiel":
        return False
    return era >= min_era_for(hex_)


for case in dj["hexCases"]:
    h = case["hex"]
    expect(f"minEraFor {h}", min_era_for(h), case["minEraFor"])
    for v in case["vis"]:
        expect(f"visible {h} {v['era']}", visible(h, v["era"]), v["visible"])
        want = h["zloze"] if h.get("zloze") and visible(h, v["era"]) else None
        expect(f"visibleZloze {h} {v['era']}", want, v["visibleZloze"])


def ensure(m):
    out = {}
    for k, h in m.items():
        h2 = dict(h)
        if h2.get("zloze"):
            z = h2["zloze"].strip().lower()
            if z in METAL and h2.get("zlozeMinEra") is None:
                h2["zlozeMinEra"] = METAL[z]
        out[k] = h2
    return out


expect("ensureDepositEraMeta", ensure(dj["ensure"]["before"]), dj["ensure"]["after"])
for row in dj["hidden"]:
    for key, m in (("onBefore", dj["ensure"]["before"]), ("onAfter", dj["ensure"]["after"])):
        n = sum(1 for h in m.values() if h.get("zloze") and not visible(h, row["era"]))
        expect(f"hidden {key} {row['era']}", n, row[key])

# ---------------------------------------------------------------------------
# riverGenSwitch
# ---------------------------------------------------------------------------
rj = load("river-switch.json")
expect("storage keys", ["civ-river-gen", "civ-river-gen-phase"], rj["keys"])


def parse01(raw):
    if raw in ("0", "false"):
        return False
    if raw in ("1", "true"):
        return True
    return None


def parse_phase(raw):
    return raw if raw in ("main", "main+medium", "all") else None


def get_enabled(eo, url, store):
    if eo is not None:
        return eo
    v = parse01(url)
    if v is not None:
        return v
    v = parse01(store)
    if v is not None:
        return v
    return True


def get_phase(po, url, store):
    if po is not None:
        return po
    v = parse_phase(url)
    if v is not None:
        return v
    v = parse_phase(store)
    if v is not None:
        return v
    return "main+medium"


for c in rj["cases"]:
    ph = get_phase(c["phaseOverride"], c["url"], c["store"])
    ctx = f"{c['enabledOverride']} {c['phaseOverride']} {c['url']!r} {c['store']!r}"
    expect(f"enabled {ctx}", get_enabled(c["enabledOverride"], c["url"], c["store"]), c["enabled"])
    expect(f"phase {ctx}", ph, c["phase"])
    expect(f"mainOnly {ctx}", ph == "main", c["mainOnly"])
    expect(f"full {ctx}", ph == "all", c["full"])
n = rj["noEnv"]
expect("noEnv", {"enabled": True, "phase": "main+medium", "mainOnly": False, "full": False}, n)

print(f"RAZEM: {checks} sprawdzen, rozbieznosci: {diffs}")
sys.exit(1 if diffs else 0)
