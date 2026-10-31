#!/usr/bin/env python3
"""Mutacje rivers_b/turn.rs dla P6.M07B partia 1 (kazda mutacja = jedna podmiana tekstu).

Uruchomienie (z katalogu rust-port/engine, CARGO_TARGET_DIR poza repo):
  CARGO_TARGET_DIR=/dev/shm/<nazwa> python3 -I tests/p6_m07b_vectors/mutate_m07b_turn.py M1 M2 ...
  (bez argumentow: wszystkie mutanty; zaleca sie porcje <= 8 na wywolanie)

Dla kazdej mutacji: plik turn.rs jest podmieniany dokladnie w jednym miejscu (liczba wystapien
`old` musi byc rowna 1, inaczej mutacja jest odrzucona jako wadliwa), uruchamiany jest
`cargo test --test p6_m07b_turn`, a oryginalny plik jest przywracany i porownywany bajt po bajcie.
Wynik: KILLED (rc != 0) albo SURVIVED (rc == 0). Opis i uzasadnienie rownowaznosci: dossier.
"""
import os
import signal
import subprocess
import sys

TURN = "src/domain/mapgen/rivers_b/turn.rs"

# (id, opis, stary tekst, nowy tekst, status-oczekiwany: "KILL" | "EQUIV")
MUTANTS = [
    ("M1", "progi sharp: < -0.01 -> <= -0.01", "< -0.01 {", "<= -0.01 {", "EQUIV"),
    ("M2", "progi sharp: -0.01 -> 0.0", "< -0.01 {", "< 0.0 {", "KILL"),
    ("M3", "guard has_sharp: len<3 -> len<2", "    if path.len() < 3 {\n        return false;\n    }\n    for i in 0..path.len() - 2",
     "    if path.len() < 2 {\n        return false;\n    }\n    for i in 0..path.len() - 2", "EQUIV"),
    ("M4", "has_sharp: usuniety wczesny return w violates", "    if river_path_has_sharp_u_turn(path) {\n        return true;\n    }\n", "", "KILL"),
    ("M5", "guard violates: len<3 -> len<2", "    if path.len() < 3 {\n        return false;\n    }\n    if river_path_has_sharp",
     "    if path.len() < 2 {\n        return false;\n    }\n    if river_path_has_sharp", "EQUIV"),
    ("M6", "unit: usuniety guard len<1e-9", "    if len < 1e-9 {\n        return UnitVec { x: 0.0, y: 0.0 };\n    }\n", "", "KILL"),
    ("M7", "delta: |d|>1 -> |d|>2", "if deltas[i].abs() > 1 {", "if deltas[i].abs() > 2 {", "KILL"),
    ("M8", "okno: i+1<w -> i+1<=w", "if i + 1 < window_hex {", "if i + 1 <= window_hex {", "KILL"),
    ("M9", "suma: > maxSum -> >= maxSum", "if sum.abs() > max_sum {", "if sum.abs() >= max_sum {", "KILL"),
    ("M10", "okno: poczatek wycinka +1", "deltas[i + 1 - window_hex..i + 1]", "deltas[i + 2 - window_hex..i + 1]", "KILL"),
    ("M11", "unit: sqrt3 usuniete z x1", "let x1 = sqrt3 * (a.q as f64 + a.r as f64 / 2.0);", "let x1 = (a.q as f64 + a.r as f64 / 2.0);", "KILL"),
    ("M12", "unit: skala y 1.5 -> 1.4 (a)", "let y1 = 1.5 * a.r as f64;", "let y1 = 1.4 * a.r as f64;", "KILL"),
    ("M13", "violates: usuniety return dla |d|>1", "        if deltas[i].abs() > 1 {\n            return true;\n        }\n", "", "KILL"),
    ("M14", "violates: usuniety return dla |suma|>maxSum", "        if sum.abs() > max_sum {\n            return true;\n        }\n", "", "KILL"),
    ("M15", "sharp predykat: < -> > (y2)", "v1.y * v2.y < -0.01", "v1.y * v2.y > -0.01", "KILL"),
    ("M16", "okno: koniec wycinka bez biezacej delty", "deltas[i + 1 - window_hex..i + 1]", "deltas[i + 1 - window_hex..i]", "KILL"),
    ("M17", "unit: dy znak odwrocony", "let dy = y2 - y1;", "let dy = y1 - y2;", "KILL"),
    ("M18", "unit: y2 liczone z a.r", "let y2 = 1.5 * b.r as f64;", "let y2 = 1.5 * a.r as f64;", "KILL"),
    ("M19", "unit: axial r/2 -> r/3 (x1)", "(a.q as f64 + a.r as f64 / 2.0)", "(a.q as f64 + a.r as f64 / 3.0)", "KILL"),
    ("M20", "sharp: petla pomija ostatnia trojke", "for i in 0..path.len() - 2 {", "for i in 0..path.len() - 3 {", "KILL"),
    ("M21", "unit: sqrt3 usuniete z x2", "let x2 = sqrt3 * (b.q as f64 + b.r as f64 / 2.0);", "let x2 = (b.q as f64 + b.r as f64 / 2.0);", "KILL"),
    ("M22", "unit: dx znak odwrocony", "let dx = x2 - x1;", "let dx = x1 - x2;", "KILL"),
    ("M23", "unit: dlugosc L2 -> L1", "let len = dx.hypot(dy);", "let len = dx.abs() + dy.abs();", "KILL"),
    ("M24", "unit: x zwracane z dy", "        x: dx / len,", "        x: dy / len,", "KILL"),
    ("M25", "violates: guard len<3 -> len<4", "    if path.len() < 3 {\n        return false;\n    }\n    if river_path_has_sharp",
     "    if path.len() < 4 {\n        return false;\n    }\n    if river_path_has_sharp", "KILL"),
    ("M26", "sharp: guard len<3 -> len<4", "    if path.len() < 3 {\n        return false;\n    }\n    for i in 0..path.len() - 2",
     "    if path.len() < 4 {\n        return false;\n    }\n    for i in 0..path.len() - 2", "KILL"),
    ("M27", "violates: petla delt pomija ostatnia", "for i in 0..deltas.len() {", "for i in 0..deltas.len() - 1 {", "KILL"),
    ("M28", "okno: usuniety continue dla i+1<w", "        if i + 1 < window_hex {\n            continue;\n        }\n", "", "KILL"),
    ("M29", "unit: zerowy wektor -> nie {0,0} (x=1)", "        return UnitVec { x: 0.0, y: 0.0 };", "        return UnitVec { x: 1.0, y: 0.0 };", "KILL"),
    ("M30", "sharp: porownanie dot z sumy zamiast iloczynu y (v1.y*v2.x)", "v1.x * v2.x + v1.y * v2.y < -0.01", "v1.x * v2.x + v1.y * v2.x < -0.01", "KILL"),
    ("M31", "unit: stala sqrt3 zmieniona o 1e-4", "let sqrt3 = 3f64.sqrt();", "let sqrt3 = 3f64.sqrt() * 1.0001;", "KILL"),
    ("M32", "unit: skala y 1.5 -> 1.4 (b)", "let y2 = 1.5 * b.r as f64;", "let y2 = 1.4 * b.r as f64;", "KILL"),
    ("M33", "unit: prog zerowego wektora 1e-9 -> 1e-3 (EQUIV: len>=sqrt3 dla niezerowego)", "if len < 1e-9 {", "if len < 1e-3 {", "EQUIV"),
    ("M34", "unit: y zwracane z dx", "        y: dy / len,", "        y: dx / len,", "KILL"),
    ("M35", "violates: segmenty z path[1..] zamiast path", "let deltas = path_signed_turn_deltas(&path_segment_dirs(path));", "let deltas = path_signed_turn_deltas(&path_segment_dirs(&path[1..]));", "KILL"),
    ("M36", "grow.rs path_segment_dirs: d>=0 -> d>=1 (kierunek 0 pominiety)", "        if d >= 0 {", "        if d >= 1 {", "KILL", "src/domain/mapgen/rivers_a/grow.rs"),
    ("M37", "grow.rs signed_river_dir_delta: raw<=3 -> raw<3 (EQUIV dla turn.rs: |d|=3 zatrzymuje petle przed suma)", "    if raw <= 3 {", "    if raw < 3 {", "EQUIV", "src/domain/mapgen/rivers_a/grow.rs"),
    ("M38", "unit: axial r/2 -> r/3 (x2, b)", "let x2 = sqrt3 * (b.q as f64 + b.r as f64 / 2.0);", "let x2 = sqrt3 * (b.q as f64 + b.r as f64 / 3.0);", "KILL"),
    ("M39", "sharp: guard len<3 zwraca true", "    if path.len() < 3 {\n        return false;\n    }\n    for i in 0..path.len() - 2", "    if path.len() < 3 {\n        return true;\n    }\n    for i in 0..path.len() - 2", "KILL"),
    ("M40", "sharp: v1 odwrocone (b->a)", "river_segment_unit_vector(path[i], path[i + 1]);", "river_segment_unit_vector(path[i + 1], path[i]);", "KILL"),
    ("M41", "sharp: v2 zaczyna od path[i]", "river_segment_unit_vector(path[i + 1], path[i + 2]);", "river_segment_unit_vector(path[i], path[i + 2]);", "KILL"),
    ("M42", "sharp: trafienie zwraca false", "        if v1.x * v2.x + v1.y * v2.y < -0.01 {\n            return true;", "        if v1.x * v2.x + v1.y * v2.y < -0.01 {\n            return false;", "KILL"),
    ("M43", "sharp: koncowy return false -> true", "    false\n}\n\n/// Web `riverPathViolatesTurnWindow", "    true\n}\n\n/// Web `riverPathViolatesTurnWindow", "KILL"),
    ("M44", "violates: guard len<3 zwraca true", "    if path.len() < 3 {\n        return false;\n    }\n    if river_path_has_sharp", "    if path.len() < 3 {\n        return true;\n    }\n    if river_path_has_sharp", "KILL"),
    ("M45", "violates: wczesny return z sharp -> false", "    if river_path_has_sharp_u_turn(path) {\n        return true;", "    if river_path_has_sharp_u_turn(path) {\n        return false;", "KILL"),
    ("M46", "violates: koncowy return false -> true", "        if sum.abs() > max_sum {\n            return true;\n        }\n    }\n    false\n}", "        if sum.abs() > max_sum {\n            return true;\n        }\n    }\n    true\n}", "KILL"),
    ("M47", "grow.rs neighbor_dir_index: && -> ||", "if i64::from(*hdq) == dq && i64::from(*hdr) == dr {", "if i64::from(*hdq) == dq || i64::from(*hdr) == dr {", "KILL", "src/domain/mapgen/rivers_a/grow.rs"),
    ("M48", "grow.rs signed_river_dir_delta: gałąź raw-6 -> raw-5", "        raw - 6", "        raw - 5", "KILL", "src/domain/mapgen/rivers_a/grow.rs"),
    ("M49", "grow.rs path_signed_turn_deltas: windows(2) -> windows(3)", "        .windows(2)\n        .map(|w| signed_river_dir_delta", "        .windows(3)\n        .map(|w| signed_river_dir_delta", "KILL", "src/domain/mapgen/rivers_a/grow.rs"),
]


def run_one(mid, desc, old, new, expect, path=TURN):
    with open(path, "rb") as fh:
        original = fh.read()
    text = original.decode("utf-8")
    count = text.count(old)
    if count != 1:
        print(f"{mid} | {desc} | REJECTED (wystapien={count}) | rc=-")
        return None
    mutated = text.replace(old, new, 1).encode("utf-8")
    try:
        with open(path, "wb") as fh:
            fh.write(mutated)
        proc = subprocess.run(
            ["cargo", "test", "--test", "p6_m07b_turn", "-q"],
            capture_output=True, text=True,
        )
        rc = proc.returncode
    finally:
        with open(path, "wb") as fh:
            fh.write(original)
    with open(path, "rb") as fh:
        restored = fh.read() == original
    status = "KILLED" if rc != 0 else "SURVIVED"
    print(f"{mid} | {desc} | {status} | rc={rc} | oczekiwano={expect} | RESTORED={restored}")
    return status, restored


def main(argv):
    wanted = set(argv)
    if wanted:
        unknown = wanted - {m[0] for m in MUTANTS}
        if unknown:
            print(f"nieznane mutanty: {sorted(unknown)}")
            return 2
    results = []
    for m in MUTANTS:
        if wanted and m[0] not in wanted:
            continue
        results.append(run_one(*m[:5], *(m[5:6] or [TURN])))
    done = [r for r in results if r is not None]
    killed = sum(1 for r in done if r[0] == "KILLED")
    print(f"RAZEM uruchomiono={len(done)} KILLED={killed} SURVIVED={len(done) - killed}")
    if any(not r[1] for r in done):
        print("BLAD: plik turn.rs nie zostal przywrocony bajt-w-bajt")
        return 3
    return 0


if __name__ == "__main__":
    # SIGTERM (np. timeout) ma przejsc przez finally, zeby plik zrodlowy zostal przywrocony
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(143))
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
    sys.exit(main(sys.argv[1:]))
