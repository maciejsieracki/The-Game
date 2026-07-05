# Design Brief — C-19 + C-20 Mur na polu bitwy v2 (1E)

**Status:** 📋 **PRZYGOTOWANY** — START po zamknięciu C-04/C-05  
**Data:** 2026-07-03

---

## Cel

Mockup **HUD muru/bramy** na polu bitwy oblężniczej + wariant z **murem 3D** w tle (placeholder jak C-06 v3).

| ID | Element | Deliverable |
|----|---------|-------------|
| **C-19** | Pasek HP bramy + segment muru | `The Game - C19 HUD mur v2 (1E).dc.html` |
| **C-20** | Mur 3D obrońcy (perspektywa) | ten sam plik — warstwa tła / osobny stan |

**Playtest baseline:** `Gra-podglad-OBLEZENIE-BITWA.html` · `Gra-podglad-MUR-BITWA.html`

**Kod:** `gra/src/battle/battleScene.ts` (`siegeHudDiv`) · `gra/src/battle/siegeWall.ts`

---

## C-19 HUD (obowiązkowy)

Pozycja dziś: lewy górny obszar pod top HUD bitwy (~top 118px, left 14px).

Zawartość (przykład):

- **Brama** — pasek HP + `120/120`
- **Mur (rząd N)** — pasek HP aktywnego segmentu
- Styl 1E: panel ciemny 5C, złote etykiety, **nie** monospace żółty (obecny kod = do wymiany)

Kolory:

- Mur obrońcy = akcent wróg `#c84040` (segment HP)
- Brama = złoto `#e8d88a` lub amber — wyróżnienie celu szturmu

---

## C-20 Mur 3D (tło)

- Mur w poprzek **górnej krawędzi** pola (obrońca u góry)
- Brama centralna · styl cywilizacji (cegła / kamień — placeholder)
- Jednostki na murze (walkway) — opcjonalnie 2 tokeny SVG
- Tło: to samo pole co C-06 v3 (deploy / walka)

---

## DoD

- Jeden plik `.dc.html` · 1920×1080 · zero emoji
- Warstwa: pole + mur 3D + HUD C-19 + opcjonalnie fragment top HUD C-06 v3

**Wklejka START:** utworzyć `WKLEJKA-DESIGN-START-C19-C20-mur.md` gdy Maciej da sygnał po C-05.
