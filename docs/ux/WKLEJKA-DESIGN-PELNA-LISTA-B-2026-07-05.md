# WKLEJKA — pełna lista zleceń Design (sekcja B)

**Data:** 2026-07-05 · **Od:** Lane UI / MASTER · **Dla:** Maciej → wklej do czatu Claude Design  
**Źródło prawdy:** `dyspozycje/UI-RAPORT-DO-PRZODU-2026-07-05.md` §B  
**Repo:** https://github.com/maciejsieracki/The-Game (main)

---

## Skopiuj cały blok poniżej do czatu Design

```
START — PACZKA B · pełna lista zleceń (2026-07-05)

Lane UI czeka na deliverable. Maciej playtest ~23:05 — gameplay OK, wygląd FAIL na panelu heksu i budowy.
Czytaj przed pracą:
  docs/ux/claude-design/WYMIANA-UI-DESIGN.md  (queue_design + blocked_on_design)
  dyspozycje/UI-RAPORT-DO-PRZODU-2026-07-05.md  (§B)
  dyspozycje/UI-INVENTORY-DESIGN-vs-GRA.md

REGUŁY GLOBALNE:
  · ZERO emoji · styl 1E · spójność HUD Mapy layout + miasto W4
  · Zapis: brand-book/ + eksport/icons/ · każdy mockup = plik .dc.html (1E)
  · Po turze: DESIGN-do-UI_<temat>.md + MANIFEST.txt + git push docs/ux/claude-design/
  · Wpis w WYMIANA sekcja design + YAML status

══════════════════════════════════════════════════════════════
P0 — TERAZ (blokery playtestu Macieja)
══════════════════════════════════════════════════════════════

── B1 · A-08 — Tryb budowy ulepszeń (prawy panel mapy) ──
Problem: emoji 🌾🐄⛏️ · panel 240px · tekst wymagań nakłada się (Posterunek) · brak scroll hierarchy
Brief:  docs/ux/DESIGN-BRIEF-A08-ulepszenia-ikony-i-panel.md
Handoff: dyspozycje/_handoff/UI-do-DESIGN_A08-START-2026-07-03.md
Deliverable:
  1) SVG imp-* brakujące (~6–8): owce, lama, glinianka, obóz łowiecki, tarasy, warzelnia soli…
     + improvement-icon-map.json → brand-book/eksport/icons/improvements/
  2) The Game - A08 Tryb budowy ulepszen (1E).dc.html
     · banner góra + panel prawy · ikony SVG · tech lock max 2 linie · scroll
  ZIP: A08-ulepszenia-2026-07-05.zip
Playtest PRZED: gra-robocza/START.html → Budowa + prawy panel

── B2 · HEX-C1 — Panel kontekstu heksu (D17=A) ──
Problem: PLONY = litery Ż/P/H/D/K · MOŻLIWE ulepszenia plain text · brak mockupu C1
Brief:  docs/ux/DESIGN-ZLECENIE-HEX-CONTEXT-PANEL-2026-07-05.md
Review: docs/ux/export/HEX-CONTEXT-PANEL-GAP-DLA-DESIGN.html
Deliverable:
  The Game - A04 Panel heks kontekst v1 (1E).dc.html
  · 4 stany: goły+rzeka · ulepszenie · złoże · + miasto
  · SVG zasobów tier1 · ikony ulepszeń = paczka A-08 imp-*
  · scroll/collapse listy ulepszeń
  ZIP: HEX-CONTEXT-PANEL-2026-07-05.zip
Playtest PRZED: klik heks Równina (79,68) — lewy/prawy panel kontekstu

── B3 · IMP-01 — Panel Moc imperium + raporty 6C ──
Problem: klik Moc / Skarbiec / Praca / Nauka / Kultura / Ludność = stary HUD lub brak tabel per miasto
Brief:  dyspozycje/_handoff/MASTER-do-UI_panel-moc-i-imperium.md
Audyt:  docs/ux/UI-AUDIT-MOCKUP-vs-GRA-2026-07-05.md (§4)
Decyzja Macieja D16: domyślnie opcja A (slide-in z prawej)
Deliverable:
  The Game - Panel Moc imperium v1 2026-07-05 (1E).dc.html
  · Moc: 9 składników × współczynnik (tabela + % pasek)
  · Ranking cywilizacji + Respekt
  · Raporty: Skarbiec, Praca, Nauka, Kultura, Ludność, Rekruci — suma + tabela per miasto
  · Styl 1E jak HUD Mapy · zero emoji

── B4 · PB-v5-01 — C23 Szczegóły bitwy v1 ──
Spec:   docs/ux/DESIGN-ZLECENIE-POLE-BITWY-v5-GAP-2026-07-05.md (GAP-01 — nie wymyślaj pól)
Deliverable:
  The Game - C23 Szczegoly bitwy v1 2026-07-05 (1E).dc.html
Playtest PRZED: Gra-ROBOCZA-POLE-BITWY → koniec → Szczegóły (prowizorka Cursor)

── B5 · PB-v5-02 — C12 Koniec bitwy v3 ──
Baza: C12 v2 w repo — podnieś do poziomu v4.1 deploy + v5 popups
Deliverable:
  The Game - C12 Koniec bitwy v3 2026-07-05 (1E).dc.html
  · Przycisk „Szczegóły bitwy" → link do C23

══════════════════════════════════════════════════════════════
P1 — KOLEJNA TURA (po P0 lub równolegle jeśli masz bandwidth)
══════════════════════════════════════════════════════════════

── B6 · Hub nauki + drzewko technologii ──
Status: HOLD Macieja (decyzja D11 backlog) — ale brak mockupu final blokuje lane
Deliverable (gdy Maciej odblokuje):
  The Game - Hub nauki v1 (1E).dc.html + drzewko (scroll, tier lock, ikony tech)
Brief: docs/MACIEJ-KARTA-DECYZJI.md D11 · backlog WYMIANA

── B7 · Panele bez mockupów final ──
  · A-06 Panel jednostki (klik jednostka na mapie)
  · A-10 Panel armii / roster imperium
  · A-27 Modal dyplomacji (pełny flow, nie tylko ikona tb-diplomacy)
  · Panel Wiki boczny (jest tylko ui-wiki.svg — brak layoutu 1E)
Deliverable: po 1 mockup .dc.html per ekran + DESIGN-do-UI

── B8 · menu-button-map.json ──
Backlog WYMIANA — mapowanie przycisków menu głównego → ikony/klucze 1E
Deliverable: brand-book/eksport/menu-button-map.json + krótki opis w MANIFEST

══════════════════════════════════════════════════════════════
ODDANIE (jedna tura lub paczki tematyczne)
══════════════════════════════════════════════════════════════
P0 minimum (B1–B5):
  · 5× .dc.html (+ SVG imp-* + JSON mapy ikon)
  · DESIGN-do-UI_PACZKA-B-P0-2026-07-05.md (lista plików + ścieżki)
  · MANIFEST.txt
  · git push → docs/ux/claude-design/ + brand-book/
  · wpis WYMIANA sekcja design

Po gotowości P0 napisz Maciejowi:
„Paczka B-P0 (A-08 + HEX + Moc + C23 + C12v3) gotowa — lane portuje w 24h"

Lane UI NIE czeka na B6–B8 do dalszej pracy — te idą w P1/HOLD.
```

---

## Mapa plików (Maciej — nie musisz wklejać, Design czyta z repo)

| ID | Temat | Brief / wklejka szczegółowa |
|----|-------|----------------------------|
| B1 | A-08 panel budowy | `DESIGN-BRIEF-A08-ulepszenia-ikony-i-panel.md` |
| B2 | HEX-C1 panel heksu | `DESIGN-ZLECENIE-HEX-CONTEXT-PANEL-2026-07-05.md` |
| B3 | IMP-01 Moc | `MASTER-do-UI_panel-moc-i-imperium.md` |
| B4 | C23 szczegóły bitwy | `DESIGN-ZLECENIE-POLE-BITWY-v5-GAP-2026-07-05.md` |
| B5 | C12 koniec v3 | gap v5 + C12 v2 w brand-book |
| B6 | Hub nauki | HOLD D11 |
| B7 | A-06/A-10/A-27/Wiki | brak briefów — Design proponuje po P0 |
| B8 | menu-button-map | backlog WYMIANA |

**Skrócone wklejki tematyczne (archiwum):**
- P0 HEX+A08: `WKLEJKA-DESIGN-P0-HEX-A08-MACIEJ-2026-07-05.md`
- P0 IMP+C23+C12: `WKLEJKA-DESIGN-P0-IMP-MOC-C23-2026-07-05.md`
