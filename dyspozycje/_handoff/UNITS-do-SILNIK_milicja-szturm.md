# HANDOFF: UNITS → SILNIK — milicja przy szturmie (C3-Q6=A)

**Data:** 2026-06-27 · **Decyzja:** C3-Q6=A (20% populacji)  
**Pure API:** `gra/src/game/siege.ts` → `makeMilitia()`, `effectiveGarrison()`

## SILNIK: `collectSiegeDefRoster(city)` w `main.ts`

Gdy brak jednostek `ownerId===city.ownerId` w promieniu 1:

1. Wywołaj `makeMilitia(city.population ?? 0)` 
2. Konwertuj `SiegeUnit` → syntetyczny `RuntimeUnit` + `BattleUnit` dla preBattle:

```typescript
// Przykład minimalny (SILNIK dopasuje do runtimeToBattleUnit):
{
  id: 'milicja_' + city.id,
  ownerId: city.ownerId,
  typeId: 'Milicja',
  category: 'piechota',
  q: city.q, r: city.r,
  ruch: 0, ruchLeft: 0,
}
```

3. W preBattle pokaż „Milicja (N)” z HP z `makeMilitia().Health`

## DoD

- [ ] Szturm na miasto bez garnizonu wojskowego → preBattle ma obrońców (milicja)
- [ ] `node tools/oblezenie-test.cjs` zielone

**Batch:** `SIL-P0-02` (OBL-S4)
