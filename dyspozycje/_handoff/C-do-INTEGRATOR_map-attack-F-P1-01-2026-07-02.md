# GRUPA C → GRUPA F: F-P1-01 — launchFieldBattleFromMap (miasto bez muru)

| Pole | Wartość |
|------|---------|
| **ID** | **F-P1-01** |
| **Status** | **→ INTEGRATOR: GOTOWE** |
| **Data** | 2026-07-02 |
| **Od** | Grupa C (walka) |
| **Do** | **Grupa F** (wpięcie `main.ts`) |
| **Warstwa** | 🟡 cross — router mapy + preBattle + post-battle capture |
| **Spec wejściowa** | `dyspozycje/_handoff/A-do-C_map-attack-city-F-P1-01.md` |

---

## 1. Co dostarcza lane C

| Plik | Eksport |
|------|---------|
| `gra/src/battle/mapFieldBattle.ts` | **`launchFieldBattleFromMap(action, deps)`** |
| `gra/src/battle/mapFieldBattle.ts` | `planOpenCityFieldBattle`, `validateOpenCityFieldBattle` (pure, test) |
| `gra/src/units/battleRoster.ts` | `collectBattleRoster`, `collectAtkRosterNearCity` |
| `gra/src/game/siegeDefenders.ts` | `collectCityDefRoster`, `defenderSideTitle`, `militiaDefRecord` |

**NIE ruszono:** `main.ts` ✅

---

## 2. Kontrakt F — wpięcie w handler kliku mapy

### 2.1 Importy (main.ts)

```typescript
import { resolveEnemyCityClick } from './map/map-attack-city';
import { launchFieldBattleFromMap } from './battle/mapFieldBattle';
```

### 2.2 Router (zastąp gałąź ~5111–5121)

```typescript
const action = resolveEnemyCityClick({
  city: clickedCity,
  selectedUnit: sel ?? null,
  units,
  playerOwnerId: 0,
});
switch (action.kind) {
  case 'not_enemy': /* istniejąca gałąź własnego miasta */ break;
  case 'siege_panel':
    syncSiegePanelMeta(action.ctx.city);
    showSiegeMapPanel(action.ctx, siegePanelActions, siegeTurnByCity.get(action.ctx.city.id) ?? 1);
    break;
  case 'attack_choice':
    showCityAttackChoice(action.ctx, cityAttackChoiceActions);
    break;
  case 'field_battle':
    launchFieldBattleFromMap(action, mapFieldBattleDeps);
    break;
  case 'capture_empty':
    captureCityWithoutBattle(action.ctx.city, action.attacker, collectAtkRosterNearCity(...));
    break;
  case 'hint_no_adjacent':
    showHintMessage(action.cityName + ' — miasto wrogie. Ustaw jednostke na sasiednim heksie i kliknij miasto.', 4500);
    break;
  case 'hint_pick_attacker':
    showHintMessage(action.cityName + ' — kilka jednostek obok. Zaznacz ktora atakujesz, potem kliknij miasto.', 4500);
    break;
}
```

### 2.3 Obiekt `mapFieldBattleDeps`

Wstrzyknij istniejące helpery z main.ts (mirror szturmu):

| Pole deps | Źródło w main.ts |
|-----------|------------------|
| `cities`, `units`, `turn` | stan gry |
| `getTerrainAt` | `map.hexes[keyOf(q,r)].terenBazowy` |
| `getStructBonus` | `structureDefenseBonusFor(q,r)` |
| `unitDefFor`, `unitHealth`, `unitAtak` | istniejące |
| `civLabelForOwner`, `civBonusyForOwnerId` | istniejące |
| `lookupUnitDef`, `runtimeToBattleUnit` | istniejące |
| `terrainCombatData` | `terrainCombatData` |
| `battleData` | `data` |
| `showHint` | `showHintMessage` |
| `showPreBattle`, `hidePreBattle` | ui/preBattle |
| `applyMapBattleOutcomeWithSummary` | istniejąca funkcja lokalna |
| `clearBattleUiState` | clear selection + refreshFog + updateHud + syncUnitsRender |
| `createBattleScene` | `(opts) => new BattleScene(opts)` |
| `registerMilitiaDef` | `(id, def) => militiaDefOverrides.set(id, def)` |
| `onQuickSave` | `() => doQuickSave(false)` |

**Capture po wygranej:** `applyMapBattleOutcomeWithSummary` → `applyMapBattleOutcome` (bez `siegeContext`) — istniejąca gałąź auto-capture na heksie miasta + `showCityCaptureNotice`.

**Wycofaj (C1-Q5):** `onCancel` = tylko `hidePreBattle()` — ruch zachowany.

**deploy:** `true` (tymczasowo, F-P1-02 → `false`).

---

## 3. AC Integratora F (checklist)

| # | Kryterium | Jak sprawdzić |
|---|-----------|---------------|
| F-AC1 | Klik wrogie miasto **nigdy** nie otwiera panelu miasta gracza | `ownerId !== 0` → router, nie `openCityPanelForPlayer` |
| F-AC2 | Walled + adjacent → modal Oblężaj/Szturm | `attack_choice` → `showCityAttackChoice` |
| F-AC3 | Open + defenders → preBattle → bitwa | `field_battle` → `launchFieldBattleFromMap` |
| F-AC4 | Open + empty → tabliczka capture | `capture_empty` → `captureCityWithoutBattle` |
| F-AC5 | 1 adjacent bez select → działa | router auto-pick (test map-attack-city) |
| F-AC6 | Testy PASS | patrz §4 |
| F-AC7 | Bramka wizualna | mapa + atak open-city + powrót z bitwy |

---

## 4. Testy (lane C — zielone przed wpięciem F)

| Test | Wynik |
|------|-------|
| `node tools/map-attack-city-test.cjs` | **8/8** (Grupa A, bez regresji) |
| `node tools/map-field-battle-test.cjs` | **15/15** (nowy) |
| `node tools/combat-test.cjs` | bez zmian w combat.ts |
| `npx tsc --noEmit` | do weryfikacji F przy wpięciu |

---

## 5. Co sprawdzić po wpięciu (Integrator)

1. Miasto **bez muru** + Falanga na heksie + Hastati obok → preBattle (miejsce = nazwa miasta, **bez** „mur") → Ręczna → wygrana → capture + tabliczka.
2. preBattle **Wycofaj** → jednostka nadal ma ruch.
3. Miasto **z murem** → modal C3 (bez regresji szturmu).
4. **Brak** otwarcia cityPanel dla `ownerId !== 0`.

---

## 6. AC Grupy C (spełnione)

| # | Status |
|---|--------|
| C-AC1 | ✅ plan + launch: open city + defenders → preBattle path |
| C-AC2 | ✅ router `capture_empty` (logika A); `hasCityDefenders` w siegeDefenders |
| C-AC3 | ✅ brak zmian w szturmie (main.ts nietknięty) |
| C-AC4 | ✅ `canRetreat: true`, onCancel bez kosztu ruchu |
| C-AC5 | ✅ testy + ten handoff |

---

*Grupa C · F-P1-01 · lane gotowy · F = wpięcie main.ts + bramka*
