#!/usr/bin/env python3
"""Niezalezny weryfikator wektorow P6.M15 (R-RUSTPORT-P6-M15-DROGI-RUCH-REGULY-Q1).

NIE uzywa TypeScript, Node, gen-m15-vectors.mjs ani kodu Rust. Semantyke road-movement.ts
i collectRoadKeys (improvement-build.ts:1559-1569) implementuje od nowa w Pythonie na podstawie
TEKSTU zrodel weba (git archive edb8fb56): stale wyciaga regexem ze zrodla, wejscia bierze z wektorow
JSON, wynik liczy sam i porownuje (BITOWO dla f64) z wyjsciem zapisanym z URUCHOMIONEGO weba.
Klucze ulepszen i aliasy: gra/data/terrain-improvements.json + LEGACY_KEY_ALIASES z TS.

Uzycie:  python3 -I verify-m15-vectors.py <WEB_ROOT> <VECTORS_DIR>
Wyjscie: 0 = 0 rozbieznosci, 1 = rozbieznosci, 2 = blad wejscia.
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

checks = 0
diffs = 0


def expect(label, got, want):
    global checks, diffs
    checks += 1
    if got != want:
        diffs += 1
        if diffs <= 40:
            print(f"ROZBIEZNOSC {label}: py={got!r} json={want!r}")


def rd(rel):
    return (web / rel).read_text(encoding="utf-8")


def bits(x):
    if math.isnan(x):
        return "nan"
    return struct.pack(">d", x).hex()


def fnum(s):
    return {"NaN": math.nan, "Infinity": math.inf, "-Infinity": -math.inf, "-0": -0.0}.get(s) if s in (
        "NaN", "Infinity", "-Infinity", "-0") else float(s)


# ---------- stale ze zrodla TS ----------
rm = rd("gra/src/map/road-movement.ts")


def const(name):
    m = re.search(r"export const %s = ([^;]+);" % name, rm)
    if not m:
        print("brak stalej", name)
        sys.exit(2)
    expr = m.group(1).strip()
    mm = re.fullmatch(r"(\d+(?:\.\d+)?)(?:\s*/\s*(\d+(?:\.\d+)?))?", expr)
    if not mm:
        print("nieobslugiwane wyrazenie", expr)
        sys.exit(2)
    v = float(mm.group(1))
    if mm.group(2):
        v = v / float(mm.group(2))
    return v


MULT = const("ROAD_MOVE_SPEED_MULT")
BMULT = const("ROAD_BRUK_MOVE_SPEED_MULT")
MIN = const("ROAD_MIN_MOVE_COST")
BMIN = const("ROAD_BRUK_MIN_MOVE_COST")

# kotwice tekstowe: klucze drog i priorytet
for anchor in (
    "return key === 'droga' || key === 'droga_brukowana';",
    "Math.max(ROAD_BRUK_MIN_MOVE_COST, cost / ROAD_BRUK_MOVE_SPEED_MULT)",
    "return cost / ROAD_MOVE_SPEED_MULT;",
    "if (cost === Infinity) return Infinity;",
):
    expect("kotwica " + anchor, anchor in rm, True)
ib = rd("gra/src/map/improvement-build.ts").split("\n")
expect("collectRoadKeys @1559", "export function collectRoadKeys(map: GameMap): Set<string> {" in "\n".join(ib[1558:1569]), True)

consts = json.loads((vdir / "constants.json").read_text())
for name, val in (("ROAD_MOVE_SPEED_MULT", MULT), ("ROAD_BRUK_MOVE_SPEED_MULT", BMULT),
                  ("ROAD_MIN_MOVE_COST", MIN), ("ROAD_BRUK_MIN_MOVE_COST", BMIN)):
    expect("stala " + name, bits(val), bits(fnum(consts[name])))

# ---------- normalizeImprovementKey (z zrodla TS + danych) ----------
ti = rd("gra/src/game/terrain-improvements.ts")
alias_block = re.search(r"LEGACY_KEY_ALIASES[^=]*=\s*\{(.*?)\};", ti, re.S).group(1)
ALIASES = dict(re.findall(r"(\w+):\s*'(\w+)'", alias_block))
IMPROVEMENTS = set(json.loads(rd("gra/data/terrain-improvements.json")).keys())
# IMPROVEMENTS to zwykly obiekt JS: dziedziczy wlasciwosci Object.prototype (Node 22).
PROTO = {"constructor", "__defineGetter__", "__defineSetter__", "hasOwnProperty", "__lookupGetter__",
         "__lookupSetter__", "isPrototypeOf", "propertyIsEnumerable", "toString", "valueOf",
         "__proto__", "toLocaleString"}
KNOWN = IMPROVEMENTS | PROTO


def normalize(raw):
    if not raw or raw == "brak":
        return None
    key = ALIASES.get(raw, raw)
    if key in KNOWN:
        return key
    return raw if raw in KNOWN else None


def keys_for_hex(hex_):
    layers = hex_.get("ulepszenia")
    if layers:
        out = []
        for k in layers:
            n = normalize(k)
            if n is not None and n not in out:
                out.append(n)
        return out
    single = hex_.get("ulepszenie")
    n = normalize("brak" if single is None else single)
    return [n] if n else []


def is_road(key):
    return key == "droga" or key == "droga_brukowana"


def has_road(hex_):
    return any(is_road(k) for k in keys_for_hex(hex_))


def js_max(a, b):
    if math.isnan(a) or math.isnan(b):
        return math.nan
    return a if a > b else (b if b > a else (a if bits(a) >= bits(b) else b))


def apply_mod(cost, hex_):
    if cost == math.inf:
        return math.inf
    keys = keys_for_hex(hex_)
    if "droga_brukowana" in keys or hex_.get("ulepszenie") == "droga_brukowana":
        return js_max(BMIN, cost / BMULT) if not math.isnan(cost) else math.nan
    if "droga" in keys or hex_.get("ulepszenie") == "droga":
        return cost / MULT
    return cost


# ---------- porownania ----------
for row in json.loads((vdir / "is_road_key.json").read_text()):
    expect("is_road_key %r" % row["key"], is_road(row["key"]), row["out"])

for i, row in enumerate(json.loads((vdir / "has_road.json").read_text())):
    expect("has_road %d" % i, has_road(row["hex"]), row["out"])

for i, row in enumerate(json.loads((vdir / "apply_modifier.json").read_text())):
    cost = fnum(row["cost"])
    expect("apply %d cost=%s hex=%s" % (i, row["cost"], row["hex"]), bits(apply_mod(cost, row["hex"])),
           bits(fnum(row["out"])))


def array_index(k):
    return k.isdigit() and k.isascii() and (k == "0" or not k.startswith("0")) and int(k) <= 4294967294


for i, row in enumerate(json.loads((vdir / "collect_road_keys.json").read_text())):
    slots = {}
    for k, h in row["entries"]:
        slots[k] = h  # dict zachowuje pierwotna pozycje przy nadpisaniu - jak obiekt JS
    idx = sorted((k for k in slots if array_index(k)), key=int)
    rest = [k for k in slots if not array_index(k)]
    got = [k for k in idx + rest if has_road(slots[k])]
    expect("collect %d" % i, got, row["out"])

print(f"checks={checks} rozbieznosci={diffs}")
sys.exit(0 if diffs == 0 else 1)
