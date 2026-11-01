#!/usr/bin/env python3
"""P6.M07B-Q2 r4 - tabela N3: mutant -> linia Rust -> status (KILLED / EKWIWALENT z dowodem / LUKA).

Wejscie: lista MUTANTS z `mutate_m07b2_q2.py` oraz logi `mutate-m07b2-q2-r4-*.txt` w katalogu runu.
Linia Rust = pierwsza linia, w ktorej zaczyna sie fragment `old` mutanta w AKTUALNYM pliku zrodlowym
(fragmenty wielowierszowe: linia pierwszego wiersza). Dowody rownowaznosci (plik:linia Rust i web
pin edb8fb56, gen-helpers.ts) sa w slowniku PROOFS ponizej; mutant SURVIVED bez wpisu = LUKA.

Uzycie: python3 -I n3_table_m07b2_q2.py   (markdown na stdout; kod wyjscia 1, gdy jest LUKA lub brak wyniku)
"""
import glob
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.abspath(os.path.join(HERE, "..", ".."))
ROOT = os.path.abspath(os.path.join(ENGINE, "..", ".."))
RUN = os.path.join(ROOT, "dyspozycje", "autobot", "runs", "R-RUSTPORT-P6-M07B2-RZEKI-B-KRAWEDZIE-Q1")

spec = importlib.util.spec_from_file_location("mut", os.path.join(HERE, "mutate_m07b2_q2.py"))
mut = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mut)

# Dowody rownowaznosci (domena: wejscia, ktore funkcja przyjmuje; wszystkie linie = stan HEAD).
PROOFS = {
    "C05": "coast_grow.rs:54 wola `is_river_window_turn_allowed`, a ta robi `expect` na pustej sciezce (rivers_a/grow.rs:84; web :7026 TypeError) PRZED guardem :71 - dla pustej sciezki oryginal i mutant panikuja w tym samym miejscu; dla niepustej guard jest prawdziwy w obu",
    "C12": "`center_step` pochodzi wylacznie z walk.rs:232-251 {22,-12,3} i :255-279 {40,32,-22,4,0} (web :6036-6038, :6041-6056); zadna wartosc nie lezy w (7,8], wiec `> 8` == `> 7` (coast_grow.rs:89)",
    "C21": "`cur_d` (coast_grow.rs:48) jest czytane tylko w :74, :86, :88; do tych linii dochodza kandydaci z `nd >= 2` (:71, sciezka niepusta :54; brak klucza -> nd=0 odpada) wiec `nd > cur_d` dla cur_d 0 i 1 jednakowo (:74 falsz, :86 prawda); web :6100,:6110-6117",
    "G13": "po `.or_else(square.centroid)` (coast_grow.rs:143) centroid trafia tylko do `score_river_step_toward_land_center` (walk.rs:281-291, web :6057-6063), ktora przy kwadracie != null IGNORUJE centroid; przy kwadracie == null galaz zwraca None (to samo co usuniecie). Estymator jest bez efektow ubocznych (walk.rs:168-215). Kwadrat != null pokryty wektorami q2r4 (grow sq=true, mutant G17)",
    "M02": "sasiad rowny celowi nie ma sasiada rownego sobie (prims.rs:32, brak (0,0)) -> `touches_target` falsz (meander.rs:56-59) -> continue; dodatkowo odrzuca go filtr kierunku :40 (patrz M03); web :6503,:6512-6514",
    "M03": "`river_step_dir` = (to-from) (walk.rs:130-132), `same_river_dir` = rownosc krotek (walk.rs:135-137): prawda tylko gdy offset sasiada == cel-cur, czyli nk == cel, co odrzuca juz meander.rs:37; web :5879,:5883,:6503-6504",
    "M06": "brak klucza seaDist -> nd=0, a `nd < RIVER_MIN_INLAND_FROM_SEA` (=2, rivers_a.rs:55) w meander.rs:53 daje `continue` jak w oryginale (`nd > cur_d` :50 jest falszem dla nd=0 i cur_d >= 0); web :6509-6510",
    "M13": "`rand()` in [0,1) (web mulberry32 /2^32, gen-helpers.ts:57; Rust prims.rs mulberry32_step), a `opts.len() <= 6`, wiec `floor(rand*len) <= len-1`; clamp meander.rs:68 jest nieosiagalny; web :6519 nie ma clampu",
    "W05": "`cut_at = i+1`, `i < deltas.len() = out.len()-2` (wyjscie `sanitize_river_path` ma kolejne sasiady: rivers_a.rs:264-277, wiec `path_segment_dirs` zwraca n-1 kierunkow (grow.rs:62-71), `path_signed_turn_deltas` n-2 (grow.rs:74-79)); stad `cut_at <= n-2` i klauzula `>= n-1` (window.rs:46) jest falszem; web :7104-7114",
    "W08": "po `sanitize_river_path` (window.rs:52) kroki sa sasiednie (rivers_a.rs:264-277: odleglosc == 1), a `repair_river_path_adjacency` (rivers_a.rs:328-342, galaz `d == 1`) dla sasiednich krokow dokleja tylko `target` -> zwraca wejscie bez zmian; web :5440-5466, :7115-7116",
    "E01": "`is_dry_land_terrain(Sea)` = `!Sea.is_water()` = falsz (landsea.rs:77-79, :53-55) i `Sea != ShallowSea` -> linia edges.rs:22 zwraca falsz dla Morza tak samo jak :19; web :7123-7124",
    "E03": "dla `edge_idx < 0` `u8::try_from` zwraca Err (edges.rs:39-41) -> `return` bez zmian stanu; kod pomiedzy :28 a :39 (`hex_key`, `get_mut`, `can_receive...`) nie ma efektow ubocznych; web :7128",
    "E06": "po `contains`/`push` (edges.rs:42-44) `river_edges` jest niepuste, wiec `!is_empty()` (:45) == `true` zawsze; web :7133",
    "E07": "dla `edge_idx < 0` `mark_river_edge(-1)` jest no-op (edges.rs:28/39), a `usize::try_from(-1)` daje Err -> `return` (edges.rs:56-60) przed drugim oznaczeniem; web :7138-7144",
    "E10": "dla from == to petla (edges.rs:87-93) wpisuje `from`, widzi `c == to` i przerywa -> `[from]`, identycznie jak wczesny zwrot :82-84; web :7151-7164",
    "E13": "parzystosc wchodzi tylko przez `hex_parity % 2 == 0` (edges.rs:122) i dodaje do `score` +0 albo +0.01 (>= 0), wiec po korekcie `score < best_score` (:134) nie moze byc prawdziwe tam, gdzie `score == best_score`; korekta wplywa tylko na `fallback_score` (:127), a fallback jest nieosiagalny (patrz E18). Wektory `corners` (i,o in -12..12, par 0/1; q2r4: i,o in 0..5, par -3..3) pokrywaja CALA dziedzine (36 par x 2 klasy parzystosci) i mutant je przechodzi; model wyczerpujacy: corners-exhaustive-r3.txt (0/216); web :7166-7194",
    "E14": "jak E13: zamiana +0/+0.01 miedzy cw/ccw (edges.rs:122-126) nie moze zmienic `best` (korekta >= 0, :134 strict), tylko `fallback_score` (nieosiagalny); wektory pokrywaja cala dziedzine; web :7183",
    "E17": "`<=` vs `<` dotyczy tylko `fallback` (edges.rs:127), uzywanego wylacznie gdy `best` puste (:141); `best` puste jest niemozliwe dla a != b (patrz E18); wektory pokrywaja cala dziedzine; web :7185",
    "E18": "`best` puste wymaga, by kazda kombinacja wejscie/wyjscie dawala `walked.len()-1 < MIN_BOKI` (edges.rs:131), czyli entry == exit dla wszystkich 4 par; `entry_opts` (:107) ma 2 rozne wartosci, wiec istnieje para z entry != exit (a != b; a == b zwraca [] w :104). Fallback nieosiagalny; model: 0 przypadkow (corners-exhaustive-r3.txt); web :7191",
    "E19": "kolejnosc cw/ccw zmienia wynik tylko przy remisie `score` w jednej kombinacji, a remis cw/ccw w obrebie kombinacji wymaga luku dlugosci 3 (k=3, obie drogi po 4 rogi), co nie jest minimum: sasiednie kombinacje maja k in {d-1,d,d+1}, wiec zawsze istnieje luk <= 3 rogi krotszy; remisy miedzy kombinacjami rozstrzyga kolejnosc entry/exit (edges.rs:114-115), nie cw/ccw. Wektory pokrywaja cala dziedzine i mutant je przechodzi; web :7179",
    "E24": "dla `corners.len() == 1` petla `0..0` (edges.rs:168) nie dodaje krawedzi; dla 0 oba warianty zwracaja pusty wektor (:164) - wynik identyczny; web :7204",
    "E25": "`walk_river_hex_perimeter` (edges.rs:81-96) daje proste przejscie po 6-cyklu bez powtorzen rogow; kolejne pary rogow sa rozne, a pary sasiednich rogow odwzorowuja sie na krawedzie wzajemnie jednoznacznie (`river_edge_between_corners`, edges.rs:147-158), wiec `edges.contains` (:170) nigdy nie jest prawdziwe; `ei >= 0` zawsze prawda dla sasiednich rogow. Model: 0/216 duplikatow (corners-exhaustive-r3.txt); web :7208",
    "E27": "dla len == 2 petla `while i + 1 < p.len()` (edges.rs:190, i=1) nie wchodzi, `changed` zostaje falszem -> zwrot `p` jak przy wczesnym zwrocie :181; web :7216",
    "E31": "dla len == 1 jedyny obrot (i=0) ma dir_in=-1 i dir_out=-1 (edges.rs:216-227) -> `continue` (:228); dla 0 petla `0..0` pusta i `rp.len()-1` nie jest liczone; web :7234",
    "E35": "parzystosc nie ma wplywu na wynik `river_corners_along_hex_edges` (patrz E13/E14), wiec `river_transit_edge_indices` (edges.rs:162-175) nie zalezy od 3. argumentu; przesuniecie o +1 w edges.rs:231 jest bez efektu; web :7244",
}


def line_of(rel, old):
    text = open(os.path.join(ENGINE, rel), encoding="utf-8").read()
    pos = text.find(old)
    assert pos >= 0 and text.count(old) == 1, (rel, old[:40])
    return text.count("\n", 0, pos) + 1


def verdicts():
    out = {}
    for path in sorted(glob.glob(os.path.join(RUN, "mutate-m07b2-q2-r4-*.txt"))):
        for line in open(path, encoding="utf-8"):
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 3 and parts[1] in ("KILLED", "SURVIVED", "BUILD-FAIL", "INFRA", "TIMEOUT"):
                out[parts[0]] = (parts[1], os.path.basename(path))
    return out


def main():
    res = verdicts()
    rows, counts, bad = [], {"KILLED": 0, "EKWIWALENT": 0, "LUKA": 0, "BRAK": 0}, 0
    for mid, rel, old, _new, _desc, exp in mut.MUTANTS:
        ln = line_of(rel, old)
        verdict, src = res.get(mid, ("BRAK", "-"))
        if verdict in ("KILLED", "BUILD-FAIL"):
            status = "KILLED"
        elif verdict == "SURVIVED" and mid in PROOFS:
            status = "EKWIWALENT"
        elif verdict == "SURVIVED":
            status = "LUKA"
        else:
            status = "BRAK"
        counts[status] += 1
        if status in ("LUKA", "BRAK"):
            bad += 1
        proof = PROOFS.get(mid, "") if status == "EKWIWALENT" else ""
        rows.append(f"| {mid} | {exp} | {os.path.basename(rel)}:{ln} | {verdict} ({src}) | {status} | {proof} |")
    print("| ID | oczek. | linia Rust | wynik r4 (log) | status | dowod rownowaznosci (plik:linia Rust + web) |")
    print("|---|---|---|---|---|---|")
    print("\n".join(rows))
    print()
    print(f"Podsumowanie: mutantow {len(mut.MUTANTS)}; KILLED {counts['KILLED']}; EKWIWALENT {counts['EKWIWALENT']}; "
          f"LUKA {counts['LUKA']}; BRAK wyniku {counts['BRAK']}.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
