# MASTER → INTEGRATOR F: D16-D17 wiring (3 linie main.ts)

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **ZAMKNIĘTE** (promocja 2026-07-01) |
| **Batch** | `D16-D17-WIRING` |
| **ACK** | `EKONOMIA-do-MASTER_D16-D17-START-GOTOWE.md` · testy B 21+34+28 |
| **Priorytet** | **P1** (po P0 A-R7 jeśli kanon bez rebuild) |

---

## AC

Wpięcie wg `EKONOMIA-do-INTEGRATOR_d16-main-wiring.md`:

1. `lawInput.population` w `evaluateOrderFromBreakdown`
2. `religionHappiness(..., hasSwiatynia)` z `builtIds`
3. `computeCityHealthBreakdown(..., { city, map })` w `getCityHealth`

Backup: `main.ts.bak-INTEGRATOR-D16-D17-2026-07-01`

---

## Bramka

```
node gra/tools/society-breakdown-test.cjs
node gra/tools/wire-ekonomia-test.cjs
node gra/tools/smoke.cjs
npx vite build --outDir $env:TEMP\civ-dist
```

Publish **ROBOCZA only** → meldunek `F-do-MASTER_D16-D17-wiring-2026-07-01.md` · `→ MASTER: GOTOWE-ROBOCZA`

---

## DoD playtest (Maciej jutro)

- T1 pop=1: brak „Bunt skrajny”
- Nad rzeką: „Rzeka +2”, bez „Brak wody”
