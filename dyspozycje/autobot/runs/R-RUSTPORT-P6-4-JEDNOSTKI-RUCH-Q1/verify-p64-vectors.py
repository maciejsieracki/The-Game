#!/usr/bin/env python3
"""NIEZALEZNY weryfikator P6.4 (jednostki - ruch).

Przelicza w Pythonie (osobna implementacja, czytana ze zrodel TS weba, BEZ udzialu Rust i bez
udzialu Node) kazdy przypadek wektorow `rust-port/engine/tests/p6_4_vectors/*.json` i porownuje
z wynikiem URUCHOMIONEGO weba zapisanym w wektorze. Dodatkowo sprawdza, ze tabela Rust
`data/derived/ruch-jednostek-params.json` (oraz `data/terrain-movement.json`) zgadza sie ze stalymi
odczytanymi REGEXEM wprost z tekstu zrodel TS pinu.

Uzycie: verify-p64-vectors.py <WEB_ROOT> <ENGINE_DIR>
Wyjscie: liczba przypadkow per funkcja i liczba rozbieznosci (0 = zgodnosc), kod wyjscia 0/1.
"""
import json
import math
import re
import sys
import unicodedata
from pathlib import Path

WEB = Path(sys.argv[1])
ENGINE = Path(sys.argv[2])
VEC = ENGINE / "tests" / "p6_4_vectors"
GAME = WEB / "gra" / "src" / "game"
SRC = WEB / "gra" / "src"
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
        return a is b or a == b and type(a) == type(b)
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        if math.isnan(a) and math.isnan(b):
            return True
        return a == b
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(eq(a[k], b[k]) for k in a)
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return len(a) == len(b) and all(eq(x, y) for x, y in zip(a, b))
    return a == b


def check(name, got, want, ctx):
    checked[name] = checked.get(name, 0) + 1
    if not eq(got, want):
        mismatches.append((name, str(ctx)[:300], got, want))


# ---------------------------------------------------------------------------
# stale odczytane Z TEKSTU zrodel TS (regex) - do porownania z tabela Rust i do implementacji
# ---------------------------------------------------------------------------
SETUP_TS = (SRC / "units" / "setup.ts").read_text(encoding="utf-8")
EMB_TS = (GAME / "embarkation.ts").read_text(encoding="utf-8")
PM_TS = (GAME / "planned-march.ts").read_text(encoding="utf-8")
SC_TS = (GAME / "scout-auto-explore.ts").read_text(encoding="utf-8")
RP_TS = (GAME / "rally-point.ts").read_text(encoding="utf-8")
AM_TS = (GAME / "armyMerge.ts").read_text(encoding="utf-8")
RM_TS = (SRC / "map" / "road-movement.ts").read_text(encoding="utf-8")
CB_TS = (GAME / "civ-bonuses.ts").read_text(encoding="utf-8")
TI_TS = (GAME / "terrain-improvements.ts").read_text(encoding="utf-8")


def rx(text, pattern, group=1):
    m = re.search(pattern, text, re.S)
    if not m:
        raise SystemExit(f"brak wzorca {pattern!r}")
    return m.group(group)


EMBARK_TECH = rx(EMB_TS, r"EMBARK_TECH\s*=\s*'([^']+)'")
EMBARK_DEFENSE_MULT = float(rx(EMB_TS, r"EMBARK_DEFENSE_MULT\s*=\s*([0-9.]+)"))
EMBARKED_WATER = float(rx(SETUP_TS, r"EMBARKED_WATER_MOVE_COST\s*=\s*([0-9.]+)"))
RIVER_COST = float(rx(SETUP_TS, r"RIVER_HEX_MOVE_COST\s*=\s*([0-9.]+)"))
ROAD_MULT = float(rx(RM_TS, r"export const ROAD_MOVE_SPEED_MULT\s*=\s*([0-9.]+)"))
BRUK_MULT = float(rx(RM_TS, r"export const ROAD_BRUK_MOVE_SPEED_MULT\s*=\s*([0-9.]+)"))
BRUK_MIN = 1.0 / float(rx(RM_TS, r"export const ROAD_BRUK_MIN_MOVE_COST\s*=\s*1\s*/\s*([0-9.]+)"))
PATH_BUFFER = int(rx(SETUP_TS, r"PATH_SEARCH_RADIUS_BUFFER\s*=\s*([0-9]+)"))
PATH_MULT = int(rx(SETUP_TS, r"hexDistance\(unit\.q,\s*unit\.r,\s*destQ,\s*destR\)\s*\*\s*([0-9]+)\s*\+\s*PATH_SEARCH_RADIUS_BUFFER"))
DEST_FALLBACK = float(rx(SETUP_TS, r"movCost === Infinity \? ([0-9.]+) : movCost"))
THRESH = float(rx(SETUP_TS, r"v >= ([0-9]+) \? Infinity : v"))
SCOUT_TYPE = rx(SC_TS, r"SCOUT_TYPE_ID\s*=\s*'([^']+)'")
SCOUT_CAT = rx(SC_TS, r"unit\.category === '([^']+)'")
MIN_MULT = float(rx(EMB_TS, r"base / Math\.max\(([0-9.]+), mult\)"))
GALERA = rx(EMB_TS, r"unit\.category === '([^']+)'\) return false")
SCORE_UNEXPLORED = int(rx(SC_TS, r"if \(!explored\.has\(k\)\) score \+= ([0-9]+);"))
SCORE_NEIGHBOR = int(rx(SC_TS, r"k in map\.hexes && !explored\.has\(k\)\) score \+= ([0-9]+);"))
JITTER = float(rx(SC_TS, r"c\.gain \+ rng\(\) \* ([0-9.]+)"))
TIE = float(rx(SC_TS, r"score > bestGain \+ ([0-9.]+)"))
STEP_CAP = int(rx(SC_TS, r"if \(steps > ([0-9]+)\) break;"))
MIN_STEP = float(rx(SC_TS, r"unit\.ruchLeft >= ([0-9]+)\) \{\s*unit\.ruchLeft = 0"))
MIN_BUDGET = float(rx(SETUP_TS, r"if \(budget >= ([0-9]+)\) \{\s*for \(const \[dq, dr\] of HEX_NEIGHBORS\)"))
MIN_PER_TURN = float(rx(PM_TS, r"const perTurn = Math\.max\(([0-9]+), perTurnMove\)"))
TEXTS = {
    "brak_ruchu": rx(PM_TS, r"reason: 'no_movement', detail: '([^']+)'"),
    "brak_trasy": rx(PM_TS, r"reason: 'no_path', detail: '([^']+)'"),
    "zablokowany_heks": rx(PM_TS, r"reason: 'obstacle', detail: '([^']+)'"),
    "obce_miasto": rx(PM_TS, r"stopDetail: '([^']+)',\s*\};\s*\}\s*const arrived"),
    "mgla": rx(PM_TS, r"stopDetail = '([^']+)'"),
}
SEP = rx(AM_TS, r"u\.ownerId \+ '(.)' \+ u\.q")
GARN = rx(AM_TS, r"u\.r \+ '(\|g)'")
DROGA_KEY = rx(RM_TS, r"keys\.includes\('(droga)'\)")
BRUK_KEY = rx(RM_TS, r"keys\.includes\('(droga_brukowana)'\)")


def parse_neighbors(text, anchor):
    block = rx(text, anchor + r"[^=]*=\s*\[(.*?)(?:\n\]|\];)")
    return [(int(a), int(b)) for a, b in re.findall(r"\[\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*\]", block)]


NEI = parse_neighbors(SETUP_TS, r"const HEX_NEIGHBORS")
NEI_EMB = parse_neighbors(EMB_TS, r"const NEI")
NEI_SC = parse_neighbors(SC_TS, r"const HEX_NEIGHBORS")
assert NEI == NEI_EMB == NEI_SC and len(NEI) == 6, (NEI, NEI_EMB, NEI_SC)
IDS_RUCH = re.findall(r"'(walka_ruch_[a-z_]+)'", rx(CB_TS, r"(export function civMovementMultiplier\(.*?\n\})"))
assert IDS_RUCH, "brak id mnoznika ruchu"

TABLE = json.loads((ENGINE / "data" / "derived" / "ruch-jednostek-params.json").read_text(encoding="utf-8"))
TM_RUST = json.loads((ENGINE / "data" / "terrain-movement.json").read_text(encoding="utf-8"))
TM_WEB = json.loads((WEB / "gra" / "data" / "terrain-movement.json").read_text(encoding="utf-8"))
IMPROVEMENTS = json.loads((WEB / "gra" / "data" / "terrain-improvements.json").read_text(encoding="utf-8"))
LEGACY_ALIASES = dict(re.findall(r"(\w+):\s*'(\w+)'", rx(TI_TS, r"LEGACY_KEY_ALIASES[^=]*=\s*\{(.*?)\};")))

# --- tabela Rust == stale z TS ---
tbl = [
    ("embarkacja.technologia", TABLE["embarkacja"]["technologia"], EMBARK_TECH),
    ("embarkacja.mnoznik_obrony", TABLE["embarkacja"]["mnoznik_obrony"], EMBARK_DEFENSE_MULT),
    ("embarkacja.koszt_wody", TABLE["embarkacja"]["koszt_wody"], EMBARKED_WATER),
    ("embarkacja.kategoria_okretu", TABLE["embarkacja"]["kategoria_okretu"], GALERA),
    ("embarkacja.min_mnoznik_ruchu", TABLE["embarkacja"]["min_mnoznik_ruchu"], MIN_MULT),
    ("teren.koszt_rzeki", TABLE["teren"]["koszt_rzeki"], RIVER_COST),
    ("teren.prog_nieprzejezdny", TABLE["teren"]["prog_nieprzejezdny"], THRESH),
    ("teren.ulepszenie_droga", TABLE["teren"]["ulepszenie_droga"], DROGA_KEY),
    ("teren.ulepszenie_droga_brukowana", TABLE["teren"]["ulepszenie_droga_brukowana"], BRUK_KEY),
    ("teren.sasiedzi", [tuple(x) for x in TABLE["teren"]["sasiedzi"]], NEI),
    ("trasa.mnoznik_promienia", TABLE["trasa"]["mnoznik_promienia"], PATH_MULT),
    ("trasa.bufor_promienia", TABLE["trasa"]["bufor_promienia"], PATH_BUFFER),
    ("trasa.koszt_celu_nieprzejezdnego", TABLE["trasa"]["koszt_celu_nieprzejezdnego"], DEST_FALLBACK),
    ("marsz.min_budzet_kroku", TABLE["marsz"]["min_budzet_kroku"], MIN_BUDGET),
    ("marsz.min_tury_ruchu", TABLE["marsz"]["min_tury_ruchu"], MIN_PER_TURN),
    ("zwiad.typ_jednostki", TABLE["zwiad"]["typ_jednostki"], SCOUT_TYPE),
    ("zwiad.kategoria", TABLE["zwiad"]["kategoria"], SCOUT_CAT),
    ("zwiad.punkty_nieodkryty_w_zasiegu", TABLE["zwiad"]["punkty_nieodkryty_w_zasiegu"], SCORE_UNEXPLORED),
    ("zwiad.punkty_sasiad_ukryty", TABLE["zwiad"]["punkty_sasiad_ukryty"], SCORE_NEIGHBOR),
    ("zwiad.szum_losowania", TABLE["zwiad"]["szum_losowania"], JITTER),
    ("zwiad.tolerancja_remisu", TABLE["zwiad"]["tolerancja_remisu"], TIE),
    ("zwiad.limit_krokow", TABLE["zwiad"]["limit_krokow"], STEP_CAP),
    ("zwiad.min_ruch_do_kroku", TABLE["zwiad"]["min_ruch_do_kroku"], MIN_STEP),
    ("stos.separator", TABLE["stos"]["separator"], SEP),
    ("stos.przyrostek_garnizon", TABLE["stos"]["przyrostek_garnizon"], GARN),
]
for key, text in TEXTS.items():
    tbl.append((f"marsz.teksty.{key}", TABLE["marsz"]["teksty"][key], text))
for name, got, want in tbl:
    check("tabela_vs_TS", got, want, name)
# tolerancja remisu: 0.0005 pojawia sie tez w `Math.abs(score - bestGain) <= 0.0005`
check("tabela_vs_TS", TABLE["zwiad"]["tolerancja_remisu"], float(rx(SC_TS, r"Math\.abs\(score - bestGain\) <= ([0-9.]+)")), "tolerancja_remisu (druga)")
# terrain-movement.json: kopia Rust == plik weba
check("terrain_movement_json", TM_RUST, TM_WEB, "data/terrain-movement.json")
# road-movement-multipliers.json == stale TS
RM_TABLE = {row["id"]: row["wartosc"] for row in json.loads((ENGINE / "data" / "derived" / "road-movement-multipliers.json").read_text(encoding="utf-8"))["wiersze"]}
check("tabela_vs_TS", RM_TABLE["ROAD_MOVE_SPEED_MULT"], ROAD_MULT, "ROAD_MOVE_SPEED_MULT")
check("tabela_vs_TS", RM_TABLE["ROAD_BRUK_MOVE_SPEED_MULT"], BRUK_MULT, "ROAD_BRUK_MOVE_SPEED_MULT")
check("tabela_vs_TS", RM_TABLE["ROAD_BRUK_MIN_MOVE_COST"], BRUK_MIN, "ROAD_BRUK_MIN_MOVE_COST")

# ---------------------------------------------------------------------------
# koszty terenu (implementacja z TS: units/setup.ts, map/road-movement.ts)
# ---------------------------------------------------------------------------
ALIAS_TM = {
    "Laka": "laka", "Rownina": "rownina", "Pustynia": "pustynia", "Wybrzeze": "plytkie_morze",
    "Wzgorza": "wzgorza", "Gory": "gory", "Morze": "morze", "Polarny": "polarny",
}
DEFAULT_COSTS = {"laka": 1, "rownina": 1, "pustynia": 1, "plytkie_morze": INF, "wzgorza": 2, "gory": INF, "morze": INF, "polarny": INF}
COSTS = dict(DEFAULT_COSTS)
for k, v in TM_WEB["costs"].items():
    COSTS[ALIAS_TM[k]] = INF if v >= THRESH else float(v)
FOREST_EXTRA = INF if TM_WEB["forestExtra"] >= THRESH else float(TM_WEB["forestExtra"])
WATER = ("morze", "plytkie_morze")


def normalize_key(raw):
    if raw is None or raw == "" or raw == "brak":
        return None
    key = LEGACY_ALIASES.get(raw, raw)
    if key in IMPROVEMENTS:
        return key
    return raw if raw in IMPROVEMENTS else None


def keys_for_hex(h):
    uls = h.get("uls")
    if uls:
        out = []
        for k in uls:
            n = normalize_key(k)
            if n is not None and n not in out:
                out.append(n)
        return out
    single = normalize_key(h.get("ul") if h.get("ul") is not None else "brak")
    return [single] if single else []


def road_mod(cost, h):
    if cost == INF:
        return INF
    keys = keys_for_hex(h)
    if BRUK_KEY in keys or h.get("ul") == BRUK_KEY:
        return js_max(BRUK_MIN, cost / BRUK_MULT)
    if DROGA_KEY in keys or h.get("ul") == DROGA_KEY:
        return cost / ROAD_MULT
    return cost


def js_max(a, b):
    if math.isnan(a) or math.isnan(b):
        return math.nan
    return a if a >= b else b


def terrain_cost(h):
    if h["rz"]:
        if h["t"] in WATER or h["t"] == "polarny":
            return INF
        return road_mod(RIVER_COST, h)
    base = COSTS.get(h["t"], 1)
    if base == INF:
        return INF
    cost = base
    if h["las"]:
        if FOREST_EXTRA == INF:
            return INF
        cost = base + FOREST_EXTRA
    return road_mod(cost, h)


def embark_cost(h):
    if h["t"] in WATER:
        return EMBARKED_WATER
    return terrain_cost(h)


def hex_dist(aq, ar, bq, br):
    return max(abs(aq - bq), abs(ar - br), abs((-aq - ar) - (-bq - br)))


def strip_dia(s):
    return re.sub("[̀-ͯ]", "", unicodedata.normalize("NFD", s)).lower()


def unit_category(typ, rola):
    n = strip_dia(typ)
    r = strip_dia(rola or "")
    if r == "morska":
        return "morska"
    if r in ("oblez-nicza", "obleznicza"):
        return "obleczenie"
    if "rydwan" in n:
        return "rydwany"
    if any(x in n for x in ("konn", "kawaler", "husar", "stepow")) or (r == "flanka" and ("kon" in n or "jezd" in n)):
        return "kawaleria"
    if r == "dystans" or any(x in n for x in ("lucz", "kusz", "procar", "luk")):
        return "lukownicy"
    return "piechota"


def matches_cel(cat, cel):
    c = strip_dia(cel)
    if c == "piechota":
        return cat == "piechota"
    if c in ("lukownicy", "dystans"):
        return cat == "lukownicy"
    if c == "kawaleria":
        return cat == "kawaleria"
    if c == "rydwany":
        return cat == "rydwany"
    if c == "morska":
        return cat == "morska"
    if c in ("obleczenie", "obleznicza"):
        return cat == "obleczenie"
    if c == "wszystko":
        return True
    return cat == c


def civ_move_mult(bonusy, typ, rola):
    cat = unit_category(typ, rola)
    s = 0.0
    for b in bonusy or []:
        mid = b.get("matrixParamId")
        if not mid or mid not in IDS_RUCH or not matches_cel(cat, b["cel"]):
            continue
        if "_teren_las" in mid:
            continue  # terrain = '' -> nie las/dzungla/gory
        # shallowSea = true w moveCostFnFor -> '_teren_plytkie_morze' dozwolone
        w = b["wartosc"]
        if isinstance(w, (int, float)) and not isinstance(w, bool):
            s += w
    return 1 + s


def can_embark(category, embarked, seafaring):
    if embarked is True:
        return True
    if category == GALERA:
        return False
    return seafaring


def cost_fn_from(spec, unit):
    """Zwraca funkcje kosztu albo None (domyslny terrain_cost)."""
    spec = decode_all(spec)
    if spec is None or spec == "terrain":
        return None
    if spec == "embark":
        return embark_cost
    assert spec["kind"] == "unit"
    return move_cost_fn_for(unit, spec["seafaring"], spec.get("bonusy"))


def move_cost_fn_for(unit, seafaring, bonusy):
    if not can_embark(unit["category"], unit.get("embarked"), seafaring):
        return None
    typ = unit.get("typeId") if unit.get("typeId") is not None else unit["category"]
    rola = unit["category"]

    def fn(h):
        base = embark_cost(h)
        if h["t"] != "plytkie_morze":
            return base
        mult = civ_move_mult(bonusy, typ, rola)
        return base / js_max(MIN_MULT, mult)

    return fn


# ---------------------------------------------------------------------------
# kopiec binarny (1:1 z setup.ts) + computeReachable / computePath / pathCost
# ---------------------------------------------------------------------------
def heap_push(heap, e):
    heap.append(e)
    i = len(heap) - 1
    while i > 0:
        p = (i - 1) >> 1
        if heap[p][0] <= heap[i][0]:
            break
        heap[p], heap[i] = heap[i], heap[p]
        i = p


def heap_pop(heap):
    if not heap:
        return None
    top = heap[0]
    last = heap.pop()
    if heap:
        heap[0] = last
        i = 0
        while True:
            l, r = 2 * i + 1, 2 * i + 2
            s = i
            if l < len(heap) and heap[l][0] < heap[s][0]:
                s = l
            if r < len(heap) and heap[r][0] < heap[s][0]:
                s = r
            if s == i:
                break
            heap[i], heap[s] = heap[s], heap[i]
            i = s
    return top


def compute_reachable(unit, hexes, occupied, fn):
    cost_of = fn or terrain_cost
    reach = []  # kolejnosc wstawiania Set
    rset = set()
    start = (unit["q"], unit["r"])
    budget = unit["ruchLeft"]
    dist = {start: 0.0}
    heap = [(0.0, unit["q"], unit["r"])]
    while heap:
        cost, cq, cr = heap_pop(heap)
        best = dist.get((cq, cr))
        if best is not None and cost > best:
            continue
        for dq, dr in NEI:
            n = (cq + dq, cr + dr)
            if n not in hexes:
                continue
            mc = cost_of(hexes[n])
            if mc == INF:
                continue
            if n in occupied:
                continue
            nc = cost + mc
            if nc <= budget:
                prev = dist.get(n)
                if prev is None or nc < prev:
                    dist[n] = nc
                    if n not in rset:
                        rset.add(n)
                        reach.append(n)
                    heap_push(heap, (nc, n[0], n[1]))
    if budget >= MIN_BUDGET:
        for dq, dr in NEI:
            n = (unit["q"] + dq, unit["r"] + dr)
            if n not in hexes:
                continue
            mc = cost_of(hexes[n])
            if mc != INF and n not in occupied:
                if n not in rset:
                    rset.add(n)
                    reach.append(n)
    if start in rset:
        rset.discard(start)
        reach = [k for k in reach if k != start]
    return reach


def is_int(x):
    return isinstance(x, (int, float)) and math.isfinite(x) and float(x).is_integer()


def compute_path(unit, hexes, dq_, dr_, occupied, fn):
    cost_of = fn or terrain_cost
    start = (unit["q"], unit["r"])
    if not (is_int(dq_) and is_int(dr_)):
        return []
    dest = (int(dq_), int(dr_))
    if dest not in hexes or dest == start:
        return []
    max_radius = hex_dist(unit["q"], unit["r"], dest[0], dest[1]) * PATH_MULT + PATH_BUFFER
    dist = {start: 0.0}
    parent = {start: None}
    heap = [(0.0, unit["q"], unit["r"])]
    found = False
    while heap:
        cost, cq, cr = heap_pop(heap)
        cur = (cq, cr)
        best = dist.get(cur)
        if best is not None and cost > best:
            continue
        if cur == dest:
            found = True
            break
        for dq, dr in NEI:
            n = (cq + dq, cr + dr)
            if hex_dist(unit["q"], unit["r"], n[0], n[1]) > max_radius:
                continue
            if n in dist and dist[n] <= cost:
                continue
            if n not in hexes:
                continue
            mc = cost_of(hexes[n])
            if n == dest:
                enter = DEST_FALLBACK if mc == INF else mc
                nc = cost + enter
                prev = dist.get(n)
                if prev is None or nc < prev:
                    dist[n] = nc
                    parent[n] = cur
                    heap_push(heap, (nc, n[0], n[1]))
                continue
            if mc == INF:
                continue
            if n in occupied:
                continue
            nc = cost + mc
            prev = dist.get(n)
            if prev is None or nc < prev:
                dist[n] = nc
                parent[n] = cur
                heap_push(heap, (nc, n[0], n[1]))
    if not found and dest not in parent:
        return []
    path = []
    cur = dest
    while cur != start:
        path.append(cur)
        prev = parent.get(cur)
        if prev is None:
            return []
        cur = prev
    path.reverse()
    return path


def path_cost(path, hexes, fn):
    cost_of = fn or terrain_cost
    total = 0.0
    for k in path:
        h = hexes.get(tuple(k))
        if h is not None:
            c = cost_of(h)
            total += 0 if c == INF else c
    return total


def visible_at(q, r, hexes, sight):
    out = []
    seen = set()
    dq = -sight
    while dq <= sight:
        dr = -sight
        while dr <= sight:
            a, b = q + dq, r + dr
            if max(abs(dq), abs(dr), abs((-q - r) - (-a - b))) <= sight:
                if is_int(a) and is_int(b) and (int(a), int(b)) in hexes and (int(a), int(b)) not in seen:
                    seen.add((int(a), int(b)))
                    out.append((int(a), int(b)))
            dr += 1
        dq += 1
    return out


# ---------------------------------------------------------------------------
# wczytanie wektorow
# ---------------------------------------------------------------------------
def load(name):
    return json.loads((VEC / name).read_text(encoding="utf-8"))


MAPS_RAW = load("maps.json")["maps"]
MAPS = []
for rows in MAPS_RAW:
    hexes = {}
    order = []
    for q, r, t, las, rz, ul, uls, w, o in rows:
        hexes[(q, r)] = {"t": t, "las": las, "rz": rz, "ul": ul, "uls": uls, "w": w, "o": o}
        order.append((q, r))
    MAPS.append((hexes, order))


def hexes_of(case):
    return MAPS[case["map"]][0]


def P(lst):
    return [tuple(x) for x in lst]


def ptl(path):
    return [[a, b] for a, b in path]


def unit_of(u):
    return decode_all(u)


def spec_fn(case, unit):
    return cost_fn_from(case.get("costFn"), unit)


# ---------------------------------------------------------------------------
# core.json
# ---------------------------------------------------------------------------
core = load("core.json")["cases"]
for c in core["terrainMoveCost"]:
    hexes, order = MAPS[c["map"]]
    check("terrainMoveCost", [terrain_cost(hexes[k]) for k in order], decode_all(c["out"]), c["map"])
for c in core["embarkMoveCost"]:
    hexes, order = MAPS[c["map"]]
    check("embarkMoveCost", [embark_cost(hexes[k]) for k in order], decode_all(c["out"]), c["map"])
for c in core["terrainCombos"]:
    h = {"t": c["t"], "las": c["las"], "rz": c["rzeka"], "ul": c["ul"], "uls": c["uls"]}
    check("terrainCombos.terrain", terrain_cost(h), dec(c["out"]), c)
    check("terrainCombos.embark", embark_cost(h), dec(c["embark"]), c)
for c in core["applyRoad"]:
    h = {"t": "laka", "las": False, "rz": False, "ul": c["ul"], "uls": c["uls"]}
    check("applyRoad", road_mod(dec(c["cost"]), h), dec(c["out"]), c)
for c in core["hexDistance"]:
    check("hexDistance", hex_dist(c["a"][0], c["a"][1], c["b"][0], c["b"][1]), c["out"], c)
for c in core["computePath"]:
    u = unit_of(c["unit"])
    fn = spec_fn(c, u)
    d = decode_all(c["dest"])
    got = compute_path(u, hexes_of(c), d[0], d[1], set(map(tuple, c["occupied"])), fn)
    check("computePath", ptl(got), c["out"], c)
for c in core["computeReachable"]:
    u = unit_of(c["unit"])
    fn = spec_fn(c, u)
    got = compute_reachable(u, hexes_of(c), set(map(tuple, c["occupied"])), fn)
    check("computeReachable", ptl(got), c["out"], c)
for c in core["pathCost"]:
    u = unit_of(c["unit"])
    fn = spec_fn(c, u)
    check("pathCost", path_cost(c["path"], hexes_of(c), fn), dec(c["out"]), c)
for c in core["computeVisibleAt"]:
    check("computeVisibleAt", ptl(visible_at(c["q"], c["r"], hexes_of(c), decode_all(c["sight"]))), c["out"], c)
for c in core["addExplored"]:
    ex = []
    for k in c["explored"]:
        if tuple(k) not in ex:
            ex.append(tuple(k))
    for k in c["visible"]:
        if tuple(k) not in ex:
            ex.append(tuple(k))
    check("addExplored", ptl(ex), c["out"], c)


def stack_group(u):
    if u.get("stackGroupId"):
        return u["stackGroupId"]
    base = f"{u['ownerId']}{SEP}{u['q']},{u['r']}"
    return base + GARN if u.get("inGarnizon") is True else base


for c in core["stackGroupIdOf"]:
    check("stackGroupIdOf", stack_group(c["unit"]), c["out"], c)
K = core["constants"]
check("constants", EMBARK_TECH, K["EMBARK_TECH"], "EMBARK_TECH")
check("constants", EMBARK_DEFENSE_MULT, dec(K["EMBARK_DEFENSE_MULT"]), "EMBARK_DEFENSE_MULT")
check("constants", EMBARKED_WATER, dec(K["EMBARKED_WATER_MOVE_COST"]), "EMBARKED_WATER_MOVE_COST")
check("constants", ROAD_MULT, dec(K["ROAD_MOVE_SPEED_MULT"]), "ROAD_MOVE_SPEED_MULT")
check("constants", BRUK_MULT, dec(K["ROAD_BRUK_MOVE_SPEED_MULT"]), "ROAD_BRUK_MOVE_SPEED_MULT")
check("constants", BRUK_MIN, dec(K["ROAD_BRUK_MIN_MOVE_COST"]), "ROAD_BRUK_MIN_MOVE_COST")

# ---------------------------------------------------------------------------
# embark.json
# ---------------------------------------------------------------------------
emb = load("embark.json")["cases"]
for c in emb["canUnitEmbark"]:
    check("canUnitEmbark", can_embark(c["category"], c.get("embarked"), c["seafaring"]), c["out"], c)
for c in emb["moveCostFnFor"]:
    u = unit_of(c["unit"])
    fn = move_cost_fn_for(u, c["seafaring"], decode_all(c.get("bonusy")))
    hexes, order = MAPS[c["map"]]
    got = None if fn is None else [fn(hexes[k]) for k in order]
    check("moveCostFnFor", got, decode_all(c["out"]), c)
for c in emb["isWaterHexAt"]:
    h = hexes_of(c).get((c["q"], c["r"]))
    check("isWaterHexAt", h is not None and h["t"] in WATER, c["out"], c)
for c in emb["nearestFreeWaterHex"]:
    hexes = hexes_of(c)
    occ = set(map(tuple, c["occupied"]))

    def free_water(q, r):
        h = hexes.get((q, r))
        return h is not None and (q, r) not in occ and h["t"] in WATER

    q, r = c["q"], c["r"]
    res = None
    for dq, dr in NEI:
        if free_water(q + dq, r + dr):
            res = [q + dq, r + dr]
            break
    if res is None:
        seen = {(q, r)}
        done = False
        for dq, dr in NEI:
            for dq2, dr2 in NEI:
                k = (q + dq + dq2, r + dr + dr2)
                if k in seen:
                    continue
                seen.add(k)
                if free_water(*k):
                    res = [k[0], k[1]]
                    done = True
                    break
            if done:
                break
    check("nearestFreeWaterHex", res, c["out"], c)
for c in emb["applyEmbarkStateAfterMove"]:
    hexes = hexes_of(c)
    units = decode_all(c["units"])
    changed = False
    for u in units:
        on_water = (u["q"], u["r"]) in hexes and hexes[(u["q"], u["r"])]["t"] in WATER
        if on_water and u.get("embarked") is not True:
            u["embarked"] = True
            changed = True
        elif not on_water and u.get("embarked") is True:
            del u["embarked"]
            changed = True
    check("applyEmbarkStateAfterMove.changed", changed, c["changed"], c)
    check("applyEmbarkStateAfterMove.units", units, decode_all(c["after"]), c)

# ---------------------------------------------------------------------------
# march.json
# ---------------------------------------------------------------------------
mar = load("march.json")["cases"]


def truncate_budget(path, budget, hexes, fn):
    cost_of = fn or terrain_cost
    if budget <= 0 or len(path) == 0:
        return []
    out = []
    for i in range(len(path)):
        if path_cost(path[: i + 1], hexes, fn) > budget:
            break
        out.append(path[i])
    if len(out) == 0 and budget >= MIN_BUDGET:
        first = path[0]
        h = hexes.get(tuple(first))
        if h is not None and cost_of(h) != INF:
            out.append(first)
    return out


def plan_turns(u, dq_, dr_, hexes, occ, per_turn_move, budget_in, fn):
    empty = {"fullPath": [], "turnStops": [], "segmentPath": [], "segmentCost": 0, "reachable": False, "stopReason": "no_path"}
    if u["q"] == dq_ and u["r"] == dr_:
        e = dict(empty)
        e["reachable"] = True
        del e["stopReason"]
        return e
    path = compute_path(u, hexes, dq_, dr_, occ, fn)
    if not path:
        return empty
    per_turn = js_max(MIN_PER_TURN, per_turn_move)
    stops = []
    acc = 0.0
    turn = 1
    for i in range(len(path)):
        step = path_cost(path[: i + 1], hexes, fn) - (path_cost(path[:i], hexes, fn) if i > 0 else 0)
        if acc + step > per_turn:
            if i > 0:
                prev = path[i - 1]
                if not stops or stops[-1]["q"] != prev[0] or stops[-1]["r"] != prev[1]:
                    stops.append({"q": prev[0], "r": prev[1], "turn": turn})
            turn += 1
            acc = step
        else:
            acc += step
    last = path[-1]
    if not stops or stops[-1]["q"] != last[0] or stops[-1]["r"] != last[1]:
        stops.append({"q": last[0], "r": last[1], "turn": turn})
    budget = per_turn if budget_in is None else budget_in
    seg = truncate_budget(path, budget, hexes, fn)
    return {
        "fullPath": [{"q": a, "r": b} for a, b in path],
        "turnStops": stops,
        "segmentPath": [{"q": a, "r": b} for a, b in seg],
        "segmentCost": path_cost(seg, hexes, fn) if seg else 0,
        "reachable": True,
    }


def should_stop(u, dest, hexes, occ, seg, budget, fn):
    if budget <= 0:
        return {"stop": True, "reason": "no_movement", "detail": TEXTS["brak_ruchu"]}
    path = compute_path(u, hexes, dest["destQ"], dest["destR"], occ, fn)
    if not path:
        return {"stop": True, "reason": "no_path", "detail": TEXTS["brak_trasy"]}
    if seg and seg[-1][0] == dest["destQ"] and seg[-1][1] == dest["destR"]:
        return {"stop": False}
    trunc = truncate_budget(path, budget, hexes, fn)
    if not trunc:
        return {"stop": True, "reason": "no_movement", "detail": TEXTS["brak_ruchu"]}
    seg_end = trunc[-1]
    idx = next((i for i, h in enumerate(path) if h == seg_end), -1)

    def is_attack(h):
        return h[0] == dest["destQ"] and h[1] == dest["destR"]

    if 0 <= idx < len(path) - 1:
        nxt = path[idx + 1]
        if nxt in occ and not is_attack(nxt):
            return {"stop": True, "reason": "obstacle", "detail": TEXTS["zablokowany_heks"]}
    full_cost = path_cost(path, hexes, fn)
    seg_cost = path_cost(trunc, hexes, fn)
    if seg_cost < budget and seg_end[0] != dest["destQ"] and seg_end[1] != dest["destR"] and len(trunc) == len(path) and full_cost <= budget:
        return {"stop": False}
    if len(trunc) < len(path) and seg_cost >= budget:
        return {"stop": False}
    if len(trunc) < len(path):
        if len(trunc) < len(path):
            nxt = path[len(trunc)]
            if nxt in occ and not is_attack(nxt):
                return {"stop": True, "reason": "obstacle", "detail": TEXTS["zablokowany_heks"]}
    return {"stop": False}


def execute_step(u, dest, hexes, occ, budget, blocked, per_turn, fn):
    plan = plan_turns(u, dest["destQ"], dest["destR"], hexes, occ, per_turn, budget, fn)
    if not plan["reachable"] or len(plan["fullPath"]) == 0:
        return {"ok": False, "movePath": [], "cost": 0, "arrived": False, "stopReason": "no_path", "stopDetail": TEXTS["brak_trasy"]}
    if budget <= 0:
        return {"ok": False, "movePath": [], "cost": 0, "arrived": False, "stopReason": "no_movement", "stopDetail": TEXTS["brak_ruchu"]}
    move = plan["segmentPath"]
    if not move:
        return {"ok": False, "movePath": [], "cost": 0, "arrived": False, "stopReason": "no_movement", "stopDetail": TEXTS["brak_ruchu"]}
    last = move[-1]
    if (last["q"], last["r"]) in blocked:
        return {"ok": False, "movePath": [], "cost": 0, "arrived": False, "stopReason": "blocked_city", "stopDetail": TEXTS["obce_miasto"]}
    arrived = last["q"] == dest["destQ"] and last["r"] == dest["destR"]
    seg = [(h["q"], h["r"]) for h in move]
    ob = should_stop(u, dest, hexes, occ, seg, budget, fn)
    res = {"ok": True, "movePath": move, "cost": plan["segmentCost"], "arrived": arrived}
    if ob["stop"] and not arrived:
        res["stopReason"] = ob["reason"]
    if ob.get("detail") is not None:
        res["stopDetail"] = ob["detail"]
    return res


for c in mar["truncatePathAtFogFrontier"]:
    vis = set(map(tuple, c["visible"]))
    out = []
    for h in c["path"]:
        if tuple(h) not in vis:
            break
        out.append(h)
    check("truncatePathAtFogFrontier", {"path": out, "fogLimited": len(out) < len(c["path"]) if c["path"] else False}, c["out"], c)
for c in mar["applyFogToPathPlan"]:
    check("applyFogToPathPlan", decode_all(c["plan"]), decode_all(c["out"]), c)  # web: zwraca plan bez zmian
for c in mar["truncatePathToBudget"]:
    u = unit_of(c["unit"])
    fn = spec_fn(c, u)
    check("truncatePathToBudget", ptl(truncate_budget(P(c["path"]), decode_all(c["budget"]), hexes_of(c), fn)), c["out"], c)
for c in mar["planPathTurns"]:
    u = unit_of(c["unit"])
    fn = spec_fn(c, u)
    d = decode_all(c["dest"])
    got = plan_turns(u, d[0], d[1], hexes_of(c), set(map(tuple, c["occupied"])), decode_all(c["perTurn"]), decode_all(c.get("budget")), fn)
    check("planPathTurns", got, decode_all(c["out"]), c)
for c in mar["shouldStopAtObstacle"]:
    u = unit_of(c["unit"])
    fn = spec_fn(c, u)
    dest = decode_all(c["dest"])
    got = should_stop(u, dest, hexes_of(c), set(map(tuple, c["occupied"])), P(c["segment"]), decode_all(c["budget"]), fn)
    want = decode_all(c["out"])
    got_n = {"stop": got["stop"]}
    if "reason" in got:
        got_n["reason"] = got["reason"]
    if "detail" in got:
        got_n["detail"] = got["detail"]
    check("shouldStopAtObstacle", got_n, want, c)
for c in mar["executeMarchStep"]:
    u = unit_of(c["unit"])
    fn = spec_fn(c, u)
    got = execute_step(u, decode_all(c["dest"]), hexes_of(c), set(map(tuple, c["occupied"])), decode_all(c["budget"]), set(map(tuple, c["blocked"])), decode_all(c["perTurn"]), fn)
    check("executeMarchStep", got, decode_all(c["out"]), c)


def is_fin(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)


def is_str(x):
    return isinstance(x, str)


def valid_auto(saved, units, owner):
    if not saved or not is_str(saved.get("leaderId")):
        return None
    u = next((x for x in units if x["id"] == saved["leaderId"]), None)
    if not u or u["ownerId"] != owner:
        return None
    if u["q"] == saved.get("destQ") and u["r"] == saved.get("destR"):
        return None
    if not is_fin(saved.get("destQ")) or not is_fin(saved.get("destR")):
        return None
    return saved


for c in mar["validateAutoMarchFromSave"]:
    got = valid_auto(decode_all(c["saved"]), decode_all(c["units"]), c["owner"])
    check("validateAutoMarchFromSave", got, decode_all(c["out"]), c)
for c in mar["plannedMarchesFromSave"]:
    units = decode_all(c["units"])
    saved = decode_all(c["saved"])
    out = []
    if c["planned"] is not None:
        for uid, dest in decode_all(c["planned"]):
            if not dest or not is_fin(dest.get("destQ")) or not is_fin(dest.get("destR")):
                continue
            u = next((x for x in units if x["id"] == uid), None)
            if not u or u["ownerId"] != c["owner"]:
                continue
            if u["q"] == dest["destQ"] and u["r"] == dest["destR"]:
                continue
            entry = {"destQ": dest["destQ"], "destR": dest["destR"]}
            if is_str(dest.get("attackUnitId")) and len(dest["attackUnitId"]) > 0:
                entry["attackUnitId"] = dest["attackUnitId"]
            out.append([uid, entry])
    legacy = valid_auto(saved, units, c["owner"])
    if legacy and not any(uid == legacy["leaderId"] for uid, _ in out):
        out.append([legacy["leaderId"], {"destQ": legacy["destQ"], "destR": legacy["destR"]}])
    check("plannedMarchesFromSave", out, decode_all(c["out"]), c)
for c in mar["plannedMarchesToSave"]:
    marches = decode_all(c["marches"])
    if not marches:
        got = {}
    else:
        pm_out = {}
        first = None
        for uid, d in marches:
            pm_out[uid] = {"destQ": d["destQ"], "destR": d["destR"], "attackUnitId": d["attackUnitId"]} if d.get("attackUnitId") else {"destQ": d["destQ"], "destR": d["destR"]}
            if first is None:
                first = {"leaderId": uid, "destQ": d["destQ"], "destR": d["destR"]}
        got = {"autoMarch": first, "plannedMarches": pm_out}
    check("plannedMarchesToSave", got, decode_all(c["out"]), c)

# ---------------------------------------------------------------------------
# rally.json
# ---------------------------------------------------------------------------
rly = load("rally.json")["cases"]


def js_number(s):
    t = s.strip(" \t\n\r\u000b\u000c ﻿                　")
    if t == "":
        return 0
    m = re.fullmatch(r"0[xX]([0-9a-fA-F]+)", t)
    if m:
        return float(int(m.group(1), 16))
    m = re.fullmatch(r"0[oO]([0-7]+)", t)
    if m:
        return float(int(m.group(1), 8))
    m = re.fullmatch(r"0[bB]([01]+)", t)
    if m:
        return float(int(m.group(1), 2))
    m = re.fullmatch(r"([+-]?)Infinity", t)
    if m:
        return -INF if m.group(1) == "-" else INF
    if re.fullmatch(r"[+-]?([0-9]+\.?[0-9]*([eE][+-]?[0-9]+)?|\.[0-9]+([eE][+-]?[0-9]+)?)", t):
        return float(t)
    return math.nan


def trunc(x):
    if not math.isfinite(x):
        return x
    t = float(math.trunc(x))
    return math.copysign(0.0, x) if t == 0 else t  # Math.trunc(-0.5) === -0


def is_integer(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) and float(x).is_integer()


def jskey(owner):
    return str(int(owner))


for c in rly["sequences"]:
    pts = []  # lista [owner, q, r] w kolejnosci wstawiania
    for op in c["ops"]:
        owner = dec(op["owner"])
        if op["op"] == "clear":
            pts = [p for p in pts if p[0] != owner]
        else:
            q, r = dec(op["q"]), dec(op["r"])
            if not is_integer(owner) or not math.isfinite(q) or not math.isfinite(r):
                continue
            owner = int(owner)
            new = [owner, trunc(q), trunc(r)]
            for i, p in enumerate(pts):
                if p[0] == owner:
                    pts[i] = new
                    break
            else:
                pts.append(new)
    state = [[p[0], {"q": p[1], "r": p[2]}] for p in pts]
    check("rally.state", state, decode_all(c["state"]), c)
    if not pts:
        to_save = None
    else:
        to_save = {}
        for owner, q, r in pts:
            if is_integer(owner) and math.isfinite(q) and math.isfinite(r):
                to_save[str(owner)] = {"q": trunc(q), "r": trunc(r)}
        to_save = to_save or None
    check("rally.toSave", to_save, decode_all(c["toSave"]), c)
for c in rly["leaders"]:
    seen = set()
    out = []
    for u in decode_all(c["units"]):
        if u["ownerId"] != c["owner"] or u.get("inGarnizon") is True:
            continue
        key = stack_group(u)
        if key in seen:
            continue
        seen.add(key)
        out.append(u["id"])
    check("rally.leaders", out, c["out"], c)
for c in rly["fromSave"]:
    if c["isNull"] or c.get("notObject"):
        check("rally.fromSave", [], c["out"], c)
        continue
    out = []
    for key, p in decode_all(c["entries"]):
        owner = js_number(key)
        if not is_integer(owner):
            continue
        if not isinstance(p, dict):
            continue
        q, r = p.get("q"), p.get("r")
        if not (is_fin(q) and is_fin(r)):
            continue
        new = [int(owner), {"q": trunc(q), "r": trunc(r)}]
        for i, e in enumerate(out):
            if e[0] == new[0]:
                out[i] = new
                break
        else:
            out.append(new)
    check("rally.fromSave", out, decode_all(c["out"]), c)
for c in rly["numberQuirks"]:
    check("rally.Number", js_number(c["key"]), dec(c["number"]), c["key"])
for c in rly["toSave"]:
    pts = decode_all(c["points"])
    if not pts:
        got = None
    else:
        got = {}
        for owner, p in pts:
            if math.isfinite(p["q"]) and math.isfinite(p["r"]):
                got[str(owner)] = {"q": trunc(p["q"]), "r": trunc(p["r"])}
        got = got or None
    check("rally.toSaveDirect", got, decode_all(c["out"]), c)

# ---------------------------------------------------------------------------
# scout.json
# ---------------------------------------------------------------------------
sco = load("scout.json")["cases"]


def is_scout(u):
    return u.get("category") == SCOUT_CAT or u.get("typeId") == SCOUT_TYPE


for c in sco["isScoutUnit"]:
    check("isScoutUnit", is_scout({"category": c["category"], "typeId": c.get("typeId")}), c["out"], c)
for c in sco["clearScoutAutoExplore"]:
    u = decode_all(c["unit"])
    res = False
    if is_scout(u) and u.get("autoExplore") is True:
        u["autoExplore"] = False
        res = True
    check("clearScoutAutoExplore.out", res, c["out"], c)
    check("clearScoutAutoExplore.unit", u, decode_all(c["after"]), c)


def marginal(fr, to, explored_set, hexes, sight):
    fv = set(visible_at(fr[0], fr[1], hexes, sight))
    tv = visible_at(to[0], to[1], hexes, sight)
    return sum(1 for k in tv if k not in explored_set and k not in fv)


for c in sco["scoreMarginalReveal"]:
    check("scoreMarginalReveal", marginal(c["from"], c["to"], set(map(tuple, c["explored"])), hexes_of(c), decode_all(c["sight"])), c["out"], c)
for c in sco["scoreHexForExplore"]:
    ex = set(map(tuple, c["explored"]))
    hexes = hexes_of(c)
    score = 0
    for k in visible_at(c["q"], c["r"], hexes, decode_all(c["sight"])):
        if k not in ex:
            score += SCORE_UNEXPLORED
    for dq, dr in NEI:
        k = (c["q"] + dq, c["r"] + dr)
        if k in hexes and k not in ex:
            score += SCORE_NEIGHBOR
    check("scoreHexForExplore", score, c["out"], c)


class Seq:
    def __init__(self, seq):
        self.seq = decode_all(seq)
        self.i = 0

    def __call__(self):
        v = self.seq[self.i % len(self.seq)]
        self.i += 1
        return v


def js_floor(x):
    return float(math.floor(x))


def pick_village(u, hexes, explored, occ, sight):
    visible = set(visible_at(u["q"], u["r"], hexes, sight))
    reach = set(compute_reachable(u, hexes, set(occ), None))
    best_len = INF
    best = None
    for k in explored:
        h = hexes.get(k)
        if h is None or not h["w"]:
            continue
        if h["o"]:
            continue
        if k not in visible and k not in reach:
            continue
        path = compute_path(u, hexes, k[0], k[1], set(occ), None)
        if not path:
            continue
        if len(path) < best_len:
            best_len = len(path)
            best = k
    return best


def pick_step(u, hexes, explored, occ, sight, rng):
    reach = compute_reachable(u, hexes, set(occ), None)
    reach = [k for k in reach if k != (u["q"], u["r"])]
    if not reach:
        return None
    positive = []
    zero = []
    exs = set(explored)
    for k in reach:
        path = compute_path(u, hexes, k[0], k[1], set(occ), None)
        if len(path) != 1:
            continue
        gain = marginal((u["q"], u["r"]), k, exs, hexes, sight)
        if gain > 0:
            positive.append((k, gain))
        elif gain == 0:
            zero.append(k)
    pool = positive if positive else [(k, 0) for k in zero]
    if not pool:
        return None
    best_gain = -INF
    cands = []
    for k, gain in pool:
        score = gain + rng() * JITTER
        if score > best_gain + TIE:
            best_gain = score
            cands = [k]
        elif abs(score - best_gain) <= TIE:
            cands.append(k)
    if not cands:
        return None
    idx = js_floor(rng() * len(cands))
    if 0 <= idx < len(cands):
        return cands[int(idx)]
    return None


def pick_target(u, hexes, explored, occ, sight, rng):
    v = pick_village(u, hexes, explored, occ, sight)
    if v:
        return v
    return pick_step(u, hexes, explored, occ, sight, rng)


for c in sco["pickScoutExploreTarget"]:
    rng = Seq(c["rng"])
    u = unit_of(c["unit"])
    occ = set(map(tuple, c["occupied"]))
    got = pick_target(u, hexes_of(c), [tuple(k) for k in c["explored"]], occ, decode_all(c["sight"]), rng)
    check("pickScoutExploreTarget", list(got) if got else None, c["out"], c)
    check("pickScoutExploreTarget.rngCalls", rng.i, c["rngCalls"], c)


def deduct(u, cost):
    if not math.isfinite(cost) or cost <= 0:
        return
    if cost <= u["ruchLeft"]:
        u["ruchLeft"] -= cost
    elif u["ruchLeft"] >= MIN_STEP:
        u["ruchLeft"] = 0


def advance(u, hexes, explored, all_units, sight, rng, cb):
    if not is_scout(u):
        return False, 0
    if u["ruchLeft"] <= 0 or u.get("inGarnizon") or u.get("oblegaCityId"):
        return False, 0
    working = list(dict.fromkeys(explored))
    for k in visible_at(u["q"], u["r"], hexes, sight):
        if k not in working:
            working.append(k)
    steps = 0
    moved = False
    while u["ruchLeft"] > 0:
        occ = {(x["q"], x["r"]) for x in all_units if x["id"] != u["id"]}
        target = pick_target(u, hexes, working, occ, sight, rng)
        if not target:
            break
        path = compute_path(u, hexes, target[0], target[1], occ, None)
        if not path:
            break
        step = path[0]
        h = hexes.get(step)
        if h is None:
            break
        cost = terrain_cost(h)
        if cost == INF:
            break
        if cost > u["ruchLeft"] and u["ruchLeft"] < MIN_STEP:
            break
        u["q"], u["r"] = step
        deduct(u, cost)
        for k in visible_at(u["q"], u["r"], hexes, sight):
            if k not in working:
                working.append(k)
        steps += 1
        moved = True
        cb([u["id"], u["q"], u["r"], u["ruchLeft"]])
        if steps > STEP_CAP:
            break
    return moved, steps


for c in sco["advanceScoutAutoExplore"]:
    rng = Seq(c["rng"])
    u = unit_of(c["unit"])
    units = [u] + decode_all(c["others"])
    seen = []
    moved, steps = advance(u, hexes_of(c), [tuple(k) for k in c["explored"]], units, decode_all(c["sight"]), rng, seen.append)
    want = decode_all(c["out"])
    check("advanceScoutAutoExplore", {"moved": moved, "steps": steps, "unit": u, "callbacks": seen, "rngCalls": rng.i}, want, c)
for c in sco["runScoutsAutoExplore"]:
    rng = Seq(c["rng"])
    units = decode_all(c["units"])
    hexes = hexes_of(c)
    explored = [tuple(k) for k in c["explored"]]
    sights = c["sights"]
    seen = []
    moved_ids = []
    total = 0
    for u in units:
        if u["ownerId"] != c["owner"]:
            continue
        if not is_scout(u):
            continue
        if u.get("autoExplore") is not True:
            continue
        if u.get("sentry") is True:
            continue
        sight = sights["perId"].get(u["id"], sights["default"])
        m, s = advance(u, hexes, explored, units, sight, rng, seen.append)
        if m:
            moved_ids.append(u["id"])
            total += s
    check("runScoutsAutoExplore", {"movedUnitIds": moved_ids, "totalSteps": total, "units": units, "callbacks": seen, "rngCalls": rng.i}, decode_all(c["out"]), c)

# ---------------------------------------------------------------------------
# raport
# ---------------------------------------------------------------------------
total_cases = sum(checked.values())
for name in sorted(checked):
    print(f"{name}: {checked[name]}")
print(f"PRZYPADKOW: {total_cases}")
print(f"ROZBIEZNOSCI: {len(mismatches)}")
for name, ctx, got, want in mismatches[:15]:
    print("ROZBIEZNOSC", name, ctx, "got=", str(got)[:200], "want=", str(want)[:200])
sys.exit(0 if not mismatches else 1)
