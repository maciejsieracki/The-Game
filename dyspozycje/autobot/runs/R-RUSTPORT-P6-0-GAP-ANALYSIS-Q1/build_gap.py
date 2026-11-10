#!/usr/bin/env python3
# Buduje dokument luk P6 (runda 2) z:
#   web-inventory.tsv        (inventory_web.py, skrypt)
#   rust-inventory.tsv       (inventory_rust.py, skrypt)
#   evidence.tsv             (evidence.py, skrypt: dowody nazwowe plik:linia)
#   rust-anchors.tsv         (evidence.py, skrypt: pierwsza linia pub per plik Rust)
#   mapping-manual.tsv       (RECZNE mapowanie web -> Rust, z korektami rundy 2)
#   backlog.tsv              (RECZNE propozycje tematow P6)
#   prose-A.md, prose-B.md   (RECZNE sekcje tekstowe: §4-5 oraz §6a-9)
# Uzycie: python3 -I build_gap.py <run_dir> > P6-0-GAP-ANALYSIS.generated.md
import sys, os, re, collections

run = sys.argv[1]

def read_tsv(name):
    with open(os.path.join(run, name), encoding="utf-8") as f:
        lines = [l.rstrip("\n") for l in f if l.strip()]
    hdr = lines[0].split("\t")
    return [dict(zip(hdr, l.split("\t"))) for l in lines[1:]]

def read_text(name):
    with open(os.path.join(run, name), encoding="utf-8") as f:
        return f.read().rstrip("\n")

web = read_tsv("web-inventory.tsv")
rust = {r["plik"]: r for r in read_tsv("rust-inventory.tsv")}
anchors = {r["plik"]: r for r in read_tsv("rust-anchors.tsv")}
mapping = {r["plik"]: r for r in read_tsv("mapping-manual.tsv")}
backlog = read_tsv("backlog.tsv")

# Dowody nazwowe: plik web -> lista (eksport, linia web, [trafienia Rust])
evid = collections.defaultdict(list)
for r in read_tsv("evidence.tsv"):
    hits = [] if r["rust_dowody_nazwowe"] == "-" else r["rust_dowody_nazwowe"].split(";")
    evid[r["plik"]].append((r["export"], int(r["web_linia"]), hits))

web_files = {w["plik"] for w in web}
missing = sorted(web_files - set(mapping))
extra = sorted(set(mapping) - web_files)
if missing or extra:
    print("MAPPING MISMATCH missing=%s extra=%s" % (missing, extra), file=sys.stderr)
    sys.exit(2)

# Rust-owned file set in the mapping must exist in the inventory (or be '-').
def _first(target):
    return re.sub(r":\d+$", "", target.split(" ")[0])
bad_rust = sorted({_first(m["rust"]) for m in mapping.values()
                   if m["rust"] not in ("-", "") and _first(m["rust"]) not in rust})
if bad_rust:
    print("RUST TARGET MISSING %s" % bad_rust, file=sys.stderr)
    sys.exit(3)

def first_target(target):
    # 'domain/x.rs:215 domain/y.rs:114' -> 'domain/x.rs'; 'domain/x.rs (opis)' -> 'domain/x.rs'
    return re.sub(r":\d+$", "", target.split(" ")[0])

def rust_loc(target):
    t = first_target(target)
    return rust[t]["LOC_niepuste"] if t in rust else "-"

def rust_anchor(target):
    t = first_target(target)
    if t in anchors and anchors[t]["pierwsza_linia_pub"] != "-":
        return "%s:%s (pierwszy pub: %s)" % (t, anchors[t]["pierwsza_linia_pub"], anchors[t]["pierwszy_element"])
    return "-"

def primary_point(p):
    return p.split("-")[0].strip() if p and p != "-" else "-"

# Status display with evidence tier (only CZĘŚCIOWO has tiers).
def tier_of(name):
    hits = [h for (_, _, hs) in evid[name] for h in hs]
    return "nazwa" if hits else "domena"

def status_token(name):
    return mapping[name]["status"].split(" ")[0]

def status_display(name):
    st = status_token(name)
    if st == "CZĘŚCIOWO":
        return "CZĘŚCIOWO (heur., %s)" % tier_of(name)
    if st == "BRAK":
        return "BRAK (heur.)"
    return st

def web_evidence(name):
    for exp, line, _ in evid[name]:
        if line > 0:
            return "gra/src/game/%s:%d (%s)" % (name, line, exp)
    return "-"

def rust_evidence(name):
    for exp, _, hits in evid[name]:
        if hits:
            return "%s (%s)" % (hits[0], exp)
    t = mapping[name]["rust"]
    if t in ("-", ""):
        return "-"
    return rust_anchor(t)

def pct(a, b):
    return "%.1f%%" % (100.0 * a / b) if b else "NIE_ZMIERZONO"

SYSDATA = ("SYSTEM", "DATA")
out = []
w = out.append

# ---------------- §0 ----------------
w("# P6.0 — Analiza luk: gameplay web (`gra/src/game/**`) vs Rust (`rust-port/engine`)")
w("")
w("Status dokumentu: **WYNIK ANALIZY, runda 2 (zero zmian kodu)**. Pin web: `edb8fb56`. Pin Rust: `origin/rust-port/parity-v2` (e810d0d3; drzewo `rust-port/engine/src` nie zmienione między e810d0d3 a commitem analizy — `git diff e810d0d3 HEAD -- rust-port` puste).")
w("Generatory i surowe wyjścia: `dyspozycje/autobot/runs/R-RUSTPORT-P6-0-GAP-ANALYSIS-Q1/` (`inventory_web.py`, `inventory_rust.py`, `evidence.py`, `build_gap.py`, `web-inventory.tsv`, `rust-inventory.tsv`, `evidence.tsv`, `rust-anchors.tsv`, `mapping-manual.tsv`, `backlog.tsv`, logi `rust-*.log`).")
w("")
w("## 0. Metoda, legenda i ograniczenia (ANTY-HALUCYNACJA)")
w("")
w("- Inwentarz web (LOC, liczba eksportów, importy wewnętrzne) — **skryptowy** (`inventory_web.py` na `git archive edb8fb56 gra/src`).")
w("- Inwentarz Rust (LOC, pub fn/items, testy `#[test]`) i kotwice `pierwsza_linia_pub` — **skryptowy** (`inventory_rust.py`, `evidence.py`).")
w("- **Dowód nazwowy (plik:linia po obu stronach)** — **skryptowy** (`evidence.py` → `evidence.tsv`): dla każdego z max 6 pierwszych eksportów pliku web podaje linię jego deklaracji w `gra/src/game/<plik>` oraz deklarację o tej samej nazwie (lub snake_case / UPPER) w `rust-port/engine/src`. Dowód nazwowy dowodzi **zgodności nazwy**, nie równoważności zachowania.")
w("- Mapowanie web → Rust (kolumny *odpowiednik Rust*, *klasa*, *status*, *punkt P6*, *test Rust*) — **RĘCZNE** (`mapping-manual.tsv`), po odczycie nazw i fragmentów kodu wskazanych w kolumnie uwagi; nie przeczytano każdej funkcji.")
w("- **Tiery statusu CZĘŚCIOWO** (generowane przez skrypt, nie ręcznie): `CZĘŚCIOWO (heur., nazwa)` = co najmniej jeden eksport pliku web ma deklarację o tej samej nazwie w Rust (dowód nazwowy w tabeli §3); `CZĘŚCIOWO (heur., domena)` = Rust ma moduł tej domeny, ale ŻADEN eksport nie ma dowodu nazwowego (uznanie domenowe, najsłabszy poziom). `BRAK (heur.)` = brak odpowiednika logiki (dane/parametry w Rust, bez funkcji logiki, nie liczą się jako CZĘŚCIOWO). `ISTNIEJE-NIEZWERYFIKOWANE` = treść pliku wskazuje na pojęcie, którego odpowiednika nie udało się wskazać. `NIE-DOTYCZY` = UI/prezentacja/dev-tool/przeglądarka. Klasa `DATA` (loader/parser JSON) może być CZĘŚCIOWO, gdy Rust parsuje te same dane (test `*_parses_and_spot_checks`).")
w("- Reguła rundy 2: pole danych w strukturze Rust (np. `pole epoka_wejscia`, `zdrowie_bonus_osiedle_pop`) **nie** jest odpowiednikiem logiki funkcji web. Pliki zawierające logikę, dla których w Rust jest tylko pole, są BRAK.")
w("- `PORTOWANE-1:1` **nie został przyznany żadnemu wierszowi** — brak dowodu wektor-po-wektorze.")
w("- Test Rust w kolumnie *test Rust* to nazwa testu o tej samej funkcji (sprawdzona w `rust-test-list.txt`); sama nazwa nie dowodzi parytetu. Pozycje, których nazwa testu dotyczy innej funkcji, mają `-`.")
w("- Wektory referencyjne z uruchomionego weba: **NIE_ZMIERZONO** (zakaz uruchamiania weba i npm w tym temacie).")
w("")
w("## 1. Wskaźniki pokrycia (po korekcie rundy 2)")
w("")
st_disp = collections.Counter(status_display(f) for f in web_files)
klass_count = collections.Counter(mapping[f]["klasa"] for f in web_files)
sysdata_files = [f for f in web_files if mapping[f]["klasa"] in SYSDATA]
sysdata_exp = sum(int(w_["N_eksportow"]) for w_ in web if w_["plik"] in sysdata_files)
def exp_of(f):
    return int(next(x for x in web if x["plik"] == f)["N_eksportow"])
part_nazwa = [f for f in sysdata_files if status_token(f) == "CZĘŚCIOWO" and tier_of(f) == "nazwa"]
part_domena = [f for f in sysdata_files if status_token(f) == "CZĘŚCIOWO" and tier_of(f) == "domena"]
brak = [f for f in sysdata_files if status_token(f) == "BRAK"]
niezw = [f for f in sysdata_files if status_token(f) == "ISTNIEJE-NIEZWERYFIKOWANE"]
nd = [f for f in web_files if mapping[f]["klasa"] not in SYSDATA]
w("| Wskaźnik | Wartość |")
w("|---|---|")
w("| Plików w `gra/src/game/**` (`git ls-tree -r --name-only edb8fb56 gra/src/game \\| wc -l`) | %d |" % len(web))
w("| Wierszy w tabeli §3 | %d (build_gap.py: brak brakujących i nadmiarowych wierszy) |" % len(mapping))
w("| LOC niepuste web (gra/src/game) | %d |" % sum(int(x["LOC_niepuste"]) for x in web))
w("| Łączna liczba eksportów web | %d |" % sum(int(x["N_eksportow"]) for x in web))
w("| Pliki klasy SYSTEM+DATA | %d (eksportów: %d) |" % (len(sysdata_files), sysdata_exp))
w("| Pliki klasy UI/DEV (NIE-DOTYCZY) | %d |" % len(nd))
w("| PORTOWANE-1:1 (z dowodem) | 0 (NIE_ZMIERZONO — brak dowodu per funkcja) |")
w("| Pliki CZĘŚCIOWO, tier nazwa (dowód nazwowy) | %d |" % len(part_nazwa))
w("| Pliki CZĘŚCIOWO, tier domena (bez dowodu nazwowego) | %d |" % len(part_domena))
w("| Pliki BRAK | %d |" % len(brak))
w("| Pliki ISTNIEJE-NIEZWERYFIKOWANE | %d |" % len(niezw))
w("| Pokrycie plikowe SYSTEM+DATA — CZĘŚCIOWO, wszystkie tiery (górna granica) | %d / %d = %s |" % (len(part_nazwa) + len(part_domena), len(sysdata_files), pct(len(part_nazwa) + len(part_domena), len(sysdata_files))))
w("| Pokrycie plikowe SYSTEM+DATA — CZĘŚCIOWO tier nazwa (dolna granica dowodowa) | %d / %d = %s |" % (len(part_nazwa), len(sysdata_files), pct(len(part_nazwa), len(sysdata_files))))
w("| Pokrycie eksportów SYSTEM+DATA — CZĘŚCIOWO, wszystkie tiery (ważone eksportami) | %d / %d = %s |" % (sum(exp_of(f) for f in part_nazwa + part_domena), sysdata_exp, pct(sum(exp_of(f) for f in part_nazwa + part_domena), sysdata_exp)))
w("| Pokrycie eksportów SYSTEM+DATA — CZĘŚCIOWO tier nazwa | %d / %d = %s |" % (sum(exp_of(f) for f in part_nazwa), sysdata_exp, pct(sum(exp_of(f) for f in part_nazwa), sysdata_exp)))
w("| Pokrycie eksportów SYSTEM+DATA — PORTOWANE-1:1 z dowodem | 0 / %d = 0.0%% (NIE_ZMIERZONO per funkcja) |" % sysdata_exp)
w("")
w("Uwaga o wskaźnikach: rząd wielkości jest niepewny. Górna granica (wszystkie tiery) i dolna granica dowodowa (tier nazwa) różnią się wielokrotnie — to jest właściwy zakres niepewności; pojedynczy procent nie jest wiarygodnym wskaźnikiem parytetu. Rzeczywisty parytet wymaga testów wektorowych z weba (P6.23), których jeszcze nie ma.")
w("")
w("### 1a. Rozkład statusów po punktach P6 (wg punktu głównego, pierwszy token przed `-`)")
w("")
w("| Punkt P6 | CZĘŚC. nazwa | CZĘŚC. domena | BRAK | ISTN.-NIEZW. | NIE-DOTYCZY | razem |")
w("|---|---|---|---|---|---|---|")
by_point = collections.defaultdict(collections.Counter)
for f in web_files:
    p = primary_point(mapping[f]["punkt_P6"])
    if status_token(f) == "CZĘŚCIOWO":
        by_point[p]["CZĘŚC. " + tier_of(f)] += 1
    elif status_token(f) == "BRAK":
        by_point[p]["BRAK"] += 1
    elif status_token(f) == "ISTNIEJE-NIEZWERYFIKOWANE":
        by_point[p]["ISTN"] += 1
    else:
        by_point[p]["ND"] += 1
def pkey(s):
    m = re.match(r"P6\.(\d+)", s)
    return int(m.group(1)) if m else 999
for p in sorted(by_point, key=pkey):
    c = by_point[p]
    tot = sum(c.values())
    w("| %s | %d | %d | %d | %d | %d | %d |" % (p, c["CZĘŚC. nazwa"], c["CZĘŚC. domena"], c["BRAK"], c["ISTN"], c["ND"], tot))
w("")
w("## 2. Graf zależności (BRAK / CZĘŚCIOWO / ISTNIEJE-NIEZWERYFIKOWANE)")
w("")
w("Krawędzie = importy wewnętrzne z `web-inventory.tsv` (kolumna `importy_wewn`) od plików SYSTEM/DATA o statusie BRAK, CZĘŚCIOWO lub ISTNIEJE-NIEZWERYFIKOWANE do plików tych samych statusów.")
w("")
status_of = {k: status_token(k) for k in mapping}
klass_of = {k: mapping[k]["klasa"] for k in mapping}
point_of = {k: mapping[k]["punkt_P6"] for k in mapping}
OPEN = ("BRAK", "CZĘŚCIOWO", "ISTNIEJE-NIEZWERYFIKOWANE")
imports_in = collections.Counter()
edges = []
for r in web:
    src = r["plik"]
    if klass_of[src] not in SYSDATA or status_of[src] not in OPEN:
        continue
    for imp in [i for i in r["importy_wewn"].split(",") if i]:
        for c in [f for f in web_files if os.path.basename(f).split(".")[0] == imp]:
            if status_of.get(c) in OPEN and c != src:
                edges.append((src, c))
                imports_in[c] += 1
w("Liczba krawędzi: %d. Najczęściej importowane pliki (huby, top 15):" % len(edges))
w("")
w("| Plik (cel) | status | punkt P6 | importujących |")
w("|---|---|---|---|")
for f, n in imports_in.most_common(15):
    w("| `%s` | %s | %s | %d |" % (f, status_display(f), point_of[f], n))
w("")
w("Pełna lista krawędzi (źródło → cel) jest wyprowadzalna z `web-inventory.tsv` przez `build_gap.py`. Uwaga: importy są wyłącznie po nazwie bazowej pliku (`basename`), więc krawędź może być fałszywie dodatnia przy kolizji nazw między katalogami.")
w("")
w("## 3. Tabela luk — wiersz na każdy plik web (%d wierszy)" % len(web))
w("")
w("Kolumny dowodu: *dowód web* = linia deklaracji pierwszego eksportu pliku web; *dowód Rust* = (a) trafienie nazwowe `plik:linia` tej samej nazwy, albo (b) kotwica modułu docelowego `plik:linia (pierwszy pub)`. Obie kolumny są **lokalizatorami**, nie dowodem równoważności.")
w("")
w("| # | plik web | klasa | LOC web | N eksp. | odpowiednik Rust | LOC Rust | status | punkt P6 | dowód web (plik:linia) | dowód Rust (plik:linia) | test Rust | uwagi |")
w("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
for i, r in enumerate(web, 1):
    m = mapping[r["plik"]]
    name = r["plik"]
    w("| %d | `%s` | %s | %s | %s | %s | %s | %s | %s | %s | %s | %s | %s |" % (
        i, name, m["klasa"], r["LOC_niepuste"], r["N_eksportow"], m["rust"], rust_loc(m["rust"]),
        status_display(name), m["punkt_P6"], web_evidence(name), rust_evidence(name), m["test_rust"], m["uwagi"]))
w("")

# ---------------- §4-5 (prose) ----------------
w(read_text("prose-A.md"))
w("")

# ---------------- §6b (generated backlog) ----------------
SIZE_LIMITS = [(300, "S"), (1000, "M"), (2000, "L")]
def size_of(loc):
    for lim, lab in SIZE_LIMITS:
        if loc < lim:
            return lab
    return "XL"

def topic_points(pts):
    return [p.strip() for p in pts.split(",") if p.strip()]

def topic_loc(pts):
    ps = set(topic_points(pts))
    files = [f for f in web_files if primary_point(mapping[f]["punkt_P6"]) in ps]
    loc = sum(int(x["LOC_niepuste"]) for x in web if x["plik"] in files)
    return loc, len(files)

def allow_paths(allow):
    out_ = set()
    for part in allow.split(","):
        p = re.sub(r"\(.*?\)", "", part).strip()
        if p and not p.startswith("tests/p6_") and "brak" not in p and "NIE" not in p:
            out_.add(p.split(" ")[0])
    return out_

w("## 6b. Propozycja backlogu P6 — rozmiary i kolizje (wyliczone skryptem)")
w("")
w("Rozmiar = suma LOC niepuste plików web, których **punkt główny** (pierwszy punkt przed `-` w `mapping-manual.tsv`) należy do zakresu tematu. Progi: S < 300, M 300–999, L 1000–1999, XL ≥ 2000 LOC web. Tematy bez plików web (P6-22 replay, P6-23, P6-24) nie mają rozmiaru web.")
w("")
w("| ID tematu | punkty | pliki web | LOC web (suma) | rozmiar | allowlista Rust | zależności | równoległość |")
w("|---|---|---|---|---|---|---|---|")
for b in backlog:
    loc, nf = topic_loc(b["punkty"])
    rozm = size_of(loc) if nf else "n/d (bez plików web)"
    w("| %s | %s | %d | %d | %s | %s | %s | %s |" % (b["id"], b["punkty"], nf, loc, rozm, b["allowlista_rust"], b["zaleznosci"], b["rownoleglosc"]))
w("")
w("### 6b-i. Kontrola kolizji allowlist (skrypt)")
w("")
w("Dla każdej pary tematów zbiór wspólnych ścieżek Rust (bez plików testów `tests/p6_*`, które są nowe i per temat). Para z niepustym przecięciem nie może być oznaczona jako równoległa.")
w("")
topics = [(b["id"], allow_paths(b["allowlista_rust"])) for b in backlog]
coll = []
for i in range(len(topics)):
    for j in range(i + 1, len(topics)):
        common = topics[i][1] & topics[j][1]
        if common:
            coll.append((topics[i][0], topics[j][0], sorted(common)))
if coll:
    w("| temat A | temat B | wspólne ścieżki | czy oznaczone równoległe |")
    w("|---|---|---|---|")
    par_claim = {"R-RUSTPORT-P6-12-AI-WOJNY", "R-RUSTPORT-P6-13-WALKA", "R-RUSTPORT-P6-16-KULTURA-RELIGIA", "R-RUSTPORT-P6-17-TECHNOLOGIE-CUDA"}
    for a, b_, c in coll:
        both = (a in par_claim and b_ in par_claim)
        w("| %s | %s | %s | %s |" % (a, b_, ", ".join("`%s`" % x for x in c), "TAK — BŁĄD" if both else "nie (sekwencyjnie)"))
else:
    w("Brak wspólnych ścieżek między tematami.")
w("")
par_set = ["R-RUSTPORT-P6-12-AI-WOJNY", "R-RUSTPORT-P6-13-WALKA", "R-RUSTPORT-P6-16-KULTURA-RELIGIA", "R-RUSTPORT-P6-17-TECHNOLOGIE-CUDA"]
bad = [c for c in coll if c[0] in par_set and c[1] in par_set]
w("Wynik kontroli równoległości (P6-12 ‖ P6-13 ‖ P6-16 ‖ P6-17): %s." % ("BŁĄD — wspólne ścieżki: %s" % bad if bad else "brak wspólnych ścieżek; zbiory allowlist są rozłączne"))
w("")

# ---------------- §6a, 7-9 (prose) ----------------
w(read_text("prose-B.md"))

sys.stdout.write("\n".join(out) + "\n")
