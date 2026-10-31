"""Mutanty R2 (Operator r2, odpowiedz na zarzuty Evaluatora).

Baza: mutants_v2.M (48 mutantow r1). R2 zmienia tekst trzech mutantow z powodu poprawki
(`is_js_trim_char`, `js_clamp_unit` z normalizacja -0.0) i dokleja cztery nowe:
M49-M51 (galezie trim: Rust-trim, bez FEFF, bez wykluczenia NEL) oraz M52 (normalizacja -0.0).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mutants_v2 import M as BASE  # noqa: E402

TRIM_OLD = "(c.is_whitespace() && c != '\\u{0085}') || c == '\\u{FEFF}'"
MAP_OLD = ".map(|zloze| zloze.trim_matches(is_js_trim_char).to_lowercase())"
CLAMP_OLD = "    let v = x.clamp(0.0, 1.0);"
NEG0_OLD = "    if v == 0.0 {\n        0.0\n    } else {\n        v\n    }"

FIX = {
    # M25/M26 celowaly w `x.clamp(0.0, 1.0)`; po poprawce wyrazenie siedzi w `let v = ...`.
    "M25": (CLAMP_OLD, "    let v = x.min(1.0);"),
    "M26": (CLAMP_OLD, "    let v = x.max(0.0);"),
    # M35/M36 celowaly w stary `.trim().to_lowercase()`; po poprawce trim to `trim_matches`.
    "M35": (MAP_OLD, ".map(|zloze| zloze.trim_matches(is_js_trim_char).to_owned())"),
    "M36": (MAP_OLD, ".map(|zloze| zloze.to_lowercase())"),
}

M = []
for mid, old, new, klass in BASE:
    if mid in FIX:
        old, new = FIX[mid]
    M.append((mid, old, new, klass))

M += [
    # Galaz trim: JS `trim` = is_js_trim_char. Rust-trim (bez FEFF, z NEL) ma byc zabity wektorami.
    ("M49", TRIM_OLD, "c.is_whitespace()", "zabic"),
    ("M50", TRIM_OLD, "c.is_whitespace() && c != '\\u{0085}'", "zabic"),
    ("M51", TRIM_OLD, "c.is_whitespace() || c == '\\u{FEFF}'", "zabic"),
    # Normalizacja -0.0 w js_clamp_unit: bez niej sprawdza test znaku zera.
    ("M52", NEG0_OLD, "    v", "zabic"),
]
