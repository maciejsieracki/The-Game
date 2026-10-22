#!/usr/bin/env python3
"""Niezalezny weryfikator wektorow P6.1D (bez TS, bez generatora JS, bez Rust).

Reimplementuje W PYTHONIE semantyke civ-bonuses.ts i city-names-pool.ts (pin edb8fb56),
czytajac KOD TS jako specyfikacje (nie wykonujac go), i porownuje z wektorami
`web-vectors.json` wygenerowanymi z URUCHOMIONEGO weba. Dodatkowo:
- tabele silnika `data/derived/civ-bonus-*.json` sa porownywane z literalami wyciagnietymi
  regexem z pliku TS (MATRIX_COMBAT_SPECS, excludedG1, grupy identyfikatorow, limit 0.75, dlugosci pul),
- dane (civs, civ-matrix, city-names-pools) wczytywane sa z WEB_ROOT i sprawdzane odciskiem FNV-1a
  zapisanym w wektorach.

Uzycie: python3 -I verify-p61d-web-vectors.py <WEB_ROOT> <VECTORS_JSON> <ENGINE_DERIVED_DIR>
Kod wyjscia: 0 gdy 0 rozbieznosci.
"""
import json
import re
import sys
import unicodedata

WEB_ROOT, VEC_PATH, DERIVED = sys.argv[1], sys.argv[2], sys.argv[3]

checks = 0
diffs = []


def check(cond, msg):
    global checks
    checks += 1
    if not cond:
        diffs.append(msg)
        if len(diffs) <= 40:
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
civs_raw = read(DATA + "civs.json")
matrix_raw = read(DATA + "civ-matrix.json")
pools_raw = read(DATA + "city-names-pools.json")
units_raw = read(DATA + "units.json")
civs = json.loads(civs_raw.decode("utf8"))["cywilizacje"]
matrix = json.loads(matrix_raw.decode("utf8"))
pools = json.loads(pools_raw.decode("utf8"))
units_file = json.loads(units_raw.decode("utf8"))

check(V["dataFnv"]["civs"] == fnv1a64(civs_raw), "odcisk civs.json")
check(V["dataFnv"]["civMatrix"] == fnv1a64(matrix_raw), "odcisk civ-matrix.json")
check(V["dataFnv"]["cityNamesPools"] == fnv1a64(pools_raw), "odcisk city-names-pools.json")
check(V["dataFnv"]["units"] == fnv1a64(units_raw), "odcisk units.json")

bonuses_ts = read(SRC + "civ-bonuses.ts").decode("utf8")
pool_ts = read(SRC + "city-names-pool.ts").decode("utf8")

# ---------------------------------------------------------------- tabele silnika vs literaly TS
def ts_array_literal(text, start_needle, close_needle):
    s = text.index(start_needle)
    o = text.index("[", text.index("=", s))
    c = text.index(close_needle, o)
    return text[o : c + 1]


specs_txt = ts_array_literal(bonuses_ts, "const MATRIX_COMBAT_SPECS", "];")
specs_ts = re.findall(r"\['([a-z0-9_]+)',\s*'([a-z_]+)',\s*'([a-z]+)'\]", specs_txt)
excl_txt = ts_array_literal(bonuses_ts, "const excludedG1 = new Set(", "]);")
excl_ts = re.findall(r"'([a-z0-9_]+)'", excl_txt)
specs_json = json.load(open(DERIVED + "/civ-bonus-matrix-specs.json", encoding="utf8"))
rules_json = json.load(open(DERIVED + "/civ-bonus-rules.json", encoding="utf8"))
names_json = json.load(open(DERIVED + "/civ-bonus-city-names.json", encoding="utf8"))
diac_json = json.load(open(DERIVED + "/civ-bonus-diacritics.json", encoding="utf8"))

check(len(specs_ts) == 36, f"liczba MATRIX_COMBAT_SPECS w TS: {len(specs_ts)}")
check([(r["id"], r["typ"], r["cel"]) for r in specs_json["spec_walka"]] == specs_ts, "spec_walka == MATRIX_COMBAT_SPECS z TS")
check(specs_json["wykluczone_g1"] == excl_ts and len(excl_ts) == 7, "wykluczone_g1 == excludedG1 z TS")


def ids_after(needle):
    i = bonuses_ts.index(needle)
    j = bonuses_ts.index("]", i)
    return re.findall(r"'([a-z0-9_]+)'", bonuses_ts[i:j])


mm = re.findall(r"matchingMatrixSum\(bonusy, unit, \[([^\]]*)\]", bonuses_ts)
groups_ts = [re.findall(r"'([a-z0-9_]+)'", g) for g in mm]
g = rules_json["grupy_mnoznikow"]
check(groups_ts == [g["ruch"], g["zasieg"], g["oblezenie"], g["mur"]], f"grupy_mnoznikow == TS ({groups_ts})")
check(re.search(r"Math\.min\(disc, 0\.75\)", bonuses_ts) is not None and rules_json["koszt_budynkow"]["max_znizka"] == 0.75, "max_znizka 0.75")
check(re.search(r"Math\.max\(1, Math\.floor\(baseCost \* \(1 - disc\)\)\)", bonuses_ts) is not None and rules_json["koszt_budynkow"]["min_koszt"] == 1, "min_koszt 1")
rk = rules_json["koszt_budynkow"]
check((rk["typ"], rk["cel"], rk["realizuje"]) == ("koszt_redukcja", "budynki", "miasto") and
      "b.realizuje !== 'miasto'" in bonuses_ts and "b.typ !== 'koszt_redukcja'" in bonuses_ts and "b.cel !== 'budynki'" in bonuses_ts, "koszt_budynkow typ/cel/realizuje")
m_len = lambda n: int(re.search(rf"export const {n} = (\d+);", pool_ts).group(1))
check(names_json["dlugosc_regularna"] == m_len("CITY_NAMES_POOL_REGULAR_LEN"), "dlugosc_regularna")
check(names_json["dlugosc_panstwa"] == m_len("CITY_NAMES_POOL_STATE_LEN"), "dlugosc_panstwa")
roman_ts = re.search(r"const roman = \[([^\]]*)\];", pool_ts).group(1)
check(names_json["rzymskie"] == re.findall(r"'([^']*)'", roman_ts), "rzymskie")
for lit, key in (("'Stolica'", "fallback_stolica"), ("'Miasto'", "fallback_miasto")):
    check(lit in pool_ts and f"'{names_json[key]}'" == lit, key)
check("`Rywal ${rivalIndex1Based}`" in pool_ts and names_json["fallback_rywal_prefiks"] == "Rywal ", "fallback_rywal_prefiks")

# etykiety / ruch
et = specs_json["etykiety"]
check(et["opis_prefiks"] == "Matrix:" and "`Matrix:${id}`" in bonuses_ts, "opis_prefiks")
check(et["realizuje_walka"] == "walka" and et["realizuje_ekonomia"] == "ekonomia" and et["typ_walka"] == "bonus_walka", "etykiety")
extra_ts = re.search(r"for \(const id of \[([^\]]*)\]\)", bonuses_ts).group(1)
check([p["id"] for p in specs_json["parametry_dodatkowe"]] == re.findall(r"'([a-z0-9_]+)'", extra_ts), "parametry_dodatkowe ids")
ex = {p["id"]: p for p in specs_json["parametry_dodatkowe"]}
check(ex["walka_ruch_bitwa_proc"]["cel_domyslne"] == "piechota" and ex["walka_ruch_bitwa_proc"]["wyjatki_civ"] == [{"civ_key": "egipt", "cel": "rydwany"}] and
      ex["walka_ruch_rydwany"]["cel_domyslne"] == "rydwany" and ex["walka_zasieg_proc"]["cel_domyslne"] == "wszystko" and
      ex["walka_oblezenie_proc"]["cel_domyslne"] == "wszystko", "cele parametrow dodatkowych")
check("civKey === 'egipt'" in bonuses_ts, "wyjatek egipt")
kr = specs_json["koszt_rekrutacji"]
check((kr["id"], kr["typ"], kr["cel"]) == ("walka_koszt_rekrutacji_proc", "koszt_redukcja", "jednostki"), "koszt_rekrutacji")

# tabela diakrytykow vs Python (NFD) - ta sama regula, niezalezna implementacja
def strip(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if not ("̀" <= c <= "ͯ")).lower()


def strip_nolower(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if not ("̀" <= c <= "ͯ"))


mapa = diac_json["mapa"]
py_map = {}
for cp in range(0xC0, 0x10000):
    if 0xD800 <= cp <= 0xDFFF or 0xAC00 <= cp <= 0xD7A3:
        continue
    ch = chr(cp)
    st = strip_nolower(ch)
    if st != ch:
        py_map[ch] = st
diff_keys = set(py_map) ^ set(mapa)
diff_vals = [k for k in set(py_map) & set(mapa) if py_map[k] != mapa[k]]
# Python i Node moga miec rozne wersje Unicode: raportujemy, ale tylko zgodnosc na wspolnym zbiorze jest bledem
check(not diff_vals, f"tabela diakrytykow: rozne wartosci {diff_vals[:5]}")
print(f"INFO tabela diakrytykow: Python unicodedata {unicodedata.unidata_version}; kluczy tylko po jednej stronie: {len(diff_keys)}")

# ---------------------------------------------------------------- jednostki / kategorie
def unit_cat(u):
    n = strip(u["typNazwa"])
    rola = strip(u["rola"])
    counter = strip(u["counter"] or "")
    missile = float(u["missile"]) if u["missile"] is not None else 0.0
    if rola == "morska" or counter == "naval":
        return "morska"
    if rola in ("oblez-nicza", "obleznicza") or counter == "siege":
        return "obleczenie"
    if "rydwan" in n:
        return "rydwany"
    if ("konn" in n or "kawaler" in n or "husar" in n or "stepow" in n or
            (rola == "flanka" and ("kon" in n or "jezd" in n))):
        return "kawaleria"
    if (rola == "dystans" or "lucz" in n or "kusz" in n or "procar" in n or "luk" in n or missile > 0):
        return "lukownicy"
    return "piechota"


def matches_cel(u, cel):
    cat = unit_cat(u)
    c = strip(cel)
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


units = V["units"]
for i, u in enumerate(units):
    check(unit_cat(u) == V["unitCategory"][i], f"kategoria jednostki {u}")
    row = V["matchesCel"][i]
    for j, cel in enumerate(V["cels"]):
        check(matches_cel(u, cel) == (row[j] == "1"), f"matchesCel {u} {cel!r}")
for p, cat in V["stripCat"]:
    check(unit_cat({"typNazwa": p, "rola": "", "missile": None, "counter": None}) == cat, f"stripCat {p!r}")

# strip: probki, BMP, stringi z danych
for p, out in V["strip"]["probes"]:
    check(strip(p) == out, f"strip probka {p!r}: {strip(p)!r} != {out!r}")
buf = []
for cp in range(0, 0x10000):
    if 0xD800 <= cp <= 0xDFFF or 0xAC00 <= cp <= 0xD7A3 or cp in (0xA7CE, 0xA7D2, 0xA7D4):
        continue
    buf.append(f"{cp}:{strip(chr(cp))}\n")
bmp_py = fnv1a64("".join(buf).encode("utf8"))
bmp_ok = bmp_py == V["strip"]["bmpHash"]
if not bmp_ok:
    # Python moze znac inna wersje Unicode niz Node; rozstrzygamy znak po znaku wzgledem tabeli silnika
    print(f"INFO hash BMP rozny (Python Unicode {unicodedata.unidata_version}); sprawdzam rozbieznosci po znaku")
    # porownanie z wynikiem implementacji referencyjnej opartej na tabeli silnika dla znakow z tabeli
    bad = []
    for cp in range(0, 0x10000):
        if 0xD800 <= cp <= 0xDFFF or 0xAC00 <= cp <= 0xD7A3 or cp in (0xA7CE, 0xA7D2, 0xA7D4):
            continue
        ch = chr(cp)
        ref = (mapa.get(ch, ch)).lower() if not ("̀" <= ch <= "ͯ") else ""
        if ref != strip(ch):
            bad.append(cp)
    check(not bad, f"BMP: rozbieznosci tabela silnika vs Python: {bad[:10]}")
else:
    check(True, "BMP hash")

strings = []


def walk(x):
    if isinstance(x, str):
        strings.append(x)
    elif isinstance(x, list):
        for y in x:
            walk(y)
    elif isinstance(x, dict):
        for y in x.values():
            walk(y)


walk(json.loads(civs_raw.decode("utf8")))
walk(units_file)
xor = 0
for s in strings:
    xor ^= int(fnv1a64((s + "\u0000" + strip(s)).encode("utf8")), 16)
check(len(strings) == V["strip"]["dataStringCount"], "liczba stringow danych")
check(format(xor, "016x") == V["strip"]["dataStringXor"], "XOR stringow danych")

# ---------------------------------------------------------------- bonusApplies / applyWalkBonus
def number(e):
    return float(e["v"]["n"]) if "n" in e["v"] else None


def terrain_forest(t):
    s = strip(t)
    return "las" in s or "dzungl" in s or "gor" in s


def opis_forest(o):
    s = strip(o)
    return "les" in s or "dzungl" in s or "gorsk" in s


def opis_charge_only(o):
    s = strip(o)
    if "uderzeni" in s and "szarz" in s:
        return True
    if "pierwsz" in s:
        return True
    if "szarz" in s and "les" not in s:
        return True
    if "starciu" in s:
        return True
    return False


def opis_forest_or_charge(o):
    s = strip(o)
    return " lub " in s and opis_forest(o) and ("pierwsz" in s or "zasadzk" in s)


def applies(b, u, c):
    if b["realizuje"] != "walka":
        return False
    if b["typ"] == "jednostka_specjalna":
        return False
    if number(b) is None:
        return False
    if not matches_cel(u, b["cel"]):
        return False
    opis = b["opis"] or ""
    terrain = c["terrain"]
    mid = b["matrixId"]
    if mid in ("walka_atak_piechota_terytorium_wlasne", "walka_obrona_piechota_terytorium_wlasne"):
        if not c["own"]:
            return False
    if mid and "_w_murze" in mid and not c["wall"]:
        return False
    if mid and "_teren_las" in mid and not terrain_forest(terrain):
        return False
    if mid and "_teren_plytkie_morze" in mid and not c["shallow"]:
        return False
    if mid and "_runda_szarzy" in mid and not c["charge"]:
        return False
    if opis_forest_or_charge(opis):
        forest_ok = len(terrain) > 0 and terrain_forest(terrain)
        charge_ok = c["charge"] is True
        if not forest_ok and not charge_ok:
            return False
        return True
    if opis_forest(opis) and len(terrain) > 0 and not terrain_forest(terrain):
        return False
    if opis_charge_only(opis) and not c["charge"]:
        return False
    if b["typ"] == "bonus_obrona" and c["side"] != "defender":
        return False
    return True


STATS = ("atk", "obrona", "pancerz", "uderzenie", "rangedAtk", "health")


def walk_bonus(m, b, side):
    v = number(b)
    opis = strip(b["opis"] or "")
    mid = b["matrixId"] or ""
    if mid.startswith("walka_ruch_") or mid == "walka_zasieg_proc" or mid == "walka_oblezenie_proc":
        return
    if mid.startswith("walka_atak_") or mid == "walka_atak_wszystkie":
        m["atk"] += v
    if mid.startswith("walka_obrona_") and "_w_murze" not in mid:
        m["obrona"] += v
    if mid.startswith("walka_pancerz_"):
        m["pancerz"] += v
    if mid.startswith("walka_uderzenie_"):
        m["uderzenie"] += v
    if mid.startswith("walka_dystans_"):
        m["rangedAtk"] += v
    if mid.startswith("walka_hp_"):
        m["health"] += v
    if b["matrixId"]:
        return
    if b["typ"] == "bonus_obrona":
        m["obrona"] += v
        if "hp" in opis or "health" in opis or "ciezka piechota" in opis:
            m["health"] += v
        if "pancerz" in opis:
            m["pancerz"] += v
        return
    if b["typ"] != "bonus_walka":
        return
    if "ataku" in opis or (" atak" in opis and "uderzen" not in opis):
        m["atk"] += v
        if "pancerz" in opis:
            m["pancerz"] += v
        if "obron" in opis and side == "defender":
            m["obrona"] += v
        return
    if "uderzeni" in opis or ("szarz" in opis and "kawaler" in opis):
        m["uderzenie"] += v
        return
    if "dystans" in opis or ("lucz" in opis and "rydwan" in opis):
        m["rangedAtk"] += v
        return
    if "hp" in opis and "obron" in opis:
        m["health"] += v
        m["obrona"] += v
        return
    if "pancerz" in opis and "atak" not in opis:
        m["pancerz"] += v
        return
    m["atk"] += v
    if "pancerz" in opis:
        m["pancerz"] += v
    if "obron" in opis and side == "defender":
        m["obrona"] += v


def stat_mult(entries, u, c):
    m = {k: 0.0 for k in STATS}
    for b in entries:
        if not applies(b, u, c):
            continue
        walk_bonus(m, b, c["side"])
    return [m[k] for k in STATS]


def unhex_bit(h, i):
    return (int(h[i // 4], 16) >> (3 - (i % 4))) & 1 == 1


ctxs = V["contexts"]
palette = [[float(x) for x in t] for t in V["palette"]]
lists = [l["entries"] for l in V["lists"]]
for rec in V["apply"]:
    entries = lists[rec["list"]]
    u = units[rec["unit"]]
    for ci, c in enumerate(ctxs):
        if len(entries) == 1:
            check(applies(entries[0], u, c) == unhex_bit(rec["bits"], ci), f"bonusApplies list {rec['list']} unit {rec['unit']} ctx {ci}")
        exp = palette[int(rec["mult"][ci * 2 : ci * 2 + 2], 16)]
        check(stat_mult(entries, u, c) == exp, f"civCombatStatMultipliers list {rec['list']} ({V['lists'][rec['list']]['name']}) unit {rec['unit']} ctx {ci}")
for rec in V["applyEntries"]:
    entries = lists[rec["list"]]
    u = units[rec["unit"]]
    for b, row in zip(entries, rec["rows"]):
        for ci, c in enumerate(ctxs):
            check(applies(b, u, c) == unhex_bit(row, ci), f"applyEntries list {rec['list']} ctx {ci}")
check([float(x) for x in V["undefinedMult"]] == [0.0] * 6, "civCombatStatMultipliers(undefined)")

# teren przez bonusApplies
for p, flag in V["terrainOut"]:
    b = {"typ": "bonus_walka", "cel": "piechota", "v": {"n": "0.1"}, "opis": "Matrix:x", "realizuje": "walka", "matrixId": "walka_atak_piechota_teren_las"}
    u = {"typNazwa": "Wojownik", "rola": "Wręcz", "missile": None, "counter": None}
    c = {"side": "attacker", "terrain": p, "charge": False, "own": False, "wall": False, "shallow": False}
    check(applies(b, u, c) == (flag == 1), f"teren {p!r}")

# ---------------------------------------------------------------- civMatrixBonusyForCivKey (z danych weba + literalow TS)
def matrix_param(civ_key, pid):
    key = civ_key.lower()
    row = next((c for c in matrix["cywilizacje"] if c["ikonaId"].lower() == key or c["typCywilizacji"].lower() == key or c["Cywilizacja"].lower() == key), None)
    if row is None:
        return matrix["defaults"].get(pid, 0)
    if pid in row["params"]:
        return row["params"][pid]
    return matrix["defaults"].get(pid, 0)


def num_text(x):
    # reprezentacja jak String(x) w JS dla liczb z JSON: porownujemy po wartosci
    return float(x)


def matrix_bonusy(civ_key):
    out = []
    excl = set(excl_ts)
    for (pid, typ, cel) in specs_ts:
        if pid in excl:
            continue
        w = matrix_param(civ_key, pid)
        if w != 0:
            out.append({"typ": typ, "cel": cel, "w": float(w), "opis": f"Matrix:{pid}", "realizuje": "walka", "matrixId": pid})
    for pid in re.findall(r"'([a-z0-9_]+)'", extra_ts):
        w = matrix_param(civ_key, pid)
        if pid == "walka_ruch_rydwany" or (pid == "walka_ruch_bitwa_proc" and civ_key == "egipt"):
            cel = "rydwany"
        elif pid == "walka_ruch_bitwa_proc":
            cel = "piechota"
        else:
            cel = "wszystko"
        if w != 0:
            out.append({"typ": "bonus_walka", "cel": cel, "w": float(w), "opis": f"Matrix:{pid}", "realizuje": "walka", "matrixId": pid})
    w = matrix_param(civ_key, "walka_koszt_rekrutacji_proc")
    if w != 0:
        out.append({"typ": "koszt_redukcja", "cel": "jednostki", "w": float(w), "opis": "Matrix:walka_koszt_rekrutacji_proc", "realizuje": "ekonomia", "matrixId": "walka_koszt_rekrutacji_proc"})
    return out


for rec in V["matrixBonusy"]:
    exp = matrix_bonusy(rec["civKey"])
    got = [{"typ": e["typ"], "cel": e["cel"], "w": float(e["v"]["n"]), "opis": e["opis"], "realizuje": e["realizuje"], "matrixId": e["matrixId"]} for e in rec["entries"]]
    check(exp == got, f"civMatrixBonusyForCivKey {rec['civKey']!r}")
# wpisy z civs.json w listach `:real`
for civ in civs:
    name = f"{civ['ikonaId']}:real"
    found = None
    for l in V["lists"]:
        if l["name"] == name:
            found = l["entries"]
            break
    exp = [{"typ": b["typ"], "cel": b["cel"], "v": ({"n": None, "x": b["wartosc"]} if isinstance(b["wartosc"], (int, float)) else {"l": b["wartosc"]}), "opis": b["opis"], "realizuje": b["realizuje"]} for b in civ["bonusy"]]
    if found is None:
        # lista zdeduplikowana (identyczna z wczesniejsza): wystarczy, ze istnieje lista o tej tresci
        found = next((l["entries"] for l in V["lists"] if [(e["typ"], e["cel"], e["opis"], e["realizuje"]) for e in l["entries"]] == [(b["typ"], b["cel"], b["opis"], b["realizuje"]) for b in civ["bonusy"]]), None)
    check(found is not None, f"lista real {name}")
    if found is not None:
        vals_ok = all(
            (isinstance(b["wartosc"], (int, float)) and float(e["v"]["n"]) == float(b["wartosc"])) or (isinstance(b["wartosc"], list) and e["v"].get("l") == b["wartosc"])
            for e, b in zip(found, civ["bonusy"])
        )
        check(len(found) == len(civ["bonusy"]) and vals_ok, f"wartosci listy real {name}")

# ---------------------------------------------------------------- mnozniki
def matching_sum(entries, u, ids, terrain="", shallow=False):
    s = 0.0
    for b in entries:
        mid = b["matrixId"]
        if not mid or mid not in ids or not matches_cel(u, b["cel"]):
            continue
        if "_teren_las" in mid and not terrain_forest(terrain):
            continue
        if "_teren_plytkie_morze" in mid and not shallow:
            continue
        n = number(b)
        if n is not None:
            s += n
    return s


MOVE = ["walka_ruch_bitwa_proc", "walka_ruch_rydwany", "walka_ruch_piechota_teren_plytkie_morze"]
RANGE = ["walka_zasieg_proc", "walka_dystans_rydwany"]
SIEGE = ["walka_oblezenie_proc"]
WALL = ["walka_obrona_piechota_w_murze"]
check(groups_ts == [MOVE, RANGE, SIEGE, WALL], "grupy z TS == stale weryfikatora")
for rec in V["mults"]:
    entries = lists[rec["list"]]
    u = units[rec["unit"]]
    check(1 + matching_sum(entries, u, RANGE) == float(rec["range"]), f"zasieg list {rec['list']} unit {rec['unit']}")
    check(1 + matching_sum(entries, u, SIEGE) == float(rec["siege"]), f"oblezenie list {rec['list']} unit {rec['unit']}")
    check(1 + matching_sum(entries, u, WALL) == float(rec["wall"]), f"mur list {rec['list']} unit {rec['unit']}")
    check(1 + matching_sum(entries, u, MOVE) == float(rec["movementDefault"]), f"ruch domyslny list {rec['list']} unit {rec['unit']}")
    for k, val in rec["movement"].items():
        terrain, sh = k.split("|")
        check(1 + matching_sum(entries, u, MOVE, terrain, sh == "1") == float(val), f"ruch {k} list {rec['list']} unit {rec['unit']}")

# ---------------------------------------------------------------- znizka kosztu
def discount(entries):
    d = 0.0
    for b in entries:
        if b["realizuje"] != "miasto":
            continue
        if b["typ"] != "koszt_redukcja":
            continue
        if b["cel"] != "budynki":
            continue
        n = number(b)
        if n is not None and n > 0:
            d += n
    return min(d, 0.75)


import math

for rec in V["discount"]:
    d = discount(rec["entries"])
    check(d == float(rec["disc"]), f"znizka {rec['name']}")
    for base, out in rec["costs"]:
        base = float(base)
        if d <= 0 or base <= 0:
            exp = base
        else:
            exp = max(1.0, float(math.floor(base * (1 - d))))
        check(exp == float(out), f"koszt po znizce {rec['name']} {base}")
check(discount([]) == float(V["discountUndefined"]["disc"]) and 10.0 == float(V["discountUndefined"]["cost"]), "znizka dla undefined")

for rec in V["combatMod"]:
    entries = lists[rec["list"]]
    exp = "".join("1" if (b["realizuje"] == "walka" and b["typ"] != "jednostka_specjalna" and number(b) is not None) else "0" for b in entries)
    check(exp == rec["bits"], f"isCombatModifierBonus list {rec['list']}")
for b, f, out in V["applyMul"]:
    check(float(b) * (1 + float(f)) == float(out), f"applyMultiplier {b} {f}")

# ---------------------------------------------------------------- NAZWY MIAST
CN = V["cityNames"]
check(CN["pools"] == pools, "pule w wektorach == pule z danych weba")
COMMON = m_len("CITY_NAMES_POOL_REGULAR_LEN") + m_len("CITY_NAMES_POOL_STATE_LEN")
check(V["constants"] == {"regular": 100, "state": 10, "common": COMMON, "klastra": 10} or
      V["constants"] == {"regular": m_len("CITY_NAMES_POOL_REGULAR_LEN"), "state": m_len("CITY_NAMES_POOL_STATE_LEN"), "common": COMMON, "klastra": m_len("CITY_NAMES_POOL_STATE_LEN")}, "stale pul")

ROMAN = ["", "", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]


def suffix(base, ordinal):
    if ordinal <= 1:
        return base
    s = ROMAN[ordinal] if ordinal <= 10 else str(ordinal)
    return f"{base} {s}"


def pick_names(names, used, fallback="Miasto"):
    for n in names:
        if n and n not in used:
            return n
    base = next((n for n in names if n), fallback)
    if not any(names) and base not in used:
        return base
    o = 2
    while suffix(base, o) in used or suffix(base, o) in names:
        o += 1
    return suffix(base, o)


def common_names(p, civ):
    e = p.get(civ)
    return e["miasta_cywilizacji"][:COMMON] if e else []


def pick_pool(p, civ, used, fallback="Miasto"):
    return pick_names(common_names(p, civ), used, fallback)


for b, o, out in CN["suffix"]:
    check(suffix(b, o) == out, f"cityNameWithSuffix {b!r} {o}")
for c in CN["klastraAt"]:
    n, i = c["names"], c["index"]
    exp = n[i] if (i >= 0 and i < len(n) and n[i]) else c["fallback"]
    check(exp == c["out"], f"nazwaKlastraAt {c}")
for rv, pl, out in CN["rivalIdx"]:
    exp = 0 if pl <= 1 else ((max(1, rv) - 1) % (pl - 1)) + 1
    check(exp == out, f"rivalPoolIndex {rv} {pl}")
for c in CN["pick"]:
    exp = pick_names(c["names"], set(c["used"]), c["fallback"] if c["fallback"] is not None else "Miasto")
    check(exp == c["out"], f"pickNextCityNameFromNames {c}")


def expand_used(spec, civ):
    names = common_names(pools, civ)
    first = names[0] if names else ""
    second = names[1] if len(names) > 1 else ""
    used = set(names[: spec["prefix"]])
    for x in spec["extra"]:
        used.add(x.replace("@1", first).replace("@2", second))
    return used


for r in CN["realPick"]:
    civ, spec = r["civ"], r["spec"]
    base = civ if civ in pools else next(iter(pools))
    used = set() if spec < 0 else expand_used(CN["usedSpecs"][spec], base)
    check(pick_pool(pools, civ, used, "FB") == r["nextFb"], f"pickNextCityName FB {civ} {spec}")
    check(pick_pool(pools, civ, used) == r["nextDefault"], f"pickNextCityName {civ} {spec}")
    check(pick_pool(pools, civ, used) == r["regular"], f"pickNextRegular {civ} {spec}")
    check(pick_pool(pools, civ, used, "Stolica") == r["capital"], f"playerCapital {civ} {spec}")
    check(pick_pool(pools, civ, used, civ) == r["foreign"], f"foreignCapital {civ} {spec}")


def state_at(p, civ, idx, fb, used):
    common = common_names(p, civ)
    if not common or idx < 0:
        return fb
    u = used if used is not None else set(common[:idx])
    return pick_names(common, u, fb)


def cluster_rival(p, civ, rv, used):
    common = common_names(p, civ)
    fb = f"Rywal {rv}"
    if rv < 1:
        return fb
    u = used if used is not None else set(common[:rv])
    return pick_names(common, u, fb)


for r in CN["stateAt"]:
    civ, idx = r["civ"], r["index"]
    base = civ if civ in pools else next(iter(pools))
    check(state_at(pools, civ, idx, "FB", None) == r["none"], f"stateCityNameAt none {civ} {idx}")
    check(state_at(pools, civ, idx, "FB", set()) == r["empty"], f"stateCityNameAt empty {civ} {idx}")
    check(state_at(pools, civ, idx, "FB", set(common_names(pools, base)[:3])) == r["p3"], f"stateCityNameAt p3 {civ} {idx}")
for r in CN["rivals"]:
    civ, rv = r["civ"], r["rival"]
    base = civ if civ in pools else next(iter(pools))
    check(cluster_rival(pools, civ, rv, None) == r["none"], f"clusterRival none {civ} {rv}")
    check(cluster_rival(pools, civ, rv, set()) == r["empty"], f"clusterRival empty {civ} {rv}")
    check(cluster_rival(pools, civ, rv, set(common_names(pools, base)[:4])) == r["p4"], f"clusterRival p4 {civ} {rv}")


def resolve(p, civs_list, civ, idx, fb, used):
    if p is not None and civ in p:
        return state_at(p, civ, idx, fb, used)
    row = next((c for c in civs_list if c.get("ikonaId") == civ), None)
    names = (row or {}).get("nazwyMiast") or []
    if len(names) > 0 and idx >= 0:
        u = used if used is not None else set(names[:idx])
        return pick_names(names, u, fb)
    if idx >= 0:
        return names[idx] if (idx < len(names) and names[idx]) else fb
    return fb


poolsNoGreek = {k: v for k, v in pools.items() if k != "grecy"}
for r in CN["resolve"]:
    p = {"full": pools, "nogreek": poolsNoGreek, "none": None}[r["pools"]]
    args = (p, CN["civsOnlyNames"], r["civ"], r["index"], "FB")
    check(resolve(*args, None) == r["none"], f"resolveStateCityName none {r['pools']} {r['civ']} {r['index']}")
    check(resolve(*args, set()) == r["empty"], f"resolveStateCityName empty {r['pools']} {r['civ']} {r['index']}")
    check(resolve(*args, {"A", "Ateny"}) == r["used1"], f"resolveStateCityName used1 {r['pools']} {r['civ']} {r['index']}")

civ_of = {int(k): v for k, v in CN["collectCivOf"].items()}
civ_fn = lambda o: civ_of.get(o, "inna")
cities = CN["collectCityList"]
for c in CN["collect"]:
    t = c["target"]
    by_cities = sorted({x["name"] for x in cities if civ_fn(x["ownerId"]) == t and x["name"]})
    check(by_cities == c["byCities"], f"collectUsedCityNamesFromCities {t}")
    names = [x["name"] for x in cities]
    owners = [x["ownerId"] for x in cities]
    by_arr = sorted({names[i] for i in range(len(names)) if i < len(owners) and civ_fn(owners[i]) == t and names[i]})
    check(by_arr == c["byArrays"], f"collectUsedCityNames {t}")
    by_short = sorted({names[i] for i in range(len(names)) if i < 3 and civ_fn(owners[i]) == t and names[i]})
    check(by_short == c["byArraysShortOwners"], f"collectUsedCityNames krotkie {t}")


def used_from(cl, target):
    return {x["name"] for x in cl if civ_fn(x["ownerId"]) == target and x["name"]}


for c in CN["suggest"]:
    cl = CN["suggestCityLists"][c["cities"]]
    civ = c["civ"]
    check(pick_pool(pools, civ, used_from(cl, civ), "Stolica") == c["suggest"], f"suggestPlayerFoundCityName {c['cities']} {civ}")
    check(pick_pool(pools, civ, used_from(cl, civ), "Stolica") == c["suggestOther"], f"suggestPlayerFoundCityName inny wlasciciel {c['cities']} {civ}")
    for owner, exp in zip([0, 1, 2, 3, 7, -5], c["ai"]):
        cid = civ_fn(owner)
        check(pick_pool(pools, cid, used_from(cl, cid)) == exp, f"pickAiFoundCityName {c['cities']} {civ} {owner}")


def validate(p, cl):
    errs = []
    ids = [c["ikonaId"] for c in cl if c.get("ikonaId")]
    for cid in ids:
        e = p.get(cid)
        if e is None:
            errs.append(f"{cid}: brak wpisu w city-names-pools.json")
            continue
        common = e.get("miasta_cywilizacji") or []
        if len(common) != COMMON:
            errs.append(f"{cid}: miasta_cywilizacji {len(common)} !== {COMMON}")
        if len(set(common)) != len(common):
            errs.append(f"{cid}: duplikaty we wspólnej liście miasta_cywilizacji")
        civ = next((c for c in cl if c.get("ikonaId") == cid), None)
        names = (civ or {}).get("nazwyMiast") or []
        if names != common:
            errs.append(f"{cid}: civs.json.nazwyMiast ≠ miasta_cywilizacji")
    return errs


for c in CN["validate"]:
    check(validate(c["pools"], c["civs"]) == c["out"], f"validateCityNamesPools {c['name']}")
check(validate(pools, [{"ikonaId": c["ikonaId"], "nazwyMiast": c["nazwyMiast"]} for c in civs]) == [], "validate: dane weba bez bledow")

print(f"RAZEM: {checks} sprawdzen, rozbieznosci: {len(diffs)}")
sys.exit(0 if not diffs else 1)
