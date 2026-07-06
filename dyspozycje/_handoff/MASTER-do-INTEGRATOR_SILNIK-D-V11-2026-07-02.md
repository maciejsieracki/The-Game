# MASTER → INTEGRATOR F: SILNIK-D-V11 (D3 v1.1 wiring)

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **DONE** — meldunek `F-do-MASTER_SILNIK-D-V11-2026-07-02.md` |
| **Data** | 2026-07-02 |
| **Trigger Macieja** | kolejka Master #3 · audyt `MASTER-do-MASTER_D3-E2-audit-2026-07-02.md` |
| **Lane D** | moduły ✅ · testy treaties 9/9 · economy 6/6 |

---

## Zakres (main.ts only — batche 1–3 scalone)

### 1. Sojusze T2 — `allianceObligationsForWarDeclaration`

- Import z `diplomacy-treaties.ts`
- Zamienić wywołanie `allianceObligations(..., declared_war)` → `allianceObligationsForWarDeclaration(deals, attacker, victim)`
- AC: sojusznik **defensywny ofiary** wchodzi do wojny z agresorem
- AC: AI-sojusznik odmawia → `treatiesBrokenByRefusal` + `removeTreatiesById`

### 2. Trybut T1A — casus belli

- W `runDiplomacyTurnTick`: przed usunięciem dealów → `tributeBreakPairsFromDeals()` (import z `diplomacy-economy.ts`)
- AC: `applyDiplomaticEvent(..., 'trybut_odmowa')` lub casus na parze płatnik↔odbiorca
- AC: hint graczowi gdy dotyczy gracza

### 3. Save/load — `hydrateActiveDeals`

- Load (~L8760): `activeDeals = hydrateActiveDeals(savedDeals)` zamiast `.slice()`

---

## Bramka

```
node tools/diplomacy-treaties-test.cjs
node tools/diplomacy-economy-test.cjs
node tools/diplomacy-proposal-test.cjs
node tools/diplomacy-test.cjs
node tools/smoke.cjs
npx vite build --outDir $env:TEMP\civ-dist
.\tools\publish-robocza-snapshot.ps1
```

---

## Meldunek

`F-do-MASTER_SILNIK-D-V11-wiring-2026-07-02.md` → GOTOWE-ROBOCZA

**NIE** promocja kanon bez review Master (md5 bazowy: `2fc96381…`).

---

## E2-PARAMS (informacyjnie)

Audyt: **~97%** wdrożone · brak batcha F poza opcjonalnym smoke kreatora (priorytet niski).
