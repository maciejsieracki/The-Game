# P-C2-DEF — co liczy się jako „wygrana" dla pkt Mocy

| Pole | Wartość |
|------|---------|
| **ID** | P-C2-DEF |
| **Decyzja Macieja** | **A** (2026-07-01) |
| **Status** | **ZAMKNIĘTE** |
| **Powiązane** | P-C2=B · P-ARMIA=B · `P-A-power-kanon.md` |

---

## Ustalenie Macieja (opcja A)

1. **Wygrana** = rozstrzygnięta potyczka na mapie (atakujący lub obrońca wygrywa; **remis = 0 pkt**).
2. **Miara siły pokonanego** = **suma M_pole** armii **przegranego składu tuż przed walką** (`unit-power.ts` / `armyFieldPower`).
3. **Bez bonusu underdog** — czy Twoja armia była mniejsza czy większa **nie zmienia** wzoru; liczy się tylko M wroga.
4. **Pkt do Mocy** = `floor(M_pole_pokonanego)` kumulowane po każdej wygranej (składnik „Wygrane bitwy", coeff **1**).
5. **Kalibracja:** 10 bitew × ~25 M wroga ≈ **250 pkt** (~8% bazy 3020) — jak dawniej flat 10×25.

---

## Kod (lane B — gotowe)

| Co | Gdzie |
|----|--------|
| Model + formuła | `power-objective.ts` · `loadBattlePowerModel()` · `battlePowerPointsFromDefeatedEnemy()` |
| Parametry | `power-params.json` → `opcje.bitwa_power_model` = `enemy_m_pre_battle` |
| Testy | `power-objective-test.cjs` |

---

## Integrator F (🟡 main.ts)

Handoff: `dyspozycje/_handoff/EKONOMIA-do-INTEGRATOR_p-c2-def-a.md`

- Zamień `battleWinsByOwner` (count) → `battlePowerPtsByOwner` (suma M wroga).
- W `applyMapBattleOutcome`: **przed** stratami — `enemyM = sumRosterFieldM(loserRoster)` → `+= battlePowerPointsFromDefeatedEnemy(enemyM)`.
- `buildObjectivePowerForOwner`: `bitwyPktSum: battlePowerPtsByOwner.get(oid) ?? 0`.
- Save/load: `meta.battlePowerPtsByOwner`.

---

*Maciej: A · Grupa B wdrożyło moduł · wpięcie silnika = Integrator.*
