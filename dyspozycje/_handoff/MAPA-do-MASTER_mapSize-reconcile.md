# HANDOFF: Reconcile mapSize menu ↔ generator (MAPA → MASTER)

Data: 2026-06-26  
Status: **GOTOWE** (lane MAPA + UI-params) — **wymaga 1 batch SILNIK w `main.ts`**

## Problem

- `gra/src/map/generator.ts` — **5 rozmiarów** kanonicznych (`ROZMIAR_DIMS`: malenki…ogromny, ~1000/2000/5000/10000/20000 hex).
- `gra/src/main.ts` — lokalne `mapSizeToDims()` ma **4 stopnie** i **stare wymiary tymczasowe** (30×22, 50×36, 80×55, 100×70); brak `malenki`.
- `gra/data/ui-params.json` — było 3 opcje (Mała/Średnia/Duża) — **naprawione przez MAPA** na 5 (Malenki…Ogromny).

Decyzja Macieja (DZIENNIK 2026-06-26): 1000/2000/5000/10000/20000 hex.

## Co dostarczył lane MAPA (już w repo)

| Plik | Zmiana |
|------|--------|
| `gra/src/map/generator.ts` | `export ROZMIAR_DIMS`, `ROZMIAR_MENU_LABELS`, `rozmiarFromMenuLabel()`, `rozmiarToDims()`, `menuLabelToDims()` |
| `gra/data/ui-params.json` | 5 opcji menu + opisy w×h zgodne z generatorem; domyślny: **Standardowy** (idx 2) |
| `gra/src/mappreview/main.ts` | import `ROZMIAR_DIMS` z generatora (DRY) |

## Patch dla MASTER — `gra/src/main.ts` (1 batch)

### 1. Import (przy istniejących importach z `./map/generator`)

```typescript
import {
  generateMap,
  generujSwiat,
  rozmiarFromMenuLabel,
  menuLabelToDims,
  type RozmiarSwiata,
  type TypSwiata,
} from './map/generator';
```

*(Dostosuj do aktualnej listy importów — nie duplikuj `generateMap`.)*

### 2. Usuń lokalną funkcję `mapSizeToDims` (~linie 2562–2573)

Zastąp wywołania importem `menuLabelToDims`.

### 3. `applyMenuParams` — domyślny rozmiar

```typescript
// BYŁO:
_menuMapSize = params.mapSize || 'Średnia';

// MA BYĆ:
_menuMapSize = params.mapSize || 'Standardowy';
```

### 4. `doStartGame` — generacja mapy z kanonu MAPA

```typescript
// BYŁO:
const { w: newW, h: newH } = mapSizeToDims(_menuMapSize);
const newSeed = Math.floor(Math.random() * 1e9);
const newMap = generateMap(newW, newH, newSeed);

// MA BYĆ (preferowane — seed + typ w jednym API):
const rozmiar: RozmiarSwiata = rozmiarFromMenuLabel(_menuMapSize);
const typSwiata: TypSwiata = 'kontynenty'; // TODO: gdy UI doda wybór typu mapy
const newSeed = params.seed || Math.floor(Math.random() * 1e9);
const newMap = generujSwiat(newSeed, rozmiar, typSwiata);

// ALTERNATYWA minimalna (tylko wymiary):
// const { w: newW, h: newH } = menuLabelToDims(_menuMapSize);
// const newMap = generateMap(newW, newH, newSeed, typSwiata);
```

**Uwaga:** `params.seed` z kreatora (`newGameFlow`) powinien być użyty zamiast losowania w `doStartGame` — dziś seed z UI jest ignorowany.

### 5. Weryfikacja po wpieciu

```powershell
cd gra
npx tsc --noEmit
node tools/smoke.cjs
```

Playtest: Nowa Gra → każdy z 5 rozmiarów → sprawdź liczbę hexów (~988 / ~1998 / ~5040 / ~10080 / ~19992).

## DoD (MASTER)

- [ ] Brak lokalnego `mapSizeToDims` w `main.ts`
- [ ] Menu 5 opcji → mapa o wymiarach z `ROZMIAR_DIMS`
- [ ] Domyślny start: Standardowy (84×60)
- [ ] Legacy etykiety (Mała/Średnia/Duża) nadal mapują przez `rozmiarFromMenuLabel` (kompat wsteczna)
- [ ] Build + smoke OK przed kanonem

## Flaga

**GOTOWE** — lane MAPA/UI. **CZEKA** na batch MASTER (`main.ts`).
