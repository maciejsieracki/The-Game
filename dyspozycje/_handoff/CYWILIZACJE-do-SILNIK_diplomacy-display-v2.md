# CYWILIZACJE → SILNIK + UI: `diplomacy-display.ts` — 🟢 GOTOWE

**Data:** 2026-06-26  
**Decyzja:** D3-UX **BBBB**  
**Status:** moduł CYW dostarczony · **wpięcie = SILNIK + UI**

---

## Plik

`gra/src/game/diplomacy-display.ts`

## API

```typescript
import {
  diplomacyPersonalityTags,
  formatPowerRatioLabel,
  formatPowerRelationLine,
  respektTooltipPl,
} from './game/diplomacy-display';

// Tagi przy portrecie AI (D3-UX-3B)
diplomacyPersonalityTags('grecy'); // np. ['Handlowy', 'Sojuszniczy']

// Linia Moc (D3-UX-4B)
formatPowerRatioLabel(playerPower, otherPower); // "2:1"
formatPowerRelationLine(playerPower, otherPower); // { ratioLabel, respekt }

respektTooltipPl(); // tooltip paska Respekt
```

---

## SILNIK — `buildAudienceState()` / `getState()`

| Pole | Źródło |
|------|--------|
| `personalityTags` | `diplomacyPersonalityTags(civId)` |
| `playerPower`, `otherPower` | `objectivePowerForOwner` |
| `powerRatioLabel` | `formatPowerRatioLabel(...)` |
| `relacjaTotal` | `zaufanie + respekt` |
| `thresholds.sojuszZaufanie` | `loadDiplomacyParams().progSojuszZaufanie` |

**NIE edytować** `diplomacy-display.ts` z UI — UI tylko renderuje stringi.

---

## Test

`node gra/tools/diplomacy-display-test.cjs`

---

## Powiązany handoff UI

`CYWILIZACJE-do-UI_dyplomacy-relation-display-v2.md`
