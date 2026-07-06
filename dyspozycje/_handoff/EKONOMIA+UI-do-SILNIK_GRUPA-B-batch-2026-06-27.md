# EKONOMIA + UI → SILNIK — batch Grupa B (2026-06-27)

| Pole | Wartość |
|------|---------|
| **Status** | **WPIĘTE** (2026-06-27 ~21:40) · ROBOCZA md5 `6aedd5ce5bd4f5fc1cb0f5577d2385bc` |
| **Decyzje Macieja** | B1-Q2/3/11, B4-Q1/Q2, B5-Q1/Q2, B-Power-Q1/Q2/Q3, B2 society (wcześniej) |
| **Testy** | `node tools/grupa-b-lane-test.cjs` · `node tools/society-breakdown-test.cjs` |

---

## Kolejność wpiecia w `main.ts` (osobne backupy)

| # | Batch ID | Co wpinać |
|---|----------|-----------|
| **1** | `F-B2-society-pct` | `society-breakdown` — patrz `EKONOMIA+UI-do-SILNIK_B2-society-pct-batch.md` |
| **2** | `F-B5-empire-food` | `advanceEmpireFood` po `advanceCityEconomy` |
| **3** | `F-B-power` | snapshoty Power → `computePotegaNacji` |
| **4** | `F-B4-kultura-religia` | haki `getCultureState` + `getReligionState` |
| **5** | `F-B1-okolica-ui` | haki okolica + auto-manage ON/OFF |
| **6** | `F-B1-improvements` | już w lane `tileYield` — weryfikacja save hex.ulepszenie |
| **7** | `F-B-city-sight` | `citySightRadius` w `currentVisible()` — patrz `EKONOMIA-do-SILNIK_city-sight-zasieg-batch.md` |

---

## 1. F-B5-empire-food

**Moduł:** `gra/src/game/empire-food.ts` (implementacja ticku)

**SILNIK:**
```typescript
import {
  advanceEmpireFood, bindEmpireFoodRuntime, freshEmpireFoodState,
  buildEmpireFoodParams, getEmpireFoodReserve, isArmyStarving,
} from './game/empire-food';

// init doStartGame:
const empireFoodStates = new Map<number, EmpireFoodState>();
empireFoodStates.set(0, freshEmpireFoodState(70));
bindEmpireFoodRuntime(empireFoodStates);

// endTurn po advanceCityEconomy:
const efParams = buildEmpireFoodParams(data.econParams, difficulty);
advanceEmpireFood(econResult, units, empireFoodStates, upkeepParams, efParams);
// UNITS: if (isArmyStarving(ownerId)) apply -8% maxHP
```

**UI hooks (`configureCityPanel`):**
- `getEmpireFoodState: (oid) => empireFoodStates.get(oid) ?? null`
- `getEmpireFoodTick: (oid) => getLastEmpireFoodTick(oid)`
- `onEmpireFoodSplitChange: (oid, pct) => { st.procentRozwoj = pct; }`

**Uwaga:** split **przed** wzrostem miasta (retroaktywny model) — v1.1; dziś tick dodaje do zapasów po turze.

---

## 2. F-B-power

**Moduł:** `gra/src/game/power.ts` · spec: `docs/decyzje/B-power-skladniki.md`

**SILNIK** (raz na turę per owner):
```typescript
import { computePowerContributionsCityEconomy, buildPowerSnapshots } from './game/power';

const snapshots = buildPowerSnapshots(/* miasta + terytorium + pieniadz/t */);
const ce = computePowerContributionsCityEconomy(snapshots.find(s => s.ownerId === oid)!, snapshots);
// → PotegaKomponenty: { ...ce, wielkoscArmii, wygraneBitwy, epoka } → computePotegaNacji()
```

**Terytorium:** heksy z `territory.ts` per owner (MAPA lane dostarcza count).

---

## 3. F-B4-kultura-religia

**UI gotowe:** `renderKultura` + `getReligionState` (B4-Q1=A, B4-Q2=A)

**SILNIK** — w `configureCityPanel`:
```typescript
getCultureState: (cityId) => ({ kulturaSuma, przyrost, borderRadius, thresholds, zrodla }),
getReligionState: (cityId) => ({ dominujaca, udzialPct, wplywSzczescie, zrodla }),
```

**Lane:** `culture-religion.ts` — `accumulateCulture`, `dominantReligion`, `religionHappiness`.

---

## 4. F-B1-okolica + auto-zarządca

**UI gotowe:**
- `isAutoManageEnabled(cityId)` → klasa `.active` na ⚙
- `getOkolicaState`, `onOkolicaFocusChange`, `onOkolicaRestoreAuto`, `onOkolicaTileAdjust`
- Profile: Żywność / Produkcja / Podatki / Zrównoważone

**SILNIK:**
```typescript
isAutoManageEnabled: (id) => autoManageCities.has(id),
getOkolicaState: (id) => {
  const c = cities.find(x => x.id === id);
  return c ? { focus: c.okolicaFocus ?? 'zrownowazone', tryb: c.okolicaTryb ?? 'auto', reczne: c.okolicaReczne } : null;
},
onOkolicaFocusChange: (id, focus) => { city.okolicaFocus = focus; city.okolicaTryb = 'auto'; delete city.okolicaReczne; },
onOkolicaRestoreAuto: (id) => { city.okolicaTryb = 'auto'; delete city.okolicaReczne; },
onOkolicaTileAdjust: (id, q, r, delta) => { /* adjustTileWorker from okolica.ts */ },
```

---

## 5. F-B1-improvements (B1-Q11=A)

**Moduły:**
- `terrain-improvements.ts` — bonusy JSON (15 typów)
- `economy.ts` `tileYield()` + `WorkedTile.ulepszenieKey`
- `turn-economy.ts` `hexToWorkedTile` + ranking przez `tileYield`

**Weryfikacja:** heks z `ulepszenie !== brak` → plony rosną w teście i `logic-test`.

Fort/posterunek: bonus `{}` — OK (obrona osobno UNITS/MAPA).

---

## DoD (SILNIK + F)

- [ ] Wszystkie batche 1–6 wpiete (kolejność powyżej)
- [ ] `configureCityPanel` — oba miejsca (menu + mapa) z nowymi hakami
- [ ] Save/load: `okolicaReczne`, `revoltGraceRemaining`, `empireFoodStates`
- [ ] Bramka: `grupa-b-lane-test.cjs` + `society-breakdown-test.cjs` + `logic-test.cjs` PASS
- [ ] ROBOCZA → Master

**Flaga:** **→ SILNIK: GOTOWE**
