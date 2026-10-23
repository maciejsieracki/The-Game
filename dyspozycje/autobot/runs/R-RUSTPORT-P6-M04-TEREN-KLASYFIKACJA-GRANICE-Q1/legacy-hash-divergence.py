#!/usr/bin/env python3
"""Pomiar: czy STARY `map_generator::hash_int3` (u32 `wrapping_mul`, src/domain/map_generator.rs:909-914)
daje to samo co web `hashInt3` (iloczyny w f64 -> ToInt32; gen-helpers.ts:899-904), czyli to, co M04
odtwarza w `terrain_class::hash_int3`. Obie strony liczone w Pythonie wprost ze specyfikacji:
  web : ToInt32(a*374761393.0) ^ ToInt32(b*668265263.0) ^ ToInt32(c*2246822519.0), imul, shifty
  stary Rust: a*374761393 mod 2^32 ^ b*668265263 mod 2^32 ^ c*2246822519 mod 2^32, imul, shifty
(web zweryfikowany wektorami z uruchomionego weba w verify-m04-vectors.py / p6_m04_classify.rs).
Uzycie: legacy-hash-divergence.py  (bez argumentow)
"""
import random

M32 = 0xFFFFFFFF


def to_int32(x):
    if isinstance(x, float):
        x = int(x)
    x &= M32
    return x - (1 << 32) if x & 0x80000000 else x


def finish(h):
    h = to_int32(h)
    u = h & M32
    x = to_int32(h ^ (u >> 13))
    h = to_int32((x * 1274126177) & M32)
    u = h & M32
    return ((h ^ (u >> 16)) & M32) / 4294967296


def web(a, b, c):
    return finish(to_int32(float(a) * 374761393.0) ^ to_int32(float(b) * 668265263.0) ^ to_int32(float(c) * 2246822519.0))


def old_rust(a, b, c):
    return finish(((a * 374761393) & M32) ^ ((b * 668265263) & M32) ^ ((c * 2246822519) & M32))


rng = random.Random(20261023)
for label, lo, hi in (("seed <= 99999", 0, 99999), ("seed <= 4_000_000", 0, 4_000_000), ("seed u32 pelny", 0, M32)):
    n = 200000
    diff = 0
    for _ in range(n):
        a = rng.randint(0, 80)
        b = rng.randint(0, 80)
        c = rng.randint(lo, hi)
        if web(a, b, c) != old_rust(a, b, c):
            diff += 1
    print(f"{label}: rozbieznosci {diff}/{n}")
