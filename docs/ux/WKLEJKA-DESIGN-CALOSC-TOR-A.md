# WKLEJKA CALOSC — Design TOR A (rev.4 · GitHub)

**Skopiuj cały blok poniżej (między ```) i wklej do czatu Design.**

Repo: https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/WKLEJKA-DESIGN-CALOSC-TOR-A.md

---

```
═══════════════════════════════════════
The Game · ZLECENIE DESIGN · TOR A only
Od: Maciej · 2026-07-05 rev.4 · GitHub
═══════════════════════════════════════

REPO: https://github.com/maciejsieracki/The-Game  (gałąź main)
Przed pracą: git pull origin main  (albo podłącz repo w Claude Design)
Indeks haseł: szukaj w repo „TOR-A-ONLY" lub otwórz:
  https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-GITHUB-HASLA.md
Workflow oddawania pracy (commit/push):
  https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/claude-design/WORKFLOW-GITHUB-SYNC.md

───────────────────────────────────────
REGUŁA NAZEWNICTWA — OBOWIĄZKOWA
───────────────────────────────────────

ZLECENIE-ID: {z briefu, np. JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05}
DATA ZLECENIA: YYYY-MM-DD  ← dzisiaj

1) Każdy plik .dc.html — nazwa MUSI zawierać:
   · ID ekranu (C04, C05, A19, W3, C06, A21…)
   · opis zlecenia (nie generyczne „Brand Book")
   · wersję v2/v3
   · DATĘ zlecenia YYYY-MM-DD
   · sufiks (1E)

   Wzór:
   The Game - {ID} {Opis} v{N} {DATA} (1E).dc.html

   Przykład:
   The Game - C04 Atak miasto wybor v2 2026-07-04 (1E).dc.html

2) JEDEN plik ZIP (gdy Maciej pobiera ręcznie) — nazwa:
   {ZLECENIE-ID}_{DATA}.zip
   Przykład: JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05_2026-07-05.zip

3) W ZIP (korzeń, bez podfolderów):
   · wszystkie .dc.html tego zlecenia
   · DESIGN-do-UI_{ZLECENIE-ID}.md  (handoff)
   · MANIFEST.txt

4) MANIFEST.txt — obowiązkowy:

   ZLECENIE-ID: …
   DATA: YYYY-MM-DD
   HASLO-GITHUB: …  (z briefu)
   REPO: https://github.com/maciejsieracki/The-Game

   PLIKI:
   C04 | pełna nazwa pliku | co to jest
   …

5) ZAKAZ:
   · ten sam tytuł dla wszystkich plików
   · numerowanie tylko 12, 13, 14 bez ID zlecenia
   · „Brand Book" / „The Game" bez ID ekranu
   · osobne zipy per plik (jeden zip = jedno zlecenie)

6) ODDANIE PRACY (preferowane — GitHub):
   · wrzuć pliki do docs/ux/claude-design/
   · git commit + push origin main
   · dopisz wpis w docs/ux/claude-design/WYMIANA-UI-DESIGN.md

Po gotowości napisz:
„Paczka {ZLECENIE-ID}_{DATA}.zip gotowa" + lista plików + link do commita (jeśli push).

NAZWA POBRANIA (gdy zip zamiast push):
Przy każdej paczce podaj POGRUBIONĄ nazwę do wklejenia w oknie zapisu Windows.
Przykład: JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05_2026-07-05.zip

───────────────────────────────────────
ZAKRES (TOR A only)
───────────────────────────────────────

Poniżej TYLKO to, czego od Ciebie jeszcze NIE mamy.
Mockupy v4.1 (pole bitwy), C-04/C-05/A-19 v2 (mapa), miasto W4, layout C-01
→ już są w repo · portujemy sami (TOR B) · NIE rób ponownie.
Wzorce TOR B (nie ruszać):
  https://github.com/maciejsieracki/The-Game/tree/main/docs/ux/claude-design

Twoja robota = 6 paczek ZIP → commit/push pod docs/ux/claude-design/
→ my potem podmieniamy w grze.

REGUŁY: 1E · zero emoji · złoto #e8d88a · Georgia · SVG currentColor.
Wzór stylu: POLE-BITWY v4.1 · HUD mapy · miasto W4.
NIE kopiuj wyglądu z gry dziś (lane Cursor) — tylko pola ze spec.

───────────────────────────────────────
P0 — NAJPIERW
───────────────────────────────────────

ZIP 1 · JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05
  · Katalog v1 (referencja — dokończ):
    https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/claude-design/jednostki-infografiki-1E.html
  · Dostarcz: 22+ SVG (4 klasy A + 18 kategorii B, 4 różne piechoty)
    unit-icon-map.json · battle-class-map.json · handoff .md
  · Spec (czytaj w całości):
    https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-ZLECENIE-JEDNOSTKI-INFOGRAFIKI-2026-07-05.md
  · Review PRZED (HTML):
    https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/JEDNOSTKI-INFOGRAFIKI-GAP-DLA-DESIGN.html

ZIP 2 · POLE-BITWY-v5-gap-2026-07-05  (v4.1 NIE ruszać)
  P0 MUST:
  · C23 Szczegóły bitwy v1 — pełny overlay jak C-12
  · C12 Koniec bitwy v3 — ZWYCIĘSTWO + PORAŻKA + 3 przyciski
  P1: popupy Formacja · Konnica · Linie · Taktyka v2
  P2: C09 Roster v5 · C06 top bar v5 · tooltip karty
  · Playtest PRZED (sklonuj repo → otwórz lokalnie Ctrl+F5):
    gra-kanon/Gra-podglad-POLE-BITWY.html
    https://github.com/maciejsieracki/The-Game/blob/main/gra-kanon/Gra-podglad-POLE-BITWY.html
  · Spec:
    https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-ZLECENIE-POLE-BITWY-v5-GAP-2026-07-05.md
  · Review PRZED:
    https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/C-POLE-BITWY-GAP-DLA-DESIGN.html

───────────────────────────────────────
P1 — MAPA / HUD
───────────────────────────────────────

ZIP 3 · ARMY-MERGE-A18-2026-07-05
  · A06 stos · A18 merge · A18 split · A20 toast
  · Spec:
    https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-ZLECENIE-ARMY-MERGE-A18-2026-07-05.md
  · Review PRZED:
    https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/A18-ARMY-MERGE-GAP-DLA-DESIGN.html

ZIP 4 · A21-CITY-UNIT-PICK-2026-07-05
  · 1 mockup picker Miasto | Jednostka
  · Spec:
    https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-ZLECENIE-A21-CITY-UNIT-PICK-2026-07-05.md
  · Review PRZED + screenshot:
    https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/A21-CITY-UNIT-PICK-GAP-DLA-DESIGN.html
    https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/screenshots/A21-city-unit-pick-przed-2026-07-05.png

ZIP 5 · HEX-CONTEXT-PANEL-2026-07-05
  · 1 mockup karta klikniętego heksu (plony SVG, ulepszenia imp-*)
  · Spec:
    https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-ZLECENIE-HEX-CONTEXT-PANEL-2026-07-05.md
  · Review PRZED + screenshot:
    https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/HEX-CONTEXT-PANEL-GAP-DLA-DESIGN.html
    https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/screenshots/HEX-context-panel-przed-2026-07-05.png

ZIP 6 · A-08 ulepszenia (panel budowy + imp-* SVG + JSON)
  · Brief:
    https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-BRIEF-A08-ulepszenia-ikony-i-panel.md
  · Handoff lane:
    https://github.com/maciejsieracki/The-Game/blob/main/dyspozycje/_handoff/UI-do-DESIGN_A08-START-2026-07-03.md

───────────────────────────────────────
NIE TWÓJ TOR (my portujemy — mockupy już w repo)
───────────────────────────────────────
· C04/C05/A19 v2 mapa · POLE-BITWY v4.1 · C-01 layout · miasto W4
  https://github.com/maciejsieracki/The-Game/tree/main/docs/ux/claude-design

Master TOR A/B + review HTML:
  https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/WKLEJKA-DESIGN-MASTER-LUKI-2026-07-05.md

───────────────────────────────────────
Kolejność: ZIP 1 → ZIP 2 P0 → ZIP 3–6 równolegle OK → ZIP 2 P1–P2.
Dzięki!
```
