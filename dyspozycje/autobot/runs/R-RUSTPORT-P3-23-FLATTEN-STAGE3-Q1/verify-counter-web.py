#!/usr/bin/env python3
"""Niezalezny weryfikator macierzy COUNTER (P3-23 etap 3, wiersz 35g).

Nie uzywa kodu weba ani generatora. Liczy oczekiwane mnozniki z surowego
gra/data/counters.json (archiwum edb8fb56) wg reguly webu counterMultiplier
(combat.ts:527-549): tylko wiersze Rodzaj=Atak i Status=potwierdzone, dopasowanie
podciagowe bez wielkosci liter, Bonus "+N%"/"-N%" -> 1 + N/100, brak wiersza -> 1.0.

Porownuje:
  A) oczekiwane (ten skrypt) vs tabela Rust rust-port/engine/data/derived/counter-multipliers.json
  B) oczekiwane (ten skrypt) vs wynik uruchomionego kodu weba (gen-counter-web.mjs)
  C) stara macierz literalowa Rust (plik przed zmiana, z git 2a45e340) vs tabela (było/jest)

Uzycie:
  python3 verify-counter-web.py <KORZEN_WEB> <tabela_rust.json> <web_gen.json> <combat_rs_przed.rs>
Wyjscie: linia "ROZBIEZNOSCI: N"; kod 0 gdy N == 0.
"""
import json
import re
import sys

root, table_path, web_gen_path, old_rs_path = sys.argv[1:5]

raw = json.load(open(f"{root}/gra/data/counters.json", encoding="utf-8"))


def num_bonus(text):
    cleaned = text.strip().replace("−", "-").replace("%", "")
    if not cleaned:
        return None
    try:
        return float(cleaned) / 100.0
    except ValueError:
        return None


def expected(attacker, defender):
    a_low = attacker.lower()
    d_low = defender.lower()
    for c in raw:
        if c.get("Status") != "potwierdzone":
            continue
        if c.get("Rodzaj (Atak/Obrona)") != "Atak":
            continue
        atk = (c.get("Typ atakujący") or c.get("Typ atakujacy") or "").lower()
        cel = c.get("Cel (typ)", "").lower()
        atk_match = a_low in atk or atk in a_low
        def_alts = [s.strip() for s in cel.split("/")]
        def_match = any(d_low in alt or alt in d_low for alt in def_alts)
        if atk_match and def_match:
            frac = num_bonus(c.get("Bonus", ""))
            return 1.0 + frac if frac is not None else 1.5
    return 1.0


table = json.load(open(table_path, encoding="utf-8"))
web_gen = json.load(open(web_gen_path, encoding="utf-8"))
rust_pairs = {(p["atakujacy"], p["cel"]): p["mnoznik"] for p in table["pary"]}
web_pairs = {(p["atakujacy"], p["cel"]): p["mnoznik"] for p in web_gen["pary"]}
typy = table["typy"]

rozbieznosci = 0
for a in typy:
    for d in typy:
        exp = expected(a, d)
        key = (a, d)
        if key not in rust_pairs:
            rozbieznosci += 1
            print(f"BRAK W TABELI RUST: {a} -> {d}")
            continue
        if abs(rust_pairs[key] - exp) > 1e-12:
            rozbieznosci += 1
            print(f"A ROZNI SIE: {a} -> {d}: tabela={rust_pairs[key]} oczekiwane={exp}")
        if key not in web_pairs or abs(web_pairs[key] - exp) > 1e-12:
            rozbieznosci += 1
            print(f"B ROZNI SIE: {a} -> {d}: kod_webu={web_pairs.get(key)} oczekiwane={exp}")

# C) stara macierz literalowa z combat.rs (przed zmiana): match (attacker, defender) => literal.
old_src = open(old_rs_path, encoding="utf-8").read()
block = old_src[old_src.index("pub fn counter_multiplier("):]
block = block[block.index("match (attacker.as_str(), defender.as_str())"):]
block = block[: block.index("_ => 1.0")]
old = {}
for arms, val in re.findall(r"((?:\s*\|?\s*\(\"[a-z]+\", \"[a-z]+\"\))+)\s*=>\s*([0-9.]+)", block):
    for a, d in re.findall(r"\(\"([a-z]+)\", \"([a-z]+)\"\)", arms):
        old[(a, d)] = float(val)
for a in typy:
    for d in typy:
        was = old.get((a, d), 1.0)
        now = rust_pairs[(a, d)]
        if abs(was - now) > 1e-12:
            rozbieznosci += 1
            print(f"C BYLO/JEST ROZNI SIE: {a} -> {d}: bylo={was} jest={now}")
print(f"PAR_NIEZERO_OCZEKIWANE: {sum(1 for a in typy for d in typy if expected(a, d) != 1.0)}")
print(f"PAR_NIEZERO_STARE_LITERAL: {len(old)}")
print(f"ROZBIEZNOSCI: {rozbieznosci}")
sys.exit(0 if rozbieznosci == 0 else 1)
