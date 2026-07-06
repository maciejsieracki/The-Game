# EKONOMIA + UI → SILNIK — PILNE luki (2026-06-27)

| Pole | Wartość |
|------|---------|
| **Status** | **→ SILNIK: GOTOWE — PILNE** |
| **Priorytet** | **P0** — domknięcie częściowych decyzji Macieja |
| **Lane dostarczył** | `resource-access.ts`, `society-inputs.ts`, `army-starvation.ts`, fix nagłówka panelu |
| **Testy lane** | `node tools/grupa-b-lane-test.cjs` (rozszerzone) |

---

## Batch F-B-PILNE — jeden backup `main.ts.bak-SILNIK-20260627-pilne-luki`

Wykonać **w tej kolejności** (1 commit logiczny / 1 backup).

### 1. getResourceAccess (surowce v0.1)

**Import:**
```typescript
import { getResourceAccessForCity } from './game/resource-access';
```

**W `configureCityPanel` (oba miejsca — mapa + menu):**
```typescript
getResourceAccess: (cityId: string) => {
  const c = cities.find(x => x.id === cityId);
  if (!c) return [];
  return getResourceAccessForCity(
    {
      id: c.id,
      q: c.q,
      r: c.r,
      population: c.population,
      kulturaSkumulowana: (c as any).kultura ?? 0,
    },
    map,
    placedImprovements, // tartak → dostęp Drewno (v0.1 boolean)
  );
},
```

**DoD:** panel miasta → sekcja Surowce pokazuje ikony (bez placeholder).

---

### 2. 🔥 hex przy revoltWarning (B2-Q5=C)

**Zmiana `_cityRenderOpts` i wszystkich `cityRenderer.sync(..., { getRevolt })`:**

Było:
```typescript
getRevolt: (cityId: string) => cityOrderState.get(cityId)?.bunt === true,
```

Ma być:
```typescript
getRevolt: (cityId: string) => {
  const st = cityOrderState.get(cityId);
  return st?.bunt === true || st?.revoltWarning === true;
},
```

**DoD:** miasto w grace (2 tury) ma 🔥 nad heksen; chip KRYTYCZNE w panelu wydarzeń.

---

### 3. B2-Q8=2A — pełne wejścia happiness (Ratusz + kultura + religia)

**Import:**
```typescript
import { isForeignReligionDominant, resolveOwnCultureShare } from './game/society-inputs';
```

**W bloku `evaluateOrderFromBreakdown` (endTurn, per miasto), PRZED wywołaniem:**

```typescript
const ownCultureShare = resolveOwnCultureShare(city as any);
const foreignReligionDominant = isForeignReligionDominant(curRel, ownRel, rp);
```

**Happiness input — dodać pola:**
```typescript
ownCultureShare,
foreignReligionDominant,
```

**Law input — dodać:**
```typescript
hasRatusz: builtIds.includes('ratusz'),
```

**Kultura — po accumulateCulture użyć share zamiast 1:**
```typescript
const ccIn: CultureCity = {
  kulturaSkumulowana: (city as any).kultura ?? 0,
  ownCultureShare: resolveOwnCultureShare(city as any),
};
// ... accumulateCulture ...
const ccOut: CultureCity = {
  kulturaSkumulowana: acc.after,
  ownCultureShare: resolveOwnCultureShare(city as any),
};
(city as any).kultura = acc.after;
```

**DoD:** rozpiska Szczęścia pokazuje obca kultura/religia gdy dotyczy; Prawo +bonus za Ratusz.

---

### 4. Głód wojska −8% HP (B5-Q1)

**Import:**
```typescript
import { applyArmyStarvationHpLoss } from './game/army-starvation';
```

**Po `advanceEmpireFood` + hint (istniejący blok ~3416):**
```typescript
if (isArmyStarving(0)) {
  showHintMessage('Głód wojska — zapasy państwa ujemne!', 3000);
  const efParams = buildEmpireFoodParams(data.econParams, _menuDifficulty);
  const starv = applyArmyStarvationHpLoss(
    units,
    0,
    efParams.glodWojskaHpFrac,
    (typeId) => unitHealth(data.units.find(u => u.Jednostka === typeId) ?? {}),
  );
  if (starv.destroyedIds.length > 0) {
    for (let i = units.length - 1; i >= 0; i--) {
      if (starv.destroyedIds.includes(units[i]!.id)) units.splice(i, 1);
    }
    unitRenderer.sync(units);
    showHintMessage(`Głód: utracono ${starv.destroyedIds.length} jednostek`, 3500);
  }
}
```

**Uwaga:** `RuntimeUnit` może dostać opcjonalne `hp`/`hpMax` — zapis w save/load opcjonalny v1.1.

**DoD:** zapasy państwa < 0 → co turę −8% max HP; hp=0 → jednostka znika z mapy.

---

### 5. Rebuild ROBOCZA

```powershell
cd gra
npx vite build --outDir $env:TEMP\civ-dist
Copy-Item "$env:TEMP\civ-dist\Gra-podglad.html" "..\Gra-podglad-ROBOCZA.html" -Force
```

**Bramka:** `node tools/grupa-b-lane-test.cjs` + `node tools/society-breakdown-test.cjs` + smoke OK.

**Melduj:** `docs/czaty/DO-MASTERA.md` § B → **→ MASTER: GOTOWE-ROBOCZA F-B-PILNE**

---

## Flaga

**→ SILNIK: GOTOWE — PILNE** · Grupa F wykonuje natychmiast · Master → Opus → Maciej test panelu miasta.
