#!/usr/bin/env python3
"""Niezalezny weryfikator wektorow P6.M17 (R-RUSTPORT-P6-M17-SNAPSHOT-MAPY-Q1).

NIE uzywa TypeScript, Node, gen-m17-vectors.mjs ani kodu Rust. Semantyke mapSnapshot.ts
(serializeMapForSave / buildGameMapFromSnapshot / isValidMapSnapshot) implementuje od nowa w Pythonie
na podstawie TEKSTU zrodla weba (git archive edb8fb56): wejscia bierze z wektorow JSON, wynik liczy sam
i porownuje z wyjsciem zapisanym z URUCHOMIONEGO weba. Dodatkowo kotwice tekstowe zrodla.

Uzycie:  python3 -I verify-m17-vectors.py <WEB_ROOT> <VECTORS_DIR>
Wyjscie: 0 = 0 rozbieznosci, 1 = rozbieznosci, 2 = blad wejscia.
"""
import json
import math
import re
import sys
from pathlib import Path

if len(sys.argv) != 3:
    print("usage: <WEB_ROOT> <VECTORS_DIR>")
    sys.exit(2)
web = Path(sys.argv[1])
vdir = Path(sys.argv[2])
checks = 0
diffs = 0


def expect(label, got, want):
    global checks, diffs
    checks += 1
    if canon(got) != canon(want):
        diffs += 1
        print(f"ROZBIEZNOSC {label}\n  py ={json.dumps(canon(got))[:300]}\n  web={json.dumps(canon(want))[:300]}")


def canon(v):
    """Kanonizacja do porownania: liczby jako float (NaN/inf -> None jak JSON.stringify), -0 -> 0."""
    if isinstance(v, bool) or v is None or isinstance(v, str):
        return v
    if isinstance(v, (int, float)):
        f = float(v)
        if math.isnan(f) or math.isinf(f):
            return None
        return 0.0 if f == 0 else f
    if isinstance(v, list):
        return [canon(x) for x in v]
    if isinstance(v, dict):
        return {k: canon(x) for k, x in v.items()}
    raise TypeError(type(v))


def special(v):
    if v == "NaN":
        return float("nan")
    if v == "Infinity":
        return float("inf")
    if v == "-Infinity":
        return float("-inf")
    if v == "-0":
        return -0.0
    return v


def num_in(v):
    return special(v) if isinstance(v, str) else v


# ---------- kotwice zrodla ----------
src_path = web / "gra/src/map/mapSnapshot.ts"
src_text = src_path.read_text(encoding="utf-8")
src_lines = src_text.count("\n")
anchors = [
    ("liczba linii 404", src_lines == 404 or src_lines == 403 or len(src_text.splitlines()) == 404),
    ("fmt: 2 w literale", "fmt: 2," in src_text),
    ("brak wlasciciela -> -1", "hex.wlasciciel == null ? -1 : intern(hex.wlasciciel)" in src_text),
    ("0/1 dla wioskaIstnieje", "hex.wioska.istnieje ? 1 : 0" in src_text),
    ("0/1 dla rzekaObecna", "hex.rzeka.obecna ? 1 : 0" in src_text),
    ("krawedzie tylko niepuste", "hex.rzeka.krawedzie && hex.rzeka.krawedzie.length > 0" in src_text),
    ("zloze truthy", "if (hex.zloze) {" in src_text),
    ("zlozeMinEra != null", "if (hex.zlozeMinEra != null) {" in src_text),
    ("ulepszenia truthy", "if (hex.ulepszenia) {" in src_text),
    ("improvementKey truthy", "if (hex.improvementKey) {" in src_text),
    ("widocznosc przez Object.keys", "for (const playerId of Object.keys(hex.widocznosc))" in src_text),
    ("klucz rebuild", "hexes[`${qi},${ri}`] = hex;" in src_text),
    ("wlasciciel rebuild", "snap.wlascicielIdx[i] === -1 ? null" in src_text),
    ("istnieje rebuild === 1", "snap.wioskaIstnieje[i] === 1" in src_text),
    ("walidacja: fmt !== 2", "if (s.fmt !== 2) return false;" in src_text),
    ("walidacja: szerokosc", "s.szerokoscQ <= 0" in src_text),
    ("walidacja: wysokosc", "s.wysokoscR <= 0" in src_text),
    ("walidacja: n", "s.n <= 0" in src_text),
    ("walidacja: dlugosc gestych", "arr.length !== s.n" in src_text),
    ("walidacja: pary rzadkie", "sc.hexIdx.length !== sc.val.length" in src_text),
]
for name, ok in anchors:
    checks += 1
    if not ok:
        diffs += 1
        print(f"ROZBIEZNOSC kotwica: {name}")
rows_dense = re.search(r"const denseFields[^=]*=\s*\[(.*?)\];", src_text, re.S)
dense_py = re.findall(r"'(\w+)'", rows_dense.group(1))
rows_sparse = re.search(r"const sparseFields[^=]*=\s*\[(.*?)\];", src_text, re.S)
sparse_py = re.findall(r"'(\w+)'", rows_sparse.group(1))
expect("DENSE z tekstu zrodla", dense_py, ["q", "r", "terenIdx", "nakladkaIdx", "ulepszenieIdx", "wlascicielIdx", "wioskaIstnieje", "wioskaLudnosc", "rzekaObecna"])
expect("SPARSE z tekstu zrodla", sparse_py, ["rzekaKrawedzie", "zloze", "zlozeMinEra", "ulepszenia", "improvementKey"])


# ---------- semantyka JS ----------
def is_array_index(k):
    return re.fullmatch(r"0|[1-9][0-9]*", k) is not None and int(k) <= 4294967294


def js_key_order(insertion):
    """Object.keys po kolejnych przypisaniach obj[k] = v (nadpisanie zachowuje pozycje)."""
    order = []
    vals = {}
    for k, v in insertion:
        if k not in vals:
            order.append(k)
        vals[k] = v
    idx = sorted((k for k in order if is_array_index(k)), key=int)
    rest = [k for k in order if not is_array_index(k)]
    return [(k, vals[k]) for k in idx + rest]


# ---------- serializeMapForSave ----------
def serialize(m):
    dict_, dindex = [], {}

    def intern(s):
        if s in dindex:
            return dindex[s]
        dindex[s] = len(dict_)
        dict_.append(s)
        return dindex[s]

    hexes = m["hexes"]
    n = len(hexes)
    out = {k: [] for k in ["q", "r", "terenIdx", "nakladkaIdx", "ulepszenieIdx", "wlascicielIdx", "wioskaIstnieje", "wioskaLudnosc", "rzekaObecna"]}
    sp = {k: {"hexIdx": [], "val": []} for k in ["rzekaKrawedzie", "zloze", "zlozeMinEra", "ulepszenia", "improvementKey"]}
    wid = {"hexIdx": [], "playerIdx": [], "valIdx": []}
    for i, (_key, h) in enumerate(hexes):
        out["q"].append(h["coords"]["q"])
        out["r"].append(h["coords"]["r"])
        out["terenIdx"].append(intern(h["terenBazowy"]))
        out["nakladkaIdx"].append(intern(h["nakladka"]))
        out["ulepszenieIdx"].append(intern(h["ulepszenie"]))
        out["wlascicielIdx"].append(-1 if h["wlasciciel"] is None else intern(h["wlasciciel"]))
        out["wioskaIstnieje"].append(1 if h["wioska"]["istnieje"] else 0)
        out["wioskaLudnosc"].append(num_in(h["wioska"]["ludnosc"]))
        out["rzekaObecna"].append(1 if h["rzeka"]["obecna"] else 0)
        if len(h["rzeka"]["krawedzie"]) > 0:
            sp["rzekaKrawedzie"]["hexIdx"].append(i)
            sp["rzekaKrawedzie"]["val"].append(list(h["rzeka"]["krawedzie"]))
        z = h.get("zloze")
        if z:  # JS truthy: pusty string falsy
            sp["zloze"]["hexIdx"].append(i)
            sp["zloze"]["val"].append(intern(z))
        if h.get("zlozeMinEra") is not None:
            sp["zlozeMinEra"]["hexIdx"].append(i)
            sp["zlozeMinEra"]["val"].append(num_in(h["zlozeMinEra"]))
        if h.get("ulepszenia") is not None:  # tablica zawsze truthy
            sp["ulepszenia"]["hexIdx"].append(i)
            sp["ulepszenia"]["val"].append([intern(s) for s in h["ulepszenia"]])
        if h.get("improvementKey"):
            sp["improvementKey"]["hexIdx"].append(i)
            sp["improvementKey"]["val"].append(intern(h["improvementKey"]))
        order = js_key_order([(k, v) for k, v in h["widocznosc"]["insertion"]])
        if order != [(k, v) for k, v in h["widocznosc"]["jsOrder"]]:
            raise SystemExit(f"kolejnosc kluczy JS niezgodna: {order} vs {h['widocznosc']['jsOrder']}")
        for pid, val in order:
            wid["hexIdx"].append(i)
            wid["playerIdx"].append(intern(pid))
            wid["valIdx"].append(intern(val))
    res = {
        "fmt": 2,
        "szerokoscQ": num_in(m["szerokoscQ"]),
        "wysokoscR": num_in(m["wysokoscR"]),
        "seed": num_in(m["seed"]),
        "riverPaths": m["riverPaths"] if m["riverPaths"] is not None else [],
    }
    if "riverPathKinds" in m:
        res["riverPathKinds"] = m["riverPathKinds"]
    res.update({"dict": dict_, "n": n})
    res.update(out)
    res.update(sp)
    res["widocznosc"] = wid
    return res


# ---------- buildGameMapFromSnapshot ----------
class Bad(Exception):
    pass


def at(lst, i):
    if not isinstance(i, int) or i < 0 or i >= len(lst):
        raise Bad(f"indeks {i}")
    return lst[i]


def rebuild(s):
    d = s["dict"]
    hex_list = []
    for i in range(s["n"]):
        qi = at(s["q"], i)
        ri = at(s["r"], i)
        oi = at(s["wlascicielIdx"], i)
        hex_list.append(
            {
                "coords": {"q": qi, "r": ri},
                "terenBazowy": at(d, at(s["terenIdx"], i)),
                "nakladka": at(d, at(s["nakladkaIdx"], i)),
                "ulepszenie": at(d, at(s["ulepszenieIdx"], i)),
                "wlasciciel": None if oi == -1 else at(d, oi),
                "wioska": {"istnieje": at(s["wioskaIstnieje"], i) == 1, "ludnosc": at(s["wioskaLudnosc"], i)},
                "widocznosc": [],
                "rzeka": {"obecna": at(s["rzekaObecna"], i) == 1, "krawedzie": []},
            }
        )
    for k in range(len(s["rzekaKrawedzie"]["hexIdx"])):
        at(hex_list, s["rzekaKrawedzie"]["hexIdx"][k])["rzeka"]["krawedzie"] = list(at(s["rzekaKrawedzie"]["val"], k))
    for k in range(len(s["zloze"]["hexIdx"])):
        at(hex_list, s["zloze"]["hexIdx"][k])["zloze"] = at(d, at(s["zloze"]["val"], k))
    for k in range(len(s["zlozeMinEra"]["hexIdx"])):
        at(hex_list, s["zlozeMinEra"]["hexIdx"][k])["zlozeMinEra"] = at(s["zlozeMinEra"]["val"], k)
    for k in range(len(s["ulepszenia"]["hexIdx"])):
        at(hex_list, s["ulepszenia"]["hexIdx"][k])["ulepszenia"] = [at(d, di) for di in at(s["ulepszenia"]["val"], k)]
    for k in range(len(s["improvementKey"]["hexIdx"])):
        at(hex_list, s["improvementKey"]["hexIdx"][k])["improvementKey"] = at(d, at(s["improvementKey"]["val"], k))
    insertion = {}
    w = s["widocznosc"]
    for k in range(len(w["hexIdx"])):
        h = at(hex_list, w["hexIdx"][k])
        pid = at(d, at(w["playerIdx"], k))
        val = at(d, at(w["valIdx"], k))
        insertion.setdefault(id(h), []).append((pid, val))
    for h in hex_list:
        h["widocznosc"] = [list(p) for p in js_key_order(insertion.get(id(h), []))]
    hexes = []
    pos = {}
    for h in hex_list:
        key = f"{h['coords']['q']},{h['coords']['r']}"
        if key in pos:
            hexes[pos[key]][1] = h
        else:
            pos[key] = len(hexes)
            hexes.append([key, h])
    res = {"szerokoscQ": s["szerokoscQ"], "wysokoscR": s["wysokoscR"], "seed": s["seed"], "hexes": hexes, "riverPaths": s["riverPaths"]}
    if "riverPathKinds" in s:
        res["riverPathKinds"] = s["riverPathKinds"]
    return res


# ---------- isValidMapSnapshot ----------
def is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def valid(s):
    if not isinstance(s, (dict, list)):
        return False
    g = (lambda k: s.get(k)) if isinstance(s, dict) else (lambda k: None)
    if not (is_num(g("fmt")) and g("fmt") == 2):
        return False
    if not (is_num(g("szerokoscQ")) and g("szerokoscQ") > 0):
        return False
    if not (is_num(g("wysokoscR")) and g("wysokoscR") > 0):
        return False
    if not is_num(g("seed")):
        return False
    if not isinstance(g("riverPaths"), list):
        return False
    n = g("n")
    if not (is_num(n) and n > 0):
        return False
    if not isinstance(g("dict"), list):
        return False
    for f in dense_py:
        a = g(f)
        if not isinstance(a, list) or len(a) != n:
            return False
    for f in sparse_py:
        sc = g(f)
        if not isinstance(sc, dict):
            return False
        if not isinstance(sc.get("hexIdx"), list) or not isinstance(sc.get("val"), list) or len(sc["hexIdx"]) != len(sc["val"]):
            return False
    wd = g("widocznosc")
    if not isinstance(wd, dict):
        return False
    a, b, c = wd.get("hexIdx"), wd.get("playerIdx"), wd.get("valIdx")
    if not (isinstance(a, list) and isinstance(b, list) and isinstance(c, list)):
        return False
    return len(a) == len(b) == len(c)


# ---------- porownania ----------
ser = json.loads((vdir / "serialize.json").read_text(encoding="utf-8"))
for c in ser["cases"]:
    expect(f"serialize {c['label']}", serialize(c["input"]), c["snapshot"])
reb = json.loads((vdir / "rebuild.json").read_text(encoding="utf-8"))
for c in reb["cases"]:
    try:
        got = rebuild(c["snapshot"])
        py_ok = True
    except Bad:
        py_ok = False
    web_ok = c["outcome"] == "ok"
    expect(f"rebuild-outcome {c['label']}", py_ok, web_ok)
    if py_ok and web_ok:
        expect(f"rebuild {c['label']}", got, c["map"])
val = json.loads((vdir / "validate.json").read_text(encoding="utf-8"))
for c in val["cases"]:
    expect(f"validate {c['label']}", valid(c["input"]), c["out"])

print(f"checks={checks} rozbieznosci={diffs}")
sys.exit(1 if diffs else 0)
