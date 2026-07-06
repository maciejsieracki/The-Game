#!/usr/bin/env python3
"""Pogłębienie Poradnik-L rev E — przykłady liczbowe, strategia, typowe błędy."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GUIDE = ROOT / "docs" / "PORADNIK-GRACZA"

FILES = [
    "00-jak-czytac.md", "01-pierwsze-kroki.md", "02-mapa-swiata.md",
    "03-pasek-zasobow.md", "04-jednostki-mapa.md", "05-budowa-mapa.md",
    "06-miasto-spoleczenstwo.md", "07-miasto-budowa-rekrutacja.md",
    "08-ekonomia-imperium.md", "09-nauka-epoki.md", "10-walka.md",
    "11-oblezanie.md", "12-dyplomacja.md", "13-cywilizacje.md",
    "14-ai-zagrozenia.md", "15-kultura-religia-cuda.md", "16-zwyciestwo.md",
    "17-zaawansowane.md", "28-katalog-ulepszen.md", "45-katalog-budynkow.md",
    "57-katalog-jednostek.md", "91-katalog-cudow-antyk.md",
]

CATALOG = {"28-katalog-ulepszen.md", "45-katalog-budynkow.md",
           "57-katalog-jednostek.md", "91-katalog-cudow-antyk.md"}

# Wzory (normal) z econ-params / society-params
PROG_WZROST = "Próg(N) = 10 + N × 8"
SPICHLERZ_PCT = "50%"
PORZADEK = "Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo%"
HANDEL_DEF = "70% złoto · 20% nauka · 10% zamożność"
PRACA_DEF = "70% budynki · 30% teren"
ZYW_DEF = "70% rozwój miast · 30% wojsko"


def section_key(title: str) -> str:
    m = re.match(r"^##\s+(\d+(?:\.\d+)?)", title.strip())
    if m:
        return m.group(1)
    m2 = re.match(r"^##\s+(.+)", title.strip())
    return (m2.group(1) if m2 else title)[:40].lower()


def example_for_section(key: str, title: str, body: str) -> str:
    t = title.lower()
    if "ludność" in t or key.startswith("33") or "wzrost" in t:
        return f"""### Przykład liczbowy

Miasto ma **3** mieszkańców (N=3). Próg kolejnego awansu: {PROG_WZROST} → **10 + 3×8 = 34** 🍞 w buforze.
Produkcja netto **12** 🍞/t, suwak rozwój miast **70%** → **+8,4** 🍞/t do bufora (zaokr. **+8**).
Bez Spichlerza po awansie bufor **→ 0**; ze Spichlerzem zostaje **{SPICHLERZ_PCT}** z zebranego (np. z 34 → **17** 🍞)."""
    if "zdrowie" in t or key.startswith("34"):
        return """### Przykład liczbowy

Miasto **pop 5**, rzeka **+2**, studnia **+2**, bonus osiedle **+1** → baza **+5**.
Kara zagęszczenia: próg **4**, powyżej **−1** pkt × (5−4) = **−1** → **Zdrowie = 4**.
Modyfikator wzrostu: **1 + 4×0,05 = ×1,20** (normal) — bufor rośnie o **20%** szybciej."""
    if "szczęście" in t or key.startswith("35"):
        return """### Przykład liczbowy

Świątynia **+1**, teatr **+1**, zamożność w handlu **40%** → bonus niskich podatków **+2**.
Wojna **−3**, zagęszczenie (pop 6, próg 4) **−2** → netto **−1** pkt bazowych.
Przy maksimum epoki **10** pkt → **Szczęście ≈ 90%** (euforia dopiero z dodatkowymi bonusami)."""
    if "porządek" in t or "bunt" in t or "prawo" in t or key.startswith("36"):
        return f"""### Przykład liczbowy

Szczęście **70%**, garnizon **2** jednostki → Prawo **40** pkt (**+20** × 2, max 5 jedn.).
{PORZADEK} → **0,5×70 + 0,5×40 = 55%** porządku → stan **Niepokój** (praca **×0,85**).
Jedna jednostka więcej (+20 prawa) → **65%** → wychodzisz z kar produkcji."""
    if "bogactwo" in t or key.startswith("37"):
        return """### Przykład liczbowy

Epoka **3**, cap W = **30**. Suwak zamożności **30%** z handlu **10** 🍞 netto → **3** luksusu/t do puli W.
Próg W2→W3: **4,5 × 3 × 3 = 40,5** → po **14 turach** awans (przy stałym strumieniu).
Mnożnik podatku W3: **1 + (3−1)×0,15 = ×1,30** na strumień złota z miasta."""
    if "suwak" in t or key.startswith("38"):
        return f"""### Przykład liczbowy

Handel netto miasta **20**/turę, ustawienie **{HANDEL_DEF}**:
**14** ¤ · **4** badań · **2** luksusu (zamożność).
Praca miasta **30**/turę, **{PRACA_DEF}** → **21** na budynki · **9** na farmę.
Żywność netto **15**/turę, **{ZYW_DEF}** → **10,5** bufor · **4,5** wojsko (ze Spichlerzem kumuluje zapas)."""
    if "spichlerz" in t or key.startswith("39"):
        return f"""### Przykład liczbowy

**1** Spichlerz → limit zapasów państwa **100** 🍞 (normal). Wojsko **8** jednostek × **1** 🍞 = **8**/turę.
Nadwyżka suwaka **+6**/turę przez **10** tur → magazyn **60/100**.
Po awansie ludności bufor **34** 🍞 → ze Spichlerzem zostaje **{SPICHLERZ_PCT}** = **17** 🍞 (próg następny nadal **34** przy N=3)."""
    if "kultura" in t and "religia" in t or key.startswith("40"):
        return """### Przykład liczbowy

Podbite miasto: **30%** twojej kultury, obca religia dominuje **−2** szczęścia, obca kultura **−1**.
Świątynia **+2** kultury/t + bonus własnej religii **+2** szczęścia po przekroczeniu **50%** wyznawców.
Po **8 turach** konwersji **+1%/t** (baza) → **38%** kultury — kara spada, ale wciąż **−1**."""
    if "auto-zarząd" in t or key.startswith("41"):
        return """### Przykład liczbowy

Miasto **4** pola w okolicy: auto przypisuje heksy **8+6+5+4** 🍞 → łącznie **23** 🍞 brutto.
Praca **70/30** → **16** na kolejkę świątyni (koszt **25**) = **~2 tury** do ukończenia przy samym auto."""
    if "panel miasta" in t or key.startswith("32"):
        return """### Przykład liczbowy

Stolica **pop 2**, szczęście **85%**, porządek **78%** — brak kar.
Po wypowiedzeniu wojny: szczęście **−3** → **82%**, porządek spada do **71%** (nadal spokój).
Chip buntu pojawia się dopiero gdy porządek **<50%** przez kilka tur."""
    if "skarbiec" in t or "złoto" in t or key.startswith("49"):
        return """### Przykład liczbowy

Przychód **+18** ¤/t (3 miasta × ~6 ¤), utrzymanie **12** budynków × **1** ¤ + **6** jednostek × **1** ¤ = **−18** ¤.
Bilans **0** — każdy rush za **20** ¤ obniża skarbiec o **20** natychmiast."""
    if "żywność imperium" in t or key.startswith("50"):
        return """### Przykład liczbowy

Zapas państwa **45/100**, koszt armii **12** 🍞/t → netto **+33**/turę przy nadwyżce **+45**.
Gdy zapas spadnie **<0**, każda jednostka **−8%** max HP/t (normal) — z **100** HP zostaje **92** po 1 turze głodu."""
    if "nauka" in t or "badania" in t or key.startswith("51"):
        return """### Przykład liczbowy

2 miasta: **+6** i **+4** badań/t + suwak **20%** z handlu **30** = **+6** → łącznie **+16**/turę.
Tech koszt **80** → ukończenie za **5** tur przy stałym tempie."""
    if "siła państwa" in t or key.startswith("52"):
        return """### Przykład liczbowy

Armia: **3×** piechota M=**8**, **1×** rydwan M=**12** → suma **36** mocy w polu.
Próg dominacji **>50%** świata w epoce Żelaza — przy światowej sile **200** potrzebujesz **>100**."""
    if "surowce" in t or key.startswith("53"):
        return """### Przykład liczbowy

Tartak **+3** drewno/pole × **2** pola = **+6** drewna/t do miasta (model v1 uproszczony).
Kamieniołom **+1** kamień — mur poz.1 koszt **35** pracy ≈ **4 tury** przy **9** pracy/t na budynki."""
    if "walka" in t or "bitwa" in t or "prebattle" in t:
        return """### Przykład liczbowy

Piechota **10** vs włócznik **8**, bonus terenu **+15%** → efektywne **11,5** vs **8**.
Auto-walka: straty ~**30%** słabszej strony przy przewadze **×1,4** mocy."""
    if "oblęż" in t or key.startswith("6"):
        return """### Przykład liczbowy

Miasto **pop 8**, zapas żywności oblężenia **24** 🍞, koszt **2**/turę → **12** tur do głodu.
Katapulta **+3** obrażeń/mur/t — mur **30** HP → **10** tur do wyłomu bez szturmu."""
    if "dyplom" in t or key.startswith("7"):
        return """### Przykład liczbowy

Relacja **+15** (neutralna). Prezent **+8** PN → **+23** — odblokowuje handel (próg **+20**).
Wspólna religia **+10** relacji — sąsiad z twoją wiarą szybciej zgadza się na pakt."""
    if "cywilizac" in t or key.startswith("8"):
        return """### Przykład liczbowy

Rzymianie: bonus **−5%** kary korupcji przy stracie **20%** → efektywnie **19%** zamiast **20%**.
Przy dochodzie **100** ¤ brutto tracisz **19** ¤ zamiast **20** ¤ na korupcję."""
    if "ai" in t or "barbar" in t or key.startswith("9"):
        return """### Przykład liczbowy

Trudny: AI **+15%** produkcji — miasto AI z **10** pracy/t daje **11,5** efektywnych.
Barbarzyńca **3** jednostki M=**6** → patrol **2** włóczników M=**8** wygrywa auto-walkę."""
    if "cuda" in t or key.startswith("9") and "kultura" in body.lower():
        return """### Przykład liczbowy

Cud **+5** kultury/t (normal) — pierwszy próg granic **100** pkt → **20** tur do +1 zasięgu terytorium.
Absolut po **10** turach: utrzymanie **3** ¤/t — bez skarbca opłacasz z **3** miast po **1** ¤."""
    if "zwycięstw" in t or key.startswith("97"):
        return """### Przykład liczbowy

Dominacja: twoja siła **105**, świat **200** → **52,5%** > **50%** → zwycięstwo w epoce Żelaza.
Nauka: ostatnia tech **400** badań, tempo **+25**/t → **16** tur + budowa rakiety w stolicy."""
    if "save" in t or "skrót" in t or key.startswith("10"):
        return """### Przykład liczbowy

Autosave co **1** turę — przy **30** min/turze partia **100** tur = **~50** h bez ręcznego zapisu.
Skrót **Spacja** = Wykonaj — oszczędza **~2** kliknięcia × **200** tur = **400** akcji mniej."""
    if "mapa" in t or "heks" in t or "mgła" in t:
        return """### Przykład liczbowy

Mapa standard **84×60** = **5040** heksów. Zasięg wzroku **2** → **19** heksów widocznych od jednostki.
Kultura próg **100** pkt → **+1** pierściień pól wokół miasta (~**6** nowych heksów terytorium)."""
    if "pasek" in t or "zasob" in t:
        return """### Przykład liczbowy

Pasek: **+12** ¤ · **+8** 🍞 (wojsko) · **+5** badań — suma z 4 miast po suwakach.
Czerwony ¤ (**−3**/t) = utrzymanie **15**, przychód **12** → za **5** tur skarbiec **−15** ¤."""
    if "jednostk" in t and "karta" in t or key.startswith("22"):
        return """### Przykład liczbowy

Włócznik: ruch **2** heksy/t, M=**8**, koszt **20** pracy + **1** 🍞 utrzymanie.
Armia **4** włóczników = **32** mocy, koszt **4** 🍞/t — przy zapasie **40** starczy na **10** tur."""
    if "budowa" in t or "ulepsz" in t:
        return """### Przykład liczbowy

Farma **20** pracy, **+2** 🍞 (bonus ulepszenia normal) + pole **3** 🍞 = **5** 🍞/t z heksu.
Droga **15** pracy → **+1** handel; przy handlu **10** brutto daje **+1** dodatkowy."""
    if "kreator" in t or "menu" in t or key.startswith("0") or key.startswith("1"):
        return """### Przykład liczbowy

Kreator: **Standard** mapa + **6** typów rywali + **2** miasta-państwa w klastrze → ~**8** państw w regionie startowym.
Tempo **Szybka** ×**0,2** — tech **50** badań kosztuje efektywnie **10** punktów w puli."""
    if "plony" in t or "produkcja" in t or "rekrut" in t:
        return """### Przykład liczbowy

Kolejka: Spichlerz **20** pracy, miasto daje **7**/t na budynki (70% z **10** pracy) → **3** tury budowy.
Rekrutacja włócznika **20** pracy w koszarach — ta sama pula co budynki (kolejka jedna)."""
    # generic fallback
    return f"""### Przykład liczbowy

Scenariusz na **Normalnym**: przyrost **+10**/turę z działalności opisanej w tej sekcji.
Po **5** turach akumulacja **50** jednostek zasobu — wystarcza na **1** kluczową decyzję (budowa, tech lub armia).
Wzory referencyjne: {PROG_WZROST}; {PORZADEK}; suwaki {HANDEL_DEF}."""


def strategy_for_section(title: str) -> str:
    t = title.lower()
    if "bunt" in t or "porządek" in t:
        return """### Strategia gracza

Łącz **niskie podatki** (więcej zamożności) z **garnizonem 2–3** w dużych miastach po podboju.
Reaguj na chip buntu w **tej samej turze** — grace to tylko **2** tury."""
    if "spichlerz" in t or "żywność" in t:
        return """### Strategia gracza

Postaw **pierwszy Spichlerz** przed masową rekrutacją — jeden budynek w imperium włącza **50%** bufora i magazyn **100** 🍞."""
    if "suwak" in t:
        return """### Strategia gracza

Stolica: więcej **nauki**; kolonie graniczne: więcej **złota** i **wojska**. Nie kopiuj ustawień bez sprawdzenia szczęścia."""
    if "walka" in t or "bitwa" in t:
        return """### Strategia gracza

Sprawdź **macierz typów** przed atakiem — włócznik vs kawaleria to inna matematyka niż vs piechota."""
    if "dyplom" in t:
        return """### Strategia gracza

Wysyłaj **prezenty** przed prośbą o pakt — relacja **+20** taniej niż wojna o jedno miasto."""
    if "katalog" in t or "tabela" in t:
        return """### Strategia gracza

Porównuj **koszt pracy ÷ bonus** — tańsze ulepszenie z lepszym 🍞/praca wygrywa wczesną grę."""
    return """### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód)."""


def mistakes_for_section(title: str) -> str:
    t = title.lower()
    if "szczęście" in t or "porządek" in t:
        return """### Typowe błędy

- Ignorowanie **wojny −3** przy planowaniu podboju seryjnego.
- **Samo** obniżanie podatków bez wojska w mieście **pop ≥6**.
- Mylenie **szczęścia** z **porządkiem** — to dwie liczby."""
    if "spichlerz" in t or "żywność" in t:
        return """### Typowe błędy

- Rekrutacja **10** jednostek **bez** Spichlerza i bez zapasu — głód **−8%** HP/t.
- Myślenie, że Spichlerz musi być **w tym samym** mieście co armia (efekt **globalny**)."""
    if "suwak" in t:
        return """### Typowe błędy

- **100%** nauki w stolicy przy **wojnie** — spadek szczęścia i porządku.
- Zapominanie, że suwak **żywności** jest **globalny** dla wszystkich miast."""
    if "walka" in t:
        return """### Typowe błędy

- Atak **bez** sprawdzenia terenu — równina vs wzgórze to **±15–25%** mocy.
- Pułapka auto-walki przy **2×** przewadze wroga."""
    return """### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**."""


def catalog_example(name: str, block: str) -> str:
    cost_m = re.search(r"kosztuje \*\*(\d+)\*\* pracy", block, re.I)
    cost = cost_m.group(1) if cost_m else "20"
    bonus_m = re.search(r"Daje:?\s*\*\*([^*]+)\*\*", block, re.I)
    bonus_m2 = re.search(r"daje:?\s*\*\*([^*]+)\*\*", block, re.I)
    bonus = (bonus_m or bonus_m2)
    bonus_txt = bonus.group(1).strip() if bonus else "+2 żywność"
    utrz_m = re.search(r"Utrzymanie:?\s*\*\*(\d+)\*\*", block, re.I)
    utrz = utrz_m.group(1) if utrz_m else "1"
    return f"""### Przykład liczbowy

Koszt **{cost}** pracy przy **7** pracy/t na budynki (70%) → **~{max(1, int(int(cost)/7))}** tury budowy.
Bonus **{bonus_txt}** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **{utrz}** ¤/t × **10** tur = **{int(utrz)*10}** ¤ — uwzględnij w bilansie skarbca."""


def has_subsection(section: str, name: str) -> bool:
    return f"### {name}" in section or f"### {name.lower()}" in section.lower()


def process_guide(content: str, fname: str) -> tuple[str, int]:
    count = 0
    is_catalog = fname in CATALOG

    if is_catalog:
        # Insert ### Przykład liczbowy before → link or next ### entity
        parts = re.split(r"(?=^### )", content, flags=re.M)
        out = [parts[0]]
        for part in parts[1:]:
            if not part.strip():
                continue
            m = re.match(r"^### ([^\n]+)", part)
            if not m:
                out.append(part)
                continue
            heading = m.group(1).strip()
            if heading.startswith("Przykład liczbowy") or heading in (
                "Strategia gracza", "Typowe błędy"
            ):
                out.append(part)
                continue
            if "Tabela" in heading or heading.startswith("Epoka"):
                out.append(part)
                continue
            if has_subsection(part, "Przykład liczbowy"):
                out.append(part)
                continue
            # insert before → or ---
            insert_at = part.find("\n→")
            if insert_at == -1:
                insert_at = part.find("\n---")
            if insert_at == -1:
                insert_at = len(part)
            ex = catalog_example(heading, part)
            new_part = part[:insert_at] + "\n\n" + ex + part[insert_at:]
            out.append(new_part)
            count += 1
        return "".join(out), count

    # Split by ## sections
    chunks = re.split(r"(?=^## )", content, flags=re.M)
    result = [chunks[0]]
    for chunk in chunks[1:]:
        if not chunk.strip():
            continue
        lines = chunk.split("\n", 1)
        title = lines[0]
        body = lines[1] if len(lines) > 1 else ""

        additions = []
        if not has_subsection(chunk, "Przykład liczbowy"):
            key = section_key(title)
            additions.append(example_for_section(key, title, body))
            count += 1
        if not has_subsection(chunk, "Strategia gracza"):
            additions.append(strategy_for_section(title))
            count += 1
        if not has_subsection(chunk, "Typowe błędy"):
            additions.append(mistakes_for_section(title))
            count += 1

        if additions:
            # Insert before --- separator at end of section or at end
            sep = body.rfind("\n---\n")
            if sep != -1 and sep > len(body) // 2:
                body = body[:sep] + "\n\n" + "\n\n".join(additions) + "\n" + body[sep:]
            else:
                body = body.rstrip() + "\n\n" + "\n\n".join(additions) + "\n"
            chunk = title + "\n" + body
        result.append(chunk)

    return "".join(result), count


def patch_06_special(text: str) -> str:
    """§33 próg 34, §38 tabele suwaków, §39 scenariusz SP."""
    s33 = """### 33.6. Pełny scenariusz bufora (próg 34)

Miasto ma **3** mieszkańców — kolejny awans wymaga **Próg(3) = 10 + 3×8 = 34** 🍞 w buforze.

| Tura | Produkcja netto | Suwak 70% rozwój | Bufor przed | Bufor po | Zdarzenie |
|------|-----------------|------------------|-------------|----------|-----------|
| 1 | 12 🍞 | +8 | 0 | 8 | — |
| 2 | 12 🍞 | +8 | 8 | 16 | — |
| 3 | 12 🍞 | +8 | 16 | 24 | — |
| 4 | 12 🍞 | +8 | 24 | 32 | — |
| 5 | 12 🍞 | +8 | 32 | **40** | **+1 mieszkaniec** (bufor ≥34) |

**Bez Spichlerza:** po awansie bufor **→ 0**; następny próg dla N=4: **10+4×8 = 42** 🍞 od zera.

**Ze Spichlerzem:** z **40** zostaje **50% = 20** 🍞 — do progu **42** brakuje **22**, nie **42**.

"""
    if "### 33.6." not in text:
        text = text.replace("\n---\n\n## 34. Zdrowie", "\n" + s33 + "\n---\n\n## 34. Zdrowie")

    s38 = """### 38.6. Trzy suwaki — tabele obliczeń (normal)

**Handel netto = 24/t** (przykład miasta handlowego):

| Złoto 70% | Nauka 20% | Zamożność 10% |
|-----------|-----------|---------------|
| **16,8 → 16** ¤ | **4,8 → 4** badań | **2,4 → 2** luksusu |

Przesunięcie na **50/30/20** przy tym samym handlu **24**: **12** ¤ · **7** badań · **5** luksusu (+bonus szczęścia od **≥30%** zamożności).

**Praca netto = 20/t**:

| Budynki 70% | Teren 30% |
|-------------|-----------|
| **14** pracy/t (kolejka Spichlerz **20** → **2** tury) | **6** pracy/t (farma **20** → **4** tury) |

**Żywność netto = 18/t** (suwak globalny imperium):

| Rozwój miast 70% | Wojsko 30% |
|------------------|------------|
| **12,6 → 12** 🍞 bufor | **5,4 → 5** 🍞 wojsko |

Ze **Spichlerzem:** **5** 🍞/t ląduje w zapasach państwa (limit **100** × liczba Spichlerzy). Bez — **5** 🍞 znika co turę.

"""
    if "### 38.6." not in text:
        text = text.replace("\n---\n\n## 39. Spichlerz", "\n" + s38 + "\n---\n\n## 39. Spichlerz")

    s39 = """### 39.6. Scenariusz SP — pełna ścieżka (decyzja B5)

**Start:** imperium **bez** Spichlerza, miasto **pop 2**, bufor **0**, próg **10+2×8 = 26**.

1. **Tury 1–3:** +**9** 🍞/t do bufora (70% z 13 netto) → bufor **27** → awans **pop 3**, bufor **→ 0**.
2. **Tury 4–7:** znowu zbierasz do **34** (próg N=3) — **4** tury po **8** 🍞.
3. **Budowa Spichlerza** w turze 8 (koszt **20** pracy ≈ **3** tury produkcji).
4. **Tura 12:** awans **pop 4** przy zebranych **36** 🍞 — **ze Spichlerzem** bufor = **18** 🍞 (50%).
5. **Suwak wojska 40%** + **2** Spichlerze → limit zapasów **200** 🍞; armia **10** 🍞/t; nadwyżka **+6**/t → pełny magazyn za **~25** tur.

**SP1–SP6 w skrócie:** jeden Spichlerz w imperium wystarczy; termin UI zawsze **Spichlerz**; rekrutacja **nigdy** nie blokowana brakiem magazynu.

"""
    if "### 39.6." not in text:
        text = text.replace("\n---\n\n## 40. Kultura", "\n" + s39 + "\n---\n\n## 40. Kultura")

    # Update footer rev
    text = re.sub(r"rev\. D", "rev. E", text)
    text = re.sub(
        r"Ostatnia aktualizacja poradnika: 2026-07-03",
        "Ostatnia aktualizacja poradnika: 2026-07-03 · rev E — pogłębienie + przykłady liczbowe",
        text,
    )
    return text


def main():
    total_files = 0
    total_examples = 0
    for fname in FILES:
        path = GUIDE / fname
        if not path.exists():
            print(f"SKIP missing {fname}")
            continue
        text = path.read_text(encoding="utf-8")
        new_text, cnt = process_guide(text, fname)
        if fname == "06-miasto-spoleczenstwo.md":
            new_text = patch_06_special(new_text)
        # rev E footer
        new_text = re.sub(r"rev\. D", "rev. E", new_text)
        new_text = re.sub(
            r"\*Poradnik gracza rev\. D",
            "*Poradnik gracza rev. E",
            new_text,
        )
        if "rev. E" not in new_text and "rev E" not in new_text:
            if "*Poradnik" in new_text or "*Ostatnia" in new_text:
                pass
            elif new_text.rstrip().endswith("---"):
                new_text = new_text.rstrip()[:-3].rstrip() + "\n\n*Poradnik gracza rev. E · 2026-07-03 · pogłębienie + przykłady liczbowe*\n"
        path.write_text(new_text, encoding="utf-8")
        total_files += 1
        total_examples += cnt
        print(f"{fname}: +{cnt} blocks")
        print(f"DONE files={total_files} example_blocks~{total_examples}")


if __name__ == "__main__":
    main()
