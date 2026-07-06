# EKONOMIA + UI + CYW → SILNIK: v1.1 dyplomacja — batch integracji

> **Status:** **→ SILNIK: GOTOWE DO WPIĘCIA** (2026-06-30)  
> **ID kolejki F:** `SILNIK-D-V11` (po `SILNIK-D-BONUS-C` lub równolegle)

---

## Podsumowanie — co lane dostarczyły

| Lane | Pliki | Testy |
|------|-------|-------|
| **CYW** | `diplomacy-treaties.ts`, `diplomacy-proposals.ts` | treaties 7/7 · proposal 15/15 |
| **EKO** | `diplomacy-economy.ts` | economy 4/4 |
| **UI** | `diplomacyNegotiationModal.ts`, `diplomacyProposalBanner.ts`, `diplomacyAudience.ts` | manual |

Handoffy szczegółowe:
- `CYWILIZACJE-do-SILNIK_v1.1-traktaty-save-load.md`
- `EKONOMIA-do-SILNIK_v1.1-diplomacy-tick.md`
- `UI-do-SILNIK_v1.1-diplomacy-negocjacje.md`

---

## Batch F-D-V11 (1–3 commity max)

### V11-1 — storage + audiencja

1. `let activeDeals: ActiveDeal[] = []`
2. `applyAudienceAction(oid, actionId, payload?)` — evaluateProposal + banner + addTreaty
3. `getNegotiationContext` w showDiplomacyAudience
4. Odblokuj karty 2–9,12 (warunki relacji)
5. Wojna → `treatiesBrokenByWar` + removeTreatiesById + zlamany_pakt

### V11-2 — endTurn + save/load

6. `expireTreaties(activeDeals, turn)`
7. `tickDiplomacyPayments(activeDealsToPaymentDeals(...))` — bankrupt → zerwij
8. Save meta: `diplomacyDeals: ActiveDeal[]`
9. Load: odtwórz + sync status relacji

### V11-3 — sojusze T2 + AI pending

10. `allianceObligations` przy ataku / wypowiedzeniu wojny
11. `decideAIDiplomacy` → `aiCommandToPendingProposal` → `showDiplomacyPendingModal`

---

## Bramka przed kanonem

```powershell
node tools/diplomacy-treaties-test.cjs
node tools/diplomacy-proposal-test.cjs
node tools/diplomacy-economy-test.cjs
node tools/diplomacy-test.cjs
```

Wszystkie ZIELONE + smoke OK → Opus review → kanon.

---

## Decyzje Macieja (zamknięte)

T1A trybut ze skarbca · T2 dwa sojusze · T3A handel jednorazowy · T4B sprint  
→ `docs/decyzje/D3-v1.1-MACIEJ-2026-06-30.md`

**Backup przed batch:** `main.ts.bak-SILNIK-D-V11-<data>`
