# HANDOFF: UNITS → SILNIK — AI oblężenie 3 poziomy (C3-Q2)

**Data:** 2026-06-27 · **Decyzja:** C3-Q2=custom (Maciej) · **Batch:** UN-P1-01  
**Pure API:** `gra/src/game/siegeAi.ts`  
**Status:** **GOTOWE** (logika + testy) · **CZEKA** wpięcie w `main.ts` (Grupa F)

---

## Co przesyłam

Deterministyczna logika wyboru postawy AI przy wrogim mieście z murem:

| Tier | Ratio armia/obrońca | Stance | Zachowanie |
|------|---------------------|--------|------------|
| **T1** | ≥ **180%** | `assault` | Szturm → preBattle natychmiast |
| **T2** | **140%–180%** | `siege_build` → `assault` | Oblężenie + machiny; szturm gdy `machinesReady≥1` lub timeout 5 tur |
| **T3** | **110%–140%** | `siege_starve` | Tylko głodzenie — **nigdy** preBattle (kapitulacja z głodu) |
| unsafe | < **110%** | `retreat` | AI nie powinno oblężenia / odwrót |

Progi tunable przez `SiegeAiParams` (domyślnie stałe w module).

**Spójność:** C3-Q1=A (gracz wybiera ręcznie) — ta funkcja dotyczy **tylko AI**. C3-Q8=C — `machinesPerTurn` w decyzji (1 + floor(armyCount/10)).

---

## API do wpięcia

```typescript
import {
  decideAISiegeStance,
  evaluateSiegeAiAction,  // alias: zwraca sam stance
  estimateArmyStrength,
  estimateDefenderStrength,
  siegeStrengthRatio,
  type AISiegeStance,
  type AISiegeDecision,
  type SiegeAiState,
  type SiegeAiParams,
  EMPTY_SIEGE_AI_STATE,
} from './game/siegeAi';

import { type SiegeUnit, type SiegeCity } from './game/siege';
```

### Główna funkcja

```typescript
function decideAISiegeStance(
  army: ReadonlyArray<SiegeUnit>,
  city: SiegeCity,
  state?: SiegeAiState,      // default EMPTY_SIEGE_AI_STATE
  params?: SiegeAiParams,
): AISiegeDecision;
```

**Zwraca:**

```typescript
interface AISiegeDecision {
  stance: 'assault' | 'siege_build' | 'siege_starve' | 'retreat';
  tier: 'T1' | 'T2' | 'T3' | 'unsafe';
  ratio: number;              // armyStrength / defenderStrength
  armyStrength: number;
  defenderStrength: number;   // garnizon + milicja + bonus mur/teren
  machinesPerTurn: number;    // C3-Q8 hint dla kolejki machin
  powod: string;              // log debug
}
```

### Stan per oblężenie (SILNIK persistuje)

```typescript
interface SiegeAiState {
  siegeTurn: number;      // 0 = pierwsza decyzja
  machinesReady: number;  // gotowe Taran/Wieża
}
```

### Mapowanie stance → silnik

| stance | SILNIK akcja |
|--------|--------------|
| `assault` | Uruchom preBattle / szturm (jawna akcja AI) |
| `siege_build` | `city.oblegane=true`, buduj machiny (`machinesPerTurn`/turę), **nie** wołaj preBattle |
| `siege_starve` | `city.oblegane=true`, tick głodu/atrycji, **nie** wołaj preBattle |
| `retreat` | Nie rozpoczynaj oblężenia / wycofaj armię |

### Konwersja runtime → SiegeUnit / SiegeCity

```typescript
// Jednostka (z units.json + runtime HP):
const siegeUnit: SiegeUnit = {
  typNazwa: def['Jednostka'],
  rola: def['Rola (linia)'],
  Atak: def.Atak,
  Obrona: def.Obrona,
  Uderzenie: def.Uderzenie ?? 0,
  Pancerz: def.Pancerz ?? 0,
  Przebicie: def.Przebicie ?? 0,
  Health: unit.hp ?? def.Health,
};

// Miasto:
const siegeCity: SiegeCity = {
  id: city.id,
  ownerId: city.ownerId,
  q: city.q,
  r: city.r,
  wallLevel: city.maMur ? (city.wallLevel ?? 1) : 0,
  garrison: [...],           // SiegeUnit[] z garnizonu
  population: city.population,
  terrain: mapHex?.terenNazwa,
};
```

---

## Co Odbiorca ma z tym zrobić

1. Przy ruchu AI na hex wroga miasta z murem (`mapSiegeDetect` → `oblezenie`):
   - Zmapuj armię + miasto na `SiegeUnit[]` / `SiegeCity`
   - Wywołaj `decideAISiegeStance(army, city, persistedState)`
2. `assault` → istniejący flow preBattle
3. `siege_build` / `siege_starve` → ustaw `oblegane`, inkrementuj `siegeTurn`, buduj machiny (T2 only)
4. Persist `SiegeAiState` per `(attackerOwnerId, cityId)` w save state

---

## DoD

- [ ] AI T1 szturmuje przy silnej przewadze
- [ ] AI T2 oblega + buduje machiny przed szturmem
- [ ] AI T3 nie woła preBattle (tylko głód)
- [ ] Gracz C3-Q1=A bez regresji (osobna gałąź UI)
- [ ] `node tools/siege-ai-test.cjs` zielone

---

## Testy

```powershell
cd gra
node tools/siege-ai-test.cjs
```

**Flaga:** GOTOWE · **→ SILNIK: GOTOWE**
