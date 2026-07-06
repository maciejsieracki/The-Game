# UI → INTEGRATOR — preBattle bonusy nacji (P0-D4)

**Data:** 2026-06-29  
**Decyzja:** D4-Q3=A (read-only opisy z civs.json)  
**Status:** **→ INTEGRATOR: GOTOWE** (moduł UI; wpięcie w `main.ts`)

## Co dostarcza UI

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/preBattle.ts` | Sekcja „Bonusy nacji” (atakujący / obrońca) — tylko `bonusy[].opis` |
| `configurePreBattle({ getCivBonusy })` | Hook jak `configureCityPanel` |

## Kontrakt

```typescript
import { configurePreBattle } from './ui/preBattle';
import type { CivBonusLite } from './game/production';

configurePreBattle({
  getCivBonusy: (ownerId: number) => civBonusyForOwnerId(ownerId),
});
```

Alternatywa per wywołanie (bez globalnego config):

```typescript
showPreBattle(pbInfo, cb, { getCivBonusy: civBonusyForOwnerId });
```

Lub bezpośrednio na `PreBattleInfo`:

```typescript
bonusyAtakujacy?: readonly CivBonusLite[];
bonusyObronca?: readonly CivBonusLite[];
```

## Batch w `main.ts`

1. Przy starcie gry (obok `configureCityPanel`):
   ```typescript
   configurePreBattle({ getCivBonusy: civBonusyForOwnerId });
   ```
2. W `preBattleSideFromRoster` — dodać `ownerId` z pierwszej jednostki rosteru:
   ```typescript
   return { nazwa, cywilizacja, ownerId: roster[0]?.ownerId, units: ... };
   ```

`civBonusyForOwnerId` już istnieje w main (~724) — ten sam callback co dla panelu miasta.

## DoD

- [ ] Pre-battle: widać do 3 bonusów atakującego i obrońcy (tekst z JSON)
- [ ] Bez liczenia mechaniki — tylko wyświetlanie
- [ ] Build + smoke OK
