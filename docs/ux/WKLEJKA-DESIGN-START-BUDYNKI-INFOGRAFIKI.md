# WKLEJKA — START Design Budynki infografiki 1E

**Repo:** https://github.com/maciejsieracki/The-Game (gałąź `main`)

| Plik | Link GitHub |
|------|-------------|
| Spec pełna | [DESIGN-ZLECENIE-BUDYNKI-INFOGRAFIKI-2026-07-05.md](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-ZLECENIE-BUDYNKI-INFOGRAFIKI-2026-07-05.md) |
| Review GAP | [BUDYNKI-INFOGRAFIKI-GAP-DLA-DESIGN.html](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/BUDYNKI-INFOGRAFIKI-GAP-DLA-DESIGN.html) |
| Hasła / indeks | [DESIGN-GITHUB-HASLA.md](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-GITHUB-HASLA.md) |
| Reguły nazw + push | [WKLEJKA-DESIGN-NAGLOWEK-ZLECENIA.md](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/WKLEJKA-DESIGN-NAGLOWEK-ZLECENIA.md) |
| Workflow GitHub | [WORKFLOW-GITHUB-SYNC.md](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/claude-design/WORKFLOW-GITHUB-SYNC.md) |
| Wzór ikon (13×) | [brand-book/eksport/icons/buildings/](https://github.com/maciejsieracki/The-Game/tree/main/docs/ux/claude-design/01-propozycje-z-design/brand-book/eksport/icons/buildings) |

---

```
═══════════════════════════════════════
REGUŁA NAZEWNICTWA + GITHUB — OBOWIĄZKOWA
═══════════════════════════════════════

REPO: https://github.com/maciejsieracki/The-Game  (gałąź main)
Przed pracą: git pull origin main  (albo podłącz repo w Claude Design)
Indeks haseł: szukaj w repo „BUDYNKI-INFOGRAFIKI-1E-2026-07-05"

ZLECENIE-ID: BUDYNKI-INFOGRAFIKI-1E-2026-07-05
DATA ZLECENIA: 2026-07-05

1) Plik .dc.html:
   The Game - Budynki infografiki kanon v1 2026-07-05 (1E).dc.html

2) ZIP (jeśli Maciej pobiera ręcznie):
   BUDYNKI-INFOGRAFIKI-1E-2026-07-05_2026-07-05.zip

3) W ZIP: SVG + building-icon-map.json + DESIGN-do-UI_BUDYNKI-INFOGRAFIKI.md + MANIFEST.txt

4) ODDANIE (preferowane): git commit + push → docs/ux/claude-design/

═══════════════════════════════════════
TREŚĆ ZLECENIA
═══════════════════════════════════════

START — Infografiki budynków · 35 ikon · styl 1E · zero emoji

PROBLEM:
35 budynków w grze · tylko 13 ikon kategorii (bld-production, bld-trade…).
Stolarnia wygląda jak Piec hutniczy. Port = Targowisko. Cytadela = Warsztat oblężniczy.

Cel: 35 dedykowanych SVG @24px + karty infografiki (panel miasta, ↗ upgrade).

CZYTAJ NA GITHUB (nie z dysku):
  docs/ux/DESIGN-ZLECENIE-BUDYNKI-INFOGRAFIKI-2026-07-05.md
  docs/ux/export/BUDYNKI-INFOGRAFIKI-GAP-DLA-DESIGN.html

PLAYTEST PRZED (screenshoty):
  gra-kanon/START.html → miasto → Budowa + Budynki w mieście (↗)

───────────────────────────────────────
POZIOM A — 35 ikon SVG (MUST)
───────────────────────────────────────
  Nazwa pliku: bld-{id}.svg  (np. bld-port_wielki.svg, bld-fort.svg)
  Styl: jak eksport/icons/buildings/bld-*.svg (stroke #e8d88a → currentColor)
  ViewBox: 24×24

  P0 (20 szt. — pierwszy zip):
    Produkcja ×10: stolarnia mielerz kamieniarski kuznia odlewnia_brazu
      odlewnia_zelaza garncarnia cegielnia kuznia_zelaza wielka_kuznia
    Handel ×5: targowisko port port_wielki karawanseraj mennica
    Obrona/wojsko ×5: mury fort koszary warsztat_oblezniczy akademia_wojskowa

  P1: pary upgrade (port→port_wielki, mury→fort, bib→akademia…)
  P2: zdrowie + admin + teatr

  Pełna tabela motywów → w spec §4 (link GitHub powyżej)

───────────────────────────────────────
POZIOM B — karta infografiki ~280px (SHOULD)
───────────────────────────────────────
  Na karcie: ikona 40px · nazwa PL · kategoria · 2–3 bonusy · epoka · ↗ jeśli upgrade

───────────────────────────────────────
DELIVERABLES
───────────────────────────────────────
  · The Game - Budynki infografiki kanon v1 2026-07-05 (1E).dc.html
  · eksport/icons/buildings/bld-{id}.svg (35 plików)
  · building-icon-map.json (1:1 id → plik)
  · DESIGN-do-UI_BUDYNKI-INFOGRAFIKI.md
  · MANIFEST.txt

REGUŁY: zero emoji · 1E · stroke spójny z jednostkami (JEDNOSTKI-INFOGRAFIKI)

Po gotowości: push GitHub LUB
„Paczka BUDYNKI-INFOGRAFIKI-1E-2026-07-05_2026-07-05.zip gotowa"
```
