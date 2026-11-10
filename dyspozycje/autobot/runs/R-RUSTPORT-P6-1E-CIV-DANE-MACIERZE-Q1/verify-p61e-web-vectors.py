#!/usr/bin/env python3
"""Niezalezny weryfikator wektorow P6.1E (bez TS, bez generatora JS, bez Rust).

Reimplementuje W PYTHONIE semantyke civ-matrix.ts, civ-matrix-semantic.ts, civ-ai-data.ts,
civ-roster.ts i civ-names.ts (+ city-names-pool.ts), czytajac KOD TS jako specyfikacje
(nie wykonujac go), i porownuje z wektorami `web-vectors.json` wygenerowanymi z URUCHOMIONEGO
weba. Dodatkowo:
- tabele silnika `data/derived/civ-matrix-params.json` i `civ-matrix-semantic.json` sa
  porownywane z literalami wyciagnietymi regexem z plikow TS (zbiory statusow, dowody
  konsumentow, slownik etykiet, ziarno 7919, kroki trudnosci, tolerancje pasm, teksty PL),
- dane (civ-matrix, civs, civ-ai, diplomacy, city-names-pools) wczytywane sa z WEB_ROOT i
  sprawdzane odciskiem FNV-1a zapisanym w wektorach,
- scenariusze z mutacjami danych sa odtwarzane operacjami na slownikach Pythona.

Uzycie: python3 -I verify-p61e-web-vectors.py <WEB_ROOT> <VECTORS_JSON> <ENGINE_DERIVED_DIR>
Kod wyjscia: 0 gdy 0 rozbieznosci.
"""
import copy
import json
import math
import re
import struct
import sys
from decimal import ROUND_HALF_UP, Decimal, getcontext

getcontext().prec = 400

WEB_ROOT, VEC_PATH, DERIVED = sys.argv[1], sys.argv[2], sys.argv[3]

checks = 0
diffs = []


def check(cond, msg):
    global checks
    checks += 1
    if not cond:
        diffs.append(msg)
        if len(diffs) <= 60:
            print("ROZBIEZNOSC:", msg)


def fnv1a64(data):
    h = 0xCBF29CE484222325
    for b in data:
        h ^= b
        h = (h * 0x100000001B3) & 0xFFFFFFFFFFFFFFFF
    return format(h, "016x")


def read(path):
    with open(path, "rb") as f:
        return f.read()


V = json.loads(read(VEC_PATH).decode("utf8"))
DATA = WEB_ROOT + "/gra/data/"
SRC = WEB_ROOT + "/gra/src/game/"
TEXTS = V["texts"]


def load_json(name):
    return json.loads(read(DATA + name).decode("utf8"))


def src(name):
    return read(SRC + name).decode("utf8")


# ======================================================================
# Liczby: tekst JS <-> float, formatowanie jak JS
# ======================================================================
def jnum(text):
    if text is None:
        return None
    if text == "NaN":
        return math.nan
    if text == "Infinity":
        return math.inf
    if text == "-Infinity":
        return -math.inf
    return float(text)


def same(a, b):
    """Rowne bit-w-bit (z rozroznieniem +0/-0), NaN == NaN; None == None."""
    if a is None or b is None:
        return a is None and b is None
    if math.isnan(a) or math.isnan(b):
        return math.isnan(a) and math.isnan(b)
    return struct.pack(">d", a) == struct.pack(">d", b)


def js_str(x):
    """String(x) wg ECMA-262 Number::toString."""
    if math.isnan(x):
        return "NaN"
    if x == 0:
        return "0"
    if math.isinf(x):
        return "-Infinity" if x < 0 else "Infinity"
    sign = "-" if x < 0 else ""
    t = Decimal(repr(abs(x))).normalize()
    _, digits_t, exp = t.as_tuple()
    digits = "".join(str(d) for d in digits_t)
    k = len(digits)
    n = k + exp
    if k <= n <= 21:
        body = digits + "0" * (n - k)
    elif 0 < n <= 21:
        body = digits[:n] + "." + digits[n:]
    elif -6 < n <= 0:
        body = "0." + "0" * (-n) + digits
    else:
        e = n - 1
        es = "-" if e < 0 else "+"
        body = (digits if k == 1 else digits[0] + "." + digits[1:]) + "e" + es + str(abs(e))
    return sign + body


def js_numtxt(x):
    """Zapis liczby w wektorach (s() generatora): "-0" dla minus zera."""
    if x is None:
        return None
    if x == 0 and math.copysign(1, x) < 0:
        return "-0"
    return js_str(x)


def js_to_fixed(x, f):
    if math.isnan(x) or math.isinf(x) or abs(x) >= 1e21:
        return js_str(x)
    neg = x < 0
    d = Decimal(abs(x))
    q = d.quantize(Decimal(1).scaleb(-f), rounding=ROUND_HALF_UP)
    text = format(q, "f")
    return ("-" if neg else "") + text


def js_round(x):
    if math.isnan(x) or math.isinf(x) or x == 0:
        return x
    r = float(math.floor(Decimal(x) + Decimal("0.5")))
    if r == 0 and x < 0:
        return -0.0
    return r


def js_is_int(x):
    return math.isfinite(x) and math.floor(x) == x


JS_WS = set(
    "\u0009\u000a\u000b\u000c\u000d       　﻿"
) | {chr(c) for c in range(0x2000, 0x200B)}


def js_trim(s):
    a, b = 0, len(s)
    while a < b and s[a] in JS_WS:
        a += 1
    while b > a and s[b - 1] in JS_WS:
        b -= 1
    return s[a:b]


def clamp01(x):
    return max(0.0, min(1.0, x))


# ======================================================================
# A. helpery JS
# ======================================================================
J = V["js"]
nums = [jnum(t) for t in J["numbers"]]
for i, x in enumerate(nums):
    check(js_str(x) == J["toString"][i], f"toString {J['numbers'][i]}")
    check(js_numtxt(js_round(x)) == J["mathRound"][i], f"Math.round {J['numbers'][i]}")
    check(js_is_int(x) == J["isInteger"][i], f"isInteger {J['numbers'][i]}")
for di, d in enumerate(J["toFixedDigits"]):
    for i, x in enumerate(nums):
        want = J["toFixed"][di][i]
        check(js_to_fixed(x, d) == want, f"toFixed({d}) {J['numbers'][i]}: {js_to_fixed(x, d)} != {want}")
for c in J["trim"]:
    check(js_trim(c["in"]) == c["out"], f"trim {c['in']!r}")

# ======================================================================
# Tabele silnika vs literaly TS
# ======================================================================
PARAMS = json.loads(read(DERIVED + "/civ-matrix-params.json").decode("utf8"))
SEM = json.loads(read(DERIVED + "/civ-matrix-semantic.json").decode("utf8"))
S_TS = src("civ-matrix-semantic.ts")
M_TS = src("civ-matrix.ts")
A_TS = src("civ-ai-data.ts")
R_TS = src("civ-roster.ts")
N_TS = src("civ-names.ts")
P_TS = read(WEB_ROOT + "/gra/src/types/player.ts").decode("utf8")
CN_TS = src("city-names-pool.ts")


def ts_set(name):
    m = re.search(r"const " + name + r" = new Set(?:<string>)?\(\[(.*?)\]\);", S_TS, re.S)
    assert m, name
    return re.findall(r"'([^']+)'", m.group(1))


SETS = {
    "REAL_GAMEPLAY": ts_set("REAL_GAMEPLAY"),
    "UI_ONLY": ts_set("UI_ONLY"),
    "DECISION_REQUIRED": ts_set("DECISION_REQUIRED"),
    "HARMFUL": ts_set("HARMFUL"),
    "BLOCKED_COMBAT_MULTIPLIER": ts_set("BLOCKED_COMBAT_MULTIPLIER"),
    "DEAD_UNWIRED_COMBAT": ts_set("DEAD_UNWIRED_COMBAT"),
    "NEUTRAL_DOMAINS": ts_set("NEUTRAL_DOMAINS"),
}
Z = SEM["zbiory"]
check(Z["real_gameplay"] == SETS["REAL_GAMEPLAY"], "tabela: real_gameplay == TS")
check(Z["ui_only"] == SETS["UI_ONLY"], "tabela: ui_only == TS")
check(Z["decision_required"] == SETS["DECISION_REQUIRED"], "tabela: decision_required == TS")
check(Z["szkodliwe"] == SETS["HARMFUL"], "tabela: szkodliwe == TS")
check(Z["walka_zablokowana"] == SETS["BLOCKED_COMBAT_MULTIPLIER"], "tabela: walka_zablokowana == TS")
check(Z["walka_martwa"] == SETS["DEAD_UNWIRED_COMBAT"], "tabela: walka_martwa == TS")
check(Z["domeny_neutralne"] == SETS["NEUTRAL_DOMAINS"], "tabela: domeny_neutralne == TS")
pol_src = re.search(r"export function civMatrixSemanticPolarity.*?\n\}\n", S_TS, re.S).group(0)
check(Z["prefiksy_neutralne"] == re.findall(r"parameterId\.startsWith\('(\w+_)'\)", pol_src), "tabela: prefiksy_neutralne == TS")

blk = re.search(r"const PROVEN_CONSUMERS[^{]*\{(.*?)\n\};", S_TS, re.S).group(1)
proven = {}
for m in re.finditer(r"^\s{2}(\w+): '((?:[^'\\]|\\.)*)',$", blk, re.M):
    assert "\\" not in m.group(2), "ucieczka w dowodzie"
    proven[m.group(1)] = m.group(2)
check(proven == SEM["dowody_konsumentow"], f"tabela: dowody_konsumentow == TS ({len(proven)} vs {len(SEM['dowody_konsumentow'])})")

lit = re.search(r"const replacements: Readonly<Record<string, string>> = \{(.*?)\n  \};", S_TS, re.S).group(1)
repl = {}
for m in re.finditer(r"(?:(\w+)|'(\w+)'): '((?:[^'\\]|\\.)*)'", lit):
    repl[m.group(1) or m.group(2)] = m.group(3)
check(repl == SEM["etykieta_parametru"]["slownik"], f"tabela: slownik etykiet == TS ({len(repl)} vs {len(SEM['etykieta_parametru']['slownik'])})")
check("' · '" in S_TS.replace('".join', "'").replace("join(' · ')", "' · '") or ".join(' · ')" in S_TS, "TS: separator etykiet")
check(SEM["etykieta_parametru"]["separator_czesci"] == " · ", "tabela: separator")
check("part.replace(/proc$/, '%')" in S_TS and SEM["etykieta_parametru"]["sufiks_proc"] == {"koncowka": "proc", "zamiennik": "%"}, "tabela: sufiks proc")

# teksty: kazdy tekst tabeli (po zamianie placeholderow) wystepuje w zrodle TS
def in_ts(text, placeholders):
    t = text
    for ph, js in placeholders.items():
        t = t.replace(ph, js)
    return t in S_TS


PH_STATUS = {"{parametr}": "${parameterId}"}
for name, label in SEM["etykiety_statusow"].items():
    check(f"'{label}'" in S_TS, f"TS: etykieta statusu {name}")
R = SEM["powody"]
for key in ["ui_only", "dead_unwired", "proposal", "reference_needs_review"]:
    pass
check(in_ts(R["REAL_GAMEPLAY"]["neutralny"], {}), "TS: powod REAL neutralny")
check(in_ts(R["REAL_GAMEPLAY"]["pozostale"], {}), "TS: powod REAL pozostale")
for k in ["UI_ONLY", "DEAD_UNWIRED", "PROPOSAL", "REFERENCE_NEEDS_REVIEW"]:
    check(in_ts(R[k], {}), f"TS: powod {k}")
check(in_ts(R["UNWIRED"]["domyslny"], PH_STATUS), "TS: powod UNWIRED domyslny")
for k, t in R["UNWIRED"]["wyjatki"].items():
    check(in_ts(t, {}), f"TS: powod UNWIRED wyjatek {k}")
check(in_ts(R["BLOCKED"]["domyslny"], PH_STATUS), "TS: powod BLOCKED domyslny")
check(in_ts(R["BLOCKED"]["grupa_walka_zablokowana"], PH_STATUS), "TS: powod BLOCKED grupa")
check(in_ts(R["DECISION_REQUIRED"]["domyslny"], PH_STATUS), "TS: powod DECISION domyslny")
for k, t in R["DECISION_REQUIRED"]["wyjatki"].items():
    check(in_ts(t, {}), f"TS: powod DECISION wyjatek {k}")
BW = SEM["blokada_wejscia"]
check(in_ts(BW["nieznany_parametr"], {"{parametr}": "${input.parameterId}"}), "TS: blokada nieznany parametr")
check(in_ts(BW["brak_wartosci"], {"{parametr}": "${input.parameterId}", "{cywilizacja}": "${input.civilizationId}"}), "TS: blokada brak wartosci")
check(in_ts(BW["nieznana_cywilizacja"], {"{cywilizacja}": "${civKey}"}), "TS: blokada nieznana cywilizacja")
ZT = SEM["zachowanie_trudnosci"]
for t in [ZT["bez_roznic_tekst"], ZT["grupa_bez_wzmocnien"]["tekst"], ZT["prefiks_ai"]["tekst"], ZT["domyslny"]] + list(ZT["wyjatki"].values()):
    check(in_ts(t, {}), f"TS: trudnosc {t[:30]}")
check(ZT["bez_roznic_statusy"] == re.findall(r"status === '(\w+)'", re.search(r"function difficultyBehavior\(.*?\): string \{(.*?)return 'Panel", S_TS, re.S).group(1)), "tabela: statusy bez roznic == TS")
check(ZT["grupa_bez_wzmocnien"]["parametry"] == re.findall(r"parameterId === '(\w+)'", re.search(r"parameterId === 'lud_spadek_proc'(.*?)\) \{", S_TS, re.S).group(0)), "tabela: grupa lud_* == TS")
check(ZT["prefiks_ai"]["prefiks"] == "ai_" and "parameterId.startsWith('ai_')" in S_TS, "tabela: prefiks ai")
check(list(ZT["wyjatki"].keys()) == ["lud_wzrost_proc"] and "parameterId === 'lud_wzrost_proc'" in S_TS, "tabela: wyjatek trudnosci")
F = SEM["formatowanie"]
for t in [F["brak"], F["flag_tak"], F["flag_nie"]]:
    check(f"'{t}'" in S_TS, f"TS: formatowanie {t}")
check("(value * 100).toFixed(1)" in S_TS and "value.toFixed(3)" in S_TS and F["mnoznik_procent"] == 100 and F["cyfry_procent"] == 1 and F["cyfry_wartosc"] == 3, "tabela: formatowanie cyfry")
check(F["jednostki_ulamek"] == ["ulamek", "ulamek_0_1"] and F["jednostka_flaga"] == "flag_0_1", "tabela: formatowanie jednostki")
check("Math.round(value * 100) / 100" in S_TS and SEM["skala_intensywnosci"] == {"min": -10, "max": 10, "mnoznik": 10, "zaokraglenie": 100}
      and "Math.max(-10, Math.min(10, (correctedDelta / maxDistance) * 10))" in S_TS, "tabela: skala intensywnosci")
check(SEM["wersja"] == re.search(r"CIV_MATRIX_SEMANTIC_VERSION = '([^']+)'", S_TS).group(1), "tabela: wersja")
check(SEM["trudnosc"] == re.search(r"CIV_MATRIX_SEMANTIC_DIFFICULTY = '([^']+)'", S_TS).group(1), "tabela: trudnosc")
check(f"'{SEM['baza_porownania']}'" in S_TS and f"'{SEM['polityka_pasm']}'" in S_TS, "tabela: baza i polityka")
check(SEM["zrodlo_wartosci"] == {"macierz": "gra/data/civ-matrix.json", "brak": "missing"} and "'gra/data/civ-matrix.json'" in S_TS and "'missing'" in S_TS, "tabela: zrodlo wartosci")
check(SEM["polaryzacja"] == {"korzystna": "beneficial", "szkodliwa": "harmful", "neutralna": "neutral/not-applicable"}, "tabela: polaryzacja")
for t in SEM["polaryzacja"].values():
    check(f"'{t}'" in S_TS, f"TS: polaryzacja {t}")
for t in SEM["etykiety_kierunku"].values():
    check(f"'{t}'" in S_TS, f"TS: etykieta kierunku {t}")
check(SEM["nieznane"] == {"wersja_macierzy": "unknown", "domena": "unknown", "jednostka": "unknown", "formula": "unknown"}
      and S_TS.count("'unknown'") >= 4, "tabela: nieznane")
# pasma: tolerancje i klucze literalnie w civMatrixNeutralBand
band_src = re.search(r"export function civMatrixNeutralBand.*?\n\}\n", S_TS, re.S).group(0)
check("tolerance: 0," in band_src and "tolerance: 0.005," in band_src and band_src.count("tolerance: 0.5,") == 2 and "? 0.5 : 0.05" in band_src, "TS: tolerancje pasm")
check(set(re.findall(r"'(exact_flag|fraction_0_005|scale_0_5|integer_0_5|decimal_0_05)'", band_src)) == {"exact_flag", "fraction_0_005", "scale_0_5", "integer_0_5", "decimal_0_05"}, "TS: klucze pasm")
tbl_keys = {r["klucz"] for r in SEM["pasma_neutralne"]["reguly"]} | {SEM["pasma_neutralne"]["domyslne"]["klucz"], SEM["pasma_neutralne"]["nieznany_parametr"]["klucz"]}
check(tbl_keys == {"exact_flag", "fraction_0_005", "scale_0_5", "integer_0_5", "decimal_0_05"}, "tabela: klucze pasm")
check({r["klucz"]: r["tolerancja"] for r in SEM["pasma_neutralne"]["reguly"]} == {"exact_flag": 0, "fraction_0_005": 0.005, "scale_0_5": 0.5, "integer_0_5": 0.5}
      and SEM["pasma_neutralne"]["domyslne"] == {"klucz": "decimal_0_05", "tolerancja": 0.05}
      and SEM["pasma_neutralne"]["nieznany_parametr"] == {"klucz": "exact_flag", "tolerancja": 0}, "tabela: tolerancje pasm")
# kolejnosc regul i ich warunki odpowiadaja ciagowi if w civMatrixNeutralBand
rules = SEM["pasma_neutralne"]["reguly"]
check([(r["klucz"], r["gdy_formula"], r["gdy_jednostka"]) for r in rules] == [
    ("exact_flag", ["flag"], ["flag_0_1"]), ("fraction_0_005", [], ["ulamek", "ulamek_0_1"]), ("scale_0_5", [], ["skala_1_10"]),
    ("integer_0_5", [], ["integer"]), ("integer_0_5", ["add", "stat_abs"], [])], "tabela: warunki regul pasm")
check("definition.formula === 'flag' || definition.jednostka === 'flag_0_1'" in band_src
      and "definition.jednostka === 'ulamek' || definition.jednostka === 'ulamek_0_1'" in band_src
      and "definition.jednostka === 'skala_1_10'" in band_src and "definition.jednostka === 'integer'" in band_src
      and "definition.formula === 'add' || definition.formula === 'stat_abs'" in band_src, "TS: warunki pasm")

# params
check(M_TS.count("Math.max(1, Math.min(10, normal + delta))") == 1 and PARAMS["trudnosc"] == {"formula_skalowana": "skala", "delta_latwy": -1, "delta_trudny": 1, "min": 1, "max": 10}
      and "const delta = difficulty === 'easy' ? -1 : 1;" in M_TS and "!== 'skala'" in M_TS, "tabela: trudnosc")
check(PARAMS["formula_domyslna"] == "mul_proc" and "def?.formula ?? 'mul_proc'" in M_TS, "tabela: formula domyslna")
check(PARAMS["roster"]["przesuniecie_ziarna_tasowania_ai"] == 7919 and "(seed + 7919) >>> 0" in R_TS, "tabela: ziarno 7919")
check(PARAMS["roster"]["awaryjny_typ"] == "grecy" and "?? 'grecy'" in R_TS, "tabela: awaryjny typ")
check(PARAMS["roster"]["min_typow"] == 1 and "Math.max(1, Math.min(aktywneTypy, 1 + numAi))" in R_TS, "tabela: min typow")
check(PARAMS["nazwy"]["miasta_cywilizacji_len"] == int(re.search(r"MIASTA_CYWILIZACJI_LEN = (\d+)", N_TS).group(1)), "tabela: MIASTA_CYWILIZACJI_LEN")
ai_ids = re.findall(r"values\.(ai_\w+) \?\? 5", A_TS)
check(ai_ids == [PARAMS["ai"]["parametry"][k] for k in ["agresywnosc", "ekspansywnosc", "priorytet_militarny", "priorytet_ekonomia", "priorytet_nauka", "tolerancja_ryzyka", "sklonnosc_podboju"]], "tabela: id parametrow AI == TS")
check(PARAMS["ai"]["parametry"]["profil_obronna"] == "ai_profil_obronna" and "'ai_profil_obronna'" in A_TS, "tabela: id profil_obronna")
check(PARAMS["ai"]["domyslna_wartosc_skali"] == 5 and PARAMS["ai"]["dzielnik_skali"] == 10 and PARAMS["ai"]["zakres"] == {"min": 0, "max": 1}
      and A_TS.count("Math.max(0, Math.min(1,") >= 3 and "/ 10)" in A_TS, "tabela: AI skala/zakres")
check(PARAMS["ai"]["profil_obronna_wartosc"] == 1 and PARAMS["ai"]["profil_mapy_obronna"] == "kopia_typu_obronna" and PARAMS["ai"]["profil_mapy_standardowa"] == "standardowa"
      and "=== 1" in A_TS and "'kopia_typu_obronna'" in A_TS and "'standardowa'" in A_TS, "tabela: profil mapy")
check(PARAMS["dyplomacja"]["parametr_handel"] == "dip_handlowosc_archetyp" and "'dip_handlowosc_archetyp'" in A_TS and PARAMS["dyplomacja"]["dzielnik_otwartosc_handel"] == 10 and "row.otwartoscHandel / 10" in A_TS, "tabela: dyplomacja handel")
check(PARAMS["dyplomacja"]["parametr_nastawienie"] == "dip_nastawienie_bazowe" and "baseTotal = 50" in A_TS and PARAMS["dyplomacja"]["nastawienie_baza_domyslna"] == 50
      and PARAMS["dyplomacja"]["nastawienie_podzial"] == 2 and A_TS.count("- baseTotal) / 2") == 2, "tabela: dyplomacja nastawienie")
check(PARAMS["typ_bez_nazwy_excel"] == re.search(r"DrobnaCywilizacja\s*=\s*'([^']+)'", P_TS).group(1), "tabela: typ bez nazwy Excel")

# ======================================================================
# Dane + scenariusze
# ======================================================================
for key, f in [("civMatrix", "civ-matrix.json"), ("civs", "civs.json"), ("civAi", "civ-ai.json"), ("civParams", "civ-params.json"), ("diplomacy", "diplomacy.json"), ("cityNamesPools", "city-names-pools.json")]:
    check(V["dataFnv"][key] == fnv1a64(read(DATA + f)), f"odcisk {f}")


def apply_ops(files, ops):
    matrix, civ_ai, diplo = files["matrix"], files["civAi"], files["diplomacy"]
    for op in ops:
        t = op["t"]
        val = op.get("value")
        if isinstance(val, dict) and "n" in val:
            val = jnum(val["n"])
        if t == "matrix.deleteRow":
            matrix["cywilizacje"] = [c for c in matrix["cywilizacje"] if c["ikonaId"] != op["ikonaId"]]
        elif t == "matrix.deleteParam":
            row = next(c for c in matrix["cywilizacje"] if c["ikonaId"] == op["ikonaId"])
            del row["params"][op["param"]]
        elif t == "matrix.setValue":
            row = next(c for c in matrix["cywilizacje"] if c["ikonaId"] == op["ikonaId"])
            row["params"][op["param"]] = val
        elif t == "matrix.setFormula":
            matrix["paramDefs"][op["param"]]["formula"] = op["formula"]
        elif t == "matrix.addParamDef":
            matrix["paramDefs"][op["param"]] = op["def"]
        elif t == "matrix.setDefault":
            matrix["defaults"][op["param"]] = val
        elif t == "matrix.setVersion":
            matrix["_meta"]["version"] = val
        elif t == "civAi.set":
            next(c for c in civ_ai["cywilizacje"] if c["Cywilizacja"] == op["cyw"])[op["field"]] = val
        elif t == "civAi.delete":
            civ_ai["cywilizacje"] = [c for c in civ_ai["cywilizacje"] if c["Cywilizacja"] != op["cyw"]]
        elif t == "diplo.set":
            next(c for c in diplo["perNacja"] if c["Cywilizacja"] == op["cyw"])[op["field"]] = val
        elif t == "diplo.delete":
            diplo["perNacja"] = [c for c in diplo["perNacja"] if c["Cywilizacja"] != op["cyw"]]
        else:
            raise SystemExit("nieznana operacja " + t)


DIFFS = ["easy", "normal", "hard"]
STATUSES = ["REAL_GAMEPLAY", "UI_ONLY", "REFERENCE_NEEDS_REVIEW", "UNWIRED", "DEAD_UNWIRED", "PROPOSAL", "BLOCKED", "DECISION_REQUIRED"]
LABELS = ["POZYTYWNY", "NEGATYWNY", "NEUTRALNY"]
civs_file = load_json("civs.json")

# ---- reimplementacja civ-matrix.ts
class Mx:
    def __init__(self, matrix):
        self.m = matrix
        self.defs = matrix["paramDefs"]
        self.ids = list(self.defs.keys())
        self.rows = matrix["cywilizacje"]

    def row(self, key):
        k = key.lower()
        for c in self.rows:
            if c["ikonaId"].lower() == k or c["typCywilizacji"].lower() == k or c["Cywilizacja"].lower() == k:
                return c
        return None

    def param(self, key, pid):
        row = self.row(key)
        dflt = self.m["defaults"].get(pid)
        if row is None:
            return dflt if dflt is not None else 0.0
        v = row["params"].get(pid)
        if v is not None:
            return v
        return dflt if dflt is not None else 0.0

    def at_diff(self, key, pid, diff="normal"):
        normal = self.param(key, pid)
        d = self.defs.get(pid)
        if diff == "normal" or d is None or d["formula"] != "skala":
            return normal
        delta = -1 if diff == "easy" else 1
        return max(1, min(10, normal + delta))

    def params_at(self, key, diff):
        return [(pid, self.at_diff(key, pid, diff)) for pid in self.ids]

    def apply(self, base, key, pid):
        val = self.param(key, pid)
        d = self.defs.get(pid)
        f = d["formula"] if d else "mul_proc"
        if f == "mul_abs":
            return base * val
        if f == "add":
            return base + val
        if f in ("flag", "skala", "stat_abs"):
            return val
        return base * (1 + val)

    def proc_sum(self, key, ids):
        s = 0
        for i in ids:
            s += self.param(key, i)
        return s


def ncmp(a, b, msg):
    check(same(float(a), b), f"{msg}: {a} != {js_numtxt(b)}")


scen_data = {}
for sc in V["scenarios"]:
    files = {"matrix": load_json("civ-matrix.json"), "civAi": load_json("civ-ai.json"), "diplomacy": load_json("diplomacy.json")}
    apply_ops(files, sc["ops"])
    scen_data[sc["id"]] = files
    mx = Mx(files["matrix"])
    sid = sc["id"]
    check(mx.ids == sc["paramIds"], f"{sid}: kolejnosc parametrow")
    check([r["ikonaId"] for r in mx.rows] == [r["ikonaId"] for r in sc["rows"]], f"{sid}: wiersze")
    # civ-matrix.ts
    for ki, key in enumerate(sc["keys"]):
        for pi, pid in enumerate(sc["allParams"]):
            ncmp(mx.param(key, pid), jnum(sc["param"][ki][pi]), f"{sid} param {key!r} {pid}")
    for di, d in enumerate(DIFFS):
        for ki, key in enumerate(sc["diffKeys"]):
            for pi, pid in enumerate(sc["allParams"]):
                ncmp(mx.at_diff(key, pid, d), jnum(sc["atDifficulty"][di][ki][pi]), f"{sid} atDiff {d} {key} {pid}")
    for ki, key in enumerate(sc["diffKeys"]):
        for pi, pid in enumerate(sc["allParams"]):
            ncmp(mx.at_diff(key, pid), jnum(sc["atDifficultyDefault"][ki][pi]), f"{sid} atDiffDefault {key} {pid}")
    for di, d in enumerate(DIFFS):
        for ki, key in enumerate(["grecy", "rzymianie", "nope"]):
            e = sc["paramsAtDifficulty"][di][ki]
            got = mx.params_at(key, d)
            check([k for k, _ in got] == e["keys"], f"{sid} paramsAt keys {d} {key}")
            for i, (k, v) in enumerate(got):
                ncmp(v, jnum(e["values"][i]), f"{sid} paramsAt {d} {key} {k}")
    for pi, pid in enumerate(sc["allParams"]):
        d = mx.defs.get(pid)
        want = [d["domena"], d["jednostka"], d["modul"], d["formula"]] if d else None
        check(sc["paramDef"][pi] == want, f"{sid} paramDef {pid}")
    for bi, b in enumerate(sc["applyBases"]):
        for ki, key in enumerate(sc["applyKeys"]):
            for pi, pid in enumerate(sc["allParams"]):
                ncmp(mx.apply(jnum(b), key, pid), jnum(sc["apply"][bi][ki][pi]), f"{sid} apply {b} {key} {pid}")
    for gi, g in enumerate(sc["procGroups"]):
        for ki, key in enumerate(sc["applyKeys"]):
            ncmp(mx.proc_sum(key, g), jnum(sc["procSum"][gi][ki]), f"{sid} procSum g{gi} {key}")
            for bi, b in enumerate(sc["applyProcBases"]):
                ncmp(jnum(b) * (1 + mx.proc_sum(key, g)), jnum(sc["applyProc"][gi][bi][ki]), f"{sid} applyProc g{gi} {key}")

# ======================================================================
# civ-matrix-semantic.ts (reimplementacja)
# ======================================================================
def sem_polarity(mx, pid):
    d = mx.defs.get(pid)
    if d is None:
        return "neutral/not-applicable"
    if d["domena"] in SETS["NEUTRAL_DOMAINS"] or pid.startswith("ai_") or pid.startswith("dip_"):
        return "neutral/not-applicable"
    if pid in SETS["HARMFUL"]:
        return "harmful"
    return "beneficial"


def sem_status(pid):
    if pid in SETS["REAL_GAMEPLAY"]:
        return "REAL_GAMEPLAY"
    if pid in SETS["UI_ONLY"]:
        return "UI_ONLY"
    if pid in SETS["DECISION_REQUIRED"]:
        return "DECISION_REQUIRED"
    if pid in SETS["DEAD_UNWIRED_COMBAT"]:
        return "DEAD_UNWIRED"
    if pid in SETS["BLOCKED_COMBAT_MULTIPLIER"]:
        return "BLOCKED"
    return "UNWIRED"


def sem_band(d):
    if d["formula"] == "flag" or d["jednostka"] == "flag_0_1":
        return ("unit-aware-v1", 0, "exact_flag")
    if d["jednostka"] in ("ulamek", "ulamek_0_1"):
        return ("unit-aware-v1", 0.005, "fraction_0_005")
    if d["jednostka"] == "skala_1_10":
        return ("unit-aware-v1", 0.5, "scale_0_5")
    if d["jednostka"] == "integer":
        return ("unit-aware-v1", 0.5, "integer_0_5")
    if d["formula"] in ("add", "stat_abs"):
        return ("unit-aware-v1", 0.5, "integer_0_5")
    return ("unit-aware-v1", 0.05, "decimal_0_05")


def median(vals):
    if not vals:
        return math.nan
    s = sorted(vals)
    mid = len(s) // 2
    if len(s) % 2 == 1:
        return s[mid]
    return (s[mid - 1] + s[mid]) / 2


def round_two(v):
    r = js_round(v * 100) / 100
    return 0.0 if r == 0 else r


def fill(t, **kw):
    out = t
    for k, v in kw.items():
        out = out.replace("{" + k + "}", v)
    return out


def sem_reason(status, pid, pol):
    if status == "REAL_GAMEPLAY":
        return R["REAL_GAMEPLAY"]["neutralny"] if pol == "neutral/not-applicable" else R["REAL_GAMEPLAY"]["pozostale"]
    if status in ("UI_ONLY", "DEAD_UNWIRED", "PROPOSAL", "REFERENCE_NEEDS_REVIEW"):
        return R[status]
    if status == "UNWIRED":
        return R["UNWIRED"]["wyjatki"].get(pid) or fill(R["UNWIRED"]["domyslny"], parametr=pid)
    if status == "BLOCKED":
        if pid in SETS["BLOCKED_COMBAT_MULTIPLIER"]:
            return fill(R["BLOCKED"]["grupa_walka_zablokowana"], parametr=pid)
        return R["BLOCKED"]["domyslny"]
    if status == "DECISION_REQUIRED":
        return R["DECISION_REQUIRED"]["wyjatki"].get(pid) or R["DECISION_REQUIRED"]["domyslny"]
    raise SystemExit(status)


def sem_diff_behavior(pid, status):
    if status in ZT["bez_roznic_statusy"]:
        return ZT["bez_roznic_tekst"]
    if pid == "lud_wzrost_proc":
        return ZT["wyjatki"]["lud_wzrost_proc"]
    if pid in ZT["grupa_bez_wzmocnien"]["parametry"]:
        return ZT["grupa_bez_wzmocnien"]["tekst"]
    if pid.startswith("ai_"):
        return ZT["prefiks_ai"]["tekst"]
    return ZT["domyslny"]


def sem_explanation(pid, status, pol):
    return SEM["dowody_konsumentow"].get(pid) or sem_reason(status, pid, pol)


def finite(x):
    return x if (x is not None and math.isfinite(x)) else None


def sem_classify(mx, version, pid, civ_id, civ_name, raw, base, mn, mxv, status=None, source=None):
    d = mx.defs.get(pid)
    st = status or sem_status(pid)
    pol = sem_polarity(mx, pid)
    band = sem_band(d) if d else ("unit-aware-v1", 0, "exact_flag")
    raw, base, mn, mxv = finite(raw), finite(base), finite(mn), finite(mxv)
    valid = all(v is not None for v in (raw, base, mn, mxv))
    blocked = d is None or not valid
    if not blocked:
        if pol == "neutral/not-applicable":
            label, si, cd, md = "NEUTRALNY", 0.0, 0.0, 0.0
        else:
            cd = raw - base if pol == "beneficial" else base - raw
            md = max(abs(mxv - base), abs(mn - base))
            if raw == base:
                label, si = "POZYTYWNY", 1.0
            elif md == 0:
                label, si = ("POZYTYWNY", 1.0) if cd >= 0 else ("NEGATYWNY", -1.0)
            else:
                norm = max(-10, min(10, (cd / md) * 10))
                label, si = ("POZYTYWNY" if norm >= 0 else "NEGATYWNY"), round_two(norm)
    else:
        label, si, cd, md = "NEUTRALNY", 0.0, None, None
    eff = "BLOCKED" if blocked else st
    if d is None:
        blk_reason = fill(BW["nieznany_parametr"], parametr=pid)
    elif not valid:
        blk_reason = fill(BW["brak_wartosci"], parametr=pid, cywilizacja=civ_id)
    else:
        blk_reason = sem_reason(eff, pid, pol)
    return {
        "domain": d["domena"] if d else "unknown", "unit": d["jednostka"] if d else "unknown", "formula": d["formula"] if d else "unknown",
        "raw": raw, "base": base, "min": mn, "max": mxv, "md": md, "cd": cd, "pol": pol, "band": band, "label": label, "si": si,
        "status": eff, "statusLabel": SEM["etykiety_statusow"][eff],
        "reason": blk_reason if blocked else sem_reason(eff, pid, pol),
        "expl": blk_reason if blocked else sem_explanation(pid, eff, pol),
        "diff": sem_diff_behavior(pid, eff),
        "source": source or ("missing" if blocked else "gra/data/civ-matrix.json"),
        "civName": civ_name or civ_id,
        "evidence": [SEM["dowody_konsumentow"][pid]] if pid in SEM["dowody_konsumentow"] else [],
        "version": version,
    }


def cmp_cell_arr(c, e, msg):
    """encodeCell: [raw, base, min, max, md, cd, labelIdx, si, statusIdx, reason, expl, diff, source]"""
    for i, k in enumerate(["raw", "base", "min", "max", "md", "cd"]):
        check(same(c[k], jnum(e[i])), f"{msg} {k}: {c[k]} != {e[i]}")
    check(LABELS.index(c["label"]) == e[6], f"{msg} label")
    check(same(float(c["si"]), jnum(e[7])), f"{msg} si {c['si']} != {e[7]}")
    check(STATUSES.index(c["status"]) == e[8], f"{msg} status")
    check(c["reason"] == TEXTS[e[9]], f"{msg} reason")
    check(c["expl"] == TEXTS[e[10]], f"{msg} expl")
    check(c["diff"] == TEXTS[e[11]], f"{msg} diff")
    check(c["source"] == e[12], f"{msg} source")


for sc in V["scenarios"]:
    sid = sc["id"]
    files = scen_data[sid]
    mx = Mx(files["matrix"])
    version = str(files["matrix"]["_meta"].get("version", "unknown"))
    sem = sc["semantic"]
    ids = mx.ids
    check(sem["paramIds"] == ids, f"{sid}: sem paramIds")
    # baselines
    base = {}
    for pid in ids:
        vals = [r["params"][pid] for r in mx.rows if pid in r["params"] and math.isfinite(r["params"][pid])]
        if len(vals) != len(mx.rows):
            continue
        base[pid] = (median(vals), min(vals), max(vals))
    for i, pid in enumerate(ids):
        check(sem["status"][i] == sem_status(pid), f"{sid}: status {pid}")
        check(sem["polarity"][i] == sem_polarity(mx, pid), f"{sid}: polarity {pid}")
        b = sem_band(mx.defs[pid])
        check([sem["band"][i][0], jnum(sem["band"][i][1]), sem["band"][i][2]] == [b[0], float(b[1]), b[2]], f"{sid}: band {pid}")
        ev = [TEXTS[j] for j in sem["evidence"][i]]
        check(ev == ([proven[pid]] if pid in proven else []), f"{sid}: evidence {pid}")
        want = base[pid][0] if pid in base else None
        check(same(None if want is None else float(want), jnum(sem["baseline"][i])), f"{sid}: baseline {pid}")
    for i, pid in enumerate(["__nope__", "zz_nowy_parametr"]):
        check(sem["baselineExtra"][i] is None and pid not in base, f"{sid}: baselineExtra {pid}")
    for m_in, m_out in zip(sem["median"]["in"], sem["median"]["out"]):
        check(same(median([jnum(x) for x in m_in]), jnum(m_out)), f"{sid}: median {m_in}")
    # profile
    check(len(sem["profiles"]) == len(mx.rows), f"{sid}: liczba profili")
    active_total = 0
    for pi_, row in enumerate(mx.rows):
        pr = sem["profiles"][pi_]
        check(pr["civilizationId"] == row["ikonaId"] and pr["civilizationName"] == row["Cywilizacja"], f"{sid}: profil {row['ikonaId']}")
        cells = []
        for ci, pid in enumerate(ids):
            raw = row["params"].get(pid)
            b = base.get(pid)
            c = sem_classify(mx, version, pid, row["ikonaId"], row["Cywilizacja"], raw, b[0] if b else None, b[1] if b else None, b[2] if b else None,
                             source=("missing" if raw is None else "gra/data/civ-matrix.json"))
            cells.append(c)
            cmp_cell_arr(c, pr["cells"][ci], f"{sid} {row['ikonaId']} {pid}")
        act = sum(1 for c in cells if c["status"] == "REAL_GAMEPLAY")
        check(pr["activeCount"] == act and pr["inactiveCount"] == len(cells) - act and pr["parameterCount"] == len(ids), f"{sid}: liczniki profilu {row['ikonaId']}")
        check(pr["blocked"] is None and pr["difficulty"] == "normal" and pr["baselineKind"] == "normal-median-all-15", f"{sid}: pola profilu")
    h = sem["snapshotHeader"]
    check(h["cellsLen"] == len(ids) * len(mx.rows) and h["expectedCellCount"] == h["cellsLen"] and h["profilesLen"] == len(mx.rows) and h["parameterCount"] == len(ids)
          and h["civilizationCount"] == len(mx.rows) and h["version"] == SEM["wersja"] and h["difficulty"] == "normal", f"{sid}: naglowek migawki")
    check(sem["provenance"] == {"matrixVersion": version, "semanticVersion": SEM["wersja"]}, f"{sid}: provenance")
    # perParam
    for i, pid in enumerate(ids):
        d = mx.defs[pid]
        check(sem["perParam"][i] == {"domain": d["domena"], "unit": d["jednostka"], "formula": d["formula"], "baselineKind": "normal-median-all-15"}, f"{sid}: perParam {pid}")
    # klucze profili
    def find_civ(key):
        k = js_trim(key).lower()
        for r in mx.rows:
            if r["ikonaId"].lower() == k or r["typCywilizacji"].lower() == k or r["Cywilizacja"].lower() == k:
                return r
        return None

    for ki, key in enumerate(sem["profileKeys"]):
        e = sem["profileByKey"][ki]
        row = find_civ(key)
        if row is None:
            check(e["civilizationId"] == key and e["civilizationName"] == key and e["cellsLen"] == 0 and e["activeCount"] == 0 and e["inactiveCount"] == 0
                  and e["parameterCount"] == len(ids) and TEXTS[e["blocked"]] == fill(BW["nieznana_cywilizacja"], cywilizacja=key) and e["first"] is None, f"{sid}: profil nieznany {key!r}")
        else:
            check(e["civilizationId"] == row["ikonaId"] and e["civilizationName"] == row["Cywilizacja"] and e["cellsLen"] == len(ids) and e["blocked"] is None, f"{sid}: profil {key!r}")
            f = e["first"]
            pid = ids[0]
            raw = row["params"].get(pid)
            b = base.get(pid)
            c = sem_classify(mx, version, pid, row["ikonaId"], row["Cywilizacja"], raw, b[0] if b else None, b[1] if b else None, b[2] if b else None,
                             source=("missing" if raw is None else "gra/data/civ-matrix.json"))
            check(f["parameterId"] == pid and f["civilizationId"] == row["ikonaId"] and f["civilizationName"] == row["Cywilizacja"]
                  and f["domain"] == c["domain"] and f["unit"] == c["unit"] and f["formula"] == c["formula"] and f["polarity"] == c["pol"]
                  and f["band"]["policyId"] == c["band"][0] and f["band"]["key"] == c["band"][2] and jnum(f["band"]["tolerance"]) == float(c["band"][1])
                  and f["label"] == c["label"] and f["status"] == c["status"] and f["source"] == c["source"] and f["matrixVersion"] == version
                  and f["semanticVersion"] == SEM["wersja"] and [TEXTS[j] for j in f["evidence"]] == c["evidence"]
                  and TEXTS[f["statusLabelPl"]] == c["statusLabel"] and TEXTS[f["statusReasonPl"]] == c["reason"] and TEXTS[f["explanationPl"]] == c["expl"]
                  and TEXTS[f["difficultyBehaviorPl"]] == c["diff"] and f["baselineKind"] == "normal-median-all-15", f"{sid}: pierwsza komorka profilu {key!r}")
    # wszystkie statusy x parametry
    al = sem["allStatuses"]
    for pi_, pid in enumerate(al["params"]):
        for si_, stt in enumerate(al["statuses"]):
            c = sem_classify(mx, version, pid, "grecy", "Grecy", 3.0, 2.0, 0.0, 5.0, status=stt)
            e = al["cells"][pi_][si_]
            check(c["status"] == e[0] and c["statusLabel"] == TEXTS[e[1]] and c["reason"] == TEXTS[e[2]] and c["expl"] == TEXTS[e[3]] and c["diff"] == TEXTS[e[4]]
                  and c["label"] == e[5] and same(float(c["si"]), jnum(e[6])), f"{sid}: allStatuses {pid} {stt}")
    # siatka syntetyczna
    for case in sem["grid"]:
        p, tup, stt, name, source = case["in"]
        t = [jnum(x) for x in tup]
        c = sem_classify(mx, version, p, "x_civ", name, t[0], t[1], t[2], t[3], status=stt, source=source)
        e = case["out"]
        ok = (c["domain"] == e[0] and c["unit"] == e[1] and c["formula"] == e[2] and same(c["raw"], jnum(e[3])) and same(c["base"], jnum(e[4]))
              and same(c["min"], jnum(e[5])) and same(c["max"], jnum(e[6])) and same(c["md"], jnum(e[7])) and same(c["cd"], jnum(e[8]))
              and c["pol"] == e[9] and c["band"][2] == e[10] and jnum(e[11]) == float(c["band"][1]) and c["label"] == e[12]
              and same(float(c["si"]), jnum(e[13])) and c["status"] == e[14] and c["statusLabel"] == TEXTS[e[15]] and c["reason"] == TEXTS[e[16]]
              and c["expl"] == TEXTS[e[17]] and c["diff"] == TEXTS[e[18]] and c["source"] == e[19] and c["civName"] == e[20]
              and c["evidence"] == [TEXTS[j] for j in e[21]])
        check(ok, f"{sid}: siatka {case['in']}")


# etykiety, formatowanie
def label_pl(pid):
    out = []
    for part in pid.split("_"):
        if part in repl:
            out.append(repl[part])
        else:
            out.append(re.sub(r"proc$", "%", part))
    return " · ".join(out)


for i, pid in enumerate(J["paramLabel"]["ids"]):
    check(label_pl(pid) == J["paramLabel"]["out"][i], f"etykieta {pid!r}")


def fmt_value(value, unit):
    if value is None:
        return "brak wartości"
    if unit == "flag_0_1":
        return "tak (1)" if value == 1 else "nie (0)"
    if unit in ("ulamek", "ulamek_0_1"):
        return f"{js_to_fixed(value * 100, 1)}% ({js_str(value)})"
    if js_is_int(value):
        return js_str(value)
    fx = js_to_fixed(value, 3)
    return js_str(float(fx) if fx not in ("NaN",) else math.nan)


FM = J["formatted"]
for ui, unit in enumerate(FM["units"]):
    for vi, vt in enumerate(FM["values"]):
        check(fmt_value(jnum(vt), unit) == FM["out"][ui][vi], f"formatted {unit} {vt}")
for stt, vis in zip(J["visibility"]["statuses"], J["visibility"]["out"]):
    check(vis == (stt == "REAL_GAMEPLAY"), f"statusAllowsDefaultVisibility {stt}")
for i, vt in enumerate(J["intensity"]["values"]):
    x = jnum(vt)
    got = "0" if x == 0 else ("+" + js_str(x) if x > 0 else js_str(x))
    check(got == J["intensity"]["out"][i], f"intensity {vt}")

# ======================================================================
# civ-ai-data.ts (reimplementacja)
# ======================================================================
civs_by_ikona = {c["ikonaId"]: c for c in civs_file["cywilizacje"]}
for sc in V["scenarios"]:
    sid = sc["id"]
    files = scen_data[sid]
    mx = Mx(files["matrix"])
    ai = sc["ai"]
    civ_ai = files["civAi"]["cywilizacje"]
    perNacja = files["diplomacy"]["perNacja"]
    TYP_DROBNA = "drobna_cywilizacja"

    def excel_name(typ):
        if typ == TYP_DROBNA:
            return None
        r = civs_by_ikona.get(typ)
        return r["Cywilizacja"] if r else None

    def matrix_row_by_name(name):
        for c in mx.rows:
            if c["Cywilizacja"] == name or c["ikonaId"] == name or c["typCywilizacji"] == name:
                return c
        return None

    def data_ai(variant):
        if variant["noCivAi"]:
            return None
        return [c for c in civ_ai if c["Cywilizacja"] not in variant["civAiDelete"]]

    def legacy(data, name):
        if data is None:
            return None
        return next((c for c in data if c["Cywilizacja"] == name), None)

    def agg_norm(data, name, diff):
        if matrix_row_by_name(name):
            return clamp01(mx.at_diff(name, "ai_agresywnosc", diff) / 10)
        row = legacy(data, name)
        if row is None:
            return None
        return clamp01(row["agresywnosc"] / 10)

    def profil_mapy(data, name, diff):
        row = matrix_row_by_name(name)
        if row:
            return "kopia_typu_obronna" if mx.at_diff(row["ikonaId"], "ai_profil_obronna", diff) == 1 else "standardowa"
        leg = legacy(data, name)
        if leg is None:
            return None
        return js_trim(leg["profilMapy"]) or None

    def enc_profile(p):
        if p is None:
            return None
        return [p["Cywilizacja"], js_numtxt(float(p["agresywnosc"])), js_numtxt(float(p["ekspansywnosc"])), js_numtxt(float(p["priorytetMilitarny"])),
                js_numtxt(float(p["priorytetEkonomia"])), js_numtxt(float(p["priorytetNauka"])), js_numtxt(float(p["tolerancjaRyzyka"])),
                js_numtxt(float(p["sklonnoscDoPodboju"])), p["profilMapy"], p.get("uwagi")]

    def profile_for(data, name, diff):
        leg = legacy(data, name)
        row = matrix_row_by_name(name)
        if leg is None and row is None:
            return None
        if row is None:
            return leg
        vals = dict(mx.params_at(row["ikonaId"], diff))
        return {
            "Cywilizacja": leg["Cywilizacja"] if leg else row["Cywilizacja"],
            "agresywnosc": vals.get("ai_agresywnosc", 5),
            "ekspansywnosc": vals.get("ai_ekspansywnosc", 5),
            "priorytetMilitarny": vals.get("ai_priorytet_militarny", 5),
            "priorytetEkonomia": vals.get("ai_priorytet_ekonomia", 5),
            "priorytetNauka": vals.get("ai_priorytet_nauka", 5),
            "tolerancjaRyzyka": vals.get("ai_tolerancja_ryzyka", 5),
            "sklonnoscDoPodboju": vals.get("ai_sklonnosc_podboju", 5),
            "profilMapy": "kopia_typu_obronna" if vals.get("ai_profil_obronna") == 1 else "standardowa",
            "uwagi": leg["uwagi"] if leg else None,
        }

    names = ai["names"]
    variants = ai["dataVariants"]
    for vi, v in enumerate(variants):
        data = data_ai(v)
        for di, d in enumerate(DIFFS):
            for ni, n in enumerate(names):
                tag = f"{sid} v{vi} {d} {n!r}"
                a = agg_norm(data, n, d)
                check(same(a, jnum(ai["aggressionNorm"][vi][di][ni])), f"{tag} aggressionNorm")
                check(profil_mapy(data, n, d) == ai["profilMapy"][vi][di][ni], f"{tag} profilMapy")
                check(enc_profile(profile_for(data, n, d)) == ai["profileFor"][vi][di][ni], f"{tag} profileFor")
        for ni, n in enumerate(names):
            check((profil_mapy(data, n, "normal") == "kopia_typu_obronna") == ai["isKopia"][vi][ni], f"{sid} v{vi} isKopia {n!r}")
    typs = ai["typs"]
    for ti, t in enumerate(typs):
        check(excel_name(t) == ai["excelName"][ti], f"{sid} excelName {t!r}")
        nm = excel_name(t)
        row = next((r for r in perNacja if r["Cywilizacja"] == nm), None) if nm else None
        e = ai["diploRowForTyp"][ti]
        check((None if row is None else [row["Cywilizacja"], js_numtxt(float(row["nastawienieBazowe"]))]) == e, f"{sid} diploRowForTyp {t!r}")
        for vi, v in enumerate(variants):
            data = data_ai(v)
            for di, d in enumerate(DIFFS):
                got = None if nm is None else enc_profile(profile_for(data, nm, d))
                check(got == ai["profileForTyp"][vi][di][ti], f"{sid} profileForTyp v{vi} {d} {t!r}")

    def resolve_agg(typ, fb, data_given, data, diff):
        nm = excel_name(typ)
        if nm is None:
            return fb
        mrow = next((c for c in mx.rows if c["Cywilizacja"] == nm or c["ikonaId"] == typ or c["typCywilizacji"] == typ), None)
        if mrow:
            return clamp01(mx.at_diff(typ, "ai_agresywnosc", diff) / 10)
        if data_given:
            r = agg_norm(data, nm, diff)
        else:
            raw = next((c for c in civ_ai if c["Cywilizacja"] == nm), None)
            r = None if raw is None else clamp01(raw["agresywnosc"] / 10)
        return fb if r is None else r

    for fi, fb in enumerate(ai["fallbackAgg"]):
        for dv in range(len(variants) + 1):
            for di, d in enumerate(DIFFS):
                for ti, t in enumerate(typs):
                    given = dv < len(variants)
                    got = resolve_agg(t, jnum(fb), given, data_ai(variants[dv]) if given else None, d)
                    ncmp(got, jnum(ai["resolveAggression"][fi][dv][di][ti]), f"{sid} resolveAgg fb{fb} dv{dv} {d} {t!r}")
    for ti, t in enumerate(typs):
        ncmp(resolve_agg(t, 0.37, False, None, "normal"), jnum(ai["resolveAggressionDefaultDiff"][ti]), f"{sid} resolveAgg default {t!r}")

    def resolve_trade(typ, fb, diff):
        mrow = next((c for c in mx.rows if c["ikonaId"] == typ or c["typCywilizacji"] == typ), None)
        if mrow:
            return clamp01(mx.at_diff(typ, "dip_handlowosc_archetyp", diff))
        nm = excel_name(typ)
        row = next((r for r in perNacja if r["Cywilizacja"] == nm), None) if nm else None
        if row is not None:
            return clamp01(row["otwartoscHandel"] / 10)
        return fb

    for fi, fb in enumerate(ai["fallbackTrade"]):
        for di, d in enumerate(DIFFS):
            for ti, t in enumerate(typs):
                ncmp(resolve_trade(t, jnum(fb), d), jnum(ai["resolveTrade"][fi][di][ti]), f"{sid} resolveTrade fb{fb} {d} {t!r}")
    for ti, t in enumerate(typs):
        ncmp(resolve_trade(t, 0.42, "normal"), jnum(ai["resolveTradeDefaultDiff"][ti]), f"{sid} resolveTrade default {t!r}")

    def nastaw(typ, base_total, diff):
        mrow = next((c for c in mx.rows if c["ikonaId"] == typ or c["typCywilizacji"] == typ), None)
        if mrow:
            return (mx.at_diff(typ, "dip_nastawienie_bazowe", diff) - base_total) / 2
        nm = excel_name(typ)
        row = next((r for r in perNacja if r["Cywilizacja"] == nm), None) if nm else None
        if row is None:
            return 0.0
        return (row["nastawienieBazowe"] - base_total) / 2

    for bi, bt in enumerate(ai["baseTotals"]):
        base_total = 50.0 if bt is None else jnum(bt)
        for di, d in enumerate(DIFFS):
            for ti, t in enumerate(typs):
                ncmp(nastaw(t, base_total, d), jnum(ai["nastawienie"][bi][di][ti]), f"{sid} nastawienie {bt} {d} {t!r}")
    for ti, t in enumerate(typs):
        ncmp(nastaw(t, 50.0, "normal"), jnum(ai["nastawienieDefault"][ti]), f"{sid} nastawienie default {t!r}")
    # civParamsFor / diplomacyPerNacjaRow
    civ_params = load_json("civ-params.json")["cywilizacje"]
    for ni, n in enumerate(names):
        cp = next((c for c in civ_params if c["Cywilizacja"] == n), None)
        check((None if cp is None else [cp["Cywilizacja"], cp["preferowaneBudynki"], js_numtxt(float(cp["modWzrostu"])), js_numtxt(float(cp["modEkonomii"]))]) == ai["civParamsFor"][ni], f"{sid} civParamsFor {n!r}")
        check(ai["civParamsForNoData"][ni] is None, f"{sid} civParamsForNoData {n!r}")
        dr = next((r for r in perNacja if r["Cywilizacja"] == n), None)
        want = None if dr is None else [dr["Cywilizacja"]] + [js_numtxt(float(dr[k])) for k in ["sklonnoscSojusze", "lojalnosc", "progWojny", "pamietliwosc", "otwartoscHandel", "nastawienieBazowe"]]
        check(want == ai["diploRow"][ni], f"{sid} diploRow {n!r}")

# ======================================================================
# civ-names.ts / city-names-pool.ts (reimplementacja)
# ======================================================================
pools_real = load_json("city-names-pools.json")
COMMON, REGULAR, STATE = 110, 100, 10
check(re.search(r"CITY_NAMES_POOL_REGULAR_LEN = (\d+)", CN_TS).group(1) == "100" and re.search(r"CITY_NAMES_POOL_STATE_LEN = (\d+)", CN_TS).group(1) == "10", "TS: dlugosci pul")
ROMAN = re.search(r"const roman = \[(.*?)\];", CN_TS, re.S).group(1)
ROMAN = re.findall(r"'([^']*)'", ROMAN)


def suffix(base, n):
    if n <= 1:
        return base
    return f"{base} {ROMAN[n] if n <= 10 else str(n)}"


def pick_names(names, used, fb="Miasto"):
    for nm in names:
        if nm and nm not in used:
            return nm
    base = next((nm for nm in names if nm), None)
    if base is None:
        base = fb
    if not any(names) and base not in used:
        return base
    o = 2
    while suffix(base, o) in used or suffix(base, o) in names:
        o += 1
    return suffix(base, o)


def klastra_at(names, idx, fb):
    if 0 <= idx < len(names) and names[idx]:
        return names[idx]
    return fb


def jslice(lst, a, b=None):
    return lst[a:b]


NV = V["names"]
c = NV["constants"]
check((c["miastaLen"], c["klastraLen"], c["commonLen"], c["regularLen"]) == (100, 10, 110, 100), "stale nazw")
civ_sets = NV["civSets"]
synth_pools = NV["synthPools"]
pool_sets = {"real": pools_real, "none": None, "synth": synth_pools, "empty": {}}
used_variants = {"undef": None, "empty": set(), "mixedx": set(NV["usedVariants"]["mixedx"]), "many": set(NV["usedVariants"]["many"])}
IDS = NV["ids"]


def find_civ(civs, i):
    return next((x for x in civs if x.get("ikonaId") == i), None)


def get_klastra(civs, i):
    d = find_civ(civs, i)
    if d is None:
        return []
    if "nazwyMiast" in d:
        return jslice(d["nazwyMiast"], REGULAR, COMMON)
    return d.get("nazwyKlastra", [])


def get_miast(civs, i):
    d = find_civ(civs, i)
    return (d or {}).get("nazwyMiast", [])


def common_names(pools, i):
    e = pools.get(i)
    return e["miasta_cywilizacji"][:COMMON] if e else []


def pool_pick(pools, i, used, fb="Miasto"):
    return pick_names(common_names(pools, i), used, fb)


def start_name(civs, pid, pools, used):
    if pools is not None and pid in pools:
        return pool_pick(pools, pid, used if used is not None else set(), "Stolica")
    cn = get_miast(civs, pid)
    if cn:
        return pick_names(cn, used if used is not None else set(), "Stolica")
    return klastra_at(get_klastra(civs, pid), 0, "Stolica")


def rival_name(civs, pid, n, pools, used):
    if pools is not None and pid in pools:
        common = common_names(pools, pid)
        fb = f"Rywal {n}"
        if n < 1:
            return fb
        iu = used if used is not None else set(common[:n])
        return pick_names(common, iu, fb)
    cn = get_miast(civs, pid)
    if cn and n >= 1:
        iu = used if used is not None else set(cn[:n])
        return pick_names(cn, iu, f"Rywal {n}")
    names = get_klastra(civs, pid)
    if not names:
        return f"Rywal {n}"
    idx = n - 1 if n >= 1 else n
    return klastra_at(names, idx, f"Rywal {n}")


def foreign_name(civs, tid, pools, used):
    if pools is not None and tid in pools:
        return pool_pick(pools, tid, used if used is not None else set(), tid)
    cn = get_miast(civs, tid)
    if cn:
        return pick_names(cn, used if used is not None else set(), tid)
    return klastra_at(get_klastra(civs, tid), 0, tid)


def state_at(pools, i, idx, fb, used):
    common = common_names(pools, i)
    if not common or idx < 0:
        return fb
    iu = used if used is not None else set(common[:idx])
    return pick_names(common, iu, fb)


def state_name(civs, i, idx, fb, pools, used):
    if pools is not None and i in pools:
        return state_at(pools, i, idx, fb, used)
    d = find_civ(civs, i)
    names = (d or {}).get("nazwyMiast", [])
    if names and idx >= 0:
        iu = used if used is not None else set(names[:idx])
        return pick_names(names, iu, fb)
    if idx >= 0:
        return klastra_at(names, idx, fb)
    return fb


for k, s_ in enumerate(["real", "synth", "mixed"]):
    civs = civ_sets[s_]
    for i, ident in enumerate(IDS):
        d = find_civ(civs, ident)
        check(NV["find"][k]["out"][i] == (civs.index(d) if d else -1), f"find {s_} {ident!r}")
        check(get_klastra(civs, ident) == NV["klastra"][k]["out"][i], f"klastra {s_} {ident!r}")
        check((d or {}).get("Cywilizacja", ident) == NV["display"][k]["out"][i], f"display {s_} {ident!r}")


def validate_nazwy(civs):
    errs = []
    for cv in civs:
        ident = cv.get("ikonaId", cv.get("Cywilizacja", "undefined"))
        names = cv.get("nazwyMiast", [])
        if len(names) != COMMON:
            errs.append(f"{ident}: oczekiwano {COMMON} nazw, jest {len(names)}")
        if len(set(names)) != len(names):
            errs.append(f"{ident}: duplikaty we wspólnej liście nazwMiast")
    return errs


for k, s_ in enumerate(["real", "synth", "mixed"]):
    check(validate_nazwy(civ_sets[s_]) == NV["validateNazwy"][k]["out"], f"validateNazwy {s_}")
check(validate_nazwy(NV["validateNazwy"][3]["civs"]) == NV["validateNazwy"][3]["out"], "validateNazwy inline")

for row in NV["start"]:
    for i, ident in enumerate(IDS):
        check(start_name(civ_sets[row["cs"]], ident, pool_sets[row["ps"]], used_variants[row["uv"]]) == row["out"][i], f"start {row['cs']} {row['ps']} {row['uv']} {ident!r}")
for row in NV["foreign"]:
    for i, ident in enumerate(IDS):
        check(foreign_name(civ_sets[row["cs"]], ident, pool_sets[row["ps"]], used_variants[row["uv"]]) == row["out"][i], f"foreign {row['cs']} {row['ps']} {row['uv']} {ident!r}")
for row in NV["rival"]:
    for i, ident in enumerate(IDS):
        for ri, n in enumerate(NV["rivalIndexes"]):
            check(rival_name(civ_sets[row["cs"]], ident, n, pool_sets[row["ps"]], used_variants[row["uv"]]) == row["out"][i][ri], f"rival {row['cs']} {row['ps']} {row['uv']} {ident!r} {n}")
for row in NV["rivalNoUsed"]:
    for i, ident in enumerate(IDS):
        for ri, n in enumerate(NV["rivalIndexes"]):
            check(rival_name(civ_sets[row["cs"]], ident, n, pool_sets[row["ps"]], None) == row["out"][i][ri], f"rivalNoUsed {row['cs']} {row['ps']} {ident!r} {n}")
for row in NV["state"]:
    for i, ident in enumerate(IDS):
        for si_, idx in enumerate(NV["stateIndexes"]):
            check(state_name(civ_sets[row["cs"]], ident, idx, "Fallback", pool_sets[row["ps"]], used_variants[row["uv"]]) == row["out"][i][si_], f"state {row['cs']} {row['ps']} {row['uv']} {ident!r} {idx}")
for k, ps in enumerate(["real", "synth", "empty"]):
    for i, ident in enumerate(IDS):
        e = pool_sets[ps].get(ident)
        full = e["miasta_cywilizacji"] if e else []
        check(full[:REGULAR] == NV["miasta"][k]["cywilizacji"][i], f"miasta {ps} {ident!r}")
        check(full[REGULAR:COMMON] == NV["miasta"][k]["panstwa"][i], f"panstwa {ps} {ident!r}")
for k, ps in enumerate(["real", "synth"]):
    for i, ident in enumerate(IDS):
        for ui, uv in enumerate(["empty", "mixedx", "many"]):
            check(pool_pick(pool_sets[ps], ident, used_variants[uv]) == NV["aiFounded"][k]["out"][i][ui], f"aiFounded {ps} {ident!r} {uv}")


def validate_pools(pools, civs):
    errs = []
    for cv in civs:
        cid = cv.get("ikonaId")
        if not cid:
            continue
        e = pools.get(cid)
        if e is None:
            errs.append(f"{cid}: brak wpisu w city-names-pools.json")
            continue
        common = e.get("miasta_cywilizacji", [])
        if len(common) != COMMON:
            errs.append(f"{cid}: miasta_cywilizacji {len(common)} !== {COMMON}")
        if len(set(common)) != len(common):
            errs.append(f"{cid}: duplikaty we wspólnej liście miasta_cywilizacji")
        first = next(c_ for c_ in civs if c_.get("ikonaId") == cid)
        if first.get("nazwyMiast", []) != common:
            errs.append(f"{cid}: civs.json.nazwyMiast ≠ miasta_cywilizacji")
    return errs


idx = 0
for cs in ["real", "synth", "mixed"]:
    for ps in ["real", "synth", "empty"]:
        check(validate_pools(pool_sets[ps], civ_sets[cs]) == NV["validatePools"][idx]["out"], f"validatePools {cs} {ps}")
        idx += 1

# ======================================================================
# civ-roster.ts (reimplementacja)
# ======================================================================
def mulberry(seed):
    state = [seed & 0xFFFFFFFF]

    def nxt():
        state[0] = (state[0] + 0x6D2B79F5) & 0xFFFFFFFF
        t = state[0]
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    return nxt


RV = V["roster"]
for i, sd in enumerate(RV["seeds"]):
    rng = mulberry(sd % (1 << 32))
    for k in range(6):
        ncmp(rng(), jnum(RV["makeRng"][i][k]), f"makeRng seed={sd} #{k}")
check([x for x in ["a", None, "", "b", "a"] if x] == RV["civIdsFromRoster"]["out"], "civIdsFromRoster syntetyczny")
check([c_["ikonaId"] for c_ in civs_file["cywilizacje"] if c_.get("ikonaId")] == RV["civIdsFromRoster"]["real"], "civIdsFromRoster real")


def uniq(lst):
    seen, out = set(), []
    for x in lst:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


def shuffle(items, rng):
    s_ = list(items)
    for i in range(len(s_) - 1, 0, -1):
        j = math.floor(rng() * (i + 1))
        s_[i], s_[j] = s_[j], s_[i]
    return s_


def pick_pool(all_ids, player, types, num_ai, seed, pref):
    pool = uniq([x for x in all_ids if x])
    if not pool:
        return [player] if player else []
    need = max(1, min(types, 1 + num_ai))
    others = [x for x in pool if x != player]
    rng = mulberry(seed % (1 << 32))
    shuffled = shuffle(others, rng)
    need_others = min(need - 1, len(shuffled))
    oset = set(others)
    pv = uniq([x for x in pref if x and x != player and x in oset]) if pref is not None else []
    if pv:
        chosen = pv[:need_others]
        if len(chosen) < need_others:
            cs = set(chosen)
            chosen = chosen + [x for x in shuffled if x not in cs][: need_others - len(chosen)]
        picked = chosen
    else:
        picked = shuffled[:need_others]
    if player and player in pool:
        active = [player] + picked
    elif picked:
        active = picked[:need]
    else:
        active = [pool[0]]
    return uniq([x for x in active if x])[:need]


for row in RV["pool"]:
    got = pick_pool(RV["rosters"][row["r"]], row["player"], row["types"], row["numAi"], row["seed"], row["pref"])
    check(got == row["out"], f"pickActiveCivPool {row['r']} {row['player']!r} t={row['types']} n={row['numAi']} s={row['seed']}")
for row in RV["rotate"]:
    pref = row["pref"]
    if len(pref) <= 1:
        got = list(pref)
    else:
        off = math.floor(mulberry(row["seed"] % (1 << 32))() * len(pref))
        got = list(pref) if off == 0 else [pref[(i + off) % len(pref)] for i in range(len(pref))]
    check(got == row["out"], f"rotate {row['seed']} {pref}")
for row in RV["assign"]:
    ids_ = RV["rosters"][row["r"]]
    owners = sorted(row["owners"])
    active = pick_pool(ids_, row["player"], row["types"], len(owners), row["seed"], row["pref"])
    ai_types = [x for x in active if x != row["player"]]
    shuf = shuffle(ai_types, mulberry((row["seed"] + 7919) % (1 << 32)))
    fallback = next((x for x in ids_ if x and x != row["player"]), "grecy")
    out = {}
    for ix, o in enumerate(owners):
        out[o] = shuf[ix % len(shuf)] if shuf else fallback
    check(sorted(out.items()) == sorted((e[0], e[1]) for e in row["out"]), f"assign {row['r']} {row['player']!r} {owners} t={row['types']} s={row['seed']}")

print(f"RAZEM: {checks} sprawdzen, rozbieznosci: {len(diffs)}")
sys.exit(0 if not diffs else 1)
