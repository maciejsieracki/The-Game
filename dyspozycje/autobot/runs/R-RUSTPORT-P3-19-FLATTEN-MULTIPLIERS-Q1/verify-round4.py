#!/usr/bin/env python3
"""Runda 4 (P3-19): niezależna weryfikacja tabel data/derived/*.json.

Reguły zapisane z dokumentu P3-19 (sekcja R4), BEZ kodu weba (żadnego odczytu gra/src).
Zaokrąglenie = JS Math.round (półpiętro w górę: floor(x+0.5)), NIE round() Pythona.
Dane wejściowe (JSON z gra/data @ edb8fb56, odczyt przez git archive):
  verify-round4.py <data_dir_web> <derived_dir>
Wyjście: liczba porównań i rozbieżności per tabela; EXIT=0 gdy rozbieżności == 0.
"""
import json
import math
import os
import sys

if len(sys.argv) != 3:
    print("usage: verify-round4.py <web_gra_data_dir> <derived_dir>")
    sys.exit(2)
DATA, DER = sys.argv[1], sys.argv[2]


def load(p):
    with open(os.path.join(p), encoding="utf-8") as f:
        return json.load(f)


def rhu(x):
    return math.floor(x + 0.5)


def era_mult_epoka_nazwa(e):
    # Kamień 1, Brąz 2, Żelazo 4 (epochCostMultiplier: 1 / 2 / 4)
    n = e.strip().lower().replace("ą", "a").replace("ń", "n").replace("ż", "z").replace("ę", "e")
    if n in ("kamien", "kamień"):
        return 1
    if n in ("braz", "brąz"):
        return 2
    if n in ("zelazo", "żelazo"):
        return 4
    raise ValueError(e)


def era_mult_ordynal(e):
    # buildingEraCostMultiplier: 1 ->1, 2 ->2, >=3 ->4 (epokaWejscia)
    e = math.floor(e)
    if e >= 3:
        return 4
    if e >= 2:
        return 2
    return 1


def scale_epoka(cost, epoka):
    if cost == 0:
        return 0
    return max(1, rhu(cost * era_mult_epoka_nazwa(epoka)))


units = load(os.path.join(DATA, "units.json"))
buildings = load(os.path.join(DATA, "buildings.json"))
civs = load(os.path.join(DATA, "civs.json"))["cywilizacje"]
civs = list(civs.values()) if isinstance(civs, dict) else civs
civm = load(os.path.join(DATA, "civ-matrix.json"))["cywilizacje"]
tech = load(os.path.join(DATA, "tech.json"))
impr = load(os.path.join(DATA, "terrain-improvements.json"))
wonders = load(os.path.join(DATA, "wonders.json"))["cuda"]
econ = load(os.path.join(DATA, "econ-params.json"))
miasto = load(os.path.join(DATA, "miasto-params.json"))

results = {}


def check(name, n, bad):
    results[name] = (n, bad)


def get_tab(name):
    return load(os.path.join(DER, name))


# --- Praca budynków: poziom x pace x tryb x zniżka ---
PACE = {"niski": 1.0, "normalny": 2.0, "wysoki": 4.0}
TRYB = {  # (poziom, czy gracz) -> mnożnik trudności
    "normalny": 1,
    "latwy_gracz": 1,
    "latwy_ai": 2,
    "trudny_gracz": 2,
    "trudny_ai": 1,
}
civ_disc_vals = set([0])
for c in civs:
    d = 0.0
    for b in c.get("bonusy", []) or []:
        if b.get("realizuje") == "miasto" and b.get("typ") == "koszt_redukcja" and b.get("cel") == "budynki":
            v = b.get("wartosc")
            if isinstance(v, (int, float)) and v > 0:
                d += v
    civ_disc_vals.add(min(d, 0.75))
work_tab = get_tab("building-work-states.json")
n = bad = 0
seen_pairs = set()
for row in work_tab["wiersze"]:
    b = next(x for x in buildings if x["id"] == row["budynek"])
    lvl = row["poziom"]
    k = b["kosztBudowy"] + (b.get("przyrostKosztu") or 0) * (lvl - 1)
    base = rhu(k) * era_mult_ordynal(b["epokaWejscia"])
    seen_pairs.add((row["budynek"], lvl))
    for w in row["wartosci"]:
        d = w["znizka_cywilizacji"]
        if d not in civ_disc_vals:
            bad += 1
        after_civ = math.floor(base * (1 - d)) if (d > 0 and base > 0) else base
        after_civ = max(1, after_civ) if (d > 0 and base > 0) else after_civ
        after_pace = max(1, rhu(after_civ * PACE[w["pace"]]))
        after_glob = max(1, rhu(after_pace * 0.25 * 2 * 2))
        # poziom trudności: tryb -> mnożnik (nazwa trybu określa gracz/AI i poziom)
        m = TRYB[w["tryb"]]
        exp = max(1, rhu(after_glob * m))
        n += 1
        if exp != w["praca"]:
            bad += 1
        # zakup złotem budynku = max(1, round(praca x 2)) (production.ts:635-638)
        n += 1
        if max(1, rhu(w["praca"] * 2)) != w["zakup_zloto"]:
            bad += 1
expected_pairs = sum(b.get("maksPoziom", 1) for b in buildings)
if len(seen_pairs) != expected_pairs:
    bad += 1
check("building-work-states", n, bad)

# --- Złoto jednostek: pace x tryb x zniżka rekrutacji ---
def unit_cost_raw(u):
    raw = u.get("Pieniądz (koszt)")
    if isinstance(raw, (int, float)):
        if raw > 0:
            return raw
        if raw == 0 and u.get("Super-jednostka") == "TAK":
            return 0
    rola = u.get("Rola (linia)")
    key = {
        "Wsparcie": "jednostka_koszt_rola_wsparcie",
        "Dystans": "jednostka_koszt_rola_dystans",
        "Wręcz": "jednostka_koszt_rola_wrecz",
        "Wrecz": "jednostka_koszt_rola_wrecz",
        "Konnica": "jednostka_koszt_rola_konnica",
    }.get(rola)
    if key:
        return miasto[key]["wartosc"]
    return miasto["jednostka_koszt_domyslny"]["wartosc"]


rec_vals = set([0])
for v in (civm.values() if isinstance(civm, dict) else civm):
    p = v.get("params", {}).get("walka_koszt_rekrutacji_proc")
    if isinstance(p, (int, float)) and p > 0:
        rec_vals.add(p)
gold_tab = get_tab("unit-gold-states.json")
n = bad = 0
for row in gold_tab["wiersze"]:
    u = next(x for x in units if x["Jednostka"] == row["jednostka"])
    base = scale_epoka(unit_cost_raw(u), u["Epoka"])
    for w in row["wartosci"]:
        r = w["znizka_rekrutacji"]
        if r not in rec_vals:
            bad += 1
        x = base
        if base <= 0:
            exp = 0
        else:
            if r > 0:
                x = max(1, math.floor(x * (1 - r)))
            x = max(1, rhu(x * PACE[w["pace"]]))
            exp = max(1, rhu(x * TRYB[w["tryb"]]))
        n += 1
        if exp != w["pieniadz"]:
            bad += 1
check("unit-gold-states", n, bad)

# --- Utrzymanie złota budynku (per poziom) ---
up_tab = get_tab("building-gold-upkeep.json")
n = bad = 0
for row in up_tab["wiersze"]:
    b = next(x for x in buildings if x["id"] == row["budynek"])
    lvl = row["poziom"]
    raw = math.floor(b["utrzymanie"] + (b.get("przyrostUtrzymania") or 0) * (lvl - 1))
    exp = math.floor(math.floor(raw * 2) * era_mult_ordynal(b["epokaWejscia"]))
    n += 1
    if exp != row["utrzymanie_zlota"]:
        bad += 1
check("building-gold-upkeep", n, bad)

# --- Żywność wojska (w setnych) ---
def econ_val(group, key, diff, fb):
    v = econ[group][key].get(diff)
    return v if isinstance(v, (int, float)) else fb


food_tab = get_tab("unit-food.json")
n = bad = 0
for row in food_tab["wiersze"]:
    u = next(x for x in units if x["Jednostka"] == row["jednostka"])
    direct = u.get("żywność/turę")
    base = scale_epoka(direct, u["Epoka"]) if isinstance(direct, (int, float)) else None
    for w in row["wartosci"]:
        diff = w["poziom_trudnosci"]
        ruch = econ_val("ekonomia_miasta", "zywnosc_jednostka_ruch", diff, 1)
        oboz = econ_val("ekonomia_miasta", "zywnosc_jednostka_oboz", diff, 0.5)
        m_own = econ_val("ekonomia_miasta", "zywnosc_mnoznik_terytorium_wlasne", diff, 1)
        m_out = econ_val("ekonomia_miasta", "zywnosc_mnoznik_poza_terytorium", diff, 2)
        b = base if base is not None else ruch
        if b <= 0:
            food = 0.0
        else:
            if w["stan"] == "oboz":
                b = b * (oboz / (ruch or 1))
            mult = m_own if w["terytorium"] == "wlasne" else m_out
            f = b * mult
            food = 0.0 if f <= 0 else f * 4
        setne = food * 100
        exp = rhu(setne)
        n += 1
        if abs(setne - exp) > 1e-6 or exp != w["zywnosc_setne"]:
            bad += 1
check("unit-food", n, bad)

# --- Racje ---
racje_tab = get_tab("racje.json")
n = bad = 0
for row in racje_tab["wiersze"]:
    lvl = row["poziom_racji"]
    c = min(6, max(0, lvl))
    c = rhu(c / 0.5) * 0.5
    exp = c * 2
    n += 1
    if exp != row["zywnosc_na_mieszkanca"]:
        bad += 1
check("racje", n, bad)

# --- Badania ---
TEMPO = {"szybka": 1.0, "standardowa": 2.0, "dluga": 4.0}
res_tab = get_tab("research-costs.json")
trows = {t["Technologia"]: t for t in tech["technologie"]}
n = bad = 0
for row in res_tab["wiersze"]:
    t = trows[row["technologia"]]
    base = t["Koszt nauki"]
    for w in row["wartosci"]:
        x = max(1, rhu(base * TEMPO[w["tempo"]]))
        x = max(1, rhu(x * 2))
        if t["Epoka"] in ("Brąz", "Żelazo"):
            x = max(1, rhu(x * 2))
        exp = max(1, rhu(x * TRYB[w["tryb"]]))
        n += 1
        if exp != w["koszt"]:
            bad += 1
check("research-costs", n, bad)

# --- Ulepszenia terenu ---
imp_tab = get_tab("improvement-work.json")
n = bad = 0
for row in imp_tab["wiersze"]:
    base = impr[row["ulepszenie"]].get("koszt_praca") or 0
    stone = 0 if base <= 0 else max(1, rhu(base * 2))
    mult = {1: 1, 2: 2, 3: 4}.get(impr[row["ulepszenie"]]["epoka"], None)
    exp = 0 if stone <= 0 else stone * mult
    n += 1
    if exp != row["praca"]:
        bad += 1
check("improvement-work", n, bad)

# --- Cuda ---
w_tab = get_tab("wonder-work.json")
n = bad = 0
wk = {w["id"]: w["kosztBudowy"] for w in wonders}
for row in w_tab["wiersze"]:
    k = wk[row["cud"]]
    exp = 0 if k <= 0 else max(1, rhu(k * 2))
    n += 1
    if exp != row["praca"] or exp != row["zywnosc"]:
        bad += 1
check("wonder-work", n, bad)

# --- Magazyn (era x poziom trudności) ---
st_tab = get_tab("storage-caps.json")
n = bad = 0
for row in st_tab["wiersze"]:
    e = row["epoka_ordynal"]
    mult = 2 ** (e - 1)
    for w in row["wartosci"]:
        d = w["poziom_trudnosci"]
        exp_base = econ["globalne"]["magazyn_baza_surowce"][d] * mult
        exp_bonus = econ["globalne"]["magazyn_bonus_surowce_na_budynek"][d] * mult
        n += 3
        if exp_base != w["surowce_baza_epoki"]:
            bad += 1
        if exp_bonus != w["surowce_bonus_na_magazyn_epoki"]:
            bad += 1
        if econ["globalne"]["magazyn_baza_zywnosc"][d] != w["zywnosc_baza"]:
            bad += 1
        if econ["globalne"]["magazyn_mnoznik_spichlerz"][d] != w["zywnosc_mnoznik_spichlerz"]:
            bad += 1
check("storage-caps", n, bad)

# --- Tabele rundy 3 (Praca bazowa i złoto bazowe) — zgodność z wyjściem rundy 3 ---
w3 = get_tab("building-work-costs.json")
n = bad = 0
for row in w3["wiersze"]:
    b = next(x for x in buildings if x["id"] == row["budynek"])
    m = era_mult_ordynal(b["epokaWejscia"])
    n += 1
    if row["praca_bazowa"] != b["kosztBudowy"] * m or row["praca_przyrost"] != (b.get("przyrostKosztu") or 0) * m:
        bad += 1
check("building-work-costs (runda 3)", n, bad)

total_n = sum(v[0] for v in results.values())
total_bad = sum(v[1] for v in results.values())
for k, (nn, bb) in results.items():
    print(f"{k}: porownan={nn} rozbieznosci={bb}")
print(f"RAZEM porownan={total_n} rozbieznosci={total_bad}")
print(f"EXIT={0 if total_bad == 0 else 1}")
sys.exit(0 if total_bad == 0 else 1)
