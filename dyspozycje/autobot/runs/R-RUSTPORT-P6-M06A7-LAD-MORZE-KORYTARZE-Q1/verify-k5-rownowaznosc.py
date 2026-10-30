# Dowod empiryczny rownowaznosci mutanta K5 (round -> floor(x+0.5)) i pomiar pasm granicznych.
# Obrona zarzutow r1 (R-RUSTPORT-P6-M06A7-LAD-MORZE-KORYTARZE-Q1).
# Teza: dla skonczonego x >= 1: floor(fl(x+0.5)) == floor(x+0.5) == Math.round(x).
# Uruchomienie z katalogu worktree: python3 -I <ten plik>
import math
import random
from fractions import Fraction


def exact_round(x):
    # Math.round w dokladnej arytmetyce: najblizsza calkowita, remis w strone +inf
    return math.floor(Fraction(x) + Fraction(1, 2))


def k5(x):
    return math.floor(x + 0.5)  # fl(x+0.5) w IEEE double (Python float)


checked = 0
bad_domain = []
bad_below_one = []

# 1) sasiedztwa kazdego k+0.5, k = 0..64, +-5000 ulp
for k in range(0, 65):
    lo = k + 0.5
    for _ in range(5000):
        lo = math.nextafter(lo, -math.inf)
    x = lo
    for _ in range(10001):
        checked += 1
        if k5(x) != exact_round(x):
            (bad_domain if x >= 1.0 else bad_below_one).append(x)
        x = math.nextafter(x, math.inf)

# 2) sasiedztwa potęg dwojki 2^m (granice binad), m = 0..12
for m in range(0, 13):
    for base in (2.0 ** m - 0.5, 2.0 ** m):
        x = base
        for _ in range(3000):
            x = math.nextafter(x, -math.inf)
        for _ in range(6001):
            if x >= 1.0:
                checked += 1
                if k5(x) != exact_round(x):
                    bad_domain.append(x)
            x = math.nextafter(x, math.inf)

# 3) losowe doubles z domeny raw = 6 + sqrt(...)*2.6 >= 6
random.seed(1)
for _ in range(2000000):
    x = random.uniform(6.0, 40.0)
    checked += 1
    if k5(x) != exact_round(x):
        bad_domain.append(x)

# 4) kontrprzyklad poza domena (test potrafi wykryc rozbieznosc)
ce = 0.49999999999999994
print("kontrprzyklad x<1: floor(fl(x+0.5)) =", k5(ce), " exact round =", exact_round(ce))
print("sprawdzone przypadki:", checked)
print("rozbieznosci dla x >= 1:", len(bad_domain), bad_domain[:5])
print("rozbieznosci dla x < 1 (poza domena):", len(bad_below_one), bad_below_one[:5])
