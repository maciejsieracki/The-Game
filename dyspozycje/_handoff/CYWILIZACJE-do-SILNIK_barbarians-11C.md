# CYWILIZACJE → SILNIK: barbarzyńcy / buntownicy 11=C* (2026-06-28)

**Flaga:** **→ MASTER: GOTOWE-KANON** (2026-06-30, md5 `9665790E…`) *(stary — aktualny kanon: `4602e752…`)*

**Decyzja Macieja:** pyt. 11=C* — barbarzyńcy do końca epoki przed Średniowieczem; od Średniowiecza buntownicy mapowi.

---

## Co dostarczył CYW

| Plik | Zmiana |
|------|--------|
| `gra/src/game/barbarians.ts` | `barbariansActive(turn, params, maxPlayerEra)` — cutoff era 4 |
| `gra/src/game/map-rebels.ts` | **NOWY** — `mapRebelsActive`, `trySpawnMapRebel` (stub v1.0) |
| `gra/tools/barbarians-test.cjs` | **55/55 PASS** (+ gate epoki) |

**v0.1 (Kamień–Żelazo):** max era = 3 → barbarzyńcy **cały czas aktywni** (regresja OK).

---

## SILNIK — wpięcie

### 1. Barbarzyńcy (~5101)

```typescript
// Było:
if (barbariansActive(turn, barbParams)) {

// Ma być:
if (barbariansActive(turn, barbParams, player.era)) {
```

### 2. Buntownicy mapowi (od epoki 4 — przyszłość)

```typescript
import { mapRebelsActive, trySpawnMapRebel } from './game/map-rebels';

if (mapRebelsActive(player.era)) {
  const spawn = trySpawnMapRebel({
    turn,
    maxPlayerEra: player.era,
    rngSeed: turn * 7919 + map.seed,
    map,
    occupied: occupiedKeys,
    cityCoords: cities.map(c => ({ q: c.q, r: c.r })),
  });
  // spawn != null → utwórz jednostkę rebelianta (ownerId z society-breakdown)
}
```

Powiązanie z `cities.rebelState` / `order.ts` — osobny batch gdy Średniowiecze wejdzie do menu.

---

## DoD

- [x] barbarians-test 55/55
- [ ] W v0.1 playtest: obozy nadal od tury startTurn
- [ ] Po wdrożeniu Średniowiecza: brak nowych obozów barbarzyńskich
