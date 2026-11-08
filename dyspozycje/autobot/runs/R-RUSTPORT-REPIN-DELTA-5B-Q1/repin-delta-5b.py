#!/usr/bin/env python3
"""R-RUSTPORT-REPIN-DELTA-5B-Q1 - pomiar dryfu 76 plikow weba poza zakresem REPIN-DELTA-5.

Uruchomienie (z korzenia repo, bez checkoutu gra/ - czyta tylko `git diff` / `git show`):
    python3 dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-5B-Q1/repin-delta-5b.py

Wynik: dyspozycje/rust-port/p6/REPIN-DELTA-5B.md (nadpisuje). Asercja: suma hunkow +/- per plik
== `git diff --numstat` (przerwanie przy niezgodnosci).
Klasyfikacja hunkow jest HEURYSTYCZNA (regula sciezka/slowa kluczowe, patrz sekcja 1 dokumentu).
"""
import collections
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
PIN = "4bbef081d"        # pin logiki (poczatek dryfu)
WEB_OLD = "59868d84f"    # koniec pomiaru REPIN-DELTA-5 (FALA 544)
WEB = "1da227738"        # baza tego pomiaru = origin/main w chwili startu (kotwica SHA, nie ruchomy ref)
# Kontrola: origin/main = a61337844 (+1 commit, tylko CLAUDE.md); zero zmian w gra/ wzgledem 1da227738.
OUT = os.path.join(REPO, "dyspozycje", "rust-port", "p6", "REPIN-DELTA-5B.md")


def git(*args):
    return subprocess.run(["git"] + list(args), cwd=REPO, capture_output=True,
                          text=True, check=True).stdout


def out_of_scope_files():
    names = git("diff", "--name-only", PIN, WEB, "--", "gra/src", "gra/data").splitlines()
    return [n for n in names if n.startswith("gra/src/") and not n.startswith("gra/src/game/")]


def numstat(files):
    res = {}
    for line in git("diff", "--numstat", PIN, WEB, "--", *files).splitlines():
        a, d, p = line.split("\t")
        res[p] = (0, 0) if a == "-" else (int(a), int(d))   # '-' = plik binarny (mp3)
    return res


HUNK_RE = re.compile(r'^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@')


def parse_hunks(path):
    txt = git("diff", "-U0", PIN, WEB, "--", path)
    hunks, cur = [], None
    for line in txt.splitlines():
        m = HUNK_RE.match(line)
        if m:
            cur = {"new": int(m.group(3)), "lines": []}
            hunks.append(cur)
            continue
        if cur is not None and line[:1] in "+-" and not line.startswith(("+++", "---")):
            cur["lines"].append(line)
    return hunks


PERF_RE = re.compile(r'^\s*(//|/\*|\*|\*/|$)')
IMPORT_RE = re.compile(r'^\s*import\b')
UI_KW = re.compile(r'document\.|innerHTML|classList|style\.|addEventListener|dataset|hud|Hud|panel|'
                   r'Panel|tooltip|Tooltip|render|minimap|toast|modal|button|\bDOM\b|textContent|'
                   r'createElement|aria-|title=', re.I)


def classify_file_hunk(path, lines):
    ch = [l[1:] for l in lines]
    if all(PERF_RE.match(c) or IMPORT_RE.match(c) for c in ch):
        return "PERF"
    if path.endswith(".mp3"):
        return "BIN"
    if path.endswith(".json"):
        return "DANE"
    if re.match(r'^gra/src/(ui|render|audio)/', path):
        return "UI"
    if path == "gra/src/main.ts" or path.startswith("gra/src/map/minimap"):
        return "UI" if sum(1 for c in ch if UI_KW.search(c)) * 2 >= len(ch) else "LOGIKA"
    return "LOGIKA"


# Obszary main.ts (plik jest jednym duzym boot()): regula po slowach kluczowych, pierwsza zgodna wygrywa.
MAIN_AREAS = [
    ("SIEGE-OBLEZENIE", "#7 OBLEZENIE-ZDOBYCZE", r'siege|Siege|oblez|Oblez|sortie|Sortie|surrender|Surrender|poddan|starv|Starv|głod|wypad|Wypad|Blockade|blockade'),
    ("BITWA", "#7 OBLEZENIE-ZDOBYCZE", r'battle|Battle|bitw|Bitw|PreBattle|attack|Attack'),
    ("AUTO-ULEPSZENIA-BUDOWA", "#3 AUTOIMPROVE", r'autoBuild|AutoBuild|auto_build|autoImprov|AutoImprov|pickAutoImprov|autoManage|BudowaLista|autoclear|AutoClear|improvement|Improvement|ulepsz|Ulepsz'),
    ("DYPLOMACJA-WOJNA", "#4 DYPLOMACJA-MULTIWAR / #5", r'diplo|Diplo|treaty|Treaty|forced|Forced|peace|Peace|truce|Truce|NAP|traktat|Traktat|war[A-Z_]|War[A-Z_]|wojn|Wojn|weariness|Weariness|alliance|Alliance'),
    ("ARMIA-AI", "#6 AI-ARMIA", r'army|Army|armi|Armi|general|General|recruit|Recruit|rekrut|stack|Stack|march|March|marsz|scout|Scout|leader|Leader|consolidat|Consolidat|Merge|merge'),
    ("MIASTA-ZDOBYCZE", "#7 OBLEZENIE-ZDOBYCZE", r'capture|Capture|wonder|Wonder|cud|annex|Annex|spoil|Spoil|conquer|Conquer|zdob|CityState|cityState|citystate'),
    ("EKONOMIA-HANDEL", "#2 EKONOMIA-F / NOWY-3", r'econ|Econ|tax|Tax|podatk|trade|Trade|handel|Handel|resource|Resource|surow|Surow|emporion|Emporion|warehouse|Warehouse|granary|Granary|spichlerz|Spichlerz|pop[A-Z]|popCap|manpower|Manpower|ration|food|Food|gold|Gold|upkeep|Upkeep'),
    ("EPOKI-TECH-DANE", "NOWY-2 ULEPSZENIA-EPOKA (epoki/tech)", r'epoch|Epoch|Era|era[A-Z]|tech|Tech|unlock|Unlock|buildingDef|BUILDING|buildings'),
    ("ZDARZENIA", "NOWY-5 ZDARZENIA-TURA", r'event|Event|zdarz|Zdarz|defer|Defer'),
    ("ZAPIS-MIGRACJE", "#8 ZAPIS-MIGRACJE", r'save|Save|load|Load|migr|Migr|serialize|Serialize|hydrate|Hydrate|session|Session'),
    ("NAZWY-MIASTA", "NOWY-6 NAZWY-STOLICE", r'name|Name|nazw|Nazw'),
    ("MAPA-TEREN-START", "P6.M mapgen (poza §0c)", r'map|Map|terrain|Terrain|hex|Hex|cluster|Cluster|spawn|Spawn|river|River|fresh|Fresh|territory|Territory|start|Start'),
    ("UI-HUD-PANELE-USTAWIENIA", "P7 UI (REPIN-UI-4)", r'hud|HUD|panel|Panel|minimap|Minimap|settings|Settings|ustawien|notif|Notif|powiadom|tooltip|Tooltip|toast|modal|Modal|button|Button|tab|Tab|render|Render|camera|Camera|overlay|Overlay|audio|Audio|music|Music'),
]
MAIN_RX = [(n, t, re.compile(p)) for n, t, p in MAIN_AREAS]
INNE = "INNE-NIESKLASYFIKOWANE"


def classify_main_hunk(lines):
    ch = [l[1:] for l in lines]
    body = "\n".join(ch)
    area, topic = INNE, "nowy temat (NIE_ZMIERZONO)"
    for n, t, rx in MAIN_RX:
        if rx.search(body):
            area, topic = n, t
            break
    if all(PERF_RE.match(c) or IMPORT_RE.match(c) for c in ch):
        cls = "PERF"
    elif area == "UI-HUD-PANELE-USTAWIENIA" and sum(1 for c in ch if UI_KW.search(c)) * 2 >= len(ch):
        cls = "UI"
    else:
        cls = "LOGIKA"
    return area, topic, cls


def topic_module(path):
    """Temat z kolejki §0c (albo NOWY) i docelowy modul Rust - regula katalogowa (ZALOZENIE)."""
    if path.endswith(".mp3"):
        return "P7 AUDIO (asset binarny)", "— (asset, poza silnikiem)"
    if path == "gra/src/data/wikiBundle.json":
        return "— (wiki/pomoc, poza silnikiem)", "—"
    if path == "gra/src/data/map-gen-params-loader.ts":
        return "NOWY-6 NAZWY-STOLICE / mapgen", "map_generator.rs (loader parametrow, docelowy)"
    if path.startswith("gra/src/audio/"):
        return "P7 AUDIO (poza §0c)", "— (audio, P7)"
    if path.startswith("gra/src/battle/"):
        if "testBattle" in path:
            return "— (harness testowy)", "—"
        if "siegeWall" in path:
            return "#7 OBLEZENIE-ZDOBYCZE", "siege_wall (docelowy, nowy modul)"
        return "#7 OBLEZENIE-ZDOBYCZE", "combat.rs (docelowy)"
    if path in ("gra/src/map/improvement-build.ts", "gra/src/map/territory-work.ts"):
        return "#3 AUTOIMPROVE", "auto_improvements.rs / improvements.rs (docelowy)"
    if path == "gra/src/map/map-attack-city.ts":
        return "#7 OBLEZENIE-ZDOBYCZE", "combat.rs (docelowy)"
    if path == "gra/src/map/minimap.ts":
        return "P7 UI (minimapa)", "— (UI, P7)"
    if path == "gra/src/map/newGameMapDefaults.ts":
        return "NOWY-6 NAZWY-STOLICE / mapgen", "map_generator.rs (docelowy)"
    if path == "gra/src/map/freshwater.ts":
        return "P6.M mapgen / woda (poza §0c)", "freshwater.rs (docelowy)"
    if path.startswith("gra/src/map/"):
        return "P6.M mapgen (poza §0c)", "map_generator.rs / clusters (docelowy)"
    if path.startswith("gra/src/render/"):
        return "P7 RENDER (REPIN-RENDER-4, nowy)", "— (renderer P7)"
    if path == "gra/src/types/resources.ts":
        return "#2 EKONOMIA-F", "resource typy (docelowy: resource_production.rs)"
    if path == "gra/src/units/setup.ts":
        return "#6 AI-ARMIA (start jednostek, zwiadowca/stos)", "unit setup (docelowy: units/setup.rs)"
    if path == "gra/src/main.ts":
        return "rozbity na obszary: sekcja 3", "rozbity: sekcja 3"
    if path.startswith("gra/src/ui/"):
        base = os.path.basename(path)
        rules = [
            (r'armyMerge|armySplit|armyStack|unitRecruit|empireRecruit', "#6 AI-ARMIA (panel armii, UI)"),
            (r'diplomacyTradeBasket', "#4 DYPLOMACJA-MULTIWAR (UI koszyk)"),
            (r'siegeMap', "#7 OBLEZENIE-ZDOBYCZE (UI)"),
            (r'sidePanelEvent', "NOWY-5 ZDARZENIA-TURA (UI)"),
            (r'empireDetail|cityPanel', "#2 EKONOMIA-F (UI panel)"),
        ]
        for rx, t in rules:
            if re.search(rx, base):
                return t, "— (UI; P7 kontroler v2)"
        return "P7 UI (HUD/panele, REPIN-UI-4)", "— (UI; P7 kontroler v2)"
    return "nowy temat (NIE_ZMIERZONO)", "NOWY (NIE_ZMIERZONO)"


def main():
    files = out_of_scope_files()
    assert len(files) == 76, f"zakres: {len(files)} != 76"
    ns = numstat(files)
    assert len(ns) == 76, len(ns)
    rows = []
    bad = []
    main_items = None
    tot = collections.Counter()
    cls_tot = collections.Counter()
    for f in files:
        hs = parse_hunks(f)
        a = sum(1 for h in hs for l in h["lines"] if l[0] == "+")
        d = sum(1 for h in hs for l in h["lines"] if l[0] == "-")
        if (a, d) != ns[f]:
            bad.append((f, (a, d), ns[f]))
        cls = collections.Counter(classify_file_hunk(f, h["lines"]) for h in hs)
        if f == "gra/src/main.ts":
            main_items = hs
        topic, module = topic_module(f)
        rows.append((f, len(hs), a, d, cls, topic, module))
        tot["hunks"] += len(hs)
        tot["a"] += a
        tot["d"] += d
        cls_tot.update(cls)
    if bad:
        sys.exit("ASSERT FAIL: " + repr(bad))

    # main.ts - obszary funkcjonalne
    areas = collections.OrderedDict()
    for h in main_items:
        area, topic, cls = classify_main_hunk(h["lines"])
        e = areas.setdefault(area, {"topic": topic, "hunks": 0, "a": 0, "d": 0, "cls": collections.Counter(), "first": h["new"]})
        e["hunks"] += 1
        e["a"] += sum(1 for l in h["lines"] if l[0] == "+")
        e["d"] += sum(1 for l in h["lines"] if l[0] == "-")
        e["cls"][cls] += 1
        e["first"] = min(e["first"], h["new"])
    areas_sum = sum(e["hunks"] for e in areas.values())
    assert areas_sum == len(main_items), (areas_sum, len(main_items))

    delta_ns = {}
    for line in git("diff", "--numstat", WEB_OLD, WEB, "--", "gra/src", "gra/data").splitlines():
        a, d, p = line.split("\t")
        delta_ns[p] = (a, d)
    sha_web = git("rev-parse", "--short", WEB).strip()
    sha_pin = git("rev-parse", "--short", PIN).strip()

    doc = render(files, rows, tot, cls_tot, areas, delta_ns, sha_web, sha_pin, main_items)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(doc)
    print("OK", OUT)
    print("ASSERT numstat 76/76 OK; hunki", tot["hunks"], "+", tot["a"], "-", tot["d"])
    print("main.ts obszary:", areas_sum, "hunkow")


def esc(s):
    return s.replace("|", "\\|")


def render(files, rows, tot, cls_tot, areas, delta_ns, sha_web, sha_pin, main_items):
    L = []
    w = L.append
    main_row = next(r for r in rows if r[0] == "gra/src/main.ts")
    w("# REPIN-DELTA-5B — pomiar dryfu 76 plików webu poza zakresem REPIN-DELTA-5\n")
    w("**Temat:** `R-RUSTPORT-REPIN-DELTA-5B-Q1` · **Runda:** 1/5 · **Rola:** Operator · **Domena:** PROCESS (dokumentacja, zero zmian w kodzie gry)\n")
    w("## 1. Baza, metoda, klasyfikacja\n")
    w("| Element | Wartość |")
    w("|---|---|")
    w(f"| Pin logiki (początek dryfu) | `{sha_pin}` (z REPIN-DELTA-5 §1) |")
    w(f"| Baza web (koniec pomiaru) | `{sha_web}` = `origin/main` w chwili startu. Dispatch: „origin/main (1da227738 lub nowszy)” — spełnione. Późniejszy `origin/main` = `a61337844` zmienia wyłącznie `CLAUDE.md` (0 plików `gra/`), więc pomiar nie wymaga przeliczenia |")
    w("| Zakres 76 plików | `git diff --name-only 4bbef081d origin/main -- gra/src gra/data` minus `gra/src/game/**` i `gra/data/**` = wszystko pod `gra/src/` poza `gra/src/game/` (76) |")
    w("| Jednostka „hunk” | blok `@@` z `git diff -U0 4bbef081d origin/main -- <plik>` |")
    w("| Asercja (kryterium końca) | dla każdego z 76 plików suma linii `+`/`−` z hunków == `git diff --numstat` — **ZGODNE (76/76)**; 13 plików `.mp3` to binarne (`-	-` w numstat), 0 hunków, pomijane w sumach |")
    w(f"| Suma zakresu 76 | {tot['hunks']} hunków · +{tot['a']} / −{tot['d']} (= `git diff --shortstat` dla `gra/src gra/data` minus 91 plików `gra/src/game`+`gra/data`: 16674/2338 − 8481/904) |")
    w("| Skrypt | `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-5B-Q1/repin-delta-5b.py` (generuje ten plik; asercja w kodzie) |")
    w("")
    w("**Klasy (ZAŁOŻENIE-H — klasyfikacja HEURYSTYCZNA, nie ręczne czytanie każdego hunka):**")
    w("- **PERF-bez-wpływu** — każda zmieniona linia to komentarz, pusta linia albo `import` (ZAŁOŻENIE-1 z REPIN-5).")
    w("- **DANE** — plik `.json` (zmiana wartości/kształtu danych).")
    w("- **UI** — pliki `gra/src/ui/`, `gra/src/render/`, `gra/src/audio/`; w `minimap.ts` gdy ≥50% zmienionych linii zawiera słowa UI/DOM (`document.`, `innerHTML`, `hud`, `panel`, `tooltip`, `render`, `minimap`, …). Dla `main.ts` działają DWIE reguły, które dają różne wyniki (jawnie, bez ukrywania): (a) wiersz §3 — ta sama reguła ≥50% słów UI per hunk (`classify_file_hunk`): UI 31; (b) §4 — per obszar słów kluczowych (`classify_main_hunk`): UI tylko w obszarze `UI-HUD-PANELE-USTAWIENIA` i tylko gdy ≥50% słów UI: UI 8. Hunki UI w innych obszarach (np. SIEGE, BITWA, ARMIA) są w §4 liczone jako LOGIKA — to zaniża UI w §4.")
    w("- **LOGIKA** — wszystko inne (`battle/`, `map/`, `units/`, `data/*.ts`, `types/`, reszta `main.ts`).")
    w("- **Ograniczenie:** heurystyka może pomylić UI z LOGIKA w `main.ts` (plik to jeden `boot()` na ~45 tys. linii). Niepewne przypadki NIE są rozstrzygane — patrz §5. Wartości hunków i +/− są zmierzone, klasy są oszacowane.\n")
    w("**Przypisanie tematu i modułu (ZAŁOŻENIE-T):** regułą katalogową/nazwową wg `PLAN-PORT-RUST-TAURI-20261020.md` §0c (tematy #2–#8) oraz etykiet NOWY-1…7 z REPIN-DELTA-5 §7. Nazwy modułów Rust (`*.rs`) są **docelowe** — NIE sprawdzono ich istnienia w `rust-port/engine/src/domain/` (NIE_ZMIERZONO).\n")

    w("## 2. Podsumowanie klas (76 plików; main.ts w klasach per plik)\n")
    w("| Klasa | Hunki | Udział |")
    w("|---|---:|---:|")
    total_h = tot["hunks"]
    for k in ["LOGIKA", "UI", "DANE", "PERF", "BIN"]:
        n = cls_tot.get(k, 0)
        w(f"| {k} | {n} | {100.0 * n / total_h:.1f}% |")
    w(f"| **Razem** | **{total_h}** | 100% |\n")
    w(f"Dla porównania: REPIN-DELTA-5 (91 plików `gra/src/game`+`gra/data`, baza 59868d84f) = 626 hunków. Hunki `main.ts` w tabeli per plik: {main_row[1]} (LOGIKA {main_row[4].get('LOGIKA',0)}, UI {main_row[4].get('UI',0)}, PERF {main_row[4].get('PERF',0)}); podział per obszar — §4.\n")

    w("## 3. Tabela plików (wiersz dla każdego z 76)\n")
    w("Kolumny: hunki (`-U0`) · `+/−` (= `numstat`, asercja OK) · L/D/U/P/B = LOGIKA/DANE/UI/PERF/BIN (heurystyka) · temat docelowy · moduł Rust docelowy.\n")
    w("| # | Plik (web, `gra/src/…`) | Hunki | +/− | L/D/U/P/B | Temat | Moduł Rust docelowy |")
    w("|---:|---|---:|---|---|---|---|")
    for i, (f, n, a, d, cls, topic, module) in enumerate(rows, 1):
        short = f.replace("gra/src/", "")
        cs = f"{cls.get('LOGIKA',0)}/{cls.get('DANE',0)}/{cls.get('UI',0)}/{cls.get('PERF',0)}/{cls.get('BIN',0)}"
        if f == "gra/src/main.ts":
            cs = f"{cls.get('LOGIKA',0)}/0/{cls.get('UI',0)}/{cls.get('PERF',0)}/0 (reguła ogólna §1; podział per obszar §4 — rozbieżność jawna, patrz uwaga pod §4)"
        w(f"| {i} | `{short}` | {n} | +{a}/−{d} ✓ | {cs} | {esc(topic)} | {esc(module)} |")
    w("")

    w("## 4. `main.ts` — obszary funkcjonalne (483 hunki, +2841/−463)\n")
    w("Plik `main.ts` na `origin/main` ma ~45 500 linii; prawie cały kod to jedna funkcja `async function boot()` (kontekst każdego hunka = `boot`), więc podział idzie po **słowach kluczowych w zmienionych liniach** (reguła pierwszej zgodnej kategorii, ZAŁOŻENIE-K). Suma obszarów = 483 hunki (asercja OK). Klasy per obszar liczone tą samą heurystyką.\n")
    w("| Obszar | Temat / moduł docelowy | Hunki | +/− | L/U/P | Pierwsza linia (web) |")
    w("|---|---|---:|---|---|---:|")
    for name, e in areas.items():
        c = e["cls"]
        w(f"| {name} | {esc(e['topic'])} | {e['hunks']} | +{e['a']}/−{e['d']} | {c.get('LOGIKA',0)}/{c.get('UI',0)}/{c.get('PERF',0)} | {e['first']} |")
    w("")
    sL = sum(e["cls"].get("LOGIKA", 0) for e in areas.values())
    sU = sum(e["cls"].get("UI", 0) for e in areas.values())
    sP = sum(e["cls"].get("PERF", 0) for e in areas.values())
    w(f"Suma kolumn L/U/P tej tabeli: {sL}/{sU}/{sP} (= {sL + sU + sP} hunków). Wiersz `main.ts` w §3 ma {main_row[4].get('LOGIKA',0)}/{main_row[4].get('UI',0)}/{main_row[4].get('PERF',0)} (reguła ogólna §1). Rozbieżność UI ({main_row[4].get('UI',0)} vs {sU}) wynika z dwóch reguł opisanych w §1; prawdziwa liczba UI w `main.ts` leży między nimi i NIE jest ustalona (NIE_ZMIERZONO).\n")
    w("Uwaga: obszar `INNE-NIESKLASYFIKOWANE` = hunki bez trafienia słów kluczowych — wymagają ręcznego przeglądu przy portowaniu (NIE_ZMIERZONO co do treści).\n")

    w("## 5. Luki, założenia i NIE_ZMIERZONO\n")
    w("- **NIE_ZMIERZONO — ręczna klasyfikacja hunków:** 1085 hunków (w tym 483 w `main.ts`) nie zostało przeczytanych jeden po drugim; klasy są heurystyką (§1). Do potwierdzenia przy portowaniu każdego tematu.")
    w("- **NIE_ZMIERZONO — istnienie modułów Rust:** nazwy `*.rs` w kolumnie „Moduł” są docelowe; nie sprawdzono `rust-port/engine/src/domain/` (`parity-v2` nie był otwierany w tym temacie).")
    w("- **NIE_ZMIERZONO — zachowanie:** nie uruchomiono webu, testów ani harnessów (zakaz builda). Żadne twierdzenie o zachowaniu nie pochodzi z wykonania.")
    w("- **Ruchomy cel (dryf po pomiarze REPIN-DELTA-5):** REPIN-5 mierzył do `59868d84f`; baza tego pomiaru to `1da227738`. Pliki zmienione w tym przedziale (`gra/src` + `gra/data`):")
    for p, (a, d) in sorted(delta_ns.items()):
        where = "w zakresie 76 (już w §3/§4)" if not p.startswith("gra/src/game/") else "w zakresie 91 REPIN-5 — REPIN-5 jej nie widział, dryf do dopisania w tematach #2/#3/#6"
        w(f"  - `{p}` (+{a}/−{d}) — {where}")
    w("- **Pliki binarne:** 13 × `.mp3` w `gra/src/audio/utwory/dyplomacja/_civ/*` (`-	-` w numstat) — asset dla P7, bez logiki.")
    w("- **Wiki:** `gra/src/data/wikiBundle.json` (1 hunk, DANE) — dane pomocy/wiki, poza silnikiem.\n")

    w("## 6. Wnioski (ZAŁOŻENIA do potwierdzenia przez orkiestratora)\n")
    w(f"1. Zakres 76 plików to **{tot['hunks']} hunków, +{tot['a']}/−{tot['d']}** — większy niż zakres 91 plików `gra/src/game`+`gra/data` (8481/904). Nie porównywano z `parity-v2` ani z pinami UI/RENDER (NIE_ZMIERZONO).")
    w("2. Najwięcej logiki w `main.ts` (obszary §4) — głównie oblężenie/bitwa (#7), auto-ulepszenia (#3), armia (#6), dyplomacja/wojna (#4/#5). Hunki `main.ts` wywołują funkcje z `gra/src/game/` zmierzone w REPIN-5 — **nie sumować** obu zakresów bez deduplikacji po funkcji (NIE_ZMIERZONO, czy się pokrywają).")
    w("3. `gra/src/battle/*`, `gra/src/map/*`, `gra/src/units/setup.ts` to logika poza `gra/src/game/` (wcześniej nieopisana): kandydaci na nowe tematy NOWY-8 (mapgen/klastry, P6.M) i rozszerzenie #7 (bitwa/`siegeWall`).")
    w("4. Dane (`DANE`) poza `gra/data/` są jednym plikiem `.json` (wiki) i jednym `.ts` loaderem parametrów mapy — brak zmian kształtu, który łamałby loader P3.")
    w("5. Propozycja: po tym pomiarze orkiestrator decyduje, czy `main.ts` rozbić na 4–6 tematów (zamiast jednego „REPIN-MAIN”) — dispatch tego nie rozstrzyga.")
    return "\n".join(L) + "\n"


if __name__ == "__main__":
    main()
