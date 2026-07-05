# WKLEJKA — START Design A-18 Połączenie / Rozdziel armii

Plik: `docs/ux/DESIGN-ZLECENIE-ARMY-MERGE-A18-2026-07-05.md`  
Review: `docs/ux/export/A18-ARMY-MERGE-GAP-DLA-DESIGN.html`

---

```
═══════════════════════════════════════
ZLECENIE-ID: ARMY-MERGE-A18-2026-07-05
DATA: 2026-07-05
═══════════════════════════════════════

START — A-18 Połączenie armii + Rozdziel armii · mapa · styl 1E · zero emoji

PROBLEM:
Modal „Połączenie armii” (ruch na własny stos) = makieta lane Cursor.
Emoji 🔗 w nagłówku · ⚔️ przy jednostkach · zielony przycisk „Połącz armie”.
Brak mockupu w brand-book (A-18 = ⬜).
Split [H] — ten sam problem wizualny.

REVIEW + SPECYFIKACJA:
  docs/ux/export/A18-ARMY-MERGE-GAP-DLA-DESIGN.html
  docs/ux/DESIGN-ZLECENIE-ARMY-MERGE-A18-2026-07-05.md

SCREENSHOT PRZED:
  Maciej 2026-07-05 — Połączenie armii, Hastati, heks (48,31)
  (w review HTML)

PLAYTEST:
  gra-kanon/Gra-podglad.html
  Merge: ruch wojska na heks z sojusznikiem
  Split: stos ×2 → klawisz H

ZIP: ARMY-MERGE-A18-2026-07-05.zip

───────────────────────────────────────
DELIVERABLES (2 mockupy .dc.html)
───────────────────────────────────────
  1. The Game - A18 Polaczenie armii v1 2026-07-05 (1E).dc.html
     · Na polu | → dołącza | Przybywa
     · Stos: N jednostek na (q,r)
     · Zostaw osobno (outline) · Połącz armie (PRIMARY ZŁOTY)
     · 3 stany: 1+1, 2+1, mobile

  2. The Game - A18 Rozdziel armie v1 2026-07-05 (1E).dc.html
     · Checkboxy jednostek + chipy sąsiednich heksów
     · Anuluj · Rozdziel (PRIMARY ZŁOTY)

  3. SVG: icon-merge-armies.svg · icon-arrow-join.svg
     (+ opcjonalnie icon-split-army.svg)

───────────────────────────────────────
REGUŁY
───────────────────────────────────────
  · ZERO emoji
  · Primary = złoty gradient 1E (NIE zielony / NIE niebieski)
  · Ikony jednostek = paczka JEDNOSTKI-INFOGRAFIKI (poziom B)
    np. Hastati → legionista / unit-legion.svg
  · Spójność z A-06 stack HUD (dolny pasek stosu — już 1E)

  DESIGN-do-UI_ARMY-MERGE-A18.md
  MELDUNEK-ARMY-MERGE-A18.md
  MANIFEST.txt

Po gotowości:
  „Paczka ARMY-MERGE-A18-2026-07-05.zip gotowa” + lista plików
```
