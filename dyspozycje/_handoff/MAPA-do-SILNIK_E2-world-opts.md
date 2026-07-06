# MAPA → SILNIK: E2 — WorldGenOptions

**Status:** **GOTOWE** (2026-06-26)  
**Flaga:** `→ SILNIK: GOTOWE`

---

## API

```ts
import { generujSwiat, type WorldGenOptions } from './map/generator';

generujSwiat(seed, rozmiar, typSwiata, {
  worldDensity: { resources, rivers, desert, forest }, // DensityTier
  mapSizeMenuLabel: 'Standardowy', // skala rzek
});
```

`resolveWorldGenNumbers()` w `newGameMapDefaults.ts`:
- surowce: `0.6× / 1.0× / 1.4×` + baseline `1.35`
- rzeki: 2/5/8 na małej × skala mapy
- las/pustynia: progi drastyczne (0.5/1/2)

---

## SILNIK — wpięte

- `doStartGame`: `generujSwiat(..., { worldDensity, mapSizeMenuLabel })`
- `applyClusterStartPlan`: `civTypesCount`, `cityStatesCount` → `aktywneTypy`, `rywaleNaKlaster`

**DoD:** playtest Mało/Dużo surowców na tym samym seedzie.
