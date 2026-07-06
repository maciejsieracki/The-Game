# CYWILIZACJE → EKONOMIA: v1.1 trybut + handel co turę

> **Status:** **→ SILNIK: GOTOWE** (EKO moduł + test 5/5)  
> **Blokuje:** akcje 5 (handel), 8 (trybut) — **w grze po F-D-V11**

---

## Co CYW przekazuje (✅ 2026-06-30)

- `gra/src/game/diplomacy-treaties.ts` — `tributeDeals()`, `ActiveDeal.ekonomia` (T1A payer/receiver/kwota)
- `gra/src/game/diplomacy-proposals.ts` — trybut/wasal w `deal.ekonomia` po akceptacji
- Handel T3A = `oneShotTrade: true` (bez ticku — rozliczenie jednorazowe w SILNIK/EKO)

---

## Co EKONOMIA ma zrobić

### 1. Kontrakt API (pure functions)

```typescript
// gra/src/game/diplomacy-economy.ts (propozycja — owner EKO)

export interface TributeDeal {
  payerOwnerId: number;
  receiverOwnerId: number;
  pieniadzePerTura: number;
  doTury: number | null; // null = bezterminowy wasal
}

export interface TradeDeal {
  fromOwnerId: number;
  toOwnerId: number;
  /** v1.1 one-shot lub per-turn — wg decyzji T3 */
  kind: 'once' | 'per_turn';
  payload: { pieniadze?: number; surowiec?: string; ilosc?: number };
  doTury?: number;
}

/** Wywołane z SILNIK na końcu tury gracza / AI. */
export function tickDiplomacyPayments(
  deals: readonly (TributeDeal | TradeDeal)[],
  treasury: { getPieniadze(ownerId: number): number; add(ownerId: number, delta: number): void },
  turn: number,
): { broken: string[]; messages: string[] }; // broken = id dealu zerwany (brak funduszy)
```

### 2. Reguły (propozycja T1A)

| Sytuacja | Efekt |
|----------|--------|
| Płatnik ma ≥ kwota | Odejmij z skarbca państwa, dodaj odbiorcy |
| Brak środków | Zwróć `broken`; SILNIK wywołuje CYW `zerwany_trybut` → casus belli / -Relacja |
| Wasal | ten sam mechanizm co trybut + flaga w traktacie |

### 3. Test

- `tools/diplomacy-economy-test.cjs` — 3 scenariusze: OK, bankrupt, expiry.

---

## DoD

- [x] Moduł bez importu UI/main
- [x] Handoff do SILNIK: `EKONOMIA-do-SILNIK_v1.1-diplomacy-tick.md`
- [x] Test `diplomacy-economy-test.cjs` **5/5**
- [x] Meldunek `EKONOMIA-DO-MASTERA.md` + `→ SILNIK: GOTOWE`

**NIE ruszaj:** `diplomacy.ts` (CYW), `main.ts` (SILNIK)
