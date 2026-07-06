#!/usr/bin/env python3
"""Generate PORADNIK-GRACZA catalog files from JSON (rev. D)."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "gra" / "data"
OUT = ROOT / "docs" / "PORADNIK-GRACZA"
ENC_B = ROOT / "docs" / "encyklopedia" / "budynki"
ENC_U = ROOT / "docs" / "encyklopedia" / "jednostki"
ENC_I = ROOT / "docs" / "encyklopedia" / "ulepszenia"
ENC_W = ROOT / "docs" / "encyklopedia" / "cuda"

EPOKA_B = {1: "Kamień", 2: "Brąz", 3: "Żelazo", 4: "Średniowiecze", 5: "Późne średniowiecze"}
EPOKA_I = {1: "Kamień", 2: "Brąz", 3: "Żelazo"}
EPOKA_ORDER = ["Kamień", "Brąz", "Żelazo", "Średniowiecze", "Późne średniowiecze"]


def load_json(name):
    with open(DATA / name, encoding="utf-8") as f:
        return json.load(f)


def bonus_str(b):
    parts = []
    labels = {
        "zywnosc": "żywność",
        "praca": "praca",
        "pieniadz": "złoto",
        "nauka": "nauka",
        "kultura": "kultura",
        "zadowolenie": "szczęście",
        "obrona": "obrona",
        "kamien": "kamień",
        "drewno": "drewno",
        "handel": "handel",
    }
    for k, v in b.items():
        if v and k in labels:
            parts.append(f"+{v} {labels[k]}")
    return ", ".join(parts) if parts else "—"


def unit_slug_map():
    m = {}
    for p in ENC_U.glob("*.md"):
        text = p.read_text(encoding="utf-8")
        mid = re.search(r'\*\*id\*\* \| `([^`]+)`', text)
        title = re.search(r'\*\*tytuł\*\* \| (.+)', text)
        if mid:
            m[title.group(1).strip() if title else p.stem] = mid.group(1)
    return m


def match_unit_slug(name, slug_by_title):
    if name in slug_by_title:
        return slug_by_title[name]
    # fallback: scan encyclopedia titles
    for p in ENC_U.glob("*.md"):
        t = p.read_text(encoding="utf-8")
        if f"**tytuł** | {name}" in t or f"**tytuł** | {name}\n" in t:
            mid = re.search(r'\*\*id\*\* \| `([^`]+)`', t)
            if mid:
                return mid.group(1)
    return p.stem if (p := list(ENC_U.glob("*.md"))) else name.lower().replace(" ", "-")


def gen_buildings():
    buildings = load_json("buildings.json")
    lines = [
        "# Katalog budynków miasta (v1.0)",
        "",
        "> **Poradnik gracza (Pełny)** · Część VII §45 · dane: `gra/data/buildings.json`",
        "> Pełne karty Wiki: `docs/encyklopedia/budynki/` · spis: `docs/PORADNIK-GRACZA-SPIS-TRESCI.md`",
        "",
        "Budynki wznosisz w zakładce **Produkcja** panelu miasta. Koszt budowy to **praca** z puli imperium; utrzymanie — **złoto** co turę. Każdy budynek ma do **10 poziomów** — kolejny poziom droższy, ale daje większy przyrost.",
        "",
        "## Tabela wszystkich budynków (26)",
        "",
        "| Budynek | Kategoria | Epoka | Tech | Koszt (poz. 1) | Utrzymanie | Bonus poz. 1 | Wiki |",
        "|---------|-----------|-------|------|----------------|------------|--------------|------|",
    ]
    for b in buildings:
        ep = EPOKA_B.get(b["epokaWejscia"], str(b["epokaWejscia"]))
        tech = b.get("techUnlock") or "—"
        if tech == "":
            tech = "—"
        b1 = bonus_str(b["baza"])
        mnoz = b["baza"].get("mnoznik", 0)
        if mnoz:
            b1 += f" (+{mnoz}% mnożnik)" if b1 != "—" else f"+{mnoz}% mnożnik"
        link = f"[{b['nazwa']}](../encyklopedia/budynki/{b['id']}.md)"
        lines.append(
            f"| {b['nazwa']} | {b['kategoria']} | {ep} | {tech} | {b['kosztBudowy']} pracy | {b['utrzymanie']} ¤/t | {b1} | {link} |"
        )

    lines += ["", "---", ""]
    for b in buildings:
        ep = EPOKA_B.get(b["epokaWejscia"], str(b["epokaWejscia"]))
        b1 = bonus_str(b["baza"])
        pr = bonus_str(b["przyrost"])
        tech = b.get("techUnlock") or "od początku miasta"
        wym = b.get("wymagania") or "brak"
        uw = b.get("uwagi") or ""
        lines += [
            f"### {b['nazwa']}",
            "",
            f"**{b['nazwa']}** ({b['kategoria']}) odblokowuje się w epoce **{ep}**"
            + (f" po technologii **{b['techUnlock']}**." if b.get("techUnlock") else ".")
            + f" Pierwsze wzniesienie kosztuje **{b['kosztBudowy']}** pracy; każdy kolejny poziom +**{b['przyrostKosztu']}**."
            f" Utrzymanie: **{b['utrzymanie']}** ¤ na turę (rosnie o **{b['przyrostUtrzymania']}** per poziom).",
            "",
            f"Na poziomie 1 daje: **{b1}**. Każdy kolejny poziom dodaje: **{pr}**.",
        ]
        if wym and wym not in ("", "-"):
            lines.append(f"**Wymagania:** {wym}.")
        if uw:
            lines.append(f"**Uwaga:** {uw}")
        lines += [
            "",
            f"→ Pełna karta: [`docs/encyklopedia/budynki/{b['id']}.md`](../encyklopedia/budynki/{b['id']}.md)",
            "",
        ]
    lines += [
        "---",
        "",
        "*Wygenerowano z `buildings.json` · rev. D · 2026-07-03*",
    ]
    (OUT / "45-katalog-budynkow.md").write_text("\n".join(lines), encoding="utf-8")
    print("45-katalog-budynkow.md OK", len(buildings))


def gen_improvements():
    raw = load_json("terrain-improvements.json")
    items = [(k, v) for k, v in raw.items() if not k.startswith("_")]
    items.sort(key=lambda x: (x[1].get("epoka", 99), x[1]["nazwa"]))

    lines = [
        "# Katalog ulepszeń terenu (v1.0)",
        "",
        "> **Poradnik gracza (Pełny)** · Część V §28 · dane: `gra/data/terrain-improvements.json`",
        "> Pełne karty Wiki: `docs/encyklopedia/ulepszenia/`",
        "",
        "Ulepszenia stawiasz z lewego panelu mapy (**Budowa**) na heksach w **swoim** terytorium. Płacisz **pracą** — nie złotem. Bonusy trafiają do miasta, które **pracuje** na danym polu (zakładka **Okolica**).",
        "",
        "## Tabela wszystkich ulepszeń (17)",
        "",
        "| Ulepszenie | Epoka | Koszt pracy | Bonus | Teren | Tech | Wiki |",
        "|------------|-------|-------------|-------|-------|------|------|",
    ]
    for kid, imp in items:
        ep = EPOKA_I.get(imp.get("epoka"), str(imp.get("epoka", "?")))
        bonus = bonus_str(imp.get("bonus", {}))
        if imp.get("bonus_obrona_proc"):
            bonus = f"+{imp['bonus_obrona_proc']}% obrona (obóz)" if not bonus else bonus + f"; +{imp['bonus_obrona_proc']}% obrona (obóz)"
        tech = imp.get("tech") or "—"
        if tech == "-":
            tech = "—"
        teren = imp.get("teren", "—")
        koszt = imp.get("koszt_praca", "—")
        if imp.get("wycinka"):
            koszt = "0 (wycinka)"
        link = f"[{imp['nazwa']}](../encyklopedia/ulepszenia/{kid}.md)"
        lines.append(f"| {imp['nazwa']} | {ep} | {koszt} | {bonus or '—'} | {teren} | {tech} | {link} |")

    cats = [
        ("Żywność i hodowla", ["farma", "irygacja", "bydlo", "owce", "lama", "oboz_lowiecki", "lodzie_rybackie", "tarasy"]),
        ("Produkcja i surowce", ["tartak", "kamieniolom", "kopalnia", "glinianka", "warzelnia_soli", "wyrab"]),
        ("Infrastruktura i obrona", ["droga", "posterunek", "fort"]),
    ]
    lines += ["", "---", ""]
    for cat_name, keys in cats:
        lines.append(f"## {cat_name}")
        lines.append("")
        for kid, imp in items:
            if kid not in keys:
                continue
            ep = EPOKA_I.get(imp.get("epoka"), "?")
            bonus = bonus_str(imp.get("bonus", {}))
            war = imp.get("warunek", "")
            tech = imp.get("tech") or "brak"
            odbl = imp.get("odblokowuje") or ""
            lines += [
                f"### {imp['nazwa']}",
                "",
                f"**{imp['nazwa']}** (epoka **{EPOKA_I.get(imp.get('epoka'), ep)}**) kosztuje **{imp.get('koszt_praca', 0)}** pracy"
                + (f" i wymaga technologii **{imp['tech']}**." if imp.get("tech") and imp["tech"] != "-" else ".")
                + (f" Daje: **{bonus}**." if bonus else ""),
                f"Dozwolony teren: {imp.get('teren', '—')}.",
            ]
            if war:
                lines.append(f"**Warunek:** {war}")
            if odbl:
                lines.append(f"**Odblokowuje:** {odbl}")
            if imp.get("surowiecOdblokowany"):
                lines.append(f"**Surowiec:** odblokowuje dostęp do **{imp['surowiecOdblokowany']}** (model v1.0: tak/nie).")
            if imp.get("zasieg_terytorium"):
                lines.append(f"**Zasięg terytorium:** +{imp['zasieg_terytorium']} pól.")
            lines += [
                "",
                f"→ [`docs/encyklopedia/ulepszenia/{kid}.md`](../encyklopedia/ulepszenia/{kid}.md)",
                "",
            ]

    lines += ["---", "", "*Wygenerowano z `terrain-improvements.json` · rev. D · 2026-07-03*"]
    (OUT / "28-katalog-ulepszen.md").write_text("\n".join(lines), encoding="utf-8")
    print("28-katalog-ulepszen.md OK", len(items))


def unit_slug_for(name, slug_map):
    if name in slug_map:
        return slug_map[name]
    raise KeyError(f"Brak encyklopedii dla jednostki: {name}")


def gen_units():
    units = load_json("units.json")
    slug_map = {}
    for p in ENC_U.glob("*.md"):
        t = p.read_text(encoding="utf-8")
        mid = re.search(r'\*\*id\*\* \| `([^`]+)`', t)
        title_m = re.search(r'\*\*tytuł\*\* \| ([^\n|]+)', t)
        if mid and title_m:
            slug_map[title_m.group(1).strip()] = mid.group(1)
    missing = [u["Jednostka"] for u in units if u["Jednostka"] not in slug_map]
    if missing:
        raise SystemExit(f"Brak slugów encyklopedii: {missing}")

    by_epoka = {e: [] for e in EPOKA_ORDER}
    for u in units:
        ep = u.get("Epoka", "?")
        by_epoka.setdefault(ep, []).append(u)

    lines = [
        "# Katalog jednostek (v1.0)",
        "",
        "> **Poradnik gracza (Pełny)** · Część X + XIII · dane: `gra/data/units.json`",
        "> Pełne karty Wiki: `docs/encyklopedia/jednostki/` · rekrutacja: Część VII §47",
        "",
        f"W grze jest **{len(units)}** jednostek — standardowe (dla wielu cywilizacji), specjalne kulturowe i super-jednostki stolicy. Rekrutacja kosztuje **złoto** i **ludność**; utrzymanie — złoto i żywność co turę.",
        "",
        "## Skrót ról bojowych",
        "",
        "| Rola | Co robi |",
        "|------|---------|",
        "| Wręcz | Pierwsza linia, walka z bliska |",
        "| Dystans | Atak z bezpiecznej odległości — słaby w zwarciu |",
        "| Flanka | Szarża z boku, konnica i rydwany |",
        "| Wsparcie | Zwiadowca — widok, mała siła |",
        "| Morska | Walka na morzu |",
        "| Oblężnicza | Mur, brama, wieża — nie do walki polowej |",
        "",
        "## Tabela zbiorcza",
        "",
        "| Jednostka | Epoka | Rola | Koszt ¤ | Ludność | Tech | Klasa | Moc | Wiki |",
        "|-----------|-------|------|---------|---------|------|-------|-----|------|",
    ]
    for u in units:
        name = u["Jednostka"]
        slug = unit_slug_for(name, slug_map)
        tech = u.get("Tech") or "—"
        if tech == "-":
            tech = "—"
        koszt = u.get("Pieniądz (koszt)", 0)
        if u.get("Super-jednostka") == "TAK":
            koszt = "0 (super)"
        kult = u.get("Kultura") or "—"
        klasa = u.get("Klasa", "—")
        moc = u.get("fieldPower", "—")
        link = f"[{name}](../encyklopedia/jednostki/{slug}.md)"
        lines.append(
            f"| {name} | {u['Epoka']} | {u.get('Rola (linia)', '—')} | {koszt} | {u.get('Ludność', 1)} | {tech} | {klasa} | {moc} | {link} |"
        )

    lines += ["", "---", ""]
    for ep in EPOKA_ORDER:
        group = by_epoka.get(ep, [])
        if not group:
            continue
        lines += [f"## Epoka {ep} ({len(group)} jednostek)", ""]
        for u in group:
            name = u["Jednostka"]
            slug = unit_slug_for(name, slug_map)
            tech = u.get("Tech") or "epoka"
            if tech == "-":
                tech = "brak (poza epoką)"
            koszt = u.get("Pieniądz (koszt)", 0)
            utrz = u.get("Utrzymanie (Pieniądz/turę)", 0)
            ruch = u.get("Ruch", "—")
            rola = u.get("Rola (linia)", "—")
            typ = u.get("Typ", "—")
            kult = u.get("Kultura")
            klasa = u.get("Klasa", "Standardowa")
            moc = u.get("fieldPower", "—")
            super_j = u.get("Super-jednostka") == "TAK"
            para = (
                f"**{name}** — {rola.lower()}, typ **{typ}**. "
                f"Rekrutacja: **{koszt}** ¤ i **{u.get('Ludność', 1)}** mieszkańców"
                + (f"; technologia **{u['Tech']}**." if u.get("Tech") and u["Tech"] not in ("-", "—") else ".")
                + f" Utrzymanie **{utrz}** ¤/turę, **{u.get('żywność/turę', 1)}** żywności/turę. Ruch na mapie: **{ruch}** heksów."
            )
            if kult:
                para += f" Jednostka **{klasa.lower()}** cywilizacji **{kult}**."
            elif klasa == "Super" or super_j:
                para += " **Super-jednostka** stolicy (max 1, bezpłatna, odradza się po stracie)."
            else:
                para += f" Klasa: **{klasa}**."
            if moc != "—":
                para += f" Moc w polu: **{moc}**."
            uw = (u.get("Uwagi") or "").split("|")[0].strip()
            if uw and not uw.startswith("C4-Q1"):
                para += f" {uw}"
            lines += [f"### {name}", "", para, "", f"→ [`docs/encyklopedia/jednostki/{slug}.md`](../encyklopedia/jednostki/{slug}.md)", ""]

    lines += ["---", "", "*Wygenerowano z `units.json` · rev. D · 2026-07-03*"]
    (OUT / "57-katalog-jednostek.md").write_text("\n".join(lines), encoding="utf-8")
    print("57-katalog-jednostek.md OK", len(units))


TEREN_LABELS = {
    "pustynia": "pustynia",
    "rzeka_sasiad": "sąsiad rzeki",
    "rownina": "równina",
    "trudny_teren": "trudny teren",
    "wybrzeze": "wybrzeże",
    "wzgorze": "wzgórze",
    "tropiki": "tropiki",
    "przy_miescie": "przy mieście",
    "plaski_teren": "płaski teren",
    "laka": "łąka",
}

CIV_LABELS = {
    "egipt": "Egipt",
    "sumer": "Sumerowie",
    "babilonia": "Babilonia",
    "grecy": "Grecy",
    "hetyci": "Hetyci",
    "celtowie": "Celtowie",
    "harappa": "Harappa",
    "fenicjanie": "Fenicjanie",
    "germanie": "Germanie",
    "inkowie": "Inkowie",
    "chinczycy": "Chińczycy",
    "rzymianie": "Rzymianie",
    "asyria": "Asyria",
    "zulusi": "Zulusi",
    "slowianie": "Słowianie",
}


def format_yield(d, per_city=False):
    if not d:
        return ""
    base = bonus_str(d)
    if per_city and base:
        return f"{base}/turę × każde miasto"
    return base


def format_teren_bonus(teren_list):
    parts = []
    for t in teren_list or []:
        typ = TEREN_LABELS.get(t.get("typTerenu", ""), t.get("typTerenu", ""))
        y = bonus_str({k: v for k, v in t.items() if k not in ("typTerenu", "warunek")})
        war = t.get("warunek", "")
        if war == "hex_sasiad_rzeka":
            y += " (heks sąsiad rzeki)"
        elif war == "hex_sasiad_wybrzeze":
            y += " (heks sąsiad wybrzeża)"
        parts.append(f"{typ}: {y}")
    return "; ".join(parts) if parts else ""


def format_specjalne(spec):
    return [s.get("opis", s.get("typ", "")) for s in (spec or [])]


def wonder_access_label(w):
    d = w.get("dostep", "E")
    if d == "R":
        return "Wyścig (R) — max 1 na świat, wszyscy gracze"
    civs = w.get("cywilizacje") or []
    if len(civs) == 1:
        return f"Wyłączny (E) — tylko {CIV_LABELS.get(civs[0], civs[0])}"
    return "Wyłączny (E) — max 1 na świat"


def wonder_wiki_s(w):
    ep = EPOKA_I.get(w.get("epokaWejscia"), str(w.get("epokaWejscia")))
    tech = ", ".join(w.get("techUnlock") or ["—"])
    teren = ", ".join(TEREN_LABELS.get(t, t) for t in (w.get("wymagaTerenu") or []))
    miasto = format_yield((w.get("bonusy") or {}).get("miasto"), per_city=True)
    dostep = w.get("dostep", "E")
    typ = "wyścigowy" if dostep == "R" else "wyłączny"
    lines = [
        f"**{w['nazwa']}** — cud {typ}, epoka {ep}. Koszt **{w['kosztBudowy']}** pracy, utrzymanie **{w['utrzymanie']}** ¤/turę.",
        f"Wymaga: tech **{tech}**; teren: **{teren or '—'}**.",
    ]
    if miasto:
        lines.append(f"Bonus miejski (× każde miasto): {miasto}.")
    return " ".join(lines)


def wonder_wiki_m(w):
    b = w.get("bonusy") or {}
    miasto = format_yield(b.get("miasto"), per_city=True)
    hex_b = format_yield(b.get("hex"))
    teren = format_teren_bonus(b.get("teren"))
    spec = format_specjalne(b.get("specjalne"))
    ep = EPOKA_I.get(w.get("epokaWejscia"), str(w.get("epokaWejscia")))
    tech = ", ".join(w.get("techUnlock") or ["—"])
    teren_req = ", ".join(TEREN_LABELS.get(t, t) for t in (w.get("wymagaTerenu") or []))
    civs = ", ".join(CIV_LABELS.get(c, c) for c in (w.get("cywilizacje") or []))
    uw = w.get("uwagi") or w.get("nazwaAlt") or ""

    parts = [
        f"**Co robi:** {w['nazwa']} to cud epoki **{ep}** ({wonder_access_label(w)}). "
        f"Budujesz go na **heksie w terytorium** (nie w slocie miasta), po tech **{tech}**, na terenie: **{teren_req or 'dowolny własny heks'}**. "
        f"Koszt **{w['kosztBudowy']}** pracy; utrzymanie **{w['utrzymanie']}** ¤/turę. Bonusy miasta mnożą się × **każde** twoje miasto (kanon ×3 vs bazowy JSON).",
    ]
    if miasto:
        parts.append(f"Yield imperium: **{miasto}**.")
    if hex_b:
        parts.append(f"Bonus na heksie cudu: **{hex_b}**/turę.")
    if teren:
        parts.append(f"Bonus terenowy w terytorium: {teren}.")
    if spec:
        parts.append("Bonusy cywilizacji: " + "; ".join(spec) + ".")
    parts.append(
        f"**Kiedy budować:** planuj heks i tech wcześniej; typ **{w.get('dostep', 'E')}** — "
        + ("rywalizuj z całym światem o pierwszeństwo." if w.get("dostep") == "R" else "zablokuj rywali unikalny bonus.")
    )
    parts.append(
        "**Trade-off:** długa kolejka pracy vs armia/miasta; utrzymanie co turę. "
        f"Po absolut (koniec epoki 6) bonusy wygasają — zostaje ruina (+10 handlu turystyka). "
        "Cuda **nie** dodają siły państwa."
    )
    if uw:
        parts.append(f"**Historia:** {uw}")
    parts.append(
        "**Powiązane hasła:** Cuda świata · Kultura · Dyplomacja · [`91-katalog-cudow-antyk.md`](../PORADNIK-GRACZA/91-katalog-cudow-antyk.md)"
    )
    return "\n\n".join(parts)


def gen_wonders():
    data = load_json("wonders.json")
    wonders = data.get("cuda") or []
    ENC_W.mkdir(parents=True, exist_ok=True)

    for w in wonders:
        wid = w["id"]
        poradnik = "15-kultura-religia-cuda.md" if w.get("dostep") == "R" else "91-katalog-cudow-antyk.md"
        content = [
            f"# {w['nazwa']}",
            "",
            "## Metadane",
            "",
            "| Pole | Wartość |",
            "|------|---------|",
            f"| **id** | `{wid}` |",
            f"| **tytuł** | {w['nazwa']} |",
            f"| **kategoria** | Cuda — Antyk |",
            f"| **poradnik_ref** | `docs/PORADNIK-GRACZA/{poradnik}` |",
            f"| **json_ref** | `wonders.json` |",
            f"| **status_v1** | ✅ |",
            "",
            "---",
            "",
            "## Wiki‑S",
            "",
            wonder_wiki_s(w),
            "",
            "---",
            "",
            "## Wiki‑M",
            "",
            wonder_wiki_m(w),
            "",
            "---",
            "",
            "## Poradnik‑L",
            "",
            f"→ [`docs/PORADNIK-GRACZA/15-kultura-religia-cuda.md`](../PORADNIK-GRACZA/15-kultura-religia-cuda.md) · [`91-katalog-cudow-antyk.md`](../PORADNIK-GRACZA/91-katalog-cudow-antyk.md)",
            "",
            "---",
            "",
            "## Wzory",
            "",
            "Bonus miasta × każde miasto; absolut = epoka 6; po absolut utrzymanie 50%, turystyka +10 handlu.",
            "",
            "---",
            "",
            "## Historia / decyzje",
            "",
            "Wygenerowano z `wonders.json` (rev. D, 2026-07-03).",
            "",
        ]
        (ENC_W / f"{wid}.md").write_text("\n".join(content), encoding="utf-8")

    lines = [
        "# Katalog cudów Antyku (v1.0)",
        "",
        "> **Poradnik gracza (Pełny)** · Część XV §94–96 · dane: `gra/data/wonders.json`",
        "> Pełne karty Wiki: `docs/encyklopedia/cuda/` · mechanika: [`15-kultura-religia-cuda.md`](15-kultura-religia-cuda.md)",
        "",
        "W epoce Antyku (Kamień–Brąz–Żelazo) każda cywilizacja ma **cud wyłączny (E)** oraz dostęp do **trzech wyścigów (R)**: Wyrocznia (Kamień), Kamień Ha'amonga (Brąz), Brama wszystkich narodów (Żelazo). Cud stawiasz na **heksie w terytorium**; koszt to **praca**; utrzymanie — **złoto** co turę. Bonusy miasta działają **× każde miasto**. Po **absolut** (koniec epoki 6) efekty wygasają — zostaje ruina (+10 handlu).",
        "",
        "## Typy dostępu",
        "",
        "| Typ | Zasada |",
        "|-----|--------|",
        "| **E (wyłączny)** | Max **1 na cały świat**; tylko wskazane cywilizacje widzą cud w panelu |",
        "| **R (wyścig)** | Wszyscy 15 graczy mogą budować; wygrywa pierwszy ukończony; max 1 egzemplarz |",
        "",
        f"## Tabela wszystkich cudów Antyku ({len(wonders)})",
        "",
        "| Cud | Typ | Cywilizacja | Epoka | Tech | Koszt | Utrzymanie | Bonus miasta (× miasto) | Wiki |",
        "|-----|-----|-------------|-------|------|-------|------------|-------------------------|------|",
    ]
    for w in wonders:
        ep = EPOKA_I.get(w.get("epokaWejscia"), "?")
        tech = ", ".join(w.get("techUnlock") or ["—"])
        civs = w.get("cywilizacje") or []
        if w.get("dostep") == "R":
            civ_col = "wszyscy (15)"
        elif len(civs) == 1:
            civ_col = CIV_LABELS.get(civs[0], civs[0])
        else:
            civ_col = ", ".join(CIV_LABELS.get(c, c) for c in civs[:3]) + ("…" if len(civs) > 3 else "")
        miasto = format_yield((w.get("bonusy") or {}).get("miasto"), per_city=True) or "—"
        link = f"[{w['nazwa']}](../encyklopedia/cuda/{w['id']}.md)"
        lines.append(
            f"| {w['nazwa']} | {w.get('dostep', 'E')} | {civ_col} | {ep} | {tech} | {w['kosztBudowy']} pracy | {w['utrzymanie']} ¤ | {miasto} | {link} |"
        )

    lines += ["", "---", ""]
    e_wonders = [w for w in wonders if w.get("dostep") == "E"]
    r_wonders = [w for w in wonders if w.get("dostep") == "R"]
    lines += [
        f"## Cuda wyłączne (E) — {len(e_wonders)}",
        "",
        "Każda nacja ma jeden unikalny cud startowy (Chińczycy: dwa — Terakotowa armia + Pałac Weiyang). Pierwszy, który ukończy budowę, **blokuje** cud na świecie — pozostali nie widzą go w panelu.",
        "",
    ]
    for w in e_wonders:
        spec = "; ".join(format_specjalne((w.get("bonusy") or {}).get("specjalne"))[:2])
        lines += [
            f"### {w['nazwa']}",
            "",
            f"**{w['nazwa']}** — {CIV_LABELS.get((w.get('cywilizacje') or ['?'])[0], '?')}, epoka **{EPOKA_I.get(w.get('epokaWejscia'), '?')}**. "
            f"Tech: **{', '.join(w.get('techUnlock') or ['—'])}**; teren: **{', '.join(TEREN_LABELS.get(t, t) for t in (w.get('wymagaTerenu') or [])) or '—'}**. "
            f"Koszt **{w['kosztBudowy']}** pracy. {spec}",
            "",
            f"→ [`docs/encyklopedia/cuda/{w['id']}.md`](../encyklopedia/cuda/{w['id']}.md)",
            "",
        ]

    lines += [
        f"## Cuda wyścigowe (R) — {len(r_wonders)}",
        "",
        "Dokładnie **jeden** cud R na epokę Antyku. Wszyscy widzą postęp rywali — przyspiesz produkcję złotem lub pracą z najbliższego miasta.",
        "",
    ]
    for w in r_wonders:
        spec = "; ".join(format_specjalne((w.get("bonusy") or {}).get("specjalne"))[:2])
        lines += [
            f"### {w['nazwa']}",
            "",
            f"**{w['nazwa']}** — wyścig epoki **{EPOKA_I.get(w.get('epokaWejscia'), '?')}**. "
            f"Tech: **{', '.join(w.get('techUnlock') or ['—'])}**. {spec}",
            "",
            f"→ [`docs/encyklopedia/cuda/{w['id']}.md`](../encyklopedia/cuda/{w['id']}.md)",
            "",
        ]

    lines += ["---", "", "*Wygenerowano z `wonders.json` · rev. D · 2026-07-03*"]
    (OUT / "91-katalog-cudow-antyk.md").write_text("\n".join(lines), encoding="utf-8")
    print("91-katalog-cudow-antyk.md OK", len(wonders))
    print("encyklopedia/cuda OK", len(wonders))


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    gen_buildings()
    gen_improvements()
    gen_units()
    gen_wonders()
