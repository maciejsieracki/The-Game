# HANDOFF: UI + MAPA → SILNIK — batch D1B + A4 (Grupa A decyzje)

**Data:** 2026-06-27  
**Status:** **WPIĘTE** w `main.ts` (2026-06-27 F-HUD-2) · bramka ROBOCZA  
**Decyzje Macieja:** ABC1=A · A1-Q11=A · A2-Q4=A · A4-D4-Q1=A · A4-Q1=A · A1-Q9=A

---

## Co dostarczono (NIE ruszano main.ts)

### MAPA

| Plik | Zmiana |
|------|--------|
| `gra/src/map/improvement-build.ts` | Pełna kwalifikacja: pastwisko=wymaga złoża zwierzęcego; plantacja=`zloze=luksus`; tarasy=tylko `playerCivArchetype=inkowie`; warzelnia=wybrzeże lub `zloze=sol` |
| `gra/src/map/gen-helpers.ts` | Nowe złoża: owce, bydło, lama, luksus, sól (`hex.zloze` lub nakładka) |

### UI (nowe moduły)

| Plik | Rola |
|------|------|
| `gra/src/ui/buildModeHud.ts` | Panel 15 ulepszeń + banner trybu 🔨 |
| `gra/src/ui/unitPanelHud.ts` | Panel jednostki [H] (A2-Q4) |
| `gra/src/ui/bottomBarHud.ts` | WYKONAJ + Koniec tury + brama |
| `gra/src/ui/mapToolbarHud.ts` | Toolbar [C] imperium + Budowa |
| `gra/src/ui/hud.ts` | Orkiestracja D1B (haki poniżej) |
| `gra/src/ui/sidePanelHud.ts` | `blocking` na chipach (A1-Q9) |

---

## Kontrakt wpięcia w `main.ts` (SILNIK)

```typescript
import { showHud, updateHud } from './ui/hud';
import {
  createImprovementBuildApi,
  collectRoadKeys,
  type ImprovementBuildRequest,
} from './map/improvement-build';

// Stan trybu budowy
let buildModeOpen = false;
let activeImprovementKey: ImprovementKey | null = null;
let buildApi = createImprovementBuildApi({ map, cityNodes, roadKeys: collectRoadKeys(map), playerCivArchetype: player.archetyp }, { activeKey: null });

showHud({
  getState: () => ({ /* zloto, praca, kultura, kulturaRate, … */ }),

  // A1-Q9 — dolny pasek D1B
  onExecutePending: () => { /* pierwsze blocking wydarzenie */ },
  canEndTurn: () => blockingCount === 0,
  getBlockingCount: () => blockingCount,
  getYearLabel: () => `${year} p.n.e.`,
  onEndTurn: () => endTurn(),

  // Toolbar [C]
  mapToolbar: {
    onOpenCities, onOpenScience, onOpenCulture, onOpenReligion,
    onOpenWonders, onOpenDiplomacy, onOpenArmy,
    onOpenBuild: () => { buildModeOpen = !buildModeOpen; updateHud(); },
  },

  // A4 — tryb budowy
  buildMode: {
    listTypes: () => buildApi.listTypes(),
    getActiveKey: () => activeImprovementKey,
    onSelectType: (key) => { activeImprovementKey = key; /* podświetl getQualifyingHexes */ },
    onExit: () => { buildModeOpen = false; activeImprovementKey = null; },
    isOpen: () => buildModeOpen,
  },

  // A2-Q4 — panel jednostki
  unitPanel: {
    getUnit: () => selectedUnit ? { name, subtitle, icon, atk, def, mov, rng, hp, hpMax, actions } : null,
    onAction: (id) => { /* ruch, atak, … */ },
    onClose: () => { clearSelection(); },
  },

  getEvents, onEventClick, onEventDismiss,
  getWarsWithPlayer, getMinimapData, onMinimapClick,
});
```

### Raycaster mapy (A4)

Gdy `buildModeOpen && activeImprovementKey`:
1. `buildApi.getQualifyingHexes(key)` → zielone overlay (scene.ts)
2. Klik → `buildApi.createBuildRequest(key, q, r)` → kolejka tury / koszt Pracy (EKONOMIA)
3. Po ukończeniu → `hex.ulepszenie` + `buildImprovement()` render

### Odświeżanie

Po każdej turze / zmianie stanu: `updateHud()`.

---

## DoD SILNIK

- [ ] `showHud` z hakami D1B (toolbar + bottom bar + build + unit)
- [ ] Tryb budowy: raycaster + podświetlenie + `ImprovementBuildRequest`
- [ ] Klik własnej jednostki → `unitPanel`
- [ ] `getBlockingCount` / `canEndTurn` / `onExecutePending`
- [ ] `playerCivArchetype` w `ImprovementBuildState` (tarasy Inkowie)
- [ ] Build `/tmp/civ-dist` + bramka testów
- [ ] Opus review → kanon

**Flaga:** GOTOWE (lane) · CZEKA batch SILNIK
