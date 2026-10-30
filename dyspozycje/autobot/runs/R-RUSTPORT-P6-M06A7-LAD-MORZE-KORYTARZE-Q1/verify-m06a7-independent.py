# Niezalezny weryfikator (Operator-pomiary, R-RUSTPORT-P6-M06A7-LAD-MORZE-KORYTARZE-Q1).
# Nie uzywa generatora ani kodu Rust: liczy formule web :4329 od zera w Pythonie
# (Math.round = floor(x) + (1 jesli x - floor(x) >= 0.5)) i porownuje z wektorami.
# Mierzy tez trafienia graniczne. Uruchomienie z katalogu worktree: python3 -I <ten plik>
import json
import math

VEC = "rust-port/engine/tests/p6_m06a7_vectors/annular-vectors.json"
BR = "rust-port/engine/tests/p6_m06a7_vectors/bridge-vectors.json"


def js_num(v):
    if isinstance(v, str):
        return {"NaN": math.nan, "Infinity": math.inf, "-Infinity": -math.inf}[v]
    return float(v)


def js_round(x):
    if math.isnan(x) or math.isinf(x):
        return x
    f = math.floor(x)
    return f + 1.0 if x - f >= 0.5 else float(f)


def js_min(a, b):
    if math.isnan(a) or math.isnan(b):
        return math.nan
    return a if a < b else b


def js_max(a, b):
    if math.isnan(a) or math.isnan(b):
        return math.nan
    return a if a > b else b


def web_annular(w, h):
    # web: Math.max(6, Math.min(22, Math.round(6 + Math.sqrt((w*h)/20160) * 2.6)))
    prod = w * h
    if math.isnan(prod) or prod < 0:
        scale = math.nan
    else:
        scale = math.sqrt(prod / 20160)
    return js_max(6.0, js_min(22.0, js_round(6.0 + scale * 2.6)))


with open(VEC) as f:
    data = json.load(f)
cases = data["cases"]["annular"]
mism = 0
near = 0
hi = 0
lo = 0
for row in cases:
    w, h, exp = js_num(row[0]), js_num(row[1]), js_num(row[2])
    got = web_annular(w, h)
    same = (math.isnan(got) and math.isnan(exp)) or got == exp
    if not same:
        mism += 1
        if mism <= 5:
            print("MISMATCH", w, h, exp, got)
    if exp == 22.0:
        hi += 1
    if exp == 6.0:
        lo += 1
    if math.isfinite(w) and math.isfinite(h) and w * h >= 0:
        raw = 6.0 + math.sqrt((w * h) / 20160) * 2.6
        if abs(raw - (math.floor(raw) + 0.5)) < 0.05:
            near += 1
print("cases", len(cases), "mismatches", mism)
print("near_half_threshold |raw-(N+0.5)|<0.05 (finite, w*h>=0):", near)
print("result==22 (gorny clamp):", hi)
print("result==6 (dolny clamp lub round do 6):", lo)
bridge = json.load(open(BR))["cases"]["bridge"]
print("bridge rows", len(bridge), [tuple(r) for r in bridge])
