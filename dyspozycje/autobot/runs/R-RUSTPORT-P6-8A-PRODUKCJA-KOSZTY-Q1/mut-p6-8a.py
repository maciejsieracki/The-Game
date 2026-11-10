#!/usr/bin/env python3
"""Mutacje P6.8A (odtwarzalne z repo; poprawka R3 -- skrypt byl dotad tylko w scratchpadzie).

Uruchomienie z dowolnego miejsca wewnatrz worktree:
    python3 dyspozycje/autobot/runs/R-RUSTPORT-P6-8A-PRODUKCJA-KOSZTY-Q1/mut-p6-8a.py [ID ...]
Bez argumentow: wszystkie mutanty. Kazdy mutant: podmiana JEDNEGO wzorca (liczba wystapien musi
wynosic 1, inaczej POMINIETY), `cargo test` czterech targetow 8A, przywrocenie pliku z asercja.
KILLED = co najmniej jeden test FAILED lub blad kompilacji; SURVIVED = wszystkie testy zielone.
Kopia oryginalu w katalogu roboczym P6_8A_SCRATCH (domyslnie tempfile.mkdtemp()).
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = subprocess.run(
    ["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True, check=True
).stdout.strip()
ENGINE = os.path.join(ROOT, "rust-port", "engine")
PU = "src/domain/production_units.rs"
IM = "src/domain/improvements.rs"
SCRATCH = os.environ.get("P6_8A_SCRATCH") or tempfile.mkdtemp(prefix="p6-8a-mut-")
TESTS = [
    "--test", "p6_8a_building_upgrades",
    "--test", "p6_8a_pending_improvements",
    "--test", "p6_8a_vectors",
    "--test", "p6_8a_production_costs",
]

M = {
    # --- R2 (building-upgrades / pending-improvements) ---
    "R2-01": (PU, "building.suppressed == Some(true)", "building.suppressed.is_some()"),
    "R2-02": (PU, "chain.insert(0, node);", "chain.push(node);"),
    "R2-03": (PU, "Some(v) if v > 0.0 => Some(v),", "Some(v) if v >= 0.0 => Some(v),"),
    "R2-04": (PU, '    if built_ids.contains(&"palac_iii") {\n        Some(3)', '    if built_ids.contains(&"palac_iii") {\n        Some(2)'),
    "R2-05": (PU, '|| built_ids.contains(&"fort") || built_ids.contains(&"palisada")', '|| built_ids.contains(&"fort")'),
    "R2-06": (PU, "if trimmed.is_empty() {", "if raw.is_none() {"),
    "R2-07": (PU, ".unwrap_or(from);", '.unwrap_or("");'),
    "R2-08": (PU, "buildings.iter().rev().find(|b| b.id == id)", "buildings.iter().find(|b| b.id == id)"),
    "R2-09": (IM, "if !self.entries.contains_key(&id) {\n            self.order.push(id.clone());\n        }", "self.order.push(id.clone());"),
    "R2-10": (IM, "self.order.retain(|x| x != &id);", ""),
    "R2-11": (IM, "self.order.clear();\n        self.entries.clear();", "self.entries.clear();"),
    "R2-12": (IM, "if idx == 0 {", "if idx == usize::MAX {"),
    "R2-13": (IM, "let idx = id.rfind(':')?;", "let idx = id.find(':')?;"),
    "R2-14": (IM, "if removed.is_some() {", "if true {"),
    "R2-15": (IM, "for e in rows {\n                p.add(e.clone());", "for e in rows.iter().rev() {\n                p.add(e.clone());"),
    # --- R3 (P1 dokonczenie, P2 koszty, buildingStatSummaryLines) ---
    "R3-01": (PU, "if raw > 0.0 {", "if raw >= 0.0 {"),
    "R3-02": (PU, 'raw == 0.0 && u.super_jednostka.as_deref() == Some("TAK")', 'raw == 0.0 && u.super_jednostka.as_deref() == Some("NIE")'),
    "R3-03": (PU, '"Wręcz" | "Wrecz" => ("jednostka_koszt_rola_wrecz", 10.0),', '"Wrecz" => ("jednostka_koszt_rola_wrecz", 10.0),'),
    "R3-04": (PU, '"Konnica" => ("jednostka_koszt_rola_konnica", 16.0),', '"Konnica" => ("jednostka_koszt_rola_konnica", 15.0),'),
    "R3-05": (PU, "js_math_round(b.koszt_budowy + przyrost * (level - 1.0))", "js_math_round(b.koszt_budowy + przyrost * level)"),
    "R3-06": (PU, "js_math_round(base * building_era_cost_multiplier(b.epoka_wejscia))", "js_math_round(base)"),
    "R3-07": (PU, "js_max(1.0, city_level_or_epoch.floor())", "js_max(0.0, city_level_or_epoch.floor())"),
    "R3-08": (PU, "let przyrost = if b.przyrost_kosztu.is_finite() {", "let przyrost = if b.przyrost_kosztu.is_finite() || true {"),
    "R3-09": (PU, 'Some("stolica") => is_capital == Some(true),', 'Some("stolica") => is_capital != Some(false),'),
    "R3-10": (PU, 'Some("region") => is_capital == Some(false),', 'Some("region") => is_capital != Some(true),'),
    "R3-11": (PU, "stock.and_then(|s| s.get(ascii_key)).copied().unwrap_or(0.0) > 0.0", "stock.and_then(|s| s.get(ascii_key)).copied().unwrap_or(0.0) >= 0.0"),
    "R3-12": (PU, ".map_or(c, |idx| NFD_BASE[idx].1),", ".map_or(c, |_idx| c),"),
    "R3-13": (PU, "if ('\\u{0300}'..='\\u{036F}').contains(&c) {", "if ('\\u{0300}'..='\\u{036E}').contains(&c) {"),
    "R3-14": (PU, '"drewno" => Some("Drewno"),', '"drewno" => None,'),
    "R3-15": (PU, "if gate_level.is_finite() && level >= gate_level && !unlocked.contains(tech) {", "if gate_level.is_finite() && level > gate_level && !unlocked.contains(tech) {"),
    "R3-16": (PU, "indexed.sort_by_key(|entry| entry.0);", ""),
    "R3-17": (PU, "level = js_min(level, gate_level - 1.0);", "level = js_min(level, gate_level);"),
    "R3-18": (PU, "    if baza != 0.0 {", "    if baza == 0.0 {"),
    "R3-19": (PU, "if cumulative != 0.0 {", "if cumulative > 0.0 {"),
    "R3-20": (PU, 'None => baza.get("mnoznik").copied().unwrap_or(0.0),', "None => 0.0,"),
    "R3-21": (PU, "if baza == 0.0 && przyrost == 0.0 {", "if baza == 0.0 {"),
}


def run_mutant(mid):
    f, old, new = M[mid]
    path = os.path.join(ENGINE, f)
    orig = open(path, encoding="utf-8").read()
    n = orig.count(old)
    if n != 1:
        print(mid, "PATTERN_COUNT", n, "- POMINIETY")
        return
    bak = os.path.join(SCRATCH, "orig_" + os.path.basename(f))
    shutil.copy(path, bak)
    try:
        open(path, "w", encoding="utf-8").write(orig.replace(old, new))
        r = subprocess.run(
            ["timeout", "400", "cargo", "test", "--manifest-path", os.path.join(ENGINE, "Cargo.toml")] + TESTS,
            cwd=ENGINE, capture_output=True, text=True,
        )
        out = r.stdout + r.stderr
        fails = re.findall(r"^test (\S+) \.\.\. FAILED", out, re.M)
        results = re.findall(r"test result: \w+\. (\d+) passed; (\d+) failed", out)
        compile_err = "error[E" in out or "could not compile" in out
        verdict = "KILLED" if (fails or compile_err or r.returncode != 0) else "SURVIVED"
        print(mid, verdict, "EXIT=%d" % r.returncode, "results=", results, "FAILED=", fails,
              "COMPILE_ERR" if compile_err else "")
    finally:
        shutil.copy(bak, path)
        assert open(path, encoding="utf-8").read() == orig, "przywracanie nie powiodlo sie"


if __name__ == "__main__":
    ids = sys.argv[1:] or list(M.keys())
    print("SCRATCH", SCRATCH)
    for mid in ids:
        run_mutant(mid)
    print("DONE")
