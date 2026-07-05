# Wklejka — REPACK modale mapy (C04 + C05 + A19)

**Status:** 🟢 wklej do Designera · 2026-07-04  
**Cel:** jeden zip z jednoznacznymi nazwami · lane może znaleźć pliki bez zgadywania

---

## WKLEJ DO DESIGNERA (cały blok)

```
START — REPACK · modale mapy (nie pole bitwy)

Najpierw przeczytaj REGUŁĘ NAZEWNICTWA (obowiązkowa):

ZLECENIE-ID: C04-C05-A19-mapa-v2
DATA ZLECENIA: 2026-07-04
HASLO-GITHUB: C04-C05-oblęzenie-mapa-v2

═══════════════════════════════════════
REGUŁA NAZEWNICTWA — OBOWIĄZKOWA
═══════════════════════════════════════

Każdy plik .dc.html:
  The Game - {ID} {Opis} v{N} {DATA} (1E).dc.html

Jeden ZIP:
  C04-C05-A19-mapa-v2_2026-07-04.zip

W ZIP: wszystkie pliki + MANIFEST.txt + handoff .md
NIE numeruj 12/13/14 bez ID · NIE ten sam tytuł dla wszystkich.

═══════════════════════════════════════
CO SPakować (3 mockupy + handoff)
═══════════════════════════════════════

To modale na MAPIE ŚWIATA — NIE pole bitwy 3D.

Pliki (nazwy DOKŁADNE):

1) C04 — wybór Oblężaj / Szturm / Anuluj
   The Game - C04 Atak miasto wybor v2 2026-07-04 (1E).dc.html

2) C05 — panel prawy, mapa w tle, machiny
   The Game - C05 Panel oblezenie v2 2026-07-04 (1E).dc.html

3) A19 — miasto zdobyte, pusty garnizon
   The Game - A19 Miasto zdobyte v2 2026-07-04 (1E).dc.html

4) Handoff:
   DESIGN-do-UI_C04-C05-A19-mapa-v2_2026-07-04.md

Styl: zero emoji · Oblężaj #c87840 · Szturm #3a6ad0 · SVG 1E
Brief: docs/ux/DESIGN-BRIEF-C04-C05-oblęzenie-v2.md

NIE pakuj (inny tor — już w repo):
  · C04 Oblezenie v2  ← pole bitwy C-19
  · C05 Szturm muru v2 ← pole bitwy C-20

═══════════════════════════════════════
MANIFEST.txt (wklej do zip)
═══════════════════════════════════════

ZLECENIE-ID: C04-C05-A19-mapa-v2
DATA: 2026-07-04
HASLO: C04-C05-oblęzenie-mapa-v2

PLIKI:
C04 | The Game - C04 Atak miasto wybor v2 2026-07-04 (1E).dc.html | modal wybór ataku na mapie
C05 | The Game - C05 Panel oblezenie v2 2026-07-04 (1E).dc.html | panel oblężenia mapy
A19 | The Game - A19 Miasto zdobyte v2 2026-07-04 (1E).dc.html | zdobycie bez bitwy

HANDOFF:
DESIGN-do-UI_C04-C05-A19-mapa-v2_2026-07-04.md

DESTINATION (Maciej):
docs/ux/claude-design/

LANE (Cursor, nie Design):
cityAttackChoice.ts · siegeMapPanel.ts · cityCaptureNotice.ts

═══════════════════════════════════════
DELIVERABLE
═══════════════════════════════════════

Jeden plik:
  C04-C05-A19-mapa-v2_2026-07-04.zip

Po gotowości:
„Paczka C04-C05-A19-mapa-v2_2026-07-04.zip gotowa”
```

---

## Maciej

1. Wklej blok do Designera → pobierz **jeden** zip  
2. Załącz zip tutaj w Cursor **albo** wrzuć do `docs/ux/claude-design/`  
3. Napisz: **„zip C04-C05-A19 jest w repo”** → lane port UI
