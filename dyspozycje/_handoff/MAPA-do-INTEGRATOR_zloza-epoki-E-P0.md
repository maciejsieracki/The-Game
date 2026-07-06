# MAPA → INTEGRATOR — Złoża metali per epoka (E-P0-04/05)

**Data:** 2026-06-29  
**Decyzja:** ABC 8=B* (miedź epoka 2, żelazo epoka 3, tylko Góry)  
**Status:** **→ INTEGRATOR: GOTOWE** (generator + render; overlay w main wymaga epoki gracza)

## Co dostarcza MAPA

| Plik | Zmiana |
|------|--------|
| `gra/src/map/gen-helpers.ts` | `miedz`/`zelazo` zamiast `ruda`; tylko `TerenBazowy.Gory`; `zlozeMinEra` |
| `gra/src/map/deposit-era.ts` | `isDepositVisible`, `visibleZloze`, `countHiddenMetalDeposits` |
| `gra/src/render/styleResources.ts` | Wizualizacja `miedz` / `zelazo` |
| `gra/src/game/resource-access.ts` | Opcjonalny `currentEra` w `getResourceAccessForCity` |
| `gra/src/map/improvement-build.ts` | Kopalnia: Góry + złoże metalu/węgla (bez Wzgorza) |
| `gra/tools/map-deposits-era-test.cjs` | Test regresji generatora |

## Batch w `main.ts`

### 1. `rebuildResourceOverlays()`

Przed renderem złoża sprawdzić epokę gracza (human):

```typescript
import { visibleZloze } from './map/deposit-era';

const era = currentPlayerEraNumber(); // kamien=1, braz=2, zelazo=3
const zlozeShown = visibleZloze(hexZ, era);
if (!hasNakladka && !zlozeShown) continue;
const ov = buildStyledResourceOverlay(hex.nakladka, GAME_MAP_RENDER_STYLE, zlozeShown);
```

Po awansie epoki: `rebuildResourceOverlays()` (hook na `awansEpoki` jeśli jeszcze brak).

### 2. Panel miasta / `getResourceAccessForCity`

Przekazać `currentEra` zamiast domyślnego `99`.

## Test

```bash
cd gra && node tools/map-deposits-era-test.cjs
```

## DoD

- [ ] Era Kamień: brak overlay miedzi/żelaza
- [ ] Era Brąz: miedź widoczna tylko na Górach
- [ ] Era Żelazo: żelazo widoczne; zero metali na Wzgorzach
- [ ] Test `map-deposits-era-test.cjs` ZIELONY
