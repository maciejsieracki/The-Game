# DESIGN → UI: port modali oblężenia mapy świata v2

**Flaga:** CZEKA Maciej **`START lane`** (UI)  
**Data:** 2026-07-04  
**Design:** ✅ GOTOWE (3 pliki `.dc.html` + `DESIGN-do-UI_C04-C05-A19-v2.md`)

---

## Co przesyłam

| Mockup | Ścieżka Design (brand-book) |
|--------|---------------------------|
| C-04 Atak miasto | `The Game - C04 Atak miasto wybor v2 (1E).dc.html` |
| C-05 Panel oblężenia | `The Game - C05 Panel oblezenie v2 (1E).dc.html` |
| A-19 Miasto zdobyte | `The Game - A19 Miasto zdobyte v2 (1E).dc.html` |

**Handoff Design:** `docs/ux/claude-design/DESIGN-do-UI_C04-C05-A19-v2.md`  
**Brief:** `docs/ux/DESIGN-BRIEF-C04-C05-oblęzenie-v2.md`

**Maciej:** wrzuć paczkę do `docs/ux/claude-design/` (jeśli jeszcze nie w repo).

---

## Co lane UI robi

1. Port CSS/HTML 1E z mockupów → trzy pliki TS (bez zmiany logiki flow).
2. Kolory: Oblężaj `#c87840` · Szturm `#3a6ad0` · zero emoji.
3. C-05: panel prawy · mapa świata widoczna · sekcja machin (Taran/Wieża SVG).
4. Build test: `gra-robocza/` · Ctrl+F5 · flow oblężenia na mapie.

---

## Co lane NIE robi

- `main.ts` (Integrator F)
- Pole bitwy C-19/C-20 (`siegeHud1E`, `siegeWall`) — osobny handoff UNITS
- Publikacja kanonu

---

## DoD

- [ ] 3 ekrany wizualnie = mockup v2
- [ ] Playtest Macieja OK (modal + panel + zdobycie)
- [ ] Meldunek append `UI-DO-MASTERA.md`

**Po OK:** Master → review Opus → F integracja (jeśli potrzebna) → kanon osobno.
