# Handoff EKONOMIA + UI → SILNIK — batch społeczeństwo B2 (2026-06-27)

| Pole | Wartość |
|------|---------|
| **Status** | **GOTOWE** moduły lane · **CZEKA** wpiecie `main.ts` |
| **Decyzje** | 1C, 2A, 3, 4C, B2-Q12=C |
| **Batch** | F-B2-society-pct |

---

## Co dostarczone (lane — bez main.ts)

| Plik | Zawartość |
|------|-----------|
| `gra/src/game/society-breakdown.ts` | **NOWY** — `computeHappinessBreakdown`, `computeLawBreakdown`, `computeOrderPctBreakdown`, `evaluateOrderFromBreakdown`, `updateRevoltGrace`, `happinessBucketsFromPct` |
| `gra/src/game/cities.ts` | `okolicaFocus/Tryb/Reczne`, `revoltGraceRemaining`, `rebelState` |
| `gra/src/game/okolica.ts` | `wagiForFocus`, `resolveWorkedTiles`, `adjustTileWorker` |
| `gra/src/game/turn-economy.ts` | `cityWorkedTilesForEconomy` → `resolveWorkedTiles` |
| `gra/src/game/auto-manage.ts` | auto-assign z `wagiForFocus(city.okolicaFocus)` |
| `gra/data/society-params.json` | `szczescie_bonus_luksus_*`, sekcja `prawo` |
| `gra/src/ui/orderPanel.ts` | UI % Sz/Prawo/Porządek, alert grace |
| `gra/src/ui/cityPanel.ts` | koszyki z `szPct`, sekcja Porządek % |
| `gra/tools/society-breakdown-test.cjs` | testy (26+) |

Test: `cd gra && node tools/society-breakdown-test.cjs`

---

## Wpiecie main.ts — ZASTĄP blok SZCZĘŚCIE/PORZĄDEK (~L2487–2531)

### 1. Importy (góra pliku)

```typescript
import {
  evaluateOrderFromBreakdown,
  updateRevoltGrace,
  revoltWarningMessage,
  orderEffectsFromPorPct,
  tierFromPorPct,
  REBEL_FACTION_OWNER_ID,
  REVOLT_CRITICAL_POR_PCT,
} from './game/society-breakdown';
import { orderEffectsToYieldMults } from './game/order';
```

### 2. Licz garnizon per miasto (przed pętlą miast lub inline)

```typescript
function garnizonCountForCity(cityId: string, cityQ: number, cityR: number): number {
  return units.filter(u =>
    u.ownerId === cities.find(c => c.id === cityId)?.ownerId &&
    u.q === cityQ && u.r === cityR
  ).length;
}
```

*(Dostosuj do struktury `units` w main.)*

### 3. W pętli miast — zamiast `evaluateOrder({ szczescie, prawo: 0 })`

```typescript
const builtIds = cityBuilt.get(cid) ?? [];
let haBuildings = 0;
for (const bid of builtIds) { /* jak dziś */ }

const podzial = city.podzialHandlu ?? DEFAULT_PODZIAL_HANDLU;
const gCount = garnizonCountForCity(cid, city.q, city.r);

const ordPct = evaluateOrderFromBreakdown(
  {
    difficulty,
    era: player.era,
    population: city.population,
    buildingZadowolenie: haBuildings,
    haKult,
    haRel,
    haWealth: econTick ? econTick.wealthZadowolenie : 0,
    podzialHandlu: podzial,
    atWar: /* diplomacy wojna owner 0 */,
    hasSwiatynia: builtIds.includes('swiatynia'),
    hasAmfiteatr: builtIds.includes('teatr'), // jeśli jest
  },
  {
    difficulty,
    era: player.era,
    garnizonCount: gCount,
    hasPretorium: builtIds.includes('pretorium'),
    hasSad: builtIds.includes('sad'),
    brakGarnizonuKara: city.population >= 6 && gCount === 0,
  },
  data.societyParams,
  difficulty,
);

const orderEff = ordPct.effects;
const tier = ordPct.tier;

// B2-Q12 grace + rebelia
const graceUpd = updateRevoltGrace(city.revoltGraceRemaining, ordPct.porPct);
city.revoltGraceRemaining = graceUpd.revoltGraceRemaining;
if (graceUpd.shouldTriggerRebellion && city.ownerId === 0) {
  city.rebelState = true;
  city.ownerId = REBEL_FACTION_OWNER_ID; // lub mapa rebelOwner
  console.log(`[Rebelia] ${city.name} → frakcja rebeliantów`);
}

// Migracja — tylko gdy NIE grace i NIE rebelia
let buntFlag = false;
if (!graceUpd.revoltWarning && !city.rebelState && orderEff.revoltRisk > 0 && rng() < orderEff.revoltRisk) {
  /* pickRevoltMigrationTarget jak dziś */
}

cityOrderState.set(cid, {
  szczescie: ordPct.sz.netto,
  porzadek: ordPct.prawo.netto,
  szPct: ordPct.sz.szPct,
  prawPct: ordPct.prawo.prawPct,
  porPct: ordPct.porPct,
  bandLabel: ordPct.bandLabel,
  szLines: ordPct.sz.lines,
  prawLines: ordPct.prawo.lines,
  progT1: op.progT1,
  progT2: op.progT2,
  bunt: buntFlag || undefined,
  revoltGraceRemaining: graceUpd.graceTurnsLeft,
  revoltWarning: graceUpd.revoltWarning,
  rebelState: city.rebelState,
});

orderValueMap.set(cid, ordPct.porPct); // pickRevoltMigrationTarget sortuje po PorPct
growthMultMap.set(cid, orderEff.growthMult);
orderMultMap.set(cid, orderEffectsToYieldMults(tier, orderEff));
```

### 4. collectTurnEvents — alert krytyczny B2-Q12

```typescript
if (st?.revoltWarning && st.revoltGraceRemaining != null && st.revoltGraceRemaining > 0) {
  events.push({
    id: 'revolt-warn-' + city.id,
    icon: '⚠',
    title: 'KRYTYCZNE: ' + city.name,
    subtitle: revoltWarningMessage(city.name, st.revoltGraceRemaining),
    kind: 'city',
    blocking: true,
  });
}
// istniejący revolt-* dla migracji zostaje
```

### 5. executeFirstBlockingEvent

Obsłuż `revolt-warn-*` → otwórz panel miasta (jak `revolt-*`).

### 6. Save/load

W serializacji miasta dopisz: `okolicaFocus`, `okolicaTryb`, `okolicaReczne`, `revoltGraceRemaining`, `rebelState`.

### 7. Okolica UI (opcjonalnie w tym batchu)

Hooki w `configureCityPanel`:
- `onOkolicaFocusChange(cityId, focus)`
- `onTileWorkerAdjust(cityId, q, r, delta)` → `adjustTileWorker`

---

## DoD SILNIK

- [ ] `evaluateOrderFromBreakdown` zamiast `evaluateOrder({ prawo:0 })`
- [ ] `cityOrderState` z polami `%` (panel od razu działa)
- [ ] Grace 2 tury + event `revolt-warn-*`
- [ ] Rebelia po grace (ownerId rebel)
- [ ] Garnizon liczony z jednostek na heksie
- [ ] `node tools/society-breakdown-test.cjs` ZIELONE
- [ ] Build `/tmp/civ-dist` + smoke

---

## Kolejność batchy

1. **Ten batch** — society % + grace (bez UI okolica +/-)
2. **Następny** — okolica focus radio + 👤 (UI + hooki)
3. **CYWILIZACJE** — `buildings.json` pole `luksus` (Pałac, Port…)

---

## Flaga

**GOTOWE** (lane) → **WPIĘTE** SILNIK 2026-06-27 (F-B2-society-pct)
