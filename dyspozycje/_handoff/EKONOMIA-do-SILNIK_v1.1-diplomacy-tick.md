# EKONOMIA → SILNIK: v1.1 tick trybutu (T1A)

> **Status:** **→ SILNIK: GOTOWE** (moduł EKO dostarczony 2026-06-30)  
> **Zależność:** `activeDeals[]` w main.ts (batch F-D-V11)

---

## Moduł lane EKO ✅

Plik: `gra/src/game/diplomacy-economy.ts`

| Eksport | Rola |
|---------|------|
| `activeDealsToPaymentDeals(deals, turn)` | ActiveDeal[] → TributeDeal[] (pomija wygasłe, jednorazowe) |
| `tickDiplomacyPayments(deals, treasury, turn)` | T1A: transfer co turę; `broken[]` gdy brak ¤ |
| `applyOneShotGoldTransfer(from, to, amount, treasury)` | T3A handel / opłata granic / ultimatum |

Test: `tools/diplomacy-economy-test.cjs` — **5/5 PASS**

---

## Wpięcie w main.ts (SILNIK)

### 1. Import

```typescript
import {
  activeDealsToPaymentDeals,
  tickDiplomacyPayments,
  applyOneShotGoldTransfer,
} from './game/diplomacy-economy';
```

### 2. Treasury adapter (przykład)

```typescript
const diploTreasury = {
  getPieniadze: (ownerId: number) =>
    ownerId === 0 ? player.pieniadz : (aiPlayers.get(ownerId)?.pieniadz ?? 0),
  add: (ownerId: number, delta: number) => {
    if (ownerId === 0) player.pieniadz += delta;
    else { const ai = aiPlayers.get(ownerId); if (ai) ai.pieniadz += delta; }
  },
};
```

### 3. endTurn — po turze każdego gracza (lub raz globalnie)

```typescript
const payDeals = activeDealsToPaymentDeals(activeDeals, currentTurn);
const { broken, messages } = tickDiplomacyPayments(payDeals, diploTreasury, currentTurn);
for (const id of broken) {
  activeDeals = removeTreatiesById(activeDeals, [id]);
  // applyDiplomaticEvent(..., 'trybut_odmowa' / zerwany pakt) — patrz CYW handoff
}
```

### 4. Po akceptacji propozycji (one-shot)

```typescript
if (result.oneShotTrade && payload.goldOnce) {
  applyOneShotGoldTransfer(0, ownerId, payload.goldOnce, diploTreasury);
}
```

---

## DoD SILNIK

- [ ] Tick trybutu co turę; bankrupt → zerwanie dealu
- [ ] One-shot gold przy handlu T3A
- [ ] Bramka: diplomacy-economy-test 4/4 + treaties + proposal

**NIE ruszaj:** `diplomacy-economy.ts` (EKO)
