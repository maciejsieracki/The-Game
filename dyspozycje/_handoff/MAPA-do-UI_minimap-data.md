# MAPA → UI / MASTER: getMinimapData (D15=B)

**Data:** 2026-06-26 · **Od:** Grupa A · **Status:** GOTOWE  
**Decyzja Macieja:** D15=B — UI rysuje minimapę z danych MAPY.

---

## Co przesyłam

Moduł `gra/src/map/minimap.ts` — eksport `getMinimapData()`.

Typy zgodne z `gra/src/ui/hud.ts` (`MinimapHexData`, `MinimapData`).

---

## API

```typescript
import { getMinimapData } from './map/minimap';
import type {
  MinimapData,
  MinimapCameraInput,
  MinimapCityInput,
  MinimapUnitInput,
  GetMinimapDataOptions,
} from './map/minimap';

function getMinimapData(
  map: GameMap,
  camera: MinimapCameraInput | null,
  cities?: MinimapCityInput[],
  units?: MinimapUnitInput[],
  options?: GetMinimapDataOptions,
): MinimapData;
```

### MinimapCameraInput (bez Three.js)

```typescript
{ targetX: number; targetZ: number; distance?: number; fov?: number; aspect?: number }
```

### Wpięcie w HudConfig (MASTER)

```typescript
getMinimapData: () => getMinimapData(
  gameMap,
  { targetX: camTarget.x, targetZ: camTarget.z, distance: camDist, aspect: canvasAspect },
  cityNodes.map(c => ({ q: c.q, r: c.r, ownerColor: playerColors[c.ownerId], isOutpost: c.isOutpost })),
  units.map(u => ({ q: u.q, r: u.r, ownerColor: playerColors[u.ownerId] }),
  { playerColors },
),
onMinimapClick: (q, r) => camera.panToHex(q, r),
```

---

## DoD

- [x] Zwraca `cols`/`rows`/`hexes[]` z kluczami terenu zgodnymi z `TEREN_KOLOR` w hud.ts (`Laka`, `Morze`, …)
- [x] `ownerColor` z `hex.wlasciciel` + override miast/jednostek
- [x] Opcjonalny `viewport` z pozycji kamery
- [ ] MASTER wpina do kanonu (main.ts + hud.ts) — poza MAPA

---

## Kiedy handoff gotowy

**GOTOWE** — UI/MASTER może konsumować od razu.
