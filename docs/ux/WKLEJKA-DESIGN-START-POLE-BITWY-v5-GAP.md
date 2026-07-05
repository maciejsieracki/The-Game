# WKLEJKA — START Design POLE-BITWY v5 GAP

Plik referencyjny: `docs/ux/DESIGN-ZLECENIE-POLE-BITWY-v5-GAP-2026-07-05.md`  
Review HTML: `docs/ux/export/C-POLE-BITWY-GAP-DLA-DESIGN.html`

---

```
═══════════════════════════════════════
REGUŁA NAZEWNICTWA — OBOWIĄZKOWA
═══════════════════════════════════════

ZLECENIE-ID: POLE-BITWY-v5-gap-2026-07-05
DATA ZLECENIA: 2026-07-05

1) Każdy plik .dc.html — nazwa MUSI zawierać ID, opis, wersję, DATĘ, (1E).

2) JEDEN plik ZIP:
   POLE-BITWY-v5-gap-2026-07-05.zip

3) W ZIP (korzeń):
   · wszystkie .dc.html
   · DESIGN-do-UI_POLE-BITWY-v5-gap.md
   · MELDUNEK-POLE-BITWY-v5-gap.md
   · MANIFEST.txt
   · support.js

4) Po gotowości napisz:
   „Paczka POLE-BITWY-v5-gap-2026-07-05.zip gotowa” + lista plików.

═══════════════════════════════════════
TREŚĆ ZLECENIA (skrót)
═══════════════════════════════════════

START — POLE-BITWY v5 GAP · styl 1E · zero emoji

CEL: Zamienić elementy zrobione przez lane Cursor na mockupy Design.
Paczka v4.1 (C06/C09/Strategia/C12) = baza — NIE psuć, tylko uzupełnić luki.

PLAYTEST PRZED (screenshoty):
  gra-kanon/Gra-podglad-POLE-BITWY.html · Ctrl+F5
  Deploy → Start walki → R → koniec → Szczegóły bitwy

REVIEW LISTA:
  docs/ux/export/C-POLE-BITWY-GAP-DLA-DESIGN.html

PEŁNA SPECYFIKACJA:
  docs/ux/DESIGN-ZLECENIE-POLE-BITWY-v5-GAP-2026-07-05.md

───────────────────────────────────────
P0 — MUST (brak mockupu)
───────────────────────────────────────

GAP-01 · C-23 Szczegóły bitwy v1
  Plik: The Game - C23 Szczegoly bitwy v1 2026-07-05 (1E).dc.html
  · Pełnoekranowy overlay spójny z C-12 (NIE mały modal)
  · 2 kolumny: ATAKUJĄCY | OBROŃCA
  · 3 sekcje: Zniszczone / Zrootowane / Ocalałe + lista ×N
  · Przyciski: ← Wróć do podsumowania · Rozegraj ponownie
  · Brief: docs/ux/DESIGN-BRIEF-C21-koniec-bitwy-v2.md § C-23

GAP-02 · C-12 Koniec bitwy v3
  Plik: The Game - C12 Koniec bitwy v3 2026-07-05 (1E).dc.html
  · 3 stany w 1 pliku: ZWYCIĘSTWO · PORAŻKA · podpowiedź nad przyciskami
  · 3 przyciski: Rozegraj ponownie (primary) · Szczegóły · Powrót do mapy
  · Aktualizacja v2 — nowy plik v3

───────────────────────────────────────
P1 — popupy deploy (przyciski są w C06 v4, popupów brak)
───────────────────────────────────────

GAP-03 · Popup Formacja v1
  Opcje: Dystans · Piechota · Oblężenie

GAP-04 · Popup Konnica v1
  Opcje: Z boku · Z tyłu

GAP-05 · Popup Linie v1
  Piechota: 1/2/3 · Łucznicy: 1/2/3

GAP-06 · Popup Taktyka v2
  Sync copy z grą: Obrona · Atak · Szturm · Ostrzał
  (NIE Natarcie/Odwrót z v4 przykładu)

───────────────────────────────────────
P2 — doprecyzowanie v4.1
───────────────────────────────────────

GAP-07 · C-09 Roster v5 — puste sloty + karta routed/padł
GAP-08 · C-06 top bar v5 — gap ikon·liczby · strzałka ↓ przed Ty
GAP-09 · Tooltip karty jednostki v1 (zamiast starego panelu Q3)

───────────────────────────────────────
P3 — opcjonalnie
───────────────────────────────────────

GAP-10 · C-22 Baner flash wyniku (1–2 s przed C-12)

───────────────────────────────────────
NIE PROJEKTOWAĆ
───────────────────────────────────────

· Stary panel Q3 (20 zaznaczonych) — usuwamy w kodzie
· Mapa 3D / logika paska mocy
· Panel Generała (osobny temat)

TOKENY 1E:
  Ty #3a6ad0 · wróg #c84040 · złoto #e8d88a · Georgia tytuły · zero emoji

Po ZIP → Maciej akceptacja → lane port skin → Opus → kanon.
```
