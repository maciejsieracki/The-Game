# Design → UNITS: port HUD C-19/C-20 (map-v2)

**Flaga:** CZEKA `START lane` od Macieja  
**Data:** 2026-07-04  
**Mockupy (repo):**

- `docs/ux/claude-design/The Game - C04 Oblezenie v2 (1E).dc.html`
- `docs/ux/claude-design/The Game - C05 Szturm muru v2 (1E).dc.html`

**Stan Design:** ✅ map-v2 HUD-only + placeholder 3D (Maciej + Designer 2026-07-04)

---

## Co portować (lane UNITS + SILNIK review)

| Mockup | Kod docelowy | Lane |
|--------|--------------|------|
| C-04 Oblężenie | `gra/src/battle/siegeHud1E.ts` · overlay w `battleScene.ts` | UNITS |
| C-05 Szturm muru | `gra/src/battle/siegeWall.ts` · HUD szturmu | UNITS |

**Zasada:** tło = silnik 3D · Design = tylko overlay HTML/CSS 1E.

---

## Elementy C-04 (checklist)

- Górny pasek VS (Ty / garnizon)
- Lewy panel: integralność murów
- Prawy panel: siły oblężnicze
- Akcje: Ostrzał · Czekaj · Szturm

## Elementy C-05 (checklist)

- Lewo: punkty szturmu + aktywny wyłom
- Prawo: obrona muru
- Akcje: Drabiny · Wieża · Szturm przez wyłom

---

## DoD

- [ ] Playtest `gra-robocza/` · oblężenie + szturm muru
- [ ] Zero emoji · tokeny 1E · kolory stron (`DECYZJA-C-kolory-stron-bitwa.md`)
- [ ] Meldunek `UNITS-DO-MASTERA.md` · **nie** publikuj kanonu

**NIE ruszać:** modal mapy świata (`cityAttackChoice.ts`) — osobny tor Design + UI.
