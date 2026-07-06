# UNITS + SILNIK — głód wojska −8% HP (B5-Q1)

| Pole | Wartość |
|------|---------|
| **Status** | **→ SILNIK: GOTOWE** (moduł lane gotowy) |
| **Decyzja** | Maciej Q1 hybryda — zapasy państwa ujemne → −8% max HP/turę |
| **Moduł lane** | `gra/src/game/army-starvation.ts` |
| **Handoff główny** | `EKONOMIA+UI-do-SILNIK_PILNE-luki-2026-06-27.md` §4 |

---

## Co dostarcza lane

```typescript
applyArmyStarvationHpLoss(units, ownerId, hpFrac, getMaxHp) → { destroyedIds, damagedCount }
```

- Inicjalizuje `hp`/`hpMax` na jednostce mapy przy pierwszym głodzie.
- `hpFrac` z `buildEmpireFoodParams(...).glodWojskaHpFrac` (default 0.08).

---

## Co robi SILNIK

1. Wywołać po `advanceEmpireFood` gdy `isArmyStarving(ownerId)`.
2. Usunąć jednostki z `destroyedIds` z tablicy `units` + `unitRenderer.sync`.
3. (Opcjonalnie v1.1) save/load `hp`/`hpMax` na `RuntimeUnit`.

---

## DoD

- [ ] Zapasy państwa < 0 przez 3 tury → widoczny spadek HP / utrata jednostki
- [ ] Hint HUD + opcjonalny komunikat przy utracie jednostki
- [ ] Tylko jednostki `ownerId === gracz` (AI analogicznie w pętli ownerIds)

**Flaga:** **→ SILNIK: GOTOWE**
