# UNITS + MAPA → INTEGRATOR F: P5 przemarsz + P6 transfer jednostki

| Pole | Wartość |
|------|---------|
| **Status** | **→ INTEGRATOR: GOTOWE** |
| **Data** | 2026-07-01 |
| **Warstwa** | 🟡 cross (endTurn + transferBasketItems) |
| **NIE** | `main.ts` w tym batchu lane |

---

## P5 — skan terytorium

### MAPA — `gra/src/map/territory.ts`

```typescript
type TerritoryNode = CityNode & { ownerId: number };

territoryOwnerAt(q, r, nodes: TerritoryNode[]): number | null
// Najbliższy węzeł w zasięgu wygrywa; remis → pierwszy w tablicy.
```

### UNITS — `gra/src/game/border-march-scan.ts`

```typescript
interface BorderMarchPair {
  intruderOwnerId: number;
  territoryOwnerId: number;
}

collectUnauthorizedBorderPairs(
  units: readonly RuntimeUnit[],
  allCityNodesByOwner: readonly TerritoryNode[],  // płaska lista z ownerId
  isMilitaryUnit: (u: RuntimeUnit) => boolean,
): BorderMarchPair[]

defaultIsMilitaryUnit(unit) // category !== 'osadnik'
```

**Wpięcie endTurn (F):**

1. Złóż `TerritoryNode[]` ze wszystkich miast/posterunków/fortów (ownerId z City).
2. `const pairs = collectUnauthorizedBorderPairs(units, territoryNodes, defaultIsMilitaryUnit)`.
3. Przekaż do CYW: `applyUnauthorizedBorderPenalties(pairs, relations, ctx)` (`diplomacy-border-march.ts`).

**Test:** `node tools/border-march-scan-test.cjs` — **11/11**

---

## P6 — spawn z koszyka

### UNITS — `gra/src/game/diplomacy-unit-transfer.ts`

```typescript
interface UnitTransferContext {
  units: RuntimeUnit[];
  capitalHexByOwner: ReadonlyMap<number, { q: number; r: number }>;
  allocateUnitId: () => string;
  getUnitDef: (typeId: string) => UnitRow | undefined;
}

spawnTransferredUnit(
  unitTypeId: string,
  toOwnerId: number,
  nearHex: { q: number; r: number } | null | undefined,
  ctx: UnitTransferContext,
): SpawnTransferredUnitResult
```

- PN koszt = `diplomacyPnJednostka(typeId)` (= `Pieniądz (koszt)` z `units.json`).
- Pozycja: `nearHex` jeśli podany, inaczej stolica odbiorcy z mapy.
- **Nie** odejmuje ¤/manpower — deal PN już rozliczony; F tylko materializuje jednostkę.

**Wpięcie transferBasketItems (F):**

```typescript
case 'jednostka':
  spawnTransferredUnit(item.id, receiveOwnerId, null, unitTransferCtx);
  break;
```

**Test:** `node tools/diplomacy-unit-transfer-test.cjs` — **13/13**

---

## Batch F (razem z CYW P5-P6)

- Backup `main.ts.bak-INTEGRATOR-P5-P6-2026-07-01`
- Bramka: 4 testy dyplomacji + smoke + build ROBOCZA
- Meldunek: `F-do-MASTER_P5-P6-2026-07-01.md`

## DoD lane

- [x] Moduły + testy zielone
- [x] Handoff ten plik
- [x] `UNITS-DO-MASTERA` → MASTER: GOTOWE
