# WKLEJKA — START Design A-06 + A-18 Armia na mapie

Plik: `docs/ux/DESIGN-ZLECENIE-ARMY-MERGE-A18-2026-07-05.md`  
Review: `docs/ux/export/A18-ARMY-MERGE-GAP-DLA-DESIGN.html`

---

```
═══════════════════════════════════════
ZLECENIE-ID: ARMY-MERGE-A18-2026-07-05
DATA: 2026-07-05
═══════════════════════════════════════

START — A-06 Panel stosu + A-18 Merge/Split · mapa · styl 1E · zero emoji

PROBLEM (2 screenshoty Macieja):
1) A-06 dolny panel „Armia · (48,31)” — szkic lane odrzucony wizualnie
   · ⚔️ na kartach · Rozdziel FIOLET · Połącz NIEBIESKI disabled
   · zielony HP bar · niespójne z złotym „Ruch”
2) A-18 modal Połączenie armii — emoji 🔗 ⚔️ · zielony CTA

REVIEW + SPECYFIKACJA:
  docs/ux/export/A18-ARMY-MERGE-GAP-DLA-DESIGN.html
  docs/ux/DESIGN-ZLECENIE-ARMY-MERGE-A18-2026-07-05.md

SCREENSHOTY PRZED:
  · A18-merge-przed-2026-07-05.png (modal merge)
  · A06-stack-przed-2026-07-05.png (panel stosu)

PLAYTEST: gra-kanon/Gra-podglad.html
  · Stos: klik ≥2 jednostek na heksie
  · Merge: ruch na sojusznika
  · Split: Rozdziel w panelu lub H

ZIP: ARMY-MERGE-A18-2026-07-05.zip

───────────────────────────────────────
DELIVERABLES (3 mockupy .dc.html)
───────────────────────────────────────
  1. A06 Panel stosu armii v1 (1E).dc.html     ← P0 NOWY
     · Lista · Rozdziel · Połącz · karty · staty · Ruch/Ufort./Pomiń
     · 4 stany (2 jedn., Połącz on/off, 4+ scroll)
     · Toolbar ZŁOTY outline — bez fiolet/niebieski

  2. A18 Polaczenie armii v1 (1E).dc.html
  3. A18 Rozdziel armie v1 (1E).dc.html

  SVG: icon-merge-armies · icon-arrow-join · (icon-split-army)
  Karta jednostki IDENTYCZNA w A-06 i A-18
  Ikony jednostek = paczka JEDNOSTKI-INFOGRAFIKI (poziom B)

───────────────────────────────────────
REGUŁY
───────────────────────────────────────
  · ZERO emoji
  · Primary + toolbar outline = ZŁOTY 1E
  · HP bar ≠ neonowy zielony
  · Toast „Połączono…” = osobny temat A-20 — nie w mockupie A-06

  DESIGN-do-UI_ARMY-MERGE-A18.md
  MELDUNEK-ARMY-MERGE-A18.md
  MANIFEST.txt

Po gotowości:
  „Paczka ARMY-MERGE-A18-2026-07-05.zip gotowa” + lista plików
```
