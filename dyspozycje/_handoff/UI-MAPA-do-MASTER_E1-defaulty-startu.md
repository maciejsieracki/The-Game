# Handoff UI+MAPA → MASTER (SILNIK) — E1 defaulty startu

**Status:** GOTOWE (lane UI + MAPA)  
**Data:** 2026-06-26  
**Decyzje:** `docs/decyzje/E1-nowa-gra.md`

---

## Co dostarczono (lane UI + MAPA)

### UI (`newGameFlow.ts`, `ui-params.json`)

- Default cywilizacja: **Rzymianie** (`ikonaId: rzymianie`) — `civId` w `NewGameParams` to **ikonaId**, nie etykieta PL.
- Default epoka: **Kamień**; Brąz wybieralny; Żelazo locked.
- Ustawienia: trudność Normal · mapa Standardowy · prędkość Standardowa.
- **Nowe pole:** Typ świata (4 opcje: Kontynenty / Pangea / Wyspy / Ziemia).
- **Liczba rywali:** dynamiczna skala wg rozmiaru mapy (`syncRivalOptions` → `rywaleMenuForMapLabel`).

### MAPA

- `TypSwiata` rozszerzony o **`ziemia`** (`gen-helpers.ts`, `landMaskZiemia` + preset `ZIEMIA_LAND_CENTERS`).
- `generateMap(..., typ)` obsługuje `ziemia`.
- **`map/newGameMapDefaults.ts`** — kontrakt menu ↔ silnik (skala rywali, mapowanie typu świata).

---

## Co MASTER ma wpiąć w `main.ts` (1 batch)

### 1. `NewGameParams` — nowe pola

```typescript
interface NewGameParams {
  civId: string;       // ikonaId (np. rzymianie)
  epochId: string;     // kamien | braz
  typSwiata: string;   // kontynenty | pangea | wyspy | ziemia
  worldType: string;   // etykieta PL (log)
  seed: number;        // z kreatora — użyć zamiast losowego w doStartGame
  // ... reszta bez zmian
}
```

### 2. `doStartGame` — generacja mapy

```typescript
import type { TypSwiata } from './map/gen-helpers';

const typ = (params.typSwiata || 'kontynenty') as TypSwiata;
const newSeed = params.seed || Math.floor(Math.random() * 1e9);
const newMap = generateMap(newW, newH, newSeed, typ);
```

### 3. Epoka startowa Brąz

W `applyMenuParams` (lub tuż po):

```typescript
const ERA_MAP: Record<string, number> = { kamien: 1, braz: 2 };
player.era = ERA_MAP[params.epochId] ?? 1;
// opcjonalnie: odblokowane tech / budynki startowe wg epoki — osobna decyzja
```

### 4. `computeClusters` (jeśli używane przy starcie)

- `playerTyp: params.civId` (już ikonaId)
- `aktywneTypy` z `aktywneTypyFromMapLabel(params.mapSize)` — import z `map/newGameMapDefaults.ts`

---

## DoD (Master)

- [x] Start z defaultami E1 bez ręcznego wyboru (Rzym, Kamień, Normal, Standard, Kontynenty, 6 rywali).
- [x] Zmiana typu świata w menu zmienia kształt mapy (w tym Ziemia).
- [x] Bonusy Rzymu działają (`civId === rzymianie`).
- [x] Seed z ekranu generowania = seed mapy (nie nadpisywać losowym).
- [ ] Build + smoke OK — **Maciej lokalnie** (brak node w sandboxie Cursor).

**Status handoff:** WPIĘTE w `main.ts` 2026-06-26 (batch E1). **Q9–Q12 provisional** — czeka ABC Macieja (`docs/decyzje/E1-PYTANIA-DO-SILNIKA.md`).

---

## Pliki zmienione (lane)

| Plik | Lane |
|------|------|
| `gra/src/ui/newGameFlow.ts` | UI |
| `gra/data/ui-params.json` | UI/CYW |
| `gra/src/map/gen-helpers.ts` | MAPA |
| `gra/src/map/generator.ts` | MAPA |
| `gra/src/map/newGameMapDefaults.ts` | MAPA (nowy) |
| `gra/src/mappreview/main.ts` | MAPA |

**NIE ruszano:** `gra/src/main.ts`
