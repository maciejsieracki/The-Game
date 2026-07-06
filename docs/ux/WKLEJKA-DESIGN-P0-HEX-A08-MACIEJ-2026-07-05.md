# WKLEJKA P0 — Panel heksu + Panel budowy (Maciej playtest 2026-07-05)

**Skopiuj cały blok poniżej do czatu Design.**

---

```
START — P0 HEX-CONTEXT-PANEL + A-08 (oba naraz)

Maciej playtest 2026-07-05 ~23:05 — gameplay OK, wygląd FAIL.
Prosił o poprawę ≥2× — briefy były w repo, teraz formalny START.

══════════════════════════════════════
1) HEX-CONTEXT-PANEL (klatka C1 · D17=A)
══════════════════════════════════════

PROBLEM (screenshot Macieja):
  Klik heksu Równina (79, 68) → karta kontekstu
  · PLONY: litery Ż/P/H/D/K — brak SVG res-food/work/treasury
  · linia „Razem” nieczytelna
  · MOŻLIWE ulepszenia: długa lista plain text bez ikon imp-*
  · gameplay D17=A OK · brak mockupu C1 (szata-sync 2026-07-03)

REVIEW + SPECYFIKACJA:
  docs/ux/export/HEX-CONTEXT-PANEL-GAP-DLA-DESIGN.html
  docs/ux/DESIGN-ZLECENIE-HEX-CONTEXT-PANEL-2026-07-05.md

DELIVERABLE:
  The Game - A04 Panel heks kontekst v1 (1E).dc.html
  · 4 stany: goły+rzeka · ulepszenie · złoże · + miasto
  · SVG zasobów tier1 · ikony ulepszeń = paczka A-08 imp-*
  · scroll/collapse listy ulepszeń
  ZIP: HEX-CONTEXT-PANEL-2026-07-05.zip

══════════════════════════════════════
2) A-08 — Tryb budowy ulepszeń (prawy panel)
══════════════════════════════════════

PROBLEM (screenshot Macieja):
  Toolbar 🏗 → panel prawy: Miasto + Ulepszenia terenu + Cuda
  · emoji 🌾🐄⛏️ zamiast SVG (decyzja zero emoji)
  · panel 240px — tekst wymagań nakłada się (Posterunek: Obróbka drewna + Murarstwo)
  · brak layoutu 1E jak HUD mapy / miasto W4
  · długa lista bez scroll hierarchy

BRIEF:
  docs/ux/DESIGN-BRIEF-A08-ulepszenia-ikony-i-panel.md

DELIVERABLE:
  1) SVG imp-* brakujące (~6–8): owce, lama, glinianka, obóz łowiecki, tarasy, warzelnia soli…
     + improvement-icon-map.json
  2) The Game - A08 Tryb budowy ulepszen (1E).dc.html
     · banner góra + panel prawy · ikony SVG · tech lock czytelny (2 linie max)
  ZIP: A08-ulepszenia-2026-07-03.zip (lub nowa data)

══════════════════════════════════════
REGUŁY
══════════════════════════════════════
  · ZERO emoji · styl 1E · spójność HUD Mapy layout + W4 miasto
  · Zapis: brand-book/ + eksport/icons/improvements/
  · Po gotowości: lista plików + „HEX + A-08 gotowe”

PLAYTEST PRZED: gra-robocza/START.html → Budowa + klik heks
```
