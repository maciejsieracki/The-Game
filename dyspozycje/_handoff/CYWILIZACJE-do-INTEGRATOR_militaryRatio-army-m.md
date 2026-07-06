# CYWILIZACJE → INTEGRATOR: militaryRatio na sumie M (nie headcount)

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **GOTOWE** — kontrakt + testy · **wpięcie czeka Integrator** |
| **Batch** | `DIP-MILRATIO-M-v1` |
| **Data** | 2026-06-30 |
| **Flaga** | GOTOWE |

---

## Kontekst

Power armii = **suma M_pole** (wpięte). **Respekt** już z objective Power.

**militaryRatio** w AI dyplomacji i propozycjach nadal = **liczba tokenów** — niespójne z M.

---

## Kontrakt (Grupa D dostarczyła)

**Plik:** `gra/src/game/diplomacy.ts`

```typescript
export function computeMilitaryRatioFromArmyM(
  armyMSelf: number,
  armyMPartner: number,
): number
```

- `> 1` — self silniejszy · `< 1` — self słabszy
- partner = 0, self > 0 → `2` · obie 0 → `1`

**Testy:** `diplomacy-test.cjs` sekcja 13 (+5 asercji)

---

## Co Integrator ma wpiąć (`main.ts`)

Import: `computeMilitaryRatioFromArmyM` z `./game/diplomacy`  
(`sumArmyMForOwner` już istnieje w closure)

### 1. `buildProposalEvalContext` (~3369)

**Było:**
```typescript
const proposerUnits = units.filter(u => u.ownerId === proposerId).length;
const responderUnits = units.filter(u => u.ownerId === responderId).length;
const militaryRatio = responderUnits > 0
  ? proposerUnits / responderUnits
  : (proposerUnits > 0 ? 2 : 1);
```

**Ma być:**
```typescript
const militaryRatio = computeMilitaryRatioFromArmyM(
  sumArmyMForOwner(proposerId),
  sumArmyMForOwner(responderId),
);
```

### 2. Pętla AI dyplomacji (~6452)

**Było:** `aiUnitCount / playerUnitCount`

**Ma być:**
```typescript
const militaryRatio = computeMilitaryRatioFromArmyM(
  sumArmyMForOwner(ownerId),
  sumArmyMForOwner(0),
);
```

(Uwaga: perspektywa AI — self = AI ownerId, partner = gracz 0)

---

## DoD

- [ ] Podmiana 2 miejsc w `main.ts`
- [ ] `node tools/diplomacy-test.cjs` — 140/140 (lub aktualna liczba)
- [ ] `node tools/ai-test.cjs` — zielone
- [ ] Meldunek Integrator → `CYWILIZACJE-DO-MASTERA.md`

---

## Nie ruszać

- `computeRespekt` — bez zmian
- `units.json` / `unit-power.ts` — UNITS
