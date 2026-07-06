# EKONOMIA → INTEGRATOR F: D16 wiring w main.ts

| Pole | Wartość |
|------|---------|
| **Status** | 🟡 **CZEKA** |
| **Zależność** | ACK Mastera batch `D16-D17-START` |
| **Batch** | 1 × main.ts (3 punkty) |

---

## Co Odbiorca ma zrobić

Lane B dostarczył logikę bez `main.ts`. W kanonie brakuje 3 podpięć:

### 1. lawInput — bonus osady (Prawo)

W bloku `evaluateOrderFromBreakdown` (~6960):

```typescript
{
  difficulty,
  era: player.era,
  garnizonCount: gCount,
  population: city.population,  // ← DODAJ
  ...
}
```

### 2. religionHappiness — kara tylko ze świątynią

~6908:

```typescript
const haRel = religionHappiness(curRel, ownRel, rp, builtIds.includes('swiatynia'));
```

### 3. getCityHealth — woda z mapy (D17)

~4655:

```typescript
return computeCityHealthBreakdown(
  city.population, tiles, builtIds, data.societyParams, _menuDifficulty,
  { city, map },  // ← DODAJ
);
```

---

## DoD

- Playtest start: PorPct ≥ 20% w panelu miasta T1
- Miasto nad rzeką: linia „Rzeka +2”, brak „Brak wody”
- Build + bramka testów bez regresji

**Flaga:** CZEKA / GOTOWE po wpięciu
