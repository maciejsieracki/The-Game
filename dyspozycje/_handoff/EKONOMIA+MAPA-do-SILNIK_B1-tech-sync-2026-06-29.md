# EKONOMIA + MAPA → SILNIK: B1 tech sync + UX + koszt miasta (2026-06-29)

| Pole | Wartość |
|------|---------|
| **Status** | **→ MASTER: GOTOWE-ROBOCZA** (2026-06-29) |
| **Decyzje Macieja** | `docs/decyzje/B1-tech-MACIEJ-2026-06-29.md` |
| **Lane** | moduły + JSON + UI gotowe · **Ty: `main.ts` + ROBOCZA** |

---

## Co lane dostarczył

| # | Zmiana | Pliki |
|---|--------|-------|
| 1 | **Rolnictwo + Łowiectwo** w drzewku | `gra/data/tech.json` |
| 2 | **Fort → Wojskowosc** | `terrain-improvements.json` |
| 3 | Usunięte aliasy Rolnictwo/Łowiectwo | `improvement-tech.ts` + `getImprovementLockHint()` |
| 4 | Podgląd 🔒 na hover (ulepszenia + banner) | `buildModeHud.ts`, `improvement-build.ts` |
| 5 | Koszt miasta **20 P + 1 👤** (moduł) | `city-founding.ts`, `miasto-params.json` |

**Test:** `node tools/grupa-b-lane-test.cjs` — **37 pass, 0 fail** (2026-06-29).

---

## Batch F-B-TECH-SYNC-29 — `main.ts`

### A) Hook panelu Budowa — przekaż `lockHint` (automatycznie jeśli listTypes z improvement-build)

`createImprovementBuildApi` już zwraca `lockHint` — upewnij się że `listTypes` w buildModeHud nie filtruje pól.

### B) Koszt założenia miasta — **Maciej ABC 2026-06-29**

**FOUND-Q1 = A+B** · **FOUND-Q2 = A**

```typescript
import {
  evaluateFoundCityAffordance,
  foundCityCostLabel,
  isSubsequentFoundCity,
} from './game/city-founding';
```

W `tryFoundPlayerCityAt` **przed** `foundCityAt`:

```typescript
const playerCities = cities.filter(c => c.ownerId === 0);
const aff = evaluateFoundCityAffordance(_lastPraca, playerCities, 0);
if (!aff.ok) {
  showHintMessage(aff.reason ?? 'Nie stać', 3000);
  return false;
}
_lastPraca -= aff.kosztPraca;
if (aff.sourceCityId) {
  const src = cities.find(c => c.id === aff.sourceCityId);
  if (src) src.population = Math.max(1, src.population - aff.kosztLudnosc);
}
```

HUD Budowa (`buildMode` w `initHud` / `main.ts` ~2523):

```typescript
canFoundCity: () => {
  const pc = cities.filter(c => c.ownerId === 0);
  if (pc.length === 0) return true; // A-START: pierwsze miasto
  return true; // FOUND-Q2A: kolejne też z panelu — blokada przez lockHint
},
getFoundCityCostLabel: () =>
  foundCityCostLabel(!isSubsequentFoundCity(cities.filter(c => c.ownerId === 0), 0)),
getFoundCityLockHint: () => {
  const pc = cities.filter(c => c.ownerId === 0);
  if (pc.length === 0) return null;
  const aff = evaluateFoundCityAffordance(_lastPraca, pc, 0);
  return aff.ok ? null : aff.reason ?? null;
},
```

**Uwaga:** dziś `canFoundCity: () => !cities.some(c => c.ownerId === 0)` ukrywa przycisk po 1. mieście — **zmień** wg powyższego (FOUND-Q2A).

**Q1=B:** bramki ulepszeń tylko z `terrain-improvements.json` — lane już tak robi; brak dodatkowego kodu w F.

### C) Playtest AC (Maciej)

- [ ] Farma szara bez Rolnictwa; hover: «Technologia: Rolnictwo»
- [ ] Po badaniu Rolnictwo → Farma aktywna
- [ ] Fort wymaga Wojskowosc (Brąz)
- [ ] Tartak wymaga Obróbka drewna (bez zmian)
- [ ] 2. miasto: 20 P + 1 ludność; 1. miasto onboarding FREE

---

## Po wpięciu

1. `npx vite build --outDir $env:TEMP\civ-dist`
2. `node tools/grupa-b-lane-test.cjs`
3. Meldunek `SILNIK-DO-MASTERA.md` + ROBOCZA md5

**Flaga:** `docs/czaty/DO-MASTERA.md` § F-B-TECH-SYNC-29
