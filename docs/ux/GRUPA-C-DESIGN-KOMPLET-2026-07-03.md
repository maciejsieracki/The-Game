# Grupa C (Walka) — Design KOMPLET ✅

**Data domknięcia:** 2026-07-03 · **Decydent:** Maciej · **Styl:** 1E · **zero emoji**

---

## 7 ekranów (deliverables)

| # | ID | Plik | Opis skrót |
|---|-----|------|------------|
| 1 | C-01 | `claude-design/The Game - C01 Pre-bitwa v3 (1E).dc.html` | Skład ATK/OBR, medaliony dowódców, układ TW · v2 = archiwum |
| 2 | C-02/C-06 | `C02 Rozstawienie v2` · `C06 Deployment v3` | Rozstawienie + panel deploy + top HUD pola |
| 3 | C-07 | *(w C06 v3)* | Log, tura, prędkość, minimapa pola |
| 4 | C-09 | `C09 Karty jednostek v2` | Roster TW 3 rzędy + karta szczegółów |
| 5 | C-12 | `C12 Koniec bitwy v2` | Wieniec, ZWYCIĘSTWO, karty, Bohater, Powrót |
| 6 | C-04 | `C04 Oblezenie v2` | HUD tury oblężenia · integralność murów · Ostrzał/Czekaj/Szturm |
| 7 | C-05 | `C05 Szturm muru v2` | Punkty szturmu · obrona muru · Drabiny/Wieża/Szturm przez wyłom |

**Aktualizacja 2026-07-04 (Maciej):** oba mockupy **map-v2** — **HUD-only** wokół placeholdera pola 3D (spójnie z C-06 v4/C-07). Paczka Design u Macieja; wpięcie do `claude-design/` przed portem lane.

Folder: `docs/ux/claude-design/`

---

## Kod vs Design (stan 2026-07-03)

| Mockup | W kanonie (`032ad48c…`) |
|--------|-------------------------|
| Kolory Ty/wróg | ✅ batch 1 |
| C-06 deploy panel | ✅ batch 1 |
| C-09 roster | ✅ batch 1 |
| C-01 pre-bitwa | 🟡 kolory only |
| C-12 koniec | ✅ batch 2 |
| C-04 oblężenie HUD | ✅ batch 2 |
| C-05 szturm HUD | ✅ batch 2 (faza auto) |
| C-07 top HUD v3 | 🟡 top bar 52px + etykiety |
| C-09 cmd bar SVG | ✅ batch 2 |
| C-01 pre-bitwa SVG | ✅ batch 2 |

**Mapowanie Design ↔ lane:** `DESIGN-MAPOWANIE-C04-C05-vs-lane.md`

---

## Następne kroki (czeka decyzja Macieja)

1. **`START lane`** — batch 2 UI/UNITS: port C-04, C-05, C-12 full, C-06 v3 top, cmd SVG, C-01 SVG
2. **`master`** — bramka + kanon po lane (Maciej playtest)
3. **Design hub** — kafelki Walka w Przeglądzie 1E (opcjonalnie)
4. **A-08** — ulepszenia mapy (równoległy temat P1)

Lane **nie publikuje kanonu** — flaga `→ MASTER: GOTOWE`.
