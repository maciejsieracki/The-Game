# HANDOFF: UI → MASTER — HUD D1=C (minimapa + panel boczny)

**Data:** 2026-06-26  
**Od:** Grupa A  
**Do:** MASTER (wpięcie main.ts + kanon)  
**Status:** GOTOWE do wpiecia  
**Decyzje:** D1=C (obecny pasek + minimapa + panel boczny), D15=B (UI rysuje z danych MAPY)

---

## Pliki (lane UI)

| Plik | Opis |
|---|---|
| `gra/src/ui/hud.ts` | Górny pasek zasobów + orchestracja minimapy i panelu bocznego |
| `gra/src/ui/minimapHud.ts` | **NOWY** — canvas minimapa (D15=B), kontrakt `getMinimapData` |
| `gra/src/ui/sidePanelHud.ts` | **NOWY** — szkielet panelu wydarzeń (D1=C) |

Backup: `gra/src/ui/hud.ts.bak-UI`

---

## API publiczne (bez zmian wstecznych)

```typescript
import { showHud, updateHud, hideHud, isHudOpen } from './ui/hud';
import type { HudState, HudConfig, MinimapData, SidePanelEvent } from './ui/hud';
```

Istniejące wywołania `showHud({ getState, onEndTurn, ... })` **działają bez zmian** — minimapa i panel boczny montują się zawsze (placeholder gdy brak haków).

---

## Nowe haki w `HudConfig` (addytywne)

```typescript
interface HudConfig {
  // ... istniejące getState, onEndTurn, onOpenCities, ...

  /** D15=B — dane heksów od MAPY (UI rysuje canvas). null = placeholder. */
  getMinimapData?: () => MinimapData | null;
  onMinimapClick?: (q: number, r: number) => void;

  /** D1=C — wydarzenia z tury od silnika. Brak = placeholder szkieletu. */
  getEvents?: () => SidePanelEvent[];
  onEventClick?: (id: string) => void;
  onEventDismiss?: (id: string) => void;

  /** Legacy wariant A — ignorowany gdy getMinimapData obecne. */
  onMountMinimap?: (el: HTMLElement, api: { width: number; height: number }) => void;
}
```

---

## Wpięcie w main.ts (MASTER)

### Krok 1 — zastąp inline HUD modułem hud.ts

```typescript
import { showHud, updateHud, hideHud } from './ui/hud';

// Po starcie gry (zamiast inline DOM HUD):
showHud({
  getState: () => ({
    zloto: player.treasury,
    zlotoRate: lastTick?.pieniadz ?? 0,
    praca: player.praca ?? 0,
    pracaRate: lastTick?.praca ?? 0,
    wplyw: player.wplyw ?? 0,
    nauka: lastTick?.nauka ?? 0,
    kultura: lastTick?.kultura ?? 0,
    zadowolenie: player.szczescie ?? 0,
    osiedla: cities.filter(c => c.ownerId === 0).length,
    osiedlaMax: 10,
    nacja: player.civName,
    tura: turn,
    epoka: player.era,
    epokaPostep: player.epokaPostep,
    badana: player.researchTarget,
  }),
  getMinimapData: () => mapGetMinimapData(),  // od MAPA — patrz handoff MAPA
  onMinimapClick: (q, r) => camera.focusHex(q, r),
  getEvents: () => turnEvents,                 // opcjonalnie — tablica SidePanelEvent
  onEndTurn: () => endTurn(),
  onOpenCities: () => { /* ... */ },
  onOpenScience: () => showSciencePicker(...),
  onOpenDiplomacy: () => showDiplomacyPanel(...),
  onOpenMenu: () => showMainMenu(...),
});

// Po każdej turze / ruchu kamery / zmianie stanu:
updateHud();
```

### Krok 2 — MAPA dostarcza getMinimapData

Kontrakt: `dyspozycje/_handoff/UI-do-MAPA_minimap-contract.md`

### Krok 3 — opcjonalnie getEvents (panel boczny)

```typescript
interface SidePanelEvent {
  id: string;
  icon: string;       // emoji lub HTML entity
  title: string;
  subtitle?: string;
  kind: 'science' | 'culture' | 'city' | 'unit' | 'enemy' | 'info';
}
```

Silnik zbiera wydarzenia z tury (zbudowano, atak, tech, itd.) → `getEvents()`.

---

## Layout (wg Makieta-HUD-mapa-swiata.html)

| Element | Pozycja |
|---|---|
| Pasek zasobów | Góra ekranu (fixed top) |
| Minimapa | Lewy-dolny: `left:70px; bottom:90px` (200×130 px) |
| Panel wydarzeń | Prawy: `top:134px; right:10px` (218 px szer.) |

---

## DoD (MASTER)

- [ ] `main.ts` używa `showHud`/`updateHud` z `hud.ts` (zamiast inline HUD jeśli jeszcze istnieje)
- [ ] `getMinimapData` podpięte od MAPA (minimapa pokazuje realną mapę)
- [ ] `onMinimapClick` przesuwa kamerę
- [ ] `updateHud()` wołane po turze i ruchu kamery
- [ ] Build: `npx vite build --outDir $env:TEMP\civ-dist` → testy → kanon po review Opus
- [ ] Panel boczny: placeholder OK na v1.0; `getEvents` opcjonalne

---

## Zależności cross-lane

| Lane | Handoff | Co dostarcza |
|---|---|---|
| **MAPA** | `UI-do-MAPA_minimap-contract.md` | `getMinimapData()` + viewport + focusHex |
| **UNITS** | `UI-do-UNITS_ux-bitwy-q2-q7-totalwar.md` | Spec Q2–Q7 bitwy (nie blokuje HUD mapy) |
| **SILNIK** | ten plik | Wpięcie showHud w main.ts |

---

## Podgląd

- `UI/Gra-podglad-HUD.html` — istniejący podgląd (do odświeżenia pozycją minimapy)
- Moduły standalone: `createMinimapHud()` / `createSidePanelHud()` eksportowane z plików źródłowych

— Grupa A
