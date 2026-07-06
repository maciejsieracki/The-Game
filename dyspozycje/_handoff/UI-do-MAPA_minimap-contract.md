# UI → MAPA: Kontrakt `getMinimapData()` (D15=B)

**Data:** 2026-06-26  
**Od:** Grupa A  
**Do:** MAPA (przez MASTER)  
**Status:** GOTOWE — UI implementuje renderer; MAPA dostarcza dane  
**Decyzja Macieja:** D15=B — UI rysuje siatkę heksów z danych MAPY (bez duplikacji sceny 3D)

---

## Cel

Minimapa w HUD (D1=C) pokazuje przegląd mapy świata. **UI rysuje** canvas 2D; **MAPA dostarcza** spłaszczone dane heksów. Brak osobnego renderera WebGL w slocie minimapy.

Implementacja UI: `gra/src/ui/minimapHud.ts` (+ integracja w `hud.ts`).

---

## API — `getMinimapData()`

```typescript
/** Wywoływane przy każdym updateHud() (po turze / ruchu kamery). */
type GetMinimapData = () => MinimapData | null;

interface MinimapHexData {
  q: number;           // współrzędna axial Q
  r: number;           // współrzędna axial R
  teren: string;       // klucz TerenBazowy (patrz enum poniżej)
  ownerColor?: string; // CSS hex np. '#e05050'; brak = niczyje
}

interface MinimapData {
  cols: number;        // szerokość mapy w heksach (oś Q)
  rows: number;        // wysokość mapy w heksach (oś R)
  hexes: MinimapHexData[];
  viewport?: {         // opcjonalnie: ramka widoku kamery
    x: number;         // lewy górny róg viewportu w jednostkach heks (0..cols)
    y: number;         // górny róg (0..rows)
    w: number;         // szerokość viewportu w heksach
    h: number;         // wysokość viewportu w heksach
  };
}
```

**Zwróć `null`** gdy mapa niedostępna (UI pokaże placeholder).

---

## Mapowanie terenu (`teren`)

Klucze zgodne z `TerenBazowy` / `gameMap.hexes`:

| Klucz | Kolor UI (canvas) |
|---|---|
| `Laka` | `#5a9e48` |
| `Rownina` | `#9ab85c` |
| `Wzgorza` | `#7b6e50` |
| `Gory` | `#8a8a8a` |
| `Wybrzeze` | `#78b8c8` |
| `Morze` | `#2a6080` |
| `Pustynia` | `#c8b46a` |
| inne | `#3a4450` (domyślny) |

---

## Mapowanie właściciela (`ownerColor`)

```typescript
ownerColor: hex.wlasciciel
  ? playerColorMap[hex.wlasciciel]  // Record<playerId, CSS hex>
  : undefined
```

UI rysuje cienką obwódkę komórki w kolorze właściciela.

---

## Viewport kamery

MAPA powinna dostarczyć `viewport` zsynchronizowany z kamerą główną:

```typescript
viewport: {
  x: cameraHexBounds.minQ,
  y: cameraHexBounds.minR,
  w: cameraHexBounds.maxQ - cameraHexBounds.minQ,
  h: cameraHexBounds.maxR - cameraHexBounds.minR,
}
```

Współrzędne w **przestrzeni heksowej mapy** (nie piksele ekranu). UI przelicza na canvas 200×130 px.

---

## Klik na minimapie

UI wywołuje `onMinimapClick(q, r)` z przybliżonym heksem pod kursorem.  
**MAPA** powinna przesunąć kamerę główną do `(q, r)`.

---

## Przykładowa implementacja (MAPA lane)

```typescript
function getMinimapData(): MinimapData {
  const hexList = Object.values(gameMap.hexes).map(h => ({
    q: h.q,
    r: h.r,
    teren: h.terenBazowy,
    ownerColor: h.wlasciciel ? playerColorMap[h.wlasciciel] : undefined,
  }));
  return {
    cols: gameMap.szerokoscQ,
    rows: gameMap.wysokoscR,
    hexes: hexList,
    viewport: camera.getHexViewport(),  // do zaimplementowania w MAPA
  };
}
```

---

## Wpięcie (MASTER → main.ts)

```typescript
import { showHud, updateHud } from './ui/hud';

showHud({
  getState: () => ({ /* ... */ }),
  getMinimapData: () => mapModule.getMinimapData(),
  onMinimapClick: (q, r) => camera.focusHex(q, r),
  onEndTurn: () => { /* ... */ },
});
// Po turze / ruchu kamery:
updateHud();
```

---

## DoD (MAPA)

- [ ] Eksport `getMinimapData(): MinimapData | null` z lane MAPA
- [ ] Wszystkie heksy mapy w `hexes[]` (pełna siatka)
- [ ] `teren` = string klucz TerenBazowy
- [ ] `ownerColor` z mapy kolorów graczy
- [ ] `viewport` aktualizowany przy ruchu kamery
- [ ] `onMinimapClick` → MAPA przesuwa kamerę (kontrakt z MASTER)

## Uwagi

- Wariant A (`onMountMinimap` — MAPA renderuje WebGL do slotu) **pozostaje w hud.ts jako legacy**, ale **D15=B = wariant B priorytetowy**.
- Odświeżanie: przy każdym `updateHud()` — MAPA nie musi cache'ować; UI przerysowuje canvas.

— Grupa A
