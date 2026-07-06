# CYWILIZACJE → INTEGRATOR + UI: dyplomacja BBBB + params batch

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **GOTOWE (lane D)** · czeka wpięcie Integrator + UI |
| **Data** | 2026-06-30 |
| **Od** | Grupa D (CYWILIZACJE) |
| **Do** | Integrator (main.ts) + UI (diplomacyAudience) |
| **Flaga** | **1 batch main.ts** po UI |

---

## Co dostarczyła Grupa D (✅)

### Parametry Panel-D → kod (bez main.ts)

| Obszar | Pliki | Efekt |
|--------|-------|-------|
| Progi propozycji v1.1 | `diplomacy.json` + `diplomacy.ts` | `getEffectiveDiplomacyParams()` — 20 nowych kluczy |
| Progi AI dyplomacji | `ai-params.json` + `ai.ts` | `loadDefaultAIDiplomacyProgs()` — czyta Panel-D |
| Opis Armia w Power | `power-params.json` | suma M × pkt (dokumentacja) |

**Maciej:** zmiana w `Panel-D.xlsx` → **eksportuj panel** → działa bez rebuildu logiki (JSON bundlowany).

### Moduły gotowe wcześniej

- `gra/src/game/diplomacy-display.ts` — tagi, ratio „2:1”, tooltip Respekt
- Handoff UI: `CYWILIZACJE-do-UI_dyplomacy-relation-display-v2.md`

---

## INTEGRATOR — DoD (main.ts)

1. **`openDiplomacyAudience` → `getState()`** — rozszerzyć stan:
   ```typescript
   import {
     diplomacyPersonalityTags,
     formatPowerRelationLine,
     respektTooltipPl,
   } from './game/diplomacy-display';

   const powerLine = formatPowerRelationLine(
     objectivePowerForOwner(0),
     objectivePowerForOwner(ownerId),
   );
   // respekt: powerLine.respekt (z Power P-A, nie stary % relacji)
   // powerRatioLabel: powerLine.ratioLabel
   // personalityTags: diplomacyPersonalityTags(civKeyForOwner(ownerId))
   ```

2. **Opcjonalnie:** zamienić `void _diplomacyParams` na `resetEffectiveDiplomacyParamsCache()` + merge — **nie wymagane** (D czyta JSON przy bundlu).

3. Build + bramka: diplomacy*, ai-test, smoke.

---

## UI — DoD (diplomacyAudience.ts)

Patrz `CYWILIZACJE-do-UI_dyplomacy-relation-display-v2.md`:

- Pola stanu: `relacjaTotal`, `playerPower`, `otherPower`, `powerRatioLabel`, `personalityTags`
- Render: linia Moc + tagi przy portrecie AI
- Tooltip Respekt: `respektTooltipPl()`

**NIE ruszać** `main.ts`.

---

## Kolejność

1. UI (typ + render)
2. Integrator (dane w getState)
3. Opus review → kanon

---

## Testy lane D (przed handoffem)

```bash
cd gra
node tools/diplomacy-proposal-test.cjs
node tools/diplomacy-test.cjs
node tools/ai-test.cjs  # jeśli dotyczy decideAIDiplomacy
```

**Flaga:** GOTOWE / CZEKA INTEGRATOR
