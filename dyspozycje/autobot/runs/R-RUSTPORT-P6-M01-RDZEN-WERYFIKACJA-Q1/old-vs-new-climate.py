import math

POLAR, DESERT_ROWS, PLAINS, LATBUF = 0.05, 3.5, 0.075, 0.05
BORDER, REF_ROWS, REF_INNER, CAP = 2, 30, 115, 0.12


def jsround(x):
    return math.floor(x + 0.5)


def polar_rows(h):
    ih = max(1, h - 1 - 2 * BORDER)
    return max(2, min(jsround(REF_ROWS * ih / REF_INNER), max(REF_ROWS, jsround(ih * CAP))))


def band(r, h, earth, int_div):
    buf = polar_rows(h) if earth else max(2, jsround(h * LATBUF))
    ih = max(1, h - 2 * buf)
    rel = (r - buf) / max(1, ih - 1)
    if rel < 0 or rel > 1:
        return 0 if (r < h // 2 if int_div else r < h / 2) else 6
    dh = DESERT_ROWS / ih
    lo, hi = 0.5 - dh, 0.5 + dh
    if rel < POLAR: return 0
    if rel < lo - PLAINS: return 1
    if rel < lo: return 2
    if rel < hi: return 3
    if rel < hi + PLAINS: return 4
    if rel < 1 - POLAR: return 5
    return 6


diff = []
for h in range(0, 261):
    for earth in (False, True):
        for r in range(0, h):
            if band(r, h, earth, True) != band(r, h, earth, False):
                diff.append((h, r, earth))
print('roznice stary(int)/nowy(f64) dla r in [0,h), h 0..260:', len(diff))
print(diff[:20])
print('wysokosci:', sorted({d[0] for d in diff}))
