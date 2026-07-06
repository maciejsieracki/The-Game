# UI → MASTER (SILNIK): wpięcie haków B2 — społeczeństwo w panelu miasta

**Status:** GOTOWE (UI lane) · **CZEKA** wpięcie w `main.ts`  
**Data:** 2026-06-26  
**Decyzje:** B2-Q1=A, B2-Q2=B, B2-Q3=A, B2-Q4=C (prowizorycznie), B2-Q5=A (prowizorycznie → Grupa A)

---

## Co przesyłam

### Zmiany UI (lane `gra/src/ui/*`, `gra/src/game/turn-economy.ts` export)

| Plik | Zmiana |
|------|--------|
| `cityPanel.ts` | Lewa kolumna: **Mieszkańcy** (emotikony + 3 koszyki), **Porządek inline**, **Zdrowie** (+/−); usunięci Specjaliści |
| `orderPanel.ts` | Eksport `buildOrderSectionHtml`, `orderTierUi` — współdzielone z panelem miasta |
| `turn-economy.ts` | Eksport `computeCityHealthBreakdown` + typ `CityHealthLine` |

### Nowe opcjonalne haki `configureCityPanel`

```typescript
getOrderState?: (cityId: string) => OrderState | null;
// OrderState z orderPanel.ts: { szczescie, porzadek, progT1, progT2, bunt? }

getCityHealth?: (cityId: string) => { total: number; lines: CityHealthLine[] } | null;
// CityHealthLine z turn-economy.ts
```

**Bez haków:** panel pokazuje **szacunek** (szczęście z budynków, zdrowie z `computeCityHealthBreakdown`) z badge „podgląd” / „szacunek”.

---

## Co MASTER ma zrobić w `main.ts`

1. **Mapa per-miasto po turze** (obok istniejącego logu Porządek ~l.1957–1979):
   - `Map<string, OrderState>` lub pola na `City` — zapisać `szczescie`, `porzadek`, progi, opcjonalnie `bunt`
   - `szczescie` = już liczone: budynki + kult + religia + wealth
   - `porzadek` = na razie **0** (garnizon/prawo — future); UI gotowe na >0

2. **W obu wywołaniach `configureCityPanel`** (~l.633 i ~l.2696) dodać:

```typescript
getOrderState: (cityId) => cityOrderState.get(cityId) ?? null,
getCityHealth: (cityId) => {
  const city = cities.find(c => c.id === cityId);
  if (!city) return null;
  const builtIds = cityBuilt.get(cityId) ?? [];
  const tiles = workedTilesForCity(city, map); // import z turn-economy
  return computeCityHealthBreakdown(
    city.population, tiles, builtIds, data.societyParams, _menuDifficulty,
  );
},
```

3. **Build + bramka testów** przed kanonem.

---

## DoD (kryteria akceptacji)

- [ ] Panel miasta: Mieszkańcy pokazują koszyki z **pełnego** szczęścia (nie tylko budynki)
- [ ] Porządek: badge „szacunek” znika po wpięciu `getOrderState`
- [ ] Zdrowie: suma zgadza się z tickiem (ten sam `computeCityHealthBreakdown`)
- [ ] Brak sekcji Specjaliści
- [ ] `npx tsc --noEmit` OK · testy regresji bez nowych czerwonych

---

## NIE w scope tego handoffu

- **B2-Q5=A:** chip „Bunt: [miasto]” na mapie świata → `dyspozycje/_handoff/UI-do-GRUPA-A_B2-Q5-bunt-chip.md`
- Overlay `orderPanel.ts` fixed po prawej — można ukryć gdy panel miasta otwarty (opcjonalnie)
