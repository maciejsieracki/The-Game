# EKONOMIA → SILNIK (MASTER): integracja EKO-TECH Paczka 1 w main.ts

**Data:** 2026-07-04 · **Status:** GOTOWE (kontrakt) · **Lane:** SILNIK only

## Co przesyłam

Logika w `research.ts`, `playerState.ts`, `production.ts` — **bez** wpincia w runtime.

## Co Odbiorca ma zrobić (1 batch main.ts)

### 1. Bramka badania T-TECH-7

Zbuduj `empireBuiltIds` z `cityBuilt` (union id ze wszystkich miast gracza) i przekaż do:

- `availableTechs(data.tech, player.zbadane, { empireBuiltIds, buildings: data.buildings })` w `getAvailableTechs`
- `setPlayerResearchTarget(..., gate)` w `selectPlayerResearchSlug`
- `researchStep(player, data.tech, gate)` w end-turn

### 2. Upgrade budynków T-TECH-8 / ABC-7

W handlerze ukończenia budynku (~L1041):

```typescript
import { applyCompletedBuildingIds } from './game/production';
// zamiast blt.push(completed.id):
cityBuilt.set(cityId, applyCompletedBuildingIds(blt, completed.id, data.buildings));
```

## DoD

- [ ] Pismo niedostępne bez Cegielni w imperium
- [ ] Upgrade kręgi→świątynia: jeden slot, id `swiatynia`
- [ ] Build + logic-test + eko-tech-paczka1-test ZIELONE

## Flaga

**GOTOWE** — wpinięte w `main.ts` 2026-07-04 (batch SILNIK)
