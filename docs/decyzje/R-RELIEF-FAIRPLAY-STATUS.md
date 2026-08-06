# R-RELIEF-FAIRPLAY-STATUS — relief-grid / fair-play-grid (C-MAPA-Q1=B)

**Data audytu:** 2026-08-06  
**Branch:** `cursor/fix-relief-fair-play-63a1`  
**Tip SHA:** `b1582757`  
**Decyzja nadrzędna:** C-MAPA-Q1=B — limit skupiska Gór/Wzgórz max 10 heksów (PYTANIE 63) **zostaje**; fair-play mierzy **komórkę siatki** (osobna metryka).

---

## Metryki testów (przed / po)

| Test | Baseline (handoff 2026-07-26) | Przed fixem (main, sesja 2026-08-06) | Po fixie (`b1582757`) |
|------|--------------------------------|--------------------------------------|------------------------|
| `fair-play-grid-test.cjs` | 3 pass / 5 fail | **8 pass / 0 fail** (już zielony po `807b1772`) | **8 pass / 0 fail** |
| `relief-grid-coverage-test.cjs` (Standard ×2) | — | **4 pass / 0 fail** | **4 pass / 0 fail** |
| `relief-grid-coverage-test.cjs` (Ogromny Ziemia seed 99) | — | **1 fail** — masa 446 hex: żelazo **75%** (4/5 mas) | **PASS** — iron 5/5, copper 5/5 |

### Szczegół porażki Ogromny (przed fixem)

- Mapa: 336×238, typ `ziemia`, seed 99, relief medium.
- Masa lądu 446 hexów: `ironGridCoverageRatio` = **0,75** (próg ≥ 0,85).
- Miedź: 5/5 mas OK.
- Czas generacji Ogromny: ~46 min przed fixem, ~58 min po (dodatkowe przebiegi mop-up).

---

## Przyczyna (zdiagnozowana)

1. **Kolejność pipeline'u:** `ensureDepositGridCoverage` (bootstrap złóż + `capMountainRangeClusterSize`) było wołane **po** finalnym `ensureReliefGridCoverage` — obcinało Góry poniżej pakietu żelaza (min. 4 Góry / komórka 15×15, tier medium).
2. **Niespójność filtra:** `ensureMassIronGridCoverage` filtrował `land.length`, a test — `eligibleReliefLandCount` (bez Morza/Wybrzeża).

---

## Fix (bez osłabiania progów testów)

**Pliki:** `gra/src/map/generator.ts`, `gra/src/map/gen-helpers.ts`

1. Po `ensureDepositGridCoverage` + `stripDepositsFromWater`: ponownie `capReliefClusterSizeSafetyNet` + `ensureReliefGridCoverage`.
2. Filtr komórek w `ensureMassIron/CopperGridCoverage`: `eligibleReliefLandCount >= minLand` (jak w teście).
3. `ensureReliefGridCoverage`: restore 8× (było 3×) + mop-up 16× na masy ≥150 hex.

**Zakaz spełniony:** brak `test.skip`, brak obniżania progów 85% / min. 4 Gór.

---

## Bramka determinizmu

`map-gen-regression-test.cjs` — **exit 0** (sesja 2026-08-06, ~54 min). Determinizm A=B + 0 rzek bez ujścia — bez regresji względem wymagań AC.

---

## Czy potrzeba ABC?

**NIE** — Ogromny przechodzi po fixie. ABC zapasowe (`C-MAPA-RELIEF-OGROMNY`) tylko gdy w przyszłości wróci `<85%` na wąskich komórkach przybrzeżnych.

---

## Powiązane

- `gra/src/map/gen-helpers.ts` — `MAX_MOUNTAIN_RANGE_CLUSTER_SIZE`, `RELIEF_OVERFLOW_CAP_MULT`
- Commit wcześniejszy: `807b1772` (fair-play złoża/las + domknięcie po wybrzeżu)
- Commit tej paczki: `b1582757`
