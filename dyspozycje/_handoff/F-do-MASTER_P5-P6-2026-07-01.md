# F → MASTER: batch P5+P6 dyplomacja

| Pole | Wartość |
|------|---------|
| **Status** | **→ MASTER: GOTOWE-ROBOCZA** |
| **Data** | 2026-07-01 |
| **Batch** | P5-PRZEMARSZ + P6-BASKET-TRANSFER |
| **Warstwa** | 🟡 cross |
| **Backup** | `gra/src/main.ts.bak-INTEGRATOR-P5-P6-2026-07-01` |
| **Poprzedni ROBOCZA md5** | `7db1561668bdd9df18a010af28fe46c6` |
| **Nowy ROBOCZA md5** | `8f3c6004959c2308588c33cb47d956c4` |

---

## Wpięcie (main.ts)

### P5 — endTurn przemarsz

- `collectUnauthorizedBorderPairs` + `enrichBorderMarchPairsWithMilitary` + `dedupeBorderMarchPairs`
- `applyUnauthorizedBorderPenalties` w `runDiplomacyTurnTick()` (koniec tury gracza)
- `showHintMessage` przy `penalizedPairs > 0`

### P6 — transferBasketItems

- `tech` → `grantTechToOwner` + sync `player.zbadane` / `aiResearchDone`
- `surowiec_boolean` → `grantSurowiecBooleanAccess`
- `jednostka` → `spawnTransferredUnit` + `syncUnitsRender`

### Poprawka proposals

- `diplomacy-proposals.ts` case `tech`: **Rel ≥ progHandelRelacja (100)**, nie `progWymianaTechZaufanie` 70

### Save/load

- `meta.surowiecBooleanGrants` ↔ `basketTransferCtx.surowiecBooleanGrants`
- `syncBasketResearchFromEngine()` przy load / new game / transfer

---

## Testy (PASS)

| Test | Wynik |
|------|-------|
| `diplomacy-border-march-test.cjs` | 9/9 |
| `border-march-scan-test.cjs` | 11/11 |
| `diplomacy-basket-transfer-test.cjs` | 8/8 |
| `diplomacy-unit-transfer-test.cjs` | 13/13 |
| `diplomacy-test.cjs` | 143/143 |
| `diplomacy-proposal-test.cjs` | 31/31 |
| `smoke.cjs` | OK |
| `vite build --outDir $TEMP\civ-dist` | OK |

---

## Pliki zmienione

| Plik | Zmiana |
|------|--------|
| `gra/src/main.ts` | P5 hook, P6 transfer, save/load grants, importy |
| `gra/src/main.ts.bak-INTEGRATOR-P5-P6-2026-07-01` | backup |
| `gra/src/game/diplomacy-proposals.ts` | tech: Rel≥100 (W5-A) |
| `gra-robocza/*` | publish ROBOCZA snapshot |
| `Gra-podglad-ROBOCZA.html` | zaktualizowany bundle |

---

## Co sprawdzić po wpięciu (playtest Master)

1. Jednostka gracza na obcym terytorium bez traktatu → koniec tury −5 Zauf.
2. Sojusz / otwarte granice → brak kary.
3. Deal z tech w koszyku → tech w `zbadane` odbiorcy.
4. Deal z surowiec_boolean → grant aktywny w save.
5. Deal z jednostką → spawn u stolicy odbiorcy.

---

## Blokery

— (brak)

---

## → MASTER: GOTOWE-ROBOCZA

**md5:** `8f3c6004959c2308588c33cb47d956c4`  
**Start:** `gra-robocza/START.html`  
**Manifest:** `gra-robocza/ROBOCZA-MANIFEST.json`
