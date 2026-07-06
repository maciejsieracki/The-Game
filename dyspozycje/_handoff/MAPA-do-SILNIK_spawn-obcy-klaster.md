# MAPA → SILNIK — pełny klaster obcych typów (MAP-P1-01)

| Pole | Wartość |
|------|---------|
| **Data** | 2026-06-27 |
| **Status** | **→ SILNIK: GOTOWE** |
| **Decyzja** | `docs/decyzje/D-START-miasta-kopie-typu.md` |
| **Handoff źródłowy** | `_handoff/CYWILIZACJE-do-MAPA_spawn-obcy-klaster.md` |
| **Batch** | MAP-P1-01 (+ CYW-P1-01 AI defensywne) |

---

## Problem (luka)

Obcy typ (`ikonaId` ≠ typ gracza) spawnował **tylko 1 stolica** zamiast pełnego klastra miast-kopii (jak u gracza: stolica + rywale tego samego typu).

## Co dostarcza MAPA

| Plik | Zmiana |
|------|--------|
| `gra/src/map/cluster-spawn.ts` | Pełny klaster obcych: wszystkie `klaster.miasta[]` → sloty spawnu; API `ForeignTypeClusterGroup` |
| `gra/src/map/clusters.ts` | Bez zmian — `computeClusters()` już rozmieszcza do `rywaleNaKlaster+1` miast per typ |
| `gra/src/game/cluster-start.ts` | Re-export `foreignTypeClusters` w `ClusterStartPlan` |
| `gra/tools/cluster-start-test.cjs` | Testy MAP-P1-01 (≥2 miasta per obcy typ) |

**NIE dotykane:** `main.ts`, `generator.ts`, `territory.ts` (brak zmian kontraktu terytorium).

---

## API kontrakt

### Wejście (bez zmian dla SILNIK)

```typescript
import { buildClusterStartPlan } from './game/cluster-start';

const plan = buildClusterStartPlan({
  map,
  civs: data.civs,
  seed,
  playerCivId,      // np. 'grecy'
  rywaleNaKlaster,  // z menu (2–8)
  aktywneTypy,      // opcjonalnie; heurystyka z rozmiaru mapy
});
```

### Wyjście — nowe pole

```typescript
interface ForeignTypeClusterGroup {
  typ: string;                              // klucz ikonaId, np. 'chinczycy'
  ownerIds: number[];                       // unikalny ownerId per miasto
  positions: Array<{ q: number; r: number }>; // hex spawnu (para z ownerIds)
}

interface ClusterStartPlan {
  // ... istniejące pola ...
  foreignTypeClusters: ForeignTypeClusterGroup[];
  spawnCities: Array<{ q, r, ownerId, name }>;  // płaska lista — już pełny klaster
  aiOwnerCivMap: Map<number, string>;            // ownerId → typ (ikonaId)
  simplifiedDiplomacyOwners: Set<number>;      // TYLKO rywale tego samego typu co gracz
}
```

### Semantyka slotów (`ClusterSpawnSlot`)

| Pole | Gracz (owner 0) | Rywal tego samego typu | Obcy typ |
|------|-----------------|------------------------|----------|
| Spawn w `spawnCities` | NIE (gracz zakłada ręcznie) | TAK | TAK |
| `isSameTypeRival` | — | `true` | `false` |
| Dyplomacja start | — | uproszczona | pełna (po kontakcie) |
| Nazwa miasta | `nazwyKlastra[0]` (hex startu) | `nazwyKlastra[1..N]` | stolica: `[0]`, rywale: `[1..N]` |
| Etykieta UI (`ownerDisplayName`) | — | nazwa miasta | nazwa nacji z JSON |

### Bezpośredni import MAPA (opcjonalny)

```typescript
import {
  buildClusterSpawnPlan,
  groupForeignTypeClusters,
  type ForeignTypeClusterGroup,
} from './map/cluster-spawn';
```

---

## Co SILNIK musi wpiąć

### 1. Konsumpcja spawnu (już częściowo w `main.ts`)

`applyClusterStartPlan()` **już iteruje** `plan.spawnCities` i woła `foundCityAt()`.  
Po tej zmianie MAPA lista zawiera **wszystkie miasta obcych klastrów** — brak dodatkowej pętli w SILNIK, o ile nie ma starego filtra „tylko stolica obcego typu”.

**Sprawdź w `main.ts`:** brak kodu typu `if (!slot.isSameTypeRival && !isCapital) skip`.

### 2. `aiOwnerCivMap` / bonusy typu

Każde miasto obcego typu dostaje ten sam `typ` w `aiOwnerCivMap` — `civBonusyForOwnerId` działa per `ikonaId`.

### 3. Dyplomacja

- `simplifiedDiplomacyOwners` — **wyłącznie** rywale typu gracza (`isSameTypeRival: true`).
- Obcy typ — **nie** dodawać do `simplifiedDiplomacyOwners`; pełna dyplomacja (CYW-P1-01).

### 4. AI defensywne (CYW-P1-01 — lane CYWILIZACJE)

MAPA dostarcza pozycje; **CYWILIZACJE** dostarcza profil `kopia_typu_obronna` w `ai.ts`:
- zero `foundCity`, zero ekspansji dla ownerów z klastra typu.

### 5. Opcjonalnie: log diagnostyczny

```typescript
console.log('[ClusterStart] obce typy:', plan.foreignTypeClusters.map(
  g => `${g.typ}×${g.positions.length}`
).join(', '));
```

---

## DoD (Definition of Done)

- [x] MAPA: obcy typ → N slotów (= `klaster.miasta.length`, docelowo `rywaleNaKlaster+1`)
- [x] MAPA: API `{ typ, ownerIds[], positions[] }` w `foreignTypeClusters`
- [x] Test: `node tools/cluster-start-test.cjs` — każdy obcy typ ≥2 miasta
- [ ] SILNIK: bramka ROBOCZA — brak filtra 1-stolica
- [ ] CYW-P1-01: AI nie zakłada 3. miasta przez 20 tur
- [ ] Playtest Maciej: Standard → ≥2 chińskie miasta AI, ten sam typ

**Flaga:** **→ SILNIK: GOTOWE** — wpięcie weryfikacyjne + build ROBOCZA
