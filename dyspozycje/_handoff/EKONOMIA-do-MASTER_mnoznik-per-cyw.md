# HANDOFF: EKONOMIA → MASTER — mnoznikHandelPieniadz per cywilizacja (RDY-11)

**Data:** 2026-06-26. **Lane:** EKONOMIA. **Status:** GOTOWE (kod + testy); wpięcie w grze wymaga 1 linii w `main.ts`.

---

## Co zrobiono

- `economy.ts`: pole `ctx.walutaMnoznikOverride` + helper `mnoznikHandelPieniadzForCiv(civKey, civs, fallback)`.
- Efekt 1 (Waluta): `handelNetto *= walutaMnoznikOverride ?? params.walutaMnoznik` — cała pula przed podziałem (zgodnie z decyzją Macieja 2026-06-26).
- `turn-economy.ts`: nowy opcjonalny param `ownerCivByOwnerId: ReadonlyMap<number, string>` (domyślnie pusty → zachowanie jak dotąd, płaskie x2).
- `resources.json`: dodano surowce **Żelazo** (surowy) i **Stal** (przetworzony) — decyzja 1A Zelazo GO.
- Testy: `currency-test.cjs` rozszerzony (+5 asercji per-cyw).

## Wpięcie w main.ts (MASTER)

W wywołaniu `advanceCityEconomy(...)` dodaj mapę nacji:

```typescript
const ownerCivMap = new Map<number, string>();
ownerCivMap.set(0, player.civType as string || 'grecy');
for (const [oid, civ] of aiOwnerCivMap) ownerCivMap.set(oid, civ);

const econ = advanceCityEconomy(
  cities, map, data, _menuDifficulty, econUnits,
  growthMultMap, cityBuilt, player.era, player.zbadane,
  ownerCivMap,  // <-- NOWY param (10.)
);
```

Wartości per-cyw już są w `civs.json` (`mnoznikHandelPieniadz`: 1.7–2.4, decyzja 5A).

## DoD

- [ ] Grecy (2.3) vs Zulusi (1.7) dają różny dochód z Handlu po Walucie (playtest / test integracyjny).
- [ ] `node tools/currency-test.cjs` — zielony.
- [ ] Brak regresji `logic-test.cjs`, `wire-ekonomia-test.cjs`.

## Nie ruszano

- Lazaret / `koszary-gate-test` — decyzja Macieja 2026-06-26: baseline-red, nie naprawiać.
- Wealth W1–W6 — czeka na D3.
- `main.ts` — lane EKONOMIA nie edytuje.
