# CYWILIZACJE → INTEGRATOR (Grupa F): P5 przemarsz + P6 koszyk tech/surowiec

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **GOTOWE (lane D)** — czeka wpięcie F |
| **Data** | 2026-07-01 |
| **Od** | Grupa D (CYWILIZACJE) |
| **Do** | **Integrator F** — jedyny editor `main.ts` |
| **Flaga** | **1 batch** z UNITS P5-P6 · backup `main.ts.bak-INTEGRATOR-P5-P6-2026-07-01` |
| **Warstwa** | 🟡 cross (relacje, zbadane, save) |

**Decyzje:** `D3-przemarsz-kara-ABC.md` · `D3-wymiana-OTWARTE-ABC.md` (W5-A tech Rel≥100)

**Zależności lane:** UNITS `border-march-scan.ts` · UNITS `diplomacy-unit-transfer.ts`

---

## Pliki lane D (w repo)

| Plik | Test |
|------|------|
| `gra/src/game/diplomacy-border-march.ts` | `gra/tools/diplomacy-border-march-test.cjs` |
| `gra/src/game/diplomacy-basket-transfer.ts` | `gra/tools/diplomacy-basket-transfer-test.cjs` |

---

## P5 — API przemarsz

### Import

```typescript
import {
  type BorderMarchPair,
  type BorderMarchCheckContext,
  type BorderMarchParams,
  hasAuthorizedBorderCrossing,
  applyUnauthorizedBorderPenalties,
  loadBorderMarchParams,
  dedupeBorderMarchPairs,
} from './game/diplomacy-border-march';
```

### Parametr

```typescript
const borderParams: BorderMarchParams = loadBorderMarchParams();
// karaPrzemarszNieautoryzowany_zaufanie_perTura = 5 (diplomacy.json)
```

### Hook endTurn (po skanier UNITS)

```typescript
// UNITS dostarcza pary z terytorium:
const rawPairs: BorderMarchPair[] = collectUnauthorizedBorderPairs(
  units, allCityNodesByOwner, isMilitaryUnit,
);
const pairs = dedupeBorderMarchPairs(rawPairs);

const { relations, penalizedPairs } = applyUnauthorizedBorderPenalties(
  pairs,
  diplomacyRelations, // Map<string, Relation>
  borderParams,
  (pair) => ({
    treaties: activeDeals, // ActiveDeal[] silnika
    isMilitary: pair.isMilitary === true,
    relation: getDiploRelation(pair.intruderOwnerId, pair.territoryOwnerId),
  }),
);

for (const [key, rel] of relations) {
  diplomacyRelations.set(key, rel);
}
if (penalizedPairs > 0) {
  showHintMessage(`Nieautoryzowany przemarsz: −${borderParams.karaPrzemarszNieautoryzowany_zaufanie_perTura} Zauf./para`, 3500);
}
```

### Reguły (skrót)

- Kara: **−5 Zauf./turę** na parę intruz→właściciel (dedupe jednostek).
- Wyjątki: wojna, sojusz, OtwartGranice (cywil), PrawoWojskowePrzemarszu (wojsko), wasal u suzerena.
- **Nie blokuje** ruchu — tylko reputacja.

---

## P6 — API koszyk

### Import

```typescript
import {
  type BasketTransferContext,
  type SurowiecBooleanGrant,
  grantTechToOwner,
  grantSurowiecBooleanAccess,
  hasSurowiecBooleanAccess,
  createEmptyBasketTransferContext,
} from './game/diplomacy-basket-transfer';
```

### Stan gry (dodać do save/meta)

```typescript
let basketTransferCtx: BasketTransferContext = createEmptyBasketTransferContext(data.tech);

// Sync z player/AI research przy starcie:
function syncBasketResearchFromEngine(): void {
  const map = new Map<number, ReadonlySet<string>>();
  map.set(0, new Set(player.zbadane));
  for (const [oid, zbadane] of aiResearchDone) map.set(oid, new Set(zbadane));
  basketTransferCtx = { ...basketTransferCtx, researchedByOwner: map, techCatalog: data.tech };
}
```

### W `transferBasketItems` — zastąpić stub

```typescript
case 'tech': {
  const r = grantTechToOwner(item.id, toOwnerId, basketTransferCtx);
  basketTransferCtx = r.context;
  if (r.granted) {
    if (toOwnerId === 0) {
      for (const t of basketTransferCtx.researchedByOwner.get(0) ?? []) player.zbadane.add(t);
    } else {
      aiResearchDone.set(toOwnerId, new Set(basketTransferCtx.researchedByOwner.get(toOwnerId)));
    }
  }
  break;
}
case 'surowiec_boolean': {
  const r = grantSurowiecBooleanAccess(item.id, fromOwnerId, toOwnerId, basketTransferCtx);
  basketTransferCtx = r.context;
  break;
}
// jednostka → spawnTransferredUnit (UNITS)
```

### Save/load

```typescript
meta: {
  surowiecBooleanGrants: basketTransferCtx.surowiecBooleanGrants,
}
```

---

## DoD Integratora

- [ ] endTurn: pary → kary Zaufania
- [ ] transferBasketItems: tech + surowiec_boolean (nie stub)
- [ ] Poprawka `diplomacy-proposals.ts` tech: **Rel ≥ 100** (W5-A), nie progWymianaTechZaufanie 70 — osobny commit w batchu
- [ ] Testy: border-march + basket-transfer + border-march-scan + unit-transfer + smoke
- [ ] Meldunek `→ MASTER: GOTOWE-ROBOCZA`

---

## Co sprawdzić po wpięciu

1. Jednostka gracza na obcym terytorium bez traktatu → koniec tury −5 Zauf.
2. Sojusz / otwarte granice → brak kary.
3. Deal z tech w koszyku → tech w `zbadane` odbiorcy.
4. Deal z surowiec_boolean → grant aktywny w save.
