# UNITS → SILNIK: Moc jednostki (M) → składnik Armia w Power

| Pole | Wartość |
|------|---------|
| **Status** | **WPIĘTE** — 2026-06-30 · kanon md5 `3DAE1AA5C463CFD9E90F77C5D2DCFC76` |
| **Batch** | `UNIT-POWER-M-v1` |
| **Flaga** | GOTOWE |
| **Data** | 2026-06-30 |

---

## 1. Co UNITS dostarczyło

| Plik | Opis |
|------|------|
| `gra/src/game/unit-power.ts` | `fieldPower`, `siegePower`, `armyFieldPower`, `sumArmyFieldPower` |
| `gra/tools/unit_power.py` | mirror Python + `apply_power_cache()` |
| `gra/data/units.json` | **`fieldPower`**, **`siegePower`** (derived, auto) |
| `gra/data/combat-params.json` | sekcja **`unit_power`** (dzielniki wzorów) |
| `panele-sterowania/Panel-C.xlsx` | **Stale-moc** + **Moc-jednostek** (formuły Excel) |
| `gra/tools/unit-power-test.cjs` | testy M (Hastati=50, oblężnicze wykluczone z armii) |

**Regeneracja cache M:**
```powershell
python panele-sterowania/gen-panel-c.py    # JSON + Panel-C
python panele-sterowania/export-c.py       # po edycji statów → przelicza fieldPower
node gra/tools/unit-power-test.cjs
```

---

## 2. Co SILNIK ma wpiąć (main.ts)

### Zastąpić licznik sztuk → suma M

**Dziś** (`buildObjectivePowerForOwner`):
```typescript
jednostki: countUnitsForPowerArmy(units, ownerId, opcje),  // liczba głów
```

**Docelowo:**
```typescript
import { armyFieldPower } from './game/unit-power';
import { unitDefFor } from '...'; // istniejący loader units.json

function sumArmyPowerForOwner(ownerId: number): number {
  const opcje = loadPowerOpcje();
  let sum = 0;
  for (const u of units) {
    if (u.ownerId !== ownerId) continue;
    if (!opcje.liczyOsadnikWArmii && u.category === 'osadnik') continue;
    const def = unitDefFor(u.typeId); // dopasuj do waszego API runtime
    sum += armyFieldPower(def ?? u);  // oblężnicze → 0
  }
  return sum;
}
```

W `computeObjectivePower({ jednostki: sumArmyPowerForOwner(ownerId), ... })`.

### Opcjonalnie: militaryRatio (decyzja Maciej ABC)

Miejsca: `buildProposalEvalContext` (~3358), pętla AI dyplo (~6443).

**A:** `sumArmyPowerForOwner(proposer) / sumArmyPowerForOwner(responder)`  
**B:** zostawić headcount

### NIE ruszać

- `diplomacy.ts` → `computeRespekt` (Power ratio bez zmian)
- `power-objective.ts` (interfejs `jednostki` zostaje — zmienia się semantyka rawCount)

---

## 3. Kontrakt API `unit-power.ts`

```typescript
fieldPower(u) → { attack, defense, total }      // M_pole
siegePower(u) → { attack, defense, total }      // M_siege
armyFieldPower(u) → number                      // 0 dla Oblężnicza
sumArmyFieldPower(units[]) → number             // suma × count
isSiegeUnit(u) → boolean
loadUnitPowerCoeffs() → z combat-params.json
```

**Cache JSON:** można czytać `u.fieldPower` zamiast liczyć — `armyFieldPower` preferuje cache jeśli jest.

---

## 4. Wzory (kanon 2A)

```
M_pole:  A = AP+Obraż+Przeb+Szarża/2+AD/2 ; O = OBR+Panc+HP/2
M_siege: A = wallAttack+AD ; O = OBR+Panc+HP/10
Armia:   suma M_pole (bez Oblężnicza)
Power:   suma_armii × jednostka_wojskowa.pkt (Panel-B, domyślnie 25)
```

---

## 5. DoD SILNIK

- [x] `buildObjectivePowerForOwner` używa sumy M (nie count)
- [x] `unit-power-test.cjs` PASS (6/6)
- [x] `combat-test.cjs` 6/6 · `smoke.cjs` OK · power-objective 9/9
- [x] Spot-check: 10× Hastati → armia rawCount ≈ 500 (nie 10)
- [x] Integrator: rebuild kanon batch `UNIT-POWER-M-v1`
- [x] Meldunek: `SILNIK-DO-MASTERA.md`

---

## 6. Rekalibracja Panel-B (Maciej)

Po wpięciu sumy M współczynnik `jednostka_wojskowa.pkt` (25) może dać zbyt wysoki Power — Maciej stroi w **Panel-B Potega-P-A**, nie w `units.json`.

---

**Grupa D:** `CYWILIZACJE-do-GRUPA-D_moc-jednostek-power.md` — Respekt bez zmian kodu po wpięciu SILNIK.
