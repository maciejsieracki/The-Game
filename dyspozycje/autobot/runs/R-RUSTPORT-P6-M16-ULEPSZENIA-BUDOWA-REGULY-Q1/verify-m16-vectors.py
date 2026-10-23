#!/usr/bin/env python3
"""Niezalezny weryfikator wektorow M16 (Python -I; bez Node/TS/Rust).

Liczy semantyke `gra/src/map/improvement-build.ts` (+ zaleznosci) OD NOWA z TEKSTU zrodel weba
(`git archive edb8fb56`) i `gra/data/*.json`, po czym porownuje z wyjsciem URUCHOMIONEGO weba zapisanym w
`rust-port/engine/tests/p6_m16_vectors/{rules,qualifier,gallery}.json`. Zbiory/tabele (sety kluczy, sektory,
teren) sa WYCIAGANE z tekstu zrodla regexem, nie przepisywane z tabeli JSON Rust; dodatkowo sprawdzana jest
zgodnosc `data/derived/ulepszenia-budowa.json` z tekstem zrodla.

Uzycie: python3 -I verify-m16-vectors.py <WEB_ROOT> <VECTORS_DIR> <ULEPSZENIA_BUDOWA_JSON>
Wynik: `checks=N rozbieznosci=M`; kod wyjscia != 0 gdy M > 0.
"""
import json
import math
import re
import sys

WEB, VEC, TABLE = sys.argv[1], sys.argv[2], sys.argv[3]
SRC = open(f"{WEB}/gra/src/map/improvement-build.ts", encoding="utf8").read()
LIVE = open(f"{WEB}/gra/src/game/livestock-unlock.ts", encoding="utf8").read()
TECH = open(f"{WEB}/gra/src/game/improvement-tech.ts", encoding="utf8").read()
TERR = open(f"{WEB}/gra/src/game/terrain-improvements.ts", encoding="utf8").read()
HEXTS = open(f"{WEB}/gra/src/types/hex.ts", encoding="utf8").read()
IMPR = json.load(open(f"{WEB}/gra/data/terrain-improvements.json", encoding="utf8"))
MIASTO = json.load(open(f"{WEB}/gra/data/miasto-params.json", encoding="utf8"))
RENDER = open(f"{WEB}/gra/src/render/improvements.ts", encoding="utf8").read()

checks = 0
bad = 0


def check(label, got, want):
    global checks, bad
    checks += 1
    if got != want:
        bad += 1
        if bad <= 25:
            print(f"ROZBIEZNOSC {label}: py={got!r} web={want!r}")


def strip_comments(t):
    t = re.sub(r"/\*.*?\*/", "", t, flags=re.S)
    t = re.sub(r"(?m)(?<![:'\"])//[^\n]*", "", t)
    return t


S = strip_comments(SRC)
L = strip_comments(LIVE)
T = strip_comments(TECH)

# ---------------------------------------------------------------------------------------------
# KOTWICE zrodla (zmiana zrodla => weryfikator ma sie wywrocic)
# ---------------------------------------------------------------------------------------------
assert SRC.count("\n") == 1569, "improvement-build.ts: oczekiwano 1569 linii"
assert "export function hasBlockingDepositForFarm(_hex: HexWithZloze): boolean {" in S
assert re.search(r"hasBlockingDepositForFarm\(_hex: HexWithZloze\): boolean \{\s*return false;", S)
assert "export const STADNINA_HORSE_COST = 50;" in L
assert "if (isNewWorldCiv(civType) && era < 3) return false;" in L
assert "?? 20, entry?.epoka" in S
assert "const rad = cityTerritoryRadius(node) + 1;" in S
assert "if (node.isFort)    return 10;" in strip_comments(open(f"{WEB}/gra/src/map/territory.ts", encoding="utf8").read())
assert "export function isStadninaBlockedOnForest(_key: string, _nakladka: Nakladka): boolean {\n  return false;" in S


# ---------------------------------------------------------------------------------------------
# Wyciaganie tabel z tekstu
# ---------------------------------------------------------------------------------------------
def enum_values(name):
    m = re.search(r"export enum %s \{(.*?)\n\}" % name, HEXTS, re.S)
    body = strip_comments(m.group(1))
    return dict(re.findall(r"(\w+)\s*=\s*'([^']*)'", body))


TEREN = enum_values("TerenBazowy")
NAKL = enum_values("Nakladka")
ULEP = enum_values("Ulepszenie")


def set_body(name, text=S):
    m = re.search(r"const %s\s*(?::[^=]*)?=\s*new Set(?:<[^>]*>)?\(\[(.*?)\]\)" % name, text, re.S)
    assert m, name
    return m.group(1)


def terrain_set(name):
    return set(TEREN[x] for x in re.findall(r"TerenBazowy\.(\w+)", set_body(name)))


def string_set(name, text=S):
    return set(re.findall(r"'([^']*)'", set_body(name, text)))


TERENY_LADU = terrain_set("TERENY_LADU")
TARTAK_TERENY = terrain_set("TARTAK_TERENY")
FLAT_FARM = terrain_set("FLAT_FARM")
FLAT_IRR = terrain_set("FLAT_IRR")
FOREST_DEPENDENT = string_set("FOREST_DEPENDENT_IMPROVEMENT_KEYS")
FOREST_COEXIST = string_set("FOREST_COEXIST_IMPROVEMENT_KEYS")
FOREST_BLOCKED = string_set("FOREST_BLOCKED_IMPROVEMENT_KEYS")
FOOD_KEYS = string_set("FOOD_LAYER_KEYS")
SOLO_FOOD = string_set("SOLO_FOOD_KEYS")
EXCLUSIVE = string_set("EXCLUSIVE_SEKTORY")
NAKL_ZWIERZECZE = set(NAKL[x] for x in re.findall(r"Nakladka\.(\w+)", set_body("NAKLADKI_ZWIERZECZE")))
MINE_KEYS = set(re.findall(r"'([^']*)'", re.search(r"MINE_IMPROVEMENT_KEYS[^=]*=\s*new Set<ImprovementKey>\(\[(.*?)\]\)", S, re.S).group(1)))

m = re.search(r"const SEKTOR_OF: Record<string, string> = \{(.*?)\n\};", S, re.S)
SEKTOR_OF = dict(re.findall(r"(\w+):\s*'([^']*)'", m.group(1)))

# TERRAIN_ALLOW
m = re.search(r"const TERRAIN_ALLOW: Partial<Record<ImprovementKey, TerenSet \| null>> = \{(.*?)\n\};", S, re.S)
def split_top_level(body):
    parts, depth, cur = [], 0, ""
    for ch in body:
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append(cur)
            cur = ""
        else:
            cur += ch
    if cur.strip():
        parts.append(cur)
    return parts


TERRAIN_ALLOW = {}
for entry in split_top_level(m.group(1)):
    key, val = entry.split(":", 1)
    key, val = key.strip(), val.strip()
    if val == "null":
        TERRAIN_ALLOW[key] = None
    elif val == "FLAT_FARM":
        TERRAIN_ALLOW[key] = FLAT_FARM
    elif val == "FLAT_IRR":
        TERRAIN_ALLOW[key] = FLAT_IRR
    else:
        TERRAIN_ALLOW[key] = set(TEREN[x] for x in re.findall(r"TerenBazowy\.(\w+)", val))

INCA = string_set("INCA_CIV_TYPES", L)
m = re.search(r"IMPROVEMENT_UNLOCKS_LIVESTOCK: Readonly<Record<string, LivestockKey>> = \{(.*?)\};", L, re.S)
UNLOCKS = dict(re.findall(r"(\w+):\s*'([^']*)'", m.group(1)))
m = re.search(r"TECH_CANONICAL: Record<string, string> = \{(.*?)\};", T, re.S)
TECH_CANON = dict(re.findall(r"'([^']*)':\s*'([^']*)'", m.group(1)))
m = re.search(r"IMPROVEMENT_MULTI_TECH_REQ[^=]*=\s*\{(.*?)\};", T, re.S)
MULTI_TECH = {k: re.findall(r"'([^']*)'", v) for k, v in re.findall(r"(\w+):\s*\[(.*?)\]", m.group(1))}
ERA_MULT = {int(a): int(b) for a, b in re.findall(r"(\d+):\s*(\d+)", re.search(r"TERRAIN_IMPROVEMENT_ERA_MULTIPLIERS[^=]*=\s*\{(.*?)\};", TERR, re.S).group(1))}
FALA2 = int(re.search(r"export const R_STAWKI_FALA2_MULT = (\d+);", open(f"{WEB}/gra/src/game/r-stawki-strojenie.ts", encoding="utf8").read()).group(1))
CITY_RANGE_MIN = MIASTO["zasieg_okolicy_baza"]["wartosc"]
CITY_RANGE_CAP = MIASTO["zasieg_okolicy_max"]["wartosc"]
FORT_R = IMPR["fort"]["zasieg_terytorium"]
OUTPOST_R = IMPR["posterunek"]["zasieg_terytorium"]
IMPROVEMENTS_LIST = re.findall(r"\{ key: '(\w+)', label: '([^']*)', epoka: (\d+) \}", RENDER)
IMP_KEYS_JSON = [k for k in IMPR if not k.startswith("_")]

# ---------------------------------------------------------------------------------------------
# Zgodnosc tabeli Rust (JSON) z tekstem zrodla
# ---------------------------------------------------------------------------------------------
tab = json.load(open(TABLE, encoding="utf8"))
check("tab.teren.ladu", set(tab["teren"]["ladu"]), TERENY_LADU)
check("tab.teren.tartak", set(tab["teren"]["tartak"]), TARTAK_TERENY)
check("tab.teren.farma_plaski", set(tab["teren"]["farma_plaski"]), FLAT_FARM)
check("tab.teren.irygacja", set(tab["teren"]["irygacja"]), FLAT_IRR)
check("tab.las.zaleznosc", set(tab["las"]["zaleznosc"]), FOREST_DEPENDENT)
check("tab.las.wspolistnieje", set(tab["las"]["wspolistnieje"]), FOREST_COEXIST)
check("tab.las.zablokowane", set(tab["las"]["zablokowane"]), FOREST_BLOCKED)
check("tab.zywnosc.warstwy", set(tab["zywnosc"]["warstwy"]), FOOD_KEYS)
check("tab.zywnosc.solo", set(tab["zywnosc"]["solo"]), SOLO_FOOD)
check("tab.sektory.przypisanie", tab["sektory"]["przypisanie"], SEKTOR_OF)
check("tab.sektory.wykluczajace", set(tab["sektory"]["wykluczajace"]), EXCLUSIVE)
check("tab.kopalnie", set(tab["kopalnie"]), MINE_KEYS)
check("tab.nakladki_zwierzece", set(tab["nakladki_zwierzece"]), NAKL_ZWIERZECZE)
check("tab.hodowla.inca", set(tab["hodowla"]["cywilizacje_inkaskie"]), INCA)
check("tab.hodowla.odblokowanie", tab["hodowla"]["odblokowanie"], UNLOCKS)
check("tab.tech.kanoniczne", tab["technologie"]["kanoniczne"], TECH_CANON)
check("tab.tech.wiele", tab["technologie"]["wiele_tech"], MULTI_TECH)
check("tab.hodowla.koszt", tab["hodowla"]["stadnina_koszt_koni"], 50)
ta_py = {k: (None if v is None else set(v)) for k, v in tab["teren_dozwolony"].items()}
check("tab.teren_dozwolony", ta_py, {k: v for k, v in TERRAIN_ALLOW.items()})
check("tab.domyslne.praca", tab["domyslne"]["praca_bez_wpisu"], 20)
# R2 (zarzut 6): tabela `teksty` vs TEKST zrodla (literaly w kodzie weba, nie w wektorach)
tk = tab["teksty"]
check("tab.teksty.etykieta_lasu", ("parts.push('%s');" % tk["etykieta_lasu"]) in S, True)
check("tab.teksty.separator_listy", ("parts.join('%s')" % tk["separator_listy"]) in S, True)
check("tab.teksty.podpowiedz_bydlo", ("if (key === 'bydlo') return '%s';" % tk["podpowiedz_bydlo"]) in S, True)
check("tab.teksty.podpowiedz_las_prefiks", ("return `${name}%s`;" % tk["podpowiedz_las_prefiks"]) in S, True)

# ---------------------------------------------------------------------------------------------
# Semantyka JS
# ---------------------------------------------------------------------------------------------
JS_WS = "\t\n\x0b\x0c\r                  　﻿"


def js_trim(s):
    return s.strip(JS_WS)


def lower_trim(s):
    return js_trim(s.lower())


def js_round(x):
    return math.floor(x + 0.5)


def finite(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)


# --- terrain-improvements.ts -----------------------------------------------------------------
ALIASES = dict(re.findall(r"(\w+):\s*'(\w+)'", re.search(r"LEGACY_KEY_ALIASES[^=]*=\s*\{(.*?)\};", TERR, re.S).group(1)))


def normalize_key(raw):
    if not raw or raw == "brak":
        return None
    key = ALIASES.get(raw, raw)
    if key in IMPR:
        return key
    if raw in IMPR:
        return raw
    return None


def keys_for_hex(hex_):
    ul = hex_.get("ulepszenia")
    if ul:
        out = []
        for k in ul:
            n = normalize_key(str(k))
            if n and n not in out:
                out.append(n)
        return out
    single = normalize_key(str(hex_.get("ulepszenie") if hex_.get("ulepszenie") is not None else "brak"))
    return [single] if single else []


def era_mult(era):
    n = math.floor(era) if finite(era) else 1
    if n <= 1:
        return ERA_MULT[1]
    if n in ERA_MULT:
        return ERA_MULT[n]
    return ERA_MULT[3] * 2 ** (n - 3)


def scale_cost(base, era):
    if not finite(base) or base <= 0:
        return 0
    stone = max(1, js_round(base * FALA2))
    return stone * era_mult(era)


# --- okolica / territory ---------------------------------------------------------------------
def city_range(pop):
    p = math.floor(pop) if finite(pop) else 0
    if p <= 0:
        return 0
    return min(max(CITY_RANGE_MIN, p), CITY_RANGE_CAP)


def terr_radius(node):
    if node.get("isFort"):
        return FORT_R
    if node.get("isOutpost"):
        return OUTPOST_R
    return city_range(node["pop"])


def axial(aq, ar, bq, br):
    return (abs(aq - bq) + abs(ar - br) + abs((-aq - ar) - (-bq - br))) / 2


def in_territory(q, r, nodes):
    return any(axial(q, r, n["q"], n["r"]) <= terr_radius(n) for n in nodes)


def owner_at(q, r, nodes):
    best, bd = None, math.inf
    for n in nodes:
        d = axial(q, r, n["q"], n["r"])
        if d > terr_radius(n):
            continue
        if d < bd:
            bd, best = d, n["ownerId"]
    return best


def is_player_hex(q, r, player_nodes, all_nodes, owner):
    if len(all_nodes) > 0:
        return owner_at(q, r, all_nodes) == owner
    return in_territory(q, r, player_nodes)


def owned_by(q, r, owner, nodes):
    if not nodes:
        return False
    return owner_at(q, r, nodes) == owner


# --- improvement-tech / livestock --------------------------------------------------------------
def meta(key):
    if key.startswith("_"):
        return None
    row = IMPR.get(key)
    if row is None:
        return None
    tech = row.get("tech")
    if tech is None or tech == "-" or tech == "":
        tid = None
    else:
        tid = TECH_CANON.get(tech, tech)
    return {
        "key": key,
        "nazwa": row.get("nazwa", key),
        "kosztPraca": scale_cost(row.get("koszt_praca", 0), row.get("epoka")),
        "techId": tid,
        "typ": row.get("typ", "ulepszenie"),
    }


def tech_unlocked(key, researched):
    m_ = meta(key)
    if m_ is None:
        return False
    multi = MULTI_TECH.get(key)
    if multi:
        req = multi
    elif m_["techId"]:
        req = [m_["techId"]]
    else:
        req = None
    if req is None:
        return True
    return all(t in researched for t in req)


def work_cost(key):
    m_ = meta(key)
    if m_ is not None:
        return m_["kosztPraca"]
    row = IMPR.get(key)
    base = row.get("koszt_praca", 20) if row else 20
    return scale_cost(base, row.get("epoka") if row else None)


def is_inca(civ):
    if not civ:
        return False
    t = lower_trim(civ)
    return t in INCA or "inkow" in t or "astek" in t or "aztek" in t


def livestock_key(key):
    raw = lower_trim(key)
    if raw in ("kon", "konie"):
        return "kon"
    k = normalize_key(key)
    if not k:
        return None
    if k in UNLOCKS:
        return UNLOCKS[k]
    if k in ("bydlo", "owce", "lama", "kon"):
        return k
    return None


def livestock_allowed(civ, key, era):
    lk = livestock_key(key)
    if not lk:
        return True
    if lk == "kon":
        return True
    if lk == "lama":
        return is_inca(civ)
    if is_inca(civ) and era < 3:
        return False
    return True


def livestock_unlocked(key, nakladka, trade, stock):
    norm = normalize_key(key) or key
    if norm == "stadnina":
        return nakladka == NAKL["ZlozeKonia"] or trade or stock >= 50
    return True


# ---------------------------------------------------------------------------------------------
# improvement-build.ts - reguly
# ---------------------------------------------------------------------------------------------
LAS = NAKL["Las"]
BRAK_N = NAKL["Brak"]


def strip_forest_removed(layers):
    return [k for k in layers if k not in FOREST_DEPENDENT]


def is_legacy_farm(key, nakl):
    if nakl != LAS:
        return False
    return normalize_key(key) == "farma"


def strip_legacy(layers, nakl):
    if nakl != LAS:
        return list(layers)
    return [k for k in layers if not is_legacy_farm(k, nakl)]


def plan_legacy(hexes, placed):
    changes, scanned, open_ = [], 0, 0
    for key, hex_ in hexes:
        if hex_ is None:
            continue
        scanned += 1
        fp = placed.get(key) if placed is not None else None
        before = list(fp) if fp is not None else keys_for_hex(hex_)
        if len(before) == 0:
            continue
        if hex_["nakladka"] != LAS:
            if any(normalize_key(k) == "farma" for k in before):
                open_ += 1
            continue
        after = strip_legacy(before, hex_["nakladka"])
        if len(after) == len(before):
            continue
        changes.append({"hexKey": key, "before": before, "after": after, "fromPlaced": fp is not None})
    return {"changes": changes, "removed": len(changes), "scanned": scanned, "farmsOnOpenTerrain": open_}


def remove_legacy(hexes, placed):
    placed = {k: list(v) for k, v in placed.items()}
    rep = plan_legacy(hexes, placed)
    calls = []
    for ch in rep["changes"]:
        if ch["fromPlaced"]:
            if len(ch["after"]) > 0:
                placed[ch["hexKey"]] = ch["after"]
            else:
                placed.pop(ch["hexKey"], None)
        calls.append([ch["hexKey"], ch["after"]])
    return rep, calls, placed


def farm_base(teren, nakl):
    if nakl == LAS:
        return False
    return teren in FLAT_FARM


def owce_base(teren, nakl):
    if teren != TEREN["Wzgorza"]:
        return False
    if nakl == NAKL["ZlozeOwiec"]:
        return True
    return nakl == BRAK_N


def blocked_on_forest(key, nakl):
    if nakl != LAS:
        return False
    if key in FOREST_COEXIST:
        return False
    if key == "wyrab":
        return False
    return key in FOREST_BLOCKED


def display_name(key):
    row = IMPR.get(key)
    if row is not None and row.get("nazwa") is not None:
        return row["nazwa"]
    return key


def forest_hint(key):
    if key == "bydlo":
        return re.search(r"if \(key === 'bydlo'\) return '([^']*)';", S).group(1)
    suffix = re.search(r"return `\$\{name\}([^`]*)`;", S).group(1)
    return display_name(key) + suffix


def replaced_by_build(key, existing):
    removed = []

    def add(k):
        if k != key and k not in removed:
            removed.append(k)

    sekt = SEKTOR_OF.get(key)
    if sekt and sekt in EXCLUSIVE:
        for k in existing:
            if SEKTOR_OF.get(k) == sekt:
                add(k)
    if key in SOLO_FOOD:
        for k in existing:
            if k in FOOD_KEYS:
                add(k)
    elif key in FOOD_KEYS:
        for k in existing:
            if k in SOLO_FOOD:
                add(k)
    return removed


def can_add_food(existing, new_key):
    ex = [k for k in existing if k in FOOD_KEYS]
    if new_key in ex:
        return False
    if new_key in SOLO_FOOD:
        return len(ex) == 0
    if any(k in SOLO_FOOD for k in ex):
        return False
    has_f, has_i, has_b = "farma" in ex, "irygacja" in ex, "bydlo" in ex
    if new_key == "farma":
        if len(ex) == 0:
            return True
        return len(ex) == 1 and (has_i or has_b)
    if new_key == "irygacja":
        if len(ex) == 0:
            return True
        return has_f
    if new_key == "bydlo":
        if len(ex) == 0:
            return True
        return has_f
    return False


def impact(key, teren, nakl, existing):
    if blocked_on_forest(key, nakl):
        return None
    if key == "owce" and not owce_base(teren, nakl):
        return None
    if key == "oboz_lowiecki" and nakl != LAS:
        return None
    if key == "oboz_lowiecki" and "tartak" not in existing:
        return None
    removed = replaced_by_build(key, existing)
    after = [k for k in existing if k not in removed]
    if key in after:
        return None
    sekt = SEKTOR_OF.get(key)
    if key != "droga" and sekt and sekt in EXCLUSIVE and any(SEKTOR_OF.get(k) == sekt for k in after):
        return None
    if key in FOOD_KEYS and not can_add_food(after, key):
        return None
    return {"removedImprovements": removed, "removesForest": False}


def format_impact(imp):
    parts = [display_name(k) for k in imp["removedImprovements"]]
    if imp["removesForest"]:
        parts.append(re.search(r"parts\.push\('(Las)'\);", S).group(1))
    return ", ".join(parts)


def is_tarasy(civ):
    if not civ:
        return False
    t = lower_trim(civ)
    return any(x in t for x in ("inkow", "inka", "incas", "chinc")) or t == "chiny"


def clay(h):
    z = h.get("zloze")
    return h["nakladka"] == NAKL["ZlozeGliny"] or (z is not None and js_trim(z).lower() == "glina")


def reserve(h):
    if h.get("zloze"):
        return True
    return h["nakladka"] not in (BRAK_N, LAS)


def deposit_allows(key, h):
    n, z = h["nakladka"], h.get("zloze")
    if key == "glinianka":
        return clay(h)
    if key == "warzelnia_soli":
        return z == "sol"
    if key == "kopalnia_miedzi":
        return z == "miedz" or n == NAKL["ZlozeRudy"] or z == "ruda"
    if key == "kopalnia_zelaza":
        return z == "zelazo"
    if key == "kopalnia_zlota":
        return z == "zloto"
    if key == "kopalnia_cyny":
        return z == "cyna"
    if key == "bydlo":
        return n == NAKL["ZlozeBydla"]
    if key == "owce":
        return n == NAKL["ZlozeOwiec"]
    if key == "lama":
        return n == NAKL["ZlozeLamy"]
    if key == "stadnina":
        return n == NAKL["ZlozeKonia"]
    if key == "oboz_lowiecki":
        return n == LAS
    return False


def within_radius(cq, cr, rad, hexset):
    r = math.floor(rad) if finite(rad) and rad > 0 else 0
    out = []
    for dq in range(-r, r + 1):
        lo, hi = max(-r, -dq - r), min(r, -dq + r)
        for dr in range(lo, hi + 1):
            k = f"{cq + dq},{cr + dr}"
            if k in hexset:
                out.append(k)
    return out


def visible_panel(key, civ, era):
    if not livestock_key(key):
        return True
    return livestock_allowed(civ, key, 1 if era is None else era)


def has_road(h):
    return any(k in ("droga", "droga_brukowana") for k in keys_for_hex(h))


# ---------------------------------------------------------------------------------------------
# rules.json
# ---------------------------------------------------------------------------------------------
rules = json.load(open(f"{VEC}/rules.json", encoding="utf8"))

for i, c in enumerate(rules["strip_forest_removed"]):
    check(f"strip_forest_removed[{i}]", strip_forest_removed(c["layers"]), c["out"])
for i, c in enumerate(rules["legacy_farm_layer"]):
    check(f"legacy_farm_layer[{i}]", is_legacy_farm(c["key"], c["nakladka"]), c["out"])
for i, c in enumerate(rules["strip_legacy_farm"]):
    check(f"strip_legacy_farm[{i}]", strip_legacy(c["layers"], c["nakladka"]), c["out"])


def to_hexes(c):
    return [(k, v) for k, v in c["hexes"]]


for i, c in enumerate(rules["plan_legacy"]):
    check(f"plan_legacy[{i}]", plan_legacy(to_hexes(c), c["placed"]), c["out"])
for i, c in enumerate(rules["remove_legacy"]):
    rep, calls, placed_after = remove_legacy(to_hexes(c), c["placed"])
    check(f"remove_legacy.rep[{i}]", rep, c["out"])
    check(f"remove_legacy.calls[{i}]", calls, c["calls"])
    check(f"remove_legacy.placed[{i}]", dict(sorted(placed_after.items())), c["placed_after"])
for i, c in enumerate(rules["farm_base_terrain"]):
    check(f"farm_base[{i}]", farm_base(c["teren"], c["nakladka"]), c["out"])
for i, c in enumerate(rules["owce_base_terrain"]):
    check(f"owce_base[{i}]", owce_base(c["teren"], c["nakladka"]), c["out"])
for i, c in enumerate(rules["forest_blocked"]):
    check(f"forest_blocked[{i}]", blocked_on_forest(c["key"], c["nakladka"]), c["out"])
for i, c in enumerate(rules["stadnina_blocked"]):
    check(f"stadnina_blocked[{i}]", False, c["out"])
for i, c in enumerate(rules["forest_hint"]):
    check(f"forest_hint[{i}]", forest_hint(c["key"]), c["out"])
for i, c in enumerate(rules["replaced_by_build"]):
    check(f"replaced[{i}]", replaced_by_build(c["key"], c["existing"]), c["out"])
for i, c in enumerate(rules["impact"]):
    check(f"impact[{i}]", impact(c["key"], c["teren"], c["nakladka"], c["existing"]), c["out"])
for i, c in enumerate(rules["format_impact"]):
    check(f"format_impact[{i}]", format_impact(c["impact"]), c["out"])
for i, c in enumerate(rules["mine_key"]):
    check(f"mine_key[{i}]", c["key"] is not None and c["key"] in MINE_KEYS, c["out"])
check("mine_keys_set", sorted(MINE_KEYS), rules["mine_keys_set"])
check("food_keys_set", sorted(FOOD_KEYS), rules["food_layer_keys_set"])
for i, c in enumerate(rules["tarasy_civ"]):
    check(f"tarasy_civ[{i}]", is_tarasy(c["civ"]), c["out"])
for i, c in enumerate(rules["deposit_hex"]):
    h = {"nakladka": c["hex"]["nakladka"], "zloze": c["hex"]["zloze"]}
    check(f"deposit.blocking[{i}]", False, c["blocking_farm"])
    check(f"deposit.clay[{i}]", clay(h), c["clay"])
    check(f"deposit.reserve[{i}]", reserve(h), c["reserve"])
for i, c in enumerate(rules["deposit_allows"]):
    h = {"nakladka": c["hex"]["nakladka"], "zloze": c["hex"]["zloze"]}
    check(f"deposit_allows[{i}]", deposit_allows(c["key"], h), c["out"])
for i, c in enumerate(rules["animal_deposit"]):
    check(f"animal_deposit[{i}]", c["nakladka"] in NAKL_ZWIERZECZE, c["out"])
for i, c in enumerate(rules["food_layer"]):
    check(f"food_layer[{i}]", can_add_food(c["existing"], c["new_key"]), c["out"])
lv = rules["livestock"]
for i, c in enumerate(lv["inca"]):
    check(f"inca[{i}]", is_inca(c["civ"]), c["inca"])
    check(f"new_world[{i}]", is_inca(c["civ"]), c["new_world"])
for i, c in enumerate(lv["key_from"]):
    check(f"key_from[{i}]", livestock_key(c["key"]), c["out"])
for i, c in enumerate(lv["allowed"]):
    check(f"allowed[{i}]", livestock_allowed(c["civ"], c["key"], c["era"]), c["out"])
for i, c in enumerate(lv["unlocked"]):
    check(f"unlocked[{i}]", livestock_unlocked(c["key"], c["nakladka"], c["trade"], c["stock"]), c["out"])
for i, c in enumerate(lv["visible"]):
    check(f"visible[{i}]", visible_panel(c["key"], c["civ"], c["era"]), c["out"])
for i, c in enumerate(rules["keys_within_radius"]):
    hs = set(f"{q},{r}" for q, r in c["hexes"])
    check(f"within_radius[{i}]", within_radius(c["cq"], c["cr"], c["rad"], hs), c["out"])
for i, c in enumerate(rules["has_road"]):
    check(f"has_road[{i}]", has_road(c["hex"]), c["out"])
for i, c in enumerate(rules["meta"]):
    check(f"meta[{i}]", meta(c["key"]), c["out"])
for i, c in enumerate(rules["tech_unlocked"]):
    check(f"tech_unlocked[{i}]", tech_unlocked(c["key"], set(c["researched"])), c["out"])
for i, c in enumerate(rules["work_cost_scale"]):
    got = [scale_cost(c["base"], e) for e in (None, 1, 2, 3, 4)]
    check(f"work_cost_scale[{i}]", got, c["era"])

# ---------------------------------------------------------------------------------------------
# qualifier.json
# ---------------------------------------------------------------------------------------------
NEIGH = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]


class Qual:
    def __init__(self, st):
        self.st = st
        self.hexes = {f"{h['q']},{h['r']}": h for h in st["hexes"]}
        self.nodes = st["cityNodes"]
        self.era = st["playerEra"] if st["playerEra"] is not None else 1
        self.owner = st["playerOwnerIdNum"] if st["playerOwnerIdNum"] is not None else 0
        self.tn = st["territoryNodes"] or []
        self.placed_keys = set(st["placedKeys"] or [])
        self.road_keys = set(st["roadKeys"] or [])
        self.own_units = set(st["ownUnitHexKeys"] or [])
        self.pending = set(st["pendingUndoKeys"] or [])
        self.clearing = set(st["clearingHexKeys"] or [])
        self.kon = bool(st["tradeRouteKonUnlocked"])
        self.stock = st["horseStockAvailable"] if st["horseStockAvailable"] is not None else 0
        self.civ = st["playerCivArchetype"]
        self.river = set()
        for path in st["riverPaths"]:
            for q, r in path:
                self.river.add(f"{q},{r}")
        self.placed_in = st["placedImprovements"]

    def hex_view(self, h):
        return {"ulepszenie": h["ulepszenie"], "ulepszenia": h["ulepszenia"]}

    def layers(self, hk, h):
        keys = list(dict.fromkeys(keys_for_hex(self.hex_view(h))))
        if self.placed_in is not None:
            ext = self.placed_in.get(hk)
        else:
            kk = keys_for_hex(self.hex_view(h))
            if kk:
                ext = kk
            else:
                single = normalize_key(str(h["ulepszenie"] if h["ulepszenie"] is not None else "brak"))
                ext = [single] if single else None
        if ext:
            lst = [ext] if isinstance(ext, str) else [str(x) for x in ext]
            for k in lst:
                n = lower_trim(k)
                if n and n != "brak" and n not in keys:
                    keys.append(n)
        return keys

    def in_player(self, q, r):
        if len(self.tn) > 0:
            return owned_by(q, r, self.owner, self.tn)
        return is_player_hex(q, r, self.nodes, self.tn, self.owner)

    def road_q(self, q, r):
        for dq, dr in NEIGH:
            nq, nr = q + dq, r + dr
            k = f"{nq},{nr}"
            if k in self.road_keys:
                return True
            nb = self.hexes.get(k)
            if nb and has_road(self.hex_view(nb)):
                return True
            for n in self.nodes:
                if nq == n["q"] and nr == n["r"]:
                    return True
        for n in self.nodes:
            if axial(q, r, n["q"], n["r"]) == 1:
                return True
        return False

    def river_adj(self, q, r):
        h = self.hexes.get(f"{q},{r}")
        if h and h["rzeka"]:
            return True
        if f"{q},{r}" in self.river:
            return True
        return any(f"{q + dq},{r + dr}" in self.river for dq, dr in NEIGH)

    def qualifies(self, key, q, r):
        hk = f"{q},{r}"
        h = self.hexes.get(hk)
        if h is None:
            return False
        teren, nakl, zloze = h["teren"], h["nakladka"], h["zloze"]
        existing = self.layers(hk, h)
        if key == "droga_brukowana":
            if teren not in TERENY_LADU:
                return False
            if not self.in_player(q, r):
                return False
            has_droga = "droga" in existing or h["ulepszenie"] == ULEP["Droga"]
            has_bruk = "droga_brukowana" in existing or h["ulepszenie"] == ULEP["DrogaBrukowana"]
            return has_droga and not has_bruk
        if f"{hk}:{key}" in self.pending:
            return True
        if key != "droga" and key in existing:
            return False
        if key == "droga" and hk in self.placed_keys:
            return False
        ip = lambda: self.in_player(q, r)  # noqa: E731

        def live_ok():
            return livestock_allowed(self.civ, key, self.era) and livestock_unlocked(key, nakl, self.kon, self.stock)

        if key == "farma":
            ok = farm_base(teren, nakl) and ip()
        elif key == "irygacja":
            ok = teren in FLAT_IRR and ip() and self.river_adj(q, r)
        elif key == "bydlo":
            ok = teren in FLAT_FARM and ip() and live_ok()
        elif key == "owce":
            ok = owce_base(teren, nakl) and ip() and live_ok()
        elif key == "lama":
            ok = teren != TEREN["Pustynia"] and teren in (TERRAIN_ALLOW.get("lama") or set()) and ip() and live_ok()
        elif key == "stadnina":
            ok = ip() and teren in (TEREN["Laka"], TEREN["Rownina"]) and live_ok()
        elif key == "droga":
            return teren in TERENY_LADU and ip() and self.road_q(q, r)
        elif key in ("posterunek", "fort"):
            owner = owner_at(q, r, self.tn) if len(self.tn) > 0 else None
            rival = owner is not None and owner != self.owner
            own_t = owner == self.owner or ip()
            ok = teren in TERENY_LADU and not rival and (own_t or hk in self.own_units)
        elif key == "glinianka":
            ok = clay(h) and ip()
        elif key == "kopalnia_zelaza":
            ok = ip() and teren in (TEREN["Wzgorza"], TEREN["Gory"]) and zloze == "zelazo"
        elif key == "wyrab":
            if f"{hk}:wyrab" in self.pending:
                return True
            ok = hk not in self.clearing and nakl == LAS and ip()
        elif key == "tartak":
            ok = ip() and nakl == LAS and teren in TARTAK_TERENY
        elif key == "oboz_lowiecki":
            ok = ip() and nakl == LAS and "tartak" in existing
        elif key == "warzelnia_soli":
            ok = ip() and (teren == TEREN["PlytkieMorze"] or zloze == "sol")
        elif key == "kopalnia_miedzi":
            ok = ip() and teren in (TEREN["Wzgorza"], TEREN["Gory"]) and (zloze == "miedz" or nakl == NAKL["ZlozeRudy"] or zloze == "ruda")
        elif key == "kopalnia_zlota":
            ok = ip() and teren in (TEREN["Wzgorza"], TEREN["Gory"]) and zloze == "zloto"
        elif key == "kopalnia_cyny":
            ok = ip() and teren in (TEREN["Wzgorza"], TEREN["Gory"]) and zloze == "cyna"
        elif key == "tarasy":
            ok = ip() and teren == TEREN["Wzgorza"]
        elif key == "lodzie_rybackie":
            ok = ip() and teren in (TEREN["Morze"], TEREN["PlytkieMorze"])
        else:
            allowed = TERRAIN_ALLOW.get(key)
            ok = teren in TERENY_LADU and ip() and (not allowed or teren in allowed)
        if not ok:
            return False
        return impact(key, teren, nakl, existing) is not None

    def candidates(self):
        seen = []
        for n in self.nodes:
            rad = terr_radius(n) + 1
            for k in within_radius(n["q"], n["r"], rad, set(self.hexes)):
                if k not in seen:
                    seen.append(k)
        for src in (self.st["roadKeys"], self.st["placedKeys"]):
            for k in src or []:
                if k not in seen:
                    seen.append(k)
        for comp in self.st["pendingUndoKeys"] or []:
            idx = comp.rfind(":")
            if idx > 0 and comp[:idx] not in seen:
                seen.append(comp[:idx])
        for k in self.st["ownUnitHexKeys"] or []:
            if k not in seen:
                seen.append(k)
        return seen


qual = json.load(open(f"{VEC}/qualifier.json", encoding="utf8"))
keys = qual["keys"]
for ci, case in enumerate(qual["cases"]):
    Q = Qual(case["state"])
    for key in keys:
        bits = "".join("1" if Q.qualifies(key, q, r) else "0" for q, r in case["queries"])
        check(f"qual[{ci}][{key}]", bits, case["qual"][key])
        if key in case["api"]["qualifying"]:
            cand = []
            for hk in Q.candidates():
                h = Q.hexes.get(hk)
                if h and Q.qualifies(key, h["q"], h["r"]):
                    cand.append([h["q"], h["r"]])
            check(f"qualifying[{ci}][{key}]", cand, case["api"]["qualifying"][key])
        check(f"work_cost[{ci}][{key}]", work_cost(key), case["api"]["work_cost"][key])
    for ri, r in enumerate(case["api"]["requests"]):
        can = Q.qualifies(r["key"], r["q"], r["r"])
        check(f"can_build[{ci}/{ri}]", can, r["can_build"])
        researched = set(case["state"]["researchedTechs"] or [])
        ok = can and tech_unlocked(r["key"], researched)
        check(f"request_present[{ci}/{ri}]", ok, r["req"] is not None)
        if ok and r["req"] is not None:
            mt = meta(r["key"])
            check(f"request_cost[{ci}/{ri}]", mt["kosztPraca"] if mt else work_cost(r["key"]), r["req"]["kosztPraca"])
            check(f"request_action[{ci}/{ri}]", mt["typ"] if mt else "ulepszenie", r["req"]["action"])
    for ai, click in enumerate(case["clicks"]):
        ak = click["active_key"]
        total = 0
        researched = set(case["state"]["researchedTechs"] or [])
        for ri, res in enumerate(click["results"]):
            if res["res"] == "NO_HANDLER":
                check(f"nohandler[{ci}/{ai}/{ri}]", ak is None or ak == "", True)
                continue
            q, r = res["q"], res["r"]
            hk = f"{q},{r}"
            if f"{hk}:{ak}" in Q.pending:
                want = {"key": ak, "q": q, "r": r, "hexKey": hk}
                got_key = True
            else:
                got_key = Q.qualifies(ak, q, r) and tech_unlocked(ak, researched)
            check(f"click_present[{ci}/{ai}/{ri}]", bool(got_key), res["res"] is not None)
            check(f"click_called[{ci}/{ai}/{ri}]", 1 if got_key else 0, res["called"])
            total += 1 if got_key else 0
        if ak:
            check(f"click_total[{ci}/{ai}]", total, click["calls_total"])

# powody blokady lasu
def scan(st, key):
    Qc = Qual(st)
    out = dict(lasIn=0, qual=0, outside=0, enemy=0, wrong=0, clearing=0)
    for h in st["hexes"]:
        if h["nakladka"] != LAS:
            continue
        q, r = h["q"], h["r"]
        hk = f"{q},{r}"
        in_reach = len(Qc.nodes) > 0 and in_territory(q, r, Qc.nodes)
        if not in_reach:
            out["outside"] += 1
            continue
        if not is_player_hex(q, r, Qc.nodes, Qc.tn, Qc.owner):
            out["enemy"] += 1
            continue
        out["lasIn"] += 1
        if key == "tartak" and h["teren"] not in TARTAK_TERENY:
            out["wrong"] += 1
            continue
        if key == "wyrab" and hk in Qc.clearing:
            out["clearing"] += 1
            continue
        out["qual"] += 1
    return out


def reason(st, key):
    if len(st["cityNodes"]) == 0:
        return "NoCity"
    sc = scan(st, key)
    if sc["qual"] > 0:
        return None
    if key == "wyrab" and sc["lasIn"] > 0 and sc["clearing"] >= sc["lasIn"]:
        return "AllBeingCleared"
    if key == "tartak" and sc["wrong"] > 0 and sc["qual"] == 0:
        if sc["wrong"] >= sc["lasIn"]:
            return "TartakWrongTerrainAll"
        return "TartakWrongTerrainSome"
    if sc["enemy"] > 0 and sc["lasIn"] == 0:
        return "EnemyTerritory"
    if sc["outside"] > 0 and sc["lasIn"] == 0:
        return "OutsideReach"
    if sc["lasIn"] == 0:
        return "NoForestInTerritory"
    return "Generic"


for ci, case in enumerate(qual["cases"]):
    for key in ("tartak", "wyrab"):
        check(f"reason[{ci}][{key}]", reason(case["state"], key), case["reasons"][key])

# ---------------------------------------------------------------------------------------------
# gallery.json
# ---------------------------------------------------------------------------------------------
def gal_terrain(key, teren):
    water = teren in (TEREN["Morze"], TEREN["PlytkieMorze"])
    if key in ("farma", "bydlo", "stadnina"):
        return teren in FLAT_FARM
    if key == "irygacja":
        return teren in FLAT_IRR
    if key in ("owce", "tarasy"):
        return teren == TEREN["Wzgorza"]
    if key == "lama":
        if teren in (TEREN["Pustynia"], TEREN["Morze"]):
            return False
        return teren in TERRAIN_ALLOW["lama"]
    if key == "lodzie_rybackie":
        return water
    if key in ("kamieniolom", "kopalnia_miedzi", "kopalnia_zelaza", "kopalnia_zlota", "kopalnia_cyny"):
        return teren in (TEREN["Wzgorza"], TEREN["Gory"])
    if key == "wyrab":
        return teren in (TEREN["Laka"], TEREN["Rownina"], TEREN["Wzgorza"])
    if key == "glinianka":
        return teren in (TEREN["Laka"], TEREN["Rownina"])
    if key == "oboz_lowiecki":
        return not water
    if key == "warzelnia_soli":
        return teren in (TEREN["PlytkieMorze"], TEREN["Rownina"])
    if key in ("droga", "droga_brukowana", "fort"):
        return teren in TERENY_LADU
    if key == "tartak":
        return teren in TARTAK_TERENY
    if key == "posterunek":
        return (not water) and teren in TERENY_LADU
    return False


def gal_combo(keys_, teren):
    ks = [k for k in keys_ if k and k != "brak"]
    if "farma" in ks and "bydlo" in ks and "owce" in ks:
        return False
    if "bydlo" in ks and "owce" in ks and "farma" not in ks:
        return False
    if "farma" in ks and "owce" in ks and "bydlo" not in ks:
        return False
    if "farma" in ks and "irygacja" in ks:
        return gal_terrain("farma", teren) and gal_terrain("irygacja", teren)
    if "farma" in ks and "bydlo" in ks:
        return gal_terrain("farma", teren) and gal_terrain("bydlo", teren)
    return all(gal_terrain(k, teren) for k in ks)


def gal_show(keys_, teren, preview):
    ks = [k for k in keys_ if k and k != "brak"]
    if preview and "farma" in ks and "bydlo" in ks and "owce" in ks:
        return gal_combo(["farma", "bydlo"], teren)
    if preview and "bydlo" in ks and "owce" in ks and "farma" not in ks:
        return gal_terrain("bydlo", teren)
    if preview and "farma" in ks and "owce" in ks and "bydlo" not in ks:
        return teren == TEREN["Wzgorza"] or gal_terrain("farma", teren)
    return gal_combo(keys_, teren)


gal = json.load(open(f"{VEC}/gallery.json", encoding="utf8"))
for i, c in enumerate(gal["terrain"]):
    check(f"gal_terrain[{i}]", gal_terrain(c["key"], c["teren"]), c["out"])
for i, c in enumerate(gal["combo"]):
    check(f"gal_combo[{i}]", gal_combo(c["keys"], c["teren"]), c["out"])
for i, c in enumerate(gal["show"]):
    check(f"gal_show[{i}]", gal_show(c["keys"], c["teren"], bool(c["preview"])), c["out"])

print(f"checks={checks} rozbieznosci={bad}")
sys.exit(1 if bad else 0)
