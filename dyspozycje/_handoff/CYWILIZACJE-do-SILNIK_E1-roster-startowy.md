# CYWILIZACJE → SILNIK: E1 roster startowy (E1-D-Q1=A)

**Status:** **WPIĘTE** (2026-06-27 ~21:10) · ROBOCZA md5 `eada39d752b561d7779ae8813b03e85d`  
**Decyzja Macieja:** E1-D-Q1=**A** (2026-06-27)

---

## Co przesyłam

Moduł `gra/src/game/civ-roster.ts`:

```typescript
import { assignAiCivTypes, civIdsFromRoster } from './game/civ-roster';
import { aktywneTypyFromMapLabel } from './map/newGameMapDefaults';
```

Test: `node gra/tools/civ-roster-test.cjs`

---

## Co Odbiorca ma zrobić

Zastąpić **round-robin** w `main.ts` (2 bloki: init ~L359–387 i `generujSwiat` ~L3473–3490):

```typescript
const allCivIds = civIdsFromRoster(data.civs.cywilizacje as any[]);
const aktywneTypy = aktywneTypyFromMapLabel(_menuMapSizeLabel); // lub z params map label
const aiMap = assignAiCivTypes({
  allCivIds,
  playerCivId: _menuCivId,
  aiOwnerIds: aiOwnerIdsSorted,
  aktywneTypy,
  seed: newSeed, // ten sam seed co mapa
});
for (const [oid, civ] of aiMap) aiOwnerCivMap.set(oid, civ);
```

Po `applyMenuParams` — **przelicz** `aiOwnerCivMap` tym samym seedem z aktualnym `_menuCivId` (nie round-robin civIdx).

---

## DoD

- [ ] Standard 6 rywali → 7 unikalnych typów w puli (gracz + 6 AI)
- [ ] Mała 2 rywali → 3 typy max
- [ ] Ten sam seed → ten sam skład typów
- [ ] `civ-roster-test.cjs` + bramka ZIELONE

*— Grupa D, 2026-06-27*
