#!/usr/bin/env python3
"""P6.M07B-Q2 runda 3 - wyczerpujacy dowod rownowaznosci dla `river_corners_along_hex_edges`
(edges.rs:100-146) i `river_transit_edge_indices` (edges.rs:162-175).

Dziedzina funkcji jest skonczona po redukcji: dir_in, dir_out -> rem_euclid(6) (0..5),
hex_parity wplywa tylko przez `hex_parity % 2` (Rust: znak dzielnej). Sprawdzamy WSZYSTKIE
pary (a,b) in 0..5 x parzystosci {-2,-1,0,1,2,3}, dla wariantu oryginalnego i mutantow.

1. Walidacja portu: wariant ORYGINALNY zgodny z wektorami weba (fn="corners", 1250 przypadkow)
   w `web-rivers-b-edges.json`. Bez tej walidacji wyniki mutantow nie maja znaczenia.
2. Mutanty (ID z mutate_m07b2_q2.py):
   E13  parzystosc odwrocona (`% 2 == 1` zamiast `== 0`)
   E14  tie-break cw/ccw zamieniony
   E17  `<=` zamiast `<` przy fallback
   E18  wybor fallback usuniety (zawsze best)
   E19  kolejnosc cw/ccw odwrocona
   E35  parzystosc przekazana do transit przesunieta o +1 (cur.q+cur.r+1)
   E25  deduplikacja usunieta w transit - sprawdzane: czy powstaja duplikaty krawedzi
3. Dla kazdego mutanta: liczba roznic wyjscia wzgledem oryginalu na calej dziedzinie.
   0 roznic = rownowaznosc DOWIEDZIONA wyczerpujaco dla tej dziedziny (ta funkcja nie czyta
   zadnego innego stanu). >0 roznic = mutant zywy, wymagany wektor testowy.

Uzycie: python3 -I corners_exhaustive_m07b2_q2.py   (wyjscie: stdout; log w runie R3)
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(HERE, "web-rivers-b-edges.json")
PARITIES = [-2, -1, 0, 1, 2, 3]


def rust_rem(x, m):
    """Rust `%` (znak dzielnej)."""
    q = int(x / m)  # trunc toward zero, wystarczy dla malych liczb
    return x - q * m


def walk(frm, to, cw):
    if frm == to:
        return [frm]
    out = []
    c = frm
    for _ in range(7):
        out.append(c)
        if c == to:
            break
        c = (c + 1) % 6 if cw else (c + 5) % 6
    return out


def corners(a, b, par, mut=None):
    """Port river_corners_along_hex_edges; `mut` = identyfikator mutanta lub None."""
    if a == b:
        return []
    entry_opts = [(a + 1) % 6, (a + 2) % 6]
    exit_opts = [(b + 1) % 6, (b + 2) % 6]
    cw_order = [False, True] if mut == "E19" else [True, False]
    best, best_score = [], float("inf")
    fallback, fallback_score = [], float("inf")
    for entry in entry_opts:
        for ex in exit_opts:
            for cw in cw_order:
                walked = walk(entry, ex, cw)
                if not walked:
                    continue
                score = float(len(walked))
                even_cond = (rust_rem(par, 2) == 1) if mut == "E13" else (rust_rem(par, 2) == 0)
                if score == best_score and even_cond:
                    if mut == "E14":
                        score += 0.01 if cw else 0.0
                    else:
                        score += 0.0 if cw else 0.01
                elif score == best_score:
                    if mut == "E14":
                        score += 0.0 if cw else 0.01
                    else:
                        score += 0.01 if cw else 0.0
                fallback_hit = (score <= fallback_score) if mut == "E17" else (score < fallback_score)
                if fallback_hit:
                    fallback_score = score
                    fallback = walked
                if len(walked) - 1 < 1:
                    continue
                if score < best_score:
                    best_score = score
                    best = walked
    if mut == "E18":
        return best
    return best if best else fallback


def edge_between(c1, c2):
    if c2 == (c1 + 1) % 6:
        return (c1 + 5) % 6
    if c2 == (c1 + 5) % 6:
        return (c2 + 5) % 6
    return -1


def transit(a, b, par, mut=None):
    corners_out = corners(a, b, par, mut)
    if len(corners_out) < 2:
        return [], False
    edges, dup = [], False
    for i in range(len(corners_out) - 1):
        ei = edge_between(corners_out[i], corners_out[i + 1])
        if ei >= 0:
            if ei in edges:
                dup = True
            if ei not in edges:
                edges.append(ei)
    return edges, dup


def validate_against_web():
    with open(WEB, encoding="utf-8") as f:
        data = json.load(f)
    cases = [c for c in data["cases"] if c["fn"] == "corners"]
    bad = 0
    for c in cases:
        got = corners(c["i"] % 6 if c["i"] >= 0 else c["i"] % 6, c["o"] % 6, c["par"])
        if got != c["out"]:
            bad += 1
    print(f"WALIDACJA portu vs web corners: {len(cases) - bad}/{len(cases)} zgodne")
    return bad == 0, len(cases)


def diff_count(fn_orig, fn_mut):
    n, total = 0, 0
    examples = []
    for a in range(6):
        for b in range(6):
            for p in PARITIES:
                total += 1
                o, m = fn_orig(a, b, p), fn_mut(a, b, p)
                if o != m:
                    n += 1
                    if len(examples) < 3:
                        examples.append((a, b, p, o, m))
    return n, total, examples


def main():
    ok, nweb = validate_against_web()
    if not ok:
        print("BLAD: port niezgodny z webem - wyniki mutantow nieważne")
        return 1
    print(f"dziedzina: a,b in 0..5 (a==b pomijane przez funkcje), parzystosci {PARITIES}")
    for mid in ["E13", "E14", "E17", "E18", "E19"]:
        n, total, ex = diff_count(lambda a, b, p: corners(a, b, p), lambda a, b, p, m=mid: corners(a, b, p, m))
        print(f"{mid} corners: roznic {n}/{total}" + (f" przyklady(a,b,par,orig,mut)={ex}" if ex else ""))
    # E35: transit z parzystoscia przesunieta o +1 (wywolanie w markRiverTransitEdgesOnPath)
    n, total, ex = 0, 0, []
    for a in range(6):
        for b in range(6):
            for p in PARITIES:
                total += 1
                o = transit(a, b, p)[0]
                m = transit(a, b, p + 1)[0]
                if o != m:
                    n += 1
                    if len(ex) < 3:
                        ex.append((a, b, p, o, m))
    print(f"E35 transit (par vs par+1): roznic {n}/{total}" + (f" przyklady={ex}" if ex else ""))
    # E25: dedup usunieta - czy kiedykolwiek powstaja duplikaty krawedzi?
    dups = sum(1 for a in range(6) for b in range(6) for p in PARITIES if transit(a, b, p)[1])
    print(f"E25 transit bez dedup: przypadki z duplikatem krawedzi {dups}/{6*6*len(PARITIES)}")
    # E18 - czy galaz fallback jest kiedykolwiek potrzebna (best pusty dla a!=b)?
    empty_best = 0
    for a in range(6):
        for b in range(6):
            if a == b:
                continue
            for p in PARITIES:
                if not corners(a, b, p, "E18") and corners(a, b, p):
                    empty_best += 1
    print(f"E18 fallback potrzebny (best pusty, a!=b): {empty_best} przypadkow")
    return 0


if __name__ == "__main__":
    sys.exit(main())
