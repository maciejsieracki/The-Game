#!/usr/bin/env python3
"""Porownanie 32 hasel technologii: wikiBundle.json (wiki) vs tech.json (JSON) na pinie edb8fb56.

Uruchomienie (dane czytane z pinu przez git, nie z working tree):
  python3 -I 02-skrypt-porownawczy.py > 02-wyniki.md

Wyjscie: tabela markdown, jeden wiersz na haslo, kazde pole z osobnym statusem OK/ROZJAZD.
"""
import json
import re
import subprocess

PIN = "edb8fb56"
WIKI_PATH = f"{PIN}:gra/src/data/wikiBundle.json"
TECH_PATH = f"{PIN}:gra/data/tech.json"


def git_show(path):
    return subprocess.run(["git", "show", path], check=True, capture_output=True,
                          text=True, cwd="/home/user/The-Game").stdout


def norm(s):
    s = (s or "").strip().lower()
    s = re.sub(r"^dostęp do\s+", "", s)
    return s


def tokens(s, seps):
    if s is None:
        return set()
    s = s.strip()
    if s in ("", "—", "-", "brak") or s.lower().startswith("brak "):
        return set()
    out = set()
    pattern = "|".join(re.escape(x) for x in seps)
    for part in re.split(pattern, s):
        p = norm(part)
        if p and p not in ("brak", "—"):
            out.add(p)
    return out


def wiki_field(md, label):
    m = re.search(r"\*\*" + re.escape(label) + r":\*\*\s*(.+)", md)
    return m.group(1).strip() if m else None


def main():
    wiki = json.loads(git_show(WIKI_PATH))
    tech = json.loads(git_show(TECH_PATH))
    tech_by_name = {x["Technologia"]: x for x in tech["technologie"]}
    entries = [e for e in wiki["encyklopedia"] if e["id"].startswith("technologie/")]

    print(f"<!-- pin {PIN}; wiki generated={wiki.get('generated')}; "
          f"tech.json technologie={len(tech['technologie'])}; wpisow wiki={len(entries)} -->")
    print("| # | slug | Technologia | Epoka/poziom | prereq | koszt wiki | koszt JSON | ratio | "
          "wym. budynek | dostęp surowca | budynki | jednostki | ulepszenia terenu | surowce | "
          "awans epoki | wym. ulepszenie | STATUS |")
    print("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|")

    summary = {"ZGODNE": [], "NIEZGODNE": [], "NIEDOPASOWANE": []}
    for i, e in enumerate(entries, 1):
        md = e["wikiM"].split("**Powiązane:**")[0]
        slug = e["slug"]
        # dopasowanie po tytule (wiki title == Technologia w JSON, z wyjatkiem zapisu)
        title = e["title"]
        j = tech_by_name.get(title)
        if j is None:
            summary["NIEDOPASOWANE"].append(slug)
            print(f"| {i} | {slug} | {title} | BRAK W JSON | | | | | | | | | | | | | | NIEDOPASOWANE |")
            continue
        mis = []  # rozjazdy pól

        # epoka + poziom
        ep_raw = wiki_field(md, "Epoka") or ""
        m = re.match(r"(\S+)\s*\(poziom (\d+)\)", ep_raw)
        w_epoka, w_poz = (m.group(1), int(m.group(2))) if m else (ep_raw, None)
        ep_ok = norm(w_epoka) == norm(j["Epoka"]) and w_poz == j["Poziom"]
        if not ep_ok:
            mis.append("epoka")
        ep_cell = f"{w_epoka} {w_poz} / {j['Epoka']} {j['Poziom']}"

        # prereq (sety, bez kolejnosci)
        w_pre = tokens(wiki_field(md, "Wymaga (prereq)"), [" + "])
        j_pre = tokens(j.get("Wymaga (prereq)"), [" + "])
        pre_ok = w_pre == j_pre
        if not pre_ok:
            mis.append("prereq")
        pre_cell = "OK" if pre_ok else f"ROZJAZD {sorted(w_pre)} vs {sorted(j_pre)}"

        # koszt
        kw = wiki_field(md, "Koszt nauki")
        mk = re.search(r"(\d+)", kw or "")
        w_koszt = int(mk.group(1)) if mk else None
        j_koszt = j["Koszt nauki"]
        koszt_ok = w_koszt == j_koszt
        if not koszt_ok:
            mis.append("koszt")
        ratio = f"{j_koszt / w_koszt:g}" if w_koszt else "?"
        koszt_cell = f"{w_koszt} vs {j_koszt}"

        # wymagany budynek
        w_wb = tokens(wiki_field(md, "Wymagany budynek"), [","])
        j_wb = tokens(j.get("wymagany budynek"), [","])
        wb_ok = w_wb == j_wb
        if not wb_ok:
            mis.append("wymagany budynek")
        wb_cell = "OK" if wb_ok else f"ROZJAZD {sorted(w_wb)} vs {sorted(j_wb)}"

        # dostep do surowca
        w_dz = tokens(wiki_field(md, "Dostęp do surowca"), [","])
        j_dz = tokens(j.get("Dostęp do surowca."), [","])
        dz_ok = w_dz == j_dz
        if not dz_ok:
            mis.append("dostęp do surowca")
        dz_cell = "OK" if dz_ok else f"ROZJAZD {sorted(w_dz)} vs {sorted(j_dz)}"

        # budynki i jednostki: JSON trzyma je w jednym polu, rozdzielone ';'
        j_budynki, j_jedn = set(), set()
        for part in (j.get("Odblokowuje budynek") or "").split(";"):
            part = part.strip()
            if not part:
                continue
            if part.lower().startswith("jednostki:"):
                j_jedn |= tokens(part.split(":", 1)[1], [","])
            else:
                j_budynki |= {norm(part)}
        w_budynki = tokens(wiki_field(md, "Budynki"), [","])
        w_jedn = tokens(wiki_field(md, "Jednostki"), [","])
        b_ok = w_budynki == j_budynki
        u_ok = w_jedn == j_jedn
        if not b_ok:
            mis.append("budynki")
        if not u_ok:
            mis.append("jednostki")
        b_cell = "OK" if b_ok else f"ROZJAZD {sorted(w_budynki)} vs {sorted(j_budynki)}"
        u_cell = "OK" if u_ok else f"ROZJAZD {len(w_jedn)} vs {len(j_jedn)}"

        # ulepszenia terenu
        w_ut = tokens(wiki_field(md, "Ulepszenia terenu"), [","])
        j_ut = tokens(j.get("Odblokowuje ulepszenie terenu"), [","])
        ut_ok = w_ut == j_ut
        if not ut_ok:
            mis.append("ulepszenia terenu")
        ut_cell = "OK" if ut_ok else f"ROZJAZD {sorted(w_ut)} vs {sorted(j_ut)}"

        # surowce
        w_sur = tokens(wiki_field(md, "Surowce"), [","])
        j_sur = tokens(j.get("Odblokowuje surowiec."), [","])
        sur_ok = w_sur == j_sur
        if not sur_ok:
            mis.append("surowce")
        sur_cell = "OK" if sur_ok else f"ROZJAZD {sorted(w_sur)} vs {sorted(j_sur)}"

        # awans epoki
        ma = re.search(r"epoki \*\*(\d+)\*\*", md)
        w_awans = int(ma.group(1)) if ma else None
        j_awans = j.get("awansDoEpoki")
        aw_ok = w_awans == j_awans
        if not aw_ok:
            mis.append("awansDoEpoki")
        aw_cell = "OK" if aw_ok else f"ROZJAZD wiki={w_awans} JSON={j_awans}"

        # wymagane ulepszenie (Zegluga: Tartak)
        w_wu = tokens(wiki_field(md, "Wymagane ulepszenie terenu"), [","])
        j_wu = tokens(j.get("wymagane ulepszenie"), [","])
        wu_ok = w_wu == j_wu
        if not wu_ok:
            mis.append("wymagane ulepszenie")
        wu_cell = "OK" if wu_ok else f"ROZJAZD {sorted(w_wu)} vs {sorted(j_wu)}"

        if mis:
            status = "NIEZGODNE (" + ", ".join(mis) + ")" if koszt_ok is False and len(mis) > 1 else \
                ("NIEZGODNE (" + ", ".join(mis) + ")" if mis != ["koszt"] else "NIEZGODNE (koszt)")
            summary["NIEZGODNE"].append(slug)
        else:
            status = "ZGODNE"
            summary["ZGODNE"].append(slug)

        print(f"| {i} | {slug} | {title} | {ep_cell} | {pre_cell} | {koszt_cell} | "
              f"{j_koszt} | {ratio} | {wb_cell} | {dz_cell} | {b_cell} | {u_cell} | {ut_cell} | "
              f"{sur_cell} | {aw_cell} | {wu_cell} | {status} |")

    print()
    print(f"<!-- PODSUMOWANIE: ZGODNE={len(summary['ZGODNE'])} {summary['ZGODNE']}; "
          f"NIEZGODNE={len(summary['NIEZGODNE'])}; NIEDOPASOWANE={summary['NIEDOPASOWANE']} -->")


if __name__ == "__main__":
    main()
