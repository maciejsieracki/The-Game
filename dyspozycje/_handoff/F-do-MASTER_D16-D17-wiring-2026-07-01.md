# F → MASTER: batch D16-D17 wiring

| Pole | Wartość |
|------|---------|
| **Status** | **→ MASTER: GOTOWE-ROBOCZA** |
| **Data** | 2026-07-01 |
| **Batch** | D16-D17-WIRING |
| **Warstwa** | 🟡 cross (main.ts only) |
| **Backup** | `gra/src/main.ts.bak-INTEGRATOR-D16-D17-2026-07-01` |
| **Poprzedni ROBOCZA md5** | `8f3c6004959c2308588c33cb47d956c4` |
| **Nowy ROBOCZA md5** | `7edba9cadfb011fd6c540fbc6bdedb72` |

---

## Wpięcie (main.ts)

### D16-A — lawInput.population

- **Już było** w kanonie: `population: city.population` w `evaluateOrderFromBreakdown` (~6967) — bez zmiany.

### D16-B — religionHappiness + świątynia

- `builtIds` przeniesione przed blok RELIGIA.
- `religionHappiness(curRel, ownRel, rp, builtIds.includes('swiatynia'))` (~6910).

### D17-A — getCityHealth + mapa wody

- Oba bloki `getCityHealth` (~4655 i ~7912): `computeCityHealthBreakdown(..., { city, map })`.

---

## Testy (PASS)

| Test | Wynik |
|------|-------|
| `society-breakdown-test.cjs` | 21/21 |
| `wire-ekonomia-test.cjs` | 34/34 |
| `smoke.cjs` | OK |
| `vite build --outDir $TEMP\civ-dist` | OK |

---

## Pliki zmienione

| Plik | Zmiana |
|------|--------|
| `gra/src/main.ts` | 3 podpięcia D16-D17 |
| `gra/src/main.ts.bak-INTEGRATOR-D16-D17-2026-07-01` | backup |
| `gra-robocza/*` | publish ROBOCZA snapshot |

---

## Co sprawdzić po wpięciu (playtest)

1. T1 pop=1: brak „Bunt skrajny”, PorPct ≥ 20%.
2. Miasto nad rzeką: linia „Rzeka +2”, brak „Brak wody”.
3. Religia obca bez świątyni: brak kary szczęścia.

---

## Blokery

— (brak)

---

## → MASTER: GOTOWE-ROBOCZA

**md5:** `7edba9cadfb011fd6c540fbc6bdedb72`  
**Start:** `gra-robocza/START.html`  
**Manifest:** `gra-robocza/ROBOCZA-MANIFEST.json`
