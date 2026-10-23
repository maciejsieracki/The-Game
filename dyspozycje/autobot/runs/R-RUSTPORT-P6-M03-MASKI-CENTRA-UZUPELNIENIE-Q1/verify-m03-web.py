#!/usr/bin/env python3
"""NIEZALEZNY weryfikator P6.M03 (bez kodu Rust, bez Node).

Odtwarza w czystym Pythonie (transkrypcja z TEKSTU TS weba, pin edb8fb56, oraz z zrodla V8
`src/base/ieee754.cc` dla fdlibm) funkcje masek ladu z `gen-helpers.ts`:252-824 wraz z zaleznosciami
(`:1177-1195`, `:1294-1300`, `:1313-1325`, `:1334-1336`) i porownuje KAZDY wektor z
`tests/p6_m03_vectors/{jsmath,core,masks}.json` (wygenerowanych z uruchomionego weba). Dodatkowo
sprawdza, ze kazda liczba z `data/derived/mapgen-masks.json` jest literalem w tekscie TS i ze tabela
Rusta rowna sie wartosciom z transkrypcji.

Uzycie: python3 -I verify-m03-web.py <KORZEN_WEBA> <katalog_wektorow> <katalog_engine>
Wynik: liczba rozbieznosci (oczekiwane 0), exit 1 przy > 0.
"""
import json
import math
import re
import struct
import sys

web_root, vec_dir, engine = sys.argv[1], sys.argv[2], sys.argv[3]
bad = []
checks = 0


def check(cond, what):
    global checks
    checks += 1
    if not cond:
        bad.append(what)


def bits(x):
    return struct.unpack('<Q', struct.pack('<d', x))[0]


def same(a, b):
    return (a != a and b != b) or bits(a) == bits(b)


def num(s):
    return float({'NaN': 'nan', 'Infinity': 'inf', '-Infinity': '-inf'}.get(s, s))


def hi(x):
    return struct.unpack('<Q', struct.pack('<d', x))[0] >> 32


def lo(x):
    return struct.unpack('<Q', struct.pack('<d', x))[0] & 0xFFFFFFFF


def s32(v):
    v &= 0xFFFFFFFF
    return v - (1 << 32) if v & 0x80000000 else v


def sethi(x, h):
    return struct.unpack('<d', struct.pack('<Q', ((h & 0xFFFFFFFF) << 32) | lo(x)))[0]


def setlo(x, l):
    return struct.unpack('<d', struct.pack('<Q', (hi(x) << 32) | (l & 0xFFFFFFFF)))[0]


def fromwords(h, l):
    return struct.unpack('<d', struct.pack('<Q', ((h & 0xFFFFFFFF) << 32) | (l & 0xFFFFFFFF)))[0]


INF = float('inf')
NAN = float('nan')


def jdiv(a, b):
    """Dzielenie JS (IEEE): x/0 daje +-Infinity lub NaN zamiast wyjatku."""
    try:
        return a / b
    except ZeroDivisionError:
        if a != a or a == 0:
            return NAN
        neg = (math.copysign(1.0, a) < 0) != (math.copysign(1.0, b) < 0)
        return -INF if neg else INF


def jmax(a, b):
    if a != a or b != b:
        return NAN
    if a == 0 and b == 0:
        return a if math.copysign(1.0, a) > 0 else b
    return a if a > b else b


def jmin(a, b):
    if a != a or b != b:
        return NAN
    if a == 0 and b == 0:
        return a if math.copysign(1.0, a) < 0 else b
    return a if a < b else b


def jmax_n(*v):
    r = v[0]
    for x in v[1:]:
        r = jmax(r, x)
    return r


def jmin_n(*v):
    r = v[0]
    for x in v[1:]:
        r = jmin(r, x)
    return r


# ----------------------------------------------------------------------------------------------
# Teksty zrodel TS
# ----------------------------------------------------------------------------------------------
gh_lines = open(f'{web_root}/gra/src/map/gen-helpers.ts', encoding='utf8').read().split('\n')
gh = '\n'.join(gh_lines)
em = open(f'{web_root}/gra/src/map/earth-land-mask.ts', encoding='utf8').read()
eg = open(f'{web_root}/gra/src/map/earth-land-mask.generated.ts', encoding='utf8').read()
scope_text = '\n'.join(gh_lines[251:824] + gh_lines[1176:1196] + gh_lines[1293:1300] + gh_lines[1312:1325] + gh_lines[1333:1336])

# ----------------------------------------------------------------------------------------------
# fdlibm: cos / sin (kernel + rem_pio2), atan, atan2, pow — z DZIESIETNYCH stalych V8 ieee754.cc
# ----------------------------------------------------------------------------------------------
C1, C2, C3 = 4.16666666666666019037e-02, -1.38888888888741095749e-03, 2.48015872894767294178e-05
C4, C5, C6 = -2.75573143513906633035e-07, 2.08757232129817482790e-09, -1.13596475577881948265e-11
S1, S2, S3 = -1.66666666666666324348e-01, 8.33333333332248946124e-03, -1.98412698298579493134e-04
S4, S5, S6 = 2.75573137070700676789e-06, -2.50507602534068634195e-08, 1.58969099521155010221e-10
INVPIO2 = 6.36619772367581382433e-01
PIO2_1, PIO2_1T = 1.57079632673412561417e+00, 6.07710050650619224932e-11
PIO2_2, PIO2_2T = 6.07710050630396597660e-11, 2.02226624879595063154e-21
PIO2_3, PIO2_3T = 2.02226624871116645580e-21, 8.47842766036889956997e-32
NPIO2_HW = [0x3FF921FB, 0x400921FB, 0x4012D97C, 0x401921FB, 0x401F6A7A, 0x4022D97C, 0x4025FDBB,
            0x402921FB, 0x402C463A, 0x402F6A7A, 0x4031475C, 0x4032D97C, 0x40346B9C, 0x4035FDBB,
            0x40378FDB, 0x403921FB, 0x403AB41B, 0x403C463A, 0x403DD85A, 0x403F6A7A, 0x40407E4C,
            0x404147AC, 0x4042106C, 0x4042D97C, 0x4043A28C, 0x40446B9C, 0x404534AC, 0x4045FDBB,
            0x4046C6CB, 0x40478FDB, 0x404858EB, 0x404921FB]


def kcos(x, y):
    ix = hi(x) & 0x7FFFFFFF
    if ix < 0x3E400000 and int(x) == 0:
        return 1.0
    z = x * x
    r = z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))))
    if ix < 0x3FD33333:
        return 1.0 - (0.5 * z - (z * r - x * y))
    qx = 0.28125 if ix > 0x3FE90000 else struct.unpack('<d', struct.pack('<Q', (ix - 0x00200000) << 32))[0]
    iz = 0.5 * z - qx
    a = 1.0 - qx
    return a - (iz - (z * r - x * y))


def ksin(x, y, iy):
    ix = hi(x) & 0x7FFFFFFF
    if ix < 0x3E400000 and int(x) == 0:
        return x
    z = x * x
    v = z * x
    r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)))
    if iy == 0:
        return x + v * (S1 + z * r)
    return x - ((z * (0.5 * y - v * r) - y) - v * S1)


def rem_pio2(x):
    hx = hi(x)
    ix = hx & 0x7FFFFFFF
    if ix <= 0x3FE921FB:
        return 0, x, 0.0
    if ix < 0x4002D97C:
        if hx >> 31 == 0:
            z = x - PIO2_1
            if ix != 0x3FF921FB:
                y0 = z - PIO2_1T
                return 1, y0, (z - y0) - PIO2_1T
            z -= PIO2_2
            y0 = z - PIO2_2T
            return 1, y0, (z - y0) - PIO2_2T
        z = x + PIO2_1
        if ix != 0x3FF921FB:
            y0 = z + PIO2_1T
            return -1, y0, (z - y0) + PIO2_1T
        z += PIO2_2
        y0 = z + PIO2_2T
        return -1, y0, (z - y0) + PIO2_2T
    t = abs(x)
    n = int(t * INVPIO2 + 0.5)
    fn = float(n)
    r = t - fn * PIO2_1
    w = fn * PIO2_1T
    if n < 32 and ix != NPIO2_HW[n - 1]:
        y0 = r - w
    else:
        j = ix >> 20
        y0 = r - w
        i = j - ((hi(y0) >> 20) & 0x7FF)
        if i > 16:
            t2 = r
            w = fn * PIO2_2
            r = t2 - w
            w = fn * PIO2_2T - ((t2 - r) - w)
            y0 = r - w
            i = j - ((hi(y0) >> 20) & 0x7FF)
            if i > 49:
                t3 = r
                w = fn * PIO2_3
                r = t3 - w
                w = fn * PIO2_3T - ((t3 - r) - w)
                y0 = r - w
    y1 = (r - y0) - w
    if hx >> 31:
        return -n, -y0, -y1
    return n, y0, y1


def fcos(x):
    ix = hi(x) & 0x7FFFFFFF
    if ix <= 0x3FE921FB:
        return kcos(x, 0.0)
    if ix >= 0x7FF00000:
        return NAN
    if ix > 0x413921FB:
        return math.cos(x)
    n, y0, y1 = rem_pio2(x)
    k = n & 3
    if k == 0:
        return kcos(y0, y1)
    if k == 1:
        return -ksin(y0, y1, 1)
    if k == 2:
        return -kcos(y0, y1)
    return ksin(y0, y1, 1)


def fsin(x):
    ix = hi(x) & 0x7FFFFFFF
    if ix <= 0x3FE921FB:
        return ksin(x, 0.0, 0)
    if ix >= 0x7FF00000:
        return NAN
    if ix > 0x413921FB:
        return math.sin(x)
    n, y0, y1 = rem_pio2(x)
    k = n & 3
    if k == 0:
        return ksin(y0, y1, 1)
    if k == 1:
        return kcos(y0, y1)
    if k == 2:
        return -ksin(y0, y1, 1)
    return -kcos(y0, y1)


ATANHI = [4.63647609000806093515e-01, 7.85398163397448278999e-01, 9.82793723247329054082e-01, 1.57079632679489655800e+00]
ATANLO = [2.26987774529616870924e-17, 3.06161699786838301793e-17, 1.39033110312309984516e-17, 6.12323399573676603587e-17]
AT = [3.33333333333329318027e-01, -1.99999999998764832476e-01, 1.42857142725034663711e-01,
      -1.11111104054623557880e-01, 9.09088713343650656196e-02, -7.69187620504482999495e-02,
      6.66107313738753120669e-02, -5.83357013379057348645e-02, 4.97687799461593236017e-02,
      -3.65315727442169155270e-02, 1.62858201153657823623e-02]
PI_O_4, PI_O_2, PI = 7.8539816339744827900E-01, 1.5707963267948965580E+00, 3.1415926535897931160E+00
PI_LO = 1.2246467991473531772E-16
TINY, HUGE = 1.0e-300, 1.0e300


def fatan(x):
    hx = s32(hi(x))
    ix = hx & 0x7FFFFFFF
    if ix >= 0x44100000:
        if ix > 0x7FF00000 or (ix == 0x7FF00000 and lo(x) != 0):
            return x + x
        return ATANHI[3] + ATANLO[3] if hx > 0 else -ATANHI[3] - ATANLO[3]
    if ix < 0x3FDC0000:
        if ix < 0x3E400000 and HUGE + x > 1.0:
            return x
        idx = -1
    else:
        x = abs(x)
        if ix < 0x3FF30000:
            if ix < 0x3FE60000:
                idx = 0
                x = (2.0 * x - 1.0) / (2.0 + x)
            else:
                idx = 1
                x = (x - 1.0) / (x + 1.0)
        elif ix < 0x40038000:
            idx = 2
            x = (x - 1.5) / (1.0 + 1.5 * x)
        else:
            idx = 3
            x = -1.0 / x
    z = x * x
    w = z * z
    s1 = z * (AT[0] + w * (AT[2] + w * (AT[4] + w * (AT[6] + w * (AT[8] + w * AT[10])))))
    s2 = w * (AT[1] + w * (AT[3] + w * (AT[5] + w * (AT[7] + w * AT[9]))))
    if idx < 0:
        return x - x * (s1 + s2)
    z = ATANHI[idx] - ((x * (s1 + s2) - ATANLO[idx]) - x)
    return -z if hx < 0 else z


def fatan2(y, x):
    hx, lx = s32(hi(x)), lo(x)
    ix = hx & 0x7FFFFFFF
    hy, ly = s32(hi(y)), lo(y)
    iy = hy & 0x7FFFFFFF
    if x != x or y != y:
        return x + y
    if ((hx - 0x3FF00000) & 0xFFFFFFFF | lx) == 0:
        return fatan(y)
    m = ((hy >> 31) & 1) | ((hx >> 30) & 2)
    if (iy | ly) == 0:
        if m in (0, 1):
            return y
        return PI + TINY if m == 2 else -PI - TINY
    if (ix | lx) == 0:
        return -PI_O_2 - TINY if hy < 0 else PI_O_2 + TINY
    if ix == 0x7FF00000:
        if iy == 0x7FF00000:
            return [PI_O_4 + TINY, -PI_O_4 - TINY, 3.0 * PI_O_4 + TINY, -3.0 * PI_O_4 - TINY][m]
        return [0.0, -0.0, PI + TINY, -PI - TINY][m]
    if iy == 0x7FF00000:
        return -PI_O_2 - TINY if hy < 0 else PI_O_2 + TINY
    k = (iy - ix) >> 20
    if k > 60:
        z = PI_O_2 + 0.5 * PI_LO
        m &= 1
    elif hx < 0 and k < -60:
        z = 0.0
    else:
        z = fatan(abs(y / x))
    if m == 0:
        return z
    if m == 1:
        return -z
    if m == 2:
        return PI - (z - PI_LO)
    return (z - PI_LO) - PI


def fscalbn(x, n):
    # wynik podnormalny: x * 2**n z jednym zaokragleniem
    return math.ldexp(x, n)


DP_H = [0.0, 5.84962487220764160156e-01]
DP_L = [0.0, 1.35003920212974897128e-08]
BP = [1.0, 1.5]
L1, L2, L3 = 5.99999999999994648725e-01, 4.28571428578550184252e-01, 3.33333329818377432918e-01
L4, L5, L6 = 2.72728123808534006489e-01, 2.30660745775561754067e-01, 2.06975017800338417784e-01
P1, P2, P3 = 1.66666666666666019037e-01, -2.77777777770155933842e-03, 6.61375632143793436117e-05
P4, P5 = -1.65339022054652515390e-06, 4.13813679705723846039e-08
LG2, LG2_H, LG2_L = 6.93147180559945286227e-01, 6.93147182464599609375e-01, -1.90465429995776804525e-09
OVT = 8.0085662595372944372e-0017
CP, CP_H, CP_L = 9.61796693925975554329e-01, 9.61796700954437255859e-01, -7.02846165095275826516e-09
IVLN2, IVLN2_H, IVLN2_L = 1.44269504088896338700e+00, 1.44269502162933349609e+00, 1.92596299112661746887e-08


def fpow(x, y):
    """ieee754::pow V8 (fdlibm) + reguly ECMAScript (NaN w wykladniku, y == 0)."""
    if y != y:
        return NAN
    hx, lx = s32(hi(x)), lo(x)
    hy, ly = s32(hi(y)), lo(y)
    ix, iy = hx & 0x7FFFFFFF, hy & 0x7FFFFFFF
    if (iy | ly) == 0:
        return 1.0
    if ix > 0x7FF00000 or (ix == 0x7FF00000 and lx != 0) or iy > 0x7FF00000 or (iy == 0x7FF00000 and ly != 0):
        return x + y
    yisint = 0
    if hx < 0:
        if iy >= 0x43400000:
            yisint = 2
        elif iy >= 0x3FF00000:
            k = (iy >> 20) - 0x3FF
            if k > 20:
                j = ly >> (52 - k)
                if ((j << (52 - k)) & 0xFFFFFFFF) == ly:
                    yisint = 2 - (j & 1)
            elif ly == 0:
                j = iy >> (20 - k)
                if (j << (20 - k)) == iy:
                    yisint = 2 - (j & 1)
    if ly == 0:
        if iy == 0x7FF00000:
            if ((ix - 0x3FF00000) | lx) == 0:
                return NAN
            if ix >= 0x3FF00000:
                return y if hy >= 0 else 0.0
            return -y if hy < 0 else 0.0
        if iy == 0x3FF00000:
            return jdiv(1.0, x) if hy < 0 else x
        if hy == 0x40000000:
            return x * x
        if hy == 0x3FE00000 and hx >= 0:
            return math.sqrt(x)
    ax = abs(x)
    if lx == 0 and (ix == 0x7FF00000 or ix == 0 or ix == 0x3FF00000):
        z = ax
        if hy < 0:
            z = jdiv(1.0, z)
        if hx < 0:
            if ((ix - 0x3FF00000) | yisint) == 0:
                z = NAN
            elif yisint == 1:
                z = -z
        return z
    n = (hx >> 31) + 1
    if (n | yisint) == 0:
        return NAN
    s = 1.0
    if (n | (yisint - 1)) == 0:
        s = -1.0
    if iy > 0x41E00000:
        if iy > 0x43F00000:
            if ix <= 0x3FEFFFFF:
                return INF if hy < 0 else 0.0
            if ix >= 0x3FF00000:
                return INF if hy > 0 else 0.0
        if ix < 0x3FEFFFFF:
            return s * INF if hy < 0 else s * 0.0
        if ix > 0x3FF00000:
            return s * INF if hy > 0 else s * 0.0
        t = ax - 1.0
        w = (t * t) * (0.5 - t * (0.3333333333333333333333 - t * 0.25))
        u = IVLN2_H * t
        v = t * IVLN2_L - w * IVLN2
        t1 = setlo(u + v, 0)
        t2 = v - (t1 - u)
    else:
        n = 0
        if ix < 0x00100000:
            ax *= 9007199254740992.0
            n -= 53
            ix = s32(hi(ax))
        n += (ix >> 20) - 0x3FF
        j = ix & 0x000FFFFF
        ix = j | 0x3FF00000
        if j <= 0x3988E:
            k = 0
        elif j < 0xBB67A:
            k = 1
        else:
            k = 0
            n += 1
            ix -= 0x00100000
        ax = sethi(ax, ix)
        u = ax - BP[k]
        v = 1.0 / (ax + BP[k])
        ss = u * v
        s_h = setlo(ss, 0)
        t_h = fromwords(((ix >> 1) | 0x20000000) + 0x00080000 + (k << 18), 0)
        t_l = ax - (t_h - BP[k])
        s_l = v * ((u - s_h * t_h) - s_h * t_l)
        s2 = ss * ss
        r = s2 * s2 * (L1 + s2 * (L2 + s2 * (L3 + s2 * (L4 + s2 * (L5 + s2 * L6)))))
        r += s_l * (s_h + ss)
        s2 = s_h * s_h
        t_h = setlo(3.0 + s2 + r, 0)
        t_l = r - ((t_h - 3.0) - s2)
        u = s_h * t_h
        v = s_l * t_h + t_l * ss
        p_h = setlo(u + v, 0)
        p_l = v - (p_h - u)
        z_h = CP_H * p_h
        z_l = CP_L * p_h + p_l * CP + DP_L[k]
        t = float(n)
        t1 = setlo(((z_h + z_l) + DP_H[k]) + t, 0)
        t2 = z_l - (((t1 - t) - DP_H[k]) - z_h)
    y1 = setlo(y, 0)
    p_l = (y - y1) * t1 + y * t2
    p_h = y1 * t1
    z = p_l + p_h
    j, i = s32(hi(z)), lo(z)
    if j >= 0x40900000:
        if ((j - 0x40900000) | i) != 0:
            return s * INF
        if p_l + OVT > z - p_h:
            return s * INF
    elif (j & 0x7FFFFFFF) >= 0x4090CC00:
        if ((j - s32(0xC090CC00)) | i) != 0:
            return s * 0.0
        if p_l <= z - p_h:
            return s * 0.0
    i = j & 0x7FFFFFFF
    k = (i >> 20) - 0x3FF
    n = 0
    if i > 0x3FE00000:
        n = j + (0x00100000 >> (k + 1))
        k = ((n & 0x7FFFFFFF) >> 20) - 0x3FF
        t = fromwords(n & ~(0x000FFFFF >> k), 0)
        n = ((n & 0x000FFFFF) | 0x00100000) >> (20 - k)
        if j < 0:
            n = -n
        p_h -= t
    t = setlo(p_l + p_h, 0)
    u = t * LG2_H
    v = (p_l - (t - p_h)) * LG2 + t * LG2_L
    z = u + v
    w = v - (z - u)
    t = z * z
    t1 = z - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))))
    r = (z * t1) / ((t1 - 2.0) - (w + z * w))
    z = 1.0 - (r - z)
    j = s32(hi(z)) + (n << 20)
    if (j >> 20) <= 0:
        z = fscalbn(z, n)
    else:
        z = sethi(z, j)
    return s * z


def fhypot(a, b):
    """Math.hypot V8 (builtins-math: skalowanie maksimum + sumowanie Kahana)."""
    vals = [a, b]
    mx = 0.0
    nan = False
    absv = [0.0, 0.0]
    for i, v in enumerate(vals):
        if v != v:
            nan = True
        else:
            absv[i] = abs(v)
            if absv[i] > mx:
                mx = absv[i]
    if mx == INF:
        return INF
    if nan:
        return NAN
    if mx == 0:
        return 0.0
    s = 0.0
    c = 0.0
    for v in absv:
        n = v / mx
        summand = n * n - c
        pre = s + summand
        c = (pre - s) - summand
        s = pre
    return math.sqrt(s) * mx


# ----------------------------------------------------------------------------------------------
# PRNG / szum (z gen-helpers.ts:57-122)
# ----------------------------------------------------------------------------------------------
M32 = 0xFFFFFFFF


def imul(a, b):
    return (a * b) & M32


def mulberry(seed):
    s = seed & M32

    def nxt():
        nonlocal s
        s = (s + 0x6D2B79F5) & M32
        t = imul(s ^ (s >> 15), 1 | s)
        t = t ^ ((t + imul(t ^ (t >> 7), 61 | t)) & M32)
        return ((t ^ (t >> 14)) & M32) / 4294967296.0
    return nxt


def build_perm(rand):
    p = list(range(256))
    for i in range(255, 0, -1):
        j = math.floor(rand() * (i + 1))
        p[i], p[j] = p[j], p[i]
    return p


def cos_lerp(a, b, t):
    f = (1 - fcos(t * math.pi)) * 0.5
    return a * (1 - f) + b * f


def value_noise(p, x, y):
    fx, fy = math.floor(x), math.floor(y)
    xi, yi = fx & 255, fy & 255
    xf, yf = x - float(fx), y - float(fy)

    def h(ix, iy):
        return p[(p[ix & 255] + iy) & 255] / 255

    v00, v10, v01, v11 = h(xi, yi), h(xi + 1, yi), h(xi, yi + 1), h(xi + 1, yi + 1)
    top, bot = cos_lerp(v00, v10, xf), cos_lerp(v01, v11, xf)
    return cos_lerp(top, bot, yf)


def fbm(p, x, y, octaves=4):
    value, amp, freq, mx = 0.0, 0.5, 1.0, 0.0
    for _ in range(octaves):
        value += value_noise(p, x * freq, y * freq) * amp
        mx += amp
        amp *= 0.5
        freq *= 2.0
    return value / mx if mx != 0 else NAN


# ----------------------------------------------------------------------------------------------
# Maska Ziemi (earth-land-mask.ts) — dane i stale z TEKSTU TS
# ----------------------------------------------------------------------------------------------
W = int(re.search(r'EARTH_MASK_W = (\d+);', eg).group(1))
H = int(re.search(r'EARTH_MASK_H = (\d+);', eg).group(1))
bb = re.search(r'minX: ([0-9.]+),\s*minY: ([0-9.]+),\s*maxX: ([0-9.]+),\s*maxY: ([0-9.]+)', eg)
BBOX = tuple(float(x) for x in bb.groups())
ROWS = re.findall(r"'([01]+)',", eg)
BORDER = int(re.search(r'const EARTH_PLAYABLE_BORDER = (\d+);', em).group(1))
REF_ROWS = int(re.search(r'EARTH_POLAR_OCEAN_REF_ROWS = (\d+);', em).group(1))
REF_INNER = int(re.search(r'EARTH_POLAR_OCEAN_REF_INNER_H = (\d+);', em).group(1))
CAP_FRAC = float(re.search(r'Math\.round\(innerH \* ([0-9.]+)\)', em).group(1))
SAMPLE_TH = float(re.search(r'return v >= ([0-9.]+) \? 1 : 0;', em).group(1))
sub_src = re.search(r'function earthSubsampleGrid.*?\n}\n', em, re.S).group(0)
SUB = [(int(a), int(b)) for a, b in re.findall(r'inner >= (\d+)\) return (\d+);', sub_src)]
SUB_DEFAULT = int(re.search(r'return (\d+);\n}', sub_src).group(1))
thr_src = re.search(r'function earthLandFractionThreshold.*?\n}\n', em, re.S).group(0)
THR = [(int(a), float(b)) for a, b in re.findall(r'inner >= (\d+)\) return ([0-9.]+);', thr_src)]
THR_DEFAULT = float(re.search(r'return ([0-9.]+);\n}', thr_src).group(1))


def jsround(x):
    return math.floor(x + 0.5)


def inner_h(h): return max(1, h - 1 - 2 * BORDER)
def inner_w(w): return max(1, w - 1 - 2 * BORDER)


def polar_rows(h):
    ih = inner_h(h)
    scaled = jsround(REF_ROWS * ih / REF_INNER)
    cap = max(REF_ROWS, jsround(ih * CAP_FRAC))
    return max(2, min(scaled, cap))


def land_rows(h):
    return max(1, inner_h(h) - polar_rows(h) * 2)


def bit_at(x, y):
    xi, yi = min(W - 1, max(0, x)), min(H - 1, max(0, y))
    return 1 if ROWS[yi][xi] == '1' else 0


def sample(nq, nr):
    if nq < 0 or nq > 1 or nr < 0 or nr > 1:
        return 0
    fx, fy = nq * (W - 1), nr * (H - 1)
    x0, y0 = math.floor(fx), math.floor(fy)
    x1, y1 = min(W - 1, x0 + 1), min(H - 1, y0 + 1)
    tx, ty = fx - x0, fy - y0
    v = ((1 - tx) * (1 - ty) * bit_at(x0, y0) + tx * (1 - ty) * bit_at(x1, y0)
         + (1 - tx) * ty * bit_at(x0, y1) + tx * ty * bit_at(x1, y1))
    return 1 if v >= SAMPLE_TH else 0


def to_norm(q, r, w, h):
    if q < BORDER or r < BORDER or q >= w - BORDER or r >= h - BORDER:
        return None
    iw, ih = inner_w(w), inner_h(h)
    north = south = polar_rows(h)
    rel = r - BORDER
    if rel < north or rel >= ih - south:
        return None
    lr = land_rows(h)
    pr = (rel - north) / max(1, lr - 1)
    pq = (q - BORDER) / iw
    mnx, mny, mxx, mxy = BBOX
    return mnx + pq * (mxx - mnx), mny + pr * (mxy - mny)


def steps_for(w, h):
    inner = min(w, h) - 2 * BORDER
    for lim, v in SUB:
        if inner >= lim:
            return v
    return SUB_DEFAULT


def thr_for(w, h):
    inner = min(w, h) - 2 * BORDER
    for lim, v in THR:
        if inner >= lim:
            return v
    return THR_DEFAULT


def earth_land_at(q, r, w, h):
    t = to_norm(q, r, w, h)
    if not t:
        return 0
    mnx, mny, mxx, mxy = BBOX
    cw = (mxx - mnx) / inner_w(w)
    ch = (mxy - mny) / max(1, land_rows(h))
    st = steps_for(w, h)
    if st <= 1:
        return sample(t[0], t[1])
    hits = 0
    for sy in range(st):
        for sx in range(st):
            nq = t[0] - cw * 0.5 + ((sx + 0.5) / st) * cw
            nr = t[1] - ch * 0.5 + ((sy + 0.5) / st) * ch
            if sample(nq, nr):
                hits += 1
    return 1 if hits / (st * st) >= thr_for(w, h) else 0


# ----------------------------------------------------------------------------------------------
# gen-helpers.ts:252-824 + zaleznosci — transkrypcja z TEKSTU TS (stale wpisane jawnie)
# ----------------------------------------------------------------------------------------------
BORDER_OCEAN = 2          # :1177
MARGIN_ZONE = 10          # :1180
KONT_ZONES = 5            # :318
GRID = 4                  # :688
ZIEMIA_CENTERS = [(0.17, 0.32, 0.15), (0.22, 0.58, 0.11), (0.48, 0.26, 0.13),
                  (0.60, 0.34, 0.19), (0.50, 0.52, 0.12), (0.80, 0.66, 0.08)]  # :801-808


def map_border_width(w, h):
    return BORDER_OCEAN


def hex_border_distance(q, r, w, h):
    return float(min(q, r, w - 1 - q, h - 1 - r))


def margin_cap(d):
    if d < BORDER_OCEAN:
        return 0.0
    if d <= MARGIN_ZONE:
        return 0.05 * (d - 1)
    return None


def border_fade(q, r, w, h):
    cap = margin_cap(hex_border_distance(q, r, w, h))
    if cap is None:
        return 1.0
    if cap <= 0:
        return 0.0
    return jmin(1.0, cap / 0.45)


def edge_rect_fade(q, r, w, h):
    b = map_border_width(w, h)
    nq = jdiv(q, jmax(1, w - 1))
    nr = jdiv(r, jmax(1, h - 1))
    mq = b / jmax(1, w - 1)
    mr = b / jmax(1, h - 1)
    return jmin_n(jmin(nq, 1 - nq) / jmax(mq, 0.001), jmin(nr, 1 - nr) / jmax(mr, 0.001), 1)


def default_shape_params(rand):
    return [0.13, 0.22, 0.19, 0.17] + [rand() * 500 for _ in range(6)]


def land_mask_at(q, r, w, h):
    cx = (w - 1) / 2
    cy = (h - 1) / 2
    dx = jdiv(q - cx, cx + 0.5)
    dy = jdiv(r - cy, cy + 0.5)
    dist = math.sqrt(dx * dx + dy * dy)
    return jmax(0, 1 - fpow(dist / 0.85, 2.0))


def center_count(w, h, typ):
    if typ == 'kontynenty':
        return KONT_ZONES
    area = w * h
    return 2 if area < 2000 else 3 if area < 6000 else 4


def build_continent_centers(rand, n, opts):
    o = opts or {}
    radius_min = o.get('radiusMin', 0.28)
    radius_max = o.get('radiusMax', 0.40)
    min_dist = o.get('minCenterDist', 0)
    w = o.get('width', 120)
    h = o.get('height', 80)
    bw = map_border_width(w, h)
    margin = jmax_n(bw / jmax(1, w - 1), bw / jmax(1, h - 1), 0.12)

    def clamp01(v):
        return jmax(margin, jmin(1 - margin, v))

    centers = []

    def push(nq, nr, radius):
        cnq, cnr = clamp01(nq), clamp01(nr)
        if min_dist > 0:
            for c in centers:
                if fhypot(cnq - c[0], cnr - c[1]) < min_dist:
                    return False
        centers.append((cnq, cnr, radius if radius is not None else radius_min + rand() * (radius_max - radius_min)))
        return True

    if o.get('anchorCenter') is not False and n >= 1:
        push(0.5, 0.5, radius_min + (radius_max - radius_min) * 0.5)
    ring_min = o.get('ringRadiusMin', 0.16)
    ring_max = o.get('ringRadiusMax', 0.32)
    slots = n - len(centers)
    for i in range(max(0, slots)):
        placed = False
        attempt = 0
        while attempt < 40 and not placed:
            angle = (2 * math.pi * i) / jmax(1, slots) + (rand() - 0.5) * 0.45
            ring_r = ring_min + rand() * (ring_max - ring_min)
            if push(0.5 + fcos(angle) * ring_r, 0.5 + fsin(angle) * ring_r, None):
                placed = True
            attempt += 1
        if not placed:
            nq = margin + rand() * (1 - 2 * margin)
            nr = margin + rand() * (1 - 2 * margin)
            push(nq, nr, None)
    return centers


def build_five_zone(rand, w, h, rmin, rmax):
    bw = map_border_width(w, h)
    margin = jmax_n(bw / jmax(1, w - 1), bw / jmax(1, h - 1), 0.14)

    def clamp01(v):
        return jmax(margin, jmin(1 - margin, v))

    inset = margin + 0.06
    out = []
    for aq, ar in [(0.5, 0.5), (inset, inset), (1 - inset, inset), (1 - inset, 1 - inset), (inset, 1 - inset)]:
        nq = clamp01(aq + (rand() - 0.5) * 0.035)
        nr = clamp01(ar + (rand() - 0.5) * 0.035)
        out.append((nq, nr, rmin + rand() * (rmax - rmin)))
    return out


def nearest_zone(nq, nr, cs):
    best_i, best_d = 0, INF
    for i, c in enumerate(cs):
        d = fhypot(nq - c[0], nr - c[1])
        if d < best_d:
            best_d, best_i = d, i
    return best_i


def second_nearest(nq, nr, cs):
    d = sorted(fhypot(nq - c[0], nr - c[1]) for c in cs)
    return d[1] if len(d) > 1 else INF


def warp(p, q, r, ns, mul, off, octs, amp):
    return fbm(p, q * ns * mul + off, r * ns * mul + off, octs) * amp


def land_kontynenty(q, r, w, h, cs, p, ns):
    nq = jdiv(q, w - 1)
    nr = jdiv(r, h - 1)
    bf = border_fade(q, r, w, h)
    er = edge_rect_fade(q, r, w, h)
    if bf <= 0 or er <= 0:
        return 0.0
    zi = nearest_zone(nq, nr, cs)
    c = cs[zi]
    dc = fhypot(nq - c[0], nr - c[1])
    d2 = second_nearest(nq, nr, cs)
    if d2 - dc < 0.018:
        return 0.0
    radial = jmax(0, 1 - fpow(dc / c[2], 1.55))
    wc = warp(p, q, r, ns, 0.55, 100, 4, 0.24)
    wf = warp(p, q, r, ns, 1.45, 510, 3, 0.16)
    ang = fatan2(nr - c[1], nq - c[0])
    an = fbm(p, fcos(ang) * 4 + zi * 11, fsin(ang) * 4 + 220, 2) * 0.10
    return jmin(1, jmax(0, (radial + wc + wf + an - 0.09) * bf * er))


def iso_from_center(q, r, w, h):
    md = jmax_n(1, w - 1, h - 1)
    return (q - (w - 1) / 2) / md, (r - (h - 1) / 2) / md


def norm_to_iso(nq, nr, w, h):
    md = jmax_n(1, w - 1, h - 1)
    return (nq - 0.5) * (w - 1) / md, (nr - 0.5) * (h - 1) / md


def pangea_t(lf):
    return jmax(0, jmin(1, (lf - 0.15) / 0.70))


def pangea_layout(lf, w, h):
    t = pangea_t(lf)
    ms = math.sqrt((w * h) / 20160)
    sb = jmin(0.06, jmax(0, (ms - 1) * 0.04))
    high = jmax(0, (t - 0.55) / 0.45)
    low = jmax(0, 1 - t / 0.45)
    pull = 0.02 + sb * 0.55 + high * 0.04 + low * 0.03
    return [
        2 if t < 0.28 else 4 if t < 0.55 else 6,
        0.10 + t * 0.11 + sb * 0.45,
        0.16 + t * 0.18 + sb * 0.9,
        jmax(0.005, 0.012 + t * 0.02 + sb * 0.06 - pull),
        jmax(0.02, 0.035 + t * 0.07 + sb * 0.16 - pull * 1.2),
        0.18 + t * 0.36 + sb,
        0.17 - t * 0.10,
        0.36 + t * 0.16 + sb * 0.12 + high * 0.08,
        0.22 + t * 0.18 + sb * 0.06 + high * 0.06,
        0.04 + t * 0.22,
        jmax(0.015, 0.045 + t * 0.025 - low * 0.02),
        0.03 + t * 0.08,
    ]


def build_pangea_centers(rand, w, h, lf):
    L = pangea_layout(lf, w, h)
    bw = map_border_width(w, h)
    margin = jmax_n(bw / jmax(1, w - 1), bw / jmax(1, h - 1), 0.12)

    def clamp01(v):
        return jmax(margin, jmin(1 - margin, v))

    maxdim = jmax_n(1, w - 1, h - 1)
    out = []
    nq = clamp01(0.5 + (rand() - 0.5) * 0.028)
    nr = clamp01(0.5 + (rand() - 0.5) * 0.028)
    out.append((nq, nr, L[1] + rand() * (L[2] - L[1])))
    slots = int(L[0]) - 1
    for i in range(slots):
        angle = (2 * math.pi * i) / slots + (rand() - 0.5) * 0.45
        ring_r = L[3] + rand() * (L[4] - L[3])
        ix = fcos(angle) * ring_r
        iy = fsin(angle) * ring_r
        nq = clamp01(0.5 + jdiv(ix * maxdim, w - 1) + (rand() - 0.5) * 0.028)
        nr = clamp01(0.5 + jdiv(iy * maxdim, h - 1) + (rand() - 0.5) * 0.028)
        span = L[2] - L[1]
        out.append((nq, nr, L[1] * 1.06 + rand() * span * 1.12))
    return out


def blob_score(q, r, w, h, c, zi, p, ns):
    px, py = iso_from_center(q, r, w, h)
    cx, cy = norm_to_iso(c[0], c[1], w, h)
    dc = fhypot(px - cx, py - cy)
    radial = jmax(0, 1 - fpow(dc / c[2], 1.55))
    wc = fbm(p, q * ns * 0.55 + 100 + zi * 37, r * ns * 0.55 + 100, 4) * 0.24
    wf = fbm(p, q * ns * 1.45 + 510 + zi * 17, r * ns * 1.45 + 510, 3) * 0.16
    ang = fatan2(py - cy, px - cx)
    an = fbm(p, fcos(ang) * 4 + zi * 11, fsin(ang) * 4 + 220, 2) * 0.10
    return radial + wc + wf + an - 0.09


def land_pangea(q, r, w, h, cs, p, ns, lf):
    L = pangea_layout(lf, w, h)
    bf = border_fade(q, r, w, h)
    if bf <= 0:
        return 0.0
    bmax, bsum = 0.0, 0.0
    for zi, c in enumerate(cs):
        s = blob_score(q, r, w, h, c, zi, p, ns)
        bmax = jmax(bmax, s)
        bsum += jmax(0, s)
    merged = jmin(1, bsum * L[7] + bmax * L[8])
    ix, iy = iso_from_center(q, r, w, h)
    cd = fhypot(ix, iy)
    cf = jmax(0, 1 - fpow(cd / L[5], 2.2))
    valley = fbm(p, q * ns * 0.38 + 900, r * ns * 0.38 + 900, 4) * L[10]
    gw = fbm(p, q * ns * 0.45 + 200, r * ns * 0.45 + 200, 3) * L[9]
    return jmin(1, jmax(0, (merged + gw - valley - L[6]) * cf * bf))


def build_island_centers(rand, w, h):
    bw = map_border_width(w, h)
    margin = jmax_n(bw / jmax(1, w - 1), bw / jmax(1, h - 1), 0.08)

    def clamp01(v):
        return jmax(margin, jmin(1 - margin, v))

    cell = 1 / GRID
    ms = math.sqrt((w * h) / 8000)
    sm = jmin(1.14, jmax(0.86, 0.92 + ms * 0.07))
    base_r = cell * 0.32 * sm
    out = []
    for row in range(GRID):
        for col in range(GRID):
            nq = clamp01((col + 0.5) * cell + (rand() - 0.5) * cell * 0.22)
            nr = clamp01((row + 0.5) * cell + (rand() - 0.5) * cell * 0.22)
            out.append((nq, nr, base_r * (0.82 + rand() * 0.28)))
    return out


def cell_idx(coord, size):
    return int(jmin(GRID - 1, math.floor(jdiv(coord * GRID, jmax(1, size)))))


def island_cell_index(q, r, w, h):
    return cell_idx(r, h) * GRID + cell_idx(q, w)


def land_wyspy(q, r, w, h, cs, p, ns):
    nq = q / jmax(1, w - 1)
    nr = r / jmax(1, h - 1)
    bf = border_fade(q, r, w, h)
    er = edge_rect_fade(q, r, w, h)
    if bf <= 0 or er <= 0:
        return 0.0
    col, row = cell_idx(q, w), cell_idx(r, h)
    zi = row * GRID + col
    c = cs[zi]
    cw = 1 / GRID
    left, right, top, bottom = col * cw, (col + 1) * cw, row * cw, (row + 1) * cw
    lane_half = 0.062
    dte = jmin_n(nq - left, right - nq, nr - top, bottom - nr)
    lane = jmin(1, jmax(0, dte / lane_half))
    if lane <= 0:
        return 0.0
    dc = fhypot(nq - c[0], nr - c[1])
    radial = jmax(0, 1 - fpow(dc / c[2], 1.88))
    wc = warp(p, q, r, ns, 0.62, 350, 4, 0.18)
    wf = warp(p, q, r, ns, 1.55, 620, 3, 0.10)
    ang = fatan2(nr - c[1], nq - c[0])
    an = fbm(p, fcos(ang) * 5 + zi * 7, fsin(ang) * 5 + 330, 2) * 0.07
    return jmin(1, jmax(0, (radial + wc + wf + an - 0.12) * bf * er * lane))


def land_ziemia(q, r, w, h, p, ns):
    if earth_land_at(q, r, w, h) <= 0:
        return 0.0
    coast = fbm(p, q * ns * 0.85 + 880, r * ns * 0.85 + 880, 3) * 0.09
    return jmin(1, jmax(0, 0.94 + coast - 0.05))


# ----------------------------------------------------------------------------------------------
# porownania: jsmath.json
# ----------------------------------------------------------------------------------------------
JS = json.load(open(f'{vec_dir}/jsmath.json', encoding='utf8'))
for a, b, res in JS['pow']:
    check(same(fpow(num(a), num(b)), num(res)), f'pow {a} {b}')
for a, b, res in JS['atan2']:
    check(same(fatan2(num(a), num(b)), num(res)), f'atan2 {a} {b}')
for a, res in JS['sin']:
    check(same(fsin(num(a)), num(res)), f'sin {a}')
for a, b, res in JS['hypot']:
    check(same(fhypot(num(a), num(b)), num(res)), f'hypot {a} {b}')

# ----------------------------------------------------------------------------------------------
# core.json
# ----------------------------------------------------------------------------------------------
CO = json.load(open(f'{vec_dir}/core.json', encoding='utf8'))
cn = CO['consts']
check(cn['kontynenty_zone_count'] == KONT_ZONES and cn['island_grid_divisions'] == GRID, 'stale: liczby stref')
check(cn['map_border_ocean_hexes'] == BORDER_OCEAN and cn['map_margin_land_zone_hexes'] == MARGIN_ZONE, 'stale: brzeg')
check([tuple(num(x) for x in c) for c in cn['ziemia_land_centers']] == ZIEMIA_CENTERS, 'ZIEMIA_LAND_CENTERS')
for row in CO['perms']:
    check(build_perm(mulberry(row['seed'])) == row['table'], f"perm {row['seed']}")
for row in CO['shape_params']:
    f = mulberry(row['seed'])
    vals = default_shape_params(f)
    check(all(same(a, num(b)) for a, b in zip(vals, row['values'])), f"shape {row['seed']}")
    check(same(f(), num(row['after'][0])) and same(f(), num(row['after'][1])), f"shape after {row['seed']}")
for case in CO['land_mask_at']:
    w, h = case['w'], case['h']
    i = 0
    for r in range(-1, h + 1):
        for q in range(-1, w + 1):
            check(same(land_mask_at(q, r, w, h), num(case['values'][i])), f'land_mask_at {w}x{h} {q},{r}')
            i += 1
for row in CO['center_count']:
    check(center_count(row['w'], row['h'], row['typ']) == row['n'], f"center_count {row}")


def to_opts(o):
    return None if o is None else dict(o)


def cmp_centers(got, exp, what):
    ok = len(got) == len(exp) and all(
        same(g[0], num(e[0])) and same(g[1], num(e[1])) and same(g[2], num(e[2])) for g, e in zip(got, exp))
    check(ok, what)


for row in CO['build_continent_centers']:
    f = mulberry(row['seed'])
    cs = build_continent_centers(f, row['n'], to_opts(row['opts']))
    cmp_centers(cs, row['centers'], f"continent_centers seed {row['seed']} n {row['n']} opts {row['opts']}")
    check(all(same(f(), num(x)) for x in row['after']), f"continent_centers rand seed {row['seed']} n {row['n']}")
for row in CO['five_zone']:
    f = mulberry(row['seed'])
    cs = build_five_zone(f, row['w'], row['h'], num(row['rmin']), num(row['rmax']))
    cmp_centers(cs, row['centers'], f"five_zone {row['seed']} {row['w']}x{row['h']}")
    check(all(same(f(), num(x)) for x in row['after']), f"five_zone rand {row['seed']}")
for sset in CO['voronoi']:
    cs = [tuple(num(x) for x in c) for c in sset['centers']]
    for nq, nr, idx, d2 in sset['points']:
        check(nearest_zone(num(nq), num(nr), cs) == idx, f"voronoi idx {sset['name']} {nq} {nr}")
        check(same(second_nearest(num(nq), num(nr), cs), num(d2)), f"voronoi d2 {sset['name']} {nq} {nr}")
for lf, res in CO['pangea_land_t']:
    check(same(pangea_t(num(lf)), num(res)), f'pangea_t {lf}')
for row in CO['pangea_layout']:
    got = pangea_layout(num(row['lf']), row['w'], row['h'])
    check(all(same(float(g), num(e)) for g, e in zip(got, row['values'])), f"pangea_layout {row['w']}x{row['h']} {row['lf']}")
for row in CO['pangea_centers']:
    f = mulberry(row['seed'])
    cs = build_pangea_centers(f, row['w'], row['h'], num(row['lf']))
    cmp_centers(cs, row['centers'], f"pangea_centers {row['seed']} {row['w']}x{row['h']} {row['lf']}")
    check(all(same(f(), num(x)) for x in row['after']), f"pangea_centers rand {row['seed']}")
for row in CO['island_centers']:
    f = mulberry(row['seed'])
    cs = build_island_centers(f, row['w'], row['h'])
    cmp_centers(cs, row['centers'], f"island_centers {row['seed']} {row['w']}x{row['h']}")
    check(all(same(f(), num(x)) for x in row['after']), f"island_centers rand {row['seed']}")
for case in CO['island_cell']:
    w, h = case['w'], case['h']
    i = 0
    for r in range(-2, h + 2):
        for q in range(-2, w + 2):
            check(island_cell_index(q, r, w, h) == case['indices'][i], f'island_cell {w}x{h} {q},{r}')
            i += 1
for case in CO['island_assign']:
    w, h = case['w'], case['h']
    exp = [[f'{q},{r}', island_cell_index(q, r, w, h)] for r in range(h) for q in range(w)]
    check(exp == case['entries'], f'island_assign {w}x{h}')
for case in CO['isotropic']:
    w, h = case['w'], case['h']
    for q, r, x, y, nq, nr, ix, iy in case['points']:
        gx, gy = iso_from_center(q, r, w, h)
        check(same(gx, num(x)) and same(gy, num(y)), f'isotropic {w}x{h} {q},{r}')
        hx_, hy_ = norm_to_iso(num(nq), num(nr), w, h)
        check(same(hx_, num(ix)) and same(hy_, num(iy)), f'norm_to_iso {w}x{h} {nq},{nr}')
for d, res in CO['border']['margin_cap']:
    got = margin_cap(num(d))
    check((got is None and res is None) or (got is not None and res is not None and same(got, num(res))), f'margin_cap {d}')
for case in CO['border']['fields']:
    w, h = case['w'], case['h']
    check(same(float(map_border_width(w, h)), num(case['border_width'])), f'border_width {w}x{h}')
    i = 0
    for r in range(-1, h + 1):
        for q in range(-1, w + 1):
            row = case['rows'][i]
            check(same(hex_border_distance(q, r, w, h), num(row[0])), f'hex_border_distance {w}x{h} {q},{r}')
            check(same(border_fade(q, r, w, h), num(row[1])), f'border_fade {w}x{h} {q},{r}')
            check(same(edge_rect_fade(q, r, w, h), num(row[2])), f'edge_rect_fade {w}x{h} {q},{r}')
            i += 1


# ----------------------------------------------------------------------------------------------
# masks.json
# ----------------------------------------------------------------------------------------------
def fnv_bits(values):
    h = 0xCBF29CE484222325
    for v in values:
        for byte in struct.pack('<d', v):
            h ^= byte
            h = (h * 0x100000001B3) & 0xFFFFFFFFFFFFFFFF
    return f'{h:016x}'


MA = json.load(open(f'{vec_dir}/masks.json', encoding='utf8'))
for case in MA['cases']:
    typ, w, h = case['type'], case['w'], case['h']
    lf = num(case['lf'])
    f = mulberry(case['seed'])
    perm = build_perm(f)
    shape = default_shape_params(f)
    ns = shape[0]
    if typ == 'kontynenty':
        cs = build_five_zone(f, w, h, 0.17, 0.26)
    elif typ == 'pangea':
        cs = build_pangea_centers(f, w, h, lf)
    elif typ == 'wyspy':
        cs = build_island_centers(f, w, h)
    else:
        cs = []
    check(same(f(), num(case['rest_after_chain'])), f'mask chain rand {typ} {w}x{h}')
    cmp_centers(cs, case['centers'], f'mask centers {typ} {w}x{h}')
    q0, q1, r0, r1 = case['range']
    vals = []
    big = case['count'] > 25000  # duze mapy: pelny FNV sprawdza test Rust; tu probki co 97. heks
    wanted = {i for i, _ in case['sample']} if big else None
    idx_ = -1
    for r in range(r0, r1 + 1):
        for q in range(q0, q1 + 1):
            idx_ += 1
            if big and idx_ not in wanted:
                vals.append(0.0)
                continue
            if typ == 'kontynenty':
                v = land_kontynenty(q, r, w, h, cs, perm, ns)
            elif typ == 'pangea':
                v = land_pangea(q, r, w, h, cs, perm, ns, lf)
            elif typ == 'wyspy':
                v = land_wyspy(q, r, w, h, cs, perm, ns)
            else:
                v = land_ziemia(q, r, w, h, perm, ns)
            vals.append(v)
    check(len(vals) == case['count'], f'mask count {typ} {w}x{h}')
    if not big:
        check(fnv_bits(vals) == case['fnv'], f"mask fnv {typ} {w}x{h} seed {case['seed']} lf {lf}")
    if 'values' in case:
        for i, (a, e) in enumerate(zip(vals, case['values'])):
            check(same(a, num(e)), f'mask {typ} {w}x{h} #{i}')
    else:
        for i, e in case['sample']:
            check(same(vals[i], num(e)), f'mask sample {typ} {w}x{h} #{i}')
meta = MA['blob_score_meta']
perm = build_perm(mulberry(meta['seed_perm']))
cs = build_pangea_centers(mulberry(meta['seed_centers']), meta['w'], meta['h'], num(meta['lf']))
for q, r, z, res in MA['blob_score']:
    check(same(blob_score(q, r, meta['w'], meta['h'], cs[z], z, perm, num(meta['noise_scale'])), num(res)), f'blob_score {q},{r},{z}')

# ----------------------------------------------------------------------------------------------
# earth.json (zakresy earth-land-mask.ts przydzielone M03)
# ----------------------------------------------------------------------------------------------
EA = json.load(open(f'{vec_dir}/earth.json', encoding='utf8'))
check(EA['consts'] == {'EARTH_PLAYABLE_BORDER': BORDER, 'EARTH_POLAR_OCEAN_REF_ROWS': REF_ROWS,
                       'EARTH_POLAR_OCEAN_REF_INNER_H': REF_INNER}, 'earth stale')
for h, ih, pr, north, south, lr in EA['heights']:
    check(inner_h(h) == ih and polar_rows(h) == pr and pr == north and pr == south and land_rows(h) == lr,
          f'earth wysokosc {h}')
for w, iw in EA['widths']:
    check(inner_w(w) == iw, f'earth szerokosc {w}')
for w, h, st, th in EA['dims']:
    check(steps_for(w, h) == st and same(thr_for(w, h), num(th)), f'earth podprobkowanie {w}x{h}')
for x, y, v in EA['bits']:
    check(bit_at(x, y) == v, f'earth bitAt {x},{y}')

# ----------------------------------------------------------------------------------------------
# edges.json
# ----------------------------------------------------------------------------------------------
ED = json.load(open(f'{vec_dir}/edges.json', encoding='utf8'))
for row in ED['layout']:
    lf = num(row['lf'])
    check(same(pangea_t(lf), num(row['t'])), f"edges t {row['lf']}")
    got = pangea_layout(lf, row['w'], row['h'])
    check(all(same(float(g), num(e)) for g, e in zip(got, row['values'])), f"edges layout {row['w']}x{row['h']} {row['lf']}")
for case in ED['edge_rect']:
    w, h = case['w'], case['h']
    for q, r, e1, e2 in case['rows']:
        check(same(edge_rect_fade(q, r, w, h), num(e1)), f'edges edge_rect {w}x{h} {q},{r}')
        check(same(border_fade(q, r, w, h), num(e2)), f'edges border_fade {w}x{h} {q},{r}')

# ----------------------------------------------------------------------------------------------
# Tabela Rusta vs transkrypcja i vs literaly TS
# ----------------------------------------------------------------------------------------------
T = json.load(open(f'{engine}/data/derived/mapgen-masks.json', encoding='utf8'))


def leaves(obj, path=''):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == 'zrodlo':
                continue
            yield from leaves(v, f'{path}.{k}')
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from leaves(v, f'{path}[{i}]')
    elif isinstance(obj, (int, float)) and not isinstance(obj, bool):
        yield path, obj


ts_nums = set()
for tok in re.findall(r'(?<![A-Za-z_0-9.])-?\d+(?:\.\d+)?', scope_text):
    ts_nums.add(float(tok))
# Wyrazenia wyliczane w TS (nie literaly): 1/GRID, 0.062 itd. sa literalami; wyjatki jawne.
derived_ok = {'.pangea.wysoki_zakres', '.pangea.niski_zakres', '.brzeg.dzielnik_zaniku'}
for path, value in leaves(T):
    check(float(value) in ts_nums or path in derived_ok, f'tabela Rusta: {path}={value} brak jako literal w TS')

K, P, WY, Z = T['kontynenty'], T['pangea'], T['wyspy'], T['ziemia']
pairs = [
    (T['ksztalt']['skala_szumu'], 0.13), (T['ksztalt']['skala_gor'], 0.22), (T['ksztalt']['skala_lasu'], 0.19),
    (T['ksztalt']['skala_pustyni'], 0.17), (T['ksztalt']['zakres_przesuniec'], 500),
    (T['eliptyczna']['promien'], 0.85), (T['eliptyczna']['wykladnik'], 2.0), (T['eliptyczna']['dodatek_polowki'], 0.5),
    (T['brzeg']['ocean_heksy'], BORDER_OCEAN), (T['brzeg']['strefa_marginesu_heksy'], MARGIN_ZONE),
    (T['brzeg']['krok_limitu'], 0.05), (T['brzeg']['dzielnik_zaniku'], 0.45), (T['brzeg']['min_margines'], 0.001),
    (T['centra']['promien_min'], 0.28), (T['centra']['promien_max'], 0.40), (T['centra']['margines_min'], 0.12),
    (T['centra']['pierscien_min'], 0.16), (T['centra']['pierscien_max'], 0.32), (T['centra']['proby'], 40),
    (T['centra']['jitter_kata'], 0.45), (T['centra']['domyslna_szerokosc'], 120), (T['centra']['domyslna_wysokosc'], 80),
    (T['centra']['kotwica_udzial_promienia'], 0.5), (T['centra']['min_odleglosc'], 0),
    (K['liczba_stref'], KONT_ZONES), (K['obszar_male'], 2000), (K['obszar_srednie'], 6000),
    (K['liczba_male'], 2), (K['liczba_srednie'], 3), (K['liczba_duze'], 4),
    (K['piecio_margines_min'], 0.14), (K['piecio_jitter'], 0.035), (K['piecio_odsuniecie'], 0.06),
    (K['ciesnina'], 0.018), (K['wykladnik_radialny'], 1.55), (K['odjemnik'], 0.09),
    (K['szum_gruby']['mnoznik_skali'], 0.55), (K['szum_gruby']['przesuniecie'], 100), (K['szum_gruby']['oktawy'], 4), (K['szum_gruby']['amplituda'], 0.24),
    (K['szum_drobny']['mnoznik_skali'], 1.45), (K['szum_drobny']['przesuniecie'], 510), (K['szum_drobny']['oktawy'], 3), (K['szum_drobny']['amplituda'], 0.16),
    (K['szum_kata']['mnoznik_kata'], 4), (K['szum_kata']['mnoznik_strefy'], 11), (K['szum_kata']['przesuniecie'], 220), (K['szum_kata']['oktawy'], 2), (K['szum_kata']['amplituda'], 0.10),
    (P['t_dolny'], 0.15), (P['t_zakres'], 0.70), (P['powierzchnia_odniesienia'], 20160), (P['boost_max'], 0.06), (P['boost_wsp'], 0.04),
    (P['wysoki_prog'], 0.55), (P['wysoki_zakres'], 0.45), (P['niski_zakres'], 0.45),
    (P['sciagniecie']['baza'], 0.02), (P['sciagniecie']['rozmiar'], 0.55), (P['sciagniecie']['wysoki'], 0.04), (P['sciagniecie']['niski'], 0.03),
    (P['prog_male'], 0.28), (P['prog_srednie'], 0.55), (P['liczba_male'], 2), (P['liczba_srednie'], 4), (P['liczba_duze'], 6),
    (P['promien_blobu_min']['baza'], 0.10), (P['promien_blobu_min']['t'], 0.11), (P['promien_blobu_min']['rozmiar'], 0.45),
    (P['promien_blobu_max']['baza'], 0.16), (P['promien_blobu_max']['t'], 0.18), (P['promien_blobu_max']['rozmiar'], 0.9),
    (P['pierscien_min']['dolna_granica'], 0.005), (P['pierscien_min']['baza'], 0.012), (P['pierscien_min']['t'], 0.02), (P['pierscien_min']['rozmiar'], 0.06),
    (P['pierscien_max']['dolna_granica'], 0.02), (P['pierscien_max']['baza'], 0.035), (P['pierscien_max']['t'], 0.07), (P['pierscien_max']['rozmiar'], 0.16), (P['pierscien_max']['sciagniecie'], 1.2),
    (P['promien_klastra']['baza'], 0.18), (P['promien_klastra']['t'], 0.36), (P['prog']['baza'], 0.17), (P['prog']['t'], 0.10),
    (P['scalanie_suma']['baza'], 0.36), (P['scalanie_suma']['t'], 0.16), (P['scalanie_suma']['rozmiar'], 0.12), (P['scalanie_suma']['wysoki'], 0.08),
    (P['scalanie_max']['baza'], 0.22), (P['scalanie_max']['t'], 0.18), (P['scalanie_max']['rozmiar'], 0.06), (P['scalanie_max']['wysoki'], 0.06),
    (P['warp_globalny_wsp']['baza'], 0.04), (P['warp_globalny_wsp']['t'], 0.22),
    (P['dolina_wsp']['dolna_granica'], 0.015), (P['dolina_wsp']['baza'], 0.045), (P['dolina_wsp']['t'], 0.025), (P['dolina_wsp']['niski'], 0.02),
    (P['wypelnienie_min']['baza'], 0.03), (P['wypelnienie_min']['t'], 0.08),
    (P['centra']['margines_min'], 0.12), (P['centra']['jitter'], 0.028), (P['centra']['pierscien_promien_mnoznik'], 1.06),
    (P['centra']['pierscien_rozrzut'], 1.12), (P['centra']['jitter_kata'], 0.45),
    (P['blob']['wykladnik_radialny'], 1.55), (P['blob']['przesuniecie_strefy_gruby'], 37), (P['blob']['przesuniecie_strefy_drobny'], 17), (P['blob']['odjemnik'], 0.09),
    (P['maska']['wykladnik_klastra'], 2.2), (P['maska']['dolina']['mnoznik_skali'], 0.38), (P['maska']['dolina']['przesuniecie'], 900), (P['maska']['dolina']['oktawy'], 4),
    (P['maska']['warp_globalny']['mnoznik_skali'], 0.45), (P['maska']['warp_globalny']['przesuniecie'], 200), (P['maska']['warp_globalny']['oktawy'], 3),
    (WY['siatka'], GRID), (WY['margines_min'], 0.08), (WY['powierzchnia_odniesienia'], 8000),
    (WY['rozmiar']['baza'], 0.92), (WY['rozmiar']['wsp'], 0.07), (WY['rozmiar']['min'], 0.86), (WY['rozmiar']['max'], 1.14),
    (WY['promien_komorki'], 0.32), (WY['jitter'], 0.22), (WY['promien_zakres']['baza'], 0.82), (WY['promien_zakres']['rozrzut'], 0.28),
    (WY['pas_morski'], 0.062), (WY['wykladnik_radialny'], 1.88), (WY['odjemnik'], 0.12),
    (WY['szum_gruby']['mnoznik_skali'], 0.62), (WY['szum_gruby']['przesuniecie'], 350), (WY['szum_gruby']['oktawy'], 4), (WY['szum_gruby']['amplituda'], 0.18),
    (WY['szum_drobny']['mnoznik_skali'], 1.55), (WY['szum_drobny']['przesuniecie'], 620), (WY['szum_drobny']['oktawy'], 3), (WY['szum_drobny']['amplituda'], 0.10),
    (WY['szum_kata']['mnoznik_kata'], 5), (WY['szum_kata']['mnoznik_strefy'], 7), (WY['szum_kata']['przesuniecie'], 330), (WY['szum_kata']['oktawy'], 2), (WY['szum_kata']['amplituda'], 0.07),
    (Z['szum_brzegu']['mnoznik_skali'], 0.85), (Z['szum_brzegu']['przesuniecie'], 880), (Z['szum_brzegu']['oktawy'], 3), (Z['szum_brzegu']['amplituda'], 0.09),
    (Z['poziom_ladu'], 0.94), (Z['odjemnik'], 0.05),
]
for i, (got, want) in enumerate(pairs):
    check(float(got) == float(want), f'tabela Rusta para #{i}: {got} != {want}')
check([(c['nq'], c['nr'], c['radius']) for c in Z['centra']] == ZIEMIA_CENTERS, 'tabela Rusta: centra Ziemi')

print(f'SPRAWDZEN: {checks}')
print(f'ROZBIEZNOSCI: {len(bad)}')
for b in bad[:30]:
    print('  -', b)
sys.exit(1 if bad else 0)
