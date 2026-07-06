# EKONOMIA → SILNIK — batch F-B-city-sight + zasięg okolicy

| Pole | Wartość |
|------|---------|
| **Status** | **WPIĘTE** (2026-06-27 ~21:40) · ROBOCZA md5 `6aedd5ce5bd4f5fc1cb0f5577d2385bc` |
| **Decyzja Macieja** | Spec 2026-06-27 · `docs/decyzje/B-zasieg-miasta-fog.md` |
| **Testy** | `okolica-test.cjs` · `grupa-b-lane-test.cjs` · `civ-bonusy-test.cjs` (Grecy) |

---

## Co dostarczone (lane)

| Plik | Zmiana |
|------|--------|
| `gra/src/game/okolica.ts` | `cityRangeForPopulation` = **max(5, min(pop, 15))** · `citySightRadius(pop, kultura)` |
| `gra/src/map/territory.ts` | re-export z `okolica.ts` (jedna formuła) |
| `gra/tools/okolica-test.cjs` | test 7 zaktualizowany |
| `gra/tools/civ-bonusy-test.cjs` | WorkedTile z `terenBazowy` (fix Grecy handel) |

**Formuła:**
```text
okolicaRadius(pop) = pop<=0 ? 0 : max(5, min(pop, 15))
citySightRadius(pop, kultura) = okolicaRadius + cityBorderRadius(kultura)  // +0..3
```

---

## Wpięcie w `main.ts` (Grupa F)

**Backup:** `cp gra/src/main.ts gra/src/main.ts.bak-SILNIK-20260627-city-sight`

### 1. Import

```typescript
import { citySightRadius } from './game/okolica';
import { computeVisibleAt } from './game/visibility';
```

### 2. `currentVisible()` — miasto ≠ jednostka

Zastąp stub miasta (`DEFAULT_SIGHT`) per-miasto promieniem:

```typescript
function currentVisible(): Set<string> {
  const visible = new Set<string>();

  for (const u of units.filter(u => u.ownerId === 0)) {
    const sight = unitSightResolver(u); // już jest (A-FOG-Q1B)
    for (const k of computeVisibleAt(u.q, u.r, map, sight)) visible.add(k);
  }

  for (const c of cities.filter(c => c.ownerId === 0)) {
    const kultura = c.kulturaSkumulowana ?? 0;
    const sight = citySightRadius(c.population, kultura);
    if (sight <= 0) continue;
    for (const k of computeVisibleAt(c.q, c.r, map, sight)) visible.add(k);
  }

  if (visible.size === 0 && playerStartHex !== null) {
    return computeVisibleAt(playerStartHex.q, playerStartHex.r, map, START_REVEAL_RADIUS);
  }
  return visible;
}
```

*(Dostosuj do istniejącego `buildUnitSightResolver` / `computeVisible` — merge unii, nie duplikuj logiki.)*

### 3. Posterunek / fort (opcjonalnie v1.0.1)

Struktury z `isOutpost`/`isFort` — `cityTerritoryRadius` z `territory.ts` (+5 / +10) jako dodatkowe źródła sight.

### 4. Po założeniu miasta

`foundCityAt` → `refreshFog()` — pierwsze miasto pop=1 → **widok 5 heksów** (zgodne z `START_REVEAL_RADIUS`).

---

## Kolejność batchy Grupa B (pełna kolejka F)

| # | Batch | Handoff |
|---|-------|---------|
| 1 | F-B2-society-pct | `EKONOMIA+UI-do-SILNIK_B2-society-pct-batch.md` |
| 2 | F-B5-empire-food | zbiorczy § F-B5 |
| 3 | F-B-power | zbiorczy § F-B-power |
| 4 | F-B4-kultura-religia | zbiorczy § F-B4 |
| 5 | F-B1-okolica-ui | zbiorczy § F-B1 |
| 6 | F-B1-improvements | weryfikacja tileYield |
| **7** | **F-B-city-sight** | **ten plik** |

---

## DoD (SILNIK)

- [ ] Miasto pop 1 bez jednostek → visible **5** heksów
- [ ] Miasto pop 9 → visible **9** (+ kultura jeśli >0)
- [ ] Jednostki nadal per `unitSightResolver` (regresja A-FOG)
- [ ] Minimapa = ta sama unia visible (MAPA `getMinimapData`)
- [ ] `okolica-test.cjs` + `grupa-b-lane-test.cjs` PASS
- [ ] ROBOCZA → Master

**Flaga:** **→ SILNIK: GOTOWE**
