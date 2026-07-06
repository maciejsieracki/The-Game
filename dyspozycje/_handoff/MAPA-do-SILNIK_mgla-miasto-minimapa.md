# MAPA → SILNIK — mgła miasta + minimapa (B-zasieg-miasta-fog)

| Pole | Wartość |
|------|---------|
| **Data** | 2026-06-27 |
| **Status** | **→ SILNIK: GOTOWE** (kontrakt lane · weryfikacja w ROBOCZA) |
| **Decyzja** | `docs/decyzje/B-zasieg-miasta-fog.md` |

---

## Co przesłano (lane MAPA)

| Plik | Zmiana |
|------|--------|
| `gra/src/game/visibility.ts` | `computePlayerVisibility()`, re-export `citySightRadius` |
| `gra/src/game/okolica.ts` | `citySightRadius(pop, kultura)` — już w EKONOMIA |
| `gra/src/map/minimap.ts` | Kontrakt fog — `visible`/`explored` z silnika |
| `gra/src/ui/minimapHud.ts` | Render 3 stanów (hidden/explored/visible) — bez zmian |
| `gra/src/render/scene.ts` | **A-START-03** — rzeki ukryte na unknown |

---

## Stan w `main.ts` (2026-06-27)

`currentVisible()` **już używa** `citySightRadius(c.population, kultura)` per miasto gracza.  
Minimapa: `getMinimapData(..., { visible: currentVisible(), explored })`.

**Opcjonalny refactor F:** zamienić ciało `currentVisible()` na:

```typescript
import { computePlayerVisibility, buildUnitSightResolver } from './game/visibility';

return computePlayerVisibility({
  map,
  playerUnits: units.filter(u => u.ownerId === 0),
  playerCities: cities.filter(c => c.ownerId === 0).map(c => ({
    q: c.q, r: c.r, population: c.population,
    kultura: (c as { kultura?: number }).kultura ?? 0,
  })),
  unitSight,
  startHex: playerStartHex,
  startRevealRadius,
});
```

---

## DoD

- [x] `cityRangeForPopulation` = max(5, pop), cap 15
- [x] `computePlayerVisibility` + testy logic-test
- [x] Minimapa konsumuje te same zbiory co `setFog`
- [x] Rzeki: segment ukryty gdy hex unknown w `hexKeys`
- [ ] Playtest Maciej: miasto pop 9 bez jednostek → krąg 9 (+ kultura)
- [ ] Playtest Maciej: rzeka niewidoczna w strefie unknown

**Flaga:** **→ SILNIK: GOTOWE** — bramka ROBOCZA + Opus
