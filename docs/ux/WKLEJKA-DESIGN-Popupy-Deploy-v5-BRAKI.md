# WKLEJKA A — do Designera (braki po P0 lane)

Skopiuj blok poniżej (między ```) do czatu Design.

---

```
═══════════════════════════════════════
The Game · UZUPEŁNIENIA DESIGN · Popupy Deploy v5
Od: Maciej · 2026-07-05
Repo: https://github.com/maciejsieracki/The-Game
═══════════════════════════════════════

Cześć — dzięki za HANDOFF-Cursor-Popupy-Deploy-v5.md.
Lane wdrożył z niego P0 (Konnica SVG, Dystansowe, linie domyślnie 3,
wiersze popup, Taktyka 2×2, tło zaznaczenia .08) — commit afe2220.

Poniżej lista tego, czego jeszcze potrzebujemy — proszę commit/push
pod docs/ux/claude-design/ (+ ewent. jeden ZIP z MANIFEST.txt).

Handoff w repo:
  docs/ux/claude-design/HANDOFF-Cursor-Popupy-Deploy-v5.md

───────────────────────────────────────
P0 — BRAKUJE W REPO (blokuje pixel-perfect)
───────────────────────────────────────

1) MOCKUP HTML (referencja wizualna)
   The Game - Popupy deploy v5 2026-07-05 (1E).dc.html
   · w handoff jest wspomniany, ale NIE ma go na GitHubie
   · potrzebny do weryfikacji odstępów, paddingu, hover

2) OSOBNE MOCKUPY GAP (jeśli masz gotowe)
   · C06 Popup Formacja v1 2026-07-05 (1E).dc.html
   · C06 Popup Konnica v1 2026-07-05 (1E).dc.html
   · C06 Popup Linie v1 2026-07-05 (1E).dc.html
   · C06 Popup Taktyka v2 2026-07-05 (1E).dc.html

───────────────────────────────────────
P1 — SVG (w handoff tylko opis słowny — proszę kod jak u Konnicy)
───────────────────────────────────────

3) GAP-03 · Formacja — 3 ikony SVG:
   · Dystans — celownik / luneta
   · Piechota — skrzyżowane miecze
   · Oblężenie — katapulta

4) GAP-06 · Taktyka — 4 ikony SVG:
   · Obrona — tarcza
   · Atak — skrzyżowane miecze
   · Szturm — strzałka w dół nad podstawą
   · Ostrzał — celownik / luneta
   (lane ma tymczasowe ikony — podmienimy na Twoje)

5) GAP-05 · Linie — ikona Piechota w nagłówku sekcji
   · skrzyżowane miecze 17×17
   · Dystansowe / celownik — masz w handoff ✅

6) Przycisk toolbara „Konnica” — ikona hełmu
   · handoff: rotate(180 12 12) — bez zmian
   · brak kodu SVG w handoff — proszę dopisać

───────────────────────────────────────
P1 — SYNC DOKUMENTACJI
───────────────────────────────────────

7) Zaktualizuj DESIGN-ZLECENIE-POLE-BITWY-v5-GAP-2026-07-05.md:
   · GAP-05: „Łucznicy” → „Dystansowe”
   · Formacja F3: „Machiny z przodu” → „Machiny na skrzydłach”
   · domyślne linie Dystansowe = 3

───────────────────────────────────────
ODDAWANIE PRACY
───────────────────────────────────────
· commit + push origin main → docs/ux/claude-design/
· wpis w WYMIANA-UI-DESIGN.md
· po paczce: „Paczka <ZLECENIE-ID>_<DATA>.zip gotowa” + lista plików

Reszta TOR A (C23, C12 v3, jednostki SVG, A21, HEX, A08) — osobno,
wg WKLEJKA-DESIGN-CALOSC-TOR-A.md — nie blokujemy tego zleceniem.

Dzięki!
```
