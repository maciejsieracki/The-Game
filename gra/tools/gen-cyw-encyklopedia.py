#!/usr/bin/env python3
"""Generate docs/encyklopedia/cywilizacje/{id}.md for 9 active civ types (rev. D)."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(ROOT, "docs", "encyklopedia", "cywilizacje")

ACTIVE = [
    "grecy", "rzymianie", "chinczycy", "inkowie", "zulusi",
    "egipt", "sumer", "celtowie", "germanie",
]

EPOKI_LABEL = {"kamien": "Kamień", "braz": "Brąz", "zelazo": "Żelazo"}


def pct(v):
    if v == 0:
        return None
    sign = "+" if v > 0 else ""
    return f"{sign}{int(round(v * 100))}%"


def bonus_lines(civ, params):
    lines = []
    for b in civ.get("bonusy", []):
        lines.append(f"- {b['opis']}")
    # matrix highlights
    highlights = []
    mapping = [
        ("walka_obrona_piechota", "Obrona piechoty"),
        ("walka_atak_piechota", "Atak piechoty"),
        ("walka_pancerz_piechota", "Pancerz piechoty"),
        ("walka_dystans_lukownicy", "Atak dystansowy łuczników"),
        ("walka_uderzenie_kawaleria", "Uderzenie kawalerii"),
        ("walka_uderzenie_piechota", "Uderzenie piechoty"),
        ("walka_atak_piechota_teren_las", "Atak piechoty w lesie"),
        ("walka_atak_piechota_runda_szarzy", "Atak piechoty w szarży"),
        ("walka_hp_piechota", "Wytrzymałość piechoty"),
        ("walka_hp_rydwany", "Wytrzymałość rydwanów"),
        ("walka_ruch_bitwa_proc", "Ruch w bitwie"),
        ("eko_nauka_proc", "Nauka"),
        ("eko_pieniadz_proc", "Złoto"),
        ("eko_handel_brutto_proc", "Handel"),
        ("prod_koszt_budynku_proc", "Koszt budynków (mnożnik)"),
        ("mp_regen_proc", "Odnowa poboru"),
        ("lud_wzrost_proc", "Wzrost ludności"),
    ]
    for key, label in mapping:
        v = params.get(key, 0)
        p = pct(v)
        if p:
            highlights.append(f"- **{label}:** {p}")
    if highlights and not lines:
        lines = highlights
    return lines


def wiki_s(civ):
    name = civ["Cywilizacja"]
    styl = civ.get("Styl / charakter", "")
    unit = civ.get("Jednostka specjalna", "")
    return (
        f"**{name}** — {styl}. Jednostka unikalna: **{unit}**. "
        f"Religia: {civ.get('Religia', '—')}."
    )


def wiki_m(civ, params, matrix_row):
    name = civ["Cywilizacja"]
    tid = civ["typCywilizacji"]
    epoki = ", ".join(EPOKI_LABEL.get(e, e) for e in civ.get("epokiStartowe", []))
    klastr = ", ".join(civ.get("nazwyKlastra", [])[:5])
    if len(civ.get("nazwyKlastra", [])) > 5:
        klastr += "…"
    handel = civ.get("mnoznikHandelPieniadz", matrix_row.get("params", {}).get("meta_mnoznik_waluta", "—"))

    lines = [
        f"**{name}** to typ cywilizacji dostępny w wersji 1.0. Charakter: *{civ.get('Styl / charakter', '')}*.",
        "",
        f"**Epoki startowe w kreatorze:** {epoki}.",
        f"**Jednostka specjalna:** {civ.get('Jednostka specjalna', '—')}.",
        f"**Religia państwa:** {civ.get('Religia', '—')}.",
        f"**Przykładowe miasta w klastrze:** {klastr}.",
        "",
        "**Bonus startowy:** " + civ.get("Bonus startowy", "—") + ".",
        "",
        "**Trzy linie bonusów (macierz):**",
    ]
    bl = bonus_lines(civ, params)
    lines.extend(bl if bl else ["- Szczegóły w `civs.json` / `civ-matrix.json`."])
    minus = civ.get("Bonusy/minusy (do dopracowania)")
    if minus:
        lines.extend(["", f"**Słabsza strona (balans):** {minus}."])
    ai_ag = params.get("ai_agresywnosc", 5)
    lines.extend([
        "",
        f"**Profil AI (skala 0–9):** agresja {ai_ag}/9 — "
        + ("wysoka" if ai_ag >= 7 else "umiarkowana" if ai_ag >= 4 else "niska") + ".",
        "",
        "**Strategia dla gracza:** dopasuj rozwój do mocnych stron typu — "
        "handlowe typy buduj porty i suwak złota; wojskowe — wczesną armię i podbój miast-państw w klastrze.",
        "",
        "**Powiązane hasła:** [[Klaster miast-państw]] · [[Jednostki unikalne]] · "
        f"[[{civ.get('Jednostka specjalna', '').split('(')[0].strip()}]]",
    ])
    return "\n".join(lines)


def render(civ, matrix_row):
    tid = civ["typCywilizacji"]
    params = matrix_row.get("params", {})
    md = f"""# {civ["Cywilizacja"]}

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `{tid}` |
| **tytuł** | {civ["Cywilizacja"]} |
| **kategoria** | Cywilizacje |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/13-cywilizacje.md` §82–86 |
| **json_ref** | `civs.json`, `civ-matrix.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

{wiki_s(civ)}

---

## Wiki‑M

{wiki_m(civ, params, matrix_row)}

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/13-cywilizacje.md`

---

## Wzory

Mnożnik handlu/waluty: **{civ.get("mnoznikHandelPieniadz", "—")}** (meta macierzy).

---

## Historia / decyzje

Wygenerowano z danych gry (rev. D, 2026-07-03).
"""
    return md


def main():
    with open(os.path.join(ROOT, "gra", "data", "civs.json"), encoding="utf-8") as f:
        civs = {c["typCywilizacji"]: c for c in json.load(f)["cywilizacje"]}
    # sumerowie alias
    if "sumer" in civs:
        pass
    elif "sumerowie" in {c["typCywilizacji"]: c for c in json.load(open(os.path.join(ROOT, "gra", "data", "civs.json"), encoding="utf-8"))["cywilizacje"]}:
        pass
    with open(os.path.join(ROOT, "gra", "data", "civ-matrix.json"), encoding="utf-8") as f:
        matrix = {c["typCywilizacji"]: c for c in json.load(f)["cywilizacje"]}

    os.makedirs(OUT_DIR, exist_ok=True)
    for tid in ACTIVE:
        civ = civs.get(tid)
        if not civ and tid == "sumer":
            civ = next((c for c in json.load(open(os.path.join(ROOT, "gra", "data", "civs.json"), encoding="utf-8"))["cywilizacje"] if c["typCywilizacji"] == "sumer"), None)
        if not civ:
            print(f"SKIP {tid}: brak w civs.json")
            continue
        mrow = matrix.get(tid, {})
        path = os.path.join(OUT_DIR, f"{tid}.md")
        with open(path, "w", encoding="utf-8") as f:
            f.write(render(civ, mrow))
        print(f"OK {path}")


if __name__ == "__main__":
    main()
