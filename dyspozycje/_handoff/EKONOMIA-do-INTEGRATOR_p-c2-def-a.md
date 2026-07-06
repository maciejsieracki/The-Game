# GRUPA B → INTEGRATOR F: P-C2-DEF A — wpięcie pkt bitew (M wroga)

| Pole | Wartość |
|------|---------|
| **Status** | 🟡 **GOTOWE lane B** — czeka wpięcie `main.ts` |
| **Data** | 2026-07-01 |
| **Decyzja** | P-C2-DEF **A** · `docs/decyzje/P-C2-DEF-wygrana-bitwa-2026-07-01.md` |
| **Warstwa** | 🟡 cross (`main.ts` + save) |

---

## TL;DR

Po wygranej: **pkt Mocy += floor(suma M_pole przegranego składu przed walką)**. Bez bonusu underdog. Remis = 0.

Moduł pure: `battlePowerPointsFromDefeatedEnemy()` · `loadBattlePowerModel()` w `power-objective.ts`.

---

## Zmiany w `main.ts`

### 1. Stan zamiast licznika wygranych

```typescript
const battlePowerPtsByOwner = new Map<number, number>();
// save/load: meta.battlePowerPtsByOwner: Array<[number, number]>
```

### 2. `applyMapBattleOutcome` — przed `applyPostBattleMap`

```typescript
import { battlePowerPointsFromDefeatedEnemy } from './game/power-objective';
import { armyFieldPower } from './game/unit-power';

function sumRosterFieldM(roster: RuntimeUnit[]): number {
  let sum = 0;
  for (const u of roster) sum += armyFieldPower(unitDefFor(u));
  return sum;
}

// po ustaleniu mapWinner, przed stratami:
if (mapWinner === 'atakujacy' || mapWinner === 'obronca') {
  const winOid = mapWinner === 'atakujacy' ? atkRoster[0]?.ownerId : defRoster[0]?.ownerId;
  const loserRoster = mapWinner === 'atakujacy' ? defRoster : atkRoster;
  if (winOid !== undefined) {
    const pts = battlePowerPointsFromDefeatedEnemy(sumRosterFieldM(loserRoster));
    battlePowerPtsByOwner.set(winOid, (battlePowerPtsByOwner.get(winOid) ?? 0) + pts);
  }
}
```

Usuń / zastąp stare `recordBattleWin` (+1 count).

### 3. `buildObjectivePowerForOwner`

```typescript
bitwyPktSum: battlePowerPtsByOwner.get(ownerId) ?? 0,
wygraneBitwy: 0, // legacy count unused w modelu enemy_m
```

---

## Bramka

- `node tools/power-objective-test.cjs` — **11+ OK**
- `diplomacy-test.cjs` — bez regresji Respekt
- Kalibracja: 10×M≈25 → składnik bitwy ≈250

---

## UI (opcjonalnie później)

Overlay Moc: składnik „Wygrane bitwy" pokazuje **pkt** (suma M), nie liczbę potyczek.
