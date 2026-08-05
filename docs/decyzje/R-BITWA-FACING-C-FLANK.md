# BITWA-FACING=B — ECHO: C-FLANK już wdrożone (2026-08-05)

**Decyzja:** BITWA-FACING=B — gracz ustawia kierunek natarcia FRONT / BOK / TYŁ w fazie rozstawiania.  
**Audyt:** kompletne wdrożenie C-FLANK w `gra/src/battle/battleScene.ts` — **bez** wskaźnika ring (opcja A).

## Stan: JUŻ WDROŻONE (+ minimalny replay)

| Kryterium | Status | Dowód |
|-----------|--------|-------|
| Dropdown deploy „Kierunek natarcia” | ✅ | Toolbar deploy, popup Front/Bok/Tył (`_makeDeployToolbarDropdown('direction')`, ~11211) |
| Zakres jednostka / grupa / armia | ✅ | `_applyDeployAttackDirection` → `_resolveDeployFormationTargets` (ten sam zakres co Formacja/Konnica) |
| `attackDirection` na jednostce + meta grupy | ✅ | `RuntimeBattleUnit.attackDirection`, `GroupMeta.attackDirection` |
| Auto-play honoruje kierunek | ✅ | `desiredHitForDirection` w `_advanceStep` / `_cavalryAction` / `_pickMeleeTarget` |
| Domyślne `front` = zero regresji | ✅ | Wszystkie spawny `attackDirection: 'front'` |
| Powtórka bitwy (replay) | ✅ FIX 2026-08-05 | `_deployAttackDirSnapshot` + `_restoreDeployAttackDirSnapshot` obok snapshotu grup |

## Minimalny fix w tej paczce

- **Replay:** kierunek natarcia nie był zapisywany przy „Rozegraj ponownie” — dodany snapshot analogiczny do R-BITWA-POWTORKA-I (grupy).
- **UX toolbar:** `_syncDeployToolbarFromSelection` odświeża chip kierunku z meta grupy / zaznaczonej jednostki.

**Nie zmieniano:** logiki manewru C-FLANK, ring UI, balans facing bonusów.

## Powiązane

- SOLO lista: `docs/decyzje/R-SOLO-ABC.md`
- Grupy replay: R-BITWA-POWTORKA-I w `battleScene.ts`
