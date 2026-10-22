#!/usr/bin/env python3
# Buduje tabele luk P6 z: web-inventory.tsv (skrypt), rust-inventory.tsv (skrypt), mapping-manual.tsv (RECZNE mapowanie).
# Uzycie: python3 -I build_gap.py <run_dir> > P6-0-GAP-ANALYSIS.generated.md
import sys, os, collections

run = sys.argv[1]

def read_tsv(name):
    with open(os.path.join(run, name), encoding="utf-8") as f:
        lines = [l.rstrip("\n") for l in f if l.strip()]
    hdr = lines[0].split("\t")
    return [dict(zip(hdr, l.split("\t"))) for l in lines[1:]]

web = read_tsv("web-inventory.tsv")
rust = {r["plik"]: r for r in read_tsv("rust-inventory.tsv")}
mapping = {r["plik"]: r for r in read_tsv("mapping-manual.tsv")}

web_files = {w["plik"] for w in web}
missing = sorted(web_files - set(mapping))
extra = sorted(set(mapping) - web_files)
if missing or extra:
    print("MAPPING MISMATCH missing=%s extra=%s" % (missing, extra), file=sys.stderr)
    sys.exit(2)

def rust_loc(target):
    # target: 'domain/x.rs' lub 'domain/x.rs (...)' lub '-'
    t = target.split(" ")[0]
    if t in rust:
        return rust[t]["LOC_niepuste"]
    return "-"

st_count = collections.Counter()
klass_count = collections.Counter()
exp_by_status = collections.Counter()
loc_by_status = collections.Counter()
by_point = collections.defaultdict(lambda: collections.Counter())
for w in web:
    m = mapping[w["plik"]]
    st = m["status"].split(" ")[0]
    st_count[st] += 1
    klass_count[m["klasa"]] += 1
    exp_by_status[(m["klasa"], st)] += int(w["N_eksportow"])
    loc_by_status[st] += int(w["LOC_niepuste"])
    by_point[m["punkt_P6"]][st] += 1

sys_exp_total = sum(v for (k, s), v in exp_by_status.items() if k in ("SYSTEM", "DATA"))
sys_exp_part = sum(v for (k, s), v in exp_by_status.items() if k in ("SYSTEM", "DATA") and s == "CZĘŚCIOWO")
sys_exp_brak = sum(v for (k, s), v in exp_by_status.items() if k in ("SYSTEM", "DATA") and s == "BRAK")
sys_exp_nd = sum(v for (k, s), v in exp_by_status.items() if k in ("SYSTEM", "DATA") and s == "NIE-DOTYCZY")

def pct(a, b):
    return "%.1f%%" % (100.0 * a / b) if b else "NIE_ZMIERZONO"

out = []
w = out.append
w("# P6.0 — Analiza luk: gameplay web (`gra/src/game/**`) vs Rust (`rust-port/engine`)")
w("")
w("Status dokumentu: **WYNIK ANALIZY (zero zmian kodu)**. Pin web: `edb8fb56`. Pin Rust: `origin/rust-port/parity-v2` (e810d0d3 w chwili pomiaru).")
w("Generatory i surowe wyjścia: `dyspozycje/autobot/runs/R-RUSTPORT-P6-0-GAP-ANALYSIS-Q1/` (`inventory_web.py`, `inventory_rust.py`, `web-inventory.tsv`, `rust-inventory.tsv`, `build_gap.py`).")
w("")
w("## 0. Metoda i legenda (ANTY-HALUCYNACJA)")
w("")
w("- Inwentarz web (LOC, liczba eksportów, importy wewnętrzne) — **skryptowy** (`inventory_web.py` na `git archive edb8fb56 gra/src`).")
w("- Inwentarz Rust (LOC, pub fn/items, testy `#[test]`) — **skryptowy** (`inventory_rust.py` na `rust-port/engine/src`).")
w("- Mapowanie web → Rust (kolumna *rust*, *status*, *punkt P6*) — **RĘCZNE, oparte na nazwie pliku i nazwach funkcji**, zapisane w `mapping-manual.tsv`. Nie przeczytano każdej funkcji; to jest **klasyfikacja wstępna**.")
w("- Status: `PORTOWANE-1:1` **nie został przyznany żadnemu wierszowi** — brak dowodu wektor-po-wektorze. `CZĘŚCIOWO (heur.)` = istnieje moduł Rust o zbieżnej nazwie domeny; `BRAK (heur.)` = brak odpowiednika po nazwie; `NIE-DOTYCZY` = UI/prezentacja/dev-tool/przeglądarka (wg nazwy i ścieżki); `NIE_ZMIERZONO` = nie policzono.")
w("- Kolumna *test_rust* — nazwa testu, którego nazwa wskazuje na tę samą funkcję (lista: `rust-test-list.txt`, 373 testy). `-` = brak takiego testu. Sam wpis nie dowodzi parytetu.")
w("- Wektory referencyjne z uruchomionego weba: **NIE_ZMIERZONO** w tym temacie (zakaz uruchamiania weba i npm w tym temacie). Istniejące wektory JSON po stronie Rust (`rt_*`, `*_parses_and_spot_checks`) są pinowane do danych, nie do zachowania silnika.")
w("")
w("## 1. Wskaźniki pokrycia")
w("")
w("| Wskaźnik | Wartość |")
w("|---|---|")
w("| Plików w `gra/src/game/**` (git ls-tree edb8fb56) | %d |" % len(web))
w("| Wierszy w tabeli §3 | %d (zgodność sprawdzona przez build_gap.py: brak brakujących i nadmiarowych) |" % len(mapping))
w("| LOC niepuste web (gra/src/game) | %d |" % sum(int(x["LOC_niepuste"]) for x in web))
w("| Łączna liczba eksportów web | %d |" % sum(int(x["N_eksportow"]) for x in web))
w("| Pliki klasy SYSTEM+DATA | %d |" % sum(v for k, v in klass_count.items() if k in ("SYSTEM", "DATA")))
w("| Pliki klasy UI/DEV (NIE-DOTYCZY wg klasyfikacji) | %d |" % sum(v for k, v in klass_count.items() if k in ("UI", "DEV")))
w("| PORTOWANE-1:1 (z dowodem) | 0 (NIE_ZMIERZONO — brak dowodu per funkcja) |")
w("| Pliki CZĘŚCIOWO (heur.) | %d |" % st_count["CZĘŚCIOWO"])
w("| Pliki BRAK (heur.) | %d |" % st_count["BRAK"])
w("| Pliki NIE-DOTYCZY | %d |" % st_count["NIE-DOTYCZY"])
sys_files = sum(v for k, v in klass_count.items() if k in ("SYSTEM", "DATA"))
sys_part_files = sum(1 for x in mapping.values() if x["klasa"] in ("SYSTEM", "DATA") and x["status"].startswith("CZĘŚCIOWO"))
sys_brak_files = sum(1 for x in mapping.values() if x["klasa"] in ("SYSTEM", "DATA") and x["status"].startswith("BRAK"))
w("| Pokrycie plikowe SYSTEM+DATA — CZĘŚCIOWO (heur.) | %d / %d = %s |" % (sys_part_files, sys_files, pct(sys_part_files, sys_files)))
w("| Pokrycie plikowe SYSTEM+DATA — BRAK (heur.) | %d / %d = %s |" % (sys_brak_files, sys_files, pct(sys_brak_files, sys_files)))
w("| Pokrycie eksportów SYSTEM+DATA — CZĘŚCIOWO (heur., ważone eksportami) | %d / %d = %s |" % (sys_exp_part, sys_exp_total, pct(sys_exp_part, sys_exp_total)))
w("| Pokrycie eksportów SYSTEM+DATA — BRAK (heur.) | %d / %d = %s |" % (sys_exp_brak, sys_exp_total, pct(sys_exp_brak, sys_exp_total)))
w("| Pokrycie eksportów SYSTEM+DATA — PORTOWANE-1:1 z dowodem | 0 / %d = 0.0%% (NIE_ZMIERZONO per funkcja) |" % sys_exp_total)
w("")
w("Uwaga o wskaźnikach: wskaźniki heurystyczne są **górną granicą** pokrycia (zbieżność nazwy ≠ równoważność zachowania). Rzeczywisty parytet wymaga testów wektorowych z weba (P6.23), których jeszcze nie ma.")
w("")
w("### 1a. Rozkład po punktach P6 (heurystycznie)")
w("")
w("| Punkt P6 | CZĘŚCIOWO | BRAK | NIE-DOTYCZY | razem plików |")
w("|---|---|---|---|---|")
for p in sorted(by_point, key=lambda s: (s.split(".")[0], float(s.split(".")[1].split("-")[0]) if "." in s and s.split(".")[1][:1].isdigit() else 0, s)):
    c = by_point[p]
    w("| %s | %d | %d | %d | %d |" % (p, c["CZĘŚCIOWO"], c["BRAK"], c["NIE-DOTYCZY"], sum(c.values())))
w("")
w("## 2. Graf zależności (BRAK / CZĘŚCIOWO)")
w("")
w("Krawędzie = importy wewnętrzne z `web-inventory.tsv` (kolumna `importy_wewn`) między plikami SYSTEM/DATA ze statusem BRAK lub CZĘŚCIOWO. Tylko krawędzie, których cel ma status BRAK lub CZĘŚCIOWO (pliki „hubów” wymagane przed wejściem w ich punkt P6).")
w("")
status_of = {k: mapping[k]["status"].split(" ")[0] for k in mapping}
klass_of = {k: mapping[k]["klasa"] for k in mapping}
point_of = {k: mapping[k]["punkt_P6"] for k in mapping}
imports_in = collections.Counter()
edges = []
for r in web:
    src = r["plik"]
    if klass_of[src] not in ("SYSTEM", "DATA") or status_of[src] not in ("BRAK", "CZĘŚCIOWO"):
        continue
    for imp in [i for i in r["importy_wewn"].split(",") if i]:
        cands = [f for f in web_files if os.path.basename(f).split(".")[0] == imp]
        for c in cands:
            if status_of.get(c) in ("BRAK", "CZĘŚCIOWO") and c != src:
                edges.append((src, c))
                imports_in[c] += 1
w("Liczba krawędzi: %d. Najczęściej importowane pliki (huby, top 15):" % len(edges))
w("")
w("| Plik (cel) | status | punkt P6 | importujących (BRAK/CZĘŚC.) |")
w("|---|---|---|---|")
for f, n in imports_in.most_common(15):
    w("| `%s` | %s | %s | %d |" % (f, status_of[f], point_of[f], n))
w("")
w("Pełna lista krawędzi (źródło → cel) jest wyprowadzalna z `web-inventory.tsv` przez `build_gap.py`; nie jest powielana tutaj, aby nie rozdymać dokumentu.")
w("")
w("## 3. Tabela luk — wiersz na każdy plik web (%d wierszy)" % len(web))
w("")
w("| # | plik web | klasa | LOC web | N eksp. | odpowiednik Rust | LOC Rust | status | punkt P6 | test Rust | uwagi |")
w("|---|---|---|---|---|---|---|---|---|---|---|")
for i, r in enumerate(web, 1):
    m = mapping[r["plik"]]
    w("| %d | `%s` | %s | %s | %s | %s | %s | %s | %s | %s | %s |" % (
        i, r["plik"], m["klasa"], r["LOC_niepuste"], r["N_eksportow"], m["rust"], rust_loc(m["rust"]),
        m["status"], m["punkt_P6"], m["test_rust"], m["uwagi"]))
w("")
out_text = "\n".join(out) + "\n"
sys.stdout.write(out_text)
