#!/usr/bin/env python3
"""NIEZALEZNY weryfikator P6.23 (P6.2 + P6.3).

Przelicza w Pythonie (osobna implementacja, czytana ze zrodel TS weba, BEZ udzialu Rust)
kazdy przypadek wektorow `rust-port/engine/tests/p6_23_vectors/*.json` i porownuje z wynikiem
URUCHOMIONEGO weba zapisanym w wektorze. Dodatkowo sprawdza, ze tabele Rust
(`data/derived/{porzadek-params,ulepszenia-reguly,teren-ruch-reguly}.json`) zgadzaja sie ze
stalymi odczytanymi REGEXEM wprost z tekstu zrodel TS pinu.

Uzycie: verify-p623-vectors.py <WEB_ROOT> <ENGINE_DIR>
Wyjscie: liczba przypadkow i liczba rozbieznosci (0 = zgodnosc), kod wyjscia 0/1.
"""
import json
import math
import re
import sys
from fractions import Fraction
from pathlib import Path

WEB = Path(sys.argv[1])
ENGINE = Path(sys.argv[2])
VEC = ENGINE / "tests" / "p6_23_vectors"
GAME = WEB / "gra" / "src" / "game"

mismatches = []
checked = {}


def dec(v):
    """Dekoduje liczbe wektora ({"$n": ...} -> float)."""
    if isinstance(v, dict) and "$n" in v:
        return {"NaN": math.nan, "Infinity": math.inf, "-Infinity": -math.inf, "-0": -0.0}[v["$n"]]
    return v


def eq(a, b):
    a, b = dec(a), dec(b)
    if isinstance(a, float) or isinstance(b, float):
        if isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool):
            if math.isnan(a) and math.isnan(b):
                return True
            return a == b
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(eq(a[k], b[k]) for k in a)
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(eq(x, y) for x, y in zip(a, b))
    return a == b


def check(name, got, want, ctx):
    checked[name] = checked.get(name, 0) + 1
    if not eq(got, want):
        mismatches.append((name, ctx, got, want))


def finite(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)


def js_round(x):
    """Math.round: polowki w strone +inf; dokladnie na wartosci zmiennoprzecinkowej (Fraction)."""
    if not math.isfinite(x):
        return x
    return float(math.floor(Fraction(x) + Fraction(1, 2)))


def fpow(base, exp):
    try:
        return math.pow(base, exp)
    except OverflowError:
        return math.inf


# ---------------------------------------------------------------------------
# stale odczytane Z TEKSTU zrodel TS (regex) - do porownania z tabelami Rust
# ---------------------------------------------------------------------------
ORDER_TS = (GAME / "order.ts").read_text(encoding="utf-8")
TI_TS = (GAME / "terrain-improvements.ts").read_text(encoding="utf-8")
RS_TS = (GAME / "r-stawki-strojenie.ts").read_text(encoding="utf-8")
FORT_TS = (GAME / "fort-territory.ts").read_text(encoding="utf-8")
CHM_TS = (GAME / "city-hex-movement.ts").read_text(encoding="utf-8")
TERR_TS = (WEB / "gra" / "src" / "map" / "territory.ts").read_text(encoding="utf-8")

fallback_block = re.search(r"FALLBACK_ORDER_PARAMS[^{]*\{(.*?)\}\);", ORDER_TS, re.S).group(1)
ts_fallback = {m.group(1): float(m.group(2)) for m in re.finditer(r"^\s*(\w+):\s*(-?[\d.]+),", fallback_block, re.M)}
ts_max_hap = float(re.search(r"const MAX_HAP = ([\d.]+);", ORDER_TS).group(1))
ts_fala2 = float(re.search(r"export const R_STAWKI_FALA2_MULT = ([\d.]+);", RS_TS).group(1))
ts_era_block = re.search(r"TERRAIN_IMPROVEMENT_ERA_MULTIPLIERS[^{]*\{(.*?)\};", TI_TS, re.S).group(1)
ts_era_map = {int(m.group(1)): float(m.group(2)) for m in re.finditer(r"(\d+):\s*([\d.]+)", ts_era_block)}
ts_ore = float(re.search(r"export const ORE_YIELD_PER_MINE = ([\d.]+);", TI_TS).group(1))
ts_default_amount = float(re.search(r"export const TERRITORY_YIELD_DEFAULT_AMOUNT = ([\d.]+);", TI_TS).group(1))
ts_forest_penalty = float(re.search(r"export const FOREST_FOOD_POTENTIAL_PENALTY = (-?[\d.]+);", TI_TS).group(1))
ts_farma_default = float(re.search(r"IMPROVEMENTS\.farma\?\.bonus\?\.zywnosc \?\? ([\d.]+);", TI_TS).group(1))
ts_prod_mult = float(re.search(r"Math\.pow\(([\d.]+), normalizedEra - 1\)", TI_TS).group(1))
ts_alias = dict(re.findall(r"^\s*(\w+):\s*'(\w+)',$", re.search(r"LEGACY_KEY_ALIASES[^{]*\{(.*?)\};", TI_TS, re.S).group(1), re.M))
ts_territory_set = re.findall(r"'(\w+)'", re.search(r"TERRITORY_YIELD_IMPROVEMENTS[^\[]*\[(.*?)\]\)", TI_TS, re.S).group(1))
ts_era_scaled = re.findall(r"'(\w+)'", re.search(r"ERA_SCALED_RESOURCE_IMPROVEMENTS[^(]*\(\[(.*?)\]\)", TI_TS, re.S).group(1))
ts_food_keys = re.findall(r"'(\w+)'", re.search(r"const FOOD_IMPROVEMENT_KEYS = new Set\(\[(.*?)\]\)", TI_TS, re.S).group(1))
ts_road_keys = re.findall(r"'(\w+)'", re.search(r"ROAD_IMPROVEMENT_KEYS = new Set\(\[(.*?)\]\)", TI_TS, re.S).group(1))
ts_livestock = re.findall(r"'(\w+)'", re.search(r"LIVESTOCK_SUROWIEC_KEYS = new Set\(\[(.*?)\]\)", TI_TS, re.S).group(1))
ts_defensive = re.findall(r"id === '(\w+)'", re.search(r"return !cityBuiltIds\.some\((.*?)\);", CHM_TS, re.S).group(1))
ts_max_ring = int(re.search(r"maxRing = (\d+),", FORT_TS).group(1))

porzadek_tab = {r["id"]: r["wartosc"] for r in json.loads((ENGINE / "data/derived/porzadek-params.json").read_text(encoding="utf-8"))["wiersze"]}
ul = json.loads((ENGINE / "data/derived/ulepszenia-reguly.json").read_text(encoding="utf-8"))
tr = json.loads((ENGINE / "data/derived/teren-ruch-reguly.json").read_text(encoding="utf-8"))

fallback_map = {
    "wagaSzczescie": "waga_szczescie", "wagaPrawo": "waga_prawo", "progT1": "prog_t1", "progT2": "prog_t2",
    "karaProdukcjaT1": "kara_produkcja_t1", "karaPieniadzT1": "kara_pieniadz_t1", "karaNaukaT1": "kara_nauka_t1",
    "karaKulturaT1": "kara_kultura_t1", "karaWzrostT1": "kara_wzrost_t1", "ryzykoBuntuT1": "ryzyko_buntu_t1",
    "bonusProdukcjaT2": "bonus_produkcja_t2", "bonusHandelT2": "bonus_handel_t2", "porPctCap": "por_pct_cap",
}
for ts_key, tab_key in fallback_map.items():
    check("tabela.porzadek-params", porzadek_tab[tab_key], ts_fallback[ts_key], ts_key)
check("tabela.porzadek-params", porzadek_tab["szczescie_skala_max"], ts_max_hap, "MAX_HAP")
check("tabela.ulepszenia-reguly", ul["skala_pracy"]["fala2_mnoznik"], ts_fala2, "R_STAWKI_FALA2_MULT")
check("tabela.ulepszenia-reguly", {int(k): v for k, v in ul["skala_pracy"]["mnozniki_epoki"].items()}, ts_era_map, "era map")
check("tabela.ulepszenia-reguly", ul["ruda"]["na_kopalnie"], ts_ore, "ORE")
check("tabela.ulepszenia-reguly", ul["terytorium"]["domyslna_ilosc"], ts_default_amount, "default amount")
check("tabela.ulepszenia-reguly", ul["zywnosc"]["kara_las"], ts_forest_penalty, "forest penalty")
check("tabela.ulepszenia-reguly", ul["zywnosc"]["farma_bonus_domyslny"], ts_farma_default, "farma default")
check("tabela.ulepszenia-reguly", ul["produkcja_epoka"]["mnoznik_za_epoke"], ts_prod_mult, "prod mult")
check("tabela.ulepszenia-reguly", {a["stary"]: a["nowy"] for a in ul["aliasy_legacy"]["aliasy"]}, ts_alias, "aliasy")
check("tabela.ulepszenia-reguly", [r["ulepszenie"] for r in ul["terytorium"]["ulepszenia"]], ts_territory_set, "territory set")
check("tabela.ulepszenia-reguly", ul["produkcja_epoka"]["ulepszenia_skalowane"], ts_era_scaled, "era scaled")
check("tabela.ulepszenia-reguly", ul["zywnosc"]["ulepszenia"], ts_food_keys, "food keys")
check("tabela.ulepszenia-reguly", ul["drogi"]["ulepszenia"], ts_road_keys, "road keys")
check("tabela.ulepszenia-reguly", ul["hodowla"]["surowce"], ts_livestock, "livestock")
check("tabela.teren-ruch-reguly", tr["miasto_obce"]["budynki_obronne"], ts_defensive, "defensive")
check("tabela.teren-ruch-reguly", tr["fort"]["ewakuacja_maks_pierscien"], ts_max_ring, "max ring")
# zasieg fortu/posterunku: TS ma literaly 10 i 5, Rust czyta terrain-improvements.json
ts_fort_r = int(re.search(r"if \(node\.isFort\)\s+return (\d+);", TERR_TS).group(1))
ts_outpost_r = int(re.search(r"if \(node\.isOutpost\) return (\d+);", TERR_TS).group(1))
ti_json = json.loads((WEB / "gra/data/terrain-improvements.json").read_text(encoding="utf-8"))
check("tabela.zasieg-fortu", ti_json["fort"]["zasieg_terytorium"], ts_fort_r, "fort radius")
check("tabela.zasieg-fortu", ti_json["posterunek"]["zasieg_terytorium"], ts_outpost_r, "outpost radius")
eng_ti = json.loads((ENGINE / "data/terrain-improvements.json").read_text(encoding="utf-8"))
check("dane.terrain-improvements", eng_ti, ti_json, "engine == web")
society = json.loads((WEB / "gra/data/society-params.json").read_text(encoding="utf-8"))
check("dane.society-params", json.loads((ENGINE / "data/society-params.json").read_text(encoding="utf-8")), society, "engine == web")
miasto = json.loads((WEB / "gra/data/miasto-params.json").read_text(encoding="utf-8"))
check("dane.miasto-params", json.loads((ENGINE / "data/miasto-params.json").read_text(encoding="utf-8")), miasto, "engine == web")
CITY_MIN = miasto["zasieg_okolicy_baza"]["wartosc"]
CITY_CAP = miasto["zasieg_okolicy_max"]["wartosc"]

# ===========================================================================
# order.ts
# ===========================================================================
order_v = json.loads((VEC / "order.json").read_text(encoding="utf-8"))
FALLBACK = {k: dec(v) for k, v in order_v["fallback_order_params"].items()}
check("order.FALLBACK_ORDER_PARAMS", FALLBACK, ts_fallback, "vektor == regex TS")


def pick_val(row, diff, fb):
    if row is None or not isinstance(row, dict):
        return fb
    v = row.get(diff)
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) else fb


def load_order_params(soc, diff):
    p = soc.get("porzadek") if isinstance(soc, dict) else None
    p = p if isinstance(p, dict) else {}
    sz = soc.get("szczescie") if isinstance(soc, dict) else None
    sz = sz if isinstance(sz, dict) else {}
    f = FALLBACK
    names = [
        ("wagaSzczescie", "porzadek_waga_szczescie"), ("wagaPrawo", "porzadek_waga_prawo"),
        ("progT1", "porzadek_prog_t1"), ("progT2", "porzadek_prog_t2"),
        ("karaProdukcjaT1", "porzadek_kara_produkcja_t1"), ("karaPieniadzT1", "porzadek_kara_pieniadz_t1"),
        ("karaNaukaT1", "porzadek_kara_nauka_t1"), ("karaKulturaT1", "porzadek_kara_kultura_t1"),
        ("karaWzrostT1", "porzadek_kara_wzrost_t1"), ("ryzykoBuntuT1", "porzadek_ryzyko_buntu_t1"),
        ("bonusProdukcjaT2", "porzadek_bonus_produkcja_t2"), ("bonusHandelT2", "porzadek_bonus_handel_t2"),
    ]
    out = {k: pick_val(p.get(src), diff, f[k]) for k, src in names}
    out["porPctCap"] = pick_val(sz.get("szczescie_pct_cap"), diff, f["porPctCap"])
    return out


for case in order_v["cases"]["loadOrderParams"]:
    name = case["society"]
    soc = society if name == "real" else None if name in ("nullSociety", "undefinedSociety") else order_v["societies"][name]
    diff = case["difficulty"] or "normal"
    check("order.loadOrderParams", load_order_params(soc, diff), {k: dec(v) for k, v in case["out"].items()}, case)

PARAMS = {k: {a: dec(b) for a, b in v.items()} for k, v in order_v["paramSets"].items()}


def params_of(case):
    if "paramsInline" in case:
        return {a: dec(b) for a, b in case["paramsInline"].items()}
    return PARAMS[case["params"]] if case["params"] else FALLBACK


def compute_order(szcz, prawo, p):
    s = szcz if finite(szcz) else 0
    r = prawo if finite(prawo) else 0
    return js_round(p["wagaSzczescie"] * s + p["wagaPrawo"] * r)


def order_tier(o, p):
    if o < p["progT1"]:
        return "unrest"
    if o >= p["progT2"]:
        return "order"
    return "neutral"


def clamp01(x):
    if not finite(x):
        return 0
    return 0 if x < 0 else 1 if x > 1 else x


def order_effects(tier, p):
    if tier == "unrest":
        return {
            "productionMult": max(0, 1 + p["karaProdukcjaT1"]), "pieniadzMult": max(0, 1 + p["karaPieniadzT1"]),
            "naukaMult": max(0, 1 + p["karaNaukaT1"]), "kulturaMult": max(0, 1 + p["karaKulturaT1"]),
            "growthMult": max(0, 1 + p["karaWzrostT1"]), "tradeMult": 1, "revoltRisk": clamp01(p["ryzykoBuntuT1"]),
        }
    if tier == "order":
        return {
            "productionMult": 1 + p["bonusProdukcjaT2"], "pieniadzMult": 1, "naukaMult": 1, "kulturaMult": 1,
            "growthMult": 1, "tradeMult": 1 + p["bonusHandelT2"], "revoltRisk": 0,
        }
    return {"productionMult": 1, "pieniadzMult": 1, "naukaMult": 1, "kulturaMult": 1, "growthMult": 1, "tradeMult": 1, "revoltRisk": 0}


def to_yield_mults(tier, e):
    if tier == "order":
        return {"productionMult": e["productionMult"], "pieniadzMult": e["tradeMult"], "naukaMult": 1, "kulturaMult": 1}
    return {k: e[k] for k in ("productionMult", "pieniadzMult", "naukaMult", "kulturaMult")}


for c in order_v["cases"]["computeOrder"]:
    i = c["inputs"]
    check("order.computeOrder", compute_order(dec(i["szczescie"]), dec(i["prawo"]), params_of(c)), dec(c["out"]), c)
for c in order_v["cases"]["orderTier"]:
    check("order.orderTier", order_tier(dec(c["order"]), params_of(c)), c["out"], c)
for c in order_v["cases"]["orderEffects"]:
    tier = c["tier"] if c["tier"] in ("unrest", "order") else "neutral"
    check("order.orderEffects", order_effects(tier, params_of(c)), {k: dec(v) for k, v in c["out"].items()}, c)
for c in order_v["cases"]["evaluateOrder"]:
    p = params_of(c)
    o = compute_order(dec(c["inputs"]["szczescie"]), dec(c["inputs"]["prawo"]), p)
    t = order_tier(o, p)
    got = {"order": o, "tier": t, "effects": order_effects(t, p)}
    want = {"order": dec(c["out"]["order"]), "tier": c["out"]["tier"], "effects": {k: dec(v) for k, v in c["out"]["effects"].items()}}
    check("order.evaluateOrder", got, want, c)
for c in order_v["cases"]["orderEffectsToYieldMults"]:
    eff = {k: dec(v) for k, v in c["effects"].items()}
    check("order.orderEffectsToYieldMults", to_yield_mults(c["tier"], eff), {k: dec(v) for k, v in c["out"].items()}, c)
for c in order_v["cases"]["pickRevoltMigrationTarget"]:
    orders = {k: dec(v) for k, v in c["orders"]}
    best, best_order = None, -math.inf
    for city in c["cities"]:
        if city["id"] == c["sourceId"] or city["ownerId"] != c["ownerId"] or city["population"] < 1:
            continue
        ov = orders.get(city["id"])
        val = ov if finite(ov) else 0
        if val > best_order:
            best_order, best = val, city["id"]
    check("order.pickRevoltMigrationTarget", best, c["out"], c)
for c in order_v["cases"]["happinessBreakdown"]:
    pop_in, hap_in = dec(c["population"]), dec(c["szczescie"])
    pop = math.floor(pop_in) if finite(pop_in) and pop_in > 0 else 0
    if pop <= 0:
        got = {"zadowoleni": 0, "kontentni": 0, "niezadowoleni": 0}
    else:
        hap = hap_in if finite(hap_in) else 0
        hf = min(1, max(0, hap / 20))
        uf = min(1, max(0, -hap / 20))
        z = math.floor(pop * hf)
        n = math.floor(pop * uf)
        got = {"zadowoleni": z, "kontentni": pop - z - n, "niezadowoleni": n}
    check("order.happinessBreakdown", got, {k: dec(v) for k, v in c["out"].items()}, c)

# ===========================================================================
# terrain-improvements.ts
# ===========================================================================
ti_v = json.loads((VEC / "improvements.json").read_text(encoding="utf-8"))
ROWS = ti_json  # dict z zachowana kolejnoscia
CASES = ti_v["cases"]
ERA_MAP = ts_era_map
KEYS = [k for k in ROWS if not k.startswith("_")]


def row_of(key):
    return ROWS.get(key) if isinstance(key, str) else None


# Wlasne nazwy wlasciwosci Object.prototype wg ECMAScript (w tym Annex B) - lista NIEZALEZNA od Node/Rust.
JS_PROTO_KEYS = {
    "constructor", "__defineGetter__", "__defineSetter__", "hasOwnProperty", "__lookupGetter__",
    "__lookupSetter__", "isPrototypeOf", "propertyIsEnumerable", "toString", "valueOf", "__proto__",
    "toLocaleString",
}


def js_truthy_lookup(name):
    # IMPROVEMENTS[name] w JS: wiersz pliku albo wlasciwosc prototypu obiektu (funkcja/obiekt = prawda)
    return name in ROWS or name in JS_PROTO_KEYS


def normalize(raw):
    if not raw or raw == "brak":
        return None
    key = ts_alias.get(raw, raw)
    if js_truthy_lookup(key):
        return key
    return raw if js_truthy_lookup(raw) else None


def bonus_for(key):
    r = row_of(key)
    return dict(r["bonus"]) if r and isinstance(r.get("bonus"), dict) else {}


def era_mult(era):
    n = math.floor(era) if isinstance(era, (int, float)) and math.isfinite(era) else 1
    if n <= 1:
        return ERA_MAP[1]
    if n in ERA_MAP:
        return ERA_MAP[n]
    return ERA_MAP[3] * fpow(2, n - 3)


def scale_stone(base):
    if not finite(base) or base <= 0:
        return 0
    return max(1, js_round(base * ts_fala2))


def scale_cost(base, era):
    s = scale_stone(base)
    return 0 if s <= 0 else s * era_mult(era)


def prod_amount(key, base, era):
    if key not in ts_era_scaled:
        return base
    e = era if era in (2, 3) and not isinstance(era, bool) else 1
    return js_round(base * fpow(ts_prod_mult, e - 1))


def terr_amount(key):
    r = row_of(key)
    v = r.get("surowiec_ilosc_tura") if r else None
    return v if finite(v) and v > 0 else ts_default_amount


RESOURCE_OF = {
    "tartak": "drewno", "kamieniolom": "kamien", "glinianka": "glina", "kopalnia_miedzi": "ruda",
    "kopalnia_zelaza": "ruda_zelaza", "kopalnia_cyny": "ruda_cyny", "warzelnia_soli": "sol", "stadnina": "kon",
    "kopalnia_zlota": "zloto",
}


def terr_yield(key, era):
    norm = normalize(key)
    if not norm or norm not in ts_territory_set:
        return None
    return {"resourceKey": RESOURCE_OF[norm], "amount": prod_amount(norm, terr_amount(norm), era)}


def keys_for_hex(h):
    ul_ = h.get("ulepszenia")
    if ul_:
        out = []
        for k in ul_:
            n = normalize(str(k))
            if n and n not in out:
                out.append(n)
        return out
    single = normalize(str(h.get("ulepszenie") if h.get("ulepszenie") is not None else "brak"))
    return [single] if single else []


HIDE = {
    "glinianka": (["zloze_gliny"], ["glina"]),
    "kopalnia_miedzi": (["zloze_rudy"], ["miedz", "ruda"]),
    "kopalnia_zelaza": ([], ["zelazo"]),
    "kopalnia_zlota": ([], ["zloto"]),
    "warzelnia_soli": ([], ["sol"]),
    "stadnina": (["zloze_konia"], []),
    "bydlo": (["zloze_bydla"], []),
    "owce": (["zloze_owiec"], []),
    "lama": (["zloze_lamy"], []),
}


def hides(key, hex_):
    k = normalize(key)
    if not k:
        return False
    nak = hex_.get("nakladka")
    z = hex_.get("zloze")
    z = z.strip().lower() if isinstance(z, str) else None
    if k not in HIDE:
        return False
    naks, zs = HIDE[k]
    return nak in naks or (z in zs if z is not None else False)


def lower_trim(z):
    return z.strip().lower() if isinstance(z, str) else None


def migrate(key, hex_):
    if key != "kopalnia":
        return key
    z = lower_trim(hex_.get("zloze")) if hex_ else None
    nak = hex_.get("nakladka") if hex_ else None
    if z == "zelazo":
        return "kopalnia_zelaza"
    if z in ("miedz", "ruda") or nak == "zloze_rudy":
        return "kopalnia_miedzi"
    if z == "wegiel":
        return None
    return "kopalnia_miedzi"


constants = ti_v["constants"]
check("ti.IMPROVEMENT_KEYS", KEYS, constants["IMPROVEMENT_KEYS"], "kolejnosc kluczy")
check("ti.json_keys_in_order", list(ROWS.keys()), ti_v["json_keys_in_order"], "kolejnosc pliku")
check("ti.LIVESTOCK", [k for k in KEYS if (ROWS[k].get("surowiecOdblokowany") in ts_livestock)], constants["LIVESTOCK_IMPROVEMENT_KEYS"], "hodowla")
check("ti.RESOURCE_UPKEEP", [k for k in KEYS if ROWS[k].get("typ") != "wycinka"], constants["RESOURCE_UPKEEP_IMPROVEMENT_KEYS"], "upkeep")
check("ti.ROAD", ts_road_keys, constants["ROAD_IMPROVEMENT_KEYS"], "drogi")
check("ti.FARMA", ROWS["farma"]["bonus"].get("zywnosc", ts_farma_default), constants["FARMA_POTENTIAL_FOOD_BONUS"], "farma")

check("ti.proto_keys_vector_vs_ecma", sorted(ti_v["proto_keys"]), sorted(JS_PROTO_KEYS), "Object.prototype")
check("ti.proto_keys_rust_table", sorted(ul["klucze_prototypu_js"]["klucze"]), sorted(JS_PROTO_KEYS), "tabela Rust")
for c in CASES["normalizeImprovementKey"]:
    check("ti.normalizeImprovementKey", normalize(c.get("key")), c.get("out"), c)
for c in CASES["improvementBonusForKey"]:
    check("ti.improvementBonusForKey", bonus_for(c["key"]), c["out"], c)
for c in CASES["terrainImprovementEraForKey"]:
    n = normalize(c.get("key"))
    era = row_of(n).get("epoka") if n and row_of(n) else None
    got = era if finite(era) else 1
    check("ti.terrainImprovementEraForKey", got, dec(c["out"]), c)
for c in CASES["improvementDisplayName"]:
    r = row_of(c["key"])
    check("ti.improvementDisplayName", (r.get("nazwa") if r and r.get("nazwa") is not None else c["key"]), c["out"], c)
for c in CASES["isLivestockImprovementKey"]:
    n = normalize(c["key"])
    check("ti.isLivestockImprovementKey", bool(n and n in constants["LIVESTOCK_IMPROVEMENT_KEYS"]), c["out"], c)
for c in CASES["improvementAllowedCivs"]:
    r = row_of(c["key"])
    check("ti.improvementAllowedCivs", r.get("cywilizacje") if r else None, c.get("out"), c)
for c in CASES["isImprovementAllowedForCiv"]:
    r = row_of(c["key"])
    allowed = r.get("cywilizacje") if r else None
    civ = (c.get("civ") or "").strip().lower()
    if not allowed:
        got = True
    elif not civ:
        got = False
    else:
        got = any(a.strip().lower() == civ for a in allowed)
    check("ti.isImprovementAllowedForCiv", got, c["out"], c)
for c in CASES["migrateLegacyKopalniaKey"]:
    check("ti.migrateLegacyKopalniaKey", migrate(c["key"], c.get("hex")), c.get("out"), c)
for c in CASES["migrateImprovementLayers"]:
    out = []
    for raw in c["layers"]:
        m = migrate(raw, c.get("hex"))
        if m:
            out.append(m)
    check("ti.migrateImprovementLayers", out, c["out"], c)
for c in CASES["terrainImprovementEraMultiplier"]:
    check("ti.terrainImprovementEraMultiplier", era_mult(dec(c.get("era"))), dec(c["out"]), c)
for c in CASES["scaleTerrainImprovementWorkCost"]:
    era = c.get("era")
    era = None if era in (None, "$omit") else dec(era)
    check("ti.scaleTerrainImprovementWorkCost", scale_cost(dec(c["base"]), era), dec(c["out"]), c)
for c in CASES["resourceProductionAmountForEra"]:
    check("ti.resourceProductionAmountForEra", prod_amount(c["key"], dec(c["base"]), dec(c.get("era"))), dec(c["out"]), c)
for c in CASES["territoryResourceYieldForImprovement"]:
    got = terr_yield(c.get("key"), dec(c.get("era")))
    check("ti.territoryResourceYieldForImprovement", got, c.get("out"), c)
for c in CASES["oreYieldFromImprovements"]:
    ruda = zel = 0
    for raw in c["keys"]:
        k = normalize(raw)
        if k == "kopalnia_miedzi":
            ruda += ts_ore
        elif k == "kopalnia_zelaza":
            zel += ts_ore
    check("ti.oreYieldFromImprovements", {"ruda": ruda, "ruda_zelaza": zel}, c["out"], c)


def apply_bonus(y, key):
    y = dict(y)
    if not key:
        return y
    b = bonus_for(key)
    for src, dst in (("zywnosc", "zywnosc"), ("praca", "praca"), ("handel", "handel"), ("pieniadz", "handel"),
                     ("drewno", "drewno"), ("kamien", "kamien"), ("glina", "glina")):
        if b.get(src):
            y[dst] += b[src]
    return y


for c in CASES["applyImprovementBonus"]:
    check("ti.applyImprovementBonus", apply_bonus(c["yield"], c.get("key")), c["out"], c)
for c in CASES["applyImprovementBonuses"]:
    y = dict(c["yield"])
    for k in c["keys"]:
        y = apply_bonus(y, k)
    check("ti.applyImprovementBonuses", y, c["out"], c)
for c in CASES["foodLayerFromAnimalDeposit"]:
    got = {"zloze_bydla": "bydlo", "zloze_owiec": "owce"}.get(c.get("nakladka"))
    check("ti.foodLayerFromAnimalDeposit", got, c.get("out"), c)
for c in CASES["improvementKeysForHex"]:
    check("ti.improvementKeysForHex", keys_for_hex(c["hex"]), c["out"], c)
for c in CASES["hexHasCoveringTerrainImprovement"]:
    check("ti.hexHasCoveringTerrainImprovement", any(k not in ts_road_keys for k in keys_for_hex(c["hex"])), c["out"], c)
for c in CASES["hexSuppressesDepositOverlay"]:
    keys = list(keys_for_hex(c["hex"]))
    extra = c.get("extra")
    if isinstance(extra, list):
        for raw in extra:
            n = normalize(str(raw))
            if n and n not in keys:
                keys.append(n)
    got = bool(keys) and any(hides(k, c["hex"]) for k in keys)
    check("ti.hexSuppressesDepositOverlay", got, c["out"], c)
for c in CASES["improvementHidesDepositOnHex"]:
    check("ti.improvementHidesDepositOnHex", hides(c["key"], c["hex"]), c["out"], c)
for c in CASES["foodPotentialForHex"]:
    keys = [n for n in (normalize(k) for k in c["keys"]) if n]
    if any(k in ts_food_keys for k in keys):
        got = 0
    elif c["nakladka"] == "las":
        got = ts_forest_penalty
    elif c["teren"] in ("laka", "rownina"):
        got = ROWS["farma"]["bonus"].get("zywnosc", ts_farma_default)
    else:
        got = 0
    check("ti.foodPotentialForHex", got, dec(c["out"]), c)

# ===========================================================================
# city-hex-movement.ts
# ===========================================================================
hm = json.loads((VEC / "hexmove.json").read_text(encoding="utf-8"))["cases"]


def hex_dist(aq, ar, bq, br):
    return max(abs(aq - bq), abs(ar - br), abs((-aq - ar) - (-bq - br)))


for c in hm["cityAtHex"]:
    got = next((x for x in c["cities"] if x["q"] == c["q"] and x["r"] == c["r"]), None)
    check("hex.cityAtHex", got, c.get("out"), c)
for c in hm["canUnitOccupyCityHex"]:
    city = next((x for x in c["cities"] if x["q"] == c["q"] and x["r"] == c["r"]), None)
    check("hex.canUnitOccupyCityHex", True if city is None else city["ownerId"] == c["owner"], c["out"], c)
for c in hm["canAiEnterEmptyEnemyCity"]:
    city = c["city"]
    if city["ownerId"] == c["owner"] or c["civilian"] or hex_dist(c["uq"], c["ur"], city["q"], city["r"]) != 1 \
            or c["hasDefenders"] or city.get("maMur") is True:
        got = False
    else:
        got = not any(b in ts_defensive for b in c["built"])
    check("hex.canAiEnterEmptyEnemyCity", got, c["out"], c)
for c in hm["foreignCityHexKeys"]:
    got = []
    for x in c["cities"]:
        k = f'{x["q"]},{x["r"]}'
        if x["ownerId"] != c["owner"] and k not in got:
            got.append(k)
    check("hex.foreignCityHexKeys", got, c["out"], c)
for c in hm["addForeignCityBlocks"]:
    got = list(dict.fromkeys(c["occupied"]))
    for x in c["cities"]:
        k = f'{x["q"]},{x["r"]}'
        if x["ownerId"] != c["owner"] and k not in got:
            got.append(k)
    check("hex.addForeignCityBlocks", got, c["out"], c)

# ===========================================================================
# fort-territory.ts (+ territory.ts, okolica.ts)
# ===========================================================================
ft = json.loads((VEC / "fort.json").read_text(encoding="utf-8"))["cases"]
FORT_R, OUTPOST_R = ti_json["fort"]["zasieg_terytorium"], ti_json["posterunek"]["zasieg_terytorium"]


def city_range(pop):
    p = math.floor(pop) if finite(pop) else 0
    if p <= 0:
        return 0
    return min(max(CITY_MIN, p), CITY_CAP)


def radius(node):
    if node.get("isFort"):
        return FORT_R
    if node.get("isOutpost"):
        return OUTPOST_R
    return city_range(dec(node["pop"]))


def axial(aq, ar, bq, br):
    return (abs(aq - bq) + abs(ar - br) + abs((-aq - ar) - (-bq - br))) / 2


def fort_node(f):
    return {"q": f["q"], "r": f["r"], "pop": 0, "level": 1, "isFort": f["type"] == "fort", "isOutpost": f["type"] == "posterunek"}


for c in ft["cityRangeForPopulation"]:
    check("fort.cityRangeForPopulation", city_range(dec(c["pop"])), dec(c["out"]), c)
for c in ft["cityTerritoryRadius"]:
    check("fort.cityTerritoryRadius", radius(c["node"]), dec(c["out"]), c)
for c in ft["axialDistance"]:
    check("fort.axialDistance", axial(*c["a"], *c["b"]), dec(c["out"]), c)
for c in ft["fortNodeAsCityNode"]:
    check("fort.fortNodeAsCityNode", fort_node(c["fort"]), c["out"], c)
for c in ft["isHexReservedByRivalFort"]:
    got = False
    for f in c["forts"]:
        if f["ownerId"] == c["builder"] or f.get("contestedUseless"):
            continue
        if axial(c["q"], c["r"], f["q"], f["r"]) <= radius(fort_node(f)):
            got = True
            break
    check("fort.isHexReservedByRivalFort", got, c["out"], c)
for c in ft["foundingNodesForOwner"]:
    own = [f for f in c["forts"] if f["ownerId"] == c["owner"] and not f.get("contestedUseless")]
    check("fort.foundingNodesForOwner", list(c["ownCityNodes"]) + [fort_node(f) for f in own], c["out"], c)
for c in ft["applyFortTakeoverOnCityFounded"]:
    city = c["newCity"]
    forts = [dict(f) for f in c["forts"]]
    rad = city_range(dec(city["population"]))
    events = []
    i = len(forts) - 1
    while i >= 0:
        f = forts[i]
        if f["q"] == city["q"] and f["r"] == city["r"]:
            if f["ownerId"] != city["ownerId"]:
                events.append({"q": f["q"], "r": f["r"], "type": f["type"], "prevOwnerId": f["ownerId"], "newOwnerId": city["ownerId"]})
            del forts[i]
        elif f["ownerId"] != city["ownerId"] and axial(city["q"], city["r"], f["q"], f["r"]) <= rad:
            events.append({"q": f["q"], "r": f["r"], "type": f["type"], "prevOwnerId": f["ownerId"], "newOwnerId": city["ownerId"]})
            f["ownerId"] = city["ownerId"]
            f["contestedUseless"] = False
        i -= 1
    check("fort.applyFortTakeoverOnCityFounded.events", events, c["out_events"], c)
    check("fort.applyFortTakeoverOnCityFounded.forts", forts, c["out_forts"], c)
for c in ft["findEvacuationHexOutsideCity"]:
    node = c["node"]
    rad = radius(node)
    hexes = set(c["hexes"])
    blocked = set(c["blocked"])
    max_ring = ts_max_ring if c["maxRing"] == "$omit" else c["maxRing"]
    prev = set()
    result = None
    for ring in range(1, max_ring + 1):
        within = []
        for dq in range(-ring, ring + 1):
            lo, hi = max(-ring, -dq - ring), min(ring, -dq + ring)
            for dr in range(lo, hi + 1):
                key = f'{c["fortQ"] + dq},{c["fortR"] + dr}'
                if key in hexes:
                    within.append(key)
        cands = []
        for key in within:
            if key in prev:
                continue
            q, r = (int(x) for x in key.split(","))
            if axial(q, r, node["q"], node["r"]) > rad and key not in blocked:
                cands.append((q, r))
        if cands:
            cands.sort()
            result = {"q": cands[0][0], "r": cands[0][1]}
            break
        prev = set(within)
    check("fort.findEvacuationHexOutsideCity", result, c.get("out"), c)

# ---------------------------------------------------------------------------
total = sum(checked.values())
for name in sorted(checked):
    print(f"{name}: {checked[name]}")
print(f"RAZEM przypadkow/porownan: {total}")
print(f"ROZBIEZNOSCI: {len(mismatches)}")
for name, ctx, got, want in mismatches[:20]:
    print(f"  {name}: got={got!r} web={want!r} ctx={json.dumps(ctx)[:300]}")
sys.exit(1 if mismatches else 0)
