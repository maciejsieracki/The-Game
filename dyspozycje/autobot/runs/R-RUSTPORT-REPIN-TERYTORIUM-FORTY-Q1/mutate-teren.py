#!/usr/bin/env python3
"""Skrypt mutacji (Obrona R1, zarzut 1). Uzycie: python3 -I mutate-teren.py <od> <do> <katalog-logow>
Dla kazdego mutanta: podmiana dokladnie 1 wystapienia tekstu, `cargo test` na
p6_repin_teren_domain + p6_8i_pick, przywrocenie pliku. Log `mut-<ID>.log` z linia `RESULT=`:
KILLED (testy padly), SURVIVED (zielone), COMPILE_ERR (mutant nieprawidlowy).
Wymaga env CARGO_TARGET_DIR/CARGO_INCREMENTAL=0; uruchamiac z rust-port/engine."""
import subprocess, sys, pathlib

T = "src/domain/territory.rs"
F = "src/domain/fort_territory.rs"
J = "data/terrain-improvements.json"
M = [
    ("T1", T, "o.turn != b.turn", "o.turn == b.turn"),
    ("T2", T, "o.turn < b.turn", "o.turn > b.turn"),
    ("T3", T, "o.seq < b.seq", "o.seq > b.seq"),
    ("T4", T, "o.seq < b.seq", "o.seq <= b.seq"),
    ("T5", T, "_ => dist < best_fort_dist,", "_ => dist <= best_fort_dist,"),
    ("T6", T, "(Some(_), Some(o), Some(b))", "(_, Some(o), Some(b))"),
    ("T7", T, "best_city_owner.or(best_fort_owner)", "best_fort_owner.or(best_city_owner)"),
    ("T8", T, "} else if dist < best_city_dist {", "} else if dist <= best_city_dist {"),
    ("T9", T, "if dist > radius {", "if dist >= radius {"),
    ("T10", T, "tn.node.is_fort == Some(true) || tn.node.is_outpost == Some(true)", "tn.node.is_fort == Some(true) && tn.node.is_outpost == Some(true)"),
    ("T11", T, " || tn.node.is_outpost == Some(true)", ""),
    ("T12", T, "best_fort_order = tn.order;", "best_fort_order = None;"),
    ("F1", F, "let mut m = -1;", "let mut m = 0;"),
    ("F2", F, "if s > m {", "if s < m {"),
    ("F3", F, "    m + 1\n", "    m\n"),
    ("F4", F, "if f.seq.is_some() {", "if f.seq.is_none() {"),
    ("F5", F, "        next += 1;\n", ""),
    ("F6", F, "f.built_at_turn = Some(0);", "f.built_at_turn = Some(1);"),
    ("F7", F, "if f.built_at_turn.is_none() {", "if f.built_at_turn.is_some() {"),
    ("F8", F, "        n += 1;\n", "        n += 2;\n"),
    ("F9", F, "let mut next = next_fort_seq(forts);", "let mut next = 0;"),
    ("F10", F, "if f.fort.contested_useless == Some(true) {", "if f.fort.contested_useless == Some(false) {"),
    ("F11", F, "turn: f.built_at_turn.unwrap_or(0),", "turn: f.built_at_turn.unwrap_or(1),"),
    ("F12", F, "f.fort.owner_id != owner_id\n", "f.fort.owner_id == owner_id\n"),
    ("F13", F, "&& f.fort.contested_useless != Some(true)", "&& f.fort.contested_useless == Some(true)"),
    ("F14", F, "f.fort.r)\n                <= city_territory_radius", "f.fort.r)\n                < city_territory_radius"),
    ("F15", F, "if !in_foreign_fort_radius {", "if in_foreign_fort_radius {"),
    ("F16", F, "Some(owner) if owner != owner_id", "Some(owner) if owner == owner_id"),
    ("F17", F, "if here.iter().any(|u| u.owner_id == f.fort.owner_id) {", "if here.iter().any(|u| u.owner_id != f.fort.owner_id) {"),
    ("F18", F, "u.military\n                    && !is_barbarian_owner", "true\n                    && !is_barbarian_owner"),
    ("F19", F, "&& !is_barbarian_owner(u.owner_id)", "&& is_barbarian_owner(u.owner_id)"),
    ("F20", F, "&& is_enemy(u.owner_id, f.fort.owner_id)", "&& !is_enemy(u.owner_id, f.fort.owner_id)"),
    ("F21", F, "attacker_owners.len() != 1", "attacker_owners.len() == 1"),
    ("F22", F, "any(|u| !attacker_owners.contains(&u.owner_id))", "any(|u| attacker_owners.contains(&u.owner_id))"),
    ("F23", F, "let new_owner_id = attackers[0].owner_id;", "let new_owner_id = f.fort.owner_id;"),
    ("F24", F, "        f.fort.owner_id = new_owner_id;\n", "        let _ = new_owner_id;\n"),
    ("F25", F, "prev_owner_id: f.fort.owner_id,", "prev_owner_id: new_owner_id,"),
    ("F26", F, "u.q == f.fort.q && u.r == f.fort.r", "u.q == f.fort.q || u.r == f.fort.r"),
    ("D1", J, '"zasieg_terytorium": 5,', '"zasieg_terytorium": 6,'),
    ("D2", J, '"zasieg_terytorium": 3,', '"zasieg_terytorium": 4,'),
    # D3/D4: pole `zasieg_pol` NIE jest czytane przez logike Rust (tylko deserializacja,
    # terrain_map.rs:124) - mutant ma przezyc; chroni je bajtowa zgodnosc z 4bbef081d (cmp).
    ("D3", J, '"zasieg_pol": 5,', '"zasieg_pol": 6,'),
    ("D4", J, '"zasieg_pol": 3,', '"zasieg_pol": 4,'),
]

lo, hi, logdir = int(sys.argv[1]), int(sys.argv[2]), pathlib.Path(sys.argv[3])
for i, (mid, path, old, new) in enumerate(M):
    if not (lo <= i < hi):
        continue
    p = pathlib.Path(path)
    orig = p.read_text()
    n = orig.count(old)
    log = logdir / f"mut-{mid}.log"
    if n != 1:
        log.write_text(f"{mid} {path}: wzorzec wystepuje {n}x (wymagane 1)\nRESULT=BAD_PATTERN\n")
        print(mid, "BAD_PATTERN")
        continue
    p.write_text(orig.replace(old, new))
    try:
        r = subprocess.run(
            ["cargo", "test", "-j", "2", "--test", "p6_repin_teren_domain", "--test", "p6_8i_pick", "--no-fail-fast"],
            capture_output=True, text=True, timeout=500)
        out = r.stdout + r.stderr
        if r.returncode == 0:
            res = "SURVIVED"
        elif "could not compile" in out or "error[E" in out:
            res = "COMPILE_ERR"
        else:
            res = "KILLED"
        lines = [l for l in out.splitlines() if l.startswith("test ") and "FAILED" in l or l.startswith("test result")]
    finally:
        p.write_text(orig)
    log.write_text(f"{mid} {path}\n- {old!r}\n+ {new!r}\n" + "\n".join(lines) + f"\nRESULT={res}\n")
    print(mid, res, flush=True)
