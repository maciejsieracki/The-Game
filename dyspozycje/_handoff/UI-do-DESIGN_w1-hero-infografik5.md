# Design — W1-hero · Tła menu + intro kreatora

> **Od:** Maciej · **Lane:** wpięcie po ABC · **Zip:** `Ulepszenie infografik5.zip`

---

## START — W1-hero (CZEKA decyzja Macieja)

**Deliverable Design:** ✅ w zipie (2026-07-02 22:52)

| Plik | Ekran |
|------|--------|
| `assets/hero-menu.png` | Menu główne |
| `assets/hero-intro.png` | Kreator krok 1 / „Nowa gra” |
| `The Game - Ekran Menu Hero (1E).dc.html` | Mockup |
| `The Game - Ekran Intro Hero (1E).dc.html` | Mockup |

**Archiwum repo:** `docs/ux/claude-design/01-propozycje-z-design/ekrany-hero/`

---

## Maciej — ABC

| | Opcja |
|---|--------|
| **A** | Wpiąć PNG do `mainMenu.ts` + intro kreatora (gradienty jak mockup) |
| **B** | Najpierw oglądam mockupy `.dc.html` |
| **C** | Zostaw w archiwum — ikony wystarczą na teraz |

---

## Lane (po A)

- PNG → `gra/src/ui/assets/hero/` (import vite)
- `mainMenu.ts`: warstwa tła z `hero-menu.png` + winieta z mockupu
- `newGameFlow.ts`: tło krok 1 z `hero-intro.png`
- Build → kanon (uwaga: bundel ~+4 MB)

**NIE ruszać:** medaliony SVG, mapy JSON brand.

**Flaga:** ✅ GOTOWE (2026-07-02) · kanon `a1476d02afd8433866b257f025db6bcb`
