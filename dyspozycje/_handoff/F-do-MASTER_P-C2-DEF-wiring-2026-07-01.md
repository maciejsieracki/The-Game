# F → MASTER: batch P-C2-DEF wiring

| Pole | Wartość |
|------|---------|
| **Status** | **→ MASTER: GOTOWE-ROBOCZA** |
| **Data** | 2026-07-01 |
| **Batch** | P-C2-DEF-WIRING |
| **Warstwa** | 🟡 cross (main.ts only) |
| **Backup** | `gra/src/main.ts.bak-INTEGRATOR-P-C2-DEF-2026-07-01` |
| **Poprzedni ROBOCZA md5** | `7edba9cadfb011fd6c540fbc6bdedb72` |
| **Nowy ROBOCZA md5** | `d5e0f62de9d287be23d444d1f23e0e7b` |

---

## Wpięcie (main.ts)

### P-C2-DEF A — pkt Mocy z M wroga (nie licznik wygranych)

- `battleWinsByOwner` → `battlePowerPtsByOwner` (Map sumy pkt).
- Import `battlePowerPointsFromDefeatedEnemy` z `power-objective.ts`.
- `sumRosterFieldM()` — suma `armyFieldPower` składu przed walką.
- `applyMapBattleOutcome`: **przed** `applyPostBattleMap` — zwycięzca dostaje `floor(M_pole przegranego)`; remis = 0 pkt.
- Usunięto `recordBattleWin` (+1 count).
- `buildObjectivePowerForOwner`: `bitwyPktSum` z mapy pkt, `wygraneBitwy: 0`.
- Save/load: `meta.battlePowerPtsByOwner: Array<[number, number]>`.

---

## Testy (PASS)

| Test | Wynik |
|------|-------|
| `power-objective-test.cjs` | 12/12 |
| `diplomacy-test.cjs` | 143/143 |
| `smoke.cjs` | OK |
| `vite build --outDir $TEMP\civ-dist` | OK |

---

## Pliki zmienione

| Plik | Zmiana |
|------|--------|
| `gra/src/main.ts` | P-C2-DEF wiring (pkt M wroga) |
| `gra/src/main.ts.bak-INTEGRATOR-P-C2-DEF-2026-07-01` | backup pre-batch |
| `gra-robocza/*` | publish ROBOCZA snapshot |

---

## Co sprawdzić po wpięciu (playtest)

1. Wygrana potyczka: overlay Moc — składnik „Wygrane bitwy" rośnie o ~M wroga (nie +1).
2. Remis: brak przyrostu pkt bitew.
3. Respekt dyplomacji: bez regresji (test 143/143).

---

## Blokery

— (brak)

---

## → MASTER: GOTOWE-ROBOCZA

**md5:** `d5e0f62de9d287be23d444d1f23e0e7b`  
**Start:** `gra-robocza/START.html`  
**Manifest:** `gra-robocza/ROBOCZA-MANIFEST.json`
