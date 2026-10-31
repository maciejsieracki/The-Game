#!/usr/bin/env python3
"""Mutacje galezi sterujacych capital_labels.rs (P6.8H2 partia B).

Uruchomienie z katalogu glownego worktree repo:
  python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P6-8H2-DOSTEP-ZASOBOW-B-Q1/mutacje-p6-8h2-b.py [ID ...]
Dla kazdego mutanta: podmiana dokladnie jednego wystapienia, cargo test
--test p6_8h2_capital_labels, przywrocenie oryginalu (weryfikacja bajt po bajcie), wynik.
Katalog repo wyliczany wzgledem polozenia skryptu (bez hardkodowania worktree).
"""
import os
import subprocess
import sys
import shutil
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
ENGINE = os.path.join(ROOT, "rust-port", "engine")
TARGET = os.path.join(ENGINE, "src", "domain", "resource_access", "capital_labels.rs")

MUTANTS = [
    ("M01", "guard wlasciciela: !contains -> false", "if !human_owner_ids.contains(&city.owner_id) {", "if false {"),
    ("M02", "designated: == -> !=", "return designated == city.id;", "return designated != city.id;"),
    ("M03", "designated: galaz -> false", "return designated == city.id;", "return false;"),
    ("M04", "filtr wlasciciela: != -> ==", "if candidate.owner_id != city.owner_id {", "if candidate.owner_id == city.owner_id {"),
    ("M05", "tie-break: < -> <=", "if first.is_none() || order < first_order {", "if first.is_none() || order <= first_order {"),
    ("M06", "usuniecie first.is_none()", "if first.is_none() || order < first_order {", "if order < first_order {"),
    ("M07", "wynik: is_some_and -> is_some", "first.is_some_and(|f| f.id == city.id)", "first.is_some()"),
    ("M08", "bramka easy: !is_easy -> is_easy", "if !is_easy {", "if is_easy {"),
    ("M09", "usuniecie !is_finite", "if !turn.is_finite() || turn < 1.0 || turn > max_tur {", "if turn < 1.0 || turn > max_tur {"),
    ("M10", "dolna granica tury: < -> <=", "if !turn.is_finite() || turn < 1.0 || turn > max_tur {", "if !turn.is_finite() || turn <= 1.0 || turn > max_tur {"),
    ("M11", "gorna granica tury: > -> >=", "if !turn.is_finite() || turn < 1.0 || turn > max_tur {", "if !turn.is_finite() || turn < 1.0 || turn >= max_tur {"),
    ("M12", "owner literal [0] -> [1]", "is_player_capital_city(city, all_cities, designated_capital_id, &[0], found_order)", "is_player_capital_city(city, all_cities, designated_capital_id, &[1], found_order)"),
    ("M13", "stolica pomija designated (None)", "is_player_capital_city(city, all_cities, designated_capital_id, &[0], found_order)", "is_player_capital_city(city, all_cities, None, &[0], found_order)"),
    ("M14", "filtr etykiet: negacja", ".filter(|label| ALLOWED.contains(label))", ".filter(|label| !ALLOWED.contains(label))"),
    ("M15", "usuniecie sort", "    out.sort();\n", ""),
    ("M16", "fallback pusty -> niepusty", "        None => String::new(),", "        None => String::from(\"X\"),"),
    ("M17", "fallback bez uppercase", "Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),", "Some(first) => first.to_string() + chars.as_str(),"),
    ("M18", "tabela zloze: cyna -> Cyna", "\"cyna\" => \"Ruda cyny\",", "\"cyna\" => \"Cyna\","),
    ("M19", "tabela surowcow: kon -> Kon", "\"kon\" => \"Koń\",", "\"kon\" => \"Kon\","),
]


def run(mid, desc, old, new):
    with open(TARGET, encoding="utf-8") as fh:
        src = fh.read()
    n = src.count(old)
    if n != 1:
        return (mid, desc, "BLAD_PODMIANY count=%d" % n)
    tmp = tempfile.mkdtemp(prefix="mut-")
    bak = os.path.join(tmp, "orig.rs")
    shutil.copy2(TARGET, bak)
    with open(bak, "rb") as fh:
        orig_bytes = fh.read()
    try:
        with open(TARGET, "w", encoding="utf-8") as fh:
            fh.write(src.replace(old, new, 1))
        env = dict(os.environ)
        env.update({"CARGO_INCREMENTAL": "0", "CARGO_PROFILE_DEV_DEBUG": "0", "CARGO_PROFILE_TEST_DEBUG": "0"})
        p = subprocess.run(
            ["cargo", "test", "--test", "p6_8h2_capital_labels"],
            cwd=ENGINE, capture_output=True, text=True, env=env,
        )
        out = p.stdout + p.stderr
        if "error[" in out or "error:" in out and p.returncode != 0 and "test result" not in out:
            verdict = "KILLED-BUILD"
        elif p.returncode != 0:
            verdict = "KILLED"
        else:
            verdict = "SURVIVED"
        failed = [l.split()[1] for l in out.splitlines() if l.strip().startswith("test ") and "FAILED" in l]
        return (mid, desc, "%s exit=%d failed=%d [%s]" % (verdict, p.returncode, len(failed), ";".join(failed)))
    finally:
        shutil.copy2(bak, TARGET)
        # copy2 przywraca stary mtime; cargo porownuje mtime, wiec wymuszamy swiezy znacznik,
        # zeby kolejny cargo test nie uzyl artefaktu z mutanta.
        os.utime(TARGET, None)
        with open(TARGET, "rb") as fh:
            restored = fh.read()
        shutil.rmtree(tmp, ignore_errors=True)
        if restored != orig_bytes:
            raise SystemExit("BLAD: nie przywrocono oryginalu")


if __name__ == "__main__":
    wanted = set(sys.argv[1:])
    for mid, desc, old, new in MUTANTS:
        if wanted and mid not in wanted:
            continue
        print(" | ".join(run(mid, desc, old, new)), flush=True)
