# MASTER → INTEGRATOR F: D18 verify + ROBOCZA

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **ZAMKNIĘTE** (verify 2026-07-02) |
| **Batch** | `D18-BALANS-TRUDNOSC` |
| **ACK** | `EKONOMIA-do-MASTER_D18-BALANS-GOTOWE.md` · lane B wpisał main.ts |

---

## AC

Review diff wg `EKONOMIA-do-INTEGRATOR_d18-main-wiring.md` — brak kolizji.

Bramka:
```
node tools/society-breakdown-test.cjs
node tools/wealth-test.cjs
node tools/culture-religion-test.cjs
node tools/smoke.cjs
npx vite build --outDir $env:TEMP\civ-dist
.\tools\publish-robocza-snapshot.ps1
```

Meldunek: `F-do-MASTER_D18-wiring-2026-07-02.md` → GOTOWE-ROBOCZA

**NIE** nowe linie — tylko verify + publish.
