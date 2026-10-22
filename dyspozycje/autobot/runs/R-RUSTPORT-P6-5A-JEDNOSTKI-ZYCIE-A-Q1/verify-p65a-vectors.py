#!/usr/bin/env python3
"""NIEZALEZNY weryfikator P6.5A (jednostki - zycie, czesc A).

Przelicza w Pythonie (osobna implementacja, czytana ze zrodel TS weba, BEZ udzialu Rust i bez
udzialu Node) kazdy przypadek wektorow `rust-port/engine/tests/p6_5a_vectors/*.json` i porownuje
z wynikiem URUCHOMIONEGO weba zapisanym w wektorze (porownanie bitowe `f64`: `-0` != `0`, `NaN == NaN`).
Dodatkowo sprawdza, ze tabele Rust `data/derived/unit-cost-tempo.json` i `army-merge-params.json`
zgadzaja sie ze stalymi odczytanymi REGEXEM wprost z tekstu zrodel TS pinu, oraz ze zaleznosci
spoza zakresu (`sumRosterFieldM`, poziomy odznak, poziomy weterana) zapisane w wektorach
(`dep`, `rosterTable`, `rosterSum`) zgadzaja sie z ich NIEZALEZNA reimplementacja tutaj.

Uzycie: verify-p65a-vectors.py <WEB_ROOT> <ENGINE_DIR>
Wyjscie: liczba przypadkow per funkcja i liczba rozbieznosci (0 = zgodnosc), kod wyjscia 0/1.
"""
import json
import math
import re
import sys
from pathlib import Path

WEB = Path(sys.argv[1])
ENGINE = Path(sys.argv[2])
VEC = ENGINE / "tests" / "p6_5a_vectors"
GAME = WEB / "gra" / "src" / "game"
INF = math.inf

mismatches = []
checked = {}


def dec(v):
    if isinstance(v, dict):
        if "$n" in v:
            return {"NaN": math.nan, "Infinity": math.inf, "-Infinity": -math.inf, "-0": -0.0}[v["$n"]]
        if "$f" in v:
            return float(v["$f"])
    return v


def decode_all(v):
    v = dec(v)
    if isinstance(v, list):
        return [decode_all(x) for x in v]
    if isinstance(v, dict):
        return {k: decode_all(x) for k, x in v.items()}
    return v


def eq(a, b):
    if isinstance(a, bool) or isinstance(b, bool):
        return type(a) == type(b) and a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        if math.isnan(a) and math.isnan(b):
            return True
        if a == b and a == 0:
            return math.copysign(1.0, a) == math.copysign(1.0, b)
        return a == b
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(eq(a[k], b[k]) for k in a)
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return len(a) == len(b) and all(eq(x, y) for x, y in zip(a, b))
    return a == b


def check(name, got, want, ctx=""):
    checked[name] = checked.get(name, 0) + 1
    if not eq(got, want):
        mismatches.append((name, str(ctx)[:300], got, want))


# ---------------------------------------------------------------------------
# stale odczytane Z TEKSTU zrodel TS (regex)
# ---------------------------------------------------------------------------
AM = (GAME / "armyMerge.ts").read_text(encoding="utf-8")
CT = (GAME / "unit-cost-tempo.ts").read_text(encoding="utf-8")
UP = (GAME / "unit-power.ts").read_text(encoding="utf-8")
ABP = (GAME / "auto-battle-power.ts").read_text(encoding="utf-8")
UBB = (GAME / "unit-building-bonuses.ts").read_text(encoding="utf-8")
VET = (GAME / "veteran.ts").read_text(encoding="utf-8")
COMBAT_PARAMS = json.loads((WEB / "gra" / "data" / "combat-params.json").read_text(encoding="utf-8"))


def rx(text, pattern, group=1):
    m = re.search(pattern, text, re.S)
    if not m:
        raise SystemExit(f"brak wzorca {pattern!r}")
    return m.group(group)


def js_string(lit):
    """Literal napisu TS ('...' z sekwencjami \\uXXXX) -> napis."""
    return json.loads('"' + lit.replace('"', '\\"') + '"')


SEP = rx(AM, r"u\.ownerId \+ '([^']*)' \+ u\.q")  # '|'
G_SUFFIX = rx(AM, r"\+ ',' \+ u\.r \+ '([^']*)'\s*\n\s*:\s*u\.ownerId")  # '|g'
RENDER_SUFFIX = rx(AM, r"u\.r \+ \(u\.inGarnizon === true \? '([^']*)' : ''\)")
assert G_SUFFIX == RENDER_SUFFIX, (G_SUFFIX, RENDER_SUFFIX)
FRESH_PREFIX, FRESH_SEP = rx(AM, r"return '([^']*)' \+ ownerId \+ '([^']*)' \+ Date\.now\(\)", 1), rx(AM, r"return '[^']*' \+ ownerId \+ '([^']*)' \+ Date\.now", 1)
RADIX = int(rx(AM, r"Date\.now\(\)\.toString\((\d+)\)"))
assert int(rx(AM, r"stackGroupSeq\.toString\((\d+)\)")) == RADIX
SAME_HEX_LABEL = js_string(rx(AM, r"label: '([^']*)' \}\);\s*\n\s*\}\s*\n\s*for \(const d of findAdjacentEmptyHexes"))
MIN_SPLIT = int(rx(AM, r"if \(stackLength >= (\d+)\)"))
SPLIT_ID = rx(AM, r"id: '(split)'")
SPLIT_LABEL = js_string(rx(AM, r"id: 'split',\s*label: '([^']*)'"))
MERGE_ID = rx(AM, r"id: '(merge)'")
MERGE_LABEL = js_string(rx(AM, r"id: 'merge',\s*label: '([^']*)'"))
NEIGH = [tuple(int(x) for x in m) for m in re.findall(r"\[(-?\d+), (-?\d+)\]", rx(AM, r"const NEIGH[^=]*=\s*\[(.*?)\];"))]
BADGE_INIT = int(rx(AM, r"stackArmorBadgeLevel[^{]*\{\s*let best: UnitPathBadgeLevel = (\d+);"))
VET_INIT = int(rx(AM, r"stackVeteranLevel[^{]*\{\s*let best: VeteranLevel = (\d+);"))
STARS_INIT = int(rx(AM, r"stackVeteranStarCount[^{]*\{\s*let best = (\d+);"))
PACE = {k: float(v) for k, v in re.findall(r"(\w+):\s*([\d.]+),", rx(CT, r"KOSZT_JEDNOSTEK_PACE = \{(.*?)\} as const"))}
MIN_COST = int(rx(CT, r"Math\.max\((\d+), Math\.round\(bazowyKoszt"))
ARMOR_MAX = int(rx(UBB, r"ARMOR_PATH_MAX_PP = (\d+)"))
SOFT_MAX = int(rx(UBB, r"SOFT_PATH_MAX_PP = (\d+)"))
VET_MAX_BATTLES = int(rx(VET, r"VETERAN_MAX_BATTLES_TRACKED = (\d+)"))
EXCLUDED_TYPES = set(re.findall(r"'([^']+)'", rx(ABP, r"BATTLE_EXCLUDED_TYPES = new Set\(\[(.*?)\]\)")))
UNIT_POWER = COMBAT_PARAMS["unit_power"]
SIEGE_ROLE = rx(UP, r"\(u\['Rola \(linia\)'\] \?\? ''\) === '([^']*)'")
SIEGE_ROLE = js_string(SIEGE_ROLE)


# ---------------------------------------------------------------------------
# tabele Rust vs TS
# ---------------------------------------------------------------------------
tempo = json.loads((ENGINE / "data" / "derived" / "unit-cost-tempo.json").read_text(encoding="utf-8"))
params = json.loads((ENGINE / "data" / "derived" / "army-merge-params.json").read_text(encoding="utf-8"))
ruch_params = json.loads((ENGINE / "data" / "derived" / "ruch-jednostek-params.json").read_text(encoding="utf-8"))
check("tabela_vs_TS.tempa", [(r["klucz"], r["mnoznik"]) for r in tempo["tempa"]], list(PACE.items()))
check("tabela_vs_TS.min_koszt", tempo["min_koszt"], MIN_COST)
check("tabela_vs_TS.id.prefiks", params["id_stosu"]["prefiks"], FRESH_PREFIX)
check("tabela_vs_TS.id.separator", params["id_stosu"]["separator"], FRESH_SEP)
check("tabela_vs_TS.id.podstawa", params["id_stosu"]["podstawa"], RADIX)
check("tabela_vs_TS.etykieta_heks", params["podzial"]["etykieta_ten_heks"], SAME_HEX_LABEL)
check("tabela_vs_TS.min_stos", params["podzial"]["min_stos_rozdzielenia"], MIN_SPLIT)
check("tabela_vs_TS.split", (params["podzial"]["akcja_rozdziel"]["id"], params["podzial"]["akcja_rozdziel"]["etykieta"]), (SPLIT_ID, SPLIT_LABEL))
check("tabela_vs_TS.merge", (params["podzial"]["akcja_polacz"]["id"], params["podzial"]["akcja_polacz"]["etykieta"]), (MERGE_ID, MERGE_LABEL))
check("tabela_vs_TS.odznaka_start", params["stan_stosu"]["poziom_odznaki_poczatkowy"], BADGE_INIT)
check("tabela_vs_TS.weteran_start", params["stan_stosu"]["poziom_weterana_poczatkowy"], VET_INIT)
check("tabela_vs_TS.gwiazdki_start", params["stan_stosu"]["gwiazdki_poczatkowe"], STARS_INIT)
check("tabela_vs_TS.sasiedzi", [tuple(x) for x in ruch_params["teren"]["sasiedzi"]], NEIGH)
check("tabela_vs_TS.separator_stosu", (ruch_params["stos"]["separator"], ruch_params["stos"]["przyrostek_garnizon"]), (SEP, G_SUFFIX))


# ---------------------------------------------------------------------------
# semantyka JS
# ---------------------------------------------------------------------------
def js_min(*xs):
    out = xs[0]
    for x in xs[1:]:
        if math.isnan(out) or math.isnan(x):
            return math.nan
        if x < out or (x == out == 0 and math.copysign(1, x) < 0):
            out = x
    return out


def js_max(*xs):
    out = xs[0]
    for x in xs[1:]:
        if math.isnan(out) or math.isnan(x):
            return math.nan
        if x > out or (x == out == 0 and math.copysign(1, x) > 0):
            out = x
    return out


def js_round(x):
    if math.isnan(x) or math.isinf(x) or x == math.floor(x):
        return x
    f = math.floor(x)
    r = float(f + 1) if x - f >= 0.5 else float(f)
    return -0.0 if r == 0 and x < 0 else r


def u16(s):
    b = s.encode("utf-16-be")
    return [int.from_bytes(b[i:i + 2], "big") for i in range(0, len(b), 2)]


def str_lt(a, b):
    return u16(a) < u16(b)


def base_n(n, radix):
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    if n == 0:
        return "0"
    out = ""
    while n:
        out = digits[n % radix] + out
        n //= radix
    return out


def is_number(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def finite(v):
    return is_number(v) and math.isfinite(v)


def load(name):
    return decode_all(json.loads((VEC / name).read_text(encoding="utf-8")))["cases"]


def cp(u):
    return dict(u)


def stack_group_id(u):
    sg = u.get("stackGroupId")
    if isinstance(sg, str) and sg != "":
        return sg
    base = f"{u['ownerId']}{SEP}{u['q']},{u['r']}"
    return base + G_SUFFIX if u.get("inGarnizon") is True else base


def render_key(u):
    return f"{stack_group_id(u)}{SEP}{u['q']},{u['r']}" + (G_SUFFIX if u.get("inGarnizon") is True else "")


def garn(u):
    return u.get("inGarnizon") is True


def visible(units, q, r, owner, group=None):
    return [i for i, u in enumerate(units) if u["ownerId"] == owner and u["q"] == q and u["r"] == r and not garn(u) and (group is None or stack_group_id(u) == group)]


def co_located(units, q, r, owner, group=None):
    return [i for i, u in enumerate(units) if u["ownerId"] == owner and u["q"] == q and u["r"] == r and not u.get("oblegaCityId") and (group is None or stack_group_id(u) == group)]


def garrison(units, q, r, owner, group=None):
    return [i for i, u in enumerate(units) if u["ownerId"] == owner and u["q"] == q and u["r"] == r and garn(u) and (group is None or stack_group_id(u) == group)]


def enter_garnizon(u):
    if garn(u):
        return
    u["fortifyRuchSnapshot"] = u["ruchLeft"]
    u["inGarnizon"] = True
    u["ruchLeft"] = 0


def exit_garnizon(u):
    if not garn(u):
        return False
    u["inGarnizon"] = False
    u["sentry"] = False
    if "fortifyRuchSnapshot" in u:
        u["ruchLeft"] = u.pop("fortifyRuchSnapshot")
    return True


def enter_field_fortify(u):
    u["fortifyRuchSnapshot"] = u["ruchLeft"]
    u["ufortyfikowanyWPolu"] = True
    u["autoExplore"] = False
    u["ruchLeft"] = 0


def exit_field_fortify(u):
    if u.get("ufortyfikowanyWPolu") is not True:
        return False
    u["ufortyfikowanyWPolu"] = False
    if "fortifyRuchSnapshot" in u:
        u["ruchLeft"] = u.pop("fortifyRuchSnapshot")
    return True


def pick_rep(stack, attack):
    best = stack[0]
    for u in stack[1:]:
        a, b = attack(u), attack(best)
        if a != b:  # NaN != x
            best = u if a > b else best
        else:
            best = u if str_lt(u["id"], best["id"]) else best
    return best


def ruch_left_pool(stack):
    return 0 if not stack else js_min(*[u["ruchLeft"] for u in stack])


def planning_unit(u):
    if (garn(u) or u.get("ufortyfikowanyWPolu") is True) and "fortifyRuchSnapshot" in u:
        return u["fortifyRuchSnapshot"]
    return u["ruchLeft"]


def planning_pool(stack):
    return 0 if not stack else js_min(*[planning_unit(u) for u in stack])


def ruch_max_pool(stack):
    return 0 if not stack else js_min(*[u["ruch"] for u in stack])


def hp_pool(stack, max_hp):
    hp = hpmax = 0
    for u in stack:
        m = max_hp(u)
        if not finite(m) or m <= 0:
            continue
        hpmax += m
        cur = js_max(0, js_min(m, u["hp"])) if finite(u.get("hp")) else m
        hp += cur
    return hp, hpmax


# --- niezalezna reimplementacja zaleznosci spoza zakresu --------------------------------
def num_or0(v, fallback=0):
    if v is None or v == "" or v == "—":
        return fallback
    try:
        n = float(v)
    except (TypeError, ValueError):
        return fallback
    return n if math.isfinite(n) else fallback


def round1(n):
    return js_round(n * 10) / 10


def field_power_total(d):
    attack = num_or0(d.get("meleeAttack")) + num_or0(d.get("weaponDamage")) + num_or0(d.get("piercing")) + num_or0(d.get("chargeBonus")) / UNIT_POWER["charge_divisor"] + num_or0(d.get("missileAttack")) / UNIT_POWER["missile_divisor"]
    defense = num_or0(d.get("meleeDefence")) + num_or0(d.get("armor")) + num_or0(d.get("health")) / UNIT_POWER["hp_field_divisor"]
    return round1(round1(attack) + round1(defense))


def army_field_power(d):
    if d.get("Rola (linia)", "") == SIEGE_ROLE:
        return 0
    fp = d.get("fieldPower")
    if is_number(fp) and math.isfinite(fp):
        return fp
    return field_power_total(d)


def is_field_battle(type_id, d):
    if d.get("Rola (linia)", "") == SIEGE_ROLE:
        return False
    if type_id in EXCLUDED_TYPES:
        return False
    return army_field_power(d) > 0


def sum_roster(roster, defs):
    s = 0.0
    for type_id, key in roster:
        d = defs[key]
        if not is_field_battle(type_id, d):
            continue
        s += army_field_power(d)
    return js_round(s * 10) / 10


def path_level(pp, bounds):
    if not finite(pp) or pp <= 0:
        return 0
    if pp <= bounds[0]:
        return 1
    if pp <= bounds[1]:
        return 2
    return 3


def pos_pp(v):
    return v if is_number(v) and math.isfinite(v) and v > 0 else 0


def armor_level(u):
    return path_level(pos_pp(u.get("pancerzBonusProc")), (ARMOR_MAX // 3, (ARMOR_MAX * 2) // 3))


def soft_level(u):
    return path_level(pos_pp(u.get("parametryBonusProc")), (SOFT_MAX // 3, (SOFT_MAX * 2) // 3))


def battles_won(u):
    v = u.get("battlesSurvived")
    return math.floor(v) if is_number(v) and math.isfinite(v) and v > 0 else 0


def vet_level(u):
    n = battles_won(u)
    return 3 if n >= 3 else 2 if n >= 1 else 1


def vet_stars(u):
    return min(VET_MAX_BATTLES, battles_won(u))


def vitals(stack, dep_of, defs):
    hp, hpmax = hp_pool(stack, lambda u: dep_of(u)["maxHp"])
    roster = [(u["typeId"], dep_of(u)["defKey"]) for u in stack]
    out = {
        "ruchLeft": ruch_left_pool(stack),
        "ruchMax": ruch_max_pool(stack),
        "hp": hp,
        "hpMax": hpmax,
        "fieldPowerM": 0 if not stack else sum_roster(roster, defs),
        "count": len(stack),
        "armorBadgeLevel": max([BADGE_INIT] + [dep_of(u)["armor"] for u in stack]),
        "softBadgeLevel": max([BADGE_INIT] + [dep_of(u)["soft"] for u in stack]),
        "veteranLevel": max([VET_INIT] + [dep_of(u)["vet"] for u in stack]),
        "veteranStars": max([STARS_INIT] + [dep_of(u)["stars"] for u in stack]),
    }
    return out


# ===========================================================================
# stack.json
# ===========================================================================
S = load("stack.json")
for c in S["stackGroupIdOf"]:
    check("stackGroupIdOf", stack_group_id(c["unit"]), c["out"], c)
for c in S["stackRenderKey"]:
    check("stackRenderKey", render_key(c["unit"]), c["out"], c)
for c in S["sameStackGroup"]:
    check("sameStackGroup", stack_group_id(c["a"]) == stack_group_id(c["b"]), c["out"], c)
for c in S["stackKey"]:
    check("stackKey", f"{int(c['q'])},{int(c['r'])}", c["out"], c)

seq = 0
for op in S["freshSequence"][0]["ops"]:
    if op["op"] == "fresh":
        seq += 1
        got = f"{FRESH_PREFIX}{op['owner']}{FRESH_SEP}{base_n(int(op['now']), RADIX)}{FRESH_SEP}{base_n(seq, RADIX)}"
        check("freshStackGroupId", got, op["out"], op)
    else:
        units = [cp(u) for u in op["units"]]
        if units:
            seq += 1
            gid = f"{FRESH_PREFIX}{units[0]['ownerId']}{FRESH_SEP}{base_n(int(op['now']), RADIX)}{FRESH_SEP}{base_n(seq, RADIX)}"
            for u in units:
                u["stackGroupId"] = gid
        check("assignSharedStackGroupId", units, op["after"], op)

for name, fn in (("visibleStackOnHex", visible), ("coLocatedForMergePrompt", co_located), ("garrisonUnitsOnHex", garrison)):
    for c in S[name]:
        check(name, fn(c["units"], c["q"], c["r"], c["ownerId"], c.get("groupId")), c["out"], c)
for c in S["adjacentVisibleArmyHexes"]:
    out = []
    for dq, dr in NEIGH:
        st = visible(c["units"], c["q"] + dq, c["r"] + dr, c["ownerId"])
        if st:
            out.append({"q": c["q"] + dq, "r": c["r"] + dr, "stack": st})
    check("adjacentVisibleArmyHexes", out, c["out"], c)
for c in S["activeUnitStack"]:
    a = c["units"][c["active"]]
    gid = stack_group_id(a)
    fn = garrison if garn(a) else visible
    check("activeUnitStack", fn(c["units"], a["q"], a["r"], a["ownerId"], gid), c["out"], c)
for name, fn in (("enterGarnizon", enter_garnizon), ("enterFieldFortify", enter_field_fortify)):
    for c in S[name]:
        u = cp(c["unit"])
        fn(u)
        check(name, u, c["after"], c)
for name, fn in (("exitGarnizon", exit_garnizon), ("exitFieldFortify", exit_field_fortify)):
    for c in S[name]:
        u = cp(c["unit"])
        res = fn(u)
        check(name + ".ret", res, c["out"], c)
        check(name + ".unit", u, c["after"], c)
OPS = {"enterGarnizon": enter_garnizon, "exitGarnizon": exit_garnizon, "enterFieldFortify": enter_field_fortify, "exitFieldFortify": exit_field_fortify}
for c in S["fortifyChain"]:
    u = cp(c["unit"])
    for step in c["steps"]:
        res = OPS[step["op"]](u)
        check("fortifyChain.ret", res, step["ret"], c)
        check("fortifyChain.unit", u, step["after"], c)
for c in S["allDefendersFortifiedInGarnizon"]:
    check("allDefendersFortifiedInGarnizon", len(c["units"]) > 0 and all(garn(u) for u in c["units"]), c["out"], c)
for c in S["wakeStackForMoveOrder"]:
    units = [cp(u) for u in c["units"]]
    left = False
    for u in units:
        if exit_garnizon(u):
            left = True
        exit_field_fortify(u)
        if u.get("sentry") is True:
            u["sentry"] = False
    check("wakeStackForMoveOrder.ret", left, c["out"], c)
    check("wakeStackForMoveOrder.units", units, c["after"], c)
for c in S["countLawGarrisonOnCityHex"]:
    n = len([u for u in c["units"] if u["ownerId"] == c["ownerId"] and u["q"] == c["q"] and u["r"] == c["r"] and not u.get("oblegaCityId")])
    check("countLawGarrisonOnCityHex", n, c["out"], c)
for c in S["unitsOnCityHexForLaw"]:
    ix = [i for i, u in enumerate(c["units"]) if u["ownerId"] == c["ownerId"] and u["q"] == c["q"] and u["r"] == c["r"] and not u.get("oblegaCityId")]
    check("unitsOnCityHexForLaw", ix, c["out"], c)

# ===========================================================================
# display.json
# ===========================================================================
D = load("display.json")
DEFS = D["defs"]


def attack_fn(units, attacks):
    return lambda u: attacks[next(i for i, x in enumerate(units) if x is u)]


for c in D["pickStackRepresentative"]:
    if c.get("threw"):
        check("pickStackRepresentative.empty", True, True, c)
        continue
    units = c["units"]
    out = pick_rep(units, attack_fn(units, c["attacks"]))
    check("pickStackRepresentative", next(i for i, x in enumerate(units) if x is out), c["out"], c)

for c in D["computeStackDisplay"]:
    units = c["units"]
    dep = c["dep"]
    att = attack_fn(units, [d["attack"] for d in dep])
    groups = {}
    for u in units:
        groups.setdefault(render_key(u), []).append(u)
    visible_ids = []
    badge = {}
    vit = {}
    for stack in groups.values():
        rep = pick_rep(stack, att)
        if rep["id"] not in visible_ids:
            visible_ids.append(rep["id"])
        if len(stack) > 1:
            badge[rep["id"]] = len(stack)
        if c["withDeps"]:
            vit[rep["id"]] = vitals(stack, lambda u: dep[next(i for i, x in enumerate(units) if x is u)], DEFS)
    check("computeStackDisplay.visibleIds", visible_ids, c["out"]["visibleIds"], c)
    check("computeStackDisplay.badge", [[k, v] for k, v in badge.items()], c["out"]["badge"], c)
    if c["withDeps"]:
        check("computeStackDisplay.vitals", [[k, v] for k, v in vit.items()], c["out"]["vitals"], c)
        # roster kazdego stosu i wynik sumRosterFieldM zapisany w wektorze == reimplementacja
        table = [([tuple(e) for e in entries], out) for entries, out in c["rosterTable"]]
        mine = [([(u["typeId"], dep[next(i for i, x in enumerate(units) if x is u)]["defKey"]) for u in st], None) for st in groups.values()]
        check("computeStackDisplay.rosterKeys", [t[0] for t in table], [m[0] for m in mine], c)
        check("computeStackDisplay.rosterSums", [t[1] for t in table], [sum_roster(m[0], DEFS) for m in mine], c)
        flat = [e for entries, _ in table for e in entries]
        check("computeStackDisplay.trace", flat, [tuple(e) for e in c["trace"]], c)
        check("computeStackDisplay.keys", sorted(c["out"]["keys"]), sorted(["visibleIds", "badgeByRepId", "vitalsByRepId"]), c)
    else:
        check("computeStackDisplay.keys", sorted(c["out"]["keys"]), sorted(["visibleIds", "badgeByRepId"]), c)
    # zaleznosci: poziomy odznak / weterana z wektora == reimplementacja z pol jednostki
    for u, d in zip(units, dep):
        check("dep.armor", armor_level(u), d["armor"], u)
        check("dep.soft", soft_level(u), d["soft"], u)
        check("dep.vet", vet_level(u), d["vet"], u)
        check("dep.stars", vet_stars(u), d["stars"], u)

for c in D["unitAtRepresentative"]:
    units = c["units"]
    st = [u for u in units if u["q"] == c["q"] and u["r"] == c["r"] and not garn(u)]
    if not st:
        out = None
    elif len(st) == 1:
        out = next(i for i, x in enumerate(units) if x is st[0])
    else:
        rep = pick_rep(st, attack_fn(units, c["attacks"]))
        out = next(i for i, x in enumerate(units) if x is rep)
    check("unitAtRepresentative", out, c["out"], c)

for c in D["stackHpPool"]:
    units, dep = c["units"], c["dep"]
    st = [units[i] for i in c["stack"]]
    hp, hpmax = hp_pool(st, lambda u: dep[next(i for i, x in enumerate(units) if x is u)]["maxHp"])
    check("stackHpPool", {"hp": hp, "hpMax": hpmax}, c["out"], c)

for c in D["stackFieldPowerM"]:
    units, dep = c["units"], c["dep"]
    st = [units[i] for i in c["stack"]]
    roster = [(u["typeId"], dep[next(i for i, x in enumerate(units) if x is u)]["defKey"]) for u in st]
    check("stackFieldPowerM.roster", roster, [tuple(e) for e in c["roster"]], c)
    mine = 0 if not st else sum_roster(roster, DEFS)
    check("stackFieldPowerM", mine, c["out"], c)

for c in D["stackBadges"]:
    units, dep = c["units"], c["dep"]
    st = [units[i] for i in c["stack"]]
    check("stackBadges.armor", max([BADGE_INIT] + [armor_level(u) for u in st]), c["armor"], c)
    check("stackBadges.soft", max([BADGE_INIT] + [soft_level(u) for u in st]), c["soft"], c)
    check("stackBadges.vet", max([VET_INIT] + [vet_level(u) for u in st]), c["vet"], c)
    check("stackBadges.stars", max([STARS_INIT] + [vet_stars(u) for u in st]), c["stars"], c)

for c in D["stackVitals"]:
    units, dep = c["units"], c["dep"]
    st = [units[i] for i in c["stack"]]
    check("stackVitals", vitals(st, lambda u: dep[next(i for i, x in enumerate(units) if x is u)], DEFS), c["out"], c)

# ===========================================================================
# ruch.json
# ===========================================================================
R = load("ruch.json")


def passable_fn(blocked):
    if blocked is None:
        return lambda q, r: True
    bs = {(q, r) for q, r in blocked}
    return lambda q, r: (q, r) not in bs


def adjacent_empty(units, q, r, passable):
    out = []
    for dq, dr in NEIGH:
        nq, nr = q + dq, r + dr
        if not passable(nq, nr):
            continue
        if not any(u["q"] == nq and u["r"] == nr and not garn(u) for u in units):
            out.append([nq, nr])
    return out


for c in R["findAdjacentEmptyHexes"]:
    check("findAdjacentEmptyHexes", adjacent_empty(c["units"], c["q"], c["r"], passable_fn(c["blocked"])), c["out"], c)
for c in R["findSplitDestHexes"]:
    out = []
    if c["allowSame"] is True:
        out.append({"q": c["q"], "r": c["r"], "label": SAME_HEX_LABEL})
    for q, r in adjacent_empty(c["units"], c["q"], c["r"], passable_fn(c["blocked"])):
        out.append({"q": q, "r": r})
    check("findSplitDestHexes", out, c["out"], c)


def reject_hex(units, fq, fr, except_id, passable):
    def occupied(q, r):
        return any(u["id"] != except_id and u["q"] == q and u["r"] == r and not garn(u) for u in units)

    if not occupied(fq, fr) and passable(fq, fr):
        return [fq, fr]
    for dq, dr in NEIGH:
        q, r = fq + dq, fr + dr
        if not passable(q, r):
            continue
        if not occupied(q, r):
            return [q, r]
    return None


for c in R["findBounceHexFromOrigin"]:
    check("findBounceHexFromOrigin", reject_hex(c["units"], c["fromQ"], c["fromR"], c["except"], passable_fn(c["blocked"])), c["out"], c)

for c in R["assignBounceHexesForUnits"]:
    units, ids = c["units"], c["ids"]
    passable = passable_fn(c["blocked"])
    virtual = set()
    out = {}

    def occ(q, r, ex):
        if (q, r) in virtual:
            return True
        return any(u["id"] != ex and u["id"] not in ids and u["q"] == q and u["r"] == r and not garn(u) for u in units)

    def spot(ex):
        if not occ(c["preferQ"], c["preferR"], ex) and passable(c["preferQ"], c["preferR"]):
            return (c["preferQ"], c["preferR"])
        for dq, dr in NEIGH:
            q, r = c["preferQ"] + dq, c["preferR"] + dr
            if not passable(q, r):
                continue
            if not occ(q, r, ex):
                return (q, r)
        return None

    for uid in ids:
        s = spot(uid)
        if s is None:
            continue
        out[uid] = [s[0], s[1]]
        virtual.add(s)
    check("assignBounceHexesForUnits", [[k, v] for k, v in out.items()], c["out"], c)

for c in R["computeSeparateReturn"]:
    safe = js_max(0, c["deducted"])
    out = {}
    for u in c["units"]:
        out[u["id"]] = js_min(u["ruch"], u["ruchLeft"] + safe)
    check("computeSeparateReturn", [[k, v] for k, v in out.items()], c["out"], c)

for c in R["resolveSeparateReturnHex"]:
    units = c["units"]
    passable = passable_fn(c["blocked"])
    if c["blocked"] is not None and not passable(c["fromQ"], c["fromR"]):
        out = None
    elif any(u["q"] == c["fromQ"] and u["r"] == c["fromR"] and u["ownerId"] != c["ownerId"] and not garn(u) for u in units):
        out = None
    else:
        out = [c["fromQ"], c["fromR"]]
    check("resolveSeparateReturnHex", out, c["out"], c)

for c in R["stackHudMergeSplitActions"]:
    actions = []
    if c["len"] >= MIN_SPLIT:
        actions.append({"id": SPLIT_ID, "label": SPLIT_LABEL, "disabled": c["dest"] == 0})
        actions.append({"id": MERGE_ID, "label": MERGE_LABEL, "disabled": not c["canMerge"]})
    elif c["canMerge"]:
        actions.append({"id": MERGE_ID, "label": MERGE_LABEL, "disabled": False})
    check("stackHudMergeSplitActions", actions, c["out"], c)

for c in R["stackRuchLeft"]:
    check("stackRuchLeft", ruch_left_pool([c["units"][i] for i in c["stack"]]), c["out"], c)
for c in R["planningStackRuchLeft"]:
    check("planningStackRuchLeft", planning_pool([c["units"][i] for i in c["stack"]]), c["out"], c)
for c in R["stackRuchMax"]:
    check("stackRuchMax", ruch_max_pool([c["units"][i] for i in c["stack"]]), c["out"], c)
for c in R["planningUnitRuchLeft"]:
    check("planningUnitRuchLeft", planning_unit(c["unit"]), c["out"], c)
for c in R["syncStackRuchLeft"]:
    units = [cp(u) for u in c["units"]]
    st = [units[i] for i in c["stack"]]
    if st:
        v = c["ruchLeft"] if c["ruchLeft"] is not None else ruch_left_pool(st)
        for u in st:
            u["ruchLeft"] = v
    check("syncStackRuchLeft", units, c["after"], c)
for c in R["deductStackRuchLeft"]:
    units = [cp(u) for u in c["units"]]
    st = [units[i] for i in c["stack"]]
    if st:
        v = js_max(0, ruch_left_pool(st) - c["cost"])
        for u in st:
            u["ruchLeft"] = v
    check("deductStackRuchLeft", units, c["after"], c)
for c in R["unitWithStackRuch"]:
    units = c["units"]
    u = units[c["unit"]]
    st = [units[i] for i in c["stack"]]
    if len(st) <= 1:
        out = u
    else:
        pooled = ruch_left_pool(st)
        out = u if pooled == u["ruchLeft"] else {**u, "ruchLeft": pooled}
    check("unitWithStackRuch", out, c["out"], c)
for c in R["unitWithPlanningStackRuch"]:
    units = c["units"]
    u = units[c["unit"]]
    st = [units[i] for i in c["stack"]]
    pooled = planning_pool(st)
    out = u if pooled == u["ruchLeft"] else {**u, "ruchLeft": pooled}
    check("unitWithPlanningStackRuch", out, c["out"], c)

# ===========================================================================
# cost.json
# ===========================================================================
C = load("cost.json")
K = C["constants"]
check("constants.keys", K["keys"], list(PACE.keys()), K)
check("constants.mnozniki", [K["KOSZT_JEDNOSTEK_PACE"][k] for k in K["keys"]], [PACE[k] for k in K["keys"]], K)
check("constants.minKoszt", K["minKoszt"], MIN_COST, K)
for c in C["applyUnitCostPace"]:
    pace = c["pace"]
    if isinstance(pace, str):
        mult = PACE.get(pace, math.nan) if pace in PACE else math.nan
    else:
        mult = pace
    base = c["base"]
    prod = base * mult if not (math.isinf(base) and mult == 0) and not (math.isinf(mult) and base == 0) else math.nan
    if math.isnan(base) or math.isnan(mult):
        prod = math.nan
    check("applyUnitCostPace", js_max(MIN_COST, js_round(float(prod))), c["out"], c)
for c in C["buildReplaceAvailabilityCtx"]:
    expect = dict(c["rest"])
    expect["empireResourceStock"] = c["stock"]
    check("buildReplaceAvailabilityCtx", c["out"], expect, c)
    check("buildReplaceAvailabilityCtx.flags", (c["newObject"], c["sameStockRef"]), (True, True), c)

for k in sorted(checked):
    print(f"{k}: {checked[k]}")
print(f"PRZYPADKOW: {sum(checked.values())}")
print(f"ROZBIEZNOSCI: {len(mismatches)}")
for m in mismatches[:25]:
    print("ROZBIEZNOSC", m)
sys.exit(1 if mismatches else 0)
