#!/usr/bin/env python3
"""Niezalezny weryfikator wektorow P6.1B.

NIE uzywa kodu TypeScript, generatora ani Rust. Implementuje semantyke weba od nowa w Pythonie
(na podstawie zrodla gra/src/game/playerState.ts i difficulty-cost.ts z git archive edb8fb56),
wykonuje te same skrypty, co generator, i porownuje z `web-vectors.json`. Dodatkowo:
- stale z zrodla weba (PIENIADZ_MNOZNIK, RESEARCH_QUEUE_MAX, BRAK_PREREQ, NUMER_EPOKI, domyslny
  createPlayerState) sa wyciagane regexem z pliku TS i porownywane z `player-state-params.json`,
- `research-costs.json` jest porownywany z wlasna formula `scaledResearchCost` (wszystkie 15 kolumn),
- bramki (`researchGatesMet`, research.ts, P6.17) sa DANYMI WEJSCIOWYMI (wynik weba z gateMaps).

Uzycie:
  python3 -I verify-p61b-web-vectors.py <WEB_ROOT> <WEB_VECTORS_JSON> <RUST_ENGINE_DIR>
Wyjscie: 0 = zgodnosc 100%, 1 = co najmniej jedna rozbieznosc.
"""
import json
import math
import os
import re
import sys
import unicodedata

ERRORS = []
CHECKS = {}


def check(group, cond, msg):
    CHECKS[group] = CHECKS.get(group, 0) + 1
    if not cond:
        ERRORS.append(f"[{group}] {msg}")


# ---------------------------------------------------------------------------
# JS-izmy zaimplementowane niezaleznie
# ---------------------------------------------------------------------------
def js_ws(c):
    o = ord(c)
    return o in (9, 10, 11, 12, 13, 0xFEFF, 0x2028, 0x2029) or unicodedata.category(c) == "Zs"


def js_trim(s):
    a, b = 0, len(s)
    while a < b and js_ws(s[a]):
        a += 1
    while b > a and js_ws(s[b - 1]):
        b -= 1
    return s[a:b]


def u16(s):
    return s.encode("utf-16-be")  # kolejnosc bajtow BE == kolejnosc jednostek UTF-16


def js_round(x):
    return math.floor(x + 0.5)


def canon(ch):
    """ECMAScript Canonicalize (regex /i bez flagi u)."""
    up = ch.upper()
    if len(up) != 1:
        return ch
    if ord(ch) >= 128 and ord(up) < 128:
        return ch
    return up


def js_regex_i_contains(text, needle):
    t = [canon(c) for c in text]
    n = [canon(c) for c in needle]
    return any(t[i : i + len(n)] == n for i in range(len(t) - len(n) + 1))


# ---------------------------------------------------------------------------
# Stale ze zrodla weba (regex po pliku TS)
# ---------------------------------------------------------------------------
def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def load_web_constants(web_root):
    src = read(os.path.join(web_root, "gra/src/game/playerState.ts"))
    dc = read(os.path.join(web_root, "gra/src/game/difficulty-cost.ts"))
    tt = read(os.path.join(web_root, "gra/src/game/tech-tempo.ts"))
    rs = read(os.path.join(web_root, "gra/src/game/r-stawki-strojenie.ts"))
    c = {}
    c["PIENIADZ_MNOZNIK"] = int(re.search(r"export const PIENIADZ_MNOZNIK = (\d+);", src).group(1))
    c["RESEARCH_QUEUE_MAX"] = int(re.search(r"export const RESEARCH_QUEUE_MAX = (\d+);", src).group(1))
    brak = re.search(r"const BRAK_PREREQ = new Set\(\[(.*?)\]\);", src).group(1)
    c["BRAK_PREREQ"] = [json.loads('"' + s.replace('"', '\\"') + '"') if "\\u" in s else s for s in re.findall(r"'((?:[^'\\]|\\.)*)'", brak)]
    epoki = re.search(r"const NUMER_EPOKI[^=]*= \{(.*?)\};", src, re.S).group(1)
    c["NUMER_EPOKI"] = {k: int(v) for k, v in re.findall(r"(\w+): (\d+)", epoki)}
    diak = re.search(r"const PL_DIAKRYTYKI_EPOKA[^=]*= \{(.*?)\};", src, re.S).group(1)
    c["DIAK"] = dict(re.findall(r"'(.)': '(.)'", diak))
    body = re.search(r"export function createPlayerState\(\): PlayerState \{\s*return \{(.*?)\n  \};", src, re.S).group(1)
    d = {}
    for k, v in re.findall(r"^\s*(\w+): ([^,]+?),", body, re.M):
        d[k] = v.strip()
    c["DEFAULTS"] = d
    c["TEMPO"] = {k: float(v) for k, v in re.findall(r"(\w+): ([\d.]+),", re.search(r"export const TEMPO_GRY = \{(.*?)\} as const;", tt, re.S).group(1))}
    c["GLOBAL_MULT"] = int(re.search(r"export const R_STAWKI_KOSZT_MULT = (\d+);", rs).group(1))
    c["FALA2_MULT"] = int(re.search(r"export const R_STAWKI_FALA2_MULT = (\d+);", rs).group(1))
    assert "GLOBAL_RESEARCH_COST_MULT = R_STAWKI_KOSZT_MULT" in dc
    return c


def norm_research_era(epoka):
    if not epoka:
        return "kamien"
    n = unicodedata.normalize("NFD", epoka)
    n = "".join(ch for ch in n if not (0x300 <= ord(ch) <= 0x36F))
    return js_trim(n).lower()


def scaled_cost(C, base, tempo, owner_is_player, difficulty, epoka):
    after_tempo = max(1, js_round(base * C["TEMPO"][tempo]))
    g = max(1, js_round(after_tempo * C["GLOBAL_MULT"]))
    if norm_research_era(epoka) in ("braz", "zelazo"):
        g = max(1, js_round(g * C["FALA2_MULT"]))
    if difficulty == "normal":
        mult = 1
    elif difficulty == "easy":
        mult = 1 if owner_is_player else 2
    else:
        mult = 2 if owner_is_player else 1
    return max(1, js_round(g * mult))


# ---------------------------------------------------------------------------
# Reimplementacja playerState.ts
# ---------------------------------------------------------------------------
class Rules:
    def __init__(self, C):
        self.C = C
        self.brak = set(C["BRAK_PREREQ"])
        self.epoki = C["NUMER_EPOKI"]
        self.diak = C["DIAK"]

    @staticmethod
    def tid(t):
        return js_trim(t["Technologia"])

    @staticmethod
    def tcost(t):
        return t["Koszt nauki"]

    def parse_prereqs(self, t):
        raw = js_trim(t["Wymaga (prereq)"])
        if raw == "" or raw.lower() in self.brak:
            return []
        out = []
        for part in raw.split("+"):
            s = js_trim(part)
            if len(s) > 0 and s.lower() not in self.brak:
                out.append(s)
        return out

    def prereqs_met(self, t, done):
        return all(p in done for p in self.parse_prereqs(t))

    def epoch_number(self, t):
        norm = js_trim(t["Epoka"]).lower()
        norm = "".join(self.diak.get(c, c) for c in norm)
        return self.epoki.get(norm)

    def epoch_gate(self, t, techs, done):
        e = self.epoch_number(t)
        if e is None:
            return True
        for o in techs:
            oe = self.epoch_number(o)
            if oe is None:
                continue
            if oe < e and self.tid(o) not in done:
                return False
        return True

    def tier_gate(self, t, techs, done):
        e = self.epoch_number(t)
        p = t.get("Poziom")
        if e is None or not isinstance(p, int):
            return True
        for o in techs:
            if self.epoch_number(o) != e:
                continue
            op = o.get("Poziom")
            if not isinstance(op, int):
                continue
            if op < p and self.tid(o) not in done:
                return False
        return True

    def available(self, techs, done, gate):
        res = []
        for t in techs:
            i = self.tid(t)
            if i == "" or i in done:
                continue
            if not self.prereqs_met(t, done):
                continue
            if not self.epoch_gate(t, techs, done):
                continue
            if not self.tier_gate(t, techs, done):
                continue
            if gate is not None and not gate(t):
                continue
            res.append(t)
        return res

    def cheapest(self, techs, done, gate):
        av = self.available(techs, done, gate)
        if not av:
            return None
        best = None
        for t in av:
            if best is None:
                best = t
                continue
            dc = self.tcost(t) - self.tcost(best)
            if dc < 0 or (dc == 0 and u16(self.tid(t)) < u16(self.tid(best))):
                best = t
        return self.tid(best)

    def era_target(self, t):
        v = t.get("awansDoEpoki")
        return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None

    def is_money(self, t):
        if self.tid(t).lower() == "waluta":
            return True
        notes = (t.get("Uwagi") or "") + " " + (t.get("Odblokowuje budynek") or "")
        return js_regex_i_contains(notes, "pieniądz")


def new_state(C):
    d = C["DEFAULTS"]
    unq = lambda v: v.strip("'")
    return {
        "skarbiec": float(d["skarbiec"]),
        "nauka": float(d["nauka"]),
        "zbadane": set(),
        "badana": None,
        "target": None,
        "queue": [],
        "era": int(d["era"]),
        "pm": int(d["pieniadzMnoznik"]),
        "tempo": unq(d["tempoGry"]),
        "building": unq(d["buildingCostPace"]),
        "kosztJ": unq(d["kosztJednostekPace"]),
        "wzrost": unq(d["wzrostLudnosciPace"]),
        "ruch": unq(d["ruchSwiataPace"]),
        "civ": unq(d["civType"]),
        "rakieta": d["rakietaWystrzelona"] == "true",
    }


def research_step(R, st, techs, gate, diff):
    C = R.C
    completed = []
    by_id = {}
    for t in techs:
        i = R.tid(t)
        if i != "":
            by_id[i] = t

    def allowed(i):
        d = by_id.get(i)
        if d is None or i in st["zbadane"]:
            return False
        if not R.prereqs_met(d, st["zbadane"]):
            return False
        if not R.epoch_gate(d, techs, st["zbadane"]):
            return False
        if not R.tier_gate(d, techs, st["zbadane"]):
            return False
        if gate is not None and not gate(d):
            return False
        return True

    if st["target"] is not None and allowed(st["target"]):
        st["badana"] = st["target"]
    elif st["badana"] is None or st["badana"] not in by_id or not allowed(st["badana"]):
        av = R.available(techs, st["zbadane"], gate)
        st["badana"] = R.tid(av[0]) if av else None

    max_iters = len(techs) + 1
    iters = 0
    while st["badana"] is not None and iters < max_iters:
        iters += 1
        d = by_id.get(st["badana"])
        if d is None:
            st["badana"] = R.cheapest(techs, st["zbadane"], gate)
            continue
        cost = scaled_cost(C, R.tcost(d), st["tempo"], True, diff, d["Epoka"])
        if st["nauka"] < cost:
            break
        if gate is not None and not gate(d):
            break
        st["nauka"] -= cost
        st["zbadane"].add(st["badana"])
        tgt = R.era_target(d)
        money = R.is_money(d)
        if tgt is not None:
            st["era"] = max(st["era"], tgt)
        if money:
            st["pm"] = C["PIENIADZ_MNOZNIK"]
        completed.append({"id": st["badana"], "koszt": cost, "awansEpoki": tgt is not None, "pieniadz": money, "era": st["era"]})
        st["target"] = None
        while st["queue"]:
            q = st["queue"].pop(0)
            if q in st["zbadane"]:
                continue
            if not allowed(q):
                continue
            st["target"] = q
            break
        if st["target"] is not None:
            st["badana"] = st["target"]
        else:
            av = R.available(techs, st["zbadane"], gate)
            st["badana"] = R.tid(av[0]) if av else None
    return {"completed": completed, "badana": st["badana"]}


def find_tech(techs, i):
    for t in techs:
        if js_trim(t["Technologia"]) == i:
            return t
    return None


def set_target(R, st, i, techs, gate):
    d = find_tech(techs, i)
    if d is None or i in st["zbadane"]:
        return False
    if not R.prereqs_met(d, st["zbadane"]):
        return False
    if not R.epoch_gate(d, techs, st["zbadane"]) or not R.tier_gate(d, techs, st["zbadane"]):
        return False
    if gate is not None and not gate(d):
        return False
    st["target"] = i
    return True


def plan_len(st):
    return (1 if st["target"] is not None else 0) + len(st["queue"])


def enqueue(R, st, i, techs):
    if find_tech(techs, i) is None or i in st["zbadane"]:
        return False
    if st["target"] == i or i in st["queue"]:
        return False
    if plan_len(st) >= R.C["RESEARCH_QUEUE_MAX"]:
        return False
    if st["target"] is None:
        st["target"] = i
    else:
        st["queue"].append(i)
    return True


def dequeue(st, i):
    if i in st["queue"]:
        st["queue"].remove(i)
        return True
    if st["target"] == i:
        st["target"] = st["queue"].pop(0) if st["queue"] else None
        return True
    return False


def plan(st):
    p = []
    if st["target"] is not None:
        p.append(st["target"])
    return p + list(st["queue"])


def get_state(R, st, techs, npt, diff):
    tid = st["target"] if st["target"] is not None else st["badana"]
    d = find_tech(techs, tid) if tid else None  # '' i None sa falsy
    kc = scaled_cost(R.C, R.tcost(d), st["tempo"], True, diff, d["Epoka"]) if d else 0
    pula = st["nauka"]
    pf = 0.0
    if kc > 0:
        pf = min(1.0, pula / kc)
    tl = None
    if d and npt > 0:
        rem = kc - pula
        tl = 0.0 if rem <= 0 else float(math.ceil(rem / npt))
    return {"pula": pula, "targetId": tid, "kosztCelu": kc, "postep": pf, "turnsLeft": tl}


def apply_patch(st, f):
    keymap = {"tempoGry": "tempo", "era": "era", "badana": "badana", "playerResearchTargetId": "target"}
    for k, v in f.items():
        if k == "zbadane":
            st["zbadane"] = set(v)
        elif k == "researchQueue":
            st["queue"] = list(v)
        else:
            st[keymap[k]] = v


def cmp_state(ctx, st, exp):
    check("state", st["skarbiec"] == float(exp["skarbiec"]), f"{ctx} skarbiec")
    check("state", st["nauka"] == float(exp["nauka"]), f"{ctx} nauka {st['nauka']!r} != {exp['nauka']}")
    check("state", st["badana"] == exp["badana"], f"{ctx} badana")
    check("state", st["target"] == exp["target"], f"{ctx} target")
    check("state", st["queue"] == exp["queue"], f"{ctx} queue")
    check("state", st["era"] == exp["era"], f"{ctx} era")
    check("state", st["pm"] == exp["pieniadzMnoznik"], f"{ctx} pm")
    check("state", st["tempo"] == exp["tempoGry"], f"{ctx} tempo")
    check("state", len(st["zbadane"]) == exp["zbadaneCount"], f"{ctx} zbadane count")
    if "zbadane" in exp:
        check("state", sorted(st["zbadane"]) == exp["zbadane"], f"{ctx} zbadane")


def run_scenarios(R, V):
    for sc in V["scenarios"]:
        techs = V["techsets"][sc["techset"]]
        gate = None
        if sc.get("gate"):
            gm = V["gateMaps"][sc["gate"]][sc["techset"]]
            gate = lambda t, gm=gm: gm[t["Technologia"]]
        states = {}

        def seat(i):
            if i not in states:
                states[i] = new_state(R.C)
            return states[i]

        for i in sc.get("seats", ["0"]):
            seat(i)
        for i, f in sc.get("init", {}).items():
            apply_patch(seat(i), f)
        for n, (op, exp) in enumerate(zip(sc["ops"], sc["expected"])):
            ctx = f"{sc['name']} op#{n} {op['op']}"
            st = seat(op.get("s", "0"))
            diff = op.get("d", sc.get("difficulty", "normal"))
            ret = exp["ret"]
            k = op["op"]
            if k == "addNauka":
                st["nauka"] += float(op["n"])
            elif k == "patch":
                apply_patch(st, op["f"])
            elif k == "step":
                r = research_step(R, st, techs, gate, diff)
                check("step", r["completed"] == ret["completed"], f"{ctx} completed {r['completed']} != {ret['completed']}")
                check("step", r["badana"] == ret["badana"], f"{ctx} badana")
            elif k == "set":
                check("set", set_target(R, st, op["id"], techs, gate) == ret, ctx)
            elif k == "enqueue":
                check("enqueue", enqueue(R, st, op["id"], techs) == ret, ctx)
            elif k == "dequeue":
                check("dequeue", dequeue(st, op["id"]) == ret, ctx)
            elif k == "clear":
                st["queue"] = []
            elif k == "plan":
                check("plan", plan(st) == ret, ctx)
            elif k == "planLength":
                check("plan", plan_len(st) == ret, ctx)
            elif k == "getState":
                g = get_state(R, st, techs, float(op["npt"]), diff)
                check("getState", g["pula"] == float(ret["pula"]), f"{ctx} pula")
                check("getState", g["targetId"] == ret["targetId"], f"{ctx} targetId")
                check("getState", g["kosztCelu"] == ret["kosztCelu"], f"{ctx} kosztCelu")
                check("getState", g["postep"] == float(ret["postep"]), f"{ctx} postep {g['postep']!r} != {ret['postep']}")
                want_tl = None if ret["turnsLeft"] is None else float(ret["turnsLeft"])
                check("getState", g["turnsLeft"] == want_tl, f"{ctx} turnsLeft {g['turnsLeft']!r} != {want_tl!r}")
            else:
                raise SystemExit(f"nieznana operacja {k}")
            cmp_state(ctx, st, exp["state"])


def run_pure(R, V):
    for row in V["prereqs"]:
        t = {"Technologia": "P", "Wymaga (prereq)": row["raw"]}
        check("prereqs", R.parse_prereqs(t) == row["parsed"], f"parsePrereqs({row['raw']!r}) {R.parse_prereqs(t)} != {row['parsed']}")
        for s, want in zip(V["researchedSets"], row["met"]):
            check("prereqs", R.prereqs_met(t, set(s)) == want, f"prereqsMet({row['raw']!r},{s})")
    for row in V["epochNumbers"]:
        check("epoch", R.epoch_number({"Epoka": row["raw"]}) == row["n"], f"epochNumber({row['raw']!r})")
    syn = V["pure"]["synTechs"]
    for ds in V["pure"]["doneSets"]:
        done = set(ds["done"])
        for i, t in enumerate(syn):
            check("gates", R.prereqs_met(t, done) == ds["prereqsMet"][i], f"prereqsMet #{i} {done}")
            check("gates", R.epoch_gate(t, syn, done) == ds["epochGate"][i], f"epochGate #{i} {done}")
            check("gates", R.tier_gate(t, syn, done) == ds["tierGate"][i], f"tierGate #{i} {done}")
        for gname, want in ds["perGate"].items():
            gate = None
            if gname != "none":
                gm = V["gateMaps"][gname]["synA"]
                gate = lambda t, gm=gm: gm[t["Technologia"]]
            av = [syn.index(t) for t in R.available(syn, done, gate)]
            # indexOf w JS zwraca PIERWSZY indeks; duplikaty nazw nie sa tu identyczne obiektowo
            check("gates", av == want["available"], f"available {gname} {done}: {av} != {want['available']}")
            check("gates", R.cheapest(syn, done, gate) == want["cheapest"], f"cheapest {gname} {done}")
    tie = V["pure"]["tie"]
    check("tie", R.cheapest(tie["set"], set(), None) == tie["cheapest"], "tie cheapest")
    for key, rows in (("rowsSynA", V["techsets"]["synA"]), ("rowsSynMoney", V["techsets"]["synMoney"])):
        for t, e in zip(rows, V["pure"][key]):
            ctx = f"{key} {t['Technologia']!r}"
            check("rows", R.tcost(t) == e["techCost"], ctx + " techCost")
            tgt = R.era_target(t)
            check("rows", tgt == e["eraAdvanceTarget"], ctx + " eraAdvanceTarget")
            check("rows", (tgt is not None) == e["isEraAdvanceTech"], ctx + " isEraAdvanceTech")
            check("rows", R.is_money(t) == e["isMoneyTech"], ctx + " isMoneyTech")
            check("rows", R.epoch_number(t) == e["epochNumber"], ctx + " epochNumber")
            check("rows", R.parse_prereqs(t) == e["parsePrereqs"], ctx + " parsePrereqs")


def run_costs_and_tables(C, V, engine):
    # koszty z wektorow weba vs wlasna formula
    tech = json.load(open(os.path.join(engine, "data/tech.json"), encoding="utf-8"))["technologie"]
    for tempo, bydiff in V["costs"].items():
        for diff, byname in bydiff.items():
            for t in tech:
                want = scaled_cost(C, t["Koszt nauki"], tempo, True, diff, t["Epoka"])
                check("costs", byname[t["Technologia"]] == want, f"cost {t['Technologia']} {tempo} {diff}")
    # tabela silnika research-costs.json vs formula (wszystkie osie, takze AI)
    table = json.load(open(os.path.join(engine, "data/derived/research-costs.json"), encoding="utf-8"))
    modes = {
        "normalny": ("normal", True),
        "latwy_gracz": ("easy", True),
        "latwy_ai": ("easy", False),
        "trudny_gracz": ("hard", True),
        "trudny_ai": ("hard", False),
    }
    by = {r["technologia"]: r for r in table["wiersze"]}
    check("table", len(by) == len(tech), "liczba wierszy research-costs.json")
    for t in tech:
        row = by[t["Technologia"]]
        check("table", row["koszt_bazowy"] == t["Koszt nauki"], f"koszt_bazowy {t['Technologia']}")
        check("table", row["epoka"] == t["Epoka"], f"epoka {t['Technologia']}")
        for w in row["wartosci"]:
            d, player = modes[w["tryb"]]
            want = scaled_cost(C, t["Koszt nauki"], w["tempo"], player, d, t["Epoka"])
            check("table", w["koszt"] == want, f"research-costs {t['Technologia']} {w['tempo']} {w['tryb']}: {w['koszt']} != {want}")
        check("table", len(row["wartosci"]) == 15, f"15 wartosci {t['Technologia']}")


def run_params(C, engine):
    p = json.load(open(os.path.join(engine, "data/derived/player-state-params.json"), encoding="utf-8"))
    check("params", p["pieniadz_mnoznik"] == C["PIENIADZ_MNOZNIK"], "pieniadz_mnoznik")
    check("params", p["research_queue_max"] == C["RESEARCH_QUEUE_MAX"], "research_queue_max")
    check("params", p["brak_prereq"] == C["BRAK_PREREQ"], f"brak_prereq {p['brak_prereq']} != {C['BRAK_PREREQ']}")
    check("params", p["numer_epoki"] == C["NUMER_EPOKI"], "numer_epoki")
    check("params", p["diakrytyki_epoki"] == C["DIAK"], "diakrytyki_epoki")
    s = p["stan_poczatkowy"]
    d = C["DEFAULTS"]
    unq = lambda v: v.strip("'")
    check("params", s["skarbiec"] == float(d["skarbiec"]) and s["nauka"] == float(d["nauka"]), "skarbiec/nauka")
    check("params", s["era"] == int(d["era"]), "era")
    check("params", s["pieniadz_mnoznik"] == int(d["pieniadzMnoznik"]), "pieniadzMnoznik start")
    check("params", s["tempo_gry"] == unq(d["tempoGry"]), "tempoGry")
    check("params", s["building_cost_pace"] == unq(d["buildingCostPace"]), "buildingCostPace")
    check("params", s["koszt_jednostek_pace"] == unq(d["kosztJednostekPace"]), "kosztJednostekPace")
    check("params", s["wzrost_ludnosci_pace"] == unq(d["wzrostLudnosciPace"]), "wzrostLudnosciPace")
    check("params", s["ruch_swiata_pace"] == unq(d["ruchSwiataPace"]), "ruchSwiataPace")
    check("params", s["civ_type"] == unq(d["civType"]), "civType")
    check("params", s["rakieta_wystrzelona"] is False and d["rakietaWystrzelona"] == "false", "rakieta")
    check("params", p["technologia_pieniadza"] == "waluta", "technologia_pieniadza")
    check("params", p["uwagi_pieniadza_igla"] == "pieniądz", "igla")
    check("params", p["tryb_badan_gracza"] == {"easy": "latwy_gracz", "normal": "normalny", "hard": "trudny_gracz"}, "tryb")


def main():
    if len(sys.argv) != 4:
        print(__doc__)
        return 2
    web_root, vec_path, engine = sys.argv[1:4]
    V = json.load(open(vec_path, encoding="utf-8"))
    C = load_web_constants(web_root)
    R = Rules(C)
    check("constants", V["constants"]["PIENIADZ_MNOZNIK"] == C["PIENIADZ_MNOZNIK"], "PIENIADZ_MNOZNIK web")
    check("constants", V["constants"]["RESEARCH_QUEUE_MAX"] == C["RESEARCH_QUEUE_MAX"], "RESEARCH_QUEUE_MAX web")
    ds = V["defaults"]["state"]
    st = new_state(C)
    check("defaults", st["tempo"] == ds["tempoGry"] and st["era"] == ds["era"] and st["pm"] == ds["pieniadzMnoznik"], "defaults")
    check("defaults", (st["building"], st["kosztJ"], st["wzrost"], st["ruch"], st["civ"]) == (ds["building"], ds["kosztJednostek"], ds["wzrost"], ds["ruch"], ds["civType"]), "defaults pace")
    run_params(C, engine)
    run_costs_and_tables(C, V, engine)
    run_pure(R, V)
    run_scenarios(R, V)
    total = sum(CHECKS.values())
    for g in sorted(CHECKS):
        print(f"  {g}: {CHECKS[g]}")
    for e in ERRORS[:40]:
        print("ROZBIEZNOSC", e)
    print(f"RAZEM: {total} sprawdzen, rozbieznosci: {len(ERRORS)}")
    return 1 if ERRORS else 0


if __name__ == "__main__":
    sys.exit(main())
