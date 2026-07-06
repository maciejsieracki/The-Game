# MASTER → INTEGRATOR F: P-C2-DEF wiring (main.ts + save)

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **ZAMKNIĘTE** (promocja 2026-07-01) |
| **Batch** | `P-C2-DEF-WIRING` |
| **ACK** | `EKONOMIA-do-INTEGRATOR_p-c2-def-a.md` · test 12/12 |
| **Priorytet** | **P1** (po D16-D17 w kanonie) |

---

## AC

Wpięcie wg `EKONOMIA-do-INTEGRATOR_p-c2-def-a.md`:

1. `battlePowerPtsByOwner` zamiast `battleWinsByOwner`
2. `applyMapBattleOutcome` — suma M wroga przed stratami → `battlePowerPointsFromDefeatedEnemy`
3. `buildObjectivePowerForOwner` — `bitwyPktSum` z mapy pkt
4. Save/load: `meta.battlePowerPtsByOwner`

Backup: `main.ts.bak-INTEGRATOR-P-C2-DEF-2026-07-01`

---

## Bramka

```
node tools/power-objective-test.cjs
node tools/diplomacy-test.cjs
node tools/smoke.cjs
npx vite build --outDir $env:TEMP\civ-dist
.\tools\publish-robocza-snapshot.ps1
```

Meldunek: `F-do-MASTER_P-C2-DEF-wiring-2026-07-01.md` → **→ MASTER: GOTOWE-ROBOCZA**

---

## DoD

- Wygrana potyczka: pkt += floor(M_pole przegranego)
- Remis: 0 pkt
- Bez regresji dyplomacji Respekt
