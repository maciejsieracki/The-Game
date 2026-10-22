#!/usr/bin/env python3
"""Testy negatywne (mutacje) P6.M10: kazda mutacja zmienia JEDEN fragment kodu/tabeli silnika,
uruchamia testy p6_m10_* i oczekuje CZERWONYCH testow. Plik jest po kazdej mutacji przywracany
z kopii w pamieci (a na koncu weryfikowany bajt w bajt).

Uzycie (z rust-port/engine, z ustawionym CARGO_TARGET_DIR / CARGO_INCREMENTAL=0):
  python3 ../../dyspozycje/autobot/runs/R-RUSTPORT-P6-M10-KLASTRY-MASY-BRAMKI-Q1/run-mutations.py
"""
import re
import subprocess
import sys

LIB = "src/domain/mapgen/cluster_mass.rs"
MASS = "data/derived/mapgen-cluster-mass.json"
START = "data/derived/start-scoring.json"
TESTS = [
    "--test", "p6_m10_masses", "--test", "p6_m10_placement", "--test", "p6_m10_start_scoring",
    "--test", "p6_m10_v8sort", "--test", "p6_m10_tables",
]

# (id, plik, stary fragment, nowy fragment, ktore wystapienie (1-based) albo 0 = wymagane jedyne)
MUTATIONS = [
    ("alloc-floor-to-ceil", LIB, "let floor = exact.floor();", "let floor = exact.ceil();", 0),
    ("cap-div-to-plus", LIB, "1.max(mass_size / min_development_hex_per_civ())", "1.max(mass_size + min_development_hex_per_civ())", 0),
    ("local-land-disk-r2", LIB, "let r2 = radius.min(-dq + radius);", "let r2 = radius.min(-dq + radius + 1);", 1),
    ("dev-space-disk-r2", LIB, "let r2 = radius.min(-dq + radius);", "let r2 = radius.min(-dq + radius + 1);", 2),
    ("habitable-shallow-sea", LIB, "!matches!(t, Terrain::Sea | Terrain::Mountains | Terrain::ShallowSea)", "!matches!(t, Terrain::Sea | Terrain::Mountains)", 0),
    ("group-masses-ascending", LIB, "js_array_sort_by(&mut masses, |a, b| b.len() as f64 - a.len() as f64);", "js_array_sort_by(&mut masses, |a, b| a.len() as f64 - b.len() as f64);", 0),
    ("group-masses-no-sort", LIB, "js_array_sort_by(&mut masses, |a, b| b.len() as f64 - a.len() as f64);", "let _ = &mut masses;", 0),
    ("group-masses-bfs-not-dfs", LIB, "while let Some(cur) = stack.pop() {", "while let Some(cur) = (if stack.is_empty() { None } else { Some(stack.remove(0)) }) {", 0),
    ("timsort-min-gallop", LIB, "const MIN_GALLOP_WINS: isize = 7;", "const MIN_GALLOP_WINS: isize = 6;", 0),
    ("timsort-min-run", LIB, "const MIN_RUN_THRESHOLD: usize = 64;", "const MIN_RUN_THRESHOLD: usize = 32;", 0),
    ("timsort-binsert-le", LIB, "let order = cmp(pivot, self.work[mid]);\n                if order < 0.0 {", "let order = cmp(pivot, self.work[mid]);\n                if order <= 0.0 {", 0),
    ("timsort-invariant-ge", LIB, "self.runs[n - 2].1 > self.runs[n - 1].1 + self.runs[n].1", "self.runs[n - 2].1 >= self.runs[n - 1].1 + self.runs[n].1", 0),
    ("roster-empty-id-allowed", LIB, "if !id.is_empty() && roster_set.contains(id.as_str()) && !seen.contains(id.as_str()) {", "if roster_set.contains(id.as_str()) && !seen.contains(id.as_str()) {", 0),
    ("roster-no-dedupe", LIB, "if !id.is_empty() && roster_set.contains(id.as_str()) && !seen.contains(id.as_str()) {", "if !id.is_empty() && roster_set.contains(id.as_str()) {", 0),
    ("dominance-gt-to-ge", LIB, "if *count > dominant_count {", "if *count >= dominant_count {", 0),
    ("dominance-ratio-denominator", LIB, "center_count as f64 / region.len() as f64", "center_count as f64 / (region.len() + 1) as f64", 0),
    ("tied-drop-sea-condition", LIB, "&& x.sea <= top.sea + p.tolerancja_odleglosci_od_morza.wartosc", "&& true", 1),
    ("best-local-tie-drop-sea", LIB, "tie_dev(&top, x) && x.sea <= top.sea + tol_sea", "tie_dev(&top, x)", 0),
    ("spread-min-exist-tolerance", LIB, "x.min_exist < top.min_exist - p.tolerancja_min_exist_pasma.wartosc", "x.min_exist < top.min_exist", 0),
    ("balance-gt-to-ge", LIB, "|| spread_after > spread_before", "|| spread_after >= spread_before", 0),
    ("place-balance-iters-floor", LIB, ".ceil() as i64,", ".floor() as i64,", 0),
    ("voronoi-tie-to-last", LIB, "if d < best_dist {", "if d <= best_dist {", 0),
    ("score-near-boundary", LIB, "score += if dist <= sp.promien_pol_blisko.wartosc {", "score += if dist < sp.promien_pol_blisko.wartosc {", 0),
    ("best-start-tie-le", LIB, "(combined == best_score && cd < best_center_dist)", "(combined == best_score && cd <= best_center_dist)", 0),
    ("table-tolerance-dev-0", MASS, None, None, "tolerancja_przestrzeni_rozwoju"),
    ("table-guard-phase2-0", MASS, None, None, "straznik_faza2_mnoznik"),
    ("table-local-frac-0.8", MASS, None, None, "lokalny_lad_frakcja"),
    ("table-start-pustynia-plus", START, None, None, "pustynia"),
    ("table-reveal-normal-9", START, None, None, "normal"),
]

NEW_VALUE = {
    "tolerancja_przestrzeni_rozwoju": "0",
    "sentinel_brak_srodkow": "10",
    "straznik_faza2_mnoznik": "0",
    "lokalny_lad_frakcja": "0.8",
    "pustynia": "4",
    "normal": "9",
}


def mutate_table(text, key):
    pat = re.compile(r'("' + re.escape(key) + r'": \{\s*"wartosc": )(-?[0-9.]+)')
    m = pat.search(text)
    assert m, f"brak klucza {key}"
    return text[: m.start(2)] + NEW_VALUE[key] + text[m.end(2) :]


# Mutacje ROWNOWAZNE (analiza, nie ma testu ktory moglby je wykryc) - uzasadnienie tez w P6-M10 §6a.
# Sa jawnie WYLACZONE z listy MUTATIONS i raportowane w podsumowaniu (EQUIVALENT), zeby nie znikaly po cichu:
EQUIVALENT = {
    "player-gate-ge-to-gt": "`mass_size >= scaled_min` vs `>`; scaled_min >= 30 > PLAYER_START_MIN_MASS_HEXES (25), "
                            "wiec dla mass_size == scaled_min drugi warunek i tak zwraca true",
    "enforce-drop-moving-to-empty": "relokowany srodek pochodzi z cwiartki o obciazeniu >= 2, wiec przeniesienie do "
                                    "pustej cwiartki ZAWSZE zwieksza liczbe zajetych cwiartek",
    "table-sentinel-10": "sentinel 999 (sentinel_brak_srodkow) uzywany tylko gdy brak srodkow => wszystkie minExist rowne "
                         "dla wszystkich kandydatow, nie wplywa na porzadek ani pasmo wyboru",
}
if len(sys.argv) > 1:
    wanted = set(sys.argv[1:])
    MUTATIONS = [m for m in MUTATIONS if m[0] in wanted]

orig = {p: open(p, encoding="utf-8").read() for p in (LIB, MASS, START)}
detected = 0
survived = []
try:
    for mid, path, old, new, nth in MUTATIONS:
        text = orig[path]
        if old is None:
            mutated = mutate_table(text, nth)
        else:
            count = text.count(old)
            if nth == 0:
                assert count == 1, f"{mid}: fragment wystepuje {count}x"
                mutated = text.replace(old, new)
            else:
                assert count >= nth, f"{mid}: fragment wystepuje {count}x < {nth}"
                parts = text.split(old)
                mutated = old.join(parts[:nth]) + new + old.join(parts[nth:])
        assert mutated != text, f"{mid}: mutacja nic nie zmienia"
        open(path, "w", encoding="utf-8").write(mutated)
        r = subprocess.run(["cargo", "test", "--no-fail-fast", *TESTS], capture_output=True, text=True)
        out = r.stdout + r.stderr
        failed = sorted(set(re.findall(r"^test (\S+) \.\.\. FAILED", out, re.M)))
        compile_err = "error[" in out or "could not compile" in out
        open(path, "w", encoding="utf-8").write(text)
        if compile_err:
            print(f"BLAD-KOMPILACJI {mid}: " + " | ".join(l for l in out.splitlines() if "error" in l)[:300])
            survived.append(mid + " (blad kompilacji)")
        elif failed:
            detected += 1
            print(f"WYKRYTA   {mid}: {len(failed)} testow FAILED: {', '.join(failed[:4])}")
        else:
            survived.append(mid)
            print(f"PRZEZYLA  {mid}: wszystkie testy zielone")
        sys.stdout.flush()
finally:
    for p, t in orig.items():
        open(p, "w", encoding="utf-8").write(t)
same = all(open(p, encoding="utf-8").read() == t for p, t in orig.items())
print(f"ROWNOWAZNE (wylaczone z listy, patrz §6a): {sorted(EQUIVALENT)}")
print(f"PODSUMOWANIE: wykryte {detected}/{len(MUTATIONS)}, przezyly: {survived}, pliki przywrocone: {same}")
sys.exit(0 if not survived and same else 1)
