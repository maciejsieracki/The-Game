# WKLEJKA — START Design Jednostki infografiki 1E

Plik: `docs/ux/DESIGN-ZLECENIE-JEDNOSTKI-INFOGRAFIKI-2026-07-05.md`  
Review: `docs/ux/export/JEDNOSTKI-INFOGRAFIKI-GAP-DLA-DESIGN.html`

---

```
═══════════════════════════════════════
ZLECENIE-ID: JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05
DATA: 2026-07-05
═══════════════════════════════════════

START — Infografiki typów jednostek · styl 1E · SVG · zero emoji

PROBLEM:
W każdym ekranie INNE ikony tej samej konnicy/piechoty/łucznika.
Miasto = brand-book SVG · pre-bitwa = PB_SVG · pole bitwy = podkowa/miecze/łuk.
Maciej chce JEDEN kanon — Ty projektujesz, lane podmienia w kodzie.

REVIEW + SPECYFIKACJA:
  docs/ux/export/JEDNOSTKI-INFOGRAFIKI-GAP-DLA-DESIGN.html
  docs/ux/DESIGN-ZLECENIE-JEDNOSTKI-INFOGRAFIKI-2026-07-05.md

SCREENSHOTY PRZED (5 ekranów):
  1. Miasto — produkcja jednostki (gra-kanon/START.html)
  2. Pre-bitwa C-01 (atak)
  3. POLE-BITWY top bar (Gra-podglad-POLE-BITWY.html)
  4. POLE-BITWY roster karta (R)
  5. Popup Strategia (medaliony K/Ł/P)

ZIP: JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05.zip

───────────────────────────────────────
POZIOM A — klasy walki (4 ikony, WSZĘDZIE IDENTYCZNE)
───────────────────────────────────────
  class-mounted   Konnica
  class-melee     Piechota (agregat)
  class-ranged    Łucznicy (agregat)
  class-siege     Oblężenie

  Użycie: pre-bitwa · top bar POLE-BITWY · filtry rosteru · Strategia

───────────────────────────────────────
POZIOM B — kategorie szczegółowe (18 ikon)
───────────────────────────────────────
  lucznik procarz oszczepnik wlocznik falanga legionista miecznik
  maczuga topor konnica rydwan obleznicza zwiadowca osadnik robotnik
  galera super domyslny

  WYMAGANE: falanga ≠ legionista ≠ włócznik ≠ miecznik (4 różne siluety)
  Użycie: panel miasta · karta rosteru (docelowo) · encyklopedia

───────────────────────────────────────
DELIVERABLES
───────────────────────────────────────
  · The Game - Jednostki infografiki kanon v1 2026-07-05 (1E).dc.html
    (mockup: klasy A + kategorie B + ten sam icon w 4 kontekstach UI)
  · eksport/icons/units/*.svg (min. 22 pliki)
  · unit-icon-map.json (pełne mapowanie)
  · battle-class-map.json (NOWY — 4 klasy A)
  · DESIGN-do-UI_JEDNOSTKI-INFOGRAFIKI.md
  · MELDUNEK-JEDNOSTKI-INFOGRAFIKI.md
  · MANIFEST.txt

STYL: stroke currentColor · viewBox 24×24 · brand-book 1E · bez emoji

Po gotowości:
  „Paczka JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05.zip gotowa” + lista plików

UWAGA: synchronizuj klasy A z POLE-BITWY top bar (ZLECENIE POLE-BITWY-v5-gap)
```
